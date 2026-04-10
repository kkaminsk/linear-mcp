## Why

Issue search is supposed to be query-backed after fix-30, but the repository still carries a raw filter-only search helper and the observed MCP failure still looks like the pre-fix path that tried to behave like filtered listing instead of free-text search. The search contract needs to make the query-backed path authoritative from source to released artifact so stale search code cannot resurface.

## What Changes

- Remove or isolate stale filter-only issue search helpers that can masquerade as the `linear_search_issues` implementation.
- Keep the SDK-backed query search path as the only supported backend for the issue search tool.
- Add runtime or packaged-server regression coverage that calls `linear_search_issues` through the MCP boundary and verifies `query` stays separate from filters.
- Clarify documentation for search-versus-list semantics and supported filter combinations.

## Capabilities

### New Capabilities
- `issue-search-path-parity`: Ensure issue search stays query-backed and consistent from source code to the released tool surface.

### Modified Capabilities
- None.

## Impact

- `src\graphql\client.ts`
- `src\graphql\queries.ts`
- `src\features\issues\handlers\issue.handler.ts`
- `src\core\types\tool.types.ts`
- `src\__tests__\graphql-client.test.ts`
- `src\__tests__\issue-handler.test.ts`
- `src\__tests__\runtime-server.test.ts`
- README and release validation for issue search behavior
