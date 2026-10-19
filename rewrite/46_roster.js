const HP_RS_WAIT=72*3600e3, HP_RS_MAXDEV=5  , HP_RS_SKEW=5*60e3, HP_RS_BY=['root','devs','one','wait'], HP_RS_KINDS=['pc','android','iphone','other'];
function hpRsBody(r){ return JSON.stringify({v:1,id:r.id,root:r.root,n:r.n,at:r.at,prev:r.prev||'',devs:(r.devs||[]).map(d=>({dev:d.dev,kind:d.kind||'other'})),by:r.by,wait:r.by==='wait'&&r.wait?{dev:r.wait.dev,at:r.wait.at}:null}); }
function hpRsMsg(r){ return 'handpost-roster:v1:'+hpRsBody(r); }
function hpRsHash(r){ const s=hp5S(); return hpHex(s.crypto_generichash(32,s.from_string(hpRsMsg(r)))); }
function hpRsShape(r){
  if(!r||typeof r!=='object'||r.v!==1) return 'v'; if(typeof r.id!=='string'||!/^hp1[0-9a-f]{64}$/.test(r.id)) return 'id'; if(typeof r.root!=='string'||!/^[0-9a-f]{64}$/.test(r.root)) return 'root';
  if(!Number.isInteger(r.n)||r.n<1) return 'n'; if(!(Number(r.at)>0)) return 'at'; if(r.n===1?(r.prev||'')!=='':!(typeof r.prev==='string'&&/^[0-9a-f]{64}$/.test(r.prev))) return 'prev';
  if(!Array.isArray(r.devs)||r.devs.length<1||r.devs.length>HP_RS_MAXDEV) return 'devs'; const seen={};
  for(const d of r.devs){ if(!d||typeof d.dev!=='string'||!/^ed[0-9a-f]{64}$/.test(d.dev)||seen[d.dev]) return 'dev'; seen[d.dev]=1; if(d.kind!==undefined&&HP_RS_KINDS.indexOf(d.kind)<0) return 'kind'; }
  if(HP_RS_BY.indexOf(r.by)<0) return 'by'; if(r.n===1&&r.by!=='root') return 'by1';
  if(r.by==='wait'&&!(r.wait&&typeof r.wait.dev==='string'&&Number(r.wait.at)>0)) return 'wait'; if(!r.sigs||typeof r.sigs!=='object'||Array.isArray(r.sigs)) return 'sigs'; return ''; }
function hpRsVer(sigHex,msg,pubHex){ try{ const s=hp5S(); let pk=hpBytes(pubHex); if(pk.length===33) pk=pk.slice(1); if(pk.length!==32||typeof sigHex!=='string'||!/^[0-9a-f]{128}$/.test(sigHex)) return false; return s.crypto_sign_verify_detached(hpBytes(sigHex),s.from_string(msg),pk); }catch(e){ return false; } }
function hpRsSign(r,sk,who){ const s=hp5S(); r.sigs=r.sigs||{}; r.sigs[who]=hpHex(s.crypto_sign_detached(s.from_string(hpRsMsg(r)),sk)); return r; }
async function hpRsFirst(r){
  const w=hpRsShape(r); if(w) return w; if(r.n!==1) return 'n1'; if(!hpRsVer(r.sigs.root,hpRsMsg(r),r.root)) return 'sig';
  try{ if(r.id!==(await hpIdOf(r.root))) return 'idroot'; }catch(e){ return 'idroot'; } return ''; }
