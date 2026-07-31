import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcryptjs';
import { isMemoryMode, memoryStore, generateId } from './config/memoryDb.js';
import { User } from './models/User.js';
import { Page } from './models/Page.js';
import { Version } from './models/Version.js';
import { generateCommitHash } from './git-engine/hash.js';
import { getDiffStats } from './git-engine/myersDiff.js';
import { connectDB } from './config/db.js';

export async function runSeed() {
  try {
    if (isMemoryMode()) {
      if (memoryStore.users.length > 0) return;
      console.log('[Seed] Seeding default accounts into In-Memory Storage Engine...');

      const adminPasswordHash = await bcrypt.hash('admin123', 10);
      const empPasswordHash = await bcrypt.hash('emp123', 10);

      const adminUser = {
        _id: 'admin_1',
        name: 'Sarah Connor (Admin)',
        email: 'admin@minigit.com',
        password: adminPasswordHash,
        role: 'admin',
        department: 'DevOps & Admin',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Admin',
        createdAt: new Date(),
      };

      const employeeUser = {
        _id: 'emp_1',
        name: 'Alex Mercer (Engineer)',
        email: 'employee@minigit.com',
        password: empPasswordHash,
        role: 'employee',
        department: 'Software Engineering',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Alex',
        createdAt: new Date(),
      };

      memoryStore.users.push(adminUser, employeeUser);

      // Create Sample Wiki Page
      const pageId = 'page_1';
      const contentV1 = `# System Architecture & Design\n\n## Overview\nThis wiki page documents our core software architecture and version-control mechanics.\n\n### Microservices\n- **Frontend**: React + Tailwind CSS SPA\n- **Backend**: Express REST API + Myers Diff Engine\n- **Database**: MongoDB Version DAG\n`;

      const hashV1 = generateCommitHash(contentV1, [], adminUser._id, 'Initial architecture spec', Date.now() - 3600000 * 5);
      const v1 = {
        _id: 'v_1',
        pageId,
        commitHash: hashV1,
        parentIds: [],
        branchName: 'main',
        content: contentV1,
        authorId: adminUser,
        message: 'Initial architecture spec',
        stats: getDiffStats('', contentV1),
        createdAt: new Date(Date.now() - 3600000 * 5),
      };

      const contentV2 = `# System Architecture & Design\n\n## Overview\nThis wiki page documents our core software architecture and version-control mechanics.\n\n### Microservices\n- **Frontend**: React + Tailwind CSS SPA with React Flow graph\n- **Backend**: Express REST API + Myers Diff & 3-Way Merge Engine\n- **Database**: MongoDB Version DAG\n\n### Storage Engine\nEvery page update is persisted as a cryptographic Version DAG node.\n`;

      const hashV2 = generateCommitHash(contentV2, [v1._id], adminUser._id, 'Add storage engine overview', Date.now() - 3600000 * 4);
      const v2 = {
        _id: 'v_2',
        pageId,
        commitHash: hashV2,
        parentIds: [v1._id],
        branchName: 'main',
        content: contentV2,
        authorId: adminUser,
        message: 'Add storage engine overview',
        stats: getDiffStats(contentV1, contentV2),
        createdAt: new Date(Date.now() - 3600000 * 4),
      };

      const contentFeature1 = `# System Architecture & Design\n\n## Overview\nThis wiki page documents our core software architecture and version-control mechanics.\n\n### Microservices\n- **Frontend**: React + Tailwind CSS SPA with React Flow graph\n- **Backend**: Express REST API + Myers Diff & 3-Way Merge Engine\n- **Database**: MongoDB Version DAG (Sharded cluster setup)\n\n### Storage Engine\nEvery page update is persisted as a cryptographic Version DAG node.\n- **Cache**: Redis LRU cache layer added\n`;

      const hashFeature1 = generateCommitHash(contentFeature1, [v2._id], employeeUser._id, 'Add Redis caching layer specs', Date.now() - 3600000 * 2);
      const vFeature1 = {
        _id: 'v_3',
        pageId,
        commitHash: hashFeature1,
        parentIds: [v2._id],
        branchName: 'feature/database-refactor',
        content: contentFeature1,
        authorId: employeeUser,
        message: 'Add Redis caching layer specs',
        stats: getDiffStats(contentV2, contentFeature1),
        createdAt: new Date(Date.now() - 3600000 * 2),
      };

      memoryStore.versions.push(v1, v2, vFeature1);

      const page = {
        _id: pageId,
        title: 'System Architecture & Design',
        slug: 'system-architecture-and-design',
        category: 'Architecture',
        description: 'Core architectural guidelines, data models, and Git version control engine documentation.',
        createdBy: adminUser,
        defaultBranch: 'main',
        protectedBranches: ['main'],
        branches: [
          { name: 'main', headVersionId: v2._id },
          { name: 'feature/database-refactor', headVersionId: vFeature1._id },
        ],
        createdAt: new Date(),
      };

      memoryStore.pages.push(page);
      console.log('[Seed] Default accounts and wiki page seeded in memory!');
      return;
    }

    // Mongoose fallback
    const userCount = await User.countDocuments();
    if (userCount > 0) return;

    console.log('[Seed] Seeding MongoDB database...');
    const admin = await User.create({
      name: 'Sarah Connor (Admin)',
      email: 'admin@minigit.com',
      password: 'admin123',
      role: 'admin',
      department: 'DevOps & Admin',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Admin',
    });

    const employee = await User.create({
      name: 'Alex Mercer (Engineer)',
      email: 'employee@minigit.com',
      password: 'emp123',
      role: 'employee',
      department: 'Software Engineering',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=Alex',
    });

    const page = new Page({
      title: 'System Architecture & Design',
      slug: 'system-architecture-and-design',
      category: 'Architecture',
      description: 'Core architectural guidelines, data models, and Git version control engine documentation.',
      createdBy: admin._id,
      defaultBranch: 'main',
      protectedBranches: ['main'],
    });

    const contentV1 = `# System Architecture & Design\n\n## Overview\nThis wiki page documents our core software architecture and version-control mechanics.\n`;
    const hashV1 = generateCommitHash(contentV1, [], admin._id, 'Initial architecture spec', Date.now() - 3600000 * 5);
    const v1 = await Version.create({
      pageId: page._id,
      commitHash: hashV1,
      parentIds: [],
      branchName: 'main',
      content: contentV1,
      authorId: admin._id,
      message: 'Initial architecture spec',
      stats: getDiffStats('', contentV1),
    });

    page.branches = [{ name: 'main', headVersionId: v1._id }];
    await page.save();
    console.log('[Seed] Seeding complete.');
  } catch (error) {
    console.error(`[Seed] Error: ${error.message}`);
  }
}
