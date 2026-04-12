import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { guardedIssueWorkflowContracts } from './linear-api-contract-audit.mjs';
import { assert, repoRoot } from './release-utils.mjs';

function readRepoFile(relativePath) {
  return readFileSync(join(repoRoot, ...relativePath.split('/')), 'utf8');
}

for (const contract of guardedIssueWorkflowContracts) {
  const source = readRepoFile(contract.file);

  for (const snippet of contract.requiredSnippets) {
    assert(
      source.includes(snippet),
      `Linear API contract audit failed for ${contract.name}: expected ${contract.owner} to include ${JSON.stringify(snippet)} in ${contract.file}.`
    );
  }

  for (const snippet of contract.forbiddenSnippets) {
    assert(
      !source.includes(snippet),
      `Linear API contract audit failed for ${contract.name}: ${contract.owner} must not include ${JSON.stringify(snippet)} in ${contract.file}.`
    );
  }
}

const packageJson = JSON.parse(readRepoFile('package.json'));
const readme = readRepoFile('README.md');

assert(
  typeof packageJson.scripts?.['verify:linear-api-contracts'] === 'string',
  'package.json must expose npm run verify:linear-api-contracts.'
);
assert(
  typeof packageJson.scripts?.['verify:release'] === 'string'
    && packageJson.scripts['verify:release'].includes('verify:linear-api-contracts'),
  'verify:release must run the Linear API contract audit.'
);
assert(
  readme.includes('## Guarded issue workflow contracts')
    && readme.includes('`npm run verify:linear-api-contracts`'),
  'README must document the guarded issue workflow contract audit.'
);

console.log(`Linear API contract audit passed for ${guardedIssueWorkflowContracts.length} guarded issue workflow surfaces.`);
