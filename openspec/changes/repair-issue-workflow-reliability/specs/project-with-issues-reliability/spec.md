## ADDED Requirements

### Requirement: Project-with-issues creation SHALL require a valid project result before issue creation
The server SHALL create follow-on issues only after project creation succeeds and returns a concrete project identifier.

#### Scenario: Project creation lacks an identifier
- **WHEN** the project creation step reports success false or returns no project identifier
- **THEN** the server SHALL stop before creating any issues
- **AND** the response SHALL report that the project-with-issues workflow failed before issue creation began

### Requirement: Project-with-issues failures SHALL surface final state deterministically
The server SHALL either compensate for downstream issue-creation failures or return explicit partial-state details to the caller.

#### Scenario: Issue batch fails after project creation
- **WHEN** project creation succeeds and the subsequent issue batch fails
- **THEN** the server SHALL attempt its documented compensation path
- **AND** if compensation cannot fully restore the original state, the response SHALL identify the created project and the failed issue step
