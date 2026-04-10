export const guardedIssueWorkflowContracts = [
  {
    name: 'single-create GraphQL document',
    owner: 'LinearGraphQLClient.createIssue raw GraphQL helper',
    file: 'src/graphql/mutations.ts',
    requiredSnippets: [
      'mutation CreateIssue($input: IssueCreateInput!)',
      'issueCreate(input: $input)',
    ],
    forbiddenSnippets: [
      '$input: [IssueCreateInput!]!',
    ],
  },
  {
    name: 'single-create helper',
    owner: 'LinearGraphQLClient.createIssue',
    file: 'src/graphql/client.ts',
    requiredSnippets: [
      'async createIssue(input: CreateIssueInput): Promise<CreateIssueResponse>',
      "const { CREATE_ISSUE_MUTATION } = await import('./mutations.js');",
      'return this.executeData<CreateIssueResponse>(CREATE_ISSUE_MUTATION, { input });',
    ],
    forbiddenSnippets: [],
  },
  {
    name: 'single-create MCP tool',
    owner: 'IssueHandler.handleCreateIssue SDK path',
    file: 'src/features/issues/handlers/issue.handler.ts',
    requiredSnippets: [
      "'createIssue'",
      '() => client.sdk.createIssue(args)',
    ],
    forbiddenSnippets: [
      'client.createIssue(args)',
    ],
  },
  {
    name: 'batch-create GraphQL document',
    owner: 'LinearGraphQLClient.createIssues raw GraphQL helper',
    file: 'src/graphql/mutations.ts',
    requiredSnippets: [
      'mutation CreateBatchIssues($input: IssueBatchCreateInput!)',
      'issueBatchCreate(input: $input)',
    ],
    forbiddenSnippets: [
      '$input: [IssueCreateInput!]!',
    ],
  },
  {
    name: 'batch-create helper',
    owner: 'LinearGraphQLClient.createIssues',
    file: 'src/graphql/client.ts',
    requiredSnippets: [
      'async createIssues(issues: CreateIssueInput[]): Promise<IssueBatchResponse>',
      "const { CREATE_BATCH_ISSUES } = await import('./mutations.js');",
      'input: { issues }',
    ],
    forbiddenSnippets: [],
  },
  {
    name: 'batch-create MCP tool',
    owner: 'IssueHandler.handleCreateIssues SDK path',
    file: 'src/features/issues/handlers/issue.handler.ts',
    requiredSnippets: [
      "'createIssueBatch'",
      '() => client.sdk.createIssueBatch({ issues: args.issues })',
    ],
    forbiddenSnippets: [
      'client.createIssues(args.issues)',
    ],
  },
  {
    name: 'bulk-delete GraphQL document',
    owner: 'LinearGraphQLClient.deleteIssues raw GraphQL helper',
    file: 'src/graphql/mutations.ts',
    requiredSnippets: [
      'mutation DeleteIssues($ids: [String!]!)',
      'issueDelete(ids: $ids)',
    ],
    forbiddenSnippets: [],
  },
  {
    name: 'bulk-delete helper',
    owner: 'LinearGraphQLClient.deleteIssues',
    file: 'src/graphql/client.ts',
    requiredSnippets: [
      'async deleteIssues(ids: string[]): Promise<DeleteIssuesResponse>',
      "const { DELETE_ISSUES_MUTATION } = await import('./mutations.js');",
      'return this.executeData<DeleteIssuesResponse>(DELETE_ISSUES_MUTATION, { ids });',
    ],
    forbiddenSnippets: [],
  },
  {
    name: 'issue search handler ownership',
    owner: 'IssueHandler.handleSearchIssues query-aware MCP path',
    file: 'src/features/issues/handlers/issue.handler.ts',
    requiredSnippets: [
      'const payload = await client.searchIssues(args.query, searchOptions);',
    ],
    forbiddenSnippets: [
      'SEARCH_ISSUES_QUERY',
    ],
  },
  {
    name: 'issue search client ownership',
    owner: 'LinearGraphQLClient.searchIssues raw GraphQL path',
    file: 'src/graphql/client.ts',
    requiredSnippets: [
      'async searchIssues(',
      "const { SEARCH_ISSUES_QUERY } = await import('./queries.js');",
      'term: query',
    ],
    forbiddenSnippets: [
      'this.linearClient.searchIssues(',
    ],
  },
  {
    name: 'issue search query document',
    owner: 'Raw issue search GraphQL document',
    file: 'src/graphql/queries.ts',
    requiredSnippets: [
      'SEARCH_ISSUES_QUERY',
      'query SearchIssues(',
      '$term: String!',
      '$filter: IssueFilter',
    ],
    forbiddenSnippets: [],
  },
];
