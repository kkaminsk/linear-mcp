# Linear MCP Server

An MCP server for Linear built in TypeScript. It exposes a structured tool surface for issues, projects, workflow metadata, attachments, portfolio entities, webhooks, and agent workflows.

## Current status

- Default runtime is **stdio**. Set `LINEAR_MCP_TRANSPORT=stream` to expose MCP streamable HTTP at `LINEAR_MCP_PATH` (default `/mcp`). The server does **not** expose `/sse`.
- Auth supports `LINEAR_API_KEY`, the `LINEAR_ACCESS_TOKEN` alias, and the tool-driven OAuth flow through `linear_auth` and `linear_auth_callback`. OAuth callback `state` values are single-use.
- Advertised tool schemas are enforced at runtime before handler dispatch, so malformed tool payloads fail with structured validation errors at the MCP boundary.
- Advertised tool schemas avoid top-level `oneOf`/`allOf`/`anyOf` combinators so Claude-compatible MCP clients can ingest the full tool catalog.
- `linear_get_capabilities` reports transport details together with server build provenance so clients can confirm the packaged runtime name/version they are connected to.
- `linear_search_issues` is the query-backed issue search path. The built server advertises a required `query` string and keeps the free-text query separate from optional list-style filters.
- Release validation is gated by `npm run verify:release`, which rebuilds the server, audits guarded Linear issue contracts, checks the built tool catalog, runs critical issue workflow smoke tests, and smoke-tests a fresh packaged install.

## What it supports

### Core work management
- Issues: get, create one issue with `linear_create_issue`, batch create with `linear_create_issues`, bulk update, list, search, delete, hierarchy via `parentId`, and general issue relations
- Projects: create, update, delete, get, list, search, create-with-issues, project updates, and initiative association via `initiativeId`
- Comments: get a single comment, list comments globally or by issue, create threaded replies with `parentId`, update, delete, resolve, and unresolve threads
- Project milestones: create, update, delete, get, search, list, bulk create

### Workflow and discovery
- Teams: get, list
- Users: viewer, get, list, search
- Workflow states: list
- Labels: list, create, update, delete
- Cycles: get, list, current cycle

### Integrations and advanced surfaces
- Attachments: get, list, create, update, delete
- Webhooks: get, list, create, delete
- Portfolio entities: initiatives and customers
- Agents: agent sessions and agent activities
- Capabilities: runtime capability discovery

### Runtime-aware behavior
- Subscription tools are only advertised when the runtime reports streaming transport support.
- If a subscription tool is invoked on stdio, the server returns a structured capability-limitation error instead of a generic failure.
- The default runtime is stdio. Set `LINEAR_MCP_TRANSPORT=stream` to expose a remote MCP streamable HTTP endpoint instead.
- Stream mode uses MCP streamable HTTP at `LINEAR_MCP_PATH` (default `/mcp`). The server does **not** expose a legacy `/sse` endpoint.
- `linear_get_capabilities` reports `authScope` as `server` for stdio and `session` for stream transport.

## Authentication

### API key

Set a personal API key in either supported environment variable:

```bash
LINEAR_API_KEY=your_api_key
# or
LINEAR_ACCESS_TOKEN=your_api_key
```

If both are set, the server uses `LINEAR_API_KEY`. This is the simplest way to run the server locally.

### OAuth

The OAuth flow is available through MCP tools:

1. Call `linear_auth` with `clientId`, `clientSecret`, and `redirectUri`.
2. Open the returned `authorizationUrl`.
3. Call `linear_auth_callback` with both `code` and the exact returned `state`.

Notes:
- OAuth uses `actor=app`.
- Callback state is single-use and validated against the issued authorization request. If a link goes stale, call `linear_auth` again to get a fresh URL and state.
- The generated authorization URL uses only Linear-supported parameters. The server does not request offline-only OAuth parameters.
- Token refresh is awaited before handlers resolve the active client.
- In stream mode, each MCP session gets its own isolated auth context. Pending OAuth state, active tokens, and auth configuration do not leak across remote sessions.

## Webhook security

Webhook management tools only register webhooks with Linear. They do **not** host a public receiver for you.

