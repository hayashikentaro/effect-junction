# Agent Guidelines

This repo is design-first.

## Working Rules

- Do not over-engineer runtime before docs stabilize.
- Do not turn this into a generic Effect system.
- Do not introduce heavy dependencies without explicit reason.
- Prefer small TypeScript examples.
- Keep examples understandable without requiring Effect-TS.
- If implementing code, start from `RegisterUserJunction`.
- Do not edit generated files if any are added later.

## Terminology

Keep these terms consistent:

- Effect Junction
- World Effect
- Effect Attributes
- Prescription
- `critical`
- `outbox`
- `bestEffort`
- `compensating`
- `audit`

## Scope Discipline

Effect Junction is about places where multiple side effects cross and the crossing has business meaning.

Do not create a Junction for every side effect. Do not hide all effects behind a universal `safeEffect.run()` style API. Prefer explicit attributes, explicit order, explicit failure classification, and explicit retry or compensation rules.

## Implementation Direction

When code is added, keep it small:

- plain TypeScript first
- no framework dependency unless it clarifies the sample
- deterministic mock adapters
- report output that reflects prescriptions
- tests for DB failure, mail failure, and analytics failure

Provider-specific behavior belongs in adapters or policies. The Junction should describe operation semantics, not SDK plumbing.
