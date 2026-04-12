## ADDED Requirements

### Requirement: User tools support lookup, listing, and search
The server SHALL provide user tools that support viewer access together with user lookup, list, and search workflows appropriate to the Linear surface exposed by the server.

#### Scenario: Search users for assignment
- **WHEN** a client searches for users to assign or mention
- **THEN** the server SHALL return matching users with identifiers and other structured user metadata supported by the server

#### Scenario: List users with pagination
- **WHEN** a client requests a paginated user list
- **THEN** the server SHALL return a structured user collection with pagination metadata

### Requirement: Team tools support get and list semantics with filters
The server SHALL provide team tools that can get or list teams with pagination and filter behavior supported by Linear.

#### Scenario: Get a specific team
- **WHEN** a client requests a specific team by identifier
- **THEN** the server SHALL return the structured team result

#### Scenario: List teams with filters
- **WHEN** a client requests teams using supported filters and pagination
- **THEN** the server SHALL return a structured team collection with pagination metadata
