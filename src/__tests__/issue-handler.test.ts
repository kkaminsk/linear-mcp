import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LinearAuth } from '../auth.js';
import { IssueHandler } from '../features/issues/handlers/issue.handler.js';
import {
  CreateIssueInput,
  SearchIssuesInput,
  SearchIssuesResponse,
  UpdateIssueInput,
} from '../features/issues/types/issue.types.js';

type MockIssueSdk = {
  issue: jest.MockedFunction<(id: string) => Promise<unknown>>;
  createIssue: jest.MockedFunction<(args: CreateIssueInput) => Promise<unknown>>;
  updateIssue: jest.MockedFunction<(id: string, input: UpdateIssueInput) => Promise<unknown>>;
};

type MockIssueClient = {
  sdk: MockIssueSdk;
  executeSdk: jest.MockedFunction<(operation: string, request: () => Promise<unknown>) => Promise<unknown>>;
  searchIssues: jest.MockedFunction<(query: string, options?: Omit<SearchIssuesInput, 'query'>) => Promise<SearchIssuesResponse>>;
};

describe('IssueHandler', () => {
  let handler: IssueHandler;
  let mockClient: MockIssueClient;

  beforeEach(() => {
    const sdk: MockIssueSdk = {
      issue: jest.fn<(id: string) => Promise<unknown>>(),
      createIssue: jest.fn<(args: CreateIssueInput) => Promise<unknown>>(),
      updateIssue: jest.fn<(id: string, input: UpdateIssueInput) => Promise<unknown>>(),
    };

    mockClient = {
      sdk,
      executeSdk: jest.fn<(operation: string, request: () => Promise<unknown>) => Promise<unknown>>()
        .mockImplementation(async (_operation, request) => request()),
      searchIssues: jest.fn<(query: string, options?: Omit<SearchIssuesInput, 'query'>) => Promise<SearchIssuesResponse>>(),
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
      parent: Promise.resolve({
        id: 'issue-1',
        identifier: 'TEAM-1',
        title: 'Parent issue',
        url: 'https://linear.app/test/issue/TEAM-1',
      }),
      children: async () => ({
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
      }),
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

  it('returns the assigned parent on issue creation responses', async () => {
    const args: CreateIssueInput = {
      title: 'Child issue',
      teamId: 'team-1',
      parentId: 'issue-1',
    };

    mockClient.sdk.createIssue.mockResolvedValueOnce({
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

    expect(mockClient.sdk.createIssue).toHaveBeenCalledWith(args);
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
});
