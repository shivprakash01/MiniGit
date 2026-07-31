import { diffLines, diffArrays } from 'diff';

/**
 * Robust 3-Way Line Merge Algorithm
 * Compares Base (LCA), Target (Ours), and Source (Theirs) line by line.
 */
export function performThreeWayMerge(baseText = '', targetText = '', sourceText = '') {
  const baseLines = baseText.split(/\r?\n/);
  const targetLines = targetText.split(/\r?\n/);
  const sourceLines = sourceText.split(/\r?\n/);

  // Fast-forward cases
  if (baseText === targetText) {
    return { mergedText: sourceText, hasConflicts: false, conflicts: [], isFastForward: true };
  }
  if (baseText === sourceText || targetText === sourceText) {
    return { mergedText: targetText, hasConflicts: false, conflicts: [], isFastForward: false };
  }

  // Line-by-line 3-way merge logic
  const targetDiff = diffArrays(baseLines, targetLines);
  const sourceDiff = diffArrays(baseLines, sourceLines);

  const targetMap = mapBaseToChanges(baseLines, targetDiff);
  const sourceMap = mapBaseToChanges(baseLines, sourceDiff);

  const resultLines = [];
  const conflicts = [];
  let hasConflicts = false;

  const totalLines = Math.max(baseLines.length, targetMap.length, sourceMap.length);

  for (let i = 0; i < totalLines; i++) {
    const baseLine = baseLines[i] !== undefined ? baseLines[i] : null;
    const tChange = targetMap[i] || { status: 'unchanged', lines: baseLine !== null ? [baseLine] : [] };
    const sChange = sourceMap[i] || { status: 'unchanged', lines: baseLine !== null ? [baseLine] : [] };

    const tContent = tChange.lines.join('\n');
    const sContent = sChange.lines.join('\n');

    // Case 1: Both unchanged
    if (tChange.status === 'unchanged' && sChange.status === 'unchanged') {
      if (baseLine !== null) resultLines.push(baseLine);
    }
    // Case 2: Only Target changed line i
    else if (tChange.status !== 'unchanged' && sChange.status === 'unchanged') {
      if (tChange.lines.length > 0) resultLines.push(...tChange.lines);
    }
    // Case 3: Only Source changed line i
    else if (tChange.status === 'unchanged' && sChange.status !== 'unchanged') {
      if (sChange.lines.length > 0) resultLines.push(...sChange.lines);
    }
    // Case 4: Both modified line i
    else {
      if (tContent === sContent) {
        if (tChange.lines.length > 0) resultLines.push(...tChange.lines);
      } else {
        hasConflicts = true;
        const conflictMarker = [
          `<<<<<<< HEAD (Target Branch)`,
          tContent,
          `||||||| BASE (Common Ancestor)`,
          baseLine || '',
          `=======`,
          sContent,
          `>>>>>>> INCOMING (Source Branch)`
        ].join('\n');

        resultLines.push(conflictMarker);
        conflicts.push({
          lineNumber: resultLines.length,
          baseContent: baseLine || '',
          targetContent: tContent,
          sourceContent: sContent,
        });
      }
    }
  }

  return {
    mergedText: resultLines.join('\n'),
    hasConflicts,
    conflicts,
    isFastForward: false,
  };
}

function mapBaseToChanges(baseLines, diffResult) {
  const map = [];
  let baseIdx = 0;

  for (const part of diffResult) {
    if (part.added) {
      if (!map[baseIdx]) {
        map[baseIdx] = { status: 'added', lines: [...part.value] };
      } else {
        map[baseIdx].lines.push(...part.value);
        map[baseIdx].status = 'modified';
      }
    } else if (part.removed) {
      for (const line of part.value) {
        map[baseIdx] = { status: 'removed', lines: [] };
        baseIdx++;
      }
    } else {
      for (const line of part.value) {
        if (!map[baseIdx]) {
          map[baseIdx] = { status: 'unchanged', lines: [line] };
        }
        baseIdx++;
      }
    }
  }

  return map;
}
