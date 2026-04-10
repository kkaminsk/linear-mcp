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

export const GET_TEAMS_QUERY = gql`
  query GetTeams {
    teams {
      nodes {
        id
        name
        key
        description
        states {
          nodes {
            id
            name
            type
            color
          }
        }
        labels {
          nodes {
            id
            name
            color
          }
        }
      }
    }
  }
`;

export const GET_USER_QUERY = gql`
  query GetUser {
    viewer {
      id
      name
      email
      teams {
        nodes {
          id
          name
          key
        }
      }
    }
  }
`;

export const SEARCH_PROJECTS_QUERY = gql`
  query SearchProjects($filter: ProjectFilter) {
    projects(filter: $filter) {
      nodes {
        id
        name
        description
        documentContent {
          content
          contentState
        }
        url
        teams {
          nodes {
            id
            name
          }
        }
      }
    }
  }
`;

export const GET_PROJECT_QUERY = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      description
      documentContent {
        content
        contentState
      }
      url
      teams {
        nodes {
          id
          name
        }
      }
    }
  }
`;

export const GET_COMMENT_QUERY = gql`
  query GetComment($id: String!) {
    comment(id: $id) {
      ${COMMENT_FIELDS}
    }
  }
`;

export const LIST_COMMENTS_QUERY = gql`
  query ListComments(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $filter: CommentFilter
    $includeArchived: Boolean
    $orderBy: PaginationOrderBy
  ) {
    comments(
      first: $first
      after: $after
      last: $last
      before: $before
      filter: $filter
      includeArchived: $includeArchived
      orderBy: $orderBy
    ) {
      pageInfo {
        hasNextPage
        endCursor
        hasPreviousPage
        startCursor
      }
      nodes {
        ${COMMENT_FIELDS}
      }
    }
  }
`;

export const GET_ISSUE_COMMENTS_QUERY = gql`
  query GetIssueComments(
    $issueId: String!
    $first: Int
    $after: String
    $last: Int
    $before: String
    $filter: CommentFilter
    $includeArchived: Boolean
    $orderBy: PaginationOrderBy
  ) {
    issue(id: $issueId) {
      id
      identifier
      title
      url
      comments(
        first: $first
        after: $after
        last: $last
        before: $before
        filter: $filter
        includeArchived: $includeArchived
        orderBy: $orderBy
      ) {
        pageInfo {
          hasNextPage
          endCursor
          hasPreviousPage
          startCursor
        }
        nodes {
          ${COMMENT_FIELDS}
        }
      }
    }
  }
`;

export const SEARCH_ISSUES_QUERY = gql`
  query SearchIssues(
    $term: String!
    $filter: IssueFilter
    $first: Int
    $after: String
    $includeArchived: Boolean
    $orderBy: PaginationOrderBy
  ) {
    searchIssues(
      term: $term
      filter: $filter
      first: $first
      after: $after
      includeArchived: $includeArchived
      orderBy: $orderBy
    ) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        identifier
        title
        description
        url
        priority
        estimate
        dueDate
        createdAt
        updatedAt
      }
    }
  }
`;

export const SEARCH_PROJECT_MILESTONES_QUERY = gql`
  query SearchProjectMilestones(
    $filter: ProjectMilestoneFilter
    $first: Int
    $after: String
    $orderBy: PaginationOrderBy
  ) {
    projectMilestones(
      filter: $filter
      first: $first
      after: $after
      orderBy: $orderBy
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
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
        issues(first: 10) {
          pageInfo {
            hasNextPage
            endCursor
          }
          nodes {
            id
            identifier
            title
            url
          }
        }
        archivedAt
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_PROJECT_MILESTONE_QUERY = gql`
  query GetProjectMilestone($id: String!) {
    projectMilestone(id: $id) {
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
      issues(first: 50) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          identifier
          title
          url
        }
      }
      archivedAt
      createdAt
      updatedAt
    }
  }
`;
