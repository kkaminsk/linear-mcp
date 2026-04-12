## Why

GitHub issue #31 reports that MCP clients cannot see comment tools or a practical issue-update path even though the repository source and README advertise those workflows. The project needs a release-safe contract that keeps the published tool catalog, built artifact, and documentation aligned.

## What Changes

- Define the advertised MCP tool catalog as a tested compatibility contract for built and published artifacts.
- Ensure shipped distributions expose the comment lifecycle tools and a documented issue-update mutation path, not just the source tree.
- Add release-time validation and versioned documentation so stale distributions do not silently advertise an older surface.

## Capabilities

### New Capabilities
- `advertised-tool-surface-parity`: Keep the built and published MCP tool catalog aligned with implemented handlers and released documentation.

### Modified Capabilities
- None.

## Impact

- `src\index.ts`
- `src\core\types\tool.types.ts`
- `src\core\handlers\handler.factory.ts`
- packaging, build, and release validation for the distributed server
- README and release documentation for supported tool availability
