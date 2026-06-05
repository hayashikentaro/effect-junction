import { type PlaceOrderOutboxState } from "./place-order-states.js";
import { type PlaceOrderRuntimeSnapshot } from "./place-order-runtime-types.js";

type PlaceOrderOutboxOptions = {
  failReceipt?: boolean;
  failShipment?: boolean;
};

export class PlaceOrderOutbox {
  readonly receipt: PlaceOrderOutboxState[] = [];
  readonly shipment: PlaceOrderOutboxState[] = [];

  constructor(private readonly options: PlaceOrderOutboxOptions = {}) {}

  enqueueReceipt(): void {
    this.receipt.push(
      this.options.failReceipt ? "receipt_failed" : "receipt_pending",
    );
  }

  enqueueShipment(): void {
    this.shipment.push(
      this.options.failShipment ? "shipment_failed" : "shipment_enqueued",
    );
  }

  snapshot(): PlaceOrderRuntimeSnapshot["outbox"] {
    return {
      receipt: [...this.receipt],
      shipment: [...this.shipment],
    };
  }
}
