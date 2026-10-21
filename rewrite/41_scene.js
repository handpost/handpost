const HP_CS_FAIL=new Map();
const HP_CS_KEYS={walk:'cs_walk',posted:'cs_posted',opened:'cs_opened',hand_walk:'cs_hand_walk',hand:'cs_hand',handed:'cs_handed',road:'cs_road',offline:'cs_offline',busy:'cs_busy',full:'cs_full',lock:'cs_lock',big:'cs_big',wait_line:'cs_wait_line',devs:'cs_devs'};
const HP_LEASE_SOON=7*864e5;
const HP_LEASE_WARN=30*864e5;
const HP_LEASE_AMBER=14*864e5;
const HP_CS_JOY_MS=3000;
const HP_LEASE_SKEW=600e3;
let HP_CS_T=null, HP_CS_TICK=null, HP_LEASE_NOTED='';
function hpCsFail(peer,why){ try{ HP_CS_FAIL.set(peer,String(why||'')); }catch(e){} hpCsRefresh(); }
function hpCsOnline(){ try{ return !(typeof navigator!=='undefined'&&navigator&&navigator.onLine===false); }catch(e){ return true; } }
function hpCsLastSent(peer){ let last=null, mine=null; try{ const me=(typeof sibDv==='function')?sibDv():''; for(const m of histLoad(peer)){ if(m.d!=='s'||m.x) continue;   if(!last||m.ts>last.ts) last=m; const own=!m.dv||(!!me&&m.dv===me); if(own&&m.dv!=='old'&&!m.hp&&!m.g&&!m.k&&(m.p||m.hf)&&(!mine||m.ts>mine.ts)) mine=m; } }catch(e){} return mine||last; }
function hpCsState(peer){
  if(!peer||typeof ID==='undefined'||!ID) return null;
  if(typeof hpBlocked==='function'&&hpBlocked(peer)) return null;
  if(typeof hpDeadPeer==='function'&&hpDeadPeer(peer)) return null;
  if(typeof hpKillMe==='function'&&hpKillMe()) return null;
  if(!hpCsOnline()) return 'offline';
  if(typeof rtcLineTo==='function'&&rtcLineTo(peer)){ const lm=hpCsLastSent(peer); if(lm&&!lm.x&&typeof lm.g==='number'&&Date.now()-lm.g<HP_CS_JOY_MS) return 'handed';   return 'hand'; }
  if(typeof MODE!=='undefined'&&MODE==='calling'){ const t=(typeof WAIT_PEER!=='undefined'&&WAIT_PEER)||(typeof RTC_CALL!=='undefined'&&RTC_CALL&&RTC_CALL.peer)||(typeof RTC_PEER!=='undefined'&&RTC_PEER)||null; if(t===peer) return 'hand_walk'; }
  const m=hpCsLastSent(peer); if(!m) return 'idle';
  if(m.hf){ const k=(typeof hpFailKindOf==='function')?hpFailKindOf(m):m.hf.k, why=HP_CS_FAIL.get(peer)||'';   if(k==='self') return 'big'; if(k==='peer') return 'lock'; if(why==='rate limit') return 'busy'; if(why==='post full') return 'full'; if(why==='bad letter') return 'devs'; return 'road'; }
  if(m.k) return 'opened';
  if(m.g) return 'handed';
  if(m.hp) return 'posted';
  if(m.img||m.file) return 'wait_line';
  return 'walk';
}

const HP_CS_WAITY={road:1,busy:1,full:1,devs:1};
function hpCsLocalHost(u){ try{ const h=String(new URL(String(u)).hostname||'').toLowerCase().replace(/^\[|\]$/g,''); return h==='localhost'||/\.localhost$/.test(h)||/\.local$/.test(h)||h==='::1'||/^127\./.test(h)||/^10\./.test(h)||/^192\.168\./.test(h)||/^172\.(1[6-9]|2\d|3[01])\./.test(h)||/^169\.254\./.test(h)||/^f[cd][0-9a-f]{2}:/.test(h); }catch(e){ return false; } }
function hpCsPostLocal(peer){ try{ const c=(typeof hpCardOf==='function')?hpCardOf(peer):null; const p=(c&&Array.isArray(c.post))?c.post:[]; return p.length>0&&p.every(hpCsLocalHost); }catch(e){ return false; } }
function hpCsWaitDays(peer){ try{ if(typeof hpPendList!=='function') return 0; let o=0; for(const m of hpPendList(peer)){ if(!o||m.ts<o) o=m.ts; } return o?Math.floor((Date.now()-o)/864e5):0; }catch(e){ return 0; } }
function hpCsCapText(peer,s){ let key=HP_CS_KEYS[s]; if(!key) return ''; const local=(s==='road'&&hpCsPostLocal(peer)); if(local) key='cs_road_local'; const name=(typeof nickOf==='function')?nickOf(peer):String(peer||''); const F=(k,o)=>(typeof TF==='function')?TF(k,o):k; let t=F(key,{name:name}); if(HP_CS_WAITY[s]){ const d=hpCsWaitDays(peer); if(d>=1){ t=F('cs_long',{d:d,name:name})+t; if(s==='road'&&!local) t+=F('cs_road_why',{name:name}); } } return t; }

function hpLeaseExp(){ try{ return (typeof ID!=='undefined'&&ID&&ID.lease&&Number(ID.lease.exp))||0; }catch(e){ return 0; } }
function hpLeaseState(){ const x=hpLeaseExp(); if(!x) return ''; if(ID.lease&&ID.lease.gone) return 'expired';   const left=x-Date.now(); return left<=0?'expired':(left<=HP_LEASE_SOON?'soon':''); }
function hpLeaseText(){ const x=hpLeaseExp(); if(!x) return ''; try{ return (typeof fmtTS==='function')?fmtTS(x):new Date(x).toLocaleString(); }catch(e){ return String(new Date(x)); } }
function hpLeaseSet(ms,at){ if(typeof ID==='undefined'||!ID) return false; ms=Number(ms)||0; if(!ms){ try{ hpLeaseUi(); }catch(e){} return false; }   const now=Date.now(); at=Number(at)||now; if(at>now+HP_LEASE_SKEW) at=now; { const a0=(ID.lease&&typeof ID.lease.acct==='string')?ID.lease.acct:''; ID.lease={exp:ms,at:at}; if(a0) ID.lease.acct=a0; }     try{ saveID(); }catch(e){} try{ if(typeof hpSceneCap==='function') hpSceneCap(); }catch(e){} return true; }
function hpLeaseApply(exp,at,x){ if(typeof ID==='undefined'||!ID) return false; exp=Number(exp)||0; at=Number(at)||0; if(!exp||!(at>0)||at>Date.now()+HP_LEASE_SKEW) return false; const cur=(ID.lease&&Number(ID.lease.at))||0; if(!(at>cur)) return false; { const a0=(ID.lease&&typeof ID.lease.acct==='string')?ID.lease.acct:'', h0=(ID.lease&&typeof ID.lease.host==='string')?ID.lease.host:''; ID.lease={exp:exp,at:at}; if(x&&typeof x==='object'){ if(typeof x.acct==='string'&&/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(x.acct)) ID.lease.acct=x.acct; if(x.gone===1) ID.lease.gone=1; if(typeof x.tok==='string'&&/^[0-9A-Fa-f]{64}$/.test(x.tok)) ID.lease.tok=x.tok.toUpperCase(); } if(!ID.lease.acct&&a0) ID.lease.acct=a0; if(h0&&ID.lease.acct===a0) ID.lease.host=h0;   }   try{ if(typeof hpSceneCap==='function') hpSceneCap(); }catch(e){} return true; }
function hpLeaseLeft(){ const x=hpLeaseExp(); if(!x) return ''; const left=x-Date.now(), F=(k,n)=>(typeof TF==='function')?TF(k,{n:n}):k+' '+n; if(left<=0) return (typeof T==='function')?T('lease_over'):'lease_over'; if(left>=2*864e5) return F('lease_left_d',Math.floor(left/864e5)); if(left>=2*3600e3) return F('lease_left_h',Math.floor(left/3600e3));   return F('lease_left_m',Math.max(1,Math.floor(left/60e3))); }
function hpLeaseLine(){
  try{ if(typeof document==='undefined'||!document.getElementById) return; const els=['lease-rly','lease-peer'].map(id=>document.getElementById(id)).filter(Boolean); if(!els.length) return;
    const x=hpLeaseExp(), st=hpLeaseState(); const dup=(st==='expired'&&typeof hpSceneKey==='function'&&hpSceneKey()==='nd_post_err_lease');   const t=(x&&!dup)?((typeof TF==='function')?TF('lease_line',{t:hpLeaseText(),left:hpLeaseLeft()}):('⏳ '+hpLeaseText())):'';
    const left0=x?x-Date.now():0, tn=(st==='soon'&&left0<=864e5)?'last':(!st&&x&&left0<=((typeof HP_LEASE_AMBER!=='undefined')?HP_LEASE_AMBER:((typeof HP_LEASE_WARN!=='undefined')?HP_LEASE_WARN:0)))?'warn':st;
    for(const el of els){ el.className='lease'+((tn&&!dup)?' '+tn:''); el.textContent=t; if(t&&tn&&typeof document.createElement==='function'){ try{ const a=document.createElement('a'); a.href='#'; a.className='lease-go'; a.textContent=(typeof T==='function')?T('lease_link'):'lease_link'; a.onclick=e=>{ try{ e.preventDefault(); }catch(_){} try{ hpLeaseGo(); }catch(_){} }; el.appendChild(document.createTextNode(' ')); el.appendChild(a); }catch(e){} } }
    for(const id of ['rly','peer']){ const b=document.getElementById('lease-bar-'+id); if(!b) continue;
      const full=(typeof HP_LEASE_WARN!=='undefined')?HP_LEASE_WARN:30*864e5, show=!!(x&&!dup), pct=(show&&left0>0)?Math.max(1,Math.min(100,Math.round(left0/full*100))):0; b.style.display=show?'':'none'; const f=b.firstElementChild||(b.children&&b.children[0]); if(f){ f.style.width=pct+'%'; f.style.background=(tn==='last'||tn==='expired')?'var(--red)':(tn==='soon'||tn==='warn')?'var(--amber)':'var(--teal)'; } try{ b.title=show?hpLeaseLeft():''; }catch(e){} }
  }catch(e){}
}
function hpLeaseLocal(ms){ const d=new Date(ms), p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate())+'T'+p(d.getHours())+':'+p(d.getMinutes()); }
let HP_GO_N=0;
function hpLeaseGo(){ try{ const tab=document.getElementById('t-post');   if(tab&&tab.click) tab.click(); }catch(e){}

  const n=++HP_GO_N, W=(typeof window!=='undefined')?window:null; let moved=false;
  try{ if(W&&W.addEventListener) for(const ev of ['wheel','touchstart','keydown']) W.addEventListener(ev,()=>{ moved=true; },{once:true,passive:true}); }catch(e){}
  const tgt=()=>{ const r=document.getElementById('post-renew'); return (r&&r.style&&r.style.display!=='none')?r:(document.getElementById('lease-exp-show')||r); };
  const go=i=>{ if(moved||n!==HP_GO_N) return; try{ const t=tgt(); if(!t||!t.scrollIntoView) return; let off=true; try{ const b=t.getBoundingClientRect(), vh=(W&&W.innerHeight)||0; off=!vh||Math.abs((b.top+b.bottom)/2-vh/2)>80; }catch(e){}
      if(i===0||off) t.scrollIntoView({block:'center',behavior:i===0?'smooth':'auto'});
      if(i===0&&t.style){ t.style.outline='2px solid var(--teal)'; t.style.outlineOffset='2px'; setTimeout(()=>{ try{ t.style.outline=''; t.style.outlineOffset=''; }catch(e){} },2000); } }catch(e){} };
  [150,900,1800,3000,4200].forEach((ms,i)=>setTimeout(()=>go(i),ms)); return n; }
function hpLeaseRenew(){ try{ if(typeof hpExtStart==='function') return hpExtStart(); }catch(e){} return false; }
function hpLeaseUi(){ try{ const sv=document.getElementById('lease-exp-show'); if(sv){ const x=hpLeaseExp(), a0=hpLeaseAcct(); const v=a0?(x?hpLeaseText():(typeof T==='function'?T('lease_lg_busy'):'')):(typeof T==='function'?T('lease_noacct'):''); if(sv.textContent!==v) sv.textContent=v; } }catch(e){}   try{ const ea=document.getElementById('lease-acct'); if(ea&&ea!==document.activeElement){ const v=hpLeaseAcct(); if(ea.value!==v) ea.value=v; } }catch(e){}   try{ const el=document.getElementById('lease-exp'); if(!el||el===document.activeElement) return; const x=hpLeaseExp(); const v=x?hpLeaseLocal(x):''; if(el.value!==v) el.value=v; }catch(e){} }

const HP_XAHAU_WSS='wss://xahau.network';
const HP_EV_IDX={base:'A5B8F673C538E8BE497C586BDD21F0087AEA7A9C292A35B3BBFF2FE4D1795FDC',size:'D687418E6C4B6D5677CF96AA0B2720EF287AEAB17592B3AFD3AECF26F8B8D0D4'};
let HP_MOM_EDGE=0;
let HP_MOM_CFG=null, HP_MOM_BUSY=false;
let HP_XAHAU_WS=(typeof WebSocket!=='undefined')?WebSocket:null;
function hpHexLE(h,off,n){ let v=0; for(let i=n-1;i>=0;i--) v=v*256+parseInt(h.substr((off+i)*2,2),16); return v; }
function hpMomDecode(bh,sh){ const b=String(bh||''), s=String(sh||''); if(!/^[0-9a-fA-F]+$/.test(b)||b.length<24||!/^[0-9a-fA-F]+$/.test(s)||s.length<4) throw new Error('form'); const type=b.length>=26?parseInt(b.substr(24,2),16):0; if(type!==1) throw new Error('ledger'); const base=hpHexLE(b,0,8), trans=hpHexLE(b,8,4), size=hpHexLE(s,0,2); if(!(base>0)||!(size>0)) throw new Error('form'); return {base:base,trans:trans,size:size}; }
function hpMomStart(m,c){ return (c.base+(m-c.trans)*c.size)*1000; }
function hpMomNow(c,now){ return c.trans+Math.floor(((now||Date.now())/1000-c.base)/c.size); }
function hpXahauGet(idxs,ms){ return new Promise((res,rej)=>{ const W=HP_XAHAU_WS; if(!W) return rej(new Error('no WebSocket')); let ws=null, done=false, n=0, t=null; const out=[]; const fin=(e,v)=>{ if(done) return; done=true; if(t) clearTimeout(t); try{ if(ws) ws.close(); }catch(_){} if(e) rej(e); else res(v); }; t=setTimeout(()=>fin(new Error('timeout')),ms||12000); try{ ws=new W(HP_XAHAU_WSS); }catch(e){ return fin(e); }
  ws.onopen=()=>{ idxs.forEach((ix,i)=>{ try{ ws.send(JSON.stringify({id:i+1,command:'ledger_entry',index:ix,ledger_index:'validated'})); }catch(e){ fin(e); } }); };
  ws.onmessage=ev=>{ let m=null; try{ m=JSON.parse(ev.data); }catch(e){ return; } const i=(m&&m.id)|0; if(i<1||i>idxs.length||out[i-1]!==undefined) return; if(m.status!=='success') return fin(new Error(String(m.error||'error'))); const d=m.result&&m.result.node&&m.result.node.HookStateData; if(!d) return fin(new Error('no data')); out[i-1]=d; if(++n>=idxs.length) fin(null,out); };
  ws.onerror=()=>fin(new Error('connect')); ws.onclose=()=>fin(new Error('closed')); }); }
async function hpMomCfg(){ if(HP_MOM_CFG&&Date.now()-HP_MOM_CFG.at<600e3) return HP_MOM_CFG; const r=await hpXahauGet([HP_EV_IDX.base,HP_EV_IDX.size]); const c=hpMomDecode(r[0],r[1]); c.at=Date.now(); HP_MOM_CFG=c; return c; }
function hpMomSt(t,err){ try{ const el=document.getElementById('lease-mom-st'); if(el){ el.textContent=t||''; el.style.color=err?'var(--red)':''; } }catch(e){} }
async function hpLeaseFromMoment(v){ const Tt=k=>(typeof T==='function')?T(k):k, Tf=(k,o)=>(typeof TF==='function')?TF(k,o):k;
  const s=String(v==null?'':v).replace(/[\uFF10-\uFF19]/g,c=>String.fromCharCode(c.charCodeAt(0)-0xFEE0)).replace(/[\s,_]/g,'');
  if(!/^\d{1,9}$/.test(s)){ hpMomSt(Tt('lease_mom_bad'),true); return false; } if(HP_MOM_BUSY) return false; HP_MOM_BUSY=true; const m=Number(s);
  try{ hpMomSt(Tt('lease_mom_busy')); let c; try{ c=await hpMomCfg(); }catch(e){ const w=String((e&&e.message)||e); try{ if(typeof log==='function') log(TL('lg_lease_mom_fail',{why:w})); }catch(_){} hpMomSt(w==='ledger'?Tt('lease_mom_type'):Tf('lease_mom_net',{why:w}),true); return false; }
    if(m<c.trans){ hpMomSt(Tt('lease_mom_bad'),true); return false; }
    const ms=hpMomStart(m+HP_MOM_EDGE,c); if(!hpLeaseSet(ms)){ hpMomSt(Tt('lease_mom_bad'),true); return false; } try{ hpLeaseUi(); }catch(e){}
    const now=hpMomNow(c); hpMomSt(Tf('lease_mom_ok',{m:m,t:hpLeaseText(),s:c.size,now:now}),false);
    try{ if(typeof log==='function') log(TL('lg_lease_mom',{m:m,t:hpLeaseText(),base:c.base,trans:c.trans,s:c.size,now:now})); }catch(e){}
    try{ if(typeof hpLeaseCheck==='function') hpLeaseCheck(); }catch(e){} return true;
  } finally { HP_MOM_BUSY=false; } }

const HP_LG_TYPE='4556520100000000000000000000000000000000000000000000000000000002', HP_LG_REF='4556520100000000000000000000000000000000000000000000000000000003';
const HP_LG_EPOCH=946684800, HP_LG_PAGES=10, HP_LGR_EVERY=6*3600e3, HP_LG_ERR=10*60e3;
const HP_LG_RADDR=/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
let HP_LG_BUSY=false, HP_LG_AT=0;
function hpLeaseAcct(){ try{ const a=(typeof ID!=='undefined'&&ID&&ID.lease)?ID.lease.acct:''; return (typeof a==='string'&&HP_LG_RADDR.test(a))?a:''; }catch(e){ return ''; } }
function hpHexStr(h){ h=String(h||''); let s=''; for(let i=0;i+1<h.length;i+=2) s+=String.fromCharCode(parseInt(h.substr(i,2),16)); return s; }
function hpIsLeaseTok(x){ try{ return !!x&&x.LedgerEntryType==='URIToken'&&hpHexStr(x.URI).startsWith('ZXZybGVhc2'); }catch(e){ return false; } }
function hpLgParam(tx,name){ for(const p of ((tx&&tx.HookParameters)||[])){ const P=(p&&p.HookParameter)||{}; if(String(P.HookParameterName||'').toUpperCase()===name) return String(P.HookParameterValue||''); } return ''; }
function hpLgAmt(a){ return (a&&typeof a==='object'&&a.currency==='EVR')?(Number(a.value)||0):0; }
function hpLgMom(tx){ try{ for(const m of (tx.Memos||[])){ const d=String((m.Memo&&m.Memo.MemoData)||''); if(hpHexStr((m.Memo&&m.Memo.MemoType)||'')==='evnExtendSuccess'&&/^[0-9A-Fa-f]{1,16}$/.test(d)) return parseInt(d,16); } }catch(e){} return 0; }

function hpXahauSess(fn,ms,idle){ return new Promise((res,rej)=>{ const W=HP_XAHAU_WS; if(!W) return rej(new Error('no WebSocket')); let ws=null, done=false, id=0, t=null, ti=null; const wait=new Map();
  const poke=()=>{ if(!idle||done) return; if(ti) clearTimeout(ti); ti=setTimeout(()=>fin(new Error('timeout')),idle); };
  const fin=(e,v)=>{ if(done) return; done=true; if(t) clearTimeout(t); if(ti) clearTimeout(ti); try{ if(ws) ws.close(); }catch(_){} for(const w of wait.values()){ try{ w.rej(e||new Error('closed')); }catch(_){} } wait.clear(); if(e) rej(e); else res(v); };
  t=setTimeout(()=>fin(new Error('timeout')),ms||30000); poke();
  const q=o=>new Promise((ok,ng)=>{ if(done) return ng(new Error('closed')); const i=++id; wait.set(i,{res:ok,rej:ng}); try{ ws.send(JSON.stringify(Object.assign({id:i},o))); }catch(e){ wait.delete(i); ng(e); } });
  try{ ws=new W(HP_XAHAU_WSS); }catch(e){ return fin(e); }
  ws.onopen=()=>{ Promise.resolve().then(()=>fn(q)).then(v=>fin(null,v),e=>fin(e)); };
  ws.onmessage=ev=>{ poke(); let m=null; try{ m=JSON.parse(ev.data); }catch(e){ return; } const w=m&&wait.get(m.id); if(!w) return; wait.delete(m.id); if(m.status==='success') w.res(m.result); else w.rej(new Error(m.error||'error')); };
  ws.onerror=()=>fin(new Error('connect')); ws.onclose=()=>fin(new Error('closed')); }); }
function hpLeaseWant(acct){
  try{ if(typeof ID==='undefined'||!ID) return null; const hx=t=>(typeof t==='string'&&/^[0-9A-Fa-f]{64}$/.test(t))?t.toUpperCase():'';
    const L=ID.lease||{}, O=ID.leaseOld||null, skip=[]; let cur=''; try{ cur=(typeof hpPostUrl==='function')?String(hpPostUrl()||''):''; }catch(e){}
    if(O&&hx(O.tok)&&(!O.url||O.url!==cur)) skip.push(hx(O.tok));
    let tok=(L.acct===acct)?hx(L.tok):''; if(tok&&skip.indexOf(tok)>=0) tok='';
    const dm=((/^wss:\/\/([^:\/]+)/.exec(cur)||[])[1]||'').toLowerCase();
    const ut=(ID.leaseByUrl&&cur&&typeof ID.leaseByUrl==='object')?hx(ID.leaseByUrl[cur]):'';
    return {tok:tok,skip:skip,dom:dm,ut:ut}; }catch(e){ return null; } }
async function hpLgDomPick(q,toks,inf,dom){

  const hint=arguments[4]?String(arguments[4]).toUpperCase():'', hit=[], seen={};
  for(const k of toks){ const iss=inf[k]&&inf[k].host; if(!iss) continue;
    try{ let d=seen[iss]; if(d===undefined){ const ai=await q({command:'account_info',account:iss,ledger_index:'validated'}); d=seen[iss]=hpHexStr((ai&&ai.account_data&&ai.account_data.Domain)||'').toLowerCase().replace(/[^a-z0-9.-]/g,''); }
      if(d&&d===dom) hit.push(k); }catch(e){} }
  if(hit.length<2) return hit[0]||'';
  if(hint&&hit.indexOf(hint)>=0) return hint;
  return hit.slice().sort((x,y)=>((inf[y]&&inf[y].buy)||0)-((inf[x]&&inf[x].buy)||0))[0]; }
async function hpLeaseLedger(acct,want){
  return hpXahauSess(async q=>{
    const o=await q({command:'account_objects',account:acct,ledger_index:'validated'});
    const tob=((o&&o.account_objects)||[]).filter(hpIsLeaseTok), toks=tob.map(x=>String(x.index).toUpperCase());
    const inf={}; for(const t of tob) inf[String(t.index).toUpperCase()]={buy:0,unit:0,ext:{},host:String(t.Issuer||''),iss:''};   const okh={}, bof={};   let burn=0, bh='', marker=null, pages=0;
    do{ const r=await q(Object.assign({command:'account_tx',account:acct,limit:200},marker?{marker:marker}:{})); pages++;
      for(const e of ((r&&r.transactions)||[])){ const x=(e&&(e.tx||e.tx_json))||{}; if(((e&&e.meta&&e.meta.TransactionResult)||'')!=='tesSUCCESS') continue;
        const h=String(x.hash||(e&&e.hash)||'').toUpperCase(), ty=hpHexStr(hpLgParam(x,HP_LG_TYPE)), tk=String(x.URITokenID||'').toUpperCase(), when=(Number(x.date)+HP_LG_EPOCH)*1000;
        if(x.TransactionType==='URITokenBuy'&&x.Account===acct&&inf[tk]&&!inf[tk].buy){ inf[tk].buy=when; inf[tk].unit=hpLgAmt(x.Amount); inf[tk].iss=String((x.Amount&&x.Amount.issuer)||''); }
        else if(x.TransactionType==='URITokenBurn'&&x.Account!==acct){ if(when>burn){ burn=when; bh=String(x.Account||''); } if(tk&&!(bof[tk]&&bof[tk].at>=when)) bof[tk]={at:when,h:String(x.Account||'')}; }
        else if(x.TransactionType==='Payment'&&x.Account===acct&&ty==='evnExtendLease'){ const k=hpLgParam(x,HP_LG_REF).toUpperCase(); if(inf[k]) inf[k].ext[h]=hpLgAmt(x.Amount); }
        else if(x.TransactionType==='Payment'&&x.Account!==acct&&ty==='evnExtendSuccess'){ okh[hpLgParam(x,HP_LG_REF).toUpperCase()]=hpLgMom(x)||1; }
      }
      marker=(r&&r.marker)||null;
    } while(marker&&toks.some(k=>!inf[k].buy)&&pages<HP_LG_PAGES);
    const W=want||((typeof hpLeaseWant==='function')?hpLeaseWant(acct):null)||{}; let wt=(typeof W.tok==='string')?W.tok.toUpperCase():'', skip=Array.isArray(W.skip)?W.skip.map(x=>String(x).toUpperCase()):[];
    if(W.dom&&toks.length>1&&typeof hpLgDomPick==='function'){ const dk=await hpLgDomPick(q,toks,inf,String(W.dom),W.ut); if(dk){ wt=dk; W.byDom=1; } }
    if(wt&&toks.indexOf(wt)<0){ const b=bof[wt]; return {gone:1,burn:b?b.at:burn,host:b?b.h:bh,tok:wt,cnt:toks.length}; }
    if(!toks.length) return {gone:1,burn:burn,host:bh};
    const rest=toks.filter(k=>skip.indexOf(k)<0), cand=wt?[wt]:(rest.length?rest:toks);
    let best=null;
    for(const k of cand){ const I=inf[k]; let paid=I.unit, mom=0; for(const h of Object.keys(I.ext)){ if(okh[h]){ paid+=I.ext[h]; if(okh[h]>mom) mom=okh[h]; } }
      const n=(I.buy&&I.unit>0)?Math.round(paid/I.unit):0; const c={tok:k,buy:I.buy,n:n,mom:mom>1?mom:0,host:I.host,unit:I.unit,iss:I.iss};   if(!best||(c.buy||0)>(best.buy||0)||((c.buy||0)===(best.buy||0)&&(c.buy+c.n*3600e3)>(best.buy+best.n*3600e3))) best=c; }
    best.cnt=toks.length; best.pick=W.byDom?'dom':wt?'tok':'new';   return best;
  });
}
function hpLgDays(n,size){ const d=(Number(n)||0)*(Number(size)||3600)/86400; return Number.isInteger(d)?d:Math.round(d*10)/10; }
function hpLgSt(t,err){ try{ const el=document.getElementById('lease-lg-st'); if(el){ el.textContent=t||''; el.style.color=err?'var(--red)':''; } }catch(e){} }
async function hpLeaseFromLedger(why){ const a=hpLeaseAcct(); if(!a||HP_LG_BUSY) return false; HP_LG_BUSY=true; HP_LG_AT=Date.now();
  const Tt=k=>(typeof T==='function')?T(k):k, Tf=(k,o)=>(typeof TF==='function')?TF(k,o):k, Lg=(k,o)=>{ try{ if(typeof log==='function') log((typeof TL==='function')?TL(k,o):k); }catch(e){} }, fm=x=>{ try{ return (typeof fmtTS==='function')?fmtTS(x):new Date(x).toLocaleString(); }catch(e){ return String(x); } };
  try{ hpLgSt(Tt('lease_lg_busy'));
    let r; try{ r=await hpLeaseLedger(a); }catch(e){ const w=String((e&&e.message)||e); Lg('lg_lease_lg_fail',{why:w}); hpLgSt(Tf('lease_lg_fail',{why:w}),true); return false; }
    const now=Date.now();
    if(r.gone){ const was=!!(ID.lease&&ID.lease.gone), cur=hpLeaseExp(); const exp=r.burn||(cur&&cur<now?cur:now); const h0=(ID.lease&&ID.lease.acct===a&&typeof ID.lease.host==='string')?ID.lease.host:''; ID.lease={acct:a,exp:exp,at:now,gone:1}; if(r.tok) ID.lease.tok=r.tok;   if(r.host||h0) ID.lease.host=r.host||h0;   try{ saveID(); }catch(e){} try{ if(typeof hpSceneCap==='function') hpSceneCap(); }catch(e){}
      if(!was) Lg('lg_lease_lg_gone',{a:a,t:fm(exp)}); hpLgSt(Tf('lease_lg_gone',{t:fm(exp)}),true); try{ hpLeaseUi(); hpLeaseCheck(); }catch(e){} return true; }
    let exp=0, how='', size=3600;
    if(r.buy&&r.n>0){ try{ const c=await hpMomCfg(); if(c&&c.size>0) size=c.size; }catch(e){} exp=r.buy+r.n*size*1000; how='buy'; }
    else if(r.mom){ try{ const c=await hpMomCfg(); exp=hpMomStart(r.mom,c); how='mom'; }catch(e){} }
    if(!exp){ Lg('lg_lease_lg_fail',{why:'no expiry'}); hpLgSt(Tt('lease_lg_noexp'),true); return false; }
    const old=hpLeaseExp(), same=!!(ID.lease&&!ID.lease.gone&&old===exp&&ID.lease.tok===r.tok);
    if(!same){ ID.lease={acct:a,exp:exp,at:now,tok:r.tok}; if(r.host) ID.lease.host=r.host; if(r.unit>0) ID.lease.unit=r.unit;     try{ saveID(); }catch(e){} try{ if(typeof hpSceneCap==='function') hpSceneCap(); }catch(e){} Lg('lg_lease_lg_ok',{t:fm(exp),n:r.n||('moment '+r.mom),tok:r.tok.slice(0,8),why:why||''}); }
    if(same&&r.host&&ID.lease.host!==r.host){ ID.lease.host=r.host; try{ saveID(); }catch(e){} }
    if(same&&r.unit>0&&ID.lease.unit!==r.unit){ ID.lease.unit=r.unit; try{ saveID(); }catch(e){} }
    hpLgSt(Tf(how==='buy'?'lease_lg_ok':'lease_lg_okm',{t:fm(exp),n:r.n,m:r.mom,d:hpLgDays(r.n,size)})  +(r.cnt>1?Tf('lease_lg_many',{n:r.cnt}):''));
    try{ hpLeaseUi(); hpLeaseCheck(); }catch(e){} return true;
  } finally { HP_LG_BUSY=false; } }
