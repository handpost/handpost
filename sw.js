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

function hpSwCapDb() { return new Promise((res, rej) => { try { const q = indexedDB.open('hp-cap', 1); q.onupgradeneeded = () => { try { q.result.createObjectStore('cap', { keyPath: 'key' }); } catch (x) { } }; q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error || new Error('idb')); } catch (x) { rej(x); } }); }
function hpSwCapPut(o) { try { return hpSwCapDb().then((db) => new Promise((res) => { try { const tx = db.transaction('cap', 'readwrite'); tx.objectStore('cap').put(o); tx.oncomplete = () => { db.close(); res(true); }; tx.onerror = () => { db.close(); res(false); }; } catch (x) { try { db.close(); } catch (y) { } res(false); } })).catch(() => false); } catch (x) { return Promise.resolve(false); } }
function hpSwCapTell(cs, o) { const m = { t: 'hp-cap', key: o.key, k: o.k, call: o.call, at: o.at, w: o.w, cap: o.cap }; try { for (const c of (cs || [])) { try { c.postMessage(m); } catch (x) { } } } catch (x) { } try { if (typeof BroadcastChannel === 'function') { const bc = new BroadcastChannel('hp-cap'); bc.postMessage(m); bc.close(); } } catch (x) { } }
function hpSwCapRec(d, k) { return { key: k + ':' + String(d.call || ''), k: k, call: String(d.call || ''), at: Number(d.at) || 0, w: Number(d.w) || 0, cap: String(d.cap || '') }; }

