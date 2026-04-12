## 1. Runtime Tool Validation

- [x] 1.1 Compile validators from the advertised tool schemas and enforce them in the `CallTool` dispatch path
- [x] 1.2 Normalize schema validation failures into consistent structured MCP error responses

## 2. Error Metadata Hardening

- [x] 2.1 Replace raw upstream header passthrough with an allowlisted GraphQL error metadata shape
- [x] 2.2 Add runtime tests covering malformed payload rejection and sanitized structured error responses
