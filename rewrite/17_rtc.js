function onDC(raw,peer){
  let o=null;
  try{ o=JSON.parse(raw); }catch(e){ o=null; }
  if(raw==='[object ArrayBuffer]'||raw==='[object Blob]')return;
  const shown=rtcShown(peer);
  const fdx={fd:(typeof hpFdOf==='function')?hpFdOf(RTC_DEV):''};
  if(!o || o.v!==1 || !o.type){ const ts=Date.now(); histAdd(peer,'p',raw,ts,0,null,null,fdx); if(shown){ addMsgAt('peer',raw,nickOf(peer),ts); rtcReadSoon(peer); } notifySound('msg'); rtcBadges(); return; }
  if(o.type==='msg'){ const ts=Number(o.id)||Date.now();
    if(o.back===1&&typeof hpBackIn==='function'){ const rb=hpBackIn(peer,ts,String(o.text),o.xh); hpLog('戻した 1 通が直結で届いた ← '+nickOf(peer)+'（'+hpBackWhy(rb)+'）'); rtcGot(peer,[ts]); if(shown) rtcReadSoon(peer); return; }
    if(histVoided(peer,ts)){ rtcGot(peer,[ts]); hpLog('取り消された 1 通が直結で届いた（入れない）← '+nickOf(peer)); return; }
    const had=histLoad(peer).find(x=>x.ts===ts&&x.d==='p');
    if(!had){ histAdd(peer,'p',String(o.text),ts,0,null,null,fdx); try{ if(typeof hpSceneLetter==='function') hpSceneLetter('hand','in'); }catch(_){}   if(shown) addMsgAt('peer',String(o.text),nickOf(peer),ts); notifySound('msg'); rtcBadges(); }
    rtcGot(peer,[ts]);
    if(had&&had.rs) rtcReadAgain(peer,[ts]);
    if(shown) rtcReadSoon(peer);
    return; }
  if(o.type==='hello'){ PEER_CAPS[peer]={caps:Array.isArray(o.caps)?o.caps:[],app:o.app||0,line:DC}; return; }
  if(o.type==='file'){ fileRecvHeader(peer,o); notifySound('msg'); return; }
  if(o.type==='img'){ imgRecvHeader(peer,o); notifySound('msg'); return; }
  if(o.type==='void'){ const ts=Number(o.id); if(!ts)return; const r=hpVoidIn(peer,ts,{xh:o.xh});   try{ hpLog('取り消しが届いた ← '+nickOf(peer)+'（'+hpVoidWhy(r)+'）'); }catch(e){} if(r==='gone'||r==='gone6'||r==='new') rtcBadges(); return; }
  if(o.type==='got'){ rtcOnGot(peer,o.ids); return; }
  if(o.type==='read'){ const ids=Array.isArray(o.ids)?o.ids:[]; ackClear(ids);   if(typeof hpOnRead==='function'){ hpOnRead(peer,ids); } else { histRead(peer,ids); } return; }
}
function fmtTS(ts){
  const d=new Date(ts);
  const p=n=>String(n).padStart(2,'0');
  return d.getFullYear()+'/'+p(d.getMonth()+1)+'/'+p(d.getDate())+' '+p(d.getHours())+':'+p(d.getMinutes());
}
function isRev(){ return false; }
function applyOrder(){
  const m=$('#msgs'); if(!m)return;
  m.classList.remove('rev');

  scrollNew();
}
function nearEnd(m){
  if(!m)return true;
  if(isRev()){ return m.scrollTop<=80; }
  return (m.scrollHeight-m.clientHeight-m.scrollTop)<=80;
}
function scrollNew(force){
  const m=$('#msgs'); if(!m)return;
  if(typeof HP_SR_HOLD!=='undefined'&&HP_SR_EL&&Date.now()<HP_SR_HOLD){ try{ HP_SR_EL.scrollIntoView({block:'center'}); }catch(e){} return; }
  if(!force && !nearEnd(m))return;
  requestAnimationFrame(()=>{ m.scrollTop = isRev()? 0 : m.scrollHeight; });
}

