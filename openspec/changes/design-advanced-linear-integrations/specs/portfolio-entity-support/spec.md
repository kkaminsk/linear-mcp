## ADDED Requirements

### Requirement: Portfolio entity tools support initiatives and customers
The server SHALL provide tools to read and mutate initiatives and customers using structured outputs consistent with the rest of the MCP surface.

#### Scenario: List or get portfolio entities
- **WHEN** a client requests initiatives or customers through supported read tools
- **THEN** the server SHALL return structured portfolio-entity results with the identifiers and planning metadata supported by the server

#### Scenario: Mutate a portfolio entity
- **WHEN** a client creates or updates a supported initiative or customer record
- **THEN** the server SHALL apply that mutation through Linear and return the structured result
