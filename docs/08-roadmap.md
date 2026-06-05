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
- no real external services in runtime samples
- no raw `Math.random` inside mock services

The mock runtime should exist only to demonstrate semantics. It should not become a production framework.

Current implementation: RegisterUser uses in-memory services, `FaultInjector`, named scenarios, and seeded chaos for demo exploration. PlaceOrder uses deterministic mock services for the planned scenario list.

## Phase 6: Demo CLI

The demo CLI can run named RegisterUser and PlaceOrder scenarios:

```sh
npm run demo -- --scenario happy-path
npm run demo -- --scenario db-fails
npm run demo -- --scenario mail-fails
npm run demo -- --scenario analytics-fails
npm run demo -- --scenario duplicate-dispatch
npm run demo -- --scenario chaos --seed 42
npm run demo -- --junction place-order
npm run demo -- --junction place-order --scenario payment-succeeds-reference-store-fails
npm run demo -- --junction place-order --scenario analytics-fails
```

The CLI should make the Junction report visible without requiring real DB, mail, or analytics services.

Current implementation: `npm run demo` accepts RegisterUser scenarios with optional `--seed`, and PlaceOrder scenarios with `--junction place-order`.

## Phase 7: Tests

Covered RegisterUser scenarios:

- DB failure does not enqueue mail and does not run analytics.
- mail dispatch failure leaves outbox item pending or failed.
- analytics failure does not fail registration.
- duplicate dispatch is skipped by dedupe key.
- seeded chaos is reproducible, but deterministic scenarios remain the primary tests.

Covered PlaceOrder scenarios:

- inventory reservation failure stops before payment and outbox.
- payment authorization failure records compensation requirement.
- payment reference store failure records reconciliation requirement.
- receipt and shipment outbox failures keep the order placed with retryable state.
- analytics failure records a best-effort warning without failing the order.

Architecture boundary tests also guard the intended dependency direction.

Current implementation path: Node built-in tests cover deterministic runtime scenarios, seed reproducibility, PlaceOrder scenario coverage, and architecture boundaries.

## Phase 8: Second Sample

`PlaceOrderJunction` is implemented as a static model/report sample plus an educational deterministic mock runtime. It covers:

- order creation
- inventory reservation
- payment
- receipt mail
- shipment job
- compensation
- external reference storage
- reconciliation

Current status:

- PlaceOrder static model/report: done
- PlaceOrder state model: done
- PlaceOrder deterministic runtime for planned scenarios: done
- PlaceOrder runtime file split: done
- architecture boundary guard: done

References:

- [Place Order Sample](10-place-order-sample.md)
- [Place Order Runtime Plan](12-place-order-runtime-plan.md)
- [Place Order Implementation Checklist](13-place-order-implementation-checklist.md)

## Future Work

- improve demo formatting
- add provider policy examples outside core
- add reconciliation job example outside core
- add compensation handler example outside core
- keep core provider-agnostic

## Guiding Constraint

Do not turn this into a generic effect runtime. The implementation should remain a working sample of the Effect Junction idea.
