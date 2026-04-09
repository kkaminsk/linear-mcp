# Copilot API Review: `linear-mcp`

> **Note**
> This review captured the repository before the parity and fidelity changes implemented from the active OpenSpec proposals. Treat it as historical context, not the current feature inventory.

## Scope and method

This review compares the current MCP server implementation in this repository to Linear's current public API surface and MCP best practices.

- **Repo inspection:** `src\index.ts`, `src\auth.ts`, `src\graphql\client.ts`, `src\graphql\queries.ts`, `src\graphql\mutations.ts`, `src\core\types\tool.types.ts`, feature handlers/types, tests, `README.md`, and `architecture.md`
- **External research:** GPT-5.4, GPT-4.1, Claude Opus, and Claude Sonnet research passes plus current official Linear docs and current Linear SDK/schema sources
- **Note:** Perplexity search is not available in this environment, so current documentation was verified directly against Linear's docs and SDK/schema sources instead

## Executive summary

The server is **useful but far from high fidelity**.

It currently exposes a narrow slice of Linear:

- auth
- issues
- projects
- teams
- users
- comments
- project milestones

That is materially smaller than the current Linear API surface, which now includes richer search, workflow states, labels, issue relations, cycles, attachments, project updates, webhooks, subscriptions, initiatives, customers, and agent-session APIs.

More importantly, there are **fidelity bugs inside the surface it already exposes**:

1. **OAuth is not end-to-end usable** for the rest of the server because the shared GraphQL client is fixed before OAuth callback completes.
2. **Token refresh is not awaited and is not propagated** to the existing GraphQL client wrapper.
3. **Search tools are not using Linear's current search endpoints**; they behave like filtered listings instead of true search.
4. **Comment reply parameters are inconsistent** across tool schema, handler types, and Linear's actual API.
5. **GraphQL errors, rate-limit signals, and complexity headers are discarded**, which makes the server low fidelity under real load.

If the goal is a **high-fidelity MCP server for Linear**, the right path is:

1. fix the current correctness gaps,
2. upgrade the Linear SDK/schema baseline,
3. move to schema-driven structured tool outputs,
4. expand coverage in priority order around issues, workflow states, labels, cycles, attachments, project updates, and agent/webhook support.

## Current MCP surface vs current Linear API

| Area | Current Linear capability | Repo coverage | Alignment | Notes |
| --- | --- | --- | --- | --- |
| Auth | API keys, OAuth2, PKCE, refresh tokens, `client_credentials`, `actor=app` | API key + partial OAuth init/callback | **Low** | Missing PKCE, client credentials, actor-mode parity, robust refresh handling |
| Issues | Rich create/update/list/search/filter/relations/sub-issues | Create, batch create, batch update, filtered search, delete | **Partial** | Missing many fields and related entities |
| Issue search | `searchIssues(term, filter, includeComments, teamId, pagination)` | `issues(filter...)` wrapper | **Low** | Not true search |
| Projects | CRUD, statuses, labels, updates, members, lead, dates, search | Create-with-issues, get, exact-name search | **Low** | No standalone create/update/delete/list/search parity |
| Teams | Team queries plus states, members, cycles, hierarchy | List teams with states/labels | **Partial** | No team get/list filters/pagination/members/cycles |
| Users | Viewer, users list/search, user lookup | Viewer only | **Low** | Missing user lookup/list |
| Workflow states | `workflowState`, `workflowStates` | Only embedded under teams | **Low** | No first-class tooling |
| Comments | Create/read/update/delete, threaded replies, reactions | Get issue comments, create comment | **Partial** | Missing update/delete/reactions |
| Milestones | Project milestone CRUD/list/search/move | Good partial coverage | **Partial** | One of the stronger areas |
| Labels | Issue/project label CRUD and queries | Internal GraphQL mutation exists, no exposed tools | **Low** | Big feature gap |
| Relations | Issue relations CRUD | None | **None** | No blocks/duplicate/related support |
| Cycles | Query/list/create/update | None | **None** | Major workflow gap |
| Attachments | CRUD, idempotent URL semantics, metadata, uploads | None | **None** | High-value integration gap |
| Project updates | Query/create/update/archive | None | **None** | Important for modern Linear usage |
| Webhooks | Query/create/delete + HMAC verification model | None | **None** | No event-driven sync |
| Subscriptions | GraphQL subscriptions available | None | **None** | No real-time surface |
| Initiatives / customers | First-class entities with scopes | None | **None** | Enterprise/product planning gap |
| Agent APIs | Agent sessions, activities, MCP-aware integration model | None | **None** | Misses Linear's AI-native direction |

