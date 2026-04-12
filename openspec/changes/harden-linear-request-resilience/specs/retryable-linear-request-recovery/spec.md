## ADDED Requirements

### Requirement: Approved safe operations SHALL retry bounded transient failures
The server SHALL retry retryable failures for approved safe Linear operations using a bounded attempt count and backoff policy.

#### Scenario: Safe read receives a retryable upstream failure
- **WHEN** an approved safe operation fails with a retryable status or upstream error classification
- **THEN** the server SHALL retry that operation up to the configured bounded limit before returning failure

### Requirement: Unsafe writes SHALL not auto-retry by default
The server SHALL not automatically retry non-idempotent write operations unless the workflow explicitly documents retry safety.

#### Scenario: Non-idempotent mutation receives a retryable error
- **WHEN** a non-idempotent write operation encounters a retryable upstream failure
- **THEN** the server SHALL return the failure without automatically issuing a duplicate write attempt