function hpRsCancelMsg(id,h){ return 'handpost-roster-cancel:v1:'+id+':'+h; }
function hpRsCancelMake(id,h,dev,sk,at){ const s=hp5S(); return {v:1,type:'rscancel',id:id,h:h,dev:dev,at:at||Date.now(),sig:hpHex(s.crypto_sign_detached(s.from_string(hpRsCancelMsg(id,h)),sk))}; }
function hpRsStep(prev,next,now,cancels){
  now=Number(now)||Date.now(); const w1=hpRsShape(prev), w2=hpRsShape(next); if(w1||w2) return {ok:false,why:'shape '+(w1||w2)};
  if(next.id!==prev.id) return {ok:false,why:'id'}; if(next.n!==prev.n+1) return {ok:false,why:'n'}; if(next.prev!==hpRsHash(prev)) return {ok:false,why:'prev'};
  if(Number(next.at)>now+HP_RS_SKEW) return {ok:false,why:'future'};
  const msg=hpRsMsg(next), pd=prev.devs.map(d=>d.dev);
  if(next.root!==prev.root&&next.by!=='root') return {ok:false,why:'rootby'};
  if(next.by==='root'){ if(!hpRsVer(next.sigs.root,msg,prev.root)) return {ok:false,why:'sig'}; if(next.root!==prev.root&&!hpRsVer(next.sigs.newroot,msg,next.root)) return {ok:false,why:'newroot'}; return {ok:true}; }
  if(next.by==='devs'){ const good=pd.filter(d=>hpRsVer(next.sigs[d],msg,d)); return good.length>=2?{ok:true}:{ok:false,why:'sig2'}; }
  if(next.by==='one'){ return (pd.length===1&&hpRsVer(next.sigs[pd[0]],msg,pd[0]))?{ok:true}:{ok:false,why:'sig1'}; }

  if(pd.length<2) return {ok:false,why:'wait1'}; const wd=next.wait.dev; if(pd.indexOf(wd)<0||!hpRsVer(next.sigs[wd],msg,wd)) return {ok:false,why:'sigw'};
  if(Number(next.wait.at)>now+HP_RS_SKEW||Number(next.wait.at)>Number(next.at)+HP_RS_SKEW) return {ok:false,why:'future'};
  const h=hpRsHash(next);
  for(const c of (Array.isArray(cancels)?cancels:[])){ if(c&&c.id===next.id&&c.h===h&&c.dev!==wd&&pd.indexOf(c.dev)>=0&&hpRsVer(c.sig,hpRsCancelMsg(c.id,c.h),c.dev)) return {ok:false,why:'cancelled'}; }
  const left=Number(next.wait.at)+HP_RS_WAIT-now; return left>0?{ok:'wait',left:left}:{ok:true}; }
async function hpRsChain(list,now,cancels){
  if(!Array.isArray(list)||!list.length) return {ok:false,why:'empty'}; const w=await hpRsFirst(list[0]); if(w) return {ok:false,why:'first '+w};
  let cur=list[0], pend=[];
  for(let i=1;i<list.length;i++){ const r=hpRsStep(cur,list[i],now,cancels); if(r.ok===true){ cur=list[i]; pend=[]; continue; } if(r.ok==='wait'){ pend.push(list[i]); continue; } if(r.why==='n'&&hpRsJump(cur,list[i],now)){ cur=list[i]; pend=[]; continue; }   if(r.why==='cancelled') continue;   return {ok:false,why:'step '+i+' '+r.why,cur:cur}; }
  return {ok:true,cur:cur,pend:pend}; }

function hpRsJump(prev,next,now){ try{
  if(hpRsShape(prev)||hpRsShape(next)||next.id!==prev.id||!(next.n>prev.n+1)||!(Number(next.at)>Number(prev.at))||Number(next.at)>(Number(now)||Date.now())+HP_RS_SKEW||next.root!==prev.root) return false;
  const msg=hpRsMsg(next);
  if(next.by==='root') return hpRsVer(next.sigs.root,msg,prev.root);
  if(next.by==='devs') return prev.devs.map(d=>d.dev).filter(d=>hpRsVer(next.sigs[d],msg,d)).length>=2;
  return false; }catch(e){ return false; } }
function hpRsSealDevs(cur,pend){
  const out=(cur&&Array.isArray(cur.devs)?cur.devs:[]).map(d=>d.dev); const drop={};
  for(const p of (Array.isArray(pend)?pend:[])){ const keep=(p.devs||[]).map(d=>d.dev); for(const d of out) if(keep.indexOf(d)<0) drop[d]=1; }
  const r=out.filter(d=>!drop[d]); return r.length?r:out; }

