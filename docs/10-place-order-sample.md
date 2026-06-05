# Place Order Sample

`PlaceOrderJunction` is the second sample after `RegisterUserJunction`.

It demonstrates effect attributes that RegisterUser does not cover deeply:

- external ownership
- compensatable effects
- keyed idempotency
- external reference storage
- reconciliation
- partial success
- compensation

This is a documentation-first design. A static TypeScript model/report sample exists, but the PlaceOrder runtime is not implemented yet.

## Bad Example

A naive implementation can look straightforward:

```ts
async function placeOrder(input: PlaceOrderInput) {
  const order = await db.orders.create(input)
  await inventory.reserve(order.items)
  const payment = await paymentGateway.authorize(order.total)
  await db.orders.savePaymentReference(order.id, payment.id)
  await mailer.sendReceipt(order.email)
  await shipping.enqueue(order.id)
  await analytics.track("order_created", { orderId: order.id })
  return order
}
```

This code hides several real-world hazards:

- payment succeeded but saving payment reference failed
- order saved but payment authorization failed
- inventory reserved but payment failed
- receipt mail failure should not fail the order
- analytics failure should not fail the order
- payment retry without idempotency key can double charge or double authorize
- external payment state can diverge from local order state
- compensation is not rollback

## Effects With Attributes

### create-order

| Attribute | Value |
| --- | --- |
| role | `critical` |
| ownership | `internal` |
| visibility | `machine` |
| transactionality | `transactional` |
| reversibility | `reversible` |
| idempotency | `natural` |
| failureMode | `critical` |
| timing | `immediate` |

Creates the local order record and establishes the internal operation identity.

### reserve-inventory

| Attribute | Value |
| --- | --- |
| role | `critical` |
| ownership | `internal` |
| visibility | `machine` |
| transactionality | `transactional` |
| reversibility | `compensatable` |
| idempotency | `keyed` |
| failureMode | `critical` |
| timing | `immediate` |

Inventory reservation may be internal, but it is often better modeled as compensatable rather than simply reversible. `release-inventory` is the explicit compensating action.

### authorize-payment

| Attribute | Value |
| --- | --- |
| role | `compensating` |
| ownership | `external` |
| visibility | `operator` |
| transactionality | `nonTransactional` |
| reversibility | `compensatable` |
| idempotency | `keyed` |
| failureMode | `compensate` |
| timing | `immediate` |

Payment authorization is not rollbackable with the local database transaction. It requires an idempotency key, external reference storage, and possible compensation.

### store-payment-reference

| Attribute | Value |
| --- | --- |
| role | `critical` |
| ownership | `internal` |
| visibility | `machine` |
| transactionality | `transactional` |
| reversibility | `reversible` |
| idempotency | `natural` |
| failureMode | `critical` |
| timing | `immediate` |

The external payment id must be stored locally. If this fails after payment succeeds, rollback is not enough and reconciliation is required.

### enqueue-receipt-mail

| Attribute | Value |
| --- | --- |
| role | `outbox` |
| ownership | `human` |
| visibility | `user` |
| transactionality | `nonTransactional` |
| reversibility | `irreversible` |
| idempotency | `dedupeRequired` |
| failureMode | `pending` |
| timing | `deferrable` |

Receipt mail is user-visible and irreversible, so it should be queued with a dedupe key rather than sent directly in the critical path.

### enqueue-shipment-job

| Attribute | Value |
| --- | --- |
| role | `outbox` |
| ownership | `external` |
| visibility | `operator` |
| transactionality | `eventual` |
| reversibility | `compensatable` |
| idempotency | `keyed` |
| failureMode | `pending` |
| timing | `deferrable` |

Shipment scheduling is external-facing pending work. It needs a stable key and operator-visible state when it cannot be dispatched.

### track-order-created

| Attribute | Value |
| --- | --- |
| role | `bestEffort` |
| ownership | `external` |
| visibility | `machine` |
| transactionality | `eventual` |
| reversibility | `irreversible` |
| idempotency | `duplicateTolerant` |
| failureMode | `bestEffort` |
| timing | `deferrable` |

Analytics is useful, but it must not decide whether the order succeeds.

## Junction Classification

`PlaceOrderJunction` groups effects by failure semantics:

- `critical`: `create-order`, `reserve-inventory`, `store-payment-reference`
- `compensating`: `authorize-payment`, `compensate-payment`, `release-inventory`
- `outbox`: `enqueue-receipt-mail`, `enqueue-shipment-job`
- `bestEffort`: `track-order-created`
- `reconciliation`: `reconcile-payment`

The classification is intentionally not the same as DB/API/Mail/Queue. It describes what must happen when effects partially succeed.

## Expected Prescriptions

### authorize-payment

Expected prescriptions:

- `requires-idempotency-key`
- `requires-compensation-handler`
- `store-external-reference`
- `consider-reconciliation-job`

### enqueue-receipt-mail

Expected prescriptions:

- `requires-dedupe-key`
- `prefer-outbox`
- `avoid-direct-retry`
- `do-not-run-inside-db-transaction`
- `record-pending-state`

### track-order-created

Expected prescriptions:

- `must-not-block-critical-path`

### create-order

Expected prescriptions:

- `run-in-transaction`
- `enforce-invariants`

## Failure Scenarios

These are design scenarios, not runtime tests yet.

### payment authorization fails

Expected behavior:

- order should not become confirmed
- inventory reservation should be released or marked releasable
- no receipt mail should be sent
- analytics should not claim `order_created` unless accepted as a separate diagnostic

### payment succeeds but store-payment-reference fails

Expected behavior:

- local system has lost or not committed the external reference
- this cannot be solved by rollback
- reconciliation is required
- operator-visible alert may be needed

### inventory reservation succeeds but payment fails

Expected behavior:

- `release-inventory` compensation is required
- order should become `failed` or `payment_failed`
- receipt mail should not be queued

### receipt mail fails

Expected behavior:

- order remains placed
- receipt mail outbox item remains pending or failed
- retry uses dedupe key

### analytics fails

Expected behavior:

- order remains placed
- warning or diagnostic is recorded
- best-effort failure does not affect order success

## What This Sample Adds Beyond RegisterUser

RegisterUser showed:

- critical DB write
- outbox human notification
- best-effort analytics

PlaceOrder adds:

- external compensatable effects
- idempotency key for external mutation
- external reference storage
- compensation is not rollback
- reconciliation for split-brain local/external state
- richer partial success states

## Future TypeScript Shape

The runtime will likely need explicit scenario states before implementation. A possible future shape:

```ts
const placeOrder = junction("place-order")
  .critical(createOrder)
  .critical(reserveInventory)
  .compensating(authorizePayment)
  .critical(storePaymentReference)
  .outbox(enqueueReceiptMail)
  .outbox(enqueueShipmentJob)
  .bestEffort(trackOrderCreated)
```

The first implementation should remain a sample of Effect Junction semantics, not a general workflow engine or payment framework.
