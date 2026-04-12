## 1. Issue read and write parity

- [x] 1.1 Add `linear_get_issue` and expand issue GraphQL fragments and types for hierarchy, relations, milestone, cycle, subscriber, and identifier fields
- [x] 1.2 Extend issue create and update schemas, types, and handlers with the review's recommended planning fields
- [x] 1.3 Update issue list and search responses so identifiers and other required planning fields are preserved consistently

## 2. Workflow and relation primitives

- [x] 2.1 Add first-class workflow state listing tools with structured outputs
- [x] 2.2 Add label list, create, update, and delete tools with team-scoped inputs
- [x] 2.3 Add issue relation create and delete tools and surface issue relation data in the issue detail response

## 3. Cycle support and validation

- [x] 3.1 Add cycle get, list, and current-cycle tools with supporting GraphQL queries and types
- [x] 3.2 Add cycle-aware issue filters and `cycleId` mutation support across issue handlers
- [x] 3.3 Add tests and documentation for detailed issue reads, workflow tools, relation flows, and cycle workflows