let HP_KB_AT=0, HP_KB_NEAR=true, HP_KB_H=0;
function hpKbH(){ try{ const vv=(typeof window!=='undefined')?window.visualViewport:null; return Number((vv&&vv.height)||(typeof window!=='undefined'&&window.innerHeight)||0); }catch(e){ return 0; } }
function hpKbFocus(){ try{ const m=$('#msgs'); HP_KB_NEAR=nearEnd(m); HP_KB_AT=Date.now(); HP_KB_H=hpKbH(); if(HP_KB_NEAR) setTimeout(()=>{ try{ scrollNew(true); }catch(e){} },350); }catch(e){} }
function hpKbResize(){ try{ if(!HP_KB_AT||Date.now()-HP_KB_AT>3000) return false; const h=hpKbH(); if(h&&HP_KB_H&&h<HP_KB_H&&HP_KB_NEAR){ scrollNew(true); return true; } }catch(e){} return false; }
try{ if(typeof document!=='undefined'&&document.getElementById){ const t=document.getElementById('text'); if(t&&t.addEventListener&&!(t.dataset&&t.dataset.hpKb)){ if(t.dataset) t.dataset.hpKb='1'; t.addEventListener('focus',hpKbFocus); }
  if(typeof window!=='undefined'&&window.addEventListener){ window.addEventListener('resize',hpKbResize); if(window.visualViewport&&window.visualViewport.addEventListener) window.visualViewport.addEventListener('resize',hpKbResize); } } }catch(e){}
function addSys(text){const d=document.createElement('div');d.className='m sys';d.textContent=text;$('#msgs').appendChild(d);scrollNew();}
function addStat(text){ log(text); }
function setMode(m,peer){
  MODE=m;
  $('#text').disabled=!ID; $('#btn-send').disabled=!ID;
  pathConnected(m==='connected'); if(m==='calling') dot('d-p2p','walk');
  rtcUi();
  if(m==='connected'&&rtcShown(RTC_PEER))$('#text').focus();
}
function hangup(){
  const wasLine=(MODE==='connected')?RTC_PEER:null;
  WAIT_PEER=null; RTC_CALL=null; RTC_PEER=null; if(RTC_TIMER){ clearTimeout(RTC_TIMER); RTC_TIMER=null; } if(RTC_IDLE_T){ clearTimeout(RTC_IDLE_T); RTC_IDLE_T=null; }
  setTimeout(kickBg, 300);
  POLLGEN++;
  rtcLegsClose(); RTC_DEV=null;
  try{DC&&DC.close();}catch(e){}
  try{PC&&PC.close();}catch(e){}
  DC=null;PC=null;
  setMode('idle');
  if(wasLine) setTimeout(()=>{ try{ rtcNextMedia(wasLine); }catch(e){} },800);
}

const RTCCFG={iceServers:[{urls:'stun:stun.l.google.com:19302'}]};
function waitGathering(pc){
  return new Promise(res=>{
    if(pc.iceGatheringState==='complete')return res();
    const t=setTimeout(res,8000);
    pc.addEventListener('icegatheringstatechange',()=>{
      if(pc.iceGatheringState==='complete'){clearTimeout(t);res();}
    });
  });
}
function rtcLineOpen(dc,peer){if(DC!==dc)return;   RTC_CALL=null;RTC_LAST.delete(peer);if(RTC_TIMER){clearTimeout(RTC_TIMER);RTC_TIMER=null;}addStat(TL('sys_connected',{who:nickOf(peer)}));setMode('connected',peer);rtcTouch();rtcIdleWatch();sendHello(peer);rtcFlush(peer);}
function wireDC(dc,peer){
  DC=dc; RTC_PEER=peer;
  dc.onopen=()=>rtcLineOpen(dc,peer);
  try{ dc.binaryType='arraybuffer'; }catch(e){}
  dc.onmessage=e=>{ if(DC===dc) rtcTouch();   if(e.data instanceof ArrayBuffer){ onDCBinary(e.data,peer).catch(err=>log(TL('lg_imgfail',{err:err.message}))); } else { onDC(String(e.data),peer); } };
  dc.onclose=()=>{ if(DC!==dc)return; addStat(TL('sys_closed'));hangup();};
}

