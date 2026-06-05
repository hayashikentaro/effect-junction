import test from "node:test";
import assert from "node:assert/strict";

import {
  formatArray,
  formatList,
  formatOptional,
  formatPlaceOrderRuntimeSummary,
} from "../samples/demo-format.js";
import { runPlaceOrderScenario } from "../runtime/place-order-runtime.js";

test("formatOptional renders missing values as none", () => {
  assert.equal(formatOptional(undefined), "none");
  assert.equal(formatOptional(null), "none");
  assert.equal(formatOptional(""), "none");
  assert.equal(formatOptional("payment-1"), "payment-1");
});

test("formatArray renders compact bracketed arrays", () => {
  assert.equal(formatArray([]), "[]");
  assert.equal(formatArray(["receipt_pending"]), "[receipt_pending]");
  assert.equal(formatArray(["a", "b"]), "[a, b]");
});

test("formatList renders default and custom indentation", () => {
  assert.deepEqual(formatList([]), ["  - none"]);
  assert.deepEqual(formatList(["x", "y"]), ["  - x", "  - y"]);
  assert.deepEqual(formatList(["x"], "    "), ["    - x"]);
});

test("formatPlaceOrderRuntimeSummary includes key reconciliation lines", async () => {
  const result = await runPlaceOrderScenario(
    "payment-succeeds-reference-store-fails",
  );
  const lines = formatPlaceOrderRuntimeSummary(result);

  for (const expectedLine of [
    "Runtime Result:",
    "  implemented: true",
    "  ok: false",
    "  orderState: reconciliation_required",
    "  orderCategory: attentionRequired",
    "  paymentState: reference_missing",
    "  inventoryState: reserved",
    "Snapshot:",
    "    paymentReference: none",
    "    id: payment-1",
    "    receipt: []",
    "    shipment: []",
    "  analyticsEvents: 0",
    "Warnings:",
    "  - none",
    "Diagnostics:",
    "  - reconciliation required",
  ]) {
    assert.ok(lines.includes(expectedLine), expectedLine);
  }
});
