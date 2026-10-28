const HP_CALL_WAIT=45000, HP_CALL_WAIT_ICE=25000, HP_CALL_MAXAGE=60000, HP_CALL_GATHER=12000, HP_TURN_TTL=300e3, HP_CALL_WAIT_GO=30000;
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
      const rows=await hpMfLedger(acct,seeds); const row=(rows||[]).find(r=>r&&r.url===u&&Number(r.udp)>1024&&r.dom); if(row){ hpTurnCfgSet(u,row.udp,row.dom); hpLog('通話の中継：台帳からこの郵便受けの UDP の口（'+row.udp+'）を取り戻した'); return hpTurnCfgOf(u); } }
  }catch(e){ hpLog('通話の中継：台帳から UDP の口を取り戻せない（'+((e&&e.message)||e)+'）'); } return null; }
function hpTurnCache(url,r){ if(r&&r.on===1){ HP_TURN[String(url)]={at:Date.now(),host:String(r.domain||''),port:Number(r.udp)||0,user:String(r.user||''),pass:String(r.pass||''),alive:r.alive===1,ext:String(r.ext||''),ver:Number(r.ver)||0}; } else delete HP_TURN[String(url)]; }
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
      if(r&&r.ok==='turn'){ hpTurnCache(u,r); HP_TURN_ENS[u]=Date.now(); hpLog('通話の中継の設定を自分の郵便受けに預けた（UDP '+cfg.udp+'・'+cfg.dom+'。中継役は次の回に起きる）'); return 'set'; }
      return 'err';
    } finally { HP_TURN_BUSY=false; }
  }catch(e){ return 'err'; } }
async function hpTurnCreds(){
  if(!POST||!POST.up||POST.notOwner||!POST.url) throw new Error(T('cl_noturn')); const u=String(POST.url); let c=HP_TURN[u];
  if(!c||Date.now()-c.at>60e3||!c.alive){ let g=null; try{ g=await hpPmReq({op:'turnget'}); }catch(e){ g=null; } if(g&&g.ok==='turnget') hpTurnCache(u,g); c=HP_TURN[u]; }
  if(!c||!c.alive||!c.host||!c.port||!c.user||!c.pass){ if(!c) hpTurnEnsure(true).catch(()=>{}); throw new Error(T('cl_noturn')); } return c; }
async function hpTurnVisit(url,send,out){
  try{ const u=String(url||''); if(!u||typeof send!=='function'||!Array.isArray(out)) return 'skip';
    const ask=async(q,okv,ms)=>{ await send(q); const t1=Date.now(); while(Date.now()-t1<ms){ const i=out.findIndex(x=>x&&typeof x==='object'&&(x.ok===okv||(x.err&&/turn/.test(String(x.err))))); if(i>=0) return out.splice(i,1)[0]; await sleep(250); } return null; };
    const g=await ask({op:'turnget'},'turnget',8000); if(!g||g.ok!=='turnget') return 'old';
    if(g.on===1){ if(Number(g.udp)>1024&&g.domain) hpTurnCfgSet(u,Number(g.udp),String(g.domain)); return 'ok'; }
    let cfg=hpTurnCfgOf(u); if(!cfg) cfg=await hpTurnRecover(u); if(!cfg) return 'nocfg';
    const r=await ask({op:'turn',udp:cfg.udp,domain:cfg.dom},'turn',8000); if(r&&r.ok==='turn'){ hpLog('通話の中継の設定を自分のほかの郵便受け（'+u+'）に預けた（UDP '+cfg.udp+'・'+cfg.dom+'）'); return 'set'; } return 'err';
  }catch(e){ return 'err'; } }