async function startCall(auto,peerArg){
  const waitMs=(auto===true)?RTC_WAIT_AUTO:RTC_WAIT_MANUAL;
  const peer=String(peerArg||$('#peer').value||'').trim();
  if(!ID)return alert(T('al_noid'));
  if(!peer)return alert(T('al_nopeer'));
  if(typeof hpBlocked==='function'&&hpBlocked(peer)){ hpLog('ブロック中の相手は呼び出さない'); return; }
  if(MODE==='connected'||MODE==='calling'){ addStat(TL('sys_busy')); return; }
  if(PC){ addStat(TL('sys_inprog')); return; }
  const card=(typeof hpCardOf==='function')?hpCardOf(peer):null;
  if(!card){ log(TL('sys_callfail',{err:TL('al_nocard')})); return; }
  bgReset();
  setMode('calling'); CALL_DEADLINE=Date.now()+waitMs+RTC_WAIT_PUT; rtcWatch();
  abortAllWaits();
  try{
    addStat(TL('sys_calling',{who:nickOf(peer)}));
    const call=hpHex(crypto.getRandomValues(new Uint8Array(8))); RTC_CALL={id:call,peer:peer};

    const legs=rtcLegDevs(card).map(dev=>({dev:dev,pc:null,dc:null,sdp:'',fp:'',ans:false})); RTC_LEGS=legs;
    for(const l of legs){ l.pc=new RTCPeerConnection(RTCCFG); rtcLegWire(l,peer); }
    PC=legs[0].pc; DC=legs[0].dc; RTC_PEER=peer; rtcUi();
    await Promise.all(legs.map(async l=>{ await l.pc.setLocalDescription(await l.pc.createOffer()); await waitGathering(l.pc); l.sdp=l.pc.localDescription.sdp; l.fp=extractFingerprint(l.sdp); if(!l.fp) throw new Error(T('e_nofp')); }));
    if(RTC_LEGS!==legs) return;
    WAIT_PEER=peer;
    const offer=(legs.length===1)?{v:1,type:'offer',call:call,sdp:legs[0].sdp,fp:legs[0].fp}:{v:1,type:'offer',call:call,legs:Object.fromEntries(legs.map(l=>[l.dev,{sdp:l.sdp,fp:l.fp}]))};
    await hpPut(card, JSON.stringify(offer), 'sig');
    addStat(TL('sys_sent'));
    if(MODE==='calling'&&WAIT_PEER===peer){ CALL_DEADLINE=Date.now()+waitMs; rtcWatch(); }
  }catch(e){
    log(TL('sys_callfail',{err:rtcWhy(e)}));
    RTC_LAST.set(peer,Date.now());
    WAIT_PEER=null; hangup();
  }
}

let RTC_WAIT_AUTO=20000, RTC_WAIT_MANUAL=45000, RTC_WAIT_ANSWER=20000, RTC_WAIT_ICE=10000, RTC_WAIT_PUT=30000, RTC_SIG_MAXAGE=90000;
let RTC_CALL=null, RTC_PEER=null, RTC_TIMER=null;

