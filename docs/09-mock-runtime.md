# Mock Runtime

The first runtime sample avoids real external services.

`RegisterUserJunction` needs to demonstrate semantic differences between DB writes, confirmation mail, analytics, outbox retry, and dedupe behavior. Real databases, mail providers, and analytics SDKs would add setup cost and provider-specific noise before the design vocabulary is stable.

## Why Not Pure Randomness?

Pure randomness is not enough for the first sample because it makes failures hard to explain, test, and reproduce.

Deterministic scenarios are the default for docs and tests. They should make each semantic point visible with a named configuration.

Seeded chaos mode exists for demos and exploration, but it does not replace deterministic tests.

## FaultInjector

The mock runtime routes planned failures through a small `FaultInjector`:

```ts
type FaultInjector = {
  shouldFail(effectName: string): boolean
  delayMs(effectName: string): number
}
```

Mock services ask the injector whether a named effect should fail or delay. They do not call raw `Math.random` internally.

## Mock Services

- `MockDB`: creates users and can fail the critical create path.
- `MockMailer`: dispatches confirmation mail and can fail delivery.
- `MockAnalytics`: records signup analytics and can fail as best effort.
- `InMemoryOutbox`: stores pending mail dispatch work and dedupe keys.

These mocks exist to demonstrate semantics, not to model production infrastructure.

## Outbox State

The outbox separates durable item state from dispatch attempt history.

Item status is the current state of work:

- `pending`
- `sent`
- `failed`

Dispatch attempt status records what happened during each dispatch:

- `sent`
- `failed`
- `skippedDuplicate`
- `skippedTerminal`

`dispatchAll` retries `failed` items in this sample. A `sent` item is terminal, so later dispatches do not call the mailer again. The item remains `sent`, and the attempt history records `skippedTerminal`.

This keeps `duplicate-dispatch` honest: the second dispatch is visible, but it does not overwrite the durable item state or send a second message.

## Scenario List

- `happy-path`: user is created, mail is queued and dispatched, analytics succeeds.
- `db-fails`: user creation fails, mail is not enqueued, analytics is not run.
- `mail-fails`: user creation succeeds, outbox item remains pending or failed.
- `analytics-fails`: registration succeeds while analytics records a warning.
- `duplicate-dispatch`: two dispatch attempts use the same dedupe key and the second is skipped.
- `chaos with seed`: `--seed 42` reproduces the same exploratory failure pattern.

## Demo CLI

```sh
npm run demo -- --scenario happy-path
npm run demo -- --scenario db-fails
npm run demo -- --scenario mail-fails
npm run demo -- --scenario analytics-fails
npm run demo -- --scenario duplicate-dispatch
npm run demo -- --scenario chaos --seed 42
```

`npm run demo` defaults to `happy-path`.

## Symptoms Represented

- critical DB failure
- outbox dispatch failure
- best-effort analytics failure
- duplicate-sensitive mail dispatch

## Symptoms Not Represented Well By Simple Randomness

- external side succeeded but local response timed out
- payment succeeded but DB save failed
- webhook ordering inversion
- external reference loss
- human actually read the message
- legal or audit obligations

Those cases may need later samples, explicit state machines, provider policies, or human/operator modeling. They should not be hidden behind generic random failure.
