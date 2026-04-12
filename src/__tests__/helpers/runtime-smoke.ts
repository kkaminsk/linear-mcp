import { createServer as createNetServer } from 'node:net';
import { LinearClient } from '@linear/sdk';
import { jest } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { LinearAuth } from '../../auth.js';
import { SearchIssuesResponse } from '../../features/issues/types/issue.types.js';
import { LinearGraphQLClient } from '../../graphql/client.js';
import { LinearServer, LinearServerOptions } from '../../index.js';

export interface RuntimeEnvSnapshot {
  transport?: string;
  host?: string;
  port?: string;
  path?: string;
  apiKey?: string;
  accessToken?: string;
}

function restoreEnvVariable(name: string, value?: string): void {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}

export function captureRuntimeEnv(): RuntimeEnvSnapshot {
  return {
    transport: process.env.LINEAR_MCP_TRANSPORT,
    host: process.env.LINEAR_MCP_HOST,
    port: process.env.LINEAR_MCP_PORT,
    path: process.env.LINEAR_MCP_PATH,
    apiKey: process.env.LINEAR_API_KEY,
    accessToken: process.env.LINEAR_ACCESS_TOKEN,
  };
}

export function restoreRuntimeEnv(snapshot: RuntimeEnvSnapshot): void {
  restoreEnvVariable('LINEAR_MCP_TRANSPORT', snapshot.transport);
  restoreEnvVariable('LINEAR_MCP_HOST', snapshot.host);
  restoreEnvVariable('LINEAR_MCP_PORT', snapshot.port);
  restoreEnvVariable('LINEAR_MCP_PATH', snapshot.path);
  restoreEnvVariable('LINEAR_API_KEY', snapshot.apiKey);
  restoreEnvVariable('LINEAR_ACCESS_TOKEN', snapshot.accessToken);
}

export async function getAvailablePort(): Promise<number> {
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

export class TestLinearAuth extends LinearAuth {
  constructor(
    private readonly graphQLClient: LinearGraphQLClient,
    private readonly smokeClient: LinearClient = {} as LinearClient
  ) {
    super();
  }

  override isAuthenticated(): boolean {
    return true;
  }

  override async ensureAuthenticatedClient(): Promise<LinearClient> {
    return this.smokeClient;
  }

  override getGraphQLClient(): LinearGraphQLClient {
    return this.graphQLClient;
  }

  override createScopedCopy(): LinearAuth {
    return new TestLinearAuth(this.graphQLClient, this.smokeClient);
  }
}

export interface RuntimeSmokeHarness {
  server: LinearServer;
  client: Client;
  port: number;
  endpoint: string;
  close(): Promise<void>;
}

export async function createRuntimeSmokeHarness(options: {
  clientName: string;
  clientVersion?: string;
  serverOptions?: LinearServerOptions;
  apiKeyEnv?: {
    LINEAR_API_KEY?: string;
    LINEAR_ACCESS_TOKEN?: string;
  };
}): Promise<RuntimeSmokeHarness> {
  const port = await getAvailablePort();
  process.env.LINEAR_MCP_TRANSPORT = 'stream';
  process.env.LINEAR_MCP_HOST = '127.0.0.1';
  process.env.LINEAR_MCP_PORT = String(port);
  process.env.LINEAR_MCP_PATH = '/mcp';
  restoreEnvVariable('LINEAR_API_KEY', options.apiKeyEnv?.LINEAR_API_KEY);
  restoreEnvVariable('LINEAR_ACCESS_TOKEN', options.apiKeyEnv?.LINEAR_ACCESS_TOKEN);

  const server = new LinearServer(options.serverOptions);
  const client = new Client(
    {
      name: options.clientName,
      version: options.clientVersion ?? '1.0.0',
    },
    {
      capabilities: {},
    }
  );
  const endpoint = `http://127.0.0.1:${port}/mcp`;

  try {
    await server.run();
    const transport = new StreamableHTTPClientTransport(new URL(endpoint));
    await client.connect(transport);
  } catch (error) {
    await client.close().catch(() => undefined);
    await server.close().catch(() => undefined);
    throw error;
  }

  return {
    server,
    client,
    port,
    endpoint,
    close: async () => {
      await client.close();
      await server.close();
    },
  };
}

export function createIssueWorkflowSmokeBackend(): {
  auth: LinearAuth;
  executeSdk: ReturnType<typeof jest.fn>;
  createIssue: ReturnType<typeof jest.fn>;
  createIssueBatch: ReturnType<typeof jest.fn>;
  searchIssues: ReturnType<typeof jest.fn>;
} {
  const createIssue = jest.fn<(input: Record<string, unknown>) => Promise<Record<string, unknown>>>();
  const createIssueBatch = jest.fn<(input: { issues: Record<string, unknown>[] }) => Promise<Record<string, unknown>>>();
  const searchIssues = jest.fn<(query: string, options?: Record<string, unknown>) => Promise<SearchIssuesResponse>>();
  const executeSdk = jest.fn(
    async (_operationName: string, request: () => Promise<unknown>) => await request()
  );

  const graphQLClient = {
    createIssue,
    sdk: {
      createIssue,
      createIssueBatch,
    },
    executeSdk: executeSdk as LinearGraphQLClient['executeSdk'],
    searchIssues,
  } as unknown as LinearGraphQLClient;

  return {
    auth: new TestLinearAuth(graphQLClient),
    executeSdk,
    createIssue,
    createIssueBatch,
    searchIssues,
  };
}
