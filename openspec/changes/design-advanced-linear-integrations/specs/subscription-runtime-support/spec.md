## ADDED Requirements

### Requirement: Subscription tools require a supported runtime
The server SHALL only enable subscription workflows when the active runtime can support the streaming semantics required by those workflows.

#### Scenario: Supported runtime enables subscription tools
- **WHEN** the server runs in a runtime and transport configuration that supports the required subscription semantics
- **THEN** the server SHALL expose or enable the subscription tools for client use

### Requirement: Unsupported runtimes fail with a clear capability limitation
The server SHALL return a clear unsupported-runtime or capability-limitation response when a subscription workflow is requested in a runtime that cannot support it.

#### Scenario: Unsupported runtime rejects a subscription request clearly
- **WHEN** a client requests a subscription workflow in a runtime that lacks the required transport support
- **THEN** the server SHALL return a structured capability-limitation response instead of a generic internal error
