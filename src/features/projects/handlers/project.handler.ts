import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import {
  asRecord,
  callFetchMethod,
  compactObject,
  getBoolean,
  getDateString,
  getNumber,
  getString,
  mapConnection,
  resolveValue,
  toPageInfo,
} from '../../../types/sdk.utils.js';
import {
  ListProjectsInput,
  ProjectHandlerMethods,
  ProjectInput,
  ProjectUpdateCreateInput,
  ProjectUpdateUpdateInput,
  SearchProjectsInput,
  UpdateProjectInput,
} from '../types/project.types.js';

export class ProjectHandler extends BaseHandler implements ProjectHandlerMethods {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleCreateProject(args: ProjectInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['name', 'teamIds']);

      const payload = await client.executeSdk(
        'createProject',
        () => client.sdk.createProject(args)
      );

      const project = await resolveValue(asRecord(payload).project as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Created project ${getString(project, 'name') ?? args.name}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          project: await this.mapProjectDetail(project),
          lastSyncId: getNumber(payload, 'lastSyncId'),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create project');
    }
  }

  async handleUpdateProject(args: UpdateProjectInput & { id: string }): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const { id, ...input } = args;
      const payload = await client.executeSdk(
        'updateProject',
        () => client.sdk.updateProject(id, input)
      );

      const project = await resolveValue(asRecord(payload).project as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Updated project ${getString(project, 'name') ?? id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          project: await this.mapProjectDetail(project),
          lastSyncId: getNumber(payload, 'lastSyncId'),
        }
      );
    } catch (error) {
      return this.handleError(error, 'update project');
    }
  }

  async handleDeleteProject(args: { id: string }): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const payload = await client.executeSdk(
        'deleteProject',
        () => client.sdk.deleteProject(args.id)
      );

      return this.createStructuredResponse(
        `Deleted project ${args.id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          id: args.id,
        }
      );
    } catch (error) {
      return this.handleError(error, 'delete project');
    }
  }

  async handleCreateProjectWithIssues(args: {
    project: ProjectInput;
    issues: Array<Record<string, unknown>>;
  }): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['project', 'issues']);

      if (!Array.isArray(args.project.teamIds) || args.project.teamIds.length === 0) {
        throw new Error('project.teamIds must be a non-empty array');
      }

      if (!Array.isArray(args.issues)) {
        throw new Error('issues must be an array');
      }

      const projectPayload = await client.executeSdk(
        'createProject',
        () => client.sdk.createProject(args.project)
      );
      const project = await resolveValue(asRecord(projectPayload).project as Promise<unknown> | unknown);
      const projectId = getString(project, 'id');

      const issuesToCreate = args.issues.map(issue => ({
        ...issue,
        projectId,
      }));

      const issuePayload = issuesToCreate.length > 0
        ? await client.executeSdk(
            'createIssueBatch',
            () => client.sdk.createIssueBatch({ issues: issuesToCreate as never[] })
          )
        : undefined;

      const createdIssues = issuePayload && Array.isArray(asRecord(issuePayload).issues)
        ? asRecord(issuePayload).issues as unknown[]
        : [];

      return this.createStructuredResponse(
        `Created project ${getString(project, 'name') ?? args.project.name}${createdIssues.length > 0 ? ` with ${createdIssues.length} issues` : ''}`,
        {
          success: (getBoolean(projectPayload, 'success') ?? true) && (issuePayload ? (getBoolean(issuePayload, 'success') ?? true) : true),
          project: await this.mapProjectDetail(project),
          issues: await Promise.all(createdIssues.map(issue => this.mapIssueReference(issue))),
          lastSyncId: issuePayload ? getNumber(issuePayload, 'lastSyncId') : getNumber(projectPayload, 'lastSyncId'),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create project with issues');
    }
  }

  async handleGetProject(args: { id: string }): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const project = await client.executeSdk(
        'project',
        () => client.sdk.project(args.id)
      );

      return this.createStructuredResponse(
        `Fetched project ${getString(project, 'name') ?? args.id}`,
        {
          project: await this.mapProjectDetail(project),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get project');
    }
  }

  async handleListProjects(args: ListProjectsInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const filter = this.buildProjectFilter(args);

      const connection = await client.executeSdk(
        'projects',
        () => client.sdk.projects({
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          first: args.first ?? 50,
          after: args.after,
        })
      );

      const mapped = await mapConnection(connection, project => this.mapProjectSummary(project));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} projects`,
        {
          projects: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list projects');
    }
  }

  async handleSearchProjects(args: SearchProjectsInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['query']);

      const payload = await client.executeSdk(
        'searchProjects',
        () => client.sdk.searchProjects(args.query, {
          first: args.first ?? 50,
          after: args.after,
        })
      );

      const payloadRecord = asRecord(payload);
      const nodes = Array.isArray(payloadRecord.nodes) ? payloadRecord.nodes as unknown[] : [];

      return this.createStructuredResponse(
        `Found ${nodes.length} project search results`,
        {
          projects: await Promise.all(nodes.map(project => this.mapProjectSummary(project))),
          pageInfo: toPageInfo(payloadRecord.pageInfo),
          totalCount: getNumber(payloadRecord, 'totalCount'),
        }
      );
    } catch (error) {
      return this.handleError(error, 'search projects');
    }
  }

  async handleCreateProjectUpdate(args: ProjectUpdateCreateInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['projectId']);

      const payload = await client.executeSdk(
        'createProjectUpdate',
        () => client.sdk.createProjectUpdate(args as never)
      );
      const projectUpdate = await resolveValue(asRecord(payload).projectUpdate as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        'Created project update',
        {
          success: getBoolean(payload, 'success') ?? true,
          projectUpdate: await this.mapProjectUpdate(projectUpdate),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create project update');
    }
  }

  async handleUpdateProjectUpdate(args: ProjectUpdateUpdateInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const { id, ...input } = args;
      const payload = await client.executeSdk(
        'updateProjectUpdate',
        () => client.sdk.updateProjectUpdate(id, input as never)
      );
      const projectUpdate = await resolveValue(asRecord(payload).projectUpdate as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Updated project update ${id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          projectUpdate: await this.mapProjectUpdate(projectUpdate),
        }
      );
    } catch (error) {
      return this.handleError(error, 'update project update');
    }
  }

  private buildProjectFilter(args: ListProjectsInput): Record<string, unknown> {
    const filter = {
      ...(args.filter ?? {}),
    };

    if (args.teamId) {
      filter.teams = { some: { id: { eq: args.teamId } } };
    }

    if (args.leadId) {
      filter.lead = { id: { eq: args.leadId } };
    }

    if (args.statusId) {
      filter.status = { id: { eq: args.statusId } };
    }

    return filter;
  }

  private async mapProjectDetail(project: unknown): Promise<Record<string, unknown>> {
    const projectRecord = asRecord(project);
    const labels = await callFetchMethod(projectRecord, 'labels', { first: 50 });
    const members = await callFetchMethod(projectRecord, 'members', { first: 50 });
    const teams = await callFetchMethod(projectRecord, 'teams', { first: 50 });
    const updates = await callFetchMethod(projectRecord, 'projectUpdates', { first: 10 });

    return compactObject({
      ...(await this.mapProjectSummary(project)),
      labels: labels
        ? (await mapConnection(labels, label => this.mapLabel(label))).nodes
        : undefined,
      members: members
        ? (await mapConnection(members, member => this.mapUserReference(member) ?? {})).nodes
        : undefined,
      teams: teams
        ? (await mapConnection(teams, team => this.mapTeamReference(team) ?? {})).nodes
        : undefined,
      updates: updates
        ? (await mapConnection(updates, update => this.mapProjectUpdate(update))).nodes
        : undefined,
    });
  }

  private async mapProjectSummary(project: unknown): Promise<Record<string, unknown>> {
    const projectRecord = asRecord(project);
    const lead = await resolveValue(projectRecord.lead as Promise<unknown> | unknown);
    const initiative = await resolveValue(projectRecord.initiative as Promise<unknown> | unknown);
    const status = await resolveValue(projectRecord.status as Promise<unknown> | unknown);

    return compactObject({
      id: getString(projectRecord, 'id'),
      name: getString(projectRecord, 'name'),
      description: getString(projectRecord, 'description'),
      content: getString(projectRecord, 'content'),
      actualDescription: getString(projectRecord, 'content') ?? getString(projectRecord, 'description'),
      url: getString(projectRecord, 'url'),
      color: getString(projectRecord, 'color'),
      icon: getString(projectRecord, 'icon'),
      priority: getNumber(projectRecord, 'priority'),
      startDate: getString(projectRecord, 'startDate'),
      targetDate: getString(projectRecord, 'targetDate'),
      createdAt: getDateString(projectRecord, 'createdAt'),
      updatedAt: getDateString(projectRecord, 'updatedAt'),
      initiative: this.mapInitiativeReference(initiative),
      lead: this.mapUserReference(lead),
      status: this.mapProjectStatus(status),
    });
  }

  private async mapProjectUpdate(projectUpdate: unknown): Promise<Record<string, unknown>> {
    const record = asRecord(projectUpdate);
    const project = await resolveValue(record.project as Promise<unknown> | unknown);

    return compactObject({
      id: getString(record, 'id'),
      body: getString(record, 'body'),
      health: getString(record, 'health'),
      isDiffHidden: getBoolean(record, 'isDiffHidden'),
      createdAt: getDateString(record, 'createdAt'),
      updatedAt: getDateString(record, 'updatedAt'),
      project: this.mapProjectReference(project),
    });
  }

  private mapProjectReference(project: unknown): Record<string, unknown> | undefined {
    const record = asRecord(project);
    if (Object.keys(record).length === 0) {
      return undefined;
    }

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      url: getString(record, 'url'),
    });
  }

  private mapInitiativeReference(initiative: unknown): Record<string, unknown> | undefined {
    const record = asRecord(initiative);
    if (Object.keys(record).length === 0) {
      return undefined;
    }

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      description: getString(record, 'description'),
      url: getString(record, 'url'),
      targetDate: getDateString(record, 'targetDate'),
    });
  }

  private mapProjectStatus(status: unknown): Record<string, unknown> | undefined {
    const record = asRecord(status);
    if (Object.keys(record).length === 0) {
      return undefined;
    }

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      type: getString(record, 'type'),
      color: getString(record, 'color'),
    });
  }

  private mapUserReference(user: unknown): Record<string, unknown> | undefined {
    const record = asRecord(user);
    if (Object.keys(record).length === 0) {
      return undefined;
    }

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      email: getString(record, 'email'),
      displayName: getString(record, 'displayName'),
    });
  }

  private mapTeamReference(team: unknown): Record<string, unknown> | undefined {
    const record = asRecord(team);
    if (Object.keys(record).length === 0) {
      return undefined;
    }

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      key: getString(record, 'key'),
    });
  }

  private mapLabel(label: unknown): Record<string, unknown> {
    const record = asRecord(label);
    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      color: getString(record, 'color'),
      description: getString(record, 'description'),
    });
  }

  private async mapIssueReference(issue: unknown): Promise<Record<string, unknown>> {
    const record = asRecord(issue);
    return compactObject({
      id: getString(record, 'id'),
      identifier: getString(record, 'identifier'),
      title: getString(record, 'title'),
      url: getString(record, 'url'),
    });
  }
}
