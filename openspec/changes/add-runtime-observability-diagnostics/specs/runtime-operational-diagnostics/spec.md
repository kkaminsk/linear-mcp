## ADDED Requirements

### Requirement: The server SHALL expose a read-only runtime diagnostics surface
The server SHALL provide a read-only MCP diagnostics surface that reports lightweight live operational state for troubleshooting.

#### Scenario: Operator requests runtime diagnostics
- **WHEN** an operator invokes the runtime diagnostics tool
- **THEN** the server SHALL return a live summary that includes transport details, auth scope or mode, active stream session count, and low-cardinality request or failure counters

### Requirement: Runtime diagnostics SHALL exclude secrets
The runtime diagnostics surface SHALL report operational health without exposing sensitive authentication or upstream request data.

#### Scenario: Diagnostics include auth and upstream context
- **WHEN** runtime diagnostics are returned to the caller
- **THEN** the response SHALL exclude API keys, OAuth tokens, auth headers, and raw upstream payload bodies
