import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';

export interface ProjectInput {
  name: string;
  description?: string;
  content?: string;
  teamIds: string[];
  initiativeId?: string;
  leadId?: string;
  memberIds?: string[];
  startDate?: string;
  targetDate?: string;
  statusId?: string;
  priority?: number;
  icon?: string;
  color?: string;
  labelIds?: string[];
  templateId?: string;
  useDefaultTemplate?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  content?: string;
  teamIds?: string[];
  initiativeId?: string | null;
  leadId?: string;
  memberIds?: string[];
  startDate?: string;
  targetDate?: string;
  statusId?: string;
  priority?: number;
  icon?: string;
  color?: string;
  labelIds?: string[];
  trashed?: boolean;
}

export interface ListProjectsInput {
  filter?: Record<string, unknown>;
  teamId?: string;
  leadId?: string;
  statusId?: string;
  first?: number;
  after?: string;
  orderBy?: string;
}

export interface SearchProjectsInput extends Omit<ListProjectsInput, 'orderBy'> {
  query: string;
}

export interface ProjectUpdateCreateInput {
  projectId: string;
  body?: string;
  bodyData?: Record<string, unknown>;
  health?: string;
  isDiffHidden?: boolean;
}

export interface ProjectUpdateUpdateInput {
  id: string;
  body?: string;
  bodyData?: Record<string, unknown>;
  health?: string;
  isDiffHidden?: boolean;
}

export interface Project {
  id?: string;
  name?: string;
  description?: string;
  content?: string;
  url?: string;
  startDate?: string;
  targetDate?: string;
}

export interface ProjectResponse {
  projectCreate: {
    success: boolean;
    project?: Project;
    lastSyncId?: number;
  };
  issueBatchCreate?: {
    success: boolean;
    issues: Array<{
      id?: string;
      identifier?: string;
      title?: string;
      url?: string;
    }>;
    lastSyncId?: number;
  };
}

export interface SearchProjectsResponse {
  projects: {
    nodes: Project[];
  };
}

export interface GetProjectResponse {
  project: Project;
}

export interface ProjectHandlerMethods {
  handleCreateProject(args: ProjectInput): Promise<BaseToolResponse>;
  handleUpdateProject(args: UpdateProjectInput & { id: string }): Promise<BaseToolResponse>;
  handleDeleteProject(args: { id: string }): Promise<BaseToolResponse>;
  handleCreateProjectWithIssues(args: {
    project: ProjectInput;
    issues: Array<Record<string, unknown>>;
  }): Promise<BaseToolResponse>;
  handleGetProject(args: { id: string }): Promise<BaseToolResponse>;
  handleListProjects(args: ListProjectsInput): Promise<BaseToolResponse>;
  handleSearchProjects(args: SearchProjectsInput): Promise<BaseToolResponse>;
  handleCreateProjectUpdate(args: ProjectUpdateCreateInput): Promise<BaseToolResponse>;
  handleUpdateProjectUpdate(args: ProjectUpdateUpdateInput): Promise<BaseToolResponse>;
}
