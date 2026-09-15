const CACHES = { PAGE: 'pv-pages-v6', DATA: 'pv-data-v6' }

const FAILED_RESPONSE = new Response(null, { status: 503 })

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !Object.values(CACHES).includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

function mkUrl(urlStr) {
  try { return new URL(urlStr) } catch (_) { return null }
}

function sameOrigin(u) {
  return u && (u.protocol === 'http:' || u.protocol === 'https:')
}

async function cachePut(name, urlStr, res) {
  try {
    const u = mkUrl(urlStr)
    if (!sameOrigin(u) || !res || !res.ok) return
    const cache = await caches.open(name)
    await cache.put(u.origin + u.pathname, res.clone())
  } catch (_) {}
}

async function cacheGet(name, urlStr) {
  try {
    const u = mkUrl(urlStr)
    if (!sameOrigin(u)) return null
    const cache = await caches.open(name)
    return cache.match(u.origin + u.pathname)
  } catch (_) { return null }
}

function respond(promise) {
  return promise.then((r) => r || FAILED_RESPONSE).catch(() => FAILED_RESPONSE)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  let url = mkUrl(request.url)
  if (!sameOrigin(url)) return

  const p = url.pathname
  const dest = request.destination
  const isGet = request.method === 'GET'
  const isPost = request.method === 'POST'

  // Chunks estaticos (JS/CSS) - SOLO red, nunca cache
  if (isGet && (p.startsWith('/_next/static/') || dest === 'style' || dest === 'font' || dest === 'image' || url.origin !== self.location.origin)) {
    event.respondWith(respond(
      fetch(request).catch(() => FAILED_RESPONSE)
    ))
    return
  }

  // Navegacion (HTML) - network-first, cache fallback
  if (isGet && (dest === 'document' || request.mode === 'navigate')) {
    event.respondWith(respond(
      fetch(request).then((res) => {
        if (res && res.ok) cachePut(CACHES.PAGE, request.url, res.clone())
        return res
      }).catch(() => cacheGet(CACHES.PAGE, request.url))
    ))
    return
  }

  // API GET - network-first, cache fallback
  if (isGet && p.startsWith('/api/')) {
    event.respondWith(respond(
      fetch(request).then((res) => {
        if (res && res.ok) cachePut(CACHES.DATA, request.url, res.clone())
        return res
      }).catch(() => cacheGet(CACHES.DATA, request.url))
    ))
    return
  }

  // POST server actions (excepto login/cerrar) - network-first, cache fallback
  if (isPost && !p.includes('login') && !p.startsWith('/api/')) {
    event.respondWith(respond(
      fetch(request).then((res) => {
        if (res && res.ok && !p.includes('cerrar')) {
          cachePut(CACHES.DATA, request.url, res.clone())
        }
        return res
      }).catch(() => cacheGet(CACHES.DATA, request.url))
    ))
    return
  }
})
