import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  headVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Version',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    description: {
      type: String,
      default: '',
    },
    defaultBranch: {
      type: String,
      default: 'main',
    },
    protectedBranches: {
      type: [String],
      default: ['main'],
    },
    branches: [branchSchema],
    tags: [
      {
        name: String,
        versionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Version' },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Page = mongoose.model('Page', pageSchema);
