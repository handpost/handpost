function hpCiWrap(name, fn){ try{ const f=globalThis[name]; if(typeof f!=='function'||f.__hpCi) return false; const g=function(){ return fn.call(this,f,arguments); }; g.__hpCi=1; globalThis[name]=g; return true; }catch(e){ return false; } }
function hpCiErr(k,msg){ const e=new Error(msg); if(k) e.hpc=k; return e; }
async function hpCiView(card, chk, now){

  const gs=[]; let bi=-1;
  for(const g of hpCard4Dests(chk)){
    const devices=[], prekeys=[];
    for(const d of g.dests){ const b=chk.boxes.find(x=>x.dev===d.dev), sig=card.devSigs&&card.devSigs[d.dev];
      if(!b||!hp5PreOk(d.dev,b.pre.x25519,b.pre.notAfter,b.pre.sig,now)) continue;
      void sig;
      devices.push(d.dev); prekeys.push({ dev:d.dev, x25519:b.pre.x25519, notAfter:b.pre.notAfter, sig:b.pre.sig }); }
    if(devices.length){ gs.push({ post:[g.post], token:g.token, devices:devices, prekeys:prekeys }); if(bi<0||devices.length>gs[bi].devices.length) bi=gs.length-1; }
  }
  if(!gs.length) throw hpCiErr('','今の封筒（v5）で送れる端末が名刺に無い（実印の署名か、受け取り用の鍵の今までの署名が無い）');
  const best=gs[bi], order=[best].concat(gs.filter(x=>x!==best));
  card.master=card.root; card.post=best.post; card.token=best.token; card.devices=[]; card.prekeys=[];
  for(const x of order){ card.devices.push.apply(card.devices,x.devices); card.prekeys.push.apply(card.prekeys,x.prekeys); }
  if(!card.devSigs||typeof card.devSigs!=='object') card.devSigs={};
  return card; }
async function hpCiCheck4(card){
  await hpReady(); const now=Date.now(), chk=await hpCard4Check(card, now, {long:1})  ;
  if(ID&&card.id!==ID.address){
    const c=(ID.contacts||[]).find(x=>x&&x.address===card.id), old=(c&&c.card&&c.card!==card&&c.card.v===4&&Array.isArray(c.card.roster))?c.card:null;
    if(old){ let oc=null; try{ oc=await hpRsChain(old.roster, now, old.cancels||[]); }catch(e){ oc=null; }
      if(oc&&oc.ok===true&&!hpCard4Follows(oc.cur, chk)) throw hpCiErr('','名簿が、前に受け取った名刺の続きでない（古い名刺か、別の歴史）');
      try{ if(oc&&oc.ok===true&&typeof hpCard4Cont==='function'&&!hpCard4Cont(oc.cur, chk)) hpLog('名刺 '+String(card.id).slice(0,10)+'… の名簿は、紙（元鍵）で作り直されている（前の名簿の続きではないが、元鍵の署名が新しいので受け付けた）'); }catch(e){}   }
  }
  return await hpCiView(card, chk, now); }
hpCiWrap('hpCardCheck', async function(f,args){
  const card=args[0];
  if(card&&typeof card==='object'&&card.v===4) return await hpCiCheck4(card);
  if(card&&typeof card==='object'&&card.v===3&&typeof ID!=='undefined'&&ID&&ID.address&&card.id!==ID.address) throw hpCiErr('old','古い形の名刺（v3）は受け付けない（相手に、新しい版で名刺を出し直してもらう）');
  return await f.apply(this,args); });
hpCiWrap('hpCard', async function(f,args){
  const o=JSON.parse(await hpCard4(args[0], args[1]==='tail'));   o.token=o.boxes[0].token; return JSON.stringify(o); });

const HP_C4_TAIL=4;
function hpC4Merge(old,card){
  try{ const o=old&&old.roster, t=card&&card.roster; if(!Array.isArray(o)||!o.length||!o[0]||o[0].n!==1||!Array.isArray(t)||!t.length||!t[0]) return null;
    const t0=t[0], before=o.filter(r=>r&&Number(r.n)<Number(t0.n)); if(!before.length) return null; const last=before[before.length-1];
    if(last.n===t0.n-1&&hpRsHash(last)!==t0.prev) return null;
    return before.concat(t); }catch(e){ return null; } }
function hpC4TailErr(){ return hpCiErr('',(typeof T==='function'&&typeof I18N!=='undefined'&&I18N.ja&&I18N.ja.c4_e_tail)?T('c4_e_tail'):'名刺を確かめられません。本人に招待状をもう一度出してもらってください'); }
try{ if(typeof hpCiCheck4==='function'&&!hpCiCheck4.__tail){ const f=hpCiCheck4; hpCiCheck4=async function(card){
  if(card&&typeof card==='object'&&card.v===4&&Array.isArray(card.roster)&&card.roster.length&&card.roster[0]&&card.roster[0].n!==1){
    if(typeof ID==='undefined'||!ID||card.id===ID.address) throw hpC4TailErr();
    const c=(ID.contacts||[]).find(x=>x&&x.address===card.id), old=(c&&c.card&&c.card!==card&&c.card.v===4&&Array.isArray(c.card.roster))?c.card:null;
    const full=old?hpC4Merge(old,card):null; if(!full) throw hpC4TailErr();
    const cs=[]; for(const x of [].concat(Array.isArray(old.cancels)?old.cancels:[],Array.isArray(card.cancels)?card.cancels:[])){ if(x&&!cs.some(y=>y.h===x.h&&y.dev===x.dev)) cs.push(x); }
    let ch=null; try{ ch=await hpRsChain(full,Date.now(),cs); }catch(e){ ch=null; } if(!ch||ch.ok!==true) throw hpC4TailErr();
    card.roster=full; if(cs.length) card.cancels=cs.slice(-HP_C4_MAXCANCEL); else delete card.cancels;
    try{ hpLog('名刺 '+String(card.id).slice(0,10)+'… は名簿の直近だけ（'+(card.roster.length)+' 枚につないだ）'); }catch(e){} }
  return await f.apply(this,arguments); }; hpCiCheck4.__tail=1; } }catch(e){}
hpCiWrap('hpPut', async function(f,args){
  let a=Array.prototype.slice.call(args);
  try{ const b=a[1]; if(a[2]==='msg'&&typeof b==='string'&&b.startsWith('{"v":1,"type":"card",')){ const o=JSON.parse(b);
    if(o&&o.card&&o.card.v===4&&Array.isArray(o.card.roster)&&o.card.roster.length>HP_C4_TAIL){ o.card.roster=o.card.roster.slice(-HP_C4_TAIL); a[1]=JSON.stringify(o); } } }catch(e){}
  return await f.apply(this,a); });

