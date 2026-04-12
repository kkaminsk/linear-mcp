import { randomBytes } from 'node:crypto';
import { LinearClient } from '@linear/sdk';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import {
  DEFAULT_OAUTH_REQUEST_TIMEOUT_MS,
  executeWithRequestPolicy,
} from './core/request-policy.js';
import { LinearGraphQLClient } from './graphql/client.js';

export interface OAuthConfig {
  type: 'oauth';
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface APIKeyConfig {
  type: 'api';
  apiKey: string;
}

export type AuthConfig = OAuthConfig | APIKeyConfig;

export interface TokenData {
  apiKey: string;
  refreshToken: string;
  expiresAt: number;
}

export interface LinearAuthOptions {
  oauthRequestTimeoutMs?: number;
}

export class LinearAuth {
  private static readonly OAUTH_AUTH_URL = 'https://linear.app/oauth';
  private static readonly OAUTH_TOKEN_URL = 'https://api.linear.app';
  private static readonly OAUTH_SCOPE = 'read,write,issues:create';
  private static readonly OAUTH_ACTOR = 'app';
  private config?: AuthConfig;
  private tokenData?: TokenData;
  private linearClient?: LinearClient;
  private pendingOAuthState?: string;
  private refreshPromise?: Promise<void>;

  constructor(private readonly options: LinearAuthOptions = {}) {}

  public getAuthorizationUrl(): string {
    const config = this.getOAuthConfig();
    const state = this.generateState();
    this.pendingOAuthState = state;

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: LinearAuth.OAUTH_SCOPE,
      actor: LinearAuth.OAUTH_ACTOR,
      state,
    });

    return `${LinearAuth.OAUTH_AUTH_URL}/authorize?${params.toString()}`;
  }

  public async handleCallback(code: string, state: string): Promise<void> {
    const config = this.getOAuthConfig();

    if (!this.pendingOAuthState) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'No pending OAuth authorization request was found. Call linear_auth again to obtain a fresh authorization URL and state.'
      );
    }

    if (state !== this.pendingOAuthState) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'OAuth callback state did not match the issued authorization request. Authorization URLs are single-use; call linear_auth again to obtain a fresh state.'
      );
    }

    this.pendingOAuthState = undefined;

    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.redirectUri,
        code,
      });

      const data = await this.exchangeToken(params, 'OAuth token exchange');
      this.setActiveToken({
        apiKey: data.access_token,
        refreshToken: data.refresh_token ?? '',
        expiresAt: Date.now() + data.expires_in * 1000,
      });
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `OAuth token exchange failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  public async refreshAPIKey(): Promise<void> {
    if (this.refreshPromise) {
      await this.refreshPromise;
      return;
    }

    this.refreshPromise = this.performRefresh();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = undefined;
    }
  }

  public async ensureAuthenticatedClient(): Promise<LinearClient> {
    if (!this.isAuthenticated()) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Not authenticated. Call linear_auth first.'
      );
    }

    if (this.needsTokenRefresh()) {
      await this.refreshAPIKey();
    }

    return this.getClient();
  }

  public initialize(config: AuthConfig): void {
    this.config = config;
    this.pendingOAuthState = undefined;

    if (config.type === 'api') {
      this.setActiveToken({
        apiKey: config.apiKey,
        refreshToken: '',
        expiresAt: Number.MAX_SAFE_INTEGER,
      });
    } else {
      if (!config.clientId || !config.clientSecret || !config.redirectUri) {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Missing required OAuth parameters: clientId, clientSecret, redirectUri'
        );
      }
      this.tokenData = undefined;
      this.linearClient = undefined;
    }
  }

  public getClient(): LinearClient {
    if (!this.linearClient) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Linear client not initialized'
      );
    }
    return this.linearClient;
  }

  public getGraphQLClient(): LinearGraphQLClient {
    return new LinearGraphQLClient(this.getClient());
  }

  public isAuthenticated(): boolean {
    return !!this.linearClient && !!this.tokenData;
  }

  public needsTokenRefresh(): boolean {
    if (!this.tokenData || !this.config || this.config.type === 'api') return false;
    return Date.now() >= this.tokenData.expiresAt - 300000; // Refresh 5 minutes before expiry
  }

  // For testing purposes
  public setTokenData(tokenData: TokenData): void {
    this.setActiveToken(tokenData);
  }

  public getPendingOAuthState(): string | undefined {
    return this.pendingOAuthState;
  }

  public createScopedCopy(): LinearAuth {
    const copy = new LinearAuth(this.options);

    if (!this.config) {
      return copy;
    }

    copy.initialize(
      this.config.type === 'api'
        ? {
            type: 'api',
            apiKey: this.config.apiKey,
          }
        : {
            type: 'oauth',
            clientId: this.config.clientId,
            clientSecret: this.config.clientSecret,
            redirectUri: this.config.redirectUri,
          }
    );

    if (this.tokenData) {
      copy.setTokenData({
        ...this.tokenData,
      });
    }

    return copy;
  }

  private generateState(): string {
    return randomBytes(32).toString('base64url');
  }

  private getOAuthConfig(): OAuthConfig {
    if (!this.config || this.config.type !== 'oauth') {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'OAuth config not initialized'
      );
    }

    return this.config;
  }

  private setActiveToken(tokenData: TokenData): void {
    this.tokenData = tokenData;
    this.linearClient = new LinearClient({
      apiKey: tokenData.apiKey,
    });
  }

  private async performRefresh(): Promise<void> {
    const config = this.getOAuthConfig();
    if (!this.tokenData?.refreshToken) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'OAuth not initialized or no refresh token available'
      );
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: this.tokenData.refreshToken
      });

      const data = await this.exchangeToken(params, 'OAuth token refresh');
      this.setActiveToken({
        apiKey: data.access_token,
        refreshToken: data.refresh_token ?? this.tokenData.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      });
    } catch (error) {
      throw new McpError(
        ErrorCode.InternalError,
        `Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async exchangeToken(
    params: URLSearchParams,
    context: string
  ): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
  }> {
    return executeWithRequestPolicy(
      context,
      async ({ signal }) => {
        const response = await fetch(`${LinearAuth.OAUTH_TOKEN_URL}/oauth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: params.toString(),
          signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${context} failed: ${response.statusText}. Response: ${errorText}`);
        }

        const data = await response.json() as Partial<{
          access_token: string;
          refresh_token: string;
          expires_in: number;
        }>;

        if (!data.access_token || typeof data.expires_in !== 'number') {
          throw new Error(`${context} returned an incomplete token response`);
        }

        return {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
        };
      },
      {
        timeoutMs: this.options.oauthRequestTimeoutMs ?? DEFAULT_OAUTH_REQUEST_TIMEOUT_MS,
      }
    );
  }
}
