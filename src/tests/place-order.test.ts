import test from "node:test";
import assert from "node:assert/strict";

import { derivePrescriptions } from "../core/index.js";
import {
  authorizePayment,
  createOrder,
  enqueueReceiptMail,
  PlaceOrderJunction,
  trackOrderCreated,
} from "../samples/place-order.js";

function codesFor(effect: Parameters<typeof derivePrescriptions>[0]): string[] {
  return derivePrescriptions(effect).map((prescription) => prescription.code);
}

test("PlaceOrderJunction contains the expected static effects", () => {
  assert.equal(PlaceOrderJunction.effects.length, 8);
  assert.deepEqual(
    PlaceOrderJunction.effects.map((effect) => effect.name),
    [
      "create-order",
      "reserve-inventory",
      "authorize-payment",
      "store-payment-reference",
      "enqueue-receipt-mail",
      "enqueue-shipment-job",
      "track-order-created",
      "reconcile-payment",
    ],
  );
});

test("authorize-payment derives external compensatable keyed prescriptions", () => {
  assert.deepEqual(codesFor(authorizePayment), [
    "requires-idempotency-key",
    "requires-compensation-handler",
    "store-external-reference",
    "consider-reconciliation-job",
  ]);
});

test("enqueue-receipt-mail derives outbox mail prescriptions", () => {
  assert.deepEqual(codesFor(enqueueReceiptMail), [
    "requires-dedupe-key",
    "prefer-outbox",
    "avoid-direct-retry",
    "do-not-run-inside-db-transaction",
    "record-pending-state",
  ]);
});

test("track-order-created derives best-effort prescription", () => {
  assert.deepEqual(codesFor(trackOrderCreated), [
    "must-not-block-critical-path",
  ]);
});

test("create-order derives critical transactional prescriptions", () => {
  assert.deepEqual(codesFor(createOrder), [
    "run-in-transaction",
    "enforce-invariants",
  ]);
});

test("PlaceOrderJunction report includes effects and prescriptions", () => {
  const report = PlaceOrderJunction.report();

  assert.match(report, /place-order/);
  assert.match(report, /create-order/);
  assert.match(report, /authorize-payment/);
  assert.match(report, /store-payment-reference/);
  assert.match(report, /enqueue-receipt-mail/);
  assert.match(report, /requires-idempotency-key/);
  assert.match(report, /store-external-reference/);
  assert.match(report, /consider-reconciliation-job/);
});
