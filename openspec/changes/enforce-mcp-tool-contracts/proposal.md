## Why

The server advertises strict tool schemas but does not enforce them at the MCP boundary, leaving bulk, nested, and freeform payloads to fail deep inside handlers or the Linear SDK. The same boundary also returns more upstream error metadata than most clients need, which weakens the server's reliability and security posture.

## What Changes

- Enforce advertised JSON Schema contracts before dispatching tool calls to handlers.
- Normalize validation failures into consistent MCP error responses.
- Limit structured GraphQL error payloads to safe, intentional metadata instead of forwarding all upstream headers.
- Add regression coverage proving that schema contracts are enforced at runtime, not only declared in tool metadata.

## Capabilities

### New Capabilities
- `runtime-tool-input-validation`: validate MCP tool arguments against the advertised input schemas before handler dispatch.
- `sanitized-error-metadata`: expose only approved upstream error metadata to MCP clients.

### Modified Capabilities

## Impact

- Affected code: `src/index.ts`, `src/core/types/tool.types.ts`, `src/core/handlers/base.handler.ts`, and related tests.
- Affected behavior: invalid tool payloads fail fast with deterministic MCP validation errors.
- Affected clients: MCP clients may now receive earlier validation failures for malformed requests.
