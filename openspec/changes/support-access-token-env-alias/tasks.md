## 1. Startup env resolution

- [x] 1.1 Add startup API-key env resolution that accepts `LINEAR_ACCESS_TOKEN` and prefers `LINEAR_API_KEY` when both are set.
- [x] 1.2 Update startup diagnostics so they report the selected env source or explain that neither supported API-key env var is present.

## 2. Regression coverage

- [x] 2.1 Extend runtime smoke helpers and tests to cover alias-only startup auth and the both-vars precedence case.
- [x] 2.2 Update integration/package-install verification so both `LINEAR_API_KEY` and `LINEAR_ACCESS_TOKEN` are accepted by the documented startup path.

## 3. Documentation

- [x] 3.1 Update README, architecture.md, and `.env.example` to document both API-key env names and the precedence rule.
