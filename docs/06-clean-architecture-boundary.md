# Clean Architecture Boundary

Effect Junction does not reject Clean Architecture.

Domain, Application, and Infrastructure separation remains useful. Pure domain rules should stay independent from databases, mail providers, payment SDKs, queues, and external APIs.

The issue is narrower: when multiple side effects together define a business operation, hiding their composition inside a loose collection of adapters can hide the real failure semantics.

## Application-Level Structure

An Effect Junction is not infrastructure.

It is an application-level structure that describes the negotiation with reality:

- which effects must happen
- which effects can happen later
- which failures fail the operation
- which failures create pending work
- which failures need compensation
- which outcomes must be observable

Adapters still do provider-specific work. A Junction decides how those effects relate to one another.

## From Technology Boundaries To Failure Semantics

Technology labels are still useful:

- Repository
- Gateway
- Mailer
- Queue
- Storage

But a multi-effect operation often needs another classification:

- `critical`
- `outbox`
- `bestEffort`
- `compensating`
- `audit`
- `idempotent`

For example, splitting an order flow into `OrderRepository`, `PaymentGateway`, and `ReceiptMailer` does not by itself define the order completion condition.

The operation also needs to answer:

- Is payment captured before or after order persistence?
- If payment succeeds and order persistence fails, what compensation runs?
- Is the receipt sent directly or through an outbox?
- What external payment reference is stored?
- What state does support see when reconciliation is needed?

## Practical Rule

Keep domain logic clean. Keep adapters isolated. Add a Junction when the combination of effects is itself part of the business meaning.

Do not create Junctions for every single effect. Create them where crossing boundaries is the actual problem.

## Next

Read [Monad And World Effect](07-monad-and-world-effect.md) for how this relates to Effect systems.
