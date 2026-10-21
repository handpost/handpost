let HP_MC_SELF='';
function hpMcWrap(name, fn){ try{ const f=globalThis[name]; if(typeof f!=='function'||f.__hpMc) return false; const g=function(){ return fn.call(this,f,arguments); }; g.__hpMc=1; globalThis[name]=g; return true; }catch(e){ return false; } }
function hpMcRoster(){ return (ID&&Array.isArray(ID.roster)&&ID.roster.length)?ID.roster:null; }
function hpMcPreOf(dev, now){ try{ const p=ID&&ID.pre6&&typeof ID.pre6==='object'?ID.pre6[dev]:null; return (p&&p.dev===dev&&hp6PreOk(dev,p.x25519,p.mlkem,p.notAfter,p.sig6,now||Date.now()))?p:null; }catch(e){ return null; } }
function hpMcPres(now){ const out=[]; try{ for(const d of hpSibs()){ const p=hpMcPreOf(d.dev,now); if(p) out.push(p); } }catch(e){} return out; }
function hpMcTake(p, sibDevs, now){
  try{ if(!p||typeof p!=='object'||sibDevs.indexOf(p.dev)<0||!hp6PreOk(p.dev,p.x25519,p.mlkem,p.notAfter,p.sig6,now)) return false;
    if(!ID.pre6||typeof ID.pre6!=='object'||Array.isArray(ID.pre6)) ID.pre6={}; const old=ID.pre6[p.dev]; if(old&&old.notAfter>=p.notAfter) return false;
    ID.pre6[p.dev]={ dev:p.dev, x25519:p.x25519, mlkem:p.mlkem, notAfter:p.notAfter, sig:p.sig, sig6:p.sig6 }; return true; }catch(e){ return false; } }
async function hpMcRosterIn(list, now){
  if(!Array.isArray(list)||!list.length||list.length>64) return 'form';
  let ch; try{ ch=await hpRsChain(list, now, []); }catch(e){ return 'chain'; } if(!ch||ch.ok!==true) return 'chain '+((ch&&ch.why)||'');
  if(list[0].id!==ID.address||ch.cur.root!==ID.publicKey) return 'other';
  const old=(typeof hpRkLast==='function')?hpRkLast():null;
  if(old){ const h=hpRsHash(old), paper=list.some(x=>x&&x.by==='root'&&x.root===old.root&&Number(x.at)>Number(old.at));   if(!list.some(x=>x&&x.n===old.n&&hpRsHash(x)===h)&&!paper) return 'fork'; if(!(ch.cur.n>old.n)&&!paper) return 'same'; }
  ID.roster=JSON.parse(JSON.stringify(list)); return 'ok'; }

const HP_MC_BOX_SKEW=5*60e3;
function hpMcBoxMine(){ try{ if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||!POST.url) return null;
  return (hpIsMain()||(ID&&ID.boxOwn===POST.url))?POST.url:''; }catch(e){ return null; } }
function hpMcBoxRec(dev){ try{ const b=ID&&ID.box6&&typeof ID.box6==='object'&&!Array.isArray(ID.box6)?ID.box6[dev]:null; return (b&&typeof b.url==='string'&&Number(b.at)>0)?b:null; }catch(e){ return null; } }
function hpMcBoxOf(dev){ try{
    const own=(typeof hpBoxSub==='function')&&hpBoxSub();
    if(!own&&hpMcBoxMine()===''&&hpIsChild()&&ID.link.main&&ID.link.main.dev===dev) return POST.url;
    const b=hpMcBoxRec(dev); if(b&&b.url&&hpC4PostOk(b.url)) return b.url;
    if(own){ const m=ID.link.main&&ID.link.main.dev, bm=(m&&m!==dev)?hpMcBoxRec(m):null; if(bm&&bm.url&&hpC4PostOk(bm.url)) return bm.url; }   }catch(e){}
  return POST.url; }
function hpMcBoxTake(dev, box, sibDevs, now){
  try{ if(!box||typeof box!=='object'||sibDevs.indexOf(dev)<0||typeof box.url!=='string'||!(Number(box.at)>0)||Number(box.at)>now+HP_MC_BOX_SKEW) return false;
    if(box.url!==''&&!hpC4PostOk(box.url)) return false;
    const old=hpMcBoxRec(dev); if(old&&old.at>=Number(box.at)) return false;
    if(!ID.box6||typeof ID.box6!=='object'||Array.isArray(ID.box6)) ID.box6={};
    ID.box6[dev]={ url:box.url, at:Number(box.at) }; return !old||old.url!==box.url; }catch(e){ return false; } }

