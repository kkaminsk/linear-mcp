## Why

The server currently initializes API-key auth only from `LINEAR_API_KEY` and reports startup guidance only for that variable. In practice, MCP client configurations and operator habits also use `LINEAR_ACCESS_TOKEN`, so a valid configured token can look like missing auth when the server is run directly or inspected outside the host client.

## What Changes

- Accept `LINEAR_ACCESS_TOKEN` as a supported API-key environment variable for startup auth while preserving `LINEAR_API_KEY` compatibility.
- Define deterministic precedence and startup diagnostics when one or both API-key environment variables are present.
- Add regression coverage for startup auth initialization and packaged/runtime smoke checks using both environment-variable names.
- Update README, examples, and operator guidance so manual CLI use, packaged installs, and MCP client configs describe the same auth contract.

## Capabilities

### New Capabilities

- `api-key-env-alias`: Support startup API-key auth through either `LINEAR_API_KEY` or `LINEAR_ACCESS_TOKEN`, with clear precedence and operator diagnostics.

### Modified Capabilities

- None.

## Impact

- `src/index.ts`
- startup diagnostics and auth bootstrap behavior
- auth integration tests and runtime smoke helpers
- `README.md`, `architecture.md`, and `.env.example`
