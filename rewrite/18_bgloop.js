const POST_URL_DEFAULT='wss://localhost:8081';
const POST={ url:null, client:null, up:false, connecting:false, kp:null, pub:null, got:[], timer:null, retry:2000, retryI:0, gen:0, closing:null };
const HP_RETRY_STEPS=[2000,15000,60000,180000,300000];
const hpHex=u8=>Array.from(u8).map(b=>b.toString(16).padStart(2,'0')).join('');
const hpBytes=h=>Uint8Array.from(h.match(/../g).map(x=>parseInt(x,16)));
const hpText=o=>(typeof o==='string'?o:new TextDecoder().decode(o));
const hpLog=s=>log('post: '+s);
const HP_SEEN_KEEP=35*86400e3, HP_SEEN_MAX=5000;
let HP_SEEN=null;
function hpSeenLoad(){ if(HP_SEEN) return HP_SEEN; HP_SEEN=new Map(); try{ const o=JSON.parse(hpHGet('p2p_seen')||'{}');   for(const k in o) HP_SEEN.set(k,o[k]); }catch(e){} return HP_SEEN; }

function hpSeen(id, exp){ const s=hpSeenLoad(); if(s.has(id)) return true; s.set(id, (exp>Date.now()?exp:Date.now()+HP_SEEN_KEEP)); return false; }
function hpSeenSave(){
  const s=hpSeenLoad(), now=Date.now(); for(const [k,v] of s){ if(!(v>now)) s.delete(k); }
  while(s.size>HP_SEEN_MAX) s.delete(s.keys().next().value);
  try{ hpHSet('p2p_seen', JSON.stringify(Object.fromEntries(s))); }catch(e){ hpLog('見た番号を保存できない '+e.message); }
}

async function hpReady(){
  if(typeof HotPocket!=='object') throw new Error('HotPocket の束が読めていない（lib/browser.min.js）');
  if(window.sodium&&window.sodium.ready){ await window.sodium.ready; return; }
  for(let i=0;i<40;i++){ try{ await HotPocket.generateKeys(); return; }catch(e){ await sleep(250); } }
  throw new Error('libsodium が 10 秒たっても準備できない');
}

async function hpDevKey(){
  await hpReady();
  const raw=hpSecGet('p2p_devkey');
  try{ const s=JSON.parse(raw||'null'); if(s&&s.pub&&s.priv) return {publicKey:hpBytes(s.pub), privateKey:hpBytes(s.priv)}; }catch(e){}
  const kp=await HotPocket.generateKeys();
  hpSecSet('p2p_devkey', JSON.stringify({pub:hpHex(kp.publicKey), priv:hpHex(kp.privateKey)}));
  hpLog('端末鍵を新しく作った');
  return kp;
}
function hpPostUrl(){ return localStorage.getItem('p2p_post')||POST_URL_DEFAULT; }

async function hpClaimMsg(){ const me=await hp5Me(); if(POST.pub&&me.dev!==POST.pub) throw new Error('端末鍵が合わない'); const m={ op:'claim', id:me.id, master:me.master, devSig:me.devSig }; try{ const p=await hpPrekeyPub(); if(p&&p.dev===me.dev) m.pre={ x25519:p.x25519, notAfter:p.notAfter, sig:p.sig }; }catch(e){}   return m; }

let HP_SEND_WAIT=15000, HP_CLOSE_WAIT=3000;
function hpWithin(p,ms,what){ let t; const w=new Promise((_,rej)=>{ t=setTimeout(()=>{ const e=new Error(what+' が '+Math.round(ms/1000)+' 秒たっても戻らない'); e.hpTimeout=1; rej(e); },ms); }); return Promise.race([Promise.resolve(p),w]).finally(()=>clearTimeout(t)); }
function hpConnDrop(c,why){
  if(POST.client!==c) return false; POST.client=null; POST.up=false; POST.claimedId=null; dot('d-rly','warn'); hpLog(why+'。つながりを捨ててつなぎ直す'); try{ if(typeof hpMonRec==='function') hpMonRec(POST.url,'drop','own'); }catch(_){}
  try{ const p=c.close(); if(p&&p.then) POST.closing=p.catch(()=>{}); }catch(e){}
  hpRetryLater(POST.gen); return true;
}
function hpSend(obj){ if(!POST.up||!POST.client) return Promise.reject(new Error('つながっていない')); const c=POST.client, t0=Date.now(), hl=(ok,e)=>{ try{ if(typeof hpHlSent==='function') hpHlSent(ok,Date.now()-t0,e&&e.message); }catch(_){} };   return hpWithin(c.submitContractInput(JSON.stringify(obj)),HP_SEND_WAIT,'送り（'+String((obj&&obj.op)||'')+'）').then(v=>{ hl(true); return v; },e=>{ hl(false,e); throw e; }).catch(e=>{ if(e&&e.hpTimeout) hpConnDrop(c,e.message); throw e; }); }

function hpSync(){
  if(POST.timer){ clearTimeout(POST.timer); POST.timer=null; }
  const got=POST.got.splice(0);
  return hpSend({op:'sync',got:got}).catch(e=>{ POST.got.unshift(...got); hpLog('sync を送れない '+e.message); });
}
function hpSyncSoon(){ if(!POST.timer) POST.timer=setTimeout(()=>{ POST.timer=null; hpSync(); },1500); }

async function hpDeliver(m){
  let r; try{ r=await hpOpen(m); }catch(e){ e.hpOpen=1; throw e; } r.pt=(m&&Number(m.ts))||0;
  if(r.link){ hpLog('開けた '+r.id+' 連携の申し込み（端末 '+String(r.fromDev).slice(0,10)+'…）MAC ok'); await hpLinkOnReq(r); return; }
  hpLog('開けた '+r.id+' '+r.kind+' 送り手 '+r.from+'（端末 '+String(r.fromDev).slice(0,10)+'…）身元・MAC ok');
  if(hpGoneFrom(r)){ hpLog('外された機械からの手紙（捨てた）'); return; }
  if(!(await hpDevOk(r))){ hpLog('名刺に載っていない機械からの手紙（捨てた）'); return; }
  if(m&&typeof m.tk==='string'&&ID&&r.from&&r.from!==ID.address) hpTkNote(r.from,m.tk);
  if(r.kind==='msg'&&typeof hpKillLetter==='function'&&(await hpKillLetter(r))) return;
  if(typeof hpDead==='function'&&hpDead(r.from)){ hpLog('無効になった相手からの手紙（捨てた）'); return; }
  if(hpBlocked(r.from)){ hpLog('ブロック中の相手からの手紙（捨てた）'); return; }
  hpPreLearn(r);
  if(r.kind==='msg'&&(await hpSibLetter(r))) return;
  if(r.kind==='msg') await hpOnMsg(r);
  else { hpLog('合図 '+String(r.body).length+' 文字'); if(ID&&r.from===ID.address&&typeof sibOnSig==='function') await sibOnSig(r);   else if(typeof rtcOnSig==='function') await rtcOnSig(r); }
}
function hpOnOutput(o){
  try{ if(typeof hpHlOut==='function') hpHlOut(o); }catch(_){}
  if(HP_MPUT&&o&&(o.ok==='put'||(o.err&&HP_PUT_ERRS[o.err]))){ const w=HP_MPUT; HP_MPUT=null; w.res(o); return; }
  if(Array.isArray(o.push)){
    for(const m of o.push){
      POST.got.push(m.id);
      if(hpSeen(m.id, m.exp)){ hpLog('重複 '+m.id+'（2 回目なので捨てた）'); continue; }
      hpLog('手紙 '+m.id+' '+m.blob.length+' 文字');
      hpDeliver(m).catch(e=>{ hpLog('開けられない '+m.id+' '+e.message); if(e&&e.hpOpen) hpOpenFail(e); }).then(hpSeenSave);
    }
    hpLog('届いた '+o.push.length+' 通、残り '+o.left);
    if(o.push.length||o.left>0) hpSyncSoon();
  }
  else if(o.ok){ hpLog(o.ok+' ok'); hpLinkOnReply(o); }
  else if(o.err==='not owner'&&!ID){ dot('d-rly','warn'); }
  else if(o.err==='killed'&&o.id&&typeof hpKillLearn==='function'){ hpLog('拒否 killed（自分のポストが失効証明書を見せた）'); hpKillLearn(o,'自分のポスト').catch(()=>{}); }
  else if(o.err){ hpLog('拒否 '+o.err); hpLinkOnReply(o); if(o.err==='removed') hpOnRemoved(o).catch(()=>{}); if(o.err==='not owner'){ dot('d-rly','err'); POST.notOwner=true; hpBanner(T(POST.removed?'bn_removed_unproven':'bn_notowner')); hpLog('このポストの持ち主ではない（受け取れない。この状態のカードでは相手も送れない）'); } }
  else hpLog('返事 '+JSON.stringify(o).slice(0,120));
}
function hpRetryLater(gen){
  if(!BG_ON||POST.gen!==gen) return;
  const i=Math.min(POST.retryI||0,HP_RETRY_STEPS.length-1), ms=Math.max(HP_RETRY_STEPS[i],hpConnWait(hpConnKey(POST.url)));   POST.retryI=i+1; POST.retry=ms;
  hpLog(Math.round(ms/1000)+' 秒後につなぎ直す');
  POST.nextAt=Date.now()+ms; if(POST.retryT) clearTimeout(POST.retryT); POST.retryT=setTimeout(()=>{ POST.retryT=null; POST.nextAt=0; if(BG_ON&&POST.gen===gen){ if(HP_IOS&&hpHidden()){ POST.waitVis=gen;   hpLog('画面が裏にあるので、戻ってからつなぎ直す'); } else hpConnect(); } },ms);   try{ if(typeof hpSceneCap==='function') hpSceneCap(); }catch(e){}
}

const HP_RETRY_NOW_GAP=20000;
function hpRetryNow(why){ if(typeof BG_ON==='undefined'||!BG_ON||POST.up||POST.connecting||!POST.retryT) return false; if(Date.now()-(Number(POST.lastTry)||0)<HP_RETRY_NOW_GAP) return false; if(hpConnWait(hpConnKey(POST.url))>0) return false;   clearTimeout(POST.retryT); POST.retryT=null; POST.nextAt=0; hpLog((why||'')+'。待たずにつなぎ直す'); hpConnect(); return true; }
try{ if(typeof document!=='undefined'&&typeof document.addEventListener==='function') document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(HP_IOS&&BG_ON) hpSleepConn(); return; }   if(POST.waitVis&&POST.waitVis===POST.gen&&BG_ON&&!POST.up&&!POST.connecting){ POST.waitVis=0; hpLog('画面が戻った。つなぎ直す'); hpConnect(); } else hpRetryNow('画面が戻った'); try{ if(POST.up&&typeof hpResendKick==='function') hpResendKick(); }catch(e){}   }); if(typeof window!=='undefined'&&typeof window.addEventListener==='function') window.addEventListener('online',()=>hpRetryNow('回線が戻った')); }catch(e){}

const HP_CONN_WIN=600000, HP_CONN_MAX=4, HP_CONN_LOG=new Map(); let HP_CONN_SLOW=4000;

let HP_IOS=false; try{ HP_IOS=typeof navigator!=='undefined'&&!!navigator&&(/iPhone|iPad|iPod/.test(String(navigator.userAgent||''))||(navigator.platform==='MacIntel'&&Number(navigator.maxTouchPoints)>1)); }catch(e){}
function hpSleepConn(){
  let n=0; try{ for(const p of HP_POOL.values()){ p.up=false; if(p.t) clearTimeout(p.t); try{ const r=p.c.close(); if(r&&r.catch) r.catch(()=>{}); }catch(e){} n++; } HP_POOL.clear(); }catch(e){}
  const c=POST.client; if(c){ try{ if(typeof hpMonRec==='function') hpMonRec(POST.url,'close','own'); }catch(_){}   POST.client=null; POST.up=false; POST.claimedId=null; try{ const p=c.close(); if(p&&p.then) POST.closing=p.catch(()=>{}); }catch(e){} }
  if(HP_MPUT){ const w=HP_MPUT; HP_MPUT=null; try{ w.res({err:'自分の郵便受けにつながらない'}); }catch(e){} }
  if(POST.retryT){ clearTimeout(POST.retryT); POST.retryT=null; POST.nextAt=0; }
  POST.waitVis=POST.gen; POST.retryI=0;
  try{ if(typeof dot==='function') dot('d-rly','warn'); }catch(e){}
  hpLog('画面が裏に回ったので、郵便受けとのつなぎをいったん閉じた（iOS。戻ったらすぐつなぎ直す'+(n?'。使い回しのつなぎ '+n+' 本も':'')+'）');
  return !!c;
}
function hpHidden(){ try{ return typeof document!=='undefined'&&!!document&&document.hidden===true; }catch(e){ return false; } }
function hpConnKey(urls){ return (Array.isArray(urls)?urls:[urls]).map(String).join(' '); }
function hpConnWait(key){ const now=Date.now(); const a=(HP_CONN_LOG.get(key)||[]).filter(t=>now-t<HP_CONN_WIN); HP_CONN_LOG.set(key,a); return a.length<HP_CONN_MAX?0:(a[0]+HP_CONN_WIN-now); }
function hpConnNote(key){ const a=HP_CONN_LOG.get(key)||[]; a.push(Date.now()); HP_CONN_LOG.set(key,a); return a.filter(t=>Date.now()-t<HP_CONN_WIN).length; }
const HP_CONN_OK=new Map();
function hpConnCount(key,up,t0){ const now=Date.now(); if(up){ HP_CONN_OK.set(key,now); return hpConnNote(key); } const ok=Number(HP_CONN_OK.get(key))||0; return (now-t0>=HP_CONN_SLOW&&ok&&now-ok<HP_CONN_WIN)?hpConnNote(key):0; }
function hpPostNone(){ try{ if(localStorage.getItem('p2p_post')) return false; const h=(typeof location!=='undefined'&&location)?String(location.hostname||''):''; return !!h&&!/^(localhost|127\.0\.0\.1)$/.test(h); }catch(e){ return false; } }
async function hpConnect(){
  if(POST.connecting||POST.up) return;
  if(typeof hpPostNone==='function'&&hpPostNone()){ if(!POST.noPostSaid){ POST.noPostSaid=1; hpLog('郵便受けの場所がまだ無いので、つながない（郵便受けを借りる・サブ端末としてつなぐとつなぐ）'); } return; }
  if(typeof ID!=='undefined'&&!ID&&!HP_JOIN){ if(!POST.noIdSaid){ POST.noIdSaid=1; hpLog('身元がまだ無いので、郵便受けにはつながない（連携を申し込むとき・身元を作ったときにつなぐ）'); } return; }
  POST.connecting=true; POST.tries=(POST.tries||0)+1; POST.lastTry=Date.now();     const gen=POST.gen;
  try{
    if(POST.closing){ const p=POST.closing; POST.closing=null; try{ await hpWithin(p,HP_CLOSE_WAIT,'前のつながりを閉じる'); }catch(e){ hpLog('前のつながりが '+Math.round(HP_CLOSE_WAIT/1000)+' 秒で閉じない。そのまま進む'); } if(!BG_ON||POST.gen!==gen) return; }
    const kp=await hpDevKey(); POST.kp=kp; POST.pub=hpHex(kp.publicKey); POST.url=hpPostUrl();
    const c=await HotPocket.createClient([POST.url], kp);
    c.on(HotPocket.events.contractOutput, r=>{ for(const out of r.outputs){ let o; try{ o=JSON.parse(hpText(out)); }catch(e){ continue; } try{ hpOnOutput(o); }catch(e){ hpLog('出力の処理で失敗 '+e.message); } } });
    c.on(HotPocket.events.disconnect, ()=>{ if(POST.client!==c) return; POST.client=null; POST.up=false; dot('d-rly','warn'); hpLog('切れた'); try{ if(typeof hpMonRec==='function') hpMonRec(POST.url,'drop','own'); }catch(_){}   hpRetryLater(gen); });
    dot('d-rly','warn');
    const t0c=Date.now(), okc=await c.connect(); hpConnCount(hpConnKey(POST.url),okc,t0c);   try{ if(typeof hpMonRec==='function') hpMonRec(POST.url,okc?'ok':'fail','own'); }catch(_){}
    if(!okc) throw new Error('接続できない '+POST.url);
    if(!BG_ON||POST.gen!==gen){ try{ if(typeof hpMonRec==='function') hpMonRec(POST.url,'close','own'); }catch(_){}   try{ await c.close(); }catch(e){} return; }
    if(HP_IOS&&hpHidden()){ try{ await c.close(); }catch(e){} POST.waitVis=gen; try{ if(typeof hpMonRec==='function') hpMonRec(POST.url,'close','own'); }catch(_){}   hpLog('つながったが画面が裏なので閉じた（iOS。戻ったらつなぎ直す）'); return; }
    POST.client=c; POST.up=true; POST.tries=0; POST.retry=2000; POST.retryI=0; POST.notOwner=false; POST.removed=false; hpBanner(null); try{ if(typeof hpVaultNag==='function') hpVaultNag(); }catch(e){}   dot('d-rly','ok');
    try{ if(typeof hpSceneCap==='function') hpSceneCap(); }catch(e){}
    hpLog('接続 '+POST.url+' 端末鍵 '+POST.pub.slice(0,10)+'…');
    POST.claimedId=null; try{ const cm=await hpWithin(hpClaimMsg(),HP_SEND_WAIT,'名乗りの中身'); await hpSend(cm); POST.claimedId=cm.id; }catch(e){ if(e&&e.hpTimeout){ hpConnDrop(c,e.message); e.hpDropped=1; throw e; } hpLog('名乗れない '+e.message); }
    await hpSync(); if(POST.client!==c) return;
    hpResendKick();
    hpRvFlush().catch(()=>{});
    try{ if(typeof hpMoveFirst==='function'&&(await hpMoveFirst())&&POST.client!==c) return; }catch(e){}
    hpSibAnnounce().catch(e=>{ try{ hpLog('自分の機械へ知らせられない '+e.message); }catch(_){} });
    try{ if(typeof sibKick==='function') sibKick(true); }catch(e){}
    try{ if(typeof hpBkKick==='function') hpBkKick().catch(()=>{}); }catch(e){}
    try{ if(typeof hpDevFill==='function') hpDevFill('connect').catch(()=>{}); }catch(e){} try{ if(typeof hpMoveKick==='function') hpMoveKick().catch(()=>{}); }catch(e){}   try{ if(typeof hpBoxKick==='function') hpBoxKick().catch(()=>{}); }catch(e){}
    try{ if(typeof hpVlPaperTell==='function') hpVlPaperTell().catch(()=>{}); }catch(e){}
  }catch(e){ if(e&&e.hpDropped) return;   dot('d-rly','err'); hpLog(e.message); hpRetryLater(gen); }
  finally{ POST.connecting=false; }
}
function startBg(){ if(typeof hpKillMe==='function'&&hpKillMe()){ if(POST.up||POST.connecting){ try{ stopBg(); }catch(e){} }   try{ hpKillBoot(); }catch(e){} return; }   if(typeof HP_TAB_OFF!=='undefined'&&HP_TAB_OFF) return;   BG_ON=true; try{ hpReqLoad(); }catch(e){} try{ hpNoreadUi(); }catch(e){}   if(!HP_RS_TIMER) HP_RS_TIMER=setInterval(()=>{ try{ if(typeof hpHlTick==='function') hpHlTick(); }catch(_){}   if(BG_ON&&ID&&POST.up){ hpResendKick(); if(CURPEER&&CONV_OPEN) hpReadSoon(CURPEER); } },15000); try{ if(typeof sibStart==='function') sibStart(); }catch(e){}   if(POST.up){ hpReclaim(); return; } if(!POST.connecting){ POST.gen++; POST.retry=2000; hpConnect(); } }

async function hpReclaim(){
  if(ID&&POST.up&&!POST.claiming&&POST.claimedId!==ID.address){
    POST.claiming=true;
    const c0=POST.client;
    try{ const cm=await hpWithin(hpClaimMsg(),HP_SEND_WAIT,'名乗りの中身'); await hpSend(cm); POST.claimedId=cm.id; POST.notOwner=false; POST.removed=false; hpBanner(null); try{ if(typeof hpVaultNag==='function') hpVaultNag(); }catch(e){}   dot('d-rly','ok'); hpLog('身元が変わったので、管理人に名乗り直した'); try{ if(typeof hpBkKick==='function') hpBkKick().catch(()=>{}); }catch(e){}
      hpSibAnnounce().catch(()=>{}); try{ if(typeof sibKick==='function') sibKick(true); }catch(e){} }
    catch(e){ if(e&&e.hpTimeout){ if(c0) hpConnDrop(c0,e.message); } else hpLog('名乗れない '+e.message); }
    finally{ POST.claiming=false; }
  }
  return hpSync();
}
function stopBg(){ BG_ON=false; POST.gen++; POST.claimedId=null; try{ if(typeof sibStop==='function') sibStop(); }catch(e){}   if(POST.timer){ clearTimeout(POST.timer); POST.timer=null; } const c=POST.client; POST.client=null; POST.up=false; if(c){ try{ if(typeof hpMonRec==='function') hpMonRec(POST.url,'close','own'); }catch(_){}   try{ const p=c.close(); if(p&&p.then) POST.closing=p.catch(()=>{}); }catch(e){} }   dot('d-rly','off'); const bp=document.getElementById('bg-pill'); if(bp) bp.style.display='none'; }
function kickBg(){ if(POST.up) hpSync(); else startBg(); }

function hpIssue(ttlMs){
  if(!POST.kp) throw new Error('端末鍵がまだ無い（接続してから）');
  if(!window.sodium||!sodium.crypto_sign_detached) throw new Error('libsodium が見えない（window.sodium）');
  const now=Date.now();
  const t={ id:hpHex(crypto.getRandomValues(new Uint8Array(16))), iss:POST.pub, exp:now+(ttlMs||3600e3), iat:now };
  const msg='handpost-token:v1:'+t.id+':'+t.exp+':'+(t.iat||'')+':'+(t.prev||'')+':'+(t.prevExp||'');
  t.sig=hpHex(sodium.crypto_sign_detached(sodium.from_string(msg), POST.kp.privateKey.slice(1)));
  return JSON.stringify(t);
}

async function hpCard(days){
  if(!POST.up) throw new Error('つながっていない（自分のポストの場所が要る）');
  if(POST.notOwner) throw new Error(T('e_card_notowner'));
  const me=await hp5Me();
  if(me.dev!==POST.pub) throw new Error('端末鍵が接続中のものと違う');

  const now=Date.now(), devices=[me.dev], devSigs={[me.dev]:me.devSig}, prekeys=[await hpPrekeyPub()];
  for(const d of hpSibs()){
    if(devices.length>=HP_DEV_MAX) break;
    if(devices.indexOf(d.dev)>=0||!hpPreValid(d.pre,d.dev,now)||!(await hp5IdOk(me.id,me.master,d.dev,d.devSig))) continue;
    devices.push(d.dev); devSigs[d.dev]=d.devSig; prekeys.push({dev:d.dev,x25519:d.pre.x25519,notAfter:d.pre.notAfter,sig:d.pre.sig});
  }
  const out={ v:3, id:me.id, master:me.master, post:[POST.url], devices:devices, devSigs:devSigs, token:JSON.parse(hpIssue((days||30)*86400e3)), prekeys:prekeys };
  { const dk={}; dk[me.dev]=hpDevKindOf(hpDevLabelGuess()); for(const d of hpSibs()){ if(devices.indexOf(d.dev)>=0&&!dk[d.dev]) dk[d.dev]=hpDevKindOf(d.label); } out.devKinds=dk; }
  const gone=hpMyGone().filter(g=>devices.indexOf(g.dev)<0).map(g=>({dev:g.dev,ts:g.ts,sig:g.sig})); if(gone.length) out.gone=gone;
  const nm=hpCardNameOf({name:(typeof myName==='function')?myName():''}); if(nm) out.name=nm;
  return JSON.stringify(out);
}

