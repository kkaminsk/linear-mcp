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
} from '../../../types/sdk.utils.js';
import {
  DeleteLabelInput,
  GetTeamInput,
  LabelInput,
  ListLabelsInput,
  ListTeamsInput,
  ListWorkflowStatesInput,
  UpdateLabelInput,
} from '../types/team.types.js';

export class TeamHandler extends BaseHandler {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleGetTeam(args: GetTeamInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const team = await client.executeSdk(
        'team',
        () => client.sdk.team(args.id)
      );

      return this.createStructuredResponse(
        `Fetched team ${getString(team, 'name') ?? args.id}`,
        {
          team: await this.mapTeamDetail(team),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get team');
    }
  }

  async handleListTeams(args: ListTeamsInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const filter = {
        ...(args.filter ?? {}),
        ...(args.key ? { key: { eq: args.key } } : {}),
        ...(args.name ? { name: { containsIgnoreCase: args.name } } : {}),
      };

      const connection = await client.executeSdk(
        'teams',
        () => client.sdk.teams({
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          first: args.first ?? 50,
          after: args.after,
        })
      );

      const mapped = await mapConnection(connection, team => this.mapTeamSummary(team));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} teams`,
        {
          teams: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list teams');
    }
  }

  async handleGetTeams(args: ListTeamsInput = {}): Promise<BaseToolResponse> {
    return this.handleListTeams(args);
  }

  async handleListWorkflowStates(args: ListWorkflowStatesInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();

      const connection = args.teamId
        ? await client.executeSdk('team.states', async () => {
            const team = await client.sdk.team(args.teamId!);
            return team.states({
              first: args.first ?? 50,
              after: args.after,
            });
          })
        : await client.executeSdk(
            'workflowStates',
            () => client.sdk.workflowStates({
              first: args.first ?? 50,
              after: args.after,
            })
          );

      const mapped = await mapConnection(connection, state => this.mapWorkflowState(state));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} workflow states`,
        {
          states: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list workflow states');
    }
  }

  async handleListLabels(args: ListLabelsInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();

      const connection = args.teamId
        ? await client.executeSdk('team.labels', async () => {
            const team = await client.sdk.team(args.teamId!);
            return team.labels({
              first: args.first ?? 50,
              after: args.after,
            });
          })
        : await client.executeSdk(
            'issueLabels',
            () => client.sdk.issueLabels({
              first: args.first ?? 50,
              after: args.after,
            })
          );

      const mapped = await mapConnection(connection, label => this.mapLabel(label));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} labels`,
        {
          labels: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list labels');
    }
  }

  async handleCreateLabel(args: LabelInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['name', 'teamId']);

      const payload = await client.executeSdk(
        'createIssueLabel',
        () => client.sdk.createIssueLabel(args as never)
      );
      const label = await resolveValue(asRecord(payload).issueLabel as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Created label ${getString(label, 'name') ?? args.name}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          label: this.mapLabel(label),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create label');
    }
  }

  async handleUpdateLabel(args: UpdateLabelInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const { id, ...input } = args;
      const payload = await client.executeSdk(
        'updateIssueLabel',
        () => client.sdk.updateIssueLabel(id, input as never)
      );
      const label = await resolveValue(asRecord(payload).issueLabel as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Updated label ${getString(label, 'name') ?? id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          label: this.mapLabel(label),
        }
      );
    } catch (error) {
      return this.handleError(error, 'update label');
    }
  }

  async handleDeleteLabel(args: DeleteLabelInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const payload = await client.executeSdk(
        'deleteIssueLabel',
        () => client.sdk.deleteIssueLabel(args.id)
      );

      return this.createStructuredResponse(
        `Deleted label ${args.id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          id: args.id,
        }
      );
    } catch (error) {
      return this.handleError(error, 'delete label');
    }
  }

  private async mapTeamDetail(team: unknown): Promise<Record<string, unknown>> {
    const teamRecord = asRecord(team);
    const states = await callFetchMethod(teamRecord, 'states', { first: 50 });
    const labels = await callFetchMethod(teamRecord, 'labels', { first: 50 });
    const cycles = await callFetchMethod(teamRecord, 'cycles', { first: 10 });

    return compactObject({
      ...(this.mapTeamSummary(team)),
      states: states ? (await mapConnection(states, state => this.mapWorkflowState(state))).nodes : undefined,
      labels: labels ? (await mapConnection(labels, label => this.mapLabel(label))).nodes : undefined,
      cycles: cycles ? (await mapConnection(cycles, cycle => this.mapCycle(cycle))).nodes : undefined,
    });
  }

  private mapTeamSummary(team: unknown): Record<string, unknown> {
    const record = asRecord(team);
    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      key: getString(record, 'key'),
      description: getString(record, 'description'),
      icon: getString(record, 'icon'),
      createdAt: getDateString(record, 'createdAt'),
      updatedAt: getDateString(record, 'updatedAt'),
    });
  }

  private mapWorkflowState(state: unknown): Record<string, unknown> {
    const record = asRecord(state);
    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      type: getString(record, 'type'),
      color: getString(record, 'color'),
      description: getString(record, 'description'),
    });
  }

  private mapLabel(label: unknown): Record<string, unknown> {
    const record = asRecord(label);
    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      color: getString(record, 'color'),
      description: getString(record, 'description'),
      parentId: getString(record, 'parentId'),
    });
  }

  private mapCycle(cycle: unknown): Record<string, unknown> {
    const record = asRecord(cycle);
    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      number: getNumber(record, 'number'),
      startsAt: getDateString(record, 'startsAt'),
      endsAt: getDateString(record, 'endsAt'),
      completedAt: getDateString(record, 'completedAt'),
    });
  }
}
