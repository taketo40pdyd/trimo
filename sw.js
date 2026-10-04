/* Trimo Service Worker（GitHub Pages 用）
 * - 同一オリジンのファイルは「ネットワーク優先、オフライン時はキャッシュ」
 * - FCM（プッシュ通知）のバックグラウンド受信に対応
 */
const CACHE = 'trimo-v1';
const PRECACHE = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {}))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// index.html の「更新あり」バーが送る合図
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // 外部（Firebase・為替API・フォント）は触らない
  if (url.searchParams.has('_')) return;                 // 更新チェック用リクエストはそのまま通す
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() =>
      caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
    )
  );
});

// ---- プッシュ通知（FCM） ----
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBdVa3bcZiNnTMrBlai3LBxkshjqpWM3K0",
  authDomain: "trimo-f6c80.firebaseapp.com",
  projectId: "trimo-f6c80",
  storageBucket: "trimo-f6c80.firebasestorage.app",
  messagingSenderId: "408102309897",
  appId: "1:408102309897:web:ebda5dbaf79133403fe8d8"
});

const messaging = firebase.messaging();

// data のみのメッセージのとき通知を表示（notification 付きは FCM が自動表示するため何もしない）
messaging.onBackgroundMessage((payload) => {
  if (payload.notification) return;
  const d = payload.data || {};
  self.registration.showNotification(d.title || 'Trimo', {
    body: d.body || '',
    icon: d.icon || 'icon-192.png',
    data: { url: d.url || './' }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) return c.focus(); }
      return self.clients.openWindow(url);
    })
  );
});
