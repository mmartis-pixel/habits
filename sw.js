// Offline cache. Stale-while-revalidate: opens instantly from cache, fetches updates in the background.
// Bump CACHE on every release: the new worker installs fresh files and the page reloads once during the
// opening animation, so a new version shows on the first open.
importScripts('logic.js'); // HabitLogic — used to build the reminder text
const CACHE = 'olyx-v24';
const STATE = 'olyx-state'; // data snapshot written by the page (the worker can't read localStorage)
const FILES = ['./', 'index.html', 'logic.js', 'exercises.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-badge.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== STATE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  // only cache our own files — never GitHub API (sync must always see fresh data)
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const cached = await c.match(e.request, { ignoreSearch: true });
    const fresh = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => cached);
    return cached || fresh;
  }));
});

// ---- daily reminder: the server sends an empty push at the chosen time; the text is built here ----
async function reminderText() {
  const L = self.HabitLogic;
  let st = null;
  try { st = await (await (await caches.open(STATE)).match('state')).json(); } catch (e) {}
  let data = st && st.data;
  // signed in: use the freshest data (another device may have ticked things)
  if (st && st.sync && st.sync.session) {
    try {
      const r = await fetch('https://olyx-reminders.mmartis-99d.workers.dev/sync/pull', { method: 'POST', cache: 'no-store',
        headers: { Authorization: 'Bearer ' + st.sync.session, 'Content-Type': 'application/json' }, body: '{}' });
      const remote = (await r.json()).data;
      if (remote && L.validate(remote)) data = data ? L.merge(data, remote) : remote;
    } catch (e) {}
  }
  // same texts as the Android app's on-device reminders (logic.js); a push must always show something, so skip is ignored
  const { title, body } = L.reminderText(data, new Date());
  return { title, body };
}

self.addEventListener('push', e => {
  // never fail silently: if building the text breaks, still show a plain reminder
  e.waitUntil(reminderText().catch(() => ({ title: 'OLYX', body: 'Time for a quick check-in.' })).then(({ title, body }) => self.registration.showNotification(title, {
    body, icon: 'icon-192.png', badge: 'icon-badge.png', tag: 'olyx-daily', renotify: true,
  })));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => c.url.startsWith(self.registration.scope));
    return open ? open.focus() : self.clients.openWindow('./');
  }));
});
