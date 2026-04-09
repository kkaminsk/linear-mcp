import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { LinearAuth } from '../auth';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Mock fetch
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

describe('LinearAuth', () => {
  let auth: LinearAuth;

  beforeEach(() => {
    auth = new LinearAuth();
  });

  describe('initialize', () => {
    it('should initialize with valid OAuth credentials', () => {
      expect(() => {
        auth.initialize({
          type: 'oauth',
          clientId: 'test-client-id',
          clientSecret: 'test-client-secret',
          redirectUri: 'http://localhost:3000/callback'
        });
      }).not.toThrow();
    });

    it('should initialize with valid Personal Access Token', () => {
      expect(() => {
        auth.initialize({
          type: 'api',
          apiKey: 'test-access-token'
        });
      }).not.toThrow();

      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.needsTokenRefresh()).toBe(false);
    });

    it('should throw error when missing required OAuth parameters', () => {
      expect(() => {
        auth.initialize({
          type: 'oauth',
          clientId: 'test-client-id',
          // Missing clientSecret and redirectUri
        } as any);
      }).toThrow();
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should return valid authorization URL with OAuth config', () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      const url = auth.getAuthorizationUrl();
      expect(url).toContain('https://linear.app/oauth/authorize');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(url).toContain('scope=read%2Cwrite%2Cissues%3Acreate');
      expect(url).toContain('actor=app');
      expect(url).toContain('state=');
      expect(url).not.toContain('offline_access');
      expect(url).not.toContain('access_type=');
    });

    it('should throw error when called with API Key config', () => {
      auth.initialize({
        type: 'api',
        apiKey: 'test-access-token'
      });

      expect(() => {
        auth.getAuthorizationUrl();
      }).toThrow();
    });

    it('should throw error when called before initialization', () => {
      expect(() => {
        auth.getAuthorizationUrl();
      }).toThrow();
    });
  });

  describe('handleCallback', () => {
    it('should handle valid authorization code with OAuth config', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Mock the token exchange
      mockFetch.mockResolvedValueOnce(new Response(
        JSON.stringify({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600
        }),
        { status: 200 }
      ));

      auth.getAuthorizationUrl();
      const state = auth.getPendingOAuthState();

      await expect(auth.handleCallback('valid-code', state!)).resolves.not.toThrow();
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('should throw error when called with API Key config', async () => {
      auth.initialize({
        type: 'api',
        apiKey: 'test-access-token'
      });

      await expect(auth.handleCallback('valid-code', 'state')).rejects.toThrow();
    });

    it('should throw error for invalid authorization code', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Mock failed token exchange
      mockFetch.mockResolvedValueOnce(new Response(
        JSON.stringify({
          error: 'invalid_grant'
        }),
        { status: 400 }
      ));

      auth.getAuthorizationUrl();
      const state = auth.getPendingOAuthState();

      await expect(auth.handleCallback('invalid-code', state!)).rejects.toThrow();
    });

    it('should reject callback state mismatches', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      auth.getAuthorizationUrl();

      await expect(auth.handleCallback('valid-code', 'wrong-state')).rejects.toThrow(
        'OAuth callback state did not match the issued authorization request'
      );
    });

    it('should require a fresh state after a successful callback', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      mockFetch.mockResolvedValueOnce(new Response(
        JSON.stringify({
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600
        }),
        { status: 200 }
      ));

      auth.getAuthorizationUrl();
      const state = auth.getPendingOAuthState();

      await auth.handleCallback('valid-code', state!);

      await expect(auth.handleCallback('valid-code', state!)).rejects.toThrow(
        'No pending OAuth authorization request was found'
      );
    });
  });

  describe('needsTokenRefresh', () => {
    it('should return true when OAuth token is expired', () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Set expired token
      auth.setTokenData({
        apiKey: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 1000
      });

      expect(auth.needsTokenRefresh()).toBe(true);
    });

    it('should return false for valid OAuth token', () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Set valid token
      auth.setTokenData({
        apiKey: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000 // 1 hour from now
      });

      expect(auth.needsTokenRefresh()).toBe(false);
    });

    it('should return false for API Key', () => {
      auth.initialize({
        type: 'api',
        apiKey: 'test-access-token'
      });

      expect(auth.needsTokenRefresh()).toBe(false);
    });
  });

  describe('refreshAPIKey', () => {
    it('should successfully refresh OAuth token', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Set initial token data
      auth.setTokenData({
        apiKey: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 1000 // Expired
      });

      // Mock successful token refresh
      mockFetch.mockResolvedValueOnce(new Response(
        JSON.stringify({
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600
        }),
        { status: 200 }
      ));

      await expect(auth.refreshAPIKey()).resolves.not.toThrow();
    });

    it('should throw error when refresh fails', async () => {
      auth.initialize({
        type: 'oauth',
        clientId: 'test-client-id',
        clientSecret: 'test-client-secret',
        redirectUri: 'http://localhost:3000/callback'
      });

      // Set initial token data
      auth.setTokenData({
        apiKey: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() - 1000 // Expired
      });

      // Mock failed token refresh
      mockFetch.mockResolvedValueOnce(new Response(
        JSON.stringify({
          error: 'invalid_grant'
        }),
        { status: 400 }
      ));

      await expect(auth.refreshAPIKey()).rejects.toThrow();
    });

    it('should throw error when called with API Key config', async () => {
      auth.initialize({
        type: 'api',
        apiKey: 'test-access-token'
      });

      await expect(auth.refreshAPIKey()).rejects.toThrow();
    });
  });
});
