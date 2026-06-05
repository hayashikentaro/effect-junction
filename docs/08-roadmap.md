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

Initial implementation path: plain TypeScript metadata types under `src/core`.

## Phase 3: Prescription Engine

- `derivePrescriptions(effect)`
- rules for common attribute combinations
- warnings for dangerous combinations
- simple report output

Initial implementation path: deterministic prescription objects with code, level, and reason.

## Phase 4: Junction Builder

- `junction(name)`
- `.critical(...)`
- `.outbox(...)`
- `.bestEffort(...)`
- `.compensating(...)`
- report generation

Initial implementation path: `RegisterUserJunction` sample and a text report demo.

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

Initial implementation path: RegisterUser-only in-memory services, `FaultInjector`, named scenarios, and seeded chaos for demo exploration.

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

Initial implementation path: `npm run demo` accepts `--scenario` and optional `--seed`.

## Phase 7: Tests

Cover the first sample scenarios:

- DB failure does not enqueue mail and does not run analytics.
- mail dispatch failure leaves outbox item pending or failed.
- analytics failure does not fail registration.
- duplicate dispatch is skipped by dedupe key.
- seeded chaos is reproducible, but deterministic scenarios remain the primary tests.

Initial implementation path: Node built-in tests cover the deterministic runtime scenarios and seed reproducibility.

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

Initial design doc: [Place Order Sample](10-place-order-sample.md). Runtime implementation is still deferred.

## Guiding Constraint

Do not turn this into a generic effect runtime. The implementation should remain a working sample of the Effect Junction idea.
