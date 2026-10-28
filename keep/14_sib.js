const SIB={}; let SIB_ON=false, SIB_TIMER=null, SIB_APPLYING=false; const SIB_HIST_IN={n:0,skip:0};
let SIB_FLOW=true; const SIB_SEEN_AT={}; let SIB_SEEN_GAP=1000;
let SIB_OFFER_MAXAGE=45000, SIB_SIG_MAXAGE=90000, SIB_WAIT=60000, SIB_KICK_DELAY=4000, SIB_GAP=30000, SIB_STABLE=60000, SIB_LATE=8000;
const SIB_STEPS=[5000,30000,120000], SIB_TRY={}, SIB_LAST={};
function sibMe(){ return (typeof POST!=='undefined'&&POST&&POST.pub)?POST.pub:''; }
function sibDv(){ return String(sibMe()).slice(0,16); }
function sibRows(){ try{ return (ID&&typeof hpSibs==='function')?hpSibs():[]; }catch(e){ return []; } }
function sibIsMine(dev){ return !!dev&&sibRows().some(d=>d.dev===dev)&&!(typeof hpMyGone==='function'&&hpMyGone().some(g=>g&&g.dev===dev)); }
function sibTargets(){ const now=Date.now(); return sibRows().filter(d=>d.dev&&d.dev!==sibMe()&&hpPreValid(d.pre,d.dev,now)).map(d=>d.dev); }
function sibLabel(dev){ const d=sibRows().find(x=>x.dev===dev); return ((d&&d.label)?d.label+' ':'')+String(dev).slice(0,10)+'\u2026'; }
function sibCan(){ return !!(ID&&SIB_ON&&typeof RTCPeerConnection==='function'&&typeof POST!=='undefined'&&POST.up&&!POST.notOwner&&!(typeof rtcNoDirect==='function'&&rtcNoDirect())); }

function sibHistMap(){ try{ const m=JSON.parse(hpHGet('p2p_sibsince_'+ID.address)||'{}');   return (m&&typeof m==='object')?m:{}; }catch(e){ return {}; } }
function sibHistDue(dev){ const v=sibHistMap()[dev]; return typeof v==='number'&&v>0; }
function sibHistSet(dev,on){ try{ const k='p2p_sibsince_'+ID.address, m=sibHistMap(); if(on) m[dev]=Date.now(); else delete m[dev]; hpHSet(k,JSON.stringify(m));   }catch(e){} }
function sibDrop(s){
  if(s.timer){ clearTimeout(s.timer); s.timer=null; }
  try{ if(s.dc){ s.dc.onopen=null; s.dc.onclose=null; s.dc.onmessage=null; s.dc.close(); } }catch(e){}
  try{ if(s.pc){ s.pc.onconnectionstatechange=null; s.pc.ondatachannel=null; s.pc.close(); } }catch(e){}
}
function sibClose(id){ const s=SIB[id]; if(!s)return; delete SIB[id]; sibDrop(s); renderSiblings(); }
function sibSend(id,obj){
  const s=SIB[id]; if(!s||s.state!=='open'||!s.dc)return false;
  if(!SIB_FLOW&&!(obj&&(obj.t==='hello'||obj.t==='bye')))return false;
  if(!sibIsMine(id)){ sibClose(id); return false; }
  try{ s.dc.send(JSON.stringify(obj)); return true; }catch(e){ return false; }
}
function renderSiblings(){ const el=document.getElementById('sib-status'); if(!el)return; const open=Object.keys(SIB).filter(k=>SIB[k].state==='open'); el.textContent=open.length?open.map(k=>{ const d=sibRows().find(x=>x.dev===k); return (typeof hpDevName==='function')?hpDevName(d&&d.label):sibLabel(k); }).join(', '):T('sib_none');   try{ const row=el.parentNode; if(row&&row.style){ let any=false; try{ any=!!(ID&&typeof hpSibs==='function'&&hpSibs().length>0); }catch(e){} row.style.display=any?'':'none'; } }catch(e){} }

