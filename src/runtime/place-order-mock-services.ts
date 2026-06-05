import {
  type MockInventoryReservation,
  type MockOrder,
  type MockPayment,
  type PlaceOrderInput,
} from "./place-order-runtime-types.js";

type MockOrderStoreOptions = {
  failStorePaymentReference?: boolean;
};

type MockInventoryOptions = {
  failReservation?: boolean;
};

type MockPaymentGatewayOptions = {
  failAuthorization?: boolean;
};

type MockAnalyticsOptions = {
  failTrackOrderCreated?: boolean;
};

export class MockOrderStore {
  private order: MockOrder | undefined;

  constructor(private readonly options: MockOrderStoreOptions = {}) {}

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
    if (this.options.failStorePaymentReference) {
      throw new Error("Mock payment reference store failed");
    }

    this.order.paymentReference = paymentId;
    return this.order;
  }

  snapshot(): MockOrder | undefined {
    return this.order === undefined ? undefined : { ...this.order };
  }
}

export class MockInventory {
  private reservation: MockInventoryReservation | undefined;

  constructor(private readonly options: MockInventoryOptions = {}) {}

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

export class MockPaymentGateway {
  private payment: MockPayment | undefined;

  constructor(private readonly options: MockPaymentGatewayOptions = {}) {}

  authorizePayment(input: {
    amount: number;
    idempotencyKey: string;
  }): MockPayment {
    if (this.options.failAuthorization) {
      throw new Error("Mock payment authorization failed");
    }

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

export class MockAnalytics {
  readonly events: unknown[] = [];

  constructor(private readonly options: MockAnalyticsOptions = {}) {}

  trackOrderCreated(orderId: string): void {
    if (this.options.failTrackOrderCreated) {
      throw new Error("Mock analytics tracking failed");
    }

    this.events.push({
      name: "order_created",
      orderId,
    });
  }
}
