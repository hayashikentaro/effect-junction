export type PlaceOrderScenarioName =
  | "happy-path"
  | "inventory-reservation-fails"
  | "payment-authorization-fails"
  | "payment-succeeds-reference-store-fails"
  | "receipt-mail-fails"
  | "shipment-job-fails"
  | "analytics-fails";

export const placeOrderScenarioNames = [
  "happy-path",
  "inventory-reservation-fails",
  "payment-authorization-fails",
  "payment-succeeds-reference-store-fails",
  "receipt-mail-fails",
  "shipment-job-fails",
  "analytics-fails",
] as const satisfies readonly PlaceOrderScenarioName[];

export type PlaceOrderState =
  | "not_started"
  | "order_created"
  | "inventory_reserved"
  | "payment_authorized"
  | "payment_reference_stored"
  | "placed"
  | "payment_failed"
  | "inventory_release_pending"
  | "compensation_pending"
  | "reconciliation_required"
  | "failed";

export type PaymentState =
  | "not_requested"
  | "authorized"
  | "authorization_failed"
  | "reference_missing"
  | "compensation_required"
  | "compensated"
  | "reconciliation_required";

export type InventoryState =
  | "not_reserved"
  | "reserved"
  | "release_pending"
  | "released"
  | "release_failed";

export type PlaceOrderOutboxState =
  | "receipt_pending"
  | "receipt_sent"
  | "receipt_failed"
  | "shipment_pending"
  | "shipment_enqueued"
  | "shipment_failed";

export type PlaceOrderStateCategory =
  | "inProgress"
  | "succeeded"
  | "failed"
  | "attentionRequired";

export type PlaceOrderScenarioExpectation = {
  scenario: PlaceOrderScenarioName;
  finalOrderState: PlaceOrderState;
  expectedPaymentState?: PaymentState;
  expectedInventoryState?: InventoryState;
  notes: string[];
};

export const placeOrderScenarioExpectations: Record<
  PlaceOrderScenarioName,
  PlaceOrderScenarioExpectation
> = {
  "happy-path": {
    scenario: "happy-path",
    finalOrderState: "placed",
    expectedPaymentState: "authorized",
    expectedInventoryState: "reserved",
    notes: [
      "order created",
      "inventory reserved",
      "payment authorized",
      "payment reference stored",
      "receipt and shipment work enqueued",
      "analytics best effort",
    ],
  },
  "inventory-reservation-fails": {
    scenario: "inventory-reservation-fails",
    finalOrderState: "failed",
    expectedPaymentState: "not_requested",
    expectedInventoryState: "not_reserved",
    notes: ["payment not attempted", "no receipt mail", "no shipment job"],
  },
  "payment-authorization-fails": {
    scenario: "payment-authorization-fails",
    finalOrderState: "payment_failed",
    expectedPaymentState: "authorization_failed",
    expectedInventoryState: "release_pending",
    notes: [
      "release-inventory compensation required",
      "no receipt mail",
      "no shipment job",
    ],
  },
  "payment-succeeds-reference-store-fails": {
    scenario: "payment-succeeds-reference-store-fails",
    finalOrderState: "reconciliation_required",
    expectedPaymentState: "reference_missing",
    expectedInventoryState: "reserved",
    notes: [
      "external payment may be authorized",
      "local reference missing",
      "rollback insufficient",
      "reconciliation required",
      "operator-visible diagnostic",
    ],
  },
  "receipt-mail-fails": {
    scenario: "receipt-mail-fails",
    finalOrderState: "placed",
    expectedPaymentState: "authorized",
    expectedInventoryState: "reserved",
    notes: [
      "order remains placed",
      "receipt outbox item failed or pending",
      "retry requires dedupe key",
    ],
  },
  "shipment-job-fails": {
    scenario: "shipment-job-fails",
    finalOrderState: "placed",
    expectedPaymentState: "authorized",
    expectedInventoryState: "reserved",
    notes: [
      "order remains placed",
      "shipment outbox item failed or pending",
      "retry requires keyed idempotency",
    ],
  },
  "analytics-fails": {
    scenario: "analytics-fails",
    finalOrderState: "placed",
    expectedPaymentState: "authorized",
    expectedInventoryState: "reserved",
    notes: [
      "order remains placed",
      "warning recorded",
      "best-effort failure does not affect order success",
    ],
  },
};

export function categorizePlaceOrderState(
  state: PlaceOrderState,
): PlaceOrderStateCategory {
  if (state === "placed") {
    return "succeeded";
  }

  if (state === "failed" || state === "payment_failed") {
    return "failed";
  }

  if (
    state === "inventory_release_pending" ||
    state === "compensation_pending" ||
    state === "reconciliation_required"
  ) {
    return "attentionRequired";
  }

  return "inProgress";
}

export function parsePlaceOrderScenarioName(
  value: string | undefined,
): PlaceOrderScenarioName {
  const scenario = value ?? "happy-path";

  if (placeOrderScenarioNames.includes(scenario as PlaceOrderScenarioName)) {
    return scenario as PlaceOrderScenarioName;
  }

  throw new Error(`Unknown PlaceOrder scenario: ${scenario}`);
}
