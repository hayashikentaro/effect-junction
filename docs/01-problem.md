# Problem

Clean Architecture often keeps the domain pure and pushes side effects outward into repositories, gateways, mailers, queue clients, and services. This is usually valuable. It reduces coupling and keeps business rules from depending directly on infrastructure.

However, real application operations often contain several side effects whose ordering, failure semantics, retry behavior, and compensation rules are part of the business meaning.

Technical boundaries can be clean while the real-world operation remains fragile.

## Promise Hides World Semantics

This code looks ordinary:

```ts
await db.save(order)
await mail.sendReceipt(order.email)
await analytics.track("order_created", { orderId: order.id })
```

Each line is an awaited effect. But the effects do not damage or change the world in the same way.

- `db.save` may be transactional and internally owned.
- `mail.sendReceipt` is user-visible and practically irreversible.
- `analytics.track` may be duplicate-tolerant and best effort.

The type `Promise<void>` tells us that execution is asynchronous. It does not tell us whether a retry will create a duplicate charge, send two emails, violate audit expectations, or leave an external system inconsistent.

## Common Breakage

Typical failure cases include:

- DB success + mail failure: the user exists but never receives a confirmation message.
- payment success + order save failure: external money movement happened without durable internal state.
- webhook redelivery: the same event is processed twice because dedupe is missing.
- stale cache or index: the source of truth changed but derived machine-visible state did not.
- AI agent execution: a tool run creates a large diff, partial edits, or external comments without a clear audit trail.

These are not just infrastructure failures. They are semantic failures of a multi-effect operation.

## Clean Boundaries Can Still Hide Broken Reality

Separating `Repository`, `Gateway`, and `Mailer` does not by itself answer these questions:

- Which effects define the success of the operation?
- Which effects are allowed to fail after the critical path?
- Which effects must be retried?
- Which effects must never be blindly retried?
- Which external references must be stored?
- Which failures require compensation or escalation?
- Which states must be observable by operators?

The problem is: the boundary may be clean, but reality can still break.

Effect Junction exists to name and structure the place where these questions belong.

## Next

Read [Effect Attributes](02-effect-attributes.md) for the vocabulary used to describe side effects.
