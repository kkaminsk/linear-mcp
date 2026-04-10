## ADDED Requirements

### Requirement: Issue search uses a query-backed search path
The server SHALL execute `linear_search_issues` through a search operation that accepts the client-provided `query` as a first-class search parameter.

#### Scenario: Query-only issue search returns structured results
- **WHEN** a client calls `linear_search_issues` with a non-empty `query`
- **THEN** the server SHALL execute a query-aware search and SHALL return structured issue results with pagination metadata

### Requirement: Issue search keeps the free-text query separate from filters
The server SHALL forward the `query` argument separately from supported filters and SHALL not encode the query as a field on a filter-only issues request.

#### Scenario: Query is not transformed into a filter-only request
- **WHEN** a client calls `linear_search_issues` with a `query` and supported filter arguments
- **THEN** the server SHALL send the query through the search-specific parameter and SHALL apply the filters only through supported filter inputs

### Requirement: Released issue search tools preserve query-backed semantics
The released server SHALL preserve the query-backed behavior of `linear_search_issues` at the MCP tool boundary.

#### Scenario: MCP runtime does not fall back to stale search helpers
- **WHEN** a built or packaged server handles `linear_search_issues`
- **THEN** it SHALL route the request to the query-backed search implementation and SHALL not invoke a stale filter-only helper for that tool call
