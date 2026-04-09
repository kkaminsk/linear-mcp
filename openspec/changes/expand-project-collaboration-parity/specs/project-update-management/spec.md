## ADDED Requirements

### Requirement: Project update tools manage project updates
The server SHALL provide tools to create and update project updates associated with a Linear project.

#### Scenario: Create a project update
- **WHEN** a client creates a project update for a project with the required content and status fields
- **THEN** the server SHALL create the update through Linear and return the structured project update result

#### Scenario: Update an existing project update
- **WHEN** a client updates an existing project update
- **THEN** the server SHALL apply the requested mutation and return the updated structured result
