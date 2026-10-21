let HP_KILL_STEPS=[30e3,120e3,600e3,1800e3], HP_KILL_WAIT=15000;
const HP_KILL_GIVEUP=7*86400e3, HP_DEAD_MAX=300;
let HP_KILL_BUSY=false, HP_KILL_T=null, HP_KILL_N=0;
function hpKillMsg(id,ts){ return 'handpost-kill:v1:'+id+':'+ts; }
function hpKillMe(){ return !!(ID&&ID.killed&&typeof ID.killed==='object'); }
function hpDeadPeer(addr){ return !!(addr&&ID&&ID.dead&&typeof ID.dead==='object'&&ID.dead[addr]); }
function hpDead(addr){ return hpKillMe()||hpDeadPeer(addr); }
function hpKillWordOk(s){ const v=String(s||'').trim().toLowerCase(); return v==='無効'||v==='disable'||(typeof hpWordIs==='function'&&hpWordIs(v,'wd_kill')); }

async function hpKillOk(c){
  try{
    if(!c||typeof c!=='object'||!hpIdFmt(c.id)||typeof c.master!=='string'||!/^[0-9a-f]{64}$/.test(c.master)||!Number.isFinite(c.ts)||c.ts<=0||typeof c.sig!=='string'||!/^[0-9a-f]{128}$/.test(c.sig)) return false;
    if((await hpIdOf(c.master))!==c.id) return false;
    return await edVerify(c.master, hpKillMsg(c.id,c.ts), c.sig);
  }catch(e){ return false; }
}
function hpKillCert(){ return hpKillMe()?{ id:ID.address, master:ID.publicKey, ts:ID.killed.ts, sig:ID.killed.sig }:null; }
function hpKillTargets(){ return ((ID&&Array.isArray(ID.contacts))?ID.contacts:[]).filter(c=>c&&c.card&&c.address!==ID.address&&!hpDeadPeer(c.address)); }
function hpKillSum(){ const d=(hpKillMe()&&ID.killed.done&&typeof ID.killed.done==='object')?ID.killed.done:{}, ts=hpKillTargets(), told=ts.filter(c=>d[c.address]).length; return { told:told, left:ts.length-told, post:!!d.post }; }

async function hpKillLearn(c, via){
  via=String(via||'');
  if(!ID) return false;
  if(!(await hpKillOk(c))){ try{ hpLog('失効証明書を確かめられない（'+via+'。捨てた）'); }catch(e){} return false; }
  if(ID.prev&&c.id===ID.prev.id&&c.id!==ID.address){ try{ hpLog('前のアカウントの失効証明書（'+via+'）。'+(via==='自分のポスト'?'このポストは前のアカウントのまま使えないので、ポストから切った':'控えない')); }catch(e){} if(via==='自分のポスト'){ try{ stopBg(); }catch(e){} try{ dot('d-rly','err'); }catch(e){} try{ hpBanner(T('ho_e_oldpost')); }catch(e){} } return false; }
  if(c.id===ID.address){
    if(c.master!==ID.publicKey) return false;
    if(hpKillMe()) return true;
    ID.killed={ ts:c.ts, sig:c.sig, at:Date.now(), done:(via==='自分のポスト')?{post:1}:{}, heard:via };
    saveID();
    try{ if(typeof hpNote==='function') hpNote('medead',{},'medead:'+c.ts); }catch(e){}
    try{ hpLog('このアカウントは無効になっている（'+via+'で失効証明書を確かめた）。ポストから切り、送ることも受け取ることもやめる'); }catch(e){}
    try{ stopBg(); }catch(e){}
    hpKillAfter();
    if(!(typeof HP_RE_BUSY!=='undefined'&&HP_RE_BUSY)) hpKillSoon(0);
    return true;
  }
  if(hpDeadPeer(c.id)) return true;
  if(!ID.dead||typeof ID.dead!=='object') ID.dead={};
  ID.dead[c.id]={ master:c.master, ts:c.ts, sig:c.sig, at:Date.now() };
  hpDeadPrune();
  try{ if(isContact(c.id)&&typeof hpNote==='function') hpNote('dead',{name:nickOf(c.id)},'dead:'+c.id); }catch(e){}
  try{ hpReqLoad(); const n0=REQUESTS.length; for(let i=REQUESTS.length-1;i>=0;i--){ const q=REQUESTS[i]; if(q&&q.hp&&q.from===c.id) REQUESTS.splice(i,1); } if(REQUESTS.length!==n0){ hpReqSave(); try{ renderRequests(); }catch(e){} } }catch(e){}
  saveID();
  try{ hpLog('失効証明書を確かめた（'+via+'）→ '+nickOf(c.id)+' のアカウントは無効。以後送らない・受けない'); }catch(e){}
  try{ renderContacts(); }catch(e){} try{ convDirty(); }catch(e){}
  try{ if(CURPEER===c.id){ hpDecorate(c.id); const tt=(typeof document!=='undefined'&&document.getElementById)?document.getElementById('chat-title'):null; if(tt&&typeof hpChatTitle==='function') hpChatTitle(tt,c.id); } }catch(e){}
  return true;
}
function hpDeadPrune(){
  const d=ID&&ID.dead; if(!d||typeof d!=='object') return; const ks=Object.keys(d); if(ks.length<=HP_DEAD_MAX) return;
  const keep=new Set(((ID.contacts)||[]).map(x=>x&&x.address));
  ks.filter(k=>!keep.has(k)).sort((a,b)=>(d[a].at||0)-(d[b].at||0)).slice(0,ks.length-HP_DEAD_MAX).forEach(k=>{ delete d[k]; });
}

