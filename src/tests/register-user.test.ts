import test from "node:test";
import assert from "node:assert/strict";

import { derivePrescriptions } from "../core/index.js";
import {
  createUser,
  RegisterUserJunction,
  sendConfirmationMail,
  trackSignup,
} from "../samples/register-user.js";

function codesFor(effect: Parameters<typeof derivePrescriptions>[0]): string[] {
  return derivePrescriptions(effect).map((prescription) => prescription.code);
}

test("send-confirmation-mail derives mail and pending prescriptions", () => {
  assert.deepEqual(codesFor(sendConfirmationMail), [
    "requires-dedupe-key",
    "prefer-outbox",
    "avoid-direct-retry",
    "do-not-run-inside-db-transaction",
    "record-pending-state",
  ]);
});

test("track-signup derives best-effort prescription", () => {
  assert.deepEqual(codesFor(trackSignup), ["must-not-block-critical-path"]);
});

test("create-user derives critical transactional prescriptions", () => {
  assert.deepEqual(codesFor(createUser), [
    "run-in-transaction",
    "enforce-invariants",
  ]);
});

test("RegisterUserJunction contains exactly three effects", () => {
  assert.equal(RegisterUserJunction.effects.length, 3);
});

test("RegisterUserJunction report includes effects and prescriptions", () => {
  const report = RegisterUserJunction.report();

  assert.match(report, /register-user/);
  assert.match(report, /create-user/);
  assert.match(report, /send-confirmation-mail/);
  assert.match(report, /track-signup/);
  assert.match(report, /requires-dedupe-key/);
  assert.match(report, /must-not-block-critical-path/);
});