let RTC_LEGS=null, RTC_DEV=null, RTC_OFFER_MAXAGE=45000;
function rtcLegDevs(card){
  const now=Date.now(), devs=(Array.isArray(card.devices)?card.devices:[]), pre=(Array.isArray(card.prekeys)?card.prekeys:[]);
  const live=devs.filter(dev=>pre.some(q=>q&&q.dev===dev&&hp5PreOk(dev,q.x25519,q.notAfter,q.sig,now))).slice(0,5);
  return live.length?live:devs.slice(0,1);
}
function rtcLegWire(l,peer){
  l.pc.onconnectionstatechange=()=>{ try{ if(PC!==l.pc) return; const st=l.pc.connectionState; if((st==='disconnected'||st==='failed'||st==='closed')&&MODE==='connected'){ addStat(TL('sys_line_dead')); hangup(); } }catch(e){} };
  l.dc=l.pc.createDataChannel('chat');
  l.dc.onopen=()=>rtcLegWin(l,peer);
}
function rtcLegClose(l){
  try{ if(l.dc){ l.dc.onopen=null; l.dc.onclose=null; l.dc.onmessage=null; l.dc.close(); } }catch(e){}
  try{ if(l.pc){ l.pc.onconnectionstatechange=null; l.pc.close(); } }catch(e){}
}
function rtcLegsClose(){ const legs=RTC_LEGS; RTC_LEGS=null; if(legs){ for(const l of legs) rtcLegClose(l); } }
function rtcLegWin(l,peer){
  const legs=RTC_LEGS; if(!legs||legs.indexOf(l)<0) return;
  RTC_LEGS=null; for(const x of legs){ if(x!==l) rtcLegClose(x); }
  PC=l.pc; RTC_DEV=l.dev; wireDC(l.dc,peer);
  if(legs.length>1) hpLog('直結：相手の機械 '+legs.length+' 台を呼び出し、先につながった '+String(l.dev).slice(0,10)+'… を残した');
  rtcLineOpen(l.dc,peer);
}
function rtcWhy(e){ return (e&&e.hpk==='peer')?T('lg_fail_peer'):String((e&&e.message)||e); }
function rtcLineTo(peer){ return !!(peer&&DC&&DC.readyState==='open'&&MODE==='connected'&&RTC_PEER===peer); }
function rtcReadDone(peer, ids){ try{ if(typeof hpReadMark==='function') hpReadMark(peer, ids); }catch(e){} }

function rtcWatch(){
  if(RTC_TIMER){ clearTimeout(RTC_TIMER); RTC_TIMER=null; }
  if(MODE!=='calling') return;
  const left=CALL_DEADLINE-Date.now();
  if(left>0){ RTC_TIMER=setTimeout(rtcWatch, Math.min(left+20, 5000)); return; }
  { const p=WAIT_PEER||(RTC_CALL&&RTC_CALL.peer)||RTC_PEER; if(p) RTC_LAST.set(p,Date.now()); }
  if(!WAIT_PEER&&!RTC_CALL&&RTC_ANS&&RTC_ANS.n>1){ addStat(TL('sys_other_dev',{who:nickOf(RTC_ANS.peer)})); hpLog('直結：'+nickOf(RTC_ANS.peer)+' の呼び出しは自分の機械 '+RTC_ANS.n+' 台あてで、この機械の線はつながらなかった（ほかの機械の線が残ったと見る）'); }
  else addStat(TL(WAIT_PEER?'sys_noans':'sys_failed'));
  RTC_ANS=null; hangup();
}
let RTC_ANS=null;

