import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLineDiff, getDiffStats } from '../src/git-engine/myersDiff.js';
import { performThreeWayMerge } from '../src/git-engine/threeWayMerge.js';

test('Myers Diff - computes additions and deletions', () => {
  const oldText = 'Line 1\nLine 2\nLine 3';
  const newText = 'Line 1\nLine 2 Modified\nLine 3\nLine 4 Added';

  const diffs = computeLineDiff(oldText, newText);
  const stats = getDiffStats(oldText, newText);

  assert.equal(typeof stats.additions, 'number');
  assert.equal(typeof stats.deletions, 'number');
  assert.ok(diffs.length > 0);
});

test('3-Way Merge - Fast Forward case', () => {
  const base = 'Header\nContent';
  const target = 'Header\nContent';
  const source = 'Header\nContent Updated';

  const result = performThreeWayMerge(base, target, source);
  assert.equal(result.isFastForward, true);
  assert.equal(result.hasConflicts, false);
  assert.equal(result.mergedText, source);
});

test('3-Way Merge - Non-overlapping auto merge', () => {
  const base = 'Line 1\nLine 2\nLine 3';
  const target = 'Line 1 Modified By Target\nLine 2\nLine 3';
  const source = 'Line 1\nLine 2\nLine 3 Modified By Source';

  const result = performThreeWayMerge(base, target, source);
  assert.equal(result.hasConflicts, false);
  assert.ok(result.mergedText.includes('Line 1 Modified By Target'));
  assert.ok(result.mergedText.includes('Line 3 Modified By Source'));
});

test('3-Way Merge - Overlapping conflict detection', () => {
  const base = 'Line 1\nLine 2\nLine 3';
  const target = 'Line 1\nLine 2 Edited By Target\nLine 3';
  const source = 'Line 1\nLine 2 Edited Differently By Source\nLine 3';

  const result = performThreeWayMerge(base, target, source);
  assert.equal(result.hasConflicts, true);
  assert.ok(result.conflicts.length > 0);
  assert.ok(result.mergedText.includes('<<<<<<< HEAD'));
});
