'use strict';

// Run the existing Vercel-compatible API alongside the original static app.
// There are deliberately no runtime dependencies or account/data services.
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const bibleHandler = require('./api/bible');

const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const missaHandler = require('./api/missa');
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/sw.js', ['sw.js', 'application/javascript; charset=utf-8']],
  ['/manifest.webmanifest', ['manifest.webmanifest', 'application/manifest+json; charset=utf-8']],
  ['/css/app.css', ['css/app.css', 'text/css; charset=utf-8']],
  ['/js/app.js', ['js/app.js', 'application/javascript; charset=utf-8']],
]);
const iconTypes = { '.svg': 'image/svg+xml', '.png': 'image/png' };

function apiResponse(res) {
  res.status = function (statusCode) { this.statusCode = statusCode; return this; };
  res.json = function (value) {
    this.setHeader('Content-Type', 'application/json; charset=utf-8');
    this.end(JSON.stringify(value));
    return this;
  };
  res.send = function (value) { this.end(value); return this; };
  return res;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  const url = new URL(req.url, 'http://localhost');

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('ok');
    return;
  }
  if (url.pathname === '/api/bible') {
    req.query = Object.fromEntries(url.searchParams);
    try {
      await bibleHandler(req, apiResponse(res));
    } catch (error) {
      console.error('Bible API failed:', error);
      if (!res.headersSent) apiResponse(res).status(500).json({ error: 'Server error.' });
      else res.end();
    }
    return;
  }
  if (url.pathname === '/api/missa') {
    req.query = Object.fromEntries(url.searchParams);
    try {
      await missaHandler(req, apiResponse(res));
    } catch (error) {
      console.error('Daily Mass API failed:', error);
      if (!res.headersSent) apiResponse(res).status(500).json({ error: '매일미사 요청을 처리하지 못했습니다.' });
      else res.end();
    }
    return;
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end();
    return;
  }

  let entry = files.get(url.pathname);
  if (!entry && /^\/icons\/[a-zA-Z0-9._-]+\.(?:png|svg)$/.test(url.pathname)) {
    entry = [url.pathname.slice(1), iconTypes[path.extname(url.pathname)]];
  }
  if (!entry) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }
  try {
    const content = await fs.readFile(path.join(root, entry[0]));
    res.setHeader('Content-Type', entry[1]);
    if (url.pathname === '/sw.js') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Service-Worker-Allowed', '/');
    }
    res.writeHead(200);
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch (error) {
    console.error('Static file error:', error);
    res.writeHead(error.code === 'ENOENT' ? 404 : 500);
    res.end();
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`말씀의 길 listening on port ${port}`);
});
