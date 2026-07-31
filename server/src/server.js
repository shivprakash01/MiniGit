import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { runSeed } from './seed.js';

import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import pageRoutes from './routes/pageRoutes.js';
import versionRoutes from './routes/versionRoutes.js';
import mergeRoutes from './routes/mergeRoutes.js';
import repoRoutes from './routes/repoRoutes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/repos', repoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pages', pageRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/merge', mergeRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Mini Git Wiki Backend Engine Operational', time: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();
  await runSeed();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 Mini Git Wiki Server running on port ${PORT}`);
    console.log(`====================================================`);
  });
}

startServer();
