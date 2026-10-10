// Store Activation discovery — the rules in screens/activation/engine.js. Run: node --test tests/engine.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const E = require("../screens/activation/engine.js");

const seedJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../seed-data/seed.json"), "utf8"));
const seedJs = (() => { const w = {}; new Function("window", fs.readFileSync(path.join(__dirname, "../seed-data/seed.js"), "utf8"))(w); return w.SEED; })();

test("seed.js mirrors seed.json", () => assert.deepEqual(seedJs, seedJson));

test("a new store: 0 of 6, the next step is items, order is locked", () => {
  const s = E.initialState();
  assert.deepEqual(E.progress(s), { done: 0, total: 6, score: 0, percent: 0 });
  assert.deepEqual(E.nextStep(s), { id: "items", mode: "start" });
  assert.equal(E.isLocked(s, "order"), true);
  assert.equal(E.lockNote(s, "deliver"), "after your first order");
  assert.equal(E.lockNote(s, "order"), "after products and customers");
});

test("while products are processed, the next step moves on to customers; processed rows join the sheet to check", () => {
  const s = E.initialState();
  s.items.job = { kind: "file", startedAt: 1000, ms: 6000, sources: [{ kind: "file", label: "Rate list Oct.pdf" }], rows: [{ id: 1, name: "Salt 1 kg", unit: "bag" }, { id: 2, name: "Tea 250g", unit: "box" }] };
  assert.equal(E.isWaiting(s, "items"), true);
  assert.deepEqual(E.nextStep(s), { id: "customers", mode: "start" });
  const mid = E.jobProgress(s.items.job, 4000);   // halfway: stage 3 of 4, one product found so far; the same stages for every way
  assert.deepEqual([mid.stages[mid.stage], mid.found, mid.done], ["Finding products", 1, false]);
  assert.equal(E.tick(s, 3000), false);
  assert.equal(E.tick(s, 7000), true);
  assert.equal(s.items.job, null);
  assert.equal(s.items.sheet.length, 2);
  assert.deepEqual(E.nextStep(s), { id: "items", mode: "review" });   // only the owner can save them
  s.items.saved = s.items.sheet; s.items.sheet = [];
  assert.equal(E.isDone(s, "items"), true);
});

test("the sheet: what needs a fix in the rate list, with one-tap fixes; one GST question for the whole list", () => {
  const rows = seedJson.sources.file.rows.map((r, i) => ({ id: i + 1, ...r }));
  const own = rows.map((r) => E.rowIssues(r, rows).filter((i) => !i.batch)).filter((x) => x.length).map((x) => x[0]);
  assert.deepEqual(own.map((i) => i.col), ["rate", "name", "perBig", "gst", "bigUnit", "name"]);
  assert.deepEqual(own[0].fixes.map((f) => f.value), ["410", "470"]);      // the two readings of a smudged rate
  assert.equal(own[2].msg, "How many packets in a carton?");
  assert.deepEqual(own[3].fixes.map((f) => f.value), ["5", "18"]);          // an old 12 % slab → the nearest valid ones
  assert.match(own[5].msg, /row 2,/);                                       // "Glucose bisc. 100 gm" = "Glucose biscuit 100g"
  assert.deepEqual(E.sheetSummary(rows), { total: 14, fix: 6, ok: 1, noRate: 1, taxAsk: 13, questions: 7 });
  rows[1].rate = "410"; rows[6].name = "Sugar 1 kg"; rows[7].perBig = "40"; rows[10].gst = "18"; rows[11].bigUnit = "bag";
  E.setTaxAll(rows, "extra");                                                // answered once, for every rate on the list
  const merged = E.mergeRow(rows, rows[12]);
  assert.equal(merged.length, 13);
  assert.deepEqual(E.splitForSave(merged.concat([{ id: 99, name: "" }])).broken, []);   // an empty row is dropped, not broken
});

test("two units: the rate is quoted for one, the other is derived; a whole number of small units in a big one", () => {
  const r = { name: "Glucose biscuit 100g", baseUnit: "packet", bigUnit: "carton", perBig: "120", rate: "480", rateUnit: "carton", gst: "5", taxIncl: "extra" };
  assert.deepEqual(E.prices(r), { big: 480, base: 4 });
  assert.deepEqual(E.prices({ ...r, rate: "4", rateUnit: "packets" }), { base: 4, big: 480 });   // quoted per packet
  assert.deepEqual(E.rowIssues(r, [r]), []);
  assert.equal(E.rowIssues({ ...r, perBig: "1" }, [])[0].col, "perBig");          // a bigger unit holds 2 or more
  assert.equal(E.rowIssues({ ...r, rateUnit: "dozen" }, [])[0].col, "rateUnit");   // the rate names neither unit
  assert.equal(E.rowIssues({ ...r, gst: "" }, [])[0].col, "gst");                  // GST is a must-have
  const spoken = E.parseSpeech(seedJson.voiceExample).map((x, i) => ({ id: i + 1, ...x }));
  assert.equal(E.sheetSummary(spoken).questions, 4);   // GST included? · GST rate (once, for all 4) · Maggi's unit · how many in a carton
  assert.deepEqual([E.taxFlag("GST included"), E.taxFlag("+ GST"), E.taxFlag("")], [true, false, null]);
  assert.deepEqual(E.rowIssues({ ...r, rate: "", taxIncl: "" }, []), []);          // no rate yet: nothing to say about GST
});