const HP_POOL_IDLE=20000, HP_PUT_WAIT=15000;
const HP_POOL=new Map();
const HP_PUT_ERRS={refused:1,'bad letter':1,'too big':1,'rate limit':1,'post full':1};
let HP_MPUT=null, HP_MPUT_CHAIN=Promise.resolve();
const HP_POOL_OPENING=new Map();
async function hpPoolGet(urls, fail){
  const key=hpConnKey(urls); const p0=HP_POOL.get(key);
  if(p0&&p0.up){ if(p0.t){ clearTimeout(p0.t); p0.t=null; } return p0; }
  const w0=HP_POOL_OPENING.get(key); if(w0){ const p1=await w0.catch(()=>null); if(p1&&p1.up){ if(p1.t){ clearTimeout(p1.t); p1.t=null; } return p1; } }
  const job=hpPoolOpen(urls,fail,key); HP_POOL_OPENING.set(key,job); try{ return await job; } finally { if(HP_POOL_OPENING.get(key)===job) HP_POOL_OPENING.delete(key); }
}
async function hpPoolOpen(urls, fail, key){
  if(HP_IOS&&hpHidden()) throw fail('画面が裏にある間は新しくつながない（戻ってから投函する）','wait');
  const w=hpConnWait(key); if(w>0) throw fail('同じ郵便受けへ新しくつなぐのが多すぎる（'+Math.ceil(w/1000)+' 秒後から）','wait');
  let c; try{ c=await HotPocket.createClient(urls, await HotPocket.generateKeys()); }catch(e){ throw fail('相手のポストにつながらない '+key,'wait'); }
  const p={c:c,replies:[],chain:Promise.resolve(),t:null,up:false,key:key};
  c.on(HotPocket.events.contractOutput, r=>{ for(const out of r.outputs){ try{ p.replies.push(JSON.parse(hpText(out))); }catch(e){} } });
  try{ c.on(HotPocket.events.disconnect, ()=>{ p.up=false; if(HP_POOL.get(key)===p) HP_POOL.delete(key); }); }catch(e){}
  const t0=Date.now(); let up=false; try{ up=await c.connect(); }catch(e){ up=false; }
  const n=hpConnCount(key,up,t0);   try{ if(typeof hpMonRec==='function') hpMonRec((Array.isArray(urls)?urls[0]:urls),up?'ok':'fail','peer'); }catch(_){}
  if(!up){ try{ await c.close(); }catch(e){} throw fail('相手のポストにつながらない '+key,'wait'); }
  p.up=true; HP_POOL.set(key,p); hpLog('郵便受けにつないだ '+key+'（この 10 分で '+n+' 回目）');
  return p;
}
function hpPoolIdle(p){ if(p.t) clearTimeout(p.t); p.t=setTimeout(()=>{ p.t=null; if(HP_POOL.get(p.key)===p) HP_POOL.delete(p.key); p.up=false; try{ const r=p.c.close(); if(r&&r.catch) r.catch(()=>{}); }catch(e){} },HP_POOL_IDLE); try{ if(p.t&&p.t.unref) p.t.unref(); }catch(e){} }
function hpPoolAsk(p, obj){
  const run=async()=>{ p.replies.length=0; const t0=Date.now(); try{ await p.c.submitContractInput(JSON.stringify(obj)); }catch(e){ return {r:{err:'相手のポストにつながらない'},ms:Date.now()-t0}; } while(!p.replies.length&&p.up&&Date.now()-t0<HP_PUT_WAIT) await sleep(50); return {r:p.replies.shift()||{err:p.up?'15 秒待っても返事がない':'相手のポストにつながらない'}, ms:Date.now()-t0}; };
  const q=p.chain.then(run,run); p.chain=q.catch(()=>{}); return q.finally(()=>hpPoolIdle(p));
}
function hpMainAsk(obj){
  const run=()=>new Promise(res=>{ const t0=Date.now(); let tm=null; const w={res:o=>{ if(tm) clearTimeout(tm); res({r:o,ms:Date.now()-t0}); }}; HP_MPUT=w; tm=setTimeout(()=>{ if(HP_MPUT===w){ HP_MPUT=null; res({r:{err:'15 秒待っても返事がない'},ms:Date.now()-t0}); } },HP_PUT_WAIT); hpSend(obj).catch(()=>{ if(HP_MPUT===w){ HP_MPUT=null; if(tm) clearTimeout(tm); res({r:{err:'自分の郵便受けにつながらない'},ms:Date.now()-t0}); } }); });
  const q=HP_MPUT_CHAIN.then(run,run); HP_MPUT_CHAIN=q.catch(()=>{}); return q;
}

const HP_PART_KEY='p2p_part', HP_PART_MAX=40, HP_PART_CHARS=1000000, HP_PART_KEEP=7*86400e3;
let HP_PART_LIST=[], HP_PART_LOADED=false, HP_PART_BUSY=false, HP_PART_DIRTY=false;
function hpPutFail(msg,k){ const e=(msg instanceof Error)?msg:new Error(msg); e.hpk=k||hpFailKind(e.message); e.hpWhy=e.message; return e; }

function hpPutGroups(card, letters){
  const out=[], idx={}, boxes=(card&&Array.isArray(card.boxes))?card.boxes:[];
  for(const L of (Array.isArray(letters)?letters:[])){
    const b=boxes.find(x=>x&&x.dev===L.dev&&typeof x.post==='string'&&x.post&&x.token&&typeof x.token.id==='string');
    const post=b?[b.post]:card.post, token=b?b.token:card.token, k=post.join(' ')+'|'+((token&&token.id)||'');
    let g=idx[k]; if(!g){ g=idx[k]={ post:post, token:token, letters:[] }; out.push(g); } g.letters.push(L); }
  return out; }
async function hpPutOne(g, id, kind, link){
  const req={ op:'put', token:g.token, id:id, kind:kind, letters:g.letters };
  if(g.ring===true&&kind==='msg') req.ring=true;
  if(g.keep===true&&kind==='msg') req.keep=true;
  const mine=!link&&g.post.length===1&&typeof POST!=='undefined'&&POST.up&&!!POST.client&&g.post[0]===POST.url;
  const a=mine?(await hpMainAsk(req)):(await hpPoolAsk(await hpPoolGet(g.post,hpPutFail),req));
  const r=a.r;
  hpLog('投函 '+id+' → '+g.post[0]+(mine?'（常時のつなぎ）':'')+' '+g.letters.length+' 通 '+g.letters[0].blob.length+' 文字 '+a.ms+' ms '+(r.ok?'ok':'拒否'+(hpFailKind(r.err)==='peer'?'':' '+r.err)));
  if(r.err==='killed'&&typeof hpKillLearn==='function'){ try{ await hpKillLearn(r,'投函の返事'); }catch(e){} }
  if(!r.ok){ try{ console.debug('post: put rejected:', r.err); }catch(e){} throw hpPutFail(String(r.err)); }
  return { exp:r.exp }; }

function hpPartReady(){ try{ if(typeof hpHGet!=='function'||typeof hpHSet!=='function') return false;
  const vault=(typeof hpVaultOn==='function')?!!hpVaultOn():(typeof hpHDisk==='function'&&!!hpHDisk()); return !(vault&&!(typeof HPH_OPENED!=='undefined'&&HPH_OPENED)); }catch(e){ return false; } }
function hpPartOk(p){ return !!(p&&typeof p.id==='string'&&typeof p.peer==='string'&&Number(p.at)>0&&Array.isArray(p.letters)&&p.letters.length&&p.letters.every(L=>L&&typeof L.dev==='string'&&typeof L.blob==='string')); }
function hpPartLoad(){ if(HP_PART_LOADED||!hpPartReady()) return false; HP_PART_LOADED=true;
  let a=null; try{ const s=hpHGet(HP_PART_KEY); a=s?JSON.parse(s):null; }catch(e){ a=null; }
  for(const p of (Array.isArray(a)?a:[])){ if(hpPartOk(p)&&!HP_PART_LIST.some(x=>x.id===p.id)) HP_PART_LIST.push(p); }
  HP_PART_LIST.sort((x,y)=>x.at-y.at); return true; }
function hpPartSave(){ hpPartLoad(); if(!HP_PART_LOADED||!hpPartReady()) return false;
  try{ if(HP_PART_LIST.length) hpHSet(HP_PART_KEY,JSON.stringify(HP_PART_LIST)); else if(hpHGet(HP_PART_KEY)!==null&&typeof hpHDel==='function') hpHDel(HP_PART_KEY); HP_PART_DIRTY=false; return true; }catch(e){ return false; } }
function hpPartTrim(){ const size=p=>p.letters.reduce((n,L)=>n+L.blob.length,0); let tot=HP_PART_LIST.reduce((n,p)=>n+size(p),0);
  while(HP_PART_LIST.length>1&&(HP_PART_LIST.length>HP_PART_MAX||tot>HP_PART_CHARS)){ tot-=size(HP_PART_LIST.shift()); } }
function hpPartAdd(id, kind, peer, letters){ if(kind!=='msg'||!peer||!Array.isArray(letters)||!letters.length) return false; hpPartLoad();
  const now=Date.now(); HP_PART_LIST=HP_PART_LIST.filter(x=>x.id!==id); HP_PART_LIST.push({ id:id, kind:kind, peer:peer, at:now, last:now, n:1, letters:letters.map(L=>({dev:L.dev,blob:L.blob})) });
  hpPartTrim(); HP_PART_DIRTY=true; hpPartSave(); return true; }
function hpPartDrop(id){ hpPartLoad(); const n=HP_PART_LIST.length; HP_PART_LIST=HP_PART_LIST.filter(x=>x.id!==id); if(HP_PART_LIST.length===n) return false; HP_PART_DIRTY=true; hpPartSave(); return true; }

async function hpPartRun(force){
  hpPartLoad(); if(HP_PART_BUSY||!HP_PART_LIST.length||typeof ID==='undefined'||!ID) return 0; HP_PART_BUSY=true; let done=0;
  try{
    for(const p of HP_PART_LIST.slice()){
      const now=Date.now(), gone=why=>{ HP_PART_LIST=HP_PART_LIST.filter(x=>x!==p); HP_PART_DIRTY=true; if(why) hpLog('入れ直しをやめた '+p.id+'（'+why+'）'); };
      if(now-p.at>HP_PART_KEEP){ gone('7 日たった'); continue; }
      const card=hpCardOf(p.peer); if(!card||!Array.isArray(card.devices)){ gone('住所録に相手がいない'); continue; }
      if(hpBlocked(p.peer)) continue;
      if(!force&&now-(p.last||p.at)<(HP_RS_STEPS[(p.n||1)-1]||HP_RS_LAST)) continue;
      const live=p.letters.filter(L=>card.devices.indexOf(L.dev)>=0); if(!live.length){ gone('宛先の端末が名刺から消えた'); continue; }
      const rest=[]; let okN=0;
      for(const g of hpPutGroups(card, live)){ try{ await hpPutOne(g, p.id, p.kind, false); okN+=g.letters.length; }catch(e){ if((e&&e.hpk)!=='self') rest.push.apply(rest,g.letters); } }
      done+=okN; p.letters=rest; p.n=(p.n||1)+1; p.last=Date.now(); HP_PART_DIRTY=true;
      if(!rest.length){ gone(''); hpLog('入れ直した '+p.id+' → '+nickOf(p.peer)+'（'+okN+' 通。全部の郵便受けに入った）'); }
    }
  } finally { HP_PART_BUSY=false; if(HP_PART_DIRTY) hpPartSave(); }
  return done; }
async function hpPut(card, body, kind, opt){
  const fail=hpPutFail, link=!!(opt&&opt.link);
  if(!card||!Array.isArray(card.post)||!Array.isArray(card.devices)||!card.token) throw fail('カードの形が違う','peer');
  await hpReady();
  let sealed; try{ sealed=await hpSeal(card, body, kind, link); }catch(e){ throw fail(e, /長すぎる/.test(e.message)?'self':'peer'); }
  const id=sealed.id, groups=hpPutGroups(card, sealed.letters);
  if(opt&&opt.ring) for(const g of groups) g.ring=true;
  if((opt&&opt.keep)||(kind==='msg'&&typeof body==='string'&&body.startsWith('{"v":1,"type":"card",'))) for(const g of groups) g.keep=true;
  if(groups.length<2){ const r=await hpPutOne(groups[0], id, sealed.kind, link); return { id:id, exp:r.exp }; }
  const res=await Promise.all(groups.map(g=>hpPutOne(g, id, sealed.kind, link).then(r=>({ok:true,exp:r.exp}),e=>({ok:false,e:e}))));
  const bad=[]; let okN=0, exp=0; res.forEach((x,i)=>{ if(x.ok){ okN++; if(Number(x.exp)>exp) exp=Number(x.exp); } else bad.push({g:groups[i],e:x.e}); });
  if(!okN){ const pick=k=>bad.find(x=>x.e&&x.e.hpk===k); throw (pick('self')||pick('wait')||bad[0]).e; }
  if(!bad.length) return { id:id, exp:exp||undefined };
  const letters=[]; for(const x of bad){ if(!(x.e&&x.e.hpk==='self')) letters.push.apply(letters,x.g.letters); }
  const kept=!link&&typeof ID!=='undefined'&&!!ID&&card.id!==ID.address&&hpPartAdd(id, sealed.kind, card.id, letters);
  hpLog('投函 '+id+'：郵便受け '+groups.length+' つのうち '+okN+' つに入った（残り '+letters.length+' 通は'+(kept?'あとで入れ直す':'入れ直さない')+'）');
  return { id:id, exp:exp||undefined, part:bad.length };
}

