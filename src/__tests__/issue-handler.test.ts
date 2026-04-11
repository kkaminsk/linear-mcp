import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LinearAuth } from '../auth.js';
import { IssueHandler } from '../features/issues/handlers/issue.handler.js';
import {
  CreateIssueInput,
  CreateIssuesInput,
  SearchIssuesInput,
  SearchIssuesResponse,
  UpdateIssueInput,
} from '../features/issues/types/issue.types.js';

type MockIssueSdk = {
  issue: jest.MockedFunction<(id: string) => Promise<unknown>>;
  createIssue: jest.MockedFunction<(args: CreateIssueInput) => Promise<unknown>>;
  createIssueBatch: jest.MockedFunction<(args: CreateIssuesInput) => Promise<unknown>>;
  updateIssue: jest.MockedFunction<(id: string, input: UpdateIssueInput) => Promise<unknown>>;
  deleteIssue: jest.MockedFunction<(id: string) => Promise<unknown>>;
};

type MockIssueClient = {
  sdk: MockIssueSdk;
  executeSdk: jest.MockedFunction<(operation: string, request: () => Promise<unknown>) => Promise<unknown>>;
  createIssue: jest.MockedFunction<(args: CreateIssueInput) => Promise<unknown>>;
  searchIssues: jest.MockedFunction<(query: string, options?: Omit<SearchIssuesInput, 'query'>) => Promise<SearchIssuesResponse>>;
  findIssueByIdentifier: jest.MockedFunction<(identifier: string, extraFilter?: Record<string, unknown>) => Promise<unknown | undefined>>;
};

