import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import {
  asRecord,
  compactObject,
  getBoolean,
  getString,
  mapConnection,
  toPageInfo,
} from '../../../types/sdk.utils.js';
import { GetUserInput, ListUsersInput, SearchUsersInput } from '../types/user.types.js';

export class UserHandler extends BaseHandler {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  async handleGetUser(args: GetUserInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();

      if (args?.id) {
        const user = await client.executeSdk(
          'user',
          () => client.sdk.user(args.id!)
        );

        return this.createStructuredResponse(
          `Fetched user ${getString(user, 'name') ?? args.id}`,
          {
            user: this.mapUser(user),
          }
        );
      }

      const viewer = await client.executeSdk(
        'viewer',
        () => client.sdk.viewer
      );

      return this.createStructuredResponse(
        `Fetched current user ${getString(viewer, 'name') ?? 'viewer'}`,
        {
          viewer: this.mapUser(viewer),
        }
      );
    } catch (error) {
      return this.handleError(error, 'get user info');
    }
  }

  async handleListUsers(args: ListUsersInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      const connection = await client.executeSdk(
        'users',
        () => client.sdk.users({
          ...(args.filter ? { filter: args.filter } : {}),
          first: args.first ?? 50,
          after: args.after,
        })
      );

      const mapped = await mapConnection(connection, user => this.mapUser(user));

      return this.createStructuredResponse(
        `Listed ${mapped.nodes.length} users`,
        {
          users: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'list users');
    }
  }

  async handleSearchUsers(args: SearchUsersInput): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['query']);

      const filter = {
        ...(args.filter ?? {}),
        or: [
          { name: { containsIgnoreCase: args.query } },
          { displayName: { containsIgnoreCase: args.query } },
          { email: { containsIgnoreCase: args.query } },
        ],
      };

      const connection = await client.executeSdk(
        'users',
        () => client.sdk.users({
          filter,
          first: args.first ?? 50,
          after: args.after,
        })
      );

      const mapped = await mapConnection(connection, user => this.mapUser(user));

      return this.createStructuredResponse(
        `Found ${mapped.nodes.length} users`,
        {
          users: mapped.nodes,
          pageInfo: mapped.pageInfo,
        }
      );
    } catch (error) {
      return this.handleError(error, 'search users');
    }
  }

  private mapUser(user: unknown): Record<string, unknown> {
    const record = asRecord(user);
    return compactObject({
      id: getString(record, 'id'),
      name: getString(record, 'name'),
      displayName: getString(record, 'displayName'),
      email: getString(record, 'email'),
      avatarUrl: getString(record, 'avatarUrl'),
      active: getBoolean(record, 'active'),
      url: getString(record, 'url'),
    });
  }
}
