self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

function hpSwLease(d, ja) {
  const x = Math.floor(Number(d && d.x)), n = Math.floor(Number(d && d.d));
  if (!(x > 0) || !(n >= 1 && n <= 3650)) return null;
  const t = new Date(x), p = (v) => (v < 10 ? '0' : '') + v, w = (t.getMonth() + 1) + '/' + t.getDate() + ' ' + p(t.getHours()) + ':' + p(t.getMinutes());
  return ja ? '郵便受けの期限まであと ' + n + ' 日です（' + w + '）。延長は Handpost の郵便受けのタブから。'
    : 'Your mailbox expires in ' + n + (n === 1 ? ' day' : ' days') + ' (' + w + '). Extend it from the Mailbox tab in Handpost.';
}
self.addEventListener('push', (e) => {
  let ja = true; try { ja = /^ja/i.test(String((self.navigator && self.navigator.language) || 'ja')); } catch (x) { }
  let ls = null; try { const d = e.data ? e.data.json() : null; if (d && d.x !== undefined) ls = hpSwLease(d, ja); } catch (x) { ls = null; }
  if (ls) { e.waitUntil(self.registration.showNotification('Handpost', { body: ls, tag: 'hp-lease', renotify: true, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })); return; }

  let cl = null; try { const d = e.data ? e.data.json() : null; if (d && d.c === 1) cl = d; } catch (x) { cl = null; }
  if (cl) {
    const old = Date.now() - Number(cl.at || 0) > 60000;
    const body = old ? (ja ? '通話の着信がありました。Handpost を開いてください' : 'You missed a call. Open Handpost.') : (ja ? '通話の着信です。押すと Handpost が開きます' : 'Incoming call. Tap to open Handpost.');
    e.waitUntil(self.registration.showNotification('Handpost', { body: body, tag: 'hp-call', renotify: true, requireInteraction: !old, vibrate: old ? [200] : [400, 200, 400, 200, 400, 200, 400], icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' }));
    return;
  }
  let n = 0; try { const d = e.data ? e.data.json() : null; n = Math.floor(Number(d && d.n)); if (!(n >= 1 && n <= 99999)) n = 0; } catch (x) { n = 0; }
  const body = n > 0 ? (ja ? '郵便受けに手紙が ' + n + ' 通届いています' : 'Letters in your mailbox: ' + n) : (ja ? '手紙が届きました' : 'A letter has arrived');
  e.waitUntil(self.registration.showNotification('Handpost', { body: body, tag: 'hp-letter', renotify: true, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('/');
  }));
});
