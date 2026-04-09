import { describe, expect, it } from '@jest/globals';
import { LinearAuth } from '../auth.js';
import { AuthHandler } from '../features/auth/handlers/auth.handler.js';

describe('AuthHandler', () => {
  it('returns callback guidance with the issued OAuth state', async () => {
    const handler = new AuthHandler(new LinearAuth());

    const result = await handler.handleAuth({
      clientId: 'client-id',
      clientSecret: 'client-secret',
      redirectUri: 'http://localhost:3000/callback',
    });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      actor: 'app',
    });
    expect(result.structuredContent?.state).toEqual(expect.any(String));
    expect(result.structuredContent?.nextStep).toContain('linear_auth_callback');
    expect(result.structuredContent?.nextStep).toContain('single-use');
  });
});
