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
import { ToolValidationResult, ToolValidatorRegistry } from './core/validation/tool-validator.js';

export interface LinearServerOptions {
  auth?: LinearAuth;
  capabilities?: RuntimeCapabilities;
}

type StartupApiKeyEnvName = 'LINEAR_API_KEY' | 'LINEAR_ACCESS_TOKEN';

interface StartupApiKeySelection {
  apiKey?: string;
  source?: StartupApiKeyEnvName;
  hasPrimary: boolean;
  hasAlias: boolean;
}

function resolveStartupApiKeySelection(env: NodeJS.ProcessEnv = process.env): StartupApiKeySelection {
  const primaryApiKey = env.LINEAR_API_KEY;
  const aliasApiKey = env.LINEAR_ACCESS_TOKEN;

  if (primaryApiKey) {
    return {
      apiKey: primaryApiKey,
      source: 'LINEAR_API_KEY',
      hasPrimary: true,
      hasAlias: Boolean(aliasApiKey),
    };
  }

  if (aliasApiKey) {
    return {
      apiKey: aliasApiKey,
      source: 'LINEAR_ACCESS_TOKEN',
      hasPrimary: false,
      hasAlias: true,
    };
  }

  return {
    hasPrimary: false,
    hasAlias: false,
  };
}

function formatStartupAuthMessage(selection: StartupApiKeySelection): string {
  if (selection.source === 'LINEAR_API_KEY' && selection.hasAlias) {
    return 'Auth: both LINEAR_API_KEY and LINEAR_ACCESS_TOKEN detected. Using LINEAR_API_KEY.';
  }

  if (selection.source === 'LINEAR_API_KEY') {
    return 'Auth: LINEAR_API_KEY detected.';
  }

  if (selection.source === 'LINEAR_ACCESS_TOKEN') {
    return 'Auth: LINEAR_ACCESS_TOKEN detected.';
  }

  return 'Auth: no LINEAR_API_KEY or LINEAR_ACCESS_TOKEN detected. Set either variable for API-key auth or use linear_auth to start OAuth after installation.';
}

/**
 * Main server class that handles MCP protocol interactions.
 * Delegates tool operations to domain-specific handlers.
 */
export class LinearServer {
  private server: Server;
  private readonly authTemplate: LinearAuth;
  private readonly stdioAuth: LinearAuth;
  private readonly streamSessions = new Map<string, {
    server: Server;
    transport: StreamableHTTPServerTransport;
  }>();
  private handlerFactory: HandlerFactory;
  private readonly toolValidators: ToolValidatorRegistry;
  private capabilities: RuntimeCapabilities;
  private readonly buildInfo = getServerBuildInfo();
  private readonly startupApiKeySelection: StartupApiKeySelection;
  private httpServer?: HttpServer;
  private readonly shutdownHandler = (): void => {
    void this.close().finally(() => process.exit(0));
  };

  constructor(options: LinearServerOptions = {}) {
    this.authTemplate = options.auth ?? new LinearAuth();
    this.capabilities = options.capabilities ?? getRuntimeCapabilities({ server: this.buildInfo });

    this.startupApiKeySelection = resolveStartupApiKeySelection();
    const apiKey = this.startupApiKeySelection.apiKey;
    if (apiKey && !options.auth) {
      this.authTemplate.initialize({
        type: 'api',
        apiKey,
      });
    }

    this.stdioAuth = this.authTemplate.createScopedCopy();
    this.handlerFactory = new HandlerFactory(this.capabilities);
    this.toolValidators = new ToolValidatorRegistry(this.capabilities);
    this.server = this.createProtocolServer(this.stdioAuth);
    process.once('SIGINT', this.shutdownHandler);
  }

