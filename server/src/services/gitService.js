import Repository from '../models/Repository.js';
import Commit from '../models/Commit.js';
import Stage from '../models/Stage.js';
import { generateSHA256 } from '../utils/cryptoUtils.js';
import {
  initRepoFileSystem,
  writeObject,
  readObject,
  writeCommitFile,
  readCommitFile,
  readIndex,
  writeIndex,
  readHEAD,
  writeHEAD,
  writeWorkingFile,
  readWorkingFile,
  listWorkingFiles,
  cleanWorkingDir
} from '../utils/fsUtils.js';

export const gitService = {
  /**
   * 1. INIT: Create new repository in MongoDB and setup .minigit directory structure
   */
  async initRepo({ name, description }) {
    if (!name || !name.trim()) {
      throw new Error('Repository name is required');
    }

    const existing = await Repository.findOne({ name: name.trim() });
    if (existing) {
      throw new Error(`Repository with name "${name}" already exists`);
    }

    // Save in MongoDB
    const repo = await Repository.create({
      name: name.trim(),
      description: description || ''
    });

    // Create .minigit directory structure
    await initRepoFileSystem(repo._id);

    return {
      success: true,
      repository: repo.name,
      repoId: repo._id,
      repo
    };
  },

  /**
   * 2. ADD: Stage a file by saving content as SHA-256 object and updating index.json & MongoDB Stage
   */
  async addFile(repoId, { filename, content }) {
    if (!filename || !filename.trim()) {
      throw new Error('Filename is required');
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      throw new Error('Repository not found');
    }

    let fileContent = content;

    // If content not explicitly provided in body, read from working directory
    if (fileContent === undefined || fileContent === null) {
      fileContent = await readWorkingFile(repoId, filename);
      if (fileContent === null) {
        throw new Error(`File "${filename}" not found in working directory`);
      }
    } else {
      // Save content to working directory file first
      await writeWorkingFile(repoId, filename, fileContent);
    }

    // Generate SHA-256 hash
    const hash = generateSHA256(fileContent);

    // Save object content inside .minigit/objects/<hash>
    await writeObject(repoId, hash, fileContent);

    // Update .minigit/index.json
    const indexData = await readIndex(repoId);
    indexData[filename] = hash;
    await writeIndex(repoId, indexData);

    // Upsert staging record in MongoDB Stage Collection
    await Stage.findOneAndUpdate(
      { repositoryId: repoId, filename },
      { hash },
      { upsert: true, new: true }
    );

    return {
      status: 'staged',
      filename,
      hash
    };
  },

  /**
   * 3. STATUS: Compare Working Directory, Staging Index, and Last Commit (HEAD)
   */
  async getStatus(repoId) {
    const repo = await Repository.findById(repoId);
    if (!repo) {
      throw new Error('Repository not found');
    }

    const workingFiles = await listWorkingFiles(repoId);
    const indexData = await readIndex(repoId); // { filename: hash }
    const headCommitId = await readHEAD(repoId);

    // Get last commit file snapshot map { [filename]: hash }
    let headFilesMap = {};
    if (headCommitId) {
      const headCommit = await readCommitFile(repoId, headCommitId);
      if (headCommit && Array.isArray(headCommit.files)) {
        headCommit.files.forEach(f => {
          headFilesMap[f.filename] = f.hash;
        });
      }
    }

    const staged = [];
    const modified = [];
    const untracked = [];

    // Calculate current hash for working directory files
    const workingFileHashes = {};
    for (const filename of workingFiles) {
      const content = await readWorkingFile(repoId, filename);
      workingFileHashes[filename] = generateSHA256(content);
    }

    // Identify Staged & Untracked files
    const allKnownFiles = new Set([
      ...workingFiles,
      ...Object.keys(indexData),
      ...Object.keys(headFilesMap)
    ]);

    for (const filename of allKnownFiles) {
      const isWork = filename in workingFileHashes;
      const isStaged = filename in indexData;
      const isHead = filename in headFilesMap;

      const workHash = workingFileHashes[filename];
      const stagedHash = indexData[filename];
      const headHash = headFilesMap[filename];

      if (isStaged) {
        // If staged hash differs from HEAD hash (or not present in HEAD), it's staged
        if (!isHead || stagedHash !== headHash) {
          staged.push({ filename, hash: stagedHash });
        }

        // If working directory file exists and differs from staged hash, it's modified
        if (isWork && workHash !== stagedHash) {
          modified.push({ filename, currentHash: workHash, stagedHash });
        }
      } else if (isWork) {
        if (isHead) {
          // Unstaged but modified from HEAD
          if (workHash !== headHash) {
            modified.push({ filename, currentHash: workHash, headHash });
          }
        } else {
          // File is untracked (neither staged nor committed)
          untracked.push(filename);
        }
      }
    }

    return {
      staged,
      modified,
      untracked,
      headCommitId
    };
  },

  /**
   * 4. COMMIT: Create commit from staging area, update HEAD, save snapshot & DB record
   */
  async createCommit(repoId, { message }) {
    if (!message || !message.trim()) {
      throw new Error('Commit message is required');
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      throw new Error('Repository not found');
    }

    const indexData = await readIndex(repoId); // { filename: hash }
    const stagedEntries = Object.entries(indexData);

    if (stagedEntries.length === 0) {
      throw new Error('Nothing to commit (staging area index is empty)');
    }

    const parentCommit = await readHEAD(repoId);
    const timestamp = new Date();

    // Snapshot of staged files
    const filesSnapshot = stagedEntries.map(([filename, hash]) => ({
      filename,
      hash
    }));

    // Generate unique Commit ID (SHA-256 of timestamp + message + files JSON)
    const commitIdRaw = `${timestamp.toISOString()}:${parentCommit || 'ROOT'}:${message}:${JSON.stringify(filesSnapshot)}`;
    const commitId = generateSHA256(commitIdRaw).substring(0, 12);

    const commitData = {
      repositoryId: repoId,
      commitId,
      parentCommit: parentCommit || null,
      message: message.trim(),
      timestamp,
      files: filesSnapshot
    };

    // Save commit JSON in .minigit/commits/<commitId>.json
    await writeCommitFile(repoId, commitId, commitData);

    // Update .minigit/HEAD with new commitId
    await writeHEAD(repoId, commitId);

    // Clear .minigit/index.json and MongoDB Stage Collection
    await writeIndex(repoId, {});
    await Stage.deleteMany({ repositoryId: repoId });

    // Store commit metadata in MongoDB Commit Collection
    const commitDoc = await Commit.create(commitData);

    return {
      commitId,
      parentCommit: commitDoc.parentCommit,
      message: commitDoc.message,
      timestamp: commitDoc.timestamp,
      files: commitDoc.files
    };
  },

  /**
   * 5. LOG: Display complete commit history, latest first
   */
  async getLog(repoId) {
    const repo = await Repository.findById(repoId);
    if (!repo) {
      throw new Error('Repository not found');
    }

    const commits = await Commit.find({ repositoryId: repoId })
      .sort({ timestamp: -1 })
      .lean();

    return commits.map(c => ({
      commitId: c.commitId,
      parentCommit: c.parentCommit,
      message: c.message,
      timestamp: c.timestamp,
      files: c.files
    }));
  },

  /**
   * 6. CHECKOUT: Switch repository working directory back to any previous commit snapshot
   */
  async checkoutCommit(repoId, { commitId }) {
    if (!commitId) {
      throw new Error('Commit ID is required for checkout');
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      throw new Error('Repository not found');
    }

    // Try reading commit from filesystem first, or MongoDB fallback
    let commitData = await readCommitFile(repoId, commitId);
    if (!commitData) {
      const commitDoc = await Commit.findOne({ repositoryId: repoId, commitId });
      if (!commitDoc) {
        throw new Error(`Commit ID "${commitId}" not found`);
      }
      commitData = commitDoc;
    }

    // Clean working directory
    await cleanWorkingDir(repoId);

    // Restore files from snapshot (reading content from .minigit/objects/<hash>)
    for (const fileObj of commitData.files) {
      const content = await readObject(repoId, fileObj.hash);
      if (content !== null) {
        await writeWorkingFile(repoId, fileObj.filename, content);
      }
    }

    // Reset staging index & MongoDB Stage collection
    await writeIndex(repoId, {});
    await Stage.deleteMany({ repositoryId: repoId });

    // Update .minigit/HEAD to point to this checked-out commit
    await writeHEAD(repoId, commitId);

    return {
      success: true,
      message: `Checked out commit ${commitId}`,
      commitId,
      restoredFiles: commitData.files
    };
  }
};