function hpCErr(k,msg){ const e=new Error(msg); e.hpc=k; return e; }
function hpCardNameOf(card){ try{ const s=(card&&typeof card.name==='string')?card.name:''; return s.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g,'').trim().slice(0,24); }catch(e){ return ''; } }
function hpCardWhy(e){ const k=(e&&e.hpc)||'bad'; return ({form:'al_card_form',old:'al_card_old',self:'al_card_self',noid:'al_card_noid'})[k]||'al_card_bad'; }
async function hpCardCheck(card){
  await hpReady();
  if(!card||card.v!==3||!Array.isArray(card.post)||!card.post.length||!Array.isArray(card.devices)||!card.devices.length||!card.devSigs||typeof card.devSigs!=='object'||!Array.isArray(card.prekeys)||!card.token||typeof card.token!=='object') throw hpCErr('form','カードの形が違う（v3 でない）');
  if(card.devices.length>5||card.post.length>4) throw hpCErr('form','端末かポストの数が多すぎる');
  if(card.devKinds!==undefined){ if(!card.devKinds||typeof card.devKinds!=='object'||Array.isArray(card.devKinds)) delete card.devKinds; else { const dk={}; for(const d of card.devices){ const v=card.devKinds[d]; if(HP_DEV_KINDS.indexOf(v)>=0) dk[d]=v; } card.devKinds=dk; } }
  for(const u of card.post){ if(typeof u!=='string'||!/^wss:\/\/[^\s"'<>]+$/.test(u)) throw hpCErr('form','ポストの場所が wss:// でない'); }
  const now=Date.now();
  for(const dev of card.devices){
    if(!(await hp5IdOk(card.id, card.master, dev, card.devSigs[dev]))) throw new Error('身元を確かめられない（address・マスター鍵・端末鍵の署名が合わない）');
    if(!card.prekeys.some(q=>q&&q.dev===dev&&hp5PreOk(dev,q.x25519,q.notAfter,q.sig,now))) throw hpCErr('old','有効なプレキーが無い端末がある');
  }
  await hpGoneCheck(card);
  const t=card.token;
  if(typeof t.id!=='string'||typeof t.sig!=='string'||card.devices.indexOf(t.iss)<0) throw new Error('許可証の発行者がカードの端末でない');
  if(!(t.exp>now)) throw hpCErr('old','許可証の期限が切れている');
  let good=false; try{ const msg='handpost-token:v1:'+t.id+':'+t.exp+':'+(t.iat||'')+':'+(t.prev||'')+':'+(t.prevExp||''); good=sodium.crypto_sign_verify_detached(hpBytes(t.sig), sodium.from_string(msg), hpBytes(t.iss).slice(1)); }catch(e){ good=false; }
  if(!good) throw new Error('許可証の署名が合わない');
  return card;
}

async function hpAddCard(text, nick){
  if(!ID) throw hpCErr('noid','身元がまだ無い（身元タブの「新規作成」で作る）');
  let card; try{ card=JSON.parse(text); }catch(e){ throw hpCErr('form','カードとして読めない'); }
  await hpCardCheck(card);
  if(card.id===ID.address) throw hpCErr('self',T('e_card_self'));
  const had=(ID.contacts||[]).some(x=>x.address===card.id);
  const nm=nick||(had?'':hpCardNameOf(card));
  if(!addContact(card.id, nm, await hpNickOk(card.id, nm))) throw new Error('連絡先に追加できなかった');
  const c=ID.contacts.find(x=>x.address===card.id);
  const oldDevs=(c.card&&Array.isArray(c.card.devices))?c.card.devices.slice():null, oldKinds=(c.card&&c.card.devKinds)||null;
  hpGoneMerge(c,card);
  c.card=card; c.pubKey=card.master; c.cardAt=Date.now(); if(oldDevs) hpDevEvent(c,oldDevs,card.devices,oldKinds); saveID(); renderContacts();
  hpResendPeer(card.id,{kinds:['wait','peer'],force:'now'}); HP_READ_FAIL.delete(card.id);
  log(TL('lg_card_added',{addr:card.id, n:card.devices.length, exp:new Date(card.token.exp).toLocaleDateString()}));
  return c;
}
function hpCardOf(addr){ const c=contacts().find(x=>x.address===addr); return (c&&c.card)||null; }

async function hpCopyMyCard(){
  const text=await hpCard();
  try{ await navigator.clipboard.writeText(text); }catch(e){ prompt(T('pr_card_copy'), text); }
  log(TL('lg_card_copied',{n:text.length}));
  return text.length;
}

function hpHistPatch(peer, ts, fn){ const h=histLoad(peer), m=h.find(x=>x.ts===ts&&x.d==='s'); if(!m) return false; fn(m); histSave(peer,h); return true; }
async function hpSendText(peer, text, ts, opt){
  opt=opt||{};
  if(HP_SENDING.has(ts)) return false;
  if(hpBlocked(peer)){ hpLog('ブロック中の相手には送らない（'+nickOf(peer)+'）'); return false; }
  if(opt.auto||opt.manual){ const cur=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!cur||!cur.p||cur.hp||cur.x) return false; }
  HP_SENDING.add(ts); let rd=[];
  try{
    const card=hpCardOf(peer); if(!card){ const e=new Error(T('al_nocard')); e.hpk='peer'; throw e; }
    const body={ v:1, type:'msg', id:ts, text:String(text) };
    { const hm=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(hm&&typeof hpXhLast==='function'&&hpXhLast(hm.xh)==='b'){ body.back=1; body.xh=hpXhNorm(hm.xh); } }
    { const hm=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(hm&&hm.iv) body.inv=hm.iv; }
    const nm=(typeof myName==='function')?myName():''; if(nm) body.name=nm;
    const cc=(ID&&ID.contacts||[]).find(x=>x.address===peer); let encl=false;
    if(!histLoad(peer).some(x=>x.d==='p')||(cc&&cc.cardDue)){ try{ body.card=JSON.parse(await hpCard()); encl=true; hpTkNote(peer,body.card.token.id,body.card.token.exp);   }catch(e){ hpLog('自分のカードを同封できない（'+e.message+'）。本文だけ送る'); } }
    if(!hpReadOff()&&hpReading(peer)){ rd=hpReadIds(peer); if(rd.length){ body.read=rd; for(const x of rd) HP_READ_INFLIGHT.add(x); } }
    const r=await hpPut(card, JSON.stringify(body), 'msg', {ring:true});
    try{ if(typeof hpSceneLetter==='function') hpSceneLetter('post','out'); }catch(_){}
    hpHistPatch(peer, ts, m=>{ delete m.p; delete m.hf; m.hp={id:r.id, exp:r.exp}; });
    try{ const cur=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(cur&&cur.x&&!cur.xv) hpVoidSend(peer,ts).catch(()=>{}); }catch(_){}
    try{ if(typeof sibMirrorTs==='function') sibMirrorTs(peer,ts,'s'); }catch(_){}
    if(encl&&cc&&cc.cardDue){ delete cc.cardDue; delete cc.cardTry; saveID(); }
    if(rd.length){ hpReadMark(peer,rd); hpReadCancel(peer); }
    try{ hpFailLineDone(peer); }catch(_){}
    if(CURPEER===peer&&typeof findMsgEl==='function'){ const el=findMsgEl(ts); if(el){ const pm=el.querySelector('.vmark.pend'); if(pm) pm.remove(); const fr=el.querySelector('.hpfail'); if(fr) fr.remove(); } }
    hpMarkRows(peer,[ts]);
    return true;
  }catch(e){
    const k=e.hpk||'peer'; let n=1;
    hpHistPatch(peer, ts, m=>{ n=((m.hf&&m.hf.n)||0)+1; m.hf={k:k, at:Date.now(), n:n}; });
    try{ console.debug('post: send failed:', peer, e.hpWhy||e.message); }catch(_){}
    hpLog('送れない '+peer+' '+(k==='peer'?TL('lg_fail_peer'):e.message));
    try{ if(typeof hpCsFail==='function') hpCsFail(peer,e.hpWhy||e.message); }catch(_){}
    if(CURPEER===peer) hpFailLine(peer,k,hpFailWhy(e.hpWhy||e.message),n===1||!!opt.manual);
    HP_SENDING.delete(ts); try{ hpDecorate(peer); }catch(_){}
    return false;
  }finally{ HP_SENDING.delete(ts); if(rd.length){ for(const x of rd) HP_READ_INFLIGHT.delete(x); if(!hpReadMarked(peer,rd)) hpReadSoon(peer); } }
}

let HP_REQ_LOADED=false;
function hpReqKey(){ return 'p2p_req_'+ID.address; }
function hpReqLoad(){
  if(HP_REQ_LOADED||!ID) return;
  if(typeof hpHDisk==='function'&&hpHDisk()&&typeof HPH_OPENED!=='undefined'&&!HPH_OPENED) return;
  HP_REQ_LOADED=true;
  try{ for(const r of JSON.parse(hpHGet(hpReqKey())||'[]')){   if(r&&r.hp&&typeof r.from==='string'&&Array.isArray(r.msgs)&&!isContact(r.from)&&!REQUESTS.some(q=>q.hp&&q.from===r.from)) REQUESTS.push(r); } }catch(e){}
  if(REQUESTS.some(r=>r.hp)){ try{ renderRequests(); }catch(e){} }
}
function hpReqSave(){ if(!HP_REQ_LOADED||!ID) return; try{ hpHSet(hpReqKey(), JSON.stringify(REQUESTS.filter(r=>r&&r.hp))); }catch(e){} }

function hpApprove(r, nick, nickOk){
  if(!r||!r.hp||!addContact(r.from, nick||'', nickOk)) return false;
  const c=ID.contacts.find(x=>x.address===r.from);
  if(c){ if(r.card&&!c.card){ c.card=r.card; c.cardAt=Date.now(); } if(r.master) c.pubKey=r.master; saveID(); try{ renderContacts(); }catch(e){} }
  for(const m of (r.msgs||[])){ if(m.text==='') continue;   if(!histLoad(r.from).some(x=>x.ts===m.ts&&x.d==='p')) histAdd(r.from,'p',String(m.text),m.ts); }
  if(r.inv&&c&&c.card){ c.cardDue=1; delete c.cardTry; saveID(); hpLog('承認の知らせ（名刺だけの手紙）を送る → '+nickOf(r.from)); try{ if(typeof hpCardDueRun==='function') Promise.resolve(hpCardDueRun()).catch(()=>{}); }catch(e){} }
  try{ openConversation(r.from,true); }catch(e){}
  return true;
}

async function hpOnMsg(r){
  let o=null; try{ o=JSON.parse(r.body); }catch(e){ o=null; }
  if(o&&o.v===1&&o.type==='mbp'){ if(typeof hpMbIn==='function') await hpMbIn(r,o); else hpLog('写真・ファイルの本体の切れ（この版では受け取れない）'); return; }
  if(!o||o.v!==1||!((o.type==='msg'&&typeof o.text==='string')||(o.type==='read'&&Array.isArray(o.ids))||(o.type==='card'&&o.card&&typeof o.card==='object')||(o.type==='void'&&Array.isArray(o.ids)&&o.ids.length>=1&&o.ids.length<=50&&o.ids.every(x=>typeof x==='number'&&x>0)))){ hpLog('本文の形が違う（捨てた）'); return; }
  if(!ID) return;
  const from=r.from, ts=Number(o.id)||r.sentAt, text=o.text, name=(typeof o.name==='string')?o.name.trim().slice(0,24):'';
  const iv=(typeof hpInvNorm==='function')?hpInvNorm(o.inv):(o.inv?1:0);
  if(from===ID.address){ hpLog('自分あての手紙（'+String(text||'').length+' 文字。履歴には入れない）'); return; }
  let card=null;
  if(o.card&&typeof o.card==='object'){ try{ if(o.card.id!==from||o.card.master!==r.fromMaster) throw new Error('送り手のものでない'); card=await hpCardCheck(o.card); if(((card.token&&card.token.iat)||0)>Date.now()+HP_CARD_FUTURE) throw new Error('発行時刻が先の日付'); }catch(e){ hpLog('同封のカードは使わない（'+e.message+'）'); card=null; } }
  if(isContact(from)){
    const c=ID.contacts.find(x=>x.address===from);
    if(c.pubKey&&c.pubKey!==r.fromMaster){ hpLog('マスター鍵が連絡先のものと違う '+from+'（捨てた）'); return; }
    if(c.ivWait){ delete c.ivWait; saveID(); hpLog('承認された（'+(o.type||'')+' が届いた）← '+nickOf(from)); try{ if(typeof hpIvWaitUi==='function') hpIvWaitUi(); }catch(e){} }
    if(card){
      const oldDevs=(c.card&&Array.isArray(c.card.devices))?c.card.devices.slice():null, oldKinds=(c.card&&c.card.devKinds)||null, merged=hpGoneMerge(c,card);
      const take=!c.card||((card.token&&card.token.iat)||0)>((c.card.token&&c.card.token.iat)||0)||hpGoneHas(c,c.card.token&&c.card.token.iss)||!(c.card.devices&&c.card.devices.length);
      if(take){ c.card=card; c.pubKey=card.master; c.cardAt=Date.now(); }
      if(oldDevs) hpDevEvent(c,oldDevs,c.card.devices,oldKinds);
      if(take||merged){ saveID(); try{ renderContacts(); }catch(e){} }
      if(take){ hpLog('連絡先のカードを更新 '+from); hpResendPeer(from,{kinds:['wait','peer'],force:'now'}); HP_READ_FAIL.delete(from); }
    }
    { const rd=(o.type==='read')?o.ids:(Array.isArray(o.read)?o.read:null); if(rd) hpOnRead(from,rd); }
    if(o.type==='read') return;
    if(o.type==='void'){ for(const x of o.ids){ const rv=hpVoidIn(from,x,{at:r.pt,xh:o.xh});   hpLog('取り消しが届いた（ポスト経由）← '+nickOf(from)+'（'+hpVoidWhy(rv)+'）'); } return; }
    if(o.type==='card'){ hpLog('名刺だけの手紙 ← '+nickOf(from)); return; }
    if(name&&typeof nickFill==='function') nickFill(from,name);
    if(iv&&typeof hpInvCheck==='function') hpInvCheck(from,iv);
    if(iv&&text===''){ hpLog('招待からの友達申請（もう連絡先にいる）← '+nickOf(from)); return; }
    if(o.back===1&&typeof hpBackIn==='function'){ const rb=hpBackIn(from,ts,text,o.xh); hpLog('戻した 1 通が届いた（ポスト経由）← '+nickOf(from)+'（'+hpBackWhy(rb)+'）'); return; }
    if(histVoided(from,ts)){ hpLog('取り消された 1 通が届いた（入れない）← '+nickOf(from)); return; }
    if(histLoad(from).some(x=>x.ts===ts&&x.d==='p')){ hpLog('同じ本文が既にある（重ねない）'); return; }
    histAdd(from,'p',text,ts,0,null,null,{fd:hpFdOf(r.fromDev)});
    try{ if(typeof hpSceneLetter==='function') hpSceneLetter('post','in'); }catch(_){}
    if(CURPEER===from&&CONV_OPEN){ try{ addMsgAt('peer',text,nickOf(from),ts); }catch(e){} hpReadSoon(from); }
    try{ notifySound('msg'); }catch(e){}
    try{ updateBadges(); }catch(e){}
    hpLog('本文 '+text.length+' 文字 → '+nickOf(from)+' の履歴へ');
  } else {
    if(o.type==='read'){ hpLog('知らない相手からの既読（捨てた）'); return; }
    if(o.type==='card'){ hpLog('知らない相手からの名刺だけの手紙（捨てた）'); return; }
    if(o.type==='void'){ hpReqLoad(); const q=REQUESTS.find(x=>x.hp&&x.from===from); const n0=q?q.msgs.length:0; if(q){ q.msgs=q.msgs.filter(m=>o.ids.indexOf(m.ts)<0); if(q.msgs.length!==n0){ if(q.msgs.length){ const l=q.msgs[q.msgs.length-1]; q.text=l.text; q.sentAt=l.ts; } else { REQUESTS.splice(REQUESTS.indexOf(q),1); } try{ renderRequests(); }catch(e){} hpReqSave(); } } hpLog('知らない相手からの取り消し（申請から '+(n0-(q?q.msgs.length:0))+' 通消した）'); return; }
    hpReqLoad();
    let q=REQUESTS.find(x=>x.hp&&x.from===from);
    if(!q){ if(REQUESTS.filter(x=>x.hp).length>=50){ hpLog('申請が多すぎる（捨てた）'); return; } q={ hp:1, from:from, master:r.fromMaster, name:name, text:'', sentAt:ts, msgs:[], card:null }; REQUESTS.push(q); }
    if(q.master!==r.fromMaster){ hpLog('申請のマスター鍵が前と違う '+from+'（捨てた）'); return; }
    if(q.msgs.some(x=>x.ts===ts)){ hpLog('同じ本文が既にある（重ねない）'); return; }
    if(q.msgs.length>=20) q.msgs.shift();
    q.msgs.push({text:text, ts:ts}); if(iv) q.inv=(typeof hpInvCheck==='function')?hpInvCheck(from,iv):1;   if(text!==''||!q.text) q.text=text; q.sentAt=ts; if(name) q.name=name; if(card) q.card=card;
    try{ renderRequests(); }catch(e){} hpReqSave();
    try{ notifySound('req'); }catch(e){}
    log(TL('lg_request',{addr:from}));
  }
}

const HP_RS_STEPS=[30e3,120e3,600e3], HP_RS_LAST=1800e3, HP_RS_GIVEUP=7*86400e3, HP_RS_OPEN_GAP=10e3;
let HP_RS_GAP=2500, HP_RS_TIMER=null, HP_RS_CHAIN=Promise.resolve();
const HP_SENDING=new Set();
function hpFailKind(reason){ const r=String(reason||''); if(r==='rate limit'||r==='post full'||r==='bad letter'||/返事がない|つながらない/.test(r)) return 'wait'; if(r==='too big'||/長すぎる/.test(r)) return 'self'; return 'peer'; }
function hpFailKindOf(m){ const k=(m&&m.hf&&m.hf.k)||''; if(k==='self'&&!(m.img||m.file)&&String(m.t||'').length<HP_SELF_SHORT) return 'wait'; return k; }
const HP_SELF_SHORT=2000;

const HP_FAIL_LAST=new Map();
function hpFailLineEls(peer){ try{ if(typeof document.querySelectorAll==='function') return Array.from(document.querySelectorAll('#msgs .sys[data-hpfailpeer="'+peer+'"]')); }catch(_){} return []; }
function hpFailText(peer){ const f=HP_FAIL_LAST.get(peer); if(!f) return ''; return TF('sys_fail_'+f.k,{name:nickOf(peer), why:f.why})+(f.k==='wait'?TF('sys_fail_n',{n:hpPendList(peer).length, t:f.t}):''); }
function hpFailLine(peer, k, why, fresh){
  HP_FAIL_LAST.set(peer,{k:k, why:why, t:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})});
  const text=hpFailText(peer), els=hpFailLineEls(peer);
  if(els.length){ for(const s of els.slice(0,-1)) s.remove(); els[els.length-1].textContent=text; return true; }
  if(!fresh||typeof addSys!=='function') return false;
  addSys(text); try{ const bx=$('#msgs'), le=bx&&bx.lastElementChild; if(le&&le.dataset) le.dataset.hpfailpeer=peer; }catch(_){} return true;
}
function hpFailLineDone(peer){ try{ if(typeof hpCsRefresh==='function') hpCsRefresh(); }catch(_){}   const els=hpFailLineEls(peer); if(!els.length) return; if(!hpPendList(peer).length){ for(const s of els) s.remove(); HP_FAIL_LAST.delete(peer); return; } const text=hpFailText(peer); if(text) els[els.length-1].textContent=text; }
function hpFailWhy(reason){ const r=String(reason||''); return r==='rate limit'?T('why_rate'):r==='post full'?T('why_full'):r==='bad letter'?T('why_devs'):T('why_net'); }
function hpPendList(peer){ const now=Date.now(), hold=(typeof RTC_DC_HOLD==='number')?RTC_DC_HOLD:30000; return histLoad(peer).filter(m=>m.d==='s'&&m.p&&!m.hp&&!m.x&&!m.img&&!m.file&&typeof m.t==='string'&&m.t&&!(m.dc&&now-m.dc<hold)&&!(m.dv&&typeof sibDv==='function'&&m.dv!==sibDv())&&m.dv!=='old'); }
function hpRsDue(m, now, force){
  const f=m.hf; if(f&&hpFailKindOf(m)==='self') return false;
  if(now-m.ts>HP_RS_GIVEUP) return false;
  if(!f||force==='now') return true;
  const wait=(force==='open')?HP_RS_OPEN_GAP:(HP_RS_STEPS[(f.n||1)-1]||HP_RS_LAST);
  return now-(f.at||0)>=wait;
}
async function hpRsPeer(peer, opt){
  opt=opt||{}; if(!ID||!hpCardOf(peer)||hpBlocked(peer)) return 0;
  const kinds=opt.kinds||['wait']; let n=0;
  for(const m of hpPendList(peer)){
    const k=hpFailKindOf(m)||'wait';
    if(!kinds.includes(k)||!hpRsDue(m,Date.now(),opt.force)||HP_SENDING.has(m.ts)) continue;
    if(n&&HP_RS_GAP) await sleep(HP_RS_GAP);
    n++; if(!(await hpSendText(peer,m.t,m.ts,{auto:true}))) break;
  }
  try{ n+=await hpVoidRetry(peer,opt); }catch(e){}
  if(n) hpLog(TL('lg_resend',{n:n,name:nickOf(peer)}));
  return n;
}
function hpRsRun(fn){ HP_RS_CHAIN=HP_RS_CHAIN.then(fn).catch(e=>{ try{ hpLog('送り直しで失敗 '+e.message); }catch(_){} }); return HP_RS_CHAIN; }
function hpResendPeer(peer, opt){ return hpRsRun(()=>hpRsPeer(peer,opt)); }
function hpResendKick(){ return hpRsRun(async()=>{ if(!ID) return 0; let n=0; for(const c of contacts()){ if(c.card) n+=await hpRsPeer(c.address); } try{ await hpCardDueRun(false); }catch(e){} try{ n+=await hpPartRun(false); }catch(e){}   return n; }); }

const HP_VOIDING=new Set();
function hpVoidMe(){ try{ return (typeof sibDv==='function')?sibDv():'me'; }catch(e){ return 'me'; } }
function hpVoidPend(peer){ const me=hpVoidMe(); return histLoad(peer).filter(m=>m.d==='s'&&m.x&&!m.xv&&m.xd===me); }
async function hpDrop(card, id){
  if(!card||!Array.isArray(card.post)||!card.token) throw new Error('カードの形が違う');
  await hpReady();
  try{ hpPartDrop(id); }catch(e){}
  const gs=hpPutGroups(card,(Array.isArray(card.devices)?card.devices:[]).map(d=>({dev:d}))); if(!gs.length) gs.push({ post:card.post, token:card.token });
  let n=0, okN=0, last=null;
  for(const g of gs){ try{
      const p=await hpPoolGet(g.post,m=>new Error(m));
      const r=(await hpPoolAsk(p,{op:'drop', token:g.token, id:id})).r; if(!r.ok) throw new Error(String(r.err)); n+=Number(r.removed)||0; okN++;
    }catch(e){ last=e; } }
  if(!okN) throw last; return n;
}
async function hpVoidSend(peer, ts){
  const m0=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m0||!m0.x) return false; if(m0.xv) return true;
  if(!m0.xd) hpHistPatch(peer,ts,x=>{ x.xd=hpVoidMe(); }); else if(m0.xd!==hpVoidMe()) return false;
  if(HP_VOIDING.has(ts)) return false;
  const fail=k=>hpHistPatch(peer,ts,x=>{ x.xf={k:k,at:Date.now(),n:((x.xf&&x.xf.n)||0)+1}; });
  const card=hpCardOf(peer); if(!card){ fail('peer'); return false; }
  HP_VOIDING.add(ts);
  try{
    if(m0.hp&&m0.hp.id&&!(m0.hp.exp&&m0.hp.exp<Date.now())&&!m0.xd0){ hpHistPatch(peer,ts,x=>{ x.xd0=1; }); try{ const n=await hpDrop(card,m0.hp.id); hpLog('取り消した 1 通を '+nickOf(peer)+' のポストから抜いた（'+n+' 通）'); }catch(e){ hpLog('取り消した 1 通をポストから抜けなかった（'+e.message+'）。取り消しの手紙だけ出す'); } }
    await hpPut(card, JSON.stringify({v:1,type:'void',ids:[ts],xh:hpXhNorm(m0.xh)}), 'msg');
    hpHistPatch(peer,ts,x=>{ x.xv=1; delete x.xf; });
    hpLog('取り消しをポスト経由で知らせた → '+nickOf(peer));
    return true;
  }catch(e){ const k=e.hpk||'peer'; fail(k); hpLog('取り消しを知らせられない → '+nickOf(peer)+'（'+(k==='peer'?TL('lg_fail_peer'):e.message)+'。あとで送り直す）'); return false; }
  finally{ HP_VOIDING.delete(ts); }
}
async function hpVoidRetry(peer, opt){
  opt=opt||{}; const kinds=opt.kinds||['wait']; let n=0;
  for(const m of hpVoidPend(peer)){
    const k=(m.xf&&m.xf.k)||'wait';
    if(!kinds.includes(k)||!hpRsDue({ts:m.u||m.ts,hf:m.xf},Date.now(),opt.force)||HP_VOIDING.has(m.ts)) continue;
    if(n&&HP_RS_GAP) await sleep(HP_RS_GAP);
    n++; if(!(await hpVoidSend(peer,m.ts))) break;
  }
  return n;
}
async function hpBackSend(peer, ts){
  const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||m.x||!m.p) return false;
  if(m.img||m.file){ if(typeof rtcLineTo==='function'&&rtcLineTo(peer)){ if(m.img) imgQueueSend(peer,m); else fileQueueSend(peer,m); } else if(typeof rtcBusyFor==='function'&&rtcBusyFor(peer)){ rtcMediaWait(peer,ts); } else if(!(typeof rtcCallMaybe==='function'&&rtcCallMaybe(peer))){ try{ hpDecorate(peer); }catch(e){} } return true; }
  if(typeof rtcLineTo==='function'&&rtcLineTo(peer)&&typeof rtcSend==='function'&&rtcSend(peer,m.t,ts)) return true;
  try{ await hpSendText(peer,m.t,ts); }catch(e){} if(typeof rtcCallMaybe==='function') rtcCallMaybe(peer); return true;
}
function hpResendOne(peer, ts){ const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||!m.p||m.hp||m.x) return Promise.resolve(false); return hpSendText(peer,m.t,ts,{manual:true}); }

function hpMediaPendList(peer){ return histLoad(peer).filter(m=>m.d==='s'&&m.p&&(m.img||m.file)&&!m.x&&!m.g&&!m.k&&!(m.dv&&typeof sibDv==='function'&&m.dv!==sibDv())&&m.dv!=='old'); }
function hpMediaRetry(peer, ts){
  const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||!m.p||m.x||!(m.img||m.file)) return false;
  if(typeof rtcLineTo==='function'&&rtcLineTo(peer)){ if(m.img&&typeof imgQueueSend==='function') imgQueueSend(peer,m); else if(m.file&&typeof fileQueueSend==='function') fileQueueSend(peer,m); return true; }
  if(typeof rtcBusyFor==='function'&&rtcBusyFor(peer)){ if(typeof rtcMediaWait==='function') rtcMediaWait(peer,ts); return true; }
  return (typeof rtcCallNow==='function')&&rtcCallNow(peer);
}
function hpMediaRowDue(peer){
  try{ if(typeof rtcLineTo==='function'&&rtcLineTo(peer)) return false; if(typeof rtcBusyFor==='function'&&rtcBusyFor(peer)) return false; if(typeof MODE!=='undefined'&&MODE!=='idle'&&typeof rtcTarget==='function'&&rtcTarget()===peer) return false; }catch(e){}
  return true;
}
function hpFailRow(el, peer, m){
  const old=el.querySelector('.hpfail'); if(old) old.remove();
  const media=!!(m.img||m.file), dead=(Date.now()-m.ts>HP_RS_GIVEUP), k=hpFailKindOf(m)||'wait';
  const row=document.createElement('span'); row.className='hpfail'; row.style.cssText='display:block;font-size:11px;margin-top:4px;color:var(--amber)';
  const lab=document.createElement('span'); lab.textContent=T(dead?'mk_fail_dead':(media?'mk_fail_line':('mk_fail_'+k))); row.appendChild(lab);
  const mk=(txt,fn)=>{ const b=document.createElement('button'); b.type='button'; b.textContent=txt; b.style.cssText='margin-left:6px;font-size:11px;padding:2px 8px;border-radius:8px;border:1px solid var(--amber);background:none;color:inherit;cursor:pointer';
    b.onclick=ev=>{ ev.stopPropagation(); fn(); }; for(const t of ['touchstart','touchend']) b.addEventListener(t,ev=>ev.stopPropagation(),{passive:true}); row.appendChild(b); };
  if(media) mk(T('btn_resend'),()=>{ lab.textContent=T('mk_calling'); hpMediaRetry(peer,m.ts); });
  if(media&&typeof hpMbCan==='function'&&hpMbCan(peer,m)) mk(TF('btn_mb_send',{size:hpMbSize(m)}),()=>{ hpMbSendAsk(peer,m.ts,lab); });
  mk(T('btn_unsend'),async()=>{ if(!(await hpAsk({text:T('cf_void'), ok:T('btn_ask_void')}))) return; histVoid(peer,m.ts); markVoid(el); row.remove(); });
  if(!media){ try{ const pm=el.querySelector('.vmark.pend'); if(pm) pm.style.display='none'; }catch(_){} }
  el.appendChild(row);
}
function hpDecorate(peer){
  try{ hpBlockBar(CURPEER); }catch(e){}
  try{ if(typeof hpDeadBar==='function') hpDeadBar(CURPEER); }catch(e){}
  if(!peer||CURPEER!==peer||typeof findMsgEl!=='function') return;
  hpMarkRows(peer); hpWaitRows(peer);
  for(const m of hpPendList(peer)){
    if(HP_SENDING.has(m.ts)||(!m.hf&&Date.now()-m.ts<20000)) continue;
    const el=findMsgEl(m.ts); if(el) hpFailRow(el,peer,m);
  }
  const due=hpMediaRowDue(peer);
  for(const m of hpMediaPendList(peer)){
    const el=findMsgEl(m.ts); if(!el) continue;
    if(!due){ const old=el.querySelector('.hpfail'); if(old) old.remove(); continue; }
    hpFailRow(el,peer,m);
  }
}
function hpOnConvRender(peer){ hpDecorate(peer); if(POST.up) hpResendPeer(peer,{force:'open'}); setTimeout(()=>{ hpReadSoon(peer); hpDevEvRows(peer); try{ if(typeof hpInvSentRow==='function') hpInvSentRow(peer); }catch(e){}   },0); }

function hpMarkEls(){ const map=new Map(); try{ if(typeof document.querySelectorAll==='function'){ for(const el of document.querySelectorAll('#msgs .m')){ if(el.dataset&&el.dataset.ts) map.set(el.dataset.ts,el); } return map; } }catch(e){} return null; }
function hpMarkRow(el, m){
  const old=el.querySelector('.smark'); if(old) old.remove();
  if(m.x||(m.k&&!hpReadOff())||m.p) return false;
  const lab=m.g?T('mk_got'):(m.hp?T('mk_sent'):''); if(!lab) return false;
  const pm=el.querySelector('.vmark.pend'); if(pm) pm.remove(); const fr=el.querySelector('.hpfail'); if(fr) fr.remove(); const wr=el.querySelector('.hpwait'); if(wr) wr.remove();
  const s=document.createElement('span'); s.className='smark'; s.style.cssText='display:block;font-size:10px;color:var(--dim);margin-top:2px;text-align:right'; s.textContent=lab; el.appendChild(s); return true;
}
function hpMarkRows(peer, only){
  try{ if(typeof hpCsRefresh==='function') hpCsRefresh(); }catch(_){}
  if(!peer||CURPEER!==peer||typeof findMsgEl!=='function') return 0;
  const map=hpMarkEls(); let n=0;
  for(const m of histLoad(peer)){ if(m.d!=='s'||(only&&!only.includes(m.ts))) continue;
    const el=map?map.get(String(m.ts)):findMsgEl(m.ts); if(el&&hpMarkRow(el,m)) n++; }
  return n;
}
function hpWaitRows(peer){
  if(!peer||CURPEER!==peer||typeof findMsgEl!=='function') return 0;
  const busy=(typeof rtcBusyFor==='function')&&rtcBusyFor(peer); let n=0;
  for(const m of histLoad(peer)){ if(m.d!=='s'||!(m.img||m.file)) continue;
    const el=findMsgEl(m.ts); if(!el) continue; const old=el.querySelector('.hpwait'); if(old) old.remove();
    if(!busy||!m.p||m.k||m.x) continue;
    const w=document.createElement('span'); w.className='hpwait'; w.style.cssText='display:block;font-size:11px;margin-top:4px;color:var(--amber)'; w.textContent=T('mk_wait_line'); el.appendChild(w); n++; }
  return n;
}

