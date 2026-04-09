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
  private authHandler: AuthHandler;
  private issueHandler: IssueHandler;
  private projectHandler: ProjectHandler;
  private teamHandler: TeamHandler;
  private userHandler: UserHandler;
  private commentHandler: CommentHandler;
  private milestoneHandler: MilestoneHandler;
  private cycleHandler: CycleHandler;
  private attachmentHandler: AttachmentHandler;
  private webhookHandler: WebhookHandler;
  private portfolioHandler: PortfolioHandler;
  private agentHandler: AgentHandler;
  private subscriptionHandler: SubscriptionHandler;

  constructor(
    auth: LinearAuth,
    runtimeCapabilities: RuntimeCapabilities = getRuntimeCapabilities()
  ) {
    this.authHandler = new AuthHandler(auth);
    this.issueHandler = new IssueHandler(auth);
    this.projectHandler = new ProjectHandler(auth);
    this.teamHandler = new TeamHandler(auth);
    this.userHandler = new UserHandler(auth);
    this.commentHandler = new CommentHandler(auth);
    this.milestoneHandler = new MilestoneHandler(auth);
    this.cycleHandler = new CycleHandler(auth);
    this.attachmentHandler = new AttachmentHandler(auth);
    this.webhookHandler = new WebhookHandler(auth);
    this.portfolioHandler = new PortfolioHandler(auth);
    this.agentHandler = new AgentHandler(auth);
    this.subscriptionHandler = new SubscriptionHandler(auth, runtimeCapabilities);
  }

  /**
   * Gets the appropriate handler for a given tool name.
   */
  getHandlerForTool(toolName: string): {
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
    const handlerMap: Record<string, { handler: any; method: string }> = {
      // Auth tools
      linear_auth: { handler: this.authHandler, method: 'handleAuth' },
      linear_auth_callback: { handler: this.authHandler, method: 'handleAuthCallback' },

      // Issue tools
      linear_get_issue: { handler: this.issueHandler, method: 'handleGetIssue' },
      linear_create_issue: { handler: this.issueHandler, method: 'handleCreateIssue' },
      linear_create_issues: { handler: this.issueHandler, method: 'handleCreateIssues' },
      linear_bulk_update_issues: { handler: this.issueHandler, method: 'handleBulkUpdateIssues' },
      linear_list_issues: { handler: this.issueHandler, method: 'handleListIssues' },
      linear_search_issues: { handler: this.issueHandler, method: 'handleSearchIssues' },
      linear_create_issue_relation: { handler: this.issueHandler, method: 'handleCreateIssueRelation' },
      linear_delete_issue_relation: { handler: this.issueHandler, method: 'handleDeleteIssueRelation' },
      linear_delete_issue: { handler: this.issueHandler, method: 'handleDeleteIssue' },
      linear_delete_issues: { handler: this.issueHandler, method: 'handleDeleteIssues' },

      // Project tools
      linear_create_project: { handler: this.projectHandler, method: 'handleCreateProject' },
      linear_update_project: { handler: this.projectHandler, method: 'handleUpdateProject' },
      linear_delete_project: { handler: this.projectHandler, method: 'handleDeleteProject' },
      linear_create_project_with_issues: { handler: this.projectHandler, method: 'handleCreateProjectWithIssues' },
      linear_get_project: { handler: this.projectHandler, method: 'handleGetProject' },
      linear_list_projects: { handler: this.projectHandler, method: 'handleListProjects' },
      linear_search_projects: { handler: this.projectHandler, method: 'handleSearchProjects' },
      linear_create_project_update: { handler: this.projectHandler, method: 'handleCreateProjectUpdate' },
      linear_update_project_update: { handler: this.projectHandler, method: 'handleUpdateProjectUpdate' },

      // Team tools
      linear_get_team: { handler: this.teamHandler, method: 'handleGetTeam' },
      linear_get_teams: { handler: this.teamHandler, method: 'handleGetTeams' },
      linear_list_teams: { handler: this.teamHandler, method: 'handleListTeams' },
      linear_list_workflow_states: { handler: this.teamHandler, method: 'handleListWorkflowStates' },
      linear_list_labels: { handler: this.teamHandler, method: 'handleListLabels' },
      linear_create_label: { handler: this.teamHandler, method: 'handleCreateLabel' },
      linear_update_label: { handler: this.teamHandler, method: 'handleUpdateLabel' },
      linear_delete_label: { handler: this.teamHandler, method: 'handleDeleteLabel' },

      // User tools
      linear_get_user: { handler: this.userHandler, method: 'handleGetUser' },
      linear_list_users: { handler: this.userHandler, method: 'handleListUsers' },
      linear_search_users: { handler: this.userHandler, method: 'handleSearchUsers' },

      // Cycle tools
      linear_get_cycle: { handler: this.cycleHandler, method: 'handleGetCycle' },
      linear_list_cycles: { handler: this.cycleHandler, method: 'handleListCycles' },
      linear_get_current_cycle: { handler: this.cycleHandler, method: 'handleGetCurrentCycle' },

      // Attachment tools
      linear_get_attachment: { handler: this.attachmentHandler, method: 'handleGetAttachment' },
      linear_list_attachments: { handler: this.attachmentHandler, method: 'handleListAttachments' },
      linear_create_attachment: { handler: this.attachmentHandler, method: 'handleCreateAttachment' },
      linear_update_attachment: { handler: this.attachmentHandler, method: 'handleUpdateAttachment' },
      linear_delete_attachment: { handler: this.attachmentHandler, method: 'handleDeleteAttachment' },

      // Webhook tools
      linear_get_webhook: { handler: this.webhookHandler, method: 'handleGetWebhook' },
      linear_list_webhooks: { handler: this.webhookHandler, method: 'handleListWebhooks' },
      linear_create_webhook: { handler: this.webhookHandler, method: 'handleCreateWebhook' },
      linear_delete_webhook: { handler: this.webhookHandler, method: 'handleDeleteWebhook' },

      // Portfolio tools
      linear_get_initiative: { handler: this.portfolioHandler, method: 'handleGetInitiative' },
      linear_list_initiatives: { handler: this.portfolioHandler, method: 'handleListInitiatives' },
      linear_create_initiative: { handler: this.portfolioHandler, method: 'handleCreateInitiative' },
      linear_update_initiative: { handler: this.portfolioHandler, method: 'handleUpdateInitiative' },
      linear_get_customer: { handler: this.portfolioHandler, method: 'handleGetCustomer' },
      linear_list_customers: { handler: this.portfolioHandler, method: 'handleListCustomers' },
      linear_create_customer: { handler: this.portfolioHandler, method: 'handleCreateCustomer' },
      linear_update_customer: { handler: this.portfolioHandler, method: 'handleUpdateCustomer' },

      // Agent tools
      linear_get_agent_session: { handler: this.agentHandler, method: 'handleGetAgentSession' },
      linear_list_agent_sessions: { handler: this.agentHandler, method: 'handleListAgentSessions' },
      linear_create_agent_session_on_issue: { handler: this.agentHandler, method: 'handleCreateAgentSessionOnIssue' },
      linear_create_agent_session_on_comment: { handler: this.agentHandler, method: 'handleCreateAgentSessionOnComment' },
      linear_update_agent_session: { handler: this.agentHandler, method: 'handleUpdateAgentSession' },
      linear_get_agent_activity: { handler: this.agentHandler, method: 'handleGetAgentActivity' },
      linear_list_agent_activities: { handler: this.agentHandler, method: 'handleListAgentActivities' },
      linear_create_agent_activity: { handler: this.agentHandler, method: 'handleCreateAgentActivity' },

      // Capability and subscription tools
      linear_get_capabilities: { handler: this.subscriptionHandler, method: 'handleGetCapabilities' },
      linear_start_subscription: { handler: this.subscriptionHandler, method: 'handleStartSubscription' },
      linear_stop_subscription: { handler: this.subscriptionHandler, method: 'handleStopSubscription' },

      // Comment tools
      linear_get_comment: { handler: this.commentHandler, method: 'handleGetComment' },
      linear_list_comments: { handler: this.commentHandler, method: 'handleListComments' },
      linear_get_issue_comments: { handler: this.commentHandler, method: 'handleGetIssueComments' },
      linear_create_comment: { handler: this.commentHandler, method: 'handleCreateComment' },
      linear_update_comment: { handler: this.commentHandler, method: 'handleUpdateComment' },
      linear_delete_comment: { handler: this.commentHandler, method: 'handleDeleteComment' },
      linear_resolve_comment: { handler: this.commentHandler, method: 'handleResolveComment' },
      linear_unresolve_comment: { handler: this.commentHandler, method: 'handleUnresolveComment' },

      // Milestone tools
      linear_create_project_milestone: { handler: this.milestoneHandler, method: 'handleCreateProjectMilestone' },
      linear_update_project_milestone: { handler: this.milestoneHandler, method: 'handleUpdateProjectMilestone' },
      linear_delete_project_milestone: { handler: this.milestoneHandler, method: 'handleDeleteProjectMilestone' },
      linear_get_project_milestone: { handler: this.milestoneHandler, method: 'handleGetProjectMilestone' },
      linear_search_project_milestones: { handler: this.milestoneHandler, method: 'handleSearchProjectMilestones' },
      linear_get_project_milestones: { handler: this.milestoneHandler, method: 'handleGetProjectMilestones' },
      linear_create_project_milestones: { handler: this.milestoneHandler, method: 'handleCreateProjectMilestones' },
    };

    const handlerInfo = handlerMap[toolName];
    if (!handlerInfo) {
      throw new Error(`No handler found for tool: ${toolName}`);
    }

    return handlerInfo;
  }
}
