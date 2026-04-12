## 1. Build metadata source

- [x] 1.1 Add a shared server build metadata source that resolves package name and version from the packaged artifact, with optional commit metadata from the environment.
- [x] 1.2 Replace hardcoded server version literals with the shared build metadata in runtime capability reporting and server startup.

## 2. Capability and release parity

- [x] 2.1 Expose build provenance through `linear_get_capabilities` and update runtime tests to assert the new fields.
- [x] 2.2 Extend built and packaged release verification to confirm the reported provenance matches the packaged metadata.

## 3. Documentation and diagnostics

- [x] 3.1 Update README guidance to explain how to inspect server provenance when troubleshooting runtime drift.
- [x] 3.2 Update startup diagnostics or adjacent developer guidance to keep the reported build identity visible during local and packaged runs.
