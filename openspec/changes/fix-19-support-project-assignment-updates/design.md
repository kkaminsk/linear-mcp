## Context

The repository already supports project assignment during issue creation, but issue #19 shows that the update path is still confusing or unreliable for existing issues. The current surface also centers updates around batch semantics, which makes the single-issue project-assignment workflow less obvious than it should be.

## Goals / Non-Goals

**Goals:**
- Make project assignment on existing issues a supported, testable update workflow.
- Clarify the single-issue update path clients should use.
- Define explicit behavior for setting, changing, and clearing project association.

**Non-Goals:**
- Rework unrelated issue fields or project lifecycle operations.
- Force clients to use undocumented side effects to clear project assignment.
- Replace batch update support for multi-issue workflows.

## Decisions

### 1. Treat project assignment as a first-class issue mutation

Existing issues should be able to join or leave projects through the same issue-update surface that handles other planning changes. Clients should not need a project-specific workaround to move an issue into a project.

### 2. Keep single-issue ergonomics explicit

Whether the implementation uses the current batch update tool with one issue id or introduces a dedicated alias, the released surface should make the single-issue project-assignment path obvious in schemas and docs.

### 3. Separate clear semantics from omission

The update contract should distinguish between leaving the current project unchanged and intentionally clearing the current project. That behavior must be explicit so client calls are predictable.

## Risks / Trade-offs

- **Contract choice:** Adding a single-issue alias improves clarity but expands the tool surface. -> **Mitigation:** preserve the batch path and document the preferred single-issue flow.
- **Clear behavior:** Removing a project link may require a different input shape from setting one. -> **Mitigation:** decide and document a single supported clear-project contract.
- **Regression overlap:** Issue-update changes can affect other planning fields. -> **Mitigation:** keep regression tests focused on project-assignment behavior and existing update coverage.

## Migration Plan

1. Confirm the supported single-issue update path for project assignment.
2. Implement explicit set, change, and clear behavior for `projectId`.
3. Add regression tests for existing-issue project movement.
4. Update docs and examples for the supported issue-update workflow.

## Open Questions

- Should clearing project assignment use a nullable `projectId`, a dedicated clear flag, or another explicit contract?
- Is a dedicated `linear_update_issue` alias worth shipping for clarity, or is stronger documentation on the current update path sufficient?
