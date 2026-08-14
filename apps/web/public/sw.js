// Service Worker de emergemos: recibe notificaciones push y las muestra
// aunque la app/pestaña esté cerrada.

self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }
  const title = data.title || 'emergemos';
  const options = {
    body: data.body || '',
    icon: '/logo-wide.png',
    badge: '/logo-wide.png',
    vibrate: [120, 60, 120],
    data: { url: data.url || '/' },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ('focus' in w) { w.focus(); if (w.navigate) { try { w.navigate(url); } catch (e) {} } return; }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