function hpXplUrl(a){ a=String(a||'').trim(); return /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)?'https://xahauexplorer.com/explorer/'+a:''; }
function hpLeaseAcctSet(v){ const s=String(v==null?'':v).trim(); if(!s) return false; if(!HP_LG_RADDR.test(s)){ hpLgSt((typeof T==='function')?T('lease_lg_bad'):'lease_lg_bad',true); return false; } if(typeof ID==='undefined'||!ID) return false;
  const now=Date.now(), a0=(ID.lease&&typeof ID.lease.acct==='string')?ID.lease.acct:''; ID.lease=Object.assign({},ID.lease||{},{acct:s}); if(a0&&a0!==s) delete ID.lease.tok;   if(Number(ID.lease.exp)) ID.lease.at=now; try{ saveID(); }catch(e){} HP_LG_AT=0; return hpLeaseFromLedger('set'); }

const HP_PX_HOST='https://api.coingecko.com', HP_PX_GAP=2500, HP_PX_IDS={evr:'evernode',xah:'xahau'};
let HP_PAY=null, HP_PAY_BUSY=false, HP_PX_BUSY=false;
let HP_PX_FETCH=(typeof fetch==='function')?(u=>fetch(u,{credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'})):null;
function hpDrops(v){ return (typeof v==='string'&&/^\d+$/.test(v))?Number(v)/1e6:0; }
function hpPayParse(list,acct){ const rows=[];
  for(const e of (list||[])){ const x=(e&&(e.tx||e.tx_json))||{}, meta=(e&&e.meta)||{}, res=String(meta.TransactionResult||''); if(!res) continue;
    const ok=res==='tesSUCCESS', ty=hpHexStr(hpLgParam(x,HP_LG_TYPE)), r={at:(Number(x.date)+HP_LG_EPOCH)*1000,hash:String(x.hash||(e&&e.hash)||'').toUpperCase(),kind:'',evr:0,xah:0,fee:0,tt:String(x.TransactionType||'')};
    if(x.Account===acct){ r.fee=hpDrops(x.Fee); r.lease=x.TransactionType==='URITokenBuy'||(x.TransactionType==='Payment'&&ty==='evnExtendLease')||(x.TransactionType==='AccountSet'&&!!x.MessageKey); if(x.TransactionType==='AccountSet'&&x.MessageKey) r.key=1;
      if(!ok) r.kind='fail';
      else if(x.TransactionType==='URITokenBuy'){ r.kind='buy'; r.evr=-hpLgAmt(x.Amount); r.xah=-hpDrops(x.Amount); }
      else if(x.TransactionType==='Payment'&&ty==='evnExtendLease'){ r.kind='ext'; r.evr=-hpLgAmt(x.Amount); }
      else if(x.TransactionType==='Payment'){ r.kind='out'; r.evr=-hpLgAmt(x.Amount); r.xah=-hpDrops(x.Amount); }
      else r.kind='other';
      r.xah-=r.fee; }
    else { if(!ok||x.TransactionType!=='Payment'||x.Destination!==acct) continue; const d=(meta.delivered_amount!==undefined)?meta.delivered_amount:x.Amount, ev=hpLgAmt(d), xa=hpDrops(d); if(!(ev>0||xa>0)) continue;
      if(/Refund|Error$/i.test(ty)){ r.kind='refund'; r.lease=true; }   else if(ty) continue; else r.kind='in';   r.evr=ev; r.xah=xa; }
    rows.push(r); }
  rows.sort((a,b)=>b.at-a.at); return rows; }
function hpPayCost(r){ if(r.kind==='in') return {evr:0,xah:0}; if(r.kind==='out') return {evr:0,xah:-r.fee}; return {evr:r.evr,xah:r.xah}; }
function hpPaySum(rows){ const s={evr:0,xah:0,n:0}; for(const r of rows){ if(r.kind==='in') continue; const c=hpPayCost(r); s.evr+=c.evr; s.xah+=c.xah; s.n++; } return s; }
function hpPxDay(ts){ const d=new Date(Number(ts)), p=n=>String(n).padStart(2,'0'); return p(d.getUTCDate())+'-'+p(d.getUTCMonth()+1)+'-'+d.getUTCFullYear(); }
function hpPxLoad(){ try{ const s=(typeof hpHGet==='function')?hpHGet('p2p_pxd'):null, o=s?JSON.parse(s):{}; return (o&&typeof o==='object')?o:{}; }catch(e){ return {}; } }
function hpPxSave(o){ try{ if(typeof hpHSet==='function') hpHSet('p2p_pxd',JSON.stringify(o)); }catch(e){} }
async function hpPxRangeOne(id,cur){
  const r=await HP_PX_FETCH(HP_PX_HOST+'/api/v3/coins/'+id+'/market_chart?vs_currency='+cur+'&days=365&interval=daily&precision=full');
  if(r.status===429){ const e=new Error('429'); e.rate=1; throw e; } if(!r.ok) throw new Error('http '+r.status);
  const j=await r.json(), out={}; for(const p of ((j&&Array.isArray(j.prices))?j.prices:[])){ const t=Number(p&&p[0]), v=Number(p&&p[1]); if(!(t>0)||!(v>0)) continue; const d0=Math.round(t/864e5)*864e5; if(Math.abs(t-d0)>15*60e3) continue; out[hpPxDay(d0)]=v; }
  return out; }
async function hpPxRange(cur,sleep){
  sleep=sleep||(ms=>new Promise(ok=>setTimeout(ok,ms))); const got={};
  for(const k of ['evr','xah']){ if(k==='xah') await sleep(3000+Math.floor(Math.random()*17000)); got[k]=await hpPxRangeOne(HP_PX_IDS[k],cur); }
  const o=hpPcLoad(), c=Object.assign({evr:{},xah:{}},o[cur]||{}); c.evr=Object.assign({},c.evr,got.evr); c.xah=Object.assign({},c.xah,got.xah); c.at=Date.now(); o[cur]=c; hpPcSave(o);
  return {n:Math.max(Object.keys(got.evr).length,Object.keys(got.xah).length)}; }
function hpPayUsd(c,at,px){ const p=px[hpPxDay(at)]||{}; let u=0; for(const k of ['evr','xah']){ if(!c[k]) continue; if(!(p[k]>0)) return null; u+=c[k]*p[k]; } return u; }
function hpNum(v,dp){ return Math.abs(Number(v)||0).toFixed(dp).replace(/(\.\d*?)0+$/,'$1').replace(/\.$/,''); }
function hpSigned(v,dp){ return (v>0?'+':'\u2212')+hpNum(v,dp); }
function hpUsdTxt(u,sign){ if(u===null||u===undefined) return '\u2014'; const a=Math.abs(u), s=sign?(u>0?'+':u<0?'\u2212':''):''; return s+'$'+(a>0&&a<0.01?(a<1e-6?'<0.000001':String(Number(a.toPrecision(2)))):a.toFixed(2)); }
function hpPxNum(v){ v=Number(v)||0; return v>=1?v.toFixed(2):String(Number(v.toPrecision(3))); }
function hpPxTxt(c,at,px,cur){ const p=px[hpPxDay(at)]||{}, a=[], sym=(cur&&typeof hpCurSym==='function')?hpCurSym(cur):'$'; for(const k of ['evr','xah']){ if(!c[k]) continue; a.push((k==='evr'?'EVR':'XAH')+' '+(p[k]>0?sym+hpPxNum(p[k]):'\u2014')); } return a.join('\u30FB'); }
function hpPxDays(rows,px){ const s=new Set(); for(const r of (rows||[])){ const d=hpPxDay(r.at), p=px[d]; if(p&&((p.evr>0&&r.evr)||(p.xah>0&&r.xah))) s.add(d); } return [...s].map(d=>d.split('-')).sort((a,b)=>(a[2]+a[1]+a[0]).localeCompare(b[2]+b[1]+b[0])).map(x=>x[1]+'/'+x[0]).join('\u30FB'); }
function hpPaySt(t,err){ try{ const el=document.getElementById('pay-st'); if(el){ el.textContent=t||''; el.style.color=err?'var(--red)':''; } }catch(e){} }
const HP_PAY_K={buy:'pay_k_buy',ext:'pay_k_ext',refund:'pay_k_refund',in:'pay_k_in',out:'pay_k_out',fail:'pay_k_fail'};
function hpPayKind(r){ if(r.key&&r.kind!=='fail') return T('pay_k_key');   return r.kind==='other'?TF('pay_k_other',{t:r.tt}):T(HP_PAY_K[r.kind]||'pay_k_fail'); }
function hpPayDraw(){ if(typeof document==='undefined'||!document.getElementById) return -1; const box=document.getElementById('pay-list'), sm=document.getElementById('pay-sum'); if(!box||!HP_PAY) return -1;
  const cur=(typeof hpPayCur==='function')?hpPayCur():'usd', px=(typeof hpPxMap==='function')?hpPxMap(cur):hpPxLoad(), rows=HP_PAY.rows, fm=(v,sg)=>(typeof hpCurTxt==='function')?hpCurTxt(v,cur,sg):hpUsdTxt(v,sg); box.textContent=''; let usd=0, got=0, miss=0;
  const tb=document.createElement('table'); tb.className='paytb'; const hd=document.createElement('tr'); for(const k of ['pay_h_at','pay_h_kind','pay_h_evr','pay_h_xah','pay_h_px','pay_h_cur'])  { const th=document.createElement('th'); th.textContent=k==='pay_h_cur'?TF(k,{c:cur.toUpperCase()}):T(k); hd.appendChild(th); } tb.appendChild(hd);
  const G={}; for(const r of rows){ const k=(r.key&&r.kind!=='fail')?'key':r.kind; (G[k]=G[k]||[]).push(r); }
  const cell=(tr,v)=>{ const td=document.createElement('td'); td.textContent=v; tr.appendChild(td); return td; }, when=t=>(typeof fmtTS==='function')?fmtTS(t):new Date(t).toLocaleString();
  for(const k of ['buy','ext','refund','key','fail','other','out','in']){ const a=G[k]; if(!a) continue; let ge=0, gx=0, gu=0, gm=0;
    for(const r of a){ ge+=r.evr; gx+=r.xah; const cu=hpPayUsd(hpPayCost(r),r.at,px); if(cu===null){ gm++; miss++; } else { gu+=cu; usd+=cu; got++; } }
    const gr=document.createElement('tr'); gr.className='grp'+(k==='refund'?' in':''); gr.dataset.k=k; gr.style.cursor='pointer'; gr.title=T('pay_open');
    cell(gr,when(a[0].at)); const lab=cell(gr,'\u25B8 '+hpPayKind(a[0])+TF('pay_n',{n:a.length})); cell(gr,ge?hpSigned(ge,4):''); cell(gr,gx?hpSigned(gx,6):''); cell(gr,'');   cell(gr,gm===a.length?fm(null):fm(gu,true)); tb.appendChild(gr);
    const det=[]; for(const r of a){ const tr=document.createElement('tr'); tr.className='det'+(k==='refund'?' in':''); tr.style.display='none'; const u=hpPayUsd({evr:r.evr,xah:r.xah},r.at,px);
      for(const v of [when(r.at),'\u3000'+hpPayKind(r),r.evr?hpSigned(r.evr,4):'',r.xah?hpSigned(r.xah,6):'',(typeof hpPxTxt==='function')?hpPxTxt({evr:r.evr,xah:r.xah},r.at,px,cur):'',fm(u,true)]) cell(tr,v);   det.push(tr); tb.appendChild(tr); }
    gr.addEventListener('click',()=>{ const open=det[0]&&det[0].style.display==='none'; for(const d of det) d.style.display=open?'':'none'; lab.textContent=(open?'\u25BE ':'\u25B8 ')+hpPayKind(a[0])+TF('pay_n',{n:a.length}); }); }
  if(rows.length) box.appendChild(tb); else box.textContent=T('pay_none');
  if(sm){ const s=hpPaySum(rows); sm.textContent=(!rows.length?'':TF('pay_sum',{evr:hpNum(s.evr,4),xah:hpNum(s.xah,6),n:s.n})+(got?TF(miss?'pay_sum_usd_part':'pay_sum_usd',{usd:fm(usd,false),m:miss}):'')+((got&&typeof hpPxDays==='function')?'\n'+TF('pay_px_used',{d:hpPxDays(rows,px)}):'')  )+((HP_PAY&&HP_PAY.other)?(rows.length?'\n':'')+TF('pay_other',{n:HP_PAY.other}):'')+((rows.length&&!got&&typeof hpPxSt==='function'&&hpPxSt().on)?'\n'+T('pay_px_nocur'):''); try{ sm.style.whiteSpace='pre-line'; }catch(e){} }
  return rows.length; }
async function hpPayRead(quiet){ const a=hpLeaseAcct(); if(!a||HP_PAY_BUSY) return false; HP_PAY_BUSY=true; if(!quiet) hpPaySt(T('pay_busy'));
  try{ const got=await hpXahauSess(async q=>{ const all=[]; let marker=null, pages=0; do{ const r=await q(Object.assign({command:'account_tx',account:a,limit:200},marker?{marker:marker}:{})); pages++; for(const e of ((r&&r.transactions)||[])) all.push(e); marker=(r&&r.marker)||null; } while(marker&&pages<HP_LG_PAGES); return {all:all,more:!!marker}; },60000);
    const pr=hpPayParse(got.all,a); HP_PAY={acct:a,rows:pr.filter(r=>r.lease),other:pr.filter(r=>!r.lease).length,more:got.more,at:Date.now()};
    try{ let ev=0; for(const e of got.all){ const x=(e&&(e.tx||e.tx_json))||{}, t=(Number(x.date)+HP_LG_EPOCH)*1000; if(t>ev) ev=t; } const P=(typeof hpPxSt==='function')?hpPxSt():null; if(P&&ev>(Number(P.evAt)||0)){ P.evAt=ev; saveID(); } }catch(e){}
    HP_PAY_FAIL=0; if(typeof hpPayDrawAll==='function') hpPayDrawAll(); else hpPayDraw(); if(!quiet||got.more) hpPaySt(got.more?TF('pay_more',{n:got.all.length}):''); return true;
  }catch(e){ HP_PAY_FAIL=Date.now(); if(!quiet) hpPaySt(TF('pay_fail',{why:String((e&&e.message)||e)}),true); return false; } finally{ HP_PAY_BUSY=false; } }

const HP_PAY_CUR_TOP=['jpy','usd','eur','gbp','krw','cny','twd','hkd','sgd','aud','cad','chf','inr'];
const HP_PAY_CURS=HP_PAY_CUR_TOP.concat(['aed','ars','bdt','bhd','bmd','brl','clp','czk','dkk','gel','huf','idr','ils','kwd','lkr','mmk','mxn','myr','ngn','nok','nzd','php','pkr','pln','rub','sar','sek','thb','try','uah','vnd','zar']);
const HP_PAY_STALE=30*60e3, HP_PAY_RETRY=5*60e3, HP_PX_QUIET=6*3600e3, HP_PX_MINGAP=20*3600e3, HP_PX_W0=5*60e3, HP_PX_W1=60*60e3, HP_PC_KEY='p2p_pxc';
let HP_PAY_FAIL=0;
function hpPcLoad(){ try{ const s=(typeof hpHGet==='function')?hpHGet(HP_PC_KEY):null, o=s?JSON.parse(s):{}; return (o&&typeof o==='object'&&!Array.isArray(o))?o:{}; }catch(e){ return {}; } }
function hpPcSave(o){ try{ if(typeof hpHSet==='function') hpHSet(HP_PC_KEY,JSON.stringify(o)); }catch(e){} }
function hpPxMap(cur){
  const m={}, put=(d,k,v)=>{ if(Number(v)>0) (m[d]=m[d]||{})[k]=Number(v); };
  try{ if(cur==='usd'){ const old=hpPxLoad(); for(const d of Object.keys(old)) for(const k of ['evr','xah']) put(d,k,old[d]&&old[d][k]); }
    const o=hpPcLoad()[cur]||{}; for(const k of ['evr','xah']){ const t=(o[k]&&typeof o[k]==='object')?o[k]:{}; for(const d of Object.keys(t)) put(d,k,t[d]); } }catch(e){}
  return m; }
function hpPayLoc(){ try{ return (typeof curLang==='function'&&curLang()==='en')?'en-US':'ja-JP'; }catch(e){ return 'ja-JP'; } }
function hpPayCur(){ try{ const c=(typeof ID!=='undefined'&&ID)?String(ID.payCur||''):''; if(HP_PAY_CURS.indexOf(c)>=0) return c; }catch(e){} return hpPayLoc()==='ja-JP'?'jpy':'usd'; }
function hpCurTxt(v,cur,sign){
  if(v===null||v===undefined||!isFinite(v)) return '\u2014'; const a=Math.abs(Number(v)), C=String(cur||'usd').toUpperCase(); let s='';
  try{ const dig=new Intl.NumberFormat('en-US',{style:'currency',currency:C}).resolvedOptions().maximumFractionDigits;
    s=(a>0&&a<Math.pow(10,-dig))?new Intl.NumberFormat(hpPayLoc(),{style:'currency',currency:C,maximumSignificantDigits:2}).format(a):new Intl.NumberFormat(hpPayLoc(),{style:'currency',currency:C,minimumFractionDigits:dig,maximumFractionDigits:dig}).format(a); }
  catch(e){ s=C+' '+(a<0.01&&a>0?String(Number(a.toPrecision(2))):a.toFixed(2)); }
  return (sign?(v>0?'+':v<0?'\u2212':''):'')+s; }
function hpCurSym(cur){ try{ const p=new Intl.NumberFormat(hpPayLoc(),{style:'currency',currency:String(cur).toUpperCase()}).formatToParts(1).find(x=>x.type==='currency'); return p?p.value:String(cur).toUpperCase()+' '; }catch(e){ return String(cur).toUpperCase()+' '; } }
function hpCurDp(cur){ try{ return new Intl.NumberFormat('en-US',{style:'currency',currency:String(cur).toUpperCase()}).resolvedOptions().maximumFractionDigits+2; }catch(e){ return 4; } }
function hpPayCurName(c){ try{ const n=new Intl.DisplayNames([hpPayLoc()],{type:'currency'}).of(c.toUpperCase()); return n?n+'（'+c.toUpperCase()+'）':c.toUpperCase(); }catch(e){ return c.toUpperCase(); } }
function hpPayCurUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const sel=document.getElementById('pay-cur'); if(!sel) return false; const cur=hpPayCur();
    if(!sel.options||!sel.options.length||sel.dataset.loc!==hpPayLoc()){ sel.textContent=''; const loc=hpPayLoc(), nm=c=>({c:c,n:hpPayCurName(c)}), rest=HP_PAY_CURS.filter(c=>HP_PAY_CUR_TOP.indexOf(c)<0).map(nm).sort((a,b)=>a.n.localeCompare(b.n,loc));
      for(const [k,L] of [['pay_cur_g1',HP_PAY_CUR_TOP.map(nm)],['pay_cur_g2',rest]]){ const g=document.createElement('optgroup'); g.label=T(k); for(const x of L){ const o=document.createElement('option'); o.value=x.c; o.textContent=x.n; g.appendChild(o); } sel.appendChild(g); }
      sel.dataset.loc=loc; }
    sel.value=cur; return true; }catch(e){ return false; } }
function hpPayCurSet(c){ c=String(c||'').toLowerCase(); if(HP_PAY_CURS.indexOf(c)<0||typeof ID==='undefined'||!ID) return false; ID.payCur=c; try{ saveID(); }catch(e){} hpLog('支払い記録の通貨を '+c.toUpperCase()+' にした'); hpPaySt(''); hpPayDrawAll(); return true; }

function hpPxSt(){ if(typeof ID==='undefined'||!ID) return {}; if(!ID.px||typeof ID.px!=='object'||Array.isArray(ID.px)) ID.px={}; return ID.px; }
function hpPxAcctWatch(now){
  try{ if(typeof ID==='undefined'||!ID) return false; const a=((typeof hpLeaseAcct==='function')&&hpLeaseAcct())||'', x=((typeof hpXmAcct==='function')&&hpXmAcct())||'', k=a+'|'+x, P=hpPxSt();
    if(P.acct===undefined){ P.acct=k; saveID(); return false; }
    if(P.acct!==k){ P.acct=k; if(a||x){ P.regAt=now||Date.now(); hpLog('借りた口座・支払う口座が替わった。値段は 6 時間取り寄せない'); } saveID(); return true; } return false; }catch(e){ return false; } }
function hpPxQuietUntil(now){ now=now||Date.now(); const P=hpPxSt(), ev=Math.max(Number(P.evAt)||0,Number(P.regAt)||0); return (ev&&now<ev+HP_PX_QUIET)?ev+HP_PX_QUIET:0; }
function hpPxOps(){ try{ return !!((typeof HP_RENT_BUSY!=='undefined'&&HP_RENT_BUSY)||(typeof HP_RENT_J!=='undefined'&&HP_RENT_J)||(typeof HP_OB_RE!=='undefined'&&HP_OB_RE)||(typeof HP_MOVE!=='undefined'&&HP_MOVE)||(typeof ID!=='undefined'&&ID&&(ID.rentJob||ID.moveJob))); }catch(e){ return false; } }
function hpPayWhen(t){ const d=new Date(Number(t)), p=n=>String(n).padStart(2,'0'); return (d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes()); }
async function hpPxGet(why){
  if(HP_PX_BUSY) return false; if(!HP_PX_FETCH){ hpPaySt(T('pay_px_none'),true); return false; } const cur=hpPayCur(); HP_PX_BUSY=true; hpPayBtns(); hpPaySt(TF('pay_px_busy',{c:cur.toUpperCase()}));
  try{ const r=await hpPxRange(cur); const P=hpPxSt(); P.last=Date.now(); P.fail=0; try{ saveID(); }catch(e){}
    hpLog('値段を取り寄せた（'+(why==='auto'?'毎日の取り寄せ':'押した')+'・'+cur.toUpperCase()+'・'+r.n+' 日分）'); hpPayDrawAll(); hpPaySt(TF('pay_px_got',{c:cur.toUpperCase(),n:r.n})); return true; }
  catch(e){ const w=String((e&&e.message)||e); hpLog('値段を取り寄せられない（'+w+'）'); hpPaySt(TF('pay_px_err',{why:w}),true); return false; }
  finally{ HP_PX_BUSY=false; hpPayBtns(); } }
async function hpPxPress(){
  if(HP_PX_BUSY) return false; const now=Date.now(); hpPxAcctWatch(now);
  if(!HP_PAY||now-(Number(HP_PAY.at)||0)>10*60e3){ try{ await hpPayRead(true); }catch(e){} }
  const u=hpPxQuietUntil(Date.now()); if(u){ hpPaySt(TF('pay_px_wait',{t:hpPayWhen(u)})); hpPayBtns(); return false; }
  if(hpPxOps()){ hpPaySt(T('pay_px_ops')); return false; }
  const P=hpPxSt(); if(!P.on){ P.on=1; P.auto=1; P.onAt=now; try{ saveID(); }catch(e){} hpLog('値段の取り寄せを始めた（押した。このあとは 1 日 1 回、毎日ずらした時刻に取る）'); }
  return hpPxGet('button'); }
function hpPxAutoSet(on){ const P=hpPxSt(); if(!P.on) return false; P.auto=on?1:0; try{ saveID(); }catch(e){} hpLog(on?'値段の毎日の取り寄せを入れた':'値段の毎日の取り寄せを切った'); hpPayBtns(); return true; }
async function hpPxTick(now){
  try{ if(typeof ID==='undefined'||!ID||HP_PX_BUSY) return ''; now=now||Date.now(); hpPxAcctWatch(now); const P=hpPxSt();
    if(!P.on||P.auto===0||!((typeof hpLeaseAcct==='function')&&hpLeaseAcct())) return 'off';
    if(Number(P.last)&&now-Number(P.last)<HP_PX_MINGAP) return 'done';
    const day=Math.floor(now/864e5); let pl=P.plan; if(!pl||pl.day!==day){ pl=P.plan={day:day,at:day*864e5+Math.floor(Math.random()*864e5),n:0}; saveID(); }
    if(now<pl.at) return 'wait';
    if(!pl.go){ pl.go=now+HP_PX_W0+Math.floor(Math.random()*(HP_PX_W1-HP_PX_W0)); saveID(); return 'wait'; }
    if(now<pl.go) return 'wait';
    if(Number(pl.n)>=3) return 'done';
    if(hpPxOps()) return 'busy';
    if(!HP_PAY||now-(Number(HP_PAY.at)||0)>10*60e3){ try{ await hpPayRead(true); }catch(e){} }
    const u=hpPxQuietUntil(Date.now()); if(u){ pl.go=u+HP_PX_W0+Math.floor(Math.random()*(HP_PX_W1-HP_PX_W0)); saveID(); return 'quiet'; }
    pl.n=(Number(pl.n)||0)+1; saveID(); const ok=await hpPxGet('auto');
    if(!ok){ pl.go=Date.now()+3600e3+Math.floor(Math.random()*3600e3); saveID(); return 'fail'; } return 'got'; }catch(e){ return ''; } }

function hpPayVis(){ try{ const c=document.getElementById('post-pay'), t=document.getElementById('p-post'); return !!(c&&c.style.display!=='none'&&t&&t.classList&&t.classList.contains('on')); }catch(e){ return false; } }
function hpPayAuto(now){
  try{ if(HP_PAY_BUSY||!hpPayVis()) return ''; const a=(typeof hpLeaseAcct==='function')?hpLeaseAcct():''; if(!a) return ''; now=now||Date.now();
    if(HP_PAY&&HP_PAY.acct===a&&now-(Number(HP_PAY.at)||0)<HP_PAY_STALE) return 'fresh'; if(HP_PAY_FAIL&&now-HP_PAY_FAIL<HP_PAY_RETRY) return '';
    hpPayRead(true).catch(()=>{}); return 'read'; }catch(e){ return ''; } }

function hpPayParts(r){
  const out=[], fee=Number(r.fee)||0, xa=(Number(r.xah)||0)+fee;
  if(r.kind==='buy') out.push({k:'buy',evr:-(Number(r.evr)||0),xah:-xa});
  else if(r.kind==='ext') out.push({k:'ext',evr:-(Number(r.evr)||0),xah:-xa});
  else if(r.kind==='refund') out.push({k:'ref',evr:-(Number(r.evr)||0),xah:-(Number(r.xah)||0)});
  if(fee&&r.kind!=='refund') out.push({k:'fee',evr:0,xah:fee});
  return out; }
function hpPayYm(t){ const d=new Date(Number(t)); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function hpPayMonths(rows,px){
  const M={}, z=()=>({evr:0,xah:0,v:0,miss:0});
  for(const r of (rows||[])){ const key=hpPayYm(r.at), m=M[key]||(M[key]={ym:key,n:0,miss:0,buy:z(),ext:z(),ref:z(),fee:z(),tot:z()}), p=px[hpPxDay(r.at)]||{}; let rm=false; m.n++;
    for(const q of hpPayParts(r)){ const c=m[q.k]; c.evr+=q.evr; c.xah+=q.xah; m.tot.evr+=q.evr; m.tot.xah+=q.xah;
      let v=0, ok=true; if(q.evr){ if(p.evr>0) v+=q.evr*p.evr; else ok=false; } if(q.xah){ if(p.xah>0) v+=q.xah*p.xah; else ok=false; }
      if(ok){ c.v+=v; m.tot.v+=v; } else { c.miss++; m.tot.miss++; rm=true; } }
    if(rm) m.miss++; }
  return Object.keys(M).sort().reverse().map(k=>M[k]); }
function hpPayCoin(evr,xah){ const a=[]; if(Math.abs(evr)>1e-12) a.push((evr<0?'\u2212':'')+hpNum(evr,4)+' EVR'); if(Math.abs(xah)>1e-12) a.push((xah<0?'\u2212':'')+hpNum(xah,6)+' XAH'); return a.join('\u30FB'); }
function hpPayMonDraw(){
  if(typeof document==='undefined'||!document.getElementById) return -1; const box=document.getElementById('pay-mon'); if(!box) return -1; box.textContent=''; if(!HP_PAY||!HP_PAY.rows||!HP_PAY.rows.length) return 0;
  const cur=hpPayCur(), M=hpPayMonths(HP_PAY.rows,hpPxMap(cur)); let part=false;
  const h=document.createElement('div'); h.className='note'; h.style.cssText='color:var(--ink);font-weight:600;margin-top:4px'; h.textContent=TF('pay_m_title',{c:cur.toUpperCase()}); box.appendChild(h);
  const tb=document.createElement('table'); tb.className='paytb'; tb.id='pay-mon-tb'; const hd=document.createElement('tr');
  for(const k of ['pay_m_ym','pay_m_buy','pay_m_ext','pay_m_ref','pay_m_fee','pay_m_tot','pay_m_n']){ const th=document.createElement('th'); th.textContent=T(k); hd.appendChild(th); } tb.appendChild(hd);
  const sub=(td,t)=>{ if(!t) return; const d=document.createElement('div'); d.textContent=t; d.style.cssText='font-size:11px;color:var(--dim);white-space:nowrap'; td.appendChild(d); };
  for(const m of M){ const tr=document.createElement('tr'); const c0=document.createElement('td'); c0.textContent=m.ym; tr.appendChild(c0);
    for(const k of ['buy','ext','ref','fee','tot']){ const c=m[k], td=document.createElement('td'), any=Math.abs(c.evr)>1e-12||Math.abs(c.xah)>1e-12;
      if(!any||(c.miss&&!c.v)) td.textContent='\u2014'; else { td.textContent=hpCurTxt(c.v,cur,c.v<0)+(c.miss?'\uFF0A':''); if(c.miss) part=true; }
      if(k==='tot') td.style.fontWeight='600'; sub(td,any?hpPayCoin(c.evr,c.xah):''); tr.appendChild(td); }
    const cn=document.createElement('td'); cn.textContent=String(m.n); tr.appendChild(cn); tb.appendChild(tr); }
  box.appendChild(tb); const nt=document.createElement('div'); nt.className='note'; nt.style.cssText='white-space:pre-line'; nt.textContent=T('pay_m_nt')+(part?'\n'+T('pay_m_part'):''); box.appendChild(nt);
  return M.length; }
function hpPayDrawAll(){ let n=-1; try{ n=hpPayDraw(); }catch(e){} try{ hpPayMonDraw(); }catch(e){} try{ hpPayCurUi(); hpPayBtns(); }catch(e){} return n; }
function hpPayBtns(){
  try{ if(typeof document==='undefined'||!document.getElementById) return ''; const b=document.getElementById('btn-pay-px'), nt=document.getElementById('pay-px-nt'), ar=document.getElementById('pay-auto-row'), ac=document.getElementById('pay-px-auto'), P=hpPxSt(), u=hpPxQuietUntil();
    if(b) b.disabled=!!(HP_PX_BUSY||u);
    if(nt) nt.textContent=u?TF('pay_px_wait',{t:hpPayWhen(u)}):(P.on?'':T('pay_px_first'));
    if(ar&&ar.style) ar.style.display=P.on?'':'none'; if(ac) ac.checked=!!(P.on&&P.auto!==0);
    return u?'wait':'ok'; }catch(e){ return ''; } }

function hpCsvCell(v){ const s=String(v===null||v===undefined?'':v); return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s; }
function hpCsvText(rows){ return '\uFEFF'+rows.map(r=>r.map(hpCsvCell).join(',')).join('\r\n')+'\r\n'; }
function hpCsvNum(v,dp){ if(v===null||v===undefined||!isFinite(v)) return ''; let s=Number(v).toFixed(dp); if(s.indexOf('.')>=0) s=s.replace(/0+$/,'').replace(/\.$/,''); return (s==='-0'||/^-0$/.test(s))?'0':s; }
function hpPayCsvRows(kind){
  const cur=hpPayCur(), C=cur.toUpperCase(), px=hpPxMap(cur), rows=(HP_PAY&&HP_PAY.rows)||[], dp=hpCurDp(cur), out=[];
  if(kind==='m'){ out.push([T('pay_c_ym'),TF('pay_c_buy',{u:'EVR'}),TF('pay_c_ext',{u:'EVR'}),TF('pay_c_ref',{u:'EVR'}),TF('pay_c_fee',{u:'XAH'}),TF('pay_c_buy',{u:C}),TF('pay_c_ext',{u:C}),TF('pay_c_ref',{u:C}),TF('pay_c_fee',{u:C}),TF('pay_c_tot',{u:C}),T('pay_c_n'),T('pay_c_miss')]);
    for(const m of hpPayMonths(rows,px)){ const v=c=>c.miss?'':hpCsvNum(c.v,dp); out.push([m.ym,hpCsvNum(m.buy.evr,6),hpCsvNum(m.ext.evr,6),hpCsvNum(m.ref.evr,6),hpCsvNum(m.fee.xah,6),v(m.buy),v(m.ext),v(m.ref),v(m.fee),v(m.tot),m.n,m.miss]); }
    return out; }
  const p2=n=>String(n).padStart(2,'0'), loc=t=>{ const d=new Date(Number(t)); return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate())+' '+p2(d.getHours())+':'+p2(d.getMinutes())+':'+p2(d.getSeconds()); }, ud=t=>{ const d=new Date(Number(t)); return d.getUTCFullYear()+'-'+p2(d.getUTCMonth()+1)+'-'+p2(d.getUTCDate()); };
  out.push([T('pay_c_at'),T('pay_c_kind'),'EVR','XAH',T('pay_c_day'),TF('pay_c_pe',{u:C}),TF('pay_c_ph',{u:C}),TF('pay_c_cost',{u:C}),T('pay_c_hash'),T('pay_c_acct')]);
  for(const r of rows.slice().sort((a,b)=>a.at-b.at)){ const p=px[hpPxDay(r.at)]||{}; let v=0, ok=true; for(const q of hpPayParts(r)){ if(q.evr){ if(p.evr>0) v+=q.evr*p.evr; else ok=false; } if(q.xah){ if(p.xah>0) v+=q.xah*p.xah; else ok=false; } }
    out.push([loc(r.at),hpPayKind(r),hpCsvNum(r.evr,6),hpCsvNum(r.xah,6),ud(r.at),p.evr>0?hpCsvNum(p.evr,8):'',p.xah>0?hpCsvNum(p.xah,8):'',ok?hpCsvNum(v,dp):'',r.hash,(HP_PAY&&HP_PAY.acct)||'']); }
  return out; }
async function hpPayCsvSave(kind){
  if(!HP_PAY||!HP_PAY.rows||!HP_PAY.rows.length){ hpPaySt(T('pay_csv_none'),true); return false; }
  const d=new Date(), p2=n=>String(n).padStart(2,'0'), stamp=d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate()), name='handpost-lease-'+(kind==='m'?'monthly':'detail')+'-'+stamp+'.csv';
  const blob=new Blob([hpCsvText(hpPayCsvRows(kind))],{type:'text/csv;charset=utf-8'}); hpLog('支払い記録を CSV にした（'+(kind==='m'?'月ごと':'明細')+'・'+name+'）');
  try{ if(typeof hpBlobDownload==='function') return await hpBlobDownload(blob,name); }catch(e){} return false; }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'&&typeof setInterval==='function'){ setInterval(()=>{ try{ hpPayAuto(); }catch(e){} },3000); setInterval(()=>{ hpPxTick().catch(()=>{}); },60e3); setTimeout(()=>{ hpPxTick().catch(()=>{}); },20e3); } }catch(e){}

