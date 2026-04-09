import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';

/**
 * Comment data structures
 */

export type CommentOrderBy = 'createdAt' | 'updatedAt';

export interface CommentUser {
  id: string;
  name?: string;
  email?: string;
}

export interface CommentIssueReference {
  id: string;
  title?: string;
  identifier?: string;
  url?: string;
}

export interface CommentReference {
  id: string;
  body?: string;
  url?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: CommentUser;
}

export interface Comment {
  id: string;
  body: string;
  bodyData?: Record<string, unknown> | string;
  quotedText?: string;
  url?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  resolvedAt?: string;
  issueId?: string;
  parentId?: string;
  resolvingCommentId?: string;
  reactionData?: Record<string, unknown>;
  user?: CommentUser;
  issue?: CommentIssueReference;
  parent?: CommentReference;
  resolvingComment?: CommentReference;
  resolvingUser?: CommentUser;
}

export interface CommentPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
  hasPreviousPage?: boolean;
  startCursor?: string | null;
}

export interface CommentConnection {
  nodes: Comment[];
  pageInfo: CommentPageInfo;
}

export interface CommentCollectionInput {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  filter?: Record<string, unknown>;
  includeArchived?: boolean;
  orderBy?: CommentOrderBy | string;
}

/**
 * Input types for comment operations
 */

export interface CreateCommentInput {
  body: string;
  issueId?: string;
  parentId?: string;
  bodyData?: Record<string, unknown>;
  quotedText?: string;
  createAsUser?: string;
  displayIconUrl?: string;
}

export interface GetCommentInput {
  id: string;
}

export interface ListCommentsInput extends CommentCollectionInput {}

export interface UpdateCommentInput {
  id: string;
  body?: string;
  bodyData?: Record<string, unknown>;
  quotedText?: string;
}

export interface DeleteCommentInput {
  id: string;
}

export interface ResolveCommentInput {
  id: string;
  resolvingCommentId?: string;
}

export interface UnresolveCommentInput {
  id: string;
}

export interface GetIssueCommentsInput extends CommentCollectionInput {
  issueId: string;
}

/**
 * Response types for comment operations
 */

export interface CommentMutationPayload {
  success: boolean;
  comment?: Comment;
  lastSyncId: number;
}

export interface CreateCommentResponse {
  commentCreate: CommentMutationPayload;
}

export interface UpdateCommentResponse {
  commentUpdate: CommentMutationPayload;
}

export interface ResolveCommentResponse {
  commentResolve: CommentMutationPayload;
}

export interface UnresolveCommentResponse {
  commentUnresolve: CommentMutationPayload;
}

export interface DeleteCommentResponse {
  commentDelete: {
    success: boolean;
    entityId: string;
    lastSyncId: number;
  };
}

export interface GetCommentResponse {
  comment: Comment;
}

export interface ListCommentsResponse {
  comments: CommentConnection;
}

export interface GetIssueCommentsResponse {
  issue: CommentIssueReference & {
    comments: CommentConnection;
  };
}

/**
 * Handler method types
 */

export interface CommentHandlerMethods {
  handleGetComment(args: GetCommentInput): Promise<BaseToolResponse>;
  handleListComments(args: ListCommentsInput): Promise<BaseToolResponse>;
  handleGetIssueComments(args: GetIssueCommentsInput): Promise<BaseToolResponse>;
  handleCreateComment(args: CreateCommentInput): Promise<BaseToolResponse>;
  handleUpdateComment(args: UpdateCommentInput): Promise<BaseToolResponse>;
  handleDeleteComment(args: DeleteCommentInput): Promise<BaseToolResponse>;
  handleResolveComment(args: ResolveCommentInput): Promise<BaseToolResponse>;
  handleUnresolveComment(args: UnresolveCommentInput): Promise<BaseToolResponse>;
}
