import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LinearAuth } from '../auth.js';
import { ProjectHandler } from '../features/projects/handlers/project.handler.js';
import {
  ProjectInput,
  ProjectWithIssuesInput,
  ProjectWithIssuesOutcome,
  UpdateProjectInput,
} from '../features/projects/types/project.types.js';

type MockProjectSdk = {
  createProject: jest.MockedFunction<(args: ProjectInput) => Promise<unknown>>;
  updateProject: jest.MockedFunction<(id: string, input: UpdateProjectInput) => Promise<unknown>>;
};

type MockProjectClient = {
  sdk: MockProjectSdk;
  executeSdk: jest.MockedFunction<(operation: string, request: () => Promise<unknown>) => Promise<unknown>>;
  createProjectWithIssues: jest.MockedFunction<(
    project: ProjectInput,
    issues: ProjectWithIssuesInput['issues']
  ) => Promise<ProjectWithIssuesOutcome>>;
};

describe('ProjectHandler', () => {
  let handler: ProjectHandler;
  let mockClient: MockProjectClient;

  beforeEach(() => {
    const sdk: MockProjectSdk = {
      createProject: jest.fn<(args: ProjectInput) => Promise<unknown>>(),
      updateProject: jest.fn<(id: string, input: UpdateProjectInput) => Promise<unknown>>(),
    };

    mockClient = {
      sdk,
      executeSdk: jest.fn<(operation: string, request: () => Promise<unknown>) => Promise<unknown>>()
        .mockImplementation(async (_operation, request) => request()),
      createProjectWithIssues: jest.fn<(
        project: ProjectInput,
        issues: ProjectWithIssuesInput['issues']
      ) => Promise<ProjectWithIssuesOutcome>>(),
    };

    const auth = {
      isAuthenticated: jest.fn(() => true),
      ensureAuthenticatedClient: jest.fn(async () => undefined),
      getGraphQLClient: jest.fn(() => mockClient),
    } as unknown as LinearAuth;

    handler = new ProjectHandler(auth);
  });

  it('returns linked initiative metadata on project creation', async () => {
    const args: ProjectInput = {
      name: 'Roadmap',
      teamIds: ['team-1'],
      initiativeId: 'initiative-1',
    };

    mockClient.sdk.createProject.mockResolvedValueOnce({
      success: true,
      project: {
        id: 'project-1',
        name: 'Roadmap',
        url: 'https://linear.app/test/project/project-1',
        initiative: Promise.resolve({
          id: 'initiative-1',
          name: 'Platform',
          url: 'https://linear.app/test/initiative/initiative-1',
        }),
      },
    });

    const result = await handler.handleCreateProject(args);

    expect(mockClient.sdk.createProject).toHaveBeenCalledWith(args);
    expect(result.structuredContent).toMatchObject({
      project: {
        id: 'project-1',
        initiative: {
          id: 'initiative-1',
          name: 'Platform',
        },
      },
    });
  });

  it('uses explicit null to clear an initiative association', async () => {
    const args: UpdateProjectInput & { id: string } = {
      id: 'project-1',
      initiativeId: null,
    };

    mockClient.sdk.updateProject.mockResolvedValueOnce({
      success: true,
      project: {
        id: 'project-1',
        name: 'Roadmap',
        url: 'https://linear.app/test/project/project-1',
      },
    });

    const result = await handler.handleUpdateProject(args);

    expect(mockClient.sdk.updateProject).toHaveBeenCalledWith('project-1', {
      initiativeId: null,
    });
    expect(result.structuredContent).toMatchObject({
      project: {
        id: 'project-1',
      },
    });
    expect(result.structuredContent?.project).toEqual(
      expect.not.objectContaining({
        initiative: expect.anything(),
      })
    );
  });

  it('fails before issue creation when project creation does not return a usable identifier', async () => {
    const args: ProjectWithIssuesInput = {
      project: {
        name: 'Roadmap',
        teamIds: ['team-1'],
      },
      issues: [
        {
          title: 'First issue',
          teamId: 'team-1',
        },
      ],
    };

    mockClient.createProjectWithIssues.mockResolvedValueOnce({
      success: false,
      failedStep: 'projectCreate',
      message: 'Project creation did not complete before issue creation began.',
      issueCreationAttempted: false,
      compensationAttempted: false,
      projectCreate: {
        success: false,
        project: undefined,
      },
    });

    const result = await handler.handleCreateProjectWithIssues(args);

    expect(mockClient.createProjectWithIssues).toHaveBeenCalledWith(args.project, args.issues);
    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      success: false,
      error: {
        type: 'workflow',
        failedStep: 'projectCreate',
        issueCreationAttempted: false,
      },
    });
  });

  it('surfaces explicit partial state when issue creation fails and compensation does not complete', async () => {
    const args: ProjectWithIssuesInput = {
      project: {
        name: 'Roadmap',
        teamIds: ['team-1'],
      },
      issues: [
        {
          title: 'First issue',
          teamId: 'team-1',
        },
      ],
    };

    mockClient.createProjectWithIssues.mockResolvedValueOnce({
      success: false,
      failedStep: 'issueBatchCreate',
      message: 'Issue creation failed after project creation and compensation did not remove the created project.',
      issueCreationAttempted: true,
      compensationAttempted: true,
      compensationSucceeded: false,
      project: {
        id: 'project-1',
        name: 'Roadmap',
        url: 'https://linear.app/test/project/project-1',
      },
      issues: [],
      projectCreate: {
        success: true,
        project: {
          id: 'project-1',
          name: 'Roadmap',
          url: 'https://linear.app/test/project/project-1',
        },
      },
    });

    const result = await handler.handleCreateProjectWithIssues(args);

    expect(result.isError).toBe(true);
    expect(result.structuredContent).toMatchObject({
      partialState: {
        projectId: 'project-1',
        projectName: 'Roadmap',
        failedStep: 'issueBatchCreate',
      },
      error: {
        type: 'workflow',
        failedStep: 'issueBatchCreate',
        compensationAttempted: true,
        compensationSucceeded: false,
      },
    });
  });
});
