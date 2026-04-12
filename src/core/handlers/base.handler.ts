import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { LinearAuth } from '../../auth.js';
import {
  GraphQLErrorDetail,
  GraphQLResult,
  LinearGraphQLClient,
  LinearGraphQLRequestError,
} from '../../graphql/client.js';
import { BaseToolResponse } from '../interfaces/tool-handler.interface.js';

/**
 * Base handler class that implements common authentication and error handling logic.
 * All feature-specific handlers should extend this class.
 */
export abstract class BaseHandler {
  constructor(protected readonly auth: LinearAuth) {}

  /**
   * Verifies authentication and returns the GraphQL client.
   * Should be called at the start of each handler method.
   */
  protected async verifyAuth(): Promise<LinearGraphQLClient> {
    if (!this.auth.isAuthenticated()) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not authenticated. Call linear_auth first.'
      );
    }

    await this.auth.ensureAuthenticatedClient();
    return this.auth.getGraphQLClient();
  }

  /**
   * Creates a successful response with the given text content.
   */
  protected createResponse(
    text: string,
    structuredContent?: Record<string, unknown>
  ): BaseToolResponse {
    const response: BaseToolResponse = {
      content: [
        {
          type: 'text',
          text,
        },
      ],
    };

    if (structuredContent) {
      response.structuredContent = structuredContent;
    }

    return response;
  }

  /**
   * Creates a JSON response with the given data.
   */
  protected createStructuredResponse(
    summary: string,
    data: Record<string, unknown>,
    graphqlResult?: GraphQLResult<unknown>
  ): BaseToolResponse {
    return this.createResponse(summary, this.withGraphQLResult(data, graphqlResult));
  }

  /**
   * Creates a structured JSON response with the given data.
   */
  protected createJsonResponse(
    data: unknown,
    summary: string = 'Returned structured data',
    graphqlResult?: GraphQLResult<unknown>
  ): BaseToolResponse {
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      return this.createStructuredResponse(
        summary,
        data as Record<string, unknown>,
        graphqlResult
      );
    }

    return this.createStructuredResponse(summary, { value: data }, graphqlResult);
  }

  /**
   * Creates a structured error response that MCP clients can inspect.
   */
  protected createErrorResponse(
    message: string,
    details?: Record<string, unknown>
  ): BaseToolResponse {
    return {
      ...this.createResponse(message, details),
      isError: true,
    };
  }

  /**
   * Handles errors consistently across all handlers.
   */
  protected handleError(error: unknown, operation: string): BaseToolResponse {
    if (error instanceof LinearGraphQLRequestError) {
      const errorType = this.getGraphQLErrorType(error);
      return this.createErrorResponse(
        `Failed to ${operation}: ${error.message}`,
        {
          operation,
          error: {
            type: errorType,
            message: error.message,
            retryable: error.result.meta.retryable,
            graphql: this.serializeGraphQLResult(error.result),
          },
        }
      );
    }

    if (error instanceof McpError) {
      return this.createErrorResponse(
        `Failed to ${operation}: ${error.message}`,
        {
          operation,
          error: {
            type: 'mcp',
            code: error.code,
            message: error.message,
          },
        }
      );
    }

    return this.createErrorResponse(
      `Failed to ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      {
        operation,
        error: {
          type: 'internal',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    );
  }

  private getGraphQLErrorType(error: LinearGraphQLRequestError): 'graphql' | 'auth' | 'permission' {
    const graphQLErrorText = (error.result.errors ?? [])
      .flatMap(detail => [
        detail.message,
        ...(detail.extensions ? Object.values(detail.extensions).map(value => String(value)) : []),
      ])
      .join(' ')
      .toLowerCase();
    const combined = `${error.message} ${graphQLErrorText}`.toLowerCase();

    if (combined.includes('forbidden') || combined.includes('permission')) {
      return 'permission';
    }

    if (
      combined.includes('unauthorized')
      || combined.includes('authentication')
      || combined.includes('not authenticated')
      || combined.includes('invalid api key')
      || combined.includes('oauth')
    ) {
      return 'auth';
    }

    return 'graphql';
  }

  /**
   * Validates that required parameters are present.
   * @param params The parameters object to validate
   * @param required Array of required parameter names
   * @throws {McpError} If any required parameters are missing
   */
  protected validateRequiredParams<T>(
    params: T,
    required: Array<keyof T & string>
  ): void {
    const missing = required.filter(param => {
      const value = params[param];
      return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
    });

    if (missing.length > 0) {
      throw new McpError(
        ErrorCode.InvalidParams,
        `Missing required parameters: ${missing.join(', ')}`
      );
    }
  }

  protected withGraphQLResult<T extends Record<string, unknown>>(
    content: T,
    graphqlResult?: GraphQLResult<unknown>
  ): T & { graphql?: Record<string, unknown> } {
    if (!graphqlResult) {
      return content;
    }

    const serialized = this.serializeGraphQLResult(graphqlResult);
    if (!serialized) {
      return content;
    }

    return {
      ...content,
      graphql: serialized,
    };
  }

  private serializeGraphQLResult(
    result: GraphQLResult<unknown>
  ): Record<string, unknown> | undefined {
    const sanitizedErrors = this.sanitizeGraphQLErrors(result.errors);
    const requestId = this.getGraphQLRequestId(result);
    const hasErrors = (sanitizedErrors?.length ?? 0) > 0;
    const hasStatus = typeof result.meta.status === 'number';
    const hasRequestId = typeof requestId === 'string' && requestId.length > 0;

    if (!hasErrors && !hasStatus && !hasRequestId && !result.meta.retryable) {
      return undefined;
    }

    const graphql: Record<string, unknown> = {
      retryable: result.meta.retryable,
    };

    if (hasStatus) {
      graphql.status = result.meta.status;
    }

    if (hasRequestId) {
      graphql.requestId = requestId;
    }

    if (hasErrors) {
      graphql.errors = sanitizedErrors;
    }

    return graphql;
  }

  private sanitizeGraphQLErrors(
    errors?: GraphQLErrorDetail[]
  ): GraphQLErrorDetail[] | undefined {
    if (!errors || errors.length === 0) {
      return undefined;
    }

    return errors.map(error => {
      const sanitized: GraphQLErrorDetail = {
        message: error.message,
      };

      if (error.path) {
        sanitized.path = error.path;
      }

      const sanitizedExtensions = this.sanitizeGraphQLErrorExtensions(error.extensions);
      if (sanitizedExtensions) {
        sanitized.extensions = sanitizedExtensions;
      }

      return sanitized;
    });
  }

  private sanitizeGraphQLErrorExtensions(
    extensions?: Record<string, unknown>
  ): Record<string, unknown> | undefined {
    if (!extensions) {
      return undefined;
    }

    const allowedKeys = ['code', 'type', 'statusCode', 'reason', 'classification'];
    const sanitized = Object.fromEntries(
      allowedKeys.flatMap(key => {
        const value = extensions[key];
        return value === undefined || Array.isArray(value) || (typeof value === 'object' && value !== null)
          ? []
          : [[key, value]];
      })
    );

    return Object.keys(sanitized).length > 0 ? sanitized : undefined;
  }

  private getGraphQLRequestId(
    result: GraphQLResult<unknown>
  ): string | undefined {
    const requestIdHeaders = ['x-request-id', 'x-linear-request-id', 'request-id'];

    for (const header of requestIdHeaders) {
      const value = result.meta.headers[header];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    if (result.extensions && typeof result.extensions.requestId === 'string') {
      return result.extensions.requestId;
    }

    return undefined;
  }
}
