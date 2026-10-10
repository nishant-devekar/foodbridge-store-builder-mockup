// Store Activation discovery — the rules in screens/activation/engine.js. Run: node --test tests/engine.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const E = require("../screens/activation/engine.js");

const seedJson = JSON.parse(fs.readFileSync(path.join(__dirname, "../seed-data/seed.json"), "utf8"));
const seedJs = (() => { const w = {}; new Function("window", fs.readFileSync(path.join(__dirname, "../seed-data/seed.js"), "utf8"))(w); return w.SEED; })();

test("seed.js mirrors seed.json", () => assert.deepEqual(seedJs, seedJson));

test("a new store: two steps (addendum-034), 0 of 2, the next step is items; customers locked until products are added (addendum-057)", () => {
  const s = E.initialState();
  assert.deepEqual(E.STEPS.map((st) => st.id), ["items", "customers"]);
  assert.deepEqual(E.progress(s), { done: 0, total: 2, score: 0, percent: 0 });
  assert.deepEqual(E.nextStep(s), { id: "items", mode: "start" });
  assert.equal(E.isLocked(s, "items"), false);
  assert.equal(E.isLocked(s, "customers"), true);
  assert.equal(E.lockNote(s, "customers"), "After you add your products");
  s.items.sheet = [{ id: 1, name: "Salt 1 kg" }];   // products waiting in the sheet are not added yet
  assert.equal(E.isLocked(s, "customers"), true);
  s.items.saved = [{ id: 1 }];
  assert.equal(E.isLocked(s, "customers"), false);
  assert.equal(E.lockNote(s, "customers"), "");
});

test("while products are processed, customers stay locked and the next step waits; processed rows join the sheet to check", () => {
  const s = E.initialState();
  s.items.job = { kind: "file", startedAt: 1000, ms: 6000, sources: [{ kind: "file", label: "Rate list Oct.pdf" }], rows: [{ id: 1, name: "Salt 1 kg", unit: "bag" }, { id: 2, name: "Tea 250g", unit: "box" }] };
  assert.equal(E.isWaiting(s, "items"), true);
  assert.deepEqual(E.nextStep(s), { id: "items", mode: "waiting" });   // customers open only after products (addendum-057)
  const mid = E.jobProgress(s.items.job, 4000);   // halfway: stage 3 of 4, one product found so far; the same stages for every way
  assert.deepEqual([mid.stages[mid.stage], mid.found, mid.done], ["Finding products", 1, false]);
  assert.equal(E.tick(s, 3000), false);
  assert.equal(E.tick(s, 7000), true);
  assert.equal(s.items.job, null);
  assert.equal(s.items.sheet.length, 2);
  assert.deepEqual(E.nextStep(s), { id: "items", mode: "review" });   // only the owner can save them
  s.items.saved = s.items.sheet; s.items.sheet = [];
  assert.equal(E.isDone(s, "items"), true);
  assert.deepEqual(E.nextStep(s), { id: "customers", mode: "start" });
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
  s.items.job = { kind: "file", startedAt: 0, ms: 3000, sources: [], rows: [] }; s.customers.done = true;
  assert.deepEqual(E.nextStep(s), { id: "items", mode: "waiting" });
});

test("order money: totals, with GST extra or included", () => {
  assert.equal(E.orderTotal([{ qty: 10, price: 480 }, { qty: 4, price: 410 }]), 6440);
  // GST: "+ GST extra" adds it on top; "GST included" holds it inside the rate
  assert.equal(E.orderTotal([{ qty: 2, price: 480, gst: "5", taxIncl: "extra" }]), 1008);
  assert.equal(E.orderTax([{ qty: 2, price: 480, gst: "5", taxIncl: "extra" }]), 48);
  assert.equal(E.orderTotal([{ qty: 2, price: 480, gst: "5", taxIncl: "incl" }]), 960);
  assert.equal(E.orderTax([{ qty: 2, price: 480, gst: "5", taxIncl: "incl" }]), 45.71);
});

