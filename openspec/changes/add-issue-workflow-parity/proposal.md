## Why

After the platform-fidelity fixes, the most important remaining gaps are in the issue workflow itself. The current server cannot model several core Linear planning and triage primitives, which limits day-to-day use for agents and teams.

## What Changes

- Add a first-class `linear_get_issue` tool and expand issue read models with identifiers, hierarchy, relations, cycle, milestone, subscriber, and label data.
- Expand issue create, update, list, and search contracts to cover the planning fields called out in the review, including `dueDate`, `cycleId`, `labelIds`, `parentId`, `projectMilestoneId`, `subscriberIds`, `stateId`, `delegateId`, and `templateId`.
- Add first-class workflow state and label tools instead of exposing that information only through broader team responses.
- Add dedicated issue relation create and delete tools and expose relation data in issue reads.
- Add cycle read tools and cycle-aware issue filtering and mutation support.

## Capabilities

### New Capabilities
- `issue-detail-and-mutation-parity`: Bring issue reads and writes closer to the current Linear issue surface used for planning and triage.
- `workflow-state-and-label-management`: Expose workflow states and labels as first-class tools for state transitions and triage labeling.
- `issue-relation-management`: Support issue relation reads and relation mutation workflows.
- `cycle-management`: Expose cycle reads and cycle-aware issue operations for sprint planning.

### Modified Capabilities
- None.

## Impact

- `src\features\issues\**`
- `src\features\teams\**`
- `src\core\types\tool.types.ts`
- `src\core\handlers\handler.factory.ts`
- `src\graphql\queries.ts` and `src\graphql\mutations.ts`
- issue, team, and workflow-related tests and documentation
- possible new feature modules for cycles and relation-focused handlers or types
