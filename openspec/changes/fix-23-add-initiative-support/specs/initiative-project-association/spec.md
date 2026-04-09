## ADDED Requirements

### Requirement: Projects support initiative association updates
The server SHALL let clients set, change, and clear an initiative association when creating or updating a project through the MCP surface.

#### Scenario: Project update assigns an initiative
- **WHEN** a client updates a project with a supported initiative reference
- **THEN** the server SHALL persist the association and SHALL return project data that includes the linked initiative summary

#### Scenario: Project update clears an initiative association
- **WHEN** a client updates a project to remove the initiative reference
- **THEN** the server SHALL clear the association and SHALL return the updated project data without a linked initiative

### Requirement: Initiative support is documented and tested as a released workflow
The server SHALL document and test the released initiative lifecycle and project-association workflow.

#### Scenario: Released docs advertise initiative workflows consistently
- **WHEN** a user reviews the released README or tool catalog
- **THEN** the initiative lifecycle and project-association workflows SHALL be described consistently with the shipped MCP surface
