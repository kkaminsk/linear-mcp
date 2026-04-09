import { createServer as createNetServer } from 'node:net';
import { afterEach, describe, expect, it } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { getRuntimeCapabilities } from '../core/capabilities.js';
import { LinearServer } from '../index.js';

async function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createNetServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Failed to acquire a test port'));
        return;
      }

      server.close(error => error ? reject(error) : resolve(address.port));
    });
  });
}

describe('runtime transport server', () => {
  const originalTransport = process.env.LINEAR_MCP_TRANSPORT;
  const originalHost = process.env.LINEAR_MCP_HOST;
  const originalPort = process.env.LINEAR_MCP_PORT;
  const originalPath = process.env.LINEAR_MCP_PATH;
  const originalApiKey = process.env.LINEAR_API_KEY;

  afterEach(() => {
    if (originalTransport === undefined) {
      delete process.env.LINEAR_MCP_TRANSPORT;
    } else {
      process.env.LINEAR_MCP_TRANSPORT = originalTransport;
    }

    if (originalHost === undefined) {
      delete process.env.LINEAR_MCP_HOST;
    } else {
      process.env.LINEAR_MCP_HOST = originalHost;
    }

    if (originalPort === undefined) {
      delete process.env.LINEAR_MCP_PORT;
    } else {
      process.env.LINEAR_MCP_PORT = originalPort;
    }

    if (originalPath === undefined) {
      delete process.env.LINEAR_MCP_PATH;
    } else {
      process.env.LINEAR_MCP_PATH = originalPath;
    }

    if (originalApiKey === undefined) {
      delete process.env.LINEAR_API_KEY;
    } else {
      process.env.LINEAR_API_KEY = originalApiKey;
    }
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
    const port = await getAvailablePort();
    process.env.LINEAR_MCP_TRANSPORT = 'stream';
    process.env.LINEAR_MCP_HOST = '127.0.0.1';
    process.env.LINEAR_MCP_PORT = String(port);
    process.env.LINEAR_MCP_PATH = '/mcp';
    delete process.env.LINEAR_API_KEY;

    const server = new LinearServer();
    const client = new Client(
      {
        name: 'runtime-transport-test',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    try {
      await server.run();

      const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
      await client.connect(transport);

      const tools = await client.listTools();
      expect(tools.tools.some(tool => tool.name === 'linear_get_capabilities')).toBe(true);

      const capabilitiesResult = await client.callTool({
        name: 'linear_get_capabilities',
        arguments: {},
      }) as { structuredContent?: Record<string, unknown> };

      expect(capabilitiesResult.structuredContent).toMatchObject({
        transport: 'stream',
        endpoint: `http://127.0.0.1:${port}/mcp`,
      });

      const response = await fetch(`http://127.0.0.1:${port}/sse`);
      expect(response.status).toBe(404);
      expect(await response.text()).toContain('/mcp');
    } finally {
      await client.close();
      await server.close();
    }
  });
});
