# Code Review: Linear MCP Server

## Overview

This review covers the Linear MCP server codebase, focusing on performance, best practices, reliability, and security. The codebase is a TypeScript project implementing a Model Context Protocol (MCP) server for Linear, providing tools for managing issues, projects, comments, etc. The architecture uses handlers, authentication, and runtime capabilities.

## Performance

### Strengths
- **Concurrency control**: The `mapWithConcurrencyLimit` utility prevents overwhelming external APIs.
- **Request policies**: Configurable timeouts and retries (`RequestPolicyOptions`) help avoid hanging requests.
- **Caching**: `WeakMap` used in `HandlerFactory` for handler caching avoids memory leaks and re‑creates handlers per auth instance appropriately.

### Areas for Improvement
- **GraphQL query efficiency**: Ensure that GraphQL queries are minimal and use pagination where applicable (e.g., `first`/`after`). The existing `list` operations appear to support pagination, but the actual queries should be audited.
- **Streaming sessions cleanup**: The `streamSessions` map in `LinearServer` holds server references; ensure they are properly removed on session end to prevent memory accumulation.
- **Large payloads**: Some handlers may return large arrays (e.g., listing all issues). Consider implementing response size limits or encouraging filtering.

## Best Practices

### Strengths
- **Separation of concerns**: Clear division between features (issues, projects, comments) and layers (handlers, types, validation).
- **TypeScript usage**: Strong typing across most of the codebase, with dedicated interfaces for inputs and outputs.
- **Error handling**: Consistent use of `try/catch` in handlers and structured error responses (`BaseToolResponse` with `isError` flag).
- **Validation**: `ToolValidatorRegistry` uses AJV for JSON schema validation, providing clear error messages.

### Areas for Improvement
- **`any` types**: Some handler methods (e.g., `handleAuth(args: any)`) accept `any`, reducing type safety. Replace with concrete interfaces.
- **Missing async/await hygiene**: A few places may call async functions without `await` (e.g., inside `Promise.all`). Review for unhandled rejections.
- **Code duplication**: Similar validation patterns appear across handlers; consider extracting common validation logic into a shared utility.
- **Documentation**: Many methods lack JSDoc comments. Adding documentation would improve maintainability.

## Reliability

### Strengths
- **Retry logic**: The `LinearGraphQLClient` includes retry mechanisms for transient failures.
- **Authentication resilience**: OAuth flow includes state verification and token refresh handling.
- **Graceful shutdown**: The `LinearServer.close()` method attempts to clean up all resources (HTTP servers, stream sessions).

### Areas for Improvement
- **Unhandled promise rejections**: Ensure all async operations are wrapped in try/catch or have a `.catch`. The `withStdioClient` pattern should guarantee error propagation.
- **Circular dependencies**: The import graph between `core` and `features` should be checked for cycles (e.g., `HandlerFactory` depends on runtime capabilities, which may import feature modules).
- **Testing gaps**: While unit tests exist for some handlers, there may be insufficient integration tests for the full OAuth flow and error scenarios.

## Security

### Strengths
- **OAuth implementation**: Uses PKCE‑like state parameter and secure token exchange. Tokens are stored in memory, not persisted to disk.
- **Environment variable filtering**: `buildProcessEnv` filters out empty strings, preventing accidental empty values from being used.
- **Input validation**: All tool arguments are validated via JSON schemas before processing, mitigating injection risks.

### Areas for Improvement
- **Sensitive data logging**: Ensure that tokens, API keys, and user data are never logged, even in debug mode. Review `RuntimeObservability` telemetry for potential exposure.
- **HTTP headers security**: If serving HTTP endpoints (stream transport), implement security headers (CSP, HSTS) and ensure TLS in production.
- **Dependency vulnerabilities**: Regularly audit dependencies (e.g., `ajv`, `@linear/sdk`) for known vulnerabilities.

## Recommendations

1. **Replace `any` types** – Define explicit interfaces for all handler arguments.
2. **Add comprehensive integration tests** – Cover OAuth flows, error paths, and concurrency scenarios.
3. **Implement a health check endpoint** – For stream transport, provide a lightweight `/health` endpoint to monitor server status.
4. **Adopt a logging library** – Replace `console` usage with a structured logger (e.g., `pino` or `winston`) for better log management.
5. **Conduct a security audit** – Focus on token storage, session management, and HTTP header security.
6. **Monitor memory usage** – Profile long‑running processes for potential leaks, especially in the stream session management.

## Conclusion

The Linear MCP server is a well‑structured codebase with good attention to error handling and validation. By addressing the above points, the project can further improve its performance, maintainability, and security posture.
