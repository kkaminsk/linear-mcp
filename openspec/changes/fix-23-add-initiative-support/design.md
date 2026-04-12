## Context

The source tree already contains initiative CRUD handlers, but issue #23 asks for a fuller workflow that is useful in practice and contribution-ready. The most obvious remaining gap is project association: the current portfolio and project surfaces do not expose an initiative link that teams can manage through the MCP server.

## Goals / Non-Goals

**Goals:**
- Let project workflows set, change, and clear initiative associations.
- Return enough initiative and project metadata for clients to inspect the link after mutation.
- Document and test the initiative surface so users can rely on what is actually shipped.

**Non-Goals:**
- Expand unrelated customer or agent capabilities.
- Rebuild project lifecycle logic that is not affected by initiative association.
- Depend on informal contribution guidance outside the repository docs.

## Decisions

### 1. Keep initiative CRUD in the portfolio domain and association in project flows

Initiatives are portfolio entities, but the association is exercised through project creation and update flows. The implementation should therefore keep initiative lifecycle handlers in `features\portfolio` while extending project inputs and mapping for the association itself.

### 2. Return linked initiative metadata in project-oriented reads

A project mutation that sets or clears an initiative should return the resulting initiative linkage in the structured project payload. That makes the workflow inspectable without forcing a second round-trip for every mutation.

### 3. Treat documentation and tests as part of the capability

This issue exists partly because users need confidence about what is supported and worth upstreaming. The initiative capability should therefore include contract tests and released documentation instead of leaving that work as optional cleanup.

## Risks / Trade-offs

- **Cross-domain touch points:** Portfolio and project handlers both need updates. -> **Mitigation:** keep the association field mapping small and shared.
- **Linear model variance:** Initiative linkage may have workspace-specific limits. -> **Mitigation:** scope the first pass to the supported project association shape available in the SDK or GraphQL schema.
- **Surface drift:** Source support without released docs can recreate the same issue later. -> **Mitigation:** tie tests and docs to the shipped catalog.

## Migration Plan

1. Extend project inputs and project mapping with initiative association support.
2. Reuse existing initiative handlers for linked reads where needed.
3. Add tests for association set, change, and clear workflows.
4. Update README and contribution-facing docs to describe the released initiative support.

## Open Questions

- Should list-project responses always include linked initiative summary data, or only project-detail and mutation responses?
- Is project-association support sufficient for the first pass, or are initiative-specific search filters also needed immediately?
