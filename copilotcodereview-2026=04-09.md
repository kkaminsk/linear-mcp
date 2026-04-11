# MCP Server Code Review

**Scope:** design patterns, bulk issue handling, AI agent handling, reliability, and security.

**Review sources:** manual review plus independent passes from **GPT-4.1**, **GPT-5.4**, **Claude Opus 4.6**, and **Claude Sonnet 4.6**.

**Baseline:** `npm run build`, `npm test`, and `npm run verify:release` completed successfully during review. The findings below are design, correctness, and hardening issues rather than current red-test failures.

## What is working well

- The repo has a clear domain-oriented handler structure with a shared response/error layer and explicit runtime capability gating for stdio vs stream transport.
- The issue search path is intentionally separated from list/filter semantics, and release verification covers the built tool catalog and packaged-install smoke path.
- Structured MCP responses are consistent, and the project already has good baseline coverage around auth, issue workflows, runtime transport, and tool contracts.

## Ranked recommendations

### 1. **High** — Harden OAuth state generation and make it truly single-use

**Recommendation:** Replace `Math.random()` with a cryptographically secure generator and clear `pendingOAuthState` on every callback attempt, not only after a successful token exchange.

**Why it matters:** The current state token is weak for a CSRF boundary, and the implementation/documentation mismatch means a failed exchange leaves the same state reusable even though the docs and tool response describe it as single-use.

**Evidence**

- State generation uses `Math.random()`: `src\auth.ts:198-199`
- State is only cleared on success, not in the failure path: `src\auth.ts:90-110`
- The server advertises the state as single-use: `README.md:8,63`, `src\features\auth\handlers\auth.handler.ts:30-37`

**Consensus:** manual, GPT-4.1, GPT-5.4, Opus, Sonnet

### 2. **High** — Stop sharing auth and OAuth state across stream-transport sessions

**Recommendation:** Scope auth state to the MCP session in stream mode, or explicitly reject concurrent/session-mixed auth flows instead of storing one global `LinearAuth` for the whole process.

**Why it matters:** Stream transport creates per-session IDs, but `config`, `tokenData`, `linearClient`, and `pendingOAuthState` are process-global. One client can overwrite another client’s auth flow or active credentials, which is a real security and reliability issue once the HTTP endpoint is used remotely.

**Evidence**

- A single `LinearAuth` instance is created and shared by the whole server: `src\index.ts:57-68`
- The auth state is instance-global: `src\auth.ts:48-52`
- Stream mode creates per-session IDs without per-session auth isolation: `src\index.ts:150-156`
- The README explicitly documents remote stream access and public tunneling: `README.md:121-135,224-226`

**Consensus:** manual, GPT-5.4, Opus, Sonnet

### 3. **High** — Enforce advertised tool schemas at the server boundary

**Recommendation:** Add server-side JSON Schema validation before dispatching tool calls, instead of relying on client conformance plus ad hoc `validateRequiredParams` checks.

**Why it matters:** The server advertises strict schemas, but the `CallTool` path forwards `arguments` directly to handlers. That means nested constraints like `minItems`, `anyOf`, nullability, object shape, and type checks are not actually enforced at runtime. This is especially risky for bulk issue inputs and agent payloads.

**Evidence**

- Tool calls are dispatched without schema validation: `src\index.ts:80-92`
- Runtime validation only checks presence of selected required fields: `src\core\handlers\base.handler.ts:178-193`
- The repo tests the schema metadata itself, not runtime enforcement: `src\__tests__\tool-contracts.test.ts:21-144`
- Example schemas that look strict but are not enforced server-side: `src\core\types\tool.types.ts:245-260,365-372,814-876`

**Consensus:** manual, GPT-5.4, Opus, Sonnet

### 4. **High** — Fix `linear_create_project_with_issues` to fail fast when project creation is incomplete

**Recommendation:** Before creating any issues, require both a successful project-create result and a concrete `projectId`, and reuse the safer lower-level orchestration instead of duplicating a weaker version in the handler.

**Why it matters:** The public MCP handler can proceed with `projectId: undefined`, because it never proves project creation succeeded or returned an ID. That can create issues detached from the intended project and drifts from the safer helper already implemented in the GraphQL client. Separately, if issue creation fails after the project is created, the current flow returns an error without rollback or a partial-success contract, leaving an orphaned project behind.

**Evidence**

- Handler extracts `projectId` and immediately fans into issue creation without guarding it: `src\features\projects\handlers\project.handler.ts:120-149`
- The lower-level helper already contains the missing success and project-ID guards: `src\graphql\client.ts:210-245`
- There is no direct test coverage for `handleCreateProjectWithIssues` in the project handler tests: `src\__tests__\project-handler.test.ts:1-110`