function hpLeaseAuto(){
  try{ if(!hpLeaseAcct()||HP_LG_BUSY) return false; if(typeof hpSceneOnline==='function'&&!hpSceneOnline()) return false;
    const since=Date.now()-HP_LG_AT, rly=(typeof hpScnSt==='function')?hpScnSt().rly:'', gone=!!(ID.lease&&ID.lease.gone);
    if(since>=HP_LGR_EVERY||(rly==='err'&&since>=HP_LG_ERR)||(gone&&rly==='ok'&&since>=60e3)){ hpLeaseFromLedger(rly==='err'?'err':(gone?'back':'every')); return true; } }catch(e){} return false; }
function hpLeaseCheck(){
  const st=hpLeaseState(); if(!st) return; let day=''; try{ day=new Date(hpLeaseExp()).toISOString().slice(0,10); }catch(e){ day=String(hpLeaseExp()); } const key='lease:'+st+':'+day; if(HP_LEASE_NOTED===key) return; HP_LEASE_NOTED=key;
  try{ if(typeof hpNote==='function') hpNote('lease',{t:hpLeaseText(),st:st},key); }catch(e){}
}

const HP_NUDGE_MIN=2;
function hpNudgePick(h){ let n=0, last=null; for(let i=h.length-1;i>=0;i--){ const m=h[i]; if(!m) continue; if(m.d==='p') break; if(m.d!=='s'||m.x) continue; if(m.k) break; if(!m.hp&&!m.g) continue; if(!last) last=m; n++; } return (last&&!last.g&&n>=HP_NUDGE_MIN)?last:null; }
function hpNudgeIos(peer){ try{ const c=contacts().find(x=>x.address===peer), dk=c&&c.card&&c.card.devKinds; return !!dk&&typeof dk==='object'&&Object.values(dk).some(v=>v==='iphone'); }catch(e){ return false; } }
function hpNudge(peer){ if(typeof document==='undefined'||typeof document.querySelectorAll!=='function') return '';
  let m=null, t=''; try{ if(peer&&!(typeof hpReadOff==='function'&&hpReadOff())){ m=hpNudgePick(histLoad(peer)); if(m){ const name=(typeof nickOf==='function')?nickOf(peer):String(peer); t=TF(hpNudgeIos(peer)?'nudge_ios':'nudge',{name:name}); } } }catch(e){ m=null; }
  const olds=Array.from(document.querySelectorAll('#msgs .hpnudge')); const key=m?String(m.ts):'';
  for(const o of olds){ if(!m||o.dataset.ts!==key||o.textContent!==t) o.remove(); else return t; }
  if(!m) return ''; const el=(typeof findMsgEl==='function')?findMsgEl(m.ts):null; if(!el||!el.parentNode) return '';
  const d=document.createElement('div'); d.className='m sys hpnudge'; d.dataset.ts=key; d.textContent=t; el.parentNode.insertBefore(d, el.nextSibling); return t; }

let HP_CS_RUN={}, HP_CS_WK=null; const HP_CS_NEWMS=15000, HP_CS_HOLDST={walk:1,posted:1,opened:1,hand:1,handed:1};
let HP_CS_WALK_PX=80;
function hpCsWalkDur(dist){ return Math.max(3000,Math.round(Number(dist||0)*1000/HP_CS_WALK_PX)); }
function hpCsWalkRun(sc,key,from,to,loop){ if(!sc||typeof sc.querySelector!=='function') return ''; const rb=sc.querySelector('.rb'); if(!rb) return ''; const cur=rb.__hpWalk; if(cur&&cur.key===key) return 'same'; if(cur&&cur.a){ try{ cur.a.cancel(); }catch(e){} } rb.__hpWalk=null; if(!key||typeof rb.animate!=='function') return '';
  const dur=hpCsWalkDur(to-from); const a=rb.animate([{transform:'translateX('+from+'px)'},{transform:'translateX('+to+'px)',offset:loop?0.92:1},{transform:'translateX('+to+'px)'}],{duration:loop?Math.round(dur/0.92):dur,iterations:loop?Infinity:1,fill:loop?'none':'forwards'}); rb.__hpWalk={key:key,a:a}; return 'run'; }
function hpCsHold(peer,s){ const now=Date.now(); let m=null; try{ m=hpCsLastSent(peer); }catch(e){} const k=m?(peer+'|'+m.ts):'';
  if(!HP_CS_WK||HP_CS_WK.k!==k){ if(HP_CS_WK&&HP_CS_WK.tm) clearTimeout(HP_CS_WK.tm); HP_CS_WK={k:k,t0:0}; if(m&&!m.x&&now-Number(m.ts||0)<HP_CS_NEWMS&&HP_CS_HOLDST[s]){ const hand=(s==='hand'||s==='handed'), run=HP_CS_RUN['d-peer']||0, to=hand?64:94; Object.assign(HP_CS_WK,{t0:now,st:hand?'hand_walk':'walk',from:-run,to:to,dur:hpCsWalkDur(run+to)}); } }
  const w=HP_CS_WK; if(!w.t0||!HP_CS_HOLDST[s]) return {st:s,walk:null}; const el=now-w.t0; const again=ms=>{ if(!w.tm) w.tm=setTimeout(()=>{ w.tm=null; hpCsRefresh(); },Math.max(40,ms)); };
  if(el<w.dur){ again(w.dur-el+40); return {st:(s==='walk')?'walk':w.st,walk:w}; }
  if(w.st==='hand_walk'&&(s==='hand'||s==='handed')&&el<w.dur+HP_CS_JOY_MS){ again(w.dur+HP_CS_JOY_MS-el+40); return {st:'handed',walk:null}; }
  return {st:s,walk:null}; }
let HP_CS_FITW='', HP_CS_RUNCSS='';
function hpCsFit(){ if(typeof document==='undefined'||!document.getElementById) return; let aw=0; try{ const top=document.getElementById('hdr-top'), acts=document.getElementById('hdr-actions'); const nar=(typeof hpHdrNarrow==='function')&&hpHdrNarrow();   aw=(acts&&acts.offsetWidth&&!nar)?acts.offsetWidth+12:0; if(top) top.style.paddingRight=aw?(aw-2)+'px':''; }catch(e){}
  const p=document.getElementById('path'), pw=p?Math.round(p.clientWidth||0):0; if(!pw) return; const key=pw+'|'+aw; if(key===HP_CS_FITW) return; HP_CS_FITW=key; const w=Math.max(0,pw-aw);
  const run=HP_CS_RUN;
  for(const [id,base,hh,d0,rx] of [['d-rly',120,40,2.6,22],['d-peer',220,44,2.8,0]]){ const sc=document.getElementById(id), sv=(sc&&typeof sc.querySelector==='function')?sc.querySelector('svg'):null; const W=Math.max(base,Math.round(w*hh/42)), dx=W-base; run[id]=dx+rx; if(!sv) continue; sv.setAttribute('viewBox','0 0 '+W+' '+hh); try{ sv.style.width=Math.round(W*42/hh)+'px'; }catch(e){} const g=sv.querySelector('.stg'); if(g) g.setAttribute('transform','translate('+dx+',0)'); try{ sc.style.setProperty('--run',dx+'px'); sc.style.setProperty('--wd',(d0+dx/120).toFixed(2)+'s'); }catch(e){} }

  HP_CS_RUNCSS='@keyframes hp-run-h{0%{transform:translateX(-'+run['d-rly']+'px)}92%,100%{transform:translateX(6px)}} @keyframes hp-run-c{0%{transform:translateX(-'+run['d-peer']+'px)}92%,100%{transform:translateX(94px)}} @keyframes hp-run-d{0%{transform:translateX(-'+run['d-peer']+'px)}92%,100%{transform:translateX(114px)}}';
  try{ if(document.head&&typeof document.createElement==='function'){ let st=document.getElementById('hp-run-css'); if(!st){ st=document.createElement('style'); st.id='hp-run-css'; document.head.appendChild(st); } st.textContent=HP_CS_RUNCSS; } }catch(e){} }

function hpPostHave(){ try{ if(typeof ID==='undefined'||!ID) return false; if(localStorage.getItem('p2p_post')) return true; if(typeof POST!=='undefined'&&POST&&POST.up) return true; return hpLeaseExp()>0; }catch(e){ return false; } }
function hpPostHost(){ try{ const u=new URL(hpPostUrl()); return u.hostname+(u.port?':'+u.port:''); }catch(e){ return ''; } }
function hpPostUi(){ if(typeof document==='undefined'||!document.getElementById) return ''; const $i=id=>document.getElementById(id), Tt=k=>(typeof T==='function')?T(k):k; const hasId=(typeof ID!=='undefined'&&!!ID), have=hpPostHave();
  const show=(id,on)=>{ const e=$i(id); if(e&&e.style) e.style.display=on?'':'none'; }; const lodge=typeof hpBfOn==='function'&&hpBfOn();   show('post-state',!lodge); show('pt-lease',have); show('post-renew',have&&!lodge); show('post-move',have&&!lodge); show('post-spare',have&&!lodge); show('post-rent',hasId&&!have&&!lodge); show('post-pay',hasId&&have&&typeof hpLeaseAcct==='function'&&!!hpLeaseAcct());   if(lodge) show('post-pay',false);
  show('post-hosts',hasId); try{ if(hasId&&typeof hpHsAuto==='function') hpHsAuto(); }catch(e){}   show('post-xm',hasId);   try{ if(typeof hpXmUi==='function') hpXmUi(); }catch(e){} if(typeof hpXmQuiet==='function'&&hpXmQuiet()){ show('post-xm',false); show('post-hosts',false); }   try{ if(typeof hpRentUi==='function') hpRentUi(); }catch(e){}   try{ if(typeof hpAgainUi==='function') hpAgainUi(); }catch(e){}   try{ if(typeof hpOldUi==='function') hpOldUi(); }catch(e){}   try{ const pm=$i('pt-mon'); if(pm) pm.textContent=(have&&typeof hpMonText==='function'&&typeof hpMonHost==='function')?hpMonText(hpMonHost(hpPostUrl())):'—'; }catch(e){}   const hs=$i('pt-host'), st=$i('pt-status'); if(hs) hs.textContent=!hasId?Tt('pt_noid'):(have?(hpPostHost()||'—'):Tt('pt_none'));
  if(st){ let k=''; try{ k=(have&&typeof hpSceneKey==='function')?hpSceneKey():''; }catch(e){} st.textContent=!k?'—':(k==='nd_post_err_lease'&&typeof TF==='function')?TF(k,{t:hpLeaseText()}):Tt(k); }
  return (hasId?'id':'noid')+'|'+(have?'have':'none'); }
function hpPostTodo(){ try{ alert((typeof T==='function')?T('pt_todo'):'pt_todo'); }catch(e){} }
function hpCsRender(){
  try{ const pp=document.getElementById('p-post'); if(pp&&pp.classList&&pp.classList.contains('on')) hpPostUi(); }catch(e){}
  try{ hpCsFit(); }catch(e){}
  const mine=(typeof document!=='undefined')?document.getElementById('d-rly'):null, box=(typeof document!=='undefined')?document.getElementById('d-peer'):null; if(!mine||!box) return;
  try{ hpNudge((typeof CONV_OPEN!=='undefined'&&CONV_OPEN&&typeof CURPEER!=='undefined')?CURPEER:null); }catch(e){}
  try{ hpLeaseUi(); hpLeaseCheck(); hpLeaseLine(); }catch(e){}   try{ hpLeaseAuto(); }catch(e){}   try{ if(typeof hpExtNag==='function') hpExtNag(); }catch(e){}   try{ if(typeof hpAgoTick==='function') hpAgoTick(); }catch(e){}
  const rly=(typeof hpScnSt==='function')?hpScnSt().rly:'';
  const peer=(typeof CURPEER!=='undefined')?CURPEER:null, open=(typeof CONV_OPEN!=='undefined')?!!CONV_OPEN:false;
  let chatOn=true; try{ const sec=document.getElementById('p-chat'); if(sec&&sec.classList&&!sec.classList.contains('on')) chatOn=false; }catch(e){}
  const s=(open&&peer&&chatOn&&rly!=='err'&&hpCsOnline())?hpCsState(peer):null;
  hpCsStatusLine((open&&peer&&chatOn)?(hpCsOnline()?s:'offline'):null); try{ hpWideCheck(); }catch(e){}
  hpCsKeepFx(mine);
  try{ const mw=String(mine.className||'').split(/\s+/), rr=HP_CS_RUN['d-rly']||22; hpCsWalkRun(mine,(mw.includes('warn')&&!mw.includes('off'))?'lr'+rr:'',-rr,6,true); }catch(e){}   try{ const mw2=String(mine.className||'').split(/\s+/); hpBotNightTick(mine,mw2.includes('warn')&&!mw2.includes('off')); }catch(e){}
  if(!s||s==='idle') hpDayCs('');
  if(!s||s==='idle'){ if(/^(posted|opened|handed)$/.test(HP_WAY_PREV)) setTimeout(()=>{ hpWayPlay('deliv'); },60); HP_WAY_PREV='';   try{ hpCsWalkRun(box,''); }catch(e){} box.className='scn hid'; mine.classList.remove('hid'); hpCsSym(mine,'mine',hpCsMineSt(mine));   return; }
  const hd=hpCsHold(peer,s), ds=hd.st;   hpDayCs(ds);
  HP_WAY_PREV=ds; if(HP_WAY) hpWayEnd(); hpBotWake(mine);     box.className='scn on '+ds; mine.classList.add('hid'); hpCsSym(box,'peer',ds);   hpCsKeepFx(box);
  try{ const r=HP_CS_RUN['d-peer']||0; if(hd.walk) hpCsWalkRun(box,'n'+hd.walk.k,hd.walk.from,hd.walk.to,false); else if(ds==='walk') hpCsWalkRun(box,'lw'+r,-r,94,true); else if(ds==='hand_walk') hpCsWalkRun(box,'lh'+r,-r,114,true); else hpCsWalkRun(box,''); }catch(e){}
  const cap=document.getElementById('cap-peer'); if(cap) cap.textContent=hpCsCapText(peer,ds);
  try{ const ini=box.querySelector('.pini'); if(ini){ const nm=(typeof nickOf==='function')?nickOf(peer):''; ini.textContent=String(nm||'?').trim().charAt(0).toUpperCase()||'?'; } }catch(e){}
}

const HP_CS_WAITST={road:1,busy:1,full:1,devs:1,offline:1};
function hpCsStatusLine(s){ try{ if(typeof MODE==='undefined'||MODE!=='idle'||typeof T!=='function') return; const st=document.getElementById('status'); if(!st) return; const idle=T('st_idle'), wait=T('st_wait'); if(s&&HP_CS_WAITST[s]){ if(st.textContent===idle) st.textContent=wait; } else if(st.textContent===wait) st.textContent=idle; }catch(e){} }

let HP_WIDE_SIG='';
function hpWideCheck(){ if(typeof document==='undefined'||typeof window==='undefined'||!document.documentElement) return; const de=document.documentElement; const vv=(window.visualViewport&&window.visualViewport.width)||1e9, sw=(window.screen&&window.screen.width)||1e9; const W=Math.min(window.innerWidth||1e9, vv, sw); if(!(W<1e9)) return; if(de.scrollWidth<=W+1&&(window.innerWidth||0)<=W+1) return;
  const out=[]; const all=document.querySelectorAll('body *'); for(let i=0;i<all.length&&out.length<6;i++){ const el=all[i]; let r=null; try{ r=el.getBoundingClientRect(); }catch(e){} if(!r||!r.width||r.right<=W+1) continue; const p=el.parentElement; let pr=null; try{ pr=p?p.getBoundingClientRect():null; }catch(e){} if(pr&&pr.right>W+1&&out.length) continue; out.push((el.tagName||'').toLowerCase()+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):'')+' 右 '+Math.round(r.right)+' 幅 '+Math.round(r.width)); }
  const sig=Math.round(W)+'|'+out.join(','); if(sig===HP_WIDE_SIG) return; HP_WIDE_SIG=sig;
  try{ if(typeof log==='function') log('はみ出し調べ：画面 '+Math.round(W)+' px（innerWidth '+window.innerWidth+'・visualViewport '+Math.round(vv)+'・screen '+sw+'・scrollWidth '+de.scrollWidth+'・clientWidth '+de.clientWidth+'・拡大 '+(((window.visualViewport&&window.visualViewport.scale)||1).toFixed(2))+'）→ '+(out.join(' ／ ')||'要素なし')); }catch(e){} }

const HP_CS_SYM={mine:{'':['○','dim'],warn:['…','amber'],ok:['✓','teal'],err:['!','red'],off:['－','amber']},peer:{walk:['→','amber'],hand_walk:['→','amber'],posted:['✓','teal'],opened:['✓✓','teal'],hand:['⇄','teal'],handed:['✓','teal'],road:['✕','amber'],busy:['≡','amber'],full:['▮','amber'],devs:['…','amber'],wait_line:['…','amber'],offline:['－','red'],lock:['⊘','red'],big:['⊘','red']}};

function hpBotOn(){ try{ return localStorage.getItem('p2p_nobot')==='0'; }catch(e){ return false; } }
function hpBotSet(on){ try{ localStorage.setItem('p2p_nobot',on?'0':'1'); }catch(e){} hpBotApply(); }
function hpBotApply(){ try{ const b=(typeof document!=='undefined')?document.body:null; if(b&&b.classList) b.classList.toggle('nobot',!hpBotOn()); const x=(typeof document!=='undefined'&&document.getElementById)?document.getElementById('hp-bot'):null; if(x) x.checked=hpBotOn(); }catch(e){} hpCsRefresh(); }
function hpCsSym(el,who,st){ try{ if(!el||typeof el.querySelector!=='function') return; const s=el.querySelector('.sym'); if(!s) return; const m=HP_CS_SYM[who]||{}; const v=m[st]||m['']||['·','dim']; s.textContent=v[0]; s.style.color='var(--'+v[1]+')'; }catch(e){} }
function hpCsMineSt(el){ try{ const c=String(el.className||'').split(/\s+/); for(const k of ['off','err','warn','ok']) if(c.includes(k)) return k; }catch(e){} return ''; }
let HP_BOT_CLK=[];
function hpBotPoke(sc){ if(!sc||!sc.classList) return ''; const now=Date.now(); HP_BOT_CLK=HP_BOT_CLK.filter(t=>now-t<2000).concat([now]); const flip=HP_BOT_CLK.length>=5; if(flip) HP_BOT_CLK=[]; const cls=flip?'flip':'jump'; sc.classList.remove('jump','flip'); try{ void sc.offsetWidth; }catch(e){} sc.classList.add(cls); sc.__hpFx={cls:cls,until:Date.now()+(flip?950:600)};   setTimeout(()=>{ try{ sc.classList.remove(cls); }catch(e){} },flip?950:600); return cls; }

const HP_CS_VISIT_MS=3200;
function hpCsVisit(sc){ if(!sc||!sc.classList) return ''; const c=' '+String(sc.className||'')+' '; if(/ (hand|handed|hand_walk) /.test(c)) return 'busy'; if(sc.classList.contains('visit')) return 'again'; sc.classList.remove('jump','flip'); sc.classList.add('visit'); sc.__hpFx={cls:'visit',until:Date.now()+HP_CS_VISIT_MS}; setTimeout(()=>{ try{ sc.classList.remove('visit'); }catch(e){} },HP_CS_VISIT_MS+50); return 'visit'; }
function hpCsKeepFx(sc){ try{ const f=sc&&sc.__hpFx; if(f&&Date.now()<f.until&&sc.classList&&!sc.classList.contains(f.cls)) sc.classList.add(f.cls); }catch(e){} }

