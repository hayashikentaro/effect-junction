type PlaceOrderRuntimeSummaryInput = {
  implemented: boolean;
  ok: boolean;
  orderState: string;
  orderCategory: string;
  paymentState: string;
  inventoryState: string;
  warnings: string[];
  diagnostics: string[];
  snapshot: {
    order?: {
      id: string;
      paymentReference?: string;
    };
    payment?: {
      id: string;
      status: string;
    };
    inventory?: {
      id: string;
      status: string;
    };
    outbox: {
      receipt: readonly unknown[];
      shipment: readonly unknown[];
    };
    analyticsEvents: readonly unknown[];
  };
};

export function formatOptional(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "none";
  }

  return String(value);
}

export function formatArray(values: readonly unknown[]): string {
  return values.length === 0 ? "[]" : `[${values.join(", ")}]`;
}

export function formatList(
  items: readonly string[],
  indent = "  ",
): string[] {
  if (items.length === 0) {
    return [`${indent}- none`];
  }

  return items.map((item) => `${indent}- ${item}`);
}

export function formatWarnings(warnings: readonly string[]): string[] {
  return ["Warnings:", ...formatList(warnings)];
}

export function formatDiagnostics(diagnostics: readonly string[]): string[] {
  return ["Diagnostics:", ...formatList(diagnostics)];
}

export function formatPlaceOrderRuntimeSummary(
  result: PlaceOrderRuntimeSummaryInput,
): string[] {
  return [
    "Runtime Result:",
    `  implemented: ${result.implemented}`,
    `  ok: ${result.ok}`,
    `  orderState: ${result.orderState}`,
    `  orderCategory: ${result.orderCategory}`,
    `  paymentState: ${result.paymentState}`,
    `  inventoryState: ${result.inventoryState}`,
    "",
    "Snapshot:",
    "  order:",
    `    id: ${formatOptional(result.snapshot.order?.id)}`,
    `    paymentReference: ${formatOptional(result.snapshot.order?.paymentReference)}`,
    "  payment:",
    `    id: ${formatOptional(result.snapshot.payment?.id)}`,
    `    status: ${formatOptional(result.snapshot.payment?.status)}`,
    "  inventory:",
    `    id: ${formatOptional(result.snapshot.inventory?.id)}`,
    `    status: ${formatOptional(result.snapshot.inventory?.status)}`,
    "  outbox:",
    `    receipt: ${formatArray(result.snapshot.outbox.receipt)}`,
    `    shipment: ${formatArray(result.snapshot.outbox.shipment)}`,
    `  analyticsEvents: ${result.snapshot.analyticsEvents.length}`,
    "",
    ...formatWarnings(result.warnings),
    "",
    ...formatDiagnostics(result.diagnostics),
  ];
}
