# Discovery version `store-builder-v4` — snapshot

Frozen snapshot of the Store Builder discovery prototype, frozen **2026-10-01** per discovery working rule **R6**.
It is `store-builder-v1` with the changes the owner asked for after a full check against the mock-platform:
every step screen follows the screen it is opened on (v2); the phone layout's “Add from phone” has the stand-in
picker (v3); and (v4) the stand-in bridge applies the bridge's own rules, a **FoodBridge online / down** switch
shows the waiting and retry states, and an iPhone, real or previewed, behaves as in the prototype (Safari's
one-time setting) instead of getting the stand-in picker. The prototype is unchanged.

**What it is:** the owner's whole flow, end to end, in plain HTML/CSS/JS. He builds his store on a computer or a
phone, in one address that flips by screen width: Shop · Contacts (phone QR, iCloud, Tally/Excel list, paste) ·
Who is who · Daily work · Files (drag-and-drop, a voice note, paper through the phone's camera) · Send. Build my
store queues a snapshot and delivers it file by file; the last screen shows what reached FoodBridge.
It needs no server, makes no real API call, and has no build step.

**Immutable.** Do not edit anything in this folder.

| | |
| --- | --- |
| Accepted | 2026-09-26 … 2026-10-01 (owner, in mock-platform v7); frozen 2026-10-01 |
| Supersedes | [`store-builder-v3`](../store-builder-v3/README.md) — the stand-in picker hid the iPhone's one-time setting, and a bridge that can't be reached could not be shown; v2, v1 before it |
| Published | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/store-builder-v4/index.html> (public, from [`nishant-devekar/foodbridge-store-builder-mockup`](https://github.com/nishant-devekar/foodbridge-store-builder-mockup)) |
| Source | `foodbridge-mock-platform` @ `3c840e6` → `v7/store-builder/` — the complete folder, all 22 tracked files via `git archive`, **byte for byte**, in `screens/prototype/`; its `README.md` is kept as `PROTOTYPE.md`. Its font and favicon (`v7/vendor/…woff2`, `v7/favicon.ico`) are in `screens/vendor/` and `screens/` |
| Addendum | [`../../instructions/addendum-006-store-builder-v4-as-the-mock-platform.md`](../../instructions/addendum-006-store-builder-v4-as-the-mock-platform.md) (v3: [addendum-005](../../instructions/addendum-005-store-builder-v3-picker-on-the-phone-layout.md); v2: [addendum-004](../../instructions/addendum-004-store-builder-v2-follows-the-screen.md); v1: [addendum-003](../../instructions/addendum-003-freeze-store-builder-v1.md)) |
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
instead, with the bridge's own rules at `3c840e6` (names, sizes, empty files, the summary, the hand-off's limits
and one-hour life), and keeps builds and hand-offs in this browser's Cache Storage. No request leaves the browser.
Contacts and Files offer “Open the phone page for this QR”, which opens the page the QR carries in a phone-sized
window: pick contacts or send a photo there, and they land on the open screen.

Two discovery aids, nothing else:
- **FoodBridge online / down**, in every screen's top bar. Down, the prototype's calls fail as an unreachable
  bridge does: a build waits (“Waiting to send”, *Send now*), and the QR says “Can't reach FoodBridge right now”.
  Bring it back and press *Send now*. (The browser logs each failed call; that is the point.)
- A **stand-in contact picker** where the browser has none and is not an iPhone — a computer, or an Android
  preview: the phone layout's “Add from phone” and the QR phone page “pick” six invented contacts. An iPhone,
  real or previewed, shows Safari's one-time setting, as the prototype does. Chrome on an Android phone uses its
  real contact list.

**As the mock-platform, not shown here:** Google Contacts (off there too: no client id); the bridge's email of
each Excel to the team; a real phone scanning the QR (each browser keeps its own builds). A file the bridge would
refuse cannot be sent from the prototype's screens (it skips empty files, cleans names, splits big files) — there
or here; the stand-in answers such a call as the bridge does.

**Verified 2026-10-01** (headless Chrome over HTTP), 0 console errors throughout:
- desktop (1280 px): phone QR → 6 contacts arrive on Contacts; photo mode → the photo arrives on Files; sample
  data → Build my store → What reached FoodBridge lists the Excel, `setup.json` and `raw/khata.jpg`, downloadable;
- phone (440 × 956): every step screen opens the phone layout at its step (Shop → welcome first), with no sideways
  scroll; Shop → Contacts (“Add from phone” → 6 contacts in To sort) → Daily operation → Build your store with a
  photo and a CSV → Build my store → arrives;
- resizing across 1000 px re-opens the same step in the other layout;
- FoodBridge down: a build waits with *Send now*; back online, *Send now* delivers; the QR says it can't reach
  FoodBridge; the stand-in answers bad id / bad name / empty / too large / bad code / bad type as the bridge does;
- an iPhone preview: no stand-in; “Add from phone” and the QR page show the one-time setting; an Android preview:
  the stand-in picks six;
- an 18-flow sweep (Hindi, iCloud vCard, Tally/Excel list, paste, mark/remove/undo, a 6 MB file in pieces, voice
  notes on both layouts, building twice, start again, the QR page in Hindi and with a PDF) passes.
`screens/prototype/` compared byte for byte with `git archive 3c840e6 v7/store-builder`.

Serve over HTTP to view — a service worker does not run from `file://`:

```
python3 -m http.server 8000
```

then open `index.html`. To start fresh: What reached FoodBridge → “Clear this browser’s builds”, and the
prototype's own ⋯ menu → Start again.
