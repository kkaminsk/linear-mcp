## 1. Auth and client lifecycle

- [x] 1.1 Upgrade the Linear SDK and refresh schema-driven query assumptions against the current Linear platform baseline
- [x] 1.2 Introduce a late-bound GraphQL client provider so auth changes are visible to all handlers
- [x] 1.3 Convert auth verification and token refresh to an awaited flow and validate OAuth callback state and actor semantics

## 2. Tool contract alignment

- [x] 2.1 Replace non-standard JSON Schema usage in `src\core\types\tool.types.ts` and align mismatched fields such as comment `parentId`
- [x] 2.2 Add dedicated issue and project list tools and move search tools to the current Linear search endpoints
- [x] 2.3 Normalize handler responses onto structured JSON payloads with stable identifiers, URLs, status fields, and pagination metadata

## 3. GraphQL fidelity and documentation

- [x] 3.1 Update `src\graphql\client.ts` to preserve GraphQL errors, extensions, and operational headers
- [x] 3.2 Propagate retryability and GraphQL metadata through handler error handling at the MCP boundary
- [x] 3.3 Refresh README, architecture notes, and OAuth and search tests to match the implemented contracts
