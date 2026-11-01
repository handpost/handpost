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
  if(!POST||!POST.up||POST.notOwner||!POST.url) throw new Error(T('cl_noturn')); const u=String(POST.url); let c=HP_TURN[u];
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
function hpCallWire(C){ try{ C.pc.oniceconnectionstatechange=()=>{ try{ if(HP_CALL===C) hpLog('通話：線の状態 '+C.pc.iceConnectionState+'（'+Math.round((Date.now()-C.at)/1000)+' 秒）'); }catch(e){} }; C.pc.onicegatheringstatechange=()=>{ try{ if(HP_CALL===C&&C.pc.iceGatheringState==='complete') hpLog('通話：候補が集まった（'+Math.round((Date.now()-C.at)/1000)+' 秒・交換手の候補 '+(hpCallHasRelay(C.pc.localDescription&&C.pc.localDescription.sdp)?'あり '+hpCallRelayAddrs(C.pc.localDescription.sdp).join(' '):'なし')+'）'); }catch(e){} }; }catch(e){}
function hpCallRelayAddrs(sdp){ return String(sdp||'').split(/\r\n/).filter(l=>/^a=candidate:[^\r\n]* typ relay/.test(l)).map(l=>{ const p=l.split(' '); return p[4]+':'+p[5]; }); }
async function hpCallStats(C){ const out=[]; try{ const st=await C.pc.getStats(); const by={}; st.forEach(r=>{ by[r.id]=r; }); st.forEach(r=>{ if(r.type!=='candidate-pair') return; const l=by[r.localCandidateId]||{}, m=by[r.remoteCandidateId]||{}; out.push('['+(l.candidateType||'?')+' '+(l.address||l.ip||'?')+':'+(l.port||'?')+' → '+(m.candidateType||'?')+' '+(m.address||m.ip||'?')+':'+(m.port||'?')+'] '+r.state+'・問い 送 '+(r.requestsSent|0)+' 受 '+(r.requestsReceived|0)+'・答え 受 '+(r.responsesReceived|0)+' 送 '+(r.responsesSent|0)+'・受けた '+(r.bytesReceived|0)+' byte'); }); st.forEach(r=>{ if(r.type==='transport') out.push('線 '+(r.iceState||'?')+'・暗号 '+(r.dtlsState||'?')); }); }catch(e){ out.push('取れない（'+((e&&e.message)||e)+'）'); } return out.length?out.join('；'):'（対なし）'; }
function hpCallStatLog(C){ if(!C||C.statLog||!C.pc) return; C.statLog=1; hpCallStats(C).then(s=>{ try{ hpLog('通話：線の記録 '+s); }catch(e){} }).catch(()=>{}); if(C.dir==='out'){ try{ hpPmReq({op:'turnget',diag:1}).then(g=>{ try{ if(g&&g.ok==='turnget'&&g.on===1){ hpLog('通話：交換手の控え（型 '+(g.ver|0)+'・割り当ての頼み '+(g.allocs|0)+'・折り返し '+(g.loop|0)+'・断り '+(g.rej|0)+'・束 '+(g.chan|0)+'・包み '+(g.msgs|0)+'）'); if(Array.isArray(g.ev)&&g.ev.length) hpLog('通話：交換手の記録（外へ '+(g.nout|0)+'・束なし '+(g.nchmiss|0)+'）\n'+g.ev.slice(-16).join('\n')); } }catch(e){} }).catch(()=>{}); }catch(e){} } }
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
const HP_CALL_RING_MORE=45000, HP_CALL_MISS_MAX=30*60e3, HP_CALL_WHY=new Map(), HP_CALL_X=new Set(); let HP_CALL_MISS_T=null;
function hpCallMissedBar(peer,at){ try{ if(!peer||(HP_CALL&&HP_CALL.st!=='ended')) return false; if(typeof hpBlocked==='function'&&hpBlocked(peer)) return false; const d=new Date(Number(at)||Date.now()), p=n=>String(n).padStart(2,'0');
    hpCallBar({peer:peer,endText:TF('cl_missed_at',{t:p(d.getHours())+':'+p(d.getMinutes())})}); if(HP_CALL_BAR_T){ clearTimeout(HP_CALL_BAR_T); HP_CALL_BAR_T=null; } try{ const f=document.getElementById('hp-call'); if(f&&(!HP_CALL||HP_CALL.st==='ended')) f.style.display='none'; }catch(e){}   hpLog('通話：'+nickOf(peer)+' からの出られなかった呼び出しを出した（［かけ直す］）'); return true; }catch(e){ return false; } }
function hpCallMissLater(peer,at,id){ try{ if(HP_CALL_MISS_T) clearTimeout(HP_CALL_MISS_T); HP_CALL_MISS_T=setTimeout(()=>{ HP_CALL_MISS_T=null; const w=HP_CALL_WHY.get(id)||''; if(HP_CALL_X.has(id)||/^(taken|glare|decline|nopq|busy)$/.test(w)) return; hpCallMissedBar(peer,at); },1500); }catch(e){} }
try{ if(typeof hpCallSibX==='function'&&!hpCallSibX.__f201){ const f=hpCallSibX; hpCallSibX=Object.assign(function(id){ try{ if(typeof id==='string') HP_CALL_X.add(id); }catch(e){} return f.apply(this,arguments); },{__f201:1}); } }catch(e){}
try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f201){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){
    if(!(o&&o.v===1&&typeof o.call==='string'&&/^[0-9a-f]{16}$/.test(o.call)&&r)) return f.apply(this,arguments);
    const from=r.from, age=Date.now()-Number(r.sentAt);
    if(o.type==='callring'){ const C=HP_CALL; if(C&&C.dir==='out'&&C.id===o.call&&C.peer===from&&C.st==='calling'&&(o.k==='pc'||o.k==='phone')){ C.rungK=C.rungK||{}; if(!C.rungK[o.k]){ C.rungK[o.k]=1; hpLog('通話：'+nickOf(from)+' の'+(o.k==='pc'?'PC':'スマホ')+'で鳴り始めた'); hpCallUi(); } } if(C&&C.dir==='out'&&C.id===o.call&&C.peer===from&&C.st==='calling'&&!C.rung){ C.rung=Date.now(); if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='calling'){ hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); } },HP_CALL_RING_MORE); hpLog('通話：'+nickOf(from)+' の端末で鳴り始めた（あと 45 秒待つ）'); hpCallUi(); } return; }
    if(o.type==='callend'){ try{ HP_CALL_WHY.set(o.call,String(o.why||'')); if(HP_CALL_WHY.size>50) HP_CALL_WHY.delete(HP_CALL_WHY.keys().next().value); }catch(e){} }
    const res=await f.apply(this,arguments);
    try{ if(o.type==='call'&&ID&&from!==ID.address&&typeof isContact==='function'&&isContact(from)){ const N=HP_CALL;
      if(N&&N.dir==='in'&&N.id===o.call&&N.peer===from&&N.st==='ringing'&&!N.ringSent){ N.ringSent=Date.now(); hpCallSig(from,{v:1,type:'callring',call:o.call,k:hpCallMyKind()},r.fromDev?[r.fromDev]:null).catch(()=>{}); if(N.timer) clearTimeout(N.timer); N.timer=setTimeout(()=>{ if(HP_CALL===N&&N.st==='ringing'){ hpCallEnd('missed',T('cl_missed')); } },HP_CALL_RING_MORE); hpLog('通話：鳴らし始めたと呼んだ端末に知らせた（45 秒鳴らす）'); }
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
        if(ended||older){ HP_CPS_SEEN.add(k); hpCpsStoreDel(k).catch(()=>{}); hpLog('通話：通知に載ってきた古い呼び出しを捨てた（'+Math.round((now-Number(d.at||0))/1000)+' 秒前・'+(ended?'もう切られている':'新しい呼び出しがある')+'）'); continue; } }
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
function hpVmAuto(C){ try{ if(!C||HP_CALL!==C||C.st!=='calling'||C.dir!=='out') return false; C.vm=1; hpLog('通話：'+(C.vmS||'')+' 秒たっても出なかったので、留守電に切り替えた');
    hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); if(HP_CALL===C){ HP_CALL=null; hpCallUi(); } hpVmGo(C.peer).catch(()=>{}); return true; }catch(e){ hpLog('通話：留守電に切り替えられない（'+((e&&e.message)||e)+'）'); return false; } }