test("keep both: a duplicate the owner keeps is no longer flagged; numbers read like a sheet does", () => {
  const base = { baseUnit: "packet", bigUnit: "carton", perBig: "40", gst: "5" };
  const rows = [{ id: 1, name: "Tea 250g", ...base }, { id: 2, name: "tea 250 gm", ...base, rate: "₹4,400", rateUnit: "carton", taxIncl: "extra" }];
  assert.equal(E.rowIssues(rows[1], rows).length, 1);
  rows[1].keepBoth = true;
  assert.equal(E.rowIssues(rows[1], rows).length, 0);
  assert.equal(E.num("₹4,400"), 4400);
  assert.ok(Number.isNaN(E.num("4?0")));
});

test("a duplicate of a product already saved is still caught after a partial save", () => {
  const unit = { baseUnit: "packet", bigUnit: "carton", perBig: "120", gst: "5" };
  const saved = [{ id: 1, name: "Glucose biscuit 100g", ...unit, rate: "480", rateUnit: "carton", taxIncl: "extra", hsn: "" }];
  const rows = [{ id: 2, name: "Glucose bisc. 100 gm", ...unit, rate: "480", rateUnit: "carton", taxIncl: "extra", hsn: "1905" }];
  const i = E.rowIssues(rows[0], rows, saved);
  assert.equal(i.length, 1);
  assert.match(i[0].msg, /Already saved/);
  assert.deepEqual(E.splitForSave(rows, saved).good, []);
  assert.deepEqual(E.mergeRow(rows, rows[0], saved), []);
  assert.equal(saved[0].hsn, "1905");   // merge fills the saved product's gap
});

test("speech to rows: name, both units, rate and the unit it is for", () => {
  const rows = E.parseSpeech(seedJson.voiceExample);
  assert.deepEqual(rows.map((r) => [r.name, r.baseUnit, r.bigUnit, r.perBig, r.rate, r.rateUnit]), [
    ["Parle-G 100g", "packet", "carton", "96", "720", "carton"], ["Tata salt 1 kg", "packet", "bag", "25", "560", "bag"],
    ["Fortune sunflower oil 1 L", "bottle", "peti", "12", "1850", "peti"], ["Maggi 70g", "", "carton", "", "1060", "carton"]
  ]);
  assert.deepEqual(E.parseSpeech("bourbon 120 gram 4 rupees per packet aur jaggery 1 kilo").map((r) => [r.name, r.baseUnit, r.rate, r.rateUnit]),
    [["Bourbon 120g", "", "4", "packet"], ["Jaggery 1 kg", "", "", ""]]);
  assert.deepEqual(E.parseSpeech("12 34, , 500"), []);   // nothing that names a product
});

test("waiting on processing with nothing else open says so", () => {
  const s = E.initialState();
  s.items.job = { kind: "zoho", startedAt: 0, ms: 3000, sources: [], rows: [] }; s.customers.done = true; s.plan.on = true;
  assert.deepEqual(E.nextStep(s), { id: "items", mode: "waiting" });
});

test("items and customers unlock the order; the order unlocks deliver and get paid", () => {
  const s = E.initialState();
  s.items.saved = [{ id: 1 }]; s.customers.done = true;
  assert.equal(E.isLocked(s, "order"), false);
  assert.deepEqual(E.nextStep(s), { id: "order", mode: "start" });
  s.order = { lines: [{ qty: 10, price: 480 }, { qty: 4, price: 410 }] };
  assert.equal(E.orderTotal(s.order.lines), 6440);
  // GST: "+ GST extra" adds it on top; "GST included" holds it inside the rate
  assert.equal(E.orderTotal([{ qty: 2, price: 480, gst: "5", taxIncl: "extra" }]), 1008);
  assert.equal(E.orderTax([{ qty: 2, price: 480, gst: "5", taxIncl: "extra" }]), 48);
  assert.equal(E.orderTotal([{ qty: 2, price: 480, gst: "5", taxIncl: "incl" }]), 960);
  assert.equal(E.orderTax([{ qty: 2, price: 480, gst: "5", taxIncl: "incl" }]), 45.71);
  assert.equal(E.isLocked(s, "deliver"), false);
  assert.equal(E.isLocked(s, "paid"), false);
  assert.deepEqual(E.nextStep(s), { id: "deliver", mode: "start" });
});

test("all six done: next step is none, 6 of 6, the team's score is 100", () => {
  const s = E.initialState();
  s.items.saved = [{ id: 1 }]; s.customers.done = true; s.order = { lines: [] };
  s.delivery.status = "sent"; s.payment.status = "link"; s.plan.on = true;
  assert.equal(E.nextStep(s), null);
  assert.deepEqual(E.progress(s), { done: 6, total: 6, score: 100, percent: 100 });
});

test("the assistant maps questions to steps, and nothing else", () => {
  assert.equal(E.topicFor("How do I deliver an order?"), "deliver");   // the specific topic wins over "order"
  assert.equal(E.topicFor("get paid for an order"), "paid");
  assert.equal(E.topicFor("make a new order"), "order");
  assert.equal(E.topicFor("my driver"), "deliver");
  assert.equal(E.topicFor("udhaar kaise collect karein"), "paid");
  assert.equal(E.topicFor("change a price"), "items");
  assert.equal(E.topicFor("hello"), null);
});

test("the first order's lock names only what is still missing (addendum-025)", () => {
  const s = E.initialState();
  s.items.saved = [{ id: 1, name: "Salt 1 kg" }];
  assert.equal(E.lockNote(s, "order"), "after your customers");
  s.items.saved = []; s.customers.done = true;
  assert.equal(E.lockNote(s, "order"), "after your products");
});
