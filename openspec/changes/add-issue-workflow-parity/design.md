## Context

The current issue surface covers create, batch create, batch update, filtered search, and delete, but it does not provide a detailed issue read or many of the planning fields supported by modern Linear issue mutations. Labels and workflow states are only exposed indirectly through team reads, issue relations are not first-class, and cycles are missing entirely.

This proposal assumes the platform-fidelity work lands first so schema contracts, search semantics, and structured outputs are already stable.

## Goals / Non-Goals

**Goals:**
- Add a canonical detailed issue read tool for inspection before mutation.
- Extend issue read and write models with the planning and hierarchy fields agents need for triage and sprint workflows.
- Add explicit workflow state, label, relation, and cycle tools instead of relying on indirect or overloaded responses.
- Keep issue results identifier-rich and structured for machine consumption.

**Non-Goals:**
- Add attachment, standalone project lifecycle, project updates, or advanced integration features.
- Rework OAuth or GraphQL fidelity concerns that belong to the platform-fidelity change.
- Implement every possible issue-adjacent entity in Linear if it is not required for the review's recommended parity set.

## Decisions

### 1. Add `linear_get_issue` as the canonical issue inspection tool

Search results are not a good substitute for detailed inspection because they do not consistently expose hierarchy, relations, milestone associations, or planning context. A dedicated issue read tool should return the detailed issue model that other automations can depend on before deciding what to mutate.

### 2. Extend issue inputs from the current Linear schema instead of ad hoc local fields

The issue create and update contracts should be expanded from the current Linear schema surface rather than by adding custom local arguments case by case. That keeps the code aligned with the SDK baseline refreshed in the platform change and reduces future drift.

### 3. Treat workflow states, labels, relations, and cycles as explicit feature surfaces

These concepts drive real Linear workflows and should not be hidden inside team payloads or overloaded issue fields. The implementation can use new or expanded feature modules, but the MCP surface should make these concepts discoverable as dedicated tools.

### 4. Keep hierarchy and relations distinct

Parent and child issue hierarchy is not the same as broader issue relations such as blocked-by or duplicate. The read model should expose both, and relation mutations should use dedicated tools instead of trying to encode them through parent-child behavior.

### 5. Make cycles part of both read tools and issue operations

Cycle support is only useful if clients can both inspect cycles and use them in issue filtering and mutation flows. The cycle tools should therefore ship together with cycle-aware issue support.

## Risks / Trade-offs

- **Larger issue payloads:** Detailed issue reads can become verbose. Mitigation: keep the full detail in `linear_get_issue` and keep list or search results more focused.
- **Tool surface growth:** Labels, states, relations, and cycles add several tools. Mitigation: keep naming consistent and group them by clear domain concepts.
- **Schema breadth:** The Linear issue schema is broad and can keep evolving. Mitigation: scope this change to the review's recommended planning and triage fields.
- **Cross-module reuse:** Teams, issues, and new cycle logic may share fragments or filters. Mitigation: centralize shared GraphQL fragments and typed connection helpers.

## Migration Plan

1. Add the detailed issue read tool and expand issue type models.
2. Extend issue create, update, list, and search inputs and outputs.
3. Add workflow state and label tools.
4. Add relation tools and relation projection on issue reads.
5. Add cycle tools and cycle-aware issue operations.

## Open Questions

- Should richer description support use markdown strings only, or should it expose document-content fields when Linear supports them?
- Should workflow state listing be team-scoped only, or support a broader discovery mode with optional team filters?
- How much relation detail belongs in list and search results versus the dedicated issue detail tool?
