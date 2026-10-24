var HPH_MEM={}, HPH_BOOTED=false, HPH_OPENED=false;

const HP_H_PLAIN=/^p2p_(chat|req|lastopen|sibsince)_|^p2p_(tk|tkrv|sibc|sibp|sibseen|seen)$/;
const HP_H_DB='handpost-hist', HP_H_ST='box', HP_H_CHUNK=200, HP_H_AD='handpost-hist:v1';
let HPH_DB=null, HPH_WROTE={}, HPH_DIRTY={}, HPH_TIMER=null, HPH_BUSY=false;
function hpHLog(s){ try{ if(typeof hpLog==='function') hpLog(s); else if(typeof log==='function') log(s); }catch(e){} }
function hpHKeyOn(){ try{ return !!(typeof VAULT_DK!=='undefined'&&VAULT_DK&&typeof ID!=='undefined'&&ID&&ID.address); }catch(e){ return false; } }
function hpHDisk(){ try{ return hpHKeyOn()&&typeof indexedDB!=='undefined'&&!!indexedDB; }catch(e){ return false; } }

function hpHGet(k){ return Object.prototype.hasOwnProperty.call(HPH_MEM,k)?HPH_MEM[k]:null; }
function hpHSet(k,v){ HPH_MEM[k]=String(v); hpHTouch(k); }
function hpHDel(k){ if(Object.prototype.hasOwnProperty.call(HPH_MEM,k)) delete HPH_MEM[k]; hpHTouch(k); }
function hpHKeys(pre){ return Object.keys(HPH_MEM).filter(k=>k.indexOf(pre)===0); }
function hpHTouch(k){ HPH_DIRTY[k]=1; if(!hpHDisk()||HPH_TIMER) return; HPH_TIMER=setTimeout(()=>{ HPH_TIMER=null; try{ hpHFlush(); }catch(e){} },400); }
function hpHDbOpen(){ if(HPH_DB) return Promise.resolve(HPH_DB); if(typeof indexedDB==='undefined'||!indexedDB) return Promise.resolve(null);
  return new Promise(res=>{ try{ const r=indexedDB.open(HP_H_DB,1); r.onupgradeneeded=()=>{ try{ r.result.createObjectStore(HP_H_ST); }catch(e){} }; r.onsuccess=()=>{ HPH_DB=r.result; res(HPH_DB); }; r.onerror=()=>res(null); }catch(e){ res(null); } }); }
function hpHK(){ return hpVWK('hist', VAULT_DK); }

function hpHPre(){ return hpHex(hpVWK('hist-acct', VAULT_DK)).slice(0,12); }
function hpHNm(name){ return hpHex(hpVWK('hist-name:'+name, VAULT_DK)).slice(0,16); }
function hpHRec(name,n){ return hpHPre()+'|'+hpHNm(name)+'|'+n; }
function hpHAd(rec){ return HP_H_AD+':'+rec; }

function hpHChunks(k){ const s=hpHGet(k); if(s==null) return [];
  if(k.indexOf('p2p_chat_')!==0) return [String(s)];
  let a=null; try{ a=JSON.parse(s); }catch(e){}
  if(!Array.isArray(a)) return [String(s)];
  const out=[]; for(let i=0;i<a.length;i+=HP_H_CHUNK) out.push(JSON.stringify(a.slice(i,i+HP_H_CHUNK)));
  return out; }
function hpHPut(db,name,n,txt){ let rec,key; try{ key=hpHRec(name,n); rec={v:1,at:Date.now(),box:hpVEnc(hpHK(), hp5S().from_string(JSON.stringify({k:name,n:n,t:txt})), hpHAd(key))}; }catch(e){ return Promise.resolve(false); }
  return new Promise(res=>{ try{ const tx=db.transaction(HP_H_ST,'readwrite'); tx.objectStore(HP_H_ST).put(rec,key); tx.oncomplete=()=>res(true); tx.onerror=()=>{ hpHErr(tx.error); res(false); }; }catch(e){ hpHErr(e); res(false); } }); }
function hpHDrop(db,name,n){ return new Promise(res=>{ try{ const tx=db.transaction(HP_H_ST,'readwrite'); tx.objectStore(HP_H_ST).delete(hpHRec(name,n)); tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); }catch(e){ res(false); } }); }

async function hpHFlush(){
  if(HPH_BUSY) return 0;
  if(!hpHDisk()) return -1;
  HPH_BUSY=true;
  try{
    const db=await hpHDbOpen(); if(!db) return -1;
    let wrote=0;
    for(const k of Object.keys(HPH_DIRTY)){
      delete HPH_DIRTY[k];
      const now=hpHChunks(k), was=HPH_WROTE[k]||[];
      for(let i=0;i<now.length;i++) if(now[i]!==was[i]){
        if(!(await hpHPut(db,k,i,now[i]))){
          if(!hpHIsFull(HPH_ERR)) return -1;
          HPH_BUSY_RETRY=true; let again=false; try{ again=await hpHFullHit('会話'); }finally{ HPH_BUSY_RETRY=false; }
          if(!again||!(await hpHPut(db,k,i,now[i]))) return -1;
        }
        wrote++; }
      for(let i=now.length;i<was.length;i++) await hpHDrop(db,k,i);
      if(now.length) HPH_WROTE[k]=now; else delete HPH_WROTE[k];
    }
    return wrote;
  }catch(e){ hpHLog('会話の保存でつまずいた：'+e.message); return -1; }
  finally{ HPH_BUSY=false; }
}

