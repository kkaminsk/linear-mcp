import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LinearAuth } from '../auth.js';
import { CommentHandler } from '../features/comments/handlers/comment.handler.js';
import {
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
  ResolveCommentInput,
  ResolveCommentResponse,
  UnresolveCommentInput,
  UnresolveCommentResponse,
  UpdateCommentInput,
  UpdateCommentResponse,
} from '../features/comments/types/comment.types.js';

type MockCommentClient = {
  getComment: jest.MockedFunction<(args: GetCommentInput) => Promise<GetCommentResponse>>;
  listComments: jest.MockedFunction<(args?: ListCommentsInput) => Promise<ListCommentsResponse>>;
  getIssueComments: jest.MockedFunction<(args: GetIssueCommentsInput) => Promise<GetIssueCommentsResponse>>;
  findIssueByIdentifier: jest.MockedFunction<(identifier: string, extraFilter?: Record<string, unknown>) => Promise<unknown | undefined>>;
  createComment: jest.MockedFunction<(args: CreateCommentInput) => Promise<CreateCommentResponse>>;
  updateComment: jest.MockedFunction<(args: UpdateCommentInput) => Promise<UpdateCommentResponse>>;
  deleteComment: jest.MockedFunction<(args: DeleteCommentInput) => Promise<DeleteCommentResponse>>;
  resolveComment: jest.MockedFunction<(args: ResolveCommentInput) => Promise<ResolveCommentResponse>>;
  unresolveComment: jest.MockedFunction<(args: UnresolveCommentInput) => Promise<UnresolveCommentResponse>>;
};

