import { LinearClient } from '@linear/sdk';
import { DocumentNode, Kind, OperationDefinitionNode } from 'graphql';
import { 
  CreateIssueInput, 
  CreateIssueResponse,
  DeleteIssuesResponse,
  UpdateIssueResponse,
  UpdateIssueInput,
  UpdateIssuesResponse,
  SearchIssuesInput,
  SearchIssuesResponse,
  DeleteIssueResponse,
  Issue,
  IssueBatchResponse
} from '../features/issues/types/issue.types.js';
import {
  ProjectInput,
  ProjectResponse,
  ProjectWithIssuesOutcome,
  SearchProjectsResponse,
  GetProjectResponse
} from '../features/projects/types/project.types.js';
import {
  TeamResponse,
  LabelInput,
  LabelResponse
} from '../features/teams/types/team.types.js';
import {
  UserResponse
} from '../features/users/types/user.types.js';
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
  UpdateCommentResponse
} from '../features/comments/types/comment.types.js';
import {
  ProjectMilestoneCreateInput,
  ProjectMilestoneUpdateInput,
  ProjectMilestoneResponse,
  ProjectMilestoneUpdateResponse,
  ProjectMilestoneDeleteResponse,
  SearchProjectMilestonesResponse,
  GetProjectMilestoneResponse
} from '../features/milestones/types/milestone.types.js';
import {
  asRecord,
  compactObject,
  getString,
  getBoolean,
} from '../types/sdk.utils.js';

export interface GraphQLErrorDetail {
  message: string;
  path?: Array<string | number>;
  extensions?: Record<string, unknown>;
}

export interface GraphQLResponseMetadata {
  status?: number;
  retryable: boolean;
  headers: Record<string, string>;
}

export interface GraphQLResult<T> {
  data?: T;
  errors?: GraphQLErrorDetail[];
  extensions?: Record<string, unknown>;
  meta: GraphQLResponseMetadata;
}

interface RawGraphQLResponse<T> {
  data?: T;
  errors?: unknown[];
  extensions?: unknown;
  headers?: Headers | Map<string, string> | Record<string, string>;
  status?: number;
}

export class LinearGraphQLRequestError extends Error {
  constructor(
    public readonly operation: string,
    public readonly result: GraphQLResult<unknown>,
    message?: string
  ) {
    super(message ?? `GraphQL operation ${operation} failed`);
    this.name = 'LinearGraphQLRequestError';
  }
}

export class LinearGraphQLClient {
  private linearClient: LinearClient;

  constructor(linearClient: LinearClient) {
    this.linearClient = linearClient;
  }

  get sdk(): LinearClient {
    return this.linearClient;
  }

  async execute<T, V extends Record<string, unknown> = Record<string, unknown>>(
    document: DocumentNode,
    variables?: V
  ): Promise<GraphQLResult<T>> {
    const graphQLClient = this.linearClient.client;
    const operationName = this.getOperationName(document);

    try {
      const response = await graphQLClient.rawRequest(
        document.loc?.source.body || '',
        variables
      ) as unknown as RawGraphQLResponse<T>;

      const result: GraphQLResult<T> = {
        data: response.data,
        errors: this.normalizeErrors(response.errors),
        extensions: this.normalizeExtensions(response.extensions),
        meta: {
          status: response.status,
          retryable: this.isRetryable(response.status, this.normalizeErrors(response.errors)),
          headers: this.normalizeHeaders(response.headers),
        },
      };

      if (!result.data && (result.errors?.length ?? 0) > 0) {
        throw new LinearGraphQLRequestError(
          operationName,
          result,
          this.buildErrorMessage(operationName, result.errors)
        );
      }

      return result;
    } catch (error) {
      if (error instanceof LinearGraphQLRequestError) {
        throw error;
      }

      const result = this.createErrorResult(operationName, error);
      throw new LinearGraphQLRequestError(
        operationName,
        result,
        this.buildErrorMessage(operationName, result.errors)
      );
    }
  }