  private createProtocolServer(auth: LinearAuth): Server {
    const server = new Server(
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

    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: getAdvertisedToolSchemas(this.capabilities),
    }));

    server.setRequestHandler(CallToolRequestSchema, async (request): Promise<BaseToolResponse> => {
      try {
        if (!this.toolValidators.hasTool(request.params.name)) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        const validation = this.toolValidators.validate(
          request.params.name,
          request.params.arguments
        );

        if (!validation.valid) {
          return this.createValidationErrorResponse(request.params.name, validation);
        }

        const { handler, method } = this.handlerFactory.getHandlerForTool(request.params.name, auth);
        const toolMethod = (handler as unknown as Record<string, ToolHandlerMethod>)[method];

        if (typeof toolMethod !== 'function') {
          throw new Error(`Handler method not found: ${method}`);
        }

        return await toolMethod.call(
          handler,
          validation.data
        );
      } catch (error) {
        if (error instanceof McpError && error.code === ErrorCode.MethodNotFound) {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        if (error instanceof McpError) {
          return this.createRuntimeErrorResponse(
            request.params.name,
            'mcp',
            error.message,
            {
              code: error.code,
            }
          );
        }

        const message = error instanceof Error ? error.message : 'Unknown error';
        return this.createRuntimeErrorResponse(
          request.params.name,
          'internal',
          message
        );
      }
    });

    server.onerror = error => console.error('[MCP Error]', error);
    return server;
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

    const streamSessionServers = Array.from(this.streamSessions.values()).map(session => session.server);
    this.streamSessions.clear();
    await Promise.all(streamSessionServers.map(server => server.close().catch(() => undefined)));

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

    this.httpServer = createServer(async (req, res) => {
      const baseUrl = `http://${req.headers.host ?? `${streamConfig.host}:${streamConfig.port}`}`;
      const requestUrl = new URL(req.url ?? '/', baseUrl);

      if (requestUrl.pathname === streamConfig.path) {
        try {
          await this.handleStreamRequest(req, res);
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

    console.error(formatStartupAuthMessage(this.startupApiKeySelection));
  }

  private createValidationErrorResponse(
    toolName: string,
    validation: Extract<ToolValidationResult, { valid: false }>
  ): BaseToolResponse {
    return this.createRuntimeErrorResponse(
      toolName,
      'validation',
      validation.message,
      {
        code: ErrorCode.InvalidParams,
        details: validation.issues,
      }
    );
  }

  private createRuntimeErrorResponse(
    toolName: string,
    type: 'internal' | 'mcp' | 'validation',
    message: string,
    details: Record<string, unknown> = {}
  ): BaseToolResponse {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to execute ${toolName}: ${message}`,
        },
      ],
      structuredContent: {
        tool: toolName,
        error: {
          type,
          message,
          ...details,
        },
      },
      isError: true,
    };
  }

  private async handleStreamRequest(
    req: Parameters<StreamableHTTPServerTransport['handleRequest']>[0],
    res: Parameters<StreamableHTTPServerTransport['handleRequest']>[1]
  ): Promise<void> {
    const sessionIdHeader = req.headers['mcp-session-id'];
    const sessionId = Array.isArray(sessionIdHeader) ? sessionIdHeader[0] : sessionIdHeader;

    if (sessionId) {
      const existingSession = this.streamSessions.get(sessionId);
      if (!existingSession) {
        this.writeJsonRpcError(res, 404, -32001, 'Session not found');
        return;
      }

      await existingSession.transport.handleRequest(req, res);
      return;
    }

    const auth = this.authTemplate.createScopedCopy();
    const server = this.createProtocolServer(auth);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        this.streamSessions.delete(transport.sessionId);
      }
    };

    await server.connect(transport);

    try {
      await transport.handleRequest(req, res);

      if (transport.sessionId) {
        this.streamSessions.set(transport.sessionId, {
          server,
          transport,
        });
        return;
      }
    } catch (error) {
      await server.close().catch(() => undefined);
      throw error;
    }

    await server.close().catch(() => undefined);
  }

  private writeJsonRpcError(
    res: Parameters<StreamableHTTPServerTransport['handleRequest']>[1],
    status: number,
    code: number,
    message: string
  ): void {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code,
        message,
      },
      id: null,
    }));
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
