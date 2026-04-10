## Context

The MCP server exposes tool schemas through `tool.types.ts`, but the runtime dispatch path does not validate incoming arguments against those schemas before handing them to feature handlers. That leaves the server relying on top-level required-field checks and downstream Linear SDK failures. The same execution boundary returns raw upstream headers in structured GraphQL error payloads, which is more exposure than most MCP clients need.

## Goals / Non-Goals

**Goals:**
- Enforce advertised tool schemas at runtime before handler dispatch.
- Return deterministic, machine-readable validation failures.
- Sanitize structured GraphQL error metadata.
- Keep handler-specific invariant checks where they still add value.

**Non-Goals:**
- Rewrite every handler around a new validation framework.
- Remove all useful upstream diagnostics from error responses.
- Redesign tool schemas beyond what is needed for enforceable runtime behavior.

## Decisions

### 1. Use the advertised tool schema map as the single validation source of truth
Compile validators from the same schema objects already used for `ListTools` so the server cannot drift between what it advertises and what it enforces. Validation will happen in the `CallTool` path before a handler method is invoked.

**Alternatives considered**
- Keep manual per-handler validation: rejected because it has already drifted from the advertised contracts.
- Create a second set of runtime-only schemas: rejected because dual sources of truth are likely to drift.

### 2. Fail fast with structured validation errors
Schema violations should produce consistent MCP error responses that identify the offending field or rule. Handlers should then treat `validateRequiredParams` as a local invariant check rather than the primary contract guard.

**Alternatives considered**
- Let invalid payloads flow into the SDK: rejected because it produces inconsistent and less actionable failures.

### 3. Sanitize GraphQL error metadata with an allowlist
Structured GraphQL errors should preserve useful diagnostics such as status, retryability, normalized GraphQL errors, and possibly a small correlation identifier, but should not forward raw upstream headers wholesale.

**Alternatives considered**
- Return all headers as today: rejected because it leaks unnecessary transport metadata.
- Remove all upstream metadata: rejected because callers still need enough detail to reason about retryability and request failures.

## Risks / Trade-offs

- **[Stricter runtime validation can break permissive clients]** -> Document the change and align validation errors with the advertised schemas so the break is deterministic and correct.
- **[Schema compilation adds startup/runtime complexity]** -> Compile validators once and reuse them rather than validating ad hoc in each handler.
- **[Allowlisting metadata can hide a useful header]** -> Start with a minimal allowlist and expand only when a concrete client need exists.

## Migration Plan

1. Add schema compilation and runtime validation at the MCP boundary.
2. Update error serialization to remove raw headers and keep approved fields only.
3. Extend tests to cover runtime validation and error sanitization.
4. Update any docs or client notes that depended on permissive runtime behavior.

## Open Questions

- Should validation failures be returned as MCP `InvalidParams` errors only, or always as structured tool errors to match the existing response style?