## High-impact fidelity gaps in the existing implementation

### 1. OAuth does not wire the rest of the server

**Evidence**

- `src\index.ts` creates `HandlerFactory` once and passes a possibly undefined `graphqlClient`
- `src\features\auth\handlers\auth.handler.ts` calls `auth.handleCallback(...)`
- `src\auth.ts` creates a new `LinearClient` after callback
- Other handlers still hold the original `graphqlClient` reference from startup

**Impact**

After successful OAuth callback, the auth object may be authenticated, but the feature handlers can still fail with `Not authenticated. Call linear_auth first.` because their shared `graphqlClient` was never rebuilt.

**Priority:** P0

### 2. Token refresh is async, but `verifyAuth()` does not await it

**Evidence**

- `src\core\handlers\base.handler.ts`
  - `if (this.auth.needsTokenRefresh()) { this.auth.refreshAPIKey(); }`
- `src\auth.ts`
  - `refreshAPIKey()` is `async`

**Impact**

Refresh can race with the next API call, errors can be dropped, and the existing `LinearGraphQLClient` still wraps the old client instance.

**Priority:** P0

### 3. “Search” tools are not using current Linear search APIs

**Evidence**

- `src\graphql\queries.ts`
  - `SEARCH_ISSUES_QUERY` calls `issues(...)`
  - `SEARCH_PROJECTS_QUERY` calls `projects(filter: ...)`
- Current Linear schema exposes:
  - `searchIssues(...)`
  - `searchProjects(...)`
  - `semanticSearch(...)`

**Impact**

- `linear_search_issues` is a filtered list, not ranked search
- `linear_search_projects` is effectively exact-name filtering, not search
- repo tool behavior does not match current Linear API expectations

**Priority:** P0

### 4. Comment reply input is inconsistent

**Evidence**

- `src\core\types\tool.types.ts` uses `parentCommentId`
- `src\features\comments\types\comment.types.ts` uses `parentId`
- `src\features\comments\handlers\comment.handler.ts` checks `args.parentId`
- Current Linear schema uses `CommentCreateInput.parentId`

**Impact**

Threaded replies are likely broken or at least unreliable from MCP clients using the declared tool schema.

**Priority:** P0

### 5. GraphQL fidelity is reduced to generic text errors

**Evidence**

- `src\graphql\client.ts` catches errors and throws `GraphQL operation failed: ...`
- It returns `response.data` only
- It drops GraphQL `errors[]`, `extensions`, response headers, rate-limit headers, and complexity headers
- `BaseHandler.handleError()` converts everything to `InternalError`

**Impact**

The server cannot faithfully surface:

- validation failures
- auth vs permission failures
- rate limiting
- partial-success GraphQL responses
- retry guidance

This is a major gap for production MCP behavior.

**Priority:** P0

### 6. Tool schemas are not strict JSON Schema

**Evidence**

- `src\core\types\tool.types.ts` uses `optional: true`

**Impact**

That is not standard JSON Schema. Some MCP clients may ignore it, leading to weaker validation and portability issues.

**Priority:** P1

### 7. Write tools often return prose instead of structured results

**Evidence**

- many handlers build plain text summaries instead of returning structured fields

**Impact**

This is fine for humans, but low fidelity for agents. Modern MCP clients benefit from:

- stable output shape
- structured IDs/URLs/pageInfo/lastSyncId
- machine-readable mutation results

**Priority:** P1

### 8. Documentation is stale and internally inconsistent

**Evidence**

- `README.md` says OAuth is "***NOT IMPLEMENTED***"
- `architecture.md` describes folders and patterns not present in the repo
- tests still assert `actor=application`
- current docs prefer `actor=app` and refresh-token-based OAuth as of 2026-04-01

**Impact**

The repo no longer accurately describes the real implementation or the current Linear platform.

**Priority:** P1

## Coverage gaps that matter most for high fidelity

### A. Issue parity is still incomplete

Current Linear `IssueCreateInput` / `IssueUpdateInput` support much more than this server exposes, including:

- `dueDate`
- `cycleId`
- `labelIds`
- `parentId`
- `projectMilestoneId`
- `subscriberIds`
- `stateId` on create
- `delegateId`
- `templateId`
- richer description/document fields

The repo's issue tools currently miss much of the data agents need for planning and triage:

- cycle
- due date
- sub-issue hierarchy
- relations
- subscribers/watchers
- milestone association
- richer search semantics

