import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getRuntimeCapabilities } from '../core/capabilities.js';
import { getServerBuildInfo } from '../core/server-build.js';
import {
  captureRuntimeEnv,
  createRuntimeSmokeHarness,
  restoreRuntimeEnv,
} from './helpers/runtime-smoke.js';

describe('runtime transport server', () => {
  const runtimeEnv = captureRuntimeEnv();
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    restoreRuntimeEnv(runtimeEnv);
  });

  it('reports a remote endpoint for stream transport capabilities', () => {
    const capabilities = getRuntimeCapabilities({
      transport: 'stream',
      host: '127.0.0.1',
      port: 43111,
      path: '/mcp',
    });

    expect(capabilities.transport).toBe('stream');
    expect(capabilities.endpoint).toBe('http://127.0.0.1:43111/mcp');
  });

  it('serves MCP over streamable HTTP and does not expose /sse', async () => {
    const harness = await createRuntimeSmokeHarness({
      clientName: 'runtime-transport-test',
    });

    try {
      const tools = await harness.client.listTools();
      expect(tools.tools.some(tool => tool.name === 'linear_get_capabilities')).toBe(true);

      const capabilitiesResult = await harness.client.callTool({
        name: 'linear_get_capabilities',
        arguments: {},
      }) as { structuredContent?: Record<string, unknown> };
      const buildInfo = getServerBuildInfo();

      expect(consoleErrorSpy).toHaveBeenCalledWith(`Build: ${buildInfo.name}@${buildInfo.version}`);
      expect(capabilitiesResult.structuredContent).toMatchObject({
        server: {
          name: buildInfo.name,
          version: buildInfo.version,
        },
        transport: 'stream',
        endpoint: harness.endpoint,
      });

      const response = await fetch(`http://127.0.0.1:${harness.port}/sse`);
      expect(response.status).toBe(404);
      expect(await response.text()).toContain('/mcp');
    } finally {
      await harness.close();
    }
  });
});
