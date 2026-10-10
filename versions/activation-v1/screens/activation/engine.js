/* Store Activation discovery — the rules, with no screen in them (2026-10-10, v1).
   Pure functions over one plain state object, so the browser app and tests/engine.test.js run the same code.
   This is the proto state machine SSOT-1 and the workflow SSOT-5 will be derived from. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ActivationEngine = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // The six steps the owner sees. Weights give the team's 0–100 score; the owner only ever sees "n of 6".
  var STEPS = [
    { id: "items",     title: "Add your items",          time: "2 min",  weight: 20, needs: [] },
    { id: "customers", title: "Add your customers",      time: "30 sec", weight: 20, needs: [] },
    { id: "order",     title: "Take your first order",   time: "1 min",  weight: 20, needs: ["items", "customers"] },
    { id: "deliver",   title: "Deliver it",              time: "1 min",  weight: 15, needs: ["order"] },
    { id: "paid",      title: "Get paid",                time: "1 min",  weight: 15, needs: ["order"] },
    { id: "plan",      title: "Daily plan on WhatsApp",  time: "30 sec", weight: 10, needs: [] }
  ];

  function initialState() {
    return {
      v: 1,
      items: { status: "none", source: null, startedAt: 0, answers: {}, count: 0 },   // none | reading | check | team | done
      customers: { done: false, ids: [] },
      order: null,                                   // { id, customerId, lines: [{itemId, qty, price}], payment, sendInvoice, total }
      delivery: { status: "none", mode: null, driverId: null },   // none | sent | delivered
      payment: { status: "none", received: false },   // none | link | cash
      plan: { on: false, morning: "08:30", evening: "20:00" },
      flash: null
    };
  }

  function isDone(s, id) {
    switch (id) {
      case "items": return s.items.status === "done";
      case "customers": return !!s.customers.done;
      case "order": return !!s.order;
      case "deliver": return s.delivery.status !== "none";
      case "paid": return s.payment.status !== "none";
      case "plan": return !!s.plan.on;
    }
    return false;
  }

  function step(id) { for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return STEPS[i]; return null; }
  function stepNumber(id) { for (var i = 0; i < STEPS.length; i++) if (STEPS[i].id === id) return i + 1; return 0; }

  function isLocked(s, id) {
    var st = step(id);
    return st.needs.some(function (n) { return !isDone(s, n); });
  }

  /** A step the owner started that is now waiting on someone else (the reader, or the team). */
  function isWaiting(s, id) {
    return id === "items" && (s.items.status === "reading" || s.items.status === "team");
  }

  function lockNote(s, id) {
    if (id === "order") return "after items and customers";
    if (id === "deliver" || id === "paid") return "after your first order";
    return "";
  }

  function progress(s) {
    var done = STEPS.filter(function (st) { return isDone(s, st.id); });
    return {
      done: done.length,
      total: STEPS.length,
      score: done.reduce(function (a, st) { return a + st.weight; }, 0),   // the team's number
      percent: Math.round((done.length / STEPS.length) * 100)               // what the ring fills to
    };
  }

  /** Move time-driven states on: a file that has been read long enough becomes "check". */
  function tick(s, now, readMillis, questionCount) {
    if (s.items.status === "reading" && now - s.items.startedAt >= readMillis) {
      s.items.status = questionCount > 0 ? "check" : "done";
      return true;
    }
    return false;
  }

  /** The one next step the page suggests: the first open, unlocked, not-waiting step, in order.
      A read file that needs checking comes first, since the owner is the only one who can unblock it. */
  function nextStep(s) {
    if (s.items.status === "check") return { id: "items", mode: "check" };
    for (var i = 0; i < STEPS.length; i++) {
      var id = STEPS[i].id;
      if (isDone(s, id) || isLocked(s, id) || isWaiting(s, id)) continue;
      return { id: id, mode: "start" };
    }
    if (STEPS.some(function (st) { return isWaiting(s, st.id); })) return { id: "items", mode: "waiting" };
    return null;   // all six done
  }

  function orderTotal(lines) {
    return lines.reduce(function (a, l) { return a + (l.price || 0) * l.qty; }, 0);
  }

  /** The assistant never runs a step: it maps a question to the step it belongs to and points at the page. */
  // Most specific first: "deliver an order" is about delivering, "get paid for an order" about payment.
  var TOPICS = [
    { id: "deliver",   words: ["deliver", "driver", "route", "dispatch", "send goods"] },
    { id: "paid",      words: ["pay", "paid", "udhaar", "collect", "money", "upi", "cash", "payment"] },
    { id: "plan",      words: ["plan", "whatsapp", "summary", "hisaab", "morning", "evening", "report"] },
    { id: "customers", words: ["customer", "contact", "shop", "retailer", "dukaan", "party"] },
    { id: "items",     words: ["item", "product", "rate", "price", "list", "stock", "maal"] },
    { id: "order",     words: ["order", "bill", "invoice", "sell", "sale"] }
  ];
  function topicFor(question) {
    var q = String(question || "").toLowerCase();
    for (var i = 0; i < TOPICS.length; i++) {
      if (TOPICS[i].words.some(function (w) { return q.indexOf(w) !== -1; })) return TOPICS[i].id;
    }
    return null;
  }

  return {
    STEPS: STEPS, initialState: initialState, isDone: isDone, isLocked: isLocked, isWaiting: isWaiting,
    lockNote: lockNote, progress: progress, tick: tick, nextStep: nextStep, step: step, stepNumber: stepNumber,
    orderTotal: orderTotal, topicFor: topicFor
  };
});
