# Validation And Handoff

This document captures the current state of the Effect Junction sample implementation so it can be validated and handed off without reconstructing the project history.

This is not a production workflow engine. This is not a payment framework. It is a design-first educational implementation. The purpose is to keep side-effect semantics concrete and testable while preserving `src/core` as a provider-agnostic model layer.

## Current Completed Slices

### Core model

- Effect Attributes
- WorldEffect
- EffectRole
- Prescription derivation
- Junction builder
- report generation

### RegisterUser sample

- static model/report
- deterministic mock runtime
- deterministic scenarios:
  - `happy-path`
  - `db-fails`
  - `mail-fails`
  - `analytics-fails`
  - `duplicate-dispatch`
  - `chaos` with seed
- outbox item state separated from dispatch attempt history
- seeded chaos mode for demo exploration
- duplicate dispatch / `skippedTerminal` demonstration

### PlaceOrder sample

- static model/report
- state model
- scenario expectation viewer
- deterministic runtime covering all planned scenarios:
  - `happy-path`
  - `inventory-reservation-fails`
  - `payment-authorization-fails`
  - `payment-succeeds-reference-store-fails`
  - `receipt-mail-fails`
  - `shipment-job-fails`
  - `analytics-fails`
- split-brain payment reference case
- compensation-required payment failure
- outbox receipt/shipment failure
- best-effort analytics failure

### Demo output

- sectioned CLI output for report, scenario, runtime result, snapshots, warnings, and diagnostics
- pure formatter helpers in `src/samples/demo-format.ts`
- formatter tests in `src/tests/demo-format.test.ts`
- dependency-free browser UI in `src/web/`

### Guardrails

- architecture boundary tests in `src/tests/architecture-boundaries.test.ts`
- no external runtime dependencies
- no provider-specific behavior in `src/core`
- no Effect-TS dependency
- no real DB, payment, mail, shipping, or analytics services

## Verification Commands

Run these commands from the repository root:

```sh
npm install
npm run build
npm test
npm run demo
npm run demo -- --scenario duplicate-dispatch
npm run demo -- --scenario chaos --seed 42
npm run demo -- --junction place-order
npm run demo -- --junction place-order --scenario payment-succeeds-reference-store-fails
npm run demo -- --junction place-order --scenario analytics-fails
npm run web:build
npm run web:serve
```

For documentation-only changes, at minimum run:

```sh
git diff --check
```

## Expected Validation Signals

- `npm run build` completes TypeScript compilation.
- `npm test` runs model, runtime, formatter, and architecture boundary tests.
- `duplicate-dispatch` shows one sent mail plus a second `skippedTerminal` dispatch attempt.
- `payment-succeeds-reference-store-fails` shows `reconciliation_required`, an authorized external payment, no receipt/shipment outbox items, and diagnostics for the split-brain condition.
- `analytics-fails` for PlaceOrder keeps `ok: true`, `orderState: placed`, and records an analytics warning/diagnostic without blocking the critical path.
- `npm run web:serve` serves the plain browser demo at `http://localhost:4173/web/`.

## Handoff Notes

- Keep `src/core` independent from runtime, samples, tests, and CLI/demo code.
- Keep provider-specific behavior outside `src/core`.
- Treat RegisterUser and PlaceOrder runtimes as deterministic educational mock runtimes.
- Do not introduce real external services without an explicit design decision.
- Do not turn the samples into a generic workflow engine or saga framework.
- Do not introduce Effect-TS or another effect system without an explicit design reason.
- Prefer small scenario-driven additions with focused tests.

## Useful Entry Points

- Core model: `src/core/`
- RegisterUser static sample: `src/samples/register-user.ts`
- RegisterUser runtime: `src/runtime/register-user-runtime.ts`
- PlaceOrder static sample: `src/samples/place-order.ts`
- PlaceOrder state model: `src/runtime/place-order-states.ts`
- PlaceOrder runtime orchestration: `src/runtime/place-order-runtime.ts`
- PlaceOrder runtime types: `src/runtime/place-order-runtime-types.ts`
- PlaceOrder mock services: `src/runtime/place-order-mock-services.ts`
- PlaceOrder outbox: `src/runtime/place-order-outbox.ts`
- Demo CLI: `src/samples/demo.ts`
- Demo formatting helpers: `src/samples/demo-format.ts`
- Browser demo: `src/web/`
- Architecture guard tests: `src/tests/architecture-boundaries.test.ts`