function sibCfg(tn){ try{ if(!tn||!tn.host||!tn.port||!tn.user||!tn.pass) return RTCCFG; return {iceServers:[].concat(RTCCFG.iceServers||[],[{urls:'turn:'+tn.host+':'+tn.port+'?transport=udp',username:tn.user,credential:tn.pass}])}; }catch(e){ return RTCCFG; } }
async function sibTurn(){ try{ if(typeof hpTurnCreds!=='function') return null; const c=await hpTurnCreds(); return (c&&c.host&&c.port&&c.user&&c.pass)?c:null; }catch(e){ try{ return (typeof hpTurnOther==='function')?hpTurnOther():null; }catch(x){ return null; } } }
function sibNew(dev,role,call,cfg){ const s={dev:dev,pc:new RTCPeerConnection(cfg||RTCCFG),dc:null,state:'connecting',role:role,call:call,at:Date.now(),ans:false,openAt:0,bye:false,timer:null,turn:!!(cfg&&cfg!==RTCCFG)}; SIB[dev]=s; SIB_LAST[dev]=Date.now();
  s.pc.onconnectionstatechange=()=>{ try{ if(SIB[dev]!==s)return; const st=s.pc.connectionState; if(st==='failed'&&s.state==='connecting'&&s.role==='answer'&&Date.now()-s.at<SIB_WAIT) return;   if(st==='failed'||st==='closed'||(st==='disconnected'&&s.state==='open')) sibLost(s); }catch(e){} };
  s.timer=setTimeout(()=>{ s.timer=null; if(SIB[dev]!==s||s.state==='open')return;
    if(s.role==='call'&&!s.ans){ hpLog('自分の機械（'+sibLabel(dev)+'）は応答なし（開いていないらしい。向こうが開いたときに、向こうから呼び出してくる）'); try{ const w=hpHistGet(); if(w&&w.dev===dev&&w.st==='wait') hpHistState(dev,'noans'); }catch(e){}   sibClose(dev); return; }
    sibLost(s); },SIB_WAIT);
  return s; }