let HPH_ERR=null, HPH_FULL=0;
function hpHErr(e){ HPH_ERR=e||null; }
function hpHIsFull(e){ try{ return !!e&&(e.name==='QuotaExceededError'||e.code===22||/quota/i.test(String(e.message||e.name||''))); }catch(x){ return false; } }

async function hpHFullHit(what){
  const now=Date.now(); if(now-HPH_FULL<30000) return false; HPH_FULL=now;
  hpHLog('この端末の保存容量がいっぱいで '+what+' を書けなかった。古い本体を外して空ける');
  try{ if(typeof hpBanner==='function') hpBanner(T('bn_quota'),()=>{ try{ document.getElementById('t-set').click(); const sc=document.getElementById('store-card'); if(sc&&sc.scrollIntoView) sc.scrollIntoView({block:'start'}); }catch(e){} },'nag'); }catch(e){}
  let n=0; try{ n=await hpHSweep(true); }catch(e){}
  if(!n) hpHLog('外せる古い本体が無かった。写真やファイルを減らすか、ほかの端末で受け取ってください');
  return n>0;
}

async function hpHOpen(){
  if(!hpHDisk()) return 0;
  const db=await hpHDbOpen(); if(!db){ HPH_OPENED=true; try{ if(typeof hpReqLoad==='function') hpReqLoad(); }catch(e){} return 0; }
  const pre=hpHPre()+'|';
  const recs=await new Promise(res=>{ try{
      const tx=db.transaction(HP_H_ST,'readonly'), out=[];
      const q=tx.objectStore(HP_H_ST).openCursor(IDBKeyRange.bound(pre,pre+'\uffff'));
      q.onsuccess=e=>{ const c=e.target.result; if(!c){ res(out); return; } out.push([String(c.key),c.value]); c.continue(); };
      q.onerror=()=>res(out);
    }catch(e){ res([]); } });
  const got={}; let bad=0;
  for(const r of recs){
    let p=null; try{ p=JSON.parse(hp5S().to_string(hpVDec(hpHK(), r[1].box, hpHAd(String(r[0]))))); }catch(e){ bad++; continue; }
    if(!p||typeof p.k!=='string'||typeof p.t!=='string'){ bad++; continue; }
    (got[p.k]=got[p.k]||[])[Number(p.n)||0]=p.t;
  }
  let msgs=0, who=0;
  for(const name of Object.keys(got)){
    const cs=[]; for(const c of got[name]) if(typeof c==='string') cs.push(c);
    if(name.indexOf('p2p_chat_')===0){ let all=[]; for(const c of cs){ try{ const a=JSON.parse(c); if(Array.isArray(a)) all=all.concat(a); }catch(e){} } HPH_MEM[name]=JSON.stringify(all); msgs+=all.length; who++; }
    else HPH_MEM[name]=cs.length?cs[0]:'';
    HPH_WROTE[name]=cs;
  }
  HPH_BOOTED=true;
  if(bad) hpHLog('引き出しの会話のうち '+bad+' 件が開かなかった（別の鍵で封をしたもの）');
  hpHLog('封をした会話を開いた（相手 '+who+' 人・'+msgs+' 通）');
  HPH_OPENED=true; try{ if(typeof hpReqLoad==='function') hpReqLoad(); }catch(e){} try{ if(typeof hpNotesUi==='function') hpNotesUi(); }catch(e){}
  try{ if(typeof convDirty==='function') convDirty(); }catch(e){}
  try{ if(typeof updateBadges==='function') updateBadges(); }catch(e){}
  return msgs;
}

async function hpHMigrate(){
  const ks=[]; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&HP_H_PLAIN.test(k)) ks.push(k); } }catch(e){}
  if(!ks.length){ if(hpHDisk()){ try{ await hpHBlobMigrate(); }catch(e){} } return 0; }
  if(!hpHDisk()){ hpHLog('会話を封に移せなかった（鍵がまだ開いていない）。平文はそのまま残した'); return -1; }
  let n=0;
  for(const k of ks){ const v=localStorage.getItem(k); if(v==null) continue; if(!Object.prototype.hasOwnProperty.call(HPH_MEM,k)) HPH_MEM[k]=v; n++; }
  for(const k of Object.keys(HPH_MEM)) HPH_DIRTY[k]=1;
  const w=await hpHFlush();
  if(w<0){ hpHLog('会話を封に移せなかったので、平文はそのまま残した'); return -1; }
  let del=0; for(const k of ks){ try{ localStorage.removeItem(k); del++; }catch(e){} }
  HPH_BOOTED=true; HPH_OPENED=true;
  hpHLog('会話と申請を封に移した（'+n+' 件を読み、'+del+' 件の平文を消した）');
  try{ await hpHBlobMigrate(); }catch(e){}
  return n;
}

