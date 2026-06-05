# Prescriptions

A prescription is a design recommendation derived from Effect Attributes.

The goal is not to automatically prove that an operation is correct. The goal is to expose design pressure early: where retries are dangerous, where pending state is required, where compensation is missing, and where a best-effort effect is accidentally blocking the critical path.

## Prescription Engine

A future prescription engine can inspect a `WorldEffect` and emit recommendations or warnings.

For example:

```ts
const prescriptions = derivePrescriptions(sendConfirmationMail)
```

The output might include:

- `requires-dedupe-key`
- `prefer-outbox`
- `avoid-direct-retry`
- `audit-recommended`

## Attribute Combinations

| Attribute combination | Recommended structure |
| --- | --- |
| `human-visible` + `irreversible` + `dedupeRequired` | Require dedupe key, prefer outbox, avoid direct retry, consider audit. |
| `nonTransactional` + `pending` | Do not run inside DB transaction, record pending state, retry from durable storage. |
| `bestEffort` | Must not block critical path, log warning on failure, use timeout or background execution. |
| `external` + `compensatable` + `keyed` | Require idempotency key, store external reference, require compensation handler, consider reconciliation job. |
| `internal` + `transactional` + `critical` | Run in transaction, enforce invariants, consider optimistic locking. |
| `eventual` + `machine` + `bestEffort` | Prefer async projection, tolerate lag, emit diagnostics rather than failing the operation. |

## Warning Examples

Potential warnings include:

- irreversible human-visible effect should not be directly retried
- non-transactional pending effect should not run inside DB transaction
- best-effort effect must not block critical path
- external compensatable effect should store external reference
- external keyed effect should persist the idempotency key before retry
- public irreversible effect should require explicit audit trail

## Diagnostics, Not Automatic Answers

Prescriptions are design diagnostics. They can guide a review, generate a report, or fail a test when a required handler is missing.

They should not pretend to know every provider or business rule. A Stripe charge, a Gmail message, an S3 object write, and a calendar invitation may share attributes but still need adapter-specific policy.

The intended split is:

- attributes diagnose common structure
- prescriptions recommend common safeguards
- adapters and policies handle provider-specific behavior
- Junctions define operation-specific success and failure meaning

## Next

Read [Register User Sample](05-register-user-sample.md) for the first concrete design.
