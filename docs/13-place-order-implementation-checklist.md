# Place Order Implementation Checklist

This document is a checklist for the incremental `PlaceOrderJunction` runtime implementation.

This is not a payment framework. This is not a workflow engine. The checklist exists to keep runtime work small, scenario-driven, and educational.

Initial status: happy-path, `inventory-reservation-fails`, `payment-authorization-fails`, and `payment-succeeds-reference-store-fails` runtime slices exist. Outbox and analytics failure scenarios remain guarded until implemented.

Implemented slices:

- `happy-path`
- `inventory-reservation-fails`
- `payment-authorization-fails`
- `payment-succeeds-reference-store-fails`

Pending slices:

- `receipt-mail-fails`
- `shipment-job-fails`
- `analytics-fails`

## Current Prerequisites

These prerequisites already exist:

- `docs/10-place-order-sample.md`
- `docs/12-place-order-runtime-plan.md`
- `src/samples/place-order.ts`
- `src/runtime/place-order-states.ts`
- `npm run demo -- --junction place-order --scenario ...`

## Runtime Scope

Future PlaceOrder runtime may implement:

- deterministic scenario execution
- mock order store
- mock inventory
- mock payment gateway
- in-memory outbox for receipt and shipment
- best-effort analytics mock
- diagnostics and warnings
- state snapshots
- explicit compensation and reconciliation states

Future PlaceOrder runtime must not implement:

- real payment provider integration
- real DB
- real mail or shipping APIs
- generic workflow engine
- general-purpose saga framework
- Effect-TS integration
- provider-specific payment rules in `src/core`

## Proposed Runtime Files

If the implementation stays small, start with:

```txt
src/runtime/place-order-runtime.ts
src/tests/place-order-runtime.test.ts
```

If it starts to grow, split by responsibility:

```txt
src/runtime/
  place-order-runtime.ts
  place-order-mock-services.ts
  place-order-outbox.ts
  place-order-scenarios.ts
```

Prefer the smaller structure until the split removes real complexity.

## Mock Responsibilities

### MockOrderStore

- create order
- store payment reference
- expose order snapshot
- fail `store-payment-reference` in `payment-succeeds-reference-store-fails`

### MockInventory

- reserve inventory
- release inventory
- fail reserve in `inventory-reservation-fails`
- expose inventory state

### MockPaymentGateway

- authorize payment
- fail authorization in `payment-authorization-fails`
- return external payment reference on success
- support idempotency key conceptually
- do not model provider-specific details

### PlaceOrderOutbox

- enqueue receipt mail
- enqueue shipment job
- represent receipt/shipment pending/sent/failed
- fail receipt in `receipt-mail-fails`
- fail shipment in `shipment-job-fails`

### MockAnalytics

- track order created
- fail in `analytics-fails`
- best-effort only

## Scenario Checklist

### happy-path

- create order
- reserve inventory
- authorize payment
- store payment reference
- enqueue receipt
- enqueue shipment
- track analytics best effort
- final order state: `placed`

### inventory-reservation-fails

- create order
- reserve inventory fails
- payment is not attempted
- no receipt
- no shipment
- final order state: `failed`

### payment-authorization-fails

- create order
- reserve inventory
- payment authorization fails
- release inventory required
- no receipt
- no shipment
- final order state: `payment_failed`

### payment-succeeds-reference-store-fails

- create order
- reserve inventory
- payment authorized externally
- store payment reference fails
- `reconciliation_required`
- no receipt until reconciled
- diagnostic records split-brain condition

### receipt-mail-fails

- order reaches `placed`
- receipt outbox item fails or remains pending
- shipment can still be enqueued depending on sample policy
- final order state: `placed`

### shipment-job-fails

- order reaches `placed`
- shipment outbox item fails or remains pending
- receipt behavior independent
- final order state: `placed`

### analytics-fails

- order reaches `placed`
- analytics failure produces warning
- final order state: `placed`

## Expected Output Shape

These are documentation examples only.

```ts
type PlaceOrderRuntimeResult = {
  ok: boolean
  scenario: PlaceOrderScenarioName
  orderState: PlaceOrderState
  paymentState: PaymentState
  inventoryState: InventoryState
  warnings: string[]
  diagnostics: string[]
  snapshot: PlaceOrderRuntimeSnapshot
}

type PlaceOrderRuntimeSnapshot = {
  order: unknown
  payment: unknown
  inventory: unknown
  outbox: unknown
  analytics: unknown
}
```

## Implementation Order

1. Result/snapshot types.
2. Mock services.
3. Happy-path runtime. Done as the first implemented slice.
4. `inventory-reservation-fails`. Done as the first failure slice.
5. `payment-authorization-fails`. Done as the first compensation-required slice.
6. `payment-succeeds-reference-store-fails`. Done as the first split-brain reconciliation slice.
7. Receipt/shipment outbox failures.
8. Analytics best-effort failure.
9. Demo CLI integration.
10. Docs update.

## Guardrails

- Do not add provider-specific payment behavior to core.
- Do not generalize into saga/workflow framework.
- Do not add external dependencies.
- Keep PlaceOrder runtime educational and scenario-driven.
- Keep `src/core` independent from runtime.
