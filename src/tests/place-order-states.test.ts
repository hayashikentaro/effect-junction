import test from "node:test";
import assert from "node:assert/strict";

import {
  categorizePlaceOrderState,
  parsePlaceOrderScenarioName,
  placeOrderScenarioExpectations,
  placeOrderScenarioNames,
} from "../runtime/place-order-states.js";

const expectedScenarioNames = [
  "happy-path",
  "inventory-reservation-fails",
  "payment-authorization-fails",
  "payment-succeeds-reference-store-fails",
  "receipt-mail-fails",
  "shipment-job-fails",
  "analytics-fails",
];

test("scenario list includes all docs scenarios", () => {
  assert.deepEqual(placeOrderScenarioNames, expectedScenarioNames);
});

test("each scenario has an expectation", () => {
  assert.deepEqual(
    Object.keys(placeOrderScenarioExpectations).sort(),
    [...placeOrderScenarioNames].sort(),
  );
});

test("final state expectations are fixed", () => {
  assert.equal(
    placeOrderScenarioExpectations["happy-path"].finalOrderState,
    "placed",
  );
  assert.equal(
    placeOrderScenarioExpectations["inventory-reservation-fails"]
      .finalOrderState,
    "failed",
  );
  assert.equal(
    placeOrderScenarioExpectations["payment-authorization-fails"]
      .finalOrderState,
    "payment_failed",
  );
  assert.equal(
    placeOrderScenarioExpectations["payment-succeeds-reference-store-fails"]
      .finalOrderState,
    "reconciliation_required",
  );
  assert.equal(
    placeOrderScenarioExpectations["receipt-mail-fails"].finalOrderState,
    "placed",
  );
  assert.equal(
    placeOrderScenarioExpectations["shipment-job-fails"].finalOrderState,
    "placed",
  );
  assert.equal(
    placeOrderScenarioExpectations["analytics-fails"].finalOrderState,
    "placed",
  );
});

test("category helper classifies place order states", () => {
  assert.equal(categorizePlaceOrderState("placed"), "succeeded");
  assert.equal(categorizePlaceOrderState("failed"), "failed");
  assert.equal(categorizePlaceOrderState("payment_failed"), "failed");
  assert.equal(
    categorizePlaceOrderState("reconciliation_required"),
    "attentionRequired",
  );
  assert.equal(
    categorizePlaceOrderState("compensation_pending"),
    "attentionRequired",
  );
  assert.equal(categorizePlaceOrderState("order_created"), "inProgress");
});

test("parse helper defaults to happy-path and rejects unknown scenario", () => {
  assert.equal(parsePlaceOrderScenarioName(undefined), "happy-path");
  assert.equal(parsePlaceOrderScenarioName("analytics-fails"), "analytics-fails");
  assert.throws(
    () => parsePlaceOrderScenarioName("unknown"),
    /Unknown PlaceOrder scenario: unknown/,
  );
});
