## ADDED Requirements

### Requirement: Issue mutations support explicit parent assignment
The server SHALL expose parent-assignment support on the released issue create and update workflow.

#### Scenario: Create issue with parent reference
- **WHEN** a client creates an issue with a supported parent reference
- **THEN** the server SHALL persist the parent-child relationship and SHALL return issue data that identifies the parent

#### Scenario: Update issue parent reference
- **WHEN** a client updates an existing issue with a supported parent reference
- **THEN** the server SHALL update the parent-child relationship and SHALL return issue data that identifies the resulting parent

### Requirement: Issue detail returns hierarchy references
The server SHALL return parent and child issue references in the canonical issue-detail workflow.

#### Scenario: Get issue returns parent and child references
- **WHEN** a client loads a detailed issue that participates in parent-child hierarchy
- **THEN** the response SHALL include the linked parent reference and any child issue references available to the server