function hpCallIce(c){ return {iceServers:[{urls:'turn:'+c.host+':'+c.port+'?transport=udp',username:c.user,credential:c.pass}],iceTransportPolicy:'relay',encodedInsertableStreams:true}; }
function hpCallTurnOf(t){ try{ if(!t||typeof t!=='object') return null; const h=String(t.h||'').toLowerCase(), p=Number(t.p), u=String(t.u||''), k=String(t.k||''); if(!/^[a-z0-9]([a-z0-9-]{0,62}\.)+[a-z0-9-]{1,63}$/.test(h)||!(Number.isInteger(p)&&p>1024&&p<65536)||!/^[\x21-\x7e]{1,64}$/.test(u)||!/^[\x21-\x7e]{1,64}$/.test(k)) return null; return {host:h,port:p,user:u,pass:k}; }catch(e){ return null; } }
function hpCallSdpTune(sdp){ try{ return String(sdp).replace(/^(a=fmtp:\d+ [^\r\n]*useinbandfec=1[^\r\n]*)$/m,(m)=>/cbr=1/.test(m)?m:m+';cbr=1'); }catch(e){ return sdp; } }
function hpCallHasRelay(sdp){ return /^a=candidate:[^\r\n]* typ relay/m.test(String(sdp||'')); }
function hpCallSdpStrip(sdp){ return String(sdp||'').split(/\r\n/).filter(l=>!/^a=candidate:/.test(l)&&!/^a=end-of-candidates/.test(l)).join('\r\n'); }
function hpCallSdpCands(sdp){ const s=String(sdp||''), mid=(s.match(/^a=mid:(\S+)/m)||[])[1]||'0'; return s.split(/\r\n/).filter(l=>/^a=candidate:/.test(l)).map(l=>({candidate:l.slice(2),sdpMid:mid,sdpMLineIndex:0})); }
async function hpCallAddCands(C,cands){ let n=0; for(const c of (cands||[])){ try{ await C.pc.addIceCandidate(c); n++; }catch(e){ hpLog('通話：相手の候補を足せない（'+((e&&e.message)||e)+'）'); } } return n; }
function hpCallIceGo(C){ if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='connecting'){ hpCallBye('lost'); hpCallEnd('lost',T('cl_lost')); } },HP_CALL_WAIT_ICE); }
async function hpCallGather(pc){
  if(pc.iceGatheringState==='complete') return; await new Promise(res=>{ const t=setTimeout(res,HP_CALL_GATHER); const f=()=>{ if(pc.iceGatheringState==='complete'){ clearTimeout(t); res(); } }; try{ pc.addEventListener('icegatheringstatechange',f); }catch(e){ clearTimeout(t); res(); } }); }

function hpCallWorker(){ if(!HP_CALL_WK) HP_CALL_WK=new Worker('rewrite/52_callwk.js'); return HP_CALL_WK; }
function hpCallSalt(d){ const s=new Uint8Array(8); s[0]=d; return s; }
function hpCallCryptoApply(x,op,key,salt){ const w=hpCallWorker(), o={op:op,key:key.slice(0),salt:salt};
  if(typeof RTCRtpScriptTransform==='function'){ x.transform=new RTCRtpScriptTransform(w,o); return 'script'; }
  const es=x.createEncodedStreams(); w.postMessage(Object.assign(o,{readable:es.readable,writable:es.writable}),[es.readable,es.writable]); return 'legacy'; }
function hpCallCryptoOn(C){
  try{ if(!C||!C.pc||!C.key) return; const me=C.dir==='out'?1:2, you=C.dir==='out'?2:1; C.cry=C.cry||{};
    for(const s of C.pc.getSenders()){ if(!s||!s.track||s.track.kind!=='audio'||C.cry['s'+s.track.id]) continue; C.cry['s'+s.track.id]=hpCallCryptoApply(s,'enc',C.key,hpCallSalt(me)); }
    for(const r of C.pc.getReceivers()){ if(!r||!r.track||r.track.kind!=='audio'||C.cry['r'+r.track.id]) continue; C.cry['r'+r.track.id]=hpCallCryptoApply(r,'dec',C.key,hpCallSalt(you)); }
  }catch(e){ hpLog('通話：二重の鍵を掛けられない（'+((e&&e.message)||e)+'）'); } }

const HP_CALL_CSS='#hp-call{position:fixed;inset:0;z-index:9000;background:rgba(18,24,32,.96);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px;text-align:center}'
 +'#hp-call .who{font-size:1.5em;font-weight:600;max-width:90vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#hp-call .st{font-size:1.05em;opacity:.9}#hp-call .pq{font-size:.85em;opacity:.7}'
 +'#hp-call .btns{display:flex;gap:28px;margin-top:18px}#hp-call button{border:0;border-radius:50%;width:76px;height:76px;font-size:1.6em;color:#fff;cursor:pointer}#hp-call button.ans{background:#2e9c5c}#hp-call button.end{background:#d64545}'
 +'#hp-call button span{display:block;font-size:.45em;margin-top:2px}#btn-conv-call{margin-left:4px}';
