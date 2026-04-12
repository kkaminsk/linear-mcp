import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import { RuntimeCapabilities, getRuntimeCapabilities } from '../capabilities.js';
import { toolSchemas } from '../types/tool.types.js';

type ToolArguments = Record<string, unknown>;

export interface ToolValidationIssue {
  path: string;
  keyword: string;
  message: string;
  schemaPath: string;
}

export type ToolValidationResult =
  | {
      valid: true;
      data: ToolArguments;
    }
  | {
      valid: false;
      message: string;
      issues: ToolValidationIssue[];
    };

export class ToolValidatorRegistry {
  private readonly validators = new Map<string, ValidateFunction<ToolArguments>>();

  constructor(
    _capabilities: RuntimeCapabilities = getRuntimeCapabilities()
  ) {
    const ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: false,
    });

    for (const tool of Object.values(toolSchemas)) {
      this.validators.set(
        tool.name,
        ajv.compile<ToolArguments>(tool.inputSchema)
      );
    }
  }

  hasTool(toolName: string): boolean {
    return this.validators.has(toolName);
  }

  validate(toolName: string, input: unknown): ToolValidationResult {
    const validator = this.validators.get(toolName);
    const normalizedInput = this.normalizeInput(input);

    if (!validator) {
      return {
        valid: true,
        data: normalizedInput,
      };
    }

    if (validator(normalizedInput)) {
      return {
        valid: true,
        data: normalizedInput,
      };
    }

    const issues = this.formatIssues(toolName, normalizedInput, validator.errors ?? []);

    return {
      valid: false,
      message: this.buildMessage(toolName, issues),
      issues,
    };
  }

  private normalizeInput(input: unknown): ToolArguments {
    if (input === undefined || input === null) {
      return {};
    }

    if (typeof input === 'object' && !Array.isArray(input)) {
      return input as ToolArguments;
    }

    return input as ToolArguments;
  }

  private formatIssues(
    toolName: string,
    input: ToolArguments,
    errors: ErrorObject[]
  ): ToolValidationIssue[] {
    return errors.map(error => {
      const path = this.formatPath(error, toolName, input);
      const message = this.formatMessage(error, toolName, input);

      return {
        path,
        keyword: error.keyword,
        message,
        schemaPath: error.schemaPath,
      };
    });
  }

  private formatPath(
    error: ErrorObject,
    toolName: string,
    input: ToolArguments
  ): string {
    if (
      this.isConflictingIssueStateFilter(toolName, input)
      && error.keyword === 'not'
    ) {
      return '$.stateId';
    }

    if (error.keyword === 'required') {
      const missingProperty = this.getStringParam(error.params, 'missingProperty');
      return this.pointerToPath(`${error.instancePath}/${missingProperty}`);
    }

    if (error.keyword === 'additionalProperties') {
      const additionalProperty = this.getStringParam(error.params, 'additionalProperty');
      return this.pointerToPath(`${error.instancePath}/${additionalProperty}`);
    }

    return this.pointerToPath(error.instancePath);
  }

  private formatMessage(
    error: ErrorObject,
    toolName: string,
    input: ToolArguments
  ): string {
    if (
      this.isConflictingIssueStateFilter(toolName, input)
      && error.keyword === 'not'
    ) {
      return 'stateId and states cannot both be provided';
    }

    return error.message ?? 'Invalid value';
  }

  private buildMessage(
    toolName: string,
    issues: ToolValidationIssue[]
  ): string {
    const firstIssue = issues[0];
    if (!firstIssue) {
      return `Invalid arguments for ${toolName}`;
    }

    return `Invalid arguments for ${toolName}: ${firstIssue.path} ${firstIssue.message}`;
  }

  private pointerToPath(pointer?: string): string {
    if (!pointer) {
      return '$';
    }

    return `$${pointer
      .split('/')
      .slice(1)
      .map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
      .map(segment => /^\d+$/.test(segment) ? `[${segment}]` : `.${segment}`)
      .join('')}`;
  }

  private getStringParam(
    params: Record<string, unknown>,
    key: string
  ): string {
    const value = params[key];
    return typeof value === 'string' ? value : '';
  }

  private isConflictingIssueStateFilter(
    toolName: string,
    input: ToolArguments
  ): boolean {
    return (
      (toolName === 'linear_list_issues' || toolName === 'linear_search_issues')
      && typeof input.stateId === 'string'
      && Array.isArray(input.states)
      && input.states.length > 0
    );
  }
}
