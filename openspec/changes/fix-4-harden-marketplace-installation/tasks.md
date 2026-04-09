## 1. Packaging metadata

- [x] 1.1 Add the executable packaging metadata and publish-time asset list required for marketplace installation.
- [x] 1.2 Ensure the packaged server can start without relying on a local source checkout or post-install build.

## 2. Installation verification

- [x] 2.1 Add a fresh-install smoke test that boots the packaged artifact and requests the MCP tool list.
- [x] 2.2 Verify marketplace installation failures are reproducible in the packaging test harness before release.

## 3. Diagnostics and docs

- [x] 3.1 Improve startup diagnostics so missing auth setup is reported separately from package-install failures.
- [x] 3.2 Update marketplace-facing installation guidance and troubleshooting notes.
