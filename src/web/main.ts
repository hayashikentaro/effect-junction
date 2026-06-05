import { runRegisterUserScenario } from "../runtime/register-user-runtime.js";
import {
  type ScenarioName,
} from "../runtime/scenarios.js";
import { runPlaceOrderScenario } from "../runtime/place-order-runtime.js";
import {
  categorizePlaceOrderState,
  placeOrderScenarioExpectations,
  placeOrderScenarioNames,
  type PlaceOrderScenarioName,
} from "../runtime/place-order-states.js";
import { RegisterUserJunction } from "../samples/register-user.js";
import { PlaceOrderJunction } from "../samples/place-order.js";

type JunctionName = "register-user" | "place-order";

const registerUserScenarioNames = [
  "happy-path",
  "db-fails",
  "mail-fails",
  "analytics-fails",
  "duplicate-dispatch",
  "chaos",
] as const satisfies readonly ScenarioName[];

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root element");
}

const appRoot = app;

const state: {
  junction: JunctionName;
  registerScenario: ScenarioName;
  placeOrderScenario: PlaceOrderScenarioName;
  seed: number;
} = {
  junction: "register-user",
  registerScenario: "happy-path",
  placeOrderScenario: "happy-path",
  seed: 42,
};

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: {
    id?: string;
    className?: string;
    text?: string;
    children?: Node[];
  } = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.id) {
    node.id = options.id;
  }
  if (options.className) {
    node.className = options.className;
  }
  if (options.text !== undefined) {
    node.textContent = options.text;
  }
  for (const child of options.children ?? []) {
    node.append(child);
  }
  return node;
}

function section(title: string, children: Node[], className = ""): HTMLElement {
  return el("section", {
    className: `section${className ? ` ${className}` : ""}`,
    children: [el("h2", { text: title }), ...children],
  });
}

function pre(text: string): HTMLElement {
  return el("pre", { text });
}

function list(items: readonly string[]): HTMLElement {
  if (items.length === 0) {
    return el("p", { className: "empty", text: "none" });
  }

  return el("ul", {
    className: "list",
    children: items.map((item) => el("li", { className: "mono", text: item })),
  });
}

function kv(entries: readonly [string, string | Node][]): HTMLElement {
  const dl = el("dl", { className: "kv" });
  for (const [key, value] of entries) {
    dl.append(el("dt", { text: key }));
    dl.append(
      el("dd", {
        children:
          typeof value === "string" ? [document.createTextNode(value)] : [value],
      }),
    );
  }
  return dl;
}

function status(value: boolean): HTMLElement {
  return el("span", {
    className: `status ${value ? "ok" : "bad"}`,
    text: String(value),
  });
}

function optional(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "none";
  }
  return String(value);
}

function arrayValue(values: readonly unknown[]): string {
  return values.length === 0 ? "[]" : `[${values.join(", ")}]`;
}

function createSelect<T extends string>(
  values: readonly T[],
  selected: T,
  onChange: (value: T) => void,
): HTMLSelectElement {
  const select = el("select");
  for (const value of values) {
    const option = el("option", { text: value });
    option.value = value;
    option.selected = value === selected;
    select.append(option);
  }
  select.addEventListener("change", () => onChange(select.value as T));
  return select;
}

function renderShell(): void {
  appRoot.replaceChildren(
    el("main", {
      className: "shell",
      children: [
        el("header", {
          className: "hero",
          children: [
            el("h1", { text: "Effect Junction Demo" }),
            el("p", {
              text:
                "A deterministic browser demo for side-effect semantics. It uses no real external services and is not a production workflow engine.",
            }),
          ],
        }),
        renderControls(),
        el("div", { id: "output" }),
      ],
    }),
  );
}

function renderControls(): HTMLElement {
  const junctionSelect = createSelect<JunctionName>(
    ["register-user", "place-order"],
    state.junction,
    (value) => {
      state.junction = value;
      renderShell();
    },
  );

  const scenarioValues =
    state.junction === "register-user"
      ? registerUserScenarioNames
      : placeOrderScenarioNames;
  const scenarioSelect =
    state.junction === "register-user"
      ? createSelect<ScenarioName>(
          scenarioValues as readonly ScenarioName[],
          state.registerScenario,
          (value) => {
            state.registerScenario = value;
            renderShell();
          },
        )
      : createSelect<PlaceOrderScenarioName>(
          scenarioValues as readonly PlaceOrderScenarioName[],
          state.placeOrderScenario,
          (value) => {
            state.placeOrderScenario = value;
            renderShell();
          },
        );

  const seedInput = el("input");
  seedInput.type = "number";
  seedInput.value = String(state.seed);
  seedInput.disabled =
    state.junction !== "register-user" || state.registerScenario !== "chaos";
  seedInput.addEventListener("input", () => {
    state.seed = Number(seedInput.value || "42");
  });

  const runButton = el("button", { text: "Run scenario" });
  runButton.type = "button";
  runButton.addEventListener("click", () => {
    void runSelectedScenario();
  });

  const form = el("form", {
    className: "controls",
    children: [
      field("Junction", junctionSelect),
      field("Scenario", scenarioSelect),
      field("Seed", seedInput),
      runButton,
    ],
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
  });
  return form;
}

