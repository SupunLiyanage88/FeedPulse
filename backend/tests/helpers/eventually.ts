export type EventuallyOptions = {
  timeoutMs?: number;
  intervalMs?: number;
};

export async function eventually(
  assertion: () => void | Promise<void>,
  options: EventuallyOptions = {}
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 3000;
  const intervalMs = options.intervalMs ?? 50;

  const startedAt = Date.now();
  let lastError: unknown;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('eventually() timed out');
}
