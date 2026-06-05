import { runRegisterUserScenario } from "../runtime/register-user-runtime.js";
import { parseScenarioName } from "../runtime/scenarios.js";
import { runPlaceOrderScenario } from "../runtime/place-order-runtime.js";
import {
  categorizePlaceOrderState,
  parsePlaceOrderScenarioName,
  placeOrderScenarioExpectations,
} from "../runtime/place-order-states.js";
import { PlaceOrderJunction } from "./place-order.js";

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

const junctionName = readArg("--junction") ?? "register-user";
const scenarioArg = readArg("--scenario");
const seedArg = readArg("--seed");
const seed = seedArg === undefined ? undefined : Number(seedArg);

if (junctionName === "place-order") {
  const scenarioName = parsePlaceOrderScenarioName(scenarioArg);
  const expectation = placeOrderScenarioExpectations[scenarioName];
  const runtimeResult = await runPlaceOrderScenario(scenarioName);

  console.log(PlaceOrderJunction.report());
  console.log("");
  console.log("Scenario expectation:");
  console.log(`  scenario: ${expectation.scenario}`);
  console.log(`  finalOrderState: ${expectation.finalOrderState}`);
  console.log(
    `  category: ${categorizePlaceOrderState(expectation.finalOrderState)}`,
  );
  console.log(
    `  expectedPaymentState: ${expectation.expectedPaymentState ?? "none"}`,
  );
  console.log(
    `  expectedInventoryState: ${expectation.expectedInventoryState ?? "none"}`,
  );
  console.log("  notes:");
  for (const note of expectation.notes) {
    console.log(`    - ${note}`);
  }
  console.log("");
  if (scenarioName !== "happy-path") {
    console.log(`Runtime: not implemented for this scenario`);
    console.log("Diagnostics:");
    for (const diagnostic of runtimeResult.diagnostics) {
      console.log(`  - ${diagnostic}`);
    }
    process.exit(0);
  }

  console.log("Runtime result:");
  console.log(`  ok: ${runtimeResult.ok}`);
  console.log(`  orderState: ${runtimeResult.orderState}`);
  console.log(`  orderCategory: ${runtimeResult.orderCategory}`);
  console.log(`  paymentState: ${runtimeResult.paymentState}`);
  console.log(`  inventoryState: ${runtimeResult.inventoryState}`);
  console.log(`  orderId: ${runtimeResult.snapshot.order?.id ?? "none"}`);
  console.log(`  paymentId: ${runtimeResult.snapshot.payment?.id ?? "none"}`);
  console.log(
    `  inventoryReservationId: ${runtimeResult.snapshot.inventory?.id ?? "none"}`,
  );
  console.log(
    `  outbox.receipt: ${runtimeResult.snapshot.outbox.receipt.join(", ")}`,
  );
  console.log(
    `  outbox.shipment: ${runtimeResult.snapshot.outbox.shipment.join(", ")}`,
  );
  console.log(
    `  analyticsEvents: ${runtimeResult.snapshot.analyticsEvents.length}`,
  );
  console.log("  warnings:");
  if (runtimeResult.warnings.length === 0) {
    console.log("    - none");
  } else {
    for (const warning of runtimeResult.warnings) {
      console.log(`    - ${warning}`);
    }
  }
  console.log("  diagnostics:");
  for (const diagnostic of runtimeResult.diagnostics) {
    console.log(`    - ${diagnostic}`);
  }
  process.exit(0);
}

if (junctionName !== "register-user") {
  throw new Error(`Unknown junction: ${junctionName}`);
}

if (seedArg !== undefined && Number.isNaN(seed)) {
  throw new Error(`Invalid seed: ${seedArg}`);
}

const scenarioName = parseScenarioName(scenarioArg);
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
console.log("Dispatch attempts:");
for (const attempt of result.runtime.outbox.attempts) {
  const error = attempt.error ? ` error=${attempt.error}` : "";
  console.log(
    `  - ${attempt.itemId} attempt=${attempt.attempt} status=${attempt.status} dedupeKey=${attempt.dedupeKey}${error}`,
  );
}
if (result.runtime.outbox.attempts.length === 0) {
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
    `Duplicate dispatch skipped: ${result.runtime.outbox.attempts.some(
      (attempt) => attempt.status.startsWith("skipped"),
    )}`,
  );
}
