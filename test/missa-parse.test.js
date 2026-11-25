'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const missa = require('../api/missa');

const fixtures = path.join(__dirname, 'fixtures');
const listHtml = fs.readFileSync(path.join(fixtures, 'missa_list_sample.html'), 'utf8');
const viewHtml = fs.readFileSync(path.join(fixtures, 'missa_view_sample.html'), 'utf8');

const items = missa.parseMassItems(listHtml);
assert.equal(items.length, 2, '한국어 제목 날짜만 2개여야 함');
assert.equal(items[0].date, '2026-11-24');
assert.equal(items[1].date, '2026-11-25');
assert.ok(items[0].title.includes('화요일'));
assert.equal(items[0].fields.mday, '20261124');

const sections = missa.parseSections(viewHtml);
const titles = sections.map(s => s.title);
assert.ok(titles.includes('입당송'));
assert.ok(titles.includes('제1독서'));
assert.ok(titles.includes('복음'));
assert.ok(titles.includes('오늘의 묵상'));
assert.ok(!titles.includes('IGNORE ME'));
assert.ok(sections.find(s => s.title === '복음').text.includes('예수님'));

console.log('missa parse tests: OK (' + items.length + ' dates, ' + sections.length + ' sections)');
