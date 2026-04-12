## ADDED Requirements

### Requirement: Bulk Linear fan-out workflows SHALL enforce bounded concurrency
The server SHALL execute batch workflows that fan out into independent Linear operations within a documented maximum concurrency instead of issuing unbounded parallel requests.

#### Scenario: Batch workload exceeds the concurrency cap
- **WHEN** a batch workflow receives more work items than the configured maximum concurrency
- **THEN** the server SHALL queue the remaining items and start them only as active slots become available

### Requirement: Bounded concurrency SHALL preserve deterministic aggregation
The server SHALL preserve deterministic result aggregation when a batch workflow runs through the bounded-concurrency execution path.

#### Scenario: Batch results are collected after bounded execution
- **WHEN** a bounded batch workflow completes
- **THEN** the server SHALL aggregate results in a deterministic order that callers can map back to the original request items
