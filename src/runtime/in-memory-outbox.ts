import type { MockMailer } from "./mock-services.js";

export type OutboxStatus = "pending" | "sent" | "failed";

export type DispatchAttemptStatus =
  | "sent"
  | "failed"
  | "skippedDuplicate"
  | "skippedTerminal";

export type DispatchAttempt = {
  itemId: string;
  effectName: "send-confirmation-mail";
  attempt: number;
  status: DispatchAttemptStatus;
  dedupeKey: string;
  error?: string;
};

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
  attempts: DispatchAttempt[];
};

export class InMemoryOutbox {
  private readonly items: OutboxItem[] = [];
  private readonly attempts: DispatchAttempt[] = [];

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

      if (item.status === "sent") {
        this.recordAttempt(item, "skippedTerminal");
        continue;
      }

      try {
        const result = await mailer.sendConfirmation(item.email, item.dedupeKey);
        if (result.status === "skipped") {
          this.recordAttempt(item, "skippedDuplicate");
        } else {
          item.status = "sent";
          delete item.lastError;
          this.recordAttempt(item, "sent");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        item.status = "failed";
        item.lastError = message;
        this.recordAttempt(item, "failed", message);
      }
    }

    return this.snapshot();
  }

  snapshot(): OutboxSnapshot {
    return {
      items: this.items.map((item) => ({ ...item })),
      attempts: this.attempts.map((attempt) => ({ ...attempt })),
    };
  }

  private recordAttempt(
    item: OutboxItem,
    status: DispatchAttemptStatus,
    error?: string,
  ): void {
    this.attempts.push({
      itemId: item.id,
      effectName: item.effectName,
      attempt: item.attempts,
      status,
      dedupeKey: item.dedupeKey,
      ...(error === undefined ? {} : { error }),
    });
  }
}
