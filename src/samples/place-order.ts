import { junction, worldEffect } from "../core/index.js";

export const createOrder = worldEffect({
  name: "create-order",
  role: "critical",
  description: "Create the local order record and internal operation identity.",
  attributes: {
    ownership: "internal",
    visibility: "machine",
    transactionality: "transactional",
    reversibility: "reversible",
    idempotency: "natural",
    failureMode: "critical",
    timing: "immediate",
  },
});

export const reserveInventory = worldEffect({
  name: "reserve-inventory",
  role: "critical",
  description:
    "Reserve inventory with an explicit release-inventory compensation path.",
  attributes: {
    ownership: "internal",
    visibility: "machine",
    transactionality: "transactional",
    reversibility: "compensatable",
    idempotency: "keyed",
    failureMode: "critical",
    timing: "immediate",
  },
});

export const authorizePayment = worldEffect({
  name: "authorize-payment",
  role: "compensating",
  description:
    "Authorize payment through an external provider using a stable idempotency key.",
  attributes: {
    ownership: "external",
    visibility: "operator",
    transactionality: "nonTransactional",
    reversibility: "compensatable",
    idempotency: "keyed",
    failureMode: "compensate",
    timing: "immediate",
  },
});

export const storePaymentReference = worldEffect({
  name: "store-payment-reference",
  role: "critical",
  description:
    "Store the external payment reference locally for support and reconciliation.",
  attributes: {
    ownership: "internal",
    visibility: "machine",
    transactionality: "transactional",
    reversibility: "reversible",
    idempotency: "natural",
    failureMode: "critical",
    timing: "immediate",
  },
});

export const enqueueReceiptMail = worldEffect({
  name: "enqueue-receipt-mail",
  role: "outbox",
  description: "Queue user-visible receipt mail with dedupe protection.",
  attributes: {
    ownership: "human",
    visibility: "user",
    transactionality: "nonTransactional",
    reversibility: "irreversible",
    idempotency: "dedupeRequired",
    failureMode: "pending",
    timing: "deferrable",
  },
});

export const enqueueShipmentJob = worldEffect({
  name: "enqueue-shipment-job",
  role: "outbox",
  description: "Queue external shipment work with keyed pending state.",
  attributes: {
    ownership: "external",
    visibility: "operator",
    transactionality: "eventual",
    reversibility: "compensatable",
    idempotency: "keyed",
    failureMode: "pending",
    timing: "deferrable",
  },
});

export const trackOrderCreated = worldEffect({
  name: "track-order-created",
  role: "bestEffort",
  description: "Track order analytics without blocking order placement.",
  attributes: {
    ownership: "external",
    visibility: "machine",
    transactionality: "eventual",
    reversibility: "irreversible",
    idempotency: "duplicateTolerant",
    failureMode: "bestEffort",
    timing: "deferrable",
  },
});

export const reconcilePayment = worldEffect({
  name: "reconcile-payment",
  role: "reconciliation",
  description:
    "Reconcile local order state with external payment state after a split-brain failure.",
  attributes: {
    ownership: "external",
    visibility: "operator",
    transactionality: "eventual",
    reversibility: "compensatable",
    idempotency: "keyed",
    failureMode: "escalate",
    timing: "scheduled",
  },
});

export const PlaceOrderJunction = junction("place-order")
  .critical(createOrder)
  .critical(reserveInventory)
  .compensating(authorizePayment)
  .critical(storePaymentReference)
  .outbox(enqueueReceiptMail)
  .outbox(enqueueShipmentJob)
  .bestEffort(trackOrderCreated)
  .reconciliation(reconcilePayment)
  .build();
