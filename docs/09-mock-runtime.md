# Mock Runtime

The first runtime sample should avoid real external services.

`RegisterUserJunction` needs to demonstrate semantic differences between DB writes, confirmation mail, analytics, outbox retry, and dedupe behavior. Real databases, mail providers, and analytics SDKs would add setup cost and provider-specific noise before the design vocabulary is stable.

## Why Not Pure Randomness?

Pure randomness is not enough for the first sample because it makes failures hard to explain, test, and reproduce.

Deterministic scenarios are the default for docs and tests. They should make each semantic point visible with a named configuration.

Seeded chaos mode can exist later for demos and exploration, but it should not replace deterministic tests.

## FaultInjector

A future mock runtime can route all planned failures through a small `FaultInjector`:

```ts
type FaultInjector = {
  shouldFail(effectName: string): boolean
  delayMs(effectName: string): number
}
```

Mock services should ask the injector whether a named effect should fail or delay. They should not call raw `Math.random` internally.

## Mock Services

- `MockDB`: creates users and can fail the critical create path.
- `MockMailer`: dispatches confirmation mail and can fail delivery.
- `MockAnalytics`: records signup analytics and can fail as best effort.
- `InMemoryOutbox`: stores pending mail dispatch work and dedupe keys.

These mocks exist to demonstrate semantics, not to model production infrastructure.

## Scenario List

- `happy-path`: user is created, mail is queued and dispatched, analytics succeeds.
- `db-fails`: user creation fails, mail is not enqueued, analytics is not run.
- `mail-fails`: user creation succeeds, outbox item remains pending or failed.
- `analytics-fails`: registration succeeds while analytics records a warning.
- `duplicate-dispatch`: two dispatch attempts use the same dedupe key and the second is skipped.
- `chaos with seed`: `--seed 42` reproduces the same exploratory failure pattern.

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
