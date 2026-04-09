## ADDED Requirements

### Requirement: Relation tools create and delete issue relations
The server SHALL provide dedicated tools to create and delete issue relations without overloading parent-child hierarchy behavior.

#### Scenario: Create a blocking relation
- **WHEN** a client requests creation of a supported issue relation between two issues
- **THEN** the server SHALL create that relation through Linear and return a structured mutation result

#### Scenario: Delete an existing issue relation
- **WHEN** a client requests deletion of an existing issue relation
- **THEN** the server SHALL remove that relation through Linear and return a structured success result

### Requirement: Detailed issue reads expose relation data
The detailed issue read tool SHALL expose issue relations with relation type and linked issue identity information.

#### Scenario: Get issue returns linked relations
- **WHEN** a client requests a specific issue that has linked relations
- **THEN** the server SHALL return those relations with relation type and linked issue identifiers in the issue payload
