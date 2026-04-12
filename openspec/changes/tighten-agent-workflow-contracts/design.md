## Context

The agent workflow tools currently accept several mostly freeform objects and have little direct handler or contract coverage compared with the rest of the MCP surface. That is risky because agent payloads are one of the easiest places for malformed, oversized, or unintended data to cross the boundary between the MCP client and the Linear API.

## Goals / Non-Goals

**Goals:**
- Make agent input contracts more explicit where the server owns stable structure.
- Add bounded validation for the remaining flexible objects.
- Return intentionally shaped agent response fields.
- Add direct regression coverage for the agent tool surface.

**Non-Goals:**
- Eliminate every flexible field from the Linear agent API surface.
- Redesign the underlying Linear agent model.
- Add new agent product features unrelated to contract hardening.

## Decisions

### 1. Use a two-tier contract for agent payloads
Server-owned structures such as top-level tool arguments, external URL entries, and any stable wrapper fields should use explicit schemas. Truly provider-owned opaque objects such as activity content or metadata may remain objects, but they should be validated for type, size, and complexity bounds before being forwarded.

**Alternatives considered**
- Keep all freeform objects unbounded: rejected because it preserves the current risk.
- Fully schema every nested agent object: rejected because the upstream payload shape may intentionally remain flexible.

### 2. Shape agent responses intentionally
Agent handlers should return only documented safe fields rather than echoing arbitrary upstream structures by default. Flexible nested fields that remain exposed should be explicitly chosen and bounded.

**Alternatives considered**
- Mirror upstream responses wholesale: rejected because it couples clients to internal upstream details and increases leakage risk.

### 3. Treat agent regression coverage as part of the contract
Because the agent surface is both flexible and lightly tested today, direct tool-contract and handler tests are part of the change rather than an optional implementation detail.

**Alternatives considered**
- Rely on generic tool-contract tests only: rejected because they do not currently exercise handler behavior or flexible payload edge cases.

## Risks / Trade-offs

- **[Tighter validation may reject payloads that passed before]** -> Keep explicit bounds and document them so callers can adapt predictably.
- **[Opaque upstream payloads may evolve]** -> Preserve bounded passthrough objects only where strict schemas would create brittle coupling.
- **[More tests increase maintenance]** -> Limit the suite to critical create/get/update/list flows and validation boundaries.

## Migration Plan

1. Narrow the explicit schemas for agent tools where structure is stable.
2. Add shared validation helpers for bounded freeform agent objects.
3. Update response shaping for session and activity handlers.
4. Add direct contract and handler coverage for the agent tool surface.

## Open Questions

- Which agent response fields must remain fully transparent to MCP clients for compatibility, and which can be reduced to safe summaries without breaking existing usage?
