## ADDED Requirements

### Requirement: OAuth state SHALL be cryptographically strong
The server SHALL generate OAuth `state` values using a cryptographically secure random source and SHALL bind each callback to the exact issued state.

#### Scenario: Authorization URL includes secure state
- **WHEN** `linear_auth` generates an authorization URL
- **THEN** the response SHALL include a newly generated non-empty state derived from a cryptographically secure source
- **AND** the same state SHALL be embedded in the authorization URL returned to the client

### Requirement: OAuth state SHALL be single-use
The server SHALL invalidate a pending OAuth state after the first matched callback attempt, regardless of whether the token exchange succeeds.

#### Scenario: Failed token exchange consumes the state
- **WHEN** `linear_auth_callback` receives the correct pending state but the token exchange fails
- **THEN** the server SHALL return an error
- **AND** the same state SHALL be rejected on any later callback attempt

#### Scenario: Successful token exchange consumes the state
- **WHEN** `linear_auth_callback` receives the correct pending state and the token exchange succeeds
- **THEN** the server SHALL authenticate the caller
- **AND** the same state SHALL be rejected on any later callback attempt
