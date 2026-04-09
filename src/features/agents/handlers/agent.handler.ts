import { LinearAuth } from '../../../auth.js';
import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import {
  asRecord,
  compactObject,
  getBoolean,
  getDateString,
  getString,
  mapConnection,
  resolveValue,
} from '../../../types/sdk.utils.js';
import {
  CreateAgentActivityInput,
  CreateAgentSessionOnCommentInput,
  CreateAgentSessionOnIssueInput,
  GetAgentActivityInput,
  GetAgentSessionInput,
  ListAgentActivitiesInput,
  ListAgentSessionsInput,
  UpdateAgentSessionInput,
} from '../types/agent.types.js';

export class AgentHandler extends BaseHandler {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleGetAgentSession(args: GetAgentSessionInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const session = await client.executeSdk(
        'agentSession',
        () => client.sdk.agentSession(args.id)
      );

      return this.createStructuredResponse(
        `Fetched agent session ${getString(session, 'id') ?? args.id}`,
        {
          agentSession: await this.mapAgentSession(session),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get agent session');
    }
  }

  async handleListAgentSessions(args: ListAgentSessionsInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const connection = await client.executeSdk(
        'agentSessions',
        () => client.sdk.agentSessions({
          first: args.first ?? 50,
          after: args.after,
          ...(args.orderBy ? { orderBy: args.orderBy } : {}),
        })
      );

      const mapped = await mapConnection(connection, session => this.mapAgentSession(session));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} agent sessions`,
        {
          agentSessions: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list agent sessions');
    }
  }

  async handleCreateAgentSessionOnIssue(args: CreateAgentSessionOnIssueInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['issueId']);

      const payload = await client.executeSdk(
        'agentSessionCreateOnIssue',
        () => client.sdk.agentSessionCreateOnIssue(args)
      );
      const session = await resolveValue(asRecord(payload).agentSession as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Created agent session for issue ${args.issueId}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          agentSession: await this.mapAgentSession(session),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create agent session on issue');
    }
  }

  async handleCreateAgentSessionOnComment(args: CreateAgentSessionOnCommentInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['commentId']);

      const payload = await client.executeSdk(
        'agentSessionCreateOnComment',
        () => client.sdk.agentSessionCreateOnComment(args)
      );
      const session = await resolveValue(asRecord(payload).agentSession as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Created agent session for comment ${args.commentId}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          agentSession: await this.mapAgentSession(session),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create agent session on comment');
    }
  }

  async handleUpdateAgentSession(args: UpdateAgentSessionInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const { id, ...input } = args;
      const payload = await client.executeSdk(
        'updateAgentSession',
        () => client.sdk.updateAgentSession(id, input)
      );
      const session = await resolveValue(asRecord(payload).agentSession as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Updated agent session ${id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          agentSession: await this.mapAgentSession(session),
        }
      );
    } catch (error) {
      return this.handleError(error, 'update agent session');
    }
  }

  async handleGetAgentActivity(args: GetAgentActivityInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const activity = await client.executeSdk(
        'agentActivity',
        () => client.sdk.agentActivity(args.id)
      );

      return this.createStructuredResponse(
        `Fetched agent activity ${getString(activity, 'id') ?? args.id}`,
        {
          agentActivity: await this.mapAgentActivity(activity),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get agent activity');
    }
  }

  async handleListAgentActivities(args: ListAgentActivitiesInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const connection = await client.executeSdk(
        'agentActivities',
        () => client.sdk.agentActivities({
          filter: args.filter,
          first: args.first ?? 50,
          after: args.after,
          ...(args.orderBy ? { orderBy: args.orderBy } : {}),
        })
      );

      const mapped = await mapConnection(connection, activity => this.mapAgentActivity(activity));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} agent activities`,
        {
          agentActivities: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list agent activities');
    }
  }

  async handleCreateAgentActivity(args: CreateAgentActivityInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['agentSessionId', 'content']);

      const payload = await client.executeSdk(
        'createAgentActivity',
        () => client.sdk.createAgentActivity(args)
      );
      const activity = await resolveValue(asRecord(payload).agentActivity as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Created agent activity for session ${args.agentSessionId}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          agentActivity: await this.mapAgentActivity(activity),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create agent activity');
    }
  }

  private async mapAgentSession(session: unknown): Promise<Record<string, unknown>> {
    if (!session) {
      return {};
    }

    const record = asRecord(session);
    const issue = await resolveValue(record.issue as Promise<unknown> | unknown);
    const comment = await resolveValue(record.comment as Promise<unknown> | unknown);

    return compactObject({
      id: getString(record, 'id'),
      status: getString(record, 'status'),
      state: getString(record, 'state'),
      externalLink: getString(record, 'externalLink'),
      createdAt: getDateString(record, 'createdAt'),
      updatedAt: getDateString(record, 'updatedAt'),
      issue: issue ? compactObject({
        id: getString(issue, 'id'),
        identifier: getString(issue, 'identifier'),
        title: getString(issue, 'title'),
      }) : undefined,
      comment: comment ? compactObject({
        id: getString(comment, 'id'),
        body: getString(comment, 'body'),
      }) : undefined,
    });
  }

  private async mapAgentActivity(activity: unknown): Promise<Record<string, unknown>> {
    if (!activity) {
      return {};
    }

    const record = asRecord(activity);
    const agentSession = await resolveValue(record.agentSession as Promise<unknown> | unknown);

    return compactObject({
      id: getString(record, 'id'),
      signal: getString(record, 'signal'),
      ephemeral: getBoolean(record, 'ephemeral'),
      content: record.content as Record<string, unknown> | undefined,
      signalMetadata: record.signalMetadata as Record<string, unknown> | undefined,
      contextualMetadata: record.contextualMetadata as Record<string, unknown> | undefined,
      createdAt: getDateString(record, 'createdAt'),
      updatedAt: getDateString(record, 'updatedAt'),
      agentSession: agentSession ? compactObject({
        id: getString(agentSession, 'id'),
        status: getString(agentSession, 'status'),
        state: getString(agentSession, 'state'),
      }) : undefined,
    });
  }
}
