/* 말씀의 길 서비스 워커
 * - 앱 화면(index, manifest, 아이콘, Chart.js)을 캐시해 오프라인에서도 앱이 열리도록 합니다.
 * - 성경 본문(/api/bible)은 앱이 IndexedDB에 직접 저장하므로 여기서는 건드리지 않습니다.
 * - 매일미사(/api/missa)는 원문에서 실시간 조회하며 저장하지 않습니다.
 * - 앱 파일을 바꿀 때는 CACHE_VERSION 숫자를 올리면 이전 캐시가 정리됩니다.
 */
const CACHE_VERSION = 'v33';
const CACHE_NAME = 'malssumgil-shell-' + CACHE_VERSION;
const CHART_URL = '/js/vendor/chart.umd.min.js';
const SHELL = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/storage.js',
  '/js/data.js',
  '/js/badges.js',
  '/js/app.js',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // 하나가 실패해도 설치 자체는 계속되도록 개별 처리
    await Promise.all(SHELL.map(u => cache.add(u).catch(() => {})));
    // 외부 스크립트(Chart.js)는 불투명 응답(no-cors)으로 저장
    try { await cache.put(CHART_URL, await fetch(new Request(CHART_URL, { mode: 'no-cors' }))); } catch (e) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('malssumgil-shell-') && k !== CACHE_NAME)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 성경 본문 API는 통과 (앱의 IndexedDB 캐시가 담당)
  if (url.origin === location.origin && url.pathname.startsWith('/api/')) return;

  // 화면 이동: 네트워크 우선, 실패하면 캐시된 앱 화면
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const path = new URL(req.url).pathname;
        const contentType = fresh.headers.get('content-type') || '';
        if (fresh.ok && contentType.includes('text/html') && (path === '/' || path === '/index.html')) {
          const cache = await caches.open(CACHE_NAME);
          cache.put('/', fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('/')) || (await cache.match(req)) ||
          new Response('오프라인입니다. 인터넷에 연결한 뒤 다시 열어 주세요.',
            { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  // 같은 출처 정적 파일과 Chart.js: 캐시 우선 + 백그라운드 갱신
  const cacheable = url.origin === location.origin || req.url === CHART_URL;
  if (!cacheable) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const hit = await cache.match(req);
    const refresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone()).catch(() => {});
      return res;
    }).catch(() => null);
    return hit || (await refresh) || Response.error();
  })());
});
