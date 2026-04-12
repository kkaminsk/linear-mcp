# Linear MCP — Agent Guide

This is the generic agent-facing snapshot for the current MCP server. The fuller repo-specific guidance lives in `CLAUDE.md`.

## Current state

- Default runtime is **stdio**. Set `LINEAR_MCP_TRANSPORT=stream` to expose MCP streamable HTTP at `LINEAR_MCP_PATH` (default `/mcp`). `/sse` is intentionally unsupported.
- Auth supports both `LINEAR_API_KEY` and the tool-driven OAuth flow through `linear_auth` and `linear_auth_callback`. OAuth callback state is single-use.
- `linear_search_issues` is query-backed and keeps free-text `query` separate from optional list-style filters.
- The built and packaged server is validated through `npm run verify:release`.

## Main commands

- `npm run build`
- `npm test`
- `npm run verify:tool-catalog`
- `npm run verify:package-install`
- `npm run verify:release`

## Important code paths

- `src/index.ts` — stdio vs streamable HTTP runtime bootstrap
- `src/core/capabilities.ts` — runtime capability metadata
- `src/core/handlers/handler.factory.ts` — tool-to-handler routing
- `src/core/types/tool.types.ts` — MCP tool schemas
- `src/graphql/client.ts` — shared SDK/GraphQL boundary, including query-backed issue search
- `src/features/issues/handlers/issue.handler.ts` — issue list/search/update behavior

## Working conventions

- Do not edit `build/`.
- ESM imports in TS source must use `.js` extensions.
- Keep `linear_list_issues` filter-based and `linear_search_issues` query-based.
- Keep runtime-gated subscription tools aligned with capability metadata.
- If the tool surface changes, update the schemas, handler routing, `README.md`, and release verification together.
