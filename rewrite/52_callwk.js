'use strict';
function hpWkKey(raw){ return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']); }
function hpWkSetup(readable, writable, o){
  const kp = hpWkKey(o.key), salt = new Uint8Array(o.salt), enc = (o.op === 'enc'); let n = 0, bad = 0;
  const tf = new TransformStream({ async transform(frame, ctl){
    try{
      const key = await kp, data = new Uint8Array(frame.data);
      if(enc){
        const iv = new Uint8Array(12); iv.set(salt, 0); const c = (n++) >>> 0; iv[8] = c >>> 24; iv[9] = (c >>> 16) & 255; iv[10] = (c >>> 8) & 255; iv[11] = c & 255;
        const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, data));
        const out = new Uint8Array(4 + ct.length); out.set(iv.subarray(8), 0); out.set(ct, 4); frame.data = out.buffer;
      } else {
        if(data.length < 4 + 16){ bad++; return; }
        const iv = new Uint8Array(12); iv.set(salt, 0); iv.set(data.subarray(0, 4), 8);
        frame.data = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, data.subarray(4));
      }
      ctl.enqueue(frame);
    }catch(e){ bad++; }
  } });
  readable.pipeThrough(tf).pipeTo(writable).catch(() => {});
}
if('onrtctransform' in self){ self.onrtctransform = (e) => { try{ const t = e.transformer; hpWkSetup(t.readable, t.writable, t.options || {}); }catch(x){} }; }
self.onmessage = (e) => { try{ const o = e.data || {}; if(o && o.readable && o.writable) hpWkSetup(o.readable, o.writable, o); }catch(x){} };
