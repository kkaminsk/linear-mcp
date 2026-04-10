## ADDED Requirements

### Requirement: Stream sessions SHALL not share mutable auth state
The server SHALL isolate OAuth configuration, pending state, token data, and active client state for each stream transport session.

#### Scenario: Concurrent stream sessions authenticate independently
- **WHEN** two stream transport sessions start separate OAuth flows
- **THEN** each session SHALL retain its own pending state and credentials
- **AND** one session SHALL NOT overwrite or invalidate the other session's auth context

### Requirement: Stdio auth SHALL remain local to the active server instance
The server SHALL preserve the existing single-client auth lifecycle for stdio transport while applying stream-session isolation only where multiple remote sessions are supported.

#### Scenario: Stdio auth continues to work
- **WHEN** the server runs in stdio mode and a client completes API-key or OAuth setup
- **THEN** subsequent tool calls in that stdio session SHALL use the same authenticated context
