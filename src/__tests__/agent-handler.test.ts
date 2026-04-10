import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LinearAuth } from '../auth.js';
import { AgentHandler } from '../features/agents/handlers/agent.handler.js';
import {
  CreateAgentActivityInput,
  CreateAgentSessionOnCommentInput,
  CreateAgentSessionOnIssueInput,
  UpdateAgentSessionInput,
} from '../features/agents/types/agent.types.js';

type MockAgentSdk = {
  agentSession: jest.MockedFunction<(id: string) => Promise<unknown>>;
  agentSessions: jest.MockedFunction<(args?: Record<string, unknown>) => Promise<unknown>>;
  agentSessionCreateOnIssue: jest.MockedFunction<(args: CreateAgentSessionOnIssueInput) => Promise<unknown>>;
  agentSessionCreateOnComment: jest.MockedFunction<(args: CreateAgentSessionOnCommentInput) => Promise<unknown>>;
  updateAgentSession: jest.MockedFunction<(id: string, input: Record<string, unknown>) => Promise<unknown>>;
  agentActivity: jest.MockedFunction<(id: string) => Promise<unknown>>;
  agentActivities: jest.MockedFunction<(args?: Record<string, unknown>) => Promise<unknown>>;
  createAgentActivity: jest.MockedFunction<(args: CreateAgentActivityInput) => Promise<unknown>>;
};

type MockAgentClient = {
  sdk: MockAgentSdk;
  executeSdk: jest.MockedFunction<(operation: string, request: () => Promise<unknown>) => Promise<unknown>>;
};

