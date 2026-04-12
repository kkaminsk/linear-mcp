import {
  asRecord,
  compactObject,
  getDateString,
  getObject,
  getString,
  mapConnection,
  resolveValue,
} from '../../types/sdk.utils.js';

type MappedComment = Record<string, unknown>;

export type MappedCommentConnection = {
  nodes: MappedComment[];
  pageInfo: Record<string, unknown>;
};

function mapCommentUserReference(value: unknown): Record<string, unknown> | undefined {
  const user = asRecord(value);
  const id = getString(user, 'id');
  if (!id) {
    return undefined;
  }

  return compactObject({
    id,
    name: getString(user, 'name'),
    email: getString(user, 'email'),
  });
}

export function mapCommentIssueReference(value: unknown): Record<string, unknown> | undefined {
  const issue = asRecord(value);
  const id = getString(issue, 'id');
  if (!id) {
    return undefined;
  }

  return compactObject({
    id,
    identifier: getString(issue, 'identifier'),
    title: getString(issue, 'title'),
    url: getString(issue, 'url'),
  });
}

async function mapCommentReference(value: unknown): Promise<Record<string, unknown> | undefined> {
  const comment = asRecord(await resolveValue(value));
  const id = getString(comment, 'id');
  if (!id) {
    return undefined;
  }

  return compactObject({
    id,
    body: getString(comment, 'body'),
    url: getString(comment, 'url'),
    createdAt: getDateString(comment, 'createdAt'),
    updatedAt: getDateString(comment, 'updatedAt'),
    user: mapCommentUserReference(await resolveValue(comment.user)),
  });
}

export async function mapComment(value: unknown): Promise<MappedComment> {
  const comment = asRecord(await resolveValue(value));
  const parent = await mapCommentReference(comment.parent);
  const resolvingComment = await mapCommentReference(comment.resolvingComment);
  const user = mapCommentUserReference(await resolveValue(comment.user));
  const issue = mapCommentIssueReference(await resolveValue(comment.issue));
  const resolvingUser = mapCommentUserReference(await resolveValue(comment.resolvingUser));

  return compactObject({
    id: getString(comment, 'id'),
    body: getString(comment, 'body'),
    bodyData: getObject(comment, 'bodyData') ?? getString(comment, 'bodyData'),
    quotedText: getString(comment, 'quotedText'),
    url: getString(comment, 'url'),
    archivedAt: getDateString(comment, 'archivedAt'),
    createdAt: getDateString(comment, 'createdAt'),
    updatedAt: getDateString(comment, 'updatedAt'),
    editedAt: getDateString(comment, 'editedAt'),
    resolvedAt: getDateString(comment, 'resolvedAt'),
    issueId: getString(comment, 'issueId'),
    parentId: getString(comment, 'parentId'),
    resolvingCommentId: getString(comment, 'resolvingCommentId'),
    reactionData: getObject(comment, 'reactionData'),
    user,
    issue,
    parent,
    resolvingComment,
    resolvingUser,
  });
}

export async function mapCommentConnection(connection: unknown): Promise<MappedCommentConnection> {
  return mapConnection(connection, comment => mapComment(comment));
}
