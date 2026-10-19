function bgReset(){ bgInterval=BG_MIN; }

let CURPEER=null;
const HIST_MAX=200;
function histKey(a){ return 'p2p_chat_'+a; }
function histOrd(x){ return (x&&typeof x.rx==='number'&&x.rx>0)?x.rx:((x&&x.d==='s')?hpPostTs(x):(Number(x&&x.ts)||0)); }
function hpPostTs(x){ const t0=Number(x&&x.ts)||0; try{ const h=hpXhNorm(x&&x.xh); if(h.length&&h[h.length-1].a==='b') return h[h.length-1].t; }catch(e){} return t0; }
function histSort(h){ return h.sort((x,y)=>histOrd(x)-histOrd(y)); }
function histLoad(a){ try{ const s=hpHGet(histKey(a)); const r=s?JSON.parse(s):[]; return Array.isArray(r)?histSort(r):[]; }catch(e){ return []; } }
function histSave(a,arr){   try{ hpHSet(histKey(a), JSON.stringify(arr)); }catch(e){ log(TL('lg_histsave',{err:e.message})); } if(CONV_OPEN&&a===CURPEER)lastOpenMark(a); convDirty(); }
function histAdd(a,dir,text,ts,pend,img,file,extra){ if(!a)return; const h=histLoad(a); const o={d:dir,t:text,ts:ts||Date.now()}; if(dir==='p')o.rx=Date.now();   if(pend)o.p=1; if(img)o.img=img; if(file)o.file=file; if(extra&&typeof extra==='object'){ if(typeof extra.fd==='string'&&/^[0-9a-f]{16}$/.test(extra.fd)) o.fd=extra.fd; }   h.push(o); histSave(a,h); sibMirror(a,o); }

function histVoided(a,ts){ return histLoad(a).some(x=>x.ts===ts&&x.d==='v'); }
const HP_VOID_READ_MS=24*3600e3;

function hpXhNorm(xh){ return Array.isArray(xh)?xh.filter(v=>v&&(v.a==='x'||v.a==='b')&&Number.isFinite(v.t)&&v.t>0).map(v=>({a:v.a,t:Math.round(v.t)})).slice(-20):[]; }
function hpXhLast(xh){ const h=hpXhNorm(xh); return h.length?h[h.length-1].a:''; }
function hpXhPush(m,a){ const h=hpXhNorm(m&&m.xh); h.push({a:a,t:Date.now()}); m.xh=h.slice(-20); return m.xh; }
function hpBackHdr(m){ return (m&&hpXhLast(m.xh)==='b')?{back:1,xh:hpXhNorm(m.xh)}:{}; }
function hpVoidIn(a,ts,opt){
  opt=opt||{}; ts=Number(ts); if(!a||!ts) return 'bad';
  const h=histLoad(a); const i=h.findIndex(x=>x.ts===ts&&(x.d==='p'||x.d==='v'));
  if(i>=0&&h[i].d==='v') return 'dup';
  const now=Date.now(), at=(Number.isFinite(opt.at)&&opt.at>0&&opt.at<=now+600e3)?opt.at:now, rd=i>=0&&!!(h[i].k||h[i].rs);
  if(rd&&!opt.force) return 'kept';
  if(i<0&&!(ts<now+600e3&&now-ts<8*86400e3)) return 'bad';
  const v={d:'v',ts:ts,u:now}; { const xh=hpXhNorm(opt.xh); v.xh=xh.length?xh:[{a:'x',t:at}]; }   v.rx=(i>=0&&typeof h[i].rx==='number')?h[i].rx:now;
  if(i>=0) h[i]=v; else { h.push(v); histSort(h); }
  histSave(a,h);
  try{ if(typeof sibDel==='function') sibDel(a,ts,'p'); }catch(e){}
  try{ if(CURPEER===a){ const el=(typeof findMsgEl==='function')?findMsgEl(ts):null, s=(typeof hpVoidEl==='function')?hpVoidEl(a,ts):null;
    if(el&&el.parentNode&&s) el.parentNode.replaceChild(s,el); else if(CONV_OPEN&&typeof histRender==='function') histRender(a); } }catch(e){}
  try{ updateBadges(); }catch(e){}
  return i<0?'new':'gone';
}
function hpVoidWhy(r){ return {gone:'未読の 1 通を消した（跡を残した）',new:'手元に無い 1 通（跡だけ残した。あとから届いても入れない）',kept:'開封なので残した（相手の画面に必ず残る）',dup:'もう取り消し済み',bad:'手元に無い 1 通（番号が古すぎるか先すぎるので、跡も残さない）'}[r]||r; }

