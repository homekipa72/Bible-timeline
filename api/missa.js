'use strict';

const LIST_URL = 'https://maria.catholic.or.kr/mobile/missa/missa_list.asp';
const VIEW_URL = 'https://maria.catholic.or.kr/mobile/missa/missa_view.asp';
const SOURCE_URL = 'https://maria.catholic.or.kr/mobile/missa/missa_list.asp';
const USER_AGENT = 'MalssumgilDailyMassReader/1.0';
const FETCH_TIMEOUT_MS = 12000;
const SECTION_LABELS = new Set([
  '오늘 전례', '입당송', '본기도', '제1독서', '제2독서', '화답송',
  '복음 환호송', '복음', '예물기도', '영성체송', '영성체 후 묵상',
  '영성체 후 기도', '오늘의 묵상'
]);

function decodeEntities(value) {
  return String(value || '').replace(/&(#(?:x[\da-f]+|\d+)|nbsp|amp|lt|gt|quot|apos);/gi, (all, token) => {
    const key = token.toLowerCase();
    if (key === 'nbsp') return ' ';
    if (key === 'amp') return '&';
    if (key === 'lt') return '<';
    if (key === 'gt') return '>';
    if (key === 'quot') return '"';
    if (key === 'apos') return "'";
    if (key[0] === '#') {
      const hex = key[1] === 'x';
      const point = parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
      try { return Number.isFinite(point) ? String.fromCodePoint(point) : all; } catch (error) { return all; }
    }
    return all;
  });
}

