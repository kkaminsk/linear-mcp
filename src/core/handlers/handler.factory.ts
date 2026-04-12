import { LinearAuth } from '../../auth.js';
import { RuntimeCapabilities, getRuntimeCapabilities } from '../capabilities.js';
import { AuthHandler } from '../../features/auth/handlers/auth.handler.js';
import { IssueHandler } from '../../features/issues/handlers/issue.handler.js';
import { ProjectHandler } from '../../features/projects/handlers/project.handler.js';
import { TeamHandler } from '../../features/teams/handlers/team.handler.js';
import { UserHandler } from '../../features/users/handlers/user.handler.js';
import { CommentHandler } from '../../features/comments/handlers/comment.handler.js';
import { MilestoneHandler } from '../../features/milestones/handlers/milestone.handler.js';
import { CycleHandler } from '../../features/cycles/handlers/cycle.handler.js';
import { AttachmentHandler } from '../../features/attachments/handlers/attachment.handler.js';
import { WebhookHandler } from '../../features/webhooks/handlers/webhook.handler.js';
import { PortfolioHandler } from '../../features/portfolio/handlers/portfolio.handler.js';
import { AgentHandler } from '../../features/agents/handlers/agent.handler.js';
import { SubscriptionHandler } from '../../features/subscriptions/handlers/subscription.handler.js';

type HandlerInstance =
  | AuthHandler
  | IssueHandler
  | ProjectHandler
  | TeamHandler
  | UserHandler
  | CommentHandler
  | MilestoneHandler
  | CycleHandler
  | AttachmentHandler
  | WebhookHandler
  | PortfolioHandler
  | AgentHandler
  | SubscriptionHandler;

type HandlerKey =
  | 'auth'
  | 'issue'
  | 'project'
  | 'team'
  | 'user'
  | 'comment'
  | 'milestone'
  | 'cycle'
  | 'attachment'
  | 'webhook'
  | 'portfolio'
  | 'agent'
  | 'subscription';

type ToolRoute = {
  handlerKey: HandlerKey;
  method: string;
};

type HandlerBuilder = (
  auth: LinearAuth,
  runtimeCapabilities: RuntimeCapabilities
) => HandlerInstance;

const HANDLER_BUILDERS: Record<HandlerKey, HandlerBuilder> = {
  auth: auth => new AuthHandler(auth),
  issue: auth => new IssueHandler(auth),
  project: auth => new ProjectHandler(auth),
  team: auth => new TeamHandler(auth),
  user: auth => new UserHandler(auth),
  comment: auth => new CommentHandler(auth),
  milestone: auth => new MilestoneHandler(auth),
  cycle: auth => new CycleHandler(auth),
  attachment: auth => new AttachmentHandler(auth),
  webhook: auth => new WebhookHandler(auth),
  portfolio: auth => new PortfolioHandler(auth),
  agent: auth => new AgentHandler(auth),
  subscription: (auth, runtimeCapabilities) => new SubscriptionHandler(auth, runtimeCapabilities),
};

