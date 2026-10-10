/* Store Activation discovery — the screens (2026-10-10, v1).
   One page, one route per screen (#home, #items, …), state in this browser's localStorage. The rules live in engine.js.
   Two promises this prototype keeps, both from the owner:
     - every step happens on the Getting started page and its step screens;
     - the FoodBridge assistant (floating, on every page) only points to that page. It never runs a step.
   No real API calls: an uploaded file is not read; the seed's rate list stands in for whatever was chosen. */
(function () {
  "use strict";
  var E = window.ActivationEngine, SEED = window.SEED;
  var KEY = "store-activation-discovery-v1";
  var MASCOT = "activation/mascot.png";
  var app = document.getElementById("app");

  // ---------- state ----------
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) return JSON.parse(raw); } catch (e) { /* private window: start fresh */ }
    return E.initialState();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* the prototype still works for this tab */ } }
  var s = load();
  var ui = { menu: false, panel: false, sheet: false, chat: [], q: 0, draft: null, ticked: null, dmode: "driver", driverId: null, note: "" };

  // ---------- seed lookups ----------
  var itemsById = {}; SEED.rateList.items.forEach(function (i) { itemsById[i.id] = i; });
  var contactsById = {}; SEED.contacts.forEach(function (c) { contactsById[c.id] = c; });
  var questions = SEED.rateList.questions;

  function storeItems() {
    if (s.items.status !== "done") return [];
    var ids = s.items.source === "common" ? SEED.commonItems : SEED.rateList.items.map(function (i) { return i.id; });
    return ids.map(function (id) { return itemsById[id]; }).filter(function (i) {
      return !(i.duplicateOf && s.items.answers.q2 !== "Different");
    }).map(function (i) {
      var price = i.price;
      if (i.id === "i02") price = typeof s.items.answers.q1 === "number" ? s.items.answers.q1 : null;
      return { id: i.id, name: i.name, unit: i.unit, price: price };
    });
  }
  function customers() { return s.customers.ids.map(function (id) { return contactsById[id]; }); }
  function orderCustomer() { return s.order ? contactsById[s.order.customerId] : null; }
  function rupees(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

  // ---------- small pieces ----------
  var IC = {
    close: '<path d="M18 6L6 18M6 6l12 12"/>', menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    check: '<path d="M20 6L9 17l-5-5"/>', chev: '<path d="M9 18l6-6-6-6"/>', back: '<path d="M15 18l-6-6 6-6"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    cam: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>', mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/>',
    tree: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M5 8v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M12 12v4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>'
  };
  function ic(n, size, sw) { return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + "</svg>"; }
  function ring(pct, size, inner, thick, bg) {
    thick = thick || 6;
    return '<span class="ring" style="width:' + size + "px;height:" + size + "px;background:conic-gradient(var(--g) 0 " + pct + "%, var(--line) " + pct + '% 100%)">' +
      '<span style="width:' + (size - 2 * thick) + "px;height:" + (size - 2 * thick) + "px" + (bg ? ";background:" + bg : "") + '">' + inner + "</span></span>";
  }
  function frac(n, fs) { return '<b style="font-size:' + fs + 'px">' + n + "/6</b>"; }
  function face(size) { return '<span class="face" style="width:' + size + "px;height:" + size + 'px"><img src="' + MASCOT + '" alt=""></span>'; }
  function btn(label, act, extra) { return '<button class="btn" data-act="' + act + '"' + (extra || "") + ">" + label + "</button>"; }
  function go(label, href, icon) { return '<a class="btn" href="' + href + '">' + (icon ? ic(icon) : "") + esc(label) + "</a>"; }
  function title(t, p) { return '<div class="title"><h1>' + esc(t) + "</h1>" + (p ? "<p>" + p + "</p>" : "") + "</div>"; }
  function foot(main, link) { return '<div class="foot">' + (main || "") + (link || "") + "</div>"; }
  function phone(inner, extra) { return '<div class="phone">' + inner + (extra || "") + "</div>"; }
  function stepHead(n) {
    var segs = ""; for (var i = 0; i < 6; i++) segs += "<i" + (i < n ? ' class="on"' : "") + "></i>";
    return '<div class="stephead"><div class="row"><a class="iconbtn" href="#home" aria-label="Close, back to Getting started">' + ic("close", 22) + "</a><span>Step " + n + ' of 6</span></div><div class="segs" role="img" aria-label="Step ' + n + ' of 6">' + segs + "</div></div>";
  }
  // A confirmation stays until the owner moves on. s.flash is either a string (show it on the next screen) or
  // { text, route } (show it when that screen is next open: the driver's "Delivered" is for the owner's home).
  function takeFlash(route) {
    if (!s.flash) return;
    var f = typeof s.flash === "string" ? { text: s.flash, route: route } : s.flash;
    if (f.route !== route) return;
    ui.toast = { text: f.text, route: route }; s.flash = null; save();
  }
  function flashHtml() {
    var r = (location.hash || "#wa-link").slice(1);
    return ui.toast && ui.toast.route === r ? '<div class="toast" role="status">' + ic("check", 18, 3) + "<span>" + esc(ui.toast.text) + "</span></div>" : "";
  }

  // ---------- the platform's pieces: avatar ring, profile menu, floating assistant, its panel ----------
  function avatarRing() {
    var p = E.progress(s);
    var inner = '<span style="width:100%;height:100%;display:grid;place-items:center;background:var(--g);color:#fff">' + ic("user", 18) + "</span>";
    return p.done < 6 ? ring(p.percent, 44, inner, 4) : '<span class="ring" style="width:40px;height:40px;overflow:hidden">' + inner + "</span>";
  }
  function avatar() {
    var p = E.progress(s);
    var label = p.done < 6 ? "Profile, getting started " + p.done + " of 6" : "Profile";
    return '<button class="iconbtn" style="width:auto;height:auto" data-act="menu" aria-label="' + label + '" aria-expanded="' + ui.menu + '">' + avatarRing() + "</button>";
  }
  function nextTitle() { var n = E.nextStep(s); return n ? nextText(n).title : ""; }
  function menu() {
    if (!ui.menu) return "";
    var p = E.progress(s);
    var gs = p.done < 6 ? '<a class="gs" href="#home">' + ring(p.percent, 44, frac(p.done, 12), 4) + "<span><b>Getting started</b><small>Next: " + esc(nextTitle().toLowerCase()) + "</small></span>" + ic("chev", 18) + "</a>" : "";
    return '<div class="menu" role="menu">' + gs +
      '<button role="menuitem" data-act="noop">' + ic("tree") + "My Network</button>" +
      '<button role="menuitem" data-act="noop">' + ic("gear") + "Edit Profile</button>" +
      '<button role="menuitem" class="out" data-act="noop">' + ic("logout") + "Logout</button></div>";
  }
  function appHead() {
    return '<div class="apphead"><button class="iconbtn" data-act="noop" aria-label="Menu">' + ic("menu", 22) + '</button><span class="who"><b>' + esc(SEED.store.name) + "</b><span>" + esc(SEED.store.owner) + " · Admin</span></span>" + avatar() + menu() + "</div>";
  }
  function fab(bubble, lift) {
    var p = E.progress(s);
    var f = '<img src="' + MASCOT + '" alt="" style="width:62px;height:62px;object-fit:cover;object-position:50% 8%">';
    return '<button class="fab" data-act="panel" aria-label="FoodBridge assistant"' + (lift ? ' style="bottom:' + lift + 'px"' : "") + ">" + (bubble ? '<span class="bub">' + esc(bubble) + "</span>" : "") +
      ring(p.done < 6 ? p.percent : 0, 72, f, 5, "var(--face)") + "</button>";
  }
  function panel() {
    if (!ui.panel) return "";
    var p = E.progress(s), n = E.nextStep(s);
    var top = n
      ? '<div class="card next"><div class="head">' + ring(p.percent, 56, frac(p.done, 14), 5) + "<span><small>Next step</small><strong>" + esc(nextText(n).title) + "</strong></span></div><p>It happens on your Getting started page.</p>" +
        '<a class="btn" href="#home" data-act="close-panel">Open Getting started</a></div>'
      : '<div class="card"><p>Your store is all set. Ask me anything, I\'ll show you where it is.</p></div>';
    var chat = ui.chat.map(function (m) {
      return m.me ? '<div class="me">' + esc(m.text) + "</div>"
        : '<div class="bot"><span>' + esc(m.text) + '</span><a href="#home" data-act="close-panel">Open Getting started</a></div>';
    }).join("");
    return '<div class="panel" role="dialog" aria-label="FoodBridge assistant"><div class="ph">' + face(44) + '<b>FoodBridge assistant</b><button class="iconbtn" data-act="close-panel" aria-label="Close">' + ic("close", 22) + "</button></div>" +
      '<div class="body">' + top + '<div class="chat">' + chat + "</div>" +
      '<form class="ask" data-act="ask" style="margin-top:auto"><label class="sr" for="ask">Ask the assistant</label><input id="ask" autocomplete="off" placeholder="Ask me anything"><button type="submit" aria-label="Send">' + ic("send", 20) + "</button></form></div></div>";
  }
  function answer(q) {
    var id = E.topicFor(q);
    if (!id) return "I can help you find your way. Everything for getting started is on your Getting started page.";
    var st = E.step(id), n = E.stepNumber(id);
    if (E.isDone(s, id)) return "That's step " + n + ", “" + st.title + "”. You've done it. You can see it on your Getting started page.";
    if (E.isLocked(s, id)) return "That's step " + n + ", “" + st.title + "”. It opens " + E.lockNote(s, id) + ", on your Getting started page.";
    return "That's step " + n + ", “" + st.title + "”. You do it on your Getting started page.";
  }

  // ---------- what the next step says ----------
  function nextText(n) {
    var pending = questions.filter(function (q) { return !(q.id in s.items.answers); }).length;
    var T = {
      items: { title: "Add your items", p: "Upload the rate list you already send to retailers. We read it for you.", label: "Start", href: "#items" },
      customers: { title: "Add your customers", p: "Most of them are already in your phone contacts.", label: "Start", href: "#customers" },
      order: { title: "Take your first order", p: "Pick a customer and tap the items. Takes a minute.", label: "Start", href: "#order" },
      deliver: { title: "Deliver it", p: "Send it with your driver, or mark it picked up.", label: "Start", href: "#deliver" },
      paid: { title: "Get paid", p: "Send a UPI payment link, or record cash.", label: "Start", href: "#paid" },
      plan: { title: "Daily plan on WhatsApp", p: "A plan each morning and a summary each evening.", label: "Start", href: "#plan" }
    };
    if (n.mode === "check") return { title: "Check " + pending + " item" + (pending === 1 ? "" : "s"), p: "Your rate list is read. " + pending + " thing" + (pending === 1 ? " needs" : "s need") + " you.", label: "Check now", href: "#check" };
    if (n.mode === "waiting") return s.items.status === "team"
      ? { title: "Our team is adding your items", p: "Ready within 2 hours. We'll tell you on WhatsApp.", label: null }
      : { title: "Reading your rate list", p: "It shows up here when it's done.", label: "See progress", href: "#reading" };
    return T[n.id];
  }

  function doneLine() {
    var parts = [];
    if (E.isDone(s, "items")) parts.push(s.items.count + " items");
    if (E.isDone(s, "customers")) parts.push(s.customers.ids.length + " customers");
    if (E.isDone(s, "order")) parts.push("first order");
    if (E.isDone(s, "deliver")) parts.push(s.delivery.status === "delivered" ? "delivered" : "with your driver");
    if (E.isDone(s, "paid")) parts.push(s.payment.received ? "paid" : "payment link sent");
    if (E.isDone(s, "plan")) parts.push("daily plan on");
    return parts.length ? '<div class="donel">' + ic("check", 18, 3) + "<span>" + esc(parts.join(" · ")) + "</span></div>" : "";
  }

  // ---------- screens ----------
  var V = {};

  V.home = function () {
    var p = E.progress(s), n = E.nextStep(s);
    if (!n) { location.replace("#done"); return ""; }
    var fresh = p.done === 0 && s.items.status === "none";
    var t = fresh ? title("Namaste, " + SEED.store.owner + " ji", "Let's set up your store. 6 quick steps, about 10 minutes.")
      : title(p.done >= 2 && !E.isDone(s, "order") ? "Your store is ready for orders" : "Getting started");
    var x = nextText(n);
    var reading = n.mode !== "waiting" && E.isWaiting(s, "items")
      ? '<a class="rowline" href="' + (s.items.status === "reading" ? "#reading" : "#home") + '" style="text-decoration:none;color:inherit">' + ic("file", 20) + '<span style="flex:1;font-size:15px">' + (s.items.status === "reading" ? "Reading your rate list…" : "Our team is adding your items") + "</span></a>" : "";
    var card = '<div class="card next"><div class="head">' + ring(p.percent, 56, frac(p.done, 14), 5) + "<span><small>Next step</small><strong>" + esc(x.title) + "</strong></span></div><p>" + x.p + "</p>" +
      (x.label ? '<a class="btn" href="' + x.href + '">' + esc(x.label) + "</a>" : "") + "</div>";
    var rest = E.STEPS.filter(function (st) { return st.id !== n.id && !E.isDone(s, st.id) && !E.isWaiting(s, st.id); });
    var list = rest.length ? '<span class="then">Then</span><div class="quiet">' + rest.map(function (st) {
      return '<div><span class="n">' + E.stepNumber(st.id) + '</span><span class="t">' + esc(st.title) + "</span>" + (E.isLocked(s, st.id) ? '<span class="note">' + esc(E.lockNote(s, st.id)) + "</span>" : "") + "</div>";
    }).join("") + "</div>" : "";
    return phone(appHead() + '<div class="body">' + flashHtml() + t + doneLine() + reading + card + list + '<div style="height:70px;flex:none"></div></div>', fab() + panel());
  };

  V.items = function () {
    var visual = '<div class="visual"><span class="col"><span class="pdf">PDF</span>Your rate list</span><span style="color:var(--g)">' + ic("chev", 28, 2.5) + '</span><span class="col">' + face(64) + "Your items</span></div>";
    var sheet = ui.sheet ? '<div class="dim" data-act="sheet-close"></div><div class="sheet" role="dialog" aria-label="Other ways to add items"><span class="grab"></span><h2>Other ways to add items</h2>' +
      '<button class="sheetrow" data-act="photo">' + ic("cam", 22) + "<span><b>Take a photo</b><span>Rate list, supplier bill or your shelf</span></span></button>" +
      '<button class="sheetrow" data-act="common">' + ic("list", 22) + "<span><b>Pick from common items</b><span>Start with " + SEED.commonItems.length + " everyday items, add more later</span></span></button>" +
      '<button class="sheetrow" data-act="team">' + ic("users", 22) + "<span><b>Let our team do it</b><span>Send photos; ready within 2 hours</span></span></button>" +
      '<button class="link quiet" data-act="sheet-close">Cancel</button></div>' : "";
    return phone(stepHead(1) + '<div class="body">' + title("Add your rate list", "The same PDF, Excel or photo you send retailers. We turn it into your item list.") + visual +
      '<p class="muted">Prices can be added later. You can keep working while we read it.</p>' +
      '<input type="file" id="pick-file" class="sr" accept=".pdf,.xls,.xlsx,.csv,image/*" data-bind="file"><input type="file" id="pick-photo" class="sr" accept="image/*" capture="environment" data-bind="file"></div>' +
      foot(btn(ic("file") + "Choose file", "pick"), '<button class="link" data-act="sheet">No file? Other ways</button>'), sheet);
  };

  V.reading = function () {
    if (s.items.status === "done") { location.replace("#home"); return ""; }
    if (s.items.status === "check") {
      return phone(stepHead(1) + '<div class="body">' + title("Your items are ready", SEED.rateList.items.length + " items found. " + questions.length + " need a quick check.") + "</div>" +
        foot(go("Check now", "#check")));
    }
    if (s.items.status !== "reading") { location.replace("#items"); return ""; }
    var pct = Math.min(100, Math.round(((Date.now() - s.items.startedAt) / SEED.readMillis) * 100));
    var found = Math.round((pct / 100) * SEED.rateList.items.length);
    var card = '<div class="wait"><div style="display:flex;align-items:center;gap:12px"><span class="pdf" style="width:40px;height:48px;font-size:11px">' + (/\.(png|jpe?g|heic|webp)$/i.test(s.items.source) ? "IMG" : "PDF") + '</span><span style="flex:1;display:flex;flex-direction:column"><b style="font-size:16px">' + esc(s.items.source) + '</b><span class="muted">Reading… ' + found + ' items so far</span></span></div><div class="bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div></div>';
    var main = E.isDone(s, "customers") ? go("Back to Getting started", "#home") : go("Add customers while it reads", "#customers");
    return phone(stepHead(1) + '<div class="body">' + title("Reading your rate list", "About a minute. It will be waiting on your Getting started page when it's done.") + card + "</div>" + foot(main));
  };

  V.check = function () {
    if (s.items.status !== "check") { location.replace("#home"); return ""; }
    var open = questions.filter(function (q) { return !(q.id in s.items.answers); });
    var q = open[0], idx = questions.length - open.length + 1;
    var it = itemsById[q.itemId];
    var opts = q.options.map(function (o) { return '<button data-act="answer" data-q="' + q.id + '" data-v="' + esc(o) + '">' + (typeof o === "number" ? rupees(o) : esc(o)) + "</button>"; }).join("");
    return phone(stepHead(1) + '<div class="body">' + title("Quick check, " + idx + " of " + questions.length, "Everything else looks right.") +
      '<div class="card"><b style="font-size:20px">' + esc(it.name) + '</b><p>' + esc(q.text) + '</p><div class="big2">' + opts + "</div></div></div>" +
      foot("", '<button class="link quiet" data-act="answer" data-q="' + q.id + '" data-v="later">Not sure? Ask me later</button>'));
  };

  V.customers = function () {
    if (!ui.ticked) {
      ui.ticked = {};
      var prev = s.customers.ids.length ? s.customers.ids : SEED.contacts.filter(function (c) { return c.kind === "shop"; }).map(function (c) { return c.id; });
      prev.forEach(function (id) { ui.ticked[id] = true; });
    }
    var shops = SEED.contacts.filter(function (c) { return c.kind === "shop"; }).length;
    var notes = { supplier: "Your supplier, so left out", driver: "Your driver, so left out" };
    var rows = SEED.contacts.slice().sort(function (a, b) { return (a.kind === "shop" ? 0 : 1) - (b.kind === "shop" ? 0 : 1); }).map(function (c) {
      return '<label class="check"><input type="checkbox" data-bind="tick" data-id="' + c.id + '"' + (ui.ticked[c.id] ? " checked" : "") + '><span class="t"><b>' + esc(c.name) + "</b><span>" + esc(notes[c.kind] || c.phone) + "</span></span></label>";
    }).join("");
    var n = Object.keys(ui.ticked).filter(function (k) { return ui.ticked[k]; }).length;
    return phone(stepHead(2) + '<div class="body">' + title("Who are your customers?", "I found " + shops + " shops in your phone contacts. Untick anyone who isn't a customer.") +
      '<div class="list">' + rows + '</div><p class="muted">Nobody gets a message from FoodBridge unless you send one.</p>' + (ui.note ? '<p class="muted" role="status">' + esc(ui.note) + "</p>" : "") + "</div>" +
      foot(btn("Add " + n + " customer" + (n === 1 ? "" : "s"), "addcust", n ? "" : " disabled"), '<button class="link quiet" data-act="khata">Not in your phone? Photo of your khata</button>'));
  };

  function locked(id) {
    return phone(stepHead(E.stepNumber(id)) + '<div class="body">' + title(E.step(id).title, "This opens " + E.lockNote(s, id) + ".") + "</div>" + foot(go("Back to Getting started", "#home")));
  }

  V.order = function () {
    if (E.isLocked(s, "order")) return locked("order");
    if (s.order) { location.replace("#placed"); return ""; }
    var cs = customers(), its = storeItems();
    if (!ui.draft) ui.draft = { customerId: cs[0].id, qty: {}, payment: "udhaar", send: true, search: "" };
    var d = ui.draft, c = contactsById[d.customerId];
    var shown = its.filter(function (i) { return !d.search || i.name.toLowerCase().indexOf(d.search.toLowerCase()) !== -1; });
    var rows = shown.map(function (i) {
      var q = d.qty[i.id] || 0;
      var ctl = q ? '<span class="stepper"><button data-act="qty" data-id="' + i.id + '" data-d="-1" aria-label="One less ' + esc(i.name) + '">−</button><span>' + q + '</span><button class="plus" data-act="qty" data-id="' + i.id + '" data-d="1" aria-label="One more ' + esc(i.name) + '">+</button></span>'
        : '<button class="add" data-act="qty" data-id="' + i.id + '" data-d="1" aria-label="Add ' + esc(i.name) + '">+</button>';
      return '<div class="item' + (q ? " on" : "") + '"><span class="t"><b>' + esc(i.name) + "</b><span>" + esc(i.unit) + " · " + (i.price == null ? "price at delivery" : rupees(i.price)) + "</span></span>" + ctl + "</div>";
    }).join("") || '<div class="item"><span class="t"><span>No item matches “' + esc(d.search) + "”</span></span></div>";
    var lines = its.filter(function (i) { return d.qty[i.id]; });
    var total = lines.reduce(function (a, i) { return a + (i.price || 0) * d.qty[i.id]; }, 0);
    var opts = cs.map(function (x) { return '<option value="' + x.id + '"' + (x.id === d.customerId ? " selected" : "") + ">" + esc(x.name) + "</option>"; }).join("");
    var pay = [["udhaar", "Udhaar"], ["cash", "Cash"], ["upi", "UPI"]].map(function (p) { return '<option value="' + p[0] + '"' + (p[0] === d.payment ? " selected" : "") + ">" + p[1] + "</option>"; }).join("");
    return phone(stepHead(3) + '<div class="body" style="gap:12px">' + title("New order") +
      '<label class="rowline"><span class="k">For</span><select data-bind="cust" aria-label="Customer">' + opts + "</select></label>" +
      '<label class="search">' + '<span class="sr">Search items</span><input data-bind="search" value="' + esc(d.search) + '" placeholder="Search your ' + its.length + ' items" autocomplete="off"></label>' +
      '<div class="list">' + rows + "</div>" +
      '<label class="rowline"><span class="k">Payment</span><select data-bind="pay" aria-label="Payment">' + pay + "</select></label></div>" +
      foot(btn("Place order" + (lines.length ? " · " + rupees(total) : ""), "place", lines.length ? "" : " disabled"),
        '<label style="min-height:40px;display:flex;align-items:center;justify-content:center;gap:8px;font-size:13px;color:var(--sub);text-align:left"><input type="checkbox" data-bind="send"' + (d.send ? " checked" : "") + ' style="width:18px;height:18px;flex:none;accent-color:var(--g)"><span>Send the invoice to ' + esc(c.name) + " on WhatsApp</span></label>"));
  };

  V.placed = function () {
    if (!s.order) { location.replace("#order"); return ""; }
    var c = orderCustomer(), pl = { udhaar: "udhaar until " + due(), cash: "paid in cash", upi: "paid by UPI" }[s.order.payment];
    return phone(stepHead(3) + '<div class="body center">' + '<span class="bigcheck">' + ic("check", 44, 3) + "</span>" + title("Order placed") +
      '<p class="muted" style="font-size:16px;line-height:24px">' + (s.order.sendInvoice ? esc(c.name) + " got the invoice on WhatsApp." : "The invoice is saved.") + "<br>" + rupees(s.order.total) + ", " + pl + ".</p>" +
      (s.order.sendInvoice ? '<a class="link" href="#wa-customer">See what they got</a>' : "") + "</div>" +
      foot(E.isDone(s, "deliver") ? go("Back to Getting started", "#home") : go("Next: deliver it", "#deliver"), '<a class="link quiet" href="#home">Later</a>'));
  };
  function clock(hhmm) { var h = Number(hhmm.slice(0, 2)), m = hhmm.slice(3); return (h % 12 || 12) + ":" + m + (h < 12 ? " am" : " pm"); }
  function due() { var d = new Date(s.order ? s.order.at : Date.now()); d.setDate(d.getDate() + 7); return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }); }

  V.deliver = function () {
    if (E.isLocked(s, "deliver")) return locked("deliver");
    var c = orderCustomer();
    if (s.delivery.status !== "none") {
      var drv = contactsById[s.delivery.driverId];
      var st = s.delivery.status === "delivered" ? (s.delivery.mode === "self" ? "Marked delivered." : esc(drv.name.replace(" (driver)", "")) + " delivered it.") : "With " + esc(drv.name.replace(" (driver)", "")) + ". He taps Delivered on his link and you see it here.";
      return phone(stepHead(4) + '<div class="body">' + title(s.delivery.status === "delivered" ? "Delivered" : "On its way", st) +
        (s.delivery.mode === "driver" ? '<a class="link" href="#driver" style="justify-content:flex-start">See what ' + esc(drv.name.replace(" (driver)", "")) + " sees</a>" : "") + "</div>" + foot(go("Back to Getting started", "#home")));
    }
    var drivers = SEED.contacts.filter(function (x) { return x.kind === "driver"; }).concat(SEED.contacts.filter(function (x) { return x.kind === "person"; }));
    if (!ui.driverId) ui.driverId = drivers[0].id;
    var dsel = '<label class="rowline" style="border:0;background:var(--bg);padding:0 12px"><span class="k">Driver</span><select data-bind="driver" aria-label="Driver">' +
      drivers.map(function (x) { return '<option value="' + x.id + '"' + (x.id === ui.driverId ? " selected" : "") + ">" + esc(x.name) + "</option>"; }).join("") + "</select></label>";
    var o1 = '<div class="option' + (ui.dmode === "driver" ? " on" : "") + '" role="radio" aria-checked="' + (ui.dmode === "driver") + '" tabindex="0" data-act="dmode" data-v="driver"><span class="top"><span class="dot"></span><span><b>My driver takes it</b><span>They get the address on WhatsApp</span></span></span>' + (ui.dmode === "driver" ? dsel : "") + "</div>";
    var o2 = '<div class="option' + (ui.dmode === "self" ? " on" : "") + '" role="radio" aria-checked="' + (ui.dmode === "self") + '" tabindex="0" data-act="dmode" data-v="self"><span class="top"><span class="dot"></span><span><b>I deliver it, or they pick it up</b><span>Mark it delivered now</span></span></span></div>';
    var dn = contactsById[ui.driverId].name.replace(" (driver)", "");
    return phone(stepHead(4) + '<div class="body" style="gap:14px">' + title("How will it reach " + c.name + "?") + '<div role="radiogroup" style="display:flex;flex-direction:column;gap:12px">' + o1 + o2 + "</div></div>" +
      foot(ui.dmode === "driver" ? btn(ic("send") + "Send to " + esc(dn) + " on WhatsApp", "senddriver") : btn("Mark it delivered", "selfdeliver")));
  };

  V.driver = function () {
    var dh = '<div class="apphead" style="background:var(--gd);color:#fff;border:0"><span class="who" style="padding-left:10px"><span style="color:#dcfce7">' + esc(SEED.store.name) + ' · stop 1 of 1</span><b>Your delivery</b></span><span style="padding:8px 12px;border-radius:8px;background:#fff;color:var(--gdd);font-size:14px;font-weight:600">हिंदी</span></div>';
    if (s.delivery.mode !== "driver") return phone(dh + '<div class="body">' + title("No delivery yet", "When the store sends you a stop, it opens here.") + "</div>");
    var c = orderCustomer();
    if (s.delivery.status === "delivered") return phone(dh + '<div class="body center"><span class="bigcheck">' + ic("check", 44, 3) + "</span>" + title("Done, thank you", esc(SEED.store.name) + " has been told.") + "</div>");
    var what = s.order.lines.map(function (l) { return l.qty + " " + itemsById[l.itemId].name; }).join(", ");
    return phone(dh + '<div class="body">' + title(c.name, esc(c.area) + " · " + esc(what)) +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><button class="btn ghost" data-act="noop">Open in maps</button><button class="btn ghost" data-act="noop">Call</button></div></div>' +
      foot(btn(ic("check") + "Delivered", "delivered"), '<button class="link danger" data-act="noop">Couldn\'t deliver</button>'));
  };

  V.paid = function () {
    if (E.isLocked(s, "paid")) return locked("paid");
    var c = orderCustomer();
    if (s.payment.status !== "none") {
      var t = s.payment.received ? c.name + " paid " + rupees(s.order.total) + "." : s.payment.status === "link" ? "Link sent. You'll see it here when " + c.name + " pays." : "Recorded as paid.";
      return phone(stepHead(5) + '<div class="body">' + title(s.payment.received ? "Paid" : "Payment link sent", esc(t)) + (s.payment.status === "link" && !s.payment.received ? '<a class="link" href="#wa-customer" style="justify-content:flex-start">See what they got</a>' : "") + "</div>" + foot(go("Back to Getting started", "#home")));
    }
    var bubble = '<div style="display:flex;flex-direction:column;gap:4px;padding:12px 14px;border-radius:12px;background:var(--wa-wall);font-size:15px;line-height:22px"><span style="font-size:13px;color:#54656f">They get</span><span>' + esc(SEED.store.name) + ": payment link for order " + s.order.id + ", " + rupees(s.order.total) + '. Pay by UPI whenever it suits you.</span><b style="color:var(--wa-link)">Pay ' + rupees(s.order.total) + "</b></div>";
    return phone(stepHead(5) + '<div class="body">' + title("Get paid " + rupees(s.order.total), "Send " + esc(c.name) + " a UPI link. They pay any time before " + due() + "; the money goes to your bank.") + bubble + "</div>" +
      foot(btn(ic("send") + "Send payment link", "paylink"), '<button class="link quiet" data-act="paycash">They paid cash</button>'));
  };

  V.plan = function () {
    var times = function (bind, list, val) { return '<select data-bind="' + bind + '" aria-label="' + bind + ' time" style="border:0;background:none;font-size:16px;font-weight:600">' + list.map(function (t) { return '<option value="' + t[0] + '"' + (t[0] === val ? " selected" : "") + ">" + t[1] + "</option>"; }).join("") + "</select>"; };
    var ex = '<div style="display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:14px;background:var(--wa-wall)"><span style="font-size:13px;color:#54656f">For example</span><div style="display:flex;flex-direction:column;gap:4px;padding:10px 12px;background:#fff;border-radius:4px 10px 10px 10px;font-size:15px;line-height:22px"><b>Aaj ka plan</b><span>3 deliveries today</span><span>₹12,400 to collect from 4 customers</span></div></div>';
    var when = '<div class="list"><label class="rowline" style="border:0;border-radius:0"><span class="k">Morning</span>' + times("morning", [["07:30", "7:30 am"], ["08:30", "8:30 am"], ["09:30", "9:30 am"]], s.plan.morning) + '</label><label class="rowline" style="border:0;border-radius:0"><span class="k">Evening</span>' + times("evening", [["19:00", "7:00 pm"], ["20:00", "8:00 pm"], ["21:00", "9:00 pm"]], s.plan.evening) + "</label></div>";
    if (s.plan.on) return phone(stepHead(6) + '<div class="body">' + title("Your daily plan is on", "Mornings at " + clock(s.plan.morning) + ", evenings at " + clock(s.plan.evening) + ".") + when + "</div>" + foot(go("Back to Getting started", "#home")));
    return phone(stepHead(6) + '<div class="body">' + title("Your day on WhatsApp", "A plan in the morning and a summary in the evening, made from your own orders.") + ex + when + "</div>" +
      foot(btn("Turn it on", "planon"), '<a class="link quiet" href="#home">Not now</a>'));
  };

  V.done = function () {
    if (E.progress(s).done < 6) { location.replace("#home"); return ""; }
    return phone(appHead() + '<div class="body center">' + ring(100, 120, frac(6, 26), 10) + title("You're all set", "Your first plan arrives tomorrow at " + clock(s.plan.morning) + ".<br>Need help? Tap me at the bottom-right, any time.") + "</div>" +
      foot(go("Go to my dashboard", "#dashboard")), fab(null, 96) + panel());
  };

  V.dashboard = function () {
    var p = E.progress(s), n = E.nextStep(s);
    var nav = ["Dashboard", "Product Master", "Customer Management", "Sales Orders", "Sales Returns", "Distribution & Logistics", "Route Delivery", "Store QR Code"]
      .map(function (t, i) { return '<a href="#dashboard" class="' + (i === 0 ? "on" : "") + '">' + t + "</a>"; }).join("");
    var banner = n ? '<div class="banner">' + ring(p.percent, 56, frac(p.done, 14), 5) + '<span class="t"><b>Getting started · ' + p.done + ' of 6</b><span>Next: ' + esc(nextText(n).title.toLowerCase()) + '</span></span><a class="btn" href="#home">Open Getting started</a></div>' : "";
    var o = s.order, today = o ? rupees(o.total) : "₹0";
    var tiles = [["Today Orders", today, "#0f766e"], ["Yesterday Orders", "₹0", "#ea580c"], ["This Month", today, "#2563eb"], ["Last Month", "₹0", "#0891b2"], ["All-Time Sales", today, "#15803d"]]
      .map(function (t) { return '<div class="tile" style="background:' + t[2] + '"><span>' + t[0] + "</span><b>" + t[1] + "</b></div>"; }).join("");
    var rows = o ? "<tr><td>" + o.id + "</td><td>" + new Date(o.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + "</td><td>" + esc(orderCustomer().name) + "</td><td><b>" + rupees(o.total) + "</b></td><td>" + (s.delivery.status === "delivered" ? "Delivered" : s.delivery.status === "sent" ? "Out for delivery" : "Pending") + "</td></tr>"
      : '<tr><td colspan="5" style="color:var(--mut)">No orders yet</td></tr>';
    var head = '<div class="deskhead"><button class="iconbtn" data-act="noop" aria-label="Toggle sidebar">' + ic("menu", 20) + '</button><b style="font-size:16px">Dashboard</b>' +
      '<button class="me2" data-act="menu" aria-expanded="' + ui.menu + '">' + avatarRing() + "<span><b>" + esc(SEED.store.owner) + "</b><small>Admin</small></span></button>" + menu() + "</div>";
    return '<div class="desk"><nav class="side" aria-label="Main"><div class="brand"><i></i><span><b>' + esc(SEED.store.name) + "</b><span>" + esc(SEED.store.owner) + "</span></span></div>" + nav + "</nav>" +
      '<div class="deskmain">' + head + '<div class="deskbody">' + banner + '<div class="tiles">' + tiles + '</div><div class="table"><table><thead><tr><th>ORDER ID</th><th>DATE</th><th>CUSTOMER</th><th>AMOUNT</th><th>STATUS</th></tr></thead><tbody>' + rows + "</tbody></table></div></div></div>" +
      fab(n ? "Next: " + nextText(n).title.toLowerCase() : null) + panel() + "</div>";
  };

  // ---------- WhatsApp: the link, the nudge, other people's phones ----------
  function wa(name, sub, avatarHtml, body, back) {
    return phone('<div class="wahead"><a class="iconbtn" style="color:#fff" href="' + (back || "#home") + '" aria-label="Back">' + ic("back", 24) + "</a>" + avatarHtml + '<span class="who"><b>' + esc(name) + "</b><span>" + esc(sub) + '</span></span></div><div class="wabody">' + body + '</div><div class="wafoot"><span>Message</span></div>').replace('class="phone"', 'class="phone wa"');
  }
  function win(html, time, buttons) {
    return '<div class="win"><div class="tx">' + html + "<time>" + time + "</time></div>" + (buttons || []).map(function (b) {
      return b.href ? '<a class="wb" href="' + b.href + '">' + esc(b.label) + "</a>" : '<button class="wb" data-act="' + b.act + '">' + esc(b.label) + "</button>";
    }).join("") + "</div>";
  }
  var fbface = function () { return face(40); };

  V["wa-link"] = function () {
    return wa("FoodBridge", "Business account", fbface(), '<div class="wachip">TODAY</div>' +
      win('<span style="display:flex;flex-direction:column;gap:2px;padding:10px;margin:-4px -6px 4px;border-radius:8px;background:var(--gl2)"><b style="font-size:20px">' + esc(SEED.store.name) + '</b><span style="font-size:13px;color:var(--sub)">Your FoodBridge store</span></span><span>Namaste ' + esc(SEED.store.owner) + " ji. Your store is ready. Take orders, deliver and get paid, all in one app.</span>", "10:42", [{ label: "Open my store", href: "#home" }]), "#wa-link");
  };
  V["wa-nudge"] = function () {
    var p = E.progress(s), n = E.nextStep(s);
    var msg = n ? win("<span>Good morning " + esc(SEED.store.owner) + " ji. " + p.done + " of 6 done. Next: " + esc(nextText(n).title.toLowerCase()) + ".</span>", "9:00", [{ label: "Open Getting started", href: "#home" }])
      : win("<b>Aaj ka plan</b><span>" + (s.order ? "1 delivery today" : "No deliveries today") + "</span><span>" + (s.order && !s.payment.received ? rupees(s.order.total) + " to collect" : "Nothing to collect") + "</span>", clock(s.plan.morning), [{ label: "Open FoodBridge", href: "#dashboard" }]);
    return wa("FoodBridge", "Business account", fbface(), '<div class="wachip">NEXT MORNING</div>' + msg, "#home");
  };
  V["wa-customer"] = function () {
    var rt = '<span class="face" style="width:40px;height:40px;background:var(--gl);color:var(--gd);display:grid;place-items:center;font-weight:700">RT</span>';
    if (!s.order) return wa(SEED.store.name, "via FoodBridge", rt, '<div class="wachip">CUSTOMER\'S PHONE</div>' + win("<span>No invoice yet.</span>", "—"), "#home");
    var c = orderCustomer(), what = s.order.lines.map(function (l) { return l.qty + " " + itemsById[l.itemId].name; }).join(", ");
    var body = '<div class="wachip">' + esc(c.name.toUpperCase()) + "'S PHONE</div>";
    if (s.order.sendInvoice) body += win('<span style="display:flex;align-items:center;gap:10px;padding:10px;margin:-4px -6px 2px;border-radius:8px;background:#f0f2f5"><span class="pdf" style="width:32px;height:40px;font-size:10px;background:var(--red);color:#fff">PDF</span><b style="font-size:14px">Invoice, order ' + s.order.id + "</b></span><span>Your order from " + esc(SEED.store.name) + ": " + esc(what) + ". <b>" + rupees(s.order.total) + "</b>" + (s.order.payment === "udhaar" ? ", due " + due() : ", paid") + ".</span>", "10:47");
    if (s.payment.status === "link") body += win("<span>" + esc(SEED.store.name) + ": payment link for order " + s.order.id + ", " + rupees(s.order.total) + ".</span>", "10:52", s.payment.received ? [] : [{ label: "Pay " + rupees(s.order.total) + " by UPI", act: "custpay" }]);
    if (s.payment.received && s.payment.status === "link") body += '<div class="wout"><span>Paid ' + rupees(s.order.total) + " by UPI</span><time>10:55</time></div>" + win("<span>Payment received. Thank you!</span>", "10:55");
    return wa(SEED.store.name, "via FoodBridge", rt, body, "#placed");
  };
  V["wa-letgo"] = function () {
    return wa("FoodBridge", "Business account", fbface(), '<div class="wachip">DAY 6</div>' + win("<span>Anil ji, your store <b>Shree Ganesh Agencies</b> is waiting. Should we keep it open?</span>", "11:00", [{ label: "Yes, set it up now", href: "#home" }, { label: "Not right now", act: "noop" }]) +
      '<div class="wout"><span>Not right now</span><time>11:04</time></div>' + win("<span>No problem. Nothing is deleted. Reply <b>START</b> any time.</span>", "11:04"), "#wa-link");
  };

  // ---------- discovery aids (from the hub) ----------
  var AIDS = {
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} s = E.initialState(); ui = { menu: false, panel: false, sheet: false, chat: [], q: 0, draft: null, ticked: null, dmode: "driver", driverId: null, note: "" }; return "#wa-link"; },
    "finish-reading": function () { if (s.items.status === "reading") s.items.startedAt = 0; return "#home"; },
    "team-done": function () { if (s.items.status === "team") { s.items.status = "done"; s.items.source = "team"; s.items.count = SEED.rateList.items.length - 1; s.items.answers = { q1: 410, q2: "Same item" }; s.flash = "Our team added your " + s.items.count + " items."; } return "#home"; }
  };

  // ---------- actions ----------
  function startReading(name) {
    s.items = { status: "reading", source: name, startedAt: Date.now(), answers: {}, count: 0 };
    ui.sheet = false; save(); location.hash = "#reading";
  }
  var ACT = {
    noop: function () {},
    menu: function () { ui.menu = !ui.menu; },
    panel: function () { ui.panel = true; ui.menu = false; },
    "close-panel": function () { ui.panel = false; },
    sheet: function () { ui.sheet = true; },
    "sheet-close": function () { ui.sheet = false; },
    pick: function () { document.getElementById("pick-file").click(); },
    photo: function () { document.getElementById("pick-photo").click(); },
    common: function () { s.items = { status: "done", source: "common", startedAt: 0, answers: {}, count: SEED.commonItems.length }; s.flash = SEED.commonItems.length + " common items added. Add more any time."; ui.sheet = false; location.hash = "#home"; },
    team: function () { s.items = { status: "team", source: "team", startedAt: 0, answers: {}, count: 0 }; s.flash = "Our team will add your items within 2 hours."; ui.sheet = false; location.hash = "#home"; },
    answer: function (el) {
      var v = el.getAttribute("data-v"); s.items.answers[el.getAttribute("data-q")] = /^\d+$/.test(v) ? Number(v) : v;
      if (questions.every(function (q) { return q.id in s.items.answers; })) {
        s.items.status = "done"; s.items.count = storeItemsCount(); s.flash = s.items.count + " items added.";
        location.hash = "#home";
      }
    },
    addcust: function () {
      s.customers = { done: true, ids: SEED.contacts.filter(function (c) { return ui.ticked[c.id]; }).map(function (c) { return c.id; }) };
      s.flash = s.customers.ids.length + " customers added." + (E.isDone(s, "items") ? " Your store is ready for orders." : "");
      location.hash = "#home";
    },
    khata: function () { ui.note = "In this prototype, pick from contacts. A khata photo would be read like the rate list."; },
    qty: function (el) { var id = el.getAttribute("data-id"); ui.draft.qty[id] = Math.max(0, (ui.draft.qty[id] || 0) + Number(el.getAttribute("data-d"))); },
    place: function () {
      var d = ui.draft, its = storeItems();
      var lines = its.filter(function (i) { return d.qty[i.id]; }).map(function (i) { return { itemId: i.id, qty: d.qty[i.id], price: i.price }; });
      if (!lines.length) return;
      s.order = { id: "0001", customerId: d.customerId, lines: lines, payment: d.payment, sendInvoice: d.send, total: E.orderTotal(lines), at: Date.now() };
      if (d.payment !== "udhaar") s.payment = { status: "cash", received: true };   // paid at the counter: step 5 is done too
      ui.draft = null; location.hash = "#placed";
    },
    dmode: function (el) { ui.dmode = el.getAttribute("data-v"); },
    senddriver: function () { var n = contactsById[ui.driverId].name.replace(" (driver)", ""); s.delivery = { status: "sent", mode: "driver", driverId: ui.driverId }; s.flash = "Sent to " + n + " on WhatsApp."; location.hash = "#home"; },
    selfdeliver: function () { s.delivery = { status: "delivered", mode: "self", driverId: null }; s.flash = "Marked delivered."; location.hash = "#home"; },
    delivered: function () { s.delivery.status = "delivered"; s.flash = { text: contactsById[s.delivery.driverId].name.replace(" (driver)", "") + " delivered order " + s.order.id + ".", route: "home" }; },
    paylink: function () { s.payment = { status: "link", received: false }; s.flash = "Payment link sent to " + orderCustomer().name + "."; location.hash = "#home"; },
    paycash: function () { s.payment = { status: "cash", received: true }; s.flash = "Payment recorded."; location.hash = "#home"; },
    custpay: function () { s.payment.received = true; s.flash = { text: orderCustomer().name + " paid " + rupees(s.order.total) + ".", route: "home" }; },
    planon: function () { s.plan.on = true; s.flash = "Daily plan is on. The first one comes tomorrow at " + clock(s.plan.morning) + "."; location.hash = E.progress(s).done === 6 ? "#done" : "#home"; }
  };
  function storeItemsCount() { var keep = s.items.status; s.items.status = "done"; var n = storeItems().length; s.items.status = keep; return n; }

  document.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-act]");
    if (!el || el.tagName === "FORM") { if (ui.menu && !ev.target.closest(".menu")) { ui.menu = false; render(); } return; }
    var a = el.getAttribute("data-act");
    if (el.tagName === "A") {   // a link navigates; one that closes the panel also re-renders when it points where we already are
      if (a === "close-panel") { ui.panel = false; if (el.getAttribute("href") === location.hash) { ev.preventDefault(); render(); } }
      return;
    }
    ev.preventDefault();
    if (a !== "menu" && ui.menu && !el.closest(".menu")) ui.menu = false;
    if (ACT[a]) { var before = location.hash; ACT[a](el); save(); if (location.hash === before) render(); }   // a navigation renders on hashchange
  });
  document.addEventListener("keydown", function (ev) {
    var el = ev.target;
    if ((ev.key === "Enter" || ev.key === " ") && el.getAttribute && el.getAttribute("data-act") === "dmode") { ev.preventDefault(); ACT.dmode(el); render(); }
    if (ev.key === "Escape") { ui.menu = false; ui.panel = false; ui.sheet = false; render(); }
  });
  document.addEventListener("change", function (ev) {
    var el = ev.target, b = el.getAttribute("data-bind"); if (!b) return;
    if (b === "file") { if (el.files && el.files[0]) startReading(el.files[0].name); return; }
    if (b === "tick") ui.ticked[el.getAttribute("data-id")] = el.checked;
    if (b === "cust") ui.draft.customerId = el.value;
    if (b === "pay") ui.draft.payment = el.value;
    if (b === "send") ui.draft.send = el.checked;
    if (b === "driver") ui.driverId = el.value;
    if (b === "morning" || b === "evening") s.plan[b] = el.value;
    save(); render();
  });
  document.addEventListener("input", function (ev) {
    if (ev.target.getAttribute("data-bind") === "search") {
      ui.draft.search = ev.target.value; render();
      var i = document.querySelector('[data-bind="search"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    }
  });
  document.addEventListener("submit", function (ev) {
    if (ev.target.getAttribute("data-act") !== "ask") return;
    ev.preventDefault();
    var q = document.getElementById("ask").value.trim(); if (!q) return;
    ui.chat.push({ me: true, text: q }, { me: false, text: answer(q) });
    render(); var i = document.getElementById("ask"); if (i) i.focus();
  });

  // ---------- render ----------
  var timer = null;
  function render() {
    clearTimeout(timer);
    if (E.tick(s, Date.now(), SEED.readMillis, questions.length)) save();
    var route = (location.hash || "#wa-link").slice(1);
    if (AIDS[route]) { location.replace(AIDS[route]()); save(); return; }
    takeFlash(route);
    var view = V[route] || V.home;
    var html = view();
    if (html) app.innerHTML = html;
    document.title = (route.indexOf("wa-") === 0 ? "WhatsApp" : "FoodBridge") + " · " + route;
    if (s.items.status === "reading") timer = setTimeout(render, 1000);
  }
  window.addEventListener("hashchange", function () { ui.toast = null; ui.menu = false; ui.sheet = false; ui.note = ""; if (location.hash !== "#customers") ui.ticked = null; render(); window.scrollTo(0, 0); });
  render();
})();
