import { runRegisterUserScenario } from "../runtime/register-user-runtime.js";
import { parseScenarioName } from "../runtime/scenarios.js";
import { runPlaceOrderScenario } from "../runtime/place-order-runtime.js";
import {
  categorizePlaceOrderState,
  parsePlaceOrderScenarioName,
  placeOrderScenarioExpectations,
  type PlaceOrderScenarioExpectation,
} from "../runtime/place-order-states.js";
import { type RunScenarioResult } from "../runtime/register-user-runtime.js";
import {
  formatList,
  formatPlaceOrderRuntimeSummary,
} from "./demo-format.js";

function readArg(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function printHeader(): void {
  console.log("=== Effect Junction Demo ===");
}

function printSection(title: string): void {
  console.log("");
  console.log(`${title}:`);
}

function printLines(lines: readonly string[]): void {
  for (const line of lines) {
    console.log(line);
  }
}

function printReport(report: string): void {
  printSection("Report");
  console.log(report);
}

function printPlaceOrderExpectation(
  expectation: PlaceOrderScenarioExpectation,
): void {
  printSection("Scenario Expectation");
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
  printLines(formatList(expectation.notes, "    "));
}

function printRegisterUserRuntimeResult(result: RunScenarioResult): void {
  printSection("Runtime Result");
  if (result.registerResult) {
    console.log(`  ok: ${result.registerResult.ok}`);
    console.log(`  userId: ${result.registerResult.user.id}`);
    console.log(`  email: ${result.registerResult.user.email}`);
  } else if (result.failure) {
    console.log("  ok: false");
    console.log(`  error: ${result.failure.error}`);
  }
  console.log(`  sentMailCount: ${result.runtime.sentMessages.length}`);
  console.log(`  analyticsEvents: ${result.runtime.analyticsEvents.length}`);

  printSection("Outbox");
  console.log("  items:");
  if (result.runtime.outbox.items.length === 0) {
    console.log("    - none");
  } else {
    for (const item of result.runtime.outbox.items) {
      console.log(`    - id: ${item.id}`);
      console.log(`      effectName: ${item.effectName}`);
      console.log(`      status: ${item.status}`);
      console.log(`      attempts: ${item.attempts}`);
      console.log(`      dedupeKey: ${item.dedupeKey}`);
      if (item.lastError) {
        console.log(`      lastError: ${item.lastError}`);
      }
    }
  }

  console.log("  dispatch attempts:");
  if (result.runtime.outbox.attempts.length === 0) {
    console.log("    - none");
  } else {
    for (const attempt of result.runtime.outbox.attempts) {
      console.log(`    - itemId: ${attempt.itemId}`);
      console.log(`      attempt: ${attempt.attempt}`);
      console.log(`      status: ${attempt.status}`);
      console.log(`      dedupeKey: ${attempt.dedupeKey}`);
      if (attempt.error) {
        console.log(`      error: ${attempt.error}`);
      }
    }
  }

  printSection("Warnings");
  printLines(
    formatList(result.registerResult?.warnings ?? result.failure?.warnings ?? []),
  );

  printSection("Diagnostics");
  if (result.scenario.name === "duplicate-dispatch") {
    console.log(
      `  - duplicate dispatch skipped: ${result.runtime.outbox.attempts.some(
        (attempt) => attempt.status.startsWith("skipped"),
      )}`,
    );
  } else {
    printLines(formatList([]));
  }
}

const junctionName = readArg("--junction") ?? "register-user";
const scenarioArg = readArg("--scenario");
const seedArg = readArg("--seed");
const seed = seedArg === undefined ? undefined : Number(seedArg);

if (junctionName === "place-order") {
  const scenarioName = parsePlaceOrderScenarioName(scenarioArg);
  const expectation = placeOrderScenarioExpectations[scenarioName];
  const runtimeResult = await runPlaceOrderScenario(scenarioName);

  printHeader();
  printSection("Junction");
  console.log("  place-order");
  printSection("Scenario");
  console.log(`  ${scenarioName}`);
  printPlaceOrderExpectation(expectation);
  printReport(runtimeResult.report);
  console.log("");
  printLines(formatPlaceOrderRuntimeSummary(runtimeResult));
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

printHeader();
printSection("Junction");
console.log("  register-user");
printSection("Scenario");
console.log(`  ${result.scenario.name}`);
if (result.scenario.seed !== undefined) {
  console.log(`  seed: ${result.scenario.seed}`);
}
printReport(result.report);
printRegisterUserRuntimeResult(result);
