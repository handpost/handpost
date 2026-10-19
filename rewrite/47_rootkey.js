let HP_RK_ON=false;
const HP_RK_WEEK=7*86400e3, HP_RK_MONTH=30*86400e3, HP_RK_MAXN=9;
let HP_RK_KEEP=2;

async function hpRkCompact(kp,want,why){ const n0=(ID.roster||[]).length, last=hpRkLast(), at=Math.max(Date.now(),Number(last&&last.at||0)+1);
  ID.roster=[await hpRkFirst(kp,want,at)]; ID.root=kp.pub; saveID();
  try{ hpLog('名簿が長くなったので、元鍵で 1 枚にまとめ直した（'+n0+' 枚 → 1 枚・端末 '+want.length+' 台・'+(why||'')+'）'); }catch(e){}
  try{ if(typeof hpCardDueMark==='function') hpCardDueMark(1); }catch(e){}   return true; }
function hpRkOn(){ return HP_RK_ON===true; }
function hpRkKp(p){ const s=hp5S(), seed=s.crypto_generichash(32,s.from_string('handpost-paper-master:v1'),p), kp=s.crypto_sign_seed_keypair(seed); return {pub:hpHex(kp.publicKey), sk:kp.privateKey}; }
function hpRkKpPem(pem){ const s=hp5S(), der=pemToBytes(pem); if(!der||der.length!==48) throw new Error('pem'); const kp=s.crypto_sign_seed_keypair(der.slice(16)); return {pub:hpHex(kp.publicKey), sk:kp.privateKey}; }
function hpRkDevs(list){ const out=[], seen={}; for(const d of (Array.isArray(list)?list:[])){ if(!d||typeof d.dev!=='string'||!/^ed[0-9a-f]{64}$/.test(d.dev)||seen[d.dev]) continue; seen[d.dev]=1; out.push({dev:d.dev,kind:HP_RS_KINDS.indexOf(d.kind)>=0?d.kind:'other'}); if(out.length>=HP_RS_MAXDEV) break; } return out; }
async function hpRkFirst(kp,devs,at){
  const r={v:1,id:await hpIdOf(kp.pub),root:kp.pub,n:1,at:Number(at)||Date.now(),prev:'',devs:hpRkDevs(devs),by:'root',sigs:{}}; hpRsSign(r,kp.sk,'root');
  const w=await hpRsFirst(r); if(w) throw new Error('roster '+w); return r; }
function hpRkNext(kp,prev,devs,at){
  const r={v:1,id:prev.id,root:prev.root,n:prev.n+1,at:Number(at)||Date.now(),prev:hpRsHash(prev),devs:hpRkDevs(devs),by:'root',sigs:{}}; hpRsSign(r,kp.sk,'root');
  const st=hpRsStep(prev,r,r.at,[]); if(st.ok!==true) throw new Error('roster '+st.why); return r; }
function hpRkLast(){ return (ID&&Array.isArray(ID.roster)&&ID.roster.length)?ID.roster[ID.roster.length-1]:null; }
function hpRkGone(){ return !!(ID&&!ID.privateKeyPem&&!ID.link&&typeof ID.root==='string'&&ID.root===ID.publicKey&&hpRkLast()); }
function hpRkDead(){ try{ return typeof hpKillMe==='function'&&!!hpKillMe(); }catch(e){ return false; } }
async function hpRkEnsure(why){
  if(!ID||!ID.privateKeyPem||ID.link||hpRkDead()) return false;
  let kp; try{ kp=hpRkKpPem(ID.privateKeyPem); }catch(e){ return false; } if(kp.pub!==ID.publicKey) return false;
  const me=await hpDevKey(), my=hpHex(me.publicKey), kd=l=>{ try{ return hpDevKindOf(l); }catch(e){ return 'other'; } };
  let sibs=[]; try{ sibs=hpSibs(); }catch(e){}
  const want=hpRkDevs([{dev:my,kind:kd(hpDevLabelGuess())}].concat(sibs.map(d=>({dev:d.dev,kind:kd(d.label)})))), cur=hpRkLast();
  if(cur&&cur.root===kp.pub&&cur.id===ID.address&&ID.root===kp.pub&&(ID.roster.length>HP_RK_KEEP||(ID.roster.length>=HP_RK_KEEP&&cur.devs.map(d=>d.dev).join()!==want.map(d=>d.dev).join()))) return await hpRkCompact(kp,want,why);
  if(cur&&cur.root===kp.pub&&cur.id===ID.address&&cur.devs.map(d=>d.dev).join()===want.map(d=>d.dev).join()&&ID.root===kp.pub) return false;
  if(cur&&cur.root===kp.pub&&cur.id===ID.address&&ID.root===kp.pub){
    let good=false; try{ good=(await hpRsChain(ID.roster,Date.now(),[])).ok===true; }catch(e){}
    if(good){ ID.roster=ID.roster.concat([hpRkNext(kp,cur,want)]); saveID(); try{ hpLog('名簿を書き足した（'+ID.roster.length+' 枚目・端末 '+want.length+' 台・'+(why||'')+'）'); }catch(e){} return true; } }
  ID.roster=[await hpRkFirst(kp,want)]; ID.root=kp.pub; saveID(); try{ hpLog('名簿の最初の 1 枚を作った（端末 '+want.length+' 台・'+(why||'')+'。まだ配らない）'); }catch(e){} return true; }