  async executeData<T, V extends Record<string, unknown> = Record<string, unknown>>(
    document: DocumentNode,
    variables?: V
  ): Promise<T> {
    const result = await this.execute<T, V>(document, variables);
    if (result.data === undefined) {
      throw new LinearGraphQLRequestError(
        this.getOperationName(document),
        result,
        `GraphQL operation ${this.getOperationName(document)} returned no data`
      );
    }

    return result.data;
  }

  async executeSdk<T>(
    operationName: string,
    request: () => Promise<T>
  ): Promise<T> {
    try {
      return await request();
    } catch (error) {
      const result = this.createErrorResult(operationName, error);
      throw new LinearGraphQLRequestError(
        operationName,
        result,
        this.buildErrorMessage(operationName, result.errors)
      );
    }
  }

  // Create single issue
  async createIssue(input: CreateIssueInput): Promise<CreateIssueResponse> {
    const { CREATE_ISSUE_MUTATION } = await import('./mutations.js');
    return this.executeData<CreateIssueResponse>(CREATE_ISSUE_MUTATION, { input });
  }

  // Create multiple issues
  async createIssues(issues: CreateIssueInput[]): Promise<IssueBatchResponse> {
    const { CREATE_BATCH_ISSUES } = await import('./mutations.js');
    return this.executeData<IssueBatchResponse>(CREATE_BATCH_ISSUES, {
      input: { issues }
    });
  }

  // Create a project
  async createProject(input: ProjectInput): Promise<ProjectResponse> {
    const { CREATE_PROJECT } = await import('./mutations.js');
    return this.executeData<ProjectResponse>(CREATE_PROJECT, { input });
  }

  // Helper method to create a project with associated issues
  async createProjectWithIssues(
    projectInput: ProjectInput,
    issues: CreateIssueInput[]
  ): Promise<ProjectWithIssuesOutcome> {
    const projectResult = await this.createProject(projectInput);

    const project = projectResult.projectCreate.project;
    const projectId = projectResult.projectCreate.project?.id;
    if (!projectResult.projectCreate.success || !projectId || !project) {
      return {
        success: false,
        failedStep: 'projectCreate',
        message: 'Project creation did not complete before issue creation began.',
        issueCreationAttempted: false,
        compensationAttempted: false,
        lastSyncId: projectResult.projectCreate.lastSyncId,
        projectCreate: projectResult.projectCreate,
      };
    }

    if (issues.length === 0) {
      return {
        success: true,
        project,
        issues: [],
        lastSyncId: projectResult.projectCreate.lastSyncId,
        projectCreate: projectResult.projectCreate,
      };
    }

    const issuesWithProject = issues.map(issue => ({
      ...issue,
      projectId
    }));

    try {
      const issuesResult = await this.createIssues(issuesWithProject);

      if (!issuesResult.issueBatchCreate.success) {
        return await this.compensateProjectIssueFailure(
          project,
          projectResult,
          issuesResult
        );
      }

      return {
        success: true,
        project,
        issues: issuesResult.issueBatchCreate.issues,
        lastSyncId: issuesResult.issueBatchCreate.lastSyncId ?? projectResult.projectCreate.lastSyncId,
        projectCreate: projectResult.projectCreate,
        issueBatchCreate: issuesResult.issueBatchCreate,
      };
    } catch (error) {
      return await this.compensateProjectIssueFailure(
        project,
        projectResult,
        undefined,
        error
      );
    }
  }

  // Update a single issue
  async updateIssue(id: string, input: UpdateIssueInput): Promise<UpdateIssueResponse> {
    const { UPDATE_ISSUE_MUTATION } = await import('./mutations.js');
    return this.executeData<UpdateIssueResponse>(UPDATE_ISSUE_MUTATION, {
      id,
      input,
    });
  }

  // Bulk update issues
  async updateIssues(ids: string[], input: UpdateIssueInput): Promise<UpdateIssuesResponse> {
    const { UPDATE_ISSUES_MUTATION } = await import('./mutations.js');
    return this.executeData<UpdateIssuesResponse>(UPDATE_ISSUES_MUTATION, { ids, input });
  }

