import { formatAttributes } from "./attributes.js";
import type { Junction } from "./junction.js";
import { derivePrescriptions } from "./prescription.js";

export function createReport(junction: Junction): string {
  const lines: string[] = [`Junction: ${junction.name}`, "", "Effects:"];

  for (const effect of junction.effects) {
    lines.push("", `* ${effect.name}`, `  role: ${effect.role}`);

    if (effect.description) {
      lines.push(`  description: ${effect.description}`);
    }

    lines.push(`  attributes: ${formatAttributes(effect.attributes)}`);
    lines.push("  prescriptions:");

    const prescriptions = derivePrescriptions(effect);
    if (prescriptions.length === 0) {
      lines.push("    - none");
      continue;
    }

    for (const prescription of prescriptions) {
      lines.push(`    - ${prescription.code} (${prescription.level})`);
      lines.push(`      reason: ${prescription.reason}`);
    }
  }

  return lines.join("\n");
}
