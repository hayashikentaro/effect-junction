import test from "node:test";
import assert from "node:assert/strict";

import { runPlaceOrderScenario } from "../runtime/place-order-runtime.js";
import { placeOrderScenarioNames } from "../runtime/place-order-states.js";

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

test("PlaceOrder payment-authorization-fails records compensation requirement", async () => {
  const result = await runPlaceOrderScenario("payment-authorization-fails");

  assert.equal(result.implemented, true);
  assert.equal(result.ok, false);
  assert.equal(result.orderState, "payment_failed");
  assert.equal(result.orderCategory, "failed");
  assert.equal(result.paymentState, "authorization_failed");
  assert.equal(result.inventoryState, "release_pending");
  assert.ok(result.snapshot.order);
  assert.ok(result.snapshot.inventory);
  assert.equal(result.snapshot.payment, undefined);
  assert.deepEqual(result.snapshot.outbox.receipt, []);
  assert.deepEqual(result.snapshot.outbox.shipment, []);
  assert.equal(result.snapshot.analyticsEvents.length, 0);
  assert.deepEqual(
    result.diagnostics.filter((diagnostic) =>
      [
        "create-order",
        "reserve-inventory",
        "authorize-payment failed",
        "release-inventory required",
        "store-payment-reference not attempted",
        "analytics not executed",
      ].includes(diagnostic),
    ),
    [
      "create-order",
      "reserve-inventory",
      "authorize-payment failed",
      "release-inventory required",
      "store-payment-reference not attempted",
      "analytics not executed",
    ],
  );
});

test("PlaceOrder payment-succeeds-reference-store-fails requires reconciliation", async () => {
  const result = await runPlaceOrderScenario(
    "payment-succeeds-reference-store-fails",
  );

  assert.equal(result.implemented, true);
  assert.equal(result.ok, false);
  assert.equal(result.orderState, "reconciliation_required");
  assert.equal(result.orderCategory, "attentionRequired");
  assert.equal(result.paymentState, "reference_missing");
  assert.equal(result.inventoryState, "reserved");
  assert.ok(result.snapshot.order);
  assert.equal(result.snapshot.order.paymentReference, undefined);
  assert.ok(result.snapshot.payment);
  assert.ok(result.snapshot.inventory);
  assert.deepEqual(result.snapshot.outbox.receipt, []);
  assert.deepEqual(result.snapshot.outbox.shipment, []);
  assert.equal(result.snapshot.analyticsEvents.length, 0);
  assert.deepEqual(
    result.diagnostics.filter((diagnostic) =>
      [
        "create-order",
        "reserve-inventory",
        "authorize-payment",
        "store-payment-reference failed",
        "external payment authorized",
        "local payment reference missing",
        "rollback insufficient",
        "reconciliation required",
        "receipt not enqueued",
        "shipment not enqueued",
        "analytics not executed",
      ].includes(diagnostic),
    ),
    [
      "create-order",
      "reserve-inventory",
      "authorize-payment",
      "store-payment-reference failed",
      "external payment authorized",
      "local payment reference missing",
      "rollback insufficient",
      "reconciliation required",
      "receipt not enqueued",
      "shipment not enqueued",
      "analytics not executed",
    ],
  );
});

test("PlaceOrder receipt-mail-fails keeps order placed with retryable outbox state", async () => {
  const result = await runPlaceOrderScenario("receipt-mail-fails");

  assert.equal(result.implemented, true);
  assert.equal(result.ok, true);
  assert.equal(result.orderState, "placed");
  assert.equal(result.orderCategory, "succeeded");
  assert.equal(result.paymentState, "authorized");
  assert.equal(result.inventoryState, "reserved");
  assert.ok(result.snapshot.order);
  assert.equal(result.snapshot.order.paymentReference, "payment-1");
  assert.ok(result.snapshot.payment);
  assert.ok(result.snapshot.inventory);
  assert.deepEqual(result.snapshot.outbox.receipt, ["receipt_failed"]);
  assert.deepEqual(result.snapshot.outbox.shipment, ["shipment_enqueued"]);
  assert.equal(result.snapshot.analyticsEvents.length, 1);
  assert.ok(result.warnings.includes("receipt mail failed"));
  assert.deepEqual(
    result.diagnostics.filter((diagnostic) =>
      [
        "create-order",
        "reserve-inventory",
        "authorize-payment",
        "store-payment-reference",
        "enqueue-receipt-mail failed",
        "receipt remains retryable with dedupe key",
        "enqueue-shipment-job",
        "track-order-created",
      ].includes(diagnostic),
    ),
    [
      "create-order",
      "reserve-inventory",
      "authorize-payment",
      "store-payment-reference",
      "enqueue-receipt-mail failed",
      "receipt remains retryable with dedupe key",
      "enqueue-shipment-job",
      "track-order-created",
    ],
  );
});

