## Why

GitHub issue #30 shows that `linear_search_issues` accepts a `query` argument but fails at runtime with a GraphQL error instead of returning results. The search contract needs to be repaired so the MCP surface matches the behavior it advertises.

## What Changes

- Route `linear_search_issues` through a query-aware Linear search path instead of an invalid filter-only path.
- Keep filtered listing semantics separate from text search semantics so `linear_list_issues` and `linear_search_issues` are not interchangeable.
- Add regression coverage for query-only and query-plus-filter searches and document the expected result shape.

## Capabilities

### New Capabilities
- `query-backed-issue-search`: Support issue search requests that accept `query` and execute a valid search backend path.

### Modified Capabilities
- None.

## Impact

- `src\features\issues\handlers\issue.handler.ts`
- any shared GraphQL or SDK search helpers used by issue search
- MCP tool-schema documentation for `linear_search_issues`
- issue-search tests and README examples
