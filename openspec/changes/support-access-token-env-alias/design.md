## Context

The server currently bootstraps startup API-key auth only from `LINEAR_API_KEY`, while some MCP clients and operator setups provide the same credential as `LINEAR_ACCESS_TOKEN`. That mismatch makes a valid configured token look like missing auth when the server is started directly, inspected in package-install smoke tests, or wired into a client config outside the host that injected the value.

## Goals / Non-Goals

**Goals:**
- Accept `LINEAR_ACCESS_TOKEN` anywhere startup API-key auth currently accepts `LINEAR_API_KEY`.
- Keep startup auth precedence deterministic when both env vars are present.
- Align startup diagnostics, runtime/package smoke coverage, and operator docs with the same env contract.

**Non-Goals:**
- Change OAuth behavior or add a new auth mode.
- Redesign `LinearAuth` beyond the startup env bootstrap path.
- Introduce persistent credential storage.

## Decisions

### 1. Resolve startup API-key env selection once and prefer `LINEAR_API_KEY`
Startup should choose a single API-key value before auth initialization and use the same selection for diagnostics. `LINEAR_API_KEY` remains the primary variable to preserve existing behavior and avoid ambiguity when both variables are set.

### 2. Surface deterministic startup diagnostics for every env state
Startup output should say whether it detected `LINEAR_API_KEY`, detected `LINEAR_ACCESS_TOKEN`, detected both and chose `LINEAR_API_KEY`, or detected neither variable. That keeps packaged-install smoke tests and operator troubleshooting aligned with the real bootstrap path.

### 3. Extend regression coverage across runtime and packaged entrypoints
The runtime smoke harness should be able to start the real server with either env name, and packaged-install verification should assert that both names are accepted. Integration-test credential detection should also accept either variable so local verification matches documented startup behavior.

## Risks / Trade-offs

- **Two valid env names increase config drift risk** -> Prefer `LINEAR_API_KEY` when both are set and document that precedence explicitly.
- **Startup diagnostics become more specific** -> Keep them derived from the same env resolver used for bootstrap so messaging cannot drift from behavior.
- **More smoke-test permutations** -> Limit the added checks to credential-free startup paths so coverage stays fast and deterministic.

## Migration Plan

1. Add a startup env resolver that accepts both variable names and records which source was selected.
2. Update startup diagnostics and runtime helpers to use the new env contract.
3. Extend runtime, integration, and packaged-install coverage for both variable names.
4. Update operator-facing docs and examples to match the released behavior.
