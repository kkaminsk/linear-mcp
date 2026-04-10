import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  assert,
  buildProcessEnv,
  callToolFromStdio,
  listToolsFromStdio,
  repoRoot,
} from './release-utils.mjs';

function runNpm(args, options = {}) {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    return execFileSync(process.execPath, [npmExecPath, ...args], options);
  }

  const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return execFileSync(npmCommand, args, {
    ...options,
    shell: process.platform === 'win32',
  });
}

const packageJson = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
assert(packageJson.bin?.['linear-mcp'] === './build/index.js', 'package.json must publish the linear-mcp executable from build/index.js.');
assert(Array.isArray(packageJson.files) && packageJson.files.includes('build'), 'package.json must publish the build directory.');

const packOutput = runNpm(
  ['pack', '--json', '--ignore-scripts'],
  {
    cwd: repoRoot,
    encoding: 'utf8',
  }
);
const [{ filename }] = JSON.parse(packOutput);
const tarballPath = join(repoRoot, filename);
const tempDir = mkdtempSync(join(tmpdir(), 'linear-mcp-package-'));

try {
  runNpm(['init', '-y'], {
    cwd: tempDir,
    stdio: 'ignore',
  });
  runNpm(
    ['install', '--ignore-scripts', '--no-package-lock', '--prefer-offline', tarballPath],
    {
      cwd: tempDir,
      stdio: 'ignore',
    }
  );

  const installedBuild = join(tempDir, 'node_modules', packageJson.name, 'build', 'index.js');
  assert(existsSync(installedBuild), 'Fresh package install is missing build/index.js.');

  const { tools, stderr } = await listToolsFromStdio({
    command: process.execPath,
    args: [installedBuild],
    cwd: tempDir,
    env: buildProcessEnv({
      LINEAR_MCP_TRANSPORT: 'stdio',
    }),
  });
  const { result: capabilitiesResult } = await callToolFromStdio({
    command: process.execPath,
    args: [installedBuild],
    cwd: tempDir,
    env: buildProcessEnv({
      LINEAR_MCP_TRANSPORT: 'stdio',
    }),
    name: 'linear_get_capabilities',
  });

  assert(tools.length > 0, 'Fresh package install did not return any tools.');
  assert(
    stderr.includes('Auth:'),
    'Packaged startup must emit auth/setup diagnostics separately from install failures.'
  );
  assert(
    stderr.includes(`Build: ${packageJson.name}@${packageJson.version}`),
    'Packaged startup must emit package-derived build provenance diagnostics.'
  );
  assert(
    capabilitiesResult.structuredContent?.server?.name === packageJson.name
      && capabilitiesResult.structuredContent?.server?.version === packageJson.version,
    'Fresh package install must report package-derived build provenance through linear_get_capabilities.'
  );

  console.log('Fresh package install boots and lists MCP tools.');
} finally {
  if (existsSync(tarballPath)) {
    unlinkSync(tarballPath);
  }
  rmSync(tempDir, { recursive: true, force: true });
}
