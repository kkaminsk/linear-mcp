export type SdkRecord = Record<string, unknown>;

export function asRecord(value: unknown): SdkRecord {
  return typeof value === 'object' && value !== null
    ? value as SdkRecord
    : {};
}

export function getString(value: unknown, key: string): string | undefined {
  const record = asRecord(value);
  return typeof record[key] === 'string' ? record[key] as string : undefined;
}

export function getNumber(value: unknown, key: string): number | undefined {
  const record = asRecord(value);
  return typeof record[key] === 'number' ? record[key] as number : undefined;
}

export function getBoolean(value: unknown, key: string): boolean | undefined {
  const record = asRecord(value);
  return typeof record[key] === 'boolean' ? record[key] as boolean : undefined;
}

export function getArray(value: unknown, key: string): unknown[] {
  const record = asRecord(value);
  return Array.isArray(record[key]) ? record[key] as unknown[] : [];
}

export function getDateString(value: unknown, key: string): string | undefined {
  const property = asRecord(value)[key];
  if (typeof property === 'string') {
    return property;
  }

  if (property instanceof Date) {
    return property.toISOString();
  }

  return undefined;
}

export function getObject(value: unknown, key: string): SdkRecord | undefined {
  const record = asRecord(value);
  return typeof record[key] === 'object' && record[key] !== null
    ? record[key] as SdkRecord
    : undefined;
}

export async function resolveValue<T>(value: Promise<T> | T | undefined | null): Promise<T | undefined> {
  if (value === undefined || value === null) {
    return undefined;
  }

  return Promise.resolve(value);
}

export async function callFetchMethod(
  value: unknown,
  methodName: string,
  variables?: Record<string, unknown>
): Promise<unknown | undefined> {
  const record = asRecord(value);
  const method = record[methodName];
  if (typeof method !== 'function') {
    return undefined;
  }

  return (method as (variables?: Record<string, unknown>) => Promise<unknown>)(variables);
}

export function compactObject<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as T;
}

export function toPageInfo(value: unknown): Record<string, unknown> {
  const record = asRecord(value);
  const startCursor = Object.prototype.hasOwnProperty.call(record, 'startCursor')
    ? getString(record, 'startCursor') ?? null
    : undefined;

  return compactObject({
    hasNextPage: getBoolean(record, 'hasNextPage') ?? false,
    endCursor: getString(record, 'endCursor') ?? null,
    hasPreviousPage: getBoolean(record, 'hasPreviousPage'),
    startCursor,
  });
}

export async function mapConnection(
  connection: unknown,
  mapNode: (node: unknown) => Promise<Record<string, unknown>> | Record<string, unknown>
): Promise<{
  nodes: Record<string, unknown>[];
  pageInfo: Record<string, unknown>;
}> {
  const record = asRecord(connection);
  const nodes = Array.isArray(record.nodes) ? record.nodes : [];

  return {
    nodes: await Promise.all(nodes.map(node => Promise.resolve(mapNode(node)))),
    pageInfo: toPageInfo(record.pageInfo),
  };
}
