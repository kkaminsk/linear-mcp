## 1. GraphQL and type layer

- [x] 1.1 Add comment query and mutation documents for direct comment lookup, top-level comment listing, comment update, comment delete, comment resolve, and comment unresolve.
- [x] 1.2 Extend comment feature types and the GraphQL client with typed request and response helpers for the new comment read and lifecycle operations.
- [x] 1.3 Introduce a shared comment-mapping helper so read and write tools return consistent comment metadata and pagination fields.

## 2. MCP comment tool surface

- [x] 2.1 Add MCP tool schemas and handler-factory wiring for `linear_get_comment`, `linear_list_comments`, `linear_update_comment`, `linear_delete_comment`, `linear_resolve_comment`, and `linear_unresolve_comment`.
- [x] 2.2 Expand `linear_get_issue_comments` to accept native collection controls such as filter, ordering, archived inclusion, and pagination while reusing the shared comment projection.
- [x] 2.3 Update comment handlers so create, update, delete, resolve, and unresolve operations return structured machine-readable payloads with stable identifiers and mutation status.

## 3. Validation and documentation

- [x] 3.1 Add or update unit and contract tests for direct comment reads, paginated comment collections, threaded reply creation, and comment lifecycle mutations.
- [x] 3.2 Update README and related server documentation to describe the expanded comment tool surface and the markdown-first comment content contract.
