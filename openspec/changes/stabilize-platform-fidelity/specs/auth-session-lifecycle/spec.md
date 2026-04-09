## ADDED Requirements

### Requirement: Authenticated tools use the active GraphQL client
The server SHALL make the current authenticated GraphQL client available to every handler invocation after a successful OAuth callback or API key initialization.

#### Scenario: OAuth callback activates the authenticated client
- **WHEN** `linear_auth_callback` completes successfully for a pending OAuth flow
- **THEN** the next authenticated tool invocation SHALL use the newly authenticated GraphQL client without requiring a process restart

### Requirement: Token refresh completes before protected GraphQL operations run
The server SHALL await token refresh before executing a protected GraphQL operation when the active OAuth token is within the refresh window.

#### Scenario: Refresh occurs before the next API request
- **WHEN** an authenticated tool call arrives while the active OAuth token needs refresh
- **THEN** the server SHALL refresh the token, update the active GraphQL client, and only then execute the requested GraphQL operation

#### Scenario: Refresh failure prevents the downstream request
- **WHEN** token refresh fails for an authenticated tool call
- **THEN** the server SHALL return an auth-related failure and SHALL NOT execute the downstream GraphQL operation with stale credentials

### Requirement: OAuth callbacks validate issued state
The server SHALL validate the callback state value against the state issued during authorization before mutating auth state.

#### Scenario: Invalid callback state is rejected
- **WHEN** `linear_auth_callback` receives a state value that does not match the issued authorization request
- **THEN** the server SHALL reject the callback and SHALL NOT replace the current auth state or active GraphQL client

### Requirement: Authorization URLs use the current Linear actor contract
The server SHALL generate OAuth authorization URLs using the actor semantics and scope set supported by the current Linear platform baseline.

#### Scenario: Authorization URL uses the current actor setting
- **WHEN** `linear_auth` generates an authorization URL
- **THEN** the URL SHALL include the actor setting and scopes supported by the current Linear API baseline used by the repository