function hpBanner(text,tap,slot){

  if(typeof document==='undefined'||!document.body) return;
  const nag=slot==='nag', id=nag?'hp-banner-nag':'hp-banner';
  let b=document.getElementById(id);
  if(!text){ if(b) b.remove(); return; }
  if(!b){ b=document.createElement('div'); b.id=id; b.style.cssText='background:var(--amber);color:#1a1300;font-size:12px;line-height:1.5;padding:6px 12px'+(nag?';border-top:1px solid rgba(0,0,0,.25)':'');
    const other=document.getElementById(nag?'hp-banner':'hp-banner-nag');
    if(nag&&other) other.after(b); else document.body.insertBefore(b,document.body.firstChild); }
  b.textContent=text+(tap?' ✕':''); b.style.cursor=tap?'pointer':''; b.onclick=tap?()=>{ hpBanner(null,null,slot); try{ if(typeof tap==='function') tap(); }catch(e){} }:null;
}

const HP_OPEN_FAIL={key:0,bad:0};
function hpOpenFail(e){
  const k=/開ける鍵が無い/.test(String(e&&e.message||''))?'key':'bad'; HP_OPEN_FAIL[k]++;
  if(!ID||(POST&&POST.notOwner)) return;
  try{ if(k==='bad'&&typeof hpNote==='function') hpNote('openbad',{}); }catch(x){}
  hpBanner(HP_OPEN_FAIL.key?TF('bn_open_key',{n:HP_OPEN_FAIL.key}):TF('bn_open_bad',{n:HP_OPEN_FAIL.bad}),()=>{ HP_OPEN_FAIL.key=0; HP_OPEN_FAIL.bad=0; });
}

let HP_READ_WAIT=5000; const HP_READ_MAX=100, HP_READ_T=new Map(), HP_READ_FAIL=new Map(), HP_READ_BUSY=new Set(), HP_READ_INFLIGHT=new Set();
function hpReadMarked(peer, ids){ const h=histLoad(peer); return ids.every(ts=>{ const m=h.find(x=>x.ts===ts&&x.d==='p'); return !m||!!m.rs; }); }
function hpReadOff(){ if(ID&&ID.set&&typeof ID.set==='object'&&ID.set.noread===1) return true; try{ return localStorage.getItem('p2p_noread')==='1'; }catch(e){ return false; } }
function hpVisible(){ return typeof document==='undefined'||!document.visibilityState||document.visibilityState==='visible'; }
function hpReading(peer){ return !!peer&&CURPEER===peer&&!!CONV_OPEN&&hpVisible(); }
function hpReadIds(peer){ return histLoad(peer).filter(m=>m.d==='p'&&!m.rs&&m.ts&&!HP_READ_INFLIGHT.has(m.ts)).slice(-HP_READ_MAX).map(m=>m.ts); }
function hpReadMark(peer, ids){ const h=histLoad(peer); let ch=false; for(const m of h){ if(m.d==='p'&&!m.rs&&ids.includes(m.ts)){ m.rs=1; ch=true; } } if(ch){ histSave(peer,h); try{ if(typeof sibMirror==='function') for(const m of h){ if(m.d==='p'&&m.rs&&ids.includes(m.ts)) sibMirror(peer,m); } }catch(e){} } return ch; }
function hpReadCancel(peer){ const t=HP_READ_T.get(peer); if(t){ clearTimeout(t); HP_READ_T.delete(peer); } }
function hpReadSoon(peer){
  if(!peer||!ID||hpReadOff()||hpBlocked(peer)||HP_READ_T.has(peer)||!hpReading(peer)||!hpCardOf(peer)||!hpReadIds(peer).length) return;
  HP_READ_T.set(peer,setTimeout(()=>{ HP_READ_T.delete(peer); hpReadFlush(peer); },HP_READ_WAIT));
}
async function hpReadFlush(peer){
  if(!ID||hpReadOff()||hpBlocked(peer)||!hpReading(peer)||HP_READ_BUSY.has(peer)) return false;
  if(typeof rtcLineTo==='function'&&rtcLineTo(peer)){ const dids=hpReadIds(peer); if(!dids.length) return false; try{ DC.send(JSON.stringify({v:1,type:'read',ids:dids})); hpReadMark(peer,dids); hpLog(TL('lg_read_sent',{n:dids.length,name:nickOf(peer)})+'（直結）'); return true; }catch(e){} }
  const card=hpCardOf(peer); if(!card) return false;
  const f=HP_READ_FAIL.get(peer); if(f&&(f.k!=='wait'||Date.now()-f.at<(HP_RS_STEPS[f.n-1]||HP_RS_LAST))) return false;
  const ids=hpReadIds(peer); if(!ids.length) return false;
  HP_READ_BUSY.add(peer);
  try{
    await hpPut(card, JSON.stringify({v:1,type:'read',ids:ids}), 'msg');
    hpReadMark(peer,ids); HP_READ_FAIL.delete(peer); hpLog(TL('lg_read_sent',{n:ids.length,name:nickOf(peer)})); return true;
  }catch(e){
    const k=e.hpk||'peer'; HP_READ_FAIL.set(peer,{k:k,at:Date.now(),n:((f&&f.n)||0)+1});
    try{ console.debug('post: read receipt failed:', peer, e.hpWhy||e.message); }catch(_){}
    hpLog('既読を返せない '+nickOf(peer)+(k==='peer'?'':' '+e.message)); return false;
  }finally{ HP_READ_BUSY.delete(peer); }
}

function hpOnRead(from, ids){
  const list=(Array.isArray(ids)?ids:[]).map(Number).filter(n=>n>0&&Number.isFinite(n)).slice(0,200); if(!list.length) return 0;
  let ch=false; try{ if(typeof histRead==='function') ch=histRead(from,list); }catch(e){}
  if(!hpReadOff()&&CURPEER===from&&typeof findMsgEl==='function'&&typeof markRead==='function'){   for(const ts of list){ try{ const el=findMsgEl(ts); if(el) markRead(el); }catch(e){} } }
  if(ch) hpLog(TL('lg_read_got',{n:list.length,name:nickOf(from)}));
  return list.length;
}
try{ if(typeof document!=='undefined'&&typeof document.addEventListener==='function') document.addEventListener('visibilitychange',()=>{ if(hpVisible()&&CURPEER&&CONV_OPEN) hpReadSoon(CURPEER); }); }catch(e){}

const HP_LINK_TTL=600e3, HP_LINK_CHUNK=40000, HP_DEV_MAX=5;
let HP_LINK_DONE_KEEP=60e3;
let HP_LINK=null;
let HP_JOIN=null;
function hpIsChild(){ return !!(ID&&!ID.privateKeyPem&&ID.link&&ID.link.dev&&(ID.link.devSig||ID.link.rs)); }
function hpIsMain(){ return !!(ID&&ID.privateKeyPem); }
function hpLinkHash(secret, text){ return hp5S().crypto_generichash(32, hp5U(text), hpBytes(secret)); }
function hpLinkProof(secret, id, dev, x){ return hpHex(hpLinkHash(secret, 'handpost-link:v1:'+id+':'+dev+':'+x)); }
function hpLinkSas(secret, id, mainDev, dev, x){ const h=hpLinkHash(secret, 'handpost-link-sas:v1:'+id+':'+mainDev+':'+dev+':'+x); return String((((h[0]<<24)|(h[1]<<16)|(h[2]<<8)|h[3])>>>0)%1000000).padStart(6,'0'); }
const hpSasFmt=c=>String(c).slice(0,3)+' '+String(c).slice(3);
function hpDevLabelGuess(){ const ua=(typeof navigator!=='undefined'&&navigator.userAgent)||''; const b=/Edg\//.test(ua)?'Edge':/Firefox\//.test(ua)?'Firefox':/Chrome\//.test(ua)?'Chrome':/Safari\//.test(ua)?'Safari':'Browser'; let hs=false; try{ hs=/iPhone|iPad/.test(ua)&&(navigator.standalone===true||!!(typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches)); }catch(e){} if(hs) return ((typeof curLang==='function'&&curLang()==='ja')?'ホーム画面':'Home Screen')+' · iOS';   const o=/iPhone|iPad/.test(ua)?'iOS':/Android/.test(ua)?'Android':/Windows/.test(ua)?'Windows':/Mac OS/.test(ua)?'Mac':/Linux/.test(ua)?'Linux':''; return (b+(o?' · '+o:'')).slice(0,32); }

const HP_DEV_KINDS=['pc','android','iphone','other'];
function hpDevKindOf(label){ const l=String(label||''); if(/iOS|iPhone|iPad/i.test(l)) return 'iphone'; if(/Android/i.test(l)) return 'android'; if(/Windows|Mac|Linux|CrOS|Chrome OS/i.test(l)) return 'pc'; return 'other'; }
const HP_DEV_KIND_KEYS={pc:'dk_pc',android:'dk_android',iphone:'dk_iphone',other:'dk_other'};
function hpDevKindText(k){ const key=HP_DEV_KIND_KEYS[k]||'dk_other'; return (typeof T==='function')?T(key):key; }
function hpFdOf(dev){ const x=String(dev||'').toLowerCase(); return /^[0-9a-f]{16}/.test(x)?x.slice(0,16):''; }
function hpDevKindFor(peer,fd){ try{ const c=contacts().find(x=>x.address===peer), card=c&&c.card; if(!card||!card.devKinds||!Array.isArray(card.devices)) return ''; const dev=card.devices.find(d=>hpFdOf(d)===fd); return dev?(card.devKinds[dev]||''):''; }catch(e){ return ''; } }
function hpUsualDev(peer){ try{ const cnt={}; let best='', bn=0; for(const m of histLoad(peer)){ if(m.d!=='p'||!m.fd) continue; cnt[m.fd]=(cnt[m.fd]||0)+1; if(cnt[m.fd]>bn||(cnt[m.fd]===bn&&m.fd<best)){ bn=cnt[m.fd]; best=m.fd; } } return best; }catch(e){ return ''; } }
function hpDevMarkCells(fd){ fd=hpFdOf(fd); if(!fd) return null; const b=[]; for(let i=0;i<8;i++) b.push(parseInt(fd.slice(i*2,i*2+2),16)); const bits=(b[0]<<8)|b[1]; const cells=[]; for(let y=0;y<5;y++){ const row=[]; for(let x=0;x<5;x++){ const cx=x<3?x:4-x; row.push(((bits>>(y*3+cx))&1)?1:0); } cells.push(row); } if(!cells.some(r=>r.some(v=>v))) cells[2][2]=1; const h1=Math.round(b[2]*360/256), h2=(h1+120+Math.round(b[3]*120/256))%360; return {cells:cells,c1:'hsl('+h1+',70%,58%)',c2:'hsl('+h2+',45%,26%)'}; }
function hpDevMarkPath(cells){ let d=''; for(let y=0;y<5;y++){ let x=0; while(x<5){ if(!cells[y][x]){ x++; continue; } let w=0; while(x+w<5&&cells[y][x+w]) w++; d+='M'+x+' '+y+'h'+w+'v1h-'+w+'z'; x+=w; } } return d; }
function hpDevMarkSvg(fd){ const m=hpDevMarkCells(fd); if(!m) return ''; return '<svg class="dvm" viewBox="0 0 5 5" shape-rendering="crispEdges" aria-hidden="true"><rect width="5" height="5" fill="'+m.c2+'"/><path fill="'+m.c1+'" d="'+hpDevMarkPath(m.cells)+'"/></svg>'; }
function hpDevMarkEl(fd,title){ const m=hpDevMarkCells(fd); if(!m||typeof document==='undefined') return null; try{ if(typeof document.createElementNS==='function'){ const NS='http://www.w3.org/2000/svg', svg=document.createElementNS(NS,'svg'); svg.setAttribute('class','dvm'); svg.setAttribute('viewBox','0 0 5 5'); svg.setAttribute('shape-rendering','crispEdges'); const r=document.createElementNS(NS,'rect'); r.setAttribute('width','5'); r.setAttribute('height','5'); r.setAttribute('fill',m.c2); const p=document.createElementNS(NS,'path'); p.setAttribute('fill',m.c1); p.setAttribute('d',hpDevMarkPath(m.cells)); svg.appendChild(r); svg.appendChild(p); if(title){ const t=document.createElementNS(NS,'title'); t.textContent=title; svg.appendChild(t); } return svg; } }catch(e){} try{ const sp=document.createElement('span'); sp.className='dvm'; sp.textContent='\u25a3'; if(title) sp.title=title; return sp; }catch(e){ return null; } }
function hpDevMarkTitle(peer,fd){ const k=hpDevKindFor(peer,fd); return (typeof TF==='function')?TF('tip_dev_mark',{kind:k?hpDevKindText(k):'',dev:String(fd||'').slice(0,8)}):String(fd||''); }
function hpDevMarkInto(row,fd,peer){ try{ fd=hpFdOf(fd); if(!fd||!row||typeof row.querySelector!=='function') return false; const who=row.querySelector('.who'); if(!who||typeof who.appendChild!=='function') return false; if(who.querySelector&&who.querySelector('.dvm')) return false; const mk=hpDevMarkEl(fd,hpDevMarkTitle(peer,fd)); if(mk) who.appendChild(mk); const k=hpDevKindFor(peer,fd); if(k){ const s=document.createElement('span'); s.className='dvk'; s.textContent=hpDevKindText(k); who.appendChild(s); } const u=hpUsualDev(peer); if(u&&u!==fd&&mk&&typeof mk.setAttribute==='function') mk.setAttribute('class','dvm odd');   return true; }catch(e){ return false; } }
function hpDevMarksInto(box,devs,peer,opt){ try{ if(!box||typeof box.appendChild!=='function') return 0; let n=0; for(const dev of (devs||[])){ const fd=hpFdOf(dev); if(!fd) continue; const mk=hpDevMarkEl(fd,peer?hpDevMarkTitle(peer,fd):String(fd)); if(!mk) continue; if(opt&&opt.dim){ try{ mk.style.opacity='.4'; }catch(e){} } if(peer&&typeof hpDevInfoText==='function'&&mk.addEventListener){ try{ mk.style.cursor='pointer'; mk.addEventListener('click',ev=>{ try{ ev.stopPropagation(); }catch(_){} hpDevToast(hpDevInfoText(peer,fd,0));   }); }catch(e){} }   box.appendChild(mk); n++; const k=(opt&&opt.fdKinds&&opt.fdKinds[fd])||(peer?hpDevKindFor(peer,fd):(opt&&opt.kinds&&opt.kinds[dev])||''); if(k&&opt&&opt.kindText){ const s=document.createElement('small'); s.textContent=hpDevKindText(k); if(opt.dim){ try{ s.style.opacity='.4'; }catch(e){} } box.appendChild(s); }   } return n; }catch(e){ return 0; } }

function hpLogHead(){
  const p=n=>String(n).padStart(2,'0'), d=new Date();
  const role=!ID?'身元なし':hpIsMain()?'親機':hpIsChild()?'子機':'—';
  const tint=hpDevTintOf(); return '# Handpost のログ ／ '+(tint?tint[4]+'の窓'+((POST&&POST.pub)?'（'+POST.pub.slice(2,8)+'）':'')+' ／ ':'')    +((ID&&ID.myName)||'（名前なし）')+(ID?'（'+String(ID.address).slice(0,11)+'…）':'')+' ／ '+role+' '+hpDevLabelGuess()+' ／ 端末鍵 '+((POST&&POST.pub)?POST.pub.slice(0,10)+'…':'—')+' ／ ポスト '+((POST&&POST.url)||'—')+' ／ コピーした時刻 '+d.getFullYear()+'/'+p(d.getMonth()+1)+'/'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds());
}

function hpDevRows(){
  if(hpIsMain()) return [{dev:POST.pub||'',role:'main',me:true,label:hpDevLabelGuess(),at:0}].concat((Array.isArray(ID.devs)?ID.devs:[]).map(d=>({dev:d.dev,role:'child',me:false,label:d.label||'',at:d.at||0,seen:d.seen||0})));
  if(hpIsChild()) return [{dev:(ID.link.main&&ID.link.main.dev)||'',role:'main',me:false,label:(ID.link.main&&ID.link.main.label)||'',at:0,seen:(ID.link.main&&ID.link.main.seen)||0},{dev:ID.link.dev,role:'child',me:true,label:ID.link.label||hpDevLabelGuess(),at:ID.link.at||0}].concat((Array.isArray(ID.link.sibs)?ID.link.sibs:[]).map(d=>({dev:d.dev,role:'child',me:false,label:d.label||'',at:d.at||0,seen:d.seen||0})));
  return [];
}

let HP_LINK_MK=null;
function hpLinkStart(){ if(HP_LINK_MK) return HP_LINK_MK; const p=hpLinkStart0(); HP_LINK_MK=p; p.then(()=>{ if(HP_LINK_MK===p) HP_LINK_MK=null; },()=>{ if(HP_LINK_MK===p) HP_LINK_MK=null; }); return p; }

async function hpLinkStartBtn(bs){
  const L=HP_LINK;
  if(L&&hpIsMain()&&!L.req&&!L.busy&&!L.done&&!L.fail&&L.url&&L.exp-Date.now()>120e3){ hpLog('連携の文字はもう出ている（同じものをもう一度出す）'); try{ hpLinkUi(); }catch(e){} return 'again'; }
  if(bs) bs.disabled=true;
  try{ await hpLinkStart(); if(HP_LINK&&!HP_LINK.url) alert(T('lk_noshort')); return 'new'; }
  catch(e){ hpLog('連携を始められない '+e.message); alert((typeof hpErrShow==='function'?hpErrShow(e):e.message)); return 'err'; }
  finally{ if(bs) bs.disabled=false; }
}
async function hpLinkStart0(){
  if(!hpIsMain()&&!(typeof hpD2CanLink==='function'&&hpD2CanLink())) throw new Error(T(typeof hpD2CanLink==='function'?'e_link_oldbox':'e_link_main'));
  if(!POST.up||POST.notOwner) throw new Error(T('e_link_post'));
  if(hpDevRows().length>=HP_DEV_MAX) throw new Error(T('e_link_max'));
  const me=await hp5Me(); if(me.dev!==POST.pub) throw new Error('端末鍵が接続中のものと違う');
  const card={ v:3, id:me.id, master:me.master, post:[POST.url], devices:[me.dev], devSigs:{[me.dev]:me.devSig}, token:JSON.parse(hpIssue(HP_LINK_TTL)), prekeys:[await hpPrekeyPub()] }; if(Array.isArray(ID.roster)&&ID.roster.length) card.roster=ID.roster;
  const secret=hpHex(crypto.getRandomValues(new Uint8Array(32))), exp=Date.now()+HP_LINK_TTL;
  if(HP_LINK){ try{ if(typeof hpLqDrop==='function') hpLqDrop(HP_LINK); }catch(e){} }
  HP_LINK={ secret:secret, exp:exp, req:null, busy:false, text:JSON.stringify({ v:1, t:'handpost-link', exp:exp, secret:secret, card:card }) };
  { const L=HP_LINK; try{ if(typeof hpLqMake==='function') await hpLqMake(L); }catch(e){ let e2=e; if(String(e&&e.message)===T('e_inv_busy')&&L===HP_LINK){ hpLog('短い連携の QR：郵便受けとのやり取りが重なったので、少し待ってもう一度'); await sleep(1500); try{ await hpLqMake(L); e2=null; }catch(e3){ e2=e3; } } if(e2) hpLog('短い連携の QR を作れない（長い文字のまま） '+e2.message); } }
  hpLog('連携の文字を出した（10 分・1 回限り）'); try{ hpLinkUi(); }catch(e){}
  return HP_LINK.text;
}
function hpLinkCancel(){ try{ if(typeof hpLqDrop==='function') hpLqDrop(HP_LINK); }catch(e){}   HP_LINK=null; try{ hpLinkUi(); }catch(e){} }
async function hpLinkOnReq(r){
  const drop=why=>hpLog('連携の申し込みを捨てた（'+why+'）');
  if(!HP_LINK) return drop('連携を始めていない');
  if(Date.now()>HP_LINK.exp){ HP_LINK=null; try{ hpLinkUi(); }catch(e){} return drop('連携の文字の期限切れ'); }
  if(HP_LINK.req||HP_LINK.busy||HP_LINK.done) return drop('もう 1 件受け取っている');
  let o=null; try{ o=JSON.parse(r.body); }catch(e){}
  const fp=r.fromPrekey||{};
  if(!o||o.v!==1||o.type!=='link-req'||typeof o.proof!=='string') return drop('形が違う');
  if(o.proof!==hpLinkProof(HP_LINK.secret, ID.address, r.fromDev, fp.x)) return drop('連携の文字を知らない相手');
  if(r.fromDev===POST.pub||hpDevRows().some(d=>d.dev===r.fromDev)) return drop('もう足してある機械');
  HP_LINK.req={ dev:r.fromDev, pre:{dev:r.fromDev,x25519:fp.x,notAfter:fp.notAfter,sig:fp.sig}, label:String(o.label||'').slice(0,32), sas:hpLinkSas(HP_LINK.secret, ID.address, POST.pub, r.fromDev, fp.x) };
  hpLog('連携の申し込みが届いた（端末 '+r.fromDev.slice(0,10)+'…）。6 桁を見比べて承認する'); try{ notifySound('req'); }catch(e){} try{ hpLinkUi(); }catch(e){}
}
function hpLinkOnReply(o){ hpRmOnReply(o); try{ if(typeof hpBkOnReply==='function') hpBkOnReply(o); }catch(e){}   try{ if(typeof hpInvOnReply==='function') hpInvOnReply(o); }catch(e){}   try{ if(typeof hpNfOnReply==='function') hpNfOnReply(o); }catch(e){}   if(HP_LINK&&HP_LINK.wait){ if(o.ok===HP_LINK.wait) HP_LINK.ok=true; else if(o.err) HP_LINK.err=String(o.err); } }
async function hpLinkApprove(){
  const L=HP_LINK, q=L&&L.req; if(!q||L.busy) return false;
  L.busy=true; try{ hpLinkUi(); }catch(e){}
  try{
    if(!hpIsMain()){ if(typeof hpD2Approve!=='function') throw new Error(T('e_link_main')); return await hpD2Approve(L,q); }
    const devSig=await edSign(hp5DevMsg(ID.address, q.dev));
    if(!(await hp5IdOk(ID.address, ID.publicKey, q.dev, devSig))) throw new Error('署名を作れない');
    let have=false; if(L.tries){ try{ const r0=await hpBkReq({ op:'dget' }); have=(Array.isArray(r0&&r0.devs)?r0.devs:[]).some(x=>x&&x.dev===q.dev); }catch(e){ if(!POST.up) throw e; } }
    if(have) hpLog('この端末はもう郵便受けに入っていた（足し直さずに続きから）');
    if(!have){
    L.wait='adddev'; L.ok=false; L.err=null; await hpSend({ op:'adddev', dev:q.dev, devSig:devSig });
    const t0=Date.now(); while(!L.ok&&!L.err&&Date.now()-t0<20000) await sleep(100);
    L.wait=null; if(!L.ok) throw new Error(L.err||'管理人から返事がない');
    }   L.resume=false;
    const childCard={ v:3, id:ID.address, master:ID.publicKey, post:[POST.url], devices:[q.dev], devSigs:{[q.dev]:devSig}, token:JSON.parse(hpIssue(HP_LINK_TTL)), prekeys:[q.pre] };
    const me=await hp5Me(), list=contacts().map(c=>({address:c.address,nick:c.nick||'',pubKey:c.pubKey||null,keyAddedAt:c.keyAddedAt||0,card:c.card||null,cardAt:c.cardAt||0,mt:hpRowMt(c)}));
    const chunks=[]; let cur=[]; for(const c of list){ cur.push(c); if(JSON.stringify(cur).length>HP_LINK_CHUNK){ cur.pop(); if(cur.length) chunks.push(cur); cur=[c]; } } if(cur.length) chunks.push(cur);
    const one=chunks.length<=1;
    await hpPut(childCard, JSON.stringify({ v:1, type:'welcome', devSig:devSig, name:myName()||'', label:q.label, hist:(L.hist!==false)?1:0, main:{dev:me.dev,devSig:me.devSig,pre:await hpPrekeyPub(),label:hpDevLabelGuess()}, contacts:one?(chunks[0]||[]):null, parts:one?0:chunks.length }), 'msg');
    if(!one){ for(let i=0;i<chunks.length;i++) await hpPut(childCard, JSON.stringify({ v:1, type:'sibc', i:i+1, n:chunks.length, contacts:chunks[i] }), 'msg'); }
    if(!Array.isArray(ID.devs)) ID.devs=[];
    ID.devs.push({ dev:q.dev, devSig:devSig, label:q.label, at:Date.now(), pre:q.pre }); saveID();
    if(L.hist!==false&&typeof sibHistAsk==='function'){ try{ sibHistAsk(q.dev); }catch(e){} }
    L.done=true; L.req=null; try{ if(typeof hpLqDrop==='function') hpLqDrop(L); }catch(e){}   { const t=setTimeout(()=>{ if(HP_LINK===L){ HP_LINK=null; try{ hpLinkUi(); }catch(e){} } },HP_LINK_DONE_KEEP); try{ if(t&&t.unref) t.unref(); }catch(e){} }   hpLog('機械を足した（端末 '+q.dev.slice(0,10)+'…、連絡先 '+list.length+' 件を渡した）');
    try{ renderDevices(); }catch(e){} try{ hpLinkUi(); }catch(e){}
    try{ hpAfterDevChange('add'); }catch(e){} try{ hpHSet('p2p_sibc',''); hpSibSyncSoon(); }catch(e){}
    return true;
  }catch(e){ L.busy=false; L.wait=null; L.fail=(e&&e.message==='too many devices')?T('e_link_boxfull'):e.message;   if(e&&e.message==='too many devices'&&typeof hpGhostOffer==='function') setTimeout(()=>{ hpGhostOffer(L).catch(()=>{}); },0);   if(L.fail===e.message&&typeof hpErrShow==='function') L.fail=hpErrShow(e);   hpLog('機械を足せない '+e.message); try{ hpLinkResumeArm(L,e); }catch(e3){}   try{ hpLinkUi(); }catch(e2){} return false; }
}

