## ADDED Requirements

### Requirement: Workflow state tools expose state metadata needed for safe transitions
The server SHALL provide workflow state tools that expose the state identifiers, names, categories, and team context needed to move issues safely through a workflow.

#### Scenario: List workflow states for a team
- **WHEN** a client requests workflow states for a team
- **THEN** the server SHALL return the available states with their identifiers, names, types, and team context in a structured payload

### Requirement: Label tools support team-scoped label lifecycle operations
The server SHALL provide label tools that can list, create, update, and delete labels within the team or scope required by Linear.

#### Scenario: Create a triage label
- **WHEN** a client creates a label with the required team context and label fields
- **THEN** the server SHALL create the label through Linear and return the structured label result

#### Scenario: Update or delete an existing label
- **WHEN** a client updates or deletes a previously created label
- **THEN** the server SHALL apply the requested mutation and return a structured success result
