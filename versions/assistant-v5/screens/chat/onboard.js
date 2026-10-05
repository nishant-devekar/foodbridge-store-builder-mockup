/* Assistant discovery · the question tree (5 Oct 2026).

   The owner (voice note, 5 Oct 2026, discovery/instructions/inputs/2026-10-05-voice-note.md):
   "someone says hi, give an option of onboarding ... what is your name, phone number ... onboard your
   users: on the phone the address book, on desktop a QR code ... then all the static questions --
   wholesaler, distributor or manufacturer, how many warehouses -- make a question tree for it, throw a
   question one by one, a dropdown somewhere, a radio button somewhere ... products: whatever file,
   image, send that to Claude ... then let Claude define the whole situation of the store ... your store
   is created, what would you like to do next?" -- and first, "move the step-wise flow you built, whole,
   into the chat app".

   So this is Store Builder's flow (store-builder-v5: Shop · Contacts · Who is who · Daily work · Files ·
   Send) asked one question at a time, plus the owner's additions: name first, products read from any
   file, a store summary, and four next actions (a campaign among them).

   Every answer is written into a Store Builder state (screens/sb/model.js, copied unchanged), so the
   Excel, setup.json and the build the FoodBridge team receives are exactly Store Builder's.

   Pure: no DOM, no fetch, no clock of its own (ctx.now). The page (app.js) draws what this returns and
   runs the hooks it names (a draft lookup, a build, a sample read, queuing a campaign).

     ctx   { S: Store Builder state, F: flow state, CAT, M (SB_MODEL), IMP (SB_IMPORT), now: ms }
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

  /* ── what each list offers (Store Builder's own words, i18n.js en) ─────── */
  const TYPES = [
    { v: "distributor", label: "Distributor", keys: ["distributer", "distribution"] },
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
  const KIND = { shop: "Customer", supplier: "Supplier", staff: "Staff", none: "Not needed" };

  function listMsg(text, title, rows, extra) {
    return txt(text, Object.assign({ list: { button: "Choose", title: title, rows: rows.map(function (r, i) { return { n: i + 1, id: "ans:" + r.v, label: r.label, desc: r.desc || "" }; }) } }, extra || {}));
  }

  /* ── the sections, in the order they are asked ─────────────────────────── */
  const SECTIONS = [
    { id: "you", label: "Your name and mobile", first: "name" },
    { id: "people", label: "Contacts", first: "contacts" },
    { id: "sort", label: "Who is who", first: "sort" },
    { id: "business", label: "Your business", first: "type" },
    { id: "day", label: "How your day runs", first: "routes" },
    { id: "products", label: "Products", first: "products" },
    { id: "files", label: "Papers and files", first: "files" },
  ];

  /* ── the nodes ────────────────────────────────────────────────────────── */
  const N = {};

  N.name = {
    section: "you",
    ask: function () { return [txt("Let's set up your store — one question at a time, about 10 minutes. You can type, or tap the buttons.\n\nFirst, *what's your name?*", { compose: { type: "text", hint: "Your name" } })]; },
    answered: function (c) { return !!String(c.S.store.owner || "").trim(); },
    accept: function (c, i) {
      const v = titleCase(i.text);
      if (!v || v.replace(/[^\p{L}]/gu, "").length < 2 || /\d{4,}/.test(v)) return { ok: false, msgs: [txt("Just your name, please — like *Ramesh Sharma*.", { compose: { type: "text", hint: "Your name" } })] };
      c.S.store.owner = v.slice(0, 60);
      return { ok: true };
    },
  };

  N.mobile = {
    section: "you",
    ask: function (c) { return [txt("Thanks, " + first(c.S.store.owner) + " 🙏\n*Your mobile number?* You'll log in to FoodBridge with it.", { compose: { type: "tel", hint: "10-digit mobile" } })]; },
    answered: function (c) { return c.M.storeReady(c.S); },
    accept: function (c, i) {
      const d = c.M.phone10(i.text);
      if (d.length !== 10 || !/^[6-9]/.test(d)) return { ok: false, msgs: [txt("That doesn't look like a 10-digit mobile. Try again — like *98200 11223*.", { compose: { type: "tel", hint: "10-digit mobile" } })] };
      c.S.store.mobile = c.M.phoneShow(d);
      /* Store Builder v5's Sync: is a store already saved under this number? The page asks FoodBridge. */
      return { ok: true, hook: "draftLookup" };
    },
  };

  /* Store Builder v5 (Sync): a store saved under this number fills every step. */
  N.sync = {
    section: "you",
    skip: function (c) { return !c.F.draft; },
    ask: function (c) {
      const d = c.F.draft, bits = [];
      if (d.people) bits.push(plural(d.people, "contact"));
      if (d.products) bits.push(plural(d.products, "product"));
      if (d.answers) bits.push(d.answers + " of 6 daily-work answers");
      return [txt("I found a store already saved for *" + c.S.store.mobile + "*" + (bits.length ? ": " + bits.join(", ") : "") + ".\nCarry on from it?",
        { buttons: [btn("sync", "Yes, carry on from it"), btn("fresh", "No, start fresh")] })];
    },
    accept: function (c, i) {
      const t = i.value || (yesNo(i.text) === true ? "sync" : yesNo(i.text) === false ? "fresh" : null);
      if (!t) return { ok: false, msgs: [txt("Tap one: carry on from the saved store, or start fresh.", { buttons: [btn("sync", "Yes, carry on from it"), btn("fresh", "No, start fresh")] })] };
      if (t === "sync") {
        const keep = { owner: c.S.store.owner, mobile: c.S.store.mobile };
        const s = c.M.migrate(JSON.parse(JSON.stringify(c.F.draft.state)));
        Object.keys(c.S).forEach(function (k) { delete c.S[k]; });
        Object.assign(c.S, s);
        c.S.store.owner = c.S.store.owner || keep.owner;
        c.S.store.mobile = keep.mobile;
        c.F.resume = true;   // from here, what the saved store already answers is not asked again
      }
      c.F.draft = null;
      return { ok: true, msgs: t === "sync" ? [txt("Done — I've filled in everything from your saved store. I'll only ask what's left.")] : [] };
    },
  };

  /* Contacts: the phone's own address book on a phone, a QR code to the phone on a computer, and
     always a list file (Tally, Busy, Excel, a contacts .vcf) or pasted rows. Store Builder's ways in. */
  function contactsWidget(c) { return { type: "contacts", device: c.F.device, code: c.F.code || "" }; }
  N.contacts = {
    section: "people",
    ask: function (c) {
      const phone = c.F.device === "phone";
      return [txt("Now your people — customers, suppliers and staff. No typing: " +
        (phone ? "pick them from your phone's contacts." : "scan the code with your phone and pick them from its contacts.") +
        "\n\nA customer list from Tally, Busy or Excel works too — send it with 📎.",
        { widget: contactsWidget(c), buttons: [btn("skip", "Skip for now")] })];
    },
    answered: function (c) { return c.S.order.length > 0; },
    accept: function (c, i) {
      let list = i.contacts;
      if (!list && i.text) {
        if (SKIP.test(i.text)) return { ok: true };
        list = c.IMP.fromText(i.text);
        if (!list.length) return { ok: false, msgs: [txt("I couldn't find names and numbers in that. Pick them from your contacts, or paste rows like *Gupta Kirana 98200 11001*.", { buttons: [btn("skip", "Skip for now")] })] };
      }
      if (i.value === "skip" || i.value === "done") return { ok: true };
      if (!list) return { ok: false, msgs: [] };
      let added = 0, dup = 0;
      list.forEach(function (p) {
        if (!p.name && !p.phone) return;
        const r = c.M.addPerson(c.S, { name: p.name || p.phone, phone: c.M.phone10(p.phone) || p.phone || "", src: i.src || "contact", type: p.type || null });
        if (r.dup) dup++; else added++;
      });
      const total = c.S.order.length;
      return { ok: true, stay: true, msgs: [txt("📇 " + (added ? plural(added, "contact") + " came in" : "No new contacts") + (dup ? " · " + plural(dup, "was", "were") + " already here" : "") +
        ". You have *" + total + "* now.", { buttons: [btn("done", "That's all, go on"), btn("more", "Add more")] })] };
    },
  };

  /* Who is who: a first guess from each name (Store Builder's guessType: "… Kirana" a customer, "… Agency"
     a supplier, "… Driver" staff), confirmed in one tap, and a list with a radio per person to fix any. */
  function guessCounts(c) {
    const g = { shop: 0, supplier: 0, staff: 0, unsure: 0 };
    c.M.unsorted(c.S).forEach(function (p) { const k = c.M.guessType(p.name); if (k) g[k]++; else g.unsure++; });
    return g;
  }
  function peopleWidget(c) {
    return { type: "people", rows: c.S.order.map(function (id) { const p = c.S.people[id]; return { id: id, name: p.name, phone: p.phone, type: p.type || c.M.guessType(p.name) || "" }; }) };
  }
  N.sort = {
    section: "people",   // contacts and marking them go together: changing one asks both
    skip: function (c) { return !c.S.order.length; },
    answered: function (c) { return c.S.order.length > 0 && c.M.unsorted(c.S).length === 0; },
    ask: function (c) {
      const g = guessCounts(c), left = c.M.unsorted(c.S).length;
      if (!left) return [txt("Everyone is already marked: " + sortedLine(c) + ".", { buttons: [btn("ok", "Looks right"), btn("check", "Check the list")] })];
      return [txt("*Who is who?* I've sorted your " + plural(left, "contact") + " from their names:\n\n🏪 Customers: " + g.shop + "\n🚚 Suppliers: " + g.supplier + "\n👤 Staff: " + g.staff +
        (g.unsure ? "\n❔ Not sure: " + g.unsure : ""), { widget: peopleWidget(c), buttons: [btn("ok", "Looks right"), btn("check", "Check the list")] })];
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
        if (left) return { ok: true, stay: true, msgs: [txt(plural(left, "contact is", "contacts are") + " still not marked.", { widget: peopleWidget(c), buttons: [btn("rest", "Mark them customers"), btn("check", "Check the list")] })] };
        return { ok: true, msgs: [txt("Marked: " + sortedLine(c) + ".")] };
      }
      if (v === "check") return { ok: true, stay: true, open: "people", msgs: [] };
      if (v === "ok") {
        c.M.unsorted(c.S).forEach(function (p) { const k = c.M.guessType(p.name); if (k) p.type = k; });
        const left = c.M.unsorted(c.S).length;
        const names = c.M.unsorted(c.S).slice(0, 3).map(function (p) { return p.name; }).join(", ") + (left > 3 ? "…" : "");
        if (left) return { ok: true, stay: true, msgs: [txt((left === 1 ? "And the one I wasn't sure about — " : "And the " + left + " I wasn't sure about — ") + names + "?",
          { widget: peopleWidget(c), buttons: [btn("rest", "All customers"), btn("check", "Let me pick")] })] };
        return { ok: true, msgs: [txt("Marked: " + sortedLine(c) + ".")] };
      }
      if (v === "rest") {
        c.M.unsorted(c.S).forEach(function (p) { p.type = "shop"; });
        return { ok: true, msgs: [txt("Marked: " + sortedLine(c) + ".")] };
      }
      return { ok: false, msgs: [txt("Tap *Looks right*, or *Check the list* to change anyone.", { buttons: [btn("ok", "Looks right"), btn("check", "Check the list")] })] };
    },
  };
  function sortedLine(c) {
    const n = function (t) { return c.M.peopleOf(c.S, t).length; };
    return [n("shop") ? "🏪 " + plural(n("shop"), "customer") : "", n("supplier") ? "🚚 " + plural(n("supplier"), "supplier") : "", n("staff") ? "👤 " + n("staff") + " staff" : ""].filter(Boolean).join(" · ") || "nobody yet";
  }

  N.type = {
    section: "business",
    answered: function (c) { return !!c.S.store.type; },
    ask: function () { return [listMsg("*What is your business?*", "Your business", TYPES)]; },
    accept: function (c, i) {
      const r = i.value ? TYPES.find(function (x) { return x.v === i.value; }) : pickRow(TYPES, i.text);
      if (!r) return { ok: false, msgs: [listMsg("Choose one from the list — or type it, like *distributor*.", "Your business", TYPES)] };
      c.S.store.type = r.v;
      if (r.v !== "other") c.S.store.typeOther = "";
      return { ok: true };
    },
  };
  N.typeOther = {
    section: "business",
    skip: function (c) { return c.S.store.type !== "other"; },
    answered: function (c) { return !!c.S.store.typeOther; },
    ask: function () { return [txt("What do you call your business?", { compose: { type: "text", hint: "e.g. C&F agent" } })]; },
    accept: function (c, i) {
      if (!String(i.text || "").trim()) return { ok: false, msgs: [txt("Type it in a word or two.", { compose: { type: "text", hint: "e.g. C&F agent" } })] };
      c.S.store.typeOther = String(i.text).trim().slice(0, 60);
      return { ok: true };
    },
  };

  /* A dropdown here (owner: "a dropdown somewhere, a radio button somewhere"). */
  const WH = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];
  N.warehouses = {
    section: "business",
    answered: function (c) { return c.S.store.warehouses != null; },
    ask: function () { return [txt("*How many warehouses (godowns) do you have?*", { widget: { type: "select", label: "Warehouses", options: WH.map(function (n) { return { v: String(n), label: n === 0 ? "None" : String(n) }; }), ph: "Choose" } })]; },
    accept: function (c, i) {
      const raw = i.value != null ? i.value : i.text;
      const t = norm(raw);
      const n = /^(none|no|nahi|zero|koi nahi)$/.test(t) ? 0 : /^(one|ek)$/.test(t) ? 1 : /^(two|do)$/.test(t) ? 2 : /^(three|teen)$/.test(t) ? 3 : parseInt(t, 10);
      if (!(n >= 0 && n <= 999)) return { ok: false, msgs: [txt("Just the number — like *2*.", { widget: N.warehouses.ask()[0].widget })] };
      c.S.store.warehouses = n;
      return { ok: true };
    },
  };

  N.gst = {
    section: "business",
    answered: function (c) { return !!c.S.store.gst; },
    ask: function () { return [txt("*Your GST number?* (You can add it later.)", { compose: { type: "upper", hint: "e.g. 27AAPFG1234K1Z5" }, buttons: [btn("later", "I'll add it later")] })]; },
    accept: function (c, i) {
      if (i.value === "later" || SKIP.test(i.text || "") || yesNo(i.text) === false) return { ok: true };
      const g = String(i.text || "").toUpperCase().replace(/\s+/g, "");
      if (!c.M.gstOk(g)) return { ok: false, msgs: [txt("That doesn't look like a GST number — it's 15 characters, like *27AAPFG1234K1Z5*. Try again, or add it later.", { compose: { type: "upper", hint: "e.g. 27AAPFG1234K1Z5" }, buttons: [btn("later", "I'll add it later")] })] };
      c.S.store.gst = g;
      return { ok: true };
    },
  };

  /* How your day runs: Store Builder's six questions (rules.*) and its note. */
  function yn(id, path, question, done) {
    N[id] = {
      section: "day",
      answered: function (c) { return c.S.rules[path] != null; },
      ask: function (c) { return [txt((done ? done(c) : "") + question, { buttons: [btn("yes", "Yes"), btn("no", "No")] })]; },
      accept: function (c, i) {
        const v = i.value ? i.value === "yes" : yesNo(i.text);
        if (v == null) return { ok: false, msgs: [txt("Yes or no?", { buttons: [btn("yes", "Yes"), btn("no", "No")] })] };
        c.S.rules[path] = v;
        return { ok: true };
      },
    };
  }
  yn("routes", "routes", "*Do your trucks go on fixed route days?*", function () { return "Now a few questions about how your day runs.\n\n"; });
  yn("selfOrder", "selfOrder", "*Do customers order on the phone themselves?*");
  yn("partPay", "partPay", "*Do customers pay a bill in parts?*");

  N.payMethods = {
    section: "day",
    answered: function (c) { return c.S.rules.payMethods.length > 0; },
    ask: function () { return [txt("*How do customers pay you?* Tick all that apply.", { widget: { type: "multi", options: PAYS.map(function (p) { return { v: p.v, label: p.label }; }) } })]; },
    accept: function (c, i) {
      let vs = i.values;
      if (!vs && i.text) vs = norm(i.text).split(/[\s,]+|\band\b|\baur\b/).map(function (w) { const r = pickRow(PAYS, w); return r && r.v; }).filter(Boolean);
      vs = (vs || []).filter(function (v, k, a) { return a.indexOf(v) === k && PAYS.some(function (p) { return p.v === v; }); });
      if (!vs.length) return { ok: false, msgs: [txt("Tick at least one — or type them, like *cash, UPI*.", N.payMethods.ask()[0])] };
      c.S.rules.payMethods = vs;
      if (vs.indexOf("other") < 0) c.S.rules.payMethodsOther = "";
      return { ok: true };
    },
  };
  function otherText(id, path, check, q) {
    N[id] = {
      section: "day",
      skip: function (c) { return !check(c); },
      answered: function (c) { return !!c.S.rules[path]; },
      ask: function () { return [txt(q, { compose: { type: "text", hint: "In a few words" } })]; },
      accept: function (c, i) {
        if (!String(i.text || "").trim()) return { ok: false, msgs: [txt(q, { compose: { type: "text", hint: "In a few words" } })] };
        c.S.rules[path] = String(i.text).trim().slice(0, 120);
        return { ok: true };
      },
    };
  }
  otherText("payOther", "payMethodsOther", function (c) { return c.S.rules.payMethods.indexOf("other") >= 0; }, "Which other way do they pay?");
  function radio(id, path, question, title, rows) {
    N[id] = {
      section: "day",
      answered: function (c) { return c.S.rules[path] != null; },
      ask: function () { return [listMsg(question, title, rows)]; },
      accept: function (c, i) {
        const r = i.value ? rows.find(function (x) { return x.v === i.value; }) : pickRow(rows, i.text);
        if (!r) return { ok: false, msgs: [listMsg("Choose one from the list.", title, rows)] };
        c.S.rules[path] = r.v;
        return { ok: true };
      },
    };
  }
  radio("returns", "returns", "*When damaged goods come back, you…*", "Damaged goods", RETURNS);
  otherText("returnsOther", "returnsOther", function (c) { return c.S.rules.returns === "other"; }, "What do you do with them?");
  radio("morning", "morning", "*What's the first thing you look at each morning?*", "First thing each morning", MORNING);
  otherText("morningOther", "morningOther", function (c) { return c.S.rules.morning === "other"; }, "What is it?");
  N.note = {
    section: "day",
    answered: function (c) { return !!c.S.rules.note || c.F.noteSeen; },
    ask: function () { return [txt("*Anything else about your day we should know?*", { compose: { type: "text", hint: "Type it, or skip" }, buttons: [btn("none", "Nothing more")] })]; },
    accept: function (c, i) {
      c.F.noteSeen = true;
      if (i.value === "none" || SKIP.test(i.text || "") || yesNo(i.text) === false) return { ok: true };
      c.S.rules.note = String(i.text || "").trim().slice(0, 600);
      return { ok: true };
    },
  };

  /* Products (the owner, 5 Oct 2026): any file or image → Claude → products in our catalogue's shape →
     shown back → added. Claude is parked as tech debt in this version (TD-1): a spreadsheet is read by
     the discovery stand-in, a photo is kept for the team and never guessed (extract-standin.js). */
  function productsCard(c, res) {
    const rows = res.products || [];
    const m = rows.filter(function (p) { return p.match; }).length, fresh = rows.length - m;
    const noPrice = rows.filter(function (p) { return p.sell == null; }).length;
    const from = (res.files || []).filter(function (f) { return f.rows; }).map(function (f) { return f.name; });
    return txt((res.sample ? "🧪 *A sample read* — not your file: this is what reading a rate list gives.\n\n" : "") +
      "I read *" + plural(rows.length, "product") + "* from " + (from.join(", ") || "your file") + ":\n✅ " + m + " match our catalogue" +
      (fresh ? "\n🆕 " + fresh + " new" : "") + (noPrice ? "\n⚠️ " + plural(noPrice, "has", "have") + " no price — the team will ask you" : ""),
      { widget: { type: "products", rows: rows }, buttons: [btn("addall", "Add all " + rows.length), btn("check", "Check them"), btn("another", "Send another file")] });
  }
  function unreadableMsg(res) {
    const imgs = (res.files || []).filter(function (f) { return f.unreadable === "claude_not_connected"; });
    const other = (res.files || []).filter(function (f) { return f.unreadable && f.unreadable !== "claude_not_connected"; });
    const lines = [];
    if (imgs.length) lines.push("📷 I can't read " + (imgs.length === 1 ? "that photo" : "those " + imgs.length + " photos") + " in this version — reading pictures needs Claude, which isn't connected yet. I've kept " + (imgs.length === 1 ? "it" : "them") + " for the FoodBridge team; they'll add those products for you.");
    if (other.length) lines.push("📄 I found no product rows in " + other.map(function (f) { return f.name; }).join(", ") + ". I've kept it for the team.");
    return txt(lines.join("\n\n"), { buttons: [btn("sample", "See a sample read"), btn("another", "Send a spreadsheet"), btn("done", "Go on")] });
  }
  N.products = {
    section: "products",
    answered: function (c) { return Object.keys(c.S.items).length > 0 || c.F.productsSeen; },
    ask: function () {
      return [txt("*Now your products.* Send me anything you have — a rate list, a price-list photo, your Tally stock export, an Excel — and I'll read it for you.\n\nTap 📎 to send it.",
        { widget: { type: "files", purpose: "products" }, buttons: [btn("sample", "Try a sample rate list"), btn("later", "I'll send it later")] })];
    },
    accept: function (c, i) {
      c.F.productsSeen = true;
      if (i.extract) {
        const res = i.extract;
        if (res.products && res.products.length) { c.F.prod = res; return { ok: true, stay: true, msgs: [productsCard(c, res)] }; }
        return { ok: true, stay: true, msgs: [unreadableMsg(res)] };
      }
      if (i.products) {   // from Check them: the rows he kept, as he edited them
        const n = applyProducts(c, i.products.rows || []);
        c.F.prod = null;
        return { ok: true, stay: true, msgs: [addedMsg(c, n)] };
      }
      const v = i.value || (SKIP.test(i.text || "") ? "done" : /sample/i.test(i.text || "") ? "sample" : yesNo(i.text) === true && c.F.prod ? "addall" : null);
      if (v === "sample") return { ok: true, stay: true, hook: "sampleExtract" };
      if (v === "addall" && c.F.prod) { const n = applyProducts(c, c.F.prod.products); c.F.prod = null; return { ok: true, stay: true, msgs: [addedMsg(c, n)] }; }
      if (v === "check" && c.F.prod) return { ok: true, stay: true, open: "products", msgs: [] };
      if (v === "another" || v === "more") return { ok: true, stay: true, msgs: [txt("Send it with 📎 — Excel, CSV, a photo or a PDF.", { widget: { type: "files", purpose: "products" } })] };
      if (v === "done" || v === "later") return { ok: true };
      return { ok: false, msgs: [txt("Send the file with 📎 — or tap *I'll send it later*.", { buttons: [btn("sample", "Try a sample rate list"), btn("later", "I'll send it later")] })] };
    },
  };
  function addedMsg(c, n) {
    const its = Object.keys(c.S.items).length, cos = Object.keys(c.S.companies).length;
    return txt("📦 Added " + plural(n, "product") + ". You have *" + its + "* now" + (cos ? ", from " + plural(cos, "company", "companies") : "") + ".",
      { buttons: [btn("another", "Send another file"), btn("done", "That's all, go on")] });
  }
  /* Rows (Claude's shape) → Store Builder items. A match is the catalogue item with his MRP and rate;
     a row with no match is his own new item. Both are marked as his (export: "Owner"). */
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

  /* Papers: Store Builder's Files step -- a khata page, a route chart, bills -- kept as they came. */
  N.files = {
    section: "files",
    answered: function (c) { return c.F.filesSeen; },
    ask: function (c) {
      return [txt("*Anything on paper that would help* — a khata page, your route chart, bills? Send photos with 📎" +
        (c.F.device === "phone" ? "." : ", or scan the code to send them from your phone."),
        { widget: { type: "files", purpose: "papers", qr: c.F.device !== "phone", code: c.F.code2 || "" }, buttons: [btn("none", "Nothing more")] })];
    },
    accept: function (c, i) {
      c.F.filesSeen = true;
      if (i.papers && i.papers.length) {
        const n = c.S.papers.filter(function (p) { return p.step === "finish"; }).length;
        return { ok: true, stay: true, msgs: [txt("📎 Got " + plural(i.papers.length, "file") + " (" + n + " so far) — the team will see " + (i.papers.length === 1 ? "it as it is." : "them as they are."),
          { buttons: [btn("none", "That's all, go on"), btn("more", "Send more")] })] };
      }
      if (i.value === "more") return { ok: true, stay: true, msgs: [txt("Send them with 📎.")] };
      if (i.value === "none" || SKIP.test(i.text || "") || yesNo(i.text) === false) return { ok: true };
      return { ok: false, msgs: [txt("Send photos with 📎, or tap *Nothing more*.", { buttons: [btn("none", "Nothing more")] })] };
    },
  };

  /* The store, summed up (the owner: "let Claude define the whole situation of the store"). The facts
     are the model's own counts and gaps -- proven numbers only. In production Claude words them (TD-1,
     claude/store-summary.md); here they are worded by the template below. */
  N.summary = {
    section: null,
    ask: function (c) {
      const f = facts(c);
      return [txt("Here's your store, " + first(c.S.store.owner) + ":", { widget: { type: "summary", facts: f } }),
        txt(summaryText(f), { buttons: [btn("create", "Create my store"), btn("change", "Change something")] })];
    },
    accept: function (c, i) {
      const v = i.value || (/create|build|bana|yes|ok|haan|done/i.test(i.text || "") ? "create" : /change|edit|badal/i.test(i.text || "") ? "change" : null);
      if (v === "create") return { ok: true, hook: "build", stay: true };
      if (v === "change") return { ok: true, stay: true, msgs: [listMsg("What would you like to change?", "Change", SECTIONS.map(function (s) { return { v: "edit:" + s.id, label: s.label }; }))] };
      if (v && v.indexOf("edit:") === 0) {
        const s = SECTIONS.find(function (x) { return x.id === v.slice(5); });
        if (s) { c.F.returnTo = "summary"; c.F.resume = false; return { ok: true, goto: s.first }; }
      }
      return { ok: false, msgs: [txt("Tap *Create my store* when it looks right.", { buttons: [btn("create", "Create my store"), btn("change", "Change something")] })] };
    },
  };

  /* After the build (decision 1, 5 Oct 2026: it still goes to the customer success team): the store
     is created, and if it has the basics -- a customer and a product -- he can start using it now. */
  N.done = {
    section: null,
    ask: function (c) { return created(c); },
    /* "Add customers" / "Add products" after a build without the basics: that section, then the summary again. */
    accept: function (c, i) {
      const s = i.value && i.value.indexOf("edit:") === 0 && SECTIONS.find(function (x) { return x.id === i.value.slice(5); });
      if (!s) return { ok: false, msgs: [] };
      c.F.returnTo = "summary"; c.F.resume = false;
      return { ok: true, goto: s.first };
    },
  };

  const ORDER = ["name", "mobile", "sync", "contacts", "sort", "type", "typeOther", "warehouses", "gst",
    "routes", "selfOrder", "partPay", "payMethods", "payOther", "returns", "returnsOther", "morning", "morningOther", "note",
    "products", "files", "summary"];

  /* ── the campaign (decision 4: a simple one now -- pick customers, a WhatsApp message, held) ── */
  const CMP_WHAT = [
    { v: "newproduct", label: "New products in stock" }, { v: "offer", label: "This week's rates" },
    { v: "festival", label: "Festival greetings" }, { v: "own", label: "I'll write my own" },
  ];
  function festival(now) { const m = new Date(now).getMonth(); return m === 9 || m === 10 ? "Diwali" : m === 0 ? "Lohri and Makar Sankranti" : m === 2 ? "Holi" : "the festival"; }
  function campaignText(c) {
    const who = c.S.store.owner || "", sign = "\n\n— " + who + (c.S.store.mobile ? ", " + c.S.store.mobile : "");
    const names = c.M.chosenItems(c.CAT, c.S).slice(0, 3).map(function (it) { return it.name + (it.pack ? " " + it.pack : ""); });
    const k = c.F.cmp.what;
    if (k === "newproduct") return "Namaste 🙏 New in stock with us: " + (names.join(", ") || "fresh stock this week") + ". Reply here to order." + sign;
    if (k === "offer") return "Namaste 🙏 Special rates this week" + (names.length ? " on " + names.join(", ") : "") + ". Reply here for the rate list or to order." + sign;
    if (k === "festival") return "Namaste 🙏 Wishing you and your family a very happy " + festival(c.now) + "! Thank you for your business." + sign;
    return c.F.cmp.text || "";
  }
  N["cmp.who"] = {
    ask: function (c) {
      const shops = c.M.peopleOf(c.S, "shop"), big = shops.filter(function (p) { return p.big; });
      const rows = [{ v: "all", label: "All customers", desc: plural(shops.length, "customer") }];
      if (big.length) rows.push({ v: "big", label: "Big customers ⭐", desc: plural(big.length, "customer") });
      rows.push({ v: "pick", label: "Pick customers", desc: "Choose who gets it" });
      return [listMsg("📣 *A campaign on WhatsApp.* Who should get it?", "Send it to", rows)];
    },
    accept: function (c, i) {
      const shops = c.M.peopleOf(c.S, "shop");
      if (i.pick) { c.F.cmp.to = i.pick.filter(function (id) { return c.S.people[id]; }); if (!c.F.cmp.to.length) return { ok: false, msgs: [txt("Pick at least one customer.")] }; return { ok: true, goto: "cmp.what" }; }
      const v = i.value || (/all|sab/i.test(i.text || "") ? "all" : /big|bade/i.test(i.text || "") ? "big" : /pick|choose|chun/i.test(i.text || "") ? "pick" : null);
      if (v === "all") { c.F.cmp.to = shops.map(function (p) { return p.id; }); return { ok: true, goto: "cmp.what" }; }
      if (v === "big") { c.F.cmp.to = shops.filter(function (p) { return p.big; }).map(function (p) { return p.id; }); return { ok: true, goto: "cmp.what" }; }
      if (v === "pick") return { ok: true, stay: true, open: "pick", msgs: [] };
      return { ok: false, msgs: N["cmp.who"].ask(c) };
    },
  };
  N["cmp.what"] = {
    ask: function (c) { return [listMsg("To " + plural(c.F.cmp.to.length, "customer") + ". *What's it about?*", "The message", CMP_WHAT)]; },
    accept: function (c, i) {
      const r = i.value ? CMP_WHAT.find(function (x) { return x.v === i.value; }) : pickRow(CMP_WHAT.map(function (x) { return Object.assign({ keys: [x.v] }, x); }), i.text);
      if (!r) return { ok: false, msgs: N["cmp.what"].ask(c) };
      c.F.cmp.what = r.v;
      return { ok: true, goto: r.v === "own" ? "cmp.own" : "cmp.check" };
    },
  };
  N["cmp.own"] = {
    ask: function () { return [txt("Type the message — I'll show it back before anything is queued.", { compose: { type: "text", hint: "Your message" } })]; },
    accept: function (c, i) {
      if (!String(i.text || "").trim()) return { ok: false, msgs: N["cmp.own"].ask(c) };
      c.F.cmp.text = String(i.text).trim().slice(0, 1000);
      c.F.cmp.what = "own";
      return { ok: true, goto: "cmp.check" };
    },
  };
  N["cmp.check"] = {
    ask: function (c) {
      c.F.cmp.text = campaignText(c);
      return [txt("Here's the message for *" + plural(c.F.cmp.to.length, "customer") + "*:"), txt(c.F.cmp.text, { quote: true }),
        txt("Queue it?", { buttons: [btn("queue", "Queue it"), btn("own", "Write my own"), btn("cancel", "Cancel")] })];
    },
    accept: function (c, i) {
      const v = i.value || (yesNo(i.text) === true ? "queue" : yesNo(i.text) === false ? "cancel" : null);
      if (v === "queue") return { ok: true, hook: "queueCampaign", stay: true };
      if (v === "own") return { ok: true, goto: "cmp.own" };
      if (v === "cancel") { c.F.cmp = null; c.F.at = "done"; return { ok: true, stay: true, msgs: [txt("Cancelled — nothing was queued."), txt("", nextList(c))] }; }
      return { ok: false, msgs: [txt("Queue it?", { buttons: [btn("queue", "Queue it"), btn("own", "Write my own"), btn("cancel", "Cancel")] })] };
    },
  };

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
  /* After the page ran a hook (draftLookup, build, sampleExtract, queueCampaign). */
  function resume(c, hook, result) {
    if (hook === "draftLookup") return advance(c);
    if (hook === "build") { c.F.built = result; c.F.at = "done"; c.F.returnTo = null; return created(c); }
    if (hook === "queueCampaign") { const n = c.F.cmp.to.length; c.F.cmp = null; c.F.at = "done";
      return [txt("📤 *Queued for " + plural(n, "customer") + ".*\nNo WhatsApp sender is connected in this version, so it waits in your outbox — nothing reaches a customer yet."), txt("", nextList(c, "What next?"))]; }
    return [];
  }
  function back(c) {
    const i = ORDER.indexOf(c.F.at);
    for (let k = i - 1; k >= 0; k--) { const id = ORDER[k]; if (id !== "sync" && !(N[id].skip && N[id].skip(c))) return [txt("Sure — back one question.")].concat(ask(c, id)); }
    return [txt("This is the first question.")].concat(ask(c, c.F.at));
  }

  /* ── the store, summed up ──────────────────────────────────────────────── */
  const GAP_WORDS = { noMobile: "your mobile", noGst: "a GST number that looks right", unsorted: "contacts to mark", noShops: "customers",
    shopNoPhone: "customers' mobile numbers", noSuppliers: "suppliers", rulesOpen: "daily-work answers" };
  function facts(c) {
    const S = c.S, M = c.M, its = M.chosenItems(c.CAT, S);
    const P = M.progress(c.CAT, S);
    const gaps = M.missing(c.CAT, S).map(function (g) { return { key: g.key, n: g.n, label: GAP_WORDS[g.key] || g.key }; });
    const noPrice = its.filter(function (it) { return S.items[it.id] && S.items[it.id].sell == null && !(S.items[it.id].touched || {}).sell; }).length;
    const typeLabel = S.store.type === "other" ? S.store.typeOther || "Other" : (TYPES.find(function (t) { return t.v === S.store.type; }) || {}).label || "";
    return {
      owner: S.store.owner || "", mobile: S.store.mobile || "", type: typeLabel, warehouses: S.store.warehouses, gst: S.store.gst || "",
      products: its.length, fromCatalogue: its.filter(function (it) { return !it.custom; }).length, newProducts: its.filter(function (it) { return it.custom; }).length,
      companies: Object.keys(S.companies).length, noPrice: noPrice,
      customers: M.peopleOf(S, "shop").length, suppliers: M.peopleOf(S, "supplier").length, staff: M.peopleOf(S, "staff").length, unsorted: M.unsorted(S).length,
      answered: P.rules.n, of: M.RULES_N, files: S.papers.length, gaps: gaps,
      /* a photo or PDF sent at Products that nobody could read yet (Claude is TD-1): the team reads it */
      unreadFiles: S.papers.filter(function (p) { return p.step === "items" && /^image\/|pdf/.test(p.mime || ""); }).length,
    };
  }
  function summaryText(f) {
    const lines = [];
    lines.push("🏷️ " + [f.type || "Business not said", f.warehouses != null ? (f.warehouses === 0 ? "no warehouse" : plural(f.warehouses, "warehouse")) : "", f.gst ? "GST ✓" : "no GST yet"].filter(Boolean).join(" · "));
    lines.push("📦 " + (f.products ? plural(f.products, "product") + (f.newProducts ? " (" + f.fromCatalogue + " from our catalogue, " + f.newProducts + " new)" : "") : "No products yet"));
    lines.push("👥 " + (f.customers + f.suppliers + f.staff ? [plural(f.customers, "customer"), plural(f.suppliers, "supplier"), f.staff + " staff"].join(" · ") : "No contacts yet"));
    lines.push("🗓️ Your day: " + f.answered + " of " + f.of + " answered");
    if (f.files) lines.push("📎 " + plural(f.files, "file") + " for the team");
    const left = f.gaps.map(function (g) { return g.n > 1 ? g.n + " " + g.label : g.label; });
    if (f.noPrice) left.push(plural(f.noPrice, "price"));
    if (f.unreadFiles) left.push("the products in " + (f.unreadFiles === 1 ? "your photo" : f.unreadFiles + " photos"));
    lines.push("", left.length ? "The FoodBridge team will follow up on: " + left.join(", ") + "." : "Nothing is missing. 🎉");
    return lines.join("\n");
  }
  function ready(S, M) { return M.peopleOf(S, "shop").length > 0 && Object.keys(S.items).length > 0; }

  /* The four next actions (the owner: create an order, a collection request on WhatsApp, an order for
     tomorrow, a campaign). Decision 1: they open over the Vasu Foods demo while the team finishes his. */
  const NEXT = [
    { n: 1, id: "next:order", label: "Create an order", desc: "A new sales order" },
    { n: 2, id: "next:tomorrow", label: "Order for tomorrow", desc: "Book tomorrow's delivery" },
    { n: 3, id: "next:collect", label: "Collection request", desc: "Ask customers to pay, on WhatsApp" },
    { n: 4, id: "next:campaign", label: "Send a campaign", desc: "One WhatsApp message to many customers" },
  ];
  function nextList(c, lead) {
    return { text: (lead || "What would you like to do next?") + "\n" + NEXT.map(function (x) { return x.n + "  " + x.label; }).join("\n"),
      list: { button: "Choose", title: "What next?", rows: NEXT }, numbered: NEXT.map(function (x) { return { id: x.id, label: x.label }; }),
      buttons: [{ id: "next:order", label: "Create an order" }, { id: "next:collect", label: "Collection request" }, { id: "next:campaign", label: "Send a campaign" }] };
  }
  function created(c) {
    const out = [{ kind: "sticker", image: "proud.png", alt: "Done" },
      txt("✅ *Your store is created, " + first(c.S.store.owner) + "!*\n" + (c.F.built && c.F.built.sent === false
        ? "FoodBridge can't be reached just now, so your setup is saved on this device and goes to the FoodBridge team by itself as soon as it can."
        : "I've sent your setup to the FoodBridge team. They'll check it with you and finish anything that's left."))];
    if (ready(c.S, c.M)) out.push(txt("", nextList(c)));
    else out.push(txt("To start selling, you need at least one customer and one product.", { buttons: [btn("edit:people", "Add customers"), btn("edit:products", "Add products")] }));
    return out;
  }

  /* Whose store this conversation is (5 Oct 2026, owner: the team's inbox and the outbox "only appear if found
     a store already"): nobody until the mobile is a valid 10 digits; then that mobile. Builds and held campaigns
     belong to the mobile they were made under, and show only to it. */
  function ownerOf(S, M) { return M.storeReady(S) ? M.phone10(S.store.mobile) : ""; }
  function owned(list, mobile, M, key) {
    if (!mobile) return [];
    return (list || []).filter(function (x) { const v = key(x); return v && M.phone10(v) === mobile; });
  }

  const API = { ownerOf: ownerOf, owned: owned, N: N, ORDER: ORDER, SECTIONS: SECTIONS, NEXT: NEXT, TYPES: TYPES, PAYS: PAYS, RETURNS: RETURNS, MORNING: MORNING, KIND: KIND,
    ask: ask, step: step, advance: advance, resume: resume, back: back, applies: applies,
    facts: facts, summaryText: summaryText, ready: ready, nextList: nextList, created: created, applyProducts: applyProducts, campaignText: campaignText,
    yesNo: yesNo, pickRow: pickRow, guessCounts: guessCounts, txt: txt };
  if (NODE) module.exports = API;
  else root.ASSIST_FLOW = API;
})(typeof window !== "undefined" ? window : globalThis);
