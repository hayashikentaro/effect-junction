# Implementation Map

This document maps the current TypeScript implementation and its dependencies.

This is not a production workflow engine. The implementation is a small working sample of Effect Junction semantics. Runtime exists only for `RegisterUserJunction`. `PlaceOrderJunction` has a static model/report sample, but no runtime. Core types should remain independent from the mock runtime.

## Layer Map

```mermaid
flowchart TB
  Docs[docs/*.md] --> Vocabulary[Shared Vocabulary]

  subgraph Core["src/core"]
    Attributes[attributes.ts]
    Effect[effect.ts]
    Prescription[prescription.ts]
    Junction[junction.ts]
    Report[report.ts]
    CoreIndex[index.ts]
  end

  subgraph Samples["src/samples"]
    RegisterUser[register-user.ts]
    PlaceOrder[place-order.ts]
    Demo[demo.ts]
  end

  subgraph Runtime["src/runtime"]
    FaultInjector[fault-injector.ts]
    Scenarios[scenarios.ts]
    SeededRandom[seeded-random.ts]
    MockServices[mock-services.ts]
    Outbox[in-memory-outbox.ts]
    RegisterUserRuntime[register-user-runtime.ts]
  end

  subgraph Tests["src/tests"]
    RegisterUserModelTests[register-user.test.ts]
    PlaceOrderModelTests[place-order.test.ts]
    RuntimeTests[register-user-runtime.test.ts]
  end

  Vocabulary --> Core
  Core --> Samples
  Core --> Runtime
  Samples --> Runtime
  Samples --> Demo
  Runtime --> Demo
  Core --> Tests
  Samples --> Tests
  Runtime --> Tests
```

## Core Dependency Map

`src/core` is the stable model layer. It should not import runtime, samples, tests, or CLI code.

```mermaid
flowchart LR
  Attributes[attributes.ts<br/>EffectAttributes]
  Effect[effect.ts<br/>WorldEffect / EffectRole]
  Prescription[prescription.ts<br/>derivePrescriptions]
  Junction[junction.ts<br/>junction builder]
  Report[report.ts<br/>createReport]
  Index[index.ts<br/>public core exports]

  Attributes --> Effect
  Effect --> Prescription
  Effect --> Junction
  Attributes --> Report
  Prescription --> Report
  Junction --> Report
  Attributes --> Index
  Effect --> Index
  Prescription --> Index
  Junction --> Index
  Report --> Index
```

Core responsibilities:

- define Effect Attributes and World Effects
- derive Prescriptions from attribute combinations
- build Junctions from static World Effects
- render reports from Junction metadata

Core non-responsibilities:

- execute side effects
- know about DB, mail, analytics, payments, or shipping
- know about demo CLI arguments
- model production workflow orchestration

## Sample And Runtime Map

`RegisterUserJunction` has both a static model and a deterministic mock runtime. `PlaceOrderJunction` currently has only a static model/report sample.

```mermaid
flowchart TB
  subgraph StaticSamples["Static samples"]
    RegisterUserStatic[RegisterUserJunction<br/>src/samples/register-user.ts]
    PlaceOrderStatic[PlaceOrderJunction<br/>src/samples/place-order.ts]
  end

  subgraph RegisterRuntime["RegisterUser runtime only"]
    ScenarioConfig[Scenario config]
    FaultInjector[FaultInjector]
    MockDB[MockDB]
    MockMailer[MockMailer]
    MockAnalytics[MockAnalytics]
    Outbox[InMemoryOutbox]
    RegisterRuntimeNode[RegisterUserRuntime]
  end

  Demo[demo.ts]

  RegisterUserStatic --> RegisterRuntimeNode
  ScenarioConfig --> FaultInjector
  FaultInjector --> MockDB
  FaultInjector --> MockMailer
  FaultInjector --> MockAnalytics
  Outbox --> MockMailer
  MockDB --> RegisterRuntimeNode
  MockAnalytics --> RegisterRuntimeNode
  Outbox --> RegisterRuntimeNode
  RegisterRuntimeNode --> Demo
  RegisterUserStatic --> Demo
  PlaceOrderStatic --> Demo
```

The runtime exists to demonstrate RegisterUser semantics:

- critical user creation
- outbox mail dispatch
- best-effort analytics
- deterministic failure scenarios
- outbox item state separated from dispatch attempt history

It does not generalize into a reusable queue, workflow, or effect runtime.