let HP_BOX_BUSY=false;
function hpBoxSub(){ try{ if(typeof ID==='undefined'||!ID||!hpIsChild()) return false; const u=hpPostUrl(); return !!u&&(ID.boxOwn===u||!!(ID.boxJob&&ID.boxJob.to===u)); }catch(e){ return false; } }
function hpBoxSubBefore(url){
  try{ if(typeof ID==='undefined'||!ID||!hpIsChild()||typeof url!=='string'||!hpC4PostOk(url)) return false;
    const old=hpPostUrl(), now=Date.now(); if(!old||old===url) return false;
    const wasOwn=(ID.boxOwn===old), m=ID.link.main&&ID.link.main.dev;
    if(!wasOwn){
      const bm=m?hpMcBoxRec(m):null; if(m&&!(bm&&bm.url)){ if(!ID.box6||typeof ID.box6!=='object'||Array.isArray(ID.box6)) ID.box6={}; ID.box6[m]={ url:old, at:1 }; }
      ID.link.postOld={ url:old, at:now, last:now }; }
    else{
      ID.link.postOld={ url:old, at:now, last:now, exp:(typeof hpLeaseExp==='function')?(Number(hpLeaseExp())||0):0, own:1 };
      try{ if(typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner&&POST.url===old&&typeof hpSend==='function') hpSend({op:'lease',exp:0}).then(()=>{ try{ if(ID&&ID.link&&ID.link.postOld&&ID.link.postOld.url===old){ ID.link.postOld.lsOff=1; saveID(); } }catch(e){} },()=>{}); }catch(e){} }
    ID.boxJob={ from:old, to:url, at:now }; delete ID.boxOwn; delete ID.boxDevs; saveID();
    hpLog('この端末の郵便受けを借りた。'+(wasOwn?'前の郵便受け（'+old+'）は期限まで見回る。':'前の共有の郵便受け（'+old+'）は期限まで見回る。')+'新しい郵便受けで名乗ったら、自分のほかの端末を足す');
    return true; }catch(e){ return false; } }
