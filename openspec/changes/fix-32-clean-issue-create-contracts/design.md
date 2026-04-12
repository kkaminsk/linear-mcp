## Context

The current repository mixes two representations of issue creation. The MCP handlers already distinguish single issue creation from batch issue creation through separate SDK operations, but the lower-level GraphQL helper layer still contains a `CREATE_ISSUES_MUTATION` that sends an array into `issueCreate`, and the bulk-create tests still model a response shape that looks like the wrong mutation. That mismatch mirrors the runtime error seen from the tool surface, where a create path behaved like an array-backed single create instead of a true single-item mutation.

This change needs a design document because it cuts across handlers, GraphQL helpers, project workflows, tests, and release validation. The goal is not only to repair code, but to remove the ambiguity that let single and batch create semantics drift apart.

## Goals / Non-Goals

**Goals:**
- Establish one authoritative contract for `linear_create_issue`, `linear_create_issues`, and project-attached follow-on issue creation.
- Align GraphQL helpers, SDK usage, and tests so single and batch creation cannot silently swap payload shapes.
- Add regression coverage at both helper and tool boundaries so released artifacts preserve the repaired behavior.

**Non-Goals:**
- Redesign issue update, delete, or relation workflows.
- Add unrelated issue fields or change the user-facing response model for successful creates.
- Replace every GraphQL helper with SDK calls if that is unrelated to issue creation parity.

## Decisions

### 1. Treat the SDK-backed tool behavior as the canonical create contract

The handlers already separate single and batch creation using distinct SDK entry points, so the MCP tool surface should keep that distinction as the authoritative contract. Lower-level GraphQL helpers may remain only if they match the same semantics exactly. Keeping parallel raw GraphQL definitions as equally authoritative was considered, but rejected because the observed array-vs-single drift already proves that duplicated contracts do not stay aligned.

### 2. Remove or rewrite ambiguous create helpers and test fixtures

The invalid array-based `issueCreate` mutation and any tests that bless that shape should be removed or rewritten so they reflect the real Linear contract. The preferred approach is to keep one valid single-create definition and one valid batch-create definition, then update project-with-issues flows to reuse the batch helper consistently. Leaving dead helpers in place with comments was considered, but rejected because they continue to mislead future edits and make runtime regressions harder to spot.

### 3. Add tool-boundary regression checks in addition to helper tests

Unit tests at the GraphQL client level are necessary but not sufficient, because the reported break happened at the MCP tool boundary. The change should therefore add handler or runtime-level tests that exercise `linear_create_issue` and `linear_create_issues` as distinct tools and assert they invoke different underlying create contracts. Relying only on helper tests was considered, but rejected because it does not protect the released server behavior clients actually call.

## Risks / Trade-offs

- **More opinionated create layering** -> Keep the tool contract canonical at the handler boundary and allow lower-level helpers only when they preserve the same semantics.
- **Test maintenance overhead** -> Favor a small number of high-signal runtime or handler contract tests over many duplicated mocks.
- **Potential hidden internal callers of stale helpers** -> Search for references before removal and migrate any remaining internal use to the authoritative create helpers.

## Migration Plan

1. Remove or align conflicting single and batch issue-create helpers.
2. Update project-with-issues creation to reuse the same batch contract as `linear_create_issues`.
3. Rewrite tests so they assert the correct payload and response shape for each create path.
4. Add runtime or packaged-server validation for the issue-create tools before release.

## Open Questions

- Is any internal code outside the issue and project handlers still using the raw GraphQL create helpers directly?
- Should packaged-server validation live in the existing runtime transport test suite or a separate release-smoke test?
