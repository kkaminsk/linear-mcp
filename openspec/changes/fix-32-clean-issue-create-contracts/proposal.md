## Why

Issue creation is currently represented by multiple partially overlapping paths: the handlers use distinct Linear SDK calls, the GraphQL client still carries an invalid array-shaped `issueCreate` mutation, and the bulk-create tests still accept a response shape that looks like the wrong mutation. The runtime failure observed through the MCP tools matches this drift, so the create contract needs one authoritative implementation and regression coverage that protects the released tool surface.

## What Changes

- Make single-issue, batch-issue, and project-with-issues creation follow one authoritative contract per tool path.
- Remove or align stale GraphQL helpers and tests that imply unsupported array input on `issueCreate`.
- Add regression coverage that proves `linear_create_issue` uses single-item input, `linear_create_issues` uses batch input, and project-associated issue creation reuses the same batch path.
- Add runtime or packaged-server verification so released issue-create tools cannot drift from handler semantics.

## Capabilities

### New Capabilities
- `issue-create-contract-parity`: Keep single, batch, and project-scoped issue creation aligned with the documented Linear creation contracts.

### Modified Capabilities
- None.

## Impact

- `src\graphql\mutations.ts`
- `src\graphql\client.ts`
- `src\features\issues\handlers\issue.handler.ts`
- `src\features\projects\handlers\project.handler.ts`
- `src\__tests__\graphql-client.test.ts`
- `src\__tests__\issue-handler.test.ts`
- runtime or release validation for issue-create tool calls
