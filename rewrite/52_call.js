const HP_CALL_GO_WAIT=20000;
const HP_CALL_WAIT=60000  , HP_CALL_WAIT_ICE=25000, HP_CALL_MAXAGE=60000, HP_CALL_GATHER=12000, HP_TURN_TTL=300e3, HP_CALL_WAIT_GO=30000;
let HP_CALL=null, HP_CALL_WK=null, HP_TURN={}, HP_TURN_ENS={}, HP_TURN_BUSY=false;
function hpCallHexU8(h){ const s=String(h||''); const u=new Uint8Array(s.length>>1); for(let i=0;i<u.length;i++) u[i]=parseInt(s.substr(i*2,2),16); return u; }
function hpCallPqOk(){ try{ return !!(typeof RTCRtpScriptTransform==='function'||(typeof RTCRtpSender==='function'&&RTCRtpSender.prototype&&typeof RTCRtpSender.prototype.createEncodedStreams==='function')); }catch(e){ return false; } }
function hpCallCan(){ try{ return !!(typeof RTCPeerConnection==='function'&&typeof navigator!=='undefined'&&navigator.mediaDevices&&typeof navigator.mediaDevices.getUserMedia==='function'&&hpCallPqOk()); }catch(e){ return false; } }

function hpTurnCfgOf(url){ try{ const m=(ID&&ID.turnByUrl&&typeof ID.turnByUrl==='object')?ID.turnByUrl:{}, x=m[String(url)]; return (x&&Number(x.udp)>1024&&Number(x.udp)<65536&&/^[a-z0-9.-]{3,253}$/i.test(String(x.dom||'')))?{udp:Number(x.udp),dom:String(x.dom).toLowerCase()}:null; }catch(e){ return null; } }
function hpTurnCfgSet(url,udp,dom){ try{ if(!ID||!url||!(Number(udp)>1024)||!dom) return false; const m=(ID.turnByUrl&&typeof ID.turnByUrl==='object')?ID.turnByUrl:{}; m[String(url)]={udp:Number(udp),dom:String(dom).toLowerCase(),at:Date.now()}; const ks=Object.keys(m); while(ks.length>8) delete m[ks.shift()]; ID.turnByUrl=m; saveID(); return true; }catch(e){ return false; } }
async function hpTurnRecover(url){
  try{ if(typeof hpMfLedger!=='function'||typeof hpLsMs!=='function') return null;
    const u=String(url), accts=[]; try{ const a=ID&&ID.acctByUrl&&ID.acctByUrl[u]; if(a) accts.push(a); }catch(e){} try{ const a=ID&&ID.lease&&ID.lease.acct; if(a&&accts.indexOf(a)<0) accts.push(a); }catch(e){} try{ if(typeof hpMfAccts==='function') for(const a of (hpMfAccts()||[])) if(a&&accts.indexOf(a)<0) accts.push(a); }catch(e){}
    for(const acct of accts){ let seeds=[]; try{ seeds=(await hpLsMs(acct))||[]; }catch(e){ seeds=[]; } if(!seeds.length) continue;
      const rows=await hpMfLedger(acct,seeds); const row=(rows||[]).find(r=>r&&r.url===u&&Number(r.udp)>1024&&r.dom); if(row){ hpTurnCfgSet(u,row.udp,row.dom); hpLog('通話の中継：台帳から'+(u===String((typeof POST!=='undefined'&&POST&&POST.url)||'')?'この郵便受け':'郵便受け（'+u+'）')+'の UDP の口（'+row.udp+'）を取り戻した'); for(const r2 of rows){ try{ if(r2&&r2.url&&Number(r2.udp)>1024&&r2.dom&&!hpTurnCfgOf(r2.url)) hpTurnCfgSet(r2.url,r2.udp,r2.dom); }catch(e){} }   setTimeout(()=>{ hpTurnShare().catch(()=>{}); },2000); return hpTurnCfgOf(u); } }
  }catch(e){ hpLog('通話の中継：台帳から UDP の口を取り戻せない（'+((e&&e.message)||e)+'）'); } return null; }
function hpTurnCache(url,r){ if(r&&r.on===1){ HP_TURN[String(url)]={at:Date.now(),host:String(r.domain||''),port:Number(r.udp)||0,user:String(r.user||''),pass:String(r.pass||''),alive:r.alive===1,ext:String(r.ext||''),ver:Number(r.ver)||0}; delete HP_TURN_NONE[String(url)]; } else { delete HP_TURN[String(url)]; if(r&&r.ok==='turnget') HP_TURN_NONE[String(url)]=Date.now(); } }
const HP_TURN_NONE={};
async function hpTurnEnsure(force){
  try{ if(!ID||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||!POST.url) return 'skip'; const u=String(POST.url);
    if(!force&&!(typeof hpMfBoxOk==='function'&&hpMfBoxOk())) return 'old'; if(HP_TURN_BUSY) return 'busy'; if(!force&&HP_TURN_ENS[u]&&Date.now()-HP_TURN_ENS[u]<HP_TURN_TTL) return 'done';
    HP_TURN_BUSY=true;
    try{
      let g=null; try{ g=await hpPmReq({op:'turnget'}); }catch(e){ hpLog('通話の中継：turnget に返事がない（'+((e&&e.message)||e)+'）'); return 'err'; }
      let cfg=hpTurnCfgOf(u); if(!cfg&&g&&g.ok==='turnget'&&g.on===1&&Number(g.udp)>1024&&g.domain){ cfg={udp:Number(g.udp),dom:String(g.domain).toLowerCase()}; hpTurnCfgSet(u,cfg.udp,cfg.dom); }
      if(!cfg){ cfg=await hpTurnRecover(u); } if(!cfg){ HP_TURN_ENS[u]=Date.now(); hpLog('通話の中継：この郵便受けの UDP の口が分からない（借りたときの控えが無い。持ち主のほかの端末が預けるか、台帳が読めるときにもう一度）'); return 'nocfg'; }
      if(g&&g.ok==='turnget'&&g.on===1&&Number(g.udp)===cfg.udp&&String(g.domain||'')===cfg.dom){ hpTurnCache(u,g); HP_TURN_ENS[u]=Date.now(); if(!g.alive) hpLog('通話の中継：郵便受けに預けてあるが、中継役がまだ起きていない（次の回に起きる）'); return 'ok'; }
      let r=null; try{ r=await hpPmReq({op:'turn',udp:cfg.udp,domain:cfg.dom}); }catch(e){ hpLog('通話の中継：turn を預けられない（'+((e&&e.message)||e)+'）'); return 'err'; }
      if(r&&r.ok==='turn'){ hpTurnCache(u,r); HP_TURN_ENS[u]=Date.now(); hpLog('通話の中継の設定を自分の郵便受けに預けた（UDP '+cfg.udp+'・'+cfg.dom+'。中継役は次の回に起きる）'); setTimeout(()=>{ hpTurnShare().catch(()=>{}); },2000); return 'set'; }
      return 'err';
    } finally { HP_TURN_BUSY=false; }
  }catch(e){ return 'err'; } }
const HP_TURN_DEADGAP=10*60e3;
async function hpTurnCreds(){
  if(!POST||!POST.up||!POST.url) throw new Error(T('cl_nopost')); if(POST.notOwner) throw new Error(T('cl_noturn'));   const u=String(POST.url); let c=HP_TURN[u];
  if((c&&!c.alive&&Date.now()-Number(c.at||0)<HP_TURN_DEADGAP)||(!c&&Date.now()-Number(HP_TURN_NONE[u]||0)<HP_TURN_DEADGAP)){ throw new Error(T('cl_noturn')); }
  if(!c||Date.now()-c.at>60e3||!c.alive){ let g=null; try{ g=await hpPmReq({op:'turnget'}); }catch(e){ g=null; } if(g&&g.ok==='turnget') hpTurnCache(u,g); else HP_TURN_NONE[u]=Date.now()-HP_TURN_DEADGAP+120e3;   c=HP_TURN[u]; }
  if(!c||!c.alive||!c.host||!c.port||!c.user||!c.pass){ if(!c) hpTurnEnsure(true).catch(()=>{}); throw new Error(T('cl_noturn')); } return c; }
async function hpTurnVisit(url,send,out){
  try{ const u=String(url||''); if(!u||typeof send!=='function'||!Array.isArray(out)) return 'skip';
    const ask=async(q,okv,ms)=>{ await send(q); const t1=Date.now(); while(Date.now()-t1<ms){ const i=out.findIndex(x=>x&&typeof x==='object'&&(x.ok===okv||(x.err&&/turn/.test(String(x.err))))); if(i>=0) return out.splice(i,1)[0]; await sleep(250); } return null; };
    const g=await ask({op:'turnget'},'turnget',8000); if(!g||g.ok!=='turnget') return 'old';
    if(g.on===1){ if(Number(g.udp)>1024&&g.domain) hpTurnCfgSet(u,Number(g.udp),String(g.domain)); try{ hpTurnCache(u,g); }catch(e){} return 'ok'; }
    let cfg=hpTurnCfgOf(u); if(!cfg) cfg=await hpTurnRecover(u); if(!cfg) return 'nocfg';
    const r=await ask({op:'turn',udp:cfg.udp,domain:cfg.dom},'turn',8000); if(r&&r.ok==='turn'){ hpLog('通話の中継の設定を自分のほかの郵便受け（'+u+'）に預けた（UDP '+cfg.udp+'・'+cfg.dom+'）'); return 'set'; } return 'err';
  }catch(e){ return 'err'; } }
let HP_TURN_SHARED='', HP_TURN_RECO=false; const HP_TURN_SHARE_AT={}, HP_TURN_RECO_U={};
async function hpTurnCredMap(){ const out={}; try{ const me=String((typeof POST!=='undefined'&&POST&&POST.url)||''); if(me){ try{ const c=await hpTurnCreds(); if(c) out[me]={h:c.host,p:c.port,u:c.user,k:c.pass}; }catch(e){} } for(const u of Object.keys(HP_TURN)){ if(out[u]) continue; const c=HP_TURN[u]; if(c&&c.alive&&typeof hpTurnFresh==='function'&&hpTurnFresh(c)) out[u]={h:c.host,p:c.port,u:c.user,k:c.pass}; } }catch(e){} return out; }
const HP_TURN_CKEY='p2p_turnc';
function hpTurnCredSave(){ try{ const o={}; for(const u of Object.keys(HP_TURN)){ const c=HP_TURN[u]; if(c&&c.via==='sib'&&typeof hpTurnFresh==='function'&&hpTurnFresh(c)) o[u]={h:c.host,p:c.port,u:c.user,k:c.pass}; } localStorage.setItem(HP_TURN_CKEY,JSON.stringify(o)); }catch(e){} }
function hpTurnCredLoad(){ try{ const o=JSON.parse(localStorage.getItem(HP_TURN_CKEY)||'{}'); let n=0; for(const u of Object.keys(o||{}).slice(0,8)){ if(HP_TURN[u]) continue; const c=hpCallTurnOf(o[u]); if(c&&typeof hpTurnFresh==='function'&&hpTurnFresh(c)){ HP_TURN[u]={at:Date.now(),host:c.host,port:c.port,user:c.user,pass:c.pass,alive:true,ext:'',ver:0,via:'sib'}; n++; } } return n; }catch(e){ return 0; } }
function hpTurnCredTake(cm){ let n=0; try{ if(!cm||typeof cm!=='object') return 0; const me=String((typeof POST!=='undefined'&&POST&&POST.url)||''); for(const u of Object.keys(cm).slice(0,8)){ if(u===me&&HP_TURN[u]&&HP_TURN[u].alive) continue; const c=hpCallTurnOf(cm[u]); if(!c||!(typeof hpTurnFresh==='function'&&hpTurnFresh(c))) continue; HP_TURN[u]={at:Date.now(),host:c.host,port:c.port,user:c.user,pass:c.pass,alive:true,ext:'',ver:0,via:'sib'}; n++; } }catch(e){} if(n) hpTurnCredSave(); return n; }
async function hpTurnKnown(){
  try{ const miss=(typeof hpFbUrls==='function'?hpFbUrls():[]).filter(u=>!hpTurnCfgOf(u)); const nx=miss.find(u=>!HP_TURN_RECO_U[u]); if(nx){ HP_TURN_RECO_U[nx]=1; try{ await hpTurnRecover(nx); }catch(e){} } }catch(e){}
  const m=(ID&&ID.turnByUrl&&typeof ID.turnByUrl==='object')?ID.turnByUrl:{}, out={}; for(const u of Object.keys(m)){ const x=m[u]; if(x&&Number(x.udp)>1024&&x.dom) out[u]={udp:Number(x.udp),dom:String(x.dom)}; } return out; }
async function hpTurnShare(){
  try{ if(!ID||typeof hpSibPut!=='function'||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0; const out=await hpTurnKnown(), ks=Object.keys(out); if(!ks.length) return 0;
    const cm=await hpTurnCredMap(), key=JSON.stringify(out)+'|'+Object.keys(cm).sort().join(',')+'|'+Math.floor(Date.now()/(6*3600e3)); if(key===HP_TURN_SHARED) return 0; HP_TURN_SHARED=key;
    const n=await hpSibPut(Object.assign({v:1,type:'turncfg',m:out},{c:cm}),null,'sig'); if(n) hpLog('通話の中継：郵便受けの UDP の口（'+ks.length+' 件）を自分のほかの端末に写した'); return n||0; }catch(e){ return 0; } }
async function hpTurnShareTo(dev){
  try{ if(!ID||!dev||typeof hpSibPut!=='function'||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0; const now=Date.now(); if(now-(HP_TURN_SHARE_AT[dev]||0)<10*60e3) return 0; HP_TURN_SHARE_AT[dev]=now;
    const out=await hpTurnKnown(); if(!Object.keys(out).length) return 0; const n=await hpSibPut(Object.assign({v:1,type:'turncfg',m:out},{c:await hpTurnCredMap()}),[dev],'sig'); if(n) hpLog('通話の中継：郵便受けの UDP の口（'+Object.keys(out).length+' 件）を自分の端末（'+String(dev).slice(0,10)+'…）に写した'); return n||0; }catch(e){ return 0; } }
function hpTurnOnSig(r,o){
  try{ if(!ID||!o||o.v!==1||o.type!=='turncfg'||!o.m||typeof o.m!=='object') return false; let n=0, mine=false; const me=String((typeof POST!=='undefined'&&POST&&POST.url)||'');
    for(const u of Object.keys(o.m).slice(0,16)){ const x=o.m[u]; if(!x||!(Number(x.udp)>1024)||!x.dom||hpTurnCfgOf(u)) continue; if(hpTurnCfgSet(u,Number(x.udp),String(x.dom))){ n++; if(u===me) mine=true; } }
    try{ const k=hpTurnCredTake(o.c); if(k) hpLog('通話の中継：自分のほかの郵便受けの交換手の名前と合言葉（'+k+' 件）を受け取った（自分の郵便受けに交換手が無くても呼べる）'); }catch(e){}
    if(n) hpLog('通話の中継：郵便受けの UDP の口（'+n+' 件）を自分のほかの端末から受け取った'); if(mine){ delete HP_TURN_ENS[me]; setTimeout(()=>{ hpTurnEnsure(true).catch(()=>{}); },500); } return true; }catch(e){ return false; } }
function hpCallIce(c){ return {iceServers:[{urls:'turn:'+c.host+':'+c.port+'?transport=udp',username:c.user,credential:c.pass}],iceTransportPolicy:'relay',encodedInsertableStreams:true}; }
function hpCallTurnOf(t){ try{ if(!t||typeof t!=='object') return null; const h=String(t.h||'').toLowerCase(), p=Number(t.p), u=String(t.u||''), k=String(t.k||''); if(!/^[a-z0-9]([a-z0-9-]{0,62}\.)+[a-z0-9-]{1,63}$/.test(h)||!(Number.isInteger(p)&&p>1024&&p<65536)||!/^[\x21-\x7e]{1,64}$/.test(u)||!/^[\x21-\x7e]{1,64}$/.test(k)) return null; return {host:h,port:p,user:u,pass:k}; }catch(e){ return null; } }
function hpCallSdpTune(sdp){ try{ return String(sdp).replace(/^(a=fmtp:\d+ [^\r\n]*useinbandfec=1[^\r\n]*)$/m,(m)=>/cbr=1/.test(m)?m:m+';cbr=1'); }catch(e){ return sdp; } }
function hpCallHasRelay(sdp){ return /^a=candidate:[^\r\n]* typ relay/m.test(String(sdp||'')); }
function hpCallSdpStrip(sdp){ return String(sdp||'').split(/\r\n/).filter(l=>!/^a=candidate:/.test(l)&&!/^a=end-of-candidates/.test(l)).join('\r\n'); }
function hpCallSdpCands(sdp){ const s=String(sdp||''), mid=(s.match(/^a=mid:(\S+)/m)||[])[1]||'0'; return s.split(/\r\n/).filter(l=>/^a=candidate:/.test(l)).map(l=>({candidate:l.slice(2),sdpMid:mid,sdpMLineIndex:0})); }
async function hpCallAddCands(C,cands){ let n=0; for(const c of (cands||[])){ try{ await C.pc.addIceCandidate(c); n++; }catch(e){ hpLog('通話：相手の候補を足せない（'+((e&&e.message)||e)+'）'); } } return n; }
function hpCallIceGo(C){ if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='connecting'){ hpCallStatLog(C); hpCallBye('lost'); hpCallEnd('lost',T('cl_lost')); } },HP_CALL_WAIT_ICE); }
async function hpCallGather(pc){
  if(pc.iceGatheringState==='complete') return; await new Promise(res=>{ const t=setTimeout(res,HP_CALL_GATHER); const f=()=>{ if(pc.iceGatheringState==='complete'){ clearTimeout(t); res(); } }; try{ pc.addEventListener('icegatheringstatechange',f); }catch(e){ clearTimeout(t); res(); } }); }

function hpCallWorker(){ if(!HP_CALL_WK) HP_CALL_WK=new Worker('rewrite/52_callwk.js'); return HP_CALL_WK; }
function hpCallSalt(d){ const s=new Uint8Array(8); s[0]=d; return s; }
function hpCallCryptoApply(x,op,key,salt){ const w=hpCallWorker(), o={op:op,key:key.slice(0),salt:salt};
  if(typeof RTCRtpScriptTransform==='function'){ x.transform=new RTCRtpScriptTransform(w,o); return 'script'; }
  const es=x.createEncodedStreams(); w.postMessage(Object.assign(o,{readable:es.readable,writable:es.writable}),[es.readable,es.writable]); return 'legacy'; }
function hpCallCryptoOn(C){
  try{ if(!C||!C.pc||!C.key) return; const me=C.dir==='out'?1:2, you=C.dir==='out'?2:1; C.cry=C.cry||{};
    C.cryW=C.cryW||new WeakSet(); const kd=(x)=>{ try{ if(x.track) return x.track.kind; const t=C.pc.getTransceivers().find(t=>t.sender===x||t.receiver===x); return t&&t.receiver&&t.receiver.track?t.receiver.track.kind:''; }catch(e){ return ''; } };
    for(const s of C.pc.getSenders()){ if(!s||C.cryW.has(s)||kd(s)!=='audio') continue; C.cryW.add(s); C.cry['s'+Object.keys(C.cry).length]=hpCallCryptoApply(s,'enc',C.key,hpCallSalt(me)); }
    for(const r of C.pc.getReceivers()){ if(!r||C.cryW.has(r)||kd(r)!=='audio') continue; C.cryW.add(r); C.cry['r'+Object.keys(C.cry).length]=hpCallCryptoApply(r,'dec',C.key,hpCallSalt(you)); }
  }catch(e){ hpLog('通話：二重の鍵を掛けられない（'+((e&&e.message)||e)+'）'); } }

const HP_CALL_CSS='#hp-call{position:fixed;inset:0;z-index:9000;background:#121820;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center}'
 +'#hp-call .who{font-size:1.5em;font-weight:600;max-width:90vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#hp-call .st{font-size:1.05em;opacity:.9}#hp-call .pq{font-size:.85em;opacity:.7}'
 +'#hp-call .btns{display:flex;gap:28px;margin-top:18px}#hp-call button{border:0;border-radius:50%;width:76px;height:76px;font-size:1.6em;color:#fff;cursor:pointer}#hp-call button.ans{background:#2e9c5c}#hp-call button.end{background:#d64545}'
 +'#hp-call button span{display:block;font-size:.45em;margin-top:2px}#btn-conv-call{margin-left:4px;background:var(--teal);border-color:var(--teal);color:#06231d}';
function hpCallEl(){ let d=document.getElementById('hp-call'); if(d) return d;
  try{ if(document.head&&!document.getElementById('hp-call-css')){ const st=document.createElement('style'); st.id='hp-call-css'; st.textContent=HP_CALL_CSS; document.head.appendChild(st); } }catch(e){}
  d=document.createElement('div'); d.id='hp-call';
  const who=document.createElement('div'); who.className='who'; const st=document.createElement('div'); st.className='st'; const pq=document.createElement('div'); pq.className='pq'; pq.textContent=T('cl_pq');
  const au=document.createElement('audio'); au.id='hp-call-audio'; au.autoplay=true; try{ au.setAttribute('playsinline',''); }catch(e){}
  const btns=document.createElement('div'); btns.className='btns';
  const mk=(cls,icon,k,fn)=>{ const b=document.createElement('button'); b.type='button'; b.className=cls; b.appendChild(document.createTextNode(icon)); const s=document.createElement('span'); s.textContent=T(k); b.appendChild(s); b.onclick=fn; return b; };
  d.__ans=mk('ans','',"btn_answer",()=>{ hpCallAccept().catch(()=>{}); }); try{ d.__ans.insertBefore(hpCallIcon(30),d.__ans.firstChild); }catch(e){}
  d.__dec=mk('end','✕',"btn_decline",()=>hpCallDecline()); d.__end=mk('end','✕',"btn_hangup",()=>hpCallHangup());
  btns.appendChild(d.__ans); btns.appendChild(d.__dec); btns.appendChild(d.__end); d.appendChild(who); d.appendChild(st); d.appendChild(pq); d.appendChild(au); d.appendChild(btns); d.__who=who; d.__st=st;
  (document.body||document.documentElement).appendChild(d); return d; }
function hpCallUnlock(){ try{ const d=hpCallEl(), au=d&&document.getElementById('hp-call-audio'); if(au){ const p=au.play(); if(p&&p.catch) p.catch(()=>{}); } }catch(e){} try{ const C=window.AudioContext||window.webkitAudioContext; if(C){ if(!HP_CALL_AC) HP_CALL_AC=new C(); if(HP_CALL_AC.state==='suspended') HP_CALL_AC.resume(); } }catch(e){} }
function hpCallFmt(ms){ const s=Math.max(0,Math.floor(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function hpCallUi(){ try{ const C=HP_CALL; let d=document.getElementById('hp-call'); if(!C){ if(d) d.style.display='none'; return; } d=hpCallEl(); d.style.display='flex'; try{ if((C.st==='ringing'||C.st==='calling')&&typeof hpCallHead==='function') hpCallHead(d); }catch(e){}
    d.__who.textContent=nickOf(C.peer); const ring=(C.st==='ringing'), live=(C.st==='talking');
    d.__ans.style.display=ring?'':'none'; d.__dec.style.display=ring?'':'none'; d.__end.style.display=(ring||C.st==='ended')?'none':'';
    d.__st.textContent=C.st==='calling'?TF('cl_calling',{who:nickOf(C.peer)}):ring?TF('cl_incoming',{who:nickOf(C.peer)}):C.st==='connecting'?T('cl_connecting'):live?TF('cl_talking',{t:hpCallFmt(Date.now()-(C.talkAt||Date.now()))}):C.st==='ended'?(C.endText||T('cl_ended')):'';
  }catch(e){ try{ hpLog('通話：画面を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} } }
function hpCallHead(d){ try{ if(!d||!d.parentNode) return; const b=document.body||document.documentElement; if(d.parentNode!==b||b.lastElementChild!==d) b.appendChild(d); }catch(e){} }
function hpCallCard(on){ try{ if(typeof hpBlPerm!=='function'||hpBlPerm()!=='granted'||!navigator.serviceWorker||!navigator.serviceWorker.ready){ if(on&&HP_CALL&&HP_CALL.st==='ringing') hpLog('通話：通知のカードを出せない（通知の許可：'+((typeof hpBlPerm==='function')?hpBlPerm():'?')+'）'); return false; }
    if(!on){ navigator.serviceWorker.ready.then(r=>r.getNotifications({tag:'hp-call'})).then(l=>{ for(const x of (l||[])) x.close(); }).catch(()=>{}); return true; }
    const C=HP_CALL; if(!C||C.st!=='ringing') return false; if(typeof hpBlOff==='function'&&hpBlOff()){ hpLog('通話：通知のカードを出さない（通知を切ってある）'); return false; }
    let back=false; try{ back=(typeof hpBlHidden==='function'&&hpBlHidden())||(typeof document.hasFocus==='function'&&!document.hasFocus()); }catch(e){ back=false; } if(!back) return false;
    hpLog('通話：通知のカードを出した');
    navigator.serviceWorker.ready.then(r=>r.showNotification('Handpost',{body:TF('cl_incoming',{who:nickOf(C.peer)}),tag:'hp-call',renotify:true,requireInteraction:true,vibrate:[300,200,300,200,300],icon:'/icons/icon-192.png',badge:'/icons/icon-192.png'})).catch(()=>{}); return true; }catch(e){ return false; } }
function hpCallIcon(px){ const N='http://www.w3.org/2000/svg', g=document.createElementNS(N,'svg'); g.setAttribute('viewBox','0 0 24 24'); g.setAttribute('width',String(px||18)); g.setAttribute('height',String(px||18)); g.setAttribute('fill','none'); g.setAttribute('stroke','currentColor'); g.setAttribute('stroke-width','2.2'); g.setAttribute('stroke-linecap','round'); g.setAttribute('stroke-linejoin','round'); g.setAttribute('aria-hidden','true'); g.style.verticalAlign='middle'; const pth=document.createElementNS(N,'path'); pth.setAttribute('d','M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'); g.appendChild(pth); return g; }
function hpCallBtn(){ try{ const h=document.getElementById('chat-head'); if(!h) return; let b=document.getElementById('btn-conv-call'); if(!b){ b=document.createElement('button'); b.id='btn-conv-call'; b.type='button'; try{ b.appendChild(hpCallIcon(18)); }catch(e){ b.textContent='☏'; } b.onclick=()=>{ if(CURPEER) hpCallStart(CURPEER).catch(()=>{}); }; const sr=document.getElementById('btn-conv-sr'); if(sr&&sr.parentNode===h) h.insertBefore(b,sr.nextSibling); else h.appendChild(b); }
    b.title=T('tip_conv_call'); b.style.display=(hpCallCan()&&CURPEER&&typeof hpCardOf==='function'&&hpCardOf(CURPEER))?'':'none'; }catch(e){} }

let HP_CALL_AC=null, HP_CALL_RING_T=null;
function hpCallRing(on){ try{ if(HP_CALL_RING_T){ clearInterval(HP_CALL_RING_T); HP_CALL_RING_T=null; } if(!on) return; if(typeof soundOn==='function'&&soundOn()==='off'){ try{ if(navigator.vibrate) navigator.vibrate([400,300,400]); }catch(e){} return; }
    const C=window.AudioContext||window.webkitAudioContext; if(!C) return; if(!HP_CALL_AC) HP_CALL_AC=new C(); const a=HP_CALL_AC; try{ if(a.state==='suspended') a.resume(); }catch(e){}
    const burst=()=>{ try{ const t0=a.currentTime; for(let i=0;i<2;i++){ const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=i?660:880; g.gain.setValueAtTime(0.0001,t0+i*0.5); g.gain.linearRampToValueAtTime(0.25,t0+i*0.5+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+i*0.5+0.4); o.connect(g); g.connect(a.destination); o.start(t0+i*0.5); o.stop(t0+i*0.5+0.45); } try{ if(navigator.vibrate) navigator.vibrate([300,200,300]); }catch(e){} }catch(e){} };
    burst(); HP_CALL_RING_T=setInterval(burst,2500); }catch(e){} }

async function hpCallSig(peer,body,devs){
  const got=(typeof hpSlSend==='function')?hpSlSend(peer,body,devs):[]; const fast=got.length>0; if(fast&&Array.isArray(devs)&&devs.length&&devs.every(d=>got.indexOf(d)>=0)) return {fast:1};
  const p=hpCallSigPost(peer,body,devs); if(fast){ p.catch(e=>{ try{ hpLog('通話：郵便受けへの合図は届かなかった（糸では届いた。'+((e&&e.message)||e)+'）'); }catch(x){} }); return {fast:1}; } return p; }
async function hpCallSigPost(peer,body,devs){ const card=(typeof hpCardOf==='function')?hpCardOf(peer):null; const extra=arguments[3];   if(!card) throw new Error(T('al_nocard')); const to=(Array.isArray(devs)&&devs.length&&Array.isArray(card.devices))?Object.assign({},card,{devices:card.devices.filter(d=>devs.indexOf(d)>=0)}):card; if(!to.devices||!to.devices.length) return null;

  const t0=Date.now(), opt=Object.assign((body&&body.type==='call')?{ring:'call'}:{},(body&&HP_CALL_PRI.indexOf(body.type)>=0)?{pri:1}:{},(body&&body.type==='call'&&Number(body.w)>0)?{rw:Math.round(Number(body.w)/1000)}:{},(extra&&typeof extra==='object')?extra:{});       for(let n=0;;n++){ try{ return await hpPut(to,JSON.stringify(body),'sig',opt); }catch(e){ if(!(e&&e.hpk==='wait')||Date.now()-t0>HP_CALL_SIG_RETRY) throw e; if(n===0) try{ hpLog('通話：郵便受けが少し待ってと言っている。出し直す（'+((e&&e.message)||e)+'）'); }catch(x){} await new Promise(r=>setTimeout(r,2000)); } } }
const HP_CALL_SIG_RETRY=25000;
function hpCallClose(C){ try{ hpCallCard(false); }catch(e){} try{ if(C.timer){ clearTimeout(C.timer); C.timer=null; } }catch(e){} try{ if(C.tick){ clearInterval(C.tick); C.tick=null; } }catch(e){} try{ if(C.stream) C.stream.getTracks().forEach(t=>{ try{ t.stop(); }catch(e){} }); }catch(e){} try{ if(C.pc){ C.pc.onconnectionstatechange=null; C.pc.ontrack=null; C.pc.close(); } }catch(e){} try{ const au=document.getElementById('hp-call-audio'); if(au) au.srcObject=null; }catch(e){} hpCallRing(false); }
function hpCallEnd(why,text){ const C=HP_CALL; if(!C) return; if(C.st==='ended') return; hpCallClose(C); C.st='ended'; C.why=why; C.endText=text||''; hpLog('通話：終わり（'+why+(C.talkAt?'・'+hpCallFmt(Date.now()-C.talkAt):'')+'）'); hpCallUi(); setTimeout(()=>{ if(HP_CALL===C){ HP_CALL=null; hpCallUi(); } },2200); try{ if(typeof hpCallOnEnd==='function') hpCallOnEnd(C); }catch(e){} }
function hpCallBye(why){ const C=HP_CALL; if(!C||C.byeSent) return; C.byeSent=true; const devs=C.dev?[C.dev]:null; hpCallSig(C.peer,{v:1,type:'callend',call:C.id,why:why},devs).catch(()=>{}); }
function hpCallHangup(){ const C=HP_CALL; if(!C) return; if(C.st==='calling'||C.st==='connecting'||C.st==='talking'){ hpCallBye('hangup'); hpCallEnd('hangup',T('cl_end_me')); } }
function hpCallDecline(){ const C=HP_CALL; if(!C||C.st!=='ringing') return; hpCallBye('decline'); hpCallEnd('decline'); }
function hpCallRelayAddrs(sdp){ return String(sdp||'').split(/\r\n/).filter(l=>/^a=candidate:[^\r\n]* typ relay/.test(l)).map(l=>{ const p=l.split(' '); return p[4]+':'+p[5]; }); }
async function hpCallStats(C){ const out=[]; try{ const st=await C.pc.getStats(); const by={}; st.forEach(r=>{ by[r.id]=r; }); st.forEach(r=>{ if(r.type!=='candidate-pair') return; const l=by[r.localCandidateId]||{}, m=by[r.remoteCandidateId]||{}; out.push('['+(l.candidateType||'?')+'/'+(l.protocol||'?')+' → '+(m.candidateType||'?')+'/'+(m.protocol||'?')+'] '  +r.state+'・問い 送 '+(r.requestsSent|0)+' 受 '+(r.requestsReceived|0)+'・答え 受 '+(r.responsesReceived|0)+' 送 '+(r.responsesSent|0)+'・受けた '+(r.bytesReceived|0)+' byte'); }); st.forEach(r=>{ if(r.type==='transport') out.push('線 '+(r.iceState||'?')+'・暗号 '+(r.dtlsState||'?')); }); }catch(e){ out.push('取れない（'+((e&&e.message)||e)+'）'); } return out.length?out.join('；'):'（対なし）'; }
function hpCallStatLog(C){ if(!C||C.statLog||!C.pc) return; C.statLog=1; hpCallStats(C).then(s=>{ try{ hpLog('通話：線の記録 '+s); }catch(e){} }).catch(()=>{}); if(C.dir==='out'){ try{ hpPmReq({op:'turnget',diag:1}).then(g=>{ try{ if(g&&g.ok==='turnget'&&g.on===1){ hpLog('通話：交換手の控え（型 '+(g.ver|0)+'・割り当ての頼み '+(g.allocs|0)+'・折り返し '+(g.loop|0)+'・断り '+(g.rej|0)+'・束 '+(g.chan|0)+'・包み '+(g.msgs|0)+'）'); if(Array.isArray(g.ev)&&g.ev.length) hpLog('通話：交換手の記録（外へ '+(g.nout|0)+'・束なし '+(g.nchmiss|0)+'）\n'+g.ev.slice(-16).map(x=>(typeof hpNoIp==='function')?hpNoIp(x):String(x)).join('\n')); } }catch(e){} }).catch(()=>{}); }catch(e){} } }
function hpCallWire(C){ try{ C.pc.oniceconnectionstatechange=()=>{ try{ if(HP_CALL===C) hpLog('通話：線の状態 '+C.pc.iceConnectionState+'（'+Math.round((Date.now()-C.at)/1000)+' 秒）'); }catch(e){} }; C.pc.onicegatheringstatechange=()=>{ try{ if(HP_CALL===C&&C.pc.iceGatheringState==='complete') hpLog('通話：候補が集まった（'+Math.round((Date.now()-C.at)/1000)+' 秒・交換手の候補 '+(hpCallHasRelay(C.pc.localDescription&&C.pc.localDescription.sdp)?'あり '+hpCallRelayAddrs(C.pc.localDescription.sdp).join(' '):'なし')+'）'); }catch(e){} }; }catch(e){}
  C.pc.ontrack=(e)=>{ try{ const au=document.getElementById('hp-call-audio'); const st=(e.streams&&e.streams[0])||new MediaStream([e.track]); C.remote=st; if(au){ au.srcObject=st; au.play().catch(()=>{}); } hpCallCryptoOn(C); }catch(x){} };
  C.pc.onconnectionstatechange=()=>{ try{ if(HP_CALL!==C) return; const s=C.pc.connectionState; if(s==='connected'){ if(C.rec){ C.rec=0; hpLog('通話：つなぎ直した'); hpCallUi(); } if(C.st==='connecting'){ C.st='talking'; C.talkAt=Date.now(); if(C.timer){ clearTimeout(C.timer); C.timer=null; } C.tick=setInterval(hpCallUi,1000); hpLog('通話：つながった（'+(C.dir==='out'?'呼んだ':'応えた')+'・二重の鍵 '+Object.keys(C.cry||{}).length+'）'); hpCallUi(); try{ hpTurnGood(C); }catch(e){} } }
    else if(s==='failed'&&C.st==='connecting'){ if(!C.failLog){ C.failLog=1; hpLog('通話：線がまだつながらない（相手の準備を待つ）'); hpCallStatLog(C); } }
    else if(s==='failed'||s==='closed'){ if(C.st!=='ended'){ hpCallBye('lost'); hpCallEnd('lost',T('cl_lost')); } }
    else if(s==='disconnected'){ if(C.st==='talking'&&!C.rec){ C.rec=Date.now(); hpLog('通話：線が途切れた（つなぎ直しを 20 秒待つ）'); hpCallUi(); } setTimeout(()=>{ try{ if(HP_CALL===C&&C.pc&&C.pc.connectionState==='disconnected'&&C.st!=='ended'){ hpCallBye('lost'); hpCallEnd('lost',T('cl_lost')); } }catch(e){} },20000); } }catch(e){} }; }
async function hpCallMic(){ return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false}); }
async function hpCallStart(peer){
  peer=String(peer||'').trim(); if(!ID||!peer) return false;
  if(!hpCallCan()){ hpToast(T('cl_nosupport'),6000); return false; }
  if(typeof hpBlocked==='function'&&hpBlocked(peer)) return false;
  if(HP_CALL){ hpToast(T('cl_busy_me'),4000); return false; }
  const card=(typeof hpCardOf==='function')?hpCardOf(peer):null; if(!card){ hpToast(T('al_nocard'),4000); return false; }
  const C={id:hpHex(crypto.getRandomValues(new Uint8Array(8))),peer:peer,dir:'out',st:'calling',pc:null,stream:null,dev:null,key:null,at:Date.now(),timer:null}; HP_CALL=C; hpCallUi(); hpCallUnlock();
  try{
    const cr=await hpTurnCredsAny(); if(HP_CALL!==C) return false;
    C.stream=await hpCallMic(); if(HP_CALL!==C){ hpCallClose(C); return false; }
    C.key=crypto.getRandomValues(new Uint8Array(32));
    C.turns=hpTurnPick([cr].concat(hpTurnOwnAll(),hpTurnPeerOf(peer))); C.pc=new RTCPeerConnection(hpCallIceN(C.turns)); hpCallWire(C); C.stream.getTracks().forEach(t=>C.pc.addTrack(t,C.stream)); hpCallCryptoOn(C);
    const off=await C.pc.createOffer({offerToReceiveAudio:true}); await C.pc.setLocalDescription({type:'offer',sdp:hpCallSdpTune(off.sdp)}); await hpCallGatherN(C.pc,C.turns.length); if(HP_CALL!==C) return false; hpTurnHealth(C).catch(()=>{}); C.gathered=Date.now(); hpCallUi();
    const sdp=C.pc.localDescription.sdp, fp=extractFingerprint(sdp); if(!fp) throw new Error(T('e_nofp')); if(!hpCallHasRelay(sdp)) throw new Error(T('cl_noturn'));
    await hpCallSig(peer,{v:1,type:'call',call:C.id,sdp:sdp,fp:fp,k:hpHex(C.key),pq:1,pre:1,t:{h:cr.host,p:cr.port,u:cr.user,k:cr.pass},ts:hpTurnWire(C.turns)},null); if(HP_CALL!==C) return false; C.sent=Date.now(); hpCallUi();
    hpLog('通話：'+nickOf(peer)+' を呼び出した（交換手 '+C.turns.map(x=>x.host+':'+x.port).join('・')+'・型 '+(cr.ver||'?')+(cr.ext?'':'・外の住所なし')+'）');
    C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='calling'){ hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); } },HP_CALL_WAIT);
    return true;
  }catch(e){ const m=String((e&&e.message)||e); hpLog('通話：呼び出せない（'+m+'）'); if(HP_CALL===C){ hpCallEnd('fail',/NotAllowed|Permission|denied/i.test(m)?T('cl_nomic'):(e&&e.hpk?T('cl_nosend'):m)); } return false; } }
async function hpCallOnSig(r,o){
  try{
    if(!ID||!o||o.v!==1||typeof o.call!=='string'||!/^[0-9a-f]{16}$/.test(o.call)) return;
    const from=r.from; if(from===ID.address||!isContact(from)) return; const c=contacts().find(x=>x.address===from); if(c&&c.pubKey&&c.pubKey!==r.fromMaster){ hpLog('通話の合図：マスター鍵が連絡先のものと違う（捨てた）'); return; }
    const age=Date.now()-Number(r.sentAt); if(!(Math.abs(age)<=HP_CALL_MAXAGE)){ hpLog('古い通話の合図（'+Math.round(age/1000)+' 秒前。捨てた）'); return; }
    const C=HP_CALL;
    if(o.type==='callend'){ if(C&&C.id===o.call&&C.peer===from&&C.st!=='ended'){ C.byeSent=true; const w=String(o.why||''); hpCallEnd('peer:'+w,w==='decline'?T('cl_declined'):w==='busy'?TF('cl_busy',{who:nickOf(from)}):w==='nopq'?T('cl_nopq'):w==='taken'?T('cl_taken'):w==='timeout'?T('cl_noans'):w==='hangup'?TF('cl_end_peer',{who:nickOf(from)}):w==='lost'?T('cl_lost'):T('cl_ended')); } return; }
    if(o.type==='callans'){ if(!(C&&C.dir==='out'&&C.id===o.call&&C.peer===from&&C.st==='calling')){ if(C&&C.id===o.call&&C.peer===from&&C.dev&&C.dev!==r.fromDev) hpCallSig(from,{v:1,type:'callend',call:o.call,why:'taken'},[r.fromDev]).catch(()=>{}); return; }
      if(typeof o.sdp!=='string'||typeof o.fp!=='string'||extractFingerprint(o.sdp)!==o.fp||!hpCallHasRelay(o.sdp)){ hpLog('通話の答えの形が違う（捨てた）'); return; }
      C.dev=r.fromDev||null; C.st='connecting'; hpCallUi(); try{ hpTurnPeerSet(from,o.ts); }catch(e){}
      try{ C.cands=hpCallSdpCands(o.sdp); await C.pc.setRemoteDescription({type:'answer',sdp:hpCallSdpStrip(o.sdp)}); hpCallCryptoOn(C); }catch(e){ hpLog('通話：答えを受け取れない（'+((e&&e.message)||e)+'）'); hpCallBye('fail'); hpCallEnd('fail',T('cl_lost')); return; }
      try{ const card=hpCardOf(from); const others=(card&&Array.isArray(card.devices)?card.devices:[]).filter(d=>d!==C.dev); if(others.length) hpCallSig(from,{v:1,type:'callend',call:C.id,why:'taken'},others).catch(()=>{}); }catch(e){}
      if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='connecting'){ hpCallBye('lost'); hpCallEnd('lost',T('cl_lost')); } },HP_CALL_WAIT_ICE+HP_CALL_WAIT_GO);

      hpCallSig(from,{v:1,type:'callgo',call:C.id},C.dev?[C.dev]:null).catch(()=>{});
      try{ if(C.cands){ const cs=C.cands; C.cands=null; const n=await hpCallAddCands(C,cs); hpCallIceGo(C); hpLog('通話：答えを受け取ったので、すぐ線をつなぎ始めた（'+n+'）'); } }catch(e){} return; }
    if(o.type==='callgo'){ if(!(C&&C.dir==='in'&&C.id===o.call&&C.peer===from&&C.st==='connecting'&&C.pc&&C.cands)) return; const cs=C.cands; C.cands=null; const n=await hpCallAddCands(C,cs); hpCallIceGo(C); hpLog('通話：相手の準備が整ったので線をつなぎ始めた（'+n+'）'); return; }
    if(o.type==='call'){
      const tn=hpCallTurnOf(o.t); if(typeof o.sdp!=='string'||typeof o.fp!=='string'||extractFingerprint(o.sdp)!==o.fp||typeof o.k!=='string'||!/^[0-9a-f]{64}$/.test(o.k)||o.pq!==1||!tn){ hpLog('通話の呼び出しの形が違う（捨てた）'); return; }
      if(!hpCallCan()){ hpCallSig(from,{v:1,type:'callend',call:o.call,why:'nopq'},[r.fromDev]).catch(()=>{}); hpLog('通話：この端末では二重の鍵が使えないので応えない'); return; }
      if(C&&C.dir==='out'&&C.st==='calling'&&C.peer===from&&C.id!==o.call&&typeof hpCallGlare==='function'&&await hpCallGlare(r,o,tn)) return;
      if(C&&C.st!=='ended'){ if(C.id===o.call) return; hpCallSig(from,{v:1,type:'callend',call:o.call,why:'busy'},[r.fromDev]).catch(()=>{}); hpLog('通話：取り込み中なので応えない'); return; }
      if(typeof hpBlocked==='function'&&hpBlocked(from)) return;
      const N={id:o.call,peer:from,dir:'in',st:'ringing',pc:null,stream:null,dev:r.fromDev||null,key:hpCallHexU8(o.k),offer:o.sdp,turn:tn,turns:hpCallTurnsOf(o,tn),at:Date.now(),timer:null}; HP_CALL=N; hpCallUi(); hpCallRing(true); try{ hpTurnPeerSet(from,o.ts||[o.t]); }catch(e){} N.prep=hpCallPrep(N); N.prep.catch(()=>{});
      hpLog('通話：'+nickOf(from)+' から呼び出し'); try{ if(typeof notifySound==='function') notifySound('msg'); }catch(e){} try{ hpCallCard(true); }catch(e){}
      N.timer=setTimeout(()=>{ if(HP_CALL===N&&N.st==='ringing'){ hpCallEnd('missed',T('cl_missed')); } },Math.max(15000,HP_CALL_WAIT-Math.max(0,age))); return; }
  }catch(e){ hpLog('通話の合図でエラー（'+((e&&e.message)||e)+'）'); } }
async function hpCallPrep(C){
  const live=()=>HP_CALL===C&&C.st!=='ended'; const t0=Date.now();
  let mine=[]; try{ mine=await hpTurnMineQuick(); }catch(e){ mine=[]; } if(!live()) throw new Error('ended'); C.mine=mine; C.turns=hpTurnPick((C.turns&&C.turns.length?C.turns:[C.turn]).concat(mine));
  const pc=new RTCPeerConnection(hpCallIceN(C.turns)); if(!live()){ try{ pc.close(); }catch(e){} throw new Error('ended'); } C.pc=pc; hpCallWire(C);
  C.cands=hpCallSdpCands(C.offer); await pc.setRemoteDescription({type:'offer',sdp:hpCallSdpStrip(C.offer)}); if(!live()) throw new Error('ended');
  for(const t of pc.getTransceivers()){ try{ if(t.receiver&&t.receiver.track&&t.receiver.track.kind==='audio') t.direction='sendrecv'; }catch(e){} } hpCallCryptoOn(C);
  const ans=await pc.createAnswer(); await pc.setLocalDescription({type:'answer',sdp:hpCallSdpTune(ans.sdp)}); await hpCallGatherN(pc,C.turns.length); if(!live()) throw new Error('ended'); hpTurnHealth(C).catch(()=>{});
  const sdp=pc.localDescription.sdp, fp=extractFingerprint(sdp); if(!fp) throw new Error(T('e_nofp')); if(!hpCallHasRelay(sdp)) throw new Error(T('cl_noturn2'));
  C.ans={sdp:sdp,fp:fp}; if(C.st==='ringing') hpLog('通話：鳴っている間に準備した（'+((Date.now()-t0)/1000).toFixed(1)+' 秒）'); return true; }
async function hpCallAccept(){
  const C=HP_CALL; if(!C||C.st!=='ringing') return false; C.st='connecting'; C.accAt=Date.now(); hpCallRing(false); hpCallUi(); hpCallUnlock();
  try{
    if(!C.turn) throw new Error(T('cl_noturn2'));
    if(!C.prep){ C.prep=hpCallPrep(C); C.prep.catch(()=>{}); }
    C.stream=await hpCallMic(); if(HP_CALL!==C){ hpCallClose(C); return false; }
    await C.prep; if(HP_CALL!==C||C.st!=='connecting'){ return false; }
    const tr=C.pc.getTransceivers().find(t=>t.receiver&&t.receiver.track&&t.receiver.track.kind==='audio'), mic=C.stream.getAudioTracks()[0];
    if(!tr||!mic) throw new Error(T('cl_nomic')); await tr.sender.replaceTrack(mic); try{ if(tr.sender.setStreams) tr.sender.setStreams(C.stream); }catch(e){} hpCallCryptoOn(C);
    await hpCallSig(C.peer,{v:1,type:'callans',call:C.id,sdp:C.ans.sdp,fp:C.ans.fp,pq:1,ts:hpTurnWire(C.mine||[])},C.dev?[C.dev]:null); if(HP_CALL!==C) return false; C.ansSent=Date.now(); hpCallUi();
    if(C.st!=='connecting') return false; hpLog('通話：'+nickOf(C.peer)+' に応えた（交換手 '+C.turns.map(x=>x.host+':'+x.port).join('・')+'・出てから '+((Date.now()-C.accAt)/1000).toFixed(1)+' 秒）');

    if(C.cands){ if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(async()=>{ try{ if(HP_CALL!==C||C.st!=='connecting'||!C.cands) return; const cs=C.cands; C.cands=null; const n=await hpCallAddCands(C,cs); hpCallIceGo(C); hpLog('通話：「始めよう」が 20 秒来ないので線をつなぎ始めた（'+n+'）'); }catch(e){} },HP_CALL_GO_WAIT); hpLog('通話：答えを届けた（「始めよう」を待つ）'); } return true;
  }catch(e){ const m=String((e&&e.message)||e); hpLog('通話：応えられない（'+m+'）'); if(HP_CALL===C){ hpCallBye('fail'); hpCallEnd('fail',/NotAllowed|Permission|denied/i.test(m)?T('cl_nomic'):(e&&e.hpk?T('cl_nosend'):m)); } return false; } }

function hpCallHooks(){
  try{ if(typeof rtcOnSig==='function'&&!rtcOnSig.__call){ const f=rtcOnSig; rtcOnSig=Object.assign(async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){ o=null; } if(o&&o.v===1&&(o.type==='call'||o.type==='callans'||o.type==='callend'||o.type==='callgo'||o.type==='callring'||o.type==='callpo'||o.type==='callpa')) return hpCallOnSig(r,o); if(o&&o.v===1&&(o.type==='sbo'||o.type==='sba')&&typeof hpSlOnSig==='function') return hpSlOnSig(r,o);   return f.apply(this,arguments); },{__call:1}); } }catch(e){}
  try{ if(typeof sibOnSig==='function'&&!sibOnSig.__turn){ const f=sibOnSig; sibOnSig=Object.assign(async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){ o=null; } if(o&&o.v===1&&o.type==='turncfg'){ if(r&&ID&&r.from===ID.address&&r.fromMaster===ID.publicKey) hpTurnOnSig(r,o); return; } if(o&&o.v===1&&(o.type==='sib-offer'||o.type==='sib-answer')&&r&&ID&&r.from===ID.address&&r.fromMaster===ID.publicKey&&r.fromDev){ const dv=r.fromDev; setTimeout(()=>{ hpTurnShareTo(dv).catch(()=>{}); },1500); } return f.apply(this,arguments); },{__turn:1}); } }catch(e){}
  try{ if(typeof hpLinkOnReply==='function'&&!hpLinkOnReply.__turn){ const f=hpLinkOnReply; hpLinkOnReply=Object.assign(function(o){ const r=f.apply(this,arguments); try{ if(o&&o.ok==='claim') setTimeout(()=>{ hpTurnEnsure().then(()=>hpTurnShare()).catch(()=>{}); },1500); }catch(e){} return r; },{__turn:1}); } }catch(e){}
  try{ if(typeof hpUpCheck==='function'&&!hpUpCheck.__turn){ const f=hpUpCheck; hpUpCheck=Object.assign(async function(){ const v=await f.apply(this,arguments); try{ if(v==='ok') setTimeout(()=>{ hpTurnEnsure(true).catch(()=>{}); },45000); }catch(e){} return v; },{__turn:1}); } }catch(e){}
  try{ if(typeof openConversation==='function'&&!openConversation.__call){ const f=openConversation; openConversation=Object.assign(function(){ const r=f.apply(this,arguments); try{ setTimeout(hpCallBtn,0); }catch(e){} return r; },{__call:1}); } }catch(e){}
  try{ hpCallBtn(); }catch(e){}
  try{ if(typeof window!=='undefined'&&window.addEventListener&&!hpCallHooks.__bye){ hpCallHooks.__bye=1; window.addEventListener('beforeunload',()=>{ try{ if(HP_CALL&&HP_CALL.st!=='ended') hpCallBye('hangup'); }catch(e){} }); } }catch(e){}
}
try{ setTimeout(hpCallHooks,0); }catch(e){}

const HP_CALL_CSS2='#hp-call .btns{position:absolute;left:0;right:0;bottom:calc(40px + env(safe-area-inset-bottom,0px));justify-content:center;align-items:flex-start;margin:0;transition:opacity .3s}'
 +'#hp-call button.opt{background:#2b3a52}#hp-call button.opt.on{background:#e8eef7;color:#1b2740}#hp-call .sp{width:76px;height:76px;visibility:hidden}'
 +'#hp-call .tap{display:none;font-size:.8em;opacity:.45;position:absolute;left:0;right:0;bottom:calc(60px + env(safe-area-inset-bottom,0px))}#hp-call.dim{background:#030509}#hp-call.dim .btns,#hp-call.dim .pq{opacity:0;pointer-events:none}#hp-call.dim .tap{display:block}#hp-call.dim .who,#hp-call.dim .st{opacity:.55}'
 +'#hp-call-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:8990;background:#1b2740;color:#fff;border:1px solid #2f4466;border-radius:12px;padding:8px 10px 8px 14px;display:flex;align-items:center;gap:8px;max-width:calc(100vw - 32px);box-shadow:0 6px 24px rgba(0,0,0,.4);font-size:.92em}'
 +'#hp-call-bar .t{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}#hp-call-bar button{border:0;border-radius:18px;padding:7px 14px;font:inherit;cursor:pointer;flex:0 0 auto}#hp-call-bar .re{background:#2e9c5c;color:#fff}#hp-call-bar .vm{background:#2f6fb8;color:#fff}#hp-call-bar .x{background:transparent;color:#cfd8e6}';
function hpCallCoarse(){ try{ return !!(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches); }catch(e){ return false; } }
function hpCallGuard(d,fn){ return function(){ try{ const now=Date.now(); if(d.classList.contains('dim')||now-(d.__showAt||0)<400||now-(d.__multiAt||0)<700) return; }catch(e){} return fn.apply(this,arguments); }; }
function hpCallDimArm(d){ try{ if(d.__dimT){ clearTimeout(d.__dimT); d.__dimT=null; } const C=HP_CALL; if(!C||C.st!=='talking'||!hpCallCoarse()) { d.classList.remove('dim'); return; } d.__dimT=setTimeout(()=>{ try{ if(HP_CALL===C&&C.st==='talking') d.classList.add('dim'); }catch(e){} },5000); }catch(e){} }
function hpCallEl2(d){ try{ if(!d||d.__f170) return d; d.__f170=1;
    if(document.head&&!document.getElementById('hp-call-css2')){ const st=document.createElement('style'); st.id='hp-call-css2'; st.textContent=HP_CALL_CSS2; document.head.appendChild(st); }
    const bt=d.__end&&d.__end.parentNode; const mute=document.createElement('button'); mute.type='button'; mute.className='opt'; mute.appendChild(document.createTextNode('\u{1F507}')); const ms=document.createElement('span'); ms.textContent=T('cl_mute'); mute.appendChild(ms); d.__mute=mute; d.__muteS=ms;
    const sp=document.createElement('div'); sp.className='sp'; d.__sp=sp; if(bt){ bt.insertBefore(mute,d.__end); bt.appendChild(sp); }
    mute.onclick=hpCallGuard(d,()=>{ const C=HP_CALL; if(!C||!C.stream) return; C.muted=!C.muted; try{ C.stream.getAudioTracks().forEach(t=>{ t.enabled=!C.muted; }); }catch(e){} hpCallUi(); });
    d.__end.onclick=hpCallGuard(d,()=>hpCallHangup());
    const tap=document.createElement('div'); tap.className='tap'; tap.textContent=T('cl_tap'); d.appendChild(tap);
    const wake=(e)=>{ try{ const n=(e.touches&&e.touches.length)||1; if(n>1) d.__multiAt=Date.now();
        if(d.classList.contains('dim')){ d.classList.remove('dim'); d.__showAt=Date.now(); try{ e.preventDefault(); e.stopPropagation(); }catch(x){} } hpCallDimArm(d); }catch(x){} };
    d.addEventListener('touchstart',wake,{capture:true,passive:false}); d.addEventListener('pointerdown',(e)=>{ if(e.pointerType==='touch') return; wake(e); },{capture:true});
  }catch(e){} return d; }
try{ if(typeof hpCallEl==='function'&&!hpCallEl.__f170){ const f=hpCallEl; hpCallEl=Object.assign(function(){ return hpCallEl2(f.apply(this,arguments)); },f,{__f170:1}); } }catch(e){}

let HP_CALL_TONE='', HP_CALL_TONE_T=null;
function hpCallBeep(f,dur,vol,at,am){ try{ const C=window.AudioContext||window.webkitAudioContext; if(!C) return; if(!HP_CALL_AC) HP_CALL_AC=new C(); const a=HP_CALL_AC; try{ if(a.state==='suspended') a.resume(); }catch(e){} const t0=a.currentTime+(at||0), o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(vol,t0+0.02); g.gain.setValueAtTime(vol,t0+Math.max(0.03,dur-0.05)); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur); o.connect(g);
    if(am){ const l=a.createOscillator(), lg=a.createGain(), mg=a.createGain(); l.frequency.value=am; lg.gain.value=0.5; mg.gain.value=0.5; l.connect(lg); lg.connect(mg.gain); g.connect(mg); mg.connect(a.destination); l.start(t0); l.stop(t0+dur+0.02); } else g.connect(a.destination);
    o.start(t0); o.stop(t0+dur+0.02); }catch(e){} }
function hpCallTone(k){ try{ if(k===HP_CALL_TONE) return; HP_CALL_TONE=k; if(HP_CALL_TONE_T){ clearInterval(HP_CALL_TONE_T); HP_CALL_TONE_T=null; } if(!k||(typeof soundOn==='function'&&soundOn()==='off')) return;
    const one=k==='back'?()=>hpCallBeep(400,1.0,0.07,0,16):()=>hpCallBeep(520,0.12,0.05,0); one(); HP_CALL_TONE_T=setInterval(one,k==='back'?3000:1500); }catch(e){} }
function hpCallEndTone(){ try{ if(typeof soundOn==='function'&&soundOn()==='off') return; hpCallBeep(620,0.16,0.07,0); hpCallBeep(440,0.22,0.07,0.22); }catch(e){} }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f170){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call');
      hpCallTone(C&&C.dir==='out'&&C.st==='calling'&&C.sent?'back':C&&C.dir==='out'&&C.st==='calling'?'': (C&&C.st==='connecting')?'conn':'');
      if(C&&C.st!=='ended') hpCallBar(null);
      if(d&&d.__mute){ const on=!!(C&&(C.st==='talking'||C.st==='connecting')); d.__mute.style.display=on?'':'none'; d.__sp.style.display=on?'':'none'; d.__mute.classList.toggle('on',!!(C&&C.muted)); d.__muteS.textContent=T(C&&C.muted?'cl_unmute':'cl_mute');
        if(C&&C.st==='talking'&&C.rec) d.__st.textContent=T('cl_rec'); if(C&&C.st==='talking'){ if(!d.__dimT&&!d.classList.contains('dim')) hpCallDimArm(d); } else { d.classList.remove('dim'); if(d.__dimT){ clearTimeout(d.__dimT); d.__dimT=null; } } }
    }catch(e){} return r; },f,{__f170:1}); } }catch(e){}

let HP_CALL_BAR_T=null;
function hpCallBar(C){ try{ let b=document.getElementById('hp-call-bar'); if(HP_CALL_BAR_T){ clearTimeout(HP_CALL_BAR_T); HP_CALL_BAR_T=null; } if(!C){ if(b) b.remove(); return; } hpCallEl();
    if(!b){ b=document.createElement('div'); b.id='hp-call-bar'; b.setAttribute('role','status'); (document.body||document.documentElement).appendChild(b); } b.textContent='';
    const t=document.createElement('span'); t.className='t'; t.textContent=TF('cl_bar',{who:nickOf(C.peer),why:C.endText||T('cl_ended')}); const re=document.createElement('button'); re.type='button'; re.className='re'; re.textContent=T('btn_redial'); const x=document.createElement('button'); x.type='button'; x.className='x'; x.textContent=T('btn_cl_close'); x.setAttribute('aria-label',T('btn_cl_close'));
    re.onclick=()=>{ hpCallBar(null); if(HP_CALL&&HP_CALL.st==='ended'){ HP_CALL=null; hpCallUi(); } hpCallStart(C.peer).catch(()=>{}); }; x.onclick=()=>hpCallBar(null);
    b.appendChild(t); b.appendChild(re); b.appendChild(x); HP_CALL_BAR_T=setTimeout(()=>hpCallBar(null),60000); }catch(e){} }
function hpCallOnEnd(C){ try{ hpCallTone(''); if(C.st==='ended'&&C.why!=='decline'&&C.why!=='missed'&&C.dir) hpCallEndTone(); }catch(e){}
  try{ const w=String(C.why||''); if(C.peer&&!/^(decline|peer:taken|peer:nopq|glare)$/.test(w)&&!(typeof hpBlocked==='function'&&hpBlocked(C.peer))) setTimeout(()=>{ if(!HP_CALL||HP_CALL===C||HP_CALL.st==='ended') hpCallBar(C); },300); }catch(e){} }

async function hpCallGlare(r,o,tn){ try{ const C=HP_CALL, from=r.from; if(!C||!ID) return false;
    if(!(String(ID.address)<String(from))){ hpLog('通話：同時に呼び合った（こちらの呼び出しを残す）'); return true; }
    hpLog('通話：同時に呼び合った（相手の呼び出しに応える）'); hpCallSig(from,{v:1,type:'callend',call:C.id,why:'glare'},null).catch(()=>{}); C.byeSent=true; hpCallClose(C); C.st='ended'; C.why='glare';
    const N={id:o.call,peer:from,dir:'in',st:'ringing',pc:null,stream:null,dev:r.fromDev||null,key:hpCallHexU8(o.k),offer:o.sdp,turn:tn,turns:hpCallTurnsOf(o,tn),at:Date.now(),timer:null}; HP_CALL=N; hpCallUi();
    setTimeout(()=>{ if(HP_CALL===N&&N.st==='ringing') hpCallAccept().catch(()=>{}); },0); return true; }catch(e){ return false; } }

function hpTurnOther(){ try{ const me=String((typeof POST!=='undefined'&&POST&&POST.url)||''), now=Date.now(); for(const u of Object.keys(HP_TURN)){ if(u===me) continue; const c=HP_TURN[u]; const exp=Number(String((c&&c.user)||'').split('.')[0])*1000; if(c&&c.alive&&c.host&&c.port&&c.user&&c.pass&&exp-now>10*60e3) return Object.assign({},c,{via:u}); } }catch(e){} return null; }
async function hpTurnCredsAny(){ try{ return await hpTurnCreds(); }catch(e0){ let c=hpTurnOther();
    if(!c&&typeof hpFbVisit==='function'&&typeof hpFbUrls==='function'){ for(const u of hpFbUrls()){ if(c||(typeof HP_FB_BUSY!=='undefined'&&HP_FB_BUSY)||(typeof HP_BX_BUSY!=='undefined'&&HP_BX_BUSY)) break; HP_FB_BUSY=true; try{ await hpWithin(hpFbVisit(u,'通話の交換手'),40000,'自分のほかの郵便受けの交換手'); }catch(e){} finally{ HP_FB_BUSY=false; } c=hpTurnOther(); } }
    if(c){ hpLog('通話：自分の郵便受けの交換手が無いので、自分のほかの郵便受け（'+c.via+'）の交換手で呼ぶ'); return c; }
    try{ const me=String((typeof POST!=='undefined'&&POST&&POST.url)||''), now=Date.now(), L=Object.keys(HP_TURN).filter(u=>u!==me).map(u=>{ const x=HP_TURN[u]||{}; const m=Math.round((hpTurnExp(x)-now)/60000); return u.replace(/^wss?:\/\//,'')+'（'+(x.alive?'':'起きていない・')+(m>0?'あと '+m+' 分':'期限切れ')+(x.via==='sib'?'・自分の端末から':'')+'）'; }); hpLog('通話：代わりの交換手が無い（自分の郵便受け：'+String((e0&&e0.message)||e0).slice(0,60)+'。控え '+(L.length?L.join('、'):'なし')+'）'); }catch(e){}
    throw e0; } }

const HP_TURN_MAX=4, HP_TURN_BADMS=10*60e3, HP_TURN_PEERMS=11*3600e3;
const HP_TURN_PEER={}, HP_TURN_BAD={}, HP_TURN_OK={};
function hpTurnKey(c){ return String(c&&c.host||'')+':'+String(c&&c.port||''); }
function hpTurnExp(c){ return Number(String((c&&c.user)||'').split('.')[0])*1000||0; }
function hpTurnFresh(c){ return !!(c&&c.host&&c.port&&c.user&&c.pass&&hpTurnExp(c)-Date.now()>10*60e3); }
function hpTurnPick(list){ const out=[], seen={}, now=Date.now(); for(const c of (list||[])){ if(!c||!c.host||!c.port||!c.user||!c.pass) continue; const k=hpTurnKey(c); if(seen[k]) continue; seen[k]=1; out.push(c); }
  const ok=out.filter(c=>!(HP_TURN_BAD[hpTurnKey(c)]>now)), bad=out.filter(c=>HP_TURN_BAD[hpTurnKey(c)]>now); ok.sort((a,b)=>(HP_TURN_OK[hpTurnKey(b)]||0)-(HP_TURN_OK[hpTurnKey(a)]||0));
  const r=ok.concat(bad.length&&!ok.length?bad.slice(0,1):[]); return r.slice(0,HP_TURN_MAX); }
function hpTurnOwnAll(){ const me=String((typeof POST!=='undefined'&&POST&&POST.url)||''), out=[]; try{ for(const u of Object.keys(HP_TURN)){ const c=HP_TURN[u]; if(c&&c.alive&&hpTurnFresh(c)) out.push(c); } }catch(e){} return out; }
async function hpTurnMineQuick(){ const out=[]; try{ const c=await Promise.race([hpTurnCreds(),new Promise((_,rj)=>setTimeout(()=>rj(new Error('t')),4000))]); if(c) out.push(c); }catch(e){} return out.concat(hpTurnOwnAll()); }
function hpTurnPeerOf(peer){ const L=HP_TURN_PEER[String(peer||'')]; if(!L||Date.now()-L.at>HP_TURN_PEERMS) return []; return L.list.filter(hpTurnFresh); }
function hpTurnPeerSet(peer,ts){ try{ if(!peer||!Array.isArray(ts)) return 0; const list=ts.slice(0,HP_TURN_MAX).map(hpCallTurnOf).filter(c=>c&&hpTurnFresh(c)); if(!list.length) return 0; HP_TURN_PEER[String(peer)]={at:Date.now(),list:list}; try{ if(typeof hpTurnPeerSave==='function') hpTurnPeerSave(); }catch(e){} return list.length; }catch(e){ return 0; } }
function hpTurnWire(list){ return (list||[]).slice(0,HP_TURN_MAX).map(c=>({h:c.host,p:c.port,u:c.user,k:c.pass})); }
function hpCallTurnsOf(o,tn){ const L=[]; try{ if(Array.isArray(o&&o.ts)) for(const t of o.ts.slice(0,HP_TURN_MAX)){ const c=hpCallTurnOf(t); if(c) L.push(c); } }catch(e){} if(tn&&!L.some(c=>hpTurnKey(c)===hpTurnKey(tn))) L.unshift(tn); return L; }
function hpCallIceN(list){ return {iceServers:(list||[]).map(c=>({urls:'turn:'+c.host+':'+c.port+'?transport=udp',username:c.user,credential:c.pass})),iceTransportPolicy:'relay',encodedInsertableStreams:true}; }
async function hpCallGatherN(pc,n){ if(!(n>1)) return hpCallGather(pc); if(pc.iceGatheringState==='complete') return; await new Promise(res=>{ let done=false, t2=null; const fin=()=>{ if(done) return; done=true; clearTimeout(t1); if(t2) clearTimeout(t2); res(); }; const t1=setTimeout(fin,HP_CALL_GATHER);
    const f=()=>{ if(pc.iceGatheringState==='complete') fin(); }; const g=(e)=>{ try{ if(e&&e.candidate&&/ typ relay/.test(e.candidate.candidate||'')&&!t2) t2=setTimeout(fin,2000); }catch(x){} }; try{ pc.addEventListener('icegatheringstatechange',f); pc.addEventListener('icecandidate',g); }catch(e){ fin(); } }); }
async function hpTurnHealth(C){ try{ if(!C||!C.pc||!C.turns||C.turns.length<2) return; if(C.pc.iceGatheringState!=='complete'){ await new Promise(res=>{ const t=setTimeout(res,30000); try{ C.pc.addEventListener('icegatheringstatechange',()=>{ if(C.pc.iceGatheringState==='complete'){ clearTimeout(t); res(); } }); }catch(e){ clearTimeout(t); res(); } }); if(!C.pc||C.pc.iceGatheringState!=='complete') return; } const st=await C.pc.getStats(), got={}; st.forEach(r=>{ if(r.type==='local-candidate'&&r.candidateType==='relay'&&r.url){ const m=/^turns?:([^:?]+):(\d+)/.exec(String(r.url)); if(m) got[m[1].toLowerCase()+':'+m[2]]=1; } });
    if(!Object.keys(got).length) return; const miss=C.turns.filter(c=>!got[hpTurnKey(c)]); for(const c of miss) HP_TURN_BAD[hpTurnKey(c)]=Date.now()+HP_TURN_BADMS; if(miss.length) hpLog('通話：交換手 '+miss.map(hpTurnKey).join('・')+' は候補をくれなかった（10 分使わない）'); }catch(e){} }
async function hpTurnGood(C){ try{ const st=await C.pc.getStats(); let pair=null; const by={}; st.forEach(r=>{ by[r.id]=r; }); st.forEach(r=>{ if(r.type==='transport'&&r.selectedCandidatePairId) pair=by[r.selectedCandidatePairId]; }); if(!pair) st.forEach(r=>{ if(r.type==='candidate-pair'&&r.nominated&&r.state==='succeeded') pair=r; }); const l=pair&&by[pair.localCandidateId];
    const m=l&&/^turns?:([^:?]+):(\d+)/.exec(String(l.url||'')); if(m){ const k=m[1].toLowerCase()+':'+m[2]; HP_TURN_OK[k]=Date.now(); delete HP_TURN_BAD[k]; if(C.turns&&C.turns.length>1) hpLog('通話：交換手 '+k+' でつながった'); } }catch(e){} }

let HP_CALL_AU_OK=false;
function hpCallAudioArm(){ try{ const C=window.AudioContext||window.webkitAudioContext; if(!C) return; if(!HP_CALL_AC) HP_CALL_AC=new C(); const a=HP_CALL_AC; const p=a.resume?a.resume():null; const b=a.createBuffer(1,1,22050), s=a.createBufferSource(); s.buffer=b; s.connect(a.destination); s.start(0); if(p&&p.then) p.then(()=>{ HP_CALL_AU_OK=a.state==='running'; try{ hpCallUi(); }catch(e){} }).catch(()=>{}); else HP_CALL_AU_OK=a.state==='running'; }catch(e){} }
try{ if(typeof document!=='undefined'&&document.addEventListener){ const arm=()=>{ if(!(HP_CALL_AC&&HP_CALL_AC.state==='running')) hpCallAudioArm(); }; document.addEventListener('touchend',arm,{capture:true,passive:true}); document.addEventListener('click',arm,{capture:true,passive:true}); document.addEventListener('keydown',arm,{capture:true,passive:true});
  document.addEventListener('visibilitychange',()=>{ try{ if(document.visibilityState==='visible'&&HP_CALL_AC&&HP_CALL_AC.state!=='running'){ HP_CALL_AU_OK=false; HP_CALL_AC.resume().then(()=>{ HP_CALL_AU_OK=HP_CALL_AC.state==='running'; }).catch(()=>{}); } }catch(e){} }); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f173){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(!d) return r; let w=d.__auw; if(!w){ w=document.createElement('div'); w.className='pq aw'; w.style.color='#f5b85c'; d.__auw=w; try{ d.insertBefore(w,d.querySelector('.btns')); }catch(e){ d.appendChild(w); } }
      const mute=!!(C&&C.st==='ringing'&&!(HP_CALL_AC&&HP_CALL_AC.state==='running')&&!(typeof soundOn==='function'&&soundOn()==='off')); w.textContent=mute?T('cl_tapsound'):''; w.style.display=mute?'':'none'; d.style.animation=mute?'hpCallBlink 1.6s ease-in-out infinite':''; if(mute&&!document.getElementById('hp-call-blink')){ const st=document.createElement('style'); st.id='hp-call-blink'; st.textContent='@keyframes hpCallBlink{0%,100%{background:#121820}50%{background:#28463c}}'; document.head.appendChild(st); } }catch(e){} return r; },f,{__f173:1}); } }catch(e){}
try{ if(typeof hpCallRing==='function'&&!hpCallRing.__f173){ const f=hpCallRing; hpCallRing=Object.assign(function(on){ const r=f.apply(this,arguments); try{ if(on&&HP_CALL_AC&&HP_CALL_AC.state!=='running'){ const t=setInterval(()=>{ try{ if(!HP_CALL||HP_CALL.st!=='ringing'){ clearInterval(t); return; } if(HP_CALL_AC.state==='running'){ clearInterval(t); f.call(null,false); f.call(null,true); } }catch(e){ clearInterval(t); } },500); } }catch(e){} return r; },f,{__f173:1}); } }catch(e){}
try{ const n=hpTurnCredLoad(); if(n) hpLog('通話の中継：控えていた自分のほかの郵便受けの交換手（'+n+' 件）を読み戻した'); }catch(e){}

try{ if(typeof document!=='undefined'&&document.head&&!document.getElementById('hp-call-css3')){ const st=document.createElement('style'); st.id='hp-call-css3'; st.textContent='#hp-call>.pq:not(.aw){display:none}'; document.head.appendChild(st); } }catch(e){}

const HP_CALL_CSS4='#hp-call .stp{display:flex;gap:6px;align-items:center;font-size:.85em;opacity:.95}#hp-call .stp i{font-style:normal;padding:3px 10px;border-radius:12px;background:rgba(255,255,255,.08);color:#9fb0c8}#hp-call .stp i.on{background:#2e9c5c;color:#fff}#hp-call .stp i.dn{color:#cfe8d8}#hp-call .stp b{opacity:.5;font-weight:400}#hp-call .wt{font-size:.85em;opacity:.7;font-variant-numeric:tabular-nums;min-height:1.2em}';
function hpCallStage(C){ if(!C) return -1; if(C.dir==='out'&&C.st==='calling') return !C.gathered?0:!C.sent?1:2; if(C.dir==='out'&&C.st==='connecting') return 3; return -1; }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f176){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(!d) return r;
      if(document.head&&!document.getElementById('hp-call-css4')){ const st=document.createElement('style'); st.id='hp-call-css4'; st.textContent=HP_CALL_CSS4; document.head.appendChild(st); }
      if(!d.__stp){ const sp=document.createElement('div'); sp.className='stp'; const wt=document.createElement('div'); wt.className='wt'; d.__stp=sp; d.__wt=wt; if(d.__st&&d.__st.parentNode===d){ d.insertBefore(wt,d.__st.nextSibling); d.insertBefore(sp,d.__st.nextSibling); } else { d.appendChild(sp); d.appendChild(wt); } }
      const wait=!!(C&&(C.st==='calling'||C.st==='connecting')), k=hpCallStage(C);
      if(C&&C.dir==='out'&&C.st==='calling') d.__st.textContent=!C.gathered?T('cl_ito_tie'):!C.sent?T('cl_ito_run'):TF('cl_ito_ring',{who:nickOf(C.peer)}); else if(C&&C.dir==='out'&&C.st==='connecting') d.__st.textContent=TF('cl_ito_pull',{who:nickOf(C.peer)}); else if(C&&C.dir==='in'&&C.st==='connecting') d.__st.textContent=T('cl_ito_pick');
      d.__stp.style.display=k>=0?'':'none'; if(k>=0){ const L=['cl_step_tie','cl_step_run','cl_step_ring','cl_step_pull'], kk=C.dir+k; if(d.__stp.__k!==kk){ d.__stp.textContent=''; L.forEach((x,i)=>{ if(i){ const b=document.createElement('b'); b.textContent='›'; d.__stp.appendChild(b); } const e=document.createElement('i'); e.textContent=T(x); if(i===k) e.className='on'; else if(i<k) e.className='dn'; d.__stp.appendChild(e); }); d.__stp.__k=kk; } }
      const t0=C?(C.dir==='out'?C.at:(C.accAt||0)):0; d.__wt.style.display=wait&&t0?'':'none'; if(wait&&t0) d.__wt.textContent=TF('cl_wait',{n:Math.max(0,Math.floor((Date.now()-t0)/1000))});
      if(wait&&!C.wt) C.wt=setInterval(()=>{ try{ if(HP_CALL!==C||!(C.st==='calling'||C.st==='connecting')){ clearInterval(C.wt); C.wt=null; return; } hpCallUi(); }catch(e){} },1000);
    }catch(e){} return r; },f,{__f176:1}); } }catch(e){}

const HP_TURN_PKEY='p2p_turnp';
function hpTurnPeerSave(){ try{ const o={}, now=Date.now(); for(const a of Object.keys(HP_TURN_PEER).slice(-20)){ const L=HP_TURN_PEER[a]; if(!L||now-L.at>HP_TURN_PEERMS) continue; const w=hpTurnWire((L.list||[]).filter(hpTurnFresh)); if(w.length) o[a]={at:L.at,ts:w}; } localStorage.setItem(HP_TURN_PKEY,JSON.stringify(o)); }catch(e){} }
function hpTurnPeerLoad(){ try{ const o=JSON.parse(localStorage.getItem(HP_TURN_PKEY)||'{}'), now=Date.now(); let n=0; for(const a of Object.keys(o||{}).slice(0,20)){ const x=o[a]; if(!x||!(now-Number(x.at)<HP_TURN_PEERMS)||HP_TURN_PEER[a]) continue; const list=(Array.isArray(x.ts)?x.ts:[]).slice(0,HP_TURN_MAX).map(hpCallTurnOf).filter(c=>c&&hpTurnFresh(c)); if(list.length){ HP_TURN_PEER[a]={at:Number(x.at),list:list}; n++; } } return n; }catch(e){ return 0; } }
try{ const n=hpTurnPeerLoad(); if(n) hpLog('通話の中継：控えていた友達の交換手（'+n+' 人分）を読み戻した'); }catch(e){}
let HP_CALL_EAR=null, HP_CALL_AS=false;
function hpCallAsOk(){ try{ return !!(navigator.audioSession&&'type' in navigator.audioSession); }catch(e){ return false; } }
async function hpCallEarFind(){ try{ if(HP_CALL_EAR!==null||hpCallAsOk()) return HP_CALL_EAR; if(!(typeof HTMLMediaElement!=='undefined'&&HTMLMediaElement.prototype&&typeof HTMLMediaElement.prototype.setSinkId==='function')||!navigator.mediaDevices||!navigator.mediaDevices.enumerateDevices){ HP_CALL_EAR=''; return ''; }
    const L=await navigator.mediaDevices.enumerateDevices(); const d=L.find(x=>x.kind==='audiooutput'&&/earpiece|handset|receiver|受話/i.test(String(x.label||''))); HP_CALL_EAR=d?d.deviceId:''; if(HP_CALL_EAR) hpLog('通話：受話口を選べる（'+String(d.label||'').slice(0,40)+'）'); return HP_CALL_EAR; }catch(e){ HP_CALL_EAR=''; return ''; } }
const HP_CALL_EAR_ON=false;
function hpCallSpkCan(){ return HP_CALL_EAR_ON&&(hpCallAsOk()||!!HP_CALL_EAR); }
function hpCallRoute(C){ try{ if(!C||!HP_CALL_EAR_ON) return; const live=(C.dir==='out'&&C.st!=='ended')||(C.dir==='in'&&(C.st==='connecting'||C.st==='talking')); const k=live?(C.spk?'spk':'ear'):'off'; if(C.routeK===k) return; C.routeK=k;
    if(hpCallAsOk()){ hpCallRouteIos(C,k); return; }
    const au=document.getElementById('hp-call-audio'); if(HP_CALL_EAR&&au&&au.setSinkId) au.setSinkId(k==='ear'?HP_CALL_EAR:'').catch(e=>{ hpLog('通話：出力先を選べない（'+((e&&e.message)||e)+'）'); }); }catch(e){} }
function hpCallRouteOff(){ try{ hpCallWaOff(); if(HP_CALL_AS&&hpCallAsOk()){ navigator.audioSession.type='auto'; HP_CALL_AS=false; } }catch(e){} }

let HP_CALL_WA=null;
function hpCallWaOff(){ try{ if(HP_CALL_WA){ try{ HP_CALL_WA.src.disconnect(); }catch(e){} HP_CALL_WA=null; } const au=document.getElementById('hp-call-audio'); if(au&&au.muted){ au.muted=false; const p=au.play(); if(p&&p.catch) p.catch(()=>{}); } }catch(e){} }
function hpCallRouteIos(C,k){ try{
    if(k!=='ear'){ hpCallWaOff(); if(navigator.audioSession.type!=='auto'){ navigator.audioSession.type='auto'; } HP_CALL_AS=false; if(k==='spk') hpLog('通話：スピーカー（audio 要素・auto）'); return; }
    navigator.audioSession.type='auto'; HP_CALL_AS=true;
    setTimeout(()=>{ try{ if(HP_CALL!==C||C.routeK!=='ear') return; navigator.audioSession.type='play-and-record';
        const A=window.AudioContext||window.webkitAudioContext; if(!HP_CALL_AC&&A) HP_CALL_AC=new A(); const ac=HP_CALL_AC;
        if(ac&&C.remote&&!HP_CALL_WA){ const src=ac.createMediaStreamSource(C.remote); src.connect(ac.destination); HP_CALL_WA={src:src}; const au=document.getElementById('hp-call-audio'); if(au) au.muted=true; try{ if(ac.state!=='running') ac.resume().catch(()=>{}); }catch(e){} }
        hpLog('通話：受話口を試す（AudioContext '+(ac?ac.state:'無し')+'・相手の音 '+(C.remote?'あり':'まだ無い')+'・type '+navigator.audioSession.type+'）'); }catch(e){ hpLog('通話：受話口にできない（'+((e&&e.message)||e)+'）'); hpCallWaOff(); } },150);
  }catch(e){} }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f176b){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call');
      if(!C||C.st==='ended') hpCallRouteOff(); else { if(HP_CALL_EAR_ON&&C.spk===undefined&&hpCallAsOk()) C.spk=true;   hpCallRoute(C); if(HP_CALL_EAR_ON&&C.stream&&HP_CALL_EAR===null&&!C.earQ){ C.earQ=1; hpCallEarFind().then(()=>{ try{ if(HP_CALL===C){ C.routeK=''; hpCallUi(); } }catch(e){} }); } }
      if(d&&d.__mute){ if(!d.__spk){ const b=document.createElement('button'); b.type='button'; b.className='opt'; b.appendChild(document.createTextNode('\u{1F50A}')); const sp=document.createElement('span'); sp.textContent=T('cl_spk'); b.appendChild(sp); d.__spk=b; if(d.__sp&&d.__sp.parentNode) d.__sp.parentNode.insertBefore(b,d.__sp); else d.__mute.parentNode.appendChild(b);
          b.onclick=(typeof hpCallGuard==='function'?hpCallGuard(d,()=>{ const C2=HP_CALL; if(!C2) return; C2.spk=!C2.spk; hpLog('通話：'+(C2.spk?'スピーカー':'受話口')+'にした'); hpCallUi(); }):null); }
        const on=!!(C&&hpCallSpkCan()&&(C.st==='talking'||C.st==='connecting')); d.__spk.style.display=on?'':'none'; if(on&&d.__sp) d.__sp.style.display='none'; d.__spk.classList.toggle('on',!!(C&&C.spk)); }
    }catch(e){} return r; },f,{__f176b:1}); } }catch(e){}

function hpCallAudioSender(C){ try{ const t=C.pc.getTransceivers().find(t=>t.receiver&&t.receiver.track&&t.receiver.track.kind==='audio'); if(t) return t.sender; }catch(e){} try{ return C.pc.getSenders().find(s=>s.track&&s.track.kind==='audio')||null; }catch(e){ return null; } }
function hpCallTrkWatch(C){ try{ if(!C||!C.stream) return; for(const t of C.stream.getAudioTracks()){ if(t.__hpW) continue; t.__hpW=1;
      t.addEventListener('mute',()=>{ try{ if(HP_CALL===C) hpLog('通話：マイクが止められた（画面 '+(document.visibilityState||'?')+'）'); }catch(e){} });
      t.addEventListener('unmute',()=>{ try{ if(HP_CALL===C) hpLog('通話：マイクが戻った'); }catch(e){} });
      t.addEventListener('ended',()=>{ try{ if(HP_CALL===C&&C.st!=='ended'){ hpLog('通話：マイクが切れた（取り直す）'); hpCallMicRedo(C).catch(()=>{}); } }catch(e){} }); } }catch(e){} }
async function hpCallMicRedo(C){ if(!C||C.micBusy||!C.pc||C.st==='ended') return false; C.micBusy=true; try{
    const ns=await hpCallMic(); if(HP_CALL!==C||C.st==='ended'){ ns.getTracks().forEach(t=>t.stop()); return false; } const nt=ns.getAudioTracks()[0], snd=hpCallAudioSender(C); if(!nt||!snd) throw new Error('送り手が無い');
    nt.enabled=!C.muted; await snd.replaceTrack(nt); const old=C.stream; C.stream=ns; try{ if(old) old.getTracks().forEach(t=>{ try{ t.stop(); }catch(e){} }); }catch(e){} hpCallTrkWatch(C); hpCallCryptoOn(C); hpLog('通話：マイクを取り直した'); hpCallUi(); return true;
  }catch(e){ hpLog('通話：マイクを取り直せない（'+((e&&e.message)||e)+'）'); return false; } finally{ C.micBusy=false; } }
function hpCallWake(){ try{ const C=HP_CALL; if(!C||!(C.st==='talking'||C.st==='connecting')) return; const au=document.getElementById('hp-call-audio'); const was=au?(au.paused?'止まっていた':'鳴っていた'):'無い';
    if(au){ try{ const p=au.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} } try{ if(HP_CALL_AC&&HP_CALL_AC.state!=='running') HP_CALL_AC.resume().catch(()=>{}); }catch(e){}
    const t=C.stream&&C.stream.getAudioTracks()[0]; hpLog('通話：画面が戻った（マイク '+(t?(t.readyState==='ended'?'切れている':t.muted?'止められている':'動いている'):'無い')+'・受ける音 '+was+'）');
    setTimeout(()=>{ try{ if(HP_CALL!==C||C.st==='ended') return; const t2=C.stream&&C.stream.getAudioTracks()[0]; if(!t2||t2.readyState==='ended'||t2.muted) hpCallMicRedo(C).catch(()=>{}); }catch(e){} },1200); }catch(e){} }
async function hpCallFlow(C){ try{ if(HP_CALL!==C||C.st!=='talking'||!C.pc) return; const st=await C.pc.getStats(); let tx=0, rx=0; st.forEach(r=>{ if(r.kind==='audio'||r.mediaType==='audio'){ if(r.type==='outbound-rtp') tx+=Number(r.bytesSent)||0; if(r.type==='inbound-rtp') rx+=Number(r.bytesReceived)||0; } });
    const p=C.flow||{tx:0,rx:0}; C.flow={tx:tx,rx:rx}; const dtx=tx-p.tx, drx=rx-p.rx; hpLog('通話：音 送った '+Math.round(tx/1024)+' KB・受けた '+Math.round(rx/1024)+' KB（この 20 秒 +'+Math.round(dtx/1024)+' / +'+Math.round(drx/1024)+' KB）'+(p.rx&&drx<512?'・相手の音が届いていない':'')+(p.tx&&dtx<512&&!C.muted?'・自分の音が出ていない':'')); }catch(e){} }
try{ if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('visibilitychange',()=>{ try{ if(document.visibilityState==='visible') hpCallWake(); else { const C=HP_CALL; if(C&&(C.st==='talking'||C.st==='connecting')) hpLog('通話：画面が裏に回った（話している途中）'); } }catch(e){} }); }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f177b){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL; if(C&&C.stream) hpCallTrkWatch(C);
      if(C&&C.st==='talking'&&!C.flowT){ C.flowT=setInterval(()=>{ if(HP_CALL!==C||C.st!=='talking'){ clearInterval(C.flowT); return; } hpCallFlow(C); },20000); }
    }catch(e){} return r; },f,{__f177b:1}); } }catch(e){}

const HP_ITO_CSS='#hp-call .ito{width:min(320px,86vw);height:auto}#hp-call .ito svg{width:100%;height:auto;display:block}#hp-call .ito .bl{animation:hpItoBell .5s ease-in-out infinite alternate;transform-origin:center top;transform-box:fill-box}#hp-call .ito .bob{animation:hpItoBob .5s ease-in-out infinite alternate}@keyframes hpItoBell{from{transform:rotate(-18deg)}to{transform:rotate(18deg)}}@keyframes hpItoBob{from{transform:translateY(0)}to{transform:translateY(-1.5px)}}';
function hpItoKind(C){ if(!C) return ''; if(C.st==='ringing') return 'bell'; if(C.dir==='out'&&C.st==='calling') return !C.gathered?'tie':!C.sent?'run':'ring'; if(C.st==='connecting') return 'pull'; if(C.st==='talking') return C.rec?'slack':'talk'; return ''; }
function hpItoSvg(k){ const H=(x)=>'<use href="#hp-house" x="'+x+'" y="34" width="56" height="42"/>', cup=(x,f)=>'<path d="M'+x+' 56 l'+(f?-6:6)+' 0 l'+(f?-1.5:1.5)+' 9 l'+(f?4.5:-4.5)+' 0z" fill="#e8eef7" stroke="#9fb0c8" stroke-width=".8"/>', rb=(x,cls)=>'<g class="'+(cls||'bob')+'"><use href="#hp-rb-a" x="'+x+'" y="48" width="24" height="26"/></g>';
  const L0=70, R0=182, Y=60, gnd='<line x1="0" y1="76.5" x2="260" y2="76.5" stroke="#3a4a63" stroke-width="1"/>', base=gnd+H(4)+H(200)+cup(L0,0);
  const sag=(d)=>'<path d="M'+(L0+3)+' '+Y+' Q 126 '+(Y+d)+' '+(R0-3)+' '+Y+'" fill="none" stroke="#cfd8e6" stroke-width="1"/>', bell=(x)=>'<g class="bl"><text x="'+x+'" y="30" font-size="14" text-anchor="middle">\u{1F514}</text></g>';
  let b='';
  if(k==='tie') b=base+rb(L0+4)+'<path d="M'+(L0+3)+' '+Y+' q 6 4 10 0" fill="none" stroke="#cfd8e6" stroke-width="1"/>';
  else if(k==='run') b=base+'<line x1="'+(L0+3)+'" y1="'+Y+'" x2="'+(L0+3)+'" y2="'+Y+'" stroke="#cfd8e6" stroke-width="1"><animate attributeName="x2" values="'+(L0+3)+';'+(R0-8)+'" dur="2.4s" repeatCount="indefinite"/></line><g><animateTransform attributeName="transform" type="translate" values="0 0;'+(R0-L0-14)+' 0" dur="2.4s" repeatCount="indefinite"/>'+rb(L0+2)+'</g>';
  else if(k==='ring') b=base+sag(10)+cup(R0,1)+rb(R0-30,'bob')+bell(228);
  else if(k==='bell') b=gnd+H(4)+H(200)+cup(R0,1)+bell(32);
  else if(k==='pull') b=base+cup(R0,1)+'<path d="M'+(L0+3)+' '+Y+' Q 126 '+(Y+12)+' '+(R0-3)+' '+Y+'" fill="none" stroke="#cfd8e6" stroke-width="1"><animate attributeName="d" values="M'+(L0+3)+' '+Y+' Q 126 '+(Y+12)+' '+(R0-3)+' '+Y+';M'+(L0+3)+' '+Y+' Q 126 '+Y+' '+(R0-3)+' '+Y+'" dur="1.6s" repeatCount="indefinite"/></path>'+rb(118);
  else if(k==='talk') b=base+cup(R0,1)+'<line x1="'+(L0+3)+'" y1="'+Y+'" x2="'+(R0-3)+'" y2="'+Y+'" stroke="#2e9c5c" stroke-width="1.4"/><text font-size="9" fill="#9be3c0" y="'+(Y-3)+'">♪<animate attributeName="x" values="'+(L0+6)+';'+(R0-12)+';'+(L0+6)+'" dur="3s" repeatCount="indefinite"/></text>';
  else if(k==='slack') b=base+cup(R0,1)+sag(14)+rb(118);
  return b?'<svg viewBox="0 0 260 80" aria-hidden="true">'+b+'</svg>':''; }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f180){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(!d) return r;
      if(document.head&&!document.getElementById('hp-call-css5')){ const st=document.createElement('style'); st.id='hp-call-css5'; st.textContent=HP_ITO_CSS; document.head.appendChild(st); }
      if(!d.__ito){ const w=document.createElement('div'); w.className='ito'; d.__ito=w; if(d.__st&&d.__st.parentNode===d) d.insertBefore(w,d.__st); else d.appendChild(w); }
      const k=(typeof hpBotOn==='function'&&hpBotOn())?hpItoKind(C):'';   if(d.__ito.__k!==k){ d.__ito.__k=k; d.__ito.innerHTML=k?hpItoSvg(k):''; } d.__ito.style.display=k?'':'none';
      if(C&&C.st==='talking'&&C.rec) d.__st.textContent=T('cl_ito_slack');

    }catch(e){} return r; },f,{__f180:1}); } }catch(e){}

const HP_SL={}, HP_SL_LAST={}, HP_SL_MAX=8, HP_SL_PER=4, HP_SL_WAIT=45000, HP_SL_GAP=10*60e3, HP_SL_KEY='p2p_sbpeers', HP_CALL_SEEN=new Map();
function hpSlNick(p){ try{ return nickOf(p); }catch(e){ return String(p||'').slice(0,8); } }
function hpSlK(peer,dev){ return String(peer)+'|'+String(dev||''); }
function hpSlOf(peer){ return Object.keys(HP_SL).filter(k=>HP_SL[k]&&HP_SL[k].peer===peer).map(k=>HP_SL[k]); }
function hpSlHas(peer){ return hpSlOf(peer).length>0; }
function hpSlRecent(add){ try{ const o=JSON.parse(localStorage.getItem(HP_SL_KEY)||'{}')||{}, now=Date.now(); if(add){ o[add]=now; } for(const k of Object.keys(o)){ if(!(now-Number(o[k])<7*864e5)) delete o[k]; } if(add) localStorage.setItem(HP_SL_KEY,JSON.stringify(o)); return Object.keys(o).sort((a,b)=>o[b]-o[a]); }catch(e){ return []; } }
function hpSlIsOpen(s){ return !!(s&&s.st==='open'&&s.dc&&s.dc.readyState==='open'); }
function hpSlOpen(peer){ return hpSlOf(peer).some(hpSlIsOpen); }
function hpSlSend(peer,body,devs){
  const got=[]; try{ const want=Array.isArray(devs)&&devs.length?devs:null; for(const s of hpSlOf(peer)){ if(!hpSlIsOpen(s)||!s.dev||(want&&want.indexOf(s.dev)<0)) continue; try{ s.dc.send(JSON.stringify({t:'sig',o:body})); s.sent=(s.sent||0)+1; got.push(s.dev); }catch(e){} }
    if(got.length) hpLog('通話：糸で合図を送った（'+String(body&&body.type)+'・'+hpSlNick(peer)+'・端末 '+got.length+' 台）'); }catch(e){} return got; }
function hpSlDrop(s,why){ if(!s) return; const k=hpSlK(s.peer,s.key); if(HP_SL[k]!==s) return; delete HP_SL[k]; try{ if(s.timer) clearTimeout(s.timer); }catch(e){} try{ if(s.dc) s.dc.close(); }catch(e){} try{ s.pc.close(); }catch(e){} if(why) hpLog('通話：'+hpSlNick(s.peer)+' との待機の糸を畳んだ（'+why+'・端末 '+String(s.dev||'').slice(0,10)+'…）'); }
function hpSlCan(peer){ try{ return !!(ID&&peer&&hpCallCan()&&typeof hpCardOf==='function'&&hpCardOf(peer)&&!(typeof hpBlocked==='function'&&hpBlocked(peer))&&typeof RTCPeerConnection==='function'); }catch(e){ return false; } }
function hpSlNew(peer,dev,role,id,turns){ const s={peer:peer,key:dev,role:role,id:id,pc:new RTCPeerConnection(hpCallIceN(turns)),dc:null,st:'connecting',at:Date.now(),dev:dev,ans:false,timer:null}; HP_SL[hpSlK(peer,dev)]=s;
  s.pc.onconnectionstatechange=()=>{ try{ if(HP_SL[hpSlK(peer,dev)]!==s) return; const c=s.pc.connectionState; if(c==='failed'||c==='closed'){ hpSlDrop(s,c==='failed'?'線が失敗':'閉じた'); hpSlLater(peer); } }catch(e){} };
  s.timer=setTimeout(()=>{ s.timer=null; if(HP_SL[hpSlK(peer,dev)]===s&&s.st!=='open'){ hpSlDrop(s,s.role==='call'&&!s.ans?'応答なし（開いていないらしい）':'つながらなかった'); } },HP_SL_WAIT); return s; }
function hpSlWire(s,dc){ const peer=s.peer, k=hpSlK(peer,s.key); s.dc=dc;
  dc.onopen=()=>{ if(HP_SL[k]!==s) return; s.st='open'; s.openAt=Date.now(); if(s.timer){ clearTimeout(s.timer); s.timer=null; } hpLog('通話：'+hpSlNick(peer)+' と待機の糸がつながった（'+((s.openAt-s.at)/1000).toFixed(1)+' 秒・相手の端末 '+String(s.dev||'').slice(0,10)+'…）'); hpSlRecent(peer); };
  dc.onmessage=(e)=>{ try{ if(HP_SL[k]!==s) return; const m=JSON.parse(String(e.data)); if(!m||m.t!=='sig'||!m.o||m.o.v!==1) return; const c=contacts().find(x=>x.address===peer); if(!c) return;
      if(m.o.type==='call'&&typeof m.o.call==='string') HP_CALL_SEEN.set(m.o.call,Date.now()); hpCallOnSig({from:peer,fromMaster:c.pubKey,fromDev:s.dev,sentAt:Date.now(),body:''},m.o).catch(()=>{}); }catch(x){} };
  dc.onclose=()=>{ if(HP_SL[k]===s){ hpSlDrop(s,'糸が切れた'); hpSlLater(peer); } }; }
function hpSlLater(peer){ try{ const want=(typeof CURPEER!=='undefined'&&CURPEER===peer)||hpSlRecent().slice(0,3).indexOf(peer)>=0; if(!want) return; setTimeout(()=>{ try{ if(typeof document==='undefined'||document.visibilityState!=='hidden') hpSlStart(peer,true).catch(()=>{}); }catch(e){} },30000); }catch(e){} }
function hpSlDevs(peer){ try{ const c=hpCardOf(peer); return (c&&Array.isArray(c.devices)?c.devices:[]).map(d=>typeof d==='string'?d:(d&&(d.dev||d.id||d.pub))).filter(d=>typeof d==='string'&&d).slice(0,HP_SL_PER); }catch(e){ return []; } }
async function hpSlStart(peer,force){
  if(!hpSlCan(peer)) return false; const now=Date.now(); if(!force&&now-(HP_SL_LAST[peer]||0)<HP_SL_GAP) return false;
  const devs=hpSlDevs(peer).filter(d=>!HP_SL[hpSlK(peer,d)]); if(!devs.length) return false; HP_SL_LAST[peer]=now;
  let cr=null; try{ cr=await hpTurnCredsAny(); }catch(e){ cr=null; } const turns=hpTurnPick([cr].filter(Boolean).concat(hpTurnOwnAll(),hpTurnPeerOf(peer))); if(!turns.length) return false;
  const one=async(dev)=>{ if(HP_SL[hpSlK(peer,dev)]||Object.keys(HP_SL).length>=HP_SL_MAX) return false; const s=hpSlNew(peer,dev,'call',hpHex(crypto.getRandomValues(new Uint8Array(8))),turns);
    try{ hpSlWire(s,s.pc.createDataChannel('hp-sb')); await s.pc.setLocalDescription(await s.pc.createOffer()); await hpCallGatherN(s.pc,turns.length); if(HP_SL[hpSlK(peer,dev)]!==s) return false;
      const sdp=s.pc.localDescription.sdp, fp=extractFingerprint(sdp); if(!fp||!hpCallHasRelay(sdp)) throw new Error('候補が無い');
      await hpCallSigPost(peer,{v:1,type:'sbo',sb:s.id,sdp:sdp,fp:fp,ts:hpTurnWire(turns)},[dev]); if(HP_SL[hpSlK(peer,dev)]!==s) return false; s.at=Date.now(); return true;
    }catch(e){ hpLog('通話：待機の糸を張れない（'+((e&&e.message)||e)+'）'); hpSlDrop(s); return false; } };
  const r=await Promise.all(devs.map(one)); const n=r.filter(Boolean).length; if(n) hpLog('通話：'+hpSlNick(peer)+' に待機の糸を張りに行った（端末 '+n+' 台・交換手 '+turns.map(x=>x.host+':'+x.port).join('・')+'）'); return n>0; }
async function hpSlOnSig(r,o){ try{
    if(!ID||!r||typeof o.sb!=='string'||!/^[0-9a-f]{16}$/.test(o.sb)||typeof o.sdp!=='string'||typeof o.fp!=='string'||extractFingerprint(o.sdp)!==o.fp) return;
    const from=r.from, dev=r.fromDev||''; if(from===ID.address||!isContact(from)||!dev) return; const c=contacts().find(x=>x.address===from); if(c&&c.pubKey&&c.pubKey!==r.fromMaster) return;
    const age=Date.now()-Number(r.sentAt); if(!(Math.abs(age)<=60000)){ hpLog('通話：古い待機の糸の合図（'+Math.round(age/1000)+' 秒前。捨てた）'); return; } if(!hpSlCan(from)) return;
    const k=hpSlK(from,dev);
    if(o.type==='sba'){ const s=HP_SL[k]; if(!s||s.role!=='call'||s.id!==o.sb||s.ans||s.st!=='connecting') return; s.ans=true; try{ hpTurnPeerSet(from,o.ts); }catch(e){} await s.pc.setRemoteDescription({type:'answer',sdp:o.sdp}); return; }
    const s0=HP_SL[k]; if(s0&&s0.role==='call'&&s0.st==='connecting'&&String(ID.address)<String(from)){ hpLog('通話：待機の糸を同時に張りに来た（こちらを残す）'); return; } if(s0) hpSlDrop(s0,'新しい糸に替える');
    if(Object.keys(HP_SL).length>=HP_SL_MAX) return;
    let mine=[]; try{ mine=hpTurnOwnAll(); }catch(e){ mine=[]; } const theirs=hpCallTurnsOf(o,null); const turns=hpTurnPick(theirs.concat(mine)); if(!turns.length) return; try{ hpTurnPeerSet(from,o.ts); }catch(e){}
    const s=hpSlNew(from,dev,'answer',o.sb,turns); s.pc.ondatachannel=(e)=>hpSlWire(s,e.channel);
    await s.pc.setRemoteDescription({type:'offer',sdp:o.sdp}); await s.pc.setLocalDescription(await s.pc.createAnswer()); await hpCallGatherN(s.pc,turns.length); if(HP_SL[k]!==s) return;
    const sdp=s.pc.localDescription.sdp, fp=extractFingerprint(sdp); if(!fp) return;
    await hpCallSigPost(from,{v:1,type:'sba',sb:o.sb,sdp:sdp,fp:fp,ts:hpTurnWire(mine)},[dev]); if(HP_SL[k]===s&&s.st!=='open') hpLog('通話：'+hpSlNick(from)+' からの待機の糸に応えた（端末 '+dev.slice(0,10)+'…）');
  }catch(e){ try{ hpLog('通話：待機の糸の合図でエラー（'+((e&&e.message)||e)+'）'); }catch(x){} } }

try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f182){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ try{ if(o&&o.type==='call'&&typeof o.call==='string'){ const now=Date.now(); for(const [k,t] of HP_CALL_SEEN) if(now-t>120e3) HP_CALL_SEEN.delete(k); const C=HP_CALL; if(HP_CALL_SEEN.has(o.call)&&!(C&&C.id===o.call)&&!(r&&r.body==='')){ hpLog('通話：同じ呼び出しが郵便受けからも届いた（もう終わっているので鳴らさない）'); return; } } }catch(e){} return f.apply(this,arguments); },f,{__f182:1}); } }catch(e){}

try{ if(typeof openConversation==='function'&&!openConversation.__f182){ const f=openConversation; openConversation=Object.assign(function(peer){ const r=f.apply(this,arguments); try{ const p=peer||(typeof CURPEER!=='undefined'?CURPEER:null); if(p) setTimeout(()=>{ hpSlStart(p).catch(()=>{}); },2000); }catch(e){} return r; },f,{__f182:1}); } }catch(e){}
try{ if(typeof hpCallOnEnd==='function'&&!hpCallOnEnd.__f182){ const f=hpCallOnEnd; hpCallOnEnd=Object.assign(function(C){ const r=f.apply(this,arguments); try{ if(C&&C.peer){ hpSlRecent(C.peer); setTimeout(()=>{ hpSlStart(C.peer,true).catch(()=>{}); },5000); } }catch(e){} return r; },f,{__f182:1}); } }catch(e){}
function hpSlBoot(){ try{ let i=0; for(const p of hpSlRecent().slice(0,3)){ if(!isContact(p)) continue; setTimeout(()=>{ hpSlStart(p).catch(()=>{}); },8000+(i++)*4000); } }catch(e){} }
try{ if(typeof hpLinkOnReply==='function'&&!hpLinkOnReply.__f182){ const f=hpLinkOnReply; hpLinkOnReply=Object.assign(function(o){ const r=f.apply(this,arguments); try{ if(o&&o.ok==='claim') hpSlBoot(); }catch(e){} return r; },f,{__f182:1}); } }catch(e){}
try{ if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('visibilitychange',()=>{ try{ if(document.visibilityState!=='visible') return; for(const p of hpSlRecent().slice(0,3).concat(typeof CURPEER!=='undefined'&&CURPEER?[CURPEER]:[])){ setTimeout(()=>{ hpSlStart(p,true).catch(()=>{}); },3000); } }catch(e){} }); }catch(e){}

const HP_CALL_GONE=new Map();
function hpCallGone(id){ try{ if(typeof id!=='string'||!id) return; const now=Date.now(); for(const [k,t] of HP_CALL_GONE) if(now-t>180e3) HP_CALL_GONE.delete(k); HP_CALL_GONE.set(id,now); }catch(e){} }
function hpCallSibX(id){ try{ hpCallGone(id); const C=HP_CALL; if(!C||C.id!==id||C.dir!=='in'||C.st!=='ringing') return false; C.byeSent=true; hpLog('通話：自分のほかの端末で応じた（この端末の呼び出しを止めた）'); hpCallEnd('taken',T('cl_taken')); return true; }catch(e){ return false; } }
function hpCallSibTell(C){ try{ if(!C||C.dir!=='in'||typeof SIB==='undefined'||typeof sibSend!=='function') return 0; let n=0; for(const id of Object.keys(SIB)){ if(SIB[id]&&SIB[id].state==='open'&&sibSend(id,{t:'callx',call:C.id})) n++; } if(n) hpLog('通話：自分のほかの端末 '+n+' 台に「応じた」と知らせた'); return n; }catch(e){ return 0; } }
try{ if(typeof hpCallAccept==='function'&&!hpCallAccept.__f185){ const f=hpCallAccept; hpCallAccept=Object.assign(function(){ const C=HP_CALL; try{ hpCallCard(false); }catch(e){} if(C&&C.st==='ringing'){ hpCallGone(C.id); hpCallSibTell(C); } return f.apply(this,arguments); },f,{__f185:1}); } }catch(e){}
try{ if(typeof hpCallDecline==='function'&&!hpCallDecline.__f185){ const f=hpCallDecline; hpCallDecline=Object.assign(function(){ const C=HP_CALL; if(C&&C.st==='ringing'){ hpCallGone(C.id); hpCallSibTell(C); } return f.apply(this,arguments); },f,{__f185:1}); } }catch(e){}
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f185){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ try{ if(o&&typeof o.call==='string'){ if(o.type==='callend'){ hpCallGone(o.call); }   else if(o.type==='call'&&((HP_CALL_GONE.has(o.call)&&!(HP_CALL&&HP_CALL.id===o.call&&HP_CALL.st!=='ended'))||(HP_CALL&&HP_CALL.id===o.call&&HP_CALL.st==='ended'))){ hpLog('通話：もう済んだ呼び出しが遅れて届いた（鳴らさない）'); return; }   } }catch(e){} return f.apply(this,arguments); },f,{__f185:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&window.addEventListener) window.addEventListener('focus',()=>{ try{ if(HP_CALL&&HP_CALL.st==='ringing') hpCallCard(false); }catch(e){} }); }catch(e){}

const HP_RING_IN=['bell','trill','chime','soft'], HP_RING_OUT=['jp','intl','soft'];
function hpRingGet(k,list){ try{ const v=String(localStorage.getItem(k)||''); return list.indexOf(v)>=0?v:list[0]; }catch(e){ return list[0]; } }
function hpRingSet(k,list,v){ try{ if(list.indexOf(v)>=0) localStorage.setItem(k,v); }catch(e){} }
function hpRingAc(){ if(!HP_CALL_AC){ const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; HP_CALL_AC=new C(); } try{ if(HP_CALL_AC.state==='suspended') HP_CALL_AC.resume(); }catch(e){} return HP_CALL_AC; }
function hpRingNote(a,type,f,t0,dur,vol){ const o=a.createOscillator(), g=a.createGain(); o.type=type; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(vol,t0+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur); o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0+dur+0.02); }
function hpRingInOnce(kind){ try{ const a=hpRingAc(); if(!a) return 0; const t0=a.currentTime+0.02;
    if(kind==='bell'){ for(let i=0;i<20;i++){ const t=t0+i*0.05; hpRingNote(a,'triangle',1180,t,0.045,0.16); hpRingNote(a,'sine',2950,t,0.03,0.05); } return 3000; }
    if(kind==='trill'){ for(let i=0;i<16;i++){ hpRingNote(a,'square',i%2?1280:1000,t0+i*0.0625,0.06,0.06); } return 3000; }
    if(kind==='soft'){ [523.25,659.25,783.99].forEach((f,i)=>hpRingNote(a,'sine',f,t0+i*0.22,0.6,0.16)); return 3000; }
    hpRingNote(a,'sine',880,t0,0.45,0.25); hpRingNote(a,'sine',660,t0+0.5,0.45,0.25); return 2500;
  }catch(e){ return 0; } }
function hpRingOutOnce(kind){ try{ const a=hpRingAc(); if(!a) return 0;
    if(kind==='intl'){ hpCallBeep(440,2.0,0.05,0); hpCallBeep(480,2.0,0.05,0); return 6000; }
    if(kind==='soft'){ hpCallBeep(425,0.6,0.035,0); return 4000; }
    hpCallBeep(400,1.0,0.07,0,16); return 3000;
  }catch(e){ return 0; } }

hpCallRing=function(on){ try{ if(HP_CALL_RING_T){ clearInterval(HP_CALL_RING_T); HP_CALL_RING_T=null; } if(!on) return; if(typeof soundOn==='function'&&soundOn()==='off'){ try{ if(navigator.vibrate) navigator.vibrate([400,300,400]); }catch(e){} return; }
    const kind=hpRingGet('p2p_ringin',HP_RING_IN); const one=()=>{ hpRingInOnce(kind); try{ if(navigator.vibrate) navigator.vibrate([1000,2000]); }catch(e){} }; one(); HP_CALL_RING_T=setInterval(one,kind==='chime'?2500:3000); }catch(e){} };
try{ if(typeof hpCallTone==='function'&&!hpCallTone.__f189){ const f=hpCallTone; hpCallTone=Object.assign(function(k){ if(k!=='back') return f.apply(this,arguments); try{ if(k===HP_CALL_TONE) return; HP_CALL_TONE=k; if(HP_CALL_TONE_T){ clearInterval(HP_CALL_TONE_T); HP_CALL_TONE_T=null; } if(typeof soundOn==='function'&&soundOn()==='off') return; const kind=hpRingGet('p2p_ringout',HP_RING_OUT); const ms=hpRingOutOnce(kind)||3000; HP_CALL_TONE_T=setInterval(()=>hpRingOutOnce(kind),ms); }catch(e){} },f,{__f189:1}); } }catch(e){}

function hpRingCard(){ try{ if(typeof document==='undefined'||document.getElementById('set-call')) return false; const ref=document.getElementById('set-mail'); if(!ref||!ref.parentNode) return false;
    const c=document.createElement('div'); c.className='card'; c.id='set-call'; const h=document.createElement('h2'); h.textContent=T('cl_set_h'); h.setAttribute('data-i18n','cl_set_h'); c.appendChild(h);
    const row=(lab,key,list,pre,play)=>{ const r=document.createElement('div'); r.className='kv'; r.style.marginTop='8px'; const b=document.createElement('b'); b.textContent=T(lab); b.setAttribute('data-i18n',lab); r.appendChild(b);
      const s=document.createElement('select'); s.style.cssText='background:#1b2740;border:none;border-radius:6px;color:inherit;padding:4px 6px'; for(const v of list){ const o=document.createElement('option'); o.value=v; o.textContent=T(pre+v); o.setAttribute('data-i18n',pre+v); s.appendChild(o); } s.value=hpRingGet(key,list); s.onchange=()=>{ hpRingSet(key,list,s.value); play(s.value); };
      const t=document.createElement('button'); t.className='b'; t.type='button'; t.textContent=T('btn_snd_try'); t.setAttribute('data-i18n','btn_snd_try'); t.style.cssText='margin-left:8px;padding:4px 10px;font-size:12px'; t.onclick=()=>play(s.value); r.appendChild(s); r.appendChild(t); c.appendChild(r); };
    row('cl_rin_l','p2p_ringin',HP_RING_IN,'cl_rin_',k=>{ hpRingInOnce(k); }); row('cl_rout_l','p2p_ringout',HP_RING_OUT,'cl_rout_',k=>{ hpRingOutOnce(k); });
    ref.parentNode.insertBefore(c,ref.nextSibling); return true; }catch(e){ return false; } }
try{ if(typeof document!=='undefined'&&document.addEventListener){ const go=()=>{ hpRingCard(); }; if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',go); else setTimeout(go,0); setTimeout(go,1500); } }catch(e){}

function hpPcTurn(pc){ try{ const c=pc.getConfiguration&&pc.getConfiguration(); return !!(c&&Array.isArray(c.iceServers)&&c.iceServers.some(x=>[].concat(x&&x.urls||[]).some(u=>/^turns?:/.test(String(u))))); }catch(e){ return false; } }
function hpGatherFast(pc,max,after){ return new Promise(res=>{ try{ if(!pc||pc.iceGatheringState==='complete') return res(); }catch(e){ return res(); }
    let done=false, t2=null; const turn=hpPcTurn(pc), want=turn?/ typ relay/:/ typ srflx/;
    const f=()=>{ try{ if(pc.iceGatheringState==='complete') fin(); }catch(e){} }, g=e=>{ try{ const c=(e&&e.candidate&&e.candidate.candidate)||''; if(!t2&&want.test(c)) t2=setTimeout(fin,after); }catch(x){} };
    const fin=()=>{ if(done) return; done=true; clearTimeout(t1); if(t2) clearTimeout(t2); try{ pc.removeEventListener('icegatheringstatechange',f); pc.removeEventListener('icecandidate',g); }catch(e){} res(); };
    const t1=setTimeout(fin,max); try{ pc.addEventListener('icegatheringstatechange',f); pc.addEventListener('icecandidate',g); }catch(e){ fin(); return; }
    try{ const sd=String((pc.localDescription&&pc.localDescription.sdp)||''); if(want.test(sd)&&!t2) t2=setTimeout(fin,after); }catch(e){} }); }
try{ if(typeof waitGathering==='function'&&!waitGathering.__fast){ waitGathering=Object.assign(function(pc){ return hpGatherFast(pc,8000,500); },{__fast:1}); } }catch(e){}
try{ if(typeof hpCallGather==='function'&&!hpCallGather.__fast){ hpCallGather=Object.assign(function(pc){ return hpGatherFast(pc,HP_CALL_GATHER,1000); },{__fast:1}); } }catch(e){}
try{ if(typeof hpCallGatherN==='function'&&!hpCallGatherN.__fast){ hpCallGatherN=Object.assign(function(pc,n){ return hpGatherFast(pc,HP_CALL_GATHER,n>1?1500:1000); },{__fast:1}); } }catch(e){}
let HP_TURN_BG=false;
try{ if(typeof hpTurnCreds==='function'&&!hpTurnCreds.__fast){ const f=hpTurnCreds; hpTurnCreds=Object.assign(async function(){ try{ const u=String((typeof POST!=='undefined'&&POST&&POST.url)||''), c=u?HP_TURN[u]:null;
      if(c&&c.alive&&hpTurnFresh(c)&&POST.up&&!POST.notOwner){ if(Date.now()-Number(c.at||0)>60e3&&!HP_TURN_BG){ HP_TURN_BG=true; Promise.resolve().then(()=>f()).catch(()=>{}).then(()=>{ HP_TURN_BG=false; }); } return c; } }catch(e){}
    return await f.apply(this,arguments); },f,{__fast:1}); } }catch(e){}
const HP_SL_CALLWAIT=1500;
try{ if(typeof hpCallSig==='function'&&!hpCallSig.__slwait){ const f=hpCallSig; hpCallSig=Object.assign(async function(peer,body){ try{ if(body&&body.type==='call'&&!hpSlOpen(peer)&&hpSlOf(peer).some(s=>s.st==='connecting')){ const t0=Date.now();
        while(Date.now()-t0<HP_SL_CALLWAIT&&!hpSlOpen(peer)&&hpSlOf(peer).some(s=>s.st==='connecting')) await sleep(200);
        hpLog('通話：'+hpSlNick(peer)+' との待機の糸を '+((Date.now()-t0)/1000).toFixed(1)+' 秒待った（'+(hpSlOpen(peer)?'できたので糸で呼ぶ':'まだなので郵便受けで呼ぶ')+'）'); } }catch(e){}
    return await f.apply(this,arguments); },f,{__slwait:1}); } }catch(e){}
const HP_SL_LTR_MAX=200000, HP_SL_LTR_SENT=new Set(), HP_SL_LATER_N={};
function hpSlLetterOut(id,letters){ let n=0; try{ for(const L of letters){ if(!L||typeof L.dev!=='string'||typeof L.blob!=='string'||L.blob.length>HP_SL_LTR_MAX) continue; const k=id+'|'+L.dev; if(HP_SL_LTR_SENT.has(k)) continue;
      const s=Object.keys(HP_SL).map(x=>HP_SL[x]).find(x=>x&&x.dev===L.dev&&hpSlIsOpen(x)); if(!s) continue;
      try{ s.dc.send(JSON.stringify({t:'ltr',id:id,blob:L.blob})); HP_SL_LTR_SENT.add(k); n++; }catch(e){} }
    while(HP_SL_LTR_SENT.size>200) HP_SL_LTR_SENT.delete(HP_SL_LTR_SENT.values().next().value);
    if(n) hpLog('手紙 '+id+' を待機の糸でも渡した（端末 '+n+' 台）'); }catch(e){} return n; }
async function hpSlLetterIn(s,m){ try{ if(!m||typeof m.id!=='string'||!/^[0-9a-f]{16,64}$/.test(m.id)||typeof m.blob!=='string'||m.blob.length>HP_SL_LTR_MAX) return false; const now=Date.now();
    if(hpSeen(m.id,now+7*864e5)){ hpLog('重複 '+m.id+'（糸で届いた分。2 回目なので捨てた）'); return false; }
    hpLog('手紙 '+m.id+' '+m.blob.length+' 文字（待機の糸で届いた）'); try{ await hpDeliver({id:m.id,ts:now,exp:now+7*864e5,blob:m.blob}); }catch(e){ hpLog('糸で届いた手紙を開けられない '+m.id+' '+((e&&e.message)||e)); }
    try{ hpSeenSave(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpPutOne==='function'&&!hpPutOne.__sl){ const f=hpPutOne; hpPutOne=Object.assign(async function(g,id,kind,link){ try{ if(kind==='msg'&&!link&&g&&Array.isArray(g.letters)) hpSlLetterOut(id,g.letters); }catch(e){} return f.apply(this,arguments); },f,{__sl:1}); } }catch(e){}
try{ if(typeof hpSlWire==='function'&&!hpSlWire.__ltr){ const f=hpSlWire; hpSlWire=Object.assign(function(s,dc){ const v=f.apply(this,arguments);
    try{ const om=dc.onmessage, oo=dc.onopen; dc.onmessage=e=>{ try{ const m=JSON.parse(String(e.data)); if(m&&m.t==='ltr'){ hpSlLetterIn(s,m).catch(()=>{}); return; } }catch(x){} return om&&om.call(dc,e); };
      dc.onopen=e=>{ const r=oo&&oo.call(dc,e); try{ HP_SL_LATER_N[s.peer]=0; }catch(x){} return r; }; }catch(e){}
    return v; },f,{__ltr:1}); } }catch(e){}
try{ hpSlBoot=Object.assign(function(){ try{ let i=0; for(const p of hpSlRecent().slice(0,3)){ if(!isContact(p)) continue; setTimeout(()=>{ hpSlStart(p).catch(()=>{}); },1500+(i++)*500); } }catch(e){} },{__fast:1}); }catch(e){}
try{ hpSlLater=Object.assign(function(peer){ try{ const want=(typeof CURPEER!=='undefined'&&CURPEER===peer)||hpSlRecent().slice(0,3).indexOf(peer)>=0; if(!want) return; const n=HP_SL_LATER_N[peer]=(HP_SL_LATER_N[peer]||0)+1, ms=[3000,15000,60000][Math.min(n,3)-1];
    setTimeout(()=>{ try{ if(hpSlOpen(peer)){ HP_SL_LATER_N[peer]=0; return; } if(typeof document==='undefined'||document.visibilityState!=='hidden') hpSlStart(peer,true).catch(()=>{}); }catch(e){} },ms); }catch(e){} },{__fast:1}); }catch(e){}

function hpCallSibTellBox(C){ try{ if(!C||C.dir!=='in'||typeof hpSibPut!=='function'||typeof sibTargets!=='function') return 0; const devs=sibTargets().filter(d=>!(typeof SIB!=='undefined'&&SIB[d]&&SIB[d].state==='open')); if(!devs.length) return 0;
    const body={v:1,type:'callx',call:C.id};
    if(HP_IOS&&typeof hpWtOwnPut==='function') for(const d of devs) hpWtOwnPut(body,d).catch(()=>{});
    Promise.resolve(hpSibPut(body,devs,'sig')).then(n=>{ if(n) hpLog('通話：線の無い自分の端末 '+n+' 台に、郵便受けで「応じた」と知らせた'); }).catch(()=>{});
    return devs.length; }catch(e){ return 0; } }
try{ if(typeof hpCallSibTell==='function'&&!hpCallSibTell.__box){ const f=hpCallSibTell; hpCallSibTell=Object.assign(function(C){ const n=f.apply(this,arguments); try{ hpCallSibTellBox(C); }catch(e){} return n; },f,{__box:1}); } }catch(e){}
try{ if(typeof sibOnSig==='function'&&!sibOnSig.__callx){ const f=sibOnSig; sibOnSig=Object.assign(async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){ o=null; }
    if(o&&o.v===1&&o.type==='callx'){ try{ if(r&&ID&&r.from===ID.address&&r.fromMaster===ID.publicKey&&r.fromDev&&typeof sibIsMine==='function'&&sibIsMine(r.fromDev)&&typeof o.call==='string'&&/^[0-9a-f]{16}$/.test(o.call)){ hpLog('通話：自分のほかの端末が応じたと郵便受けで届いた'); hpCallSibX(o.call); } }catch(e){} return; }
    return await f.apply(this,arguments); },f,{__callx:1}); } }catch(e){}

function hpCallMyKind(){ try{ return /Android|iPhone|iPad|iPod|Mobile/i.test(String(navigator.userAgent||''))||(typeof HP_IOS!=='undefined'&&HP_IOS)?'phone':'pc'; }catch(e){ return 'pc'; } }
const HP_CALL_RING_MORE=60000  , HP_CALL_MISS_MAX=30*60e3, HP_CALL_WHY=new Map(), HP_CALL_X=new Set(); let HP_CALL_MISS_T=null;
function hpCallMissedBar(peer,at){ try{ if(!peer||(HP_CALL&&HP_CALL.st!=='ended')) return false; if(typeof hpBlocked==='function'&&hpBlocked(peer)) return false; const d=new Date(Number(at)||Date.now()), p=n=>String(n).padStart(2,'0');
    hpCallBar({peer:peer,endText:TF('cl_missed_at',{t:p(d.getHours())+':'+p(d.getMinutes())})}); if(HP_CALL_BAR_T){ clearTimeout(HP_CALL_BAR_T); HP_CALL_BAR_T=null; } try{ const f=document.getElementById('hp-call'); if(f&&(!HP_CALL||HP_CALL.st==='ended')) f.style.display='none'; }catch(e){}   hpLog('通話：'+nickOf(peer)+' からの出られなかった呼び出しを出した（［かけ直す］）'); return true; }catch(e){ return false; } }
function hpCallMissLater(peer,at,id){ try{ if(HP_CALL_MISS_T) clearTimeout(HP_CALL_MISS_T); HP_CALL_MISS_T=setTimeout(()=>{ HP_CALL_MISS_T=null; const w=HP_CALL_WHY.get(id)||''; if(HP_CALL_X.has(id)||/^(taken|glare|decline|nopq|busy)$/.test(w)) return; hpCallMissedBar(peer,at); },1500); }catch(e){} }
try{ if(typeof hpCallSibX==='function'&&!hpCallSibX.__f201){ const f=hpCallSibX; hpCallSibX=Object.assign(function(id){ try{ if(typeof id==='string') HP_CALL_X.add(id); }catch(e){} return f.apply(this,arguments); },{__f201:1}); } }catch(e){}
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f201){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){
    if(!(o&&o.v===1&&typeof o.call==='string'&&/^[0-9a-f]{16}$/.test(o.call)&&r)) return f.apply(this,arguments);
    const from=r.from, age=Date.now()-Number(r.sentAt);
    if(o.type==='callring'){ const C=HP_CALL; if(C&&C.dir==='out'&&C.id===o.call&&C.peer===from&&C.st==='calling'&&(o.k==='pc'||o.k==='phone')){ C.rungK=C.rungK||{}; if(!C.rungK[o.k]){ C.rungK[o.k]=1; hpLog('通話：'+nickOf(from)+' の'+(o.k==='pc'?'PC':'スマホ')+'で鳴り始めた'); hpCallUi(); } } if(C&&C.dir==='out'&&C.id===o.call&&C.peer===from&&C.st==='calling'&&!C.rung){ C.rung=Date.now(); if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='calling'){ hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); } },HP_CALL_RING_MORE); hpLog('通話：'+nickOf(from)+' の端末で鳴り始めた（あと '+Math.round(HP_CALL_RING_MORE/1000)+' 秒待つ）'); hpCallUi(); } return; }
    if(o.type==='callend'){ try{ HP_CALL_WHY.set(o.call,String(o.why||'')); if(HP_CALL_WHY.size>50) HP_CALL_WHY.delete(HP_CALL_WHY.keys().next().value); }catch(e){} }
    const res=await f.apply(this,arguments);
    try{ if(o.type==='call'&&ID&&from!==ID.address&&typeof isContact==='function'&&isContact(from)){ const N=HP_CALL;
      if(N&&N.dir==='in'&&N.id===o.call&&N.peer===from&&N.st==='ringing'&&!N.ringSent){ N.ringSent=Date.now(); hpCallSig(from,{v:1,type:'callring',call:o.call,k:hpCallMyKind()},r.fromDev?[r.fromDev]:null).catch(()=>{}); if(N.timer) clearTimeout(N.timer); N.timer=setTimeout(()=>{ if(HP_CALL===N&&N.st==='ringing'){ hpCallEnd('missed',T('cl_missed')); } },HP_CALL_RING_MORE); hpLog('通話：鳴らし始めたと呼んだ端末に知らせた（'+Math.round(HP_CALL_RING_MORE/1000)+' 秒鳴らす）'); }
      else if(age>HP_CALL_MAXAGE&&age<HP_CALL_MISS_MAX&&!(HP_CALL&&HP_CALL.st!=='ended')) hpCallMissLater(from,Number(r.sentAt),o.call); } }catch(e){}
    return res; },f,{__f201:1}); } }catch(e){}
try{ if(typeof hpCallOnEnd==='function'&&!hpCallOnEnd.__f201){ const f=hpCallOnEnd; hpCallOnEnd=Object.assign(function(C){ const r=f.apply(this,arguments); try{ if(C&&C.dir==='in'&&!C.accAt&&/^(missed|peer:hangup|peer:timeout)$/.test(String(C.why||''))){ const id=C.id, at=C.at; setTimeout(()=>{ if(!HP_CALL_X.has(id)&&(!HP_CALL||HP_CALL===C||HP_CALL.st==='ended')) hpCallMissedBar(C.peer,at); },400); } }catch(e){} return r; },f,{__f201:1}); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f201){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(C&&d&&d.__st&&C.dir==='out'&&C.st==='calling'&&C.sent){ if(C.rung){ const k=C.rungK||{}, w=k.pc&&k.phone?'both':k.pc?'pc':k.phone?'phone':''; d.__st.textContent=w?TF('cl_ring_at',{who:nickOf(C.peer),where:w==='both'?T('cl_dev_both'):w==='pc'?T('cl_dev_pc'):T('cl_dev_phone')}):TF('cl_ring_peer',{who:nickOf(C.peer)}); } else if(typeof hpSlOpen==='function'&&!hpSlOpen(C.peer)) d.__st.textContent=TF('cl_calling_shut',{who:nickOf(C.peer)}); } }catch(e){} return r; },f,{__f201:1}); } }catch(e){}

const HP_PRE_MAX=4, HP_PRE_OKWAIT=4000, HP_PRE_LATE=15000, HP_BYE_KEEP=60000; let HP_BYE_LAST=null;
function hpPreCry(C,pc){ try{ if(!C||!C.key||!pc) return 0; const me=C.dir==='out'?1:2, you=C.dir==='out'?2:1; C.cry=C.cry||{}; C.cryW=C.cryW||new WeakSet(); let n=0;
    for(const t of pc.getTransceivers()){ const s=t.sender, r=t.receiver; if(s&&!C.cryW.has(s)){ C.cryW.add(s); C.cry['ps'+Object.keys(C.cry).length]=hpCallCryptoApply(s,'enc',C.key,hpCallSalt(me)); n++; } if(r&&!C.cryW.has(r)){ C.cryW.add(r); C.cry['pr'+Object.keys(C.cry).length]=hpCallCryptoApply(r,'dec',C.key,hpCallSalt(you)); n++; } } return n; }catch(e){ hpLog('通話：裏の線に二重の鍵を掛けられない（'+((e&&e.message)||e)+'）'); return -1; } }
function hpPreClose(P){ try{ if(P&&P.pc){ P.pc.ontrack=null; P.pc.onconnectionstatechange=null; P.pc.close(); } }catch(e){} try{ if(P&&P.dc) P.dc.close(); }catch(e){} }
function hpPreDropAll(C,keep){ try{ if(C&&C.pres){ for(const k of Object.keys(C.pres)){ if(C.pres[k]!==keep) hpPreClose(C.pres[k]); } C.pres={}; } if(C&&C.pre1&&C.pre1!==keep){ hpPreClose(C.pre1); C.pre1=null; } }catch(e){} }
function hpPreLive(P){ try{ return !!(P&&P.pc&&P.pc.connectionState==='connected'&&P.dc&&P.dc.readyState==='open'); }catch(e){ return false; } }

async function hpPreOffer(N){ try{ if(!N||N.dir!=='in'||!N.preOk||N.pre1) return false; const live=()=>HP_CALL===N&&N.st==='ringing';
    try{ if(N.prep) await N.prep; }catch(e){ return false; } if(!live()) return false;
    const pc=new RTCPeerConnection(hpCallIceN(N.turns)), P={pc:pc,dc:null,stream:null,at:Date.now()}; N.pre1=P; const t0=Date.now();
    const tr=pc.addTransceiver('audio',{direction:'sendrecv'}); P.tr=tr; P.dc=pc.createDataChannel('hp-pre'); hpPreCry(N,pc);
    pc.ontrack=e=>{ try{ P.stream=(e.streams&&e.streams[0])||new MediaStream([e.track]); }catch(x){} };
    P.dc.onmessage=e=>{ try{ const m=JSON.parse(String(e.data)); if(m&&m.t==='okd'&&P.okd) P.okd(); }catch(x){} };
    pc.onconnectionstatechange=()=>{ try{ if(pc.connectionState==='connected'&&!P.upLog){ P.upLog=1; hpLog('通話：裏の線がつながった（'+((Date.now()-t0)/1000).toFixed(1)+' 秒・［応答］ですぐ話せる）'); } }catch(e){} };
    await pc.setLocalDescription(await pc.createOffer()); await hpCallGatherN(pc,N.turns.length); if(!live()||N.pre1!==P){ hpPreClose(P); return false; }
    const sdp=pc.localDescription.sdp, fp=extractFingerprint(sdp); if(!fp||!hpCallHasRelay(sdp)){ hpPreClose(P); N.pre1=null; return false; }
    await hpCallSig(N.peer,{v:1,type:'callpo',call:N.id,sdp:sdp,fp:fp},N.dev?[N.dev]:null); if(live()) hpLog('通話：裏の線を申し込んだ');
    if(N.late&&live()) setTimeout(()=>{ if(live()&&N.pre1===P&&!P.ans){ hpLog('通話：呼んだ側から返事が無い（もう切ったらしい。鳴らすのをやめた）'); hpCallEnd('missed',T('cl_missed')); } },HP_PRE_LATE); return true;
  }catch(e){ try{ hpLog('通話：裏の線を作れない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; } }

async function hpPreAnswer(C,dev,o){ try{ C.pres=C.pres||{}; if(C.pres[dev]||Object.keys(C.pres).length>=HP_PRE_MAX) return false;
    const pc=new RTCPeerConnection(hpCallIceN(C.turns)), P={pc:pc,dc:null,stream:null,dev:dev,at:Date.now()}; C.pres[dev]=P;
    pc.ontrack=e=>{ try{ P.stream=(e.streams&&e.streams[0])||new MediaStream([e.track]); }catch(x){} };
    pc.ondatachannel=e=>{ P.dc=e.channel; P.dc.onmessage=m=>{ try{ const x=JSON.parse(String(m.data)); if(x&&x.t==='ok') hpPreAdopt(C,P); }catch(y){} }; };
    await pc.setRemoteDescription({type:'offer',sdp:o.sdp}); for(const t of pc.getTransceivers()){ try{ t.direction='sendrecv'; }catch(e){} } hpPreCry(C,pc);
    await pc.setLocalDescription(await pc.createAnswer()); await hpCallGatherN(pc,C.turns.length); if(HP_CALL!==C||C.st!=='calling'||C.pres[dev]!==P){ hpPreClose(P); return false; }
    const sdp=pc.localDescription.sdp, fp=extractFingerprint(sdp); if(!fp){ hpPreClose(P); delete C.pres[dev]; return false; }
    await hpCallSig(C.peer,{v:1,type:'callpa',call:C.id,sdp:sdp,fp:fp},[dev]); hpLog('通話：裏の線に答えた（端末 '+String(dev).slice(0,10)+'…）'); return true;
  }catch(e){ try{ hpLog('通話：裏の線に答えられない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; } }

async function hpPreAdopt(C,P){ try{ if(HP_CALL!==C||C.st!=='calling'||!P||!P.pc) return false; const mic=C.stream&&C.stream.getAudioTracks()[0]; const tr=P.pc.getTransceivers().find(t=>t.sender); if(!mic||!tr) return false;
    await tr.sender.replaceTrack(mic); try{ if(tr.sender.setStreams) tr.sender.setStreams(C.stream); }catch(e){}
    try{ P.dc.send(JSON.stringify({t:'okd'})); }catch(e){}
    const old=C.pc; C.pc=P.pc; C.dev=P.dev; delete C.pres[P.dev]; hpPreDropAll(C,P); try{ if(old){ old.onconnectionstatechange=null; old.ontrack=null; old.close(); } }catch(e){}
    hpCallWire(C); try{ const au=document.getElementById('hp-call-audio'); if(au&&P.stream){ C.remote=P.stream; au.srcObject=P.stream; au.play().catch(()=>{}); } }catch(e){}
    if(C.timer){ clearTimeout(C.timer); C.timer=null; } C.st='talking'; C.talkAt=Date.now(); C.tick=setInterval(hpCallUi,1000); C.pre=1;
    try{ const card=hpCardOf(C.peer); const others=(card&&Array.isArray(card.devices)?card.devices:[]).filter(d=>d!==C.dev); if(others.length) hpCallSig(C.peer,{v:1,type:'callend',call:C.id,why:'taken'},others).catch(()=>{}); }catch(e){}
    hpLog('通話：つながった（呼んだ・裏の線で・二重の鍵 '+Object.keys(C.cry||{}).length+'）'); hpCallUi(); try{ hpTurnGood(C); }catch(e){} return true; }catch(e){ try{ hpLog('通話：裏の線に切り替えられない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; } }

async function hpPreAccept(C){ const P=C.pre1, t0=Date.now(); try{
    try{ hpCallCard(false); }catch(e){} try{ hpCallGone(C.id); }catch(e){} try{ hpCallSibTell(C); }catch(e){}
    C.st='connecting'; C.accAt=t0; hpCallRing(false); hpCallUi(); hpCallUnlock();
    C.stream=await hpCallMic(); if(HP_CALL!==C||C.st!=='connecting'){ hpCallClose(C); return false; } const mic=C.stream.getAudioTracks()[0]; if(!mic) throw new Error(T('cl_nomic'));
    if(!hpPreLive(P)) throw new Error('裏の線が切れた');
    await P.tr.sender.replaceTrack(mic); try{ if(P.tr.sender.setStreams) P.tr.sender.setStreams(C.stream); }catch(e){}
    const got=await new Promise(res=>{ const t=setTimeout(()=>{ P.okd=null; res(false); },HP_PRE_OKWAIT); P.okd=()=>{ clearTimeout(t); P.okd=null; res(true); }; try{ P.dc.send(JSON.stringify({t:'ok'})); }catch(e){ clearTimeout(t); res(false); } });
    if(!got) throw new Error('呼んだ側から返事が無い');
    if(HP_CALL!==C||C.st!=='connecting') return false;
    const old=C.pc; C.pc=P.pc; C.pre1=null; try{ if(old){ old.onconnectionstatechange=null; old.ontrack=null; old.close(); } }catch(e){}
    hpCallWire(C); try{ const au=document.getElementById('hp-call-audio'); if(au&&P.stream){ C.remote=P.stream; au.srcObject=P.stream; au.play().catch(()=>{}); } }catch(e){}
    if(C.timer){ clearTimeout(C.timer); C.timer=null; } C.st='talking'; C.talkAt=Date.now(); C.tick=setInterval(hpCallUi,1000); C.pre=1;
    hpLog('通話：つながった（応えた・裏の線で・出てから '+((Date.now()-t0)/1000).toFixed(1)+' 秒・二重の鍵 '+Object.keys(C.cry||{}).length+'）'); hpCallUi(); return true;
  }catch(e){ hpLog('通話：裏の線では出られない（'+((e&&e.message)||e)+'）。今までのやり方で応える'); try{ if(P&&P.tr) P.tr.sender.replaceTrack(null).catch(()=>{}); }catch(x){} hpPreDropAll(C,null); try{ if(C.stream) C.stream.getTracks().forEach(t=>{ try{ t.stop(); }catch(y){} }); C.stream=null; }catch(x){} if(HP_CALL===C&&C.st==='connecting'){ C.st='ringing'; return 'redo'; } return false; } }
try{ if(typeof hpCallAccept==='function'&&!hpCallAccept.__f202){ const f=hpCallAccept; hpCallAccept=Object.assign(async function(){ const C=HP_CALL; if(C&&C.dir==='in'&&C.st==='ringing'&&hpPreLive(C.pre1)){ const v=await hpPreAccept(C); if(v!=='redo') return v; } return f.apply(this,arguments); },f,{__f202:1}); } }catch(e){}
try{ if(typeof hpCallClose==='function'&&!hpCallClose.__f202){ const f=hpCallClose; hpCallClose=Object.assign(function(C){ try{ hpPreDropAll(C,null); }catch(e){} return f.apply(this,arguments); },f,{__f202:1}); } }catch(e){}
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f202){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){
    if(!(o&&o.v===1&&typeof o.call==='string'&&/^[0-9a-f]{16}$/.test(o.call)&&r)) return f.apply(this,arguments);
    const from=r.from, C=HP_CALL;
    if(o.type==='callpo'){ if(C&&C.dir==='out'&&C.st==='calling'&&C.id===o.call&&C.peer===from&&r.fromDev&&typeof o.sdp==='string'&&typeof o.fp==='string'&&extractFingerprint(o.sdp)===o.fp&&hpCallHasRelay(o.sdp)) await hpPreAnswer(C,r.fromDev,o); return; }
    if(o.type==='callpa'){ const P=C&&C.pre1; if(C&&C.dir==='in'&&C.st==='ringing'&&C.id===o.call&&C.peer===from&&P&&!P.ans&&(!C.dev||!r.fromDev||r.fromDev===C.dev)&&typeof o.sdp==='string'&&extractFingerprint(o.sdp)===o.fp){ P.ans=1; try{ await P.pc.setRemoteDescription({type:'answer',sdp:o.sdp}); }catch(e){ hpLog('通話：裏の線の答えを受け取れない（'+((e&&e.message)||e)+'）'); } } return; }
    const res=await f.apply(this,arguments);
    try{ const N=HP_CALL; if(o.type==='call'&&o.pre===1&&N&&N.dir==='in'&&N.id===o.call&&N.peer===from&&N.st==='ringing'&&!N.preOk){ N.preOk=1; if(Date.now()-Number(r.sentAt)>15000) N.late=1;   hpPreOffer(N).catch(()=>{}); }
      if(o.type==='callans'&&N&&N.dir==='out'&&N.id===o.call&&N.st!=='calling') hpPreDropAll(N,null); }catch(e){}
    return res; },f,{__f202:1}); } }catch(e){}

try{ if(typeof hpCallBye==='function'&&!hpCallBye.__f202){ const f=hpCallBye; hpCallBye=Object.assign(function(why){ const C=HP_CALL; try{ if(C&&!C.byeSent){ const B={peer:C.peer,body:{v:1,type:'callend',call:C.id,why:why},devs:C.dev?[C.dev]:null,at:Date.now(),done:false}; HP_BYE_LAST=B; const sl=(typeof hpSlSend==='function')?hpSlSend(B.peer,B.body,B.devs):[]; if(sl.length) B.done=true; } }catch(e){} return f.apply(this,arguments); },f,{__f202:1}); } }catch(e){}
try{ if(typeof hpCallSigPost==='function'&&!hpCallSigPost.__f202){ const f=hpCallSigPost; hpCallSigPost=Object.assign(async function(peer,body){ const v=await f.apply(this,arguments); try{ const B=HP_BYE_LAST; if(B&&body&&body.type==='callend'&&body.call===B.body.call) B.done=true; }catch(e){} return v; },f,{__f202:1}); } }catch(e){}
function hpCallSleepBye(){ try{ const C=HP_CALL; if(C&&C.dir==='out'&&C.st==='calling'){ hpLog('通話：画面が裏に回ったので、呼び出しをやめた（「切った」を知らせた）'); hpCallBye('hangup'); hpCallEnd('hangup',T('cl_end_me')); } }catch(e){} }
function hpCallWakeBye(){ try{ const B=HP_BYE_LAST; if(!B||B.done||Date.now()-B.at>HP_BYE_KEEP) return false; B.done=true; hpLog('通話：届いたか分からない「切った」を出し直す'); hpCallSigPost(B.peer,B.body,B.devs).catch(()=>{ B.done=false; }); return true; }catch(e){ return false; } }
try{ if(typeof hpSleepConn==='function'&&!hpSleepConn.__f202){ const f=hpSleepConn; hpSleepConn=Object.assign(function(){ if(typeof hpCallSleepHide==='function') hpCallSleepHide(); else hpCallSleepBye(); return f.apply(this,arguments); },f,{__f202:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&window.addEventListener){ window.addEventListener('pagehide',()=>{ hpCallSleepBye(); }); } if(typeof document!=='undefined'&&document.addEventListener){ document.addEventListener('visibilitychange',()=>{ try{ if(document.visibilityState==='visible') setTimeout(hpCallWakeBye,3000); }catch(e){} }); } }catch(e){}

let HP_CALL_CR_SEEN='';
function hpCallHm(t){ try{ const d=new Date(Number(t)), p=n=>String(n).padStart(2,'0'); return p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds()); }catch(e){ return '?'; } }
function hpCallPushLog(cr){ try{ if(!cr||!(Number(cr.at)>0)) return false; const k=String(cr.at)+'|'+cr.code; if(k===HP_CALL_CR_SEEN) return false; HP_CALL_CR_SEEN=k; const c=Number(cr.code)||0;
    hpLog('通知：郵便受けが最後に電話の合図を送ったのは '+hpCallHm(cr.at)+'（'+(c>=200&&c<300?'通知の窓口が受け取った '+c:c?'通知の窓口が断った '+c:'通知の窓口に届かなかった')+'）'); return true; }catch(e){ return false; } }
async function hpCallPushDiag(){ try{ if(typeof indexedDB==='undefined') return 0; const db=await new Promise((res,rej)=>{ const q=indexedDB.open('hp-diag',1); q.onupgradeneeded=()=>{ try{ q.result.createObjectStore('push',{autoIncrement:true}); }catch(e){} }; q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); });
    const l=await new Promise((res)=>{ try{ const tx=db.transaction('push','readwrite'), st=tx.objectStore('push'), g=st.getAll(); g.onsuccess=()=>{ const v=g.result||[]; try{ st.clear(); }catch(e){} res(v); }; g.onerror=()=>res([]); }catch(e){ res([]); } }); try{ db.close(); }catch(e){} let n=0;
    for(const x of (Array.isArray(l)?l.slice(-10):[])){ if(!x) continue; n++; hpLog('通知：この端末が電話の合図を受けた '+hpCallHm(x.t)+'（郵便受けが送ったのは '+hpCallHm(x.at)+'・'+(x.ok?(x.front?'Handpost が前に出ていたので音なしで出した':'通知を出した'):'通知を出せなかった '+String(x.why||''))+(Number.isInteger(x.n)?'・開いている画面 '+x.n:'')+'）'); } return n; }catch(e){ return -1; } }
try{ if(typeof window!=='undefined'&&typeof setTimeout==='function') setTimeout(()=>{ hpCallPushDiag().catch(()=>{}); },4000); }catch(e){}

const HP_CALL_PRI=['call','callans','callend','callgo','callring','callpo','callpa'], HP_CALL_ASK=300e3, HP_CALL_AUTO=120e3; let HP_CALL_AUTO_UNTIL=0;
function hpCallAutoArm(why){ HP_CALL_AUTO_UNTIL=Date.now()+HP_CALL_AUTO; try{ hpLog('通話：通話の通知から開いた（'+why+'。鳴ったら自動で出る）'); }catch(e){} try{ const C=HP_CALL; if(C&&C.dir==='in'&&C.st==='ringing') setTimeout(()=>hpCallAutoGo(C),300); }catch(e){} }
function hpCallAutoGo(C){ try{ if(!(HP_CALL===C&&C.dir==='in'&&C.st==='ringing'&&Date.now()<HP_CALL_AUTO_UNTIL)) return false; HP_CALL_AUTO_UNTIL=0; hpLog('通話：通知から開いたので自動で出る'); hpCallAccept().catch(()=>{}); return true; }catch(e){ return false; } }
try{ if(typeof location!=='undefined'&&/(^|[#&])hpcall(=|&|$)/.test(String(location.hash||''))){ try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} hpCallAutoArm('開き直し'); } }catch(e){}
try{ if(typeof navigator!=='undefined'&&navigator.serviceWorker&&navigator.serviceWorker.addEventListener) navigator.serviceWorker.addEventListener('message',ev=>{ try{ if(ev&&ev.data&&ev.data.t==='hp-call-open') hpCallAutoArm('前に出した'); }catch(e){} }); }catch(e){}
function hpCallAskOn(C){ try{ if(!C||C.dir!=='out'||C.st!=='calling'||C.ask) return false; if(hpCallAllRung(C)) return false;   C.ask=Date.now(); if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='calling'){ hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); } },HP_CALL_ASK); hpLog(C.rung?('通話：'+nickOf(C.peer)+' の端末で鳴っている。ほかの端末が開くのも待つ（5 分）'):('通話：'+nickOf(C.peer)+' の Handpost は閉じているらしいので、通話のお願いにした（5 分待つ）'));   hpCallUi(); return true; }catch(e){ return false; } }
function hpCallAllRung(C){ try{ const card=(typeof hpCardOf==='function')?hpCardOf(C.peer):null, devs=(card&&Array.isArray(card.devices))?card.devices:[], R=C.rungDevs||new Set(); return devs.length>0&&devs.every(d=>R.has(d)); }catch(e){ return false; } }
function hpCallRungWhere(C){ try{ const k=(C&&C.rungK)||{}, w=k.pc&&k.phone?'both':k.pc?'pc':k.phone?'phone':''; return w==='both'?T('cl_dev_both'):w==='pc'?T('cl_dev_pc'):w==='phone'?T('cl_dev_phone'):''; }catch(e){ return ''; } }
function hpCallSleepHide(){ try{ const C=HP_CALL; if(!(C&&C.dir==='out'&&C.st==='calling')) return false; if(!C.ask) return hpCallSleepBye();
    hpLog('通話：お願いの返事を待っている間に画面が裏に回った（呼び出しは続ける。表に戻すよう通知で知らせた）');
    try{ if(navigator.serviceWorker&&navigator.serviceWorker.ready) navigator.serviceWorker.ready.then(r=>r.showNotification('Handpost',{body:TF('cl_ask_back',{who:nickOf(C.peer)}),tag:'hp-ask',renotify:true,requireInteraction:true,icon:'/icons/icon-192.png',badge:'/icons/icon-192.png'})).catch(()=>{}); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f206){ const f=hpCallSig; hpCallSig=Object.assign(async function(peer,body,devs){ if(body&&body.type==='call'&&typeof body.w!=='number') body.w=HP_CALL_ASK; return f.apply(this,arguments); },f,{__f206:1}); } }catch(e){}
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f206){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){
    try{ if(r&&o&&o.v===1&&o.type==='call'&&Number(o.w)>0){ const age=Date.now()-Number(r.sentAt), w=Math.min(HP_CALL_ASK,Number(o.w)); if(age>50000&&age<w){ r=Object.assign({},r,{sentAt:Date.now()-50000}); o.__ask=1; } } }catch(e){}
    try{ const C=HP_CALL; if(r&&o&&o.v===1&&o.type==='callend'&&C&&C.id===o.call&&C.peer===r.from&&C.st!=='ended'){ const age=Date.now()-Number(r.sentAt); if(!(Math.abs(age)<=HP_CALL_MAXAGE)){ r=Object.assign({},r,{sentAt:Date.now()}); hpLog('通話：遅れて届いた「切った」（'+Math.round(age/1000)+' 秒前）を、今の呼び出しの分として受ける'); } } }catch(e){}
    try{ const C=HP_CALL; if(r&&o&&o.v===1&&o.type==='callring'&&r.fromDev&&C&&C.dir==='out'&&C.id===o.call&&C.peer===r.from&&C.st==='calling'){ (C.rungDevs||(C.rungDevs=new Set())).add(r.fromDev); } }catch(e){}
    const res=await f.call(this,r,o);
    try{ const C=HP_CALL; if(o&&o.type==='callring'&&C&&C.dir==='out'&&C.id===o.call&&C.st==='calling'&&C.ask){ if(hpCallAllRung(C)){ if(!C.askAll){ C.askAll=1; if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='calling'){ hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); } },HP_CALL_RING_MORE); hpLog('通話：'+nickOf(C.peer)+' の端末が全部鳴っているので、45 秒待つ'); } } else { const left=Math.max(15000,C.ask+HP_CALL_ASK-Date.now()); if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='calling'){ hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); } },left); } hpCallUi(); } }catch(e){}
    try{ const N=HP_CALL; if(o&&o.type==='call'&&N&&N.dir==='in'&&N.id===o.call&&N.st==='ringing'){ if(o.__ask) N.late=1; if(Date.now()<HP_CALL_AUTO_UNTIL) setTimeout(()=>hpCallAutoGo(N),300); } }catch(e){}
    return res; },f,{__f206:1}); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f206){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(C&&d&&d.__st&&C.dir==='out'&&C.st==='calling'&&C.ask){ if(!C.rung) d.__st.textContent=TF('cl_ask_wait',{who:nickOf(C.peer)}); else if(!C.askAll) d.__st.textContent=TF('cl_ring_ask',{who:nickOf(C.peer),where:hpCallRungWhere(C)}); } if(C&&C.dir==='out'&&C.st==='calling'&&C.sent&&!C.askT){ C.askT=setTimeout(()=>{ if(HP_CALL===C) hpCallAskOn(C); },6000); } }catch(e){} return r; },f,{__f206:1}); } }catch(e){}

const HP_CALL_GO_SELF=2000, HP_TURN_OKEY='p2p_turno';
function hpTurnOwnSave(url,r){ try{ const u=String(url||''); if(!u||typeof POST==='undefined'||!POST||u!==String(POST.url||'')) return false; const c=HP_TURN[u];
    if(r&&r.on===1){ if(c&&c.alive&&c.host&&c.port&&c.user&&c.pass) localStorage.setItem(HP_TURN_OKEY,JSON.stringify({u:u,h:c.host,p:c.port,n:c.user,k:c.pass,at:Date.now()})); else localStorage.removeItem(HP_TURN_OKEY); return true; }
    if(r&&r.ok==='turnget'){ localStorage.setItem(HP_TURN_OKEY,JSON.stringify({u:u,none:Date.now()})); return true; } return false; }catch(e){ return false; } }
function hpTurnOwnLoad(){ try{ const o=JSON.parse(localStorage.getItem(HP_TURN_OKEY)||'null'); if(!o||!o.u) return ''; const u=String(o.u); if(HP_TURN[u]) return '';
    if(o.none){ if(Date.now()-Number(o.none)<12*3600e3){ HP_TURN_NONE[u]=Date.now(); return 'none'; } return ''; }
    const c={host:String(o.h||''),port:Number(o.p)||0,user:String(o.n||''),pass:String(o.k||'')}; if(c.host&&c.port&&c.user&&c.pass&&hpTurnFresh(c)){ HP_TURN[u]=Object.assign({at:Date.now(),alive:true,ext:'',ver:0,via:'own'},c); return 'cred'; } return ''; }catch(e){ return ''; } }
try{ if(typeof hpTurnCache==='function'&&!hpTurnCache.__f208){ const f=hpTurnCache; hpTurnCache=Object.assign(function(url,r){ const v=f.apply(this,arguments); try{ hpTurnOwnSave(url,r); }catch(e){} return v; },f,{__f208:1}); } }catch(e){}
try{ const w=hpTurnOwnLoad(); if(w) hpLog('通話の中継：控えていた自分の郵便受けの交換手（'+(w==='none'?'無い':'名前と合言葉')+'）を読み戻した'); }catch(e){}

try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f208){ const f=hpCallSig; hpCallSig=Object.assign(async function(peer,body,devs){ try{ if(body&&body.type==='callring'&&Date.now()<HP_CALL_AUTO_UNTIL){ const C=HP_CALL; if(C&&C.dir==='in'&&C.id===body.call&&C.st==='ringing'){ hpLog('通話：通知から開いたのですぐ出る（「鳴り始めた」は送らず、答えを先に出す）'); return null; } } }catch(e){} return f.apply(this,arguments); },f,{__f208:1}); } }catch(e){}

try{ if(typeof hpCallAccept==='function'&&!hpCallAccept.__f208){ const f=hpCallAccept; hpCallAccept=Object.assign(async function(){ const C=HP_CALL; const v=await f.apply(this,arguments);
    try{ if(v===true&&C&&HP_CALL===C&&C.st==='connecting'&&C.cands&&C.ansSent){ if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(async()=>{ try{ if(HP_CALL!==C||C.st!=='connecting'||!C.cands) return; const cs=C.cands; C.cands=null; const n=await hpCallAddCands(C,cs); hpCallIceGo(C); hpLog('通話：答えが郵便受けに入ったので、「始めよう」を待たずに線をつなぎ始めた（'+n+'）'); }catch(e){} },HP_CALL_GO_SELF); } }catch(e){} return v; },f,{__f208:1}); } }catch(e){}

const HP_CPS_MAX=3600, HP_CPS_WAIT=2500, HP_CPS_CALL_WAIT=4000, HP_CPS_TYPES=['call','callans','callgo','callend'], HP_CPS_AGE={callans:90e3,callgo:90e3,callend:120e3}, HP_CPS_PQ_KEY='p2p_callpq', HP_CPS_PQ_N=10, HP_CPS_PQ_DEVS=40, HP_CPS_NAME={call:'呼び出し',callans:'答え',callgo:'始めよう',callend:'切った'};

const HP_CPS_PQ_KEEP=300e3, HP_CPS_PQ_CAP=60, HP_CPS_PQ_SENT=20e3, HP_CPS_PQ_LAG=6e3;
function hpCpsPqAll(){ try{ const o=JSON.parse(hpSecGet(HP_CPS_PQ_KEY)||'{}'); return (o&&typeof o==='object'&&!Array.isArray(o))?o:{}; }catch(e){ return {}; } }
function hpCpsPqNote(dev,id,km,q,r){ try{ if(typeof dev!=='string'||!dev||typeof id!=='string'||!id||!(km&&km.length>=32)) return false; const s=hp5S(); const k=hpHex(s.crypto_generichash(32, hp5U('handpost-cap-pq:'+id), km.slice(0,32)));
    const o=hpCpsPqAll(), l=(Array.isArray(o[dev])?o[dev]:[]).filter(x=>x&&x.id!==id), now=Date.now(); l.unshift(Object.assign({id:id,k:k,at:now},q?{q:1}:{},r?{r:1}:{})); l.sort((a,b)=>(Number(b.at)||0)-(Number(a.at)||0)); o[dev]=l.filter((x,i)=>i<HP_CPS_PQ_N||now-(Number(x.at)||0)<HP_CPS_PQ_KEEP).slice(0,HP_CPS_PQ_CAP);
    const ks=Object.keys(o); if(ks.length>HP_CPS_PQ_DEVS){ ks.sort((a,b)=>(Number(o[a][0]&&o[a][0].at)||0)-(Number(o[b][0]&&o[b][0].at)||0)); for(const d of ks.slice(0,ks.length-HP_CPS_PQ_DEVS)) delete o[d]; }
    hpSecSet(HP_CPS_PQ_KEY,JSON.stringify(o)); return true; }catch(e){ return false; } }
function hpCpsPqPick(l){ const now=Date.now(); let best=null, bs=-Infinity, rb=null, rs=-Infinity; for(const x of (l||[])){ if(!x) continue; const at=Number(x.at)||0; if(x.r){ const s=at+(x.q?1:0); if(s>rs){ rs=s; rb=x; } continue; } if(now-at<HP_CPS_PQ_SENT) continue; const sc=at+HP_CPS_PQ_LAG+(x.q?1:0); if(sc>bs){ bs=sc; best=x; } } return rb||best||(l||[])[0]||null; }
function hpCpsPqGet(dev,id){ try{ const l=hpCpsPqAll()[dev]||[]; const e=id?l.find(x=>x&&x.id===id):hpCpsPqPick(l); return (e&&/^[0-9a-f]{64}$/.test(String(e.k)))?{id:e.id,k:hpBytes(e.k)}:null; }catch(e){ return null; } }
async function hpCpsZip(u8){ try{ if(typeof CompressionStream==='undefined') return null; return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer()); }catch(e){ return null; } }
async function hpCpsUnzip(u8){ return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate'))).arrayBuffer()); }
function hpCpsAd(h){ return hp5U('handpost-cap:v1:'+JSON.stringify([h.f,h.m,h.fd,h.ds,h.fp.x,h.fp.n,h.fp.s,h.kid,h.to,h.at,h.id,h.k,h.pq,h.e,h.z])); }
function hpCpsKey(s,dh1,dh2,pair,eph,toX,id){ return s.crypto_generichash(32, hp5Cat(hp5U('handpost-cap-key'), eph, toX, hp5U(String(id))), s.crypto_generichash(32, hp5Cat(dh1, dh2, pair))); }

async function hpCpsSeal(peer,dev,body,type,callId,why){
  const xf=String(arguments[6]||'');
  const s=hp5S(), card=hpCardOf(peer), now=Date.now(); if(!card||!Array.isArray(card.prekeys)){ if(why) why.push('nocard'); return null; }
  const pq=hpCpsPqGet(dev,null); if(!pq){ if(why) why.push('nopq'); return null; }
  const p=card.prekeys.find(q=>q&&q.dev===dev&&hp5PreOk(dev,q.x25519,q.notAfter,q.sig,now)); if(!p){ if(why) why.push('nopre'); return null; }
  const me=await hp5Me(), mine=me.pre, toX=hpBytes(p.x25519), eph=s.crypto_box_keypair();
  const raw=hp5U(String(body)); let z=await hpCpsZip(raw), zf=1; if(!z){ z=raw; zf=0; }
  const h={v:1,f:me.id,m:me.master,fd:me.dev,ds:me.devSig,fp:{x:mine.x,n:mine.notAfter,s:mine.sig},kid:String(p.x25519).slice(0,16),to:dev,at:now,id:String(callId||''),k:String(type||''),pq:pq.id,e:hp5B64(eph.publicKey),z:zf};
  const key=hpCpsKey(s, s.crypto_scalarmult(eph.privateKey,toX), s.crypto_scalarmult(hpBytes(mine.priv),toX), pq.k, eph.publicKey, toX, h.id);
  const n=s.randombytes_buf(24); h.c=hp5B64(hp5Cat(n, s.crypto_aead_xchacha20poly1305_ietf_encrypt(z, hpCpsAd(h), null, n, key))); if(xf) h.x=xf;
  const out=JSON.stringify(h); if(out.length>HP_CPS_MAX){ if(why) why.push('big'); return null; } return out; }

async function hpCpsOpen(text){
  const s=hp5S(), h=JSON.parse(String(text)); if(!h||h.v!==1||typeof h.c!=='string'||!h.fp||typeof h.e!=='string') throw new Error('形が違う');
  const kp=await hpDevKey(), myDev=hpHex(kp.publicKey); if(h.to!==myDev) throw new Error('別の端末あて');
  const c=contacts().find(x=>x.address===h.f); if(!c) throw new Error('連絡先にない'); if(c.pubKey&&c.pubKey!==h.m) throw new Error('マスター鍵が連絡先のものと違う');
  if(!(await hp5IdOk(h.f,h.m,h.fd,h.ds))) throw new Error('送り手の身元を確かめられない'); if(!hp5PreOk(h.fd,h.fp.x,h.fp.n,h.fp.s,Number(h.at)||0)) throw new Error('送り手の受け取り用の鍵を確かめられない');
  const pq=hpCpsPqGet(h.fd,h.pq); if(!pq) throw new Error('合わせ鍵が無い');
  const pre=(await hp5Prekeys()).find(p=>p.x.slice(0,16)===h.kid); if(!pre) throw new Error('開ける鍵が無い');
  const myX=hpBytes(pre.x), myPriv=hpBytes(pre.priv), eph=hp5Un64(h.e), fromX=hpBytes(h.fp.x), ct=hp5Un64(h.c);
  const key=hpCpsKey(s, s.crypto_scalarmult(myPriv,eph), s.crypto_scalarmult(myPriv,fromX), pq.k, eph, myX, String(h.id||''));
  let z; try{ z=s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct.slice(24), hpCpsAd(h), ct.slice(0,24), key); }catch(e){ throw new Error('封が開かない'); }
  const raw=h.z?await hpCpsUnzip(z):z; return { from:h.f, fromMaster:h.m, fromDev:h.fd, sentAt:Number(h.at)||0, body:new TextDecoder().decode(raw), id:String(h.id||''), k:String(h.k||'') }; }

async function hpCpsRing(peer,bodyObj,devs){
  const t0=Date.now(), out={sent:0,devs:[]}; try{
    const type=bodyObj&&bodyObj.type; if(HP_CPS_TYPES.indexOf(type)<0) return out; const card=hpCardOf(peer); if(!card||!Array.isArray(card.devices)) return out;
    const list=(Array.isArray(devs)&&devs.length)?card.devices.filter(d=>devs.indexOf(d)>=0):card.devices.slice(); if(!list.length) return out;
    const text=JSON.stringify(bodyObj), caps=[], why=[], xf=(type==='callend'&&String(bodyObj.why||'')==='taken')?'t':''; for(const d of list){ const c=await hpCpsSeal(peer,d,text,type,bodyObj.call,why,xf); if(c) caps.push({dev:d,blob:c}); }
    if(!caps.length){ hpLog('通話：'+HP_CPS_NAME[type]+'を通知には載せない（'+(why.indexOf('nopq')>=0?'合わせ鍵がまだ無い。次からは載る':why.indexOf('big')>=0?'大きすぎる':why.indexOf('nopre')>=0?'受け取り用の鍵が無い':'名刺が無い')+'）'); return out; }
    const w=(type==='call')?Math.max(60,Math.min(600,Math.round(Number(bodyObj.w)/1000)||60)):60, groups=hpPutGroups(card,caps), whys=[];
    await Promise.all(groups.map(async g=>{ try{ const p=await hpPoolGet(g.post,hpPutFail);
        const rep=await hpWithin(p.c.submitContractReadRequest(JSON.stringify({op:'ring',token:g.token,k:type,call:String(bodyObj.call||''),w:w,caps:g.letters.map(l=>({dev:l.dev,cap:l.blob}))}),null,HP_CPS_WAIT),HP_CPS_WAIT+500,'通知の問い合わせ');
        let o=null; try{ o=JSON.parse(rep==null?'null':hpText(rep)); }catch(e){ o=null; }
        if(o&&o.ok==='ring'){ out.sent+=Number(o.sent)||0; if(Number(o.sent)===g.letters.length) for(const l of g.letters) out.devs.push(l.dev); if(Array.isArray(o.why)) for(const x of o.why) whys.push(String(x)); }
        else hpLog('通話：通知を頼めない（'+g.post[0]+'・'+((o&&o.err)||'返事がない')+'）'); }catch(e){ hpLog('通話：通知を頼めない（'+g.post[0]+'・'+((e&&e.message)||e)+'）'); } }));
    hpLog('通話：'+HP_CPS_NAME[type]+'を通知に載せた（端末 '+caps.length+' 台のうち '+out.sent+' 台に送れた・'+caps[0].blob.length+' 文字・'+((Date.now()-t0)/1000).toFixed(1)+' 秒'+(whys.length?'・送れなかった訳 '+whys.join(' '):'')+'）'); out.why=whys;   return out;
  }catch(e){ hpLog('通話：通知に載せられない（'+((e&&e.message)||e)+'）'); return out; } }
try{ if(typeof hpCallSigPost==='function'&&!hpCallSigPost.__f209){ const f=hpCallSigPost; hpCallSigPost=Object.assign(async function(peer,body,devs){
    const type=body&&body.type; if(HP_CPS_TYPES.indexOf(type)<0) return f.apply(this,arguments);
    if(type==='call'){ let r=null; try{ r=await hpWithin(hpCpsRing(peer,body,devs),HP_CPS_CALL_WAIT,'通知の問い合わせ'); }catch(e){ r=null; } return f.call(this,peer,body,devs,(r&&r.devs.length)?{rang:r.devs}:null); }
    if(type==='callend'){ const a=arguments, rp=hpCpsRing(peer,body,devs); try{ if(typeof hpByeHold==='function') hpByeHold(rp); }catch(e){} try{ await hpWithin(rp,(typeof HP_BYE_END_WAIT==='number')?HP_BYE_END_WAIT:3000,'通知の問い合わせ'); }catch(e){} return f.apply(this,a); }
    hpCpsRing(peer,body,devs).catch(()=>{}); return f.apply(this,arguments); },f,{__f209:1}); } }catch(e){}

const HP_CPS_DB='hp-cap', HP_CPS_PEND=[], HP_CPS_SEEN=new Set(); let HP_CPS_BOOT=0;
function hpCpsDb(){ return new Promise((res,rej)=>{ try{ const q=indexedDB.open(HP_CPS_DB,1); q.onupgradeneeded=()=>{ try{ q.result.createObjectStore('cap',{keyPath:'key'}); }catch(e){} }; q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error||new Error('indexedDB')); }catch(e){ rej(e); } }); }
function hpCpsStoreAll(){ return hpCpsDb().then(db=>new Promise((res,rej)=>{ try{ const rq=db.transaction('cap','readonly').objectStore('cap').getAll(); rq.onsuccess=()=>{ try{ db.close(); }catch(e){} res(rq.result||[]); }; rq.onerror=()=>{ try{ db.close(); }catch(e){} rej(rq.error); }; }catch(e){ try{ db.close(); }catch(x){} rej(e); } })).catch(()=>[]); }
function hpCpsStoreDel(key){ return hpCpsDb().then(db=>new Promise(res=>{ try{ const tx=db.transaction('cap','readwrite'); tx.objectStore('cap').delete(key); tx.oncomplete=()=>{ try{ db.close(); }catch(e){} res(true); }; tx.onerror=()=>{ try{ db.close(); }catch(e){} res(false); }; }catch(e){ try{ db.close(); }catch(x){} res(false); } })).catch(()=>false); }
function hpCpsReady(){ try{ return !!(ID&&ID.address&&typeof hpVaultOn==='function'&&(!hpVaultOn()||VAULT)&&typeof contacts==='function'); }catch(e){ return false; } }
async function hpCpsTake(d,how){ const key=String((d&&d.key)||((d&&d.k)+':'+(d&&d.call))); try{
    if(!d||!d.cap||HP_CPS_SEEN.has(key)) return false; HP_CPS_SEEN.add(key);
    const age=Date.now()-Number(d.at||0), lim=(d.k==='call')?Math.max(60000,Math.min(600000,(Number(d.w)||60)*1000)):(HP_CPS_AGE[d.k]||90e3);
    if(age>lim||age<-60000){ hpLog('通話：通知に載ってきた'+(HP_CPS_NAME[d.k]||'合図')+'が古い（'+Math.round(age/1000)+' 秒前。捨てた）'); return false; }
    const r=await hpCpsOpen(d.cap); hpLog('通話：通知に載ってきた'+(HP_CPS_NAME[r.k]||'合図')+'を開いた（'+Math.round((Date.now()-r.sentAt)/1000)+' 秒前・'+(how==='sw'?'開いている間に届いた':how==='scan'?'開いている間に見つけた':'開いたときに読んだ')+'）');
    if(typeof rtcOnSig==='function') await rtcOnSig({from:r.from,fromMaster:r.fromMaster,fromDev:r.fromDev,sentAt:r.sentAt,body:r.body,id:'cap:'+key}); return true;
  }catch(e){ hpLog('通話：通知に載ってきた合図を開けない（'+((e&&e.message)||e)+'）'); return false; } finally{ if(d&&d.key) hpCpsStoreDel(d.key).catch(()=>{}); } }
async function hpCpsBoot(){ if(HP_CPS_BOOT) return; HP_CPS_BOOT=1; try{ const all=await hpCpsStoreAll(), now=Date.now(); all.sort((a,b)=>(Number(a&&a.at)||0)-(Number(b&&b.at)||0));
    for(const d of all){ if(!d||!d.key) continue; if(now-Number(d.at||0)>600e3){ hpCpsStoreDel(d.key).catch(()=>{}); continue; } if(String(d.key).slice(0,3)==='nm:') continue;   await hpCpsTake(d,'store'); }
    for(const d of HP_CPS_PEND.splice(0)) await hpCpsTake(d,'sw'); }catch(e){} }
function hpCpsGot(d){ try{ if(!d||!d.cap) return; if(HP_CPS_BOOT&&hpCpsReady()) hpCpsTake(d,'sw').catch(()=>{}); else HP_CPS_PEND.push(d); }catch(e){} }
try{ if(typeof navigator!=='undefined'&&navigator.serviceWorker&&navigator.serviceWorker.addEventListener) navigator.serviceWorker.addEventListener('message',ev=>{ try{ if(ev&&ev.data&&ev.data.t==='hp-cap') hpCpsGot(ev.data); }catch(e){} }); }catch(e){}
try{ if(typeof setInterval==='function'){ let n=0; const t=setInterval(()=>{ try{ if(hpCpsReady()){ clearInterval(t); hpCpsBoot(); } else if(++n>1200) clearInterval(t); }catch(e){} },500); try{ if(t&&t.unref) t.unref(); }catch(e){} } }catch(e){}

try{ if(typeof hpCallPushLog==='function'&&!hpCallPushLog.__f209){ const f=hpCallPushLog; hpCallPushLog=Object.assign(function(cr){ try{ if(cr&&cr.ro&&Number(cr.at)>0){ const k=String(cr.at)+'|ro'; if(k===HP_CALL_CR_SEEN) return false; HP_CALL_CR_SEEN=k; hpLog('通知：郵便受けが最後に電話の合図を受け付けたのは '+hpCallHm(cr.at)+'（送り手が読むだけの問い合わせで先に送っていた）'); return true; } }catch(e){} return f.apply(this,arguments); },f,{__f209:1}); } }catch(e){}

function hpCpsNamePut(call,nm){ try{ if(!/^[0-9a-f]{16}$/.test(String(call||''))||!nm) return Promise.resolve(false); return hpCpsDb().then(db=>new Promise(res=>{ try{ const tx=db.transaction('cap','readwrite'); tx.objectStore('cap').put({key:'nm:'+call,nm:String(nm).slice(0,40),at:Date.now()}); tx.oncomplete=()=>{ try{ db.close(); }catch(e){} res(true); }; tx.onerror=()=>{ try{ db.close(); }catch(e){} res(false); }; }catch(e){ try{ db.close(); }catch(x){} res(false); } })).catch(()=>false); }catch(e){ return Promise.resolve(false); } }
function hpCpsNameDel(call){ try{ if(!/^[0-9a-f]{16}$/.test(String(call||''))) return Promise.resolve(false); return hpCpsStoreDel('nm:'+call); }catch(e){ return Promise.resolve(false); } }
function hpCpsSigClose(){ try{ if(typeof navigator==='undefined'||!navigator.serviceWorker||!navigator.serviceWorker.ready) return; navigator.serviceWorker.ready.then(r=>r.getNotifications({tag:'hp-sig'})).then(l=>{ for(const n of (l||[])) try{ n.close(); }catch(e){} }).catch(()=>{}); }catch(e){} }
try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f211){ const f=hpCallSig; hpCallSig=Object.assign(async function(peer,body,devs){ try{ if(body&&(body.type==='call'||body.type==='callans')) hpCpsNamePut(body.call,nickOf(peer)).catch(()=>{}); }catch(e){} return f.apply(this,arguments); },f,{__f211:1}); } }catch(e){}
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f211){ const f=hpCallEnd; hpCallEnd=Object.assign(function(){ const C=HP_CALL; const r=f.apply(this,arguments); try{ if(C&&C.id) setTimeout(()=>{ hpCpsNameDel(C.id).catch(()=>{}); },5000); }catch(e){} return r; },f,{__f211:1}); } }catch(e){}
try{ if(typeof hpCpsTake==='function'&&!hpCpsTake.__f211){ const f=hpCpsTake; hpCpsTake=Object.assign(async function(){ const v=await f.apply(this,arguments); try{ if(v===true) hpCpsSigClose(); }catch(e){} return v; },f,{__f211:1}); } }catch(e){}
try{ if(typeof hpCpsRing==='function'&&!hpCpsRing.__f211){ const f=hpCpsRing; hpCpsRing=Object.assign(async function(peer,bodyObj,devs){ const r=await f.apply(this,arguments);
    try{ if(r&&Number(r.sent)>0&&bodyObj&&bodyObj.type==='callans'){ const C=HP_CALL; if(C&&C.dir==='in'&&C.id===bodyObj.call&&C.peer===peer&&C.st==='connecting'&&C.cands&&!C.goSelf){ C.goSelf=1;
      setTimeout(async()=>{ try{ if(HP_CALL!==C||C.st!=='connecting'||!C.cands) return; const cs=C.cands; C.cands=null; const n=await hpCallAddCands(C,cs); hpCallIceGo(C); hpLog('通話：答えを通知に載せられたので、投函を待たずに線をつなぎ始めた（'+n+'）'); }catch(e){} },HP_CALL_GO_SELF); } } }catch(e){} return r; },f,{__f211:1}); } }catch(e){}

const HP_CPS_SCAN_MS=3000; let HP_CPS_SCAN_BUSY=0;
const HP_CPS_SCAN_FAST=1000;
function hpCpsFrom(cap){ try{ const h=JSON.parse(String(cap||'')); return (h&&typeof h.f==='string')?h.f:''; }catch(e){ return ''; } }
async function hpCpsScan(how){ if(HP_CPS_SCAN_BUSY) return 0; HP_CPS_SCAN_BUSY=1; let n=0; try{ const all=await hpCpsStoreAll(), now=Date.now(), list=[];
    for(const d of all){ if(!d||!d.key) continue; const k=String(d.key); if(now-Number(d.at||0)>600e3){ hpCpsStoreDel(k).catch(()=>{}); continue; } if(k.slice(0,3)==='nm:'||!d.cap) continue; if(HP_CPS_SEEN.has(k)){ hpCpsStoreDel(k).catch(()=>{}); continue; } list.push(d); }
    if(!list.length) return 0; list.sort((a,b)=>(Number(b.at)||0)-(Number(a.at)||0));
    const ends=new Set(list.filter(d=>d.k==='callend').map(d=>String(d.call||''))), newest={}; for(const d of list){ if(d.k!=='call') continue; const f=hpCpsFrom(d.cap); if(f&&!newest[f]) newest[f]=d; }
    for(const d of list){ const k=String(d.key);
      if(d.k==='call'){ const f=hpCpsFrom(d.cap), ended=ends.has(String(d.call||'')), older=!!(f&&newest[f]&&newest[f]!==d);
        if(ended||older){ try{ if(typeof hpChMissEnsure==='function'&&f) hpChMissEnsure(f,Number(d.at)||0,String(d.call||'')); }catch(x){}   HP_CPS_SEEN.add(k); hpCpsStoreDel(k).catch(()=>{}); hpLog('通話：通知に載ってきた古い呼び出しを捨てた（'+Math.round((now-Number(d.at||0))/1000)+' 秒前・'+(ended?'もう切られている':'新しい呼び出しがある')+'）'); continue; } }
      try{ if(await hpCpsTake(d,how)) n++; }catch(e){} }
  }catch(e){} finally{ HP_CPS_SCAN_BUSY=0; } return n; }
try{ if(typeof hpCpsBoot==='function'&&!hpCpsBoot.__f212){ hpCpsBoot=Object.assign(async function(){ if(HP_CPS_BOOT) return; HP_CPS_BOOT=1; try{ await hpCpsScan('store'); for(const d of HP_CPS_PEND.splice(0)) await hpCpsTake(d,'sw'); }catch(e){} },{__f212:1}); } }catch(e){}
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f212){ const f=hpCallEnd; hpCallEnd=Object.assign(function(){ const C=HP_CALL; const r=f.apply(this,arguments); try{ if(C&&/^[0-9a-f]{16}$/.test(String(C.id||''))) for(const k of HP_CPS_TYPES){ HP_CPS_SEEN.add(k+':'+C.id); hpCpsStoreDel(k+':'+C.id).catch(()=>{}); } }catch(e){} return r; },f,{__f212:1}); } }catch(e){}
try{ if(typeof setInterval==='function'){ let n=0; const t=setInterval(()=>{ try{ n++; const busy=!!(HP_CALL&&HP_CALL.st!=='ended'); if(!busy&&(n%3)) return;   if(HP_CPS_BOOT&&hpCpsReady()) hpCpsScan('scan').catch(()=>{}); }catch(e){} },HP_CPS_SCAN_FAST); try{ if(t&&t.unref) t.unref(); }catch(e){} } }catch(e){}

function hpSwMsgStart(){ try{ if(typeof navigator==='undefined'||!navigator.serviceWorker||typeof navigator.serviceWorker.startMessages!=='function') return false; navigator.serviceWorker.startMessages(); return true; }catch(e){ return false; } }
try{ hpSwMsgStart(); }catch(e){}

const HP_CPS_BC='hp-cap', HP_CPS_GAP_RETRY=5500;
function hpCpsBcStart(){ try{ if(typeof BroadcastChannel!=='function') return null; const bc=new BroadcastChannel(HP_CPS_BC); bc.onmessage=ev=>{ try{ if(ev&&ev.data&&ev.data.t==='hp-cap') hpCpsGot(ev.data); }catch(e){} }; return bc; }catch(e){ return null; } }
var HP_CPS_BCH=null; try{ HP_CPS_BCH=hpCpsBcStart(); }catch(e){}
function hpCpsAllGap(r){ return !!(r&&Number(r.sent)===0&&Array.isArray(r.why)&&r.why.length>0&&r.why.every(x=>x==='gap')); }
try{ if(typeof hpCpsRing==='function'&&!hpCpsRing.__f214){ const f=hpCpsRing; hpCpsRing=Object.assign(async function(peer,bodyObj,devs){ const r=await f.apply(this,arguments);
    try{ const call=(bodyObj&&bodyObj.type==='call')?String(bodyObj.call||''):''; if(call&&hpCpsAllGap(r)&&!(typeof HP_CPS_RERING_ON!=='undefined'&&HP_CPS_RERING_ON)){   hpLog('通話：呼び出しの通知は郵便受けが「送ったばかり」で断った（'+(HP_CPS_GAP_RETRY/1000)+' 秒後にもう一度送る）');
        setTimeout(()=>{ try{ if(!HP_CALL||String(HP_CALL.id||'')!==call||HP_CALL.st!=='calling') return; f.call(this,peer,bodyObj,devs).then(x=>{ hpLog('通話：呼び出しの通知を送り直した（'+((x&&x.sent)?x.sent+' 台に送れた':'また送れなかった')+'）'); }).catch(()=>{}); }catch(e){} },HP_CPS_GAP_RETRY); } }catch(e){}
    return r; },f,{__f214:1}); } }catch(e){}

var HP_CPS_RERING_ON=0  , HP_CPS_RERING_SET=new Set(); const HP_CPS_RERING_MS=6000, HP_CPS_RERING_FOR=45000;
function hpCpsReRing(f,peer,bodyObj,devs){ const call=String((bodyObj&&bodyObj.call)||''), t0=Date.now(); let n=0, sent=0;
  const live=()=>!!(HP_CALL&&String(HP_CALL.id||'')===call&&HP_CALL.st==='calling'), stop=w=>{ hpLog('通話：呼び出しの通知の鳴らし直しを止めた（'+n+' 回・送れたのは '+sent+' 回・'+w+'）'); };
  const tick=()=>{ try{ if(!live()) return stop('呼び出し中でなくなった'); if(Date.now()-t0>=HP_CPS_RERING_FOR) return stop((HP_CPS_RERING_FOR/1000)+' 秒たった'); n++;
      Promise.resolve().then(()=>f(peer,bodyObj,devs)).catch(()=>null).then(x=>{ if(x&&Number(x.sent)>0) sent++; setTimeout(tick,HP_CPS_RERING_MS); }); }catch(e){} };
  hpLog('通話：呼び出しの通知を '+(HP_CPS_RERING_MS/1000)+' 秒おきに鳴らし直す（呼び出し中の間・'+(HP_CPS_RERING_FOR/1000)+' 秒まで）'); setTimeout(tick,HP_CPS_RERING_MS); return true; }
try{ if(typeof hpCpsRing==='function'&&!hpCpsRing.__f215){ const f=hpCpsRing; hpCpsRing=Object.assign(async function(peer,bodyObj,devs){ const r=await f.apply(this,arguments);
    try{ const call=(bodyObj&&bodyObj.type==='call')?String(bodyObj.call||''):''; if(HP_CPS_RERING_ON&&/^[0-9a-f]{16}$/.test(call)&&!HP_CPS_RERING_SET.has(call)){ HP_CPS_RERING_SET.add(call); hpCpsReRing(f,peer,bodyObj,devs); } }catch(e){}
    return r; },f,{__f215:1}); } }catch(e){}

const HP_VM_WHY=['timeout','peer:busy','fail','lost','hangup'], HP_VM_LANG={ja:'ja-JP',en:'en-US',fr:'fr-FR',de:'de-DE',pl:'pl-PL'}, HP_VM_SAY_MAX=9000;
function hpVmOk(C){ try{ return !!(C&&C.dir==='out'&&C.peer&&!C.talkAt&&HP_VM_WHY.indexOf(String(C.why||''))>=0&&C.endText!==T('cl_nomic')&&!(typeof hpBlocked==='function'&&hpBlocked(C.peer))); }catch(e){ return false; } }
function hpVmBeep(ac){ return new Promise(res=>{ try{ if(!ac) return res(false); const o=ac.createOscillator(), g=ac.createGain(); o.type='sine'; o.frequency.value=1000; g.gain.value=0.2; o.connect(g); g.connect(ac.destination); const t=ac.currentTime||0; o.onended=()=>res(true); o.start(t); o.stop(t+0.45); setTimeout(()=>res(true),800); }catch(e){ res(false); } }); }
function hpVmSay(text,lang){ return new Promise(res=>{ let done=false; const end=v=>{ if(!done){ done=true; res(v); } }; try{ const ss=(typeof speechSynthesis!=='undefined')?speechSynthesis:null; if(!ss||typeof SpeechSynthesisUtterance==='undefined') return end(false);
    const u=new SpeechSynthesisUtterance(text), bc=HP_VM_LANG[lang]||'en-US'; u.lang=bc; try{ const vs=ss.getVoices()||[]; const v=vs.find(x=>x&&x.lang===bc)||vs.find(x=>x&&String(x.lang||'').slice(0,2)===bc.slice(0,2)); if(v) u.voice=v; }catch(e){}
    u.onend=()=>end(true); u.onerror=()=>end(false); try{ ss.cancel(); }catch(e){} ss.speak(u); setTimeout(()=>end(false),HP_VM_SAY_MAX); }catch(e){ end(false); } }); }
async function hpVmGo(peer){ try{ if(!peer) return false; let ac=null, own=false; try{ if(typeof HP_CALL_AC!=='undefined'&&HP_CALL_AC){ ac=HP_CALL_AC; if(ac.state==='suspended'&&ac.resume) Promise.resolve(ac.resume()).catch(()=>{}); } }catch(e){ ac=null; }
    if(!ac){ try{ const A=(typeof AudioContext!=='undefined')?AudioContext:((typeof webkitAudioContext!=='undefined')?webkitAudioContext:null); if(A){ ac=new A(); own=true; if(ac.resume) Promise.resolve(ac.resume()).catch(()=>{}); } }catch(e){ ac=null; } }
    try{ if(typeof openConversation==='function') openConversation(peer); }catch(e){}
    const text=T('vm_greet'), lang=(typeof curLang==='function')?curLang():'ja'; try{ hpToast(text,HP_VM_SAY_MAX); }catch(e){}
    const said=await hpVmSay(text,lang); hpLog('通話：伝言の前の応答の声'+(said?'を読み上げた（'+(HP_VM_LANG[lang]||'en-US')+'）':'は読み上げられなかった（画面に文を出した）'));
    await hpVmBeep(ac); try{ if(own&&ac&&ac.close) Promise.resolve(ac.close()).catch(()=>{}); }catch(e){} try{ hpToastHide(); }catch(e){}
    const ok=await hpVcStart(); hpLog('通話：伝言の録音を'+(ok?'始めた':'始められない')); return !!ok; }catch(e){ hpLog('通話：伝言を残せない（'+((e&&e.message)||e)+'）'); return false; } }
try{ if(typeof hpCallBar==='function'&&!hpCallBar.__f217){ const f=hpCallBar; hpCallBar=Object.assign(function(C){ const r=f.apply(this,arguments);
    try{ if(hpVmOk(C)){ const b=document.getElementById('hp-call-bar'), re=b&&b.querySelector('button.re'); if(b&&re&&!b.querySelector('button.vm')){ const v=document.createElement('button'); v.type='button'; v.className='vm'; v.textContent=T('btn_vmsg');
          v.onclick=()=>{ hpCallBar(null); if(HP_CALL&&HP_CALL.st==='ended'){ HP_CALL=null; hpCallUi(); } hpVmGo(C.peer).catch(()=>{}); }; b.insertBefore(v,re); } } }catch(e){}
    return r; },f,{__f217:1}); } }catch(e){}

const HP_VM_KEY='p2p_vmsec', HP_VM_SECS=['0','20','30','45','60'], HP_VM_DEF='30';
function hpVmSec(){ try{ const v=String(localStorage.getItem(HP_VM_KEY)||''); return Number(HP_VM_SECS.indexOf(v)>=0?v:HP_VM_DEF); }catch(e){ return Number(HP_VM_DEF); } }
function hpVmSecSet(v){ try{ if(HP_VM_SECS.indexOf(String(v))>=0){ localStorage.setItem(HP_VM_KEY,String(v)); return true; } }catch(e){} return false; }
function hpVmPrime(){ try{ if(typeof speechSynthesis==='undefined'||typeof SpeechSynthesisUtterance==='undefined') return false; const u=new SpeechSynthesisUtterance(' '); u.volume=0; speechSynthesis.speak(u); return true; }catch(e){ return false; } }
function hpVmAuto(C){ try{ if(!C||HP_CALL!==C||C.st!=='calling'||C.dir!=='out') return false; C.vm=1; hpLog('通話：'+(C.vmS||'')+' 秒たっても出なかったので、音声メッセージに切り替えた');
    hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); if(HP_CALL===C){ HP_CALL=null; hpCallUi(); } hpVmGo(C.peer).catch(()=>{}); return true; }catch(e){ hpLog('通話：音声メッセージに切り替えられない（'+((e&&e.message)||e)+'）'); return false; } }
function hpVmArm(C){ try{ const s=hpVmSec(); if(!s||!C||C.dir!=='out'||C.vmOn) return false; C.vmOn=1; C.vmS=s; hpVmPrime(); C.vmT=setTimeout(()=>hpVmAuto(C),s*1000); return true; }catch(e){ return false; } }
function hpVmRow(){ try{ if(typeof document==='undefined') return false; const c=document.getElementById('set-call'); if(!c||document.getElementById('set-vm')) return false;
    const r=document.createElement('div'); r.className='kv'; r.id='set-vm'; r.style.marginTop='8px'; const b=document.createElement('b'); b.textContent=T('cl_vm_l'); b.setAttribute('data-i18n','cl_vm_l'); r.appendChild(b);
    const s=document.createElement('select'); s.style.cssText='background:#1b2740;border:none;border-radius:6px;color:inherit;padding:4px 6px'; for(const v of HP_VM_SECS){ const o=document.createElement('option'); o.value=v; o.textContent=T('cl_vm_'+v); o.setAttribute('data-i18n','cl_vm_'+v); s.appendChild(o); }
    s.value=String(hpVmSec()); s.onchange=()=>{ if(hpVmSecSet(s.value)) hpLog('設定：音声メッセージ '+(s.value==='0'?'使わない':s.value+' 秒で切り替える')); }; r.appendChild(s); c.appendChild(r); return true; }catch(e){ return false; } }
try{ if(typeof hpCallStart==='function'&&!hpCallStart.__f219){ const f=hpCallStart; hpCallStart=Object.assign(function(peer){ const p=f.apply(this,arguments);
    try{ const C=HP_CALL; if(C&&C.dir==='out'&&C.st==='calling'&&C.peer===String(peer||'').trim()) hpVmArm(C); }catch(e){} return p; },f,{__f219:1}); } }catch(e){}
try{ if(typeof hpCallBar==='function'&&!hpCallBar.__f219){ const f=hpCallBar; hpCallBar=Object.assign(function(C){ if(C&&C.vm) return f.call(this,null); return f.apply(this,arguments); },f,{__f219:1}); } }catch(e){}
try{ if(typeof hpRingCard==='function'&&!hpRingCard.__f219){ const f=hpRingCard; hpRingCard=Object.assign(function(){ const r=f.apply(this,arguments); hpVmRow(); return r; },f,{__f219:1}); } }catch(e){}

const HP_VM_CSS='#hp-vm{position:fixed;inset:0;z-index:9000;background:#121820;color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:24px;text-align:center}'
 +'#hp-vm .who{font-size:1.5em;font-weight:600;max-width:90vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#hp-vm .st{font-size:1.05em;opacity:.9}#hp-vm .st .dot{color:#ff5a5a;margin-right:6px}'
 +'#hp-vm .msg{font-size:.9em;opacity:.75;max-width:30em;line-height:1.6}#hp-vm .btns{display:flex;flex-direction:column;align-items:center;gap:16px;margin-top:14px}'
 +'#hp-vm button{border:0;color:#fff;cursor:pointer}#hp-vm button.vend{background:#d64545;border-radius:40px;min-width:220px;padding:18px 28px;font-size:1.2em;font-weight:600}'
 +'#hp-vm .sub{display:flex;gap:16px}#hp-vm button.vsub{background:#2a3550;border-radius:22px;padding:10px 20px;font-size:1em}';
let HP_VMR=null, HP_VMR_GEN=0;
function hpVmEl(){ let d=document.getElementById('hp-vm'); if(d) return d;
  try{ if(document.head&&!document.getElementById('hp-vm-css')){ const st=document.createElement('style'); st.id='hp-vm-css'; st.textContent=HP_VM_CSS; document.head.appendChild(st); } }catch(e){}
  d=document.createElement('div'); d.id='hp-vm'; const E=(cls)=>{ const x=document.createElement('div'); x.className=cls; return x; };
  const who=E('who'), st=E('st'), msg=E('msg'), btns=E('btns'), sub=E('sub');
  const B=(cls,k,fn)=>{ const b=document.createElement('button'); b.type='button'; b.className=cls; b.textContent=T(k); b.onclick=fn; return b; };
  d.__end=B('vend','btn_vm_end',()=>{ hpVmEnd().catch(()=>{}); }); d.__redo=B('vsub','btn_vm_redo',()=>{ hpVmRedo().catch(()=>{}); }); d.__cancel=B('vsub','btn_vm_cancel',()=>hpVmCancel());
  sub.appendChild(d.__redo); sub.appendChild(d.__cancel); btns.appendChild(d.__end); btns.appendChild(sub);
  d.appendChild(who); d.appendChild(st); d.appendChild(msg); d.appendChild(btns); d.__who=who; d.__st=st; d.__msg=msg;
  (document.body||document.documentElement).appendChild(d); return d; }
function hpVmUi(){ try{ const R=HP_VMR; let d=document.getElementById('hp-vm'); if(!R){ if(d) d.style.display='none'; return; } d=hpVmEl(); d.style.display='flex';
    d.__who.textContent=nickOf(R.peer); d.__st.textContent=''; const rec=(R.st==='rec');
    if(rec){ const dot=document.createElement('span'); dot.className='dot'; dot.textContent='●'; d.__st.appendChild(dot); d.__st.appendChild(document.createTextNode(TF('vc_rec',{t:hpVcClock(Date.now()-R.t0),max:hpVcClock(HP_VC_MAX)}))); }
    else d.__st.textContent=T(R.st==='send'?'vm_st_send':'vm_st_greet');
    d.__msg.textContent=(R.st==='greet')?T('vm_greet'):''; d.__end.style.display=rec?'':'none'; d.__redo.style.display=rec?'':'none'; d.__cancel.style.display=(R.st==='send')?'none':''; }catch(e){ try{ hpLog('通話：音声メッセージの画面を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} } }
function hpVmStopRec(R){ try{ if(!R) return; if(R.tick){ clearInterval(R.tick); R.tick=null; } if(R.cap){ clearTimeout(R.cap); R.cap=null; } if(R.rec){ R.rec.onstop=null; R.rec.ondataavailable=null; if(R.rec.state!=='inactive') R.rec.stop(); } R.rec=null; if(R.stream){ R.stream.getTracks().forEach(t=>t.stop()); } R.stream=null; }catch(e){} }
function hpVmClose(){ const R=HP_VMR; HP_VMR=null; HP_VMR_GEN++; try{ hpVmStopRec(R); if(R&&R.own&&R.ac&&R.ac.close) Promise.resolve(R.ac.close()).catch(()=>{}); }catch(e){} hpVmUi(); }
async function hpVmRec(R){ try{ if(HP_VMR!==R) return false; await hpVmBeep(R.ac); if(HP_VMR!==R) return false; const ty=hpVcType();
    if(!ty||typeof navigator==='undefined'||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ try{ hpToast(T('vc_nosup'),5000); }catch(e){} hpLog('通話：音声メッセージを録音できない（この端末では録音できない）'); hpVmClose(); return false; }
    let s=null; try{ s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}); }catch(e){ try{ hpToast(hpVcErr(e),8000); }catch(_){} hpVmClose(); return false; }
    if(HP_VMR!==R){ try{ s.getTracks().forEach(t=>t.stop()); }catch(e){} return false; }
    const rec=new MediaRecorder(s,{mimeType:ty.m,audioBitsPerSecond:HP_VC_KB}); R.stream=s; R.rec=rec; R.ty=ty; R.parts=[]; R.t0=Date.now(); R.st='rec';
    rec.ondataavailable=e=>{ if(e.data&&e.data.size&&R.rec===rec) R.parts.push(e.data); }; rec.start(1000);
    R.tick=setInterval(hpVmUi,500); R.cap=setTimeout(()=>{ hpVmEnd().catch(()=>{}); },HP_VC_MAX); hpVmUi(); hpLog('通話：音声メッセージの録音を始めた'); return true; }catch(e){ hpLog('通話：音声メッセージの録音を始められない（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } }
async function hpVmEnd(){ const R=HP_VMR; if(!R||R.st!=='rec'||!R.rec) return false; R.st='send'; const rec=R.rec, ms=Date.now()-R.t0; if(R.tick){ clearInterval(R.tick); R.tick=null; } if(R.cap){ clearTimeout(R.cap); R.cap=null; } hpVmUi();
  try{ await new Promise(res=>{ rec.onstop=()=>res(true); try{ if(rec.state!=='inactive') rec.stop(); else res(true); }catch(e){ res(false); } setTimeout(()=>res(false),3000); });
    if(HP_VMR!==R) return false; const at=Date.now(), f=new File(R.parts,hpVcName(ms,at,R.ty.e),{type:R.ty.m.split(';')[0]}); hpVmStopRec(R);
    try{ if(typeof openConversation==='function') openConversation(R.peer); }catch(e){} if(typeof sendFile==='function') await sendFile(f);
    hpLog('通話：音声メッセージを送った（'+hpVcClock(ms)+'）'); hpVmClose(); return true; }catch(e){ hpLog('通話：音声メッセージを送れなかった（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } }
async function hpVmRedo(){ const R=HP_VMR; if(!R||R.st!=='rec') return false; hpVmStopRec(R); R.st='beep'; R.parts=[]; hpVmUi(); hpLog('通話：音声メッセージを録り直す'); return hpVmRec(R); }
function hpVmCancel(){ const R=HP_VMR; if(!R) return false; try{ if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); }catch(e){} hpLog('通話：音声メッセージをキャンセルした'); hpVmClose(); return true; }
hpVmGo=async function(peer){ try{ if(!peer||HP_VMR) return false; let ac=null, own=false; try{ if(typeof HP_CALL_AC!=='undefined'&&HP_CALL_AC){ ac=HP_CALL_AC; if(ac.state==='suspended'&&ac.resume) Promise.resolve(ac.resume()).catch(()=>{}); } }catch(e){ ac=null; }
    if(!ac){ try{ const A=(typeof AudioContext!=='undefined')?AudioContext:((typeof webkitAudioContext!=='undefined')?webkitAudioContext:null); if(A){ ac=new A(); own=true; if(ac.resume) Promise.resolve(ac.resume()).catch(()=>{}); } }catch(e){ ac=null; } }
    const R={peer:String(peer),st:'greet',ac:ac,own:own,gen:++HP_VMR_GEN}; HP_VMR=R; hpVmUi();
    const lang=(typeof curLang==='function')?curLang():'ja', said=await hpVmSay(T('vm_greet'),lang); if(HP_VMR!==R) return false;
    hpLog('通話：音声メッセージの応答の声'+(said?'を読み上げた（'+(HP_VM_LANG[lang]||'en-US')+'）':'は読み上げられなかった（画面に文を出した）')); R.st='beep'; hpVmUi(); return await hpVmRec(R); }catch(e){ hpLog('通話：音声メッセージを始められない（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } };

const HP_VMB_CSS='#hp-vm .vmb{display:none;flex-direction:column;align-items:stretch;gap:6px;width:min(92vw,420px);box-sizing:border-box;border-radius:12px;padding:8px 10px;background:rgba(226,59,59,.20);border:2px solid #ff5a5a;animation:hpvmglow 1.4s ease-in-out infinite;text-align:left}'
 +'@keyframes hpvmglow{50%{box-shadow:0 0 0 4px rgba(255,90,90,.35)}}#hp-vm .vmb .vc-h{display:flex;align-items:center;font-size:13px;font-weight:700;color:#ff8a8a}#hp-vm .vmb .vc-r{display:flex;align-items:center;gap:8px}'
 +'#hp-vm .vmb .vc-dot{color:#ff5a5a;animation:hpvmbl 1s infinite}@keyframes hpvmbl{50%{opacity:.2}}#hp-vm .vmb .vc-eq{display:flex;align-items:center;gap:2px;height:30px;flex:1;min-width:0}'
 +'#hp-vm .vmb .vc-eq i{display:block;flex:1;max-width:6px;min-width:2px;height:4px;border-radius:2px;background:#ff8a8a;transition:height .08s}#hp-vm .vmb .vc-eq.fake i{animation:hpvmeq .9s ease-in-out infinite}@keyframes hpvmeq{0%,100%{height:4px}50%{height:24px}}'
 +'#hp-vm .vmb .vc-t{font-size:12px;color:#ffd0d0;white-space:nowrap}#hp-vm .vmb button.vstop{background:#e23b3b;color:#fff;border:none;border-radius:20px;padding:8px 16px;font-weight:700;font-size:15px;white-space:nowrap}';
const HP_VMB_EQN=20, HP_VM_RETRY_MS=1500; let HP_VM_U=null;
function hpVmBandCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-vmb-css')) return false; const st=document.createElement('style'); st.id='hp-vmb-css'; st.textContent=HP_VMB_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
function hpVmEqRun(eq,R){ let an=null, src=null, dt=null; try{ const ac=R.ac; if(ac&&ac.state!=='closed'&&ac.createMediaStreamSource&&R.stream&&typeof requestAnimationFrame==='function'){ src=ac.createMediaStreamSource(R.stream); an=ac.createAnalyser(); an.fftSize=64; an.smoothingTimeConstant=0.55; src.connect(an); dt=new Uint8Array(an.frequencyBinCount); } }catch(e){ an=null; }
  if(!an){ eq.className='vc-eq fake'; return 'fake'; } const rec=R.rec, n=eq.children.length;
  const step=()=>{ if(HP_VMR!==R||R.rec!==rec){ try{ src.disconnect(); }catch(e){} return; } try{ an.getByteFrequencyData(dt); for(let i=0;i<n;i++){ const x=dt[Math.min(dt.length-1,1+Math.floor(i*(dt.length-2)/n))]||0; eq.children[i].style.height=(4+Math.round(x/255*26))+'px'; } }catch(e){} requestAnimationFrame(step); };
  requestAnimationFrame(step); return 'live'; }
function hpVmBand(d,R){ let b=d.__band; if(!b){ b=document.createElement('div'); b.className='vmb'; d.insertBefore(b,d.__end.parentNode); d.__band=b; }
  if(!R||R.st!=='rec'||!R.rec){ b.style.display='none'; b.__r=null; return b; } b.style.display='flex'; const t=TF('vc_rec',{t:hpVcClock(Date.now()-R.t0),max:hpVcClock(HP_VC_MAX)});
  if(b.__r===R.rec&&b.__tx){ b.__tx.textContent=t; return b; } b.textContent=''; b.__r=R.rec;
  const E=(tag,c,x)=>{ const e=document.createElement(tag); if(c) e.className=c; if(x!=null) e.textContent=x; return e; };
  const h=E('div','vc-h'); h.appendChild(E('span','','🎤 '+T('cl_vm_l'))); b.appendChild(h); const r=E('div','vc-r'); b.appendChild(r);
  r.appendChild(E('span','vc-dot','●')); const eq=E('div','vc-eq'); for(let i=0;i<HP_VMB_EQN;i++){ const k=E('i'); k.style.animationDelay=((i*37)%90/100)+'s'; eq.appendChild(k); } r.appendChild(eq);
  const tx=E('span','vc-t',t); r.appendChild(tx); const s=E('button','vstop','■ '+T('btn_vm_end')); s.type='button'; s.onclick=()=>{ hpVmEnd().catch(()=>{}); }; r.appendChild(s); b.__tx=tx; b.__eq=eq; b.__eqm=hpVmEqRun(eq,R); return b; }
hpVmUi=function(){ try{ const R=HP_VMR; let d=document.getElementById('hp-vm'); if(!R){ if(d) d.style.display='none'; return; } d=hpVmEl(); hpVmBandCss(); d.style.display='flex';
    d.__who.textContent=nickOf(R.peer); const rec=(R.st==='rec'), send=(R.st==='send'); hpVmBand(d,R);
    d.__st.style.display=rec?'none':''; d.__st.textContent=rec?'':T(send?'vm_st_send':'vm_st_greet'); d.__msg.textContent=(R.st==='greet')?T('vm_greet'):'';
    d.__end.style.display='none'; d.__redo.style.display=rec?'':'none'; d.__cancel.style.display=send?'none':''; }catch(e){ try{ hpLog('通話：音声メッセージの画面を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} } };

function hpVmSayMax(t){ return Math.max(HP_VM_SAY_MAX,3000+String(t||'').length*220); }
hpVmSay=function(text,lang){ return new Promise(res=>{ let done=false, started=false, tries=0, why='', nv=0; const bc=HP_VM_LANG[lang]||'en-US';
    const end=v=>{ if(done) return; done=true; try{ hpLog('通話：音声メッセージの読み上げ '+(v===true?'できた':v?'やめた':'できない')+'（'+bc+'・声 '+nv+'・'+(tries)+' 回'+(why?'・'+why:'')+'）'); }catch(e){} res(v); };
    try{ const ss=(typeof speechSynthesis!=='undefined')?speechSynthesis:null; if(!ss||typeof SpeechSynthesisUtterance==='undefined'){ why='読み上げの仕組みが無い'; return end(false); }
      const go=()=>{ if(done) return; tries++; const u=new SpeechSynthesisUtterance(text); u.lang=bc; u.volume=1; u.rate=1; u.__live=1;
        try{ const vs=ss.getVoices()||[]; nv=vs.length; const v=((typeof hpVmVoice==='function')?hpVmVoice(vs,bc):null)||vs.find(x=>x&&x.lang===bc)||vs.find(x=>x&&String(x.lang||'').replace('_','-').slice(0,2)===bc.slice(0,2)); if(v) u.voice=v; }catch(e){}
        u.onstart=()=>{ started=true; u.__started=1; }; u.onend=()=>{ u.__live=0; end(true); };
        u.onerror=e=>{ why=String((e&&e.error)||'error'); if(u.__next){ u.__live=0; why='新しい読み上げに譲った'; return end('next'); }
          if(started&&why==='canceled'&&tries<2){ u.__live=0; u.__hold=1; started=false; why='止めた直後に消された（読み直す）'; setTimeout(go,500); return; }
          if(started||(why!=='interrupted'&&why!=='canceled')){ u.__live=0; end(false); } };
        HP_VM_U=u; try{ if(ss.paused) ss.resume(); }catch(e){} ss.speak(u);
        setTimeout(()=>{ if(done||started) return; let busy=false; try{ busy=!!ss.speaking; }catch(e){} if(busy) return; if(tries<2){ why='始まらない'; try{ ss.cancel(); }catch(e){} setTimeout(go,200); } },HP_VM_RETRY_MS); };

      let wait=0; try{ if(HP_VM_U){ if(HP_VM_U.__live) HP_VM_U.__next=1; HP_VM_U.__hold=1; } if(ss.speaking||ss.pending||(HP_VM_U&&HP_VM_U.__next)){ ss.cancel(); wait=600; } }catch(e){} setTimeout(go,wait); setTimeout(()=>{ if(!why) why='時間切れ'; end(false); },hpVmSayMax(text)); }catch(e){ why=String((e&&e.message)||e); end(false); } }); };

const HP_VMR_CSS='#hp-vm .vmb.rev{background:rgba(53,209,183,.10);border:2px solid #35d1b7;animation:none}#hp-vm .vmb.rev .vc-h{color:#35d1b7}'
 +'#hp-vm .vmb .vc-wv{display:flex;align-items:center;gap:2px;height:30px;flex:1;min-width:0}#hp-vm .vmb .vc-wv i{display:block;flex:1;max-width:6px;min-width:2px;border-radius:2px;background:#5f7896}#hp-vm .vmb .vc-wv i.on{background:#35d1b7}'
 +'#hp-vm .vmb button.vpl{background:#35d1b7;color:#06231d;border-radius:50%;width:44px;height:44px;font-size:18px;flex:0 0 auto}#hp-vm .vmb .vc-r2{justify-content:flex-end}#hp-vm .vmb button.vsend{background:#35d1b7;color:#06231d;border-radius:20px;padding:8px 22px;font-weight:700;font-size:15px}';
const HP_VMM_CSS='#hp-vm .msg.ls{text-align:left;font-size:1em;opacity:.92;max-width:26em;line-height:1.5}#hp-vm .msg.ls .ln{margin:0 0 1em 0;padding-left:1.1em;text-indent:-1.1em}#hp-vm .msg.ls .ln:last-child{margin-bottom:0}';
function hpVmLines(t){ return (String(t||'').match(/[^。．！？.!?]+[。．！？.!?]*/g)||[]).map(x=>x.trim()).filter(x=>x); }
function hpVmMsg(m,on){ try{ m.textContent=''; m.className=on?'msg ls':'msg'; if(!on) return 0; try{ if(document.head&&!document.getElementById('hp-vmm-css')){ const st=document.createElement('style'); st.id='hp-vmm-css'; st.textContent=HP_VMM_CSS; document.head.appendChild(st); } }catch(e){}
    const ls=hpVmLines(T('vm_greet')); for(const x of ls){ const d=document.createElement('div'); d.className='ln'; d.textContent='• '+x; m.appendChild(d); } return ls.length; }catch(e){ return 0; } }
function hpVmRevCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-vmr-css')) return false; const st=document.createElement('style'); st.id='hp-vmr-css'; st.textContent=HP_VMR_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
function hpVmRevDrop(R){ try{ if(!R) return; if(R.au){ try{ R.au.pause(); }catch(e){} R.au=null; } if(R.url){ try{ URL.revokeObjectURL(R.url); }catch(e){} R.url=''; } R.f=null; }catch(e){} }
function hpVmRevBand(d,R){ let b=d.__band; if(!b){ b=document.createElement('div'); d.insertBefore(b,d.__end.parentNode); d.__band=b; } if(b.__f===R.f&&b.__au) return b;
  hpVmRevCss(); b.textContent=''; b.className='vmb rev'; b.style.display='flex'; b.__f=R.f; b.__r=null; b.__tx=null;
  const E=(tag,c,x)=>{ const e=document.createElement(tag); if(c) e.className=c; if(x!=null) e.textContent=x; return e; }, B=(t,c,fn)=>{ const x=E('button',c,t); x.type='button'; x.onclick=fn; return x; };
  const h=E('div','vc-h'); h.appendChild(E('span','','🎤 '+T('cl_vm_l')+'（'+hpVcClock(R.ms)+'）')); b.appendChild(h); const r=E('div','vc-r'); b.appendChild(r);
  const au=E('audio'); au.preload='metadata'; au.style.display='none'; if(R.url) au.src=R.url; r.appendChild(au); R.au=au; b.__au=au;
  const pl=B('▶','vpl',()=>{ try{ if(au.paused!==false){ const p=au.play&&au.play(); if(p&&p.catch) p.catch(()=>{}); } else au.pause(); }catch(e){} }); r.appendChild(pl);
  const wv=E('div','vc-wv'); for(let i=0;i<32;i++){ const k=E('i'); k.style.height=(4+((i*7)%5)*4)+'px'; wv.appendChild(k); } r.appendChild(wv);
  try{ if(typeof hpVcWave==='function'){ const f=R.f; hpVcWave(f,32).then(w=>{ if(w&&HP_VMR===R&&R.f===f) for(let i=0;i<wv.children.length;i++) wv.children[i].style.height=(4+Math.round((w[i]||0)*24))+'px'; }).catch(()=>{}); } }catch(e){}
  const tm=E('span','vc-t','0:00／'+hpVcClock(R.ms)); r.appendChild(tm); b.__tm=tm; b.__wv=wv; b.__pl=pl;
  const tick=()=>{ try{ const du=(au.duration&&isFinite(au.duration))?au.duration:(R.ms/1000), c=au.currentTime||0, k=du>0?Math.round(Math.min(1,c/du)*wv.children.length):0; for(let i=0;i<wv.children.length;i++) wv.children[i].className=i<k?'on':''; tm.textContent=hpVcClock(c*1000)+'／'+hpVcClock(R.ms); }catch(e){} };
  au.onplay=()=>{ pl.textContent='❚❚'; }; au.onpause=()=>{ pl.textContent='▶'; tick(); }; au.ontimeupdate=tick; au.onended=()=>{ pl.textContent='▶'; try{ au.currentTime=0; }catch(e){} tick(); };
  const r2=E('div','vc-r vc-r2'); b.appendChild(r2); r2.appendChild(B(T('vc_send'),'vsend',()=>{ hpVmSend().catch(()=>{}); })); return b; }
hpVmEnd=async function(){ const R=HP_VMR; if(!R||R.st!=='rec'||!R.rec) return false; const rec=R.rec, ms=Date.now()-R.t0; R.st='stop'; if(R.tick){ clearInterval(R.tick); R.tick=null; } if(R.cap){ clearTimeout(R.cap); R.cap=null; } hpVmUi();
  try{ await new Promise(res=>{ rec.onstop=()=>res(true); try{ if(rec.state!=='inactive') rec.stop(); else res(true); }catch(e){ res(false); } setTimeout(()=>res(false),3000); });
    if(HP_VMR!==R) return false; const f=new File(R.parts,hpVcName(ms,Date.now(),R.ty.e),{type:R.ty.m.split(';')[0]}); hpVmStopRec(R);
    R.f=f; R.ms=ms; try{ R.url=URL.createObjectURL(f); }catch(e){ R.url=''; } R.st='rev'; hpVmUi(); hpLog('通話：音声メッセージの録音を終えた（'+hpVcClock(ms)+'。送る前に聞ける）'); return true; }catch(e){ hpLog('通話：音声メッセージの録音をまとめられない（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } };
async function hpVmSend(){ const R=HP_VMR; if(!R||R.st!=='rev'||!R.f) return false; const f=R.f, ms=R.ms; R.st='send'; try{ if(R.au) R.au.pause(); }catch(e){} hpVmUi();
  try{ try{ if(typeof openConversation==='function') openConversation(R.peer); }catch(e){} if(typeof sendFile==='function') await sendFile(f); hpLog('通話：音声メッセージを送った（'+hpVcClock(ms)+'）'); hpVmClose(); return true; }catch(e){ hpLog('通話：音声メッセージを送れなかった（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } }
hpVmRedo=async function(){ const R=HP_VMR; if(!R||(R.st!=='rec'&&R.st!=='rev')) return false; hpVmRevDrop(R); hpVmStopRec(R); R.st='beep'; R.parts=[]; hpVmUi(); hpLog('通話：音声メッセージを録り直す'); return hpVmRec(R); };
try{ if(typeof hpVmClose==='function'&&!hpVmClose.__f222){ const f=hpVmClose; hpVmClose=Object.assign(function(){ try{ hpVmRevDrop(HP_VMR); }catch(e){} return f.apply(this,arguments); },f,{__f222:1}); } }catch(e){}
hpVmUi=function(){ try{ const R=HP_VMR; let d=document.getElementById('hp-vm'); if(!R){ if(d) d.style.display='none'; return; } d=hpVmEl(); hpVmBandCss(); d.style.display='flex';
    d.__who.textContent=nickOf(R.peer); const rec=(R.st==='rec'), rev=(R.st==='rev'), send=(R.st==='send');
    if(rev&&R.f) hpVmRevBand(d,R); else { if(d.__band&&d.__band.__f){ d.__band.__f=null; d.__band.__au=null; d.__band.className='vmb'; } hpVmBand(d,R); }
    d.__st.style.display=send?'':'none'; d.__st.textContent=send?T('vm_st_send'):''; if(d.__msg.__on!==(R.st==='greet')){ d.__msg.__on=(R.st==='greet'); hpVmMsg(d.__msg,d.__msg.__on); }
    d.__end.style.display='none'; d.__redo.style.display=(rec||rev)?'':'none'; d.__cancel.style.display=send?'none':''; }catch(e){ try{ hpLog('通話：音声メッセージの画面を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} } };

const HP_CK_KEY='p2p_callkey', HP_CB_KEY='p2p_callbook', HP_CK_ROT=30*86400e3, HP_CK_LIFE=60*86400e3, HP_CB_MAX=400, HP_CB_PRUNE_MS=600e3;
let HP_CB_PRUNED=0;
function hpCkMsg(dev,x,na){ return 'handpost-callkey:v1:'+dev+':'+x+':'+na; }
function hpCkList(){ try{ const a=JSON.parse(localStorage.getItem(HP_CK_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }

function hpCkEnsure(dev,kp){
  const s=hp5S(), now=Date.now(), n0=hpCkList().length;
  let list=hpCkList().filter(k=>k&&k.dev===dev&&/^[0-9a-f]{64}$/.test(k.x)&&/^[0-9a-f]{64}$/.test(k.priv)&&k.notAfter>now), ch=list.length!==n0;
  if(!list.length||!(now-list[0].at<HP_CK_ROT)){
    const k=s.crypto_box_keypair(), x=hpHex(k.publicKey), na=now+HP_CK_LIFE;
    list.unshift({ dev:dev, x:x, priv:hpHex(k.privateKey), at:now, notAfter:na, sig:hpHex(s.crypto_sign_detached(s.from_string(hpCkMsg(dev,x,na)), kp.privateKey.slice(1))) });
    ch=true; hpLog('通話用の鍵を新しく作った '+x.slice(0,16));
  }
  if(list.length>2){ list=list.slice(0,2); ch=true; }
  if(ch) localStorage.setItem(HP_CK_KEY, JSON.stringify(list));
  try{ if(now-HP_CB_PRUNED>HP_CB_PRUNE_MS){ HP_CB_PRUNED=now; hpCbPrune(); } }catch(e){}
  return list[0];
}

function hpCkMyFp(p){ try{ const k=hpCkList()[0]; if(!k||!p||k.dev!==p.dev||!(k.notAfter>Date.now())) return null; return { x:k.x, notAfter:k.notAfter, sig:k.sig }; }catch(e){ return null; } }
function hpCkOk(dev,ck,at){
  try{
    if(!ck||typeof ck!=='object'||!/^ed[0-9a-f]{64}$/.test(dev)||!/^[0-9a-f]{64}$/.test(ck.x)||!Number.isFinite(ck.notAfter)||!(ck.notAfter>at)||typeof ck.sig!=='string'||!/^[0-9a-f]{128}$/.test(ck.sig)) return false;
    const s=hp5S(); return s.crypto_sign_verify_detached(hpBytes(ck.sig), s.from_string(hpCkMsg(dev,ck.x,ck.notAfter)), hpBytes(dev).slice(1));
  }catch(e){ return false; }
}

function hpCkFp(dev,ck,at){ return hpCkOk(dev,ck,at)?{ x:ck.x, notAfter:ck.notAfter, sig:ck.sig }:null; }
function hpCbGet(){ try{ const o=JSON.parse(localStorage.getItem(HP_CB_KEY)||'null'); if(o&&o.v===1&&o.d&&typeof o.d==='object'&&!Array.isArray(o.d)) return o; }catch(e){} return { v:1, d:{} }; }
function hpCbSet(o){ const now=Date.now(); let ks=Object.keys(o.d).filter(k=>{ const e=o.d[k]; return e&&e.notAfter>now; });
  if(ks.length>HP_CB_MAX) ks=ks.sort((a,b)=>(o.d[b].at||0)-(o.d[a].at||0)).slice(0,HP_CB_MAX);
  const d={}; for(const k of ks) d[k]=o.d[k]; localStorage.setItem(HP_CB_KEY, JSON.stringify({ v:1, d:d })); return ks.length; }

function hpCkLearn(r){
  try{
    const ck=r&&r.fromPrekey&&r.fromPrekey.ck, now=Date.now();
    if(typeof ID==='undefined'||!ID||!ID.address||!r.from||!r.fromDev||!hpCkOk(r.fromDev,ck,now)) return false;
    let own=0;
    if(r.from===ID.address){ if(r.fromMaster!==ID.publicKey||r.fromDev===hpCkSelf()) return false; own=1; }
    else { const c=(ID.contacts||[]).find(x=>x&&x.address===r.from); if(!(c&&c.pubKey===r.fromMaster&&c.card&&Array.isArray(c.card.devices)&&c.card.devices.indexOf(r.fromDev)>=0)) return false; }
    const b=hpCbGet(), o=b.d[r.fromDev];
    if(o&&o.a===r.from&&o.x===ck.x&&o.notAfter===ck.notAfter) return false;
    if(o&&o.a===r.from&&o.notAfter>ck.notAfter) return false;
    b.d[r.fromDev]={ a:r.from, own:own, x:ck.x, notAfter:ck.notAfter, sig:ck.sig, at:now };
    const n=hpCbSet(b); hpLog('通話の名簿に控えた（'+(own?'自分の端末':'友達の端末')+' '+String(r.fromDev).slice(0,10)+'…・名簿 '+n+' 台）'); return true;
  }catch(e){ return false; }
}
function hpCkSelf(){ try{ const k=hpCkList()[0]; return k?k.dev:''; }catch(e){ return ''; } }

function hpCbPrune(){
  if(typeof ID==='undefined'||!ID||!ID.address) return 0;
  const b=hpCbGet(), ks=Object.keys(b.d); let sibs=null, n=0;
  for(const k of ks){ const e=b.d[k]; let keep=false;
    try{
      if(e&&e.own){ if(e.a===ID.address){ if(sibs===null){ try{ sibs=(typeof hpSibs==='function')?hpSibs().map(x=>x&&x.dev):[]; }catch(x){ sibs=[]; } } keep=sibs.indexOf(k)>=0; } }
      else if(e&&e.a&&e.a!==ID.address&&!(typeof hpBlocked==='function'&&hpBlocked(e.a))){ const c=(ID.contacts||[]).find(x=>x&&x.address===e.a); keep=!!(c&&c.card&&Array.isArray(c.card.devices)&&c.card.devices.indexOf(k)>=0); }
    }catch(x){ keep=false; }
    if(!keep){ delete b.d[k]; n++; } }
  if(n){ hpCbSet(b); hpLog('通話の名簿から '+n+' 台を消した（友達でない・ブロック中・外した端末）'); }
  return n;
}

const HP_CK_PQ_KEY='p2p_callckpq';
function hpCkPqAll(){ try{ const o=JSON.parse(localStorage.getItem(HP_CK_PQ_KEY)||'{}'); return (o&&typeof o==='object'&&!Array.isArray(o))?o:{}; }catch(e){ return {}; } }
function hpCkPqNote(dev,id,km,q,r){ try{ if(typeof dev!=='string'||!dev||typeof id!=='string'||!id||!(km&&km.length>=32)) return false; const s=hp5S(); const k=hpHex(s.crypto_generichash(32, hp5U('handpost-cap-ckpq:'+id), km.slice(0,32)));
    const o=hpCkPqAll(), l=(Array.isArray(o[dev])?o[dev]:[]).filter(x=>x&&x.id!==id), now=Date.now(); l.unshift(Object.assign({id:id,k:k,at:now},q?{q:1}:{},r?{r:1}:{})); l.sort((a,b)=>(Number(b.at)||0)-(Number(a.at)||0)); o[dev]=l.filter((x,i)=>i<HP_CPS_PQ_N||now-(Number(x.at)||0)<HP_CPS_PQ_KEEP).slice(0,HP_CPS_PQ_CAP);
    const ks=Object.keys(o); if(ks.length>HP_CPS_PQ_DEVS){ ks.sort((a,b)=>(Number(o[a][0]&&o[a][0].at)||0)-(Number(o[b][0]&&o[b][0].at)||0)); for(const d of ks.slice(0,ks.length-HP_CPS_PQ_DEVS)) delete o[d]; }
    localStorage.setItem(HP_CK_PQ_KEY,JSON.stringify(o)); return true; }catch(e){ return false; } }
function hpCkPqGet(dev,id){ try{ const l=hpCkPqAll()[dev]||[]; const e=id?l.find(x=>x&&x.id===id):hpCpsPqPick(l); return (e&&/^[0-9a-f]{64}$/.test(String(e.k)))?{id:e.id,k:hpBytes(e.k)}:null; }catch(e){ return null; } }
try{ if(typeof hpCpsPqNote==='function'&&!hpCpsPqNote.__f224){ const f=hpCpsPqNote; hpCpsPqNote=Object.assign(function(dev,id,km,q,r){ const v=f.apply(this,arguments); try{ hpCkPqNote(dev,id,km,q,r); }catch(e){} return v; },f,{__f224:1}); } }catch(e){}
function hpCkAd(h){ return hp5Cat(hpCpsAd(h), hp5U(':ck:'+JSON.stringify([h.fk.x,h.fk.n,h.fk.s,h.ck,h.cq]))); }
function hpCkKey(s,dh1,dh2,pair,eph,toCk,id){ return s.crypto_generichash(32, hp5Cat(hp5U('handpost-cap-ck'), eph, toCk, hp5U(String(id))), s.crypto_generichash(32, hp5Cat(dh1, dh2, pair))); }

function hpCkWrap(s,h,key,toDev,myDev,eph){
  const now=Date.now(), e=hpCbGet().d[toDev], mine=hpCkList()[0];
  if(!e||!(e.notAfter>now)||!/^[0-9a-f]{64}$/.test(String(e.x))) return { why:'相手の端末の通話用の鍵がまだ無い' };
  if(!mine||mine.dev!==myDev||!(mine.notAfter>now)) return { why:'この端末の通話用の鍵が無い' };
  const pq=hpCkPqGet(toDev,null); if(!pq) return { why:'通話用の合わせ鍵がまだ無い' };
  const toCk=hpBytes(e.x), a={ fk:{x:mine.x,n:mine.notAfter,s:mine.sig}, ck:e.x.slice(0,16), cq:pq.id }, hh=Object.assign({},h,a);
  const kk=hpCkKey(s, s.crypto_scalarmult(eph.privateKey,toCk), s.crypto_scalarmult(hpBytes(mine.priv),toCk), pq.k, eph.publicKey, toCk, h.id);
  const n=s.randombytes_buf(24); a.w2=hp5B64(hp5Cat(n, s.crypto_aead_xchacha20poly1305_ietf_encrypt(key, hpCkAd(hh), null, n, kk))); return { add:a };
}

hpCpsSeal=async function(peer,dev,body,type,callId,why){
  const xf=String(arguments[6]||'');
  const s=hp5S(), card=hpCardOf(peer), now=Date.now(); if(!card||!Array.isArray(card.prekeys)){ if(why) why.push('nocard'); return null; }
  const pq=hpCpsPqGet(dev,null); if(!pq){ if(why) why.push('nopq'); return null; }
  const p=card.prekeys.find(q=>q&&q.dev===dev&&hp5PreOk(dev,q.x25519,q.notAfter,q.sig,now)); if(!p){ if(why) why.push('nopre'); return null; }
  const me=await hp5Me(), mine=me.pre, toX=hpBytes(p.x25519), eph=s.crypto_box_keypair();
  const raw=hp5U(String(body)); let z=await hpCpsZip(raw), zf=1; if(!z){ z=raw; zf=0; }
  const h={v:1,f:me.id,m:me.master,fd:me.dev,ds:me.devSig,fp:{x:mine.x,n:mine.notAfter,s:mine.sig},kid:String(p.x25519).slice(0,16),to:dev,at:now,id:String(callId||''),k:String(type||''),pq:pq.id,e:hp5B64(eph.publicKey),z:zf};
  const key=hpCpsKey(s, s.crypto_scalarmult(eph.privateKey,toX), s.crypto_scalarmult(hpBytes(mine.priv),toX), pq.k, eph.publicKey, toX, h.id);
  const n=s.randombytes_buf(24); h.c=hp5B64(hp5Cat(n, s.crypto_aead_xchacha20poly1305_ietf_encrypt(z, hpCpsAd(h), null, n, key))); if(xf) h.x=xf;
  const out=JSON.stringify(h); if(out.length>HP_CPS_MAX){ if(why) why.push('big'); return null; }
  let ckWhy=''; try{ const w=hpCkWrap(s,h,key,dev,me.dev,eph); if(w.add){ const o2=JSON.stringify(Object.assign({},h,w.add)); if(o2.length<=HP_CPS_MAX){ if(h.k==='call') hpLog('通話：呼び出しに通話用の鍵の包みを添えた（端末 '+String(dev).slice(0,10)+'…・'+o2.length+' 文字）'); return o2; } ckWhy='添えると '+o2.length+' 文字で大きすぎる'; } else ckWhy=w.why; }catch(e){ ckWhy=(e&&e.message)||String(e); }
  if(h.k==='call') hpLog('通話：呼び出しに通話用の鍵の包みを添えない（端末 '+String(dev).slice(0,10)+'…・'+ckWhy+'）');
  return out; };

async function hpCkCapOpen(text){
  const s=hp5S(); let h=null; try{ h=JSON.parse(String(text)); }catch(e){ h=null; }
  if(!h||h.v!==1||typeof h.c!=='string'||!h.fp||typeof h.e!=='string') throw new Error('形が違う');
  if(typeof h.w2!=='string'||!h.fk||typeof h.ck!=='string'||typeof h.cq!=='string') throw new Error('通話用の鍵の包みが無い');
  const k=hpCkList().find(x=>x&&typeof x.x==='string'&&x.x.slice(0,16)===h.ck&&/^[0-9a-f]{64}$/.test(String(x.priv))); if(!k) throw new Error('開ける通話用の鍵が無い');
  if(h.to!==k.dev) throw new Error('別の端末あて');
  const e=hpCbGet().d[h.fd]; if(!e||e.a!==h.f) throw new Error('通話の名簿にない端末');
  if(!(await hp5IdOk(h.f,h.m,h.fd,h.ds))) throw new Error('送り手の身元を確かめられない');
  const fk={x:h.fk.x,notAfter:h.fk.n,sig:h.fk.s}; if(!hpCkOk(h.fd,fk,Number(h.at)||0)) throw new Error('送り手の通話用の鍵を確かめられない');
  const pq=hpCkPqGet(h.fd,h.cq); if(!pq) throw new Error('通話用の合わせ鍵が無い');
  let key, z;
  try{ const eph=hp5Un64(h.e), my=hpBytes(k.priv), myCk=hpBytes(k.x), w=hp5Un64(h.w2);
    const kk=hpCkKey(s, s.crypto_scalarmult(my,eph), s.crypto_scalarmult(my,hpBytes(fk.x)), pq.k, eph, myCk, String(h.id||''));
    key=s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, w.slice(24), hpCkAd(h), w.slice(0,24), kk);
    const ct=hp5Un64(h.c); z=s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct.slice(24), hpCpsAd(h), ct.slice(0,24), key);
  }catch(x){ throw new Error('封が開かない'); }
  const raw=h.z?await hpCpsUnzip(z):z; return { from:h.f, fromMaster:h.m, fromDev:h.fd, sentAt:Number(h.at)||0, body:new TextDecoder().decode(raw), id:String(h.id||''), k:String(h.k||''), ck:1 }; }

try{ if(typeof hpCpsOpen==='function'&&!hpCpsOpen.__f224){ const f=hpCpsOpen; hpCpsOpen=Object.assign(async function(text){ const r=await f.apply(this,arguments);
    try{ if(r&&r.k==='call'){ let h=null; try{ h=JSON.parse(String(text)); }catch(x){} if(h&&typeof h.w2==='string'){ try{ const c=await hpCkCapOpen(text); hpLog('通話：呼び出しを通話用の鍵でも開けた（'+(c.body===r.body?'中身が同じ':'中身が違う')+'）'); }catch(x){ hpLog('通話：呼び出しを通話用の鍵では開けない（'+((x&&x.message)||x)+'）'); } } else hpLog('通話：呼び出しに通話用の鍵の包みが無い（送り手が前の版か、まだ鍵がそろっていない）'); } }catch(x){}
    return r; },f,{__f224:1}); } }catch(e){}

const HP_CK_ME_KEY='p2p_callme';
function hpCkMe(){ try{ const o=JSON.parse(localStorage.getItem(HP_CK_ME_KEY)||'null'); return (o&&typeof o.id==='string'&&/^[0-9a-f]{64}$/.test(String(o.master))&&/^ed[0-9a-f]{64}$/.test(String(o.dev))&&/^[0-9a-f]{128}$/.test(String(o.devSig)))?o:null; }catch(e){ return null; } }
try{ if(typeof hp5Me==='function'&&!hp5Me.__f225){ const f=hp5Me; hp5Me=Object.assign(async function(){ const v=await f.apply(this,arguments);
    try{ if(v&&v.id&&v.master&&v.dev&&v.devSig){ const o=hpCkMe(); if(!o||o.id!==v.id||o.master!==v.master||o.dev!==v.dev||o.devSig!==v.devSig) localStorage.setItem(HP_CK_ME_KEY,JSON.stringify({id:v.id,master:v.master,dev:v.dev,devSig:v.devSig})); } }catch(e){}
    return v; },f,{__f225:1}); } }catch(e){}

hpCbSet=function(o){ const now=Date.now(); let ks=Object.keys(o.d||{}).filter(k=>{ const e=o.d[k]; return e&&e.notAfter>now; });
  if(ks.length>HP_CB_MAX) ks=ks.sort((a,b)=>(o.d[b].at||0)-(o.d[a].at||0)).slice(0,HP_CB_MAX);
  const d={}, as={}; for(const k of ks){ d[k]=o.d[k]; if(d[k].a) as[d[k].a]=1; } const p={}; const op=(o.p&&typeof o.p==='object'&&!Array.isArray(o.p))?o.p:{}; for(const a of Object.keys(op)) if(as[a]&&op[a]) p[a]=op[a];
  localStorage.setItem(HP_CB_KEY, JSON.stringify({ v:1, d:d, p:p })); return ks.length; };
function hpCbMini(c){ const cd=c&&c.card; if(!cd||typeof cd.id!=='string'||!Array.isArray(cd.devices)) return null;
  const o={ id:cd.id, master:cd.master, post:Array.isArray(cd.post)?cd.post.slice(0,4):[], token:cd.token||null, devices:cd.devices.slice(0,16) };
  if(Array.isArray(cd.boxes)) o.boxes=cd.boxes.filter(b=>b&&typeof b.dev==='string').slice(0,16).map(b=>({ dev:b.dev, post:b.post, token:b.token })); return o; }
function hpCbName(c){ return String((c&&(c.nick||c.name))||'').slice(0,64); }

function hpCbPeople(){ if(typeof ID==='undefined'||!ID||!ID.address||!Array.isArray(ID.contacts)) return 0; const b=hpCbGet(); b.p=(b.p&&typeof b.p==='object')?b.p:{}; let n=0;
  const as={}; for(const k of Object.keys(b.d)){ const e=b.d[k]; if(e&&!e.own&&e.a) as[e.a]=1; }
  for(const a of Object.keys(as)){ const c=ID.contacts.find(x=>x&&x.address===a); const m=c?hpCbMini(c):null; if(!m) continue; const v={ n:hpCbName(c), c:m }; if(JSON.stringify(b.p[a])!==JSON.stringify(v)){ b.p[a]=v; n++; } }
  if(n) hpCbSet(b); return n; }
try{ if(typeof hpCbPrune==='function'&&!hpCbPrune.__f225){ const f=hpCbPrune; hpCbPrune=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpCbPeople(); }catch(e){} return v; },f,{__f225:1}); } }catch(e){}
try{ if(typeof hpCkLearn==='function'&&!hpCkLearn.__f225){ const f=hpCkLearn; hpCkLearn=Object.assign(function(r){ const v=f.apply(this,arguments); try{ if(v===true) hpCbPeople(); }catch(e){} return v; },f,{__f225:1}); } }catch(e){}
function hpCbPerson(a){ try{ const p=hpCbGet().p; return (p&&p[a]&&p[a].c)?p[a]:null; }catch(e){ return null; } }

function hpCk2Ad(h){ return hp5U('handpost-cap:v2:'+JSON.stringify([h.f,h.m,h.fd,h.ds,h.fk.x,h.fk.n,h.fk.s,h.ck,h.cq,h.to,h.at,h.id,h.k,h.e,h.z])); }
async function hpCk2Seal(peer,dev,body,type,callId,why,xf){
  const s=hp5S(), now=Date.now(), me=hpCkMe(), mine=hpCkList()[0], e=hpCbGet().d[dev];
  if(!me){ if(why) why.push('nome'); return null; } if(!mine||mine.dev!==me.dev||!(mine.notAfter>now)){ if(why) why.push('nomyck'); return null; }
  if(!e||e.a!==peer||!(e.notAfter>now)){ if(why) why.push('nock'); return null; }
  const pq=hpCkPqGet(dev,null); if(!pq){ if(why) why.push('nockpq'); return null; }
  const toCk=hpBytes(e.x), eph=s.crypto_box_keypair(), raw=hp5U(String(body)); let z=await hpCpsZip(raw), zf=1; if(!z){ z=raw; zf=0; }
  const h={v:2,f:me.id,m:me.master,fd:me.dev,ds:me.devSig,fk:{x:mine.x,n:mine.notAfter,s:mine.sig},ck:e.x.slice(0,16),cq:pq.id,to:dev,at:now,id:String(callId||''),k:String(type||''),e:hp5B64(eph.publicKey),z:zf};
  const kk=hpCkKey(s, s.crypto_scalarmult(eph.privateKey,toCk), s.crypto_scalarmult(hpBytes(mine.priv),toCk), pq.k, eph.publicKey, toCk, h.id);
  const n=s.randombytes_buf(24); h.c=hp5B64(hp5Cat(n, s.crypto_aead_xchacha20poly1305_ietf_encrypt(z, hpCk2Ad(h), null, n, kk))); if(xf) h.x=String(xf);
  const out=JSON.stringify(h); if(out.length>HP_CPS_MAX){ if(why) why.push('big'); return null; } return out; }

hpCkCapOpen=async function(text){
  const s=hp5S(); let h=null; try{ h=JSON.parse(String(text)); }catch(e){ h=null; }
  if(!h||(h.v!==1&&h.v!==2)||typeof h.c!=='string'||typeof h.e!=='string') throw new Error('形が違う');
  if((h.v===1&&(typeof h.w2!=='string'||!h.fp))||!h.fk||typeof h.ck!=='string'||typeof h.cq!=='string') throw new Error('通話用の鍵の包みが無い');
  const k=hpCkList().find(x=>x&&typeof x.x==='string'&&x.x.slice(0,16)===h.ck&&/^[0-9a-f]{64}$/.test(String(x.priv))); if(!k) throw new Error('開ける通話用の鍵が無い');
  if(h.to!==k.dev) throw new Error('別の端末あて');
  const e=hpCbGet().d[h.fd]; if(!e||e.a!==h.f) throw new Error('通話の名簿にない端末');
  if(!(await hp5IdOk(h.f,h.m,h.fd,h.ds))) throw new Error('送り手の身元を確かめられない');
  const fk={x:h.fk.x,notAfter:h.fk.n,sig:h.fk.s}; if(!hpCkOk(h.fd,fk,Number(h.at)||0)) throw new Error('送り手の通話用の鍵を確かめられない');
  const pq=hpCkPqGet(h.fd,h.cq); if(!pq) throw new Error('通話用の合わせ鍵が無い');
  let z;
  try{ const eph=hp5Un64(h.e), my=hpBytes(k.priv), myCk=hpBytes(k.x), ct=hp5Un64(h.c);
    const kk=hpCkKey(s, s.crypto_scalarmult(my,eph), s.crypto_scalarmult(my,hpBytes(fk.x)), pq.k, eph, myCk, String(h.id||''));
    if(h.v===2) z=s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct.slice(24), hpCk2Ad(h), ct.slice(0,24), kk);
    else { const w=hp5Un64(h.w2), key=s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, w.slice(24), hpCkAd(h), w.slice(0,24), kk); z=s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, ct.slice(24), hpCpsAd(h), ct.slice(0,24), key); }
  }catch(x){ throw new Error('封が開かない'); }
  const raw=h.z?await hpCpsUnzip(z):z; return { from:h.f, fromMaster:h.m, fromDev:h.fd, sentAt:Number(h.at)||0, body:new TextDecoder().decode(raw), id:String(h.id||''), k:String(h.k||''), ck:1 }; };

try{ if(typeof hpCpsOpen==='function'&&!hpCpsOpen.__f225){ const f=hpCpsOpen; hpCpsOpen=Object.assign(async function(text){ let h=null; try{ h=JSON.parse(String(text)); }catch(e){ h=null; }
    if(h&&h.v===2){ try{ if(typeof contacts==='function'&&!(typeof hpVaultLocked==='function'&&hpVaultLocked())){ const c=contacts().find(x=>x&&x.address===h.f); if(!c) throw new Error('連絡先にない'); if(c.pubKey&&c.pubKey!==h.m) throw new Error('マスター鍵が連絡先のものと違う'); } }catch(e){ if(/連絡先|マスター鍵/.test(String(e&&e.message))) throw e; }
      const r=await hpCkCapOpen(text); try{ hpLog('通話：'+(HP_CPS_NAME[r.k]||'合図')+'を通話用の鍵だけの封で受けた（相手はパスキーを開く前）'); }catch(e){} return r; }
    return f.apply(this,arguments); },f,{__f225:1}); } }catch(e){}

async function hpCk2Ring(peer,bodyObj,devs){
  const t0=Date.now(), out={sent:0,devs:[],why:[]}; try{
    const type=bodyObj&&bodyObj.type; if(HP_CPS_TYPES.indexOf(type)<0) return out; const P=hpCbPerson(peer), card=P&&P.c; if(!card||!Array.isArray(card.devices)){ hpLog('通話：'+(HP_CPS_NAME[type]||'合図')+'を送れない（通話の名簿に小さな名刺が無い）'); return out; }
    const list=(Array.isArray(devs)&&devs.length)?card.devices.filter(d=>devs.indexOf(d)>=0):card.devices.slice(); if(!list.length) return out;
    const text=JSON.stringify(bodyObj), caps=[], why=[], xf=(type==='callend'&&String(bodyObj.why||'')==='taken')?'t':''; for(const d of list){ const c=await hpCk2Seal(peer,d,text,type,bodyObj.call,why,xf); if(c) caps.push({dev:d,blob:c}); }
    if(!caps.length){ hpLog('通話：'+HP_CPS_NAME[type]+'を通話用の鍵だけの封にできない（'+why.join(' ')+'）'); return out; }
    const w=(type==='call')?Math.max(60,Math.min(600,Math.round(Number(bodyObj.w)/1000)||60)):60, groups=hpPutGroups(card,caps), whys=[];
    await Promise.all(groups.map(async g=>{ try{ const p=await hpPoolGet(g.post,hpPutFail);
        const rep=await hpWithin(p.c.submitContractReadRequest(JSON.stringify({op:'ring',token:g.token,k:type,call:String(bodyObj.call||''),w:w,caps:g.letters.map(l=>({dev:l.dev,cap:l.blob}))}),null,HP_CPS_WAIT),HP_CPS_WAIT+500,'通知の問い合わせ');
        let o=null; try{ o=JSON.parse(rep==null?'null':hpText(rep)); }catch(e){ o=null; }
        if(o&&o.ok==='ring'){ out.sent+=Number(o.sent)||0; if(Number(o.sent)===g.letters.length) for(const l of g.letters) out.devs.push(l.dev); if(Array.isArray(o.why)) for(const x of o.why) whys.push(String(x)); }
        else hpLog('通話：通知を頼めない（'+g.post[0]+'・'+((o&&o.err)||'返事がない')+'）'); }catch(e){ hpLog('通話：通知を頼めない（'+g.post[0]+'・'+((e&&e.message)||e)+'）'); } }));
    hpLog('通話：'+HP_CPS_NAME[type]+'を通話用の鍵だけの封で通知に載せた（端末 '+caps.length+' 台のうち '+out.sent+' 台に送れた・'+caps[0].blob.length+' 文字・'+((Date.now()-t0)/1000).toFixed(1)+' 秒'+(whys.length?'・送れなかった訳 '+whys.join(' '):'')+'）'); out.why=whys; return out;
  }catch(e){ hpLog('通話：通話用の鍵だけの封を送れない（'+((e&&e.message)||e)+'）'); return out; } }

const HP_LK_CSS='#hp-call.lk{z-index:10001}', HP_LK_SCAN_MS=1000;
let HP_LK_BUSY=0; const HP_LK_FAIL=new Set();
function hpLkKey(d){ return String((d&&d.key)||((d&&d.k)+':'+(d&&d.call))); }

function hpLkOn(){ try{ return !!(typeof hpVaultLocked==='function'&&hpVaultLocked()&&!hpCpsReady()&&typeof document!=='undefined'&&document.getElementById('vault-lock')&&typeof window!=='undefined'&&window.sodium&&window.sodium.crypto_scalarmult&&hpCkMe()&&hpCkList().length); }catch(e){ return false; } }
function hpLkName(a){ try{ const P=hpCbPerson(a); return (P&&P.n)?String(P.n):''; }catch(e){ return ''; } }

async function hpLkTake(d,how){ const key=hpLkKey(d);
  try{
    if(!d||!d.cap||HP_CPS_SEEN.has(key)||HP_LK_FAIL.has(key)||HP_CPS_TYPES.indexOf(d.k)<0) return false;
    const nm=HP_CPS_NAME[d.k]||'合図'; let h=null; try{ h=JSON.parse(String(d.cap)); }catch(e){ h=null; }
    if(!h||(h.v!==2&&typeof h.w2!=='string')){ HP_LK_FAIL.add(key); hpLog('通話：ロックを解除する前には'+nm+'を開けない（通話用の鍵の包みが無い。解除したあとで開ける）'); return false; }
    const age=Date.now()-Number(d.at||0), lim=(d.k==='call')?Math.max(60000,Math.min(600000,(Number(d.w)||60)*1000)):(HP_CPS_AGE[d.k]||90e3);
    if(age>lim||age<-60000){ HP_CPS_SEEN.add(key); if(d.key) hpCpsStoreDel(d.key).catch(()=>{}); hpLog('通話：ロックを解除する前に見つけた'+nm+'が古い（'+Math.round(age/1000)+' 秒前。捨てた）'); return false; }
    HP_CPS_SEEN.add(key); let r=null;
    try{ r=await hpCkCapOpen(d.cap); }catch(e){ HP_CPS_SEEN.delete(key); HP_LK_FAIL.add(key); hpLog('通話：ロックを解除する前には'+nm+'を開けない（'+((e&&e.message)||e)+'。解除したあとで開ける）'); return false; }
    const me=hpCkMe(), e=hpCbGet().d[r.fromDev];
    if(!me||r.from===me.id||!e||e.own||e.a!==r.from){ HP_CPS_SEEN.delete(key); HP_LK_FAIL.add(key); hpLog('通話：ロックを解除する前には'+nm+'を受けない（自分の端末か、通話の名簿にいない人から）'); return false; }
    if(d.key) hpCpsStoreDel(d.key).catch(()=>{});
    let o=null; try{ o=JSON.parse(r.body); }catch(x){ o=null; }
    hpLog('通話：ロックを解除する前に'+nm+'を通話用の鍵で開いた（'+Math.round((Date.now()-r.sentAt)/1000)+' 秒前・'+(how==='sw'?'開いている間に届いた':'控えから読んだ')+'）');
    if(o) await hpLkOnSig(r,o); try{ hpCpsSigClose(); }catch(x){} return true;
  }catch(e){ HP_LK_FAIL.add(key); hpLog('通話：ロックを解除する前の封でエラー（'+((e&&e.message)||e)+'）'); return false; } }

async function hpLkScan(how){ if(HP_LK_BUSY||!hpLkOn()) return 0; HP_LK_BUSY=1; let n=0; try{
    const all=await hpCpsStoreAll(), now=Date.now(), list=[], keys=new Set();
    for(const d of all.concat(HP_CPS_PEND)){ if(!d||!d.cap) continue; const k=hpLkKey(d); if(k.slice(0,3)==='nm:'||keys.has(k)||HP_CPS_SEEN.has(k)||HP_LK_FAIL.has(k)||now-Number(d.at||0)>600e3) continue; keys.add(k); list.push(d); }
    if(!list.length) return 0; list.sort((a,b)=>(Number(a.at)||0)-(Number(b.at)||0));
    const ends=new Set(list.filter(d=>d.k==='callend').map(d=>String(d.call||''))), newest={}; for(const d of list.slice().reverse()){ if(d.k!=='call') continue; const f=hpCpsFrom(d.cap); if(f&&!newest[f]) newest[f]=d; }
    for(const d of list){ const k=hpLkKey(d);
      if(d.k==='call'){ const f=hpCpsFrom(d.cap), ended=ends.has(String(d.call||'')), older=!!(f&&newest[f]&&newest[f]!==d);
        if(ended||older){ try{ if(typeof hpChMissEnsure==='function'&&f) hpChMissEnsure(f,Number(d.at)||0,String(d.call||'')); }catch(x){}   HP_CPS_SEEN.add(k); if(d.key) hpCpsStoreDel(d.key).catch(()=>{}); hpLog('通話：ロックを解除する前に、古い呼び出しを捨てた（'+(ended?'もう切られている':'新しい呼び出しがある')+'）'); continue; } }
      if(!hpLkOn()) break; try{ if(await hpLkTake(d,how)) n++; }catch(e){} }
  }catch(e){} finally{ HP_LK_BUSY=0; } return n; }

async function hpLkOnSig(r,o){
  try{
    if(!o||o.v!==1||typeof o.call!=='string'||!/^[0-9a-f]{16}$/.test(o.call)) return;
    const from=r.from, C=HP_CALL;
    if(o.type==='callend'){ try{ hpCallGone(o.call); }catch(e){} if(C&&C.id===o.call&&C.peer===from&&C.st!=='ended'){ C.byeSent=true; const w=String(o.why||''); hpCallEnd('peer:'+w,w==='decline'?T('cl_declined'):w==='busy'?TF('cl_busy',{who:nickOf(from)}):w==='nopq'?T('cl_nopq'):w==='taken'?T('cl_taken'):w==='timeout'?T('cl_noans'):w==='hangup'?TF('cl_end_peer',{who:nickOf(from)}):w==='lost'?T('cl_lost'):T('cl_ended')); } return; }
    if(o.type==='callgo'){ if(!(C&&C.dir==='in'&&C.id===o.call&&C.peer===from&&C.st==='connecting'&&C.pc&&C.cands)) return; const cs=C.cands; C.cands=null; const n=await hpCallAddCands(C,cs); hpCallIceGo(C); hpLog('通話：相手の準備が整ったので線をつなぎ始めた（'+n+'）'); return; }
    if(o.type!=='call') return;
    if((typeof HP_CALL_GONE!=='undefined'&&HP_CALL_GONE.has(o.call))||(C&&C.id===o.call)) return;
    const tn=hpCallTurnOf(o.t); if(typeof o.sdp!=='string'||typeof o.fp!=='string'||extractFingerprint(o.sdp)!==o.fp||typeof o.k!=='string'||!/^[0-9a-f]{64}$/.test(o.k)||o.pq!==1||!tn){ hpLog('通話の呼び出しの形が違う（捨てた）'); return; }
    if(!hpCallCan()){ hpCk2Ring(from,{v:1,type:'callend',call:o.call,why:'nopq'},[r.fromDev]).catch(()=>{}); hpLog('通話：この端末では二重の鍵が使えないので応えない'); return; }
    if(C&&C.st!=='ended'){ hpCk2Ring(from,{v:1,type:'callend',call:o.call,why:'busy'},[r.fromDev]).catch(()=>{}); hpLog('通話：取り込み中なので応えない'); return; }
    const age=Date.now()-Number(r.sentAt), w=Math.min(HP_CALL_ASK,Number(o.w)>0?Number(o.w):HP_CALL_MAXAGE); if(age>w||age<-60000){ hpLog('古い通話の合図（'+Math.round(age/1000)+' 秒前。捨てた）'); return; }
    const N={id:o.call,peer:from,dir:'in',st:'ringing',pc:null,stream:null,dev:r.fromDev||null,key:hpCallHexU8(o.k),offer:o.sdp,turn:tn,turns:hpCallTurnsOf(o,tn),at:Date.now(),timer:null,lk:1};
    HP_CALL=N; hpCallUi(); hpCallRing(true); N.prep=hpCallPrep(N); N.prep.catch(()=>{});
    hpLog('通話：'+nickOf(from)+' から呼び出し（ロックを解除する前。通話の名簿で鳴らした）'); try{ hpCallCard(true); }catch(e){}
    N.timer=setTimeout(()=>{ if(HP_CALL===N&&N.st==='ringing'){ hpCallEnd('missed',T('cl_missed')); } },Math.max(15000,Math.min(HP_CALL_RING_MORE,w-Math.max(0,age))));
  }catch(e){ hpLog('通話の合図でエラー（'+((e&&e.message)||e)+'）'); } }

try{ if(typeof nickOf==='function'&&!nickOf.__f226){ const f=nickOf; nickOf=Object.assign(function(a){ try{ if(!(typeof ID!=='undefined'&&ID&&ID.contacts)){ const n=hpLkName(a); if(n) return n; } }catch(e){} return f.apply(this,arguments); },f,{__f226:1}); } }catch(e){}

try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f226){ const f=hpCallSig; hpCallSig=Object.assign(async function(peer,body,devs){
    const C=HP_CALL; if(!(C&&C.lk&&C.peer===peer&&!hpCpsReady())) return f.apply(this,arguments);
    const type=body&&body.type; if(HP_CPS_TYPES.indexOf(type)<0) return null;
    try{ if(type==='callans') hpCpsNamePut(body.call,nickOf(peer)).catch(()=>{}); }catch(e){}
    const r=await hpCk2Ring(peer,body,devs); if(!(r&&Number(r.sent)>0)){ const e=new Error('通話用の鍵だけの封を送れない'); e.hpk='wait'; throw e; }
    return {lk:1}; },f,{__f226:1}); } }catch(e){}

try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f226){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(d){ const on=!!(C&&C.lk&&document.getElementById('vault-lock'));
      if(on&&document.head&&!document.getElementById('hp-lk-css')){ const st=document.createElement('style'); st.id='hp-lk-css'; st.textContent=HP_LK_CSS; document.head.appendChild(st); }
      if(d.classList) d.classList.toggle('lk',on); } }catch(e){} return r; },f,{__f226:1}); } }catch(e){}

try{ if(typeof hpCpsGot==='function'&&!hpCpsGot.__f226){ const f=hpCpsGot; hpCpsGot=Object.assign(function(d){ const v=f.apply(this,arguments); try{ if(hpLkOn()) hpLkTake(d,'sw').catch(()=>{}); }catch(e){} return v; },f,{__f226:1}); } }catch(e){}
try{ if(typeof setInterval==='function'){ const t=setInterval(()=>{ try{ if(hpLkOn()) hpLkScan('store').catch(()=>{}); }catch(e){} },HP_LK_SCAN_MS); try{ if(t&&t.unref) t.unref(); }catch(e){} } }catch(e){}

const HP_VMW_CSS='#hp-vm .vmb.w{animation:none}#hp-vm .vmb .vc-dot.w{color:#8a94a6;animation:none}#hp-vm .vmb.w .vc-eq i{animation:none;height:4px}#hp-vm .vmb button.vstop:disabled{opacity:.45}';
function hpVmWaitBand(d,R){ const b=d.__band; if(!b) return null;
  try{ if(document.head&&!document.getElementById('hp-vmw-css')){ const st=document.createElement('style'); st.id='hp-vmw-css'; st.textContent=HP_VMW_CSS; document.head.appendChild(st); } }catch(e){}
  b.style.display='flex'; if(b.__w===R&&b.className==='vmb w') return b; b.__w=R; b.__r=null; b.__tx=null; b.textContent=''; b.className='vmb w';
  const E=(tag,c,x)=>{ const e=document.createElement(tag); if(c) e.className=c; if(x!=null) e.textContent=x; return e; };
  const h=E('div','vc-h'); h.appendChild(E('span','','🎤 '+T('cl_vm_l'))); b.appendChild(h); const r=E('div','vc-r'); b.appendChild(r);
  r.appendChild(E('span','vc-dot w','●')); const eq=E('div','vc-eq'); for(let i=0;i<HP_VMB_EQN;i++) eq.appendChild(E('i')); r.appendChild(eq);
  r.appendChild(E('span','vc-t',TF('vc_rec',{t:hpVcClock(0),max:hpVcClock(HP_VC_MAX)}))); const s=E('button','vstop','■ '+T('btn_vm_end')); s.type='button'; s.disabled=true; r.appendChild(s); return b; }
try{ if(typeof hpVmUi==='function'&&!hpVmUi.__f228){ const f=hpVmUi; hpVmUi=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const R=HP_VMR, d=document.getElementById('hp-vm'); if(R&&d&&(R.st==='greet'||R.st==='beep')){ if(d.__msg){ d.__msg.textContent=''; d.__msg.className='msg'; } hpVmWaitBand(d,R); }
      else if(d&&d.__band&&d.__band.__w){ d.__band.__w=null; if(d.__band.className==='vmb w') d.__band.className='vmb'; } }catch(e){}
    return v; },f,{__f228:1}); } }catch(e){}

const HP_VM_CAP=60e3;
hpVmAuto=function(C){ try{ if(!C||HP_CALL!==C||C.st!=='calling'||C.dir!=='out') return false; C.vm=1;
    hpLog('通話：'+(C.vmRing?('相手の端末が鳴り始めてから '+Math.round((C.vmMs||0)/1000)+' 秒たっても出なかったので'):(Math.round(HP_VM_CAP/1000)+' 秒たっても相手の端末が鳴り始めないので'))+'、音声メッセージに切り替えた');
    hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); if(HP_CALL===C){ HP_CALL=null; hpCallUi(); } hpVmGo(C.peer).catch(()=>{}); return true; }catch(e){ hpLog('通話：音声メッセージに切り替えられない（'+((e&&e.message)||e)+'）'); return false; } };
hpVmArm=function(C){ try{ const s=hpVmSec(); if(!s||!C||C.dir!=='out'||C.vmOn) return false; C.vmOn=1; C.vmS=s; hpVmPrime();
    C.vmT=setTimeout(()=>{ try{ if(HP_CALL===C&&C.st==='calling'&&!C.vmRing) hpVmAuto(C); }catch(e){} },HP_VM_CAP); return true; }catch(e){ return false; } };
function hpVmRing(C){ try{ if(!C||!C.vmOn||C.vmRing||HP_CALL!==C||C.st!=='calling'||C.dir!=='out') return false; C.vmRing=Date.now(); if(C.vmT) clearTimeout(C.vmT);
    const ms=Math.max(5000,Math.min(C.vmS*1000,HP_CALL_RING_MORE-1500)); C.vmMs=ms; C.vmT=setTimeout(()=>{ try{ if(HP_CALL===C&&C.st==='calling') hpVmAuto(C); }catch(e){} },ms);
    hpLog('通話：相手の端末で鳴り始めたので、'+Math.round(ms/1000)+' 秒出なければ音声メッセージに切り替える'); return true; }catch(e){ return false; } }
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f229){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ const v=await f.apply(this,arguments);
    try{ const C=HP_CALL; if(r&&o&&o.v===1&&o.type==='callring'&&C&&C.dir==='out'&&C.id===o.call&&C.peer===r.from&&C.st==='calling'&&C.rung) hpVmRing(C); }catch(e){} return v; },f,{__f229:1}); } }catch(e){}

try{ if(typeof hpVmUi==='function'&&!hpVmUi.__f230){ const f=hpVmUi; hpVmUi=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const R=HP_VMR, d=document.getElementById('hp-vm'); if(R&&d&&d.__msg&&(R.st==='greet'||R.st==='beep')){ const t=TF('vm_noans',{who:nickOf(R.peer)}); if(d.__msg.textContent!==t){ d.__msg.textContent=t; d.__msg.className='msg'; } } }catch(e){}
    return v; },f,{__f230:1}); } }catch(e){}
try{ if(typeof hpVmRow==='function'&&!hpVmRow.__f230){ const f=hpVmRow; hpVmRow=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const r=document.getElementById('set-vm'), b=r&&r.children&&r.children[0]; if(b&&b.getAttribute&&b.getAttribute('data-i18n')!=='cl_vm_set'){ b.textContent=T('cl_vm_set'); b.setAttribute('data-i18n','cl_vm_set'); } }catch(e){}
    return v; },f,{__f230:1}); } }catch(e){}

const HP_VM_CANCEL_GAP=1200;
hpVmCancel=function(){ const R=HP_VMR; if(!R||R.st==='cancel') return false; try{ if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); }catch(e){}
  try{ hpVmStopRec(R); }catch(e){} R.st='cancel'; const gen=HP_VMR_GEN; hpVmUi(); hpLog('通話：音声メッセージをキャンセルした');
  (async()=>{ try{ await hpVmSay(T('vm_cancelled'),(typeof curLang==='function')?curLang():'ja'); }catch(e){} await new Promise(z=>setTimeout(z,HP_VM_CANCEL_GAP)); try{ if(HP_VMR===R&&HP_VMR_GEN===gen) hpVmClose(); }catch(e){} })();
  return true; };
try{ if(typeof hpVmUi==='function'&&!hpVmUi.__f231){ const f=hpVmUi; hpVmUi=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const R=HP_VMR, d=document.getElementById('hp-vm'); if(R&&d&&R.st==='cancel'){ if(d.__msg){ d.__msg.textContent=T('vm_cancelled'); d.__msg.className='msg'; } if(d.__band) d.__band.style.display='none'; for(const k of ['__end','__redo','__cancel']) if(d[k]) d[k].style.display='none'; if(d.__st) d.__st.style.display='none'; } }catch(e){}
    return v; },f,{__f231:1}); } }catch(e){}

const HP_DM_KEY='p2p_declmsg', HP_DM_KEEP=600e3, HP_DM_KEYS=['cl_dm_1','cl_dm_2','cl_dm_3'];
const HP_DM_CSS='#hp-call .dm{position:absolute;left:0;right:0;bottom:calc(210px + env(safe-area-inset-bottom,0px));display:flex;justify-content:center}#hp-call .dm button{width:auto;height:auto;border-radius:18px;padding:8px 16px;font-size:.9em;background:#2b3a52;color:#fff}'
 +'#hp-call .dmp{position:absolute;inset:0;background:rgba(10,14,20,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:24px}#hp-call .dmp button{width:min(92vw,420px);height:auto;border-radius:12px;padding:12px 14px;font-size:1em;background:#1b2740;color:#fff;text-align:left}#hp-call .dmp button.x{background:transparent;color:#cfd8e6;text-align:center}';
function hpDmPend(){ try{ const o=JSON.parse(localStorage.getItem(HP_DM_KEY)||'null'); return (o&&typeof o.peer==='string'&&typeof o.text==='string'&&Date.now()-(Number(o.at)||0)<HP_DM_KEEP)?o:null; }catch(e){ return null; } }
function hpDmPendSet(o){ try{ if(o) localStorage.setItem(HP_DM_KEY,JSON.stringify(o)); else localStorage.removeItem(HP_DM_KEY); }catch(e){} }

function hpDmSend(peer,text){ try{ if(typeof ID==='undefined'||!ID||!peer||!text) return false; if(typeof hpBlocked==='function'&&hpBlocked(peer)) return false; if(typeof hpCardOf==='function'&&!hpCardOf(peer)) return false;
    const ts=Date.now(); histAdd(peer,'s',text,ts,1); try{ if(typeof CURPEER!=='undefined'&&CURPEER===peer&&typeof addMsgAt==='function') addMsgAt('self',text,(typeof myName==='function'&&myName())||T('me'),ts,0,1); }catch(e){}
    Promise.resolve(hpSendText(peer,text,ts)).catch(()=>{}); hpLog('通話：断りのメッセージを手紙で出した → '+nickOf(peer)); return true; }catch(e){ try{ hpLog('通話：断りのメッセージを出せない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; } }
function hpDmPick(C,text){ try{ if(!C||C.st!=='ringing') return false; const peer=C.peer, lk=!!C.lk; hpCallDecline();
    if(lk||!hpCpsReady()){ hpDmPendSet({peer:peer,text:text,at:Date.now()}); hpLog('通話：断りのメッセージを控えた（ロックを解除したら出す）'); try{ hpToast(T('cl_dm_after'),5000); }catch(e){} return true; }
    return hpDmSend(peer,text); }catch(e){ return false; } }
function hpDmFlush(){ try{ const o=hpDmPend(); if(!o) return false; if(!hpCpsReady()) return false; hpDmPendSet(null); return hpDmSend(o.peer,o.text); }catch(e){ return false; } }
function hpDmPanel(d,on){ let p=d.__dmp; if(!on){ if(p) p.style.display='none'; return; } if(!p){ p=document.createElement('div'); p.className='dmp'; d.appendChild(p); d.__dmp=p; }
  p.textContent=''; for(const k of HP_DM_KEYS){ const b=document.createElement('button'); b.type='button'; b.textContent=T(k); b.onclick=()=>{ hpDmPanel(d,false); hpDmPick(HP_CALL,T(k)); }; p.appendChild(b); }
  const x=document.createElement('button'); x.type='button'; x.className='x'; x.textContent=T('vc_cancel'); x.onclick=()=>hpDmPanel(d,false); p.appendChild(x); p.style.display='flex'; }
function hpDmEl(d){ try{ if(!d||d.__dm) return d; if(document.head&&!document.getElementById('hp-dm-css')){ const st=document.createElement('style'); st.id='hp-dm-css'; st.textContent=HP_DM_CSS; document.head.appendChild(st); }
    const w=document.createElement('div'); w.className='dm'; const b=document.createElement('button'); b.type='button'; b.textContent=T('btn_cl_dm'); b.onclick=()=>{ hpCallUnlock(); hpDmPanel(d,true); }; w.appendChild(b); d.appendChild(w); d.__dm=w; }catch(e){} return d; }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f232){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(d){ hpDmEl(d); const ring=!!(C&&C.dir==='in'&&C.st==='ringing'); if(d.__dm) d.__dm.style.display=ring?'':'none'; if(!ring) hpDmPanel(d,false); } }catch(e){} return r; },f,{__f232:1}); } }catch(e){}
try{ if(typeof setInterval==='function'){ const t=setInterval(()=>{ try{ if(hpDmPend()) hpDmFlush(); }catch(e){} },2000); try{ if(t&&t.unref) t.unref(); }catch(e){} } }catch(e){}

hpVmRing=function(C,dev){ try{ if(!C||!C.vmOn||HP_CALL!==C||C.st!=='calling'||C.dir!=='out') return false; C.vmRingDevs=C.vmRingDevs||{};
    if(dev){ if(C.vmRingDevs[dev]) return false; C.vmRingDevs[dev]=1; } else if(C.vmRing) return false;
    const again=!!C.vmRing; C.vmRing=Date.now(); if(C.vmT) clearTimeout(C.vmT);
    const ms=Math.max(5000,Math.min(C.vmS*1000,HP_CALL_RING_MORE-1500)); C.vmMs=ms; C.vmT=setTimeout(()=>{ try{ if(HP_CALL===C&&C.st==='calling') hpVmAuto(C); }catch(e){} },ms);
    hpLog(again?('通話：相手の別の端末でも鳴り始めたので、音声メッセージまでの '+Math.round(ms/1000)+' 秒を数え直す'):('通話：相手の端末で鳴り始めたので、'+Math.round(ms/1000)+' 秒出なければ音声メッセージに切り替える')); return true; }catch(e){ return false; } };
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f233){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ const C0=HP_CALL, first=!(C0&&C0.vmRing); const v=await f.apply(this,arguments);
    try{ const C=HP_CALL; if(r&&o&&o.v===1&&o.type==='callring'&&r.fromDev&&C&&C===C0&&C.dir==='out'&&C.id===o.call&&C.peer===r.from&&C.st==='calling'&&C.rung){ if(first){ (C.vmRingDevs=C.vmRingDevs||{})[r.fromDev]=1; } else hpVmRing(C,r.fromDev); } }catch(e){} return v; },f,{__f233:1}); } }catch(e){}

hpVmAuto=function(C){ try{ if(!C||HP_CALL!==C||C.st!=='calling'||C.dir!=='out') return false; C.vmTold=1;
    hpLog('通話：'+(C.vmRing?('相手の端末が鳴り始めてから '+Math.round((C.vmMs||0)/1000)+' 秒たっても出なかったので'):(Math.round(HP_VM_CAP/1000)+' 秒たっても相手の端末が鳴り始めないので'))+'、呼び出しをやめた（出なかったと伝える。録音は［音声メッセージを出す］で）');
    hpCallBye('timeout'); hpCallEnd('timeout',TF('vm_noans',{who:nickOf(C.peer)}));
    (async()=>{ try{ await hpVmSay(T('vm_noans_say'),(typeof curLang==='function')?curLang():'ja'); }catch(e){} })(); return true; }catch(e){ hpLog('通話：出なかったと伝えられない（'+((e&&e.message)||e)+'）'); return false; } };

try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f234){ const f=hpCallEnd; hpCallEnd=Object.assign(function(why,text){ const C=HP_CALL; const r=f.apply(this,arguments);
    try{ if(C&&C.vmTold&&why==='timeout'){ HP_CALL=C; hpCallUi(); setTimeout(()=>{ try{ if(HP_CALL===C){ HP_CALL=null; hpCallUi(); } }catch(e){} },HP_VM_TOLD_MS); } }catch(e){} return r; },f,{__f234:1}); } }catch(e){}
const HP_VM_TOLD_MS=6000;

try{ if(typeof hpCpsOpen==='function'&&!hpCpsOpen.__f235){ const f=hpCpsOpen; hpCpsOpen=Object.assign(async function(text){ try{ return await f.apply(this,arguments); }catch(e){
      let h=null; try{ h=JSON.parse(String(text)); }catch(x){ h=null; } if(!(h&&h.v===1&&typeof h.w2==='string'&&typeof hpCkCapOpen==='function')) throw e;
      let r=null; try{ r=await hpCkCapOpen(text); }catch(x){ throw e; }
      try{ hpLog('通話：'+(HP_CPS_NAME[r.k]||'合図')+'を通話用の鍵の包みで開けた（手紙の合わせ鍵では開けない：'+((e&&e.message)||e)+'）'); }catch(x){} return r; } },f,{__f235:1}); } }catch(e){}

const HP_VMT_CSS='#hp-vm .vmb.rev .vc-vtr{display:flex;flex-direction:column;align-items:stretch;gap:4px;margin:6px 0 2px}#hp-vm .vmb.rev .vc-vtl{font-size:11px;color:var(--dim,#8aa0c0)}#hp-vm .vmb.rev .vc-vt{width:100%;box-sizing:border-box;min-height:44px;font-size:13px;background:#0f1830;color:var(--text,#dfe7f5);border:1px solid var(--line,#2a3a5a);border-radius:8px;padding:6px 8px;resize:vertical}';
function hpVmtCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-vmt-css')) return false; const st=document.createElement('style'); st.id='hp-vmt-css'; st.textContent=HP_VMT_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
function hpVmtOk(){ try{ return typeof hpVtlSrOk==='function'&&typeof hpVtlSr==='function'&&hpVtlSrOk(); }catch(e){ return false; } }

function hpVmtStart(R){ try{ if(!R||!R.f||R.vtp||!hpVmtOk()) return false; const ff=R.f; R.vtb=true; R.tx=''; R.txa=0;
    R.vtp=(async()=>{ let t=''; try{ t=String((await hpVtlSr(ff))||'').trim(); }catch(e){ t=''; } if(HP_VMR===R&&R.f===ff){ R.vtb=false; R.tx=t; R.txa=t?1:0; try{ hpVmUi(); }catch(e){} try{ hpLog('通話：音声メッセージの文字を'+(t?'作った（'+t.length+' 字）':'作れなかった')); }catch(e){} } return t; })();
    try{ hpVmUi(); }catch(e){} return true; }catch(e){ return false; } }

function hpVmtRow(b,R){ try{ if(!b||!R) return false; let w=b.__vtr; if(!(R.vtb||R.txa)){ if(w){ w.remove(); b.__vtr=null; } return false; } hpVmtCss();
    if(!w){ w=document.createElement('div'); w.className='vc-r vc-vtr'; const r2=b.querySelector('.vc-r2'); if(r2) b.insertBefore(w,r2); else b.appendChild(w); b.__vtr=w; }
    const key=R.vtb?'busy':'edit:'+R.txa; if(w.__key===key) return true; w.__key=key; w.textContent=''; const l=document.createElement('span'); l.className='vc-vtl'; l.textContent=T(R.vtb?'vt_busy':'vt_edit'); w.appendChild(l);
    if(!R.vtb){ const ta=document.createElement('textarea'); ta.className='vc-vt'; ta.rows=2; ta.value=R.tx||''; ta.oninput=()=>{ R.tx=ta.value; }; w.appendChild(ta); } return true; }catch(e){ return false; } }
try{ if(typeof hpVmEnd==='function'&&!hpVmEnd.__f236){ const f=hpVmEnd; hpVmEnd=Object.assign(async function(){ const v=await f.apply(this,arguments); try{ const R=HP_VMR; if(v&&R&&R.st==='rev'&&R.f) hpVmtStart(R); }catch(e){} return v; },f,{__f236:1}); } }catch(e){}
try{ if(typeof hpVmRevBand==='function'&&!hpVmRevBand.__f236){ const f=hpVmRevBand; hpVmRevBand=Object.assign(function(d,R){ const b=f.apply(this,arguments); try{ hpVmtRow(b,R); }catch(e){} return b; },f,{__f236:1}); } }catch(e){}
try{ if(typeof hpVmRedo==='function'&&!hpVmRedo.__f236){ const f=hpVmRedo; hpVmRedo=Object.assign(async function(){ try{ const R=HP_VMR; if(R){ R.vtp=null; R.vtb=false; R.tx=''; R.txa=0; } }catch(e){} return f.apply(this,arguments); },f,{__f236:1}); } }catch(e){}

try{ if(typeof hpVmSend==='function'&&!hpVmSend.__f236){ const f=hpVmSend; hpVmSend=Object.assign(async function(){ const R=HP_VMR, peer=R?R.peer:'', busy=!!(R&&R.vtb), p=R?R.vtp:null, tx=(R&&!busy)?String(R.tx||'').trim():'';
      const v=await f.apply(this,arguments); if(!v||!peer||typeof hpVtSend!=='function') return v;
      const out=t=>{ try{ if(typeof HP_VT_ACC!=='undefined'){ HP_VT_ACC=true; try{ hpVtSend(peer,t); }finally{ HP_VT_ACC=false; } } else hpVtSend(peer,t); hpLog('通話：音声メッセージの文字を出した（'+t.length+' 字）'); }catch(e){} };
      if(tx) out(tx); else if(busy&&p){ (async()=>{ try{ const t=String((await Promise.race([p,new Promise(z=>setTimeout(()=>z(''),60000))]))||'').trim(); if(t) out(t); }catch(e){} })(); }
      return v; },f,{__f236:1}); } }catch(e){}

const HP_LK_KEY='p2p_lkask';
function hpLkAsk(){ try{ return localStorage.getItem(HP_LK_KEY)==='1'; }catch(e){ return false; } }
function hpLkAskSet(on){ try{ if(on) localStorage.setItem(HP_LK_KEY,'1'); else localStorage.removeItem(HP_LK_KEY); return true; }catch(e){ return false; } }
function hpLkRow(){ try{ if(typeof document==='undefined') return false; const c=document.getElementById('set-call'); if(!c||document.getElementById('set-lk')) return false;
    const r=document.createElement('div'); r.className='kv'; r.id='set-lk'; r.style.marginTop='8px'; const b=document.createElement('b'); b.textContent=T('cl_lk_l'); b.setAttribute('data-i18n','cl_lk_l'); r.appendChild(b);
    const s=document.createElement('select'); s.style.cssText='background:#1b2740;border:none;border-radius:6px;color:inherit;padding:4px 6px';
    const o0=document.createElement('option'); o0.value='0'; o0.textContent=T('cl_lk_0'); o0.setAttribute('data-i18n','cl_lk_0'); s.appendChild(o0);
    const o1=document.createElement('option'); o1.value='1'; o1.textContent=T('cl_lk_1'); o1.setAttribute('data-i18n','cl_lk_1'); s.appendChild(o1);
    s.value=hpLkAsk()?'1':'0'; s.onchange=()=>{ if(hpLkAskSet(s.value==='1')) hpLog('設定：通知から通話に出るとき '+(s.value==='1'?'ロックを解除してから出る':'ロックを解除しなくても出られる')); }; r.appendChild(s);
    const vm=document.getElementById('set-vm'); if(vm&&vm.parentNode===c) c.insertBefore(r,vm.nextSibling); else c.appendChild(r); return true; }catch(e){ return false; } }
try{ if(typeof hpLkOn==='function'&&!hpLkOn.__f237){ const f=hpLkOn; hpLkOn=Object.assign(function(){ if(hpLkAsk()) return false; return f.apply(this,arguments); },f,{__f237:1}); } }catch(e){}
try{ if(typeof hpVmRow==='function'&&!hpVmRow.__f237){ const f=hpVmRow; hpVmRow=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpLkRow(); }catch(e){} return v; },f,{__f237:1}); } }catch(e){}

const HP_CB_CSS='html body #chat-head #btn-conv-call{background:#17233c;border-color:var(--line);color:var(--ink)}';
function hpCbCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cb-css')) return false; const st=document.createElement('style'); st.id='hp-cb-css'; st.textContent=HP_CB_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ hpCbCss(); if(typeof document!=='undefined'&&document&&document.addEventListener&&document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ hpCbCss(); }); }catch(e){}
try{ if(typeof hpVmUi==='function'&&!hpVmUi.__f241){ const f=hpVmUi; hpVmUi=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const R=HP_VMR, d=document.getElementById('hp-vm'); if(R&&d&&d.__msg&&R.st==='rev'){ const t=T('vm_rev_hint'); if(d.__msg.textContent!==t){ d.__msg.textContent=t; d.__msg.className='msg'; } } }catch(e){}
    return v; },f,{__f241:1}); } }catch(e){}
const HP_NT_HIDE_MS=[0,1500,4000,8000];
function hpNtHide(){ try{ if(typeof document==='undefined'||document.visibilityState!=='visible'||typeof navigator==='undefined'||!navigator.serviceWorker||!navigator.serviceWorker.getRegistration) return false;
    navigator.serviceWorker.getRegistration().then(g=>{ if(!g||!g.getNotifications) return; for(const tg of ['hp-sig','hp-call']) g.getNotifications({tag:tg}).then(l=>{ for(const n of (l||[])){ try{ if(!(n.data&&n.data.ended)) n.close(); }catch(e){} } }).catch(()=>{}); }).catch(()=>{}); return true; }catch(e){ return false; } }
function hpNtHideSoon(){ try{ for(const ms of HP_NT_HIDE_MS) setTimeout(hpNtHide,ms); return true; }catch(e){ return false; } }
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f241){ const f=hpCallEnd; hpCallEnd=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpNtHideSoon(); }catch(e){} return v; },f,{__f241:1}); } }catch(e){}
let HP_BEEP_NODES=[]; const HP_BEEP_MAX=40;
hpCallBeep=function(f,dur,vol,at,am){ try{ const C=window.AudioContext||window.webkitAudioContext; if(!C) return; if(!HP_CALL_AC) HP_CALL_AC=new C(); const a=HP_CALL_AC; try{ if(a.state==='suspended') a.resume(); }catch(e){} const t0=a.currentTime+(at||0), o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=f;
    g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(vol,t0+0.02); g.gain.setValueAtTime(vol,t0+Math.max(0.03,dur-0.05)); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur); o.connect(g); const ns=[o,g];
    if(am){ const l=a.createOscillator(), lg=a.createGain(), mg=a.createGain(); l.frequency.value=am; lg.gain.value=0.5; mg.gain.value=0.5; l.connect(lg); lg.connect(mg.gain); g.connect(mg); mg.connect(a.destination); l.start(t0); l.stop(t0+dur+0.02); ns.push(l,mg); } else g.connect(a.destination);
    o.start(t0); o.stop(t0+dur+0.02); HP_BEEP_NODES.push(ns); if(HP_BEEP_NODES.length>HP_BEEP_MAX) HP_BEEP_NODES.splice(0,HP_BEEP_NODES.length-HP_BEEP_MAX); }catch(e){} };
function hpBeepKill(){ const l=HP_BEEP_NODES; HP_BEEP_NODES=[]; for(const ns of l){ for(const n of ns){ try{ if(n.stop) n.stop(0); }catch(e){} try{ n.disconnect(); }catch(e){} } } return l.length; }
try{ if(typeof hpCallTone==='function'&&!hpCallTone.__f241){ const f=hpCallTone; hpCallTone=Object.assign(function(k){ try{ if(k!==HP_CALL_TONE) hpBeepKill(); }catch(e){} return f.apply(this,arguments); },f,{__f241:1}); } }catch(e){}

try{ if(typeof hpCallStart==='function'&&!hpCallStart.__f241){ const f=hpCallStart; hpCallStart=Object.assign(function(){ try{ hpBeepKill(); }catch(e){} return f.apply(this,arguments); },f,{__f241:1}); } }catch(e){}
try{ if(typeof hpCallAccept==='function'&&!hpCallAccept.__f241){ const f=hpCallAccept; hpCallAccept=Object.assign(function(){ try{ hpBeepKill(); }catch(e){} return f.apply(this,arguments); },f,{__f241:1}); } }catch(e){}

try{ if(typeof hpVmUi==='function'&&!hpVmUi.__f249){ const f=hpVmUi; hpVmUi=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const R=HP_VMR, d=document.getElementById('hp-vm'); if(R&&d&&d.__msg&&R.st!=='rev'&&R.st!=='cancel'&&d.__msg.textContent===TF('vm_noans',{who:nickOf(R.peer)})) d.__msg.textContent=''; }catch(e){}
    return v; },f,{__f249:1}); } }catch(e){}

const HP_BEEP_MAX2=600;
hpRingNote=function(a,type,f,t0,dur,vol){ const o=a.createOscillator(), g=a.createGain(); o.type=type; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(vol,t0+0.005); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur); o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0+dur+0.02); try{ HP_BEEP_NODES.push([o,g]); if(HP_BEEP_NODES.length>HP_BEEP_MAX2) HP_BEEP_NODES.splice(0,HP_BEEP_NODES.length-HP_BEEP_MAX2); }catch(e){} };
try{ if(typeof hpCallRing==='function'&&!hpCallRing.__f250){ const f=hpCallRing; hpCallRing=Object.assign(function(on){ try{ hpBeepKill(); }catch(e){} return f.apply(this,arguments); },f,{__f250:1}); } }catch(e){}
function hpBeepVis(){ try{ if(typeof document==='undefined'||document.visibilityState!=='visible') return false; const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; if(C&&C.st!=='ended') return false; return hpBeepKill()>0; }catch(e){ return false; } }
try{ if(typeof document!=='undefined'&&document&&document.addEventListener) document.addEventListener('visibilitychange',hpBeepVis); }catch(e){}

var HP_VM_WAKE_MS=1000;
async function hpVmAcWake(R){ try{ if(!R) return 'none'; const was=R.ac?String(R.ac.state||'?'):'none';
    if(!R.ac||R.ac.state==='closed'){ const A=(typeof AudioContext!=='undefined')?AudioContext:((typeof webkitAudioContext!=='undefined')?webkitAudioContext:null); if(A){ R.ac=new A(); R.own=true; } }
    const ac=R.ac; if(ac&&ac.state==='suspended'&&ac.resume) await Promise.race([Promise.resolve(ac.resume()).catch(()=>{}),new Promise(r=>setTimeout(r,HP_VM_WAKE_MS))]);
    return was+'→'+(R.ac?String(R.ac.state||'?'):'none'); }catch(e){ return 'err'; } }
try{ if(typeof hpVmRedo==='function'&&!hpVmRedo.__f252){ const f=hpVmRedo; hpVmRedo=Object.assign(async function(){ const R=HP_VMR; try{ if(R&&(R.st==='rec'||R.st==='rev')) hpLog('通話：音声メッセージを録り直す前に音の口を起こした（'+(await hpVmAcWake(R))+'）'); }catch(e){} return f.apply(this,arguments); },f,{__f252:1}); } }catch(e){}

var HP_TIP_CSS='#hp-call .hp-tip{margin:12px auto 0;max-width:min(92vw,440px);font-size:13px;line-height:1.6;color:var(--dim,#9fb0c8);text-align:center;white-space:normal}';
function hpTipEl(d){ try{ let t=d.__tip; if(!t){ t=document.createElement('div'); t.className='hp-tip'; d.__tip=t; }
    if(d.__st&&d.__st.parentNode){ if(t.previousSibling!==d.__st) d.__st.parentNode.insertBefore(t,d.__st.nextSibling); } else if(!t.parentNode) d.appendChild(t);
    if(document.head&&!document.getElementById('hp-tip-css')){ const s=document.createElement('style'); s.id='hp-tip-css'; s.textContent=HP_TIP_CSS; document.head.appendChild(s); } return t; }catch(e){ return null; } }
function hpTipStop(C){ try{ if(C&&C.tipT){ clearTimeout(C.tipT); C.tipT=null; } }catch(e){} }
function hpTipNext(C){ return false; }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f254){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'), on=!!(C&&C.st==='calling'&&C.dir==='out');
      if(on){ if(!C.tipT) hpTipNext(C); else if(d&&d.__tip) hpTipEl(d); }
      else { if(C) hpTipStop(C); if(d&&d.__tip){ d.__tip.textContent=''; d.__tip.style.display='none'; } } }catch(e){} return r; },f,{__f254:1}); } }catch(e){}

var HP_VM_BEEP_AU=null;
function hpVmBeepWav(){ const sr=16000, n=Math.round(sr*0.45), b=new ArrayBuffer(44+n*2), v=new DataView(b), w=(o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i)); };
  w(0,'RIFF'); v.setUint32(4,36+n*2,true); w(8,'WAVE'); w(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,sr,true); v.setUint32(28,sr*2,true); v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,'data'); v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){ const env=Math.min(1,i/160,(n-i)/160); v.setInt16(44+i*2,Math.round(Math.sin(2*Math.PI*1000*i/sr)*0.35*32767*env),true); } return new Blob([b],{type:'audio/wav'}); }
function hpVmBeepPrime(){ try{ if(HP_VM_BEEP_AU) return true; if(typeof Audio==='undefined'||typeof URL==='undefined'||!URL.createObjectURL) return false; const a=new Audio(URL.createObjectURL(hpVmBeepWav())); a.preload='auto'; a.muted=true; HP_VM_BEEP_AU=a;
    const p=a.play(), back=()=>{ try{ a.pause(); a.currentTime=0; }catch(e){} try{ a.muted=false; }catch(e){} }; if(p&&p.then) p.then(back,()=>{ try{ a.muted=false; }catch(e){} }); else back(); return true; }catch(e){ return false; } }
function hpVmBeepAu(){ return new Promise(res=>{ let done=false; const end=v=>{ if(!done){ done=true; res(v); } }; try{ const a=HP_VM_BEEP_AU; if(!a) return end(false); a.muted=false; try{ a.currentTime=0; }catch(e){} a.onended=()=>end(true); const p=a.play(); if(p&&p.catch) p.catch(()=>end(false)); setTimeout(()=>end(true),900); }catch(e){ end(false); } }); }
try{ if(typeof hpVmGo==='function'&&!hpVmGo.__f261){ const f=hpVmGo; hpVmGo=Object.assign(function(){ try{ hpVmBeepPrime(); }catch(e){} return f.apply(this,arguments); },f,{__f261:1}); } }catch(e){}
try{ if(typeof hpVmBeep==='function'&&!hpVmBeep.__f261){ const f=hpVmBeep; hpVmBeep=Object.assign(async function(ac){ const st=ac?String(ac.state||'?'):'none'; let how='none';
    try{ if(HP_VM_BEEP_AU&&await hpVmBeepAu()) how='audio'; }catch(e){}
    if(how==='none'&&ac){ try{ if((ac.state==='suspended'||ac.state==='interrupted')&&ac.resume) await Promise.race([Promise.resolve(ac.resume()).catch(()=>{}),new Promise(r=>setTimeout(r,800))]); }catch(e){} if(ac.state==='running'){ await f.call(this,ac); how='ac'; } }
    try{ hpLog('通話：発信音を鳴らした（音の口 '+st+'→'+(ac?String(ac.state||'?'):'none')+'・'+how+'）'); }catch(e){} return how!=='none'; },f,{__f261:1}); } }catch(e){}

var HP_CL3_CSS='#hp-call.cl3>*{order:8}#hp-call.cl3>.who{order:1}#hp-call.cl3>.wt{order:2;opacity:.8;font-size:.95em;margin-top:2px}#hp-call.cl3>.ito{order:3}#hp-call.cl3>.stp{order:4}#hp-call.cl3>.st{order:5;text-align:left;width:min(320px,86vw);box-sizing:border-box;line-height:1.6}#hp-call.cl3>.hp-tip{order:6}#hp-call.cl3>.btns{order:9}#hp-call.cl3 .stp{align-items:flex-start}#hp-call.cl3 .stp .s{display:flex;flex-direction:column;align-items:center}#hp-call.cl3 .stp .s small{font-size:.8em;opacity:.7;margin-top:2px;font-variant-numeric:tabular-nums;min-height:1.2em}#hp-call.cl3 .stp b{padding-top:3px}'
  +'#hp-call .hp-tip{border:1px solid #2a3850;border-radius:12px;padding:10px 14px;background:#151c29;text-align:left;width:min(320px,86vw);box-sizing:border-box;margin:18px auto 0}#hp-call .hp-tip h4{margin:0 0 4px;font-size:12px;color:#7f93b3;font-weight:600}#hp-call .hp-tip p{margin:0;font-size:13px;color:#a8b6cb;line-height:1.6}#hp-call .hp-tip .dots{margin-top:6px;text-align:center;color:#3c4b63;font-size:10px;letter-spacing:4px}';
function hpCl3On(C){ return !!(C&&C.dir==='out'&&(C.st==='calling'||C.st==='connecting')); }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f263){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(!d||!d.classList) return r; const on=hpCl3On(C);
      if(on) d.classList.add('cl3'); else d.classList.remove('cl3');
      if(document.head&&!document.getElementById('hp-cl3-css')){ const s=document.createElement('style'); s.id='hp-cl3-css'; s.textContent=HP_CL3_CSS; document.head.appendChild(s); }
      if(on){ if(d.__wt&&C.at){ d.__wt.textContent=TF(C.st==='calling'?'cl_hd_call':'cl_hd_conn',{n:Math.max(0,Math.floor((Date.now()-C.at)/1000))}); d.__wt.style.display=''; }
        if(d.__stp){ const k=(typeof hpCallStage==='function')?hpCallStage(C):2, now=Date.now(); if(k===3&&!C.cl3Pull) C.cl3Pull=now; const at=C.at||now, g=C.gathered||0, sn=C.sent||0, pl=C.cl3Pull||0;
          const dur=[g?g-at:now-at, g?(sn?sn-g:now-g):null, sn?(pl?pl-sn:now-sn):null, pl?now-pl:null], fmt=ms=>{ if(ms==null) return ''; const v=Math.max(0,ms)/1000; return TF('cl_wait',{n:v<1?v.toFixed(1):String(Math.floor(v))}); };
          d.__stp.textContent=''; d.__stp.classList&&d.__stp.classList.add('cl3s'); ['cl_step_tie','cl_step_run','cl_step_ring','cl_step_pull'].forEach((x,i)=>{ if(i){ const sp=document.createElement('b'); sp.textContent='›'; d.__stp.appendChild(sp); } const w=document.createElement('span'); w.className='s'; const e=document.createElement('i'); e.textContent=T(x); if(i===k) e.className='on'; else if(i<k) e.className='dn'; const sm=document.createElement('small'); sm.textContent=(i<=k)?fmt(dur[i]):''; w.appendChild(e); w.appendChild(sm); d.__stp.appendChild(w); }); d.__stp.__k=''; d.__stp.style.display=''; }
        const ja=(typeof curLang==='function')?curLang()==='ja':true, nm=(typeof nickOf==='function')?String(nickOf(C.peer)||''):''; if(ja&&nm&&d.__st&&String(d.__st.textContent||'').indexOf(nm)>=0) d.__st.textContent=String(d.__st.textContent).replace(new RegExp(' ?'+nm.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+' ?','g'),T('cl_who_ref')); } }catch(e){} return r; },f,{__f263:1}); } }catch(e){}

try{ if(typeof hpVmBeep==='function'&&!hpVmBeep.__f264){ const f=hpVmBeep; hpVmBeep=Object.assign(async function(ac){ const v=await f.apply(this,arguments);
    try{ if(ac&&(ac.state==='suspended'||ac.state==='interrupted')&&ac.resume){ const was=String(ac.state); await Promise.race([Promise.resolve(ac.resume()).catch(()=>{}),new Promise(r=>setTimeout(r,800))]); hpLog('通話：録音の前に音の口を起こした（'+was+'→'+String(ac.state||'?')+'）'); } }catch(e){} return v; },f,{__f264:1}); } }catch(e){}

var HP_WHY_PX=9, HP_WHY_TICK=50;
var HP_WHY_CSS='#hp-call .hp-tip .wsc{max-height:9.6em;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;scrollbar-width:thin}#hp-call .hp-tip .wsc p{padding-top:9.6em;margin:0}#hp-call.cl3>.hp-tip{margin-bottom:28px}';
function hpWhyRun(C,sc){ try{ if(C.whyIv) clearInterval(C.whyIv); let pos=0; const stopMan=()=>{ C.whyMan=1; if(C.whyIv){ clearInterval(C.whyIv); C.whyIv=null; } };
    for(const ev of ['pointerdown','touchstart','wheel']) try{ sc.addEventListener(ev,stopMan,{passive:true}); }catch(e){}
    C.whyIv=setInterval(()=>{ try{ if(HP_CALL!==C||C.st!=='calling'||C.whyMan){ clearInterval(C.whyIv); C.whyIv=null; return; } const max=Math.max(0,(sc.scrollHeight||0)-(sc.clientHeight||0)); pos+=HP_WHY_PX*HP_WHY_TICK/1000; if(pos>=max){ sc.scrollTop=max; clearInterval(C.whyIv); C.whyIv=null; C.whyDone=1; return; } sc.scrollTop=pos; }catch(e){} },HP_WHY_TICK); return true; }catch(e){ return false; } }
hpTipNext=function(C){ try{ if(!C||HP_CALL!==C||C.st!=='calling'||C.dir!=='out'){ hpTipStop(C); if(C&&C.whyIv){ clearInterval(C.whyIv); C.whyIv=null; } return false; } const d=document.getElementById('hp-call'), t=d?hpTipEl(d):null; if(!t) return false;
    if(document.head&&!document.getElementById('hp-why-css')){ const s=document.createElement('style'); s.id='hp-why-css'; s.textContent=HP_WHY_CSS; document.head.appendChild(s); }
    t.textContent=''; const h=document.createElement('h4'); h.textContent=T('cl_why_h'); const sc=document.createElement('div'); sc.className='wsc'; const p=document.createElement('p'); p.textContent=T('cl_why_all'); sc.appendChild(p); t.appendChild(h); t.appendChild(sc); t.style.display='';
    C.tipT='why'; hpWhyRun(C,sc); return true; }catch(e){ return false; } };

var HP_CL3B_CSS='#hp-call.cl3{justify-content:flex-start;overflow-y:auto;padding-top:calc(env(safe-area-inset-top,0px) + 28px);padding-bottom:calc(170px + env(safe-area-inset-bottom,0px))}#hp-call.cl3>.st{min-height:4.8em}#hp-call.cl3>.hp-tip{margin-bottom:0}#hp-call .hp-tip .wsc p{padding-top:4.8em;white-space:pre-line}';
function hpCl3bCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cl3b-css')) return false; const s=document.createElement('style'); s.id='hp-cl3b-css'; s.textContent=HP_CL3B_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
hpCl3bCss();

var HP_CL3_HOLD=4000, HP_CL3_END=4000;
function hpCl3Hold(C){ try{ if(!C||C.dir!=='out'||C.cl3K==null) return ''; const now=Date.now(); if(C.st==='talking'&&C.talkAt&&now-C.talkAt<HP_CL3_HOLD) return 'ok'; if(C.st==='ended'&&!C.talkAt&&C.cl3EndAt) return 'ng'; return ''; }catch(e){ return ''; } }
function hpCl3Steps(d,C,E,kk,all){ const at=C.at||E, g=C.gathered||0, sn=C.sent||0, pl=C.cl3Pull||0, fmt=ms=>{ if(ms==null) return ''; const v=Math.max(0,ms)/1000; return TF('cl_wait',{n:v<1?v.toFixed(1):String(Math.floor(v))}); };
  const dur=[g?g-at:E-at, g?(sn?sn-g:E-g):null, sn?(pl?pl-sn:E-sn):null, pl?E-pl:null];
  d.__stp.textContent=''; d.__stp.classList&&d.__stp.classList.add('cl3s'); ['cl_step_tie','cl_step_run','cl_step_ring','cl_step_pull'].forEach((x,i)=>{ if(i){ const sp=document.createElement('b'); sp.textContent='›'; d.__stp.appendChild(sp); } const w=document.createElement('span'); w.className='s'; const e=document.createElement('i'); e.textContent=T(x); if(all||i<kk) e.className='dn'; else if(i===kk) e.className='on'; const sm=document.createElement('small'); sm.textContent=(all?dur[i]!=null:i<=kk)?fmt(dur[i]):''; w.appendChild(e); w.appendChild(sm); d.__stp.appendChild(w); }); d.__stp.__k=''; d.__stp.style.display=''; }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f267){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(!d||!d.classList||!C) return r;
      if(C.dir==='out'&&(C.st==='calling'||C.st==='connecting')){ C.cl3K=(typeof hpCallStage==='function')?hpCallStage(C):2; return r; }
      const h=hpCl3Hold(C); if(!h) return r; const now=Date.now(), E=h==='ok'?C.talkAt:C.cl3EndAt;
      d.classList.add('cl3'); if(d.__wt){ d.__wt.textContent=TF(h==='ok'?'cl_hd_ok':'cl_hd_ng',{n:Math.max(0,Math.floor((E-(C.at||E))/1000))}); d.__wt.style.display=''; }
      if(d.__stp) hpCl3Steps(d,C,E,h==='ok'?4:C.cl3K,h==='ok');
      if(d.__tip) d.__tip.style.display='none';
      if(h==='ok'&&!C.cl3HoldT){ C.cl3HoldT=setTimeout(()=>{ try{ if(HP_CALL===C) hpCallUi(); }catch(e){} },Math.max(50,HP_CL3_HOLD-(now-C.talkAt)+50)); hpLog('通話：つながるまで '+Math.floor((E-(C.at||E))/1000)+' 秒'); }
    }catch(e){} return r; },f,{__f267:1}); } }catch(e){}
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f267){ const f=hpCallEnd; hpCallEnd=Object.assign(function(){ const C=HP_CALL; let ng=false;
    try{ ng=!!(C&&C.st!=='ended'&&C.dir==='out'&&!C.talkAt&&C.cl3K!=null); if(ng) C.cl3EndAt=Date.now(); }catch(e){ ng=false; }
    if(!ng) return f.apply(this,arguments);
    const g=(typeof globalThis!=='undefined')?globalThis:window, st=g.setTimeout; let r;
    g.setTimeout=function(fn,ms){ const a=Array.prototype.slice.call(arguments); if(ms===2200) a[1]=HP_CL3_END; return st.apply(g,a); };
    try{ r=f.apply(this,arguments); }finally{ g.setTimeout=st; }
    try{ hpLog('通話：つながらずに終わった（'+Math.floor((C.cl3EndAt-(C.at||C.cl3EndAt))/1000)+' 秒・'+['結ぶ','運ぶ','鳴らす','張る'][Math.max(0,Math.min(3,C.cl3K))]+'まで）'); }catch(e){} return r; },f,{__f267:1}); } }catch(e){}

var HP_CBAR2_CSS='html body #hp-call-bar{background:#111a2c;border:2px solid #4a6a9c;box-shadow:0 8px 28px rgba(0,0,0,.7);width:max-content}@media (max-width:700px){html body #hp-call-bar{width:calc(100vw - 24px);max-width:calc(100vw - 24px);box-sizing:border-box;flex-wrap:wrap;row-gap:8px;column-gap:6px;justify-content:flex-end;padding:10px 10px 10px 14px}html body #hp-call-bar .t{flex:1 0 100%;white-space:normal;overflow:visible}html body #hp-call-bar button{padding:7px 10px}html body #hp-call-bar button.x{padding:7px 6px}}';
function hpCbar2Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cbar2-css')) return false; const s=document.createElement('style'); s.id='hp-cbar2-css'; s.textContent=HP_CBAR2_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
hpCbar2Css();

var HP_CH_Q=[], HP_CH_T=null;
function hpChKind(C){ if(!C) return ''; if(C.talkAt) return 'ans'; const w=String(C.why||''); if(w==='decline') return 'decl'; if(w==='peer:taken') return 'taken'; if(/^(peer:)?(lost|fail)$/.test(w)&&C.accAt) return 'fail'; return 'miss'; }
function hpChRow(C){ const r=hpChKind(C); if(!r) return null; const o={d:'c',t:'',ts:Number(C.at)||Date.now(),cl:{r:r}}; if(r==='ans') o.cl.s=Math.max(0,Math.round((Date.now()-C.talkAt)/1000)); return o; }
function hpChReady(){ try{ return typeof hpCtlReady!=='function'||hpCtlReady(); }catch(e){ return false; } }
function hpChSave(peer,o){ try{ if(!peer||!o) return false; if(!hpChReady()){ HP_CH_Q.push([peer,o]); hpChArm(); return false; }
    const h=histLoad(peer); if(h.some(m=>m&&m.d==='c'&&m.ts===o.ts)) return false; h.push(o); histSave(peer,histSort(h));
    try{ hpLog('通話：'+nickOf(peer)+((typeof hpChOut==='function'&&hpChOut(o))?' へかけた通話':' からの着信')+'を手紙に残した（'+o.cl.r+(o.cl.s!=null?'・'+o.cl.s+' 秒':'')+'）'); }catch(e){}
    try{ if(typeof CURPEER!=='undefined'&&CURPEER===peer&&typeof CONV_OPEN!=='undefined'&&CONV_OPEN&&typeof histRender==='function') histRender(peer); }catch(e){}
    try{ if(typeof renderConvList==='function') renderConvList(); }catch(e){} return true; }catch(e){ return false; } }
function hpChArm(){ if(HP_CH_T) return; HP_CH_T=setInterval(()=>{ try{ if(!HP_CH_Q.length){ clearInterval(HP_CH_T); HP_CH_T=null; return; } if(!hpChReady()) return; const q=HP_CH_Q.splice(0); for(const [p,o] of q) hpChSave(p,o); }catch(e){} },3000); }
function hpChText(m){ const c=(m&&m.cl)||{}; const k={ans:'ch_ans',miss:'ch_miss',decl:'ch_decl',taken:'ch_taken',fail:'ch_fail'}[c.r]||'ch_miss'; return TF(k,{d:(typeof hpCallFmt==='function')?hpCallFmt((Number(c.s)||0)*1000):String(c.s||0)}); }
function hpChTime(ts){ try{ return new Date(Number(ts)).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}); }catch(e){ return ''; } }
function hpChEl(a,m){ try{ const s=document.createElement('div'); s.className='m sys hp-ch'+((m.cl&&m.cl.r==='miss')?' miss':''); s.dataset.ts=String(m.ts);
    try{ if(typeof hpCallIcon==='function'){ const ic=hpCallIcon(14); ic.style.cssText='vertical-align:-2px;margin-right:6px'; s.appendChild(ic); } }catch(e){}
    const t=document.createElement('span'); t.textContent=hpChText(m)+'　'+hpChTime(m.ts); s.appendChild(t);
    const b=document.createElement('button'); b.type='button'; b.className='b'; b.textContent=T('ch_back'); b.style.cssText='margin-left:10px;padding:2px 12px;font-size:12.5px';
    b.onclick=()=>{ try{ if(typeof hpCallStart==='function') hpCallStart(a).catch(()=>{}); }catch(e){} };
    if(!(typeof hpCallCan==='function'&&hpCallCan()&&typeof hpCardOf==='function'&&hpCardOf(a))) b.style.display='none'; s.appendChild(b); return s; }catch(e){ return null; } }
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__ch){ const f=hpCallEnd; hpCallEnd=Object.assign(function(){ const C=HP_CALL, was=C&&C.st; const r=f.apply(this,arguments);
    try{ if(C&&C.dir==='in'&&was!=='ended'&&C.st==='ended'&&!C.chDone){ C.chDone=1; const o=hpChRow(C); if(o) hpChSave(C.peer,o); } }catch(e){} return r; },f,{__ch:1}); } }catch(e){}
try{ if(typeof hpCallAccept==='function'&&!hpCallAccept.__ch){ const f=hpCallAccept; hpCallAccept=Object.assign(function(){ try{ if(HP_CALL&&HP_CALL.dir==='in') HP_CALL.accAt=Date.now(); }catch(e){} return f.apply(this,arguments); },f,{__ch:1}); } }catch(e){}
try{ if(typeof convPreview==='function'&&!convPreview.__ch){ const f=convPreview; convPreview=Object.assign(function(m){ try{ if(m&&m.d==='c') return hpChText(m); }catch(e){} return f.apply(this,arguments); },f,{__ch:1}); } }catch(e){}

var HP_WHY2_CSS='html body #hp-call .hp-tip .wsc p.w1{padding-top:6.4em}html body #hp-call .hp-tip .wsc p.w2{padding-top:0}html body #hp-call .hp-tip .wsc .wsep{margin:1.6em 0 1em;height:0;border-top:1px solid rgba(160,180,210,.35)}';
function hpWhyTwo(sc){ try{ if(!sc||sc.__two) return false; const p=sc.querySelector&&sc.querySelector('p'); if(!p) return false; sc.__two=1; p.classList.add('w1');
    const hr=document.createElement('div'); hr.className='wsep'; const p2=document.createElement('p'); p2.className='w2'; p2.textContent=p.textContent; sc.appendChild(hr); sc.appendChild(p2);
    if(document.head&&!document.getElementById('hp-why2-css')){ const s=document.createElement('style'); s.id='hp-why2-css'; s.textContent=HP_WHY2_CSS; document.head.appendChild(s); } return true; }catch(e){ return false; } }
try{ if(typeof hpTipNext==='function'&&!hpTipNext.__two){ const f=hpTipNext; hpTipNext=Object.assign(function(C){ const r=f.apply(this,arguments);
    try{ if(r&&C&&C.tipT==='why'){ const d=document.getElementById('hp-call'), sc=d&&d.querySelector?d.querySelector('.hp-tip .wsc'):null; hpWhyTwo(sc); } }catch(e){} return r; },f,{__two:1}); } }catch(e){}

var HP_CL3_SNAP=null, HP_CL3_SNAPEL=null, HP_CL3_LP=600;
var HP_CL3NG_CSS='html body #hp-call.cl3.cl3ng>.st{text-align:center!important;width:100%!important;align-self:center;font-size:1.15em}html body #hp-call.snap{z-index:9100}html body #hp-call.snap>.snx{position:absolute;left:50%;transform:translateX(-50%);bottom:calc(40px + env(safe-area-inset-bottom,0px))}#hp-call-bar .t{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}';
function hpCl3ngCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cl3ng-css')) return false; const s=document.createElement('style'); s.id='hp-cl3ng-css'; s.textContent=HP_CL3NG_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpCl3SnapTake(d,C){ try{ if(!d||!d.cloneNode||!C) return false; const k=d.cloneNode(true); const rm=s=>{ try{ for(const e of Array.from(k.querySelectorAll(s))) if(e.parentNode) e.parentNode.removeChild(e); }catch(e){} }; rm('button'); rm('.hp-tip'); rm('audio'); rm('video');
    HP_CL3_SNAP={id:C.id,peer:C.peer,el:k}; return true; }catch(e){ return false; } }
function hpCl3SnapHide(){ try{ if(HP_CL3_SNAPEL&&HP_CL3_SNAPEL.parentNode) HP_CL3_SNAPEL.parentNode.removeChild(HP_CL3_SNAPEL); }catch(e){} HP_CL3_SNAPEL=null; return true; }
function hpCl3SnapShow(id){ try{ const S=HP_CL3_SNAP; if(!S||(id&&S.id!==id)||(typeof HP_CALL!=='undefined'&&HP_CALL&&HP_CALL.st!=='ended')) return false; hpCl3SnapHide(); hpCl3ngCss();
    const k=S.el.cloneNode(true); if(k.classList) k.classList.add('snap'); k.style.display='flex'; k.setAttribute('role','dialog'); k.setAttribute('aria-modal','true');
    const x=document.createElement('button'); x.type='button'; x.className='b snx'; x.textContent=T('btn_cl_close'); k.appendChild(x); k.onclick=()=>hpCl3SnapHide();
    (document.body||document.documentElement).appendChild(k); HP_CL3_SNAPEL=k; try{ hpLog('通話：前の呼び出し結果を開いた'); }catch(e){} return true; }catch(e){ return false; } }
function hpCl3LpArm(b,C){ try{ if(!b||!C) return false; b.__lpId=C.id; if(b.__lp) return true; b.__lp=1; let t=null; const stop=()=>{ if(t){ clearTimeout(t); t=null; } };
    b.addEventListener('pointerdown',ev=>{ try{ const tg=ev&&ev.target; if(tg&&tg.closest&&tg.closest('button')) return; stop(); t=setTimeout(()=>{ t=null; hpCl3SnapShow(b.__lpId); },HP_CL3_LP); }catch(e){} });
    for(const n of ['pointerup','pointercancel','pointerleave']) b.addEventListener(n,stop); b.addEventListener('contextmenu',ev=>{ try{ if(HP_CL3_SNAP&&HP_CL3_SNAP.id===b.__lpId) ev.preventDefault(); }catch(e){} }); return true; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f274){ const f=hpCallUi; hpCallUi=Object.assign(function(){ try{ if(HP_CALL&&HP_CALL.st!=='ended') hpCl3SnapHide(); }catch(e){} const r=f.apply(this,arguments);
    try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(d&&d.classList){ const h=(C&&typeof hpCl3Hold==='function')?hpCl3Hold(C):''; if(h==='ng'){ hpCl3ngCss(); d.classList.add('cl3ng'); } else d.classList.remove('cl3ng'); if(h) hpCl3SnapTake(d,C); } }catch(e){} return r; },f,{__f274:1}); } }catch(e){}
try{ if(typeof hpCallBar==='function'&&!hpCallBar.__f274){ const f=hpCallBar; hpCallBar=Object.assign(function(C){ const r=f.apply(this,arguments); try{ if(!C){ hpCl3SnapHide(); return r; } hpCl3ngCss(); const b=document.getElementById('hp-call-bar'); if(b) hpCl3LpArm(b,C); }catch(e){} return r; },f,{__f274:1}); } }catch(e){}

function hpCallHmDay(t,now){ try{ const d=new Date(Number(t)), n=new Date(Number(now)), p=x=>String(x).padStart(2,'0'); if(!(d.getTime()>0)) return '?'; const same=d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate();
    return (same?'':(d.getMonth()+1)+'/'+d.getDate()+' ')+p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds()); }catch(e){ return '?'; } }
hpCallHm=function(t){ return hpCallHmDay(t,Date.now()); };

var HP_CH_O_CSS='html body .m.sys.hp-ch.miss{border:2px solid #e6a23c;border-radius:14px;padding:10px 14px;margin:12px auto;background:rgba(230,162,60,.10);color:#f3c27a;font-size:15px;font-weight:700;line-height:1.5}html body .m.sys.hp-ch.miss button{font-weight:700}';
function hpChOutKind(C){ if(!C) return ''; if(C.talkAt) return 'oans'; const w=String(C.why||''); if(/^(peer:)?timeout$/.test(w)) return 'onoans'; if(w==='peer:decline') return 'odecl'; if(w==='peer:busy') return 'obusy'; if(w==='hangup') return 'ocancel'; return 'ofail'; }
function hpChOutRow(C){ const r=hpChOutKind(C); if(!r) return null; const o={d:'c',t:'',ts:Number(C.at)||Date.now(),cl:{r:r}}; if(r==='oans') o.cl.s=Math.max(0,Math.round((Date.now()-C.talkAt)/1000)); return o; }
function hpChOut(m){ return !!(m&&m.cl&&/^o/.test(String(m.cl.r||''))); }
function hpChOCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-ch-o-css')) return false; const s=document.createElement('style'); s.id='hp-ch-o-css'; s.textContent=HP_CH_O_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__cho){ const f=hpCallEnd; hpCallEnd=Object.assign(function(){ const C=HP_CALL, was=C&&C.st; const r=f.apply(this,arguments);
    try{ if(C&&C.dir==='out'&&was!=='ended'&&C.st==='ended'&&!C.chDone&&C.peer){ C.chDone=1; const o=hpChOutRow(C); if(o) hpChSave(C.peer,o); } }catch(e){} return r; },f,{__cho:1}); } }catch(e){}
hpChText=function(m){ const c=(m&&m.cl)||{}; const k={ans:'ch_ans',miss:'ch_miss',decl:'ch_decl',taken:'ch_taken',fail:'ch_fail',oans:'ch_oans',onoans:'ch_onoans',odecl:'ch_odecl',obusy:'ch_obusy',ocancel:'ch_ocancel',ofail:'ch_ofail'}[c.r]||'ch_miss'; return TF(k,{d:(typeof hpCallFmt==='function')?hpCallFmt((Number(c.s)||0)*1000):String(c.s||0)}); };
try{ if(typeof hpChEl==='function'&&!hpChEl.__cho){ const f=hpChEl; hpChEl=Object.assign(function(a,m){ const s=f.apply(this,arguments); try{ if(s&&m&&m.cl&&m.cl.r==='miss'){ hpChOCss(); const b=s.querySelector?s.querySelector('button'):null; if(b&&b.classList) b.classList.add('pri'); } }catch(e){} return s; },f,{__cho:1}); } }catch(e){}

var HP_CH_NEAR=180000;
function hpBarWant(C){ try{ if(!C) return true; if(C.dir==='in') return false; if(C.dir!=='out') return false; if(C.talkAt) return false; if(String(C.why||'')==='hangup') return false; return true; }catch(e){ return true; } }
function hpChMissEnsure(peer,at){ try{ if(!peer) return false; const t=Number(at)||Date.now(), near=m=>m&&m.d==='c'&&m.cl&&!/^o/.test(String(m.cl.r||''))&&Math.abs(Number(m.ts)-t)<HP_CH_NEAR;
    if(typeof HP_CH_Q!=='undefined'&&HP_CH_Q.some(x=>x&&x[0]===peer&&near(x[1]))) return false; if(typeof hpChReady==='function'&&hpChReady()&&histLoad(peer).some(near)) return false;
    return hpChSave(peer,{d:'c',t:'',ts:t,cl:{r:'miss'}}); }catch(e){ return false; } }
try{ if(typeof hpCallBar==='function'&&!hpCallBar.__f280){ const f=hpCallBar; hpCallBar=Object.assign(function(C){ if(C&&!hpBarWant(C)){ try{ hpLog('通話：終わりの帯は出さない（'+(C.dir==='in'?'かかってきた通話':C.dir==='out'?'かけた通話・'+(C.talkAt?'話し終えた':'取りやめた'):'出られなかった呼び出し')+'。手紙の 1 行で知らせる）'); }catch(e){} return f.call(this,null); } return f.apply(this,arguments); },f,{__f280:1}); } }catch(e){}
try{ if(typeof hpCallMissedBar==='function'&&!hpCallMissedBar.__f280){ const f=hpCallMissedBar; hpCallMissedBar=Object.assign(function(peer,at){ try{ if(peer&&!(typeof hpBlocked==='function'&&hpBlocked(peer))) hpChMissEnsure(peer,at); }catch(e){} return f.apply(this,arguments); },f,{__f280:1}); } }catch(e){}

var HP_CRES_CSS='html body #hp-call.snap.cres{z-index:9150;padding-bottom:calc(230px + env(safe-area-inset-bottom,0px))}html body #hp-call.snap.cres>.st{font-size:1.45em!important;font-weight:700;margin-top:10px}html body #hp-call.snap.cres>.cres-b{position:absolute;left:0;right:0;bottom:calc(32px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;align-items:center;gap:12px}html body #hp-call.snap.cres>.cres-b button{width:min(300px,80vw)!important;height:auto!important;border-radius:26px!important;padding:13px 18px!important;font-size:16px!important;border:1px solid var(--line,#2a3a5a)!important;background:#17233c!important;color:var(--ink,#e7ecf5)!important}html body #hp-call.snap.cres>.cres-b button.pri{background:var(--teal,#35d1b7)!important;border-color:var(--teal,#35d1b7)!important;color:#06231d!important;font-weight:700}';
function hpCresCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cres-css')) return false; const s=document.createElement('style'); s.id='hp-cres-css'; s.textContent=HP_CRES_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpCresShow(C){ try{ const S=(typeof HP_CL3_SNAP!=='undefined')?HP_CL3_SNAP:null; if(!C||!S||S.id!==C.id||!S.el) return false; hpCl3SnapHide(); hpCl3ngCss(); hpCresCss();
    const k=S.el.cloneNode(true); k.classList.add('snap'); k.classList.add('cres'); k.style.display='flex'; k.setAttribute('role','dialog'); k.setAttribute('aria-modal','true');
    const w=document.createElement('div'); w.className='cres-b'; const peer=C.peer;
    const mk=(cls,key,fn)=>{ const b=document.createElement('button'); b.type='button'; b.className=cls; b.textContent=T(key); b.onclick=ev=>{ try{ ev&&ev.stopPropagation&&ev.stopPropagation(); }catch(x){} hpCl3SnapHide(); try{ fn(); }catch(x){} }; w.appendChild(b); return b; };
    const reset=()=>{ if(HP_CALL&&HP_CALL.st==='ended'){ HP_CALL=null; hpCallUi(); } };
    if(typeof hpVmOk==='function'&&hpVmOk(C)) mk('pri','btn_vmsg',()=>{ reset(); hpVmGo(peer).catch(()=>{}); });
    mk('','btn_redial',()=>{ reset(); hpCallStart(peer).catch(()=>{}); }); mk('','btn_cl_close',()=>{});
    k.appendChild(w); (document.body||document.documentElement).appendChild(k); HP_CL3_SNAPEL=k; try{ hpLog('通話：呼び出し結果の画面を出した（'+String(C.why||'')+'）'); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpCallBar==='function'&&!hpCallBar.__f281){ const f=hpCallBar; hpCallBar=Object.assign(function(C){ if(C&&C.dir==='out'&&typeof hpBarWant==='function'&&hpBarWant(C)&&typeof HP_CL3_SNAP!=='undefined'&&HP_CL3_SNAP&&HP_CL3_SNAP.id===C.id){ const r=f.call(this,null); hpCresShow(C); return r; } return f.apply(this,arguments); },f,{__f281:1}); } }catch(e){}
var HP_CHB_CSS='html body #msgs .m.hp-chb{display:flex;flex-direction:column;white-space:normal;cursor:pointer}html body #msgs .m.hp-chb.nocall{cursor:default}html body #msgs .m.hp-chb .bd{display:flex;align-items:center;gap:7px}html body #msgs .m.hp-chb.miss .bd{color:#f3c27a;font-weight:700}html body #msgs .m.hp-chb.miss.new{border:2px solid #e6a23c;background:rgba(230,162,60,.12);font-size:15px}';
var HP_CHB_SEEN_MS=3000, HP_CH_NEAR_ID=90000, HP_CH_MQ=[], HP_CH_MT=null;
function hpChbCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-chb-css')) return false; const s=document.createElement('style'); s.id='hp-chb-css'; s.textContent=HP_CHB_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpChbText(m){ const c=(m&&m.cl)||{}; const k={ans:'chb_talk',oans:'chb_talk',miss:'ch_miss',decl:'chb_decl',taken:'chb_taken',fail:'chb_fail',ofail:'chb_fail',onoans:'chb_noans',odecl:'chb_odecl',obusy:'chb_busy',ocancel:'chb_cancel'}[String(c.r||'')]||'ch_miss'; return TF(k,{d:(typeof hpCallFmt==='function')?hpCallFmt((Number(c.s)||0)*1000):String(c.s||0)}); }
function hpChSeenMap(){ try{ const v=JSON.parse(localStorage.getItem('hp_chseen')||'{}'); return (v&&typeof v==='object')?v:{}; }catch(e){ return {}; } }
function hpChSeenAt(a){ const v=Number(hpChSeenMap()[a]); return v>0?v:0; }
function hpChSeenSet(a,ts){ try{ const m=hpChSeenMap(); if(Number(m[a])>=ts) return false; m[a]=ts; localStorage.setItem('hp_chseen',JSON.stringify(m)); return true; }catch(e){ return false; } }
hpChEl=function(a,m){ try{ const out=hpChOut(m), miss=String((m.cl&&m.cl.r)||'')==='miss', fresh=miss&&Number(m.ts)>hpChSeenAt(a); hpChbCss();
    const s=document.createElement('div'); s.className='m '+(out?'self':'peer')+' hp-ch hp-chb'+(miss?' miss':'')+(fresh?' new':''); s.dataset.ts=String(m.ts);
    const bd=document.createElement('span'); bd.className='bd'; try{ if(typeof hpCallIcon==='function') bd.appendChild(hpCallIcon(15)); }catch(e){} const tx=document.createElement('span'); tx.textContent=hpChbText(m); bd.appendChild(tx); s.appendChild(bd);
    const t=document.createElement('time'); t.textContent=(typeof hpAgo==='function')?hpAgo(m.ts):hpChTime(m.ts); t.dataset.ts=String(m.ts); try{ t.title=fmtTS(Number(m.ts)); }catch(e){} s.appendChild(t);
    const can=!!(typeof hpCallCan==='function'&&hpCallCan()&&typeof hpCardOf==='function'&&hpCardOf(a));
    if(can){ s.title=T('ch_back'); s.setAttribute('role','button'); s.onclick=()=>{ try{ hpCallStart(a).catch(()=>{}); }catch(e){} }; } else s.classList.add('nocall');
    if(fresh) setTimeout(()=>{ try{ if(typeof document!=='undefined'&&document.visibilityState==='visible'&&typeof CURPEER!=='undefined'&&CURPEER===a) hpChSeenSet(a,Number(m.ts)); }catch(e){} },HP_CHB_SEEN_MS);
    return s; }catch(e){ return null; } };
try{ if(typeof hpChRow==='function'&&!hpChRow.__f281){ const f=hpChRow; hpChRow=Object.assign(function(C){ const o=f.apply(this,arguments); try{ if(o&&o.cl&&C&&C.id) o.cl.id=String(C.id); }catch(e){} return o; },f,{__f281:1}); } }catch(e){}
try{ if(typeof hpChOutRow==='function'&&!hpChOutRow.__f281){ const f=hpChOutRow; hpChOutRow=Object.assign(function(C){ const o=f.apply(this,arguments); try{ if(o&&o.cl&&C&&C.id) o.cl.id=String(C.id); }catch(e){} return o; },f,{__f281:1}); } }catch(e){}
function hpChMissLater(peer,at,id){ HP_CH_MQ.push([peer,at,id]); if(!HP_CH_MT&&typeof setInterval==='function') HP_CH_MT=setInterval(()=>{ try{ if(typeof hpChReady==='function'&&!hpChReady()) return; const q=HP_CH_MQ.splice(0); clearInterval(HP_CH_MT); HP_CH_MT=null; for(const x of q) hpChMissEnsure(x[0],x[1],x[2]); }catch(e){} },3000); return false; }
hpChMissEnsure=function(peer,at,id){ try{ if(!peer) return false; if(typeof hpChReady==='function'&&!hpChReady()) return hpChMissLater(peer,at,id);
    if(typeof isContact==='function'&&!isContact(peer)) return false; if(typeof hpBlocked==='function'&&hpBlocked(peer)) return false; const t=Number(at)||Date.now(), cid=id?String(id):'';
    const same=m=>!!(m&&m.d==='c'&&m.cl&&!hpChOut(m)&&(cid&&m.cl.id?m.cl.id===cid:Math.abs(Number(m.ts)-t)<(cid?HP_CH_NEAR_ID:HP_CH_NEAR)));
    if(typeof HP_CH_Q!=='undefined'&&HP_CH_Q.some(x=>x&&x[0]===peer&&same(x[1]))) return false; if(histLoad(peer).some(same)) return false;
    const o={d:'c',t:'',ts:t,cl:{r:'miss'}}; if(cid) o.cl.id=cid; return hpChSave(peer,o); }catch(e){ return false; } };
var HP_MISS_IDS=new Map();
try{ if(typeof hpCallMissLater==='function'&&!hpCallMissLater.__f281){ const f=hpCallMissLater; hpCallMissLater=Object.assign(function(peer,at,id){ try{ if(peer&&id){ HP_MISS_IDS.set(peer+'|'+Number(at),String(id)); if(HP_MISS_IDS.size>50) HP_MISS_IDS.delete(HP_MISS_IDS.keys().next().value); } }catch(e){} return f.apply(this,arguments); },f,{__f281:1}); } }catch(e){}
try{ if(typeof hpCallMissedBar==='function'&&!hpCallMissedBar.__f281){ const f=hpCallMissedBar; hpCallMissedBar=Object.assign(function(peer,at){ try{ const id=HP_MISS_IDS.get(peer+'|'+Number(at)); if(peer&&id) hpChMissEnsure(peer,at,id); }catch(e){} return f.apply(this,arguments); },f,{__f281:1}); } }catch(e){}

var HP_FT_CSS='html body #msgs .m .hp-ft{display:flex;justify-content:flex-end;align-items:baseline;flex-wrap:wrap;gap:0 6px;font-size:10px;color:var(--dim,#8aa0c0);margin-top:2px}html body #msgs .m.peer .hp-ft{justify-content:flex-start}html body #msgs .m .hp-ft>time,html body #msgs .m .hp-ft>.smark,html body #msgs .m .hp-ft>.rmark,html body #msgs .m .hp-ft>.vmark{display:inline!important;margin:0!important;text-align:inherit!important}';
var HP_DAY_CSS='html body #msgs .hp-day{align-self:center;font-size:11.5px;line-height:1.4;color:var(--dim,#8aa0c0);background:rgba(255,255,255,.07);border-radius:10px;padding:2px 11px;margin:10px 0 2px;-webkit-user-select:none;user-select:none}';
var HP_DAY_T=null, HP_CI_LP=500;
function hpCiTime(ts){ try{ const d=new Date(Number(ts)), p=n=>String(n).padStart(2,'0'), y=d.getFullYear()!==new Date().getFullYear(), s=(typeof hpDateIntl==='function')?hpDateIntl(d.getTime(),y?'ymdhm':'mdhm'):''; if(s) return s; return (y?d.getFullYear()+'/':'')+(d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes()); }catch(e){ return ''; } }
function hpChInfo(m){ const out=[]; try{ const c=(m&&m.cl)||{}, o=hpChOut(m), r=String(c.r||''); out.push(TF(o?'ci_out':'ci_in',{t:hpCiTime(m.ts)}));
    if(r==='ans'||r==='oans') out.push(TF('ci_dur',{d:(typeof hpCallFmt==='function')?hpCallFmt((Number(c.s)||0)*1000):String(c.s||0)})); else out.push(hpChbText(m));
    if(Number(c.e)>0) out.push(TF('ci_end',{t:hpCiTime(c.e)})); }catch(e){} return out; }
function hpChMenu(el,a,m){ try{ if(typeof hpMenuClose==='function') hpMenuClose(); const info=hpChInfo(m), mm=document.createElement('div'); mm.id='bmenu';
    const bx=document.createElement('div'); bx.className='mi'; for(const t of info){ const r=document.createElement('div'); r.textContent=t; bx.appendChild(r); } mm.appendChild(bx);
    const btn=(lab,fn)=>{ const b=document.createElement('button'); b.textContent=lab; b.onclick=e=>{ try{ e&&e.stopPropagation&&e.stopPropagation(); }catch(x){} if(typeof hpMenuClose==='function') hpMenuClose(); try{ fn(); }catch(x){} }; mm.appendChild(b); return b; };
    if(typeof hpCallCan==='function'&&hpCallCan()&&typeof hpCardOf==='function'&&hpCardOf(a)) btn(T('ch_back'),()=>{ hpCallStart(a).catch(()=>{}); });
    btn(T('ci_copy'),()=>{ const who=(typeof hpLetterWho==='function')?hpLetterWho(hpChOut(m)?'self':'peer'):[]; hpCopyText(who.concat(info).join('\n')); });
    (document.body||document.documentElement).appendChild(mm); el.__menu=mm;
    try{ const r=el.getBoundingClientRect(), H=(window.innerHeight||600), Wd=(window.innerWidth||400), mh=mm.offsetHeight||120, mw=mm.offsetWidth||200; let top=r.bottom+6; if(top+mh>H-8) top=Math.max(8,r.top-mh-6); let left=hpChOut(m)?r.right-mw:r.left; left=Math.max(8,Math.min(left,Wd-mw-8)); mm.style.top=top+'px'; mm.style.left=left+'px'; }catch(e){}
    setTimeout(()=>{ try{ if(typeof HP_MENU_OFF!=='undefined'&&HP_MENU_OFF){ HP_MENU_OFF(); HP_MENU_OFF=null; } const out=e=>{ try{ if(e&&e.target&&mm.contains(e.target)) return; }catch(_){} hpMenuClose(); }; document.addEventListener('click',out,true); document.addEventListener('touchstart',out,{passive:true,capture:true});
      HP_MENU_OFF=()=>{ try{ document.removeEventListener('click',out,true); document.removeEventListener('touchstart',out,{capture:true}); }catch(_){} }; }catch(e){} },0);
    return true; }catch(e){ return false; } }
try{ if(typeof hpChEl==='function'&&!hpChEl.__f282){ const f=hpChEl; hpChEl=Object.assign(function(a,m){ const s=f.apply(this,arguments); try{ if(!s||!s.addEventListener) return s; const tap=s.onclick; let lp=null, lpAt=0; const stop=()=>{ if(lp){ clearTimeout(lp); lp=null; } };
      s.addEventListener('touchstart',()=>{ stop(); lp=setTimeout(()=>{ lp=null; lpAt=Date.now(); hpChMenu(s,a,m); },HP_CI_LP); },{passive:true});
      for(const n of ['touchend','touchmove','touchcancel']) s.addEventListener(n,stop,{passive:true});
      s.addEventListener('contextmenu',e=>{ try{ e.preventDefault(); }catch(x){} lpAt=Date.now(); hpChMenu(s,a,m); });
      s.onclick=e=>{ if(Date.now()-lpAt<1500) return; if(typeof tap==='function') tap(e); }; }catch(e){} return s; },f,{__f282:1}); } }catch(e){}
try{ if(typeof hpChRow==='function'&&!hpChRow.__f282){ const f=hpChRow; hpChRow=Object.assign(function(C){ const o=f.apply(this,arguments); try{ if(o&&o.cl) o.cl.e=Date.now(); }catch(e){} return o; },f,{__f282:1}); } }catch(e){}
try{ if(typeof hpChOutRow==='function'&&!hpChOutRow.__f282){ const f=hpChOutRow; hpChOutRow=Object.assign(function(C){ const o=f.apply(this,arguments); try{ if(o&&o.cl) o.cl.e=Date.now(); }catch(e){} return o; },f,{__f282:1}); } }catch(e){}
function hpClock(ts){ const d=new Date(Number(ts)); try{ const L=(typeof curLang==='function')?curLang():'ja', loc={ja:'ja-JP',en:'en-US',fr:'fr-FR',de:'de-DE',pl:'pl-PL'}[L]||'en-US'; return new Intl.DateTimeFormat(loc,{hour:'numeric',minute:'2-digit'}).format(d); }catch(e){ return d.getHours()+':'+String(d.getMinutes()).padStart(2,'0'); } }
function hpFoot(el){ try{ if(!el||!el.querySelector) return false; const t=el.querySelector('time[data-ts]'); if(!t) return false; const v=hpClock(Number(t.dataset.ts)); if(t.textContent!==v) t.textContent=v;
    let ft=el.querySelector('.hp-ft'); if(!ft){ ft=document.createElement('div'); ft.className='hp-ft'; el.appendChild(ft); } const mk=el.querySelector('.rmark,.smark,.vmark'); if(mk&&mk.parentNode!==ft) ft.insertBefore(mk,ft.firstChild||null);
    if(t.parentNode!==ft||ft.lastChild!==t) ft.appendChild(t); return true; }catch(e){ return false; } }
function hpFootAll(){ let n=0; try{ if(typeof document==='undefined'||!document.getElementById) return 0; const box=document.getElementById('msgs'); if(!box) return 0;
    if(document.head&&!document.getElementById('hp-ft-css')){ const s=document.createElement('style'); s.id='hp-ft-css'; s.textContent=HP_FT_CSS; document.head.appendChild(s); }
    for(const el of Array.from(box.children)) if(el.classList&&el.classList.contains('m')&&hpFoot(el)) n++; }catch(e){} return n; }
try{ if(typeof hpAgoTick==='function'&&!hpAgoTick.__f282){ hpAgoTick=Object.assign(function(){ return hpFootAll(); },{__f282:1}); } }catch(e){}
function hpDayKey(ts){ const d=new Date(Number(ts)); return d.getFullYear()+'-'+d.getMonth()+'-'+d.getDate(); }
function hpDayLabel(ts,now){ try{ const d=new Date(Number(ts)), n=new Date(Number(now)||Date.now()); if(hpDayKey(d.getTime())===hpDayKey(n.getTime())) return T('day_today'); const y=new Date(n.getFullYear(),n.getMonth(),n.getDate()-1); if(hpDayKey(d.getTime())===hpDayKey(y.getTime())) return T('day_yday');
    const L=(typeof curLang==='function')?curLang():'ja', loc={ja:'ja-JP',en:'en-US',fr:'fr-FR',de:'de-DE',pl:'pl-PL'}[L]||'en-US', o=L==='ja'?{month:'numeric',day:'numeric',weekday:'short'}:{month:'short',day:'numeric',weekday:'short'}; if(d.getFullYear()!==n.getFullYear()) o.year='numeric';
    try{ return new Intl.DateTimeFormat(loc,o).format(d); }catch(e){ return (o.year?d.getFullYear()+'/':'')+(d.getMonth()+1)+'/'+d.getDate(); } }catch(e){ return ''; } }
function hpDaySeps(nowArg){ try{ if(typeof document==='undefined'||!document.getElementById) return 0; const box=document.getElementById('msgs'); if(!box) return 0;
    if(document.head&&!document.getElementById('hp-day-css')){ const s=document.createElement('style'); s.id='hp-day-css'; s.textContent=HP_DAY_CSS; document.head.appendChild(s); }
    const atB=(box.scrollHeight-box.scrollTop-box.clientHeight)<40; for(const x of Array.from(box.querySelectorAll('.hp-day'))) if(x.parentNode) x.parentNode.removeChild(x);
    let last='', n=0; const now=Number(nowArg)||Date.now();
    for(const el of Array.from(box.children)){ const ts=Number(el.dataset&&el.dataset.ts); if(!(ts>0)) continue; const k=hpDayKey(ts); if(k===last) continue; last=k;
      const c=document.createElement('div'); c.className='hp-day'; c.textContent=hpDayLabel(ts,now); let ref=el; const pv=el.previousElementSibling; if(pv&&pv.dataset&&!pv.dataset.ts&&pv.classList&&pv.classList.contains('sys')) ref=pv; box.insertBefore(c,ref); n++; }
    try{ hpFootAll(); }catch(e){} try{ if(box.__dayObs&&box.__dayObs.takeRecords) box.__dayObs.takeRecords(); }catch(e){}
    if(atB) box.scrollTop=box.scrollHeight; return n; }catch(e){ return -1; } }
function hpDaySepsSoon(){ try{ if(HP_DAY_T) clearTimeout(HP_DAY_T); HP_DAY_T=setTimeout(()=>{ HP_DAY_T=null; hpDaySeps(); },60); }catch(e){} }
function hpDayObs(){ try{ if(typeof document==='undefined'||typeof MutationObserver==='undefined') return false; const box=document.getElementById('msgs'); if(!box||box.__dayObs) return false;
    box.__dayObs=new MutationObserver(ms=>{ for(const m of ms) for(const nd of Array.from(m.addedNodes||[])) if(nd&&nd.nodeType===1&&!(nd.classList&&(nd.classList.contains('hp-day')||nd.classList.contains('hp-ft')))){ hpDaySepsSoon(); return; } }); box.__dayObs.observe(box,{childList:true,subtree:true}); hpDaySepsSoon(); return true; }catch(e){ return false; } }
try{ if(typeof document!=='undefined'&&document&&document.addEventListener){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ hpDayObs(); }); else hpDayObs(); } }catch(e){}

var HP_HL_MEMO=null, HP_HL_SLOW=700;
try{ if(typeof histLoad==='function'&&!histLoad.__f283){ const f=histLoad; histLoad=Object.assign(function(a){ const M=HP_HL_MEMO; if(!M) return f.apply(this,arguments); const k=String(a); if(M.has(k)) return M.get(k); const v=f.apply(this,arguments); M.set(k,v); return v; },f,{__f283:1}); } }catch(e){}
try{ if(typeof histSave==='function'&&!histSave.__f283){ const f=histSave; histSave=Object.assign(function(){ if(HP_HL_MEMO) HP_HL_MEMO.clear(); return f.apply(this,arguments); },f,{__f283:1}); } }catch(e){}
try{ if(typeof histRender==='function'&&!histRender.__f283){ const f=histRender; histRender=Object.assign(function(a){ const outer=!HP_HL_MEMO; if(outer) HP_HL_MEMO=new Map(); const t0=Date.now();
      try{ return f.apply(this,arguments); } finally{ if(outer){ HP_HL_MEMO=null; const ms=Date.now()-t0; if(ms>HP_HL_SLOW){ try{ hpLog('手紙の画面を出すのに '+ms+' ms かかった（'+((typeof histLoad==='function')?histLoad(a).length:0)+' 通）'); }catch(e){} } } } },f,{__f283:1}); } }catch(e){}

function hpListTime(ts,now){ try{ const d=new Date(Number(ts)), n=new Date(Number(now)||Date.now()), L=(typeof curLang==='function')?curLang():'ja', loc={ja:'ja-JP',en:'en-US',fr:'fr-FR',de:'de-DE',pl:'pl-PL'}[L]||'en-US', F=o=>new Intl.DateTimeFormat(loc,o).format(d);
    const day=x=>new Date(x.getFullYear(),x.getMonth(),x.getDate()).getTime(), dd=Math.round((day(n)-day(d))/864e5);
    if(dd<=0) return (typeof hpClock==='function')?hpClock(d.getTime()):F({hour:'numeric',minute:'2-digit'}); if(dd===1) return T('day_yday'); if(dd<7) return F({weekday:'long'});
    if(d.getFullYear()===n.getFullYear()) return F(L==='ja'?{month:'numeric',day:'numeric'}:{month:'short',day:'numeric'}); return F({year:'numeric',month:'2-digit',day:'2-digit'}); }catch(e){ return (typeof fmtTS==='function')?fmtTS(Number(ts)):''; } }

var HP_CFIT_CSS='#hp-call{justify-content:flex-start;overflow-y:auto;padding-top:calc(16px + env(safe-area-inset-top,0px));padding-bottom:calc(136px + env(safe-area-inset-bottom,0px));box-sizing:border-box;-webkit-overflow-scrolling:touch}#hp-call>*{flex-shrink:0}#hp-call::before,#hp-call::after{content:"";flex:1 1 0;min-height:0}#hp-call::after{order:99}#hp-call::before{order:-1}';
function hpCfitCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cfit-css')) return false; const s=document.createElement('style'); s.id='hp-cfit-css'; s.textContent=HP_CFIT_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f285){ const f=hpCallUi; hpCallUi=Object.assign(function(){ try{ hpCfitCss(); }catch(e){} return f.apply(this,arguments); },f,{__f285:1}); } }catch(e){}
try{ if(typeof hpRingAc==='function'&&!hpRingAc.__f285){ const f=hpRingAc; hpRingAc=Object.assign(function(){ const a=f.apply(this,arguments); try{ if(a&&a.state==='interrupted'&&a.resume){ const pr=a.resume(); if(pr&&pr.catch) pr.catch(()=>{}); } }catch(e){} return a; },f,{__f285:1}); } }catch(e){}

var HP_WHYC_CSS='html body #hp-call .cav{width:84px;height:84px;font-size:36px}html body #hp-call .hp-tip.wcl{padding:8px 14px}html body #hp-call .hp-tip.wcl .wsc{display:none}html body #hp-call .hp-tip h4.wtg{cursor:pointer;margin:0;user-select:none;-webkit-user-select:none}html body #hp-call .hp-tip:not(.wcl) h4.wtg{margin-bottom:4px}';
function hpWhyFold(C,t,open){ try{ const h=t.querySelector('h4'), sc=t.querySelector('.wsc'); if(!h||!sc) return false; const tt=String(T('cl_why_h'));
    h.textContent=(open?'▼ ':'▶ ')+tt; h.setAttribute&&h.setAttribute('aria-expanded',open?'true':'false'); if(open) t.classList.remove('wcl'); else t.classList.add('wcl');
    if(open&&!C.whyRan){ C.whyRan=1; C.whyMan=0; C.whyDone=0; try{ sc.scrollTop=0; }catch(e){} if(typeof hpWhyRun==='function') hpWhyRun(C,sc); } return true; }catch(e){ return false; } }
try{ if(typeof hpTipNext==='function'&&!hpTipNext.__f287){ const f=hpTipNext; hpTipNext=Object.assign(function(C){ const r=f.apply(this,arguments);
    try{ if(r&&C&&C.tipT==='why'){ const d=document.getElementById('hp-call'), t=d&&d.querySelector?d.querySelector('.hp-tip'):null, h=t&&t.querySelector('h4'); if(!t||!h) return r;
        if(document.head&&!document.getElementById('hp-whyc-css')){ const s=document.createElement('style'); s.id='hp-whyc-css'; s.textContent=HP_WHYC_CSS; document.head.appendChild(s); }
        if(C.whyIv){ clearInterval(C.whyIv); C.whyIv=null; } C.whyRan=0; h.className='wtg'; h.setAttribute&&h.setAttribute('role','button');
        h.onclick=e=>{ try{ e&&e.stopPropagation&&e.stopPropagation(); }catch(_){} C.whyOpen=!C.whyOpen; hpWhyFold(C,t,!!C.whyOpen); };
        hpWhyFold(C,t,!!C.whyOpen); } }catch(e){} return r; },f,{__f287:1}); } }catch(e){}

function hpCpsDiag(text,e){ try{ const h=JSON.parse(String(text)); if(!h||typeof h!=='object') return ''; const now=Date.now(), fd=String(h.fd||''), pq=String(h.pq||''), age=t=>Math.round((now-(Number(t)||0))/1000);
    const L=((typeof hpCpsPqAll==='function')?hpCpsPqAll()[fd]:null)||[], K=((typeof hpCkPqAll==='function')?hpCkPqAll()[fd]:null)||[], nw=L[0], has=L.some(x=>x&&x.id===pq);
    const o=[(HP_CPS_NAME&&HP_CPS_NAME[h.k])||String(h.k||'?'),'送り手の端末 '+fd.slice(0,10)+'…','封の鍵 '+pq.slice(0,8)+(has?'（控えにある）':'（控えに無い）'),'控え '+L.length+' 件'+(nw?'（新しいもの '+age(nw.at)+' 秒前・'+(nw.r?'受け取った':'送った')+'手紙の鍵）':''),'封は '+age(h.at)+' 秒前'];
    if(typeof h.w2==='string') o.push('通話用の包みあり（鍵 '+String(h.cq||'').slice(0,8)+(K.some(x=>x&&x.id===h.cq)?'・控えにある':'・控えに無い')+'・通話用の控え '+K.length+' 件）'); else o.push('通話用の包みなし');
    return o.join('・'); }catch(x){ return ''; } }
try{ if(typeof hpCpsOpen==='function'&&!hpCpsOpen.__f289){ const f=hpCpsOpen; hpCpsOpen=Object.assign(async function(text){ try{ return await f.apply(this,arguments); }catch(e){
      let w=''; try{ const h=JSON.parse(String(text)); if(h&&typeof h.w2==='string'&&typeof hpCkCapOpen==='function'){ try{ await hpCkCapOpen(text); }catch(x){ w='・包みで開けない理由：'+((x&&x.message)||x); } } }catch(x){}
      const dg=hpCpsDiag(text,e); const m=String((e&&e.message)||e)+(dg?'・'+dg:'')+w; const e2=new Error(m); throw e2; } },f,{__f289:1}); } }catch(e){}

const HP_VMV_ODD=/\b(albert|bahh|bells|boing|bubbles|cellos|eddy|flo|fred|grandma|grandpa|jester|junior|organ|ralph|reed|rocko|sandy|shelley|superstar|trinoids|whisper|wobble|zarvox|bad news|good news|hysterical|pipe organ)\b/i;
let HP_VMV_LAST='';
function hpVmVoiceScore(v,bc){ try{ if(!v) return -1e9; const lg=String(v.lang||'').replace('_','-'), nm=String(v.name||'')+' '+String(v.voiceURI||''); let s=0;
    if(lg.toLowerCase()===String(bc).toLowerCase()) s+=100; else if(lg.slice(0,2).toLowerCase()===String(bc).slice(0,2).toLowerCase()) s+=50; else return -1e9;
    if(HP_VMV_ODD.test(String(v.name||''))) s-=300; if(/premium/i.test(nm)) s+=40; if(/enhanced|拡張/i.test(nm)) s+=30; if(/natural|neural|online/i.test(nm)) s+=30; if(/siri/i.test(nm)) s+=25; if(/google/i.test(nm)) s+=15;
    if(/compact|eloquence/i.test(nm)) s-=10; if(v.localService) s+=2; if(v.default) s+=1; return s; }catch(e){ return -1e9; } }
function hpVmVoice(vs,bc){ try{ let best=null, bs=-1e9; for(const v of (vs||[])){ const s=hpVmVoiceScore(v,bc); if(s>bs){ bs=s; best=v; } } if(!best||bs<0) return null;
    const k=bc+':'+String(best.name||''); if(k!==HP_VMV_LAST){ HP_VMV_LAST=k; try{ hpLog('通話：応答の声は '+String(best.name||'?')+'（'+bc+'・'+bs+' 点・声 '+(vs||[]).length+'）'); }catch(e){} } return best; }catch(e){ return null; } }

var HP_BYE_END_WAIT=3000, HP_BYE_HOLD_MAX=3500, HP_BYE_HOLD=null;
function hpByeHold(p){ const H={at:Date.now(),n:0}; let done=false; const end=()=>{ if(done) return; done=true; if(HP_BYE_HOLD===H) HP_BYE_HOLD=null; hpByeFlush(H); }; HP_BYE_HOLD=H;
  try{ Promise.resolve(p).then(end,end); }catch(e){ end(); } try{ setTimeout(end,HP_BYE_HOLD_MAX); }catch(e){} return H; }
function hpByeFlush(H){ try{ if(HP_BYE_HOLD||typeof HP_CH_Q==='undefined'||!HP_CH_Q.length) return 0; if(typeof hpChReady==='function'&&!hpChReady()){ if(typeof hpChArm==='function') hpChArm(); return 0; }
    const q=HP_CH_Q.splice(0); for(const x of q) hpChSave(x[0],x[1]); if(H&&H.n) try{ hpLog('通話：手紙の 1 行は「切った」を通知に載せてから残した（'+((Date.now()-H.at)/1000).toFixed(1)+' 秒待った）'); }catch(e){} return q.length; }catch(e){ return 0; } }
try{ if(typeof hpChSave==='function'&&!hpChSave.__f290){ const f=hpChSave; hpChSave=Object.assign(function(peer,o){ try{ const H=HP_BYE_HOLD; if(H&&peer&&o&&Date.now()-H.at<HP_BYE_HOLD_MAX+500){ HP_CH_Q.push([peer,o]); H.n++; return false; } }catch(e){} return f.apply(this,arguments); },f,{__f290:1}); } }catch(e){}

function hpNoIp(s){ try{ return String(s==null?'':s).replace(/\d{1,3}(?:\.\d{1,3}){3}/g,'*').replace(/[0-9a-f]{0,4}(?::[0-9a-f]{0,4}){2,7}/gi,'*'); }catch(e){ return ''; } }

var HP_VID_ON=true, HP_VID_BPS=500000, HP_VID_FPS=24;
var HP_VID_CSS='#hp-call-rv{position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:-1;background:#000;display:none}#hp-call.vid #hp-call-rv{display:block}#hp-call.vid{background:#000}'
 +'#hp-call.vid>*:not(.who):not(.st):not(.btns):not(.tap):not(.vbtns):not(video):not(audio):not(.lvbox){display:none!important}#hp-call.vid .who,#hp-call.vid .st{text-shadow:0 1px 4px #000}'
 +'#hp-call-lv{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));right:12px;width:96px;height:128px;object-fit:cover;border-radius:12px;z-index:2;display:none;border:1px solid rgba(255,255,255,.35);background:#000}#hp-call.cam #hp-call-lv{display:block}#hp-call-lv.me{transform:scaleX(-1)}'
 +'#hp-call .vbtns{position:absolute;left:0;right:0;bottom:calc(150px + env(safe-area-inset-bottom,0px));display:flex;gap:22px;justify-content:center;transition:opacity .3s}#hp-call .vbtns button{width:58px;height:58px;font-size:1.3em}#hp-call.dim .vbtns{opacity:0;pointer-events:none}';
function hpVidTr(pc){ try{ return (pc&&pc.getTransceivers?pc.getTransceivers():[]).find(t=>t&&t.receiver&&t.receiver.track&&t.receiver.track.kind==='video'&&!t.stopped)||null; }catch(e){ return null; } }
function hpVidCodec(t){ try{ if(!t||typeof t.setCodecPreferences!=='function'||typeof RTCRtpReceiver==='undefined'||!RTCRtpReceiver.getCapabilities) return false; const cs=(RTCRtpReceiver.getCapabilities('video')||{}).codecs||[];
    const vp8=cs.filter(c=>/\/vp8$/i.test(c.mimeType)), ex=cs.filter(c=>/\/(rtx|red|ulpfec)$/i.test(c.mimeType)); if(!vp8.length) return false; t.setCodecPreferences(vp8.concat(ex)); return true; }catch(e){ return false; } }
function hpVidAdd(pc){ try{ if(!HP_VID_ON||!pc||pc.__hpv||pc.localDescription||pc.remoteDescription||typeof pc.addTransceiver!=='function') return false; pc.__hpv=1; const t=pc.addTransceiver('video',{direction:'sendrecv'}); hpVidCodec(t); return true; }catch(e){ return false; } }
function hpVidAns(pc){ try{ if(!pc||pc.signalingState!=='have-remote-offer') return 0; let n=0; for(const t of pc.getTransceivers()){ try{ if(t.receiver&&t.receiver.track&&t.receiver.track.kind==='video'){ t.direction='sendrecv'; hpVidCodec(t); n++; } }catch(e){} } return n; }catch(e){ return 0; } }
function hpVidSalt(d){ const s=new Uint8Array(8); s[0]=d; s[1]=1; return s; }
function hpVidCryApply(x,op,key,salt){ const w=hpCallWorker(), o={op:op,key:key.slice(0),salt:salt,kind:'video'};
  if(typeof RTCRtpScriptTransform==='function'){ x.transform=new RTCRtpScriptTransform(w,o); return 'script'; }
  const es=x.createEncodedStreams(); w.postMessage(Object.assign(o,{readable:es.readable,writable:es.writable}),[es.readable,es.writable]); return 'legacy'; }
function hpVidCry(C,pc){ try{ if(!C||!C.key||!pc) return 0; const me=C.dir==='out'?1:2, you=C.dir==='out'?2:1; C.cry=C.cry||{}; C.cryW=C.cryW||new WeakSet(); let n=0;
    for(const t of pc.getTransceivers()){ if(!(t.receiver&&t.receiver.track&&t.receiver.track.kind==='video')) continue; const s=t.sender, r=t.receiver;
      if(s&&!C.cryW.has(s)){ C.cryW.add(s); C.cry['vs'+Object.keys(C.cry).length]=hpVidCryApply(s,'enc',C.key,hpVidSalt(me)); n++; }
      if(r&&!C.cryW.has(r)){ C.cryW.add(r); C.cry['vr'+Object.keys(C.cry).length]=hpVidCryApply(r,'dec',C.key,hpVidSalt(you)); n++; } } return n; }catch(e){ try{ hpLog('通話：映像に二重の鍵を掛けられない（'+((e&&e.message)||e)+'）'); }catch(x){} return 0; } }

function hpVidGuard(pc){ try{ if(!pc||pc.__hpg) return false; pc.__hpg=1; let h=null; try{ const cur=pc.ontrack; if(cur){ h=cur; pc.ontrack=null; } }catch(e){}
    Object.defineProperty(pc,'ontrack',{configurable:true,get(){ return h; },set(fn){ h=(typeof fn==='function')?fn:null; }});
    pc.addEventListener('track',e=>{ try{ if(e&&e.track&&e.track.kind==='video') return; if(h) h.call(pc,e); }catch(x){} }); return true; }catch(e){ return false; } }
function hpVidAudioOnly(pc){ try{ const ts=pc.getReceivers().map(r=>r.track).filter(t=>t&&t.kind==='audio'); return ts.length?new MediaStream(ts):null; }catch(e){ return null; } }

try{ if(typeof hpCallIceN==='function'&&!hpCallIceN.__f300){ const f=hpCallIceN; hpCallIceN=Object.assign(function(){ const c=f.apply(this,arguments); try{ if(c&&HP_VID_ON) c.bundlePolicy='max-bundle'; }catch(e){} return c; },{__f300:1}); } }catch(e){}

try{ if(typeof hpCallCryptoOn==='function'&&!hpCallCryptoOn.__f300){ const f=hpCallCryptoOn; hpCallCryptoOn=Object.assign(function(C){ try{ if(C&&C.pc){ if(C.dir==='out'&&C.pc.signalingState==='stable') hpVidAdd(C.pc); else hpVidAns(C.pc); } }catch(e){} const r=f.apply(this,arguments); try{ if(C&&C.pc) hpVidCry(C,C.pc); }catch(e){} return r; },f,{__f300:1}); } }catch(e){}
try{ if(typeof hpCallWire==='function'&&!hpCallWire.__f300){ const f=hpCallWire; hpCallWire=Object.assign(function(C){ try{ if(C&&C.pc) hpVidGuard(C.pc); }catch(e){} return f.apply(this,arguments); },f,{__f300:1}); } }catch(e){}

hpPreCry=function(C,pc){ try{ if(!C||!C.key||!pc) return 0; try{ if(pc.signalingState==='stable'&&!pc.localDescription) hpVidAdd(pc); else hpVidAns(pc); }catch(e){} try{ hpVidGuard(pc); }catch(e){}
    const me=C.dir==='out'?1:2, you=C.dir==='out'?2:1; C.cry=C.cry||{}; C.cryW=C.cryW||new WeakSet(); let n=0;
    for(const t of pc.getTransceivers()){ const vid=!!(t.receiver&&t.receiver.track&&t.receiver.track.kind==='video'); if(vid) continue; const s=t.sender, r=t.receiver;
      if(s&&!C.cryW.has(s)){ C.cryW.add(s); C.cry['ps'+Object.keys(C.cry).length]=hpCallCryptoApply(s,'enc',C.key,hpCallSalt(me)); n++; } if(r&&!C.cryW.has(r)){ C.cryW.add(r); C.cry['pr'+Object.keys(C.cry).length]=hpCallCryptoApply(r,'dec',C.key,hpCallSalt(you)); n++; } }
    return n+hpVidCry(C,pc); }catch(e){ hpLog('通話：裏の線に二重の鍵を掛けられない（'+((e&&e.message)||e)+'）'); return 0; } };
hpPreCry.__f300=1;
try{ if(typeof hpPreAdopt==='function'&&!hpPreAdopt.__f300){ const f=hpPreAdopt; hpPreAdopt=Object.assign(async function(C,P){ try{ if(P&&P.pc){ const s=hpVidAudioOnly(P.pc); if(s) P.stream=s; } }catch(e){} return f.apply(this,arguments); },{__f300:1}); } }catch(e){}
try{ if(typeof hpPreAccept==='function'&&!hpPreAccept.__f300){ const f=hpPreAccept; hpPreAccept=Object.assign(async function(C){ try{ const P=C&&C.pre1; if(P&&P.pc){ const s=hpVidAudioOnly(P.pc); if(s) P.stream=s; } }catch(e){} return f.apply(this,arguments); },{__f300:1}); } }catch(e){}

async function hpVidGet(face){ return navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:face||'user',width:{ideal:640},height:{ideal:360},frameRate:{ideal:HP_VID_FPS,max:HP_VID_FPS}}}); }
async function hpVidLimit(snd){ try{ const p=snd.getParameters(); if(!p.encodings||!p.encodings.length) p.encodings=[{}]; p.encodings[0].maxBitrate=HP_VID_BPS; p.encodings[0].maxFramerate=HP_VID_FPS; await snd.setParameters(p); return true; }catch(e){ return false; } }
function hpVidCanSend(C){ try{ const t=hpVidTr(C&&C.pc); return !!(t&&(!t.currentDirection||/send/.test(t.currentDirection))); }catch(e){ return false; } }
async function hpVidCam(C,on,face){ if(!C||!C.pc||C.st!=='talking'||C.camBusy) return false; C.camBusy=true; try{
    const t=hpVidTr(C.pc); if(!t||!hpVidCanSend(C)){ try{ hpToast(T('cl_cam_old'),6000); }catch(e){} hpLog('通話：相手の線に映像の口が無い（相手の版が古い）'); return false; }
    if(!on){ await t.sender.replaceTrack(null); hpVidStop(C); hpLog('通話：カメラを切った'); return true; }
    const f=face||C.face||'user', s=await hpVidGet(f), vt=s.getVideoTracks()[0]; if(HP_CALL!==C||C.st!=='talking'){ s.getTracks().forEach(x=>x.stop()); return false; } if(!vt) throw new Error('映像が無い');
    await t.sender.replaceTrack(vt); await hpVidLimit(t.sender); hpVidCry(C,C.pc); const old=C.cam; C.cam=vt; C.camS=s; C.face=f; try{ if(old&&old!==vt) old.stop(); }catch(e){}
    vt.addEventListener('ended',()=>{ try{ if(HP_CALL===C&&C.cam===vt){ hpLog('通話：カメラが止められた'); t.sender.replaceTrack(null).catch(()=>{}); hpVidStop(C); hpCallUi(); } }catch(e){} });
    const st=vt.getSettings?vt.getSettings():{}; hpLog('通話：カメラを入れた（'+(f==='user'?'前':'後ろ')+'・'+(st.width||'?')+'×'+(st.height||'?')+'）'); return true;
  }catch(e){ const m=String((e&&e.message)||e); hpLog('通話：カメラを使えない（'+m+'）'); try{ hpToast(/NotAllowed|Permission|denied/i.test(m)?T('cl_nocam'):TF('cl_cam_err',{m:m}),6000); }catch(x){} return false; }
  finally{ C.camBusy=false; try{ hpCallUi(); }catch(e){} } }
function hpVidStop(C){ try{ if(C&&C.cam){ try{ C.cam.stop(); }catch(e){} } if(C){ C.cam=null; C.camS=null; } const lv=document.getElementById('hp-call-lv'); if(lv) lv.srcObject=null; }catch(e){} }

async function hpVidPeek(C){ try{ if(!C||HP_CALL!==C||C.st!=='talking'||!C.pc) return false; const t=hpVidTr(C.pc); if(!t) return false; let fr=0; const st=await t.receiver.getStats(); st.forEach(r=>{ if(r.type==='inbound-rtp') fr=Math.max(fr,Number(r.framesDecoded)||0); });
    const now=Date.now(); if(fr>(C.vFr||0)){ C.vFr=fr; C.vAt=now; if(!C.vLog){ C.vLog=1; hpLog('通話：相手の映像が届いた'); } } const on=!!(C.vAt&&now-C.vAt<2000); if(on!==!!C.vOn){ C.vOn=on; if(!on&&C.vLog) hpLog('通話：相手の映像が止まった'); hpCallUi(); } return on; }catch(e){ return false; } }
function hpVidEls(d){ try{ if(!d) return; if(document.head&&!document.getElementById('hp-vid-css')){ const s=document.createElement('style'); s.id='hp-vid-css'; s.textContent=HP_VID_CSS; document.head.appendChild(s); }
    if(!d.__rv){ const v=document.createElement('video'); v.id='hp-call-rv'; v.muted=true; v.autoplay=true; v.setAttribute('playsinline',''); v.playsInline=true; d.insertBefore(v,d.firstChild); d.__rv=v; }
    if(!d.__lv){ const v=document.createElement('video'); v.id='hp-call-lv'; v.muted=true; v.autoplay=true; v.setAttribute('playsinline',''); v.playsInline=true; d.appendChild(v); d.__lv=v; }
    if(!d.__vb){ const row=document.createElement('div'); row.className='vbtns'; const mk=(icon,k,fn)=>{ const b=document.createElement('button'); b.type='button'; b.className='opt'; b.appendChild(document.createTextNode(icon)); const s=document.createElement('span'); s.textContent=T(k); b.appendChild(s); b.onclick=(typeof hpCallGuard==='function')?hpCallGuard(d,fn):fn; row.appendChild(b); return b; };
      d.__cam=mk('\u{1F4F7}','cl_cam',()=>{ const C=HP_CALL; if(C) hpVidCam(C,!C.cam).catch(()=>{}); }); d.__flip=mk('\u{1F504}','cl_flip',()=>{ const C=HP_CALL; if(C&&C.cam) hpVidCam(C,true,C.face==='user'?'environment':'user').catch(()=>{}); }); d.appendChild(row); d.__vb=row; }
  }catch(e){} }
function hpVidUi(C,d){ try{ if(!d) return; hpVidEls(d); const talk=!!(C&&C.st==='talking'&&C.pc&&hpVidTr(C.pc));
    d.__vb.style.display=talk?'':'none'; d.__cam.classList.toggle('on',!!(C&&C.cam)); d.__flip.style.display=(talk&&C.cam)?'':'none';
    const rt=talk?hpVidTr(C.pc):null, tr=rt&&rt.receiver&&rt.receiver.track; if(tr&&d.__rvT!==tr){ d.__rvT=tr; d.__rv.srcObject=new MediaStream([tr]); try{ const p=d.__rv.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} } if(!talk&&d.__rvT){ d.__rvT=null; d.__rv.srcObject=null; }
    const vid=!!(talk&&C.vOn); d.classList.toggle('vid',vid);
    const cam=!!(talk&&C.cam); d.classList.toggle('cam',cam); if(cam&&d.__lvT!==C.cam){ d.__lvT=C.cam; d.__lv.srcObject=new MediaStream([C.cam]); try{ const p=d.__lv.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} } if(!cam&&d.__lvT){ d.__lvT=null; d.__lv.srcObject=null; } d.__lv.classList.toggle('me',!!(C&&C.face!=='environment'));
    if(talk&&!C.vPoll){ C.vPoll=setInterval(()=>{ if(HP_CALL!==C||C.st!=='talking'){ clearInterval(C.vPoll); C.vPoll=null; return; } hpVidPeek(C); },1000); }
  }catch(e){} }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f300){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(d) hpVidUi(C&&C.st!=='ended'?C:null,d); }catch(e){} return r; },f,{__f300:1}); } }catch(e){}
try{ if(typeof hpCallClose==='function'&&!hpCallClose.__f300){ const f=hpCallClose; hpCallClose=Object.assign(function(C){ try{ hpVidStop(C); if(C&&C.vPoll){ clearInterval(C.vPoll); C.vPoll=null; } if(C){ C.vOn=false; } }catch(e){} return f.apply(this,arguments); },f,{__f300:1}); } }catch(e){}

var HP_VM_SAY_DELAY=0, HP_VM_SAY_GEN=0;
try{ if(typeof hpVmSay==='function'&&!hpVmSay.__f302){ const f=hpVmSay; hpVmSay=Object.assign(function(text,lang){ const self=this, gen=++HP_VM_SAY_GEN, wait=HP_VM_SAY_DELAY|0; HP_VM_SAY_DELAY=0;
    return new Promise(res=>{ let tries=0, fin=false; const done=v=>{ if(fin) return; fin=true; res(v); };
      const run=()=>{ if(fin||gen!==HP_VM_SAY_GEN) return done(false); tries++; const my=tries; let spoke=false, cut=false;
        const t=setInterval(()=>{ try{ if(fin||my!==tries){ clearInterval(t); return; } if(typeof HP_VM_U!=='undefined'&&HP_VM_U&&HP_VM_U.__hold){ spoke=false; return; }   const sp=!!(typeof speechSynthesis!=='undefined'&&speechSynthesis.speaking); if(sp){ spoke=true; return; }
            if(spoke&&tries<2){ cut=true; clearInterval(t); hpLog('通話：読み上げが途中で切れた。最初から読み直す'); try{ speechSynthesis.cancel(); }catch(e){} setTimeout(run,350); } }catch(e){ clearInterval(t); } },250);
        Promise.resolve(f.call(self,text,lang)).then(v=>{ clearInterval(t); if(cut||my!==tries) return; done(v); },()=>{ clearInterval(t); if(!cut&&my===tries) done(false); }); };
      if(wait>0) setTimeout(run,wait); else run(); }); },{__f302:1}); } }catch(e){}
try{ if(typeof hpVmAuto==='function'&&!hpVmAuto.__f302){ const f=hpVmAuto; hpVmAuto=Object.assign(function(){ HP_VM_SAY_DELAY=900; try{ return f.apply(this,arguments); } finally{ HP_VM_SAY_DELAY=0; } },{__f302:1}); } }catch(e){}

var HP_VID_NEXT=0;
var HP_VID_CSS2='#btn-conv-vcall{margin-left:4px;background:var(--teal);border-color:var(--teal);color:#06231d}'
 +'#hp-call.pre{background:#000}#hp-call.pre #hp-call-lv{display:block;position:fixed;inset:0;top:0;right:0;width:100%;height:100%;border-radius:0;border:0;z-index:-1}'
 +'#hp-call.pre>*:not(.who):not(.st):not(.btns):not(.tap):not(.vbtns):not(video):not(audio):not(.vlab):not(.lvbox){display:none!important}#hp-call.pre .who,#hp-call.pre .st{text-shadow:0 1px 4px #000}'
 +'#hp-call .vlab{display:none;font-size:.9em;opacity:.85;margin-top:-8px}#hp-call.vin .vlab{display:block}';
function hpVidIcon(px){ const N='http://www.w3.org/2000/svg', g=document.createElementNS(N,'svg'); g.setAttribute('viewBox','0 0 24 24'); g.setAttribute('width',String(px||18)); g.setAttribute('height',String(px||18)); g.setAttribute('fill','none'); g.setAttribute('stroke','currentColor'); g.setAttribute('stroke-width','2'); g.setAttribute('stroke-linecap','round'); g.setAttribute('stroke-linejoin','round');
  const r=document.createElementNS(N,'rect'); r.setAttribute('x','2'); r.setAttribute('y','6'); r.setAttribute('width','14'); r.setAttribute('height','12'); r.setAttribute('rx','2'); const p=document.createElementNS(N,'path'); p.setAttribute('d','M16 10l6-4v12l-6-4z'); g.appendChild(r); g.appendChild(p); return g; }
function hpVidCallStart(peer){ HP_VID_NEXT=1; try{ return hpCallStart(peer); } finally{ HP_VID_NEXT=0; } }

try{ if(typeof hpCallStart==='function'&&!hpCallStart.__f303){ const f=hpCallStart; hpCallStart=Object.assign(function(peer){ const vid=!!HP_VID_NEXT; HP_VID_NEXT=0; const p=f.apply(this,arguments);
    try{ const C=HP_CALL; if(vid&&C&&C.dir==='out'&&C.st==='calling'&&!C.vid){ C.vid=1; C.wantCam=1; hpVidPreview(C).catch(()=>{}); hpLog('通話：ビデオ通話で呼び出す'); hpCallUi(); } }catch(e){} return p; },f,{__f303:1}); } }catch(e){}
async function hpVidPreview(C){ if(!C||C.cam||C.camBusy) return false; C.camBusy=true; try{ const f=C.face||'user', s=await hpVidGet(f), vt=s.getVideoTracks()[0]; if(HP_CALL!==C||C.st==='ended'||!C.wantCam){ s.getTracks().forEach(x=>x.stop()); return false; }
    C.cam=vt; C.camS=s; C.face=f; C.camSent=false; vt.addEventListener('ended',()=>{ try{ if(HP_CALL===C&&C.cam===vt){ hpVidStop(C); hpCallUi(); } }catch(e){} }); return true;
  }catch(e){ const m=String((e&&e.message)||e); hpLog('通話：カメラを使えない（'+m+'）'); try{ hpToast(/NotAllowed|Permission|denied/i.test(m)?T('cl_nocam'):TF('cl_cam_err',{m:m}),6000); }catch(x){} C.wantCam=0; return false; } finally{ C.camBusy=false; try{ hpCallUi(); }catch(e){} } }

async function hpVidAttach(C){ if(!C||!C.cam||C.camSent||C.camAtt||C.st!=='talking'||!C.pc) return false; C.camAtt=true; try{ const t=hpVidTr(C.pc); if(!t||!hpVidCanSend(C)){ hpLog('通話：相手の線に映像の口が無い（相手の版が古い）'); try{ hpToast(T('cl_cam_old'),6000); }catch(e){} return false; }
    await t.sender.replaceTrack(C.cam); await hpVidLimit(t.sender); hpVidCry(C,C.pc); C.camSent=true; const st=C.cam.getSettings?C.cam.getSettings():{}; hpLog('通話：カメラを入れた（'+(C.face==='environment'?'後ろ':'前')+'・'+(st.width||'?')+'×'+(st.height||'?')+'・ビデオ通話）'); return true;
  }catch(e){ hpLog('通話：カメラを送れない（'+((e&&e.message)||e)+'）'); return false; } finally{ C.camAtt=false; try{ hpCallUi(); }catch(e){} } }

try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f303){ const f=hpCallSig; hpCallSig=Object.assign(function(peer,body){ try{ const C=HP_CALL; if(body&&body.type==='call'&&C&&C.vid&&C.id===body.call) body.vid=1; }catch(e){} return f.apply(this,arguments); },f,{__f303:1}); } }catch(e){}
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f303){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ const v=await f.apply(this,arguments);
    try{ const N=HP_CALL; if(o&&o.type==='call'&&o.vid===1&&N&&N.dir==='in'&&N.id===o.call&&!N.vid){ N.vid=1; N.wantCam=1; hpLog('通話：ビデオ通話で呼ばれた'); hpCallUi(); } }catch(e){} return v; },f,{__f303:1}); } }catch(e){}

try{ if(typeof hpCallAccept==='function'&&!hpCallAccept.__f303){ const f=hpCallAccept; hpCallAccept=Object.assign(async function(){ const C=HP_CALL; try{ if(C&&C.dir==='in'&&C.st==='ringing'&&C.vid&&C.wantCam) hpVidPreview(C).catch(()=>{}); }catch(e){} return f.apply(this,arguments); },f,{__f303:1}); } }catch(e){}

function hpVidCamBtn(){ const C=HP_CALL; if(!C) return; if(C.st==='talking'){ if(C.cam&&!C.camSent) return; hpVidCam(C,!C.cam).catch(()=>{}); return; }
  if(C.st==='ringing'||C.st==='calling'||C.st==='connecting'){ C.wantCam=C.wantCam?0:1; if(!C.wantCam) hpVidStop(C); else if(C.st!=='ringing') hpVidPreview(C).catch(()=>{}); hpLog('通話：カメラを'+(C.wantCam?'入れる':'切る')+'（話す前）'); hpCallUi(); } }
try{ if(typeof hpVidUi==='function'&&!hpVidUi.__f303){ const f=hpVidUi; hpVidUi=Object.assign(function(C,d){ f.apply(this,arguments); try{ if(!d) return;
    if(document.head&&!document.getElementById('hp-vid-css2')){ const s=document.createElement('style'); s.id='hp-vid-css2'; s.textContent=HP_VID_CSS2; document.head.appendChild(s); }
    if(!d.__vlab){ const l=document.createElement('div'); l.className='vlab'; l.textContent=T('cl_vid_in'); const st=d.__st; if(st&&st.parentNode===d) d.insertBefore(l,st.nextSibling); else d.appendChild(l); d.__vlab=l; }
    if(d.__cam&&!d.__cam.__f303){ d.__cam.__f303=1; d.__cam.onclick=(typeof hpCallGuard==='function')?hpCallGuard(d,hpVidCamBtn):hpVidCamBtn; }
    const before=!!(C&&C.vid&&(C.st==='ringing'||C.st==='calling'||C.st==='connecting'));
    d.classList.toggle('vin',!!(C&&C.vid&&C.dir==='in'&&C.st==='ringing'));
    if(before){ d.__vb.style.display=''; d.__cam.classList.toggle('on',!!C.wantCam); d.__flip.style.display='none'; }
    const pre=!!(before&&C.dir==='out'&&C.cam); d.classList.toggle('pre',pre); if(pre){ d.classList.add('cam'); if(d.__lvT!==C.cam){ d.__lvT=C.cam; d.__lv.srcObject=new MediaStream([C.cam]); try{ const p=d.__lv.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} } d.__lv.classList.toggle('me',C.face!=='environment'); }
    if(C&&C.st==='talking'&&C.cam&&!C.camSent&&!C.camAtt) hpVidAttach(C).catch(()=>{});
    if(C&&C.st==='talking'&&C.dir==='in'&&C.vid&&C.wantCam&&!C.cam&&!C.camBusy&&!C.camAsk){ C.camAsk=1; hpVidPreview(C).catch(()=>{}); }
  }catch(e){} },f,{__f303:1}); } }catch(e){}

try{ if(typeof hpVidCam==='function'&&!hpVidCam.__f303){ const f=hpVidCam; hpVidCam=Object.assign(async function(C,on){ const v=await f.apply(this,arguments); try{ if(C){ C.camSent=!!(C.cam&&on!==false&&v); if(on===false) C.wantCam=0; } }catch(e){} return v; },f,{__f303:1}); } }catch(e){}
try{ if(typeof hpVidStop==='function'&&!hpVidStop.__f303){ const f=hpVidStop; hpVidStop=Object.assign(function(C){ const r=f.apply(this,arguments); try{ if(C) C.camSent=false; }catch(e){} return r; },f,{__f303:1}); } }catch(e){}

function hpVidBtn(){ try{ const h=document.getElementById('chat-head'), cb=document.getElementById('btn-conv-call'); if(!h||!cb) return; let b=document.getElementById('btn-conv-vcall');
    if(!b){ b=document.createElement('button'); b.id='btn-conv-vcall'; b.type='button'; b.className=cb.className||''; try{ b.appendChild(hpVidIcon(18)); }catch(e){ b.textContent='\u{1F4F9}'; } b.setAttribute('aria-label',T('btn_vcall')); b.title=T('btn_vcall');
      b.onclick=()=>{ if(typeof CURPEER!=='undefined'&&CURPEER) hpVidCallStart(CURPEER); }; if(cb.nextSibling) h.insertBefore(b,cb.nextSibling); else h.appendChild(b); }
    b.style.display=cb.style.display; b.disabled=!!cb.disabled; if(document.head&&!document.getElementById('hp-vid-css2')){ const s=document.createElement('style'); s.id='hp-vid-css2'; s.textContent=HP_VID_CSS2; document.head.appendChild(s); } }catch(e){} }
try{ if(typeof hpCallBtn==='function'&&!hpCallBtn.__f303){ const f=hpCallBtn; hpCallBtn=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpVidBtn(); }catch(e){} return r; },f,{__f303:1}); } }catch(e){}
try{ setTimeout(()=>{ try{ hpVidBtn(); }catch(e){} },0); }catch(e){}

var HP_CBT_CSS='#hp-call .vbtns{bottom:calc(150px + env(safe-area-inset-bottom,0px));gap:18px;align-items:flex-start}'
 +'#hp-call .vbtns button,#hp-call .vbtns button.opt,#hp-call .vbtns button.opt.on,#hp-call .btns button,#hp-call .btns button.end,#hp-call .btns button.ans{width:76px;height:auto;border-radius:0;background:none;color:#fff;display:flex;flex-direction:column;align-items:center;gap:7px;padding:0;font-size:1em}'
 +'#hp-call .cb-ic{width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center}/* bk36f309: ぼかしをやめた */#hp-call .cb-ic svg{width:28px;height:28px}'
 +'#hp-call button.on .cb-ic{background:#fff;color:#111}#hp-call .btns .cb-ic{width:72px;height:72px}#hp-call .btns button.end .cb-ic{background:#e5484d}#hp-call .btns button.ans .cb-ic{background:#2e9c5c}#hp-call .btns .cb-ic svg{width:30px;height:30px}'
 +'#hp-call .vbtns button span,#hp-call .btns button span{display:block;font-size:12px;margin:0;white-space:nowrap;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}#hp-call .btns{gap:56px}#hp-call .sp{display:none!important}'
 +'#hp-call .lvbox{position:fixed;top:calc(12px + env(safe-area-inset-top,0px));right:12px;width:96px;height:128px;border-radius:12px;overflow:hidden;z-index:2;display:none;border:1px solid rgba(255,255,255,.35);background:#000}#hp-call.cam .lvbox{display:block}'
 +'#hp-call .lvbox #hp-call-lv{position:absolute!important;inset:auto;left:50%;top:50%;/* bk36f310: inset を先に（後ろにあると left・top が auto に戻り、左上にずれていた） */width:auto;height:auto;max-width:none;border:0;border-radius:0;display:block!important;z-index:0;object-fit:fill}'
 +'#hp-call.pre .lvbox{inset:0;top:0;right:0;width:100%;height:100%;border-radius:0;border:0;z-index:-1;display:block}';
var HP_CBT_SVG={
  mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
  micoff:'<path d="M9 9v3a3 3 0 0 0 5.1 2.1M15 9.3V5a3 3 0 0 0-5.9-.6"/><path d="M17 16.9A7 7 0 0 1 5 12v-2M19 10v2a7 7 0 0 1-.1 1.2"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="2" x2="22" y2="22"/>',
  vid:'<rect x="2" y="6" width="14" height="12" rx="2"/><path d="M16 10l6-4v12l-6-4z"/>',
  vidoff:'<path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5 0h3a2 2 0 0 1 2 2v3.3l1 1 5-3.3v10"/><line x1="2" y1="2" x2="22" y2="22"/>',
  flip:'<path d="M20 7h-3l-2-3H9L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M9 13.5a3 3 0 0 1 5-2.2M15 12.5a3 3 0 0 1-5 2.2"/><polyline points="14 10 14 11.5 12.5 11.5"/><polyline points="10 16 10 14.5 11.5 14.5"/>',
  spk:'<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/>',
  hang:'<path transform="rotate(135 12 12)" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  ans:'<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'};
function hpCbtIcon(k){ const N='http://www.w3.org/2000/svg', g=document.createElementNS(N,'svg'); g.setAttribute('viewBox','0 0 24 24'); g.setAttribute('fill','none'); g.setAttribute('stroke','currentColor'); g.setAttribute('stroke-width','2'); g.setAttribute('stroke-linecap','round'); g.setAttribute('stroke-linejoin','round'); g.innerHTML=HP_CBT_SVG[k]||''; g.setAttribute('data-k',k); return g; }

function hpCbtSet(b,k){ try{ if(!b) return false; let ic=b.querySelector(':scope > .cb-ic'); if(!ic){ for(const n of Array.from(b.childNodes)){ if(!(n.nodeType===1&&n.tagName==='SPAN')) b.removeChild(n); } ic=document.createElement('i'); ic.className='cb-ic'; b.insertBefore(ic,b.firstChild); }
    const cur=ic.firstChild; if(cur&&cur.getAttribute&&cur.getAttribute('data-k')===k) return true; ic.textContent=''; ic.appendChild(hpCbtIcon(k)); return true; }catch(e){ return false; } }

function hpLvFit(d){ try{ const v=d&&d.__lv, box=d&&d.__lvbox; if(!v||!box) return; const bw=box.clientWidth||96, bh=box.clientHeight||128, vw=v.videoWidth, vh=v.videoHeight; if(!vw||!vh) return; const s=Math.max(bw/vw,bh/vh);
    v.style.width=Math.ceil(vw*s)+'px'; v.style.height=Math.ceil(vh*s)+'px'; v.style.transform='translate(-50%,-50%)'+(v.classList.contains('me')?' scaleX(-1)':''); }catch(e){} }
function hpCbtLayout(d){ try{ if(!d||!d.__vb) return; if(document.head&&!document.getElementById('hp-cbt-css')){ const s=document.createElement('style'); s.id='hp-cbt-css'; s.textContent=HP_CBT_CSS; document.head.appendChild(s); }
    const row=d.__vb; const want=[d.__mute,d.__cam,d.__flip,d.__spk].filter(Boolean); const cur=Array.from(row.children); if(want.some((b,i)=>cur[i]!==b)) for(const b of want) row.appendChild(b);
    if(d.__lv&&!d.__lvbox){ const box=document.createElement('div'); box.className='lvbox'; d.__lv.parentNode.insertBefore(box,d.__lv); box.appendChild(d.__lv); d.__lvbox=box; d.__lv.addEventListener('resize',()=>hpLvFit(d)); d.__lv.addEventListener('loadedmetadata',()=>hpLvFit(d)); }
    if(d.__cam){ const s=d.__cam.querySelector('span'); if(s) s.textContent=T('cl_vbtn'); } }catch(e){} }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f304){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(!d||!C||C.st==='ended') return r; hpCbtLayout(d);
      hpCbtSet(d.__mute,C.muted?'micoff':'mic'); hpCbtSet(d.__cam,(C.cam||(C.st!=='talking'&&C.wantCam))?'vid':'vidoff'); hpCbtSet(d.__flip,'flip'); hpCbtSet(d.__spk,'spk'); hpCbtSet(d.__end,'hang'); hpCbtSet(d.__dec,'hang'); hpCbtSet(d.__ans,'ans');
      const talk=C.st==='talking'&&!!(C.pc&&typeof hpVidTr==='function'&&hpVidTr(C.pc)), before=!!(C.vid&&(C.st==='ringing'||C.st==='calling'||C.st==='connecting')), mOn=!!(d.__mute&&d.__mute.style.display!=='none');
      if(d.__cam) d.__cam.style.display=(talk||before)?'':'none'; if(d.__vb) d.__vb.style.display=(talk||before||mOn)?'':'none'; if(d.__flip) d.__flip.style.display=(talk&&C.cam)?'':'none';
      hpLvFit(d); }catch(e){} return r; },f,{__f304:1}); } }catch(e){}

try{ if(typeof hpVidBtn==='function'&&!hpVidBtn.__f304){ const f=hpVidBtn; hpVidBtn=Object.assign(function(){ const r=f.apply(this,arguments); try{ const cb=document.getElementById('btn-conv-call'), b=document.getElementById('btn-conv-vcall'), h=document.getElementById('chat-head'); if(!cb||!b||!h) return r;
      b.className=cb.className; const cs=getComputedStyle(cb); for(const p of ['background-color','border','border-radius','color','padding','vertical-align','align-self','box-sizing']) b.style.setProperty(p,cs.getPropertyValue(p));
      if(cb.offsetWidth) b.style.width=cb.offsetWidth+'px'; if(cb.offsetHeight) b.style.height=cb.offsetHeight+'px'; const gap=parseFloat(getComputedStyle(h).columnGap)||0; b.style.marginLeft=Math.max(0,8-gap)+'px'; b.style.marginTop=cs.marginTop; b.style.marginBottom=cs.marginBottom;
      const ci=cb.querySelector('svg'), vi=b.querySelector('svg'); if(ci&&vi){ vi.setAttribute('width',ci.getAttribute('width')||'18'); vi.setAttribute('height',ci.getAttribute('height')||'18'); } }catch(e){} return r; },f,{__f304:1}); } }catch(e){}
try{ setTimeout(()=>{ try{ hpVidBtn(); }catch(e){} },0); }catch(e){}

try{ if(typeof hpVidCam==='function'&&!hpVidCam.__f304){ const f=hpVidCam; hpVidCam=Object.assign(async function(C,on){ let old=null; try{ if(C&&on!==false&&C.cam&&!C.camBusy){ old=C.cam; C.cam=null; C.camSent=false; } }catch(e){}
    const v=await f.apply(this,arguments); try{ if(old){ if(v&&C.cam&&C.cam!==old){ try{ old.stop(); }catch(e){} } else if(!C.cam){ C.cam=old; } } }catch(e){} return v; },f,{__f304:1}); } }catch(e){}
try{ if(typeof hpVidAttach==='function'&&!hpVidAttach.__f304){ const f=hpVidAttach; hpVidAttach=Object.assign(function(C){ if(C&&C.camBusy) return Promise.resolve(false); return f.apply(this,arguments); },f,{__f304:1}); } }catch(e){}

var HP_V309_ERRN=0, HP_V309_ERRS=new Set();
function hpV309Err(s){ try{ s=String(s||'').replace(/\s+/g,' ').slice(0,200); if(!s||HP_V309_ERRS.has(s)||HP_V309_ERRN>=20) return false; HP_V309_ERRS.add(s); HP_V309_ERRN++; if(typeof hpLog==='function') hpLog('画面の誤り：'+s); return true; }catch(e){ return false; } }
try{ if(typeof window!=='undefined'&&window.addEventListener&&!window.__hpV309){ window.__hpV309=1;
  window.addEventListener('error',e=>{ try{ hpV309Err((e&&e.message||'?')+' '+String(e&&e.filename||'').split('/').pop()+':'+(e&&e.lineno||0)); }catch(x){} });
  window.addEventListener('unhandledrejection',e=>{ try{ const r=e&&e.reason; hpV309Err('（約束）'+(r&&r.message||r)); }catch(x){} }); } }catch(e){}
function hpV309Play(v){ try{ if(!v||!v.srcObject||!v.paused) return false; if(!(v.offsetWidth||v.offsetHeight)) return false; const p=v.play(); if(p&&p.catch) p.catch(()=>{}); return true; }catch(e){ return false; } }
var HP_V309_CSS='#hp-call.vid .opt .cb-ic,#hp-call.pre .opt .cb-ic{background:rgba(0,0,0,.42);border:1px solid rgba(255,255,255,.28)}';
function hpV309Css(){ try{ if(document.head&&!document.getElementById('hp-v309-css')){ const s=document.createElement('style'); s.id='hp-v309-css'; s.textContent=HP_V309_CSS; document.head.appendChild(s); } }catch(e){} }

function hpV309Look(C,d){ try{ if(!C||!d||C.v309L||!d.classList.contains('vid')) return; C.v309L=1; setTimeout(()=>{ try{ if(HP_CALL!==C) return; const v=d.__rv, l=d.__lv; hpLog('通話：映像の様子（相手 '+(v?(v.paused?'止まっている':'動いている')+'・'+v.videoWidth+'×'+v.videoHeight+'・'+v.readyState:'無し')+'／自分 '+(l&&l.srcObject?(l.paused?'止まっている':'動いている')+'・'+l.videoWidth+'×'+l.videoHeight:'無し')+'）'); }catch(e){} },1500); }catch(e){} }
function hpV309IsVid(C){ return !!(C&&(C.vid||C.cam||C.vOn||C.wantCam)); }
try{ if(typeof hpCallDimArm==='function'&&!hpCallDimArm.__f309){ const f=hpCallDimArm; hpCallDimArm=Object.assign(function(d){ try{ if(d&&hpV309IsVid(HP_CALL)){ if(d.__dimT){ clearTimeout(d.__dimT); d.__dimT=null; } d.classList.remove('dim'); return; } }catch(e){} return f.apply(this,arguments); },f,{__f309:1}); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f309){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(d&&C&&C.st!=='ended'){ hpV309Css(); if(hpV309IsVid(C)&&d.classList.contains('dim')) d.classList.remove('dim'); hpV309Play(d.__rv); hpV309Play(d.__lv); hpV309Look(C,d); } }catch(e){} return r; },f,{__f309:1}); } }catch(e){}
try{ if(typeof hpCallClose==='function'&&!hpCallClose.__f309){ const f=hpCallClose; hpCallClose=Object.assign(function(C){ try{ const d=document.getElementById('hp-call'); for(const v of [d&&d.__rv,d&&d.__lv]){ if(v){ try{ v.pause(); }catch(e){} v.srcObject=null; } } if(d){ d.__rvT=null; d.__lvT=null; }
      const pc=C&&C.pc; if(pc&&typeof pc.close==='function'&&!pc.__v309){ pc.__v309=1; const cl=pc.close.bind(pc); pc.close=function(){ const t0=Date.now(); try{ hpLog('通話：線を閉じに行った'); }catch(e){} let r; try{ r=cl(); }catch(e){} try{ hpLog('通話：線を閉じた（'+(Date.now()-t0)+' ms）'); }catch(e){} return r; }; } }catch(e){}
    return f.apply(this,arguments); },f,{__f309:1}); } }catch(e){}
try{ if(typeof hpCallHangup==='function'&&!hpCallHangup.__f309){ const f=hpCallHangup; hpCallHangup=Object.assign(function(){ const C=HP_CALL;
    try{ if(C) hpLog('通話：［切る］を押した（'+C.st+(C.cam?'・カメラあり':'')+(C.vOn?'・映像あり':'')+'）'); if(typeof hpLgSave==='function') hpLgSave(Date.now()); }catch(e){}
    let r; try{ r=f.apply(this,arguments); }catch(e){ hpV309Err('切る '+(e&&e.message||e)); }
    try{ if(C) setTimeout(()=>{ try{ if(HP_CALL!==C||C.st==='ended') return; hpLog('通話：［切る］のあと画面が残っていたので閉じた（'+C.st+'）'); try{ if(C.cam) C.cam.stop(); }catch(e){} try{ if(C.stream) C.stream.getTracks().forEach(t=>{ try{ t.stop(); }catch(e){} }); }catch(e){} C.st='ended'; HP_CALL=null; const d=document.getElementById('hp-call'); if(d){ d.style.display='none'; d.classList.remove('vid','cam','pre','dim'); } try{ hpCallRing(false); }catch(e){} }catch(e){} },4000); }catch(e){}
    return r; },f,{__f309:1}); } }catch(e){}

var HP_V309_HID=0;
try{ if(typeof document!=='undefined'&&document.addEventListener&&!document.__hpV309){ document.__hpV309=1; document.addEventListener('visibilitychange',()=>{ try{ if(document.visibilityState==='hidden') HP_V309_HID=Date.now(); }catch(e){} }); } }catch(e){}
function hpV309SlRx(s){ try{ if(s&&s.dc&&!s.dc.__v309){ s.dc.__v309=1; s.rxAt=Date.now(); s.dc.addEventListener('message',()=>{ s.rxAt=Date.now(); }); } }catch(e){} }
function hpV309SlSus(s){ return !!(s&&HP_V309_HID&&HP_V309_HID>=(Number(s.rxAt)||0)); }
try{ if(typeof setInterval==='function'&&typeof HP_SL!=='undefined') setInterval(()=>{ try{ for(const k of Object.keys(HP_SL)) hpV309SlRx(HP_SL[k]); }catch(e){} },2000); }catch(e){}
try{ if(typeof hpSlSend==='function'&&!hpSlSend.__f309){ const f=hpSlSend; hpSlSend=Object.assign(function(peer,body,devs){ try{ for(const s of hpSlOf(peer)) hpV309SlRx(s); }catch(e){} const got=f.apply(this,arguments);
    try{ if(!got||!got.length) return got; const sus=hpSlOf(peer).filter(s=>s&&s.dev&&got.indexOf(s.dev)>=0&&hpV309SlSus(s)).map(s=>s.dev); if(!sus.length) return got;
      hpLog('通話：画面が裏にいたあと糸から何も届いていないので、郵便受けでも送る（'+String(body&&body.type)+'・端末 '+sus.length+' 台）'); return got.filter(d=>sus.indexOf(d)<0); }catch(e){ return got; } },f,{__f309:1}); } }catch(e){}

var HP_BC_KEY='hp_bc', HP_HB_KEY='hp_hb', HP_UI_KEY='hp_ui', HP_BC_MAX=40;
function hpBcNow(){ const d=new Date(), p=(n,w)=>String(n).padStart(w||2,'0'); return p(d.getHours())+':'+p(d.getMinutes())+':'+p(d.getSeconds())+'.'+p(d.getMilliseconds(),3); }
function hpBc(s){ try{ let a=[]; try{ a=JSON.parse(localStorage.getItem(HP_BC_KEY)||'[]'); }catch(e){ a=[]; } if(!Array.isArray(a)) a=[]; a.push(hpBcNow()+' '+String(s).slice(0,160)); if(a.length>HP_BC_MAX) a=a.slice(-HP_BC_MAX); localStorage.setItem(HP_BC_KEY,JSON.stringify(a)); return true; }catch(e){ return false; } }
function hpBcBeat(){ try{ const C=HP_CALL; if(!C||C.st==='ended'){ localStorage.removeItem(HP_HB_KEY); return false; } localStorage.setItem(HP_HB_KEY,JSON.stringify({t:Date.now(),at:hpBcNow(),st:C.st,cam:!!C.cam,vid:!!C.vOn,vis:(typeof document!=='undefined'&&document.visibilityState)||''})); return true; }catch(e){ return false; } }
function hpBcBoot(){ try{ const hb=JSON.parse(localStorage.getItem(HP_HB_KEY)||'null'); if(!hb||!(Number(hb.t)>0)) return 0; localStorage.removeItem(HP_HB_KEY); if(Date.now()-Number(hb.t)>864e5) return 0;
    let a=[]; try{ a=JSON.parse(localStorage.getItem(HP_BC_KEY)||'[]'); }catch(e){ a=[]; } let ui=''; try{ ui=String(localStorage.getItem(HP_UI_KEY)||''); }catch(e){}
    hpLog('通話：前回は通話の途中で止まった（最後の脈 '+hb.at+'・'+hb.st+(hb.cam?'・カメラあり':'')+(hb.vid?'・映像あり':'')+'・画面 '+hb.vis+'・描き直し '+(ui||'?')+'）');
    const last=(Array.isArray(a)?a:[]).slice(-10); for(const x of last) hpLog('通話：　前回の足跡 '+x); return last.length+1; }catch(e){ return 0; } }
try{ if(typeof log==='function'&&!log.__f311){ const f=log; log=Object.assign(function(m){ try{ const s=String(m); if(s.indexOf('通話：')>=0||s.indexOf('画面の誤り：')>=0) hpBc(s.replace(/^post: /,'')); }catch(e){} return f.apply(this,arguments); },f,{__f311:1}); } }catch(e){}
try{ hpVidCam=(function(f){ if(typeof f!=='function'||f.__f311) return f; return Object.assign(function(){ hpBc('→ hpVidCam'); const r=f.apply(this,arguments); return (r&&r.then)?r.then(v=>{ hpBc('← hpVidCam '+v); return v; },e=>{ hpBc('× hpVidCam '+(e&&e.message||e)); throw e; }):r; },f,{__f311:1}); })(hpVidCam); }catch(e){}
try{ hpVidAttach=(function(f){ if(typeof f!=='function'||f.__f311) return f; return Object.assign(function(){ hpBc('→ hpVidAttach'); const r=f.apply(this,arguments); return (r&&r.then)?r.then(v=>{ hpBc('← hpVidAttach '+v); return v; },e=>{ hpBc('× hpVidAttach '+(e&&e.message||e)); throw e; }):r; },f,{__f311:1}); })(hpVidAttach); }catch(e){}
try{ hpVidPreview=(function(f){ if(typeof f!=='function'||f.__f311) return f; return Object.assign(function(){ hpBc('→ hpVidPreview'); const r=f.apply(this,arguments); return (r&&r.then)?r.then(v=>{ hpBc('← hpVidPreview '+v); return v; },e=>{ hpBc('× hpVidPreview '+(e&&e.message||e)); throw e; }):r; },f,{__f311:1}); })(hpVidPreview); }catch(e){}
try{ hpVidLimit=(function(f){ if(typeof f!=='function'||f.__f311) return f; return Object.assign(function(){ hpBc('→ hpVidLimit'); const r=f.apply(this,arguments); return (r&&r.then)?r.then(v=>{ hpBc('← hpVidLimit '+v); return v; }):r; },f,{__f311:1}); })(hpVidLimit); }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f311){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const C=HP_CALL, on=!!(C&&C.st!=='ended'); if(on){ try{ localStorage.setItem(HP_UI_KEY,'→ '+hpBcNow()); }catch(e){} } const r=f.apply(this,arguments); if(on){ try{ localStorage.setItem(HP_UI_KEY,'← '+hpBcNow()); }catch(e){} } return r; },f,{__f311:1}); } }catch(e){}
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f311){ const f=hpCallEnd; hpCallEnd=Object.assign(function(){ const r=f.apply(this,arguments); try{ localStorage.removeItem(HP_HB_KEY); }catch(e){} return r; },f,{__f311:1}); } }catch(e){}
try{ if(typeof setInterval==='function'&&typeof window!=='undefined'&&!window.__hpBcT) window.__hpBcT=setInterval(hpBcBeat,1000); }catch(e){}
try{ hpBcBoot(); }catch(e){}

var HP_V312_CSS='#hp-call.vin .vlab{display:none!important}#btn-conv-vcall{margin-right:20px!important}';
function hpV312Css(){ try{ if(document.head&&!document.getElementById('hp-v312-css')){ const s=document.createElement('style'); s.id='hp-v312-css'; s.textContent=HP_V312_CSS; document.head.appendChild(s); } }catch(e){} }
try{ hpV312Css(); }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f312){ const f=hpCallUi; hpCallUi=Object.assign(function(){ try{ const C=HP_CALL; if(C&&C.vid&&C.dir==='in'&&!C.v312){ C.v312=1; C.wantCam=0; } }catch(e){}
    const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(!d||!C) return r; hpV312Css();
      if(C.vid&&C.dir==='in'&&C.st==='ringing'&&d.__st){ const t=TF('cl_incoming_v',{who:nickOf(C.peer)}); if(d.__st.textContent!==t) d.__st.textContent=t; }
      if(C.dir==='in'&&C.vid&&C.st!=='talking'&&C.st!=='ended'&&d.__vb) d.__vb.style.display='none'; }catch(e){} return r; },f,{__f312:1}); } }catch(e){}

var HP_V315_CSS='#hp-call .lvbox #hp-call-lv{object-fit:cover!important}';
function hpV315Css(){ try{ if(document.head&&!document.getElementById('hp-v315-css')){ const s=document.createElement('style'); s.id='hp-v315-css'; s.textContent=HP_V315_CSS; document.head.appendChild(s); } }catch(e){} }
try{ hpV315Css(); }catch(e){}

var HP_HB2_KEY='hp_hb2', HP_V315_UIN=0, HP_V315_UIS=0, HP_V315_UIW=0;
function hpV315Shown(){ try{ const d=document.getElementById('hp-call'); return !!((typeof HP_CALL!=='undefined'&&HP_CALL)||(typeof HP_CL3_SNAPEL!=='undefined'&&HP_CL3_SNAPEL)||(d&&d.style.display&&d.style.display!=='none')); }catch(e){ return false; } }
function hpV315Beat(){ try{ if(!hpV315Shown()){ localStorage.removeItem(HP_HB2_KEY); return false; } const C=(typeof HP_CALL!=='undefined')?HP_CALL:null, d=document.getElementById('hp-call');
    localStorage.setItem(HP_HB2_KEY,JSON.stringify({t:Date.now(),at:hpBcNow(),st:C?C.st:'なし',snap:!!(typeof HP_CL3_SNAPEL!=='undefined'&&HP_CL3_SNAPEL),cls:d?String(d.className||''):'',vis:(document.visibilityState||'')})); return true; }catch(e){ return false; } }
function hpV315Boot(){ try{ const hb=JSON.parse(localStorage.getItem(HP_HB2_KEY)||'null'); localStorage.removeItem(HP_HB2_KEY); if(!hb||!(Number(hb.t)>0)||Date.now()-Number(hb.t)>864e5) return 0;
    let a=[]; try{ a=JSON.parse(localStorage.getItem(HP_BC_KEY)||'[]'); }catch(e){ a=[]; } let ui=''; try{ ui=String(localStorage.getItem(HP_UI_KEY)||''); }catch(e){}
    hpLog('通話：前回は通話の画面のまま止まった（最後の脈 '+hb.at+'・'+hb.st+(hb.snap?'・結果の画面':'')+'・'+(hb.cls||'-')+'・画面 '+hb.vis+'・描き直し '+(ui||'?')+'）');
    const last=(Array.isArray(a)?a:[]).slice(-10); for(const x of last) hpLog('通話：　前回の足跡 '+x); return last.length+1; }catch(e){ return 0; } }
function hpV315Mark(name,f){ if(typeof f!=='function'||f.__f315) return f; return Object.assign(function(){ hpBc('→ '+name); return f.apply(this,arguments); },f,{__f315:1}); }
try{ hpCresShow=hpV315Mark('hpCresShow',hpCresShow); }catch(e){}
try{ hpCl3SnapShow=hpV315Mark('hpCl3SnapShow',hpCl3SnapShow); }catch(e){}
try{ hpCl3SnapHide=hpV315Mark('hpCl3SnapHide',hpCl3SnapHide); }catch(e){}
try{ hpCallStart=hpV315Mark('hpCallStart',hpCallStart); }catch(e){}
try{ hpCallEnd=hpV315Mark('hpCallEnd',hpCallEnd); }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f315){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const now=Date.now(); try{ if(now-HP_V315_UIS>=1000){ if(HP_V315_UIN>30&&HP_V315_UIW<10){ HP_V315_UIW++; hpBc('描き直しが 1 秒に '+HP_V315_UIN+' 回'); } HP_V315_UIS=now; HP_V315_UIN=0; } HP_V315_UIN++; localStorage.setItem(HP_UI_KEY,'→ '+hpBcNow()); }catch(e){}
    const r=f.apply(this,arguments); try{ localStorage.setItem(HP_UI_KEY,'← '+hpBcNow()); }catch(e){} return r; },f,{__f315:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&window.addEventListener&&!window.__hpV315){ window.__hpV315=1; window.addEventListener('pagehide',()=>{ try{ localStorage.removeItem(HP_HB2_KEY); }catch(e){} }); if(typeof setInterval==='function') setInterval(hpV315Beat,1000); } }catch(e){}
try{ const said=(typeof HP_LOG_LINES!=='undefined'&&Array.isArray(HP_LOG_LINES))&&HP_LOG_LINES.slice(-20).some(x=>String(x).indexOf('前回は通話の途中で止まった')>=0); if(!said) hpV315Boot(); else localStorage.removeItem(HP_HB2_KEY); }catch(e){}

var HP_PIP_KEY='hp_pip', HP_PIP_MIN=96;
try{ if(typeof hpCallWorker==='function'&&!hpCallWorker.__f316){ const f=hpCallWorker; hpCallWorker=Object.assign(function(){ const w=f.apply(this,arguments); try{ if(w&&!w.__f316){ w.__f316=1; w.addEventListener('message',e=>{ try{ const m=e&&e.data; if(m&&m.t==='wkbad') hpLog('通話：相手の映像のこまを開けられなかった（ここまで '+m.bad+'・全体の絵を頼んだ '+m.kf+' 回）'); }catch(x){} }); } }catch(e){} return w; },f,{__f316:1}); } }catch(e){}
async function hpV316Stats(C){ try{ if(!C||!C.pc||C.st!=='talking') return null; const t=(typeof hpVidTr==='function')?hpVidTr(C.pc):null; if(!t) return null; const o={};
    (await C.pc.getStats()).forEach(r=>{ if(r.kind!=='video'&&r.mediaType!=='video') return; if(r.type==='inbound-rtp'){ o.rw=r.frameWidth||0; o.rh=r.frameHeight||0; o.rf=r.framesDecoded||0; o.rd=r.framesDropped||0; o.rl=r.packetsLost||0; o.rp=r.pliCount||0; o.rz=r.freezeCount||0; } if(r.type==='outbound-rtp'){ o.sw=r.frameWidth||0; o.sh=r.frameHeight||0; o.sf=r.framesEncoded||0; o.sq=r.qualityLimitationReason||''; o.sp=r.pliCount||0; } });
    return o; }catch(e){ return null; } }
function hpV316Line(p,o){ const d=k=>Math.max(0,(o[k]||0)-((p&&p[k])||0)); const a=[];
  if(o.rf) a.push('受けた '+o.rw+'×'+o.rh+'・こま +'+d('rf')+'（落とした +'+d('rd')+'・欠け +'+d('rl')+'・全体の絵を頼んだ +'+d('rp')+(o.rz?'・止まった '+o.rz:'')+'）');
  if(o.sf) a.push('送った '+o.sw+'×'+o.sh+'・こま +'+d('sf')+'（頼まれた +'+d('sp')+(o.sq&&o.sq!=='none'?'・絞った理由 '+o.sq:'')+'）');
  return a.length?'通話：映像 '+a.join('／'):''; }
try{ if(typeof setInterval==='function'&&typeof window!=='undefined'&&!window.__hpV316T) window.__hpV316T=setInterval(async()=>{ try{ const C=HP_CALL; if(!C||C.st!=='talking'||!(C.vOn||C.cam)) return; const o=await hpV316Stats(C); if(!o||HP_CALL!==C) return; const s=hpV316Line(C.v316,o); C.v316=o; if(s) hpLog(s); }catch(e){} },20000); }catch(e){}
function hpPipLoad(){ try{ const o=JSON.parse(localStorage.getItem(HP_PIP_KEY)||'null'); return (o&&typeof o==='object')?o:{}; }catch(e){ return {}; } }
function hpPipSave(o){ try{ localStorage.setItem(HP_PIP_KEY,JSON.stringify(o)); }catch(e){} }
function hpPipMax(){ try{ return Math.max(HP_PIP_MIN,Math.floor((window.innerWidth||390)*0.6)); }catch(e){ return 234; } }
function hpPipPlace(box,o){ try{ const W=window.innerWidth||390, H=window.innerHeight||844, w=Math.max(HP_PIP_MIN,Math.min(hpPipMax(),Number(o.w)||HP_PIP_MIN)), h=Math.round(w*4/3), m=12;
    const top=m+40, bot=Math.max(top,H-h-280); const x=o.c&&o.c.indexOf('l')>=0?m:W-w-m, y=o.c&&o.c.indexOf('b')>=0?bot:top;
    box.style.width=w+'px'; box.style.height=h+'px'; box.style.left=x+'px'; box.style.top=y+'px'; box.style.right='auto'; box.style.bottom='auto'; return {w:w,h:h,x:x,y:y}; }catch(e){ return null; } }
function hpPipClear(box){ try{ for(const k of ['width','height','left','top','right','bottom']) box.style[k]=''; }catch(e){} }
function hpPipArm(d){ try{ const box=d&&d.__lvbox; if(!box||box.__pip) return false; box.__pip=1; box.style.touchAction='none';
    const pts=new Map(); let st=null;
    const down=e=>{ try{ if(d.classList.contains('pre')) return; e.preventDefault(); e.stopPropagation(); try{ box.setPointerCapture(e.pointerId); }catch(x){} pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); const r=box.getBoundingClientRect();
        if(pts.size===1) st={mode:'move',x0:e.clientX,y0:e.clientY,l:r.left,t:r.top,w:r.width};
        else if(pts.size===2){ const [a,b]=Array.from(pts.values()); st={mode:'pinch',d0:Math.hypot(a.x-b.x,a.y-b.y)||1,w:r.width,l:r.left,t:r.top}; } }catch(x){} };
    const move=e=>{ try{ if(!st||!pts.has(e.pointerId)) return; e.preventDefault(); pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(st.mode==='move'&&pts.size===1){ box.style.left=(st.l+e.clientX-st.x0)+'px'; box.style.top=(st.t+e.clientY-st.y0)+'px'; box.style.right='auto'; box.style.bottom='auto'; }
        else if(st.mode==='pinch'&&pts.size>=2){ const [a,b]=Array.from(pts.values()); const w=Math.max(HP_PIP_MIN,Math.min(hpPipMax(),Math.round(st.w*(Math.hypot(a.x-b.x,a.y-b.y)/st.d0)))); box.style.width=w+'px'; box.style.height=Math.round(w*4/3)+'px'; try{ hpLvFit(d); }catch(x){} } }catch(x){} };
    const up=e=>{ try{ if(!pts.has(e.pointerId)) return; pts.delete(e.pointerId); if(pts.size>0){ if(st&&st.mode==='pinch'){ const r=box.getBoundingClientRect(); const [a]=Array.from(pts.values()); st={mode:'move',x0:a.x,y0:a.y,l:r.left,t:r.top,w:r.width}; } return; }
        const r=box.getBoundingClientRect(), W=window.innerWidth||390, H=window.innerHeight||844; const c=(r.top+r.height/2>H/2?'b':'t')+(r.left+r.width/2<W/2?'l':'r'); const o={c:c,w:Math.round(r.width)}; hpPipSave(o); hpPipPlace(box,o); try{ hpLvFit(d); }catch(x){} st=null; }catch(x){} };
    box.addEventListener('pointerdown',down,{passive:false}); box.addEventListener('pointermove',move,{passive:false}); box.addEventListener('pointerup',up); box.addEventListener('pointercancel',up); return true; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f316){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const d=document.getElementById('hp-call'), box=d&&d.__lvbox; if(!box) return r; hpPipArm(d);
      if(d.classList.contains('pre')||!d.classList.contains('cam')){ if(box.__pipOn){ box.__pipOn=0; hpPipClear(box); } }
      else if(!box.__pipOn){ box.__pipOn=1; hpPipPlace(box,hpPipLoad()); try{ hpLvFit(d); }catch(x){} } }catch(e){} return r; },f,{__f316:1}); } }catch(e){}

var HP_PIP_DEF=120;
hpPipMax=function(){ try{ return Math.max(HP_PIP_MIN,Math.floor((window.innerWidth||390)*0.7)); }catch(e){ return 273; } }
hpPipPlace=function(box,o){ try{ const W=window.innerWidth||390, H=window.innerHeight||844, w=Math.max(HP_PIP_MIN,Math.min(hpPipMax(),Number(o.w)||HP_PIP_DEF)), h=Math.round(w*4/3), m=8;
    let fx=Number(o.x), fy=Number(o.y); if(!(fx>=0&&fx<=1)) fx=(o.c&&o.c.indexOf('l')>=0)?0:1; if(!(fy>=0&&fy<=1)) fy=(o.c&&o.c.indexOf('b')>=0)?0.75:0.05;
    const x=Math.round(m+fx*Math.max(0,W-w-2*m)), y=Math.round(m+fy*Math.max(0,H-h-2*m));
    box.style.width=w+'px'; box.style.height=h+'px'; box.style.left=x+'px'; box.style.top=y+'px'; box.style.right='auto'; box.style.bottom='auto'; return {w:w,h:h,x:x,y:y}; }catch(e){ return null; } }
function hpPipFrac(r){ const W=window.innerWidth||390, H=window.innerHeight||844, m=8, fw=Math.max(1,W-r.width-2*m), fh=Math.max(1,H-r.height-2*m); const cl=v=>Math.max(0,Math.min(1,v));
  return {x:Math.round(cl((r.left-m)/fw)*1000)/1000,y:Math.round(cl((r.top-m)/fh)*1000)/1000,w:Math.round(r.width)}; }
hpPipArm=function(d){ try{ const box=d&&d.__lvbox; if(!box||box.__pip2) return false; box.__pip2=1; box.style.touchAction='none';
    const on=()=>!!(d.classList.contains('cam')&&!d.classList.contains('pre')&&box.__pipOn);
    const save=()=>{ const o=hpPipFrac(box.getBoundingClientRect()); hpPipSave(o); hpPipPlace(box,o); try{ hpLvFit(d); }catch(x){} };
    let drag=null, lastTap=0;
    box.addEventListener('pointerdown',e=>{ try{ if(!on()||!e.isPrimary) return; e.preventDefault(); e.stopPropagation(); try{ box.setPointerCapture(e.pointerId); }catch(x){} const r=box.getBoundingClientRect(); drag={id:e.pointerId,x0:e.clientX,y0:e.clientY,l:r.left,t:r.top,moved:false}; }catch(x){} },{passive:false});
    box.addEventListener('pointermove',e=>{ try{ if(!drag||e.pointerId!==drag.id||pinch) return; e.preventDefault(); const dx=e.clientX-drag.x0, dy=e.clientY-drag.y0; if(Math.abs(dx)+Math.abs(dy)>6) drag.moved=true; box.style.left=(drag.l+dx)+'px'; box.style.top=(drag.t+dy)+'px'; box.style.right='auto'; box.style.bottom='auto'; }catch(x){} },{passive:false});
    const up=e=>{ try{ if(!drag||e.pointerId!==drag.id) return; const mv=drag.moved; drag=null; if(pinch) return;
        if(!mv){ const now=Date.now(); if(now-lastTap<350){ lastTap=0; const r=box.getBoundingClientRect(), big=r.width<hpPipMax()*0.8; const o=hpPipFrac(r); o.w=big?hpPipMax():HP_PIP_DEF; hpPipSave(o); hpPipPlace(box,o); try{ hpLvFit(d); }catch(x){} return; } lastTap=now; return; }
        save(); }catch(x){} };
    box.addEventListener('pointerup',up); box.addEventListener('pointercancel',up);
    let pinch=null; const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)||1;
    d.addEventListener('touchstart',e=>{ try{ if(!on()||!e.touches||e.touches.length!==2) return; const r=box.getBoundingClientRect(); pinch={d0:dist(e.touches),w:r.width,cx:r.left+r.width/2,cy:r.top+r.height/2}; drag=null; e.preventDefault(); }catch(x){} },{passive:false,capture:true});
    d.addEventListener('touchmove',e=>{ try{ if(!pinch||!e.touches||e.touches.length<2) return; e.preventDefault(); const w=Math.max(HP_PIP_MIN,Math.min(hpPipMax(),Math.round(pinch.w*dist(e.touches)/pinch.d0))), h=Math.round(w*4/3);
        box.style.width=w+'px'; box.style.height=h+'px'; box.style.left=Math.round(pinch.cx-w/2)+'px'; box.style.top=Math.round(pinch.cy-h/2)+'px'; box.style.right='auto'; box.style.bottom='auto'; try{ hpLvFit(d); }catch(x){} }catch(x){} },{passive:false,capture:true});
    const pend=e=>{ try{ if(!pinch) return; if(e.touches&&e.touches.length>=2) return; pinch=null; save(); }catch(x){} };
    d.addEventListener('touchend',pend,{capture:true}); d.addEventListener('touchcancel',pend,{capture:true}); return true; }catch(e){ return false; } }

try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f318){ const f=hpCallSig; hpCallSig=Object.assign(function(peer,body,devs){ try{ if(body&&body.type==='call'&&body.fg===undefined&&typeof document!=='undefined'&&document.visibilityState==='visible') body.fg=1; }catch(e){} return f.apply(this,arguments); },f,{__f318:1}); } }catch(e){}
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f318){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ const v=await f.apply(this,arguments); try{ const C=HP_CALL;
      if(C&&o&&typeof o.call==='string'&&o.call===C.id){ if(o.type==='call'&&C.dir==='in') C.fg=!!o.fg; if(o.type==='callans'&&C.dir==='out'&&!C.ansAt){ C.ansAt=Date.now(); try{ hpCallUi(); }catch(x){} } } }catch(e){} return v; },f,{__f318:1}); } }catch(e){}
try{ if(typeof hpCpsRing==='function'&&!hpCpsRing.__f318){ const f=hpCpsRing; hpCpsRing=Object.assign(function(peer,body,devs){ try{ const C=HP_CALL; if(body&&body.type==='callans'&&C&&C.dir==='in'&&C.fg&&body.call===C.id){ hpLog('通話：かけた側が Handpost を開いているので、答えは通知に載せない（郵便受けと待機の糸で届ける）'); return Promise.resolve({devs:[],sent:0,skip:1}); } }catch(e){} return f.apply(this,arguments); },f,{__f318:1}); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f318){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(C&&d&&d.__st&&C.dir==='out'&&C.st==='calling'&&C.ansAt){ const t=TF('cl_ito_pull',{who:nickOf(C.peer)}); if(d.__st.textContent!==t) d.__st.textContent=t; } }catch(e){} return r; },f,{__f318:1}); } }catch(e){}

try{ if(typeof hpCl3Hold==='function'&&!hpCl3Hold.__f320){ const f=hpCl3Hold; hpCl3Hold=Object.assign(function(C){ const h=f.apply(this,arguments); try{ if(h==='ok'&&C&&(C.vid||C.cam||C.wantCam)){ if(!C.f320L){ C.f320L=1; hpLog('通話：ビデオ通話なので、つながった直後の 4 秒の画面は出さない（つながるまで '+Math.floor(((C.talkAt||Date.now())-(C.at||C.talkAt||Date.now()))/1000)+' 秒）'); } return ''; } }catch(e){} return h; },f,{__f320:1}); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f320){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=(typeof document!=='undefined')?document.getElementById('hp-call'):null; if(d&&d.__st&&d.__st.style){ const hold=!!(C&&C.st==='talking'&&typeof hpCl3Hold==='function'&&hpCl3Hold(C)==='ok'); d.__st.style.display=hold?'none':''; } }catch(e){} return r; },f,{__f320:1}); } }catch(e){}

try{ if(typeof hpTurnCredsAny==='function'&&!hpTurnCredsAny.__f321){ const f=hpTurnCredsAny; hpTurnCredsAny=Object.assign(async function(){ try{ return await f.apply(this,arguments); }catch(e0){
      try{ const C=HP_CALL, peer=(C&&C.dir==='out'&&C.peer)?C.peer:''; const L=(peer&&typeof hpTurnPeerOf==='function')?hpTurnPeerOf(peer):[]; if(L.length){ hpLog('通話：自分の交換手が無いので、相手の交換手（'+L[0].host+':'+L[0].port+'）で呼ぶ'); return Object.assign({},L[0],{via:'peer'}); } }catch(e){}
      throw e0; } },f,{__f321:1}); } }catch(e){}
var HP_V321_CSS='#hp-call.pre::before{flex:0 0 0!important}#hp-call.pre{padding-top:calc(28px + env(safe-area-inset-top,0px))!important}'
 +'#hp-call.pre .lvbox{position:fixed!important;inset:0!important;left:0!important;top:0!important;right:0!important;bottom:0!important;width:100%!important;height:100%!important;border-radius:0!important;border:0!important;z-index:-1!important;display:block!important}'
 +'#hp-call.pre .lvbox #hp-call-lv{left:0!important;top:0!important;width:100%!important;height:100%!important;transform:none!important;object-fit:cover!important}#hp-call.pre .lvbox #hp-call-lv.me{transform:scaleX(-1)!important}'
 +'#hp-call.pre .lvbox::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,0) 28%,rgba(0,0,0,0) 62%,rgba(0,0,0,.6))}'
 +'#hp-call.pre .st{max-width:92%;margin-left:auto;margin-right:auto;text-align:center;text-shadow:0 1px 6px rgba(0,0,0,.85)}#hp-call.pre .who{text-shadow:0 1px 6px rgba(0,0,0,.85)}';
function hpV321Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-v321-css')) return false; const s=document.createElement('style'); s.id='hp-v321-css'; s.textContent=HP_V321_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f321){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpV321Css(); }catch(e){} return r; },f,{__f321:1}); } }catch(e){}

function hpV322Clear(el){ try{ if(!el||!el.style) return; for(const k of ['left','top','right','bottom','width','height','transform','object-fit']) if(el.style.getPropertyPriority(k)==='important') el.style.removeProperty(k); }catch(e){} }
try{ if(typeof hpLvFit==='function'&&!hpLvFit.__f322){ const f=hpLvFit; hpLvFit=Object.assign(function(d){ try{ const v=d&&d.__lv, box=d&&d.__lvbox;
      if(v&&box&&d.classList&&d.classList.contains('pre')){ for(const [k,x] of [['left','0'],['top','0'],['right','0'],['bottom','0'],['width','100%'],['height','100%']]){ box.style.setProperty(k,x,'important'); }
        for(const [k,x] of [['left','0'],['top','0'],['width','100%'],['height','100%'],['object-fit','cover'],['transform',v.classList.contains('me')?'scaleX(-1)':'none']]) v.style.setProperty(k,x,'important');
        const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; if(C&&!C.f322L&&v.videoWidth&&typeof v.getBoundingClientRect==='function'){ C.f322L=1; const r=v.getBoundingClientRect(); hpLog('通話：呼び出し中の自分の映像を画面いっぱいに（'+Math.round(r.width)+'×'+Math.round(r.height)+'・画面 '+((typeof window!=='undefined'&&window.innerWidth)||0)+'×'+((typeof window!=='undefined'&&window.innerHeight)||0)+'）'); }
        return; }
      hpV322Clear(v); hpV322Clear(box); }catch(e){} return f.apply(this,arguments); },f,{__f322:1}); } }catch(e){}

var HP_V323_LAST=0, HP_V323_VIS='';
function hpV323On(){ try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; return !!(C&&C.st!=='ended'); }catch(e){ return false; } }
function hpV323Vis(){ try{ return (typeof document!=='undefined'&&document.visibilityState)||'?'; }catch(e){ return '?'; } }
function hpV323Note(s){ try{ if(hpV323On()) hpBc(s); }catch(e){} }
function hpV323Tick(now){ try{ now=Number(now)||Date.now(); const last=HP_V323_LAST, vis=hpV323Vis(), was=HP_V323_VIS; HP_V323_LAST=now; HP_V323_VIS=vis; if(!last||!hpV323On()) return 0;
    const gap=now-last; if(gap>=4000&&vis==='visible'&&was==='visible'){ const s='通話：画面の処理が '+(gap/1000).toFixed(1)+' 秒止まっていた（画面は表のまま・'+String(HP_CALL.st)+(HP_CALL.cam?'・カメラあり':'')+'）'; hpLog(s); hpBc(s); return gap; } return 0; }catch(e){ return 0; } }
try{ if(typeof document!=='undefined'&&document.addEventListener){ document.addEventListener('visibilitychange',()=>hpV323Note('画面 '+hpV323Vis())); document.addEventListener('freeze',()=>hpV323Note('ページが凍結された（ブラウザが止めた）')); document.addEventListener('resume',()=>hpV323Note('ページが再開した')); } }catch(e){}
try{ if(typeof window!=='undefined'&&window.addEventListener) window.addEventListener('pagehide',()=>hpV323Note('ページを離れた（pagehide）')); }catch(e){}
try{ if(typeof setInterval==='function'&&typeof window!=='undefined'&&!window.__hpV323T) window.__hpV323T=setInterval(()=>{ hpV323Tick(Date.now()); },1000); }catch(e){}

var HP_CS_KEY='hp_cstat', HP_CS_MAX=30, HP_CS_MIN=3;
function hpCsLoad(){ try{ const a=JSON.parse(localStorage.getItem(HP_CS_KEY)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function hpCsAdd(o){ try{ const a=hpCsLoad(); a.push(o); while(a.length>HP_CS_MAX) a.shift(); localStorage.setItem(HP_CS_KEY,JSON.stringify(a)); return a; }catch(e){ return []; } }
function hpCsMed(dir,a){ try{ const L=(a||hpCsLoad()).filter(x=>x&&x.d===dir&&!x.f&&Number(x.w)>=0).map(x=>Number(x.w)).sort((p,q)=>p-q); if(L.length<HP_CS_MIN) return null; const m=L.length>>1; return {ms:L.length%2?L[m]:Math.round((L[m-1]+L[m])/2),n:L.length}; }catch(e){ return null; } }
function hpCsFrom(C){ if(!C) return 0; return (C.dir==='out'?Number(C.ansAt):Number(C.accAt))||Number(C.f324C)||0; }
function hpCsWait(C){ return !!(C&&!C.talkAt&&(C.st==='connecting'||(C.dir==='out'&&C.st==='calling'&&C.ansAt))); }
function hpCsWatch(C,now){ try{ if(!C) return false; now=Number(now)||Date.now(); if(hpCsWait(C)&&!C.f324C) C.f324C=now; const from=hpCsFrom(C); if(!from||C.f324R) return false;
    if(C.talkAt){ C.f324R=1; const w=Math.max(0,Number(C.talkAt)-from), a=hpCsAdd({d:C.dir,w:w,t:Math.max(0,Number(C.talkAt)-(Number(C.at)||Number(C.talkAt))),at:now}), m=hpCsMed(C.dir,a);
      hpLog('通話：応答からつながるまで '+(w/1000).toFixed(1)+' 秒（'+(m?'ふだん '+(m.ms/1000).toFixed(1)+' 秒・直近 '+m.n+' 回':'控えはまだ少ない')+'）'); return true; }
    if(C.st==='ended'){ C.f324R=1; const w=Math.max(0,now-from); hpCsAdd({d:C.dir,w:w,f:1,at:now}); hpLog('通話：応答したが、つながらずに終わった（'+(w/1000).toFixed(1)+' 秒待った）'); return true; } }catch(e){} return false; }
function hpCsText(C,now){ try{ if(!hpCsWait(C)) return ''; const from=hpCsFrom(C), m=hpCsMed(C.dir); if(!from||!m) return ''; const left=m.ms-((Number(now)||Date.now())-from);
    return left>-1000?TF('cl_est_left',{n:Math.max(1,Math.ceil(left/1000))}):T('cl_est_slow'); }catch(e){ return ''; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f324){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL; hpCsWatch(C); const d=(typeof document!=='undefined')?document.getElementById('hp-call'):null; if(!d||!d.__st) return r;
      const t=hpCsText(C); let el=d.__est; if(!el&&t){ el=document.createElement('div'); el.className='est'; el.style.cssText='font-size:.85em;opacity:.8;margin-top:-8px'; const st=d.__st; if(st.parentNode===d) d.insertBefore(el,st.nextSibling); else d.appendChild(el); d.__est=el; }
      if(el){ if(el.textContent!==t) el.textContent=t; el.style.display=t?'':'none'; } }catch(e){} return r; },f,{__f324:1}); } }catch(e){}

var HP_V324_CSS='#chat-head #btn-conv-vcall{margin-right:1px!important}';
function hpV324Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-v324-css')) return false; const s=document.createElement('style'); s.id='hp-v324-css'; s.textContent=HP_V324_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
try{ hpV324Css(); if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('DOMContentLoaded',()=>hpV324Css()); }catch(e){}

function hpV327Key(d){ try{ const v=d&&d.__lv; if(!v) return ''; return String(v.style.width||'')+'|'+String(v.style.height||'')+'|'+(d.classList&&d.classList.contains('pre')?'p':'')+'|'+(d.__lvbox&&d.__lvbox.style?String(d.__lvbox.style.width||''):''); }catch(e){ return ''; } }
function hpV327Redraw(d){ try{ const v=d&&d.__lv, s=v&&v.srcObject; if(!v||!s) return false; const C0=(typeof HP_CALL!=='undefined')?HP_CALL:null; if(C0){ C0.f327N=(C0.f327N||0)+1; if(C0.f327N>3) return false; } v.srcObject=null; v.srcObject=s; try{ const p=v.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){}
    const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; if(C&&!C.f327L){ C.f327L=1; let w=0,h=0; try{ const r=v.getBoundingClientRect(); w=Math.round(r.width); h=Math.round(r.height); }catch(e){} hpLog('通話：自分の映像の大きさが変わったので、映像を描き直した（'+w+'×'+h+'）'); } return true; }catch(e){ return false; } }
try{ if(typeof hpLvFit==='function'&&!hpLvFit.__f327){ const f=hpLvFit; hpLvFit=Object.assign(function(d){ const r=f.apply(this,arguments); try{ const v=d&&d.__lv; if(!v||!v.srcObject) return r; const k=hpV327Key(d); if(k===v.__f327k) return r;
      const first=(v.__f327k===undefined); v.__f327k=k; if(first&&!(d.classList&&d.classList.contains('pre'))) return r;
      if(v.__f327t) clearTimeout(v.__f327t); v.__f327t=setTimeout(()=>{ v.__f327t=null; if(hpV327Key(d)===k) hpV327Redraw(d); },350); }catch(e){} return r; },f,{__f327:1}); } }catch(e){}

function hpConnDing(){ try{ if(typeof soundOn==='function'&&soundOn()==='off') return false; const A=(typeof window!=='undefined')&&(window.AudioContext||window.webkitAudioContext); if(!A) return false;
    if(!HP_CALL_AC) HP_CALL_AC=new A(); const a=HP_CALL_AC; try{ if(a.state==='suspended') a.resume(); }catch(e){}
    const one=(f,at,dur)=>{ const t0=a.currentTime+at, o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(0.08,t0+0.015); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur); o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0+dur+0.02); };
    one(784,0.02,0.14); one(1175,0.16,0.22); return true; }catch(e){ return false; } }
function hpConnDingCheck(C,now){ try{ if(!C||C.f328D||C.st!=='talking'||!C.talkAt) return false; C.f328D=1; if((Number(now)||Date.now())-Number(C.talkAt)>3000) return false;
    const ok=hpConnDing(); hpLog('通話：つながったので音で知らせた'+(ok?'':'（音を切っている設定・または鳴らせない）')); return ok; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f328){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpConnDingCheck(HP_CALL); }catch(e){} return r; },f,{__f328:1}); } }catch(e){}

var HP_V329_CSS='#hp-call.pre>#hp-call-pv,#hp-call.pre>#hp-call-pvs{display:block!important}';
function hpV329Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-v329-css')) return false; const s=document.createElement('style'); s.id='hp-v329-css'; s.textContent=HP_V329_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpV329Drop(d){ try{ const pv=d&&d.__pv; if(pv){ try{ pv.srcObject=null; }catch(e){} try{ pv.remove(); }catch(e){} d.__pv=null; } const sh=d&&d.__pvs; if(sh){ try{ sh.remove(); }catch(e){} d.__pvs=null; } const box=d&&d.__lvbox; if(box&&box.style&&box.style.getPropertyPriority('visibility')==='important') box.style.removeProperty('visibility'); return !!pv; }catch(e){ return false; } }
function hpV329Sync(d,C){ try{ if(!d||!d.classList) return false; const pre=d.classList.contains('pre')&&!!(C&&C.cam);
    if(!pre){ if(d.__pv||d.__pvs) hpV329Drop(d); return false; }
    hpV329Css(); let pv=d.__pv;
    if(!pv||pv.__t!==C.cam){ hpV329Drop(d);
      pv=document.createElement('video'); pv.id='hp-call-pv'; pv.muted=true; pv.autoplay=true; pv.setAttribute('playsinline',''); pv.playsInline=true;
      pv.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;width:100%;height:100%;object-fit:cover;z-index:-1;background:#000;border:0;border-radius:0';
      pv.__t=C.cam; pv.srcObject=new MediaStream([C.cam]);
      const sh=document.createElement('div'); sh.id='hp-call-pvs'; sh.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:-1;background:linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,0) 28%,rgba(0,0,0,0) 62%,rgba(0,0,0,.6))';
      d.insertBefore(sh,d.firstChild||null); d.insertBefore(pv,sh); d.__pv=pv; d.__pvs=sh;
      try{ const p=pv.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){}
      if(!C.f329L){ C.f329L=1; setTimeout(()=>{ try{ if(d.__pv!==pv) return; const r=pv.getBoundingClientRect(); hpLog('通話：呼び出し中の自分の映像を新しい枠で画面いっぱいに（'+Math.round(r.width)+'×'+Math.round(r.height)+'・映像 '+(pv.videoWidth||0)+'×'+(pv.videoHeight||0)+'）'); }catch(e){} },1200); } }
    pv.style.transform=(C.face==='environment')?'':'scaleX(-1)';
    const box=d.__lvbox; if(box&&box.style) box.style.setProperty('visibility','hidden','important');
    return true; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f329){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const d=(typeof document!=='undefined')?document.getElementById('hp-call'):null; if(d) hpV329Sync(d,HP_CALL); }catch(e){} return r; },f,{__f329:1}); } }catch(e){}
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f329){ const f=hpCallEnd; hpCallEnd=Object.assign(function(){ const r=f.apply(this,arguments); try{ const d=(typeof document!=='undefined')?document.getElementById('hp-call'):null; if(d) hpV329Drop(d); }catch(e){} return r; },f,{__f329:1}); } }catch(e){}

function hpV330Fresh(d,C){ try{ const old=d&&d.__lv, box=d&&d.__lvbox; if(!old||!box||!C||!C.cam) return false;
    const v=document.createElement('video'); v.id=old.id||'hp-call-lv'; v.className=old.className||''; v.muted=true; v.autoplay=true; v.setAttribute('playsinline',''); v.playsInline=true;
    try{ old.srcObject=null; }catch(e){} try{ if(old.parentNode) old.parentNode.replaceChild(v,old); else box.appendChild(v); }catch(e){ box.appendChild(v); }
    d.__lv=v; v.addEventListener('resize',()=>hpLvFit(d)); v.addEventListener('loadedmetadata',()=>hpLvFit(d));
    v.__f330t=C.cam; v.srcObject=new MediaStream([C.cam]); try{ const p=v.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} try{ hpLvFit(d); }catch(e){}
    if(!C.f330L){ C.f330L=1; setTimeout(()=>{ try{ if(d.__lv!==v) return; const r=v.getBoundingClientRect(), b=box.getBoundingClientRect(); hpLog('通話：小窓の自分の映像を新しい枠で描いた（枠 '+Math.round(b.width)+'×'+Math.round(b.height)+'・映像 '+Math.round(r.width)+'×'+Math.round(r.height)+'・カメラ '+(v.videoWidth||0)+'×'+(v.videoHeight||0)+'）'); }catch(e){} },1200); }
    return true; }catch(e){ return false; } }
function hpV330Sync(d,C){ try{ const v=d&&d.__lv; if(!v||!d.classList) return false; const pre=d.classList.contains('pre');
    if(pre){ if(v.srcObject){ try{ v.srcObject=null; }catch(e){} v.__f330t=null; } return false; }
    if(C&&C.cam&&d.classList.contains('cam')&&v.__f330t!==C.cam) return hpV330Fresh(d,C);
    return false; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f330){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const d=(typeof document!=='undefined')?document.getElementById('hp-call'):null; if(d) hpV330Sync(d,HP_CALL); }catch(e){} return r; },f,{__f330:1}); } }catch(e){}
hpConnDing=function(){ try{ if(typeof soundOn==='function'&&soundOn()==='off') return false; const A=(typeof window!=='undefined')&&(window.AudioContext||window.webkitAudioContext); if(!A) return false;
    if(!HP_CALL_AC) HP_CALL_AC=new A(); const a=HP_CALL_AC; try{ if(a.state==='suspended') a.resume(); }catch(e){}
    const one=(f,at,dur)=>{ const t0=a.currentTime+at, o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(0.3,t0+0.02); g.gain.setValueAtTime(0.3,t0+Math.max(0.03,dur-0.08)); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur); o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0+dur+0.02); };
    one(784,0.02,0.22); one(1175,0.24,0.4); return true; }catch(e){ return false; } };

var HP_CONN_KINDS=['pon','chime','harp','tick','say','off'];
function hpConnOnce(kind){ try{ if(kind==='off') return 0; const a=hpRingAc(); if(!a) return 0; const t0=a.currentTime+0.02;
    const n=(f,at,dur,vol,type)=>{ const o=a.createOscillator(), g=a.createGain(); o.type=type||'sine'; o.frequency.value=f; g.gain.setValueAtTime(0.0001,t0+at); g.gain.linearRampToValueAtTime(vol,t0+at+0.02); g.gain.setValueAtTime(vol,t0+at+Math.max(0.03,dur-0.08)); g.gain.exponentialRampToValueAtTime(0.0001,t0+at+dur); o.connect(g); g.connect(a.destination); o.start(t0+at); o.stop(t0+at+dur+0.02); };
    if(kind==='chime'){ n(523.25,0,0.3,0.3); n(659.25,0.18,0.3,0.3); n(783.99,0.36,0.5,0.3); return 900; }
    if(kind==='harp'){ [523.25,659.25,783.99,1046.5].forEach((f,i)=>n(f,i*0.09,0.45,0.28,'triangle')); return 800; }
    if(kind==='tick'){ n(1400,0,0.06,0.3,'square'); n(1400,0.12,0.06,0.3,'square'); return 300; }
    n(784,0,0.22,0.3); n(1175,0.22,0.4,0.3); return 700; }catch(e){ return 0; } }
hpConnDing=function(){ try{ if(typeof soundOn==='function'&&soundOn()==='off') return false; const kind=hpRingGet('p2p_conn',HP_CONN_KINDS); if(kind==='off') return false; return hpConnOnce(kind)>0; }catch(e){ return false; } };

function hpConnRow(c){ try{ if(!c||typeof document==='undefined') return false; if(document.getElementById('set-connsnd')) return false;
    const r=document.createElement('div'); r.className='kv'; r.id='set-connsnd'; r.style.marginTop='8px'; const b=document.createElement('b'); b.textContent=T('cl_conn_l'); b.setAttribute('data-i18n','cl_conn_l'); r.appendChild(b);
    const s=document.createElement('select'); s.style.cssText='background:#1b2740;border:none;border-radius:6px;color:inherit;padding:4px 6px'; for(const v of HP_CONN_KINDS){ const o=document.createElement('option'); o.value=v; o.textContent=T('cl_conn_'+v); o.setAttribute('data-i18n','cl_conn_'+v); s.appendChild(o); } s.value=hpRingGet('p2p_conn',HP_CONN_KINDS); s.onchange=()=>{ hpRingSet('p2p_conn',HP_CONN_KINDS,s.value); hpConnOnce(s.value); };
    const t=document.createElement('button'); t.className='b'; t.type='button'; t.textContent=T('btn_snd_try'); t.setAttribute('data-i18n','btn_snd_try'); t.style.cssText='margin-left:8px;padding:4px 10px;font-size:12px'; t.onclick=()=>hpConnOnce(s.value); r.appendChild(s); r.appendChild(t); c.appendChild(r); return true; }catch(e){ return false; } }
try{ if(typeof hpRingCard==='function'&&!hpRingCard.__f331){ const f=hpRingCard; hpRingCard=Object.assign(function(){ const r=f.apply(this,arguments); try{ const c=document.getElementById('set-call'); if(c) hpConnRow(c); }catch(e){} return r; },f,{__f331:1}); } }catch(e){}
try{ if(typeof document!=='undefined'&&document.addEventListener){ const go=()=>{ try{ const c=document.getElementById('set-call'); if(c) hpConnRow(c); }catch(e){} }; if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',go); else setTimeout(go,0); setTimeout(go,1500); } }catch(e){}

function hpIsIos(){ try{ const ua=String(navigator.userAgent||''); return /iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&Number(navigator.maxTouchPoints)>1); }catch(e){ return false; } }
try{ if(typeof hpV330Sync==='function'&&!hpV330Sync.__f331){ const f=hpV330Sync; hpV330Sync=Object.assign(function(d,C){ if(!hpIsIos()) return false; return f.apply(this,arguments); },f,{__f331:1}); } }catch(e){}

var HP_V336_CSS='#set-snd .kv{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px 10px}#set-snd .kv>select{min-width:0;width:100%}#set-snd .kv>button{margin-left:0!important}@media (max-width:600px){#set-snd .kv{grid-template-columns:1fr auto}#set-snd .kv>b{grid-column:1/-1}}';
function hpV336Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-v336-css')) return false; const s=document.createElement('style'); s.id='hp-v336-css'; s.textContent=HP_V336_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpSndRows(){ try{ const q=s=>document.querySelector(s), kv=e=>(e&&e.closest)?e.closest('.kv'):null; const call=document.getElementById('set-call');
    return [['snd_l_mail',kv(document.getElementById('snd-pick'))],['snd_l_rin',kv(call&&call.querySelector('b[data-i18n="cl_rin_l"]'))],['snd_l_rout',kv(call&&call.querySelector('b[data-i18n="cl_rout_l"]'))],['snd_l_conn',document.getElementById('set-connsnd')]].filter(x=>!!x[1]); }catch(e){ return []; } }
function hpSndCard(){ try{ if(typeof document==='undefined') return false; hpV336Css(); const rows=hpSndRows(); if(rows.length<4) return false; let c=document.getElementById('set-snd');
    if(!c){ const ref=document.getElementById('set-mail'); if(!ref||!ref.parentNode) return false; c=document.createElement('div'); c.className='card'; c.id='set-snd'; const h=document.createElement('h2'); h.textContent=T('snd_card_h'); h.setAttribute('data-i18n','snd_card_h'); c.appendChild(h); ref.parentNode.insertBefore(c,ref.nextSibling); }
    let moved=0; for(const [key,r] of rows){ if(r.parentNode!==c){ c.appendChild(r); moved++; } const b=r.querySelector&&r.querySelector('b'); if(b&&b.getAttribute('data-i18n')!==key){ b.textContent=T(key); b.setAttribute('data-i18n',key); } }
    return moved>0; }catch(e){ return false; } }
try{ if(typeof hpRingCard==='function'&&!hpRingCard.__f336){ const f=hpRingCard; hpRingCard=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpSndCard(); }catch(e){} return r; },f,{__f336:1}); } }catch(e){}
try{ if(typeof document!=='undefined'&&document.addEventListener){ const go=()=>{ try{ hpSndCard(); }catch(e){} }; if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',go); else setTimeout(go,0); setTimeout(go,1600); setTimeout(go,4000); } }catch(e){}

var HP_V337_CSS='#hp-call-min{position:fixed;left:12px;top:calc(12px + env(safe-area-inset-top,0px));z-index:3;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.35);border-radius:18px;color:#fff;padding:6px 12px;font-size:13px;display:none;cursor:pointer}#hp-call.hp-can-min #hp-call-min{display:inline-flex;align-items:center;gap:6px}#hp-call.vid.hp-can-min>#hp-call-min{display:inline-flex!important}html #hp-call #hp-call-min{width:auto;height:38px;min-width:0;min-height:0;padding:0 12px 0 8px;border-radius:19px;font-size:16px;line-height:1;white-space:nowrap;gap:4px;background:rgba(0,0,0,.45);border:1px solid rgba(255,255,255,.35);color:#fff}#hp-call #hp-call-min .hpi{width:22px;height:22px;background-color:currentColor}#hp-call #hp-call-min .hpi-t{display:none}'
 +'#hp-callbar{position:fixed;left:0;right:0;top:0;z-index:8990;display:none;align-items:center;gap:8px;padding:calc(18px + env(safe-area-inset-top,0px)) 12px 10px;background:#1f8f6a;color:#fff;font-size:14px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,.35)}body.hp-callmin #hp-callbar{display:flex}body.hp-callmin{padding-top:calc(56px + env(safe-area-inset-top,0px))}'
 +'#hp-callbar .t{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#hp-callbar button{flex:0 0 auto;border:1px solid rgba(255,255,255,.6);background:rgba(0,0,0,.18);color:#fff;border-radius:14px;padding:4px 10px;font-size:13px;font-weight:700}#hp-callbar button.hang{background:#d9534f;border-color:#d9534f}'
 +'#hp-call-mv{position:fixed;right:12px;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:120px;height:160px;object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,.5);background:#000;z-index:8980;display:none;cursor:pointer}body.hp-callmin #hp-call-mv{display:block}';
function hpV337Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-v337-css')) return false; const s=document.createElement('style'); s.id='hp-v337-css'; s.textContent=HP_V337_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpCallMinCan(C){ return !!(C&&(C.st==='talking'||C.st==='connecting'||C.st==='calling')); }
function hpCallMin(on){ try{ const C=HP_CALL; if(on&&!hpCallMinCan(C)) return false; if(C) C.min=!!on; const b=document.body; if(b&&b.classList) b.classList.toggle('hp-callmin',!!on&&!!C);
    if(on) hpLog('通話：画面を縮めて Handpost に戻った'); else if(C&&C.min===false&&arguments.length) {} hpCallUi(); return true; }catch(e){ return false; } }
function hpCallMinBar(){ try{ let bar=document.getElementById('hp-callbar'); if(bar) return bar; bar=document.createElement('div'); bar.id='hp-callbar'; const t=document.createElement('span'); t.className='t'; bar.appendChild(t); bar.__t=t;
    const bk=document.createElement('button'); bk.type='button'; bk.textContent=T('cl_mb_back'); bk.setAttribute('data-i18n','cl_mb_back'); bk.onclick=()=>hpCallMin(false); bar.appendChild(bk);

    (document.body||document.documentElement).appendChild(bar); return bar; }catch(e){ return null; } }
function hpCallMinBtn(d){ try{ if(!d||d.__min) return d&&d.__min; const b=document.createElement('button'); b.type='button'; b.id='hp-call-min'; b.setAttribute('aria-label',T('cl_min')); b.title=T('cl_min'); try{ const c=document.createElement('span'); c.textContent='‹'; b.appendChild(c); if(typeof hpIcEl==='function') b.appendChild(hpIcEl('mail')); else b.appendChild(document.createTextNode(' '+T('cl_min'))); }catch(e){ b.textContent='‹ '+T('cl_min'); }   b.onclick=()=>hpCallMin(true); d.appendChild(b); d.__min=b; return b; }catch(e){ return null; } }
function hpCallMv(d,C,on){ try{ let mv=document.getElementById('hp-call-mv'); if(!on){ if(mv){ try{ mv.srcObject=null; }catch(e){} mv.remove(); } return false; }
    const rv=d&&d.__rv; const src=rv&&rv.srcObject; if(!src) { if(mv){ try{ mv.srcObject=null; }catch(e){} mv.remove(); } return false; }
    if(!mv){ mv=document.createElement('video'); mv.id='hp-call-mv'; mv.muted=true; mv.autoplay=true; mv.setAttribute('playsinline',''); mv.playsInline=true; mv.onclick=()=>hpCallMin(false); (document.body||document.documentElement).appendChild(mv); }
    if(mv.srcObject!==src){ mv.srcObject=src; try{ const p=mv.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} } return true; }catch(e){ return false; } }
function hpV337Sync(){ try{ const C=HP_CALL; const d=document.getElementById('hp-call'); if(!d) return false; hpV337Css(); hpCallMinBtn(d);
    d.classList.toggle('hp-can-min',hpCallMinCan(C)); const on=!!(C&&C.min&&hpCallMinCan(C)); const b=document.body; if(b&&b.classList) b.classList.toggle('hp-callmin',on); if(C&&C.min&&!on) C.min=false;
    if(on){ d.style.display='none'; const bar=hpCallMinBar(); if(bar&&bar.__t) bar.__t.textContent=(C.st==='talking')?TF('cl_mb',{who:nickOf(C.peer),t:hpCallFmt(Date.now()-(C.talkAt||Date.now()))}):TF('cl_mb_wait',{who:nickOf(C.peer)}); hpCallMv(d,C,true); }
    else { hpCallMv(d,C,false); } return on; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f337){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpV337Sync(); }catch(e){} return r; },f,{__f337:1}); } }catch(e){}

function hpLvReady(d){ try{ const v=d&&d.__lv, box=d&&d.__lvbox; return !!(v&&box&&v.videoWidth>0&&v.videoHeight>0&&box.clientWidth>0&&box.clientHeight>0); }catch(e){ return false; } }
try{ if(typeof hpLvFit==='function'&&!hpLvFit.__f349){ const f=hpLvFit; hpLvFit=Object.assign(function(d){ try{ if(d&&d.__lv&&d.__lvbox&&!hpLvReady(d)){ const n=(d.__lvRetry=(Number(d.__lvRetry)||0)+1); if(n<=20&&typeof setTimeout==='function'){ clearTimeout(d.__lvRetryT); d.__lvRetryT=setTimeout(()=>{ try{ hpLvFit(d); }catch(e){} },150); } return; }
      if(d&&d.__lvRetry){ const n=d.__lvRetry; d.__lvRetry=0; try{ hpLog('通話：小窓の自分の映像を後から合わせた（'+n+' 回目・枠 '+d.__lvbox.clientWidth+'×'+d.__lvbox.clientHeight+'・映像 '+d.__lv.videoWidth+'×'+d.__lv.videoHeight+'）'); }catch(e){} }
      try{ const v=d&&d.__lv; if(v&&!v.__f349&&v.addEventListener){ v.__f349=1; v.addEventListener('playing',()=>{ try{ hpLvFit(d); }catch(e){} }); } }catch(e){} }catch(e){}
    return f.apply(this,arguments); },f,{__f349:1}); } }catch(e){}

try{ if(typeof hpConnOnce==='function'&&!hpConnOnce.__f349){ const f=hpConnOnce; hpConnOnce=Object.assign(function(kind){ if(kind==='say'){ try{ const lang=(typeof curLang==='function')?curLang():'ja'; const p=hpVmSay(T('cl_conn_said'),lang); if(p&&p.catch) p.catch(()=>{}); }catch(e){} return 1200; } return f.apply(this,arguments); },f,{__f349:1}); } }catch(e){}

const HP_DND_KEY='p2p_dnd', HP_DND_HOURS=[1,2,4], HP_DND_MAX=200;
const HP_DND_CSS='.lease .hp-dnd{display:inline-block;margin-left:8px;padding:0 7px;border:1px solid var(--amber,#f5b85c);border-radius:9px;background:rgba(245,184,92,.15);color:var(--amber,#f5b85c);font-size:10px;font-weight:700;line-height:1.6;white-space:nowrap;vertical-align:middle;cursor:pointer}'
 +'#p-chat:not(.list-mode)>#hp-dnd{display:none}#hp-dnd{flex:0 0 auto;margin:0 0 8px;padding:8px 12px;border:1px solid var(--amber,#f5b85c);border-radius:10px;background:#1c1706;color:var(--ink,#e6edf6);font-size:13px;line-height:1.6;display:flex;align-items:center;gap:10px}#hp-dnd .t{flex:1 1 auto;min-width:0}#hp-dnd button{flex:0 0 auto}'
 +'#hp-call .dmp textarea{flex:0 0 auto;width:min(92vw,420px);height:88px;min-height:0;box-sizing:border-box;resize:none;border-radius:12px;padding:10px 12px;font-size:1em;background:#1b2740;color:#fff;border:1px solid #3a4a66;font-family:inherit}#hp-call .dmp button.go{background:var(--teal,#35d1b7);color:#0b1220;text-align:center;font-weight:700}';
function hpDndCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-dnd-css')) return false; const s=document.createElement('style'); s.id='hp-dnd-css'; s.textContent=HP_DND_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpDndGet(){ try{ const o=JSON.parse(localStorage.getItem(HP_DND_KEY)||'null'); if(!o||typeof o!=='object') return null; const u=Number(o.until)||0; if(u<=Date.now()){ localStorage.removeItem(HP_DND_KEY); return null; } return {until:u,msg:String(o.msg||'').slice(0,HP_DND_MAX)}; }catch(e){ return null; } }
function hpDndOn(){ return !!hpDndGet(); }
function hpDndText(){ const o=hpDndGet(); const m=o?o.msg:''; return m||T(HP_DM_KEYS[0]); }
function hpDndMsgPref(){ try{ return String(localStorage.getItem(HP_DND_KEY+'_msg')||''); }catch(e){ return ''; } }
function hpDndMsgText(p){ p=(p==null)?hpDndMsgPref():String(p); if(!p) return T(HP_DM_KEYS[0]); if(HP_DM_KEYS.indexOf(p)>=0) return T(p); return p.slice(0,HP_DND_MAX); }
function hpDndSet(hours,msgPref){ try{ if(msgPref!=null){ try{ localStorage.setItem(HP_DND_KEY+'_msg',String(msgPref).slice(0,HP_DND_MAX)); }catch(e){} }
    const h=Number(hours)||0; if(h<=0){ const was=hpDndOn(); localStorage.removeItem(HP_DND_KEY); if(was) hpLog('設定：取り込み中を解除した'); hpDndUi(); return false; }
    const o={until:Date.now()+h*3600e3,msg:hpDndMsgText()}; localStorage.setItem(HP_DND_KEY,JSON.stringify(o)); hpLog('設定：取り込み中にした（'+h+' 時間・一言「'+o.msg+'」）'); hpDndUi(); return true; }catch(e){ return false; } }
function hpDndHm(t){ const d=new Date(Number(t)||Date.now()), p=n=>String(n).padStart(2,'0'); return p(d.getHours())+':'+p(d.getMinutes()); }

function hpDndTake(r,o,locked){ try{ const from=r.from, C={id:o.call,peer:from,dir:'in',at:Date.now(),why:'dnd'}; const text=hpDndText(); try{ hpCallGone(o.call); }catch(e){}
    const send=(locked&&typeof hpCk2Ring==='function')?hpCk2Ring:hpCallSig; try{ Promise.resolve(send(from,{v:1,type:'callend',call:o.call,why:'decline',msg:text},r.fromDev?[r.fromDev]:null)).catch(()=>{}); }catch(e){}
    try{ hpCallSibTell(C); }catch(e){} try{ if(typeof hpCallSibTellBox==='function') hpCallSibTellBox(C); }catch(e){}
    if(locked||!hpCpsReady()){ hpDmPendSet({peer:from,text:text,at:Date.now()}); } else { hpDmSend(from,text); }
    try{ hpChSave(from,{d:'c',t:'',ts:C.at,cl:{r:'dnd'}}); }catch(e){}
    hpLog('通話：取り込み中なので、鳴らさずに一言を返した（'+nickOf(from)+'・「'+text+'」'+(locked?'・ロックを解除する前':'')+'）'); return true; }catch(e){ try{ hpLog('通話：取り込み中の返事を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; } }
function hpDndWant(r,o,locked){ try{ if(!o||o.type!=='call'||o.v!==1||typeof o.call!=='string'||!/^[0-9a-f]{16}$/.test(o.call)||!r||typeof r.from!=='string') return false; if(!hpDndOn()) return false;
    if(typeof HP_CALL!=='undefined'&&HP_CALL&&HP_CALL.st!=='ended') return false; if(typeof HP_CALL_GONE!=='undefined'&&HP_CALL_GONE.has(o.call)) return false;
    if(typeof ID!=='undefined'&&ID&&r.from===ID.address) return false; if(locked){ if(typeof hpCbPerson!=='function'||!hpCbPerson(r.from)) return false; } else if(typeof isContact==='function'&&!isContact(r.from)) return false; if(typeof hpBlocked==='function'&&hpBlocked(r.from)) return false;
    if(typeof o.sdp!=='string') return false; const age=Date.now()-Number(r.sentAt); if(!(Math.abs(age)<=HP_CALL_MAXAGE)) return false; return true; }catch(e){ return false; } }
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f350){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ try{ if(o&&o.type==='callend'&&typeof o.msg==='string'&&HP_CALL&&HP_CALL.dir==='out'&&HP_CALL.id===o.call&&HP_CALL.peer===r.from) HP_CALL.dmMsg=String(o.msg).slice(0,HP_DND_MAX); }catch(e){} try{ if(hpDndWant(r,o,false)){ hpDndTake(r,o,false); return; } }catch(e){} return f.apply(this,arguments); },f,{__f350:1}); } }catch(e){}
try{ if(typeof hpLkOnSig==='function'&&!hpLkOnSig.__f350){ const f=hpLkOnSig; hpLkOnSig=Object.assign(async function(r,o){ try{ if(o&&o.type==='callend'&&typeof o.msg==='string'&&HP_CALL&&HP_CALL.dir==='out'&&HP_CALL.id===o.call&&HP_CALL.peer===r.from) HP_CALL.dmMsg=String(o.msg).slice(0,HP_DND_MAX); }catch(e){} try{ if(hpDndWant(r,o,true)){ hpDndTake(r,o,true); return; } }catch(e){} return f.apply(this,arguments); },f,{__f350:1}); } }catch(e){}

try{ if(typeof hpDmPick==='function'&&!hpDmPick.__f350){ const f=hpDmPick; hpDmPick=Object.assign(function(C,text){ try{ if(C&&C.st==='ringing') C.dmText=String(text||'').slice(0,HP_DND_MAX); }catch(e){} return f.apply(this,arguments); },f,{__f350:1}); } }catch(e){}
try{ if(typeof hpCallBye==='function'&&!hpCallBye.__f350){ const f=hpCallBye; hpCallBye=Object.assign(function(why){ try{ const C=HP_CALL; if(C&&!C.byeSent&&why==='decline'&&C.dmText){ C.byeSent=true; const devs=C.dev?[C.dev]:null; hpCallSig(C.peer,{v:1,type:'callend',call:C.id,why:'decline',msg:C.dmText},devs).catch(()=>{}); return; } }catch(e){} return f.apply(this,arguments); },f,{__f350:1}); } }catch(e){}

try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f350){ const f=hpCallEnd; hpCallEnd=Object.assign(function(why,text){ let C=null, t=''; try{ C=HP_CALL; if(C&&C.st!=='ended'&&C.dir==='out'&&C.dmMsg&&/decline/.test(String(why||''))){ t=TF('cl_dm_got',{who:nickOf(C.peer),msg:C.dmMsg}); text=C.dmMsg;   } }catch(e){} const v=f.call(this,why,text);
    try{ if(t){ hpLog('通話：'+nickOf(C.peer)+' から一言「'+C.dmMsg+'」');   try{ if(typeof hpRingGet==='function'&&hpRingGet('p2p_conn',HP_CONN_KINDS)==='say'&&typeof hpVmSay==='function') hpVmSay(C.dmMsg,(typeof curLang==='function')?curLang():'ja'); }catch(e){} } }catch(e){} return v; },f,{__f350:1}); } }catch(e){}

try{ if(typeof hpDmPanel==='function'&&!hpDmPanel.__f350){ const f=hpDmPanel; hpDmPanel=Object.assign(function(d,on){ const v=f.apply(this,arguments); try{ if(!on||!d||!d.__dmp) return v; hpDndCss(); const p=d.__dmp, x=p.lastChild; const own=document.createElement('button'); own.type='button'; own.textContent=T('cl_dm_own'); own.setAttribute('data-i18n','cl_dm_own');
      const ta=document.createElement('textarea'); ta.maxLength=HP_DND_MAX; ta.style.display='none'; ta.placeholder=T('cl_dm_own_ph'); const go=document.createElement('button'); go.type='button'; go.className='go'; go.textContent=T('btn_dm_send'); go.setAttribute('data-i18n','btn_dm_send'); go.style.display='none';
      own.onclick=()=>{ own.style.display='none'; ta.style.display=''; go.style.display=''; try{ ta.focus(); }catch(e){} }; go.onclick=()=>{ const s=String(ta.value||'').trim().slice(0,HP_DND_MAX); if(!s) return; hpDmPanel(d,false); hpDmPick(HP_CALL,s); };
      p.insertBefore(own,x); p.insertBefore(ta,x); p.insertBefore(go,x); }catch(e){} return v; },f,{__f350:1}); } }catch(e){}

function hpDndRow(c){ try{ if(!c||typeof document==='undefined'||document.getElementById('set-dnd')) return false; hpDndCss();
    const r=document.createElement('div'); r.className='kv'; r.id='set-dnd'; r.style.marginTop='8px'; const b=document.createElement('b'); b.textContent=T('cl_dnd_l'); b.setAttribute('data-i18n','cl_dnd_l'); r.appendChild(b);
    const s=document.createElement('select'); s.style.cssText='background:#1b2740;border:none;border-radius:6px;color:inherit;padding:4px 6px'; for(const v of [0].concat(HP_DND_HOURS)){ const o=document.createElement('option'); o.value=String(v); o.textContent=T('cl_dnd_'+v); o.setAttribute('data-i18n','cl_dnd_'+v); s.appendChild(o); }
    const cur=hpDndGet(); s.value='0'; if(cur){ const o=document.createElement('option'); o.value='on'; o.textContent=TF('cl_dnd_chip',{t:hpDndHm(cur.until)}); s.insertBefore(o,s.firstChild); s.value='on'; }
    s.onchange=()=>{ if(s.value==='on') return; hpDndSet(Number(s.value),null); }; r.appendChild(s); c.appendChild(r); r.__sel=s;
    const r2=document.createElement('div'); r2.className='kv'; r2.id='set-dndmsg'; r2.style.marginTop='8px'; const b2=document.createElement('b'); b2.textContent=T('cl_dnd_msg_l'); b2.setAttribute('data-i18n','cl_dnd_msg_l'); r2.appendChild(b2);
    const m=document.createElement('select'); m.style.cssText='background:#1b2740;border:none;border-radius:6px;color:inherit;padding:4px 6px;max-width:60%'; for(const k of HP_DM_KEYS){ const o=document.createElement('option'); o.value=k; o.textContent=T(k); o.setAttribute('data-i18n',k); m.appendChild(o); } const oo=document.createElement('option'); oo.value='own'; oo.textContent=T('cl_dm_own'); oo.setAttribute('data-i18n','cl_dm_own'); m.appendChild(oo);
    const inp=document.createElement('input'); inp.type='text'; inp.maxLength=HP_DND_MAX; inp.placeholder=T('cl_dm_own_ph'); inp.style.cssText='display:block;width:100%;margin-top:6px;background:#1b2740;border:none;border-radius:6px;color:inherit;padding:6px 8px';
    const pref=hpDndMsgPref(); if(pref&&HP_DM_KEYS.indexOf(pref)<0){ m.value='own'; inp.value=pref; } else { m.value=pref||HP_DM_KEYS[0]; inp.style.display='none'; }
    const save=()=>{ const v=(m.value==='own')?String(inp.value||'').trim().slice(0,HP_DND_MAX):m.value; if(m.value==='own'&&!v) return; try{ localStorage.setItem(HP_DND_KEY+'_msg',v); }catch(e){} const cur2=hpDndGet(); if(cur2){ cur2.msg=hpDndMsgText(); try{ localStorage.setItem(HP_DND_KEY,JSON.stringify(cur2)); }catch(e){} hpDndUi(); } };
    m.onchange=()=>{ inp.style.display=(m.value==='own')?'':'none'; if(m.value==='own'){ try{ inp.focus(); }catch(e){} } save(); }; inp.onchange=save; r2.appendChild(m); r2.appendChild(inp); c.appendChild(r2); return true; }catch(e){ return false; } }
try{ if(typeof hpRingCard==='function'&&!hpRingCard.__f350){ const f=hpRingCard; hpRingCard=Object.assign(function(){ const r=f.apply(this,arguments); try{ const c=document.getElementById('set-call'); if(c) hpDndRow(c); }catch(e){} return r; },f,{__f350:1}); } }catch(e){}

function hpDndChip(){ try{ if(typeof document==='undefined'||!document.getElementById) return 0; const cur=hpDndGet(); let n=0; for(const id of ['lease-rly','lease-peer']){ const el=document.getElementById(id); if(!el||!el.querySelector) continue; let s=el.querySelector('.hp-dnd'); if(!cur){ if(s) s.remove(); continue; } hpDndCss();
      if(!s){ s=document.createElement('span'); s.className='hp-dnd'; s.setAttribute('role','button'); s.onclick=ev=>{ try{ ev.stopPropagation(); ev.preventDefault(); }catch(e){} hpDndAskOff(); }; el.appendChild(s); } else if(s!==el.lastChild) el.appendChild(s);
      const t=TF('cl_dnd_chip',{t:hpDndHm(cur.until)}); if(s.textContent!==t) s.textContent=t; n++; } return n; }catch(e){ return 0; } }
function hpDndAskOff(){ try{ const p=(typeof hpAsk==='function')?hpAsk({text:T('cl_dnd_ask'),ok:T('btn_dnd_off'),cancel:T('vc_cancel')}):Promise.resolve(true); return Promise.resolve(p).then(y=>{ if(y) hpDndSet(0,null); return !!y; }).catch(()=>false); }catch(e){ return Promise.resolve(false); } }
function hpDndBar(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const cur=hpDndGet(); let n=document.getElementById('hp-dnd'); if(!cur){ if(n&&n.parentNode) n.parentNode.removeChild(n); return 'none'; } const pc=document.getElementById('p-chat'); if(!pc) return ''; hpDndCss();
    const txt=TF('cl_dnd_bar',{t:hpDndHm(cur.until),m:cur.msg||hpDndMsgText()}); if(n){ if(n.__t&&n.__t.textContent!==txt) n.__t.textContent=txt; return 'same'; }
    n=document.createElement('div'); n.id='hp-dnd'; const t=document.createElement('div'); t.className='t'; t.textContent=txt; n.appendChild(t); n.__t=t; const b=document.createElement('button'); b.className='b'; b.type='button'; b.textContent=T('btn_dnd_off'); b.setAttribute('data-i18n','btn_dnd_off'); b.onclick=()=>hpDndSet(0,null); n.appendChild(b);
    const sp=document.getElementById('hp-spare'), chg=document.getElementById('hp-chg'), mg=document.getElementById('hp-mg'); const ref=[sp,chg,mg].find(x=>x&&x.parentNode===pc)||null; pc.insertBefore(n,ref?(ref.nextSibling||null):(pc.firstChild||null)); return 'shown'; }catch(e){ return ''; } }
function hpDndUi(){ try{ hpDndChip(); }catch(e){} try{ hpDndBar(); }catch(e){} try{ const r=document.getElementById('set-dnd'); if(r&&r.__sel){ const s=r.__sel, cur=hpDndGet(); const on=Array.from(s.options).find(o=>o.value==='on'); if(cur){ const t=TF('cl_dnd_chip',{t:hpDndHm(cur.until)}); if(on){ on.textContent=t; } else { const o=document.createElement('option'); o.value='on'; o.textContent=t; s.insertBefore(o,s.firstChild); } s.value='on'; } else { if(on) on.remove(); s.value='0'; } } }catch(e){} return hpDndOn(); }
try{ if(typeof hpLeaseLine==='function'&&!hpLeaseLine.__f350){ const f=hpLeaseLine; hpLeaseLine=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpDndChip(); }catch(e){} return r; },f,{__f350:1}); } }catch(e){}
try{ if(typeof setInterval==='function'){ const t=setInterval(()=>{ try{ hpDndUi(); }catch(e){} },30000); try{ if(t&&t.unref) t.unref(); }catch(e){} } }catch(e){}
try{ if(typeof document!=='undefined'&&document&&document.addEventListener){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ try{ setTimeout(hpDndUi,1500); }catch(e){} }); else setTimeout(()=>{ try{ hpDndUi(); }catch(e){} },1500); } }catch(e){}

try{ if(typeof hpChText==='function'&&!hpChText.__f350){ const f=hpChText; hpChText=Object.assign(function(m){ try{ if(m&&m.cl&&m.cl.r==='dnd') return T('ch_dnd'); }catch(e){} return f.apply(this,arguments); },f,{__f350:1}); } }catch(e){}
try{ if(typeof hpChbText==='function'&&!hpChbText.__f350){ const f=hpChbText; hpChbText=Object.assign(function(m){ try{ if(m&&m.cl&&m.cl.r==='dnd') return T('chb_dnd'); }catch(e){} return f.apply(this,arguments); },f,{__f350:1}); } }catch(e){}

var HP_SAY_WAIT_MS=2500;
try{ if(typeof hpConnOnce==='function'&&!hpConnOnce.__f350){ const f=hpConnOnce; hpConnOnce=Object.assign(function(kind){ if(kind==='say'){ try{ const lang=(typeof curLang==='function')?curLang():'ja'; const p=hpVmSay(T('cl_conn_said'),lang);
        const tm=new Promise(r=>setTimeout(()=>{ let st=false; try{ st=!!(typeof HP_VM_U!=='undefined'&&HP_VM_U&&HP_VM_U.__started); }catch(e){} if(!st){ try{ if(typeof HP_VM_U!=='undefined'&&HP_VM_U){ HP_VM_U.__next=1; HP_VM_U.__hold=1; } speechSynthesis.cancel(); }catch(e){} } r(st?'wait':false); },HP_SAY_WAIT_MS));
        Promise.race([p,tm]).then(ok=>{ if(ok) return; try{ hpLog('通話：「つながりました」を読み上げられなかったので、代わりにチャイムを鳴らした'); }catch(e){} try{ f.call(this,'chime'); }catch(e){} }).catch(()=>{}); }catch(e){} return 1200; } return f.apply(this,arguments); },f,{__f350:1}); } }catch(e){}

const HP_DM2_CSS='#hp-call.hp-dm .st{display:inline-block;max-width:min(86vw,440px);margin:6px auto 0;padding:14px 18px;border-radius:18px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);font-size:1.15em;line-height:1.55;opacity:1;text-align:left;white-space:pre-line;overflow-wrap:anywhere}'
 +'#hp-call.hp-dm .st::before{content:attr(data-lbl);display:block;font-size:.72em;letter-spacing:.08em;opacity:.6;margin-bottom:6px;text-align:left}';
function hpDm2Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-dm2-css')) return false; const s=document.createElement('style'); s.id='hp-dm2-css'; s.textContent=HP_DM2_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpDm2Mark(on,lbl){ try{ const d=document.getElementById('hp-call'); if(!d||!d.classList) return false; d.classList.toggle('hp-dm',!!on); const st=d.querySelector?d.querySelector('.st'):null; if(st&&st.setAttribute){ if(on) st.setAttribute('data-lbl',lbl||''); else st.removeAttribute('data-lbl'); } return true; }catch(e){ return false; } }
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f351){ const f=hpCallEnd; hpCallEnd=Object.assign(function(why,text){ let C=null, dm=''; try{ C=HP_CALL; if(C&&C.st!=='ended'&&C.dir==='out'&&C.dmMsg&&/decline/.test(String(why||''))) dm=String(C.dmMsg); }catch(e){}
    if(!dm){ try{ hpDm2Mark(false); }catch(e){} return f.apply(this,arguments); }
    hpDm2Css(); const v=f.call(this,why,dm); try{ hpDm2Mark(true,T('cl_dm_lbl')); }catch(e){}
    try{ setTimeout(()=>{ try{ if(HP_CALL===null&&C&&C.st==='ended'){ HP_CALL=C; hpCallUi(); hpDm2Mark(true,T('cl_dm_lbl')); } }catch(e){} },2300); setTimeout(()=>{ try{ if(HP_CALL===C){ HP_CALL=null; hpCallUi(); } hpDm2Mark(false); }catch(e){} },6500); }catch(e){} return v; },f,{__f351:1}); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f351){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL; if(!C||C.st!=='ended'||!C.dmMsg) hpDm2Mark(false); }catch(e){} return r; },f,{__f351:1}); } }catch(e){}

const HP_DM3_CSS='html body #hp-call.cl3.hp-dm>.st{display:inline-block!important;width:auto!important;max-width:min(86vw,440px)!important;text-align:left!important;font-size:1.15em!important}html body #hp-call.hp-dm>.stp{display:none!important}';
function hpDm3Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-dm3-css')) return false; const s=document.createElement('style'); s.id='hp-dm3-css'; s.textContent=HP_DM3_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpDm3Head(C,d){ try{ if(!C||!d||C.dir!=='out'||C.st!=='ended'||!C.dmMsg) return false; hpDm3Css(); if(d.classList) d.classList.add('hp-dm'); if(d.__wt){ d.__wt.textContent=TF('cl_hd_dm',{who:nickOf(C.peer)}); d.__wt.style.display=''; } if(d.__stp) d.__stp.style.display='none'; const st=d.querySelector?d.querySelector('.st'):null; if(st){ if(st.textContent!==C.dmMsg) st.textContent=C.dmMsg; if(st.setAttribute) st.setAttribute('data-lbl',T('cl_dm_lbl')); } return true; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f352){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(C&&d) hpDm3Head(C,d); }catch(e){} return r; },f,{__f352:1}); } }catch(e){}
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f352){ const f=hpCallEnd; hpCallEnd=Object.assign(function(why,text){ let dm=false; try{ const C=HP_CALL; dm=!!(C&&C.st!=='ended'&&C.dir==='out'&&C.dmMsg&&/decline/.test(String(why||''))); }catch(e){} if(!dm) return f.apply(this,arguments); const keep=HP_CL3_END; HP_CL3_END=6500; try{ return f.apply(this,arguments); } finally{ HP_CL3_END=keep; } },f,{__f352:1}); } }catch(e){}

try{ if(typeof hpCallAutoGo==='function'&&!hpCallAutoGo.__f352){ const f=hpCallAutoGo; hpCallAutoGo=Object.assign(function(C){ try{ if(HP_CALL===C&&C&&C.dir==='in'&&C.st==='ringing'&&!C.__f352told){ C.__f352told=1; hpLog('通話：通知から開いた（鳴っている画面を出す。自動では出ない）'); } }catch(e){} return false; },f,{__f352:1}); } }catch(e){}

function hpIsAndroidUa(){ try{ return /Android/i.test(String(navigator.userAgent||'')); }catch(e){ return false; } }
function hpEndTonePlay(vol){ try{ hpCallBeep(620,0.16,vol,0); hpCallBeep(440,0.22,vol,0.22); return true; }catch(e){ return false; } }
try{ if(typeof hpCallEndTone==='function'&&!hpCallEndTone.__f353){ const f=hpCallEndTone; hpCallEndTone=Object.assign(function(){ try{ if(typeof soundOn==='function'&&soundOn()==='off') return; }catch(e){} const and=hpIsAndroidUa(); const vol=and?0.22:0.07, wait=and?350:0;
    const go=()=>{ try{ const a=(typeof hpRingAc==='function')?hpRingAc():null; const p=(a&&a.state==='suspended'&&a.resume)?a.resume():null; const play=()=>{ hpEndTonePlay(vol); try{ hpLog('通話：切った音を鳴らした（'+(and?'Android・'+wait+' ms 後・':'')+'音量 '+vol+'）'); }catch(e){} }; if(p&&p.then) p.then(play,play); else play(); }catch(e){} };
    if(wait) setTimeout(go,wait); else go(); },f,{__f353:1}); } }catch(e){}

var HP_DNDM_CSS='#hp-dndp{position:fixed;inset:0;z-index:9400;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}#hp-dndp .card{max-width:380px;width:100%;margin:0}#hp-dndp .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#hp-dndp .row button{flex:1 1 auto}#hp-dndp .nt{font-size:13px;color:var(--dim,#8aa0c0);margin-top:8px;line-height:1.6}nav #t-dnd.on{color:var(--amber,#f5b85c)}';
function hpDndMenuCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-dndm-css')) return false; const s=document.createElement('style'); s.id='hp-dndm-css'; s.textContent=HP_DNDM_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpDndMenuLabel(){ try{ const b=document.getElementById('t-dnd'); if(!b) return false; const cur=(typeof hpDndGet==='function')?hpDndGet():null; const t=cur?TF('cl_dnd_chip',{t:hpDndHm(cur.until)}):T('cl_dnd_l'); if(b.textContent!==t) b.textContent=t; if(b.classList) b.classList.toggle('on',!!cur); return !!cur; }catch(e){ return false; } }
function hpDndSheetClose(){ try{ const p=document.getElementById('hp-dndp'); if(p&&p.parentNode) p.parentNode.removeChild(p); }catch(e){} return true; }
function hpDndSheet(){ try{ if(typeof document==='undefined'||typeof hpDndGet!=='function') return false; hpDndMenuCss(); hpDndSheetClose(); const cur=hpDndGet();
    const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
    const box=el('div'); box.id='hp-dndp'; const card=el('div','card'); box.appendChild(card); card.appendChild(el('h2',null,T('cl_dnd_l')));
    const msg=(typeof hpDndMsgText==='function')?hpDndMsgText():'';
    if(cur){ card.appendChild(el('div',null,TF('cl_dnd_bar',{t:hpDndHm(cur.until),m:cur.msg||msg}))); const r=el('div','row'); const off=el('button','b pri',T('btn_dnd_off')); off.type='button'; off.onclick=()=>{ hpDndSet(0,null); hpDndSheetClose(); hpDndMenuLabel(); }; r.appendChild(off); card.appendChild(r); }
    else { card.appendChild(el('div',null,T('cl_dnd_sheet'))); const r=el('div','row'); for(const h of HP_DND_HOURS){ const b=el('button','b pri',T('cl_dnd_'+h)); b.type='button'; b.onclick=()=>{ hpDndSet(h,null); hpDndSheetClose(); hpDndMenuLabel(); try{ hpToast(TF('cl_dnd_chip',{t:hpDndHm(hpDndGet().until)}),3000); }catch(e){} }; r.appendChild(b); } card.appendChild(r); card.appendChild(el('div','nt',TF('cl_dnd_sheet_msg',{m:msg}))); }
    const r2=el('div','row'); const x=el('button','b',T('vc_cancel')); x.type='button'; x.onclick=hpDndSheetClose; r2.appendChild(x); card.appendChild(r2);
    box.onclick=ev=>{ if(ev&&ev.target===box) hpDndSheetClose(); }; (document.body||document.documentElement).appendChild(box); return true; }catch(e){ return false; } }
function hpDndMenuMount(){ try{ if(typeof document==='undefined'||!document.querySelector||document.getElementById('t-dnd')) return 'have'; const nav=document.querySelector('nav'), set=document.getElementById('t-set'); if(!nav||!set) return '';
    const b=document.createElement('button'); b.id='t-dnd'; b.type='button'; b.textContent=T('cl_dnd_l'); b.onclick=()=>{ try{ if(typeof menuClose==='function') menuClose(); }catch(e){} hpDndSheet(); }; nav.insertBefore(b,set.nextSibling); hpDndMenuLabel(); return 'made'; }catch(e){ return ''; } }
try{ if(typeof document!=='undefined'&&document&&document.getElementById){ if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',()=>{ hpDndMenuMount(); }); else hpDndMenuMount(); } }catch(e){}
try{ if(typeof hpDndUi==='function'&&!hpDndUi.__f353){ const f=hpDndUi; hpDndUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpDndMenuLabel(); }catch(e){} return r; },f,{__f353:1}); } }catch(e){}
try{ if(typeof applyLang==='function'&&!applyLang.__f353){ const f=applyLang; applyLang=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpDndMenuLabel(); }catch(e){} return r; },f,{__f353:1}); } }catch(e){}

var HP_CDEV_KEY='p2p_calldev';
var HP_CALLM_CSS='#hp-callp{position:fixed;inset:0;z-index:9400;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}#hp-callp .card{max-width:420px;width:100%;margin:0;max-height:90vh;overflow:auto}#hp-callp h3{font-size:13px;color:var(--dim,#8aa0c0);margin:14px 0 6px;font-weight:600}#hp-callp .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#hp-callp .row button{flex:1 1 auto}#hp-callp .fr{display:flex;align-items:center;gap:8px;margin-top:6px}#hp-callp .fr .nm{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#hp-callp select,#hp-callp input{background:#1b2740;border:none;border-radius:6px;color:inherit;padding:4px 6px;max-width:48%}#hp-callp input{display:block;width:100%;max-width:none;margin-top:6px;padding:6px 8px}#hp-callp .nt{font-size:13px;color:var(--dim,#8aa0c0);margin-top:6px;line-height:1.6}#hp-callp .sm{font-size:12px;color:var(--dim,#8aa0c0)}nav #t-call.on{color:var(--amber,#f5b85c)}#set-dnd,#set-dndmsg{display:none!important}';
function hpCallMenuCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-callm-css')) return false; const s=document.createElement('style'); s.id='hp-callm-css'; s.textContent=HP_CALLM_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpCallDevMap(){ try{ const o=JSON.parse(localStorage.getItem(HP_CDEV_KEY)||'{}'); return (o&&typeof o==='object')?o:{}; }catch(e){ return {}; } }
function hpCallDevGet(peer){ try{ return String(hpCallDevMap()[String(peer||'')]||''); }catch(e){ return ''; } }
function hpCallDevSet(peer,fd){ try{ const o=hpCallDevMap(); fd=(typeof hpFdOf==='function')?hpFdOf(fd):String(fd||'').slice(0,16); if(fd) o[String(peer)]=fd; else delete o[String(peer)]; localStorage.setItem(HP_CDEV_KEY,JSON.stringify(o)); return fd; }catch(e){ return ''; } }
function hpLastDev(peer){ try{ const h=(typeof histLoad==='function')?histLoad(peer):[]; for(let i=h.length-1;i>=0;i--){ const m=h[i]; if(m&&m.d==='p'&&m.fd) return (typeof hpFdOf==='function')?hpFdOf(m.fd):String(m.fd).slice(0,16); } }catch(e){} try{ return (typeof hpUsualDev==='function')?hpUsualDev(peer):''; }catch(e){ return ''; } }
function hpDevKindOfPeer(peer,dev){ try{ const card=(typeof hpCardOf==='function')?hpCardOf(peer):null, k=(card&&card.devKinds&&card.devKinds[dev])||''; return k; }catch(e){ return ''; } }
function hpDevLabelOf(peer,dev){ const fd=(typeof hpFdOf==='function')?hpFdOf(dev):String(dev||'').slice(0,16); const k=hpDevKindOfPeer(peer,dev); const kt=k&&(typeof hpDevKindText==='function')?hpDevKindText(k):''; return (kt?kt+' ':'')+fd.slice(0,8); }

function hpCallDevPick(peer){ try{ const card=(typeof hpCardOf==='function')?hpCardOf(peer):null; const all=(card&&Array.isArray(card.devices))?card.devices:[]; if(all.length<=1) return {devs:null,why:'one',fd:''};
    const fdOf=d=>(typeof hpFdOf==='function')?hpFdOf(d):String(d||'').slice(0,16); const want=hpCallDevGet(peer); let why='picked', fd=want; if(!fd||!all.some(d=>fdOf(d)===fd)){ fd=hpLastDev(peer); why='recent'; } if(!fd) return {devs:null,why:'all',fd:''};
    const hit=all.filter(d=>fdOf(d)===fd); if(!hit.length) return {devs:null,why:'all',fd:fd}; return {devs:hit,why:why,fd:fd}; }catch(e){ return {devs:null,why:'all',fd:''}; } }
try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f356){ const f=hpCallSig; hpCallSig=Object.assign(function(peer,body,devs){ try{ if(body&&body.type==='call'&&!(Array.isArray(devs)&&devs.length)){ const C=HP_CALL; const p=(C&&C.id===body.call&&C.toDevs!==undefined)?{devs:C.toDevs,why:C.toWhy,fd:C.toFd,again:1}:hpCallDevPick(peer); if(C&&C.id===body.call&&C.toDevs===undefined){ C.toDevs=p.devs; C.toWhy=p.why; C.toFd=p.fd; }
        if(p.devs&&p.devs.length){ devs=p.devs.slice(); if(!p.again){ const card=(typeof hpCardOf==='function')?hpCardOf(peer):null, n=(card&&Array.isArray(card.devices))?card.devices.length:0; hpLog('通話：かける端末は '+hpDevLabelOf(peer,p.devs[0])+'（'+(p.why==='picked'?'選んだ端末':'最近の手紙の端末')+'）。ほかの '+Math.max(0,n-p.devs.length)+' 台は鳴らさない'); } }
        else if(!p.again&&p.why==='all') hpLog('通話：どの端末がふだん使われているか分からないので、全部の端末を鳴らす'); } }catch(e){} return f.call(this,peer,body,devs); },f,{__f356:1}); } }catch(e){}
try{ if(typeof hpCallAllRung==='function'&&!hpCallAllRung.__f356){ const f=hpCallAllRung; hpCallAllRung=Object.assign(function(C){ try{ if(C&&Array.isArray(C.toDevs)&&C.toDevs.length){ const R=C.rungDevs||new Set(); return C.toDevs.every(d=>R.has(d)); } }catch(e){} return f.apply(this,arguments); },f,{__f356:1}); } }catch(e){}

function hpCallSheetClose(){ try{ const p=document.getElementById('hp-callp'); if(p&&p.parentNode) p.parentNode.removeChild(p); }catch(e){} return true; }
function hpCallMenuLabel(){ try{ const b=document.getElementById('t-call'); if(!b) return false; const cur=(typeof hpDndGet==='function')?hpDndGet():null; const t=cur?TF('cl_menu_dnd',{t:hpDndHm(cur.until)}):T('cl_menu_l'); if(b.textContent!==t) b.textContent=t; if(b.classList) b.classList.toggle('on',!!cur); return !!cur; }catch(e){ return false; } }
function hpCallSheet(){ try{ if(typeof document==='undefined') return false; hpCallMenuCss(); hpCallSheetClose();
    const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
    const box=el('div'); box.id='hp-callp'; const card=el('div','card'); box.appendChild(card); card.appendChild(el('h2',null,T('cl_menu_l')));

    card.appendChild(el('h3',null,T('cl_cm_friends'))); const fdOf=d=>(typeof hpFdOf==='function')?hpFdOf(d):String(d||'').slice(0,16);
    const list=((typeof contacts==='function')?contacts():[]).filter(c=>c&&c.address&&!(typeof hpBlocked==='function'&&hpBlocked(c.address))); let n=0;
    for(const c of list){ const peer=c.address, cd=(typeof hpCardOf==='function')?hpCardOf(peer):null, devs=(cd&&Array.isArray(cd.devices))?cd.devices:[]; const row=el('div','fr'); row.appendChild(el('span','nm',(typeof nickOf==='function')?nickOf(peer):peer));
      if(devs.length>1){ const s=el('select'); const o0=el('option',null,T('cl_cm_auto')); o0.value=''; s.appendChild(o0); for(const d of devs){ const o=el('option',null,hpDevLabelOf(peer,d)); o.value=fdOf(d); s.appendChild(o); } const cur=hpCallDevGet(peer); s.value=devs.some(d=>fdOf(d)===cur)?cur:''; s.onchange=()=>{ hpCallDevSet(peer,s.value); }; s.title=T('cl_cm_dev'); row.appendChild(s); }
      else row.appendChild(el('span','sm',devs.length?hpDevLabelOf(peer,devs[0]):''));
      const b=el('button','b pri',T('cl_cm_call')); b.type='button'; b.onclick=()=>{ hpCallSheetClose(); try{ if(typeof hpCallStart==='function') hpCallStart(peer).catch(()=>{}); }catch(e){} }; if(!devs.length) b.disabled=true; row.appendChild(b); card.appendChild(row); n++; }
    if(!n) card.appendChild(el('div','nt',T('cl_cm_none')));

    card.appendChild(el('h3',null,T('cl_dnd_l'))); const cur=(typeof hpDndGet==='function')?hpDndGet():null; const msg=(typeof hpDndMsgText==='function')?hpDndMsgText():'';
    if(cur){ card.appendChild(el('div','nt',TF('cl_dnd_bar',{t:hpDndHm(cur.until),m:cur.msg||msg}))); const r=el('div','row'); const off=el('button','b',T('btn_dnd_off')); off.type='button'; off.onclick=()=>{ hpDndSet(0,null); hpCallSheet(); hpCallMenuLabel(); }; r.appendChild(off); card.appendChild(r); }
    else { const r=el('div','row'); for(const h of HP_DND_HOURS){ const b=el('button','b',T('cl_dnd_'+h)); b.type='button'; b.onclick=()=>{ hpDndSet(h,null); hpCallSheet(); hpCallMenuLabel(); try{ hpToast(TF('cl_dnd_chip',{t:hpDndHm(hpDndGet().until)}),3000); }catch(e){} }; r.appendChild(b); } card.appendChild(r); }

    card.appendChild(el('h3',null,T('cl_dnd_msg_l'))); const m=el('select'); m.style.maxWidth='100%'; for(const k of HP_DM_KEYS){ const o=el('option',null,T(k)); o.value=k; m.appendChild(o); } const oo=el('option',null,T('cl_dm_own')); oo.value='own'; m.appendChild(oo);
    const inp=el('input'); inp.type='text'; inp.maxLength=HP_DND_MAX; inp.placeholder=T('cl_dm_own_ph'); const pref=(typeof hpDndMsgPref==='function')?hpDndMsgPref():''; if(pref&&HP_DM_KEYS.indexOf(pref)<0){ m.value='own'; inp.value=pref; } else { m.value=pref||HP_DM_KEYS[0]; inp.style.display='none'; }
    const save=()=>{ const v=(m.value==='own')?String(inp.value||'').trim().slice(0,HP_DND_MAX):m.value; if(m.value==='own'&&!v) return; try{ localStorage.setItem(HP_DND_KEY+'_msg',v); }catch(e){} try{ const c2=hpDndGet(); if(c2){ c2.msg=hpDndMsgText(); localStorage.setItem(HP_DND_KEY,JSON.stringify(c2)); hpDndUi(); } }catch(e){} };
    m.onchange=()=>{ inp.style.display=(m.value==='own')?'':'none'; if(m.value==='own'){ try{ inp.focus(); }catch(e){} } save(); }; inp.onchange=save; card.appendChild(m); card.appendChild(inp);
    const r2=el('div','row'); const x=el('button','b',T('btn_close')); x.type='button'; x.onclick=hpCallSheetClose; r2.appendChild(x); card.appendChild(r2);
    box.onclick=ev=>{ if(ev&&ev.target===box) hpCallSheetClose(); }; (document.body||document.documentElement).appendChild(box); return true; }catch(e){ return false; } }
function hpCallMenuMount(){ try{ if(typeof document==='undefined'||!document.querySelector) return ''; hpCallMenuCss(); try{ const old=document.getElementById('t-dnd'); if(old&&old.parentNode) old.parentNode.removeChild(old); }catch(e){} if(document.getElementById('t-call')) return 'have'; const nav=document.querySelector('nav'), ch=document.getElementById('t-chat'); if(!nav||!ch) return '';
    const b=document.createElement('button'); b.id='t-call'; b.type='button'; b.textContent=T('cl_menu_l'); b.onclick=()=>{ try{ if(typeof menuClose==='function') menuClose(); }catch(e){} hpCallSheet(); }; nav.insertBefore(b,ch.nextSibling); hpCallMenuLabel(); return 'made'; }catch(e){ return ''; } }
try{ if(typeof hpDndMenuMount==='function'&&!hpDndMenuMount.__f356){ const f=hpDndMenuMount; hpDndMenuMount=Object.assign(function(){ return 'have'; },f,{__f356:1}); } }catch(e){}
try{ if(typeof document!=='undefined'&&document&&document.getElementById){ if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',()=>{ hpCallMenuMount(); }); else hpCallMenuMount(); } }catch(e){}
try{ if(typeof hpDndUi==='function'&&!hpDndUi.__f356){ const f=hpDndUi; hpDndUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpCallMenuLabel(); }catch(e){} return r; },f,{__f356:1}); } }catch(e){}
try{ if(typeof applyLang==='function'&&!applyLang.__f356){ const f=applyLang; applyLang=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpCallMenuLabel(); hpCallMenuMount(); }catch(e){} return r; },f,{__f356:1}); } }catch(e){}

var HP_CP_CSS='#p-call{padding-bottom:24px}#p-call .cp-h{display:flex;align-items:center;gap:8px;margin:4px 0 8px}#p-call .cp-h h2{margin:0;flex:1 1 auto}#p-call .cp-h button{flex:0 0 auto}#p-call .cp-row{display:flex;align-items:center;gap:12px;padding:10px 6px;border-bottom:1px solid #1b2740;cursor:pointer;border-radius:10px}#p-call .cp-row:active{background:#141e33}#p-call .cp-row .av{width:52px;height:52px;flex:0 0 52px;border-radius:50%;background:#1b2740;color:var(--teal);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:20px;overflow:hidden}#p-call .cp-row .nm{flex:1 1 auto;min-width:0}#p-call .cp-row .nm b{display:block;font-size:17px}#p-call .cp-row .nm span{display:block;font-size:12px;color:var(--dim,#8aa0c0);margin-top:2px}#p-call .cp-row .hpi{width:22px;height:22px;color:var(--teal);flex:0 0 auto}'
 +'#p-call .cp-hero{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 0 4px}#p-call .cp-hero .av{width:96px;height:96px;flex:0 0 96px;border-radius:50%;background:#1b2740;color:var(--teal);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:36px;overflow:hidden}#p-call .cp-hero .av .avimg{width:100%;height:100%;object-fit:cover;border-radius:50%}#p-call .cp-hero b{font-size:22px;margin-top:4px}#p-call .cp-hero .sm{font-size:13px;color:var(--dim,#8aa0c0)}'
 +'#p-call h3{font-size:13px;color:var(--dim,#8aa0c0);margin:16px 0 6px;font-weight:600}#p-call .cp-dev{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;margin-top:6px;border-radius:12px;background:#141e33;border:2px solid transparent;color:inherit;font:inherit;cursor:pointer}#p-call .cp-dev.on{border-color:var(--teal);background:#15273f}#p-call .cp-dev .hpi{width:24px;height:24px;flex:0 0 auto}#p-call .cp-dev .t{flex:1 1 auto;min-width:0}#p-call .cp-dev .t span{display:block;font-size:12px;color:var(--dim,#8aa0c0)}#p-call .cp-dev .ck{width:22px;text-align:center;color:var(--teal);font-weight:700}'
 +'#p-call .cp-act{display:flex;justify-content:center;gap:28px;margin:22px 0 10px}#p-call .cp-act button{display:flex;flex-direction:column;align-items:center;gap:6px;background:none;border:none;color:inherit;font:inherit;cursor:pointer;padding:0}#p-call .cp-act .ring{width:74px;height:74px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--teal);color:#0b1220}#p-call .cp-act .ring.v{background:#2b3a5a;color:var(--teal)}#p-call .cp-act .ring .hpi{width:34px;height:34px}#p-call .cp-act span.l{font-size:13px}'
 +'#p-call .cp-set{margin-top:18px;padding:12px;border-radius:12px;background:#111a2c}#p-call .cp-set .row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}#p-call .cp-set .row button{flex:1 1 auto}#p-call .cp-set select,#p-call .cp-set input{background:#1b2740;border:none;border-radius:6px;color:inherit;padding:6px 8px;width:100%;box-sizing:border-box;margin-top:6px}#p-call .cp-set .nt{font-size:13px;color:var(--dim,#8aa0c0);margin-top:6px;line-height:1.6}#p-call .nt{font-size:13px;color:var(--dim,#8aa0c0)}';
var HP_CP={peer:''};
function hpCpCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cp-css')) return false; const s=document.createElement('style'); s.id='hp-cp-css'; s.textContent=HP_CP_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
function hpCpEl(tag,cls,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
function hpCpIc(k){ try{ if(typeof hpIcEl==='function') return hpIcEl(k); }catch(e){} return hpCpEl('span','hpi hpi-'+k); }
function hpCpKindIc(k){ return k==='pc'?'desktop':(k==='iphone'||k==='android')?'mobile':'pager'; }
function hpCpAv(c){ const d=hpCpEl('div','av',String((c&&c.nick)||'?').slice(0,1).toUpperCase()); try{ if(c&&c.av&&c.av.id&&!c.avHide&&typeof hpAvImg==='function') hpAvImg(d,c.av.id,c.av.at); }catch(e){} return d; }
function hpCallDevAuto(peer){ try{ const card=(typeof hpCardOf==='function')?hpCardOf(peer):null; const all=(card&&Array.isArray(card.devices))?card.devices:[]; const fdOf=d=>(typeof hpFdOf==='function')?hpFdOf(d):String(d||'').slice(0,16); const fd=hpLastDev(peer); if(!fd) return null; const hit=all.filter(d=>fdOf(d)===fd); return hit.length?hit[0]:null; }catch(e){ return null; } }
function hpCpPlain(lbl){ const t=String(lbl||'').split(' '); if(t.length>1&&!/[A-Za-z0-9\u3040-\u9fff]/.test(t[0])) t.shift(); return t.join(' '); }
function hpCpContacts(){ try{ return ((typeof contacts==='function')?contacts():[]).filter(c=>c&&c.address&&!(typeof hpBlocked==='function'&&hpBlocked(c.address))); }catch(e){ return []; } }
function hpCpSubText(peer,devs){ try{ if(!devs.length) return T('cl_cm_none_dev'); const p=hpCallDevPick(peer); if(p.devs&&p.devs.length) return (p.why==='picked'?'':T('cl_cm_auto')+' → ')+hpDevLabelOf(peer,p.devs[0]); if(devs.length===1) return hpDevLabelOf(peer,devs[0]); return TF('cl_cp_sub',{n:devs.length}); }catch(e){ return ''; } }
function hpCpSettingsInto(card){ try{ const el=hpCpEl; card.appendChild(el('h3',null,T('cl_dnd_l'))); const cur=(typeof hpDndGet==='function')?hpDndGet():null; const msg=(typeof hpDndMsgText==='function')?hpDndMsgText():'';
    if(cur){ card.appendChild(el('div','nt',TF('cl_dnd_bar',{t:hpDndHm(cur.until),m:cur.msg||msg}))); const r=el('div','row'); const off=el('button','b',T('btn_dnd_off')); off.type='button'; off.onclick=()=>{ hpDndSet(0,null); hpCallUiRender(); hpCallMenuLabel(); }; r.appendChild(off); card.appendChild(r); }
    else { const r=el('div','row'); for(const h of HP_DND_HOURS){ const b=el('button','b',T('cl_dnd_'+h)); b.type='button'; b.onclick=()=>{ hpDndSet(h,null); hpCallUiRender(); hpCallMenuLabel(); try{ hpToast(TF('cl_dnd_chip',{t:hpDndHm(hpDndGet().until)}),3000); }catch(e){} }; r.appendChild(b); } card.appendChild(r); }
    card.appendChild(el('h3',null,T('cl_dnd_msg_l'))); const m=el('select'); for(const k of HP_DM_KEYS){ const o=el('option',null,T(k)); o.value=k; m.appendChild(o); } const oo=el('option',null,T('cl_dm_own')); oo.value='own'; m.appendChild(oo);
    const inp=el('input'); inp.type='text'; inp.maxLength=HP_DND_MAX; inp.placeholder=T('cl_dm_own_ph'); const pref=(typeof hpDndMsgPref==='function')?hpDndMsgPref():''; if(pref&&HP_DM_KEYS.indexOf(pref)<0){ m.value='own'; inp.value=pref; } else { m.value=pref||HP_DM_KEYS[0]; inp.style.display='none'; }
    const save=()=>{ const v=(m.value==='own')?String(inp.value||'').trim().slice(0,HP_DND_MAX):m.value; if(m.value==='own'&&!v) return; try{ localStorage.setItem(HP_DND_KEY+'_msg',v); }catch(e){} try{ const c2=hpDndGet(); if(c2){ c2.msg=hpDndMsgText(); localStorage.setItem(HP_DND_KEY,JSON.stringify(c2)); hpDndUi(); } }catch(e){} };
    m.onchange=()=>{ inp.style.display=(m.value==='own')?'':'none'; if(m.value==='own'){ try{ inp.focus(); }catch(e){} } save(); }; inp.onchange=save; card.appendChild(m); card.appendChild(inp); return true; }catch(e){ return false; } }

function hpCallUiList(s){ const el=hpCpEl; const h=el('div','cp-h'); h.appendChild(el('h2',null,T('cl_menu_l'))); s.appendChild(h);
    const list=hpCpContacts(); if(!list.length) s.appendChild(el('div','nt',T('cl_cm_none')));
    for(const c of list){ const peer=c.address, cd=(typeof hpCardOf==='function')?hpCardOf(peer):null, devs=(cd&&Array.isArray(cd.devices))?cd.devices:[]; const row=el('div','cp-row'); row.setAttribute('data-peer',peer); row.appendChild(hpCpAv(c)); const nm=el('div','nm'); nm.appendChild(el('b',null,(typeof nickOf==='function')?nickOf(peer):peer)); nm.appendChild(el('span',null,hpCpSubText(peer,devs))); row.appendChild(nm); row.appendChild(hpCpIc('phone')); row.onclick=()=>{ hpCallUiOne(peer); }; s.appendChild(row); }
    const st=el('div','cp-set'); hpCpSettingsInto(st); s.appendChild(st); return list.length; }

function hpCallUiOne(peer){ HP_CP.peer=String(peer||''); return hpCallUiRender(); }
function hpCallUiPerson(s,peer){ const el=hpCpEl; const c=hpCpContacts().find(x=>x.address===peer); if(!c){ HP_CP.peer=''; return hpCallUiList(s); }
    const h=el('div','cp-h'); const back=el('button','b',T('cl_cp_back')); back.type='button'; back.onclick=()=>{ HP_CP.peer=''; hpCallUiRender(); }; h.appendChild(back); h.appendChild(el('h2',null,'')); s.appendChild(h);
    const hero=el('div','cp-hero'); hero.appendChild(hpCpAv(c)); hero.appendChild(el('b',null,(typeof nickOf==='function')?nickOf(peer):peer)); s.appendChild(hero);
    const cd=(typeof hpCardOf==='function')?hpCardOf(peer):null, devs=(cd&&Array.isArray(cd.devices))?cd.devices:[]; const fdOf=d=>(typeof hpFdOf==='function')?hpFdOf(d):String(d||'').slice(0,16);
    if(!devs.length) hero.appendChild(el('div','sm',T('cl_cm_none_dev')));
    else if(devs.length>1){ s.appendChild(el('h3',null,T('cl_cm_dev'))); const cur=hpCallDevGet(peer), has=devs.some(d=>fdOf(d)===cur);
      const mkRow=(fd,icon,title,sub,on)=>{ const b=el('button','cp-dev'+(on?' on':'')); b.type='button'; b.appendChild(hpCpIc(icon)); const t=el('div','t'); t.appendChild(el('div',null,title)); if(sub) t.appendChild(el('span',null,sub)); b.appendChild(t); b.appendChild(el('span','ck',on?'✓':'')); b.onclick=()=>{ hpCallDevSet(peer,fd); hpCallUiRender(); }; return b; };
      const ad=hpCallDevAuto(peer); s.appendChild(mkRow('','mobile',T('cl_cm_auto'),ad?TF('cl_cp_auto_is',{d:hpDevLabelOf(peer,ad)}):T('cl_cp_pick'),!has));
      for(const d of devs){ const k=hpDevKindOfPeer(peer,d); s.appendChild(mkRow(fdOf(d),hpCpKindIc(k),hpCpPlain(hpDevLabelOf(peer,d)),'',has&&fdOf(d)===cur)); } }
    else hero.appendChild(el('div','sm',hpDevLabelOf(peer,devs[0])));
    const act=el('div','cp-act'); const mkAct=(icon,label,v,fn)=>{ const b=el('button'); b.type='button'; const ring=el('div','ring'+(v?' v':'')); ring.appendChild(hpCpIc(icon)); b.appendChild(ring); b.appendChild(el('span','l',label)); b.disabled=!devs.length; b.onclick=fn; return b; };
    act.appendChild(mkAct('phone',T('cl_cm_call'),false,()=>{ try{ if(typeof hpCallStart==='function') hpCallStart(peer).catch(()=>{}); }catch(e){} }));
    act.appendChild(mkAct('camera',T('btn_vcall'),true,()=>{ try{ if(typeof hpVidCallStart==='function') hpVidCallStart(peer); else if(typeof hpCallStart==='function') hpCallStart(peer).catch(()=>{}); }catch(e){} }));
    s.appendChild(act); return true; }
function hpCallUiRender(){ try{ const s=document.getElementById('p-call'); if(!s) return false; hpCpCss(); while(s.firstChild) s.removeChild(s.firstChild); if(HP_CP.peer) hpCallUiPerson(s,HP_CP.peer); else hpCallUiList(s); return true; }catch(e){ return false; } }
function hpCallOpen(){ try{ const b=document.getElementById('t-call'), s=document.getElementById('p-call'); if(!b||!s) return false;
    document.querySelectorAll('nav button').forEach(x=>x.classList.remove('on')); document.querySelectorAll('main section').forEach(x=>x.classList.remove('on')); b.classList.add('on'); s.classList.add('on'); HP_CP.peer=''; hpCallUiRender();
    try{ if(typeof stopScan==='function') stopScan(); }catch(e){} try{ if(typeof menuClose==='function') menuClose(); }catch(e){} try{ if(typeof homeToggle==='function') homeToggle(true); }catch(e){} try{ if(typeof menuBadge==='function') menuBadge(); }catch(e){} try{ if(typeof window!=='undefined'&&window.scrollTo) window.scrollTo(0,0); }catch(e){} return true; }catch(e){ return false; } }
function hpCallPanelMount(){ try{ if(typeof document==='undefined'||!document.querySelector) return ''; if(document.getElementById('p-call')) return 'have'; const main=document.querySelector('main'); if(!main) return ''; const s=document.createElement('section'); s.id='p-call'; main.appendChild(s); hpCpCss(); return 'made'; }catch(e){ return ''; } }
try{ hpCallSheet=function(){ try{ hpCallSheetClose(); }catch(e){} return hpCallOpen(); }; }catch(e){}
try{ if(typeof document!=='undefined'&&document&&document.getElementById){ if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',()=>{ hpCallPanelMount(); }); else hpCallPanelMount(); } }catch(e){}
try{ if(typeof applyLang==='function'&&!applyLang.__f357){ const f=applyLang; applyLang=Object.assign(function(){ const r=f.apply(this,arguments); try{ const s=document.getElementById('p-call'); if(s&&s.classList&&s.classList.contains('on')) hpCallUiRender(); }catch(e){} return r; },f,{__f357:1}); } }catch(e){}
try{ if(typeof hpDndUi==='function'&&!hpDndUi.__f357){ const f=hpDndUi; hpDndUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const s=document.getElementById('p-call'); if(s&&s.classList&&s.classList.contains('on')&&!HP_CP.peer&&!HP_CP.busy){ HP_CP.busy=1; try{ hpCallUiRender(); } finally{ HP_CP.busy=0; } } }catch(e){} return r; },f,{__f357:1}); } }catch(e){}

var HP_RINGOFF_KEY='p2p_ringoff', HP_RINGOFF_PEERS='p2p_ringoff_peers', HP_CP_OFF_MS=30*60e3, HP_CP_OFF=new Map();
var HP_IC_VIDEO='<rect x="3" y="7" width="13" height="10" rx="2"/><path d="M16 10.5l5-3v9l-5-3z"/>';
function hpCpIcVideo(){ const s=hpCpEl('span','hpi hpi-video'); try{ if(typeof HP_IC==='object'&&HP_IC&&!HP_IC.video) HP_IC.video=HP_IC_VIDEO; }catch(e){} try{ s.setAttribute('aria-hidden','true'); if(typeof hpIcSvg==='function') s.style.setProperty('--m','url("data:image/svg+xml,'+encodeURIComponent(hpIcSvg('video','#000'))+'")'); }catch(e){} return s; }
try{ if(typeof hpCpIc==='function'&&!hpCpIc.__f358){ const f=hpCpIc; hpCpIc=Object.assign(function(k){ if(k==='video') return hpCpIcVideo(); return f.apply(this,arguments); },f,{__f358:1}); } }catch(e){}
try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f358){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ const act=s.querySelector?s.querySelector('.cp-act'):null; const ring=act?act.querySelectorAll('.ring.v'):[]; for(const rg of ring){ const old=rg.querySelector('.hpi'); if(old&&old.className!=='hpi hpi-video'){ rg.replaceChild(hpCpIcVideo(),old); } }
      if(act&&HP_CP.peer===peer){ const el=hpCpEl, who=(typeof nickOf==='function')?nickOf(peer):peer, off=hpRingOffPeerOn(peer); const h=el('h3',null,TF('cl_ringoff_pl',{who:who})); const b=el('button','b'+(off?'':' pri'),off?TF('cl_ringoff_poff',{who:who}):T('cl_ringoff_pon')); b.type='button'; b.id='cp-ringoff-peer'; b.onclick=()=>{ hpRingOffPeerSet(peer,!hpRingOffPeerOn(peer)); hpCallUiRender(); }; s.insertBefore(h,act); s.insertBefore(b,act); } }catch(e){} return r; },f,{__f358:1}); } }catch(e){}

function hpRingOffOn(){ try{ return localStorage.getItem(HP_RINGOFF_KEY)==='1'; }catch(e){ return false; } }
function hpRingOffSet(off){ try{ if(off) localStorage.setItem(HP_RINGOFF_KEY,'1'); else localStorage.removeItem(HP_RINGOFF_KEY); }catch(e){} try{ hpLog('通話：この端末で通話を'+(off?'受けない':'受ける')+'設定にした'); }catch(e){} return !!off; }
function hpRingOffPeers(){ try{ const o=JSON.parse(localStorage.getItem(HP_RINGOFF_PEERS)||'{}'); return (o&&typeof o==='object')?o:{}; }catch(e){ return {}; } }
function hpRingOffPeerOn(peer){ try{ return !!hpRingOffPeers()[String(peer||'')]; }catch(e){ return false; } }
function hpRingOffPeerSet(peer,off){ try{ const o=hpRingOffPeers(); if(off) o[String(peer)]=1; else delete o[String(peer)]; localStorage.setItem(HP_RINGOFF_PEERS,JSON.stringify(o)); }catch(e){} try{ hpLog('通話：この端末で '+nickOf(peer)+' からの通話を'+(off?'受けない':'受ける')+'設定にした'); }catch(e){} return !!off; }
function hpRingOffFor(peer){ return hpRingOffOn()||hpRingOffPeerOn(peer); }
function hpRingOffWant(r,o,locked){ try{ if(!o||o.type!=='call'||o.v!==1||typeof o.call!=='string'||!/^[0-9a-f]{16}$/.test(o.call)||!r||typeof r.from!=='string') return false; if(!hpRingOffFor(r.from)) return false; if(typeof hpDndOn==='function'&&hpDndOn()) return false;
    if(typeof HP_CALL!=='undefined'&&HP_CALL&&HP_CALL.st!=='ended') return false; if(typeof HP_CALL_GONE!=='undefined'&&HP_CALL_GONE.has(o.call)) return false; if(typeof ID!=='undefined'&&ID&&r.from===ID.address) return false;
    if(locked){ if(typeof hpCbPerson!=='function'||!hpCbPerson(r.from)) return false; } else if(typeof isContact==='function'&&!isContact(r.from)) return false; if(typeof hpBlocked==='function'&&hpBlocked(r.from)) return false; if(typeof o.sdp!=='string') return false; return true; }catch(e){ return false; } }
function hpRingOffTake(r,o,locked){ try{ const from=r.from; try{ hpCallGone(o.call); }catch(e){} const send=(locked&&typeof hpCk2Ring==='function')?hpCk2Ring:hpCallSig; try{ Promise.resolve(send(from,{v:1,type:'callend',call:o.call,why:'devoff'},r.fromDev?[r.fromDev]:null)).catch(()=>{}); }catch(e){}
    hpLog('通話：この端末では'+(hpRingOffOn()?'':nickOf(from)+' からの')+'通話を受けない設定なので鳴らさなかった（'+nickOf(from)+'。ほかの端末があれば、そちらへかけ直してもらう）'); return true; }catch(e){ return false; } }

function hpCpOffMark(peer,dev){ try{ const fd=(typeof hpFdOf==='function')?hpFdOf(dev):String(dev||'').slice(0,16); if(!fd) return false; HP_CP_OFF.set(String(peer)+':'+fd,Date.now()+HP_CP_OFF_MS); return true; }catch(e){ return false; } }
function hpCpOffHas(peer,dev){ try{ const fd=(typeof hpFdOf==='function')?hpFdOf(dev):String(dev||'').slice(0,16); const u=HP_CP_OFF.get(String(peer)+':'+fd)||0; if(u&&u>Date.now()) return true; if(u) HP_CP_OFF.delete(String(peer)+':'+fd); return false; }catch(e){ return false; } }
function hpCpDevOffTake(r,o){ try{ const C=HP_CALL; if(!(o&&o.type==='callend'&&o.why==='devoff'&&C&&C.dir==='out'&&C.id===o.call&&C.peer===r.from)) return false; const peer=r.from, dev=r.fromDev||''; if(dev) hpCpOffMark(peer,dev);
    const card=(typeof hpCardOf==='function')?hpCardOf(peer):null, all=(card&&Array.isArray(card.devices))?card.devices:[]; const fdOf=d=>(typeof hpFdOf==='function')?hpFdOf(d):String(d||'').slice(0,16); const tried=new Set((C.toDevs||[]).map(fdOf)); if(dev) tried.add(fdOf(dev)); C.devOffTried=C.devOffTried||new Set(); for(const t of tried) C.devOffTried.add(t);
    const rest=all.filter(d=>!C.devOffTried.has(fdOf(d))&&!hpCpOffHas(peer,d)); const label=dev?hpDevLabelOf(peer,dev):'?';
    if(rest.length&&C.callBody&&C.st==='calling'){ C.toDevs=rest.slice(); C.toWhy='devoff'; C.toFd=fdOf(rest[0]); C.rung=false; hpLog('通話：'+nickOf(peer)+' の '+label+' はいま通話を受けない設定。ほかの '+rest.length+' 台を鳴らす'); try{ Promise.resolve(hpCallSig(peer,C.callBody,rest.slice())).catch(()=>{}); }catch(e){} try{ hpCallUi(); }catch(e){} return true; }
    hpLog('通話：'+nickOf(peer)+' はいま、どの端末でも通話を受けない設定（'+label+'）'); o.why='decline'; o.msg=TF('cl_devoff_all',{who:nickOf(peer)}); return false; }catch(e){ return false; } }
try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f358){ const f=hpCallSig; hpCallSig=Object.assign(function(peer,body,devs){ try{ const C=HP_CALL; if(body&&body.type==='call'&&C&&C.id===body.call&&!C.callBody) C.callBody=body; }catch(e){} return f.apply(this,arguments); },f,{__f358:1}); } }catch(e){}
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f358){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ try{ if(hpCpDevOffTake(r,o)) return; }catch(e){} try{ if(hpRingOffWant(r,o,false)){ hpRingOffTake(r,o,false); return; } }catch(e){} return f.apply(this,arguments); },f,{__f358:1}); } }catch(e){}
try{ if(typeof hpLkOnSig==='function'&&!hpLkOnSig.__f358){ const f=hpLkOnSig; hpLkOnSig=Object.assign(async function(r,o){ try{ if(hpCpDevOffTake(r,o)) return; }catch(e){} try{ if(hpRingOffWant(r,o,true)){ hpRingOffTake(r,o,true); return; } }catch(e){} return f.apply(this,arguments); },f,{__f358:1}); } }catch(e){}
try{ if(typeof hpCallDevPick==='function'&&!hpCallDevPick.__f358){ const f=hpCallDevPick; hpCallDevPick=Object.assign(function(peer){ const p=f.apply(this,arguments); try{ const card=(typeof hpCardOf==='function')?hpCardOf(peer):null, all=(card&&Array.isArray(card.devices))?card.devices:[]; if(all.length<2) return p; const ok=all.filter(d=>!hpCpOffHas(peer,d)); if(ok.length===all.length) return p; if(!ok.length) return p; if(p.devs&&p.devs.length&&!hpCpOffHas(peer,p.devs[0])) return p; return {devs:[ok[0]],why:'off',fd:(typeof hpFdOf==='function')?hpFdOf(ok[0]):''}; }catch(e){ return p; } },f,{__f358:1}); } }catch(e){}

try{ if(typeof hpCpSettingsInto==='function'&&!hpCpSettingsInto.__f358){ const f=hpCpSettingsInto; hpCpSettingsInto=Object.assign(function(card){ try{ const el=hpCpEl; const off=hpRingOffOn(); card.appendChild(el('h3',null,T('cl_ringoff_l'))); const b=el('button','b'+(off?'':' pri'),off?T('cl_ringoff_off'):T('cl_ringoff_on')); b.type='button'; b.id='cp-ringoff'; b.onclick=()=>{ hpRingOffSet(!hpRingOffOn()); hpCallUiRender(); }; card.appendChild(b); }catch(e){} return f.apply(this,arguments); },f,{__f358:1}); } }catch(e){}

var HP_CP2_CSS='#p-call>*{max-width:480px;width:100%;margin-left:auto;margin-right:auto;box-sizing:border-box}#p-call .cp-h{max-width:480px}';
function hpCp2Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cp2-css')) return false; const s=document.createElement('style'); s.id='hp-cp2-css'; s.textContent=HP_CP2_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
try{ if(typeof hpCpCss==='function'&&!hpCpCss.__f359){ const f=hpCpCss; hpCpCss=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpCp2Css(); }catch(e){} return r; },f,{__f359:1}); } }catch(e){}
try{ if(typeof hpDevLabelOf==='function'&&!hpDevLabelOf.__f359){ const f=hpDevLabelOf; hpDevLabelOf=Object.assign(function(){ const s=f.apply(this,arguments); try{ return (typeof hpCpPlain==='function')?hpCpPlain(s):s; }catch(e){ return s; } },f,{__f359:1}); } }catch(e){}

var HP_NODM_CSS='#hp-call .dm{display:none!important}';
function hpNoDmCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-nodm-css')) return false; const s=document.createElement('style'); s.id='hp-nodm-css'; s.textContent=HP_NODM_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
try{ if(false&&typeof hpDmEl==='function'&&!hpDmEl.__f360){   const f=hpDmEl; hpDmEl=Object.assign(function(d){ try{ hpNoDmCss(); if(d&&d.__dm&&d.__dm.style) d.__dm.style.display='none'; }catch(e){} return d; },f,{__f360:1}); } }catch(e){}
try{ if(typeof hpDndTake==='function'&&!hpDndTake.__f360){ const f=hpDndTake; hpDndTake=Object.assign(function(r,o,locked){ try{ const from=r.from, C={id:o.call,peer:from,dir:'in',at:Date.now(),why:'dnd'}; try{ hpCallGone(o.call); }catch(e){}
      const send=(locked&&typeof hpCk2Ring==='function')?hpCk2Ring:hpCallSig; try{ Promise.resolve(send(from,{v:1,type:'callend',call:o.call,why:'decline'},r.fromDev?[r.fromDev]:null)).catch(()=>{}); }catch(e){}
      try{ hpCallSibTell(C); }catch(e){} try{ if(typeof hpCallSibTellBox==='function') hpCallSibTellBox(C); }catch(e){}
      try{ hpChSave(from,{d:'c',t:'',ts:C.at,cl:{r:'dnd'}}); }catch(e){}
      hpLog('通話：取り込み中なので、鳴らさずに出なかった（'+nickOf(from)+(locked?'・ロックを解除する前':'')+'。一言は送らない）'); return true; }catch(e){ try{ hpLog('通話：取り込み中の返事を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; } },f,{__f360:1}); } }catch(e){}
try{ if(typeof hpCpSettingsInto==='function'&&!hpCpSettingsInto.__f360){ const f=hpCpSettingsInto; hpCpSettingsInto=Object.assign(function(card){ const r=f.apply(this,arguments); try{ const ch=card.children; let i=-1; for(let k=0;k<ch.length;k++){ if(ch[k].textContent===T('cl_dnd_msg_l')&&String(ch[k].tagName||ch[k].tag||'').toLowerCase()==='h3'){ i=k; break; } }
      if(i>=0){ const rm=[ch[i]]; for(let k=i+1;k<ch.length;k++){ const tg=String(ch[k].tagName||ch[k].tag||'').toLowerCase(); if(tg==='select'||tg==='input') rm.push(ch[k]); else break; } for(const e of rm) card.removeChild(e); } }catch(e){} return r; },f,{__f360:1}); } }catch(e){}

var HP_CP3_CSS='#p-call .cp-warn{font-size:13px;color:#f5b85c;line-height:1.5;margin-top:4px}#p-call .cp-row .nm .cp-warn{margin-top:2px}#p-call .cp-hero .cp-warn{text-align:center;padding:0 12px}';
function hpCp3Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cp3-css')) return false; const s=document.createElement('style'); s.id='hp-cp3-css'; s.textContent=HP_CP3_CSS; document.head.appendChild(s); return true; }catch(e){ return false; } }
try{ if(typeof hpCpCss==='function'&&!hpCpCss.__f361){ const f=hpCpCss; hpCpCss=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpCp3Css(); }catch(e){} return r; },f,{__f361:1}); } }catch(e){}
try{ hpRingOffFor=function(peer){ return hpRingOffOn(); }; }catch(e){}
function hpCpWarnText(peer){ try{ const s=(typeof hpCsState==='function')?hpCsState(peer):null; if(s!=='road') return ''; const cap=(typeof hpCsCapText==='function')?hpCsCapText(peer,'road'):''; return T('cl_cp_warn')+(cap?' '+cap:''); }catch(e){ return ''; } }
try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f361){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ const ch=s.children?Array.from(s.children):[]; for(const e of ch){ if(e.id==='cp-ringoff-peer'){ const i=ch.indexOf(e); const h=ch[i-1]; if(h&&String(h.tagName||h.tag||'').toLowerCase()==='h3') s.removeChild(h); s.removeChild(e); break; } }
      const w=hpCpWarnText(peer); if(w){ const hero=ch.find(e=>e.className==='cp-hero'); if(hero) hero.appendChild(hpCpEl('div','cp-warn',w)); } }catch(e){} return r; },f,{__f361:1}); } }catch(e){}
try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f361){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ const rows=s.children?Array.from(s.children).filter(e=>e.className==='cp-row'):[]; for(const row of rows){ const peer=row.getAttribute?row.getAttribute('data-peer'):(row.attrs&&row.attrs['data-peer']); const w=peer?hpCpWarnText(peer):''; if(w){ const nm=Array.from(row.children).find(e=>e.className==='nm'); if(nm) nm.appendChild(hpCpEl('div','cp-warn',w)); } } }catch(e){} return r; },f,{__f361:1}); } }catch(e){}

try{ if(typeof hpCpSettingsInto==='function'&&!hpCpSettingsInto.__f362){ const f=hpCpSettingsInto; hpCpSettingsInto=Object.assign(function(card){ const r=f.apply(this,arguments); try{ if(typeof hpRingOffOn==='function'&&hpRingOffOn()){ const ch=Array.from(card.children||[]); let i=-1; for(let k=0;k<ch.length;k++){ if(ch[k].textContent===T('cl_dnd_l')&&String(ch[k].tagName||ch[k].tag||'').toLowerCase()==='h3'){ i=k; break; } }
      if(i>=0){ const rm=[ch[i]]; for(let k=i+1;k<ch.length;k++){ if(String(ch[k].tagName||ch[k].tag||'').toLowerCase()==='h3') break; rm.push(ch[k]); } for(const e of rm) card.removeChild(e); } } }catch(e){} return r; },f,{__f362:1}); } }catch(e){}
try{ if(typeof hpRingOffSet==='function'&&!hpRingOffSet.__f362){ const f=hpRingOffSet; hpRingOffSet=Object.assign(function(off){ const r=f.apply(this,arguments); try{ if(off&&typeof hpDndGet==='function'&&hpDndGet()&&typeof hpDndSet==='function'){ hpDndSet(0,null); try{ hpCallMenuLabel(); }catch(e){} try{ hpLog('通話：この端末で受けないので、取り込み中を解いた'); }catch(e){} } }catch(e){} return r; },f,{__f362:1}); } }catch(e){}

const HP_RS_KEY='p2p_ringset'; let HP_RS_LOCK=0;
function hpRsGet(){ try{ const o=JSON.parse(localStorage.getItem(HP_RS_KEY)||'null'); if(o&&typeof o==='object'&&o.map&&typeof o.map==='object') return {map:o.map,ts:Number(o.ts)||0}; }catch(e){} return {map:{},ts:0}; }
function hpRsSave(o){ try{ localStorage.setItem(HP_RS_KEY,JSON.stringify({map:o.map,ts:o.ts})); }catch(e){} }
function hpRsOn(dev){ try{ const m=hpRsGet().map; return m[dev]!==0; }catch(e){ return true; } }
function hpRsMe(){ try{ return (typeof hpDsMe==='function')?String(hpDsMe()||''):''; }catch(e){ return ''; } }
function hpRsDevs(){ const out=[]; try{ const M=(typeof hpBmModel==='function')?hpBmModel():null; if(M&&Array.isArray(M.devs)&&M.devs.length){ for(const d of M.devs){ const dev=d.me?(d.dev||hpRsMe()):d.dev; if(!dev) continue; const lb=[d.a,d.b].filter(Boolean).join(' · ')||dev.slice(0,10); out.push({dev:dev,me:!!d.me,label:lb}); } } }catch(e){}
  if(!out.length){ try{ const me=hpRsMe(); if(me) out.push({dev:me,me:true,label:(typeof hpDnMine==='function'&&hpDnMine())||(typeof hpDnAuto==='function'&&hpDnAuto())||me.slice(0,10)}); for(const s of ((typeof hpSibs==='function')?hpSibs():[])){ if(s&&s.dev&&s.dev!==me) out.push({dev:s.dev,me:false,label:s.label||((ID&&ID.devLbl2&&ID.devLbl2[s.dev])||s.dev.slice(0,10))}); } }catch(e){} }
  return out; }
function hpRsApply(){ try{ const me=hpRsMe(); if(!me||typeof hpRingOffOn!=='function'||typeof hpRingOffSet!=='function') return false; const off=!hpRsOn(me); if(off===hpRingOffOn()) return false; HP_RS_LOCK++; try{ hpRingOffSet(off); } finally{ HP_RS_LOCK--; } return true; }catch(e){ return false; } }
function hpRsTell(){ try{ const o=hpRsGet(), body={v:1,type:'ringset',map:o.map,ts:o.ts}; let line=0; const open=new Set(); try{ if(typeof SIB!=='undefined'&&typeof sibSend==='function') for(const id of Object.keys(SIB)){ if(SIB[id]&&SIB[id].state==='open'&&sibSend(id,{t:'ringset',map:o.map,ts:o.ts})){ line++; open.add(SIB[id].dev||id); } } }catch(e){}
    let box=[]; try{ if(typeof sibTargets==='function') box=sibTargets().filter(d=>!open.has(d)&&!(typeof SIB!=='undefined'&&SIB[d]&&SIB[d].state==='open')); }catch(e){}
    if(box.length&&typeof hpSibPut==='function'){ try{ if(typeof HP_IOS!=='undefined'&&HP_IOS&&typeof hpWtOwnPut==='function') for(const d of box) hpWtOwnPut(body,d).catch(()=>{}); }catch(e){} try{ Promise.resolve(hpSibPut(body,box,'sig')).catch(()=>{}); }catch(e){} }
    try{ hpLog('通話：受ける端末の設定を自分のほかの端末に知らせた（線 '+line+' 台・郵便受け '+box.length+' 台）'); }catch(e){} return line+box.length; }catch(e){ return 0; } }
function hpRsSet(dev,on){ try{ dev=String(dev||''); if(!dev) return false; const o=hpRsGet(); if(!on){ const ons=hpRsDevs().filter(d=>d.dev!==dev&&(o.map[d.dev]!==0)); if(!ons.length){ try{ hpToast(T('cl_rs_min'),3000); }catch(e){} return false; } }
    o.map[dev]=on?1:0; o.ts=Math.max(Date.now(),(o.ts||0)+1); hpRsSave(o); hpRsApply(); hpRsTell(); return true; }catch(e){ return false; } }
function hpRsIn(o){ try{ if(!o||!o.map||typeof o.map!=='object') return false; const ts=Number(o.ts)||0, cur=hpRsGet(); if(!(ts>cur.ts)) return false; const map={}; for(const k of Object.keys(o.map)){ if(/^ed[0-9a-f]{64}$/.test(k)) map[k]=o.map[k]===0?0:1; } hpRsSave({map:map,ts:ts}); const ch=hpRsApply();
    try{ hpLog('通話：自分のほかの端末から、受ける端末の設定を受け取った'+(ch?'（この端末は'+(hpRsOn(hpRsMe())?'受ける':'受けない')+'）':'')); }catch(e){} try{ if(HP_CP&&document.getElementById('p-call')&&document.getElementById('p-call').classList.contains('on')) hpCallUiRender(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpRingOffSet==='function'&&!hpRingOffSet.__f363){ const f=hpRingOffSet; hpRingOffSet=Object.assign(function(off){ const r=f.apply(this,arguments); try{ if(!HP_RS_LOCK){ const me=hpRsMe(); if(me){ const o=hpRsGet(); if((o.map[me]!==0)===!!off){ o.map[me]=off?0:1; o.ts=Math.max(Date.now(),(o.ts||0)+1); hpRsSave(o); hpRsTell(); } } } }catch(e){} return r; },f,{__f363:1}); } }catch(e){}
try{ if(typeof sibOnMessage==='function'&&!sibOnMessage.__f363){ const f=sibOnMessage; sibOnMessage=Object.assign(function(id,o){ try{ if(o&&o.t==='ringset'){ hpRsIn(o); return; } }catch(e){} return f.apply(this,arguments); },f,{__f363:1}); } }catch(e){}
try{ if(typeof hpSibLetter==='function'&&!hpSibLetter.__f363){ const f=hpSibLetter; hpSibLetter=Object.assign(async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){} if(o&&o.v===1&&o.type==='ringset'){ if(!ID||r.from!==ID.address){ hpLog('自分の機械でない相手からの ringset（捨てた）'); return true; } hpRsIn(o); return true; } return f.apply(this,arguments); },f,{__f363:1}); } }catch(e){}

try{ if(typeof hpCpSettingsInto==='function'&&!hpCpSettingsInto.__f363){ const f=hpCpSettingsInto; hpCpSettingsInto=Object.assign(function(card){ try{ hpRsApply(); }catch(e){} const r=f.apply(this,arguments); try{ const el=hpCpEl; const ch=Array.from(card.children||[]); for(const e of ch){ if((e.id==='cp-ringoff')||(String(e.tagName||e.tag||'').toLowerCase()==='h3'&&e.textContent===T('cl_ringoff_l'))) card.removeChild(e); }
      const first=(card.children||[])[0]||null; const ins=e=>{ if(first&&typeof card.insertBefore==='function') card.insertBefore(e,first); else card.appendChild(e); }; ins(el('h3',null,T('cl_rs_l')));
      for(const d of hpRsDevs()){ const on=hpRsOn(d.dev); const b=el('button','cp-dev cp-rs'+(on?' on':'')); b.type='button'; b.setAttribute('data-dev',d.dev); const t=el('div','t'); t.appendChild(el('div',null,d.label+(d.me?'（'+T('cl_rs_me')+'）':''))); t.appendChild(el('span',null,on?T('cl_rs_on'):T('cl_rs_off'))); b.appendChild(t); b.appendChild(el('span','ck',on?'✓':'')); b.onclick=()=>{ if(hpRsSet(d.dev,!hpRsOn(d.dev))) hpCallUiRender(); }; ins(b); } }catch(e){} return r; },f,{__f363:1}); } }catch(e){}

try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f363){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ for(const e of Array.from(s.children||[])){ const tg=String(e.tagName||e.tag||'').toLowerCase(), cl=String(e.className||''); if((tg==='h3'&&e.textContent===T('cl_cm_dev'))||/(^| )cp-dev( |$)/.test(cl)) s.removeChild(e); }
      const hero=Array.from(s.children||[]).find(e=>e.className==='cp-hero'); if(hero) for(const e of Array.from(hero.children||[])){ if(e.className==='sm'&&e.textContent!==T('cl_cm_none_dev')) hero.removeChild(e); } }catch(e){} return r; },f,{__f363:1}); } }catch(e){}
try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f363){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ for(const row of Array.from(s.children||[])){ if(row.className!=='cp-row') continue; const nm=Array.from(row.children||[]).find(e=>e.className==='nm'); if(!nm) continue; for(const e of Array.from(nm.children||[])){ if(String(e.tagName||e.tag||'').toLowerCase()==='span') nm.removeChild(e); } } }catch(e){} return r; },f,{__f363:1}); } }catch(e){}
hpCallDevPick=function(peer){ return {devs:null,why:'every',fd:''}; };
hpCpDevOffTake=function(r,o){ try{ const C=HP_CALL; if(!(o&&o.type==='callend'&&o.why==='devoff'&&C&&C.dir==='out'&&C.id===o.call&&C.peer===r.from)) return false; const peer=r.from, dev=r.fromDev||''; if(dev) hpCpOffMark(peer,dev);
    const card=(typeof hpCardOf==='function')?hpCardOf(peer):null, all=(card&&Array.isArray(card.devices))?card.devices:[]; const fdOf=d=>(typeof hpFdOf==='function')?hpFdOf(d):String(d||'').slice(0,16); C.devOffTried=C.devOffTried||new Set(); if(dev) C.devOffTried.add(fdOf(dev));
    const rest=all.filter(d=>!C.devOffTried.has(fdOf(d))); const who=(typeof nickOf==='function')?nickOf(peer):peer;
    if(rest.length){ hpLog('通話：'+who+' の端末 1 台はいま通話を受けない設定（残り '+rest.length+' 台を待つ）'); return true; }
    hpLog('通話：'+who+' はいま、どの端末でも通話を受けない設定'); o.why='decline'; o.msg=TF('cl_devoff_all',{who:who}); return false; }catch(e){ return false; } };

try{ if(typeof hpDevMarkInto==='function'&&!hpDevMarkInto.__f363){ hpDevMarkInto=Object.assign(function(){ return false; },{__f363:1}); } }catch(e){}
const HP_RS_CSS='#p-call .cp-rs .t span{color:var(--dim,#8aa0c0)}#p-call .cp-rs:not(.on) .t{opacity:.7}.m .dvm,.m .dvk,.m .hpnewdev{display:none!important}';
try{ if(typeof hpCpCss==='function'&&!hpCpCss.__f363){ const f=hpCpCss; hpCpCss=Object.assign(function(){ const r=f.apply(this,arguments); try{ if(typeof document!=='undefined'&&!document.getElementById('hp-rs-css')){ const st=document.createElement('style'); st.id='hp-rs-css'; st.textContent=HP_RS_CSS; document.head.appendChild(st); } }catch(e){} return r; },f,{__f363:1}); } }catch(e){}
try{ hpRsApply(); setTimeout(()=>{ try{ hpRsApply(); }catch(e){} },6000); }catch(e){}

hpRsTell=function(){ try{ const o=hpRsGet(), body={v:1,type:'ringset',map:o.map,ts:o.ts}; let line=0; const open=new Set(); try{ if(typeof SIB!=='undefined'&&typeof sibSend==='function') for(const id of Object.keys(SIB)){ if(SIB[id]&&SIB[id].state==='open'&&sibSend(id,{t:'ringset',map:o.map,ts:o.ts})){ line++; open.add(SIB[id].dev||id); } } }catch(e){}
    let box=[]; try{ if(typeof sibTargets==='function') box=sibTargets().filter(d=>!open.has(d)); }catch(e){}
    if(box.length&&typeof hpSibPut==='function'){ try{ Promise.resolve(hpSibPut(body,box)).then(n=>{ try{ hpLog('通話：受ける端末の設定を、自分のほかの端末 '+n+' 台に郵便受けで知らせた'); }catch(e){} }).catch(e=>{ try{ hpLog('通話：受ける端末の設定を郵便受けで知らせられない（'+((e&&e.message)||e)+'）'); }catch(x){} }); }catch(e){} }
    try{ if(line) hpLog('通話：受ける端末の設定を、線のつながっている自分の端末 '+line+' 台に知らせた'); }catch(e){} return line+box.length; }catch(e){ return 0; } };
try{ if(typeof sibOnSig==='function'&&!sibOnSig.__f364){ const f=sibOnSig; sibOnSig=Object.assign(async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){ o=null; }
    if(o&&o.v===1&&o.type==='ringset'){ try{ if(r&&ID&&r.from===ID.address&&r.fromDev&&typeof sibIsMine==='function'&&sibIsMine(r.fromDev)) hpRsIn(o); }catch(e){} return; }
    return await f.apply(this,arguments); },f,{__f364:1}); } }catch(e){}
function hpRsMigrate(){ try{ if(localStorage.getItem('hp_rs_mig')) return false; const me=hpRsMe(); if(!me) return false; localStorage.setItem('hp_rs_mig','1'); const o=hpRsGet(); if(o.map[me]!==undefined||!(typeof hpRingOffOn==='function'&&hpRingOffOn())) return false; o.map[me]=0; o.ts=Math.max(Date.now(),(o.ts||0)+1); hpRsSave(o); hpRsTell(); try{ hpLog('通話：この端末の前からの「受けない」を、受ける端末の一覧に引き継いだ'); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpRsDevs==='function'&&!hpRsDevs.__f364){ const f=hpRsDevs; hpRsDevs=Object.assign(function(){ const out=f.apply(this,arguments); try{ const cnt={}; for(const d of out) cnt[d.label]=(cnt[d.label]||0)+1; for(const d of out){ if(cnt[d.label]>1) d.label=d.label+' '+String(d.dev||'').slice(2,10); } }catch(e){} return out; },f,{__f364:1}); } }catch(e){}
try{ if(typeof hpCpSettingsInto==='function'&&!hpCpSettingsInto.__f364){ const f=hpCpSettingsInto; hpCpSettingsInto=Object.assign(function(card){ try{ hpRsMigrate(); }catch(e){} return f.apply(this,arguments); },f,{__f364:1}); } }catch(e){}
try{ setTimeout(()=>{ try{ hpRsMigrate(); }catch(e){} },4000); }catch(e){}
function hpRsPicked(){ try{ const o=hpRsGet(), ds=hpRsDevs(); if(!ds.some(d=>o.map[d.dev]===0)) return ''; const on=ds.filter(d=>o.map[d.dev]!==0); return on.length===1?on[0].dev:(on[0]?on[0].dev:''); }catch(e){ return ''; } }
function hpRsPick(dev){ try{ dev=String(dev||''); if(!dev) return false; const o=hpRsGet(); for(const d of hpRsDevs()) o.map[d.dev]=(d.dev===dev)?1:0; o.map[dev]=1; o.ts=Math.max(Date.now(),(o.ts||0)+1); hpRsSave(o); hpRsApply(); hpRsTell(); try{ hpLog('通話：受ける端末を 1 台に決めた（'+dev.slice(0,10)+'…）'); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpCpSettingsInto==='function'&&!hpCpSettingsInto.__f364b){ const f=hpCpSettingsInto; hpCpSettingsInto=Object.assign(function(card){ const r=f.apply(this,arguments); try{ const el=hpCpEl; const ch=Array.from(card.children||[]); let at=null; for(const e of ch){ if(/(^| )cp-rs( |$)/.test(String(e.className||''))){ if(!at) at=e; card.removeChild(e); } }
      const pk=hpRsPicked(); const rows=[]; for(const d of hpRsDevs()){ const on=pk?d.dev===pk:false; const b=el('button','cp-dev cp-rs'+(on?' on':'')); b.type='button'; b.setAttribute('data-dev',d.dev); const t=el('div','t'); t.appendChild(el('div',null,d.label+(d.me?'（'+T('cl_rs_me')+'）':''))); if(on) t.appendChild(el('span',null,T('cl_rs_on'))); b.appendChild(t); b.appendChild(el('span','ck',on?'✓':'')); b.onclick=()=>{ if(hpRsPick(d.dev)) hpCallUiRender(); }; rows.push(b); }
      if(!pk) rows.unshift(el('div','nt',T('cl_rs_none')));
      const rest=Array.from(card.children||[]); const h=rest.find(e=>String(e.tagName||e.tag||'').toLowerCase()==='h3'&&e.textContent===T('cl_rs_l')); const anchor=h?rest[rest.indexOf(h)+1]||null:null; for(const b of rows){ if(anchor&&typeof card.insertBefore==='function') card.insertBefore(b,anchor); else card.appendChild(b); } }catch(e){} return r; },f,{__f364b:1}); } }catch(e){}

const HP_CP4_CSS='#p-call .cp-kv{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;background:#121b2c;border-radius:12px;margin:8px 0}#p-call .cp-kv .kl{font-size:14px;color:#dfe7f3;flex:0 0 auto;white-space:nowrap}#p-call .cp-kv select{flex:1 1 auto;max-width:58%;min-width:0;background:#1b2740;border:none;border-radius:8px;color:inherit;padding:8px 10px;font-size:14px;text-overflow:ellipsis}';
try{ if(typeof hpCpCss==='function'&&!hpCpCss.__f365){ const f=hpCpCss; hpCpCss=Object.assign(function(){ const r=f.apply(this,arguments); try{ if(typeof document!=='undefined'&&!document.getElementById('hp-cp4-css')){ const st=document.createElement('style'); st.id='hp-cp4-css'; st.textContent=HP_CP4_CSS; document.head.appendChild(st); } }catch(e){} return r; },f,{__f365:1}); } }catch(e){}
function hpCpKv(label,sel){ const el=hpCpEl; const row=el('div','cp-kv'); row.appendChild(el('div','kl',label)); row.appendChild(sel); return row; }
function hpCpDevSelect(){ const el=hpCpEl; const s=el('select'); s.id='cp-rs-sel'; const pk=(typeof hpRsPicked==='function')?hpRsPicked():''; if(!pk){ const o=el('option',null,T('cl_rs_none')); o.value=''; o.selected=true; s.appendChild(o); }
  for(const d of hpRsDevs()){ const o=el('option',null,d.label+(d.me?'（'+T('cl_rs_me')+'）':'')); o.value=d.dev; if(pk&&d.dev===pk) o.selected=true; s.appendChild(o); }
  s.onchange=()=>{ const v=s.value; if(v&&typeof hpRsPick==='function'&&hpRsPick(v)) hpCallUiRender(); }; return s; }
function hpCpDndSelect(){ const el=hpCpEl; const s=el('select'); s.id='cp-dnd-sel'; const cur=(typeof hpDndGet==='function')?hpDndGet():null; const off=el('option',null,T('cl_cp_dnd_off')); off.value='0'; if(!cur) off.selected=true; s.appendChild(off);
  if(cur){ const o=el('option',null,TF('cl_cp_dnd_until',{t:hpDndHm(cur.until)})); o.value='on'; o.selected=true; s.appendChild(o); }
  for(const h of HP_DND_HOURS){ const o=el('option',null,T('cl_dnd_'+h)); o.value=String(h); s.appendChild(o); }
  s.onchange=()=>{ const v=s.value; if(v==='on') return; const h=Number(v)||0; hpDndSet(h,null); try{ hpCallMenuLabel(); }catch(e){} try{ if(h) hpToast(TF('cl_dnd_chip',{t:hpDndHm(hpDndGet().until)}),3000); }catch(e){} hpCallUiRender(); }; return s; }
try{ if(typeof hpCpSettingsInto==='function'&&!hpCpSettingsInto.__f365){ const f=hpCpSettingsInto; hpCpSettingsInto=Object.assign(function(card){ const r=f.apply(this,arguments); try{ for(const e of Array.from(card.children||[])) card.removeChild(e);
      card.appendChild(hpCpKv(T('cl_rs_l'),hpCpDevSelect())); if(!(typeof hpRingOffOn==='function'&&hpRingOffOn())) card.appendChild(hpCpKv(T('cl_cp_dnd_l'),hpCpDndSelect())); }catch(e){} return r; },f,{__f365:1}); } }catch(e){}

let HP_SEG_BUSY=0;
const HP_SEG_CSS='#hdr-actions #btn-home.hp-segb{padding:0!important;overflow:hidden}#hdr-actions #btn-home.hp-segb .sg{display:inline-block;padding:4px 16px;cursor:pointer}#hdr-actions #btn-home.hp-segb .sg.on{background:rgba(53,209,183,.25)}';
function hpSegMount(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const hb=document.getElementById('btn-home'); if(!hb) return ''; if(hb.getAttribute('data-seg')==='1') return 'have';
    hb.__home=hb.innerHTML; hb.innerHTML=''; const mk=(id,label)=>{ const b=document.createElement('span'); b.className='sg'; b.id=id; b.textContent=label; hb.appendChild(b); return b; }; mk('hp-seg-chat',T('tab_chat')); mk('hp-seg-call',T('cl_menu_l')); hb.setAttribute('data-seg','1'); if(hb.classList) hb.classList.add('hp-segb');
    hb.onclick=e=>{ try{ const t=e&&e.target, seg=hb.getAttribute('data-seg')==='1'; if(seg&&t&&t.id==='hp-seg-call'){ try{ if(typeof hpCallMenuMount==='function') hpCallMenuMount(); if(typeof hpCallPanelMount==='function') hpCallPanelMount(); }catch(x){} hpCallOpen(); } else { const tc=document.getElementById('t-chat'); if(tc) tc.click(); if(seg&&typeof showConvList==='function') showConvList(); } }catch(x){} hpSegSync(); };
    if(!document.getElementById('hp-seg-css')){ const st=document.createElement('style'); st.id='hp-seg-css'; st.textContent=HP_SEG_CSS; document.head.appendChild(st); } return 'made'; }catch(e){ return ''; } }
function hpSegUnmount(){ try{ const hb=document.getElementById('btn-home'); if(!hb||hb.getAttribute('data-seg')!=='1') return false; hb.innerHTML=hb.__home||('\u2039 <span data-i18n="tab_chat">'+T('tab_chat')+'</span>'); hb.setAttribute('data-seg','0'); if(hb.classList) hb.classList.remove('hp-segb'); return true; }catch(e){ return false; } }
function hpSegSync(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const pc=document.getElementById('p-call'), ch=document.getElementById('p-chat'), hb=document.getElementById('btn-home'); if(!hb) return false; const call=!!(pc&&pc.classList&&pc.classList.contains('on')); const chat=!!(ch&&ch.classList&&ch.classList.contains('on')&&ch.classList.contains('list-mode')); const show=call||chat;
    if(show){ hpSegMount(); if(hb.style) hb.style.display='inline-block'; try{ if(!HP_SEG_BUSY){ HP_SEG_BUSY=1; try{ if(typeof hpV334Mark==='function') hpV334Mark(true); if(typeof hpCsFit==='function') hpCsFit(); }finally{ HP_SEG_BUSY=0; } } }catch(e){} const bc=document.getElementById('hp-seg-chat'), bl=document.getElementById('hp-seg-call'); if(bc&&bc.classList) bc.classList.toggle('on',chat&&!call); if(bl&&bl.classList) bl.classList.toggle('on',call); }
    else { const was=hpSegUnmount(); if(was&&ch&&ch.classList&&ch.classList.contains('on')){ if(hb.style) hb.style.display='none'; try{ if(!HP_SEG_BUSY){ HP_SEG_BUSY=1; try{ if(typeof hpV334Mark==='function') hpV334Mark(false); if(typeof hpCsFit==='function') hpCsFit(); }finally{ HP_SEG_BUSY=0; } } }catch(e){} } } return show; }catch(e){ return false; } }
try{ if(typeof homeToggle==='function'&&!homeToggle.__f366){ const f=homeToggle; homeToggle=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpSegSync(); }catch(e){} return r; },f,{__f366:1}); } }catch(e){}
try{ if(typeof hpCallOpen==='function'&&!hpCallOpen.__f366){ const f=hpCallOpen; hpCallOpen=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpSegSync(); }catch(e){} return r; },f,{__f366:1}); } }catch(e){}
try{ if(typeof showConvList==='function'&&!showConvList.__f366){ const f=showConvList; showConvList=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpSegSync(); }catch(e){} return r; },f,{__f366:1}); } }catch(e){}
try{ setTimeout(()=>{ try{ hpSegSync(); }catch(e){} },1500); setInterval(()=>{ try{ hpSegSync(); }catch(e){} },1500); }catch(e){}
try{ if(typeof applyLang==='function'&&!applyLang.__f366){ const f=applyLang; applyLang=Object.assign(function(){ const r=f.apply(this,arguments); try{ const bc=document.getElementById('hp-seg-chat'), bl=document.getElementById('hp-seg-call'); if(bc) bc.textContent=T('tab_chat'); if(bl) bl.textContent=T('cl_menu_l'); const hb=document.getElementById('btn-home'); if(hb&&hb.getAttribute('data-seg')!=='1') hb.__home=null; }catch(e){} return r; },f,{__f366:1}); } }catch(e){}

function hpCpBellOff(){ try{ return typeof hpBlOff==='function'&&!!hpBlOff(); }catch(e){ return false; } }
function hpCallSilent(peer){ try{ if(hpCpBellOff()) return 'bell'; if(peer&&typeof hpMuOn==='function'&&hpMuOn(peer)) return 'mute'; }catch(e){} return ''; }
try{ if(typeof hpCallRing==='function'&&!hpCallRing.__f366){ const f=hpCallRing; hpCallRing=Object.assign(function(on){ try{ if(on){ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; const why=(C&&C.dir==='in')?hpCallSilent(C.peer):''; if(why){ const r=f.call(this,false); try{ hpLog('通話：'+(why==='bell'?'この端末はベルがオフ':'ミュートした友達')+'なので、音を出さず画面だけ'); }catch(e){} return r; } } }catch(e){} return f.apply(this,arguments); },f,{__f366:1}); } }catch(e){}
try{ if(typeof hpCpSettingsInto==='function'&&!hpCpSettingsInto.__f366){ const f=hpCpSettingsInto; hpCpSettingsInto=Object.assign(function(card){ const r=f.apply(this,arguments); try{ if(hpCpBellOff()){ const el=hpCpEl; for(const e of Array.from(card.children||[])){ if(e.className==='cp-kv'&&e.children&&e.children[0]&&e.children[0].textContent===T('cl_cp_dnd_l')) card.removeChild(e); } card.appendChild(el('div','nt',T('cl_cp_bell_off'))); } }catch(e){} return r; },f,{__f366:1}); } }catch(e){}

let HP_SEG_CLICK=null;
function hpSegClick(e){ try{ const hb=document.getElementById('btn-home'); const t=e&&e.target, seg=!!(hb&&hb.getAttribute('data-seg')==='1')||!!(t&&t.closest&&t.closest('#hp-segbar')); if(seg&&t&&/call$/.test(String(t.id||''))){ try{ if(typeof hpCallMenuMount==='function') hpCallMenuMount(); if(typeof hpCallPanelMount==='function') hpCallPanelMount(); }catch(x){} hpCallOpen(); } else { const tc=document.getElementById('t-chat'); if(tc) tc.click(); if(seg&&typeof showConvList==='function') showConvList(); } }catch(x){} try{ hpSegSync(); }catch(x){} }
HP_SEG_CLICK=hpSegClick;
const HP_SEG2_CSS='#hp-segbar{display:none;justify-content:flex-end;padding:8px 12px 0}#hp-segbar>div{display:inline-flex;overflow:hidden;background:rgba(53,209,183,.12);border:1px solid var(--teal,#35d1b7);border-radius:18px;color:var(--teal,#35d1b7);font-size:15px;font-weight:700}#hp-segbar .sg{display:inline-block;padding:4px 16px;cursor:pointer}#hp-segbar .sg.on{background:rgba(53,209,183,.25)}@media (max-width:600px){html body.hp-seg #hp-segbar{display:flex}html body.hp-seg #hdr-actions #btn-home{display:none!important}}';
function hpSegBar(){ try{ if(typeof document==='undefined'||!document.getElementById) return null; let bar=document.getElementById('hp-segbar'); if(bar) return bar; const path=document.getElementById('path'); if(!path||!path.parentNode) return null; bar=document.createElement('div'); bar.id='hp-segbar'; const box=document.createElement('div'); const mk=(id,label)=>{ const s=document.createElement('span'); s.className='sg'; s.id=id; s.textContent=label; box.appendChild(s); }; mk('hp-seg2-chat',T('tab_chat')); mk('hp-seg2-call',T('cl_menu_l')); bar.appendChild(box); bar.onclick=HP_SEG_CLICK; path.parentNode.insertBefore(bar,path.nextSibling);
    if(!document.getElementById('hp-seg2-css')){ const st=document.createElement('style'); st.id='hp-seg2-css'; st.textContent=HP_SEG2_CSS; document.head.appendChild(st); } return bar; }catch(e){ return null; } }
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f367){ const f=hpSegSync; hpSegSync=Object.assign(function(){ const show=f.apply(this,arguments); try{ const hb=document.getElementById('btn-home'); if(hb&&show&&hb.onclick!==HP_SEG_CLICK) hb.onclick=HP_SEG_CLICK;
      const b=document.body; if(b&&b.classList) b.classList.toggle('hp-seg',!!show);
      if(show){ const bar=hpSegBar(); if(bar){ const pc=document.getElementById('p-call'); const call=!!(pc&&pc.classList&&pc.classList.contains('on')); const bc=document.getElementById('hp-seg2-chat'), bl=document.getElementById('hp-seg2-call'); if(bc&&bc.classList) bc.classList.toggle('on',!call); if(bl&&bl.classList) bl.classList.toggle('on',call); } } }catch(e){} return show; },f,{__f367:1}); } }catch(e){}
try{ if(typeof applyLang==='function'&&!applyLang.__f367){ const f=applyLang; applyLang=Object.assign(function(){ const r=f.apply(this,arguments); try{ const bc=document.getElementById('hp-seg2-chat'), bl=document.getElementById('hp-seg2-call'); if(bc) bc.textContent=T('tab_chat'); if(bl) bl.textContent=T('cl_menu_l'); }catch(e){} return r; },f,{__f367:1}); } }catch(e){}
try{ hpSegSync(); }catch(e){}

try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f368){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ for(const e of Array.from(s.children||[])){ if(e.className==='cp-h'){ s.removeChild(e); break; } } }catch(e){} return r; },f,{__f368:1}); } }catch(e){}

try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f369){ const f=hpCallEnd; hpCallEnd=Object.assign(function(why,text){ try{ const C=HP_CALL; if(C&&C.dir==='out'&&C.st==='calling'&&/^peer:/.test(String(why||''))&&!C.overSent){ C.overSent=1; hpLog('通話：呼び出し中に終わったので、相手の残りの端末にも知らせる（over）'); Promise.resolve(hpCallSig(C.peer,{v:1,type:'callend',call:C.id,why:'over'},null)).catch(()=>{}); } }catch(e){} return f.apply(this,arguments); },f,{__f369:1}); } }catch(e){}

try{ if(typeof hpSegUnmount==='function'&&!hpSegUnmount.__f370){ const f=hpSegUnmount; hpSegUnmount=Object.assign(function(){ const r=f.apply(this,arguments); try{ if(r){ const hb=document.getElementById('btn-home'); if(hb) hb.innerHTML='‹ <span data-i18n="tab_chat">'+T('tab_chat')+'</span>'; } }catch(e){} return r; },f,{__f370:1}); } }catch(e){}
const HP_HOMEB_CSS='#hp-homebar{display:none;justify-content:flex-end;padding:8px 12px 0}#hp-homebar>div{display:inline-flex;overflow:hidden;background:rgba(53,209,183,.12);border:1px solid var(--teal,#35d1b7);border-radius:18px;color:var(--teal,#35d1b7);font-size:15px;font-weight:700}#hp-homebar .sg{display:inline-block;padding:4px 16px;cursor:pointer}@media (max-width:600px){html body.hp-homeb #hp-homebar{display:flex}html body.hp-homeb #hdr-actions #btn-home{display:none!important}}';
function hpHomeBar(){ try{ if(typeof document==='undefined'||!document.getElementById) return null; let bar=document.getElementById('hp-homebar'); if(bar) return bar; const path=document.getElementById('path'); if(!path||!path.parentNode) return null; bar=document.createElement('div'); bar.id='hp-homebar'; const box=document.createElement('div'); const s=document.createElement('span'); s.className='sg'; s.id='hp-home2'; s.textContent='‹ '+T('tab_chat'); box.appendChild(s); bar.appendChild(box); bar.onclick=()=>{ try{ const hb=document.getElementById('btn-home'); if(hb&&typeof hb.click==='function') hb.click(); }catch(e){} }; const seg=document.getElementById('hp-segbar'); const ref=seg||path; ref.parentNode.insertBefore(bar,ref.nextSibling);
    if(!document.getElementById('hp-homeb-css')){ const st=document.createElement('style'); st.id='hp-homeb-css'; st.textContent=HP_HOMEB_CSS; document.head.appendChild(st); } return bar; }catch(e){ return null; } }
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f370){ const f=hpSegSync; hpSegSync=Object.assign(function(){ const r=f.apply(this,arguments); try{ const hb=document.getElementById('btn-home'); const vis=!r&&!!hb&&hb.getAttribute('data-seg')!=='1'&&!!(hb.style)&&hb.style.display!=='none'; if(vis) hpHomeBar(); if(document.body&&document.body.classList) document.body.classList.toggle('hp-homeb',vis); }catch(e){} return r; },f,{__f370:1}); } }catch(e){}
try{ if(typeof applyLang==='function'&&!applyLang.__f370){ const f=applyLang; applyLang=Object.assign(function(){ const r=f.apply(this,arguments); try{ const s=document.getElementById('hp-home2'); if(s) s.textContent='‹ '+T('tab_chat'); }catch(e){} return r; },f,{__f370:1}); } }catch(e){}

try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f370){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ const st=Array.from(s.children||[]).find(e=>e&&e.className==='cp-set'); if(st&&s.firstChild&&s.firstChild!==st){ s.removeChild(st); s.insertBefore(st,s.firstChild); } }catch(e){} return r; },f,{__f370:1}); } }catch(e){}

const HP_SEGABS_CSS='@media (max-width:600px){html body.hp-seg .lease .hp-role,html body.hp-homeb .lease .hp-role{display:table;margin:4px 0 0}header{position:relative}#hp-segbar.hp-abs,#hp-homebar.hp-abs{position:absolute;right:12px;padding:0;margin:0;z-index:3}#hp-segbar.hp-abs .sg,#hp-homebar.hp-abs .sg{padding:2px 12px;font-size:14px}}';
function hpSegPlace(bar){ try{ if(!bar||!bar.classList) return false; const narrow=!!(window.matchMedia&&window.matchMedia('(max-width:600px)').matches); const chip=document.querySelector('#lease-rly .hp-role'); const cr=(narrow&&chip&&chip.getBoundingClientRect)?chip.getBoundingClientRect():null;
    if(!cr||!(cr.width>0&&cr.height>0)){ bar.classList.remove('hp-abs'); bar.style.top=''; return false; } bar.classList.add('hp-abs'); const op=bar.offsetParent||document.body; const pr=op.getBoundingClientRect(); const h=bar.offsetHeight||0; bar.style.top=Math.round(cr.top-pr.top+cr.height/2-h/2)+'px'; return true; }catch(e){ return false; } }
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f370b){ const f=hpSegSync; hpSegSync=Object.assign(function(){ const r=f.apply(this,arguments); try{ if(!document.getElementById('hp-segabs-css')){ const st=document.createElement('style'); st.id='hp-segabs-css'; st.textContent=HP_SEGABS_CSS; document.head.appendChild(st); } hpSegPlace(document.getElementById('hp-segbar')); hpSegPlace(document.getElementById('hp-homebar')); }catch(e){} return r; },f,{__f370b:1}); } }catch(e){}

let HP_SEG_NOHOME=false;
function hpF371Wrap(){ let n=0; try{ if(typeof hpV334Mark==='function'&&!hpV334Mark.__f371){ const f=hpV334Mark; hpV334Mark=Object.assign(function(show){ if(HP_SEG_NOHOME) show=false; return f.call(this,show); },f,{__f371:1}); n++; } }catch(e){}
  try{ if(typeof hpVerFoot==='function'&&!hpVerFoot.__f371){ const f=hpVerFoot; hpVerFoot=Object.assign(function(){ const t=f.apply(this,arguments); try{ const el=document.getElementById('hp-verfoot'); const role=hpRoleWord(); if(el&&t&&role){ const w=role+' \u00b7 '+t; if(el.textContent!==w) el.textContent=w; } }catch(e){} return t; },f,{__f371:1}); n++; try{ hpVerFoot(); }catch(e){} } }catch(e){} return n; }
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f371){ const f=hpSegSync; hpSegSync=Object.assign(function(){ try{ hpF371Wrap(); }catch(e){} let chatOnly=false; try{ const pc=document.getElementById('p-call'), ch=document.getElementById('p-chat'); const call=!!(pc&&pc.classList&&pc.classList.contains('on')); chatOnly=!call&&!!(ch&&ch.classList&&ch.classList.contains('on')&&ch.classList.contains('list-mode')); }catch(e){} HP_SEG_NOHOME=chatOnly; const r=f.apply(this,arguments);
    try{ if(chatOnly&&document.body&&document.body.classList&&document.body.classList.contains('hp-home')){ hpV334Mark(false); if(typeof hpCsFit==='function') hpCsFit(); } }catch(e){} return r; },f,{__f371:1}); } }catch(e){}

const HP_ROLE2_CSS='.lease .hp-role{display:none!important}';
try{ if(typeof document!=='undefined'&&document.head&&!document.getElementById('hp-role2-css')){ const st=document.createElement('style'); st.id='hp-role2-css'; st.textContent=HP_ROLE2_CSS; document.head.appendChild(st); } }catch(e){}
function hpRoleWord(){ try{ if(typeof ID==='undefined'||!ID||typeof hpIsMain!=='function') return ''; const main=!!hpIsMain(); if(!main&&!(typeof hpIsChild==='function'&&hpIsChild())) return ''; return T(main?'role_tag_main':'role_tag_other'); }catch(e){ return ''; } }
try{ hpF371Wrap(); setTimeout(hpF371Wrap,0); setTimeout(hpF371Wrap,2000); }catch(e){}
hpSegPlace=function(bar){ try{ if(!bar||!bar.classList) return false; const narrow=!!(window.matchMedia&&window.matchMedia('(max-width:600px)').matches); const vis=el=>{ if(!narrow||!el||!el.getBoundingClientRect) return null; const r=el.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; };
    const cr=vis(document.querySelector('#lease-rly .hp-role'))||vis(document.getElementById('lease-bar-rly'));
    if(!cr){ bar.classList.remove('hp-abs'); bar.style.top=''; return false; } bar.classList.add('hp-abs'); const op=bar.offsetParent||document.body; const pr=op.getBoundingClientRect(); const h=bar.offsetHeight||0; bar.style.top=Math.round(cr.top-pr.top+cr.height/2-h/2)+'px'; return true; }catch(e){ return false; } };

try{ if(typeof hpSceneCap==='function'&&!hpSceneCap.__f371){ const f=hpSceneCap; hpSceneCap=Object.assign(function(){ const r=f.apply(this,arguments); try{ const c=document.getElementById('cap-rly'); if(c&&c.style){ const k=(typeof hpSceneKey==='function')?hpSceneKey():''; const hide=(k==='nd_post_ok'||k==='nd_relay'); if((c.style.display==='none')!==hide) c.style.display=hide?'none':''; } }catch(e){} return r; },f,{__f371:1}); } }catch(e){}
try{ setTimeout(()=>{ try{ if(typeof hpSceneCap==='function') hpSceneCap(); }catch(e){} },1200); }catch(e){}

try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f371){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ for(const row of Array.from(s.children||[])){ if(!row||row.className!=='cp-row') continue; const ks=Array.from(row.children||[]); for(const e of ks){ if(e&&e.className!=='nm'&&ks.indexOf(e)>0) row.removeChild(e); } } }catch(e){} return r; },f,{__f371:1}); } }catch(e){}

try{ if(typeof hpLeaseLeft==='function'&&!hpLeaseLeft.__f371){ const f=hpLeaseLeft; hpLeaseLeft=Object.assign(function(){ try{ const x=hpLeaseExp(); if(x){ const left=x-Date.now(); if(left>=864e5) return TF('lease_left_d',{n:Math.floor(left/864e5)}); if(left>=3600e3) return TF('lease_left_hm',{h:Math.floor(left/3600e3),m:Math.floor((left%3600e3)/60e3)}); } }catch(e){} return f.apply(this,arguments); },f,{__f371:1}); } }catch(e){}

try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f371){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ const act=s.querySelector?s.querySelector('.cp-act'):null; if(act){ const bs=Array.from(act.querySelectorAll?act.querySelectorAll('button'):[]); bs.forEach((b,i)=>{ const ring=b.querySelector?b.querySelector('.ring'):null; if(ring&&ring.classList) ring.classList.remove('v'); const l=b.querySelector?b.querySelector('.l'):null; if(l&&i===0) l.textContent=T('cl_cp_voice'); if(l&&i===1) l.textContent=T('btn_vcall'); });
      if(typeof hpCpKv==='function'&&typeof hpCpDevSelect==='function'&&!s.querySelector('#cp-rs-sel')){ const card=hpCpEl('div','cp-set'); card.appendChild(hpCpKv(T('cl_rs_l'),hpCpDevSelect())); if(act.parentNode===s) s.insertBefore(card,act.nextSibling); else s.appendChild(card); } } }catch(e){} return r; },f,{__f371:1}); } }catch(e){}

try{ if(typeof hpCpSettingsInto==='function'&&!hpCpSettingsInto.__f371){ const f=hpCpSettingsInto; hpCpSettingsInto=Object.assign(function(card){ const r=f.apply(this,arguments); try{ for(const kv of Array.from(card.children||[])){ if(!kv||kv.className!=='cp-kv') continue; const has=(kv.querySelector&&kv.querySelector('#cp-dnd-sel'))||Array.from(kv.children||[]).some(e=>e&&e.id==='cp-dnd-sel'); if(has) card.removeChild(kv); } }catch(e){} return r; },f,{__f371:1}); } }catch(e){}

const HP_SEG3_CSS='@media (max-width:600px){html body #hp-segbar.hp-abs .sg,html body #hp-homebar.hp-abs .sg{padding:4px 16px;font-size:15px}}html body:not(.nobot) #path .scn>svg{order:0}';
try{ if(typeof document!=='undefined'&&document.head&&!document.getElementById('hp-seg3-css')){ const st=document.createElement('style'); st.id='hp-seg3-css'; st.textContent=HP_SEG3_CSS; document.head.appendChild(st); } }catch(e){}

const HP_CD_CSS='#p-call>*{max-width:none!important}#p-call .cp-row{gap:10px;padding:10px 6px;border-radius:0}#p-call .cp-row .av{width:40px;height:40px;flex:0 0 40px;font-size:16px}#p-call .cp-row .nm b{font-size:15px}'
 +'#p-call .cp-act button.off .ring{opacity:.35}#p-call .cp-act button.off{cursor:not-allowed}#p-call .cp-cd{margin:6px 12px 0;font-size:13px;color:var(--dim,#8aa0c0);text-align:center}#p-call details.cp-why{margin:10px 12px 0;font-size:13px;color:var(--dim,#8aa0c0);border:1px solid #1b2740;border-radius:10px;padding:8px 12px}#p-call details.cp-why summary{cursor:pointer;color:var(--teal)}#p-call details.cp-why p{margin:8px 0 0;line-height:1.6}'
 +'#p-call .cp-ch{margin:14px 6px 0}#p-call .cp-ch h3{margin:0 0 6px;font-size:13px;color:var(--dim,#8aa0c0);font-weight:600}#p-call .cp-ch .r{display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid #1b2740;font-size:13px}#p-call .cp-ch .r .ar{width:18px;text-align:center;color:var(--teal)}#p-call .cp-ch .r.miss .ar{color:#ff6b6b}#p-call .cp-ch .r .w{flex:0 0 auto;color:var(--dim,#8aa0c0);min-width:92px}#p-call .cp-ch .r .t{flex:1 1 auto}#p-call .cp-ch .nt{font-size:13px;color:var(--dim,#8aa0c0)}'
 +'#p-call .cp-set .nt2{font-size:12px;color:var(--dim,#8aa0c0);margin:6px 12px 0;line-height:1.5}'
 +'.contact-item .ct-cd{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;margin-top:4px;font-size:12px;color:var(--dim,#8aa0c0)}.contact-item .ct-cd .lb{flex:0 0 100%;font-size:11px}.contact-item .ct-cd label{display:inline-flex;align-items:center;gap:4px;cursor:pointer;color:inherit}.contact-item .ct-cd input{margin:0;width:14px;height:14px;accent-color:var(--teal)}.contact-item .ct-cd .hpi{width:14px;height:14px;display:inline-block}'
 +'#p-call details.cp-why a.cp-golink{color:var(--teal);text-decoration:underline}.contact-item .ct-cd.hl{outline:2px solid var(--teal);outline-offset:4px;border-radius:6px}nav #hp-verfoot .hp-rolelk{pointer-events:auto;cursor:pointer;text-decoration:underline dotted}';
try{ if(typeof document!=='undefined'&&document.head&&!document.getElementById('hp-cd-css')){ const st=document.createElement('style'); st.id='hp-cd-css'; st.textContent=HP_CD_CSS; document.head.appendChild(st); } }catch(e){}

hpRsGet=function(){ try{ const o=JSON.parse(localStorage.getItem(HP_RS_KEY)||'null'); if(o&&typeof o==='object'&&o.map&&typeof o.map==='object') return {map:o.map,ts:Number(o.ts)||0,peers:(o.peers&&typeof o.peers==='object')?o.peers:{}}; }catch(e){} return {map:{},ts:0,peers:{}}; };
hpRsSave=function(o){ try{ const cur=JSON.parse(localStorage.getItem(HP_RS_KEY)||'null'); const peers=(o&&o.peers&&typeof o.peers==='object')?o.peers:((cur&&cur.peers&&typeof cur.peers==='object')?cur.peers:{}); localStorage.setItem(HP_RS_KEY,JSON.stringify({map:o.map,ts:o.ts,peers:peers})); }catch(e){} };
function hpRsPeersClean(p){ const out={}; try{ for(const k of Object.keys(p||{})){ if(typeof k!=='string'||k.length>128) continue; const a=Array.isArray(p[k])?p[k].filter(d=>/^ed[0-9a-f]{64}$/.test(String(d))).slice(0,16):null; if(a&&a.length) out[k]=a; } }catch(e){} return out; }
hpRsTell=function(){ try{ const o=hpRsGet(), body={v:1,type:'ringset',map:o.map,ts:o.ts,peers:o.peers}; let line=0; const open=new Set(); try{ if(typeof SIB!=='undefined'&&typeof sibSend==='function') for(const id of Object.keys(SIB)){ if(SIB[id]&&SIB[id].state==='open'&&sibSend(id,{t:'ringset',map:o.map,ts:o.ts,peers:o.peers})){ line++; open.add(SIB[id].dev||id); } } }catch(e){}
    let box=[]; try{ if(typeof sibTargets==='function') box=sibTargets().filter(d=>!open.has(d)); }catch(e){}
    if(box.length&&typeof hpSibPut==='function'){ try{ Promise.resolve(hpSibPut(body,box)).then(n=>{ try{ hpLog('通話：受ける端末の設定を、自分のほかの端末 '+n+' 台に郵便受けで知らせた'); }catch(e){} }).catch(e=>{ try{ hpLog('通話：受ける端末の設定を郵便受けで知らせられない（'+((e&&e.message)||e)+'）'); }catch(x){} }); }catch(e){} }
    try{ if(line) hpLog('通話：受ける端末の設定を、線のつながっている自分の端末 '+line+' 台に知らせた'); }catch(e){} return line+box.length; }catch(e){ return 0; } };
hpRsIn=function(o){ try{ if(!o||!o.map||typeof o.map!=='object') return false; const ts=Number(o.ts)||0, cur=hpRsGet(); if(!(ts>cur.ts)) return false; const map={}; for(const k of Object.keys(o.map)){ if(/^ed[0-9a-f]{64}$/.test(k)) map[k]=o.map[k]===0?0:1; } hpRsSave({map:map,ts:ts,peers:hpRsPeersClean(o.peers)}); const ch=hpRsApply();
    try{ hpLog('通話：自分のほかの端末から、受ける端末の設定を受け取った'+(ch?'（この端末は'+(hpRsOn(hpRsMe())?'受ける':'受けない')+'）':'')); }catch(e){} try{ if(HP_CP&&document.getElementById('p-call')&&document.getElementById('p-call').classList.contains('on')) hpCallUiRender(); }catch(e){} try{ if(typeof renderContacts==='function') renderContacts(); }catch(e){} return true; }catch(e){ return false; } };
function hpCdGet(peer){ try{ const a=hpRsGet().peers[peer]; return Array.isArray(a)&&a.length?a.slice():null; }catch(e){ return null; } }
function hpCdSet(peer,arr){ try{ const o=hpRsGet(); const all=hpRsDevs().map(d=>d.dev); const sel=(arr||[]).filter(d=>all.indexOf(d)>=0); if(!sel.length||sel.length>=all.length) delete o.peers[peer]; else o.peers[peer]=sel; o.ts=Math.max(Date.now(),(o.ts||0)+1); hpRsSave(o); hpRsTell(); try{ hpLog('通話：'+nickOf(peer)+' と通話できる端末を '+(o.peers[peer]?o.peers[peer].length+' 台に':'制限なしに')+'決めた'); }catch(e){} return true; }catch(e){ return false; } }
function hpCdAllowed(peer){ const a=hpCdGet(peer); if(!a) return true; return a.indexOf(hpRsMe())>=0; }
function hpCdLabels(peer){ try{ const a=hpCdGet(peer); if(!a) return ''; const ds=hpRsDevs(); return a.map(d=>{ const x=ds.find(y=>y.dev===d); return x?x.label:d.slice(2,10); }).join('、'); }catch(e){ return ''; } }
function hpCdKindIcon(d){ try{ const k=(typeof hpDevKindOf==='function')?hpDevKindOf((d.a||'')+' '+(d.b||'')+' '+(d.label||'')):''; const ic=(k==='iphone'||k==='android')?'mobile':'laptop'; if(typeof hpIcEl==='function') return hpIcEl(ic); }catch(e){} return document.createTextNode(''); }

try{ if(typeof hpRingOffWant==='function'&&!hpRingOffWant.__f372){ const f=hpRingOffWant; hpRingOffWant=Object.assign(function(r,o,locked){ let a=null; try{ a=(r&&typeof r.from==='string')?hpCdGet(r.from):null; }catch(e){} if(!a) return f.apply(this,arguments); const g=hpRingOffFor; const off=a.indexOf(hpRsMe())<0; hpRingOffFor=()=>off; try{ const w=f.apply(this,arguments); if(w){ try{ hpLog('通話：'+nickOf(r.from)+' と通話できる端末にこの端末は入っていないので鳴らさない'); }catch(e){} } return w; } finally{ hpRingOffFor=g; } },f,{__f372:1}); } }catch(e){}

function hpF372WrapRc(){ try{ if(typeof renderContacts==='function'&&!renderContacts.__f372){ const f=renderContacts; renderContacts=Object.assign(function(){ const v=f.apply(this,arguments); try{ const cs=(typeof contacts==='function')?contacts():[]; const rows=Array.from(document.querySelectorAll('#contact-list .contact-item')); const ds=hpRsDevs(); if(ds.length<2) return v;
      cs.forEach((c,i)=>{ const row=rows[i]; if(!row||!c||!c.address) return; const nm=row.querySelector('.nm'); if(!nm||nm.querySelector('.ct-cd')) return; const cur=hpCdGet(c.address); const box=document.createElement('div'); box.className='ct-cd'; const lb=document.createElement('span'); lb.className='lb'; lb.textContent=T('cl_cd_l'); box.appendChild(lb);
        for(const d of ds){ const l=document.createElement('label'); const ck=document.createElement('input'); ck.type='checkbox'; ck.checked=!cur||cur.indexOf(d.dev)>=0; ck.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} const sel=Array.from(box.querySelectorAll('input')).filter(x=>x.checked).map(x=>x.__dev); if(!sel.length){ ck.checked=true; try{ hpToast(T('cl_cd_min'),3000); }catch(e){} return; } hpCdSet(c.address,sel); try{ hpToast(TF('cl_cd_done',{who:c.nick||hpIdShort(c.address),d:hpCdLabels(c.address)||T('cl_cd_all')}),3500); }catch(e){} }; ck.__dev=d.dev; l.appendChild(ck); l.appendChild(hpCdKindIcon(d)); const s=document.createElement('span'); s.textContent=d.label+(d.me?'（'+T('cl_rs_me')+'）':''); l.appendChild(s); l.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} }; box.appendChild(l); }
        const st=nm.querySelector('.ct-st'); if(st) nm.insertBefore(box,st); else nm.appendChild(box); }); }catch(e){} return v; },f,{__f372:1}); } }catch(e){} return (typeof renderContacts==='function'&&!!renderContacts.__f372); }

function hpCdGoFriends(peer){ try{ const t=document.getElementById('t-contacts'); if(t&&typeof t.click==='function') t.click(); setTimeout(()=>{ try{ const cs=(typeof contacts==='function')?contacts():[]; const i=cs.findIndex(c=>c&&c.address===peer); const rows=document.querySelectorAll('#contact-list .contact-item'); const row=i>=0?rows[i]:null; if(row){ if(row.scrollIntoView) row.scrollIntoView({block:'center',behavior:'smooth'}); const cd=row.querySelector&&row.querySelector('.ct-cd'); if(cd&&cd.classList){ cd.classList.add('hl'); setTimeout(()=>{ try{ cd.classList.remove('hl'); }catch(e){} },2500); } } }catch(e){} },250); return true; }catch(e){ return false; } }
function hpCdWhen(ts){ try{ const d=new Date(ts), n=new Date(); const p=x=>String(x).padStart(2,'0'); const same=d.getFullYear()===n.getFullYear()&&d.getMonth()===n.getMonth()&&d.getDate()===n.getDate(); const y=new Date(n.getTime()-864e5); const yes=d.getFullYear()===y.getFullYear()&&d.getMonth()===y.getMonth()&&d.getDate()===y.getDate(); const hm=p(d.getHours())+':'+p(d.getMinutes()); if(same) return TF('cl_ch_today',{t:hm}); if(yes) return TF('cl_ch_yest',{t:hm}); return (d.getMonth()+1)+'/'+d.getDate()+' '+hm; }catch(e){ return ''; } }
function hpCdHist(peer){ try{ const h=(typeof histLoad==='function')?histLoad(peer):[]; return h.filter(m=>m&&m.d==='c'&&m.cl).sort((a,b)=>(Number(b.ts)||0)-(Number(a.ts)||0)).slice(0,20); }catch(e){ return []; } }
function hpCdHistInto(s,peer){ try{ const el=hpCpEl; const card=el('div','cp-ch'); card.appendChild(el('h3',null,T('cl_ch_t'))); const rows=hpCdHist(peer); if(!rows.length){ card.appendChild(el('div','nt',T('cl_ch_none'))); s.appendChild(card); return 0; }
    for(const m of rows){ const out=(typeof hpChOut==='function')&&hpChOut(m); const miss=!out&&m.cl.r==='miss'; const r=el('div','r'+(miss?' miss':'')); r.appendChild(el('span','ar',out?'↗':'↙')); r.appendChild(el('span','w',hpCdWhen(Number(m.ts)||0))); let t=''; try{ t=(out&&typeof hpChOutText==='function')?hpChOutText(m):(typeof hpChText==='function')?hpChText(m):''; }catch(e){} r.appendChild(el('span','t',t)); card.appendChild(r); } s.appendChild(card); return rows.length; }catch(e){ return 0; } }
try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f372){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ const el=hpCpEl; for(const c of Array.from(s.children||[])){ if(c&&c.className==='cp-set'&&c.querySelector&&c.querySelector('#cp-rs-sel')) s.removeChild(c); }
      const act=s.querySelector?s.querySelector('.cp-act'):null; if(act){ const bs=Array.from(act.querySelectorAll('button')); const r1=bs[1]&&bs[1].querySelector?bs[1].querySelector('.ring'):null; if(r1&&r1.classList) r1.classList.add('v');
        const a=hpCdGet(peer); if(a){ const ok=hpCdAllowed(peer); const line=el('div','cp-cd',TF('cl_cd_list',{d:hpCdLabels(peer)})); s.insertBefore(line,act.nextSibling); if(!ok){ for(const b of bs){ b.disabled=true; if(b.classList) b.classList.add('off'); b.onclick=null; } const me=hpRsDevs().find(d=>d.me); const why=el('details','cp-why'); why.appendChild(el('summary',null,T('cl_cd_why_t'))); why.appendChild(el('p',null,TF('cl_cd_why',{me:me?me.label:'',who:(typeof nickOf==='function')?nickOf(peer):peer}))); const lk=el('a','cp-golink',TF('cl_cd_go',{who:(typeof nickOf==='function')?nickOf(peer):peer})); lk.href='#'; lk.onclick=ev=>{ try{ ev.preventDefault(); }catch(e){} hpCdGoFriends(peer); }; const pl=el('p'); pl.appendChild(lk); why.appendChild(pl); s.insertBefore(why,line.nextSibling); } } }
      hpCdHistInto(s,peer); }catch(e){} return r; },f,{__f372:1}); } }catch(e){}

try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f372){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ const st=Array.from(s.children||[]).find(e=>e&&e.className==='cp-set'); if(st){ s.removeChild(st); s.appendChild(st); if(!st.querySelector('.nt2')) st.appendChild(hpCpEl('div','nt2',T('cl_rs_note'))); } }catch(e){} return r; },f,{__f372:1}); } }catch(e){}

hpSegPlace=function(bar){ try{ const pe=document.getElementById('path'); const reset=()=>{ if(bar&&bar.classList){ bar.classList.remove('hp-abs'); bar.style.top=''; } if(pe&&pe.__f372pb!=null){ pe.style.paddingBottom=pe.__f372pb0||''; pe.__f372pb=null; } };
    if(!bar||!bar.classList) return false; const narrow=!!(window.matchMedia&&window.matchMedia('(max-width:600px)').matches); if(!narrow||!pe){ reset(); return false; }
    const vis=el=>{ if(!el||!el.getBoundingClientRect) return null; const r=el.getBoundingClientRect(); return (r.width>0&&r.height>0)?r:null; }; const ls=vis(document.getElementById('lease-rly')); if(!ls){ reset(); return false; }
    const sv=vis(document.querySelector('#d-rly svg')); const anchor=(sv&&sv.bottom<=ls.top+4)?sv.bottom-2:ls.top; bar.classList.add('hp-abs'); const op=bar.offsetParent||document.body; const pr=op.getBoundingClientRect(); const h=bar.offsetHeight||0; bar.style.top=Math.round(anchor-pr.top)+'px';
    if(pe.__f372pb==null){ pe.__f372pb0=pe.style.paddingBottom||''; pe.__f372pb=0; } const pb=pe.getBoundingClientRect().bottom-pe.__f372pb; const need=Math.max(0,Math.round(anchor+h+8-pb)); if(need!==pe.__f372pb){ pe.__f372pb=need; const base=parseFloat(getComputedStyle(pe).paddingBottom)||0; pe.style.paddingBottom=(base-(pe.__f372pbPrev||0)+need)+'px'; pe.__f372pbPrev=need; } return true; }catch(e){ return false; } };

function hpF372WrapVf(){ try{ if(typeof hpVerFoot==='function'&&!hpVerFoot.__f372){ const f=hpVerFoot; hpVerFoot=Object.assign(function(){ const t=f.apply(this,arguments); try{ const el=document.getElementById('hp-verfoot'); const role=(typeof hpRoleWord==='function')?hpRoleWord():''; if(el&&t&&role&&!(el.querySelector&&el.querySelector('.hp-rolelk'))){ while(el.firstChild) el.removeChild(el.firstChild); const a=document.createElement('span'); a.className='hp-rolelk'; a.textContent=role; a.onclick=ev=>{ try{ ev.stopPropagation(); ev.preventDefault(); }catch(e){} try{ if(typeof hpHelpGo==='function') hpHelpGo(15); }catch(e){} }; el.appendChild(a); el.appendChild(document.createTextNode(' · '+t)); } }catch(e){} return t; },f,{__f372:1}); } }catch(e){} return (typeof hpVerFoot==='function'&&!!hpVerFoot.__f372); }
function hpF372Wrap(){ let n=0; try{ if(hpF372WrapRc()) n++; }catch(e){} try{ if(hpF372WrapVf()){ n++; try{ hpVerFoot(); }catch(e){} } }catch(e){} return n; }
try{ hpF372Wrap(); setTimeout(hpF372Wrap,0); setTimeout(hpF372Wrap,2500); }catch(e){}
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f372){ const f=hpSegSync; hpSegSync=Object.assign(function(){ try{ hpF372Wrap(); }catch(e){} return f.apply(this,arguments); },f,{__f372:1}); } }catch(e){}

const HP_F373_CSS='#p-call .cp-row .cdv{flex:1 1 auto;min-width:0;text-align:right;font-size:12px;color:var(--dim,#8aa0c0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#p-call .cp-row .cdg{flex:0 0 auto;width:34px;height:34px;border-radius:50%;border:none;background:none;color:var(--dim,#8aa0c0);display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0}#p-call .cp-row .cdg .hpi{width:18px;height:18px}#p-call .cp-row .cdg:hover{color:var(--teal)}'
 +'#p-call .cp-ch .box{max-height:220px;overflow:auto;-webkit-overflow-scrolling:touch;border:1px solid #1b2740;border-radius:10px;padding:0 8px}#p-call .cp-ch .box .r:last-child{border-bottom:none}'
 +'.hp-cdask label{display:flex;align-items:center;gap:8px;padding:6px 0;cursor:pointer}.hp-cdask input{width:16px;height:16px;accent-color:var(--teal)}.hp-cdask .hpi{width:16px;height:16px}';
try{ if(typeof document!=='undefined'&&document.head&&!document.getElementById('hp-f373-css')){ const st=document.createElement('style'); st.id='hp-f373-css'; st.textContent=HP_F373_CSS; document.head.appendChild(st); } }catch(e){}

try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f373){ const f=hpSegSync; hpSegSync=Object.assign(function(){ let show=false; try{ const pc=document.getElementById('p-call'), ch=document.getElementById('p-chat'); show=!!(pc&&pc.classList&&pc.classList.contains('on'))||!!(ch&&ch.classList&&ch.classList.contains('on')&&ch.classList.contains('list-mode')); }catch(e){} if(show) HP_SEG_NOHOME=true; const r=f.apply(this,arguments); if(show) HP_SEG_NOHOME=true;
    try{ if(show&&document.body&&document.body.classList&&document.body.classList.contains('hp-home')){ hpV334Mark(false); if(typeof hpCsFit==='function') hpCsFit(); } }catch(e){} return r; },f,{__f373:1}); } }catch(e){}

const HP_FWD_MS=30000  ; const HP_FWD_PROBE_MS=3000; const HP_FWD_HOLD={}; const HP_FWD_MARK={};
hpRsApply=function(){ try{ if(typeof hpRingOffOn==='function'&&hpRingOffOn()&&typeof hpRingOffSet==='function'){ HP_RS_LOCK++; try{ hpRingOffSet(false); } finally{ HP_RS_LOCK--; } try{ hpLog('通話：「受けない」の控えを解いた（▼ は先に鳴る端末の意味に）'); }catch(e){} return true; } }catch(e){} return false; };
try{ setTimeout(()=>{ try{ hpRsApply(); }catch(e){} },3000); }catch(e){}
function hpFwdPri(peer){ try{ const pri=(typeof hpRsPicked==='function')?hpRsPicked():''; if(!pri) return ''; const a=hpCdGet(peer); if(a&&a.indexOf(pri)<0) return ''; return pri; }catch(e){ return ''; } }
function hpFwdWait(r,o){ try{ if(!o||o.type!=='call'||o.v!==1||typeof o.call!=='string'||!r||typeof r.from!=='string') return false; if(typeof ID!=='undefined'&&ID&&r.from===ID.address) return false; const pri=hpFwdPri(r.from); if(!pri||pri===hpRsMe()) return false; if(!hpCdAllowed(r.from)) return false; if(typeof HP_CALL_GONE!=='undefined'&&HP_CALL_GONE.has(o.call)) return false; if(typeof HP_CALL!=='undefined'&&HP_CALL&&HP_CALL.st!=='ended') return false; return true; }catch(e){ return false; } }
function hpFwdHold(r,o,go){ try{ const id=o.call; if(HP_FWD_HOLD[id]){ HP_FWD_HOLD[id].r=r; HP_FWD_HOLD[id].o=o; return true; } const h={r:r,o:o,at:Date.now(),priSeen:false}; HP_FWD_HOLD[id]=h; try{ hpLog('通話：'+nickOf(r.from)+' からの呼び出し。先に鳴る端末が出なければ '+Math.round(HP_FWD_MS/1000)+' 秒後にこの端末も鳴る'); }catch(e){}
    const fire=(why)=>{ try{ if(HP_FWD_HOLD[id]!==h) return; delete HP_FWD_HOLD[id]; try{ clearTimeout(h.timer); clearTimeout(h.probe); }catch(e){} const gone=(typeof HP_CALL_GONE!=='undefined'&&HP_CALL_GONE.has(id))||(typeof HP_CALL!=='undefined'&&HP_CALL&&HP_CALL.st!=='ended'); if(gone){ try{ hpLog('通話：先に鳴る端末が応じたので、この端末は鳴らさない'); }catch(e){} return; } if(why==='fwd') HP_FWD_MARK[id]=Date.now(); try{ hpLog(why==='fwd'?'通話：先に鳴る端末が出ないので、この端末でも鳴らす（先に鳴る端末も鳴ったまま）':'通話：先に鳴る端末から '+Math.round(HP_FWD_PROBE_MS/1000)+' 秒返事が無い（切れているか）ので、待たずにこの端末で鳴らす'); }catch(e){} Promise.resolve(go(h.r,h.o)).catch(()=>{}); }catch(e){} };
    h.timer=setTimeout(()=>fire('fwd'),HP_FWD_MS); h.probe=setTimeout(()=>{ if(!h.priSeen) fire('off'); },HP_FWD_PROBE_MS); return true; }catch(e){ return false; } }
function hpFwdPriTell(o){ try{ let n=0; if(typeof SIB!=='undefined'&&typeof sibSend==='function') for(const id of Object.keys(SIB)){ if(SIB[id]&&SIB[id].state==='open'&&sibSend(id,{t:'prering',call:o.call})) n++; } if(n){ try{ hpLog('通話：先に鳴る端末として、自分のほかの端末 '+n+' 台に「鳴っている」と知らせた'); }catch(e){} } return n; }catch(e){ return 0; } }
function hpFwdPriCheck(r,o){ try{ if(!o||o.type!=='call'||o.v!==1||typeof o.call!=='string'||!r||typeof r.from!=='string') return false; if(typeof ID!=='undefined'&&ID&&r.from===ID.address) return false; const pri=hpFwdPri(r.from); if(!pri||pri!==hpRsMe()) return false; if(o.__prering) return false; o.__prering=1; hpFwdPriTell(o); return true; }catch(e){ return false; } }
try{ if(typeof sibOnMessage==='function'&&!sibOnMessage.__f373){ const f=sibOnMessage; sibOnMessage=Object.assign(function(id,o){ try{ if(o&&o.t==='prering'&&typeof o.call==='string'){ const h=HP_FWD_HOLD[o.call]; if(h){ h.priSeen=true; try{ hpLog('通話：先に鳴る端末が鳴っている（'+Math.round(HP_FWD_MS/1000)+' 秒待つ）'); }catch(e){} } return; } }catch(e){} return f.apply(this,arguments); },f,{__f373:1}); } }catch(e){}
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f373){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ try{ if(hpFwdWait(r,o)){ hpFwdHold(r,o,(rr,oo)=>f.call(this,rr,oo)); return; } hpFwdPriCheck(r,o); }catch(e){} return f.apply(this,arguments); },f,{__f373:1}); } }catch(e){}
try{ if(typeof hpLkOnSig==='function'&&!hpLkOnSig.__f373){ const f=hpLkOnSig; hpLkOnSig=Object.assign(async function(r,o){ try{ if(hpFwdWait(r,o)){ hpFwdHold(r,o,(rr,oo)=>f.call(this,rr,oo)); return; } hpFwdPriCheck(r,o); }catch(e){} return f.apply(this,arguments); },f,{__f373:1}); } }catch(e){}
try{ if(typeof hpCallGone==='function'&&!hpCallGone.__f373){ const f=hpCallGone; hpCallGone=Object.assign(function(id){ try{ const h=HP_FWD_HOLD[id]; if(h){ clearTimeout(h.timer); clearTimeout(h.probe); delete HP_FWD_HOLD[id]; try{ hpLog('通話：待っていた呼び出しは済んだので、この端末は鳴らさない'); }catch(e){} } }catch(e){} return f.apply(this,arguments); },f,{__f373:1}); } }catch(e){}
try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f373){ const f=hpCallSig; hpCallSig=Object.assign(async function(peer,body,devs){ try{ if(body&&body.type==='callring'&&HP_FWD_MARK[body.call]) body.fwd=1; }catch(e){} return f.apply(this,arguments); },f,{__f373:1}); } }catch(e){}

function hpFwdTold(C){ try{ if(!C||C.fwdTold) return false; C.fwdTold=Date.now(); hpLog('通話：'+nickOf(C.peer)+' の先に鳴る端末が出ないので、ほかの端末も鳴り始めた'); try{ hpCallTone('fwd'); }catch(e){} try{ if(typeof hpVmSay==='function'&&!(typeof soundOn==='function'&&soundOn()==='off')) Promise.resolve(hpVmSay(T('cl_fwd_say'),(typeof curLang==='function')?curLang():'ja')).catch(()=>{}); }catch(e){} try{ hpCallUi(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f373b){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ try{ const C=HP_CALL; if(o&&o.type==='callring'&&o.fwd&&C&&C.dir==='out'&&C.id===o.call&&r&&C.peer===r.from&&C.st==='calling') hpFwdTold(C); }catch(e){} return f.apply(this,arguments); },f,{__f373b:1}); } }catch(e){}
try{ if(typeof hpLkOnSig==='function'&&!hpLkOnSig.__f373b){ const f=hpLkOnSig; hpLkOnSig=Object.assign(async function(r,o){ try{ const C=HP_CALL; if(o&&o.type==='callring'&&o.fwd&&C&&C.dir==='out'&&C.id===o.call&&r&&C.peer===r.from&&C.st==='calling') hpFwdTold(C); }catch(e){} return f.apply(this,arguments); },f,{__f373b:1}); } }catch(e){}
try{ if(typeof hpCallTone==='function'&&!hpCallTone.__f373){ const f=hpCallTone; hpCallTone=Object.assign(function(k){ try{ if(k==='back'&&typeof HP_CALL!=='undefined'&&HP_CALL&&HP_CALL.fwdTold) k='fwd'; if(k==='fwd'){ if(k===HP_CALL_TONE) return; HP_CALL_TONE=k; if(HP_CALL_TONE_T){ clearInterval(HP_CALL_TONE_T); HP_CALL_TONE_T=null; } if(typeof soundOn==='function'&&soundOn()==='off') return; const one=()=>{ hpCallBeep(480,0.5,0.07,0,16); hpCallBeep(600,0.5,0.07,0.7,16); }; one(); HP_CALL_TONE_T=setInterval(one,3000); return; } }catch(e){} return f.apply(this,arguments); },f,{__f373:1}); } }catch(e){}

function hpCdRowText(peer){ try{ const a=hpCdGet(peer); const pri=hpFwdPri(peer); const ds=hpRsDevs(); const list=a?a:ds.map(d=>d.dev); const names=list.map(d=>{ const x=ds.find(y=>y.dev===d); return (d===pri?'\u2605 ':'')+(x?x.label:d.slice(2,10)); }); return a?names.join('、'):(pri?T('cl_cd_all2')+'（'+names.find(n=>n.startsWith('\u2605'))+'）':T('cl_cd_all2')); }catch(e){ return ''; } }
async function hpCdAsk(peer){ try{ if(typeof hpAsk!=='function') return false; const ds=hpRsDevs(); if(!ds.length) return false; const cur=hpCdGet(peer); const wrap=document.createElement('div'); wrap.className='hp-cdask'; const cks=[];
    for(const d of ds){ const l=document.createElement('label'); const ck=document.createElement('input'); ck.type='checkbox'; ck.checked=!cur||cur.indexOf(d.dev)>=0; ck.__dev=d.dev; cks.push(ck); l.appendChild(ck); l.appendChild(hpCdKindIcon(d)); const sp=document.createElement('span'); sp.textContent=d.label+(d.me?'（'+T('cl_rs_me')+'）':''); l.appendChild(sp); wrap.appendChild(l); }
    const who=(typeof nickOf==='function')?nickOf(peer):peer; const ok=await hpAsk({title:TF('cl_cd_title',{who:who}),text:T('cl_cd_note'),node:wrap}); if(!ok) return false; const sel=cks.filter(x=>x.checked).map(x=>x.__dev); if(!sel.length){ try{ hpToast(T('cl_cd_min'),3000); }catch(e){} return false; } hpCdSet(peer,sel); try{ hpToast(TF('cl_cd_done',{who:who,d:hpCdLabels(peer)||T('cl_cd_all2')}),3500); }catch(e){} try{ hpCallUiRender(); }catch(e){} try{ if(typeof renderContacts==='function') renderContacts(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f373){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ const el=hpCpEl; for(const c of Array.from(s.children||[])){ if(!c) continue; if(c.className==='cp-set'){ try{ const kl=c.querySelector?c.querySelector('.kl'):null; if(kl) kl.textContent=T('cl_rs_l2'); const nt=c.querySelector?c.querySelector('.nt2'):null; if(nt) nt.textContent=TF('cl_rs_note2',{s:Math.round(HP_FWD_MS/1000)}); }catch(e){} continue; } if(c.className!=='cp-row') continue; const peer=(c.getAttribute&&c.getAttribute('data-peer'))||''; if(!peer) continue;
        const dv=el('span','cdv',hpCdRowText(peer)); dv.title=dv.textContent; c.appendChild(dv); const g=el('button','cdg'); g.type='button'; g.title=T('cl_cd_gear'); g.setAttribute('aria-label',T('cl_cd_gear')); try{ g.appendChild((typeof hpIcEl==='function')?hpIcEl('gear'):el('span',null,'\u2699')); }catch(e){} g.onclick=ev=>{ try{ ev.stopPropagation(); ev.preventDefault(); }catch(e){} hpCdAsk(peer); }; c.appendChild(g); } }catch(e){} return r; },f,{__f373:1}); } }catch(e){}

try{ if(typeof hpCdHistInto==='function'&&!hpCdHistInto.__f373){ const f=hpCdHistInto; hpCdHistInto=Object.assign(function(s,peer){ const n=f.apply(this,arguments); try{ const card=Array.from(s.children||[]).reverse().find(e=>e&&e.className==='cp-ch'); if(card&&n>0){ const rows=Array.from(card.children||[]).filter(e=>e&&String(e.className||'').split(' ').includes('r')); if(rows.length){ const box=hpCpEl('div','box'); card.insertBefore(box,rows[0]); for(const x of rows){ card.removeChild(x); box.appendChild(x); } } } }catch(e){} return n; },f,{__f373:1}); } }catch(e){}

var HP_F375_CSS='#p-call .cp-row .nm .cp-sub{display:block;font-size:12px;color:#e0566b;margin-top:2px;font-weight:normal;white-space:nowrap}#p-call .cp-row .nm:has(.cp-sub){flex:0 0 auto;max-width:60%}#p-call .cp-row .nm .cp-sub:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#e0566b;margin-right:6px;vertical-align:1px}'
 +'#p-call .cp-vm{margin:14px 0 0}#p-call .cp-vm h3{margin:0 0 6px}#p-call .cp-vm .nt{font-size:13px;color:var(--dim,#8aa0c0);margin:0 0 8px}#p-call .cp-vm .miss{font-size:13px;color:#e0566b;margin:0 0 8px}#p-call .cp-vm .miss:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#e0566b;margin-right:6px;vertical-align:1px}'
 +'#p-call .cp-vm .bt{display:flex;gap:10px;align-items:center}#p-call .cp-vm button{font:inherit;font-size:14px;padding:8px 16px;border-radius:999px;border:1px solid var(--line,#2b3a5a);background:transparent;color:inherit;cursor:pointer}#p-call .cp-vm button.play.hot{background:var(--teal);color:#0b1220;border-color:var(--teal);font-weight:bold}#p-call .cp-vm button:disabled{opacity:.45;cursor:default}#p-call .cp-vm button.stop{display:none}#p-call .cp-vm.on button.stop{display:inline-block}#p-call .cp-vm .now{font-size:12px;color:var(--dim,#8aa0c0);min-height:1em}';
function hpF375Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f375-css')) return false; const st=document.createElement('style'); st.id='hp-f375-css'; st.textContent=HP_F375_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
const HP_CM_KEY='p2p_callseen', HP_VH_KEY='p2p_vmheard', HP_VH_MAX=10;
function hpMarkLoad(k){ try{ const o=JSON.parse(localStorage.getItem(k)||'{}'); return (o&&typeof o==='object'&&!Array.isArray(o))?o:{}; }catch(e){ return {}; } }
function hpMarkSet(k,peer,ts){ try{ ts=Number(ts)||0; if(!peer||!ts) return false; const o=hpMarkLoad(k); if((Number(o[peer])||0)>=ts) return false; o[peer]=ts; localStorage.setItem(k,JSON.stringify(o)); return true; }catch(e){ return false; } }
function hpCmRows(peer){ try{ const h=(typeof histLoad==='function')?histLoad(peer):[]; return h.filter(m=>m&&m.d==='c'&&m.cl&&(m.cl.r==='miss'||m.cl.r==='dnd')&&!(typeof hpChOut==='function'&&hpChOut(m))).sort((a,b)=>(Number(a.ts)||0)-(Number(b.ts)||0)); }catch(e){ return []; } }
function hpCmNew(peer){ const t=Number(hpMarkLoad(HP_CM_KEY)[peer])||0; return hpCmRows(peer).filter(m=>(Number(m.ts)||0)>t); }
function hpVhRows(peer){ try{ const h=(typeof histLoad==='function')?histLoad(peer):[]; return h.filter(m=>m&&m.d==='p'&&!m.x&&m.file&&typeof hpVcIs==='function'&&hpVcIs(m.file)).sort((a,b)=>(Number(a.ts)||0)-(Number(b.ts)||0)); }catch(e){ return []; } }
function hpVhNew(peer){ const t=Number(hpMarkLoad(HP_VH_KEY)[peer])||0; return hpVhRows(peer).filter(m=>(Number(m.ts)||0)>t); }
function hpCmSubText(peer){ try{ const a=[]; const n=hpCmNew(peer).length, k=hpVhNew(peer).length; if(n) a.push(TF('cl_cm_n',{n:n})); if(k) a.push(TF('cl_vh_n',{n:k})); return a.join(' · '); }catch(e){ return ''; } }

var HP_VH_GEN=0, HP_VH_RUN=null;
function hpVhLang(){ try{ return (typeof curLang==='function')?curLang():'ja'; }catch(e){ return 'ja'; } }
function hpVhWhen(ts,lang){ try{ const d=new Date(Number(ts)||0), n=new Date(); if(lang==='ja'){ const y=d.getFullYear()!==n.getFullYear()?d.getFullYear()+'年':''; return y+(d.getMonth()+1)+'月'+d.getDate()+'日'+d.getHours()+'時'+d.getMinutes()+'分'; }
    const bc=(typeof HP_VM_LANG!=='undefined'&&HP_VM_LANG[lang])||'en-US'; const o={month:'long',day:'numeric',hour:'numeric',minute:'2-digit'}; if(d.getFullYear()!==n.getFullYear()) o.year='numeric'; return d.toLocaleString(bc,o); }catch(e){ return ''; } }
function hpVhDrop(R){ try{ if(!R) return; if(R.au){ try{ R.au.onended=null; R.au.onerror=null; R.au.pause(); }catch(e){} R.au=null; } if(R.url){ try{ URL.revokeObjectURL(R.url); }catch(e){} R.url=''; } if(R.ac){ try{ if(R.ac.close) Promise.resolve(R.ac.close()).catch(()=>{}); }catch(e){} R.ac=null; } }catch(e){} }
function hpVhUi(on,text){ try{ if(typeof document==='undefined') return; for(const c of Array.from(document.querySelectorAll('#p-call .cp-vm'))){ c.classList.toggle('on',!!on); const p=c.querySelector('button.play'); if(p) p.disabled=!!on||p.getAttribute('data-none')==='1'; const nw=c.querySelector('.now'); if(nw) nw.textContent=on?String(text||''):''; } }catch(e){} }
function hpVhStop(){ HP_VH_GEN++; const R=HP_VH_RUN; HP_VH_RUN=null; try{ if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); }catch(e){} hpVhDrop(R); hpVhUi(false); if(R) hpLog('通話：音声メッセージの再生を止めた'); return !!R; }
async function hpVhBeep(R){ try{ if(typeof HP_VM_BEEP_AU!=='undefined'&&HP_VM_BEEP_AU&&typeof hpVmBeepAu==='function') return await hpVmBeepAu(); const AC=(typeof AudioContext!=='undefined')?AudioContext:(typeof webkitAudioContext!=='undefined'?webkitAudioContext:null); if(!R.ac&&AC) R.ac=new AC(); if(R.ac&&typeof hpVmBeep==='function') return await hpVmBeep(R.ac); }catch(e){} return false; }
async function hpVhAudio(R,file){ let b=null; try{ b=(typeof blobGet==='function')?await blobGet(file.id):null; }catch(e){ b=null; } if(!b&&typeof sibFetchBlob==='function'){ try{ b=await sibFetchBlob(file.id); }catch(e){ b=null; } } if(!b) return 'none';
  return await new Promise(res=>{ let done=false; const end=v=>{ if(!done){ done=true; res(v); } }; try{ const a=document.createElement('audio'); R.au=a; R.url=URL.createObjectURL(b); a.preload='auto'; a.onended=()=>end('ok'); a.onerror=()=>end('err'); a.onpause=()=>{ try{ if(!a.ended) end('stop'); }catch(e){ end('stop'); } }; a.src=R.url; const p=a.play(); if(p&&p.catch) p.catch(()=>end('err')); }catch(e){ end('err'); } }); }
async function hpVhPlay(peer){ try{ if(!peer) return false; if(HP_VH_RUN) hpVhStop(); const all=hpVhRows(peer); let list=hpVhNew(peer), fresh=list.length>0; if(!list.length) list=all.slice(-HP_VH_MAX); if(!list.length) return false;
    const gen=++HP_VH_GEN, lang=hpVhLang(), R={peer:peer,gen:gen,au:null,url:'',ac:null,n:list.length,done:0}; HP_VH_RUN=R; const live=()=>HP_VH_GEN===gen&&HP_VH_RUN===R;
    try{ if(typeof hpVmBeepPrime==='function') hpVmBeepPrime(); }catch(e){} try{ if(typeof hpVmPrime==='function') hpVmPrime(); }catch(e){}
    hpVhUi(true,TF('cl_vh_now',{i:0,n:list.length})); hpLog('通話：'+nickOf(peer)+' の音声メッセージを再生（'+list.length+' 件'+(fresh?'・まだ聞いていない分':'')+'）');
    try{ await hpVmSay(TF('cl_vh_say_n',{n:list.length}),lang);
      for(let i=0;i<list.length;i++){ if(!live()) break; const m=list[i]; hpVhUi(true,TF('cl_vh_now',{i:i+1,n:list.length})); await hpVmSay(TF('cl_vh_say_i',{i:i+1}),lang); if(!live()) break; await hpVmSay(hpVhWhen(m.ts,lang),lang); if(!live()) break; await hpVhBeep(R); if(!live()) break;
        const r=await hpVhAudio(R,m.file); if(!live()) break; if(r==='none'||r==='err') await hpVmSay(T('cl_vh_noau'),lang); if(!live()) break; R.done++; hpMarkSet(HP_VH_KEY,peer,Number(m.ts)||0); }
      if(live()) await hpVmSay(T('cl_vh_say_end'),lang); }catch(e){}
    const was=live(); if(HP_VH_RUN===R) HP_VH_RUN=null; hpVhDrop(R); hpVhUi(false); if(was){ hpLog('通話：音声メッセージを聞き終えた（'+R.done+'/'+R.n+' 件）'); try{ if(typeof hpCallUiRender==='function'&&typeof HP_CP!=='undefined'&&HP_CP.peer===peer) hpCallUiRender(); }catch(e){} } return was; }catch(e){ return false; } }

function hpVhInto(s,peer){ try{ const el=hpCpEl; hpF375Css(); const card=el('div','cp-vm'); card.setAttribute('data-peer',peer); card.appendChild(el('h3',null,T('cl_vh_t')));
    const miss=hpCmNew(peer); if(miss.length){ const last=miss[miss.length-1]; card.appendChild(el('div','miss',TF('cl_cm_have',{n:miss.length,w:(typeof hpCdWhen==='function')?hpCdWhen(Number(last.ts)||0):''}))); hpMarkSet(HP_CM_KEY,peer,Number(last.ts)||0); }
    const all=hpVhRows(peer), fresh=hpVhNew(peer); card.appendChild(el('div','nt',all.length?(fresh.length?TF('cl_vh_have',{n:all.length,k:fresh.length}):TF('cl_vh_have0',{n:all.length})):T('cl_vh_none')));
    const bt=el('div','bt'); const p=el('button','play'+(fresh.length?' hot':''),'▶ '+T('cl_vh_play')); p.type='button'; if(!all.length){ p.disabled=true; p.setAttribute('data-none','1'); } p.onclick=ev=>{ try{ ev.preventDefault(); }catch(e){} hpVhPlay(peer); }; bt.appendChild(p);
    const st=el('button','stop','■ '+T('cl_vh_stop')); st.type='button'; st.onclick=ev=>{ try{ ev.preventDefault(); }catch(e){} hpVhStop(); }; bt.appendChild(st); bt.appendChild(el('span','now','')); card.appendChild(bt);
    if(HP_VH_RUN&&HP_VH_RUN.peer===peer) card.classList.add('on'); s.appendChild(card); return {miss:miss.length,all:all.length,fresh:fresh.length}; }catch(e){ return null; } }
try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f375){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ const ch=Array.from(s.children||[]).find(x=>x&&x.className==='cp-ch'); if(ch){ const tmp={appendChild:x=>s.insertBefore(x,ch)}; hpVhInto(tmp,peer); } else hpVhInto(s,peer); }catch(e){} return r; },f,{__f375:1}); } }catch(e){}

try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f375){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ hpF375Css(); const el=hpCpEl; for(const c of Array.from(s.children||[])){ if(!c||c.className!=='cp-row') continue; const peer=(c.getAttribute&&c.getAttribute('data-peer'))||''; if(!peer) continue; const t=hpCmSubText(peer); if(!t) continue; const nm=c.querySelector?c.querySelector('.nm'):null; if(nm) nm.appendChild(el('span','cp-sub',t)); } }catch(e){} return r; },f,{__f375:1}); } }catch(e){}
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f375){ const f=hpSegSync; hpSegSync=Object.assign(function(){ const r=f.apply(this,arguments); try{ const pc=document.getElementById('p-call'); if(HP_VH_RUN&&(!pc||!pc.classList.contains('on'))) hpVhStop(); }catch(e){} return r; },f,{__f375:1}); } }catch(e){}

function hpRsPriClean(p){ const out={}; try{ for(const k of Object.keys(p||{})){ if(typeof k!=='string'||k.length>128) continue; const d=String(p[k]||''); if(/^ed[0-9a-f]{64}$/.test(d)) out[k]=d; } }catch(e){} return out; }
try{ if(typeof hpRsGet==='function'&&!hpRsGet.__f376){ const f=hpRsGet; hpRsGet=Object.assign(function(){ const o=f.apply(this,arguments); try{ const raw=JSON.parse(localStorage.getItem(HP_RS_KEY)||'null'); o.pri=(raw&&raw.pri&&typeof raw.pri==='object')?raw.pri:{}; }catch(e){ o.pri=o.pri||{}; } return o; },f,{__f376:1}); } }catch(e){}
try{ if(typeof hpRsSave==='function'&&!hpRsSave.__f376){ const f=hpRsSave; hpRsSave=Object.assign(function(o){ let prev={}; try{ prev=hpRsPriClean(((JSON.parse(localStorage.getItem(HP_RS_KEY)||'null'))||{}).pri); }catch(e){ prev={}; } f.apply(this,arguments); try{ const cur=JSON.parse(localStorage.getItem(HP_RS_KEY)||'null'); if(!cur||typeof cur!=='object') return; cur.pri=(o&&o.pri&&typeof o.pri==='object')?hpRsPriClean(o.pri):prev; localStorage.setItem(HP_RS_KEY,JSON.stringify(cur)); }catch(e){} },f,{__f376:1}); } }catch(e){}
try{ if(typeof hpRsTell==='function'&&!hpRsTell.__f376){ const f=hpRsTell; hpRsTell=Object.assign(function(){ const ss=(typeof sibSend==='function')?sibSend:null, hp=(typeof hpSibPut==='function')?hpSibPut:null; const pri=hpRsGet().pri||{}; try{ if(ss) sibSend=function(id,m){ try{ if(m&&m.t==='ringset') m.pri=pri; }catch(e){} return ss.apply(this,arguments); }; if(hp) hpSibPut=function(body,box){ try{ if(body&&body.type==='ringset') body.pri=pri; }catch(e){} return hp.apply(this,arguments); }; return f.apply(this,arguments); } finally { if(ss) sibSend=ss; if(hp) hpSibPut=hp; } },f,{__f376:1}); } }catch(e){}
try{ if(typeof hpRsIn==='function'&&!hpRsIn.__f376){ const f=hpRsIn; hpRsIn=Object.assign(function(o){ const r=f.apply(this,arguments); try{ if(r&&o&&o.pri&&typeof o.pri==='object'){ const cur=hpRsGet(); cur.pri=hpRsPriClean(o.pri); hpRsSave(cur); } }catch(e){} return r; },f,{__f376:1}); } }catch(e){}
function hpCdPriGet(peer){ try{ const d=String((hpRsGet().pri||{})[peer]||''); if(!d) return ''; const ds=(typeof hpRsDevs==='function')?hpRsDevs():[]; if(ds.length&&!ds.some(x=>x.dev===d)) return ''; const a=hpCdGet(peer); if(a&&a.indexOf(d)<0) return ''; return d; }catch(e){ return ''; } }
function hpCdPriSet(peer,dev){ try{ const o=hpRsGet(); const was=String((o.pri||{})[peer]||''); dev=String(dev||''); if(was===dev) return false; o.pri=o.pri||{}; if(dev) o.pri[peer]=dev; else delete o.pri[peer]; o.ts=Math.max(Date.now(),(o.ts||0)+1); hpRsSave(o); hpRsTell(); try{ const ds=hpRsDevs(), x=ds.find(y=>y.dev===dev); hpLog('通話：'+nickOf(peer)+' からの通話で先に鳴る端末を '+(dev?(x?x.label:dev.slice(2,10)):'共通の設定')+' にした'); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpFwdPri==='function'&&!hpFwdPri.__f376){ const f=hpFwdPri; hpFwdPri=Object.assign(function(peer){ try{ const p=hpCdPriGet(peer); if(p) return p; }catch(e){} return f.apply(this,arguments); },f,{__f376:1}); } }catch(e){}
try{ if(typeof hpCdSet==='function'&&!hpCdSet.__f376){ const f=hpCdSet; hpCdSet=Object.assign(function(peer,arr){ const r=f.apply(this,arguments); try{ const o=hpRsGet(); const p=String((o.pri||{})[peer]||''); const a=o.peers[peer]; if(p&&Array.isArray(a)&&a.indexOf(p)<0){ delete o.pri[peer]; hpRsSave(o); hpLog('通話：'+nickOf(peer)+' の先に鳴る端末は ☑ から外れたので共通の設定に戻した'); } }catch(e){} return r; },f,{__f376:1}); } }catch(e){}
var HP_F376_CSS='.hp-cdask label{display:flex;align-items:center;gap:8px}.hp-cdask .pri{margin-left:auto;display:flex;align-items:center;gap:4px;font-size:12px;color:var(--dim,#8aa0c0);white-space:nowrap}.hp-cdask .pri input{margin:0}.hp-cdask label.cm{margin-bottom:6px;padding-bottom:6px;border-bottom:1px solid var(--line,#2b3a5a)}.hp-cdask label.cm .pri{margin-left:0}.hp-cdask .hd{font-size:12px;color:var(--dim,#8aa0c0);margin:0 0 4px}';
function hpF376Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f376-css')) return false; const st=document.createElement('style'); st.id='hp-f376-css'; st.textContent=HP_F376_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
hpCdAsk=async function(peer){ try{ if(typeof hpAsk!=='function') return false; const ds=hpRsDevs(); if(!ds.length) return false; hpF376Css(); const cur=hpCdGet(peer), curPri=hpCdPriGet(peer); const wrap=document.createElement('div'); wrap.className='hp-cdask'; const cks=[], rds=[];
    const mkRadio=(dev)=>{ const r=document.createElement('input'); r.type='radio'; r.name='hp-cdpri'; r.value=dev; r.__dev=dev; rds.push(r); return r; };
    { const l=document.createElement('label'); l.className='cm'; const pr=document.createElement('span'); pr.className='pri'; const r=mkRadio(''); r.checked=!curPri; pr.appendChild(r); const sp=document.createElement('span'); sp.textContent=T('cl_cd_pri_common'); pr.appendChild(sp); l.appendChild(pr); wrap.appendChild(l); }
    for(const d of ds){ const l=document.createElement('label'); const ck=document.createElement('input'); ck.type='checkbox'; ck.checked=!cur||cur.indexOf(d.dev)>=0; ck.__dev=d.dev; cks.push(ck); l.appendChild(ck); l.appendChild(hpCdKindIcon(d)); const sp=document.createElement('span'); sp.textContent=d.label+(d.me?'（'+T('cl_rs_me')+'）':''); l.appendChild(sp);
      const pr=document.createElement('span'); pr.className='pri'; const r=mkRadio(d.dev); r.checked=curPri===d.dev; r.disabled=!ck.checked; pr.appendChild(r); const ps=document.createElement('span'); ps.textContent=T('cl_cd_pri'); pr.appendChild(ps); l.appendChild(pr);
      ck.onchange=()=>{ try{ r.disabled=!ck.checked; if(!ck.checked&&r.checked){ r.checked=false; rds[0].checked=true; } }catch(e){} }; pr.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} }; wrap.appendChild(l); }
    const who=(typeof nickOf==='function')?nickOf(peer):peer; const ok=await hpAsk({title:TF('cl_cd_title',{who:who}),text:T('cl_cd_note')+' '+T('cl_cd_note2'),node:wrap}); if(!ok) return false; const sel=cks.filter(x=>x.checked).map(x=>x.__dev); if(!sel.length){ try{ hpToast(T('cl_cd_min'),3000); }catch(e){} return false; }
    let pri=''; try{ const r=rds.find(x=>x.checked); pri=r?String(r.__dev||''):''; }catch(e){ pri=''; } if(pri&&sel.indexOf(pri)<0) pri='';
    hpCdSet(peer,sel); hpCdPriSet(peer,pri); try{ hpToast(TF('cl_cd_done',{who:who,d:hpCdLabels(peer)||T('cl_cd_all2')}),3500); }catch(e){} try{ hpCallUiRender(); }catch(e){} try{ if(typeof renderContacts==='function') renderContacts(); }catch(e){} return true; }catch(e){ return false; } };

var HP_F377_CSS='#p-call.cp-fit{display:flex;flex-direction:column;overflow:hidden;padding-bottom:6px;box-sizing:border-box}#p-call.cp-fit>*{flex:0 0 auto}'
 +'#p-call.cp-fit .cp-h{margin:2px 0 4px}#p-call.cp-fit .cp-h button{padding:6px 12px;font-size:14px}'
 +'#p-call.cp-fit .cp-hero{flex-direction:row;justify-content:center;gap:12px;padding:2px 0 0}#p-call.cp-fit .cp-hero .av{width:56px;height:56px;flex:0 0 56px;font-size:22px}#p-call.cp-fit .cp-hero b{font-size:20px;margin-top:0}#p-call.cp-fit .cp-hero .sm,#p-call.cp-fit .cp-hero .cp-warn{flex:0 0 100%;text-align:center}'
 +'#p-call.cp-fit .cp-act{margin:8px 0 2px;gap:36px}#p-call.cp-fit .cp-act .ring{width:56px;height:56px}#p-call.cp-fit .cp-act .ring .hpi{width:26px;height:26px}#p-call.cp-fit .cp-act button{gap:3px}#p-call.cp-fit .cp-act span.l{font-size:12px}'
 +'#p-call.cp-fit .cp-cd{margin:4px 12px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}#p-call.cp-fit .cp-cd.open{white-space:normal}#p-call.cp-fit details.cp-why{margin:4px 6px 0}'
 +'#p-call.cp-fit .cp-vm{margin:6px 0 0}#p-call.cp-fit .cp-vm h3{margin:0 0 2px}#p-call.cp-fit .cp-vm .nt,#p-call.cp-fit .cp-vm .miss{margin:0 0 4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#p-call.cp-fit .cp-vm button{padding:5px 12px;font-size:13px}'
 +'#p-call.cp-fit .cp-ch{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;margin:6px 6px 0}#p-call.cp-fit .cp-ch h3{margin:0 0 4px;flex:0 0 auto}#p-call.cp-fit .cp-ch .box{flex:1 1 auto;min-height:48px;max-height:none}#p-call.cp-fit .cp-ch .r{padding:5px 4px}';
function hpF377Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f377-css')) return false; const st=document.createElement('style'); st.id='hp-f377-css'; st.textContent=HP_F377_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
var HP_CPFIT_MIN=360;
function hpCpFit(){ try{ if(typeof document==='undefined'||typeof window==='undefined') return 0; const s=document.getElementById('p-call'); if(!s) return 0; const person=!!(typeof HP_CP!=='undefined'&&HP_CP&&HP_CP.peer); if(!person){ s.classList.remove('cp-fit'); s.style.height=''; return 0; }
    hpF377Css(); s.classList.add('cp-fit'); s.style.height=''; const top=s.getBoundingClientRect().top+((typeof window.scrollY==='number')?window.scrollY:0); const vh=Number(window.innerHeight)||0; const h=Math.floor(vh-top); if(!(h>=HP_CPFIT_MIN)){ s.style.height=''; return -1; } s.style.height=h+'px'; return h; }catch(e){ return 0; } }
try{ if(typeof hpCallUiRender==='function'&&!hpCallUiRender.__f377){ const f=hpCallUiRender; hpCallUiRender=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpCpFit(); const s=document.getElementById('p-call'); const cd=s&&s.querySelector?s.querySelector('.cp-cd'):null; if(cd&&!cd.__f377){ cd.__f377=1; cd.title=cd.textContent; cd.onclick=()=>{ try{ cd.classList.toggle('open'); }catch(e){} }; } }catch(e){} return r; },f,{__f377:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&window.addEventListener&&!window.__hpF377){ window.__hpF377=1; let t=null; const go=()=>{ try{ if(t) clearTimeout(t); t=setTimeout(()=>{ try{ const s=document.getElementById('p-call'); if(s&&s.classList.contains('on')) hpCpFit(); }catch(e){} },80); }catch(e){} }; window.addEventListener('resize',go); try{ if(window.visualViewport&&window.visualViewport.addEventListener) window.visualViewport.addEventListener('resize',go); }catch(e){} } }catch(e){}
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f377){ const f=hpSegSync; hpSegSync=Object.assign(function(){ const r=f.apply(this,arguments); try{ setTimeout(()=>{ try{ const s=document.getElementById('p-call'); if(s&&s.classList.contains('on')) hpCpFit(); }catch(e){} },0); }catch(e){} return r; },f,{__f377:1}); } }catch(e){}

var HP_F378_CSS='#p-call .cp-row .nm:has(.cp-sub){flex:1 1 auto;max-width:none}#p-call .cp-row .nm .cp-sub{overflow:hidden;text-overflow:ellipsis}#p-call .cp-row .cdv{flex:0 1 44%;max-width:44%}'
 +'#p-call .cp-vm .ctl{display:flex;gap:8px;align-items:center;flex-wrap:nowrap}#p-call .cp-vm .ctl button{font:inherit;font-size:15px;min-width:44px;height:38px;padding:0 12px;border-radius:999px;border:1px solid var(--line,#2b3a5a);background:transparent;color:inherit;cursor:pointer;line-height:1}'
 +'#p-call .cp-vm .ctl button.pp.hot,#p-call .cp-vm.on .ctl button.pp{background:var(--teal);color:#0b1220;border-color:var(--teal);font-weight:bold}#p-call .cp-vm .ctl button:disabled{opacity:.45;cursor:default}'
 +'#p-call .cp-vm .ctl .prev,#p-call .cp-vm .ctl .next,#p-call .cp-vm .ctl .stop{display:none}#p-call .cp-vm.on .ctl .prev,#p-call .cp-vm.on .ctl .next,#p-call .cp-vm.on .ctl .stop{display:inline-block}'
 +'#p-call .cp-vm .ctl .now{font-size:12px;color:var(--dim,#8aa0c0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}#p-call .cp-vm .ctx{display:none;margin:6px 0 0;font-size:13px;line-height:1.45;max-height:4.4em;overflow:auto;border-left:3px solid var(--teal);padding:2px 0 2px 8px}#p-call .cp-vm.on .ctx.has{display:block}'
 +'#p-call .cp-ch .r.vh .ar{color:var(--teal)}#p-call .cp-ch .r.vh .t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;cursor:pointer}#p-call .cp-ch .r.vh .t.open{display:block;-webkit-line-clamp:unset}#p-call .cp-ch .r.vh .t.nx{color:var(--dim,#8aa0c0)}'
 +'#p-call .cp-ch .r.vh.new .w{color:var(--teal);font-weight:bold}#p-call .cp-ch .r.vh.cur{background:rgba(45,212,191,.10);border-radius:8px}#p-call .cp-ch .r .rp{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:1px solid var(--teal);background:transparent;color:var(--teal);font-size:12px;cursor:pointer;padding:0;line-height:1}#p-call .cp-ch .r.vh.cur .rp{background:var(--teal);color:#0b1220}';
function hpF378Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f378-css')) return false; const st=document.createElement('style'); st.id='hp-f378-css'; st.textContent=HP_F378_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
const HP_VH2_KEY='p2p_vmheard2', HP_VH_BACK_S=3, HP_VH_ROWS=20;
function hpVhHeardSet(peer){ try{ const a=hpMarkLoad(HP_VH2_KEY)[peer]; return new Set(Array.isArray(a)?a.map(Number):[]); }catch(e){ return new Set(); } }
function hpVhMark(peer,ts){ ts=Number(ts)||0; if(!peer||!ts) return false; try{ const o=hpMarkLoad(HP_VH2_KEY); const a=Array.isArray(o[peer])?o[peer].map(Number):[]; if(a.indexOf(ts)>=0) return false; a.push(ts); a.sort((x,y)=>x-y); o[peer]=a.slice(-300); localStorage.setItem(HP_VH2_KEY,JSON.stringify(o)); return true; }catch(e){ return false; } }
function hpVhHeard(peer,m,set,th){ const t=Number(m&&m.ts)||0; return t<=th||set.has(t); }
hpVhNew=function(peer){ const th=Number(hpMarkLoad(HP_VH_KEY)[peer])||0, set=hpVhHeardSet(peer); return hpVhRows(peer).filter(m=>!hpVhHeard(peer,m,set,th)); };
function hpVhTx(h,m){ try{ const a=Number(m.ts)||0; const L=(h||[]).filter(x=>x&&x.d==='p'&&Number(x.ts)>=a&&Number(x.ts)<=a+600000).sort((p,q)=>(Number(p.ts)||0)-(Number(q.ts)||0));
    for(const x of L){ if(x===m||(x.file&&m.file&&x.file.id===m.file.id)) continue; if(typeof hpVtIs==='function'&&hpVtIs(x.t)) return String((typeof hpVtStrip==='function')?hpVtStrip(x.t):x.t).trim(); if(x.file&&typeof hpVcIs==='function'&&hpVcIs(x.file)) return ''; } }catch(e){} return ''; }

var HP_VH_P=null;
async function hpVhAu2(R,file){ let b=null; try{ b=(typeof blobGet==='function')?await blobGet(file.id):null; }catch(e){ b=null; } if(!b&&typeof sibFetchBlob==='function'){ try{ b=await sibFetchBlob(file.id); }catch(e){ b=null; } } if(!b||R.dead) return 'none';
  return await new Promise(res=>{ let done=false; const end=v=>{ if(done) return; done=true; R.endAu=null; try{ if(R.au){ R.au.onended=null; R.au.onerror=null; try{ R.au.pause(); }catch(e){} } }catch(e){} try{ if(R.url) URL.revokeObjectURL(R.url); }catch(e){} R.au=null; R.url=''; res(v); };
    R.endAu=end; try{ const a=document.createElement('audio'); R.au=a; R.url=URL.createObjectURL(b); a.preload='auto'; a.onended=()=>end('ok'); a.onerror=()=>end('err'); a.src=R.url; const p=a.play(); if(p&&p.catch) p.catch(()=>{ if(!R.paused) end('err'); }); }catch(e){ end('err'); } }); }
async function hpVhItem(R,i,ig){ const live=()=>!R.dead&&R.ig===ig&&HP_VH_P===R; const m=R.list[i]; hpVhUi();
  if(!R.once){ await hpVmSay(TF('cl_vh_say_i',{i:i+1}),R.lang); if(!live()) return 'jump'; await hpVmSay(hpVhWhen(m.ts,R.lang),R.lang); if(!live()) return 'jump'; await hpVhBeep(R); if(!live()) return 'jump'; }
  R.inAu=true; const r=await hpVhAu2(R,m.file); R.inAu=false; if(!live()) return 'jump';
  if(r==='none'||r==='err'){ await hpVmSay(T('cl_vh_noau'),R.lang); if(!live()) return 'jump'; } else { R.done++; hpVhMark(R.peer,m.ts); } return 'ok'; }
hpVhPlay=async function(peer,o){ try{ if(!peer) return false; o=o||{}; if(HP_VH_P||HP_VH_RUN) hpVhStop(); const all=hpVhRows(peer); if(!all.length) return false;
    let i0=0; if(o.ts){ i0=all.findIndex(m=>Number(m.ts)===Number(o.ts)); if(i0<0) return false; } else { const th=Number(hpMarkLoad(HP_VH_KEY)[peer])||0, set=hpVhHeardSet(peer); const k=all.findIndex(m=>!hpVhHeard(peer,m,set,th)); i0=k>=0?k:0; }
    const gen=++HP_VH_GEN, R={peer:peer,gen:gen,list:all,i:i0,ig:0,once:!!o.ts,lang:hpVhLang(),done:0,paused:false,inAu:false,au:null,url:'',ac:null,dead:0,endAu:null,wake:null}; HP_VH_P=R; HP_VH_RUN=R;
    try{ if(typeof hpVmBeepPrime==='function') hpVmBeepPrime(); }catch(e){} try{ if(typeof hpVmPrime==='function') hpVmPrime(); }catch(e){}
    hpVhUi(); hpLog('通話：'+nickOf(peer)+' の音声メッセージを再生（'+(R.once?(i0+1)+' 件目だけ':(i0+1)+' 件目から・全部で '+all.length+' 件')+'）');
    const alive=()=>!R.dead&&HP_VH_P===R;
    try{ if(!R.once){ await hpVmSay(TF('cl_vh_say_n',{n:all.length}),R.lang); }
      while(alive()&&R.i>=0&&R.i<R.list.length){ while(R.paused&&alive()) await new Promise(res=>{ R.wake=res; }); if(!alive()) break; const ig=++R.ig; const r=await hpVhItem(R,R.i,ig); if(!alive()) break; if(r==='jump') continue; if(R.once) break; R.i++; }
      if(alive()&&!R.once) await hpVmSay(T('cl_vh_say_end'),R.lang); }catch(e){}
    const was=alive(); if(HP_VH_P===R){ HP_VH_P=null; HP_VH_RUN=null; } R.dead=1; hpVhDrop(R); hpVhUi(); if(was){ hpLog('通話：音声メッセージを聞き終えた（'+R.done+' 件）'); try{ if(typeof hpCallUiRender==='function'&&typeof HP_CP!=='undefined'&&HP_CP.peer===peer) hpCallUiRender(); }catch(e){} } return was; }catch(e){ return false; } };
hpVhStop=function(){ HP_VH_GEN++; const R=HP_VH_P||HP_VH_RUN; HP_VH_P=null; HP_VH_RUN=null; if(R){ R.dead=1; R.paused=false; try{ if(R.endAu) R.endAu('stop'); }catch(e){} try{ if(R.wake){ const w=R.wake; R.wake=null; w(); } }catch(e){} } try{ if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); }catch(e){} hpVhDrop(R); hpVhUi(); if(R) hpLog('通話：音声メッセージの再生を止めた'); return !!R; };
function hpVhGo(d){ const R=HP_VH_P; if(!R) return false; let j=R.i+d; if(d<0&&R.inAu&&R.au&&Number(R.au.currentTime)>HP_VH_BACK_S) j=R.i; if(j<0) j=0; if(j>=R.list.length) return hpVhStop();
  R.i=j; R.ig++; R.paused=false; try{ if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); }catch(e){} try{ if(R.endAu) R.endAu('stop'); }catch(e){} try{ if(R.wake){ const w=R.wake; R.wake=null; w(); } }catch(e){} hpVhUi(); return true; }
function hpVhPause(){ const R=HP_VH_P; if(!R||R.paused) return false; R.paused=true; if(R.inAu&&R.au){ try{ R.au.pause(); }catch(e){} } else { R.ig++; try{ if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); }catch(e){} } hpVhUi(); return true; }
function hpVhResume(){ const R=HP_VH_P; if(!R||!R.paused) return false; R.paused=false; if(R.inAu&&R.au){ try{ const p=R.au.play(); if(p&&p.catch) p.catch(()=>0); }catch(e){} } try{ if(R.wake){ const w=R.wake; R.wake=null; w(); } }catch(e){} hpVhUi(); return true; }
function hpVhPP(peer){ const R=HP_VH_P; if(!R||R.peer!==peer){ hpVhPlay(peer); return 'play'; } if(R.paused){ hpVhResume(); return 'resume'; } hpVhPause(); return 'pause'; }

hpVhUi=function(){ try{ if(typeof document==='undefined'||!document.querySelectorAll) return; const R=HP_VH_P; const m=R?R.list[R.i]:null; const cur=m?String(Number(m.ts)||0):''; let tx='';
    if(R&&m){ try{ tx=hpVhTx((typeof histLoad==='function')?histLoad(R.peer):[],m); }catch(e){ tx=''; } }
    for(const c of Array.from(document.querySelectorAll('#p-call .cp-vm'))){ const mine=!!(R&&c.getAttribute&&c.getAttribute('data-peer')===R.peer); c.classList.toggle('on',mine); const pp=c.querySelector('button.pp');
      if(pp){ if(mine){ pp.textContent=R.paused?'▶︎':'⏸︎'; pp.title=T(R.paused?'cl_vh_play':'cl_vh_pause'); pp.disabled=false; } else { pp.textContent='▶︎ '+T('cl_vh_play'); pp.title=T('cl_vh_play'); pp.disabled=pp.getAttribute('data-none')==='1'; } try{ pp.setAttribute('aria-label',pp.title); }catch(e){} }
      const nw=c.querySelector('.now'); if(nw) nw.textContent=mine?TF('cl_vh_now',{i:R.i+1,n:R.list.length})+(R.paused?' · '+T('cl_vh_paused'):''):'';
      const cx=c.querySelector('.ctx'); if(cx){ cx.textContent=mine?tx:''; cx.classList.toggle('has',!!(mine&&tx)); } }
    for(const r of Array.from(document.querySelectorAll('#p-call .cp-ch .r.vh'))){ const on=!!(cur&&r.getAttribute('data-ts')===cur); const was=r.classList.contains('cur'); r.classList.toggle('cur',on); const t=r.querySelector('.t'); const rp=r.querySelector('.rp');
      if(on){ if(t) t.classList.add('open'); if(rp) rp.textContent=R.paused?'▶︎':'⏸︎'; if(!was){ try{ const box=r.parentNode; if(box&&typeof box.scrollTop==='number'&&typeof r.offsetTop==='number'){ const top=r.offsetTop-box.offsetTop; if(top<box.scrollTop||top+r.offsetHeight>box.scrollTop+box.clientHeight) box.scrollTop=Math.max(0,top-8); } else if(r.scrollIntoView) r.scrollIntoView({block:'nearest'}); }catch(e){} } }
      else { if(was&&t&&!t.__keep) t.classList.remove('open'); if(rp) rp.textContent='▶︎'; } } }catch(e){} };
hpVhInto=function(s,peer){ try{ const el=hpCpEl; hpF375Css(); hpF378Css(); const card=el('div','cp-vm'); card.setAttribute('data-peer',peer); card.appendChild(el('h3',null,T('cl_vh_t')));
    const miss=hpCmNew(peer); if(miss.length){ const last=miss[miss.length-1]; card.appendChild(el('div','miss',TF('cl_cm_have',{n:miss.length,w:(typeof hpCdWhen==='function')?hpCdWhen(Number(last.ts)||0):''}))); hpMarkSet(HP_CM_KEY,peer,Number(last.ts)||0); }
    const all=hpVhRows(peer), fresh=hpVhNew(peer); card.appendChild(el('div','nt',all.length?(fresh.length?TF('cl_vh_have',{n:all.length,k:fresh.length}):TF('cl_vh_have0',{n:all.length})):T('cl_vh_none')));
    const ctl=el('div','ctl'); const mk=(cls,txt,lab,fn)=>{ const b=el('button',cls,txt); b.type='button'; b.title=lab; try{ b.setAttribute('aria-label',lab); }catch(e){} b.onclick=ev=>{ try{ ev.preventDefault(); }catch(e){} fn(); }; ctl.appendChild(b); return b; };
    mk('prev','⏮︎',T('cl_vh_prev'),()=>hpVhGo(-1)); const pp=mk('pp'+(fresh.length?' hot':''),'▶︎ '+T('cl_vh_play'),T('cl_vh_play'),()=>hpVhPP(peer)); if(!all.length){ pp.disabled=true; pp.setAttribute('data-none','1'); }
    mk('next','⏭︎',T('cl_vh_next'),()=>hpVhGo(1)); mk('stop','■︎',T('cl_vh_stop'),()=>hpVhStop()); ctl.appendChild(el('span','now','')); card.appendChild(ctl); card.appendChild(el('div','ctx',''));
    s.appendChild(card); hpVhUi(); return {miss:miss.length,all:all.length,fresh:fresh.length}; }catch(e){ return null; } };

function hpVhMerge(s,peer){ try{ const el=hpCpEl; const card=Array.from(s.children||[]).filter(x=>x&&x.className==='cp-ch').pop(); if(!card) return 0; const voices=hpVhRows(peer).slice(-HP_VH_ROWS); if(!voices.length) return 0; hpF378Css();
    let box=card.querySelector('.box'); const calls=(typeof hpCdHist==='function')?hpCdHist(peer):[]; if(!box){ const nt=card.querySelector('.nt'); if(nt&&card.removeChild) card.removeChild(nt); box=el('div','box'); card.appendChild(box); }
    const items=Array.from(box.children||[]).map((e,i)=>({ts:Number(calls[i]&&calls[i].ts)||0,e:e})); const h=(typeof histLoad==='function')?histLoad(peer):[]; const th=Number(hpMarkLoad(HP_VH_KEY)[peer])||0, set=hpVhHeardSet(peer);
    for(const m of voices){ const ts=Number(m.ts)||0; const r=el('div','r vh'+(hpVhHeard(peer,m,set,th)?'':' new')); r.setAttribute('data-ts',String(ts)); r.appendChild(el('span','ar','🎤')); r.appendChild(el('span','w',(typeof hpCdWhen==='function')?hpCdWhen(ts):''));
      const tx=hpVhTx(h,m), du=(typeof hpVcDur==='function')?hpVcDur(m.file&&m.file.name):''; const t=el('span','t'+(tx?'':' nx'),tx||(du?TF('cl_vh_row',{d:du}):T('cl_vh_t'))); t.onclick=()=>{ try{ t.__keep=!t.classList.contains('open'); t.classList.toggle('open'); }catch(e){} }; r.appendChild(t);
      const b=el('button','rp','▶︎'); b.type='button'; b.title=T('cl_vh_play1'); try{ b.setAttribute('aria-label',b.title); }catch(e){} b.onclick=ev=>{ try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){} const R=HP_VH_P; if(R&&R.peer===peer&&String(Number(R.list[R.i]&&R.list[R.i].ts)||0)===String(ts)){ hpVhPP(peer); } else hpVhPlay(peer,{ts:ts}); }; r.appendChild(b); items.push({ts:ts,e:r}); }
    items.sort((a,b)=>b.ts-a.ts); while(box.firstChild) box.removeChild(box.firstChild); for(const x of items) box.appendChild(x.e); hpVhUi(); return voices.length; }catch(e){ return 0; } }
try{ if(typeof hpCdHistInto==='function'&&!hpCdHistInto.__f378){ const f=hpCdHistInto; hpCdHistInto=Object.assign(function(s,peer){ const n=f.apply(this,arguments); try{ hpVhMerge(s,peer); }catch(e){} return n; },f,{__f378:1}); } }catch(e){}

function hpCdShort(ds,d){ try{ const x=ds.find(y=>y.dev===d); if(!x) return String(d||'').slice(2,10); const full=String(x.label||''); const sh=full.split(' \u00b7 ')[0].trim(); if(!sh) return full; const dup=ds.some(y=>y.dev!==d&&String(y.label||'').split(' \u00b7 ')[0].trim()===sh); return dup?full:sh; }catch(e){ return ''; } }
hpCdRowText=function(peer){ try{ const ds=hpRsDevs(); const a=hpCdGet(peer); const pri=hpFwdPri(peer); if(pri) return TF('cl_cd_prirow',{d:hpCdShort(ds,pri)}); if(a&&a.length) return hpCdShort(ds,a[0]); return T('cl_cd_all2'); }catch(e){ return ''; } };

const HP_LOGL_LINES=8, HP_LOGL_CHARS=600;
function hpLogLetterIs(t){ return typeof t==='string'&&/^# Handpost\b/.test(t); }
function hpF378WrapLng(){ try{ if(typeof hpLngIs!=='function'||hpLngIs.__f378) return !!(typeof hpLngIs==='function'); const f=hpLngIs; hpLngIs=Object.assign(function(t){ const n=f.apply(this,arguments); if(n) return n; try{ if(hpLogLetterIs(t)){ const k=t.split('\n').length; if(k>=HP_LOGL_LINES||t.length>=HP_LOGL_CHARS) return k; } }catch(e){} return 0; },f,{__f378:1}); return true; }catch(e){ return false; } }
try{ hpF378WrapLng(); if(typeof setTimeout==='function'){ setTimeout(hpF378WrapLng,0); setTimeout(hpF378WrapLng,800); setTimeout(hpF378WrapLng,3000); } if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('DOMContentLoaded',hpF378WrapLng); }catch(e){}
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f378){ const f=hpSegSync; hpSegSync=Object.assign(function(){ try{ hpF378WrapLng(); }catch(e){} return f.apply(this,arguments); },f,{__f378:1}); } }catch(e){}

var HP_F379_CSS='html body #p-call.cp-fit>*{max-width:560px!important;width:100%;margin-left:auto!important;margin-right:auto!important;box-sizing:border-box}'
 +'#p-call.cp-fit .cp-ch{flex:0 1 auto!important}#p-call.cp-fit .cp-ch .box{flex:0 1 auto!important;max-height:min(240px,40vh)!important}'
 +'#p-call.cp-vhon .cp-ch{display:none!important}#p-call .cp-vm.on .ctx.has{max-height:none;font-size:15px;line-height:1.6;margin:10px 0 0;padding:6px 0 6px 10px}#p-call .cp-vm .ctx .cw{display:block;font-size:12px;color:var(--dim,#8aa0c0);margin-bottom:2px}#p-call .cp-vm .ctx .nx{color:var(--dim,#8aa0c0)}';
function hpF379Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f379-css')) return false; const st=document.createElement('style'); st.id='hp-f379-css'; st.textContent=HP_F379_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ if(typeof hpVhUi==='function'&&!hpVhUi.__f379){ const f=hpVhUi; hpVhUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpF379Css(); const R=(typeof HP_VH_P!=='undefined')?HP_VH_P:null; const pc=document.getElementById('p-call'); const m=R?R.list[R.i]:null;
      const on=!!(pc&&R&&m&&typeof HP_CP!=='undefined'&&HP_CP&&HP_CP.peer===R.peer); if(pc&&pc.classList) pc.classList.toggle('cp-vhon',on);
      for(const c of Array.from(document.querySelectorAll('#p-call .cp-vm'))){ const cx=c.querySelector('.ctx'); if(!cx) continue; const mine=!!(on&&c.getAttribute&&c.getAttribute('data-peer')===R.peer);
        if(!mine){ cx.textContent=''; cx.classList.toggle('has',false); continue; } let tx=''; try{ tx=hpVhTx((typeof histLoad==='function')?histLoad(R.peer):[],m); }catch(e){ tx=''; }
        cx.textContent=''; const w=document.createElement('span'); w.className='cw'; w.textContent=(typeof hpCdWhen==='function')?hpCdWhen(Number(m.ts)||0):''; cx.appendChild(w); const t=document.createElement('span'); t.className=tx?'tx':'nx'; t.textContent=tx||T('cl_vh_notx'); cx.appendChild(t); cx.classList.toggle('has',true); } }catch(e){} return r; },f,{__f379:1}); } }catch(e){}
try{ if(typeof hpCallUiRender==='function'&&!hpCallUiRender.__f379){ const f=hpCallUiRender; hpCallUiRender=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpF379Css(); hpVhUi(); }catch(e){} return r; },f,{__f379:1}); } }catch(e){}

var HP_F380_CSS='#p-call .cp-row .nm{flex:1 1 0!important;min-width:0!important;max-width:none!important}#p-call .cp-row .nm .cp-sub{white-space:normal!important;overflow:hidden;line-height:1.35}#p-call .cp-row .nm .cp-sub:before{display:none!important}#p-call .cp-row .nm .cp-sub .cpn:first-child:before{content:"";display:inline-block;width:7px;height:7px;border-radius:50%;background:#e0566b;margin-right:6px;vertical-align:1px}#p-call .cp-row .nm .cp-sub .cpn{display:inline;white-space:nowrap;color:inherit;font:inherit;margin:0}#p-call .cp-row .cdv{flex:0 0 auto!important;max-width:45%!important}'
 +'#p-call.cp-fit.cp-vhon .cp-vm{flex:1 1 auto!important;display:flex!important;flex-direction:column;min-height:0}'
 +'#p-call.cp-fit.cp-vhon .cp-vm .ctx.has{display:flex!important;flex-direction:column;flex:1 1 auto;min-height:0;max-height:none!important;overflow:hidden;margin:14px 0 6px!important;padding:14px 16px 8px!important;border-left:none!important;border:1px solid rgba(45,212,191,.35);border-radius:14px;background:rgba(45,212,191,.06);font-size:18px!important;line-height:1.6!important}'
 +'#p-call.cp-fit.cp-vhon .cp-vm .ctx .cw{flex:0 0 auto;font-size:13px;margin-bottom:6px}#p-call.cp-fit.cp-vhon .cp-vm .ctx .tx,#p-call.cp-fit.cp-vhon .cp-vm .ctx .nx{flex:0 0 auto;max-height:40%;overflow:auto}'
 +'#p-call .cp-vm .ctx .q{display:none}#p-call.cp-fit.cp-vhon .cp-vm .ctx .q{display:block;flex:1 1 auto;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch;margin-top:12px;border-top:1px solid rgba(45,212,191,.25);padding-top:6px;font-size:13px;line-height:1.4}'
 +'#p-call .cp-vm .ctx .q .qi{display:flex;gap:10px;align-items:baseline;padding:7px 6px;border-radius:8px;cursor:pointer;color:var(--dim,#8aa0c0)}#p-call .cp-vm .ctx .q .qi .qw{flex:0 0 auto;min-width:84px}#p-call .cp-vm .ctx .q .qi .qt{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
 +'#p-call .cp-vm .ctx .q .qi.new .qw{color:var(--teal);font-weight:bold}#p-call .cp-vm .ctx .q .qi.cur{background:rgba(45,212,191,.16);color:inherit;font-weight:bold}';
function hpF380Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f380-css')) return false; const st=document.createElement('style'); st.id='hp-f380-css'; st.textContent=HP_F380_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
function hpVhJump(j){ const R=(typeof HP_VH_P!=='undefined')?HP_VH_P:null; if(!R) return false; j=Number(j); if(!(j>=0&&j<R.list.length)) return false; if(j===R.i&&!R.paused) return false;
  R.i=j; R.ig++; R.paused=false; try{ if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); }catch(e){} try{ if(R.endAu) R.endAu('stop'); }catch(e){} try{ if(R.wake){ const w=R.wake; R.wake=null; w(); } }catch(e){} try{ hpVhUi(); }catch(e){} return true; }
try{ if(typeof hpVhUi==='function'&&!hpVhUi.__f380){ const f=hpVhUi; hpVhUi=Object.assign(function(){ try{ hpF380Css(); }catch(e){} const r=f.apply(this,arguments);
    try{ const R=(typeof HP_VH_P!=='undefined')?HP_VH_P:null; if(!R||!R.list||!R.list.length) return r; const h=(typeof histLoad==='function')?histLoad(R.peer):[]; const th=Number(hpMarkLoad(HP_VH_KEY)[R.peer])||0, set=hpVhHeardSet(R.peer);
      for(const c of Array.from(document.querySelectorAll('#p-call .cp-vm'))){ const cx=c.querySelector('.ctx'); if(!cx||!cx.classList.contains('has')) continue; if(!(c.getAttribute&&c.getAttribute('data-peer')===R.peer)) continue;
        const q=document.createElement('div'); q.className='q'; let cur=null;
        R.list.forEach((m,j)=>{ const it=document.createElement('div'); it.className='qi'+(j===R.i?' cur':'')+(hpVhHeard(R.peer,m,set,th)?'':' new'); it.setAttribute('data-i',String(j));
          const w=document.createElement('span'); w.className='qw'; w.textContent=(typeof hpCdWhen==='function')?hpCdWhen(Number(m.ts)||0):''; it.appendChild(w);
          let tx=''; try{ tx=hpVhTx(h,m); }catch(e){ tx=''; } const du=(typeof hpVcDur==='function')?hpVcDur(m.file&&m.file.name):''; const t=document.createElement('span'); t.className='qt'; t.textContent=tx||(du?TF('cl_vh_row',{d:du}):T('cl_vh_t')); it.appendChild(t);
          it.onclick=ev=>{ try{ ev.preventDefault(); }catch(e){} hpVhJump(j); }; q.appendChild(it); if(j===R.i) cur=it; });
        cx.appendChild(q); try{ if(cur&&typeof cur.offsetTop==='number'&&typeof q.scrollTop==='number'){ const top=cur.offsetTop-(q.offsetTop||0); q.scrollTop=Math.max(0,top-Math.round((q.clientHeight||0)/3)); } }catch(e){} } }catch(e){} return r; },f,{__f380:1}); } }catch(e){}

try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f380){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ try{ hpF380Css(); }catch(e){} const r=f.apply(this,arguments); try{ for(const c of Array.from((s&&s.children)||[])){ const sub=c&&c.querySelector?c.querySelector('.cp-sub'):null; if(!sub||sub.__f380) continue; sub.__f380=1; const parts=String(sub.textContent||'').split(' · '); if(parts.length<2) continue; sub.textContent=''; parts.forEach((t,i)=>{ if(i) sub.appendChild(document.createTextNode(' \u00b7 ')); const sp=document.createElement('span'); sp.className='cpn'; sp.textContent=t; sub.appendChild(sp); }); } }catch(e){} return r; },f,{__f380:1}); } }catch(e){}

const HP_OUT_DONE=new Map(), HP_OUT_DONE_MS=600e3, HP_OUT_TOLD=new Set(), HP_LATE_RING_MS=30000;
function hpOutDoneAdd(C){ try{ if(!C||C.dir!=='out'||!C.id) return false; const now=Date.now(); for(const [k,v] of HP_OUT_DONE) if(now-v.at>HP_OUT_DONE_MS) HP_OUT_DONE.delete(k); HP_OUT_DONE.set(C.id,{peer:C.peer,at:now}); return true; }catch(e){ return false; } }
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f381){ const f=hpCallEnd; hpCallEnd=Object.assign(function(why,text){ try{ const C=HP_CALL; if(C&&C.st!=='ended') hpOutDoneAdd(C); }catch(e){} return f.apply(this,arguments); },f,{__f381:1}); } }catch(e){}
function hpOutOver(r,o){ try{ if(!r||!o||o.v!==1||typeof o.call!=='string'||(o.type!=='callring'&&o.type!=='callans'&&o.type!=='callpo')) return false; const d=HP_OUT_DONE.get(o.call); if(!d||d.peer!==r.from) return false;
    const C=HP_CALL; if(C&&C.id===o.call&&C.st!=='ended') return false; const key=o.call+':'+String(r.fromDev||''); if(HP_OUT_TOLD.has(key)) return true; HP_OUT_TOLD.add(key);
    const ago=Math.round((Date.now()-d.at)/1000); hpLog('通話：'+nickOf(r.from)+' の端末が、もう終わった呼び出し（'+ago+' 秒前に終わった）に'+(o.type==='callans'?'応答した':'応じた')+'ので、終わっていると知らせた');
    try{ Promise.resolve(hpCallSig(r.from,{v:1,type:'callend',call:o.call,why:'over'},r.fromDev?[r.fromDev]:null)).catch(()=>{}); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f381){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){
    let age=0; try{ age=Date.now()-Number(r&&r.sentAt); }catch(e){ age=0; }
    try{ if(hpOutOver(r,o)) return; }catch(e){}
    try{ const C=HP_CALL; if(r&&o&&o.v===1&&o.type==='callend'&&o.why==='over'&&C&&C.id===o.call&&C.peer===r.from&&C.dir==='in'&&C.st!=='ended'){ C.byeSent=true; hpLog('通話：かけた人はもう切っていた（遅れて届いた呼び出し）'); hpCallEnd('peer:over',T('cl_over_late')); return; } }catch(e){}
    const res=await f.apply(this,arguments);
    try{ const C=HP_CALL; if(r&&o&&o.type==='call'&&C&&C.dir==='in'&&C.id===o.call&&C.st==='ringing'&&age>HP_LATE_RING_MS&&!C.lateS){ C.lateS=Math.round(age/1000); hpLog('通話：'+C.lateS+' 秒前の呼び出しを鳴らす（もう切れているかもしれない）'); hpCallUi(); } }catch(e){}
    return res; },f,{__f381:1}); } }catch(e){}

try{ if(typeof hpLkOnSig==='function'&&!hpLkOnSig.__f381){ const f=hpLkOnSig; hpLkOnSig=Object.assign(async function(r,o){
    let age=0; try{ age=Date.now()-Number(r&&r.sentAt); }catch(e){ age=0; }
    try{ const C=HP_CALL; if(r&&o&&o.v===1&&o.type==='callend'&&o.why==='over'&&C&&C.id===o.call&&C.peer===r.from&&C.dir==='in'&&C.st!=='ended'){ try{ hpCallGone(o.call); }catch(e){} C.byeSent=true; hpLog('通話：かけた人はもう切っていた（遅れて届いた呼び出し）'); hpCallEnd('peer:over',T('cl_over_late')); return; } }catch(e){}
    const res=await f.apply(this,arguments);
    try{ const C=HP_CALL; if(r&&o&&o.type==='call'&&C&&C.dir==='in'&&C.id===o.call&&C.st==='ringing'&&age>HP_LATE_RING_MS&&!C.lateS){ C.lateS=Math.round(age/1000); hpLog('通話：'+C.lateS+' 秒前の呼び出しを鳴らす（もう切れているかもしれない）'); hpCallUi(); } }catch(e){}
    return res; },f,{__f381:1}); } }catch(e){}
var HP_F381_CSS='#hp-call .hp-late{font-size:13px;color:#f0b35a;margin:6px 16px 0;text-align:center;line-height:1.4}';
function hpF381Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f381-css')) return false; const st=document.createElement('style'); st.id='hp-f381-css'; st.textContent=HP_F381_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f381){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=HP_CALL, d=document.getElementById('hp-call'); if(!d) return r; let el=d.querySelector?d.querySelector('.hp-late'):null;
      const want=!!(C&&C.dir==='in'&&C.st==='ringing'&&C.lateS); if(!want){ if(el&&el.parentNode) el.parentNode.removeChild(el); return r; } hpF381Css();
      if(!el){ el=document.createElement('div'); el.className='hp-late'; const st=d.querySelector('.st'); if(st&&st.parentNode) st.parentNode.insertBefore(el,st.nextSibling); else d.appendChild(el); } el.textContent=TF('cl_late_ring',{s:C.lateS}); }catch(e){} return r; },f,{__f381:1}); } }catch(e){}

var HP_F382_CSS='#p-call .cp-set .cp-kv{flex-direction:column!important;align-items:stretch!important;justify-content:flex-start!important;gap:8px!important}#p-call .cp-set .cp-kv .kl{white-space:normal!important}#p-call .cp-set .cp-kv select{width:100%!important;max-width:none!important;flex:0 0 auto!important;text-overflow:clip}';
function hpF382Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f382-css')) return false; const st=document.createElement('style'); st.id='hp-f382-css'; st.textContent=HP_F382_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f382){ const f=hpCallUiList; hpCallUiList=Object.assign(function(){ try{ hpF382Css(); }catch(e){} return f.apply(this,arguments); },f,{__f382:1}); } }catch(e){}

const HP_VH_IC={prev:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',next:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>',
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',pause:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',stop:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z"/></svg>'};
var HP_F383_CSS='#p-call.cp-fit.cp-vhon .cp-vm>*:not(.ctx){flex:0 0 auto!important;min-height:auto!important}'
 +'#p-call.cp-fit .cp-hero{flex-direction:column!important;align-items:center!important;gap:6px!important;padding:2px 0 0!important}#p-call.cp-fit .cp-hero .av{width:64px!important;height:64px!important;flex:0 0 64px!important;font-size:24px!important}#p-call.cp-fit .cp-hero b{font-size:19px!important;margin:0!important}'
 +'#p-call .cp-vm.v2{background:#121b2c;border-radius:16px;padding:12px 16px 12px;margin:10px 0 0!important;box-sizing:border-box}#p-call .cp-vm.v2 .hd{display:flex;align-items:center;justify-content:space-between;gap:10px}#p-call .cp-vm.v2 .hd h3{margin:0!important}'
 +'#p-call .cp-vm.v2 .cnt{font-size:12px;color:var(--dim,#8aa0c0);background:#1b2740;border-radius:999px;padding:3px 10px;white-space:nowrap}#p-call .cp-vm.v2 .cnt.hot{color:#0b1220;background:var(--teal)}#p-call .cp-vm.v2 .miss{margin:8px 0 0!important}#p-call .cp-vm.v2 .nt{margin:8px 0 0!important}'
 +'#p-call .cp-vm.v2 .ctl{display:flex!important;align-items:center;justify-content:center;gap:26px!important;margin:12px 0 2px}'
 +'#p-call .cp-vm.v2 .ctl button{border:none!important;background:transparent!important;width:44px!important;height:44px!important;min-width:0!important;padding:0!important;border-radius:50%!important;display:flex!important;align-items:center;justify-content:center;color:#dfe7f3!important;font-size:0!important}'
 +'#p-call .cp-vm.v2 .ctl button svg{width:24px;height:24px;fill:currentColor;display:block}#p-call .cp-vm.v2 .ctl button.pp{width:62px!important;height:62px!important;background:var(--teal)!important;color:#0b1220!important;box-shadow:0 4px 14px rgba(45,212,191,.25)}#p-call .cp-vm.v2 .ctl button.pp svg{width:28px;height:28px}'
 +'#p-call .cp-vm.v2 .ctl button:disabled{opacity:.35!important}#p-call .cp-vm.v2 .ctl .prev,#p-call .cp-vm.v2 .ctl .next{visibility:hidden}#p-call .cp-vm.v2.on .ctl .prev,#p-call .cp-vm.v2.on .ctl .next{visibility:visible}'
 +'#p-call .cp-vm.v2 .st2{display:flex;align-items:center;justify-content:space-between;gap:10px;min-height:28px;margin-top:4px}#p-call .cp-vm.v2:not(.on) .st2{display:none}#p-call .cp-vm.v2 .st2 .now{font-size:12px;color:var(--dim,#8aa0c0)}'
 +'#p-call .cp-vm.v2 .st2 button.stop{display:inline-flex!important;align-items:center;gap:4px;font-size:12px!important;padding:4px 10px!important;border-radius:999px!important;border:1px solid var(--line,#2b3a5a)!important;background:transparent!important;color:var(--dim,#8aa0c0)!important;height:auto!important;min-width:0!important}#p-call .cp-vm.v2 .st2 button.stop svg{width:12px;height:12px;fill:currentColor}';
function hpF383Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f383-css')) return false; const st=document.createElement('style'); st.id='hp-f383-css'; st.textContent=HP_F383_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
hpVhInto=function(s,peer){ try{ const el=hpCpEl; hpF375Css(); hpF378Css(); hpF383Css(); const card=el('div','cp-vm v2'); card.setAttribute('data-peer',peer);
    const all=hpVhRows(peer), fresh=hpVhNew(peer); const hd=el('div','hd'); hd.appendChild(el('h3',null,T('cl_vh_t'))); if(all.length){ const c=el('span','cnt'+(fresh.length?' hot':''),fresh.length?TF('cl_vh_cnt2',{n:all.length,k:fresh.length}):TF('cl_vh_cnt',{n:all.length})); hd.appendChild(c); } card.appendChild(hd);
    const miss=hpCmNew(peer); if(miss.length){ const last=miss[miss.length-1]; card.appendChild(el('div','miss',TF('cl_cm_have',{n:miss.length,w:(typeof hpCdWhen==='function')?hpCdWhen(Number(last.ts)||0):''}))); hpMarkSet(HP_CM_KEY,peer,Number(last.ts)||0); }
    if(!all.length){ card.appendChild(el('div','nt',T('cl_vh_none'))); s.appendChild(card); return {miss:miss.length,all:0,fresh:0}; }
    const ctl=el('div','ctl'); const mk=(cls,ic,lab,fn)=>{ const b=el('button',cls); b.type='button'; b.innerHTML=HP_VH_IC[ic]; b.title=lab; try{ b.setAttribute('aria-label',lab); }catch(e){} b.onclick=ev=>{ try{ ev.preventDefault(); }catch(e){} fn(); }; return b; };
    ctl.appendChild(mk('prev','prev',T('cl_vh_prev'),()=>hpVhGo(-1))); ctl.appendChild(mk('pp'+(fresh.length?' hot':''),'play',T('cl_vh_play'),()=>hpVhPP(peer))); ctl.appendChild(mk('next','next',T('cl_vh_next'),()=>hpVhGo(1))); card.appendChild(ctl);
    const st=el('div','st2'); st.appendChild(el('span','now','')); const sb=mk('stop','stop',T('cl_vh_stop'),()=>hpVhStop()); sb.appendChild(document.createTextNode(T('cl_vh_stop'))); st.appendChild(sb); card.appendChild(st); card.appendChild(el('div','ctx',''));
    s.appendChild(card); hpVhUi(); return {miss:miss.length,all:all.length,fresh:fresh.length}; }catch(e){ return null; } };

try{ if(typeof hpVhUi==='function'&&!hpVhUi.__f383){ const f=hpVhUi; hpVhUi=Object.assign(function(){ try{ hpF383Css(); }catch(e){} const r=f.apply(this,arguments);
    try{ const R=(typeof HP_VH_P!=='undefined')?HP_VH_P:null; for(const c of Array.from(document.querySelectorAll('#p-call .cp-vm.v2'))){ const pp=c.querySelector('button.pp'); if(!pp) continue; const mine=!!(R&&c.getAttribute('data-peer')===R.peer); const ic=(mine&&!R.paused)?'pause':'play'; if(pp.__ic!==ic||!pp.querySelector||!pp.querySelector('svg')){ pp.innerHTML=HP_VH_IC[ic]; pp.__ic=ic; } } }catch(e){} return r; },f,{__f383:1}); } }catch(e){}

var HP_F384_CSS='#p-call.cp-vhon .cp-cd,#p-call.cp-vhon details.cp-why{display:none!important}'
 +'#p-call.cp-fit.cp-vhon .cp-vm.v2 .ctx.has{font-size:16px!important;line-height:1.75!important;padding:12px 14px 8px!important}'
 +'#p-call.cp-fit.cp-vhon .cp-vm.v2 .ctx .tx{white-space:pre-wrap!important;word-break:normal;overflow-wrap:anywhere;letter-spacing:.02em;max-height:50%!important;overflow:auto!important;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding-right:4px}'
 +'#p-call.cp-fit.cp-vhon .cp-vm.v2.vmore:not(.xp) .ctx .tx{-webkit-mask-image:linear-gradient(#000 78%,transparent);mask-image:linear-gradient(#000 78%,transparent)}'
 +'#p-call .cp-vm.v2 .ctx .xb{display:none}#p-call.cp-fit.cp-vhon .cp-vm.v2.vmore .ctx .xb,#p-call.cp-fit.cp-vhon .cp-vm.v2.xp .ctx .xb{display:inline-flex!important;align-self:flex-end;flex:0 0 auto;margin:6px 0 0;padding:3px 12px!important;font-size:12px!important;line-height:1.5;border-radius:999px!important;border:1px solid rgba(45,212,191,.45)!important;background:transparent!important;color:var(--teal)!important;height:auto!important;min-width:0!important;cursor:pointer}'
 +'#p-call.cp-fit.cp-vhon .cp-vm.v2.xp .ctx .tx{flex:1 1 auto!important;max-height:none!important;min-height:0}#p-call.cp-fit.cp-vhon .cp-vm.v2.xp .ctx .q{display:none!important}';
function hpF384Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f384-css')) return false; const st=document.createElement('style'); st.id='hp-f384-css'; st.textContent=HP_F384_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }

function hpVhParas(t){ try{ let s=String(t==null?'':t).replace(/\r\n?/g,'\n').replace(/[ \t　]+/g,' ').trim(); if(!s) return '';
    s=s.replace(/([。！？])\s*(?=[^\s。！？」』）)])/g,'$1\n').replace(/([!?]|[a-zÀ-ɏ)][.])\s+(?=\S)/g,'$1\n'); return s.replace(/\n\s+/g,'\n').replace(/\n{2,}/g,'\n'); }catch(e){ return String(t||''); } }
try{ if(typeof hpVhUi==='function'&&!hpVhUi.__f384){ const f=hpVhUi; hpVhUi=Object.assign(function(){ try{ hpF384Css(); }catch(e){} const r=f.apply(this,arguments);
    try{ const R=(typeof HP_VH_P!=='undefined')?HP_VH_P:null;
      for(const c of Array.from(document.querySelectorAll('#p-call .cp-vm.v2'))){ const mine=!!(R&&c.getAttribute&&c.getAttribute('data-peer')===R.peer); const cx=c.querySelector('.ctx');
        if(!mine||!cx||!cx.classList.contains('has')){ c.classList.toggle('xp',false); c.classList.toggle('vmore',false); continue; }
        c.classList.toggle('xp',!!R.xp); const tx=cx.querySelector('.tx'); if(tx){ const p=hpVhParas(tx.textContent); if(p!==tx.textContent) tx.textContent=p; }
        const q=cx.querySelector('.q'); let nx=null; if(q){ const cur=q.querySelector('.qi.cur'); if(cur){ nx=cur.nextSibling||null; try{ q.removeChild(cur); }catch(e){} } }
        if(tx){ const b=document.createElement('button'); b.type='button'; b.className='xb'; b.textContent=T(R.xp?'cl_vh_less':'cl_vh_more'); try{ b.setAttribute('aria-expanded',R.xp?'true':'false'); }catch(e){}
          b.onclick=ev=>{ try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){} const P=(typeof HP_VH_P!=='undefined')?HP_VH_P:null; if(!P) return; P.xp=!P.xp; hpVhUi(); };
          if(q&&q.parentNode===cx) cx.insertBefore(b,q); else cx.appendChild(b); }
        const chk=()=>{ try{ const more=!!(tx&&Number(tx.scrollHeight)>Number(tx.clientHeight)+2); c.classList.toggle('vmore',more); }catch(e){} };
        chk(); try{ if(typeof setTimeout==='function') setTimeout(chk,0); }catch(e){}
        try{ if(q&&typeof q.scrollTop==='number'){ q.scrollTop=(nx&&typeof nx.offsetTop==='number')?Math.max(0,nx.offsetTop-(q.offsetTop||0)):0; } }catch(e){} } }catch(e){} return r; },f,{__f384:1}); } }catch(e){}

const HP_VM_MK='_vm', HP_VM_MK_RE=/_vm\.[A-Za-z0-9]+$/, HP_VM_WIN_MS=6*60e3;
function hpVmMailIs(m,h){ try{ if(!m||!m.file) return false; if(HP_VM_MK_RE.test(String(m.file.name||''))) return true; const ts=Number(m.ts)||0; if(!ts) return false;
    return (h||[]).some(c=>c&&c.d==='c'&&c.cl&&(c.cl.r==='miss'||c.cl.r==='dnd')&&!(typeof hpChOut==='function'&&hpChOut(c))&&ts>=(Number(c.ts)||0)&&ts-(Number(c.ts)||0)<=HP_VM_WIN_MS); }catch(e){ return false; } }
try{ if(typeof hpVhRows==='function'&&!hpVhRows.__f385){ const f=hpVhRows; hpVhRows=Object.assign(function(peer){ const all=f.apply(this,arguments); try{ if(!all||!all.length) return all; const h=(typeof histLoad==='function')?histLoad(peer):[]; return all.filter(m=>hpVmMailIs(m,h)); }catch(e){ return all; } },f,{__f385:1}); } }catch(e){}
function hpF385WrapName(){ try{ if(typeof hpVcName!=='function') return false; if(hpVcName.__f385) return true; const f=hpVcName; hpVcName=Object.assign(function(){ const n=f.apply(this,arguments); try{ if(typeof HP_VMR!=='undefined'&&HP_VMR&&typeof n==='string'&&!HP_VM_MK_RE.test(n)) return n.replace(/(\.[A-Za-z0-9]+)$/,HP_VM_MK+'$1'); }catch(e){} return n; },f,{__f385:1}); return true; }catch(e){ return false; } }
try{ hpF385WrapName(); if(typeof setTimeout==='function'){ setTimeout(hpF385WrapName,0); setTimeout(hpF385WrapName,800); setTimeout(hpF385WrapName,3000); } if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('DOMContentLoaded',hpF385WrapName); }catch(e){}

const HP_RSW_DB='hp-rs', HP_RSW_FRESH=6*3600e3; let HP_RSW_LAST=null;
function hpRsWaitCalc(){ try{ const me=(typeof hpRsMe==='function')?hpRsMe():''; if(!me) return null; const com=(typeof hpRsPicked==='function')?hpRsPicked():''; if(!com||com===me) return 0;
    let pri={}; try{ pri=((JSON.parse(localStorage.getItem(HP_RS_KEY)||'null'))||{}).pri||{}; }catch(e){ pri={}; } for(const k of Object.keys(pri)) if(String(pri[k])===me) return 0; return 1; }catch(e){ return null; } }
function hpRsWaitPut(force){ try{ const w=hpRsWaitCalc(); if(w===null||typeof indexedDB==='undefined'||!indexedDB) return false; const now=Date.now(); const was=HP_RSW_LAST;
    if(!force&&was&&was.w===w&&now-was.at<HP_RSW_FRESH) return false; HP_RSW_LAST={w:w,at:now};
    const q=indexedDB.open(HP_RSW_DB,1); q.onupgradeneeded=()=>{ try{ q.result.createObjectStore('kv',{keyPath:'key'}); }catch(e){} };
    q.onsuccess=()=>{ const db=q.result; try{ const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').put({key:'wait',w:w,at:now}); tx.oncomplete=()=>{ try{ db.close(); }catch(e){} }; tx.onerror=()=>{ try{ db.close(); }catch(e){} }; }catch(e){ try{ db.close(); }catch(x){} } }; q.onerror=()=>{};
    if(!was||was.w!==w){ try{ hpLog(w?'通話：この端末は先に鳴る端末ではないので、閉じているときの着信の通知は '+Math.round(HP_FWD_MS/1000)+' 秒待つ（先に鳴る端末で出れば鳴らさない）':'通話：閉じているときの着信の通知はすぐ鳴らす（この端末が先に鳴る端末か、先に鳴る端末が決まっていない）'); }catch(e){} }
    return true; }catch(e){ return false; } }
try{ if(typeof hpRsSave==='function'&&!hpRsSave.__f385){ const f=hpRsSave; hpRsSave=Object.assign(function(){ const r=f.apply(this,arguments); try{ if(typeof setTimeout==='function') setTimeout(()=>hpRsWaitPut(true),0); }catch(e){} return r; },f,{__f385:1}); } }catch(e){}
try{ if(typeof setTimeout==='function'&&typeof window!=='undefined'){ setTimeout(()=>hpRsWaitPut(true),5000); if(typeof setInterval==='function') setInterval(()=>hpRsWaitPut(false),600e3); } }catch(e){}

var HP_F385_CSS='#p-call .cp-vm.v2:not(.on){display:flex!important;flex-wrap:wrap;align-items:center;gap:6px 12px;padding:8px 10px 8px 14px!important;margin:8px 0 0!important}'
 +'#p-call .cp-vm.v2:not(.on) .hd{flex:1 1 auto;min-width:0;justify-content:flex-start!important}#p-call .cp-vm.v2:not(.on) .hd h3{font-size:14px!important}'
 +'#p-call .cp-vm.v2:not(.on) .ctl{flex:0 0 auto;margin:0!important;gap:0!important}#p-call .cp-vm.v2:not(.on) .ctl .prev,#p-call .cp-vm.v2:not(.on) .ctl .next{display:none!important}'
 +'#p-call .cp-vm.v2:not(.on) .ctl button.pp{width:40px!important;height:40px!important;box-shadow:none!important}#p-call .cp-vm.v2:not(.on) .ctl button.pp svg{width:18px!important;height:18px!important}'
 +'#p-call .cp-vm.v2:not(.on) .st2,#p-call .cp-vm.v2:not(.on) .ctx{display:none!important}#p-call .cp-vm.v2:not(.on) .miss,#p-call .cp-vm.v2:not(.on) .nt{flex:0 0 100%;order:9;margin:0!important;font-size:12px}';
function hpF385Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f385-css')) return false; const st=document.createElement('style'); st.id='hp-f385-css'; st.textContent=HP_F385_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ if(typeof hpVhUi==='function'&&!hpVhUi.__f385){ const f=hpVhUi; hpVhUi=Object.assign(function(){ try{ hpF385Css(); }catch(e){} return f.apply(this,arguments); },f,{__f385:1}); } }catch(e){}
try{ if(typeof hpVhInto==='function'&&!hpVhInto.__f385){ const f=hpVhInto; hpVhInto=Object.assign(function(){ try{ hpF385Css(); }catch(e){} return f.apply(this,arguments); },f,{__f385:1}); } }catch(e){}

var HP_F386_CSS='#p-call .cp-pri{display:flex;align-items:center;justify-content:center;gap:4px;margin:2px 12px 0;font-size:13px;color:var(--dim,#8aa0c0)}#p-call .cp-pri .tx{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}#p-call .cp-pri .cdg{flex:0 0 auto;background:transparent;border:none;color:var(--teal,#35d1b7);padding:4px;cursor:pointer;display:inline-flex;align-items:center;font-size:16px;line-height:1}#p-call .cp-pri .cdg .hpi{width:20px;height:20px}#p-call.cp-vhon .cp-pri{display:none!important}'
 +'#p-call .cp-cha{margin:14px 6px 0}#p-call .cp-cha .hd{display:flex;align-items:center;gap:8px;margin:0 0 6px}#p-call .cp-cha h3{margin:0;flex:1 1 auto;font-size:13px;color:var(--dim,#8aa0c0);font-weight:600}#p-call .cp-cha select{flex:0 1 auto;max-width:60%;font-size:13px;padding:4px 6px;border-radius:8px}'
 +'#p-call .cp-cha .box{max-height:min(320px,45vh);overflow:auto;-webkit-overflow-scrolling:touch;border:1px solid #1b2740;border-radius:10px;padding:0 8px}#p-call .cp-cha .box .r:last-child{border-bottom:none}'
 +'#p-call .cp-cha .r{display:flex;align-items:center;gap:8px;padding:7px 4px;border-bottom:1px solid #1b2740;font-size:13px}#p-call .cp-cha .r .ar{flex:0 0 18px;text-align:center;color:var(--teal)}#p-call .cp-cha .r.miss .ar{color:#ff6b6b}'
 +'#p-call .cp-cha .r .who{flex:0 1 auto;max-width:32%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;cursor:pointer}#p-call .cp-cha .r .w{flex:0 0 auto;color:var(--dim,#8aa0c0);font-size:12px}#p-call .cp-cha .r .t{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#p-call .cp-cha .r .t.nx{color:var(--dim,#8aa0c0)}'
 +'#p-call .cp-cha .r.vh.new .w{color:var(--teal);font-weight:bold}#p-call .cp-cha .r .rp{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:1px solid var(--teal);background:transparent;color:var(--teal);font-size:12px;cursor:pointer;padding:0;line-height:1}#p-call .cp-cha .nt{font-size:13px;color:var(--dim,#8aa0c0);padding:8px 0}'
 +'.contact-item .ct-cd .pri{display:inline-block;margin-left:6px;padding:0 6px;border-radius:8px;font-size:11px;font-weight:700;line-height:18px;color:#08201c;background:var(--teal,#35d1b7);white-space:nowrap}'
 +'#chat-head #hp-cvseg{display:inline-flex;flex:0 0 auto;overflow:hidden;background:rgba(53,209,183,.12);border:1px solid var(--teal,#35d1b7);border-radius:18px;color:var(--teal,#35d1b7);font-size:15px;font-weight:700;min-height:36px}#chat-head #hp-cvseg .sg{display:inline-flex;align-items:center;padding:4px 14px;cursor:pointer}#chat-head #hp-cvseg .sg.on{background:rgba(53,209,183,.25)}html body #chat-head.hp-cv #btn-back{display:none!important}';
function hpF386Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f386-css')) return false; const st=document.createElement('style'); st.id='hp-f386-css'; st.textContent=HP_F386_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }

function hpCpPriInto(s,peer){ try{ const el=hpCpEl; hpF386Css(); const old=s.querySelector?s.querySelector('.cp-pri'):null; if(old&&old.parentNode) old.parentNode.removeChild(old); const box=el('div','cp-pri');
    const tx=el('span','tx',(typeof hpCdRowText==='function')?hpCdRowText(peer):''); tx.title=tx.textContent; box.appendChild(tx);
    const g=el('button','cdg'); g.type='button'; g.title=T('cl_cd_gear'); try{ g.setAttribute('aria-label',T('cl_cd_gear')); }catch(e){} try{ g.appendChild((typeof hpIcEl==='function')?hpIcEl('gear'):el('span',null,'⚙')); }catch(e){ g.textContent='⚙'; }
    g.onclick=ev=>{ try{ ev.stopPropagation(); ev.preventDefault(); }catch(e){} try{ if(typeof hpCdAsk==='function') hpCdAsk(peer); }catch(e){} }; box.appendChild(g);
    const hero=Array.from(s.children||[]).find(x=>x&&String(x.className||'').split(' ').includes('cp-hero')); if(hero&&s.insertBefore) s.insertBefore(box,hero.nextSibling||null); else s.appendChild(box); return box; }catch(e){ return null; } }

try{ if(typeof hpCdHistInto==='function'&&!hpCdHistInto.__f386){ const f=hpCdHistInto; hpCdHistInto=Object.assign(function(){ return 0; },{__f386:1,__was:f}); } }catch(e){}
try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f386){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ if(HP_CP&&HP_CP.peer===peer){ for(const c of Array.from(s.children||[])){ if(!c) continue; const k=String(c.className||'').split(' '); if((k.includes('cp-cd')||k.includes('cp-ch'))&&s.removeChild) s.removeChild(c); } hpCpPriInto(s,peer); } }catch(e){} return r; },f,{__f386:1}); } }catch(e){}

var HP_CHA_F='', HP_CHA_MAX=60;
function hpChaItems(f){ const out=[]; try{ const cs=(typeof hpCpContacts==='function')?hpCpContacts():[]; for(const c of cs){ const peer=c&&c.address; if(!peer||(f&&peer!==f)) continue; let h=[]; try{ h=(typeof histLoad==='function')?histLoad(peer):[]; }catch(e){ h=[]; }
      for(const m of (h||[])) if(m&&m.d==='c'&&m.cl) out.push({k:'c',peer:peer,ts:Number(m.ts)||0,m:m,h:h});
      let vs=[]; try{ vs=(typeof hpVhRows==='function')?hpVhRows(peer):[]; }catch(e){ vs=[]; } for(const m of (vs||[])) if(m) out.push({k:'v',peer:peer,ts:Number(m.ts)||0,m:m,h:h}); } }catch(e){} out.sort((a,b)=>b.ts-a.ts); return out.slice(0,HP_CHA_MAX); }
function hpChaWho(peer){ try{ return (typeof nickOf==='function')?nickOf(peer):String(peer||''); }catch(e){ return String(peer||''); } }
function hpChaPick(peer){ HP_CHA_F=String(peer||''); try{ const s=document.getElementById('p-call'); const old=s&&s.querySelector?s.querySelector('.cp-cha'):null; if(old&&old.parentNode){ const tmp={appendChild:x=>old.parentNode.insertBefore(x,old)}; hpChaInto(tmp); old.parentNode.removeChild(old); return true; } }catch(e){} return false; }
function hpChaRow(it,one){ const el=hpCpEl; const peer=it.peer, m=it.m, ts=it.ts; let r;
  if(it.k==='c'){ const out=(typeof hpChOut==='function')&&hpChOut(m); const miss=!out&&m.cl&&m.cl.r==='miss'; r=el('div','r'+(miss?' miss':'')); r.appendChild(el('span','ar',out?'↗':'↙')); }
  else { let heard=true; try{ const th=Number(hpMarkLoad(HP_VH_KEY)[peer])||0; heard=hpVhHeard(peer,m,hpVhHeardSet(peer),th); }catch(e){} r=el('div','r vh'+(heard?'':' new')); r.appendChild(el('span','ar','🎤')); }
  r.setAttribute('data-peer',peer); r.setAttribute('data-ts',String(ts));
  if(!one){ const w=el('span','who',hpChaWho(peer)); w.title=w.textContent; w.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} hpChaPick(peer); }; r.appendChild(w); }
  r.appendChild(el('span','w',(typeof hpCdWhen==='function')?hpCdWhen(ts):''));
  if(it.k==='c'){ let t=''; try{ const out=(typeof hpChOut==='function')&&hpChOut(m); t=(out&&typeof hpChOutText==='function')?hpChOutText(m):(typeof hpChText==='function')?hpChText(m):''; }catch(e){} r.appendChild(el('span','t',t)); }
  else { let tx=''; try{ tx=(typeof hpVhTx==='function')?hpVhTx(it.h,m):''; }catch(e){} const du=(typeof hpVcDur==='function')?hpVcDur(m.file&&m.file.name):''; const t=el('span','t'+(tx?'':' nx'),tx||(du?TF('cl_vh_row',{d:du}):T('cl_vh_t'))); t.title=t.textContent; r.appendChild(t);
    const b=el('button','rp','▶︎'); b.type='button'; b.title=T('cl_vh_play1'); try{ b.setAttribute('aria-label',b.title); }catch(e){} b.onclick=ev=>{ try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){} hpChaPlay(peer,ts); }; r.appendChild(b); }
  return r; }
function hpChaPlay(peer,ts){ try{ if(typeof hpCallUiOne==='function') hpCallUiOne(peer); setTimeout(()=>{ try{ if(typeof hpVhPlay==='function') hpVhPlay(peer,{ts:Number(ts)||0}); }catch(e){} },0); return true; }catch(e){ return false; } }
function hpChaInto(s){ try{ const el=hpCpEl; hpF386Css(); const cs=(typeof hpCpContacts==='function')?hpCpContacts():[]; if(HP_CHA_F&&!cs.some(c=>c&&c.address===HP_CHA_F)) HP_CHA_F='';
    const card=el('div','cp-cha'); const hd=el('div','hd'); hd.appendChild(el('h3',null,T('cl_cha_t'))); const sel=el('select'); sel.id='cp-cha-sel'; sel.title=T('cl_cha_pick'); try{ sel.setAttribute('aria-label',T('cl_cha_pick')); }catch(e){}
    const o0=el('option',null,T('cl_cha_all')); o0.value=''; sel.appendChild(o0); for(const c of cs){ if(!c||!c.address) continue; const o=el('option',null,hpChaWho(c.address)); o.value=c.address; sel.appendChild(o); } sel.value=HP_CHA_F; sel.onchange=()=>{ hpChaPick(sel.value); }; hd.appendChild(sel); card.appendChild(hd);
    const items=hpChaItems(HP_CHA_F); if(!items.length){ card.appendChild(el('div','nt',T('cl_ch_none'))); s.appendChild(card); return 0; }
    const box=el('div','box'); for(const it of items){ try{ box.appendChild(hpChaRow(it,!!HP_CHA_F)); }catch(e){} } card.appendChild(box); s.appendChild(card); return items.length; }catch(e){ return -1; } }
try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f386){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ const sets=Array.from(s.children||[]).filter(x=>x&&x.className==='cp-set'); const st=sets.find(x=>x.querySelector&&x.querySelector('#cp-rs-sel'))||sets[sets.length-1]; if(st&&st.parentNode===s&&s.insertBefore){ const nx=st.nextSibling; hpChaInto({appendChild:x=>s.insertBefore(x,nx||null)}); } else hpChaInto(s); }catch(e){} return r; },f,{__f386:1}); } }catch(e){}

function hpCtPriMark(box,peer){ try{ if(!box||!box.querySelectorAll) return 0; const pri=(typeof hpFwdPri==='function')?String(hpFwdPri(peer)||''):''; let n=0;
    for(const l of Array.from(box.querySelectorAll('label'))){ const ck=l.querySelector?l.querySelector('input'):null; let t=l.querySelector?l.querySelector('.pri'):null; const on=!!(pri&&ck&&ck.__dev===pri&&ck.checked);
      if(on&&!t){ t=document.createElement('span'); t.className='pri'; t.textContent=T('cl_pri_tag'); l.appendChild(t); } else if(!on&&t&&l.removeChild) l.removeChild(t); if(on) n++; } return n; }catch(e){ return 0; } }
function hpCtPriAll(){ let n=0; try{ if(typeof document==='undefined') return 0; hpF386Css(); const cs=(typeof contacts==='function')?contacts():[]; const rows=Array.from(document.querySelectorAll('#contact-list .contact-item'));
    cs.forEach((c,i)=>{ const row=rows[i]; if(!row||!c||!c.address) return; const box=row.querySelector('.ct-cd'); if(!box) return; const peer=c.address; n+=hpCtPriMark(box,peer); if(!box.__f386){ box.__f386=1; try{ box.addEventListener('change',()=>{ try{ hpCtPriMark(box,peer); }catch(e){} }); }catch(e){} } }); }catch(e){} return n; }
function hpF386WrapRc(){ try{ if(typeof renderContacts!=='function'||!renderContacts.__f372) return false; if(renderContacts.__f386) return true; const f=renderContacts; renderContacts=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpCtPriAll(); }catch(e){} return v; },f,{__f386:1}); try{ hpCtPriAll(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpF372Wrap==='function'&&!hpF372Wrap.__f386){ const f=hpF372Wrap; hpF372Wrap=Object.assign(function(){ const n=f.apply(this,arguments); try{ hpF386WrapRc(); }catch(e){} return n; },f,{__f386:1}); } }catch(e){}

function hpCvToCall(){ try{ const peer=(typeof CURPEER!=='undefined')?String(CURPEER||''):''; if(typeof showConvList==='function') showConvList(); try{ if(typeof hpCallMenuMount==='function') hpCallMenuMount(); if(typeof hpCallPanelMount==='function') hpCallPanelMount(); }catch(e){}
    if(typeof hpCallOpen==='function') hpCallOpen(); const ok=!!(peer&&(typeof hpCpContacts==='function')&&hpCpContacts().some(c=>c&&c.address===peer)); if(ok&&typeof hpCallUiOne==='function') hpCallUiOne(peer); try{ if(typeof hpSegSync==='function') hpSegSync(); }catch(e){} return ok?peer:''; }catch(e){ return ''; } }
function hpCvSegMount(){ try{ if(typeof document==='undefined'||!document.getElementById) return null; const hd=document.getElementById('chat-head'), bk=document.getElementById('btn-back'); if(!hd||!bk) return null; let sg=document.getElementById('hp-cvseg'); if(sg) return sg; hpF386Css();
    sg=document.createElement('div'); sg.id='hp-cvseg'; try{ sg.setAttribute('role','group'); }catch(e){} const mk=(id,k,on)=>{ const b=document.createElement('span'); b.className='sg'+(on?' on':''); b.id=id; b.setAttribute('data-i18n',k); b.textContent=T(k); sg.appendChild(b); return b; };
    const a=mk('hp-cv-chat','tab_chat',true), c=mk('hp-cv-call','cl_menu_l',false); a.onclick=()=>{ try{ const b2=document.getElementById('btn-back'); if(b2&&typeof b2.click==='function') b2.click(); else if(typeof showConvList==='function') showConvList(); }catch(e){} }; c.onclick=()=>{ hpCvToCall(); };
    hd.insertBefore(sg,bk); if(hd.classList) hd.classList.add('hp-cv'); return sg; }catch(e){ return null; } }
try{ hpCvSegMount(); setTimeout(hpCvSegMount,0); }catch(e){}
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f386){ const f=hpSegSync; hpSegSync=Object.assign(function(){ const r=f.apply(this,arguments); try{ if(!document.getElementById('hp-cvseg')) hpCvSegMount(); }catch(e){} return r; },f,{__f386:1}); } }catch(e){}

var HP_F387_CSS='.contact-item details.ct-cdf,.contact-item details.ct-setf{margin-top:6px}.contact-item details.ct-cdf>summary,.contact-item details.ct-setf>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12px;color:var(--dim,#8aa0c0);padding:4px 0;user-select:none}'
 +'.contact-item details.ct-cdf>summary::-webkit-details-marker,.contact-item details.ct-setf>summary::-webkit-details-marker{display:none}.contact-item details.ct-cdf>summary::after,.contact-item details.ct-setf>summary::after{content:"▼";font-size:10px;margin-left:2px}.contact-item details.ct-cdf[open]>summary::after,.contact-item details.ct-setf[open]>summary::after{content:"▲"}'
 +'.contact-item details.ct-cdf>summary .cur{color:var(--teal,#35d1b7);font-size:11px}.contact-item details.ct-cdf .ct-cd{margin-top:2px}.contact-item details.ct-cdf .ct-cd label{flex:0 0 100%}.contact-item details.ct-cdf .ct-cd label.cm{padding-bottom:4px;border-bottom:1px solid #26385c}'
 +'.contact-item details.ct-cdf .ct-cd .prr{margin-left:auto;display:inline-flex;align-items:center;gap:4px;font-size:11px;color:var(--dim,#8aa0c0);white-space:nowrap}.contact-item details.ct-cdf .ct-cd .prr input{width:13px;height:13px}.contact-item details.ct-cdf .ct-cd .prr input:disabled+span{opacity:.45}'
 +'.contact-item details.ct-cdf .ct-cd .nt{flex:0 0 100%;font-size:11px;line-height:1.6;color:var(--dim,#8aa0c0);margin-top:2px}'
 +'.contact-item details.ct-cdf .ct-cd .lk{flex:0 0 100%;display:block;text-align:left;background:none;border:none;padding:2px 0;margin:0;font-size:11px;color:var(--teal,#35d1b7);cursor:pointer;text-decoration:underline;text-underline-offset:2px}#p-call .cp-set.hl{outline:2px solid var(--teal);outline-offset:4px;border-radius:8px}#p-help .hl-go{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0 2px}'
 +'html body #p-call:not(.cp-fit){overflow-x:hidden}html body #p-call:not(.cp-fit)>*{max-width:720px;margin-left:auto!important;margin-right:auto!important;box-sizing:border-box}'
 +'html body #p-call .cp-set:has(#cp-rs-sel){background:rgba(53,209,183,.08)!important;border:1px solid rgba(53,209,183,.6)!important;border-radius:12px!important}#p-call .cp-cha select{min-width:0;background:#14203a;color:inherit;border:1px solid #2a3a5a}'
 +'html body .contact-item.hp-inl>button.more{display:none!important}'
 +'html body .contact-item details.ct-setf .cmenu{display:flex!important;flex-direction:column;position:static!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;width:auto!important;min-width:0!important;max-width:none!important;max-height:none!important;margin:4px 0 0!important;z-index:auto!important;box-shadow:none!important;border:none!important;border-radius:0!important;padding:0!important;background:transparent!important;overflow:visible!important}'
 +'html body .contact-item details.ct-setf .cmenu .cm-hd,html body .contact-item details.ct-setf .cmenu>button.x{display:none!important}';
function hpF387Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f387-css')) return false; const st=document.createElement('style'); st.id='hp-f387-css'; st.textContent=HP_F387_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
var HP_CDF_OPEN=new Set(), HP_CSF_OPEN=new Set();
try{ if(typeof hpCtPriMark==='function'&&!hpCtPriMark.__f387){ hpCtPriMark=Object.assign(function(){ return 0; },{__f387:1}); } }catch(e){}
function hpCtDet(cls,open,set,peer){ const d=document.createElement('details'); d.className=cls; if(open) d.open=true; try{ d.addEventListener('toggle',()=>{ try{ if(d.open) set.add(peer); else set.delete(peer); }catch(e){} }); d.addEventListener('click',ev=>{ try{ ev.stopPropagation(); }catch(e){} }); }catch(e){} return d; }
function hpCtCdfSum(sum,peer){ try{ let c=sum.querySelector?sum.querySelector('.cur'):null; if(!c){ c=document.createElement('span'); c.className='cur'; sum.appendChild(c); } c.textContent=(typeof hpCdRowText==='function')?hpCdRowText(peer):''; return c.textContent; }catch(e){ return ''; } }
function hpCtLk(cls,tx,fn){ const b=document.createElement('button'); b.type='button'; b.className=cls; b.textContent=tx; b.onclick=ev=>{ try{ ev.stopPropagation(); ev.preventDefault(); }catch(e){} try{ fn(); }catch(e){} }; return b; }
function hpCpGoSet(){ try{ try{ if(typeof hpCallMenuMount==='function') hpCallMenuMount(); if(typeof hpCallPanelMount==='function') hpCallPanelMount(); }catch(e){} if(typeof hpCallOpen==='function') hpCallOpen(); try{ if(typeof hpSegSync==='function') hpSegSync(); }catch(e){}
    setTimeout(()=>{ try{ const st=Array.from(document.querySelectorAll('#p-call .cp-set')).find(x=>x.querySelector&&x.querySelector('#cp-rs-sel')); if(!st) return; if(st.scrollIntoView) st.scrollIntoView({block:'center',behavior:'smooth'}); if(st.classList){ st.classList.add('hl'); setTimeout(()=>{ try{ st.classList.remove('hl'); }catch(e){} },2500); } }catch(e){} },250); return true; }catch(e){ return false; } }
function hpHelp39Btns(){ try{ if(typeof document==='undefined'||!document.querySelector) return 0; const d=Array.from(document.querySelectorAll('#p-help .hl-q')).find(x=>x.getAttribute&&x.getAttribute('data-q')==='39'); if(!d||d.querySelector('.hl-go')) return 0; hpF387Css(); const w=document.createElement('div'); w.className='hl-go';
    const mk=(k,fn)=>{ const b=document.createElement('button'); b.type='button'; b.className='b'; b.setAttribute('data-i18n',k); b.textContent=T(k); b.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} try{ fn(); }catch(e){} }; w.appendChild(b); return b; };
    mk('hl_go_set',()=>hpCpGoSet()); mk('hl_go_ct',()=>{ const t=document.getElementById('t-contacts'); if(t&&typeof t.click==='function') t.click(); }); d.appendChild(w); return 1; }catch(e){ return 0; } }
try{ if(typeof hpHelpOpen==='function'&&!hpHelpOpen.__f387){ const f=hpHelpOpen; hpHelpOpen=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpHelp39Btns(); }catch(e){} return r; },f,{__f387:1}); } }catch(e){}
function hpCtCdfInto(box,peer,i){ try{ if(!box||box.__f387) return null; box.__f387=1; const par=box.parentNode; if(!par) return null;
    const det=hpCtDet('ct-cdf',HP_CDF_OPEN.has(peer),HP_CDF_OPEN,peer); const sum=document.createElement('summary'); const lb=document.createElement('span'); lb.className='lb2'; lb.textContent=T('cl_cd_l'); sum.appendChild(lb); det.appendChild(sum);
    par.insertBefore(det,box); det.appendChild(box); const old=box.querySelector?box.querySelector('.lb'):null; if(old&&old.parentNode) old.parentNode.removeChild(old);
    const nm='hp-ctpri-'+i+'-'+String(peer).slice(-6), rds=[]; const curPri=(typeof hpCdPriGet==='function')?hpCdPriGet(peer):'';
    const mkR=(dev)=>{ const r=document.createElement('input'); r.type='radio'; r.name=nm; r.value=dev; r.__dev=dev; rds.push(r); r.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} }; r.onchange=()=>{ try{ if(r.checked){ hpCdPriSet(peer,dev); hpCtCdfSum(sum,peer); } }catch(e){} }; return r; };
    const labs=Array.from(box.querySelectorAll('label'));
    { const l=document.createElement('label'); l.className='cm'; const r=mkR(''); r.checked=!curPri; l.appendChild(r); const sp=document.createElement('span'); sp.textContent=T('cl_cd_pri_common'); l.appendChild(sp); l.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} }; box.insertBefore(l,labs[0]||null); box.insertBefore(hpCtLk('lk lk-set',T('cl_cd_common_go'),()=>hpCpGoSet()),labs[0]||null); }
    for(const l of labs){ const ck=l.querySelector?l.querySelector('input'):null; if(!ck||!ck.__dev) continue; const pr=document.createElement('span'); pr.className='prr'; const r=mkR(ck.__dev); r.checked=curPri===ck.__dev; r.disabled=!ck.checked; pr.appendChild(r); const ps=document.createElement('span'); ps.textContent=T('cl_cd_pri'); pr.appendChild(ps); pr.onclick=ev=>{ try{ ev.stopPropagation(); if(ev.target!==r){ ev.preventDefault(); if(!r.disabled&&!r.checked){ r.checked=true; r.onchange(); } } }catch(e){} }; l.appendChild(pr); r.__ck=ck; }
    const nt=document.createElement('div'); nt.className='nt'; nt.textContent=T('cl_cd_ipnote'); box.appendChild(nt); box.appendChild(hpCtLk('lk lk-help',T('cl_cd_helpgo'),()=>{ try{ if(typeof hpHelpGo==='function') hpHelpGo(39); }catch(e){} }));
    try{ box.addEventListener('change',()=>{ try{ let lost=false; for(const r of rds){ if(!r.__ck) continue; r.disabled=!r.__ck.checked; if(r.disabled&&r.checked){ r.checked=false; lost=true; } } if(lost){ rds[0].checked=true; hpCdPriSet(peer,''); } hpCtCdfSum(sum,peer); }catch(e){} }); }catch(e){}
    hpCtCdfSum(sum,peer); return det; }catch(e){ return null; } }
function hpCtSetfInto(row,peer){ try{ const mn=row.querySelector('.cmenu'); if(!mn||mn.__f387) return null; mn.__f387=1; const nm=row.querySelector('.nm')||row;
    const det=hpCtDet('ct-setf',HP_CSF_OPEN.has(peer),HP_CSF_OPEN,peer); const sum=document.createElement('summary'); sum.textContent=T('ct_set_t'); det.appendChild(sum); if(mn.classList) mn.classList.remove('on'); det.appendChild(mn); nm.appendChild(det); if(row.classList) row.classList.add('hp-inl'); return det; }catch(e){ return null; } }
function hpCtInlineAll(){ let n=0; try{ if(typeof document==='undefined'||!document.querySelectorAll) return 0; hpF387Css(); const cs=(typeof contacts==='function')?contacts():[]; const rows=Array.from(document.querySelectorAll('#contact-list .contact-item'));
    cs.forEach((c,i)=>{ const row=rows[i]; if(!row||!c||!c.address) return; const box=row.querySelector('.ct-cd'); if(box&&hpCtCdfInto(box,c.address,i)) n++; if(hpCtSetfInto(row,c.address)) n++; }); }catch(e){} return n; }
function hpF387WrapRc(){ try{ if(typeof renderContacts!=='function') return false; if(renderContacts.__f387) return true; const f=renderContacts; renderContacts=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpCtInlineAll(); }catch(e){} return v; },f,{__f387:1}); try{ hpCtInlineAll(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f387){ const f=hpSegSync; hpSegSync=Object.assign(function(){ try{ hpF387WrapRc(); }catch(e){} try{ hpHelp39Btns(); }catch(e){} return f.apply(this,arguments); },f,{__f387:1}); } }catch(e){}
try{ setTimeout(hpF387WrapRc,3000); }catch(e){}
try{ if(typeof hpCdGoFriends==='function'&&!hpCdGoFriends.__f387){ const f=hpCdGoFriends; hpCdGoFriends=Object.assign(function(peer){ try{ HP_CDF_OPEN.add(String(peer||'')); }catch(e){} const r=f.apply(this,arguments); try{ setTimeout(()=>{ try{ for(const d of Array.from(document.querySelectorAll('#contact-list details.ct-cdf'))){ const b=d.querySelector('.ct-cd'); if(b&&b.classList&&b.classList.contains('hl')) d.open=true; } }catch(e){} },300); }catch(e){} return r; },f,{__f387:1}); } }catch(e){}

var HP_F388_CSS='html body #p-call .cp-row .cdg,html body #p-call .cp-pri .cdg{display:none!important}#p-call .cp-row .cdv,#p-call .cp-pri .tx{cursor:pointer;text-decoration:underline;text-decoration-color:rgba(138,160,192,.5);text-underline-offset:3px}'
 +'html body #p-call:not(.cp-fit)>*{max-width:720px!important}';
HP_F388_CSS+='.contact-item .nm{min-width:0}.contact-item details.ct-cdf{min-width:0;max-width:100%}.contact-item details.ct-cdf .ct-cd label{display:flex!important;min-width:0;max-width:100%}.contact-item details.ct-cdf .ct-cd label>span:not(.prr){flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
 +'.contact-item details.ct-cdf .ct-cd .prr{flex:0 0 56px;justify-content:center;margin-left:auto}.contact-item details.ct-cdf .ct-cd .hdr{flex:0 0 100%;display:flex;align-items:center;font-size:10px;color:var(--dim,#8aa0c0);padding-top:4px}.contact-item details.ct-cdf .ct-cd .hdr .c2{margin-left:auto;flex:0 0 56px;text-align:center}';
function hpF388Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f388-css')) return false; const st=document.createElement('style'); st.id='hp-f388-css'; st.textContent=HP_F388_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
function hpCdGoLink(e,peer){ try{ if(!e||e.__f388) return false; e.__f388=1; e.title=T('cl_cd_gofr'); try{ e.setAttribute('role','link'); }catch(x){} e.onclick=ev=>{ try{ ev.stopPropagation(); ev.preventDefault(); }catch(x){} try{ if(typeof hpCdGoFriends==='function') hpCdGoFriends(peer); }catch(x){} }; return true; }catch(x){ return false; } }
try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f388){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ hpF388Css(); for(const c of Array.from(s.children||[])){ if(!c||c.className!=='cp-row') continue; const peer=(c.getAttribute&&c.getAttribute('data-peer'))||''; const dv=peer&&c.querySelector?c.querySelector('.cdv'):null; if(dv) hpCdGoLink(dv,peer); } }catch(e){} return r; },f,{__f388:1}); } }catch(e){}
try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f388){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ hpF388Css(); const tx=s.querySelector?s.querySelector('.cp-pri .tx'):null; if(tx) hpCdGoLink(tx,peer); }catch(e){} return r; },f,{__f388:1}); } }catch(e){}
function hpCtCdfHdr(box){ try{ if(!box||!box.querySelectorAll||box.querySelector('.hdr')) return 0; hpF388Css(); let n=0; let first=null;
    for(const pr of Array.from(box.querySelectorAll('.prr'))){ for(const sp of Array.from(pr.children||[])){ if(sp&&sp.tag!=='input'&&sp.tagName!=='INPUT'&&String(sp.type||'')!=='radio'){ pr.removeChild(sp); n++; } } const l=pr.parentNode; if(!first&&l) first=l; }
    if(!first) return 0; const h=document.createElement('div'); h.className='hdr'; const c1=document.createElement('span'); c1.className='c1'; c1.textContent=T('cl_cd_can'); const c2=document.createElement('span'); c2.className='c2'; c2.textContent=T('cl_cd_pri'); h.appendChild(c1); h.appendChild(c2); box.insertBefore(h,first); return n; }catch(e){ return -1; } }
try{ if(typeof hpCtCdfInto==='function'&&!hpCtCdfInto.__f388){ const f=hpCtCdfInto; hpCtCdfInto=Object.assign(function(box){ const d=f.apply(this,arguments); try{ if(d) hpCtCdfHdr(box); }catch(e){} return d; },f,{__f388:1}); } }catch(e){}

var HP_F389_CSS='html body #p-call.cp-fit:not(.cp-vhon) .cp-hero{gap:10px!important;padding:12px 0 0!important}html body #p-call.cp-fit:not(.cp-vhon) .cp-hero .av{width:104px!important;height:104px!important;flex:0 0 104px!important;font-size:38px!important}html body #p-call.cp-fit:not(.cp-vhon) .cp-hero b{font-size:24px!important}'
 +'html body #p-call.cp-fit:not(.cp-vhon) .cp-pri{font-size:15px;margin-top:4px}html body #p-call.cp-fit:not(.cp-vhon) .cp-act{gap:48px!important;margin:20px 0 10px!important}html body #p-call.cp-fit:not(.cp-vhon) .cp-act .ring{width:72px!important;height:72px!important}html body #p-call.cp-fit:not(.cp-vhon) .cp-act .ring .hpi{width:32px!important;height:32px!important}html body #p-call.cp-fit:not(.cp-vhon) .cp-act span.l{font-size:14px!important}'
 +'#p-call details.cp-fold{margin:14px 6px 0;border:1px solid #1b2740;border-radius:12px;background:rgba(255,255,255,.02)}#p-call details.cp-fold>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;padding:12px 14px;font-size:14px;color:var(--dim,#8aa0c0);user-select:none}#p-call details.cp-fold>summary::-webkit-details-marker{display:none}#p-call details.cp-fold>summary::after{content:"\u25bc";margin-left:auto;font-size:11px}#p-call details.cp-fold[open]>summary::after{content:"\u25b2"}'
 +'#p-call details.cp-fold>.cp-vm,#p-call details.cp-fold>.cp-ch{margin:0 8px 10px!important}html body #p-call.cp-fit>details.cp-fold{flex:0 1 auto;min-height:0;overflow-y:auto}html body #p-call.cp-vhon details.cp-fold{display:none!important}';
function hpF389Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f389-css')) return false; const st=document.createElement('style'); st.id='hp-f389-css'; st.textContent=HP_F389_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
var HP_CPF_OPEN=new Set();
function hpCpFoldInto(s,peer){ try{ if(!s||!s.children) return null; hpF389Css(); const kids=()=>Array.from(s.children||[]); const has=k=>kids().find(x=>x&&String(x.className||'').split(' ').includes(k));
    if(!has('cp-ch')){ try{ const w=(typeof hpCdHistInto==='function'&&hpCdHistInto.__was)?hpCdHistInto.__was:null; if(w) w(s,peer); }catch(e){} }
    const vmc=has('cp-vm'), ch=has('cp-ch'); if(!vmc&&!ch) return null; const det=document.createElement('details'); det.className='cp-fold'; if(HP_CPF_OPEN.has(peer)) det.open=true;
    try{ det.addEventListener('toggle',()=>{ try{ if(det.open) HP_CPF_OPEN.add(peer); else HP_CPF_OPEN.delete(peer); if(typeof hpCpFit==='function') hpCpFit(); }catch(e){} }); }catch(e){}
    let n=0; try{ n=(typeof hpVhRows==='function')?hpVhRows(peer).length:0; }catch(e){ n=0; } const sum=document.createElement('summary'); sum.textContent=n?TF('cl_fold_t',{n:n}):T('cl_fold_t0'); det.appendChild(sum);
    s.insertBefore(det,vmc||ch); if(vmc) det.appendChild(vmc); if(ch) det.appendChild(ch); return det; }catch(e){ return null; } }
try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f389){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ if(typeof HP_CP==='undefined'||HP_CP.peer===peer) hpCpFoldInto(s,peer); }catch(e){} return r; },f,{__f389:1}); } }catch(e){}
function hpCpFoldOut(){ try{ const s=document.getElementById('p-call'); if(!s||!s.classList||!s.classList.contains('cp-vhon')) return false; const det=Array.from(s.children||[]).find(x=>x&&String(x.className||'')==='cp-fold'); if(!det) return false; const vmc=Array.from(det.children||[]).find(x=>x&&String(x.className||'').split(' ').includes('cp-vm')); if(!vmc) return false; s.insertBefore(vmc,det); try{ if(typeof hpCpFit==='function') hpCpFit(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpVhUi==='function'&&!hpVhUi.__f389){ const f=hpVhUi; hpVhUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpCpFoldOut(); }catch(e){} return r; },f,{__f389:1}); } }catch(e){}

var HP_F390_CSS='html body #p-call .cp-row .cdv{display:none!important}';
function hpF390Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f390-css')) return false; const st=document.createElement('style'); st.id='hp-f390-css'; st.textContent=HP_F390_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ hpF390Css(); }catch(e){}
try{ if(typeof hpCallUiList==='function'&&!hpCallUiList.__f390){ const f=hpCallUiList; hpCallUiList=Object.assign(function(s){ const r=f.apply(this,arguments); try{ hpF390Css(); for(const c of Array.from(s.children||[])){ if(!c||c.className!=='cp-row') continue; const dv=c.querySelector?c.querySelector('.cdv'):null; if(dv&&dv.parentNode) dv.parentNode.removeChild(dv); } }catch(e){} return r; },f,{__f390:1}); } }catch(e){}

var HP_F391_CSS='html body #p-call.cp-fit:not(.cp-vhon) .cp-act{margin:20px auto 10px!important;justify-content:center!important}html body #p-call.cp-fit.cp-vhon .cp-act{margin-left:auto!important;margin-right:auto!important;justify-content:center!important}';
function hpF391Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f391-css')) return false; const st=document.createElement('style'); st.id='hp-f391-css'; st.textContent=HP_F391_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ hpF391Css(); }catch(e){}
function hpCpToLetters(e){ try{ const t=e&&e.target; const id=String((t&&t.id)||''); if(/call$/.test(id)) return ''; const peer=(typeof HP_CP!=='undefined'&&HP_CP)?String(HP_CP.peer||''):''; if(!peer) return ''; const pc=document.getElementById('p-call'); if(!pc||!pc.classList||!pc.classList.contains('on')) return '';
    const tc=document.getElementById('t-chat'); if(tc&&typeof tc.click==='function') tc.click(); if(typeof openConversation==='function') openConversation(peer); try{ if(typeof hpSegSync==='function') hpSegSync(); }catch(x){} return peer; }catch(x){ return ''; } }
try{ if(typeof HP_SEG_CLICK==='function'&&!HP_SEG_CLICK.__f391){ const f=HP_SEG_CLICK; HP_SEG_CLICK=Object.assign(function(e){ if(hpCpToLetters(e)) return; return f.apply(this,arguments); },f,{__f391:1}); } }catch(e){}
try{ if(typeof hpSegSync==='function'&&!hpSegSync.__f391){ const f=hpSegSync; hpSegSync=Object.assign(function(){ const r=f.apply(this,arguments); try{ const bar=document.getElementById('hp-segbar'); if(bar&&bar.onclick&&bar.onclick!==HP_SEG_CLICK) bar.onclick=HP_SEG_CLICK; const hb=document.getElementById('btn-home'); if(hb&&hb.onclick&&hb.onclick!==HP_SEG_CLICK&&hb.getAttribute&&hb.getAttribute('data-seg')==='1') hb.onclick=HP_SEG_CLICK; }catch(e){} return r; },f,{__f391:1}); } }catch(e){}

var HP_F392_CSS='html body #p-call.cp-fit.cp-fit .cp-act.cp-act{margin-left:auto!important;margin-right:auto!important;justify-content:center!important;width:100%}';
function hpF392Css(){ try{ if(typeof document==='undefined'||!document.head) return false; let st=document.getElementById('hp-f392-css'); if(!st){ st=document.createElement('style'); st.id='hp-f392-css'; st.textContent=HP_F392_CSS; } document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ hpF392Css(); }catch(e){}
try{ if(typeof hpCallUiPerson==='function'&&!hpCallUiPerson.__f392){ const f=hpCallUiPerson; hpCallUiPerson=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpF392Css(); }catch(e){} return r; },f,{__f392:1}); } }catch(e){}

var HP_VM_DEF2='60';
try{ if(typeof hpVmSec==='function'&&!hpVmSec.__f393){ hpVmSec=Object.assign(function(){ try{ const v=String(localStorage.getItem(HP_VM_KEY)||''); return Number(HP_VM_SECS.indexOf(v)>=0?v:HP_VM_DEF2); }catch(e){ return Number(HP_VM_DEF2); } },{__f393:1}); } }catch(e){}
function hpVmMig393(){ try{ if(localStorage.getItem('p2p_vmsec_f393')) return false; localStorage.setItem('p2p_vmsec_f393','1'); if(String(localStorage.getItem(HP_VM_KEY)||'')==='30'){ localStorage.setItem(HP_VM_KEY,'60'); try{ hpLog('設定：出ないとき、呼び出しをやめるまで 30 秒 → 60 秒（第 353 版のはじめの値）'); }catch(e){} return true; } return false; }catch(e){ return false; } }
try{ hpVmMig393(); }catch(e){}

var HP_VM_FIX=60;
try{ if(typeof hpVmSec==='function'&&!hpVmSec.__f395){ hpVmSec=Object.assign(function(){ return HP_VM_FIX; },{__f395:1}); } }catch(e){}
var HP_F395_CSS='html body #set-vm{display:none!important}';
function hpF395Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f395-css')) return false; const st=document.createElement('style'); st.id='hp-f395-css'; st.textContent=HP_F395_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ hpF395Css(); }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f395){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null, d=document.getElementById('hp-call'); if(C&&C.vmTold&&C.dir==='out'&&!C.talkAt&&d&&d.__wt&&d.classList&&d.classList.contains('cl3')){ const E=C.cl3EndAt||Date.now(); d.__wt.textContent=TF('cl_hd_rang',{n:Math.max(0,Math.floor((E-(C.at||E))/1000))}); } }catch(e){} return r; },f,{__f395:1}); } }catch(e){}

var HP_F396_CSS='#p-call .cp-act button:disabled .ring,#p-call .cp-act button.off .ring{position:relative;overflow:hidden}'
 +'#p-call .cp-act button:disabled .ring::after,#p-call .cp-act button.off .ring::after{content:"";position:absolute;left:50%;top:8%;width:3px;height:84%;margin-left:-1.5px;border-radius:2px;background:#ff6b6b;transform:rotate(45deg);pointer-events:none}';
function hpF396Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f396-css')) return false; const st=document.createElement('style'); st.id='hp-f396-css'; st.textContent=HP_F396_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ hpF396Css(); }catch(e){}

var HP_F397_CSS='html body #p-call:not(.on){display:none!important}';
function hpF397Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f397-css')) return false; const st=document.createElement('style'); st.id='hp-f397-css'; st.textContent=HP_F397_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ hpF397Css(); }catch(e){}

function hpCvSegDrop(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const sg=document.getElementById('hp-cvseg'); if(sg&&sg.parentNode) sg.parentNode.removeChild(sg); const hd=document.getElementById('chat-head'); if(hd&&hd.classList) hd.classList.remove('hp-cv'); return !!sg; }catch(e){ return false; } }
try{ if(typeof hpCvSegMount==='function'&&!hpCvSegMount.__f399){ hpCvSegMount=Object.assign(function(){ hpCvSegDrop(); return null; },{__f399:1}); } }catch(e){}
try{ hpCvSegDrop(); setTimeout(hpCvSegDrop,0); }catch(e){}

const HP_FWD_SILENT={}; let HP_FWD_IN=0, HP_FWD_QEND=0;
function hpFwdQuiet(){ try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; if(!C||C.dir!=='in') return false; if(C.fwdQuiet) return true; if(HP_FWD_SILENT[C.id]&&C.st==='ringing'){ C.fwdQuiet=1; return true; } return false; }catch(e){ return false; } }
function hpFwdHide(){ try{ const d=document.getElementById('hp-call'); if(d&&d.style) d.style.display='none'; }catch(e){} }
function hpFwdRingNow(id,h){ try{ if(HP_FWD_HOLD[id]!==h) return false; delete HP_FWD_HOLD[id]; delete HP_FWD_SILENT[id]; const N=HP_CALL;
    if(!(N&&N.id===id&&N.dir==='in'&&N.st==='ringing')){ try{ hpLog('通話：待っていた呼び出しはもう無いので、この端末は鳴らさない'); }catch(e){} return false; }
    N.fwdQuiet=0; HP_FWD_MARK[id]=Date.now(); try{ hpLog('通話：先に鳴る端末が出ないので、この端末でも鳴らす（準備は'+(N.ans?'済んでいる':'まだ途中')+'・先に鳴る端末も鳴ったまま）'); }catch(e){}
    try{ hpCallUi(); }catch(e){} try{ hpCallRing(true); }catch(e){} try{ if(typeof notifySound==='function') notifySound('msg'); }catch(e){} try{ hpCallCard(true); }catch(e){}
    try{ N.ringSent=Date.now(); Promise.resolve(hpCallSig(N.peer,{v:1,type:'callring',call:id,k:hpCallMyKind()},N.dev?[N.dev]:null)).catch(()=>{}); }catch(e){}
    try{ if(N.timer) clearTimeout(N.timer); N.timer=setTimeout(()=>{ if(HP_CALL===N&&N.st==='ringing') hpCallEnd('missed',T('cl_missed')); },HP_CALL_RING_MORE); }catch(e){}
    return true; }catch(e){ return false; } }
try{ if(typeof hpFwdHold==='function'&&!hpFwdHold.__f400){ hpFwdHold=Object.assign(function(r,o,go){ try{ const id=o.call; if(HP_FWD_HOLD[id]){ HP_FWD_HOLD[id].r=r; HP_FWD_HOLD[id].o=o; return true; }
    const h={r:r,o:o,at:Date.now(),priSeen:false,quiet:true,probe:0}; HP_FWD_HOLD[id]=h; HP_FWD_SILENT[id]=Date.now(); const s=Math.round(HP_FWD_MS/1000);
    try{ hpLog('通話：'+nickOf(r.from)+' からの呼び出し。先に鳴る端末が出なければ '+s+' 秒後にこの端末も鳴る（それまでは鳴らさずに、つながる準備だけしておく）'); }catch(e){}
    h.timer=setTimeout(()=>hpFwdRingNow(id,h),HP_FWD_MS);
    HP_FWD_IN++; let p; try{ p=Promise.resolve(go(r,o)); }catch(e){ p=Promise.resolve(); }
    p.catch(()=>{}).then(()=>{ HP_FWD_IN=Math.max(0,HP_FWD_IN-1); try{ const N=HP_CALL; if(N&&N.id===id&&N.dir==='in'&&N.st==='ringing'&&HP_FWD_SILENT[id]){ N.fwdQuiet=1; hpCallRing(false); hpFwdHide(); hpLog('通話：鳴らさずに準備を始めた（'+s+' 秒たっても誰も出なければ鳴らす）'); } }catch(e){} });
    return true; }catch(e){ return false; } },{__f400:1}); } }catch(e){}
try{ if(typeof hpCallRing==='function'&&!hpCallRing.__f400){ const f=hpCallRing; hpCallRing=Object.assign(function(on){ try{ if(on&&hpFwdQuiet()) return f.call(this,false); }catch(e){} return f.apply(this,arguments); },f,{__f400:1}); } }catch(e){}
try{ if(typeof hpCallCard==='function'&&!hpCallCard.__f400){ const f=hpCallCard; hpCallCard=Object.assign(function(on){ try{ if(on&&hpFwdQuiet()) return false; }catch(e){} return f.apply(this,arguments); },f,{__f400:1}); } }catch(e){}
try{ if(typeof notifySound==='function'&&!notifySound.__f400){ const f=notifySound; notifySound=Object.assign(function(k){ try{ if(k==='msg'&&HP_FWD_IN>0&&hpFwdQuiet()) return; }catch(e){} return f.apply(this,arguments); },f,{__f400:1}); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f400){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ if(hpFwdQuiet()) hpFwdHide(); }catch(e){} return r; },f,{__f400:1}); } }catch(e){}
try{ if(typeof hpCallSig==='function'&&!hpCallSig.__f400){ const f=hpCallSig; hpCallSig=Object.assign(async function(peer,body,devs){ try{ if(body&&body.type==='callring'&&HP_FWD_SILENT[body.call]){ hpLog('通話：まだ鳴らしていないので「鳴り始めた」は送らない'); return false; } }catch(e){} return f.apply(this,arguments); },f,{__f400:1}); } }catch(e){}
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f400){ const f=hpCallEnd; hpCallEnd=Object.assign(function(why){ let q=false; try{ const C=HP_CALL; q=!!(C&&C.st!=='ended'&&hpFwdQuiet()); if(q){ HP_FWD_QEND=Date.now(); delete HP_FWD_SILENT[C.id]; const h=HP_FWD_HOLD[C.id]; if(h){ clearTimeout(h.timer); delete HP_FWD_HOLD[C.id]; } } }catch(e){} const r=f.apply(this,arguments); try{ if(q){ hpFwdHide(); hpLog('通話：鳴らす前に呼び出しが終わった（'+String(why||'')+'・この端末は静かなまま）'); } }catch(e){} return r; },f,{__f400:1}); } }catch(e){}
try{ if(typeof hpCallEndTone==='function'&&!hpCallEndTone.__f400){ const f=hpCallEndTone; hpCallEndTone=Object.assign(function(){ try{ if(hpFwdQuiet()||(HP_FWD_QEND&&Date.now()-HP_FWD_QEND<5000)) return; }catch(e){} return f.apply(this,arguments); },f,{__f400:1}); } }catch(e){}
try{ if(typeof hpCallMissedBar==='function'&&!hpCallMissedBar.__f400){ const f=hpCallMissedBar; hpCallMissedBar=Object.assign(function(){ try{ if(HP_FWD_QEND&&Date.now()-HP_FWD_QEND<10000) return false; }catch(e){} return f.apply(this,arguments); },f,{__f400:1}); } }catch(e){}
try{ if(typeof hpCallGone==='function'&&!hpCallGone.__f400){ const f=hpCallGone; hpCallGone=Object.assign(function(id){ try{ delete HP_FWD_SILENT[id]; }catch(e){} return f.apply(this,arguments); },f,{__f400:1}); } }catch(e){}

try{ if(typeof hpFwdHold==='function'&&!hpFwdHold.__f401){ const f=hpFwdHold; hpFwdHold=Object.assign(function(r,o,go){ let had=true; try{ had=!!(o&&HP_FWD_HOLD[o.call]); }catch(e){} const res=f.apply(this,arguments);
    try{ if(!had&&res){ const h=HP_FWD_HOLD[o.call], at=Number(r&&r.sentAt), age=Date.now()-at; if(h&&at>0&&age>0&&age<3600000){ const left=Math.max(0,HP_FWD_MS-age); clearTimeout(h.timer); h.timer=setTimeout(()=>hpFwdRingNow(o.call,h),left); try{ hpLog('通話：呼び出しは '+Math.round(age/1000)+' 秒前にかけられた。'+(left?'あと '+Math.round(left/1000)+' 秒で鳴らす':'もう 30 秒たっているので、すぐ鳴らす')); }catch(e){} } } }catch(e){}
    return res; },f,{__f401:1}); } }catch(e){}

function hpAcWake(){ try{ const a=(typeof HP_CALL_AC!=='undefined')?HP_CALL_AC:null; if(a&&(a.state==='suspended'||a.state==='interrupted')&&a.resume){ const p=a.resume(); if(p&&p.catch) p.catch(()=>{}); return true; } }catch(e){} return false; }
hpBeepKill=function(){ const l=HP_BEEP_NODES; HP_BEEP_NODES=[]; let a=null; try{ a=HP_CALL_AC; }catch(e){} const now=a?a.currentTime:0;
  for(const ns of l){ for(const n of ns){ try{ if(n.gain&&n.gain.cancelScheduledValues&&a){ n.gain.cancelScheduledValues(now); n.gain.setValueAtTime(n.gain.value,now); n.gain.linearRampToValueAtTime(0,now+0.04); } }catch(e){} }
    for(const n of ns){ try{ if(n.stop) n.stop(a?now+0.05:0); }catch(e){} } setTimeout(()=>{ for(const n of ns){ try{ n.disconnect(); }catch(e){} } },120); } return l.length; };
try{ if(typeof hpCallBeep==='function'&&!hpCallBeep.__f401){ const f=hpCallBeep; hpCallBeep=Object.assign(function(){ try{ hpAcWake(); }catch(e){} return f.apply(this,arguments); },f,{__f401:1}); } }catch(e){}
try{ if(typeof hpCallTone==='function'&&!hpCallTone.__f401){ const f=hpCallTone; hpCallTone=Object.assign(function(k){ try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; if(k&&C&&C.fwdSay) return; }catch(e){} return f.apply(this,arguments); },f,{__f401:1}); } }catch(e){}
hpFwdTold=function(C){ try{ if(!C||C.fwdTold) return false; C.fwdTold=Date.now(); hpLog('通話：'+nickOf(C.peer)+' の先に鳴る端末が出ないので、ほかの端末も鳴り始めた');
    const quiet=(typeof soundOn==='function'&&soundOn()==='off')||typeof hpVmSay!=='function';
    const back=why=>{ try{ if(!C.fwdSay) return; C.fwdSay=false; clearTimeout(C.fwdSayT); hpAcWake(); setTimeout(()=>{ try{ if(HP_CALL!==C||C.st!=='calling') return; HP_CALL_TONE=''; hpCallTone('fwd'); hpLog('通話：知らせを言い終えたので、転送の音を鳴らし直した（'+why+'）'); }catch(e){} },300); }catch(e){} };
    if(quiet){ try{ hpCallTone('fwd'); }catch(e){} }
    else { C.fwdSay=true; try{ hpCallTone(''); }catch(e){} C.fwdSayT=setTimeout(()=>back('8 秒'),8000);
      setTimeout(()=>{ try{ if(HP_CALL!==C||C.st!=='calling'){ C.fwdSay=false; return; } Promise.resolve(hpVmSay(T('cl_fwd_say'),(typeof curLang==='function')?curLang():'ja')).catch(()=>{}).then(v=>back(v?'言えた':'言えない')); }catch(e){ back('誤り'); } },150); }
    try{ hpCallUi(); }catch(e){} return true; }catch(e){ return false; } };

function hpF401Late(f){ return Object.assign(async function(r,o){ let pre=null, had=0; try{ pre=HP_CALL; had=pre&&pre.lateS; }catch(e){} const res=await f.apply(this,arguments);
    try{ const C=HP_CALL; if(o&&o.type==='call'&&C&&C===pre&&C.id===o.call&&C.lateS&&!had){ hpLog('通話：同じ呼び出しが遅れてもう一度届いた（'+C.lateS+' 秒前）。「もう切れているかも」は出さない'); C.lateS=0; try{ hpCallUi(); }catch(e){} } }catch(e){} return res; },f,{__f401:1}); }
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f401) hpCallOnSig=hpF401Late(hpCallOnSig); }catch(e){}
try{ if(typeof hpLkOnSig==='function'&&!hpLkOnSig.__f401) hpLkOnSig=hpF401Late(hpLkOnSig); }catch(e){}

const HP_LH_KEY='hp_lease_h';
function hpLeaseHold(){ try{ if(typeof document==='undefined'||!document.getElementById) return 0; const W=(typeof window!=='undefined')?window:{}; const w=Math.round((Number(W.innerWidth)||0)/20)*20; let m=null; try{ m=JSON.parse(localStorage.getItem(HP_LH_KEY)||'null'); }catch(e){ m=null; } if(!m||m.w!==w||typeof m.h!=='object'||!m.h) m={w:w,h:{}}; let ch=false, n=0;
    for(const id of ['lease-rly','lease-peer']){ const el=document.getElementById(id); if(!el||!el.style||!el.getBoundingClientRect) continue; const want=Number(m.h[id])||0; const prev=el.style.minHeight; el.style.minHeight=''; const h=Math.ceil(el.getBoundingClientRect().height||0);
      if(h>want&&h<400){ m.h[id]=h; ch=true; } const use=Math.max(h,want); el.style.minHeight=use?use+'px':prev; if(use) n++; }
    if(ch){ try{ localStorage.setItem(HP_LH_KEY,JSON.stringify(m)); }catch(e){} } return n; }catch(e){ return 0; } }
try{ hpLeaseHold(); let k=0; const t=setInterval(()=>{ try{ hpLeaseHold(); if(++k>=40){ clearInterval(t); setInterval(hpLeaseHold,5000); } }catch(e){} },500); if(typeof window!=='undefined'&&window.addEventListener) window.addEventListener('resize',()=>{ try{ hpLeaseHold(); }catch(e){} }); }catch(e){}

try{ if(typeof hpFwdHold==='function'&&!hpFwdHold.__f402){ const f=hpFwdHold; hpFwdHold=Object.assign(function(r,o,go){ let had=true; try{ had=!!(o&&HP_FWD_HOLD[o.call]); }catch(e){} const res=f.apply(this,arguments);
    try{ if(!had&&res){ const h=HP_FWD_HOLD[o.call]; if(h&&h.at){ clearTimeout(h.timer); const left=Math.max(0,HP_FWD_MS-(Date.now()-h.at)); h.timer=setTimeout(()=>hpFwdRingNow(o.call,h),left); hpLog('通話：30 秒は届いた時から数える（端末の時計がずれていることがあるため）'); } } }catch(e){}
    return res; },f,{__f402:1}); } }catch(e){}
let HP_CLOCK_OFF=null;
async function hpClockCheck(){ try{ if(typeof fetch!=='function'||typeof location==='undefined') return null; const t0=Date.now(); const r=await fetch(location.origin+'/?clock='+t0,{method:'HEAD',cache:'no-store'}); const t1=Date.now(); const d=r&&r.headers&&r.headers.get('date'); const s=Date.parse(d||''); if(!(s>0)) return null;
    const off=Math.round(((t0+t1)/2-s-500)/1000); HP_CLOCK_OFF=off; if(Math.abs(off)>5) hpLog('この端末の時計は handpost.page より約 '+Math.abs(off)+' 秒'+(off>0?'進んで':'遅れて')+'いる（通話の合図を古いとみて捨てることがある。端末の設定で時刻を合わせてください）'); return off; }catch(e){ return null; } }
try{ setTimeout(()=>{ hpClockCheck(); },5000); setInterval(()=>{ hpClockCheck(); },1800000); }catch(e){}

try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f403){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null, d=document.getElementById('hp-call');
      if(C&&C.dir==='out'&&!C.talkAt&&(C.vmTold||C.rung||/timeout/.test(String(C.why||'')))&&d&&d.__wt&&d.classList&&d.classList.contains('cl3')){ const E=C.cl3EndAt||Date.now(); const t=TF('cl_hd_rang',{n:Math.max(0,Math.floor((E-(C.at||E))/1000))}); if(d.__wt.textContent!==t) d.__wt.textContent=t; } }catch(e){} return r; },f,{__f403:1}); } }catch(e){}
function hpChime(freq,at,vol,dur){ try{ const A=window.AudioContext||window.webkitAudioContext; if(!A) return false; if(!HP_CALL_AC) HP_CALL_AC=new A(); const a=HP_CALL_AC; try{ hpAcWake(); }catch(e){} const t0=a.currentTime+(at||0), ns=[];
    for(const [m,v] of [[1,1],[2,0.18],[3,0.06]]){ const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=freq*m; g.gain.setValueAtTime(0.0001,t0); g.gain.linearRampToValueAtTime(vol*v,t0+0.012); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur/m); o.connect(g); g.connect(a.destination); o.start(t0); o.stop(t0+dur/m+0.05); ns.push(o,g); }
    HP_BEEP_NODES.push(ns); if(HP_BEEP_NODES.length>HP_BEEP_MAX) HP_BEEP_NODES.splice(0,HP_BEEP_NODES.length-HP_BEEP_MAX); return true; }catch(e){ return false; } }
function hpFwdChime(){ hpChime(784,0,0.05,1.1); hpChime(1047,0.16,0.045,1.1); hpChime(1319,0.32,0.04,1.4); }
try{ if(typeof hpCallTone==='function'&&!hpCallTone.__f403){ const f=hpCallTone; hpCallTone=Object.assign(function(k){ try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; if(k&&C&&C.fwdSay) return; if(k==='back'&&C&&C.fwdTold) k='fwd';
      if(k==='fwd'){ if(HP_CALL_TONE==='fwd') return; try{ hpBeepKill(); }catch(e){} HP_CALL_TONE='fwd'; if(HP_CALL_TONE_T){ clearInterval(HP_CALL_TONE_T); HP_CALL_TONE_T=null; } if(typeof soundOn==='function'&&soundOn()==='off') return; hpFwdChime(); HP_CALL_TONE_T=setInterval(hpFwdChime,3000); return; } }catch(e){} return f.apply(this,arguments); },f,{__f403:1}); } }catch(e){}

let HP_DEL_ABORT=false;

function hpF403WrapRm(){ try{ if(typeof removeContact==='function'&&!removeContact.__f403){ const f=removeContact; removeContact=Object.assign(function(addr){ if(HP_DEL_ABORT){ HP_DEL_ABORT=false; try{ hpLog('友達から外すのをやめた'); }catch(e){} return false; }
        let row=null; try{ const c=((ID&&ID.contacts)||[]).find(x=>x.address===addr); if(c) row=JSON.parse(JSON.stringify(c)); }catch(e){} const r=f.apply(this,arguments);
        try{ if(row&&ID&&ID.cdel&&ID.cdel[addr]&&!((ID.contacts||[]).some(x=>x.address===addr))){ ID.cdel[addr].row=row; saveID(); hpLog('外した友達の行（名刺・写真）を控えた（友達に戻すと元に戻る）'); } }catch(e){} return r; },f,{__f403:1}); }
    if(typeof addContact==='function'&&!addContact.__f403){ const f=addContact; addContact=Object.assign(function(addr,nick){ let st=null; try{ const ex=((ID&&ID.contacts)||[]).some(x=>x.address===addr); st=(!ex&&ID&&ID.cdel&&ID.cdel[addr]&&ID.cdel[addr].row)||null; }catch(e){} const r=f.apply(this,arguments);
        try{ if(r&&st){ const c=(ID.contacts||[]).find(x=>x.address===addr); if(c){ const nk=c.nick; Object.assign(c,st,{address:addr,nick:nk||st.nick||'',mt:Date.now()}); delete ID.cdel[addr].row; saveID(); try{ renderContacts(); }catch(e){} hpLog('友達に戻した（控えていた名刺・写真も戻した）'); } } }catch(e){} return r; },f,{__f403:1}); } }catch(e){} }
try{ setTimeout(hpF403WrapRm,0); }catch(e){}
try{ if(typeof hpAsk==='function'&&!hpAsk.__f403){ const f=hpAsk; hpAsk=Object.assign(function(o){ let mine=false; try{ mine=!!(o&&o.cancel===T('btn_del_hist_no')); }catch(e){} if(!mine) return f.apply(this,arguments);
      hpF403WrapRm(); HP_DEL_ABORT=true; const p=f.apply(this,arguments);
      try{ const ok=document.getElementById('hp-ask-ok'), no=document.getElementById('hp-ask-no'), box=document.getElementById('hp-ask');
        if(ok&&no&&box){ const clr=()=>{ HP_DEL_ABORT=false; }; ok.addEventListener('click',clr,true); no.addEventListener('click',clr,true);
          const ab=document.createElement('button'); ab.type='button'; ab.className='b'; ab.id='hp-ask-abort'; ab.textContent=T('btn_del_abort'); ab.onclick=()=>{ HP_DEL_ABORT=true; try{ box.onclick({target:box}); }catch(e){} };
          const row=no.parentNode; if(row&&row.insertBefore) row.insertBefore(ab,no); } }catch(e){}
      return p; },f,{__f403:1}); } }catch(e){}
try{ if(typeof p2pRenderOrphans==='function'&&!p2pRenderOrphans.__f403){ const f=p2pRenderOrphans; p2pRenderOrphans=Object.assign(function(list){ const n0=(list&&list.children)?list.children.length:0; const r=f.apply(this,arguments);
      try{ if(!list||!list.children||list.children.length<=n0) return r; const box=list.children[list.children.length-1];
        for(const row of Array.from(box.children||[])){ const sp=row.children&&row.children[0], kb=row.children&&row.children[1]; if(!sp||!kb||!sp.title||sp.tagName&&String(sp.tagName).toLowerCase()!=='span') continue; sp.style.flex='0 1 auto'; const addr=sp.title;
          kb.onclick=async()=>{ const who=((typeof hpCtrName==='function'&&hpCtrName(addr))||hpIdShort(addr)); const n=prompt(TF('pr_nick_back',{who:who}),who); if(n===null) return; const nn=n.trim(); if(addContact(addr,nn,await hpNickOk(addr,nn))) renderContacts(); }; } }catch(e){} return r; },f,{__f403:1}); } }catch(e){}

let HP_FWD_AU=null, HP_FWD_URL='';
function hpFwdWav(){ try{ if(HP_FWD_URL) return HP_FWD_URL; const sr=22050, sec=3, n=sr*sec, pcm=new Int16Array(n);
    const notes=[[784,0,0.30,1.1],[1047,0.16,0.27,1.1],[1319,0.32,0.24,1.4]];
    for(let i=0;i<n;i++){ const t=i/sr; let v=0; for(const [f,at,vol,dur] of notes){ const u=t-at; if(u<0) continue; for(const [m,w] of [[1,1],[2,0.18],[3,0.06]]){ const d=dur/m; if(u>d) continue; const env=(u<0.012?u/0.012:1)*Math.exp(-5*u/d); v+=vol*w*env*Math.sin(2*Math.PI*f*m*u); } } pcm[i]=Math.max(-32767,Math.min(32767,Math.round(v*32767*0.9))); }
    const buf=new ArrayBuffer(44+n*2), dv=new DataView(buf); const ws=(o,s)=>{ for(let i=0;i<s.length;i++) dv.setUint8(o+i,s.charCodeAt(i)); };
    ws(0,'RIFF'); dv.setUint32(4,36+n*2,true); ws(8,'WAVE'); ws(12,'fmt '); dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true); dv.setUint32(24,sr,true); dv.setUint32(28,sr*2,true); dv.setUint16(32,2,true); dv.setUint16(34,16,true); ws(36,'data'); dv.setUint32(40,n*2,true);
    for(let i=0;i<n;i++) dv.setInt16(44+i*2,pcm[i],true); HP_FWD_URL=URL.createObjectURL(new Blob([buf],{type:'audio/wav'})); return HP_FWD_URL; }catch(e){ return ''; } }
function hpFwdAu(){ try{ if(HP_FWD_AU) return HP_FWD_AU; const u=hpFwdWav(); if(!u||typeof Audio!=='function') return null; const a=new Audio(u); a.loop=true; a.preload='auto'; a.setAttribute&&a.setAttribute('playsinline',''); HP_FWD_AU=a; return a; }catch(e){ return null; } }
function hpFwdAuStop(){ try{ if(HP_FWD_AU&&!HP_FWD_AU.paused){ HP_FWD_AU.pause(); } if(HP_FWD_AU) HP_FWD_AU.currentTime=0; }catch(e){} }
try{ if(typeof hpCallUnlock==='function'&&!hpCallUnlock.__f404){ const f=hpCallUnlock; hpCallUnlock=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; if(C&&C.dir==='out'){ const a=hpFwdAu(); if(a&&!a.__open){ a.muted=true; const p=a.play(); const fin=()=>{ try{ a.pause(); a.currentTime=0; a.muted=false; a.__open=1; }catch(e){} }; if(p&&p.then) p.then(fin,()=>{ a.muted=false; }); else fin(); } } }catch(e){} return r; },f,{__f404:1}); } }catch(e){}
try{ if(typeof hpCallTone==='function'&&!hpCallTone.__f404){ const f=hpCallTone; hpCallTone=Object.assign(function(k){ try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; if(k&&C&&C.fwdSay) return; if(k==='back'&&C&&C.fwdTold) k='fwd';
      if(k==='fwd'&&C&&C.dir==='out'){ if(HP_CALL_TONE==='fwd') return; const a=hpFwdAu(); if(!a) return f.apply(this,arguments);
        try{ hpBeepKill(); }catch(e){} if(HP_CALL_TONE_T){ clearInterval(HP_CALL_TONE_T); HP_CALL_TONE_T=null; } HP_CALL_TONE='fwd'; if(typeof soundOn==='function'&&soundOn()==='off') return;
        try{ a.muted=false; a.currentTime=0; const p=a.play(); const bad=e=>{ try{ hpLog('通話：待ち受け音を音の部品で鳴らせない（'+((e&&e.name)||e)+'）。音の入れ物で鳴らす'); }catch(x){} try{ hpFwdChime(); HP_CALL_TONE_T=setInterval(hpFwdChime,3000); }catch(x){} };
          if(p&&p.then) p.then(()=>{ try{ hpLog('通話：待ち受け音を音の部品で鳴らした（転送のあと）'); }catch(e){} },bad); }catch(e){ try{ hpFwdChime(); HP_CALL_TONE_T=setInterval(hpFwdChime,3000); }catch(x){} }
        try{ if(C.fwdTold) setTimeout(()=>{ try{ if(HP_CALL!==C||C.st==='ended'||!C.stream) return; const bad=C.stream.getAudioTracks().some(t=>t.muted||t.readyState==='ended'); if(bad&&typeof hpCallMicRedo==='function'){ hpLog('通話：読み上げのあとマイクが止まっているので取り直す'); hpCallMicRedo(C).catch(()=>{}); } }catch(e){} },500); }catch(e){}
        return; }
      hpFwdAuStop(); }catch(e){} return f.apply(this,arguments); },f,{__f404:1}); } }catch(e){}

try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f404){ const f=hpCallUi; hpCallUi=Object.assign(function(){ try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null; const off=(typeof HP_CLOCK_OFF!=='undefined')?HP_CLOCK_OFF:null;
      if(C&&C.dir==='in'&&C.lateS&&off!=null&&Math.abs(off)>5){ const real=C.lateS-off; if(real<30){ hpLog('通話：「'+C.lateS+' 秒前の呼び出し」は端末の時計のずれ（約 '+off+' 秒）のため。注は出さない'); C.lateS=0; } else C.lateS=Math.round(real); } }catch(e){} return f.apply(this,arguments); },f,{__f404:1}); } }catch(e){}

hpFwdWav=function(){ try{ if(HP_FWD_URL) return HP_FWD_URL; const sr=22050, sec=3, n=sr*sec, pcm=new Int16Array(n);
    for(let i=0;i<n;i++){ const t=i/sr; let v=0; if(t<1.0){ const env=t<0.02?t/0.02:(t>0.95?Math.max(0,(1.0-t)/0.05):1); v=0.07*env*(0.5+0.5*Math.sin(2*Math.PI*16*t))*Math.sin(2*Math.PI*400*t); } pcm[i]=Math.round(v*32767); }
    const buf=new ArrayBuffer(44+n*2), dv=new DataView(buf); const ws=(o,s)=>{ for(let i=0;i<s.length;i++) dv.setUint8(o+i,s.charCodeAt(i)); };
    ws(0,'RIFF'); dv.setUint32(4,36+n*2,true); ws(8,'WAVE'); ws(12,'fmt '); dv.setUint32(16,16,true); dv.setUint16(20,1,true); dv.setUint16(22,1,true); dv.setUint32(24,sr,true); dv.setUint32(28,sr*2,true); dv.setUint16(32,2,true); dv.setUint16(34,16,true); ws(36,'data'); dv.setUint32(40,n*2,true);
    for(let i=0;i<n;i++) dv.setInt16(44+i*2,pcm[i],true); HP_FWD_URL=URL.createObjectURL(new Blob([buf],{type:'audio/wav'})); return HP_FWD_URL; }catch(e){ return ''; } };
hpFwdChime=function(){ try{ hpCallBeep(400,1.0,0.07,0,16); }catch(e){} };

const HP_STG_KEY='hp_stage_hist', HP_STG_MAX=20;
function hpStgLoad(){ try{ const o=JSON.parse(localStorage.getItem(HP_STG_KEY)||'null'); if(o&&Array.isArray(o.tie)&&Array.isArray(o.run)) return o; }catch(e){} return {tie:[],run:[]}; }
function hpStgAdd(k,ms){ try{ if(!(ms>=0)||ms>600000) return false; const o=hpStgLoad(); o[k].push(Math.round(ms)); if(o[k].length>HP_STG_MAX) o[k]=o[k].slice(-HP_STG_MAX); localStorage.setItem(HP_STG_KEY,JSON.stringify(o)); return true; }catch(e){ return false; } }
function hpStgAvg(a){ try{ const v=(a||[]).filter(x=>x>=0).slice().sort((x,y)=>x-y); if(v.length<3) return null; let w=v; if(v.length>=4){ const q=p=>{ const i=(v.length-1)*p, lo=Math.floor(i), hi=Math.ceil(i); return v[lo]+(v[hi]-v[lo])*(i-lo); }; const q1=q(0.25), q3=q(0.75), r=q3-q1; w=v.filter(x=>x>=q1-1.5*r&&x<=q3+1.5*r); if(!w.length) w=v; } return w.reduce((s,x)=>s+x,0)/w.length; }catch(e){ return null; } }
function hpStgFmt(ms){ const v=Math.max(0,ms)/1000; return v<1?v.toFixed(1):(v<10?v.toFixed(1):String(Math.round(v))); }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f404b){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null, d=document.getElementById('hp-call'); if(!C||!d||C.dir!=='out') return r;
      if(C.gathered&&C.at&&!C.stgT){ C.stgT=1; hpStgAdd('tie',C.gathered-C.at); } if(C.sent&&C.gathered&&!C.stgR){ C.stgR=1; hpStgAdd('run',C.sent-C.gathered); }
      const on=(typeof hpCl3On==='function')?hpCl3On(C):(C.st==='calling'||C.st==='connecting'); if(!on) return r;
      if(d.__wt&&C.at){ const t=TF('cl_wait',{n:Math.max(0,Math.floor((Date.now()-C.at)/1000))}); if(d.__wt.textContent!==t) d.__wt.textContent=t; }
      if(d.__stp&&d.__stp.children){ const ss=Array.from(d.__stp.children).filter(x=>String(x.className||'').split(' ').indexOf('s')>=0); const h=hpStgLoad();
        [['tie',0],['run',1]].forEach(([k,i])=>{ const w=ss[i]; if(!w) return; const av=hpStgAvg(h[k]); let el=null; for(const c of Array.from(w.children||[])) if(c.className==='avg') el=c; if(av==null){ if(el&&el.parentNode) el.parentNode.removeChild(el); return; } if(!el){ el=document.createElement('small'); el.className='avg'; w.appendChild(el); } el.textContent=TF('cl_avg',{n:hpStgFmt(av)}); }); } }catch(e){} return r; },f,{__f404b:1}); } }catch(e){}
try{ if(document.head&&!document.getElementById('hp-f404-css')){ const s=document.createElement('style'); s.id='hp-f404-css'; s.textContent='#hp-call .stp .s small.avg{font-size:.72em;opacity:.55;margin-top:0;min-height:0}'; document.head.appendChild(s); } }catch(e){}

const HP_DNOW=Date.now.bind(Date), HP_CLK_KEY='hp_clk_off'; let HP_CLK_APPLIED=0;
function hpClkSet(ms,why){ try{ ms=Math.round(Number(ms)||0); if(!(Math.abs(ms)<=864e5)) return false; HP_CLK_APPLIED=ms; try{ localStorage.setItem(HP_CLK_KEY,String(ms)); }catch(e){} try{ HP_CLOCK_OFF=0; }catch(e){} if(why) hpLog('この端末の時計のずれ（約 '+Math.round(Math.abs(ms)/1000)+' 秒'+(ms>0?'進み':ms<0?'遅れ':'')+'）をアプリの中で直した（'+why+'）'); return true; }catch(e){ return false; } }
try{ if(!Date.now.__f406){ Date.now=Object.assign(function(){ return HP_DNOW()-HP_CLK_APPLIED; },{__f406:1}); } }catch(e){}
try{ const v=Number(localStorage.getItem(HP_CLK_KEY)); if(v&&Math.abs(v)>=3000&&Math.abs(v)<=864e5){ HP_CLK_APPLIED=Math.round(v); hpLog('前に測った時計のずれ（約 '+Math.round(Math.abs(v)/1000)+' 秒）で直して動く'); } }catch(e){}
try{ if(typeof hpClockCheck==='function'&&!hpClockCheck.__f406){ const f=hpClockCheck; hpClockCheck=Object.assign(async function(){ const off=await f.apply(this,arguments); try{ if(typeof off==='number'&&isFinite(off)){ if(Math.abs(off)>=3) hpClkSet(HP_CLK_APPLIED+off*1000,'handpost.page の時刻と比べた'); else if(HP_CLK_APPLIED&&Math.abs(HP_CLK_APPLIED)<3000) hpClkSet(0,''); } }catch(e){} return off; },f,{__f406:1}); } }catch(e){}

function hpStgAddPull(ms){ try{ if(!(ms>=0)||ms>600000) return false; let o=null; try{ o=JSON.parse(localStorage.getItem(HP_STG_KEY)||'null'); }catch(e){} if(!o||typeof o!=='object') o={}; for(const k of ['tie','run','pull']) if(!Array.isArray(o[k])) o[k]=[]; o.pull.push(Math.round(ms)); if(o.pull.length>HP_STG_MAX) o.pull=o.pull.slice(-HP_STG_MAX); localStorage.setItem(HP_STG_KEY,JSON.stringify(o)); return true; }catch(e){ return false; } }
function hpStgPull(){ try{ const o=JSON.parse(localStorage.getItem(HP_STG_KEY)||'null'); return (o&&Array.isArray(o.pull))?o.pull:[]; }catch(e){ return []; } }
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f407){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null, d=document.getElementById('hp-call'); if(!C||!d||C.dir!=='out') return r;
      if(C.talkAt&&C.cl3Pull&&!C.stgP){ C.stgP=1; hpStgAddPull(C.talkAt-C.cl3Pull); }
      const on=(typeof hpCl3On==='function')?hpCl3On(C):(C.st==='calling'||C.st==='connecting'); if(!on||!d.__stp||!d.__stp.children) return r;
      const ss=Array.from(d.__stp.children).filter(x=>String(x.className||'').split(' ').indexOf('s')>=0&&String(x.className||'').indexOf('lbl')<0); const h=hpStgLoad(); const av=[hpStgAvg(h.tie),hpStgAvg(h.run),null,hpStgAvg(hpStgPull())];
      const any=av.some(v=>v!=null);
      ss.forEach((w,i)=>{ let el=null; for(const c of Array.from(w.children||[])) if(c.className==='avg') el=c; const v=av[i]; if(!any){ if(el&&el.parentNode) el.parentNode.removeChild(el); return; } if(!el){ el=document.createElement('small'); el.className='avg'; w.appendChild(el); } el.textContent=(v==null)?'':TF('cl_wait',{n:hpStgFmt(v)}); });
      let lb=null; for(const c of Array.from(d.__stp.children)) if(String(c.className||'').indexOf('lbl')>=0) lb=c;
      if(!any){ if(lb&&lb.parentNode) lb.parentNode.removeChild(lb); return r; }
      if(!lb){ lb=document.createElement('span'); lb.className='s lbl'; const i=document.createElement('i'); i.textContent=T('cl_lbl_now'); const a=document.createElement('small'); a.textContent=T('cl_lbl_now'); const b=document.createElement('small'); b.className='avg'; b.textContent=T('cl_lbl_avg'); lb.appendChild(i); lb.appendChild(a); lb.appendChild(b); d.__stp.insertBefore(lb,d.__stp.children[0]||null); } }catch(e){} return r; },f,{__f407:1}); } }catch(e){}
try{ if(document.head&&!document.getElementById('hp-f407-css')){ const s=document.createElement('style'); s.id='hp-f407-css'; s.textContent='#hp-call .stp .s>i{order:0}#hp-call .stp .s>small{order:2}#hp-call .stp .s>small.avg{order:1}#hp-call .stp .s.lbl i{visibility:hidden}#hp-call .stp .s.lbl small{opacity:.55}#hp-call .stp .s small.avg{min-height:1.1em}'; document.head.appendChild(s); } }catch(e){}

try{ if(typeof hpVmRing==='function'&&!hpVmRing.__f408){ const f=hpVmRing; hpVmRing=Object.assign(function(C,dev){ try{ if(C&&C.fwdTold&&C.vmRing){ C.vmRingDevs=C.vmRingDevs||{}; if(dev&&!C.vmRingDevs[dev]){ C.vmRingDevs[dev]=1; hpLog('通話：転送でほかの端末も鳴り始めたが、音声メッセージまでは最初に鳴り始めてから数えたまま（数え直さない）'); } return false; } }catch(e){} return f.apply(this,arguments); },f,{__f408:1}); } }catch(e){}
hpStgFmt=function(ms){ return (Math.max(0,Number(ms)||0)/1000).toFixed(1); };
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f408b){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const C=(typeof HP_CALL!=='undefined')?HP_CALL:null, d=document.getElementById('hp-call'); if(!C||!d||!d.__stp||C.dir!=='out') return r;
      const on=(typeof hpCl3On==='function')?hpCl3On(C):(C.st==='calling'||C.st==='connecting'); if(!on) return r;
      const k=(typeof hpCallStage==='function')?hpCallStage(C):2, now=Date.now(), at=C.at||now, g=C.gathered||0, sn=C.sent||0, pl=C.cl3Pull||0;
      const dur=[g?g-at:now-at, g?(sn?sn-g:now-g):null, sn?(pl?pl-sn:now-sn):null, pl?now-pl:null];
      const ss=Array.from(d.__stp.children||[]).filter(x=>String(x.className||'').split(' ').indexOf('s')>=0&&String(x.className||'').indexOf('lbl')<0);
      ss.forEach((w,i)=>{ const sm=Array.from(w.children||[]).find(c=>String(c.tagName||'').toLowerCase()==='small'&&c.className!=='avg'); if(!sm) return; sm.textContent=(i<=k&&dur[i]!=null)?TF('cl_wait',{n:hpStgFmt(dur[i])}):''; }); }catch(e){} return r; },f,{__f408b:1}); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f408){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const d=document.getElementById('hp-call'); if(d&&d.__stp&&d.__stp.children){ for(const w of Array.from(d.__stp.children)){ for(const c of Array.from(w.children||[])){ if(c.className==='avg'&&c.textContent==='') c.textContent=' '; } } } }catch(e){} return r; },f,{__f408:1}); } }catch(e){}

var HP_F409_CSS='#p-call .cp-vm.v2 .st2 .bx{display:inline-flex;gap:6px;align-items:center}'
 +'#p-call .cp-vm.v2 .st2 button.del{display:inline-flex!important;align-items:center;font-size:12px!important;padding:4px 10px!important;border-radius:999px!important;border:1px solid rgba(248,113,113,.5)!important;background:transparent!important;color:#f87171!important;height:auto!important;min-width:0!important;cursor:pointer}'
 +'#p-call .cp-vm.v2 .vh0{margin:8px 0 0;font-size:13px;color:var(--dim,#8aa0c0)}'
 +'#p-call .r.vh .rd{flex:0 0 auto;width:30px;height:30px;border-radius:50%;border:1px solid var(--line,#2b3a5a);background:transparent;color:var(--dim,#8aa0c0);font-size:13px;cursor:pointer;padding:0;line-height:1;margin-left:4px}';
function hpF409Css(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-f409-css')) return false; const st=document.createElement('style'); st.id='hp-f409-css'; st.textContent=HP_F409_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
try{ if(typeof hpVhRows==='function'&&!hpVhRows.__f409){ const f=hpVhRows; hpVhRows=Object.assign(function(){ const a=f.apply(this,arguments); try{ return (a||[]).filter(m=>m&&!m.xb&&!m.tr); }catch(e){ return a; } },f,{__f409:1}); } }catch(e){}
function hpVhUnmark(peer,ts){ ts=Number(ts)||0; if(!peer||!ts) return false; try{ const o=hpMarkLoad(HP_VH2_KEY); const a=Array.isArray(o[peer])?o[peer].map(Number):[]; const i=a.indexOf(ts); if(i<0) return false; a.splice(i,1); o[peer]=a; localStorage.setItem(HP_VH2_KEY,JSON.stringify(o)); return true; }catch(e){ return false; } }
function hpVhCnt(peer){ try{ if(!peer||typeof document==='undefined'||!document.querySelectorAll) return false; const all=hpVhRows(peer), fr=hpVhNew(peer), fs=new Set(fr.map(m=>String(Number(m.ts)||0)));
    for(const c of Array.from(document.querySelectorAll('#p-call .cp-vm.v2'))){ if(c.getAttribute('data-peer')!==peer) continue; const hd=c.querySelector('.hd'); let cn=c.querySelector('.cnt');
      if(hd&&all.length&&!cn){ cn=document.createElement('span'); hd.appendChild(cn); } if(cn){ cn.className='cnt'+(fr.length?' hot':''); cn.textContent=fr.length?TF('cl_vh_cnt',{n:fr.length}):TF('cl_vh_cnt_h',{n:all.length}); }
      const pp=c.querySelector('button.pp'); if(pp&&pp.classList) pp.classList.toggle('hot',!!fr.length);
      let v0=c.querySelector('.vh0'); if(all.length&&!fr.length){ if(!v0){ v0=document.createElement('div'); v0.className='vh0'; if(hd&&c.insertBefore) c.insertBefore(v0,hd.nextSibling||null); else c.appendChild(v0); } v0.textContent=TF('cl_vh_none_h',{n:all.length}); } else if(v0&&v0.parentNode) v0.parentNode.removeChild(v0); }
    const mine=(typeof HP_CP!=='undefined'&&HP_CP&&HP_CP.peer===peer);
    for(const r of Array.from(document.querySelectorAll('#p-call .r.vh'))){ const p=r.getAttribute('data-peer'); if(p?p!==peer:!mine) continue; r.classList.toggle('new',fs.has(String(r.getAttribute('data-ts')))); }
    if(mine){ const sum=document.querySelector('#p-call details.cp-fold>summary'); if(sum) sum.textContent=fr.length?TF('cl_fold_t',{n:fr.length}):T('cl_fold_t0'); }
    return {all:all.length,fresh:fr.length}; }catch(e){ return false; } }
hpVhItem=async function(R,i,ig){ const live=()=>!R.dead&&R.ig===ig&&HP_VH_P===R; const m=R.list[i]; hpVhUi();
  if(!R.once){ await hpVmSay(TF('cl_vh_say_i',{i:i+1}),R.lang); if(!live()) return 'jump'; await hpVmSay(hpVhWhen(m.ts,R.lang),R.lang); if(!live()) return 'jump'; await hpVhBeep(R); if(!live()) return 'jump'; }
  const mk=hpVhMark(R.peer,m.ts); if(mk){ hpVhCnt(R.peer); hpLog('通話：音声メッセージを聞き始めたので、まだ聞いていない件数から外した'); }
  R.inAu=true; const r=await hpVhAu2(R,m.file); R.inAu=false;
  if((r==='none'||r==='err')&&mk){ hpVhUnmark(R.peer,m.ts); hpVhCnt(R.peer); }
  if(!live()) return 'jump';
  if(r==='none'||r==='err'){ await hpVmSay(T('cl_vh_noau'),R.lang); if(!live()) return 'jump'; } else R.done++; return 'ok'; };
hpVhPlay=async function(peer,o){ try{ if(!peer) return false; o=o||{}; if(HP_VH_P||HP_VH_RUN) hpVhStop(); const all=hpVhRows(peer); if(!all.length) return false;
    let list=all, i0=0, re=false; if(o.ts){ i0=all.findIndex(m=>Number(m.ts)===Number(o.ts)); if(i0<0) return false; } else { const fr=hpVhNew(peer); if(fr.length) list=fr; else re=true; }
    const gen=++HP_VH_GEN, R={peer:peer,gen:gen,list:list,i:i0,ig:0,once:!!o.ts,re:re,lang:hpVhLang(),done:0,paused:false,inAu:false,au:null,url:'',ac:null,dead:0,endAu:null,wake:null}; HP_VH_P=R; HP_VH_RUN=R;
    try{ if(typeof hpVmBeepPrime==='function') hpVmBeepPrime(); }catch(e){} try{ if(typeof hpVmPrime==='function') hpVmPrime(); }catch(e){}
    hpVhUi(); hpLog('通話：'+nickOf(peer)+' の音声メッセージを再生（'+(R.once?(i0+1)+' 件目だけ':(re?'聞いたもの '+list.length+' 件を聞き直す':'まだ聞いていない '+list.length+' 件'))+'）');
    const alive=()=>!R.dead&&HP_VH_P===R;
    try{ if(!R.once){ await hpVmSay(TF(re?'cl_vh_say_re':'cl_vh_say_n',{n:list.length}),R.lang); }
      while(alive()&&R.i>=0&&R.i<R.list.length){ while(R.paused&&alive()) await new Promise(res=>{ R.wake=res; }); if(!alive()) break; const ig=++R.ig; const r=await hpVhItem(R,R.i,ig); if(!alive()) break; if(r==='jump') continue; if(R.once) break; R.i++; }
      if(alive()&&!R.once) await hpVmSay(T('cl_vh_say_end'),R.lang); }catch(e){}
    const was=alive(); if(HP_VH_P===R){ HP_VH_P=null; HP_VH_RUN=null; } R.dead=1; hpVhDrop(R); hpVhUi(); if(was){ hpLog('通話：音声メッセージを聞き終えた（'+R.done+' 件）'); try{ if(typeof hpCallUiRender==='function'&&typeof HP_CP!=='undefined'&&HP_CP.peer===peer) hpCallUiRender(); }catch(e){} } else hpVhCnt(peer); return was; }catch(e){ return false; } };
async function hpVhDel(peer,ts){ try{ const m=hpVhRows(peer).find(x=>Number(x.ts)===Number(ts)); if(!m||!m.file||!m.file.id) return false;
    const ok=(typeof hpAsk==='function')?await hpAsk({text:T('cf_vh_del'),ok:T('btn_vh_del'),danger:true}):true; if(!ok) return false;
    const R=(typeof HP_VH_P!=='undefined'&&HP_VH_P)||(typeof HP_VH_RUN!=='undefined'&&HP_VH_RUN); if(R&&R.peer===peer) hpVhStop();
    const k=(typeof hpKeepDropList==='function')?await hpKeepDropList([{id:m.file.id,peer:peer}]):0; if(!k) return false;
    hpLog('通話：'+nickOf(peer)+' の音声メッセージを 1 件削除した（最近削除した項目へ・この端末だけ）'); try{ if(typeof hpToast==='function') hpToast(T('vh_del_done'),2500); }catch(e){}
    try{ if(typeof hpCallUiRender==='function') hpCallUiRender(); }catch(e){} return true; }catch(e){ return false; } }
function hpVhDelBtn(peer,ts){ const b=document.createElement('button'); b.className='rd'; b.type='button'; b.textContent='🗑'; b.title=T('btn_vh_del'); try{ b.setAttribute('aria-label',b.title); }catch(e){} b.onclick=ev=>{ try{ ev.preventDefault(); ev.stopPropagation(); }catch(e){} hpVhDel(peer,ts); }; return b; }
try{ if(typeof hpVhInto==='function'&&!hpVhInto.__f409){ const f=hpVhInto; hpVhInto=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ hpF409Css();
      const c=Array.from(s.children||[]).filter(x=>x&&x.getAttribute&&x.getAttribute('data-peer')===peer&&String(x.className||'').split(' ').includes('cp-vm')).pop();
      const st=c&&c.querySelector?c.querySelector('.st2'):null, sb=st?st.querySelector('button.stop'):null;
      if(st&&sb&&!st.querySelector('button.del')){ const bx=document.createElement('span'); bx.className='bx'; st.insertBefore(bx,sb); bx.appendChild(sb); const d=document.createElement('button'); d.className='del'; d.type='button'; d.textContent=T('btn_vh_del'); d.title=T('btn_vh_del');
        d.onclick=ev=>{ try{ ev.preventDefault(); }catch(e){} const R=HP_VH_P; const m=(R&&R.peer===peer)?R.list[R.i]:null; if(m) hpVhDel(peer,m.ts); }; bx.appendChild(d); }
      hpVhCnt(peer); }catch(e){} return r; },f,{__f409:1}); } }catch(e){}
try{ if(typeof hpChaRow==='function'&&!hpChaRow.__f409){ const f=hpChaRow; hpChaRow=Object.assign(function(it){ const r=f.apply(this,arguments); try{ if(it&&it.k==='v'&&r&&r.appendChild){ hpF409Css(); r.appendChild(hpVhDelBtn(it.peer,it.ts)); } }catch(e){} return r; },f,{__f409:1}); } }catch(e){}
try{ if(typeof hpVhMerge==='function'&&!hpVhMerge.__f409){ const f=hpVhMerge; hpVhMerge=Object.assign(function(s,peer){ const n=f.apply(this,arguments); try{ hpF409Css(); for(const r of Array.from(s.querySelectorAll?s.querySelectorAll('.r.vh'):[])){ if(r.querySelector('.rd')) continue; r.appendChild(hpVhDelBtn(peer,Number(r.getAttribute('data-ts'))||0)); } }catch(e){} return n; },f,{__f409:1}); } }catch(e){}
try{ if(typeof hpCpFoldInto==='function'&&!hpCpFoldInto.__f409){ const f=hpCpFoldInto; hpCpFoldInto=Object.assign(function(s,peer){ const r=f.apply(this,arguments); try{ hpVhCnt(peer); }catch(e){} return r; },f,{__f409:1}); } }catch(e){}

function hpRvFit(v){ try{ if(!v||!v.videoWidth||!v.videoHeight) return ''; const W=Number(window.innerWidth)||0, H=Number(window.innerHeight)||0; if(!W||!H) return '';
    const va=v.videoWidth/v.videoHeight, sa=W/H, k=((va<1)!==(sa<1)||Math.max(va/sa,sa/va)>1.6)?'contain':'cover';
    if(v.__fit!==k){ v.__fit=k; try{ v.style.setProperty('object-fit',k,'important'); }catch(e){ v.style.objectFit=k; } hpLog('ビデオ：相手の映像 '+v.videoWidth+'×'+v.videoHeight+'・画面 '+W+'×'+H+' → '+(k==='contain'?'全体を見せる（余りは黒い帯）':'画面いっぱい')); } return k; }catch(e){ return ''; } }
function hpRvWire(){ try{ if(typeof document==='undefined') return false; const v=document.getElementById('hp-call-rv'); if(!v||v.__f411) return false; v.__f411=1; const go=()=>hpRvFit(v); v.addEventListener('loadedmetadata',go); v.addEventListener('resize',go); go(); return true; }catch(e){ return false; } }
try{ if(typeof window!=='undefined'&&window.addEventListener){ const re=()=>{ try{ const v=document.getElementById('hp-call-rv'); if(v) hpRvFit(v); }catch(e){} }; window.addEventListener('resize',re); window.addEventListener('orientationchange',()=>setTimeout(re,300)); } }catch(e){}
try{ if(typeof hpCallUi==='function'&&!hpCallUi.__f411){ const f=hpCallUi; hpCallUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpRvWire(); }catch(e){} return r; },f,{__f411:1}); } }catch(e){}

