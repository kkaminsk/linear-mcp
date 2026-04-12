## Why

The runtime spends avoidable work on every MCP tool call by rebuilding a full handler map and creating many short-lived handler instances in `HandlerFactory`. Bulk issue workflows also fan out with unbounded `Promise.all`, which raises the risk of bursty upstream traffic and unnecessary Linear rate-limit pressure as request sizes grow.

## What Changes

- Replace per-call handler map construction with a precomputed dispatch registry and stable handler resolution for each auth context.
- Add bounded concurrency for bulk issue workflows that fan out to Linear one item at a time, starting with issue update and delete paths.
- Preserve current MCP response shapes while making bulk workflow execution more predictable under larger input sets.
- Add focused tests that lock in dispatch-path behavior and concurrency limits so performance regressions do not drift back in silently.

## Capabilities

### New Capabilities
- `runtime-dispatch-efficiency`: MCP tool dispatch resolves handlers from a precomputed registry instead of rebuilding the full tool map on every invocation.
- `bounded-batch-concurrency`: bulk Linear workflows execute within a documented concurrency limit instead of issuing unbounded parallel upstream requests.

### Modified Capabilities

## Impact

- Affected code: `src\core\handlers\handler.factory.ts`, `src\index.ts`, `src\features\issues\handlers\issue.handler.ts`, and any shared helper introduced for bounded concurrency.
- Affected behavior: dispatch overhead becomes stable per request, and large bulk issue operations become less bursty against Linear.
- Affected verification: runtime and issue handler tests should assert handler reuse or registry stability and bounded bulk execution behavior.