const HP_B_DB='p2pchat-blobs', HP_B_ST='blobs', HP_B_AD='handpost-blob:v1';
let HPB_DB=null; const HPB_MEM=new Map();
function hpBDbOpen(){ if(HPB_DB) return Promise.resolve(HPB_DB); if(typeof indexedDB==='undefined'||!indexedDB) return Promise.resolve(null);
  return new Promise(res=>{ try{ const r=indexedDB.open(HP_B_DB,1); r.onupgradeneeded=()=>{ try{ r.result.createObjectStore(HP_B_ST); }catch(e){} }; r.onsuccess=()=>{ HPB_DB=r.result; res(HPB_DB); }; r.onerror=()=>res(null); }catch(e){ res(null); } }); }
function hpBName(id){ return hpHPre()+'|b'+hpHNm('blob:'+id); }
function hpBEnc(pt,ad){ const s=hp5S(), n=s.randombytes_buf(24); return {n:hpHex(n), c:s.crypto_aead_xchacha20poly1305_ietf_encrypt(pt,s.from_string(ad),null,n,hpHK())}; }
function hpBDec(rec,ad){ const s=hp5S(); return s.crypto_aead_xchacha20poly1305_ietf_decrypt(null,new Uint8Array(rec.c),s.from_string(ad),hpBytes(rec.n),hpHK()); }
async function hpHBlobPut(id,blob){
  if(!hpHDisk()){ HPB_MEM.set(id,blob); return true; }
  const db=await hpBDbOpen(); if(!db){ HPB_MEM.set(id,blob); return true; }
  let rec,key; try{
    key=hpBName(id);
    const bytes=new Uint8Array(await blob.arrayBuffer()), hdr=new TextEncoder().encode(JSON.stringify({t:blob.type||''}));
    const pt=new Uint8Array(2+hdr.length+bytes.length); pt[0]=(hdr.length>>8)&255; pt[1]=hdr.length&255; pt.set(hdr,2); pt.set(bytes,2+hdr.length);
    const box=hpBEnc(pt,HP_B_AD+':'+key); rec={v:1,at:Date.now(),n:box.n,c:box.c,sz:box.c.length};
  }catch(e){ hpHLog('本体に封をできなかった：'+e.message); HPB_MEM.set(id,blob); return false; }

  return new Promise(res=>{ try{ const tx=db.transaction(HP_B_ST,'readwrite'); tx.objectStore(HP_B_ST).put(rec,key); tx.oncomplete=()=>{ HPB_MEM.delete(id); hpHSweepSoon();   res(true); }; tx.onerror=()=>{ hpHErr(tx.error); HPB_MEM.set(id,blob);   res(false); }; }catch(e){ hpHErr(e); HPB_MEM.set(id,blob); res(false); } });
}
async function hpHBlobGet(id){
  if(HPB_MEM.has(id)) return HPB_MEM.get(id);
  if(!hpHDisk()) return null;
  const db=await hpBDbOpen(); if(!db) return null;
  const key=hpBName(id);
  const rec=await new Promise(res=>{ try{ const tx=db.transaction(HP_B_ST,'readonly'); const q=tx.objectStore(HP_B_ST).get(key); q.onsuccess=()=>res(q.result||null); q.onerror=()=>res(null); }catch(e){ res(null); } });
  if(!rec) return null;
  if(!rec.c||!rec.n) return rec;
  try{ const pt=hpBDec(rec,HP_B_AD+':'+key), hl=(pt[0]<<8)|pt[1], h=JSON.parse(new TextDecoder().decode(pt.slice(2,2+hl)));
    return new Blob([pt.slice(2+hl)],{type:h.t||'application/octet-stream'}); }catch(e){ hpHLog('写真・ファイルの本体が開かなかった（別の鍵で封をしたもの）'); return null; }
}

async function hpHBlobMigrate(){
  if(!hpHDisk()) return 0;
  const db=await hpBDbOpen(); if(!db) return 0;
  const pre=ID.address+':';
  const olds=await new Promise(res=>{ try{ const tx=db.transaction(HP_B_ST,'readonly'), out=[];
      const q=tx.objectStore(HP_B_ST).openCursor(IDBKeyRange.bound(pre,pre+'￿'));
      q.onsuccess=e=>{ const c=e.target.result; if(!c){ res(out); return; } out.push([String(c.key),c.value]); c.continue(); };
      q.onerror=()=>res(out); }catch(e){ res([]); } });
  let n=0;
  for(const o of olds){
    const id=String(o[0]).slice(pre.length), b=o[1]; if(!id||!b||typeof b.arrayBuffer!=='function') continue;
    if(await hpHBlobPut(id,b)){ await new Promise(res=>{ try{ const tx=db.transaction(HP_B_ST,'readwrite'); tx.objectStore(HP_B_ST).delete(o[0]); tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); }catch(e){ res(false); } }); n++; }
  }
  let m=0; for(const id of Array.from(HPB_MEM.keys())){ if(await hpHBlobPut(id,HPB_MEM.get(id))) m++; }
  if(n||m) hpHLog('写真・ファイルの本体を封に移した（'+n+' 件の平文、'+m+' 件は手元から）');
  return n+m;
}