function htmlText(fragment) {
  return decodeEntities(String(fragment || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, ''))
    .replace(/\r/g, '')
    .replace(/[\t\f\v \u00a0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractAttribute(attributes, name) {
  const match = attributes.match(new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\')', 'i'));
  return match ? decodeEntities(match[1] === undefined ? match[2] : match[1]) : '';
}

function parseMassItems(html) {
  const items = [];
  const seen = new Set();
  const anchors = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi;
  let match;
  while ((match = anchors.exec(html))) {
    const onclick = extractAttribute(match[1], 'onclick');
    if (!onclick.includes('view_missa_content')) continue;
    const title = htmlText(match[2]).replace(/\s+/g, ' ').trim();
    if (!/[\uac00-\ud7a3]/.test(title)) continue;
    const args = [...onclick.matchAll(/'([^']*)'/g)].map(value => decodeEntities(value[1]));
    if (args.length < 6 || !/^\d{8}$/.test(args[1] || '')) continue;
    const date = args[1].slice(0, 4) + '-' + args[1].slice(4, 6) + '-' + args[1].slice(6, 8);
    if (seen.has(date)) continue;
    seen.add(date);
    items.push({
      date,
      title,
      color: args[0],
      dateLabel: args[2],
      fields: {
        today_gubun: args[0],
        mday: args[1],
        CurrDay: args[2],
        mid: args[3],
        today_name1: args[4],
        missa_sel: args[5]
      },
      active: false
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date));
}

function publicItems(items) {
  return items.map(({ date, title, color, dateLabel, active }) => ({ date, title, color, dateLabel, active }));
}

function parseSections(html) {
  const block = html.match(/<div\b(?=[^>]*\bid\s*=\s*["']font_chg["'])(?=[^>]*\bclass\s*=\s*["'][^"']*\bmissa_view_content\b[^"']*["'])[^>]*>([\s\S]*?)<\/div\s*>/i);
  if (!block) throw new Error('매일미사 본문 영역을 찾지 못했습니다.');
  const content = block[1];
  const sections = [];
  const headings = /<font\b[^>]*>([\s\S]*?)<\/font\s*>/gi;
  let heading;
  while ((heading = headings.exec(content))) {
    const title = htmlText(heading[1]).replace(/\s+/g, ' ').trim();
    if (!SECTION_LABELS.has(title)) continue;
    const rest = content.slice(headings.lastIndex);
    const body = rest.match(/<span\b(?=[^>]*\bclass\s*=\s*["'][^"']*\bb01\b[^"']*["'])[^>]*>([\s\S]*?)<\/span\s*>/i);
    if (!body) continue;
    const text = htmlText(body[1]);
    if (text) sections.push({ title, text });
  }
  if (!sections.length) throw new Error('매일미사 한국어 본문을 찾지 못했습니다.');
  return sections;
}

async function fetchList() {
  const response = await fetch(LIST_URL, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error('매일미사 목록 응답 오류 (' + response.status + ')');
  const html = await response.text();
  const items = parseMassItems(html);
  if (!items.length) throw new Error('매일미사 날짜 목록을 읽지 못했습니다.');
  return items;
}

function seoulDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return value.year + '-' + value.month + '-' + value.day;
}

async function findToday(items) {
  const response = await fetch(VIEW_URL + '?today=on', {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error('오늘의 미사 날짜 확인 오류 (' + response.status + ')');
  const html = await response.text();
  const dateMatch = html.match(/<div\b[^>]*class\s*=\s*["'][^"']*date_area[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
  const dateText = htmlText(dateMatch ? dateMatch[1] : '');
  const parts = dateText.match(/(\d{4})\s*\/\s*(\d{1,2})\s*[./]\s*(\d{1,2})/);
  const date = parts ? parts[1] + '-' + parts[2].padStart(2, '0') + '-' + parts[3].padStart(2, '0') : seoulDate();
  return items.find(item => item.date === date);
}

async function fetchMass(item) {
  const body = new URLSearchParams(item.fields);
  const response = await fetch(VIEW_URL, {
    method: 'POST',
    headers: {
      'User-Agent': USER_AGENT,
      Accept: 'text/html,application/xhtml+xml',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Referer: LIST_URL
    },
    body,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error('선택한 날짜의 매일미사 응답 오류 (' + response.status + ')');
  const html = await response.text();
  const sections = parseSections(html);
  return {
    date: item.date,
    dateLabel: item.dateLabel,
    title: item.title,
    color: item.color,
    heading: item.color ? '(' + item.color + ') ' + item.title : item.title,
    sections,
    sourceUrl: SOURCE_URL
  };
}

function allowOrigin(req, res) {
  const origin = req.headers && (req.headers.origin || req.headers.Origin);
  if (!origin) return;
  try {
    const host = req.headers.host || '';
    const originHost = new URL(origin).host;
    if (host && originHost === host) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
  } catch (_) {}
}

module.exports = async function handler(req, res) {
  allowOrigin(req, res);
  res.setHeader('X-Missa-Source', SOURCE_URL);
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const query = req.query || {};
    const items = await fetchList();
    const active = await findToday(items);
    if (query.list === '1') {
      // 목록: CDN/엣지 5분 캐시
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      return res.status(200).json({ items: publicItems(items), activeDate: active ? active.date : null, sourceUrl: SOURCE_URL });
    }

    const requestedDate = query.today === '1' ? (active && active.date) : String(query.date || '');
    if (!requestedDate || !/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      return res.status(400).json({ error: '날짜를 확인할 수 없습니다.' });
    }
    const item = items.find(candidate => candidate.date === requestedDate);
    if (!item) {
      return res.status(404).json({ error: '이 날짜는 원문 목록에서 찾을 수 없습니다.' });
    }
    const mass = await fetchMass(item);
    // 본문: 1시간 캐시 (날짜별 고정 콘텐츠)
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({ mass, items: publicItems(items), activeDate: active ? active.date : null, sourceUrl: SOURCE_URL });
  } catch (error) {
    console.error('Daily Mass request failed:', error);
    const timedOut = error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? '매일미사 원문 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
        : '매일미사를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
};

// 테스트·재사용용 파서 노출 (Vercel 핸들러는 module.exports 함수 유지)
module.exports.parseMassItems = parseMassItems;
module.exports.parseSections = parseSections;
module.exports.htmlText = htmlText;
module.exports.SECTION_LABELS = SECTION_LABELS;
