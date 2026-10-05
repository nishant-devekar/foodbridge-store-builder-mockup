# Discovery version `assistant-v7` — snapshot

`assistant-v6` plus Nishant's answers of 5 Oct 2026 (addendum-014):

- After the mobile: a store saved in the chat (as v6) → else an existing FoodBridge account found by the **FoodBridge Digital
  Assistant** ("*Vasu Foods* — is this you?") → else the shop's name. The Digital Assistant is not connected yet, so the chat
  says so in one line (*🔌 Not connected to FoodBridge Digital Assistant*) and asks the shop's name.
- His request shows its ticket step (Requested · In review · Set up · **Ready to use**) in the FoodBridge Team chat and on
  *What reached FoodBridge*. A dashed **Demo · team** row stands in for the Business Panel (`ticketing-workspace-v3`).
- **Ready to use** → "🟢 *Sharma Agencies* is ready to use." and his store's options: Open my store · Create an order · Order
  for tomorrow · Collection request · Send a campaign · Add customers · Add products · Add staff. Each asks the Digital
  Assistant for a login link (a cafex smart link); not connected → the note and a *Sample link*.

| | |
| --- | --- |
| Built | 2026-10-05, from `assistant-v6` |
| Status | **For the owner's review**, with `assistant-v6`. It becomes the accepted version when he accepts it (discovery R6). Until then, treat this folder as frozen: iterate in `../../` (the working discovery) |
| Addendum | `../../instructions/addendum-014-assistant-v7-digital-assistant-scopes.md` (in the module repo) |

Open over HTTP from this folder (`python3 -m http.server 8000`, then `index.html`): a service worker stands in for the
bridge, for Claude and for the Digital Assistant (which refuses: not connected), so it needs no server and makes no real API
call. The tests live with the working discovery (`../../tests/`).