async function hpRkErase(why,inFlow){
  if(!hpRkOn()||!ID||!ID.privateKeyPem||ID.link||!ID.paperOk||hpRkDead()) return false;
  try{ if(!inFlow&&typeof document!=='undefined'&&document.getElementById('paper-flow')) return false; }catch(e){}
  try{ await hpRkEnsure('消す前'); }catch(e){ try{ hpLog('名簿を作れないので、元鍵を消さない '+e.message); }catch(x){} return false; }
  const last=hpRkLast(), my=hpHex((await hpDevKey()).publicKey);
  if(!last||last.root!==ID.publicKey||!last.devs.some(d=>d.dev===my)||(await hpRsFirst(ID.roster[0]))!==''){ try{ hpLog('名簿にこの端末が無いので、元鍵を消さない'); }catch(e){} return false; }
  try{ if(hpVaultOn()&&hpPaperP()) hpPaperWrapAdd(); }catch(e){}
  delete ID.paper; delete ID.privateKeyPem; delete ID.paperReq; ID.root=ID.publicKey; ID.rootGone=Date.now(); EDPRIV=null; saveID();
  try{ hpLog('元鍵と紙の 14 語を、この端末から消した（'+(why||'')+'）。残っているのは紙だけ'); }catch(e){}
  try{ hpPaperUi(); }catch(e){} try{ renderDevMode(); renderDevices(); }catch(e){} return true; }
async function hpRkBoot(why){ let a=false, b=false; try{ a=await hpRkEnsure(why); }catch(e){} try{ b=await hpRkErase(why); }catch(e){} return a||b; }
function hpRkWrapAdd(p){
  try{ const m=hpVaultMeta(); if(!m||!VAULT||!VAULT_DK) return false; m.wraps=m.wraps.filter(w=>w.k!=='paper'); m.wraps.push(hpPaperWrap(hpHex(p),VAULT_DK)); m.at=Date.now(); localStorage.setItem(HP_VAULT_KEY,JSON.stringify(m)); try{ hpLog('この端末の封に紙の包みを足した'); }catch(e){} return true; }catch(e){ return false; } }
function hpRkConfirm(text){
  let p; try{ p=hpPaperParse(text); }catch(e){ return {err:(e&&e.hpvMsg)||T('pp_e_check')}; }
  let pub=''; try{ pub=hpRkKp(p).pub; }catch(e){}
  if(!pub||!ID||pub!==ID.publicKey) return {err:T('rk_e_other')};
  ID.paperOk=Date.now(); delete ID.paperLost; saveID();
  const added=hpVaultOn()?hpRkWrapAdd(p):false; try{ p.fill(0); }catch(e){}
  try{ hpLog('紙のバックアップを確かめた（14 語。端末には残していない）'); }catch(e){} return {ok:true,vault:added}; }

function hpRkN(){ const n=Number(ID&&ID.paperN); return (Number.isInteger(n)&&n>=1&&n<=HP_RK_MAXN)?n:1; }
function hpRkSetN(n){ n=Math.max(1,Math.min(HP_RK_MAXN,Math.round(Number(n)||1))); if(ID){ ID.paperN=n; saveID(); try{ hpLog('紙の枚数を '+n+' 枚と控えた'); }catch(e){} } return n; }
function hpRkChecked(fresh){
  if(!ID) return; if(fresh){ ID.paperAt=Date.now(); ID.paperN=1; delete ID.paperAsk; } delete ID.paperLost; saveID(); }
function hpRkHasPaper(){ return !!(ID&&ID.paperOk&&!ID.link&&!hpRkDead()&&(ID.privateKeyPem||hpRkGone())); }
function hpRkAskDue(now){
  if(!hpRkHasPaper()) return ''; const t=(Number(now)||Date.now())-(Number(ID.paperAt)||Number(ID.paperOk)), a=ID.paperAsk||{};
  if(t>=HP_RK_MONTH&&!a.m) return 'm'; if(t>=HP_RK_WEEK&&!a.w) return 'w'; return ''; }
