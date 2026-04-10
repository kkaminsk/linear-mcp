## 1. Project-With-Issues Reliability

- [x] 1.1 Consolidate project-with-issues orchestration and require a successful project result with a concrete `projectId` before issue creation
- [x] 1.2 Implement compensation or explicit partial-state reporting for issue-batch failure and add focused project workflow tests

## 2. Bulk Delete and Filter Determinism

- [x] 2.1 Verify the Linear bulk-delete contract, repair the client mutation/helper, and wire the MCP handler to the verified path or a per-ID settled result shape
- [x] 2.2 Reject conflicting `stateId` and `states` filters in issue list/search flows and cover the behavior in regression tests
