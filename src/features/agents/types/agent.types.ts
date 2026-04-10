import type { LinearClient } from '@linear/sdk';

export interface GetAgentSessionInput {
  id: string;
}

export const AGENT_FLEXIBLE_OBJECT_MAX_PROPERTIES = 20;
export const AGENT_FLEXIBLE_ARRAY_MAX_ITEMS = 50;
export const AGENT_FLEXIBLE_STRING_MAX_LENGTH = 4000;
export const AGENT_FLEXIBLE_MAX_DEPTH = 5;

export type AgentFlexibleValue =
  | string
  | number
  | boolean
  | null
  | AgentFlexibleObject
  | AgentFlexibleValue[];

export interface AgentFlexibleObject {
  [key: string]: AgentFlexibleValue;
}

type AgentSessionListArgs = NonNullable<Parameters<LinearClient['agentSessions']>[0]>;
type AgentActivityListArgs = NonNullable<Parameters<LinearClient['agentActivities']>[0]>;
type AgentActivityCreateSdkInput = Parameters<LinearClient['createAgentActivity']>[0];

export interface ListAgentSessionsInput {
  first?: AgentSessionListArgs['first'];
  after?: AgentSessionListArgs['after'];
  orderBy?: AgentSessionListArgs['orderBy'];
}

export interface AgentSessionExternalUrlInput {
  label: string;
  url: string;
}

export interface CreateAgentSessionOnIssueInput {
  issueId: string;
  externalLink?: string;
  externalUrls?: AgentSessionExternalUrlInput[];
}

export interface CreateAgentSessionOnCommentInput {
  commentId: string;
  externalLink?: string;
  externalUrls?: AgentSessionExternalUrlInput[];
}

export interface AgentSessionUserStateInput {
  userId: string;
  lastReadAt?: string;
}

export interface UpdateAgentSessionInput {
  id: string;
  addedExternalUrls?: AgentSessionExternalUrlInput[];
  dismissedAt?: string;
  externalLink?: string;
  externalUrls?: AgentSessionExternalUrlInput[];
  plan?: AgentFlexibleObject;
  removedExternalUrls?: string[];
  userState?: AgentSessionUserStateInput[];
}

export interface GetAgentActivityInput {
  id: string;
}

export interface ListAgentActivitiesInput {
  filter?: AgentActivityListArgs['filter'];
  first?: AgentActivityListArgs['first'];
  after?: AgentActivityListArgs['after'];
  orderBy?: AgentActivityListArgs['orderBy'];
}

export interface CreateAgentActivityInput {
  agentSessionId: string;
  content: AgentFlexibleObject;
  contextualMetadata?: AgentFlexibleObject;
  ephemeral?: AgentActivityCreateSdkInput['ephemeral'];
  id?: string;
  signal?: AgentActivityCreateSdkInput['signal'];
  signalMetadata?: AgentFlexibleObject;
}
