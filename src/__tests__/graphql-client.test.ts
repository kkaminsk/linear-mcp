import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { LinearGraphQLClient, LinearGraphQLRequestError } from '../graphql/client';
import { LinearClient } from '@linear/sdk';
import { 
  CreateIssueInput, 
  CreateIssueResponse,
  DeleteIssuesResponse,
  UpdateIssueInput,
  UpdateIssueResponse,
  UpdateIssuesResponse,
  SearchIssuesInput,
  SearchIssuesResponse,
  DeleteIssueResponse,
  IssueBatchResponse
} from '../features/issues/types/issue.types';
import {
  ProjectInput,
  ProjectWithIssuesOutcome,
  ProjectResponse,
  SearchProjectsResponse,
  GetProjectResponse
} from '../features/projects/types/project.types';
import {
  TeamResponse,
  LabelInput,
  LabelResponse
} from '../features/teams/types/team.types';
import {
  UserResponse
} from '../features/users/types/user.types';
import {
  ProjectMilestoneCreateInput,
  ProjectMilestoneUpdateInput,
  ProjectMilestoneResponse,
  ProjectMilestoneUpdateResponse,
  ProjectMilestoneDeleteResponse,
  SearchProjectMilestonesResponse,
  GetProjectMilestoneResponse
} from '../features/milestones/types/milestone.types';

jest.mock('@linear/sdk');

// Define type for GraphQL response
type GraphQLResponse<T> = {
  data: T;
};

const createRetryableRawFailure = (message: string = 'Temporary outage') => ({
  data: undefined,
  errors: [
    {
      message,
      extensions: {
        code: 'SERVICE_UNAVAILABLE'
      }
    }
  ],
  status: 503
});

const createRetryableSdkFailure = (message?: string) => ({
  response: createRetryableRawFailure(message)
});

