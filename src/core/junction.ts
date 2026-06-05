import type { EffectRole, WorldEffect } from "./effect.js";
import { createReport } from "./report.js";

export type Junction = {
  name: string;
  effects: readonly WorldEffect[];
  report(): string;
};

export type JunctionBuilder = {
  critical(effect: WorldEffect): JunctionBuilder;
  outbox(effect: WorldEffect): JunctionBuilder;
  bestEffort(effect: WorldEffect): JunctionBuilder;
  compensating(effect: WorldEffect): JunctionBuilder;
  reconciliation(effect: WorldEffect): JunctionBuilder;
  audit(effect: WorldEffect): JunctionBuilder;
  build(): Junction;
  report(): string;
};

export function junction(name: string): JunctionBuilder {
  const effects: WorldEffect[] = [];

  const add = (role: EffectRole, effect: WorldEffect): JunctionBuilder => {
    effects.push({ ...effect, role });
    return builder;
  };

  const build = (): Junction => ({
    name,
    effects: [...effects],
    report() {
      return createReport(this);
    },
  });

  const builder: JunctionBuilder = {
    critical: (effect) => add("critical", effect),
    outbox: (effect) => add("outbox", effect),
    bestEffort: (effect) => add("bestEffort", effect),
    compensating: (effect) => add("compensating", effect),
    reconciliation: (effect) => add("reconciliation", effect),
    audit: (effect) => add("audit", effect),
    build,
    report: () => createReport(build()),
  };

  return builder;
}
