import { BaseHandler } from '../../../core/handlers/base.handler.js';
import { BaseToolResponse } from '../../../core/interfaces/tool-handler.interface.js';
import { LinearAuth } from '../../../auth.js';
import { ProjectMilestone } from '../types/milestone.types.js';

/**
 * Handler for project milestone-related operations.
 * Manages creating, updating, deleting, and retrieving project milestone information.
 */
export class MilestoneHandler extends BaseHandler {
  constructor(auth: LinearAuth) {
    super(auth);
  }

  /**
   * Creates a new project milestone.
   */
  async handleCreateProjectMilestone(args: any): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['name', 'projectId']);

      const result = await client.createProjectMilestone({
        name: args.name,
        description: args.description,
        targetDate: args.targetDate,
        projectId: args.projectId,
        sortOrder: args.sortOrder,
        id: args.id,
      });

      if (!result.projectMilestoneCreate.success) {
        throw new Error('Failed to create project milestone');
      }

      const { projectMilestone } = result.projectMilestoneCreate;

      return this.createStructuredResponse(
        `Created project milestone ${projectMilestone.name}`,
        {
          success: true,
          projectMilestone,
        }
      );
    } catch (error) {
      return this.handleError(error, 'create project milestone');
    }
  }

  /**
   * Updates an existing project milestone.
   */
  async handleUpdateProjectMilestone(args: any): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const updateInput: any = {};
      if (args.name !== undefined) updateInput.name = args.name;
      if (args.description !== undefined) updateInput.description = args.description;
      if (args.targetDate !== undefined) updateInput.targetDate = args.targetDate;
      if (args.projectId !== undefined) updateInput.projectId = args.projectId;
      if (args.sortOrder !== undefined) updateInput.sortOrder = args.sortOrder;

      const result = await client.updateProjectMilestone(args.id, updateInput);

      if (!result.projectMilestoneUpdate.success) {
        throw new Error('Failed to update project milestone');
      }

      const { projectMilestone } = result.projectMilestoneUpdate;

      return this.createStructuredResponse(
        `Updated project milestone ${projectMilestone.name}`,
        {
          success: true,
          projectMilestone,
        }
      );
    } catch (error) {
      return this.handleError(error, 'update project milestone');
    }
  }

  /**
   * Deletes a project milestone.
   */
  async handleDeleteProjectMilestone(args: any): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const result = await client.deleteProjectMilestone(args.id);

      if (!result.projectMilestoneDelete.success) {
        throw new Error('Failed to delete project milestone');
      }

      return this.createStructuredResponse(
        `Deleted project milestone ${args.id}`,
        {
          success: true,
          id: args.id,
        }
      );
    } catch (error) {
      return this.handleError(error, 'delete project milestone');
    }
  }

  /**
   * Gets information about a specific project milestone.
   */
  async handleGetProjectMilestone(args: any): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['id']);

      const result = await client.getProjectMilestone(args.id);

      const processedResult = {
        ...result,
        projectMilestone: {
          ...result.projectMilestone,
          actualDescription: this.getProjectMilestoneDescription(result.projectMilestone)
        }
      };

      return this.createStructuredResponse(
        `Fetched project milestone ${result.projectMilestone.name}`,
        processedResult as Record<string, unknown>
      );
    } catch (error) {
      return this.handleError(error, 'get project milestone info');
    }
  }

  /**
   * Searches for project milestones with filtering and pagination.
   */
  async handleSearchProjectMilestones(args: any): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();

      const filter: any = {};
      
      if (args.name) {
        filter.name = { eq: args.name };
      }
      
      if (args.projectId) {
        filter.project = { id: { eq: args.projectId } };
      }

      if (args.targetDate) {
        filter.targetDate = { eq: args.targetDate };
      }

      const result = await client.searchProjectMilestones({
        filter: Object.keys(filter).length > 0 ? filter : undefined,
        first: args.first || 50,
        after: args.after,
        orderBy: args.orderBy || 'updatedAt'
      });

      const processedResult = {
        ...result,
        projectMilestones: {
          ...result.projectMilestones,
          nodes: result.projectMilestones.nodes.map(milestone => ({
            ...milestone,
            actualDescription: this.getProjectMilestoneDescription(milestone)
          }))
        }
      };

      return this.createStructuredResponse(
        `Found ${processedResult.projectMilestones.nodes.length} project milestones`,
        processedResult as Record<string, unknown>
      );
    } catch (error) {
      return this.handleError(error, 'search project milestones');
    }
  }

  /**
   * Gets project milestones for a specific project.
   */
  async handleGetProjectMilestones(args: any): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['projectId']);

      const result = await client.searchProjectMilestones({
        filter: {
          project: { id: { eq: args.projectId } }
        },
        first: args.first || 50,
        after: args.after,
        orderBy: args.orderBy || 'sortOrder'
      });

      const processedResult = {
        ...result,
        projectMilestones: {
          ...result.projectMilestones,
          nodes: result.projectMilestones.nodes.map(milestone => ({
            ...milestone,
            actualDescription: this.getProjectMilestoneDescription(milestone)
          }))
        }
      };

      return this.createStructuredResponse(
        `Fetched ${processedResult.projectMilestones.nodes.length} milestones for project ${args.projectId}`,
        processedResult as Record<string, unknown>
      );
    } catch (error) {
      return this.handleError(error, 'get project milestones');
    }
  }

  /**
   * Creates multiple project milestones at once.
   */
  async handleCreateProjectMilestones(args: any): Promise<BaseToolResponse> {
    try {
      const client = await this.verifyAuth();
      this.validateRequiredParams(args, ['projectId', 'milestones']);

      if (!Array.isArray(args.milestones) || args.milestones.length === 0) {
        throw new Error('milestones must be a non-empty array');
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < args.milestones.length; i++) {
        const milestone = args.milestones[i];
        
        if (!milestone.name) {
          errors.push(`Milestone ${i + 1}: name is required`);
          continue;
        }

        try {
          const result = await client.createProjectMilestone({
            name: milestone.name,
            description: milestone.description,
            targetDate: milestone.targetDate,
            projectId: args.projectId,
            sortOrder: milestone.sortOrder || (i + 1),
          });

          if (result.projectMilestoneCreate.success) {
            results.push({
              name: milestone.name,
              id: result.projectMilestoneCreate.projectMilestone.id,
              status: 'created'
            });
          } else {
            errors.push(`Failed to create milestone: ${milestone.name}`);
          }
        } catch (error) {
          errors.push(`Error creating milestone "${milestone.name}": ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return this.createStructuredResponse(
        `Bulk milestone creation created ${results.length} milestones${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
        {
          success: errors.length === 0,
          created: results,
          errors,
        }
      );
    } catch (error) {
      return this.handleError(error, 'create project milestones');
    }
  }

  /**
   * Utility function to get the actual project milestone description
   * Prioritizes documentContent.content over legacy description field
   */
  private getProjectMilestoneDescription(milestone: ProjectMilestone): string {
    return milestone.documentContent?.content || milestone.description || '';
  }
}
