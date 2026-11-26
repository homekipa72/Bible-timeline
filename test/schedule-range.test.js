'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../js/app.js'), 'utf8');
const match = source.match(/function chapterRangeForDay\(day,total,days\)\s*\{[\s\S]*?\n\}/);
assert.ok(match, 'production chapterRangeForDay helper exists');
const rangeForDay = vm.runInNewContext(`(${match[0]})`);

// A short four-chapter plan spread over a year must not repeat chapters.
const assigned = [];
let emptyDays = 0;
for (let day = 1; day <= 365; day++) {
  const { a, z } = rangeForDay(day, 4, 365);
  assert.ok(z >= a, `non-negative range on day ${day}`);
  if (a === z) emptyDays++;
  for (let i = a; i < z; i++) assigned.push(i);
}
assert.deepEqual(assigned, [0, 1, 2, 3]);
assert.equal(emptyDays, 361);

// Normal allocation remains contiguous and complete.
const normal = [];
for (let day = 1; day <= 7; day++) {
  const { a, z } = rangeForDay(day, 31, 7);
  for (let i = a; i < z; i++) normal.push(i);
}
assert.deepEqual(normal, Array.from({ length: 31 }, (_, i) => i));
const empty = rangeForDay(1, 0, 365);
assert.equal(empty.a, 0);
assert.equal(empty.z, 0);
// Flexible mode resumes at the oldest unfinished scheduled day and computes delay.
const flexibleMatch = source.match(/function flexibleScheduleState\(p,seq\)\s*\{[\s\S]*?\n\}/);
assert.ok(flexibleMatch, 'production flexibleScheduleState helper exists');
const context = {
  chapterRangeForDay: rangeForDay,
  rawDay: 3,
  completedKeys: new Set(['0:1']),
  rawPlanReadingDay: () => context.rawDay,
  planPaceMode: p => p.paceMode,
  buildSeqForPlan: p => p.seq,
  verseKey: (book, chapter) => `${book}:${chapter}`,
  planChapterDone: (id, key) => context.completedKeys.has(key)
};
context.flexibleScheduleState = vm.runInNewContext(`(${flexibleMatch[0]})`, context);
const seq = [1, 2, 3].map(chapter => ({ book: 0, chapter }));
let flexible = context.flexibleScheduleState({ id: 'p', paceMode: 'flexible', days: 3, seq });
assert.equal(flexible.day, 2);
assert.equal(flexible.extension, 1);
context.completedKeys.add('0:2');
flexible = context.flexibleScheduleState({ id: 'p', paceMode: 'flexible', days: 3, seq });
assert.equal(flexible.day, 3);
assert.equal(flexible.extension, 0);
context.rawDay = 5;
flexible = context.flexibleScheduleState({ id: 'p', paceMode: 'flexible', days: 3, seq });
assert.equal(flexible.day, 3);
assert.equal(flexible.extension, 2);
console.log('flexible schedule tests: OK (oldest incomplete day resumes; end date extends)');
