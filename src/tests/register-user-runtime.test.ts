import test from "node:test";
import assert from "node:assert/strict";

import { runRegisterUserScenario } from "../runtime/register-user-runtime.js";

test("happy-path creates user, dispatches mail, and records analytics", async () => {
  const result = await runRegisterUserScenario("happy-path");

  assert.equal(result.registerResult?.ok, true);
  assert.equal(result.runtime.users.length, 1);
  assert.equal(result.runtime.outbox.items.length, 1);
  assert.equal(result.runtime.outbox.items[0]?.status, "sent");
  assert.equal(result.runtime.sentMessages.length, 1);
  assert.equal(result.runtime.analyticsEvents.length, 1);
});

test("db-fails fails registration without outbox or analytics", async () => {
  const result = await runRegisterUserScenario("db-fails");

  assert.equal(result.failure?.ok, false);
  assert.match(result.failure?.error ?? "", /create-user failed/);
  assert.equal(result.runtime.users.length, 0);
  assert.equal(result.runtime.outbox.items.length, 0);
  assert.equal(result.runtime.analyticsEvents.length, 0);
});

test("mail-fails leaves outbox failed after successful registration", async () => {
  const result = await runRegisterUserScenario("mail-fails");

  assert.equal(result.registerResult?.ok, true);
  assert.equal(result.runtime.users.length, 1);
  assert.equal(result.runtime.outbox.items.length, 1);
  assert.equal(result.runtime.outbox.items[0]?.status, "failed");
  assert.match(result.runtime.outbox.items[0]?.lastError ?? "", /send-confirmation-mail failed/);
  assert.equal(result.runtime.analyticsEvents.length, 1);
});

test("analytics-fails records warning without failing registration", async () => {
  const result = await runRegisterUserScenario("analytics-fails");

  assert.equal(result.registerResult?.ok, true);
  assert.equal(result.runtime.users.length, 1);
  assert.equal(result.runtime.analyticsEvents.length, 0);
  assert.equal(result.runtime.sentMessages.length, 1);
  assert.equal(result.registerResult?.warnings.length, 1);
  assert.match(result.registerResult?.warnings[0] ?? "", /track-signup failed/);
});

test("duplicate-dispatch sends once and skips the second dispatch by dedupe key", async () => {
  const result = await runRegisterUserScenario("duplicate-dispatch");

  assert.equal(result.dispatchSnapshots.length, 2);
  assert.equal(result.runtime.sentMessages.length, 1);
  assert.equal(result.runtime.skippedDedupeKeys.length, 1);
  assert.equal(result.runtime.outbox.items[0]?.status, "skipped");
  assert.equal(result.runtime.outbox.items[0]?.attempts, 2);
});

test("chaos scenario is reproducible with the same seed", async () => {
  const first = await runRegisterUserScenario("chaos", { seed: 42 });
  const second = await runRegisterUserScenario("chaos", { seed: 42 });

  assert.deepEqual(
    {
      failure: first.failure?.error,
      outbox: first.runtime.outbox.items,
      sentMessages: first.runtime.sentMessages,
      analyticsEvents: first.runtime.analyticsEvents,
      warnings: first.registerResult?.warnings ?? first.failure?.warnings,
    },
    {
      failure: second.failure?.error,
      outbox: second.runtime.outbox.items,
      sentMessages: second.runtime.sentMessages,
      analyticsEvents: second.runtime.analyticsEvents,
      warnings: second.registerResult?.warnings ?? second.failure?.warnings,
    },
  );
});
