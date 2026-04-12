export const DEFAULT_LINEAR_REQUEST_TIMEOUT_MS = 10_000;
export const DEFAULT_OAUTH_REQUEST_TIMEOUT_MS = 10_000;
export const DEFAULT_SAFE_READ_MAX_ATTEMPTS = 3;
export const DEFAULT_SAFE_READ_RETRY_DELAY_MS = 250;

export interface RequestAttemptContext {
  attempt: number;
  signal: AbortSignal;
}

export interface RequestPolicyOptions {
  timeoutMs: number;
  maxAttempts?: number;
  retryDelayMs?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export class RequestTimeoutError extends Error {
  constructor(
    public readonly operation: string,
    public readonly timeoutMs: number
  ) {
    super(`${operation} timed out after ${timeoutMs}ms`);
    this.name = 'RequestTimeoutError';
  }
}

export async function executeWithRequestPolicy<T>(
  operation: string,
  execute: (context: RequestAttemptContext) => Promise<T>,
  options: RequestPolicyOptions
): Promise<T> {
  const timeoutMs = Math.max(options.timeoutMs, 1);
  const maxAttempts = Math.max(options.maxAttempts ?? 1, 1);
  const retryDelayMs = Math.max(options.retryDelayMs ?? 0, 0);
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await executeWithTimeout(operation, timeoutMs, attempt, execute);
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < maxAttempts && (options.shouldRetry?.(error, attempt) ?? false);

      if (!shouldRetry) {
        throw error;
      }

      const backoffMs = retryDelayMs * attempt;
      if (backoffMs > 0) {
        await delay(backoffMs);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`${operation} failed after ${maxAttempts} attempts`);
}

async function executeWithTimeout<T>(
  operation: string,
  timeoutMs: number,
  attempt: number,
  execute: (context: RequestAttemptContext) => Promise<T>
): Promise<T> {
  const controller = new AbortController();
  const timeoutError = new RequestTimeoutError(operation, timeoutMs);

  return await new Promise<T>((resolve, reject) => {
    let settled = false;

    const finish = (callback: () => void): void => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeoutId);
      controller.signal.removeEventListener('abort', onAbort);
      callback();
    };

    const onAbort = (): void => {
      finish(() => reject(timeoutError));
    };

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    controller.signal.addEventListener('abort', onAbort, { once: true });

    Promise.resolve()
      .then(() => execute({ attempt, signal: controller.signal }))
      .then(
      value => finish(() => resolve(value)),
      error => finish(() => reject(error))
      );
  });
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