async function hpLinkJoin(text, label){
  if(ID) throw new Error(T('e_join_hasid'));
  if(typeof hpVaultOn==='function'&&hpVaultOn()&&(typeof VAULT==='undefined'||!VAULT)) throw new Error(T('e_join_locked'));
  if(typeof hpLqIs==='function'&&hpLqIs(text)) text=await hpLqFetch(text);
  let o=null; try{ o=JSON.parse(String(text||'').trim()); }catch(e){}
  if(!o||o.v!==1||o.t!=='handpost-link'||!/^[0-9a-f]{64}$/.test(o.secret||'')||!o.card) throw new Error(T('e_join_bad'));
  if(!(o.exp>Date.now())) throw new Error(T('e_join_old'));
  try{ if(o.card&&Array.isArray(o.card.roster)&&typeof hpTrChain==='function') await hpTrChain(o.card.roster,[]); }catch(e){}
  const card=await hpCardCheck(o.card); if(card.devices.length!==1) throw new Error(T('e_join_bad'));
  const kp=await hpDevKey(), dev=hpHex(kp.publicKey), pre=await hpPrekeyPub();
  if(card.devices[0]===dev) throw new Error(T('e_join_same'));
  label=String(label||hpDevLabelGuess()).slice(0,32);
  await hpPut(card, JSON.stringify({ v:1, type:'link-req', proof:hpLinkProof(o.secret, card.id, dev, pre.x25519), label:label }), 'sig', { link:true });
  if(HP_JOIN&&HP_JOIN.timer) clearInterval(HP_JOIN.timer);
  HP_JOIN={ id:card.id, master:card.master, mainDev:card.devices[0], dev:dev, label:label, secret:o.secret, exp:o.exp, sas:hpLinkSas(o.secret, card.id, card.devices[0], dev, pre.x25519), stash:[], timer:null };
  try{ localStorage.setItem('p2p_post', card.post[0]); }catch(e){}
  hpLog('連携を申し込んだ。親機の承認を待つ'); try{ stopBg(); startBg(); }catch(e){}
  HP_JOIN.timer=setInterval(hpJoinTick, 4000); try{ hpLinkUi(); }catch(e){}
  hpJoinSave();
  return HP_JOIN.sas;
}
function hpJoinTick(){
  const J=HP_JOIN; if(!J||ID){ if(J&&J.timer) clearInterval(J.timer); return; }
  if(Date.now()>J.exp+120e3){ clearInterval(J.timer); HP_JOIN=null; hpJoinSave();   hpLog('連携の承認が来なかった（期限切れ）'); try{ hpLinkUi(T('join_timeout')); }catch(e){} return; }
  if(POST.up) hpSync(); else startBg();
}

const HP_JOIN_KEY='p2p_join';
function hpJoinDrop(){ try{ localStorage.removeItem(HP_JOIN_KEY); }catch(e){ try{ localStorage.setItem(HP_JOIN_KEY,''); }catch(e2){} } }
function hpJoinSave(){ try{ const J=HP_JOIN; if(!J||(typeof ID!=='undefined'&&ID)){ hpJoinDrop(); return; } localStorage.setItem(HP_JOIN_KEY, JSON.stringify({id:J.id,master:J.master,mainDev:J.mainDev,dev:J.dev,label:J.label,secret:J.secret,exp:J.exp,sas:J.sas,stash:Array.isArray(J.stash)?J.stash:[]})); }catch(e){} }
function hpJoinRestore(){
  try{
    if(HP_JOIN||(typeof ID!=='undefined'&&ID)) return false;
    const raw=localStorage.getItem(HP_JOIN_KEY); if(!raw) return false;
    let s=null; try{ s=JSON.parse(raw); }catch(e){}
    const drop=why=>{ hpJoinDrop(); hpLog('つなぐ途中の控えを捨てた（'+why+'）'); return false; };
    if(!s||!/^hp1[0-9a-f]{64}$/.test(s.id||'')||!/^[0-9a-f]{64}$/.test(s.secret||'')||typeof s.dev!=='string'||typeof s.mainDev!=='string'||typeof s.master!=='string') return drop('形が違う');
    if(!(Date.now()<=Number(s.exp)+120e3)) return drop('期限切れ');
    let has=false; try{ has=!!hpSecGet('p2p_id'); }catch(e){ return false; } if(has) return drop('アカウントがもうある');
    HP_JOIN={ id:s.id, master:s.master, mainDev:s.mainDev, dev:s.dev, label:String(s.label||'').slice(0,32), secret:s.secret, exp:Number(s.exp), sas:String(s.sas||''), stash:Array.isArray(s.stash)?s.stash.slice(0,64):[], timer:null };
    HP_JOIN.timer=setInterval(hpJoinTick, 4000); hpLog('つなぐ途中の控えから続ける（メイン端末の承認を待つ）'); try{ hpLinkUi(); }catch(e){}
    return true;
  }catch(e){ return false; }
}

const HP_LINK_FATAL=['bad sig','bad dev','removed','too many devices','not owner','署名を作れない'];
function hpLinkResumeArm(L,e){
  const m=String((e&&e.message)||e||'');
  if(!L||!L.req||L.done||!(L.exp>Date.now())||HP_LINK_FATAL.indexOf(m)>=0||m===T('e_link_main')||(L.tries||0)>=5) return false;
  L.tries=(L.tries||0)+1; L.resume=true; L.fail=null;
  if(L.rtimer) clearInterval(L.rtimer);
  L.rtimer=setInterval(()=>{
    if(HP_LINK!==L||L.done){ clearInterval(L.rtimer); L.rtimer=null; return; }
    if(!(L.exp>Date.now())){ clearInterval(L.rtimer); L.rtimer=null; L.resume=false; L.fail=T('e_join_old'); try{ hpLinkUi(); }catch(x){} return; }
    let hid=false; try{ hid=!!(typeof document!=='undefined'&&document.hidden); }catch(x){}
    if(POST.up&&!POST.notOwner&&!L.busy&&!hid){ clearInterval(L.rtimer); L.rtimer=null; hpLog('つなぎ直したので、端末の追加を続ける'); hpLinkApprove().catch(()=>{}); }
  },2000);
  hpLog('端末の追加が途中で止まった。つなぎ直したら続ける（'+m+'）');
  return true;
}

async function hpSibLetter(r){
  let o=null; try{ o=JSON.parse(r.body); }catch(e){} if(!o||o.v!==1||['sib6'  ,'welcome','sibc','sibd','sibp','sibhq','mvoffer','mvno','ppreq','ppcancel','sibme','histpull','sibmv'  ,'vlpaper'].indexOf(o.type)<0  ) return false;
  const J=HP_JOIN;
  if(!ID&&J){
    if(r.from!==J.id||r.fromMaster!==J.master||r.fromDev!==J.mainDev){ hpLog('親機でない相手からの '+o.type+'（捨てた）'); return true; }
    if(o.type==='sibc'||o.type==='sibd'){ J.stash.push(o); hpJoinSave();   return true; }
    if(o.type!=='welcome') return true;
    if(!(await hp5IdOk(J.id, J.master, J.dev, o.devSig))){ hpLog('親機の署名を確かめられない（捨てた）'); return true; }
    const obj={ address:J.id, publicKey:J.master, contacts:[], myName:String(o.name||'').slice(0,24), link:{ dev:J.dev, devSig:o.devSig, at:Date.now(), label:J.label, main:(o.main&&o.main.dev===J.mainDev)?o.main:{dev:J.mainDev} } };
    if(Array.isArray(o.rs)){ obj.roster=o.rs; obj.link.rs=1; if(o.main&&typeof o.main.dev==='string') obj.link.main=o.main; if(Array.isArray(o.sibs)) obj.link.sibs=o.sibs.filter(d=>d&&typeof d.dev==='string'&&d.dev!==J.dev&&d.dev!==obj.link.main.dev).slice(0,HP_DEV_MAX); if(o.box6&&typeof o.box6==='object'&&!Array.isArray(o.box6)) obj.box6=o.box6; }
    if(J.timer) clearInterval(J.timer); HP_JOIN=null; hpJoinSave();
    await applyIdentity(obj,false);
    let n=await hpSibContacts(Array.isArray(o.contacts)?o.contacts:[]); for(const s of J.stash){ if(s.type==='sibc') n+=await hpSibContacts(s.contacts); }
    for(const s of J.stash){ if(s.type==='sibd') await hpSibDevs(s,{fromDev:J.mainDev}); }
    try{ POST.notOwner=false; hpBanner(null); try{ if(typeof hpVaultNag==='function') hpVaultNag(); }catch(e){}   if(POST.up) dot('d-rly','ok'); }catch(e){}
    if(o.hist===1&&typeof hpHistWait==='function'){ try{ hpHistWait(J.mainDev); }catch(e){} }
    hpLog('子機になった（親機の署名を保存。連絡先 '+n+' 件）'); try{ hpLinkUi(T('join_done')); }catch(e){}
    return true;
  }
  if(!ID||r.from!==ID.address||r.fromMaster!==ID.publicKey){ hpLog('自分の機械でない相手からの '+o.type+'（捨てた）'); return true; }
  hpSeenMark(r.fromDev, Number(o.seen)||r.sentAt);
  if(o.type==='sibc'&&o.full===1) await hpSibSyncIn(o,r);
  else if(o.type==='sibc'){ const n=await hpSibContacts(o.contacts); hpLog('連絡先 '+n+' 件を受け取った（自分の機械から）'); }
  else if(o.type==='sibd'){ if(o.main&&typeof hpMvSeen==='function') await hpMvSeen(o,r); await hpSibDevs(o,r); }
  else if(o.type==='mvoffer'){ if(typeof hpMvOfferIn==='function') await hpMvOfferIn(o,r); }
  else if(o.type==='mvno'){ if(typeof hpMvNoIn==='function') hpMvNoIn(o,r); }
  else if(o.type==='ppreq'){ if(typeof hpPpIn==='function') hpPpIn(o,r); }
  else if(o.type==='ppcancel'){ if(typeof hpPpCancelIn==='function') hpPpCancelIn(o,r); }
  else if(o.type==='vlpaper'){ if(typeof hpVlPaperIn==='function') hpVlPaperIn(o,r); }
  else if(o.type==='sibhq'){ if(typeof hpHistWait==='function') hpHistWait(r.fromDev); hpLog('自分の機械（'+String(r.fromDev).slice(0,10)+'…）が過去の会話を写す予約をした（線がつながったら届く）'); }
  else if(o.type==='histpull'){ const who=String(r.fromDev||'').slice(0,10)+'…'; if(typeof sibHistAsk==='function'&&typeof hpHistHave==='function'&&hpHistHave()){ const r0=sibHistAsk(r.fromDev); hpLog('自分の機械（'+who+'）から、持っている会話を送るよう頼まれた（'+(r0==='now'?'すぐ送る':r0==='later'?'線がつながったら送る':'送れない')+'）'); } else hpLog('自分の機械（'+who+'）から会話を頼まれたが、この端末に送る会話は無い'); }
  else if(o.type==='sibme'){   if(hpIsMain()){ const row=(Array.isArray(ID.devs)?ID.devs:[]).find(d=>d&&d.dev===r.fromDev), lb=String(o.label||'').slice(0,32); if(row&&lb&&row.label!==lb){ row.label=lb; saveID(); try{ renderDevices(); }catch(e){} hpLog('サブ端末の名前を受け取った（'+lb+'）'); hpDevListSend().catch(()=>{}); } } }
  else if(o.type==='sibmv'){ if(typeof hpMoveIn==='function') await hpMoveIn(o,r); }
  else if(o.type==='sib6'){ if(typeof hpMcSibIn==='function') await hpMcSibIn(o,r); }
  else if(o.type==='sibp') hpLog('自分の機械（'+String(r.fromDev).slice(0,10)+'…）の新しい受け取り用の鍵を控えた');
  return true;
}
async function hpSibContacts(list){
  if(!ID||!Array.isArray(list)) return 0; let n=0;
  for(const c of list.slice(0,2000)){
    if(!c||!hpIdFmt(c.address)||c.address===ID.address) continue;
    let card=null; if(c.card&&typeof c.card==='object'&&c.card.id===c.address){ try{ card=await hpCardCheck(c.card); }catch(e){ card=null; } }
    const nick=String(c.nick||'').slice(0,24); let x=ID.contacts.find(y=>y.address===c.address);
    if(!x){ x={ address:c.address, nick:nick, pubKey:card?card.master:(typeof c.pubKey==='string'?c.pubKey:null), keyAddedAt:Number(c.keyAddedAt)||Date.now() }; ID.contacts.push(x); }
    else if(nick) x.nick=nick;
    if(Number(c.mt)>0&&!(x.mt>=Number(c.mt))) x.mt=Number(c.mt);
    if(card&&(!x.pubKey||x.pubKey===card.master)) hpGoneMerge(x,card);
    if(card&&(!x.card||(Number(c.cardAt)||0)>=(x.cardAt||0))){ if(x.pubKey&&x.pubKey!==card.master) continue; x.card=card; x.pubKey=card.master; x.cardAt=Number(c.cardAt)||Date.now(); }
    n++;
  }
  saveID(); try{ renderContacts(); }catch(e){} return n;
}

function hpLinkUiInit(){
  const E=id=>document.getElementById(id), mk=(tag,id,css)=>{ const e=document.createElement(tag); e.id=id; if(css) e.style.cssText=css; return e; };
  const panel=E('link-panel');
  if(panel&&!E('hp-link-text')){
    const ta=mk('textarea','hp-link-text','width:100%;height:84px;font-size:11px;margin-top:6px'); ta.readOnly=true;
    const row=mk('div','hp-link-row','margin-top:6px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap');
    const cp=mk('button','hp-link-copy'); cp.className='b'; const ok=mk('button','hp-link-ok'); ok.className='b pri'; const no=mk('button','hp-link-no'); no.className='b';
    const warn=mk('div','hp-link-warn','margin-top:8px;color:var(--amber);font-size:13px'); warn.className='note';
    row.appendChild(cp); row.appendChild(ok); row.appendChild(no);
    const hl=mk('label','hp-link-hist','display:block;margin-top:8px;font-size:13px'); const hc=document.createElement('input'); hc.type='checkbox'; hc.checked=true; hc.id='hp-link-histck'; hc.onchange=()=>{ if(HP_LINK) HP_LINK.hist=hc.checked; }; const hs=document.createElement('span'); hs.id='hp-link-histtx'; hl.appendChild(hc); hl.appendChild(hs); panel.insertBefore(hl, E('link-status')||null);
    const st=E('link-status'); panel.insertBefore(ta, st||null); panel.insertBefore(warn, st||null); panel.insertBefore(row, st||null);
    cp.onclick=async()=>{ try{ await navigator.clipboard.writeText(HP_LINK?(HP_LINK.url||HP_LINK.short||HP_LINK.text):''); cp.textContent='✓'; setTimeout(()=>hpLinkUi(),1500); }catch(e){ try{ ta.focus(); ta.select(); }catch(e2){} } };
    ok.onclick=async()=>{ if(ok.disabled) return; ok.disabled=true; let v=false; try{ v=await hpAsk({text:T('ask_link'), auth:true, ok:T('btn_link_ok'), why:'サブ端末を足す'}); }finally{ ok.disabled=false; } if(v) hpLinkApprove(); }; no.onclick=()=>{ hpLog('連携を断った'); hpLinkCancel(); };
  }
  const bs=E('btn-link-start'); if(bs) bs.onclick=()=>{ hpLinkStartBtn(bs); };
  const jc=E('linkjoin-card');
  if(jc&&!E('hp-join-text')){
    const old=E('linkjoin-code'); if(old&&old.parentNode) old.parentNode.style.display='none';
    const ta=mk('textarea','hp-join-text','width:100%;height:84px;font-size:11px;margin-top:6px');
    const bt=mk('button','hp-join-btn','margin-top:6px'); bt.className='b';
    const sc=mk('button','hp-join-scan','margin-top:10px;font-size:17px;padding:12px 22px;display:block'); sc.className='b pri'; sc.onclick=()=>{ if(typeof startScanFull==='function') startScanFull(v=>{ ta.value=v; if(!bt.disabled) bt.click(); },{title:T('btn_join_scan'),nocam:T('join_nocam')}); };
    const sas=mk('div','hp-join-sas','font-size:42px;font-weight:700;letter-spacing:6px;margin:8px 0;color:var(--teal);text-align:center;display:none');
    const st=E('linkjoin-status');   const dt=mk('div','hp-join-more','margin-top:12px'); const su=document.createElement('div'); su.style.cssText='font-weight:600;margin:6px 0 2px'; su.id='hp-join-more-s'; su.textContent=T('join_more'); dt.appendChild(su); dt.appendChild(ta); dt.appendChild(bt); jc.insertBefore(sc, st||null); jc.insertBefore(sas, st||null); jc.insertBefore(dt, st||null);   ta.addEventListener('paste',()=>{ setTimeout(()=>{ if(String(ta.value||'').trim()&&!bt.disabled) bt.click(); },0); });
    bt.onclick=()=>{ bt.disabled=true; hpLinkJoin(ta.value).then(()=>{ ta.value=''; }).catch(e=>{ hpLog('連携を申し込めない '+((e&&e.hpk==='peer')?TL('e_join_refused'):e.message)); hpLinkUi((e&&e.hpk==='peer')?T('e_join_refused'):e.message); }).then(()=>{ bt.disabled=false; }); };
  }
  hpLinkUi();
}
function hpLinkUi(msg){
  const E=id=>document.getElementById(id), show=(e,on)=>{ if(e) e.style.display=on?'':'none'; };
  const panel=E('link-panel'), L=HP_LINK;
  if(panel){
    const live=!!L, req=live&&L.req, code=E('link-code'), st=E('link-status');
    panel.style.display=live?'block':'none';
    if(E('hp-link-copy')) E('hp-link-copy').textContent=T('btn_link_copy'); if(E('hp-link-ok')) E('hp-link-ok').textContent=T('btn_link_ok'); if(E('hp-link-no')) E('hp-link-no').textContent=(req?T('btn_link_no'):T('btn_link_cancel'));
    if(live){
      if(E('hp-link-text')){ E('hp-link-text').value=L.url||L.short||L.text;   show(E('hp-link-text'),!req&&!L.done); } show(E('hp-link-copy'),!req&&!L.done);
      show(E('hp-link-ok'),!!req&&!L.busy); show(E('hp-link-no'),!L.busy&&!L.done);
      if(code){ code.textContent=req?hpSasFmt(req.sas):''; show(code,!!req); }
      { const hl=E('hp-link-hist'), hs=E('hp-link-histtx'), hc=E('hp-link-histck'); if(hs) hs.textContent=' '+T('lk_hist'); if(hc) hc.checked=!(L&&L.hist===false); show(hl,!!req&&!L.busy); }
      if(E('hp-link-warn')){ E('hp-link-warn').textContent=req?TF('nt_link_warn',{label:req.label||'-'}):''; show(E('hp-link-warn'),!!req); }
      const cv=E('link-qrcanvas'); if(cv){ let drawn=false; if(!req&&!L.done){ try{ QR.draw(cv, L.url||L.short||L.text); drawn=true; }  catch(e){} } cv.style.display=drawn?'block':'none'; }
      if(st) st.textContent=L.done?T('link_done'):L.busy?T('link_busy'):L.fail?TF('link_fail',{err:L.fail}):req?'':T('link_wait');
      if(st&&L.resume&&!L.busy&&!L.done) st.textContent=T('link_resume');
      const nt=panel.querySelector?panel.querySelector('[data-i18n="link_code_note"]'):null; if(nt) show(nt,!req&&!L.done);
    }
  }

  const J=HP_JOIN, js=E('linkjoin-status'), sas=E('hp-join-sas');
  if(E('hp-join-btn')) E('hp-join-btn').textContent=T('btn_join_paste'); if(E('hp-join-text')){ E('hp-join-text').placeholder=T('ph_join_paste'); show(E('hp-join-text'),!J); } show(E('hp-join-btn'),!J); if(E('hp-join-scan')){ E('hp-join-scan').textContent=T('btn_join_scan'); show(E('hp-join-scan'),!J); }   show(E('hp-join-more'),!J); if(E('hp-join-more-s')) E('hp-join-more-s').textContent=T('join_more');
  if(sas){ sas.textContent=J?hpSasFmt(J.sas):''; sas.style.display=J?'block':'none'; }
  if(js) js.textContent=(typeof msg==='string')?msg:(J?T('join_wait'):'');
  try{ if(typeof hpLqFocusUi==='function') hpLqFocusUi((typeof msg==='string')?msg:''); }catch(e){}
}

const HP_CARD_FUTURE=600e3, HP_DEVEV_KEEP=5;
let HP_SPREAD_CHAIN=Promise.resolve();
function hpPreValid(p, dev, at){ try{ return !!(p&&p.dev===dev&&hp5PreOk(dev,p.x25519,p.notAfter,p.sig,at||Date.now())); }catch(e){ return false; } }

