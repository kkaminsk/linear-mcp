## ADDED Requirements

### Requirement: Project tools support standalone lifecycle operations
The server SHALL provide standalone project create, update, delete, and get operations in addition to convenience flows that create projects together with issues.

#### Scenario: Create and update a standalone project
- **WHEN** a client creates or updates a project with the fields supported by the server
- **THEN** the server SHALL apply the corresponding Linear mutation and return the structured project result

#### Scenario: Delete a standalone project
- **WHEN** a client requests deletion of a project
- **THEN** the server SHALL delete that project through Linear and return a structured success result

### Requirement: Project reads preserve planning fields
Project read results SHALL preserve the planning data needed for portfolio workflows, including status, labels, lead or member context, and scheduling fields supported by Linear.

#### Scenario: Get project returns planning metadata
- **WHEN** a client requests a project through a supported project read tool
- **THEN** the server SHALL return the project's planning metadata in a structured payload

#### Scenario: Project discovery results use the shared project shape
- **WHEN** a client lists or searches projects through the discovery tools introduced by the platform-fidelity change
- **THEN** the returned projects SHALL use the shared structured project shape for the planning fields supported by the server
