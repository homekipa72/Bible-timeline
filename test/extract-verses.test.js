'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { extractVersesFromHtml } = require('../js/extract-verses');

const fixtures = path.join(__dirname, 'fixtures');

// structured HTML
const html = fs.readFileSync(path.join(fixtures, 'bible_gn1_sample.html'), 'utf8');
const verses = extractVersesFromHtml(html, { bookName: '창세기', chapter: 1 });
assert.equal(verses.length, 3);
assert.equal(verses[0].n, 1);
assert.match(verses[0].text, /한처음에/);
assert.equal(verses[2].n, 3);
assert.match(verses[2].text, /빛/);

// plain text fallback wrapped as minimal html body text
const plain = fs.readFileSync(path.join(fixtures, 'bible_gn1_plain.txt'), 'utf8');
const plainHtml = '<html><body>' + plain.replace(/\n/g, '<br>\n') + '</body></html>';
const verses2 = extractVersesFromHtml(plainHtml, { bookName: '창세기', chapter: 1 });
assert.ok(verses2.length >= 3);
assert.equal(verses2[0].n, 1);

// missing heading
assert.throws(() => extractVersesFromHtml('<html><body>no heading</body></html>', { bookName: '창세기', chapter: 1 }));


// variant structure (d-flex / verse-text)
const html3 = fs.readFileSync(path.join(fixtures, 'bible_contents_variant.html'), 'utf8');
const verses3 = extractVersesFromHtml(html3, { bookName: '요한 복음서', chapter: 3 });
assert.equal(verses3.length, 2);
assert.equal(verses3[0].n, 16);
assert.match(verses3[0].text, /사랑하신/);

// empty / broken
assert.throws(() => extractVersesFromHtml('<div id="bibleContents"></div>', { bookName: '창세기', chapter: 1 }));

console.log('extractVerses tests: OK (' + verses.length + ' structured, ' + verses2.length + ' plain, ' + verses3.length + ' variant)');

