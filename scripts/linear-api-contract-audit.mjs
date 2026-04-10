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
    name: 'issue search handler ownership',
    owner: 'IssueHandler.handleSearchIssues query-aware MCP path',
    file: 'src/features/issues/handlers/issue.handler.ts',
    requiredSnippets: [
      'const payload = await client.searchIssues(args.query, searchOptions);',
    ],
    forbiddenSnippets: [
      'SEARCH_ISSUES_QUERY',
      'searchIssuesRaw(',
    ],
  },
  {
    name: 'issue search client ownership',
    owner: 'LinearGraphQLClient.searchIssues SDK path',
    file: 'src/graphql/client.ts',
    requiredSnippets: [
      'async searchIssues(',
      "const payload = await this.executeSdk(",
      '() => this.linearClient.searchIssues(query, searchOptions)',
    ],
    forbiddenSnippets: [
      'searchIssuesRaw(',
      'SEARCH_ISSUES_QUERY',
    ],
  },
  {
    name: 'issue search query exports',
    owner: 'No raw issue search GraphQL document',
    file: 'src/graphql/queries.ts',
    requiredSnippets: [],
    forbiddenSnippets: [
      'SEARCH_ISSUES_QUERY',
      'query SearchIssues(',
    ],
  },
];
