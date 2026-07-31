import Repository from '../models/Repository.js';
import { gitService } from '../services/gitService.js';
import { readWorkingFile, listWorkingFiles, writeWorkingFile, readObject } from '../utils/fsUtils.js';

export const repoController = {
  /**
   * POST /api/repos/init
   */
  async init(req, res, next) {
    try {
      const { name, description } = req.body;
      const result = await gitService.initRepo({ name, description });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/repos - List all repositories
   */
  async listRepos(req, res, next) {
    try {
      const repos = await Repository.find().sort({ createdAt: -1 });
      res.json(repos);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/repos/:repoId - Get single repository info
   */
  async getRepo(req, res, next) {
    try {
      const repo = await Repository.findById(req.params.repoId);
      if (!repo) {
        return res.status(404).json({ message: 'Repository not found' });
      }
      res.json(repo);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/repos/:repoId/file - Create/update working directory file
   */
  async saveWorkingFile(req, res, next) {
    try {
      const { filename, content } = req.body;
      if (!filename) {
        return res.status(400).json({ message: 'Filename is required' });
      }
      await writeWorkingFile(req.params.repoId, filename, content || '');
      res.json({ message: `File "${filename}" saved to working directory`, filename });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/repos/:repoId/files - List files in working directory
   */
  async getWorkingFiles(req, res, next) {
    try {
      const files = await listWorkingFiles(req.params.repoId);
      res.json({ files });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/repos/:repoId/file-content - Read specific file content
   */
  async getFileContent(req, res, next) {
    try {
      const { filename, hash } = req.query;
      let content = null;

      if (hash) {
        content = await readObject(req.params.repoId, hash);
      } else if (filename) {
        content = await readWorkingFile(req.params.repoId, filename);
      }

      if (content === null) {
        return res.status(404).json({ message: 'File or object content not found' });
      }

      res.json({ content });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/repos/:repoId/add
   */
  async add(req, res, next) {
    try {
      const { filename, content } = req.body;
      const result = await gitService.addFile(req.params.repoId, { filename, content });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/repos/:repoId/status
   */
  async status(req, res, next) {
    try {
      const result = await gitService.getStatus(req.params.repoId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/repos/:repoId/commit
   */
  async commit(req, res, next) {
    try {
      const { message } = req.body;
      const result = await gitService.createCommit(req.params.repoId, { message });
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/repos/:repoId/log
   */
  async log(req, res, next) {
    try {
      const commits = await gitService.getLog(req.params.repoId);
      res.json(commits);
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/repos/:repoId/checkout
   */
  async checkout(req, res, next) {
    try {
      const { commitId } = req.body;
      const result = await gitService.checkoutCommit(req.params.repoId, { commitId });
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
};
