## Why

GitHub issue #24 reports that the generated Linear OAuth URL includes unsupported scope and parameter values, and that stale authorization links lead to confusing state failures. The OAuth flow needs to match Linear's actual contract so remote auth attempts fail only for real user or credential errors.

## What Changes

- Generate Linear-compatible authorization URLs without unsupported `offline_access` scope or `access_type=offline` parameters.
- Preserve callback-state validation while making the state contract explicitly single-use and clearly surfaced to clients.
- Update tests and docs so the OAuth tool pair explains the issued state, callback requirements, and stale-link behavior.

## Capabilities

### New Capabilities
- `linear-oauth-flow-correctness`: Keep OAuth authorization URLs, callback validation, and user guidance aligned with Linear's supported flow.

### Modified Capabilities
- None.

## Impact

- `src\auth.ts`
- OAuth-related handlers and any auth response summaries
- OAuth tests and helper scripts
- README authentication guidance