function rtcDropLine(){
  rtcLegsClose(); RTC_DEV=null;
  const dc=DC, pc=PC; DC=null; PC=null; WAIT_PEER=null; RTC_CALL=null; RTC_PEER=null;
  try{ if(dc){ dc.onopen=null; dc.onclose=null; dc.onmessage=null; dc.close(); } }catch(e){}
  try{ if(pc){ pc.onconnectionstatechange=null; pc.close(); } }catch(e){}
  MODE='idle';
}
async function rtcOnSig(r){
  let o=null; try{ o=JSON.parse(r.body); }catch(e){ o=null; }
  const hasLegs=!!(o&&o.type==='offer'&&o.legs!=null);
  if(!o||o.v!==1||(o.type!=='offer'&&o.type!=='answer')||typeof o.call!=='string'||!/^[0-9a-f]{16}$/.test(o.call)
     ||(hasLegs?(typeof o.legs!=='object'||Array.isArray(o.legs)||Object.keys(o.legs).length<1||Object.keys(o.legs).length>5):(typeof o.sdp!=='string'))){ hpLog('合図の形が違う（捨てた）'); return; }
  if(!ID) return;
  const from=r.from;
  if(from===ID.address){ hpLog('自分の身元からの合図（端末間の同期は b7。捨てた）'); return; }
  if(!isContact(from)){ log(TL('lg_ignore',{addr:from})); return; }
  const c=contacts().find(x=>x.address===from);
  if(c.pubKey&&c.pubKey!==r.fromMaster){ hpLog('マスター鍵が連絡先のものと違う '+from+'（合図を捨てた）'); return; }
  if(hasLegs){ const mine=o.legs[(await hp5Me()).dev]; if(!mine||typeof mine.sdp!=='string'||typeof mine.fp!=='string'){ hpLog('この機械あての呼び出しが入っていない（捨てた）'); return; } o.sdp=mine.sdp; o.fp=mine.fp; }
  const fp=extractFingerprint(o.sdp); if(!fp||fp!==o.fp){ hpLog('合図のフィンガープリントが合わない（捨てた）'); return; }
  const age=Date.now()-Number(r.sentAt); if(!(Math.abs(age)<=(o.type==='offer'?RTC_OFFER_MAXAGE:RTC_SIG_MAXAGE))){ hpLog('古い合図（'+Math.round(age/1000)+' 秒前。捨てた）'); return; }
  if(rtcNoDirect()){ hpLog('直結を使わない設定（合図を捨てた）'); return; }
  if(o.type==='answer'){
    const leg=(RTC_LEGS||[]).find(l=>l.dev===r.fromDev&&!l.ans);
    if(!(RTC_CALL&&RTC_CALL.id===o.call&&RTC_CALL.peer===from&&leg&&MODE==='calling')){ hpLog('待っていない返事（捨てた）'); return; }
    try{
      addStat(TL('sys_ok')); leg.ans=true;
      await leg.pc.setRemoteDescription({type:'answer',sdp:o.sdp});
      if(rtcShown(from)) $('#status').textContent=T('st_estab');
      WAIT_PEER=null; CALL_DEADLINE=Math.max(CALL_DEADLINE, Date.now()+RTC_WAIT_ICE); rtcWatch();
    }catch(e){ log(TL('lg_ansfail',{err:e.message})); }
    return;
  }

  if(MODE==='calling'&&PC&&RTC_CALL&&RTC_CALL.peer===from){
    if(ID.address<from){ hpLog('同時の呼び出し：こちらの呼び出しを残す'); return; }
    hpLog('同時の呼び出し：相手の呼び出しに応える'); rtcDropLine();
  } else if(PC&&RTC_PEER===from){ hpLog('同じ相手から新しい呼び出し（古い線を畳んで応える）'); rtcDropLine();
  } else if(MODE!=='idle'||PC){ hpLog('取り込み中なので応えない（'+MODE+'）'); return; }
  const card=(typeof hpCardOf==='function')?hpCardOf(from):null;
  if(!card){ hpLog('カードの無い相手なので応えられない '+from); return; }
  bgReset();
  RTC_ANS={peer:from,n:hasLegs?Object.keys(o.legs).length:1};
  RTC_PEER=from; RTC_DEV=r.fromDev||null; setMode('calling'); CALL_DEADLINE=Date.now()+RTC_WAIT_ANSWER+RTC_WAIT_PUT; rtcWatch();
  try{
    addStat(TL('sys_incoming',{who:nickOf(from)}));
    PC=new RTCPeerConnection(RTCCFG);
    PC.onconnectionstatechange=()=>{ try{ const st=PC&&PC.connectionState; if((st==='disconnected'||st==='failed'||st==='closed')&&MODE==='connected'){ addStat(TL('sys_line_dead')); hangup(); } }catch(e){} };
    PC.ondatachannel=e=>wireDC(e.channel,from);
    await PC.setRemoteDescription({type:'offer',sdp:o.sdp});
    await PC.setLocalDescription(await PC.createAnswer());
    await waitGathering(PC);
    const sdp=PC.localDescription.sdp, myFp=extractFingerprint(sdp); if(!myFp) throw new Error(T('e_nofp'));
    const to=(Array.isArray(card.devices)&&card.devices.indexOf(r.fromDev)>=0)?Object.assign({},card,{devices:[r.fromDev]}):card;
    await hpPut(to, JSON.stringify({v:1,type:'answer',call:o.call,sdp:sdp,fp:myFp}), 'sig');
    if(MODE==='calling'){ addStat(TL('sys_answered')); CALL_DEADLINE=Date.now()+RTC_WAIT_ANSWER; rtcWatch(); }

  }catch(e){ log(TL('lg_incfail',{err:rtcWhy(e)})); WAIT_PEER=null; hangup(); }
}

