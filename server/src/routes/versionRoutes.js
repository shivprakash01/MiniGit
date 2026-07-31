import express from 'express';
import { Version } from '../models/Version.js';
import { Page } from '../models/Page.js';
import { generateCommitHash } from '../git-engine/hash.js';
import { computeLineDiff, getDiffStats } from '../git-engine/myersDiff.js';
import { computeGitBlame } from '../git-engine/blame.js';
import { protect } from '../middleware/auth.js';
import { isMemoryMode, memoryStore, generateId } from '../config/memoryDb.js';

const router = express.Router();
router.use(protect);

// @route   POST /api/versions
router.post('/', async (req, res) => {
  try {
    const { pageId, branchName = 'main', content, message } = req.body;

    if (isMemoryMode()) {
      const page = memoryStore.pages.find(p => p._id === pageId);
      if (!page) return res.status(404).json({ message: 'Page not found' });

      const branchObj = page.branches.find(b => b.name === branchName);
      if (!branchObj) return res.status(400).json({ message: `Branch "${branchName}" does not exist` });

      const parentVersion = memoryStore.versions.find(v => v._id === branchObj.headVersionId);
      if (parentVersion && parentVersion.content === content) {
        return res.status(400).json({ message: 'No changes detected compared to branch HEAD' });
      }

      const parentIds = parentVersion ? [parentVersion._id] : [];
      const timestamp = Date.now();
      const commitMessage = message || `Update ${page.title} on branch ${branchName}`;
      const commitHash = generateCommitHash(content, parentIds, req.user._id, commitMessage, timestamp);
      const stats = getDiffStats(parentVersion ? parentVersion.content : '', content);

      const newVersion = {
        _id: `v_${generateId()}`,
        pageId,
        commitHash,
        parentIds,
        branchName,
        content,
        authorId: req.user,
        message: commitMessage,
        stats,
        createdAt: new Date(timestamp),
      };

      memoryStore.versions.push(newVersion);
      branchObj.headVersionId = newVersion._id;

      return res.status(201).json(newVersion);
    }

    const page = await Page.findById(pageId);
    if (!page) return res.status(404).json({ message: 'Page not found' });

    const branchObj = page.branches.find((b) => b.name === branchName);
    if (!branchObj) return res.status(400).json({ message: `Branch "${branchName}" does not exist` });

    const parentVersionId = branchObj.headVersionId;
    const parentVersion = await Version.findById(parentVersionId);

    if (parentVersion && parentVersion.content === content) {
      return res.status(400).json({ message: 'No changes detected compared to branch HEAD' });
    }

    const parentIds = parentVersionId ? [parentVersionId] : [];
    const timestamp = Date.now();
    const commitMessage = message || `Update ${page.title} on branch ${branchName}`;
    const commitHash = generateCommitHash(content, parentIds, req.user._id, commitMessage, timestamp);
    const stats = getDiffStats(parentVersion ? parentVersion.content : '', content);

    const newVersion = await Version.create({
      pageId,
      commitHash,
      parentIds,
      branchName,
      content,
      authorId: req.user._id,
      message: commitMessage,
      stats,
    });

    branchObj.headVersionId = newVersion._id;
    await page.save();

    const populatedVersion = await Version.findById(newVersion._id).populate('authorId', 'name email avatar');
    res.status(201).json(populatedVersion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/versions/page/:pageId
router.get('/page/:pageId', async (req, res) => {
  try {
    if (isMemoryMode()) {
      const versions = memoryStore.versions.filter(v => v.pageId === req.params.pageId);
      return res.json(versions);
    }

    const versions = await Version.find({ pageId: req.params.pageId })
      .populate('authorId', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(versions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/versions/compare/diff
router.get('/compare/diff', async (req, res) => {
  try {
    const { fromId, toId } = req.query;

    if (isMemoryMode()) {
      const fromVersion = fromId ? memoryStore.versions.find(v => v._id === fromId) : null;
      const toVersion = memoryStore.versions.find(v => v._id === toId);
      if (!toVersion) return res.status(404).json({ message: 'Target version not found' });

      const oldText = fromVersion ? fromVersion.content : '';
      const newText = toVersion.content;

      const diffLines = computeLineDiff(oldText, newText);
      const stats = getDiffStats(oldText, newText);

      return res.json({ fromVersion, toVersion, diffLines, stats });
    }

    const fromVersion = fromId ? await Version.findById(fromId).populate('authorId', 'name email avatar') : null;
    const toVersion = await Version.findById(toId).populate('authorId', 'name email avatar');
    if (!toVersion) return res.status(404).json({ message: 'Target version not found' });

    const oldText = fromVersion ? fromVersion.content : '';
    const newText = toVersion.content;

    const diffLines = computeLineDiff(oldText, newText);
    const stats = getDiffStats(oldText, newText);

    res.json({ fromVersion, toVersion, diffLines, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/versions/:id/blame
router.get('/:id/blame', async (req, res) => {
  try {
    if (isMemoryMode()) {
      const version = memoryStore.versions.find(v => v._id === req.params.id);
      if (!version) return res.status(404).json({ message: 'Version not found' });

      const lines = version.content.split(/\r?\n/);
      const blame = lines.map((line, index) => ({
        lineNumber: index + 1,
        content: line,
        authorName: version.authorId?.name || 'Author',
        authorEmail: version.authorId?.email || '',
        authorAvatar: version.authorId?.avatar || '',
        commitHash: version.commitHash,
        commitMessage: version.message,
        date: version.createdAt,
      }));
      return res.json(blame);
    }

    const version = await Version.findById(req.params.id).populate('authorId', 'name email avatar');
    if (!version) return res.status(404).json({ message: 'Version not found' });

    const blame = await computeGitBlame(version, Version);
    res.json(blame);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
