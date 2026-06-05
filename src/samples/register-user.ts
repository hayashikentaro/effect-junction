import { junction, worldEffect } from "../core/index.js";

export const createUser = worldEffect({
  name: "create-user",
  role: "critical",
  description: "Create the internal user record.",
  attributes: {
    ownership: "internal",
    visibility: "machine",
    transactionality: "transactional",
    reversibility: "reversible",
    idempotency: "natural",
    failureMode: "critical",
    timing: "immediate",
  },
});

export const sendConfirmationMail = worldEffect({
  name: "send-confirmation-mail",
  role: "outbox",
  description: "Send a user-visible confirmation email through durable outbox work.",
  attributes: {
    ownership: "human",
    visibility: "user",
    transactionality: "nonTransactional",
    reversibility: "irreversible",
    idempotency: "dedupeRequired",
    failureMode: "pending",
    timing: "deferrable",
  },
});

export const trackSignup = worldEffect({
  name: "track-signup",
  role: "bestEffort",
  description: "Track signup analytics without blocking registration.",
  attributes: {
    ownership: "external",
    visibility: "machine",
    transactionality: "eventual",
    reversibility: "irreversible",
    idempotency: "duplicateTolerant",
    failureMode: "bestEffort",
    timing: "deferrable",
  },
});

export const RegisterUserJunction = junction("register-user")
  .critical(createUser)
  .outbox(sendConfirmationMail)
  .bestEffort(trackSignup)
  .build();
