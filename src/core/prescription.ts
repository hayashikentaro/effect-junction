import type { WorldEffect } from "./effect.js";

export type PrescriptionLevel = "required" | "recommended" | "warning";

export type Prescription = {
  code: string;
  level: PrescriptionLevel;
  reason: string;
};

export function derivePrescriptions(effect: WorldEffect): Prescription[] {
  const prescriptions: Prescription[] = [];
  const attributes = effect.attributes;

  if (
    (attributes.visibility === "user" || attributes.visibility === "public") &&
    attributes.reversibility === "irreversible" &&
    attributes.idempotency === "dedupeRequired"
  ) {
    prescriptions.push(
      {
        code: "requires-dedupe-key",
        level: "required",
        reason:
          "Human-visible irreversible effects need stable dedupe identity before retry.",
      },
      {
        code: "prefer-outbox",
        level: "recommended",
        reason:
          "Durable outbox state separates registration success from delivery retry.",
      },
      {
        code: "avoid-direct-retry",
        level: "warning",
        reason:
          "Direct retry can duplicate an irreversible user-visible effect.",
      },
    );
  }

  if (
    attributes.transactionality === "nonTransactional" &&
    attributes.failureMode === "pending"
  ) {
    prescriptions.push(
      {
        code: "do-not-run-inside-db-transaction",
        level: "warning",
        reason:
          "Non-transactional pending effects should not be mixed into the DB commit scope.",
      },
      {
        code: "record-pending-state",
        level: "required",
        reason:
          "Pending work needs durable state so it can be retried or inspected.",
      },
    );
  }

  if (attributes.failureMode === "bestEffort" || effect.role === "bestEffort") {
    prescriptions.push({
      code: "must-not-block-critical-path",
      level: "required",
      reason:
        "Best-effort effects must not decide whether the parent operation succeeds.",
    });
  }

  if (
    attributes.ownership === "internal" &&
    attributes.transactionality === "transactional" &&
    attributes.failureMode === "critical"
  ) {
    prescriptions.push(
      {
        code: "run-in-transaction",
        level: "required",
        reason:
          "Internal critical transactional effects should protect invariants inside the commit scope.",
      },
      {
        code: "enforce-invariants",
        level: "required",
        reason:
          "Critical internal state changes define whether the operation succeeds.",
      },
    );
  }

  if (
    attributes.ownership === "external" &&
    attributes.reversibility === "compensatable" &&
    attributes.idempotency === "keyed"
  ) {
    prescriptions.push(
      {
        code: "requires-idempotency-key",
        level: "required",
        reason:
          "Keyed external effects require stable keys before retrying provider calls.",
      },
      {
        code: "requires-compensation-handler",
        level: "required",
        reason:
          "Compensatable external effects need an explicit follow-up action.",
      },
      {
        code: "store-external-reference",
        level: "required",
        reason:
          "External state needs a durable local reference for support and reconciliation.",
      },
      {
        code: "consider-reconciliation-job",
        level: "recommended",
        reason:
          "External ownership can leave local and provider state out of sync.",
      },
    );
  }

  return prescriptions;
}
