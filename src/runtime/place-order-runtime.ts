import { PlaceOrderJunction } from "../samples/place-order.js";
import {
  MockAnalytics,
  MockInventory,
  MockOrderStore,
  MockPaymentGateway,
} from "./place-order-mock-services.js";
import { PlaceOrderOutbox } from "./place-order-outbox.js";
import {
  type MockInventoryReservation,
  type MockOrder,
  type MockPayment,
  type PlaceOrderRuntimeResult,
} from "./place-order-runtime-types.js";
import { categorizePlaceOrderState, type PlaceOrderScenarioName, type PlaceOrderState } from "./place-order-states.js";

export type { MockInventoryReservation, MockOrder, MockPayment, PlaceOrderRuntimeResult, PlaceOrderRuntimeSnapshot } from "./place-order-runtime-types.js";

export async function runPlaceOrderScenario(
  scenario: PlaceOrderScenarioName,
): Promise<PlaceOrderRuntimeResult> {
  const orderStore = new MockOrderStore({
    failStorePaymentReference: scenario === "payment-succeeds-reference-store-fails",
  });
  const inventory = new MockInventory({ failReservation: scenario === "inventory-reservation-fails" });
  const paymentGateway = new MockPaymentGateway({
    failAuthorization: scenario === "payment-authorization-fails",
  });
  const outbox = new PlaceOrderOutbox({
    failReceipt: scenario === "receipt-mail-fails",
    failShipment: scenario === "shipment-job-fails",
  });
  const analytics = new MockAnalytics({ failTrackOrderCreated: scenario === "analytics-fails" });
  const diagnostics: string[] = [];

  const order = orderStore.createOrder({
    email: "ada@example.com",
    total: 12000,
  });
  diagnostics.push("create-order");

  let reservation: MockInventoryReservation;
  try {
    reservation = inventory.reserveInventory(order.id);
  } catch {
    diagnostics.push("reserve-inventory failed");
    diagnostics.push("payment not attempted");
    diagnostics.push("receipt not enqueued");
    diagnostics.push("shipment not enqueued");
    diagnostics.push("analytics not executed");

    const orderState: PlaceOrderState = "failed";

    return {
      implemented: true,
      ok: false,
      scenario,
      orderState,
      orderCategory: categorizePlaceOrderState(orderState),
      paymentState: "not_requested",
      inventoryState: "not_reserved",
      warnings: [],
      diagnostics,
      snapshot: {
        order: orderStore.snapshot(),
        outbox: outbox.snapshot(),
        analyticsEvents: [],
      },
      report: PlaceOrderJunction.report(),
    };
  }
  diagnostics.push("reserve-inventory");

  let payment: MockPayment;
  try {
    payment = paymentGateway.authorizePayment({
      amount: order.total,
      idempotencyKey: `place-order:${order.id}`,
    });
  } catch {
    diagnostics.push("authorize-payment failed");
    diagnostics.push("release-inventory required");
    diagnostics.push("store-payment-reference not attempted");
    diagnostics.push("receipt not enqueued");
    diagnostics.push("shipment not enqueued");
    diagnostics.push("analytics not executed");

    const orderState: PlaceOrderState = "payment_failed";

    return {
      implemented: true,
      ok: false,
      scenario,
      orderState,
      orderCategory: categorizePlaceOrderState(orderState),
      paymentState: "authorization_failed",
      inventoryState: "release_pending",
      warnings: [],
      diagnostics,
      snapshot: {
        order: orderStore.snapshot(),
        inventory: inventory.snapshot(),
        outbox: outbox.snapshot(),
        analyticsEvents: [],
      },
      report: PlaceOrderJunction.report(),
    };
  }
  diagnostics.push("authorize-payment");

  let storedOrder: MockOrder;
  try {
    storedOrder = orderStore.storePaymentReference(order.id, payment.id);
  } catch {
    diagnostics.push("store-payment-reference failed");
    diagnostics.push("external payment authorized");
    diagnostics.push("local payment reference missing");
    diagnostics.push("rollback insufficient");
    diagnostics.push("reconciliation required");
    diagnostics.push("receipt not enqueued");
    diagnostics.push("shipment not enqueued");
    diagnostics.push("analytics not executed");

    const orderState: PlaceOrderState = "reconciliation_required";

    return {
      implemented: true,
      ok: false,
      scenario,
      orderState,
      orderCategory: categorizePlaceOrderState(orderState),
      paymentState: "reference_missing",
      inventoryState: "reserved",
      warnings: [],
      diagnostics,
      snapshot: {
        order: orderStore.snapshot(),
        payment: paymentGateway.snapshot(),
        inventory: inventory.snapshot(),
        outbox: outbox.snapshot(),
        analyticsEvents: [],
      },
      report: PlaceOrderJunction.report(),
    };
  }
  diagnostics.push("store-payment-reference");

  outbox.enqueueReceipt();
  const warnings: string[] = [];
  if (scenario === "receipt-mail-fails") {
    warnings.push("receipt mail failed");
    diagnostics.push("enqueue-receipt-mail failed");
    diagnostics.push("receipt remains retryable with dedupe key");
  } else {
    diagnostics.push("enqueue-receipt-mail");
  }

  outbox.enqueueShipment();
  if (scenario === "shipment-job-fails") {
    warnings.push("shipment job failed");
    diagnostics.push("enqueue-shipment-job failed");
    diagnostics.push("shipment remains retryable with idempotency key");
  } else {
    diagnostics.push("enqueue-shipment-job");
  }

  try {
    analytics.trackOrderCreated(order.id);
    diagnostics.push("track-order-created");
  } catch {
    warnings.push("analytics tracking failed");
    diagnostics.push("track-order-created failed");
    diagnostics.push("analytics failure did not block critical path");
  }

  const orderState: PlaceOrderState = "placed";

  return {
    implemented: true,
    ok: true,
    scenario,
    orderState,
    orderCategory: categorizePlaceOrderState(orderState),
    paymentState: "authorized",
    inventoryState: "reserved",
    warnings,
    diagnostics,
    snapshot: {
      order: { ...storedOrder },
      payment: paymentGateway.snapshot(),
      inventory: { ...reservation },
      outbox: outbox.snapshot(),
      analyticsEvents: [...analytics.events],
    },
    report: PlaceOrderJunction.report(),
  };
}
