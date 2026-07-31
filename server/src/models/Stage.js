import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema({
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  hash: {
    type: String,
    required: true
  }
});

// Ensure a filename is unique per repository in the staging area
stageSchema.index({ repositoryId: 1, filename: 1 }, { unique: true });

export default mongoose.model('Stage', stageSchema);