### B. Labels, workflow states, and relations should be first-class

For day-to-day Linear usage, a high-fidelity server needs dedicated support for:

- `issueLabels` / `issueLabelCreate` / `issueLabelUpdate` / `issueLabelDelete`
- `workflowStates`
- `issueRelationCreate` / `issueRelationDelete`

Without these, the server cannot represent common Linear workflows like:

- triage labeling
- moving work across state categories safely
- blocking / duplicate relationships

### C. Cycles are a major missing workflow primitive

Cycles are central to sprint-style planning. Current Linear supports `cycle`, `cycles`, and related issue filtering, but this server has no cycle tools at all.

**Recommended minimum**

- `linear_get_cycle`
- `linear_list_cycles`
- `linear_get_current_cycle`
- issue filtering by active cycle
- issue create/update support for `cycleId`

### D. Attachments are a high-value integration surface

Linear attachments are especially valuable for integrations because they:

- are idempotent on `(issueId, url)`
- support metadata
- support icon URLs
- connect external systems cleanly to Linear issues

This repo currently has no attachment coverage even though it is one of the most integration-friendly parts of Linear's API.

### E. Project parity is shallow

The repo supports:

- create project with issues
- get project
- exact-name project lookup

It does **not** support much of what current projects actually need:

- standalone create/update/delete
- list/search parity
- project statuses
- project labels
- project updates
- lead/member management
- start/target dates and status mutation

### F. The server ignores Linear's event-driven and AI-native direction

Current Linear now exposes:

- webhooks
- GraphQL subscriptions
- agent sessions and agent activities
- an MCP-aware integration model in the schema/SDK surface

A high-fidelity Linear MCP server should at least be designed with those capabilities in mind, even if not all are implemented on day one.

## Recommended roadmap

### P0: Correctness and platform alignment

1. **Upgrade the SDK/schema baseline**
   - repo uses `@linear/sdk ^38.0.0`
   - current upstream package metadata is substantially newer
   - use current schema and regenerate assumptions from that baseline

2. **Fix auth architecture**
   - separate auth state from GraphQL client construction
   - rebuild or lazily resolve the client after OAuth callback
   - await refresh
   - propagate refreshed tokens to the active client wrapper
   - validate OAuth state
   - support current actor semantics

3. **Fix input/output contract mismatches**
   - standard JSON Schema
   - align `parentId` naming
   - stop relying on undocumented input shapes

4. **Preserve GraphQL fidelity**
   - carry through `errors[]`
   - surface Linear error codes
   - keep rate-limit and complexity headers
   - distinguish retryable vs permanent failures

5. **Split list vs search**
   - `list_issues` / `search_issues`
   - `list_projects` / `search_projects`
   - use current `searchIssues` / `searchProjects` endpoints for true search

### P1: Core parity for common Linear workflows

1. **Issue parity**
   - add `get_issue`
   - support `dueDate`, `cycleId`, `labelIds`, `parentId`, `projectMilestoneId`, `subscriberIds`
   - expose parent/children/relations
   - include human-friendly `identifier` everywhere

2. **Workflow states and labels**
   - add first-class tools for states and labels

3. **Cycles**
   - list/get/current-cycle support
   - cycle-aware issue create/update/search

4. **Attachments**
   - create/update/delete/query attachments
   - consider upload flow documentation and server-side file handling guidance

5. **Projects**
   - standalone create/update/delete/list/search
   - project statuses, labels, updates

6. **Users and teams**
   - list/search users
   - get/list teams with pagination and filters

### P2: High-fidelity and Linear-native advanced capabilities

1. **Webhooks**
   - query/create/delete
   - signature verification guidance

2. **GraphQL subscriptions**
   - where transport and runtime make sense

3. **Initiatives and customers**
   - important for larger organizations

4. **Agent APIs**
   - agent sessions
   - agent activities
   - future alignment with Linear's AI workflows

## Best-practice guidance for a high-fidelity Linear MCP server

### 1. Prefer schema-driven generation over hand-maintained drift

Use the current Linear schema as the source of truth and generate:

- TypeScript types
- tool input schemas
- response shapes

This repo is already showing schema drift in naming, field coverage, and docs.

### 2. Expose both convenience params and raw filter power

Good MCP ergonomics usually means:

- **simple params** for common use
- **raw `filter` object** for advanced use

Recommended pattern:

- `query` / `term`
- common filters like `teamId`, `assigneeId`, `stateType`, `priority`, `labelIds`, `projectId`, `cycleId`
- optional raw `filter`

