# Linear MCP — Claude Code Guide

MCP server exposing Linear's API as tools for MCP-compatible clients (Cline, Claude Code, etc.).

## Stack

- TypeScript (ESM, `"type": "module"`)
- `@modelcontextprotocol/sdk` for MCP server
- `@linear/sdk` + raw GraphQL (`graphql`, `graphql-tag`) for Linear API
- Jest + ts-jest for tests
- Auth: Linear Personal API Key (OAuth flow scaffolded but not implemented)

## Commands

- `npm run build` — compile TS to `build/` and chmod the entry
- `npm start` — run `build/index.js`
- `npm run dev` — nodemon: rebuild + restart on `src/` changes
- `npm test` — Jest (all)
- `npm run test:watch` / `test:coverage`
- `npm run test:integration` — only `*.integration.test.ts`

## Layout

```
src/
├── index.ts                # MCP server entrypoint
├── auth.ts                 # Auth helpers
├── core/
│   ├── handlers/           # base.handler.ts, handler.factory.ts
│   ├── interfaces/         # tool-handler.interface.ts
│   └── types/              # tool.types.ts (MCP tool schemas), common.types.ts
├── features/               # Domain modules — each has handlers/ and types/
│   ├── auth/
│   ├── comments/
│   ├── issues/
│   ├── milestones/
│   ├── projects/
│   ├── teams/
│   └── users/
├── graphql/                # GraphQL operations / fragments
├── types/                  # Shared types
└── __tests__/              # Jest tests (unit + *.integration.test.ts)
```

Architecture is domain-driven and layered. New Linear capability = new folder under `src/features/<domain>/` with `handlers/` + `types/`, registered via the handler factory and exposed in `core/types/tool.types.ts`.

## Conventions

- ESM imports require `.js` extensions in TS source (compiles to ESM).
- Tool schemas live in `src/core/types/tool.types.ts`; handlers implement `ToolHandler`.
- Add a domain by mirroring an existing feature (e.g. `features/issues/`). Wire it in the handler factory.
- Tests colocated under `src/__tests__/` or per-feature; use `*.integration.test.ts` for live API tests.
- Linear auth via `LINEAR_API_KEY` env var (`.env` for local dev).

## Notes for Claude

- Always read existing handler/feature files before adding new ones — follow established patterns.
- After editing, run `npm run build` to catch type errors before declaring done.
- Don't touch `build/` (generated).
- OAuth flow in `auth.ts` / `scripts/` is **not** wired up — don't assume it works.
- See `architecture.md` for the full architectural rationale.
