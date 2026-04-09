## ADDED Requirements

### Requirement: Server startup supports an explicit remote stream transport mode
The server SHALL support an explicit startup mode for the documented remote streaming transport in addition to stdio mode.

#### Scenario: Remote stream mode starts a network-accessible MCP endpoint
- **WHEN** the server is started in the supported remote stream transport mode
- **THEN** it SHALL expose the documented MCP-compatible remote endpoint for client connections

### Requirement: Stdio deployments do not imply a remote endpoint
The server SHALL make stdio-only operation explicit so clients do not assume `/sse` or another remote endpoint exists.

#### Scenario: Stdio mode advertises no remote endpoint
- **WHEN** the server is started in stdio mode
- **THEN** its startup guidance and documentation SHALL indicate that no remote stream endpoint is available

### Requirement: Capability advertisement matches the active transport
The server SHALL report runtime capability information that matches the transport mode it actually started.

#### Scenario: Runtime capabilities reflect stdio mode
- **WHEN** the server is running in stdio mode
- **THEN** any transport or streaming capability output SHALL report stdio semantics and SHALL not claim remote stream availability