function hpSwCapGet(key) { try { return hpSwCapDb().then((db) => new Promise((res) => { try { const rq = db.transaction('cap', 'readonly').objectStore('cap').get(key); rq.onsuccess = () => { try { db.close(); } catch (x) { } res(rq.result || null); }; rq.onerror = () => { try { db.close(); } catch (x) { } res(null); }; } catch (x) { try { db.close(); } catch (y) { } res(null); } })).catch(() => null); } catch (x) { return Promise.resolve(null); } }
function hpSwCapName(call) { return hpSwCapGet('nm:' + String(call || '')).then((o) => (o && typeof o.nm === 'string' && o.nm && Date.now() - Number(o.at || 0) < 600000) ? o.nm : '').catch(() => ''); }
function hpSwSigText(k, nm, hx, ja) {
  if (k === 'callans') return ja ? (nm ? nm + ' が出ました。押すと話せます' : '通話の答えが届きました。押すと話せます') : (nm ? nm + ' answered. Tap to talk' : 'Call answered. Tap to talk');
  if (k === 'callgo') return ja ? (nm ? nm + ' と通話を始めます' : '通話を始めます') : (nm ? 'Starting the call with ' + nm : 'Starting the call');
  if (k === 'callend') { if (hx === 't') return ja ? '通話にはほかの端末で出ました' : 'The call was answered on another device'; return ja ? (nm ? nm + ' との通話が終わりました' : '通話が終わりました') : (nm ? 'The call with ' + nm + ' ended' : 'The call ended'); }
  return ja ? '通話の合図' : 'Call signal';
}
self.addEventListener('push', (e) => {
  let ja = true; try { ja = /^ja/i.test(String((self.navigator && self.navigator.language) || 'ja')); } catch (x) { }
  let ls = null; try { const d = e.data ? e.data.json() : null; if (d && d.x !== undefined) ls = hpSwLease(d, ja); } catch (x) { ls = null; }
  if (ls) { e.waitUntil(self.registration.showNotification('Handpost', { body: ls, tag: 'hp-lease', renotify: true, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })); return; }

  let cl = null; try { const d = e.data ? e.data.json() : null; if (d && d.c === 1) cl = d; } catch (x) { cl = null; }
  if (cl) {
    const w = Math.max(60000, Math.min(600000, (Number(cl.w) || 60) * 1000));
    const old = Date.now() - Number(cl.at || 0) > w;
    const body = old ? (ja ? '通話の着信がありました。Handpost を開いてください' : 'You missed a call. Open Handpost.') : (ja ? '通話の着信です。押すと Handpost が開きます' : 'Incoming call. Tap to open Handpost.');

    let lst = null; try { lst = self.clients.matchAll({ type: 'window', includeUncontrolled: true }); } catch (x) { lst = null; }
    const rec = (typeof cl.cap === 'string' && cl.cap) ? hpSwCapRec(cl, 'call') : null;
    e.waitUntil(Promise.resolve(lst || []).then((cs) => {
      let front = false; try { front = cs.some((c) => c.visibilityState === 'visible' && c.focused); } catch (x) { front = false; }
      const keep = rec ? hpSwCapPut(rec).then(() => hpSwCapTell(cs, rec)) : Promise.resolve();
      return keep.then(() => self.registration.showNotification('Handpost', Object.assign({ body: body, tag: 'hp-call', renotify: true, requireInteraction: !old && !front, silent: front, data: { call: String(cl.call || '') }, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' }, front ? {} : { vibrate: old ? [200] : [400, 200, 400, 200, 400, 200, 400] })))
        .then(() => hpSwNote({ t: Date.now(), at: Number(cl.at) || 0, front: front ? 1 : 0, ok: 1, n: Array.isArray(cs) ? cs.length : 0 }), (er) => hpSwNote({ t: Date.now(), at: Number(cl.at) || 0, front: front ? 1 : 0, n: Array.isArray(cs) ? cs.length : 0, ok: 0, why: String((er && er.message) || er).slice(0, 80) }));
    }).catch(() => self.registration.showNotification('Handpost', { body: body, tag: 'hp-call', renotify: true, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })));
    return;
  }
  let sg = null; try { const d = e.data ? e.data.json() : null; if (d && d.s === 1 && typeof d.k === 'string' && typeof d.cap === 'string' && d.cap) sg = d; } catch (x) { sg = null; }
  if (sg) {
    const rec = hpSwCapRec(sg, sg.k);
    let hx = ''; try { hx = String(JSON.parse(sg.cap).x || ''); } catch (x) { hx = ''; }
    let lw2 = null; try { lw2 = self.clients.matchAll({ type: 'window', includeUncontrolled: true }); } catch (x) { lw2 = null; }
    e.waitUntil(Promise.resolve(lw2 || []).catch(() => []).then((cs) => hpSwCapPut(rec).then(() => { hpSwCapTell(cs, rec); return cs; })).then((cs) => {
      const miss = (sg.k === 'callend') ? self.registration.getNotifications({ tag: 'hp-call' }).then((l) => { let had = false; for (const n of (l || [])) { try { if (n.data && n.data.call === rec.call) { had = true; n.close(); } } catch (x) { } } return had; }).catch(() => false) : Promise.resolve(false);
      return Promise.all([miss, hpSwCapName(rec.call)]).then((hn) => {
        const had = hn[0], nm = hn[1] || '';
        let live = false; try { live = Array.isArray(cs) && cs.some((c) => c.visibilityState === 'visible'); } catch (x) { live = false; }
        if (had && !(Array.isArray(cs) && cs.length)) {
          if (hx === 't') return self.registration.showNotification('Handpost', { body: hpSwSigText('callend', nm, hx, ja), tag: 'hp-call', renotify: false, silent: true, data: { call: rec.call, ended: 1 }, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
          return self.registration.showNotification('Handpost', { body: ja ? '通話の着信がありました。Handpost からかけ直せます' : 'You missed a call. You can call back from Handpost.', tag: 'hp-call', renotify: false, data: { call: rec.call, ended: 1 }, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
        }
        const loud = sg.k === 'callans' && !live;
        return self.registration.showNotification('Handpost', { body: hpSwSigText(sg.k, nm, hx, ja), tag: 'hp-sig', silent: !loud, data: { call: rec.call, k: sg.k }, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' })
          .then(() => { if (!live) return null; return self.registration.getNotifications({ tag: 'hp-sig' }).then((l) => { for (const n of (l || [])) n.close(); }); }).catch(() => { });
      });
    }));
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
  let call = false; try { call = e.notification.tag === 'hp-call'; } catch (x) { call = false; }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
    for (const c of cs) { if ('focus' in c) { if (call) { try { c.postMessage({ t: 'hp-call-open' }); } catch (x) { } } return c.focus(); } }
    return self.clients.openWindow(call ? '/#hpcall' : '/');
  }));
});
