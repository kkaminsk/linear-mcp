import type { LinearClient } from '@linear/sdk';

export interface GetWebhookInput {
  id: string;
}

export interface ListWebhooksInput {
  teamId?: string;
  first?: number;
  after?: string;
}

export type CreateWebhookInput = Parameters<LinearClient['createWebhook']>[0];