let HP_BOT_LAST='', HP_BOT_PET={x:0,dir:0,flips:[]}, HP_BOT_PETAT=0, HP_BOT_TIRE={v:0,at:0}, HP_BOT_DOZE=0, HP_BOT_ANGER={n:0,at:0}, HP_BOT_DRAG=null, HP_BOT_DRAGAT=0;
const HP_BOT_DOZE_MS=45000, HP_BOT_TIRE_MAX=15, HP_BOT_TIRE_DECAY_MS=15000;
function hpBotScene(){ try{ const p=document.getElementById('d-peer'); if(p&&p.classList&&!p.classList.contains('hid')) return p; return document.getElementById('d-rly'); }catch(e){ return null; } }
function hpBotLines(k){ try{ return String(T(k)||'').split('|').filter(Boolean); }catch(e){ return []; } }
function hpBotHour(h){ h=Number(h); if(h>=23||h<5) return 'nap'; if((h>=5&&h<9)||h>=22) return 'sleepy'; return 'day'; }
function hpBotPick(now,rnd){ rnd=rnd||Math.random; const hz=hpBotHour(new Date(now||Date.now()).getHours()); const pool=[['jump',3],['say',4],['bang',2],['wave',2]]; if(hz!=='day') pool.push(['sleepy',5]);
  const c=pool.filter(p=>p[0]!==HP_BOT_LAST); let n=c.reduce((a,p)=>a+p[1],0)*rnd(); for(const p of c){ n-=p[1]; if(n<0) return (HP_BOT_LAST=p[0]); } return (HP_BOT_LAST=c[c.length-1][0]); }
function hpBotSleepyKey(now){ return new Date(now||Date.now()).getHours()<12?'bot_morning':'bot_night'; }
function hpBotTireAdd(n,now){ now=now||Date.now(); const T0=HP_BOT_TIRE; const lost=Math.floor((now-(T0.at||now))/HP_BOT_TIRE_DECAY_MS); T0.v=Math.max(0,T0.v-lost)+n; T0.at=now; if(T0.v>=HP_BOT_TIRE_MAX&&!(HP_BOT_DOZE>now)){ T0.v=0; HP_BOT_DOZE=now+HP_BOT_DOZE_MS; return 'doze'; } return ''; }
function hpBotDozing(now){ return HP_BOT_DOZE>(now||Date.now()); }
function hpBotAngerAdd(now){ now=now||Date.now(); const A=HP_BOT_ANGER; A.n=(now-A.at<30000)?A.n+1:1; A.at=now; return A.n; }
function hpBotFxAt(sc,el){ try{ const path=document.getElementById('path'), rb=el||(sc&&sc.querySelector&&sc.querySelector('.rb')); if(!path||!rb) return null; const pr=path.getBoundingClientRect(), r=rb.getBoundingClientRect(); if(!r.width) return null; return {x:r.left-pr.left+r.width/2, y:r.top-pr.top, w:pr.width, rw:r.width}; }catch(e){ return null; } }
function hpBotFx(sc,cls,text,ms,el){ try{ const at=hpBotFxAt(sc,el), path=document.getElementById('path'); if(!at||!path) return null; const d=document.createElement('span'); d.className='botfx '+cls; d.textContent=text; d.setAttribute('aria-hidden','true'); path.appendChild(d);
  if(cls==='bsay'){ const w=d.offsetWidth||80, gap=at.rw/2+6; let x=(at.x>at.w/2)?at.x-gap-w:at.x+gap; x=Math.max(2,Math.min(x,at.w-w-2)); d.style.left=x+'px'; d.style.top=Math.max(0,at.y)+'px'; }
  else { d.style.left=(at.x-7+(Math.random()*16-8))+'px'; d.style.top=(at.y+2)+'px'; }
  setTimeout(()=>{ try{ d.remove(); }catch(e){} },ms||2400); return d; }catch(e){ return null; } }
function hpBotSay(sc,text,ms,el){ if(!text) return null; try{ const p=document.getElementById('path'); if(p) for(const o of p.querySelectorAll('.botfx.bsay')) o.remove(); }catch(e){} return hpBotFx(sc,'bsay',text,ms||2400,el); }
function hpBotOne(k){ const a=hpBotLines(k); return a.length?a[Math.floor(Math.random()*a.length)]:''; }
function hpBotRb(sc){ try{ return sc&&sc.querySelector?sc.querySelector('.rb'):null; }catch(e){ return null; } }
function hpBotHouse(sc){ try{ return sc.querySelector('.dhit')||sc.querySelector('svg'); }catch(e){ return null; } }
function hpBotNapping(sc){ const rb=hpBotRb(sc); return !!(rb&&rb.classList&&rb.classList.contains('nap')); }
function hpBotReact(sc){ sc=sc||hpBotScene(); if(!sc) return ''; const now=Date.now(); HP_BOT_TOUCH=now;   if(now-HP_BOT_PETAT<500||now-HP_BOT_DRAGAT<400) return 'pet';
  if(sc.id==='d-peer'||hpBotWalking(hpBotRb(sc))) return hpBotWork(sc,now);
  if(hpBotNapping(sc)){ hpBotSay(sc,hpBotOne('bot_nap'),2000,hpBotHouse(sc)); return 'nap'; }
  if(hpBotDozing(now)){ hpBotSay(sc,hpBotOne('bot_zz'),1600); return 'doze'; }
  if(hpBotTireAdd(1,now)==='doze'){ hpBotDozeStart(sc); return 'tired'; }
  if(hpBotPoke(sc)==='flip') return 'flip';
  const k=hpBotPick(now);
  if(k==='say'||k==='wave') hpBotSay(sc,hpBotOne(({say:'bot_say',wave:'bot_wave'})[k]));
  else if(k==='sleepy') hpBotSay(sc,hpBotOne(hpBotSleepyKey(now)));
  else if(k==='bang'){ try{ sc.classList.remove('jump'); sc.classList.add('shake'); setTimeout(()=>{ try{ sc.classList.remove('shake'); }catch(e){} },600); }catch(e){} hpBotSay(sc,hpBotOne('bot_bang'),1600); }
  return k; }
function hpBotDozeStart(sc){ const rb=hpBotRb(sc); try{ if(rb) rb.classList.add('doze'); }catch(e){} hpBotSay(sc,hpBotOne('bot_tired'),2200); hpBotFx(sc,'bzz','💤',2000);
  setTimeout(()=>{ try{ const was=!!(rb&&rb.classList&&rb.classList.contains('doze')); if(rb) rb.classList.remove('doze'); if(was&&!hpBotNapping(sc)) hpBotSay(sc,hpBotOne('bot_wake'),2200); }catch(e){} },HP_BOT_DOZE_MS); }

const HP_BOT_HOLD_MS=800;
function hpBotWalking(rb){ try{ const w=rb&&rb.__hpWalk; return !!(w&&w.a); }catch(e){ return false; } }
function hpBotWake(mine){ try{ if(!hpBotDozing()) return false; HP_BOT_DOZE=0; HP_BOT_TIRE.v=0; const rb=hpBotRb(mine); if(rb&&rb.classList) rb.classList.remove('doze'); return true; }catch(e){ return false; } }
function hpCsWkShift(w,ms){ try{ if(w&&ms>0&&HP_CS_WK&&HP_CS_WK.t0&&w.key==='n'+HP_CS_WK.k){ HP_CS_WK.t0+=ms; return true; } }catch(e){} return false; }
function hpBotHold(rb,ms,now){ const w=rb&&rb.__hpWalk; if(!w||!w.a) return false; now=now||Date.now(); const until=Math.max(now,Number(rb.__hpHoldUntil)||0), end=now+ms; if(end>until) hpCsWkShift(w,end-until); rb.__hpHoldUntil=Math.max(until,end);
  try{ w.a.pause(); }catch(e){ return false; } clearTimeout(rb.__hpHold); rb.__hpHold=setTimeout(()=>{ try{ if(rb.__hpWalk===w&&!(HP_BOT_DRAG&&HP_BOT_DRAG.tug)) w.a.play(); }catch(e){} },rb.__hpHoldUntil-now); return true; }
function hpBotGrumble(sc,rb,now,k1){ const n=hpBotAngerAdd(now); if(n>=3){ try{ rb.classList.add('angry'); setTimeout(()=>{ try{ rb.classList.remove('angry'); }catch(_){} },1500); }catch(e){} hpBotFx(sc,'bangry','💢',1600); hpBotSay(sc,hpBotOne('bot_work_angry'),2000); return 'angry'; } hpBotSay(sc,hpBotOne(k1),1600); return 'grumble'; }
function hpBotWork(sc,now){ const rb=hpBotRb(sc); if(!rb) return '';
  if(hpBotWalking(rb)){ hpBotHold(rb,HP_BOT_HOLD_MS,now); return hpBotGrumble(sc,rb,now,'bot_work')==='angry'?'angry':'hold'; }
  if(hpBotPoke(sc)==='flip') return 'flip';
  const k=hpBotPick(now); if(k==='bang'){ try{ sc.classList.remove('jump'); sc.classList.add('shake'); setTimeout(()=>{ try{ sc.classList.remove('shake'); }catch(e){} },600); }catch(e){} hpBotSay(sc,hpBotOne('bot_bang'),1600); return 'bang'; }
  hpBotSay(sc,hpBotOne(k==='wave'?'bot_wave':'bot_say')); return k==='sleepy'?'say':k; }
function hpBotTugMs(dpx,unit){ return Math.max(0,-Number(dpx||0))*0.5*Number(unit||1)*1000/HP_CS_WALK_PX; }
function hpBotTugStart(sc,rb,e,sv){ const w=rb.__hpWalk; if(!w||!w.a) return false; let ct=0, per=0; try{ w.a.pause(); ct=Number(w.a.currentTime)||0; const tm=(w.a.effect&&typeof w.a.effect.getTiming==='function')?w.a.effect.getTiming():null; per=(tm&&Number(tm.duration))||0; }catch(_){ return false; }
  const vb=(sv.getAttribute('viewBox')||'0 0 120 40').split(/\s+/).map(Number), unit=(vb[3]||40)/42; clearTimeout(rb.__hpHold); HP_BOT_TOUCH=Date.now();
  HP_BOT_DRAG={id:e.pointerId,tug:w,ct0:ct,floor:per?Math.floor(ct/per)*per:0,cx:e.clientX,unit:unit,moved:false,t0:Date.now()}; try{ sv.setPointerCapture(e.pointerId); }catch(_){} return true; }
function hpBotTugMove(sc,rb,x){ const d=HP_BOT_DRAG; if(!d||!d.tug) return false; const dpx=x-d.cx; if(!d.moved&&dpx<=-12){ d.moved=true; try{ rb.classList.add('angry'); }catch(e){} hpBotSay(sc,hpBotOne('bot_tug'),1800); } if(!d.moved) return false;
  try{ d.tug.a.currentTime=Math.max(d.floor,d.ct0-hpBotTugMs(dpx,d.unit)); }catch(e){} return true; }
function hpBotTugEnd(sc,rb,now){ const d=HP_BOT_DRAG; HP_BOT_DRAG=null; if(!d||!d.tug) return ''; const w=d.tug; try{ rb.classList.remove('angry'); }catch(e){}
  if(!d.moved){ try{ if(rb.__hpWalk===w) w.a.play(); }catch(e){} return ''; }
  let ct=d.ct0; try{ ct=Number(w.a.currentTime); if(!(ct>=0)) ct=d.ct0; }catch(e){} HP_BOT_DRAGAT=now; hpCsWkShift(w,Math.max(0,now-d.t0)+Math.max(0,d.ct0-ct)); rb.__hpHoldUntil=now; hpBotHold(rb,600,now);
  return hpBotGrumble(sc,rb,now,'bot_work')==='angry'?'angry':'tug'; }
function hpBotPetMove(sc,x,now){ const P=HP_BOT_PET; const dx=x-P.x; if(P.dir&&Math.abs(dx)<6) return 0; const dir=dx>0?1:-1; P.x=x; if(P.dir&&dir!==P.dir) P.flips=P.flips.filter(t=>now-t<1500).concat([now]); P.dir=dir;
  if(P.flips.length>=3){ P.flips=P.flips.slice(-1); HP_BOT_PETAT=now; hpBotTireAdd(1,now); hpBotFx(sc,'bheart','💗',1400); if(Math.random()<0.4) setTimeout(()=>{ hpBotFx(sc,'bheart','💗',1400); },180); return 1; } return 0; }
function hpBotNear(sc,cx){ try{ const r=sc.querySelector('.rb').getBoundingClientRect(); return !!r.width&&cx>=r.left-24&&cx<=r.right+24; }catch(e){ return false; } }
function hpBotDragX(x0,dpx,unit,left){ return Math.max(-left,Math.min(8,x0+dpx*unit)); }
function hpBotAt(rb){ try{ const m=/translateX\((-?[\d.]+)px\)/.exec(rb.style.transform||''); return m?Number(m[1]):0; }catch(e){ return 0; } }
function hpBotPut(rb,x){ try{ rb.style.transform=x?'translateX('+x+'px)':''; }catch(e){} }
function hpBotHome(sc,rb,from,boing){ try{ if(rb.__hpHome){ try{ rb.__hpHome.cancel(); }catch(_){} rb.__hpHome=null; } if(!from||typeof rb.animate!=='function'){ hpBotPut(rb,0); return; }
  const a=boing?rb.animate([{transform:'translateX('+from+'px)'},{transform:'translateX(10px)',offset:0.55},{transform:'translateX(-4px)',offset:0.75},{transform:'translateX(2px)',offset:0.9},{transform:'translateX(0px)'}],{duration:650,easing:'cubic-bezier(.3,1.4,.5,1)'})
    :rb.animate([{transform:'translateX('+from+'px)'},{transform:'translateX(0px)'}],{duration:Math.max(800,Math.round(Math.abs(from)*1000/(typeof HP_CS_WALK_PX!=='undefined'?HP_CS_WALK_PX:80))),easing:'linear'});
  hpBotPut(rb,0); rb.__hpHome=a; a.onfinish=()=>{ rb.__hpHome=null; }; }catch(e){ hpBotPut(rb,0); } }
function hpBotDragEnd(sc,rb,moved,now){ const d=HP_BOT_DRAG; HP_BOT_DRAG=null; if(!d||!moved) return ''; HP_BOT_DRAGAT=now; const x=hpBotAt(rb), left=d.left;
  if(x<=-left+2){ hpBotHome(sc,rb,x,true); hpBotTireAdd(3,now); setTimeout(()=>{ hpBotSay(sc,hpBotOne('bot_boing'),1800); },350); return 'boing'; }
  const n=hpBotAngerAdd(now); if(hpBotTireAdd(2,now)==='doze'){ hpBotHome(sc,rb,x,false); hpBotDozeStart(sc); return 'tired'; }
  if(n>=3){ try{ rb.classList.add('angry'); setTimeout(()=>{ try{ rb.classList.remove('angry'); }catch(_){} },3000); }catch(e){} hpBotFx(sc,'bangry','💢',1600); hpBotSay(sc,hpBotOne('bot_angry'),2400); }
  else hpBotSay(sc,hpBotOne(n===2?'bot_drag2':'bot_drag1'),1800);
  clearTimeout(rb.__hpBack); rb.__hpBack=setTimeout(()=>{ try{ if(!HP_BOT_DRAG&&!hpWayPlay('drag')) hpBotHome(sc,rb,hpBotAt(rb),false); }catch(e){} },2500); return n>=3?'angry':'drag'; }
function hpBotWire(sc){ try{ const sv=sc&&sc.querySelector&&sc.querySelector('svg'); if(!sv||sv.getAttribute('data-hp-lane')) return; sv.setAttribute('data-hp-lane','1'); const mine=sc.id==='d-rly';
  sv.addEventListener('click',()=>{ hpBotReact(sc); });
  sv.addEventListener('pointerdown',e=>{ try{ const rb=hpBotRb(sc); if(!rb||!rb.contains||!rb.contains(e.target)) return; if(hpBotNapping(sc)) return;
    if(rb.__hpWalk){ hpBotTugStart(sc,rb,e,sv); return; } if(!mine) return;
    const vb=(sv.getAttribute('viewBox')||'0 0 120 40').split(/\s+/).map(Number), unit=(vb[3]||40)/42, left=(typeof HP_CS_RUN!=='undefined'&&HP_CS_RUN['d-rly'])||22;
    if(rb.__hpHome){ try{ rb.__hpHome.cancel(); }catch(_){} rb.__hpHome=null; } clearTimeout(rb.__hpBack);
    HP_BOT_TOUCH=Date.now();   HP_BOT_DRAG={id:e.pointerId,x0:hpBotAt(rb),cx:e.clientX,unit,left,moved:false,rev:0,dir:0,lx:e.clientX}; try{ sv.setPointerCapture(e.pointerId); }catch(_){} }catch(_){} });
  sv.addEventListener('pointermove',e=>{ try{ const d=HP_BOT_DRAG, rb=hpBotRb(sc);
    if(d&&d.tug&&d.id===e.pointerId){ hpBotTugMove(sc,rb,e.clientX); return; }
    if(d&&d.id===e.pointerId){ const dpx=e.clientX-d.cx; const st=e.clientX-d.lx; if(Math.abs(st)>=6){ const dir=st>0?1:-1; if(d.dir&&dir!==d.dir) d.rev++; d.dir=dir; d.lx=e.clientX; }
      if(!d.moved&&d.rev>=1&&Math.abs(dpx)<30){ hpBotPetMove(sc,e.clientX,Date.now()); return; }
      if(!d.moved&&Math.abs(dpx)>=30) d.moved=true; if(d.moved&&rb) hpBotPut(rb,hpBotDragX(d.x0,dpx,d.unit,d.left)); return; }
    if(!hpBotNear(sc,e.clientX)){ HP_BOT_PET.dir=0; HP_BOT_PET.x=e.clientX; return; } hpBotPetMove(sc,e.clientX,Date.now()); }catch(_){} });
  const up=e=>{ try{ const d=HP_BOT_DRAG; if(!d||d.id!==e.pointerId) return; const rb=hpBotRb(sc); if(d.tug){ hpBotTugEnd(sc,rb,Date.now()); return; }   hpBotDragEnd(sc,rb,d.moved,Date.now()); }catch(_){} };
  sv.addEventListener('pointerup',up); sv.addEventListener('pointercancel',up);
  sv.addEventListener('pointerleave',()=>{ HP_BOT_PET.dir=0; }); }catch(e){} }
function hpBotNightTick(mine,working){ try{ const rb=hpBotRb(mine); if(!rb||!rb.classList) return ''; if(working) hpBotWake(mine);   const nap=!working&&hpBotHour(new Date().getHours())==='nap'; rb.classList.toggle('nap',nap); if(HP_WAY_NAP===false&&nap) hpWayPlay('night'); HP_WAY_NAP=nap;
  if(nap){ if(rb.style&&rb.style.transform) hpBotPut(rb,0); if(!mine.classList.contains('hid')) hpBotFx(mine,'bzz','💤',2600,hpBotHouse(mine)); return 'nap'; }
  if(hpBotDozing()&&!mine.classList.contains('hid')) hpBotFx(mine,'bzz','💤',2600); else hpIdleTick(mine,working);   return hpBotDozing()?'doze':''; }catch(e){ return ''; } }

let HP_WAY=null, HP_WAY_AT=0, HP_WAY_PREV='', HP_WAY_NAP=null;
const HP_WAY_MS=16000, HP_WAY_GAP=45000;
function hpWayOk(reason,now,last,busy){ if(busy) return false; if(reason==='night') return true; return !(now-last<HP_WAY_GAP); }
function hpWayPlan(W){ W=Math.max(120,Number(W)||120); const X=W-48, L=Math.max(W+40,X+120), s=p=>X+16-p*L;
  const mtnL=L*0.3, mtns=[]; for(let x=-mtnL-20;x<W+30;x+=30) mtns.push(Math.round(x));
  return {W,X,L,tree:s(0.06),bird:0.06,grass:[0.12,0.17,0.35,0.45,0.55,0.74,0.8,0.93].map(s),pines:[0.19,0.22,0.3,0.6,0.63,0.66].map(s),
    rabbit:s(0.26),hop:0.26,river:s(0.4),fish:0.4,deer:s(0.5),dp:0.5,fox:s(0.7),salute:0.7,owl:s(0.86),op:0.86,mtnL,mtns,home:X+16-L-29}; }
function hpWaySvg(P){ const NS='http://www.w3.org/2000/svg', el=(t,a,p)=>{ const e=document.createElementNS(NS,t); for(const k in a) e.setAttribute(k,a[k]); if(p) p.appendChild(e); return e; };
  const tx=(p,a,t)=>{ const e=el('text',a,p); e.textContent=t; return e; };
  const sv=el('svg',{viewBox:'0 0 '+P.W+' 40',class:'way','aria-hidden':'true'}); el('rect',{class:'wsky',x:0,y:0,width:P.W,height:40},sv);
  const sky=el('g',{class:'wnight'},sv); el('circle',{cx:P.W*0.35,cy:8,r:3.2,fill:'#f3e9b5'},sky); el('circle',{cx:P.W*0.35+1.4,cy:7.2,r:2.8,class:'wmoonc'},sky); for(let i=0;i<9;i++) el('rect',{x:((i*37)%Math.max(1,Math.round(P.W))),y:2+(i*7)%12,width:1,height:1,fill:'#e8e2c8'},sky);
  const mt=el('g',{class:'wmtn'},sv); P.mtns.forEach((x,i)=>{ const h=13+(i*7)%10, w=20+(i*5)%9; el('path',{d:'M'+(x-w)+' 38.5L'+x+' '+(38.5-h)+'L'+(x+w)+' 38.5Z',fill:i%2?'#34455a':'#415369'},mt); el('path',{d:'M'+(x-3.6)+' '+(38.5-h+4)+'L'+x+' '+(38.5-h)+'L'+(x+3.6)+' '+(38.5-h+4)+'Z',fill:'#dfe6ee',opacity:.8},mt); });
  el('line',{x1:0,y1:38.5,x2:P.W,y2:38.5,class:'wgnd'},sv);
  const st=el('g',{class:'wstrip'},sv);
  const tr=el('g',{transform:'translate('+P.tree+',0)'},st); el('path',{d:'M8 38V20M8 26l-6-6M8 23l5-6M8 20l-3-7M13 17l3-2M2 20l-1-4',stroke:'#7a5a3a','stroke-width':1.6,fill:'none','stroke-linecap':'round'},tr);
  const bd=el('g',{class:'wbird'},tr); el('ellipse',{cx:14.5,cy:13.2,rx:2.2,ry:1.6,fill:'#e6b04a'},bd); el('rect',{x:15.9,y:12.4,width:1,height:.8,fill:'#e07a3a'},bd); tx(bd,{x:17,y:9,class:'wnote','font-size':5},'♪');
  for(const x of P.grass){ el('path',{d:'M'+x+' 38l1.5-3 1.5 3M'+(x+3)+' 38l1-2.4 1 2.4',stroke:'#5f8a4a','stroke-width':.8,fill:'none'},st); }
  for(const x of P.pines){ el('rect',{x:x-.6,y:33,width:1.2,height:5.5,fill:'#6a4a2e'},st); el('path',{d:'M'+(x-5)+' 34L'+x+' 23L'+(x+5)+' 34ZM'+(x-4)+' 29L'+x+' 19L'+(x+4)+' 29Z',fill:'#2f5a3a'},st); }
  { const r=P.river; el('rect',{x:r-13,y:35.6,width:26,height:3.4,fill:'#3f7cb8'},st); el('path',{d:'M'+(r-10)+' 37h3M'+(r+2)+' 36.6h4M'+(r-3)+' 38h3',stroke:'#9cc7ee','stroke-width':.5,fill:'none'},st);
    el('path',{d:'M'+(r-15)+' 38.2Q'+r+' 31.5 '+(r+15)+' 38.2',stroke:'#8a5a34','stroke-width':1.4,fill:'none'},st); el('path',{d:'M'+(r-8)+' 35.8v2.4M'+(r+8)+' 35.8v2.4',stroke:'#8a5a34','stroke-width':.8},st);
    const fi=el('g',{class:'wani wfish',transform:'translate('+(r+4)+',0)'},st); tx(fi,{x:-3.5,y:38.6,'font-size':7},'🐟'); }
  { const g=el('g',{transform:'translate('+P.rabbit+',0)'},st); el('ellipse',{cx:2,cy:36.6,rx:6.5,ry:3.4,fill:'#3f6a3c'},g); const rb=el('g',{class:'wani wrab'},g); tx(rb,{x:-3,y:38.4,'font-size':8},'🐇'); }
  { const g=el('g',{class:'wani wdeer',transform:'translate('+P.deer+',0)'},st); tx(g,{x:-6,y:38.6,'font-size':13},'🦌'); }
  { const g=el('g',{class:'wani wfox',transform:'translate('+P.fox+',0)'},st); tx(g,{x:-5,y:38.6,'font-size':10},'🦊'); }
  { const g=el('g',{transform:'translate('+P.owl+',0)'},st); el('path',{d:'M4 38V16M4 24l5-5M4 21l-4-4',stroke:'#5a4630','stroke-width':1.4,fill:'none','stroke-linecap':'round'},g); const o=el('g',{class:'wani wowl'},g); tx(o,{x:4.5,y:21,'font-size':7},'🦉'); tx(o,{x:11,y:13,class:'wowlv','font-size':4.5},(typeof T==='function')?T('way_owl'):'Hoo'); }
  el('use',{href:'#hp-house',x:P.home,y:2,width:48,height:36},st); el('rect',{class:'wdoorin',x:P.home+26,y:23,width:6,height:14,fill:'#05070c'},st); el('rect',{class:'wdoor',x:P.home+26,y:23,width:6,height:14,fill:'#8a5a34'},st); el('rect',{class:'wwin',x:P.home+37,y:18,width:5,height:3.3},st);
  const rbw=el('g',{class:'wrb',transform:'translate('+(P.X+32)+',4) scale(-1,1)'},sv); el('use',{class:'rbA',href:'#hp-rb-a',x:0,y:0,width:32,height:34},rbw); el('use',{class:'rbB',href:'#hp-rb-b',x:0,y:0,width:32,height:34},rbw);
  const sal=el('text',{class:'wsal',x:P.X-2,y:9,'font-size':5.5,'text-anchor':'end'},sv); sal.textContent=(typeof T==='function')?T('way_salute'):'!';
  return sv; }
function hpWaySkipOk(){ try{ if(document.body&&document.body.classList.contains('nobot')) return false; if(document.hidden) return false; if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false; }catch(e){} return true; }
function hpWayPlay(reason){ const now=Date.now(); if(typeof hpDayOn==='function'&&hpDayOn()) return '';   if(!hpWayOk(reason,now,HP_WAY_AT,!!HP_WAY)||!hpWaySkipOk()) return '';
  try{ const path=document.getElementById('path'), mine=document.getElementById('d-rly'); if(!path||!mine||mine.classList.contains('hid')) return ''; const sv0=mine.querySelector('svg'); if(!sv0) return '';
    const vb=(sv0.getAttribute('viewBox')||'0 0 120 40').split(/\s+/).map(Number), P=hpWayPlan(vb[2]), pr=path.getBoundingClientRect(), r=sv0.getBoundingClientRect(); if(!r.width) return '';
    const rb=hpBotRb(mine); if(rb){ try{ if(rb.__hpHome){ rb.__hpHome.cancel(); rb.__hpHome=null; } }catch(e){} clearTimeout(rb.__hpBack); hpBotPut(rb,0); }
    const box=document.createElement('div'); box.id='hp-way'; box.style.cssText='left:'+(r.left-pr.left)+'px;top:'+(r.top-pr.top)+'px;width:'+r.width+'px;height:'+r.height+'px'; const sv=hpWaySvg(P); sv.style.width='100%'; sv.style.height='100%'; box.appendChild(sv); path.appendChild(box);
    HP_WAY={box,t:[],reason}; HP_WAY_AT=now; const at=(ms,f)=>HP_WAY.t.push(setTimeout(()=>{ try{ f(); }catch(e){} },ms));
    const strip=sv.querySelector('.wstrip'); let a=null; try{ a=strip.animate([{transform:'translateX(0px)'},{transform:'translateX('+P.L+'px)'}],{duration:HP_WAY_MS,easing:'linear',fill:'forwards'}); HP_WAY.a=a; }catch(e){}
    at(Math.max(0,P.bird*HP_WAY_MS-300),()=>sv.classList.add('flyoff'));
    for(const [c,p,lead] of [['a-rab',P.hop,1300],['a-fish',P.fish,600],['a-deer',P.dp,2600],['a-fox',P.salute,1800],['a-owl',P.op,2400]]) at(Math.max(0,p*HP_WAY_MS-lead),()=>sv.classList.add(c));
    try{ const mt=sv.querySelector('.wmtn'); HP_WAY.m=mt.animate([{transform:'translateX(0px)'},{transform:'translateX('+P.mtnL+'px)'}],{duration:HP_WAY_MS,easing:'linear',fill:'forwards'}); }catch(e){}
    at(P.salute*HP_WAY_MS-200,()=>sv.classList.add('salute')); at(P.salute*HP_WAY_MS+900,()=>sv.classList.remove('salute'));
    at(HP_WAY_MS,()=>sv.classList.add('arrive')); at(HP_WAY_MS+700,()=>sv.classList.add('shut')); at(HP_WAY_MS+1300,()=>sv.classList.add('lit')); at(HP_WAY_MS+2100,()=>box.classList.add('fade')); at(HP_WAY_MS+2800,()=>hpWayEnd());
    box.addEventListener('click',e=>{ try{ e.stopPropagation(); }catch(_){} hpWayEnd(); });
    try{ sv.style.setProperty('--wms',HP_WAY_MS+'ms'); }catch(e){}
    return reason; }catch(e){ hpWayEnd(); return ''; } }
