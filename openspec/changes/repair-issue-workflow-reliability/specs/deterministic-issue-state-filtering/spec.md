## ADDED Requirements

### Requirement: Issue state filters SHALL be unambiguous
The server SHALL define one deterministic behavior when `stateId` and `states` are both provided on issue list or search requests.

#### Scenario: Conflicting state filters are supplied
- **WHEN** a client sends both `stateId` and `states` in the same issue list or search request
- **THEN** the server SHALL reject the request with a validation error that explains the conflict
