# Linear MCP Architecture

## Overview

The server defaults to stdio and can optionally expose MCP streamable HTTP with a domain-driven handler layer on top of Linear's API. It uses a hybrid integration model:

- raw GraphQL for legacy operations that still rely on explicit documents,
- current `@linear/sdk` methods for newer capability areas,
- structured MCP responses for both reads and mutations.

## Repository layout

```text
src/
├── index.ts
├── auth.ts
├── graphql/
│   └── client.ts
├── core/
│   ├── capabilities.ts
│   ├── handlers/
│   │   ├── base.handler.ts
│   │   └── handler.factory.ts
│   ├── interfaces/
│   └── types/
│       └── tool.types.ts
├── features/
│   ├── auth/
│   ├── issues/
│   ├── projects/
│   ├── comments/
│   ├── milestones/
│   ├── teams/
│   ├── users/
│   ├── cycles/
│   ├── attachments/
│   ├── webhooks/
│   ├── portfolio/
│   ├── agents/
│   └── subscriptions/
└── types/
    └── sdk.utils.ts
```

## Request flow

1. `index.ts` accepts MCP `ListTools` and `CallTool` requests.
2. `tool.types.ts` provides strict JSON Schema input contracts.
3. `handler.factory.ts` maps tool names to feature handlers.
4. Feature handlers extend `BaseHandler` for validation, auth checks, structured success responses, and structured errors.
5. `auth.ts` resolves the active Linear client lazily so auth changes are visible to every handler.

## Authentication model

`LinearAuth` supports:

- API key authentication from `LINEAR_API_KEY`
- OAuth authorization URL generation with Linear-supported parameters
- single-use callback state validation
- awaited token refresh
- late-bound client access through `ensureAuthenticatedClient()` and `getGraphQLClient()`

OAuth authorization requests use `actor=app` and require the freshly issued `state` on callback.

## GraphQL and SDK layer

`src/graphql/client.ts` is the shared execution boundary.

It provides:

- raw GraphQL execution with preserved status, headers, GraphQL errors, and extensions
- `executeSdk()` for SDK calls that should share the same structured error behavior
- `LinearGraphQLRequestError` for surfacing GraphQL metadata at the MCP boundary

## Response contract

Handlers return MCP-compatible results shaped around:

- human-readable text summaries in `content`
- machine-readable payloads in `structuredContent`
- `isError: true` for tool-visible failures

Error responses distinguish:

- GraphQL failures
- auth failures
- permission failures
- MCP validation failures
- capability limitations

## Runtime capability gating

`src/core/capabilities.ts` describes runtime support, endpoint metadata, and subscription behavior.

- On stdio, subscription tools are not advertised in the tool list.
- On stdio, no remote endpoint is exposed.
- On stream transport, capability metadata includes the active streamable HTTP endpoint.
- If a client still invokes a subscription tool directly, the server returns a structured capability error.
- `linear_get_capabilities` exposes the active runtime and feature availability.

This keeps advanced surfaces explicit without pretending that stdio can sustain streaming semantics it does not support or that `/sse` exists when the runtime is configured for streamable HTTP at `/mcp`.

## Domain boundaries

- **Issues** own detailed issue reads, hierarchy via `parentId`, planning-field mutations, search/list semantics, and general relations.
- **Projects** own standalone lifecycle, shared read shape, project updates, and initiative association.
- **Teams / Users** own discovery surfaces.
- **Cycles / Labels / Workflow states** expose workflow primitives needed by issue automation.
- **Portfolio** owns initiative and customer lifecycle, while project handlers surface initiative linkage in project-oriented reads and mutations.
- **Attachments / Webhooks / Agents** keep integration-focused behavior out of the issue and project handlers.

## Testing strategy

The test suite mixes:

- unit tests for auth and GraphQL client behavior,
- contract tests for tool schemas and capability gating,
- handler tests for hierarchy, project assignment, and initiative association semantics,
- runtime transport tests for streamable HTTP interoperability,
- optional integration tests for live Linear credentials.

Release verification also includes built-artifact checks:

- `npm run verify:tool-catalog` validates the built server's advertised tool surface,
- `npm run verify:package-install` smoke-tests a fresh packaged install before publishing.

The expected local verification path is:

```bash
npm run build
npm test
```