function field(label: string, control: HTMLElement): HTMLElement {
  return el("div", {
    className: "field",
    children: [el("label", { text: label }), control],
  });
}

async function runSelectedScenario(): Promise<void> {
  const output = document.querySelector<HTMLDivElement>("#output");
  if (!output) {
    return;
  }

  output.replaceChildren(section("Running", [el("p", { text: "Executing..." })]));

  try {
    if (state.junction === "place-order") {
      output.replaceChildren(...renderPlaceOrder());
      return;
    }

    output.replaceChildren(...(await renderRegisterUser()));
  } catch (error) {
    output.replaceChildren(
      section(
        "Error",
        [
          pre(error instanceof Error ? error.stack ?? error.message : String(error)),
        ],
        "error-panel",
      ),
    );
  }
}

async function renderRegisterUser(): Promise<HTMLElement[]> {
  const result = await runRegisterUserScenario(state.registerScenario, {
    seed: state.registerScenario === "chaos" ? state.seed : undefined,
  });
  const warnings = result.registerResult?.warnings ?? result.failure?.warnings ?? [];

  return [
    section("Report", [pre(RegisterUserJunction.report())]),
    section("Scenario", [
      kv([
        ["name", result.scenario.name],
        ["seed", result.scenario.seed === undefined ? "none" : String(result.scenario.seed)],
      ]),
    ]),
    section("Runtime Result", [
      kv([
        [
          "ok",
          result.registerResult ? status(result.registerResult.ok) : status(false),
        ],
        ["user", result.registerResult ? `${result.registerResult.user.id} <${result.registerResult.user.email}>` : "none"],
        ["error", result.failure?.error ?? "none"],
        ["sentMailCount", String(result.runtime.sentMessages.length)],
        ["analyticsEvents", String(result.runtime.analyticsEvents.length)],
      ]),
    ]),
    section("Outbox Items", [
      list(
        result.runtime.outbox.items.map(
          (item) =>
            `${item.id} ${item.effectName} status=${item.status} attempts=${item.attempts} dedupeKey=${item.dedupeKey}${
              item.lastError ? ` lastError=${item.lastError}` : ""
            }`,
        ),
      ),
    ]),
    section("Dispatch Attempts", [
      list(
        result.runtime.outbox.attempts.map(
          (attempt) =>
            `${attempt.itemId} attempt=${attempt.attempt} status=${attempt.status} dedupeKey=${attempt.dedupeKey}${
              attempt.error ? ` error=${attempt.error}` : ""
            }`,
        ),
      ),
    ]),
    section("Warnings", [list(warnings)], warnings.length > 0 ? "warning-panel" : ""),
    section("Diagnostics", [
      list(
        result.scenario.name === "duplicate-dispatch"
          ? [
              `duplicate dispatch skipped: ${result.runtime.outbox.attempts.some(
                (attempt) => attempt.status.startsWith("skipped"),
              )}`,
            ]
          : [],
      ),
    ]),
  ];
}

function renderPlaceOrder(): HTMLElement[] {
  const expectation = placeOrderScenarioExpectations[state.placeOrderScenario];
  const resultPromise = runPlaceOrderScenario(state.placeOrderScenario);

  const container = el("div");
  resultPromise
    .then((result) => {
      container.replaceChildren(
        ...[
          section("Report", [pre(PlaceOrderJunction.report())]),
          section("Scenario Expectation", [
            kv([
              ["finalOrderState", expectation.finalOrderState],
              ["category", categorizePlaceOrderState(expectation.finalOrderState)],
              ["expectedPaymentState", expectation.expectedPaymentState ?? "none"],
              ["expectedInventoryState", expectation.expectedInventoryState ?? "none"],
            ]),
            el("h3", { text: "notes" }),
            list(expectation.notes),
          ]),
          section("Runtime Result", [
            kv([
              ["implemented", status(result.implemented)],
              ["ok", status(result.ok)],
              ["orderState", result.orderState],
              ["orderCategory", result.orderCategory],
              ["paymentState", result.paymentState],
              ["inventoryState", result.inventoryState],
            ]),
          ]),
          section("Snapshot", [
            kv([
              ["orderId", optional(result.snapshot.order?.id)],
              [
                "paymentReference",
                optional(result.snapshot.order?.paymentReference),
              ],
              ["paymentId", optional(result.snapshot.payment?.id)],
              ["paymentStatus", optional(result.snapshot.payment?.status)],
              ["inventoryId", optional(result.snapshot.inventory?.id)],
              ["inventoryStatus", optional(result.snapshot.inventory?.status)],
              ["outbox.receipt", arrayValue(result.snapshot.outbox.receipt)],
              ["outbox.shipment", arrayValue(result.snapshot.outbox.shipment)],
              ["analyticsEvents", String(result.snapshot.analyticsEvents.length)],
            ]),
          ]),
          section("Warnings", [list(result.warnings)], result.warnings.length > 0 ? "warning-panel" : ""),
          section("Diagnostics", [list(result.diagnostics)]),
        ],
      );
    })
    .catch((error) => {
      container.replaceChildren(
        section(
          "Error",
          [
            pre(
              error instanceof Error
                ? error.stack ?? error.message
                : String(error),
            ),
          ],
          "error-panel",
        ),
      );
    });

  return [container];
}

renderShell();
void runSelectedScenario();
