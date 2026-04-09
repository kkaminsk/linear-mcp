import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import {
  getString,
} from '../../../types/sdk.utils.js';
import {
  CommentHandlerMethods,
  CreateCommentInput,
  CreateCommentResponse,
  DeleteCommentInput,
  DeleteCommentResponse,
  GetCommentInput,
  GetCommentResponse,
  GetIssueCommentsInput,
  GetIssueCommentsResponse,
  ListCommentsInput,
  ListCommentsResponse,
  ResolveCommentResponse,
  ResolveCommentInput,
  UnresolveCommentInput,
  UnresolveCommentResponse,
  UpdateCommentInput,
  UpdateCommentResponse,
} from '../types/comment.types.js';
import {
  mapComment,
  mapCommentConnection,
  mapCommentIssueReference,
} from '../comment.mapper.js';

export class CommentHandler extends BaseHandler implements CommentHandlerMethods {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleGetComment(args: GetCommentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const result = await client.getComment(args) as GetCommentResponse;
      if (!result.comment) {
        throw new Error(`Comment ${args.id} was not found`);
      }

      return this.createStructuredResponse(
        `Fetched comment ${args.id}`,
        {
          comment: await mapComment(result.comment),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get comment');
    }
  }

  async handleListComments(args: ListCommentsInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const result = await client.listComments(args) as ListCommentsResponse;
      const comments = await mapCommentConnection(result.comments);

      return this.createStructuredResponse(
        `Listed ${comments.nodes.length} comments`,
        {
          comments: comments.nodes,
          pageInfo: comments.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list comments');
    }
  }

  async handleGetIssueComments(args: GetIssueCommentsInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['issueId']);

      const result = await client.getIssueComments(args) as GetIssueCommentsResponse;
      if (!result.issue) {
        throw new Error(`Issue ${args.issueId} was not found`);
      }

      const comments = await mapCommentConnection(result.issue.comments);

      return this.createStructuredResponse(
        `Fetched ${comments.nodes.length} comments for issue ${result.issue.title ?? args.issueId}`,
        {
          issue: mapCommentIssueReference(result.issue),
          comments: comments.nodes,
          pageInfo: comments.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'get issue comments');
    }
  }

  async handleCreateComment(args: CreateCommentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['body']);

      if (!args.issueId && !args.parentId) {
        throw new Error('Creating a comment requires issueId or parentId');
      }

      const result = await client.createComment(args) as CreateCommentResponse;
      return this.createCommentMutationResponse(result.commentCreate, 'Created');
    } catch (error) {
      return this.handleError(error, 'create comment');
    }
  }

  async handleUpdateComment(args: UpdateCommentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      if (
        args.body === undefined
        && args.bodyData === undefined
        && args.quotedText === undefined
      ) {
        throw new Error('Updating a comment requires body, bodyData, or quotedText');
      }

      const result = await client.updateComment(args) as UpdateCommentResponse;
      return this.createCommentMutationResponse(result.commentUpdate, 'Updated');
    } catch (error) {
      return this.handleError(error, 'update comment');
    }
  }

  async handleDeleteComment(args: DeleteCommentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const result = await client.deleteComment(args) as DeleteCommentResponse;
      if (!result.commentDelete.success) {
        throw new Error('Failed to delete comment');
      }

      return this.createStructuredResponse(
        `Deleted comment ${result.commentDelete.entityId || args.id}`,
        {
          success: true,
          id: result.commentDelete.entityId,
          lastSyncId: result.commentDelete.lastSyncId,
        }
      );
    } catch (error) {
      return this.handleError(error, 'delete comment');
    }
  }

  async handleResolveComment(args: ResolveCommentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const result = await client.resolveComment(args) as ResolveCommentResponse;
      return this.createCommentMutationResponse(result.commentResolve, 'Resolved');
    } catch (error) {
      return this.handleError(error, 'resolve comment');
    }
  }

  async handleUnresolveComment(args: UnresolveCommentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const result = await client.unresolveComment(args) as UnresolveCommentResponse;
      return this.createCommentMutationResponse(result.commentUnresolve, 'Unresolved');
    } catch (error) {
      return this.handleError(error, 'unresolve comment');
    }
  }

  private async createCommentMutationResponse(
    payload: {
      success: boolean;
      comment?: unknown;
      lastSyncId: number;
    },
    verb: string
  ): Promise<BaseToolResponse> {
    if (!payload.success) {
      throw new Error(`Failed to ${verb.toLowerCase()} comment`);
    }

    if (!payload.comment) {
      throw new Error('Comment mutation did not return a comment');
    }

    const comment = await mapComment(payload.comment);
    const commentId = getString(comment, 'id');

    return this.createStructuredResponse(
      commentId ? `${verb} comment ${commentId}` : `${verb} comment`,
      {
        success: true,
        lastSyncId: payload.lastSyncId,
        comment,
      }
    );
  }
}
