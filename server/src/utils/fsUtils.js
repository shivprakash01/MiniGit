import fs from 'fs/promises';
import path from 'path';

// Root directory for storing repositories on local filesystem
export const REPOS_ROOT = path.resolve('repositories');

/**
 * Get base directory path for a specific repository
 */
export function getRepoPath(repoId) {
  return path.join(REPOS_ROOT, repoId.toString());
}

/**
 * Get .minigit directory path for a specific repository
 */
export function getMiniGitPath(repoId) {
  return path.join(getRepoPath(repoId), '.minigit');
}

/**
 * Initialize repository folder structure (.minigit, objects, commits, HEAD, index.json)
 */
export async function initRepoFileSystem(repoId) {
  const repoPath = getRepoPath(repoId);
  const minigitPath = getMiniGitPath(repoId);
  const objectsPath = path.join(minigitPath, 'objects');
  const commitsPath = path.join(minigitPath, 'commits');
  const headPath = path.join(minigitPath, 'HEAD');
  const indexPath = path.join(minigitPath, 'index.json');

  await fs.mkdir(repoPath, { recursive: true });
  await fs.mkdir(minigitPath, { recursive: true });
  await fs.mkdir(objectsPath, { recursive: true });
  await fs.mkdir(commitsPath, { recursive: true });

  // Initialize empty HEAD and empty index.json
  await fs.writeFile(headPath, '', 'utf-8');
  await fs.writeFile(indexPath, JSON.stringify({}), 'utf-8');

  return { repoPath, minigitPath };
}

/**
 * Write a file content object to .minigit/objects/<hash>
 */
export async function writeObject(repoId, hash, content) {
  const objectsPath = path.join(getMiniGitPath(repoId), 'objects');
  await fs.mkdir(objectsPath, { recursive: true });
  const objectFile = path.join(objectsPath, hash);
  await fs.writeFile(objectFile, content, 'utf-8');
}

/**
 * Read object content from .minigit/objects/<hash>
 */
export async function readObject(repoId, hash) {
  const objectFile = path.join(getMiniGitPath(repoId), 'objects', hash);
  try {
    return await fs.readFile(objectFile, 'utf-8');
  } catch (error) {
    return null;
  }
}

/**
 * Save commit JSON file to .minigit/commits/<commitId>.json
 */
export async function writeCommitFile(repoId, commitId, commitData) {
  const commitsPath = path.join(getMiniGitPath(repoId), 'commits');
  await fs.mkdir(commitsPath, { recursive: true });
  const commitFile = path.join(commitsPath, `${commitId}.json`);
  await fs.writeFile(commitFile, JSON.stringify(commitData, null, 2), 'utf-8');
}

/**
 * Read commit JSON file from .minigit/commits/<commitId>.json
 */
export async function readCommitFile(repoId, commitId) {
  const commitFile = path.join(getMiniGitPath(repoId), 'commits', `${commitId}.json`);
  try {
    const raw = await fs.readFile(commitFile, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

/**
 * Read .minigit/index.json
 */
export async function readIndex(repoId) {
  const indexPath = path.join(getMiniGitPath(repoId), 'index.json');
  try {
    const raw = await fs.readFile(indexPath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

/**
 * Write .minigit/index.json
 */
export async function writeIndex(repoId, indexData) {
  const indexPath = path.join(getMiniGitPath(repoId), 'index.json');
  await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
}

/**
 * Read .minigit/HEAD
 */
export async function readHEAD(repoId) {
  const headPath = path.join(getMiniGitPath(repoId), 'HEAD');
  try {
    const content = await fs.readFile(headPath, 'utf-8');
    return content.trim() || null;
  } catch (error) {
    return null;
  }
}

/**
 * Write .minigit/HEAD
 */
export async function writeHEAD(repoId, commitId) {
  const headPath = path.join(getMiniGitPath(repoId), 'HEAD');
  await fs.writeFile(headPath, commitId || '', 'utf-8');
}

/**
 * Save/update a file in the working directory
 */
export async function writeWorkingFile(repoId, filename, content) {
  const repoPath = getRepoPath(repoId);
  const filePath = path.join(repoPath, filename);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * Read a file from working directory
 */
export async function readWorkingFile(repoId, filename) {
  const filePath = path.join(getRepoPath(repoId), filename);
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

/**
 * List all non-.minigit files in working directory
 */
export async function listWorkingFiles(repoId) {
  const repoPath = getRepoPath(repoId);
  const result = [];

  async function scanDir(dir, relativeDir = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '.minigit') continue;
        const relPath = relativeDir ? path.join(relativeDir, entry.name).replace(/\\/g, '/') : entry.name;
        if (entry.isDirectory()) {
          await scanDir(path.join(dir, entry.name), relPath);
        } else {
          result.push(relPath);
        }
      }
    } catch (e) {
      // dir doesn't exist yet
    }
  }

  await scanDir(repoPath);
  return result;
}

/**
 * Clean working directory (remove files except .minigit) for checkout restoration
 */
export async function cleanWorkingDir(repoId) {
  const repoPath = getRepoPath(repoId);
  try {
    const entries = await fs.readdir(repoPath);
    for (const entry of entries) {
      if (entry === '.minigit') continue;
      await fs.rm(path.join(repoPath, entry), { recursive: true, force: true });
    }
  } catch (e) {}
}
