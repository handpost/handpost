const HP_MV_TTL=600e3;
const HP_MV_SKEW=600e3;
let HP_MV=null;
let HP_MV_IN=null;
let HP_MV_BUSY=false;
function hpMvMsg(id,dev,ts){ return 'handpost-main:v1:'+id+':'+dev+':'+ts; }
function hpMvCur(){ const s=ID&&(hpIsMain()?ID.mainSig:(hpIsChild()?ID.link.mainSig:null)); return (s&&Number(s.ts)>0)?Number(s.ts):0; }
async function hpMvSigOk(s){
  try{ return !!(s&&/^ed[0-9a-f]{64}$/.test(s.dev)&&Number.isFinite(s.ts)&&s.ts>0&&s.ts<=Date.now()+HP_MV_SKEW&&/^[0-9a-f]{128}$/.test(String(s.sig||''))&&(await edVerify(ID.publicKey,hpMvMsg(ID.address,s.dev,s.ts),s.sig))); }catch(e){ return false; }
}
function hpMvLabel(dev){ const r=(typeof hpDevRows==='function'?hpDevRows():[]).find(d=>d.dev===dev); return (r&&r.label)?hpDevName(r.label):(String(dev||'').slice(0,10)+'…'); }
function hpMvRm(k){ try{ if(typeof localStorage.removeItem==='function') localStorage.removeItem(k); else if(localStorage.getItem(k)!=null) localStorage.setItem(k,''); }catch(e){} }
function hpMvGo(id){ try{ document.getElementById('t-id').click(); const c=document.getElementById(id); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){} }

async function hpMvOffer(dev){
  if(!hpIsMain()||(typeof hpKillMe==='function'&&hpKillMe())) throw new Error(T('e_link_main'));
  if(!POST.up||POST.notOwner) throw new Error(T('e_link_post'));
  if(!hpPaperP()||!hpPaperFits()) throw new Error(T('mv_e_old'));
  const d=(Array.isArray(ID.devs)?ID.devs:[]).find(x=>x.dev===dev); if(!d) throw new Error(T('e_rm_nodev'));
  if(HP_MV_BUSY) throw new Error(T('e_rm_busy'));
  HP_MV_BUSY=true;
  try{
    const ts=Date.now(), sig=await edSign(hpMvMsg(ID.address,dev,ts));
    const body={ v:1, type:'mvoffer', ts:ts, sig:sig, paper:ID.paper, paperOk:Number(ID.paperOk)||0, invites:Array.isArray(ID.invites)?ID.invites:[], label:hpDevLabelGuess() };
    const n=await hpSibPut(body,[dev]);
    if(!n) throw new Error(T('mv_e_nopre'));
    HP_MV={ dev:dev, label:d.label||'', ts:ts, exp:ts+HP_MV_TTL };
    hpLog('メイン端末を移す申し出を送った（端末 '+dev.slice(0,10)+'…。10 分まで）');
    try{ renderDevices(); }catch(e){}
    setTimeout(()=>{ if(HP_MV&&HP_MV.ts===ts){ HP_MV=null; hpLog('メイン端末を移す申し出の期限が切れた'); try{ renderDevices(); }catch(e){} } }, HP_MV_TTL+1000);
    return true;
  } finally { HP_MV_BUSY=false; }
}

async function hpMvOfferIn(o,r){
  const drop=w=>{ hpLog('メイン端末を移す申し出を捨てた（'+w+'）'); return true; };
  if(!hpIsChild()) return drop('この端末はサブ端末でない');
  const L=ID.link; if(!L.main||r.fromDev!==L.main.dev) return drop('今のメイン端末からでない');
  const now=Date.now(), ts=Number(o.ts);
  if(!(ts>0)||now-ts>HP_MV_TTL||ts>now+HP_MV_SKEW) return drop('期限切れ');
  if(!(await hpMvSigOk({dev:L.dev,ts:ts,sig:o.sig}))) return drop('実印の署名が合わない');
  if(!/^[0-9a-f]{32}$/.test(String(o.paper||''))) return drop('形が違う');
  let pub=''; try{ pub=hpPaperMaster(hpBytes(o.paper)).pub; }catch(e){}
  if(pub!==ID.publicKey) return drop('紙がこのアカウントのものでない');
  HP_MV_IN={ ts:ts, sig:o.sig, paper:o.paper, paperOk:Number(o.paperOk)||0, invites:Array.isArray(o.invites)?o.invites:[], label:String(o.label||'').slice(0,32), exp:ts+HP_MV_TTL };
  hpLog('メイン端末（'+String(r.fromDev).slice(0,10)+'…）から、この端末をメイン端末にする申し出が届いた');
  try{ notifySound('req'); }catch(e){}
  hpNotice(T('nt_mv_offer'));
  try{ renderDevices(); }catch(e){}
  setTimeout(()=>{ if(HP_MV_IN&&HP_MV_IN.ts===ts){ HP_MV_IN=null; try{ renderDevices(); }catch(e){} } }, Math.max(0,HP_MV_IN.exp-now)+1000);
  return true;
}