function sibLost(s){
  const dev=s.dev; if(SIB[dev]!==s)return; const was=(s.state==='open'), bye=s.bye, stable=was&&(Date.now()-s.openAt>=SIB_STABLE);
  sibClose(dev);
  hpLog(was?('自分の機械（'+sibLabel(dev)+'）との線が閉じた'+(bye?'（向こうが窓を閉じた）':'')):('自分の機械（'+sibLabel(dev)+'）と線をつなげなかった'));
  try{ const w=hpHistGet(); if(was&&w&&w.dev===dev&&w.st==='recv') hpHistState(dev,'stop'); if(HP_HIST_TX[dev]&&HP_HIST_TX[dev].st==='send'){ delete HP_HIST_TX[dev]; hpHistTxUi(); } }catch(e){}
  if(stable&&SIB_TRY[dev]) SIB_TRY[dev].n=0;
  if(!bye&&(was||s.role==='call')) sibRetry(dev);
}
function sibRetry(dev){
  const t=SIB_TRY[dev]=SIB_TRY[dev]||{n:0,timer:null}; if(t.timer)return;
  if(t.n>=SIB_STEPS.length){ hpLog('自分の機械（'+sibLabel(dev)+'）とのやり直しは '+SIB_STEPS.length+' 回で止めた（どちらかが開き直したときに、また試す）'); return; }
  const ms=SIB_STEPS[t.n++]+((sibMe()<dev)?0:SIB_LATE);
  t.timer=setTimeout(()=>{ t.timer=null; if(!SIB[dev]) sibCall(dev).catch(()=>{}); },ms);
}
async function sibCall(dev){
  if(!sibCan()||SIB[dev]||sibTargets().indexOf(dev)<0) return false;
  const tn=await sibTurn(); if(!sibCan()||SIB[dev]||sibTargets().indexOf(dev)<0) return false;
  const s=sibNew(dev,'call',hpHex(crypto.getRandomValues(new Uint8Array(8))),sibCfg(tn));
  try{
    wireSibDC(s,s.pc.createDataChannel('sync'));
    await s.pc.setLocalDescription(await s.pc.createOffer()); await waitGathering(s.pc);
    if(SIB[dev]!==s) return false;
    const sdp=s.pc.localDescription.sdp, fp=extractFingerprint(sdp); if(!fp) throw new Error(T('e_nofp'));
    const body={v:1,type:'sib-offer',call:s.call,sdp:sdp,fp:fp}; if(tn) body.t={h:tn.host,p:tn.port,u:tn.user,k:tn.pass};
    const n=await hpSibPut(body,[dev],'sig');
    if(SIB[dev]!==s) return false;
    if(!n){ sibClose(dev); return false; }
    s.at=Date.now(); hpLog('自分の機械（'+sibLabel(dev)+'）を呼び出した'+(tn?'（交換手 '+tn.host+':'+tn.port+' も使える）':''));
    return true;
  }catch(e){ hpLog('自分の機械（'+sibLabel(dev)+'）を呼び出せない '+((e&&e.message)||e)); if(SIB[dev]===s) sibClose(dev); return false; }
}
async function sibOnSig(r){
  if(!ID||!r) return;
  if(r.from!==ID.address||r.fromMaster!==ID.publicKey){ hpLog('自分の機械でない相手からの合図（捨てた）'); return; }
  let o=null; try{ o=JSON.parse(r.body); }catch(e){ o=null; }
  if(!o||o.v!==1||(o.type!=='sib-offer'&&o.type!=='sib-answer')||typeof o.call!=='string'||!/^[0-9a-f]{16}$/.test(o.call)||typeof o.sdp!=='string'||typeof o.fp!=='string'){ hpLog('自分の機械からの合図の形が違う（捨てた）'); return; }
  const from=r.fromDev, me=(await hp5Me()).dev;
  if(!from||from===me) return;
  if(!sibIsMine(from)){ hpLog('機械の一覧に無い機械からの合図（捨てた）'); return; }
  const fp=extractFingerprint(o.sdp); if(!fp||fp!==o.fp){ hpLog('自分の機械からの合図のフィンガープリントが合わない（捨てた）'); return; }
  const age=Date.now()-Number(r.sentAt); if(!(Math.abs(age)<=(o.type==='sib-offer'?SIB_OFFER_MAXAGE:SIB_SIG_MAXAGE))){ hpLog('自分の機械からの古い合図（'+Math.round(age/1000)+' 秒前。捨てた）'); return; }
  if(!sibCan()){ hpLog('自分の機械からの合図に、いまは応えられない（捨てた）'); return; }
  if(o.type==='sib-answer'){
    const s=SIB[from]; if(!s||s.state!=='connecting'||s.role!=='call'||s.call!==o.call||s.ans){ hpLog('自分の機械からの、待っていない返事（捨てた）'); return; }
    s.ans=true;
    try{ await s.pc.setRemoteDescription({type:'answer',sdp:o.sdp}); }catch(e){ hpLog('自分の機械からの返事を受けられない '+e.message); if(SIB[from]===s) sibLost(s); }
    return;
  }
  const s0=SIB[from];
  if(s0&&s0.state==='connecting'&&s0.role==='call'&&(Date.now()-s0.at<SIB_OFFER_MAXAGE)&&me<from){ hpLog('自分の機械と同時の呼び出し：こちらの呼び出しを残す'); return; }
  if(s0){ hpLog(s0.state==='open'?'線がある自分の機械から新しい呼び出し（古い線を畳んで応える）':'自分の機械と同時の呼び出し：向こうの呼び出しに応える'); sibClose(from); }
  { const t=SIB_TRY[from]; if(t&&t.timer){ clearTimeout(t.timer); t.timer=null; } }
  const tn=(typeof hpCallTurnOf==='function')?hpCallTurnOf(o.t):null;
  const s=sibNew(from,'answer',o.call,sibCfg(tn));
  try{
    s.pc.ondatachannel=e=>wireSibDC(s,e.channel);
    await s.pc.setRemoteDescription({type:'offer',sdp:o.sdp});
    await s.pc.setLocalDescription(await s.pc.createAnswer()); await waitGathering(s.pc);
    if(SIB[from]!==s) return;
    const sdp=s.pc.localDescription.sdp, myFp=extractFingerprint(sdp); if(!myFp) throw new Error(T('e_nofp'));
    const n=await hpSibPut({v:1,type:'sib-answer',call:o.call,sdp:sdp,fp:myFp},[from],'sig');
    if(SIB[from]!==s) return;
    if(!n){ hpLog('自分の機械（'+sibLabel(from)+'）の受け取り用の鍵が切れていて、返事を出せない'); sibClose(from); return; }
    if(s.state!=='open'){ s.at=Date.now(); hpLog('自分の機械（'+sibLabel(from)+'）からの呼び出しに応えた'); }
  }catch(e){ hpLog('自分の機械（'+sibLabel(from)+'）からの呼び出しに応えられない '+((e&&e.message)||e)); if(SIB[from]===s) sibClose(from); }
}
function wireSibDC(s,dc){
  const id=s.dev; s.dc=dc;
  dc.onopen=()=>{ if(SIB[id]!==s)return; s.state='open'; s.openAt=Date.now(); if(s.timer){ clearTimeout(s.timer); s.timer=null; } { const t=SIB_TRY[id]; if(t&&t.timer){ clearTimeout(t.timer); t.timer=null; } }
    hpLog('自分の機械（'+sibLabel(id)+'）と線がつながった（'+Math.round((s.openAt-s.at)/100)/10+' 秒）'); renderSiblings(); sibSend(id,{t:'hello',v:2}); if(sibHistDue(id)) sibSendHistory(id).catch(()=>{}); };
  try{ dc.binaryType='arraybuffer'; }catch(e){}
  dc.onmessage=e=>{ if(SIB[id]!==s)return; if(!sibIsMine(id)){ sibClose(id); return; }
    if(e.data instanceof ArrayBuffer){ if(SIB_FLOW) sibBinary(id,e.data).catch(()=>{}); return; } let o=null; try{ o=JSON.parse(String(e.data)); }catch(err){ return; } try{ sibOnMessage(id,o); }catch(err){ log(TL('lg_sib_fail',{err:err.message})); } };
  dc.onclose=()=>{ if(SIB[id]===s) sibLost(s); };
}
function sibApply(peer,item){
  if(!peer||!item||typeof item.ts!=='number'||(item.d!=='s'&&item.d!=='p'))return null;
  if(typeof hpKeepTooOld==='function'&&hpKeepTooOld(item)&&!histLoad(peer).some(x=>x.ts===item.ts&&x.d===item.d))return null;
  if(item.t==='[object ArrayBuffer]'||item.t==='[object Blob]')return null;
  if(!(typeof hpIdFmt==='function'&&hpIdFmt(peer)))return null;
  if(item.d==='p'&&typeof histVoided==='function'&&histVoided(peer,item.ts)){
    if(!(typeof hpXhLast==='function'&&hpXhLast(item.xh)==='b')) return null;
    const h0=histLoad(peer); const i0=h0.findIndex(x=>x.ts===item.ts&&x.d==='v'); const m0={d:'p',t:String(item.t||''),ts:item.ts,rx:(typeof item.rx==='number')?item.rx:Date.now(),xh:hpXhNorm(item.xh)}; if(item.img)m0.img=item.img; if(item.file)m0.file=item.file; if(i0>=0) h0[i0]=m0; else { h0.push(m0); histSort(h0); }
    SIB_APPLYING=true; try{ histSave(peer,h0); }finally{ SIB_APPLYING=false; }
    try{ if(CURPEER===peer&&CONV_OPEN&&typeof histRender==='function') histRender(peer); }catch(e){} try{ updateBadges(); }catch(e){}
    return {isNew:false,item:m0,back:1};
  }
  const h=histLoad(peer); let m=h.find(x=>x.ts===item.ts&&x.d===item.d); let isNew=false, changed=false;
  if(!m){ m={d:item.d,t:String(item.t||''),ts:item.ts}; if(item.d==='p') m.rx=(typeof item.rx==='number')?item.rx:Date.now(); if(item.img)m.img=item.img; if(item.file)m.file=item.file; h.push(m); histSort(h);   isNew=true; changed=true; }
  if(item.d==='p'&&!m.fd&&typeof item.fd==='string'&&/^[0-9a-f]{16}$/.test(item.fd)){ m.fd=item.fd; changed=true; }
  if(item.d==='s'){
    if(item.dv&&item.dv!==sibDv()&&!m.dv&&!m.hp&&!m.g&&!m.k){ m.dv=String(item.dv).slice(0,16); changed=true; }
    if(item.hp&&typeof item.hp==='object'&&!m.hp){ m.hp={id:String(item.hp.id||''),exp:Number(item.hp.exp)||0}; delete m.p; delete m.hf; changed=true; }
    if(item.g&&!m.g){ m.g=Number(item.g)||Date.now(); delete m.p; delete m.dc; delete m.hf; delete m.wl; changed=true; }
    if(item.k&&!m.k){ m.k=1; delete m.p; changed=true; }
    { const nx=(typeof hpXhNorm==='function')?hpXhNorm(item.xh):[], ox=(typeof hpXhNorm==='function')?hpXhNorm(m.xh):[];
      if(nx.length>ox.length){ m.xh=nx; if(nx[nx.length-1].a==='b'){ for(const k of ['x','xv','xd','xf','xd0','hp','g','k','dc','hf','wl']) delete m[k]; if(item.p) m.p=1; if(item.dv) m.dv=String(item.dv).slice(0,16); } else { m.x=1; delete m.p; } changed=true; }
      else if(item.x&&!m.x&&!nx.length){ m.x=1; delete m.p; changed=true; } }
    if(item.p&&isNew&&!m.hp&&!m.g&&!m.k&&!m.x){ m.p=1; changed=true; }
  } else {
    if(item.rs&&!m.rs){ m.rs=1; changed=true; }
  }
  if(typeof item.u==='number'&&(!m.u||item.u>m.u)){ m.u=item.u; }
  if(changed){ SIB_APPLYING=true; try{ histSave(peer,h); }finally{ SIB_APPLYING=false; } }
  return changed?{isNew,item:m}:null;
}
function sibReflect(peer,r){ if(!r)return; try{
  if(r.item.d==='p'&&r.isNew){ try{ notifySound('msg'); }catch(e){} try{ updateBadges(); }catch(e){} }
  if(CURPEER!==peer)return;
  if(r.isNew){ addMsgAt(r.item.d==='s'?'self':'peer',r.item.t,r.item.d==='s'?(myName()||T('me')):nickOf(peer),r.item.ts,r.item.x,r.item.p,r.item.k,r.item.img,r.item.file);   if(r.item.d==='p'&&!r.item.rs&&typeof hpReadSoon==='function') hpReadSoon(peer); }
  else { const el=findMsgEl(r.item.ts); if(el){ if(r.back||(r.item.d==='s'&&!r.item.x&&el.classList&&el.classList.contains('void'))){ try{ if(typeof histRender==='function') histRender(peer); }catch(e){} return; }   if(r.item.x)markVoid(el); if(r.item.k&&!(typeof hpReadOff==='function'&&hpReadOff()))markRead(el);   } }
  if(r.item.d==='s'&&typeof hpMarkRows==='function') hpMarkRows(peer,[r.item.ts]);
}catch(e){} }
function sibDelApply(peer,ts,d){
  if(!peer||typeof ts!=='number'||!(typeof hpIdFmt==='function'&&hpIdFmt(peer)))return false;
  if((d||'p')!=='p') return false;
  let r='bad'; SIB_APPLYING=true; try{ r=hpVoidIn(peer,ts,{force:1});   }finally{ SIB_APPLYING=false; }
  return r==='gone'||r==='new';
}
function sibSeenApply(peer,at){
  if(!peer||typeof at!=='number'||!(at>0)||!(typeof hpIdFmt==='function'&&hpIdFmt(peer)))return false;
  try{ const o=lastOpenLoad(); if((o[peer]||0)>=at)return false; o[peer]=at; hpHSet(lastOpenKey(),JSON.stringify(o));   }catch(e){ return false; }
  try{ convDirty(); }catch(e){} try{ updateBadges(); }catch(e){} return true;
}
let SIB_HIST_BATCH=40, SIB_HIST_CHARS=60000; const SIB_HIST_BUSY=new Set();
let SIB_HIST_Q=Promise.resolve(), SIB_HIST_PEND=0;
function sibHistLater(fn){ SIB_HIST_PEND++; SIB_HIST_Q=SIB_HIST_Q.then(fn).catch(()=>{}).then(()=>{ SIB_HIST_PEND--; }); return SIB_HIST_Q; }
function sibHistCard(c){ return c?{ address:c.address, nick:c.nick||'', pubKey:c.pubKey||null, keyAddedAt:c.keyAddedAt||0, card:c.card||null, cardAt:c.cardAt||0, mt:(typeof hpRowMt==='function')?hpRowMt(c):(Number(c.mt)||0) }:null; }
function sibHistItem(m){ const it=Object.assign({},m); if(it.d==='s'&&!it.dv) it.dv=sibDv(); delete it.dc; delete it.hf; delete it.wl; return it; }
async function sibSendHistory(id){
  if(SIB_HIST_BUSY.has(id)) return false; const s=SIB[id]; if(!s||s.state!=='open'||!SIB_FLOW) return false;
  SIB_HIST_BUSY.add(id); HP_HIST_TX[id]={st:'send',n:0,at:Date.now()}; hpHistTxUi();
  try{
    let n=0, np=0; const lo=(typeof lastOpenLoad==='function')?lastOpenLoad():{}, seen={};
    for(const c of contacts()){
      const all=histLoad(c.address).filter(x=>x&&typeof x.ts==='number'&&(x.d==='s'||x.d==='p')&&x.t!=='[object ArrayBuffer]'&&x.t!=='[object Blob]').map(sibHistItem); if(!all.length) continue;
      np++; if(lo[c.address]) seen[c.address]=lo[c.address];
      let cur=[], len=0, c1=sibHistCard(c); const flush=async()=>{ if(!cur.length) return; const hm={t:'hist',peer:c.address,items:cur}; if(c1){ hm.c=c1; c1=null; }   if(!sibSend(id,hm)) throw new Error('線が閉じた'); n+=cur.length; cur=[]; len=0; HP_HIST_TX[id]={st:'send',n:n,at:Date.now()}; hpHistTxUi(); const d=s.dc; while(d&&d.bufferedAmount>1048576&&SIB[id]===s) await sleep(50); };
      for(const it of all){ const l=JSON.stringify(it).length; if(cur.length&&(cur.length>=SIB_HIST_BATCH||len+l>SIB_HIST_CHARS)) await flush(); cur.push(it); len+=l; }
      await flush();
    }
    if(!sibSend(id,{t:'histdone',n:n,c:np,seen:seen})) throw new Error('線が閉じた');
    sibHistSet(id,false); hpLog('過去の会話を自分の機械（'+sibLabel(id)+'）へ写した（'+np+' 人・'+n+' 通）'); HP_HIST_TX[id]={st:'done',n:n,at:Date.now()}; hpHistTxUi(); setTimeout(hpHistTxUi,HP_HIST_DONE_MS+500);
    return true;
  }catch(e){ delete HP_HIST_TX[id]; hpHistTxUi();   hpLog('過去の会話を写せなかった（'+((e&&e.message)||e)+'。次に線がつながったら、もう一度写す）'); return false; }
  finally{ SIB_HIST_BUSY.delete(id); }
}

