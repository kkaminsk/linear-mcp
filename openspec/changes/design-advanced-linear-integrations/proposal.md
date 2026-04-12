## Why

The review highlights that Linear is moving toward event-driven and AI-native workflows through webhooks, subscriptions, portfolio entities, and agent APIs. The server needs a forward-looking change that defines how to expose those capabilities without assuming runtime behavior the current stdio implementation cannot guarantee.

## What Changes

- Add first-class webhook management tools and define the signature-verification guidance that operators need to use them safely.
- Add a runtime-aware subscription surface that only enables streaming behavior when the active transport can support it.
- Add initiatives and customers support for larger portfolio and customer-facing workflows.
- Add agent session and agent activity tools aligned with Linear's AI workflow direction.
- Establish capability gating, auth expectations, and documentation for advanced integrations so the surface is explicit instead of implicit.

## Capabilities

### New Capabilities
- `webhook-management`: Manage Linear webhooks and make verification expectations explicit.
- `subscription-runtime-support`: Expose subscription workflows only when the active runtime can support them safely.
- `portfolio-entity-support`: Add initiatives and customers as first-class portfolio entities.
- `agent-api-alignment`: Add agent session and activity tools aligned with Linear's AI-oriented APIs.

### Modified Capabilities
- None.

## Impact

- new advanced feature modules under `src\features\`
- possible transport and capability-gating logic in `src\index.ts` and handler initialization
- webhook, subscription, initiative, customer, and agent GraphQL operations
- security, runtime, and operator documentation
- tests that cover capability gating and structured advanced-tool outputs
