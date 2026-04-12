## Why

The repository can now contain the right local fixes while the released MCP still breaks the most important issue workflows. Public issue reports and the current CLI repro both show that issue creation and issue search can fail at the MCP boundary even when the intended source-level contract is known.

## What Changes

- Add MCP-boundary smoke coverage for the critical issue workflows: single create, batch create, and free-text issue search.
- Introduce a deterministic test seam so the server can be exercised end-to-end with a fake Linear client instead of real credentials.
- Extend release verification or adjacent runtime validation so stale issue-workflow behavior cannot ship unnoticed.
- Document the critical smoke-tested workflows that must remain operational for released MCP builds.

## Capabilities

### New Capabilities
- `mcp-issue-workflow-smoke-tests`: Verify that the released MCP server preserves critical issue workflow behavior through the tool boundary.

### Modified Capabilities
- None.

## Impact

- `src\index.ts`
- `src\core\handlers\handler.factory.ts`
- issue handlers or shared client wiring used by MCP tool execution
- `src\__tests__\runtime-server.test.ts` and adjacent test utilities
- release verification and README guidance for critical issue workflows
