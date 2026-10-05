# Discovery version `assistant-v5` — snapshot

Store Builder as the FoodBridge Assistant's chat — the owner's voice note of 5 Oct 2026 — with the desktop as WhatsApp Web, keeping only what works, the team's inbox and outbox scoped to his store (addendum-003 … 006), with Give feedback:
hi → Onboarding → the Store Builder v5 questions one at a time (name ★, mobile, Sync, contacts by address book or QR,
who is who, business, warehouses, GST, how the day runs) → products from any file (Claude parked: a stand-in reads
spreadsheets, photos are kept for the team) → papers → the store summed up → *Create my store* (to the FoodBridge team)
→ what next (an order, tomorrow's order, a collection request — over the Vasu Foods demo — and a campaign, held).
The same chat runs as the Control Tower's panel (`screens/tower.html`).

| | |
| --- | --- |
| Built | 2026-10-05, in this module (`modules/assistant`), from the frozen `store-builder-v5` (copied) and mock-platform v7 @ 2a7ead3 (the assistant's look and the tower's answers, copied) |
| Status | **Published for feedback** (see addendum-006). It becomes the accepted version when he accepts it (discovery R6); anything he asks to change becomes `assistant-v6`. Until then, treat this folder as frozen: iterate in `../../` (the working discovery) |
| Addendum | `../../instructions/addendum-006-publish-and-feedback-v5.md` (in the module repo) |
| Independent of | the store-builder and customer-success modules — nothing here links to them or loads from them |

Open over HTTP from this folder (`python3 -m http.server 8000`, then `index.html`): a service worker stands in for the
bridge and for Claude, so it needs no server and makes no real API call. The tests live with the working discovery
(`../../tests/`).
