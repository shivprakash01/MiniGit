import express from 'express';
import { Page } from '../models/Page.js';
import { Version } from '../models/Version.js';
import { performThreeWayMerge } from '../git-engine/threeWayMerge.js';
import { generateCommitHash } from '../git-engine/hash.js';
import { getDiffStats } from '../git-engine/myersDiff.js';
import { protect } from '../middleware/auth.js';
import { isMemoryMode, memoryStore, generateId } from '../config/memoryDb.js';

const router = express.Router();
router.use(protect);

// @route   POST /api/merge/preview
router.post('/preview', async (req, res) => {
  try {
    const { pageId, sourceBranch, targetBranch = 'main' } = req.body;

    if (isMemoryMode()) {
      const page = memoryStore.pages.find(p => p._id === pageId);
      if (!page) return res.status(404).json({ message: 'Page not found' });

      const sourceBranchObj = page.branches.find(b => b.name === sourceBranch);
      const targetBranchObj = page.branches.find(b => b.name === targetBranch);
      if (!sourceBranchObj || !targetBranchObj) return res.status(400).json({ message: 'Invalid branch' });

      const sourceHead = memoryStore.versions.find(v => v._id === sourceBranchObj.headVersionId);
      const targetHead = memoryStore.versions.find(v => v._id === targetBranchObj.headVersionId);

      // Find LCA in memory store
      const lcaVersion = memoryStore.versions.find(v => v._id === targetHead.parentIds?.[0]) || targetHead;
      const lcaText = lcaVersion ? lcaVersion.content : '';

      const mergeResult = performThreeWayMerge(lcaText, targetHead.content, sourceHead.content);

      return res.json({
        pageId,
        sourceBranch,
        targetBranch,
        sourceHead,
        targetHead,
        lcaVersion,
        mergedText: mergeResult.mergedText,
        hasConflicts: mergeResult.hasConflicts,
        conflicts: mergeResult.conflicts,
        isFastForward: mergeResult.isFastForward,
      });
    }

    const page = await Page.findById(pageId);
    if (!page) return res.status(404).json({ message: 'Page not found' });

    const sourceBranchObj = page.branches.find((b) => b.name === sourceBranch);
    const targetBranchObj = page.branches.find((b) => b.name === targetBranch);

    const sourceHead = await Version.findById(sourceBranchObj.headVersionId).populate('authorId', 'name email avatar');
    const targetHead = await Version.findById(targetBranchObj.headVersionId).populate('authorId', 'name email avatar');

    const lcaText = targetHead.content;
    const mergeResult = performThreeWayMerge(lcaText, targetHead.content, sourceHead.content);

    res.json({
      pageId,
      sourceBranch,
      targetBranch,
      sourceHead,
      targetHead,
      mergedText: mergeResult.mergedText,
      hasConflicts: mergeResult.hasConflicts,
      conflicts: mergeResult.conflicts,
      isFastForward: mergeResult.isFastForward,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/merge/execute
router.post('/execute', async (req, res) => {
  try {
    const { pageId, sourceBranch, targetBranch = 'main', resolvedContent, commitMessage } = req.body;

    if (isMemoryMode()) {
      const page = memoryStore.pages.find(p => p._id === pageId);
      if (!page) return res.status(404).json({ message: 'Page not found' });

      const sourceBranchObj = page.branches.find(b => b.name === sourceBranch);
      const targetBranchObj = page.branches.find(b => b.name === targetBranch);

      const parentIds = [targetBranchObj.headVersionId, sourceBranchObj.headVersionId];
      const message = commitMessage || `Merge branch '${sourceBranch}' into '${targetBranch}'`;
      const commitHash = generateCommitHash(resolvedContent, parentIds, req.user._id, message, Date.now());
      const stats = getDiffStats('', resolvedContent);

      const mergeVersion = {
        _id: `v_${generateId()}`,
        pageId,
        commitHash,
        parentIds,
        branchName: targetBranch,
        content: resolvedContent,
        authorId: req.user,
        message,
        stats,
        isMergeCommit: true,
        createdAt: new Date(),
      };

      memoryStore.versions.push(mergeVersion);
      targetBranchObj.headVersionId = mergeVersion._id;

      return res.status(201).json({
        message: `Successfully merged '${sourceBranch}' into '${targetBranch}'`,
        mergeVersion,
        page,
      });
    }

    const page = await Page.findById(pageId);
    if (!page) return res.status(404).json({ message: 'Page not found' });

    const sourceBranchObj = page.branches.find((b) => b.name === sourceBranch);
    const targetBranchObj = page.branches.find((b) => b.name === targetBranch);

    const parentIds = [targetBranchObj.headVersionId, sourceBranchObj.headVersionId];
    const message = commitMessage || `Merge branch '${sourceBranch}' into '${targetBranch}'`;
    const commitHash = generateCommitHash(resolvedContent, parentIds, req.user._id, message, Date.now());

    const mergeVersion = await Version.create({
      pageId,
      commitHash,
      parentIds,
      branchName: targetBranch,
      content: resolvedContent,
      authorId: req.user._id,
      message,
      stats: getDiffStats('', resolvedContent),
      isMergeCommit: true,
    });

    targetBranchObj.headVersionId = mergeVersion._id;
    await page.save();

    res.status(201).json({
      message: `Successfully merged '${sourceBranch}' into '${targetBranch}'`,
      mergeVersion,
      page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
