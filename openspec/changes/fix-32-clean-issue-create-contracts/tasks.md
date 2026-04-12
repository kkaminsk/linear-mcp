## 1. Contract cleanup

- [x] 1.1 Remove or rewrite conflicting issue-create GraphQL helpers so single and batch creation each have one valid contract.
- [x] 1.2 Align project-with-issues creation to reuse the same batch create path behind `linear_create_issues`.

## 2. Regression coverage

- [x] 2.1 Update GraphQL client tests to assert the correct payload and response shape for single versus batch creation.
- [x] 2.2 Add handler or runtime tool-call tests that verify `linear_create_issue` and `linear_create_issues` invoke distinct underlying create operations.

## 3. Release parity

- [x] 3.1 Update tool or README documentation anywhere issue creation still implies ambiguous single-vs-batch behavior.
- [x] 3.2 Add publish-time or packaged-server validation for the issue-create tool contract.
