## ADDED Requirements

### Requirement: Issue search executes a query-aware backend path
The server SHALL execute `linear_search_issues` through a Linear search operation that accepts the client-provided `query`.

#### Scenario: Query-backed issue search returns matching issues
- **WHEN** a client calls `linear_search_issues` with a non-empty `query`
- **THEN** the server SHALL execute a search operation using that query and SHALL return matching issue results with pagination metadata

### Requirement: Issue search keeps filters separate from the text query
The server SHALL not encode the `query` argument as a field on `IssueFilter`.

#### Scenario: Query is not forwarded as an invalid issue filter field
- **WHEN** a client supplies `query` together with supported filter arguments
- **THEN** the server SHALL send the query through the search-specific parameter and SHALL apply additional constraints only through supported filter inputs
