// Vercel Serverless Function: /api/bible?book=Gn&chapter=1
// Proxies official Korean Catholic Bible (CBCK) HTML for offline caching in the app.

const FETCH_TIMEOUT_MS = 12000;

function allowOrigin(req, res) {
  const origin = req.headers && (req.headers.origin || req.headers.Origin);
  if (!origin) return; // same-origin / non-browser
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

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const book = String(req.query.book || '');
  const chapter = Number(req.query.chapter);
  if (!/^[A-Za-z0-9]+$/.test(book) || !Number.isInteger(chapter) || chapter < 1 || chapter > 150) {
    return res.status(400).json({ error: 'Invalid book or chapter.' });
  }

  const sourceUrl = `https://bible.cbck.or.kr/Knb/${encodeURIComponent(book)}/${chapter}`;
  try {
    const upstream = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'MalssumgilBibleReader/1.0 (Catholic Bible reading app)',
        Accept: 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: `Official Bible site returned ${upstream.status}.`
      });
    }
    const html = await upstream.text();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Bible-Source', 'https://bible.cbck.or.kr/Knb');
    return res.status(200).send(html);
  } catch (error) {
    const timedOut = error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return res.status(timedOut ? 504 : 502).json({
      error: timedOut
        ? 'Official Bible site did not respond in time.'
        : 'Could not retrieve the official Bible text.',
      detail: String((error && error.message) || error)
    });
  }
};
