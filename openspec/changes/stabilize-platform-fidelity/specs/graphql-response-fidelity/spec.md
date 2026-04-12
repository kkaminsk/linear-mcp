## ADDED Requirements

### Requirement: GraphQL responses preserve data and GraphQL errors
The server SHALL preserve GraphQL response data together with any GraphQL `errors` and `extensions` data until the MCP response boundary.

#### Scenario: Partial GraphQL success preserves both data and errors
- **WHEN** Linear returns GraphQL data together with GraphQL errors
- **THEN** the server SHALL preserve both in the response handling pipeline instead of collapsing the result to a generic text error

### Requirement: Operational metadata is exposed when available
The server SHALL preserve rate-limit headers, complexity headers, and similar operational response metadata when Linear includes them.

#### Scenario: Rate-limit metadata is surfaced
- **WHEN** a GraphQL response includes rate-limit or complexity metadata
- **THEN** the server SHALL expose that metadata in a machine-readable form to the caller

### Requirement: Failure handling distinguishes retryable and permanent conditions
The server SHALL classify GraphQL failures so callers can distinguish retryable conditions such as throttling from permanent conditions such as validation failures.

#### Scenario: Retryable failures are labeled as retryable
- **WHEN** Linear rejects a request because of throttling or another transient condition
- **THEN** the server SHALL surface the failure as retryable and SHALL preserve the relevant response metadata

#### Scenario: Permanent failures remain non-retryable
- **WHEN** Linear rejects a request because of a validation or permission failure
- **THEN** the server SHALL surface the failure as non-retryable and SHALL preserve the relevant error details
