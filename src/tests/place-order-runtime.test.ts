import test from "node:test";
import assert from "node:assert/strict";

import { runPlaceOrderScenario } from "../runtime/place-order-runtime.js";

test("PlaceOrder happy-path runtime reaches placed state", async () => {
  const result = await runPlaceOrderScenario("happy-path");

  assert.equal(result.implemented, true);
  assert.equal(result.ok, true);
  assert.equal(result.orderState, "placed");
  assert.equal(result.orderCategory, "succeeded");
  assert.equal(result.paymentState, "authorized");
  assert.equal(result.inventoryState, "reserved");
  assert.equal(result.snapshot.order?.paymentReference, "payment-1");
  assert.deepEqual(result.snapshot.outbox.receipt, ["receipt_pending"]);
  assert.deepEqual(result.snapshot.outbox.shipment, ["shipment_enqueued"]);
  assert.equal(result.snapshot.analyticsEvents.length, 1);
  assert.deepEqual(
    result.diagnostics.filter((diagnostic) =>
      [
        "create-order",
        "reserve-inventory",
        "authorize-payment",
        "store-payment-reference",
      ].includes(diagnostic),
    ),
    [
      "create-order",
      "reserve-inventory",
      "authorize-payment",
      "store-payment-reference",
    ],
  );
});

test("PlaceOrder inventory-reservation-fails stops before payment and outbox", async () => {
  const result = await runPlaceOrderScenario("inventory-reservation-fails");

  assert.equal(result.implemented, true);
  assert.equal(result.ok, false);
  assert.equal(result.orderState, "failed");
  assert.equal(result.orderCategory, "failed");
  assert.equal(result.paymentState, "not_requested");
  assert.equal(result.inventoryState, "not_reserved");
  assert.ok(result.snapshot.order);
  assert.equal(result.snapshot.payment, undefined);
  assert.equal(result.snapshot.inventory, undefined);
  assert.deepEqual(result.snapshot.outbox.receipt, []);
  assert.deepEqual(result.snapshot.outbox.shipment, []);
  assert.equal(result.snapshot.analyticsEvents.length, 0);
  assert.deepEqual(
    result.diagnostics.filter((diagnostic) =>
      [
        "create-order",
        "reserve-inventory failed",
        "payment not attempted",
      ].includes(diagnostic),
    ),
    ["create-order", "reserve-inventory failed", "payment not attempted"],
  );
});

test("PlaceOrder non-happy-path scenarios are explicitly not implemented", async () => {
  const result = await runPlaceOrderScenario(
    "payment-succeeds-reference-store-fails",
  );

  assert.equal(result.implemented, false);
  assert.equal(result.ok, false);
  assert.equal(result.orderState, "reconciliation_required");
  assert.equal(result.orderCategory, "attentionRequired");
  assert.match(
    result.diagnostics.join("\n"),
    /PlaceOrder runtime not implemented for payment-succeeds-reference-store-fails/,
  );
});
