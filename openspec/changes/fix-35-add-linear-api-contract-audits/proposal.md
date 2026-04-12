## Why

Two separate MCP failures came from the same root problem: the repository allowed stale Linear API assumptions to survive after the official contract had moved on. Public reports and the official Linear docs both confirm that `issueCreate` expects a single `IssueCreateInput`, while free-text issue search belongs on the SDK query path instead of an `IssueFilter.search` field.

## What Changes

- Add a repository-level contract audit for the Linear issue-create and issue-search surfaces.
- Fail verification when hand-written GraphQL documents or helper entry points encode unsupported create/search contracts, including array input on `issueCreate` or `search` inside `IssueFilter`.
- Define one authoritative source for when this server should use raw GraphQL documents versus official SDK operations for issue workflows.
- Document the guarded create/search contracts so future tool-surface changes do not reintroduce the same drift.

## Capabilities

### New Capabilities
- `linear-api-contract-audit`: Guard the repository against stale Linear create/search contract assumptions before code ships.

### Modified Capabilities
- None.

## Impact

- `src\graphql\mutations.ts`
- `src\graphql\queries.ts`
- `src\graphql\client.ts`
- `scripts\verify-tool-catalog.mjs` or a new dedicated contract-verification script
- release verification and developer documentation for issue workflow contracts
