/* Assistant discovery · the stand-in for Claude reading a product file (5 Oct 2026).

   The owner (voice note, 5 Oct 2026): "when it comes to products, ask the user for whatever file, image,
   anything; send it to Claude via the API; let Claude figure it out and give back a version of the
   products based on your database ... how you build that Claude part comes later."

   The Claude API key is parked as tech debt (owner, 5 Oct 2026; addendum-002 TD-1), so in this
   discovery version nothing calls Claude. The page sends the files to /api/extract exactly as it will in
   production (../../claude/extract-products.md is that contract), and the discovery service worker
   answers with THIS file:
     - a spreadsheet (xlsx / csv / tsv / txt) is really read: its header row is found, its columns are
       mapped to the product fields, and every row is matched to the catalogue (barcode, then name + pack);
     - a photo or a PDF cannot be read without Claude, so it comes back `unreadable: "claude_not_connected"`
       -- never a guess. The page keeps the file for the FoodBridge team and offers a labelled sample read.
   What comes back has the shape Claude's tool will return, so the page does not change when Claude arrives.

   Pure: no DOM, no fetch. Runs in the service worker (importScripts) and under node (the tests). */

(function (root) {
  "use strict";

  const NODE = typeof module !== "undefined" && module.exports;
  const IMP = NODE ? require("../sb/import.js") : root.SB_IMPORT;

  /* Header words, per field. A rate list from Tally, Marg, Busy, a company's Excel or a hand-made sheet. */
  const HEAD = {
    name: /^(item|item ?name|items|product|product ?name|products|description|item ?description|particulars|name|sku ?name|stock ?item|name ?of ?item|माल|सामान|आइटम)$/i,
    brand: /^(brand|brand ?name)$/i,
    company: /^(company|manufacturer|mfr|mfg|principal|कंपनी)$/i,
    pack: /^(pack|pack ?size|size|weight|wt|net ?wt|unit|uom|packing|qty ?per ?pack|पैक)$/i,
    mrp: /^(mrp|m\.?r\.?p\.?|mrp ?\(?₹?\)?|mrp ?rs\.?|max ?retail ?price)$/i,
    sell: /^(rate|price|selling ?price|sell ?price|sale ?rate|sales ?rate|ptr|dealer ?price|dp|net ?rate|our ?rate|rate ?\(?₹?\)?|rate ?rs\.?|wholesale ?price|retailer ?price|भाव|रेट)$/i,
    buy: /^(purchase ?rate|purchase ?price|cost|cost ?price|landing|landing ?cost|buy ?price|pur\.? ?rate|ptd|ptss)$/i,
    caseQty: /^(case|case ?qty|qty ?\/ ?case|pcs ?\/ ?case|per ?case|units ?per ?case|carton|carton ?qty|box ?qty|outer|pcs ?per ?carton)$/i,
    barcode: /^(barcode|ean|ean ?code|upc|gtin|bar ?code)$/i,
    gst: /^(gst|gst ?%|gst ?rate|tax|tax ?%|igst ?%?)$/i,
    hsn: /^(hsn|hsn ?code|hsn\/sac)$/i,
  };
  const SKIP_ROW = /^(total|grand ?total|sub ?total|s\.? ?no|sr\.? ?no|\s*)$/i;

  function cellKey(v) { return String(v == null ? "" : v).replace(/[\s_]+/g, " ").replace(/[.:]+$/, "").trim(); }
  function headOf(cell) {
    const k = cellKey(cell);
    if (!k) return null;
    for (const f in HEAD) if (HEAD[f].test(k)) return f;
    return null;
  }
  /* "₹1,250.00", "Rs. 55/-", "55" → 55; anything else → null. */
  function money(v) {
    const s = String(v == null ? "" : v).replace(/(rs\.?|inr|₹|\/-)/gi, "").replace(/,/g, "").trim();
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    const n = Number(s);
    return n > 0 && n < 1e7 ? Math.round(n * 100) / 100 : null;
  }
  function count(v) { const n = money(v); return n != null && n === Math.round(n) && n >= 1 && n <= 5000 ? n : null; }

  /* The header: the first row in the top ten with a name column and at least one more known column. */
  function findHeader(rows) {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const map = {};
      rows[i].forEach(function (c, j) { const f = headOf(c); if (f && map[f] == null) map[f] = j; });
      if (map.name != null && Object.keys(map).length >= 2) return { at: i, map: map };
    }
    return null;
  }

  /* A table → product rows, in the shape Claude's tool returns (claude/extract-products.md). */
  function tableToProducts(rows) {
    const h = findHeader(rows || []);
    if (!h) return null;
    const out = [];
    rows.slice(h.at + 1).forEach(function (r) {
      const get = function (f) { return h.map[f] != null ? String(r[h.map[f]] == null ? "" : r[h.map[f]]).trim() : ""; };
      const name = get("name").replace(/\s+/g, " ");
      if (!name || SKIP_ROW.test(name) || /^\d+(\.\d+)?$/.test(name)) return;
      out.push({
        name: name, brand: get("brand") || null, company: get("company") || null, pack: get("pack") || null,
        mrp: money(get("mrp")), sell: money(get("sell")), buy: money(get("buy")), caseQty: count(get("caseQty")),
        barcode: /^\d{8,14}$/.test(get("barcode")) ? get("barcode") : null,
        gst: (function (g) { const n = money(String(g).replace("%", "")); return n != null && n <= 40 ? n : null; })(get("gst")),
        hsn: /^\d{4,8}$/.test(get("hsn")) ? get("hsn") : null,
      });
    });
    return { columns: Object.keys(h.map), rows: out };
  }

  /* ── matching to the catalogue ("a version of the products based on your database") ── */
  const STOP = { the: 1, and: 1, of: 1, pack: 1, new: 1, rs: 1, mrp: 1, pcs: 1, pc: 1, nos: 1, x: 1 };
  function packKey(s) {
    s = String(s || "").toLowerCase().replace(/\s+/g, "");
    let m = s.match(/(\d+(?:\.\d+)?)(kg|kgs|g|gm|gms|gram|grams|l|ltr|litre|liter|ml)\b/);
    if (m) {
      let n = Number(m[1]), u = m[2];
      if (/^(kg|kgs)$/.test(u)) { n *= 1000; u = "g"; } else if (/^(g|gm|gms|gram|grams)$/.test(u)) u = "g";
      else if (/^(l|ltr|litre|liter)$/.test(u)) { n *= 1000; u = "ml"; } else u = "ml";
      return n + u;
    }
    m = s.match(/(?:₹|rs\.?)(\d+)|(\d+)(?:rs|\/-)/);
    if (m) return "₹" + (m[1] || m[2]);
    return "";
  }
  function words(s) {
    return String(s || "").toLowerCase().replace(/[’'`]/g, "").replace(/(\d)(kg|kgs|g|gm|gms|l|ltr|ml|rs)\b/g, "$1 $2")
      .split(/[^a-z0-9ऀ-ॿ]+/).filter(function (w) { return w && !STOP[w] && !/^\d+$/.test(w) && !/^(kg|kgs|g|gm|gms|l|ltr|ml|ltrs|litre)$/.test(w); });
  }
  function score(p, it) {
    const a = words(p.name + " " + (p.brand || ""));
    const b = words(it.name + " " + (it.brand || ""));
    if (!a.length || !b.length) return 0;
    const bs = {}; b.forEach(function (w) { bs[w] = 1; });
    const hit = a.filter(function (w) { return bs[w] || Object.keys(bs).some(function (x) { return x.length > 4 && (x.indexOf(w) === 0 || w.indexOf(x) === 0); }); }).length;
    let sc = hit / Math.max(a.length, Math.min(b.length, a.length + 1));
    const pk = packKey(p.pack || p.name), ik = packKey(it.pack);
    if (pk && ik) sc += pk === ik ? 0.25 : -0.35;
    return sc;
  }
  function match(cat, p) {
    if (p.barcode) {
      const hit = cat.items.find(function (it) { return it.barcode === p.barcode; });
      if (hit) return { id: hit.id, name: hit.name, pack: hit.pack, by: "barcode", score: 1 };
    }
    let best = null, bs = 0;
    cat.items.forEach(function (it) { if (it.loose) return; const s = score(p, it); if (s > bs) { bs = s; best = it; } });
    return best && bs >= 0.75 ? { id: best.id, name: best.name, pack: best.pack, by: "name", score: Math.min(1, Math.round(bs * 100) / 100) } : null;
  }

  function kindOf(name, type) {
    const ext = (String(name).toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || "";
    if (/^(xlsx|xlsm)$/.test(ext)) return "xlsx";
    if (/^(csv|tsv|txt)$/.test(ext)) return "text";
    if (/^image\//.test(type || "") || /^(jpg|jpeg|png|webp|heic|heif|gif|bmp)$/.test(ext)) return "image";
    if (ext === "pdf" || type === "application/pdf") return "pdf";
    return "other";
  }

  /* files: [{ name, type, bytes: Uint8Array }] → the reply /api/extract gives (claude/extract-products.md). */
  async function read(cat, files) {
    const out = { source: "stand-in", model: null, files: [], products: [] };
    for (const f of files || []) {
      const kind = kindOf(f.name, f.type);
      const rec = { name: f.name, kind: kind, rows: 0 };
      let table = null;
      try {
        if (kind === "xlsx") table = tableToProducts(await IMP.xlsxRows(f.bytes));
        else if (kind === "text") table = tableToProducts(IMP.parseCsv(new TextDecoder().decode(f.bytes)));
      } catch (e) { table = null; }
      if (kind === "image" || kind === "pdf") rec.unreadable = "claude_not_connected";
      else if (!table || !table.rows.length) rec.unreadable = kind === "other" ? "not_a_product_file" : "no_product_rows";
      else {
        table.rows.forEach(function (p) { p.file = f.name; p.match = match(cat, p); out.products.push(p); });
        rec.rows = table.rows.length;
        rec.columns = table.columns;
      }
      out.files.push(rec);
    }
    return out;
  }

  const API = { read: read, tableToProducts: tableToProducts, match: match, packKey: packKey, kindOf: kindOf, money: money };
  if (NODE) module.exports = API;
  else root.ASSIST_EXTRACT_STANDIN = API;
})(typeof window !== "undefined" ? window : globalThis);
