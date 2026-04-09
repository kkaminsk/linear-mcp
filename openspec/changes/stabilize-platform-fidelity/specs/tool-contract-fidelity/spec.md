## ADDED Requirements

### Requirement: Tool schemas use strict JSON Schema
The server SHALL define MCP input schemas with standard JSON Schema keywords and SHALL express optionality through the `required` array rather than non-standard properties.

#### Scenario: Optional fields are represented with standard schema rules
- **WHEN** an MCP client inspects a tool schema
- **THEN** the schema SHALL use standard JSON Schema constructs for optional and required fields

### Requirement: Comment reply inputs use a single parentId contract
The server SHALL use `parentId` consistently across tool schemas, handler argument types, and GraphQL input mapping for threaded comment creation.

#### Scenario: Threaded comment creation uses parentId consistently
- **WHEN** a client creates a reply comment by passing `parentId`
- **THEN** the declared tool schema, handler input parsing, and GraphQL mutation input SHALL all treat that field as the comment parent identifier

### Requirement: Tool results include machine-readable payloads
The server SHALL return structured JSON payloads for read and write tools so MCP clients can reliably parse identifiers, URLs, pagination metadata, and mutation status.

#### Scenario: Mutation results include stable fields
- **WHEN** a client invokes a write tool successfully
- **THEN** the response SHALL include a machine-readable payload with the created or updated entity identifiers and relevant status fields

#### Scenario: Read results include structured collection metadata
- **WHEN** a client invokes a paginated read tool
- **THEN** the response SHALL include a machine-readable payload with collection items and pagination metadata
