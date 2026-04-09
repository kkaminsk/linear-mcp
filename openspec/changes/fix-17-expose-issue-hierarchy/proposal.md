## Why

GitHub issue #17 reports that the README claimed parent and child issue support, but MCP clients could not find that capability in the tool schemas they received. The issue hierarchy contract needs to be explicit in schemas, reads, and documentation so clients can rely on it.

## What Changes

- Expose parent-reference support directly in the released issue create and update contract.
- Return parent and child issue references in the canonical issue-detail workflow.
- Update docs and examples so hierarchy support is discoverable without reading implementation code.

## Capabilities

### New Capabilities
- `issue-hierarchy-support`: Support parent and child issue hierarchy through explicit mutation inputs, detail reads, and released documentation.

### Modified Capabilities
- None.

## Impact

- issue create, update, and detail tool schemas
- issue handler mapping for parent and child references
- issue hierarchy tests and README examples
