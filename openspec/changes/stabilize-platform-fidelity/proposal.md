## Why

The current server has correctness and contract drift in the auth, search, schema, and GraphQL layers. Those gaps break core flows today and make later feature expansion risky because handlers and clients do not consistently reflect Linear's current API behavior.

## What Changes

- Rework auth and GraphQL client lifecycle handling so OAuth callback and token refresh update the active client used by all handlers.
- Upgrade the Linear SDK and schema baseline, then align the server's query assumptions and actor semantics to that baseline.
- Split list semantics from true search semantics and route search tools to Linear's current search endpoints.
- Replace non-standard tool schema patterns and mismatched field names with strict JSON Schema and consistent argument contracts.
- Standardize tool responses on structured JSON payloads while preserving human-readable summaries as companion output.
- Preserve GraphQL fidelity by surfacing `errors`, extensions, rate-limit metadata, complexity metadata, and retryability signals instead of collapsing them into generic text errors.
- Refresh README, architecture notes, and tests so the documented behavior matches the implemented contracts.

## Capabilities

### New Capabilities
- `auth-session-lifecycle`: Keep OAuth state, token refresh, and the active GraphQL client synchronized across all handlers.
- `search-and-list-semantics`: Distinguish filtered listing from ranked search for issue and project tools.
- `tool-contract-fidelity`: Enforce strict schemas, aligned field names, and structured tool outputs for MCP clients.
- `graphql-response-fidelity`: Preserve GraphQL response data, errors, and operational metadata for callers.

### Modified Capabilities
- None.

## Impact

- `src\index.ts`
- `src\auth.ts`
- `src\core\handlers\base.handler.ts`
- `src\core\handlers\handler.factory.ts`
- `src\core\types\tool.types.ts`
- `src\graphql\client.ts`
- `src\graphql\queries.ts`
- feature handlers that currently return prose-only responses
- `README.md`, `architecture.md`, and OAuth/search tests
- `@linear/sdk` version and schema assumptions used by the repository
