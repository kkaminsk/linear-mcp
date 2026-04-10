import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
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
  BulkUpdateIssuesInput,
  CreateIssueInput,
  CreateIssueRelationInput,
  CreateIssuesInput,
  DeleteIssueInput,
  DeleteIssueRelationInput,
  DeleteIssuesInput,
  GetIssueInput,
  IssueHandlerMethods,
  ListIssuesInput,
  SearchIssuesInput,
} from '../types/issue.types.js';

export class IssueHandler extends BaseHandler implements IssueHandlerMethods {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleGetIssue(args: GetIssueInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const issue = await client.executeSdk('issue', () => client.sdk.issue(args.id));
      const issueData = await this.mapIssueDetail(issue);

      return this.createStructuredResponse(
        `Fetched issue ${getString(issueData, 'identifier') ?? args.id}`,
        {
          issue: issueData,
        }
      );
    } catch (error) {
      return this.handleError(error, 'get issue');
    }
  }

  async handleCreateIssue(args: CreateIssueInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['title', 'teamId']);

      const payload = await client.executeSdk(
        'createIssue',
        () => client.sdk.createIssue(args)
      );

      const issue = await resolveValue(asRecord(payload).issue as Promise<unknown> | unknown);
      const issueData = await this.mapIssueSummary(issue);

      return this.createStructuredResponse(
        `Created issue ${getString(issueData, 'identifier') ?? getString(issueData, 'id') ?? 'unknown'}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          issue: issueData,
        }
      );
    } catch (error) {
      return this.handleError(error, 'create issue');
    }
  }

  async handleCreateIssues(args: CreateIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['issues']);

      if (!Array.isArray(args.issues) || args.issues.length === 0) {
        throw new Error('issues must be a non-empty array');
      }

      const payload = await client.executeSdk(
        'createIssueBatch',
        () => client.sdk.createIssueBatch({ issues: args.issues })
      );

      const issues = Array.isArray(asRecord(payload).issues)
        ? asRecord(payload).issues as unknown[]
        : [];

      return this.createStructuredResponse(
        `Created ${issues.length} issues`,
        {
          success: getBoolean(payload, 'success') ?? true,
          issues: await Promise.all(issues.map(issue => this.mapIssueSummary(issue))),
          lastSyncId: getNumber(payload, 'lastSyncId'),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create issues');
    }
  }

  async handleBulkUpdateIssues(args: BulkUpdateIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['issueIds', 'update']);

      if (!Array.isArray(args.issueIds) || args.issueIds.length === 0) {
        throw new Error('issueIds must be a non-empty array');
      }

      const results = await Promise.all(
        args.issueIds.map(async (issueId) => {
          const payload = await client.executeSdk(
            'updateIssue',
            () => client.sdk.updateIssue(issueId, args.update)
          );
          const issue = await resolveValue(asRecord(payload).issue as Promise<unknown> | unknown);
          return {
            success: getBoolean(payload, 'success') ?? true,
            issue: await this.mapIssueSummary(issue),
          };
        })
      );

      const allSuccess = results.every(r => r.success);
      const issueData = results.map(r => r.issue);

      return this.createStructuredResponse(
        `Updated ${issueData.length} issue${issueData.length === 1 ? '' : 's'}`,
        {
          success: allSuccess,
          issues: issueData,
        }
      );
    } catch (error) {
      return this.handleError(error, 'update issues');
    }
  }

  async handleListIssues(args: ListIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateStateFilterConflict(args);
      const filter = this.buildIssueFilter(args);

      const connection = await client.executeSdk(
        'issues',
        () => client.sdk.issues({
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          first: args.first ?? 50,
          after: args.after,
        })
      );

      const mapped = await mapConnection(connection, issue => this.mapIssueSummary(issue));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} issues`,
        {
          issues: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list issues');
    }
  }

  async handleSearchIssues(args: SearchIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['query']);
      this.validateStateFilterConflict(args);
      const filter = this.buildIssueFilter(args);
      const searchOptions: Omit<SearchIssuesInput, 'query'> = {
        first: args.first ?? 50,
      };

      if (Object.keys(filter).length > 0) {
        searchOptions.filter = filter;
      }

      if (args.after !== undefined) {
        searchOptions.after = args.after;
      }

      const payload = await client.searchIssues(args.query, searchOptions);
      const nodes = payload.issues.nodes ?? [];

      return this.createStructuredResponse(
        `Found ${nodes.length} issue search results`,
        {
          issues: await Promise.all(nodes.map(issue => this.mapIssueSummary(issue))),
          pageInfo: payload.issues.pageInfo,
          totalCount: payload.totalCount,
        }
      );
    } catch (error) {
      return this.handleError(error, 'search issues');
    }
  }

  async handleDeleteIssue(args: DeleteIssueInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const payload = await client.executeSdk(
        'deleteIssue',
        () => client.sdk.deleteIssue(args.id)
      );

      return this.createStructuredResponse(
        `Deleted issue ${args.id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          id: args.id,
        }
      );
    } catch (error) {
      return this.handleError(error, 'delete issue');
    }
  }

  async handleDeleteIssues(args: DeleteIssuesInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['ids']);

      if (!Array.isArray(args.ids) || args.ids.length === 0) {
        throw new Error('ids must be a non-empty array');
      }

      const results = await Promise.all(
        args.ids.map(async id => {
          try {
            const payload = await client.executeSdk('deleteIssue', () => client.sdk.deleteIssue(id));

            if (!(getBoolean(payload, 'success') ?? true)) {
              return {
                id,
                success: false,
                message: 'Issue deletion returned success false.',
              };
            }

            return {
              id,
              success: true,
            };
          } catch (error) {
            return {
              id,
              success: false,
              message: this.getDeleteFailureMessage(error),
            };
          }
        })
      );

      const deletedIds = results.filter(result => result.success).map(result => result.id);
      const failed = results
        .filter((result): result is { id: string; success: false; message: string } => !result.success)
        .map(result => ({
          id: result.id,
          message: result.message,
        }));

      if (failed.length > 0) {
        return this.createErrorResponse(
          `Deleted ${deletedIds.length} of ${args.ids.length} issues`,
          {
            success: false,
            requestedIds: args.ids,
            deletedIds,
            failedIds: failed.map(result => result.id),
            failed,
            error: {
              type: 'partial',
              message: 'One or more requested issues could not be deleted.',
            },
          }
        );
      }

      return this.createStructuredResponse(
        `Deleted ${args.ids.length} issues`,
        {
          success: true,
          ids: args.ids,
          deletedIds,
        }
      );
    } catch (error) {
      return this.handleError(error, 'delete issues');
    }
  }

  async handleCreateIssueRelation(args: CreateIssueRelationInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['issueId', 'relatedIssueId', 'type']);

      const payload = await client.executeSdk(
        'createIssueRelation',
        () => client.sdk.createIssueRelation(args as never)
      );

      const relation = await resolveValue(asRecord(payload).issueRelation as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        'Created issue relation',
        {
          success: getBoolean(payload, 'success') ?? true,
          relation: await this.mapIssueRelation(relation),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create issue relation');
    }
  }

  async handleDeleteIssueRelation(args: DeleteIssueRelationInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const payload = await client.executeSdk(
        'deleteIssueRelation',
        () => client.sdk.deleteIssueRelation(args.id)
      );

      return this.createStructuredResponse(
        `Deleted issue relation ${args.id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          id: args.id,
        }
      );
    } catch (error) {
      return this.handleError(error, 'delete issue relation');
    }
  }

  private buildIssueFilter(args: ListIssuesInput): Record<string, unknown> {
    const filter = {
      ...(args.filter ?? {}),
    };

    if (args.teamId) {
      filter.team = { id: { eq: args.teamId } };
    }

    if (args.projectId) {
      filter.project = { id: { eq: args.projectId } };
    }

    if (args.assigneeId) {
      filter.assignee = { id: { eq: args.assigneeId } };
    }

    if (args.stateId) {
      filter.state = { id: { eq: args.stateId } };
    }

    if (args.states?.length) {
      filter.state = { name: { in: args.states } };
    }

    if (typeof args.priority === 'number') {
      filter.priority = { eq: args.priority };
    }

    if (args.cycleId) {
      filter.cycle = { id: { eq: args.cycleId } };
    }

    return filter;
  }

  private validateStateFilterConflict(
    args: Pick<ListIssuesInput, 'stateId' | 'states'>
  ): void {
    if (args.stateId && args.states?.length) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'stateId and states cannot both be provided in the same issue query.'
      );
    }
  }

  private getDeleteFailureMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown delete failure';
  }

  private async mapIssueDetail(issue: unknown): Promise<Record<string, unknown>> {
    const issueRecord = asRecord(issue);
    const currentIssueId = getString(issueRecord, 'id');
    const assignee = await resolveValue(issueRecord.assignee as Promise<unknown> | unknown);
    const parent = await resolveValue(issueRecord.parent as Promise<unknown> | unknown);
    const labels = await callFetchMethod(issueRecord, 'labels', { first: 50 });
    const children = await callFetchMethod(issueRecord, 'children', { first: 50 });
    const relations = await callFetchMethod(issueRecord, 'relations', { first: 50 });
    const inverseRelations = await callFetchMethod(issueRecord, 'inverseRelations', { first: 50 });
    const subscribers = await callFetchMethod(issueRecord, 'subscribers', { first: 50 });

    return compactObject({
      ...(await this.mapIssueSummary(issue)),
      description: getString(issueRecord, 'description'),
      assignee: this.mapUserReference(assignee),
      parent: parent ? await this.mapIssueReference(parent) : undefined,
      children: children
        ? (await mapConnection(children, child => this.mapIssueReference(child))).nodes
        : undefined,
      labels: labels
        ? (await mapConnection(labels, label => this.mapLabel(label))).nodes
        : undefined,
      relations: [
        ...(relations
          ? (await mapConnection(relations, relation => this.mapIssueRelation(relation, currentIssueId))).nodes
          : []),
        ...(inverseRelations
          ? (await mapConnection(inverseRelations, relation => this.mapIssueRelation(relation, currentIssueId))).nodes
          : []),
      ],
      subscribers: subscribers
        ? (await mapConnection(subscribers, subscriber => this.mapUserReference(subscriber) ?? {})).nodes
        : undefined,
    });
  }

  private async mapIssueSummary(issue: unknown): Promise<Record<string, unknown>> {
    const issueRecord = asRecord(issue);
    const state = await resolveValue(issueRecord.state as Promise<unknown> | unknown);
    const team = await resolveValue(issueRecord.team as Promise<unknown> | unknown);
    const project = await resolveValue(issueRecord.project as Promise<unknown> | unknown);
    const cycle = await resolveValue(issueRecord.cycle as Promise<unknown> | unknown);
    const milestone = await resolveValue(issueRecord.projectMilestone as Promise<unknown> | unknown);
    const parent = await resolveValue(issueRecord.parent as Promise<unknown> | unknown);

    return compactObject({
      id: getString(issueRecord, 'id'),
      identifier: getString(issueRecord, 'identifier'),
      title: getString(issueRecord, 'title'),
      url: getString(issueRecord, 'url'),
      priority: getNumber(issueRecord, 'priority'),
      estimate: getNumber(issueRecord, 'estimate'),
      dueDate: getString(issueRecord, 'dueDate'),
      createdAt: getDateString(issueRecord, 'createdAt'),
      updatedAt: getDateString(issueRecord, 'updatedAt'),
      state: this.mapWorkflowState(state),
      team: this.mapTeamReference(team),
      parent: parent ? await this.mapIssueReference(parent) : undefined,
      project: this.mapProjectReference(project),
      cycle: this.mapCycleReference(cycle),
      milestone: this.mapMilestoneReference(milestone),
    });
  }

  private async mapIssueReference(issue: unknown): Promise<Record<string, unknown>> {
    const issueRecord = asRecord(issue);
    return compactObject({
      id: getString(issueRecord, 'id'),
      identifier: getString(issueRecord, 'identifier'),
      title: getString(issueRecord, 'title'),
      url: getString(issueRecord, 'url'),
    });
  }

  private async mapIssueRelation(
    relation: unknown,
    currentIssueId?: string
  ): Promise<Record<string, unknown>> {
    const relationRecord = asRecord(relation);
    const issue = await resolveValue(relationRecord.issue as Promise<unknown> | unknown);
    const relatedIssue = await resolveValue(relationRecord.relatedIssue as Promise<unknown> | unknown);
    const issueReference = issue ? await this.mapIssueReference(issue) : undefined;
    const relatedIssueReference = relatedIssue ? await this.mapIssueReference(relatedIssue) : undefined;

    const linkedIssue = issueReference && getString(issueReference, 'id') === currentIssueId
      ? relatedIssueReference
      : relatedIssueReference && getString(relatedIssueReference, 'id') === currentIssueId
        ? issueReference
        : relatedIssueReference ?? issueReference;

    return compactObject({
      id: getString(relationRecord, 'id'),
      type: getString(relationRecord, 'type'),
      linkedIssue,
      issue: issueReference,
      relatedIssue: relatedIssueReference,
    });
  }

  private mapWorkflowState(state: unknown): Record<string, unknown> | undefined {
    const record = asRecord(state);
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

  private mapLabel(label: unknown): Record<string, unknown> {
    const record = asRecord(label);
    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      color: getString(record, 'color'),
      description: getString(record, 'description'),
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

  private mapCycleReference(cycle: unknown): Record<string, unknown> | undefined {
    const record = asRecord(cycle);
    if (Object.keys(record).length === 0) {
      return undefined;
    }

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      number: getNumber(record, 'number'),
      startsAt: getDateString(record, 'startsAt'),
      endsAt: getDateString(record, 'endsAt'),
      completedAt: getDateString(record, 'completedAt'),
    });
  }

  private mapMilestoneReference(milestone: unknown): Record<string, unknown> | undefined {
    const record = asRecord(milestone);
    if (Object.keys(record).length === 0) {
      return undefined;
    }

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      targetDate: getString(record, 'targetDate'),
    });
  }
}
