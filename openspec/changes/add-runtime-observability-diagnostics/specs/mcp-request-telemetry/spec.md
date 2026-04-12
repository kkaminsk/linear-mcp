## ADDED Requirements

### Requirement: The server SHALL emit structured per-tool request telemetry
The server SHALL emit structured telemetry for each MCP tool request with enough information to troubleshoot latency and failures without inspecting raw protocol traffic.

#### Scenario: Tool request completes
- **WHEN** an MCP tool request completes successfully or with an error
- **THEN** the server SHALL emit a structured telemetry record that includes the tool name, runtime transport, duration, and final outcome

### Requirement: Request telemetry SHALL stay sanitized
The server SHALL keep per-tool telemetry free of secrets and raw sensitive payload data.

#### Scenario: Upstream failure contributes request metadata
- **WHEN** telemetry includes upstream request identifiers or failure context
- **THEN** the emitted telemetry SHALL exclude tokens, auth headers, and raw request bodies while allowing sanitized identifiers needed for troubleshooting
