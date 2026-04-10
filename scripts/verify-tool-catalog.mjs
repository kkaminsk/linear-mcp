import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAdvertisedToolSchemas } from '../build/core/types/tool.types.js';
import { getRuntimeCapabilities } from '../build/core/capabilities.js';
import {
  assert,
  buildProcessEnv,
  callToolFromStdio,
  listToolsFromStdio,
  repoRoot,
  sortedToolNames,
} from './release-utils.mjs';

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => `${JSON.stringify(key)}:${stableStringify(nestedValue)}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
}

const REQUIRED_RELEASED_TOOLS = [
  'linear_bulk_update_issues',
  'linear_get_comment',
  'linear_list_comments',
  'linear_get_issue_comments',
  'linear_create_comment',
  'linear_update_comment',
  'linear_delete_comment',
  'linear_resolve_comment',
  'linear_unresolve_comment',
];

const readme = readFileSync(join(repoRoot, 'README.md'), 'utf8');
const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
const serverPath = join(repoRoot, 'build', 'index.js');
const expectedTools = getAdvertisedToolSchemas(getRuntimeCapabilities({ transport: 'stdio' }));
const { tools } = await listToolsFromStdio({
  command: process.execPath,
  args: [serverPath],
  env: buildProcessEnv({
    LINEAR_MCP_TRANSPORT: 'stdio',
  }),
});
const { result: capabilitiesResult } = await callToolFromStdio({
  command: process.execPath,
  args: [serverPath],
  env: buildProcessEnv({
    LINEAR_MCP_TRANSPORT: 'stdio',
  }),
  name: 'linear_get_capabilities',
});

const actualNames = sortedToolNames(tools);
const expectedNames = sortedToolNames(expectedTools);
const actualToolMap = new Map(tools.map(tool => [tool.name, tool]));
const expectedToolMap = new Map(expectedTools.map(tool => [tool.name, tool]));
const builtCapabilities = capabilitiesResult.structuredContent;

assert(
  JSON.stringify(actualNames) === JSON.stringify(expectedNames),
  `Built server tool catalog drifted from the expected stdio release catalog.\nExpected: ${expectedNames.join(', ')}\nActual: ${actualNames.join(', ')}`
);

for (const toolName of REQUIRED_RELEASED_TOOLS) {
  assert(actualNames.includes(toolName), `Built server is missing released tool ${toolName}.`);
  assert(readme.includes(toolName), `README release surface is missing ${toolName}.`);
}

for (const toolName of ['linear_create_issue', 'linear_create_issues']) {
  const actualTool = actualToolMap.get(toolName);
  const expectedTool = expectedToolMap.get(toolName);

  assert(actualTool, `Built server is missing ${toolName}.`);
  assert(expectedTool, `Expected release catalog is missing ${toolName}.`);
  assert(
    stableStringify(actualTool.inputSchema) === stableStringify(expectedTool.inputSchema),
    `Built server schema for ${toolName} drifted from the expected release schema.`
  );
  assert(readme.includes(toolName), `README release surface is missing ${toolName}.`);
}

const singleCreateTool = actualToolMap.get('linear_create_issue');
const batchCreateTool = actualToolMap.get('linear_create_issues');
const singleRequired = Array.isArray(singleCreateTool?.inputSchema?.required)
  ? singleCreateTool.inputSchema.required
  : [];
const batchRequired = Array.isArray(batchCreateTool?.inputSchema?.required)
  ? batchCreateTool.inputSchema.required
  : [];
const batchIssuesProperty = batchCreateTool?.inputSchema?.properties?.issues;

assert(
  singleRequired.includes('title') && singleRequired.includes('teamId'),
  'Built server must advertise linear_create_issue as a single-item create contract.'
);
assert(
  batchRequired.includes('issues')
    && batchIssuesProperty?.type === 'array'
    && batchIssuesProperty?.minItems === 1,
  'Built server must advertise linear_create_issues as the batch-create contract.'
);
assert(
  JSON.stringify(singleCreateTool?.inputSchema) !== JSON.stringify(batchCreateTool?.inputSchema),
  'Built server must keep single and batch issue-create schemas distinct.'
);

const searchTool = actualToolMap.get('linear_search_issues');
const searchRequired = Array.isArray(searchTool?.inputSchema?.required)
  ? searchTool.inputSchema.required
  : [];
const searchProperties = searchTool?.inputSchema?.properties ?? {};

assert(searchTool, 'Built server is missing linear_search_issues.');
assert(
  searchRequired.includes('query'),
  'Built server must advertise linear_search_issues as a query-backed search contract.'
);
assert(
  !Object.prototype.hasOwnProperty.call(searchProperties, 'filter'),
  'Built server must not advertise a generic filter object on linear_search_issues.'
);
assert(
  !Object.prototype.hasOwnProperty.call(searchProperties, 'orderBy'),
  'Built server must keep ranked issue search distinct from filter-first issue listing.'
);
assert(
  readme.includes('`linear_search_issues` is the free-text search path')
    && readme.includes('The search path sends `query` through Linear\'s search backend'),
  'README release surface must document query-backed issue search semantics.'
);

assert(
  readme.includes('Version 1.0.0'),
  'README release surface notes must describe the current released workflow version.'
);
assert(
  builtCapabilities?.server?.name === packageJson.name
    && builtCapabilities?.server?.version === packageJson.version,
  'Built server must report package-derived build provenance through linear_get_capabilities.'
);

console.log('Built tool catalog matches the expected stdio release surface.');
