## Why

The agent workflow surface is the least-constrained part of the MCP server: it accepts largely freeform payloads and has little direct regression coverage. That makes agent automation brittle and raises the chance of malformed, oversized, or unintended data crossing the MCP boundary unnoticed.

## What Changes

- Narrow agent session and activity contracts where the server can express stable structure.
- Add explicit bounds or validation rules for the remaining flexible payloads such as activity content, metadata, plans, filters, and user state entries.
- Define what agent response fields are safe to echo back to MCP clients.
- Add direct tool-contract and handler tests for agent sessions and activities.

## Capabilities

### New Capabilities
- `agent-workflow-contract-hardening`: agent session and activity tools validate inputs and return intentionally shaped outputs.
- `agent-workflow-regression-coverage`: agent tools have direct contract and handler tests for critical create/get/update flows.

### Modified Capabilities

## Impact

- Affected code: `src/core/types/tool.types.ts`, `src/features/agents/types/agent.types.ts`, `src/features/agents/handlers/agent.handler.ts`, and new/updated tests under `src/__tests__`.
- Affected behavior: malformed or unsafe agent payloads fail earlier and agent responses become more predictable.