function hpSibs(){
  if(hpIsMain()) return (Array.isArray(ID.devs)?ID.devs:[]).map(d=>({dev:d.dev,devSig:d.devSig,label:d.label||'',at:d.at||0,pre:d.pre||null,role:'child',seen:d.seen||0}));
  if(hpIsChild()){
    const out=[], m=ID.link.main||{};
    if(m.dev&&m.devSig) out.push({dev:m.dev,devSig:m.devSig,label:m.label||'',at:0,pre:m.pre||null,role:'main'});
    for(const d of (Array.isArray(ID.link.sibs)?ID.link.sibs:[])){ if(d&&d.dev&&d.dev!==ID.link.dev&&d.dev!==m.dev) out.push({dev:d.dev,devSig:d.devSig,label:d.label||'',at:d.at||0,pre:d.pre||null,role:'child'}); }
    return out;
  }
  return [];
}

function hpPreLearn(r){
  try{
    const fp=r&&r.fromPrekey; if(!ID||!fp||!r.fromDev||!hp5PreOk(r.fromDev,fp.x,fp.notAfter,fp.sig,Date.now())) return false;
    const pre={dev:r.fromDev,x25519:fp.x,notAfter:fp.notAfter,sig:fp.sig}, newer=old=>!old||!(old.notAfter>=pre.notAfter);
    let ch=false;
    if(r.from===ID.address){
      if(r.fromMaster!==ID.publicKey) return false;
      const rows=hpIsMain()?(Array.isArray(ID.devs)?ID.devs:[]):hpIsChild()?[ID.link.main].concat(Array.isArray(ID.link.sibs)?ID.link.sibs:[]):[];
      for(const d of rows){ if(d&&d.dev===r.fromDev&&newer(d.pre)){ d.pre=pre; ch=true; } }
    } else {
      const c=(ID.contacts||[]).find(x=>x.address===r.from);
      if(c&&c.card&&c.pubKey===r.fromMaster&&Array.isArray(c.card.devices)&&c.card.devices.indexOf(r.fromDev)>=0&&Array.isArray(c.card.prekeys)){
        const i=c.card.prekeys.findIndex(q=>q&&q.dev===r.fromDev);
        if(i<0){ c.card.prekeys.push(pre); ch=true; } else if(newer(c.card.prekeys[i])){ c.card.prekeys[i]=pre; ch=true; }
      }
    }
    if(ch) saveID();
    return ch;
  }catch(e){ return false; }
}

async function hpSibPut(body, only, kind){
  if(!POST.up||POST.notOwner) throw new Error('自分のポストにつながっていない');
  try{ if(typeof hpMoveHoldWait==='function') await hpMoveHoldWait(); }catch(e){}
  const me=await hp5Me(), now=Date.now(), devices=[], devSigs={}, prekeys=[];
  for(const d of hpSibs()){
    if(only&&only.indexOf(d.dev)<0) continue;
    if(!hpPreValid(d.pre,d.dev,now)||!(await hp5IdOk(me.id,me.master,d.dev,d.devSig))) continue;
    devices.push(d.dev); devSigs[d.dev]=d.devSig; prekeys.push({dev:d.dev,x25519:d.pre.x25519,notAfter:d.pre.notAfter,sig:d.pre.sig});
  }
  if(!devices.length) return 0;
  const card={ v:3, id:me.id, master:me.master, post:[POST.url], devices:devices, devSigs:devSigs, token:JSON.parse(hpIssue(3600e3)), prekeys:prekeys };
  if(typeof hpMcBoxOf==='function') card.boxes=devices.map(d=>({ dev:d, post:hpMcBoxOf(d), token:card.token }));
  await hpPut(card, JSON.stringify(body), kind==='sig'?'sig':'msg');
  return devices.length;
}

let HP_DEVFILL_T=null, HP_DEVFILL_N=0;
function hpDevNeed(){ if(!hpIsMain()) return []; const now=Date.now(); return (Array.isArray(ID.devs)?ID.devs:[]).filter(d=>d&&d.dev&&(!d.devSig||!hpPreValid(d.pre,d.dev,now))); }
async function hpDevFill(why){
  if(!hpIsMain()||!POST.up||POST.notOwner) return 0;
  const need=hpDevNeed(); if(!need.length) return 0;
  for(let i=0;i<50&&typeof HP_BK!=='undefined'&&HP_BK;i++) await sleep(200);
  let r=null; try{ r=await hpBkReq({ op:'dget' }); }catch(e){ hpLog('サブ端末の署名を郵便受けから読めない（'+((e&&e.message)||e)+'）'); hpDevFillLater(); return 0; }
  const now=Date.now(); let n=0;
  for(const d of (Array.isArray(r&&r.devs)?r.devs:[])){
    const row=need.find(x=>x.dev===(d&&d.dev)); if(!row) continue;
    if(!row.devSig&&typeof d.devSig==='string'&&(await hp5IdOk(ID.address,ID.publicKey,d.dev,d.devSig))){ row.devSig=d.devSig; delete row.unk; n++; }
    const p=(d.pre&&typeof d.pre==='object')?{ dev:d.dev, x25519:d.pre.x25519, notAfter:d.pre.notAfter, sig:d.pre.sig }:null;
    if(row.devSig&&p&&hpPreValid(p,d.dev,now)&&!(row.pre&&row.pre.notAfter>=p.notAfter)){ row.pre=p; n++; }
  }
  if(n){
    saveID(); try{ renderDevices(); }catch(e){}
    hpLog('サブ端末の署名と受け取り用の鍵を郵便受けの控えで埋めた（'+n+' 件・'+why+'）');
    try{ await hpMainSigEnsure(); }catch(e){ hpLog('メイン端末の署名を作れない '+e.message); }
    try{ const k=await hpDevListSend(); hpLog('端末の一覧をサブ端末 '+k+' 台へ配った（メイン端末の署名つき）'); }catch(e){ hpLog('端末の一覧を配れない '+e.message); }
    setTimeout(()=>{ try{ if(typeof hpHistPullAuto==='function') hpHistPullAuto('紙から戻した').catch(()=>{}); }catch(e){} },5000);
  }
  if(hpDevNeed().length) hpDevFillLater();
  return n;
}
function hpDevFillLater(){ if(HP_DEVFILL_T||HP_DEVFILL_N>=60) return; HP_DEVFILL_N++; HP_DEVFILL_T=setTimeout(()=>{ HP_DEVFILL_T=null; hpDevFill('later').catch(()=>{}); },60000); }
async function hpMainSigEnsure(){
  if(!hpIsMain()||!POST.pub) return false;
  if(ID.mainSig&&ID.mainSig.dev===POST.pub) return false;
  const ts=Date.now(), sig=await edSign('handpost-main:v1:'+ID.address+':'+POST.pub+':'+ts);
  ID.mainSig={ dev:POST.pub, ts:ts, sig:sig }; saveID(); hpLog('実印で「この端末がメイン端末」と署名した'); return true;
}

async function hpHistPull(why){ if(!ID||!POST.up||POST.notOwner) return 0; let n=0; try{ n=await hpSibPut({ v:1, type:'histpull' }); }catch(e){ hpLog('会話を集める頼みを送れない '+((e&&e.message)||e)); return 0; } try{ hpHSet('p2p_histpull',String(Date.now())); }catch(e){} hpLog('自分の端末 '+n+' 台に、持っている会話を送るよう頼んだ（'+why+'）'); return n; }
async function hpHistPullAuto(why){ if(typeof hpHistHave==='function'&&hpHistHave()) return 0; let last=0; try{ last=Number(hpHGet('p2p_histpull'))||0; }catch(e){} if(Date.now()-last<6*3600e3) return 0; return await hpHistPull(why); }
async function hpSibMe(dev){ if(!hpIsChild()) return 0; return await hpSibPut({ v:1, type:'sibme', label:String(ID.link.label||hpDevLabelGuess()).slice(0,32) }, dev?[dev]:undefined); }
async function hpDevListSend(){
  if(!hpIsMain()) return 0;
  const me=await hp5Me();
  const devs=[{dev:me.dev,devSig:me.devSig,label:hpDevLabelGuess(),at:0,pre:await hpPrekeyPub(),role:'main',seen:Date.now()}].concat(hpSibs().map(d=>({dev:d.dev,devSig:d.devSig,label:d.label,at:d.at,pre:d.pre,role:'child',seen:d.seen||0})));
  return await hpSibPut({ v:1, type:'sibd', at:Date.now(), devs:devs, gone:hpMyGone().map(g=>({dev:g.dev,ts:g.ts,sig:g.sig})), ...((ID.mainSig&&ID.mainSig.dev===me.dev)?{main:{dev:ID.mainSig.dev,ts:ID.mainSig.ts,sig:ID.mainSig.sig}}:{}) });
}

async function hpSibDevs(o, r){
  if(!hpIsChild()){ hpLog('機械の一覧が届いたが、この機械は子機でない（捨てた）'); return false; }
  const L=ID.link, mainDev=L.main&&L.main.dev;
  if(!r||r.fromDev!==mainDev){ hpLog('親機でない機械からの一覧（捨てた）'); return false; }
  if(!Array.isArray(o.devs)||!(Number(o.at)>0)){ hpLog('機械の一覧の形が違う（捨てた）'); return false; }
  if(Number(o.at)<=(L.devsAt||0)){ hpLog('古い機械の一覧（捨てた）'); return false; }
  const first=!L.devsAt, before=new Set((Array.isArray(L.sibs)?L.sibs:[]).map(d=>d.dev)), oldPre={}, oldSeen={}; for(const d of (L.sibs||[])){ oldPre[d.dev]=d.pre; oldSeen[d.dev]=d.seen||0; } const seenOf=d=>Math.max(Math.min(Number(d.seen)||0,Date.now()),oldSeen[d.dev]||0);
  const goneSet=await hpSibGone(o.gone);
  const sibs=[]; let main=L.main;
  for(const d of o.devs.slice(0,HP_DEV_MAX+1)){
    if(!d||d.dev===L.dev||goneSet.has(d.dev)||!(await hp5IdOk(ID.address,ID.publicKey,d.dev,d.devSig))) continue;
    const pre=hpPreValid(d.pre,d.dev)?{dev:d.dev,x25519:d.pre.x25519,notAfter:d.pre.notAfter,sig:d.pre.sig}:null;
    if(d.dev===mainDev){ main={dev:d.dev,devSig:d.devSig,label:String(d.label||'').slice(0,32),pre:pre||(L.main&&L.main.pre)||null,seen:Math.max(Math.min(Number(d.seen)||0,Date.now()),(L.main&&L.main.seen)||0)}; continue; }
    if(sibs.length<HP_DEV_MAX&&!sibs.some(x=>x.dev===d.dev)) sibs.push({dev:d.dev,devSig:d.devSig,label:String(d.label||'').slice(0,32),at:Number(d.at)||0,pre:pre||oldPre[d.dev]||null,seen:seenOf(d)});
  }
  const added=sibs.filter(d=>!before.has(d.dev)), gone=[...before].filter(x=>!sibs.some(d=>d.dev===x));
  L.main=main; L.sibs=sibs; L.devsAt=Number(o.at);
  if(!first&&(added.length||gone.length)){ for(const c of (ID.contacts||[])){ if(c.card&&!c.cardDue) c.cardDue=2; } }
  saveID(); try{ renderDevices(); }catch(e){}
  hpLog('機械の一覧を受け取った（親機＋子機 '+(sibs.length+1)+' 台）');
  if(!first&&gone.length){ hpNotice(TF('nt_dev_removed',{n:gone.length})); try{ if(typeof hpNote==='function') hpNote('devrm',{n:gone.length},'devrm:'+gone.slice().sort().join(',')); }catch(e){} }
  if(!first){ for(const d of added){ const lb=d.label||(d.dev.slice(0,10)+'…'); hpLog('この身元に機械が足された：'+lb); hpNotice(TF('nt_dev_added',{label:lb})); try{ if(typeof hpNote==='function') hpNote('devadd',{label:lb},'devadd:'+d.dev); }catch(e){}   } }
  return true;
}

let HP_NOTICE_K='';
function hpNoticeOff(key){ if(!key||HP_NOTICE_K!==key) return false; HP_NOTICE_K=''; try{ const b=document.getElementById('hp-notice'); if(b) b.remove(); }catch(e){} return true; }
function hpNotice(text,key){
  HP_NOTICE_K=key||'';
  try{ log(text); }catch(e){}
  if(typeof document==='undefined'||!document.body||!text) return;
  try{
    let b=document.getElementById('hp-notice');
    if(!b){ b=document.createElement('div'); b.id='hp-notice'; b.style.cssText='background:var(--teal);color:#001a17;font-size:12px;line-height:1.5;padding:6px 12px;cursor:pointer'; b.onclick=()=>{ try{ b.remove(); }catch(e){} }; document.body.insertBefore(b,document.body.firstChild); }
    b.textContent=text;
  }catch(e){}
}

function hpCardDueMark(v){ let n=0; for(const c of ((ID&&ID.contacts)||[])){ if(c.card){ c.cardDue=v; delete c.cardTry; n++; } } if(n) saveID(); return n; }
function hpCardDueNow(c, now, force){
  if(!c||c.cardDue!==1||!c.card||hpBlocked(c.address)) return false;
  const t=c.cardTry; if(!t||force) return true;
  if(t.k==='peer') return (c.cardAt||0)>(t.at||0);
  if(t.k!=='wait') return false;
  return now-(t.at||0)>=(HP_RS_STEPS[(t.n||1)-1]||HP_RS_LAST);
}
async function hpCardSendTo(c){
  try{
    const card=JSON.parse(await hpCard(undefined,'tail'))  ; hpTkNote(c.address,card.token.id,card.token.exp);
    await hpPut(c.card, JSON.stringify({ v:1, type:'card', card:card }), 'msg');
    delete c.cardDue; delete c.cardTry; saveID(); hpLog('新しい名刺を届けた → '+nickOf(c.address)+'（端末 '+(card.boxes||card.devices||[]).length+' 台ぶん）');
    return true;
  }catch(e){
    const k=e.hpk||'wait'; c.cardTry={ k:k, at:Date.now(), n:((c.cardTry&&c.cardTry.n)||0)+1 }; saveID();
    try{ console.debug('post: card not delivered:', c.address, e.hpWhy||e.message); }catch(_){}
    hpLog('新しい名刺を届けられない '+nickOf(c.address)+' '+(k==='peer'?TL('lg_fail_peer'):e.message));
    return false;
  }
}
async function hpCardDueRun(force){
  if(!ID||!POST.up||POST.notOwner) return 0; let n=0;
  for(const c of contacts()){
    if(!hpCardDueNow(c,Date.now(),force)) continue;
    if(n&&HP_RS_GAP) await sleep(HP_RS_GAP);
    n++; await hpCardSendTo(c);
  }
  return n;
}

function hpAfterDevChange(why){
  HP_SPREAD_CHAIN=HP_SPREAD_CHAIN.then(async()=>{
    if(!hpIsMain()) return;
    try{ if(why!=='boot'&&typeof hpBxMark==='function') hpBxMark(); }catch(e){}
    const fresh=(why!=='boot'||ID.devsDue===undefined);
    try{ const n=await hpDevListSend(); ID.devsDue=0; saveID(); if(n) hpLog('機械の一覧を自分の機械 '+n+' 台へ送った'); }
    catch(e){ ID.devsDue=1; saveID(); hpLog('機械の一覧を送れない（つなぎ直したらもう一度）'+e.message); }
    if(fresh){ const m=hpCardDueMark(1); if(m) hpLog('新しい名刺を連絡先 '+m+' 件へ配る'); }
    await hpRsRun(()=>hpCardDueRun(fresh));
  }).catch(e=>{ try{ hpLog('配る途中で失敗 '+e.message); }catch(_){} });
  return HP_SPREAD_CHAIN;
}

async function hpSibAnnounce(){
  if(!ID||!POST.up||POST.notOwner) return false;
  if(hpIsMain()&&Array.isArray(ID.devs)&&ID.devs.length&&ID.devsDue!==0) hpAfterDevChange('boot');
  if(!hpSibs().length) return false;
  hpSibSyncSoon();
  const x=(await hpPrekeyPub()).x25519, same=(hpHGet('p2p_sibp')===x), seenDue=(Date.now()-(Number(hpHGet('p2p_sibseen'))||0)>HP_SEEN_GAP);
  if(same&&!seenDue) return false;
  const n=await hpSibPut({ v:1, type:'sibp', seen:Date.now() });
  if(n){ hpHSet('p2p_sibseen', String(Date.now())); if(same) return true; hpHSet('p2p_sibp', x);   hpLog('新しい受け取り用の鍵を自分の機械 '+n+' 台へ知らせた'); }
  return !!n;
}

function hpDevEvText(c, ev){ const nm=nickOf(c.address), out=[]; if(ev.add&&ev.rm) return TF('sys_dev_both',{name:nm,add:ev.add,rm:ev.rm,n:ev.n});   if(ev.add) out.push(TF('sys_dev_add',{name:nm,add:ev.add,n:ev.n})); if(ev.rm) out.push(TF('sys_dev_rm',{name:nm,rm:ev.rm,n:ev.n})); return out.join(' '); }
function hpDevEvent(c, a, b, oldKinds){
  if(!c||!Array.isArray(a)||!Array.isArray(b)) return null;
  const adds=b.filter(x=>a.indexOf(x)<0), rms=a.filter(x=>b.indexOf(x)<0), add=adds.length, rm=rms.length; if(!add&&!rm) return null;
  const ev={ at:Date.now(), add:add, rm:rm, n:b.length, adds:adds.map(hpFdOf).filter(Boolean), rms:rms.map(hpFdOf).filter(Boolean) };
  { const nk=(c.card&&c.card.devKinds)||{}, ok=(oldKinds&&typeof oldKinds==='object')?oldKinds:{}, kinds={}; for(const x of adds){ const f=hpFdOf(x), k=nk[x]; if(f&&HP_DEV_KINDS.indexOf(k)>=0) kinds[f]=k; } for(const x of rms){ const f=hpFdOf(x), k=ok[x]; if(f&&HP_DEV_KINDS.indexOf(k)>=0) kinds[f]=k; } if(Object.keys(kinds).length) ev.kinds=kinds; }
  c.devEv=(Array.isArray(c.devEv)?c.devEv:[]).concat([ev]).slice(-HP_DEVEV_KEEP);
  const text=hpDevEvText(c,ev); hpLog(text);
  if(CURPEER===c.address&&CONV_OPEN&&typeof addSys==='function'){ try{ hpDevEvShow(c,ev,text); }catch(e){} }
  return ev;
}
function hpDevEvEl(c,ev){ const d=document.createElement('div'); d.className='m sys hpdevev'; d.textContent=hpDevEvText(c,ev); if(ev&&((ev.adds&&ev.adds.length)||(ev.rms&&ev.rms.length))){ try{ d.appendChild(document.createTextNode(' ')); hpDevMarksInto(d,ev.adds||[],c.address,{kindText:true,fdKinds:ev.kinds}); hpDevMarksInto(d,ev.rms||[],c.address,{dim:true,kindText:true,fdKinds:ev.kinds});   }catch(e){} } return d; }
function hpDevEvShow(c,ev,text){ let box=null; try{ box=(typeof document!=='undefined'&&typeof document.querySelector==='function')?document.querySelector('#msgs'):null; }catch(e){ box=null; } if(box&&typeof box.appendChild==='function'&&typeof document.createElement==='function'){ box.appendChild(hpDevEvEl(c,ev)); try{ if(typeof scrollNew==='function') scrollNew(); }catch(e){} } else { addSys(text); } }

function hpDevEvRows(peer){
  try{
    if(CURPEER!==peer||typeof document==='undefined'||typeof document.querySelectorAll!=='function') return 0;
    const c=((ID&&ID.contacts)||[]).find(x=>x.address===peer); if(!c||!Array.isArray(c.devEv)||!c.devEv.length) return 0;
    const box=document.querySelector('#msgs'); if(!box||typeof box.querySelectorAll!=='function') return 0;
    for(const old of box.querySelectorAll('.hpdevev')) old.remove();
    const els=Array.from(box.querySelectorAll('.m')).filter(e=>e.dataset&&e.dataset.ts); let n=0;
    for(const ev of c.devEv){
      const d=hpDevEvEl(c,ev);
      const nx=els.find(e=>Number(e.dataset.ts)>ev.at); if(nx) box.insertBefore(d,nx); else box.appendChild(d); n++;
    }
    return n;
  }catch(e){ return 0; }
}

const HP_GONE_MAX=20;
let HP_RM=null;
const hp5RmMsg=(id,dev,ts)=>'handpost-rmdev:v1:'+id+':'+dev+':'+ts;
function hpMyGone(){ if(!ID) return []; const g=hpIsMain()?ID.gone:hpIsChild()?ID.link.gone:null; return Array.isArray(g)?g:[]; }
function hpGoneHas(c, dev){ return !!(c&&c.gone&&typeof c.gone==='object'&&dev&&c.gone[dev]); }

function hpGoneFrom(r){
  try{ if(!ID||!r||!r.fromDev) return false; if(r.from===ID.address) return hpMyGone().some(g=>g&&g.dev===r.fromDev); return hpGoneHas((ID.contacts||[]).find(x=>x.address===r.from), r.fromDev); }catch(e){ return false; }
}

async function hpDevOk(r){
  try{
    if(!ID||!r||!r.fromDev) return true;
    if(r.from===ID.address) return true;
    const c=(ID.contacts||[]).find(x=>x.address===r.from);
    if(!c||!c.card||!Array.isArray(c.card.devices)||!c.card.devices.length) return true;
    if(c.card.devices.indexOf(r.fromDev)>=0) return true;
    let o=null; try{ o=JSON.parse(r.body); }catch(e){ o=null; }
    const k=o&&o.card;

    if(k&&typeof k==='object'&&k.id===r.from&&k.master===r.fromMaster&&Array.isArray(k.devices)&&k.devices.indexOf(r.fromDev)>=0
       &&k.token&&(c.card.devices.indexOf(k.token.iss)>=0
         ||((!c.pubKey||c.pubKey===k.master)&&!hpGoneHas(c,r.fromDev)))){
      try{ await hpCardCheck(k); return true; }catch(e){ return false; }
    }
    return false;
  }catch(e){ return true; }
}

async function hpGoneCheck(card){
  if(card.gone===undefined) return true;
  if(!Array.isArray(card.gone)) throw new Error('外した機械の一覧の形が違う');
  for(const g of card.gone){
    if(!g||!/^ed[0-9a-f]{64}$/.test(g.dev)||!Number.isFinite(g.ts)||!/^[0-9a-f]{128}$/.test(g.sig||'')||!(await edVerify(card.master, hp5RmMsg(card.id,g.dev,g.ts), g.sig))) throw new Error('外した機械の一覧の署名が合わない');
    if(card.devices.indexOf(g.dev)>=0) throw new Error('外した機械が名刺に載っている');
  }
  return true;
}

