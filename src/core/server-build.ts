import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

interface PackageManifest {
  name?: string;
  version?: string;
}

export interface ServerBuildInfo {
  name: string;
  version: string;
  commitSha: string | null;
}

export interface ServerBuildInfoOptions {
  buildCommitSha?: string | null;
}

let cachedPackageManifest: Required<Pick<PackageManifest, 'name' | 'version'>> | null = null;
let cachedPackageManifestPath: string | null = null;

function getPackageManifestPath(): string {
  if (cachedPackageManifestPath) {
    return cachedPackageManifestPath;
  }

  const candidates = [
    process.argv[1]
      ? resolve(dirname(process.argv[1]), '..', 'package.json')
      : null,
    resolve(process.cwd(), 'package.json'),
  ];

  const manifestPath = candidates.find(
    (candidate): candidate is string => typeof candidate === 'string' && existsSync(candidate)
  );

  if (!manifestPath) {
    throw new Error('Unable to locate package.json for server build metadata.');
  }

  cachedPackageManifestPath = manifestPath;
  return manifestPath;
}

function getPackageManifest(): Required<Pick<PackageManifest, 'name' | 'version'>> {
  if (cachedPackageManifest) {
    return cachedPackageManifest;
  }

  const manifest = JSON.parse(readFileSync(getPackageManifestPath(), 'utf8')) as PackageManifest;

  if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
    throw new Error('package.json is missing a valid name for server build metadata.');
  }

  if (typeof manifest.version !== 'string' || manifest.version.length === 0) {
    throw new Error('package.json is missing a valid version for server build metadata.');
  }

  cachedPackageManifest = {
    name: manifest.name,
    version: manifest.version,
  };

  return cachedPackageManifest;
}

function resolveBuildCommit(buildCommitSha?: string | null): string | null {
  if (buildCommitSha !== undefined) {
    return typeof buildCommitSha === 'string' && buildCommitSha.length > 0
      ? buildCommitSha
      : null;
  }

  const envCommit = process.env.LINEAR_MCP_BUILD_SHA ?? process.env.GITHUB_SHA;

  return typeof envCommit === 'string' && envCommit.length > 0
    ? envCommit
    : null;
}

export function getServerBuildInfo(options: ServerBuildInfoOptions = {}): ServerBuildInfo {
  const manifest = getPackageManifest();

  return {
    name: manifest.name,
    version: manifest.version,
    commitSha: resolveBuildCommit(options.buildCommitSha),
  };
}

export function formatServerBuildInfo(buildInfo: ServerBuildInfo): string {
  return buildInfo.commitSha
    ? `${buildInfo.name}@${buildInfo.version} (commit ${buildInfo.commitSha})`
    : `${buildInfo.name}@${buildInfo.version}`;
}