describe('IssueHandler', () => {
  let handler: IssueHandler;
  let mockClient: MockIssueClient;

  beforeEach(() => {
    const sdk: MockIssueSdk = {
      issue: jest.fn<(id: string) => Promise<unknown>>(),
      createIssue: jest.fn<(args: CreateIssueInput) => Promise<unknown>>(),
      createIssueBatch: jest.fn<(args: CreateIssuesInput) => Promise<unknown>>(),
      updateIssue: jest.fn<(id: string, input: UpdateIssueInput) => Promise<unknown>>(),
      deleteIssue: jest.fn<(id: string) => Promise<unknown>>(),
    };

    mockClient = {
      sdk,
      executeSdk: jest.fn<(operation: string, request: () => Promise<unknown>) => Promise<unknown>>()
        .mockImplementation(async (_operation, request) => request()),
      createIssue: jest.fn<(args: CreateIssueInput) => Promise<unknown>>(),
      searchIssues: jest.fn<(query: string, options?: Omit<SearchIssuesInput, 'query'>) => Promise<SearchIssuesResponse>>(),
      findIssueByIdentifier: jest.fn<(identifier: string, extraFilter?: Record<string, unknown>) => Promise<unknown | undefined>>(),
    };

    const auth = {
      isAuthenticated: jest.fn(() => true),
      ensureAuthenticatedClient: jest.fn(async () => undefined),
      getGraphQLClient: jest.fn(() => mockClient),
    } as unknown as LinearAuth;

    handler = new IssueHandler(auth);
  });

  it('returns parent and child hierarchy data from issue detail reads', async () => {
    mockClient.sdk.issue.mockResolvedValueOnce({
      id: 'issue-2',
      identifier: 'TEAM-2',
      title: 'Child issue',
      url: 'https://linear.app/test/issue/TEAM-2',
      _children: {
        nodes: [
          {
            id: 'issue-3',
            identifier: 'TEAM-3',
            title: 'Nested child',
            url: 'https://linear.app/test/issue/TEAM-3',
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
      parent: Promise.resolve({
        id: 'issue-1',
        identifier: 'TEAM-1',
        title: 'Parent issue',
        url: 'https://linear.app/test/issue/TEAM-1',
      }),
      children: async function(this: { _children: unknown }) {
        return this._children;
      },
    });

    const result = await handler.handleGetIssue({ id: 'issue-2' });

    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      issue: {
        id: 'issue-2',
        parent: {
          id: 'issue-1',
          identifier: 'TEAM-1',
        },
        children: [
          {
            id: 'issue-3',
            identifier: 'TEAM-3',
          },
        ],
      },
    });
  });

  it('resolves issue identifiers before loading detailed issue data', async () => {
    mockClient.findIssueByIdentifier.mockResolvedValueOnce({
      id: 'issue-431',
      identifier: 'POL-431',
    });
    mockClient.sdk.issue.mockResolvedValueOnce({
      id: 'issue-431',
      identifier: 'POL-431',
      title: 'Exact identifier hit',
      url: 'https://linear.app/test/issue/POL-431',
    });

    const result = await handler.handleGetIssue({ id: 'pol-431' });

    expect(mockClient.findIssueByIdentifier).toHaveBeenCalledWith('pol-431');
    expect(mockClient.sdk.issue).toHaveBeenCalledWith('issue-431');
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toMatchObject({
      issue: {
        id: 'issue-431',
        identifier: 'POL-431',
        title: 'Exact identifier hit',
      },
    });
  });

  it('returns the assigned parent on issue creation responses', async () => {
    const args: CreateIssueInput = {
      title: 'Child issue',
      teamId: 'team-1',
      parentId: 'issue-1',
    };

    mockClient.createIssue.mockResolvedValueOnce({
      success: true,
      issue: {
        id: 'issue-2',
        identifier: 'TEAM-2',
        title: 'Child issue',
        url: 'https://linear.app/test/issue/TEAM-2',
        parent: Promise.resolve({
          id: 'issue-1',
          identifier: 'TEAM-1',
          title: 'Parent issue',
          url: 'https://linear.app/test/issue/TEAM-1',
        }),
      },
    });

    const result = await handler.handleCreateIssue(args);

    expect(mockClient.createIssue).toHaveBeenCalledWith(args);
    expect(mockClient.sdk.createIssueBatch).not.toHaveBeenCalled();
    expect(result.structuredContent).toMatchObject({
      issue: {
        id: 'issue-2',
        parent: {
          id: 'issue-1',
          identifier: 'TEAM-1',
        },
      },
    });
  });

  it('uses batch issue creation for multi-issue create requests', async () => {
    const args: CreateIssuesInput = {
      issues: [
        {
          title: 'Issue 1',
          teamId: 'team-1',
        },
        {
          title: 'Issue 2',
          teamId: 'team-1',
        },
      ],
    };

    mockClient.sdk.createIssueBatch.mockResolvedValueOnce({
      success: true,
      issues: [
        {
          id: 'issue-1',
          identifier: 'TEAM-1',
          title: 'Issue 1',
          url: 'https://linear.app/test/issue/TEAM-1',
        },
        {
          id: 'issue-2',
          identifier: 'TEAM-2',
          title: 'Issue 2',
          url: 'https://linear.app/test/issue/TEAM-2',
        },
      ],
      lastSyncId: 42,
    });

    const result = await handler.handleCreateIssues(args);

    expect(mockClient.sdk.createIssueBatch).toHaveBeenCalledWith(args);
    expect(mockClient.sdk.createIssue).not.toHaveBeenCalled();
    expect(result.structuredContent).toMatchObject({
      success: true,
      issues: [
        {
          id: 'issue-1',
          identifier: 'TEAM-1',
        },
        {
          id: 'issue-2',
          identifier: 'TEAM-2',
        },
      ],
      lastSyncId: 42,
    });
  });

  it('uses explicit null to clear an existing project assignment', async () => {
    const update: UpdateIssueInput = {
      projectId: null,
    };

    mockClient.sdk.updateIssue.mockResolvedValueOnce({
      success: true,
      issue: {
        id: 'issue-2',
        identifier: 'TEAM-2',
        title: 'Moved issue',
        url: 'https://linear.app/test/issue/TEAM-2',
      },
    });

    const result = await handler.handleBulkUpdateIssues({
      issueIds: ['issue-2'],
      update,
    });

    expect(mockClient.sdk.updateIssue).toHaveBeenCalledWith('issue-2', update);
    expect(result.structuredContent).toMatchObject({
      success: true,
      issues: [
        {
          id: 'issue-2',
        },
      ],
    });
    expect(result.structuredContent?.issues).toEqual(
      expect.not.arrayContaining([
        expect.objectContaining({
          project: expect.anything(),
        }),
      ])
    );
  });

  it('routes free-text issue search through the query-aware search helper', async () => {
    mockClient.searchIssues.mockResolvedValueOnce({
      issues: {
        nodes: [
          {
            id: 'issue-2',
            identifier: 'TEAM-2',
            title: 'Search hit',
            url: 'https://linear.app/test/issue/TEAM-2',
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
      totalCount: 1,
    });

    const result = await handler.handleSearchIssues({
      query: 'Search hit',
      projectId: 'project-1',
      first: 5,
    });

    expect(mockClient.searchIssues).toHaveBeenCalledWith('Search hit', {
      filter: {
        project: {
          id: {
            eq: 'project-1',
          },
        },
      },
      first: 5,
    });
    expect(result.structuredContent).toMatchObject({
      issues: [
        {
          id: 'issue-2',
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
      totalCount: 1,
    });
  });

  it('rejects conflicting stateId and states filters before search execution', async () => {
    const result = await handler.handleSearchIssues({
      query: 'Search hit',
      stateId: 'state-1',
      states: ['Todo'],
    });

    expect(result.isError).toBe(true);
    expect(mockClient.searchIssues).not.toHaveBeenCalled();
    expect(result.structuredContent).toMatchObject({
      error: {
        type: 'mcp',
        message: 'MCP error -32602: stateId and states cannot both be provided in the same issue query.',
      },
    });
  });

  it('returns results for a query-only issue search', async () => {
    mockClient.searchIssues.mockResolvedValueOnce({
      issues: {
        nodes: [
          {
            id: 'issue-7',
            identifier: 'TEAM-7',
            title: 'Only query result',
            url: 'https://linear.app/test/issue/TEAM-7',
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
      totalCount: 1,
    });

    const result = await handler.handleSearchIssues({
      query: 'Only query result',
    });

    expect(mockClient.searchIssues).toHaveBeenCalledWith('Only query result', {
      first: 50,
    });
    expect(result.structuredContent).toMatchObject({
      issues: [
        {
          id: 'issue-7',
          identifier: 'TEAM-7',
        },
      ],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
      totalCount: 1,
    });
  });

  it('returns the updated parent when reparenting an existing issue', async () => {
    mockClient.sdk.updateIssue.mockResolvedValueOnce({
      success: true,
      issue: {
        id: 'issue-2',
        identifier: 'TEAM-2',
        title: 'Child issue',
        url: 'https://linear.app/test/issue/TEAM-2',
        parent: Promise.resolve({
          id: 'issue-9',
          identifier: 'TEAM-9',
          title: 'New parent',
          url: 'https://linear.app/test/issue/TEAM-9',
        }),
      },
    });

    const result = await handler.handleBulkUpdateIssues({
      issueIds: ['issue-2'],
      update: {
        parentId: 'issue-9',
      },
    });

    expect(mockClient.sdk.updateIssue).toHaveBeenCalledWith('issue-2', {
      parentId: 'issue-9',
    });
    expect(result.structuredContent).toMatchObject({
      issues: [
        {
          id: 'issue-2',
          parent: {
            id: 'issue-9',
            identifier: 'TEAM-9',
          },
        },
      ],
    });
  });

  it('uses projectId to move an existing issue into a project', async () => {
    mockClient.sdk.updateIssue.mockResolvedValueOnce({
      success: true,
      issue: {
        id: 'issue-2',
        identifier: 'TEAM-2',
        title: 'Moved issue',
        url: 'https://linear.app/test/issue/TEAM-2',
        project: Promise.resolve({
          id: 'project-2',
          name: 'Roadmap',
          url: 'https://linear.app/test/project/project-2',
        }),
      },
    });

    const result = await handler.handleBulkUpdateIssues({
      issueIds: ['issue-2'],
      update: {
        projectId: 'project-2',
      },
    });

    expect(mockClient.sdk.updateIssue).toHaveBeenCalledWith('issue-2', {
      projectId: 'project-2',
    });
    expect(result.structuredContent).toMatchObject({
      issues: [
        {
          id: 'issue-2',
          project: {
            id: 'project-2',
            name: 'Roadmap',
          },
        },
      ],
    });
  });

  it('returns deterministic partial results when bulk issue deletion is only partially successful', async () => {
    mockClient.sdk.deleteIssue
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('Delete failed'));

    const result = await handler.handleDeleteIssues({
      ids: ['issue-1', 'issue-2'],
    });

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: false,
      deletedIds: ['issue-1'],
      failedIds: ['issue-2'],
      failed: [
        {
          id: 'issue-2',
          message: 'Delete failed',
        },
      ],
      error: {
        type: 'partial',
      },
    });
  });
});