function hpCallEl(){ let d=document.getElementById('hp-call'); if(d) return d;
  try{ if(document.head&&!document.getElementById('hp-call-css')){ const st=document.createElement('style'); st.id='hp-call-css'; st.textContent=HP_CALL_CSS; document.head.appendChild(st); } }catch(e){}
  d=document.createElement('div'); d.id='hp-call';
  const who=document.createElement('div'); who.className='who'; const st=document.createElement('div'); st.className='st'; const pq=document.createElement('div'); pq.className='pq'; pq.textContent=T('cl_pq');
  const au=document.createElement('audio'); au.id='hp-call-audio'; au.autoplay=true; try{ au.setAttribute('playsinline',''); }catch(e){}
  const btns=document.createElement('div'); btns.className='btns';
  const mk=(cls,icon,k,fn)=>{ const b=document.createElement('button'); b.type='button'; b.className=cls; b.appendChild(document.createTextNode(icon)); const s=document.createElement('span'); s.textContent=T(k); b.appendChild(s); b.onclick=fn; return b; };
  d.__ans=mk('ans','',"btn_answer",()=>{ hpCallAccept().catch(()=>{}); }); try{ d.__ans.insertBefore(hpCallIcon(30),d.__ans.firstChild); }catch(e){}
  btns.appendChild(d.__ans); btns.appendChild(d.__dec); btns.appendChild(d.__end); d.appendChild(who); d.appendChild(st); d.appendChild(pq); d.appendChild(au); d.appendChild(btns); d.__who=who; d.__st=st;
  (document.body||document.documentElement).appendChild(d); return d; }
