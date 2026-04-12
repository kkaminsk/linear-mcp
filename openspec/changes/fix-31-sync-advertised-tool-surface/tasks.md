## 1. Tool catalog contract

- [x] 1.1 Define the released tool-catalog entries for comment workflows and the supported issue-update path.
- [x] 1.2 Add a smoke test that asks the built server for its tool list and compares it with the expected released catalog.

## 2. Build and distribution alignment

- [x] 2.1 Ensure the packaged build includes the handlers and tool schema exports required for the released catalog.
- [x] 2.2 Decide whether the supported single-issue update path remains `linear_bulk_update_issues` or also ships a dedicated alias, then reflect that choice in the advertised surface.

## 3. Documentation and release checks

- [x] 3.1 Update README and release notes to describe the released comment and issue-update workflows by version.
- [x] 3.2 Add CI or release validation that blocks publishing when the built catalog drifts from released documentation.
