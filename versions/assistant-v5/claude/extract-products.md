# Contract — `POST /api/extract`: his product files → products, read by Claude

> Discovery output for Development (assistant-v1, 5 Oct 2026). Feeds SSOT-7 (Collaboration Contract: the
> external call to Anthropic and the bridge endpoint) and SSOT-2 (the ExtractedProduct shape).
> **Status: the call to Claude is tech debt TD-1** (owner, 5 Oct 2026: "park this as tech debt"). In discovery,
> the service worker answers this endpoint with `screens/chat/extract-standin.js` — same request, same reply shape.

## Why

The owner (voice note, 5 Oct 2026): *"ask the user for whatever file, image, anything … send that to Claude via
the API … let Claude figure it out and give back a version of the products based on your database … throw it back
to the user and then upload that product."*

## Request (page → bridge)

```json
POST /api/extract
{ "kind": "products",
  "files": [ { "name": "rate-list.jpg", "type": "image/jpeg", "data": "<base64>" } ] }
```

| Rule | Value |
|---|---|
| Kinds | `products` only in v1 (the bridge's existing `invoices` / `payments` / `costs` kinds are another module's) |
| Files a request | 1–10; together ≤ 12 MB (discovery stand-in limit; production: under Anthropic's 32 MB request limit after base64, so keep ≤ 20 MB raw) |
| `sample: true` | discovery only — reads `seed-data/samples/sharma-agencies-rate-list.csv` and says `"sample": true` |
| Owner | the module's owner identity (store-builder parent SSOT-7 §4a: the mobile, until U-1 sign-in) |

## Reply (bridge → page)

```json
{ "source": "claude" | "stand-in", "model": "claude-opus-5-5" | null, "sample"?: true,
  "files": [ { "name": "...", "kind": "image|pdf|xlsx|text|other", "rows": 14, "columns"?: ["name","mrp",...],
               "unreadable"?: "claude_not_connected" | "no_product_rows" | "not_a_product_file" | "refused" } ],
  "products": [ ExtractedProduct ] }
```

`ExtractedProduct` — the row Claude returns, then matched by the bridge:

| Field | Type | From |
|---|---|---|
| `name` | string | Claude — the product as printed |
| `brand`, `company`, `pack` | string \| null | Claude — only if printed |
| `mrp`, `sell` (his rate), `buy` | number \| null (₹ per piece) | Claude — only if printed; never computed |
| `caseQty` | integer \| null | Claude — pieces per case, if printed |
| `barcode` (8–14 digits), `hsn`, `gst` (%) | string / number \| null | Claude — if printed |
| `file` | string | the bridge — which file the row came from |
| `match` | `{ id, name, pack, by: "barcode"\|"name", score ≤ 1 }` \| null | **the bridge, not Claude** — the catalogue match (barcode first, then name + pack; `extract-standin.js` `match()` is the reference, threshold 0.75) |

Errors: `400 bad_kind | nothing_sent`, `413 too_large`, `503 not_configured` (no API key — the page falls back to
"kept for the team"), `502 unreadable` (refusal or no parsed output). A file that yields no rows is **not** an
error: it comes back in `files` with `unreadable`, and the page keeps the file for the FoodBridge team.

## The call to Claude (production, the bridge — TypeScript, `@anthropic-ai/sdk`)

| Choice | Value | Why |
|---|---|---|
| Model | `claude-opus-5-5` | the current default model; vision + PDFs |
| Output | **structured outputs**: `client.messages.parse({ …, output_config: { format: zodOutputFormat(ExtractedRows), effort: "medium" } })` | schema-valid JSON or nothing. A forced `tool_choice` returns 400 on Opus 5.5, so the existing bridge pattern (`extract.js`: a forced strict tool on `claude-opus-5`) is not carried over |
| Effort | `medium` (Opus 5.5's default — set explicitly); raise only if an eval shows misses | extraction, not reasoning |
| Thinking | omitted (adaptive, always on for Opus 5.5) | `disabled` / budgets are 400 on this model |
| Refusals | check `stop_reason === "refusal"` before reading; send `fallbacks: "default"` with beta `server-side-fallback-2026-07-01` | a refused file → `unreadable: "refused"`, never a guess |
| `max_tokens` | 16000 (non-streaming) | a rate list of a few hundred rows |
| Key | `ANTHROPIC_API_KEY` in the bridge's environment only; never in the page | TD-1 |

Content blocks, one request per file (so one bad file can't spoil the rest):

| His file | Block sent |
|---|---|
| photo (jpg / png / webp / heic→jpg) | `{ type: "image", source: { type: "base64", media_type, data } }` |
| PDF | `{ type: "document", source: { type: "base64", media_type: "application/pdf", data } }` (before the text block) |
| xlsx / csv / tsv / txt | parsed on the bridge (`SB_IMPORT.xlsxRows` / `parseCsv`) and sent as one `text` block of tab-separated rows; a sheet with a clear header row may skip Claude entirely (`tableToProducts`) |

Instruction (system), kept short — the schema carries the shape:

> You read a food distributor's own business paper — a rate list, price list, stock export or invoice — and list
> the products on it. Return only what is printed: a field you cannot read is null; never estimate a price, MRP or
> pack. Prices are in rupees per piece unless the paper says per case — then divide by the case quantity only if
> it is printed. Skip totals, headers, taxes and anything that is not a product. If the paper holds no products,
> return an empty list.

## Honesty rules (carried from mock-platform D-015 "proven numbers only")

1. Nothing is added to his store until he taps **Add all** or **Add these** — the page shows every row first.
2. A photo nobody could read is kept as a raw file in the build (`raw/…`), and the store summary lists "the products
   in your photo" under *the FoodBridge team will follow up on*.
3. The bridge, not Claude, decides catalogue matches, so a match is reproducible and testable.