function hpBackIn(a,ts,text,xh,extra){
  extra=extra||{}; ts=Number(ts); if(!a||!ts) return 'bad';
  const hist=hpXhNorm(xh); if(!hist.length||hist[hist.length-1].a!=='b') return 'bad';
  const h=histLoad(a); const i=h.findIndex(x=>x.ts===ts&&(x.d==='p'||x.d==='v'));
  if(i>=0&&h[i].d==='p'){ if(JSON.stringify(hpXhNorm(h[i].xh))!==JSON.stringify(hist)){ h[i].rx=Date.now(); histSort(h); }   h[i].xh=hist; histSave(a,h); try{ if(CURPEER===a&&CONV_OPEN&&typeof histRender==='function') histRender(a); }catch(e){} return 'same'; }
  const o={d:'p',t:String(text||''),ts:ts,rx:Date.now(),xh:hist}  ; if(extra.img)o.img=extra.img; if(extra.file)o.file=extra.file;
  if(i>=0) h[i]=o; else { h.push(o); histSort(h); }
  histSave(a,h); try{ if(typeof sibMirror==='function') sibMirror(a,o); }catch(e){}
  try{ if(CURPEER===a&&CONV_OPEN&&typeof histRender==='function'){ histRender(a); if(typeof hpReadSoon==='function') hpReadSoon(a); } }catch(e){}
  try{ notifySound('msg'); }catch(e){} try{ updateBadges(); }catch(e){}
  return i>=0?'back':'new';
}
function hpBackWhy(r){ return {back:'跡を元の 1 通に戻した（未読に戻る）',new:'跡が無かったので新しく入れた',same:'本文はもうあるので履歴だけ',bad:'形が違う（捨てた）'}[r]||r; }
function histClear(a){ try{ hpHDel(histKey(a)); }catch(e){} }
let WAIT_PEER=null;
let CALL_DEADLINE=0;
const SEEN=new Set();
async function digestOf(s){ return await sha256hex(s); }
let MODE='idle';

function nickFill(addr,name){
  try{
    const n=String(name||'').trim(); if(!n||!ID||!ID.contacts)return false;
    const c=ID.contacts.find(x=>x.address===addr); if(!c||c.nick)return false;
    c.nick=n.slice(0,24); saveID(); renderContacts(); return true;
  }catch(e){ return false; }
}
let REQUESTS=[];

function addrMatchesKey(addr,pubHex){   if(!addr||!pubHex)return null; if(!hpIdFmt(addr))return null; return null; }
async function fingerprintOf(pubHex){ return (await sha256hexBytes(hexToBytes(pubHex))); }

async function hpSafetyHalf(addr){ const h=new Uint8Array(await crypto.subtle.digest('SHA-512', new TextEncoder().encode('handpost-safety:v1:'+addr))); let s=''; for(let i=0;i<6;i++){ let n=0; for(let j=0;j<5;j++) n=n*256+h[i*5+j]; s+=String(n%100000).padStart(5,'0'); } return s; }
async function hpSafetyNum(me,peer){ if(!hpIdFmt(me)||!hpIdFmt(peer)||me===peer) throw new Error('安全番号の ID の形が違う'); const a=await hpSafetyHalf(me), b=await hpSafetyHalf(peer); return a<b?a+b:b+a; }
function hpSafetyFmt(num){ const g=String(num).match(/\d{5}/g)||[]; const rows=[]; for(let i=0;i<g.length;i+=4) rows.push(g.slice(i,i+4).join(' ')); return rows.join('\n'); }
function sameNickOther(nick,addr){ if(!nick)return null; const t=String(nick).trim().toLowerCase(); const hit=contacts().find(c=>c.address!==addr && String(c.nick||'').trim().toLowerCase()===t); return hit||null; }
function contacts(){ return (ID&&ID.contacts)||[]; }
function isContact(addr){ return contacts().some(c=>c.address===addr); }
function nickOf(addr){ const c=contacts().find(x=>x.address===addr); return c&&c.nick?c.nick:hpIdShort(addr); }
function saveID(){ if(ID) hpSecSet('p2p_id',JSON.stringify(ID));   try{ if(typeof hpSibSyncSoon==='function') hpSibSyncSoon(); }catch(e){} try{ if(typeof hpBkSoon==='function') hpBkSoon(); }catch(e){}   }

