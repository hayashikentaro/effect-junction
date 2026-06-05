import { PlaceOrderJunction } from "../samples/place-order.js";
import {
  categorizePlaceOrderState,
  placeOrderScenarioExpectations,
  type InventoryState,
  type PaymentState,
  type PlaceOrderOutboxState,
  type PlaceOrderScenarioName,
  type PlaceOrderState,
  type PlaceOrderStateCategory,
} from "./place-order-states.js";

export type MockOrder = {
  id: string;
  email: string;
  total: number;
  paymentReference?: string;
};

export type MockPayment = {
  id: string;
  idempotencyKey: string;
  amount: number;
  status: "authorized";
};

export type MockInventoryReservation = {
  id: string;
  orderId: string;
  status: "reserved";
};

export type PlaceOrderRuntimeSnapshot = {
  order?: MockOrder;
  payment?: MockPayment;
  inventory?: MockInventoryReservation;
  outbox: {
    receipt: PlaceOrderOutboxState[];
    shipment: PlaceOrderOutboxState[];
  };
  analyticsEvents: unknown[];
};

export type PlaceOrderRuntimeResult = {
  implemented: boolean;
  ok: boolean;
  scenario: PlaceOrderScenarioName;
  orderState: PlaceOrderState;
  orderCategory: PlaceOrderStateCategory;
  paymentState: PaymentState;
  inventoryState: InventoryState;
  warnings: string[];
  diagnostics: string[];
  snapshot: PlaceOrderRuntimeSnapshot;
  report: string;
};

type PlaceOrderInput = {
  email: string;
  total: number;
};

class MockOrderStore {
  private order: MockOrder | undefined;

  createOrder(input: PlaceOrderInput): MockOrder {
    this.order = {
      id: "order-1",
      email: input.email,
      total: input.total,
    };
    return this.order;
  }

  storePaymentReference(orderId: string, paymentId: string): MockOrder {
    if (!this.order || this.order.id !== orderId) {
      throw new Error(`Order not found: ${orderId}`);
    }

    this.order.paymentReference = paymentId;
    return this.order;
  }

  snapshot(): MockOrder | undefined {
    return this.order === undefined ? undefined : { ...this.order };
  }
}

class MockInventory {
  private reservation: MockInventoryReservation | undefined;

  constructor(private readonly options: { failReservation?: boolean } = {}) {}

  reserveInventory(orderId: string): MockInventoryReservation {
    if (this.options.failReservation) {
      throw new Error("Mock inventory reservation failed");
    }

    this.reservation = {
      id: "reservation-1",
      orderId,
      status: "reserved",
    };
    return this.reservation;
  }

  snapshot(): MockInventoryReservation | undefined {
    return this.reservation === undefined
      ? undefined
      : { ...this.reservation };
  }
}

class MockPaymentGateway {
  private payment: MockPayment | undefined;

  authorizePayment(input: {
    amount: number;
    idempotencyKey: string;
  }): MockPayment {
    this.payment = {
      id: "payment-1",
      idempotencyKey: input.idempotencyKey,
      amount: input.amount,
      status: "authorized",
    };
    return this.payment;
  }

  snapshot(): MockPayment | undefined {
    return this.payment === undefined ? undefined : { ...this.payment };
  }
}

class PlaceOrderOutbox {
  readonly receipt: PlaceOrderOutboxState[] = [];
  readonly shipment: PlaceOrderOutboxState[] = [];

  enqueueReceipt(): void {
    this.receipt.push("receipt_pending");
  }

  enqueueShipment(): void {
    this.shipment.push("shipment_enqueued");
  }

  snapshot(): PlaceOrderRuntimeSnapshot["outbox"] {
    return {
      receipt: [...this.receipt],
      shipment: [...this.shipment],
    };
  }
}

class MockAnalytics {
  readonly events: unknown[] = [];

  trackOrderCreated(orderId: string): void {
    this.events.push({
      name: "order_created",
      orderId,
    });
  }
}

export async function runPlaceOrderScenario(
  scenario: PlaceOrderScenarioName,
): Promise<PlaceOrderRuntimeResult> {
  if (
    scenario !== "happy-path" &&
    scenario !== "inventory-reservation-fails"
  ) {
    const expectation = placeOrderScenarioExpectations[scenario];
    return {
      implemented: false,
      ok: false,
      scenario,
      orderState: expectation.finalOrderState,
      orderCategory: categorizePlaceOrderState(expectation.finalOrderState),
      paymentState: expectation.expectedPaymentState ?? "not_requested",
      inventoryState: expectation.expectedInventoryState ?? "not_reserved",
      warnings: [],
      diagnostics: [`PlaceOrder runtime not implemented for ${scenario}`],
      snapshot: emptySnapshot(),
      report: PlaceOrderJunction.report(),
    };
  }

  const orderStore = new MockOrderStore();
  const inventory = new MockInventory({
    failReservation: scenario === "inventory-reservation-fails",
  });
  const paymentGateway = new MockPaymentGateway();
  const outbox = new PlaceOrderOutbox();
  const analytics = new MockAnalytics();
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

  const payment = paymentGateway.authorizePayment({
    amount: order.total,
    idempotencyKey: `place-order:${order.id}`,
  });
  diagnostics.push("authorize-payment");

  const storedOrder = orderStore.storePaymentReference(order.id, payment.id);
  diagnostics.push("store-payment-reference");

  outbox.enqueueReceipt();
  diagnostics.push("enqueue-receipt-mail");

  outbox.enqueueShipment();
  diagnostics.push("enqueue-shipment-job");

  analytics.trackOrderCreated(order.id);
  diagnostics.push("track-order-created");

  const orderState: PlaceOrderState = "placed";

  return {
    implemented: true,
    ok: true,
    scenario,
    orderState,
    orderCategory: categorizePlaceOrderState(orderState),
    paymentState: "authorized",
    inventoryState: "reserved",
    warnings: [],
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

function emptySnapshot(): PlaceOrderRuntimeSnapshot {
  return {
    outbox: {
      receipt: [],
      shipment: [],
    },
    analyticsEvents: [],
  };
}
