## Why

GitHub issue #4 reports a server error when the package is installed through the Cline marketplace. The published package needs marketplace-safe metadata, startup behavior, and diagnostics so installation problems can be distinguished from normal runtime configuration errors.

## What Changes

- Package the server with the executable metadata and built assets required for marketplace installation.
- Add a fresh-install smoke test that validates boot and MCP tool listing from the packaged distribution.
- Improve startup diagnostics so missing auth configuration is reported as setup guidance instead of a generic installation failure.

## Capabilities

### New Capabilities
- `marketplace-installation-compatibility`: Ensure the packaged server installs, boots, and reports setup errors cleanly when distributed through the marketplace.

### Modified Capabilities
- None.

## Impact

- `package.json` and packaging metadata
- build output and publish-time asset selection
- startup diagnostics and install smoke tests
- marketplace-oriented documentation
