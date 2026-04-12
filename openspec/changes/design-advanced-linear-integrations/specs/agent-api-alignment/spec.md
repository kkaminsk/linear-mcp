## ADDED Requirements

### Requirement: Agent tools manage agent sessions and activities
The server SHALL provide dedicated tools for agent session and agent activity workflows exposed by the supported Linear API baseline.

#### Scenario: Start or inspect an agent session
- **WHEN** a client requests an agent session workflow supported by the server
- **THEN** the server SHALL return a structured agent session result with the identifiers and state fields supported by the API

#### Scenario: Create or inspect agent activity
- **WHEN** a client requests an agent activity workflow supported by the server
- **THEN** the server SHALL return a structured agent activity result with the identifiers and status fields supported by the API

### Requirement: Agent tools surface explicit auth failures
The server SHALL surface agent-tool auth or permission failures explicitly instead of collapsing them into generic internal errors.

#### Scenario: Missing permission blocks an agent workflow
- **WHEN** Linear rejects an agent-tool request because the caller lacks the required auth or permission
- **THEN** the server SHALL return a structured auth or permission failure that preserves the relevant error detail
