# Discovery version `store-builder-v2` — snapshot

Frozen snapshot of the Store Builder discovery prototype, frozen **2026-10-01** per discovery working rule **R6**.
It is `store-builder-v1` with one fix the owner asked for: every step screen now follows the screen it is
opened on, as the prototype does — on a phone, the phone layout at that step (v1 held them all on the desktop
layout). The prototype is unchanged.

**What it is:** the owner's whole flow, end to end, in plain HTML/CSS/JS. He builds his store on a computer or a
phone, in one address that flips by screen width: Shop · Contacts (phone QR, iCloud, Tally/Excel list, paste) ·
Who is who · Daily work · Files (drag-and-drop, a voice note, paper through the phone's camera) · Send. Build my
store queues a snapshot and delivers it file by file; the last screen shows what reached FoodBridge.
It needs no server, makes no real API call, and has no build step.

**Immutable.** Do not edit anything in this folder.

| | |
| --- | --- |
| Accepted | 2026-09-26 … 2026-10-01 (owner, in mock-platform v7); frozen 2026-10-01 |
| Supersedes | [`store-builder-v1`](../store-builder-v1/README.md) — its step screens held the desktop layout on a phone |
| Published | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/store-builder-v2/index.html> (public, from [`nishant-devekar/foodbridge-store-builder-mockup`](https://github.com/nishant-devekar/foodbridge-store-builder-mockup)) |
| Source | `foodbridge-mock-platform` @ `3c840e6` → `v7/store-builder/` — the complete folder, all 22 tracked files via `git archive`, **byte for byte**, in `screens/prototype/`; its `README.md` is kept as `PROTOTYPE.md`. Its font and favicon (`v7/vendor/…woff2`, `v7/favicon.ico`) are in `screens/vendor/` and `screens/` |
| Addendum | [`../../instructions/addendum-004-store-builder-v2-follows-the-screen.md`](../../instructions/addendum-004-store-builder-v2-follows-the-screen.md) (v1: [addendum-003](../../instructions/addendum-003-freeze-store-builder-v1.md)) |
| Independent of | the customer-success module's `ticketing-workspace-v1`. Nothing here links to it or loads from it |

| Part | Files |
| --- | --- |
| Wiring hub (screen list, transition maps, decisions) | `index.html` |
| One wrapper per step (desktop layout at 1000 px and wider, phone layout under it), plus the phone page and what reached FoodBridge | `screens/*.html`, `screens/discovery.js` |
| The prototype, untouched | `screens/prototype/` |
| The stand-in bridge | `discovery-bridge.js` |
| The owner's sample answers | `seed-data/seed.json` |

**How it runs with no server.** Where the prototype would call the bridge (`/api/stores`, `/api/handoff`, at
`localhost:8787` or the live bridge), `discovery-bridge.js` — a service worker every wrapper starts — answers
instead, the way the bridge did at `3c840e6`, and keeps builds and hand-offs in this browser's Cache Storage. No
request leaves the browser. On a desktop browser the phone page gets a stand-in contact picker holding six invented
contacts. Contacts and Files offer “Open the phone page for this QR”, which opens the page the QR carries in a
phone-sized window: pick contacts or send a photo there, and they land on the open screen.

**Not in this version:** Google Contacts sign-in (it needs a real Google client; the prototype shows it only
where it is configured). Excel/Tally import, iCloud vCards, paste, drag-and-drop and the voice note all run as in
the prototype.

**Verified 2026-10-01** (headless Chrome over HTTP), 0 console errors throughout:
- desktop (1280 px): phone QR → 6 contacts arrive on Contacts; photo mode → the photo arrives on Files; sample
  data → Build my store → What reached FoodBridge lists the Excel, `setup.json` and `raw/khata.jpg`, downloadable;
- phone (440 × 956): every step screen opens the phone layout at its step (Shop → welcome first), with no sideways
  scroll; Shop → Contacts → Daily operation → Build your store with a photo and a CSV → Build my store → arrives;
- resizing across 1000 px re-opens the same step in the other layout.
`screens/prototype/` compared byte for byte with `git archive 3c840e6 v7/store-builder`.

Serve over HTTP to view — a service worker does not run from `file://`:

```
python3 -m http.server 8000
```

then open `index.html`. To start fresh: What reached FoodBridge → “Clear this browser’s builds”, and the
prototype's own ⋯ menu → Start again.