  // Create multiple labels
  async createIssueLabels(labels: LabelInput[]): Promise<LabelResponse> {
    const { CREATE_ISSUE_LABELS } = await import('./mutations.js');
    return this.executeData<LabelResponse>(CREATE_ISSUE_LABELS, { labels });
  }

  // Search issues with pagination — uses raw GraphQL to avoid SDK
  // variable-mapping bugs (the SDK's searchIssues can leak the query
  // term into the $filter variable on some SDK/API version combinations).
  async searchIssues(
    query: string,
    options: Omit<SearchIssuesInput, 'query'> = {}
  ): Promise<SearchIssuesResponse> {
    const first = options.first ?? 50;
    const exactIdentifierFilter = this.buildIssueIdentifierFilter(query, options.filter);
    const filter = exactIdentifierFilter ?? options.filter;

    const { SEARCH_ISSUES_QUERY } = await import('./queries.js');

    const variables: Record<string, unknown> = {
      term: query,
      first,
    };

    if (filter && Object.keys(filter).length > 0) {
      variables.filter = filter;
    }

    if (options.after !== undefined) {
      variables.after = options.after;
    }

    const result = await this.executeData<{ searchIssues: {
      totalCount?: number;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: Issue[];
    } }>(SEARCH_ISSUES_QUERY, variables);

    const payload = {
      issues: {
        pageInfo: result.searchIssues.pageInfo,
        nodes: result.searchIssues.nodes ?? [],
      },
      totalCount: result.searchIssues.totalCount,
    };

    if (options.after === undefined && payload.issues.nodes.length === 0) {
      const exactIssue = await this.findIssueByIdentifier(query, options.filter);
      if (exactIssue) {
        return {
          issues: {
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
            nodes: first > 0 ? [exactIssue as Issue] : [],
          },
          totalCount: 1,
        };
      }
    }

    return payload;
  }

  async findIssueByIdentifier(
    identifier: string,
    extraFilter: Record<string, unknown> = {}
  ): Promise<unknown | undefined> {
    const filter = this.buildIssueIdentifierFilter(identifier, extraFilter);
    if (!filter) {
      return undefined;
    }

    const connection = await this.executeSdk(
      'issues',
      () => this.sdk.issues({
        filter,
        first: 1,
      })
    );

    const nodes = asRecord(connection).nodes;
    return Array.isArray(nodes) ? nodes[0] : undefined;
  }

  // Get teams with their states and labels
  async getTeams(): Promise<TeamResponse> {
    const { GET_TEAMS_QUERY } = await import('./queries.js');
    return this.executeData<TeamResponse>(GET_TEAMS_QUERY);
  }

  // Get current user info
  async getCurrentUser(): Promise<UserResponse> {
    const { GET_USER_QUERY } = await import('./queries.js');
    return this.executeData<UserResponse>(GET_USER_QUERY);
  }

  // Get project info with documentContent support
  async getProject(id: string): Promise<GetProjectResponse> {
    const { GET_PROJECT_QUERY } = await import('./queries.js');
    return this.executeData<GetProjectResponse>(GET_PROJECT_QUERY, { id });
  }

  // Search projects with documentContent support
  async searchProjects(filter: { name?: { eq: string } }): Promise<SearchProjectsResponse> {
    const { SEARCH_PROJECTS_QUERY } = await import('./queries.js');
    return this.executeData<SearchProjectsResponse>(SEARCH_PROJECTS_QUERY, { filter });
  }

  // Delete a single issue
  async deleteIssue(id: string): Promise<DeleteIssueResponse> {
    const { DELETE_ISSUE_MUTATION } = await import('./mutations.js');
    return this.executeData<DeleteIssueResponse>(DELETE_ISSUE_MUTATION, {
      id,
    })
  }

