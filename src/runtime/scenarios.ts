import {
  createFaultInjector,
  type FaultConfig,
  type FaultInjector,
} from "./fault-injector.js";
import { seededRandom } from "./seeded-random.js";

export type ScenarioName =
  | "happy-path"
  | "db-fails"
  | "mail-fails"
  | "analytics-fails"
  | "duplicate-dispatch"
  | "chaos";

export type ScenarioConfig = {
  name: ScenarioName;
  dispatchAttempts: number;
  seed?: number;
  faultInjector: FaultInjector;
};

const deterministicScenarios: Record<
  Exclude<ScenarioName, "chaos">,
  FaultConfig & { dispatchAttempts: number }
> = {
  "happy-path": {
    dispatchAttempts: 1,
  },
  "db-fails": {
    failures: ["create-user"],
    dispatchAttempts: 0,
  },
  "mail-fails": {
    failures: ["send-confirmation-mail"],
    dispatchAttempts: 1,
  },
  "analytics-fails": {
    failures: ["track-signup"],
    dispatchAttempts: 1,
  },
  "duplicate-dispatch": {
    dispatchAttempts: 2,
  },
};

export function createScenarioConfig(
  name: ScenarioName = "happy-path",
  options: { seed?: number } = {},
): ScenarioConfig {
  if (name !== "chaos") {
    const config = deterministicScenarios[name];
    return {
      name,
      dispatchAttempts: config.dispatchAttempts,
      faultInjector: createFaultInjector(config),
    };
  }

  const seed = options.seed ?? 1;
  const random = seededRandom(seed);
  const failures = [
    random.chance(0.2) ? "create-user" : undefined,
    random.chance(0.35) ? "send-confirmation-mail" : undefined,
    random.chance(0.5) ? "track-signup" : undefined,
  ].filter((value): value is string => value !== undefined);

  return {
    name,
    seed,
    dispatchAttempts: 1,
    faultInjector: createFaultInjector({ failures }),
  };
}

export function parseScenarioName(value: string | undefined): ScenarioName {
  const scenario = value ?? "happy-path";
  if (
    scenario === "happy-path" ||
    scenario === "db-fails" ||
    scenario === "mail-fails" ||
    scenario === "analytics-fails" ||
    scenario === "duplicate-dispatch" ||
    scenario === "chaos"
  ) {
    return scenario;
  }

  throw new Error(`Unknown scenario: ${scenario}`);
}
