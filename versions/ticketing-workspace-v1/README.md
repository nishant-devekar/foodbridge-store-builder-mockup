# Discovery version `ticketing-workspace-v1` — snapshot

Frozen snapshot of the customer success team's discovery prototype, frozen **2026-10-01** per discovery working
rule **R6**: the team's live panel from `foodbridge-mock-platform` v7 (in use since 2026-09-26) plus the owner's
2026-10-01 decision that every built store is a ticket — the start of a customer success ticketing and operations
workspace.

**What it is:** one screen, in plain HTML/CSS/JS. The team enters the common key, sees every store a distributor
built — newest first — searches it, downloads his Excel, `setup.json` and every file as he sent it, and moves
each store's ticket New → In review → Set up (Set up only once every file has arrived), with tabs to filter by
status. No server, no real API call, no build step: the panel's calls are answered from `seed-data/seed.json`.

**Immutable.** Do not edit anything in this folder.

| | |
| --- | --- |
| Frozen | 2026-10-01 |
| Published | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/ticketing-workspace-v1/index.html> (public, from [`nishant-devekar/foodbridge-store-builder-mockup`](https://github.com/nishant-devekar/foodbridge-store-builder-mockup)) |
| Source | `foodbridge-mock-platform` @ `3c840e6` → `v7/stores.html`, ported to `screens/built-stores.html`; ticket status added per [addendum-003](../../instructions/addendum-003-ticket-status-v2.md) |
| Addendum | [`../../instructions/addendum-004-freeze-ticketing-workspace-v1.md`](../../instructions/addendum-004-freeze-ticketing-workspace-v1.md) |
| Owner's answers | [`../../instructions/inputs/2026-10-01-owner-answers.md`](../../instructions/inputs/2026-10-01-owner-answers.md): a status per store — yes; a reply to the owner — no; one common key — yes |
| Independent of | the store-builder module's `store-builder-v1`. Nothing here links to it or loads from it; builds would arrive through store-builder's SSOT-7 `StoreBuildFeed` |

| Part | Files |
| --- | --- |
| Wiring hub (screens, access map, ticket transition map) | `index.html` |
| The team panel | `screens/built-stores.html` |
| Three built stores (one still arriving) and their tickets | `seed-data/seed.json` |

**Team key:** `fb-team-demo`. Any other key is refused (401), as the real bridge does. Ticket moves are kept in
this browser (`localStorage`, `cs.discovery.tickets`) — the discovery stand-in for the `cs_tickets` the module
will own. Downloads return a one-line placeholder per file; the seed holds no real files.

**Not in this version:** per-person sign-in (owner: one common key for now); any reply to the owner (owner: no).

Serve over HTTP to view — the panel reads its seed with `fetch()`, which browsers block on `file://`:

```
python3 -m http.server 8000
```

then open `index.html`.