const RTC_LAST=new Map(); let RTC_GAP=60000, RTC_DC_HOLD=30000;
function rtcNoDirect(){ try{ return localStorage.getItem('p2p_nodirect')==='1'; }catch(e){ return false; } }
function rtcSend(peer,text,ts){
  if(!rtcLineTo(peer)) return false;
  const body={v:1,type:'msg',id:ts,text:String(text)}; try{ const hm=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(hm&&typeof hpXhLast==='function'&&hpXhLast(hm.xh)==='b'){ body.back=1; body.xh=hpXhNorm(hm.xh); } }catch(e){}
  try{ DC.send(JSON.stringify(body)); rtcTouch(); }catch(e){ return false; }
  try{ if(typeof hpSceneLetter==='function') hpSceneLetter('hand','out'); }catch(_){}
  hpHistPatch(peer,ts,m=>{ m.dc=Date.now(); }); ackWait(peer,ts,String(text)); return true;
}
function rtcFlush(peer){
  if(!rtcLineTo(peer)) return 0; let n=0;
  for(const m of histLoad(peer).filter(x=>x.d==='s'&&x.p&&!x.k&&!x.x&&!(x.dv&&typeof sibDv==='function'&&x.dv!==sibDv()))){
    try{
      if(m.img){ imgQueueSend(peer,m); n++; }
      else if(m.file){ fileQueueSend(peer,m); n++; }
      else if(!m.hp&&!HP_SENDING.has(m.ts)&&typeof m.t==='string'&&m.t){ if(rtcSend(peer,m.t,m.ts)) n++; }
    }catch(e){}
  }
  if(n) log(TL('lg_flushed',{n:n}));
  return n;
}
function rtcFallback(peer,ts,text){ hpHistPatch(peer,ts,m=>{ delete m.dc; }); return hpSendText(peer,text,ts,{auto:true}); }
function rtcCallMaybe(peer){
  if(!ID||!peer||rtcNoDirect()||MODE!=='idle'||PC||typeof RTCPeerConnection!=='function'||!hpCardOf(peer)||(typeof hpBlocked==='function'&&hpBlocked(peer))) return false;
  if(Date.now()-(RTC_LAST.get(peer)||0)<RTC_GAP) return false;
  if(histLoad(peer).some(m=>m.d==='s'&&m.p&&!m.hp&&!m.x&&m.hf&&m.hf.k!=='wait')) return false;
  startCall(true,peer); return true;
}
function rtcCallNow(peer){ RTC_LAST.delete(peer); return rtcCallMaybe(peer); }

