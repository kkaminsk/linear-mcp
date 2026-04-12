## ADDED Requirements

### Requirement: Linear-facing requests SHALL enforce explicit time budgets
The server SHALL enforce explicit timeout budgets for OAuth token exchange and for Linear-facing SDK or raw GraphQL operations instead of allowing those requests to hang indefinitely.

#### Scenario: Upstream request exceeds its time budget
- **WHEN** an external auth or Linear-facing request runs longer than its configured time budget
- **THEN** the server SHALL stop waiting for that request and surface a structured failure at the MCP boundary

### Requirement: Timeout failures SHALL remain diagnosable
The server SHALL preserve structured failure context when a timeout budget is exceeded.

#### Scenario: Timeout failure reaches the MCP boundary
- **WHEN** a request fails because its time budget is exceeded
- **THEN** the returned MCP error SHALL identify the operation as a timeout-driven failure without exposing sensitive request data
