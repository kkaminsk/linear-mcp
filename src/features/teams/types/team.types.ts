export interface GetTeamInput {
  id: string;
}

export interface ListTeamsInput {
  filter?: Record<string, unknown>;
  key?: string;
  name?: string;
  first?: number;
  after?: string;
}

export interface ListWorkflowStatesInput {
  teamId?: string;
  first?: number;
  after?: string;
}

export interface ListLabelsInput {
  teamId?: string;
  first?: number;
  after?: string;
}

export interface LabelInput {
  name: string;
  color?: string;
  description?: string;
  teamId: string;
  parentId?: string;
  isGroup?: boolean;
}

export interface UpdateLabelInput {
  id: string;
  name?: string;
  color?: string;
  description?: string;
  parentId?: string;
  retiredAt?: string;
  isGroup?: boolean;
}

export interface DeleteLabelInput {
  id: string;
}

export interface TeamState {
  id?: string;
  name?: string;
  type?: string;
  color?: string;
}

export interface Team {
  id?: string;
  name?: string;
  key?: string;
  description?: string;
}

export interface TeamResponse {
  teams: {
    nodes: Team[];
  };
}

export interface LabelResponse {
  labelCreate?: {
    success: boolean;
    label?: {
      id?: string;
      name?: string;
      color?: string;
    };
  };
}