## Demo CLI Flow

`npm run demo` defaults to the RegisterUser happy path. `--junction place-order` prints the PlaceOrder static report and does not run a runtime scenario.

```mermaid
flowchart TD
  Start[npm run demo] --> Args{CLI args}
  Args -->|no --junction<br/>or register-user| Scenario[parse --scenario<br/>default happy-path]
  Args -->|--junction place-order| PlaceReport[print PlaceOrderJunction report]
  PlaceReport --> PlaceStop[Runtime: not implemented]

  Scenario --> RunRegister[runRegisterUserScenario]
  RunRegister --> RegisterRuntime[RegisterUserRuntime]
  RegisterRuntime --> Dispatch[dispatch outbox attempts]
  Dispatch --> Output[print report, result, outbox, attempts, warnings]
```

Supported RegisterUser scenario commands:

```sh
npm run demo
npm run demo -- --scenario happy-path
npm run demo -- --scenario db-fails
npm run demo -- --scenario mail-fails
npm run demo -- --scenario analytics-fails
npm run demo -- --scenario duplicate-dispatch
npm run demo -- --scenario chaos --seed 42
```

Supported PlaceOrder command:

```sh
npm run demo -- --junction place-order
```

## RegisterUser Runtime Flow

```mermaid
sequenceDiagram
  participant CLI as demo.ts
  participant Scenario as scenarios.ts
  participant Runtime as RegisterUserRuntime
  participant DB as MockDB
  participant Outbox as InMemoryOutbox
  participant Analytics as MockAnalytics
  participant Mailer as MockMailer

  CLI->>Scenario: createScenarioConfig(name, seed?)
  CLI->>Runtime: runRegisterUserScenario(...)
  Runtime->>DB: createUser(input)
  alt create-user fails
    DB-->>Runtime: throw
    Runtime-->>CLI: failure, no outbox item, no analytics
  else create-user succeeds
    DB-->>Runtime: user
    Runtime->>Outbox: enqueueConfirmationMail(...)
    Runtime->>Analytics: trackSignup(user.id)
    alt analytics fails
      Analytics-->>Runtime: throw
      Runtime->>Runtime: record warning
    else analytics succeeds
      Analytics-->>Runtime: event recorded
    end
    Runtime->>Outbox: dispatchAll(mailer)
    Outbox->>Mailer: sendConfirmation(email, dedupeKey)
    Mailer-->>Outbox: sent or failed
    Outbox-->>Runtime: item state + attempt history
    Runtime-->>CLI: result snapshot
  end
```

## Outbox State Model

The outbox distinguishes durable item state from dispatch attempt history.

```mermaid
stateDiagram-v2
  [*] --> pending: enqueue
  pending --> sent: dispatch sent
  pending --> failed: dispatch failed
  failed --> sent: retry succeeds
  failed --> failed: retry fails
  sent --> sent: later dispatch skippedTerminal
```

```mermaid
flowchart LR
  DispatchAttempt[dispatch attempt] --> Sent[sent]
  DispatchAttempt --> Failed[failed]
  DispatchAttempt --> SkippedDuplicate[skippedDuplicate]
  DispatchAttempt --> SkippedTerminal[skippedTerminal]
```

In `duplicate-dispatch`, the item remains `sent` after the first successful dispatch. The second dispatch attempt records `skippedTerminal`, so the demo shows that a repeated dispatch happened without sending a second mail.

## Test Coverage Map

```mermaid
flowchart TB
  RegisterModel[register-user.test.ts] --> CoreReports[core prescriptions and reports]
  PlaceModel[place-order.test.ts] --> CoreReports
  RuntimeTests[register-user-runtime.test.ts] --> RegisterRuntime[RegisterUser runtime]

  RegisterModel --> RegisterStatic[RegisterUser static sample]
  PlaceModel --> PlaceStatic[PlaceOrder static sample]
  RuntimeTests --> Scenarios[happy/db/mail/analytics/duplicate/chaos]
```

Tests intentionally avoid real external services.

## Dependency Rules

- `src/core` must stay independent from `src/runtime`.
- `src/samples` may depend on `src/core`.
- `src/runtime` may depend on `src/core` and RegisterUser sample metadata, but should remain RegisterUser-specific for now.
- `src/samples/demo.ts` may depend on samples and runtime because it is the CLI boundary.
- `src/tests` may depend on all layers.
- PlaceOrder has no runtime until explicitly implemented.
