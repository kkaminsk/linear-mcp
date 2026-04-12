## Context

The failure in issue #30 is a contract bug: the MCP tool accepts a free-text query but the backend path behaves like a filtered listing and triggers a GraphQL validation error. Search needs its own verified execution path and regression tests so the contract stops drifting.

## Goals / Non-Goals

**Goals:**
- Make `linear_search_issues` succeed when a client provides `query`.
- Keep text search semantics distinct from filtered list semantics.
- Return structured results with pagination metadata that remain stable for callers.

**Non-Goals:**
- Expand unrelated issue fields or add new issue-management domains.
- Hide search failures behind fallback list behavior.
- Rework project search or auth behavior in this change.

## Decisions

### 1. Use a true query-aware search backend

The handler should call a search-specific SDK or GraphQL path that accepts the free-text query explicitly. Query-backed search should not be emulated by inventing unsupported fields on `IssueFilter`.

### 2. Keep search and list as separate contracts

`linear_list_issues` should remain the filter-and-pagination entry point, while `linear_search_issues` should remain the free-text search entry point. Keeping them separate preserves predictable semantics and aligns with the user-visible tool names.

### 3. Regression-test the exact failure mode

The implementation should add tests that exercise a non-empty `query`, optional filters, and pagination so the invalid `IssueFilter.search` pattern cannot silently return.

## Risks / Trade-offs

- **Search API variance:** Linear search semantics may differ from list filters. -> **Mitigation:** document the difference and test supported combinations.
- **Result-shape drift:** Search endpoints can return data shaped differently from list endpoints. -> **Mitigation:** map search results through the existing structured issue summary projection.
- **Regression breadth:** Search bugs can hide behind happy-path mocks. -> **Mitigation:** add targeted tests for the reported failure and mixed query/filter cases.

## Migration Plan

1. Replace the invalid query execution path with a search-aware call.
2. Reuse the structured issue mapping for search results.
3. Add regression tests covering query input and mixed filter usage.
4. Update README examples to describe the repaired semantics.

## Open Questions

- Should empty-string queries be rejected at schema validation time or handler validation time?
- Which optional filters should remain supported on top of free-text search in the first pass?
