## Context

The runtime already classifies upstream failures as retryable based on status codes and GraphQL error metadata, but it does not use that signal to recover safe operations. The code also lacks explicit timeout budgets at the Linear-facing boundary, especially in OAuth token exchange and the shared GraphQL client. As a result, transient failures fail too eagerly while hung requests can take too long to surface.

This change touches auth, raw GraphQL execution, SDK-backed helpers, and structured MCP error reporting. A design is useful because timeout and retry policy must be centralized enough to stay consistent, while still protecting non-idempotent mutations from accidental duplicate execution.

## Goals / Non-Goals

**Goals:**
- Enforce explicit timeout budgets for external auth and Linear-facing requests.
- Add bounded retry and backoff for approved safe operations when failures are classified as retryable.
- Keep unsafe writes off automatic retry paths unless they opt in explicitly.
- Preserve structured MCP errors so timeout and retry exhaustion remain diagnosable.

**Non-Goals:**
- Introduce transactional guarantees that the upstream Linear API does not provide.
- Add blanket automatic retries to all mutations.
- Build a full circuit breaker or distributed resiliency framework in this change.

## Decisions

### 1. Centralize timeout and retry policy in a shared request-policy layer

Timeout and retry behavior should live in one shared request-policy helper that can be used by OAuth token exchange, raw GraphQL execution, and approved SDK-backed operations. That keeps the semantics aligned and prevents drift across multiple ad hoc wrappers.

**Alternatives considered**
- Add timeouts and retries independently in `auth.ts` and `client.ts`: rejected because policy drift is likely over time.
- Rely on upstream SDK defaults: rejected because the current boundary already needs its own structured error behavior.

### 2. Retry only approved safe operations

The retry policy should be opt-in for operations that are known to be safe to repeat, such as reads and other idempotent calls. Non-idempotent writes should remain single-attempt by default unless their workflow explicitly proves retry safety.

**Alternatives considered**
- Retry every operation with a retryable error: rejected because duplicate writes can corrupt caller expectations.
- Never retry anything automatically: rejected because it leaves easy resilience wins on the table for reads.

### 3. Treat timeout as part of the structured MCP failure contract

When a request exceeds its time budget or exhausts bounded retries, the MCP boundary should still return a structured error that preserves the operation name and retryability context. That keeps timeout policy observable instead of turning it into a hidden implementation detail.

**Alternatives considered**
- Let timeout failures bubble up as generic internal errors: rejected because it weakens troubleshooting at the MCP boundary.

## Risks / Trade-offs

- **[Retries increase total latency before failure]** -> Keep attempt counts low and combine them with explicit per-attempt timeout budgets.
- **[Timeout budgets can be tuned too aggressively]** -> Start with conservative defaults and validate them with focused tests around auth and GraphQL paths.
- **[SDK calls may not support native cancellation uniformly]** -> Apply timeout policy at the wrapper layer and keep failure shaping consistent even if cancellation falls back to bounded waiting.

## Migration Plan

1. Introduce a shared request-policy helper for timeout and bounded retry behavior.
2. Apply timeout enforcement to OAuth token exchange and the shared Linear client boundary.
3. Opt approved safe reads into retry policy while keeping mutations single-attempt unless explicitly safe.
4. Add focused tests for timeout enforcement, retry exhaustion, and non-retry behavior on unsafe writes.

## Open Questions

- Should future operator tuning expose retry and timeout settings, or should the first version stay on repository-controlled constants only?
