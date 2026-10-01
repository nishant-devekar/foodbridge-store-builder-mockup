# Discovery version `ticketing-workspace-v2` — snapshot

Frozen snapshot of the customer success team's discovery prototype, frozen **2026-10-01** per discovery working
rule **R6**. It is `ticketing-workspace-v1` — the team's live panel from `foodbridge-mock-platform` v7 plus a ticket
per store — with one change the owner asked for after a full check against the mock-platform: every sample store's
files are **real** and download, as the mock-platform's panel downloads a build's files.

**What it is:** one screen, in plain HTML/CSS/JS. The team enters the common key, sees every store a distributor
built — newest first — searches it, downloads his Excel, `setup.json` and every file as he sent it, and moves
each store's ticket New → In review → Set up (Set up only once every file has arrived), with tabs to filter by
status. No server, no real API call, no build step: the panel's calls are answered from `seed-data/seed.json` and
the files in `seed-data/files/`.

**Immutable.** Do not edit anything in this folder.

| | |
| --- | --- |
| Frozen | 2026-10-01 |
| Supersedes | [`ticketing-workspace-v1`](../ticketing-workspace-v1/README.md) — its sample stores downloaded a one-line placeholder |
| Published | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/ticketing-workspace-v2/index.html> (public, from [`nishant-devekar/foodbridge-store-builder-mockup`](https://github.com/nishant-devekar/foodbridge-store-builder-mockup)) |
| Source | `foodbridge-mock-platform` @ `3c840e6` → `v7/stores.html`, ported to `screens/built-stores.html`; ticket status added per [addendum-003](../../instructions/addendum-003-ticket-status-v2.md) |
| Addendum | [`../../instructions/addendum-005-ticketing-workspace-v2-real-files.md`](../../instructions/addendum-005-ticketing-workspace-v2-real-files.md) (v1: [addendum-004](../../instructions/addendum-004-freeze-ticketing-workspace-v1.md)) |
| Owner's answers | [`../../instructions/inputs/2026-10-01-owner-answers.md`](../../instructions/inputs/2026-10-01-owner-answers.md): a status per store — yes; a reply to the owner — no; one common key — yes |
| Independent of | the store-builder module's `store-builder-v4`. Nothing here links to it or loads from it; builds would arrive through store-builder's SSOT-7 `StoreBuildFeed` |

| Part | Files |
| --- | --- |
| Wiring hub (screens, access map, ticket transition map) | `index.html` |
| The team panel | `screens/built-stores.html` |
| Three built stores (one still arriving) and their tickets | `seed-data/seed.json` |
| Their files, real: Excel, `setup.json`, photos of paper, a voice note, a 3 MB rate list (listed in 2 pieces) | `seed-data/files/<id>/` |

**Team key:** `fb-team-demo`. Any other key is refused (401), as the real bridge does. Ticket moves are kept in
this browser (`localStorage`, `cs.discovery.tickets`) — the discovery stand-in for the `cs_tickets` the module
will own.

**The sample stores are real builds.** Each was made by the Store Builder prototype's own model and export
(`SB_MODEL`, `SB_EXPORT`, mock-platform `3c840e6`) at its date, India time, with invented people and generated
photos: Vasu Foods (the prototype's sample answers, a route chart and a scanned rate list), Shree Ganesh Traders
(in Hindi; 42 customers, 6 suppliers, 3 staff; two photos and a voice note), and a retailer with no shop name whose
khata photo is still arriving. Their file names are the ones the prototype gives. Every download is byte for byte
the file; the rate list, over 2.5 MB, is listed in 2 pieces and the panel joins them, as with the bridge.

**Verified 2026-10-01** (headless Chrome over HTTP): key gate; tabs All 3 · New 2 · In review 0 · Set up 1; all 11
downloads identical to their files; *Set up* disabled on the store still arriving; 0 console errors.

**Not in this version:** per-person sign-in (owner: one common key for now); any reply to the owner (owner: no).

Serve over HTTP to view — the panel reads its seed with `fetch()`, which browsers block on `file://`:

```
python3 -m http.server 8000
```

then open `index.html`.
