## ADDED Requirements

### Requirement: Webhook tools manage webhook registrations
The server SHALL provide tools to query, create, and delete Linear webhook registrations.

#### Scenario: Create a webhook registration
- **WHEN** a client creates a webhook registration with the required endpoint and event configuration
- **THEN** the server SHALL create the webhook through Linear and return the structured webhook result

#### Scenario: Delete a webhook registration
- **WHEN** a client deletes an existing webhook registration
- **THEN** the server SHALL remove that webhook through Linear and return a structured success result

### Requirement: Webhook management surfaces verification expectations
The server SHALL make webhook signature-verification expectations explicit in operator-facing documentation or structured tool guidance.

#### Scenario: Webhook guidance includes verification expectations
- **WHEN** a client or operator inspects webhook-related documentation or structured guidance
- **THEN** the server materials SHALL describe the signature-verification expectations required to validate delivered webhooks safely
