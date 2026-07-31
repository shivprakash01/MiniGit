import express from 'express';
import { Page } from '../models/Page.js';
import { Version } from '../models/Version.js';
import { generateCommitHash } from '../git-engine/hash.js';
import { getDiffStats } from '../git-engine/myersDiff.js';
import { protect } from '../middleware/auth.js';
import { isMemoryMode, memoryStore, generateId } from '../config/memoryDb.js';

const router = express.Router();
router.use(protect);

// @route   GET /api/pages
router.get('/', async (req, res) => {
  try {
    if (isMemoryMode()) {
      return res.json(memoryStore.pages);
    }
    const pages = await Page.find().sort({ updatedAt: -1 }).populate('createdBy', 'name email avatar');
    res.json(pages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/pages
router.post('/', async (req, res) => {
  try {
    const { title, category, description, initialContent } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const content = initialContent || `# ${title}\n\nWelcome to your version-controlled Markdown page!`;

    if (isMemoryMode()) {
      const pageId = `page_${generateId()}`;
      const initialHash = generateCommitHash(content, [], req.user._id, 'Initial commit', Date.now());
      const stats = getDiffStats('', content);

      const initialVersion = {
        _id: `v_${generateId()}`,
        pageId,
        commitHash: initialHash,
        parentIds: [],
        branchName: 'main',
        content,
        authorId: req.user,
        message: `Initial commit: ${title}`,
        stats,
        createdAt: new Date(),
      };
      memoryStore.versions.push(initialVersion);

      const newPage = {
        _id: pageId,
        title,
        slug,
        category: category || 'General',
        description: description || '',
        createdBy: req.user,
        defaultBranch: 'main',
        protectedBranches: ['main'],
        branches: [{ name: 'main', headVersionId: initialVersion._id }],
        createdAt: new Date(),
      };
      memoryStore.pages.push(newPage);

      memoryStore.auditLogs.push({
        _id: `log_${generateId()}`,
        actorId: req.user._id,
        actorName: req.user.name,
        action: 'CREATE_PAGE',
        details: `Created new Wiki page "${title}"`,
        pageId: newPage._id,
        createdAt: new Date(),
      });

      return res.status(201).json({ page: newPage, initialVersion });
    }

    const existingPage = await Page.findOne({ slug });
    if (existingPage) return res.status(400).json({ message: 'A page with a similar title already exists' });

    const page = new Page({
      title,
      slug,
      category: category || 'General',
      description: description || '',
      createdBy: req.user._id,
      defaultBranch: 'main',
      protectedBranches: ['main'],
    });

    const initialHash = generateCommitHash(content, [], req.user._id, 'Initial commit', Date.now());
    const stats = getDiffStats('', content);

    const initialVersion = await Version.create({
      pageId: page._id,
      commitHash: initialHash,
      parentIds: [],
      branchName: 'main',
      content,
      authorId: req.user._id,
      message: `Initial commit: ${title}`,
      stats,
    });

    page.branches = [{ name: 'main', headVersionId: initialVersion._id }];
    await page.save();

    res.status(201).json({ page, initialVersion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/pages/:id
router.get('/:id', async (req, res) => {
  try {
    if (isMemoryMode()) {
      const page = memoryStore.pages.find(p => p._id === req.params.id);
      if (!page) return res.status(404).json({ message: 'Page not found' });
      return res.json(page);
    }

    const page = await Page.findById(req.params.id)
      .populate('createdBy', 'name email avatar')
      .populate('branches.headVersionId');
    if (!page) return res.status(404).json({ message: 'Page not found' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/pages/:id/branches
router.post('/:id/branches', async (req, res) => {
  try {
    const { branchName, sourceBranch = 'main' } = req.body;
    const cleanBranchName = branchName.trim().toLowerCase().replace(/[^a-z0-9-/]+/g, '-');

    if (isMemoryMode()) {
      const page = memoryStore.pages.find(p => p._id === req.params.id);
      if (!page) return res.status(404).json({ message: 'Page not found' });
      if (page.branches.some(b => b.name === cleanBranchName)) {
        return res.status(400).json({ message: `Branch "${cleanBranchName}" already exists` });
      }

      const sourceBranchObj = page.branches.find(b => b.name === sourceBranch);
      if (!sourceBranchObj) return res.status(400).json({ message: `Source branch "${sourceBranch}" not found` });

      page.branches.push({ name: cleanBranchName, headVersionId: sourceBranchObj.headVersionId, createdAt: new Date() });
      return res.status(201).json(page);
    }

    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ message: 'Page not found' });

    if (page.branches.some((b) => b.name === cleanBranchName)) {
      return res.status(400).json({ message: `Branch "${cleanBranchName}" already exists` });
    }

    const sourceBranchObj = page.branches.find((b) => b.name === sourceBranch);
    if (!sourceBranchObj) return res.status(400).json({ message: `Source branch "${sourceBranch}" not found` });

    page.branches.push({ name: cleanBranchName, headVersionId: sourceBranchObj.headVersionId });
    await page.save();

    res.status(201).json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
