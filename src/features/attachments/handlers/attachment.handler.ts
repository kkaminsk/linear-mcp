import { LinearAuth } from '../../../auth.js';
import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import {
  asRecord,
  compactObject,
  getBoolean,
  getDateString,
  getString,
  mapConnection,
  resolveValue,
} from '../../../types/sdk.utils.js';
import {
  CreateAttachmentInput,
  GetAttachmentInput,
  ListAttachmentsInput,
  UpdateAttachmentInput,
} from '../types/attachment.types.js';

export class AttachmentHandler extends BaseHandler {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleGetAttachment(args: GetAttachmentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const attachment = await client.executeSdk(
        'attachment',
        () => client.sdk.attachment(args.id)
      );

      return this.createStructuredResponse(
        `Fetched attachment ${getString(attachment, 'title') ?? args.id}`,
        {
          attachment: await this.mapAttachment(attachment),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get attachment');
    }
  }

  async handleListAttachments(args: ListAttachmentsInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const connection = args.issueId
        ? await client.executeSdk('issue.attachments', async () => {
            const issue = await client.sdk.issue(args.issueId!);
            return issue.attachments({
              filter: args.filter,
              first: args.first ?? 50,
              after: args.after,
            });
          })
        : await client.executeSdk(
            'attachments',
            () => client.sdk.attachments({
              filter: args.filter,
              first: args.first ?? 50,
              after: args.after,
            })
          );

      const mapped = await mapConnection(connection, attachment => this.mapAttachment(attachment));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} attachments`,
        {
          attachments: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list attachments');
    }
  }

  async handleCreateAttachment(args: CreateAttachmentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['title', 'url', 'issueId']);

      const payload = await client.executeSdk(
        'createAttachment',
        () => client.sdk.createAttachment(args)
      );
      const attachment = await resolveValue(asRecord(payload).attachment as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Created attachment ${getString(attachment, 'title') ?? args.title}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          attachment: await this.mapAttachment(attachment),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create attachment');
    }
  }

  async handleUpdateAttachment(args: UpdateAttachmentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id', 'title']);

      const { id, ...input } = args;
      const payload = await client.executeSdk(
        'updateAttachment',
        () => client.sdk.updateAttachment(id, input)
      );
      const attachment = await resolveValue(asRecord(payload).attachment as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Updated attachment ${getString(attachment, 'title') ?? id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          attachment: await this.mapAttachment(attachment),
        }
      );
    } catch (error) {
      return this.handleError(error, 'update attachment');
    }
  }

  async handleDeleteAttachment(args: GetAttachmentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const payload = await client.executeSdk(
        'deleteAttachment',
        () => client.sdk.deleteAttachment(args.id)
      );

      return this.createStructuredResponse(
        `Deleted attachment ${args.id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          id: args.id,
        }
      );
    } catch (error) {
      return this.handleError(error, 'delete attachment');
    }
  }

  private async mapAttachment(attachment: unknown): Promise<Record<string, unknown>> {
    if (!attachment) {
      return {};
    }

    const record = asRecord(attachment);
    const issue = await resolveValue(record.issue as Promise<unknown> | unknown);
    const creator = await resolveValue(record.creator as Promise<unknown> | unknown);

    return compactObject({
      id: getString(record, 'id'),
      title: getString(record, 'title'),
      subtitle: getString(record, 'subtitle'),
      url: getString(record, 'url'),
      iconUrl: getString(record, 'iconUrl'),
      metadata: record.metadata as Record<string, unknown> | undefined,
      createdAt: getDateString(record, 'createdAt'),
      updatedAt: getDateString(record, 'updatedAt'),
      issue: this.mapReference(issue, ['id', 'identifier', 'title']),
      creator: this.mapReference(creator, ['id', 'name', 'displayName']),
    });
  }

  private mapReference(
    value: unknown,
    keys: string[]
  ): Record<string, unknown> | undefined {
    if (!value) {
      return undefined;
    }

    const record = asRecord(value);
    return compactObject(
      Object.fromEntries(keys.map(key => [key, getString(record, key)]))
    );
  }
}
