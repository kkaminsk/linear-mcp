## 1. Transport contract

- [x] 1.1 Add explicit startup configuration for stdio versus supported remote stream transport.
- [x] 1.2 Ensure the active transport mode is surfaced clearly in startup output and runtime capability metadata.

## 2. Remote interoperability

- [x] 2.1 Implement the supported remote stream transport path or explicit stdio-only guardrails for remote connection attempts.
- [x] 2.2 Add interop coverage that exercises the supported remote path and verifies stdio mode does not imply an `/sse` endpoint.

## 3. Documentation

- [x] 3.1 Update README and deployment guidance for non-Cline or ngrok-based clients.
- [x] 3.2 Document which transport modes support streaming-only capabilities and which remain stdio-only.
