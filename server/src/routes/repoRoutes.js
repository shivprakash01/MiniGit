import express from 'express';
import { repoController } from '../controllers/repoController.js';

const router = express.Router();

// Repositories Management
router.post('/init', repoController.init);
router.get('/', repoController.listRepos);
router.get('/:repoId', repoController.getRepo);

// Working Directory Management
router.post('/:repoId/file', repoController.saveWorkingFile);
router.get('/:repoId/files', repoController.getWorkingFiles);
router.get('/:repoId/file-content', repoController.getFileContent);

// MiniGit Core Commands
router.post('/:repoId/add', repoController.add);
router.get('/:repoId/status', repoController.status);
router.post('/:repoId/commit', repoController.commit);
router.get('/:repoId/log', repoController.log);
router.post('/:repoId/checkout', repoController.checkout);

export default router;