async function hpKillLetter(r){
  let o=null; try{ o=JSON.parse(r.body); }catch(e){ return false; }
  if(!o||o.v!==1||o.type!=='kill') return false;
  if(!o.cert||typeof o.cert!=='object'||o.cert.id!==r.from){ try{ hpLog('失効証明書の手紙だが、送り手のものでない（捨てた）'); }catch(e){} return true; }
  await hpKillLearn(o.cert,'手紙'); return true;
}

async function hpKillPost(url, cert){
  let c; try{ c=await HotPocket.createClient([url], await HotPocket.generateKeys()); }catch(e){ throw new Error('つながらない'); }
  const replies=[]; c.on(HotPocket.events.contractOutput, r=>{ for(const out of r.outputs){ try{ replies.push(JSON.parse(hpText(out))); }catch(e){} } });
  let up=false; try{ up=await c.connect(); }catch(e){ up=false; } if(!up) throw new Error('つながらない');
  try{
    await c.submitContractInput(JSON.stringify({op:'kill', ts:cert.ts, sig:cert.sig}));
    const t0=Date.now(); while(!replies.length&&Date.now()-t0<HP_KILL_WAIT) await sleep(50);
    const r=replies[0]; if(!r) throw new Error('返事がない');
    if(r.ok==='kill'||(r.err==='killed'&&r.id===cert.id)) return r.ts===cert.ts?'預けた':'前の証明書が預けてある';
    if(r.err==='no owner') return '持ち主のいないポスト';
    throw new Error(String(r.err||'返事の形が違う'));
  } finally { try{ await c.close(); }catch(e){} }
}

async function hpKillSpread(){
  if(!hpKillMe()||HP_KILL_BUSY) return null;
  HP_KILL_BUSY=true;
  try{
    await hpReady();
    const K=ID.killed; if(!K.done||typeof K.done!=='object') K.done={};
    const cert=hpKillCert();
    if(!K.done.post){
      try{ const r=await hpKillPost(hpPostUrl(),cert); K.done.post=1; saveID(); hpLog('自分のポストに失効証明書を預けた（'+r+'）'); }
      catch(e){ hpLog('自分のポストに失効証明書を預けられない（'+e.message+'。あとでもう一度）'); }
    }
    const body=JSON.stringify({v:1,type:'kill',cert:cert});
    for(const c of hpKillTargets()){
      if(K.done[c.address]) continue;
      try{ await hpPut(c.card, body, 'msg'); K.done[c.address]=1; saveID(); hpLog('無効にしたことを知らせた → '+nickOf(c.address)); }
      catch(e){ hpLog('無効にしたことを知らせられない → '+nickOf(c.address)+'（'+((e&&(e.hpWhy||e.message))||'')+'。あとでもう一度）'); }
    }
    const s=hpKillSum();
    if(s.left||!s.post) hpKillSoon(); else { HP_KILL_N=0; hpLog('無効にしたことを、自分のポストと連絡先 '+s.told+' 人の全員に知らせた'); }
    return s;
  } finally { HP_KILL_BUSY=false; try{ hpKillUi(); }catch(e){} }
}
function hpKillSoon(ms){
  if(HP_KILL_T||!hpKillMe()) return;
  if(Date.now()-(ID.killed.at||0)>HP_KILL_GIVEUP) return;
  const w=(ms!=null)?ms:HP_KILL_STEPS[Math.min(HP_KILL_N,HP_KILL_STEPS.length-1)]; if(ms==null) HP_KILL_N++;
  HP_KILL_T=setTimeout(()=>{ HP_KILL_T=null; hpKillSpread().catch(()=>{}); },w);
}

