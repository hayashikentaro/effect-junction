# Register User Sample

`RegisterUserJunction` is the first planned working sample.

It coordinates three effects:

1. create a DB user
2. send a confirmation email
3. track signup analytics

## Bad Example

This common implementation hides important semantics:

```ts
async function registerUser(input: RegisterUserInput) {
  const user = await db.users.create(input)
  await mailer.sendConfirmation(user.email)
  await analytics.track("user_registered", { userId: user.id })
  return user
}
```

Problems:

- Does mail failure fail the registration?
- Does analytics failure fail the registration?
- Can mail retry send duplicate messages?
- Is a human-visible irreversible effect running inside a DB transaction?
- Is there any durable pending state for mail delivery?

## Effects With Attributes

### create-user

| Attribute | Value |
| --- | --- |
| role | `critical` |
| ownership | `internal` |
| visibility | `machine` |
| transactionality | `transactional` |
| reversibility | `reversible` |
| idempotency | `natural` |
| failureMode | `critical` |
| timing | `immediate` |

### send-confirmation-mail

| Attribute | Value |
| --- | --- |
| role | `outbox` |
| ownership | `human` |
| visibility | `user` |
| transactionality | `nonTransactional` |
| reversibility | `irreversible` |
| idempotency | `dedupeRequired` |
| failureMode | `pending` |
| timing | `deferrable` |

### track-signup

| Attribute | Value |
| --- | --- |
| role | `bestEffort` |
| ownership | `external` |
| visibility | `machine` |
| transactionality | `eventual` |
| reversibility | `irreversible` |
| idempotency | `duplicateTolerant` |
| failureMode | `bestEffort` |
| timing | `deferrable` |

## Junction Classification

The Junction should treat the three effects differently:

- `create-user` is critical and defines the primary success path.
- `send-confirmation-mail` should be represented by an outbox item so failure becomes pending work, not failed registration.
- `track-signup` is best effort and must not block registration.

## Expected Report

A future report could look like:

```txt
Junction: register-user

Effects:
- create-user: critical, internal, transactional, immediate
- send-confirmation-mail: outbox, human-visible, irreversible, dedupeRequired, deferrable
- track-signup: bestEffort, external, eventual, duplicateTolerant

Prescriptions:
- send-confirmation-mail: prefer-outbox
- send-confirmation-mail: requires-dedupe-key
- send-confirmation-mail: avoid-direct-retry
- track-signup: must-not-block-critical-path
- create-user: run-in-transaction
```

## Failure Scenarios

### 1. DB creation fails

Expected behavior:

- `register-user` fails.
- no mail outbox item is created.
- analytics is not executed.

### 2. Mail delivery fails

Expected behavior:

- user registration is already successful.
- outbox item is `failed` or `pending`.
- retry worker can retry using a dedupe key.
- the main operation does not become failed after user creation.

### 3. Analytics fails

Expected behavior:

- user registration succeeds.
- warning or diagnostic report is recorded.
- the whole operation is not failed.

## Future TypeScript Shape

This repository does not implement the runtime yet, but the intended direction is:

```ts
const registerUser = junction("register-user")
  .critical("create-user", createUser)
  .outbox("send-confirmation-mail", sendConfirmationMail)
  .bestEffort("track-signup", trackSignup)
```

A later working sample should keep the implementation small and understandable without requiring Effect-TS.

## Next

Read [Clean Architecture Boundary](06-clean-architecture-boundary.md) for how this relates to existing architecture patterns.
