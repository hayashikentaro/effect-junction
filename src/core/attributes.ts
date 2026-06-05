export type Ownership = "internal" | "external" | "human";

export type Visibility = "machine" | "operator" | "user" | "public";

export type Transactionality =
  | "transactional"
  | "nonTransactional"
  | "eventual";

export type Reversibility =
  | "reversible"
  | "compensatable"
  | "irreversible";

export type Idempotency =
  | "natural"
  | "keyed"
  | "dedupeRequired"
  | "duplicateTolerant";

export type FailureMode =
  | "critical"
  | "pending"
  | "bestEffort"
  | "compensate"
  | "escalate";

export type Timing = "immediate" | "deferrable" | "scheduled" | "expires";

export type EffectAttributes = {
  ownership: Ownership;
  visibility: Visibility;
  transactionality: Transactionality;
  reversibility: Reversibility;
  idempotency: Idempotency;
  failureMode: FailureMode;
  timing: Timing;
};

export function formatAttributes(attributes: EffectAttributes): string {
  return [
    attributes.ownership,
    attributes.visibility,
    attributes.transactionality,
    attributes.reversibility,
    attributes.idempotency,
    attributes.failureMode,
    attributes.timing,
  ].join(" / ");
}