function hpWayEnd(){ const w=HP_WAY; HP_WAY=null; if(!w) return; try{ for(const t of w.t) clearTimeout(t); }catch(e){} try{ if(w.a) w.a.cancel(); }catch(e){} try{ if(w.m) w.m.cancel(); }catch(e){} try{ w.box.remove(); }catch(e){} }

let HP_BOT_TOUCH=0, HP_IDLE_NEXT=0, HP_IDLE_LAST='';
function hpIdlePick(rnd){ rnd=rnd||Math.random; const c=['tea','play','flower'].filter(k=>k!==HP_IDLE_LAST); return (HP_IDLE_LAST=c[Math.floor(rnd()*c.length)%c.length]); }
function hpIdleOk(now,working,nap,doze,busy){ return !working&&!nap&&!doze&&!busy&&now-HP_BOT_TOUCH>15000&&now>=HP_IDLE_NEXT; }
function hpIdleTick(mine,working){ try{ const now=Date.now(), rb=hpBotRb(mine); if(!rb||mine.classList.contains('hid')) return ''; if(!hpIdleOk(now,working,rb.classList.contains('nap'),hpBotDozing(now),!!(HP_WAY||HP_BOT_DRAG||rb.style.transform))) return '';
  if(!HP_IDLE_NEXT){ HP_IDLE_NEXT=now+20000; return ''; } HP_IDLE_NEXT=now+25000+Math.floor(Math.random()*20000); const k=hpIdlePick();
  if(k==='tea'){ rb.classList.add('sit'); hpBotFx(mine,'btea','☕',7000); setTimeout(()=>{ try{ rb.classList.remove('sit'); }catch(e){} },7000); }
  else if(k==='play'){ hpBotFx(mine,'bball','⚽',4200); for(const t of [300,1400,2500]) setTimeout(()=>{ try{ mine.classList.remove('jump'); void mine.offsetWidth; mine.classList.add('jump'); setTimeout(()=>{ mine.classList.remove('jump'); },600); }catch(e){} },t); }
  else { hpBotFx(mine,'bflower','🌷',6000); setTimeout(()=>{ hpBotFx(mine,'bdrop','💧',1400); },800); setTimeout(()=>{ hpBotFx(mine,'bdrop','💧',1400); },2000); }
  return k; }catch(e){ return ''; } }
function hpCsRefresh(){ if(HP_CS_T) return; HP_CS_T=setTimeout(()=>{ HP_CS_T=null; try{ hpCsRender(); }catch(e){} },30); }
function hpCsBoot(){
  try{ if(typeof window!=='undefined'&&window.addEventListener){ const f=()=>{ try{ if(typeof hpSceneCap==='function') hpSceneCap(); else hpCsRefresh(); }catch(e){} }; window.addEventListener('online',f); window.addEventListener('offline',f); } }catch(e){}
  try{ const el=document.getElementById('lease-exp'); if(el&&!el.dataset.hpWired){ el.dataset.hpWired='1'; el.addEventListener('change',()=>{ const v=el.value; hpLeaseSet(v?new Date(v).getTime():0); }); } }catch(e){}
  try{ for(const id of ['btn-pt-spare'])  { const b=document.getElementById(id); if(b&&!b.dataset.hpWired){ b.dataset.hpWired='1'; b.addEventListener('click',hpPostTodo); } } }catch(e){}
  try{ const b=document.getElementById('btn-pt-move'); if(b&&!b.dataset.hpWired){ b.dataset.hpWired='1'; b.addEventListener('click',()=>{ if(typeof hpMoveOpen==='function') hpMoveOpen(); }); } }catch(e){}
  try{ for(const [id,f] of [['btn-pay-load',()=>hpPayRead()],['btn-pay-px',()=>hpPxPress()],['btn-pay-csv-m',()=>hpPayCsvSave('m')],['btn-pay-csv-d',()=>hpPayCsvSave('d')]]){ const b=document.getElementById(id); if(b&&!b.dataset.hpWired){ b.dataset.hpWired='1'; b.addEventListener('click',f); } } }catch(e){}
  try{ hpPayCurUi(); const sel=document.getElementById('pay-cur'), cb=document.getElementById('pay-px-auto'); if(sel&&!sel.dataset.hpWired){ sel.dataset.hpWired='1'; sel.addEventListener('change',()=>{ hpPayCurSet(sel.value); }); } if(cb&&!cb.dataset.hpWired){ cb.dataset.hpWired='1'; cb.addEventListener('change',()=>{ hpPxAutoSet(!!cb.checked); }); } }catch(e){}
  try{ const b=document.getElementById('btn-lease-renew'); if(b&&!b.dataset.hpWired){ b.dataset.hpWired='1'; b.addEventListener('click',()=>{ hpLeaseRenew(); }); } }catch(e){}
  try{ const mi=document.getElementById('lease-mom'), mb=document.getElementById('btn-lease-mom');
    if(mi&&!mi.dataset.hpWired){ mi.dataset.hpWired='1'; mi.addEventListener('paste',()=>{ setTimeout(()=>{ hpLeaseFromMoment(mi.value); },0); }); mi.addEventListener('keydown',e=>{ if(e.key==='Enter'){ try{ e.preventDefault(); }catch(_){} hpLeaseFromMoment(mi.value); } }); }
    if(mb&&mi&&!mb.dataset.hpWired){ mb.dataset.hpWired='1'; mb.addEventListener('click',()=>{ hpLeaseFromMoment(mi.value); }); } }catch(e){}   try{ const ai=document.getElementById('lease-acct'), ab=document.getElementById('btn-lease-lg');       if(ai&&!ai.dataset.hpWired){ ai.dataset.hpWired='1'; ai.addEventListener('paste',()=>{ setTimeout(()=>{ hpLeaseAcctSet(ai.value); },0); }); ai.addEventListener('keydown',e=>{ if(e.key==='Enter'){ try{ e.preventDefault(); }catch(_){} hpLeaseAcctSet(ai.value); } }); }     if(ab&&ai&&!ab.dataset.hpWired){ ab.dataset.hpWired='1'; ab.addEventListener('click',()=>{ hpLeaseAcctSet(ai.value); }); } const xb=document.getElementById('btn-lease-xpl'); if(xb&&ai&&!xb.dataset.hpWired){ xb.dataset.hpWired='1'; xb.addEventListener('click',()=>{ const u=hpXplUrl(ai.value); if(!u){ try{ hpToast(T('tx_xpl_none')); }catch(_){} return; } try{ window.open(u,'_blank','noopener'); }catch(_){} }); } }catch(e){}
  try{ for(const id of ['d-rly','d-peer']){ const sc=document.getElementById(id), rb=(sc&&typeof sc.querySelector==='function')?sc.querySelector('.rb'):null; if(rb&&rb.addEventListener&&!rb.getAttribute('data-hp-wired')){ rb.setAttribute('data-hp-wired','1'); rb.addEventListener('click',e=>{ try{ e.stopPropagation(); }catch(_){} hpBotReact(sc); }); } hpBotWire(sc); } }catch(e){}
  try{ if(typeof window!=='undefined'&&window.addEventListener) window.addEventListener('resize',()=>{ try{ hpCsFit(); }catch(e){} }); }catch(e){}
  try{ for(const id of ['d-rly','d-peer']){ const sc=document.getElementById(id), d=(sc&&typeof sc.querySelector==='function')?sc.querySelector('.dhit'):null; if(d&&d.addEventListener&&!d.getAttribute('data-hp-wired')){ d.setAttribute('data-hp-wired','1'); d.addEventListener('click',e=>{ try{ e.stopPropagation(); }catch(_){} hpCsVisit(sc); }); } } }catch(e){}
  try{ const x=document.getElementById('hp-bot'); if(x&&!x.dataset.hpWired){ x.dataset.hpWired='1'; x.addEventListener('change',()=>{ hpBotSet(!!x.checked); }); } hpBotApply(); }catch(e){}
  if(!HP_CS_TICK){ HP_CS_TICK=setInterval(()=>{ try{ hpCsRender(); }catch(e){} },5000); try{ if(HP_CS_TICK.unref) HP_CS_TICK.unref(); }catch(e){} }
}
try{ if(typeof document!=='undefined'&&document.getElementById&&document.getElementById('d-peer')) hpCsBoot(); }catch(e){}

const HP_GOV='rBvKgF3jSZWdJcwSsmoJspoXLLDVLDp6jg', HP_EVN_NS='01EAF09326B4911554384121FF56FA8FECC215FDDE2EC35D9E59F2C53EC665A0';
const HP_HS_WAIT_ALL=600e3, HP_HS_WAIT_IDLE=30e3;
const HP_HS_PAGES=200, HP_HS_SHOW=10  , HP_HS_HIGH=1.5;
const HP_B58='rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
let HP_HOSTS=null, HP_HS_BUSY=false, HP_HS_N=HP_HS_SHOW, HP_HS_PICK='';
const HP_HS_DOM=new Map();
function hpU8(h){ h=String(h||''); const a=new Uint8Array(h.length>>1); for(let i=0;i<a.length;i++) a[i]=parseInt(h.substr(i*2,2),16); return a; }
async function hpAcctId(u8){
  const p=new Uint8Array(21); p.set(u8,1); const d1=new Uint8Array(await crypto.subtle.digest('SHA-256',p)), d2=new Uint8Array(await crypto.subtle.digest('SHA-256',d1));
  const b=new Uint8Array(25); b.set(p); b.set(d2.slice(0,4),21); let n=0n; for(const x of b) n=n*256n+BigInt(x); let s=''; while(n>0n){ s=HP_B58[Number(n%58n)]+s; n/=58n; } for(const x of b){ if(x===0) s=HP_B58[0]+s; else break; } return s; }
function hpXfl(h){ h=String(h||''); if(h.length<16) return 0; let x=0n; for(let i=7;i>=0;i--) x=x*256n+BigInt(parseInt(h.substr(i*2,2),16)); if(x===0n||x>=(1n<<63n)) return 0; const m=x-((x>>54n)<<54n), e=Number(((x>>54n)&0xFFn)-97n); return Number(m)*Math.pow(10,e); }
function hpHostDecode(k,d){ k=String(k||'').toUpperCase(); d=String(d||''); const n=d.length>>1; if(k.length!==64||k.slice(0,8)!=='45565203'||n<103) return null;
  const s=(o,l)=>{ let t=''; for(let i=0;i<l;i++){ const c=parseInt(d.substr((o+i)*2,2),16); if(c>=32&&c<127) t+=String.fromCharCode(c); } return t.trim(); };
  return {aid:k.slice(24), cc:s(32,2).toUpperCase(), desc:s(42,26), maxI:hpHexLE(d,84,4), actI:hpHexLE(d,88,4), lhb:hpHexLE(d,92,8), ver:[0,1,2].map(i=>parseInt(d.substr((100+i)*2,2),16)).join('.'),
    regTs:n>=111?hpHexLE(d,103,8):0, rep:n>=126?parseInt(d.substr(250,2),16):null, lease:n>=143?hpXfl(d.substr(270,16)):0}; }
function hpHsTier(p){ return p>=200?'ent':p>=100?'high':p>=50?'mid':p>=20?'low':'lite'; }
function hpHsMaker(m){ m=String(m||''); return /intel|xeon/i.test(m)?'intel':/amd|epyc|ryzen|opteron/i.test(m)?'amd':m?'other':''; }
function hpHsSpec(d){ d=String(d||''); if((d.length>>1)<76) return null; const s=(o,l)=>{ let t=''; for(let i=0;i<l;i++){ const c=parseInt(d.substr((o+i)*2,2),16); if(c>=32&&c<127) t+=String.fromCharCode(c); } return t.trim(); };
  return {aid:d.slice(0,40).toUpperCase(), cpu:s(20,40), cores:hpHexLE(d,60,2), mhz:hpHexLE(d,62,2), ram:hpHexLE(d,68,4), disk:hpHexLE(d,72,4)}; }
function hpHsPerf(h){ if(!h||!h.maxI||!(h.ram||h.disk||h.cores)) return 0; return Math.round(((h.disk/100)+h.ram+(h.mhz*h.cores))/100/h.maxI*10)/10; }
async function hpHostsBuild(ents,now){ now=now||Date.now(); const byK={}; for(const e of (ents||[])){ if(e&&e.HookStateKey) byK[String(e.HookStateKey).toUpperCase()]=String(e.HookStateData||''); }
  const K=x=>'45565201'+'0'.repeat(54)+x, szh=byK[K('03')]||'', size=(szh?hpHexLE(szh,0,2):0)||3600, freq=(byK[K('06')]?hpHexLE(byK[K('06')],0,2):0)||1;
  let base=0; try{ base=hpMomDecode(byK['45565233'+'0'.repeat(56)],szh||'100E').base; }catch(e){}
  const spec={}; for(const k of Object.keys(byK)){ if(k.slice(0,8)!=='45565202') continue; const s=hpHsSpec(byK[k]); if(s) spec[s.aid]=s; }
  const ts=Math.floor(now/1000), cur=base?base+Math.floor((ts-base)/size)*size:ts, win=freq*size, out=[];
  for(const k of Object.keys(byK)){ const h=hpHostDecode(k,byK[k]); if(!h) continue; h.active=h.lhb>win?(h.lhb>=cur-win):(h.lhb>0); h.free=Math.max(0,h.maxI-h.actI); h.size=size;
    const sp=spec[h.aid]||{}; h.cpu=sp.cpu||''; h.cores=sp.cores||0; h.mhz=sp.mhz||0; h.ram=sp.ram||0; h.disk=sp.disk||0; h.ramI=h.maxI?h.ram/h.maxI:0; h.diskI=h.maxI?h.disk/h.maxI:0; h.perf=hpHsPerf(h); h.tier=(h.ram||h.disk)?hpHsTier(h.perf):''; h.maker=hpHsMaker(h.cpu);
    try{ h.addr=await hpAcctId(hpU8(h.aid)); }catch(e){ continue; } out.push(h); }
  return {hosts:out,size:size,freq:freq,at:now}; }
function hpHsMedian(hosts){ const a=(hosts||[]).filter(h=>h.active&&h.free>0&&h.lease>0).map(h=>h.lease).sort((x,y)=>x-y); if(!a.length) return 0; const m=a.length>>1; return a.length%2?a[m]:(a[m-1]+a[m])/2; }
function hpHsHigh(h,med){ return !!(med>0&&h&&h.lease>med*HP_HS_HIGH); }

const HP_HS_F0=()=>({cc:[],tier:[],maker:[],ver:[],price:0,free:1,rep:0,cores:0,ghz:0,ram:0,disk:0,days:0,live:true,q:''});
let HP_HS_F=HP_HS_F0();
const HP_HS_OPT={price:[0.0001,0.0005,0.001,0.002,0.005,0.01],free:[1,2,3,5],rep:[200,230,250,255],cores:[2,4,8,16,32],ghz:[2,2.5,3,3.5],ram:[1,2,4,8,16],disk:[10,20,40,80,160],days:[30,90,180,365]};
const HP_HS_TIERS=['ent','high','mid','low','lite'], HP_HS_MAKERS=['intel','amd','other'];
const HP_HS_TK={ent:'hs_tier_ent',high:'hs_tier_high',mid:'hs_tier_mid',low:'hs_tier_low',lite:'hs_tier_lite'}, HP_HS_MK={intel:'hs_mk_intel',amd:'hs_mk_amd',other:'hs_mk_other'};
function hpHsDomOf(h){ let d=''; try{ d=(typeof HP_HS_DOM!=='undefined'&&HP_HS_DOM.get(h.addr))||''; }catch(e){} return String(d||h.desc||'').toLowerCase(); }
function hpHsPass(h,F,skip,now){ F=F||HP_HS_F; now=now||Date.now(); const on=k=>k!==skip;
  if(on('live')&&F.live&&!h.active) return false;
  if(on('free')&&F.free&&h.free<F.free) return false;
  if(on('cc')&&F.cc.length&&F.cc.indexOf(h.cc)<0) return false;
  if(on('tier')&&F.tier.length&&F.tier.indexOf(h.tier)<0) return false;
  if(on('maker')&&F.maker.length&&F.maker.indexOf(h.maker)<0) return false;
  if(on('ver')&&F.ver.length&&F.ver.indexOf(h.ver)<0) return false;
  if(on('price')&&F.price&&!(h.lease>0&&h.lease<=F.price*(1+1e-9))) return false;
  if(on('rep')&&F.rep&&!((h.rep||0)>=F.rep)) return false;
  if(on('cores')&&F.cores&&h.cores<F.cores) return false;
  if(on('ghz')&&F.ghz&&h.mhz<F.ghz*1000) return false;
  if(on('ram')&&F.ram&&h.ramI<F.ram*1024*0.97) return false;
  if(on('disk')&&F.disk&&h.diskI<F.disk*1024*0.97) return false;
  if(on('days')&&F.days&&!(h.regTs&&now-h.regTs*1000>=F.days*86400e3)) return false;
  if(on('q')&&F.q&&hpHsDomOf(h).indexOf(String(F.q).toLowerCase().trim())<0) return false;
  return true; }

let HP_HS_COL=null;
function hpHsColVal(h,k){ switch(k){
  case 'hs_h_st': return h.active?1:0;
  case 'hs_h_cc': return h.cc?String(h.cc):null;
  case 'hs_h_dom': { const d=(typeof hpHsDom==='function'&&hpHsDom(h))||h.desc||h.addr||''; return d?String(d).toLowerCase():null; }
  case 'hs_h_price': return h.lease>0?h.lease:null;
  case 'hs_h_days': return h.lease>0?hpHsPer30(h):null;
  case 'hs_h_free': return Number(h.free)||0;
  case 'hs_h_rep': return h.rep==null?null:Number(h.rep);
  case 'hs_h_perf': return h.tier?Number(h.perf)||0:null;
  case 'hs_h_cpu': return h.cores?h.cores*1e6+(Number(h.mhz)||0):null;
  case 'hs_h_ram': return h.ram?Number(h.ramI)||0:null;
  case 'hs_h_disk': return h.disk?Number(h.diskI)||0:null;
  case 'hs_h_age': return h.regTs?-h.regTs:null;
  case 'hs_h_hb': return h.lhb?-h.lhb:null;
  default: return null; } }
function hpHsColCmp(col){ const k=col.k, dir=col.dir<0?-1:1; return (x,y)=>{ const a=hpHsColVal(x,k), b=hpHsColVal(y,k); if(a===null||b===null) return (a===null?1:0)-(b===null?1:0)||((y.rep||0)-(x.rep||0));
    const c=(typeof a==='string')?(a<b?-1:a>b?1:0):(a-b); return c*dir||((y.rep||0)-(x.rep||0)); }; }
function hpHsColSet(k){ HP_HS_COL=k?((HP_HS_COL&&HP_HS_COL.k===k)?{k:k,dir:-HP_HS_COL.dir}:{k:k,dir:1}):null; HP_HS_N=HP_HS_SHOW; try{ hpHsDraw(); }catch(e){} return HP_HS_COL; }
function hpHsView(hosts,opt){ opt=opt||{}; const F=opt.F||HP_HS_F, now=opt.now||Date.now(); const a=(hosts||[]).filter(h=>hpHsPass(h,F,'',now));
  if(opt.col&&opt.col.k){ a.sort(hpHsColCmp(opt.col)); return a; }
  const by={rep:(x,y)=>((y.rep||0)-(x.rep||0))||(x.lease-y.lease), price:(x,y)=>(x.lease||1e18)-(y.lease||1e18)||((y.rep||0)-(x.rep||0)), age:(x,y)=>(x.regTs||1e18)-(y.regTs||1e18), hb:(x,y)=>y.lhb-x.lhb,
    perf:(x,y)=>(y.perf-x.perf)||((y.rep||0)-(x.rep||0)), ram:(x,y)=>(y.ramI-x.ramI)||(x.lease-y.lease), disk:(x,y)=>(y.diskI-x.diskI)||(x.lease-y.lease)};
  a.sort(by[opt.sort]||by.rep); return a; }
function hpHsCount(hosts,key,F,now){ F=F||HP_HS_F; const c={}; for(const h of (hosts||[])){ if(!hpHsPass(h,F,key,now)) continue; const v=h[key]; if(v) c[v]=(c[v]||0)+1; } return c; }
function hpHsCountAt(hosts,key,val,F,now){ F=F||HP_HS_F; const G=Object.assign({},F); G[key]=val; let n=0; for(const h of (hosts||[])) if(hpHsPass(h,G,'',now)) n++; return n; }
function hpHsCountries(hosts){ const c={}; for(const h of (hosts||[])) if(h.cc&&/^[A-Z]{2}$/.test(h.cc)) c[h.cc]=(c[h.cc]||0)+1; return Object.keys(c).sort().map(k=>({cc:k,n:c[k]})); }
function hpCcName(cc){ try{ const L=(typeof curLang==='function')?curLang():'ja'; return new Intl.DisplayNames([L],{type:'region'}).of(cc)||cc; }catch(e){ return cc; } }
function hpDur(ms){ ms=Math.max(0,Number(ms)||0); const m=Math.floor(ms/60e3), h=Math.floor(ms/3600e3), d=Math.floor(ms/86400e3); return d>=2?TF('hs_d',{n:d}):h>=1?TF('hs_h',{n:h}):TF('hs_m',{n:Math.max(1,m)}); }
function hpHsPer30(h){ return h.lease*(30*86400/(h.size||3600)); }
function hpHsPer30Text(h){ const v=hpHsPer30(h); if(!(v>0)) return '0'; return hpNum(v,v>=1?2:Math.min(8,Math.ceil(-Math.log10(v))+1)); }

const HP_MON_KEY='p2p_hmon'; let HP_MON=null;
function hpMonHost(u){ try{ return new URL(String(u)).hostname.toLowerCase(); }catch(e){ return ''; } }
function hpMonReady(){ try{ return !(typeof hpHDisk==='function'&&hpHDisk()&&typeof HPH_OPENED!=='undefined'&&!HPH_OPENED); }catch(e){ return true; } }
function hpMonLoad(){ if(HP_MON) return HP_MON; let o={}; try{ const s=(typeof hpHGet==='function')?hpHGet(HP_MON_KEY):null; o=s?JSON.parse(s):{}; }catch(e){ o={}; } HP_MON=(o&&typeof o==='object')?o:{}; return HP_MON; }
function hpMonSave(){ try{ if(HP_MON&&typeof hpHSet==='function') hpHSet(HP_MON_KEY,JSON.stringify(HP_MON)); }catch(e){} }
function hpMonRec(url,ev,kind,now){ const h=hpMonHost(url); if(!h||!hpMonReady()) return null; now=now||Date.now(); const M=hpMonLoad(); const r=M[h]||(M[h]={tries:0,fail:0,drops:0,up:0,best:0,first:now,last:0});
  if(kind==='own') r.own=1;
  const end=()=>{ if(r.up){ r.best=Math.max(r.best||0,now-r.up); r.up=0; } };
  if(ev==='ok'){ r.tries++; if(kind==='own'){ end(); r.up=now; } }
  else if(ev==='fail'){ r.tries++; r.fail++; }
  else if(ev==='drop'){ r.drops++; end(); }
  else if(ev==='close'){ end(); }
  r.last=now; try{ if(kind==='own'&&typeof hpHlConn==='function') hpHlConn(url,ev,now); }catch(_){}   hpMonSave(); return r; }
function hpMonGet(host){ const h=String(host||'').toLowerCase(); if(!h) return null; const r=hpMonLoad()[h]; return r||null; }
function hpMonText(host,now){   const r=hpMonGet(host); if(!r||!r.tries) return T('hs_mon_none'); now=now||Date.now();
  let t=TF(r.own?'hs_mon_own':'hs_mon_peer',{n:r.tries,f:r.fail||0,d:r.drops||0});
  if(r.own&&r.up) t+=TF('hs_mon_up',{t:hpDur(now-r.up)}); const best=Math.max(r.best||0,r.up?now-r.up:0); if(r.own&&best) t+=TF('hs_mon_best',{t:hpDur(best)}); return t; }

function hpHsSt(t,err){ try{ const el=document.getElementById('hs-st'); if(el){ el.textContent=t||''; el.style.color=err?'var(--red)':''; } }catch(e){} }
function hpHsBtn(){ try{ const b=document.getElementById('btn-hs-load'); if(b){ b.textContent=T(HP_HOSTS?'btn_hs_reload':'btn_hs_load'); b.disabled=!!HP_HS_BUSY; } }catch(e){} }
async function hpHsLoad(){ if(HP_HS_BUSY) return false; HP_HS_BUSY=true; hpHsBtn(); hpHsSt(T('hs_busy'));
  try{ const ents=await hpXahauSess(async q=>{ const a=[]; let mk=null, p=0; do{ const r=await q(Object.assign({command:'account_namespace',account:HP_GOV,namespace_id:HP_EVN_NS,ledger_index:'validated'},mk?{marker:mk}:{})); p++; for(const e of ((r&&r.namespace_entries)||[])) a.push(e); mk=(r&&r.marker)||null; if(p%5===0) hpHsSt(TF('hs_busy_n',{n:a.length})); } while(mk&&p<HP_HS_PAGES); return a; },HP_HS_WAIT_ALL,HP_HS_WAIT_IDLE);
    HP_HOSTS=await hpHostsBuild(ents); HP_HOSTS.med=hpHsMedian(HP_HOSTS.hosts); hpHsCacheSave(0);   HP_HS_N=HP_HS_SHOW; HP_HS_BUSY=false; hpHsBtn(); hpHsFltDraw(); await hpHsDraw(); return true;
  }catch(e){ hpHsSt(TF('hs_fail',{why:String((e&&e.message)||e)}),true); return false; } finally{ HP_HS_BUSY=false; hpHsBtn(); } }
async function hpHsDomains(list){ const need=list.filter(h=>!HP_HS_DOM.has(h.addr)); if(!need.length) return 0;
  try{ await hpXahauSess(async q=>{ for(const h of need){ try{ const r=await q({command:'account_info',account:h.addr,ledger_index:'validated'}); const d=r&&r.account_data&&r.account_data.Domain; HP_HS_DOM.set(h.addr,d?hpHexStr(d).replace(/[^\x20-\x7e]/g,'').trim().toLowerCase():''); }catch(e){ HP_HS_DOM.set(h.addr,''); } } },60000); }catch(e){}
  hpHsCacheSave(3000); return need.length; }
function hpHsDom(h){ const d=HP_HS_DOM.get(h.addr); return (d===undefined)?'':d; }

const HP_HS_STALE=3600e3;
const HP_HS_RETRY=10*60e3;
let HP_HS_AUTO=false, HP_HS_SAVE_T=null, HP_HS_TRY=0;
const HP_HS_IDB={ open(){ return new Promise((res,rej)=>{ if(typeof indexedDB==='undefined'||!indexedDB) return rej(new Error('no idb')); const r=indexedDB.open('handpost-cache',1); r.onupgradeneeded=()=>{ try{ r.result.createObjectStore('kv'); }catch(e){} }; r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error||new Error('idb')); }); },
  async get(k){ const db=await this.open(); return new Promise(res=>{ try{ const q=db.transaction('kv','readonly').objectStore('kv').get(k); q.onsuccess=()=>{ res(q.result||null); try{ db.close(); }catch(e){} }; q.onerror=()=>{ res(null); try{ db.close(); }catch(e){} }; }catch(e){ res(null); } }); },
  async put(k,v){ const db=await this.open(); return new Promise(res=>{ try{ const tx=db.transaction('kv','readwrite'); tx.objectStore('kv').put(v,k); tx.oncomplete=()=>{ try{ db.close(); }catch(e){} res(true); }; tx.onerror=()=>{ try{ db.close(); }catch(e){} res(false); }; }catch(e){ res(false); } }); } };
