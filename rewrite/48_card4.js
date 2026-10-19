const HP_C4_MAXBOX=5  , HP_C4_MAXROSTER=26  , HP_C4_MAXCANCEL=8, HP_C4_KEEPROSTER=70, HP_C4_KEEPLEN=131072  , HP_C4_MAXLEN=49152  , HP_C4_KINDS=['pc','android','iphone','other'];
function hpC4Err(k,msg){ const e=new Error(msg); if(k) e.hpc=k; return e; }
function hpC4PostOk(u){ return typeof u==='string'&&u.length<=200&&/^wss:\/\/[^\s"'<>]+$/.test(u); }
function hpC4TokenMsg(t){ return 'handpost-token:v1:'+t.id+':'+t.exp+':'+(t.iat||'')+':'+(t.prev||'')+':'+(t.prevExp||''); }
function hpC4TokenSig(t){
  try{ if(!t||typeof t!=='object'||typeof t.id!=='string'||!/^[0-9a-f]{32}$/.test(t.id)||typeof t.iss!=='string'||!/^ed[0-9a-f]{64}$/.test(t.iss)||!(Number(t.exp)>0)||typeof t.sig!=='string'||!/^[0-9a-f]{128}$/.test(t.sig)) return false;
    const s=hp5S(); return s.crypto_sign_verify_detached(hpBytes(t.sig), s.from_string(hpC4TokenMsg(t)), hpBytes(t.iss).slice(1)); }catch(e){ return false; } }
function hpC4Shape(card, long){
  if(!card||typeof card!=='object'||Array.isArray(card)||card.v!==4) return 'v'; if(typeof card.id!=='string'||!/^hp1[0-9a-f]{64}$/.test(card.id)) return 'id'; if(typeof card.root!=='string'||!/^[0-9a-f]{64}$/.test(card.root)) return 'root';
  if(!Array.isArray(card.roster)||card.roster.length<1||card.roster.length>(long?HP_C4_KEEPROSTER:HP_C4_MAXROSTER)) return 'roster';
  if(card.cancels!==undefined&&(!Array.isArray(card.cancels)||card.cancels.length>HP_C4_MAXCANCEL)) return 'cancels';
  if(!Array.isArray(card.boxes)||card.boxes.length<1||card.boxes.length>HP_C4_MAXBOX) return 'boxes'; const seen={};
  for(const b of card.boxes){ if(!b||typeof b!=='object'||typeof b.dev!=='string'||!/^ed[0-9a-f]{64}$/.test(b.dev)||seen[b.dev]) return 'box'; seen[b.dev]=1;
    if(!hpC4PostOk(b.post)) return 'post'; if(!b.token||typeof b.token!=='object') return 'token'; if(!b.pre||typeof b.pre!=='object') return 'pre'; }
  if(card.name!==undefined&&typeof card.name!=='string') return 'name';
  if(card.master!==undefined&&card.master!==card.root) return 'master';
  if(card.devSigs!==undefined&&(!card.devSigs||typeof card.devSigs!=='object'||Array.isArray(card.devSigs))) return 'devSigs';
  let n=0; try{ n=JSON.stringify(card).length; }catch(e){ return 'json'; } if(n>(long?HP_C4_KEEPLEN:HP_C4_MAXLEN)) return 'len';
  return ''; }

async function hpCard4Check(card, now, opt){
  now=Number(now)||Date.now();
  const w=hpC4Shape(card, !!(opt&&opt.long)); if(w) throw hpC4Err('form','名刺の形が違う（v4 '+w+'）');
  const ch=await hpRsChain(card.roster, now, card.cancels||[]);
  if(ch.ok!==true) throw hpC4Err('','名簿を確かめられない（'+ch.why+'）');
  if(card.roster[0].id!==card.id) throw hpC4Err('','名簿の ID が名刺と違う');
  if(ch.cur.root!==card.root) throw hpC4Err('','元鍵が名簿と違う');
  const devs=ch.cur.devs.map(d=>d.dev), seal=hpRsSealDevs(ch.cur,ch.pend), ever={};
  for(const r of card.roster){ for(const d of r.devs) ever[d.dev]=1; }
  const boxes=[], skipped=[];
  for(const b of card.boxes){
    if(!ever[b.dev]) throw hpC4Err('','名簿に無い端末がある '+b.dev.slice(0,10)+'…');
    if(!hpC4TokenSig(b.token)) throw hpC4Err('','許可証の署名が合わない');
    if(!ever[b.token.iss]) throw hpC4Err('','許可証の発行者が名簿の端末でない');
    const p=b.pre; if(!hp6PreOk(b.dev,p.x25519,p.mlkem,p.notAfter,p.sig6,0)) throw hpC4Err('','受け取り用の鍵の署名が合わない '+b.dev.slice(0,10)+'…');
    if(card.devSigs&&card.devSigs[b.dev]!==undefined&&!(await hp5IdOk(card.id,card.root,b.dev,card.devSigs[b.dev]))) throw hpC4Err('','実印の署名が合わない '+b.dev.slice(0,10)+'…');
    let why='';
    if(devs.indexOf(b.dev)<0) why='gone'; else if(seal.indexOf(b.dev)<0) why='wait'; else if(devs.indexOf(b.token.iss)<0) why='issgone';
    else if(!(Number(b.token.exp)>now)) why='old'; else if(!(Number(p.notAfter)>now)) why='old';
    if(why){ skipped.push({dev:b.dev,why:why}); continue; }
    boxes.push(b);
  }
  if(!boxes.length){ const old=skipped.length&&skipped.every(x=>x.why==='old'); throw hpC4Err(old?'old':'', old?'許可証か受け取り用の鍵の期限が切れている':'使える郵便受けが無い（'+skipped.map(x=>x.why).join('・')+'）'); }
  if(card.devKinds!==undefined){ if(!card.devKinds||typeof card.devKinds!=='object'||Array.isArray(card.devKinds)) delete card.devKinds; else { const dk={}; for(const b of card.boxes){ const v=card.devKinds[b.dev]; if(HP_C4_KINDS.indexOf(v)>=0) dk[b.dev]=v; } card.devKinds=dk; } }
  return { card:card, cur:ch.cur, pend:ch.pend, devs:devs, seal:seal, boxes:boxes, skipped:skipped };
}

function hpCard4Dests(chk){
  const out=[], idx={};
  for(const b of (chk&&Array.isArray(chk.boxes)?chk.boxes:[])){ const k=b.post+'|'+b.token.id; let g=idx[k]; if(!g){ g=idx[k]={ post:b.post, token:b.token, dests:[] }; out.push(g); }
    g.dests.push({ dev:b.dev, x25519:b.pre.x25519, mlkem:b.pre.mlkem }); }
  return out; }

function hpCard4Cont(oldCur, chk){
  try{ if(!oldCur) return true; if(!chk||!chk.cur||!(chk.cur.n>=oldCur.n)) return false; const h=hpRsHash(oldCur);
    const same=chk.card.roster.find(r=>r&&r.n===oldCur.n&&hpRsHash(r)===h); return !!same; }catch(e){ return false; } }

function hpCard4ByPaper(oldCur, chk){
  try{ if(!oldCur||!chk||!chk.cur||!chk.card||!Array.isArray(chk.card.roster)||chk.cur.root!==oldCur.root) return false;
    return chk.card.roster.some(r=>r&&r.by==='root'&&r.root===oldCur.root&&Number(r.at)>Number(oldCur.at)); }catch(e){ return false; } }
function hpCard4Follows(oldCur, chk){ return hpCard4Cont(oldCur, chk)||hpCard4ByPaper(oldCur, chk); }

async function hpCard4Make(o, now, tail){
  const card={ v:4, id:o.id, root:o.root, roster:o.roster };
  if(Array.isArray(o.cancels)&&o.cancels.length) card.cancels=o.cancels;
  if(typeof o.name==='string'&&o.name) card.name=o.name;
  if(o.devKinds&&typeof o.devKinds==='object') card.devKinds=o.devKinds;
  card.boxes=(Array.isArray(o.boxes)?o.boxes:[]).map(b=>({ dev:b.dev, post:b.post, token:b.token, pre:{ x25519:b.pre.x25519, mlkem:b.pre.mlkem, notAfter:b.pre.notAfter, sig:b.pre.sig, sig6:b.pre.sig6 } }));
  if(o.devSigs&&typeof o.devSigs==='object'){ card.master=o.root; card.devSigs={}; for(const b of card.boxes){ if(typeof o.devSigs[b.dev]==='string') card.devSigs[b.dev]=o.devSigs[b.dev]; } }
  const chk=await hpCard4Check(JSON.parse(JSON.stringify(card)), now, tail?{long:1}:undefined);
  if(chk.skipped.length) throw hpC4Err('','自分の名刺に使えない箱がある（'+chk.skipped.map(x=>x.why).join('・')+'）');
  if(tail&&card.roster.length>HP_C4_TAIL) card.roster=card.roster.slice(-HP_C4_TAIL);
  const js=JSON.stringify(card); if(tail&&js.length>HP_C4_MAXLEN) throw hpC4Err('','名刺が大きすぎる（'+js.length+' 字）');
  return js;
}
