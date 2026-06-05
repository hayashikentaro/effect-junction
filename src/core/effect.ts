import type { EffectAttributes } from "./attributes.js";

export type EffectRole =
  | "critical"
  | "outbox"
  | "bestEffort"
  | "compensating"
  | "audit";

export type WorldEffect = {
  name: string;
  role: EffectRole;
  attributes: EffectAttributes;
  description?: string;
};

export function worldEffect(effect: WorldEffect): WorldEffect {
  return effect;
}
