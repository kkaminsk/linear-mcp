import type { LinearClient } from '@linear/sdk';

export interface GetAttachmentInput {
  id: string;
}

export interface ListAttachmentsInput {
  filter?: NonNullable<Parameters<LinearClient['attachments']>[0]>['filter'];
  issueId?: string;
  first?: number;
  after?: string;
}

export type CreateAttachmentInput = Parameters<LinearClient['createAttachment']>[0];

export type UpdateAttachmentInput = {
  id: string;
} & Parameters<LinearClient['updateAttachment']>[1];
