self.addEventListener('install', () => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

function hpSwLease(d, ja) {
  const x = Math.floor(Number(d && d.x)), n = Math.floor(Number(d && d.d));
  if (!(x > 0) || !(n >= 1 && n <= 3650)) return null;
  const t = new Date(x), p = (v) => (v < 10 ? '0' : '') + v, w = (t.getMonth() + 1) + '/' + t.getDate() + ' ' + p(t.getHours()) + ':' + p(t.getMinutes());
  return ja ? '郵便受けの期限まであと ' + n + ' 日です（' + w + '）。延長は Handpost の郵便受けのタブから。'
    : 'Your mailbox expires in ' + n + (n === 1 ? ' day' : ' days') + ' (' + w + '). Extend it from the Mailbox tab in Handpost.';
}

function hpSwDb() { return new Promise((res, rej) => { try { const q = indexedDB.open('hp-diag', 1); q.onupgradeneeded = () => { try { q.result.createObjectStore('push', { autoIncrement: true }); } catch (x) { } }; q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); } catch (x) { rej(x); } }); }
function hpSwNote(o) { try { return hpSwDb().then((db) => new Promise((res) => { try { const tx = db.transaction('push', 'readwrite'); tx.objectStore('push').add(o); tx.oncomplete = () => { db.close(); res(); }; tx.onerror = () => { db.close(); res(); }; } catch (x) { res(); } })).catch(() => { }); } catch (x) { return Promise.resolve(); } }
self.addEventListener('push', (e) => {
  let ja = true; try { ja = /^ja/i.test(String((self.navigator && self.navigator.language) || 'ja')); } catch (x) { }
  let ls = null; try { const d = e.data ? e.data.json() : null; if (d && d.x !== undefined) ls = hpSwLease(d, ja); } catch (x) { ls = null; }
  if (ls) { e.waitUntil(self.registration.showNotification('Handpost', { body: ls, tag: 'hp-lease', renotify: true, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })); return; }

  let cl = null; try { const d = e.data ? e.data.json() : null; if (d && d.c === 1) cl = d; } catch (x) { cl = null; }
  if (cl) {
    const old = Date.now() - Number(cl.at || 0) > 60000;
    const body = old ? (ja ? '通話の着信がありました。Handpost を開いてください' : 'You missed a call. Open Handpost.') : (ja ? '通話の着信です。押すと Handpost が開きます' : 'Incoming call. Tap to open Handpost.');

    let lst = null; try { lst = self.clients.matchAll({ type: 'window', includeUncontrolled: true }); } catch (x) { lst = null; }
    e.waitUntil(Promise.resolve(lst || []).then((cs) => {
      let front = false; try { front = cs.some((c) => c.visibilityState === 'visible' && c.focused); } catch (x) { front = false; }
      return self.registration.showNotification('Handpost', { body: body, tag: 'hp-call', renotify: true, requireInteraction: !old && !front, vibrate: front ? [] : old ? [200] : [400, 200, 400, 200, 400, 200, 400], silent: front, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })
        .then(() => hpSwNote({ t: Date.now(), at: Number(cl.at) || 0, front: front ? 1 : 0, ok: 1 }), (er) => hpSwNote({ t: Date.now(), at: Number(cl.at) || 0, front: front ? 1 : 0, ok: 0, why: String((er && er.message) || er).slice(0, 80) }));
    }).catch(() => self.registration.showNotification('Handpost', { body: body, tag: 'hp-call', renotify: true, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })));
    return;
  }
  let n = 0; try { const d = e.data ? e.data.json() : null; n = Math.floor(Number(d && d.n)); if (!(n >= 1 && n <= 99999)) n = 0; } catch (x) { n = 0; }
  const body = n > 0 ? (ja ? '郵便受けに手紙が ' + n + ' 通届いています' : 'Letters in your mailbox: ' + n) : (ja ? '手紙が届きました' : 'A letter has arrived');

  let lw = null; try { lw = self.clients.matchAll({ type: 'window', includeUncontrolled: true }); } catch (x) { lw = null; }
  e.waitUntil(Promise.resolve(lw || []).catch(() => []).then((cs) => {
    let front = false; try { front = Array.isArray(cs) && cs.some((c) => c.visibilityState === 'visible' && c.focused); } catch (x) { front = false; }
    if (!front) return self.registration.showNotification('Handpost', { body: body, tag: 'hp-letter', renotify: true, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
    return self.registration.showNotification('Handpost', { body: body, tag: 'hp-letter', silent: true, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })
      .then(() => self.registration.getNotifications({ tag: 'hp-letter' })).then((l) => { for (const n of (l || [])) n.close(); }).catch(() => { });
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('/');
  }));
});
