import { RegisterUserJunction } from "../samples/register-user.js";
import type { FaultInjector } from "./fault-injector.js";
import { InMemoryOutbox, type OutboxSnapshot } from "./in-memory-outbox.js";
import {
  MockAnalytics,
  MockDB,
  MockMailer,
  type AnalyticsEvent,
  type MockUser,
  type RegisterUserInput,
  type SentMessage,
} from "./mock-services.js";
import {
  createScenarioConfig,
  type ScenarioConfig,
  type ScenarioName,
} from "./scenarios.js";

export type RegisterUserResult = {
  ok: true;
  user: MockUser;
  warnings: string[];
  outbox: OutboxSnapshot;
  analyticsEvents: AnalyticsEvent[];
};

export type RegisterUserFailure = {
  ok: false;
  error: string;
  warnings: string[];
  outbox: OutboxSnapshot;
  analyticsEvents: AnalyticsEvent[];
};

export type RuntimeSnapshot = {
  outbox: OutboxSnapshot;
  sentMessages: SentMessage[];
  skippedDedupeKeys: string[];
  analyticsEvents: AnalyticsEvent[];
  users: MockUser[];
};

export class RegisterUserRuntime {
  readonly db: MockDB;
  readonly mailer: MockMailer;
  readonly analytics: MockAnalytics;
  readonly outbox = new InMemoryOutbox();
  readonly warnings: string[] = [];

  constructor(faultInjector: FaultInjector) {
    this.db = new MockDB(faultInjector);
    this.mailer = new MockMailer(faultInjector);
    this.analytics = new MockAnalytics(faultInjector);
  }

  async registerUser(input: RegisterUserInput): Promise<RegisterUserResult> {
    const user = await this.db.createUser(input);

    this.outbox.enqueueConfirmationMail({
      email: user.email,
      dedupeKey: `confirmation:${user.id}`,
    });

    try {
      await this.analytics.trackSignup(user.id);
    } catch (error) {
      this.warnings.push(
        `track-signup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    return {
      ok: true,
      user,
      warnings: [...this.warnings],
      outbox: this.outbox.snapshot(),
      analyticsEvents: [...this.analytics.events],
    };
  }

  async dispatchOutbox(): Promise<OutboxSnapshot> {
    return this.outbox.dispatchAll(this.mailer);
  }

  snapshot(): RuntimeSnapshot {
    return {
      outbox: this.outbox.snapshot(),
      sentMessages: [...this.mailer.sentMessages],
      skippedDedupeKeys: [...this.mailer.skippedDedupeKeys],
      analyticsEvents: [...this.analytics.events],
      users: [...this.db.users],
    };
  }
}

export type RunScenarioResult = {
  scenario: ScenarioConfig;
  registerResult?: RegisterUserResult;
  failure?: RegisterUserFailure;
  dispatchSnapshots: OutboxSnapshot[];
  runtime: RuntimeSnapshot;
  report: string;
};

export async function runRegisterUserScenario(
  name: ScenarioName,
  options: { seed?: number } = {},
): Promise<RunScenarioResult> {
  const scenario = createScenarioConfig(name, options);
  const runtime = new RegisterUserRuntime(scenario.faultInjector);
  const dispatchSnapshots: OutboxSnapshot[] = [];
  let registerResult: RegisterUserResult | undefined;
  let failure: RegisterUserFailure | undefined;

  try {
    registerResult = await runtime.registerUser({
      email: "ada@example.com",
    });
  } catch (error) {
    failure = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      warnings: [...runtime.warnings],
      outbox: runtime.outbox.snapshot(),
      analyticsEvents: [...runtime.analytics.events],
    };
  }

  if (registerResult) {
    for (let attempt = 0; attempt < scenario.dispatchAttempts; attempt += 1) {
      dispatchSnapshots.push(await runtime.dispatchOutbox());
    }
  }

  return {
    scenario,
    registerResult,
    failure,
    dispatchSnapshots,
    runtime: runtime.snapshot(),
    report: RegisterUserJunction.report(),
  };
}
