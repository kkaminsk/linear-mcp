import { RuntimeCapabilities, getRuntimeCapabilities } from '../capabilities.js';

type JsonSchema = Record<string, unknown>;
type ToolSchema = {
  name: string;
  description: string;
  inputSchema: JsonSchema;
};

const stringProp = (description: string, extras: JsonSchema = {}): JsonSchema => ({
  type: 'string',
  description,
  ...extras,
});

const nullableStringProp = (description: string, extras: JsonSchema = {}): JsonSchema => ({
  type: ['string', 'null'],
  description,
  ...extras,
});

const numberProp = (description: string, extras: JsonSchema = {}): JsonSchema => ({
  type: 'number',
  description,
  ...extras,
});

const booleanProp = (description: string): JsonSchema => ({
  type: 'boolean',
  description,
});

const looseObjectProp = (description: string): JsonSchema => ({
  type: 'object',
  description,
  additionalProperties: true,
});

const arrayProp = (
  description: string,
  items: JsonSchema,
  extras: JsonSchema = {}
): JsonSchema => ({
  type: 'array',
  items,
  description,
  ...extras,
});

const objectSchema = (
  properties: Record<string, JsonSchema>,
  required: string[] = [],
  additionalProperties: boolean = false
): JsonSchema => ({
  type: 'object',
  properties,
  additionalProperties,
  ...(required.length > 0 ? { required } : {}),
});

const tool = (
  name: string,
  description: string,
  properties: Record<string, JsonSchema> = {},
  required: string[] = [],
  additionalProperties: boolean = false
): ToolSchema => ({
  name,
  description,
  inputSchema: objectSchema(properties, required, additionalProperties),
});

const pageFields = {
  first: numberProp('Number of results to return'),
  after: stringProp('Pagination cursor'),
};

const filterField = {
  filter: looseObjectProp('Filter object using Linear list semantics'),
};

const issueInputProperties = {
  title: stringProp('Issue title'),
  description: stringProp('Issue description'),
  teamId: stringProp('Team ID'),
  assigneeId: stringProp('Assignee user ID'),
  priority: numberProp('Issue priority (0-4)'),
  estimate: numberProp('Issue estimate points'),
  projectId: stringProp('Project ID'),
  projectMilestoneId: stringProp('Project milestone ID'),
  dueDate: stringProp('Issue due date in YYYY-MM-DD format'),
  cycleId: stringProp('Cycle ID'),
  labelIds: arrayProp('Label IDs to attach', { type: 'string' }),
  parentId: stringProp('Parent issue ID for hierarchy workflows; separate from issue relations'),
  subscriberIds: arrayProp('Subscriber user IDs', { type: 'string' }),
  stateId: stringProp('Workflow state ID'),
  delegateId: stringProp('Delegate user ID'),
  templateId: stringProp('Issue template ID'),
  createAsUser: stringProp('OAuth display name for the created issue'),
  displayIconUrl: stringProp('OAuth display icon URL'),
};

const updateIssueProperties = {
  title: stringProp('Updated issue title'),
  description: stringProp('Updated issue description'),
  assigneeId: stringProp('Updated assignee user ID'),
  priority: numberProp('Updated issue priority (0-4)'),
  estimate: numberProp('Updated issue estimate points'),
  projectId: nullableStringProp('Updated project ID. Pass null to clear the existing project assignment.'),
  projectMilestoneId: stringProp('Updated project milestone ID'),
  dueDate: stringProp('Updated due date in YYYY-MM-DD format'),
  cycleId: stringProp('Updated cycle ID'),
  labelIds: arrayProp('Replacement label IDs', { type: 'string' }),
  addedLabelIds: arrayProp('Label IDs to add', { type: 'string' }),
  removedLabelIds: arrayProp('Label IDs to remove', { type: 'string' }),
  parentId: stringProp('Updated parent issue ID for hierarchy workflows; separate from issue relations'),
  subscriberIds: arrayProp('Replacement subscriber user IDs', { type: 'string' }),
  stateId: stringProp('Updated workflow state ID'),
  delegateId: stringProp('Updated delegate user ID'),
  templateId: stringProp('Updated issue template ID'),
  teamId: stringProp('Updated team ID'),
  trashed: booleanProp('Whether the issue is trashed'),
};

