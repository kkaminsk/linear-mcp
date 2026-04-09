## ADDED Requirements

### Requirement: Comment creation supports root comments and threaded replies
The server SHALL allow clients to create both issue-root comments and threaded replies using Linear's comment association and parent-comment semantics.

#### Scenario: Create issue comment with markdown body
- **WHEN** a client creates a comment with an issue identifier and markdown body
- **THEN** the server SHALL create the comment through Linear and SHALL return a structured mutation payload for the created comment

#### Scenario: Create threaded reply with parentId
- **WHEN** a client creates a reply by providing `parentId`
- **THEN** the server SHALL create the nested comment under that parent and SHALL return a structured mutation payload that preserves the created comment's parent linkage

### Requirement: Comment lifecycle tools cover update, delete, resolve, and unresolve
The server SHALL expose first-class tools for updating, deleting, resolving, and unresolving comments.

#### Scenario: Update comment body
- **WHEN** a client updates a comment with supported body fields
- **THEN** the server SHALL apply the change through Linear and SHALL return the updated comment in a structured mutation payload

#### Scenario: Delete comment returns stable mutation status
- **WHEN** a client deletes a comment
- **THEN** the server SHALL return a structured delete payload containing the deleted entity identifier and mutation success metadata

#### Scenario: Resolve and unresolve comment thread
- **WHEN** a client resolves or unresolves a comment thread
- **THEN** the server SHALL invoke the corresponding Linear mutation and SHALL return the updated thread state in a structured mutation payload

### Requirement: Markdown body remains the primary public content contract
The server SHALL treat markdown `body` as the primary documented field for comment reads and writes while allowing optional advanced structured content fields when supported by Linear.

#### Scenario: Comment write succeeds without bodyData
- **WHEN** a client creates or updates a comment using markdown `body` without providing `bodyData`
- **THEN** the server SHALL treat that request as valid and SHALL not require editor-specific structured content fields for normal comment workflows