function hpVmArm(C){ try{ const s=hpVmSec(); if(!s||!C||C.dir!=='out'||C.vmOn) return false; C.vmOn=1; C.vmS=s; hpVmPrime(); C.vmT=setTimeout(()=>hpVmAuto(C),s*1000); return true; }catch(e){ return false; } }
function hpVmRow(){ try{ if(typeof document==='undefined') return false; const c=document.getElementById('set-call'); if(!c||document.getElementById('set-vm')) return false;
    const r=document.createElement('div'); r.className='kv'; r.id='set-vm'; r.style.marginTop='8px'; const b=document.createElement('b'); b.textContent=T('cl_vm_l'); b.setAttribute('data-i18n','cl_vm_l'); r.appendChild(b);
    const s=document.createElement('select'); s.style.cssText='background:#1b2740;border:none;border-radius:6px;color:inherit;padding:4px 6px'; for(const v of HP_VM_SECS){ const o=document.createElement('option'); o.value=v; o.textContent=T('cl_vm_'+v); o.setAttribute('data-i18n','cl_vm_'+v); s.appendChild(o); }
    s.value=String(hpVmSec()); s.onchange=()=>{ if(hpVmSecSet(s.value)) hpLog('設定：留守電 '+(s.value==='0'?'使わない':s.value+' 秒で切り替える')); }; r.appendChild(s); c.appendChild(r); return true; }catch(e){ return false; } }
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
    d.__msg.textContent=(R.st==='greet')?T('vm_greet'):''; d.__end.style.display=rec?'':'none'; d.__redo.style.display=rec?'':'none'; d.__cancel.style.display=(R.st==='send')?'none':''; }catch(e){ try{ hpLog('通話：留守電の画面を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} } }
function hpVmStopRec(R){ try{ if(!R) return; if(R.tick){ clearInterval(R.tick); R.tick=null; } if(R.cap){ clearTimeout(R.cap); R.cap=null; } if(R.rec){ R.rec.onstop=null; R.rec.ondataavailable=null; if(R.rec.state!=='inactive') R.rec.stop(); } R.rec=null; if(R.stream){ R.stream.getTracks().forEach(t=>t.stop()); } R.stream=null; }catch(e){} }
function hpVmClose(){ const R=HP_VMR; HP_VMR=null; HP_VMR_GEN++; try{ hpVmStopRec(R); if(R&&R.own&&R.ac&&R.ac.close) Promise.resolve(R.ac.close()).catch(()=>{}); }catch(e){} hpVmUi(); }
async function hpVmRec(R){ try{ if(HP_VMR!==R) return false; await hpVmBeep(R.ac); if(HP_VMR!==R) return false; const ty=hpVcType();
    if(!ty||typeof navigator==='undefined'||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ try{ hpToast(T('vc_nosup'),5000); }catch(e){} hpLog('通話：留守電を録音できない（この端末では録音できない）'); hpVmClose(); return false; }
    let s=null; try{ s=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}); }catch(e){ try{ hpToast(hpVcErr(e),8000); }catch(_){} hpVmClose(); return false; }
    if(HP_VMR!==R){ try{ s.getTracks().forEach(t=>t.stop()); }catch(e){} return false; }
    const rec=new MediaRecorder(s,{mimeType:ty.m,audioBitsPerSecond:HP_VC_KB}); R.stream=s; R.rec=rec; R.ty=ty; R.parts=[]; R.t0=Date.now(); R.st='rec';
    rec.ondataavailable=e=>{ if(e.data&&e.data.size&&R.rec===rec) R.parts.push(e.data); }; rec.start(1000);
    R.tick=setInterval(hpVmUi,500); R.cap=setTimeout(()=>{ hpVmEnd().catch(()=>{}); },HP_VC_MAX); hpVmUi(); hpLog('通話：留守電の録音を始めた'); return true; }catch(e){ hpLog('通話：留守電の録音を始められない（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } }
async function hpVmEnd(){ const R=HP_VMR; if(!R||R.st!=='rec'||!R.rec) return false; R.st='send'; const rec=R.rec, ms=Date.now()-R.t0; if(R.tick){ clearInterval(R.tick); R.tick=null; } if(R.cap){ clearTimeout(R.cap); R.cap=null; } hpVmUi();
  try{ await new Promise(res=>{ rec.onstop=()=>res(true); try{ if(rec.state!=='inactive') rec.stop(); else res(true); }catch(e){ res(false); } setTimeout(()=>res(false),3000); });
    if(HP_VMR!==R) return false; const at=Date.now(), f=new File(R.parts,hpVcName(ms,at,R.ty.e),{type:R.ty.m.split(';')[0]}); hpVmStopRec(R);
    try{ if(typeof openConversation==='function') openConversation(R.peer); }catch(e){} if(typeof sendFile==='function') await sendFile(f);
    hpLog('通話：留守電を送った（'+hpVcClock(ms)+'）'); hpVmClose(); return true; }catch(e){ hpLog('通話：留守電を送れなかった（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } }
async function hpVmRedo(){ const R=HP_VMR; if(!R||R.st!=='rec') return false; hpVmStopRec(R); R.st='beep'; R.parts=[]; hpVmUi(); hpLog('通話：留守電を録り直す'); return hpVmRec(R); }
function hpVmCancel(){ const R=HP_VMR; if(!R) return false; try{ if(typeof speechSynthesis!=='undefined') speechSynthesis.cancel(); }catch(e){} hpLog('通話：留守電をキャンセルした'); hpVmClose(); return true; }
hpVmGo=async function(peer){ try{ if(!peer||HP_VMR) return false; let ac=null, own=false; try{ if(typeof HP_CALL_AC!=='undefined'&&HP_CALL_AC){ ac=HP_CALL_AC; if(ac.state==='suspended'&&ac.resume) Promise.resolve(ac.resume()).catch(()=>{}); } }catch(e){ ac=null; }
    if(!ac){ try{ const A=(typeof AudioContext!=='undefined')?AudioContext:((typeof webkitAudioContext!=='undefined')?webkitAudioContext:null); if(A){ ac=new A(); own=true; if(ac.resume) Promise.resolve(ac.resume()).catch(()=>{}); } }catch(e){ ac=null; } }
    const R={peer:String(peer),st:'greet',ac:ac,own:own,gen:++HP_VMR_GEN}; HP_VMR=R; hpVmUi();
    const lang=(typeof curLang==='function')?curLang():'ja', said=await hpVmSay(T('vm_greet'),lang); if(HP_VMR!==R) return false;
    hpLog('通話：留守電の応答の声'+(said?'を読み上げた（'+(HP_VM_LANG[lang]||'en-US')+'）':'は読み上げられなかった（画面に文を出した）')); R.st='beep'; hpVmUi(); return await hpVmRec(R); }catch(e){ hpLog('通話：留守電を始められない（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } };

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
    d.__end.style.display='none'; d.__redo.style.display=rec?'':'none'; d.__cancel.style.display=send?'none':''; }catch(e){ try{ hpLog('通話：留守電の画面を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} } };

function hpVmSayMax(t){ return Math.max(HP_VM_SAY_MAX,3000+String(t||'').length*220); }
hpVmSay=function(text,lang){ return new Promise(res=>{ let done=false, started=false, tries=0, why='', nv=0; const bc=HP_VM_LANG[lang]||'en-US';
    const end=v=>{ if(done) return; done=true; try{ hpLog('通話：留守電の読み上げ '+(v?'できた':'できない')+'（'+bc+'・声 '+nv+'・'+(tries)+' 回'+(why?'・'+why:'')+'）'); }catch(e){} res(v); };
    try{ const ss=(typeof speechSynthesis!=='undefined')?speechSynthesis:null; if(!ss||typeof SpeechSynthesisUtterance==='undefined'){ why='読み上げの仕組みが無い'; return end(false); }
      const go=()=>{ if(done) return; tries++; const u=new SpeechSynthesisUtterance(text); u.lang=bc; u.volume=1; u.rate=1;
        try{ const vs=ss.getVoices()||[]; nv=vs.length; const v=vs.find(x=>x&&x.lang===bc)||vs.find(x=>x&&String(x.lang||'').replace('_','-').slice(0,2)===bc.slice(0,2)); if(v) u.voice=v; }catch(e){}
        u.onstart=()=>{ started=true; }; u.onend=()=>end(true); u.onerror=e=>{ why=String((e&&e.error)||'error'); if(started||(why!=='interrupted'&&why!=='canceled')) end(false); };
        HP_VM_U=u; try{ if(ss.paused) ss.resume(); }catch(e){} ss.speak(u);
        setTimeout(()=>{ if(done||started) return; let busy=false; try{ busy=!!ss.speaking; }catch(e){} if(busy) return; if(tries<2){ why='始まらない'; try{ ss.cancel(); }catch(e){} setTimeout(go,200); } },HP_VM_RETRY_MS); };
      let wait=0; try{ if(ss.speaking||ss.pending){ ss.cancel(); wait=250; } }catch(e){} setTimeout(go,wait); setTimeout(()=>{ if(!why) why='時間切れ'; end(false); },hpVmSayMax(text)); }catch(e){ why=String((e&&e.message)||e); end(false); } }); };

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
    R.f=f; R.ms=ms; try{ R.url=URL.createObjectURL(f); }catch(e){ R.url=''; } R.st='rev'; hpVmUi(); hpLog('通話：留守電の録音を終えた（'+hpVcClock(ms)+'。送る前に聞ける）'); return true; }catch(e){ hpLog('通話：留守電の録音をまとめられない（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } };
async function hpVmSend(){ const R=HP_VMR; if(!R||R.st!=='rev'||!R.f) return false; const f=R.f, ms=R.ms; R.st='send'; try{ if(R.au) R.au.pause(); }catch(e){} hpVmUi();
  try{ try{ if(typeof openConversation==='function') openConversation(R.peer); }catch(e){} if(typeof sendFile==='function') await sendFile(f); hpLog('通話：留守電を送った（'+hpVcClock(ms)+'）'); hpVmClose(); return true; }catch(e){ hpLog('通話：留守電を送れなかった（'+((e&&e.message)||e)+'）'); hpVmClose(); return false; } }
hpVmRedo=async function(){ const R=HP_VMR; if(!R||(R.st!=='rec'&&R.st!=='rev')) return false; hpVmRevDrop(R); hpVmStopRec(R); R.st='beep'; R.parts=[]; hpVmUi(); hpLog('通話：留守電を録り直す'); return hpVmRec(R); };
try{ if(typeof hpVmClose==='function'&&!hpVmClose.__f222){ const f=hpVmClose; hpVmClose=Object.assign(function(){ try{ hpVmRevDrop(HP_VMR); }catch(e){} return f.apply(this,arguments); },f,{__f222:1}); } }catch(e){}
hpVmUi=function(){ try{ const R=HP_VMR; let d=document.getElementById('hp-vm'); if(!R){ if(d) d.style.display='none'; return; } d=hpVmEl(); hpVmBandCss(); d.style.display='flex';
    d.__who.textContent=nickOf(R.peer); const rec=(R.st==='rec'), rev=(R.st==='rev'), send=(R.st==='send');
    if(rev&&R.f) hpVmRevBand(d,R); else { if(d.__band&&d.__band.__f){ d.__band.__f=null; d.__band.__au=null; d.__band.className='vmb'; } hpVmBand(d,R); }
    d.__st.style.display=send?'':'none'; d.__st.textContent=send?T('vm_st_send'):''; if(d.__msg.__on!==(R.st==='greet')){ d.__msg.__on=(R.st==='greet'); hpVmMsg(d.__msg,d.__msg.__on); }
    d.__end.style.display='none'; d.__redo.style.display=(rec||rev)?'':'none'; d.__cancel.style.display=send?'none':''; }catch(e){ try{ hpLog('通話：留守電の画面を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} } };

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
        if(ended||older){ HP_CPS_SEEN.add(k); if(d.key) hpCpsStoreDel(d.key).catch(()=>{}); hpLog('通話：ロックを解除する前に、古い呼び出しを捨てた（'+(ended?'もう切られている':'新しい呼び出しがある')+'）'); continue; } }
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
    hpLog('通話：'+(C.vmRing?('相手の端末が鳴り始めてから '+Math.round((C.vmMs||0)/1000)+' 秒たっても出なかったので'):(Math.round(HP_VM_CAP/1000)+' 秒たっても相手の端末が鳴り始めないので'))+'、留守電に切り替えた');
    hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); if(HP_CALL===C){ HP_CALL=null; hpCallUi(); } hpVmGo(C.peer).catch(()=>{}); return true; }catch(e){ hpLog('通話：留守電に切り替えられない（'+((e&&e.message)||e)+'）'); return false; } };
hpVmArm=function(C){ try{ const s=hpVmSec(); if(!s||!C||C.dir!=='out'||C.vmOn) return false; C.vmOn=1; C.vmS=s; hpVmPrime();
    C.vmT=setTimeout(()=>{ try{ if(HP_CALL===C&&C.st==='calling'&&!C.vmRing) hpVmAuto(C); }catch(e){} },HP_VM_CAP); return true; }catch(e){ return false; } };
function hpVmRing(C){ try{ if(!C||!C.vmOn||C.vmRing||HP_CALL!==C||C.st!=='calling'||C.dir!=='out') return false; C.vmRing=Date.now(); if(C.vmT) clearTimeout(C.vmT);
    const ms=Math.max(5000,Math.min(C.vmS*1000,HP_CALL_RING_MORE-1500)); C.vmMs=ms; C.vmT=setTimeout(()=>{ try{ if(HP_CALL===C&&C.st==='calling') hpVmAuto(C); }catch(e){} },ms);
    hpLog('通話：相手の端末で鳴り始めたので、'+Math.round(ms/1000)+' 秒出なければ留守電に切り替える'); return true; }catch(e){ return false; } }
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
  try{ hpVmStopRec(R); }catch(e){} R.st='cancel'; const gen=HP_VMR_GEN; hpVmUi(); hpLog('通話：留守電をキャンセルした');
  (async()=>{ try{ await hpVmSay(T('vm_cancelled'),(typeof curLang==='function')?curLang():'ja'); }catch(e){} await new Promise(z=>setTimeout(z,HP_VM_CANCEL_GAP)); try{ if(HP_VMR===R&&HP_VMR_GEN===gen) hpVmClose(); }catch(e){} })();
  return true; };
try{ if(typeof hpVmUi==='function'&&!hpVmUi.__f231){ const f=hpVmUi; hpVmUi=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const R=HP_VMR, d=document.getElementById('hp-vm'); if(R&&d&&R.st==='cancel'){ if(d.__msg){ d.__msg.textContent=T('vm_cancelled'); d.__msg.className='msg'; } if(d.__band) d.__band.style.display='none'; for(const k of ['__end','__redo','__cancel']) if(d[k]) d[k].style.display='none'; if(d.__st) d.__st.style.display='none'; } }catch(e){}
    return v; },f,{__f231:1}); } }catch(e){}

const HP_DM_KEY='p2p_declmsg', HP_DM_KEEP=600e3, HP_DM_KEYS=['cl_dm_1','cl_dm_2','cl_dm_3'];
const HP_DM_CSS='#hp-call .dm{position:absolute;left:0;right:0;bottom:calc(136px + env(safe-area-inset-bottom,0px));display:flex;justify-content:center}#hp-call .dm button{width:auto;height:auto;border-radius:18px;padding:8px 16px;font-size:.9em;background:#2b3a52;color:#fff}'
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
    hpLog(again?('通話：相手の別の端末でも鳴り始めたので、留守電までの '+Math.round(ms/1000)+' 秒を数え直す'):('通話：相手の端末で鳴り始めたので、'+Math.round(ms/1000)+' 秒出なければ留守電に切り替える')); return true; }catch(e){ return false; } };
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

const HP_RC_CSS='#p-reach .rc-item{display:flex;align-items:center;gap:10px;padding:10px 6px;border-bottom:1px solid var(--line,#2a3a5a)}#p-reach .rc-item .av{width:40px;height:40px;border-radius:50%;background:#1b2740;color:var(--teal,#35d1b7);display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 40px;overflow:hidden}#p-reach .rc-item .av img{width:100%;height:100%;object-fit:cover}#p-reach .rc-item .body{flex:1 1 auto;min-width:0}#p-reach .rc-item .name{font-weight:700;cursor:pointer;text-decoration:underline dotted;text-underline-offset:3px}#p-reach .rc-item .sub{font-size:12px;color:var(--dim,#8aa0c0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#p-reach .rc-btns{display:flex;gap:6px;flex:0 0 auto}#p-reach .rc-btns button{width:44px;height:44px;border-radius:50%;border:1px solid var(--line,#2a3a5a);background:#1b2740;color:#6b7a94;font-size:20px;line-height:1;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center}#p-reach .rc-btns button svg{display:block}#p-reach .rc-btns button:not(.ok){filter:grayscale(1);opacity:.7}#p-reach .rc-btns button.ok{background:rgba(53,209,183,.18);border-color:#35d1b7;color:#35d1b7}#p-reach .rc-note{font-size:12px;color:var(--dim,#8aa0c0);margin:6px 6px 10px}#contact-list .contact-item.rc-hi{outline:2px solid #35d1b7;outline-offset:-2px}';
const HP_RC_TICK_MS=2000; let HP_RC_T=null;
function hpRcCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-rc-css')) return false; const st=document.createElement('style'); st.id='hp-rc-css'; st.textContent=HP_RC_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }

function hpRcState(a){ const s={call:false,mail:false}; try{ if(typeof hpBlkOn==='function'&&hpBlkOn(a)) return s; if(typeof hpDeadPeer==='function'&&hpDeadPeer(a)) return s;
    s.mail=!!(typeof hpCardOf==='function'&&hpCardOf(a)); s.call=!!((typeof hpSlOpen==='function'&&hpSlOpen(a))||(typeof rtcLineTo==='function'&&rtcLineTo(a))); }catch(e){} return s; }

function hpRcRows(){ const rows=[]; try{ for(const c of contacts()){ if(!c||!c.address) continue; if(typeof hpCtrHidden==='function'&&hpCtrHidden(c.address)) continue; const h=histLoad(c.address), last=h.length?h[h.length-1]:null; rows.push({c:c,last:last,ts:last?histOrd(last):0}); }
    rows.sort((a,b)=>(b.ts-a.ts)||String(a.c.nick||a.c.address).localeCompare(String(b.c.nick||b.c.address))); }catch(e){} return rows; }
function hpRcGoBook(a){ try{ const t=document.getElementById('t-contacts'); if(t) t.click(); const cs=contacts(), i=cs.findIndex(x=>x&&x.address===a); const rows=document.querySelectorAll('#contact-list .contact-item'); const row=rows[i]; if(!row) return false;
    try{ row.scrollIntoView({block:'center'}); }catch(e){} row.classList.add('rc-hi'); setTimeout(()=>{ try{ row.classList.remove('rc-hi'); }catch(e){} },2000); return true; }catch(e){ return false; } }
function hpRcAct(kind,a){ try{ if(kind==='call'){ if(typeof hpCallStart==='function') hpCallStart(a).catch(()=>{}); return true; }
    if(typeof openConversation==='function') openConversation(a); if(kind==='voice'&&typeof hpVcStart==='function') setTimeout(()=>{ try{ hpVcStart(); }catch(e){} },300); return true; }catch(e){ return false; } }
function hpRcUi(){ try{ if(typeof document==='undefined') return false; const s=document.getElementById('p-reach'); if(!s) return false; hpRcCss();
    if(!ID){ s.textContent=''; const n=document.createElement('div'); n.className='note'; n.textContent=T('lg_needid'); s.appendChild(n); return true; }
    const rows=hpRcRows(); let list=s.__list; if(!list){ s.textContent=''; const card=document.createElement('div'); card.className='card'; const h=document.createElement('h2'); h.textContent=T('tab_reach'); h.setAttribute('data-i18n','tab_reach'); card.appendChild(h);
      const note=document.createElement('div'); note.className='rc-note'; note.textContent=T('rc_note'); note.setAttribute('data-i18n','rc_note'); card.appendChild(note); list=document.createElement('div'); list.id='rc-list'; card.appendChild(list); s.appendChild(card); s.__list=list; }
    const key=rows.map(r=>r.c.address+':'+(r.c.nick||'')+':'+r.ts).join('|'); if(list.__key!==key){ list.__key=key; list.textContent='';
      if(!rows.length){ const w=document.createElement('div'); w.className='note'; w.textContent=T('ct_empty'); list.appendChild(w); }
      for(const r of rows){ const a=r.c.address, it=document.createElement('div'); it.className='rc-item'; it.dataset.addr=a;
        const av=document.createElement('div'); av.className='av'; av.textContent=String(r.c.nick||'?').slice(0,1).toUpperCase(); try{ if(typeof hpAvFill==='function') hpAvFill(av,r.c); }catch(e){} it.appendChild(av);
        const body=document.createElement('div'); body.className='body'; const nm=document.createElement('div'); nm.className='name'; nm.textContent=r.c.nick||hpIdShort(a); nm.title=T('rc_book'); nm.onclick=()=>{ hpRcGoBook(a); }; body.appendChild(nm);
        const sub=document.createElement('div'); sub.className='sub'; sub.textContent=r.last?fmtTS(r.last.ts):''; body.appendChild(sub); it.appendChild(body);
        const bt=document.createElement('div'); bt.className='rc-btns'; const mk=(kind,ch,tip)=>{ const b=document.createElement('button'); b.type='button'; b.className='rc-'+kind; if(ch) b.textContent=ch; else { try{ b.appendChild(hpCallIcon(22)); }catch(e){ b.textContent='☏'; } } b.title=T(tip); b.setAttribute('aria-label',T(tip)); b.onclick=()=>{ hpRcAct(kind,a); }; bt.appendChild(b); return b; };
        mk('call','','rc_call'); mk('voice','🎤','rc_voice'); mk('mail','✉','rc_mail'); it.appendChild(bt); list.appendChild(it); } }
    for(const it of list.querySelectorAll('.rc-item')){ const st=hpRcState(it.dataset.addr); const b1=it.querySelector('.rc-call'), b2=it.querySelector('.rc-voice'), b3=it.querySelector('.rc-mail'); if(b1) b1.classList.toggle('ok',st.call); if(b2) b2.classList.toggle('ok',st.mail); if(b3) b3.classList.toggle('ok',st.mail); }
    return true; }catch(e){ try{ hpLog('連絡の一覧を出せない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; } }
function hpRcTick(){ try{ const s=document.getElementById('p-reach'); if(!s||!s.classList.contains('on')){ if(HP_RC_T){ clearInterval(HP_RC_T); HP_RC_T=null; } return false; } hpRcUi(); return true; }catch(e){ return false; } }
function hpRcOpen(){ try{ const b=document.getElementById('t-reach'), s=document.getElementById('p-reach'); if(!b||!s) return false;
    document.querySelectorAll('nav button').forEach(x=>x.classList.remove('on')); document.querySelectorAll('main section').forEach(x=>x.classList.remove('on')); b.classList.add('on'); s.classList.add('on'); hpRcUi();
    try{ if(typeof stopScan==='function') stopScan(); }catch(e){} try{ menuClose(); homeToggle(true); menuBadge(); }catch(e){} try{ if(typeof window!=='undefined'&&window.scrollTo) window.scrollTo(0,0); }catch(e){}
    if(!HP_RC_T) HP_RC_T=setInterval(hpRcTick,HP_RC_TICK_MS); return true; }catch(e){ return false; } }
function hpRcMount(){ try{ if(typeof document==='undefined'||!document.getElementById||!document.querySelector) return ''; if(document.getElementById('t-reach')) return 'have'; const nav=document.querySelector('nav'), main=document.querySelector('main'); if(!nav||!main) return '';
    const after=document.getElementById('t-chat'), b=document.createElement('button'); b.id='t-reach'; b.type='button'; b.setAttribute('data-i18n','tab_reach'); b.textContent=T('tab_reach'); b.onclick=()=>{ hpRcOpen(); };
    if(after&&after.parentNode===nav) nav.insertBefore(b,after.nextSibling); else nav.insertBefore(b,nav.firstChild); const s=document.createElement('section'); s.id='p-reach'; main.appendChild(s); return 'made'; }catch(e){ return ''; } }

const HP_RC_ON=0;
try{ if(HP_RC_ON&&typeof document!=='undefined'&&document&&document.getElementById){ if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',()=>{ hpRcMount(); }); else hpRcMount(); } }catch(e){}

const HP_CV_CSS='.conv-item .cv-ol{display:flex;flex-direction:column;align-items:center;gap:2px;flex:0 0 auto;margin-left:4px}.conv-item .cv-ol button{width:40px;height:40px;border-radius:50%;border:1px solid var(--line,#2a3a5a);background:#1b2740;color:#6b7a94;padding:0;display:flex;align-items:center;justify-content:center;cursor:default;opacity:.55}.conv-item .cv-ol button.ok{background:rgba(53,209,183,.18);border-color:#35d1b7;color:#35d1b7;cursor:pointer;opacity:1}.conv-item .cv-ol small{font-size:10px;color:var(--dim,#8aa0c0);white-space:normal;max-width:84px;text-align:center;line-height:1.15}.conv-item .cv-ol small.ok{color:#35d1b7}.conv-item .cv-ol button.busy{background:rgba(245,184,92,.18);border-color:#f5b85c;color:#f5b85c;opacity:1}.conv-item .cv-ol small.busy{color:#f5b85c}';
const HP_CV_BUSY={}, HP_CV_BUSY_MS=15*60e3, HP_CV_CALL0='0000000000000000';
function hpCvBusy(a){ try{ const e=HP_CV_BUSY[a]; return !!(e&&e.b&&Date.now()-e.at<HP_CV_BUSY_MS); }catch(e){ return false; } }

function hpCvTell(b){ let n=0; try{ if(typeof HP_SL==='undefined') return 0; for(const k of Object.keys(HP_SL)){ const s=HP_SL[k]; if(!s||!s.dev||!hpSlIsOpen(s)) continue; try{ s.dc.send(JSON.stringify({t:'sig',o:{v:1,type:'callst',call:HP_CV_CALL0,b:b?1:0,at:Date.now()}})); n++; }catch(e){} } }catch(e){} return n; }
function hpCvMe(){ try{ return !!(typeof HP_CALL!=='undefined'&&HP_CALL&&HP_CALL.st!=='ended'); }catch(e){ return false; } }
function hpCvStOf(a){ if(hpCvMe()) return 'me'; const st=hpRcState(a); if(!st.call) return 'off'; return hpCvBusy(a)?'busy':'on'; }
const HP_CV_TICK_MS=2000; let HP_CV_T=null;
function hpCvCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-cv-css')) return false; const st=document.createElement('style'); st.id='hp-cv-css'; st.textContent=HP_CV_CSS; document.head.appendChild(st); return true; }catch(e){ return false; } }
function hpCvPaint(it){ try{ const a=it&&it.dataset&&it.dataset.addr; if(!a) return false; const w=it.querySelector('.cv-ol'); if(!w) return false; const b=w.querySelector('button'), s=w.querySelector('small'); if(!b||!s) return false;
    const k=hpCvStOf(a); if(w.__k===k) return true; w.__k=k; w.__on=(k==='on'); const tip=k==='on'?'cv_on':k==='busy'?'cv_busy':k==='me'?'cv_me_s':'cv_off', cap=k==='on'?'cv_on_s':k==='busy'?'cv_busy_s':k==='me'?'cv_me_s':'cv_off_s';
    b.classList.toggle('ok',k==='on'); b.classList.toggle('busy',k==='busy'); b.disabled=(k!=='on'); b.title=T(tip); b.setAttribute('aria-label',T(tip)); s.textContent=T(cap); s.classList.toggle('ok',k==='on'); s.classList.toggle('busy',k==='busy'); return true; }catch(e){ return false; } }
function hpCvAdd(it,a){ try{ if(!it||!a||it.querySelector('.cv-ol')) return false; if(typeof hpBlkOn==='function'&&hpBlkOn(a)) return false; if(typeof hpDeadPeer==='function'&&hpDeadPeer(a)) return false; if(typeof hpCardOf==='function'&&!hpCardOf(a)) return false; hpCvCss();
    const w=document.createElement('div'); w.className='cv-ol'; const b=document.createElement('button'); b.type='button'; try{ b.appendChild(hpCallIcon(20)); }catch(e){ b.textContent='☏'; }
    b.onclick=e=>{ try{ e.stopPropagation(); e.preventDefault(); }catch(x){} if(!w.__on) return; try{ if(typeof hpCallStart==='function') hpCallStart(a).catch(()=>{}); }catch(x){} }; w.appendChild(b); const s=document.createElement('small'); w.appendChild(s);
    const ub=it.querySelector('.unread'); if(ub) it.insertBefore(w,ub); else it.appendChild(w); it.dataset.addr=a; hpCvPaint(it); return true; }catch(e){ return false; } }
function hpCvTick(){ try{ const sec=document.getElementById('p-chat'); if(!sec||!sec.classList.contains('on')||!sec.classList.contains('list-mode')){ if(HP_CV_T){ clearInterval(HP_CV_T); HP_CV_T=null; } return false; } for(const it of document.querySelectorAll('#convlist .conv-item')) hpCvPaint(it); return true; }catch(e){ return false; } }
function hpCvArm(){ try{ if(!HP_CV_T&&typeof setInterval==='function') HP_CV_T=setInterval(hpCvTick,HP_CV_TICK_MS); return true; }catch(e){ return false; } }

try{ if(typeof hpCtrPress==='function'&&!hpCtrPress.__f239){ const f=hpCtrPress; hpCtrPress=Object.assign(function(el,a){ const v=f.apply(this,arguments); try{ if(el&&el.className&&String(el.className).split(' ').includes('conv-item')){ hpCvAdd(el,a); hpCvArm(); } }catch(e){} return v; },f,{__f239:1}); } }catch(e){}
try{ if(typeof showConvList==='function'&&!showConvList.__f239){ const f=showConvList; showConvList=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpCvArm(); }catch(e){} return v; },f,{__f239:1}); } }catch(e){}

try{ if(typeof hpCallOnSig==='function'&&!hpCallOnSig.__f239){ const f=hpCallOnSig; hpCallOnSig=Object.assign(async function(r,o){ try{ if(o&&o.type==='callst'&&r&&r.from&&typeof isContact==='function'&&isContact(r.from)){ HP_CV_BUSY[r.from]={b:o.b?1:0,at:Date.now()}; try{ hpCvTick(); }catch(e){} return; }
      if(o&&o.type==='callend'&&String(o.why||'')==='busy'&&r&&r.from){ HP_CV_BUSY[r.from]={b:1,at:Date.now()-HP_CV_BUSY_MS+60e3}; } }catch(e){} return f.apply(this,arguments); },f,{__f239:1}); } }catch(e){}

try{ if(typeof hpCallStart==='function'&&!hpCallStart.__f239){ const f=hpCallStart; hpCallStart=Object.assign(async function(){ const v=await f.apply(this,arguments); try{ if(v) hpCvTell(1); hpCvTick(); }catch(e){} return v; },f,{__f239:1}); } }catch(e){}
try{ if(typeof hpCallAccept==='function'&&!hpCallAccept.__f239){ const f=hpCallAccept; hpCallAccept=Object.assign(async function(){ const v=await f.apply(this,arguments); try{ if(v!==false) hpCvTell(1); }catch(e){} return v; },f,{__f239:1}); } }catch(e){}
try{ if(typeof hpCallEnd==='function'&&!hpCallEnd.__f239){ const f=hpCallEnd; hpCallEnd=Object.assign(function(){ let live=false; try{ live=hpCvMe(); }catch(e){} const v=f.apply(this,arguments); try{ if(live){ hpCvTell(0); hpCvTick(); } }catch(e){} return v; },f,{__f239:1}); } }catch(e){}

function hpCvWrapPress(){ try{ if(typeof hpCtrPress==='function'&&!hpCtrPress.__f239){ const f=hpCtrPress; hpCtrPress=Object.assign(function(el,a){ const v=f.apply(this,arguments); try{ if(el&&el.className&&String(el.className).split(' ').includes('conv-item')){ hpCvAdd(el,a); hpCvArm(); } }catch(e){} return v; },f,{__f239:1}); return true; } }catch(e){} return false; }
function hpCvBoot(){ try{ const w=hpCvWrapPress(); if(w&&typeof document!=='undefined'&&document.querySelector&&document.querySelector('#convlist .conv-item')&&typeof renderConvList==='function') renderConvList(); return w; }catch(e){ return false; } }
try{ if(typeof document!=='undefined'&&document&&document.addEventListener){ if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ hpCvBoot(); }); else hpCvBoot(); } }catch(e){}
try{ if(typeof showConvList==='function'&&!showConvList.__f240){ const f=showConvList; showConvList=Object.assign(function(){ try{ hpCvWrapPress(); }catch(e){} return f.apply(this,arguments); },f,{__f240:1}); } }catch(e){}

const HP_CV_ON=0;
hpCvAdd=function(){ return false; }; hpCvArm=function(){ return false; }; hpCvTell=function(){ return 0; };
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

