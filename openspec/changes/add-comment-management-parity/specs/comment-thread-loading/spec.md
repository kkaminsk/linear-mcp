## ADDED Requirements

### Requirement: Direct comment reads support first-class lookup
The server SHALL provide a direct comment read tool that loads a single Linear comment as a first-class entity instead of requiring clients to traverse through issue-scoped comment listings.

#### Scenario: Get comment returns structured comment detail
- **WHEN** a client requests a specific comment by a supported Linear identifier
- **THEN** the server SHALL return a structured comment payload that includes the comment id, body, URL, timestamps, author metadata, parent linkage, association identifiers, and resolution metadata when available

### Requirement: Issue comment thread reads preserve Linear collection semantics
The server SHALL provide an issue comment thread read tool that accepts Linear-style collection controls and returns issue comments with pagination metadata.

#### Scenario: Issue comment thread read supports paging and archive controls
- **WHEN** a client requests comments for an issue with pagination arguments, archived inclusion, or ordering controls
- **THEN** the server SHALL query the issue comment collection with those controls and SHALL return the matching comment nodes together with page information

#### Scenario: Issue comment thread read supports comment filters
- **WHEN** a client requests issue comments with supported comment filter criteria
- **THEN** the server SHALL apply those filters to the underlying Linear comment collection and SHALL return only the matching comments

### Requirement: Comment collections are available outside a single issue context
The server SHALL provide a top-level comment collection tool so clients can enumerate comments with the same filter and pagination semantics that Linear exposes for the workspace-wide comment connection.

#### Scenario: List comments returns filtered paginated results
- **WHEN** a client requests a top-level comment collection with filter, pagination, archived inclusion, or ordering arguments
- **THEN** the server SHALL return a structured comment collection payload with matching comments and page information

