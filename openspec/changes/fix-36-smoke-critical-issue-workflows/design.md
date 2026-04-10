## Context

Recent user-visible failures happened at the MCP tool boundary: creating an issue and searching issues both broke in ways that were obvious to clients but not fully prevented by the repository’s local safety checks. The repo now has better local fixes and provenance reporting, but it still lacks a deterministic way to exercise the critical issue workflows through the server boundary without real Linear credentials.

This change needs a design because it likely introduces a test seam in server or handler wiring, plus new runtime coverage that sits between unit tests and real authenticated integration tests. The goal is to catch tool-boundary regressions without relying on live Linear access.

## Goals / Non-Goals

**Goals:**
- Add deterministic MCP-boundary smoke coverage for single issue create, batch issue create, and free-text issue search.
- Make those tests runnable without real Linear credentials or network access.
- Tie the smoke coverage into normal verification so critical issue workflows cannot silently drift again.

**Non-Goals:**
- Add live end-to-end tests against a real Linear workspace.
- Smoke-test every MCP tool in the server.
- Redesign the authentication flow or broader transport model.

## Decisions

### 1. Add a fake-backend test seam instead of live authenticated smoke tests

The MCP server should be runnable in tests with an injected fake Linear backend or factory so the tool boundary can be exercised deterministically. This makes the tests fast, local, and credential-free while still verifying handler routing and tool responses through the real MCP server surface.

Live authenticated smoke tests were considered, but rejected because they would be brittle, secret-dependent, and difficult to require for every release or contributor workflow.

### 2. Focus the first smoke suite on critical issue workflows only

The suite should cover the workflows that are currently proven user pain points: `linear_create_issue`, `linear_create_issues`, and `linear_search_issues`. That gives the repository a high-value safety net without turning the smoke harness into a second full integration suite.

Testing the entire tool catalog was considered, but rejected because it would add too much setup and noise before the harness proves its value on the most failure-prone paths.

### 3. Keep release gating aligned with deterministic smoke behavior

The repository should treat the smoke harness as part of its normal verification story, either within the existing Jest/runtime suites or a release-adjacent script that uses the same fake backend setup. That ensures critical issue workflows are checked through the same MCP entry points that clients use.

Keeping the smoke suite purely optional was considered, but rejected because the current problem is exactly that these workflows can look healthy in source while still failing where users invoke them.

## Risks / Trade-offs

- **Injectable test seams can complicate production wiring** -> Keep the seam narrow and default to the current production construction path.
- **Smoke tests may overlap with unit tests** -> Use them only for behavior that matters specifically at the MCP boundary.
- **A fake backend could miss one real SDK nuance** -> Pair this suite with the contract audit and existing helper-level tests instead of replacing them.

## Migration Plan

1. Introduce a narrow test seam for supplying a fake Linear backend to the MCP server or handler wiring.
2. Add MCP-boundary smoke tests for single create, batch create, and free-text search.
3. Wire the smoke coverage into the normal verification path.
4. Expand coverage only if future regressions justify more boundary-level checks.

## Open Questions

- Should the fake backend be injected at `LinearServer`, `HandlerFactory`, or `LinearGraphQLClient` construction time?
- Is the best release gate a Jest suite, a release helper script, or a combination where release calls the focused Jest smoke suite?
