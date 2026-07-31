/**
 * Find Lowest Common Ancestor (LCA) between two commit version IDs in a Version DAG.
 * @param {ObjectId|string} versionIdA 
 * @param {ObjectId|string} versionIdB 
 * @param {Model} VersionModel Mongoose Version model
 * @returns {Promise<Object|null>} The LCA Version document
 */
export async function findLowestCommonAncestor(versionIdA, versionIdB, VersionModel) {
  if (!versionIdA || !versionIdB) return null;
  if (versionIdA.toString() === versionIdB.toString()) {
    return await VersionModel.findById(versionIdA);
  }

  // BFS ancestor traversal from versionIdA
  const ancestorsA = new Set();
  const queueA = [versionIdA.toString()];

  while (queueA.length > 0) {
    const currentId = queueA.shift();
    if (ancestorsA.has(currentId)) continue;
    ancestorsA.add(currentId);

    const versionDoc = await VersionModel.findById(currentId).select('parentIds');
    if (versionDoc && versionDoc.parentIds && versionDoc.parentIds.length > 0) {
      for (const pId of versionDoc.parentIds) {
        queueA.push(pId.toString());
      }
    }
  }

  // BFS traversal from versionIdB to find the first ancestor present in ancestorsA
  const queueB = [versionIdB.toString()];
  const visitedB = new Set();

  while (queueB.length > 0) {
    const currentId = queueB.shift();
    if (visitedB.has(currentId)) continue;
    visitedB.add(currentId);

    if (ancestorsA.has(currentId)) {
      // Found Lowest Common Ancestor!
      return await VersionModel.findById(currentId);
    }

    const versionDoc = await VersionModel.findById(currentId).select('parentIds');
    if (versionDoc && versionDoc.parentIds && versionDoc.parentIds.length > 0) {
      for (const pId of versionDoc.parentIds) {
        queueB.push(pId.toString());
      }
    }
  }

  return null;
}
