## Why

The running Linear MCP server does not currently tell clients which packaged build they are talking to: `src/index.ts` hardcodes `0.1.0`, `linear_get_capabilities` omits package version metadata, and startup logs do not identify the build. That made it difficult to distinguish fixed local source from a stale deployed server while troubleshooting the broken issue-create tools.

## What Changes

- Derive the server identity and version from the packaged build instead of hardcoded literals.
- Expose server build provenance through `linear_get_capabilities` and startup diagnostics, including package name, package version, and optional commit metadata when available.
- Add release verification that checks the built and packaged server report the expected build provenance.
- Document how operators can inspect server provenance when troubleshooting runtime drift.

## Capabilities

### New Capabilities
- `server-build-provenance`: Report the packaged server identity and version through runtime capability discovery and release-safe diagnostics.

### Modified Capabilities
- None.

## Impact

- `src\core\capabilities.ts`
- `src\features\subscriptions\handlers\subscription.handler.ts`
- `src\index.ts`
- `src\__tests__\capabilities.test.ts`
- `src\__tests__\runtime-server.test.ts`
- `scripts\release-utils.mjs`
- `scripts\verify-tool-catalog.mjs`
- `scripts\verify-packaged-install.mjs`
- `README.md`