That keeps tools easy to use without hiding Linear's filter power.

### 3. Return structured results, not only prose

For write tools, return stable fields like:

- `id`
- `identifier`
- `url`
- `lastSyncId`
- timestamps
- related entity IDs

For list/search tools, always return:

- `nodes`
- `pageInfo`
- total/result metadata if available

If your MCP SDK/runtime supports it, add:

- `outputSchema`
- `structuredContent`

### 4. Preserve key Linear behaviors explicitly

A high-fidelity server should consistently preserve:

- `includeArchived`
- cursor pagination in both directions
- `orderBy`
- stable identifiers and UUIDs
- issue identifiers like `ENG-123` anywhere Linear accepts them
- Linear priority encoding
- `TimelessDate` handling for due dates

### 5. Model errors as product behavior, not generic failures

At minimum, carry:

- Linear error code
- message
- retry hint
- rate-limit metadata when present

This will matter as soon as the server is used in multi-step autonomous flows.

### 6. Keep “search” and “list” distinct

This is one of the clearest current mismatches in the repo.

- **list** = filterable collection query
- **search** = ranked, term-based search endpoint

Do not overload one into the other.

### 7. Add MCP-native affordances

For a polished MCP server, consider:

- `title` on tools
- annotations like read-only vs destructive hints
- resource-style views for stable entities such as:
  - `linear://issue/{identifier}`
  - `linear://project/{id}`
  - `linear://team/{key}`

## Suggested target tool set

If the goal is “high fidelity without trying to expose all of Linear at once,” this is a strong near-term target:

### Read

- `linear_get_viewer`
- `linear_get_issue`
- `linear_list_issues`
- `linear_search_issues`
- `linear_get_project`
- `linear_list_projects`
- `linear_search_projects`
- `linear_get_team`
- `linear_list_teams`
- `linear_list_workflow_states`
- `linear_list_labels`
- `linear_get_cycle`
- `linear_list_cycles`
- `linear_get_current_cycle`
- `linear_get_issue_comments`
- `linear_list_project_milestones`

### Write

- `linear_create_issue`
- `linear_update_issue`
- `linear_batch_create_issues`
- `linear_batch_update_issues`
- `linear_delete_issue`
- `linear_create_comment`
- `linear_update_comment`
- `linear_delete_comment`
- `linear_create_attachment`
- `linear_update_attachment`
- `linear_delete_attachment`
- `linear_create_issue_relation`
- `linear_delete_issue_relation`
- `linear_create_label`
- `linear_update_label`
- `linear_delete_label`
- `linear_create_project`
- `linear_update_project`
- `linear_delete_project`
- `linear_create_project_update`
- `linear_update_project_update`

## Bottom line

This repo is a **solid prototype**, especially around basic issues and milestones, but it is **not yet a high-fidelity Linear MCP server**.

The biggest problems are not just missing breadth; they are also **contract and behavior mismatches** in the existing implementation:

- auth lifecycle
- refresh handling
- search semantics
- comment threading params
- error fidelity
- structured outputs

If those P0 issues are fixed first, the server becomes a credible base for expanding into the missing Linear primitives that matter most: labels, workflow states, relations, cycles, attachments, project updates, and eventually webhooks and agent APIs.

## Source references

### Repository

- `README.md`
- `architecture.md`
- `src\index.ts`
- `src\auth.ts`
- `src\graphql\client.ts`
- `src\graphql\queries.ts`
- `src\graphql\mutations.ts`
- `src\core\types\tool.types.ts`
- `src\features\comments\types\comment.types.ts`
- `src\features\comments\handlers\comment.handler.ts`
- `src\__tests__\auth.test.ts`
- `src\__tests__\auth.integration.test.ts`

### Current Linear docs and schema sources

- https://linear.app/developers
- https://linear.app/developers/graphql
- https://linear.app/developers/filtering
- https://linear.app/developers/pagination
- https://linear.app/developers/oauth-2-0-authentication
- https://linear.app/developers/oauth-actor-authorization
- https://linear.app/developers/rate-limiting
- https://linear.app/developers/webhooks
- https://linear.app/developers/attachments
- https://linear.app/developers/how-to-upload-a-file-to-linear
- https://linear.app/developers/agents
- https://linear.app/changelog
- https://github.com/linear/linear/tree/master/packages/sdk
- https://raw.githubusercontent.com/linear/linear/master/packages/sdk/src/schema.graphql

