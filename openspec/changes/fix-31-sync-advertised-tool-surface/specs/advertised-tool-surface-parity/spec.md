## ADDED Requirements

### Requirement: Shipped tool catalog matches documented workflow support
The server SHALL advertise the released comment workflows and issue-update path in the tool catalog returned by the built or packaged distribution.

#### Scenario: Built artifact advertises released comment and issue update tools
- **WHEN** a client requests the tool list from a built or packaged server artifact
- **THEN** the returned catalog SHALL include `linear_get_comment`, `linear_list_comments`, `linear_get_issue_comments`, `linear_create_comment`, `linear_update_comment`, `linear_delete_comment`, `linear_resolve_comment`, `linear_unresolve_comment`, and the released issue-update path described by the documentation

### Requirement: Release validation detects stale tool surfaces
The release process SHALL verify the built server's advertised tool catalog before publishing a distribution.

#### Scenario: Release validation blocks stale catalog output
- **WHEN** the built server's tool list differs from the expected released catalog
- **THEN** the release validation SHALL fail before the distribution is published
