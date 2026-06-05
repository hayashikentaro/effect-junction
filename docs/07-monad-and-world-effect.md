# Monad And World Effect

Monad and Effect systems model side effects as computations.

That is valuable. `IO`, `Task`, `Effect`, ZIO, Effect-TS, and similar tools can make asynchronous execution, dependency management, failure typing, retries, resource handling, and concurrency much more explicit.

Effect Junction does not reject those tools. It adds a second layer of description: side effects as actions in the world.

## Two Layers

Effect Monad:

- treats a side effect as an executable computation
- composes execution
- models failure and dependency structure

World Effect Attributes:

- treat a side effect as a real-world action
- describe ownership, visibility, reversibility, idempotency, and failure meaning
- guide operation design and prescriptions

## Correspondence

| Concern | Typical computation abstraction |
| --- | --- |
| asynchronicity | `Task`, `IO`, `Effect` |
| failure possibility | `Either`, `Result`, typed error |
| dependency environment | `Reader`, `Layer`, `Context` |
| resource management | `Resource`, `Scope`, `bracket` |
| concurrency | fiber, race, parallel |
| retry | schedule, retry policy |

These abstractions help execute effects correctly. They do not necessarily describe the real-world consequences of the effects.

## Where Monad Alone Is Weak

A computation abstraction usually does not fully express:

- ownership
- visibility
- reversibility
- idempotency hazard
- human-visible consequences
- audit requirements
- compensation obligations
- business failure semantics
- traces left in external systems

For example, two effects may both have type `Effect<void, Error, Env>`, while one updates a local row and another sends a public message. Their computation shape is similar. Their world semantics are not.

## Future WorldEffect Type

A future TypeScript model could look like:

```ts
type WorldEffect<A, E, R> = {
  name: string
  effect: Effect<A, E, R>
  attributes: EffectAttributes
  policy?: EffectPolicy
  adapterSpecific?: unknown
}
```

This repository does not need to depend on Effect-TS in the first implementation. A small TypeScript sample can start with plain async functions and explicit metadata.

## Next

Read [Roadmap](08-roadmap.md) for the planned implementation sequence.
