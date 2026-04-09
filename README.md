# Linear MCP Server

An MCP server for Linear built in TypeScript. It exposes a structured tool surface for issues, projects, workflow metadata, attachments, portfolio entities, webhooks, and agent workflows.

## What it supports

### Core work management
- Issues: get, create, batch create, bulk update, list, search, delete, hierarchy via `parentId`, and general issue relations
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

## Authentication

### API key

Set a personal API key in the environment:

```bash
LINEAR_API_KEY=your_api_key
```

This is the simplest way to run the server locally.

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

## Runtime transports

### Stdio

- Default mode for local clients such as Cline.
- No remote HTTP endpoint is available in stdio mode.
- Startup diagnostics will report whether `LINEAR_API_KEY` is configured or whether you still need to finish auth setup.

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

## Issue workflows

### Hierarchy vs. relations

- Use `parentId` on `linear_create_issue` and `linear_bulk_update_issues` for parent-child hierarchy.
- Use `linear_create_issue_relation` and `linear_delete_issue_relation` for non-hierarchical relationships such as blocked-by or duplicate links.
- `linear_get_issue` is the canonical hierarchy read and returns both `parent` and `children` references when they exist.

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
- The search path sends `query` through Linear's search backend instead of encoding it as an issue filter field.

## Marketplace and packaged installs

- The published package exposes the `linear-mcp` executable from `build/index.js`.
- Release verification uses:

```bash
npm run verify:tool-catalog
npm run verify:package-install
```

### Troubleshooting

- If startup logs say `Auth: no LINEAR_API_KEY detected`, the package installed correctly and you only need to finish auth setup.
- If a remote client hangs on `/sse`, switch it to the configured streamable HTTP endpoint such as `/mcp`, or run the server in stdio mode for local clients.
- Before publishing, run `npm run verify:release` to rebuild, validate the built tool catalog, and smoke-test a fresh package install.

## Comment tools

- `linear_get_comment` returns a direct comment payload with stable IDs, author metadata, issue context, parent linkage, and resolution state when present.
- `linear_list_comments` and `linear_get_issue_comments` both accept Linear-style collection controls: `first`, `after`, `last`, `before`, `filter`, `includeArchived`, and `orderBy`.
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
- GraphQL errors preserve status, headers, extensions, retryability, and error details.