const HP_SW_CAP=0.8, HP_SW_HI=1.0, HP_SW_LO=0.98, HP_SW_NAG=0.9, HP_SW_WARN=0.8, HP_SW_KEEP=7*86400e3, HP_SV_MAX=100*1048576;
let HPS_BUSY=false, HPS_T=null, HPH_BUSY_RETRY=false;
function hpHMB(n){ n=Number(n)||0; return n>=1048576 ? (Math.round(n/104857.6)/10)+' MB' : (Math.round(n/102.4)/10)+' KB'; }
function hpHBytes(){ let n=0; for(const k in HPH_MEM) n+=String(HPH_MEM[k]||'').length; return n; }
async function hpHBlobBytes(){
  if(!hpHDisk()) return {n:0,bytes:0};
  const db=await hpBDbOpen(); if(!db) return {n:0,bytes:0};
  const pre=hpHPre()+'|b';
  return await new Promise(res=>{ try{ const tx=db.transaction(HP_B_ST,'readonly'); let n=0,bytes=0;
      const q=tx.objectStore(HP_B_ST).openCursor(IDBKeyRange.bound(pre,pre+'\uffff'));
      q.onsuccess=e=>{ const c=e.target.result; if(!c){ res({n:n,bytes:bytes}); return; } const v=c.value||{}; n++; bytes+=Number(v.sz)||((v.c&&v.c.length)||0); c.continue(); };
      q.onerror=()=>res({n:n,bytes:bytes}); }catch(e){ res({n:0,bytes:0}); } });
}
async function hpHUsage(){
  let usage=0, quota=0;
  try{ if(typeof navigator!=='undefined'&&navigator.storage&&navigator.storage.estimate){ const e=await navigator.storage.estimate(); usage=Number(e.usage)||0; quota=Number(e.quota)||0; } }catch(e){}
  const b=await hpHBlobBytes();
  const cap=quota*HP_SW_CAP;   return {usage:usage, quota:quota, cap:cap, ratio:cap?usage/cap:0, hist:hpHBytes(), blobs:b.bytes, blobN:b.n};
}

async function hpHSweep(force){
  if(HPS_BUSY||!hpHDisk()) return 0;
  const u=await hpHUsage(); if(!u.quota) return 0;
  if(!force) hpHWarn(u);
  if(!force&&u.ratio<HP_SW_HI) return 0;
  HPS_BUSY=true;
  try{
    const db=await hpBDbOpen(); if(!db) return 0;
    const now=Date.now(), cand=[];
    for(const k in HPH_MEM){
      if(k.indexOf('p2p_chat_')!==0) continue;
      let a=null; try{ a=JSON.parse(HPH_MEM[k]); }catch(e){}
      if(!Array.isArray(a)) continue;
      for(const m of a){ const id=(m.img&&m.img.id)||(m.file&&m.file.id); if(!id||m.xb) continue; const ts=Number(m.ts)||0; if(now-ts<HP_SW_KEEP) continue; cand.push({peer:k.slice(9),ts:ts,id:id,lost:!hpHRefetchable(k.slice(9)),sv:!!m.sv});   }
    }
    cand.sort((x,y)=>(x.lost&&!x.sv?1:0)-(y.lost&&!y.sv?1:0)||(y.sv?1:0)-(x.sv?1:0)||x.ts-y.ts);
    const target=u.cap*HP_SW_LO; let usage=u.usage, freed=0, n=0, lost=0;
    for(const c of cand){
      if(usage<=target&&!force) break;
      if(force&&n>=1&&usage<=target) break;
      const key=hpBName(c.id);
      const rec=await new Promise(res=>{ try{ const tx=db.transaction(HP_B_ST,'readonly'); const q=tx.objectStore(HP_B_ST).get(key); q.onsuccess=()=>res(q.result||null); q.onerror=()=>res(null); }catch(e){ res(null); } });
      if(rec){ await new Promise(res=>{ try{ const tx=db.transaction(HP_B_ST,'readwrite'); tx.objectStore(HP_B_ST).delete(key); tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); }catch(e){ res(false); } });
        const sz=Number(rec.sz)||((rec.c&&rec.c.length)||0); usage-=sz; freed+=sz; }
      try{ const h=histLoad(c.peer); let ch=false;
        for(const m of h){ const id=(m.img&&m.img.id)||(m.file&&m.file.id); if(id===c.id&&!m.xb){ m.xb=1; ch=true; } }
        if(ch) histSave(c.peer,h); }catch(e){}
      n++; if(c.lost&&!c.sv) lost++;
    }
    if(lost){ hpHLog('取り寄せ先の無い本体を '+lost+' 件外した（自分のほかの端末が無いため、戻せません）');
      try{ if(typeof hpBanner==='function') hpBanner(TF('bn_droplost',{n:lost}),()=>{ try{ document.getElementById('t-set').click(); const sc=document.getElementById('store-card'); if(sc&&sc.scrollIntoView) sc.scrollIntoView({block:'start'}); }catch(e){} },'nag'); }catch(e){} }
    if(n){ hpHLog('保存容量を空けた：古い本体 '+n+' 件を外した（'+hpHMB(freed)+'。自分のほかの端末で開いていれば取り寄せられます）');
      try{ if(typeof convDirty==='function') convDirty(); }catch(e){}
      try{ if(u.cap&&usage/u.cap>=HP_SW_NAG&&typeof hpBanner==='function') hpBanner(TF('bn_store',{mb:hpHMB(freed)}),()=>{ try{ document.getElementById('t-set').click(); const sc=document.getElementById('store-card'); if(sc&&sc.scrollIntoView) sc.scrollIntoView({block:'start'}); }catch(e){} },'nag'); }catch(e){}
    }
    try{ hpStoreUi(); }catch(e){}
    return n;
  }catch(e){ hpHLog('保存容量を空けられなかった：'+e.message); return 0; }
  finally{ HPS_BUSY=false; }
}