  // Delete multiple issues
  async deleteIssues(ids: string[]): Promise<DeleteIssuesResponse> {
    const { DELETE_ISSUES_MUTATION } = await import('./mutations.js');
    return this.executeData<DeleteIssuesResponse>(DELETE_ISSUES_MUTATION, { ids });
  }

  async getComment({ id }: GetCommentInput): Promise<GetCommentResponse> {
    const { GET_COMMENT_QUERY } = await import('./queries.js');
    return this.executeData<GetCommentResponse>(GET_COMMENT_QUERY, { id });
  }

  async listComments(options: ListCommentsInput = {}): Promise<ListCommentsResponse> {
    const { LIST_COMMENTS_QUERY } = await import('./queries.js');
    const first = options.first ?? (options.last === undefined ? 50 : undefined);

    return this.executeData<ListCommentsResponse>(LIST_COMMENTS_QUERY, {
      first,
      after: options.after,
      last: options.last,
      before: options.before,
      filter: options.filter,
      includeArchived: options.includeArchived ?? false,
      orderBy: options.orderBy ?? 'createdAt',
    });
  }

  // Get comments for an issue
  async getIssueComments(options: GetIssueCommentsInput): Promise<GetIssueCommentsResponse> {
    const { GET_ISSUE_COMMENTS_QUERY } = await import('./queries.js');
    const first = options.first ?? (options.last === undefined ? 50 : undefined);

    return this.executeData<GetIssueCommentsResponse>(GET_ISSUE_COMMENTS_QUERY, {
      issueId: options.issueId,
      first,
      after: options.after,
      last: options.last,
      before: options.before,
      filter: options.filter,
      includeArchived: options.includeArchived ?? false,
      orderBy: options.orderBy ?? 'createdAt',
    });
  }

  private parseIssueIdentifier(identifier: string): {
    teamKey: string;
    issueNumber: number;
  } | undefined {
    const match = identifier.trim().match(/^([A-Za-z][A-Za-z0-9]*)-(\d+)$/);
    if (!match) {
      return undefined;
    }

    const issueNumber = Number.parseInt(match[2], 10);
    if (!Number.isSafeInteger(issueNumber)) {
      return undefined;
    }

    return {
      teamKey: match[1].toUpperCase(),
      issueNumber,
    };
  }

  private buildIssueIdentifierFilter(
    identifier: string,
    extraFilter: Record<string, unknown> = {}
  ): Record<string, unknown> | undefined {
    const parsed = this.parseIssueIdentifier(identifier);
    if (!parsed) {
      return undefined;
    }

    return compactObject({
      ...extraFilter,
      team: {
        ...asRecord(extraFilter.team),
        key: {
          eq: parsed.teamKey,
        },
      },
      number: {
        eq: parsed.issueNumber,
      },
    });
  }

  // Create a comment
  async createComment(input: CreateCommentInput): Promise<CreateCommentResponse> {
    const { CREATE_COMMENT_MUTATION } = await import('./mutations.js');
    return this.executeData<CreateCommentResponse>(CREATE_COMMENT_MUTATION, { input });
  }

  async updateComment({ id, ...input }: UpdateCommentInput): Promise<UpdateCommentResponse> {
    const { UPDATE_COMMENT_MUTATION } = await import('./mutations.js');
    return this.executeData<UpdateCommentResponse>(UPDATE_COMMENT_MUTATION, {
      id,
      input,
    });
  }

  async deleteComment({ id }: DeleteCommentInput): Promise<DeleteCommentResponse> {
    const { DELETE_COMMENT_MUTATION } = await import('./mutations.js');
    return this.executeData<DeleteCommentResponse>(DELETE_COMMENT_MUTATION, { id });
  }

  async resolveComment({
    id,
    resolvingCommentId,
  }: ResolveCommentInput): Promise<ResolveCommentResponse> {
    const { RESOLVE_COMMENT_MUTATION } = await import('./mutations.js');
    return this.executeData<ResolveCommentResponse>(RESOLVE_COMMENT_MUTATION, {
      id,
      resolvingCommentId,
    });
  }

