/* Store Builder discovery — what every screen does before it shows the prototype (2026-10-01).
   1. Starts the stand-in bridge (../discovery-bridge.js), so Build my store and the phone hand-off
      work here with no server; then loads the prototype step into the iframe (data-src).
   2. On a screen with a QR code (Contacts, Files), offers "Open the phone page" — the page the QR
      would open on his phone, with a stand-in contact picker — in a phone-sized window beside this
      one. Not a tab: the computer listens only while its page is in view (desk.js hoActive). */
(function () {
  "use strict";
  var frame = document.querySelector("iframe[data-src]");
  function load() { if (frame) frame.src = frame.getAttribute("data-src"); document.dispatchEvent(new Event("bridge-ready")); }
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
