## Why

The server already identifies retryable upstream failures, but it does not act on that signal, and external calls do not advertise explicit timeout budgets. That leaves safe reads vulnerable to transient Linear or network failures and makes hung requests harder to fail fast, diagnose, and recover from predictably.

## What Changes

- Introduce explicit timeout budgets for OAuth token exchange and Linear-facing SDK or raw GraphQL operations.
- Add bounded retry and backoff for approved safe operations when the existing error classifier marks a failure as retryable.
- Keep non-idempotent write paths opt-in for retry behavior so the server does not silently duplicate unsafe mutations.
- Add focused tests and documentation for timeout and retry behavior at the MCP boundary.

## Capabilities

### New Capabilities
- `linear-request-time-budgets`: Linear-facing requests fail within documented timeout budgets instead of hanging indefinitely.
- `retryable-linear-request-recovery`: approved safe Linear operations retry bounded transient failures using the server's retryable error classification.

### Modified Capabilities

## Impact

- Affected code: `src\auth.ts`, `src\graphql\client.ts`, `src\core\handlers\base.handler.ts`, and any shared request-policy helper introduced for timeouts and retries.
- Affected behavior: safe reads become more resilient to transient upstream failures, while long-running or hung requests fail in a controlled, diagnosable way.
- Affected verification: runtime, auth, and GraphQL client tests should cover timeout enforcement, bounded retries, and non-retry behavior for unsafe writes.