function hpCallUnlock(){ try{ const d=hpCallEl(), au=d&&document.getElementById('hp-call-audio'); if(au){ const p=au.play(); if(p&&p.catch) p.catch(()=>{}); } }catch(e){} try{ const C=window.AudioContext||window.webkitAudioContext; if(C){ if(!HP_CALL_AC) HP_CALL_AC=new C(); if(HP_CALL_AC.state==='suspended') HP_CALL_AC.resume(); } }catch(e){} }
function hpCallFmt(ms){ const s=Math.max(0,Math.floor(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function hpCallUi(){ try{ const C=HP_CALL; let d=document.getElementById('hp-call'); if(!C){ if(d) d.style.display='none'; return; } d=hpCallEl(); d.style.display='flex';
    d.__who.textContent=nickOf(C.peer); const ring=(C.st==='ringing'), live=(C.st==='talking');
    d.__ans.style.display=ring?'':'none'; d.__dec.style.display=ring?'':'none'; d.__end.style.display=(ring||C.st==='ended')?'none':'';
    d.__st.textContent=C.st==='calling'?TF('cl_calling',{who:nickOf(C.peer)}):ring?TF('cl_incoming',{who:nickOf(C.peer)}):C.st==='connecting'?T('cl_connecting'):live?TF('cl_talking',{t:hpCallFmt(Date.now()-(C.talkAt||Date.now()))}):C.st==='ended'?(C.endText||T('cl_ended')):'';
  }catch(e){} }
function hpCallIcon(px){ const N='http://www.w3.org/2000/svg', g=document.createElementNS(N,'svg'); g.setAttribute('viewBox','0 0 24 24'); g.setAttribute('width',String(px||18)); g.setAttribute('height',String(px||18)); g.setAttribute('fill','none'); g.setAttribute('stroke','currentColor'); g.setAttribute('stroke-width','2.2'); g.setAttribute('stroke-linecap','round'); g.setAttribute('stroke-linejoin','round'); g.setAttribute('aria-hidden','true'); g.style.verticalAlign='middle'; const pth=document.createElementNS(N,'path'); pth.setAttribute('d','M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'); g.appendChild(pth); return g; }
function hpCallBtn(){ try{ const h=document.getElementById('chat-head'); if(!h) return; let b=document.getElementById('btn-conv-call'); if(!b){ b=document.createElement('button'); b.id='btn-conv-call'; b.type='button'; try{ b.appendChild(hpCallIcon(18)); }catch(e){ b.textContent='☏'; } b.onclick=()=>{ if(CURPEER) hpCallStart(CURPEER).catch(()=>{}); }; const sr=document.getElementById('btn-conv-sr'); if(sr&&sr.parentNode===h) h.insertBefore(b,sr.nextSibling); else h.appendChild(b); }
    b.title=T('tip_conv_call'); b.style.display=(hpCallCan()&&CURPEER&&typeof hpCardOf==='function'&&hpCardOf(CURPEER))?'':'none'; }catch(e){} }

let HP_CALL_AC=null, HP_CALL_RING_T=null;
function hpCallRing(on){ try{ if(HP_CALL_RING_T){ clearInterval(HP_CALL_RING_T); HP_CALL_RING_T=null; } if(!on) return; if(typeof soundOn==='function'&&soundOn()==='off'){ try{ if(navigator.vibrate) navigator.vibrate([400,300,400]); }catch(e){} return; }
    const C=window.AudioContext||window.webkitAudioContext; if(!C) return; if(!HP_CALL_AC) HP_CALL_AC=new C(); const a=HP_CALL_AC; try{ if(a.state==='suspended') a.resume(); }catch(e){}
    const burst=()=>{ try{ const t0=a.currentTime; for(let i=0;i<2;i++){ const o=a.createOscillator(), g=a.createGain(); o.type='sine'; o.frequency.value=i?660:880; g.gain.setValueAtTime(0.0001,t0+i*0.5); g.gain.linearRampToValueAtTime(0.25,t0+i*0.5+0.02); g.gain.exponentialRampToValueAtTime(0.0001,t0+i*0.5+0.4); o.connect(g); g.connect(a.destination); o.start(t0+i*0.5); o.stop(t0+i*0.5+0.45); } try{ if(navigator.vibrate) navigator.vibrate([300,200,300]); }catch(e){} }catch(e){} };
    burst(); HP_CALL_RING_T=setInterval(burst,2500); }catch(e){} }

async function hpCallSig(peer,body,devs){ const card=(typeof hpCardOf==='function')?hpCardOf(peer):null; if(!card) throw new Error(T('al_nocard')); const to=(Array.isArray(devs)&&devs.length&&Array.isArray(card.devices))?Object.assign({},card,{devices:card.devices.filter(d=>devs.indexOf(d)>=0)}):card; if(!to.devices||!to.devices.length) return null; return hpPut(to,JSON.stringify(body),'sig'); }
function hpCallClose(C){ try{ if(C.timer){ clearTimeout(C.timer); C.timer=null; } }catch(e){} try{ if(C.tick){ clearInterval(C.tick); C.tick=null; } }catch(e){} try{ if(C.stream) C.stream.getTracks().forEach(t=>{ try{ t.stop(); }catch(e){} }); }catch(e){} try{ if(C.pc){ C.pc.onconnectionstatechange=null; C.pc.ontrack=null; C.pc.close(); } }catch(e){} try{ const au=document.getElementById('hp-call-audio'); if(au) au.srcObject=null; }catch(e){} hpCallRing(false); }
function hpCallEnd(why,text){ const C=HP_CALL; if(!C) return; if(C.st==='ended') return; hpCallClose(C); C.st='ended'; C.why=why; C.endText=text||''; hpLog('通話：終わり（'+why+(C.talkAt?'・'+hpCallFmt(Date.now()-C.talkAt):'')+'）'); hpCallUi(); setTimeout(()=>{ if(HP_CALL===C){ HP_CALL=null; hpCallUi(); } },2200); try{ if(typeof hpCallOnEnd==='function') hpCallOnEnd(C); }catch(e){} }
function hpCallBye(why){ const C=HP_CALL; if(!C||C.byeSent) return; C.byeSent=true; const devs=C.dev?[C.dev]:null; hpCallSig(C.peer,{v:1,type:'callend',call:C.id,why:why},devs).catch(()=>{}); }
function hpCallHangup(){ const C=HP_CALL; if(!C) return; if(C.st==='calling'||C.st==='connecting'||C.st==='talking'){ hpCallBye('hangup'); hpCallEnd('hangup'); } }
function hpCallDecline(){ const C=HP_CALL; if(!C||C.st!=='ringing') return; hpCallBye('decline'); hpCallEnd('decline'); }
function hpCallWire(C){ C.pc.ontrack=(e)=>{ try{ const au=document.getElementById('hp-call-audio'); const st=(e.streams&&e.streams[0])||new MediaStream([e.track]); C.remote=st; if(au){ au.srcObject=st; au.play().catch(()=>{}); } hpCallCryptoOn(C); }catch(x){} };
  C.pc.onconnectionstatechange=()=>{ try{ if(HP_CALL!==C) return; const s=C.pc.connectionState; if(s==='connected'){ if(C.st==='connecting'){ C.st='talking'; C.talkAt=Date.now(); if(C.timer){ clearTimeout(C.timer); C.timer=null; } C.tick=setInterval(hpCallUi,1000); hpLog('通話：つながった（'+(C.dir==='out'?'呼んだ':'応えた')+'・二重の鍵 '+Object.keys(C.cry||{}).length+'）'); hpCallUi(); } }
    else if(s==='failed'&&C.st==='connecting'){ if(!C.failLog){ C.failLog=1; hpLog('通話：線がまだつながらない（相手の準備を待つ）'); } }
    else if(s==='failed'||s==='closed'){ if(C.st!=='ended'){ hpCallBye('lost'); hpCallEnd('lost',T('cl_lost')); } }
    else if(s==='disconnected'){ setTimeout(()=>{ try{ if(HP_CALL===C&&C.pc&&C.pc.connectionState==='disconnected'&&C.st!=='ended'){ hpCallBye('lost'); hpCallEnd('lost',T('cl_lost')); } }catch(e){} },10000); } }catch(e){} }; }
async function hpCallMic(){ return navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false}); }
async function hpCallStart(peer){
  peer=String(peer||'').trim(); if(!ID||!peer) return false;
  if(!hpCallCan()){ hpToast(T('cl_nosupport'),6000); return false; }
  if(typeof hpBlocked==='function'&&hpBlocked(peer)) return false;
  if(HP_CALL){ hpToast(T('cl_busy_me'),4000); return false; }
  const card=(typeof hpCardOf==='function')?hpCardOf(peer):null; if(!card){ hpToast(T('al_nocard'),4000); return false; }
  const C={id:hpHex(crypto.getRandomValues(new Uint8Array(8))),peer:peer,dir:'out',st:'calling',pc:null,stream:null,dev:null,key:null,at:Date.now(),timer:null}; HP_CALL=C; hpCallUi(); hpCallUnlock();
  try{
    const cr=await hpTurnCreds(); if(HP_CALL!==C) return false;
    C.stream=await hpCallMic(); if(HP_CALL!==C){ hpCallClose(C); return false; }
    C.key=crypto.getRandomValues(new Uint8Array(32));
    C.pc=new RTCPeerConnection(hpCallIce(cr)); hpCallWire(C); C.stream.getTracks().forEach(t=>C.pc.addTrack(t,C.stream)); hpCallCryptoOn(C);
    const off=await C.pc.createOffer({offerToReceiveAudio:true}); await C.pc.setLocalDescription({type:'offer',sdp:hpCallSdpTune(off.sdp)}); await hpCallGather(C.pc); if(HP_CALL!==C) return false;
    const sdp=C.pc.localDescription.sdp, fp=extractFingerprint(sdp); if(!fp) throw new Error(T('e_nofp')); if(!hpCallHasRelay(sdp)) throw new Error(T('cl_noturn'));
    await hpCallSig(peer,{v:1,type:'call',call:C.id,sdp:sdp,fp:fp,k:hpHex(C.key),pq:1,t:{h:cr.host,p:cr.port,u:cr.user,k:cr.pass}},null); if(HP_CALL!==C) return false;
    hpLog('通話：'+nickOf(peer)+' を呼び出した（交換手 '+cr.host+':'+cr.port+'）');
    C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='calling'){ hpCallBye('timeout'); hpCallEnd('timeout',T('cl_noans')); } },HP_CALL_WAIT);
    return true;
  }catch(e){ const m=String((e&&e.message)||e); hpLog('通話：呼び出せない（'+m+'）'); if(HP_CALL===C){ hpCallEnd('fail',/NotAllowed|Permission|denied/i.test(m)?T('cl_nomic'):m); } return false; } }
