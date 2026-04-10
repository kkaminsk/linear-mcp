import { LinearAuth } from '../../../auth.js';
import { RuntimeCapabilities } from '../../../core/capabilities.js';
import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { StartSubscriptionInput, StopSubscriptionInput } from '../types/subscription.types.js';

export class SubscriptionHandler extends BaseHandler {
  constructor(
    auth: LinearAuth,
    private readonly runtimeCapabilities: RuntimeCapabilities
  ) {
    super(auth);
  }

  async handleGetCapabilities(): Promise<BaseToolResponse> {
    return this.createStructuredResponse(
      'Reported Linear MCP runtime capabilities',
      {
        server: this.runtimeCapabilities.server,
        runtime: this.runtimeCapabilities.runtime,
        transport: this.runtimeCapabilities.transport,
        endpoint: this.runtimeCapabilities.endpoint,
        streamingSupported: this.runtimeCapabilities.streamingSupported,
        capabilities: this.runtimeCapabilities.capabilities,
      }
    );
  }

  async handleStartSubscription(args: StartSubscriptionInput): Promise<BaseToolResponse> {
    try {
      this.validateRequiredParams(args, ['topic']);

      if (!this.runtimeCapabilities.supportsSubscriptions) {
        return this.createCapabilityResponse(
          'Subscriptions require a streaming runtime and are not available over stdio.',
          'subscriptions'
        );
      }

      return this.createCapabilityResponse(
        'Subscription runtime support is enabled, but no streaming subscription provider is configured for this server build.',
        'subscriptions',
        false
      );
    } catch (error) {
      return this.handleError(error, 'start subscription');
    }
  }

  async handleStopSubscription(args: StopSubscriptionInput): Promise<BaseToolResponse> {
    try {
      this.validateRequiredParams(args, ['subscriptionId']);

      if (!this.runtimeCapabilities.supportsSubscriptions) {
        return this.createCapabilityResponse(
          'Subscriptions require a streaming runtime and are not available over stdio.',
          'subscriptions'
        );
      }

      return this.createCapabilityResponse(
        'Subscription runtime support is enabled, but no streaming subscription provider is configured for this server build.',
        'subscriptions',
        false
      );
    } catch (error) {
      return this.handleError(error, 'stop subscription');
    }
  }

  private createCapabilityResponse(
    message: string,
    capability: string,
    runtimeSupported: boolean = this.runtimeCapabilities.supportsSubscriptions
  ): BaseToolResponse {
    return this.createErrorResponse(message, {
      error: {
        type: 'capability',
        capability,
        runtimeSupported,
        transport: this.runtimeCapabilities.transport,
        runtime: this.runtimeCapabilities.runtime,
        message,
      },
    });
  }
}
