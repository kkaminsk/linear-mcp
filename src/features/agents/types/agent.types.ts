import type { LinearClient } from '@linear/sdk';

export interface GetAgentSessionInput {
  id: string;
}

export type ListAgentSessionsInput = Pick<
  NonNullable<Parameters<LinearClient['agentSessions']>[0]>,
  'first' | 'after' | 'orderBy'
>;

export type CreateAgentSessionOnIssueInput = Parameters<LinearClient['agentSessionCreateOnIssue']>[0];

export type CreateAgentSessionOnCommentInput = Parameters<LinearClient['agentSessionCreateOnComment']>[0];

export type UpdateAgentSessionInput = {
  id: string;
} & Parameters<LinearClient['updateAgentSession']>[1];

export interface GetAgentActivityInput {
  id: string;
}

export type ListAgentActivitiesInput = Pick<
  NonNullable<Parameters<LinearClient['agentActivities']>[0]>,
  'filter' | 'first' | 'after' | 'orderBy'
>;

export type CreateAgentActivityInput = Parameters<LinearClient['createAgentActivity']>[0];
