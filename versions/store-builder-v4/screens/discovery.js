/* Store Builder discovery — what every screen does before it shows the prototype (2026-10-01).
   1. Starts the stand-in bridge (../discovery-bridge.js), so Build my store and the phone hand-off
      work here with no server; then loads the prototype step into the iframe (data-src).
      The prototype picks its own layout by width (1000 px and wider: desktop; narrower: phone), and
      the two name their steps differently, so a screen with data-phone opens that step on the phone
      layout, and re-opens the right one when the window crosses 1000 px.
   2. On a screen with a QR code (Contacts, Files), offers "Open the phone page" — the page the QR
      would open on his phone, with a stand-in contact picker — in a phone-sized window beside this
      one. Not a tab: the computer listens only while its page is in view (desk.js hoActive).
   3. A “FoodBridge online / down” switch in the top bar (v4): down, the prototype's calls fail as an
      unreachable bridge does (discovery-bridge.js), so its waiting and retry states can be seen. */
(function () {
  "use strict";
  var frame = document.querySelector("iframe[data-src]");
  var wide = function () { return window.matchMedia("(min-width: 1000px)").matches; };
  function src() {
    var s = frame.getAttribute("data-src"), ph = frame.getAttribute("data-phone");
    if (!ph) return s;
    /* ?fit= differs per layout, so re-opening after a flip is a real load: the prototype reads its
       step only when it loads, and a change of #step alone would not reload it. It ignores ?fit. */
    var p = s.split("#");
    return p[0] + "?fit=" + (wide() ? "wide" : "narrow") + (wide() ? "#" + p[1] : ph);
  }
  function load() {
    if (frame) frame.src = src();
    document.dispatchEvent(new Event("bridge-ready"));
    if (frame && frame.hasAttribute("data-phone")) {
      var was = wide(), t;
      window.addEventListener("resize", function () {
        clearTimeout(t);
        t = setTimeout(function () { if (wide() !== was) { was = wide(); frame.src = src(); } }, 450);
      });
    }
  }
  function ready() {
    if (navigator.serviceWorker.controller) return Promise.resolve();
    return new Promise(function (ok) {
      navigator.serviceWorker.addEventListener("controllerchange", ok, { once: true });
      setTimeout(ok, 3000);
    });
  }
  if (!("serviceWorker" in navigator)) { load(); return; }
  navigator.serviceWorker.register("../discovery-bridge.js", { scope: "../" })
    .then(function () { return navigator.serviceWorker.ready; })
    .then(ready)
    .then(load, function (e) { console.warn("discovery bridge not started:", e); load(); });

  /* FoodBridge online / down — one setting for every screen, kept where the stand-in bridge reads it. */
  var bar = document.querySelector(".bar");
  if (bar && "caches" in window) {
    var KEY = new URL("../__bridge__/settings/down", location.href).href, STORE = "store-builder-discovery-bridge";
    var sw = document.createElement("button");
    sw.type = "button"; sw.id = "bridge-switch";
    sw.style.cssText = "flex:0 0 auto;font:inherit;font-size:12px;font-weight:600;border:1px solid #dde4e0;border-radius:99px;padding:3px 10px;background:#fff;cursor:pointer;white-space:nowrap";
    var paint = function (isDown) {
      sw.dataset.down = isDown ? "1" : "";
      sw.innerHTML = '<span style="color:' + (isDown ? "#c0392b" : "#0b7534") + '">●</span> FoodBridge ' + (isDown ? "down" : "online");
      sw.title = isDown ? "Builds and the phone hand-off wait, as when FoodBridge can't be reached. Click to bring it back." : "Click to see what happens when FoodBridge can't be reached.";
    };
    var read = function () { return caches.open(STORE).then(function (c) { return c.match(KEY); }).then(function (r) { paint(!!r); }).catch(function () { paint(false); }); };
    sw.addEventListener("click", function () {
      var toDown = !sw.dataset.down;
      caches.open(STORE).then(function (c) { return toDown ? c.put(KEY, new Response("1")) : c.delete(KEY); }).then(function () { paint(toDown); });
    });
    var go = bar.querySelector(".go");
    if (go) go.insertBefore(sw, go.firstChild); else bar.appendChild(sw);
    read();
    window.addEventListener("focus", read);
  }

  var link = document.getElementById("phone-link");
  if (!link || !frame) return;
  link.addEventListener("click", function (e) {
    var w = window.open(link.href, "sb-phone", "popup,width=420,height=820,left=" + Math.max(0, screen.availWidth - 440) + ",top=40");
    if (w) e.preventDefault();
  });
  setInterval(function () {
    var qr = null;
    try { qr = frame.contentDocument && frame.contentDocument.querySelector(".ho-qr[data-url]"); } catch (e) { /* not loaded */ }
    if (!qr) { link.hidden = true; return; }
    var q = new URLSearchParams((qr.getAttribute("data-url").split("#")[1]) || "");
    link.href = "phone-handoff.html?c=" + encodeURIComponent(q.get("c") || "") + (q.get("m") === "photos" ? "&photos" : "") + (q.get("l") ? "&l=" + q.get("l") : "");
    link.hidden = false;
  }, 700);
})();