let HP_HIST_DONE=null; const HP_HIST_DONE_MS=60000, HP_HIST_WAIT_MAX=7*864e5;
function hpHistWait(dev){ try{ hpHSet('p2p_histwait',JSON.stringify({dev:String(dev||''),at:Date.now(),st:'wait',n:0})); }catch(e){} HP_HIST_DONE=null; try{ hpHistNote(); }catch(e){} }
function hpHistDevName(dev){ try{ if(typeof sibRows==='function'&&typeof hpDevName==='function'){ const d=sibRows().find(x=>x.dev===dev); if(d&&d.label) return hpDevName(d.label); } }catch(e){} return sibLabel(dev); }
function hpHistGet(){ try{ return JSON.parse(hpHGet('p2p_histwait')||'null'); }catch(e){ return null; } }
function hpHistState(dev,st,add){ let w=hpHistGet(); if(!w||!w.dev){ if(st!=='recv') return; w={dev:String(dev||''),at:Date.now(),st:'recv',n:0}; } if(dev&&w.dev!==dev) return; w.st=st; if(add) w.n=(Number(w.n)||0)+add; try{ hpHSet('p2p_histwait',JSON.stringify(w)); }catch(e){} try{ hpHistNote(); }catch(e){} }
function hpHistNote(){ if(typeof document==='undefined'||typeof document.getElementById!=='function') return ''; const cl=document.getElementById('convlist'); if(!cl||!cl.parentNode) return ''; const w=hpHistGet(); const now=Date.now(); let t='';
  if(HP_HIST_DONE&&now-HP_HIST_DONE.at<HP_HIST_DONE_MS) t=(HP_HIST_DONE.n>0)?TF('hist_done',{n:HP_HIST_DONE.n}):TF('hist_done0',{});
  else if(w&&w.dev&&now-(Number(w.at)||0)<HP_HIST_WAIT_MAX) t=(w.st==='noans')?TF('hist_noans',{}):(w.st==='recv')?TF('hist_recv',{n:Number(w.n)||0}):(w.st==='stop')?TF('hist_stop',{n:Number(w.n)||0}):TF('hist_wait',{dev:hpHistDevName(w.dev)});
  let el=document.getElementById('hist-note'); if(!t){ if(el&&el.remove) el.remove(); return ''; } if(!el){ el=document.createElement('div'); el.id='hist-note'; el.className='hist-note'; cl.parentNode.insertBefore(el,cl); } el.textContent=t; try{ const tap=!(HP_HIST_DONE&&now-HP_HIST_DONE.at<HP_HIST_DONE_MS)&&!!(w&&w.dev&&(w.st==='wait'||w.st==='noans'||!w.st)); el.onclick=tap?()=>{ hpHistDismiss(); }:null; if(el.style) el.style.cursor=tap?'pointer':''; }catch(e){}   return t; }