let RTC_IDLE=180000, RTC_ACT=0, RTC_IDLE_T=null;
function rtcShown(peer){ return !!peer&&CURPEER===peer&&(typeof CONV_OPEN!=='undefined')&&!!CONV_OPEN; }
function rtcTarget(){ return RTC_PEER||(RTC_CALL&&RTC_CALL.peer)||WAIT_PEER||null; }
function rtcBusyFor(peer){ const t=rtcTarget(); return !!peer&&MODE!=='idle'&&!!t&&t!==peer; }
function rtcBadges(){ try{ updateBadges(); }catch(e){} }
function rtcReadSoon(peer){ try{ if(typeof hpReadSoon==='function') hpReadSoon(peer); }catch(e){} }
function rtcTouch(){ RTC_ACT=Date.now(); }
function rtcSending(){ return (typeof IMG_SENDING!=='undefined'&&!!IMG_SENDING)||(typeof FILE_SENDING!=='undefined'&&!!FILE_SENDING); }
function rtcIdleWatch(){
  if(RTC_IDLE_T){ clearTimeout(RTC_IDLE_T); RTC_IDLE_T=null; }
  if(MODE!=='connected') return;
  if(rtcSending()) rtcTouch();
  const left=RTC_ACT+RTC_IDLE-Date.now();
  if(left<=0){ addStat(TL('sys_idle_close')); hangup(); return; }
  RTC_IDLE_T=setTimeout(rtcIdleWatch, Math.min(left+20, 15000));
}
function rtcUi(){
  const t=rtcTarget(), other=(MODE!=='idle'&&!!t&&!!CURPEER&&t!==CURPEER);
  $('#btn-call').disabled=(MODE!=='idle');

  $('#btn-hang').disabled=(MODE==='idle'||other);
  $('#status').textContent=
    other?TF('st_line_other',{who:nickOf(t)}):
    MODE==='idle'?T('st_idle'):
    MODE==='listening'?T('st_listening'):
    MODE==='calling'?T('st_calling'):
    MODE==='connected'?`${nickOf(t)} ${T('st_conn')}`:'';
  try{ if(CURPEER&&typeof hpDecorate==='function') hpDecorate(CURPEER); }catch(e){}
  try{ if(typeof hpCsRefresh==='function') hpCsRefresh(); }catch(e){}
}
function rtcGot(peer,ids){ try{ if(DC&&DC.readyState==='open'&&RTC_PEER===peer) DC.send(JSON.stringify({v:1,type:'got',ids:ids})); }catch(e){} }
function rtcReadAgain(peer,ids){ try{ if(DC&&DC.readyState==='open'&&RTC_PEER===peer) DC.send(JSON.stringify({v:1,type:'read',ids:ids})); }catch(e){} }
function rtcOnGot(peer,ids){
  const list=(Array.isArray(ids)?ids:[]).map(Number).filter(n=>n>0&&Number.isFinite(n)).slice(0,200); if(!list.length) return 0;
  ackClear(list);
  const h=histLoad(peer); let n=0;
  for(const m of h){ if(m.d==='s'&&!m.g&&list.includes(m.ts)){ m.g=Date.now(); delete m.p; delete m.dc; delete m.hf; delete m.wl; n++; } }
  if(n){ histSave(peer,h); try{ if(typeof hpMarkRows==='function') hpMarkRows(peer,list); }catch(e){} try{ if(typeof sibMirror==='function') for(const m of h){ if(m.d==='s'&&m.g&&list.includes(m.ts)) sibMirror(peer,m); } }catch(e){}   log(TL('lg_got',{n:n,name:nickOf(peer)})); }
  return n;
}
function rtcMediaWait(peer,ts){ if(typeof hpHistPatch==='function') hpHistPatch(peer,ts,m=>{ m.wl=1; }); try{ if(typeof hpDecorate==='function') hpDecorate(peer); }catch(e){} }
function rtcNextMedia(justClosed){
  if(!ID||MODE!=='idle'||PC) return false;
  let best=null, bt=0;
  for(const c of contacts()){ if(c.address===justClosed) continue;
    const w=histLoad(c.address).filter(m=>m.d==='s'&&m.p&&m.wl&&!m.k&&!m.x&&(m.img||m.file)); if(!w.length) continue;
    const t=rtcShown(c.address)?Infinity:w[w.length-1].ts; if(t>bt){ bt=t; best=c.address; } }
  if(!best||!rtcCallMaybe(best)) return false;
  const h=histLoad(best); for(const m of h){ if(m.wl) delete m.wl; } histSave(best,h);
  return true;
}