describe('LinearGraphQLClient', () => {
  let graphqlClient: LinearGraphQLClient;
  let linearClient: LinearClient;
  let mockRawRequest: jest.MockedFunction<(query: string, variables?: Record<string, unknown>) => Promise<GraphQLResponse<unknown>>>;
  let mockDeleteProject: jest.MockedFunction<(id: string) => Promise<unknown>>;
  let mockIssue: jest.MockedFunction<(id: string) => Promise<unknown>>;
  let mockIssues: jest.MockedFunction<(args?: Record<string, unknown>) => Promise<unknown>>;

  beforeEach(() => {
    mockRawRequest = jest.fn();
    mockDeleteProject = jest.fn<(id: string) => Promise<unknown>>();
    mockIssue = jest.fn<(id: string) => Promise<unknown>>();
    mockIssues = jest.fn<(args?: Record<string, unknown>) => Promise<unknown>>();
    // Mock the Linear client's GraphQL client
    linearClient = {
      client: {
        rawRequest: mockRawRequest
      },
      deleteProject: mockDeleteProject,
      issue: mockIssue,
      issues: mockIssues,
    } as unknown as LinearClient;

    // Clear mocks
    mockRawRequest.mockReset();

    graphqlClient = new LinearGraphQLClient(linearClient);
  });

  describe('searchIssues', () => {
    it('should successfully search issues with only a free-text query', async () => {
      mockRawRequest.mockResolvedValueOnce({
        data: {
          searchIssues: {
            nodes: [
              {
                id: 'issue-9',
                identifier: 'TEST-9',
                title: 'Query only hit',
                url: 'https://linear.app/test/issue/TEST-9'
              }
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            },
            totalCount: 1,
          }
        }
      });

      const result: SearchIssuesResponse = await graphqlClient.searchIssues('query only hit');

      expect(result).toEqual({
        issues: {
          nodes: [
            {
              id: 'issue-9',
              identifier: 'TEST-9',
              title: 'Query only hit',
              url: 'https://linear.app/test/issue/TEST-9'
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        },
        totalCount: 1,
      });
      const [query, variables] = mockRawRequest.mock.calls[0];
      expect(query).toContain('searchIssues');
      expect(variables).toEqual({ term: 'query only hit', first: 50 });
    });

    it('should successfully search issues with a query and filters', async () => {
      mockRawRequest.mockResolvedValueOnce({
        data: {
          searchIssues: {
            nodes: [
              {
                id: 'issue-1',
                identifier: 'TEST-1',
                title: 'Bug in search feature',
                url: 'https://linear.app/test/issue/TEST-1'
              }
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            },
            totalCount: 1,
          }
        }
      });

      const result: SearchIssuesResponse = await graphqlClient.searchIssues('search feature', {
        filter: {
          project: {
            id: {
              eq: 'project-1'
            }
          }
        },
        first: 1,
        after: 'cursor-1',
      });

      expect(result).toEqual({
        issues: {
          nodes: [
            {
              id: 'issue-1',
              identifier: 'TEST-1',
              title: 'Bug in search feature',
              url: 'https://linear.app/test/issue/TEST-1'
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        },
        totalCount: 1,
      });
      const [query, variables] = mockRawRequest.mock.calls[0];
      expect(query).toContain('searchIssues');
      expect(variables).toEqual({
        term: 'search feature',
        filter: {
          project: {
            id: {
              eq: 'project-1'
            }
          }
        },
        first: 1,
        after: 'cursor-1',
      });
    });

    it('keeps the free-text query separate from issue filters', async () => {
      mockRawRequest.mockResolvedValueOnce({
        data: {
          searchIssues: {
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            },
            totalCount: 0,
          }
        }
      });

      await graphqlClient.searchIssues('TEST-123', {
        filter: {
          state: {
            name: {
              in: ['Done']
            }
          }
        },
      });

      const [, variables] = mockRawRequest.mock.calls[0];
      expect(variables).toEqual(expect.objectContaining({
        term: 'TEST-123',
        first: 50,
        filter: {
          team: {
            key: {
              eq: 'TEST'
            }
          },
          number: {
            eq: 123
          },
          state: {
            name: {
              in: ['Done']
            }
          }
        },
      }));
      // The query term must NOT leak into the filter object
      expect((variables as Record<string, unknown>).filter).not.toHaveProperty('search');
    });

    it('keeps exact identifier lookups on the search path so pagination metadata stays intact', async () => {
      mockRawRequest.mockResolvedValueOnce({
        data: {
          searchIssues: {
            nodes: [
              {
                id: 'issue-431',
                identifier: 'POL-431',
                title: 'Exact identifier hit',
                url: 'https://linear.app/test/issue/POL-431'
              }
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            },
            totalCount: 1,
          }
        }
      });

      const result: SearchIssuesResponse = await graphqlClient.searchIssues('pol-431');

      expect(result).toEqual({
        issues: {
          nodes: [
            {
              id: 'issue-431',
              identifier: 'POL-431',
              title: 'Exact identifier hit',
              url: 'https://linear.app/test/issue/POL-431'
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        },
        totalCount: 1,
      });
      const [query, variables] = mockRawRequest.mock.calls[0];
      expect(query).toContain('searchIssues');
      expect(variables).toEqual({
        term: 'pol-431',
        filter: {
          team: {
            key: {
              eq: 'POL'
            }
          },
          number: {
            eq: 431
          }
        },
        first: 50,
      });
      expect(mockIssues).not.toHaveBeenCalled();
    });

    it('falls back to deterministic identifier lookup when exact search returns no hits', async () => {
      mockRawRequest.mockResolvedValueOnce({
        data: {
          searchIssues: {
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            },
            totalCount: 0,
          }
        }
      });
      mockIssues.mockResolvedValueOnce({
        nodes: [
          {
            id: 'issue-431',
            identifier: 'POL-431',
            title: 'Exact identifier hit',
            url: 'https://linear.app/test/issue/POL-431'
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      });

      const result: SearchIssuesResponse = await graphqlClient.searchIssues('pol-431');

      expect(result).toEqual({
        issues: {
          nodes: [
            {
              id: 'issue-431',
              identifier: 'POL-431',
              title: 'Exact identifier hit',
              url: 'https://linear.app/test/issue/POL-431'
            }
          ],
          pageInfo: {
            hasNextPage: false,
            endCursor: null
          }
        },
        totalCount: 1,
      });
      expect(mockIssues).toHaveBeenCalledWith({
        filter: {
          team: {
            key: {
              eq: 'POL'
            }
          },
          number: {
            eq: 431
          }
        },
        first: 1,
      });
    });

    it('should handle search errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Search failed'));

      await expect(
        graphqlClient.searchIssues('search feature')
      ).rejects.toThrow('GraphQL operation SearchIssues failed');
    });
  });

  describe('findIssueByIdentifier', () => {
    it('returns undefined for non-identifier queries without calling issue listing', async () => {
      await expect(graphqlClient.findIssueByIdentifier('search feature')).resolves.toBeUndefined();
      expect(mockIssues).not.toHaveBeenCalled();
    });

    it('merges exact identifier lookup with existing issue filters', async () => {
      mockIssues.mockResolvedValueOnce({
        nodes: [
          {
            id: 'issue-431',
            identifier: 'POL-431',
            title: 'Filtered identifier hit'
          }
        ],
        pageInfo: {
          hasNextPage: false,
          endCursor: null
        }
      });

      const result = await graphqlClient.findIssueByIdentifier('POL-431', {
        project: {
          id: {
            eq: 'project-1'
          }
        }
      });

      expect(result).toMatchObject({
        id: 'issue-431',
        identifier: 'POL-431',
      });
      expect(mockIssues).toHaveBeenCalledWith({
        filter: {
          project: {
            id: {
              eq: 'project-1'
            }
          },
          team: {
            key: {
              eq: 'POL'
            }
          },
          number: {
            eq: 431
          }
        },
        first: 1,
      });
    });
  });

  describe('request resilience', () => {
    it('retries approved raw GraphQL reads before succeeding', async () => {
      graphqlClient = new LinearGraphQLClient(linearClient, {
        safeReadRetryDelayMs: 0
      });

      const successResponse = {
        data: {
          teams: {
            nodes: [
              {
                id: 'team-1',
                name: 'Platform'
              }
            ]
          }
        }
      };

      mockRawRequest
        .mockResolvedValueOnce(createRetryableRawFailure() as unknown as GraphQLResponse<unknown>)
        .mockResolvedValueOnce(createRetryableRawFailure() as unknown as GraphQLResponse<unknown>)
        .mockResolvedValueOnce(successResponse as GraphQLResponse<unknown>);

      await expect(graphqlClient.getTeams()).resolves.toEqual(successResponse.data);
      expect(mockRawRequest).toHaveBeenCalledTimes(3);
    });

    it('retries approved SDK reads before succeeding', async () => {
      graphqlClient = new LinearGraphQLClient(linearClient, {
        safeReadRetryDelayMs: 0
      });

      mockIssues
        .mockRejectedValueOnce(createRetryableSdkFailure())
        .mockResolvedValueOnce({
          nodes: [
            {
              id: 'issue-431',
              identifier: 'POL-431'
            }
          ]
        });

      await expect(graphqlClient.findIssueByIdentifier('POL-431')).resolves.toMatchObject({
        id: 'issue-431',
        identifier: 'POL-431'
      });
      expect(mockIssues).toHaveBeenCalledTimes(2);
    });

    it('surfaces retry exhaustion after bounded safe-read retries', async () => {
      graphqlClient = new LinearGraphQLClient(linearClient, {
        safeReadMaxAttempts: 2,
        safeReadRetryDelayMs: 0
      });

      mockRawRequest.mockResolvedValue(
        createRetryableRawFailure() as unknown as GraphQLResponse<unknown>
      );

      let caughtError: unknown;
      try {
        await graphqlClient.getTeams();
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(LinearGraphQLRequestError);
      expect(caughtError).toMatchObject({
        message: 'GraphQL operation GetTeams failed: Temporary outage',
        result: {
          meta: {
            status: 503,
            retryable: true,
          },
        },
      });
      expect(mockRawRequest).toHaveBeenCalledTimes(2);
    });

    it('classifies timed out requests as structured timeout failures', async () => {
      graphqlClient = new LinearGraphQLClient(linearClient, {
        requestTimeoutMs: 1,
        safeReadMaxAttempts: 1,
        safeReadRetryDelayMs: 0
      });

      mockRawRequest.mockImplementation(
        () => new Promise<GraphQLResponse<unknown>>(() => undefined)
      );

      let caughtError: unknown;
      try {
        await graphqlClient.getTeams();
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).toBeInstanceOf(LinearGraphQLRequestError);
      expect(caughtError).toMatchObject({
        message: 'GraphQL operation GetTeams failed: GetTeams timed out after 1ms',
        result: {
          errors: [
            {
              message: 'GetTeams timed out after 1ms',
              extensions: {
                code: 'TIMEOUT'
              }
            }
          ],
          meta: {
            status: 408,
            retryable: true,
          },
        },
      });
      expect(mockRawRequest).toHaveBeenCalledTimes(1);
    });

    it('does not auto-retry non-idempotent writes', async () => {
      graphqlClient = new LinearGraphQLClient(linearClient, {
        safeReadRetryDelayMs: 0
      });

      mockRawRequest.mockResolvedValueOnce(
        createRetryableRawFailure() as unknown as GraphQLResponse<unknown>
      );

      const input: CreateIssueInput = {
        title: 'New Issue',
        description: 'Description',
        teamId: 'team-1'
      };

      await expect(graphqlClient.createIssue(input)).rejects.toThrow(
        'GraphQL operation CreateIssue failed: Temporary outage'
      );
      expect(mockRawRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('createIssue', () => {
    it('should successfully create an issue', async () => {
      const mockResponse = {
        data: {
          issueCreate: {
            success: true,
            issue: {
              id: 'issue-1',
              identifier: 'TEST-1',
              title: 'New Issue',
              url: 'https://linear.app/test/issue/TEST-1'
            }
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const input: CreateIssueInput = {
        title: 'New Issue',
        description: 'Description',
        teamId: 'team-1'
      };
      
      const result: CreateIssueResponse = await graphqlClient.createIssue(input);
      const [query, variables] = mockRawRequest.mock.calls[0];

      expect(query).toContain('issueCreate(input: $input)');
      expect(query).not.toContain('issueBatchCreate(');
      expect(variables).toEqual(expect.objectContaining({ input }));
      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Creation failed'));

      const input: CreateIssueInput = {
        title: 'New Issue',
        description: 'Description',
        teamId: 'team-1'
      };

      await expect(
        graphqlClient.createIssue(input)
      ).rejects.toThrow('GraphQL operation CreateIssue failed: Creation failed');
    });
  });

  describe('Project Operations', () => {
    describe('createProject', () => {
      it('should successfully create a project', async () => {
        const mockResponse = {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: 'project-1',
                name: 'New Project',
                url: 'https://linear.app/test/project/1',
                description: '',
                documentContent: {
                  content: 'This is the actual project description',
                  contentState: '{"type":"doc","content":[]}'
                }
              },
              lastSyncId: 123
            }
          }
        };

        mockRawRequest.mockResolvedValueOnce(mockResponse);

        const projectInput: ProjectInput = {
          name: 'New Project',
          teamIds: ['team-1']
        };

        const result = await graphqlClient.createProject(projectInput);
        expect(result).toEqual(mockResponse.data);
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ input: projectInput })
        );
      });
    });

    describe('getProject', () => {
      it('should successfully get a project with documentContent', async () => {
        const mockResponse = {
          data: {
            project: {
              id: 'project-1',
              name: 'Test Project',
              description: '',
              documentContent: {
                content: 'This is the rich text description',
                contentState: '{"type":"doc","content":[]}'
              },
              url: 'https://linear.app/test/project/1',
              teams: {
                nodes: [
                  {
                    id: 'team-1',
                    name: 'Engineering'
                  }
                ]
              }
            }
          }
        };

        mockRawRequest.mockResolvedValueOnce(mockResponse);

        const result: GetProjectResponse = await graphqlClient.getProject('project-1');
        expect(result).toEqual(mockResponse.data);
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ id: 'project-1' })
        );
      });
    });

    describe('searchProjects', () => {
      it('should successfully search projects with documentContent', async () => {
        const mockResponse = {
          data: {
            projects: {
              nodes: [
                {
                  id: 'project-1',
                  name: 'Test Project',
                  description: '',
                  documentContent: {
                    content: 'Rich text project description',
                    contentState: '{"type":"doc","content":[]}'
                  },
                  url: 'https://linear.app/test/project/1',
                  teams: {
                    nodes: [
                      {
                        id: 'team-1',
                        name: 'Engineering'
                      }
                    ]
                  }
                }
              ]
            }
          }
        };

        mockRawRequest.mockResolvedValueOnce(mockResponse);

        const result: SearchProjectsResponse = await graphqlClient.searchProjects({
          name: { eq: 'Test Project' }
        });
        expect(result).toEqual(mockResponse.data);
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: { name: { eq: 'Test Project' } }
          })
        );
      });
    });

    describe('createProjectWithIssues', () => {
      it('should successfully create project with issues', async () => {
        const projectMockResponse = {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: 'project-1',
                name: 'New Project',
                url: 'https://linear.app/test/project/1',
                description: '',
                documentContent: {
                  content: 'Project description content',
                  contentState: '{"type":"doc","content":[]}'
                }
              },
              lastSyncId: 123
            }
          }
        };

        const issueMockResponse = {
          data: {
            issueBatchCreate: {
              success: true,
              issues: [
                {
                  id: 'issue-1',
                  identifier: 'TEST-1',
                  title: 'Project Issue 1',
                  url: 'https://linear.app/test/issue/TEST-1'
                }
              ],
              lastSyncId: 124
            }
          }
        };

        mockRawRequest
          .mockResolvedValueOnce(projectMockResponse)
          .mockResolvedValueOnce(issueMockResponse);

        const projectInput: ProjectInput = {
          name: 'New Project',
          teamIds: ['team-1']
        };

        const issueInput: CreateIssueInput = {
          title: 'Project Issue 1',
          description: 'Description 1',
          teamId: 'team-1'
        };

        const result = await graphqlClient.createProjectWithIssues(
          projectInput,
          [issueInput]
        ) as ProjectWithIssuesOutcome;
        const [projectQuery, projectVariables] = mockRawRequest.mock.calls[0];
        const [issueQuery, issueVariables] = mockRawRequest.mock.calls[1];

        expect(result).toEqual({
          success: true,
          project: projectMockResponse.data.projectCreate.project,
          issues: issueMockResponse.data.issueBatchCreate.issues,
          lastSyncId: 124,
          projectCreate: projectMockResponse.data.projectCreate,
          issueBatchCreate: issueMockResponse.data.issueBatchCreate
        });
        expect(mockRawRequest).toHaveBeenCalledTimes(2);
        expect(projectQuery).toContain('projectCreate(input: $input)');
        expect(projectVariables).toEqual(expect.objectContaining({ input: projectInput }));
        expect(issueQuery).toContain('issueBatchCreate(input: $input)');
        expect(issueVariables).toEqual(expect.objectContaining({
          input: {
            issues: [{ ...issueInput, projectId: 'project-1' }]
          }
        }));
      });

      it('should skip batch issue creation when no project issues are supplied', async () => {
        const projectMockResponse = {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: 'project-1',
                name: 'New Project',
                url: 'https://linear.app/test/project/1',
              },
              lastSyncId: 123,
            }
          }
        };

        mockRawRequest.mockResolvedValueOnce(projectMockResponse);

        const projectInput: ProjectInput = {
          name: 'New Project',
          teamIds: ['team-1']
        };

        const result = await graphqlClient.createProjectWithIssues(projectInput, []);

        expect(result).toEqual({
          success: true,
          project: projectMockResponse.data.projectCreate.project,
          issues: [],
          lastSyncId: 123,
          projectCreate: projectMockResponse.data.projectCreate,
        });
        expect(mockRawRequest).toHaveBeenCalledTimes(1);
      });

      it('should handle project creation errors', async () => {
        const errorResponse = {
          data: {
            projectCreate: {
              success: false,
              project: null,
              lastSyncId: 123
            }
          }
        };

        mockRawRequest.mockResolvedValueOnce(errorResponse);

        const projectInput: ProjectInput = {
          name: 'New Project',
          teamIds: ['team-1']
        };

        const issueInput: CreateIssueInput = {
          title: 'Project Issue 1',
          description: 'Description 1',
          teamId: 'team-1'
        };

        const result = await graphqlClient.createProjectWithIssues(projectInput, [issueInput]);

        expect(result).toEqual({
          success: false,
          failedStep: 'projectCreate',
          message: 'Project creation did not complete before issue creation began.',
          issueCreationAttempted: false,
          compensationAttempted: false,
          lastSyncId: 123,
          projectCreate: errorResponse.data.projectCreate,
        });
      });

      it('should handle issue creation errors', async () => {
        const projectResponse = {
          data: {
            projectCreate: {
              success: true,
              project: {
                id: 'project-1',
                name: 'New Project',
                url: 'https://linear.app/test/project/1'
              },
              lastSyncId: 123
            }
          }
        };

        const errorResponse = {
          data: {
            issueBatchCreate: {
              success: false,
              issues: [],
              lastSyncId: 124
            }
          }
        };

        mockRawRequest
          .mockResolvedValueOnce(projectResponse)
          .mockResolvedValueOnce(errorResponse);
        mockDeleteProject.mockResolvedValueOnce({
          success: true,
        });

        const projectInput: ProjectInput = {
          name: 'New Project',
          teamIds: ['team-1']
        };

        const issueInput: CreateIssueInput = {
          title: 'Project Issue 1',
          description: 'Description 1',
          teamId: 'team-1'
        };

        const result = await graphqlClient.createProjectWithIssues(projectInput, [issueInput]);

        expect(result).toEqual({
          success: false,
          failedStep: 'issueBatchCreate',
          message: 'Issue creation failed after project creation. The created project was deleted during compensation. Issue creation did not complete successfully.',
          issueCreationAttempted: true,
          compensationAttempted: true,
          compensationSucceeded: true,
          project: projectResponse.data.projectCreate.project,
          issues: [],
          lastSyncId: 124,
          projectCreate: projectResponse.data.projectCreate,
          issueBatchCreate: errorResponse.data.issueBatchCreate,
        });
        expect(mockDeleteProject).toHaveBeenCalledWith('project-1');
      });
    });
  });

  describe('Bulk Operations', () => {
    it('should create multiple issues through the batch mutation', async () => {
      const mockResponse = {
        data: {
          issueBatchCreate: {
            success: true,
            issues: [
              {
                id: 'issue-1',
                identifier: 'TEST-1',
                title: 'Issue 1',
                url: 'https://linear.app/test/issue/TEST-1'
              },
              {
                id: 'issue-2',
                identifier: 'TEST-2',
                title: 'Issue 2',
                url: 'https://linear.app/test/issue/TEST-2'
              }
            ]
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const issues: CreateIssueInput[] = [
        {
          title: 'Issue 1',
          description: 'Description 1',
          teamId: 'team-1'
        },
        {
          title: 'Issue 2',
          description: 'Description 2',
          teamId: 'team-1'
        }
      ];

      const result: IssueBatchResponse = await graphqlClient.createIssues(issues);
      const [query, variables] = mockRawRequest.mock.calls[0];

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalledTimes(1);
      expect(query).toContain('issueBatchCreate(input: $input)');
      expect(query).not.toContain('issueCreate(input: $input)');
      expect(variables).toEqual(expect.objectContaining({
        input: { issues }
      }));
    });

    it('should update multiple issues with a single mutation', async () => {
      const mockResponse = {
        data: {
          issueUpdate: {
            success: true,
            issues: [
              {
                id: 'issue-1',
                identifier: 'TEST-1',
                title: 'Updated Issue 1',
                url: 'https://linear.app/test/issue/TEST-1'
              },
              {
                id: 'issue-2',
                identifier: 'TEST-2',
                title: 'Updated Issue 2',
                url: 'https://linear.app/test/issue/TEST-2'
              }
            ]
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const ids = ['issue-1', 'issue-2'];
      const updateInput: UpdateIssueInput = { stateId: 'state-2' };
      const result: UpdateIssuesResponse = await graphqlClient.updateIssues(ids, updateInput);

      expect(result).toEqual(mockResponse.data);
      // Verify single mutation call
      expect(mockRawRequest).toHaveBeenCalledTimes(1);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ids,
          input: updateInput
        })
      );
    });

    it('should handle update errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Update failed'));

      const updateInput: UpdateIssueInput = { stateId: 'state-2' };
      await expect(
        graphqlClient.updateIssues(['issue-1'], updateInput)
      ).rejects.toThrow('GraphQL operation UpdateIssues failed: Update failed');
    });

    it('should delete multiple issues with a single mutation', async () => {
      const mockResponse = {
        data: {
          issueDelete: {
            success: true
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const ids = ['issue-1', 'issue-2'];
      const result: DeleteIssuesResponse = await graphqlClient.deleteIssues(ids);

      expect(result).toEqual(mockResponse.data);
      // Verify single mutation call
      expect(mockRawRequest).toHaveBeenCalledTimes(1);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          ids
        })
      );
    });
  });

  describe('getTeams', () => {
    it('should successfully fetch teams', async () => {
      const mockResponse = {
        data: {
          teams: {
            nodes: [
              {
                id: 'team-1',
                name: 'Team 1',
                key: 'TEAM1',
                states: [
                  {
                    id: 'state-1',
                    name: 'Todo',
                    type: 'unstarted'
                  }
                ]
              }
            ]
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result: TeamResponse = await graphqlClient.getTeams();

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalled();
    });

    it('should handle team fetch errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Team fetch failed'));

      await expect(graphqlClient.getTeams()).rejects.toThrow(
        'GraphQL operation GetTeams failed: Team fetch failed'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should successfully fetch current user', async () => {
      const mockResponse = {
        data: {
          viewer: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com'
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result: UserResponse = await graphqlClient.getCurrentUser();

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalled();
    });

    it('should handle user fetch errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('User fetch failed'));

      await expect(graphqlClient.getCurrentUser()).rejects.toThrow(
        'GraphQL operation GetUser failed: User fetch failed'
      );
    });
  });

  describe('Label Operations', () => {
    it('should successfully create labels', async () => {
      const mockResponse = {
        data: {
          labelCreate: {
            success: true,
            label: {
              id: 'label-1',
              name: 'bug'
            }
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const labelInput: LabelInput = {
        name: 'bug',
        color: '#FF0000',
        teamId: 'team-1'
      };

      const result: LabelResponse = await graphqlClient.createIssueLabels([labelInput]);

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalled();
    });

    it('should handle label creation errors', async () => {
      mockRawRequest.mockRejectedValueOnce(new Error('Label creation failed'));

      const labelInput: LabelInput = {
        name: 'bug',
        teamId: 'team-1'
      };

      await expect(
        graphqlClient.createIssueLabels([labelInput])
      ).rejects.toThrow('GraphQL operation CreateIssueLabels failed: Label creation failed');
    });
  });

  describe('updateIssue', () => {
    it('should update a single issue', async () => {
      const mockResponse = {
        data: {
          issueUpdate: {
            success: true,
            issue: {
              id: 'issue-1',
              identifier: 'TEST-1',
              title: 'Updated Issue',
              url: 'https://linear.app/test/issue/TEST-1',
              state: {
                name: 'In Progress'
              }
            }
          }
        }
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const id = 'issue-1';
      const updateInput: UpdateIssueInput = { stateId: 'state-2' };
      const result: UpdateIssueResponse = await graphqlClient.updateIssue(id, updateInput);

      expect(result).toEqual(mockResponse.data);
      // Verify single mutation call with direct id (not array)
      expect(mockRawRequest).toHaveBeenCalledTimes(1);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          id,
          input: updateInput
        })
      );
    });
  });

  describe("deleteIssue", () => {
    it("should delete a single issue", async () => {
      const mockResponse = {
        data: {
          issueDelete: {
            success: true,
          },
        },
      }

      mockRawRequest.mockResolvedValueOnce(mockResponse)

      const id = "issue-1"
      const result: DeleteIssueResponse = await graphqlClient.deleteIssue(id)

      expect(result).toEqual(mockResponse.data)
      // Verify single mutation call
      expect(mockRawRequest).toHaveBeenCalledTimes(1)
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          id,
        })
      )
    })
  })

  describe('comment operations', () => {
    const comment = {
      id: 'comment-1',
      body: 'Hello from Linear',
      bodyData: '{"type":"doc"}',
      quotedText: 'Quoted text',
      url: 'https://linear.app/test/comment/comment-1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
      issueId: 'issue-1',
      parentId: 'comment-parent',
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
      parent: {
        id: 'comment-parent',
        body: 'Parent comment',
        createdAt: '2023-12-31T00:00:00.000Z',
        updatedAt: '2023-12-31T00:00:00.000Z',
        user: {
          id: 'user-2',
          name: 'Parent User',
          email: 'parent@example.com',
        },
      },
    };

    it('should get a single comment', async () => {
      const mockResponse = {
        data: {
          comment,
        },
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result = await graphqlClient.getComment({ id: 'comment-1' });

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          id: 'comment-1',
        })
      );
    });

    it('should list comments with native pagination controls', async () => {
      const mockResponse = {
        data: {
          comments: {
            pageInfo: {
              hasNextPage: true,
              endCursor: 'cursor-2',
              hasPreviousPage: true,
              startCursor: 'cursor-1',
            },
            nodes: [comment],
          },
        },
      };

      const filter = {
        issue: {
          id: {
            eq: 'issue-1',
          },
        },
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result = await graphqlClient.listComments({
        last: 5,
        before: 'cursor-1',
        filter,
        includeArchived: true,
        orderBy: 'updatedAt',
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          first: undefined,
          last: 5,
          before: 'cursor-1',
          filter,
          includeArchived: true,
          orderBy: 'updatedAt',
        })
      );
    });

    it('should get issue comments with expanded collection controls', async () => {
      const mockResponse = {
        data: {
          issue: {
            id: 'issue-1',
            identifier: 'TEST-1',
            title: 'Test Issue',
            url: 'https://linear.app/test/issue/TEST-1',
            comments: {
              pageInfo: {
                hasNextPage: true,
                endCursor: 'cursor-2',
                hasPreviousPage: false,
                startCursor: 'cursor-1',
              },
              nodes: [comment],
            },
          },
        },
      };

      const filter = {
        parent: {
          null: true,
        },
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result = await graphqlClient.getIssueComments({
        issueId: 'issue-1',
        first: 25,
        after: 'cursor-1',
        filter,
        includeArchived: true,
        orderBy: 'updatedAt',
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          issueId: 'issue-1',
          first: 25,
          after: 'cursor-1',
          filter,
          includeArchived: true,
          orderBy: 'updatedAt',
        })
      );
    });

    it('should create a threaded reply using parentId', async () => {
      const mockResponse = {
        data: {
          commentCreate: {
            success: true,
            comment,
            lastSyncId: 101,
          },
        },
      };

      const input = {
        body: 'Reply body',
        parentId: 'comment-parent',
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result = await graphqlClient.createComment(input);

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          input,
        })
      );
    });

    it('should update a comment', async () => {
      const mockResponse = {
        data: {
          commentUpdate: {
            success: true,
            comment,
            lastSyncId: 102,
          },
        },
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result = await graphqlClient.updateComment({
        id: 'comment-1',
        body: 'Updated comment body',
      });

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          id: 'comment-1',
          input: {
            body: 'Updated comment body',
          },
        })
      );
    });

    it('should delete a comment', async () => {
      const mockResponse = {
        data: {
          commentDelete: {
            success: true,
            entityId: 'comment-1',
            lastSyncId: 103,
          },
        },
      };

      mockRawRequest.mockResolvedValueOnce(mockResponse);

      const result = await graphqlClient.deleteComment({ id: 'comment-1' });

      expect(result).toEqual(mockResponse.data);
      expect(mockRawRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          id: 'comment-1',
        })
      );
    });

    it('should resolve and unresolve a comment thread', async () => {
      const resolveResponse = {
        data: {
          commentResolve: {
            success: true,
            comment,
            lastSyncId: 104,
          },
        },
      };
      const unresolveResponse = {
        data: {
          commentUnresolve: {
            success: true,
            comment,
            lastSyncId: 105,
          },
        },
      };

      mockRawRequest
        .mockResolvedValueOnce(resolveResponse)
        .mockResolvedValueOnce(unresolveResponse);

      const resolveResult = await graphqlClient.resolveComment({
        id: 'comment-1',
        resolvingCommentId: 'comment-parent',
      });
      const unresolveResult = await graphqlClient.unresolveComment({ id: 'comment-1' });

      expect(resolveResult).toEqual(resolveResponse.data);
      expect(unresolveResult).toEqual(unresolveResponse.data);
      expect(mockRawRequest).toHaveBeenNthCalledWith(
        1,
        expect.any(String),
        expect.objectContaining({
          id: 'comment-1',
          resolvingCommentId: 'comment-parent',
        })
      );
      expect(mockRawRequest).toHaveBeenNthCalledWith(
        2,
        expect.any(String),
        expect.objectContaining({
          id: 'comment-1',
        })
      );
    });
  });

  describe('Project Milestone Operations', () => {
    describe('createProjectMilestone', () => {
      it('should successfully create a project milestone', async () => {
        const mockResponse = {
          data: {
            projectMilestoneCreate: {
              success: true,
              projectMilestone: {
                id: 'milestone-1',
                name: 'Q1 Milestone',
                description: 'First quarter milestone',
                status: 'unstarted',
                progress: 0,
                project: {
                  id: 'project-1',
                  name: 'Test Project',
                },
                targetDate: '2024-03-31',
              },
              lastSyncId: 123,
            },
          },
        };

        mockRawRequest.mockResolvedValueOnce(mockResponse);

        const input: ProjectMilestoneCreateInput = {
          name: 'Q1 Milestone',
          description: 'First quarter milestone',
          projectId: 'project-1',
          targetDate: '2024-03-31',
        };

        const result: ProjectMilestoneResponse = await graphqlClient.createProjectMilestone(input);

        expect(result).toEqual(mockResponse.data);
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            input: input
          })
        );
      });

      it('should handle creation errors', async () => {
        mockRawRequest.mockRejectedValueOnce(new Error('Milestone creation failed'));

        const input: ProjectMilestoneCreateInput = {
          name: 'Q1 Milestone',
          projectId: 'project-1',
        };

        await expect(
          graphqlClient.createProjectMilestone(input)
        ).rejects.toThrow('GraphQL operation CreateProjectMilestone failed: Milestone creation failed');
      });
    });

    describe('updateProjectMilestone', () => {
      it('should successfully update a project milestone', async () => {
        const mockResponse = {
          data: {
            projectMilestoneUpdate: {
              success: true,
              projectMilestone: {
                id: 'milestone-1',
                name: 'Updated Milestone',
                description: 'Updated description',
                status: 'next',
                progress: 25,
                project: {
                  id: 'project-1',
                  name: 'Test Project',
                },
                targetDate: '2024-04-30',
              },
              lastSyncId: 124,
            },
          },
        };

        mockRawRequest.mockResolvedValueOnce(mockResponse);

        const input: ProjectMilestoneUpdateInput = {
          name: 'Updated Milestone',
          description: 'Updated description',
          targetDate: '2024-04-30',
        };

        const result: ProjectMilestoneUpdateResponse = await graphqlClient.updateProjectMilestone('milestone-1', input);

        expect(result).toEqual(mockResponse.data);
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            id: 'milestone-1',
            input: input
          })
        );
      });

      it('should handle update errors', async () => {
        mockRawRequest.mockRejectedValueOnce(new Error('Milestone update failed'));

        const input: ProjectMilestoneUpdateInput = {
          name: 'Updated Milestone',
        };

        await expect(
          graphqlClient.updateProjectMilestone('milestone-1', input)
        ).rejects.toThrow('GraphQL operation UpdateProjectMilestone failed: Milestone update failed');
      });
    });

    describe('deleteProjectMilestone', () => {
      it('should successfully delete a project milestone', async () => {
        const mockResponse = {
          data: {
            projectMilestoneDelete: {
              success: true,
              lastSyncId: 125,
            },
          },
        };

        mockRawRequest.mockResolvedValueOnce(mockResponse);

        const result: ProjectMilestoneDeleteResponse = await graphqlClient.deleteProjectMilestone('milestone-1');

        expect(result).toEqual(mockResponse.data);
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            id: 'milestone-1'
          })
        );
      });

      it('should handle deletion errors', async () => {
        mockRawRequest.mockRejectedValueOnce(new Error('Milestone deletion failed'));

        await expect(
          graphqlClient.deleteProjectMilestone('milestone-1')
        ).rejects.toThrow('GraphQL operation DeleteProjectMilestone failed: Milestone deletion failed');
      });
    });

    describe('getProjectMilestone', () => {
      it('should successfully get a project milestone', async () => {
        const mockResponse = {
          data: {
            projectMilestone: {
              id: 'milestone-1',
              name: 'Q1 Milestone',
              description: 'First quarter milestone',
              documentContent: {
                content: 'Rich text content',
              },
              status: 'unstarted',
              progress: 0,
              project: {
                id: 'project-1',
                name: 'Test Project',
              },
              issues: {
                pageInfo: { hasNextPage: false },
                nodes: [],
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z',
            },
          },
        };

        mockRawRequest.mockResolvedValueOnce(mockResponse);

        const result: GetProjectMilestoneResponse = await graphqlClient.getProjectMilestone('milestone-1');

        expect(result).toEqual(mockResponse.data);
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            id: 'milestone-1'
          })
        );
      });

      it('should handle get errors', async () => {
        mockRawRequest.mockRejectedValueOnce(new Error('Milestone fetch failed'));

        await expect(
          graphqlClient.getProjectMilestone('milestone-1')
        ).rejects.toThrow('GraphQL operation GetProjectMilestone failed: Milestone fetch failed');
      });
    });

    describe('searchProjectMilestones', () => {
      it('should successfully search project milestones', async () => {
        const mockResponse = {
          data: {
            projectMilestones: {
              pageInfo: { hasNextPage: false, endCursor: null },
              nodes: [
                {
                  id: 'milestone-1',
                  name: 'Q1 Milestone',
                  description: 'First quarter milestone',
                  documentContent: null,
                  status: 'unstarted',
                  progress: 0,
                  project: {
                    id: 'project-1',
                    name: 'Test Project',
                  },
                  issues: {
                    pageInfo: { hasNextPage: false },
                    nodes: [],
                  },
                  createdAt: '2024-01-01T00:00:00Z',
                  updatedAt: '2024-01-01T00:00:00Z',
                },
              ],
            },
          },
        };

        mockRawRequest.mockResolvedValueOnce(mockResponse);

        const result: SearchProjectMilestonesResponse = await graphqlClient.searchProjectMilestones({
          filter: { name: { eq: 'Q1 Milestone' } },
          first: 10,
        });

        expect(result).toEqual(mockResponse.data);
        expect(mockRawRequest).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            filter: { name: { eq: 'Q1 Milestone' } },
            first: 10,
            after: undefined,
            orderBy: 'updatedAt'
          })
        );
      });

      it('should handle search errors', async () => {
        mockRawRequest.mockRejectedValueOnce(new Error('Milestone search failed'));

        await expect(
          graphqlClient.searchProjectMilestones({})
        ).rejects.toThrow('GraphQL operation SearchProjectMilestones failed: Milestone search failed');
      });
    });

    describe('createProjectMilestones (bulk)', () => {
      it('should successfully create multiple project milestones', async () => {
        const mockResponses = [
          {
            data: {
              projectMilestoneCreate: {
                success: true,
                projectMilestone: {
                  id: 'milestone-1',
                  name: 'Feature Requirements',
                  description: 'Before we can architect, we need a coherent Feature Requirements document with sign-off from product',
                  status: 'unstarted',
                  progress: 0,
                  project: {
                    id: 'project-1',
                    name: 'Test Project',
                  },
                },
                lastSyncId: 123,
              },
            },
          },
          {
            data: {
              projectMilestoneCreate: {
                success: true,
                projectMilestone: {
                  id: 'milestone-2',
                  name: 'Design Approval',
                  description: 'We need to coordinate with the design team and get sign-off from the product team',
                  status: 'unstarted',
                  progress: 0,
                  project: {
                    id: 'project-1',
                    name: 'Test Project',
                  },
                },
                lastSyncId: 124,
              },
            },
          },
          {
            data: {
              projectMilestoneCreate: {
                success: true,
                projectMilestone: {
                  id: 'milestone-3',
                  name: 'Architecture Approved',
                  description: 'Before we begin execution, we want to get sign-off from the architecture team',
                  status: 'unstarted',
                  progress: 0,
                  project: {
                    id: 'project-1',
                    name: 'Test Project',
                  },
                },
                lastSyncId: 125,
              },
            },
          },
        ];

        mockRawRequest
          .mockResolvedValueOnce(mockResponses[0])
          .mockResolvedValueOnce(mockResponses[1])
          .mockResolvedValueOnce(mockResponses[2]);

        const milestones: ProjectMilestoneCreateInput[] = [
          {
            name: 'Feature Requirements',
            description: 'Before we can architect, we need a coherent Feature Requirements document with sign-off from product',
            projectId: 'project-1',
            sortOrder: 1,
          },
          {
            name: 'Design Approval',
            description: 'We need to coordinate with the design team and get sign-off from the product team',
            projectId: 'project-1',
            sortOrder: 2,
          },
          {
            name: 'Architecture Approved',
            description: 'Before we begin execution, we want to get sign-off from the architecture team',
            projectId: 'project-1',
            sortOrder: 3,
          },
        ];

        // Test the bulk creation by calling createProjectMilestone multiple times
        const results: ProjectMilestoneResponse[] = [];
        for (const milestone of milestones) {
          const result = await graphqlClient.createProjectMilestone(milestone);
          results.push(result);
        }

        expect(results).toHaveLength(3);
        expect(results[0]).toEqual(mockResponses[0].data);
        expect(results[1]).toEqual(mockResponses[1].data);
        expect(results[2]).toEqual(mockResponses[2].data);

        // Verify all three mutations were called
        expect(mockRawRequest).toHaveBeenCalledTimes(3);
        
        // Verify each call had the correct input
        expect(mockRawRequest).toHaveBeenNthCalledWith(1, 
          expect.any(String),
          expect.objectContaining({ input: milestones[0] })
        );
        expect(mockRawRequest).toHaveBeenNthCalledWith(2,
          expect.any(String), 
          expect.objectContaining({ input: milestones[1] })
        );
        expect(mockRawRequest).toHaveBeenNthCalledWith(3,
          expect.any(String),
          expect.objectContaining({ input: milestones[2] })
        );
      });

      it('should handle partial failures in bulk creation', async () => {
        const mockResponses = [
          {
            data: {
              projectMilestoneCreate: {
                success: true,
                projectMilestone: {
                  id: 'milestone-1',
                  name: 'Feature Requirements',
                  status: 'unstarted',
                  progress: 0,
                  project: {
                    id: 'project-1',
                    name: 'Test Project',
                  },
                },
                lastSyncId: 123,
              },
            },
          },
        ];

        mockRawRequest
          .mockResolvedValueOnce(mockResponses[0])
          .mockRejectedValueOnce(new Error('Second milestone failed'));

        const milestones: ProjectMilestoneCreateInput[] = [
          {
            name: 'Feature Requirements',
            projectId: 'project-1',
            sortOrder: 1,
          },
          {
            name: 'Design Approval',
            projectId: 'project-1',
            sortOrder: 2,
          },
        ];

        // Test that first succeeds and second fails
        const firstResult = await graphqlClient.createProjectMilestone(milestones[0]);
        expect(firstResult).toEqual(mockResponses[0].data);

        await expect(
          graphqlClient.createProjectMilestone(milestones[1])
        ).rejects.toThrow('GraphQL operation CreateProjectMilestone failed: Second milestone failed');

        expect(mockRawRequest).toHaveBeenCalledTimes(2);
      });
    });
  });
});
