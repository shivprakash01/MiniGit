import crypto from 'crypto';

/**
 * Compute SHA-256 hash string representing a Git commit node.
 */
export function generateCommitHash(content, parentIds = [], authorId = '', message = '', timestamp = Date.now()) {
  const parentString = Array.isArray(parentIds) ? parentIds.map(p => p.toString()).sort().join(',') : '';
  const payload = `commit ${content.length}\0parents:${parentString}\0author:${authorId}\0time:${timestamp}\0msg:${message}\0${content}`;
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 40);
}
