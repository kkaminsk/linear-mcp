## Context

The local `linear-mcp` source can now be fixed while an external or packaged server still behaves like an older build. Today the server gives clients almost no way to tell the difference. `LinearServer` announces itself with a hardcoded `0.1.0` version, the `linear_get_capabilities` tool returns runtime transport data but not server identity, and the release scripts verify tool surfaces without checking that the packaged server reports its own packaged version.

This change crosses runtime metadata, tool output, startup diagnostics, and packaged-install verification. A design is useful because the fix needs one stable source of truth for build identity rather than more scattered literals.

## Goals / Non-Goals

**Goals:**
- Make the server expose the actual packaged build identity and version at runtime.
- Keep the MCP server handshake metadata, `linear_get_capabilities`, and startup diagnostics aligned to the same source of truth.
- Verify the built and packaged server report the expected provenance before release.

**Non-Goals:**
- Implement full deployment orchestration or remote server rollout logic.
- Guarantee that a third-party hosted server upgrades itself automatically.
- Add sensitive release metadata that should not be exposed to clients.

## Decisions

### 1. Resolve server build info from package metadata with optional environment-supplied commit data

The authoritative version should come from `package.json`, because that is what the built and packaged artifact actually ships. Optional commit metadata can be attached from environment variables such as `LINEAR_MCP_BUILD_SHA` or `GITHUB_SHA` when present, but the server should remain useful when that metadata is absent. Reading git state directly at runtime was considered, but rejected because packaged installs and production environments often lack a git checkout.

### 2. Thread build provenance through runtime capabilities and MCP server metadata

The same build info should drive both the MCP server descriptor passed to `new Server(...)` and the structured response from `linear_get_capabilities`. That keeps human-visible diagnostics and machine-readable capability discovery aligned. Keeping one value in startup logs and another in capabilities was considered, but rejected because it preserves the ambiguity this change is meant to remove.

### 3. Validate provenance from the built and packaged server boundary

Release checks should connect to the built and freshly packaged server and confirm the reported build provenance matches the packaged metadata. Unit tests alone are not enough here because the problem is specifically about what the packaged server reports after build and install.

## Risks / Trade-offs

- **Environment-dependent commit metadata** -> Treat commit SHA as optional and make version reporting the required baseline.
- **More release assertions can be brittle** -> Compare only stable provenance fields and keep the checks focused on packaged metadata.
- **Capability payload growth** -> Add only small, operationally useful fields such as package name, version, and optional commit SHA.

## Migration Plan

1. Introduce a shared server build metadata source derived from package metadata.
2. Feed that metadata into runtime capabilities, the MCP server descriptor, and startup logs.
3. Update capability and runtime tests to assert the new provenance fields.
4. Extend built/package release verification to fail when provenance drifts from the packaged metadata.

## Open Questions

- Should the startup diagnostics print the optional commit SHA only when available, or always include a placeholder value?
- Is a build timestamp useful enough to expose now, or should provenance stay limited to package version and commit SHA?
