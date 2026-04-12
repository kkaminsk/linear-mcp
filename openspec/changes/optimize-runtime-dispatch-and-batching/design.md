## Context

The review surfaced two related runtime inefficiencies. First, `HandlerFactory.getHandlerForTool()` rebuilds the full tool-to-handler map and allocates many handler instances for every MCP tool call, even though the routing table is static. Second, issue bulk workflows use unbounded `Promise.all`, which can burst upstream Linear traffic when users submit large batches.

This change crosses core dispatch, auth-aware handler construction, and issue workflow execution. A design is useful because the implementation has to improve performance without breaking auth isolation, MCP response semantics, or existing transport behavior.

## Goals / Non-Goals

**Goals:**
- Replace per-call handler-map construction with a stable dispatch registry.
- Reuse compatible handler instances within the same auth context without leaking across sessions.
- Add bounded concurrency to bulk Linear fan-out workflows, starting with issue update and delete.
- Preserve current MCP tool contracts while making runtime behavior more predictable under load.

**Non-Goals:**
- Redesign the entire feature-handler architecture.
- Add benchmark infrastructure or operator-facing concurrency tuning in this change.
- Change unrelated issue or project tool response shapes beyond what is needed to preserve existing semantics.

## Decisions

### 1. Use a static dispatch registry plus auth-scoped handler caching

The handler routing table should be defined once as metadata instead of recreated for every request. `HandlerFactory` should resolve handler instances from that static registry and cache them per auth context so repeated calls reuse the same compatible feature handler instead of rebuilding the entire map.

**Alternatives considered**
- Keep building the map per call: rejected because the tool surface is already large and the cost scales with every invocation.
- Reuse one global handler instance for all requests: rejected because stream transport requires strict session-scoped auth isolation.

### 2. Introduce one shared bounded-concurrency helper for fan-out workflows

The server should use one shared helper for batch workflows that execute many upstream operations independently. That helper should cap concurrent in-flight operations while preserving input order for collected results and allowing callers to choose whether failures are settled or thrown.

**Alternatives considered**
- Leave `Promise.all` in place and only document the risk: rejected because it does not reduce rate-limit pressure.
- Make all batch work sequential: rejected because it sacrifices too much throughput for moderate batch sizes.

### 3. Preserve handler and MCP response semantics while changing execution strategy

This change should improve how work is scheduled and resolved, not redefine the public response model. Handlers that currently surface per-item failures, such as bulk delete, should keep doing so. Handlers that currently behave as a single workflow may continue to fail as a workflow, but they should execute through the bounded helper internally.

**Alternatives considered**
- Use the performance change to redesign all batch responses: rejected because that broadens scope and makes the proposal harder to implement safely.

## Risks / Trade-offs

- **[Handler caching could leak auth across sessions]** -> Scope handler reuse to the current `LinearAuth` instance and keep stream sessions isolated.
- **[Concurrency limits can reduce peak throughput]** -> Use a modest default cap that avoids bursts while still allowing parallelism.
- **[A shared helper can hide workflow-specific semantics]** -> Keep the helper low-level and let each handler choose ordered aggregation versus per-item settled outcomes.

## Migration Plan

1. Replace ad hoc handler-map construction with a static registry and auth-scoped handler cache.
2. Add a shared bounded-concurrency helper and migrate bulk issue update and delete to it.
3. Add targeted runtime and issue-handler tests that lock in registry stability, auth isolation, and bounded execution behavior.
4. Expand the helper to other fan-out workflows only after the first handlers are verified.

## Open Questions

- Should the bounded concurrency limit remain an internal constant for now, or is there a compelling operator use case for making it configurable later?
