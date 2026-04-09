import { describe, expect, it } from '@jest/globals';
import { LinearAuth } from '../auth';
import { getRuntimeCapabilities } from '../core/capabilities';
import { SubscriptionHandler } from '../features/subscriptions/handlers/subscription.handler';
import { getAdvertisedToolSchemas } from '../core/types/tool.types';

describe('runtime capabilities', () => {
  it('hides subscription tools for stdio transport', () => {
    const capabilities = getRuntimeCapabilities({ transport: 'stdio' });
    const toolNames = getAdvertisedToolSchemas(capabilities).map(tool => tool.name);

    expect(capabilities.endpoint).toBeNull();
    expect(toolNames).toContain('linear_get_capabilities');
    expect(toolNames).not.toContain('linear_start_subscription');
    expect(toolNames).not.toContain('linear_stop_subscription');
  });

  it('advertises subscription tools for streaming transport', () => {
    const capabilities = getRuntimeCapabilities({
      transport: 'stream',
      streamingSupported: true,
    });
    const toolNames = getAdvertisedToolSchemas(capabilities).map(tool => tool.name);

    expect(capabilities.endpoint).toBe('http://127.0.0.1:3000/mcp');
    expect(toolNames).toContain('linear_start_subscription');
    expect(toolNames).toContain('linear_stop_subscription');
  });

  it('returns a structured capability limitation for unsupported subscriptions', async () => {
    const handler = new SubscriptionHandler(
      new LinearAuth(),
      getRuntimeCapabilities({ transport: 'stdio' })
    );

    const result = await handler.handleStartSubscription({ topic: 'issues' });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      error: {
        type: 'capability',
        capability: 'subscriptions',
        runtimeSupported: false,
        transport: 'stdio',
      },
    });
  });
});
