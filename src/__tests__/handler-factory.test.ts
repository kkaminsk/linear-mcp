import { describe, expect, it } from '@jest/globals';
import { LinearAuth } from '../auth.js';
import { getRuntimeCapabilities } from '../core/capabilities.js';
import { HandlerFactory } from '../core/handlers/handler.factory.js';

describe('HandlerFactory', () => {
  const runtimeCapabilities = getRuntimeCapabilities({
    transport: 'stream',
    host: '127.0.0.1',
    port: 43111,
    path: '/mcp',
  });

  it('reuses feature handlers within the same auth context', () => {
    const factory = new HandlerFactory(runtimeCapabilities);
    const auth = new LinearAuth();

    const getIssue = factory.getHandlerForTool('linear_get_issue', auth);
    const createIssue = factory.getHandlerForTool('linear_create_issue', auth);
    const capabilities = factory.getHandlerForTool('linear_get_capabilities', auth);
    const stopSubscription = factory.getHandlerForTool('linear_stop_subscription', auth);

    expect(getIssue.handler).toBe(createIssue.handler);
    expect(getIssue.method).toBe('handleGetIssue');
    expect(createIssue.method).toBe('handleCreateIssue');

    expect(capabilities.handler).toBe(stopSubscription.handler);
    expect(capabilities.method).toBe('handleGetCapabilities');
    expect(stopSubscription.method).toBe('handleStopSubscription');
  });

  it('keeps handler reuse isolated to the active auth context', () => {
    const factory = new HandlerFactory(runtimeCapabilities);
    const firstAuth = new LinearAuth();
    const secondAuth = new LinearAuth();

    const firstIssueHandler = factory.getHandlerForTool('linear_get_issue', firstAuth);
    const secondIssueHandler = factory.getHandlerForTool('linear_get_issue', secondAuth);
    const firstAuthHandler = factory.getHandlerForTool('linear_auth', firstAuth);
    const secondAuthHandler = factory.getHandlerForTool('linear_auth', secondAuth);

    expect(firstIssueHandler.handler).not.toBe(secondIssueHandler.handler);
    expect(firstAuthHandler.handler).not.toBe(secondAuthHandler.handler);
  });

  it('throws for unknown tools', () => {
    const factory = new HandlerFactory(runtimeCapabilities);

    expect(() => factory.getHandlerForTool('linear_unknown_tool', new LinearAuth())).toThrow(
      'No handler found for tool: linear_unknown_tool'
    );
  });
});
