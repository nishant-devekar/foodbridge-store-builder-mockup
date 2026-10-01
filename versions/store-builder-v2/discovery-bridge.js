/* Store Builder discovery — a stand-in for the bridge, in the browser (2026-10-01).

   The prototype (screens/prototype/, byte-identical to foodbridge-mock-platform v7/store-builder @ 3c840e6)
   talks to a server for two things: sending a build (`/api/stores`) and the phone hand-off
   (`/api/handoff`). Discovery has no server and makes no real API calls, so this service worker answers
   those two paths itself — whatever host the prototype aims at (localhost:8787 or the live bridge) —
   and keeps everything in this browser's Cache Storage. Every other request goes to the network
   untouched, so the prototype's own files stay exactly as they were.

   It mirrors the bridge's behaviour at mock-platform 3c840e6 (zoho-function/stores.js, handoff.js):
   - POST /api/stores {id, meta?, files?|file?} → 200 {ok, id, stored, emailed:false}; pieces kept as sent
   - GET  /api/stores                         → {store:"discovery", stores:[{id, meta, files, missing}]}, newest first
   - GET  /api/stores?id=&file=               → that file's bytes
   - POST /api/handoff {code, people?|file?|hello?} → {ok, n}
   - GET  /api/handoff?code=                  → {opened, people, files, more:false}, taken once, void after an hour

   One discovery-only aid: desktop browsers have no contact picker, so a phone page opened with
   ?demoPicker gets a stand-in picker holding a few invented contacts. Nothing else is changed. */

const STORE = "store-builder-discovery-bridge";
const BASE = self.registration.scope + "__bridge__/";
const HOUR = 60 * 60e3;
const DEMO_CONTACTS = [
  { name: ["Mehta Provision Store"], tel: ["+91 98765 00011"] },
  { name: ["Shree Ganesh Kirana"], tel: ["98765 00012"] },
  { name: ["Balaji General Stores"], tel: ["098765 00013"] },
  { name: ["Om Sai Traders"], tel: ["9876500014"] },
  { name: ["Laxmi Distributors"], tel: ["+919876500015"] },
  { name: ["Raju (driver)"], tel: ["9876500016"] },
];

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (/\/api\/stores$/.test(u.pathname)) e.respondWith(stores(e.request, u).catch(fail));
  else if (/\/api\/handoff$/.test(u.pathname)) e.respondWith(handoff(e.request, u).catch(fail));
  else if (u.searchParams.has("demoPicker") && /\/send\/(index\.html)?$/.test(u.pathname)) e.respondWith(withDemoPicker(e.request));
});

/* ── storage: Cache Storage under synthetic URLs ── */
const cache = () => caches.open(STORE);
async function put(path, body, type) {
  await (await cache()).put(BASE + path, new Response(body, { headers: { "Content-Type": type || "application/octet-stream" } }));
}
async function get(path) { const r = await (await cache()).match(BASE + path); return r || null; }
async function list(prefix) {
  return (await (await cache()).keys()).map((r) => r.url.slice(BASE.length)).filter((p) => p.startsWith(prefix)).sort();
}
async function del(path) { await (await cache()).delete(BASE + path); }

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const fail = (err) => json(500, { error: "discovery_bridge", message: String(err && err.message || err) });
function fromB64(s) { const bin = atob(s || ""), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return a; }
const ID = /^SB-[a-z0-9]{6,14}-[a-z0-9]{4,10}$/;
const PART = /\.part(\d{1,3})of(\d{1,3})$/;
const TYPES = { xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", json: "application/json", jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", webp: "image/webp", pdf: "application/pdf", csv: "text/csv", txt: "text/plain", vcf: "text/vcard",
  webm: "audio/webm", ogg: "audio/ogg", m4a: "audio/mp4", mp3: "audio/mpeg", wav: "audio/wav" };
const typeOf = (name) => TYPES[String(name).replace(PART, "").split(".").pop().toLowerCase()] || "application/octet-stream";