**Consensus:** manual, GPT-5.4, Opus, Sonnet

### 5. **Medium** — Fix bulk delete end to end before relying on it

**Recommendation:** First verify and fix the lower-level batch-delete mutation, then route `linear_delete_issues` through that corrected bulk path. If per-item deletion must remain temporarily, return per-ID outcomes instead of a single all-or-nothing `Promise.all` failure.

**Why it matters:** The create and update bulk paths use batch semantics, but delete still fans out into N single deletions. That increases API usage, rate-limit exposure, and partial-failure ambiguity. More importantly, the unused lower-level bulk-delete helper is itself suspicious: it calls `issueDelete(ids: $ids)` while the adjacent single-delete mutation uses `issueDelete(id: $id)`, and its only coverage is mock-based. If someone wires it in as-is, they may replace one reliability bug with another.

**Evidence**

- The public issue handler does per-item deletes with `Promise.all`: `src\features\issues\handlers\issue.handler.ts:242-253`
- The GraphQL client exposes an unused batch delete helper: `src\graphql\client.ts:338-342`
- The batch mutation shape is internally inconsistent with the single-delete mutation: `src\graphql\mutations.ts:148-162`
- The lower-level client has only mock-based tests for that path, and the handler does not use it: `src\__tests__\graphql-client.test.ts:669-692`

**Consensus:** manual, GPT-4.1, GPT-5.4, Opus, Sonnet

### 6. **Medium** — Tighten the agent workflow surface and add direct regression coverage

**Recommendation:** Replace freeform agent objects with narrower schemas where possible, add explicit bounds/required subfields for the remaining flexible payloads, and add dedicated tests for agent tool contracts and handler behavior.

**Why it matters:** The agent surface is the loosest contract in the repo. `plan`, `content`, `contextualMetadata`, `signalMetadata`, `filter`, and `userState` entries are all effectively arbitrary objects, and because the server does not enforce schemas at dispatch time, malformed or unexpectedly large payloads flow straight to the SDK. This is also the least-tested area relative to its flexibility.

**Evidence**

- `looseObjectProp` allows unrestricted objects: `src\core\types\tool.types.ts:33-37`
- Agent tools rely heavily on that unconstrained schema helper: `src\core\types\tool.types.ts:814-876`
- Agent type safety is inferred from SDK params rather than reinforced with repo-owned validation: `src\features\agents\types\agent.types.ts:12-29`
- The reviewed test suite has no dedicated `agent-handler` or agent contract coverage under `src\__tests__\`

**Consensus:** manual, GPT-4.1, GPT-5.4, Opus, Sonnet

### 7. **Medium** — Make `stateId` and `states` mutually exclusive or merge them predictably

**Recommendation:** Reject requests that send both `stateId` and `states`, or combine them explicitly instead of silently overwriting one with the other.

**Why it matters:** The issue filter builder first sets `filter.state` from `stateId` and then overwrites it if `states` is present. Because both inputs are advertised side by side in the tool schema, an MCP client or AI agent can reasonably send both and get surprising search/list results with no warning.

**Evidence**

- `stateId` is assigned first and then overwritten by `states`: `src\features\issues\handlers\issue.handler.ts:330-336`
- Both fields are advertised in the issue tool schemas: `src\core\types\tool.types.ts:267-273,283-288`

**Consensus:** Opus, manual validation

### 8. **Low** — Stop forwarding raw Linear response headers in MCP error payloads

**Recommendation:** Remove raw upstream headers from structured error responses, or whitelist only the few headers that are genuinely useful for client-side correlation.

**Why it matters:** GraphQL failures currently include the normalized upstream response headers in `structuredContent.error.graphql.headers`. That exposes more transport metadata than most MCP clients need and can leak request correlation or rate-limit internals unnecessarily.

**Evidence**

- Handler errors include the serialized GraphQL result: `src\core\handlers\base.handler.ts:102-116`
- The GraphQL serializer forwards all normalized headers verbatim: `src\core\handlers\base.handler.ts:214-246`

**Consensus:** Sonnet, manual validation

## Suggested implementation order

1. Fix OAuth state generation/consumption and session scoping.
2. Add server-side schema enforcement on the `CallTool` path.
3. Correct `linear_create_project_with_issues` to reuse or match the safer lower-level flow.
4. Move delete into the true bulk path.
5. Tighten and test the agent surface.
6. Resolve filter-field conflicts such as `stateId` vs `states`.
7. Trim unnecessary upstream metadata from structured error payloads.
