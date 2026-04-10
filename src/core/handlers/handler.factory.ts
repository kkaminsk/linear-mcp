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

/**
 * Factory for creating and managing feature-specific handlers.
 * Ensures consistent initialization and dependency injection across handlers.
 */
export class HandlerFactory {
  constructor(
    private readonly runtimeCapabilities: RuntimeCapabilities = getRuntimeCapabilities()
  ) {}

  /**
   * Gets the appropriate handler for a given tool name.
   */
  getHandlerForTool(toolName: string, auth: LinearAuth): {
    handler:
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
    method: string;
  } {
    // Map tool names to their handlers and methods
    const handlerMap: Record<string, {
      handler:
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
      method: string;
    }> = {
      // Auth tools
      linear_auth: { handler: new AuthHandler(auth), method: 'handleAuth' },
      linear_auth_callback: { handler: new AuthHandler(auth), method: 'handleAuthCallback' },

      // Issue tools
      linear_get_issue: { handler: new IssueHandler(auth), method: 'handleGetIssue' },
      linear_create_issue: { handler: new IssueHandler(auth), method: 'handleCreateIssue' },
      linear_create_issues: { handler: new IssueHandler(auth), method: 'handleCreateIssues' },
      linear_bulk_update_issues: { handler: new IssueHandler(auth), method: 'handleBulkUpdateIssues' },
      linear_list_issues: { handler: new IssueHandler(auth), method: 'handleListIssues' },
      linear_search_issues: { handler: new IssueHandler(auth), method: 'handleSearchIssues' },
      linear_create_issue_relation: { handler: new IssueHandler(auth), method: 'handleCreateIssueRelation' },
      linear_delete_issue_relation: { handler: new IssueHandler(auth), method: 'handleDeleteIssueRelation' },
      linear_delete_issue: { handler: new IssueHandler(auth), method: 'handleDeleteIssue' },
      linear_delete_issues: { handler: new IssueHandler(auth), method: 'handleDeleteIssues' },

      // Project tools
      linear_create_project: { handler: new ProjectHandler(auth), method: 'handleCreateProject' },
      linear_update_project: { handler: new ProjectHandler(auth), method: 'handleUpdateProject' },
      linear_delete_project: { handler: new ProjectHandler(auth), method: 'handleDeleteProject' },
      linear_create_project_with_issues: { handler: new ProjectHandler(auth), method: 'handleCreateProjectWithIssues' },
      linear_get_project: { handler: new ProjectHandler(auth), method: 'handleGetProject' },
      linear_list_projects: { handler: new ProjectHandler(auth), method: 'handleListProjects' },
      linear_search_projects: { handler: new ProjectHandler(auth), method: 'handleSearchProjects' },
      linear_create_project_update: { handler: new ProjectHandler(auth), method: 'handleCreateProjectUpdate' },
      linear_update_project_update: { handler: new ProjectHandler(auth), method: 'handleUpdateProjectUpdate' },

      // Team tools
      linear_get_team: { handler: new TeamHandler(auth), method: 'handleGetTeam' },
      linear_get_teams: { handler: new TeamHandler(auth), method: 'handleGetTeams' },
      linear_list_teams: { handler: new TeamHandler(auth), method: 'handleListTeams' },
      linear_list_workflow_states: { handler: new TeamHandler(auth), method: 'handleListWorkflowStates' },
      linear_list_labels: { handler: new TeamHandler(auth), method: 'handleListLabels' },
      linear_create_label: { handler: new TeamHandler(auth), method: 'handleCreateLabel' },
      linear_update_label: { handler: new TeamHandler(auth), method: 'handleUpdateLabel' },
      linear_delete_label: { handler: new TeamHandler(auth), method: 'handleDeleteLabel' },

      // User tools
      linear_get_user: { handler: new UserHandler(auth), method: 'handleGetUser' },
      linear_list_users: { handler: new UserHandler(auth), method: 'handleListUsers' },
      linear_search_users: { handler: new UserHandler(auth), method: 'handleSearchUsers' },

      // Cycle tools
      linear_get_cycle: { handler: new CycleHandler(auth), method: 'handleGetCycle' },
      linear_list_cycles: { handler: new CycleHandler(auth), method: 'handleListCycles' },
      linear_get_current_cycle: { handler: new CycleHandler(auth), method: 'handleGetCurrentCycle' },

      // Attachment tools
      linear_get_attachment: { handler: new AttachmentHandler(auth), method: 'handleGetAttachment' },
      linear_list_attachments: { handler: new AttachmentHandler(auth), method: 'handleListAttachments' },
      linear_create_attachment: { handler: new AttachmentHandler(auth), method: 'handleCreateAttachment' },
      linear_update_attachment: { handler: new AttachmentHandler(auth), method: 'handleUpdateAttachment' },
      linear_delete_attachment: { handler: new AttachmentHandler(auth), method: 'handleDeleteAttachment' },

      // Webhook tools
      linear_get_webhook: { handler: new WebhookHandler(auth), method: 'handleGetWebhook' },
      linear_list_webhooks: { handler: new WebhookHandler(auth), method: 'handleListWebhooks' },
      linear_create_webhook: { handler: new WebhookHandler(auth), method: 'handleCreateWebhook' },
      linear_delete_webhook: { handler: new WebhookHandler(auth), method: 'handleDeleteWebhook' },

      // Portfolio tools
      linear_get_initiative: { handler: new PortfolioHandler(auth), method: 'handleGetInitiative' },
      linear_list_initiatives: { handler: new PortfolioHandler(auth), method: 'handleListInitiatives' },
      linear_create_initiative: { handler: new PortfolioHandler(auth), method: 'handleCreateInitiative' },
      linear_update_initiative: { handler: new PortfolioHandler(auth), method: 'handleUpdateInitiative' },
      linear_get_customer: { handler: new PortfolioHandler(auth), method: 'handleGetCustomer' },
      linear_list_customers: { handler: new PortfolioHandler(auth), method: 'handleListCustomers' },
      linear_create_customer: { handler: new PortfolioHandler(auth), method: 'handleCreateCustomer' },
      linear_update_customer: { handler: new PortfolioHandler(auth), method: 'handleUpdateCustomer' },

      // Agent tools
      linear_get_agent_session: { handler: new AgentHandler(auth), method: 'handleGetAgentSession' },
      linear_list_agent_sessions: { handler: new AgentHandler(auth), method: 'handleListAgentSessions' },
      linear_create_agent_session_on_issue: { handler: new AgentHandler(auth), method: 'handleCreateAgentSessionOnIssue' },
      linear_create_agent_session_on_comment: { handler: new AgentHandler(auth), method: 'handleCreateAgentSessionOnComment' },
      linear_update_agent_session: { handler: new AgentHandler(auth), method: 'handleUpdateAgentSession' },
      linear_get_agent_activity: { handler: new AgentHandler(auth), method: 'handleGetAgentActivity' },
      linear_list_agent_activities: { handler: new AgentHandler(auth), method: 'handleListAgentActivities' },
      linear_create_agent_activity: { handler: new AgentHandler(auth), method: 'handleCreateAgentActivity' },

      // Capability and subscription tools
      linear_get_capabilities: { handler: new SubscriptionHandler(auth, this.runtimeCapabilities), method: 'handleGetCapabilities' },
      linear_start_subscription: { handler: new SubscriptionHandler(auth, this.runtimeCapabilities), method: 'handleStartSubscription' },
      linear_stop_subscription: { handler: new SubscriptionHandler(auth, this.runtimeCapabilities), method: 'handleStopSubscription' },

      // Comment tools
      linear_get_comment: { handler: new CommentHandler(auth), method: 'handleGetComment' },
      linear_list_comments: { handler: new CommentHandler(auth), method: 'handleListComments' },
      linear_get_issue_comments: { handler: new CommentHandler(auth), method: 'handleGetIssueComments' },
      linear_create_comment: { handler: new CommentHandler(auth), method: 'handleCreateComment' },
      linear_update_comment: { handler: new CommentHandler(auth), method: 'handleUpdateComment' },
      linear_delete_comment: { handler: new CommentHandler(auth), method: 'handleDeleteComment' },
      linear_resolve_comment: { handler: new CommentHandler(auth), method: 'handleResolveComment' },
      linear_unresolve_comment: { handler: new CommentHandler(auth), method: 'handleUnresolveComment' },

      // Milestone tools
      linear_create_project_milestone: { handler: new MilestoneHandler(auth), method: 'handleCreateProjectMilestone' },
      linear_update_project_milestone: { handler: new MilestoneHandler(auth), method: 'handleUpdateProjectMilestone' },
      linear_delete_project_milestone: { handler: new MilestoneHandler(auth), method: 'handleDeleteProjectMilestone' },
      linear_get_project_milestone: { handler: new MilestoneHandler(auth), method: 'handleGetProjectMilestone' },
      linear_search_project_milestones: { handler: new MilestoneHandler(auth), method: 'handleSearchProjectMilestones' },
      linear_get_project_milestones: { handler: new MilestoneHandler(auth), method: 'handleGetProjectMilestones' },
      linear_create_project_milestones: { handler: new MilestoneHandler(auth), method: 'handleCreateProjectMilestones' },
    };

    const handlerInfo = handlerMap[toolName];
    if (!handlerInfo) {
      throw new Error(`No handler found for tool: ${toolName}`);
    }

    return handlerInfo;
  }
}
