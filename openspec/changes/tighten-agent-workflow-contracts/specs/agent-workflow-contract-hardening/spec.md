## ADDED Requirements

### Requirement: Agent flexible payloads SHALL be validated for type and bounds
The server SHALL validate agent payload objects for expected type and documented size or complexity bounds before sending them to Linear.

#### Scenario: Oversized agent activity content
- **WHEN** a client sends agent activity content or metadata that exceeds the documented bounds
- **THEN** the server SHALL reject the request with a validation error before invoking the Linear API

### Requirement: Agent responses SHALL use documented safe fields
The server SHALL return only intentionally documented agent response fields to MCP clients.

#### Scenario: Agent session or activity is returned
- **WHEN** the server returns an agent session or agent activity payload
- **THEN** the response SHALL include only the documented safe fields for that tool
- **AND** the server SHALL omit any unsupported or internal upstream fields
