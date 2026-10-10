# Discovery version `activation-v1` — snapshot

**Store activation, first version (10 Oct 2026; refreshed the same day with addenda 003–018).** A new owner's Getting
started page: six steps from an empty store to a running business, one next step at a time, and the floating FoodBridge
assistant that only points to the page.

- **The page:** add your products, customers (from phone contacts, shops pre-ticked), the first order, deliver it, get
  paid, daily plan on WhatsApp. "n of 6" with a ring; the first order opens after products and customers, deliver and get
  paid after the first order.
- **Step 1, add your products:** five ways — upload any file (Excel, CSV, PDF, photos…), a photoshoot into a gallery, a
  one-time Zoho import (Zoho's own sign-in and consent, simulated), speak your products, search products (FoodBridge's list
  plus live Open Food Facts results, India, food only). Every way runs the same flow: choose → processing → check & save.
- **Check & save:** on a phone, your rate list — a product tile, the name and the rate per row, a pencil on each, fixes
  marked in red in place; quick questions one at a time; a simple editor (the name, then Packing, Rate and GST); on a
  computer, an Excel-like sheet.
- **A product:** a smallest unit and a bigger one holding a whole number of them (1 carton = 120 packets), a rate for one
  (the other derived), a GST rate, and whether the rate includes GST — said once for the whole list. Order totals add GST
  when it is extra.
- **Ways in:** the dashboard's Getting started card, the ring on the avatar and the profile menu's Getting started row,
  the floating assistant, WhatsApp nudges; the store link arrives in the owner's WhatsApp after an earlier chat (name,
  mobile, GST).
- **Other people's phones:** the customer's invoice and payment link (Pay by UPI marks it paid), the driver's link
  (Delivered shows on the owner's page).

| | |
| --- | --- |
| Built | 2026-10-10 (first snapshot); refreshed 2026-10-10 with addenda 003–014, and again with 016–018, at the owner's ask |
| Status | **Published for the owner's review.** Iterate in `../../` |
| Addenda | `../../instructions/addendum-002` to `addendum-019` (in the module repo) |
| Rules and tests | `screens/activation/engine.js`; `node --test tests/engine.test.js` (12 tests) |

Open `index.html` (the hub) or `screens/activation.html#reset` to start fresh. No server needed, invented data; progress is
kept in this browser's localStorage. An uploaded file or photo is not read (the seed's rate list stands in), Zoho is not
called, and nothing is sent on WhatsApp. Two things leave the browser: **Search products** asks Open Food Facts
(world.openfoodfacts.org) as you type — live results: Open Food Facts contributors, ODbL — and **Speak your products** uses
the browser's own speech recognition where it has one.
