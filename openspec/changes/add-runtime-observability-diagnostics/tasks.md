## 1. MCP Request Telemetry

- [x] 1.1 Add structured stderr telemetry at the MCP boundary with tool name, transport, duration, outcome, and sanitized upstream identifiers
- [x] 1.2 Add runtime tests that lock in telemetry shape and sanitization for both success and failure paths

## 2. Runtime Diagnostics Surface

- [x] 2.1 Add a read-only runtime diagnostics tool and wire low-cardinality counters plus active session tracking into the runtime
- [x] 2.2 Add focused tests that verify diagnostics stay transport-aware, useful for troubleshooting, and free of secrets

## 3. Troubleshooting Guidance

- [x] 3.1 Update README and adjacent troubleshooting guidance to explain how to use capabilities, telemetry, and runtime diagnostics together
