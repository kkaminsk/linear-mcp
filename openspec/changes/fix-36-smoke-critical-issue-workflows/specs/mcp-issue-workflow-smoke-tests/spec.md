## ADDED Requirements

### Requirement: The MCP server MUST support deterministic smoke execution of critical issue workflows
The repository SHALL provide a credential-free way to boot the MCP server against a fake Linear backend for critical issue workflow verification.

#### Scenario: Smoke harness boots the server without real Linear credentials
- **WHEN** the critical issue workflow smoke suite runs
- **THEN** it MUST be able to execute the MCP server and exercise the target issue tools without requiring live Linear credentials

### Requirement: Critical issue workflow smoke coverage MUST include single create, batch create, and free-text search
The repository SHALL verify the MCP boundary behavior for the highest-risk issue workflows that users invoke directly.

#### Scenario: Smoke suite covers critical issue tools
- **WHEN** the MCP smoke suite runs
- **THEN** it MUST exercise `linear_create_issue`, `linear_create_issues`, and `linear_search_issues` through the MCP tool boundary

### Requirement: Verification MUST fail when critical issue workflows drift at the MCP boundary
The repository SHALL block release or verification success when the MCP smoke coverage detects stale issue workflow behavior.

#### Scenario: Verification fails on boundary regression
- **WHEN** a critical issue workflow smoke test observes incorrect MCP-boundary behavior
- **THEN** the verification step that runs the smoke suite MUST fail before the release is treated as valid
