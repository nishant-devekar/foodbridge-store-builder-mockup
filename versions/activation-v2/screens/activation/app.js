/* Store Activation discovery — activation-v2 (addenda 031–035). Desktop only: under 1024 px the CSS shows the lock.
   The platform's shell (sidebar that ☰ opens and closes, top bar, profile menu, the assistant) around three pages:
   the dashboard where the owner lands (addendum-033), Product Master and Customer Management (addendum-035), which stay
   empty until setup adds products and customers. Setup has two steps (addendum-034), done in one large modal: upload,
   review like a sheet, submit (addendum-036); its numbers and rules come from the engine.
   Orders are the platform's own data (s.orders), not a setup step. */
(function () {
  "use strict";
  var E = window.ActivationEngine, SEED = window.SEED;
  var KEY = "store-activation-discovery-v2-desktop";
  var MASCOT = "activation/mascot.png";
  var app = document.getElementById("app");

  // ---------- state ----------
  function load() {
    try { var raw = localStorage.getItem(KEY); if (raw) { var o = JSON.parse(raw); if (o && o.v === 5) return withOrders(o); } } catch (e) { /* private window: start fresh */ }
    return withOrders(E.initialState());
  }
  function withOrders(st) { st.orders = st.orders || []; return st; }   // the platform's orders, shown on the dashboard
  function save() { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* the prototype still works for this tab */ } }
  var s = load();
  var ui = { menu: false, side: true, tab: "recent", note: "", pq: "", pcat: "", cq: "",
    modal: null, pick: { items: null, customers: null }, reading: null, q: "", filter: "all", sel: null, flash: "", again: false,
    panel: false, chat: [], combo: { hi: 0, items: [] } };

  // discovery aids (addendum-034): #reset a new owner (0 of 2), #demo products saved (1 of 2), #done both done + an order
  function products() { return SEED.sources.zoho.rows.map(function (r, i) { var o = {}; Object.keys(r).forEach(function (k) { o[k] = r[k]; }); o.id = i + 1; o.taxIncl = "no"; return o; }); }
  var AIDS = {
    reset: function () { s = withOrders(E.initialState()); },
    demo: function () { s = withOrders(E.initialState()); s.items.saved = products(); },
    done: function () {
      s = withOrders(E.initialState()); s.items.saved = products();
      s.customers.done = true;
      s.customers.saved = SEED.contacts.filter(function (c) { return c.kind === "shop"; }).slice(0, 8).map(function (c, i) { return { id: i + 1, name: c.name, phone: c.phone, email: "", address: c.area }; });
      var at = new Date(); at.setHours(10, 42, 0, 0);
      s.orders = [{ id: "0001", customerId: "c01", total: 6440, at: at.getTime(), status: "pending" }];
    }
  };

  // ---------- small helpers ----------
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function rupees(n) { return "₹" + Number(n || 0).toLocaleString("en-IN"); }
  function money(n) { return "₹ " + Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function norm(t) { return String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  var IC = {
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', chev: '<path d="M9 18l6-6-6-6"/>', down: '<path d="M6 9l6 6 6-6"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-1a7 7 0 0 1 14 0v1"/>',
    tree: '<circle cx="5" cy="6" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M5 8v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M12 12v4"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5M21 12H9"/>',
    bill: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
    bag: '<path d="M6 7h12l1 14H5z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/>',
    play: '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l5 3.5-5 3.5z"/>',
    export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    import: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5M12 15V3"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>', check: '<path d="M20 6L9 17l-5-5"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4z"/>', pin: '<path d="M12 22s7-6.6 7-12a7 7 0 0 0-14 0c0 5.4 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    shop: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/><path d="M3 9h18"/>',
    spark: '<path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5M12 3v12"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/>', down2: '<path d="M12 5v14M6 13l6 6 6-6"/>', search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    tag: '<path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z"/><circle cx="7" cy="7" r="1.5"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    gift: '<path d="M20 12v10H4V12M2 7h20v5H2zM12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'
  };
  function ic(n, size, sw) { return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + "</svg>"; }
  function ring(pct, size, inner, thick) {
    return '<span class="ring" style="width:' + size + "px;height:" + size + "px;background:conic-gradient(var(--g) 0 " + pct + "%, var(--line) " + pct + '% 100%)">' +
      '<span style="width:' + (size - 2 * thick) + "px;height:" + (size - 2 * thick) + 'px">' + inner + "</span></span>";
  }
  var NEED = '<em class="need">Action needed</em>';   // the store is not active yet (addendum-046)
  function frac(p, fs) { return '<b style="font-size:' + fs + 'px">' + p.done + "/" + p.total + "</b>"; }
  function soon(what, label, cls) { return '<button class="' + (cls || "") + '" data-act="soon" data-what="' + esc(what) + '">' + label + "</button>"; }

  // what the next step is called, wherever the platform names it
  function nextTitle(n) {
    if (n.mode === "review") return "check and save your products";
    if (n.mode === "waiting") return "your products are being read";
    return { items: "add your products", customers: "add your customers" }[n.id];
  }

  // ---------- the platform's shell ----------
  var PAGES = [["dashboard", "Dashboard"], ["products", "Product Master"], ["customers", "Customer Management"], [null, "Sales Orders"], [null, "Sales Returns"],
    [null, "Distribution & Logistics"], [null, "Route Delivery"], [null, "Store QR Code"]];
  function avatar(p) {
    var inner = '<span class="av">' + ic("user", 18) + "</span>";
    return p.done < p.total ? '<span class="avwrap">' + ring(p.percent, 44, inner, 3) + '<i class="duedot" aria-hidden="true"></i></span>' : '<span class="ring" style="width:44px;height:44px"><span style="width:38px;height:38px">' + inner + "</span></span>";
  }
  function menu(p, n) {
    if (!ui.menu) return "";
    var gs = n ? '<button class="gs" data-act="setup">' + ring(p.percent, 44, frac(p, 12), 4) +
      "<span><b>Activate your store" + NEED + "</b><small>" + p.done + " of " + p.total + " · Next: " + esc(nextTitle(n)) + "</small></span>" + ic("chev", 16) + "</button>" : "";
    return '<div class="menu" role="menu">' + gs + soon("My Network", ic("tree", 18) + "My Network") + soon("Edit Profile", ic("gear", 18) + "Edit Profile") + soon("Logout", ic("logout", 18) + "Logout", "out") + "</div>";
  }
  function fab(p, n) {
    var face = '<img src="' + MASCOT + '" alt="">';
    return '<button class="fab" data-act="panel" aria-label="FoodBridge assistant" aria-expanded="' + ui.panel + '">' + (n && !ui.panel ? '<span class="bub"><b>Activate your store:</b> ' + esc(nextTitle(n)) + "</span>" : "") +
      ring(p.done < p.total ? p.percent : 0, 76, face, 5) + "</button>";
  }
  function shell(page, title, body) {
    var p = E.progress(s), n = E.nextStep(s);
    var nav = PAGES.map(function (pg) {
      return pg[0] === page ? '<a class="on" href="#' + pg[0] + '" aria-current="page">' + pg[1] + "</a>" : pg[0] ? '<a href="#' + pg[0] + '">' + pg[1] + "</a>" : soon(pg[1], pg[1]);
    }).join("");
    var side = ui.side ? '<nav class="side" aria-label="Main"><div class="brand"><span class="mark">' + ic("bill", 18) + "</span><span><b>" + esc(SEED.store.name) + "</b><small>" + esc(SEED.store.owner) + "</small></span></div>" + nav + "</nav>" : "";
    // with the sidebar closed, the top bar names the store, as the platform does
    var crumb = ui.side ? "" : '<span class="crumb"><span class="mark sm">' + ic("bag", 14) + "</span><b>" + esc(SEED.store.name) + '</b><span class="sl">/</span>' +
      soon("The store switcher", esc(SEED.store.owner) + ic("down", 14), "who") + "</span>";
    var head = '<header class="top"><button class="iconbtn" data-act="side" aria-label="' + (ui.side ? "Close" : "Open") + ' the sidebar" aria-expanded="' + ui.side + '">' + ic("menu", 22) + "</button>" + crumb +
      "<h1>" + esc(title) + "</h1>" + soon("The page video", ic("play", 14) + "Video", "tag") +
      '<button class="me" data-act="menu" aria-expanded="' + ui.menu + '" aria-label="' + esc(SEED.store.owner) + (p.done < p.total ? ", store not active: " + p.done + " of " + p.total + " done" : "") + '">' + avatar(p) +
      "<span><b>" + esc(SEED.store.owner) + "</b><small>Admin</small></span></button>" + menu(p, n) + "</header>";
    var note = ui.note ? '<div class="note" role="status">' + esc(ui.note) + "</div>" : "";
    return side + '<div class="main">' + head + '<div class="content">' + body + "</div></div>" + (ui.modal ? "" : assistantPanel() + fab(p, n)) + note + setupModal();
  }
  // the empty table row on Product Master and Customer Management, until setup adds what belongs there
  function emptyRow(cols, icon, what, step) {
    return '<tr><td colspan="' + cols + '"><div class="blank"><span class="pic">' + ic(icon, 28) + "</span><b>No " + what + " yet</b>" +
      "<span>They appear here when you activate your store.</span>" + '<button class="btn" data-act="setup" data-step="' + step + '">Add ' + what + "</button></div></td></tr>";
  }
  function pager(n) {
    return '<div class="pager"><span>Showing ' + (n ? "1–" + n : "0") + " of " + n + '</span><span class="pages">' + soon("Earlier pages", "‹", "pg") +
      '<span class="pg on">1</span>' + soon("Later pages", "›", "pg") + "</span></div>";
  }

  // the banner's button names what it opens (addendum-037): add a step's file, or review the sheet waiting in it
  function actionLabel(n) { var what = n.id === "customers" ? "customers" : "products"; return (store(n.id).sheet.length ? "Review " : "Add ") + what; }

  // ---------- the FoodBridge assistant: its own panel; setup is one of its answers (addendum-038) ----------
  // It never does a step itself: every answer carries one button that opens the Activate your store modal or a page.
  function nextButton() {
    var n = E.nextStep(s);
    return n ? { label: actionLabel(n), act: "setup", v: n.id } : { label: "View products", act: "view", v: "products" };
  }
  function answer(q) {
    var t = String(q || "").toLowerCase(), id = E.topicFor(t);
    if (/file|excel|xls|csv|pdf|format|upload|sheet/.test(t)) return { text: "Excel, CSV or PDF. One row per product or customer.", btn: nextButton() };
    if (id) {
      var what = id === "customers" ? "customers" : "products", st = store(id);
      if (E.isDone(s, id) && !st.sheet.length) return { text: st.saved.length + " " + noun(id, st.saved.length) + " added.", btn: { label: "View " + what, act: "view", v: what } };
      return { text: st.sheet.length ? "Your " + what + " file is waiting for a check." : "Upload your " + what + " file. I'll mark what needs fixing.", btn: { label: (st.sheet.length ? "Review " : "Add ") + what, act: "setup", v: id } };
    }
    return { text: "I can help you add products and customers.", btn: nextButton() };
  }
  function chatButton(b) { return '<button class="cbtn" data-act="' + b.act + '"' + (b.act === "setup" ? ' data-step="' + b.v + '"' : ' data-v="' + b.v + '"') + ">" + esc(b.label) + "</button>"; }
  function assistantPanel() {
    if (!ui.panel) return "";
    var p = E.progress(s), n = E.nextStep(s);
    var card = n
      ? '<div class="acard">' + ring(p.percent, 48, frac(p, 13), 4) + '<span class="t"><b>Activate your store' + NEED + "</b><small>" + p.done + " of " + p.total + " · Next: " + esc(nextTitle(n)) + "</small></span>" + chatButton(nextButton()) + "</div>"
      : '<div class="acard done"><span class="tick">' + ic("check", 20, 3) + '</span><span class="t"><b>Your store is active</b></span><span class="row">' + chatButton({ label: "View products", act: "view", v: "products" }) + chatButton({ label: "View customers", act: "view", v: "customers" }) + "</span></div>";
    var msgs = ui.chat.map(function (m) {
      return m.me ? '<div class="me">' + esc(m.text) + "</div>" : '<div class="bot"><span>' + esc(m.text) + "</span>" + (m.btn ? chatButton(m.btn) : "") + "</div>";
    }).join("");
    var sugg = [];
    if (!E.isDone(s, "items")) sugg.push("Add products");
    if (!E.isDone(s, "customers")) sugg.push("Add customers");
    if (n) sugg.push("Which files work?");
    var chips = sugg.length ? '<div class="sugg">' + sugg.map(function (q) { return '<button data-act="ask" data-q="' + esc(q) + '">' + esc(q) + "</button>"; }).join("") + "</div>" : "";
    return '<section class="apanel" role="dialog" aria-label="FoodBridge assistant"><header><span class="aface"><img src="' + MASCOT + '" alt=""></span><b>FoodBridge assistant</b>' +
      '<button class="iconbtn" data-act="panel" aria-label="Close the assistant">' + ic("x", 20) + "</button></header>" +
      '<div class="abody" id="abody">' + card + msgs + "</div>" + chips +
      '<form class="aask" data-form="ask"><input id="askin" placeholder="Ask anything" autocomplete="off" aria-label="Ask the assistant"><button type="submit" aria-label="Send">' + ic("send", 18) + "</button></form></section>";
  }
  function ask(q) { q = String(q || "").trim(); if (!q) return; ui.chat.push({ me: true, text: q }); var a = answer(q); ui.chat.push({ text: a.text, btn: a.btn }); }

  // ---------- the dashboard (addendum-033) ----------
  function dashboard() {
    var p = E.progress(s), n = E.nextStep(s);
    // the card (addenda 047–049): the amber store tile and the badge carry the attention; the button names the next step
    // the card (addendum-051): the 0/2 ring, a subtle hairline, the title with its quiet tag, the next step and what it unlocks
    var banner = n ? '<section class="acta">' + ring(p.percent, 60, frac(p, 15), 5).replace("var(--line) " + p.percent, "#fde68a " + p.percent) +   // a warm track on the tint (addendum-052)
      '<span class="t"><b>Activate your store<em class="tagw">Action needed</em></b><span>Next: ' + esc(nextTitle(n)) + " · Orders open after this</span></span>" +
      '<button class="btn" data-act="setup" data-step="' + n.id + '">' + actionLabel(n) + "</button></section>" : "";
    var now = new Date(), sum = function (f) { return s.orders.filter(f).reduce(function (a, o) { return a + o.total; }, 0); };
    var today = sum(function (o) { return new Date(o.at).toDateString() === now.toDateString(); });
    var month = sum(function (o) { var d = new Date(o.at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    var tiles = [["Today Orders", today, "t-teal"], ["Yesterday Orders", 0, "t-orange"], ["This Month", month, "t-blue"], ["Last Month", 0, "t-cyan"], ["All-Time Sales", sum(function () { return true; }), "t-green"]]
      .map(function (t) { return '<div class="tile ' + t[2] + '"><span>' + t[0] + "</span><b>" + rupees(t[1]) + "</b></div>"; }).join("");
    var tabs = [["recent", "Recent Orders"], ["product", "Product Sales"], ["discount", "Discount Report"], ["cycle", "Order Cycle"]].map(function (t) {
      return '<button role="tab" aria-selected="' + (ui.tab === t[0]) + '" class="' + (ui.tab === t[0] ? "on" : "") + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + "</button>";
    }).join("");
    var STATUS = { pending: ["Pending", "st-amber"], out: ["Out for delivery", "st-blue"], delivered: ["Delivered", "st-ok"] };
    var rows = ui.tab === "recent" && s.orders.length ? s.orders.map(function (o) {
      var st = STATUS[o.status] || STATUS.pending, customer = (SEED.contacts.filter(function (c) { return c.id === o.customerId; })[0] || {}).name;
      return "<tr><td>" + esc(o.id) + "</td><td>" + new Date(o.at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + "</td><td>" + esc(customer) + "</td><td><b>" + rupees(o.total) + '</b></td><td><span class="pill ' + st[1] + '">' + st[0] + "</span></td></tr>";
    }).join("") : '<tr><td colspan="5" class="empty">' + (ui.tab === "recent" ? "No orders yet" : "Nothing to show yet") + "</td></tr>";
    var table = '<div class="tabs" role="tablist">' + tabs + '</div><div class="table"><table><thead><tr><th>Order ID</th><th>Date</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
    return shell("dashboard", "Dashboard", banner + '<div class="tiles">' + tiles + "</div>" + table);
  }

  // ---------- Import on Product Master and Customer Management: a menu with Smart import (addendum-043) ----------
  function importMenu(k) {   // redesigned (addendum-044): Smart import first; one row pattern — icon tile, label, short hint
    var open = ui.imp === k;
    var row = function (act, icon, label, hint, cls, extra) {
      return '<button role="menuitem" class="irow ' + (cls || "") + '" data-act="' + act + '" data-step="' + k + '"' + (extra || "") + '><span class="itile">' + ic(icon, 16) + "</span>" +
        '<span class="itxt"><b>' + label + (cls === "smart" ? '<em>Recommended</em>' : "") + "</b><small>" + hint + "</small></span></button>";
    };
    // Upload file only takes the sample's format, so the two sit together (addendum-045)
    var menu = open ? '<div class="impmenu" role="menu" aria-label="Import">' +
      row("smartimport", "spark", "Smart import", "Any file, checked before saving", "smart") +
      '<hr role="separator"><div class="igroup" role="group" aria-label="Fixed format"><span class="ilabel">Fixed format</span>' +
      row("soon", "upload", "Upload file", "Same format as the sample", "", ' data-what="The platform\u2019s plain file import"') +
      row("samplefile", "import", "Sample file", "The format to upload") + "</div></div>" : "";
    return '<span class="impwrap"><button class="ghost imp' + (open ? " open" : "") + '" data-act="imp" data-v="' + k + '" aria-haspopup="menu" aria-expanded="' + open + '">' + ic("import", 16) + "Import" + ic("down", 14) + "</button>" + menu + "</span>";
  }

  // ---------- Product Master: Finished Goods (addendum-035) ----------
  function catName(id) { var c = SEED.categories.filter(function (x) { return x.id === id; })[0]; return c ? c.name : id || "—"; }
  function productsPage() {
    var all = s.items.saved, q = norm(ui.pq);
    var cats = []; all.forEach(function (r) { if (r.category && cats.indexOf(r.category) < 0) cats.push(r.category); });
    if (ui.pcat && cats.indexOf(ui.pcat) < 0) ui.pcat = "";
    var rows = all.filter(function (r) { return (!q || norm(r.name).indexOf(q) >= 0) && (!ui.pcat || r.category === ui.pcat); });
    var tools = '<section class="card bar">' + soon("Export", ic("export", 16) + "Export", "ghost") + importMenu("items") +
      soon("Bulk Action", ic("edit", 16) + "Bulk Action" + ic("down", 14), "ghost") + '<span class="grow"></span>' + soon("Add Product", ic("plus", 16) + "Add Product", "btn") + "</section>";
    var search = '<section class="card bar"><label class="search">' + ic("search", 16) + '<input data-bind="pq" placeholder="Search Products" autocomplete="off" value="' + esc(ui.pq) + '"' + (all.length ? "" : " disabled") + "></label>" +
      '<select data-bind="pcat" aria-label="Category"' + (all.length ? "" : " disabled") + '><option value="">All categories</option>' +
      cats.map(function (c) { return '<option value="' + esc(c) + '"' + (ui.pcat === c ? " selected" : "") + ">" + esc(catName(c)) + "</option>"; }).join("") + "</select></section>";
    var chips = '<div class="chips"><button class="chip' + (ui.pcat ? "" : " on") + '" data-act="pcat" data-v="">All</button>' + cats.map(function (c) {
      return '<button class="chip' + (ui.pcat === c ? " on" : "") + '" data-act="pcat" data-v="' + esc(c) + '">' + ic("tag", 12) + esc(catName(c)) + "</button>";
    }).join("") + "</div>";
    var body = !all.length ? emptyRow(6, "box", "products", "items") : rows.length ? rows.map(function (r, i) {
      var t = E.taxFlag(r.taxIncl), gst = E.blank(r.gst) ? "" : Number(r.gst) === 0 ? "0% tax" : r.gst + "% " + (t === true ? "incl." : "excl.") + " tax";
      var big = r.bigUnit || r.baseUnit || "unit";
      return '<tr><td class="ck"><input type="checkbox" aria-label="Select ' + esc(r.name) + '"></td>' +
        '<td><span class="prod"><span class="thumb">' + ic("bag", 22, 1.6) + "</span><span><b>" + esc(r.name) + "</b><small>Art No: a" + (100 + all.indexOf(r) + 1) + "</small></span></span></td>" +
        "<td>" + esc(catName(r.category)) + "</td>" +
        '<td><b class="num">' + money(r.rate) + "</b><small>" + esc(gst) + "</small></td>" +
        '<td><b class="num">0</b> <span class="u">' + esc(big.charAt(0).toUpperCase() + big.slice(1)) + '</span> <span class="soft">total stock</span><small><span class="red">0 can sell</span> · 0 in orders</small></td>' +
        '<td class="acts">' + soon("Viewing a product", ic("eye", 18), "ia") + soon("Editing a product", ic("edit", 18), "ia") + soon("Deleting a product", ic("trash", 18), "ia") + "</td></tr>";
    }).join("") : '<tr><td colspan="6" class="empty">No product matches “' + esc(ui.pq) + "”.</td></tr>";
    var table = '<div class="table"><table class="list"><thead><tr><th class="ck"><input type="checkbox" aria-label="Select all"' + (all.length ? "" : " disabled") + '></th><th>Name</th><th>Category</th><th>Selling price</th><th>Stock</th><th class="acts">Actions</th></tr></thead><tbody>' +
      body + "</tbody></table>" + pager(rows.length) + "</div>";
    return shell("products", "Finished Goods", tools + search + chips + table);
  }

  // ---------- Customer Management: B2B Customers (addendum-035) ----------
  function customersPage() {
    var all = s.customers.saved, q = norm(ui.cq);
    var rows = all.filter(function (c) { return !q || norm([c.name, c.phone, c.email, c.address].join(" ")).indexOf(q) >= 0; });
    var top = '<section class="phead"><div><h2>B2B Customers</h2><p>B2B Customers registered under your organisation.</p>' +
      '<div class="row">' + importMenu("customers") + soon("Sample", ic("import", 16) + "Sample", "ghost") + "</div></div>" +
      '<div class="row">' + soon("Bulk Action", ic("edit", 16) + "Bulk Action" + ic("down", 14), "ghost") + soon("Adding a B2B customer", ic("plus", 16) + "B2B Customers", "btn") + "</div></section>";
    var tabs = '<div class="utabs" role="tablist"><button class="on" role="tab" aria-selected="true">B2B Customers</button>' + soon("Catalog Mapping", "Catalog Mapping") + "</div>";
    var search = '<label class="search card">' + ic("search", 16) + '<input data-bind="cq" placeholder="Search b2b customers..." autocomplete="off" value="' + esc(ui.cq) + '"' + (all.length ? "" : " disabled") + "></label>";
    var body = !all.length ? emptyRow(7, "users", "customers", "customers") : rows.length ? rows.map(function (c) {
      return '<tr><td class="ck"><input type="checkbox" aria-label="Select ' + esc(c.name) + '"></td><td>' + esc(c.name) + '</td><td' + (c.email ? ">" + esc(c.email) : ' class="soft">—') + '</td><td class="num">' + esc(c.phone) + "</td><td>" + (c.lat != null ? '<span class="gpin on" title="' + c.lat + ", " + c.lng + '">' + ic("pin", 14) + "</span>" : "") + esc(c.address || "—") +
        '</td><td><span class="pill st-violet">Default</span></td><td class="acts">' + soon("Customer offers", ic("gift", 18), "ia") + soon("Editing a customer", ic("edit", 18), "ia") + soon("Deleting a customer", ic("trash", 18), "ia") + "</td></tr>";
    }).join("") : '<tr><td colspan="7" class="empty">No customer matches “' + esc(ui.cq) + "”.</td></tr>";
    var table = '<div class="table"><table class="list"><thead><tr><th class="ck"><input type="checkbox" aria-label="Select all"' + (all.length ? "" : " disabled") + '></th><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Catalog</th><th class="acts">Actions</th></tr></thead><tbody>' +
      body + "</tbody></table>" + pager(rows.length) + "</div>";
    return shell("customers", "B2B Customers", top + tabs + search + table);
  }

  // ---------- Activate your store (was "Getting started", addendum-046): one large modal — upload, review, submit (addendum-036) ----------
  var STEP_TABS = [["items", "Products"], ["customers", "Customers"]], LET = "ABCDEFGHIJKLMNOP";
  function store(k) { return k === "customers" ? s.customers : s.items; }
  function noun(k, n) { return (k === "customers" ? "customer" : "product") + (n === 1 ? "" : "s"); }
  function kb(n) { return n >= 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; }
  function other(k) { return k === "items" ? "customers" : "items"; }
  function openSetup(step) {
    var n = E.nextStep(s);
    ui.modal = { step: step || (n ? n.id : "items") }; ui.menu = false; ui.q = ""; ui.filter = "all"; ui.sel = null; ui.again = false;
  }
  // the sample file stands in for an Excel or PDF file (not read in the prototype); categories arrive as names
  function sampleRows(k) {
    if (k === "customers") return SEED.sources.customersFile.rows;
    return SEED.sources.file.rows.map(function (r) { var o = {}; Object.keys(r).forEach(function (x) { o[x] = r[x]; }); o.category = r.category ? catName(r.category) : ""; return o; });
  }
  function startReading(k) {
    var f = ui.pick[k]; if (!f) return;
    ui.reading = { step: k, name: f.name }; ui.modal.more = null;
    setTimeout(function () {
      var st = store(k); st.nextId = st.nextId || 1;
      st.sheet = st.sheet.concat((f.rows || sampleRows(k)).map(function (r) { var o = {}; Object.keys(r).forEach(function (x) { o[x] = r[x]; }); o.id = st.nextId++; return o; }));
      ui.reading = null; ui.pick[k] = null; ui.q = ""; ui.filter = "all"; ui.sel = null; save(); render();
    }, 1600);
  }
  function pickFile(k, file) {
    if (!file) return;
    var f = { name: file.name, size: file.size, rows: null };
    if (/\.csv$/i.test(file.name) && window.FileReader) {
      var rd = new FileReader();
      rd.onload = function () { f.rows = E.readCSV(String(rd.result), k); ui.pick[k] = f; render(); };
      rd.readAsText(file); return;
    }
    ui.pick[k] = f; render();
  }

  function stepHead(k) {
    var p = E.progress(s);
    if (ui.modal.only) return '<header class="mh"><b>Smart import</b><span class="ctx">' + ic(k === "customers" ? "users" : "box", 15) + (k === "customers" ? "Customers" : "Products") + '</span><span class="grow"></span>' +
      '<button class="iconbtn" data-act="close" aria-label="Close">' + ic("x", 22) + "</button></header>";   // one page's step only (addendum-043)
    var tabs = STEP_TABS.map(function (t, i) {
      var done = E.isDone(s, t[0]);
      return '<button role="tab" aria-selected="' + (k === t[0]) + '" class="' + (k === t[0] ? "on" : "") + (done ? " done" : "") + '" data-act="step" data-v="' + t[0] + '"><i>' + (done ? ic("check", 13, 3.5) : i + 1) + "</i>" + t[1] + "</button>";
    }).join("");
    return '<header class="mh"><b>Activate your store</b><div class="seg" role="tablist">' + tabs + '</div><span class="grow"></span><span class="frac">' + p.done + "/" + p.total + "</span>" +
      '<button class="iconbtn" data-act="close" aria-label="Close">' + ic("x", 22) + "</button></header>";
  }
  function uploadView(k) {
    var f = ui.pick[k];
    var drop = '<label class="drop" for="file-' + k + '"><span class="dico">' + ic(k === "customers" ? "users" : "box", 30) + "</span><b>Drop your " + (k === "customers" ? "customers" : "products") + " file</b>" +
      '<span class="fmts"><i>XLSX</i><i>CSV</i><i>PDF</i></span><span class="pickbtn">Choose file</span></label>' +
      '<input type="file" id="file-' + k + '" class="sr" accept=".xlsx,.xls,.csv,.pdf" data-file="' + k + '">';
    var chip = f ? '<div class="fchip"><span class="fic">' + ic("file", 20) + "</span><b>" + esc(f.name) + "</b><span>" + kb(f.size) + "</span>" +
      '<button class="iconbtn" data-act="unpick" aria-label="Remove the file">' + ic("x", 16) + "</button></div>" : "";
    return '<div class="mb center"><div class="upl">' + drop + chip + "</div></div>" +
      '<footer class="mf"><button class="link" data-act="sample">Try a sample file</button><span class="grow"></span><button class="btn" data-act="read"' + (f ? "" : " disabled") + ">Submit</button></footer>";
  }
  function readingView() {
    return '<div class="mb center"><div class="readbox"><span class="fic">' + ic("file", 22) + "</span><b>" + esc(ui.reading.name) + '</b><div class="rbar"><i></i></div></div></div>';
  }
  function stepDoneView(k) {
    var n = store(k).saved.length, o = other(k), next = !E.isDone(s, o) && !ui.modal.only;
    return '<div class="mb center"><div class="donebox"><span class="big">' + ic("check", 34, 3) + "</span><b>" + n + " " + noun(k, n) + " added</b>" +
      '<div class="row">' + (ui.modal.only ? "" : '<button class="ghost" data-act="view" data-v="' + (k === "customers" ? "customers" : "products") + '">View ' + (k === "customers" ? "customers" : "products") + "</button>") +
      '<button class="ghost" data-act="more">Upload more</button></div></div></div>' +
      (next ? '<footer class="mf"><span class="grow"></span><button class="btn" data-act="step" data-v="' + o + '">Next: ' + (o === "customers" ? "Customers" : "Products") + ic("chev", 16, 2.5) + "</button></footer>"
        : ui.modal.only ? '<footer class="mf"><span class="grow"></span><button class="btn" data-act="close">Done</button></footer>' : "");
  }
  function allDoneView() {
    return '<div class="mb center"><div class="donebox"><span class="big">' + ic("check", 34, 3) + "</span><b>Your store is active</b>" +
      '<div class="row"><button class="ghost" data-act="view" data-v="products">View products</button><button class="ghost" data-act="view" data-v="customers">View customers</button></div></div></div>' +
      '<footer class="mf"><span class="grow"></span><button class="btn" data-act="close">Done</button></footer>';
  }

  // the review: one sheet per step; rows are numbered as a sheet does (the header is row 1)
  function issuesOf(k) { var st = store(k), m = {}; st.sheet.forEach(function (r) { m[r.id] = E.checkRow(k, r, st.sheet, st.saved); }); return m; }
  function levelOf(list) { return list.some(function (x) { return x.level === "fix"; }) ? "fix" : list.length ? "check" : "ready"; }
  function visibleRows(k, iss) {
    var cols = E.colsFor(k), q = norm(ui.q);
    return store(k).sheet.filter(function (r) {
      return (ui.filter === "all" || levelOf(iss[r.id]) === ui.filter) && (!q || norm(cols.map(function (c) { return r[c.key]; }).join(" ")).indexOf(q) >= 0);
    });
  }
  function cellText(c, v) {
    if (c.key === "taxIncl") { var t = E.taxFlag(v); return t === true ? "Included" : t === false ? "Extra" : v; }
    return v;
  }
  // a choice column's dropdown (addendum-039): the engine's options; categories also offer the store's own
  function cellOptions(k, c, r) {
    var o = E.colOptions(k, c.key, r, store(k).sheet); if (!o) return null;
    if (c.key === "category") SEED.categories.forEach(function (x) { if (!o.options.some(function (y) { return y.value.toLowerCase() === x.name.toLowerCase(); })) o.options.push({ value: x.name, label: x.name }); });
    return o;
  }
  function cellEditor(k, c, r, v, n) {
    var o = cellOptions(k, c, r), attrs = ' id="cell" data-r="' + r.id + '" data-c="' + c.key + '" aria-label="' + esc(c.label) + ", row " + n + '"';
    if (o && o.kind === "select") {
      var t = c.key === "taxIncl" ? E.taxFlag(v) : null, cur = c.key === "taxIncl" ? (t === true ? "incl" : t === false ? "extra" : v) : v;
      var known = o.options.some(function (x) { return x.value === cur; });
      return '<select' + attrs + ">" + (known ? "" : '<option value="' + esc(v) + '" selected>' + (v ? esc(v) : "—") + "</option>") +
        o.options.map(function (x) { return '<option value="' + esc(x.value) + '"' + (x.value === cur ? " selected" : "") + ">" + esc(x.label) + "</option>"; }).join("") + "</select>";
    }
    if (o) return "<input" + attrs + ' class="combo" role="combobox" aria-expanded="true" aria-controls="combo" value="' + esc(v) + '" autocomplete="off">';
    if (c.geo) return "<input" + attrs + ' value="' + esc(v) + '" autocomplete="off"><button class="mapbtn" data-act="mappick" data-r="' + r.id + '" title="Find on the map" aria-label="Find on the map">' + ic("pin", 15) + "</button>";
    return "<input" + attrs + ' value="' + esc(v) + '" autocomplete="off">';
  }
  // search, select or add new (addendum-041): the list under a Category / Unit / Big unit cell, filtered as the owner types
  function comboItems(q) {
    var k = ui.modal.step, sel = ui.sel, r = sel && rowById(k, sel.r), c = r && E.colsFor(k).filter(function (x) { return x.key === sel.c; })[0];
    var o = c && cellOptions(k, c, r); if (!o) return [];
    var t = String(q || "").trim().toLowerCase();
    var list = o.options.filter(function (x) { return !t || x.value.toLowerCase().indexOf(t) >= 0; }).map(function (x) { return { value: x.value }; });
    if (t && !o.options.some(function (x) { return x.value.toLowerCase() === t; })) list.push({ value: String(q).trim(), add: true });
    return list;
  }
  function comboList(q) {
    var items = comboItems(q); ui.combo.items = items;
    if (ui.combo.hi >= items.length) ui.combo.hi = items.length - 1; if (ui.combo.hi < 0) ui.combo.hi = 0;
    return items.map(function (x, i) {
      return '<button type="button" role="option" class="' + (i === ui.combo.hi ? "hi" : "") + (x.add ? " add" : "") + '" data-act="combopick" data-i="' + i + '" aria-selected="' + (i === ui.combo.hi) + '">' +
        (x.add ? ic("plus", 14, 2.5) + "Add “" + esc(x.value) + "”" : esc(x.value)) + "</button>";
    }).join("") || '<span class="none">No match</span>';
  }
  function comboPick(i) {
    var c = document.getElementById("cell"), x = ui.combo.items[i]; if (!c || !x) return false;
    c.value = x.value; commitCell(); return true;
  }
  function fixBar(k, iss) {
    var sel = ui.sel, st = store(k), cols = E.colsFor(k);
    if (!sel) return "";
    var r = st.sheet.filter(function (x) { return x.id === sel.r; })[0]; if (!r) return "";
    var n = st.sheet.indexOf(r) + 2;
    if (!sel.c) return '<div class="fixbar"><b class="ref">Row ' + n + '</b><span class="grow"></span><button class="chip danger" data-act="delrow">' + ic("trash", 14) + "Delete row</button></div>";
    var here = iss[r.id].filter(function (x) { return x.col === sel.c; });
    var ref = LET[cols.map(function (c) { return c.key; }).indexOf(sel.c)] + n;
    if (!here.length) return '<div class="fixbar"><b class="ref">' + ref + "</b></div>";
    return '<div class="fixbar"><b class="ref">' + ref + "</b>" + here.map(function (i) {
      return '<span class="msg ' + i.level + '">' + ic("alert", 15) + esc(i.msg) + "</span>" + (i.fixes || []).map(function (f) {
        return '<button class="chip" data-act="fix" data-col="' + i.col + '"' + (f.action ? ' data-a="' + f.action + '"' : ' data-v="' + esc(f.value) + '"') + (i.batch ? ' data-batch="1"' : "") + ">" + esc(f.label) + (i.batch ? " · all" : "") + "</button>";
      }).join("");
    }).join("") + "</div>";
  }
  function reviewView(k) {
    var st = store(k), cols = E.colsFor(k), iss = issuesOf(k), cnt = E.reviewCounts(k, st.sheet, st.saved);
    if (ui.filter !== "all" && !cnt[ui.filter]) ui.filter = "all";
    var vis = visibleRows(k, iss);
    var chips = [["all", "All", cnt.total], ["fix", "Needs fix", cnt.fix], ["check", "Check", cnt.check], ["ready", "Ready", cnt.ready]].map(function (c) {
      return '<button class="fchip2 ' + c[0] + (ui.filter === c[0] ? " on" : "") + '" data-act="filter" data-v="' + c[0] + '"' + (c[2] || c[0] === "all" ? "" : " disabled") + '><i></i>' + c[1] + " <b>" + c[2] + "</b></button>";
    }).join("");
    var tools = '<div class="rtools"><label class="search">' + ic("search", 16) + '<input data-bind="q" placeholder="Search" autocomplete="off" value="' + esc(ui.q) + '"></label>' + chips +
      '<span class="grow"></span>' + (cnt.fix + cnt.check ? '<button class="ghost" data-act="nextissue">' + ic("down2", 16) + "Next issue</button>" : "") + "</div>";
    var head = '<tr><th class="rn">1</th>' + cols.map(function (c, i) { return '<th style="min-width:' + c.w + 'px"><span class="lt">' + LET[i] + "</span>" + esc(c.label) + (c.req ? '<i class="req" title="Must">*</i>' : "") + "</th>"; }).join("") + "</tr>";
    var body = vis.map(function (r) {
      var n = st.sheet.indexOf(r) + 2, lv = levelOf(iss[r.id]), rs = ui.sel && ui.sel.r === r.id && !ui.sel.c;
      return '<tr class="' + (rs ? "rsel" : "") + '"><th class="rn ' + lv + '" data-act="selrow" data-r="' + r.id + '">' + n + "</th>" + cols.map(function (c) {
        var ci = iss[r.id].filter(function (x) { return x.col === c.key; }), cl = levelOf(ci), v = r[c.key] == null ? "" : String(r[c.key]);
        var cls = (cl === "ready" ? "" : cl) + (c.num ? " num" : "");
        var dd = !!E.colOptions(k, c.key, r, st.sheet);
        if (dd) cls += " dd";
        if (ui.sel && ui.sel.r === r.id && ui.sel.c === c.key) return '<td class="sel ' + cls + '">' + cellEditor(k, c, r, v, n) + "</td>";
        return '<td class="' + cls + '" data-act="cell" data-r="' + r.id + '" data-c="' + c.key + '"' + (ci.length ? ' title="' + esc(ci.map(function (x) { return x.msg; }).join(" · ")) + '"' : "") + ">" +
          (dd ? '<i class="caret" aria-hidden="true"></i>' : "") + (c.geo ? '<span class="gpin' + (r.lat != null ? " on" : "") + '"' + (r.lat != null ? ' title="' + r.lat + ", " + r.lng + '"' : "") + ">" + ic("pin", 14) + "</span>" : "") + esc(cellText(c, v)) + "</td>";
      }).join("") + "</tr>";
    }).join("") || '<tr><th class="rn"></th><td colspan="' + cols.length + '" class="none">Nothing here</td></tr>';
    var good = cnt.check + cnt.ready;
    var again = ui.again ? '<button class="link danger" data-act="discard">Discard ' + cnt.total + " rows</button>" + '<button class="link" data-act="keep">Keep</button>' : '<button class="link" data-act="again">Upload again</button>';
    return '<div class="mb">' + tools + fixBar(k, iss) + '<div class="sheetwrap" id="sheet"><table class="sheet"><thead>' + head + "</thead><tbody>" + body + "</tbody></table></div></div>" +
      '<footer class="mf">' + again + '<span class="grow"></span><button class="btn" data-act="submit"' + (good ? "" : " disabled") + ">Submit " + good + " " + (cnt.fix ? "ready" : noun(k, good)) + "</button></footer>";
  }
  function setupModal() {
    if (!ui.modal) return "";
    var k = ui.modal.step, both = E.isDone(s, "items") && E.isDone(s, "customers");
    var body = ui.reading && ui.reading.step === k ? readingView() : store(k).sheet.length ? reviewView(k) : ui.modal.more === k ? uploadView(k)
      : ui.modal.only ? (ui.modal.finished ? stepDoneView(k) : uploadView(k))   // Smart import: upload, review, done — this step only (addendum-043)
      : both && !ui.modal.picked ? allDoneView() : E.isDone(s, k) ? stepDoneView(k) : uploadView(k);
    var flash = ui.flash ? '<div class="mflash" role="status">' + ic("check", 16, 3) + esc(ui.flash) + "</div>" : "";
    var combo = ui.sel && ui.sel.c && store(k).sheet.length && E.colOptions(k, ui.sel.c, rowById(k, ui.sel.r) || {}, store(k).sheet) && E.colOptions(k, ui.sel.c, rowById(k, ui.sel.r) || {}, store(k).sheet).kind === "suggest"
      ? '<div class="combo-list" id="combo" role="listbox">' + comboList("") + "</div>" : "";
    return '<div class="mdim"></div><div class="mbox" role="dialog" aria-modal="true" aria-label="Activate your store">' + stepHead(k) + body + flash + combo + "</div>";
  }

  // moving around the sheet
  function rowById(k, id) { return store(k).sheet.filter(function (x) { return x.id === id; })[0]; }
  function moveSel(dr, dc) {
    var k = ui.modal.step, cols = E.colsFor(k).map(function (c) { return c.key; }), vis = visibleRows(k, issuesOf(k)), sel = ui.sel; if (!sel || !sel.c) return;
    var ri = vis.map(function (r) { return r.id; }).indexOf(sel.r), ci = cols.indexOf(sel.c);
    ci += dc; if (ci >= cols.length) { ci = 0; ri++; } if (ci < 0) { ci = cols.length - 1; ri--; }
    ri = Math.max(0, Math.min(vis.length - 1, ri + dr));
    if (vis[ri]) ui.sel = { r: vis[ri].id, c: cols[ci] }; ui.selectAll = true;
  }
  function nextIssue() {
    var k = ui.modal.step, iss = issuesOf(k), cols = E.colsFor(k).map(function (c) { return c.key; }), rows = store(k).sheet, list = [];
    rows.forEach(function (r) { cols.forEach(function (c) { if (iss[r.id].some(function (x) { return x.col === c; })) list.push({ r: r.id, c: c }); }); });
    if (!list.length) { ui.sel = null; return; }
    var at = -1; if (ui.sel) list.forEach(function (x, i) { if (x.r === ui.sel.r && x.c === ui.sel.c) at = i; });
    if (at === -1 && ui.sel) { var ri = rows.map(function (r) { return r.id; }).indexOf(ui.sel.r); for (var i = 0; i < list.length; i++) if (rows.map(function (r) { return r.id; }).indexOf(list[i].r) >= ri) { at = i - 1; break; } }
    ui.sel = list[(at + 1) % list.length]; ui.filter = "all"; ui.selectAll = false; ui.reveal = true;
  }
  function comboItemsAll() { return comboItems(""); }
  function commitCell() {
    var i = document.getElementById("cell"); if (!i || !ui.modal) return;
    var r = rowById(ui.modal.step, Number(i.getAttribute("data-r"))), v = i.value;
    if (r && i.classList.contains("combo")) { var t = v.trim().toLowerCase(), same = (comboItemsAll().filter(function (x) { return x.value.toLowerCase() === t; })[0]); v = same ? same.value : v.trim(); }
    if (r) { r[i.getAttribute("data-c")] = v; save(); }
  }

  // ---------- a customer's address, picked on a map (addendum-042) ----------
  // Prototype: OpenStreetMap tiles (Leaflet) and Nominatim search, no key. In the product: Google Maps / Places behind a
  // host port. The picker lives outside #app, so the map is not rebuilt by render().
  var GEO = "https://nominatim.openstreetmap.org", PUNE = [18.5204, 73.8567], PICK = null;
  function loadLeaflet(cb) {
    if (window.L) return cb();
    if (!document.getElementById("lf-css")) { var l = document.createElement("link"); l.id = "lf-css"; l.rel = "stylesheet"; l.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css"; document.head.appendChild(l); }
    var sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    sc.onload = function () { cb(); }; sc.onerror = function () { cb(new Error("no map")); }; document.head.appendChild(sc);
  }
  function placeLabel(x) {   // "Baner Road, Baner, Pune, 411045" from a Nominatim result
    // OpenStreetMap data is uneven: a place's name can run long ("Clinic - Hinjewadi, Pune") and a house number can hold a
    // whole sentence, so keep a place's first part and a house number only when it is short
    var a = x.address || {}, place = String(x.name || a.amenity || a.shop || a.office || a.building || "").split(/\s+-\s+|,/)[0].trim();
    var hn = String(a.house_number || "").trim(), first = place || (a.road ? (hn && hn.length <= 10 ? hn + " " : "") + a.road : a.neighbourhood || "");
    var seen = {}, parts = [first, a.suburb || a.neighbourhood || a.quarter || a.residential, a.city || a.town || a.village || a.county || a.state_district, a.postcode]
      .filter(function (p) { if (!p || seen[p]) return false; seen[p] = 1; return true; });
    return parts.join(", ") || String(x.display_name || "").split(",").slice(0, 3).join(",");
  }
  var lastGeo = 0;
  function geo(path, done) {   // Nominatim asks for at most one request a second
    var wait = Math.max(0, lastGeo + 1000 - Date.now()); lastGeo = Date.now() + wait;
    setTimeout(function () {
      fetch(GEO + path, { headers: { "Accept-Language": "en" } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (j) { done(null, j); }, function (e) { done(e); });
    }, wait);
  }
  function pinIcon() { return window.L.divIcon({ className: "mpin", html: '<svg width="34" height="44" viewBox="0 0 34 44"><path d="M17 43s15-14.6 15-26A15 15 0 0 0 2 17c0 11.4 15 26 15 26z" fill="#16a34a" stroke="#fff" stroke-width="2"/><circle cx="17" cy="17" r="6" fill="#fff"/></svg>', iconSize: [34, 44], iconAnchor: [17, 43] }); }
  function pickerFoot() {
    if (!PICK) return;
    var lb = PICK.el.querySelector("#plabel"), use = PICK.el.querySelector('[data-p="use"]');
    lb.textContent = PICK.busy ? "Finding the address…" : PICK.label || "Search, or click the map";
    lb.className = "plabel" + (PICK.label && !PICK.busy ? "" : " soft");
    use.disabled = PICK.lat == null || !PICK.label || PICK.busy;
  }
  function setPoint(lat, lng, lookUp, label) {
    if (!PICK || !PICK.map) return;
    PICK.lat = lat; PICK.lng = lng;
    if (!PICK.marker) {
      PICK.marker = window.L.marker([lat, lng], { draggable: true, icon: pinIcon() }).addTo(PICK.map);
      PICK.marker.on("dragend", function () { var p = PICK.marker.getLatLng(); setPoint(p.lat, p.lng, true); });
    } else PICK.marker.setLatLng([lat, lng]);
    if (label) { PICK.label = label; PICK.busy = false; pickerFoot(); return; }
    if (!lookUp) return;
    PICK.busy = true; pickerFoot(); var at = PICK.lat;
    geo("/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=" + lat + "&lon=" + lng, function (err, j) {
      if (!PICK || PICK.lat !== at) return;
      PICK.busy = false; PICK.label = err || !j || j.error ? lat.toFixed(5) + ", " + lng.toFixed(5) : placeLabel(j); pickerFoot();
    });
  }
  function pickerSearch(q, auto) {
    var box = PICK.el.querySelector("#pres"); q = String(q || "").trim();
    if (q.length < 3) { box.innerHTML = ""; PICK.results = []; return; }
    box.innerHTML = '<span class="pnote">Searching…</span>';
    geo("/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=in&q=" + encodeURIComponent(q), function (err, j) {
      if (!PICK) return;
      if (err) { box.innerHTML = '<span class="pnote">Can’t reach the map search.</span>'; return; }
      PICK.results = j || [];
      if (auto) { box.innerHTML = ""; var f = PICK.results[0]; if (f && PICK.map) { PICK.map.setView([+f.lat, +f.lon], 16); setPoint(+f.lat, +f.lon, false, placeLabel(f)); } return; }
      box.innerHTML = PICK.results.length ? PICK.results.map(function (x, i) {
        return '<button type="button" data-p="res" data-i="' + i + '">' + ic("pin", 15) + "<span><b>" + esc(placeLabel(x)) + "</b><small>" + esc(String(x.display_name).split(",").slice(-3).join(",").trim()) + "</small></span></button>";
      }).join("") : '<span class="pnote">No place found</span>';
    });
  }
  function closePicker() {
    if (!PICK) return;
    clearTimeout(PICK.timer); if (PICK.map) PICK.map.remove(); PICK.el.remove(); PICK = null;
  }
  function openPicker(rowId) {
    var r = rowById("customers", rowId); if (!r) return;
    closePicker();
    var el = document.createElement("div"); el.id = "picker";
    el.innerHTML = '<div class="pdim" data-p="close"></div><div class="pbox" role="dialog" aria-modal="true" aria-label="Address of ' + esc(r.name || "the customer") + '">' +
      '<header><span class="ppin">' + ic("pin", 18) + "</span><b>" + esc(r.name || "Address") + '</b><button class="iconbtn" data-p="close" aria-label="Close">' + ic("x", 20) + "</button></header>" +
      '<div class="psearch"><label class="search">' + ic("search", 16) + '<input id="pq" placeholder="Search a place, area or pincode" autocomplete="off" value="' + esc(r.address || "") + '"></label><div class="pres" id="pres"></div></div>' +
      '<div class="pmap" id="pmap"><span class="pnote">Loading the map…</span></div>' +
      '<footer><span class="ppin">' + ic("pin", 16) + '</span><span class="plabel soft" id="plabel"></span><button class="btn" data-p="use" disabled>Use this location</button></footer></div>';
    document.body.appendChild(el);
    PICK = { el: el, rowId: rowId, lat: null, lng: null, label: "", results: [], busy: false };
    pickerFoot();
    var q = el.querySelector("#pq"); q.focus(); q.select();
    q.addEventListener("input", function () { clearTimeout(PICK.timer); var v = q.value; PICK.timer = setTimeout(function () { if (PICK) pickerSearch(v); }, 700); });
    q.addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); clearTimeout(PICK.timer); pickerSearch(q.value); } });
    el.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-p]"); if (!b) return;
      var p = b.getAttribute("data-p");
      if (p === "close") { closePicker(); render(); return; }
      if (p === "res") {
        var x = PICK.results[Number(b.getAttribute("data-i"))]; if (!x || !PICK.map) return;
        PICK.el.querySelector("#pres").innerHTML = ""; PICK.map.setView([+x.lat, +x.lon], 17); setPoint(+x.lat, +x.lon, false, placeLabel(x)); return;
      }
      if (p === "use") {
        var row = rowById("customers", PICK.rowId);
        if (row && PICK.lat != null) { row.address = PICK.label; row.lat = Math.round(PICK.lat * 1e6) / 1e6; row.lng = Math.round(PICK.lng * 1e6) / 1e6; save(); }
        closePicker(); ui.sel = { r: rowId, c: "address" }; render();
      }
    });
    loadLeaflet(function (err) {
      if (!PICK || PICK.el !== el) return;
      var box = el.querySelector("#pmap");
      if (err || !window.L) { box.innerHTML = '<span class="pnote">Can’t reach the map. Type the address in the cell.</span>'; return; }
      box.innerHTML = "";
      var has = r.lat != null && r.lng != null;
      PICK.map = window.L.map(box, { zoomControl: true, attributionControl: true }).setView(has ? [r.lat, r.lng] : PUNE, has ? 17 : 12);
      window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(PICK.map);
      PICK.map.on("click", function (e) { setPoint(e.latlng.lat, e.latlng.lng, true); });
      if (has) setPoint(r.lat, r.lng, false, r.address);
      else if (r.address) pickerSearch(r.address, true);   // an address from the file: show where it is, ready to confirm
    });
  }

  // ---------- events ----------
  var noteTimer = null, flashTimer = null;
  function flash(t) { ui.flash = t; clearTimeout(flashTimer); flashTimer = setTimeout(function () { ui.flash = ""; render(); }, 2600); }
  function clean(r) { var o = {}; Object.keys(r).forEach(function (x) { if (x !== "hint" && x !== "keepBoth") o[x] = r[x]; }); return o; }
  var ACT = {
    side: function () { ui.side = !ui.side; },
    menu: function () { ui.menu = !ui.menu; },
    tab: function (el) { ui.tab = el.getAttribute("data-v"); },
    pcat: function (el) { ui.pcat = el.getAttribute("data-v"); },
    soon: function (el) {   // not designed in v2 yet: say so instead of going anywhere
      ui.menu = false; ui.note = el.getAttribute("data-what") + " isn't designed in v2 yet.";
      clearTimeout(noteTimer); noteTimer = setTimeout(function () { ui.note = ""; render(); }, 2600);
    },
    // the Import menu (addendum-043)
    imp: function (el) { var v = el.getAttribute("data-v"); ui.imp = ui.imp === v ? null : v; ui.impFocus = !!ui.imp; },
    smartimport: function (el) { var k = el.getAttribute("data-step"); ui.imp = null; ui.panel = false; ui.modal = { step: k, only: true }; ui.q = ""; ui.filter = "all"; ui.sel = null; ui.again = false; },
    samplefile: function (el) {
      var k = el.getAttribute("data-step"), a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([E.sampleCSV(k)], { type: "text/csv" })); a.download = (k === "customers" ? "customers" : "products") + "-sample.csv";
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 0); ui.imp = null;
    },
    // the assistant's panel (addendum-038)
    panel: function () { ui.panel = !ui.panel; },
    ask: function (el) { ask(el.getAttribute("data-q")); },
    // the setup modal (addendum-036)
    setup: function (el) { ui.panel = false; openSetup(el.getAttribute("data-step")); },
    close: function () { commitCell(); closePicker(); ui.modal = null; ui.sel = null; },
    step: function (el) { commitCell(); ui.modal.step = el.getAttribute("data-v"); ui.modal.picked = true; ui.modal.more = null; ui.q = ""; ui.filter = "all"; ui.sel = null; ui.again = false; },
    sample: function () { var k = ui.modal.step, f = k === "customers" ? SEED.sources.customersFile : SEED.sources.file; ui.pick[k] = { name: f.label.replace(/\.pdf$/, ".xlsx"), size: 48 * 1024, rows: null }; },
    unpick: function () { ui.pick[ui.modal.step] = null; },
    read: function () { startReading(ui.modal.step); },
    more: function () { ui.pick[ui.modal.step] = null; ui.modal.more = ui.modal.step; ui.modal.finished = false; },
    view: function (el) { ui.modal = null; ui.sel = null; ui.panel = false; location.hash = "#" + el.getAttribute("data-v"); },
    filter: function (el) { commitCell(); ui.filter = el.getAttribute("data-v"); ui.sel = null; },
    combopick: function (el) { if (comboPick(Number(el.getAttribute("data-i")))) ui.sel = null; },
    cell: function (el) {
      commitCell(); ui.sel = { r: Number(el.getAttribute("data-r")), c: el.getAttribute("data-c") }; ui.selectAll = false; ui.openPick = el.classList.contains("dd"); ui.combo = { hi: 0, items: [] };
      if (ui.modal.step === "customers" && ui.sel.c === "address") { var id = ui.sel.r; setTimeout(function () { openPicker(id); }, 0); }   // the map (addendum-042)
    },
    mappick: function (el) { commitCell(); var id = Number(el.getAttribute("data-r")); setTimeout(function () { openPicker(id); }, 0); },
    selrow: function (el) { commitCell(); ui.sel = { r: Number(el.getAttribute("data-r")), c: null }; },
    delrow: function () { var st = store(ui.modal.step); st.sheet = st.sheet.filter(function (r) { return r.id !== ui.sel.r; }); ui.sel = null; },
    nextissue: function () { commitCell(); nextIssue(); },
    fix: function (el) {
      var k = ui.modal.step, st = store(k), r = rowById(k, ui.sel.r), a = el.getAttribute("data-a"), col = el.getAttribute("data-col");
      if (a === "merge") st.sheet = E.mergeRow(st.sheet, r, st.saved);
      else if (a === "keepboth") r.keepBoth = true;
      else if (a === "remove") st.sheet = st.sheet.filter(function (x) { return x !== r; });
      else if (el.getAttribute("data-batch")) E.setTaxAll(st.sheet, el.getAttribute("data-v"));
      else r[col] = el.getAttribute("data-v");
      nextIssue();   // straight on to the next thing to look at
    },
    again: function () { ui.again = true; },
    keep: function () { ui.again = false; },
    discard: function () { store(ui.modal.step).sheet = []; ui.again = false; ui.sel = null; },
    submit: function () {
      commitCell();
      var k = ui.modal.step, st = store(k), sp = E.splitForSubmit(k, st.sheet, st.saved);
      if (!sp.good.length) return;
      st.saved = st.saved.concat(sp.good.map(clean)); st.sheet = sp.broken; if (k === "customers") st.done = true;
      ui.sel = null; ui.q = ""; ui.filter = sp.broken.length ? "fix" : "all";
      flash(sp.good.length + " " + noun(k, sp.good.length) + " added");
      if (!sp.broken.length) { if (ui.modal.only) ui.modal.finished = true; else { ui.modal.picked = false; if (!E.isDone(s, other(k))) ui.modal.step = other(k); } }
    }
  };
  app.addEventListener("click", function (ev) {
    var el = ev.target.closest("[data-act]");
    if (!el) {
      var redraw = false;
      if (ui.menu && !ev.target.closest(".menu")) { ui.menu = false; redraw = true; }
      if (ui.imp && !ev.target.closest(".impmenu")) { ui.imp = null; redraw = true; }
      if (redraw) render(); return;
    }
    if (ui.imp && el.getAttribute("data-act") !== "imp" && !el.closest(".impmenu")) ui.imp = null;
    ev.preventDefault();
    var a = el.getAttribute("data-act");
    if (a !== "menu" && !el.closest(".menu")) ui.menu = false;
    if (ACT[a]) { ACT[a](el); save(); render(); }
  });
  app.addEventListener("input", function (ev) {
    if (ev.target.id === "cell") {   // a cell keeps its typing until it is left (commitCell); a search-and-select cell filters its list
      if (ev.target.classList.contains("combo")) { ui.combo.hi = 0; var l = document.getElementById("combo"); if (l) l.innerHTML = comboList(ev.target.value); }
      return;
    }
    var b = ev.target.getAttribute("data-bind"); if (!b || ev.target.tagName === "SELECT") return;
    ui[b] = ev.target.value; if (b === "q") ui.sel = null; render();
    var i = app.querySelector('[data-bind="' + b + '"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  });
  app.addEventListener("change", function (ev) {
    if (ev.target.getAttribute("data-bind") === "pcat") { ui.pcat = ev.target.value; render(); }
    if (ev.target.getAttribute("data-file")) pickFile(ev.target.getAttribute("data-file"), ev.target.files[0]);
    if (ev.target.id === "cell" && ev.target.tagName === "SELECT") { commitCell(); render(); }   // a dropdown's pick saves at once (addendum-039)
  });
  app.addEventListener("submit", function (ev) {
    if (ev.target.getAttribute("data-form") !== "ask") return;
    ev.preventDefault(); ask(document.getElementById("askin").value); render();
    var i = document.getElementById("askin"); if (i) i.focus();
  });
  // the Import menu's keys (addendum-044): ↑ ↓ move between its rows
  app.addEventListener("keydown", function (ev) {
    var m = ev.target.closest && ev.target.closest(".impmenu"); if (!m || (ev.key !== "ArrowDown" && ev.key !== "ArrowUp")) return;
    ev.preventDefault(); var rows = [].slice.call(m.querySelectorAll(".irow")), i = rows.indexOf(ev.target);
    rows[(i + (ev.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length].focus();
  });
  // the sheet's keys: Enter ↓, Tab →, arrows move, Esc undoes the typing
  app.addEventListener("keydown", function (ev) {
    if (ev.target.id !== "cell") return;
    if (ev.target.classList.contains("combo")) {   // ↑ ↓ move in the list, Enter / Tab pick and move on, Esc closes (addendum-041)
      var l = document.getElementById("combo");
      if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
        ev.preventDefault(); var n = ui.combo.items.length; if (!n) return;
        ui.combo.hi = (ui.combo.hi + (ev.key === "ArrowDown" ? 1 : -1) + n) % n; if (l) { l.innerHTML = comboList(ev.target.value); var h = l.querySelector(".hi"); if (h) h.scrollIntoView({ block: "nearest" }); }
        return;
      }
      if (ev.key === "Enter" || ev.key === "Tab") {
        ev.preventDefault(); if (!ui.combo.items.length || !comboPick(ui.combo.hi)) commitCell();
        moveSel(ev.key === "Enter" ? (ev.shiftKey ? -1 : 1) : 0, ev.key === "Tab" ? (ev.shiftKey ? -1 : 1) : 0); ui.combo = { hi: 0, items: [] }; render(); return;
      }
    }
    var mv = { Enter: [ev.shiftKey ? -1 : 1, 0], Tab: [0, ev.shiftKey ? -1 : 1], ArrowDown: [1, 0], ArrowUp: [-1, 0] }[ev.key];
    if (ev.target.tagName === "SELECT" && (ev.key === "ArrowDown" || ev.key === "ArrowUp")) mv = null;   // there the arrows pick
    if (mv) { ev.preventDefault(); commitCell(); moveSel(mv[0], mv[1]); render(); return; }
    if (ev.key === "Escape") { ev.preventDefault(); ev.stopPropagation(); ui.sel = null; render(); }
  });
  // leaving a cell by clicking somewhere that is not an action still keeps what was typed
  app.addEventListener("focusout", function (ev) {
    if (ev.target.id !== "cell") return;
    commitCell(); setTimeout(function () { if (PICK) return; if (!document.getElementById("cell") || document.activeElement !== document.getElementById("cell")) { if (!rendering) render(); } }, 150);
  });
  // picking from the search-and-select list keeps the focus in its cell (addendum-041)
  app.addEventListener("mousedown", function (ev) { if (ev.target.closest && ev.target.closest(".combo-list")) ev.preventDefault(); });
  // drop a file on the drop area
  app.addEventListener("dragover", function (ev) { var d = ev.target.closest && ev.target.closest(".drop"); if (d) { ev.preventDefault(); d.classList.add("over"); } });
  app.addEventListener("dragleave", function (ev) { var d = ev.target.closest && ev.target.closest(".drop"); if (d) d.classList.remove("over"); });
  app.addEventListener("drop", function (ev) { var d = ev.target.closest && ev.target.closest(".drop"); if (d && ui.modal) { ev.preventDefault(); pickFile(ui.modal.step, ev.dataTransfer.files[0]); } });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    if (PICK) { ev.stopPropagation(); closePicker(); render(); return; }
    if (ui.imp) { var back = ui.imp; ui.imp = null; render(); var ib = app.querySelector('.imp[data-v="' + back + '"]'); if (ib) ib.focus(); } else if (ui.menu) { ui.menu = false; render(); } else if (ui.modal && ev.target.id !== "cell") { ui.modal = null; ui.sel = null; render(); }
    else if (ui.panel) { ui.panel = false; render(); }
  });

  var VIEWS = { dashboard: [dashboard, "Dashboard"], products: [productsPage, "Finished Goods"], customers: [customersPage, "B2B Customers"] };
  function route() { var r = (location.hash || "#dashboard").slice(1); return AIDS[r] || VIEWS[r] ? r : "dashboard"; }
  var rendering = false;
  function render() {
    var r = route();
    if (AIDS[r]) { AIDS[r](); save(); ui.modal = null; ui.panel = false; ui.chat = []; location.replace("#dashboard"); return; }
    rendering = true;
    var sh = document.getElementById("sheet"), sx = sh ? sh.scrollLeft : 0, sy = sh ? sh.scrollTop : 0;
    app.innerHTML = VIEWS[r][0]();
    document.title = "FoodBridge · " + (ui.modal ? "Activate your store" : VIEWS[r][1]);
    document.body.classList.toggle("noscroll", !!ui.modal);
    var sh2 = document.getElementById("sheet"); if (sh2) { sh2.scrollLeft = sx; sh2.scrollTop = sy; }
    var c = document.getElementById("cell");
    if (c && !PICK) {   // while the map picker is open, the sheet never takes the focus back (addendum-042)
      c.focus({ preventScroll: true });
      if (c.tagName === "SELECT") { if (ui.openPick && c.showPicker) { try { c.showPicker(); } catch (e) { /* not from a click: the list opens on the next one */ } } }
      else if (ui.selectAll || c.classList.contains("combo")) c.select(); else c.setSelectionRange(c.value.length, c.value.length);
      var td = c.parentNode; if (td.scrollIntoView) td.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    var cb = document.getElementById("combo"), cc = document.getElementById("cell");
    if (cb && cc) {   // the search-and-select list sits under its cell, inside the window (addendum-041)
      var rc = cc.parentNode.getBoundingClientRect(), below = window.innerHeight - rc.bottom > 240;
      cb.style.left = rc.left + "px"; cb.style.minWidth = Math.max(rc.width, 220) + "px";
      if (below) { cb.style.top = rc.bottom + 2 + "px"; cb.style.bottom = "auto"; } else { cb.style.bottom = window.innerHeight - rc.top + 2 + "px"; cb.style.top = "auto"; }
    }
    var ab = document.getElementById("abody"); if (ab) ab.scrollTop = ab.scrollHeight;   // a chat opens on its newest message
    var firstRow = ui.imp && ui.impFocus ? app.querySelector(".impmenu .irow") : null; if (firstRow) firstRow.focus(); ui.impFocus = false;   // the menu opens on Smart import
    ui.selectAll = false; ui.openPick = false; rendering = false;
  }
  window.addEventListener("hashchange", function () { ui.menu = false; render(); window.scrollTo(0, 0); });
  render();

  // ---------- the phone lock (addendum-032) ----------
  var out = document.getElementById("copied");
  document.getElementById("copylink").addEventListener("click", function () {
    var url = location.href.split("#")[0];
    var done = function (ok) { out.textContent = ok ? "Link copied. Open it on your computer." : url; };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(false); });
    else done(false);
  });
})();
