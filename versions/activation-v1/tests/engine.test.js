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
});

test("while the rate list is read, the next step moves on to customers", () => {
  const s = E.initialState();
  s.items = { status: "reading", startedAt: 1000, answers: {}, count: 0 };
  assert.deepEqual(E.nextStep(s), { id: "customers", mode: "start" });
  assert.equal(E.tick(s, 3000, 6000, 2), false);
  assert.equal(E.tick(s, 7000, 6000, 2), true);
  assert.equal(s.items.status, "check");
  assert.deepEqual(E.nextStep(s), { id: "items", mode: "check" });   // only the owner can unblock it
});

test("waiting on the team with nothing else open says so", () => {
  const s = E.initialState();
  s.items.status = "team"; s.customers.done = true; s.plan.on = true;
  assert.deepEqual(E.nextStep(s), { id: "items", mode: "waiting" });
});

test("items and customers unlock the order; the order unlocks deliver and get paid", () => {
  const s = E.initialState();
  s.items.status = "done"; s.customers.done = true;
  assert.equal(E.isLocked(s, "order"), false);
  assert.deepEqual(E.nextStep(s), { id: "order", mode: "start" });
  s.order = { lines: [{ qty: 10, price: 480 }, { qty: 4, price: 410 }] };
  assert.equal(E.orderTotal(s.order.lines), 6440);
  assert.equal(E.isLocked(s, "deliver"), false);
  assert.equal(E.isLocked(s, "paid"), false);
  assert.deepEqual(E.nextStep(s), { id: "deliver", mode: "start" });
});

test("all six done: next step is none, 6 of 6, the team's score is 100", () => {
  const s = E.initialState();
  s.items.status = "done"; s.customers.done = true; s.order = { lines: [] };
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