async function hpCallOnSig(r,o){
  try{
    if(!ID||!o||o.v!==1||typeof o.call!=='string'||!/^[0-9a-f]{16}$/.test(o.call)) return;
    const from=r.from; if(from===ID.address||!isContact(from)) return; const c=contacts().find(x=>x.address===from); if(c&&c.pubKey&&c.pubKey!==r.fromMaster){ hpLog('通話の合図：マスター鍵が連絡先のものと違う（捨てた）'); return; }
    const age=Date.now()-Number(r.sentAt); if(!(Math.abs(age)<=HP_CALL_MAXAGE)){ hpLog('古い通話の合図（'+Math.round(age/1000)+' 秒前。捨てた）'); return; }
    const C=HP_CALL;
    if(o.type==='callend'){ if(C&&C.id===o.call&&C.peer===from&&C.st!=='ended'){ C.byeSent=true; const w=String(o.why||''); hpCallEnd('peer:'+w,w==='decline'?T('cl_declined'):w==='busy'?TF('cl_busy',{who:nickOf(from)}):w==='nopq'?T('cl_nopq'):w==='taken'?T('cl_taken'):w==='timeout'?T('cl_noans'):T('cl_ended')); } return; }
    if(o.type==='callans'){ if(!(C&&C.dir==='out'&&C.id===o.call&&C.peer===from&&C.st==='calling')){ if(C&&C.id===o.call&&C.peer===from&&C.dev&&C.dev!==r.fromDev) hpCallSig(from,{v:1,type:'callend',call:o.call,why:'taken'},[r.fromDev]).catch(()=>{}); return; }
      if(typeof o.sdp!=='string'||typeof o.fp!=='string'||extractFingerprint(o.sdp)!==o.fp||!hpCallHasRelay(o.sdp)){ hpLog('通話の答えの形が違う（捨てた）'); return; }
      C.dev=r.fromDev||null; C.st='connecting'; hpCallUi();
      try{ C.cands=hpCallSdpCands(o.sdp); await C.pc.setRemoteDescription({type:'answer',sdp:hpCallSdpStrip(o.sdp)}); hpCallCryptoOn(C); }catch(e){ hpLog('通話：答えを受け取れない（'+((e&&e.message)||e)+'）'); hpCallBye('fail'); hpCallEnd('fail',T('cl_lost')); return; }
      try{ const card=hpCardOf(from); const others=(card&&Array.isArray(card.devices)?card.devices:[]).filter(d=>d!==C.dev); if(others.length) hpCallSig(from,{v:1,type:'callend',call:C.id,why:'taken'},others).catch(()=>{}); }catch(e){}
      if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='connecting'){ hpCallBye('lost'); hpCallEnd('lost',T('cl_lost')); } },HP_CALL_WAIT_ICE+HP_CALL_WAIT_GO);

      hpCallSig(from,{v:1,type:'callgo',call:C.id},C.dev?[C.dev]:null).catch(()=>{}).then(async()=>{ try{ if(HP_CALL!==C||C.st!=='connecting'||!C.cands) return; const cs=C.cands; C.cands=null; const n=await hpCallAddCands(C,cs); hpCallIceGo(C); hpLog('通話：相手の候補を足して線をつなぎ始めた（'+n+'）'); }catch(e){} }); return; }
    if(o.type==='callgo'){ if(!(C&&C.dir==='in'&&C.id===o.call&&C.peer===from&&C.st==='connecting'&&C.pc&&C.cands)) return; const cs=C.cands; C.cands=null; const n=await hpCallAddCands(C,cs); hpCallIceGo(C); hpLog('通話：相手の準備が整ったので線をつなぎ始めた（'+n+'）'); return; }
    if(o.type==='call'){
      const tn=hpCallTurnOf(o.t); if(typeof o.sdp!=='string'||typeof o.fp!=='string'||extractFingerprint(o.sdp)!==o.fp||typeof o.k!=='string'||!/^[0-9a-f]{64}$/.test(o.k)||o.pq!==1||!tn){ hpLog('通話の呼び出しの形が違う（捨てた）'); return; }
      if(!hpCallCan()){ hpCallSig(from,{v:1,type:'callend',call:o.call,why:'nopq'},[r.fromDev]).catch(()=>{}); hpLog('通話：この端末では二重の鍵が使えないので応えない'); return; }
      if(C&&C.st!=='ended'){ if(C.id===o.call) return; hpCallSig(from,{v:1,type:'callend',call:o.call,why:'busy'},[r.fromDev]).catch(()=>{}); hpLog('通話：取り込み中なので応えない'); return; }
      if(typeof hpBlocked==='function'&&hpBlocked(from)) return;
      const N={id:o.call,peer:from,dir:'in',st:'ringing',pc:null,stream:null,dev:r.fromDev||null,key:hpCallHexU8(o.k),offer:o.sdp,turn:tn,at:Date.now(),timer:null}; HP_CALL=N; hpCallUi(); hpCallRing(true);
      hpLog('通話：'+nickOf(from)+' から呼び出し'); try{ if(typeof notifySound==='function') notifySound('msg'); }catch(e){}
      N.timer=setTimeout(()=>{ if(HP_CALL===N&&N.st==='ringing'){ hpCallEnd('missed',T('cl_missed')); } },HP_CALL_WAIT); return; }
  }catch(e){ hpLog('通話の合図でエラー（'+((e&&e.message)||e)+'）'); } }
