# Roadmap

The project is design-first. Runtime code should follow the documented vocabulary instead of racing ahead of it.

## Phase 1: Documentation

- Markdown docs
- terminology
- RegisterUser sample design
- agent working rules

## Phase 2: Minimal TypeScript Model

- `EffectAttributes`
- `WorldEffect`
- `EffectRole`
- `Prescription`
- `Junction`

The model should be small and readable. It should not require Effect-TS.

## Phase 3: Prescription Engine

- `derivePrescriptions(effect)`
- rules for common attribute combinations
- warnings for dangerous combinations
- simple report output

## Phase 4: Junction Builder

- `junction(name)`
- `.critical(...)`
- `.outbox(...)`
- `.bestEffort(...)`
- `.compensating(...)`
- report generation

## Phase 5: Deterministic Mock Runtime

- `InMemoryOutbox`
- `MockDB`
- `MockMailer`
- `MockAnalytics`
- `FaultInjector`
- scenario configs
- deterministic scenarios first
- optional seeded chaos mode for demo only
- no real external services in the first sample
- no raw `Math.random` inside mock services

The mock runtime should exist only to demonstrate semantics. It should not become a production framework.

## Phase 6: Demo CLI

Add a future demo CLI that can run named scenarios:

```sh
npm run demo -- --scenario happy-path
npm run demo -- --scenario db-fails
npm run demo -- --scenario mail-fails
npm run demo -- --scenario analytics-fails
npm run demo -- --scenario duplicate-dispatch
npm run demo -- --scenario chaos --seed 42
```

The CLI should make the Junction report visible without requiring real DB, mail, or analytics services.

## Phase 7: Tests

Cover the first sample scenarios:

- DB failure does not enqueue mail and does not run analytics.
- mail dispatch failure leaves outbox item pending or failed.
- analytics failure does not fail registration.
- duplicate dispatch is skipped by dedupe key.
- seeded chaos is reproducible, but deterministic scenarios remain the primary tests.

## Phase 8: Second Sample

Add `PlaceOrderJunction`:

- order creation
- inventory reservation
- payment
- receipt mail
- shipment job
- compensation
- external reference storage
- reconciliation

## Guiding Constraint

Do not turn this into a generic effect runtime. The implementation should remain a working sample of the Effect Junction idea.
