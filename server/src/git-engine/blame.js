/**
 * Compute line-by-line authorship blame for a given version node in the commit graph.
 * @param {Object} targetVersion - Populated Version document (with authorId)
 * @param {Model} VersionModel - Mongoose Version Model
 * @returns {Promise<Array>} List of line blame objects: { lineNumber, content, authorName, authorEmail, commitHash, date }
 */
export async function computeGitBlame(targetVersion, VersionModel) {
  if (!targetVersion || !targetVersion.content) return [];

  const lines = targetVersion.content.split(/\r?\n/);
  
  // Default blame initialized to current version
  const blameList = lines.map((line, index) => ({
    lineNumber: index + 1,
    content: line,
    authorName: targetVersion.authorId?.name || 'Unknown Author',
    authorEmail: targetVersion.authorId?.email || '',
    authorAvatar: targetVersion.authorId?.avatar || '',
    commitHash: targetVersion.commitHash || 'head',
    commitMessage: targetVersion.message || '',
    date: targetVersion.createdAt || new Date(),
  }));

  // If there are parent commits, trace history backwards to find original line introduction
  let currentVersion = targetVersion;
  while (currentVersion.parentIds && currentVersion.parentIds.length > 0) {
    const parentVersion = await VersionModel.findById(currentVersion.parentIds[0]).populate('authorId', 'name email avatar');
    if (!parentVersion) break;

    const parentLines = parentVersion.content.split(/\r?\n/);

    // Map lines that were unchanged from parent
    for (let i = 0; i < lines.length; i++) {
      if (parentLines.includes(lines[i])) {
        // Line existed in parent, re-attribute to parent author!
        blameList[i].authorName = parentVersion.authorId?.name || 'Historical Author';
        blameList[i].authorEmail = parentVersion.authorId?.email || '';
        blameList[i].authorAvatar = parentVersion.authorId?.avatar || '';
        blameList[i].commitHash = parentVersion.commitHash;
        blameList[i].commitMessage = parentVersion.message;
        blameList[i].date = parentVersion.createdAt;
      }
    }

    currentVersion = parentVersion;
  }

  return blameList;
}
