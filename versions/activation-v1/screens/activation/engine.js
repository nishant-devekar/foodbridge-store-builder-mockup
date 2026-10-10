/* Store Activation discovery — the rules, with no screen in them (2026-10-10, v1; products sheet: addendum-005).
   Pure functions over one plain state object, so the browser app and tests/engine.test.js run the same code.
   This is the proto state machine SSOT-1 and the workflow SSOT-5 will be derived from. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ActivationEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // The six steps the owner sees. Weights give the team's 0–100 score; the owner only ever sees "n of 6".
  var STEPS = [
    { id: "items",     title: "Add your products",       time: "2 min",  weight: 20, needs: [] },
    { id: "customers", title: "Add your customers",      time: "30 sec", weight: 20, needs: [] },
    { id: "order",     title: "Take your first order",   time: "1 min",  weight: 20, needs: ["items", "customers"] },
    { id: "deliver",   title: "Deliver it",              time: "1 min",  weight: 15, needs: ["order"] },
    { id: "paid",      title: "Get paid",                time: "1 min",  weight: 15, needs: ["order"] },
    { id: "plan",      title: "Daily plan on WhatsApp",  time: "30 sec", weight: 10, needs: [] }
  ];

  function initialState() {
    return {
      v: 3,
      // sheet: rows not saved yet (the check-and-save sheet); saved: the store's products;
      // job: the processing running in the background, whichever way the products came in (addendum-006)
      items: { sheet: [], saved: [], job: null, nextId: 1 },
      customers: { done: false, ids: [] },
      order: null,                                   // { id, customerId, lines: [{itemId, qty, price}], payment, sendInvoice, total }
      delivery: { status: "none", mode: null, driverId: null },   // none | sent | delivered
      payment: { status: "none", received: false },   // none | link | cash
      plan: { on: false, morning: "08:30", evening: "20:00" },
      flash: null
    };
  }

  function isDone(s, id) {
    switch (id) {
      case "items": return s.items.saved.length > 0;
      case "customers": return !!s.customers.done;
      case "order": return !!s.order;
      case "deliver": return s.delivery.status !== "none";
      case "paid": return s.payment.status !== "none";
      case "plan": return !!s.plan.on;
    }
    return false;
  }

  function step(id) { for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return STEPS[i]; return null; }
  function stepNumber(id) { for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return i + 1; return 0; }

  function isLocked(s, id) {
    var st = step(id);
    return st.needs.some(function (n) { return !isDone(s, n); });
  }

  /** A step the owner started that is now waiting on processing (files read, Zoho fetched, speech understood…). */
  function isWaiting(s, id) {
    return id === "items" && !!s.items.job && !isDone(s, "items");
  }

  function lockNote(s, id) {
    if (id === "order") return "after items and customers";
    if (id === "deliver" || id === "paid") return "after your first order";
    return "";
  }

  function progress(s) {
    var done = STEPS.filter(function (st) { return isDone(s, st.id); });
    return {
      done: done.length,
      total: STEPS.length,
      score: done.reduce(function (a, st) { return a + st.weight; }, 0),   // the team's number
      percent: Math.round((done.length / STEPS.length) * 100)               // what the ring fills to
    };
  }

  /** Move time-driven states on: a finished processing job's rows join the sheet. */
  function tick(s, now) {
    var j = s.items.job;
    if (j && now - j.startedAt >= j.ms) {
      s.items.sheet = s.items.sheet.concat(j.rows);
      s.items.job = null;
      return true;
    }
    return false;
  }

  // Every way in runs the same job: choose → processing → check and save. Processing is the same for every way: these
  // stages stand for the background calls the product will make (receive, read, find, check), reported as they happen.
  var STAGES = ["Receiving your products", "Reading", "Finding products", "Checking for problems"];
  /** Where a job is at `now`: how far (0–1), which stage, how many products found so far. */
  function jobProgress(j, now) {
    var f = Math.max(0, Math.min(1, (now - j.startedAt) / j.ms)), stages = STAGES;
    return { fraction: f, stage: Math.min(stages.length - 1, Math.floor(f * stages.length)), stages: stages, found: Math.floor(j.rows.length * f), done: f >= 1 };
  }

  /** The one next step the page suggests: the first open, unlocked, not-waiting step, in order.
      Products waiting in the sheet come first, since the owner is the only one who can save them. */
  function nextStep(s) {
    if (!isDone(s, "items") && !s.items.job && s.items.sheet.length) return { id: "items", mode: "review" };
    for (var i = 0; i < STEPS.length; i++) {
      var id = STEPS[i].id;
      if (isDone(s, id) || isLocked(s, id) || isWaiting(s, id)) continue;
      return { id: id, mode: "start" };
    }
    if (STEPS.some(function (st) { return isWaiting(s, st.id); })) return { id: "items", mode: "waiting" };
    return null;   // all six done
  }

  // ---------- the products sheet (addenda 005, 014) ----------
  // A product is sold in at least two units: a smallest unit (packet, pcs, kg, bottle…) and a bigger one that holds a
  // whole number of them (1 carton = 120 packets). The rate is quoted for one of the two; the other is derived. Every
  // price carries its GST rate and whether the rate includes GST — which a rate list states once, for the whole list.
  var COLS = [
    { key: "name", label: "Product", w: 190 }, { key: "baseUnit", label: "Unit", w: 84 }, { key: "bigUnit", label: "Big unit", w: 90 },
    { key: "perBig", label: "Units in big", w: 96, num: true }, { key: "rate", label: "Rate ₹", w: 84, num: true }, { key: "rateUnit", label: "Rate per", w: 84 },
    { key: "gst", label: "GST %", w: 66, num: true }, { key: "taxIncl", label: "GST in rate", w: 100 }, { key: "mrp", label: "MRP ₹ / unit", w: 100, num: true },
    { key: "hsn", label: "HSN", w: 74 }, { key: "barcode", label: "Barcode", w: 128 }, { key: "category", label: "Category", w: 150 },
    { key: "from", label: "From", w: 150, readOnly: true }
  ];
  var GST_SLABS = [0, 5, 18, 40];   // since 22 Sep 2025
  var BASES = ["packet", "pcs", "kg", "bottle"], BIGS = ["carton", "box", "bag", "case"];

  function blank(v) { return v == null || String(v).trim() === ""; }
  /** "₹1,860" → 1860; anything that is not a plain positive number → NaN. */
  function num(v) {
    if (typeof v === "number") return v;
    var t = String(v == null ? "" : v).replace(/[₹,\s]|rs\.?/gi, "");
    return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
  }
  /** "incl" / "included" / "yes" → true; "extra" / "excl" / "+ GST" / "no" → false; anything else → null (not said). */
  function taxFlag(v) {
    if (v === true || v === false) return v;
    var t = String(v == null ? "" : v).trim().toLowerCase();
    if (/\b(incl|included|inclusive)\b|^(yes|y)$/.test(t)) return true;
    if (/\b(extra|excl|excluded|exclusive)\b|\+|^(no|n)$/.test(t)) return false;
    return null;
  }
  function unitKey(u) { return String(u || "").trim().toLowerCase().replace(/(es|s)$/, ""); }
  function plural(u) { u = String(u || ""); return /s$/.test(u) ? u : /(x|ch|sh)$/.test(u) ? u + "es" : u === "kg" ? u : u + "s"; }
  /** The same product written two ways: "Glucose bisc. 100 gm" = "Glucose biscuit 100g". */
  function normName(t) {
    return String(t || "").toLowerCase()
      .replace(/\bbisc\b\.?/g, "biscuit").replace(/(\d)\s*(gms?|grams?|gram)\b/g, "$1g").replace(/(\d)\s*(kgs?|kilo)\b/g, "$1kg")
      .replace(/(\d)\s*(ltrs?|litres?|liters?|l)\b/g, "$1l").replace(/(\d)\s*(ml)\b/g, "$1ml")
      .replace(/[^a-z0-9]+/g, " ").trim();
  }
  function isEmptyRow(r) { return ["name", "baseUnit", "bigUnit", "perBig", "rate", "mrp", "gst", "hsn"].every(function (k) { return blank(r[k]); }); }
  /** Which of the two units the rate is for: "big", "base", or null when it names neither. */
  function rateSide(r) {
    var u = unitKey(r.rateUnit); if (!u) return null;
    if (u === unitKey(r.bigUnit)) return "big";
    if (u === unitKey(r.baseUnit)) return "base";
    return null;
  }
  /** Both prices, the quoted one and the derived one: { big, base } (rupees), or null without a readable rate. */
  function prices(r) {
    var rate = num(r.rate), per = num(r.perBig), side = rateSide(r);
    if (!(rate > 0) || !side) return null;
    var round = function (x) { return Math.round(x * 100) / 100; };
    var ok = per >= 2 && per === Math.floor(per);
    return side === "big" ? { big: rate, base: ok ? round(rate / per) : null } : { base: rate, big: ok ? round(rate * per) : null };
  }

  /** Everything in one row that needs the owner: [{ col, msg, fixes: [{ label, value } | { label, action }], batch? }].
      Rows are named as the sheet numbers them: row 1 is the header, so the first product is row 2.
      `batch` marks a question asked once for the whole list (does the rate include GST?). */
  function rowIssues(row, rows, saved) {
    if (isEmptyRow(row)) return [];
    var out = [], h = row.hint || {};
    var opts = function (list, fmt) { var seen = {}; return (list || []).filter(function (v) { var k = String(v); if (seen[k]) return false; seen[k] = 1; return true; }).map(function (v) { return { label: fmt ? fmt(v) : String(v), value: String(v) }; }); };
    if (blank(row.name)) out.push({ col: "name", msg: "Product name missing", fixes: opts(h.name) });
    if (blank(row.baseUnit)) out.push({ col: "baseUnit", msg: "Smallest unit missing", fixes: opts((h.baseUnit || []).concat(BASES)) });
    if (blank(row.bigUnit)) out.push({ col: "bigUnit", msg: "Bigger unit missing", fixes: opts((h.bigUnit || []).concat(BIGS)) });
    else {
      var per = num(row.perBig);
      if (!(per >= 2 && per === Math.floor(per))) out.push({ col: "perBig", msg: "How many " + plural(row.baseUnit || "units") + " in a " + row.bigUnit + "?", fixes: opts(h.perBig) });
    }
    var hasRate = !blank(row.rate);
    if (hasRate && !(num(row.rate) > 0)) out.push({ col: "rate", msg: "Rate can't be read: “" + row.rate + "”", fixes: opts(h.rate, function (v) { return "₹" + v; }) });
    if (hasRate && !blank(row.bigUnit) && !blank(row.baseUnit) && !rateSide(row)) out.push({ col: "rateUnit", msg: "Rate per " + row.bigUnit + " or per " + row.baseUnit + "?", fixes: opts([row.bigUnit, row.baseUnit]) });
    if (blank(row.gst)) out.push({ col: "gst", msg: "GST rate missing", group: "gst", fixes: opts((h.gst || []).concat(["5", "18", "0", "40"]), function (v) { return v + " %"; }) });
    else if (GST_SLABS.indexOf(num(row.gst)) === -1) {
      var g = num(row.gst), near = isNaN(g) ? [5, 18] : GST_SLABS.slice().sort(function (a, b) { return Math.abs(a - g) - Math.abs(b - g) || a - b; }).slice(0, 2).sort(function (a, b) { return a - b; });
      out.push({ col: "gst", msg: "GST is 0, 5, 18 or 40 %", fixes: opts(near, function (v) { return v + " %"; }) });
    }
    if (hasRate && taxFlag(row.taxIncl) === null) out.push({ col: "taxIncl", msg: "Does the rate include GST?", batch: true, fixes: [{ label: "GST extra", value: "extra" }, { label: "GST included", value: "incl" }] });
    if (!blank(row.mrp) && !(num(row.mrp) > 0)) out.push({ col: "mrp", msg: "MRP is not a number", fixes: [{ label: "Clear it", value: "" }] });
    if (!blank(row.hsn) && !/^\d{4,8}$/.test(String(row.hsn).trim())) out.push({ col: "hsn", msg: "HSN is 4 to 8 digits", fixes: [{ label: "Clear it", value: "" }] });
    var first = duplicateOf(row, rows, saved);
    if (first) out.push({ col: "name", msg: rows.indexOf(first) === -1 ? "Already saved as “" + first.name + "”" : "Looks like row " + (rows.indexOf(first) + 2) + ", “" + first.name + "”", dup: first.id, fixes: [{ label: "Merge", action: "merge" }, { label: "Keep both", action: "keepboth" }] });
    return out;
  }
  /** The product this row repeats (same name, written either way): one already saved, or an earlier row of the sheet.
      Unless the owner kept both. */
  function duplicateOf(row, rows, saved) {
    if (row.keepBoth || blank(row.name)) return null;
    var k = normName(row.name), same = function (r) { return !isEmptyRow(r) && normName(r.name) === k; };
    var list = saved || [];
    for (var j = 0; j < list.length; j++) if (same(list[j])) return list[j];
    for (var i = 0; i < rows.length && rows[i] !== row; i++) if (same(rows[i])) return rows[i];
    return null;
  }
  /** total products; fix: products with something to fix (besides the list-wide GST question); ok: products with nothing
      to answer; noRate; taxAsk: products whose rate does not say whether it includes GST; questions: what the owner is
      asked, the GST-in-rate question and the missing-GST-rate question each counted once. */
  function sheetSummary(rows, saved) {
    var fix = 0, ok = 0, noRate = 0, empty = 0, taxAsk = 0, gstAsk = 0, q = 0;
    rows.forEach(function (r) {
      if (isEmptyRow(r)) { empty++; return; }
      var iss = rowIssues(r, rows, saved), own = iss.filter(function (i) { return !i.batch; });
      if (own.length) fix++;
      if (!iss.length) ok++;
      if (iss.length > own.length) taxAsk++;
      q += own.filter(function (i) { return !i.group; }).length;
      if (own.some(function (i) { return i.group === "gst"; })) gstAsk++;
      if (blank(r.rate)) noRate++;
    });
    return { total: rows.length - empty, fix: fix, ok: ok, noRate: noRate, taxAsk: taxAsk, questions: q + (taxAsk ? 1 : 0) + (gstAsk ? 1 : 0) };   // missing GST rates: one question, answered for all
  }
  /** Save splits the sheet: rows with nothing to answer are saved, the rest stay; empty rows go. */
  function splitForSave(rows, saved) {
    var good = [], broken = [];
    rows.forEach(function (r) { if (isEmptyRow(r)) return; (rowIssues(r, rows, saved).length ? broken : good).push(r); });
    return { good: good, broken: broken };
  }
  /** The list-wide answer: every row with a rate that does not say, now says. */
  function setTaxAll(rows, value) { rows.forEach(function (r) { if (!blank(r.rate) && taxFlag(r.taxIncl) === null) r.taxIncl = value; }); }
  /** Merge a duplicate into the product it repeats (saved, or an earlier row): fill its gaps from this one, drop this one. */
  function mergeRow(rows, row, saved) {
    var first = duplicateOf(row, rows, saved); if (!first) return rows;
    COLS.forEach(function (c) { if (!c.readOnly && blank(first[c.key]) && !blank(row[c.key])) first[c.key] = row[c.key]; });
    return rows.filter(function (r) { return r !== row; });
  }

  /** What the owner said (or typed), as rows: "Parle-G 100 gram carton of 96 packets 720 rupees per carton". The size
      (100 gram, 1 kg) stays in the name; the units are the words a trader uses for them. */
  var BIG_WORDS = ["carton", "box", "bag", "peti", "crate", "case", "bora", "dozen", "bundle", "tray"];
  var BASE_WORDS = ["packet", "pkt", "pcs", "piece", "bottle", "pouch", "jar", "can", "tin", "sachet", "bar"];
  function parseSpeech(text) {
    return String(text || "").split(/\s*(?:,|;|\n|\.\s|\band\b|\baur\b)\s*/i).map(function (chunk) {
      var c = " " + chunk.trim() + " ", rate = "", rateUnit = "", big = "", per = "", base = "";
      var m = c.match(/(?:₹|rs\.?|rupees?|rupaye)\s*(\d[\d,]*)/i) || c.match(/(\d[\d,]*)\s*(?:₹|rs\.?|rupees?|rupaye|rupay)\b/i);
      if (m) { rate = m[1].replace(/,/g, ""); c = c.replace(m[0], " "); }
      var pu = c.match(/\s(?:per|a|ek)\s+([a-z]+)\s/i);
      if (pu && rate) { rateUnit = pu[1].toLowerCase(); c = c.replace(pu[0], " "); }
      var word = function (list, s) { for (var i = 0; i < list.length; i++) { var re = new RegExp("\\s(" + list[i] + "(?:es|s)?)\\s", "i"), x = s.match(re); if (x) return { w: list[i], m: x }; } return null; };
      var b = word(BIG_WORDS, c);
      if (b) { big = b.w; var of = c.slice(b.m.index).match(/^\s\S+\s+of\s+(\d+)\s/i); c = c.replace(of ? of[0] : b.m[0], " "); if (of) per = of[1]; }
      var s = word(BASE_WORDS, c);
      if (s) { base = s.w === "pkt" ? "packet" : s.w === "piece" ? "pcs" : s.w; var n = c.slice(0, s.m.index + 1).match(/\s(\d+)\s*$/); c = c.replace(s.m[0], " "); if (n) { if (!per) per = n[1]; c = c.replace(new RegExp("\\s" + n[1] + "\\s+(?=\\s|$)"), " "); } }
      if (!rate) { var tail = c.match(/\s(\d{2,6})\s*$/); if (tail && big) { rate = tail[1]; c = c.slice(0, tail.index) + " "; } }
      if (rate && !rateUnit) rateUnit = big || base;
      var name = c.replace(/(\d)\s*(grams?|gram|gms?)\b/gi, "$1g").replace(/(\d)\s*(kilo|kgs?)\b/gi, "$1 kg").replace(/(\d)\s*(litres?|liters?|ltrs?)\b/gi, "$1 L")
        .replace(/\s+/g, " ").trim();
      if (!/[a-z]/i.test(name)) return null;   // a product has a name: numbers alone are not one
      return { name: name.charAt(0).toUpperCase() + name.slice(1), baseUnit: base, bigUnit: big, perBig: per, rate: rate, rateUnit: rateUnit, gst: "", taxIncl: "", mrp: "", hsn: "", category: "" };
    }).filter(Boolean);
  }

  /** A line's money: GST added on top when the rate is "+ GST extra", taken out of it when the rate includes GST
      (addendum-014). A line with no GST rate is just price × quantity. */
  function lineMoney(l) {
    var amt = (l.price || 0) * l.qty, g = num(l.gst), r2 = function (x) { return Math.round(x * 100) / 100; };
    if (!(g >= 0)) return { net: amt, tax: 0, total: amt };
    if (taxFlag(l.taxIncl) === true) { var net = amt / (1 + g / 100); return { net: r2(net), tax: r2(amt - net), total: amt }; }
    return { net: amt, tax: r2(amt * g / 100), total: r2(amt * (1 + g / 100)) };
  }
  function orderTotal(lines) { return Math.round(lines.reduce(function (a, l) { return a + lineMoney(l).total; }, 0) * 100) / 100; }
  function orderTax(lines) { return Math.round(lines.reduce(function (a, l) { return a + lineMoney(l).tax; }, 0) * 100) / 100; }

  /** The assistant never runs a step: it maps a question to the step it belongs to and points at the page. */
  // Most specific first: "deliver an order" is about delivering, "get paid for an order" about payment.
  var TOPICS = [
    { id: "deliver",   words: ["deliver", "driver", "route", "dispatch", "send goods"] },
    { id: "paid",      words: ["pay", "paid", "udhaar", "collect", "money", "upi", "cash", "payment"] },
    { id: "plan",      words: ["plan", "whatsapp", "summary", "hisaab", "morning", "evening", "report"] },
    { id: "customers", words: ["customer", "contact", "shop", "retailer", "dukaan", "party"] },
    { id: "items",     words: ["item", "product", "rate", "price", "list", "stock", "maal", "zoho", "excel", "catalog", "categor"] },
    { id: "order",     words: ["order", "bill", "invoice", "sell", "sale"] }
  ];
  function topicFor(question) {
    var q = String(question || "").toLowerCase();
    for (var i = 0; i < TOPICS.length; i++) {
      if (TOPICS[i].words.some(function (w) { return q.indexOf(w) !== -1; })) return TOPICS[i].id;
    }
    return null;
  }

  return {
    STEPS: STEPS, initialState: initialState, isDone: isDone, isLocked: isLocked, isWaiting: isWaiting,
    lockNote: lockNote, progress: progress, tick: tick, nextStep: nextStep, step: step, stepNumber: stepNumber,
    orderTotal: orderTotal, orderTax: orderTax, lineMoney: lineMoney, topicFor: topicFor,
    STAGES: STAGES, jobProgress: jobProgress, COLS: COLS, GST_SLABS: GST_SLABS, num: num, blank: blank, normName: normName, isEmptyRow: isEmptyRow, rowIssues: rowIssues,
    duplicateOf: duplicateOf, sheetSummary: sheetSummary, splitForSave: splitForSave, mergeRow: mergeRow, parseSpeech: parseSpeech,
    taxFlag: taxFlag, prices: prices, rateSide: rateSide, setTaxAll: setTaxAll, plural: plural, BASES: BASES, BIGS: BIGS
  };
});
