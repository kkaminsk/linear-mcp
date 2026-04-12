import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';

/**
 * Handler for authentication-related operations.
 * Manages both OAuth and API Key authentication flows.
 */
export class AuthHandler extends BaseHandler {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  /**
   * Initializes OAuth flow with Linear.
   */
  async handleAuth(args: any): Promise<BaseToolResponse> {
    try {
      this.validateRequiredParams(args, ['clientId', 'clientSecret', 'redirectUri']);

      this.auth.initialize({
        type: 'oauth',
        clientId: args.clientId,
        clientSecret: args.clientSecret,
        redirectUri: args.redirectUri,
      });

      const authUrl = this.auth.getAuthorizationUrl();

      return this.createStructuredResponse(
        'Generated Linear OAuth authorization URL',
        {
          authorizationUrl: authUrl,
          state: this.auth.getPendingOAuthState() ?? null,
          actor: 'app',
          nextStep: 'Open authorizationUrl, authorize the app, then call linear_auth_callback with both the returned code and this exact state. The state is single-use.',
        }
      );
    } catch (error) {
      return this.handleError(error, 'initialize authentication');
    }
  }

  /**
   * Handles OAuth callback after user authorization.
   */
  async handleAuthCallback(args: any): Promise<BaseToolResponse> {
    try {
      this.validateRequiredParams(args, ['code', 'state']);

      await this.auth.handleCallback(args.code, args.state);

      return this.createStructuredResponse(
        'Successfully authenticated with Linear',
        {
          authenticated: true,
        }
      );
    } catch (error) {
      return this.handleError(error, 'handle authentication callback');
    }
  }
}
