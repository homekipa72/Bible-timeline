'use strict';
/**
 * CBCK 성경 HTML에서 절 목록을 뽑습니다. (브라우저 DOMParser 없이 테스트 가능)
 * @param {string} html
 * @param {{bookName:string, chapter:number}} meta
 * @returns {{n:number,text:string}[]}
 */
function extractVersesFromHtml(html, meta) {
  const bookName = meta && meta.bookName;
  const chapter = meta && meta.chapter;
  if (!html || !bookName || !chapter) throw new Error('invalid args');

  // 1) #bibleContents 구조 (col-1 .highlight + .col-11)
  const structured = extractFromBibleContents(html);
  if (structured.length) return structured;

  // 2) 텍스트 폴백
  const text = htmlToPlainText(html).replace(/\r/g, '').replace(/\u00a0/g, ' ');
  const headingRe = new RegExp(escapeReg(bookName) + '\\s*' + chapter + '\\s*(?:장|편)');
  const headingMatch = text.match(headingRe);
  if (!headingMatch) throw new Error('본문 제목을 찾을 수 없습니다. 공식 사이트의 페이지 구성이 변경되었을 수 있습니다.');

  let body = text.slice(headingMatch.index + headingMatch[0].length);
  const end = body.search(/\n성경\s*\n(?:구약|신약)/);
  if (end >= 0) body = body.slice(0, end);
  const lines = body.split('\n').map((x) => x.trim()).filter(Boolean);
  const verses = [];
  let started = false;
  for (const line of lines) {
    if (/^\d{1,3}$/.test(line)) {
      verses.push({ n: +line, text: '' });
      started = true;
      continue;
    }
    const inline = line.match(/^(\d{1,3})\s+(.+)$/);
    if (inline) {
      verses.push({ n: +inline[1], text: inline[2] });
      started = true;
      continue;
    }
    if (started) {
      if (/^(함께보기|장 바로가기|성경|구약|신약)$/.test(line)) break;
      verses[verses.length - 1].text += (verses[verses.length - 1].text ? ' ' : '') + line;
    }
  }
  const filtered = verses.filter((v) => v.n > 0 && v.text);
  if (!filtered.length) throw new Error('본문 절을 구분하지 못했습니다.');
  return filtered;
}

function extractFromBibleContents(html) {
  const blockMatch = html.match(/id\s*=\s*["']bibleContents["'][^>]*>([\s\S]*?)<\/div>/i);
  const block = blockMatch ? blockMatch[1] : html;
  const verses = [];
  // row-ish chunks with highlight number and following text in col-11
  const rowRe = /class\s*=\s*["'][^"']*col-1[^"']*["'][\s\S]*?class\s*=\s*["'][^"']*highlight[^"']*["'][^>]*>(\d{1,3})<[\s\S]*?class\s*=\s*["'][^"']*col-11[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  let m;
  while ((m = rowRe.exec(block))) {
    const n = +m[1];
    const text = htmlToPlainText(m[2]).replace(/\s+/g, ' ').trim();
    if (n > 0 && text) verses.push({ n, text });
  }
  if (verses.length) return verses;
  // alternate: highlight then nearby text
  const altRe = /class\s*=\s*["'][^"']*highlight[^"']*["'][^>]*>(\d{1,3})<\/[^>]+>[\s\S]{0,200}?class\s*=\s*["'][^"']*col-11[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi;
  while ((m = altRe.exec(block))) {
    const n = +m[1];
    const text = htmlToPlainText(m[2]).replace(/\s+/g, ' ').trim();
    if (n > 0 && text) verses.push({ n, text });
  }
  return uniqueVerses(verses);
}

function uniqueVerses(list) {
  const seen = new Set();
  const out = [];
  for (const v of list) {
    if (seen.has(v.n)) continue;
    seen.add(v.n);
    out.push(v);
  }
  return out;
}

function htmlToPlainText(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"');
}

function escapeReg(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  extractVersesFromHtml,
  extractFromBibleContents,
  htmlToPlainText
};
