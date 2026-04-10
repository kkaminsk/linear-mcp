## Why

Several issue and project workflow paths are reliable only in the happy case: project-plus-issues creation can leave behind incomplete state, bulk delete does not use a trustworthy bulk contract end to end, and state filters can silently override each other. These gaps make automation harder to trust because callers cannot reason about outcomes from the MCP boundary alone.

## What Changes

- Make `linear_create_project_with_issues` fail fast when project creation is incomplete and define how partial failures are surfaced or compensated.
- Repair and validate the bulk issue delete contract before routing MCP bulk delete through it.
- Stop `stateId` and `states` from silently conflicting in issue list/search filters.
- Add focused tests for project-with-issues, bulk delete, and conflicting issue-filter inputs.

## Capabilities

### New Capabilities
- `project-with-issues-reliability`: project-plus-issue workflows return deterministic outcomes and never create orphaned issue batches silently.
- `bulk-issue-delete-reliability`: MCP bulk issue deletion uses a verified bulk contract and returns reliable outcomes.
- `deterministic-issue-state-filtering`: issue search and list flows handle `stateId` and `states` predictably.

### Modified Capabilities

## Impact

- Affected code: `src/features/projects/handlers/project.handler.ts`, `src/features/issues/handlers/issue.handler.ts`, `src/graphql/client.ts`, `src/graphql/mutations.ts`, and workflow tests.
- Affected behavior: callers receive clearer, safer results for multi-step issue and project automation.
- Potential compatibility note: ambiguous filter combinations may become explicit validation errors.
