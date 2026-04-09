## Why

The current MCP server only exposes a narrow slice of Linear's comment surface. Clients can fetch issue-scoped comments and create a comment, but they cannot load a single comment directly, enumerate comments with the platform's filter and pagination semantics, or manage comment lifecycle operations such as update, delete, resolve, and unresolve.

That gap makes comment-centric workflows brittle and prevents MCP clients from matching the public Linear API for loading and managing comment threads. Closing it now also reduces ambiguity around comment body fields, thread metadata, and archived-comment behavior before more advanced integration work lands.

## What Changes

- Add first-class comment read tools for direct comment lookup, workspace comment listing, and richer issue-thread retrieval.
- Expand comment read contracts to support Linear-style pagination, filtering, archived inclusion, ordering, and structured thread metadata.
- Add first-class comment lifecycle tools for update, delete, resolve, and unresolve operations in addition to create.
- Standardize comment payloads around Markdown body content, parent and child thread context, resolved state, association metadata, and pagination metadata.
- Add tests and documentation for the new comment tool surface and its expected behavior.

## Capabilities

### New Capabilities
- `comment-thread-loading`: Load direct comments, issue comment threads, and paginated comment collections with filtering, ordering, archived inclusion, and structured thread metadata.
- `comment-lifecycle-management`: Create, update, delete, resolve, and unresolve comments with contracts aligned to Linear's public comment lifecycle.

### Modified Capabilities
- None.

## Impact

- `src\features\comments\**`
- `src\core\types\tool.types.ts`
- `src\core\handlers\handler.factory.ts`
- `src\graphql\client.ts`
- `src\graphql\queries.ts`
- `src\graphql\mutations.ts`
- comment-focused tests under `src\__tests__\**`
- `README.md` and any documentation that describes the advertised tool surface
