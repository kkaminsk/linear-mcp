## Context

The current Linear MCP repository mixes hand-written GraphQL documents with SDK-backed issue workflow helpers. That is workable only if the repository has a clear, enforced boundary for which contract comes from raw GraphQL and which comes from the official SDK. The recent issue-create and issue-search failures show that this boundary drifted: stale array input on `issueCreate` and an invalid `IssueFilter.search` assumption both survived long enough to reach users.

This change needs a design because it spans source files, verification scripts, and developer guidance. The goal is not just to repair one bug; it is to make stale Linear API assumptions fail fast before packaging.

## Goals / Non-Goals

**Goals:**
- Add a repository-level verification step that checks critical issue workflow contracts against the authoritative Linear behavior already established by official docs and SDK usage.
- Keep issue creation and issue search on explicitly approved contract paths.
- Make release verification fail when the repository reintroduces the known-invalid create/search shapes.

**Non-Goals:**
- Run live GraphQL introspection against Linear on every CI or release invocation.
- Replace all raw GraphQL usage in the repository with SDK calls.
- Expand the first audit pass beyond the critical issue create/search workflows.

## Decisions

### 1. Use a local contract audit instead of live network validation

The repository should store a small, explicit set of guarded contract expectations for issue create/search and verify source artifacts against them locally. This keeps release verification deterministic and avoids making CI depend on external network access, credentials, or schema explorer availability.

Live introspection against `api.linear.app` was considered, but rejected because it would make the safety check slower, flakier, and harder to run in contributor environments. The audit should codify the authoritative contracts already confirmed from the official docs and SDK.

### 2. Audit both document shape and helper ownership

The check should not only inspect GraphQL document strings; it should also guard which helper owns each workflow. Single-create and batch-create can be raw GraphQL if their shapes remain correct, while free-text issue search should remain on the SDK path instead of a raw filter helper.

Auditing only document text was considered, but rejected because the search failure came from a stale alternative helper path as much as from a wrong field. The verification needs to protect both the GraphQL contract and the code path selection.

### 3. Integrate the audit into existing release verification

The new audit should run alongside the existing tool-catalog and packaged-install checks so it becomes part of the normal release gate. That keeps the repository’s safety story in one place and avoids another optional script that can be forgotten.

Keeping the audit as a standalone developer-only check was considered, but rejected because the recent regressions were costly precisely because invalid contracts reached released MCP builds.

## Risks / Trade-offs

- **The audit may become stale if Linear changes again** -> Keep the guarded scope small and documented so updates are straightforward when official contracts move.
- **Static checks can miss a runtime-only edge case** -> Pair the contract audit with the existing and proposed MCP-boundary runtime coverage instead of treating it as the only safety net.
- **Too much rigidity could block legitimate refactors** -> Encode behavior-level assertions rather than fragile formatting or file-layout assumptions.

## Migration Plan

1. Add a small authoritative contract-audit source for the issue create/search workflows.
2. Wire the audit into release verification.
3. Update GraphQL helpers and docs to align with the audited contract boundaries.
4. Expand the same pattern to other high-risk Linear workflows only if this first pass proves valuable.

## Open Questions

- Should the contract audit read from a small JSON manifest, code assertions in a script, or a typed helper module shared by tests and release scripts?
- After issue workflows are guarded, which next Linear surfaces are high-risk enough to justify the same treatment?
