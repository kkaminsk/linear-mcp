## ADDED Requirements

### Requirement: Attachment tools manage attachment lifecycle operations
The server SHALL provide tools to create, update, delete, and query attachments associated with issues.

#### Scenario: Create an attachment for an issue
- **WHEN** a client creates an attachment with the required issue reference and attachment fields
- **THEN** the server SHALL create the attachment through Linear and return a structured attachment result

#### Scenario: Update or delete an attachment
- **WHEN** a client updates or deletes an existing attachment
- **THEN** the server SHALL apply the requested mutation and return a structured success result

### Requirement: Attachments preserve integration metadata
Attachment tools SHALL support the metadata fields needed for integrations, including URL-backed attachments, metadata payloads, and icon URLs when supported by Linear.

#### Scenario: Attachment result includes integration metadata
- **WHEN** a client creates or fetches an attachment that includes supported metadata fields
- **THEN** the server SHALL preserve those fields in the structured attachment payload

### Requirement: Attachment creation is idempotent for the same issue and URL
The server SHALL preserve Linear's idempotent attachment behavior for the same `(issueId, url)` pair.

#### Scenario: Repeated attachment create uses the same issue and URL
- **WHEN** a client creates an attachment for an issue using a URL that is already attached to that issue
- **THEN** the server SHALL preserve the idempotent behavior defined by Linear instead of creating duplicate attachments in the MCP contract
