import mongoose from 'mongoose';

const versionSchema = new mongoose.Schema(
  {
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      required: true,
      index: true,
    },
    commitHash: {
      type: String,
      required: true,
      unique: true,
    },
    // Array of parent ObjectIds. 1 parent = normal edit, 2 parents = merge commit
    parentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Version',
      },
    ],
    branchName: {
      type: String,
      required: true,
      default: 'main',
    },
    content: {
      type: String,
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      default: 'Update page content',
    },
    stats: {
      additions: { type: Number, default: 0 },
      deletions: { type: Number, default: 0 },
      linesTotal: { type: Number, default: 0 },
    },
    isMergeCommit: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Version = mongoose.model('Version', versionSchema);
