## Why

GitHub issue #20 shows users attempting to connect through an `/sse` endpoint and timing out because the server's transport story is ambiguous. The project needs an explicit interoperability contract for stdio versus remote streaming so non-Cline clients do not have to guess.

## What Changes

- Add a clear transport contract for local stdio usage and remote streaming deployments.
- Provide a supported remote streaming entrypoint or fail-fast behavior when the server is running in stdio-only mode.
- Align runtime capability advertisement and documentation with the active transport so clients know whether remote connections are supported.

## Capabilities

### New Capabilities
- `remote-stream-transport-support`: Support a documented remote streaming transport mode and keep capability advertisement aligned with the active transport.

### Modified Capabilities
- None.

## Impact

- `src\index.ts`
- runtime capability detection and subscription gating
- deployment and interoperability documentation for non-stdio clients
- transport and interop tests
