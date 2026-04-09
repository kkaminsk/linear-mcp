export type RuntimeTransport = 'stdio' | 'stream';

export interface StreamTransportOptions {
  host?: string;
  port?: number;
  path?: string;
}

export interface RuntimeCapabilityOptions {
  transport?: RuntimeTransport;
  streamingSupported?: boolean;
  host?: string;
  port?: number;
  path?: string;
}

export interface StreamTransportConfig {
  host: string;
  port: number;
  path: string;
  endpoint: string;
}

export interface RuntimeCapabilities {
  runtime: 'node';
  transport: RuntimeTransport;
  streamingSupported: boolean;
  supportsSubscriptions: boolean;
  endpoint: string | null;
  capabilities: {
    webhookManagement: boolean;
    portfolioEntities: boolean;
    agentWorkflows: boolean;
    subscriptions: boolean;
  };
}

function normalizeTransportPath(value?: string): string {
  if (!value) {
    return '/mcp';
  }

  return value.startsWith('/') ? value : `/${value}`;
}

function parseTransportPort(value?: string): number {
  if (!value) {
    return 3000;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 3000;
}

export function getStreamTransportConfig(
  options: StreamTransportOptions = {}
): StreamTransportConfig {
  const host = options.host ?? process.env.LINEAR_MCP_HOST ?? '127.0.0.1';
  const port = options.port ?? parseTransportPort(process.env.LINEAR_MCP_PORT);
  const path = normalizeTransportPath(options.path ?? process.env.LINEAR_MCP_PATH);

  return {
    host,
    port,
    path,
    endpoint: `http://${host}:${port}${path}`,
  };
}

export function getRuntimeCapabilities(
  options: RuntimeCapabilityOptions = {}
): RuntimeCapabilities {
  const transport = options.transport
    ?? (process.env.LINEAR_MCP_TRANSPORT === 'stream' ? 'stream' : 'stdio');
  const streamConfig = transport === 'stream'
    ? getStreamTransportConfig(options)
    : undefined;
  const streamingSupported = options.streamingSupported
    ?? transport === 'stream';
  const supportsSubscriptions = streamingSupported && transport === 'stream';

  return {
    runtime: 'node',
    transport,
    streamingSupported,
    supportsSubscriptions,
    endpoint: streamConfig?.endpoint ?? null,
    capabilities: {
      webhookManagement: true,
      portfolioEntities: true,
      agentWorkflows: true,
      subscriptions: supportsSubscriptions,
    },
  };
}
