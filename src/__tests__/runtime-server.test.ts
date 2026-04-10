import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { getRuntimeCapabilities } from '../core/capabilities.js';
import { getServerBuildInfo } from '../core/server-build.js';
import { LinearGraphQLClient, LinearGraphQLRequestError } from '../graphql/client.js';
import {
  captureRuntimeEnv,
  createIssueWorkflowSmokeBackend,
  createRuntimeSmokeHarness,
  restoreRuntimeEnv,
  TestLinearAuth,
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
    expect(capabilities.authScope).toBe('session');
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
        authScope: 'session',
        endpoint: harness.endpoint,
      });

      const response = await fetch(`http://127.0.0.1:${harness.port}/sse`);
      expect(response.status).toBe(404);
      expect(await response.text()).toContain('/mcp');
    } finally {
      await harness.close();
    }
  });

  it('bootstraps startup API-key auth from LINEAR_ACCESS_TOKEN', async () => {
    const harness = await createRuntimeSmokeHarness({
      clientName: 'runtime-access-token-alias-test',
      apiKeyEnv: {
        LINEAR_ACCESS_TOKEN: 'access-token-alias',
      },
    });

    try {
      await harness.client.listTools();

      expect((harness.server as any).stdioAuth.isAuthenticated()).toBe(true);
      expect((harness.server as any).stdioAuth.config).toMatchObject({
        type: 'api',
        apiKey: 'access-token-alias',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Auth: LINEAR_ACCESS_TOKEN detected.');
    } finally {
      await harness.close();
    }
  });

  it('prefers LINEAR_API_KEY when both startup API-key env vars are set', async () => {
    const harness = await createRuntimeSmokeHarness({
      clientName: 'runtime-api-key-precedence-test',
      apiKeyEnv: {
        LINEAR_API_KEY: 'primary-api-key',
        LINEAR_ACCESS_TOKEN: 'alias-api-key',
      },
    });

    try {
      await harness.client.listTools();

      expect((harness.server as any).stdioAuth.isAuthenticated()).toBe(true);
      expect((harness.server as any).stdioAuth.config).toMatchObject({
        type: 'api',
        apiKey: 'primary-api-key',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Auth: both LINEAR_API_KEY and LINEAR_ACCESS_TOKEN detected. Using LINEAR_API_KEY.'
      );
    } finally {
      await harness.close();
    }
  });

  it('rejects malformed tool arguments before handler dispatch', async () => {
    const backend = createIssueWorkflowSmokeBackend();
    const harness = await createRuntimeSmokeHarness({
      clientName: 'runtime-validation-test',
      serverOptions: {
        auth: backend.auth,
      },
    });

    try {
      const result = await harness.client.callTool({
        name: 'linear_create_issue',
        arguments: {
          teamId: 'team-1',
        },
      }) as { isError?: boolean; structuredContent?: Record<string, unknown> };

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        tool: 'linear_create_issue',
        error: {
          type: 'validation',
        },
      });
      expect(backend.createIssue).not.toHaveBeenCalled();
      expect(result.structuredContent?.error).toEqual(
        expect.objectContaining({
          details: expect.arrayContaining([
            expect.objectContaining({
              path: '$.title',
            }),
          ]),
        })
      );
    } finally {
      await harness.close();
    }
  });

  it('sanitizes structured GraphQL errors at the MCP boundary', async () => {
    const graphQLClient = {
      sdk: {
        issue: jest.fn(),
      },
      executeSdk: jest.fn(async () => {
        throw new LinearGraphQLRequestError(
          'issue',
          {
            errors: [
              {
                message: 'Rate limited',
                extensions: {
                  code: 'RATE_LIMITED',
                  secret: 'hidden',
                },
              },
            ],
            meta: {
              status: 429,
              retryable: true,
              headers: {
                authorization: 'Bearer secret',
                'x-request-id': 'req-123',
              },
            },
            extensions: {
              requestId: 'req-999',
              traceId: 'hidden',
            },
          },
          'GraphQL operation issue failed: Rate limited'
        );
      }),
    } as unknown as LinearGraphQLClient;

    const harness = await createRuntimeSmokeHarness({
      clientName: 'runtime-error-shape-test',
      serverOptions: {
        auth: new TestLinearAuth(graphQLClient),
      },
    });

    try {
      const result = await harness.client.callTool({
        name: 'linear_get_issue',
        arguments: {
          id: 'ISS-1',
        },
      }) as { isError?: boolean; structuredContent?: Record<string, any> };

      expect(result.isError).toBe(true);
      expect(result.structuredContent).toMatchObject({
        error: {
          type: 'graphql',
          graphql: {
            status: 429,
            retryable: true,
            requestId: 'req-123',
            errors: [
              {
                message: 'Rate limited',
                extensions: {
                  code: 'RATE_LIMITED',
                },
              },
            ],
          },
        },
      });
      expect(result.structuredContent?.error.graphql).not.toHaveProperty('headers');
      expect(result.structuredContent?.error.graphql).not.toHaveProperty('extensions');
      expect(result.structuredContent?.error.graphql.errors[0].extensions).not.toHaveProperty('secret');
    } finally {
      await harness.close();
    }
  });

  it('isolates OAuth state across concurrent stream sessions', async () => {
    const originalFetch = global.fetch.bind(globalThis);
    const tokenResponses = [
      new Response(JSON.stringify({
        access_token: 'token-1',
        refresh_token: 'refresh-1',
        expires_in: 3600,
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
      new Response(JSON.stringify({
        access_token: 'token-2',
        refresh_token: 'refresh-2',
        expires_in: 3600,
      }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    ];
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

      if (url === 'https://api.linear.app/oauth/token') {
        const response = tokenResponses.shift();
        if (!response) {
          throw new Error('Unexpected extra Linear OAuth token exchange');
        }

        return response;
      }

      return originalFetch(input, init);
    });

    const harness = await createRuntimeSmokeHarness({
      clientName: 'runtime-auth-session-1',
    });
    const secondClient = new Client(
      {
        name: 'runtime-auth-session-2',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    try {
      await secondClient.connect(new StreamableHTTPClientTransport(new URL(harness.endpoint)));

      const firstAuth = await harness.client.callTool({
        name: 'linear_auth',
        arguments: {
          clientId: 'client-id',
          clientSecret: 'client-secret',
          redirectUri: 'http://localhost:3000/callback',
        },
      }) as { structuredContent?: Record<string, unknown> };
      const secondAuth = await secondClient.callTool({
        name: 'linear_auth',
        arguments: {
          clientId: 'client-id',
          clientSecret: 'client-secret',
          redirectUri: 'http://localhost:3000/callback',
        },
      }) as { structuredContent?: Record<string, unknown> };

      const firstState = firstAuth.structuredContent?.state as string;
      const secondState = secondAuth.structuredContent?.state as string;

      expect(firstState).toEqual(expect.any(String));
      expect(secondState).toEqual(expect.any(String));
      expect(secondState).not.toBe(firstState);

      const firstCallback = await harness.client.callTool({
        name: 'linear_auth_callback',
        arguments: {
          code: 'code-1',
          state: firstState,
        },
      }) as { structuredContent?: Record<string, unknown> };
      const secondCallback = await secondClient.callTool({
        name: 'linear_auth_callback',
        arguments: {
          code: 'code-2',
          state: secondState,
        },
      }) as { structuredContent?: Record<string, unknown> };

      expect(firstCallback.structuredContent).toMatchObject({
        authenticated: true,
      });
      expect(secondCallback.structuredContent).toMatchObject({
        authenticated: true,
      });
    } finally {
      fetchSpy.mockRestore();
      await secondClient.close().catch(() => undefined);
      await harness.close();
    }
  });
});