async function hpCallAccept(){
  const C=HP_CALL; if(!C||C.st!=='ringing') return false; C.st='connecting'; hpCallRing(false); hpCallUi(); hpCallUnlock();
  try{
    const cr=C.turn; if(!cr) throw new Error(T('cl_noturn2'));
    C.stream=await hpCallMic(); if(HP_CALL!==C){ hpCallClose(C); return false; }
    C.pc=new RTCPeerConnection(hpCallIce(cr)); hpCallWire(C); C.stream.getTracks().forEach(t=>C.pc.addTrack(t,C.stream));
    C.cands=hpCallSdpCands(C.offer); await C.pc.setRemoteDescription({type:'offer',sdp:hpCallSdpStrip(C.offer)}); hpCallCryptoOn(C);
    const ans=await C.pc.createAnswer(); await C.pc.setLocalDescription({type:'answer',sdp:hpCallSdpTune(ans.sdp)}); await hpCallGather(C.pc); if(HP_CALL!==C) return false;
    const sdp=C.pc.localDescription.sdp, fp=extractFingerprint(sdp); if(!fp) throw new Error(T('e_nofp')); if(!hpCallHasRelay(sdp)) throw new Error(T('cl_noturn2'));
    await hpCallSig(C.peer,{v:1,type:'callans',call:C.id,sdp:sdp,fp:fp,pq:1},C.dev?[C.dev]:null); if(HP_CALL!==C) return false;
    if(C.st!=='connecting') return false; hpLog('通話：'+nickOf(C.peer)+' に応えた（呼んだ側の交換手 '+cr.host+':'+cr.port+'）'); if(C.timer) clearTimeout(C.timer); C.timer=setTimeout(()=>{ if(HP_CALL===C&&C.st==='connecting'){ hpCallBye('lost'); hpCallEnd('lost',T('cl_lost')); } },HP_CALL_WAIT_GO); return true;
  }catch(e){ const m=String((e&&e.message)||e); hpLog('通話：応えられない（'+m+'）'); if(HP_CALL===C){ hpCallBye('fail'); hpCallEnd('fail',/NotAllowed|Permission|denied/i.test(m)?T('cl_nomic'):m); } return false; } }

