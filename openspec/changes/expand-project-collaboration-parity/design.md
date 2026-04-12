## Context

The current repository can create a project together with issues, fetch a single project, and search projects narrowly by name. It does not expose attachment operations, project updates, or discovery-grade user and team tools beyond the current viewer and broad team read.

This change assumes the platform-fidelity proposal has already normalized list and search semantics so collection tools can build on a stable contract.

## Goals / Non-Goals

**Goals:**
- Add dedicated attachment tools that are usable for external-system integrations.
- Add richer standalone project lifecycle support, including planning metadata that current project work needs.
- Add first-class project update tooling.
- Add user and team discovery tools with structured pagination and filters.

**Non-Goals:**
- Revisit issue labels, workflow states, relations, or cycles, which belong to the issue-workflow change.
- Implement webhook, subscription, or agent APIs.
- Turn the MCP server into a file-upload host beyond the attachment patterns explicitly supported by Linear.

## Decisions

### 1. Model attachments as a dedicated feature surface

Attachments have their own lifecycle and are especially valuable for integrations because they connect external URLs and metadata to issues. They should be implemented as their own tool surface instead of being hidden inside the issue handler.

### 2. Separate project lifecycle from project updates

Project updates are narrative collaboration artifacts, not just another field on a project mutation. Splitting them into their own capability keeps the MCP surface clearer and lets update workflows evolve without overloading project CRUD logic.

### 3. Enrich project representations across read tools instead of creating a second project model

The project handlers should use a richer shared project shape that includes the planning fields called out in the review, such as statuses, labels, lead or member context, and schedule fields. That shared shape can then power get, list, and search responses consistently.

### 4. Treat user and team discovery as first-class collection tools

Automations need to look up assignees, team keys, and related workspace data. User and team discovery should therefore expose explicit get, list, and search semantics with structured pagination rather than relying on the current viewer-only or broad team response.

### 5. Keep convenience project flows layered on top of primitives

`linear_create_project_with_issues` remains useful, but it should become a convenience wrapper over the richer standalone project and issue primitives rather than the only practical way to create projects.

## Risks / Trade-offs

- **Broader tool surface:** More project, attachment, user, and team tools increase the MCP surface area. Mitigation: keep naming consistent and reuse connection patterns.
- **Attachment ambiguity:** Some workflows may expect direct upload handling. Mitigation: document whether the server supports URL-backed attachments only or a broader upload flow.
- **Project payload size:** Richer project representations can grow quickly. Mitigation: keep structured summaries concise and reserve deeper detail for get-oriented tools.
- **Workspace variance:** Teams and users can be large in enterprise Linear workspaces. Mitigation: require pagination and filters on list or search endpoints.

## Migration Plan

1. Add attachment queries and mutations with structured responses.
2. Expand standalone project lifecycle operations and shared project read shapes.
3. Add project update tools.
4. Add user and team discovery tools with pagination and filters.
5. Rebase existing convenience project flows on top of the richer primitives where appropriate.

## Open Questions

- Should the server support attachment upload mediation, or document URL-backed attachment flows only?
- Which project member or lead fields are most important to include in the initial shared project representation?
- Should team discovery continue to include inline workflow states and labels, or leave those to dedicated tools from the issue-workflow change?
