## Context

The current repository is a stdio MCP server with no event-driven or streaming feature surface. The review recommends moving toward webhooks, subscriptions, initiatives, customers, and agent APIs, but those capabilities require runtime-aware design and stronger security guidance than the current repo provides.

This proposal is intentionally sequenced after the platform, issue, and project parity changes so advanced integrations can build on a stable auth, tool-contract, and GraphQL foundation.

## Goals / Non-Goals

**Goals:**
- Add a clear design and spec surface for advanced Linear integrations that fits the current repository architecture.
- Expose advanced capabilities only when the active runtime and transport can support them safely.
- Make auth, security, and capability limitations explicit for operators and MCP clients.
- Keep advanced tool outputs structured and consistent with the rest of the roadmap.

**Non-Goals:**
- Force subscription or inbound webhook delivery behavior into runtimes that cannot support it.
- Build external hosting infrastructure inside this repository.
- Expand unrelated issue, project, or attachment features that belong to earlier proposals.

## Decisions

### 1. Gate advanced capabilities on runtime support

Webhook management, subscriptions, and agent workflows do not all map cleanly to a pure stdio runtime. The server should explicitly gate advanced capabilities based on transport and runtime support instead of advertising a feature that cannot actually function in the current environment.

### 2. Separate webhook management from webhook delivery hosting

The MCP server can manage webhook registrations through Linear's API without pretending it is also the public webhook receiver. This change should expose management tools and verification guidance while documenting the boundary between registration and externally hosted delivery endpoints.

### 3. Treat subscriptions as an optional streaming capability

Subscriptions should only be exposed when the runtime can sustain the streaming or long-lived semantics they need. Unsupported runtimes should return a clear capability limitation rather than a generic error or a hanging operation.

### 4. Group initiatives and customers as portfolio entities

Initiatives and customers both extend the server from issue-level workflows into higher-level portfolio planning. Grouping them under a portfolio entity capability gives them a shared discovery and lifecycle pattern without tying them to project CRUD.

### 5. Expose agent sessions and activities as dedicated structured tools

Agent APIs are a distinct product surface and should be represented with dedicated tools and structured outputs. They should not be hidden behind generic GraphQL passthrough behavior because clients need clear auth expectations and stable result shapes.

## Risks / Trade-offs

- **Runtime mismatch:** Some advanced features may not work in the current stdio server shape. Mitigation: capability gating and explicit unsupported-runtime responses.
- **Security complexity:** Webhooks and agent workflows add signature, secret, and callback concerns. Mitigation: include operator guidance and explicit auth requirements in the surfaced contract.
- **Upstream API movement:** Agent and AI-adjacent APIs may evolve quickly. Mitigation: scope the initial surface to the stable endpoints and structured contracts available at implementation time.
- **Testing cost:** Streaming and event-driven features are harder to test than request-response tools. Mitigation: isolate runtime gating, mock transport constraints, and keep the first pass incremental.

## Migration Plan

1. Add capability-gating infrastructure and operator-facing documentation.
2. Add webhook management tools and verification guidance.
3. Add initiatives and customers support with shared portfolio patterns.
4. Add agent session and activity tools.
5. Add subscription support only in runtimes that satisfy the streaming requirements.

## Open Questions

- Should capability-gated tools be omitted entirely from the tool list, or listed with a clear unsupported-runtime behavior?
- Which webhook verification helpers belong in code versus documentation?
- Which agent endpoints are stable enough to expose in the first iteration?