const projectProperties = {
  name: stringProp('Project name'),
  description: stringProp('Project description'),
  content: stringProp('Project markdown content'),
  teamIds: arrayProp('Team IDs associated with the project', { type: 'string' }, { minItems: 1 }),
  initiativeId: stringProp('Initiative ID associated with the project'),
  leadId: stringProp('Project lead user ID'),
  memberIds: arrayProp('Project member user IDs', { type: 'string' }),
  startDate: stringProp('Project start date in YYYY-MM-DD format'),
  targetDate: stringProp('Project target date in YYYY-MM-DD format'),
  statusId: stringProp('Project status ID'),
  priority: numberProp('Project priority'),
  icon: stringProp('Project icon'),
  color: stringProp('Project color'),
  labelIds: arrayProp('Project label IDs', { type: 'string' }),
  templateId: stringProp('Project template ID'),
  useDefaultTemplate: booleanProp('Whether to use the default template'),
};

const projectUpdateProperties = {
  body: stringProp('Project update body in markdown'),
  bodyData: looseObjectProp('Structured project update body'),
  health: stringProp('Project update health status'),
  isDiffHidden: booleanProp('Whether project update diffs are hidden'),
};

const issueItemSchema = objectSchema(issueInputProperties, ['title', 'teamId']);
const projectSchema = objectSchema(projectProperties, ['name', 'teamIds']);
const projectUpdateSchema = objectSchema(projectUpdateProperties);

const commentPageFields = {
  first: numberProp('Number of results to return'),
  after: stringProp('Pagination cursor'),
  last: numberProp('Number of results to return from the end'),
  before: stringProp('Pagination cursor for the previous page'),
};

const commentCollectionFields = {
  ...filterField,
  ...commentPageFields,
  includeArchived: booleanProp('Whether to include archived comments'),
  orderBy: stringProp('Pagination order field'),
};

const commentCreateProperties = {
  body: stringProp('Markdown comment body'),
  issueId: stringProp('Issue ID or identifier'),
  parentId: stringProp('Parent comment ID for threaded replies'),
  bodyData: looseObjectProp('Structured comment body'),
  quotedText: stringProp('Quoted source text'),
  createAsUser: stringProp('OAuth display name for the comment'),
  displayIconUrl: stringProp('OAuth display icon URL'),
};

const commentUpdateProperties = {
  id: stringProp('Comment ID'),
  body: stringProp('Updated markdown comment body'),
  bodyData: looseObjectProp('Updated structured comment body'),
  quotedText: stringProp('Updated quoted source text'),
};

const createCommentToolSchema: ToolSchema = {
  name: 'linear_create_comment',
  description: 'Create a comment or threaded reply',
  inputSchema: {
    ...objectSchema(commentCreateProperties, ['body']),
    anyOf: [
      { required: ['issueId'] },
      { required: ['parentId'] },
    ],
  },
};

const updateCommentToolSchema: ToolSchema = {
  name: 'linear_update_comment',
  description: 'Update a comment',
  inputSchema: {
    ...objectSchema(commentUpdateProperties, ['id']),
    anyOf: [
      { required: ['body'] },
      { required: ['bodyData'] },
      { required: ['quotedText'] },
    ],
  },
};