test("PlaceOrder shipment-job-fails keeps order placed with retryable outbox state", async () => {
  const result = await runPlaceOrderScenario("shipment-job-fails");

  assert.equal(result.implemented, true);
  assert.equal(result.ok, true);
  assert.equal(result.orderState, "placed");
  assert.equal(result.orderCategory, "succeeded");
  assert.equal(result.paymentState, "authorized");
  assert.equal(result.inventoryState, "reserved");
  assert.ok(result.snapshot.order);
  assert.equal(result.snapshot.order.paymentReference, "payment-1");
  assert.ok(result.snapshot.payment);
  assert.ok(result.snapshot.inventory);
  assert.deepEqual(result.snapshot.outbox.receipt, ["receipt_pending"]);
  assert.deepEqual(result.snapshot.outbox.shipment, ["shipment_failed"]);
  assert.equal(result.snapshot.analyticsEvents.length, 1);
  assert.ok(result.warnings.includes("shipment job failed"));
  assert.deepEqual(
    result.diagnostics.filter((diagnostic) =>
      [
        "create-order",
        "reserve-inventory",
        "authorize-payment",
        "store-payment-reference",
        "enqueue-receipt-mail",
        "enqueue-shipment-job failed",
        "shipment remains retryable with idempotency key",
        "track-order-created",
      ].includes(diagnostic),
    ),
    [
      "create-order",
      "reserve-inventory",
      "authorize-payment",
      "store-payment-reference",
      "enqueue-receipt-mail",
      "enqueue-shipment-job failed",
      "shipment remains retryable with idempotency key",
      "track-order-created",
    ],
  );
});

test("PlaceOrder analytics-fails keeps order placed with best-effort warning", async () => {
  const result = await runPlaceOrderScenario("analytics-fails");

  assert.equal(result.implemented, true);
  assert.equal(result.ok, true);
  assert.equal(result.orderState, "placed");
  assert.equal(result.orderCategory, "succeeded");
  assert.equal(result.paymentState, "authorized");
  assert.equal(result.inventoryState, "reserved");
  assert.ok(result.snapshot.order);
  assert.equal(result.snapshot.order.paymentReference, "payment-1");
  assert.ok(result.snapshot.payment);
  assert.ok(result.snapshot.inventory);
  assert.deepEqual(result.snapshot.outbox.receipt, ["receipt_pending"]);
  assert.deepEqual(result.snapshot.outbox.shipment, ["shipment_enqueued"]);
  assert.equal(result.snapshot.analyticsEvents.length, 0);
  assert.ok(result.warnings.includes("analytics tracking failed"));
  assert.deepEqual(
    result.diagnostics.filter((diagnostic) =>
      [
        "create-order",
        "reserve-inventory",
        "authorize-payment",
        "store-payment-reference",
        "enqueue-receipt-mail",
        "enqueue-shipment-job",
        "track-order-created failed",
        "analytics failure did not block critical path",
      ].includes(diagnostic),
    ),
    [
      "create-order",
      "reserve-inventory",
      "authorize-payment",
      "store-payment-reference",
      "enqueue-receipt-mail",
      "enqueue-shipment-job",
      "track-order-created failed",
      "analytics failure did not block critical path",
    ],
  );
});

test("all PlaceOrder scenarios are implemented", async () => {
  for (const scenarioName of placeOrderScenarioNames) {
    const result = await runPlaceOrderScenario(scenarioName);

    assert.equal(result.implemented, true);
  }
});
