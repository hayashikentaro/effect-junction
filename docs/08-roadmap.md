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

## Phase 5: Mock Runtime

- `InMemoryOutbox`
- `MockDB`
- `MockMailer`
- `MockAnalytics`
- deterministic failure toggles

The mock runtime should exist only to demonstrate semantics. It should not become a production framework.

## Phase 6: Tests

Cover the first sample scenarios:

- DB failure
- mail failure
- analytics failure
- duplicate mail retry protection
- best-effort effect does not fail critical path

## Phase 7: Second Sample

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
