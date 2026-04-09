import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { LinearAuth } from '../auth.js';
import { ProjectHandler } from '../features/projects/handlers/project.handler.js';
import {
  ProjectInput,
  UpdateProjectInput,
} from '../features/projects/types/project.types.js';

type MockProjectSdk = {
  createProject: jest.MockedFunction<(args: ProjectInput) => Promise<unknown>>;
  updateProject: jest.MockedFunction<(id: string, input: UpdateProjectInput) => Promise<unknown>>;
};

type MockProjectClient = {
  sdk: MockProjectSdk;
  executeSdk: jest.MockedFunction<(operation: string, request: () => Promise<unknown>) => Promise<unknown>>;
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
});