describe('AgentHandler', () => {
  let handler: AgentHandler;
  let mockClient: MockAgentClient;

  beforeEach(() => {
    const sdk: MockAgentSdk = {
      agentSession: jest.fn<(id: string) => Promise<unknown>>(),
      agentSessions: jest.fn<(args?: Record<string, unknown>) => Promise<unknown>>(),
      agentSessionCreateOnIssue: jest.fn<(args: CreateAgentSessionOnIssueInput) => Promise<unknown>>(),
      agentSessionCreateOnComment: jest.fn<(args: CreateAgentSessionOnCommentInput) => Promise<unknown>>(),
      updateAgentSession: jest.fn<(id: string, input: Record<string, unknown>) => Promise<unknown>>(),
      agentActivity: jest.fn<(id: string) => Promise<unknown>>(),
      agentActivities: jest.fn<(args?: Record<string, unknown>) => Promise<unknown>>(),
      createAgentActivity: jest.fn<(args: CreateAgentActivityInput) => Promise<unknown>>(),
    };

    mockClient = {
      sdk,
      executeSdk: jest.fn<(operation: string, request: () => Promise<unknown>) => Promise<unknown>>()
        .mockImplementation(async (_operation, request) => request()),
    };

    const auth = {
      isAuthenticated: jest.fn(() => true),
      ensureAuthenticatedClient: jest.fn(async () => undefined),
      getGraphQLClient: jest.fn(() => mockClient),
    } as unknown as LinearAuth;

    handler = new AgentHandler(auth);
  });

  it('returns safe fields when reading an agent session', async () => {
    mockClient.sdk.agentSession.mockResolvedValueOnce({
      id: 'session-1',
      status: 'running',
      state: 'active',
      externalLink: 'https://example.com/session/1',
      externalUrls: [
        {
          label: 'Transcript',
          url: 'https://example.com/transcript/1',
          secret: 'hidden',
        },
      ],
      issue: Promise.resolve({
        id: 'issue-1',
        identifier: 'TEAM-1',
        title: 'Issue',
      }),
      internalOnly: 'hidden',
    });

    const result = await handler.handleGetAgentSession({ id: 'session-1' });

    expect(result.structuredContent).toMatchObject({
      agentSession: {
        id: 'session-1',
        status: 'running',
        externalLink: 'https://example.com/session/1',
        externalUrls: [
          {
            label: 'Transcript',
            url: 'https://example.com/transcript/1',
          },
        ],
        issue: {
          id: 'issue-1',
          identifier: 'TEAM-1',
        },
      },
    });
    expect(result.structuredContent?.agentSession).toEqual(
      expect.not.objectContaining({
        internalOnly: expect.anything(),
      })
    );
  });

  it('creates agent sessions on issues with shaped response fields', async () => {
    const args: CreateAgentSessionOnIssueInput = {
      issueId: 'TEAM-1',
      externalLink: 'https://example.com/session/1',
      externalUrls: [
        {
          label: 'Transcript',
          url: 'https://example.com/transcript/1',
        },
      ],
    };

    mockClient.sdk.agentSessionCreateOnIssue.mockResolvedValueOnce({
      success: true,
      agentSession: {
        id: 'session-1',
        status: 'running',
        externalLink: 'https://example.com/session/1',
        issue: Promise.resolve({
          id: 'issue-1',
          identifier: 'TEAM-1',
          title: 'Issue',
        }),
      },
    });

    const result = await handler.handleCreateAgentSessionOnIssue(args);

    expect(mockClient.sdk.agentSessionCreateOnIssue).toHaveBeenCalledWith(args);
    expect(result.structuredContent).toMatchObject({
      success: true,
      agentSession: {
        id: 'session-1',
        issue: {
          identifier: 'TEAM-1',
        },
      },
    });
  });

  it('creates agent sessions on comments with shaped response fields', async () => {
    const args: CreateAgentSessionOnCommentInput = {
      commentId: 'comment-1',
      externalLink: 'https://example.com/session/2',
    };

    mockClient.sdk.agentSessionCreateOnComment.mockResolvedValueOnce({
      success: true,
      agentSession: {
        id: 'session-2',
        status: 'running',
        externalLink: 'https://example.com/session/2',
        comment: Promise.resolve({
          id: 'comment-1',
          body: 'Comment body',
        }),
      },
    });

    const result = await handler.handleCreateAgentSessionOnComment(args);

    expect(mockClient.sdk.agentSessionCreateOnComment).toHaveBeenCalledWith(args);
    expect(result.structuredContent).toMatchObject({
      success: true,
      agentSession: {
        id: 'session-2',
        comment: {
          id: 'comment-1',
          body: 'Comment body',
        },
      },
    });
  });

  it('updates agent sessions with parsed timestamps and safe response fields', async () => {
    const args: UpdateAgentSessionInput = {
      id: 'session-1',
      dismissedAt: '2026-04-10T00:00:00.000Z',
      plan: {
        next: 'summarize',
      },
      userState: [
        {
          userId: 'user-1',
          lastReadAt: '2026-04-10T00:10:00.000Z',
        },
      ],
    };

    mockClient.sdk.updateAgentSession.mockResolvedValueOnce({
      success: true,
      agentSession: {
        id: 'session-1',
        status: 'completed',
      },
    });

    const result = await handler.handleUpdateAgentSession(args);

    expect(mockClient.sdk.updateAgentSession).toHaveBeenCalledWith(
      'session-1',
      expect.objectContaining({
        dismissedAt: expect.any(Date),
        userState: [
          expect.objectContaining({
            userId: 'user-1',
            lastReadAt: expect.any(Date),
          }),
        ],
      })
    );
    expect(result.structuredContent).toMatchObject({
      success: true,
      agentSession: {
        id: 'session-1',
        status: 'completed',
      },
    });
  });

  it('lists agent sessions with safe response shape', async () => {
    mockClient.sdk.agentSessions.mockResolvedValueOnce({
      nodes: [
        {
          id: 'session-1',
          status: 'running',
          externalLink: 'https://example.com/session/1',
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });

    const result = await handler.handleListAgentSessions({ first: 1 });

    expect(result.structuredContent).toMatchObject({
      agentSessions: [
        {
          id: 'session-1',
          status: 'running',
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  it('returns bounded flexible fields for agent activity reads', async () => {
    mockClient.sdk.agentActivity.mockResolvedValueOnce({
      id: 'activity-1',
      signal: 'PROGRESS',
      ephemeral: false,
      content: {
        summary: 'Working',
        nested: {
          step: 'fetch',
        },
        oversized: 'x'.repeat(5001),
      },
      signalMetadata: {
        code: 'info',
      },
      contextualMetadata: {
        source: 'linear',
      },
      agentSession: Promise.resolve({
        id: 'session-1',
        status: 'running',
      }),
      internalOnly: 'hidden',
    });

    const result = await handler.handleGetAgentActivity({ id: 'activity-1' });
    const agentActivity = result.structuredContent?.agentActivity as Record<string, unknown>;
    const content = agentActivity.content as Record<string, unknown>;

    expect(result.structuredContent).toMatchObject({
      agentActivity: {
        id: 'activity-1',
        content: {
          summary: 'Working',
          nested: {
            step: 'fetch',
          },
        },
        signalMetadata: {
          code: 'info',
        },
        contextualMetadata: {
          source: 'linear',
        },
        agentSession: {
          id: 'session-1',
          status: 'running',
        },
      },
    });
    expect(content).not.toHaveProperty('oversized');
    expect(agentActivity).toEqual(
      expect.not.objectContaining({
        internalOnly: expect.anything(),
      })
    );
  });

  it('lists agent activities with safe response shape', async () => {
    mockClient.sdk.agentActivities.mockResolvedValueOnce({
      nodes: [
        {
          id: 'activity-1',
          content: {
            summary: 'Working',
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });

    const result = await handler.handleListAgentActivities({ first: 1 });

    expect(result.structuredContent).toMatchObject({
      agentActivities: [
        {
          id: 'activity-1',
          content: {
            summary: 'Working',
          },
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    });
  });

  it('creates agent activities with shaped response fields', async () => {
    const args: CreateAgentActivityInput = {
      agentSessionId: 'session-1',
      content: {
        summary: 'Working',
      },
      contextualMetadata: {
        source: 'linear',
      },
    };

    mockClient.sdk.createAgentActivity.mockResolvedValueOnce({
      success: true,
      agentActivity: {
        id: 'activity-1',
        content: {
          summary: 'Working',
        },
      },
    });

    const result = await handler.handleCreateAgentActivity(args);

    expect(mockClient.sdk.createAgentActivity).toHaveBeenCalledWith(args);
    expect(result.structuredContent).toMatchObject({
      success: true,
      agentActivity: {
        id: 'activity-1',
        content: {
          summary: 'Working',
        },
      },
    });
  });
});