function hpHWarn(u){
  try{ if(!u||!u.cap||u.ratio>=HP_SW_HI) return;
    const lv=u.ratio>=HP_SW_NAG?2:u.ratio>=HP_SW_WARN?1:0; let st={}; try{ st=JSON.parse(hpHGet('p2p_stwarn')||'{}')||{}; }catch(e){ st={}; }
    if(!lv){ if(st.lv) hpHSet('p2p_stwarn','{}'); return; }
    const now=Date.now(); if((Number(st.lv)||0)>=lv&&now-(Number(st.at)||0)<86400e3) return;
    hpHSet('p2p_stwarn',JSON.stringify({lv:lv,at:now}));
    const pct=Math.floor(u.ratio*100); hpHLog('保存容量が '+pct+'%（使ってよい量＝ブラウザの許す量の 8 割）。帯で知らせた（まだ外さない）');
    if(typeof hpBanner==='function') hpBanner(TF(lv===2?'bn_st90':'bn_st80',{pct:pct}),()=>{ try{ document.getElementById('t-set').click(); const sc=document.getElementById('store-card'); if(sc&&sc.scrollIntoView) sc.scrollIntoView({block:'start'}); }catch(e){} },'nag');
  }catch(e){}
}

let HP_CRC=null;
function hpCrc32(u){ if(!HP_CRC){ HP_CRC=new Uint32Array(256); for(let n=0;n<256;n++){ let c=n; for(let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1); HP_CRC[n]=c>>>0; } }
  let c=0xffffffff; for(let i=0;i<u.length;i++) c=HP_CRC[(c^u[i])&255]^(c>>>8); return (c^0xffffffff)>>>0; }
