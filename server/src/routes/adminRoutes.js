import express from 'express';
import { User } from '../models/User.js';
import { Page } from '../models/Page.js';
import { Version } from '../models/Version.js';
import { MergeRequest, AuditLog } from '../models/MergeRequest.js';
import { protect, requireAdmin } from '../middleware/auth.js';
import { isMemoryMode, memoryStore } from '../config/memoryDb.js';

const router = express.Router();
router.use(protect, requireAdmin);

// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    if (isMemoryMode()) {
      return res.json(memoryStore.users.map(({ password, ...u }) => u));
    }
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;

    if (isMemoryMode()) {
      const user = memoryStore.users.find(u => u._id === req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      user.role = role;
      return res.json({ message: `Updated ${user.name} to ${role}`, user });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.role = role;
    await user.save();

    res.json({ message: `Updated ${user.name} to ${role}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    if (isMemoryMode()) {
      return res.json({
        totalUsers: memoryStore.users.length,
        totalEmployees: memoryStore.users.filter(u => u.role === 'employee').length,
        totalPages: memoryStore.pages.length,
        totalCommits: memoryStore.versions.length,
        totalBranches: memoryStore.pages.reduce((acc, p) => acc + (p.branches?.length || 1), 0),
        totalMergeRequests: memoryStore.mergeRequests.length,
        openMergeRequests: memoryStore.mergeRequests.filter(m => m.status === 'open').length,
      });
    }

    const totalUsers = await User.countDocuments();
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalPages = await Page.countDocuments();
    const totalCommits = await Version.countDocuments();
    const totalMergeRequests = await MergeRequest.countDocuments();
    const openMergeRequests = await MergeRequest.countDocuments({ status: 'open' });

    const pages = await Page.find({}, 'branches');
    let totalBranches = 0;
    pages.forEach((p) => {
      totalBranches += p.branches ? p.branches.length : 1;
    });

    res.json({
      totalUsers,
      totalEmployees,
      totalPages,
      totalCommits,
      totalBranches,
      totalMergeRequests,
      openMergeRequests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/audit-logs
router.get('/audit-logs', async (req, res) => {
  try {
    if (isMemoryMode()) {
      return res.json(memoryStore.auditLogs);
    }
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PATCH /api/admin/pages/:pageId/protection
router.patch('/pages/:pageId/protection', async (req, res) => {
  try {
    const { protectedBranches } = req.body;

    if (isMemoryMode()) {
      const page = memoryStore.pages.find(p => p._id === req.params.pageId);
      if (!page) return res.status(404).json({ message: 'Page not found' });
      page.protectedBranches = protectedBranches || ['main'];
      return res.json(page);
    }

    const page = await Page.findById(req.params.pageId);
    if (!page) return res.status(404).json({ message: 'Page not found' });

    page.protectedBranches = protectedBranches || ['main'];
    await page.save();

    res.json(page);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
