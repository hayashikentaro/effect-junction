# Effect Junction

Effect Junction is an experimental design repository for describing places where multiple real-world side effects meet.

It is not trying to make every side effect "safe" through one generic wrapper. The core idea is narrower: when a business operation combines several effects, the combination itself often carries business meaning. That place should be named, described, and designed explicitly.

## What Is An Effect Junction?

An Effect Junction is a boundary around a meaningful operation that coordinates multiple side effects and their real-world semantics:

- execution order
- success conditions
- failure classification
- compensation
- retry and idempotency behavior
- observability and audit requirements

For example, `registerUser(input)` may look like a single application operation from the outside. Inside it may create a database user, enqueue a confirmation email, and track analytics. Those effects all look like `await` in TypeScript, but they do not have the same meaning in the world.

## What This Is Not

Effect Junction is not:

- a general-purpose Effect system
- a replacement for Clean Architecture
- a framework that wraps every side effect in `safeEffect.run()`
- a sandbox or security product
- a claim that DB, API, Mail, Queue, and File boundaries do not matter

Clean technical boundaries are useful. This repository focuses on the cases where technical boundaries alone do not describe the failure semantics of a business operation.

## Why This Exists

TypeScript `Promise` represents asynchronous execution. It does not represent whether an effect is human-visible, irreversible, externally owned, idempotent, compensatable, audit-sensitive, or safe to retry.

These all look similar in code:

```ts
await db.users.create(input)
await mailer.sendConfirmation(email)
await analytics.track("user_registered", { userId })
```

But they are different kinds of real-world actions:

- a DB insert may be transactional and internally owned
- an email is human-visible and effectively irreversible
- analytics may be external, eventual, and best effort

Effect Junction treats side effects by attribute vectors rather than technology labels. The goal is to derive design prescriptions from attributes, then leave provider-specific details to adapters, policies, or specific handlers.

## First Sample: RegisterUserJunction

The first planned working sample is `RegisterUserJunction`.

It coordinates:

1. `create-user` as a critical internal transactional effect
2. `send-confirmation-mail` as a human-visible outbox effect
3. `track-signup` as a best-effort analytics effect

The first working sample will use deterministic mock services and scenario-based failures rather than real external services.

Future TypeScript may move toward a small DSL like:

```ts
const registerUser = junction("register-user")
  .critical("create-user", createUser)
  .outbox("send-confirmation-mail", sendConfirmationMail)
  .bestEffort("track-signup", trackSignup)
```

This repository is documentation-first. Runtime work is added only as small samples after the terms, examples, and prescriptions are stable.

The current TypeScript sample models attributes, prescriptions, a Junction builder, report output, and a deterministic RegisterUser mock runtime.

The second planned sample is `PlaceOrderJunction`, intended to exercise compensatable external effects, payment references, and reconciliation.

PlaceOrder failure scenario runtime is intentionally deferred until the scenario-state plan is stable.

PlaceOrder happy-path runtime is available as the first educational slice; failure scenarios remain planned.

```sh
npm install
npm run build
npm test
npm run demo
npm run demo -- --scenario happy-path
npm run demo -- --scenario db-fails
npm run demo -- --scenario mail-fails
npm run demo -- --scenario analytics-fails
npm run demo -- --scenario duplicate-dispatch
npm run demo -- --scenario chaos --seed 42
npm run demo -- --junction place-order
npm run demo -- --junction place-order --scenario happy-path
npm run demo -- --junction place-order --scenario inventory-reservation-fails
npm run demo -- --junction place-order --scenario payment-succeeds-reference-store-fails
```

## Documentation

- [Overview](docs/00-overview.md)
- [Problem](docs/01-problem.md)
- [Effect Attributes](docs/02-effect-attributes.md)
- [Effect Junction](docs/03-effect-junction.md)
- [Prescriptions](docs/04-prescriptions.md)
- [Register User Sample](docs/05-register-user-sample.md)
- [Clean Architecture Boundary](docs/06-clean-architecture-boundary.md)
- [Monad And World Effect](docs/07-monad-and-world-effect.md)
- [Roadmap](docs/08-roadmap.md)
- [Mock Runtime](docs/09-mock-runtime.md)
- [Place Order Sample](docs/10-place-order-sample.md)
- [Implementation Map](docs/11-implementation-map.md)
- [Place Order Runtime Plan](docs/12-place-order-runtime-plan.md)
- [Place Order Implementation Checklist](docs/13-place-order-implementation-checklist.md)

## Status

This is an experimental design repository. The immediate purpose is to make the design concrete enough that a small TypeScript working sample can be implemented next.
