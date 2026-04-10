## ADDED Requirements

### Requirement: Single issue creation uses a single-item contract
The server SHALL execute `linear_create_issue` using a single-issue creation contract that accepts one `IssueCreateInput` object.

#### Scenario: Single create does not send array input
- **WHEN** a client calls `linear_create_issue`
- **THEN** the server SHALL send one issue-create input object and SHALL return one created issue summary

### Requirement: Batch issue creation uses batch semantics
The server SHALL execute `linear_create_issues` through a batch creation contract instead of reusing a single-issue mutation with array input.

#### Scenario: Batch create sends an issues array through the batch path
- **WHEN** a client calls `linear_create_issues` with one or more issue objects
- **THEN** the server SHALL send those issues through a batch create request and SHALL return the created issue summaries

### Requirement: Project-attached follow-on issues reuse the batch contract
The server SHALL reuse the same batch issue creation contract for project workflows that create a project and then create associated issues.

#### Scenario: Project-with-issues creation reuses the batch create path
- **WHEN** a workflow creates a project together with associated issues
- **THEN** the server SHALL create the project first and SHALL create the follow-on issues through the same batch contract used by `linear_create_issues`

### Requirement: Released issue-create tools preserve single and batch contract separation
The released server SHALL keep `linear_create_issue` and `linear_create_issues` mapped to distinct create contracts at the MCP tool boundary.

#### Scenario: Tool boundary prevents single-versus-batch contract drift
- **WHEN** a built or packaged server handles both `linear_create_issue` and `linear_create_issues`
- **THEN** the single-create tool SHALL use the single-issue contract and the batch-create tool SHALL use the batch contract without sharing an array-shaped `issueCreate` request
