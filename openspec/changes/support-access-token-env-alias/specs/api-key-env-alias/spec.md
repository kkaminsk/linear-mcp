## ADDED Requirements

### Requirement: Startup API-key auth SHALL accept either supported env name
The server SHALL initialize startup API-key auth from `LINEAR_API_KEY` or `LINEAR_ACCESS_TOKEN`.

#### Scenario: Startup bootstraps from `LINEAR_ACCESS_TOKEN`
- **WHEN** the server starts without `LINEAR_API_KEY` and with `LINEAR_ACCESS_TOKEN`
- **THEN** startup auth SHALL initialize with the `LINEAR_ACCESS_TOKEN` value
- **AND** startup diagnostics SHALL report that `LINEAR_ACCESS_TOKEN` was detected

### Requirement: Startup API-key env precedence SHALL be deterministic
The server SHALL prefer `LINEAR_API_KEY` when both supported API-key env variables are present.

#### Scenario: Both API-key env vars are present
- **WHEN** the server starts with both `LINEAR_API_KEY` and `LINEAR_ACCESS_TOKEN`
- **THEN** startup auth SHALL use the `LINEAR_API_KEY` value
- **AND** startup diagnostics SHALL state that both env vars were detected and `LINEAR_API_KEY` was chosen

### Requirement: Startup guidance SHALL document both API-key env names
Startup diagnostics and operator docs SHALL describe the same API-key env contract.

#### Scenario: Neither API-key env var is present
- **WHEN** the server starts without `LINEAR_API_KEY` and without `LINEAR_ACCESS_TOKEN`
- **THEN** startup diagnostics SHALL explain that neither supported API-key env var was detected
- **AND** the guidance SHALL tell operators to set either env var for API-key auth or use OAuth instead