let HP_HS_CACHE=HP_HS_IDB;
function hpHsCacheSave(ms){ if(HP_HS_SAVE_T) clearTimeout(HP_HS_SAVE_T); HP_HS_SAVE_T=setTimeout(()=>{ HP_HS_SAVE_T=null; try{ if(!HP_HOSTS||HP_HOSTS.empty) return; Promise.resolve(HP_HS_CACHE.put('hosts',{hosts:HP_HOSTS.hosts,size:HP_HOSTS.size,freq:HP_HOSTS.freq,at:HP_HOSTS.at,med:HP_HOSTS.med,dom:[...HP_HS_DOM]})).catch(()=>{}); }catch(e){} },ms||0); return true; }
async function hpHsAuto(){ if(HP_HS_AUTO){ if(HP_HOSTS&&!HP_HOSTS.empty&&!HP_HS_BUSY&&!(Date.now()-(Number(HP_HOSTS.at)||0)<HP_HS_STALE)&&Date.now()-HP_HS_TRY>=HP_HS_RETRY){ HP_HS_TRY=Date.now(); hpHsLoad(); return 'stale'; } return ''; }   HP_HS_AUTO=true;
  if(HP_HOSTS&&!HP_HOSTS.empty) return 'have';
  if(!HP_HOSTS){ HP_HOSTS={hosts:[],size:3600,freq:1,at:Date.now(),med:0,empty:1}; hpHsBtn(); try{ hpHsFltDraw(); }catch(e){} try{ await hpHsDraw(); }catch(e){} }
  let c=null; try{ c=await HP_HS_CACHE.get('hosts'); }catch(e){}
  const ok=!!(c&&Array.isArray(c.hosts)&&c.hosts.length);
  if(ok&&HP_HOSTS&&HP_HOSTS.empty){ HP_HOSTS={hosts:c.hosts,size:c.size||3600,freq:c.freq||1,at:Number(c.at)||0,med:c.med||hpHsMedian(c.hosts)}; try{ for(const [a,d] of (c.dom||[])) if(!HP_HS_DOM.has(a)) HP_HS_DOM.set(a,d); }catch(e){} HP_HS_N=HP_HS_SHOW; hpHsBtn(); try{ hpHsFltDraw(); }catch(e){} try{ await hpHsDraw(); }catch(e){} }
  const stale=!ok||!(Date.now()-(Number(c.at)||0)<HP_HS_STALE);
  if(stale&&!HP_HS_BUSY){ HP_HS_TRY=Date.now(); hpHsLoad(); } return ok?(stale?'stale':'cache'):'none'; }

let HP_HS_FILL=false;
async function hpHsDomFill(){ if(HP_HS_FILL||!HP_HOSTS||HP_HOSTS.empty) return 0; HP_HS_FILL=true; let n=0;
  try{ const now=Date.now(), need=HP_HOSTS.hosts.filter(h=>!HP_HS_DOM.has(h.addr)&&hpHsPass(h,HP_HS_F,'q',now)).slice(0,1500);
    for(let i=0;i<need.length&&HP_HS_F.q;i+=100){ hpHsSt(TF('hs_dom_busy',{n:i,m:need.length})); const part=need.slice(i,i+100); await hpHsDomains(part); n+=part.length; await hpHsDraw(); } }
  catch(e){} finally{ HP_HS_FILL=false; }
  return n; }

function hpHsOpt(){ const g=document.getElementById('hs-sort'); return {sort:(g&&g.value)||'rep', F:HP_HS_F, col:HP_HS_COL  }; }
function hpHsGb(mb){ const g=(Number(mb)||0)/1024; return g>=10?String(Math.round(g)):hpNum(g,1); }
function hpHsTest(){ try{ const n=String(location.hostname||'').toLowerCase(); return n==='localhost'||n==='::1'||n==='[::1]'||/^127\./.test(n)||/^192\.168\./.test(n)||/^10\./.test(n)||/^172\.(1[6-9]|2\d|3[01])\./.test(n); }catch(e){ return false; } }
const HP_HS_TESTQ='';

let HP_HS_QT=null;
function hpHsFltSet(k,v){ HP_HS_F[k]=v; HP_HS_N=HP_HS_SHOW; hpHsFltDraw(); hpHsDraw(); hpHsDone(); if(k==='q'&&String(v||'').trim()&&typeof hpHsDomFill==='function') hpHsDomFill();   }

function hpHsDone(){ try{ if(!HP_HOSTS) return 0; const n=HP_HOSTS.hosts.filter(h=>hpHsPass(h,HP_HS_F,'')).length; if(typeof hpToast==='function') hpToast(TF('hs_f_done',{n:n}),1800); return n; }catch(e){ return 0; } }
function hpHsFltNow(F){ F=F||HP_HS_F; const a=[], L=k=>T(k)+' ';
  for(const v of F.cc) a.push({k:'cc',v:v,t:hpCcName(v)}); for(const v of F.tier) a.push({k:'tier',v:v,t:T(HP_HS_TK[v])}); for(const v of F.maker) a.push({k:'maker',v:v,t:T(HP_HS_MK[v])});
  if(F.cores) a.push({k:'cores',t:TF('hs_f_cores_v',{v:F.cores})}); if(F.ghz) a.push({k:'ghz',t:TF('hs_f_ghz_v',{v:F.ghz})});
  if(F.ram) a.push({k:'ram',t:L('hs_f_ram')+TF('hs_f_gb_v',{v:F.ram})}); if(F.disk) a.push({k:'disk',t:L('hs_f_disk')+TF('hs_f_gb_v',{v:F.disk})});
  if(F.price) a.push({k:'price',t:TF('hs_f_price_v',{v:hpNum(F.price,4)})}); if(F.free) a.push({k:'free',t:L('hs_f_free')+TF('hs_f_free_v',{v:F.free})}); if(F.live) a.push({k:'live',t:T('hs_f_live')});
  if(F.rep) a.push({k:'rep',t:L('hs_f_rep')+TF('hs_f_rep_v',{v:F.rep})}); if(F.days) a.push({k:'days',t:L('hs_f_days')+TF('hs_f_days_v',{v:F.days})});
  for(const v of F.ver) a.push({k:'ver',v:v,t:L('hs_f_ver')+v}); if(F.q) a.push({k:'q',t:TF('hs_f_q_v',{q:String(F.q).trim()})}); return a; }
function hpHsFltRm(x){ if(Array.isArray(HP_HS_F[x.k])) hpHsFltTog(x.k,x.v); else hpHsFltSet(x.k,x.k==='live'?false:(x.k==='q'?'':0)); }
function hpHsFltTog(k,v){ const a=HP_HS_F[k].slice(), i=a.indexOf(v); if(i<0) a.push(v); else a.splice(i,1); hpHsFltSet(k,a); }
function hpHsFltDraw(){ const box=document.getElementById('hs-flt'); if(!box||!HP_HOSTS) return false; const H=HP_HOSTS.hosts, F=HP_HS_F, now=Date.now();
  const wasOpen=box.querySelector('details')?box.querySelector('details').open:false;   const act=document.activeElement&&document.activeElement.id==='hs-q';
  box.textContent=''; const el=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.textContent=x; return e; };
  const dt=el('details'); dt.open=wasOpen; const sm=el('summary'); sm.style.cssText='cursor:pointer;font-size:14px;padding:4px 0';
  const hit=H.filter(h=>hpHsPass(h,F,'',now)).length; sm.textContent=TF('hs_f_title',{n:hit}); dt.appendChild(sm); box.appendChild(dt);
  const grid=el('div'); grid.style.cssText='display:grid;grid-template-columns:auto 1fr;gap:6px 10px;align-items:start;font-size:13px;margin:4px 0 8px'; dt.appendChild(grid);
  const row=(lab)=>{ const b=el('b',null,T(lab)); b.style.cssText='white-space:nowrap;padding-top:3px;font-weight:600'; const d=el('div'); d.style.cssText='display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center'; grid.appendChild(b); grid.appendChild(d); return d; };
  const chip=(d,key,val,label,n)=>{ const on=F[key].indexOf(val)>=0, lb=el('label'); lb.style.cssText='display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:12px;background:'+(on?'#2a4a6e':'#1b2740')+(on?';outline:1px solid #35d1b7':'')+';cursor:pointer;white-space:nowrap'+((!n&&!on)?';opacity:.4':'');
    const cb=el('input'); cb.type='checkbox'; cb.checked=on; cb.disabled=(!n&&!on); cb.style.margin='0'; cb.addEventListener('change',()=>hpHsFltTog(key,val)); lb.appendChild(cb); lb.appendChild(document.createTextNode(label+'（'+(n||0)+'）')); d.appendChild(lb); return lb; };
  const sel=(d,key,unit)=>{ const s=el('select'); s.id='hs-f-'+key; s.style.cssText='background:#1b2740;border:none;border-radius:6px;color:var(--ink);padding:3px 6px;font-size:13px';
    const o0=el('option',null,T('hs_f_any')); o0.value='0'; s.appendChild(o0);
    for(const v of HP_HS_OPT[key]){ const n=hpHsCountAt(H,key,v,F,now), o=el('option',null,TF(unit,{v:(key==='price'?hpNum(v,4):String(v))})+'（'+n+'）'); o.value=String(v); if(!n&&F[key]!==v) o.disabled=true; s.appendChild(o); }
    s.value=String(F[key]||0); if(F[key]){ s.style.background='#2a4a6e'; s.style.outline='1px solid #35d1b7'; } s.addEventListener('change',()=>hpHsFltSet(key,Number(s.value)||0)); d.appendChild(s); return s; };

  { const d=row('hs_f_cc'), c=hpHsCount(H,'cc',F,now), ks=Object.keys(c).filter(k=>/^[A-Z]{2}$/.test(k)); for(const k of F.cc) if(ks.indexOf(k)<0) ks.push(k); ks.sort((a,b)=>(c[b]||0)-(c[a]||0)||(a<b?-1:1)); d.style.maxHeight='92px'; d.style.overflowY='auto';
    for(const k of ks) chip(d,'cc',k,hpCcName(k),c[k]); }

  { const d=row('hs_f_tier'), c=hpHsCount(H,'tier',F,now); for(const k of HP_HS_TIERS) chip(d,'tier',k,T(HP_HS_TK[k]),c[k]); }

  { const d=row('hs_f_cpu'), c=hpHsCount(H,'maker',F,now); for(const k of HP_HS_MAKERS) chip(d,'maker',k,T(HP_HS_MK[k]),c[k]); sel(d,'cores','hs_f_cores_v'); sel(d,'ghz','hs_f_ghz_v'); }
  { const d=row('hs_f_ram'); sel(d,'ram','hs_f_gb_v'); }
  { const d=row('hs_f_disk'); sel(d,'disk','hs_f_gb_v'); }
  { const d=row('hs_f_price'); sel(d,'price','hs_f_price_v'); }
  { const d=row('hs_f_free'); sel(d,'free','hs_f_free_v'); const lb=el('label'); lb.style.cssText='display:inline-flex;align-items:center;gap:3px;white-space:nowrap'; const cb=el('input'); cb.type='checkbox'; cb.id='hs-f-live'; cb.checked=!!F.live; if(F.live){ lb.style.outline='1px solid #35d1b7'; lb.style.borderRadius='6px'; lb.style.padding='0 4px'; } cb.style.margin='0'; cb.addEventListener('change',()=>hpHsFltSet('live',cb.checked)); lb.appendChild(cb); lb.appendChild(document.createTextNode(T('hs_f_live'))); d.appendChild(lb); }
  { const d=row('hs_f_rep'); sel(d,'rep','hs_f_rep_v'); }
  { const d=row('hs_f_days'); sel(d,'days','hs_f_days_v'); }
  { const d=row('hs_f_ver'), c=hpHsCount(H,'ver',F,now), ks=Object.keys(c); for(const k of F.ver) if(ks.indexOf(k)<0) ks.push(k); ks.sort((a,b)=>{ const p=s=>s.split('.').map(Number); const x=p(a), y=p(b); for(let i=0;i<3;i++) if(x[i]!==y[i]) return (y[i]||0)-(x[i]||0); return 0; }); for(const k of ks) chip(d,'ver',k,k,c[k]); }
  { const d=row('hs_f_q'), q=el('input'); q.type='text'; q.id='hs-q'; q.value=F.q||''; q.placeholder=T('hs_f_q_ph'); q.setAttribute('autocomplete','off'); q.spellcheck=false; q.style.cssText='width:14em;max-width:100%;font-size:13px;padding:3px 6px'; if(F.q){ q.style.outline='1px solid #35d1b7'; q.style.background='#2a4a6e'; }
    q.addEventListener('input',()=>{ clearTimeout(HP_HS_QT); HP_HS_QT=setTimeout(()=>hpHsFltSet('q',q.value),350); }); d.appendChild(q);
    if(hpHsTest()){ const tb=el('button','b',T('btn_hs_test')); tb.id='btn-hs-test'; tb.style.cssText='font-size:12px;padding:3px 8px'; tb.addEventListener('click',()=>{ const G=HP_HS_F0(); G.q=HP_HS_TESTQ; G.free=1; HP_HS_F=G; HP_HS_N=HP_HS_SHOW; hpHsFltDraw(); hpHsDraw(); hpHsDone(); }); d.appendChild(tb); } }
  const clr=el('button','b',T('btn_hs_clear')); clr.id='btn-hs-clear'; clr.style.cssText='font-size:12px;padding:3px 10px;margin-bottom:6px'; clr.addEventListener('click',()=>{ HP_HS_F=HP_HS_F0(); HP_HS_N=HP_HS_SHOW; hpHsFltDraw(); hpHsDraw(); hpHsDone(); }); dt.appendChild(clr);
  { const nw=el('div'); nw.id='hs-f-now'; nw.style.cssText='display:flex;flex-wrap:wrap;gap:4px 6px;align-items:center;font-size:13px;margin:2px 0 6px'; const b=el('b',null,T('hs_f_now')); b.style.fontWeight='600'; nw.appendChild(b); const it=hpHsFltNow(F); if(!it.length) nw.appendChild(el('span',null,T('hs_f_none')));
    for(const x of it){ const c=el('button','b',x.t+' ×'); c.type='button'; c.title=T('hs_f_rm'); c.style.cssText='font-size:12px;padding:1px 8px;border-radius:12px;background:#2a4a6e;outline:1px solid #35d1b7'; c.addEventListener('click',()=>hpHsFltRm(x)); nw.appendChild(c); } box.appendChild(nw); }
  if(act){ try{ const q=document.getElementById('hs-q'); if(q){ q.focus(); const n=q.value.length; q.setSelectionRange(n,n); } }catch(e){} }
  return hit; }
function hpHsCpuText(h){ return h.cores?(h.cores+'×'+(h.mhz?hpNum(h.mhz/1000,1)+'GHz':'?')):'—'; }
async function hpHsDraw(){ const box=document.getElementById('hs-list'); if(!box||!HP_HOSTS) return -1; const gen=hpHsDraw.gen=(hpHsDraw.gen||0)+1;   const O=hpHsOpt(), col=(O&&O.col)||null  , all=hpHsView(HP_HOSTS.hosts,O), rows=all.slice(0,HP_HS_N), now=Date.now(), med=HP_HOSTS.med;
  hpHsSt(TF('hs_count',{n:all.length,t:HP_HOSTS.hosts.filter(h=>h.active).length,m:med?hpNum(med,6):'—'})+(all.length>rows.length?TF('hs_more_n',{n:rows.length}):'')+TF('hs_at',{t:(typeof fmtTS==='function'?fmtTS(HP_HOSTS.at):new Date(HP_HOSTS.at).toLocaleString())})+T('hs_at_hb'));
  await hpHsDomains(rows);
  if(gen!==hpHsDraw.gen) return -2;
  box.textContent=''; const tb=document.createElement('table'); tb.className='paytb hstb'; const hd=document.createElement('tr'); for(const k of ['hs_h_st','hs_h_cc','hs_h_dom','hs_h_price','hs_h_days','hs_h_free','hs_h_rep','hs_h_perf','hs_h_cpu','hs_h_ram','hs_h_disk','hs_h_age','hs_h_hb'])    { const th=document.createElement('th'); th.textContent=T(k)+(col&&col.k===k?(col.dir>0?' ▲':' ▼'):'');   try{ th.style.cursor='pointer'; th.style.whiteSpace='nowrap'; th.title=T('hs_h_tip'); th.addEventListener('click',()=>{ hpHsColSet(k); }); }catch(e){}   hd.appendChild(th); } tb.appendChild(hd);
  for(const h of rows){ const tr=document.createElement('tr'); tr.dataset.addr=h.addr; tr.style.cursor='pointer'; if(h.addr===HP_HS_PICK) tr.className='pick'; const pay=!(typeof hpUpCanPay==='function')||hpUpCanPay(h); if(!pay) tr.style.opacity='.5';   const dom=hpHsDom(h)||h.desc||(h.addr.slice(0,10)+'…');
    const hb0=(Number(HP_HOSTS.at)||now);   const cells=[T(h.active?'hs_st_on':'hs_st_off'), h.cc?(h.cc+' '+hpCcName(h.cc)):'—', dom, h.lease?hpNum(h.lease,6):'—'  , (typeof hpUpDaysText==='function')?hpUpDaysText(h):'—'  , h.free+'/'+h.maxI, (h.rep==null?'—':String(h.rep)), h.tier?(hpNum(h.perf,1)+' '+T(HP_HS_TK[h.tier])):'—', hpHsCpuText(h), h.ram?hpHsGb(h.ramI)+' GB':'—', h.disk?hpHsGb(h.diskI)+' GB':'—', h.regTs?hpDur(now-h.regTs*1000):'—', h.lhb?TF('hs_ago',{t:hpDur(Math.max(0,hb0-h.lhb*1000))}):'—'];
    cells.forEach((v,i)=>{ const td=document.createElement('td'); td.textContent=v; if(i===0){ td.style.color=h.active?'var(--teal)':'var(--red)'; td.style.whiteSpace='nowrap'; td.title=T('hs_st_tip'); } if(i===3&&hpHsHigh(h,med)){ td.style.color='var(--amber)'; td.title=T('hs_high_tip'); } if(i===2) td.className='mono'; if(i===4&&!pay){ td.style.color='var(--amber)'; td.title=T('hs_pay_tip'); }   if(i===8&&h.cpu) td.title=h.cpu;   if(i===cells.length-1&&!h.active) td.style.color='var(--red)'; tr.appendChild(td); });
    tr.addEventListener('click',()=>{ hpHsPick(h.addr); }); tb.appendChild(tr); }
  if(rows.length) box.appendChild(tb); else box.textContent=T('hs_none');
  if(all.length>rows.length){ const b=document.createElement('button'); b.className='b'; b.textContent=T('btn_hs_more'); b.style.marginTop='6px'; b.addEventListener('click',()=>{ HP_HS_N+=HP_HS_SHOW; hpHsDraw(); }); box.appendChild(b); }
  return rows.length; }
function hpHsLine(box,label,text,color){ const d=document.createElement('div'); d.className='kv'; const b=document.createElement('b'); b.textContent=label; const s=document.createElement('span'); s.textContent=text; if(color) s.style.color=color; d.appendChild(b); d.appendChild(s); box.appendChild(d); return s; }
async function hpHsPick(addr){ HP_HS_PICK=addr; const box=document.getElementById('hs-pick'); if(!box||!HP_HOSTS) return false; const h=HP_HOSTS.hosts.find(x=>x.addr===addr); if(!h) return false;
  try{ for(const tr of document.querySelectorAll('#hs-list tr[data-addr]')) tr.className=(tr.dataset.addr===addr)?'pick':''; }catch(e){}
  const now=Date.now(), med=HP_HOSTS.med, dom=hpHsDom(h)||h.desc; box.textContent=''; box.className='card'; box.style.marginTop='10px';
  const h2=document.createElement('h2'); h2.textContent=dom||addr; box.appendChild(h2);
  hpHsLine(box,T('hs_p_acct'),addr).className='mono';
  hpHsLine(box,T('hs_p_cc'),h.cc?(hpCcName(h.cc)+'（'+h.cc+'）'):'—');
  hpHsLine(box,T('hs_p_price'),h.lease?TF('hs_p_price_v',{p:hpNum(h.lease,6),m:hpHsPer30Text(h) }):'—');
  if(hpHsHigh(h,med)) hpHsLine(box,'',TF('hs_high',{x:(h.lease/med).toFixed(1),m:hpNum(med,6)}),'var(--amber)');
  hpHsLine(box,T('hs_p_free'),TF('hs_p_free_v',{f:h.free,n:h.maxI}));
  hpHsLine(box,T('hs_p_rep'),h.rep==null?'—':TF('hs_p_rep_v',{r:h.rep}));
  hpHsLine(box,T('hs_p_perf'),h.tier?TF('hs_p_perf_v',{p:hpNum(h.perf,1),t:T(HP_HS_TK[h.tier])}):'—');
  hpHsLine(box,T('hs_p_cpu'),h.cores?TF('hs_p_cpu_v',{m:h.cpu||'—',c:h.cores,g:h.mhz?hpNum(h.mhz/1000,2):'?'}):'—');
  hpHsLine(box,T('hs_p_ram'),h.ram?TF('hs_p_each_v',{a:hpHsGb(h.ramI),t:hpHsGb(h.ram),n:h.maxI}):'—');
  hpHsLine(box,T('hs_p_disk'),h.disk?TF('hs_p_each_v',{a:hpHsGb(h.diskI),t:hpHsGb(h.disk),n:h.maxI}):'—');
  hpHsLine(box,T('hs_p_age'),h.regTs?((typeof fmtTS==='function'?fmtTS(h.regTs*1000):new Date(h.regTs*1000).toLocaleString())+'（'+hpDur(now-h.regTs*1000)+'）'):'—');
  hpHsLine(box,T('hs_p_hb'),h.lhb?TF('hs_ago',{t:hpDur(Math.max(0,((HP_HOSTS&&Number(HP_HOSTS.at))||now)-h.lhb*1000))})  +(h.active?'':T('hs_dead')):'—',h.active?'':'var(--red)');
  { const s=hpHsLine(box,T('hs_p_up'),'…'); s.id='hs-p-up'; try{ if(typeof hpUpPick==='function') hpUpPick(h); }catch(e){} }
  hpHsLine(box,T('hs_p_ver'),h.ver);
  hpHsLine(box,T('hs_p_mon'),hpMonText(dom));
  const row=document.createElement('div'); row.className='row'; const rb=document.createElement('button'); rb.className='b pri'; rb.id='btn-hs-rent'; rb.textContent=T(((typeof hpXmLocal==='function')?hpXmLocal():hpHsTest())?'btn_hs_rent_t':'btn_hs_rent'); if(typeof HP_MOVE!=='undefined'&&HP_MOVE&&rb.textContent===T('btn_hs_rent')) rb.textContent=T('btn_hs_move');     rb.addEventListener('click',()=>{ hpHsRent(addr); });
  const xb=document.createElement('button'); xb.className='b'; xb.textContent=T('btn_lease_xpl'); xb.addEventListener('click',()=>{ try{ window.open(hpXplUrl(addr),'_blank','noopener'); }catch(_){} });
  let no=''; try{ const mv=typeof HP_MOVE!=='undefined'&&HP_MOVE; if(typeof hpBfOn==='function'&&hpBfOn()&&typeof HP_BF_ALLOW!=='undefined'&&!HP_BF_ALLOW) no=T('ob_lodge_no'); else if(typeof hpBoxSub==='function'&&hpBoxSub()) no=T('ob_owned'); else if(!mv&&typeof ID!=='undefined'&&ID&&!ID.rentJob&&((typeof hpRentOwned==='function'&&hpRentOwned())||(typeof hpRentAlive==='function'&&hpRentAlive()))) no=T('rn_owned'); }catch(e){ no=''; }   try{ if(typeof HP_OB_RE!=='undefined'&&HP_OB_RE&&no===T('ob_owned')){ no=''; if(HP_OB_RE==='move') rb.textContent=T('btn_hs_move'); } }catch(e){}
  try{ if(no===T('rn_owned')&&typeof hpBfOn==='function'&&hpBfOn()&&typeof HP_BF_ALLOW!=='undefined'&&HP_BF_ALLOW) no=''; }catch(e){}
  if(no){ rb.disabled=true; rb.title=no; }
  row.appendChild(rb); row.appendChild(xb); box.appendChild(row); if(no){ const nn=document.createElement('div'); nn.className='note'; nn.id='hs-rent-no'; nn.style.cssText='margin-top:6px;white-space:pre-line;color:var(--amber)'; nn.textContent=no; box.appendChild(nn); } return true; }
function hpHsDevCmd(addr){ return 'evernodecli acquire-and-deploy $c /usr/bin/node '+addr+' -a index.js -m 24 -i evernode/sashimono:hp.latest-ubt.20.04-njs.20'; }
async function hpHsRent(addr){ const h=HP_HOSTS&&HP_HOSTS.hosts.find(x=>x.addr===addr); if(!h) return false;
  if(hpHsHigh(h,HP_HOSTS.med)&&typeof hpAsk==='function'){ if(!(await hpAsk({text:TF('cf_hs_high',{x:(h.lease/HP_HOSTS.med).toFixed(1),m:hpNum(HP_HOSTS.med,6)}),danger:true}))) return false; }
  try{ if(typeof ID!=='undefined'&&ID){ ID.hostPick={addr:addr,dom:hpHsDom(h)||h.desc||'',lease:h.lease,at:Date.now()}; saveID(); } }catch(e){}
  if(((typeof hpXmLocal==='function')?hpXmLocal():hpHsTest())&&typeof hpAsk==='function'){ const cmd=hpHsDevCmd(addr), pre=document.createElement('pre'); pre.className='mono'; pre.id='hs-devcmd'; pre.textContent=cmd; pre.style.cssText='white-space:pre-wrap;word-break:break-all;font-size:12px;background:#0e1626;padding:8px;border-radius:6px;margin-top:8px';
    if(await hpAsk({title:T('hs_dev_title'),text:TF('hs_dev_text',{d:hpHsDom(h)||h.desc||addr}),node:pre,ok:T('btn_hs_devcopy')})){ try{ if(typeof hpCopyText==='function') hpCopyText(cmd); }catch(e){} } return true; }
  return hpRentStart(addr); }
function hpHsOpen(){ try{ const c=document.getElementById('post-hosts'); if(c){ c.style.display=''; if(c.scrollIntoView) c.scrollIntoView({behavior:'smooth',block:'start'}); } }catch(e){} hpHsBtn(); if(!HP_HOSTS||HP_HOSTS.empty) hpHsLoad(); }
function hpHsBoot(){ try{ const g=id=>document.getElementById(id);
  const w=(id,ev,f)=>{ const b=g(id); if(b&&!b.dataset.hpWired){ b.dataset.hpWired='1'; b.addEventListener(ev,f); } };
  w('btn-hs-load','click',()=>{ hpHsLoad(); }); w('hs-sort','change',()=>{ HP_HS_COL=null;   HP_HS_N=HP_HS_SHOW; hpHsDraw(); }); w('btn-pt-rent','click',hpHsOpen);
  }catch(e){} }
try{ if(typeof document!=='undefined'&&document.getElementById&&document.getElementById('post-hosts')) hpHsBoot(); }catch(e){}

