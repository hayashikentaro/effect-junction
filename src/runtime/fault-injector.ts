export type FaultInjector = {
  shouldFail(effectName: string): boolean;
  delayMs(effectName: string): number;
};

export type FaultConfig = {
  failures?: readonly string[];
  delays?: Readonly<Record<string, number>>;
};

export function createFaultInjector(config: FaultConfig = {}): FaultInjector {
  const failures = new Set(config.failures ?? []);
  const delays = config.delays ?? {};

  return {
    shouldFail(effectName) {
      return failures.has(effectName);
    },
    delayMs(effectName) {
      return delays[effectName] ?? 0;
    },
  };
}

export async function applyDelay(
  faultInjector: FaultInjector,
  effectName: string,
): Promise<void> {
  const delay = faultInjector.delayMs(effectName);
  if (delay <= 0) {
    return;
  }

  await new Promise((resolve) => setTimeout(resolve, delay));
}
