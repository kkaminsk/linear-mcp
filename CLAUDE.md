# Linear MCP — Claude Code Guide

MCP server exposing Linear's API as tools for MCP-compatible clients such as Cline, Claude Code, and Copilot CLI.

## Current state

- Default runtime is **stdio**. Set `LINEAR_MCP_TRANSPORT=stream` to expose MCP streamable HTTP at `LINEAR_MCP_PATH` (default `/mcp`). `/sse` is intentionally unsupported.
- Auth supports both `LINEAR_API_KEY` and the tool-driven OAuth flow through `linear_auth` and `linear_auth_callback`. OAuth callback state is single-use and must not be reused from stale links.
- `linear_search_issues` is the query-backed search path. Keep the free-text `query` separate from filter fields and route it through `LinearGraphQLClient.searchIssues(query, ...)`.
- The released server surface includes issues, comments, projects, milestones, cycles, teams, users, attachments, webhooks, portfolio entities, agent workflows, and runtime capability/subscription tools.
- Release validation is `npm run verify:release` (build + built tool catalog + fresh packaged-install smoke test).

## Stack

- TypeScript (ESM, `"type": "module"`)
- `@modelcontextprotocol/sdk` for the MCP server and stdio client smoke tests
- `@linear/sdk` plus raw GraphQL (`graphql`, `graphql-tag`) for Linear API access
- Jest + ts-jest for unit and integration tests
- Auth via `LINEAR_API_KEY` or the MCP OAuth helper flow

## Commands

- `npm run build` — compile TS to `build/` and chmod the entry
- `npm start` — run `build/index.js`
- `npm run dev` — nodemon: rebuild + restart on `src/` changes
- `npm test` — Jest (all)
- `npm run test:watch` / `npm run test:coverage`
- `npm run test:integration` — only `*.integration.test.ts`
- `npm run verify:tool-catalog` — compare built `ListTools` output with the expected release surface
- `npm run verify:package-install` — pack, install into a temp directory, and smoke-test the packaged server
- `npm run verify:release` — run build + tool-catalog verification + packaged-install verification

## Layout

```
src/
├── index.ts                # MCP server entrypoint + stdio/stream transport bootstrap
├── auth.ts                 # API key and OAuth helpers
├── core/
│   ├── capabilities.ts     # Runtime transport/capability metadata
│   ├── handlers/           # Base handler + handler factory
│   ├── interfaces/         # Tool handler interfaces
│   └── types/              # MCP tool schemas and shared tool types
├── features/
│   ├── agents/
│   ├── attachments/
│   ├── auth/
│   ├── comments/
│   ├── cycles/
│   ├── issues/
│   ├── milestones/
│   ├── portfolio/
│   ├── projects/
│   ├── subscriptions/
│   ├── teams/
│   ├── users/
│   └── webhooks/
├── graphql/                # GraphQL client, queries, and mutations
├── types/                  # SDK helpers and shared mapping utilities
└── __tests__/              # Jest tests, including runtime and tool-surface regressions
```

Architecture is domain-driven and layered. New Linear capability = new folder under `src/features/<domain>/` with `handlers/` + `types/`, registration in `src/core/handlers/handler.factory.ts`, and schema exposure in `src/core/types/tool.types.ts`.

## Conventions

- ESM imports require `.js` extensions in TS source.
- Tool schemas live in `src/core/types/tool.types.ts`; handler routing lives in `src/core/handlers/handler.factory.ts`.
- Runtime-aware tools must respect `src/core/capabilities.ts` so subscription/stream behavior matches the active transport.
- `linear_list_issues` is filter-first; `linear_search_issues` is query-first and must stay query-backed.
- Tests live under `src/__tests__/`; keep search regressions in `graphql-client.test.ts` and `issue-handler.test.ts`.
- Update `README.md` and release verification when the advertised tool surface or runtime behavior changes.

## Notes for Claude

- Read the existing feature handler before changing behavior; most domains already have patterns to copy.
- Do not edit `build/`; it is generated.
- Keep `/sse` unsupported unless the runtime design changes everywhere, including docs and capability metadata.
- For tool-surface changes, update schemas, handler routing, docs, and release verification together.
- After non-trivial edits, run `npm run build`, `npm test`, and `npm run verify:release`.
- See `architecture.md` for the architectural rationale and cross-feature behavior.
