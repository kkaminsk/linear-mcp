## Why

Once issue workflows are covered, the next gaps are the collaboration surfaces around them: attachments, richer project operations, project updates, and user or team discovery. Those capabilities are essential for integrations, portfolio planning, and multi-team automation.

## What Changes

- Add first-class attachment tools for create, update, delete, and query flows, including the metadata fields that make attachments useful for integrations.
- Expand project support from the current narrow surface to a fuller lifecycle that covers standalone mutations and richer project representations for planning.
- Add first-class project update tools instead of limiting project collaboration to project creation and lookup.
- Add user list and search support and expand team tools with get and list behavior, pagination, and filters.
- Keep collection responses structured and paginated so larger workspaces remain automatable.

## Capabilities

### New Capabilities
- `attachment-management`: Manage issue attachments as first-class integration objects.
- `project-lifecycle-management`: Support standalone project lifecycle operations and richer project planning data.
- `project-update-management`: Manage project updates as a dedicated collaboration surface.
- `user-and-team-discovery`: Support user and team lookup, listing, and search workflows needed by automations.

### Modified Capabilities
- None.

## Impact

- possible new attachment-focused feature module under `src\features\`
- `src\features\projects\**`
- `src\features\users\**`
- `src\features\teams\**`
- `src\core\types\tool.types.ts`
- `src\core\handlers\handler.factory.ts`
- project, user, team, and attachment GraphQL queries and mutations
- documentation and tests for project, attachment, user, and team workflows
