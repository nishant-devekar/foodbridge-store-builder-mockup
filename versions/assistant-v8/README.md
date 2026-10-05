# Discovery version `assistant-v8` — snapshot

`assistant-v7` plus Nishant's ask of 5 Oct 2026 (addendum-016): **a comment on every question, typed or spoken — never a forced
selection.**

- Anything typed or said that a question cannot take as its answer is that question's comment: "📝 Noted." and the next
  question. Not the mobile (it is who he is), the summary or the end. "No" where a question has a way to say no (contacts:
  Skip; products: Later) is still that answer.
- 🎤 in the message bar where the box is empty: speech to text where the browser has it (his words land in the box, to check
  and send); else the recording is kept for the team as a voice note — that question's comment.
- The team reads each comment with its question: the Excel's **Comments** sheet, and `setup.json`.

| | |
| --- | --- |
| Built | 2026-10-05, from `assistant-v7` |
| Status | **For the owner's review.** Treat this folder as frozen; iterate in `../../` |
| Addendum | `../../instructions/addendum-016-assistant-v8-comment-on-every-question.md` (in the module repo) |

Open over HTTP from this folder (`python3 -m http.server 8000`, then `index.html`). The browser's speech to text sends audio to
the browser maker's service; in production the Digital Assistant transcribes.
