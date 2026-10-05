# Discovery version `assistant-v6` — snapshot

The FoodBridge Assistant's chat after the owner's second voice note and Nishant's decisions (addendum-013):
hi → *Set up my store* → mobile → the shop's name (or "*Sharma Agencies* — is this you?" for a store already saved) →
contacts → who is who → **anything else?** → business (**as many as apply**) → warehouses → GST → the day (returns and
mornings: **as many as apply**) → products from any file → **anything else?** → papers → **anything else?** → the store
summed up → *Create my store* → "✅ Done! We'll set up your store and send you a login link." — **it stops there**.
No owner's name; no next actions or campaign (they belong to the assistant inside his store, after he logs in from a
link); every word cut — no subtitles, no descriptions.

| | |
| --- | --- |
| Built | 2026-10-05, from `assistant-v5` |
| Status | **For the owner's review.** It becomes the accepted version when he accepts it (discovery R6); anything he asks to change becomes `assistant-v7`. Until then, treat this folder as frozen: iterate in `../../` (the working discovery) |
| Addendum | `../../instructions/addendum-013-assistant-v6.md` (in the module repo) |

Open over HTTP from this folder (`python3 -m http.server 8000`, then `index.html`): a service worker stands in for the
bridge and for Claude, so it needs no server and makes no real API call. The tests live with the working discovery
(`../../tests/`).
