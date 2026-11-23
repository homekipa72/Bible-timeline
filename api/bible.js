// Vercel Serverless Function: /api/bible?book=Gn&chapter=1
// Proxies official Korean Catholic Bible (CBCK) HTML for offline caching in the app.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
      }
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
    return res.status(502).json({
      error: 'Could not retrieve the official Bible text.',
      detail: String((error && error.message) || error)
    });
  }
};