const HP_TR_SEEN={}, HP_TR_CACHE={}; let HP_TR_N=0;
function hpTrNote(cur){ try{ if(!cur||typeof cur.id!=='string'||!Array.isArray(cur.devs)||typeof cur.root!=='string') return false; const o=HP_TR_SEEN[cur.id]; if(o&&!(Number(cur.at)>Number(o.at))) return false; HP_TR_SEEN[cur.id]=cur; return true; }catch(e){ return false; } }
async function hpTrChain(list,cancels){ if(!Array.isArray(list)||!list.length) return null; let k='';
  try{ k=list.length+'|'+hpRsHash(list[0])+'|'+hpRsHash(list[list.length-1])+'|'+(Array.isArray(cancels)?cancels.length:0)+'|'+Math.floor(Date.now()/3600e3); }catch(e){ return null; }
  if(Object.prototype.hasOwnProperty.call(HP_TR_CACHE,k)){ const c=HP_TR_CACHE[k]; if(c) hpTrNote(c); return c; }
  let cur=null; try{ const ch=await hpRsChain(list,Date.now(),Array.isArray(cancels)?cancels:[]); if(ch&&ch.ok===true) cur=ch.cur; }catch(e){ cur=null; }
  if(++HP_TR_N>300){ for(const x of Object.keys(HP_TR_CACHE)) delete HP_TR_CACHE[x]; HP_TR_N=1; } HP_TR_CACHE[k]=cur; if(cur) hpTrNote(cur); return cur; }
async function hpTrCur(id){
  try{ if(typeof ID!=='undefined'&&ID&&id===ID.address&&Array.isArray(ID.roster)) await hpTrChain(ID.roster,ID.rsCancels||[]); }catch(e){}
  try{ const c=(typeof ID!=='undefined'&&ID&&Array.isArray(ID.contacts))?ID.contacts.find(x=>x&&x.address===id):null; if(c&&c.card&&c.card.v===4&&Array.isArray(c.card.roster)) await hpTrChain(c.card.roster,c.card.cancels||[]); }catch(e){}
  return HP_TR_SEEN[id]||null; }
async function hpTrDevOk(id,master,dev){ const cur=await hpTrCur(id); return !!(cur&&cur.id===id&&cur.root===master&&cur.devs.some(d=>d&&d.dev===dev)); }
async function hpTrFromBody(inner){
  try{ if(!inner||typeof inner.body!=='string'||inner.body.length>400000) return false; let o=null; try{ o=JSON.parse(inner.body); }catch(e){ return false; }
    const cs=[]; if(o&&o.card&&typeof o.card==='object'&&o.card.v===4) cs.push(o.card); if(o&&o.v===4&&Array.isArray(o.roster)) cs.push(o);
    for(const c of cs){ if(c.id===inner.from&&Array.isArray(c.roster)) await hpTrChain(c.roster,c.cancels||[]); }
    return await hpTrDevOk(inner.from,inner.fromMaster,inner.fromDev); }catch(e){ return false; } }
try{ if(typeof hp5IdOk==='function'&&!hp5IdOk.__tr){ const f=hp5IdOk; hp5IdOk=async function(id,master,dev,devSig){ if(await f.apply(this,arguments)) return true;
  try{ if(typeof id!=='string'||!/^[0-9a-f]{64}$/.test(String(master))||!/^ed[0-9a-f]{64}$/.test(String(dev))) return false; return await hpTrDevOk(id,master,dev); }catch(e){ return false; } }; hp5IdOk.__tr=1; } }catch(e){}
try{ if(typeof hpCard4Check==='function'&&!hpCard4Check.__tr){ const f=hpCard4Check; hpCard4Check=async function(){ const r=await f.apply(this,arguments); try{ if(r&&r.cur) hpTrNote(r.cur); }catch(e){} return r; }; hpCard4Check.__tr=1; } }catch(e){}

