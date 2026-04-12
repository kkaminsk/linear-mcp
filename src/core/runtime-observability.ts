import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { RuntimeCapabilities } from './capabilities.js';
import { BaseToolResponse } from './interfaces/tool-handler.interface.js';

type TelemetryOutcome = 'success' | 'error';

export interface RuntimeTelemetryRecord {
  event: 'mcp_tool_request';
  tool: string;
  transport: RuntimeCapabilities['transport'];
  authScope: RuntimeCapabilities['authScope'];
  durationMs: number;
  outcome: TelemetryOutcome;
  errorType?: string;
  retryable?: boolean;
  upstreamRequestId?: string;
  upstreamStatus?: number;
  authRefreshFailure?: boolean;
}

export interface RuntimeDiagnosticsContext {
  startupSource?: string;
  hasPrimaryEnv: boolean;
  hasAliasEnv: boolean;
  stdioAuthenticated: boolean;
}

interface RuntimeFailureSummary {
  tool: string;
  type: string;
  retryable: boolean;
  occurredAt: string;
  requestId?: string;
  status?: number;
}

export class RuntimeObservability {
  private readonly startedAt = Date.now();
  private totalRequests = 0;
  private successfulRequests = 0;
  private failedRequests = 0;
  private validationFailures = 0;
  private mcpFailures = 0;
  private internalFailures = 0;
  private graphqlFailures = 0;
  private authFailures = 0;
  private permissionFailures = 0;
  private capabilityFailures = 0;
  private retryableFailures = 0;
  private authRefreshFailures = 0;
  private lastFailure?: RuntimeFailureSummary;

  constructor(
    private readonly capabilities: RuntimeCapabilities,
    private readonly getActiveStreamSessions: () => number
  ) {}

  recordResponse(
    tool: string,
    response: BaseToolResponse,
    durationMs: number
  ): void {
    this.recordTelemetry(this.buildTelemetryFromResponse(tool, response, durationMs));
  }

  recordError(
    tool: string,
    error: unknown,
    durationMs: number
  ): void {
    this.recordTelemetry(this.buildTelemetryFromError(tool, error, durationMs));
  }

  createDiagnosticsSnapshot(
    context: RuntimeDiagnosticsContext
  ): Record<string, unknown> {
    return {
      server: this.capabilities.server,
      runtime: this.capabilities.runtime,
      transport: this.capabilities.transport,
      authScope: this.capabilities.authScope,
      endpoint: this.capabilities.endpoint,
      uptimeMs: Math.max(Date.now() - this.startedAt, 0),
      auth: {
        startupMode: context.startupSource ? 'api-key-env' : 'tool-driven',
        startupSource: context.startupSource ?? null,
        dualEnvDetected: context.hasPrimaryEnv && context.hasAliasEnv,
        stdioAuthenticated: this.capabilities.transport === 'stdio'
          ? context.stdioAuthenticated
          : undefined,
      },
      sessions: {
        activeStreamSessions: this.getActiveStreamSessions(),
      },
      requests: {
        total: this.totalRequests,
        successful: this.successfulRequests,
        failed: this.failedRequests,
      },
      failures: {
        validation: this.validationFailures,
        mcp: this.mcpFailures,
        internal: this.internalFailures,
        graphql: this.graphqlFailures,
        auth: this.authFailures,
        permission: this.permissionFailures,
        capability: this.capabilityFailures,
        retryable: this.retryableFailures,
        authRefresh: this.authRefreshFailures,
      },
      lastFailure: this.lastFailure ?? null,
    };
  }

  private buildTelemetryFromResponse(
    tool: string,
    response: BaseToolResponse,
    durationMs: number
  ): RuntimeTelemetryRecord {
    const structuredContent = this.asRecord(response.structuredContent);
    const error = this.asRecord(structuredContent?.error);
    const graphql = this.asRecord(error?.graphql) ?? this.asRecord(structuredContent?.graphql);
    const retryable = this.readBoolean(error?.retryable) ?? this.readBoolean(graphql?.retryable);
    const upstreamRequestId = this.readString(graphql?.requestId);
    const upstreamStatus = this.readNumber(graphql?.status);
    const errorMessage = this.readString(error?.message)
      ?? this.readString(response.content[0]?.text);

    return {
      event: 'mcp_tool_request',
      tool,
      transport: this.capabilities.transport,
      authScope: this.capabilities.authScope,
      durationMs,
      outcome: response.isError === true || error ? 'error' : 'success',
      errorType: this.readString(error?.type),
      retryable,
      upstreamRequestId,
      upstreamStatus,
      authRefreshFailure: this.isAuthRefreshFailure(errorMessage),
    };
  }

  private buildTelemetryFromError(
    tool: string,
    error: unknown,
    durationMs: number
  ): RuntimeTelemetryRecord {
    return {
      event: 'mcp_tool_request',
      tool,
      transport: this.capabilities.transport,
      authScope: this.capabilities.authScope,
      durationMs,
      outcome: 'error',
      errorType: error instanceof McpError ? 'mcp' : 'internal',
      retryable: false,
      authRefreshFailure: error instanceof McpError && this.isAuthRefreshFailure(error.message),
    };
  }

  private recordTelemetry(record: RuntimeTelemetryRecord): void {
    this.totalRequests += 1;

    if (record.outcome === 'success') {
      this.successfulRequests += 1;
    } else {
      this.failedRequests += 1;
      this.incrementFailureCounter(record.errorType);

      if (record.retryable) {
        this.retryableFailures += 1;
      }

      if (record.authRefreshFailure) {
        this.authRefreshFailures += 1;
      }

      this.lastFailure = {
        tool: record.tool,
        type: record.errorType ?? 'unknown',
        retryable: record.retryable ?? false,
        occurredAt: new Date().toISOString(),
        requestId: record.upstreamRequestId,
        status: record.upstreamStatus,
      };
    }

    console.error(JSON.stringify(this.compactRecord(record)));
  }

  private incrementFailureCounter(errorType?: string): void {
    switch (errorType) {
      case 'validation':
        this.validationFailures += 1;
        break;
      case 'mcp':
        this.mcpFailures += 1;
        break;
      case 'graphql':
        this.graphqlFailures += 1;
        break;
      case 'auth':
        this.authFailures += 1;
        break;
      case 'permission':
        this.permissionFailures += 1;
        break;
      case 'capability':
        this.capabilityFailures += 1;
        break;
      default:
        this.internalFailures += 1;
        break;
    }
  }

  private isAuthRefreshFailure(message?: string): boolean {
    return typeof message === 'string'
      && message.toLowerCase().includes('token refresh failed');
  }

  private compactRecord(record: RuntimeTelemetryRecord): RuntimeTelemetryRecord {
    return Object.fromEntries(
      Object.entries(record).filter(([key, value]) =>
        value !== undefined && !(key === 'authRefreshFailure' && value === false)
      )
    ) as RuntimeTelemetryRecord;
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? value as Record<string, unknown>
      : undefined;
  }

  private readBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  private readNumber(value: unknown): number | undefined {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