describe('CommentHandler', () => {
  let handler: CommentHandler;
  let mockClient: MockCommentClient;

  beforeEach(() => {
    mockClient = {
      getComment: jest.fn<(args: GetCommentInput) => Promise<GetCommentResponse>>(),
      listComments: jest.fn<(args?: ListCommentsInput) => Promise<ListCommentsResponse>>(),
      getIssueComments: jest.fn<(args: GetIssueCommentsInput) => Promise<GetIssueCommentsResponse>>(),
      findIssueByIdentifier: jest.fn<(identifier: string, extraFilter?: Record<string, unknown>) => Promise<unknown | undefined>>(),
      createComment: jest.fn<(args: CreateCommentInput) => Promise<CreateCommentResponse>>(),
      updateComment: jest.fn<(args: UpdateCommentInput) => Promise<UpdateCommentResponse>>(),
      deleteComment: jest.fn<(args: DeleteCommentInput) => Promise<DeleteCommentResponse>>(),
      resolveComment: jest.fn<(args: ResolveCommentInput) => Promise<ResolveCommentResponse>>(),
      unresolveComment: jest.fn<(args: UnresolveCommentInput) => Promise<UnresolveCommentResponse>>(),
    };

    const auth = {
      isAuthenticated: jest.fn(() => true),
      ensureAuthenticatedClient: jest.fn(async () => undefined),
      getGraphQLClient: jest.fn(() => mockClient),
    } as unknown as LinearAuth;

    handler = new CommentHandler(auth);
  });

  it('returns a structured direct comment payload', async () => {
    mockClient.getComment.mockResolvedValueOnce({
      comment: {
        id: 'comment-1',
        body: 'Hello from Linear',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        issueId: 'issue-1',
        user: {
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com',
        },
        issue: {
          id: 'issue-1',
          identifier: 'TEST-1',
          title: 'Test Issue',
          url: 'https://linear.app/test/issue/TEST-1',
        },
      },
    });

    const result = await handler.handleGetComment({ id: 'comment-1' });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      comment: {
        id: 'comment-1',
        body: 'Hello from Linear',
        issueId: 'issue-1',
        issue: {
          id: 'issue-1',
          identifier: 'TEST-1',
        },
        user: {
          id: 'user-1',
          email: 'test@example.com',
        },
      },
    });
  });

  it('returns paginated top-level comments with shared projection metadata', async () => {
    mockClient.listComments.mockResolvedValueOnce({
      comments: {
        nodes: [
          {
            id: 'comment-1',
            body: 'Workspace comment',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            issueId: 'issue-1',
            user: {
              id: 'user-1',
              name: 'Commenter',
            },
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
          hasPreviousPage: true,
          startCursor: 'cursor-1',
        },
      },
    });

    const result = await handler.handleListComments({
      last: 5,
      before: 'cursor-1',
      includeArchived: true,
    });

    expect(mockClient.listComments).toHaveBeenCalledWith({
      last: 5,
      before: 'cursor-1',
      includeArchived: true,
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      comments: [
        {
          id: 'comment-1',
          body: 'Workspace comment',
          issueId: 'issue-1',
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
        hasPreviousPage: true,
        startCursor: 'cursor-1',
      },
    });
  });

  it('returns paginated issue comments with shared projection metadata', async () => {
    mockClient.findIssueByIdentifier.mockResolvedValueOnce({
      id: 'issue-1',
      identifier: 'TEST-1',
    });
    mockClient.getIssueComments.mockResolvedValueOnce({
      issue: {
        id: 'issue-1',
        identifier: 'TEST-1',
        title: 'Test Issue',
        url: 'https://linear.app/test/issue/TEST-1',
        comments: {
          nodes: [
            {
              id: 'comment-1',
              body: 'Top-level comment',
              createdAt: '2024-01-01T00:00:00.000Z',
              updatedAt: '2024-01-01T00:00:00.000Z',
              user: {
                id: 'user-1',
                name: 'Commenter',
              },
            },
          ],
          pageInfo: {
            hasNextPage: true,
            endCursor: 'cursor-2',
            hasPreviousPage: false,
            startCursor: 'cursor-1',
          },
        },
      },
    });

    const result = await handler.handleGetIssueComments({
      issueId: 'TEST-1',
      first: 10,
      filter: {
        parent: {
          null: true,
        },
      },
      orderBy: 'updatedAt',
    });

    expect(mockClient.findIssueByIdentifier).toHaveBeenCalledWith('TEST-1');
    expect(mockClient.getIssueComments).toHaveBeenCalledWith({
      issueId: 'issue-1',
      first: 10,
      filter: {
        parent: {
          null: true,
        },
      },
      orderBy: 'updatedAt',
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      issue: {
        id: 'issue-1',
        identifier: 'TEST-1',
        title: 'Test Issue',
      },
      comments: [
        {
          id: 'comment-1',
          body: 'Top-level comment',
          user: {
            id: 'user-1',
            name: 'Commenter',
          },
        },
      ],
      pageInfo: {
        hasNextPage: true,
        endCursor: 'cursor-2',
        hasPreviousPage: false,
        startCursor: 'cursor-1',
      },
    });
  });

  it('creates a threaded reply with parentId-only input', async () => {
    mockClient.createComment.mockResolvedValueOnce({
      commentCreate: {
        success: true,
        lastSyncId: 101,
        comment: {
          id: 'comment-2',
          body: 'Reply body',
          createdAt: '2024-01-01T01:00:00.000Z',
          updatedAt: '2024-01-01T01:00:00.000Z',
          parentId: 'comment-1',
          user: {
            id: 'user-1',
            name: 'Commenter',
          },
          parent: {
            id: 'comment-1',
            body: 'Parent comment',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            user: {
              id: 'user-2',
              name: 'Parent User',
            },
          },
        },
      },
    });

    const result = await handler.handleCreateComment({
      body: 'Reply body',
      parentId: 'comment-1',
    });

    expect(mockClient.createComment).toHaveBeenCalledWith({
      body: 'Reply body',
      parentId: 'comment-1',
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: true,
      lastSyncId: 101,
      comment: {
        id: 'comment-2',
        body: 'Reply body',
        parentId: 'comment-1',
        parent: {
          id: 'comment-1',
        },
      },
    });
  });

  it('returns a structured update payload with advanced body data passthrough', async () => {
    mockClient.updateComment.mockResolvedValueOnce({
      commentUpdate: {
        success: true,
        lastSyncId: 104,
        comment: {
          id: 'comment-1',
          body: 'Updated body',
          bodyData: {
            type: 'doc',
          },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T03:00:00.000Z',
        },
      },
    });

    const result = await handler.handleUpdateComment({
      id: 'comment-1',
      body: 'Updated body',
    });

    expect(mockClient.updateComment).toHaveBeenCalledWith({
      id: 'comment-1',
      body: 'Updated body',
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: true,
      lastSyncId: 104,
      comment: {
        id: 'comment-1',
        body: 'Updated body',
        bodyData: {
          type: 'doc',
        },
      },
    });
  });

  it('returns stable deletion metadata for delete comment', async () => {
    mockClient.deleteComment.mockResolvedValueOnce({
      commentDelete: {
        success: true,
        entityId: 'comment-1',
        lastSyncId: 102,
      },
    });

    const result = await handler.handleDeleteComment({ id: 'comment-1' });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: true,
      id: 'comment-1',
      lastSyncId: 102,
    });
  });

  it('returns structured resolution payloads', async () => {
    mockClient.resolveComment.mockResolvedValueOnce({
      commentResolve: {
        success: true,
        lastSyncId: 103,
        comment: {
          id: 'comment-1',
          body: 'Resolved comment',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T02:00:00.000Z',
          resolvedAt: '2024-01-01T02:00:00.000Z',
          resolvingCommentId: 'comment-2',
          resolvingUser: {
            id: 'user-3',
            name: 'Resolver',
          },
        },
      },
    });

    const result = await handler.handleResolveComment({
      id: 'comment-1',
      resolvingCommentId: 'comment-2',
    });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: true,
      lastSyncId: 103,
      comment: {
        id: 'comment-1',
        resolvedAt: '2024-01-01T02:00:00.000Z',
        resolvingCommentId: 'comment-2',
        resolvingUser: {
          id: 'user-3',
          name: 'Resolver',
        },
      },
    });
  });

  it('returns structured unresolve payloads', async () => {
    mockClient.unresolveComment.mockResolvedValueOnce({
      commentUnresolve: {
        success: true,
        lastSyncId: 105,
        comment: {
          id: 'comment-1',
          body: 'Unresolved comment',
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T04:00:00.000Z',
        },
      },
    });

    const result = await handler.handleUnresolveComment({ id: 'comment-1' });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: true,
      lastSyncId: 105,
      comment: {
        id: 'comment-1',
        body: 'Unresolved comment',
      },
    });
  });
});
