import mongoose from 'mongoose';

const mergeRequestSchema = new mongoose.Schema(
  {
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
      required: true,
    },
    sourceBranch: {
      type: String,
      required: true,
    },
    targetBranch: {
      type: String,
      required: true,
      default: 'main',
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'merged', 'closed', 'conflict'],
      default: 'open',
    },
    conflicts: [
      {
        lineNumber: Number,
        baseContent: String,
        targetContent: String,
        sourceContent: String,
      },
    ],
  },
  { timestamps: true }
);

export const MergeRequest = mongoose.model('MergeRequest', mergeRequestSchema);

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actorName: String,
    action: {
      type: String,
      required: true,
    },
    details: String,
    pageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Page',
    },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
