## ADDED Requirements

### Requirement: Published package installs and boots as a marketplace artifact
The server SHALL ship a package artifact that can be installed through the marketplace and started without a local source checkout.

#### Scenario: Fresh-installed package starts and lists tools
- **WHEN** the packaged server is installed into a fresh environment and started through its published entrypoint
- **THEN** it SHALL boot successfully and SHALL answer the MCP tool-list request

### Requirement: Startup diagnostics distinguish setup errors from packaging failures
The server SHALL report missing auth or environment setup as actionable startup guidance instead of a generic installation failure.

#### Scenario: Missing auth setup returns configuration guidance
- **WHEN** a user starts the installed package without the required auth configuration
- **THEN** the server SHALL report a clear setup error that distinguishes missing configuration from package-install failure
