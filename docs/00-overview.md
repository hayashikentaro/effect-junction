# Overview

Effect Junction is an experimental design approach for composing real-world side effects by attributes, not by technology labels.

In many TypeScript applications, DB writes, API calls, email delivery, queue publication, analytics, and file operations all collapse into the same shape: `Promise`. That shape is useful for execution, but it hides important world semantics.

Effect Junction restores those semantics by describing each effect with attributes such as ownership, visibility, transactionality, reversibility, idempotency, failure mode, and timing.

## Core Idea

An Effect Junction is the place where multiple effects become one meaningful business operation.

Examples:

- user registration: create user, send confirmation mail, track analytics
- order placement: create order, reserve inventory, charge payment, send receipt, schedule shipment
- webhook handling: save raw event, dedupe, preserve ordering, update domain state, write outbox
- permission change: update role, revoke sessions, invalidate cache, audit, sync IdP
- AI agent execution: edit files, run commands, run tests, comment on GitHub, leave audit logs

The important question is not only "which adapter owns this operation?" It is also "what happens if one effect succeeds and another fails?"

## Attribute Vectors

Instead of grouping effects only by technology labels like DB, API, Mail, or Queue, this repository groups them by world-facing attributes:

- who owns the state
- who can observe the effect
- whether it is transactional
- whether it can be reversed or compensated
- whether duplicate execution is harmful
- how failure should affect the parent operation
- when the effect must happen

These attributes form the basis for prescriptions.

## Prescriptions

A prescription is a design recommendation derived from effect attributes.

For example:

- human-visible + irreversible + dedupeRequired: prefer outbox, require dedupe key, avoid direct retry
- nonTransactional + pending: do not run inside DB transaction, record pending state
- bestEffort: must not block the critical path
- external + compensatable + keyed: store external reference and provide compensation handler

Prescriptions are not automatic proof of correctness. They are design diagnostics that make risk visible.

## Specific Handling Remains Explicit

Attributes should diagnose common structure, not erase all specificity. Stripe, Gmail, S3, Google Calendar, legal acceptance rules, and business-specific completion criteria may still require adapters, policies, or specific handlers.

The target is not perfect abstraction. A useful goal is to explain roughly 70% of the design pressure through attributes and keep the remaining provider or business uniqueness explicit.

## Next

Read [The Problem](01-problem.md) for the failure mode this repository addresses.
