import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import {
  captureRuntimeEnv,
  createIssueWorkflowSmokeBackend,
  createRuntimeSmokeHarness,
  restoreRuntimeEnv,
} from './helpers/runtime-smoke.js';

describe('issue workflow smoke tests', () => {
  const runtimeEnv = captureRuntimeEnv();
  let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    restoreRuntimeEnv(runtimeEnv);
  });

  it('executes linear_create_issue through the MCP boundary without live credentials', async () => {
    const backend = createIssueWorkflowSmokeBackend();
    backend.createIssue.mockResolvedValue({
      success: true,
      issue: {
        id: 'issue-1',
        identifier: 'TEAM-1',
        title: 'Smoke created issue',
        url: 'https://linear.app/test/issue/TEAM-1',
        team: {
          id: 'team-1',
          name: 'Smoke Team',
        },
      },
    });

    const harness = await createRuntimeSmokeHarness({
      clientName: 'issue-create-smoke',
      serverOptions: {
        auth: backend.auth,
      },
    });

    try {
      const result = await harness.client.callTool({
        name: 'linear_create_issue',
        arguments: {
          title: 'Smoke created issue',
          teamId: 'team-1',
          priority: 2,
        },
      }) as { structuredContent?: Record<string, unknown> };

      expect(backend.createIssue).toHaveBeenCalledWith({
        title: 'Smoke created issue',
        teamId: 'team-1',
        priority: 2,
      });
      expect(result.structuredContent).toMatchObject({
        success: true,
        issue: {
          id: 'issue-1',
          identifier: 'TEAM-1',
          title: 'Smoke created issue',
          team: {
            id: 'team-1',
            name: 'Smoke Team',
          },
        },
      });
    } finally {
      await harness.close();
    }
  });

  it('executes linear_create_issues through the MCP boundary without live credentials', async () => {
    const backend = createIssueWorkflowSmokeBackend();
    backend.createIssueBatch.mockResolvedValue({
      success: true,
      issues: [
        {
          id: 'issue-2',
          identifier: 'TEAM-2',
          title: 'First batched issue',
          url: 'https://linear.app/test/issue/TEAM-2',
        },
        {
          id: 'issue-3',
          identifier: 'TEAM-3',
          title: 'Second batched issue',
          url: 'https://linear.app/test/issue/TEAM-3',
        },
      ],
      lastSyncId: 41,
    });

    const harness = await createRuntimeSmokeHarness({
      clientName: 'issue-batch-smoke',
      serverOptions: {
        auth: backend.auth,
      },
    });

    try {
      const issues = [
        {
          title: 'First batched issue',
          teamId: 'team-1',
        },
        {
          title: 'Second batched issue',
          teamId: 'team-1',
          projectId: 'project-1',
        },
      ];
      const result = await harness.client.callTool({
        name: 'linear_create_issues',
        arguments: {
          issues,
        },
      }) as { structuredContent?: Record<string, unknown> };

      expect(backend.executeSdk).toHaveBeenCalledWith('createIssueBatch', expect.any(Function));
      expect(backend.createIssueBatch).toHaveBeenCalledWith({ issues });
      expect(result.structuredContent).toMatchObject({
        success: true,
        lastSyncId: 41,
        issues: [
          {
            id: 'issue-2',
            identifier: 'TEAM-2',
          },
          {
            id: 'issue-3',
            identifier: 'TEAM-3',
          },
        ],
      });
    } finally {
      await harness.close();
    }
  });

  it('executes linear_search_issues through the MCP boundary without live credentials', async () => {
    const backend = createIssueWorkflowSmokeBackend();
    backend.searchIssues.mockResolvedValue({
      issues: {
        nodes: [
          {
            id: 'issue-4',
            identifier: 'TEAM-4',
            title: 'Search hit',
            url: 'https://linear.app/test/issue/TEAM-4',
          },
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
      totalCount: 1,
    });

    const harness = await createRuntimeSmokeHarness({
      clientName: 'issue-search-smoke',
      serverOptions: {
        auth: backend.auth,
      },
    });

    try {
      const result = await harness.client.callTool({
        name: 'linear_search_issues',
        arguments: {
          query: 'Search hit',
          projectId: 'project-1',
          first: 5,
        },
      }) as { structuredContent?: Record<string, unknown> };

      expect(backend.searchIssues).toHaveBeenCalledWith('Search hit', {
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
        totalCount: 1,
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        issues: [
          {
            id: 'issue-4',
            identifier: 'TEAM-4',
            title: 'Search hit',
          },
        ],
      });
    } finally {
      await harness.close();
    }
  });
});
