## ADDED Requirements

### Requirement: Agent tools SHALL have direct regression coverage
The repository SHALL include direct contract and handler tests for critical agent session and activity flows.

#### Scenario: Release validation runs agent regression coverage
- **WHEN** the repository test and release validation suites run
- **THEN** they SHALL execute direct tests for agent session create, get, and update flows
- **AND** they SHALL execute direct tests for agent activity create, get, and list flows
