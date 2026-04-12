## Context

The repository builds and runs locally, but the current package metadata and install story are thin for marketplace distribution. If the packaged artifact is missing executable wiring, build outputs, or clear startup errors, users see a generic marketplace failure instead of an actionable message.

## Goals / Non-Goals

**Goals:**
- Make the packaged server installable and bootable from marketplace distribution.
- Verify the packaged artifact can start and answer the MCP tool-list handshake after a fresh install.
- Distinguish packaging failures from normal auth or environment setup errors.

**Non-Goals:**
- Redesign the full release infrastructure beyond what marketplace compatibility needs.
- Embed secrets or default credentials in the package.
- Replace runtime auth validation with install-time assumptions.

## Decisions

### 1. Treat the published package as the artifact under test

Marketplace users consume the packaged artifact, not the local repository checkout. Compatibility checks should therefore run against the built package shape that is actually published.

### 2. Ship explicit executable metadata and required build assets

The package should declare the executable entrypoint and include every asset required to start the server after installation. Marketplace installation should not depend on a post-install build step or an implicit local repository layout.

### 3. Separate install failures from setup guidance

A package that starts successfully but lacks `LINEAR_API_KEY` or OAuth input should return a clear setup error, not a generic crash that looks like an installation failure. Clear diagnostics reduce false marketplace bug reports and speed up operator setup.

## Risks / Trade-offs

- **Packaging drift:** Local builds may keep working while published packages regress. -> **Mitigation:** add fresh-install smoke tests against the packaged artifact.
- **Bigger release surface:** Packaging metadata changes can affect existing install flows. -> **Mitigation:** keep entrypoint changes backward compatible where possible.
- **Diagnostic noise:** More startup guidance can clutter logs. -> **Mitigation:** keep diagnostics concise and reserve detail for actual setup failures.

## Migration Plan

1. Add executable packaging metadata and include required build assets.
2. Add a fresh-install smoke test for the packaged distribution.
3. Improve startup error messages for missing auth or setup input.
4. Update marketplace-facing install guidance.

## Open Questions

- Which marketplace packaging assumptions need explicit automated coverage beyond a simple start-and-list-tools smoke test?
- Should install guidance live only in the README, or also in package metadata and startup output?
