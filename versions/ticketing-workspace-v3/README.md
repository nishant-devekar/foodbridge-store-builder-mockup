# Discovery version `ticketing-workspace-v3` — snapshot

`ticketing-workspace-v2` plus one step (addendum-006, Nishant, 5 Oct 2026): each store's ticket now runs
New → In review → Set up → **Ready to use**. *Ready to use* is off until the ticket is *Set up* ("Set up first"); a filter tab
counts it. It is the one step that reaches the owner: his chat (`assistant-v7`) switches on his store's options — each a
login link from the FoodBridge Digital Assistant.

| | |
| --- | --- |
| Built | 2026-10-05, from `ticketing-workspace-v2` |
| Status | **For review** with the chat's `assistant-v7`. Treat this folder as frozen; iterate in `../../` |
| Addendum | `../../instructions/addendum-006-ready-to-use-v3.md` (in the module repo) |
| Feeds | SSOT-1 (`MARK_READY`, only from `setUp`), SSOT-2 (`status: ready`), SSOT-7 (a readiness read this module provides; the chat app requires it — never `cs_tickets`) |

Open over HTTP from this folder, then `screens/built-stores.html`; the team key is `fb-team-demo`. Statuses persist in this
browser only.
