## 1. Shared Request Policy

- [x] 1.1 Introduce a shared timeout and retry policy helper for external auth and Linear-facing operations
- [x] 1.2 Apply explicit timeout budgets to OAuth token exchange and the shared GraphQL or SDK execution boundary

## 2. Safe Retry Semantics

- [x] 2.1 Opt approved safe read operations into bounded retry and keep non-idempotent write paths single-attempt by default
- [x] 2.2 Add focused tests for timeout failures, retry exhaustion, and no-auto-retry behavior on unsafe writes

## 3. Documentation and Verification

- [x] 3.1 Update contributor or operator guidance for timeout and retry behavior and run the build, test, and release verification paths
