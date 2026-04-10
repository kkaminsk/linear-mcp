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

async function withStdioClient({
  command,
  args = [],
  cwd = repoRoot,
  env,
}, callback) {
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
    const result = await callback(client);
    await new Promise(resolve => setTimeout(resolve, 50));
    return {
      result,
      stderr,
    };
  } finally {
    await client.close();
  }
}

export async function listToolsFromStdio(options) {
  const { result, stderr } = await withStdioClient(options, client => client.listTools());

  return {
    tools: result.tools,
    stderr,
  };
}

export async function callToolFromStdio({
  name,
  arguments: toolArguments = {},
  ...clientOptions
}) {
  const { result, stderr } = await withStdioClient(
    clientOptions,
    client => client.callTool({
      name,
      arguments: toolArguments,
    })
  );

  return {
    result,
    stderr,
  };
}