function hpZip(files){
  const enc=new TextEncoder(), parts=[], cen=[]; let off=0;
  for(const f of files){
    const nm=enc.encode(f.name), d=new Date(Number(f.ts)||Date.now()), tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1),
          dt=((Math.max(1980,d.getFullYear())-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(), crc=hpCrc32(f.data), sz=f.data.length;
    const lh=new DataView(new ArrayBuffer(30)); lh.setUint32(0,0x04034b50,true); lh.setUint16(4,20,true); lh.setUint16(6,0x0800,true); lh.setUint16(8,0,true);
    lh.setUint16(10,tm,true); lh.setUint16(12,dt,true); lh.setUint32(14,crc,true); lh.setUint32(18,sz,true); lh.setUint32(22,sz,true); lh.setUint16(26,nm.length,true); lh.setUint16(28,0,true);
    parts.push(new Uint8Array(lh.buffer),nm,f.data);
    const ch=new DataView(new ArrayBuffer(46)); ch.setUint32(0,0x02014b50,true); ch.setUint16(4,20,true); ch.setUint16(6,20,true); ch.setUint16(8,0x0800,true); ch.setUint16(10,0,true);
    ch.setUint16(12,tm,true); ch.setUint16(14,dt,true); ch.setUint32(16,crc,true); ch.setUint32(20,sz,true); ch.setUint32(24,sz,true); ch.setUint16(28,nm.length,true); ch.setUint32(42,off,true);
    cen.push(new Uint8Array(ch.buffer),nm); off+=30+nm.length+sz;
  }
  let csz=0; for(const c of cen) csz+=c.length;
  const e=new DataView(new ArrayBuffer(22)); e.setUint32(0,0x06054b50,true); e.setUint16(8,files.length,true); e.setUint16(10,files.length,true); e.setUint32(12,csz,true); e.setUint32(16,off,true);
  const all=parts.concat(cen,[new Uint8Array(e.buffer)]); let n=0; for(const p of all) n+=p.length;
  const out=new Uint8Array(n); let o=0; for(const p of all){ out.set(p,o); o+=p.length; } return out;
}
function hpZipSafe(s){ s=(typeof hpFileName==='function')?hpFileName(s):String(s||''); s=s.replace(/[\\/:*?"<>|]/g,'_').trim(); return s||'_'; }
async function hpHSaveOld(){
  if(!hpHDisk()) return {n:0,bytes:0,left:0};
  const now=Date.now(), cand=[];
  for(const k in HPH_MEM){
    if(k.indexOf('p2p_chat_')!==0) continue;
    let a=null; try{ a=JSON.parse(HPH_MEM[k]); }catch(e){}
    if(!Array.isArray(a)) continue;
    for(const m of a){ const id=(m.img&&m.img.id)||(m.file&&m.file.id); if(!id||m.xb||m.sv||(m.file&&m.file.risk)) continue; const ts=Number(m.ts)||0;
      cand.push({peer:k.slice(9),ts:ts,id:id,lost:!hpHRefetchable(k.slice(9)),img:m.img||null,file:m.file||null}); }
  }
  cand.sort((x,y)=>(x.lost?1:0)-(y.lost?1:0)||x.ts-y.ts);
  const files=[], done=[], used={}; let tot=0;
  for(const c of cand){
    const b=await blobGet(c.id); if(!b) continue;
    const u8=new Uint8Array(await b.arrayBuffer()); if(files.length&&tot+u8.length>HP_SV_MAX) break;
    const dir=hpZipSafe((typeof nickOf==='function')?nickOf(c.peer):c.peer.slice(0,12));
    let base=c.file?hpZipSafe(c.file.name):('handpost-'+hpStamp(c.ts)+'.'+hpImgExt(b.type||(c.img&&c.img.mime)));
    let nm=dir+'/'+base, i=2; while(used[nm]){ const dot=base.lastIndexOf('.'); nm=dir+'/'+(dot>0?base.slice(0,dot)+'-'+i+base.slice(dot):base+'-'+i); i++; } used[nm]=1;
    files.push({name:nm,data:u8,ts:c.ts}); done.push(c); tot+=u8.length;
  }
  if(!files.length) return {n:0,bytes:0,left:0};
  const zip=hpZip(files);
  const ok=await hpBlobDownload(new Blob([zip],{type:'application/zip'}),'handpost-'+hpStamp(now)+'.zip');
  if(!ok) return {n:0,bytes:0,left:cand.length,cancel:1};
  const by={}; for(const c of done)(by[c.peer]=by[c.peer]||{})[c.id]=1;
  for(const p in by){ try{ const h=histLoad(p); let ch=false; for(const m of h){ const id=(m.img&&m.img.id)||(m.file&&m.file.id); if(id&&by[p][id]&&!m.sv){ m.sv=1; ch=true; } } if(ch) histSave(p,h); }catch(e){} }
  hpHLog('古い写真・ファイルの本体 '+files.length+' 件（'+hpHMB(tot)+'）を zip にして端末に保存した（残り '+(cand.length-done.length)+' 件）');
  return {n:files.length,bytes:tot,left:cand.length-done.length};
}

function hpHRefetchable(peer){

  try{ if(typeof ID!=='undefined'&&ID&&ID.link&&ID.link.main) return true; }catch(e){}
  try{ if(typeof hpCardOf==='function'&&typeof ID!=='undefined'&&ID){ const c=hpCardOf(ID.address); if(c&&c.devices&&c.devices.length>1) return true; } }catch(e){}
  return false;
}

const HP_KEEP_T=[0,365,180,90,30], HP_KEEP_B=[0,365,180,90,30]  , HP_KEEP_EVERY=6*3600e3;
function hpKeepDays(k){ const v=Number(hpHGet(k==='b'?'p2p_keep_b':'p2p_keep_t'))||0; return (k==='b'?HP_KEEP_B:HP_KEEP_T).indexOf(v)>=0?v:0; }
function hpKeepCut(k,now){ const d=hpKeepDays(k); return d?(now||Date.now())-d*864e5:0; }
function hpKeepTooOld(m){ const c=hpKeepCut('t'); return !!(c&&m&&!m.p&&(m.d==='s'||m.d==='p'||m.d==='v')&&histOrd(m)<c); }
async function hpKeepRun(dry){
  const out={t:0,b:0,drop:0}; if(typeof ID==='undefined'||!ID) return out;
  const now=Date.now(), ct=hpKeepCut('t',now), cb=hpKeepCut('b',now); if(!ct&&!cb) return out;
  const drop=new Set(), keep=new Set(), bid=m=>(m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||'';
  for(const k of Object.keys(HPH_MEM)){
    if(k.indexOf('p2p_chat_')!==0) continue; const peer=k.slice(9);
    const h=histLoad(peer), rest=[]; let ch=false;
    for(const m of h){ const o=histOrd(m), id=bid(m);
      if(ct&&!m.p&&!m.kp&&o<ct){   if(m.d==='s'||m.d==='p') out.t++; if(id&&(!m.xb||m.tr)) drop.add(id); ch=true; continue; }
      if(cb&&id&&!m.xb&&!m.p&&!m.kp&&o<cb){ out.b++; if(!dry){ m.xb=1; m.tr=now; } ch=true; }
      else if(id) keep.add(id);
      rest.push(m); }
    if(!dry&&ch) histSave(peer,rest);
  }
  const ids=[...drop].filter(id=>!keep.has(id)); if(!dry&&ids.length) out.drop=await hpHBlobDrop(ids);
  if(!dry&&(out.t||out.b)){ hpHLog('保存期間より古いものをこの端末から消した：手紙 '+out.t+' 通、本体 '+out.b+' 件（手紙 '+(hpKeepDays('t')||'無期限')+' 日・本体 '+(hpKeepDays('b')||'無期限')+' 日）'); try{ if(typeof convDirty==='function') convDirty(); }catch(e){} try{ if(typeof CURPEER!=='undefined'&&CURPEER&&typeof histRender==='function'&&typeof CONV_OPEN!=='undefined'&&CONV_OPEN) histRender(CURPEER); }catch(e){} }
  return out;
}
async function hpHBlobDrop(ids){
  let n=0; for(const id of ids){ try{ HPB_MEM.delete(id); }catch(e){} try{ if(typeof BLOBMEM!=='undefined'&&typeof blobKey==='function') BLOBMEM.delete(blobKey(id)); }catch(e){} }
  if(!hpHDisk()) return ids.length; const db=await hpBDbOpen(); if(!db) return 0;
  for(const id of ids){ const ok=await new Promise(res=>{ try{ const tx=db.transaction(HP_B_ST,'readwrite'); tx.objectStore(HP_B_ST).delete(hpBName(id)); tx.oncomplete=()=>res(true); tx.onerror=()=>res(false); }catch(e){ res(false); } }); if(ok) n++; }
  return n;
}
function hpKeepLabel(d){ return !d?T('kp_forever'):d===365?TF('kp_y',{n:1}):d%30===0?TF('kp_m',{n:d/30}):TF('kp_d',{n:d}); }
function hpKeepUi(){
  for(const k of ['t','b']){ const s=document.getElementById('kp-'+k); if(!s) continue; s.textContent='';
    for(const d of (k==='b'?HP_KEEP_B:HP_KEEP_T)){ const o=document.createElement('option'); o.value=String(d); o.textContent=hpKeepLabel(d); s.appendChild(o); }
    s.value=String(hpKeepDays(k)); s.onchange=()=>{ hpKeepPick(k,Number(s.value)||0); }; }
}
async function hpKeepPick(k,v){
  const key=k==='b'?'p2p_keep_b':'p2p_keep_t', old=hpKeepDays(k), msg=t=>{ const m=document.getElementById('kp-msg'); if(m) m.textContent=t||''; };
  hpHSet(key,String(v)); const dry=await hpKeepRun(true);
  if(!old&&v&&!(dry.t||dry.b)){ let ok0=false; try{ ok0=await hpAsk({text:T('cf_keep_first')}); }catch(e){ ok0=false; } if(!ok0){ hpHSet(key,String(old)); hpKeepUi(); msg(''); return false; } }
  if(dry.t||dry.b){ let ok=false; try{ ok=await hpAsk({text:TF('cf_keep',{t:dry.t,b:dry.b})}); }catch(e){ ok=false; }
    if(!ok){ hpHSet(key,String(old)); hpKeepUi(); msg(''); return false; }
    const r=await hpKeepRun(false); msg(TF('kp_done',{t:r.t,b:r.b})); }
  else msg(v?T('kp_none'):'');
  hpHLog('保存期間を変えた：'+(k==='b'?'写真・ファイルの本体':'手紙（文字）')+' '+(v?v+' 日':'無期限'));
  try{ hpStoreUi(); }catch(e){}
  return true;
}
function hpKeepTick(){ try{ if(typeof ID==='undefined'||!ID) return; if(hpHDisk()&&!HPH_OPENED) return; hpKeepRun(false).catch(()=>{}); }catch(e){} }
if(typeof window!=='undefined'&&window&&typeof window.addEventListener==='function'){ setTimeout(()=>{ hpKeepTick(); setInterval(hpKeepTick,HP_KEEP_EVERY); },30000); }
function hpHSweepSoon(){ if(HPS_T||!hpHDisk()) return; HPS_T=setTimeout(()=>{ HPS_T=null; try{ hpHSweep(false); }catch(e){} },3000); }

let HPH_PERSIST=null;
async function hpHPersist(){
  try{
    if(typeof navigator==='undefined'||!navigator.storage) return null;
    if(navigator.storage.persisted){ HPH_PERSIST=await navigator.storage.persisted(); }
    if(!HPH_PERSIST&&navigator.storage.persist){ HPH_PERSIST=await navigator.storage.persist(); }
    hpHLog(HPH_PERSIST?'ブラウザに「勝手に消さない」を頼んだ（受け入れられた）':'ブラウザは「勝手に消さない」を受け入れなかった（紙のバックアップを取っておいてください）');
    try{ hpStoreUi(); }catch(e){}
    return HPH_PERSIST;
  }catch(e){ return null; }
}

function hpStoreUiInit(){
  const sec=document.getElementById('p-set')||document.getElementById('p-id');   if(!sec||document.getElementById('store-card')) { hpStoreUi(); return; }
  const card=document.createElement('div'); card.className='card'; card.id='store-card';
  card.innerHTML='<h2 data-i18n="st_title"></h2><div id="store-bar" style="height:8px;border-radius:4px;background:var(--line,#334);overflow:hidden;margin:6px 0"><div id="store-fill" style="height:100%;width:0;background:var(--teal,#2dd4bf)"></div></div>'+
    '<div id="store-use" class="note"></div><div class="note" data-i18n="nt_store"></div><div id="store-parts" class="note"></div>'+
    '<div class="row" style="margin-top:8px"><button class="b" id="btn-store-save" data-i18n="btn_store_save" style="display:none"></button></div><div class="note" id="store-save-nt" data-i18n="st_save_nt" style="display:none"></div>'+
    '<div id="store-msg" class="note" style="color:var(--amber)"></div>'+
    '<details class="more"><summary data-i18n="st_more"></summary><div class="note" data-i18n="nt_store_more"></div><div id="store-cap" class="note"></div><div class="note" data-i18n="st_where" style="margin-top:6px"></div></details>';
  const kcard=document.createElement('div'); kcard.className='card'; kcard.id='keep-card';
  kcard.innerHTML='<h2 data-i18n="kp_title"></h2>'+
    '<div class="kv"><b data-i18n="kp_txt"></b><select id="kp-t" class="kp-sel"></select></div>'+
    '<div class="kv" style="margin-top:6px"><b data-i18n="kp_blob"></b><select id="kp-b" class="kp-sel"></select></div>'+
    '<div id="kp-msg" class="note" style="color:var(--amber)"></div>'+
    '<div class="note" data-i18n="nt_keep"></div>';
  const v=document.getElementById('set-mail')||document.getElementById('vault-card'); if(v&&v.parentNode) v.parentNode.insertBefore(card,v.nextSibling); else sec.appendChild(card);
  card.parentNode.insertBefore(kcard,card.nextSibling);
  const msg=t=>{ const m=document.getElementById('store-msg'); if(m) m.textContent=t||''; };

  const bs=document.getElementById('btn-store-save');
  if(bs) bs.onclick=()=>{ bs.disabled=true; msg(T('st_saving'));
    Promise.resolve(hpHSaveOld()).then(r=>{ msg(r&&r.n?TF(r.left?'st_saved_more':'st_saved',{n:r.n,mb:hpHMB(r.bytes),left:r.left}):(r&&r.cancel?'':T('st_save_none'))); })
      .catch(e=>{ msg(T('st_failed')); try{ hpHLog('端末に保存：'+(e&&e.message||e)); }catch(x){} })
      .then(()=>{ bs.disabled=false; hpStoreUi(); }); };
  try{ applyLang(); }catch(e){}
  try{ hpKeepUi(); }catch(e){}
  hpStoreUi();
}
function hpStoreUi(){
  const E=id=>document.getElementById(id); if(!E('store-card')) return;
  E('store-card').style.display=(typeof ID!=='undefined'&&ID)?'':'none'; if(E('keep-card')) E('keep-card').style.display=E('store-card').style.display;
  Promise.resolve(hpHUsage()).then(u=>{
    if(!E('store-use')) return;
    const pct=u.quota?Math.round(u.ratio*1000)/10:0;
    E('store-fill').style.width=Math.min(100,pct)+'%';
    E('store-fill').style.background=pct>=90?'var(--amber,#f59e0b)':'var(--teal,#2dd4bf)';
    E('store-use').textContent=u.quota?TF('st_use',{used:hpHMB(u.usage),quota:hpHMB(u.cap),pct:pct}):T('st_unknown');
    if(E('store-cap')) E('store-cap').textContent=u.quota?TF('st_cap',{raw:hpHMB(u.quota)}):'';
    E('store-parts').textContent=TF('st_parts',{hist:hpHMB(u.hist),blobs:hpHMB(u.blobs),n:u.blobN})+(HPH_PERSIST===null?'':'　'+T(HPH_PERSIST?'st_persist_on':'st_persist_off'));
    { const sv=!!(u.quota&&u.ratio>=HP_SW_WARN); if(E('btn-store-save')) E('btn-store-save').style.display=sv?'':'none'; if(E('store-save-nt')) E('store-save-nt').style.display=sv?'':'none'; }
  }).catch(()=>{});
}

function hpHWipe(){
  HPH_MEM={}; HPH_WROTE={}; HPH_DIRTY={}; HPH_BOOTED=false; HPH_OPENED=false;
  try{ if(HPH_DB){ try{ HPH_DB.close(); }catch(e){} HPH_DB=null; } }catch(e){}
  try{ HPB_MEM.clear(); if(HPB_DB){ try{ HPB_DB.close(); }catch(e){} HPB_DB=null; } }catch(e){}
  try{ if(typeof indexedDB!=='undefined'&&indexedDB&&indexedDB.deleteDatabase){ indexedDB.deleteDatabase(HP_H_DB); indexedDB.deleteDatabase(HP_B_DB); } }catch(e){}
  return true;
}

function hpHBoot(){
  if(HPH_BOOTED) return 0; HPH_BOOTED=true;
  let n=0;
  try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(!k||!HP_H_PLAIN.test(k)) continue; if(!Object.prototype.hasOwnProperty.call(HPH_MEM,k)){ HPH_MEM[k]=localStorage.getItem(k); n++; } } }catch(e){}
  return n;
}
hpHBoot();
