import {
  applyDelay,
  type FaultInjector,
} from "./fault-injector.js";

export type RegisterUserInput = {
  email: string;
};

export type MockUser = {
  id: string;
  email: string;
};

export type SentMessage = {
  email: string;
  dedupeKey: string;
};

export type MailSendResult =
  | { status: "sent"; message: SentMessage }
  | { status: "skipped"; dedupeKey: string };

export type AnalyticsEvent = {
  name: "user_registered";
  userId: string;
};

export class MockDB {
  readonly users: MockUser[] = [];

  constructor(private readonly faultInjector: FaultInjector) {}

  async createUser(input: RegisterUserInput): Promise<MockUser> {
    await applyDelay(this.faultInjector, "create-user");
    if (this.faultInjector.shouldFail("create-user")) {
      throw new Error("create-user failed");
    }

    const user = {
      id: `user-${this.users.length + 1}`,
      email: input.email,
    };
    this.users.push(user);
    return user;
  }
}

export class MockMailer {
  readonly sentMessages: SentMessage[] = [];
  readonly skippedDedupeKeys: string[] = [];
  private readonly deliveredDedupeKeys = new Set<string>();

  constructor(private readonly faultInjector: FaultInjector) {}

  async sendConfirmation(
    email: string,
    dedupeKey: string,
  ): Promise<MailSendResult> {
    await applyDelay(this.faultInjector, "send-confirmation-mail");
    if (this.faultInjector.shouldFail("send-confirmation-mail")) {
      throw new Error("send-confirmation-mail failed");
    }

    if (this.deliveredDedupeKeys.has(dedupeKey)) {
      this.skippedDedupeKeys.push(dedupeKey);
      return { status: "skipped", dedupeKey };
    }

    this.deliveredDedupeKeys.add(dedupeKey);
    const message = { email, dedupeKey };
    this.sentMessages.push(message);
    return { status: "sent", message };
  }
}

export class MockAnalytics {
  readonly events: AnalyticsEvent[] = [];

  constructor(private readonly faultInjector: FaultInjector) {}

  async trackSignup(userId: string): Promise<void> {
    await applyDelay(this.faultInjector, "track-signup");
    if (this.faultInjector.shouldFail("track-signup")) {
      throw new Error("track-signup failed");
    }

    this.events.push({
      name: "user_registered",
      userId,
    });
  }
}
