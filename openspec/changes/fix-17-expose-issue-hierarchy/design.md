## Context

The repository has already moved toward richer issue data, but issue #17 shows that hierarchy support was still not visible to clients in a reliable way. Parent and child issues are a core planning concept and should be represented as an explicit contract rather than as an undocumented field or README claim.

## Goals / Non-Goals

**Goals:**
- Make parent assignment visible in the released issue mutation contract.
- Make hierarchy inspection visible in the canonical issue read contract.
- Keep parent and child hierarchy distinct from broader issue-relation features.

**Non-Goals:**
- Replace or overload generic issue relations such as blocked-by or duplicate.
- Add unrelated cycle, label, or project feature breadth.
- Hide hierarchy support behind implementation-only fields.

## Decisions

### 1. Put hierarchy inputs on the issue mutation contract directly

Clients should be able to see parent-assignment support on the create and update path they already use. That is more discoverable than requiring a separate relation tool or undocumented argument.

### 2. Use issue detail as the canonical hierarchy read

Hierarchy is most useful when clients can inspect both parent and child references on demand. The detailed issue read should therefore carry the authoritative parent and child view, with lighter read surfaces staying focused.

### 3. Keep hierarchy and relations distinct

Parent-child hierarchy is not the same as general issue relations. The implementation and docs should keep those concepts separate so clients do not confuse nesting with relation graphs.

## Risks / Trade-offs

- **Payload growth:** Child references add more data to issue reads. -> **Mitigation:** keep hierarchy detail primarily on the issue-detail tool.
- **Surface overlap:** Hierarchy and relations can look similar in docs. -> **Mitigation:** document the distinction explicitly with examples.
- **Discoverability drift:** Source support without released docs can recreate the same confusion. -> **Mitigation:** update schemas, examples, and tests together.

## Migration Plan

1. Make parent input visible on the released issue mutation path.
2. Return parent and child references from issue-detail reads.
3. Add regression tests for create, update, and read hierarchy workflows.
4. Refresh README examples to show parent and child issue usage.

## Open Questions

- Should list or search results include lightweight parent information, or should hierarchy stay detail-only at first?
- Do clients need an explicit example for reparenting an existing issue in the README?