async function hpMvRefuse(){
  const M=HP_MV_IN; HP_MV_IN=null; try{ renderDevices(); }catch(e){}
  if(!M||!hpIsChild()) return false;
  try{ await hpSibPut({ v:1, type:'mvno', ts:M.ts },[ID.link.main.dev]); }catch(e){}
  hpLog('メイン端末を移す申し出を断った'); return true;
}

function hpMvNoIn(o,r){
  if(!HP_MV||r.fromDev!==HP_MV.dev||Number(o.ts)!==HP_MV.ts){ hpLog('待っていない「断る」（捨てた）'); return true; }
  const lb=HP_MV.label?hpDevName(HP_MV.label):(HP_MV.dev.slice(0,10)+'…'); HP_MV=null;
  hpLog('メイン端末を移す申し出が断られた'); hpNotice(TF('nt_mv_refused',{label:lb})); try{ renderDevices(); }catch(e){}
  return true;
}

async function hpMvTake(src){
  if(!hpIsChild()) throw new Error(T('mv_e_state'));
  if(!hpVaultOn()) throw new Error(T('mv_e_vault'));
  if(!POST.up||POST.notOwner) throw new Error(T('e_link_post'));
  if(HP_MV_BUSY) throw new Error(T('e_rm_busy'));
  const p=hpBytes(String(src.paper||'')); let mk=null; try{ mk=hpPaperMaster(p); }catch(e){}
  if(!mk||p.length!==16||mk.pub!==ID.publicKey) throw new Error(T('mv_e_paper'));
  HP_MV_BUSY=true;
  const keep=ID, keepPriv=EDPRIV;
  try{
    const L=ID.link, priv=await crypto.subtle.importKey('pkcs8',pemToBytes(mk.pem),{name:'Ed25519'},false,['sign']);
    EDPRIV=priv;
    let ts=Number(src.ts), sig=src.sig;
    if(!(await hpMvSigOk({dev:L.dev,ts:ts,sig:sig}))){ ts=Date.now(); sig=await edSign(hpMvMsg(ID.address,L.dev,ts)); }
    if(ts<=hpMvCur()){ ts=hpMvCur()+1; sig=await edSign(hpMvMsg(ID.address,L.dev,ts)); }
    const devs=[];
    for(const d of [L.main].concat(Array.isArray(L.sibs)?L.sibs:[])){
      if(!d||!d.dev||d.dev===L.dev||devs.some(x=>x.dev===d.dev)||(L.gone||[]).some(g=>g.dev===d.dev)) continue;
      if(!(await hp5IdOk(ID.address,ID.publicKey,d.dev,d.devSig))) continue;
      devs.push({ dev:d.dev, devSig:d.devSig, label:d.label||'', at:(d.dev===L.main.dev)?Date.now():(Number(d.at)||0), pre:d.pre||null, seen:Number(d.seen)||0 });
    }
    const nid=Object.assign({},ID); delete nid.link;
    nid.privateKeyPem=mk.pem; nid.paper=hpHex(p); nid.paperOk=Number(src.paperOk)||Date.now();
    nid.devs=devs; nid.gone=(Array.isArray(L.gone)?L.gone:[]).map(g=>({dev:g.dev,ts:g.ts,sig:g.sig,label:'',at:0})); nid.devsDue=0;
    nid.mainSig={ dev:L.dev, ts:ts, sig:sig };
    if(Array.isArray(src.invites)&&src.invites.length) nid.invites=src.invites;
    ID=nid; HP_MV_IN=null; HP_MV=null;
    saveID();
    try{ hpPaperWrapAdd(); }catch(e){}
    hpMvRm('p2p_bkh');
    try{ HP_BK_SEEN=false; HP_BK_STOP=false; HP_BK_REDO=false; }catch(e){}
    hpLog('この端末がメイン端末になった（'+(src.sig?'前のメイン端末から':'紙から')+'。ほかの端末 '+devs.length+' 台）');
  }catch(e){ ID=keep; EDPRIV=keepPriv; HP_MV_BUSY=false; hpLog('メイン端末になれない '+e.message); throw e; }
  HP_MV_BUSY=false;
  hpMvRedraw();
  hpNotice(T('nt_mv_done'));

  try{ const n=await hpDevListSend(); hpLog('メイン端末が替わったことを自分の端末 '+n+' 台へ知らせた'); }catch(e){ hpLog('メイン端末が替わったことを知らせられない '+e.message); }
  try{ await hpMvBkAdopt(); }catch(e){}
  return true;
}

