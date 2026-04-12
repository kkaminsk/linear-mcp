## Context

The current server entrypoint only starts `StdioServerTransport`, but users are still trying to connect to a remote `/sse` endpoint. That mismatch creates timeouts and confusion about whether the project is stdio-only, Cline-only, or generally usable with other MCP clients.

## Goals / Non-Goals

**Goals:**
- Make the supported transport modes explicit and machine-discernible.
- Support a documented remote streaming deployment path or fail fast when only stdio is available.
- Keep capability advertisement consistent with the active transport.

**Non-Goals:**
- Build arbitrary hosting infrastructure inside the repository.
- Add unrelated feature breadth beyond transport interoperability.
- Pretend that stdio deployments expose a remote endpoint when they do not.

## Decisions

### 1. Choose transport mode explicitly at startup

The server should start in an explicit transport mode rather than implying that stream-capable runtime flags automatically create a remote endpoint. That keeps startup behavior aligned with the actual transport implementation.

### 2. Keep stdio as the default and remote stream as opt-in

Local stdio execution is still the safest default for current usage, but remote clients need a supported path when stream mode is intentionally enabled. Making remote transport opt-in avoids accidental exposure while still enabling interoperability.

### 3. Reflect transport truth in capabilities and docs

The runtime capability surface, startup messaging, and docs should all agree on whether remote streaming is supported. A client should never infer `/sse` support from a capability flag that does not correspond to an active server transport.

### 4. Fail fast on unsupported remote assumptions

If the server is running in stdio-only mode, the docs and runtime behavior should make that obvious immediately rather than letting clients hang on a guessed endpoint.

## Risks / Trade-offs

- **Additional server complexity:** Remote transport introduces more startup and test paths. -> **Mitigation:** keep the transport abstraction narrow and default to stdio.
- **Security exposure:** Remote endpoints can be exposed accidentally. -> **Mitigation:** require explicit configuration and document deployment expectations.
- **Interop variance:** Different MCP clients may expect different stream flavors. -> **Mitigation:** target one documented MCP-compatible remote transport and test it directly.

## Migration Plan

1. Introduce explicit transport selection at startup.
2. Add the supported remote stream implementation or explicit stdio-only guardrails.
3. Align capability advertisement with the active transport.
4. Update docs with remote-client setup and stdio-only guidance.

## Open Questions

- Which MCP remote transport should be the first supported network mode for this repository?
- Should remote transport live in the main entrypoint or in a separate bootstrap command?