function hpRkAskMark(ans,now){
  now=Number(now)||Date.now(); const due=hpRkAskDue(now); if(!due||['all','some','none'].indexOf(ans)<0) return false;
  const a=(ID.paperAsk&&typeof ID.paperAsk==='object')?ID.paperAsk:{}; if(!a.w) a.w=now; if(due==='m') a.m=now; a.last=ans; ID.paperAsk=a;
  if(ans==='none') ID.paperLost=now; else if(ans==='all') delete ID.paperLost; saveID();
  try{ hpLog('紙をしまった場所の確かめ（'+(due==='m'?'1 か月後':'1 週間後')+'）に答えた：'+(ans==='all'?'全部覚えている':ans==='some'?'覚えていない紙がある':'1 枚も見つからない')); }catch(e){} return true; }
function hpRkOneDev(){ try{ return hpDevRows().length<=1; }catch(e){ return false; } }
function hpRkAskNag(){ if(!hpRkAskDue()) return false; hpBanner(TF('bn_rk_ask',{n:hpRkN()}),()=>{ try{ hpRkAskOpen(); }catch(e){} },'nag'); return true; }
function hpRkBox(id){
  const old=document.getElementById(id); if(old) old.remove();
  const box=document.createElement('div'); box.id=id; box.style.cssText='position:fixed;inset:0;z-index:9997;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
  const card=document.createElement('div'); card.className='card'; card.style.cssText='max-width:440px;width:100%;margin:0'; box.appendChild(card); document.body.appendChild(box);
  const el=(tag,cls,txt,eid)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; if(eid) e.id=eid; return e; };
  return {box:box,card:card,el:el,close:()=>{ try{ box.remove(); }catch(e){} }}; }
function hpRkAskOpen(){
  if(!hpRkAskDue()) return false; const B=hpRkBox('rk-ask');
  const tx=B.el('div',null,TF('rk_ask',{n:hpRkN()}),'rk-ask-text'); tx.style.cssText='white-space:pre-line;line-height:1.6'; B.card.appendChild(tx);
  if(hpRkOneDev()){ const o=B.el('div','note',T('rk_ask_one'),'rk-ask-one'); o.style.marginTop='8px'; B.card.appendChild(o); }
  const col=B.el('div'); col.style.cssText='display:flex;flex-direction:column;gap:8px;margin-top:12px';
  const ans=(k,txt,pri)=>{ const b=B.el('button','b'+(pri?' pri':''),txt,'rk-ask-'+k); b.type='button'; b.onclick=()=>{ hpRkAskMark(k); B.close(); try{ hpSafetyNag(); }catch(e){} try{ hpPaperUi(); }catch(e){} if(k!=='all'){ try{ alert(T(k==='some'?'rk_ans_some':'rk_ans_none')); }catch(e){} } }; col.appendChild(b); };
  ans('all',T('btn_rk_all'),true); ans('some',T('btn_rk_some'),false); ans('none',T('btn_rk_none'),false);
  const lt=B.el('button','b',T('btn_rk_later'),'rk-ask-later'); lt.type='button'; lt.onclick=()=>{ B.close(); try{ hpSafetyNag(); }catch(e){} }; col.appendChild(lt);
  B.card.appendChild(col); return true; }
function hpRkCountOpen(){
  if(!hpRkHasPaper()) return false; const B=hpRkBox('rk-n'); let n=hpRkN();
  const tx=B.el('div',null,T('rk_n_ask'),'rk-n-text'); tx.style.lineHeight='1.6'; B.card.appendChild(tx);
  const row=B.el('div','row'); row.style.cssText='margin-top:12px;align-items:center;justify-content:center;gap:14px';
  const num=B.el('b',null,String(n),'rk-n-num'); num.style.cssText='font-size:22px;min-width:2em;text-align:center';
  const mk=(txt,d,eid)=>{ const b=B.el('button','b',txt,eid); b.type='button'; b.onclick=()=>{ n=Math.max(1,Math.min(HP_RK_MAXN,n+d)); num.textContent=String(n); }; return b; };
  row.appendChild(mk('−',-1,'rk-n-dec')); row.appendChild(num); row.appendChild(mk('＋',1,'rk-n-inc')); B.card.appendChild(row);
  const r2=B.el('div','row'); r2.style.cssText='margin-top:12px;justify-content:flex-end';
  const no=B.el('button','b',T('ask_cancel'),'rk-n-no'); no.type='button'; no.onclick=B.close;
  const ok=B.el('button','b pri',T('btn_rk_n_ok'),'rk-n-ok'); ok.type='button'; ok.onclick=()=>{ hpRkSetN(n); B.close(); try{ hpPaperUi(); }catch(e){} };
  r2.appendChild(no); r2.appendChild(ok); B.card.appendChild(r2); return true; }