async function hpMvBkAdopt(){
  if(typeof hpBkAble!=='function'||!hpBkAble()) return false;
  let r=null; try{ r=await hpBkFetch(); }catch(e){ hpLog('引き出しを読めない '+e.message); return false; }
  let env=null; try{ env=r&&r.data?JSON.parse(r.data):null; }catch(e){ env=null; }
  localStorage.setItem(HP_BK_SEQ_K,String(env?(Number(env.seq)||0):0));
  HP_BK_SEEN=true; HP_BK_STOP=false; HP_BK_REDO=false;
  await hpBkSend(true); return true;
}

async function hpMvTakePaper(text){
  if(!hpIsChild()) throw new Error(T('mv_e_state'));
  if(!hpVaultOn()) throw new Error(T('mv_e_vault'));
  const p=hpPaperParse(text);
  return await hpMvTake({ paper:hpHex(p) });
}

async function hpMvSeen(o,r){
  const s=o&&o.main; if(!s||s.dev!==r.fromDev) return false;
  if(!(await hpMvSigOk(s))){ hpLog('メイン端末の署名が合わない一覧（捨てた）'); return false; }
  if(s.ts<=hpMvCur()) return hpIsChild()&&ID.link.main&&ID.link.main.dev===s.dev;
  const row=(Array.isArray(o.devs)?o.devs:[]).find(d=>d&&d.dev===s.dev);
  if(!row||!(await hp5IdOk(ID.address,ID.publicKey,row.dev,row.devSig))){ hpLog('新しいメイン端末の署名が一覧に無い（捨てた）'); return false; }
  const pre=hpPreValid(row.pre,row.dev)?{dev:row.dev,x25519:row.pre.x25519,notAfter:row.pre.notAfter,sig:row.pre.sig}:null;
  const main={ dev:row.dev, devSig:row.devSig, label:String(row.label||'').slice(0,32), pre:pre, seen:Math.min(Number(row.seen)||0,Date.now()) };
  const lb=main.label?hpDevName(main.label):(main.dev.slice(0,10)+'…');
  if(hpIsMain()){ const asked=!!(HP_MV&&HP_MV.dev===main.dev);   await hpMvDemote(main,s); hpNotice(TF('nt_mv_demoted',{label:lb})); try{ if(!asked) hpNote('mvdemote',{label:lb},'mv:'+s.dev+':'+s.ts); }catch(e){} return true; }
  if(!hpIsChild()) return false;
  const L=ID.link, was=L.main;
  if(was&&was.dev&&was.dev!==main.dev&&was.dev!==L.dev){
    L.sibs=(Array.isArray(L.sibs)?L.sibs:[]).filter(d=>d.dev!==main.dev);
  }
  L.main=main; L.mainSig={dev:s.dev,ts:s.ts,sig:s.sig}; L.devsAt=0; HP_MV_IN=null; saveID();

  const chg=!!(was&&was.dev&&was.dev!==main.dev);
  hpLog(chg?('メイン端末が替わった（端末 '+main.dev.slice(0,10)+'…。実印の署名を確かめた）'):('メイン端末の署名を受け取った（端末 '+main.dev.slice(0,10)+'…。替わっていない）'));
  if(chg&&main.dev!==L.dev){ hpNotice(TF('nt_mv_changed',{label:lb})); try{ hpNote('mvchg',{label:lb},'mv:'+s.dev+':'+s.ts); }catch(e){} }
  if(chg&&main.dev!==L.dev){ setTimeout(()=>{ try{ if(typeof hpSibMe==='function') hpSibMe(main.dev).catch(()=>{}); }catch(e){} try{ HP_SYNC_CHAIN=HP_SYNC_CHAIN.then(()=>hpSibSyncSend(true)).catch(()=>{}); }catch(e){} try{ if(typeof hpHistPullAuto==='function') hpHistPullAuto('メイン端末が替わった').catch(()=>{}); }catch(e){}   },1500); }
  return true;
}

