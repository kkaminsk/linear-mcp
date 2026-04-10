## 1. Smoke harness setup

- [x] 1.1 Add a narrow fake-backend injection seam for the MCP server or handler wiring used by critical issue workflow tests.
- [x] 1.2 Create reusable smoke-test helpers that execute the MCP server without live Linear credentials.

## 2. Critical issue workflow coverage

- [x] 2.1 Add MCP-boundary smoke tests for `linear_create_issue` and `linear_create_issues`.
- [x] 2.2 Add MCP-boundary smoke tests for `linear_search_issues` and wire the smoke suite into the normal verification path or release guidance.