async function hpNickOk(addr,nick){
  if(!ID||!nick||(ID.contacts||[]).some(c=>c.address===addr)) return true;
  const other=sameNickOther(nick,addr); if(!other) return true;
  return await hpAsk({text:TF('cf_samenick',{nick:nick,addr:hpIdShort(other.address)})});
}
function addContact(addr,nick,nickOk){
  if(!ID)return false;
  if(!hpIdFmt(addr)){ alert(T('al_badaddr')); return false; }
  if(addr===ID.address){ alert(T('al_self')); return false; }
  ID.contacts=ID.contacts||[];
  const ex=ID.contacts.find(c=>c.address===addr);

  if(!ex && nick && nickOk!==true){ const other=sameNickOther(nick,addr); if(other){ if(nickOk!==false){ try{ log('同じ名前の別の相手がいるので足さなかった（先に hpNickOk で聞く）'); }catch(e){} } return false; } }
  if(ex){ if(nick&&ex.nick!==nick){ ex.nick=nick; ex.mt=Date.now(); } } else { ID.contacts.push({address:addr,nick:nick||'',mt:Date.now()}); }
  saveID(); renderContacts();
  return true;
}
function removeContact(addr,purge){ if(!ID)return;   const had=(ID.contacts||[]).some(c=>c.address===addr); ID.contacts=(ID.contacts||[]).filter(c=>c.address!==addr); if(had){ try{ if(typeof hpCdelMark==='function') hpCdelMark(addr,!!purge); }catch(e){} }   if(purge){ p2pPurgeAddr(addr); } saveID(); renderContacts(); }

function p2pPurgeAddr(addr){
  if(!addr)return;
  try{ histClear(addr); }catch(e){}
  try{ const lo=lastOpenLoad(); if(lo&&lo[addr]!==undefined){ delete lo[addr]; hpHSet(lastOpenKey(),JSON.stringify(lo)); } }catch(e){}
  try{ if(CURPEER===addr){ CURPEER=null; const m=$('#msgs'); if(m)m.innerHTML=''; } }catch(e){}
}

function p2pOrphans(){
  const out=[];
  try{
    const known=new Set(contacts().map(c=>c.address));
    const mine=(ID&&ID.address)?ID.address:'';
    for(const k of hpHKeys('p2p_chat_')){
      const a=k.slice(9);
      if(!a||a===mine||known.has(a))continue;
      let n=0; try{ const v=JSON.parse(hpHGet(k)); n=Array.isArray(v)?v.length:0; }catch(e){ n=0; }
      out.push({address:a,n:n});
    }
  }catch(e){}
  out.sort((a,b)=>(b.n-a.n)||String(a.address).localeCompare(String(b.address)));
  return out;
}

function p2pRenderOrphans(list){
  if(!list)return;
  const orph=p2pOrphans(); if(!orph.length)return;
  const box=document.createElement('div'); box.className='note'; box.style.cssText='margin-top:10px';
  const hd=document.createElement('div'); hd.textContent=TF('orph_title',{n:orph.length}); box.appendChild(hd);
  for(const o of orph){
    const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:8px;margin-top:6px;flex-wrap:wrap';
    const s=document.createElement('span'); s.textContent=hpIdShort(o.address)+' ('+o.n+')'; s.title=o.address;   s.style.cssText='font-size:11px;word-break:break-all;flex:1 1 auto';
    const kb=document.createElement('button'); kb.textContent=T('btn_orph_keep');
    kb.onclick=async()=>{ const n=prompt(T('pr_nick'),''); if(n===null)return; const nn=n.trim(); if(addContact(o.address,nn,await hpNickOk(o.address,nn)))renderContacts(); };
    const db=document.createElement('button'); db.className='del'; db.textContent=T('btn_orph_del');
    db.onclick=async()=>{ if(await hpAsk({text:TF('cf_orph_del',{addr:hpIdShort(o.address),n:o.n}), danger:true, ok:T('btn_ask_del')})){   p2pPurgeAddr(o.address); log(TL('lg_orph_del',{addr:o.address})); renderContacts(); } };
    row.appendChild(s); row.appendChild(kb); row.appendChild(db); box.appendChild(row);
  }
  const all=document.createElement('button'); all.className='del'; all.style.cssText='margin-top:8px'; all.textContent=TF('btn_orph_all',{n:orph.length});
  all.onclick=async()=>{ if(await hpAsk({text:TF('cf_orph_all',{n:orph.length}), danger:true, ok:T('btn_ask_del')})){   const c=orph.length; for(const o of orph)p2pPurgeAddr(o.address); log(TL('lg_orph_all',{n:c})); renderContacts(); } };
  box.appendChild(all); list.appendChild(box);
}
