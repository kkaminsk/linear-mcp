## ADDED Requirements

### Requirement: Detailed issue reads expose planning and hierarchy fields
The server SHALL provide a detailed issue read tool that returns the issue identifier together with the planning and hierarchy fields needed for triage and sprint workflows.

#### Scenario: Get issue returns planning context
- **WHEN** a client requests a specific issue
- **THEN** the server SHALL return the issue identifier, due date, cycle, milestone, labels, parent, children, subscribers, and other supported planning fields in a structured payload

### Requirement: Issue create and update support planning fields from the current Linear surface
The server SHALL allow issue create and update operations to accept the review's recommended planning fields, including `dueDate`, `cycleId`, `labelIds`, `parentId`, `projectMilestoneId`, `subscriberIds`, `stateId`, `delegateId`, and `templateId` when supported by Linear.

#### Scenario: Create issue with planning fields
- **WHEN** a client creates an issue with supported planning, hierarchy, and workflow arguments
- **THEN** the server SHALL pass those fields through to the corresponding Linear mutation and return the created issue in a structured response

#### Scenario: Update issue with planning fields
- **WHEN** a client updates an issue with supported planning, hierarchy, and workflow arguments
- **THEN** the server SHALL apply those fields through the corresponding Linear mutation and return the updated issue in a structured response

### Requirement: Issue collections preserve human-friendly identifiers
Issue list and search results SHALL include Linear identifiers so clients can reference issues without a second lookup.

#### Scenario: Issue list results include identifiers
- **WHEN** a client lists or searches issues
- **THEN** each returned issue SHALL include its human-friendly Linear identifier in the structured payload
