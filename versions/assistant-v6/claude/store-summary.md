# Contract — the store, summed up (Claude words the facts)

> Discovery output for Development (assistant-v1, 5 Oct 2026). Feeds SSOT-5 (Workflow: the summary step) and
> SSOT-7 (the external call). **Tech debt TD-1**: in discovery the wording is a template (`onboard.js`
> `summaryText`); no call to Claude is made.

The owner (voice note, 5 Oct 2026): *"once all of these things has happened, let again Claude define the whole
situation of the store. If basic customers have come, basic products have come, then immediately throw some option
to the user: your store is created, what would you like to do next?"*

## Split of work

| Part | Who | Why |
|---|---|---|
| The facts | the module (`onboard.js` `facts()`: Store Setup's `progress()` / `missing()` counts, plus unsorted contacts, products without a price, unread photos) | proven numbers only — Claude never counts |
| Is the store ready to use? | the module (`ready()`: ≥ 1 customer and ≥ 1 product) | a rule, not a judgement |
| The words | Claude (production) / the template (discovery) | warm, short, his language |

## The call (production)

`POST /api/summary { facts }` → `{ text, source: "claude" | "template" }`.

| Choice | Value |
|---|---|
| Model | `claude-opus-5-5`, `output_config: { effort: "low" }` — wording, not reasoning |
| Output | plain text, ≤ 8 lines, WhatsApp marks (`*bold*`) only |
| Instruction | "Write a short WhatsApp message to a distributor about the store he just set up. Use only the facts given; do not add numbers. Name what is missing as what the FoodBridge team will follow up on. No greeting beyond his first name." |
| Facts in | the `facts` object only (no contact names, no phone numbers — nothing personal leaves for wording) |
| Fallback | any error, refusal or timeout over 4 s → the template text; the page never waits on Claude to show the summary |
