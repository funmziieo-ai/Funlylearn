// FunlyLearn offline helper (service worker).
// Keeps FunlyLearn's own files on the phone so the app and website open
// fast, and still open on a weak connection.
// - App files (/assets/...), fonts and images: served from the phone
//   straight away, then refreshed quietly in the background.
// - Pages: always try the internet first (so updates show at once), and
//   use the saved copy only if the internet is slow (over 3 s) or offline.
// - Supabase, Paystack, voice and anything from other websites are never
//   touched here: they always go straight to the internet.

const CACHE = 'funlylearn-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isStaticFile(url) {
  return url.pathname.startsWith('/assets/') || /\.(js|css|woff2?|png|jpg|jpeg|webp|svg|mp3)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Pages: internet first, saved copy as backup.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const fresh = await Promise.race([
          fetch(req),
          new Promise((_, reject) => setTimeout(() => reject(new Error('slow')), 3000))
        ]);
        if (fresh && fresh.ok) cache.put('/', fresh.clone());
        return fresh;
      } catch (_e) {
        const saved = await cache.match('/');
        return saved || fetch(req);
      }
    })());
    return;
  }

  if (isStaticFile(url)) {
    // App files: saved copy first, refresh in the background.
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const saved = await cache.match(req);
      const refresh = fetch(req)
        .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => saved);
      return saved || refresh;
    })());
  }
});