function hpGoneMerge(c, card){
  if(!c||!card||!Array.isArray(card.gone)||!card.gone.length||(c.pubKey&&c.pubKey!==card.master)) return false;
  let ch=false; if(!c.gone||typeof c.gone!=='object') c.gone={};
  for(const g of card.gone){ if(!c.gone[g.dev]){ c.gone[g.dev]={ts:g.ts,sig:g.sig}; ch=true; } }
  const k=c.card; if(k&&k!==card&&Array.isArray(k.devices)&&k.devices.some(d=>c.gone[d])){
    k.devices=k.devices.filter(d=>!c.gone[d]); if(Array.isArray(k.prekeys)) k.prekeys=k.prekeys.filter(q=>q&&!c.gone[q.dev]); if(k.devSigs){ for(const d of Object.keys(k.devSigs)){ if(c.gone[d]) delete k.devSigs[d]; } } ch=true;
  }
  return ch;
}
function hpRmOnReply(o){ if(HP_RM&&HP_RM.wait){ if(o.ok===HP_RM.wait) HP_RM.ok=true; else if(o.err) HP_RM.err=String(o.err); } }

async function hpDevRemove(dev){
  if(!hpIsMain()) throw new Error(T('e_link_main'));
  if(!POST.up||POST.notOwner) throw new Error(T('e_link_post'));
  const d=(Array.isArray(ID.devs)?ID.devs:[]).find(x=>x.dev===dev); if(!d) throw new Error(T('e_rm_nodev'));
  if(HP_RM) throw new Error(T('e_rm_busy'));
  const ts=Date.now(), sig=await edSign(hp5RmMsg(ID.address,dev,ts)), W={ wait:'rmdev', ok:false, err:null }; HP_RM=W;
  try{
    await hpSend({ op:'rmdev', dev:dev, ts:ts, sig:sig });
    const t0=Date.now(); while(!W.ok&&!W.err&&Date.now()-t0<20000) await sleep(100);
  } finally { HP_RM=null; }
  if(!W.ok&&W.err!=='bad dev'){ hpLog('機械を外せない '+(W.err||'管理人から返事がない')); throw new Error(W.err||T('e_rm_noreply')); }
  try{ if(typeof hpBxGoneNote==='function') hpBxGoneNote(dev); }catch(e){}
  ID.devs=ID.devs.filter(x=>x.dev!==dev);
  ID.gone=(Array.isArray(ID.gone)?ID.gone:[]).filter(g=>g.dev!==dev).concat([{ dev:dev, ts:ts, sig:sig, label:d.label||'', at:Date.now() }]);
  if(HP_LINK&&HP_LINK.done){ HP_LINK=null; try{ hpLinkUi(); }catch(e){} }
  saveID(); hpLog('機械を外した（端末 '+dev.slice(0,10)+'…）。残りの機械と連絡先へ知らせる');
  try{ if(typeof sibClose==='function') sibClose(dev); }catch(e){}
  try{ renderDevices(); }catch(e){}
  try{ hpAfterDevChange('rm'); }catch(e){}
  return true;
}

async function hpSibGone(list){
  const L=ID.link, out=Array.isArray(L.gone)?L.gone.slice():[];
  for(const g of (Array.isArray(list)?list:[])){
    if(!g||out.some(x=>x.dev===g.dev)) continue;
    let good=false; try{ good=/^ed[0-9a-f]{64}$/.test(g.dev)&&Number.isFinite(g.ts)&&/^[0-9a-f]{128}$/.test(g.sig||'')&&(await edVerify(ID.publicKey, hp5RmMsg(ID.address,g.dev,g.ts), g.sig)); }catch(e){}
    if(good) out.push({dev:g.dev,ts:g.ts,sig:g.sig});
  }
  L.gone=out; return new Set(L.gone.map(g=>g.dev));
}

async function hpOnRemoved(o){
  POST.removed=true;

  if(!ID) return false;
  const me=hpIsChild()?((ID.link&&ID.link.dev)||''):(POST.pub||'');
  if(!me){ hpLog('管理人が「外された機械」と答えた（この端末の鍵が分からないので、何も消さない）'); return false; }
  let good=false; try{ good=Number.isFinite(o.ts)&&/^[0-9a-f]{128}$/.test(String(o.sig||''))&&(await edVerify(ID.publicKey, hp5RmMsg(ID.address, me, o.ts), o.sig)); }catch(e){ good=false; }
  if(!good){ hpLog('管理人が「外された機械」と答えたが、実印の署名が付いていない／合わない（何も消さない）'); hpBanner(T('bn_removed_unproven')); return false; }
  hpLog('この端末は外された（実印の署名を確かめた）。この端末の鍵・アカウント・履歴を消す');
  hpWipeSelf(); return true;
}
function hpWipeSelf(){
  try{ stopBg(); }catch(e){}
  try{ hpVaultForget(); }catch(e){}
  ID=null; EDPRIV=null; try{ REQUESTS.length=0; }catch(e){}
  const go=()=>{ try{ if(typeof location!=='undefined'&&location.reload) location.reload(); }catch(e){} };
  let p=null; try{ p=alert(T('al_removed')); }catch(e){}
  if(p&&typeof p.then==='function') p.then(go,go); else go();
}

const HP_CDEL_MAX=200, HP_CDEL_KEEP=90*86400e3, HP_STALE_DEV=45*86400e3, HP_SEEN_GAP=86400e3;
let HP_SYNC_ON=true, HP_SYNC_WAIT=3000, HP_SYNC_PART_WAIT=15000, HP_SYNC_HOLD=0, HP_SYNC_PARTS=null, HP_SYNC_BUSY=0, HP_SYNC_T=null, HP_SYNC_CHAIN=Promise.resolve();
function hpRowMt(c){ return Number(c&&c.mt)||Number(c&&c.keyAddedAt)||0; }
function hpCardIat(k){ return (k&&k.token&&Number(k.token.iat))||0; }
function hpCdelPrune(){
  if(!ID||!ID.cdel||typeof ID.cdel!=='object') return;
  const now=Date.now(); let ks=Object.keys(ID.cdel);
  for(const a of ks){ const d=ID.cdel[a]; if(!d||!(d.at>0)||now-d.at>HP_CDEL_KEEP) delete ID.cdel[a]; }
  ks=Object.keys(ID.cdel); if(ks.length>HP_CDEL_MAX){ ks.sort((a,b)=>ID.cdel[a].at-ID.cdel[b].at); for(const a of ks.slice(0,ks.length-HP_CDEL_MAX)) delete ID.cdel[a]; }
}

function hpCdelMark(addr, purge){
  if(!ID||!hpIdFmt(addr)) return false;
  if(!ID.cdel||typeof ID.cdel!=='object') ID.cdel={};
  ID.cdel[addr]={ at:Date.now(), purge:!!purge }; hpCdelPrune();
  hpLog('連絡先を消した（'+hpIdShort(addr)+'。'+(purge?'履歴も消した':'履歴は残した')+'）');
  return true;
}
async function hpSyncDigest(){
  const rows=((ID&&ID.contacts)||[]).map(c=>[c.address,c.nick||'',hpRowMt(c),hpCardIat(c.card),Object.keys((c.gone&&typeof c.gone==='object')?c.gone:{}).sort()]).sort((a,b)=>a[0]<b[0]?-1:a[0]>b[0]?1:0);
  const cd=(ID&&ID.cdel&&typeof ID.cdel==='object')?ID.cdel:{}, del=Object.keys(cd).sort().map(a=>[a,cd[a].at,cd[a].purge?1:0]);
  const bk=(ID&&ID.blk&&typeof ID.blk==='object')?ID.blk:{}, blk=Object.keys(bk).sort().map(a=>[a,bk[a].on===1?1:0,Number(bk[a].at)||0]), st=[(ID&&ID.set&&ID.set.noread===1)?1:0,Number(ID&&ID.setAt)||0];
  const vm0=(ID&&ID.vfy&&typeof ID.vfy==='object')?ID.vfy:{}, vf=Object.keys(vm0).sort().map(a=>[a,vm0[a].on===1?1:0,Number(vm0[a].at)||0]);
  const dg=[rows,del,(ID&&ID.myName)||'',Number(ID&&ID.myNameAt)||0,blk,st]; if(vf.length) dg.push(vf);
  { const ls=(ID&&ID.lease&&Number(ID.lease.exp))?[Number(ID.lease.exp),Number(ID.lease.at)||0,String(ID.lease.acct||''),ID.lease.gone?1:0]  :null; if(ls) dg.push(ls); try{ if(ls&&typeof hpLsMs==='function'){ const z=await hpLsMs(ls[2]); if(z) dg.push(['ms'].concat(z.map(x=>String(x).slice(0,8)))); } }catch(e){}   }
  await hpReady(); return hpHex(hp5S().crypto_generichash(16, hp5U(JSON.stringify(dg))));
}
function hpSibSyncSoon(ms){
  if(!HP_SYNC_ON) return false;
  if(HP_SYNC_T) clearTimeout(HP_SYNC_T);
  HP_SYNC_T=setTimeout(()=>{ HP_SYNC_T=null; HP_SYNC_CHAIN=HP_SYNC_CHAIN.then(()=>hpSibSyncSend(false)).catch(e=>{ try{ hpLog('連絡先の一覧を自分の機械へ送れない（つなぎ直したらもう一度）'+((e&&e.message)?' '+e.message:'')); }catch(_){} }); }, Math.max(ms===undefined?HP_SYNC_WAIT:ms, HP_SYNC_HOLD-Date.now(), 0));
  return true;
}

async function hpSibSyncSend(force){
  if(!ID||!POST.up||POST.notOwner||!hpSibs().length) return 0;
  if(HP_SYNC_BUSY>0){ hpSibSyncSoon(); return 0; }
  hpCdelPrune();
  const h=await hpSyncDigest(); if(!force&&hpHGet('p2p_sibc')===h) return 0;
  const cd=(ID.cdel&&typeof ID.cdel==='object')?ID.cdel:{}, del=Object.keys(cd).map(a=>({address:a,at:cd[a].at,purge:cd[a].purge?1:0}));
  const list=contacts().map(c=>({address:c.address,nick:c.nick||'',pubKey:c.pubKey||null,keyAddedAt:c.keyAddedAt||0,card:c.card||null,cardAt:c.cardAt||0,gone:(c.gone&&typeof c.gone==='object')?c.gone:null,mt:hpRowMt(c)}));
  hpBlkPrune(); const blk=(ID.blk&&typeof ID.blk==='object')?ID.blk:{};
  hpVfyPrune(); const vfy=(ID.vfy&&typeof ID.vfy==='object')?ID.vfy:{}, hasVfy=Object.keys(vfy).length>0;
  const room0=Math.max(2000,HP_LINK_CHUNK-JSON.stringify(del).length-JSON.stringify(blk).length-(hasVfy?JSON.stringify(vfy).length:0)), chunks=[]; let cur=[];
  for(const c of list){ cur.push(c); if(JSON.stringify(cur).length>(chunks.length?HP_LINK_CHUNK:room0)){ cur.pop(); chunks.push(cur); cur=[c]; } } chunks.push(cur);
  const at=Date.now(); let n=0;
  for(let i=0;i<chunks.length;i++){
    const body={ v:1, type:'sibc', full:1, at:at, h:h, i:i+1, n:chunks.length, contacts:chunks[i], seen:at };
    if(i===0){ body.del=del; body.name=String(ID.myName||''); body.nameAt=Number(ID.myNameAt)||0; body.blk=blk; body.set={noread:(ID.set&&ID.set.noread===1)?1:0}; body.setAt=Number(ID.setAt)||0; if(hasVfy) body.vfy=vfy; if(ID.lease&&Number(ID.lease.exp)&&!(typeof hpBoxSub==='function'&&hpBoxSub())||(ID.lease&&Number(ID.lease.exp)&&typeof hpLsBoxUrl==='function'&&!!hpLsBoxUrl())    ){ body.lease={exp:Number(ID.lease.exp),at:Number(ID.lease.at)||1}; if(typeof ID.lease.acct==='string'&&ID.lease.acct) body.lease.acct=ID.lease.acct; if(ID.lease.gone) body.lease.gone=1; if(typeof ID.lease.tok==='string'&&ID.lease.tok) body.lease.tok=ID.lease.tok; try{ const lu=(typeof hpLsBoxUrl==='function')?hpLsBoxUrl():''; if(lu) body.lease.url=lu; }catch(e){} try{ if(typeof hpLsMs==='function'){ const z=await hpLsMs(body.lease.acct); if(z) body.lease.ms=z; } }catch(e){}   }     }
    n=await hpSibPut(body); if(!n) return 0;
  }
  hpHSet('p2p_sibc',h); hpHSet('p2p_sibseen',String(at));
  hpLog('連絡先の一覧を自分の機械 '+n+' 台へ送った（'+list.length+' 件'+(del.length?'、消した控え '+del.length+' 件':'')+'）');
  return n;
}

function hpSeenMark(dev, t){
  try{
    t=Math.min(Number(t)||0, Date.now()); if(!ID||!dev||!(t>0)) return false;
    const rows=hpIsMain()?(Array.isArray(ID.devs)?ID.devs:[]):hpIsChild()?[ID.link.main].concat(Array.isArray(ID.link.sibs)?ID.link.sibs:[]):[];
    let ch=false; for(const d of rows){ if(d&&d.dev===dev&&!(d.seen>=t)){ d.seen=t; ch=true; } }
    if(ch){ saveID(); try{ renderDevices(); }catch(e){} }
    return ch;
  }catch(e){ return false; }
}

function hpSyncDrop(addr, purge){
  ID.contacts=(ID.contacts||[]).filter(c=>c.address!==addr);
  if(purge){ try{ p2pPurgeAddr(addr); }catch(e){} }
}

let HP_SYNC_IN_Q=Promise.resolve();
function hpSibSyncIn(o, r){ HP_SYNC_BUSY++; const run=HP_SYNC_IN_Q.then(()=>hpSibSyncIn0(o,r)).finally(()=>{ HP_SYNC_BUSY--; }); HP_SYNC_IN_Q=run.catch(()=>{}); return run; }

function hpContactsDedup(){
  if(!ID||!Array.isArray(ID.contacts)) return 0;
  const seen=new Map(), out=[]; let n=0;
  for(const c of ID.contacts){
    if(!c||!c.address){ continue; }
    const x=seen.get(c.address); if(!x){ seen.set(c.address,c); out.push(c); continue; }
    n++;
    if(hpRowMt(c)>hpRowMt(x)){ x.nick=c.nick; x.mt=c.mt; }
    if(c.card&&(!x.card||hpCardIat(c.card)>hpCardIat(x.card))){ x.card=c.card; x.cardAt=c.cardAt; if(c.pubKey) x.pubKey=c.pubKey; }
    if(c.gone&&typeof c.gone==='object') x.gone=Object.assign({},c.gone,(x.gone&&typeof x.gone==='object')?x.gone:{});
    for(const k of Object.keys(c)) if(!(k in x)) x[k]=c[k];
  }
  if(n){ ID.contacts=out; try{ hpLog('同じ相手の行が '+n+' 件重なっていたので、1 つにまとめた'); }catch(e){} }
  return n;
}
async function hpSibSyncIn0(o, r){
  if(!ID||!Array.isArray(o.contacts)){ hpLog('連絡先の一覧の形が違う（捨てた）'); return false; }
  if(!Array.isArray(ID.contacts)) ID.contacts=[];
  hpContactsDedup();
  const now=Date.now(); let add=0, upd=0, rm=0;
  if(Array.isArray(o.del)){
    if(!ID.cdel||typeof ID.cdel!=='object') ID.cdel={};
    for(const d of o.del.slice(0,HP_CDEL_MAX)){
      if(!d||!hpIdFmt(d.address)||d.address===ID.address) continue;
      const at=Number(d.at), purge=!!d.purge; if(!(at>0)||at>now+HP_CARD_FUTURE||now-at>HP_CDEL_KEEP) continue;
      const old=ID.cdel[d.address];
      if(!old||old.at<at) ID.cdel[d.address]={at:at,purge:purge}; else if(old.at===at&&purge&&!old.purge) old.purge=true;
      const x=ID.contacts.find(y=>y.address===d.address);
      if(x&&hpRowMt(x)<=at){ hpSyncDrop(d.address,purge); rm++; hpLog('自分の機械で消された連絡先を、この機械でも消した（'+hpIdShort(d.address)+'。'+(purge?'履歴も':'履歴は残した')+'）'); }
    }
    hpCdelPrune();
  }
  for(const c of o.contacts.slice(0,2000)){
    if(!c||!hpIdFmt(c.address)||c.address===ID.address) continue;
    const im=Math.min(Number(c.mt)||0, now+HP_CARD_FUTURE), nick=String(c.nick||'').slice(0,24);
    let x=ID.contacts.find(y=>y.address===c.address);
    const tomb=ID.cdel&&ID.cdel[c.address]; if(!x&&tomb&&tomb.at>=im) continue;
    let card=null; if(c.card&&typeof c.card==='object'&&c.card.id===c.address){ try{ card=await hpCardCheck(c.card); }catch(e){ card=null; } }
    if(!x) x=ID.contacts.find(y=>y.address===c.address);
    if(!x){ x={ address:c.address, nick:nick, pubKey:card?card.master:(typeof c.pubKey==='string'?c.pubKey:null), keyAddedAt:Number(c.keyAddedAt)||im||0 }; if(im>0) x.mt=im; ID.contacts.push(x); add++; }
    else { const lm=hpRowMt(x); if(im>lm){ if(x.nick!==nick) upd++; x.nick=nick; x.mt=im; } else if(im===lm&&nick>(x.nick||'')){ x.nick=nick; upd++; } }
    if(card&&x.pubKey&&x.pubKey!==card.master) continue;

    const master=x.pubKey||(card&&card.master)||null;
    if(master&&c.gone&&typeof c.gone==='object'){
      const okg=[];   for(const dev of Object.keys(c.gone)){ const g=c.gone[dev]; if(!g||hpGoneHas(x,dev)) continue; let v=false; try{ v=await edVerify(master, hp5RmMsg(c.address,dev,g.ts), g.sig); }catch(e){ v=false; } if(v) okg.push({dev:dev,ts:g.ts,sig:g.sig}); }
      if(okg.length) hpGoneMerge(x,{master:master,gone:okg});
    }
    if(card){
      hpGoneMerge(x,card);
      const issGone=!!(card.token&&hpGoneHas(x,card.token.iss)), curGone=!!(x.card&&x.card.token&&hpGoneHas(x,x.card.token.iss));
      if(!issGone&&(!x.card||curGone||hpCardIat(card)>hpCardIat(x.card))){ x.card=card; x.pubKey=card.master; x.cardAt=Number(c.cardAt)||now; }
    }
  }
  if(typeof o.name==='string'&&Number(o.nameAt)>(Number(ID.myNameAt)||0)&&Number(o.nameAt)<=now+HP_CARD_FUTURE){ ID.myName=o.name.slice(0,24); ID.myNameAt=Number(o.nameAt); try{ renderMyName(); }catch(e){} upd++; }
  const blkCh=[]; let setCh=false;
  if(o.blk&&typeof o.blk==='object'&&!Array.isArray(o.blk)){
    if(!ID.blk||typeof ID.blk!=='object') ID.blk={};
    for(const a of Object.keys(o.blk).slice(0,HP_BLK_MAX)){
      const b=o.blk[a]; if(!b||typeof b!=='object'||!hpIdFmt(a)||a===ID.address) continue;
      const at=Number(b.at), on=b.on===1?1:0; if(!(at>0)||at>now+HP_CARD_FUTURE) continue;
      const old=ID.blk[a]; if(old&&!(at>(Number(old.at)||0))) continue;
      const was=hpBlkOn(a); ID.blk[a]={on:on,at:at}; upd++; if(!!on!==was) blkCh.push([a,on]);
    }
    hpBlkPrune();
  }
  const vfyCh=[];
  if(o.vfy&&typeof o.vfy==='object'&&!Array.isArray(o.vfy)){
    if(!ID.vfy||typeof ID.vfy!=='object') ID.vfy={};
    for(const a of Object.keys(o.vfy).slice(0,HP_VFY_MAX)){
      const b=o.vfy[a]; if(!b||typeof b!=='object'||!hpIdFmt(a)||a===ID.address) continue;
      const at=Number(b.at), on=b.on===1?1:0; if(!(at>0)||at>now+HP_CARD_FUTURE) continue;
      const old=ID.vfy[a]; if(old&&!(at>(Number(old.at)||0))) continue;
      const was=hpVerified(a); ID.vfy[a]={on:on,at:at}; upd++; if(!!on!==was) vfyCh.push([a,on]);
    }
    hpVfyPrune();
  }
  if(o.set&&typeof o.set==='object'&&Number(o.setAt)>(Number(ID.setAt)||0)&&Number(o.setAt)<=now+HP_CARD_FUTURE){ const was=hpReadOff(); ID.set={noread:o.set.noread===1?1:0}; ID.setAt=Number(o.setAt); upd++; setCh=(hpReadOff()!==was); }
  if(typeof hpBoxSub==='function'&&hpBoxSub()){   } else if(o.lease&&typeof o.lease==='object'&&typeof hpLeaseApply==='function'){ try{ if(hpLeaseApply(o.lease.exp,o.lease.at,o.lease)) upd++; }catch(e){} }

  const pn=Math.min(Number(o.n)||1,100), pi=Number(o.i)||1;
  if(pn>1){ if(!HP_SYNC_PARTS||HP_SYNC_PARTS.at!==o.at||HP_SYNC_PARTS.dev!==r.fromDev) HP_SYNC_PARTS={at:o.at,dev:r.fromDev,got:new Set()}; HP_SYNC_PARTS.got.add(pi); if(HP_SYNC_PARTS.got.size<pn) HP_SYNC_HOLD=Date.now()+HP_SYNC_PART_WAIT; else { HP_SYNC_HOLD=0; HP_SYNC_PARTS=null; } }

  try{ if(typeof o.h==='string'&&(await hpSyncDigest())===o.h) hpHSet('p2p_sibc',o.h); }catch(e){}
  saveID(); try{ renderContacts(); }catch(e){} try{ updateBadges(); }catch(e){}
  hpLog('自分の機械から連絡先の一覧を受け取った（'+o.contacts.length+' 件。足した '+add+'・直した '+upd+'・消した '+rm+'）');
  for(const [a,on] of blkCh){ hpLog('自分の機械で'+(on?'ブロックした':'ブロックを解除した')+'相手を、この機械でもそろえた（'+nickOf(a)+'）'); hpBlockApply(a,!!on,false); }
  for(const [a,on] of vfyCh) hpLog('自分の機械で'+(on?'確認済みにした':'確認済みを外した')+'相手を、この機械でもそろえた（'+nickOf(a)+'）');
  if(vfyCh.length) hpVfyRedraw();
  if(setCh){ hpLog('自分の機械で「既読を返さない」が'+(hpReadOff()?'オン':'オフ')+'になったので、この機械もそろえた'); hpNoreadUi(); hpNoreadRedraw(); }
  return true;
}

const HP_TK_KEEP=31*86400e3, HP_TK_MAX=40, HP_TK_PEERS=300, HP_BLK_MAX=200, HP_BLK_KEEP=90*86400e3;
let HP_RV_BUSY=false;
function hpBlkOn(addr){ return !!(addr&&ID&&ID.blk&&typeof ID.blk==='object'&&ID.blk[addr]&&ID.blk[addr].on===1); }
function hpBlocked(addr){ return hpBlkOn(addr)||(typeof hpDead==='function'&&hpDead(addr)); }
function hpBlkPrune(){
  if(!ID||!ID.blk||typeof ID.blk!=='object') return;
  const now=Date.now(); for(const a of Object.keys(ID.blk)){ const b=ID.blk[a]; if(!b||!(Number(b.at)>0)||(b.on!==1&&now-b.at>HP_BLK_KEEP)) delete ID.blk[a]; }
  let ks=Object.keys(ID.blk); if(ks.length>HP_BLK_MAX){ ks.sort((a,b)=>((ID.blk[a].on===1)-(ID.blk[b].on===1))||(ID.blk[a].at-ID.blk[b].at)); for(const a of ks.slice(0,ks.length-HP_BLK_MAX)) delete ID.blk[a]; }
}

