/* Store Activation discovery — the screens (2026-10-10, v1; step 1 = six ways in + the sheet, addendum-005).
   One page, one route per screen (#home, #items, …), state in this browser's localStorage. The rules live in engine.js.
   Two promises this prototype keeps, both from the owner:
     - every step happens on the Getting started page and its step screens;
     - the FoodBridge assistant (floating, on every page) only points to that page. It never runs a step.
   No real API calls: an uploaded file or photo is not read, and Zoho is not called; the seed's rows stand in. */
(function () {
  "use strict";
  var E = window.ActivationEngine, SEED = window.SEED;
  var KEY = "store-activation-discovery-v3";   // v3: products have two units (addendum-014)
  var MASCOT = "activation/mascot.png";
  var app = document.getElementById("app");

  // ---------- state ----------
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); if (o && o.v === 3) return o; } } catch (e) { /* private window: start fresh */ }
    return E.initialState();
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* the prototype still works for this tab */ } }
  var s = load();
  function freshUi() {
    return { menu: false, panel: false, sheet: false, chat: [], draft: null, ticked: null, dmode: "driver", driverId: null, note: "",
      files: [], photos: [], shoot: { live: false, scene: 0, note: "" }, zoho: "idle", voice: { text: "", on: false }, cat: { q: "", picked: {}, hi: -1, focused: false },
      sel: null, filter: "all", undo: [], reveal: false, focusFx: null, drag: false, dropAsk: false,
      view: null, rmenu: false, fixing: false, fixSkip: {}, fixTotal: 0, edit: null, snack: "" };
  }
  var ui = freshUi();

  // ---------- seed lookups ----------
  var contactsById = {}; SEED.contacts.forEach(function (c) { contactsById[c.id] = c; });

  /** The store's saved products, as the order screen needs them. */
  function storeItems() {
    // ordered by the bigger unit, at its rate (quoted or derived from the per-unit rate) — addendum-014
    return s.items.saved.map(function (r) { var p = E.prices(r); return { id: r.id, name: r.name, unit: r.bigUnit + " of " + r.perBig + " " + E.plural(r.baseUnit), bigUnit: r.bigUnit, price: p && p.big != null ? p.big : null, gst: r.gst, taxIncl: r.taxIncl }; });
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
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    sync: '<path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>', alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    dots: '<circle cx="12" cy="5" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="19" r="1.6"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'
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
    var T = {
      items: { title: "Add your products", label: "Start", href: "#items" },
      customers: { title: "Add customers from your contacts", label: "Start", href: "#customers" },
      order: { title: "Take your first order", label: "Start", href: "#order" },
      deliver: { title: "Deliver it, by driver or pickup", label: "Start", href: "#deliver" },
      paid: { title: "Get paid by UPI or cash", label: "Start", href: "#paid" },
      plan: { title: "Get your daily plan on WhatsApp", label: "Start", href: "#plan" }
    };
    if (n.mode === "review") {
      var sum = E.sheetSummary(s.items.sheet, s.items.saved);
      return sum.fix ? { title: "Fix " + sum.fix + " product" + (sum.fix === 1 ? "" : "s") + ", then save", label: "Check & save", href: "#review" }
        : { title: "Save your " + sum.total + " product" + (sum.total === 1 ? "" : "s"), label: "Check & save", href: "#review" };
    }
    if (n.mode === "waiting") return { title: "Processing your products", label: "See progress", href: "#processing" };
    return T[n.id];
  }

  function doneLine() {
    var parts = [];
    if (E.isDone(s, "items")) parts.push(s.items.saved.length + " products");
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
    var fresh = p.done === 0 && !s.items.job && !s.items.sheet.length;
    var t = fresh ? title("Namaste " + SEED.store.owner + " ji, your store in 6 quick steps")
      : title(p.done >= 2 && !E.isDone(s, "order") ? "Your store is ready for orders" : "Getting started");
    var x = nextText(n);
    var later = E.isDone(s, "items") ? E.sheetSummary(s.items.sheet, s.items.saved) : null;
    var reading = n.mode !== "waiting" && s.items.job
      ? '<a class="rowline" href="#processing" style="text-decoration:none;color:inherit"><span class="spin"></span><span style="flex:1;font-size:15px">Processing your products…</span>' + ic("chev", 18) + "</a>"
      : later && later.total ? '<a class="rowline" href="#review" style="text-decoration:none;color:inherit">' + ic("grid", 20) + '<span style="flex:1;font-size:15px">' + (later.fix ? later.fix + " product" + (later.fix === 1 ? " needs" : "s need") + " a fix" : later.total + " products not saved yet") + "</span>" + ic("chev", 18) + "</a>" : "";
    var card = '<div class="card next"><div class="head">' + ring(p.percent, 56, frac(p.done, 14), 5) + "<span><small>Next step</small><strong>" + esc(x.title) + "</strong></span></div>" +
      (x.label ? '<a class="btn" href="' + x.href + '">' + esc(x.label) + "</a>" : "") + "</div>";
    var rest = E.STEPS.filter(function (st) { return st.id !== n.id && !E.isDone(s, st.id) && !E.isWaiting(s, st.id); });
    var list = rest.length ? '<span class="then">Then</span><div class="quiet">' + rest.map(function (st) {
      return '<div><span class="n">' + E.stepNumber(st.id) + '</span><span class="t">' + esc(st.title) + "</span>" + (E.isLocked(s, st.id) ? '<span class="note">' + esc(E.lockNote(s, st.id)) + "</span>" : "") + "</div>";
    }).join("") + "</div>" : "";
    return phone(appHead() + '<div class="body">' + flashHtml() + t + doneLine() + reading + card + list + '<div style="height:70px;flex:none"></div></div>', fab() + panel());
  };

  // ---------- step 1: six ways in → processing → check and save (addenda 005, 006) ----------
  // Every way runs the same three parts. The bar under the step header says where the owner is.
  function flow(at) {
    return '<ol class="flow" aria-label="Adding products">' + ["Choose", "Processing", "Check & save"].map(function (t, i) {
      return '<li class="' + (i < at ? "done" : i === at ? "on" : "") + '"' + (i === at ? ' aria-current="step"' : "") + "><i>" + (i < at ? ic("check", 12, 3) : i + 1) + "</i>" + t + "</li>";
    }).join("") + "</ol>";
  }
  function jobBar() {
    var j = s.items.job, n = E.sheetSummary(s.items.sheet, s.items.saved);
    if (j) return '<a class="sbar" href="#processing"><span class="spin light"></span><span>Processing your products…</span>' + ic("chev", 18) + "</a>";
    if (!n.total) return "";
    return '<a class="sbar" href="#review">' + ic("grid", 20) + "<span>Ready to check · <b>" + n.total + " product" + (n.total === 1 ? "" : "s") + "</b>" + (n.fix ? ' · <em>' + n.fix + " to fix</em>" : "") + "</span>" + ic("chev", 18) + "</a>";
  }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  function fileBadge(name) { var e = (String(name).split(".").pop() || "").toLowerCase(); return /xlsx?|csv|tsv|ods/.test(e) ? ["XLS", "b-xls"] : e === "pdf" ? ["PDF", "b-pdf"] : /png|jpe?g|heic|webp|gif/.test(e) ? ["IMG", "b-img"] : [(e || "FILE").slice(0, 4).toUpperCase(), "b-any"]; }

  V.items = function () {
    var ways = [
      ["#items-file", "upload", "Upload Excel, PDF, any file", "w-file"],
      ["#items-photo", "cam", "Click photos", "w-photo"],
      ["#items-zoho", "sync", "Sync from Zoho", "w-zoho"],
      ["#items-voice", "mic", "Speak your products", "w-voice"],
      ["#items-catalog", "search", "Search products", "w-cat"]
    ].map(function (w) {
      return '<a class="way ' + w[3] + '" href="' + w[0] + '"><span class="wic">' + ic(w[1], 26) + "</span><b>" + w[2] + "</b>" + (w[0] === "#items-file" ? '<span class="fmt"><i>XLS</i><i>CSV</i><i>PDF</i><i>JPG</i></span>' : "") + "</a>";
    }).join("");
    return phone(stepHead(1) + '<div class="body">' + flashHtml() + flow(0) + title("Add your products") + jobBar() + '<div class="ways">' + ways + "</div>" +
      '<p class="droptip">' + ic("upload", 16) + "On a computer, drop files anywhere here</p></div>" + dropOverlay());
  };
  function dropOverlay() { return ui.drag ? '<div class="drop">' + ic("upload", 40) + "<b>Drop to add</b></div>" : ""; }

  V["items-file"] = function () {
    var n = ui.files.length;
    var list = n ? '<div class="list files">' + ui.files.map(function (f, i) {
      var b = fileBadge(f.name);
      return '<div class="frow"><span class="fb ' + b[1] + '">' + b[0] + '</span><span class="t"><b>' + esc(f.name) + "</b><span>" + kb(f.size) + '</span></span><button class="iconbtn" data-act="unfile" data-i="' + i + '" aria-label="Remove ' + esc(f.name) + '">' + ic("close", 18) + "</button></div>";
    }).join("") + "</div>" : "";
    var zone = '<label for="pick-file" class="dz' + (n ? " small" : "") + '">' + ic("upload", n ? 22 : 34) + "<b>" + (n ? "Add more files" : "Choose files") + "</b>" +
      (n ? "" : '<span class="fmt"><i>XLS</i><i>CSV</i><i>PDF</i><i>JPG</i><i>any</i></span><span class="droptip">or drop them here</span>') + "</label>";
    return phone(stepHead(1) + '<div class="body">' + flow(0) + title(n ? n + " file" + (n === 1 ? "" : "s") + " selected" : "Upload files") + list + zone + "</div>" +
      foot(btn("Process " + (n || "") + " file" + (n === 1 ? "" : "s"), "processfiles", n ? "" : " disabled"), '<a class="link quiet" href="#items">Back</a>') + dropOverlay());
  };

  // Click photos = a photoshoot in the store: a viewfinder and a shutter, shot after shot, into a gallery that is then
  // processed (addendum-007). "Use my camera" turns on the live camera; without one, an illustrated shelf stands in and
  // moves on to the next shelf after every shot.
  function sceneSvg(i) {
    var seed = (i + 1) * 9301 + 49297, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed % 1000) / 1000; };
    var cols = ["#dc2626", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#db2777", "#0891b2", "#ea580c", "#65a30d", "#1d4ed8"];
    var names = SEED.catalog.map(function (p) { return p.name.split(" ").slice(0, 2).join(" "); });
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400"><rect width="300" height="400" fill="#efe7da"/><rect width="300" height="400" fill="url(#g)"/>' +
      '<defs><radialGradient id="g" cx="50%" cy="45%" r="75%"><stop offset="60%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".28"/></radialGradient></defs>';
    [118, 248, 378].forEach(function (y, row) {
      var x = 8;
      for (var k = 0; k < 8; k++) {
        var w = 30 + Math.round(rnd() * 34), h = 52 + Math.round(rnd() * 46);
        if (x + w > 292) break;
        var c = cols[Math.floor(rnd() * cols.length)], name = names[(i * 7 + row * 5 + k) % names.length].replace(/&/g, "&amp;");
        svg += '<rect x="' + x + '" y="' + (y - h) + '" width="' + w + '" height="' + h + '" rx="3" fill="' + c + '"/>' +
          '<rect x="' + (x + 3) + '" y="' + (y - h * 0.62) + '" width="' + (w - 6) + '" height="15" rx="2" fill="#fff" opacity=".92"/>' +
          '<text x="' + (x + w / 2) + '" y="' + (y - h * 0.62 + 10.5) + '" font-family="system-ui,sans-serif" font-size="6.5" font-weight="700" text-anchor="middle" fill="#111">' + name.slice(0, Math.max(4, Math.floor(w / 4.2))) + "</text>";
        x += w + 4;
      }
      svg += '<rect x="0" y="' + y + '" width="300" height="10" fill="#8b5e34"/><rect x="0" y="' + (y + 10) + '" width="300" height="3" fill="#6b4423"/>';
    });
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg + "</svg>");
  }
  var camStream = null;
  function stopCamera() { if (camStream) camStream.getTracks().forEach(function (t) { t.stop(); }); camStream = null; ui.shoot.live = false; }

  V["items-photo"] = function () {
    var n = ui.photos.length, last = ui.photos[n - 1], sh = ui.shoot;
    var vf = sh.live ? '<video id="vf" autoplay playsinline muted></video>' : '<img id="vf" src="' + sceneSvg(sh.scene) + '" alt="A store shelf (demo camera)">';
    return phone('<div class="camtop"><a class="iconbtn" href="#items" aria-label="Back to the ways to add products">' + ic("back", 24) + '</a><b>Photoshoot</b><span class="camcount">' + (n ? n + " photo" + (n === 1 ? "" : "s") : "") + "</span></div>" +
      '<div class="vf">' + vf + '<span class="guides"></span><span class="flash"></span>' +
      (sh.live ? "" : '<button class="chip camchip" data-act="camlive">' + ic("cam", 14) + " Use my camera</button>") +
      '<span class="camtip">' + esc(sh.note || "Shelves, rate list, bills: one shot each") + "</span></div>" +
      '<div class="cambar"><a class="last' + (n ? "" : " off") + '" href="#items-gallery" aria-label="Open the gallery">' + (last ? '<img src="' + last.url + '" alt="">' : "") + "</a>" +
      '<button class="shutter" data-act="shoot" aria-label="Take a photo"><i></i></button>' +
      '<a class="done' + (n ? "" : " off") + '" href="#items-gallery">' + (n ? "Done · " + n : "Done") + "</a></div>").replace('class="phone"', 'class="phone cam"');
  };

  V["items-gallery"] = function () {
    var n = ui.photos.length;
    var thumbs = ui.photos.map(function (p, i) {
      return '<span class="thumb"><img src="' + p.url + '" alt="Photo ' + (i + 1) + '"><button class="x" data-act="unphoto" data-i="' + i + '" aria-label="Remove photo ' + (i + 1) + '">' + ic("close", 14, 3) + "</button><i>" + (i + 1) + "</i></span>";
    }).join("");
    var more = '<a class="thumb more" href="#items-photo">' + ic("cam", 26) + "<span>Shoot more</span></a>" +
      '<label class="thumb more alt" for="pick-photo-lib">' + ic("grid", 24) + "<span>From your phone's gallery</span></label>";
    return phone(stepHead(1) + '<div class="body">' + flow(0) + title(n ? n + " photo" + (n === 1 ? "" : "s") : "No photos yet") + '<div class="thumbs">' + thumbs + more + "</div></div>" +
      foot(btn("Process " + (n || "") + " photo" + (n === 1 ? "" : "s"), "readphotos", n ? "" : " disabled"), '<a class="link quiet" href="#items">Back</a>'));
  };

  // Sync from Zoho (addendum-008), a one-time import: connect → Zoho's own sign-in and consent, in Zoho's window →
  // importing runs on the Processing screen → Check & save; the access is not kept. FoodBridge never shows Zoho's sign-in or sees the password; in the prototype the
  // Zoho window is a placeholder whose two outcomes (allowed, rejected) are simulated.
  V["items-zoho"] = function () {
    var badge = '<span class="zbadge" aria-hidden="true">Z</span>';
    var perks = [["shield", "Imports your items with rates, GST and HSN"], ["lock", "Secure, read-only access"], ["check", "One-time import: we don't stay connected"]]
      .map(function (x) { return "<li>" + ic(x[0], 18, 2.4) + "<span>" + x[1] + "</span></li>"; }).join("");
    var note = ui.zoho === "rejected" ? '<div class="fix"><span class="msg">' + ic("alert", 16) + "Zoho access was not allowed. Nothing was imported.</span></div>" : "";
    // Zoho's window, step by step as the owner will see it: sign in (an account chooser here; no password field is ever
    // drawn), then allow read-only access. In the product both pages are Zoho's own, in Zoho's window.
    var win = "";
    if (ui.zoho === "signin" || ui.zoho === "consent") {
      var bar = '<div class="zbar"><span class="zdots"><i></i><i></i><i></i></span><b>Zoho</b><button class="iconbtn" data-act="zohocancel" aria-label="Close Zoho\'s window">' + ic("close", 18) + "</button></div>";
      var steps = '<ol class="zsteps"><li class="' + (ui.zoho === "signin" ? "on" : "done") + '">Sign in</li><li class="' + (ui.zoho === "consent" ? "on" : "") + '">Allow access</li></ol>';
      var body = ui.zoho === "signin"
        ? '<h2>Sign in to Zoho</h2><p class="muted">Choose your account</p>' +
          '<button class="zacct" data-act="zohosignin"><span class="av">' + esc(SEED.store.name.charAt(0)) + '</span><span class="t"><b>' + esc(SEED.store.name) + "</b><span>" + esc(SEED.store.owner) + " · Zoho Inventory</span></span>" + ic("chev", 18) + "</button>" +
          '<button class="link quiet" data-act="zohocancel">Use another account</button>'
        : '<h2>Allow FoodBridge</h2><p class="muted">FoodBridge would like read-only access to:</p>' +
          '<ul class="zscopes"><li>Items: names, packs, rates</li><li>Tax details: GST and HSN</li><li>Your organisation\'s name</li></ul>' +
          '<label class="check" style="padding:0;min-height:44px"><input type="checkbox" data-bind="zallow"' + (ui.zallow ? " checked" : "") + '><span class="t"><span style="font-size:14px;color:var(--ink)">I allow FoodBridge to read the above, once</span></span></label>' +
          '<div class="zbtns"><button class="btn" data-act="zohoallow"' + (ui.zallow ? "" : " disabled") + '>Accept</button><button class="btn ghost" data-act="zohoreject">Reject</button></div>';
      win = '<div class="dim"></div><div class="zwin2" role="dialog" aria-modal="true" aria-label="Zoho">' + bar + '<div class="zin">' + steps + body + "</div>" +
        '<span class="zfoot">Simulated here. In the app this is Zoho\'s own page.</span></div>';
    }
    return phone(stepHead(1) + '<div class="body">' + flashHtml() + flow(0) + '<div class="zhero">' + badge + "<h1>Connect your Zoho account</h1></div>" + note +
      '<ul class="perks">' + perks + "</ul></div>" +
      foot(btn("Connect with Zoho", "zohoconnect"), '<span class="muted" style="text-align:center;padding:6px 0 2px">We never change anything in your Zoho.</span>'), win);
  };

  V["items-voice"] = function () {
    var on = ui.voice.on, said = !!ui.voice.text.trim();   // what was said is read during Processing, never here
    return phone(stepHead(1) + '<div class="body">' + flow(0) + title("Speak your products") +
      '<div class="mic"><button class="micbtn' + (on ? " on" : "") + '" data-act="mic" aria-pressed="' + on + '" aria-label="' + (on ? "Stop listening" : "Start speaking") + '">' + ic(on ? "stop" : "mic", 40) + "</button>" +
      '<span class="mtip">' + (on ? "Listening… name, units, rate" : "Tap and say: name, units, rate") + "</span>" +
      (ui.voice.text ? "" : '<button class="chip" data-act="voiceex">Try an example</button>') + "</div>" +
      '<label class="sr" for="vtext">What you said</label><textarea id="vtext" class="vtext" data-bind="voice" rows="3" placeholder="Or type: Parle-G 100 gram carton of 96 packets 720 rupees per carton, …">' + esc(ui.voice.text) + "</textarea>" +
"</div>" +
      foot(btn("Process", "voiceadd", said ? "" : " disabled"), '<a class="link quiet" href="#items">Back</a>'));
  };

  function catName(id) { for (var i = 0; i < SEED.categories.length; i++) if (SEED.categories[i].id === id) return SEED.categories[i].name; return id || ""; }
  // Search products: search-first, like a search engine (addenda 009, 011). Food and food-related products only.
  // FoodBridge's own list answers at once; the live India-wide pool is Open Food Facts, searched after a pause in typing. Their search allows about 10 requests a minute per user, so: 3 letters minimum, a 500 ms pause, every query
  // cached, a busy service said plainly. Data: Open Food Facts contributors, ODbL.
  function normQ(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function catResults(q) {
    var toks = normQ(q).split(" ").filter(Boolean); if (!toks.length) return [];
    var find = function (withCat) {   // the product's name first; its category only when no name matches
      return SEED.catalog.map(function (p, i) { return { p: p, i: i, hay: " " + normQ(p.name + (withCat ? " " + catName(p.category) : "")) }; })
        .filter(function (x) { return FOOD_CATS.test(x.p.category); })
        .filter(function (x) { return toks.every(function (t) { return x.hay.indexOf(t) !== -1; }); })
        .sort(function (a, b) { return (a.hay.indexOf(" " + toks[0]) === 0 ? 0 : 1) - (b.hay.indexOf(" " + toks[0]) === 0 ? 0 : 1); });
    };
    var r = find(false);
    return (r.length ? r : find(true)).slice(0, 5).map(function (x) {
      return { id: "f" + x.i, name: x.p.name, baseUnit: x.p.baseUnit, bigUnit: x.p.bigUnit, perBig: x.p.perBig, mrp: x.p.mrp, gst: x.p.gst, hsn: x.p.hsn, category: catName(x.p.category), barcode: "",
        sub: "1 " + x.p.bigUnit + " = " + x.p.perBig + " " + E.plural(x.p.baseUnit) };
    });
  }
  var LIVE = [{ host: "https://world.openfoodfacts.org", label: "Open Food Facts" }];
  var FOOD_CATS = /^(biscuits|atta|oil|dal|spices|tea|noodles|snacks|salt-sugar|drinks)$/;   // the seed's food categories
  // Open Food Facts holds a few things that are not food (a handwash, a detergent): kept out by name and category
  var NOT_FOOD = /\b(soap|hand ?wash|body ?wash|shampoo|conditioner|tooth ?paste|tooth ?brush|detergent|dish ?wash|cleaner|deodorant|lotion|cosmetic|sanitizer|sanitiser|toilet|floor|bleach|perfume|cream for|face ?wash|hair ?oil|insect|repellent|diaper|napkin)\b|non-food|cosmetic|household|hygiene/i;
  var CAT_TAGS = [["biscuit", "Biscuits & rusk"], ["rusk", "Biscuits & rusk"], ["noodle", "Noodles & pasta"], ["pasta", "Noodles & pasta"], ["tea", "Tea & coffee"],
    ["coffee", "Tea & coffee"], ["spice", "Masala & spices"], ["condiment", "Masala & spices"], ["snack", "Namkeen & snacks"], ["chips", "Namkeen & snacks"], ["flour", "Atta & rice"],
    ["rice", "Atta & rice"], ["cereal", "Atta & rice"], ["oil", "Oil & ghee"], ["ghee", "Oil & ghee"], ["legume", "Dal & pulses"], ["pulse", "Dal & pulses"], ["lentil", "Dal & pulses"],
    ["salt", "Salt & sugar"], ["sugar", "Salt & sugar"], ["dair", "Milk & dairy"], ["milk", "Milk & dairy"], ["butter", "Milk & dairy"], ["cheese", "Milk & dairy"],
    ["paneer", "Milk & dairy"], ["yogurt", "Milk & dairy"], ["chocolate", "Sweets & chocolates"], ["confection", "Sweets & chocolates"], ["sweet", "Sweets & chocolates"], ["beverage", "Drinks & juices"], ["drink", "Drinks & juices"], ["juice", "Drinks & juices"], ["water", "Drinks & juices"]];
  var live = {}, liveTimer = null;   // query → { status: loading | done | busy | offline, items }
  function liveItem(p, src) {
    var name = String(p.product_name || "").replace(/\s+/g, " ").trim(), brand = String(p.brands || "").split(",")[0].trim(), qty = String(p.quantity || "").replace(/\s+/g, " ").replace(/(\d+)\.0+\b/g, "$1").trim();
    if (name.length < 3 || !p.code) return null;
    if (NOT_FOOD.test(name + " " + (p.categories_tags || []).join(" "))) return null;   // food and food-related only
    var squash = function (t) { return normQ(t).replace(/ /g, "").replace(/s$/, ""); };   // "Haldirams" = "Haldiram's"
    if (brand && normQ(name).replace(/ /g, "").indexOf(squash(brand)) === -1) name = brand + " " + name;
    if (qty && /\d/.test(qty) && normQ(name).replace(/ /g, "").indexOf(normQ(qty).replace(/ /g, "")) === -1) name += " " + qty;
    name = name.charAt(0).toUpperCase() + name.slice(1);
    var tags = (p.categories_tags || []).join(" "), cat = "";
    if (!cat) for (var i = 0; i < CAT_TAGS.length; i++) if (tags.indexOf(CAT_TAGS[i][0]) !== -1) { cat = CAT_TAGS[i][1]; break; }
    return { id: "o" + p.code, name: name, baseUnit: "", bigUnit: "", perBig: "", mrp: "", gst: "", hsn: "", category: cat, barcode: String(p.code),
      sub: "", rank: qty ? 1 : 0 };   // the pack size is already in the name
  }
  function liveSearch(q) {
    q = normQ(q); if (q.length < 3 || live[q]) return;
    var entry = live[q] = { status: "loading", items: [] }, busy = 0, ok = 0;
    // The service answers 503 now and then (seen: 503, 200, 503 in a row), with no retry hint: a failed call is tried
    // again three times, 1.2 s, 2.5 s and 5 s apart, before the owner is told it is busy.
    var DELAYS = [1200, 2500, 5000];
    var calls = LIVE.map(function (src) {
      var url = src.host + "/cgi/search.pl?search_terms=" + encodeURIComponent(q) + "&search_simple=1&action=process&json=1&page_size=12" +
        "&tagtype_0=countries&tag_contains_0=contains&tag_0=india&fields=code,product_name,brands,quantity,categories_tags";
      var attempt = function (n) {
        var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
        return fetch(url, ctl ? { signal: ctl.signal } : {}).then(function (r) {
          clearTimeout(t); if (!r.ok) throw new Error("HTTP " + r.status);
          return r.json();
        }).then(function (d) { ok++; return (d.products || []).map(function (p) { return liveItem(p, src); }).filter(Boolean); }, function () {
          clearTimeout(t);
          if (n < DELAYS.length && live[q] === entry) { entry.retry = n + 1; return new Promise(function (res) { setTimeout(res, DELAYS[n]); }).then(function () { return attempt(n + 1); }); }
          busy++; return [];   // refused or failed every time: the service is busy or out of reach
        });
      };
      return attempt(0);
    });
    Promise.all(calls).then(function (lists) {
      var seen = {}, all = [];
      [].concat.apply([], lists).sort(function (a, b) { return b.rank - a.rank; }).forEach(function (x) {
        var k = normQ(x.name); if (seen[k]) return; seen[k] = 1; all.push(x);
      });
      entry.items = all.slice(0, 8);
      entry.status = ok ? "done" : navigator.onLine === false ? "offline" : "busy";
      if (busy && !ok) setTimeout(function () { if (live[q] === entry) delete live[q]; }, 20000);   // a busy answer is not kept: retry later
      if (route() === "items-catalog" && normQ(ui.cat.q) === q) { render(); keepTyping("#csearch"); }
    });
  }
  function scheduleLive() {
    clearTimeout(liveTimer);
    var q = normQ(ui.cat.q); if (q.length < 3 || live[q]) return;
    liveTimer = setTimeout(function () { liveSearch(q); if (route() === "items-catalog") { render(); keepTyping("#csearch"); } }, 500);
  }
  function catAll(q) {   // what the dropdown lists: FoodBridge's own matches, then the live pool's
    var loc = catResults(q), l = live[normQ(q)], seen = {};
    loc.forEach(function (x) { seen[normQ(x.name)] = 1; });
    return loc.concat(((l && l.items) || []).filter(function (x) { return !seen[normQ(x.name)]; }));
  }
  function hl(name, q) {   // the typed words, bold in the result
    var out = esc(name), toks = normQ(q).split(" ").filter(function (t) { return t.length > 0; });
    toks.forEach(function (t) { out = out.replace(new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "i"), "<mark>$1</mark>"); });
    return out;
  }
  function togglePick(id) {
    var c = ui.cat; if (c.picked[id]) { delete c.picked[id]; return; }
    var x = catAll(c.q).filter(function (r) { return r.id === id; })[0]; if (x) c.picked[id] = x;
  }
  V["items-catalog"] = function () {
    var c = ui.cat, res = catAll(c.q), picked = Object.keys(c.picked).map(function (k) { return c.picked[k]; });
    var q = normQ(c.q), l = live[q];
    if (c.hi >= res.length) c.hi = -1;
    var box = '<div class="gsearch' + (c.q ? " open" : "") + '"><label class="search big"><span class="sr">Search products</span>' + ic("search", 20) +
      '<input id="csearch" data-bind="csearch" value="' + esc(c.q) + '" placeholder="Search any product: brand, name, pack" autocomplete="off" enterkeyhint="search" role="combobox" aria-expanded="' + !!c.q + '" aria-controls="cres">' +
      (c.q ? '<button class="iconbtn" data-act="catclear" aria-label="Clear search">' + ic("close", 18) + "</button>" : "") + "</label>";
    if (c.q) {
      var status = q.length < 3 ? ""
        : !l || l.status === "loading" ? '<li class="gstat"><span class="spin"></span>Searching India\'s product list…' + (l && l.retry ? " (busy, trying again)" : "") + "</li>"
        : l.status === "busy" ? '<li class="gstat warn">' + ic("alert", 15) + 'The live product list is busy. <button class="link" data-act="catretry">Try again</button></li>'
        : l.status === "offline" ? '<li class="gstat warn">' + ic("alert", 15) + "You're offline. Showing FoodBridge's list.</li>"
        : !l.items.length ? '<li class="gstat">Nothing more in India\'s product list.</li>' : "";
      box += '<ul class="gres" id="cres" role="listbox">' + res.map(function (x, k) {
        var on = !!c.picked[x.id];
        return '<li role="option" aria-selected="' + on + '"><button class="gopt' + (k === c.hi ? " hi" : "") + (on ? " on" : "") + '" data-act="catpick" data-id="' + esc(x.id) + '" aria-label="' + esc(x.name) + (on ? ", added" : ", add") + '">' +
          '<span class="t"><b>' + (q.length >= 3 ? hl(x.name, c.q) : esc(x.name)) + "</b>" + (x.sub ? "<span>" + esc(x.sub) + "</span>" : "") + "</span>" +
          '<span class="tog" aria-hidden="true">' + (on ? ic("check", 16, 3) : ic("plus", 16, 2.2)) + "</span></button></li>";
      }).join("") + (!res.length && l && l.status === "done" ? '<li class="gnone">No match for “' + esc(c.q) + "”. Try a brand or a product name.</li>" : "") + status +
        (l && l.items.length ? '<li class="gattr">Live results: Open Food Facts contributors, ODbL</li>' : "") + "</ul>";
    }
    box += "</div>";
    if (c.q) {   // search is active: the search box and its results take the whole screen
      var list = box.slice(box.indexOf('<ul class="gres"'), box.lastIndexOf("</ul>") + 5).replace('<ul class="gres"', '<ul class="gres full"');
      var m = picked.length;
      return phone('<div class="gtop"><button class="iconbtn" data-act="catclear" aria-label="Back">' + ic("back", 24) + '</button><label class="gfield"><span class="sr">Search products</span>' +
        '<input id="csearch" data-bind="csearch" value="' + esc(c.q) + '" placeholder="Search any product: brand, name, pack" autocomplete="off" enterkeyhint="search" role="combobox" aria-expanded="true" aria-controls="cres">' +
        '<button class="iconbtn" data-act="catclear" aria-label="Clear search">' + ic("close", 18) + "</button></label></div>" + list +
        '<div class="gbar">' + btn(m ? "Done · " + m + " selected" : "Done", "catclear") + "</div>").replace('class="phone"', 'class="phone gfull"');
    }
    var hint = !c.q && !picked.length ? '<div class="ghint">' + ic("search", 34) + "<b>Search India's product list</b><span>Try</span><div class=\"gtry\">" +
      ["Parle-G", "Tata salt", "Maggi", "toor dal"].map(function (t) { return '<button class="chip" data-act="cattry" data-v="' + t + '">' + t + "</button>"; }).join("") + "</div></div>" : "";
    var sel = picked.length ? '<span class="then">Selected · ' + picked.length + '</span><div class="list">' + picked.map(function (x) {
      return '<div class="item"><span class="t"><b>' + esc(x.name) + "</b>" + (x.sub ? "<span>" + esc(x.sub) + "</span>" : "") + '</span><button class="iconbtn" data-act="catunpick" data-id="' + esc(x.id) + '" aria-label="Remove ' + esc(x.name) + '">' + ic("close", 18) + "</button></div>";
    }).join("") + "</div>" : "";
    var n = picked.length;
    return phone(stepHead(1) + '<div class="body" style="gap:12px">' + flow(0) + title("Search products") + box + hint + sel + "</div>" +
      foot(btn("Process " + (n || "") + " product" + (n === 1 ? "" : "s"), "catadd", n ? "" : " disabled"), '<a class="link quiet" href="#items">Back</a>'));
  };

  V["items-categories"] = function () { location.replace("#items"); return ""; };   // removed (addendum-010)

  // Processing: one screen, the same for every way, with nothing of the way it came from: the stages and the products as
  // they are found. In the product each stage is a background call whose progress streams in; here they run on a clock.
  V.processing = function () {
    var j = s.items.job;
    if (!j) { location.replace(s.items.sheet.length ? "#review" : "#items"); return ""; }
    var p = E.jobProgress(j, Date.now()), pct = Math.round(p.fraction * 100);
    var found = j.rows.slice(0, p.found), fix = E.sheetSummary(found, s.items.saved).fix;
    var stages = '<ol class="stages">' + p.stages.map(function (t, i) {
      var st = i < p.stage ? "done" : i === p.stage ? "on" : "";
      return '<li class="' + st + '"><i>' + (st === "done" ? ic("check", 14, 3) : st === "on" ? '<span class="spin"></span>' : "") + "</i>" + esc(t) + "</li>";
    }).join("") + "</ol>";
    var live = '<div class="live"><div class="nums"><span><b>' + p.found + "</b> found</span>" + (fix ? '<span class="bad"><b>' + fix + "</b> to fix</span>" : "") + "</div>" +
      '<div class="bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>' +
      '<ul class="feed" aria-live="polite">' + found.slice(-4).reverse().map(function (r) { return "<li>" + ic("check", 14, 3) + esc(r.name || "(name to fix)") + "</li>"; }).join("") + "</ul></div>";
    var away = E.isDone(s, "customers") ? go("Back to Getting started", "#home") : go("Add customers meanwhile", "#customers");
    return phone(stepHead(1) + '<div class="body">' + flow(1) + title("Processing") + stages + live + "</div>" +
      foot(away, '<span class="muted" style="text-align:center;padding:4px 0">It keeps going. Check and save opens when it\'s done.</span>'));
  };
  V.reading = function () { location.replace("#processing"); return ""; };

  // ---------- the sheet ----------
  var LETTERS = "ABCDEFGHIJKLMNOP";
  function sheetRows() { return s.items.sheet; }
  function rowById(id) { var rows = sheetRows(); for (var i = 0; i < rows.length; i++) if (rows[i].id === id) return rows[i]; return null; }
  function visibleRows() {
    var rows = sheetRows();
    return rows.filter(function (r) {
      if (ui.filter === "fix") return E.rowIssues(r, rows, s.items.saved).length > 0 || (ui.sel && ui.sel.r === r.id);
      if (ui.filter === "norate") return !E.isEmptyRow(r) && E.blank(r.rate);
      return true;
    });
  }
  function colIndex(key) { for (var i = 0; i < E.COLS.length; i++) if (E.COLS[i].key === key) return i; return -1; }
  function cellRef() {
    var sel = ui.sel; if (!sel) return "";
    var n = sheetRows().indexOf(rowById(sel.r)) + 2;   // row 1 is the header, as in a spreadsheet
    return sel.c ? LETTERS[colIndex(sel.c)] + n : n + ":" + n;
  }
  function cellVal(r, key) { return r[key] == null ? "" : String(r[key]); }

  // ---------- Check & save on a phone: cards, a guided fixer, a bottom-sheet editor (addendum-012) ----------
  // A computer keeps the sheet. A phone gets one product per card; what needs the owner is asked one question at a
  // time with big answers; a tap on a card opens a large-field editor. "Open as sheet" stays in the ⋯ menu.
  function mobileView() { return ui.view === "cards" || (ui.view !== "sheet" && window.innerWidth < 700); }
  function unitsLine(r) { return (E.blank(r.bigUnit) ? "?" : "1 " + r.bigUnit) + " = " + (E.blank(r.perBig) ? "?" : r.perBig) + " " + (E.blank(r.baseUnit) ? "units" : E.plural(r.baseUnit)); }
  function rateLine(r) {   // "₹480 per carton (₹4 per packet)"
    var p = E.prices(r); if (!p) return E.blank(r.rate) ? "no rate yet" : "rate “" + r.rate + "”";
    var side = E.rateSide(r), q = side === "big" ? p.big : p.base, d = side === "big" ? p.base : p.big;
    return rupees(q) + " per " + (side === "big" ? r.bigUnit : r.baseUnit) + (d != null ? " (" + rupees(d) + " per " + (side === "big" ? r.baseUnit : r.bigUnit) + ")" : "");
  }
  function packLine(r) { return unitsLine(r) + " · " + rateLine(r); }
  function taxWord(r) { var t = E.taxFlag(r.taxIncl); return t === true ? "GST included" : t === false ? "GST extra" : ""; }
  // every open question, in sheet order, minus the ones skipped this round; the list-wide GST question comes first, once
  function fixList() {
    var rows = sheetRows(), out = [], batch = null;
    rows.forEach(function (r) {
      E.rowIssues(r, rows, s.items.saved).forEach(function (i) {
        if (i.batch) { if (!batch && !ui.fixSkip["tax"]) batch = { r: r, i: i, batch: true }; return; }
        if (i.group && ui.fixAll !== false && out.some(function (x) { return x.i.group === i.group; })) return;   // answered once for all, unless the owner unticks
        if (!ui.fixSkip[r.id + ":" + i.col + (i.dup ? ":d" : "")]) out.push({ r: r, i: i });
      });
    });
    return batch ? [batch].concat(out) : out;
  }
  function question(r, i) {
    var cap = function (t) { return t.charAt(0).toUpperCase() + t.slice(1); }, rows = sheetRows();
    if (i.batch) {
      var n = rows.filter(function (x) { return !E.blank(x.rate) && E.taxFlag(x.taxIncl) === null; }).length;
      return { t: "Do these rates include GST?", b: "A rate list says it once, at the top. Your answer applies to " + n + " rate" + (n === 1 ? "" : "s") + ".", input: false, who: "Your rate list" };
    }
    if (i.dup) return { t: "Same product?", b: "It looks like " + i.msg.replace(/^.*?“/, "“") + (i.msg.indexOf("Already saved") === 0 ? ", already saved." : ", higher up the list."), input: false };
    if (i.col === "rate") return { t: "Which rate is right?", b: "The rate per " + (r.rateUnit || "unit") + " can't be read: “" + r.rate + "”.", input: "Or type the rate", mode: "decimal" };
    if (i.col === "name") return { t: "What is this product?", b: "It has no name. " + cap(packLine(r)) + ".", input: "Type the name" };
    if (i.col === "baseUnit") return { t: "What is the smallest unit?", b: "The one piece a shop can buy: a packet, a bottle, a kg…", input: "Or type the unit" };
    if (i.col === "bigUnit") return { t: "What bigger unit is it sold in?", b: "It holds " + (E.blank(r.perBig) ? "several" : r.perBig) + " " + E.plural(r.baseUnit || "units") + ".", input: "Or type the unit" };
    if (i.col === "perBig") return { t: i.msg, b: "1 " + r.bigUnit + " = how many " + E.plural(r.baseUnit || "units") + "? The other rate is worked out from this.", input: "Type the number", mode: "numeric" };
    if (i.col === "rateUnit") return { t: "₹" + r.rate + " is the rate per…", b: "1 " + r.bigUnit + " = " + (r.perBig || "?") + " " + E.plural(r.baseUnit) + ".", input: false };
    if (i.col === "gst") {
      var others = rows.filter(function (x) { return x !== r && E.blank(x.gst) && !E.isEmptyRow(x); }).length;
      return { t: "Which GST rate?", b: E.blank(r.gst) ? "No GST rate on this product." : "It says " + r.gst + "%. GST is 0, 5, 18 or 40%.", input: false, gst: true, others: E.blank(r.gst) ? others : 0 };
    }
    if (i.col === "mrp") return { t: "What is the MRP?", b: "“" + r.mrp + "” is not a number.", input: "Type the MRP", mode: "decimal" };
    if (i.col === "hsn") return { t: "What is the HSN code?", b: "“" + r.hsn + "” is not 4 to 8 digits.", input: "Type the HSN", mode: "numeric" };
    return { t: i.msg, b: "", input: "Type the value" };
  }
  function fixer() {
    var list = fixList(), cur = list[0];
    if (!cur) return "";
    ui.fixTotal = Math.max(ui.fixTotal, list.length);   // unticking "use it for the others" adds questions
    var done = ui.fixTotal - list.length, q = question(cur.r, cur.i), pct = Math.round(done / Math.max(1, ui.fixTotal) * 100);
    var opts = q.gst ? E.GST_SLABS.map(function (v) { return { label: v + "%", value: String(v), pri: cur.i.fixes.length && cur.i.fixes[0].value === String(v) }; })
      : cur.i.fixes.map(function (f) { return { label: f.label === "Merge" ? "Yes, merge them" : f.label === "Keep both" ? "No, keep both" : f.label, value: f.value, action: f.action, pri: f === cur.i.fixes[0] }; });
    var buttons = opts.map(function (o) {
      return '<button class="fxopt' + (o.pri ? " pri" : "") + '" data-act="fixans" data-col="' + cur.i.col + '"' + (cur.batch ? ' data-batch="1"' : "") + (o.action ? ' data-a="' + o.action + '"' : ' data-v="' + esc(o.value) + '"') + ">" + esc(o.label) + "</button>";
    }).join("");
    var all = q.others ? '<label class="fxall"><input type="checkbox" data-bind="fixall"' + (ui.fixAll ? " checked" : "") + ">Use it for the other " + q.others + " without GST too</label>" : "";
    var typed = q.input ? '<form class="fxtype" data-act="fixtype" data-col="' + cur.i.col + '"><input id="fixin" placeholder="' + esc(q.input) + '"' + (q.mode ? ' inputmode="' + q.mode + '"' : "") + ' autocomplete="off" enterkeyhint="done"><button class="iconbtn" aria-label="Use this">' + ic("check", 20, 2.6) + "</button></form>" : "";
    return '<div class="fixer" role="dialog" aria-modal="true" aria-labelledby="fx-t"><div class="fxtop"><button class="iconbtn" data-act="fixclose" aria-label="Close">' + ic("close", 22) + '</button><span class="fxn">' + (done + 1) + " of " + ui.fixTotal + '</span><span style="width:44px"></span></div>' +
      '<div class="bar fxbar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="fxbody"><span class="fxwho">' + esc(q.who || (E.blank(cur.r.name) ? "Product with no name" : cur.r.name)) + '</span><h2 id="fx-t">' + esc(q.t) + "</h2>" + (q.b ? "<p>" + esc(q.b) + "</p>" : "") +
      '<div class="fxopts' + (opts.length > 3 ? " many" : "") + '">' + buttons + "</div>" + all + typed + "</div>" +
      '<div class="fxfoot"><button class="link quiet" data-act="fixskip">Skip for now</button>' + (cur.batch ? "" : '<button class="link danger" data-act="fixdel">' + ic("trash", 16) + " Delete product</button>") + "</div></div>";
  }
  // The editor: must-haves only, as three short sentences under the name (addendum-017) — Pack: 1 [carton] = [96] [packets];
  // Rate: ₹ [720] per [carton]; GST: [5%] [+ GST extra]. MRP, HSN, barcode and category stay in the sheet view.
  function editor() {
    var r = rowById(ui.edit); if (!r) return "";
    var iss = E.rowIssues(r, sheetRows(), s.items.saved), errs = function (cols) { return iss.filter(function (i) { return !i.dup && cols.indexOf(i.col) !== -1; }); };
    var inp = function (c, mode, ph, size, list) { var bad = errs([c]).length; return '<input class="ein' + (bad ? " bad" : "") + '" data-bind="ef" data-c="' + c + '" value="' + esc(cellVal(r, c)) + '" style="width:' + size + 'px"' + (mode ? ' inputmode="' + mode + '"' : "") + (ph ? ' placeholder="' + ph + '"' : "") + (list ? ' list="' + list + '"' : "") + ' autocomplete="off" aria-label="' + c + '">'; };
    var sel = function (c, opts, cur, label) { var bad = errs([c]).length; return '<select class="ein' + (bad ? " bad" : "") + '" data-bind="ef" data-c="' + c + '" aria-label="' + label + '">' + (cur === "" ? '<option value="" selected disabled>Choose</option>' : "") + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === cur ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>"; };
    var line = function (label, cols, body, note) {
      var e = errs(cols)[0];
      return '<div class="eline' + (e ? " bad" : "") + '"><span class="elab">' + label + '</span><div class="ebox"><div class="esent">' + body + "</div>" + (e ? '<span class="eerr">' + esc(e.msg) + "</span>" : note ? '<span class="enote">' + note + "</span>" : "") + "</div></div>";
    };
    var side = E.rateSide(r), p = E.prices(r), tf = E.taxFlag(r.taxIncl), g = E.num(r.gst);
    var pack = "1 " + inp("bigUnit", "", "carton", 84, "dl-big") + " = " + inp("perBig", "numeric", "?", 56) + " " + inp("baseUnit", "", "packet", 84, "dl-base");
    var both = !E.blank(r.bigUnit) && !E.blank(r.baseUnit);
    var rate = "₹ " + inp("rate", "decimal", "add later", 100) + (both ? " per " + sel("rateUnit", [[r.bigUnit, r.bigUnit], [r.baseUnit, r.baseUnit]], side === "big" ? r.bigUnit : side === "base" ? r.baseUnit : "", "Rate per") : "");
    var other = p && p.base != null && p.big != null ? (side === "big" ? rupees(p.base) + " per " + esc(r.baseUnit) : rupees(p.big) + " per " + esc(r.bigUnit)) : "";
    var slabs = E.GST_SLABS.map(function (v) { return [String(v), v + "%"]; }); if (!E.blank(r.gst) && E.GST_SLABS.indexOf(g) === -1) slabs.push([r.gst, r.gst + "%"]);
    var gst = sel("gst", slabs, E.blank(r.gst) ? "" : E.GST_SLABS.indexOf(g) !== -1 ? String(g) : r.gst, "GST rate") +
      (E.blank(r.rate) ? "" : " " + sel("taxIncl", [["extra", "+ GST extra"], ["incl", "GST included"]], tf === true ? "incl" : tf === false ? "extra" : "", "GST in the rate"));
    var dup = iss.filter(function (i) { return i.dup; })[0];
    var dl = function (id, list) { return '<datalist id="' + id + '">' + list.map(function (u) { return '<option value="' + u + '">'; }).join("") + "</datalist>"; };
    return '<div class="dim" data-act="edclose"></div><div class="sheet esheet" role="dialog" aria-modal="true" aria-label="Edit product"><span class="grab"></span>' +
      '<div class="ehead"><h2>Edit product</h2><button class="link" data-act="edclose">Done</button></div><div class="ebody">' +
      '<label class="ename' + (errs(["name"]).length ? " bad" : "") + '"><span class="sr">Product name</span><input data-bind="ef" data-c="name" value="' + esc(cellVal(r, "name")) + '" placeholder="Product name" autocomplete="off"></label>' +
      (errs(["name"]).length ? '<span class="eerr">' + esc(errs(["name"])[0].msg) + "</span>" : "") +
      (dup ? '<div class="fix"><span class="msg">' + ic("alert", 16) + esc(dup.msg) + '</span><span class="opts"><button class="chip pri" data-act="edmerge">Merge</button><button class="chip" data-act="edkeep">Keep both</button></span></div>' : "") +
      '<div class="elines">' + line("Packing", ["bigUnit", "perBig", "baseUnit"], pack) + line("Rate", ["rate", "rateUnit"], rate, other) + line("GST", ["gst", "taxIncl"], gst) + "</div>" +
      dl("dl-big", ["carton", "box", "bag", "peti", "crate", "case", "bale", "tray"]) + dl("dl-base", ["packets", "pcs", "kg", "bottles", "pouches", "jars", "tins"]) +
      '<button class="link danger edel" data-act="eddel">' + ic("trash", 16) + "Delete product</button></div></div>";
  }
  function overflowMenu() {
    if (!ui.rmenu) return "";
    return '<div class="dim clear" data-act="rmenu"></div><div class="menu rmenu" role="menu">' +
      '<button role="menuitem" data-act="viewsheet">' + ic("grid") + "Open as sheet</button>" +
      '<a role="menuitem" href="#items">' + ic("plus") + "Add more products</a>" +
      '<button role="menuitem" class="out" data-act="dropask">' + ic("trash") + "Drop all</button></div>";
  }
  // Check & save on a phone: a plain rate list (addendum-016, simplifying 013/014). A row is the name and the rate; under
  // them, the units and which unit the rate is for. A row that needs the owner says its first fix in red, in that line.
  // a product's tile: its initials on a soft tint, the same tint for the same category; red "!" when it needs a fix
  function tile(r, bad) {
    if (bad) return '<span class="pt bad" aria-hidden="true">!</span>';
    var w = String(r.name || "").replace(/[^A-Za-z0-9 ]+/g, " ").split(" ").filter(function (x) { return /[a-z]/i.test(x); });
    var k = 0, c = String(r.category || r.name || ""); for (var i = 0; i < c.length; i++) k = (k * 31 + c.charCodeAt(i)) % 997;
    return '<span class="pt t' + (k % 6) + '" aria-hidden="true">' + esc(((w[0] || "?").charAt(0) + (w[1] ? w[1].charAt(0) : "")).toUpperCase()) + "</span>";
  }
  function fixWords(i) { return i.dup ? "Same as “" + i.msg.replace(/^.*?“/, "").replace(/”$/, "") + "”?" : i.msg; }
  function reviewCards() {
    var rows = sheetRows(), sum = E.sheetSummary(rows, s.items.saved), real = rows.filter(function (r) { return !E.isEmptyRow(r); });
    var lines = real.map(function (r) {
      var own = E.rowIssues(r, rows, s.items.saved).filter(function (i) { return !i.batch; });
      var p = E.prices(r), side = E.rateSide(r);
      var rate = p ? rupees(side === "big" ? p.big : p.base) : E.blank(r.rate) ? '<span class="none">—</span>' : "<em>" + esc(r.rate) + "</em>";
      var per = p ? "/" + esc(side === "big" ? r.bigUnit : r.baseUnit) : "";
      var units = E.blank(r.bigUnit) || E.blank(r.perBig) ? esc(E.plural(r.baseUnit || "")) : esc("1 " + r.bigUnit + " = " + r.perBig + " " + E.plural(r.baseUnit || "units"));
      var sub = own.length ? '<em>' + esc(fixWords(own[0])) + (own.length > 1 ? " · +" + (own.length - 1) + " more" : "") + "</em>" : units;
      return '<button class="pl' + (own.length ? " bad" : "") + '" data-act="pedit" data-r="' + r.id + '" aria-label="Edit ' + esc(r.name || "product with no name") + '">' + tile(r, own.length) +
        '<span class="t"><b>' + (E.blank(r.name) ? '<span class="none">No name</span>' : esc(r.name)) + "</b><span>" + sub + "</span></span>" +
        '<span class="r"><b>' + rate + "</b><span>" + per + '</span></span><span class="pe" aria-hidden="true">' + ic("pen", 16) + "</span></button>";
    }).join("");
    var nq = sum.questions;
    var main = nq ? btn("Answer " + nq + " quick question" + (nq === 1 ? "" : "s"), "fixstart") : btn("Save " + sum.total + " product" + (sum.total === 1 ? "" : "s"), "save", sum.total ? "" : " disabled");
    var second = nq && sum.ok ? '<button class="link quiet" data-act="savesome">Save ' + sum.ok + " now, fix the rest later</button>" : "";
    var snack = ui.snack ? '<div class="snack" role="status"><span>' + esc(ui.snack) + '</span><button class="link" data-act="snackundo">Undo</button></div>' : "";
    var over = ui.fixing ? fixer() : ui.edit ? editor() : dropSheet(sum) || overflowMenu();
    return phone(stepHead(1) + '<div class="body cbody">' + flashHtml() +
      '<div class="chead"><h1>Your rate list</h1><button class="iconbtn" data-act="rmenu" aria-label="More" aria-expanded="' + !!ui.rmenu + '">' + ic("dots", 22) + "</button></div>" +
      '<div class="plist"><div class="phd"><span>Item</span><span>Rate ₹</span></div>' + lines + '</div><a class="padd" href="#items">' + ic("plus", 18) + "Add more products</a></div>" + snack +
      foot(main, second), over);
  }

  V.review = function () {
    if (!s.items.sheet.length) { location.replace(s.items.job ? "#processing" : "#items"); return ""; }
    if (mobileView()) return reviewCards();
    var rows = sheetRows(), sum = E.sheetSummary(rows, s.items.saved), vis = visibleRows();
    if (ui.sel && !rowById(ui.sel.r)) ui.sel = null;
    var issuesOf = {}; rows.forEach(function (r) { issuesOf[r.id] = E.rowIssues(r, rows, s.items.saved); });

    var chip = function (id, label, n, cls) { return '<button class="chip' + (ui.filter === id ? " on" : "") + (cls ? " " + cls : "") + '" data-act="filter" data-v="' + id + '">' + label + " <b>" + n + "</b></button>"; };
    var tools = '<div class="stools"><div class="chips">' + chip("all", "All", sum.total) + chip("fix", "Needs a fix", sum.fix, sum.fix ? "red" : "") + chip("norate", "No rate", sum.noRate) + "</div>" +
      '<button class="iconbtn" data-act="undo" aria-label="Undo"' + (ui.undo.length ? "" : " disabled") + ">" + ic("undo", 20) + "</button></div>";

    var sel = ui.sel, cur = sel ? rowById(sel.r) : null, col = sel && sel.c ? E.COLS[colIndex(sel.c)] : null;
    var fx = '<div class="fbar"><span class="ref">' + (cellRef() || "&nbsp;") + '</span><span class="fxi">fx</span>' +
      '<input id="fx" data-bind="fx" autocomplete="off" enterkeyhint="next" aria-label="' + (col ? esc(col.label) : "Cell") + '" placeholder="' + (col ? esc(col.label) : "Tap a cell") + '"' +
      (col && col.num ? ' inputmode="decimal"' : "") + (cur && col && !col.readOnly ? ' value="' + esc(cellVal(cur, col.key)) + '" data-r="' + cur.id + '" data-c="' + col.key + '"' : " disabled") + "></div>";

    var strip = "";
    if (cur) {
      var here = issuesOf[cur.id].filter(function (i) { return !sel.c || i.col === sel.c; });
      if (here.length) {
        strip = here.map(function (i) {
          return '<div class="fix"><span class="msg">' + ic("alert", 16) + esc(i.msg) + "</span><span class=\"opts\">" + i.fixes.map(function (f) {
            return '<button class="chip' + (f.action === "merge" || (f.value != null && i.fixes[0] === f) ? " pri" : "") + '" data-act="fix" data-col="' + i.col + '"' + (f.action ? ' data-a="' + f.action + '"' : ' data-v="' + esc(f.value) + '"') + ">" + esc(f.label) + "</button>";
          }).join("") + "</span></div>";
        }).join("");
      } else if (!sel.c) {
        strip = '<div class="fix ok"><span class="msg">Row ' + (rows.indexOf(cur) + 2) + "</span><span class=\"opts\"><button class=\"chip\" data-act=\"delrow\">" + ic("trash", 14) + " Delete row</button></span></div>";
      }
    }

    var head = '<tr><th class="rn corner" scope="col"></th>' + E.COLS.map(function (c, i) {
      return '<th scope="col" class="h-' + c.key + '" style="min-width:' + c.w + 'px"><span class="ltr">' + LETTERS[i] + "</span>" + esc(c.label) + "</th>";
    }).join("") + "</tr>";
    var body = vis.map(function (r) {
      var n = rows.indexOf(r) + 2, iss = issuesOf[r.id], rowSel = sel && sel.r === r.id && !sel.c;
      return '<tr class="' + (rowSel ? "rsel" : "") + '"><th class="rn' + (iss.length ? " bad" : "") + '" scope="row" data-act="selrow" data-r="' + r.id + '">' + n + "</th>" + E.COLS.map(function (c) {
        var bad = iss.some(function (i) { return i.col === c.key; });
        var v = c.key === "rate" || c.key === "mrp" ? (E.blank(r[c.key]) ? "" : (E.num(r[c.key]) > 0 ? Number(E.num(r[c.key])).toLocaleString("en-IN") : cellVal(r, c.key))) : cellVal(r, c.key);
        var cls = ["c-" + c.key]; if (bad) cls.push("bad"); if (c.num) cls.push("num"); if (c.readOnly) cls.push("ro");
        if (sel && sel.r === r.id && sel.c === c.key) cls.push("sel");
        if (c.key === "rate" && E.blank(r.rate) && !E.isEmptyRow(r)) { cls.push("ph"); v = "—"; }
        if (c.key === "taxIncl") { var tf = E.taxFlag(r.taxIncl); v = tf === true ? "Included" : tf === false ? "Extra" : cellVal(r, c.key); }
        return '<td class="' + cls.join(" ") + '" data-act="cell" data-r="' + r.id + '" data-c="' + c.key + '"' + (bad ? ' title="' + esc(iss.filter(function (i) { return i.col === c.key; })[0].msg) + '"' : "") + ">" + esc(v) + "</td>";
      }).join("") + "</tr>";
    }).join("");
    if (!vis.length) body = '<tr><th class="rn"></th><td colspan="' + E.COLS.length + '" class="empty">' + (ui.filter === "fix" ? "Nothing to fix. Every row is ready." : "Every product has a rate.") + "</td></tr>";
    body += '<tr class="addrow"><th class="rn">+</th><td colspan="' + E.COLS.length + '"><button data-act="addrow">' + ic("plus", 16) + " Add a product</button></td></tr>";
    var grid = '<input id="catch" class="catch" aria-hidden="true" tabindex="-1" autocomplete="off">' +   // catches typing into a selected cell, as a spreadsheet does
      '<div class="grid" id="grid" role="region" aria-label="Your products sheet" tabindex="-1"><table><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div>";

    var main = sum.fix ? btn("Fix next · " + sum.fix + " left", "fixnext") : btn("Save " + sum.total + " product" + (sum.total === 1 ? "" : "s"), "save", sum.total ? "" : " disabled");
    var second = sum.fix && sum.ok ? '<button class="link quiet" data-act="savesome">Save ' + sum.ok + " now, fix " + sum.fix + " later</button>" : "";
    return phone(stepHead(1) + '<div class="sbody">' + flow(2) + '<div class="shead"><h1>Check & save</h1><span class="acts">' + (window.innerWidth < 700 ? '<button class="link quiet" data-act="viewcards">' + ic("list", 16) + "List</button>" : "") + '<button class="link quiet" data-act="dropask">' + ic("trash", 16) + "Drop all</button>" +
      '<a class="link" href="#items">' + ic("plus", 16) + "Add more</a></span></div>" + tools + fx + strip + grid + "</div>" + foot(main, second), dropSheet(sum)).replace('class="phone"', 'class="phone wide"');
  };

  // Drop all: the unsaved sheet goes, the owner is back at the six ways. Saved products are never touched.
  function dropSheet(sum) {
    if (!ui.dropAsk) return "";
    var saved = s.items.saved.length;
    return '<div class="dim" data-act="dropno"></div><div class="sheet" role="alertdialog" aria-modal="true" aria-labelledby="drop-t"><span class="grab"></span>' +
      '<h2 id="drop-t">Drop all ' + sum.total + " product" + (sum.total === 1 ? "" : "s") + "?</h2>" +
      '<p class="muted" style="margin:0 0 14px">They are not saved yet. You go back to the ways to add products.' + (saved ? " Your " + saved + " saved product" + (saved === 1 ? " stays" : "s stay") + "." : "") + "</p>" +
      '<button class="btn danger" data-act="dropall">' + ic("trash", 18) + "Drop all and start again</button>" +
      '<button class="link quiet" data-act="dropno">Keep checking</button></div>';
  }

  V.check = function () { location.replace("#review"); return ""; };

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
      return '<div class="item' + (q ? " on" : "") + '"><span class="t"><b>' + esc(i.name) + "</b><span>" + esc(i.unit) + " · " + (i.price == null ? "price at delivery" : rupees(i.price) + (E.taxFlag(i.taxIncl) === false ? " + GST" : "")) + "</span></span>" + ctl + "</div>";
    }).join("") || '<div class="item"><span class="t"><span>No item matches “' + esc(d.search) + "”</span></span></div>";
    var lines = its.filter(function (i) { return d.qty[i.id]; });
    var olines = lines.map(function (i) { return { qty: d.qty[i.id], price: i.price, gst: i.gst, taxIncl: i.taxIncl }; });
    var total = E.orderTotal(olines), tax = E.orderTax(olines);   // GST added when the rate is "+ GST extra" (addendum-014)
    var opts = cs.map(function (x) { return '<option value="' + x.id + '"' + (x.id === d.customerId ? " selected" : "") + ">" + esc(x.name) + "</option>"; }).join("");
    var pay = [["udhaar", "Udhaar"], ["cash", "Cash"], ["upi", "UPI"]].map(function (p) { return '<option value="' + p[0] + '"' + (p[0] === d.payment ? " selected" : "") + ">" + p[1] + "</option>"; }).join("");
    return phone(stepHead(3) + '<div class="body" style="gap:12px">' + title("New order") +
      '<label class="rowline"><span class="k">For</span><select data-bind="cust" aria-label="Customer">' + opts + "</select></label>" +
      '<label class="search">' + '<span class="sr">Search items</span><input data-bind="search" value="' + esc(d.search) + '" placeholder="Search your ' + its.length + ' products" autocomplete="off"></label>' +
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
    var what = s.order.lines.map(function (l) { return l.qty + " " + (l.unit ? (l.qty === 1 ? l.unit : E.plural(l.unit)) + " " : "") + l.name; }).join(", ");
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
    function wout(text, time) { return '<div class="wout"><span>' + esc(text) + "</span><time>" + time + "</time></div>"; }
    var earlier = '<div class="wachip">YESTERDAY</div>' +
      win("<span>Namaste! Let's set up your FoodBridge store. What is your business called?</span>", "18:10") +
      wout(SEED.store.name, "18:11") +
      win("<span>Your mobile number?</span>", "18:11") +
      wout(SEED.store.mobile, "18:12") +
      win("<span>Your GST number? Type <b>skip</b> if you don't have one.</span>", "18:12") +
      wout(SEED.store.gstin, "18:13") +
      win("<span>Thank you, " + esc(SEED.store.owner) + " ji. We are setting up your store. The link will come here.</span>", "18:13");
    return wa("FoodBridge", "Business account", fbface(), earlier + '<div class="wachip">TODAY</div>' +
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
    var c = orderCustomer(), what = s.order.lines.map(function (l) { return l.qty + " " + (l.unit ? (l.qty === 1 ? l.unit : E.plural(l.unit)) + " " : "") + l.name; }).join(", ");
    var body = '<div class="wachip">' + esc(c.name.toUpperCase()) + "'S PHONE</div>";
    if (s.order.sendInvoice) body += win('<span style="display:flex;align-items:center;gap:10px;padding:10px;margin:-4px -6px 2px;border-radius:8px;background:#f0f2f5"><span class="pdf" style="width:32px;height:40px;font-size:10px;background:var(--red);color:#fff">PDF</span><b style="font-size:14px">Invoice, order ' + s.order.id + "</b></span><span>Your order from " + esc(SEED.store.name) + ": " + esc(what) + ". <b>" + rupees(s.order.total) + "</b>" + (s.order.tax ? " incl. GST " + rupees(s.order.tax) : "") + (s.order.payment === "udhaar" ? ", due " + due() : ", paid") + ".</span>", "10:47");
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
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} s = E.initialState(); ui = freshUi(); return "#wa-link"; },
    "finish-processing": function () { if (s.items.job) s.items.job.startedAt = 0; return "#home"; },
    "finish-reading": function () { if (s.items.job) s.items.job.startedAt = 0; return "#home"; },
    "sample-sheet": function () { s.items.job = null; addRows(SEED.sources.file.rows, SEED.sources.file.label); return "#review"; }
  };

  // ---------- actions ----------
  /** Rows from any way in join the one sheet, each with an id and where it came from. */
  function toRows(list, from) {
    return list.map(function (r) {
      var row = { id: s.items.nextId++, name: r.name || "", baseUnit: r.baseUnit || "", bigUnit: r.bigUnit || "", perBig: r.perBig == null ? "" : String(r.perBig),
        rate: r.rate == null ? "" : String(r.rate), rateUnit: r.rateUnit || "", gst: r.gst == null ? "" : String(r.gst), taxIncl: r.taxIncl || "",
        mrp: r.mrp || "", hsn: r.hsn || "", barcode: r.barcode || "", category: catName(r.category), from: from };
      if (r.hint) row.hint = r.hint;
      return row;
    });
  }
  function addRows(list, from) { s.items.sheet = s.items.sheet.concat(toRows(list, from)); ui.sel = null; ui.filter = "all"; ui.undo = []; }
  /** Every way ends here: a processing job runs in the background and its rows join the sheet when it is done.
      A second way chosen while one runs joins the same job. In the prototype, the seed stands in for files and photos. */
  var JOB_MS = { file: SEED.readMillis, photo: SEED.readMillis, zoho: 4000, voice: 3000, catalog: 3000 };
  function startJob(kind, sources, list, from) {
    var rows = toRows(list, from), j = s.items.job, now = Date.now();
    if (j) { j.sources = j.sources.concat(sources); j.rows = j.rows.concat(rows); j.ms = Math.max(j.ms, now - j.startedAt + JOB_MS[kind]); }
    else s.items.job = { kind: kind, startedAt: now, ms: JOB_MS[kind], sources: sources, rows: rows };
    ui.sel = null; ui.filter = "all"; ui.undo = [];
    save(); location.hash = "#processing";
  }
  function startFiles(files) {
    var fl = files;
    startJob("file", fl.map(function (f) { return { kind: "file", label: f.name, size: f.size }; }), SEED.sources.file.rows, fl.map(function (f) { return f.name; }).join(", "));
  }
  function pushUndo() { ui.undo.push(JSON.stringify(s.items.sheet)); if (ui.undo.length > 50) ui.undo.shift(); }
  function setCell(row, key, value) {
    value = String(value == null ? "" : value).trim();
    if (cellVal(row, key) === value) return false;
    pushUndo(); row[key] = value;
    if (key === "name" || key === "unit") delete row.keepBoth;
    return true;
  }
  /** Move the selection like a spreadsheet: down/up through the rows on screen, left/right through the columns. */
  function moveSel(dr, dc) {
    var vis = visibleRows(); if (!vis.length) return;
    if (!ui.sel) { ui.sel = { r: vis[0].id, c: "name" }; return; }
    var i = Math.max(0, vis.indexOf(rowById(ui.sel.r))), ci = ui.sel.c ? colIndex(ui.sel.c) : 0;
    i = Math.min(vis.length - 1, Math.max(0, i + dr)); ci = Math.min(E.COLS.length - 1, Math.max(0, ci + dc));
    ui.sel = { r: vis[i].id, c: E.COLS[ci].key }; ui.reveal = true;
  }
  /** The next cell that needs the owner, after the selected one (wrapping round). */
  function nextIssue() {
    var rows = sheetRows(), list = [];
    rows.forEach(function (r) { E.rowIssues(r, rows, s.items.saved).forEach(function (i) { list.push({ r: r.id, c: i.col, at: rows.indexOf(r) * 100 + colIndex(i.col) }); }); });
    if (!list.length) return null;
    var here = ui.sel ? rows.indexOf(rowById(ui.sel.r)) * 100 + (ui.sel.c ? colIndex(ui.sel.c) : -1) : -1;
    return list.filter(function (x) { return x.at > here; })[0] || list[0];
  }
  function removeRow(r) { if (!r) return; pushUndo(); s.items.sheet = sheetRows().filter(function (x) { return x !== r; }); ui.snack = "Product deleted."; }
  function afterFix() {
    if (fixList().length) return;
    ui.fixing = false;
    var left = E.sheetSummary(sheetRows(), s.items.saved).fix;
    s.flash = left ? left + " skipped. Fix " + (left === 1 ? "it" : "them") + " later, or save the rest." : "All fixed. Save when you're ready.";
  }
  function goNextIssue() {
    var n = nextIssue();
    if (!n) { ui.sel = null; if (ui.filter === "fix") ui.filter = "all"; return; }
    if (ui.filter === "norate") ui.filter = "all";
    ui.sel = { r: n.r, c: n.c }; ui.reveal = true;
  }
  function saveRows(all) {
    var split = E.splitForSave(sheetRows(), s.items.saved), keep = all ? [] : split.broken, before = s.items.saved.length;
    s.items.saved = s.items.saved.concat(split.good.map(function (r) { var o = {}; Object.keys(r).forEach(function (k) { if (k !== "hint" && k !== "keepBoth") o[k] = r[k]; }); return o; }));
    s.items.sheet = keep; ui.sel = null; ui.undo = []; ui.filter = "all";
    var n = split.good.length;
    s.flash = (before ? n + " more product" + (n === 1 ? "" : "s") + " saved." : n + " product" + (n === 1 ? "" : "s") + " saved.") + (keep.length ? " " + keep.length + " wait for a fix." : "") + (!before && E.isDone(s, "customers") ? " Your store is ready for orders." : "");
    location.hash = "#home";
  }

  // speech: the browser's own recognizer where it has one; elsewhere the mic types the example, so the flow still shows
  var rec = null, typing = null;
  function stopMic() { ui.voice.on = false; if (rec) { try { rec.stop(); } catch (e) {} rec = null; } clearInterval(typing); typing = null; }
  function startMic() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition, base = ui.voice.text ? ui.voice.text.replace(/[,\s]*$/, "") + ", " : "";
    ui.voice.on = true;
    if (SR) {
      try {
        rec = new SR(); rec.lang = "en-IN"; rec.continuous = true; rec.interimResults = true;
        rec.onresult = function (e) { var t = ""; for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; ui.voice.text = base + t.trim(); render(); };
        rec.onerror = function () { stopMic(); fakeSpeech(base); };
        rec.onend = function () { if (ui.voice.on && rec) { ui.voice.on = false; rec = null; render(); } };
        rec.start(); return;
      } catch (e) { rec = null; }
    }
    fakeSpeech(base);
  }
  function fakeSpeech(base) {
    var words = SEED.voiceExample.split(" "), i = 0; ui.voice.on = true;
    typing = setInterval(function () {
      if (i >= words.length) { stopMic(); render(); return; }
      ui.voice.text = base + words.slice(0, ++i).join(" "); render();
    }, 160);
  }

  /** One shot: from the live camera, or the demo shelf; then flash, count, thumbnail, next shelf, all in place. */
  function takeShot() {
    var v = document.getElementById("vf"), url;
    if (v && v.tagName === "VIDEO" && v.videoWidth) {
      var c = document.createElement("canvas"), k = Math.min(1, 1000 / v.videoWidth);
      c.width = Math.round(v.videoWidth * k); c.height = Math.round(v.videoHeight * k);
      c.getContext("2d").drawImage(v, 0, 0, c.width, c.height); url = c.toDataURL("image/jpeg", 0.78);
    } else { url = sceneSvg(ui.shoot.scene); ui.shoot.scene++; }
    ui.photos.push({ name: "Shot " + (ui.photos.length + 1), url: url });
    var n = ui.photos.length, q = function (sel) { return app.querySelector(sel); };
    var fl = q(".flash"); if (fl) { fl.classList.remove("go"); void fl.offsetWidth; fl.classList.add("go"); }
    var last = q(".last"); if (last) { last.innerHTML = '<img src="' + url + '" alt="">'; last.classList.remove("off", "pop"); void last.offsetWidth; last.classList.add("pop"); }
    var cnt = q(".camcount"); if (cnt) cnt.textContent = n + " photo" + (n === 1 ? "" : "s");
    var done = q(".done"); if (done) { done.classList.remove("off"); done.textContent = "Done · " + n; }
    if (v && v.tagName === "IMG") setTimeout(function () { var w = document.getElementById("vf"); if (w && w.tagName === "IMG") w.src = sceneSvg(ui.shoot.scene); }, 260);
  }
  var ACT = {
    noop: function () {},
    menu: function () { ui.menu = !ui.menu; },
    panel: function () { ui.panel = true; ui.menu = false; },
    "close-panel": function () { ui.panel = false; },
    pick: function () { document.getElementById("pick-file").click(); },
    snap: function () { document.getElementById("pick-photo").click(); },
    unphoto: function (el) { ui.photos.splice(Number(el.getAttribute("data-i")), 1); },
    shoot: function () { takeShot(); return false; },   // the viewfinder is updated in place, never redrawn
    camlive: function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { ui.shoot.note = "No camera here, so the demo shelf stands in."; return; }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false }).then(function (st) {
        camStream = st; ui.shoot.live = true; ui.shoot.note = ""; if (route() === "items-photo") render(); else stopCamera();
      }, function () { ui.shoot.note = "The camera is not available, so the demo shelf stands in."; render(); });
    },
    unfile: function (el) { ui.files.splice(Number(el.getAttribute("data-i")), 1); },
    processfiles: function () { var f = ui.files; if (!f.length) return; ui.files = []; startFiles(f); },
    readphotos: function () {
      var n = ui.photos.length; if (!n) return; ui.photos = [];
      var label = "Photoshoot · " + n + " photo" + (n === 1 ? "" : "s");
      startJob("photo", [{ kind: "photo", label: label }], SEED.sources.file.rows, label);
    },
    // In the product: open Zoho's OAuth window and wait for its callback (allowed → a token on the backend, rejected → an error)
    zohoconnect: function () { ui.zoho = "signin"; ui.zallow = false; },
    zohosignin: function () { ui.zoho = "consent"; },
    zohocancel: function () { ui.zoho = "idle"; },
    zohoreject: function () { ui.zoho = "rejected"; },
    // one-time: the items are fetched once and the access is dropped; nothing stays connected (addendum-008)
    zohoallow: function () { if (!ui.zallow) return; ui.zoho = "idle"; startJob("zoho", [{ kind: "zoho", label: "Zoho · " + SEED.sources.zoho.rows.length + " items" }], SEED.sources.zoho.rows, "Zoho"); },
    mic: function () { if (ui.voice.on) stopMic(); else startMic(); },
    voiceex: function () { ui.voice.text = SEED.voiceExample; },
    voiceadd: function () {
      if (!ui.voice.text.trim()) return;
      var rows = E.parseSpeech(ui.voice.text); stopMic(); ui.voice.text = "";
      startJob("voice", [{ kind: "voice", label: "What you said" }], rows, "Spoken");
    },
    catpick: function (el) { togglePick(el.getAttribute("data-id")); ui.cat.refocus = true; },
    catunpick: function (el) { delete ui.cat.picked[el.getAttribute("data-id")]; },
    catretry: function () { delete live[normQ(ui.cat.q)]; liveSearch(ui.cat.q); ui.cat.refocus = true; },
    catclear: function () { ui.cat.q = ""; ui.cat.hi = -1; ui.cat.refocus = true; },
    cattry: function (el) { ui.cat.q = el.getAttribute("data-v"); ui.cat.hi = -1; ui.cat.refocus = true; scheduleLive(); },
    catadd: function () {
      var list = Object.keys(ui.cat.picked).map(function (k) { return ui.cat.picked[k]; }); if (!list.length) return; ui.cat = { q: "", picked: {}, hi: -1, focused: false };
      startJob("catalog", [{ kind: "catalog", label: "Product search · " + list.length + " product" + (list.length === 1 ? "" : "s") }], list, "Product search");
    },
    // the sheet
    filter: function (el) { ui.filter = el.getAttribute("data-v"); },
    cell: function (el) {
      var r = Number(el.getAttribute("data-r")), c = el.getAttribute("data-c");
      if (ui.sel && ui.sel.r === r && ui.sel.c === c) ui.focusFx = { caret: "end" };   // a second tap edits, like a double-click
      ui.sel = { r: r, c: c };
    },
    selrow: function (el) { ui.sel = { r: Number(el.getAttribute("data-r")), c: null }; },
    fix: function (el) {
      var row = rowById(ui.sel.r), a = el.getAttribute("data-a"), col = el.getAttribute("data-col"); if (!row) return;
      if (col === "taxIncl") { pushUndo(); E.setTaxAll(sheetRows(), el.getAttribute("data-v")); }   // one answer for the whole list
      else if (a === "merge") { pushUndo(); s.items.sheet = E.mergeRow(sheetRows(), row, s.items.saved); ui.sel = null; }
      else if (a === "keepboth") { pushUndo(); row.keepBoth = true; }
      else setCell(row, col, el.getAttribute("data-v"));
      goNextIssue();
    },
    fixnext: function () { goNextIssue(); },
    delrow: function () { var row = rowById(ui.sel.r); if (!row) return; pushUndo(); s.items.sheet = sheetRows().filter(function (r) { return r !== row; }); ui.sel = null; },
    addrow: function () {
      pushUndo(); var row = toRows([{}], "Typed")[0]; s.items.sheet.push(row);
      if (ui.filter !== "all") ui.filter = "all";
      ui.sel = { r: row.id, c: "name" }; ui.reveal = true; ui.focusFx = { caret: "end" };
    },
    dropask: function () { ui.dropAsk = true; ui.rmenu = false; },
    // Check & save on a phone (addendum-012)
    rmenu: function () { ui.rmenu = !ui.rmenu; },
    viewsheet: function () { ui.view = "sheet"; ui.rmenu = false; },
    viewcards: function () { ui.view = "cards"; ui.sel = null; },
    pedit: function (el) { ui.edit = Number(el.getAttribute("data-r")); },
    edclose: function () { ui.edit = null; },
    edmerge: function () { var r = rowById(ui.edit); if (!r) return; pushUndo(); s.items.sheet = E.mergeRow(sheetRows(), r, s.items.saved); ui.edit = null; ui.snack = "Merged."; },
    edkeep: function () { var r = rowById(ui.edit); if (r) { pushUndo(); r.keepBoth = true; } },
    eddel: function () { removeRow(rowById(ui.edit)); ui.edit = null; },
    fixstart: function () { ui.fixSkip = {}; ui.fixAll = true; ui.fixTotal = E.sheetSummary(sheetRows(), s.items.saved).questions; ui.fixing = ui.fixTotal > 0; ui.rmenu = false; },
    fixclose: function () { ui.fixing = false; },
    fixans: function (el) {
      var cur = fixList()[0]; if (!cur) return;
      var a = el.getAttribute("data-a"), col = el.getAttribute("data-col"), v = el.getAttribute("data-v");
      if (el.getAttribute("data-batch")) { pushUndo(); E.setTaxAll(sheetRows(), v); }   // said once for the whole list
      else if (a === "merge") { pushUndo(); s.items.sheet = E.mergeRow(sheetRows(), cur.r, s.items.saved); }
      else if (a === "keepboth") { pushUndo(); cur.r.keepBoth = true; }
      else if (col === "gst" && E.blank(cur.r.gst) && ui.fixAll) { pushUndo(); sheetRows().forEach(function (x) { if (E.blank(x.gst) && !E.isEmptyRow(x)) x.gst = v; }); }
      else setCell(cur.r, col, v);
      afterFix();
    },
    fixskip: function () { var cur = fixList()[0]; if (cur) ui.fixSkip[cur.batch ? "tax" : cur.r.id + ":" + cur.i.col + (cur.i.dup ? ":d" : "")] = true; afterFix(); },
    fixdel: function () { var cur = fixList()[0]; if (cur) removeRow(cur.r); afterFix(); },
    snackundo: function () { ACT.undo(); ui.snack = ""; },
    dropno: function () { ui.dropAsk = false; },
    dropall: function () {
      var n = E.sheetSummary(s.items.sheet, s.items.saved).total;
      s.items.sheet = []; ui.dropAsk = false; ui.sel = null; ui.undo = []; ui.filter = "all";
      s.flash = n + " product" + (n === 1 ? "" : "s") + " dropped. Choose a way to add them again.";
      location.hash = "#items";
    },
    undo: function () { var prev = ui.undo.pop(); if (prev) { s.items.sheet = JSON.parse(prev); if (ui.sel && !rowById(ui.sel.r)) ui.sel = null; } },
    save: function () { saveRows(true); },
    savesome: function () { saveRows(false); },
    // the other steps
    addcust: function () {
      s.customers = { done: true, ids: SEED.contacts.filter(function (c) { return ui.ticked[c.id]; }).map(function (c) { return c.id; }) };
      s.flash = s.customers.ids.length + " customers added." + (E.isDone(s, "items") ? " Your store is ready for orders." : "");
      location.hash = "#home";
    },
    khata: function () { ui.note = "In this prototype, pick from contacts. A khata photo would be read like the rate list."; },
    qty: function (el) { var id = Number(el.getAttribute("data-id")); ui.draft.qty[id] = Math.max(0, (ui.draft.qty[id] || 0) + Number(el.getAttribute("data-d"))); },
    place: function () {
      var d = ui.draft, its = storeItems();
      var lines = its.filter(function (i) { return d.qty[i.id]; }).map(function (i) { return { itemId: i.id, name: i.name, unit: i.bigUnit, qty: d.qty[i.id], price: i.price, gst: i.gst, taxIncl: i.taxIncl }; });
      if (!lines.length) return;
      s.order = { id: "0001", customerId: d.customerId, lines: lines, payment: d.payment, sendInvoice: d.send, total: E.orderTotal(lines), tax: E.orderTax(lines), at: Date.now() };
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

  function route() { return (location.hash || "#wa-link").slice(1); }
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
    if (a !== "snackundo") ui.snack = "";
    if (ACT[a]) { var before = location.hash, r = ACT[a](el); save(); if (r !== false && location.hash === before) render(); }   // a navigation renders on hashchange
  });

  // the sheet's keyboard: what Excel and Sheets do
  function sheetKeys(ev) {
    var el = ev.target, inFx = el.id === "fx", typing = /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !inFx && el.id !== "catch";
    if (typing) return;
    var mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.key.toLowerCase() === "z") { if (!inFx) { ev.preventDefault(); ACT.undo(); save(); render(); } return; }
    if (inFx) {
      if (ev.key === "Enter" || ev.key === "Tab") {
        ev.preventDefault();
        var row = rowById(Number(el.getAttribute("data-r"))); if (row) setCell(row, el.getAttribute("data-c"), el.value);
        if (ev.key === "Enter") moveSel(ev.shiftKey ? -1 : 1, 0); else moveSel(0, ev.shiftKey ? -1 : 1);
        save(); render();
      } else if (ev.key === "Escape") { ev.preventDefault(); el.value = el.defaultValue; render(); }
      return;
    }
    if (!ui.sel && /^(Arrow|Enter|Tab)/.test(ev.key)) { ev.preventDefault(); moveSel(0, 0); render(); return; }
    if (!ui.sel) return;
    var k = ev.key, moves = { ArrowDown: [1, 0], ArrowUp: [-1, 0], ArrowRight: [0, 1], ArrowLeft: [0, -1] };
    if (moves[k]) { ev.preventDefault(); moveSel(moves[k][0], moves[k][1]); render(); return; }
    if (k === "Tab") { ev.preventDefault(); moveSel(0, ev.shiftKey ? -1 : 1); render(); return; }
    if (k === "Enter" || k === "F2") { ev.preventDefault(); if (ui.sel.c) { ui.focusFx = { caret: "end" }; render(); } return; }
    var col = ui.sel.c && E.COLS[colIndex(ui.sel.c)];
    if ((k === "Delete" || k === "Backspace") && col && !col.readOnly) { ev.preventDefault(); setCell(rowById(ui.sel.r), ui.sel.c, ""); save(); render(); return; }
    if (k.length === 1 && !mod && !ev.altKey && col && !col.readOnly) { ev.preventDefault(); ui.focusFx = { replace: k }; render(); }   // typing replaces the cell
  }
  document.addEventListener("keydown", function (ev) {
    var el = ev.target;
    if (route() === "review" && !ui.panel && !ui.dropAsk && !mobileView()) { sheetKeys(ev); if (ev.defaultPrevented) return; }
    if (route() === "items-catalog" && el.id === "csearch") {
      var res = catAll(ui.cat.q);
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") { ev.preventDefault(); if (res.length) { ui.cat.hi = ui.cat.hi < 0 ? (ev.key === "ArrowDown" ? 0 : res.length - 1) : (ui.cat.hi + (ev.key === "ArrowDown" ? 1 : res.length - 1)) % res.length; render(); keepTyping("#csearch"); } return; }
      if (ev.key === "Enter") { ev.preventDefault(); var x = res[Math.max(0, ui.cat.hi)]; if (x) { togglePick(x.id); render(); keepTyping("#csearch"); } return; }
      if (ev.key === "Escape" && ui.cat.q) { ev.preventDefault(); ui.cat.q = ""; render(); keepTyping("#csearch"); return; }
    }
    if (route() === "items-photo" && (ev.key === " " || ev.key === "Enter") && !/^(INPUT|TEXTAREA|A|BUTTON)$/.test(el.tagName)) { ev.preventDefault(); takeShot(); return; }
    if ((ev.key === "Enter" || ev.key === " ") && el.getAttribute && el.getAttribute("data-act") === "dmode") { ev.preventDefault(); ACT.dmode(el); render(); }
    if (ev.key === "Escape") { ui.menu = false; ui.panel = false; ui.rmenu = false; if (ui.edit) ui.edit = null; else if (ui.fixing) ui.fixing = false; if (ui.zoho === "signin" || ui.zoho === "consent") ui.zoho = "idle"; if (route() === "review") { if (ui.dropAsk) ui.dropAsk = false; else ui.sel = null; } render(); }
  });
  document.addEventListener("change", function (ev) {
    var el = ev.target, b = el.getAttribute("data-bind"); if (!b) return;
    if (b === "files") { addFiles([].slice.call(el.files || [])); el.value = ""; return; }
    if (b === "photo") {
      [].slice.call(el.files || []).forEach(function (f) { ui.photos.push({ name: f.name, url: URL.createObjectURL(f) }); });
      el.value = ""; if (route() !== "items-gallery") location.hash = "#items-gallery"; else render(); return;
    }
    if (b === "fx") {   // leaving the formula bar keeps what was typed, as a spreadsheet does (into the cell it was opened on)
      var row = rowById(Number(el.getAttribute("data-r"))); if (row && setCell(row, el.getAttribute("data-c"), el.value)) { save(); render(); }
      return;
    }
    if (b === "voice" || b === "csearch" || b === "search") return;
    if (b === "ef") { var er = rowById(ui.edit); if (er && setCell(er, el.getAttribute("data-c"), el.value)) { save(); render(); } return; }   // typed boxes are handled as you type, not on "change"
    if (b === "zallow") ui.zallow = el.checked;
    if (b === "fixall") { ui.fixAll = el.checked; return; }
    if (b === "tick") ui.ticked[el.getAttribute("data-id")] = el.checked;
    if (b === "cust") ui.draft.customerId = el.value;
    if (b === "pay") ui.draft.payment = el.value;
    if (b === "send") ui.draft.send = el.checked;
    if (b === "driver") ui.driverId = el.value;
    if (b === "morning" || b === "evening") s.plan[b] = el.value;
    save(); render();
  });
  function keepTyping(sel) { var i = document.querySelector(sel); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }
  document.addEventListener("input", function (ev) {
    var b = ev.target.getAttribute("data-bind");
    if (b === "search") { ui.draft.search = ev.target.value; render(); keepTyping('[data-bind="search"]'); }
    if (b === "csearch") { ui.cat.q = ev.target.value; ui.cat.hi = -1; scheduleLive(); render(); keepTyping('[data-bind="csearch"]'); }
    if (b === "voice") { ui.voice.text = ev.target.value; render(); keepTyping('[data-bind="voice"]'); }
    if (ev.target.id === "catch" && ev.target.value && ui.sel && ui.sel.c) { ui.focusFx = { replace: ev.target.value }; render(); }
  });
  document.addEventListener("submit", function (ev) {
    if (ev.target.getAttribute("data-act") === "fixtype") {
      ev.preventDefault();
      var v = document.getElementById("fixin").value.trim(), cur = fixList()[0]; if (!v || !cur) return;
      setCell(cur.r, ev.target.getAttribute("data-col"), v); afterFix(); save(); render(); return;
    }
    if (ev.target.getAttribute("data-act") !== "ask") return;
    ev.preventDefault();
    var q = document.getElementById("ask").value.trim(); if (!q) return;
    ui.chat.push({ me: true, text: q }, { me: false, text: answer(q) });
    render(); var i = document.getElementById("ask"); if (i) i.focus();
  });
  // the file pickers live outside #app, so a re-render never destroys one while its dialog is open (the v1 bug: the
  // tile's click re-rendered the screen and the chosen files went to a detached input)
  (function () {
    var box = document.createElement("div"); box.className = "pickers";
    box.innerHTML = '<input type="file" id="pick-file" class="sr" multiple data-bind="files" aria-label="Choose files">' +
      '<input type="file" id="pick-photo" class="sr" accept="image/*" capture="environment" multiple data-bind="photo" aria-label="Click a photo">' +
      '<input type="file" id="pick-photo-lib" class="sr" accept="image/*" multiple data-bind="photo" aria-label="Photos from your gallery">';
    document.body.appendChild(box);
  })();
  function addFiles(files) {
    files.forEach(function (f) { if (!ui.files.some(function (x) { return x.name === f.name && x.size === f.size; })) ui.files.push({ name: f.name, size: f.size, type: f.type }); });
    if (route() !== "items-file") location.hash = "#items-file"; else render();
  }
  // drop files anywhere on "Add your products" or "Upload files": they join the selection, to be processed together
  function dropZone() { var r = route(); return r === "items" || r === "items-file"; }
  document.addEventListener("dragover", function (ev) { if (!dropZone()) return; ev.preventDefault(); if (!ui.drag) { ui.drag = true; render(); } });
  document.addEventListener("dragleave", function (ev) { if (dropZone() && ui.drag && !ev.relatedTarget) { ui.drag = false; render(); } });
  document.addEventListener("drop", function (ev) {
    if (!dropZone()) return;
    ev.preventDefault(); ui.drag = false;
    var files = [].slice.call((ev.dataTransfer && ev.dataTransfer.files) || []);
    if (files.length) addFiles(files); else render();
  });

  // ---------- render ----------
  function finePointer() { return window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches; }
  var timer = null, rendering = false;
  // Removing a focused input with an edit in it fires "change" during the redraw; a redraw asked for then waits its turn
  function render() {
    if (rendering) { setTimeout(render, 0); return; }
    rendering = true;
    try { draw(); } finally { rendering = false; }
  }
  function draw() {
    clearTimeout(timer);
    if (E.tick(s, Date.now())) save();
    var r = route();
    if (AIDS[r]) { location.replace(AIDS[r]()); save(); return; }
    takeFlash(r);
    var g = app.querySelector(".grid"), gx = g ? g.scrollLeft : 0, gy = g ? g.scrollTop : 0;
    var view = V[r] || V.home;
    var html = view();
    if (html) app.innerHTML = html;
    var wab = app.querySelector(".wabody");
    if (wab) wab.scrollTop = wab.scrollHeight; // a chat opens on its newest message
    var g2 = app.querySelector(".grid");
    if (g2) {
      g2.scrollLeft = gx; g2.scrollTop = gy;   // a re-render keeps the sheet where it was
      var cell = g2.querySelector("td.sel") || g2.querySelector("tr.rsel th");
      if (cell && ui.reveal) cell.scrollIntoView({ block: "nearest", inline: "nearest" });
      var fx = document.getElementById("fx");
      if (fx && ui.focusFx && !fx.disabled) {
        if (ui.focusFx.replace != null) fx.value = ui.focusFx.replace;
        fx.focus(); fx.setSelectionRange(fx.value.length, fx.value.length);
      } else if (ui.sel && ui.sel.c && finePointer()) {
        var c = document.getElementById("catch"); if (c) c.focus({ preventScroll: true });
      }
    }
    var v = document.getElementById("vf");
    if (v && camStream && v.tagName === "VIDEO" && v.srcObject !== camStream) { v.srcObject = camStream; v.play && v.play().catch(function () {}); }
    if (r === "items-catalog" && (!ui.cat.focused || ui.cat.refocus)) { ui.cat.focused = true; ui.cat.refocus = false; keepTyping("#csearch"); }
    ui.reveal = false; ui.focusFx = null;
    document.title = (r.indexOf("wa-") === 0 ? "WhatsApp" : "FoodBridge") + " · " + r;
    if (s.items.job) timer = setTimeout(jobTick, r === "processing" ? 250 : 1000);
  }
  // while a job runs, only the screens that show it move; the sheet is never re-drawn under the owner's fingers.
  // When it finishes on the Processing screen, Check & save opens by itself.
  function jobTick() {
    var r = route();
    var j = s.items.job;
    if (E.tick(s, Date.now())) {
      if (j && !j.rows.length && !s.items.sheet.length) s.flash = { text: "No products found in that. Try again, or another way.", route: "items" };
      save(); if (r === "processing") { ui.reveal = true; location.replace("#review"); return; } if (r !== "review") return render();
    }
    if (r === "processing" || r === "home" || r === "items") render(); else if (s.items.job) timer = setTimeout(jobTick, 1000);
  }
  var wasMobile = window.innerWidth < 700;   // Check & save switches between cards and the sheet when the width crosses
  window.addEventListener("resize", function () { var m = window.innerWidth < 700; if (m !== wasMobile) { wasMobile = m; if (route() === "review") render(); } });
  window.addEventListener("hashchange", function () {
    ui.toast = null; ui.menu = false; ui.sheet = false; ui.note = ""; ui.drag = false; ui.dropAsk = false; ui.rmenu = false; ui.edit = null; ui.fixing = false; ui.snack = ""; if (ui.zoho === "signin" || ui.zoho === "consent") ui.zoho = "idle";
    if (location.hash !== "#customers") ui.ticked = null;
    if (location.hash !== "#items-voice") stopMic();
    if (location.hash !== "#items-photo") stopCamera();
    render(); window.scrollTo(0, 0);
  });
  render();
})();
