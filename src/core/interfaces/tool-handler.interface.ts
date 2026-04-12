import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export interface BaseToolResponse extends CallToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

export type ToolHandlerMethod<TArgs = unknown> = (args: TArgs) => Promise<BaseToolResponse>;

/**
 * Marker interface for MCP tool handlers.
 * Concrete handlers expose method names that the handler factory maps from tool names.
 */
export interface ToolHandler {
  [methodName: string]: ToolHandlerMethod | unknown;
}

export interface ErrorToolResponse extends BaseToolResponse {
  isError: true;
}
