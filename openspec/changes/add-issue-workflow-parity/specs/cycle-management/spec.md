## ADDED Requirements

### Requirement: Cycle tools support get, list, and current-cycle reads
The server SHALL provide tools to get a cycle by identifier, list cycles, and fetch the current cycle for a team or context supported by Linear.

#### Scenario: List cycles for planning
- **WHEN** a client requests cycles for a supported team or planning context
- **THEN** the server SHALL return the matching cycles with identifiers, names, date ranges, and active-state metadata

#### Scenario: Get the current cycle
- **WHEN** a client requests the current cycle for a supported context
- **THEN** the server SHALL return the active cycle or an explicit empty result when no active cycle exists

### Requirement: Issue operations support cycle-aware filters and mutations
The server SHALL support `cycleId` in issue create and update tools and SHALL allow issue list and search tools to filter by cycle-aware criteria supported by Linear.

#### Scenario: Create an issue in a cycle
- **WHEN** a client creates or updates an issue with `cycleId`
- **THEN** the server SHALL pass that cycle assignment through to Linear and return the resulting issue state

#### Scenario: Filter issues by cycle
- **WHEN** a client requests issues filtered by a supported cycle criterion
- **THEN** the server SHALL return the matching issues and related pagination metadata
