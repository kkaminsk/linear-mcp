## Why

GitHub issue #19 reports that existing issues cannot be assigned to projects through the issue-update workflow, even though project assignment is expected to work for new issues. The issue-update contract needs an explicit, tested project-assignment path for existing issues.

## What Changes

- Ensure the supported issue-update path accepts project-assignment changes for existing issues.
- Define how clients set, change, and clear a project's association on an existing issue without relying on undocumented behavior.
- Add regression tests and documentation for project assignment through issue updates.

## Capabilities

### New Capabilities
- `issue-project-assignment-updates`: Support project assignment changes on existing issues through the released issue-update workflow.

### Modified Capabilities
- None.

## Impact

- issue update tool schemas and handler logic
- any shared issue input types used for update operations
- issue-mutation tests and README examples
