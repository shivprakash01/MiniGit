import crypto from 'crypto';

/**
 * Generate SHA-256 hash for given content string or buffer
 * @param {string|Buffer} content 
 * @returns {string} SHA-256 hexadecimal string
 */
export function generateSHA256(content) {
  return crypto.createHash('sha256').update(content || '').digest('hex');
}
