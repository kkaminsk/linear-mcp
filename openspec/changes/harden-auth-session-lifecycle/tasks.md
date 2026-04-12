## 1. OAuth State Hardening

- [x] 1.1 Replace the OAuth state generator with a cryptographically secure primitive and consume matched state on every callback attempt
- [x] 1.2 Add auth tests covering successful callback, failed token exchange, and replay rejection after a matched callback

## 2. Session-Scoped Auth Context

- [x] 2.1 Introduce session-aware auth context resolution for stream transport while preserving current stdio behavior
- [x] 2.2 Update auth handlers, runtime documentation, and regression tests for isolated stream-session auth behavior