async function hpMvDemote(main,s){
  const me=await hp5Me();
  const link={ dev:me.dev, devSig:me.devSig, at:Date.now(), label:hpDevLabelGuess(), main:main, sibs:[], gone:hpMyGone().map(g=>({dev:g.dev,ts:g.ts,sig:g.sig})), devsAt:0, mainSig:{dev:s.dev,ts:s.ts,sig:s.sig} };
  const nid=Object.assign({},ID);
  for(const k of ['privateKeyPem','paper','paperOk','paperReq','devs','gone','devsDue','mainSig','invites']) delete nid[k];
  nid.link=link; ID=nid; EDPRIV=null; HP_MV=null; HP_MV_IN=null;
  try{ HP_LINK=null; }catch(e){}
  saveID();
  try{ const m=hpVaultMeta(); if(m){ const n=m.wraps.length; m.wraps=m.wraps.filter(w=>w.k!=='paper'); if(m.wraps.length!==n){ m.at=Date.now(); localStorage.setItem(HP_VAULT_KEY,JSON.stringify(m)); hpLog('封から紙の包みを外した'); } } }catch(e){}
  hpMvRm('p2p_bkseq'); hpMvRm('p2p_bkh');
  try{ HP_BK_SEEN=false; HP_BK_STOP=false; HP_BK_REDO=false; }catch(e){}
  hpLog('メイン端末が替わったので、この端末はサブ端末になった（実印と紙をこの端末から消した）');
  hpMvRedraw();
  return true;
}
function hpMvRedraw(){
  try{ renderDevMode(); }catch(e){} try{ renderDevices(); }catch(e){} try{ renderMyName(); }catch(e){}
  try{ if(typeof hpPaperUi==='function') hpPaperUi(); }catch(e){} try{ if(typeof hpVaultUi==='function') hpVaultUi(); }catch(e){}
  try{ if(typeof hpKillUi==='function') hpKillUi(); }catch(e){} try{ if(typeof hpSafetyNag==='function') hpSafetyNag(); }catch(e){}
}

