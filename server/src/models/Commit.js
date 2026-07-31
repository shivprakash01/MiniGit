import mongoose from 'mongoose';

const commitSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true
  },
  commitId: {
    type: String,
    required: true,
    index: true
  },
  parentCommit: {
    type: String,
    default: null
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  files: [
    {
      filename: { type: String, required: true },
      hash: { type: String, required: true }
    }
  ]
});

export default mongoose.model('Commit', commitSchema);
