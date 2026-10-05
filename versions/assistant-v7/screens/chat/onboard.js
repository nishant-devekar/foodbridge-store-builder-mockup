/* Assistant discovery · the question tree (5 Oct 2026; assistant-v6 the same day — addendum-013: mobile first, then the
   shop's name; many answers where they suit; "anything else?" after contacts, products and at the end; it stops at the
   store request; every word cut).

   The owner (voice note, 5 Oct 2026, discovery/instructions/inputs/2026-10-05-voice-note.md):
   "someone says hi, give an option of onboarding ... what is your name, phone number ... onboard your
   users: on the phone the address book, on desktop a QR code ... then all the static questions --
   wholesaler, distributor or manufacturer, how many warehouses -- make a question tree for it, throw a
   question one by one, a dropdown somewhere, a radio button somewhere ... products: whatever file,
   image, send that to Claude ... then let Claude define the whole situation of the store ... your store
   is created, what would you like to do next?" -- and first, "move the step-wise flow you built, whole,
   into the chat app".

   So the store's questions (Shop · Contacts · Who is who · Daily work · Files · Send) are asked one at a time, with
   the owner's additions: products read from any file and a store summary. v6: the mobile first, then the shop's
   name; it stops at the store request.

   Every answer is written into the store state (screens/store/model.js), so the Excel, setup.json and the build the
   FoodBridge team receives carry exactly what he said.

   Pure: no DOM, no fetch, no clock of its own (ctx.now). The page (app.js) draws what this returns and
   runs the hooks it names (a draft lookup, a build, a sample read).

     ctx   { S: the store state, F: flow state, CAT, M (FB_MODEL), IMP (FB_IMPORT), now: ms }
     ask(ctx, id)        → [message]     asks node id (F.at = id)
     step(ctx, input)    → { msgs, hook? }   answers the node in F.at
     advance(ctx)        → [message]     the next node that applies
     input   { text } | { value } | { values } | { contacts, src } | { people } | { extract } |
             { products } | { papers } | { pick }
     message { kind: "text"|"image"|"sticker"|"card", text?, buttons?, list?, widget?, compose? }
             buttons [{ id: "ans:<value>" | "next:<action>" | "intent:<id>" | "menu", label }] (≤ 3)
             widget  { type: "contacts"|"files"|"select"|"multi"|"products"|"summary"|"people"|"pick", … }
             compose { type: "text"|"tel"|"upper", hint }   what the message box asks for next */

