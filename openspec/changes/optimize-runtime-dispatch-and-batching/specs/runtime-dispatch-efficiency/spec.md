## ADDED Requirements

### Requirement: Tool dispatch SHALL resolve handlers from a precomputed registry
The server SHALL resolve MCP tool handlers from a precomputed routing registry instead of rebuilding the full tool-to-handler map on every tool invocation.

#### Scenario: Repeated tool calls reuse stable routing metadata
- **WHEN** the server handles repeated MCP tool calls after startup
- **THEN** it SHALL resolve the target handler and method from precomputed routing metadata rather than rebuilding the full handler map for each call

### Requirement: Handler reuse SHALL preserve auth isolation
The server SHALL keep any handler reuse scoped to the active auth context so performance optimizations do not leak auth or session state across requests.

#### Scenario: Concurrent stream sessions invoke the same feature tools
- **WHEN** two stream sessions invoke tools that resolve to the same handler type
- **THEN** the server SHALL keep handler reuse isolated to each session's auth context instead of sharing a handler instance across sessions
