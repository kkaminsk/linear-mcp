#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { createServer, Server as HttpServer } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { LinearAuth } from './auth.js';
import {
  RuntimeCapabilities,
  getRuntimeCapabilities,
  getStreamTransportConfig,
} from './core/capabilities.js';
import { formatServerBuildInfo, getServerBuildInfo } from './core/server-build.js';
import { HandlerFactory } from './core/handlers/handler.factory.js';
import { BaseToolResponse, ToolHandlerMethod } from './core/interfaces/tool-handler.interface.js';
import { getAdvertisedToolSchemas } from './core/types/tool.types.js';

export interface LinearServerOptions {
  auth?: LinearAuth;
  capabilities?: RuntimeCapabilities;
}

/**
 * Main server class that handles MCP protocol interactions.
 * Delegates tool operations to domain-specific handlers.
 */
export class LinearServer {
  private server: Server;
  private auth: LinearAuth;
  private handlerFactory: HandlerFactory;
  private capabilities: RuntimeCapabilities;
  private readonly buildInfo = getServerBuildInfo();
  private httpServer?: HttpServer;
  private readonly shutdownHandler = (): void => {
    void this.close().finally(() => process.exit(0));
  };

  constructor(options: LinearServerOptions = {}) {
    this.server = new Server(
      {
        name: this.buildInfo.name,
        version: this.buildInfo.version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.auth = options.auth ?? new LinearAuth();
    this.capabilities = options.capabilities ?? getRuntimeCapabilities({ server: this.buildInfo });

    const apiKey = process.env.LINEAR_API_KEY;
    if (apiKey) {
      this.auth.initialize({
        type: 'api',
        apiKey,
      });
    }

    this.handlerFactory = new HandlerFactory(this.auth, this.capabilities);
    this.setupRequestHandlers();

    this.server.onerror = error => console.error('[MCP Error]', error);
    process.once('SIGINT', this.shutdownHandler);
  }

  private setupRequestHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: getAdvertisedToolSchemas(this.capabilities),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request): Promise<BaseToolResponse> => {
      try {
        const { handler, method } = this.handlerFactory.getHandlerForTool(request.params.name);
        const toolMethod = (handler as unknown as Record<string, ToolHandlerMethod>)[method];

        if (typeof toolMethod !== 'function') {
          throw new Error(`Handler method not found: ${method}`);
        }

        return await toolMethod.call(
          handler,
          request.params.arguments ?? {}
        );
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('No handler found')) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text',
              text: `Failed to execute ${request.params.name}: ${message}`,
            },
          ],
          structuredContent: {
            tool: request.params.name,
            error: {
              type: 'internal',
              message,
            },
          },
          isError: true,
        };
      }
    });
  }

  async run(): Promise<void> {
    if (this.capabilities.transport === 'stream') {
      await this.runStreamTransport();
      return;
    }

    await this.runStdioTransport();
  }

  async close(): Promise<void> {
    process.off('SIGINT', this.shutdownHandler);

    if (this.httpServer) {
      await new Promise<void>((resolve, reject) => {
        this.httpServer?.close(error => error ? reject(error) : resolve());
      });
      this.httpServer = undefined;
    }

    await this.server.close();
  }

  private async runStdioTransport(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logStartup();
  }

  private async runStreamTransport(): Promise<void> {
    const streamConfig = getStreamTransportConfig();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    await this.server.connect(transport);

    this.httpServer = createServer(async (req, res) => {
      const baseUrl = `http://${req.headers.host ?? `${streamConfig.host}:${streamConfig.port}`}`;
      const requestUrl = new URL(req.url ?? '/', baseUrl);

      if (requestUrl.pathname === streamConfig.path) {
        try {
          await transport.handleRequest(req, res);
        } catch (error) {
          console.error('[MCP HTTP Error]', error);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('content-type', 'text/plain; charset=utf-8');
            res.end('Failed to handle MCP stream request.');
          }
        }
        return;
      }

      res.statusCode = 404;
      res.setHeader('content-type', 'text/plain; charset=utf-8');

      if (requestUrl.pathname === '/sse') {
        res.end(`Legacy /sse is not exposed. Use the MCP streamable HTTP endpoint at ${streamConfig.path}.`);
        return;
      }

      res.end(`No MCP endpoint is available at ${requestUrl.pathname}. Use ${streamConfig.path}.`);
    });

    await new Promise<void>((resolve, reject) => {
      this.httpServer?.once('error', reject);
      this.httpServer?.listen(streamConfig.port, streamConfig.host, () => resolve());
    });

    this.logStartup(streamConfig.endpoint);
  }

  private logStartup(endpoint?: string): void {
    console.error(`Build: ${formatServerBuildInfo(this.capabilities.server)}`);

    if (this.capabilities.transport === 'stream' && endpoint) {
      console.error(`Linear MCP server running on stream transport at ${endpoint}`);
      console.error('Use MCP streamable HTTP clients against this endpoint. Legacy /sse is not exposed.');
    } else {
      console.error('Linear MCP server running on stdio');
      console.error('Remote stream endpoint is disabled in stdio mode. Set LINEAR_MCP_TRANSPORT=stream to expose a remote MCP endpoint.');
    }

    if (process.env.LINEAR_API_KEY) {
      console.error('Auth: LINEAR_API_KEY detected.');
      return;
    }

    console.error('Auth: no LINEAR_API_KEY detected. Set LINEAR_API_KEY for API-key auth or use linear_auth to start OAuth after installation.');
  }
}

export async function runCli(): Promise<void> {
  const server = new LinearServer();
  await server.run();
}

const isMainModule = Boolean(
  process.argv[1]
  && /(?:^|[\\/])(?:build[\\/])?index\.(?:js|ts)$/.test(process.argv[1])
);

if (isMainModule) {
  runCli().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