const TOOL_ROUTES: Record<string, ToolRoute> = {
  // Auth tools
  linear_auth: { handlerKey: 'auth', method: 'handleAuth' },
  linear_auth_callback: { handlerKey: 'auth', method: 'handleAuthCallback' },

  // Issue tools
  linear_get_issue: { handlerKey: 'issue', method: 'handleGetIssue' },
  linear_create_issue: { handlerKey: 'issue', method: 'handleCreateIssue' },
  linear_create_issues: { handlerKey: 'issue', method: 'handleCreateIssues' },
  linear_bulk_update_issues: { handlerKey: 'issue', method: 'handleBulkUpdateIssues' },
  linear_list_issues: { handlerKey: 'issue', method: 'handleListIssues' },
  linear_search_issues: { handlerKey: 'issue', method: 'handleSearchIssues' },
  linear_create_issue_relation: { handlerKey: 'issue', method: 'handleCreateIssueRelation' },
  linear_delete_issue_relation: { handlerKey: 'issue', method: 'handleDeleteIssueRelation' },
  linear_delete_issue: { handlerKey: 'issue', method: 'handleDeleteIssue' },
  linear_delete_issues: { handlerKey: 'issue', method: 'handleDeleteIssues' },

  // Project tools
  linear_create_project: { handlerKey: 'project', method: 'handleCreateProject' },
  linear_update_project: { handlerKey: 'project', method: 'handleUpdateProject' },
  linear_delete_project: { handlerKey: 'project', method: 'handleDeleteProject' },
  linear_create_project_with_issues: { handlerKey: 'project', method: 'handleCreateProjectWithIssues' },
  linear_get_project: { handlerKey: 'project', method: 'handleGetProject' },
  linear_list_projects: { handlerKey: 'project', method: 'handleListProjects' },
  linear_search_projects: { handlerKey: 'project', method: 'handleSearchProjects' },
  linear_create_project_update: { handlerKey: 'project', method: 'handleCreateProjectUpdate' },
  linear_update_project_update: { handlerKey: 'project', method: 'handleUpdateProjectUpdate' },

  // Team tools
  linear_get_team: { handlerKey: 'team', method: 'handleGetTeam' },
  linear_get_teams: { handlerKey: 'team', method: 'handleGetTeams' },
  linear_list_teams: { handlerKey: 'team', method: 'handleListTeams' },
  linear_list_workflow_states: { handlerKey: 'team', method: 'handleListWorkflowStates' },
  linear_list_labels: { handlerKey: 'team', method: 'handleListLabels' },
  linear_create_label: { handlerKey: 'team', method: 'handleCreateLabel' },
  linear_update_label: { handlerKey: 'team', method: 'handleUpdateLabel' },
  linear_delete_label: { handlerKey: 'team', method: 'handleDeleteLabel' },

  // User tools
  linear_get_user: { handlerKey: 'user', method: 'handleGetUser' },
  linear_list_users: { handlerKey: 'user', method: 'handleListUsers' },
  linear_search_users: { handlerKey: 'user', method: 'handleSearchUsers' },

  // Cycle tools
  linear_get_cycle: { handlerKey: 'cycle', method: 'handleGetCycle' },
  linear_list_cycles: { handlerKey: 'cycle', method: 'handleListCycles' },
  linear_get_current_cycle: { handlerKey: 'cycle', method: 'handleGetCurrentCycle' },

  // Attachment tools
  linear_get_attachment: { handlerKey: 'attachment', method: 'handleGetAttachment' },
  linear_list_attachments: { handlerKey: 'attachment', method: 'handleListAttachments' },
  linear_create_attachment: { handlerKey: 'attachment', method: 'handleCreateAttachment' },
  linear_update_attachment: { handlerKey: 'attachment', method: 'handleUpdateAttachment' },
  linear_delete_attachment: { handlerKey: 'attachment', method: 'handleDeleteAttachment' },

  // Webhook tools
  linear_get_webhook: { handlerKey: 'webhook', method: 'handleGetWebhook' },
  linear_list_webhooks: { handlerKey: 'webhook', method: 'handleListWebhooks' },
  linear_create_webhook: { handlerKey: 'webhook', method: 'handleCreateWebhook' },
  linear_delete_webhook: { handlerKey: 'webhook', method: 'handleDeleteWebhook' },

  // Portfolio tools
  linear_get_initiative: { handlerKey: 'portfolio', method: 'handleGetInitiative' },
  linear_list_initiatives: { handlerKey: 'portfolio', method: 'handleListInitiatives' },
  linear_create_initiative: { handlerKey: 'portfolio', method: 'handleCreateInitiative' },
  linear_update_initiative: { handlerKey: 'portfolio', method: 'handleUpdateInitiative' },
  linear_get_customer: { handlerKey: 'portfolio', method: 'handleGetCustomer' },
  linear_list_customers: { handlerKey: 'portfolio', method: 'handleListCustomers' },
  linear_create_customer: { handlerKey: 'portfolio', method: 'handleCreateCustomer' },
  linear_update_customer: { handlerKey: 'portfolio', method: 'handleUpdateCustomer' },

  // Agent tools
  linear_get_agent_session: { handlerKey: 'agent', method: 'handleGetAgentSession' },
  linear_list_agent_sessions: { handlerKey: 'agent', method: 'handleListAgentSessions' },
  linear_create_agent_session_on_issue: { handlerKey: 'agent', method: 'handleCreateAgentSessionOnIssue' },
  linear_create_agent_session_on_comment: { handlerKey: 'agent', method: 'handleCreateAgentSessionOnComment' },
  linear_update_agent_session: { handlerKey: 'agent', method: 'handleUpdateAgentSession' },
  linear_get_agent_activity: { handlerKey: 'agent', method: 'handleGetAgentActivity' },
  linear_list_agent_activities: { handlerKey: 'agent', method: 'handleListAgentActivities' },
  linear_create_agent_activity: { handlerKey: 'agent', method: 'handleCreateAgentActivity' },

  // Capability and subscription tools
  linear_get_capabilities: { handlerKey: 'subscription', method: 'handleGetCapabilities' },
  linear_start_subscription: { handlerKey: 'subscription', method: 'handleStartSubscription' },
  linear_stop_subscription: { handlerKey: 'subscription', method: 'handleStopSubscription' },

  // Comment tools
  linear_get_comment: { handlerKey: 'comment', method: 'handleGetComment' },
  linear_list_comments: { handlerKey: 'comment', method: 'handleListComments' },
  linear_get_issue_comments: { handlerKey: 'comment', method: 'handleGetIssueComments' },
  linear_create_comment: { handlerKey: 'comment', method: 'handleCreateComment' },
  linear_update_comment: { handlerKey: 'comment', method: 'handleUpdateComment' },
  linear_delete_comment: { handlerKey: 'comment', method: 'handleDeleteComment' },
  linear_resolve_comment: { handlerKey: 'comment', method: 'handleResolveComment' },
  linear_unresolve_comment: { handlerKey: 'comment', method: 'handleUnresolveComment' },

  // Milestone tools
  linear_create_project_milestone: { handlerKey: 'milestone', method: 'handleCreateProjectMilestone' },
  linear_update_project_milestone: { handlerKey: 'milestone', method: 'handleUpdateProjectMilestone' },
  linear_delete_project_milestone: { handlerKey: 'milestone', method: 'handleDeleteProjectMilestone' },
  linear_get_project_milestone: { handlerKey: 'milestone', method: 'handleGetProjectMilestone' },
  linear_search_project_milestones: { handlerKey: 'milestone', method: 'handleSearchProjectMilestones' },
  linear_get_project_milestones: { handlerKey: 'milestone', method: 'handleGetProjectMilestones' },
  linear_create_project_milestones: { handlerKey: 'milestone', method: 'handleCreateProjectMilestones' },
};

