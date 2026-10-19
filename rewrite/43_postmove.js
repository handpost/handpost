let HP_SWAP=false, HP_SW_AT=0, HP_SW_MIN=120000;
function hpSwDown(){ try{ if(typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner){ HP_SW_AT=0; return 0; } if(!HP_SW_AT) HP_SW_AT=Date.now(); return Date.now()-HP_SW_AT; }catch(e){ return 0; } }
try{ if(typeof document!=='undefined'&&typeof setInterval==='function'&&typeof window!=='undefined') setInterval(()=>{ try{ hpSwDown(); }catch(e){} },15000); }catch(e){}
let HP_MOVE=false;
let HP_MV2_BUSY=false;
const HP_GONE_EVERY=6*3600e3;
function hpPmMsg(id,url,ts){ return 'handpost-post:v1:'+id+':'+url+':'+ts; }
function hpPmUrlOk(u){ return typeof u==='string'&&u.length<=120&&/^wss:\/\/[a-z0-9.-]+:[0-9]{2,5}$/.test(u); }
function hpMvSubs(){ try{ return (typeof hpSibs==='function')?hpSibs().length:0; }catch(e){ return 0; } }
function hpMvOldName(){ try{ const L=ID&&ID.lease; if(L&&L.host&&typeof hpHostName==='function') return hpHostName(L.host); }catch(e){} return String((typeof POST!=='undefined'&&POST&&POST.url)||'').replace(/^wss:\/\//,''); }
function hpMoveOpen(){
  const Tt=k=>T(k);
  if(typeof ID==='undefined'||!ID){ hpTell(Tt('pt_noid')); return false; }
  if(!hpIsMain()){ hpTell(Tt('mv2_nomain')); return false; }
  if(ID.rentJob){ hpTell(Tt('rn_job_left')); return false; }
  if(!hpRentOwned()){
    if(!(typeof hpRentAlive==='function'&&hpRentAlive())){ hpTell(Tt('mv2_noown')); return false; }
    const d=hpSwDown(); if(d<HP_SW_MIN){ hpTell(TF('sw_wait',{s:Math.max(1,Math.ceil((HP_SW_MIN-d)/1000))})); return false; }
    hpAsk({title:Tt('sw_title'),text:Tt('sw_ask'),ok:Tt('sw_go'),danger:true,why:'郵便受けの借り換え'}).then(v=>{ if(!v||hpRentOwned()) return; HP_SWAP=true; HP_MOVE=true; hpLog('郵便受けの借り換えを始めた（いまの郵便受けにつながらない）'); try{ hpHsOpen(); }catch(e){} try{ if(typeof HP_HS_PICK!=='undefined'&&HP_HS_PICK) hpHsPick(HP_HS_PICK); }catch(e){} try{ hpMoveUi(); }catch(e){} hpTell(Tt('mv2_pick')); }); return false; }
  HP_SWAP=false; HP_MOVE=true; try{ hpHsOpen(); }catch(e){} try{ if(typeof HP_HS_PICK!=='undefined'&&HP_HS_PICK) hpHsPick(HP_HS_PICK); }catch(e){}
  hpTell(Tt('mv2_pick')); return true; }
async function hpMoveBefore(J,url){
  const out={n:0,why:''};
  try{
    if(!hpIsMain()) throw new Error(T('mv2_nomain'));
    if(!hpPmUrlOk(url)) throw new Error('場所の形が違う '+url);
    const ts=Date.now(), sig=await edSign(hpPmMsg(ID.address,url,ts));
    ID.postSig={url:url,ts:ts,sig:sig}; saveID();
    if(!hpMvSubs()) return out;
    if(!POST.up||POST.notOwner||POST.url!==(J&&J.move&&J.move.from)) throw new Error(T('mv2_noold'));
    out.n=await hpSibPut({v:1,type:'sibmv',url:url,ts:ts,sig:sig});
    if(out.n<hpMvSubs()) out.why=TF('mv2_part',{n:out.n,m:hpMvSubs()});
    hpLog('転居届をサブ端末 '+out.n+' 台へ出した（前の郵便受け経由。新しい場所 '+url+'）');
  }catch(e){ out.why=String((e&&e.message)||e); hpLog('転居届をサブ端末へ出せない '+out.why); }
  return out; }
function hpMoveAfter(J,url,mv){
  const M=J.move||{}, old=Object.assign({},M.lease||{});
  ID.leaseOld=Object.assign(old,{url:String(M.from||''),moved:Date.now(),last:Date.now()});
  ID.moveJob={from:String(M.from||''),to:url,at:Date.now(),subs:(mv&&mv.n)||0};
  let n=0; try{ n=hpCardDueMark(1); }catch(e){}
  HP_MOVE=false; HP_SWAP=false;   saveID();
  hpLog('郵便受けを引っ越した（'+M.from+' → '+url+'）。住所録の相手 '+n+' 人に新しい名刺を届ける');
  return n; }
async function hpPmReq(msg){
  for(let i=0;i<80;i++){
    if(typeof HP_BK==='undefined'||!HP_BK){ try{ return await hpBkReq(msg); }catch(e){ if(!/重なった/.test(String(e&&e.message))) throw e; } }
    await sleep(250); }
  throw new Error('引き出しの操作が空かない'); }
async function hpMoveKick(){
  if(HP_MV2_BUSY||typeof ID==='undefined'||!ID||!hpIsMain()||!POST.up||POST.notOwner) return 0;
  HP_MV2_BUSY=true; let n=0;
  try{
    const M=ID.moveJob;
    if(M&&M.to===POST.url){ HP_MV2_TRIED=String(POST.gen)+'|'+POST.url;
      if(!M.devs){ const added=Array.isArray(M.added)?M.added:[];
        for(const d of hpSibs()){ if(!d.devSig||added.includes(d.dev)) continue;
          try{ await hpPmReq({op:'adddev',dev:d.dev,devSig:d.devSig}); n++; }catch(e){ const w=String((e&&e.message)||e); if(w!=='removed'&&w!=='too many devices') throw e; hpLog('サブ端末を新しい郵便受けに足せない（'+w+'）'); }
          added.push(d.dev); M.added=added; saveID(); }
        M.devs=1; saveID(); }
      if(!M.rv){ const o=hpTkLoad(), list=[]; for(const a of Object.keys(o)){ if(!hpBlocked(a)) continue; for(const id of Object.keys(o[a]||{})) list.push({id:id,exp:Number(o[a][id])}); }
        if(list.length) hpRvQueue(list); M.rv=1; M.rvN=list.length; saveID(); }
      hpLog('新しい郵便受けに入れ直した（サブ端末 '+n+' 台を足し、ブロックした相手の許可証 '+(M.rvN||0)+' 枚を取り消し直した）');
      delete ID.moveJob; ID.moveDone={at:Date.now(),to:M.to}; saveID();
    }
  }catch(e){ hpLog('引っ越しの残りを進められない（つなぎ直したらもう一度）'+((e&&e.message)?' '+e.message:'')); }
  finally{ HP_MV2_BUSY=false; }
  try{ await hpGoneSweep(); }catch(e){}
  return n; }
async function hpGoneSweep(force){
  if(typeof ID==='undefined'||!ID||!hpIsMain()||!POST.up||POST.notOwner) return 0;
  const gone=hpMyGone(); if(!gone.length) return 0;
  if(!force&&Date.now()-(Number(ID.goneChk)||0)<HP_GONE_EVERY) return 0;
  let r=null; try{ r=await hpPmReq({op:'dget'}); }catch(e){ hpLog('外した端末を確かめられない（'+((e&&e.message)||e)+'）'); return 0; }
  ID.goneChk=Date.now(); saveID();
  const set=new Set(gone.map(g=>g.dev)); let n=0;
  for(const d of (Array.isArray(r&&r.devs)?r.devs:[])){
    if(!d||!set.has(d.dev)) continue;
    try{ const ts=Date.now(), sig=await edSign(hp5RmMsg(ID.address,d.dev,ts)); await hpPmReq({op:'rmdev',dev:d.dev,ts:ts,sig:sig}); n++; hpLog('外した端末（'+String(d.dev).slice(0,10)+'…）が郵便受けに入っていたので外し直した'); }
    catch(e){ hpLog('外した端末を外し直せない（'+((e&&e.message)||e)+'）'); }
  }
  return n; }

function hpObMoveOpen(){ const Tt=k=>T(k); if(ID.rentJob){ hpTell(Tt('rn_job_left')); return false; }
  HP_OB_RE='move'; try{ hpLog('この端末専用の郵便受けを移す（ホストを選ぶ）'); }catch(e){} try{ hpHsOpen(); }catch(e){} try{ if(typeof HP_HS_PICK!=='undefined'&&HP_HS_PICK) hpHsPick(HP_HS_PICK); }catch(e){}
  hpTell(Tt('mv2_pick')); return true; }
hpMoveOpen=(function(f){ return function(){ try{ if(typeof hpObOwn==='function'&&hpObOwn()) return hpObMoveOpen(); }catch(e){} return f.apply(this,arguments); }; })(hpMoveOpen);

async function hpMoveIn(o,r){
  if(!hpIsChild()){ hpLog('転居届が届いたが、この端末はサブ端末でない（捨てた）'); return false; }
  const ts=Number(o&&o.ts), url=String((o&&o.url)||'');
  if(!hpPmUrlOk(url)||!(ts>0)||ts>Date.now()+600e3||!/^[0-9a-f]{128}$/.test(String((o&&o.sig)||''))){ hpLog('転居届の形が違う（捨てた）'); return false; }
  if(ts<=(Number(ID.link.postTs)||0)){ hpLog('古い転居届（捨てた）'); return false; }
  let ok=false; try{ ok=await edVerify(ID.publicKey,hpPmMsg(ID.address,url,ts),o.sig); }catch(e){}
  if(!ok){ hpLog('転居届の実印の署名を確かめられない（捨てた）'); return false; }
  const old=hpPostUrl(); ID.link.postTs=ts;
  if(typeof hpBoxSub==='function'&&hpBoxSub()){
    const m=ID.link.main&&ID.link.main.dev, b0=m?hpMcBoxRec(m):null;
    if(m&&(!b0||b0.at<ts)){ if(!ID.box6||typeof ID.box6!=='object'||Array.isArray(ID.box6)) ID.box6={}; ID.box6[m]={ url:url, at:ts }; }
    saveID(); hpLog('転居届を受け取った。この端末は自分の郵便受け（'+old+'）のまま。メイン端末の郵便受けの場所の控えを '+url+' にした'); return true; }
  if(url===old){ saveID(); hpLog('転居届の場所は今の郵便受けと同じ'); return true; }
  ID.link.postOld={url:old,at:Date.now(),last:Date.now()}; saveID();
  try{ localStorage.setItem('p2p_post',url); }catch(e){}
  hpLog('転居届を受け取った。郵便受けを '+old+' から '+url+' に替えて、つなぎ直す');
  try{ if(typeof hpToast==='function') hpToast(T('mv2_in')); }catch(e){}
  setTimeout(()=>{ try{ stopBg(); }catch(e){} setTimeout(()=>{ try{ startBg(); }catch(e){} },1500); },4000);
  return true; }

const HP_OLD_EVERY=15*60e3, HP_OLD_KEEP=35*864e5, HP_OLD_FAILS=3, HP_OLD_WAIT=45000, HP_OLD_IDLE=12;
let HP_OLD_BUSY=false, HP_OLD_T=null;
function hpOldGet(){
  try{ if(typeof ID==='undefined'||!ID) return null;
    const rec=hpIsMain()?ID.leaseOld:(hpIsChild()?ID.link.postOld:null); if(!rec||!hpPmUrlOk(rec.url)||rec.end) return null;
    if(rec.url===hpPostUrl()) return null;
    const exp=Number(rec.exp)||0, from=Number(rec.moved||rec.at)||0, until=exp>0?exp+3600e3:(from?from+HP_OLD_KEEP:0);
    return {url:rec.url,until:until,rec:rec}; }catch(e){ return null; } }
function hpOldEnd(rec,why){ rec.end=Date.now(); rec.endWhy=why; try{ saveID(); }catch(e){} hpLog('前の郵便受けの見回りをやめた（'+why+'）'); try{ hpOldUi(); }catch(e){} }
async function hpOldVisit(why){
  const O=hpOldGet(); if(!O||HP_OLD_BUSY) return 0;
  const rec=O.rec;
  if(O.until&&Date.now()>O.until){ hpOldEnd(rec,'期限'); return 0; }
  HP_OLD_BUSY=true; let c=null, n=0;
  try{
    const kp=await hpDevKey(), out=[]; c=await HotPocket.createClient([O.url], kp);
    c.on(HotPocket.events.contractOutput, r=>{ for(const x of r.outputs){ try{ out.push(JSON.parse(hpText(x))); }catch(e){} } });
    let up=false; try{ up=await hpWithin(c.connect(),20000,'前の郵便受けへのつなぎ'); }catch(e){ up=false; }
    if(!up) throw new Error('つながらない');
    const send=o=>hpWithin(c.submitContractInput(JSON.stringify(o)),HP_SEND_WAIT,'前の郵便受けへの送り');
    await send(await hpClaimMsg()); await send({op:'sync',got:[]});
    const t0=Date.now(); let idle=0;
    while(Date.now()-t0<HP_OLD_WAIT){
      if(!out.length){ if(++idle>=HP_OLD_IDLE) break; await sleep(250); continue; } idle=0;
      const o=out.shift();
      if(o&&o.err){ if(o.err==='removed'||o.err==='killed'||o.err==='not owner'){ hpOldEnd(rec,o.err); break; } continue; }
      if(o&&Array.isArray(o.push)){
        const ids=[];
        for(const m of o.push){ ids.push(m.id); if(hpSeen(m.id,m.exp)) continue; n++;
          try{ await hpDeliver(m); }catch(e){ hpLog('前の郵便受けの手紙を開けられない '+m.id+' '+((e&&e.message)||e)); if(e&&e.hpOpen&&typeof hpOpenFail==='function') hpOpenFail(e); } }
        try{ hpSeenSave(); }catch(e){}
        if(ids.length) await send({op:'sync',got:ids});
        if(!ids.length&&!(o.left>0)) break;
      }
    }
    rec.seen=Date.now(); rec.got=(Number(rec.got)||0)+n; rec.fail=0; rec.fail0=0;
    hpLog('前の郵便受け（'+O.url+'）を見た：'+n+' 通（'+(why||'見回り')+'）');
    if(!rec.lsOff&&(hpIsMain()||rec.own)){   try{ await send({op:'lease',exp:0}); rec.lsOff=1; hpLog('前の郵便受けに預けた期限を消した（期限の通知を出させない）'); }catch(e){} }
    try{ if(hpIsMain()) await hpMoveResend(O); }catch(e){ hpLog('転居届を出し直せない（'+((e&&e.message)||e)+'）'); }
  }catch(e){
    rec.fail=(Number(rec.fail)||0)+1; if(!rec.fail0) rec.fail0=Date.now();
    hpLog('前の郵便受けを見られない（'+((e&&e.message)||e)+'。続けて '+rec.fail+' 回）');
    if(rec.fail>=HP_OLD_FAILS&&Date.now()-rec.fail0>=864e5) hpOldEnd(rec,'つながらない');
  }finally{ HP_OLD_BUSY=false; rec.last=Date.now(); try{ saveID(); }catch(e){} if(c){ try{ await c.close(); }catch(e){} } try{ hpOldUi(); }catch(e){} }
  return n; }
function hpOldTick(){ try{ const O=hpOldGet(); if(!O||HP_OLD_BUSY) return '';
  if(typeof BG_ON!=='undefined'&&!BG_ON) return 'off';
  if(typeof HP_IOS!=='undefined'&&HP_IOS&&typeof hpHidden==='function'&&hpHidden()) return 'hidden';
  if(typeof navigator!=='undefined'&&navigator&&navigator.onLine===false) return 'offline';
  if(Date.now()-(Number(O.rec.last)||0)<HP_OLD_EVERY) return 'wait';
  hpOldVisit('見回り').catch(()=>{}); return 'go'; }catch(e){ return ''; } }
function hpOldUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return '';
  const card=document.getElementById('post-move'); if(!card) return '';
  let el=document.getElementById('pt-old'); const O=hpOldGet();
  if(!O){ if(el) el.style.display='none'; return ''; }
  if(!el){ el=document.createElement('div'); el.id='pt-old'; el.className='note'; card.appendChild(el); }
  const fm=t=>(typeof fmtTS==='function')?fmtTS(t):new Date(t).toLocaleString();
  el.style.display=''; el.style.whiteSpace='pre-line';
  el.textContent=TF('mv2_old',{u:O.url.replace(/^wss:\/\//,''),t:O.until?fm(O.until):'—',s:O.rec.seen?fm(O.rec.seen):T('mv2_old_none'),n:Number(O.rec.got)||0})+(O.rec.fail?'\n'+TF('mv2_old_fail',{n:O.rec.fail}):'')+((Number(O.rec.left)>0&&!O.rec.subsIn)?'\n'+TF('mv2_old_resend',{n:Number(O.rec.left),k:Number(O.rec.resent)||0}):'');
  return 'old'; }catch(e){ return ''; } }

let HP_MV2_TRIED=null; const HP_MV2_FIRST=60e3, HP_MV2_HOLD=30e3;
function hpMoveHold(){ try{ if(typeof ID==='undefined'||!ID||!hpIsMain()||typeof POST==='undefined'||!POST||!POST.up) return false;
  const M=ID.moveJob; if(!M||M.to!==POST.url||M.devs) return false;
  return HP_MV2_BUSY||HP_MV2_TRIED!==String(POST.gen)+'|'+POST.url; }catch(e){ return false; } }
async function hpMoveHoldWait(){ const t0=Date.now(); let w=false; while(hpMoveHold()&&Date.now()-t0<HP_MV2_HOLD){ w=true; await sleep(250); } return w; }
async function hpMoveFirst(){ if(!hpMoveHold()) return false;
  try{ await hpWithin(hpMoveKick(),HP_MV2_FIRST,'引っ越しの入れ直し'); }catch(e){ hpLog('引っ越しの入れ直しを待ちきれない（ほかの送りを先に進める）'+((e&&e.message)?' '+e.message:'')); }
  return true; }
async function hpMoveResend(O){
  if(typeof ID==='undefined'||!ID||!hpIsMain()||!O||!O.rec) return 0;
  const s=ID.postSig, rec=O.rec; if(!s||!hpPmUrlOk(s.url)||!(Number(s.ts)>0)||typeof s.sig!=='string') return 0;
  if(rec.subsIn||s.url!==hpPostUrl()||O.url===s.url) return 0;
  if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0;
  const subs=hpSibs().filter(d=>d&&d.dev&&d.devSig).filter(d=>{ try{ const b=(typeof hpMcBoxRec==='function')?hpMcBoxRec(d.dev):null; return !(b&&b.url&&b.url!==s.url); }catch(e){ return true; } });   if(!subs.length){ rec.subsIn=Date.now(); rec.left=0; saveID(); return 0; }
  let r=null; try{ r=await hpPmReq({op:'dget'}); }catch(e){ hpLog('新しい郵便受けの名簿を読めない（'+((e&&e.message)||e)+'）'); return 0; }
  const here={}; for(const x of ((r&&Array.isArray(r.devs))?r.devs:[])){ if(x&&x.dev&&x.pre) here[x.dev]=1; }
  const left=subs.filter(d=>!here[d.dev]); rec.left=left.length;
  if(!left.length){ rec.subsIn=Date.now(); saveID(); hpLog('サブ端末はみな新しい郵便受けに来た（転居届の出し直しはやめる）'); return 0; }
  const me=await hp5Me(), now=Date.now(), devices=[], devSigs={}, prekeys=[];
  for(const d of left){ if(!hpPreValid(d.pre,d.dev,now)||!(await hp5IdOk(me.id,me.master,d.dev,d.devSig))) continue;
    devices.push(d.dev); devSigs[d.dev]=d.devSig; prekeys.push({dev:d.dev,x25519:d.pre.x25519,notAfter:d.pre.notAfter,sig:d.pre.sig}); }
  if(!devices.length){ saveID(); return 0; }
  const card={v:3,id:me.id,master:me.master,post:[O.url],devices:devices,devSigs:devSigs,token:JSON.parse(hpIssue(3600e3)),prekeys:prekeys};
  await hpPut(card,JSON.stringify({v:1,type:'sibmv',url:s.url,ts:s.ts,sig:s.sig}),'msg');
  rec.resent=(Number(rec.resent)||0)+1; rec.resentAt=Date.now(); saveID();
  hpLog('転居届を前の郵便受け経由でもう一度出した（まだ新しい郵便受けに来ていないサブ端末 '+devices.length+' 台。'+rec.resent+' 回目）');
  return devices.length; }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ HP_OLD_T=setInterval(hpOldTick,60e3); setTimeout(hpOldTick,20e3); } }catch(e){}
