import { LinearAuth } from '../../../auth.js';
import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import {
  asRecord,
  compactObject,
  getArray,
  getBoolean,
  getDateString,
  getNumber,
  getString,
  mapConnection,
  resolveValue,
} from '../../../types/sdk.utils.js';
import {
  CreateCustomerInput,
  CreateInitiativeInput,
  GetCustomerInput,
  GetInitiativeInput,
  ListCustomersInput,
  ListInitiativesInput,
  UpdateCustomerInput,
  UpdateInitiativeInput,
} from '../types/portfolio.types.js';

export class PortfolioHandler extends BaseHandler {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleGetInitiative(args: GetInitiativeInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const initiative = await client.executeSdk(
        'initiative',
        () => client.sdk.initiative(args.id)
      );

      return this.createStructuredResponse(
        `Fetched initiative ${getString(initiative, 'name') ?? args.id}`,
        {
          initiative: await this.mapInitiative(initiative),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get initiative');
    }
  }

  async handleListInitiatives(args: ListInitiativesInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const connection = await client.executeSdk(
        'initiatives',
        () => client.sdk.initiatives({
          filter: args.filter,
          first: args.first ?? 50,
          after: args.after,
        })
      );

      const mapped = await mapConnection(connection, initiative => this.mapInitiative(initiative));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} initiatives`,
        {
          initiatives: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list initiatives');
    }
  }

  async handleCreateInitiative(args: CreateInitiativeInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['name']);

      const payload = await client.executeSdk(
        'createInitiative',
        () => client.sdk.createInitiative(args)
      );
      const initiative = await resolveValue(asRecord(payload).initiative as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Created initiative ${getString(initiative, 'name') ?? args.name}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          initiative: await this.mapInitiative(initiative),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create initiative');
    }
  }

  async handleUpdateInitiative(args: UpdateInitiativeInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const { id, ...input } = args;
      const payload = await client.executeSdk(
        'updateInitiative',
        () => client.sdk.updateInitiative(id, input)
      );
      const initiative = await resolveValue(asRecord(payload).initiative as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Updated initiative ${getString(initiative, 'name') ?? id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          initiative: await this.mapInitiative(initiative),
        }
      );
    } catch (error) {
      return this.handleError(error, 'update initiative');
    }
  }

  async handleGetCustomer(args: GetCustomerInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const customer = await client.executeSdk(
        'customer',
        () => client.sdk.customer(args.id)
      );

      return this.createStructuredResponse(
        `Fetched customer ${getString(customer, 'name') ?? args.id}`,
        {
          customer: await this.mapCustomer(customer),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get customer');
    }
  }

  async handleListCustomers(args: ListCustomersInput = {}): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const connection = await client.executeSdk(
        'customers',
        () => client.sdk.customers({
          filter: args.filter,
          first: args.first ?? 50,
          after: args.after,
        })
      );

      const mapped = await mapConnection(connection, customer => this.mapCustomer(customer));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} customers`,
        {
          customers: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list customers');
    }
  }

  async handleCreateCustomer(args: CreateCustomerInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['name']);

      const payload = await client.executeSdk(
        'createCustomer',
        () => client.sdk.createCustomer(args)
      );
      const customer = await resolveValue(asRecord(payload).customer as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Created customer ${getString(customer, 'name') ?? args.name}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          customer: await this.mapCustomer(customer),
        }
      );
    } catch (error) {
      return this.handleError(error, 'create customer');
    }
  }

  async handleUpdateCustomer(args: UpdateCustomerInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const { id, ...input } = args;
      const payload = await client.executeSdk(
        'updateCustomer',
        () => client.sdk.updateCustomer(id, input)
      );
      const customer = await resolveValue(asRecord(payload).customer as Promise<unknown> | unknown);

      return this.createStructuredResponse(
        `Updated customer ${getString(customer, 'name') ?? id}`,
        {
          success: getBoolean(payload, 'success') ?? true,
          customer: await this.mapCustomer(customer),
        }
      );
    } catch (error) {
      return this.handleError(error, 'update customer');
    }
  }

  private async mapInitiative(initiative: unknown): Promise<Record<string, unknown>> {
    if (!initiative) {
      return {};
    }

    const record = asRecord(initiative);
    const owner = await resolveValue(record.owner as Promise<unknown> | unknown);

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      description: getString(record, 'description'),
      content: getString(record, 'content'),
      color: getString(record, 'color'),
      icon: getString(record, 'icon'),
      status: getString(record, 'status'),
      sortOrder: getNumber(record, 'sortOrder'),
      targetDate: getDateString(record, 'targetDate'),
      targetDateResolution: getString(record, 'targetDateResolution'),
      url: getString(record, 'url'),
      createdAt: getDateString(record, 'createdAt'),
      updatedAt: getDateString(record, 'updatedAt'),
      owner: owner ? compactObject({
        id: getString(owner, 'id'),
        name: getString(owner, 'name'),
        displayName: getString(owner, 'displayName'),
      }) : undefined,
    });
  }

  private async mapCustomer(customer: unknown): Promise<Record<string, unknown>> {
    if (!customer) {
      return {};
    }

    const record = asRecord(customer);
    const owner = await resolveValue(record.owner as Promise<unknown> | unknown);
    const status = await resolveValue(record.status as Promise<unknown> | unknown);
    const tier = await resolveValue(record.tier as Promise<unknown> | unknown);

    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      logoUrl: getString(record, 'logoUrl'),
      domains: getArray(record, 'domains'),
      externalIds: getArray(record, 'externalIds'),
      mainSourceId: getString(record, 'mainSourceId'),
      revenue: getNumber(record, 'revenue'),
      size: getNumber(record, 'size'),
      slackChannelId: getString(record, 'slackChannelId'),
      createdAt: getDateString(record, 'createdAt'),
      updatedAt: getDateString(record, 'updatedAt'),
      owner: owner ? compactObject({
        id: getString(owner, 'id'),
        name: getString(owner, 'name'),
        displayName: getString(owner, 'displayName'),
      }) : undefined,
      status: status ? compactObject({
        id: getString(status, 'id'),
        name: getString(status, 'name'),
        color: getString(status, 'color'),
      }) : undefined,
      tier: tier ? compactObject({
        id: getString(tier, 'id'),
        name: getString(tier, 'name'),
        color: getString(tier, 'color'),
      }) : undefined,
    });
  }
}
