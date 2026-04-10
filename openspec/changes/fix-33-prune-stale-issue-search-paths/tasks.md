## 1. Search path cleanup

- [x] 1.1 Remove or isolate stale raw issue search helpers and any filter-only queries behind `linear_search_issues`.
- [x] 1.2 Keep the handler and tool schema focused on query-backed search with separately forwarded supported filters.

## 2. Regression coverage

- [x] 2.1 Add runtime or server-boundary tests that call `linear_search_issues` through the MCP tool surface.
- [x] 2.2 Extend unit tests to fail on any attempt to encode the free-text query as a filter-only request.

## 3. Documentation and release parity

- [x] 3.1 Update README and tool docs to distinguish issue listing from free-text issue search and enumerate supported filters.
- [x] 3.2 Add release or packaged-server validation that blocks stale issue-search behavior from shipping.
