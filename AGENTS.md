# Agent Guidelines

This repo is design-first.

## Repository Boundary

This repository is intended to track:

https://github.com/hayashikentaro/effect-junction

Before making changes, confirm the local checkout:

```sh
pwd
git remote -v
git status --short --branch
```

The expected remote is:

```txt
origin  https://github.com/hayashikentaro/effect-junction (fetch)
origin  https://github.com/hayashikentaro/effect-junction (push)
```

An SSH remote for the same repository is also acceptable:

```txt
origin  git@github.com:hayashikentaro/effect-junction.git (fetch)
origin  git@github.com:hayashikentaro/effect-junction.git (push)
```

Do not edit files outside this repository unless the user explicitly asks.

## Change Authorization Boundary

- Only edit files directly required by the requested task.
- Do not turn analysis, diagnosis, recommendations, or proposals into repository changes unless the user explicitly asks for repository edits.
- Optional cleanup, formatting sweeps, unrelated docs updates, and adjacent refactors require explicit user approval.
- The commit-and-push rule applies only after an authorized repository change has been made. It does not authorize making unrelated changes.

## Standard Task Workflow

Before editing:

- Confirm `pwd`.
- Confirm `git remote -v`.
- Check `git status --short --branch`.
- Preserve existing user changes.
- If unexpected changes or untracked files exist, report them instead of modifying or deleting them.

While editing:

- Keep changes scoped to the requested task.
- Prefer small, reviewable changes.
- Avoid broad refactors unless required.
- Follow existing project conventions.
- Keep terminology consistent with this repository:
  - Effect Junction
  - World Effect
  - Effect Attributes
  - Prescription
  - `critical`
  - `outbox`
  - `bestEffort`
  - `compensating`
  - `audit`
- Do not turn this into a generic Effect system.
- Do not introduce heavy dependencies unless explicitly justified.
- Keep examples understandable without requiring Effect-TS.

After editing:

- Run verification appropriate for the change.
- At minimum, run `git diff --check`.
- For documentation-only changes, `git diff --check` is required.
- If `package.json` or TypeScript code exists and code changed, run the relevant existing npm scripts after inspecting `package.json`.
- If a check cannot be run because of sandbox, permissions, missing dependencies, or missing local services, report that clearly.

When finished:

- Commit the relevant changes.
- Push the commit.
- Report what changed.
- Report verification commands run.
- Report the commit hash.
- Report push status.
- Report skipped checks and why.
- Report unexpected files not touched.

## Commit And Push Rule

Whenever repository files are modified, commit the relevant changes and push them to the current branch.

変更したら、関連する変更を commit して push すること。

- Do not force push.
- If push fails, report the reason and leave the local commit intact.
- Do not claim that changes are pushed unless `git push` succeeded.
- If there is nothing to commit, report that explicitly.

## Runtime And Generated Files

- Do not commit generated runtime state unless explicitly requested.
- Do not delete untracked files unless the task explicitly asks for cleanup and the file is clearly generated.
- If unexpected untracked files exist, report them rather than modifying them.
- If generated files or build outputs are introduced later, document them here.

## Handoff Reporting

When handing work back, always report:

- What changed.
- Verification commands run.
- Commit hash.
- Push status.
- Known limitations or skipped checks.
- Unexpected files not touched.

## Project Working Rules

- Do not over-engineer runtime before docs stabilize.
- Do not turn this into a generic Effect system.
- Do not introduce heavy dependencies without explicit reason.
- Prefer small TypeScript examples.
- Keep examples understandable without requiring Effect-TS.
- If implementing code, start from `RegisterUserJunction`.
- Do not edit generated files if any are added later.

## Terminology

Keep these terms consistent:

- Effect Junction
- World Effect
- Effect Attributes
- Prescription
- `critical`
- `outbox`
- `bestEffort`
- `compensating`
- `audit`

## Scope Discipline

Effect Junction is about places where multiple side effects cross and the crossing has business meaning.

Do not create a Junction for every side effect. Do not hide all effects behind a universal `safeEffect.run()` style API. Prefer explicit attributes, explicit order, explicit failure classification, and explicit retry or compensation rules.

## Implementation Direction

When code is added, keep it small:

- plain TypeScript first
- no framework dependency unless it clarifies the sample
- deterministic mock adapters
- deterministic scenarios and a `FaultInjector` for the first mock runtime, not raw `Math.random`
- optional seeded chaos mode only for demos
- no real external services in the first sample
- report output that reflects prescriptions
- tests for DB failure, mail failure, and analytics failure

Provider-specific behavior belongs in adapters or policies. The Junction should describe operation semantics, not SDK plumbing.
