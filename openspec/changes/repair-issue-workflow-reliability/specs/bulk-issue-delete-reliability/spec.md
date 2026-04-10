## ADDED Requirements

### Requirement: Bulk issue delete SHALL use a verified contract
The server SHALL execute bulk issue deletion through a contract that has been validated against the real Linear API surface before the MCP handler depends on it.

#### Scenario: Release verification runs
- **WHEN** release or contract verification checks the bulk issue delete path
- **THEN** the verification suite SHALL confirm that the configured bulk delete operation matches the Linear API contract

### Requirement: Bulk issue delete SHALL return deterministic outcomes
The server SHALL not return an ambiguous bulk-delete result when some requested issues are deleted and others fail.

#### Scenario: One or more issue deletions fail
- **WHEN** a bulk delete request cannot delete every requested issue
- **THEN** the response SHALL identify which issue IDs were deleted and which failed
- **AND** the top-level result SHALL indicate that the bulk request did not complete fully