function hpHistDismiss(){ try{ hpHSet('p2p_histwait',''); }catch(e){} try{ if(typeof hpLog==='function') hpLog('過去の手紙の写しを待つ帯を閉じた（予約は送る側に残る。両方の端末で同時に開けば写る）'); }catch(e){} try{ hpHistNote(); }catch(e){} return true; }

const HP_HIST_TX={}; let HP_HIST_TXT=null;
function hpHistTxUi(){ if(HP_HIST_TXT) return; HP_HIST_TXT=setTimeout(()=>{ HP_HIST_TXT=null; try{ if(typeof renderDevices==='function') renderDevices(); }catch(e){} },300); }
function hpHistTxText(dev){ const x=HP_HIST_TX[dev], now=Date.now(); if(x&&x.st==='send') return TF('dv_histsend',{n:x.n}); if(x&&x.st==='done'&&now-x.at<HP_HIST_DONE_MS) return TF('dv_histdone',{n:x.n}); try{ if(typeof sibHistDue==='function'&&sibHistDue(dev)) return TF('dv_histwait',{name:hpHistDevName(dev)}); }catch(e){} return ''; }
function sibHistAsk(dev){
  if(!ID||!dev||dev===sibMe()||!sibIsMine(dev)) return 'bad';
  sibHistSet(dev,true); const s=SIB[dev];
  if(s&&s.state==='open'){ sibSendHistory(dev).catch(()=>{}); return 'now'; }
  hpLog('自分の機械（'+sibLabel(dev)+'）へ過去の会話を写す（線がつながったら送る）'); hpHistTxUi();   try{ sibKick(true); }catch(e){} try{ if(typeof hpSibPut==='function'&&typeof POST!=='undefined'&&POST.up) hpSibPut({v:1,type:'sibhq'},[dev]).catch(()=>{}); }catch(e){}   return 'later';
}
function sibHistIn(id,o){ try{ hpHistState(id,'recv',Array.isArray(o.items)?o.items.length:0); }catch(e){}   if(!isContact(o.peer)){ SIB_HIST_IN.skip=(SIB_HIST_IN.skip||0)+1; return; } let n=0; for(const it of (Array.isArray(o.items)?o.items:[]).slice(0,200)){ if(sibApply(o.peer,it))n++; } SIB_HIST_IN.n=(SIB_HIST_IN.n||0)+n; if(n&&CURPEER===o.peer){ try{ histRender(o.peer); }catch(e){} } }
function sibHistDone(id,o){ HP_HIST_DONE={n:Number(SIB_HIST_IN.n)||0,at:Date.now()}; try{ hpHSet('p2p_histwait',''); }catch(e){} try{ setTimeout(()=>{ try{ hpHistNote(); }catch(e){} },HP_HIST_DONE_MS+500); }catch(e){}   const sn=(o.seen&&typeof o.seen==='object')?o.seen:{}; for(const p of Object.keys(sn).slice(0,500)){ if(isContact(p)) sibSeenApply(p,Number(sn[p])); }
    hpLog('自分の機械（'+sibLabel(id)+'）から過去の会話を受け取った（'+(Number(o.c)||0)+' 人・'+(Number(o.n)||0)+' 通。この機械に無かったもの '+(SIB_HIST_IN.n||0)+' 通'+(SIB_HIST_IN.add?'・連絡先 '+SIB_HIST_IN.add+' 件も写した':'')+(SIB_HIST_IN.skip?'・連絡先に無い相手の分は取り込まない':'')+'）'); SIB_HIST_IN.n=0; SIB_HIST_IN.skip=0; SIB_HIST_IN.add=0;
    try{ convDirty(); }catch(e){} try{ updateBadges(); }catch(e){} }
