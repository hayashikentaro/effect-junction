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

## Current Samples

`RegisterUserJunction` demonstrates a critical DB write, outbox mail, best-effort analytics, and deterministic failure scenarios.

It coordinates:

1. `create-user` as a critical internal transactional effect
2. `send-confirmation-mail` as a human-visible outbox effect
3. `track-signup` as a best-effort analytics effect

Its deterministic mock runtime covers `happy-path`, `db-fails`, `mail-fails`, `analytics-fails`, `duplicate-dispatch`, and seeded `chaos`.

`PlaceOrderJunction` demonstrates inventory reservation, external payment authorization, payment reference split-brain, outbox receipt/shipment failures, and best-effort analytics failure. Its deterministic mock runtime covers the planned scenario list.

Both runtimes are deterministic mock runtimes for learning Effect Junction semantics. This project is not a production workflow engine or payment framework.

Future TypeScript may move toward a small DSL like:

```ts
const registerUser = junction("register-user")
  .critical("create-user", createUser)
  .outbox("send-confirmation-mail", sendConfirmationMail)
  .bestEffort("track-signup", trackSignup)
```

This repository is documentation-first. Runtime work is added only as small educational samples after the terms, examples, and prescriptions are stable.

The current TypeScript sample models attributes, prescriptions, a Junction builder, report output, deterministic RegisterUser and PlaceOrder mock runtimes, and architecture boundary guard tests.

The demo output is sectioned to show the report, scenario expectation when available, runtime result, snapshot or outbox state, warnings, and diagnostics.

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
npm run demo -- --junction place-order --scenario payment-authorization-fails
npm run demo -- --junction place-order --scenario payment-succeeds-reference-store-fails
npm run demo -- --junction place-order --scenario receipt-mail-fails
npm run demo -- --junction place-order --scenario shipment-job-fails
npm run demo -- --junction place-order --scenario analytics-fails
npm run web:build
npm run web:serve
```

The browser demo is a dependency-free plain HTML/TypeScript UI for selecting RegisterUser and PlaceOrder scenarios and viewing reports, runtime results, snapshots, warnings, and diagnostics.

After `npm run web:serve`, open `http://localhost:4173/web/`.

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
- [Validation And Handoff](docs/14-validation-and-handoff.md)
- [Clean Architecture Coexistence](docs/15-clean-architecture-coexistence.md)

## Status

This is an experimental design repository. The current purpose is to keep the design concrete through small TypeScript samples while preserving `src/core` as a provider-agnostic model layer.
