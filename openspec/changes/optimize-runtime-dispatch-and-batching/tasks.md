## 1. Dispatch Registry and Handler Reuse

- [x] 1.1 Replace per-call handler-map construction in `HandlerFactory` with static routing metadata and auth-scoped handler reuse
- [x] 1.2 Add runtime coverage that proves handler resolution remains correct and session-isolated after the dispatch-path optimization

## 2. Bounded Batch Execution

- [x] 2.1 Introduce a shared bounded-concurrency helper and migrate issue bulk update and delete workflows to it
- [x] 2.2 Add handler tests that cover deterministic aggregation and bounded execution behavior for larger batch sizes

## 3. Verification

- [x] 3.1 Run the build, test, and release verification paths after the dispatch and batch changes land
