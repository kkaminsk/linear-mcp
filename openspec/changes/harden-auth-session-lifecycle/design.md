## Context

The current auth lifecycle is implemented through a mutable `LinearAuth` instance that stores OAuth configuration, pending callback state, token data, and the active Linear client. That model is acceptable for stdio's single-client runtime, but stream transport creates multiple remote sessions while still sharing the same auth object. The same auth lifecycle also uses a weak OAuth state generator and only clears matched state after a successful token exchange.

## Goals / Non-Goals

**Goals:**
- Use a cryptographically strong OAuth state primitive.
- Make pending OAuth state single-use on every matched callback attempt.
- Isolate mutable auth state per MCP stream session.
- Preserve the existing stdio and API-key workflows.

**Non-Goals:**
- Persist auth state across process restarts.
- Introduce a new auth provider or credential store.
- Redesign the Linear OAuth flow beyond session isolation and state hardening.

## Decisions

### 1. Use a cryptographically secure state generator
Use Node crypto to generate OAuth state values instead of `Math.random()`. `randomBytes(...).toString('base64url')` is preferred over a shorter UUID because it is purpose-built for bearer-style state tokens and avoids predictable output.

**Alternatives considered**
- `randomUUID()`: acceptable, but less explicit about state-token entropy and formatting.
- Keep `Math.random()`: rejected because it is not a CSPRNG.

### 2. Consume pending state before the token exchange can be retried
Once a callback presents the expected pending state, remove that state from the auth context before or during the first exchange attempt so the same state cannot be replayed after a failed exchange.

**Alternatives considered**
- Clear state only on successful exchange: rejected because it violates the documented single-use contract.
- Clear state only in a `finally` block after the exchange: acceptable, but consuming state immediately after a successful match makes replay behavior simpler and easier to reason about.

### 3. Resolve auth through a session-scoped auth context in stream mode
Introduce an auth-context layer that distinguishes stdio from stream transport. In stdio, the server can keep a single local auth context. In stream mode, the server shall resolve auth state from the MCP session identifier so pending OAuth state, tokens, and client configuration are isolated per remote session.

**Alternatives considered**
- Keep one shared `LinearAuth` and document the limitation: rejected because remote stream access is already documented and a shared auth context is unsafe.
- Create a fresh handler factory per request: viable, but the important design change is session-scoped auth resolution rather than the factory lifecycle itself.

### 4. Fail closed if stream-session auth binding is unavailable
If the MCP runtime cannot provide a stable per-session identifier at the request boundary, stream-mode OAuth should fail closed rather than silently falling back to a shared auth context.

**Alternatives considered**
- Silent fallback to process-global auth: rejected because it recreates the original race and session-mixing problem.

## Risks / Trade-offs

- **[Session metadata availability]** -> If the SDK does not expose a stable stream-session identifier at the handler boundary, the implementation will need a small auth-context abstraction or a stream-mode restriction for OAuth until that metadata is available.
- **[Behavior divergence between stdio and stream]** -> Keep the difference explicit in code, tests, and docs so clients understand why stream mode requires session-scoped auth.
- **[More auth lifecycle tests]** -> The surface area increases slightly, but the risk is mitigated by adding direct tests for replay, failed exchange, and concurrent stream-session behavior.

## Migration Plan

1. Introduce the session-aware auth context abstraction.
2. Switch OAuth state generation and consumption to the hardened flow.
3. Update stream-mode auth handling and documentation together.
4. Add auth/session regression tests before enabling the new behavior by default.

## Open Questions

- Should API-key auth in stream mode be duplicated into each session context automatically, or treated as a global read-only default that OAuth can override per session?