function hpMvBox(card){
  if(typeof document==='undefined'||!card) return;
  let box=document.getElementById('mv-box');
  if(!box){ box=document.createElement('div'); box.id='mv-box'; box.style.cssText='margin-top:10px'; const lst=document.getElementById('dev-list'); if(lst&&lst.parentNode===card) card.insertBefore(box,lst.nextSibling); else card.appendChild(box); }
  box.innerHTML='';
  const el=(tag,cls,txt,id)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; if(id) e.id=id; return e; };
  const dead=(typeof hpKillMe==='function'&&hpKillMe());
  if(!ID||dead) return;
  if(hpIsMain()&&HP_MV&&HP_MV.exp>Date.now()){
    const t=el('div','note',TF('mv_wait',{label:HP_MV.label?hpDevName(HP_MV.label):(HP_MV.dev.slice(0,10)+'…'),t:fmtTS(HP_MV.exp)}),'mv-wait'); t.style.color='var(--teal)'; box.appendChild(t); return;
  }
  if(hpIsChild()&&ID.link.ppreq&&typeof hpPpCancelSub==='function'){
    const q=ID.link.ppreq, t=el('div','note',TF('pp_sub_req',{t:fmtTS(q.until)}),'pp-sub'); t.style.color='var(--amber)'; box.appendChild(t);
    const cb=el('button','b warn',T('btn_pp_cancelreq'),'btn-pp-cancel-sub'); cb.onclick=()=>{ hpPpCancelSub(); }; box.appendChild(cb);
  }
  if(!hpIsChild()) return;
  const M=(HP_MV_IN&&HP_MV_IN.exp>Date.now())?HP_MV_IN:null;
  if(M){
    const t=el('div','note',TF('mv_in_body',{label:M.label?hpDevName(M.label):'—',t:fmtTS(M.exp)}),'mv-in'); t.style.cssText='white-space:pre-line;color:var(--teal)'; box.appendChild(t);
    const er=el('div','note',null,'mv-err'); er.style.color='var(--amber)'; box.appendChild(er);
    const row=el('div','row'); row.style.marginTop='6px';
    const ok=el('button','b pri',T('btn_mv_take'),'btn-mv-take'), no=el('button','b',T('btn_mv_no'),'btn-mv-no');
    ok.onclick=async()=>{ if(ok.disabled) return; er.textContent='';
      if(!hpVaultOn()){ hpNotice(T('mv_e_vault')); hpMvGo('vault-card'); const x=document.getElementById('mv-err'); if(x) x.textContent=T('mv_e_vault'); return; }
      ok.disabled=true; let v=false; try{ v=await hpAsk({text:T('cf_mv_take'),auth:true,ok:T('btn_mv_take'),why:'メイン端末を引き受ける'}); }finally{ ok.disabled=false; }
      if(!v) return; ok.disabled=true;
      hpMvTake(HP_MV_IN||{}).catch(e=>{ ok.disabled=false; const x=document.getElementById('mv-err'); if(x) x.textContent=(typeof hpErrShow==='function'?hpErrShow(e):e.message); }); };
    no.onclick=()=>{ hpMvRefuse(); };
    row.appendChild(ok); row.appendChild(no); box.appendChild(row);
    return;
  }
  const b=el('button','b',T('btn_mv_paper'),'btn-mv-paper'); b.onclick=()=>hpMvPaperFlow(); box.appendChild(b);
}

function hpMvPaperFlow(){
  const old=document.getElementById('mv-paper'); if(old) old.remove();
  const el=(tag,cls,txt,id)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; if(id) e.id=id; return e; };
  const box=el('div',null,null,'mv-paper'); box.style.cssText='position:fixed;inset:0;z-index:9998;background:var(--bg,#0b1220);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';
  const card=el('div','card'); card.style.cssText='max-width:480px;width:100%'; box.appendChild(card);
  card.appendChild(el('h2',null,T('mvp_title')));
  const b1=el('div','note',T('mvp_body')); b1.style.whiteSpace='pre-line'; card.appendChild(b1);
  const er=el('div','note',null,'mvp-err'); er.style.color='var(--amber)';
  if(!hpVaultOn()){
    er.textContent=T('mv_e_vault'); card.appendChild(er);
    const row=el('div','row'); row.style.marginTop='12px';
    const go=el('button','b pri',T('btn_mvp_vault'),'mvp-vault'); go.onclick=()=>{ box.remove(); hpMvGo('vault-card'); };
    const cx=el('button','b',T('btn_mvp_cancel'),'mvp-cancel'); cx.onclick=()=>box.remove();
    row.appendChild(go); row.appendChild(cx); card.appendChild(row); document.body.appendChild(box); return;
  }
  const pc=hpPaperInputs('mv-in'); card.appendChild(pc.el); card.appendChild(er);
  const row=el('div','row'); row.style.marginTop='12px';
  const go=el('button','b pri',T('btn_mvp_go'),'mvp-go'), cx=el('button','b',T('btn_mvp_cancel'),'mvp-cancel');
  go.onclick=async()=>{ if(go.disabled) return; er.textContent='';
    const k=pc.empty(); if(k){ er.textContent=TF('pp_e_empty',{n:k}); pc.focus(k-1); return; }
    go.disabled=true;
    try{ await hpMvTakePaper(pc.value()); box.remove(); }
    catch(e){ go.disabled=false; er.textContent=(e&&e.hpvMsg)||(typeof hpErrShow==='function'?hpErrShow(e):((e&&e.message)||'')); } };
  cx.onclick=()=>box.remove();
  row.appendChild(go); row.appendChild(cx); card.appendChild(row);
  document.body.appendChild(box); setTimeout(()=>pc.focus(0),50);
}
