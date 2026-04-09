## Context

The current repository includes comment handlers and richer issue-update inputs in source, but issue #31 shows that at least one client distribution still exposed an older tool surface. The real compatibility boundary is therefore the built artifact clients install, not the TypeScript sources alone.

## Goals / Non-Goals

**Goals:**
- Make the advertised tool catalog deterministic and testable from the built server artifact.
- Ensure shipped clients can discover the supported comment workflows and issue-update path.
- Keep docs and release artifacts synchronized when the tool surface changes.

**Non-Goals:**
- Add unrelated new domains or redesign the full release process.
- Depend on manual spot checks to detect stale published surfaces.
- Solve marketplace packaging concerns that belong to the marketplace-installation change.

## Decisions

### 1. Validate tool advertisement from the built server boundary

The change should verify the `ListTools` response produced by the built executable or packaged artifact, not only exported schema objects in source. That is the surface clients actually consume, so release validation must happen there.

### 2. Treat tool availability as versioned compatibility

When new tools become available, the README and release notes should describe the minimum released version that contains them. This avoids a repo-versus-package split where users see capabilities in GitHub before they are actually installable.

### 3. Make the supported issue-update path explicit

Clients should not need to infer single-issue mutation support from a source fragment. The released catalog and docs should clearly identify the supported issue-update path for one existing issue, whether that remains `linear_bulk_update_issues` or is complemented by a dedicated alias.

## Risks / Trade-offs

- **Broader release checks:** Build verification adds CI and release work. -> **Mitigation:** keep the check lightweight and focused on the MCP `ListTools` contract.
- **Compatibility choices:** Clarifying the issue-update path may require aliasing or renaming. -> **Mitigation:** preserve backward compatibility where possible and document the preferred path.
- **Distribution lag:** Some channels may publish more slowly than GitHub changes land. -> **Mitigation:** tie released documentation to shipped versions rather than main-branch assumptions.

## Migration Plan

1. Add a tool-catalog smoke test against the built server boundary.
2. Align the shipped catalog with the supported comment and issue-update workflows.
3. Update docs and release notes to state when the expanded surface is available.
4. Publish and verify the updated distribution channels.

## Open Questions

- Should the explicit single-issue update path be a dedicated tool name or a documented alias of the batch update flow?
- Which distribution channels need automated catalog verification first?