  async unresolveComment({ id }: UnresolveCommentInput): Promise<UnresolveCommentResponse> {
    const { UNRESOLVE_COMMENT_MUTATION } = await import('./mutations.js');
    return this.executeData<UnresolveCommentResponse>(UNRESOLVE_COMMENT_MUTATION, {
      id,
    });
  }

  // Create a project milestone
  async createProjectMilestone(input: ProjectMilestoneCreateInput): Promise<ProjectMilestoneResponse> {
    const { CREATE_PROJECT_MILESTONE_MUTATION } = await import('./mutations.js');
    return this.executeData<ProjectMilestoneResponse>(CREATE_PROJECT_MILESTONE_MUTATION, { input });
  }

  // Update a project milestone
  async updateProjectMilestone(id: string, input: ProjectMilestoneUpdateInput): Promise<ProjectMilestoneUpdateResponse> {
    const { UPDATE_PROJECT_MILESTONE_MUTATION } = await import('./mutations.js');
    return this.executeData<ProjectMilestoneUpdateResponse>(UPDATE_PROJECT_MILESTONE_MUTATION, { id, input });
  }

  // Delete a project milestone
  async deleteProjectMilestone(id: string): Promise<ProjectMilestoneDeleteResponse> {
    const { DELETE_PROJECT_MILESTONE_MUTATION } = await import('./mutations.js');
    return this.executeData<ProjectMilestoneDeleteResponse>(DELETE_PROJECT_MILESTONE_MUTATION, { id });
  }

  // Get a specific project milestone
  async getProjectMilestone(id: string): Promise<GetProjectMilestoneResponse> {
    const { GET_PROJECT_MILESTONE_QUERY } = await import('./queries.js');
    return this.executeData<GetProjectMilestoneResponse>(GET_PROJECT_MILESTONE_QUERY, { id });
  }

  // Search project milestones with filtering and pagination
  async searchProjectMilestones(options: {
    filter?: any;
    first?: number;
    after?: string;
    orderBy?: string;
  } = {}): Promise<SearchProjectMilestonesResponse> {
    const { SEARCH_PROJECT_MILESTONES_QUERY } = await import('./queries.js');
    return this.executeData<SearchProjectMilestonesResponse>(SEARCH_PROJECT_MILESTONES_QUERY, {
      filter: options.filter,
      first: options.first || 50,
      after: options.after,
      orderBy: options.orderBy || 'updatedAt'
    });
  }

  private getOperationName(document: DocumentNode): string {
    const definition = document.definitions.find(
      (item): item is OperationDefinitionNode => item.kind === Kind.OPERATION_DEFINITION
    );

    return definition?.name?.value ?? 'anonymousOperation';
  }

