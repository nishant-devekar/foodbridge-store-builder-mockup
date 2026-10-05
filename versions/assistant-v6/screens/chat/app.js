/* Assistant discovery · the chat page (5 Oct 2026).

   One assistant, two places (decision 2, 5 Oct 2026):
     - its own page (chat.html), which opens on "hi": onboarding comes before there is a business to show;
     - the Control Tower (tower.html), the same chat in a panel, where it also answers about the business.
   It looks and works like WhatsApp -- the tower assistant's look (shell.css), reply buttons, a list
   menu, "reply with a number" -- and adds what onboarding needs inside a bubble: a dropdown, ticks, the
   contacts card (address book on a phone, QR on a computer), files (📎), products read back, the store.

   What it asks is onboard.js (pure, tested); what the tower says is tower-brain.js (pure, tested).
   This file only draws, listens, and runs the hooks the tree names:
     draftLookup    GET  /api/draft      (his saved store, under his mobile)
     build          POST /api/stores     (the build: Excel + setup.json + files, to the team)
     sampleExtract  POST /api/extract    { kind: "products", sample: true }
   and the files: POST /api/extract with what he sends at Products (claude/extract-products.md).
   In discovery every /api call is answered by the service worker (../discovery-bridge.js). */

(function () {
  "use strict";

  const CAT = window.FB_CATALOGUE, M = window.FB_MODEL, X = window.FB_EXPORT, IMP = window.FB_IMPORT, OB = window.FB_OUTBOX;
  const FLOW = window.ASSIST_FLOW, BRAIN = window.CTChat;
  const MODE = document.documentElement.dataset.mode === "tower" ? "tower" : "page";
  const KEY = "fb.assistant.v1", CAP = 300;
  const MASCOT = "chat/mascot/";
  /* Decision 1 (5 Oct 2026): his store goes to the team; the next actions open over the Vasu Foods demo
     -- foodbridge-mock-platform v7, as published. ?vasu= points at another copy (a local :8007). */
  const VASU = (new URLSearchParams(location.search).get("vasu") || "https://nishant-devekar.github.io/foodbridge-mock-platform/v7/").replace(/\/?$/, "/");
  const VASU_ORDER = "modules/foodbridge-sales-orders-mockup/screens/orders/screen-12-create-sales-orders.html";
  const VASU_TOWER = "screens/control-tower.html";
  const FLOW_NODES = FLOW.ORDER;

  const esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };
  const md = function (s) { return esc(s).replace(/\*([^*\n]+)\*/g, "<b>$1</b>").replace(/(^|\s)_([^_\n]+)_/g, "$1<i>$2</i>").replace(/\n/g, "<br>"); };
  const sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  const $ = function (s, r) { return (r || document).querySelector(s); };
  function clock(t) { const d = new Date(t), h = d.getHours(), m = d.getMinutes(); return (h % 12 || 12) + ":" + String(m).padStart(2, "0") + " " + (h < 12 ? "am" : "pm"); }
  function kb(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round((n || 0) / 1024)) + " KB"; }
  function b64(bytes) { let s = ""; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }

  const I = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4l1.4 1.4L7.8 11H20v2H7.8l5.6 5.6L12 20l-8-8z" fill="currentColor"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" fill="currentColor"/></svg>',
    send: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.4 20.4 20.9 12 3.4 3.6 3.4 10.1 15.9 12 3.4 13.9z" fill="currentColor"/></svg>',
    list: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h2v2H4zm4 0h12v2H8zM4 11h2v2H4zm4 0h12v2H8zm-4 5h2v2H4zm4 0h12v2H8z" fill="currentColor"/></svg>',
    reply: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" fill="currentColor"/></svg>',
    ticks: '<svg viewBox="0 0 18 18" aria-hidden="true"><path d="M17.4 4.3 16.7 3.8a.4.4 0 0 0-.5.1L9.5 12.3 7.9 10.8l-.7.8 2 2a.4.4 0 0 0 .6 0l7.6-8.7a.4.4 0 0 0 0-.6zM12.6 4.3 12 3.8a.4.4 0 0 0-.5.1L4.8 12.3 1.9 9.6a.4.4 0 0 0-.5 0l-.6.6a.4.4 0 0 0 0 .5l3.7 3.5a.4.4 0 0 0 .6 0l7.6-9.3a.4.4 0 0 0-.1-.6z" fill="currentColor"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2zm-7-2a2 2 0 0 1 4 0v2h-4z" fill="currentColor"/></svg>',
    clip: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6H10v9.5a2.5 2.5 0 0 0 5 0V5a4 4 0 0 0-8 0v12.5a5.5 5.5 0 0 0 11 0V6z" fill="currentColor"/></svg>',
    more: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill="currentColor"/></svg>',
    contacts: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 0H4v2h16zM4 24h16v-2H4zM20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 2.8a2.3 2.3 0 1 1 0 4.5 2.3 2.3 0 0 1 0-4.5zM17 17H7v-1.5c0-1.7 3.3-2.5 5-2.5s5 .8 5 2.5z" fill="currentColor"/></svg>',
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 7V3.5L18.5 9z" fill="currentColor"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    chats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.6 21l4.3-1.1A9.5 9.5 0 1 0 12 2.5zm0 17.2a7.7 7.7 0 0 1-4-1.1l-.3-.2-2.5.7.7-2.4-.2-.3A7.7 7.7 0 1 1 12 19.7z" fill="currentColor"/></svg>',
    store: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16l1 5a3 3 0 0 1-2 2.8V20H5v-8.2A3 3 0 0 1 3 9zm2 8v6h4v-4h4v4h4v-6a3 3 0 0 1-2-1 3 3 0 0 1-4 0 3 3 0 0 1-4 0 3 3 0 0 1-2 1zm-.4-6-.6 3a1 1 0 0 0 2 0V6zm3.4 0v3a1 1 0 0 0 2 0V6zm4 0v3a1 1 0 0 0 2 0V6zm4 0v3a1 1 0 0 0 2 0l-.6-3z" fill="currentColor"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7z" fill="currentColor"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="currentColor"/></svg>',
    trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6zM19 4h-3.5l-1-1h-5l-1 1H5v2h14z" fill="currentColor"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20h14v-2H5zm7-16-6 6h4v6h4v-6h4z" fill="currentColor"/></svg>',
  };

  /* ── state: the store's answers (S), where the conversation is (F), what was said (msgs) ── */
  let S, F, msgs;
  function blankF() { return { at: null, device: device(), code: code(), code2: code(), built: null, draft: null, returnTo: null, resume: false, prod: null }; }
  function load() {
    let v = null;
    try { v = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { /* a new conversation */ }
    S = M.migrate(v && v.S);
    F = Object.assign(blankF(), v && v.F, { device: device() });
    msgs = v && Array.isArray(v.msgs) ? v.msgs : [];
    M.tidy(CAT, S);
  }
  function save() {
    S.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify({ v: 1, S: S, F: F, msgs: msgs.slice(-CAP) })); } catch (e) { /* this tab only */ }
    saveDraft();
    if (owner() !== shownFor) loadBuilds();   // a mobile typed, changed, or cleared: his chats, or none
  }
  function ctx() { return { S: S, F: F, CAT: CAT, M: M, IMP: IMP, now: Date.now() }; }
  function code() { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, function (b) { return "abcdefghijkmnpqrstuvwxyz23456789"[b % 32]; }).join(""); }
  /* Phone or computer (the owner: "if the user is on the phone, it's easy to figure out"). ?device= pins it. */
  function device() {
    const pin = new URLSearchParams(location.search).get("device");
    if (pin === "phone" || pin === "desktop") return pin;
    const ua = navigator.userAgent || "";
    return /Android|iPhone|iPad|iPod|Mobile/.test(ua) || (window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 900) ? "phone" : "desktop";
  }
  /* An iPad says "MacIntel" with touch points; an Android (or a computer previewing one) never is an iPhone. */
  function iPhone() { const ua = navigator.userAgent || ""; return !/Android/.test(ua) && (/iPhone|iPad|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)); }

  /* ── the bridge (in discovery: the service worker) ── */
  function api(path, opts) { return fetch(OB.bridge() + path, opts); }
  let draftTimer = null;
  /* Every answer is also saved under his mobile, a moment after he stops. */
  /* Never under a number before FoodBridge was asked what it already holds, nor while he hasn't chosen
     between it and starting fresh (5 Oct 2026: an empty store overwrote a saved one in that gap). */
  function canSaveDraft() { return M.storeReady(S) && !F.draft && F.lookedUp === owner(); }
  function saveDraft() {
    if (!canSaveDraft()) return;
    clearTimeout(draftTimer);
    draftTimer = setTimeout(function () {
      if (!canSaveDraft()) return;   // the number changed, or a saved store turned up, while waiting
      api("/api/draft", { method: "PUT", headers: { "Content-Type": "application/json", "x-owner-mobile": M.phone10(S.store.mobile) },
        body: JSON.stringify({ v: 1, at: Date.now(), state: S, papers: S.papers.length }) }).catch(function () { /* next answer tries again */ });
    }, 800);
  }

  /* ── the DOM ───────────────────────────────────────────────────────── */
  let root, body, input, status, sendBtn, fileIn, open = false, talking = Promise.resolve();
  function build() {
    root = document.createElement("section");
    root.className = "cb-chat";
    root.hidden = MODE === "tower";
    root.setAttribute("role", MODE === "tower" ? "dialog" : "main");
    root.setAttribute("aria-label", "FoodBridge Assistant");
    root.innerHTML =
      '<header class="cb-head">' +
        '<button type="button" class="cb-hbtn cb-back" data-close aria-label="Close chat">' + I.back + "</button>" +
        '<span class="cb-ava" style="background-image:url(' + MASCOT + 'hello-128.png)" aria-hidden="true"></span>' +
        '<span class="cb-who"><b>FoodBridge Assistant</b><small class="cb-status"></small></span>' +
        '<button type="button" class="cb-hbtn cb-info" data-info aria-label="Your store setup" title="Your store setup">' + I.info + "</button>" +
        '<button type="button" class="cb-hbtn cb-more" data-menu aria-label="More">' + I.more + "</button>" +
        (MODE === "tower" ? '<button type="button" class="cb-hbtn cb-x" data-close aria-label="Close chat">' + I.close + "</button>" : "") +
      "</header>" +
      '<div class="cb-body" role="log" aria-live="polite" aria-label="Conversation"></div>' +
      '<div class="cb-hi" hidden></div>' +
      '<form class="cb-bar" autocomplete="off">' +
        '<button type="button" class="cb-clip" data-clip aria-label="Send a file">' + I.clip + "</button>" +
        '<textarea class="cb-input" rows="1" enterkeyhint="send" placeholder="Message" aria-label="Message the assistant" maxlength="2000"></textarea>' +
        '<button type="submit" class="cb-send" aria-label="Send" disabled>' + I.send + "</button>" +
      "</form>" +
      '<div class="wa-ro" role="note"></div>' +
      '<input type="file" class="cb-file" multiple hidden>' +
      '<div class="cb-dropzone">Drop files to send</div>' +
      '<div class="cb-sheetwrap" hidden></div>';
    if (MODE === "page") buildDesk(); else document.body.appendChild(root);
    body = $(".cb-body", root); input = $(".cb-input", root); status = $(".cb-status", root); sendBtn = $(".cb-send", root); fileIn = $(".cb-file", root);

    root.addEventListener("click", onClick);
    root.addEventListener("change", onChange);
    input.addEventListener("input", function () { sendBtn.disabled = !input.value.trim(); grow(); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); submit(); } });
    $(".cb-bar", root).addEventListener("submit", function (e) { e.preventDefault(); submit(); });
    fileIn.addEventListener("change", function () { const fs = Array.from(fileIn.files || []); fileIn.value = ""; if (fs.length) sendFiles(fs); });
    /* Files dropped on the chat, or pasted into it, are sent as if with 📎. */
    let depth = 0;
    root.addEventListener("dragenter", function (e) { if (hasFiles(e)) { depth++; root.classList.add("is-dragging"); } });
    root.addEventListener("dragleave", function () { if (--depth <= 0) { depth = 0; root.classList.remove("is-dragging"); } });
    root.addEventListener("dragover", function (e) { if (hasFiles(e)) e.preventDefault(); });
    root.addEventListener("drop", function (e) { if (!hasFiles(e)) return; e.preventDefault(); depth = 0; root.classList.remove("is-dragging"); sendFiles(Array.from(e.dataTransfer.files)); });
    input.addEventListener("paste", function (e) { const fs = Array.from((e.clipboardData && e.clipboardData.files) || []); if (fs.length) { e.preventDefault(); sendFiles(fs); } });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape" || !open) return;
      const w = $(".cb-sheetwrap", root);
      if (!w.hidden) { e.preventDefault(); closeSheet(); } else if (MODE === "tower") { e.preventDefault(); closeChat(); }
    }, true);
    document.addEventListener("visibilitychange", poll);
  }
  function hasFiles(e) { return e.dataTransfer && Array.from(e.dataTransfer.types || []).indexOf("Files") >= 0; }
  function grow() { input.style.height = "46px"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; }

  function openChat() {
    if (open) return;
    open = true;
    root.hidden = false;
    document.documentElement.classList.add("cb-open");
    render();
    if (window.matchMedia("(min-width: 768px)").matches) input.focus({ preventScroll: true });
    if (MODE === "tower" && !msgs.length) say(towerWelcome());
    poll();
  }
  function closeChat() {
    if (MODE !== "tower" || !open) return;
    open = false; closeSheet(); root.hidden = true;
    document.documentElement.classList.remove("cb-open");
    const b = document.getElementById("as-open"); if (b) b.focus({ preventScroll: true });
  }

  /* ── talking ───────────────────────────────────────────────────────── */
  function mine(m) { if (!m) return; msgs.push(Object.assign({ from: "me", at: Date.now(), read: false }, typeof m === "string" ? { kind: "text", text: m } : m)); save(); render(); }
  function say(list) {
    list = (list || []).filter(Boolean);
    talking = talking.then(async function () {
      msgs.forEach(function (m) { if (m.from === "me") m.read = true; });
      for (let i = 0; i < list.length; i++) {
        const m = list[i];
        if (m.kind === "text" && !m.text && !m.list && !m.widget) continue;
        typing(true);
        await sleep(i ? 300 : 420 + Math.min(450, (m.text || "").length * 2));
        typing(false);
        msgs.push(Object.assign({ from: "bot", at: Date.now() }, m));
        save(); render();
      }
      composeFor();
    });
    return talking;
  }
  function typing(on) {
    isTyping = on;
    if (VIEW === "assistant") status.textContent = on ? "typing…" : "";
    renderSide();
    const t = $(".cb-typing", body);
    if (on && !t) { body.insertAdjacentHTML("beforeend", '<div class="cb-row in"><div class="cb-bub cb-typing" aria-label="typing"><i></i><i></i><i></i></div></div>'); stick(); }
    if (!on && t) t.parentNode.remove();
  }
  /* The message box asks for what the question wants: a name, a mobile, a GST number. */
  function composeFor() {
    const last = msgs.slice().reverse().find(function (m) { return m.from === "bot" && m.compose; });
    const lastBot = msgs.slice().reverse().find(function (m) { return m.from === "bot"; });
    const c = last && last === lastBot ? last.compose : null;
    input.placeholder = c ? c.hint : "Message";
    input.setAttribute("inputmode", c && c.type === "tel" ? "tel" : "text");
    input.setAttribute("autocapitalize", c && c.type === "upper" ? "characters" : "sentences");
    hiChips();
  }
  /* The page opens on "hi" (the owner: "someone says hi, give an option of onboarding"). */
  function hiChips() {
    const w = $(".cb-hi", root);
    const show = MODE === "page" && !msgs.length;
    w.hidden = !show;
    w.innerHTML = show ? '<button type="button" data-say="Hi">👋 Hi</button><button type="button" data-say="Namaste">🙏 Namaste</button>' : "";
  }

  /* ── what he types ─────────────────────────────────────────────────── */
  function submit() {
    const t = input.value.trim();
    if (!t) return;
    input.value = ""; sendBtn.disabled = true; grow();
    mine(t);
    route({ text: t });
  }
  const W_SETUP = /\b(set ?up|setup|onboard|onboarding|start|shuru|register|new store|create (my )?store|store banao|dukaan|dukan)\b/i;
  const W_HELP = /\b(how|help|madad|kaise|what can you do)\b/i;
  const W_MENU = /^(menu|main menu|0|options)$/i;
  const W_HI = /^(hi+|hello|hey|hii+|namaste|namaskar|ram ram|good (morning|evening|afternoon)|sat sri akal)\b/i;

  function inFlow() { return F.at && F.at !== "done" && FLOW_NODES.indexOf(F.at) >= 0; }
  function routeText(input) {
    const t = input.text != null ? String(input.text).trim() : null;
    if (t != null && W_MENU.test(t)) return say([mainMenu()]);
    if (inFlow()) {
      /* "hi" in the middle of setting up: where we were. */
      if (t != null && W_HI.test(t) && t.split(/\s+/).length <= 2) return say(FLOW.ask(ctx(), F.at));
      return answer(input);
    }
    if (t == null) return;
    if (W_SETUP.test(t)) return startSetup();
    if (MODE === "tower") { const r = BRAIN.reply({ text: t, quiet: true }, towerCtx()); if (r) return say(r); }
    if (W_HI.test(t)) return say(welcome());
    if (W_HELP.test(t)) return say(help());
    say([{ kind: "sticker", image: "shrug.png", alt: "Not sure" }, Object.assign(mainMenu(), { text: "Sorry, I didn't get that.\n" + mainMenu().text })]);
  }

  /* One answer to the question in hand → the tree → what it says, and any hook it names. */
  async function answer(inp) {
    const c = ctx();
    const r = FLOW.step(c, inp);
    save();
    if (r.open) { await say(r.msgs); return openSheetFor(r.open); }
    if (r.hook) {
      await say(r.msgs);
      try { await HOOKS[r.hook](); }
      catch (e) { console.warn(r.hook, e); say([FLOW.txt("⚠️ That didn't work. Try again.")]); }
      return;
    }
    await say(r.msgs);
    poll();
  }

  const HOOKS = {
    draftLookup: async function () {
      typing(true);
      let d = null, known = false;
      try {
        const res = await api("/api/draft", { headers: { "x-owner-mobile": M.phone10(S.store.mobile) } });
        known = res.ok || res.status === 404;   // 404: nothing saved under it — also an answer
        if (res.ok) {
          const j = await res.json(), st = j && j.state && M.migrate(j.state);
          const answers = st ? M.progress(CAT, st).rules.n : 0;
          if (st && (st.store.name || st.order.length || Object.keys(st.items).length || answers || st.store.type)) d = { state: j.state, name: st.store.name || "", people: st.order.length, products: Object.keys(st.items).length, answers: answers };
        }
      } catch (e) { /* FoodBridge not reached: start fresh */ }
      typing(false);
      F.draft = d;
      /* asked and answered: saving may follow once he has chosen (the sync question clears F.draft). Unreachable:
         we don't know what is saved under it, so nothing is saved under it until it can be asked again. */
      F.lookedUp = known ? owner() : null;
      const out = FLOW.resume(ctx(), "draftLookup");
      save();
      await say(out);
      poll();
    },
    build: async function () {
      typing(true);
      const b = await OB.make(CAT, X, S);
      S.lastBuild = { id: b.id, at: b.at };
      let sent = false;
      try { sent = await OB.deliver(X, b); } catch (e) { sent = false; }
      typing(false);
      const out = FLOW.resume(ctx(), "build", { id: b.id, at: b.at, sent: sent });
      loadBuilds();
      save();
      await say(out);
    },
    sampleExtract: async function () {
      typing(true);
      const res = await api("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "products", sample: true }) });
      const j = await res.json();
      typing(false);
      if (!res.ok) throw new Error(j.error || res.status);
      await answer({ extract: j });
    },
  };
  function owner() { return S ? FLOW.ownerOf(S, M) : ""; }

  /* ── the options around the tree ───────────────────────────────────── */
  function started() { return !!(S.store.name || F.at); }
  function welcome() {
    if (F.at === "done") return [FLOW.txt("Namaste 🙏 Your store is with our team. We'll send you a login link.")];
    if (started() && inFlow()) return [FLOW.txt("Welcome back 🙏", { buttons: [{ id: "intent:carry", label: "Continue" }, { id: "intent:restart", label: "Start again" }] })];
    return [{ kind: "image", image: "present.png", alt: "The FoodBridge Assistant", text: "Namaste 🙏 I'm your *FoodBridge Assistant*." },
      FLOW.txt("What would you like to do?", { buttons: [{ id: "intent:setup", label: "Set up my store" }] })];
  }
  function help() {
    return [FLOW.txt("I ask a few questions and set up your store. Tap, type, or send files with 📎.", { buttons: [{ id: "intent:setup", label: "Set up my store" }] })];
  }
  function mainMenu() {
    let rows;
    if (F.at === "done") rows = [];
    else if (inFlow()) rows = [{ id: "intent:carry", label: "Continue" }, { id: "intent:restart", label: "Start again" }];
    else rows = [{ id: "intent:setup", label: "Set up my store" }];
    if (MODE === "tower") rows = BRAIN.MENU.map(function (m) { return { id: "intent:" + m.id, label: m.label }; }).concat(rows);
    rows.forEach(function (r, i) { r.n = i + 1; });
    if (!rows.length) return FLOW.txt("Your store is with our team. We'll send you a login link.");
    return FLOW.txt("Reply with a number:\n" + rows.map(function (r) { return r.n + "  " + r.label; }).join("\n"),
      { list: { button: "Menu", title: "Menu", rows: rows }, numbered: rows.map(function (r) { return { id: r.id, label: r.label }; }) });
  }
  function startSetup() {
    if (F.at === "done") return say([FLOW.txt("Your store is already with our team. We'll send you a login link.")]);
    if (inFlow()) return say(FLOW.ask(ctx(), F.at));
    F.at = null; save();
    return say(FLOW.ask(ctx(), "mobile"));
  }
  function restart() {
    const keep = msgs.slice(-1);
    S = M.blank(); F = blankF(); msgs = keep;
    save();
    say([FLOW.txt("Cleared.")].concat(FLOW.ask(ctx(), "mobile")));
  }
  /* The tower's own answers (tower mode): the Vasu Foods snapshot (seed-data/tower-snapshot.json). */
  let SNAP = null;
  function towerCtx() { return SNAP ? { model: SNAP.model, timeline: SNAP.timeline } : { model: { levers: [] }, timeline: { days: [] } }; }
  function towerWelcome() {
    const w = BRAIN.welcome();
    w[1].buttons = [{ id: "intent:needs", label: "What needs me today" }, { id: "intent:setup", label: "Set up a new store" }];
    w[1].text = w[1].text.replace(/\n8  Today's news$/, "\n8  Today's news\n9  Set up a new store");
    w[1].list = mainMenu().list;
    return w;
  }

  function go(url) {
    const frame = document.getElementById("tower-frame");
    if (MODE === "tower" && frame && url.indexOf(VASU_TOWER) >= 0) { frame.src = url; setTimeout(closeChat, 900); return; }
    window.open(url, "_blank", "noopener");
  }

  /* ── taps ──────────────────────────────────────────────────────────── */
  function onClick(e) {
    const el = e.target.closest("[data-close],[data-info],[data-file],[data-menu],[data-clip],[data-btn],[data-list],[data-row],[data-sheet-close],[data-say],[data-act]");
    if (!el) { if (e.target.classList.contains("cb-sheetwrap")) closeSheet(); return; }
    if (el.closest(".cb-row.is-past")) return;
    if (el.hasAttribute("data-file")) return downloadBuildFile(el.dataset.id, el.dataset.file);
    if (el.hasAttribute("data-close")) return closeChat();
    if (el.hasAttribute("data-info")) return toggleInfo();
    if (el.hasAttribute("data-menu")) return openMoreSheet();
    if (el.hasAttribute("data-clip")) return fileIn.click();
    if (el.hasAttribute("data-say")) { mine(el.dataset.say); return route({ text: el.dataset.say }); }
    if (el.hasAttribute("data-sheet-close")) return closeSheet();
    if (el.hasAttribute("data-btn")) return press(el.dataset.btn, el.dataset.label);
    if (el.hasAttribute("data-list")) return openListSheet(+el.dataset.list);
    if (el.hasAttribute("data-row")) { closeSheet(); return press(el.dataset.row, el.dataset.label); }
    if (el.hasAttribute("data-act")) return ACT[el.dataset.act] && ACT[el.dataset.act](el, e);
  }
  function onChange(e) {
    const t = e.target;
    if (t.matches(".aw-tick input")) { const w = t.closest(".aw"); $(".aw-go", w).disabled = !w.querySelector("input:checked"); }
    if (t.matches(".aw select")) { const w = t.closest(".aw"); $(".aw-go", w).disabled = !t.value; }
    if (t.matches(".pf input[type=checkbox]")) { t.closest("tr").classList.toggle("is-off", !t.checked); countProducts(); }
    if (t.matches(".pk input[type=checkbox]")) countPick();
  }
  function press(id, label) {
    if (id === "menu") { mine(label || "Main menu"); return say([mainMenu()]); }
    if (id.indexOf("ans:") === 0) {
      if (F.at === "done" || !inFlow()) {   // an answer to a tree that has moved on: only Change still applies
        if (id.indexOf("ans:edit:") === 0) { mine(label); return answer({ value: id.slice(4) }); }
        return;
      }
      mine(label);
      return answer({ value: id.slice(4) });
    }
    if (id.indexOf("intent:") === 0) {
      const it = id.slice(7);
      mine(label);
      if (it === "setup") return startSetup();
      if (it === "carry") return say(FLOW.ask(ctx(), F.at && F.at !== "done" ? F.at : "mobile"));
      if (it === "restart") return restart();
      if (it === "help") return say(help());
      if (MODE === "tower") { const r = BRAIN.reply({ intent: it }, towerCtx()); if (r) return say(r); }
      return say([mainMenu()]);
    }
    if (id.indexOf("open:") === 0 || id.indexOf("act:") === 0) {   // the tower's own buttons: open the lever on the board
      mine(label);
      const lv = id.split(":")[1];
      go(VASU + VASU_TOWER + (lv === "timeline" ? "?view=updates" : "?lever=" + lv));
      return say([FLOW.txt(id.indexOf("act:") === 0 ? "Here it is, prepared for you on the board. Check it and confirm — nothing goes out until you do." : "Opening it on the board.")]);
    }
  }

  /* Widget actions. */
  const ACT = {
    select: function (el) { const w = el.closest(".aw"), s = $("select", w); if (!s.value) return; mine(s.options[s.selectedIndex].text); answer({ value: s.value }); },
    multi: function (el) {
      const w = el.closest(".aw"), on = Array.from(w.querySelectorAll("input:checked"));
      if (!on.length) return;
      mine(on.map(function (x) { return x.dataset.label; }).join(", "));
      answer({ values: on.map(function (x) { return x.value; }) });
    },
    pickContacts: async function () {
      let list = null;
      try {
        if (navigator.contacts && navigator.contacts.select) {
          const got = await navigator.contacts.select(["name", "tel"], { multiple: true });
          list = got.map(function (x) { return { name: (x.name || [])[0] || "", phone: IMP.pickPhone(x.tel || []) }; });
        } else if (!iPhone()) list = await demoContacts();
      } catch (e) { list = null; }
      if (!list || !list.length) return say([FLOW.txt("Nothing picked.")]);
      mine({ kind: "text", text: "📇 " + list.length + " contacts" });
      answer({ contacts: list, src: "contact" });
    },
    iosHelp: function (el) { const h = el.closest(".aw").querySelector(".aw-help"); if (h) h.hidden = !h.hidden; },
    phonePage: function (el, e) {
      e.preventDefault();
      const w = window.open(el.getAttribute("href"), "as-phone", "popup,width=420,height=820,left=" + Math.max(0, screen.availWidth - 440) + ",top=40");
      if (!w) location.href = el.getAttribute("href");
    },
    attach: function () { fileIn.click(); },
    sheetPeople: function () { openSheetFor("people"); },
    savePeople: function () {
      const out = {}; let n = 0;
      $(".cb-sheet", root).querySelectorAll(".sf-row").forEach(function (r) { const v = r.querySelector("input:checked"); if (v) { out[r.dataset.id] = v.value; n++; } });
      closeSheet();
      mine("Who is who: " + n);
      answer({ people: out });
    },
    saveProducts: function () {
      const rows = [];
      $(".cb-sheet", root).querySelectorAll("tr[data-i]").forEach(function (tr) {
        const p = Object.assign({}, F.prod.products[+tr.dataset.i]);
        p.keep = tr.querySelector("input[type=checkbox]").checked;
        const val = function (k) { const x = tr.querySelector('[data-k="' + k + '"]'); return x ? x.value.trim() : ""; };
        p.name = val("name") || p.name; p.pack = val("pack");
        const num = function (k) { const v = val(k); return v === "" ? null : Number(v); };
        p.mrp = num("mrp"); p.sell = num("sell");
        rows.push(p);
      });
      closeSheet();
      const n = rows.filter(function (r) { return r.keep; }).length;
      mine("Add " + n + " products");
      answer({ products: { rows: rows } });
    },
    savePick: function () {
      const ids = Array.from($(".cb-sheet", root).querySelectorAll(".pk input:checked")).map(function (x) { return x.value; });
      if (!ids.length) return;
      closeSheet();
      mine(ids.length + " customers");
      answer({ pick: ids });
    },
    more: function (el) { closeSheet(); const k = el.dataset.k; if (k === "feedback") return window.FBFeedback.open(); if (k === "restart") { mine("Start again"); restart(); } else if (k === "sent") {
      /* the desktop has the Team chat; the phone and the tower panel open the page, for his mobile only */
      if (shell && window.matchMedia("(min-width: 900px)").matches && (builds.length || waiting.length)) setView("team");
      else location.href = "sent.html?mobile=" + encodeURIComponent(owner());
    } },
  };
  async function demoContacts() {
    const r = await fetch("../seed-data/seed.json").then(function (x) { return x.json(); }).catch(function () { return null; });
    return (r && r.demoContacts || []).map(function (c) { return { name: c.name, phone: c.phone }; });
  }

  /* ── files (📎, drop, paste, the phone's photos) ───────────────────── */
  async function sendFiles(files) {
    files.forEach(function (f) { mine({ kind: "file", name: f.name, size: f.size }); });
    const at = F.at;
    if (at === "contacts") {
      const list = [];
      for (const f of files) {
        const p = await OB.take(X, M, null, S, f, "people");   // kept as it came, for the team
        if (p && p.error) continue;
        try { const r = await IMP.readFile(f.name, new Uint8Array(await f.arrayBuffer())); (r.people || []).forEach(function (x) { list.push(x); }); } catch (e) { /* not a list */ }
      }
      save();
      if (!list.length) return say([FLOW.txt("No names and numbers found. Kept for our team.")]);
      return answer({ contacts: list, src: "file" });
    }
    if (at === "products") {
      typing(true);
      const enc = [];
      for (const f of files) {
        const p = await OB.take(X, M, null, S, f, "items");
        if (p && p.error) continue;
        enc.push({ name: f.name, type: f.type || "", data: b64(new Uint8Array(await f.arrayBuffer())) });
      }
      save();
      let j = null;
      try {
        const res = await api("/api/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "products", files: enc }) });
        j = await res.json();
        if (!res.ok) throw new Error(j.error || res.status);
      } catch (e) { typing(false); return say([FLOW.txt("⚠️ Couldn't read it. Kept for our team.")]); }
      typing(false);
      return answer({ extract: j });
    }
    /* Anywhere else: papers for the team. */
    const papers = [];
    for (const f of files) { const p = await OB.take(X, M, null, S, f, "finish"); if (p && !p.error) papers.push(p); }
    save();
    if (at === "files") return answer({ papers: papers });
    say([FLOW.txt("📎 Kept for our team.")]);
  }

  /* ── the QR hand-off (computer ↔ phone): contacts at Contacts, photos at Files ── */
  let pollT = null, polling = false;
  function poll() {
    const want = open && !document.hidden && F.device === "desktop" && (F.at === "contacts" || F.at === "files");
    if (want && !pollT) { pollT = setInterval(tick, 3000); tick(); }
    if (!want && pollT) { clearInterval(pollT); pollT = null; }
  }
  async function tick() {
    if (polling) return;
    polling = true;
    try {
      const c = F.at === "files" ? F.code2 : F.code;
      let more = true;
      while (more) {
        const r = await api("/api/handoff?code=" + c, { cache: "no-store" });
        if (!r.ok) break;
        const j = await r.json();
        more = !!j.more;
        if (j.opened) { const st = $(".ho-st", body); if (st) st.innerHTML = '<span class="dot"></span>Phone connected'; }
        if (j.people && j.people.length && F.at === "contacts") { mine({ kind: "text", text: "📇 " + j.people.length + " contacts, from my phone" }); await answer({ contacts: j.people, src: "contact" }); }
        if (j.files && j.files.length) {
          const fs = j.files.map(function (f) { const bin = atob(f.data || ""), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new File([a], f.name || "photo.jpg", { type: f.type || "image/jpeg" }); });
          await sendFiles(fs);
        }
      }
    } catch (e) { /* the next tick tries again */ }
    polling = false;
    poll();
  }
  function phoneUrl(photos) { return new URL("store/send/#c=" + (photos ? F.code2 + "&m=photos" : F.code), location.href).href; }
  function qrSvg(text) {
    if (!window.FB_QR) return "";
    const q = window.FB_QR.create(text, { errorCorrectionLevel: "Q" }).modules, n = q.size;
    let d = "";
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.data[y * n + x]) d += "M" + x + " " + y + "h1v1h-1z";
    const m = Math.round(n * 0.22), o = (n - m) / 2;
    return '<svg viewBox="-2 -2 ' + (n + 4) + " " + (n + 4) + '" shape-rendering="crispEdges"><path d="' + d + '" fill="#10281b"/>' +
      '<rect x="' + (o - 0.6) + '" y="' + (o - 0.6) + '" width="' + (m + 1.2) + '" height="' + (m + 1.2) + '" rx="1.4" fill="#fff"/>' +
      '<image href="store/foodbridge-mark-green.png" x="' + o + '" y="' + o + '" width="' + m + '" height="' + m + '"/></svg>';
  }

  /* ── drawing ───────────────────────────────────────────────────────── */
  function widgetHTML(w, i) {
    if (!w) return "";
    if (w.type === "select") {
      return '<div class="aw is-form"><div class="aw-row"><select aria-label="' + esc(w.label) + '"><option value="">' + esc(w.ph || "Choose") + "</option>" +
        w.options.map(function (o) { return '<option value="' + esc(o.v) + '">' + esc(o.label) + "</option>"; }).join("") +
        '</select><button type="button" class="aw-go" data-act="select" disabled>Send</button></div></div>';
    }
    if (w.type === "multi") {
      return '<div class="aw is-form"><div class="aw-ticks">' + w.options.map(function (o) {
        return '<label class="aw-tick"><input type="checkbox" value="' + esc(o.v) + '" data-label="' + esc(o.label) + '"' + (o.on ? " checked" : "") + ">" + esc(o.label) + "</label>";
      }).join("") + '</div><button type="button" class="aw-go" data-act="multi"' + (w.options.some(function (o) { return o.on; }) ? "" : " disabled") + ">Done</button></div>";
    }
    if (w.type === "contacts") {
      if (w.device === "phone") {
        const ios = iPhone() && !(navigator.contacts && navigator.contacts.select);
        const stand = !iPhone() && !(navigator.contacts && navigator.contacts.select);
        return '<div class="aw"><div class="aw-pick"><button type="button" class="aw-big" data-act="pickContacts">' + I.contacts + "Choose from contacts</button>" +
          (ios ? '<button type="button" class="aw-link" data-act="iosHelp">iPhone? Turn on one setting first</button>' +
            '<div class="aw-help" hidden><ol><li>Settings › Apps › Safari › Advanced › Feature Flags</li><li>Turn on <b>Contact Picker API</b></li></ol></div>' : "") +
          (stand ? '<span class="aw-disc">Demo: sample contacts</span>' : "") + "</div></div>";
      }
      const url = phoneUrl(false);
      return '<div class="aw"><div class="aw-ho"><div class="ho-qr" aria-hidden="true" data-url="' + esc(url) + '">' + qrSvg(url) + "</div>" +
        '<div><p class="ho-1">Scan with your phone\'s camera.</p>' +
        '<div class="ho-st"><span class="dot"></span>Waiting for your phone…</div>' +
        '<a class="aw-link" data-act="phonePage" href="' + esc(new URL("store/send/?demoPicker#c=" + F.code, location.href).href) + '">Demo: try the phone side here ↗</a></div></div></div>';
    }
    if (w.type === "files") {
      const qr = w.qr ? '<div class="aw-qrline"><div class="ho-qr">' + qrSvg(phoneUrl(true)) + '</div><span>Or scan with your phone.<br>' +
        '<a class="aw-link" data-act="phonePage" href="' + esc(new URL("store/send/#c=" + F.code2 + "&m=photos", location.href).href) + '">Demo: try the phone side here ↗</a></span></div>' : "";
      return '<div class="aw"><button type="button" class="aw-drop" data-act="attach">' + I.up + "<span><b>Send a file</b></span></button>" + qr + "</div>";
    }
    if (w.type === "products") {
      const rows = w.rows || [], show = rows.slice(0, 8);
      return '<div class="aw"><table class="aw-prod"><thead><tr><th>Product</th><th>Pack</th><th class="n">MRP</th><th class="n">Rate</th></tr></thead><tbody>' +
        show.map(function (p) {
          return "<tr><td>" + esc(p.name) + (p.match ? '<span class="m">✓ ' + esc(p.match.name) + "</span>" : '<span class="m is-new">New</span>') + "</td><td>" + esc(p.pack || "") + '</td><td class="n">' +
            (p.mrp != null ? "₹" + p.mrp : "—") + '</td><td class="n">' + (p.sell != null ? "₹" + p.sell : '<span class="no">—</span>') + "</td></tr>";
        }).join("") + "</tbody></table>" + (rows.length > show.length ? '<div class="aw-more">…and ' + (rows.length - show.length) + " more</div>" : "") + "</div>";
    }
    if (w.type === "summary") {
      const f = w.facts;
      const cell = function (n, l) { return "<div><b>" + n + "</b><small>" + esc(l) + "</small></div>"; };
      return '<div class="aw"><div class="aw-store"><div class="st-head"><img src="store/foodbridge-mark-green.png" alt=""><span><b>' + esc(f.name || "Your store") + "</b><small>" +
        esc([f.type, f.mobile].filter(Boolean).join(" · ")) + '</small></span></div><div class="st-grid">' +
        cell(f.products, "products") + cell(f.customers, "customers") + cell(f.suppliers, "suppliers") +
        cell(f.staff, "staff") + cell(f.answered + "/" + f.of, "daily work") + cell(f.files, "files") + "</div></div></div>";
    }
    if (w.type === "people") return '<div class="aw"><button type="button" class="aw-go is-quiet" data-act="sheetPeople">See everyone (' + w.rows.length + ")</button></div>";
    return "";
  }

  function render() {
    if (!open) return;
    if (VIEW !== "assistant") { renderSide(); return renderOther(); }
    root.classList.remove("is-readonly");
    if (shell) head("mascot", "FoodBridge Assistant", isTyping ? "typing…" : "");
    seen = msgs.length;
    renderSide(); renderInfo();
    let html = '<div class="cb-chip">Today</div>';
    let lastMe = -1;
    msgs.forEach(function (m, i) { if (m.from === "me") lastMe = i; });
    msgs.forEach(function (m, i) {
      const prev = msgs[i - 1];
      const tail = !prev || prev.from !== m.from || prev.kind === "sticker";
      const side = m.from === "me" ? "out" : "in";
      const past = m.from === "bot" && i < lastMe ? " is-past" : "";
      const t = '<span class="cb-time">' + clock(m.at) + (m.from === "me" ? '<span class="cb-ticks' + (m.read ? " is-read" : "") + '">' + I.ticks + "</span>" : "") + "</span>";
      if (m.kind === "sticker") {
        html += '<div class="cb-row in cb-tail' + past + '"><div class="cb-stk"><img src="' + MASCOT + esc(m.image) + '" alt="' + esc(m.alt || "") + '" width="120" height="120">' + t + "</div></div>";
        return;
      }
      let inner = "";
      if (m.kind === "image") inner += '<span class="cb-img"><img src="' + MASCOT + esc(m.image) + '" alt="' + esc(m.alt || "") + '" width="240" height="240"></span>';
      if (m.kind === "file") inner += '<span class="cb-txt" style="display:flex;gap:8px;align-items:center"><span style="width:28px;height:28px;color:#54656F">' + I.doc + "</span><span><b>" + esc(m.name) + "</b><br><small style=\"color:#667781\">" + kb(m.size) + "</small></span></span>";
      if (m.text) inner += '<span class="cb-txt">' + (m.quote ? '<span class="cb-quote">' + md(m.text) + "</span>" : md(m.text)) + "</span>";
      inner += t;
      inner += widgetHTML(m.widget, i);
      if (m.list) inner += '<button type="button" class="cb-listbtn" data-list="' + i + '">' + I.list + esc(m.list.button) + "</button>";
      const btns = m.buttons && m.buttons.length ? '<div class="cb-btns">' + m.buttons.map(function (b) {
        return '<button type="button" class="cb-btn" data-btn="' + esc(b.id) + '" data-label="' + esc(b.label) + '" aria-label="' + esc(b.label) + '">' + I.reply + "<span>" + esc(b.label) + "</span></button>";
      }).join("") + "</div>" : "";
      const wide = m.widget && /products|summary|contacts/.test(m.widget.type) ? " is-wide" : "";
      html += '<div class="cb-row ' + side + (tail ? " cb-tail" : "") + past + '"><div class="cb-grp' + wide + '"><div class="cb-bub' + (m.kind === "image" ? " is-img" : "") + '">' + inner + "</div>" + btns + "</div></div>";
    });
    body.innerHTML = html;
    stick();
  }
  function stick() { body.scrollTop = body.scrollHeight; }

  /* "reply with a number" for the menu: a number typed while the last message is a numbered menu. */
  function route(inp) {
    const last = msgs.slice().reverse().find(function (m) { return m.from === "bot"; });
    const t = inp.text != null ? String(inp.text).trim() : "";
    if (last && last.numbered && /^\d+$/.test(t) && !inFlow()) {
      const r = last.numbered[Number(t) - 1];
      if (r) return press(r.id, null) || undefined;
    }
    if (MODE === "tower" && !inFlow() && /^\d+$/.test(t) && t === "9") return startSetup();
    return routeText(inp);
  }

  /* ── sheets ────────────────────────────────────────────────────────── */
  function sheet(title, html, cls) {
    const w = $(".cb-sheetwrap", root);
    w.innerHTML = '<div class="cb-sheet' + (cls ? " " + cls : "") + '" role="dialog" aria-label="' + esc(title) + '"><div class="cb-sh"><button type="button" class="cb-hbtn" data-sheet-close aria-label="Close">' + I.close + "</button><b>" + esc(title) + "</b></div>" + html + "</div>";
    w.hidden = false;
  }
  function closeSheet() { const w = root && $(".cb-sheetwrap", root); if (w) { w.hidden = true; w.innerHTML = ""; } }
  function openListSheet(i) {
    const m = msgs[i]; if (!m || !m.list) return;
    sheet(m.list.title, '<div class="cb-rows">' + m.list.rows.map(function (r) {
      return '<button type="button" class="cb-rowbtn" data-row="' + esc(r.id) + '" data-label="' + esc(r.label) + '"><span class="cb-rn">' + r.n + '</span><span class="cb-rt"><b>' + esc(r.label) + "</b>" +
        (r.desc ? "<small>" + esc(r.desc) + "</small>" : "") + '</span><i class="cb-radio" aria-hidden="true"></i></button>';
    }).join("") + "</div>");
  }
  function openMoreSheet() {
    const rows = (builds.length || waiting.length ? [["sent", "Sent to FoodBridge"]] : [])
      .concat([["restart", "Start again"]])
      .concat(window.FBFeedback ? [["feedback", "Give feedback"]] : []);
    sheet("More", '<div class="cb-rows">' + rows.map(function (r) {
      return '<button type="button" class="cb-rowbtn" data-act="more" data-k="' + r[0] + '"><span class="cb-rt"><b>' + esc(r[1]) + "</b></span></button>";
    }).join("") + "</div>");
  }
  function avatar(n) { return String(n || "?").trim().split(/\s+/).slice(0, 2).map(function (w) { return w[0]; }).join("").toUpperCase(); }
  function openSheetFor(kind) {
    if (kind === "people") {
      const rows = S.order.map(function (id) { return S.people[id]; }).filter(Boolean);
      sheet("Who is who", '<div class="cb-rows">' + rows.map(function (p) {
        const cur = p.type || M.guessType(p.name) || "";
        return '<div class="sf-row" data-id="' + esc(p.id) + '"><span class="sf-av">' + esc(avatar(p.name)) + '</span><span class="sf-who"><b>' + esc(p.name) + "</b><small>" + esc(M.phoneShow(p.phone)) + "</small></span>" +
          '<span class="sf-seg" role="radiogroup" aria-label="' + esc(p.name) + '">' + ["shop", "supplier", "staff", "none"].map(function (k) {
            return '<label><input type="radio" name="t-' + esc(p.id) + '" value="' + k + '"' + (cur === k ? " checked" : "") + ">" + FLOW.KIND[k] + "</label>";
          }).join("") + "</span></div>";
      }).join("") + '</div><div class="sf-foot"><span class="sf-n">' + rows.length + ' contacts</span><button type="button" data-act="savePeople">Save</button></div>', "is-form");
    }
    if (kind === "products" && F.prod) {
      sheet("Products", '<div class="cb-rows pf-wrap"><table class="pf"><thead><tr><th></th><th>Product</th><th>Pack</th><th>MRP ₹</th><th>Rate ₹</th></tr></thead><tbody>' +
        F.prod.products.map(function (p, i) {
          return '<tr data-i="' + i + '"><td><input type="checkbox" checked aria-label="Keep"></td><td><input type="text" data-k="name" value="' + esc(p.name) + '">' +
            (p.match ? '<span class="m">✓ ' + esc(p.match.name) + "</span>" : '<span class="m is-new">New</span>') + "</td>" +
            '<td><input type="text" data-k="pack" value="' + esc(p.pack || "") + '" style="width:90px"></td>' +
            '<td><input type="number" step="0.01" min="0" data-k="mrp" value="' + (p.mrp != null ? p.mrp : "") + '"></td>' +
            '<td><input type="number" step="0.01" min="0" data-k="sell" value="' + (p.sell != null ? p.sell : "") + '"></td></tr>';
        }).join("") + '</tbody></table></div><div class="sf-foot"><span class="sf-n" id="pf-n"></span><button type="button" data-act="saveProducts">Add</button></div>', "is-form");
      countProducts();
    }
    if (kind === "pick") {
      const shops = M.peopleOf(S, "shop");
      sheet("Pick customers", '<div class="cb-rows">' + shops.map(function (p) {
        return '<label class="sf-row pk"><span class="sf-av">' + esc(avatar(p.name)) + '</span><span class="sf-who"><b>' + esc(p.name) + "</b><small>" + esc(M.phoneShow(p.phone)) + '</small></span><input type="checkbox" value="' + esc(p.id) + '" style="width:20px;height:20px;accent-color:#00A884"></label>';
      }).join("") + '</div><div class="sf-foot"><span class="sf-n" id="pk-n">0 picked</span><button type="button" data-act="savePick">Done</button></div>', "is-form");
    }
  }
  function countProducts() { const s = $(".cb-sheet", root), n = s ? s.querySelectorAll("tr[data-i] input[type=checkbox]:checked").length : 0; const el = document.getElementById("pf-n"); if (el) el.textContent = n + " to add"; }
  function countPick() { const s = $(".cb-sheet", root), n = s ? s.querySelectorAll(".pk input:checked").length : 0; const el = document.getElementById("pk-n"); if (el) el.textContent = n + " picked"; }

  /* ── the desktop as WhatsApp Web (assistant-v2, owner 5 Oct 2026: "make it look like WhatsApp Web
     desktop … enterprise grade"). desk.css shows it at 900 px and wider; narrower, only the chat shows.
     Two chats, both real: the Assistant; the FoodBridge team's inbox (what reached FoodBridge from this browser,
     read-only). The info drawer is the store's setup. */
  let VIEW = "assistant", seen = 0, isTyping = false, infoOpen = false, builds = [], waiting = [], shownFor = null, shell = null;
  function buildDesk() {
    document.documentElement.classList.add("has-wa");
    shell = document.createElement("div");
    shell.className = "wa";
    /* Only what does something (owner, 5 Oct 2026: "don't keep things just for the sake of UI"): no rail, search,
       filters or footer — three chats can't need them, and the menu and setup are in the chat header (⋯, ⓘ). */
    shell.innerHTML =
      '<aside class="wa-side" aria-label="Chats">' +
        '<header class="wa-sh"><h1><img src="store/foodbridge-mark-green.png" alt="">FoodBridge</h1></header>' +
        '<div class="wa-list" id="wa-list" role="listbox"></div>' +
        (window.FBFeedback ? '<button type="button" class="wa-fb" data-feedback>' + I.chats + "Give feedback</button>" : "") +
      "</aside>" +
      '<div class="wa-main"></div>' +
      '<aside class="wa-info" id="wa-info" hidden aria-label="Your store setup"></aside>';
    document.body.appendChild(shell);
    $(".wa-main", shell).appendChild(root);
    shell.addEventListener("click", function (e) {
      if (root.contains(e.target)) return;
      const v = e.target.closest("[data-view]"); if (v) return setView(v.dataset.view);
      if (e.target.closest("[data-feedback]")) return window.FBFeedback.open();
      if (e.target.closest("[data-info-close]")) return toggleInfo(false);
      const a = e.target.closest("[data-info-act]");
      if (a && a.dataset.infoAct === "restart") { toggleInfo(false); setView("assistant"); mine("Start again"); return restart(); }
      if (a && a.dataset.infoAct === "carry") { toggleInfo(false); setView("assistant"); return press("intent:carry", "Continue"); }
    });
  }
  function setView(v) {
    if (!shell) return;
    VIEW = v;
    if (v === "team") loadBuilds();
    render();
    if (v === "assistant") composeFor();
  }
  function preview(m) {
    if (!m) return "";
    if (m.kind === "image" || m.kind === "sticker") return m.text ? strip(m.text) : "🙂 Sticker";
    if (m.kind === "file") return "📎 " + m.name;
    if (m.widget && m.widget.type === "summary") return "🏪 Your store";
    return strip(m.text || (m.list ? m.list.title : ""));
  }
  function strip(t) { return String(t || "").replace(/[*_]/g, "").replace(/\s+/g, " ").trim(); }
  function unread() { return msgs.slice(seen).filter(function (m) { return m.from === "bot"; }).length; }
  function rowHTML(o) {
    return '<button type="button" class="wa-row' + (VIEW === o.view ? " on" : "") + '" data-view="' + o.view + '" role="option" aria-selected="' + (VIEW === o.view) + '">' + o.av +
      '<span class="wa-rm"><span class="wa-r1"><b>' + esc(o.name) + "</b>" + (o.time ? '<time class="' + (o.n ? "is-new" : "") + '">' + esc(o.time) + "</time>" : "") + "</span>" +
      '<span class="wa-r2">' + (o.tick ? '<span class="wa-tick">' + I.ticks + "</span>" : "") + '<span class="' + (o.typing ? "is-typing" : "") + '">' + esc(o.prev) + "</span>" +
      (o.n ? "<i>" + o.n + "</i>" : "") + "</span></span></button>";
  }
  function day(t) {
    const d = new Date(t), now = new Date();
    if (d.toDateString() === now.toDateString()) return clock(t);
    const y = new Date(now); y.setDate(now.getDate() - 1);
    return d.toDateString() === y.toDateString() ? "Yesterday" : d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }
  function renderSide() {
    if (!shell) return;
    const last = msgs[msgs.length - 1], n = VIEW === "assistant" ? 0 : unread();
    const b0 = builds[0], w0 = waiting[0];
    const rows = [
      { view: "assistant", name: "FoodBridge Assistant", n: n, typing: isTyping, tick: last && last.from === "me" && !isTyping,
        av: '<span class="wa-av" style="background-image:url(' + MASCOT + 'hello-128.png)"></span>',
        time: last ? day(last.at) : "", prev: isTyping ? "typing…" : last ? preview(last) : "" },
      (b0 || w0) && { view: "team", name: "FoodBridge Team", av: '<span class="wa-av is-logo"><img src="store/foodbridge-mark-green.png" alt=""></span>',
        time: w0 ? day(w0.at) : day(Date.parse((b0.meta || {}).received || (b0.meta || {}).at)),
        prev: w0 ? "🕓 Waiting to send" : "📦 Received · " + countsLine(b0.meta) },
    ].filter(Boolean);
    if (VIEW !== "assistant" && !rows.some(function (r) { return r.view === VIEW; })) { VIEW = "assistant"; setTimeout(render, 0); }   // its chat went (Start again, another owner)
    $("#wa-list", shell).innerHTML = rows.map(rowHTML).join("");
  }
  function countsLine(m) { const c = (m && m.counts) || {}; return [c.products + " products", c.customers + " customers"].join(", "); }
  /* His builds: what reached FoodBridge under his mobile (/api/mystores), and what still waits in this
     browser to be sent (the outbox of builds). Nobody identified → nothing. */
  let loadSeq = 0;
  function loadBuilds() {
    const me = owner(), seq = ++loadSeq;
    shownFor = me;
    if (!me) { builds = []; waiting = []; render(); renderSide(); return Promise.resolve(); }
    const got = api("/api/mystores", { headers: { "x-owner-mobile": me } }).then(function (r) { return r.ok ? r.json() : { stores: [] }; }).catch(function () { return { stores: [] }; });
    const wait = OB.OUTBOX.all().catch(function () { return []; });
    return Promise.all([got, wait]).then(function (x) {
      if (seq !== loadSeq) return;   // the owner changed meanwhile
      builds = (x[0].stores || []).filter(function (b) { return b.meta; });
      waiting = FLOW.owned(x[1], me, M, function (b) { return b.meta && b.meta.mobile; });
      renderSide(); render();   // render: a chat that just went away hands back to the Assistant
    });
  }
  function downloadBuildFile(id, file) {
    api("/api/mystores?id=" + encodeURIComponent(id) + "&file=" + encodeURIComponent(file), { headers: { "x-owner-mobile": owner() } }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.blob(); }).then(function (bl) {
      const a = document.createElement("a"); a.href = URL.createObjectURL(bl); a.download = file.split("/").pop(); a.click();
    }).catch(function () {});
  }
  /* The read-only chat, drawn as a conversation. */
  function head(av, name, sub, verified) {
    const ava = $(".cb-ava", root);
    ava.className = "cb-ava" + (av === "logo" ? " is-logo" : av === "icon" ? " is-icon" : "");
    ava.style.backgroundImage = av === "mascot" ? "url(" + MASCOT + "hello-128.png)" : "";
    $(".cb-who b", root).textContent = name;
    status.textContent = sub;
  }
  function renderOther() {
    root.classList.add("is-readonly");
    let html = '<div class="cb-chip">Sent to FoodBridge</div>';
    head("logo", "FoodBridge Team", "");
    $(".wa-ro", root).innerHTML = I.lock + "<span>Read-only</span>";
    waiting.forEach(function (b) {
      html += '<div class="cb-row out cb-tail"><div class="cb-grp is-wide"><div class="cb-bub"><span class="cb-txt">' +
        md("🕓 *Waiting to send* — " + b.sent + "/" + b.total + " files") +
        '</span><span class="cb-time"><span class="ro-held">' + I.clock + "</span>" + day(b.at) + "</span></div></div></div>";
    });
    builds.slice().reverse().forEach(function (b) {
      const m = b.meta || {}, c = m.counts || {};
      html += '<div class="cb-row in cb-tail"><div class="cb-grp is-wide"><div class="cb-bub"><span class="cb-txt">' +
        md("📦 *Received*" + (m.shop ? " — " + m.shop : "") + "\n" +
          [c.products + " products", c.customers + " customers", c.suppliers + " suppliers", c.staff + " staff", c.answered + "/6 daily work", c.photos + " files"].join(" · ") +
          (c.gaps ? "\nTo follow up: " + c.gaps : "")) + "</span>" +
        '<span class="cb-time">' + day(Date.parse(m.received || m.at)) + "</span>" +
        '<div class="ro-files">' + (b.files || []).map(function (f) { const nm = f.name || f; return '<button type="button" data-file="' + esc(nm) + '" data-id="' + esc(b.id) + '">' + I.doc + esc(nm) + "</button>"; }).join("") + "</div>" +
        "</div></div></div>";
    });
    body.innerHTML = html;
    stick();
    renderInfo();
  }
  /* Business info: who the Assistant is, and how far his store's setup has come. */
  function toggleInfo(on) {
    if (!shell) return openMoreSheet();
    infoOpen = on == null ? !infoOpen : on;
    $(".cb-info", root).classList.toggle("on", infoOpen);
    renderInfo();
  }
  function renderInfo() {
    if (!shell) return;
    const box = $("#wa-info", shell);
    box.hidden = !infoOpen;
    if (!infoOpen) return;
    const f = FLOW.facts(ctx()), P = M.progress(CAT, S);
    const steps = [
      ["Mobile and shop", M.storeReady(S) && !!S.store.name, [S.store.name, S.store.mobile].filter(Boolean).join(" · ")],
      ["Contacts", S.order.length > 0, S.order.length ? String(S.order.length) : ""],
      ["Who is who", S.order.length > 0 && !f.unsorted, f.customers + f.suppliers + f.staff ? f.customers + " customers · " + f.suppliers + " suppliers · " + f.staff + " staff" : ""],
      ["Business", !!(f.type), f.type || ""],
      ["Your day", P.rules.n === M.RULES_N, P.rules.n + "/" + M.RULES_N],
      ["Products", f.products > 0, f.products ? f.products + " products" : ""],
      ["Papers", !!F.filesSeen, f.files ? f.files + " files" : ""],
      ["Sent", !!F.built, ""],
    ];
    const done = steps.filter(function (x) { return x[1]; }).length, nowAt = steps.findIndex(function (x) { return !x[1]; });
    const action = F.at && F.at !== "done" ? '<button type="button" class="wi-act is-plain" data-info-act="carry">' + I.chats + "Continue</button>" : "";
    box.innerHTML = '<header class="wi-h"><button type="button" class="wa-ib" data-info-close aria-label="Close">' + I.close + "</button>Your store setup</header>" +
      '<div class="wi-b">' +
        '<div class="wi-card"><p class="wi-k">' + done + " of " + steps.length + " done</p>" +
          '<div class="wi-bar"><i style="width:' + Math.round(done / steps.length * 100) + '%"></i></div><ul class="wi-steps">' +
          steps.map(function (x, i) {
            return '<li class="' + (x[1] ? "is-done" : i === nowAt ? "is-now" : "") + '"><span class="d">' + (x[1] ? I.check : "") + "</span><span>" + esc(x[0]) + (x[2] ? "<br><small>" + esc(x[2]) + "</small>" : "") + "</span></li>";
          }).join("") + "</ul></div>" +
        action +
        '<button type="button" class="wi-act" data-info-act="restart">' + I.trash + "Start again</button>" +
      "</div>";
  }

  /* ── start ─────────────────────────────────────────────────────────── */
  async function mount() {
    load();
    if (MODE === "tower") SNAP = await fetch("../seed-data/tower-snapshot.json").then(function (r) { return r.json(); }).catch(function () { return null; });
    build();
    if (MODE === "page") openChat();
    const b = document.getElementById("as-open");
    if (b) b.addEventListener("click", function () { openChat(); });
    if (MODE === "tower" && /[?&]chat=1/.test(location.search)) openChat();
    composeFor();
    loadBuilds();
    /* What he sent while the page was away (a build waiting to go) leaves now. */
    OB.OUTBOX.all().then(function (list) { (list || []).forEach(function (b) { OB.deliver(X, b).then(loadBuilds, function () {}); }); }).catch(function () {});
  }
  window.FBAssistant = { mount: mount, open: function () { openChat(); }, _state: function () { return { S: S, F: F, msgs: msgs }; } };
})();
