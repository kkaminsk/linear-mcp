import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';

export interface CreateIssueInput {
  title?: string;
  description?: string;
  teamId: string;
  assigneeId?: string;
  priority?: number;
  estimate?: number;
  projectId?: string;
  projectMilestoneId?: string;
  dueDate?: string;
  cycleId?: string;
  labelIds?: string[];
  parentId?: string;
  subscriberIds?: string[];
  stateId?: string;
  delegateId?: string;
  templateId?: string;
  createAsUser?: string;
  displayIconUrl?: string;
}

export interface CreateIssuesInput {
  issues: CreateIssueInput[];
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: number;
  estimate?: number;
  projectId?: string | null;
  projectMilestoneId?: string;
  dueDate?: string;
  cycleId?: string;
  labelIds?: string[];
  addedLabelIds?: string[];
  removedLabelIds?: string[];
  parentId?: string;
  subscriberIds?: string[];
  stateId?: string;
  delegateId?: string;
  templateId?: string;
  teamId?: string;
  trashed?: boolean;
}

export interface BulkUpdateIssuesInput {
  issueIds: string[];
  update: UpdateIssueInput;
}

export interface GetIssueInput {
  id: string;
}

export interface ListIssuesInput {
  filter?: Record<string, unknown>;
  teamId?: string;
  projectId?: string;
  assigneeId?: string;
  stateId?: string;
  states?: string[];
  priority?: number;
  cycleId?: string;
  first?: number;
  after?: string;
  orderBy?: string;
}

export interface SearchIssuesInput extends Omit<ListIssuesInput, 'orderBy'> {
  query: string;
}

export interface CreateIssueRelationInput {
  issueId: string;
  relatedIssueId: string;
  type: string;
}

export interface DeleteIssueRelationInput {
  id: string;
}

export interface DeleteIssueInput {
  id: string;
}

export interface DeleteIssuesInput {
  ids: string[];
}

export interface Issue {
  id?: string;
  identifier?: string;
  title?: string;
  description?: string;
  url?: string;
  priority?: number;
  estimate?: number;
  dueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateIssueResponse {
  issueCreate: {
    success: boolean;
    issue?: Issue;
  };
}

export interface UpdateIssueResponse {
  issueUpdate: {
    success: boolean;
    issue?: Issue;
  };
}

export interface UpdateIssuesResponse {
  issueUpdate: {
    success: boolean;
    issues: Issue[];
  };
}

export interface SearchIssuesResponse {
  issues: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: Issue[];
  };
  totalCount?: number;
}

export interface DeleteIssueResponse {
  issueDelete: {
    success: boolean;
  };
}

export interface IssueBatchResponse {
  issueBatchCreate: {
    success: boolean;
    issues: Issue[];
    lastSyncId?: number;
  };
}

export interface IssueHandlerMethods {
  handleGetIssue(args: GetIssueInput): Promise<BaseToolResponse>;
  handleCreateIssue(args: CreateIssueInput): Promise<BaseToolResponse>;
  handleCreateIssues(args: CreateIssuesInput): Promise<BaseToolResponse>;
  handleBulkUpdateIssues(args: BulkUpdateIssuesInput): Promise<BaseToolResponse>;
  handleListIssues(args: ListIssuesInput): Promise<BaseToolResponse>;
  handleSearchIssues(args: SearchIssuesInput): Promise<BaseToolResponse>;
  handleDeleteIssue(args: DeleteIssueInput): Promise<BaseToolResponse>;
  handleDeleteIssues(args: DeleteIssuesInput): Promise<BaseToolResponse>;
  handleCreateIssueRelation(args: CreateIssueRelationInput): Promise<BaseToolResponse>;
  handleDeleteIssueRelation(args: DeleteIssueRelationInput): Promise<BaseToolResponse>;
}
