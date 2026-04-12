## Why

GitHub issue #23 asks for initiative support that is practical for real planning workflows and contribution-ready for upstreaming. The repository already has basic initiative operations in source, but it still needs a complete, documented workflow that covers project association and released tool-surface expectations.

## What Changes

- Add initiative-to-project association support so project workflows can set, change, and clear an initiative reference.
- Expand initiative and project responses enough to make the association visible in normal planning reads.
- Document and test the initiative surface so the released tool catalog and contribution expectations are clear.

## Capabilities

### New Capabilities
- `initiative-project-association`: Support initiative lifecycle workflows that include project association and released documentation parity.

### Modified Capabilities
- None.

## Impact

- `src\features\portfolio\**`
- `src\features\projects\**`
- `src\core\types\tool.types.ts`
- `src\core\handlers\handler.factory.ts`
- initiative and project tests plus README coverage
