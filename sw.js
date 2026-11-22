// Offline cache. Stale-while-revalidate: opens instantly from cache, fetches updates in the background
// (new version shows on the next open). Bump CACHE when the file list changes.
importScripts('logic.js'); // HabitLogic — used to build the reminder text
const CACHE = 'olyx-v4';
const STATE = 'olyx-state'; // data snapshot written by the page (the worker can't read localStorage)
const FILES = ['./', 'index.html', 'logic.js', 'manifest.json', 'icon-192.png', 'icon-512.png', 'icon-badge.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
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
    const fresh = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => cached);
    return cached || fresh;
  }));
});

// ---- daily reminder: the server sends an empty push at the chosen time; the text is built here ----
async function reminderText() {
  const L = self.HabitLogic;
  let st = null;
  try { st = await (await (await caches.open(STATE)).match('state')).json(); } catch (e) {}
  let data = st && st.data;
  // if sync is on, use the freshest data (the other device may have ticked things)
  if (st && st.sync && st.sync.gistId) {
    try {
      const r = await fetch(`https://api.github.com/gists/${st.sync.gistId}`, { cache: 'no-store',
        headers: { Authorization: 'Bearer ' + st.sync.token, Accept: 'application/vnd.github+json' } });
      const remote = JSON.parse((await r.json()).files['habits-data.json'].content);
      if (L.validate(remote)) data = data ? L.merge(data, remote) : remote;
    } catch (e) {}
  }
  if (!data || !data.habits.length) return { title: 'OLYX', body: 'Time for a quick check-in.' };
  const t = L.dayKey(new Date()), s = L.dayScore(data, t), ps = L.perfectStreak(data, t);
  if (L.isPaused(data, t) || !s.total) return { title: 'OLYX', body: 'Nothing planned today. Enjoy the rest.' };
  if (s.done === s.total) return { title: 'Day complete', body: ps > 1 ? `Perfect day locked in — ${ps} in a row.` : 'Everything done today. Nice work.' };
  const left = data.habits.filter(h => !h.archived && h.created <= t && L.isDue(data, h, t) && !L.isDone(data, h.id, t)).map(h => h.name);
  const n = left.length, names = left.slice(0, 3).join(', ') + (n > 3 ? ` +${n - 3}` : '');
  const plural = n === 1 ? '' : 's', hour = new Date().getHours();
  // 9:00 = plan for the day, 18:00 = what's left, 21:00 = last call (protect the streak)
  if (hour < 12) return { title: s.done ? `${n} to go today` : `Today: ${n} habit${plural}`, body: (ps ? `${ps}-day streak. ` : '') + names };
  if (hour < 20) return { title: `${n} habit${plural} left today`, body: names };
  return { title: ps ? `Keep your ${ps}-day streak alive` : 'Last call for today', body: `Still open: ${names}` };
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
