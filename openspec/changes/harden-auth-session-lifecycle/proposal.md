## Why

The MCP server's auth lifecycle currently has two security gaps: OAuth state is weak and not always consumed after a callback attempt, and stream transport shares one mutable auth context across all clients. These behaviors undermine the server's security boundary right where remote clients and OAuth flows intersect.

## What Changes

- Replace the current OAuth state generator with a cryptographically secure primitive.
- Make OAuth callback state single-use even when token exchange fails.
- Isolate auth configuration, pending OAuth state, and active Linear credentials per MCP stream session instead of per server process.
- Clarify stream-mode auth behavior in runtime responses and documentation where session-scoped auth is required.

## Capabilities

### New Capabilities
- `oauth-state-hardening`: secure OAuth state generation and strict single-use callback handling.
- `session-scoped-auth-context`: isolate auth lifecycle state for each MCP stream session.

### Modified Capabilities

## Impact

- Affected code: `src/auth.ts`, `src/index.ts`, `src/features/auth/handlers/auth.handler.ts`, runtime capability reporting, and auth/session tests.
- Affected behavior: stream transport auth becomes session-scoped instead of process-scoped.
- Affected documentation: README transport and OAuth guidance.
