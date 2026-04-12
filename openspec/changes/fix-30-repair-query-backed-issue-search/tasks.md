## 1. Search execution path

- [x] 1.1 Update `linear_search_issues` to call a query-aware search backend instead of encoding the query as an issue filter.
- [x] 1.2 Normalize search results into the existing structured issue summary shape with pagination metadata.

## 2. Regression coverage

- [x] 2.1 Add tests for successful query-only issue search.
- [x] 2.2 Add tests for query-plus-filter searches so unsupported filter encoding does not return.

## 3. Documentation

- [x] 3.1 Update README and tool docs to distinguish issue listing from free-text issue search.
- [x] 3.2 Document any supported filter combinations or known limits on the search path.
