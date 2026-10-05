/* Assistant discovery · every screen starts the stand-in bridge first (../discovery-bridge.js), so the
   chat's calls -- the saved store, the build, the phone hand-off, Claude's product reading -- are
   answered in this browser with no server; then the chat mounts. Serve over HTTP: a service worker does
   not run from file://. */
(function () {
  "use strict";
  function go() { if (window.FBAssistant) window.FBAssistant.mount(); }
  if (!("serviceWorker" in navigator)) { go(); return; }
  navigator.serviceWorker.register("../discovery-bridge.js", { scope: "../" })
    .then(function () { return navigator.serviceWorker.ready; })
    .then(function () {
      if (navigator.serviceWorker.controller) return;
      return new Promise(function (ok) { navigator.serviceWorker.addEventListener("controllerchange", ok, { once: true }); setTimeout(ok, 3000); });
    })
    .then(go, function (e) { console.warn("discovery bridge not started:", e); go(); });
})();
