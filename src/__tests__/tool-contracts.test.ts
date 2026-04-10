import { describe, expect, it } from '@jest/globals';
import { toolSchemas } from '../core/types/tool.types';

function containsOptionalKeyword(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsOptionalKeyword);
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (Object.prototype.hasOwnProperty.call(record, 'optional')) {
      return true;
    }

    return Object.values(record).some(containsOptionalKeyword);
  }

  return false;
}

describe('tool contracts', () => {
  it('requires OAuth state for the auth callback schema', () => {
    expect(toolSchemas.linear_auth_callback.inputSchema).toMatchObject({
      required: ['code', 'state'],
    });
  });

  it('advertises distinct list and search tools for issues and projects', () => {
    expect(toolSchemas.linear_list_issues.name).toBe('linear_list_issues');
    expect(toolSchemas.linear_search_issues.name).toBe('linear_search_issues');
    expect(toolSchemas.linear_list_projects.name).toBe('linear_list_projects');
    expect(toolSchemas.linear_search_projects.name).toBe('linear_search_projects');
  });

  it('advertises issue search as query-backed instead of a generic filter-only list call', () => {
    expect(toolSchemas.linear_search_issues.inputSchema).toMatchObject({
      required: ['query'],
      properties: {
        query: {
          type: 'string',
        },
        projectId: {
          type: 'string',
        },
      },
    });
    expect(toolSchemas.linear_search_issues.inputSchema.properties).not.toHaveProperty('filter');
    expect(toolSchemas.linear_search_issues.inputSchema.properties).not.toHaveProperty('orderBy');
  });

  it('advertises distinct single and batch issue creation schemas', () => {
    expect(toolSchemas.linear_create_issue.inputSchema).toMatchObject({
      required: ['title', 'teamId'],
      properties: {
        title: {
          type: 'string',
        },
        teamId: {
          type: 'string',
        },
      },
    });
    expect(toolSchemas.linear_create_issues.inputSchema).toMatchObject({
      required: ['issues'],
      properties: {
        issues: {
          type: 'array',
          minItems: 1,
        },
      },
    });
    expect(toolSchemas.linear_create_issue.inputSchema).not.toEqual(toolSchemas.linear_create_issues.inputSchema);
  });

  it('uses standard JSON Schema keywords without non-standard optional flags', () => {
    expect(containsOptionalKeyword(toolSchemas)).toBe(false);
  });

  it('uses parentId consistently for threaded comment creation', () => {
    expect(toolSchemas.linear_create_comment.inputSchema).toMatchObject({
      required: ['body'],
      properties: {
        parentId: {
          type: 'string',
        },
      },
      anyOf: [
        { required: ['issueId'] },
        { required: ['parentId'] },
      ],
    });
  });

  it('advertises direct and lifecycle comment tools', () => {
    expect(toolSchemas.linear_get_comment.name).toBe('linear_get_comment');
    expect(toolSchemas.linear_list_comments.name).toBe('linear_list_comments');
    expect(toolSchemas.linear_update_comment.name).toBe('linear_update_comment');
    expect(toolSchemas.linear_delete_comment.name).toBe('linear_delete_comment');
    expect(toolSchemas.linear_resolve_comment.name).toBe('linear_resolve_comment');
    expect(toolSchemas.linear_unresolve_comment.name).toBe('linear_unresolve_comment');
  });

  it('requires at least one editable field when updating a comment', () => {
    expect(toolSchemas.linear_update_comment.inputSchema).toMatchObject({
      required: ['id'],
      anyOf: [
        { required: ['body'] },
        { required: ['bodyData'] },
        { required: ['quotedText'] },
      ],
    });
  });

  it('allows explicit null to clear issue project assignment', () => {
    expect(toolSchemas.linear_bulk_update_issues.inputSchema).toMatchObject({
      properties: {
        update: {
          properties: {
            projectId: {
              type: ['string', 'null'],
            },
          },
        },
      },
    });
  });

  it('advertises initiative association on project create and update schemas', () => {
    expect(toolSchemas.linear_create_project.inputSchema).toMatchObject({
      properties: {
        initiativeId: {
          type: 'string',
        },
      },
    });
    expect(toolSchemas.linear_update_project.inputSchema).toMatchObject({
      properties: {
        initiativeId: {
          type: ['string', 'null'],
        },
      },
    });
  });
});
