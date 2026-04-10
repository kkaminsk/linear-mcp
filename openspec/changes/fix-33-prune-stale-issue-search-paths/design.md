## Context

Fix-30 established the intended behavior for `linear_search_issues`: use a query-aware search backend instead of treating a free-text query like a filter-only listing request. The current source reflects that at the handler layer, but the repository still carries `searchIssuesRaw` and a filter-based search query helper, and the tool failure seen at runtime still resembles the old invalid path. That means the codebase still has enough stale search surface for released behavior to drift away from the intended contract.

This change needs a design document because it spans helper cleanup, handler guarantees, tool schema expectations, and runtime verification. The problem is not just the search code itself; it is the persistence of alternative search paths that can survive in tests or released artifacts.

## Goals / Non-Goals

**Goals:**
- Make the query-backed search helper the only supported backend for `linear_search_issues`.
- Remove or isolate stale raw search helpers that can reintroduce filter-only behavior.
- Add runtime or packaged-server tests that verify the released tool surface preserves query-backed search semantics.

**Non-Goals:**
- Change `linear_list_issues` semantics or merge list and search into one tool.
- Expand the search schema beyond filter combinations that the Linear SDK path can actually support.
- Redesign project search or broader authentication behavior.

## Decisions

### 1. Keep `linear_search_issues` on the SDK-backed query path only

The MCP tool should have exactly one authoritative backend: the SDK search call that accepts the client query directly. The stale raw filter-based helper should be removed or explicitly isolated from the issue-search tool path. Keeping both helpers available for convenience was considered, but rejected because it preserves the same ambiguity that produced the observed regression.

### 2. Verify issue search through the MCP server boundary

Existing unit tests prove that the handler and client helpers can call the right methods, but they do not guarantee the released tool surface does the same. This change should add a server-boundary test that invokes `linear_search_issues` through the MCP runtime and verifies the query and filters stay separated. Relying only on helper-level tests was considered, but rejected because that gap already allowed runtime behavior to drift.

### 3. Document search and list as different contracts

The documentation and tool expectations should state clearly that `linear_search_issues` is a free-text search entry point with optional supported filters, while `linear_list_issues` remains the filter-first listing path. Allowing search to silently fall back to listing behavior was considered, but rejected because it makes failures harder to diagnose and breaks the meaning of the tool names.

## Risks / Trade-offs

- **Removing stale helpers could affect hidden internal callers** -> Search for all references before deletion and migrate any remaining uses deliberately.
- **Runtime tests can be slower than unit tests** -> Keep the server-boundary coverage narrowly focused on the issue search contract.
- **Supported filter scope may stay narrower than list semantics** -> Document the supported combinations explicitly instead of guessing or silently widening behavior.

## Migration Plan

1. Remove or isolate raw filter-only issue search helpers from the `linear_search_issues` path.
2. Keep the handler and tool schema aligned with the query-backed search semantics.
3. Add unit and runtime regression coverage for query-only and query-plus-filter searches.
4. Update documentation and release validation to describe and protect the repaired behavior.

## Open Questions

- Is `searchIssuesRaw` used anywhere outside tests or experiments that still needs a supported replacement?
- Should the runtime parity test live in the existing transport suite or in a dedicated release-smoke harness?
