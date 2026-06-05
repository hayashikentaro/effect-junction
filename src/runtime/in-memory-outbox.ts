import type { MockMailer } from "./mock-services.js";

export type OutboxStatus = "pending" | "sent" | "failed" | "skipped";

export type OutboxItem = {
  id: string;
  effectName: "send-confirmation-mail";
  email: string;
  dedupeKey: string;
  status: OutboxStatus;
  attempts: number;
  lastError?: string;
};

export type OutboxSnapshot = {
  items: OutboxItem[];
};

export class InMemoryOutbox {
  private readonly items: OutboxItem[] = [];

  enqueueConfirmationMail(input: {
    email: string;
    dedupeKey: string;
  }): OutboxItem {
    const item: OutboxItem = {
      id: `outbox-${this.items.length + 1}`,
      effectName: "send-confirmation-mail",
      email: input.email,
      dedupeKey: input.dedupeKey,
      status: "pending",
      attempts: 0,
    };
    this.items.push(item);
    return { ...item };
  }

  async dispatchAll(mailer: MockMailer): Promise<OutboxSnapshot> {
    for (const item of this.items) {
      item.attempts += 1;

      try {
        const result = await mailer.sendConfirmation(item.email, item.dedupeKey);
        item.status = result.status;
        delete item.lastError;
      } catch (error) {
        item.status = "failed";
        item.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    return this.snapshot();
  }

  snapshot(): OutboxSnapshot {
    return {
      items: this.items.map((item) => ({ ...item })),
    };
  }
}
