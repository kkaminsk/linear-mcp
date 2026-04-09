import { LinearAuth } from '../../../auth.js';
import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import {
  asRecord,
  compactObject,
  getBoolean,
  getDateString,
  getNumber,
  getString,
  mapConnection,
  resolveValue,
} from '../../../types/sdk.utils.js';
import { GetCurrentCycleInput, GetCycleInput, ListCyclesInput } from '../types/cycle.types.js';

export class CycleHandler extends BaseHandler {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleGetCycle(args: GetCycleInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const cycle = await client.executeSdk(
        'cycle',
        () => client.sdk.cycle(args.id)
      );

      return this.createStructuredResponse(
        `Fetched cycle ${getString(cycle, 'name') ?? args.id}`,
        {
          cycle: await this.mapCycle(cycle),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get cycle');
    }
  }

  async handleListCycles(args: ListCyclesInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const filter = {
        ...(args.filter ?? {}),
        ...(args.teamId ? { team: { id: { eq: args.teamId } } } : {}),
      };

      const connection = await client.executeSdk(
        'cycles',
        () => client.sdk.cycles({
          filter: Object.keys(filter).length > 0 ? filter : undefined,
          first: args.first ?? 50,
          after: args.after,
        })
      );

      const mapped = await mapConnection(connection, cycle => this.mapCycle(cycle));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} cycles`,
        {
          cycles: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list cycles');
    }
  }

  async handleGetCurrentCycle(args: GetCurrentCycleInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const filter = {
        ...(args.filter ?? {}),
        isActive: { eq: true },
        ...(args.teamId ? { team: { id: { eq: args.teamId } } } : {}),
      };

      const connection = await client.executeSdk(
        'cycles',
        () => client.sdk.cycles({
          filter,
          first: 1,
        })
      );

      const mapped = await mapConnection(connection, cycle => this.mapCycle(cycle));
      const cycle = mapped.nodes[0] ?? null;

      return this.createStructuredResponse(
        cycle
          ? `Fetched current cycle ${String(cycle.name ?? cycle.id ?? 'cycle')}`
          : 'No active cycle found',
        {
          cycle,
        }
      );
    } catch (error) {
      return this.handleError(error, 'get current cycle');
    }
  }

  private async mapCycle(cycle: unknown): Promise<Record<string, unknown>> {
    const record = asRecord(cycle);
    const team = await resolveValue(record.team as Promise<unknown> | unknown);

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      number: getNumber(record, 'number'),
      startsAt: getDateString(record, 'startsAt'),
      endsAt: getDateString(record, 'endsAt'),
      completedAt: getDateString(record, 'completedAt'),
      createdAt: getDateString(record, 'createdAt'),
      updatedAt: getDateString(record, 'updatedAt'),
      isActive: getBoolean(record, 'isActive'),
      progress: getNumber(record, 'progress'),
      team: this.mapTeam(team),
    });
  }

  private mapTeam(team: unknown): Record<string, unknown> | undefined {
    if (!team) {
      return undefined;
    }

    const record = asRecord(team);
    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      key: getString(record, 'key'),
    });
  }
}
