/* Šprotai service worker — offline play, and nothing else.
 *
 * WHY. The game needs no network to do anything it does: the tin is generated
 * from the date on the device, the art is inline SVG, the sound is synthesised
 * in the page, and every score lives in localStorage. It made literally zero
 * network requests to play. And yet without a service worker an installed copy
 * showed the browser's offline error page on a train — the one place a two
 * minute daily puzzle is most wanted.
 *
 * This does not weaken the single-file rule. That rule is that index.html
 * itself is self-contained and makes no external request; the manifest and the
 * icons have always been separate files beside it. Nothing here fetches
 * anything that was not already being fetched.
 *
 * NETWORK-FIRST FOR THE PAGE, deliberately. Cache-first is the usual advice
 * and it is the usual footgun: it pins everyone to the version they first
 * loaded, and the update only lands a navigation late. For a game that ships
 * by `git push` with no build step and no CI, being one push behind is exactly
 * the failure that cannot be debugged remotely. So an online visitor always
 * gets the live index.html, and the cache exists purely as the fallback. The
 * cost is that a cold start waits on the network — GitHub Pages already serves
 * this with max-age=600, so in practice that is the HTTP cache, not the wire.
 *
 * SCOPE. Only same-origin GETs for files this page actually owns are touched.
 * The Cloudflare analytics beacon (the `CFA` switch) and any Ko-fi link are
 * cross-origin and fall straight through to the network, unseen.
 */
const VERSION = "sprotai-v1";

/* Relative, so the worker keeps working in a project subpath or a staging
   subdirectory rather than only at a domain root. */
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
];

self.addEventListener("install", e => {
  // One bad URL must not fail the whole install and leave the game with no
  // offline copy at all, so each is added on its own and allowed to fail.
  e.waitUntil(caches.open(VERSION).then(c =>
    Promise.all(SHELL.map(u => c.add(new Request(u, { cache: "reload" })).catch(() => {})))
  ));
});

self.addEventListener("activate", e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    // Take control of the page that registered us, so the very first visit is
    // already offline-capable rather than the second.
    await self.clients.claim();
  })());
});

/** Network, but never hang on it: a captive portal or a dead cell answers
    neither yes nor no, and a daily puzzle should not spin for 30 seconds. */
function netFirst(req, timeout = 3500) {
  return new Promise(resolve => {
    let settled = false;
    const done = r => { if (!settled) { settled = true; resolve(r); } };
    const timer = setTimeout(() => done(null), timeout);
    fetch(req).then(r => { clearTimeout(timer); done(r); })
              .catch(() => { clearTimeout(timer); done(null); });
  });
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     // beacons, Ko-fi: not ours

  // The page itself: live when online, cached when not.
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const fresh = await netFirst(req);
      if (fresh && fresh.ok) {
        const copy = fresh.clone();
        // index.html and "/" are both navigation targets; keep both keys warm
        // so a subdirectory install and a root install behave the same.
        caches.open(VERSION).then(c => {
          c.put("./index.html", copy.clone()).catch(() => {});
          c.put("./", copy).catch(() => {});
        });
        return fresh;
      }
      return (await caches.match("./index.html", { ignoreSearch: true }))
          || (await caches.match("./", { ignoreSearch: true }))
          || Response.error();
    })());
    return;
  }

  // The icons and the manifest: cache-first, they change about once a year.
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    if (hit) return hit;
    const fresh = await netFirst(req);
    if (fresh && fresh.ok) {
      const copy = fresh.clone();
      caches.open(VERSION).then(c => c.put(req, copy).catch(() => {}));
      return fresh;
    }
    return fresh || Response.error();
  })());
});