async function hpBoxKick(){
  if(HP_BOX_BUSY||typeof ID==='undefined'||!ID||!hpIsChild()||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0;
  const M=(ID.boxJob&&ID.boxJob.to===POST.url)?ID.boxJob:null; if(!M&&ID.boxOwn!==POST.url) return 0;
  HP_BOX_BUSY=true; let n=0;
  try{ const added=M?(Array.isArray(M.added)?M.added:[]):(Array.isArray(ID.boxDevs)?ID.boxDevs:[]);
    for(const d of hpSibs()){ if(!d.devSig||added.includes(d.dev)) continue;
      try{ await hpPmReq({op:'adddev',dev:d.dev,devSig:d.devSig}); n++; }catch(e){ const w=String((e&&e.message)||e); if(w!=='removed'&&w!=='too many devices') throw e; hpLog('自分の端末をこの郵便受けに足せない（'+w+'）'); }
      added.push(d.dev); if(M) M.added=added; else ID.boxDevs=added; saveID(); }
    if(M){ ID.boxOwn=M.to; ID.boxDevs=added; delete ID.boxJob; let c=0; try{ c=hpCardDueMark(1); }catch(e){} saveID();
      try{ if(typeof hpRvQueue==='function'){ const bl=hpBxBlockedTokens(); if(bl.length) hpRvQueue(bl); } }catch(e){}
      hpLog('この端末の郵便受けに、自分のほかの端末 '+n+' 台を足した。場所を自分の端末へ知らせ、住所録の相手 '+c+' 人に新しい名刺を届ける');
      try{ await hpMcSibSend(false); }catch(e){ hpLog('郵便受けの場所を自分の端末へ知らせられない（つなぎ直したらもう一度）'+((e&&e.message)?' '+e.message:'')); }
      try{ if(typeof hpResendKick==='function') hpResendKick(); }catch(e){} }
    else if(n) hpLog('この端末の郵便受けに、あとから加わった自分の端末 '+n+' 台を足した');
  }catch(e){ hpLog('この端末の郵便受けに、自分のほかの端末を足しきれない（つなぎ直したらもう一度）'+((e&&e.message)?' '+e.message:'')); }
  finally{ HP_BOX_BUSY=false; }
  return n; }

function hpDevBoxUrl(d){ try{ if(!d||!d.dev||d.role==='main'||typeof ID==='undefined'||!ID) return '';
    if(d.me) return (typeof hpBoxSub==='function'&&hpBoxSub())?String(hpPostUrl()||''):'';
    const m=(ID.link&&ID.link.main&&ID.link.main.dev)||'', base=hpIsMain()?String((typeof POST!=='undefined'&&POST&&POST.url)||hpPostUrl()||''):(m?hpMcBoxOf(m):''), u=hpMcBoxOf(d.dev);
    return (u&&base&&u!==base&&hpC4PostOk(u))?u:''; }catch(e){ return ''; } }
function hpDevBoxText(d){ const u=hpDevBoxUrl(d); return u?TF('dv_box_own',{h:String(u).replace(/^wss:\/\//,'')}):''; }

hpBoxKick=(function(f){ return function(){ try{ if(typeof hpRmResume==='function') hpRmResume(); }catch(e){} return f.apply(this,arguments); }; })(hpBoxKick);

const HP_BX_EVERY=6*3600e3, HP_BX_RETRY=15*60e3, HP_BX_WAIT=15000, HP_BX_GONE_KEEP=35*864e5;
let HP_BX_BUSY=false, HP_BX_T=null;
function hpBxGoneList(){ try{ const now=Date.now(); return (ID&&Array.isArray(ID.boxGone)?ID.boxGone:[]).filter(g=>g&&typeof g.url==='string'&&typeof g.dev==='string'&&now-(Number(g.at)||0)<HP_BX_GONE_KEEP); }catch(e){ return []; } }
function hpBoxOthers(){ try{ if(typeof ID==='undefined'||!ID||typeof POST==='undefined'||!POST||!POST.url) return []; const me=POST.url, out=[];
    for(const d of hpSibs()){ const u=hpMcBoxOf(d.dev); if(u&&u!==me&&hpC4PostOk(u)&&out.indexOf(u)<0) out.push(u); }
    for(const g of hpBxGoneList()){ if(g.url!==me&&hpC4PostOk(g.url)&&out.indexOf(g.url)<0) out.push(g.url); }
    return out; }catch(e){ return []; } }
function hpBxRvList(){ try{ const now=Date.now(); return (ID&&Array.isArray(ID.rvx)?ID.rvx:[]).filter(t=>t&&typeof t.id==='string'&&typeof t.url==='string'&&Number(t.exp)>now); }catch(e){ return []; } }
function hpBxBlockedTokens(){ try{ const o=hpTkLoad(), list=[]; for(const a of Object.keys(o)){ if(!hpBlocked(a)) continue; for(const id of Object.keys(o[a]||{})) list.push({id:id,exp:Number(o[a][id])}); } return list; }catch(e){ return []; } }
function hpBxRvPush(list, urls){ const q=hpBxRvList(), now=Date.now(); let n=0;
  for(const t of (list||[])){ if(!t||typeof t.id!=='string'||!(Number(t.exp)>now)) continue; for(const u of urls){ if(!q.some(x=>x.id===t.id&&x.url===u)){ q.push({id:t.id,exp:Number(t.exp),url:u}); n++; } } }
  if(n){ ID.rvx=q.slice(-2000); saveID(); } return n; }
function hpBxRvAdd(list){
  try{ const urls=hpBoxOthers(); if(!urls.length) return 0; const n=hpBxRvPush(list,urls); if(n){ for(const u of urls) hpBxRec(u).last=0;   hpBoxRound('取り消し').catch(()=>{}); } return n; }catch(e){ return 0; } }
function hpBxRvAll(url){
  try{ if(typeof POST==='undefined'||!POST||url===POST.url||!hpC4PostOk(url)) return 0; const n=hpBxRvPush(hpBxBlockedTokens(),[url]); if(n){ hpBxRec(url).last=0; hpBoxRound('取り消し').catch(()=>{}); } return n; }catch(e){ return 0; } }
function hpBxRec(url){ if(!ID.boxVis||typeof ID.boxVis!=='object'||Array.isArray(ID.boxVis)) ID.boxVis={}; return ID.boxVis[url]||(ID.boxVis[url]={ last:0, ok:0, fail:0 }); }
function hpBxDue(url, now, force){ if(force) return true; const r=(ID.boxVis&&ID.boxVis[url])||{}, pend=!!r.dirty||Number(r.fail)>0||hpBxRvList().some(t=>t.url===url)||hpBxGoneList().some(g=>g.url===url);
  return now-(Number(r.last)||0)>=(pend?HP_BX_RETRY:HP_BX_EVERY); }
function hpBxMark(){
  try{ const urls=hpBoxOthers(), now=Date.now(); for(const u of urls){ const r=hpBxRec(u); r.dirty=now; r.last=0; } if(urls.length){ saveID(); hpBoxRound('端末の一覧が変わった').catch(()=>{}); } return urls.length; }catch(e){ return 0; } }
function hpBxGoneNote(dev){
  try{ const b=hpMcBoxRec(dev), u=(b&&b.url)||''; if(!u||u===POST.url||!hpC4PostOk(u)) return false;
    ID.boxGone=hpBxGoneList().filter(g=>g.dev!==dev).concat([{ url:u, dev:dev, at:Date.now() }]); return true; }catch(e){ return false; } }
async function hpBoxErrand(url, job){
  let c=null; const out=[];
  try{ const kp=await hpDevKey(); c=await HotPocket.createClient([url], kp); if(typeof hpGateWrap==='function') hpGateWrap(c,url,kp,'郵便受けの世話');
    c.on(HotPocket.events.contractOutput, r=>{ for(const x of r.outputs){ try{ out.push(JSON.parse(hpText(x))); }catch(e){} } });
    let up=false; try{ up=await hpWithin(c.connect(),20000,'自分のほかの端末の郵便受けへのつなぎ'); }catch(e){ up=false; }
    if(!up) throw new Error('つながらない');
    const ask=async(o,name)=>{ await hpWithin(c.submitContractInput(JSON.stringify(o)),HP_SEND_WAIT,'自分のほかの端末の郵便受けへの送り');
      const t0=Date.now(); while(Date.now()-t0<HP_BX_WAIT){ const i=out.findIndex(x=>x&&(x.ok===name||x.err)); if(i>=0){ const x=out.splice(i,1)[0]; if(x.err) throw new Error(String(x.err)); return x; } await sleep(100); }
      throw new Error('返事が無い（'+name+'）'); };
    return await job(ask);
  }finally{ if(c){ try{ await c.close(); }catch(e){} } } }
async function hpBoxRound(why, force){
  if(HP_BX_BUSY||typeof ID==='undefined'||!ID||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0;
  const urls=hpBoxOthers(); let ch=false;
  if(ID.boxVis&&typeof ID.boxVis==='object'){ for(const k of Object.keys(ID.boxVis)){ if(urls.indexOf(k)<0){ delete ID.boxVis[k]; ch=true; } } }
  if(Array.isArray(ID.rvx)){ const q=hpBxRvList().filter(t=>urls.indexOf(t.url)>=0); if(q.length!==ID.rvx.length){ ID.rvx=q; ch=true; } }
  if(Array.isArray(ID.boxGone)){ const q=hpBxGoneList(); if(q.length!==ID.boxGone.length){ ID.boxGone=q; ch=true; } }
  if(ch) saveID();
  if(!urls.length) return 0;
  HP_BX_BUSY=true; let seen=0;
  try{ for(const url of urls){ const now=Date.now(); if(!hpBxDue(url,now,force)) continue;
      const rec=hpBxRec(url), d0=rec.dirty; rec.last=now; saveID();
      try{ const res=await hpBoxErrand(url, async ask=>{ const o={add:0,rm:0,rv:0,left:0};
          const r=await ask({op:'dget'},'dget'), here=new Set((Array.isArray(r&&r.devs)?r.devs:[]).map(x=>x&&x.dev)), gone=hpMyGone(), gset=new Set(gone.map(g=>g.dev));
          for(const d of hpSibs()){ if(!d.devSig||here.has(d.dev)||gset.has(d.dev)) continue;
            try{ await ask({op:'adddev',dev:d.dev,devSig:d.devSig},'adddev'); o.add++; }catch(e){ const w=String((e&&e.message)||e); if(w!=='removed'&&w!=='too many devices') throw e; } }
          for(const g of gone){ if(!here.has(g.dev)) continue;
            if(!hpIsMain()){ o.left++; continue; }
            const ts=Date.now(), sig=await edSign(hp5RmMsg(ID.address,g.dev,ts)); await ask({op:'rmdev',dev:g.dev,ts:ts,sig:sig},'rmdev'); o.rm++; }
          for(const t of hpBxRvList().filter(t=>t.url===url)){ await ask({op:'revoke',id:t.id,exp:t.exp},'revoke'); o.rv++; ID.rvx=(Array.isArray(ID.rvx)?ID.rvx:[]).filter(x=>!(x.id===t.id&&x.url===url)); }
          return o; });
        rec.ok=Date.now(); rec.fail=0; if(rec.dirty===d0) delete rec.dirty; if(!res.left&&Array.isArray(ID.boxGone)) ID.boxGone=ID.boxGone.filter(g=>g.url!==url); seen++; saveID();
        if(res.add||res.rm||res.rv) hpLog('自分のほかの端末の郵便受け（'+url+'）：端末 '+res.add+' 台を足し、外した端末 '+res.rm+' 台を外し、許可証 '+res.rv+' 枚を取り消した（'+(why||'見回り')+'）');
      }catch(e){ rec.fail=(Number(rec.fail)||0)+1; saveID(); hpLog('自分のほかの端末の郵便受け（'+url+'）の世話ができない（'+((e&&e.message)||e)+'。続けて '+rec.fail+' 回。15 分後にもう一度）'); }
    }
  }finally{ HP_BX_BUSY=false; }
  return seen; }
function hpBxTick(){ try{ if(typeof ID==='undefined'||!ID||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return '';
  if(typeof BG_ON!=='undefined'&&!BG_ON) return 'off';
  if(typeof HP_IOS!=='undefined'&&HP_IOS&&typeof hpHidden==='function'&&hpHidden()) return 'hidden';
  if(typeof navigator!=='undefined'&&navigator&&navigator.onLine===false) return 'offline';
  hpBoxKick().catch(()=>{}); hpBoxRound('見回り').catch(()=>{}); return 'go'; }catch(e){ return ''; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ HP_BX_T=setInterval(hpBxTick,60e3); setTimeout(hpBxTick,30e3); } }catch(e){}

async function hpMcSibSend(force){
  if(!ID||!POST.up||POST.notOwner||!hp6Has()) return 0;
  const sibs=hpSibs(); if(!sibs.length) return 0;
  const pre=await hpPrekeyPub6(), chain=hpMcRoster(), last=chain?chain[chain.length-1]:null, mine=hpMcBoxMine();
  const mark=pre.x25519+'|'+sibs.map(d=>d.dev).sort().join(',')+'|'+(last?hpRsHash(last):'')+'|box:'+(mine===null?'?':mine);
  if(!force&&ID.sib6===mark) return 0;
  const body={ v:1, type:'sib6', at:Date.now(), pre6:pre }; const pres=hpMcPres(); if(pres.length) body.pres=pres; if(chain) body.roster=chain; if(mine!==null) body.box={ url:mine, at:body.at };
  const n=await hpSibPut(body);
  if(n){ ID.sib6=mark; saveID(); hpLog('ML-KEM つきの受け取り用の鍵'+(chain?'と名簿（'+chain.length+' 枚）':'')+'を自分の端末 '+n+' 台へ知らせた'); }
  return n; }

async function hpMcSibIn(o, r){
  if(!ID||!o||!r||!r.fromDev) return false;
  const now=Date.now(), sibDevs=hpSibs().map(d=>d.dev), who=String(r.fromDev).slice(0,10)+'…'; let nPre=0, ch=false;
  if(sibDevs.indexOf(r.fromDev)<0){ hpLog('一覧に無い端末（'+who+'）からの鍵の知らせ（捨てた）'); return false; }
  if(o.pre6&&o.pre6.dev===r.fromDev&&hpMcTake(o.pre6,sibDevs,now)) nPre++;
  for(const p of (Array.isArray(o.pres)?o.pres.slice(0,HP_DEV_MAX):[])){ if(p&&p.dev!==r.fromDev&&hpMcTake(p,sibDevs,now)) nPre++; }
  if(ID.pre6&&typeof ID.pre6==='object'){ for(const k of Object.keys(ID.pre6)){ if(sibDevs.indexOf(k)<0){ delete ID.pre6[k]; ch=true; } } }
  if(o.box!==undefined){ const b0=hpMcBoxRec(r.fromDev), moved=hpMcBoxTake(r.fromDev,o.box,sibDevs,now), b1=hpMcBoxRec(r.fromDev); if(b1&&(!b0||b0.at!==b1.at)) ch=true;
    if(moved) hpLog('自分の端末（'+who+'）の郵便受けの場所を控えた（'+(b1.url||'自分の郵便受けは無い')+'）');
    if(moved&&b1.url){ try{ hpBxRvAll(b1.url); hpBxMark(); }catch(e){} }   }
  if(ID.box6&&typeof ID.box6==='object'){ for(const k of Object.keys(ID.box6)){ if(sibDevs.indexOf(k)<0){ delete ID.box6[k]; ch=true; } } }
  let rs=''; if(o.roster!==undefined){ rs=await hpMcRosterIn(o.roster, now); if(rs==='ok') ch=true; else if(rs!=='same') hpLog('届いた名簿を受け付けない（'+rs+'）'); }
  if(nPre||ch) saveID();
  if(nPre||rs==='ok') hpLog('自分の端末（'+who+'）から'+(nPre?' ML-KEM つきの受け取り用の鍵 '+nPre+' 台ぶん':'')+(rs==='ok'?' 名簿（'+ID.roster.length+' 枚・端末 '+ID.roster[ID.roster.length-1].devs.length+' 台）':'')+'を受け取った');
  hpMcSibSend(false).then(()=>hpMcSelf()).catch(()=>{});
  return true; }

async function hpCard4(days, tail){
  if(!POST.up) throw new Error('つながっていない（自分のポストの場所が要る）');
  if(POST.notOwner) throw new Error(T('e_card_notowner'));
  const me=await hp5Me(); if(me.dev!==POST.pub) throw new Error('端末鍵が接続中のものと違う');
  const chain=hpMcRoster(); if(!chain) throw new Error('名簿がまだ無い');
  const last=chain[chain.length-1], inRs=d=>last.devs.some(x=>x.dev===d); if(!inRs(me.dev)) throw new Error('この端末が名簿に無い');
  const now=Date.now(), token=JSON.parse(hpIssue((days||30)*86400e3)), boxes=[{ dev:me.dev, post:POST.url, token:token, pre:await hpPrekeyPub6() }], devSigs={}, dk={};
  if(me.devSig) devSigs[me.dev]=me.devSig; dk[me.dev]=hpDevKindOf(hpDevLabelGuess());
  for(const d of hpSibs()){
    if(boxes.length>=HP_DEV_MAX) break; const p=hpMcPreOf(d.dev,now); if(!p||!inRs(d.dev)||boxes.some(b=>b.dev===d.dev)) continue;
    boxes.push({ dev:d.dev, post:hpMcBoxOf(d.dev)  , token:token, pre:p }); if(d.devSig) devSigs[d.dev]=d.devSig; dk[d.dev]=hpDevKindOf(d.label);
  }
  const nm=hpCardNameOf({name:(typeof myName==='function')?myName():''});
  return await hpCard4Make({ id:me.id, root:ID.publicKey, roster:chain, name:nm, devKinds:dk, boxes:boxes, devSigs:devSigs }, now, !!tail);
}

async function hpMcSelf(){
  let line=''; try{ const c=await hpCard4(1), o=JSON.parse(c); line='名刺 v4 を作れる（端末 '+o.boxes.length+' 台・名簿 '+o.roster.length+' 枚・'+c.length+' 文字。まだ配らない）'; }catch(e){ line='名刺 v4 はまだ作れない（'+((e&&e.message)||e)+'）'; }
  if(line!==HP_MC_SELF){ HP_MC_SELF=line; try{ hpLog(line); }catch(e){} } return line; }
hpMcWrap('hpDevListSend', async function(f,args){
  try{ if(typeof hpRkEnsure==='function') await hpRkEnsure('端末の顔ぶれ'); }catch(e){}
  const n=await f.apply(this,args);
  try{ await hpMcSibSend(true); }catch(e){ try{ hpLog('鍵と名簿を自分の端末へ知らせられない '+e.message); }catch(_){} }
  return n; });
hpMcWrap('hpSibAnnounce', async function(f,args){
  const r=await f.apply(this,args);
  try{ await hpMcSibSend(false); }catch(e){ try{ hpLog('鍵と名簿を自分の端末へ知らせられない '+e.message); }catch(_){} }
  try{ await hpMcSelf(); }catch(e){}
  return r; });
