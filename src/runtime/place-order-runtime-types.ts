import {
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

export type PlaceOrderInput = {
  email: string;
  total: number;
};
