'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require.resolve('../js/app.js'), 'utf8');
const helper = source.match(/function recoverCompletedPlans\(\)\s*\{[^}]*\}/);
assert.ok(helper, 'startup recovery helper exists');
assert.match(source, /backfillCumulative\(\);\s*\/\/[\s\S]*?recoverCompletedPlans\(\);/,
  'recovery runs after saved reading state has been migrated/backfilled');

const archived = [];
const context = {
  savedPlans: [{ id: 'a' }, { id: 'b' }],
  archiveIfComplete: id => archived.push(id)
};
vm.runInNewContext(`${helper[0]}; recoverCompletedPlans();`, context);
assert.deepEqual(archived, ['a', 'b']);
console.log('completed-plan recovery tests: OK');