test("products, then customers: 1 of 2, then both done — next step is none, the team's score is 100", () => {
  const s = E.initialState();
  s.items.saved = [{ id: 1 }];
  assert.deepEqual(E.progress(s), { done: 1, total: 2, score: 50, percent: 50 });
  assert.deepEqual(E.nextStep(s), { id: "customers", mode: "start" });
  s.customers.done = true;
  assert.equal(E.nextStep(s), null);
  assert.deepEqual(E.progress(s), { done: 2, total: 2, score: 100, percent: 100 });
});

test("the assistant maps questions to the two steps, and nothing else", () => {
  assert.equal(E.topicFor("change a price"), "items");
  assert.equal(E.topicFor("add a shop"), "customers");
  assert.equal(E.topicFor("make a new order"), null);   // orders are not an activation step any more (addendum-034)
  assert.equal(E.topicFor("hello"), null);
});

test("customers file review: 3 need a fix, 3 to check, 4 ready; submit sends the 7 with nothing to fix (addendum-036)", () => {
  const rows = seedJson.sources.customersFile.rows.map((r, i) => ({ id: i + 1, ...r }));
  assert.deepEqual(E.reviewCounts("customers", rows, []), { total: 10, fix: 3, check: 3, ready: 4 });
  const msgs = (i) => E.checkRow("customers", rows[i], rows, []).map((x) => x.level + ": " + x.msg);
  assert.deepEqual(msgs(2), ["fix: Phone needs 10 digits"]);
  assert.deepEqual(msgs(3), ["check: Email looks wrong"]);
  assert.deepEqual(msgs(4), ["fix: Name missing"]);
  assert.deepEqual(msgs(8), ["check: Same phone as row 2"]);
  assert.equal(E.phoneDigits("+91 99230 45678"), "9923045678");
  const split = E.splitForSubmit("customers", rows, []);
  assert.equal(split.good.length, 7);
  assert.deepEqual(split.broken.map((r) => r.id), [3, 5, 7]);
  // a phone already saved is a check, and "Keep both" clears it
  const again = [{ id: 1, name: "Sharma", phone: "9822041237", email: "", address: "Pune" }];
  assert.equal(E.checkRow("customers", again[0], again, split.good)[0].msg, "Already added as “Sharma Kirana Store”");
  again[0].keepBoth = true;
  assert.deepEqual(E.checkRow("customers", again[0], again, split.good), []);
});

test("products review: the sheet's problems block, rate / category / HSN / look-alikes are checks (addendums 036, 040)", () => {
  const rows = seedJson.sources.file.rows.map((r, i) => ({ id: i + 1, ...r }));
  const c = E.reviewCounts("items", rows, []);
  assert.equal(c.total, c.fix + c.check + c.ready);
  const levels = (r) => E.checkRow("items", r, [r], []).map((x) => x.level + ": " + x.msg);
  assert.deepEqual(levels({ name: "Salt 1 kg", baseUnit: "packet", bigUnit: "bag", perBig: "25", rate: "", rateUnit: "", gst: "5", taxIncl: "", mrp: "", hsn: "", category: "" }),
    ["check: Rate missing", "check: Category missing"]);
  assert.deepEqual(levels({ name: "Salt 1 kg", baseUnit: "packet", bigUnit: "bag", perBig: "25", rate: "560", rateUnit: "bag", gst: "5", taxIncl: "extra", mrp: "x", hsn: "", category: "Salt" }),
    []);   // no MRP column, so no MRP check (addendum-040)
  assert.ok(!E.PRODUCT_COLS.some((c) => c.key === "mrp"));
  const split = E.splitForSubmit("items", rows, []);
  assert.equal(split.good.length + split.broken.length, c.total);
  assert.equal(split.broken.length, c.fix);
});

