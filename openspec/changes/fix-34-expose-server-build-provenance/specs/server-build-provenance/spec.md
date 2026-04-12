## ADDED Requirements

### Requirement: Runtime capabilities report packaged server provenance
The server SHALL report its packaged build identity through `linear_get_capabilities`, including the packaged server name and version.

#### Scenario: Capability discovery returns packaged version metadata
- **WHEN** a client calls `linear_get_capabilities`
- **THEN** the server SHALL return its runtime transport details together with the packaged server name and packaged server version

### Requirement: Server startup uses the same provenance source as capability discovery
The server SHALL use the same build provenance source for its MCP server descriptor and human-readable startup diagnostics.

#### Scenario: Startup metadata does not use a stale hardcoded version
- **WHEN** the server starts from a built or packaged artifact
- **THEN** the reported server version SHALL come from the packaged build metadata instead of a hardcoded source-only literal

### Requirement: Release validation checks build provenance from the built boundary
The release process SHALL fail when the built or packaged server reports build provenance that differs from the packaged metadata.

#### Scenario: Packaged install reports expected build provenance
- **WHEN** release validation boots the built server and a freshly packaged install
- **THEN** both runtimes SHALL report the packaged server name and version that match the artifact metadata
