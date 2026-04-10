## ADDED Requirements

### Requirement: Tool calls SHALL be validated against advertised schemas
The server SHALL validate each tool call argument object against the advertised JSON Schema for that tool before invoking its handler.

#### Scenario: Invalid payload is rejected before handler dispatch
- **WHEN** a client sends arguments that violate the tool schema
- **THEN** the server SHALL return a structured validation error
- **AND** the target handler SHALL NOT be invoked

### Requirement: Validation errors SHALL be deterministic
The server SHALL report validation failures using consistent machine-readable error details that identify the invalid field or rule.

#### Scenario: Missing or conflicting fields surface structured details
- **WHEN** a client omits required fields or sends mutually invalid combinations
- **THEN** the response SHALL identify the failing field path or schema rule in structured error content
