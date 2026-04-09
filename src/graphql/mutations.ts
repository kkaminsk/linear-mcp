import { gql } from 'graphql-tag';

const COMMENT_USER_FIELDS = `
  id
  name
  email
`;

const COMMENT_REFERENCE_FIELDS = `
  id
  body
  url
  createdAt
  updatedAt
  user {
    ${COMMENT_USER_FIELDS}
  }
`;

const COMMENT_FIELDS = `
  id
  body
  bodyData
  quotedText
  url
  archivedAt
  createdAt
  updatedAt
  editedAt
  resolvedAt
  issueId
  parentId
  resolvingCommentId
  reactionData
  user {
    ${COMMENT_USER_FIELDS}
  }
  issue {
    id
    identifier
    title
    url
  }
  parent {
    ${COMMENT_REFERENCE_FIELDS}
  }
  resolvingComment {
    ${COMMENT_REFERENCE_FIELDS}
  }
  resolvingUser {
    ${COMMENT_USER_FIELDS}
  }
`;

const COMMENT_MUTATION_PAYLOAD_FIELDS = `
  success
  comment {
    ${COMMENT_FIELDS}
  }
  lastSyncId
`;

export const CREATE_ISSUE_MUTATION = gql`
  mutation CreateIssue($input: IssueCreateInput!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        identifier
        title
        url
        team {
          id
          name
        }
        project {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_ISSUES_MUTATION = gql`
  mutation CreateIssues($input: [IssueCreateInput!]!) {
    issueCreate(input: $input) {
      success
      issue {
        id
        identifier
        title
        url
        team {
          id
          name
        }
        project {
          id
          name
        }
      }
    }
  }
`;

export const CREATE_PROJECT = gql`
  mutation CreateProject($input: ProjectCreateInput!) {
    projectCreate(input: $input) {
      success
      project {
        id
        name
        url
      }
      lastSyncId
    }
  }
`;

export const CREATE_BATCH_ISSUES = gql`
  mutation CreateBatchIssues($input: IssueBatchCreateInput!) {
    issueBatchCreate(input: $input) {
      success
      issues {
        id
        identifier
        title
        url
      }
      lastSyncId
    }
  }
`;

export const UPDATE_ISSUE_MUTATION = gql`
  mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
    issueUpdate(id: $id, input: $input) {
      success
      issue {
        id
        identifier
        title
        url
        state {
          name
        }
      }
    }
  }
`;

export const UPDATE_ISSUES_MUTATION = gql`
  mutation UpdateIssues($ids: [String!]!, $input: IssueUpdateInput!) {
    issueUpdate(ids: $ids, input: $input) {
      success
      issues {
        id
        identifier
        title
        url
        state {
          name
        }
      }
    }
  }
`;

export const DELETE_ISSUE_MUTATION = gql`
  mutation DeleteIssue($id: String!) {
    issueDelete(id: $id) {
      success
    }
  }
`

export const DELETE_ISSUES_MUTATION = gql`
  mutation DeleteIssues($ids: [String!]!) {
    issueDelete(ids: $ids) {
      success
    }
  }
`;

export const CREATE_ISSUE_LABELS = gql`
  mutation CreateIssueLabels($labels: [IssueLabelCreateInput!]!) {
    issueLabelCreate(input: $labels) {
      success
      issueLabels {
        id
        name
        color
      }
    }
  }
`;

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($input: CommentCreateInput!) {
    commentCreate(input: $input) {
      ${COMMENT_MUTATION_PAYLOAD_FIELDS}
    }
  }
`;

export const UPDATE_COMMENT_MUTATION = gql`
  mutation UpdateComment($id: String!, $input: CommentUpdateInput!) {
    commentUpdate(id: $id, input: $input) {
      ${COMMENT_MUTATION_PAYLOAD_FIELDS}
    }
  }
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: String!) {
    commentDelete(id: $id) {
      success
      entityId
      lastSyncId
    }
  }
`;

export const RESOLVE_COMMENT_MUTATION = gql`
  mutation ResolveComment($id: String!, $resolvingCommentId: String) {
    commentResolve(id: $id, resolvingCommentId: $resolvingCommentId) {
      ${COMMENT_MUTATION_PAYLOAD_FIELDS}
    }
  }
`;

export const UNRESOLVE_COMMENT_MUTATION = gql`
  mutation UnresolveComment($id: String!) {
    commentUnresolve(id: $id) {
      ${COMMENT_MUTATION_PAYLOAD_FIELDS}
    }
  }
`;

export const CREATE_PROJECT_MILESTONE_MUTATION = gql`
  mutation CreateProjectMilestone($input: ProjectMilestoneCreateInput!) {
    projectMilestoneCreate(input: $input) {
      success
      projectMilestone {
        id
        name
        description
        documentContent {
          content
          contentState
        }
        targetDate
        status
        progress
        sortOrder
        project {
          id
          name
        }
        createdAt
        updatedAt
      }
      lastSyncId
    }
  }
`;

export const UPDATE_PROJECT_MILESTONE_MUTATION = gql`
  mutation UpdateProjectMilestone($id: String!, $input: ProjectMilestoneUpdateInput!) {
    projectMilestoneUpdate(id: $id, input: $input) {
      success
      projectMilestone {
        id
        name
        description
        documentContent {
          content
          contentState
        }
        targetDate
        status
        progress
        sortOrder
        project {
          id
          name
        }
        updatedAt
      }
      lastSyncId
    }
  }
`;

export const DELETE_PROJECT_MILESTONE_MUTATION = gql`
  mutation DeleteProjectMilestone($id: String!) {
    projectMilestoneDelete(id: $id) {
      success
      lastSyncId
    }
  }
`;
