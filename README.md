# foodbridge-store-builder-mockup

Published copies of the Store Builder module's frozen discovery versions, served by GitHub Pages:

Joined (both versions side by side, a build arriving as a New ticket through Store Builder's contract):
<https://nishant-devekar.github.io/foodbridge-store-builder-mockup/joined.html> — from the source repo's
`discovery/screens/joined.html` (parent addendum-004).

| Version | Live | What |
| --- | --- | --- |
| `assistant-v8` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/assistant-v8/screens/chat.html> | **for the owner's review** (5 Oct 2026): v7 + a comment on every question, typed or spoken (🎤) — never a forced choice; the team reads them in the Excel's *Comments* sheet |
| `assistant-v7` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/assistant-v7/screens/chat.html> | **what comes after v6** (5 Oct 2026): the account lookup and login links through the FoodBridge Digital Assistant (not connected yet: says so, a sample link); *Ready to use* (the *Demo · team* row stands in for the panel) switches on the store's options |
| `assistant-v6` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/assistant-v6/screens/chat.html> | **for the owner's review** (5 Oct 2026): mobile then shop name, multi-select answers, "anything else?" after each section, every message one line, stops at the store request; *Give feedback* tagged `assistant-v6` |
| `assistant-v5` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/assistant-v5/screens/chat.html> | **the FoodBridge Assistant** (module `assistant`, 5 Oct 2026): Store Builder as a WhatsApp-style chat, WhatsApp Web on a computer; *Give feedback* posts to the FoodBridge feedback store — the only call that leaves the browser. Its links to `../../instructions/` are plain text here (that repo is private) |
| `store-builder-v4` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/store-builder-v4/index.html> | the owner's flow, desktop and phone, end to end, as the mock-platform: the bridge's own rules, a FoodBridge online / down switch, iPhones as the real page |
| `store-builder-v3` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/store-builder-v3/index.html> | superseded by v4: the stand-in picker hid the iPhone setting; no “down” state |
| `store-builder-v2` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/store-builder-v2/index.html> | superseded by v3: no stand-in picker on the phone layout |
| `store-builder-v1` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/store-builder-v1/index.html> | superseded by v2: its step screens held the desktop layout on a phone |
| `ticketing-workspace-v3` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/ticketing-workspace-v3/index.html> | v2 + a fourth step, **Ready to use**, only after Set up — it switches on the owner's store options (key `fb-team-demo`) |
| `ticketing-workspace-v2` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/ticketing-workspace-v2/index.html> | the customer success team's panel, a ticket per store (key `fb-team-demo`); every sample file real |
| `ticketing-workspace-v1` | <https://nishant-devekar.github.io/foodbridge-store-builder-mockup/versions/ticketing-workspace-v1/index.html> | superseded by v2: placeholder downloads |

HTML/CSS/JS only, no server, no real API call, invented data. Each version folder is a byte-for-byte copy of
`exagon-ai/foodbridge-module-store-builder` → `modules/<submodule>/discovery/versions/<version>/` and is
immutable; see each folder's `README.md`. The links in those READMEs to `../../instructions/…` point into the
source repo.
