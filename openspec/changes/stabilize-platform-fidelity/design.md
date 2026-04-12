## Context

The review found several P0 fidelity problems in the current implementation. `src\index.ts` creates the handler factory once with a possibly stale `LinearGraphQLClient`, `BaseHandler.verifyAuth()` does not await token refresh, search tools call filtered list queries instead of current search endpoints, tool schemas use non-standard JSON Schema patterns, and `src\graphql\client.ts` discards GraphQL errors and operational metadata.

This change is the foundation for the rest of the roadmap. If auth state, tool contracts, and response fidelity remain unstable, later feature work will inherit the same drift and operational blind spots.

## Goals / Non-Goals

**Goals:**
- Make authenticated handler calls use the current GraphQL client after OAuth callback and token refresh.
- Align issue and project search behavior with Linear's current search endpoints while keeping filtered list behavior available.
- Replace non-standard schema declarations and mismatched parameter names with portable, strict tool contracts.
- Return machine-readable tool outputs and preserve GraphQL error and metadata fidelity.
- Bring repository documentation and tests into alignment with the implemented platform behavior.

**Non-Goals:**
- Add new issue, project, cycle, attachment, or webhook breadth beyond the foundation required for later changes.
- Introduce long-term credential storage beyond the current environment-variable and in-memory OAuth approach.
- Redesign the server transport or implement advanced event-driven capabilities.

## Decisions

### 1. Resolve the GraphQL client lazily instead of injecting a fixed instance once

The current constructor flow creates handlers with a client snapshot that becomes stale after OAuth callback or token refresh. The server should provide handlers with a late-bound client resolver or shared client provider so every request can fetch the current authenticated client.

This is preferred over rebuilding the entire handler factory after auth changes because it keeps auth propagation centralized and avoids re-instantiating unrelated handler state.

### 2. Make auth verification asynchronous and gate downstream calls on refresh completion

`verifyAuth()` must become asynchronous so it can await token refresh before any GraphQL request runs. A fire-and-forget refresh is not safe because the next request can race ahead with an expired client and drop refresh errors.

This decision requires handler methods to await auth verification, but it removes the race the review identified and creates a single place to apply refresh failure behavior.

### 3. Separate list and search tools explicitly

The current `linear_search_issues` and `linear_search_projects` behave like filtered listings. The server should expose distinct list and search tools:

- list tools use filter and pagination semantics
- search tools use current Linear search endpoints and return ranked results

Keeping the behaviors explicit is better than overloading one tool name because it makes client expectations, docs, and tests match the product surface.

### 4. Standardize tool contracts around strict schemas and structured results

`tool.types.ts` should only use standard JSON Schema keywords, and all layers must agree on field names such as `parentId`. Write and read tools should produce stable JSON payloads with identifiers, URLs, and pagination metadata so MCP clients can automate reliably.

Human-readable text can remain as a companion summary, but not as the only result shape.

### 5. Preserve GraphQL errors and operational metadata until the MCP boundary

The GraphQL layer should return response envelopes that can carry `data`, `errors`, `extensions`, rate-limit headers, complexity headers, and retryability hints. Handler-level error mapping should happen after that fidelity is preserved so callers can distinguish validation failures, auth failures, throttling, and retryable conditions.

### 6. Update docs and tests from implementation behavior instead of outdated assumptions

The repository currently mixes stale OAuth, actor, and architecture descriptions. This change should refresh docs and tests from the implemented behavior so future feature work starts from a reliable baseline.

## Risks / Trade-offs

- **Cross-cutting refactor risk:** Async auth verification and client resolution touch many handlers. Mitigation: make the provider pattern small and shared before updating feature handlers.
- **Client-facing contract changes:** Structured outputs and new list tools may change how existing clients consume results. Mitigation: document response shapes clearly and stage search/list changes with explicit tests.
- **Upstream schema drift exposure:** Upgrading the SDK may surface more mismatches than the review already found. Mitigation: refresh queries and tool types directly from the current schema baseline before adding new feature breadth.
- **More verbose responses:** Preserving GraphQL metadata can enlarge payloads. Mitigation: keep metadata structured and scoped to fields clients actually need.

## Migration Plan

1. Refresh the SDK and schema baseline.
2. Introduce the late-bound client provider and async auth verification flow.
3. Update issue and project tools to split list from search behavior.
4. Normalize tool schemas and response envelopes.
5. Refresh docs and tests to match the new contracts.

## Open Questions

- Should every tool return both structured JSON and a companion text summary, or should some read tools return JSON only?
- How should rate-limit and complexity metadata be surfaced in MCP responses so they remain useful without becoming noisy?
- Should legacy search behavior remain available temporarily as an alias, or should the semantic correction happen in place?