test("a CSV becomes rows: the header row is matched to the columns, in any order (addendum-036)", () => {
  const items = E.readCSV('Item Name,Category,Unit,Case unit,Units in case,Price,Rate per,GST %,MRP\n"Parle-G, 100g",Biscuits,packet,carton,96,720,carton,5,10\n', "items");
  assert.deepEqual(items[0], { name: "Parle-G, 100g", category: "Biscuits", baseUnit: "packet", bigUnit: "carton", perBig: "96", rate: "720", rateUnit: "carton", gst: "5", taxIncl: "", hsn: "" });   // MRP not read (addendum-040)
  const people = E.readCSV("Mobile,Shop name,Area\r\n98220 41237,Sharma Kirana Store,Shivaji Nagar\r\n", "customers");
  assert.deepEqual(people, [{ name: "Sharma Kirana Store", phone: "98220 41237", email: "", address: "Shivaji Nagar" }]);
  assert.equal(E.readCSV("Qty,Amount\n1,2\n", "items"), null);   // no column names the product
});

test("a new owner is 0 of 2; customers count as done once any is saved (addendum-036)", () => {
  const s = E.initialState();
  assert.equal(s.v, 5);
  assert.deepEqual(E.progress(s), { done: 0, total: 2, score: 0, percent: 0 });
  s.customers.saved = [{ id: 1, name: "Gupta Stores" }];
  assert.equal(E.isDone(s, "customers"), true);
});

test("the review's dropdowns offer what the checks accept (addendum-039)", () => {
  const row = { name: "Salt 1 kg", baseUnit: "packet", bigUnit: "bag", perBig: "25", rate: "560", rateUnit: "", gst: "", taxIncl: "", mrp: "", hsn: "", category: "Salt" };
  const vals = (k) => E.colOptions("items", k, row, [row]).options.map((x) => x.value);
  assert.deepEqual(vals("taxIncl"), ["extra", "incl"]);
  assert.deepEqual(vals("gst"), ["0", "5", "18", "40"]);
  assert.deepEqual(vals("rateUnit"), ["bag", "packet"]);
  assert.equal(E.colOptions("items", "taxIncl", row, [row]).kind, "select");
  assert.equal(E.colOptions("items", "category", row, [row]).kind, "suggest");
  assert.ok(vals("bigUnit").includes("bag") && vals("bigUnit").includes("carton"));
  assert.equal(E.colOptions("items", "name", row, [row]), null);
  assert.equal(E.colOptions("customers", "phone", {}, []), null);
  // every choice clears its own check
  for (const v of vals("gst")) assert.ok(!E.checkRow("items", { ...row, gst: v, rateUnit: "bag", taxIncl: "extra" }, [], []).some((i) => i.col === "gst"));
  for (const v of vals("rateUnit")) assert.ok(!E.checkRow("items", { ...row, gst: "5", rateUnit: v, taxIncl: "extra" }, [], []).some((i) => i.col === "rateUnit"));
  for (const v of vals("taxIncl")) assert.ok(!E.checkRow("items", { ...row, gst: "5", rateUnit: "bag", taxIncl: v }, [], []).some((i) => i.col === "taxIncl"));
});

test("customers: name and phone are must, the address carries its place on the map (addendum-042)", () => {
  assert.deepEqual(E.CUSTOMER_COLS.filter((c) => c.req).map((c) => c.key), ["name", "phone"]);
  assert.equal(E.CUSTOMER_COLS.filter((c) => c.geo)[0].key, "address");
  const ok = { id: 1, name: "Laxmi Traders", phone: "99230 45678", email: "", address: "Baner, Pune, 411045", lat: 18.559, lng: 73.786 };
  assert.deepEqual(E.checkRow("customers", ok, [ok], []), []);
  const noPhone = { ...ok, phone: "" };
  assert.deepEqual(E.splitForSubmit("customers", [noPhone], []).broken.length, 1);
});

test("the sample files read back exactly, and need no fix (addendum-043)", () => {
  for (const kind of ["items", "customers"]) {
    const csv = E.sampleCSV(kind), rows = E.readCSV(csv, kind);
    assert.equal(csv.split("\n")[0], E.colsFor(kind).map((c) => c.label).join(","));
    assert.equal(rows.length, 2);
    assert.equal(E.reviewCounts(kind, rows.map((r, i) => ({ id: i + 1, ...r })), []).fix, 0);
  }
  assert.equal(E.readCSV(E.sampleCSV("items"), "items")[0].taxIncl, "extra");
});