/* ── /api/stores ── */
async function stores(req, u) {
  if (req.method === "POST") {
    const b = await req.json().catch(() => null);
    if (!b) return json(400, { error: "bad_json" });
    if (!ID.test(String(b.id || ""))) return json(400, { error: "bad_id" });
    const files = (Array.isArray(b.files) ? b.files : []).concat(b.file ? [b.file] : []);
    if (!b.meta && !files.length) return json(400, { error: "nothing_sent" });
    if (b.meta) await put("stores/" + b.id + "/meta.json", JSON.stringify(Object.assign({}, b.meta, { id: b.id, received: new Date().toISOString() })), "application/json");
    for (const f of files) {
      const bytes = fromB64(f.data);
      if (!bytes.length) return json(400, { error: "empty_file" });
      await put("stores/" + b.id + "/files/" + f.name, bytes);
    }
    return json(200, { ok: true, id: b.id, stored: true, emailed: false });
  }
  const id = u.searchParams.get("id"), file = u.searchParams.get("file");
  if (id && file) {
    const r = await get("stores/" + id + "/files/" + file);
    if (r) return new Response(await r.arrayBuffer(), { status: 200, headers: { "Content-Type": typeOf(file) } });
    /* a file that came in pieces is downloaded as one */
    const parts = (await list("stores/" + id + "/files/" + file + ".part")).filter((p) => PART.test(p));
    if (!parts.length) return json(404, { error: "not_found" });
    parts.sort((a, b) => +a.match(PART)[1] - +b.match(PART)[1]);
    const bufs = [];
    for (const p of parts) bufs.push(await (await get(p)).arrayBuffer());
    return new Response(new Blob(bufs), { status: 200, headers: { "Content-Type": typeOf(file) } });
  }
  const all = await list("stores/");
  const byId = {};
  for (const p of all) {
    const [, sid, kind, ...rest] = p.split("/");
    const s = byId[sid] || (byId[sid] = { id: sid, meta: null, files: [] });
    if (kind === "meta.json") s.meta = await (await get(p)).json();
    else if (kind === "files") s.files.push({ name: rest.join("/"), size: (await (await get(p)).arrayBuffer()).byteLength });
  }
  const out = Object.values(byId).map((s) => {
    const joined = [], big = {};
    s.files.forEach((f) => {
      const m = f.name.match(PART);
      if (!m) { joined.push(f); return; }
      const name = f.name.replace(PART, ""), g = big[name] || (big[name] = { name, size: 0, parts: +m[2], got: 0 });
      g.size += f.size; g.got++;
    });
    Object.values(big).forEach((g) => joined.push(g.got < g.parts ? { name: g.name, size: g.size, parts: g.parts, partial: true } : { name: g.name, size: g.size, parts: g.parts }));
    const have = joined.filter((f) => !f.partial).map((f) => f.name);
    const expected = (s.meta && s.meta.files) || [];
    return { id: s.id, meta: s.meta, files: joined, missing: expected.filter((n) => have.indexOf(n) < 0) };
  }).sort((a, b) => String((b.meta && b.meta.at) || "").localeCompare(String((a.meta && a.meta.at) || "")));
  return json(200, { store: "discovery", stores: out });
}

/* ── /api/handoff ── */
let seq = 0;
async function handoff(req, u) {
  if (req.method === "POST") {
    const b = await req.json().catch(() => null);
    if (!b) return json(400, { error: "bad_json" });
    const code = String(b.code || "");
    if (!/^[a-z0-9]{12}$/.test(code)) return json(400, { error: "bad_code" });
    const people = (Array.isArray(b.people) ? b.people : []).map((p) => ({ name: String(p.name || "").trim().replace(/\s+/g, " ").slice(0, 80), phone: String(p.phone || "").replace(/[^\d+ -]/g, "").slice(0, 20) })).filter((p) => p.name || p.phone);
    const file = b.file && b.file.data ? { name: String(b.file.name || "photo.jpg").slice(0, 80), type: String(b.file.type || ""), data: String(b.file.data) } : null;
    if (file && !/^(image\/(jpeg|png|webp|heic|heif)|application\/pdf)$/.test(file.type)) return json(400, { error: "bad_type" });
    if (!people.length && !file && !b.hello) return json(400, { error: "nothing_sent" });
    const name = String(Date.now()).padStart(14, "0") + "-" + String(seq++).padStart(4, "0");
    await put("handoff/" + code + "/" + name + ".json", JSON.stringify({ at: Date.now(), hello: !people.length && !file ? true : undefined, people, file }), "application/json");
    return json(200, { ok: true, n: people.length });
  }
  const code = u.searchParams.get("code") || "";
  if (!/^[a-z0-9]{12}$/.test(code)) return json(400, { error: "bad_code" });
  const paths = await list("handoff/" + code + "/");
  const entries = [];
  for (const p of paths) { const r = await get(p); if (r) entries.push(await r.json()); await del(p); }
  const fresh = entries.filter((e) => Date.now() - e.at < HOUR);
  return json(200, { opened: fresh.length > 0, people: [].concat(...fresh.map((e) => e.people || [])), files: fresh.filter((e) => e.file).map((e) => e.file), more: false });
}

/* ── the phone page, with a stand-in contact picker (discovery only) ── */
async function withDemoPicker(req) {
  const page = new URL(req.url); page.search = "";
  const r = await fetch(page.href);
  const html = await r.text();
  const stub = "<script>/* discovery: a stand-in for Android Chrome's contact picker */" +
    "navigator.contacts={select:function(){return Promise.resolve(" + JSON.stringify(DEMO_CONTACTS) + ");}};</script>";
  return new Response(html.replace("<script", stub + "<script"), { status: r.status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
