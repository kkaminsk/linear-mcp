## Context

The runtime already exposes strong startup provenance and sanitized structured failures, but live troubleshooting still depends on sparse startup logs and ad hoc reproduction. The review identified two missing layers: structured per-request telemetry at the MCP boundary, and a lightweight diagnostics surface that reports live operational state without exposing secrets.

This change crosses request handling, session tracking, handler wiring, tool schemas, and operator documentation. A design is useful because the diagnostics surface should add observability without breaking MCP transports, leaking sensitive data, or turning the server into a verbose logging system by default.

## Goals / Non-Goals

**Goals:**
- Emit structured per-tool request telemetry that is safe for both stdio and stream runtimes.
- Expose a lightweight, read-only runtime diagnostics surface for troubleshooting live health signals.
- Keep diagnostics sanitized so secrets, raw headers, and upstream payload bodies do not leak.
- Document how telemetry, runtime diagnostics, and capability discovery fit together for operator troubleshooting.

**Non-Goals:**
- Build a full metrics backend, tracing pipeline, or external log shipper integration.
- Persist long-term operational history across process restarts.
- Expose secrets, raw request bodies, or sensitive upstream headers through logs or diagnostics.

## Decisions

### 1. Emit structured telemetry at the MCP boundary to stderr

Request telemetry should be produced at the MCP server boundary, where tool name, transport, duration, and final outcome are all known. For stdio compatibility, telemetry should be emitted to stderr in a structured format rather than stdout, which is reserved for MCP protocol traffic.

**Alternatives considered**
- Log inside each individual handler: rejected because it duplicates logic and misses consistent cross-cutting fields such as total duration.
- Emit logs to stdout: rejected because MCP stdio transport depends on stdout remaining protocol-only.

### 2. Add a dedicated read-only diagnostics tool instead of overloading capabilities

Static runtime capabilities and live operational diagnostics solve different problems. The server should keep `linear_get_capabilities` focused on transport and packaged runtime support, and introduce a dedicated diagnostics tool for live state such as active sessions and recent failure counters.

**Alternatives considered**
- Extend `linear_get_capabilities` with live counters: rejected because it mixes static capability discovery with volatile runtime health data.
- Rely on logs alone: rejected because operators also need an on-demand snapshot tool.

### 3. Track low-cardinality in-memory counters and sanitized identifiers only

The diagnostics surface should use in-memory counters and summaries that are cheap to maintain and safe to expose: total requests, error counts, active stream sessions, recent retryable failures, auth refresh failures, and sanitized upstream request IDs when available. It should not retain tokens, auth headers, raw payloads, or unbounded request history.

**Alternatives considered**
- Store full recent request histories: rejected because it increases memory and privacy risk without being necessary for a first troubleshooting surface.

## Risks / Trade-offs

- **[Telemetry adds runtime overhead]** -> Keep fields low-cardinality and compute them once at the boundary.
- **[Diagnostics can leak sensitive data if they mirror raw errors]** -> Reuse the existing sanitization posture and explicitly exclude headers, tokens, and request bodies.
- **[In-memory counters reset on restart]** -> Treat the tool as a live troubleshooting surface, not a persistent audit system.

## Migration Plan

1. Add MCP-boundary telemetry emission with consistent success and failure fields.
2. Introduce a diagnostics feature or handler and wire a read-only diagnostics tool into the runtime.
3. Track low-cardinality counters for requests, failures, retries, auth refresh failures, and active stream sessions.
4. Update tests and README guidance to cover diagnostics behavior and sanitization.

## Open Questions

- Should the first diagnostics response include per-tool counters, or start with aggregated totals plus the most recent failure summaries only?
