## ADDED Requirements

### Requirement: OAuth authorization URLs use only supported Linear parameters
The server SHALL generate Linear OAuth authorization URLs that omit unsupported offline-only parameters.

#### Scenario: Generated URL excludes unsupported offline parameters
- **WHEN** a client calls `linear_auth`
- **THEN** the returned authorization URL SHALL not include `offline_access` in the scope or `access_type=offline`

### Requirement: OAuth callback state is single-use
The server SHALL require `linear_auth_callback` to receive the current issued state and SHALL reject reused or mismatched state values.

#### Scenario: Reused or mismatched state is rejected
- **WHEN** a client calls `linear_auth_callback` with a state that was not issued for the current pending authorization request
- **THEN** the server SHALL reject the callback with a clear state-validation error

### Requirement: OAuth workflow guidance includes the returned state
The server SHALL tell callers that `linear_auth_callback` requires both the authorization `code` and the newly issued `state`.

#### Scenario: Auth response explains callback inputs
- **WHEN** a client initializes OAuth with `linear_auth`
- **THEN** the response guidance SHALL tell the client to pass both the returned `state` and the authorization `code` to `linear_auth_callback`