If you create a webhook:
- store the webhook secret outside the repository,
- verify the Linear signature on every delivered payload,
- reject unsigned or invalid payloads before processing them.

## Development

```bash
npm install
npm run build
npm test
npm start
```

Additional commands:

```bash
npm run dev
npm run test:coverage
npm run test:integration
npm run verify:linear-api-contracts
npm run verify:issue-workflows
```

## MCP setup

Example MCP configuration:

```json
{
  "mcpServers": {
    "linear": {
      "command": "node",
      "args": ["C:\\path\\to\\linear-mcp\\build\\index.js"],
      "env": {
        "LINEAR_API_KEY": "your_personal_access_token"
      }
    }
  }
}
```

Use either `LINEAR_API_KEY` or `LINEAR_ACCESS_TOKEN` in MCP client config. If both are present, `LINEAR_API_KEY` wins.

## Runtime transports

### Stdio

- Default mode for local clients such as Cline.
- No remote HTTP endpoint is available in stdio mode.
- Startup diagnostics report the packaged server build as `Build: linear-mcp@<version>` before auth/setup messages.

### Streamable HTTP

Set these environment variables before starting the server:

```bash
LINEAR_MCP_TRANSPORT=stream
LINEAR_MCP_HOST=127.0.0.1
LINEAR_MCP_PORT=3000
LINEAR_MCP_PATH=/mcp
```

- Clients should connect to `http://127.0.0.1:3000/mcp` by default.
- `/sse` is not a supported endpoint; use the configured streamable HTTP path instead.
- If you need a public tunnel for a remote client, expose the configured port and forward the `/mcp` path. For example, `ngrok http 3000` should target the stream endpoint, not `/sse`.
- Stream transport auth is session-scoped. Each connected MCP session keeps its own pending OAuth state and credentials.

## Issue workflows

### Hierarchy vs. relations

- Use `linear_create_issue` for a single issue and `linear_create_issues` for one or more issues submitted through the batch-create contract.
- `linear_create_project_with_issues` creates the project first and reuses the same batch-create contract for its follow-on issues.
- `linear_create_project_with_issues` stops before issue creation if project creation does not return a usable project ID, and it reports compensation or partial-state details when downstream issue creation fails.
- Use `parentId` on `linear_create_issue` and `linear_bulk_update_issues` for parent-child hierarchy.
- Use `linear_create_issue_relation` and `linear_delete_issue_relation` for non-hierarchical relationships such as blocked-by or duplicate links.
- `linear_get_issue` is the canonical hierarchy read and returns both `parent` and `children` references when they exist.
- `linear_delete_issues` returns deterministic `deletedIds` and failure details when some requested issue deletions do not complete.

Example hierarchy update:

```json
{
  "issueIds": ["ENG-124"],
  "update": {
    "parentId": "ENG-100"
  }
}
```

### Existing issue project assignment

Use `linear_bulk_update_issues` for the released existing-issue update path, even when updating a single issue:

```json
{
  "issueIds": ["ENG-123"],
  "update": {
    "projectId": "project-abc"
  }
}
```

- Set or change a project assignment by sending a project ID.
- Clear an existing project assignment explicitly with `"projectId": null`.
- Omitting `projectId` leaves the current project unchanged.

## Project and initiative workflows

- Initiative lifecycle tools are available through `linear_get_initiative`, `linear_list_initiatives`, `linear_create_initiative`, and `linear_update_initiative`.
- Project create and update workflows accept `initiativeId` so clients can attach a project to an initiative.
- Clear an existing initiative association explicitly with `"initiativeId": null` on `linear_update_project`.
- Project reads and mutation responses include linked initiative summary data when the association exists.

Example project update:

```json
{
  "id": "project-abc",
  "initiativeId": "initiative-42"
}
```

## Search semantics

