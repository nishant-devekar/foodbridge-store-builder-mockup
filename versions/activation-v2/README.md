# Discovery version `activation-v2` — snapshot

**Store activation, second version (10 Oct 2026; addenda 031–052, refreshed with 054–059).** Desktop only. The owner lands on the platform's
dashboard; the store's activation — two steps, products and customers — happens in one large modal: upload a file,
review it like a sheet, fix what is flagged, submit.

- **The platform:** the dashboard (sales tiles, Recent Orders), Product Master (Finished Goods) and Customer Management
  (B2B Customers), a sidebar that ☰ opens and closes, the profile menu. Product Master and
  Customer Management stay empty until activation adds products and customers.
- **Activate your store:** a card at the top of the dashboard (0/2 ring, Action needed, the next step, Orders open
  after this, a button named for the next step), an amber dot on the avatar, a row in the profile menu — each opens the
  modal. Customers (step 2) stay locked until products (step 1) are added.
- **The modal:** ① Products · ② Customers; drop an XLSX or CSV file (or try a sample file) → reading → the review
  sheet: column letters, row numbers, red (needs fix) and amber (check) cells whose corner mark shows its note on hover, search, All · Needs fix · Check · Ready,
  Next issue, a fix bar with one-tap answers; dropdowns for GST in rate, Rate per and GST %; search, select or add new
  for Category, Unit and Big unit; a map picker for a customer's address (text + latitude / longitude). Submit sends the
  rows with nothing to fix; the rest wait.
- **Import on the pages:** Import ▾ → Smart import (the modal for that page's step only) · Fixed format: Upload file ·
  Sample file (a CSV the review reads back exactly).
- **Under 1024 px:** a lock — "Set up your store on a computer" · Copy link.

| | |
| --- | --- |
| Built | 2026-10-10; refreshed the same day with addenda 054–059 |
| Status | **Published for the owner's review.** Iterate in `../../` |
| Addenda | `addendum-031` to `addendum-060` (in the module repo's discovery instructions) |
| Rules and tests | `screens/activation/engine.js`; `node --test tests/engine.test.js` (19 tests) |

Open `index.html` (the hub) or `screens/activation.html#reset` to start as a new owner (`#demo`: products saved;
`#done`: both done). No server needed, invented data; progress is kept in this browser's localStorage. An XLSX file is
not read (the step's sample file stands in); a CSV is; other files are refused. What leaves the browser: the map picker loads Leaflet
from cdnjs and OpenStreetMap tiles, and sends what is searched or clicked to OpenStreetMap's Nominatim (in the product:
Google Maps / Places behind a host port).
