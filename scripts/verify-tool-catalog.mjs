import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAdvertisedToolSchemas } from '../build/core/types/tool.types.js';
import { getRuntimeCapabilities } from '../build/core/capabilities.js';
import {
  assert,
  buildProcessEnv,
  listToolsFromStdio,
  repoRoot,
  sortedToolNames,
} from './release-utils.mjs';

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
const serverPath = join(repoRoot, 'build', 'index.js');
const { tools } = await listToolsFromStdio({
  command: process.execPath,
  args: [serverPath],
  env: buildProcessEnv({
    LINEAR_MCP_TRANSPORT: 'stdio',
  }),
});

const actualNames = sortedToolNames(tools);
const expectedNames = sortedToolNames(
  getAdvertisedToolSchemas(getRuntimeCapabilities({ transport: 'stdio' }))
);

assert(
  JSON.stringify(actualNames) === JSON.stringify(expectedNames),
  `Built server tool catalog drifted from the expected stdio release catalog.\nExpected: ${expectedNames.join(', ')}\nActual: ${actualNames.join(', ')}`
);

for (const toolName of REQUIRED_RELEASED_TOOLS) {
  assert(actualNames.includes(toolName), `Built server is missing released tool ${toolName}.`);
  assert(readme.includes(toolName), `README release surface is missing ${toolName}.`);
}

assert(
  readme.includes('Version 1.0.0'),
  'README release surface notes must describe the current released workflow version.'
);

console.log('Built tool catalog matches the expected stdio release surface.');
