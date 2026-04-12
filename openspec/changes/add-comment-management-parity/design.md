## Context

The current comment surface is intentionally small: the server can fetch comments for a specific issue and create a comment or reply, but it does not expose direct comment lookup, workspace comment listing, or the rest of Linear's comment lifecycle mutations. The existing issue-thread query also hard-codes ordering, omits filter support, and formats responses with a bespoke projection that is useful for summaries but not broad enough for general MCP automation.

The public Linear schema and SDK support a wider comment model: direct comment reads, top-level comment collections, issue-scoped comment collections, child-comment traversal, and lifecycle mutations for update, delete, resolve, and unresolve. This design brings the server closer to that public surface while staying aligned with the repository's structured-response conventions and the in-flight platform-fidelity work.

## Goals / Non-Goals

**Goals:**
- Add first-class comment read tools for direct comment lookup and paginated comment collections.
- Expand issue comment reads to support Linear-style pagination, ordering, archived inclusion, and filtering.
- Add comment lifecycle tools for update, delete, resolve, and unresolve operations.
- Standardize structured comment payloads so read and write tools expose stable identifiers, thread metadata, association metadata, and status fields.

**Non-Goals:**
- Add webhook or subscription runtime support for comment changes; that belongs to the advanced integrations change.
- Expose every internal comment field from the public schema if it does not improve MCP workflows.
- Rework unrelated issue, project, or auth surfaces beyond the comment-specific integration points touched by this change.

## Decisions

### 1. Keep the existing issue comment entry point and add complementary comment tools

`linear_get_issue_comments` and `linear_create_comment` already exist in the source tree, so this change should extend that surface rather than replace it. The server should add direct and collection-oriented tools such as `linear_get_comment`, `linear_list_comments`, `linear_update_comment`, `linear_delete_comment`, `linear_resolve_comment`, and `linear_unresolve_comment` so clients can work with comments as first-class entities without overloading issue reads.

This keeps the tool catalog additive and discoverable. Existing issue-thread callers continue to work, while new comment-centric automations can use dedicated tools with clearer semantics.

### 2. Introduce a shared comment projection instead of bespoke handler formatting

The current issue comment handler shapes response data inline and truncates parts of the thread for readability. That is fine for a narrow display-oriented tool, but it becomes hard to extend once comment reads and writes must return consistent fields across multiple tools.

The implementation should introduce a shared comment-mapping layer in the comment feature or GraphQL client boundary. All comment tools should compose that shared projection so identifiers, timestamps, author data, parent linkage, resolution metadata, URL, and association identifiers stay consistent across reads and writes.

### 3. Use Markdown `body` as the primary public content contract

Linear's public docs treat Markdown body content as the portable contract for comments, while `bodyData` is exposed in the schema as an internal ProseMirror representation. The server should therefore make `body` the primary documented field for read and write workflows, while still allowing optional `bodyData` pass-through for advanced callers when the underlying API supports it.

This keeps the public MCP contract understandable and stable without blocking richer editor-aware integrations later.

### 4. Preserve Linear collection semantics instead of inventing comment-specific pagination behavior

Comment collections should follow the same control surface Linear already uses: `first`, `after`, `last`, `before`, `filter`, `includeArchived`, and `orderBy`. The issue-thread read tool should be expanded to accept those arguments, and the new top-level comment list tool should expose the same semantics.

Using the native collection contract avoids surprising edge cases and makes it easier for MCP clients to reason about archived comments, filtered comment sets, and continuation cursors.

### 5. Keep deep thread traversal explicit

Issue-level comment tools should return the current page of comments with stable thread metadata, but they should not hide arbitrary child-comment truncation behind a display-oriented formatter. Deeper traversal should be explicit through direct comment reads with child pagination or through filtered collection reads keyed by parent comment context.

This reduces ambiguity about whether reply sets are complete and avoids silently dropping thread detail behind a fixed `children(first: 10)` preview.

## Risks / Trade-offs

- **Broader tool surface:** Adding multiple comment tools increases discovery surface. → **Mitigation:** keep names consistent with the rest of the server and group them under the comment domain.
- **Payload growth:** Richer comment metadata can make read responses larger. → **Mitigation:** keep list payloads structured but focused, and reserve deeper thread traversal for direct comment reads.
- **`bodyData` ambiguity:** The public schema exposes `bodyData`, but it is not the best default contract for most clients. → **Mitigation:** document `body` as primary and treat `bodyData` as optional advanced input or output.
- **Filter-schema breadth:** Linear comment filters are broad and can be difficult to model exhaustively in strict MCP schemas. → **Mitigation:** use the repository's existing typed loose-object pattern for advanced filter pass-through where appropriate, with docs and tests around supported shapes.

## Migration Plan

1. Add shared GraphQL queries and mutations for direct comment reads, top-level comment listing, update, delete, resolve, and unresolve.
2. Extend comment feature types, handlers, and tool schemas to expose the new tool surface and collection arguments.
3. Refactor issue-thread comment loading to use the shared comment projection and native collection arguments instead of bespoke formatting-only logic.
4. Add unit and contract tests for the new read and write tools, including pagination and thread-state cases.
5. Update README and related documentation so the advertised MCP surface matches the implemented comment capabilities.

## Open Questions

- Should direct comment reads embed the first page of child replies by default, or should reply expansion remain opt-in?
- Should `bodyData` be returned only by direct detail reads, or by list and issue-thread reads when explicitly requested?