function hpCallHooks(){
  try{ if(typeof rtcOnSig==='function'&&!rtcOnSig.__call){ const f=rtcOnSig; rtcOnSig=Object.assign(async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){ o=null; } if(o&&o.v===1&&(o.type==='call'||o.type==='callans'||o.type==='callend'||o.type==='callgo')) return hpCallOnSig(r,o); return f.apply(this,arguments); },{__call:1}); } }catch(e){}
  try{ if(typeof hpLinkOnReply==='function'&&!hpLinkOnReply.__turn){ const f=hpLinkOnReply; hpLinkOnReply=Object.assign(function(o){ const r=f.apply(this,arguments); try{ if(o&&o.ok==='claim') setTimeout(()=>{ hpTurnEnsure().catch(()=>{}); },1500); }catch(e){} return r; },{__turn:1}); } }catch(e){}
  try{ if(typeof hpUpCheck==='function'&&!hpUpCheck.__turn){ const f=hpUpCheck; hpUpCheck=Object.assign(async function(){ const v=await f.apply(this,arguments); try{ if(v==='ok') setTimeout(()=>{ hpTurnEnsure(true).catch(()=>{}); },45000); }catch(e){} return v; },{__turn:1}); } }catch(e){}
  try{ if(typeof openConversation==='function'&&!openConversation.__call){ const f=openConversation; openConversation=Object.assign(function(){ const r=f.apply(this,arguments); try{ setTimeout(hpCallBtn,0); }catch(e){} return r; },{__call:1}); } }catch(e){}
  try{ hpCallBtn(); }catch(e){}
  try{ if(typeof window!=='undefined'&&window.addEventListener&&!hpCallHooks.__bye){ hpCallHooks.__bye=1; window.addEventListener('beforeunload',()=>{ try{ if(HP_CALL&&HP_CALL.st!=='ended') hpCallBye('hangup'); }catch(e){} }); } }catch(e){}
}
try{ setTimeout(hpCallHooks,0); }catch(e){}