const HP_DAY_SP={"dog-a":{"w":19,"h":13,"p":[["#b8692a",[12,0,1,1,16,0,1,1,11,1,1,1,16,1,1,1,2,4,1,1,1,5,1,1,3,5,1,1,1,6,1,1]],["#d98a3d",[12,1,1,1,15,1,1,1,11,2,7,1,10,3,3,1,14,3,2,1,17,3,1,1,10,4,2,1,2,5,1,1,2,6,1,1,4,6,9,1,2,7,12,1,3,8,11,1,3,9,1,1,8,9,5,1,3,10,1,1,5,10,1,1,12,10,1,1,14,10,1,1,3,11,1,1,5,11,1,1,12,11,1,1,14,11,1,1]],["#23201d",[13,3,1,1,18,4,1,1,3,12,1,1,5,12,1,1,12,12,1,1,14,12,1,1]],["#f5e6c8",[16,3,1,1,12,4,6,1,12,5,4,1,13,6,3,1,14,7,1,1,14,8,2,1,4,9,4,1,13,9,2,1]],["#d94a4a",[9,5,3,1]],["#ef8aa0",[16,5,1,1]]]},"dog-b":{"w":19,"h":13,"p":[["#b8692a",[12,0,1,1,16,0,1,1,11,1,1,1,16,1,1,1,2,4,1,1,1,5,1,1,3,5,1,1,1,6,1,1]],["#d98a3d",[12,1,1,1,15,1,1,1,11,2,7,1,10,3,3,1,14,3,2,1,17,3,1,1,10,4,2,1,2,5,1,1,2,6,1,1,4,6,9,1,2,7,12,1,3,8,11,1,3,9,1,1,8,9,5,1,2,10,1,1,6,10,1,1,11,10,1,1,15,10,1,1,1,11,1,1,7,11,1,1,10,11,1,1,16,11,1,1]],["#23201d",[13,3,1,1,18,4,1,1,1,12,1,1,7,12,1,1,10,12,1,1,16,12,1,1]],["#f5e6c8",[16,3,1,1,12,4,6,1,12,5,4,1,13,6,3,1,14,7,1,1,14,8,2,1,4,9,4,1,13,9,2,1]],["#d94a4a",[9,5,3,1]],["#ef8aa0",[16,5,1,1]]]},"dog-sit":{"w":15,"h":13,"p":[["#b8692a",[8,0,1,1,12,0,1,1,7,1,1,1,12,1,1,1,2,4,1,1,1,5,1,1,3,5,1,1,1,6,1,1]],["#d98a3d",[8,1,1,1,11,1,1,1,7,2,7,1,6,3,3,1,10,3,2,1,13,3,1,1,6,4,2,1,2,5,1,1,2,6,1,1,5,6,4,1,2,7,1,1,4,7,5,1,3,8,6,1,3,9,7,1,3,10,7,1,3,11,1,1,6,11,5,1]],["#23201d",[9,3,1,1,14,4,1,1,3,12,2,1,6,12,2,1,10,12,2,1]],["#f5e6c8",[12,3,1,1,8,4,6,1,9,5,4,1,9,6,4,1,9,7,3,1,9,8,2,1,10,9,2,1,10,10,3,1,4,11,2,1,11,11,2,1]],["#d94a4a",[6,5,3,1]],["#ef8aa0",[13,5,1,1]]]},"dog-nap":{"w":14,"h":5,"p":[["#b8692a",[8,0,1,1,10,0,1,1,2,1,1,1,7,1,1,1,9,1,1,1,11,1,1,1,1,2,1,1,3,2,1,1]],["#d98a3d",[8,1,1,1,10,1,1,1,2,2,1,1,4,2,9,1,1,3,9,1,2,4,2,1]],["#f5e6c8",[13,2,1,1,10,3,1,1,4,4,9,1]],["#23201d",[11,3,3,1]]]},"doghouse":{"w":16,"h":16,"p":[["#9e3a2d",[7,0,2,1,6,1,1,1,9,1,1,1,5,2,1,1,10,2,1,1,4,3,1,1,11,3,1,1,3,4,1,1,12,4,1,1,2,5,1,1,13,5,1,1,1,6,1,1,14,6,1,1,0,7,16,1]],["#c94f3d",[7,1,2,1,6,2,4,1,5,3,6,1,4,4,8,1,3,5,10,1,2,6,12,1]],["#b7874f",[1,8,1,1,3,8,10,1,14,8,1,1,1,9,1,1,3,9,4,1,9,9,4,1,14,9,1,1,1,10,1,1,3,10,3,1,10,10,3,1,14,10,1,1,1,11,1,1,3,11,2,1,11,11,2,1,14,11,1,1,1,12,1,1,3,12,2,1,11,12,2,1,14,12,1,1,1,13,1,1,3,13,2,1,11,13,2,1,14,13,1,1,1,14,1,1,3,14,2,1,11,14,2,1,14,14,1,1]],["#8f6538",[2,8,1,1,13,8,1,1,2,9,1,1,13,9,1,1,2,10,1,1,13,10,1,1,2,11,1,1,13,11,1,1,2,12,1,1,13,12,1,1,2,13,1,1,13,13,1,1,2,14,1,1,13,14,1,1,1,15,14,1]],["#1a1410",[7,9,2,1,6,10,4,1,5,11,6,1,5,12,6,1,5,13,6,1,5,14,6,1]]]},"rock":{"w":8,"h":5,"p":[["#8b8f96",[2,0,1,1,5,0,1,1,1,1,3,1,6,1,1,1,0,2,6,1,7,2,1,1,0,3,7,1]],["#b3b8bf",[3,0,2,1,4,1,2,1,6,2,1,1,7,3,1,1]],["#5d6168",[0,4,8,1]]]},"log":{"w":13,"h":5,"p":[["#8a5a34",[1,0,10,1,0,1,1,1,2,1,9,1,0,2,6,1,7,2,4,1,0,3,1,1,2,3,9,1,1,4,10,1]],["#6b4226",[11,0,1,1,1,1,1,1,12,1,1,1,6,2,1,1,1,3,1,1,12,3,1,1,11,4,1,1]],["#d9b37a",[11,1,1,1,11,2,2,1,11,3,1,1]]]},"mush":{"w":6,"h":6,"p":[["#d9483b",[1,0,4,1,0,1,1,1,2,1,2,1,5,1,1,1,0,2,6,1]],["#f5f0e6",[1,1,1,1,4,1,1,1]],["#efe3c8",[2,3,2,1,2,4,2,1,1,5,4,1]]]},"puddle":{"w":13,"h":3,"p":[["#3f7cb8",[2,0,8,1,1,1,2,1,5,1,7,1,0,2,8,1,10,2,2,1]],["#9cc7ee",[3,1,2,1,8,2,2,1]]]},"cottage":{"w":46,"h":34,"p":[["#7e3f2d",[31,0,4,1,32,1,1,1,31,2,1,1,34,2,1,1,33,3,1,1,32,4,1,1,31,5,1,1,34,5,1,1,33,6,1,1,32,7,1,1,31,8,1,1,34,8,1,1]],["#a4543c",[31,1,1,1,33,1,2,1,32,2,2,1,31,3,2,1,34,3,1,1,31,4,1,1,33,4,2,1,32,5,2,1,31,6,2,1,34,6,1,1,31,7,1,1,33,7,2,1,32,8,2,1]],["#a9652e",[15,3,16,1,12,4,4,1,30,4,1,1,9,5,4,1,35,5,2,1,8,6,23,1,35,6,3,1,6,7,3,1,37,7,3,1,5,8,2,1,39,8,2,1,4,9,38,1,3,10,2,1,41,10,2,1,2,11,2,1,42,11,2,1,1,12,44,1,1,13,2,1,43,13,2,1,0,14,2,1,44,14,2,1,0,15,46,1,0,16,1,1,45,16,1,1,0,17,1,1,45,17,1,1,0,18,46,1]],["#d08a45",[16,4,14,1,13,5,18,1,9,7,22,1,35,7,2,1,7,8,24,1,35,8,4,1,5,10,36,1,4,11,38,1,3,13,40,1,2,14,42,1,1,16,44,1,1,17,44,1]],["#9a7650",[5,19,1,1,40,19,1,1,5,20,1,1,40,20,1,1,5,21,1,1,40,21,1,1,5,22,1,1,40,22,1,1,5,23,1,1,40,23,1,1,5,24,1,1,40,24,1,1,5,25,1,1,40,25,1,1,5,26,1,1,40,26,1,1,5,27,1,1,40,27,1,1,5,28,1,1,40,28,1,1,5,29,1,1,40,29,1,1,5,30,1,1,40,30,1,1,5,31,1,1,40,31,1,1,5,32,1,1,40,32,1,1,5,33,3,1,19,33,22,1]],["#f0e0bd",[6,19,34,1,6,20,34,1,6,21,34,1,6,22,34,1,6,23,34,1,6,24,34,1,6,25,34,1,6,26,34,1,6,27,34,1,6,28,34,1,6,29,19,1,26,29,2,1,29,29,2,1,32,29,2,1,35,29,5,1,6,30,18,1,36,30,4,1,6,31,18,1,36,31,4,1,6,32,34,1]],["#f08aa8",[25,29,1,1,31,29,1,1]],["#f2cf5b",[28,29,1,1,34,29,1,1]],["#8a5a34",[24,30,12,1]],["#6b4226",[24,31,12,1]],["#5f8a4a",[1,33,4,1,41,33,4,1]],["#b9a58a",[8,33,11,1]]]},"door":{"w":8,"h":11,"p":[["#3f8f6a",[2,0,4,1,1,1,6,1,0,2,8,1,0,3,8,1,0,4,8,1,0,5,8,1,0,6,6,1,7,6,1,1,0,7,8,1,0,8,8,1,0,9,8,1,0,10,8,1]],["#f2cf5b",[6,6,1,1]]]},"win":{"w":6,"h":6,"p":[["#8a6a4a",[1,0,4,1,0,1,1,1,5,1,1,1,0,2,1,1,5,2,1,1,0,3,1,1,5,3,1,1,0,4,1,1,5,4,1,1,1,5,4,1]],["#2a3550",[1,1,2,1,4,1,1,1,1,2,1,1,3,2,2,1,1,3,4,1,1,4,2,1,4,4,1,1]],["#3c4a6a",[3,1,1,1,2,2,1,1,3,4,1,1]]]},"winlit":{"w":6,"h":6,"p":[["#8a6a4a",[1,0,4,1,0,1,1,1,5,1,1,1,0,2,1,1,5,2,1,1,0,3,1,1,5,3,1,1,0,4,1,1,5,4,1,1,1,5,4,1]],["#ffd66b",[1,1,2,1,4,1,1,1,1,2,1,1,3,2,2,1,1,3,4,1,1,4,2,1,4,4,1,1]],["#fff0b0",[3,1,1,1,2,2,1,1,3,4,1,1]]]},"room":{"w":34,"h":17,"p":[["#f6e7c9",[0,0,34,1,0,1,3,1,4,1,7,1,12,1,7,1,20,1,7,1,28,1,6,1,0,2,34,1,0,3,2,1,8,3,26,1,0,4,2,1,8,4,22,1,32,4,2,1,0,5,2,1,8,5,21,1,33,5,1,1,0,6,2,1,8,6,22,1,32,6,2,1,0,7,2,1,8,7,22,1,32,7,2,1,0,8,29,1,33,8,1,1,0,9,34,1,0,10,3,1,4,10,7,1,12,10,7,1,20,10,7,1,28,10,6,1,0,11,34,1]],["#e8d3aa",[3,1,1,1,11,1,1,1,19,1,1,1,27,1,1,1,3,10,1,1,11,10,1,1,19,10,1,1,27,10,1,1]],["#8a6a4a",[2,3,6,1,2,4,1,1,7,4,1,1,2,5,1,1,7,5,1,1,2,6,1,1,7,6,1,1,30,6,2,1,2,7,6,1,30,7,2,1,29,8,4,1]],["#f4f1e8",[3,4,4,1,3,5,1,1,6,5,1,1,3,6,4,1]],["#f2cf5b",[30,4,2,1,29,5,4,1]],["#d94a4a",[4,5,2,1]],["#b98a57",[0,12,34,1,0,14,34,1,0,15,34,1]],["#9e7447",[0,13,34,1,0,16,34,1]]]},"bed":{"w":22,"h":8,"p":[["#7a4f2c",[0,0,2,1,0,1,2,1,0,2,2,1,0,3,2,1,21,3,1,1,0,4,2,1,7,4,1,1,13,4,1,1,21,4,1,1,0,5,2,1,21,5,1,1,0,6,22,1,0,7,2,1,20,7,2,1]],["#f4f1e8",[2,2,2,1,2,3,3,1,2,4,2,1]],["#4f78b8",[5,3,16,1,4,4,3,1,8,4,5,1,14,4,7,1,2,5,19,1]]]}};
const HP_DAY_SYMS=['hp-rb-a','hp-rb-b','hp-rb-joy','hp-mbox','hp-env','hp-house'];
const HP_DAY_ROOF=['#b8483a','#3f7a4a','#3b5f9a','#7a4a8a','#c07a2a'], HP_DAY_WALL=['#e6d3b0','#cfe0e8','#ecc9bf','#d8e2bf','#4c5d7a'], HP_DAY_PETS=['🐈','🐕','🐓','🐢','🐇'], HP_DAY_FL=[['#ff7a9a','#ffd166'],['#b388ff','#ffffff'],['#ff8a50','#ffe07a'],['#7fd3ff','#ff9ab8']];
const HP_DAY_MAXW=640;
let HP_DAY=null;
function hpDaySym(id,doc){ try{ doc=doc||document; const s=doc.getElementById(id); if(!s) return null; const vb=String(s.getAttribute('viewBox')||'').split(/[\s,]+/).map(Number); if(!(vb[2]>0&&vb[3]>0)) return null; const p=[];
  for(const e of s.querySelectorAll('path')){ const f=e.getAttribute('fill'), d=String(e.getAttribute('d')||''); if(!f||!d) continue; const r=[]; const re=/M(\d+) (\d+)h(\d+)v(\d+)/g; let m; while((m=re.exec(d))) r.push(+m[1],+m[2],+m[3],+m[4]); if(r.length) p.push([f,r]); }
  return p.length?{w:vb[2],h:vb[3],p:p}:null; }catch(e){ return null; } }
function hpDaySprites(doc){ const o=Object.assign({},HP_DAY_SP); for(const k of HP_DAY_SYMS){ const s=hpDaySym(k,doc); if(s) o[k]=s; } return o; }
function hpDayHash(s){ let h=2166136261; s=String(s||''); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h>>>0; }
function hpDayLook(addr){ const h=hpDayHash(addr||'handpost'); return {roof:HP_DAY_ROOF[h%5],wall:HP_DAY_WALL[(h>>>3)%5],pet:(h>>>6)%5,fl:HP_DAY_FL[(h>>>9)%4]}; }
function hpDayPeer(){ try{ if(typeof CONV_OPEN!=='undefined'&&CONV_OPEN&&typeof CURPEER!=='undefined'&&CURPEER) return String(CURPEER); const c=(typeof contacts==='function')?contacts():[]; if(Array.isArray(c)) for(const x of c) if(x&&x.address) return String(x.address); }catch(e){} return ''; }
function hpDayPlan(W){ W=Math.max(140,Number(W)||140); const HX=2, RX0=HX+26, XP=Math.max(RX0+40,Math.min(W-90,Math.round(W*0.62))), Lg=W+120, L=W+110, GO=13000, WAY=18000;
  const hw=Math.round(Math.min(4500,Math.max(2300,(XP-(HX+86))/0.09)));
  const ST={}; for(const [k,t] of [['walk',0],['dogout',2300],['dogrun',3000],['play',3900],['walk2',7300],['mail',9300],['walkdoor',10500],['enter',11800],['inside',13400],['sleep',14600],['fade',19200],['end',21200]]) ST[k]=t===0?0:t+(hw-2300);
  const ph=[['morn',9800],['go',GO],['post',5600],['way',WAY],['home',ST.end]]; let t0=0; const at={}; for(const [k,d] of ph){ at[k]={t0:t0,d:d}; t0+=d; }
  return {W,HX,RX0,XP,Lg,L,GO,WAY,ST,at,total:t0}; }