const baseToolSchemas: Record<string, ToolSchema> = {
  linear_auth: tool(
    'linear_auth',
    'Initialize OAuth flow with Linear',
    {
      clientId: stringProp('Linear OAuth client ID'),
      clientSecret: stringProp('Linear OAuth client secret'),
      redirectUri: stringProp('OAuth redirect URI'),
    },
    ['clientId', 'clientSecret', 'redirectUri']
  ),
  linear_auth_callback: tool(
    'linear_auth_callback',
    'Handle OAuth callback',
    {
      code: stringProp('OAuth authorization code'),
      state: stringProp('OAuth state returned from linear_auth'),
    },
    ['code', 'state']
  ),
  linear_get_issue: tool(
    'linear_get_issue',
    'Get detailed issue information',
    {
      id: stringProp('Issue identifier or ID'),
    },
    ['id']
  ),
  linear_create_issue: tool(
    'linear_create_issue',
    'Create a new issue in Linear',
    issueInputProperties,
    ['title', 'teamId']
  ),
  linear_create_issues: tool(
    'linear_create_issues',
    'Create multiple issues at once',
    {
      issues: arrayProp('Issues to create', issueItemSchema, { minItems: 1 }),
    },
    ['issues']
  ),
  linear_bulk_update_issues: tool(
    'linear_bulk_update_issues',
    'Update multiple issues at once',
    {
      issueIds: arrayProp('Issue IDs to update', { type: 'string' }, { minItems: 1 }),
      update: objectSchema(updateIssueProperties),
    },
    ['issueIds', 'update']
  ),
  linear_list_issues: tool(
    'linear_list_issues',
    'List issues using Linear filter and pagination semantics',
    {
      ...filterField,
      teamId: stringProp('Filter by team ID'),
      projectId: stringProp('Filter by project ID'),
      assigneeId: stringProp('Filter by assignee user ID'),
      stateId: stringProp('Filter by workflow state ID'),
      states: arrayProp('Filter by workflow state names', { type: 'string' }),
      priority: numberProp('Filter by priority (0-4)'),
      cycleId: stringProp('Filter by cycle ID'),
      ...pageFields,
      orderBy: stringProp('Pagination order field'),
    }
  ),
  linear_search_issues: tool(
    'linear_search_issues',
    'Search issues using Linear ranked search semantics',
    {
      query: stringProp('Text query to search for'),
      teamId: stringProp('Optional team ID filter'),
      projectId: stringProp('Optional project ID filter'),
      assigneeId: stringProp('Optional assignee user ID filter'),
      stateId: stringProp('Optional workflow state ID filter'),
      states: arrayProp('Optional workflow state names filter', { type: 'string' }),
      priority: numberProp('Optional priority filter'),
      cycleId: stringProp('Optional cycle ID filter'),
      ...pageFields,
    },
    ['query']
  ),
  linear_create_issue_relation: tool(
    'linear_create_issue_relation',
    'Create an issue relation',
    {
      issueId: stringProp('Source issue ID'),
      relatedIssueId: stringProp('Related issue ID'),
      type: stringProp('Issue relation type'),
    },
    ['issueId', 'relatedIssueId', 'type']
  ),
  linear_delete_issue_relation: tool(
    'linear_delete_issue_relation',
    'Delete an issue relation',
    {
      id: stringProp('Issue relation ID'),
    },
    ['id']
  ),
  linear_delete_issue: tool(
    'linear_delete_issue',
    'Delete an issue',
    {
      id: stringProp('Issue identifier or ID'),
    },
    ['id']
  ),
  linear_delete_issues: tool(
    'linear_delete_issues',
    'Delete multiple issues',
    {
      ids: arrayProp('Issue identifiers or IDs', { type: 'string' }, { minItems: 1 }),
    },
    ['ids']
  ),
  linear_create_project: tool(
    'linear_create_project',
    'Create a standalone project',
    projectProperties,
    ['name', 'teamIds']
  ),
  linear_update_project: tool(
    'linear_update_project',
    'Update a standalone project',
    {
      id: stringProp('Project ID'),
      name: stringProp('Updated project name'),
      description: stringProp('Updated project description'),
      content: stringProp('Updated project markdown content'),
      teamIds: arrayProp('Updated team IDs', { type: 'string' }, { minItems: 1 }),
      initiativeId: nullableStringProp('Updated initiative ID. Pass null to clear the existing initiative association.'),
      leadId: stringProp('Updated project lead user ID'),
      memberIds: arrayProp('Updated project member user IDs', { type: 'string' }),
      startDate: stringProp('Updated start date in YYYY-MM-DD format'),
      targetDate: stringProp('Updated target date in YYYY-MM-DD format'),
      statusId: stringProp('Updated project status ID'),
      priority: numberProp('Updated project priority'),
      icon: stringProp('Updated project icon'),
      color: stringProp('Updated project color'),
      labelIds: arrayProp('Updated project label IDs', { type: 'string' }),
      trashed: booleanProp('Whether the project is trashed'),
    },
    ['id']
  ),
  linear_delete_project: tool(
    'linear_delete_project',
    'Delete a standalone project',
    {
      id: stringProp('Project ID'),
    },
    ['id']
  ),
  linear_create_project_with_issues: tool(
    'linear_create_project_with_issues',
    'Create a project together with associated issues',
    {
      project: projectSchema,
      issues: arrayProp('Issues to create in the project', issueItemSchema),
    },
    ['project', 'issues']
  ),
  linear_get_project: tool(
    'linear_get_project',
    'Get project information',
    {
      id: stringProp('Project ID'),
    },
    ['id']
  ),
  linear_list_projects: tool(
    'linear_list_projects',
    'List projects using Linear filter and pagination semantics',
    {
      ...filterField,
      teamId: stringProp('Filter by team ID'),
      leadId: stringProp('Filter by lead user ID'),
      statusId: stringProp('Filter by status ID'),
      ...pageFields,
      orderBy: stringProp('Pagination order field'),
    }
  ),
  linear_search_projects: tool(
    'linear_search_projects',
    'Search projects using Linear ranked search semantics',
    {
      query: stringProp('Text query to search for'),
      teamId: stringProp('Optional team ID filter'),
      leadId: stringProp('Optional lead user ID filter'),
      statusId: stringProp('Optional status ID filter'),
      ...pageFields,
    },
    ['query']
  ),
  linear_create_project_update: tool(
    'linear_create_project_update',
    'Create a project update',
    {
      projectId: stringProp('Project ID'),
      ...projectUpdateProperties,
    },
    ['projectId']
  ),
  linear_update_project_update: tool(
    'linear_update_project_update',
    'Update a project update',
    {
      id: stringProp('Project update ID'),
      ...projectUpdateProperties,
    },
    ['id']
  ),
  linear_get_team: tool(
    'linear_get_team',
    'Get a specific team',
    {
      id: stringProp('Team ID'),
    },
    ['id']
  ),
  linear_get_teams: tool(
    'linear_get_teams',
    'List teams with optional filters',
    {
      ...filterField,
      key: stringProp('Filter by team key'),
      name: stringProp('Filter by team name'),
      ...pageFields,
    }
  ),
  linear_list_teams: tool(
    'linear_list_teams',
    'List teams with optional filters',
    {
      ...filterField,
      key: stringProp('Filter by team key'),
      name: stringProp('Filter by team name'),
      ...pageFields,
    }
  ),
  linear_list_workflow_states: tool(
    'linear_list_workflow_states',
    'List workflow states for a team or workspace',
    {
      teamId: stringProp('Optional team ID'),
      ...pageFields,
    }
  ),
  linear_list_labels: tool(
    'linear_list_labels',
    'List issue labels',
    {
      teamId: stringProp('Optional team ID'),
      ...pageFields,
    }
  ),
  linear_create_label: tool(
    'linear_create_label',
    'Create an issue label',
    {
      name: stringProp('Label name'),
      color: stringProp('Label color'),
      description: stringProp('Label description'),
      teamId: stringProp('Team ID'),
      parentId: stringProp('Parent label ID'),
      isGroup: booleanProp('Whether the label is a group'),
    },
    ['name', 'teamId']
  ),
  linear_update_label: tool(
    'linear_update_label',
    'Update an issue label',
    {
      id: stringProp('Label ID'),
      name: stringProp('Updated label name'),
      color: stringProp('Updated label color'),
      description: stringProp('Updated label description'),
      parentId: stringProp('Updated parent label ID'),
      retiredAt: stringProp('Retired timestamp'),
      isGroup: booleanProp('Whether the label is a group'),
    },
    ['id']
  ),
  linear_delete_label: tool(
    'linear_delete_label',
    'Delete an issue label',
    {
      id: stringProp('Label ID'),
    },
    ['id']
  ),
  linear_get_user: tool(
    'linear_get_user',
    'Get the current user or a specific user',
    {
      id: stringProp('Optional user ID'),
    }
  ),
  linear_list_users: tool(
    'linear_list_users',
    'List users with pagination',
    {
      ...filterField,
      ...pageFields,
      orderBy: stringProp('Pagination order field'),
    }
  ),
  linear_search_users: tool(
    'linear_search_users',
    'Search users for assignment or mention workflows',
    {
      query: stringProp('Text query to search for'),
      ...filterField,
      ...pageFields,
    },
    ['query']
  ),
  linear_get_cycle: tool(
    'linear_get_cycle',
    'Get a cycle by identifier',
    {
      id: stringProp('Cycle ID'),
    },
    ['id']
  ),
  linear_list_cycles: tool(
    'linear_list_cycles',
    'List cycles for planning workflows',
    {
      ...filterField,
      teamId: stringProp('Optional team ID'),
      ...pageFields,
    }
  ),
  linear_get_current_cycle: tool(
    'linear_get_current_cycle',
    'Get the current active cycle',
    {
      ...filterField,
      teamId: stringProp('Optional team ID'),
    }
  ),
  linear_get_attachment: tool(
    'linear_get_attachment',
    'Get attachment information',
    {
      id: stringProp('Attachment ID'),
    },
    ['id']
  ),
  linear_list_attachments: tool(
    'linear_list_attachments',
    'List attachments for an issue or workspace',
    {
      filter: looseObjectProp('Attachment filter object'),
      issueId: stringProp('Optional issue ID to scope attachments'),
      ...pageFields,
    }
  ),
  linear_create_attachment: tool(
    'linear_create_attachment',
    'Create a URL-backed attachment for an issue',
    {
      commentBody: stringProp('Optional linked comment body'),
      commentBodyData: looseObjectProp('Optional structured linked comment body'),
      createAsUser: stringProp('OAuth display name for the attachment'),
      groupBySource: booleanProp('Whether to group attachments by source'),
      iconUrl: stringProp('Attachment icon URL'),
      id: stringProp('Attachment ID'),
      issueId: stringProp('Issue ID or issue identifier'),
      metadata: looseObjectProp('Attachment metadata payload'),
      subtitle: stringProp('Attachment subtitle'),
      title: stringProp('Attachment title'),
      url: stringProp('Attachment URL used for idempotent matching'),
    },
    ['issueId', 'title', 'url']
  ),
  linear_update_attachment: tool(
    'linear_update_attachment',
    'Update an attachment',
    {
      id: stringProp('Attachment ID'),
      iconUrl: stringProp('Updated attachment icon URL'),
      metadata: looseObjectProp('Updated attachment metadata payload'),
      subtitle: stringProp('Updated attachment subtitle'),
      title: stringProp('Updated attachment title'),
    },
    ['id', 'title']
  ),
  linear_delete_attachment: tool(
    'linear_delete_attachment',
    'Delete an attachment',
    {
      id: stringProp('Attachment ID'),
    },
    ['id']
  ),
  linear_get_webhook: tool(
    'linear_get_webhook',
    'Get a webhook registration',
    {
      id: stringProp('Webhook ID'),
    },
    ['id']
  ),
  linear_list_webhooks: tool(
    'linear_list_webhooks',
    'List webhook registrations',
    {
      teamId: stringProp('Optional team ID'),
      ...pageFields,
    }
  ),
  linear_create_webhook: tool(
    'linear_create_webhook',
    'Create a webhook registration',
    {
      allPublicTeams: booleanProp('Whether the webhook applies to all public teams'),
      enabled: booleanProp('Whether the webhook is enabled'),
      id: stringProp('Webhook ID'),
      label: stringProp('Webhook label'),
      resourceTypes: arrayProp('Resource types to subscribe to', { type: 'string' }, { minItems: 1 }),
      secret: stringProp('Webhook signing secret'),
      teamId: stringProp('Optional team ID or key'),
      url: stringProp('Webhook delivery URL'),
    },
    ['resourceTypes', 'url']
  ),
  linear_delete_webhook: tool(
    'linear_delete_webhook',
    'Delete a webhook registration',
    {
      id: stringProp('Webhook ID'),
    },
    ['id']
  ),
  linear_get_initiative: tool(
    'linear_get_initiative',
    'Get an initiative',
    {
      id: stringProp('Initiative ID'),
    },
    ['id']
  ),
  linear_list_initiatives: tool(
    'linear_list_initiatives',
    'List initiatives',
    {
      filter: looseObjectProp('Initiative filter object'),
      ...pageFields,
    }
  ),
  linear_create_initiative: tool(
    'linear_create_initiative',
    'Create an initiative',
    {
      color: stringProp('Initiative color'),
      content: stringProp('Initiative markdown content'),
      description: stringProp('Initiative description'),
      icon: stringProp('Initiative icon'),
      id: stringProp('Initiative ID'),
      name: stringProp('Initiative name'),
      ownerId: stringProp('Initiative owner user ID'),
      sortOrder: numberProp('Initiative sort order'),
      status: stringProp('Initiative status'),
      targetDate: stringProp('Initiative target date in YYYY-MM-DD format'),
      targetDateResolution: stringProp('Initiative target date resolution'),
    },
    ['name']
  ),
  linear_update_initiative: tool(
    'linear_update_initiative',
    'Update an initiative',
    {
      id: stringProp('Initiative ID'),
      color: stringProp('Updated initiative color'),
      content: stringProp('Updated initiative markdown content'),
      description: stringProp('Updated initiative description'),
      frequencyResolution: stringProp('Update reminder frequency resolution'),
      icon: stringProp('Updated initiative icon'),
      name: stringProp('Updated initiative name'),
      ownerId: stringProp('Updated initiative owner user ID'),
      sortOrder: numberProp('Updated initiative sort order'),
      status: stringProp('Updated initiative status'),
      targetDate: stringProp('Updated target date in YYYY-MM-DD format'),
      targetDateResolution: stringProp('Updated target date resolution'),
      trashed: booleanProp('Whether the initiative is trashed'),
      updateReminderFrequency: numberProp('Reminder frequency'),
      updateReminderFrequencyInWeeks: numberProp('Reminder frequency in weeks'),
      updateRemindersDay: stringProp('Reminder weekday'),
      updateRemindersHour: numberProp('Reminder hour'),
    },
    ['id']
  ),
  linear_get_customer: tool(
    'linear_get_customer',
    'Get a customer record',
    {
      id: stringProp('Customer ID'),
    },
    ['id']
  ),
  linear_list_customers: tool(
    'linear_list_customers',
    'List customer records',
    {
      filter: looseObjectProp('Customer filter object'),
      ...pageFields,
    }
  ),
  linear_create_customer: tool(
    'linear_create_customer',
    'Create a customer record',
    {
      domains: arrayProp('Customer domains', { type: 'string' }),
      externalIds: arrayProp('External customer IDs', { type: 'string' }),
      id: stringProp('Customer ID'),
      logoUrl: stringProp('Customer logo URL'),
      mainSourceId: stringProp('Primary external source ID'),
      name: stringProp('Customer name'),
      ownerId: stringProp('Customer owner user ID'),
      revenue: numberProp('Annual revenue'),
      size: numberProp('Customer size'),
      slackChannelId: stringProp('Slack channel ID'),
      statusId: stringProp('Customer status ID'),
      tierId: stringProp('Customer tier ID'),
    },
    ['name']
  ),
  linear_update_customer: tool(
    'linear_update_customer',
    'Update a customer record',
    {
      id: stringProp('Customer ID'),
      domains: arrayProp('Updated customer domains', { type: 'string' }),
      externalIds: arrayProp('Updated external customer IDs', { type: 'string' }),
      logoUrl: stringProp('Updated customer logo URL'),
      mainSourceId: stringProp('Updated primary external source ID'),
      name: stringProp('Updated customer name'),
      ownerId: stringProp('Updated customer owner user ID'),
      revenue: numberProp('Updated annual revenue'),
      size: numberProp('Updated customer size'),
      slackChannelId: stringProp('Updated Slack channel ID'),
      statusId: stringProp('Updated customer status ID'),
      tierId: stringProp('Updated customer tier ID'),
    },
    ['id']
  ),
  linear_get_agent_session: tool(
    'linear_get_agent_session',
    'Get an agent session',
    {
      id: stringProp('Agent session ID'),
    },
    ['id']
  ),
  linear_list_agent_sessions: tool(
    'linear_list_agent_sessions',
    'List agent sessions',
    {
      ...pageFields,
      orderBy: stringProp('Pagination order field'),
    }
  ),
  linear_create_agent_session_on_issue: tool(
    'linear_create_agent_session_on_issue',
    'Create an agent session on an issue',
    {
      issueId: stringProp('Issue ID or issue identifier'),
      externalLink: stringProp('External agent-hosted page URL'),
      externalUrls: arrayProp(
        'External resources associated with the session',
        objectSchema(
          {
            label: stringProp('External URL label'),
            url: stringProp('External URL'),
          },
          ['label', 'url']
        )
      ),
    },
    ['issueId']
  ),
  linear_create_agent_session_on_comment: tool(
    'linear_create_agent_session_on_comment',
    'Create an agent session on a comment',
    {
      commentId: stringProp('Comment ID'),
      externalLink: stringProp('External agent-hosted page URL'),
      externalUrls: arrayProp(
        'External resources associated with the session',
        objectSchema(
          {
            label: stringProp('External URL label'),
            url: stringProp('External URL'),
          },
          ['label', 'url']
        )
      ),
    },
    ['commentId']
  ),
  linear_update_agent_session: tool(
    'linear_update_agent_session',
    'Update an agent session',
    {
      id: stringProp('Agent session ID'),
      addedExternalUrls: arrayProp(
        'External URLs to add to the session',
        objectSchema(
          {
            label: stringProp('External URL label'),
            url: stringProp('External URL'),
          },
          ['label', 'url']
        )
      ),
      dismissedAt: stringProp('Dismissed timestamp'),
      externalLink: stringProp('Updated external agent-hosted page URL'),
      externalUrls: arrayProp(
        'Replacement external URLs for the session',
        objectSchema(
          {
            label: stringProp('External URL label'),
            url: stringProp('External URL'),
          },
          ['label', 'url']
        )
      ),
      plan: looseObjectProp('Dynamic agent execution plan'),
      removedExternalUrls: arrayProp('External URLs to remove', { type: 'string' }),
      userState: arrayProp('User-specific session state entries', looseObjectProp('User state entry')),
    },
    ['id']
  ),
  linear_get_agent_activity: tool(
    'linear_get_agent_activity',
    'Get an agent activity',
    {
      id: stringProp('Agent activity ID'),
    },
    ['id']
  ),
  linear_list_agent_activities: tool(
    'linear_list_agent_activities',
    'List agent activities',
    {
      filter: looseObjectProp('Agent activity filter object'),
      ...pageFields,
      orderBy: stringProp('Pagination order field'),
    }
  ),
  linear_create_agent_activity: tool(
    'linear_create_agent_activity',
    'Create an agent activity',
    {
      agentSessionId: stringProp('Agent session ID'),
      content: looseObjectProp('Agent activity content payload'),
      contextualMetadata: looseObjectProp('Contextual metadata'),
      ephemeral: booleanProp('Whether the activity is ephemeral'),
      id: stringProp('Agent activity ID'),
      signal: stringProp('Agent activity signal'),
      signalMetadata: looseObjectProp('Signal metadata'),
    },
    ['agentSessionId', 'content']
  ),
  linear_get_capabilities: tool(
    'linear_get_capabilities',
    'Report runtime capabilities and advanced feature availability'
  ),
  linear_get_comment: tool(
    'linear_get_comment',
    'Get a single comment by ID',
    {
      id: stringProp('Comment ID'),
    },
    ['id']
  ),
  linear_list_comments: tool(
    'linear_list_comments',
    'List comments using Linear filter and pagination semantics',
    commentCollectionFields
  ),
  linear_get_issue_comments: tool(
    'linear_get_issue_comments',
    'Get comments for a specific issue using native collection controls',
    {
      issueId: stringProp('Issue ID'),
      ...commentCollectionFields,
    },
    ['issueId']
  ),
  linear_create_comment: createCommentToolSchema,
  linear_update_comment: updateCommentToolSchema,
  linear_delete_comment: tool(
    'linear_delete_comment',
    'Delete a comment',
    {
      id: stringProp('Comment ID'),
    },
    ['id']
  ),
  linear_resolve_comment: tool(
    'linear_resolve_comment',
    'Resolve a comment thread',
    {
      id: stringProp('Comment ID'),
      resolvingCommentId: stringProp('Reply comment ID that resolves the thread'),
    },
    ['id']
  ),
  linear_unresolve_comment: tool(
    'linear_unresolve_comment',
    'Unresolve a comment thread',
    {
      id: stringProp('Comment ID'),
    },
    ['id']
  ),
  linear_create_project_milestone: tool(
    'linear_create_project_milestone',
    'Create a project milestone',
    {
      name: stringProp('Milestone name'),
      description: stringProp('Milestone description'),
      targetDate: stringProp('Milestone target date in YYYY-MM-DD format'),
      projectId: stringProp('Project ID'),
      sortOrder: numberProp('Milestone sort order'),
      id: stringProp('Milestone ID'),
    },
    ['name', 'projectId']
  ),
  linear_update_project_milestone: tool(
    'linear_update_project_milestone',
    'Update a project milestone',
    {
      id: stringProp('Milestone ID'),
      name: stringProp('Updated milestone name'),
      description: stringProp('Updated milestone description'),
      targetDate: stringProp('Updated milestone target date in YYYY-MM-DD format'),
      projectId: stringProp('Updated project ID'),
      sortOrder: numberProp('Updated milestone sort order'),
    },
    ['id']
  ),
  linear_delete_project_milestone: tool(
    'linear_delete_project_milestone',
    'Delete a project milestone',
    {
      id: stringProp('Milestone ID'),
    },
    ['id']
  ),
  linear_get_project_milestone: tool(
    'linear_get_project_milestone',
    'Get a project milestone',
    {
      id: stringProp('Milestone ID'),
    },
    ['id']
  ),
  linear_search_project_milestones: tool(
    'linear_search_project_milestones',
    'Search project milestones',
    {
      name: stringProp('Optional milestone name'),
      projectId: stringProp('Optional project ID'),
      targetDate: stringProp('Optional milestone target date in YYYY-MM-DD format'),
      ...pageFields,
      orderBy: stringProp('Pagination order field'),
    }
  ),
  linear_get_project_milestones: tool(
    'linear_get_project_milestones',
    'List milestones for a project',
    {
      projectId: stringProp('Project ID'),
      ...pageFields,
      orderBy: stringProp('Pagination order field'),
    },
    ['projectId']
  ),
  linear_create_project_milestones: tool(
    'linear_create_project_milestones',
    'Create multiple project milestones',
    {
      projectId: stringProp('Project ID'),
      milestones: arrayProp(
        'Milestones to create',
        objectSchema(
          {
            name: stringProp('Milestone name'),
            description: stringProp('Milestone description'),
            targetDate: stringProp('Milestone target date in YYYY-MM-DD format'),
            sortOrder: numberProp('Milestone sort order'),
          },
          ['name']
        ),
        { minItems: 1 }
      ),
    },
    ['projectId', 'milestones']
  ),
};

const subscriptionToolSchemas: Record<string, ToolSchema> = {
  linear_start_subscription: tool(
    'linear_start_subscription',
    'Start a subscription workflow when the runtime supports streaming transports',
    {
      topic: stringProp('Subscription topic'),
      filter: looseObjectProp('Optional subscription filter'),
    },
    ['topic']
  ),
  linear_stop_subscription: tool(
    'linear_stop_subscription',
    'Stop a subscription workflow',
    {
      subscriptionId: stringProp('Subscription ID'),
    },
    ['subscriptionId']
  ),
};

export const toolSchemas = {
  ...baseToolSchemas,
  ...subscriptionToolSchemas,
};

export function getAdvertisedToolSchemas(
  capabilities: RuntimeCapabilities = getRuntimeCapabilities()
): ToolSchema[] {
  return Object.values(
    capabilities.supportsSubscriptions
      ? toolSchemas
      : baseToolSchemas
  );
}
