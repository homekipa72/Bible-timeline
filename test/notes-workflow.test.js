'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');

// The notes screen has the requested three-part order.
const notesSection = html.slice(html.indexOf('<section id="notes"'), html.indexOf('</section>', html.indexOf('<section id="notes"')));
const order = ['오늘의 묵상', '구절 묵상', '저장된 기록'];
let previous = -1;
for (const label of order) {
  const index = notesSection.indexOf(label);
  assert.ok(index > previous, `${label} appears in the requested order`);
  previous = index;
}

// Verse selection is the only reading toolbar; its five actions are exact.
const barMatch = html.match(/<div id="selectBar"[^>]*>([\s\S]*?)<\/div>/);
assert.ok(barMatch, 'verse selection toolbar exists');
const actions = [...barMatch[1].matchAll(/<button[^>]*>([^<]+)<\/button>/g)].map(m => m[1].trim());
assert.deepEqual(actions, ['전체', '복사', '카드', '구절 묵상', '닫기']);
assert.ok(!html.includes('id="copyBar"'), 'separate copy toolbar removed');
assert.ok(!html.includes('id="copyHint"'), 'separate copy mode hint removed');
assert.ok(app.includes('오늘의 묵상 작성'), 'home task provides a route to today meditation');
assert.ok(html.includes('id="noteVersePreview"'), 'today meditation has selected scripture preview');
assert.ok(html.includes('id="verseMeditationList"'), 'verse meditation has its own list');

// Existing one-line entries remain classified as verse meditations after the rename.
const fn = app.match(/function isVerseMeditation\(n\)\s*\{[\s\S]*?\n\}/);
assert.ok(fn, 'verse meditation classifier exists');
const isVerseMeditation = vm.runInNewContext(`(${fn[0]})`);
assert.equal(isVerseMeditation({ kind: 'verse' }), true);
assert.equal(isVerseMeditation({ kind: 'line' }), true);
assert.equal(isVerseMeditation({ kind: 'note', reflection: '묵상' }), false);

// Saved-note renderer includes scripture reference, scripture text, meditation and resolution.
const viewFn = app.match(/function noteViewHtml\(n\)\s*\{[\s\S]*?\n\}/);
assert.ok(viewFn, 'saved note renderer exists');
const context = {
  safe: value => String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
  isVerseMeditation: isVerseMeditation
};
const noteViewHtml = vm.runInNewContext(`(${viewFn[0]})`, context);
const rendered = noteViewHtml({
  id: 'test', kind: 'note', verse: '창세기 1,1', verseText: '한처음에 하느님께서 하늘과 땅을 창조하셨다.',
  reflection: '하느님의 창조를 묵상합니다.', resolution: '오늘 감사하며 살겠습니다.'
});
for (const text of ['창세기 1,1', '성경 본문', '한처음에 하느님께서', '하느님의 창조를 묵상합니다.', '실천 다짐', '오늘 감사하며 살겠습니다.']) {
  assert.ok(rendered.includes(text), `saved note shows ${text}`);
}

console.log('notes workflow tests: OK (section order, unified verse selection, migration compatibility, saved note fields)');