async function hpKillStart(){
  if(!ID) return false;
  if(hpKillMe()||!hpIsMain()){ hpKillUi(); return false; }
  if(!(await hpAsk({title:T('kl_title'), text:T('cf_kill'), word:'kill', danger:true, auth:true, ok:T('btn_kill_go'), why:'アカウントを無効にする'}))) return false;
  const ts=Date.now(); let sig;
  try{ sig=await edSign(hpKillMsg(ID.address,ts)); }catch(e){ hpLog('失効証明書に署名できない '+e.message); return false; }
  ID.killed={ ts:ts, sig:sig, at:ts, done:{} }; saveID();
  hpLog('このアカウントを無効にした。自分のポストと連絡先 '+hpKillTargets().length+' 人に知らせる');
  try{ stopBg(); }catch(e){}
  hpKillAfter();
  await hpKillSpread();
  return true;
}

function hpKillAfter(){
  try{ hpBanner(T('bn_me_dead')); }catch(e){}
  try{ dot('d-rly','err'); }catch(e){}
  try{ renderContacts(); }catch(e){} try{ convDirty(); }catch(e){}
  try{ if(CURPEER) hpDecorate(CURPEER); }catch(e){}
  try{ if(typeof renderDevices==='function') renderDevices(); }catch(e){} try{ if(typeof hpPaperUi==='function') hpPaperUi(); }catch(e){}
  try{ hpKillUi(); }catch(e){}
}

function hpKillBoot(){ hpKillAfter(); const s=hpKillSum(); if(s.left||!s.post) hpKillSoon(3000); }

function hpKillUi(){
  try{
    if(typeof document==='undefined'||typeof document.getElementById!=='function') return;
    const card=document.getElementById('kill-card'); if(!card) return;
    card.style.display=ID?'':'none'; if(!ID) return;
    const nt=document.getElementById('kill-note'), st=document.getElementById('kill-state'), b=document.getElementById('btn-kill'), bn=document.getElementById('btn-kill-new');
    const me=hpKillMe(), main=hpIsMain();
    if(nt) nt.textContent=T(me?(main?'nt_kill_new':'nt_kill_new_sub'):(main?'nt_kill':'nt_kill_sub'));
    if(st){ st.style.display=me?'':'none'; if(me){ const s=hpKillSum(); st.textContent=TF('kl_state',{n:s.told,m:s.left}); } }
    if(b){ b.style.display=(!me&&main)?'':'none'; b.onclick=()=>{ hpKillStart().catch(e=>{ try{ hpLog('無効にできない '+e.message); }catch(x){} }); }; }
    if(bn){ bn.style.display=me?'':'none'; bn.textContent=T(main?'btn_kill_new':'btn_clear'); bn.className='b '+(main?'pri':'warn'); bn.onclick=()=>{ if(main&&typeof hpHoFlow==='function') hpHoFlow(); else hpForgetHere(); }; }
    const bq=document.getElementById('btn-ho-req'); if(bq){ const n=(!me&&main&&typeof hpHoTodo==='function')?hpHoTodo().length:0; bq.style.display=n?'':'none'; bq.textContent=T((ID.prev&&ID.prev.sentAt)?'btn_ho_req_again':'btn_ho_req'); bq.onclick=()=>{ hpHoReqFlow(); }; }
    try{ const bq0=document.getElementById('btn-ho-req'); const dm=document.getElementById('danger-more'); if(dm&&(me||(bq0&&bq0.style.display===''))) dm.open=true; }catch(e){}
  }catch(e){}
}

function hpDeadBar(peer){
  try{
    if(typeof document==='undefined'||typeof document.getElementById!=='function') return;
    const comp=document.getElementById('composer'); if(!comp||!comp.parentNode) return;
    let bar=document.getElementById('hp-deadbar'); const me=hpKillMe(), on=!!peer&&(me||hpDeadPeer(peer));
    if(!on){ if(bar){ bar.remove(); if(!document.getElementById('hp-blkbar')) comp.style.display=''; } try{ const st=document.getElementById('status'); if(st&&st.dataset&&st.dataset.dead){ delete st.dataset.dead; if(typeof rtcUi==='function') rtcUi(); } }catch(e){} return; }
    if(!bar){ bar=document.createElement('div'); bar.id='hp-deadbar'; bar.style.cssText='padding:10px 12px;font-size:13px;line-height:1.6;color:var(--red);text-align:center'; comp.parentNode.insertBefore(bar,comp.nextSibling); }
    bar.textContent=me?T('bar_me_dead'):TF('bar_dead',{who:nickOf(peer)});
    comp.style.display='none';
    try{ const st=document.getElementById('status'); if(st){ st.textContent=me?T('st_me_dead'):TF('st_dead',{who:nickOf(peer)}); if(st.dataset) st.dataset.dead='1'; } }catch(e){}
  }catch(e){}
}
