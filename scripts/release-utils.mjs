import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

export function buildProcessEnv(extra = {}) {
  const merged = {
    ...process.env,
    ...extra,
  };

  return Object.fromEntries(
    Object.entries(merged).filter(([, value]) => typeof value === 'string' && value.length > 0)
  );
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function sortedToolNames(tools) {
  return [...tools].map(tool => tool.name).sort();
}

export async function listToolsFromStdio({
  command,
  args = [],
  cwd = repoRoot,
  env,
}) {
  const transport = new StdioClientTransport({
    command,
    args,
    cwd,
    env,
    stderr: 'pipe',
  });
  let stderr = '';
  transport.stderr?.on('data', chunk => {
    stderr += chunk.toString();
  });

  const client = new Client(
    {
      name: 'linear-release-smoke',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);

  try {
    const result = await client.listTools();
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      tools: result.tools,
      stderr,
    };
  } finally {
    await client.close();
  }
}