/**
 * Factory for creating and managing feature-specific handlers.
 * Ensures consistent initialization and dependency injection across handlers.
 */
export class HandlerFactory {
  private readonly handlerCache = new WeakMap<LinearAuth, Map<HandlerKey, HandlerInstance>>();

  constructor(
    private readonly runtimeCapabilities: RuntimeCapabilities = getRuntimeCapabilities()
  ) {}

  /**
   * Gets the appropriate handler for a given tool name.
   */
  getHandlerForTool(toolName: string, auth: LinearAuth): {
    handler: HandlerInstance;
    method: string;
  } {
    const route = TOOL_ROUTES[toolName];
    if (!route) {
      throw new Error(`No handler found for tool: ${toolName}`);
    }

    return {
      handler: this.getOrCreateHandler(auth, route.handlerKey),
      method: route.method,
    };
  }

  private getOrCreateHandler(
    auth: LinearAuth,
    handlerKey: HandlerKey
  ): HandlerInstance {
    let handlersForAuth = this.handlerCache.get(auth);
    if (!handlersForAuth) {
      handlersForAuth = new Map<HandlerKey, HandlerInstance>();
      this.handlerCache.set(auth, handlersForAuth);
    }

    const cachedHandler = handlersForAuth.get(handlerKey);
    if (cachedHandler) {
      return cachedHandler;
    }

    const handler = HANDLER_BUILDERS[handlerKey](auth, this.runtimeCapabilities);
    handlersForAuth.set(handlerKey, handler);
    return handler;
  }
}
