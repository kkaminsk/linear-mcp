## ADDED Requirements

### Requirement: Existing issues support project-assignment updates
The server SHALL let clients set, change, and clear a project's association on an existing issue through the supported issue-update workflow.

#### Scenario: Issue update assigns an existing issue to a project
- **WHEN** a client updates an existing issue with a supported project reference
- **THEN** the server SHALL persist the new project association and SHALL return issue data that reflects the linked project

#### Scenario: Issue update clears an existing issue's project association
- **WHEN** a client calls the supported issue-update workflow with the explicit clear-project input
- **THEN** the server SHALL remove the project's association from the issue and SHALL return issue data without a linked project

### Requirement: Project assignment is advertised on the released update path
The server SHALL expose project-assignment support in the schema and documentation for the released single-issue update workflow.

#### Scenario: Released update contract shows project-assignment support
- **WHEN** a client inspects the released tool schema or README examples for the supported issue-update path
- **THEN** the project-assignment field and its supported clear behavior SHALL be described explicitly
