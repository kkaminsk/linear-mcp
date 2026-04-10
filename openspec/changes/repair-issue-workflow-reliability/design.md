## Context

The issue and project workflow surface mixes strong batch semantics with ad hoc multi-step orchestration. `linear_create_project_with_issues` can progress without proving project creation returned a usable identifier, bulk delete does not yet expose a trustworthy end-to-end bulk contract, and issue-state filters can silently override one another. These behaviors make automation difficult to reason about because the MCP boundary does not always describe the final state clearly.

## Goals / Non-Goals

**Goals:**
- Make project-plus-issues workflows return deterministic outcomes.
- Repair bulk issue delete end to end before depending on it.
- Eliminate ambiguous issue-state filter behavior.
- Centralize or align multi-step workflow logic so it does not drift across layers.

**Non-Goals:**
- Introduce transactional guarantees that the upstream Linear API does not support.
- Redesign unrelated issue or project read paths.
- Broaden the workflow surface beyond the reviewed reliability fixes.

## Decisions

### 1. Use one shared orchestration contract for project-with-issues
The server should consolidate project-plus-issues orchestration into one shared path so the MCP handler and lower-level helper cannot diverge on success checks, project-ID guards, or failure semantics.

**Alternatives considered**
- Keep duplicate implementations and update both: rejected because the existing divergence is already a source of bugs.

### 2. Treat project creation and issue creation as a compensating workflow
The workflow cannot be truly atomic across two upstream operations, so the server should adopt explicit compensating behavior: validate project success and identifier before creating issues, attempt cleanup if issue creation fails, and if cleanup cannot complete, return a partial-state response that names the created project and failed step.

**Alternatives considered**
- Return a generic error after issue-batch failure: rejected because it leaves callers unable to reason about server state.
- Ignore compensation and document orphan risk: rejected because the tool is intended for automation.

### 3. Verify the bulk-delete contract before switching the MCP handler to it
Because the existing lower-level bulk-delete mutation appears suspicious, the implementation should add a contract audit or live-facing verification first. Once the contract is confirmed, the MCP handler should use that verified path; until then, it must not return ambiguous all-or-nothing results when partial deletion occurs.

**Alternatives considered**
- Wire the existing helper into the handler immediately: rejected because it may encode the wrong upstream contract.

### 4. Reject conflicting state filters
`stateId` and `states` should be treated as mutually exclusive at the MCP boundary. Rejecting the ambiguous combination is clearer than silently picking a precedence order.

**Alternatives considered**
- Let one field win silently: rejected because the current overwrite behavior is confusing.
- Merge the two into a compound filter: rejected because it complicates semantics without clear user benefit.

## Risks / Trade-offs

- **[Compensation can also fail]** -> Surface explicit partial-state details whenever rollback cannot restore the original state.
- **[Bulk delete contract uncertainty]** -> Add verification before changing the public handler path.
- **[Rejecting conflicting filters changes permissive behavior]** -> Make the validation error explicit and update docs/tests so the change is predictable.

## Migration Plan

1. Consolidate the project-with-issues orchestration path and define compensation semantics.
2. Verify the bulk-delete contract and update the handler accordingly.
3. Add validation for conflicting issue-state filters.
4. Backfill focused regression tests for each workflow.

## Open Questions

- If the upstream API lacks a true bulk-delete operation, should the long-term MCP contract return per-ID settled results permanently instead of a boolean success shape?
