## ADDED Requirements

### Requirement: Issue creation contracts MUST match the guarded Linear create shapes
The repository SHALL reject issue-create implementations that encode unsupported GraphQL input shapes for single-create or batch-create workflows.

#### Scenario: Audit rejects array input on single issue creation
- **WHEN** repository verification inspects the single-issue create contract
- **THEN** it MUST fail if `issueCreate` is defined or invoked with array-shaped input instead of one `IssueCreateInput`

### Requirement: Free-text issue search MUST stay separate from filter-only issue listing fields
The repository SHALL reject issue-search implementations that encode the user query as an `IssueFilter` field instead of the authoritative query-backed search path.

#### Scenario: Audit rejects filter-based free-text search encoding
- **WHEN** repository verification inspects the issue search implementation
- **THEN** it MUST fail if free-text search is routed through a raw `IssueFilter.search`-style contract or an equivalent stale filter-only helper

### Requirement: Release verification MUST run the contract audit
The release workflow SHALL include the Linear API contract audit before a build is considered ready to ship.

#### Scenario: Release fails on contract drift
- **WHEN** the guarded create/search contract audit detects a stale or unsupported contract shape
- **THEN** release verification MUST fail before packaging succeeds
