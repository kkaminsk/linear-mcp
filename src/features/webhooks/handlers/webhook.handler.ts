import { LinearAuth } from '../../../auth.js';
import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import {
  asRecord,
  compactObject,
  getArray,
  getBoolean,
  getDateString,
  getString,
  mapConnection,
  resolveValue,
} from '../../../types/sdk.utils.js';
import { CreateWebhookInput, GetWebhookInput, ListWebhooksInput } from '../types/webhook.types.js';

export class WebhookHandler extends BaseHandler {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleGetWebhook(args: GetWebhookInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const webhook = await client.executeSdk(
        'webhook',
        () => client.sdk.webhook(args.id)
      );

      return this.createStructuredResponse(
        `Fetched webhook ${getString(webhook, 'label') ?? args.id}`,
        {
          webhook: await this.mapWebhook(webhook),
          verificationGuidance: this.getVerificationGuidance(),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get webhook');
    }
  }

  async handleListWebhooks(args: ListWebhooksInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const connection = args.teamId
        ? await client.executeSdk('team.webhooks', async () => {
            const team = await client.sdk.team(args.teamId!);
            return team.webhooks({
              first: args.first ?? 50,
              after: args.after,
            });
          })
        : await client.executeSdk(
            'webhooks',
            () => client.sdk.webhooks({
              first: args.first ?? 50,
              after: args.after,
            })
          );

      const mapped = await mapConnection(connection, webhook => this.mapWebhook(webhook));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} webhooks`,
        {
          webhooks: mapped.nodes,
          pageInfo: mapped.pageInfo,
          verificationGuidance: this.getVerificationGuidance(),
        }
      );
    } catch (error) {
      return this.handleError(error, 'list webhooks');
    }
  }

  async handleCreateWebhook(args: CreateWebhookInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['url', 'resourceTypes']);

      const payload = await client.executeSdk(
        'createWebhook',
        () => client.sdk.createWebhook(args)
      );
      const webhook = await resolveValue(asRecord(payload).webhook as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Created webhook ${getString(webhook, 'label') ?? getString(webhook, 'id') ?? args.url}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          webhook: await this.mapWebhook(webhook),
          verificationGuidance: this.getVerificationGuidance(),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create webhook');
    }
  }

  async handleDeleteWebhook(args: GetWebhookInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const payload = await client.executeSdk(
        'deleteWebhook',
        () => client.sdk.deleteWebhook(args.id)
      );

      return this.createStructuredResponse(
        `Deleted webhook ${args.id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          id: args.id,
          verificationGuidance: this.getVerificationGuidance(),
        }
      );
    } catch (error) {
      return this.handleError(error, 'delete webhook');
    }
  }

  private async mapWebhook(webhook: unknown): Promise<Record<string, unknown>> {
    if (!webhook) {
      return {};
    }

    const record = asRecord(webhook);
    const team = await resolveValue(record.team as Promise<unknown> | unknown);

    return compactObject({
      id: getString(record, 'id'),
      label: getString(record, 'label'),
      url: getString(record, 'url'),
      enabled: getBoolean(record, 'enabled'),
      resourceTypes: getArray(record, 'resourceTypes'),
      createdAt: getDateString(record, 'createdAt'),
      updatedAt: getDateString(record, 'updatedAt'),
      team: team ? compactObject({
        id: getString(team, 'id'),
        name: getString(team, 'name'),
        key: getString(team, 'key'),
      }) : undefined,
    });
  }

  private getVerificationGuidance(): Record<string, unknown> {
    return {
      message: 'Validate the Linear webhook signature with the configured secret before accepting delivered webhook payloads.',
      secretHandling: 'Store the webhook secret outside the repository and rotate it if delivery verification is compromised.',
    };
  }
}
