# Repository Guide

This guide helps readers quickly understand directory and file responsibilities in this Effect Junction repository.

This is a guide to this repository, not a universal app architecture. The repo is an educational design sample. Production applications may use a Clean Architecture layout like [Clean Architecture Coexistence](15-clean-architecture-coexistence.md), but this repo is intentionally smaller.

## Top-Level Layout

| Path | Role | Notes |
| --- | --- | --- |
| `README.md` | Entry point and command overview. | Links to the docs and shows CLI/browser demo commands. |
| `AGENTS.md` | Working rules for implementation agents. | Defines repo boundary, terminology, verification, commit, and push expectations. |
| `package.json` | npm scripts and package metadata. | Provides `build`, `test`, `demo`, `web:build`, and `web:serve`. |
| `tsconfig.json` | TypeScript compiler configuration. | Emits ESM JavaScript into `dist/`. |
| `src/` | TypeScript source, tests, CLI sample, and browser demo source. | Contains core model, samples, deterministic runtimes, tests, and web UI. |
| `docs/` | Design and implementation documentation. | Documents concepts, samples, runtime plans, validation, and architecture boundaries. |
| `dist/` | Generated build output. | Created by `npm run build` or `npm run web:build`; do not edit generated files directly. |

## Source Layout

```txt
src/
  core/
  samples/
  runtime/
  tests/
  web/
```

### `src/core`

Role:

- provider-agnostic vocabulary and model layer
- Effect Attributes
- WorldEffect / EffectRole
- Prescription derivation
- Junction builder
- report generation
- public exports

Files:

- `attributes.ts`
- `effect.ts`
- `prescription.ts`
- `junction.ts`
- `report.ts`
- `index.ts`

Important rule:

- `src/core` must not import runtime, samples, tests, web, or CLI code.

### `src/samples`

Role:

- static Junction examples and CLI demo
- not provider-specific production adapters

Files:

- `register-user.ts`
- `place-order.ts`
- `demo.ts`
- `demo-format.ts`

`register-user.ts` and `place-order.ts` define static Effect Junction models. `demo.ts` is the CLI boundary. `demo-format.ts` keeps some CLI formatting logic testable without snapshotting full stdout.

### `src/runtime`

Role:

- deterministic educational mock runtimes
- scenario execution
- mock services
- state models
- outbox semantics

RegisterUser files:

- `register-user-runtime.ts`
- `scenarios.ts`
- `fault-injector.ts`
- `in-memory-outbox.ts`
- `mock-services.ts`
- `seeded-random.ts`

PlaceOrder files:

- `place-order-states.ts`
- `place-order-runtime.ts`
- `place-order-runtime-types.ts`
- `place-order-mock-services.ts`
- `place-order-outbox.ts`

Important rules:

- runtime can depend on core/samples where needed
- runtime must not depend on tests
- runtime is educational deterministic mock infrastructure, not production infrastructure

### `src/tests`

Role:

- Node built-in tests
- model tests
- runtime scenario tests
- formatter tests
- architecture boundary tests

Files:

- `register-user.test.ts` guards the RegisterUser static model/report.
- `place-order.test.ts` guards the PlaceOrder static model/report.
- `register-user-runtime.test.ts` guards RegisterUser deterministic runtime scenarios.
- `place-order-states.test.ts` guards PlaceOrder state expectations.
- `place-order-runtime.test.ts` guards PlaceOrder deterministic runtime scenarios.
- `architecture-boundaries.test.ts` guards intended dependency direction.
- `demo-format.test.ts` guards pure demo formatting helpers.

### `src/web`

Role:

- dependency-free browser demo
- scenario selector UI
- visual runtime result / snapshot / warnings / diagnostics
- no real external services

Files:

- `index.html`
- `main.ts`
- `styles.css`

Important rules:

- web is a visualization/demo layer
- web may depend on runtime and samples
- core must not depend on web

## Docs Layout

- `00-overview.md` introduces the Effect Junction idea.
- `01-problem.md` explains the side-effect semantics problem.
- `02-effect-attributes.md` defines the attribute vocabulary.
- `03-effect-junction.md` describes Junctions as named side-effect intersections.
- `04-prescriptions.md` describes prescriptions derived from attributes.
- `05-register-user-sample.md` documents the RegisterUser sample.
- `06-clean-architecture-boundary.md` explains how technical boundaries and semantic effect boundaries differ.
- `07-monad-and-world-effect.md` compares monadic composition with World Effect semantics.
- `08-roadmap.md` records current status and future direction.
- `09-mock-runtime.md` documents the deterministic RegisterUser mock runtime.
- `10-place-order-sample.md` documents the PlaceOrder sample.
- `11-implementation-map.md` maps layers, dependencies, tests, and implementation files.
- `12-place-order-runtime-plan.md` records the PlaceOrder scenario-state design reference.
- `13-place-order-implementation-checklist.md` tracks PlaceOrder runtime slices.
- `14-validation-and-handoff.md` lists validation commands, current slices, and handoff notes.
- `15-clean-architecture-coexistence.md` explains Clean Architecture coexistence patterns.
- `16-repository-guide.md` is this repository directory and responsibility guide.

## Reading Paths

### For concept

1. README
2. `docs/01-problem.md`
3. `docs/02-effect-attributes.md`
4. `docs/03-effect-junction.md`
5. `docs/04-prescriptions.md`

### For implementation

1. `docs/16-repository-guide.md`
2. `docs/11-implementation-map.md`
3. `src/core/index.ts`
4. `src/samples/place-order.ts`
5. `src/runtime/place-order-states.ts`
6. `src/runtime/place-order-runtime.ts`
7. `src/tests/place-order-runtime.test.ts`

### For demo

1. README command section
2. `npm run demo -- --junction place-order --scenario payment-succeeds-reference-store-fails`
3. `npm run web:build`
4. `npm run web:serve`
5. Open `http://localhost:4173/web/`

### For Clean Architecture adaptation

1. `docs/15-clean-architecture-coexistence.md`
2. `docs/06-clean-architecture-boundary.md`
3. `docs/11-implementation-map.md`

## Dependency Rules Summary

- `src/core` is the stable provider-agnostic model layer.
- `src/samples` defines static demo Junctions and the CLI boundary.
- `src/runtime` demonstrates deterministic runtime semantics.
- `src/tests` can inspect all layers they verify.
- `src/web` visualizes runtime results and reports.
- provider-specific behavior stays outside core.
- Junction structure should not be applied everywhere.

`src/tests/architecture-boundaries.test.ts` guards part of this dependency direction. It is intentionally lightweight and does not replace a full dependency analyzer.

## Common Change Recipes

### Add a new effect attribute

- update the core attribute model
- update prescriptions
- add tests
- update docs

### Add a new sample Junction

- add `src/samples/...`
- add docs
- add model tests
- add runtime only after scenario semantics are explicit

### Add a new runtime scenario

- define scenario name/state expectation
- update runtime
- update tests
- update demo / web if needed
- update docs

### Add provider-specific behavior

- do not put it in core
- add adapter/policy outside core
- keep Junction semantics provider-neutral