const HP_VFY_MAX=300, HP_VFY_KEEP=90*86400e3;
function hpVerified(addr){ return !!(addr&&ID&&ID.vfy&&typeof ID.vfy==='object'&&ID.vfy[addr]&&ID.vfy[addr].on===1); }
function hpVfyPrune(){
  if(!ID||!ID.vfy||typeof ID.vfy!=='object') return;
  const now=Date.now(); for(const a of Object.keys(ID.vfy)){ const b=ID.vfy[a]; if(!b||!(Number(b.at)>0)||(b.on!==1&&now-b.at>HP_VFY_KEEP)) delete ID.vfy[a]; }
  let ks=Object.keys(ID.vfy); if(ks.length>HP_VFY_MAX){ ks.sort((a,b)=>((ID.vfy[a].on===1)-(ID.vfy[b].on===1))||(ID.vfy[a].at-ID.vfy[b].at)); for(const a of ks.slice(0,ks.length-HP_VFY_MAX)) delete ID.vfy[a]; }
}
function hpVfySet(addr, on, how){
  if(!ID||!hpIdFmt(addr)||addr===ID.address) return false;
  if(!ID.vfy||typeof ID.vfy!=='object') ID.vfy={};
  ID.vfy[addr]={on:on?1:0,at:Date.now()}; hpVfyPrune(); saveID();
  try{ hpLog(on?'安全番号を確認済みにした（'+nickOf(addr)+(how?'。'+how:'')+'）':'安全番号の確認済みを外した（'+nickOf(addr)+'）'); }catch(e){}
  hpVfyRedraw(); return true;
}
function hpVfyRedraw(){ try{ renderContacts(); }catch(e){} try{ const tt=document.getElementById('chat-title'); if(tt&&CURPEER&&typeof hpChatTitle==='function') hpChatTitle(tt,CURPEER); }catch(e){} try{ if(HP_SF_CUR&&HP_SF_CUR.draw) HP_SF_CUR.draw(); }catch(e){} }
function hpTkLoad(){ try{ const o=JSON.parse(hpHGet('p2p_tk')||'{}');   return (o&&typeof o==='object'&&!Array.isArray(o))?o:{}; }catch(e){ return {}; } }
function hpTkSave(o){ try{ hpHSet('p2p_tk',JSON.stringify(o)); }catch(e){} }

function hpTkNote(addr, id, exp){
  if(!ID||!hpIdFmt(addr)||addr===ID.address||typeof id!=='string'||!/^[0-9a-f]{32}$/.test(id)) return false;
  const now=Date.now(); exp=(Number(exp)>now)?Number(exp):now+HP_TK_KEEP;
  const o=hpTkLoad(), m=(o[addr]&&typeof o[addr]==='object')?o[addr]:{}, isNew=!(id in m);
  m[id]=Math.max(Number(m[id])||0,exp); for(const k of Object.keys(m)){ if(!(m[k]>now)) delete m[k]; }
  let ks=Object.keys(m); if(ks.length>HP_TK_MAX){ ks.sort((a,b)=>m[a]-m[b]); for(const k of ks.slice(0,ks.length-HP_TK_MAX)) if(k!==id) delete m[k]; }
  o[addr]=m;
  const ps=Object.keys(o); if(ps.length>HP_TK_PEERS){ const top=a=>Math.max(0,...Object.values(o[a]||{}).map(Number)); ps.filter(a=>!hpBlocked(a)&&a!==addr).sort((a,b)=>top(a)-top(b)).slice(0,ps.length-HP_TK_PEERS).forEach(a=>{ delete o[a]; }); }
  hpTkSave(o);
  if(isNew&&hpBlocked(addr)){ hpLog('ブロック中の相手が、まだ取り消していない許可証を使った（取り消す）'); hpRvQueue([{id:id,exp:m[id]}]); }
  return isNew;
}
function hpRvLoad(){ try{ const a=JSON.parse(hpHGet('p2p_tkrv')||'[]');   return Array.isArray(a)?a.filter(t=>t&&typeof t.id==='string'&&Number(t.exp)>Date.now()):[]; }catch(e){ return []; } }
function hpRvSave(a){ try{ hpHSet('p2p_tkrv',JSON.stringify(a.slice(-2000))); }catch(e){} }

function hpRvQueue(list){ const q=hpRvLoad(); for(const t of (list||[])){ if(t&&typeof t.id==='string'&&Number(t.exp)>Date.now()&&!q.some(x=>x.id===t.id)) q.push({id:t.id,exp:Number(t.exp)}); } hpRvSave(q); hpRvFlush().catch(()=>{}); try{ if(typeof hpBxRvAdd==='function') hpBxRvAdd(list); }catch(e){}   return q.length; }

async function hpRvFlush(){
  if(HP_RV_BUSY||!ID||!POST.up||POST.notOwner) return 0;
  HP_RV_BUSY=true; let n=0;
  try{ for(;;){ const q=hpRvLoad(); if(!q.length){ hpRvSave([]); break; } const t=q[0]; await hpSend({op:'revoke',id:t.id,exp:t.exp}); n++; hpRvSave(hpRvLoad().filter(x=>x.id!==t.id)); } }
  catch(e){ hpLog('許可証を取り消せない（つなぎ直したらもう一度）'+((e&&e.message)?' '+e.message:'')); }
  finally{ HP_RV_BUSY=false; }
  if(n) hpLog('自分のポストで許可証を取り消した（'+n+' 枚。ブロックした相手のもの）');
  return n;
}

function hpBlockApply(addr, on, local){
  if(!ID) return false;
  if(on){
    const m=hpTkLoad()[addr]||{}, list=Object.keys(m).map(id=>({id:id,exp:m[id]}));
    if(list.length) hpRvQueue(list);
    try{ if(typeof RTC_PEER!=='undefined'&&RTC_PEER===addr&&typeof hangup==='function') hangup(); }catch(e){}
    try{ hpReadCancel(addr); }catch(e){}
    try{ const i=REQUESTS.findIndex(q=>q&&q.hp&&q.from===addr); if(i>=0){ REQUESTS.splice(i,1); hpReqSave(); try{ renderRequests(); }catch(_){} try{ updateBadges(); }catch(_){} } }catch(e){}
    hpLog('ブロックした（'+nickOf(addr)+'。この相手からの手紙と呼び出しは捨てる。控えにある許可証 '+list.length+' 枚を取り消す）');
  } else {
    hpLog('ブロックを解除した（'+nickOf(addr)+'）');
    if(local){ const c=(ID.contacts||[]).find(x=>x.address===addr); if(c&&c.card){ c.cardDue=1; delete c.cardTry; saveID(); hpLog('新しい名刺を届ける → '+nickOf(addr)+'（前の許可証は取り消したまま）'); hpRsRun(()=>hpCardDueRun(true)); } }
  }
  try{ renderContacts(); }catch(e){} try{ convDirty(); }catch(e){} try{ if(CURPEER===addr) hpDecorate(addr); }catch(e){}
  return true;
}

function hpBlockSet(addr, on){
  if(!ID||!hpIdFmt(addr)||addr===ID.address) return false;
  if(!ID.blk||typeof ID.blk!=='object') ID.blk={};
  const was=hpBlkOn(addr); ID.blk[addr]={on:on?1:0,at:Date.now()}; hpBlkPrune(); saveID();
  if(!!on!==was) hpBlockApply(addr,!!on,true);
  return true;
}

function hpBlockStatus(peer){
  if(typeof document.getElementById!=='function') return; const st=document.getElementById('status'); if(!st) return;
  if(peer){ st.textContent=TF('st_blocked',{who:nickOf(peer)}); if(st.dataset) st.dataset.blk='1'; return; }
  if(st.dataset&&st.dataset.blk){ delete st.dataset.blk; try{ if(typeof rtcUi==='function') rtcUi(); }catch(e){} }
}
function hpBlockBar(peer){
  try{
    if(typeof document.getElementById!=='function') return;
    const comp=document.getElementById('composer'); if(!comp||!comp.parentNode) return;
    let bar=document.getElementById('hp-blkbar'); const on=!!peer&&hpBlkOn(peer)&&!(typeof hpDead==='function'&&hpDead(peer));
    if(!on){ if(bar) bar.remove(); comp.style.display=''; hpBlockStatus(null); return; }
    if(!bar){ bar=document.createElement('div'); bar.id='hp-blkbar'; bar.style.cssText='padding:10px 12px;font-size:13px;color:var(--dim);display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap'; comp.parentNode.insertBefore(bar,comp.nextSibling); }
    bar.textContent=''; const s=document.createElement('span'); s.textContent=TF('bar_blocked',{who:nickOf(peer)});
    const b=document.createElement('button'); b.className='b'; b.textContent=T('btn_unblock'); b.onclick=()=>{ hpBlockSet(peer,0); };
    bar.appendChild(s); bar.appendChild(b); comp.style.display='none'; hpBlockStatus(peer);
  }catch(e){}
}

function hpNoreadSet(on){
  if(!ID) return false;
  ID.set={noread:on?1:0}; ID.setAt=Date.now(); saveID();
  hpLog('「既読を返さない」を'+(on?'オン':'オフ')+'にした'); hpNoreadUi(); hpNoreadRedraw(); return true;
}
function hpNoreadUi(){ try{ const x=(typeof document.getElementById==='function')?document.getElementById('hp-noread'):null; if(!x) return; x.checked=hpReadOff(); x.disabled=!ID; x.onchange=()=>{ hpNoreadSet(!!x.checked); }; }catch(e){} }
function hpNoreadRedraw(){ try{ if(CURPEER&&CONV_OPEN&&typeof histRender==='function') histRender(CURPEER); }catch(e){} }

const HP_DEV_TINTS={'bob:main':['\u{1F7E7}','#211406','#2e1d0a','#f59e0b','オレンジ'],'bob:child':['\u{1F7E6}','#07152b','#0d2140','#3b82f6','青'],'alice':['\u{1F7EA}','#170c26','#231337','#a855f7','紫'],'carol':['\u{1F7E9}','#061d16','#0b2b21','#22c55e','緑']};
function hpDevTintOf(){ try{ if(typeof location==='undefined'||!/^(localhost|127\.0\.0\.1)$/.test(location.hostname)||!ID) return null; const nm=String(ID.myName||''); return HP_DEV_TINTS[nm==='bob'?('bob:'+(hpIsChild()?'child':'main')):nm]||null; }catch(e){ return null; } }
function hpDevTint(){ try{
  const t=hpDevTintOf(), r=document.documentElement; if(!r||!r.style) return;
  if(!t){ if(r.dataset&&r.dataset.hpTint){ r.style.removeProperty('--bg'); r.style.removeProperty('--panel'); document.body&&(document.body.style.borderTop=''); delete r.dataset.hpTint; } return; }
  if(r.dataset.hpTint!==t[4]){ r.style.setProperty('--bg',t[1]); r.style.setProperty('--panel',t[2]); if(document.body){ document.body.style.background=t[1]; document.body.style.borderTop='6px solid '+t[3]; } r.dataset.hpTint=t[4]; }

  try{ const dv=(POST&&POST.pub)?(' ['+POST.pub.slice(2,8)+']'):'';
    const base=String(document.title).replace(/^\S+ (?=Handpost)/,'').replace(/ \[[0-9a-f]{6}\]$/,'');
    const want=t[0]+' '+base+dv; if(document.title!==want) document.title=want; }catch(e){}
}catch(e){} }
try{ if(typeof document!=='undefined'&&typeof setInterval==='function'&&typeof location!=='undefined'&&/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){ setInterval(hpDevTint,1500); setTimeout(hpDevTint,300); } }catch(e){}

async function hpGhostFind(skip){
  const r=await hpBkReq({ op:'dget' }), box=(Array.isArray(r&&r.devs)?r.devs:[]).map(x=>x&&x.dev).filter(d=>typeof d==='string'&&/^ed[0-9a-f]{64}$/.test(d));
  const rows=hpDevRows(), shown=new Set(rows.map(x=>x.dev));
  return { box:box.length, shown:rows.length, ghosts:box.filter(d=>!shown.has(d)&&d!==skip) }; }
async function hpGhostRm(dev){
  if(HP_RM) throw new Error(T('e_rm_busy'));
  const ts=Date.now(), sig=await edSign(hp5RmMsg(ID.address,dev,ts)), W={ wait:'rmdev', ok:false, err:null }; HP_RM=W;
  try{ await hpSend({ op:'rmdev', dev:dev, ts:ts, sig:sig }); const t0=Date.now(); while(!W.ok&&!W.err&&Date.now()-t0<20000) await sleep(100); }
  finally{ HP_RM=null; }
  if(!W.ok&&W.err!=='bad dev') throw new Error(W.err||T('e_rm_noreply'));
  return true; }
async function hpGhostOffer(L){
  if(!hpIsMain()) return 'notmain';
  let g; try{ g=await hpGhostFind(L&&L.req&&L.req.dev); }catch(e){ hpLog('郵便受けの端末の名簿を読めない（'+((e&&e.message)||e)+'）'); return 'err'; }
  if(!g.ghosts.length){ hpLog('郵便受けの端末 '+g.box+' 台・画面の端末 '+g.shown+' 台（見当たらない端末は無い。郵便受けの枠がいっぱい）'); return 'none'; }
  hpLog('郵便受けに、画面に無い端末が '+g.ghosts.length+' 台ある（'+g.ghosts.map(d=>d.slice(0,10)+'…').join('・')+'）');
  const ok=await hpAsk({ title:T('gh_title'), text:TF('gh_text',{n:g.box,m:g.shown,k:g.ghosts.length,list:g.ghosts.map(d=>'・'+d.slice(0,12)+'…').join('\n')}), ok:TF('btn_gh_rm',{k:g.ghosts.length}), danger:true, auth:true, why:'見当たらない端末を郵便受けから外す' });
  if(!ok){ hpLog('見当たらない端末は外さなかった'); return 'no'; }
  let n=0; for(const d of g.ghosts){ try{ await hpGhostRm(d); n++; hpLog('見当たらない端末を郵便受けから外した（'+d.slice(0,10)+'…）'); }catch(e){ hpLog('見当たらない端末を外せない（'+d.slice(0,10)+'…・'+((e&&e.message)||e)+'）'); } }
  if(n&&L&&HP_LINK===L&&L.req&&!L.done&&L.exp>Date.now()){ L.fail=null; try{ hpLinkUi(); }catch(e){} hpLog('空きができたので、足そうとしていた端末を続けて足す'); try{ await hpLinkApprove(); }catch(e){} }
  return 'rm '+n; }

const HP_RM_FATAL=['not owner','bad sig','stale','last device'];
let HP_RM_RES=0;
function hpRmPendClear(dev){ try{ if(ID&&ID.rmPend&&(!dev||ID.rmPend.dev===dev)){ delete ID.rmPend; saveID(); return true; } }catch(e){} return false; }
hpDevRemove=(function(f){ return async function(dev){
  try{ if(typeof ID!=='undefined'&&ID&&hpIsMain()&&(Array.isArray(ID.devs)?ID.devs:[]).some(x=>x.dev===dev)){ ID.rmPend={ dev:dev, at:Date.now() }; saveID(); } }catch(e){}
  try{ if(typeof hpToast==='function') hpToast(T('rm_busy'),25000); }catch(e){}
  try{ const r=await f.apply(this,arguments); hpRmPendClear(dev); try{ if(typeof hpToast==='function') hpToast(T('rm_done'),5000); }catch(e){} return r; }
  catch(e){ const m=String((e&&e.message)||''); if(HP_RM_FATAL.indexOf(m)>=0) hpRmPendClear(dev); try{ if(typeof hpToastHide==='function') hpToastHide(); }catch(_){} throw e; } }; })(hpDevRemove);
function hpRmResume(now){ try{
  if(typeof ID==='undefined'||!ID||!ID.rmPend) return ''; const p=ID.rmPend;
  if(!(Array.isArray(ID.devs)&&ID.devs.some(x=>x.dev===p.dev))){ hpRmPendClear(); return 'gone'; }
  if(typeof HP_RM!=='undefined'&&HP_RM) return 'busy';
  if(typeof POST==='undefined'||!POST.up||POST.notOwner) return 'wait';
  const t=Number(now)||Date.now(); if(t-HP_RM_RES<60e3) return 'soon'; HP_RM_RES=t;
  hpLog('外す途中で止まっていた端末の続きを済ませる（端末 '+String(p.dev).slice(0,10)+'…）');
  hpDevRemove(p.dev).catch(e=>{ try{ hpLog('外す続きを済ませられない '+((e&&e.message)||e)); }catch(_){} });
  return 'go'; }catch(e){ return ''; } }
try{ if(typeof window!=='undefined'&&typeof window.addEventListener==='function') window.addEventListener('pagehide',()=>{ try{ hpLog('ページを閉じる（読み込み直し・閉じる）'+((typeof ID!=='undefined'&&ID&&ID.rmPend)?'。端末を外す途中':'')); if(typeof hpLgSave==='function') hpLgSave(Date.now()); }catch(e){} }); }catch(e){}

hpPutOne=(function(f){ return async function(g, id, kind, link){
  try{ return await f.apply(this,arguments); }
  catch(e){ const why=String((e&&(e.hpWhy||e.message))||''); if(why!=='bad letter'||!g||!Array.isArray(g.letters)||g.letters.length<2) throw e;
    let first=null; const drop=[];
    for(const L of g.letters){ try{ const r=await f.call(this, Object.assign({}, g, { letters:[L] }), id, kind, link); if(!first) first=r; }catch(e1){ drop.push(String(L.dev||'').slice(0,10)); } }
    if(!first) throw e;
    try{ hpLog('投函 '+id+'：郵便受けが知らない端末あての '+drop.length+' 通を外して、残りを入れた（'+drop.join('・')+'…）'); }catch(_){}
    return first; } }; })(hpPutOne);

const HP_SP_MAXPEER=300, HP_SP_KEEP=30*864e5; const HP_SP_HAVE={};
function hpSpKey(){ return 'p2p_sibprog_'+((typeof ID!=='undefined'&&ID&&ID.address)||''); }
function hpSpLoad(){ try{ const m=JSON.parse(hpHGet(hpSpKey())||'{}'); return (m&&typeof m==='object'&&!Array.isArray(m))?m:{}; }catch(e){ return {}; } }
function hpSpSave(m){ try{ const now=Date.now(); for(const k of Object.keys(m)) if(!m[k]||!(now-(Number(m[k].at)||0)<HP_SP_KEEP)) delete m[k]; hpHSet(hpSpKey(),JSON.stringify(m)); }catch(e){} }
function hpSpHave(){ const out={}; let n=0; try{ for(const c of contacts()){ if(n>=HP_SP_MAXPEER) break; const h=histLoad(c.address).filter(x=>x&&typeof x.ts==='number'&&(x.d==='s'||x.d==='p')); if(!h.length) continue; out[c.address]=Math.max.apply(null,h.map(x=>x.ts)); n++; } }catch(e){} return out; }
function hpSpHaveIn(dev,o){ try{ if(!dev||!o||typeof o!=='object'||Array.isArray(o)) return 0; const m={}; let n=0; for(const k of Object.keys(o)){ if(n>=HP_SP_MAXPEER) break; if(typeof k==='string'&&/^hp1[0-9a-f]{64}$/.test(k)&&Number.isFinite(o[k])&&o[k]>0){ m[k]=o[k]; n++; } } HP_SP_HAVE[dev]={m:m,at:Date.now()}; return n; }catch(e){ return 0; } }
async function hpSibSendHistory2(id){
  if(SIB_HIST_BUSY.has(id)) return false; const s=SIB[id]; if(!s||s.state!=='open'||!SIB_FLOW) return false;
  SIB_HIST_BUSY.add(id); HP_HIST_TX[id]={st:'send',n:0,at:Date.now()}; hpHistTxUi();
  try{
    let n=0, np=0, skip=0; const lo=(typeof lastOpenLoad==='function')?lastOpenLoad():{}, seen={};
    const hv=(HP_SP_HAVE[id]&&HP_SP_HAVE[id].m)||{}, P=hpSpLoad(), pg=(P[id]&&P[id].p&&typeof P[id].p==='object')?P[id].p:{};
    for(const c of contacts()){
      const all0=histLoad(c.address).filter(x=>x&&typeof x.ts==='number'&&(x.d==='s'||x.d==='p')&&x.t!=='[object ArrayBuffer]'&&x.t!=='[object Blob]').sort((x,y)=>x.ts-y.ts);
      const h=Number(hv[c.address])||0, done=Number(pg[c.address])||0;
      const all=all0.filter(x=>x.ts>=h&&!(done>0&&x.ts<done)).map(sibHistItem); skip+=all0.length-all.length; if(!all.length) continue;
      np++; if(lo[c.address]) seen[c.address]=lo[c.address];
      let cur=[], len=0, last=0, c1=sibHistCard(c); const flush=async()=>{ if(!cur.length) return; const hm={t:'hist',peer:c.address,items:cur}; if(c1){ hm.c=c1; c1=null; } if(!sibSend(id,hm)) throw new Error('線が閉じた'); n+=cur.length; cur=[]; len=0; HP_HIST_TX[id]={st:'send',n:n,at:Date.now()}; hpHistTxUi();
        pg[c.address]=last; P[id]={p:pg,at:Date.now()}; hpSpSave(P);   const d=s.dc; while(d&&d.bufferedAmount>1048576&&SIB[id]===s) await sleep(50); };
      for(const it of all){ const l=JSON.stringify(it).length; if(cur.length&&(cur.length>=SIB_HIST_BATCH||len+l>SIB_HIST_CHARS)) await flush(); cur.push(it); len+=l; last=it.ts; }
      await flush();
    }
    if(!sibSend(id,{t:'histdone',n:n,c:np,seen:seen})) throw new Error('線が閉じた');
    const P2=hpSpLoad(); delete P2[id]; hpSpSave(P2); delete HP_SP_HAVE[id];
    sibHistSet(id,false); hpLog('過去の会話を自分の機械（'+sibLabel(id)+'）へ写した（'+np+' 人・'+n+' 通'+(skip?'・相手が持っている '+skip+' 通は送らない':'')+'）'); HP_HIST_TX[id]={st:'done',n:n,at:Date.now()}; hpHistTxUi(); setTimeout(hpHistTxUi,HP_HIST_DONE_MS+500);
    return true;
  }catch(e){ delete HP_HIST_TX[id]; hpHistTxUi(); hpLog('過去の会話を写せなかった（'+((e&&e.message)||e)+'。次に線がつながったら、続きから写す）'); return false; }
  finally{ SIB_HIST_BUSY.delete(id); }
}
try{ if(typeof sibSendHistory==='function') sibSendHistory=hpSibSendHistory2; }catch(e){}
try{ if(typeof hpSibPut==='function'){ const f=hpSibPut; hpSibPut=async function(body){ try{ if(body&&body.type==='histpull'&&!body.have){ const h=hpSpHave(); if(Object.keys(h).length) body=Object.assign({},body,{have:h}); arguments[0]=body; } }catch(e){} return await f.apply(this,arguments); }; } }catch(e){}
try{ if(typeof hpSibLetter==='function'){ const f=hpSibLetter; hpSibLetter=async function(r){ try{ const o=JSON.parse(r&&r.body); if(o&&o.type==='histpull'&&o.have) hpSpHaveIn(r.fromDev,o.have); }catch(e){} return await f.apply(this,arguments); }; } }catch(e){}

