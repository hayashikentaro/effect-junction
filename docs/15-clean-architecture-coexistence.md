# Clean Architecture Coexistence

This document is a directory layout and responsibility guide for using Effect Junction alongside Clean Architecture.

Effect Junction does not replace Clean Architecture. It does not remove ports/adapters, and it should not put provider-specific behavior into domain or core code. It names and designs side-effect intersections inside business operations, especially where failure changes real-world state in ways a rollback cannot fully erase.

## Purpose

Clean Architecture organizes dependency direction, technical boundaries, and ports/adapters. Effect Junction focuses on the business operation where multiple side effects cross and the post-failure world state needs explicit design.

In a Clean Architecture codebase, a Junction usually appears inside an application use case, near the place where multiple ports are called and their combined failure semantics become business-significant.

## Responsibility Split

| Concern | Clean Architecture responsibility | Effect Junction responsibility |
| --- | --- | --- |
| dependency direction | Keeps dependencies pointing inward toward domain/application policy. | Respects the dependency direction; does not require core/domain to know infrastructure. |
| technical boundaries | Separates domain, application, ports, adapters, and interfaces. | Names the business operation where effects cross those boundaries. |
| ports/adapters | Defines provider-neutral ports and provider-specific adapter implementations. | Describes what the port calls mean when combined in one operation. |
| business operation orchestration | Places orchestration in the application/use case layer. | Makes the multi-effect crossing explicit with roles, states, and expected outcomes. |
| failure-state semantics | Provides the layer where business decisions can live. | Owns named failure states such as `payment_failed` or `reconciliation_required`. |
| compensation | Keeps compensation policy out of infrastructure plumbing. | Defines when compensation is required and what should be visible. |
| reconciliation | Provides application-level ownership for cross-system mismatch. | Names split-brain or pending states and their expected diagnostics. |
| diagnostics / operator visibility | Gives application code a place to produce operational signals. | Defines diagnostics near the Junction instead of scattering them across catch blocks. |
| provider-specific API behavior | Belongs to infrastructure adapters or provider policies outside core. | Must not encode provider SDK details in the Junction core. |

## Recommended Directory Layout

```txt
src/
  domain/
    order/
      Order.ts
      OrderPolicy.ts

  application/
    usecases/
      place-order/
        PlaceOrderUseCase.ts

        junction/
          PlaceOrderJunction.ts
          PlaceOrderStates.ts
          PlaceOrderScenarios.ts
          PlaceOrderDiagnostics.ts
          PlaceOrderResult.ts

        policies/
          PaymentReferencePolicy.ts
          InventoryCompensationPolicy.ts
          ReceiptOutboxPolicy.ts

  ports/
    OrderRepository.ts
    InventoryPort.ts
    PaymentPort.ts
    MailOutboxPort.ts
    ShippingOutboxPort.ts
    AnalyticsPort.ts

  infrastructure/
    db/
      SqlOrderRepository.ts
    payment/
      StripePaymentAdapter.ts
    mail/
      MailerAdapter.ts
    shipping/
      ShippingAdapter.ts
    analytics/
      AnalyticsAdapter.ts

  interfaces/
    http/
      PlaceOrderController.ts
```

- `domain/` contains business entities and pure policies.
- `application/usecases/...` coordinates operation flow.
- `application/usecases/.../junction/` contains failure-state semantics for multi-effect intersections.
- `ports/` defines technology-neutral dependencies.
- `infrastructure/` implements provider-specific behavior.
- `interfaces/` handles delivery mechanisms such as HTTP.

## Where Junction Logic Lives

For `PlaceOrder`, the application use case calls ports. The Junction describes what those calls mean when they are combined.

- `PlaceOrderUseCase` calls ports and coordinates the operation flow.
- `PlaceOrderJunction` defines the named operation and effect roles.
- `PlaceOrderStates` defines states such as `placed`, `payment_failed`, and `reconciliation_required`.
- `PlaceOrderDiagnostics` defines operator-visible messages.
- `PaymentReferencePolicy` may decide what a local/external reference mismatch means.
- `StripePaymentAdapter` knows Stripe API details, but not the domain meaning of `reconciliation_required`.

The `payment-succeeds-reference-store-fails` scenario is not just a DB error. It means:

- external payment authorized
- local payment reference missing
- rollback insufficient
- reconciliation required
- receipt/shipment should not proceed until reconciled

That meaning belongs near the application use case and Junction state model, not inside a provider SDK adapter.

## Anti-patterns

- Put all provider-specific payment behavior into the Junction core.
- Treat every use case as a Junction.
- Wrap every side effect in a generic `safeEffect` helper and stop there.
- Scatter compensation/reconciliation decisions across catch blocks.
- Hide split-brain states behind generic exceptions.
- Let infrastructure adapters decide business success/failure semantics.
- Turn Effect Junction into a production workflow engine by accident.

## AI-Assisted Development Boundary

Most code outside side-effect intersections can remain lightweight and fast. UI display, DTO mapping, local validation, pure transformations, formatters, mock data, and thin single-effect adapters do not need heavy Junction structure by default.

Junctions are for dangerous intersections where failure leaves meaningful world-state residue. Effect Junction is a way to identify where AI-assisted speed must give way to explicit world-state design.

Effect Junction is not a call to slow the whole system down. It is a marker for the small number of places where world-state semantics must be designed explicitly.

## Testing Implications

Junction tests should focus on:

- scenario names
- expected final states
- diagnostics
- compensation requirement
- reconciliation requirement
- no unintended downstream effects
- outbox item state vs dispatch attempt history
- best-effort failure not blocking critical path

Infrastructure adapter tests are separate. They should verify provider-specific request/response behavior, mapping, retries, authentication, or SDK details without deciding the business meaning of a multi-effect failure state.

## Relation To This Repository

This repository is not a full Clean Architecture application, but it demonstrates the pieces:

- `src/core` = provider-agnostic vocabulary and report model
- `src/samples/place-order.ts` = static Junction sample
- `src/runtime/place-order-states.ts` = state model
- `src/runtime/place-order-runtime.ts` = educational deterministic runtime
- `src/web` and `src/samples/demo.ts` = visualization / demo layers
- `src/tests/architecture-boundaries.test.ts` = lightweight boundary guard

A production application would likely move runtime orchestration under `application/usecases` and provider adapters under `infrastructure`. The same rule still applies: provider-specific behavior stays outside core, while failure-state semantics for multi-effect business operations stay near the use case and Junction model.
