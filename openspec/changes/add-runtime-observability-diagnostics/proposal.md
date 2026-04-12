## Why

The server has strong startup diagnostics and structured failure payloads, but it still offers little visibility into live request behavior once the process is running. Without structured per-tool telemetry or a lightweight runtime diagnostics surface, troubleshooting latency spikes, rate limits, auth refresh problems, and session growth is slower than it needs to be.

## What Changes

- Add structured MCP-boundary request telemetry with tool name, transport, duration, outcome, and sanitized upstream request identifiers when available.
- Add a lightweight runtime diagnostics surface for live operational state, including transport, auth scope or mode, session counts, and recent failure counters that help troubleshoot without attaching a debugger.
- Document how operators use startup provenance, `linear_get_capabilities`, structured request logs, and runtime diagnostics together when troubleshooting.
- Add focused tests that verify diagnostics stay sanitized and telemetry remains stable across stdio and stream runtimes.

## Capabilities

### New Capabilities
- `mcp-request-telemetry`: the server emits structured, sanitized per-tool telemetry for request execution and failure analysis.
- `runtime-operational-diagnostics`: operators can query lightweight live diagnostics for server health and troubleshooting signals without exposing secrets.

### Modified Capabilities

## Impact

- Affected code: `src\index.ts`, `src\features\subscriptions\handlers\subscription.handler.ts`, any new diagnostics handler or tool schema, and runtime support code that tracks counters or session metrics.
- Affected behavior: operators gain consistent logs and a live diagnostics surface for troubleshooting without changing core tool semantics.
- Affected verification: runtime tests and packaged-install guidance should cover diagnostics output, sanitization, and transport-aware behavior.
