# Effect Junction

An Effect Junction is the joining point of multiple side effects whose combination has business meaning.

It is not an unstructured place where boundaries are abandoned. It is a higher-level boundary that intentionally crosses smaller technical boundaries to protect a larger semantic boundary.

In short: sometimes you give up a small technology boundary to create a larger meaning boundary.

## Definition

Effect Junction =

> A place where multiple side effects intersect, and their ordering, attributes, failure semantics, compensation, retryability, and observability are handled together.

From the outside, a Junction should look like one meaningful application operation:

```ts
await registerUser(input)
```

Inside, it may coordinate several world effects:

- create a database user
- enqueue confirmation email
- track analytics

## Responsibilities

A Junction is responsible for:

1. Listing participating effects.
2. Defining execution order.
3. Defining success conditions.
4. Classifying failure conditions.
5. Defining compensation when possible.
6. Defining retryability and idempotency requirements.
7. Recording observation logs, reports, or audit state.
8. Exposing a single meaningful operation to the outside.

## What Belongs In A Junction

Put these concerns in a Junction:

- ordering of multiple side effects
- transaction and outbox boundaries
- compensation steps
- idempotency keys
- retry and non-retry decisions
- audit logs
- success and failure state transitions
- derived prescriptions and warnings

These are the concerns that decide whether the real-world operation is coherent.

## What Does Not Belong In A Junction

Avoid putting these into a Junction:

- small business calculations that belong in the domain
- UI-specific concerns
- leaked DB schema details
- raw HTTP request shapes
- accidental technical details
- provider SDK plumbing that belongs in an adapter

A Junction should coordinate meaning. It should not become a dumping ground for unrelated application code.

## Roles

Early examples use these roles:

- `critical`: required for the operation to succeed
- `outbox`: durable pending work that can be retried safely
- `bestEffort`: useful but not allowed to fail the critical path
- `compensating`: action that repairs or offsets a prior effect
- `audit`: durable observation of important decisions or effects

Roles are not a replacement for attributes. They are a small vocabulary for common positions inside a Junction.

## Next

Read [Prescriptions](04-prescriptions.md) for how attributes can produce design recommendations.