  private normalizeHeaders(
    headers?: Headers | Map<string, string> | Record<string, string>
  ): Record<string, string> {
    if (!headers) {
      return {};
    }

    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries());
    }

    if (headers instanceof Map) {
      return Object.fromEntries(headers.entries());
    }

    return headers;
  }

  private normalizeExtensions(
    extensions?: unknown
  ): Record<string, unknown> | undefined {
    if (!extensions || typeof extensions !== 'object' || Array.isArray(extensions)) {
      return undefined;
    }

    return extensions as Record<string, unknown>;
  }

  private createErrorResult(
    operationName: string,
    error: unknown
  ): GraphQLResult<unknown> {
    const response = this.extractRawResponse(error);
    return {
      data: response.data,
      errors: this.normalizeErrors(response.errors) ?? [
        {
          message: error instanceof Error ? error.message : `GraphQL operation ${operationName} failed`,
        },
      ],
      extensions: this.normalizeExtensions(response.extensions),
      meta: {
        status: response.status,
        retryable: this.isRetryable(response.status, this.normalizeErrors(response.errors)),
        headers: this.normalizeHeaders(response.headers),
      },
    };
  }

  private extractRawResponse(error: unknown): RawGraphQLResponse<unknown> {
    if (typeof error !== 'object' || error === null) {
      return {};
    }

    const response = (error as { response?: RawGraphQLResponse<unknown> }).response;
    return response ?? {};
  }

  private normalizeErrors(errors?: unknown[]): GraphQLErrorDetail[] | undefined {
    if (!errors || errors.length === 0) {
      return undefined;
    }

    return errors.map(error => {
      if (typeof error !== 'object' || error === null) {
        return {
          message: String(error),
        };
      }

      const graphQLError = error as {
        message?: unknown;
        type?: unknown;
        path?: unknown;
        extensions?: unknown;
      };

      const message = typeof graphQLError.message === 'string'
        ? graphQLError.message
        : typeof graphQLError.type === 'string'
          ? graphQLError.type
          : 'Unknown GraphQL error';

      const path = Array.isArray(graphQLError.path)
        ? graphQLError.path.filter(
            (segment): segment is string | number =>
              typeof segment === 'string' || typeof segment === 'number'
          )
        : undefined;

      const extensions = graphQLError.extensions && typeof graphQLError.extensions === 'object' && !Array.isArray(graphQLError.extensions)
        ? graphQLError.extensions as Record<string, unknown>
        : undefined;

      return {
        message,
        path,
        extensions,
      };
    });
  }

  private isRetryable(
    status?: number,
    errors?: GraphQLErrorDetail[]
  ): boolean {
    if (status !== undefined && [408, 409, 425, 429, 500, 502, 503, 504].includes(status)) {
      return true;
    }

    return (errors ?? []).some(error => {
      const code = typeof error.extensions?.code === 'string'
        ? error.extensions.code.toUpperCase()
        : '';

      return ['RATE_LIMITED', 'THROTTLED', 'TIMEOUT', 'INTERNAL_SERVER_ERROR', 'SERVICE_UNAVAILABLE'].includes(code);
    });
  }

  private buildErrorMessage(
    operationName: string,
    errors?: GraphQLErrorDetail[]
  ): string {
    const firstMessage = errors?.[0]?.message;
    return firstMessage
      ? `GraphQL operation ${operationName} failed: ${firstMessage}`
      : `GraphQL operation ${operationName} failed`;
  }

  private async compensateProjectIssueFailure(
    project: ProjectResponse['projectCreate']['project'],
    projectResult: ProjectResponse,
    issuesResult?: IssueBatchResponse,
    issueError?: unknown
  ): Promise<ProjectWithIssuesOutcome> {
    const projectId = project?.id;
    const projectDeleteResult = projectId
      ? await this.tryDeleteProject(projectId)
      : { success: false, error: 'Project identifier was not available for compensation.' };

    const baseMessage = issueError instanceof Error
      ? issueError.message
      : 'Issue creation did not complete successfully.';
    const issues = issuesResult?.issueBatchCreate.issues ?? [];

    return {
      success: false,
      failedStep: 'issueBatchCreate',
      message: projectDeleteResult.success
        ? `Issue creation failed after project creation. The created project was deleted during compensation. ${baseMessage}`
        : `Issue creation failed after project creation and compensation did not remove the created project. ${baseMessage}`,
      issueCreationAttempted: true,
      compensationAttempted: true,
      compensationSucceeded: projectDeleteResult.success,
      project,
      issues,
      lastSyncId: issuesResult?.issueBatchCreate.lastSyncId ?? projectResult.projectCreate.lastSyncId,
      projectCreate: projectResult.projectCreate,
      issueBatchCreate: issuesResult?.issueBatchCreate,
    };
  }

  private async tryDeleteProject(
    projectId: string
  ): Promise<{ success: true } | { success: false; error: string }> {
    try {
      const payload = await this.executeSdk(
        'deleteProject',
        () => this.linearClient.deleteProject(projectId)
      );

      if (getBoolean(payload, 'success') ?? true) {
        return { success: true };
      }

      return {
        success: false,
        error: 'Project deletion returned success false during compensation.',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compensation error',
      };
    }
  }
}
