import { runRegisterUserScenario } from "../runtime/register-user-runtime.js";
import { parseScenarioName } from "../runtime/scenarios.js";

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

const scenarioName = parseScenarioName(readArg("--scenario"));
const seedArg = readArg("--seed");
const seed = seedArg === undefined ? undefined : Number(seedArg);

if (seedArg !== undefined && Number.isNaN(seed)) {
  throw new Error(`Invalid seed: ${seedArg}`);
}

const result = await runRegisterUserScenario(scenarioName, { seed });

console.log(result.report);
console.log("");
console.log(`Scenario: ${result.scenario.name}`);
if (result.scenario.seed !== undefined) {
  console.log(`Seed: ${result.scenario.seed}`);
}

console.log("");
console.log("RegisterUser:");
if (result.registerResult) {
  console.log(`  ok: ${result.registerResult.ok}`);
  console.log(`  user: ${result.registerResult.user.id} <${result.registerResult.user.email}>`);
} else if (result.failure) {
  console.log("  ok: false");
  console.log(`  error: ${result.failure.error}`);
}

console.log("");
console.log("Outbox:");
for (const item of result.runtime.outbox.items) {
  const error = item.lastError ? ` lastError=${item.lastError}` : "";
  console.log(
    `  - ${item.id} ${item.effectName} status=${item.status} attempts=${item.attempts} dedupeKey=${item.dedupeKey}${error}`,
  );
}
if (result.runtime.outbox.items.length === 0) {
  console.log("  - none");
}

console.log("");
console.log(`Sent mail count: ${result.runtime.sentMessages.length}`);
console.log(`Analytics events: ${result.runtime.analyticsEvents.length}`);

console.log("");
console.log("Warnings:");
for (const warning of result.registerResult?.warnings ?? result.failure?.warnings ?? []) {
  console.log(`  - ${warning}`);
}
if ((result.registerResult?.warnings ?? result.failure?.warnings ?? []).length === 0) {
  console.log("  - none");
}

if (result.scenario.name === "duplicate-dispatch") {
  console.log("");
  console.log(
    `Duplicate dispatch skipped: ${result.runtime.skippedDedupeKeys.length > 0}`,
  );
}