- `linear_list_issues` is the filter-and-pagination path.
- `linear_search_issues` is the free-text search path and always requires `query`.
- Optional `teamId`, `projectId`, `assigneeId`, `stateId`, `states`, `priority`, and `cycleId` filters are applied alongside the text query.
- `stateId` and `states` are mutually exclusive on both list and search requests.
- `linear_search_issues` does not accept a generic `filter` object or `orderBy`; those list-style controls stay on `linear_list_issues`.
- The search path sends `query` through Linear's search backend instead of encoding it as an issue filter field.
- Exact issue identifiers like `POL-431` resolve through a deterministic team-key + issue-number lookup before falling back to ranked search results.
- Current regression coverage covers both query-only and query-plus-filter search behavior.

## Guarded issue workflow contracts

- `linear_create_issue` uses the audited raw GraphQL single-create helper so the MCP tool does not inherit SDK mutation-shape regressions. `linear_create_issues` remains on the SDK-backed batch-create path.
- Raw GraphQL single-create stays on `IssueCreateInput!` and batch-create stays on `IssueBatchCreateInput!`; the repo guards against reintroducing array-shaped single-create input.
- Raw GraphQL bulk delete stays on `issueDelete(ids: $ids)` and the repo audits that helper contract separately from the MCP handler's deterministic per-ID result shaping.
- `linear_search_issues` keeps free-text queries on the raw `searchIssues(term: ...)` GraphQL path, with exact identifier lookups handled separately so issue references like `POL-431` stay reliable.
- Run `npm run verify:linear-api-contracts` to audit those guarded contracts locally. `npm run verify:release` includes the same audit before packaging.

## Critical issue workflow smoke coverage

- `npm run verify:issue-workflows` runs credential-free MCP-boundary smoke tests for `linear_create_issue`, `linear_create_issues`, and `linear_search_issues`.
- The smoke harness boots the real MCP server against a fake Linear backend, so the tool boundary is exercised without live Linear credentials or network access.
- `npm run verify:release` includes the smoke suite so critical issue workflows cannot drift silently between source and released builds.

## Marketplace and packaged installs

- The published package exposes the `linear-mcp` executable from `build/index.js`.
- Release verification uses:

```bash
npm run verify:tool-catalog
npm run verify:package-install
```

### Troubleshooting

- Run `linear_get_capabilities` to confirm the runtime is reporting the expected packaged server name/version before debugging tool behavior.
- If `linear_search_issues` fails with an `IssueFilter.search` GraphQL error, the client is still connected to a stale build or package that predates the raw search fix. Rebuild or reinstall the package, restart the MCP server, and re-check `linear_get_capabilities`.
- If startup logs say `Auth: no LINEAR_API_KEY or LINEAR_ACCESS_TOKEN detected`, the package installed correctly and you only need to finish auth setup.
- If a remote client hangs on `/sse`, switch it to the configured streamable HTTP endpoint such as `/mcp`, or run the server in stdio mode for local clients.
- Before publishing, run `npm run verify:release` to rebuild, validate the built tool catalog, and smoke-test a fresh package install.

## Comment tools

- `linear_get_comment` returns a direct comment payload with stable IDs, author metadata, issue context, parent linkage, and resolution state when present.
- `linear_list_comments` and `linear_get_issue_comments` both accept Linear-style collection controls: `first`, `after`, `last`, `before`, `filter`, `includeArchived`, and `orderBy`.
- `linear_get_issue_comments` accepts either a Linear issue ID or a human-friendly issue identifier such as `POL-431`.
- `linear_create_comment` and `linear_update_comment` use markdown `body` as the primary content field. `bodyData` remains optional advanced structured content for clients that need it.

## Released tool surface (Version 1.0.0)

Version 1.0.0 ships the released issue-update and comment workflow surface:

- `linear_bulk_update_issues`
- `linear_get_comment`
- `linear_list_comments`
- `linear_get_issue_comments`
- `linear_create_comment`
- `linear_update_comment`
- `linear_delete_comment`
- `linear_resolve_comment`
- `linear_unresolve_comment`

## Implementation notes

- Tool schemas in `src/core/types/tool.types.ts` use standard JSON Schema.
- Tool responses return machine-readable `structuredContent`.
- Comment tools use markdown-first `body` fields; `bodyData` is optional advanced structured content.
- The server uses both raw GraphQL operations and the current `@linear/sdk` surface.
- GraphQL errors preserve status, request correlation, retryability, and normalized error details without forwarding raw upstream headers.
