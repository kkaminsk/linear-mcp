## Context

The current OAuth helper still carries parameters that do not match Linear's supported authorization flow, and the single-use state requirement is not obvious to callers. Because OAuth is already sensitive to redirect, token, and state mismatches, the contract needs to be precise and well documented.

## Goals / Non-Goals

**Goals:**
- Generate authorization URLs that use only supported Linear OAuth parameters.
- Keep callback-state validation strict and single-use.
- Make the auth tool outputs and docs clear enough that clients do not reuse stale links accidentally.

**Non-Goals:**
- Introduce persistent credential storage or long-lived session recovery.
- Add browser hosting or redirect infrastructure inside this repository.
- Change the API-key auth path.

## Decisions

### 1. Restrict the authorization URL to documented Linear parameters

The authorization URL should include only the parameters Linear expects for app-based OAuth. Unsupported scope fragments and offline-only parameters should be removed rather than left in place as harmless-looking extras.

### 2. Keep state validation strict and single-use

The issued OAuth state should remain bound to a single pending authorization request and be cleared after successful exchange. Reuse and mismatch should continue to fail, but the error and docs should make that behavior explicit.

### 3. Surface callback requirements directly in the auth workflow

The `linear_auth` response and documentation should tell clients that both `code` and the freshly issued `state` must be supplied to `linear_auth_callback`. That reduces confusion when a caller copies an old URL or omits the state value.

## Risks / Trade-offs

- **Client expectation changes:** Some callers may have built around the old URL shape. -> **Mitigation:** document the corrected contract clearly and keep the tool names stable.
- **State lifecycle strictness:** One-time state makes retries more explicit but less forgiving. -> **Mitigation:** make the retry path obvious by issuing a fresh authorization URL.
- **OAuth surface complexity:** The flow remains sensitive to redirect and credential setup. -> **Mitigation:** separate configuration guidance from runtime error reporting.

## Migration Plan

1. Correct the OAuth URL parameter set.
2. Keep callback validation strict while clarifying the state lifecycle.
3. Add tests for URL generation and reused-state rejection.
4. Refresh README and auth guidance with the corrected flow.

## Open Questions

- Should the auth response include a short reminder that the authorization URL is single-use?
- Do any existing helper scripts need output changes to surface the returned state more clearly?