function hpHistHave(){ try{ for(const c of contacts()){ if(histLoad(c.address).some(x=>x&&typeof x.ts==='number'&&(x.d==='s'||x.d==='p'))) return true; } }catch(e){} return false; }
function sibOnMessage(id,o){
  if(!o||!o.t)return;
  if(o.t==='hello')return;
  if(o.t==='bye'){ const s=SIB[id]; if(s){ s.bye=true; sibLost(s); } return; }
  if(!SIB_FLOW)return;
  if(o.t==='evt'){ const r=sibApply(o.peer,o.item); if(r&&r.isNew) hpLog('自分の機械（'+sibLabel(id)+'）から'+(r.item.d==='s'?'送った手紙':'届いた本文')+'の写し → '+nickOf(o.peer)+' の履歴へ'); sibReflect(o.peer,r); if(r&&r.isNew&&r.item.img&&typeof sibBlobAuto==='function') sibBlobAuto(r.item.img,id); return; }
  if(o.t==='del'){ if(sibDelApply(o.peer,o.ts,o.d)) hpLog('自分の機械（'+sibLabel(id)+'）で消された 1 通を、この機械でも消した（'+nickOf(o.peer)+'）'); return; }
  if(o.t==='seen'){ sibSeenApply(o.peer,o.at); return; }
  if(o.t==='hist'){
    if(!isContact(o.peer)&&o.c&&typeof o.c==='object'&&o.c.address===o.peer&&typeof hpSibContacts==='function'){ const c0=o.c; sibHistLater(async()=>{ if(!isContact(o.peer)){ const n0=await hpSibContacts([c0]); if(n0&&isContact(o.peer)) SIB_HIST_IN.add=(SIB_HIST_IN.add||0)+1; } sibHistIn(id,o); }); return; }
    if(SIB_HIST_PEND){ sibHistLater(()=>sibHistIn(id,o)); return; } sibHistIn(id,o); return; }
  if(o.t==='histdone'){ if(SIB_HIST_PEND){ sibHistLater(()=>sibHistDone(id,o)); return; } sibHistDone(id,o); return; }
  if(o.t==='blobreq'){ if(typeof o.id==='string'&&/^[0-9a-f]{32}$/.test(o.id)) sibServeBlob(o.id,id).catch(()=>{}); return; }
  if(o.t==='blobno'){ if(typeof sibBlobNo==='function') sibBlobNo(o.id,id); return; }
  if(o.t==='blob'){ const s=SIB[id]; const size=Number(o.size)||0, n=Number(o.n)||0; if(s&&s.dc&&typeof o.id==='string'&&/^[0-9a-f]{32}$/.test(o.id)&&size>0&&size<=FILE_MAX_BYTES&&n>0) rxStart(s.dc,{id:o.id,size:size,n:n,mime:(typeof o.mime==='string'&&o.mime)||'application/octet-stream'}); return; }
}
function sibMirror(peer,item){ if(!SIB_FLOW||SIB_APPLYING||!peer||!item||!Object.keys(SIB).length)return; const it=Object.assign({},item); if(it.d==='s'&&!it.dv) it.dv=sibDv(); delete it.dc; delete it.hf; delete it.wl; for(const id of Object.keys(SIB)){ sibSend(id,{t:'evt',peer,item:it}); } }
function sibMirrorTs(peer,ts,d){ try{ const m=histLoad(peer).find(x=>x.ts===ts&&x.d===(d||'s')); if(m) sibMirror(peer,m); }catch(e){} }
function sibDel(peer,ts,d){ if(!SIB_FLOW||SIB_APPLYING||!peer||!ts)return; for(const id of Object.keys(SIB)){ sibSend(id,{t:'del',peer,ts:ts,d:d||'p'}); } }
function sibSeen(peer){ if(!SIB_FLOW||!peer||!Object.keys(SIB).length)return; const now=Date.now(); if(now-(SIB_SEEN_AT[peer]||0)<SIB_SEEN_GAP)return; SIB_SEEN_AT[peer]=now; for(const id of Object.keys(SIB)){ sibSend(id,{t:'seen',peer,at:now}); } }
function sibKick(fresh){
  if(!SIB_ON) return;
  if(fresh){ for(const k of Object.keys(SIB_TRY)){ SIB_TRY[k].n=0; } }
  setTimeout(()=>{ try{ if(!sibCan()) return; for(const dev of sibTargets()){ const t=SIB_TRY[dev]; if(SIB[dev]||(t&&t.timer)) continue; if(!fresh&&Date.now()-(SIB_LAST[dev]||0)<SIB_GAP) continue; sibCall(dev).catch(()=>{}); } }catch(e){} },SIB_KICK_DELAY);
}
function sibTick(){
  if(!ID||!SIB_ON)return;
  for(const id of Object.keys(SIB)){ if(!sibIsMine(id)){ hpLog('機械の一覧から消えた機械との線を畳んだ（'+String(id).slice(0,10)+'\u2026）'); sibClose(id); } }
  if(!sibCan())return;
  for(const dev of sibTargets()){ if(!SIB[dev]&&!SIB_LAST[dev]) sibCall(dev).catch(()=>{}); }
}
function sibStart(){ if(SIB_ON&&SIB_TIMER)return; SIB_ON=true; if(SIB_TIMER)clearInterval(SIB_TIMER); SIB_TIMER=setInterval(()=>{ try{ sibTick(); }catch(e){} },30000); renderSiblings(); }
function sibStop(){ SIB_ON=false; if(SIB_TIMER){ clearInterval(SIB_TIMER); SIB_TIMER=null; } for(const k of Object.keys(SIB_TRY)){ const t=SIB_TRY[k]; if(t.timer)clearTimeout(t.timer); delete SIB_TRY[k]; } for(const id of Object.keys(SIB))sibClose(id); }
try{ window.addEventListener('pagehide',()=>{ try{ for(const id of Object.keys(SIB)) sibSend(id,{t:'bye'}); }catch(e){} }); }catch(e){}