function hpDayPhase(P,t){ for(const k of ['morn','go','post','way','home']){ const a=P.at[k]; if(t<a.t0+a.d) return {k:k,a:t-a.t0,u:(t-a.t0)/a.d}; } return {k:'end',a:t-P.total,u:1}; }
function hpDayMake(cv,SP,o){ o=o||{};
  const TX=(k,v,i)=>{ let s=''; try{ s=(typeof T==='function')?String(T(k)||''):''; }catch(e){} if(!s||s===k) s=(o.L&&o.L[k])||k; const a=s.split('|'); s=a[Math.max(0,Math.min(a.length-1,i|0))]; if(v) for(const n in v) s=s.split('{'+n+'}').join(v[n]); return s; };
  const ctx=cv.getContext('2d'), GY=38, RS=0.62, RW=34*RS, RH=36*RS, JH=13, JMS=720;
  let W=140, S=1, css=1, R=null, P=null, raf=0;
  const clock=()=>(typeof performance!=='undefined'&&performance.now)?performance.now():Date.now();
  function fit(){ try{ const r=cv.getBoundingClientRect(), dpr=Math.max(1,(typeof window!=='undefined'&&window.devicePixelRatio)||1); if(!r||!r.height) return false; css=r.height/40; W=Math.max(140,r.width/css); cv.width=Math.round(r.width*dpr); cv.height=Math.round(r.height*dpr); S=cv.height/40; return true; }catch(e){ return false; } }
  function spr(k,x,y,sc,flip,al,map){ const sp=SP[k]; if(!sp) return; sc=sc||1; ctx.save(); if(al!=null) ctx.globalAlpha*=al; ctx.translate(x+(flip?sp.w*sc:0),y); ctx.scale(flip?-sc:sc,sc); for(const [c,r] of sp.p){ ctx.fillStyle=(map&&map[c])||c; for(let i=0;i<r.length;i+=4) ctx.fillRect(r[i],r[i+1],r[i+2],r[i+3]); } ctx.restore(); }
  function txt(t,x,y,px,col,al,left){ const u=Math.max(px||5,11/css); ctx.save(); if(al!=null) ctx.globalAlpha*=Math.max(0,al); ctx.font=u+'px system-ui,sans-serif'; ctx.textAlign=left?'left':'center'; ctx.textBaseline='alphabetic'; ctx.fillStyle=col||'#f4f1e8'; ctx.fillText(t,x,y); ctx.restore(); return u; }
  function bubble(t,x,y,al){ if(!t) return; const u=Math.max(5,11/css); ctx.save(); if(al!=null) ctx.globalAlpha*=al; ctx.font=u+'px system-ui,sans-serif'; const w=ctx.measureText(t).width+u*0.8, h=u*1.35; const bx=Math.max(1,Math.min(W-w-1,x-w/2)), by=Math.max(0.5,y-h); ctx.fillStyle='#f4f1e8'; ctx.fillRect(bx,by,w,h); ctx.fillStyle='#2a2320'; ctx.textAlign='left'; ctx.textBaseline='middle'; ctx.fillText(t,bx+u*0.4,by+h/2+u*0.05); ctx.restore(); }
  const cl=v=>Math.max(0,Math.min(1,v)), lerp=(a,b,u)=>a+(b-a)*cl(u), mix=(c1,c2,u)=>{ const p=c=>[1,3,5].map(i=>parseInt(c.substr(i,2),16)); const A=p(c1), B=p(c2); return 'rgb('+A.map((v,i)=>Math.round(lerp(v,B[i],u))).join(',')+')'; }, win=(a,t0,t1)=>a>=t0&&a<t1;
  const OUCH={rock:'bot_ouch',log:'bot_trip',mush:'bot_squish',puddle:'bot_splash'}, FX={rock:'💫',log:'💫',mush:'🍄',puddle:'💦'};
  function plan(){ const Q=hpDayPlan(W), X=Q.XP, L=Q.L, Pw=p=>X+16-p*L;
    const kinds=['rock','log','mush','puddle','rock','log','mush','rock','puddle','log']; Q.obs=[0.1,0.17,0.24,0.31,0.49,0.56,0.63,0.7,0.77,0.84].map((p,i)=>({p:p,k:kinds[i],wx:Pw(p)}));
    Q.env=[0.14,0.21,0.35,0.45,0.53,0.6,0.67,0.74,0.81,0.88].map((p,i)=>({p:p,wx:Pw(p)+2,y:3+(i*3)%5,gold:i===6}));
    Q.pines=[0.13,0.16,0.27,0.29,0.58,0.61,0.73,0.75].map(Pw); Q.grass=[0.08,0.2,0.34,0.47,0.6,0.79,0.9].map(Pw); Q.tree=Pw(0.05); Q.river=Pw(0.41); Q.rab=Pw(0.23); Q.deer=Pw(0.52); Q.fox=Pw(0.66); Q.owl=Pw(0.8);
    Q.mt=[]; for(let x=-L*0.3-30;x<W+40;x+=30) Q.mt.push(x);
    const DX=X+38+Q.Lg, a0=Q.RX0+70, a1=DX-60, sp=Math.max(1,a1-a0), at=f=>a0+f*sp;
    Q.gt=[0.05,0.22,0.4,0.62,0.83].map(at); Q.gfl=[0.12,0.3,0.5,0.7,0.92].map(at); Q.gbf=[0.18,0.55,0.88].map(at); Q.pond=at(0.46); Q.gg=[]; for(let x=Q.RX0+30;x<DX+60;x+=37) Q.gg.push(x);
    Q.hills=[]; for(let x=-40;x<W+Q.Lg*0.3+60;x+=46) Q.hills.push(x); Q.DX=DX; return Q; }
  function play(){ stop(); fit(); P=plan(); const now=clock(); R={t0:now,last:now,t:0,jump:-1,trip:-1,manual:false,tapped:false,score:0,combo:1,letters:0,miss:0,pops:[],best:0,look:hpDayLook(o.peer||''),ph:''};
    try{ R.best=Number(localStorage.getItem('p2p_waybest')||0)||0; }catch(e){} tick(); return R; }
  function stop(){ if(raf&&typeof cancelAnimationFrame==='function') cancelAnimationFrame(raf); raf=0; R=null; try{ ctx.setTransform(1,0,0,1,0,0); ctx.clearRect(0,0,cv.width,cv.height); }catch(e){} }
  function tap(){ if(!R||!P) return false; const k=hpDayPhase(P,R.t).k; if(k!=='go'&&k!=='way') return false; if(k==='way'&&!R.manual) R.manual=true; R.tapped=true; if(R.jump<0||R.t-R.jump>JMS) R.jump=R.t; return true; }
  function jumpY(t){ if(R.jump<0) return 0; const u=(t-R.jump)/JMS; return (u>=0&&u<=1)?JH*4*u*(1-u):0; }
  function pop(ms,x,y,s,col){ R.pops.push({t0:R.t,t:ms,x:x,y:y,s:s,col:col}); }
  function tick(){ if(typeof requestAnimationFrame!=='function') return; raf=requestAnimationFrame(tick); if(!R) return; const now=clock(); const dt=Math.min(80,now-R.last); R.last=now; R.t+=dt; draw(R.t); }
  function frame(t){ if(!R) return null; R.t=t; draw(t); return R?hpDayPhase(P,t):null; }
  function bot(x,ry,k,flip,al,rot){ if(!(al>0)) return; ctx.save(); ctx.globalAlpha*=al; ctx.translate(x+RW/2,GY-ry); if(rot) ctx.rotate(rot); spr(k,-RW/2,-RH,RS,flip); ctx.restore(); }
  function carry(x,ry){ spr('hp-env',x+14.5,GY-ry-RH+11.2,0.6); }
  function walkK(t){ return (Math.floor(t/180)%2)?'hp-rb-a':'hp-rb-b'; }
  function bedBot(hx,al){ ctx.save(); ctx.globalAlpha*=al; ctx.translate(hx+15.5,GY-4.6); ctx.rotate(-Math.PI/2); ctx.scale(0.36,0.36); ctx.beginPath(); ctx.rect(4,-2,20,17); ctx.clip(); spr('hp-rb-a',0,0,1,false); ctx.restore();
    ctx.save(); ctx.globalAlpha*=al; ctx.fillStyle='#4f78b8'; ctx.fillRect(hx+21,GY-8,14,4.2); ctx.fillStyle='#6f95cf'; ctx.fillRect(hx+23,GY-8,3,1); ctx.fillRect(hx+29,GY-8,3,1); ctx.fillStyle='#3d609a'; ctx.fillRect(hx+21,GY-4.8,14,1); ctx.restore(); }
  function home(hx,cut,lit,doorOpen,lampOff){ spr('cottage',hx,GY-34,1);
    if(cut>0){ spr('room',hx+6,GY-17,1,false,cut); spr('bed',hx+13,GY-9,1,false,cut); }
    ctx.save(); ctx.globalAlpha*=(1-cut); if(doorOpen){ ctx.fillStyle='#120d0a'; ctx.fillRect(hx+9,GY-12,8,11); } else spr('door',hx+9,GY-12,1); spr(lit?'winlit':'win',hx+27,GY-19,1); ctx.restore();
    spr('hp-mbox',hx+48,GY-22,1); spr('doghouse',hx+64,GY-16,1); }
  function lamp(hx,v){ if(v>0){ ctx.fillStyle='rgba(10,14,30,'+(0.55*v)+')'; ctx.fillRect(hx+6,GY-17,34,16); } }
  function dog(k,x,dy,flip,al){ if(SP[k]) spr(k,x,GY-SP[k].h-(dy||0)+0.5,1,flip,al==null?1:al); }
  function dest(dx,lit){ const L0=R.look, fl=L0.fl; if(dx>W+60||dx<-70) return;
    spr('hp-mbox',dx-16,GY-22,1); spr('hp-house',dx,GY-33,1,false,1,{'#3b4863':L0.roof,'#4c5d7a':L0.wall,'#7fe6d3':lit?'#ffd66b':'#2a3550'});
    for(let i=0;i<8;i++){ const fx=dx+3+i*2.6+(i>3?14:0); if(fx>dx+45) break; ctx.fillStyle='#4f8a45'; ctx.fillRect(fx,GY-2,0.6,2); ctx.fillStyle=fl[i%2]; ctx.fillRect(fx-0.7,GY-3.2,2,1.4); } }
  function roundTree(x,dark){ ctx.fillStyle='#6a4a2e'; ctx.fillRect(x-0.7,GY-7,1.4,7); ctx.fillStyle=mix('#4f8a45','#24402a',dark); for(const [cx,cy,r] of [[x,GY-11,5],[x-3.4,GY-8.5,3.6],[x+3.4,GY-8.5,3.6]]){ ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill(); } ctx.fillStyle=mix('#6aa55a','#2e4a32',dark); ctx.fillRect(x-2,GY-14,2,1.2); }
  function flowers(x,i){ const c=[['#ff7a9a','#ffd166'],['#ffffff','#b388ff'],['#ffe07a','#ff8a50']][i%3]; for(let j=0;j<4;j++){ ctx.fillStyle='#4f8a45'; ctx.fillRect(x+j*2.2,GY-2.4,0.6,2.4); ctx.fillStyle=c[j%2]; ctx.fillRect(x+j*2.2-0.7,GY-3.6,2,1.4); } }
  function tuft(x){ ctx.strokeStyle='#5f8a4a'; ctx.lineWidth=.8; ctx.beginPath(); ctx.moveTo(x,GY); ctx.lineTo(x+1.5,GY-3); ctx.lineTo(x+3,GY); ctx.stroke(); }
  function sky(ph,t){ const k=ph.k, a=ph.a; let c, dark=0;
    if(k==='morn'){ const u=cl(a/7000); c=u<0.5?mix('#1c2440','#d98e6c',u*2):mix('#d98e6c','#7fb3e0',(u-0.5)*2); dark=cl(1-a/2600); }
    else if(k==='go'||k==='post') c='#7fb3e0'; else if(k==='way'){ const u=ph.u; c=u<0.72?mix('#7fb3e0','#d98e5c',u/0.72):mix('#d98e5c','#1d2644',(u-0.72)/0.28); dark=cl((u-0.78)/0.22); } else { c=mix('#1d2644','#141a30',a/4000); dark=1; }
    ctx.fillStyle=c; ctx.fillRect(0,0,W,40);
    let sy=null, sx=W*0.72; if(k==='morn') sy=lerp(GY+5,9,(a-1400)/5600); else if(k==='go'||k==='post') sy=9; else if(k==='way') sy=lerp(9,GY+5,(ph.u-0.35)/0.45);
    if(sy!=null&&sy<GY+4){ ctx.fillStyle='rgba(255,220,140,.35)'; ctx.beginPath(); ctx.arc(sx,sy,5,0,7); ctx.fill(); ctx.fillStyle='#ffd27a'; ctx.beginPath(); ctx.arc(sx,sy,3.2,0,7); ctx.fill(); }
    if(dark>0){ ctx.save(); ctx.globalAlpha*=dark; ctx.fillStyle='#f3e9b5'; ctx.beginPath(); ctx.arc(W*0.4,8,3.2,0,7); ctx.fill(); ctx.fillStyle=c; ctx.beginPath(); ctx.arc(W*0.4+1.4,7.2,2.8,0,7); ctx.fill(); ctx.fillStyle='#e8e2c8'; for(let i=0;i<12;i++) ctx.fillRect((i*53+17)%W,2+(i*7)%14,1,1); ctx.restore(); }
    const day=1-dark; if(day>0.05&&k!=='home'){ ctx.save(); ctx.globalAlpha*=0.75*day; ctx.fillStyle='#f4f7fb'; for(let i=0;i<3;i++){ const x=((i*W/3+t*0.003)%(W+40))-20, y=5+i*3; ctx.beginPath(); ctx.ellipse(x,y,6,1.8,0,0,7); ctx.ellipse(x+3,y-1.2,3.2,1.6,0,0,7); ctx.fill(); } ctx.restore(); }
    return dark; }
  function draw(t){ const ph=hpDayPhase(P,t), k=ph.k, a=ph.a, ST=P.ST, X=P.XP, HX=P.HX;
    if(k==='end'){ const r=R; stop(); if(o.onEnd) try{ o.onEnd(r); }catch(e){} return; }
    if(k!==R.ph){ R.ph=k; if(k==='post'||k==='home') R.jump=-1; }
    ctx.setTransform(S,0,0,S,0,0); ctx.imageSmoothingEnabled=false; ctx.clearRect(0,0,W,40);
    let ga=1; if(k==='home'&&a>ST.fade) ga=cl(1-(a-ST.fade)/(ST.end-ST.fade)); ctx.globalAlpha=ga;
    const dark=sky(ph,t);
    const sg=k==='morn'?0:(k==='go'?P.Lg*ph.u:P.Lg), sw=k==='way'?P.L*ph.u:(k==='home'?P.L:0);
    const far=-sg*0.3+sw*0.3;
    if(k==='way'||k==='home'){ ctx.save(); ctx.globalAlpha*=(k==='way'?cl(ph.u*3):1); for(let i=0;i<P.mt.length;i++){ const x=P.mt[i]+sw*0.3, h=13+(i*7)%10, w=20+(i*5)%9; ctx.fillStyle=mix(i%2?'#34455a':'#415369','#1c2536',dark); ctx.beginPath(); ctx.moveTo(x-w,GY+0.5); ctx.lineTo(x,GY+0.5-h); ctx.lineTo(x+w,GY+0.5); ctx.fill(); ctx.fillStyle='rgba(223,230,238,.8)'; ctx.beginPath(); ctx.moveTo(x-3.6,GY+4.5-h); ctx.lineTo(x,GY+0.5-h); ctx.lineTo(x+3.6,GY+4.5-h); ctx.fill(); } ctx.restore(); }
    for(let i=0;i<P.hills.length;i++){ const x=P.hills[i]+far; if(x<-40||x>W+40) continue; ctx.fillStyle=mix(i%2?'#6fa060':'#5f8f55','#22382a',Math.max(dark,k==='morn'?cl(1-a/4000)*0.8:0)); ctx.beginPath(); ctx.ellipse(x,GY+0.5,24+(i*7)%10,7+(i*5)%5,0,Math.PI,0); ctx.fill(); }
    ctx.fillStyle=mix('#5a7a3a','#2f3a26',dark); ctx.fillRect(0,GY+0.2,W,1.8);

    const gx=x=>x-sg+sw, gA=k==='way'?cl(1-a/1500):(k==='home'?0:1); ctx.save(); ctx.globalAlpha*=gA;
    for(const x of P.gg){ const X0=gx(x); if(X0>-5&&X0<W+5) tuft(X0); }
    for(const x of P.gt){ const X0=gx(x); if(X0>-10&&X0<W+10) roundTree(X0,dark); }
    P.gfl.forEach((x,i)=>{ const X0=gx(x); if(X0>-10&&X0<W+10) flowers(X0,i); });
    { const X0=gx(P.pond); if(X0>-20&&X0<W+20){ ctx.fillStyle=mix('#3f7cb8','#1f3452',dark); ctx.beginPath(); ctx.ellipse(X0,GY+0.6,11,1.8,0,0,7); ctx.fill(); txt('🦆',X0+Math.sin(t/900)*3,GY-0.2,5); } }
    ctx.restore();
    if(k==='go'||k==='post') P.gbf.forEach((x,i)=>{ const X0=gx(x)+Math.sin(t/520+i)*5; if(X0>-8&&X0<W+8) txt('🦋',X0,GY-11+Math.sin(t/260+i*2)*3,4); });

    const way=k==='way'; if(k==='way'||k==='home'){ const wt=k==='way'?a:P.WAY, sx=wx=>wx+sw;
      { const x=sx(P.tree); ctx.strokeStyle='#7a5a3a'; ctx.lineWidth=1.6; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(x+8,GY); ctx.lineTo(x+8,GY-18); ctx.moveTo(x+8,GY-12); ctx.lineTo(x+2,GY-18); ctx.moveTo(x+8,GY-15); ctx.lineTo(x+13,GY-21); ctx.stroke(); const fly=Math.max(0,wt-0.05*P.WAY+400); ctx.fillStyle='#e6b04a'; ctx.fillRect(x+13+fly*0.01,GY-24-fly*0.012,3,2); if(fly<=0) txt('♪',x+18,GY-26,4); }
      for(const x of P.grass) tuft(sx(x));
      for(const x of P.pines){ const Xp=sx(x); ctx.fillStyle='#6a4a2e'; ctx.fillRect(Xp-.6,GY-5,1.2,5.5); ctx.fillStyle=mix('#2f5a3a','#1b3024',dark); ctx.beginPath(); ctx.moveTo(Xp-5,GY-4); ctx.lineTo(Xp,GY-15); ctx.lineTo(Xp+5,GY-4); ctx.moveTo(Xp-4,GY-9); ctx.lineTo(Xp,GY-19); ctx.lineTo(Xp+4,GY-9); ctx.fill(); }
      { const r=sx(P.river); ctx.fillStyle='#3f7cb8'; ctx.fillRect(r-13,GY-2.4,26,3.6); ctx.strokeStyle='#8a5a34'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(r-15,GY+0.2); ctx.quadraticCurveTo(r,GY-6.5,r+15,GY+0.2); ctx.stroke(); const ft=wt-0.41*P.WAY+700; if(ft>0&&ft<900) txt('🐟',r+5,GY-2-Math.sin(ft/900*Math.PI)*8,6); }
      const ani=(x,p,e,sz,lead)=>{ const dt=wt-(p*P.WAY-lead); if(dt<0) return; txt(e,sx(x),GY+(1-Math.min(1,dt/400))*8,sz); };
      ani(P.rab,0.23,'🐇',7,1300); ani(P.deer,0.52,'🦌',11,2400); ani(P.fox,0.66,'🦊',9,1600);
      { const Xo=sx(P.owl); ctx.strokeStyle='#5a4630'; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(Xo+4,GY); ctx.lineTo(Xo+4,GY-22); ctx.moveTo(Xo+4,GY-14); ctx.lineTo(Xo+9,GY-19); ctx.stroke(); txt('🦉',Xo+9,GY-19,6); if(way&&Math.abs(a-0.8*P.WAY)<1200) txt(TX('way_owl'),Xo+16,GY-27,4); }
      if(way&&Math.abs(a-0.66*P.WAY)<900) bubble(TX('way_salute'),X-4,GY-RH-2); }

    const dx=P.DX-sg+sw, delivered=(k==='post'&&a>=2600)||k==='way'||k==='home';
    if(k!=='morn') dest(dx,delivered);
    const pet=HP_DAY_PETS[R.look.pet]; if(k==='go'||k==='post'||k==='way'){ const hop=(k==='post'&&win(a,1000,1400))?Math.sin((a-1000)/400*Math.PI)*2.5:0; if(dx<W+10) txt(pet,dx+41,GY-hop,6); if(k==='post'){ if(win(a,1000,1700)) txt('!',dx+41,GY-8-hop,5,'#f2cf5b'); if(win(a,1300,2400)) bubble(TX('day_pet',null,R.look.pet),dx+41,GY-9); } }

    const hx=k==='morn'?HX:(k==='go'?HX-sg:(k==='post'?-999:HX+sw-P.L));
    let cut=0, lit=false, doorOpen=false, lampV=0;
    if(k==='morn'){ cut=a<3800?1:(a<4400?1-(a-3800)/600:0); lit=a>=2000; doorOpen=win(a,4400,5400); lampV=a<2000?1:cl(1-(a-2000)/300); }
    else if(k==='home'){ cut=a>ST.inside?cl((a-ST.inside)/900):0; lit=a>ST.enter+900&&!(a>ST.sleep+2600); doorOpen=win(a,ST.enter,ST.enter+1000); lampV=a>ST.sleep+2600?cl((a-ST.sleep-2600)/500):0; }
    else lit=k==='go';
    if(hx>-100&&hx<W+10){ home(hx,cut,lit,doorOpen); if(cut>0&&((k==='morn'&&a<2600)||(k==='home'&&a>ST.enter+1200))) bedBot(hx,cut); if(cut>0) lamp(hx,lampV*cut); }

    if(k==='morn'){ let dk='dog-nap', dxx=hx+65, dy=0, fl=false; const z=a<4600;
      if(a>=4600&&a<5700){ dk='dog-sit'; dxx=hx+66; if(a<5300) txt('!',dxx+9,GY-16,6,'#f2cf5b'); }
      else if(a>=5700&&a<6500){ dk=(Math.floor(a/120)%2)?'dog-a':'dog-b'; dxx=lerp(hx+66,P.RX0+20,(a-5700)/800); fl=true; }
      else if(a>=6500){ dk=(a<6900)?'dog-a':'dog-sit'; dxx=P.RX0+20; fl=true; dy=win(a,6500,6900)?Math.sin((a-6500)/400*Math.PI)*5:(a>7700?Math.abs(Math.sin(a/150))*1.5:0); }
      dog(dk,dxx,dy,fl); if(z){ const zu=(a%1600)/1600; txt('z',hx+74+zu*4,GY-9-zu*6,4,'#cfd8ea',1-zu); }
      if(win(a,5600,6900)){ const lx=(a<6700)?dxx-3:lerp(dxx-3,P.RX0+14.5,(a-6700)/200), ly=(a<6700)?GY-11-dy:lerp(GY-11-dy,GY-RH+11.2,(a-6700)/200); if(a>=5600&&a<5800) txt('✨',hx+72,GY-18,4); spr('hp-env',lx,ly,0.5); }
      if(win(a,6500,7300)) bubble(TX('dog_wan'),dxx+8,GY-15-dy);
      if(win(a,8000,9800)) for(let i=0;i<2;i++){ const hu=((a-8000+i*500)%1100)/1100; txt('♥',dxx+4+i*4,GY-14-hu*8,4,'#ff7a9a',1-hu); } }
    else if(k==='go'){ const dd=P.RX0+20-sg; if(dd>-20){ dog(a<1500?((Math.floor(a/150)%2)?'dog-a':'dog-sit'):'dog-sit',dd,a<1500?Math.abs(Math.sin(a/150))*2:0,true); if(a<1300) bubble(TX('dog_wan'),dd+8,GY-15); } }
    else if(k==='way'){ dog('dog-nap',hx+65,0,false); }

    if(k==='morn'&&win(a,500,3800)){ const fu=a>3000?(a-3000)/800:0; txt('🐦',hx+55+fu*20,GY-22.5-fu*14,4.5,null,1-fu); if(win(a,1200,2200)) txt(TX('day_chirp'),hx+62,GY-27,3.6); }

    const jy=(k==='go'||k==='way')?jumpY(t):0, rx0=X+3.5, rx1=X+17;
    if(way){ for(const ob of P.obs){ const sp=SP[ob.k]; if(!sp) continue; const Xo=ob.wx+sw; if(Xo>W+20||Xo+sp.w<-20) continue; spr(ob.k,Xo,GY+1-sp.h,1); if(ob.done) continue; const over=Xo+sp.w>rx0&&Xo<rx1;
        if(!R.manual&&!ob.auto&&Xo+sp.w>rx0-8&&Xo<rx0){ ob.auto=1; R.jump=t; }
        if(over&&jy<sp.h-0.5&&!ob.hit){ ob.hit=1; R.trip=t; R.tripk=ob.k; if(R.manual){ const lost=Math.min(5,R.score); R.score-=lost; R.miss++; pop(900,X+RW/2,GY-RH-3,'−5','#ff8a8a'); } }
        if(Xo>rx1) ob.done=1; }
      for(const e of P.env){ if(e.got) continue; const Xe=e.wx+sw, y=e.y+Math.sin((t+e.p*999)/260)*1.2; if(Xe>W+10||Xe<-12) continue; spr('hp-env',Xe,y,0.9); if(e.gold) txt('♥',Xe+5,y+6.4,3.2,'#ff5a7a');
        const top=GY-jy-RH+1; if(Xe+10>rx0&&Xe<rx1&&y+7>top&&y<top+8){ e.got=1; if(R.manual){ const g=(e.gold?30:10)*R.combo; R.score+=g; R.letters++; pop(1000,Xe+5,y+2,(e.gold?'💌 +':'✉ +')+g+(R.combo>1?' ×'+R.combo:''),e.gold?'#ff9ab8':'#f2cf5b'); R.combo=Math.min(3,R.combo+1); } }
        else if(Xe>rx1+2&&!e.gone){ e.gone=1; R.combo=1; } }
      if(R.trip>=0&&t-R.trip>800) R.trip=-1; }

    if(k==='morn'){
      if(win(a,2600,4400)) bot(hx+20,0,(win(a,2700,3500)&&Math.floor(a/350)%2)?'hp-rb-joy':'hp-rb-a',false,cut);
      if(a>=4400){ const al=cl((a-4400)/500); let rx=hx+2.5, rk='hp-rb-a', ry=0; if(win(a,5200,6600)){ rx=lerp(hx+2.5,P.RX0,(a-5200)/1400); rk=walkK(a); } else if(a>=6600) rx=P.RX0;
        if(win(a,6900,7700)){ rk=(Math.floor(a/250)%2)?'hp-rb-joy':'hp-rb-a'; ry=Math.sin((a-6900)/800*Math.PI)*3; }
        bot(rx,ry,rk,false,al); if(a>=6900) carry(rx,ry); if(win(a,7000,7900)) txt('💗',rx+4,GY-RH-2-(a-7000)/300,6);
        if(win(a,7900,9400)) bubble(TX('day_go'),rx+RW/2,GY-RH-2); }
      if(win(a,2300,3300)) bubble(TX('day_hi'),hx+30,GY-19);
      if(a<1800&&cut>0) for(let i=0;i<3;i++){ const zu=((a+i*700)%2100)/2100; txt('💤',hx+18+zu*6,GY-12-zu*14,4,'#fff',1-zu); } }
    else if(k==='go'){ const rx=lerp(P.RX0,X,ph.u); bot(rx,jy,walkK(t),false,1); carry(rx,jy); if(!R.tapped&&win(a,600,4200)) txt(TX('way_tap'),W*0.5,8,4.5,'#f4f1e8',0.55+0.45*Math.sin(t/300)); }
    else if(k==='post'){ const rot=win(a,3000,4400)?0.32*Math.abs(Math.sin((a-3000)/700*Math.PI)):0, flip=a>=4600; bot(X,0,flip?'hp-rb-a':(win(a,2700,3000)?'hp-rb-joy':'hp-rb-a'),flip,1,rot);
      if(a<800){ const u=a/800; spr('hp-env',lerp(X+14.5,X+26,u),lerp(GY-RH+11.2,GY-17.5,u),lerp(0.6,0.4,u),false,a>600?1-(a-600)/200:1); }
      if(win(a,800,1700)) txt(TX('day_clunk'),X+29,GY-24-(a-800)/300,4,'#f4f1e8',1-(a-800)/900);
      if(win(a,1600,2600)){ const u=(a-1600)/1000; spr('hp-env',lerp(X+26,dx+37,u),lerp(GY-17,GY-18,u)-Math.sin(u*Math.PI)*12,0.5); }
      if(win(a,2700,4600)) for(let i=0;i<2;i++){ const nu=((a-2700+i*600)%1300)/1300; txt('♪',dx+40+i*3,GY-20-nu*12,4.5,'#ffe07a',1-nu); }
      if(a<1100) bubble(TX('day_post'),X+RW/2,GY-RH-2); if(win(a,4700,5600)) bubble(TX('day_back'),X+RW/2,GY-RH-2); }
    else if(k==='way'){ let rot=0; if(R.trip>=0) rot=Math.sin((t-R.trip)/800*Math.PI)*0.35; bot(X,jy,walkK(t),true,1,rot); if(R.trip>=0){ txt(FX[R.tripk]||'💫',X+RW/2,GY-RH-1-jy,5); bubble(TX(OUCH[R.tripk]||'bot_ouch'),X+RW/2,GY-RH-6-jy); }
      if(!R.manual&&win(a,600,6000)) txt(TX('way_tap'),W*0.5,8,4.5,'#f4f1e8',0.55+0.45*Math.sin(t/300));
      if(R.manual){ ctx.save(); const uu=Math.max(5,11/css); ctx.font=uu+'px system-ui,sans-serif'; ctx.textAlign='left'; ctx.fillStyle='#f2cf5b'; ctx.fillText('✉ '+R.letters+'  ★ '+R.score,3,uu+1); ctx.restore(); } }
    else if(k==='home'){
      const RX=hx+86; let rx=X, rk='hp-rb-a', rflip=true, ry=0, ral=1;
      if(a<ST.dogout){ rx=lerp(X,RX,a/ST.dogout); rk=walkK(t); }
      else if(a<ST.play){ rx=RX; if(a<ST.dogrun+500&&a>ST.dogout+200) bubble(TX('bot_home'),rx+RW/2,GY-RH-2); }
      else if(a<ST.walk2){ rx=RX; const pa=a-ST.play; rk=(pa>300&&pa<2600&&Math.floor(pa/350)%2)?'hp-rb-joy':'hp-rb-a'; ry=(pa>900&&pa<1500)?Math.sin((pa-900)/600*Math.PI)*7:0; if(pa>1700&&pa<2900) txt('💗',rx+2,GY-RH-2-(pa-1700)/300,6); }
      else if(a<ST.mail){ rx=lerp(RX,hx+42,(a-ST.walk2)/(ST.mail-ST.walk2)); rk=walkK(t); }
      else if(a<ST.walkdoor){ rx=hx+42; rflip=false; }
      else if(a<ST.enter){ rx=lerp(hx+42,hx+2.5,(a-ST.walkdoor)/(ST.enter-ST.walkdoor)); rk=walkK(t); if(a>ST.walkdoor+200&&a<ST.walkdoor+1400) bubble(TX('day_night'),rx+RW/2,GY-31); }
      else { rx=hx+2.5; ral=cl(1-(a-ST.enter)/700); }
      if(a>ST.mail&&a<ST.mail+1100) txt('✓',hx+55,GY-24,6,'#35d1b7');
      let dxx=hx+63, dk='dog-nap', dfl=false, dyy=0, dal=1;
      if(a<ST.dogout) dxx=hx+65; else if(a<ST.dogrun){ dk='dog-sit'; dxx=hx+66; if(a<ST.dogout+700) txt('!',dxx+9,GY-16,6,'#f2cf5b'); }
      else if(a<ST.play){ dxx=lerp(hx+66,RX-17,(a-ST.dogrun)/(ST.play-ST.dogrun)); dk=(Math.floor(a/120)%2)?'dog-a':'dog-b'; }
      else if(a<ST.walk2){ const pa=a-ST.play; dxx=RX-17+Math.sin(pa/300)*3; dyy=Math.abs(Math.sin(pa/170))*5; dk=dyy>1?'dog-a':'dog-sit'; dfl=(Math.floor(pa/700)%2)===1; if(pa>600&&pa<2200) for(let i=0;i<2;i++){ const hu=((pa-600+i*400)%1100)/1100; txt('♥',dxx+10+i*4,GY-16-hu*10,4,'#ff7a9a',1-hu); } if(pa<1300) bubble(TX('dog_wan'),dxx+10,GY-17-dyy); }
      else if(a<ST.mail){ dxx=lerp(RX-17,hx+66,(a-ST.walk2)/(ST.mail-ST.walk2)); dk=(Math.floor(a/140)%2)?'dog-a':'dog-b'; dfl=true; }
      else if(a<ST.enter+600){ dk='dog-sit'; dxx=hx+66; if(a>ST.walkdoor&&a<ST.walkdoor+1400) bubble(TX('dog_bye'),dxx+8,GY-16); }
      else { dk='dog-sit'; dxx=hx+66; dal=cl(1-(a-ST.enter-600)/500); }
      if(dal>0) dog(dk,dxx,dyy,dfl,dal);
      if(a>ST.enter+1100&&a<ST.fade){ const zu=((a-ST.enter)%1600)/1600; txt('z',hx+74+zu*4,GY-17-zu*6,4,'#cfd8ea',1-zu); }
      if(ral>0&&!(a>ST.enter+700)) bot(rx,ry,rk,rflip,ral);
      if(a>ST.sleep&&a<ST.fade+800) for(let i=0;i<3;i++){ const zu=((a-ST.sleep+i*700)%2100)/2100; txt('💤',hx+18+zu*6,GY-12-zu*14,4,'#fff',1-zu); }
      if(R.manual&&a<2600){ if(!R.saved){ R.saved=1; if(R.score>R.best){ R.best=R.score; R.newb=1; try{ localStorage.setItem('p2p_waybest',String(R.best)); }catch(e){} } } bubble(TX(R.newb?'way_best_new':'way_score',{s:R.score,b:R.best,n:R.letters}),W*0.55,9); } }
    if(k==='morn'&&a<3200) txt(TX('day_title'),W*0.5,9,4.2,'#f4f1e8',a<2400?0.8:0.8*(1-(a-2400)/800));
    for(const p of R.pops){ const u=(t-p.t0)/p.t; if(u<1) txt(p.s,p.x,p.y-u*6,4.5,p.col,1-u); } R.pops=R.pops.filter(p=>t-p.t0<p.t);
    ctx.globalAlpha=1; }
  return {play:play,stop:stop,tap:tap,fit:fit,frame:frame,get on(){ return !!R; },get plan(){ return P; },get st(){ return R; }};
}
function hpDayOn(){ return !!HP_DAY; }
function hpDayEdit(el){ try{ if(!el) return false; if(el.isContentEditable) return true; return /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(String(el.tagName||'')); }catch(e){ return false; } }
function hpDayH1(){ try{ return document.getElementById('t-day')||document.querySelector('#hdr-top h1'); }catch(e){ return null; } }
function hpDayMark(){ try{ const h=hpDayH1(), on=!!HP_DAY; if(h){ h.setAttribute('aria-pressed',on?'true':'false'); h.title=T(on?'day_tip_off':'day_tip_on'); } if(document.body&&document.body.classList) document.body.classList.toggle('hpday',on); }catch(e){} }
function hpDayStart(){ if(HP_DAY) return false; try{ const path=document.getElementById('path'); if(!path) return false;
    try{ if(typeof hpWayEnd==='function') hpWayEnd(); }catch(e){} try{ for(const o of path.querySelectorAll('.botfx')) o.remove(); }catch(e){}
    const box=document.createElement('div'); box.id='hp-day'; const cv=document.createElement('canvas'); cv.setAttribute('aria-label',T('day_title')); cv.setAttribute('role','img');
    const x=document.createElement('button'); x.type='button'; x.id='hp-day-x'; x.textContent='\u2715'; x.title=T('day_close'); x.setAttribute('aria-label',T('day_close'));
    box.appendChild(cv); box.appendChild(x); path.insertBefore(box,path.firstChild);
    const eng=hpDayMake(cv,hpDaySprites(document),{peer:hpDayPeer(),onEnd:()=>hpDayStop('end')});
    HP_DAY={eng:eng,box:box,cv:cv,cs:'?',at:Date.now()}; hpDayMark();
    cv.addEventListener('pointerdown',e=>{ try{ e.preventDefault(); }catch(_){} eng.tap(); });
    x.addEventListener('pointerdown',e=>{ try{ e.preventDefault(); }catch(_){} }); x.addEventListener('click',e=>{ try{ e.stopPropagation(); }catch(_){} hpDayStop('x'); });
    eng.play(); requestAnimationFrame(()=>{ try{ box.classList.add('on'); }catch(e){} });
    return true; }catch(e){ hpDayStop('err'); return false; } }
function hpDayStop(why){ const d=HP_DAY; HP_DAY=null; hpDayMark(); if(!d) return false; try{ d.eng.stop(); }catch(e){} const box=d.box; try{ box.classList.remove('on'); }catch(e){} setTimeout(()=>{ try{ box.remove(); }catch(e){} },why==='end'?0:250);
  try{ const p=document.getElementById('path'); if(p&&p.classList){ p.classList.remove('hpback'); void p.offsetWidth; p.classList.add('hpback'); setTimeout(()=>{ try{ p.classList.remove('hpback'); }catch(e){} },600); } }catch(e){}
  return true; }
function hpDayToggle(){ return HP_DAY?(hpDayStop('toggle'),false):hpDayStart(); }
function hpDayCs(ds){ const d=HP_DAY; if(!d) return ''; ds=String(ds||''); if(d.cs!=='?'&&d.cs!==ds&&/^(walk|hand_walk)$/.test(ds)){ hpDayStop('send'); return 'stop'; } d.cs=ds; return ''; }
function hpDayBoot(){ try{ const h=hpDayH1(); if(!h||h.dataset.hpDay) return; h.dataset.hpDay='1'; h.setAttribute('role','button'); h.tabIndex=0; hpDayMark();
    h.addEventListener('click',()=>{ try{ const nv=document.querySelector('nav'); if(nv&&nv.classList) nv.classList.remove('open'); }catch(e){}   hpDayToggle(); }); h.addEventListener('keydown',e=>{ if(String(h.tagName||'')==='BUTTON'&&!HP_DAY) return;   if(e.key==='Enter'||(e.key===' '&&!HP_DAY)){ e.preventDefault(); hpDayToggle(); } else if(e.key===' '&&HP_DAY){ e.preventDefault(); HP_DAY.eng.tap(); } });
    document.addEventListener('keydown',e=>{ if(!HP_DAY||hpDayEdit(e.target)) return; if(e.key==='Escape'){ hpDayStop('esc'); return; } if(e.target===h) return; if(e.code==='Space'||e.key==='ArrowUp'){ e.preventDefault(); HP_DAY.eng.tap(); } });
    window.addEventListener('resize',()=>{ try{ if(HP_DAY) HP_DAY.eng.fit(); }catch(e){} });
  }catch(e){} }
try{ if(typeof document!=='undefined'&&document.getElementById&&document.getElementById('hdr-top')) hpDayBoot(); }catch(e){}

let HP_HS_LD=null, HP_HS_INDRAW=0;
hpHsSt=(function(f){ return function(t,err){ try{ if(!HP_HS_INDRAW&&(HP_HS_BUSY||err)) HP_HS_LD={ t:t, bad:!!err }; }catch(e){} return f.apply(this,arguments); }; })(hpHsSt);
hpHsDraw=(function(f){ return async function(){ let r; HP_HS_INDRAW++; try{ r=await f.apply(this,arguments); } finally{ HP_HS_INDRAW--; }
  try{ if(HP_HOSTS&&HP_HOSTS.empty){ const L=HP_HS_LD; if(HP_HS_BUSY&&L) hpHsSt(L.t,L.bad); else if(L&&L.bad) hpHsSt(L.t,true); else hpHsSt(T('hs_none_yet')); } }catch(e){}
  return r; }; })(hpHsDraw);
hpHsLoad=(function(f){ return async function(){ if(HP_HS_BUSY) return f.apply(this,arguments); const t0=Date.now(); HP_HS_LD=null; const r=await f.apply(this,arguments);
  try{ const s=Math.round((Date.now()-t0)/1000); if(r) hpLog('ホストの一覧を台帳から読んだ（'+((HP_HOSTS&&HP_HOSTS.hosts)||[]).length+' 台・'+s+' 秒）'); else hpLog('ホストの一覧を読めなかった（'+s+' 秒。'+((HP_HS_LD&&HP_HS_LD.bad)?HP_HS_LD.t:'理由不明')+'）'); }catch(e){}
  return r; }; })(hpHsLoad);

let HP_HS_BT0=0, HP_HS_TKI=null;
function hpHsBusyUi(){ try{ const busy=!!HP_HS_BUSY, b=document.getElementById('btn-hs-load'), st=document.getElementById('hs-st'); if(!b&&!st) return false;
  if(busy&&!HP_HS_BT0) HP_HS_BT0=Date.now(); if(!busy) HP_HS_BT0=0;
  if(b){ if(busy){ b.textContent=T('btn_hs_busy'); b.style.opacity='1'; b.style.color='var(--teal)'; b.style.borderColor='var(--teal)'; } else { b.style.opacity=''; b.style.color=''; b.style.borderColor=''; } }
  let w=document.getElementById('hs-wait'); if(!w&&busy&&st&&st.parentNode){ w=document.createElement('div'); w.id='hs-wait'; w.style.cssText='margin-top:6px';
    const tr=document.createElement('div'); tr.style.cssText='position:relative;height:6px;border-radius:3px;overflow:hidden;background:rgba(127,127,127,.25)'; const bar=document.createElement('div'); bar.id='hs-bar'; bar.style.cssText='position:absolute;top:0;left:0;height:100%;width:35%;border-radius:3px;background:var(--teal)'; tr.appendChild(bar);
    const sc=document.createElement('div'); sc.id='hs-secs'; sc.className='note'; sc.style.marginTop='4px'; w.appendChild(tr); w.appendChild(sc); st.parentNode.insertBefore(w,st.nextSibling);
    try{ if(typeof bar.animate==='function') bar.animate([{transform:'translateX(-100%)'},{transform:'translateX(290%)'}],{duration:1600,iterations:Infinity,easing:'ease-in-out'}); }catch(e){} }
  if(w) w.style.display=busy?'':'none';
  const sc=document.getElementById('hs-secs'); if(sc&&busy) sc.textContent=TF('hs_wait_s',{s:Math.max(0,Math.floor((Date.now()-HP_HS_BT0)/1000))});
  if(st&&busy&&st.style.color!=='var(--red)'){ st.style.color='var(--teal)'; st.style.fontSize='15px'; st.style.fontWeight='600'; } else if(st&&!busy){ st.style.fontSize=''; st.style.fontWeight=''; }
  if(busy&&!HP_HS_TKI) HP_HS_TKI=setInterval(hpHsBusyUi,1000); if(!busy&&HP_HS_TKI){ clearInterval(HP_HS_TKI); HP_HS_TKI=null; }
  return busy; }catch(e){ return false; } }
hpHsBtn=(function(f){ return function(){ const r=f.apply(this,arguments); hpHsBusyUi(); return r; }; })(hpHsBtn);
hpHsSt=(function(f){ return function(){ const r=f.apply(this,arguments); hpHsBusyUi(); return r; }; })(hpHsSt);