function hpRkCardUi(){
  const card=document.getElementById('paper-card'), st=document.getElementById('paper-state'), bp=document.getElementById('btn-paper'); if(!card||!st||!bp) return;
  let ln=document.getElementById('paper-n'), bt=document.getElementById('btn-paper-n');
  if(!ln){ ln=document.createElement('div'); ln.className='note'; ln.id='paper-n'; ln.style.marginTop='4px'; st.parentNode.insertBefore(ln,st.nextSibling); }
  if(!bt){ bt=document.createElement('button'); bt.className='b'; bt.id='btn-paper-n'; bt.onclick=()=>{ try{ hpRkCountOpen(); }catch(e){} }; bp.parentNode.appendChild(bt); }
  const s=hpPaperState(), on=(s==='ok'||s==='year')&&hpRkHasPaper();
  ln.style.display=on?'':'none'; bt.style.display=on?'':'none'; if(!on) return;
  ln.textContent=TF('rk_count',{n:hpRkN()})+(ID.paperLost?' '+T('rk_lost_mark'):''); bt.textContent=T('btn_rk_n'); }

function hpRkWrap(name,mk){ try{ const f=globalThis[name]; if(typeof f!=='function'||f.__hpRk) return false; const w=mk(f); w.__hpRk=true; globalThis[name]=w; return true; }catch(e){ return false; } }
function hpRkInit(){
  hpRkWrap('hpPaperUi',f=>function(){ const r=f.apply(this,arguments); try{ hpRkCardUi(); }catch(e){} return r; });
  hpRkWrap('hpPaperState',f=>function(){ if(hpRkGone()&&!hpRkDead()) return !ID.paperOk?'ok':((Date.now()-ID.paperOk>HP_PAPER_YEAR)?'year':'ok'); return f.apply(this,arguments); });
  hpRkWrap('hpPaperConfirm',f=>function(text){ if(hpRkGone()&&!hpPaperP()) return hpRkConfirm(text); return f.apply(this,arguments); });
  hpRkWrap('hpPaperNag',f=>function(){ const st=hpPaperState(); if(st==='todo'||st==='year') return f.apply(this,arguments); try{ hpRkAskNag(); }catch(e){} });
}
hpRkInit();

const HP_RK_LONG=22;
function hpRkLongDue(){ try{ return hpRkGone()&&!hpRkDead()&&Array.isArray(ID.roster)&&ID.roster.length>HP_RK_LONG; }catch(e){ return false; } }
async function hpRkLongDo(p){
  if(!hpRkLongDue()) return false;
  try{ if(typeof hpD2Pend==='function'&&hpD2Pend().length){ hpLog('端末の追加・外すの申し出が待ちの間は、名簿をまとめ直さない（済んだら、紙をもう一度打ったときに）'); return false; } }catch(e){}
  let kp; try{ kp=hpRkKp(p); }catch(e){ return false; } if(kp.pub!==ID.publicKey) return false;
  const last=hpRkLast(); if(!last||last.root!==kp.pub) return false;
  await hpRkCompact(kp,last.devs,'紙の 14 語で'); try{ kp.sk.fill(0); }catch(e){}
  try{ if(typeof hpMcSibSend==='function') await hpMcSibSend(true); }catch(e){}
  try{ if(typeof hpRsRun==='function'&&typeof hpCardDueRun==='function') hpRsRun(()=>hpCardDueRun(true)); }catch(e){}
  return true; }
try{ if(!hpRkConfirm.__long){ const f=hpRkConfirm; hpRkConfirm=function(text){ const r=f.apply(this,arguments);
  try{ if(r&&r.ok&&hpRkLongDue()){ const p=hpPaperParse(text); Promise.resolve(hpRkLongDo(p)).then(ok=>{ if(ok){ try{ hpToast(T('rk_long_done')); }catch(e){} try{ hpBanner(null,null,'nag'); hpSafetyNag(); }catch(e){} } }).catch(e=>{ try{ hpLog('名簿をまとめ直せない '+((e&&e.message)||e)); }catch(_){} }).then(()=>{ try{ p.fill(0); }catch(e){} }); } }catch(e){}
  return r; }; hpRkConfirm.__long=1; } }catch(e){}
try{ if(!hpRkAskNag.__long){ const f=hpRkAskNag; hpRkAskNag=function(){ if(hpRkLongDue()){ hpBanner(TF('bn_rk_long',{n:ID.roster.length}),()=>{ try{ hpPaperFlow(3); }catch(e){} },'nag'); return true; } return f.apply(this,arguments); }; hpRkAskNag.__long=1; } }catch(e){}
hpRkWrap('hpPaperInputs',f=>function(id){ const pc=f.apply(this,arguments);
  try{ if(id==='paper-in'&&hpRkLongDue()&&pc&&pc.el){ const nt=document.createElement('div'); nt.className='note'; nt.id='rk-long'; nt.textContent=TF('rk_long_note',{n:ID.roster.length}); nt.style.cssText='margin-bottom:8px;color:var(--amber)'; pc.el.insertBefore(nt,pc.el.firstChild); } }catch(e){}
  return pc; });