(function (root) {
  "use strict";

  const NODE = typeof module !== "undefined" && module.exports;

  /* ── words ───────────────────────────────────────────────────────────── */
  const YES = /^(y|yes|yeah|yep|ya|haan?|ha+|han|ji|ji haan|hmm+|ok|okay|sure|right|correct|sahi|theek|thik)\b/i;
  const NO = /^(n|no|nope|nahi|nahin|na|nai|mat)\b/i;
  const SKIP = /\b(skip|later|baad|baad mein|not now|no gst|nothing( more)?|none|nahi hai|koi nahi|that'?s all|done|ho gaya|bas)\b/i;
  const BACK = /^(back|go back|undo|peeche|wapas|pichhe|previous)$/i;

  function txt(text, extra) { return Object.assign({ kind: "text", text: text }, extra || {}); }
  function btn(value, label) { return { id: "ans:" + value, label: label }; }
  function first(name) { return String(name || "").trim().split(/\s+/)[0] || ""; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : many || one + "s"); }
  function titleCase(s) { return String(s || "").trim().replace(/\s+/g, " ").replace(/(^|\s)(\p{Ll})/gu, function (m, a, b) { return a + b.toUpperCase(); }); }
  function norm(s) { return String(s || "").toLowerCase().replace(/[’']/g, "").replace(/[^a-z0-9ऀ-ॿ\s]/g, " ").replace(/\s+/g, " ").trim(); }
  /* "3" picks the third row of a list; words pick a row whose label or keys hold them. */
  function pickRow(rows, text) {
    const t = norm(text);
    if (!t) return null;
    if (/^\d+$/.test(t)) return rows[Number(t) - 1] || null;
    return rows.find(function (r) { return (r.keys || []).concat([r.label]).some(function (k) { return t === norm(k) || (" " + t + " ").indexOf(" " + norm(k) + " ") >= 0; }); }) || null;
  }
  function yesNo(text) { const t = norm(text); return YES.test(t) ? true : NO.test(t) ? false : null; }

  /* ── what each list offers (Store Setup's own words, i18n.js en) ─────── */
  const TYPES = [
    { v: "distributor", label: "Distributor", keys: ["distributer", "distribution"] },
    { v: "supplier", label: "Supplier", keys: ["supply", "supplier"] },
    { v: "superstockist", label: "Super stockist", keys: ["super stockist", "superstockist", "ss"] },
    { v: "wholesaler", label: "Wholesaler", keys: ["wholesale", "holesaler", "wholeseller"] },
    { v: "retailer", label: "Retailer", keys: ["retail", "shop", "dukaan", "kirana"] },
    { v: "manufacturer", label: "Manufacturer", keys: ["manufacturing", "factory", "maker", "plant"] },
    { v: "other", label: "Other", keys: ["something else", "kuch aur"] },
  ];
  const PAYS = [
    { v: "cash", label: "Cash", keys: ["nakad"] }, { v: "upi", label: "UPI", keys: ["gpay", "phonepe", "paytm", "online"] },
    { v: "cheque", label: "Cheque", keys: ["check"] }, { v: "credit", label: "Credit (udhaar)", keys: ["credit", "udhaar", "udhar"] },
    { v: "other", label: "Other", keys: [] },
  ];
  const RETURNS = [
    { v: "credit", label: "Give credit", keys: ["credit", "credit note"] }, { v: "replace", label: "Replace", keys: ["replace", "badal", "exchange"] },
    { v: "none", label: "Don't take back", keys: ["dont", "no", "nahi"] }, { v: "other", label: "Other", keys: [] },
  ];
  const MORNING = [
    { v: "orders", label: "Orders", keys: ["order"] }, { v: "money", label: "Money to collect", keys: ["money", "collection", "paisa", "vasooli"] },
    { v: "stock", label: "Stock", keys: ["maal", "inventory"] }, { v: "trucks", label: "Trucks", keys: ["truck", "gaadi", "van", "delivery"] },
    { v: "other", label: "Other", keys: [] },
  ];
  const KIND = { shop: "Customer", supplier: "Supplier", staff: "Staff", none: "Remove" };

  function listMsg(text, title, rows, extra) {
    return txt(text, Object.assign({ list: { button: "Choose", title: title, rows: rows.map(function (r, i) { return { n: i + 1, id: "ans:" + r.v, label: r.label }; }) } }, extra || {}));
  }
  /* Many answers (v6, the owner: "multi-option"): ticks, or typed words like "cash, UPI". */
  function ticks(text, rows, picked) { return txt(text, { widget: { type: "multi", options: rows.map(function (r) { return { v: r.v, label: r.label, on: (picked || []).indexOf(r.v) >= 0 }; }) } }); }
  function manyOf(rows, i) {
    let vs = i.values;
    if (!vs && i.value) vs = [i.value];
    if (!vs && i.text) vs = norm(i.text).split(/[\s,]+|\band\b|\baur\b/).map(function (w) { const r = pickRow(rows, w); return r && r.v; }).filter(Boolean);
    return (vs || []).filter(function (v, k, a) { return a.indexOf(v) === k && rows.some(function (r) { return r.v === v; }); });
  }
  function many(v) { return Array.isArray(v) ? v : v == null || v === "" ? [] : [v]; }

  /* ── the sections, in the order they are asked ─────────────────────────── */
  const SECTIONS = [
    { id: "you", label: "Mobile and shop", first: "mobile" },
    { id: "people", label: "Contacts", first: "contacts" },
    { id: "sort", label: "Who is who", first: "sort" },
    { id: "business", label: "Business", first: "type" },
    { id: "day", label: "Your day", first: "routes" },
    { id: "products", label: "Products", first: "products" },
    { id: "files", label: "Papers", first: "files" },
  ];

  /* ── the nodes ────────────────────────────────────────────────────────── */
  const N = {};

  /* v6 (decision R5): no owner's name. The mobile first; a store already saved under it is confirmed by its name;
     otherwise the shop's name is asked — it is the shop's (store.name). */
  N.mobile = {
    section: "you",
    ask: function () { return [txt("Let's set up your store.\n*Your mobile number?*", { compose: { type: "tel", hint: "10-digit mobile" } })]; },
    answered: function (c) { return c.M.storeReady(c.S); },
    accept: function (c, i) {
      const d = c.M.phone10(i.text);
      if (d.length !== 10 || !/^[6-9]/.test(d)) return { ok: false, msgs: [txt("Not a 10-digit mobile. Try again.", { compose: { type: "tel", hint: "10-digit mobile" } })] };
      c.S.store.mobile = c.M.phoneShow(d);
      return { ok: true, hook: "draftLookup" };   // is a store already saved under it? The page asks FoodBridge.
    },
  };

  /* A store saved under this mobile: by its name when it has one ("Sharma Agencies — is this you?"). v7 (addendum-014 D-1):
     with nothing saved, an existing FoodBridge account the Digital Assistant finds by the mobile is confirmed the same
     way — its business name, never read from the host's database by the chat. */
  function found(c) { return c.F.draft ? { name: c.F.draft.name, saved: true } : c.F.account && c.F.account.found ? { name: c.F.account.name } : null; }
  N.sync = {
    section: "you",
    skip: function (c) { return !found(c); },
    ask: function (c) {
      const n = found(c).name;
      return [txt(n ? "*" + n + "* — is this you?" : "You have a saved store. Continue it?", { buttons: n ? [btn("sync", "Yes"), btn("fresh", "No")] : [btn("sync", "Continue"), btn("fresh", "Start fresh")] })];
    },
    accept: function (c, i) {
      const t = i.value || (yesNo(i.text) === true ? "sync" : yesNo(i.text) === false ? "fresh" : null);
      if (!t) return { ok: false, msgs: N.sync.ask(c) };
      const saved = !!c.F.draft;
      if (t === "sync" && saved) {
        const keep = { mobile: c.S.store.mobile };
        const s = c.M.migrate(JSON.parse(JSON.stringify(c.F.draft.state)));
        Object.keys(c.S).forEach(function (k) { delete c.S[k]; });
        Object.assign(c.S, s);
        c.S.store.mobile = keep.mobile;
        c.F.resume = true;   // from here, what the saved store already answers is not asked again
        c.F.synced = true;
      }
      if (t === "sync" && !saved) c.S.store.name = String(c.F.account.name || "").slice(0, 80);   // his account's name: the shop is not asked
      c.F.draft = null; c.F.account = null;
      if (t === "sync" && !saved) return { ok: true, goto: "contacts" };
      return { ok: true, msgs: t === "sync" && saved ? [txt("Welcome back! Only what's left.")] : [] };
    },
  };

  N.shop = {
    section: "you",
    answered: function (c) { return !!String(c.S.store.name || "").trim(); },
    ask: function () { return [txt("*Your shop or business name?*", { compose: { type: "text", hint: "Shop name" } })]; },
    accept: function (c, i) {
      const v = String(i.text || "").trim().replace(/\s+/g, " ");
      if (v.replace(/[^\p{L}]/gu, "").length < 2) return { ok: false, msgs: [txt("Type your shop's name.", { compose: { type: "text", hint: "Shop name" } })] };
      c.S.store.name = v.slice(0, 80);
      return { ok: true };
    },
  };

  /* Contacts: the phone's own address book on a phone, a QR code to the phone on a computer, and always a list file
     (Tally, Busy, Excel, a contacts .vcf) or pasted rows. */
  function contactsWidget(c) { return { type: "contacts", device: c.F.device, code: c.F.code || "" }; }
  N.contacts = {
    section: "people",
    ask: function (c) { return [txt("*Add your customers, suppliers and staff.*", { widget: contactsWidget(c), buttons: [btn("skip", "Skip")] })]; },
    answered: function (c) { return c.S.order.length > 0; },
    accept: function (c, i) {
      let list = i.contacts;
      if (!list && i.text) {
        if (SKIP.test(i.text)) return { ok: true };
        list = c.IMP.fromText(i.text);
        if (!list.length) return { ok: false, msgs: [txt("No names and numbers in that. Try again.", { buttons: [btn("skip", "Skip")] })] };
      }
      if (i.value === "skip" || i.value === "done") return { ok: true };
      if (!list) return { ok: false, msgs: [] };
      let added = 0, dup = 0;
      list.forEach(function (p) {
        if (!p.name && !p.phone) return;
        const r = c.M.addPerson(c.S, { name: p.name || p.phone, phone: c.M.phone10(p.phone) || p.phone || "", src: i.src || "contact", type: p.type || null });
        if (r.dup) dup++; else added++;
      });
      return { ok: true, stay: true, msgs: [txt("📇 " + (added ? added + " added" : "None new") + (dup ? ", " + dup + " already in" : "") + ". Total *" + c.S.order.length + "*.",
        { buttons: [btn("done", "Done"), btn("more", "Add more")] })] };
    },
  };

  /* Who is who: a first guess from each name ("… Kirana" a customer, "… Agency" a supplier, "… Driver" staff),
     confirmed in one tap, and a list with a radio per person to fix any. */
  function guessCounts(c) {
    const g = { shop: 0, supplier: 0, staff: 0, unsure: 0 };
    c.M.unsorted(c.S).forEach(function (p) { const k = c.M.guessType(p.name); if (k) g[k]++; else g.unsure++; });
    return g;
  }
  function peopleWidget(c) {
    return { type: "people", rows: c.S.order.map(function (id) { const p = c.S.people[id]; return { id: id, name: p.name, phone: p.phone, type: p.type || c.M.guessType(p.name) || "" }; }) };
  }
  const SORT_BTNS = [btn("ok", "Looks right"), btn("check", "Change")];
  N.sort = {
    section: "people",   // contacts and marking them go together: changing one asks both
    skip: function (c) { return !c.S.order.length; },
    answered: function (c) { return c.S.order.length > 0 && c.M.unsorted(c.S).length === 0; },
    ask: function (c) {
      const g = guessCounts(c), left = c.M.unsorted(c.S).length;
      if (!left) return [txt("*Who is who?*\n" + sortedLine(c), { buttons: SORT_BTNS })];
      return [txt("*Who is who?*\n🏪 Customers: " + g.shop + "\n🚚 Suppliers: " + g.supplier + "\n👤 Staff: " + g.staff + (g.unsure ? "\n❔ Not sure: " + g.unsure : ""),
        { widget: peopleWidget(c), buttons: SORT_BTNS })];
    },
    accept: function (c, i) {
      const v = i.value || (yesNo(i.text) === true ? "ok" : /check|list|dekh|change/i.test(i.text || "") ? "check" : /customer|grahak/i.test(i.text || "") ? "rest" : null);
      if (i.people) {
        Object.keys(i.people).forEach(function (id) {
          const t = i.people[id];
          if (!c.S.people[id]) return;
          if (t === "none") c.M.removePerson(c.S, id); else if (t) c.S.people[id].type = t;
        });
        const left = c.M.unsorted(c.S).length;
        if (left) return { ok: true, stay: true, msgs: [txt(left + " not marked.", { widget: peopleWidget(c), buttons: [btn("rest", "All customers"), btn("check", "Change")] })] };
        return { ok: true, msgs: [txt(sortedLine(c))] };
      }
      if (v === "check") return { ok: true, stay: true, open: "people", msgs: [] };
      if (v === "ok") {
        c.M.unsorted(c.S).forEach(function (p) { const k = c.M.guessType(p.name); if (k) p.type = k; });
        const left = c.M.unsorted(c.S).length;
        const names = c.M.unsorted(c.S).slice(0, 3).map(function (p) { return p.name; }).join(", ") + (left > 3 ? "…" : "");
        if (left) return { ok: true, stay: true, msgs: [txt("Not sure: " + names, { widget: peopleWidget(c), buttons: [btn("rest", "All customers"), btn("check", "Change")] })] };
        return { ok: true, msgs: [txt(sortedLine(c))] };
      }
      if (v === "rest") {
        c.M.unsorted(c.S).forEach(function (p) { p.type = "shop"; });
        return { ok: true, msgs: [txt(sortedLine(c))] };
      }
      return { ok: false, msgs: [txt("Tap *Looks right* or *Change*.", { buttons: SORT_BTNS })] };
    },
  };
  function sortedLine(c) {
    const n = function (t) { return c.M.peopleOf(c.S, t).length; };
    return [n("shop") ? "🏪 " + plural(n("shop"), "customer") : "", n("supplier") ? "🚚 " + plural(n("supplier"), "supplier") : "", n("staff") ? "👤 " + n("staff") + " staff" : ""].filter(Boolean).join(" · ") || "Nobody yet";
  }

  /* "Anything else?" (v6, decision R2): after contacts, after products, and at the end. Free text, or No. */
  function noteNode(id, section, key, question) {
    N[id] = {
      section: section,
      answered: function (c) { return !!c.S.notes[key] || !!(c.F.notesSeen || {})[key] || !!c.F.synced; },   // optional: not asked again on a saved store
      ask: function () { return [txt(question, { compose: { type: "text", hint: "Type here" }, buttons: [btn("none", "No")] })]; },
      accept: function (c, i) {
        c.F.notesSeen = Object.assign({}, c.F.notesSeen, { [key]: true });
        if (i.value === "none" || SKIP.test(i.text || "") || yesNo(i.text) === false) return { ok: true };
        c.S.notes[key] = String(i.text || "").trim().slice(0, 600);
        return { ok: true, msgs: [txt("Noted.")] };
      },
    };
  }
  noteNode("peopleNote", "people", "people", "*Anything else about your contacts?*");

  /* Your business: as many as apply (v6, the owner: "distributor, also supplier, also super stockist"). */
  N.type = {
    section: "business",
    answered: function (c) { return many(c.S.store.types).length > 0 || !!c.S.store.type; },
    ask: function (c) { return [ticks("*What is your business?*", TYPES, many(c.S.store.types))]; },
    accept: function (c, i) {
      const vs = manyOf(TYPES, i);
      if (!vs.length) return { ok: false, msgs: [ticks("Tick at least one.", TYPES)] };
      c.S.store.types = vs;
      c.S.store.type = vs[0];
      if (vs.indexOf("other") < 0) c.S.store.typeOther = "";
      return { ok: true };
    },
  };
  N.typeOther = {
    section: "business",
    skip: function (c) { return many(c.S.store.types).indexOf("other") < 0 && c.S.store.type !== "other"; },
    answered: function (c) { return !!c.S.store.typeOther; },
    ask: function () { return [txt("*Which other business?*", { compose: { type: "text", hint: "e.g. C&F agent" } })]; },
    accept: function (c, i) {
      if (!String(i.text || "").trim()) return { ok: false, msgs: N.typeOther.ask() };
      c.S.store.typeOther = String(i.text).trim().slice(0, 60);
      return { ok: true };
    },
  };

  /* A dropdown here (owner: "a dropdown somewhere, a radio button somewhere"). */
  const WH = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];
  N.warehouses = {
    section: "business",
    answered: function (c) { return c.S.store.warehouses != null; },
    ask: function () { return [txt("*How many warehouses?*", { widget: { type: "select", label: "Warehouses", options: WH.map(function (n) { return { v: String(n), label: n === 0 ? "None" : String(n) }; }), ph: "Choose" } })]; },
    accept: function (c, i) {
      const raw = i.value != null ? i.value : i.text;
      const t = norm(raw);
      const n = /^(none|no|nahi|zero|koi nahi)$/.test(t) ? 0 : /^(one|ek)$/.test(t) ? 1 : /^(two|do)$/.test(t) ? 2 : /^(three|teen)$/.test(t) ? 3 : parseInt(t, 10);
      if (!(n >= 0 && n <= 999)) return { ok: false, msgs: [txt("Just the number.", { widget: N.warehouses.ask()[0].widget })] };
      c.S.store.warehouses = n;
      return { ok: true };
    },
  };

  const GST_ASK = { compose: { type: "upper", hint: "GST number" }, buttons: [btn("later", "Later")] };
  N.gst = {
    section: "business",
    answered: function (c) { return !!c.S.store.gst; },
    ask: function () { return [txt("*GST number?*", GST_ASK)]; },
    accept: function (c, i) {
      if (i.value === "later" || SKIP.test(i.text || "") || yesNo(i.text) === false) return { ok: true };
      const g = String(i.text || "").toUpperCase().replace(/\s+/g, "");
      if (!c.M.gstOk(g)) return { ok: false, msgs: [txt("Not a valid GST number. Try again.", GST_ASK)] };
      c.S.store.gst = g;
      return { ok: true };
    },
  };

  /* Your day: six questions (rules.*) and a note. */
  function yn(id, path, question) {
    N[id] = {
      section: "day",
      answered: function (c) { return c.S.rules[path] != null; },
      ask: function () { return [txt(question, { buttons: [btn("yes", "Yes"), btn("no", "No")] })]; },
      accept: function (c, i) {
        const v = i.value ? i.value === "yes" : yesNo(i.text);
        if (v == null) return { ok: false, msgs: [txt("Yes or no?", { buttons: [btn("yes", "Yes"), btn("no", "No")] })] };
        c.S.rules[path] = v;
        return { ok: true };
      },
    };
  }
  yn("routes", "routes", "*Fixed route days for deliveries?*");
  yn("selfOrder", "selfOrder", "*Do customers order on their own?*");
  yn("partPay", "partPay", "*Do customers pay in parts?*");

  /* Many answers on the day: how they pay (as before), what he does with damaged goods, what he checks each morning. */
  function multiRule(id, path, question, rows) {
    N[id] = {
      section: "day",
      answered: function (c) { return many(c.S.rules[path]).length > 0; },
      ask: function (c) { return [ticks(question, rows, many(c.S.rules[path]))]; },
      accept: function (c, i) {
        const vs = manyOf(rows, i);
        if (!vs.length) return { ok: false, msgs: [ticks("Tick at least one.", rows)] };
        c.S.rules[path] = vs;
        if (vs.indexOf("other") < 0) c.S.rules[path + "Other"] = "";
        return { ok: true };
      },
    };
  }
  function otherText(id, path, check, q) {
    N[id] = {
      section: "day",
      skip: function (c) { return !check(c); },
      answered: function (c) { return !!c.S.rules[path]; },
      ask: function () { return [txt(q, { compose: { type: "text", hint: "Type here" } })]; },
      accept: function (c, i) {
        if (!String(i.text || "").trim()) return { ok: false, msgs: N[id].ask() };
        c.S.rules[path] = String(i.text).trim().slice(0, 120);
        return { ok: true };
      },
    };
  }
  multiRule("payMethods", "payMethods", "*How do customers pay?*", PAYS);
  otherText("payOther", "payMethodsOther", function (c) { return many(c.S.rules.payMethods).indexOf("other") >= 0; }, "*Which other way?*");
  multiRule("returns", "returns", "*Damaged goods come back. You…*", RETURNS);
  otherText("returnsOther", "returnsOther", function (c) { return many(c.S.rules.returns).indexOf("other") >= 0; }, "*What else do you do?*");
  multiRule("morning", "morning", "*What do you check each morning?*", MORNING);
  otherText("morningOther", "morningOther", function (c) { return many(c.S.rules.morning).indexOf("other") >= 0; }, "*What else?*");
  N.note = {
    section: "day",
    answered: function (c) { return !!c.S.rules.note || c.F.noteSeen || !!c.F.synced; },
    ask: function () { return [txt("*Anything else about your day?*", { compose: { type: "text", hint: "Type here" }, buttons: [btn("none", "No")] })]; },
    accept: function (c, i) {
      c.F.noteSeen = true;
      if (i.value === "none" || SKIP.test(i.text || "") || yesNo(i.text) === false) return { ok: true };
      c.S.rules.note = String(i.text || "").trim().slice(0, 600);
      return { ok: true, msgs: [txt("Noted.")] };
    },
  };

  /* Products: any file or image → read → products in our catalogue's shape → shown back → added. Claude is parked
     (TD-1): a spreadsheet is read by the stand-in, a photo is kept for the team and never guessed. */
  const PROD_ASK = [btn("sample", "Try a sample"), btn("later", "Later")];
  function productsCard(c, res) {
    const rows = res.products || [];
    const m = rows.filter(function (p) { return p.match; }).length, fresh = rows.length - m;
    const noPrice = rows.filter(function (p) { return p.sell == null; }).length;
    return txt((res.sample ? "🧪 *Sample*\n" : "") + "*" + plural(rows.length, "product") + "* read" +
      "\n✅ " + m + " in our catalogue" + (fresh ? "\n🆕 " + fresh + " new" : "") + (noPrice ? "\n⚠️ " + noPrice + " without price" : ""),
      { widget: { type: "products", rows: rows }, buttons: [btn("addall", "Add all " + rows.length), btn("check", "Check"), btn("another", "Another file")] });
  }
  function unreadableMsg(res) {
    const imgs = (res.files || []).filter(function (f) { return f.unreadable === "claude_not_connected"; });
    const other = (res.files || []).filter(function (f) { return f.unreadable && f.unreadable !== "claude_not_connected"; });
    const lines = [];
    if (imgs.length) lines.push("📷 Can't read photos yet. Kept for our team.");
    if (other.length) lines.push("📄 No products found. Kept for our team.");
    return txt(lines.join("\n"), { buttons: [btn("another", "Another file"), btn("done", "Done")] });
  }
  N.products = {
    section: "products",
    answered: function (c) { return Object.keys(c.S.items).length > 0 || c.F.productsSeen; },
    ask: function () { return [txt("*Send your product list.*", { widget: { type: "files", purpose: "products" }, buttons: PROD_ASK })]; },
    accept: function (c, i) {
      c.F.productsSeen = true;
      if (i.extract) {
        const res = i.extract;
        if (res.products && res.products.length) { c.F.prod = res; return { ok: true, stay: true, msgs: [productsCard(c, res)] }; }
        return { ok: true, stay: true, msgs: [unreadableMsg(res)] };
      }
      if (i.products) {   // from Check: the rows he kept, as he edited them
        const n = applyProducts(c, i.products.rows || []);
        c.F.prod = null;
        return { ok: true, stay: true, msgs: [addedMsg(c, n)] };
      }
      const v = i.value || (SKIP.test(i.text || "") ? "done" : /sample/i.test(i.text || "") ? "sample" : yesNo(i.text) === true && c.F.prod ? "addall" : null);
      if (v === "sample") return { ok: true, stay: true, hook: "sampleExtract" };
      if (v === "addall" && c.F.prod) { const n = applyProducts(c, c.F.prod.products); c.F.prod = null; return { ok: true, stay: true, msgs: [addedMsg(c, n)] }; }
      if (v === "check" && c.F.prod) return { ok: true, stay: true, open: "products", msgs: [] };
      if (v === "another" || v === "more") return { ok: true, stay: true, msgs: [txt("Send it with 📎.", { widget: { type: "files", purpose: "products" } })] };
      if (v === "done" || v === "later") return { ok: true };
      return { ok: false, msgs: [txt("Send a file with 📎, or tap *Later*.", { buttons: PROD_ASK })] };
    },
  };
  function addedMsg(c, n) {
    return txt("📦 " + n + " added. Total *" + Object.keys(c.S.items).length + "*.", { buttons: [btn("done", "Done"), btn("another", "Another file")] });
  }
  /* Rows (Claude's shape) → items. A match is the catalogue item with his MRP and rate; a row with no match is his
     own new item. Both are marked as his (export: "Owner"). */
  function applyProducts(c, rows) {
    let n = 0;
    (rows || []).forEach(function (p) {
      if (!p || p.keep === false || !String(p.name || "").trim()) return;
      const touched = {};
      let id;
      if (p.match && p.match.id && c.CAT.items.some(function (x) { return x.id === p.match.id; })) {
        id = p.match.id;
        const base = c.CAT.items.find(function (x) { return x.id === id; });
        const mine = c.S.items[id] || { unit: "case" };
        if (p.mrp != null && p.mrp !== base.mrp) { mine.mrp = p.mrp; touched.mrp = true; }
        if (p.caseQty != null && p.caseQty !== base.caseQty) mine.caseQty = p.caseQty;
        if (p.barcode && !base.barcode) mine.barcode = p.barcode;
        if (p.sell != null) { mine.sell = p.sell; touched.sell = true; }
        if (p.buy != null) { mine.buy = p.buy; touched.buy = true; }
        mine.touched = Object.assign(mine.touched || {}, touched);
        c.S.items[id] = mine;
      } else {
        id = c.M.uid("ci");
        c.S.customItems[id] = { name: String(p.name).trim().slice(0, 120), brand: p.brand || "", company: "", pack: p.pack || "", mrp: p.mrp != null ? p.mrp : null,
          caseQty: p.caseQty || 1, cat: "other", photo: null, barcode: p.barcode || "" };
        c.S.items[id] = { unit: "case", sell: p.sell != null ? p.sell : undefined, buy: p.buy != null ? p.buy : undefined, touched: { mrp: true, sell: p.sell != null, buy: p.buy != null } };
        if (p.gst != null) c.S.items[id].gst = p.gst;
      }
      n++;
    });
    c.M.syncCompanies(c.CAT, c.S);
    return n;
  }
  noteNode("productsNote", "products", "products", "*Anything else about your products?*");

  /* Papers: a khata page, a route chart, bills — kept as they came. */
  N.files = {
    section: "files",
    answered: function (c) { return c.F.filesSeen; },
    ask: function (c) {
      return [txt("*Any papers to share?* Khata, bills, route chart.", { widget: { type: "files", purpose: "papers", qr: c.F.device !== "phone", code: c.F.code2 || "" }, buttons: [btn("none", "No")] })];
    },
    accept: function (c, i) {
      c.F.filesSeen = true;
      if (i.papers && i.papers.length) return { ok: true, stay: true, msgs: [txt("📎 " + i.papers.length + " received.", { buttons: [btn("none", "Done"), btn("more", "Send more")] })] };
      if (i.value === "more") return { ok: true, stay: true, msgs: [txt("Send them with 📎.")] };
      if (i.value === "none" || SKIP.test(i.text || "") || yesNo(i.text) === false) return { ok: true };
      return { ok: false, msgs: [txt("Send with 📎, or tap *No*.", { buttons: [btn("none", "No")] })] };
    },
  };
  noteNode("endNote", "files", "end", "*Anything else?*");

  /* The store, summed up. The facts are the model's own counts and gaps — proven numbers only. In production Claude
     words them (TD-1, claude/store-summary.md); here the template below does. */
  const SUM_BTNS = [btn("create", "Create my store"), btn("change", "Change")];
  N.summary = {
    section: null,
    ask: function (c) {
      const f = facts(c);
      return [txt("*Your store*", { widget: { type: "summary", facts: f } }), txt(summaryText(f), { buttons: SUM_BTNS })];
    },
    accept: function (c, i) {
      const v = i.value || (/create|build|bana|yes|ok|haan|done/i.test(i.text || "") ? "create" : /change|edit|badal/i.test(i.text || "") ? "change" : null);
      if (v === "create") return { ok: true, hook: "build", stay: true };
      if (v === "change") return { ok: true, stay: true, msgs: [listMsg("*What to change?*", "Change", SECTIONS.map(function (s) { return { v: "edit:" + s.id, label: s.label }; }))] };
      if (v && v.indexOf("edit:") === 0) {
        const s = SECTIONS.find(function (x) { return x.id === v.slice(5); });
        if (s) { c.F.returnTo = "summary"; c.F.resume = false; return { ok: true, goto: s.first }; }
      }
      return { ok: false, msgs: [txt("Tap *Create my store* when it looks right.", { buttons: SUM_BTNS })] };
    },
  };

  /* After the request (v6, decision R3): it stops here. What he does next — an order, a collection, a campaign — is
     the assistant inside his store, once the team has set it up; he reaches it from a login link. */
  N.done = {
    section: null,
    ask: function (c) { return created(c); },
    accept: function () { return { ok: false, msgs: [txt("Your store is with our team. We'll send you a login link.")] }; },
  };

  const ORDER = ["mobile", "sync", "shop", "contacts", "sort", "peopleNote", "type", "typeOther", "warehouses", "gst",
    "routes", "selfOrder", "partPay", "payMethods", "payOther", "returns", "returnsOther", "morning", "morningOther", "note",
    "products", "productsNote", "files", "endNote", "summary"];

  /* ── the engine ───────────────────────────────────────────────────────── */
  function ask(c, id) {
    c.F.at = id;
    return N[id].ask(c);
  }
  function applies(c, id) {
    const n = N[id];
    if (n.skip && n.skip(c)) return false;
    if (c.F.resume && n.answered && n.answered(c)) return false;
    return true;
  }
  function advance(c) {
    const at = c.F.at, i = ORDER.indexOf(at);
    if (i < 0) return [];
    for (let k = i + 1; k < ORDER.length; k++) {
      const id = ORDER[k];
      if (!applies(c, id)) continue;
      /* Changing one thing from the summary: when that section is done, back to the summary. */
      if (c.F.returnTo && N[id].section !== N[at].section) { const r = c.F.returnTo; c.F.returnTo = null; return ask(c, r); }
      return ask(c, id);
    }
    return ask(c, "summary");
  }
  /* One answer → what the page says next. A hook is run by the page, which then calls resume(). */
  function step(c, input) {
    const at = c.F.at;
    if (!at || !N[at]) return { msgs: [] };
    if (input.text != null && BACK.test(norm(input.text))) return { msgs: back(c) };
    const r = N[at].accept(c, input) || { ok: false, msgs: [] };
    if (!r.ok) return { msgs: r.msgs || [] };
    if (r.hook) return { msgs: r.msgs || [], hook: r.hook, after: r };
    if (r.open) return { msgs: r.msgs || [], open: r.open };
    return { msgs: (r.msgs || []).concat(r.goto ? ask(c, r.goto) : r.stay ? [] : advance(c)) };
  }
  /* After the page ran a hook (draftLookup, build, sampleExtract). */
  function resume(c, hook, result) {
    if (hook === "draftLookup") return (c.F.assistant === "off" && !found(c) ? [OFF] : []).concat(advance(c));
    if (hook === "build") { c.F.built = result; c.F.at = "done"; c.F.returnTo = null; return created(c); }
    return [];
  }
  function back(c) {
    const i = ORDER.indexOf(c.F.at);
    for (let k = i - 1; k >= 0; k--) { const id = ORDER[k]; if (id !== "sync" && !(N[id].skip && N[id].skip(c))) return ask(c, id); }
    return ask(c, c.F.at);
  }

  /* ── the store, summed up ──────────────────────────────────────────────── */
  const GAP_WORDS = { noMobile: "mobile", noGst: "GST number", unsorted: "contacts to mark", noShops: "customers",
    shopNoPhone: "customers' mobiles", noSuppliers: "suppliers", rulesOpen: "daily-work answers" };
  function typeLabels(st) {
    return many(st.types && st.types.length ? st.types : st.type).map(function (v) { return v === "other" ? st.typeOther || "Other" : (TYPES.find(function (t) { return t.v === v; }) || {}).label || v; });
  }
  function facts(c) {
    const S = c.S, M = c.M, its = M.chosenItems(c.CAT, S);
    const P = M.progress(c.CAT, S);
    const gaps = M.missing(c.CAT, S).map(function (g) { return { key: g.key, n: g.n, label: GAP_WORDS[g.key] || g.key }; });
    const noPrice = its.filter(function (it) { return S.items[it.id] && S.items[it.id].sell == null && !(S.items[it.id].touched || {}).sell; }).length;
    return {
      name: S.store.name || "", mobile: S.store.mobile || "", type: typeLabels(S.store).join(", "), warehouses: S.store.warehouses, gst: S.store.gst || "",
      products: its.length, fromCatalogue: its.filter(function (it) { return !it.custom; }).length, newProducts: its.filter(function (it) { return it.custom; }).length,
      companies: Object.keys(S.companies).length, noPrice: noPrice,
      customers: M.peopleOf(S, "shop").length, suppliers: M.peopleOf(S, "supplier").length, staff: M.peopleOf(S, "staff").length, unsorted: M.unsorted(S).length,
      answered: P.rules.n, of: M.RULES_N, files: S.papers.length, gaps: gaps,
      notes: ["people", "products", "end"].filter(function (k) { return S.notes && S.notes[k]; }).length + (S.rules.note ? 1 : 0),
      /* a photo or PDF sent at Products that nobody could read yet (Claude is TD-1): the team reads it */
      unreadFiles: S.papers.filter(function (p) { return p.step === "items" && /^image\/|pdf/.test(p.mime || ""); }).length,
    };
  }
  function summaryText(f) {
    const lines = [];
    lines.push("🏷️ " + [f.type || "Business not given", f.warehouses != null ? (f.warehouses === 0 ? "no warehouse" : plural(f.warehouses, "warehouse")) : "", f.gst ? "GST ✓" : "no GST"].filter(Boolean).join(" · "));
    lines.push("📦 " + (f.products ? plural(f.products, "product") : "No products"));
    lines.push("👥 " + (f.customers + f.suppliers + f.staff ? [plural(f.customers, "customer"), plural(f.suppliers, "supplier"), f.staff + " staff"].join(" · ") : "No contacts"));
    lines.push("🗓️ Your day: " + f.answered + "/" + f.of);
    if (f.files) lines.push("📎 " + plural(f.files, "file"));
    if (f.notes) lines.push("📝 " + plural(f.notes, "note"));
    const left = f.gaps.map(function (g) { return g.n > 1 ? g.n + " " + g.label : g.label; });
    if (f.noPrice) left.push(plural(f.noPrice, "price"));
    if (f.unreadFiles) left.push(f.unreadFiles === 1 ? "products in your photo" : "products in " + f.unreadFiles + " photos");
    if (left.length) lines.push("", "We'll follow up on: " + left.join(", ") + ".");
    return lines.join("\n");
  }
  function created(c) {
    return [{ kind: "sticker", image: "proud.png", alt: "Done" },
      txt(c.F.built && c.F.built.sent === false ? "✅ *Saved.* It goes to FoodBridge when you're back online." : "✅ *Done!* We'll set up your store and send you a login link.")];
  }

  /* ── v7 (addendum-014): his store, once the team marks it Ready to use ───────────────
     Each option asks the FoodBridge Digital Assistant for a login link that lands him on that screen (cafex's smart
     link, the event named). Not connected yet: it says so and shows a sample, labelled as one (D-2, D-4). */
  const OFF = { kind: "note", text: "🔌 Not connected to FoodBridge Digital Assistant" };
  const STORE_ACTIONS = [
    { id: "store:open", label: "Open my store", event: "AUTO_LOGIN" },
    { id: "store:order", label: "Create an order", event: "CREATE_PROXY_ORDER" },
    { id: "store:tomorrow", label: "Order for tomorrow", event: "CREATE_PROXY_ORDER" },
    { id: "store:collect", label: "Collection request", event: "PAYMENT_LINK" },
    { id: "store:campaign", label: "Send a campaign", event: "AUTO_LOGIN" },   // no campaign event in cafex yet (gap)
    { id: "store:customers", label: "Add customers", event: "ADD_CUSTOMER" },
    { id: "store:products", label: "Add products", event: "ADD_PRODUCT" },
    { id: "store:staff", label: "Add staff", event: "ADD_STAFF" },
  ];
  const SAMPLE = "foodbridge.io/platform/smart-link?code=xYz12A";
  function storeMenu(lead) {
    const rows = STORE_ACTIONS.map(function (a, i) { return { n: i + 1, id: a.id, label: a.label }; });
    return txt((lead ? lead + "\n" : "") + rows.map(function (r) { return r.n + "  " + r.label; }).join("\n"), {
      list: { button: "Choose", title: "Your store", rows: rows }, numbered: rows.map(function (r) { return { id: r.id, label: r.label }; }),
      buttons: [{ id: "store:open", label: "Open my store" }, { id: "store:order", label: "Create an order" }] });
  }
  function ready(c) { return [txt("🟢 *" + (c.S.store.name || "Your store") + "* is ready to use."), storeMenu()]; }
  function linkFor(id, res) {
    const a = STORE_ACTIONS.find(function (x) { return x.id === id; });
    if (!a) return [];
    if (res && res.url) return [txt(a.label + ": " + res.url)];
    return [OFF, txt("Sample link:\n" + SAMPLE)];
  }

  /* Whose store this conversation is (5 Oct 2026, owner: the team's inbox "only appears if found a store already"):
     nobody until the mobile is a valid 10 digits; then that mobile. Builds belong to the mobile they were made under,
     and show only to it. */
  function ownerOf(S, M) { return M.storeReady(S) ? M.phone10(S.store.mobile) : ""; }
  function owned(list, mobile, M, key) {
    if (!mobile) return [];
    return (list || []).filter(function (x) { const v = key(x); return v && M.phone10(v) === mobile; });
  }

  const API = { ownerOf: ownerOf, owned: owned, N: N, ORDER: ORDER, SECTIONS: SECTIONS, TYPES: TYPES, PAYS: PAYS, RETURNS: RETURNS, MORNING: MORNING, KIND: KIND,
    ask: ask, step: step, advance: advance, resume: resume, back: back, applies: applies,
    STORE_ACTIONS: STORE_ACTIONS, storeMenu: storeMenu, ready: ready, linkFor: linkFor, OFF: OFF, found: found,
    facts: facts, summaryText: summaryText, typeLabels: typeLabels, many: many, created: created, applyProducts: applyProducts,
    yesNo: yesNo, pickRow: pickRow, guessCounts: guessCounts, txt: txt };
  if (NODE) module.exports = API;
  else root.ASSIST_FLOW = API;
})(typeof window !== "undefined" ? window : globalThis);
