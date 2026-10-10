# Discovery version `activation-v1` — snapshot

**Store activation, first version (10 Oct 2026).** A new owner's Getting started page: six steps from an empty store to a
running business, one next step at a time, and the floating FoodBridge assistant that only points to the page.

- **The page:** items (upload the rate list; a photo, common items or "let our team do it" in a sheet; reading, then a quick
  check one question at a time), customers (from phone contacts, shops pre-ticked), the first order, deliver it, get paid,
  daily plan on WhatsApp. "n of 6" with a ring; the first order opens after items and customers, deliver and get paid after
  the first order.
- **Ways in:** the platform dashboard's Getting started card, the ring on the avatar and the profile menu's Getting started
  row, the floating assistant (next-step bubble; questions answered with a pointer, never a step run in the chat), WhatsApp
  nudges.
- **Other people's phones:** the customer's invoice and payment link (Pay by UPI marks it paid), the driver's link (Delivered
  shows on the owner's page).

| | |
| --- | --- |
| Built | 2026-10-10 |
| Status | **Published for the owner's review.** Treat this folder as frozen; iterate in `../../` |
| Addendum | `../../instructions/addendum-002-v1-end-to-end-prototype.md` (in the module repo) |
| Rules and tests | `screens/activation/engine.js`; `node --test tests/engine.test.js` (7 tests) |

Open `index.html` (the hub) or `screens/activation.html#reset` to start fresh. No server needed, no real API call, invented
data; progress is kept in this browser's localStorage. An uploaded file is not read (the seed's rate list stands in) and
nothing is sent on WhatsApp.
