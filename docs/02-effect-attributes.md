# Effect Attributes

Effect Attributes describe a side effect as a real-world action, not only as a technical operation.

Each effect can be described by an attribute vector:

- ownership
- visibility
- transactionality
- reversibility
- idempotency
- failureMode
- timing

These attributes are intentionally small and practical. They are meant to drive design review and prescription generation.

## ownership

| Value | Meaning | Typical examples | Notes |
| --- | --- | --- | --- |
| `internal` | State is owned by this system. | application DB row, internal outbox item | Usually easier to transact, inspect, and repair. |
| `external` | State is owned by another system. | payment provider charge, SaaS API update, object storage | Store external references and expect partial failure. |
| `human` | The effect reaches a person or depends on a person. | email, SMS, notification, approval request | Often visible, hard to reverse, and sensitive to duplicates. |

## visibility

| Value | Meaning | Typical examples | Notes |
| --- | --- | --- | --- |
| `machine` | Only systems normally observe it. | DB state, queue message, analytics event | Duplicates may still matter even when humans do not see them. |
| `operator` | Internal operators may observe it. | admin alert, audit dashboard, support queue | Requires useful status and diagnostics. |
| `user` | A product user can observe it. | confirmation email, receipt, notification | Retries and duplicates need careful handling. |
| `public` | Public audiences can observe it. | public post, published page, social message | Strong review, audit, and rollback expectations. |

## transactionality

| Value | Meaning | Typical examples | Notes |
| --- | --- | --- | --- |
| `transactional` | Can participate in a transaction or atomic commit scope. | relational DB write | Good for critical invariants. |
| `nonTransactional` | Cannot be rolled back with the local transaction. | email send, external API call | Avoid running inside a DB transaction unless carefully justified. |
| `eventual` | Expected to become consistent later. | search indexing, analytics, async projection | Needs observable pending or lag states when important. |

## reversibility

| Value | Meaning | Typical examples | Notes |
| --- | --- | --- | --- |
| `reversible` | Can be undone directly. | local draft write, soft-deleted row | Verify whether reversal is actually complete. |
| `compensatable` | Cannot be undone, but a compensating action exists. | payment refund, inventory release | Requires compensation handler and stored references. |
| `irreversible` | Cannot be meaningfully undone. | email sent, public notification, audit event | Prefer outbox, dedupe, and explicit review of retry behavior. |

## idempotency

| Value | Meaning | Typical examples | Notes |
| --- | --- | --- | --- |
| `natural` | Repeating the same operation naturally has the same result. | upsert by primary key, set exact value | Still confirm race behavior. |
| `keyed` | Safe retry requires a stable idempotency key. | payment charge with idempotency key | Key generation and persistence are part of the design. |
| `dedupeRequired` | Duplicate effects are harmful and must be deduped. | email, webhook handling, notification | Store dedupe records or outbox item identity. |
| `duplicateTolerant` | Duplicates are acceptable or low-impact. | some analytics events, metrics | Must not block critical paths. |

## failureMode

| Value | Meaning | Typical examples | Notes |
| --- | --- | --- | --- |
| `critical` | Failure fails the parent operation. | create user, reserve required inventory | Usually belongs in the main transaction or invariant path. |
| `pending` | Failure leaves work to finish later. | outbox email, async provisioning | Needs durable pending state and retry policy. |
| `bestEffort` | Failure should be logged but not fail the operation. | analytics, optional metrics | Must not block the critical path. |
| `compensate` | Failure requires a compensating action. | refund after downstream failure | Requires handler, state machine, and observability. |
| `escalate` | Failure requires human or operator action. | suspicious external mismatch, legal review | Must be visible and actionable. |

## timing

| Value | Meaning | Typical examples | Notes |
| --- | --- | --- | --- |
| `immediate` | Must happen during the operation. | invariant-preserving DB write | Keep scope tight. |
| `deferrable` | Can happen after the main operation succeeds. | mail outbox, analytics | Often pairs with outbox or background jobs. |
| `scheduled` | Must happen at a specific later time. | renewal, reminder, retry window | Needs scheduler and clock assumptions. |
| `expires` | Must happen before a deadline. | confirmation token, reservation hold | Requires expiry state and timeout behavior. |

## Next

Read [Effect Junction](03-effect-junction.md) for how attributes are used at a multi-effect boundary.
