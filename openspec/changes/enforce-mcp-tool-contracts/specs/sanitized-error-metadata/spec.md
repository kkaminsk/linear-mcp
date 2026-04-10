## ADDED Requirements

### Requirement: Structured GraphQL errors SHALL exclude raw upstream headers
The server SHALL NOT forward the full upstream HTTP header set in structured MCP error payloads.

#### Scenario: GraphQL request fails
- **WHEN** a GraphQL or SDK-backed request fails
- **THEN** the structured error SHALL omit raw upstream headers
- **AND** the response MAY include only approved diagnostic fields such as status, retryability, request correlation, and normalized GraphQL errors

### Requirement: Error metadata SHALL use an allowlist
The server SHALL expose only intentionally approved upstream diagnostic metadata to MCP clients.

#### Scenario: Upstream response contains extra headers
- **WHEN** the upstream response includes headers or extensions outside the allowlist
- **THEN** those values SHALL NOT appear in the structured MCP error payload
