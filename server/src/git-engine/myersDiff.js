import { diffLines, diffArrays } from 'diff';

/**
 * Perform line-level diff between two text documents.
 * @param {string} oldText 
 * @param {string} newText 
 * @returns {Array} List of line objects with status: 'added' | 'removed' | 'unchanged'
 */
export function computeLineDiff(oldText = '', newText = '') {
  const oldLines = oldText.split(/\r?\n/);
  const newLines = newText.split(/\r?\n/);

  const diffResult = diffArrays(oldLines, newLines);
  const formattedLines = [];

  let oldLineNum = 1;
  let newLineNum = 1;

  for (const part of diffResult) {
    for (const line of part.value) {
      if (part.added) {
        formattedLines.push({
          type: 'added',
          line,
          oldLineNumber: null,
          newLineNumber: newLineNum++,
        });
      } else if (part.removed) {
        formattedLines.push({
          type: 'removed',
          line,
          oldLineNumber: oldLineNum++,
          newLineNumber: null,
        });
      } else {
        formattedLines.push({
          type: 'unchanged',
          line,
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        });
      }
    }
  }

  return formattedLines;
}

/**
 * Return summary statistics for diff (additions, deletions, total lines)
 */
export function getDiffStats(oldText = '', newText = '') {
  const diffs = computeLineDiff(oldText, newText);
  let additions = 0;
  let deletions = 0;

  for (const d of diffs) {
    if (d.type === 'added') additions++;
    if (d.type === 'removed') deletions++;
  }

  return {
    additions,
    deletions,
    linesTotal: newText.split(/\r?\n/).length,
  };
}
