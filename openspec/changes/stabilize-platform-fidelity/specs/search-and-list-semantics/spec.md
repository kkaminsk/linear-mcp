## ADDED Requirements

### Requirement: List tools provide filtered pagination semantics
The server SHALL expose dedicated list tools for issues and projects that use Linear filter and pagination semantics instead of ranked search semantics.

#### Scenario: Listing issues uses filters and page info
- **WHEN** a client calls the issue list tool with filters and pagination arguments
- **THEN** the server SHALL query the corresponding Linear list endpoint and SHALL return the matching items with pagination metadata

#### Scenario: Listing projects uses filters and page info
- **WHEN** a client calls the project list tool with filters and pagination arguments
- **THEN** the server SHALL query the corresponding Linear list endpoint and SHALL return the matching projects with pagination metadata

### Requirement: Search tools use current Linear search endpoints
The server SHALL implement issue and project search tools with the current Linear search endpoints so search results reflect ranked search behavior instead of filtered list behavior.

#### Scenario: Issue search returns ranked search results
- **WHEN** a client calls the issue search tool with a text query
- **THEN** the server SHALL execute Linear's current issue search endpoint and SHALL return ranked results with search-relevant metadata when available

#### Scenario: Project search returns true project search results
- **WHEN** a client calls the project search tool with a text query
- **THEN** the server SHALL execute Linear's current project search endpoint instead of an exact-name filter query

### Requirement: Tool discovery distinguishes list from search
The server SHALL advertise list tools and search tools as distinct MCP tools with descriptions that match their semantics.

#### Scenario: Clients can discover separate list and search capabilities
- **WHEN** an MCP client requests the server's tool list
- **THEN** the tool catalog SHALL distinguish issue and project listing tools from issue and project search tools
