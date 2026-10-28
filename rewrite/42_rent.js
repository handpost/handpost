const HP_XM_KEY='7b459d28-9290-4e95-a01c-ec9a799543bf';
const HP_XA_NETID=21337;
const HP_EV_IMAGE='evernode/sashimono:hp.latest-ubt.20.04-njs.20';
const HP_EV_PREREQ='#!/bin/bash\necho "Prerequisite installer script"\nexit 0';
const HP_RENT_LIBS=[['lib/xumm.min.js',()=>typeof Xumm==='function'],['lib/noble-secp256k1.js',()=>!!(typeof self!=='undefined'&&self.nobleSecp256k1)],['lib/hp-bson.js',()=>!!(typeof self!=='undefined'&&self.BSON)]];
let HP_RENT_LOAD=null, HP_XM=null;
function hpRentLibs(){
  if(HP_RENT_LIBS.every(x=>x[1]())) return Promise.resolve(true);
  if(HP_RENT_LOAD) return HP_RENT_LOAD;
  HP_RENT_LOAD=(async()=>{ for(const [src,ok] of HP_RENT_LIBS){ if(ok()) continue;
      await new Promise((res,rej)=>{ const s=document.createElement('script'); s.src=src; s.async=false; s.onload=()=>res(); s.onerror=()=>rej(new Error('load '+src)); document.head.appendChild(s); });
      if(!ok()) throw new Error('load '+src); }
    return true; })();
  HP_RENT_LOAD.catch(()=>{ HP_RENT_LOAD=null; });
  return HP_RENT_LOAD; }

function hpHexOf(s){ return Array.from(new TextEncoder().encode(String(s)),b=>b.toString(16).padStart(2,'0')).join('').toUpperCase(); }
function hpBytesOf(h){ h=String(h||''); const a=new Uint8Array(h.length>>1); for(let i=0;i<a.length;i++) a[i]=parseInt(h.substr(i*2,2),16); return a; }
function hpB64Of(u8){ let s=''; for(const b of u8) s+=String.fromCharCode(b); return btoa(s); }
function hpCatU8(...a){ const n=a.reduce((s,x)=>s+x.length,0), o=new Uint8Array(n); let i=0; for(const x of a){ o.set(x,i); i+=x.length; } return o; }
function hpXaKeyType(k){ k=String(k||'').toUpperCase(); if(!k) return ''; if(k.length===66&&k.startsWith('ED')) return 'ed25519'; if(k.length===66&&/^0[23]/.test(k)) return 'secp256k1'; return '?'; }
function hpEvIsOffer(t,host){ return !!t&&t.LedgerEntryType==='URIToken'&&t.Issuer===host&&(Number(t.Flags)&1)===1&&hpHexStr(t.URI).startsWith('ZXZybGVhc2')&&!!t.Amount; }

async function hpEvAcct(acct){
  return hpXahauSess(async q=>{ let a=null; try{ a=(await q({command:'account_info',account:acct,ledger_index:'validated'})).account_data; }catch(e){ if(/actNotFound|not ?found/i.test(String(e&&e.message))) return null; throw e; }
    let lines=[]; try{ lines=(await q({command:'account_lines',account:acct,ledger_index:'validated'})).lines||[]; }catch(e){}
    return {xah:Number(a.Balance)/1e6, evr:lines.filter(l=>l.currency==='EVR').map(l=>({v:Number(l.balance)||0,issuer:l.account})), key:String(a.MessageKey||'').toUpperCase(), kt:hpXaKeyType(a.MessageKey), seq:a.Sequence}; },30000); }

async function hpEvLeases(acct){ return hpXahauSess(async q=>{ const out=[]; let marker=null;
    for(let i=0;i<10;i++){ const r=await q(Object.assign({command:'account_objects',account:acct,ledger_index:'validated',limit:400},marker?{marker:marker}:{}));
      for(const t of ((r&&r.account_objects)||[])){ if(t&&t.LedgerEntryType==='URIToken'&&hpHexStr(t.URI).startsWith('ZXZybGVhc2')&&!((Number(t.Flags)&1)===1&&t.Amount&&t.Issuer===acct)) out.push({tok:String(t.index||'').toUpperCase(),iss:String(t.Issuer||'')}); }
      marker=r&&r.marker; if(!marker) break; }
    return out; },30000); }

function hpRentHeldText(held,mine,acct){ try{ const m=String(mine||'').toUpperCase(), n=(Array.isArray(held)?held:[]).filter(t=>t&&t.tok&&t.tok!==m).length; if(!(n>0)) return ''; return '\n\n'+TF('rn_held',{n:n,a:String(acct).slice(0,6)+'…'+String(acct).slice(-4)}); }catch(e){ return ''; } }
async function hpEvHost(addr){
  return hpXahauSess(async q=>{ let a=null; try{ a=(await q({command:'account_info',account:addr,ledger_index:'validated'})).account_data; }catch(e){ if(/actNotFound|not ?found/i.test(String(e&&e.message))) return null; throw e; }
    const objs=[]; let marker=null; for(let i=0;i<20;i++){ const r=await q(Object.assign({command:'account_objects',account:addr,ledger_index:'validated',limit:400},marker?{marker:marker}:{})); objs.push(...((r&&r.account_objects)||[])); marker=r&&r.marker; if(!marker) break; }
    const all=objs.filter(t=>t&&t.LedgerEntryType==='URIToken'&&t.Issuer===addr&&hpHexStr(t.URI).startsWith('ZXZybGVhc2'));
    return {addr:addr, dom:hpAgDomSet(addr,a.Domain),   key:String(a.MessageKey||'').toUpperCase(), kt:hpXaKeyType(a.MessageKey), offers:objs.filter(t=>hpEvIsOffer(t,addr)), all:all.length}; },60000); }
async function hpEvLedgerNow(){ return hpXahauSess(async q=>(await q({command:'ledger_current'})).ledger_current_index,15000); }

async function hpEvSealSecp(pub33,plain,E){ E=E||{}; const N=E.noble||self.nobleSecp256k1, S=E.subtle||crypto.subtle, R=E.rand||(n=>crypto.getRandomValues(new Uint8Array(n)));
  if(!N) throw new Error('secp256k1 の部品が読めていない');
  const eph=E.ephem||N.utils.randomPrivateKey(), ephPub=N.getPublicKey(eph,false), sh=N.getSharedSecret(eph,pub33,false);
  let x=sh.slice(1,33); let z=0; while(z<x.length-1&&x[z]===0) z++; x=x.slice(z);
  const h=new Uint8Array(await S.digest('SHA-512',x)), ek=h.slice(0,32), mk=h.slice(32);
  const iv=E.iv||R(16); const ak=await S.importKey('raw',ek,{name:'AES-CBC'},false,['encrypt']); const ct=new Uint8Array(await S.encrypt({name:'AES-CBC',iv:iv},ak,plain));
  const hk=await S.importKey('raw',mk,{name:'HMAC',hash:'SHA-256'},false,['sign']); const mac=new Uint8Array(await S.sign('HMAC',hk,hpCatU8(iv,ephPub,ct)));
  return hpCatU8(ephPub,iv,mac,ct); }
async function hpEvSeal(host,plain,E){
  if(host.kt==='ed25519'){ await sodium.ready; const box=sodium.crypto_box_seal(plain,sodium.crypto_sign_ed25519_pk_to_curve25519(hpBytesOf(host.key.slice(2)))); return hpB64Of(hpCatU8(new Uint8Array([1]),box)); }
  if(host.kt==='secp256k1'){ const box=await hpEvSealSecp(hpBytesOf(host.key),plain,E); return hpB64Of(hpCatU8(new Uint8Array([1]),box)); }
  throw new Error('host key '+(host.kt||'none')); }
function hpEvReq(ownerPub,cid){ return {owner_pubkey:String(ownerPub),contract_id:cid||crypto.randomUUID(),image:HP_EV_IMAGE,config:{}}; }

async function hpEvMsgPub(seedHex){ await sodium.ready; const kp=sodium.crypto_sign_seed_keypair(sodium.from_hex(seedHex)); return 'ED'+sodium.to_hex(kp.publicKey).toUpperCase(); }
async function hpEvOpen(dataB64,seedHex){
  await sodium.ready; const u=Uint8Array.from(atob(String(dataB64||'')),c=>c.charCodeAt(0)); if(!u.length) throw new Error('empty');
  if(u[0]!==1) return JSON.parse(new TextDecoder().decode(u.slice(1)));
  const kp=sodium.crypto_sign_seed_keypair(sodium.from_hex(seedHex));
  const m=sodium.crypto_box_seal_open(u.slice(1),sodium.crypto_sign_ed25519_pk_to_curve25519(kp.publicKey),sodium.crypto_sign_ed25519_sk_to_curve25519(kp.privateKey));
  return JSON.parse(new TextDecoder().decode(m)); }

function hpEvKeyTx(acct,msgPub){ return {TransactionType:'AccountSet',Account:acct,MessageKey:msgPub,NetworkID:HP_XA_NETID}; }
function hpEvLeaseTx(acct,offer,data){ return {TransactionType:'URITokenBuy',Account:acct,Amount:offer.Amount,URITokenID:offer.index,NetworkID:HP_XA_NETID,
  Memos:[{Memo:{MemoType:hpHexOf('evnAcquireLease'),MemoFormat:hpHexOf('base64'),MemoData:hpHexOf(data)}}],
  HookParameters:[{HookParameter:{HookParameterName:HP_LG_TYPE,HookParameterValue:hpHexOf('evnAcquireLease')}}]}; }
function hpEvEvr(v){ return String(Math.round(Number(v)*1e6)/1e6); }
function hpEvExtendTx(acct,host,token,price,n){ n=Math.max(1,Math.floor(Number(n)||0)); return {TransactionType:'Payment',Account:acct,Destination:host,Amount:{currency:'EVR',issuer:price.issuer,value:hpEvEvr(Number(price.value)*n)},NetworkID:HP_XA_NETID,
  HookParameters:[{HookParameter:{HookParameterName:HP_LG_TYPE,HookParameterValue:hpHexOf('evnExtendLease')}},{HookParameter:{HookParameterName:HP_LG_REF,HookParameterValue:String(token).toUpperCase()}}]}; }

function hpEvMomEvr(evr,price){ const p=Number(price)||0; return p>0?Math.max(0,Math.floor((Number(evr)||0)/p+1e-9)):0; }
const HP_DAYS_OPT=[30,90,180,365], HP_DAYS_DEF=30, HP_AMT_SHORT=7;
function hpDaysNode(id,start,have,onch){
  const mk=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!==undefined) e.textContent=x; return e; }, dd=v=>Math.max(0,Math.floor(Number(v)||0));
  const box=mk('div'), row=mk('div','row'); row.style.cssText='align-items:center;flex-wrap:wrap'; const lb=mk('span','',T('rn_days')); lb.style.cssText='font-size:13px;color:var(--dim)'; row.appendChild(lb);
  const ip=mk('input'); ip.type='number'; ip.id=id; ip.min='1'; ip.max='3650'; ip.step='1'; ip.inputMode='numeric'; ip.style.cssText='width:5em'; ip.value=String(dd(start)>0?dd(start):HP_DAYS_DEF);
  const set=v=>{ ip.value=String(dd(v)); try{ onch(); }catch(e){} };
  for(const v of HP_DAYS_OPT){ const b=mk('button','b',TF('rn_days_d',{d:v})); b.type='button'; b.style.cssText='padding:6px 12px;font-size:13px'; b.addEventListener('click',()=>set(v)); row.appendChild(b); }
  ip.addEventListener('input',()=>{ try{ onch(); }catch(e){} }); ip.addEventListener('change',()=>{ try{ onch(); }catch(e){} }); row.appendChild(ip); const un=mk('span','',T('rn_days_unit')); un.style.cssText='font-size:13px;color:var(--dim)'; row.appendChild(un); box.appendChild(row);
  const hv=mk('div','note',TF('rn_have',{e:hpNum(have,6)})); hv.style.marginTop='4px'; box.appendChild(hv);
  return {node:box,ip:ip,get:()=>dd(ip.value)}; }
function hpRentPlanDays(price,days,size,hasKey){ size=Number(size)||3600; const per=Number(price)||0, d=Math.max(0,Math.floor(Number(days)||0)), n=Math.max(0,Math.ceil(d*86400/size-1e-9));
  return {n:n, ext:Math.max(0,n-1), total:Number(hpEvEvr(per*n)), steps:(hasKey?0:1)+1+(n>1?1:0), days:d}; }
function hpRentDays(J){ return (J&&J.days!==undefined&&Number(J.days)>=0)?Number(J.days):Math.floor((Number(J&&J.n)||0)*3600/86400); }
function hpEvExtMom(memoData){ const d=String(memoData||''); return /^[0-9A-Fa-f]{8}/.test(d)?parseInt(d.slice(0,8),16):0; }

function hpEvMemo0(tx){ const m=(((tx&&tx.Memos)||[])[0]||{}).Memo||{}; return {type:hpHexStr(m.MemoType),format:hpHexStr(m.MemoFormat),data:String(m.MemoData||'')}; }
function hpEvFind(list,types,ref){ ref=String(ref||'').toUpperCase(); for(const it of (list||[])){ const tx=(it&&(it.tx||it.tx_json))||{}; const ty=hpHexStr(hpLgParam(tx,HP_LG_TYPE)); if(types.includes(ty)&&hpLgParam(tx,HP_LG_REF).toUpperCase()===ref) return {type:ty,tx:Object.assign({hash:String(it.hash||tx.hash||'')},tx)}; } return null; }
async function hpEvWait(acct,from,types,ref,ms,every){ const until=Date.now()+(ms||240000); every=every||5000;
  while(Date.now()<until){ try{ const r=await hpXahauSess(async q=>q({command:'account_tx',account:acct,ledger_index_min:from,ledger_index_max:-1,forward:true,limit:100}),20000); const f=hpEvFind(r&&r.transactions,types,ref); if(f) return f; }catch(e){}
    await new Promise(r=>setTimeout(r,(typeof hpJit==='function')?hpJit(every):every)); }
  return null; }
function hpEvInfo(res){ const c=(res&&res.content&&typeof res.content==='object')?res.content:res;
  if(!c||typeof c!=='object'||!/^[a-z0-9.-]{1,253}$/i.test(String(c.domain||''))||!(Number(c.user_port)>0&&Number(c.user_port)<65536)||!/^ed[0-9a-f]{64}$/i.test(String(c.pubkey||''))) throw new Error('create_res');
  return c; }
function hpEvUrl(info){ return 'wss://'+String(info.domain).toLowerCase()+':'+Number(info.user_port); }

function hpRentZip(files){
  const enc=new TextEncoder(), parts=[], cen=[]; let off=0;
  const u16=v=>[v&255,(v>>>8)&255], u32=v=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
  const d=new Date(), tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1), dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate();
  for(const f of files){ const nm=enc.encode(f.name), c=hpCrc32(f.data), n=f.data.length;
    const lh=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(tm),...u16(dt),...u32(c),...u32(n),...u32(n),...u16(nm.length),...u16(0)]);
    parts.push(lh,nm,f.data);
    cen.push(new Uint8Array([...u32(0x02014b50),...u16((3<<8)|20),...u16(20),...u16(0x0800),...u16(0),...u16(tm),...u16(dt),...u32(c),...u32(n),...u32(n),...u16(nm.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(((f.mode||0o100644)<<16)>>>0),...u32(off)]),nm);
    off+=lh.length+nm.length+n; }
  const cs=cen.reduce((a,x)=>a+x.length,0);
  const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(cs),...u32(off),...u16(0)]);
  return hpCatU8(...parts,...cen,end); }
function hpEvBundle(files,instPub,round){
  const ov={contract:{unl:[String(instPub)],bin_path:'/usr/bin/node',bin_args:'index.js'}}; if(round) ov.contract.consensus={roundtime:Number(round)};
  const enc=new TextEncoder(); const list=files.filter(f=>f.name!=='hp.cfg.override'&&f.name!=='install.sh').map(f=>({name:f.name,data:f.data,mode:0o100644}));
  list.push({name:'hp.cfg.override',data:enc.encode(JSON.stringify(ov,null,4)),mode:0o100644});
  list.push({name:'install.sh',data:enc.encode(HP_EV_PREREQ),mode:0o100755});
  return hpRentZip(list); }
let HP_EV_CONN_MS=45e3, HP_EV_STAT_MS=60e3, HP_EV_UP_MS=180e3, HP_EV_CLOSE_MS=5e3;
function hpEvRace(p,ms,v){ return Promise.race([p,new Promise(r=>setTimeout(()=>r(v),ms))]); }
async function hpEvDeploy(info,ownerSkHex,zip,step){ step=step||(()=>{});
  await hpRentLibs(); if(typeof HotPocket==='undefined'||!self.BSON) throw new Error('HotPocket/BSON');
  const url=hpEvUrl(info), W=[]; let hpc=null; const CONN=(typeof HP_EV_CONN_MS==='number')?HP_EV_CONN_MS:45e3;
  const wait=(type,ms)=>new Promise((ok,ng)=>{ const t=setTimeout(()=>ng(new Error('no '+type)),ms); W.push({type:type,ok:v=>{ clearTimeout(t); ok(v); }}); });
  try{ step('connect',url);
    const sk=String(ownerSkHex||''); const keys=await HotPocket.generateKeys(/^ed/i.test(sk)?sk:'ed'+sk);
    hpc=await HotPocket.createClient([url],keys,{protocol:HotPocket.protocols.bson}); if(typeof hpGateWrap==='function') hpGateWrap(hpc,url,keys,'郵便受けのプログラムを入れる',{bare:true});
    hpc.on(HotPocket.events.contractOutput,r=>{ for(const o of ((r&&r.outputs)||[])){ let m=null; try{ m=BSON.deserialize(o); }catch(e){ continue; } for(let i=W.length-1;i>=0;i--){ if(W[i].type===m.type) W.splice(i,1)[0].ok(m); } } });
    const conn=await hpEvRace(hpc.connect(),CONN,'timeout'); if(conn!==true) throw new Error('connect '+url+(conn==='timeout'?' ('+Math.round(CONN/1000)+' s)':''));
    const send=async(obj,type,ms)=>{ const p=wait(type,ms); p.catch(()=>{});
      const sub=(async()=>{ const res=await hpc.submitContractInput(BSON.serialize(obj)); const st=await res.submissionStatus; if(!st||st.status!=='accepted') throw new Error('input '+((st&&st.reason)||'')); return null; })(); sub.catch(()=>{});
      await Promise.race([sub,p]); return p; };
    step('status'); const s=await send({type:'status'},'statusResult',(typeof HP_EV_STAT_MS==='number')?HP_EV_STAT_MS:60e3); if(s.status!=='ok') throw new Error('status '+JSON.stringify(s));
    step('upload',zip.length); const u=await send({type:'upload',content:BSON.BufferPolyfill.from(zip)},'uploadResult',(typeof HP_EV_UP_MS==='number')?HP_EV_UP_MS:180e3); if(u.status!=='ok') throw new Error('upload '+JSON.stringify(u));
    return u.message; }
  finally{ try{ W.splice(0).forEach(w=>{ try{ w.ok(null); }catch(e){} }); }catch(e){} try{ if(hpc) await hpEvRace(hpc.close(),(typeof HP_EV_CLOSE_MS==='number')?HP_EV_CLOSE_MS:5e3,null); }catch(e){} } }

async function hpEvHasPost(url,ms){ let c=null;
  try{ await hpRentLibs(); const id=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join(''), got=[];
    c=await HotPocket.createClient([url], await HotPocket.generateKeys()); if(typeof hpGateWrap==='function') hpGateWrap(c,url,null,'郵便受けのプログラムが動いているか',{bare:true});
    c.on(HotPocket.events.contractOutput, r=>{ for(const out of ((r&&r.outputs)||[])){ try{ const o=JSON.parse(typeof out==='string'?out:new TextDecoder().decode(out)); if(o&&o.id===id&&(o.err==='none'||o.err==='used'||o.ok==='iget')) got.push(o); }catch(e){} } });
    const CONN=(typeof HP_EV_CONN_MS==='number')?HP_EV_CONN_MS:45e3, race=(p,w,v)=>Promise.race([p,new Promise(r=>setTimeout(()=>r(v),w))]);
    if((await race(c.connect(),CONN,false))!==true) return false; await c.submitContractInput(JSON.stringify({op:'iget',id:id}));
    const t0=Date.now(); while(!got.length&&Date.now()-t0<(ms||8000)) await new Promise(r=>setTimeout(r,100)); return got.length>0; }
  catch(e){ return false; } finally{ try{ if(c) await Promise.race([c.close(),new Promise(r=>setTimeout(r,5000))]); }catch(e){} } }

let HP_XM_WAIT=30000, HP_XM_POLL=5000;
async function hpXmSignedAs(ms){ try{ await hpRentLibs(); const XM=hpXmGet(); const a=await Promise.race([Promise.resolve(XM.user.account),new Promise(r=>setTimeout(()=>r(''),ms||4000))]); return (typeof a==='string'&&HP_LG_RADDR.test(a))?a:''; }catch(e){ return ''; } }
function hpXmGet(){ if(HP_XM) return HP_XM; if(typeof Xumm!=='function') throw new Error('Xaman の部品が読めていない'); HP_XM=new Xumm(HP_XM_KEY); hpXmBind(HP_XM);   return HP_XM; }
async function hpXmPayloadState(uuid){ const XM=hpXmGet(); const p=await XM.payload.get(uuid); const m=(p&&p.meta)||{}, R=(p&&p.response)||{}; return {p:p,signed:!!m.signed,resolved:!!m.resolved,expired:!!m.expired,cancelled:!!m.cancelled,open:!(m.resolved||m.expired||m.cancelled),pushed:!!m.pushed,txid:String(R.txid||'').toUpperCase(),result:String(R.dispatched_result||'')}; }
async function hpXmDispatched(XM,uuid,p){ for(let i=0;i<20;i++){ if(!p){ try{ p=await XM.payload.get(uuid); }catch(e){ p=null; } } if(p&&p.response&&p.response.dispatched_result) break; await new Promise(r=>setTimeout(r,1500)); p=null; } const R=(p&&p.response)||{}; return {txid:String(R.txid||'').toUpperCase(),result:String(R.dispatched_result||'')}; }
async function hpXmWaitResolved(XM,uuid,resolvedP){ let done=false;
  const poll=(async()=>{ while(!done){ await new Promise(r=>setTimeout(r,HP_XM_POLL)); if(done) return null; try{ const p=await XM.payload.get(uuid); const m=(p&&p.meta)||{}; if(m.resolved||m.expired||m.cancelled) return {signed:!!m.signed}; }catch(e){} } return null; })();
  const sub=resolvedP?Promise.resolve(resolvedP).then(ev=>({signed:!!(ev&&ev.signed)}),()=>({signed:false})):new Promise(()=>{});
  const r=await Promise.race([sub,poll]); done=true; return r; }
async function hpXmSubmit(tx,instr,onOpen,keep){

  const XM=hpXmGet(); let created=null, sub=null;
  const old=(keep&&keep.get)?String(keep.get()||''):'';
  if(old){ let st=null; try{ st=await hpXmPayloadState(old); }catch(e){ st=null; }
    if(st&&st.signed){ const R=await hpXmDispatched(XM,old,st.p); try{ if(keep.clear) keep.clear(); }catch(e){} return {signed:true,txid:R.txid,result:R.result,reused:true}; }
    if(st&&st.open){ created={uuid:old,next:{always:String((st.p&&st.p.next&&st.p.next.always)||'')},refs:{qr_png:String((st.p&&st.p.refs&&st.p.refs.qr_png)||'')},pushed:st.pushed,reused:true}; }
    else{ try{ if(keep.clear) keep.clear(); }catch(e){} } }
  if(!created){ const body={txjson:tx,options:{submit:true,force_network:'XAHAU'},custom_meta:{instruction:String(instr||'')}};
    sub=await Promise.race([XM.payload.createAndSubscribe(body,ev=>{ if(ev.data&&'signed' in ev.data) return ev.data; }),new Promise((_,no)=>setTimeout(()=>no(new Error(T('rn_xm_slow'))),HP_XM_WAIT))]);
    created=sub.created; try{ if(keep&&keep.set) keep.set(String(created.uuid||'')); }catch(e){} }
  try{ if(onOpen) onOpen(created); }catch(e){}
  const ev=await hpXmWaitResolved(XM,created.uuid,sub?sub.resolved:null);
  try{ if(keep&&keep.clear) keep.clear(); }catch(e){}
  if(!ev||!ev.signed) return {signed:false};
  const R=await hpXmDispatched(XM,created.uuid,null); return {signed:true,txid:R.txid,result:R.result}; }
function hpXmReturning(search){ try{ const l=new URLSearchParams(search==null?((typeof location!=='undefined'&&location.search)||''):search); return !!(l.get('authorization_code')||l.get('access_token')||l.get('error_description')); }catch(e){ return false; } }

let HP_XM_INFO=null, HP_XM_RD=false, HP_XM_PEND='', HP_XM_PEND_N='', HP_XM_PRE=false, HP_XM_BACK=false, HP_XM_OPEN_AT=0, HP_XM_ASK_AT=0, HP_XM_OTHER='', HP_XM_RET=false;
function hpXmAcct(){ try{ const a=(typeof ID!=='undefined'&&ID)?ID.xmAcct:''; return (typeof a==='string'&&HP_LG_RADDR.test(a))?a:''; }catch(e){ return ''; } }
function hpXmSt(t,err){ try{ const el=document.getElementById('xm-st'); if(el){ el.textContent=t||''; el.style.color=err==='warn'?'var(--amber)':err?'var(--red)':''; } }catch(e){} }

function hpXmQuiet(){ try{ return typeof hpBfOn==='function'&&hpBfOn()&&typeof HP_BF_ALLOW!=='undefined'&&!HP_BF_ALLOW; }catch(e){ return false; } }
function hpXmBind(XM){ try{ XM.on('success',()=>{ hpXmPicked().catch(()=>{}); }); XM.on('error',e=>{ HP_XM_OPEN_AT=0; hpXmSt(TF('xm_fail',{why:String((e&&e.message)||e||'')}),true); }); }catch(e){} }
function hpXmClean(){ if(!hpXmReturning()) return false; HP_XM_BACK=true; try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){} return true; }
async function hpXmPicked(){ let a='', n=''; try{ a=String((await HP_XM.user.account)||''); }catch(e){} try{ const p=HP_XM.user.name; n=String((await Promise.race([Promise.resolve(p),new Promise(r=>setTimeout(()=>r(''),3000))]))||'').trim().slice(0,40); }catch(e){}
  const asked=hpXmClean()||HP_XM_BACK||HP_XM_RET||hpXmAsked(); if(HP_XM_RET) HP_XM_BACK=true;
  if(!HP_LG_RADDR.test(a)){ hpXmSt(TF('xm_fail',{why:'account'}),true); return false; }
  if(!asked) return hpXmSeen(a);
  if(typeof ID==='undefined'||!ID){ HP_XM_PEND=a; HP_XM_PEND_N=n; return false; }
  return hpXmApply(a,n); }
function hpXmAsked(){ return !!(HP_XM_ASK_AT&&Date.now()-HP_XM_ASK_AT<900e3); }
function hpXmSeen(a){
  if(typeof ID==='undefined'||!ID) return false;
  const cur=hpXmAcct(); if(!cur) return false;
  const same=(a===cur); HP_XM_LIVE={a:cur,ok:same,b:same?'':a}; HP_XM_LIVE_AT=Date.now();
  if(!same&&HP_XM_OTHER!==a){ HP_XM_OTHER=a; try{ log(TL('lg_xm_other',{a:cur,b:a})); }catch(e){} }
  try{ hpXmUi(); }catch(e){} return same; }
function hpXmName(){ try{ return (typeof ID!=='undefined'&&ID&&typeof ID.xmName==='string')?ID.xmName:''; }catch(e){ return ''; } }
function hpXmNameOf(a){ try{ const m=(typeof ID!=='undefined'&&ID&&ID.xmNames&&typeof ID.xmNames==='object')?ID.xmNames:null; const n=m&&a?m[a]:''; return (typeof n==='string')?n:''; }catch(e){ return ''; } }
function hpXmLabel(x){ x=String(x||''); const s=x.slice(0,6)+'…'+x.slice(-4), n=hpXmNameOf(x); return n?n+(typeof hpPar==='function'?hpPar(s):'（'+s+'）'):s; }
function hpXmNick(nm){
  const a=hpXmAcct(); if(!a||typeof ID==='undefined'||!ID) return false; nm=String(nm||'').trim().slice(0,40);
  if(!ID.xmNames||typeof ID.xmNames!=='object') ID.xmNames={}; if(nm) ID.xmNames[a]=nm; else delete ID.xmNames[a]; ID.xmName=nm; try{ saveID(); }catch(e){}
  try{ hpToast(nm?TF('xm_nicked',{a:a.slice(0,6)+'…'+a.slice(-4),n:nm}):TF('xm_unnicked',{a:a.slice(0,6)+'…'+a.slice(-4)}),2500); }catch(e){}
  try{ hpXmUi(); }catch(e){} return true; }
async function hpXmNickAsk(){
  const a=hpXmAcct(); if(!a||typeof ID==='undefined'||!ID) return false; const cur=hpXmNameOf(a);
  if(typeof hpAsk!=='function'){ let v=null; try{ v=prompt(TF('nt_xm_nick',{a:a.slice(0,6)+'…'+a.slice(-4)}),cur); }catch(e){} if(v===null) return false; return hpXmNick(v); }
  const wrap=document.createElement('div'); wrap.style.cssText='margin-top:10px'; const i=document.createElement('input'); i.type='text'; i.id='xm-nick'; i.maxLength=40; i.value=cur; i.placeholder=T('ph_xm_nick'); i.setAttribute('autocomplete','off'); i.setAttribute('autocapitalize','off'); i.spellcheck=false; i.style.cssText='width:100%'; wrap.appendChild(i);
  i.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); try{ if(typeof HP_ASK_CUR!=='undefined'&&HP_ASK_CUR&&HP_ASK_CUR.ok&&HP_ASK_CUR.ok.onclick) HP_ASK_CUR.ok.onclick(); }catch(e){} } });
  setTimeout(()=>{ try{ i.focus(); i.select(); }catch(e){} },60);
  const ok=await hpAsk({title:T('xm_nick_title'),text:TF('nt_xm_nick',{a:a.slice(0,6)+'…'+a.slice(-4)}),node:wrap});
  if(!ok) return false; return hpXmNick(i.value); }
function hpXmNickUi(a){ const b=document.getElementById('btn-xm-nick'); if(!b) return false; b.style.display=a?'':'none';
  if(a){ const k=hpXmNameOf(a)?'btn_xm_nick':'btn_xm_nick0'; if(b.getAttribute('data-i18n')!==k){ b.setAttribute('data-i18n',k); b.textContent=T(k); } } return !!a; }
function hpXmApply(a,n){ HP_XM_PEND=''; HP_XM_PEND_N=''; HP_XM_OPEN_AT=0; if(HP_XM_RET){ HP_XM_RET=false; try{ sessionStorage.removeItem('hp_xm_ret'); }catch(e){} }   HP_XM_PICKN++; HP_XM_LIVE={a:a,ok:true}; HP_XM_LIVE_AT=Date.now();   const was=hpXmAcct(); ID.xmAcct=a; ID.xmName=String(n||'').trim()||(typeof hpXmNameOf==='function'?hpXmNameOf(a):'');   try{ saveID(); }catch(e){}
  if(was!==a){ HP_XM_INFO=null; try{ log(TL('lg_xm_pick',{a:a})); }catch(e){} }
  try{ const sh=a.slice(0,6)+'…'+a.slice(-4), nm=hpXmName(); hpToast(TF('xm_picked',{a:nm?nm+(typeof hpPar==='function'?hpPar(sh):'（'+sh+'）'):sh}),2500); }catch(e){}
  if(HP_XM_BACK){ HP_XM_BACK=false; try{ const t=document.getElementById('t-post'); if(t&&t.click) t.click(); }catch(e){} }
  hpXmUi(); return true; }
async function hpXmRead(a){ if(HP_XM_RD) return false; HP_XM_RD=true; hpXmSt(T('xm_busy'));
  try{ HP_XM_INFO={acct:a,at:Date.now(),r:await hpEvAcct(a)}; }catch(e){ HP_XM_INFO={acct:a,at:Date.now(),err:String((e&&e.message)||e)}; }
  finally{ HP_XM_RD=false; } hpXmUi(); return true; }
function hpXmText(info){
  if(!info) return [T('xm_busy'),false];
  if(info.err) return [TF('xm_rdfail',{why:info.err}),true];
  if(!info.r) return [T('xm_noacct'),true];
  const evr=(info.r.evr||[]).reduce((s,l)=>s+(Number(l.v)||0),0);
  return [TF('xm_bal',{xah:hpNum(info.r.xah,6),evr:hpNum(evr,6)})+(evr>0?'':'\n'+T('xm_noevr')),!(evr>0)]; }
function hpXmUi(){ if(typeof document==='undefined'||!document.getElementById) return '';
  if(HP_XM_PEND&&typeof ID!=='undefined'&&ID) return hpXmApply(HP_XM_PEND,HP_XM_PEND_N)?'apply':'';
  const a=hpXmAcct(), $i=id=>document.getElementById(id);
  try{ const s=$i('xm-acct'); if(s){ const nm=a?hpXmName():''; const v=a?((nm||T('xm_nick_none'))+'　'+a):T('xm_none');   if(s.textContent!==v) s.textContent=v; } }catch(e){} try{ if(typeof hpXmNickUi==='function') hpXmNickUi(a); }catch(e){}
  try{ const b=$i('btn-xm-pick'); if(b){ const q=typeof hpXmQuiet==='function'&&hpXmQuiet(), k=!a?'btn_xm_pick':(!q&&hpXmDead(a))?'btn_xm_resign':'btn_xm_change';     if(b.classList&&b.classList.toggle) b.classList.toggle('pri',!(q&&a)); if(b.getAttribute('data-i18n')!==k){ b.setAttribute('data-i18n',k); b.textContent=T(k); } } }catch(e){}
  try{ const pp=$i('p-post'); if(!HP_XM_PRE&&pp&&pp.classList&&pp.classList.contains('on')){ HP_XM_PRE=true; hpRentLibs().catch(()=>{ HP_XM_PRE=false; }); } }catch(e){}
  if(HP_XM_OPEN_AT&&Date.now()-HP_XM_OPEN_AT<600e3) return 'open'; HP_XM_OPEN_AT=0;
  if(!a){ hpXmSt(''); return 'none'; }
  const I=HP_XM_INFO; if(!HP_XM_RD&&(!I||I.acct!==a||Date.now()-I.at>(I.err?60e3:600e3))){ hpXmRead(a); return 'read'; }
  if(!HP_XM_RD){ const x=hpXmText(I), dd=hpXmDead(a), ob=(dd&&HP_XM_LIVE&&HP_XM_LIVE.b)?String(HP_XM_LIVE.b):''; const q=typeof hpXmQuiet==='function'&&hpXmQuiet(), L=[]; if(x[1]&&!q) L.push(x[0]); if(dd&&!q) L.push(ob?TF('xm_other',{a:a.slice(0,6)+'…'+a.slice(-4),b:(typeof hpXmLabel==='function'?hpXmLabel(ob):ob.slice(0,6)+'…'+ob.slice(-4))}  ):T('xm_expired')); hpXmSt(L.join('\n'),(x[1]&&!q)?'warn':false);     } try{ hpXmLive(a); }catch(e){}   return 'show'; }
async function hpXmPick(){ if(typeof ID==='undefined'||!ID){ try{ hpToast(T('pt_noid')); }catch(e){} return false; }
  if(hpXmLocal()){ hpXmSt(T('xm_local'),true); return false; }
  hpXmSt(T('xm_opening')); HP_XM_OPEN_AT=Date.now(); HP_XM_ASK_AT=Date.now();
  try{ await hpRentLibs(); const XM=hpXmGet(); if(hpXmAcct()){ try{ await XM.logout(); }catch(e){} }
    const r=await XM.authorize(); if(r instanceof Error) throw r; return true; }
  catch(e){ HP_XM_OPEN_AT=0; hpXmSt(TF('xm_fail',{why:String((e&&e.message)||e)}),true); return false; } }
try{ if(typeof document!=='undefined'&&document.getElementById){ const b=document.getElementById('btn-xm-pick'); if(b&&!b.dataset.hpWired){ b.dataset.hpWired='1'; b.addEventListener('click',()=>{ hpXmPick(); }); } } }catch(e){}
try{ if(typeof document!=='undefined'&&document.getElementById){ const b=document.getElementById('btn-xm-nick'); if(b&&!b.dataset.hpWired){ b.dataset.hpWired='1'; b.addEventListener('click',()=>{ hpXmNickAsk(); }); } } }catch(e){}

function hpXmLocal(){ try{ const n=String(location.hostname||'').toLowerCase(); return n==='localhost'||n==='::1'||n==='[::1]'||/^127\./.test(n)||/^192\.168\./.test(n)||/^10\./.test(n)||/^172\.(1[6-9]|2\d|3[01])\./.test(n); }catch(e){ return false; } }
const HP_POST_PKG={path:'lib/post/index.js',size:118007,sha256:'30cbb880da3563f3253507c9ef8f67a88a4f4b6fec3828ddc5c7018819679d3f'};
const HP_POST_LOADER={path:'lib/post/loader.js',size:1986,sha256:'36c902f3659932c421170a6f768548074e8bc4ef00a28a89e4a5a075a7455d7d'};
const HP_POST_VER='bk36f164（2026-10-28）';
const HP_POST_SIG='lib/post/index.js.sig';
async function hpRentFile(P){
  let b; try{ const r=await fetch(P.path,{cache:'no-store'}); if(!r.ok) throw new Error('HTTP '+r.status); b=new Uint8Array(await r.arrayBuffer()); }catch(e){ throw new Error(TF('rn_pkg_read',{why:String((e&&e.message)||e)})); }
  const h=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b)),x=>x.toString(16).padStart(2,'0')).join('');
  if(b.length!==P.size||h!==P.sha256) throw new Error(TF('rn_pkg_bad',{h:h.slice(0,16)}));
  return b; }
async function hpRentBundle(){
  const b=await hpRentFile(HP_POST_PKG), l=await hpRentFile(HP_POST_LOADER);
  return [{name:'index.js',data:l},{name:'post_cur.js',data:b}]; }
let HP_RENT_BUSY=false;
let HP_RENT_J=null, HP_RENT_SIGNED=0, HP_RENT_T0='', HP_RENT_FL=null;
function hpRentProg(J){ if(!J||!J.done) return null; return {n:Number(J.steps)||0, d:(J.needKey&&J.done.key?1:0)+((J.done.acq||J.acqTx)?1:0)+(J.ext>0&&J.done.ext?1:0)}; }
function hpRentTitle(left){ try{ if(typeof document==='undefined') return; if(!HP_RENT_T0) HP_RENT_T0=String(document.title||''); document.title=left>0?TF('rn_title_left',{n:left})+HP_RENT_T0:HP_RENT_T0; }catch(e){} }
function hpRentPhone(){ try{ return typeof navigator!=='undefined'&&/iPhone|iPad|iPod|Android/i.test(String(navigator.userAgent||'')); }catch(e){ return false; } }
function hpRentCall(){
  try{ if(typeof notifySound==='function') notifySound('warn'); }catch(e){}
  try{ if(typeof hpToast==='function') hpToast(T('rn_call'),4000); }catch(e){}
  try{ if(HP_RENT_FL) clearInterval(HP_RENT_FL); let n=0; const J=HP_RENT_J; HP_RENT_FL=setInterval(()=>{ n++; try{ if(n%2) document.title=T('rn_call_t'); else { const p=hpRentProg(J); hpRentTitle(p?p.n-p.d:0); } }catch(e){} if(n>=14){ clearInterval(HP_RENT_FL); HP_RENT_FL=null; } },800); }catch(e){} }

function hpRentFrom(){ return (typeof ID!=='undefined'&&ID&&ID.privateKeyPem)?'m':'d'; }
async function hpRentSeed(acct,kind,from){
  from=from||hpRentFrom(); let seed=null, head='';
  if(from==='m'){ if(typeof ID==='undefined'||!ID||!ID.privateKeyPem) throw new Error('nomaster');
    const der=pemToBytes(ID.privateKeyPem); seed=der.slice(der.length-32); head='handpost-lease:v1:'; }
  else if(from==='d'){ if(typeof hpDevKey!=='function') throw new Error('nodevkey');
    const kp=await hpDevKey(), sk=kp&&kp.privateKey; if(!sk||sk.length!==65) throw new Error('nodevkey');
    seed=sk.slice(1,33); head='handpost-lease-dev:v1:'; }
  else throw new Error('badfrom');
  const k=await crypto.subtle.importKey('raw',seed,{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const h=new Uint8Array(await crypto.subtle.sign('HMAC',k,new TextEncoder().encode(head+kind+':'+acct)));
  try{ seed.fill(0); }catch(e){}
  return Array.from(h,b=>b.toString(16).padStart(2,'0')).join(''); }
async function hpRentKeys(acct,from){ await sodium.ready; from=from||hpRentFrom(); const ms=await hpRentSeed(acct,'msg',from), os=await hpRentSeed(acct,'owner',from);
  const okp=sodium.crypto_sign_seed_keypair(sodium.from_hex(os));
  return {msgSeed:ms, msgPub:await hpEvMsgPub(ms), ownerSk:sodium.to_hex(okp.privateKey), ownerPub:'ed'+sodium.to_hex(okp.publicKey), from:from}; }
function hpRentPlan(price,evr,size,hasKey){ size=Number(size)||3600; const per=Number(price)||0, n=hpEvMomEvr(evr,per);
  return {n:n, ext:Math.max(0,n-1), total:Number(hpEvEvr(per*n)), steps:(hasKey?0:1)+1+(n>1?1:0), days:Math.floor(n*size/86400)}; }
let HP_RENT_TRY_N=8, HP_RENT_TRY_GAP=5000;

function hpRentAlive(){ try{ return !!(typeof ID!=='undefined'&&ID&&ID.lease&&!ID.lease.gone&&typeof hpLeaseExp==='function'&&hpLeaseExp()>Date.now()); }catch(e){ return false; } }

function hpRentQuit(){ try{ const J=ID&&ID.rentJob; if(J){ hpRentLog('lg_rn_quit',{h:String(J.host||'').slice(0,8)}); delete ID.rentJob; saveID(); } }catch(e){} hpRentHide(); try{ if(typeof hpToast==='function') hpToast(T('rn_quit_done'),5000); }catch(e){} try{ hpPostUi(); }catch(e){} return true; }
function hpRentOwned(){ try{ return typeof POST!=='undefined'&&!!POST.up&&!POST.notOwner&&!(typeof ID!=='undefined'&&ID&&ID.lease&&ID.lease.gone); }catch(e){ return false; } }
function hpRentBox(){ let c=document.getElementById('post-run'); if(!c){ const p=document.getElementById('p-post'); if(!p) return null; c=document.createElement('div'); c.className='card'; c.id='post-run'; p.insertBefore(c,p.firstChild); }
  try{ const at=(typeof HP_RUN_AT==='string'&&HP_RUN_AT)?document.getElementById(HP_RUN_AT):null; if(at&&at.parentNode&&!(at.style&&at.style.display==='none')){ if(c.nextSibling!==at) at.parentNode.insertBefore(c,at); } else if(c.isConnected&&c.parentNode&&c.parentNode.firstChild!==c) c.parentNode.insertBefore(c,c.parentNode.firstChild); }catch(e){}
  c.style.display=''; return c; }
function hpRentIsMove(){ try{ const J=(typeof HP_RENT_J!=='undefined'&&HP_RENT_J)||(typeof ID!=='undefined'&&ID&&ID.rentJob)||null; return !!(J&&(J.move||J.obk==='move')); }catch(e){ return false; } }
function hpRentShow(o){
  const c=hpRentBox(); if(!c) return null; c.textContent=''; c.dataset.job=o.job?String(o.job):'';
  const el=(t,cls,x)=>{ const e=document.createElement(t); if(cls) e.className=cls; if(x!=null) e.textContent=x; return e; };
  c.appendChild(el('h2',null,o.title||T((typeof hpRentIsMove==='function'&&hpRentIsMove())?'mv2_title':'rn_title')));
  const pg=(o.lines&&o.lines.length)?hpRentProg(HP_RENT_J):null;
  if(pg&&pg.n){ const left=Math.max(0,pg.n-pg.d), d=el('div',null,left?TF('rn_prog',{dots:'●'.repeat(pg.d)+'○'.repeat(left),n:left}):T('rn_prog_done')); d.id='rn-prog'; d.style.cssText='font-size:18px;font-weight:700;margin:2px 0 8px;color:'+(left?'var(--amber)':'var(--teal)'); c.appendChild(d); if(!HP_RENT_FL) hpRentTitle(left); }
  for(const [t,s] of (o.lines||[])){ const d=el('div','kv',(s==='ok'?'✓ ':s==='now'?'▸ ':s==='ng'?'✕ ':'・')+t); if(s==='ng') d.style.color='var(--red)'; else if(s==='now') d.style.color='var(--teal)'; else if(!s) d.style.opacity='.6'; c.appendChild(d); }
  if(o.note){ const n=el('div','note',o.note); n.style.whiteSpace='pre-line'; n.style.marginTop='6px'; c.appendChild(n); }
  if(o.qr){ const q=el('div'); q.style.cssText='margin-top:8px;display:flex;gap:12px;align-items:center;flex-wrap:wrap';
    if(hpRentPhone()){ const a=el('a','b pri',T('rn_open')); a.href=o.qr.url; a.target='_blank'; a.rel='noopener'; a.style.cssText='display:block;width:100%;text-align:center;font-size:17px;padding:14px 12px;box-sizing:border-box;text-decoration:none;background:var(--teal);border:1px solid var(--teal);border-radius:10px;color:#06231d;font-weight:600';   q.appendChild(a); const nt=el('div','note',T('rn_open_nt')); nt.style.cssText='width:100%'; q.appendChild(nt); }
    else{ const im=el('img'); im.src=o.qr.png; im.alt='QR'; im.style.cssText='width:160px;height:160px;background:#fff;border-radius:6px'; q.appendChild(im); const nt=el('div','note',T('rn_qr_nt')); q.appendChild(nt); }
    c.appendChild(q); }
  if(o.btns&&o.btns.length){ const r=el('div','row'); r.style.marginTop='8px'; for(const [t,fn,pri] of o.btns){ const b=el('button','b'+(pri?' pri':''),t); b.type='button'; b.addEventListener('click',fn); r.appendChild(b); } c.appendChild(r); }
  try{ if(c.scrollIntoView) c.scrollIntoView({block:(o.top||o.qr||!(o.lines&&o.lines.length))?'start':'nearest',behavior:'smooth'}); }catch(e){} return c; }
function hpRentHide(){ try{ const c=document.getElementById('post-run'); if(c){ c.style.display='none'; c.textContent=''; } }catch(e){} HP_RENT_J=null; try{ if(HP_RENT_FL){ clearInterval(HP_RENT_FL); HP_RENT_FL=null; } }catch(e){} hpRentTitle(0); HP_RENT_T0=''; }
function hpRentLines(J,cur,ng){ const L=[], st=k=>k===ng?'ng':(J.done&&J.done[k])?'ok':k===cur?'now':''; let i=0; const S=J.steps;
  if(J.needKey) L.push([TF('rn_s_key',{i:++i,n:S}),st('key')]);
  L.push([TF('rn_s_acq',{i:++i,n:S,p:J.price.value}),st('acq')]);
  L.push([T('rn_s_dep'),st('dep')]); L.push([T('rn_s_try'),st('try')]);
  if(J.ext>0) L.push([TF('rn_s_ext',{i:++i,n:S,d:hpRentDays(J),e:hpEvEvr(Number(J.price.value)*J.ext)}),st('ext')]);
  L.push([T('rn_s_save'),st('save')]); return L; }
function hpRentSave(J){ try{ const o=Object.assign({},J); delete o.files; delete o.keys; ID.rentJob=o; saveID(); }catch(e){} }
function hpRentLog(k,o){ try{ log(TL(k,o)); }catch(e){} }
async function hpRentSign(J,k,tx,instr,note){
  hpRentShow({lines:hpRentLines(J,k),note:note+'\n'+T('rn_wait_x')});
  const r=await hpXmSubmit(tx,instr,c=>{ hpRentShow({lines:hpRentLines(J,k),note:note+(c&&c.pushed?'\n'+T('rn_pushed'):''),qr:{png:c.refs.qr_png,url:c.next.always}}); if(HP_RENT_SIGNED>0) hpRentCall(); },{get:()=>(J.pend&&J.pend.k===k)?J.pend.uuid:'',set:u=>{ J.pend={k:k,uuid:u,at:Date.now()}; hpRentSave(J); },clear:()=>{ if(J.pend&&J.pend.k===k){ delete J.pend; hpRentSave(J); } }});
  if(!r.signed) throw new Error(T('rn_rejected'));
  if(r.result!=='tesSUCCESS') throw new Error(TF('rn_txfail',{r:r.result||'?'}));
  try{ if(HP_RENT_FL){ clearInterval(HP_RENT_FL); HP_RENT_FL=null; } }catch(e){} HP_RENT_SIGNED++; return r.txid; }

async function hpRentLeftAsk(addr,at){ const J=ID.rentJob, same=String(J.host||'')===String(addr||''), unpaid=hpRentUnpaid(J)&&!J.pend; let sw=false, node=null;
  if(unpaid&&!same){ node=document.createElement('div'); node.style.marginTop='12px'; const b=document.createElement('button'); b.type='button'; b.className='b'; b.id='rn-left-switch'; b.textContent=T('btn_rn_switch'); b.style.width='100%';
    b.onclick=()=>{ sw=true; try{ if(HP_ASK_CUR) HP_ASK_CUR.done(false); }catch(e){} }; node.appendChild(b); }
  const v=await hpAsk({title:T('rn_left_title'),text:TF(unpaid?(same?'rn_left_ask_same':'rn_left_ask'):'rn_left_ask_paid',{h:hpHostName(J.host)}),node:node,ok:T('btn_rn_resume'),cancel:T('btn_rn_close'),why:'借りる途中の続き'});
  if(sw){ hpRentQuit(); return hpRentStart(addr,at); }
  if(!v) return false;
  try{ const c=document.getElementById('post-run'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){}
  return hpRentResume(); }
async function hpRentStart(addr,at){
  if(HP_RENT_BUSY) return false; const Tt=k=>T(k);
  if(typeof ID==='undefined'||!ID){ hpTell(Tt('pt_noid')); return false; }
  const sub=!ID.privateKeyPem&&typeof hpIsChild==='function'&&hpIsChild();
  if(sub){   } else if(!ID.privateKeyPem){ hpTell(Tt('rn_nomain')); return false; }
  if(ID.rentJob){ return hpRentLeftAsk(addr,at); }
  if(sub&&typeof hpBoxSub==='function'&&hpBoxSub()&&!(typeof HP_OB_RE!=='undefined'&&HP_OB_RE)){ hpTell(Tt('ob_owned')); return false; }   if(sub&&typeof HP_BF_ALLOW!=='undefined'&&!HP_BF_ALLOW){ hpTell(Tt('ob_lodge_no')); return false; }
  const lodger=(sub&&typeof hpMcBoxMine==='function'&&hpMcBoxMine()==='')||(sub&&!!(typeof HP_OB_RE!=='undefined'&&HP_OB_RE));
  const swap=!!(typeof HP_MOVE!=='undefined'&&HP_MOVE&&typeof HP_SWAP!=='undefined'&&HP_SWAP&&hpIsMain()&&!hpRentOwned()&&hpRentAlive());   const move=swap||!!(typeof HP_MOVE!=='undefined'&&HP_MOVE&&hpIsMain()&&hpRentOwned()&&ID.lease&&!ID.lease.gone);   if(hpRentOwned()&&!move&&!lodger){ hpTell(Tt('rn_owned')); return false; }
  if(!sub&&!move&&hpRentAlive()){ hpTell(Tt('sw_need')); return false; }
  const acct=hpXmAcct(); if(!acct){ hpTell(Tt('rn_noacct')); try{ const c=document.getElementById('post-xm'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){} return false; }
  HP_RENT_BUSY=true;
  HP_RUN_AT=at||(move?'post-move':'');   HP_RENT_J=null; try{ HP_RENT_T0=String(document.title||''); }catch(e){} try{ hpRentShow({lines:[],note:Tt('xm_checking'),top:1}); await hpRentLibs(); if((await hpXmSignedAs(4000))!==acct&&!(await hpXmEnsure(acct,hpRentShow))){ hpRentHide(); return false; } hpRentShow({lines:[],note:Tt('rn_reading')});
    let host, me, size=3600; try{ host=await hpEvHost(addr); me=await hpEvAcct(acct); try{ const c=await hpMomCfg(); if(c&&c.size>0) size=c.size; }catch(e){} }catch(e){ throw new Error(TF('rn_readfail',{why:String((e&&e.message)||e)})); }
    if(!host||!host.offers.length) throw new Error(Tt('rn_nofree'));
    if(host.kt!=='ed25519'&&host.kt!=='secp256k1') throw new Error(Tt('rn_hostkey'));
    if(!me) throw new Error(Tt('xm_noacct'));
    const keys=await hpRentKeys(acct), offer=host.offers[0], price=offer.Amount;
    if(!price||typeof price!=='object'||price.currency!=='EVR') throw new Error(Tt('rn_nofree'));
    const hasKey=me.key===keys.msgPub.toUpperCase(), evr=(me.evr||[]).reduce((s,l)=>s+(Number(l.v)||0),0);
    const files=await hpRentBundle();

    const node=document.createElement('div'); node.style.marginTop='10px';
    const fmU=x=>{ try{ return (typeof fmtTS==='function')?fmtTS(x):new Date(x).toLocaleString(); }catch(e){ return String(x); } };
    const d0=HP_DAYS_DEF;
    const cost=document.createElement('div'); cost.className='note'; cost.style.cssText='white-space:pre-line;margin-top:6px';

    const txt=P=>P.n<1?TF('rn_min',{p:price.value}):TF('rn_cost',{t:hpNum(P.total,6),p:price.value,n:P.n,d:P.days,u:fmU(Date.now()+P.n*size*1000),s:P.steps})+(P.days<HP_AMT_SHORT?'\n'+TF('rn_few',{d:P.days}):'')+(evr<P.total?'\n'+TF('rn_short',{e:hpNum(evr,6)}):'');
    const upd=()=>{ const P=hpRentPlanDays(price.value,amt.get(),size,hasKey); cost.textContent=txt(P); cost.style.color=(P.n<1||evr<P.total)?'var(--red)':''; };
    const amt=hpDaysNode('rn-days',d0,evr,upd); upd(); node.appendChild(amt.node); node.appendChild(cost);
    hpRentShow({lines:[],note:Tt('rn_confirm_wait')});
    let many=0; try{ many=contacts().length; }catch(e){}
    let held=[]; try{ held=await hpEvLeases(acct); hpLog('借りる前の確かめ：この口座が持っているリースの札 '+held.length+' 枚'); }catch(e){ held=[]; } const heldMine=(ID.lease&&ID.lease.acct===acct&&typeof ID.lease.tok==='string')?ID.lease.tok:'';
    const again=!move&&!sub&&!!(ID.lease&&ID.lease.gone);     if(!(await hpAsk({title:Tt(move?'mv2_title':again?'ag_title':'rn_title'),text:(move?TF('mv2_head',{h:hpMvOldName()})+((typeof hpMvLostText==='function')?hpMvLostText():'') +'\n\n':'')+(again?TF('ag_head',{t:(typeof hpLeaseText==='function')?hpLeaseText():''})+'\n\n':'')+(sub?Tt((typeof HP_OB_RE!=='undefined'&&HP_OB_RE)?'ob_head_re':'ob_head')+'\n\n':'') +TF('rn_confirm',{h:hpHostName(addr,host&&host.dom),a:acct.slice(0,6)+'…'+acct.slice(-4)})+'\n\n'+TF('rn_promise',{s:hasKey?2:3})+hpRentHeldText(held,heldMine,acct) +'\n\n'+Tt('rn_try_plan') +(again?'\n\n'+Tt('ag_lost')+(many?'\n'+TF('ag_contacts',{n:many}):''):(move?'\n\n'+((swap||!hpMvSubs())?TF('mv2_after0',{n:many}):TF('mv2_after',{n:many,m:hpMvSubs()})) +((swap&&hpMvSubs())?'\n\n'+Tt('sw_note'):'') +(acct===ID.lease.acct?'\n\n'+Tt('mv2_same'):''):sub?'\n\n'+Tt((typeof HP_OB_RE!=='undefined'&&HP_OB_RE)?'ob_after_re':'ob_after')+'\n\n'+Tt('ob_acct')  :many?'\n\n'+Tt('rn_contacts'):''))  ,node:node,ok:Tt('rn_go'),auth:sub,why:'この端末の郵便受けを借りる'  }))){ hpRentHide(); return false; }
    const P=hpRentPlanDays(price.value,amt.get(),size,hasKey); if(P.n<1) throw new Error(TF('rn_min',{p:price.value}));
    if(evr<P.total) throw new Error(TF('rn_short',{e:hpNum(evr,6)}));
    const J={sub:sub?1:0  ,obre:(sub&&(typeof HP_OB_RE!=='undefined'&&HP_OB_RE))?1:0  ,obk:(sub&&(typeof HP_OB_RE!=='undefined'&&HP_OB_RE))?String(HP_OB_RE):''  ,again:again?1:0  ,move:move?{from:String(POST.url||((typeof hpPostUrl==='function')?hpPostUrl():'')||''),lease:Object.assign({},ID.lease),sw:swap?1:0  }:0  ,host:addr,acct:acct,price:{value:String(price.value),issuer:price.issuer},days:P.days,n:P.n,ext:P.ext,steps:P.steps,needKey:!hasKey,done:{},at:Date.now(),files:files,keys:keys,kf:keys.from  };
    hpRentLog('lg_rn_start',{h:addr,a:acct,d:P.days,t:P.total});
    return await hpRentRun(J,host,offer);
  }catch(e){ hpRentFail(null,'',e); return false; }
  finally{ HP_RENT_BUSY=false; } }
function hpRentUnpaid(J){ return !!(J&&J.done&&!J.done.acq&&!J.acqTx); }
async function hpRentDrop(){ const J=ID&&ID.rentJob; if(!J){ hpRentHide(); return false; }
  if(!(hpRentUnpaid(J)&&!J.pend)){ if(!(await hpAsk({text:T('cf_rn_drop'),danger:true}))) return false; delete ID.rentJob; try{ saveID(); }catch(e){} hpRentHide(); return true; }
  return hpRentQuit(); }

function hpRentWhy(e){ const w=String((e&&e.message)||e); if(w===T('rn_rejected')) return w+'\n'+T('rn_xm_bang');
  return (e&&typeof e==='object'&&/^(TypeError|ReferenceError|SyntaxError|RangeError)$/.test(String(e.name||'')))?T('rn_fail_odd'):w; }
let HP_EXT_LATE_MS=57*60e3;
function hpRentExtLate(J){ try{ if(!J) return false; if(J.late) return true; const t=Number(J.acqAt)||0; return t>0&&(Date.now()-t)>HP_EXT_LATE_MS; }catch(e){ return false; } }
function hpRentFail(J,k,e){ hpRentLog('lg_rn_fail',{k:k||'-',why:String((e&&e.message)||e)}); const why=(typeof hpRentWhy==='function')?hpRentWhy(e):String((e&&e.message)||e);
  if(J&&e&&e.hpLate){   hpRentShow({top:1,lines:hpRentLines(J,k,k),note:T('rn_ext_late'),btns:[[T('btn_rn_drop'),()=>{ hpRentQuit(); },true]],job:J.at}); return; }
  if(J&&e&&e.hpTry){   hpRentShow({top:1,lines:hpRentLines(J,k,k),note:T('rn_try_fail')+(J.ext>0&&!J.done.ext?'\n'+T('rn_try_fail_ext'):''),btns:[[T('btn_rn_try_again'),()=>{ hpRentResume(); },true],[T('btn_rn_try_quit'),()=>{ hpRentQuit(); }]],job:J.at}); return; }
  if(hpRentUnpaid(J)&&ID&&ID.rentJob&&ID.rentJob.at===J.at){   hpRentShow({top:1,lines:hpRentLines(J,k,k),note:TF('rn_fail',{why:why})+'\n'+T('rn_unpaid'),btns:[[T('btn_rn_again'),()=>{ hpRentResume(); },true],[T('btn_rn_drop'),()=>{ hpRentDrop(); }]],job:J.at}); return; }
  hpRentShow({top:1,lines:J?hpRentLines(J,k,k):[],note:TF('rn_fail',{why:why})+(J&&J.done&&(J.done.acq||J.acqTx)?'\n'+T((J.done.ext||!(J.ext>0))?'rn_fail_after2':'rn_fail_after'):''),btns:J&&J.done&&(J.done.acq||J.acqTx)?[[T('btn_rn_resume'),()=>{ hpRentResume(); },true]]:[[T('btn_rn_close'),()=>{ hpRentHide(); }]],job:J&&J.done&&(J.done.acq||J.acqTx)?J.at:0}); }

async function hpRentFresh(J,host,offer){
  const amt={currency:'EVR',value:String(J.price.value),issuer:J.price.issuer}, same=a=>!!a&&typeof a==='object'&&a.currency==='EVR'&&String(a.value)===amt.value&&a.issuer===amt.issuer;
  let h=null; try{ h=await hpEvHost(J.host); }catch(e){ throw new Error(TF('rn_readfail',{why:String((e&&e.message)||e)})); }
  if(!h) throw new Error(T('rn_nofree'));
  if(h.kt!=='ed25519'&&h.kt!=='secp256k1') throw new Error(T('rn_hostkey'));
  if(J.pend&&J.pend.k==='acq'&&J.pend.uuid&&J.offerIdx){ let st=null; try{ st=await hpXmPayloadState(J.pend.uuid); }catch(e){ st=null; }
    if(!st) throw new Error(T('rn_pend_unknown'));
    if(st.signed||st.open) return {host:h, offer:{index:String(J.offerIdx),Amount:amt}};
    delete J.pend; hpRentSave(J); }
  const i0=String((offer&&offer.index)||J.offerIdx||'');
  const o=h.offers.find(t=>String(t.index)===i0&&same(t.Amount))||h.offers.find(t=>same(t.Amount))||null;
  if(!o) throw new Error(h.offers.length?TF('rn_price_changed',{p:String((h.offers[0].Amount&&h.offers[0].Amount.value)||'?')}):T('rn_nofree'));
  if(i0&&String(o.index)!==i0) hpLog('借りる直前に空きを読み直した：選んだ札はもう無いので、同じ家賃の別の札で借りる');
  J.offerIdx=String(o.index); return {host:h, offer:o}; }
async function hpRentRun(J,host,offer){ let k=''; HP_RENT_J=J; HP_RENT_SIGNED=0;
  try{
    if(J.needKey&&!J.done.key){ k='key'; await hpRentSign(J,k,hpEvKeyTx(J.acct,J.keys.msgPub),TF('rn_x_key',{i:1,n:J.steps}),T('rn_n_key'));
      for(let i=0;i<12;i++){ const m=await hpEvAcct(J.acct).catch(()=>null); if(m&&m.key===J.keys.msgPub.toUpperCase()) break; await new Promise(r=>setTimeout(r,2500)); }
      J.done.key=1; }
    if(!J.done.acq&&!J.acqTx){ k='acq'; hpRentShow({lines:hpRentLines(J,k),note:T('rn_reading')}); const f=await hpRentFresh(J,host,offer); host=f.host; offer=f.offer; }
    if(!J.done.acq&&!J.acqTx){ k='acq'; const req=hpEvReq(J.keys.ownerPub), data=await hpEvSeal(host,new TextEncoder().encode(JSON.stringify(req))), from=(await hpEvLedgerNow())-2, i=J.needKey?2:1;
      const txid=await hpRentSign(J,k,hpEvLeaseTx(J.acct,offer,data),TF('rn_x_acq',{i:i,n:J.steps,p:J.price.value,h:J.host.slice(0,8)}),T('rn_n_acq'));
      J.acqTx=txid; J.acqFrom=from; J.tok=String(offer.index).toUpperCase(); hpRentSave(J); }
    return await hpRentAfter(J);
  }catch(e){ if(k==='acq'&&/tecNO_PERMISSION/.test(String((e&&e.message)||e))) e=new Error(TF('rn_gone',{r:'tecNO_PERMISSION'}));   hpRentFail(J,k,e); return false; } }
async function hpRentAfter(J){ let k=''; HP_RENT_J=J;
  try{
    if(!J.done.acq&&J.acqTx){ k='acq'; if(!J.keys) J.keys=await hpRentKeys(J.acct,J.kf||'m');
      hpRentShow({lines:hpRentLines(J,k),note:T('rn_hostwait')+((J.ext>0&&!J.done.ext)?'\n'+TF('rn_wait_more',{i:J.steps,n:J.steps}):'')});
      const w=await hpEvWait(J.acct,Number(J.acqFrom)||1,['evnAcquireSuccess','evnAcquireError'],J.acqTx,300000);
      if(!w) throw new Error(TF('rn_noreply',{tx:String(J.acqTx).slice(0,12)}));
      const m=hpEvMemo0(w.tx); if(w.type==='evnAcquireError'){ try{ delete ID.rentJob; saveID(); }catch(e){} J.done={}; J.acqTx=''; throw new Error(TF('rn_refused',{why:hpHexStr(m.data).slice(0,120)})); }
      J.info=hpEvInfo(await hpEvOpen(hpHexStr(m.data),J.keys.msgSeed)); J.acqAt=Date.now(); J.done.acq=1; hpRentSave(J);
      hpRentLog('lg_rn_acq',{u:hpEvUrl(J.info),tok:String(J.tok).slice(0,8)}); }
    if(!J.done.dep){ k='dep'; if(!J.files||!J.files.some(f=>f.name==='index.js')) J.files=await hpRentBundle();   if(!J.keys) J.keys=await hpRentKeys(J.acct,J.kf||'m');
      hpRentShow({lines:hpRentLines(J,k),note:T('rn_n_dep')});
      const zip=hpEvBundle(J.files,J.info.pubkey,1000);
      let had=false; if(J.depTry){ try{ had=await hpEvHasPost(hpEvUrl(J.info)); }catch(e){ had=false; } }
      if(!had){ J.depTry=(Number(J.depTry)||0)+1; hpRentSave(J); try{ await hpEvDeploy(J.info,J.keys.ownerSk,zip,()=>{}); }catch(e){ try{ had=await hpEvHasPost(hpEvUrl(J.info)); }catch(_){ had=false; } if(!had) throw e; } }
      J.done.dep=1; hpRentSave(J); hpRentLog(had?'lg_rn_dep_had':'lg_rn_dep',{b:zip.length,h:HP_POST_PKG.sha256.slice(0,16)});   }
    if(!J.done.try){ k='try';
      hpRentShow({lines:hpRentLines(J,k),note:T('rn_n_try')}); const u0=hpEvUrl(J.info); let live=false;
      for(let i=0;i<HP_RENT_TRY_N&&!live;i++){ if(i) await new Promise(r=>setTimeout(r,HP_RENT_TRY_GAP)); try{ live=await hpEvHasPost(u0); }catch(e){ live=false; } }
      if(!live){ hpRentLog('lg_rn_try_ng',{u:u0}); const e=new Error(T('rn_try_ng')); e.hpTry=1; throw e; }
      J.done.try=1; hpRentSave(J); hpRentLog('lg_rn_try',{u:u0}); }
    if(J.ext>0&&!J.done.ext){ k='ext'; if(typeof hpRentExtLate==='function'&&hpRentExtLate(J)){ const e=new Error(T('rn_ext_late')); e.hpLate=1; throw e; }
      const from=(J.extTx&&Number(J.extFrom)>0)?Number(J.extFrom):((await hpEvLedgerNow())-2);
      const txid=J.extTx||await hpRentSign(J,k,hpEvExtendTx(J.acct,J.host,J.tok,J.price,J.ext),TF('rn_x_ext',{i:J.steps,n:J.steps,d:hpRentDays(J),e:hpEvEvr(Number(J.price.value)*J.ext),h:J.host.slice(0,8)}),TF('rn_n_ext',{h:J.host}));
      if(!J.extTx){ J.extTx=txid; J.extFrom=from; hpRentSave(J); }
      hpRentShow({lines:hpRentLines(J,k),note:T('rn_hostwait2')+'\n'+T('rn_wait_last')});
      const w=await hpEvWait(J.acct,from,['evnExtendSuccess','evnExtendError'],txid,180000);
      if(!w) throw new Error(TF('rn_noreply',{tx:txid.slice(0,12)}));
      if(w.type==='evnExtendError'){ delete J.extTx; delete J.extFrom; hpRentSave(J); const why=hpHexStr(hpEvMemo0(w.tx).data).slice(0,120);
        if(/invalid_extend_lease/i.test(why)){ J.late=1; hpRentSave(J); const e=new Error(T('rn_ext_late')); e.hpLate=1; throw e; }
        throw new Error(TF('rn_refused',{why:why})); }
      J.expMom=hpEvExtMom(hpEvMemo0(w.tx).data); J.done.ext=1; delete J.extTx; delete J.extFrom; hpRentSave(J); hpRentLog('lg_rn_ext',{m:J.expMom}); }
    k='save'; const url=hpEvUrl(J.info); let mv=null; if(J.move&&typeof hpMoveBefore==='function') mv=await hpMoveBefore(J,url);
    if(!J.move&&typeof hpMove2Before==='function'){ const m2=await hpMove2Before(J,url); if(m2&&!m2.skip) mv=m2; }
    if(!J.move&&typeof hpBoxSubBefore==='function') hpBoxSubBefore(url);
    try{ stopBg(); }catch(e){} try{ localStorage.setItem('p2p_post',url); }catch(e){}
    delete ID.rentJob; ID.lease={acct:J.acct,tok:J.tok,at:Date.now(),host:J.host}; try{ if(url&&typeof J.tok==='string'&&J.tok){ const m=(ID.leaseByUrl&&typeof ID.leaseByUrl==='object')?ID.leaseByUrl:{}; m[String(url)]=J.tok.toUpperCase(); const ks=Object.keys(m); while(ks.length>8) delete m[ks.shift()]; ID.leaseByUrl=m; } }catch(e){}     let nCard=0; if(J.move&&typeof hpMoveAfter==='function') nCard=hpMoveAfter(J,url,mv);   if(J.again){ try{ if(typeof hpCardDueMark==='function') nCard=hpCardDueMark(1); }catch(e){} hpRentLog('lg_ag_cards',{n:nCard}); }   try{ saveID(); }catch(e){}
    try{ if(typeof hpLeaseAcctSet==='function') hpLeaseAcctSet(J.acct); }catch(e){}
    try{ if(typeof hpTurnCfgSet==='function') hpTurnCfgSet(url,Number(J.info.gp_udp_port)||0,String(J.info.domain||'')); }catch(e){}
    setTimeout(()=>{ try{ startBg(); }catch(e){} },1500);
    J.done.save=1; hpRentLog('lg_rn_done',{u:url});
    hpRentShow({lines:hpRentLines(J,''),note:TF('rn_done',{u:url})+(J.sub?'\n'+T(J.obre?'ob_done_re':'ob_done'):'') +(J.move?'\n'+((typeof hpMvDoneText==='function')?hpMvDoneText(J,nCard,mv) :TF('mv2_done',{n:nCard,m:(mv&&mv.n)||0})+((mv&&mv.why)?'\n'+TF('mv2_nosub',{why:mv.why}):'')):'')+(J.again?'\n'+TF('ag_done',{n:nCard})+(hpAgSibs()?'\n'+T('ag_sibs'):''):''),btns:[[T('btn_rn_close'),()=>{ hpRentHide(); try{ hpPostUi(); }catch(e){} },true]]});
    return true;
  }catch(e){ hpRentFail(J,k,e); return false; } }
async function hpRentResume(){ if(HP_RENT_BUSY) return false; const J0=ID&&ID.rentJob; if(!J0) return false; HP_RENT_BUSY=true;
  try{ const J=JSON.parse(JSON.stringify(J0)); J.keys=await hpRentKeys(J.acct,J.kf||'m');

    if(!J.done||typeof J.done!=='object') J.done={}; if(hpRentUnpaid(J)){   HP_RENT_J=J; hpRentShow({top:1,lines:hpRentLines(J,''),note:T('xm_checking')}); await hpRentLibs(); if((await hpXmSignedAs(4000))!==J.acct&&!(await hpXmEnsure(J.acct,hpRentShow))){ hpRentHide(); return false; } J.files=await hpRentBundle(); return await hpRentRun(J,null,null); }
    return await hpRentAfter(J); }
  catch(e){ hpRentFail(ID&&ID.rentJob,'',e); return false; }
  finally{ HP_RENT_BUSY=false; } }
function hpRentUi(){ try{ if(HP_RENT_BUSY||typeof ID==='undefined'||!ID) return ''; const J=ID.rentJob; const c=document.getElementById('post-run');
    if(!J){ return ''; } if(c&&c.style.display!=='none'&&c.dataset.job===String(J.at)) return 'shown';
    HP_RENT_J=J; hpRentShow({lines:hpRentLines(J,''),note:hpRentUnpaid(J)?T('rn_left_unpaid'):TF('rn_left',{u:J.info?hpEvUrl(J.info):'?'}),btns:[[T('btn_rn_resume'),()=>{ hpRentResume(); },true],[T('btn_rn_drop'),()=>{ hpRentDrop(); }]]  ,job:J.at});
    return 'left'; }catch(e){ return ''; } }

const HP_XB_KEEP=15*60e3, HP_XB_WAIT='p2p_xmbr', HP_XB_SS='hp_xm_bridge';
let HP_XB_TEXT='', HP_XB_OPEN=false;
let HP_XB_GO=u=>{ location.replace(u); };
function hpXbMine(){ try{ return localStorage.getItem('pkce_state')||''; }catch(e){ return ''; } }
function hpXbApp(){ try{ return typeof navigator!=='undefined'&&navigator.standalone===true; }catch(e){ return false; } }
function hpXbOther(search){ try{ const s=search==null?((typeof location!=='undefined'&&location.search)||''):search; if(!hpXmReturning(s)) return ''; const l=new URLSearchParams(s); if(l.get('error_description')||!(l.get('authorization_code')||l.get('code'))) return ''; const st=l.get('state')||''; if(!st||st===hpXbMine()) return ''; return 'hpxm1:'+l.toString(); }catch(e){ return ''; } }
function hpXbParse(s){ s=String(s==null?'':s).trim(); if(!s) return null; s=s.replace(/^hpxm1:/i,''); const q=s.indexOf('?'); if(q>=0) s=s.slice(q+1); const h=s.indexOf('#'); if(h>=0) s=s.slice(0,h);
  let l; try{ l=new URLSearchParams(s); }catch(e){ return {bad:1}; } const code=l.get('code')||l.get('authorization_code')||'', state=l.get('state')||''; if(!code||!state) return {bad:1};
  if(!l.get('code')) l.set('code',code); if(!l.get('authorization_code')) l.set('authorization_code',code); return {code:code,state:state,q:l.toString()}; }
function hpXbGo(text){ const p=hpXbParse(text); if(!p) return 'xb_e_empty'; if(p.bad) return 'xb_e_bad'; const mine=hpXbMine(); if(!mine||p.state!==mine) return 'xb_e_state';
  try{ localStorage.removeItem(HP_XB_WAIT); }catch(e){}
  try{ hpLog('Safari に戻ったサインインの文字を受け取った。読み込み直してサインインを済ませる'); }catch(e){}
  try{ HP_XB_GO(location.pathname+'?'+p.q+location.hash); }catch(e){ return 'xb_e_bad'; } return 'go'; }
function hpXbMark(){ if(!hpXbApp()) return false; try{ localStorage.setItem(HP_XB_WAIT,String(Date.now())); }catch(e){} return true; }
function hpXbWaiting(){ try{ const t=Number(localStorage.getItem(HP_XB_WAIT)||0); return !!(t&&Date.now()-t<HP_XB_KEEP); }catch(e){ return false; } }
function hpXbEl(tag,cls,id,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(id) e.id=id; if(txt!=null) e.textContent=txt; return e; }
function hpXbShow(text){ if(HP_XB_OPEN||typeof hpAsk!=='function') return false; HP_XB_OPEN=true;
  const d=hpXbEl('div'), ta=hpXbEl('textarea','','xb-text'); ta.readOnly=true; ta.value=text; ta.rows=4; ta.style.cssText='width:100%;margin-top:10px;font-size:12px;word-break:break-all';
  const b=hpXbEl('button','b pri','btn-xb-copy',T('btn_xb_copy')); b.type='button'; b.style.marginTop='8px'; const msg=hpXbEl('div','note','xb-msg'); msg.style.marginTop='6px';
  b.onclick=async()=>{ let ok=false; try{ await navigator.clipboard.writeText(text); ok=true; }catch(e){ try{ ta.focus(); ta.select(); ok=!!(document.execCommand&&document.execCommand('copy')); }catch(x){} } msg.textContent=T(ok?'xb_copied':'xb_copy_no'); msg.style.color=ok?'var(--teal)':'var(--amber)'; return ok; };
  const nt=hpXbEl('div','note','',T('xb_back_note')); nt.style.marginTop='10px'; d.appendChild(ta); d.appendChild(b); d.appendChild(msg); d.appendChild(nt);
  hpAsk({title:T('xb_back_title'),text:T('xb_back_text'),node:d,noOk:true,cancel:T('btn_xb_close')}).then(()=>{ HP_XB_OPEN=false; try{ sessionStorage.removeItem(HP_XB_SS); }catch(e){} });
  try{ hpLog('Xaman のサインインの戻り：ほかの Handpost（ホーム画面）が頼んだもの。文字をコピーする小窓を出した'); }catch(e){} return true; }
function hpXbAsk(why){ if(HP_XB_OPEN||typeof hpAsk!=='function') return false; HP_XB_OPEN=true;
  const d=hpXbEl('div'), ta=hpXbEl('textarea','','xb-in'); ta.rows=3; ta.placeholder=T('xb_paste_ph'); ta.style.cssText='width:100%;margin-top:10px;font-size:12px;word-break:break-all';
  const row=hpXbEl('div','row'); row.style.marginTop='8px'; const pb=hpXbEl('button','b','btn-xb-paste',T('btn_xb_paste')); pb.type='button'; const gb=hpXbEl('button','b pri','btn-xb-go',T('btn_xb_go')); gb.type='button';
  const msg=hpXbEl('div','note','xb-err'); msg.style.marginTop='6px'; row.appendChild(pb); row.appendChild(gb); d.appendChild(ta); d.appendChild(row); d.appendChild(msg);
  pb.onclick=async()=>{ try{ const t=await navigator.clipboard.readText(); if(t) ta.value=t; }catch(e){ try{ ta.focus(); }catch(x){} } };
  gb.onclick=()=>{ const r=hpXbGo(ta.value); if(r==='go'){ msg.textContent=T('xb_going'); msg.style.color='var(--teal)'; gb.disabled=true; } else { msg.textContent=T(r); msg.style.color='var(--amber)'; } return r; };
  hpAsk({title:T('xb_paste_title'),text:T('xb_paste_text'),node:d,noOk:true,cancel:T('btn_xb_close')}).then(()=>{ HP_XB_OPEN=false; if(why==='back'){ try{ localStorage.removeItem(HP_XB_WAIT); }catch(e){} } });
  return true; }
function hpXbBack(){ if(!hpXbApp()||!hpXbWaiting()) return false; try{ if(document.visibilityState&&document.visibilityState!=='visible') return false; }catch(e){} return hpXbAsk('back'); }
function hpXbCardBtn(){ try{ if(!hpXbApp()) return false; const p=document.getElementById('btn-xm-pick'); if(!p||!p.parentNode) return false; if(document.getElementById('btn-xb-open')) return true;
    const b=hpXbEl('button','b','btn-xb-open',T('btn_xb_open')); b.type='button'; b.setAttribute('data-i18n','btn_xb_open'); b.onclick=()=>{ hpXbAsk('card'); }; p.parentNode.appendChild(b); return true; }catch(e){ return false; } }
{ const hpXbBind0=hpXmBind; hpXmBind=function(XM){ hpXbBind0(XM); try{ const a=XM&&XM.authorize; if(typeof a==='function'&&!XM.hpXb){ XM.hpXb=1; XM.authorize=function(){ hpXbMark(); return a.apply(XM,arguments); }; XM.on('success',()=>{ try{ localStorage.removeItem(HP_XB_WAIT); }catch(e){} }); } }catch(e){} }; }
try{ if(typeof document!=='undefined'&&document.head){ let t=''; try{ t=hpXbOther(); }catch(e){}
  if(t){ HP_XB_TEXT=t; try{ sessionStorage.setItem(HP_XB_SS,JSON.stringify({t:t,at:Date.now()})); }catch(e){} try{ history.replaceState(null,'',location.pathname+location.hash); }catch(e){} }
  else { try{ const j=JSON.parse(sessionStorage.getItem(HP_XB_SS)||'null'); if(j&&j.t&&Date.now()-j.at<HP_XB_KEEP) HP_XB_TEXT=j.t; }catch(e){} }
  const go=()=>{ if(HP_XB_TEXT) hpXbShow(HP_XB_TEXT); else { hpXbCardBtn(); hpXbBack(); } };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>{ setTimeout(go,300); }); else setTimeout(go,300);
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') setTimeout(()=>{ hpXbCardBtn(); hpXbBack(); },400); }); } }catch(e){}

const HP_XS_PFX='hpxm2:', HP_XS_KEEP=10*60e3, HP_XS_JWT_MIN=5*60e3;
let HP_XS_RL=()=>{ location.reload(); };
function hpXsUrl(){ try{ return location.origin+location.pathname.replace(/[^\/]*$/,'')+'xm.html'; }catch(e){ return 'xm.html'; } }
function hpXsDec(s){ s=String(s).replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return new TextDecoder().decode(u); }
function hpXsParse(text,now){ now=Number(now||Date.now()); let s=String(text==null?'':text).replace(/\s+/g,''); if(!s) return {e:'xb_e_empty'};
  if(s.toLowerCase().indexOf(HP_XS_PFX)!==0) return {e:'xs_e_bad'}; let o=null; try{ o=JSON.parse(hpXsDec(s.slice(HP_XS_PFX.length))); }catch(e){ return {e:'xs_e_bad'}; }
  if(!o||o.v!==2||typeof o.jwt!=='string'||o.jwt.split('.').length!==3||!HP_LG_RADDR.test(String(o.a||''))) return {e:'xs_e_bad'};
  const at=Number(o.at||0); if(!(at>0)||now-at>HP_XS_KEEP||at-now>120e3) return {e:'xs_e_old'};
  let exp=0; try{ exp=Number(JSON.parse(hpXsDec(o.jwt.split('.')[1])).exp||0)*1000; }catch(e){ return {e:'xs_e_bad'}; } if(!(exp-now>HP_XS_JWT_MIN)) return {e:'xs_e_old'};
  return {jwt:o.jwt,me:(o.me&&typeof o.me==='object')?o.me:{},a:String(o.a)}; }
function hpXsGo(text){ const p=hpXsParse(text); if(p.e) return p.e;
  try{ localStorage.setItem('XummPkceJwt',JSON.stringify({jwt:p.jwt,me:p.me})); }catch(e){ return 'xs_e_save'; }
  try{ sessionStorage.setItem('hp_xm_ret',String(Date.now())); }catch(e){} try{ localStorage.removeItem(HP_XB_WAIT); }catch(e){}
  try{ hpLog('Safari でサインインした文字を受け取った（口座 '+p.a.slice(0,6)+'…'+p.a.slice(-4)+'）。読み込み直してサインインを済ませる'); }catch(e){}
  try{ HP_XS_RL(); }catch(e){} return 'go'; }
function hpXsAsk(why){ if(HP_XB_OPEN||typeof hpAsk!=='function') return false; HP_XB_OPEN=true;
  const d=hpXbEl('div'), u=hpXsUrl(), lk=hpXbEl('div','mono','xs-url',u); lk.style.cssText='margin-top:10px;font-size:12px;word-break:break-all';
  const lb=hpXbEl('button','b','btn-xs-link',T('btn_xs_link')); lb.type='button'; lb.style.marginTop='6px'; const lm=hpXbEl('div','note','xs-link-msg'); lm.style.marginTop='4px';
  lb.onclick=async()=>{ let ok=false; try{ await navigator.clipboard.writeText(u); ok=true; }catch(e){} lm.textContent=T(ok?'xs_link_ok':'xs_link_no'); lm.style.color=ok?'var(--teal)':'var(--amber)'; return ok; };
  const ta=hpXbEl('textarea','','xb-in'); ta.rows=3; ta.placeholder=T('xb_paste_ph'); ta.style.cssText='width:100%;margin-top:12px;font-size:12px;word-break:break-all';
  const row=hpXbEl('div','row'); row.style.marginTop='8px'; const pb=hpXbEl('button','b','btn-xb-paste',T('btn_xb_paste')); pb.type='button'; const gb=hpXbEl('button','b pri','btn-xb-go',T('btn_xb_go')); gb.type='button';
  const msg=hpXbEl('div','note','xb-err'); msg.style.marginTop='6px'; row.appendChild(pb); row.appendChild(gb);
  d.appendChild(lk); d.appendChild(lb); d.appendChild(lm); d.appendChild(ta); d.appendChild(row); d.appendChild(msg);
  pb.onclick=async()=>{ try{ const t=await navigator.clipboard.readText(); if(t) ta.value=t; }catch(e){ try{ ta.focus(); }catch(x){} } };
  gb.onclick=()=>{ const r=hpXsGo(ta.value); if(r==='go'){ msg.textContent=T('xb_going'); msg.style.color='var(--teal)'; gb.disabled=true; } else { msg.textContent=T(r); msg.style.color='var(--amber)'; } return r; };
  hpAsk({title:T('xs_title'),text:T('xs_text'),node:d,noOk:true,cancel:T('btn_xb_close')}).then(()=>{ HP_XB_OPEN=false; if(why==='auth'){ try{ hpXmSt(''); }catch(e){} } });
  try{ hpLog('ホーム画面の Handpost：Xaman のサインインは Safari で（案内の小窓を出した）'); }catch(e){} return true; }
{ const f=hpXbAsk; hpXbAsk=function(why){ return hpXbApp()?hpXsAsk(why):f(why); }; }
{ const f=hpXbCardBtn; hpXbCardBtn=function(){ if(hpXbApp()){ try{ const b=document.getElementById('btn-xb-open'); if(b&&b.parentNode) b.parentNode.removeChild(b); }catch(e){} return false; } return f(); }; }
{ const hpXbBind2=hpXmBind; hpXmBind=function(XM){ hpXbBind2(XM); try{ const a=XM&&XM.authorize; if(typeof a==='function'&&!XM.hpXs){ XM.hpXs=1; XM.authorize=function(){
  if(hpXbApp()){ try{ localStorage.removeItem(HP_XB_WAIT); }catch(e){} try{ hpXmSt(T('xs_st')); }catch(e){} hpXsAsk('auth'); return new Promise(()=>{}); }
  return a.apply(XM,arguments); }; } }catch(e){} }; }

try{ if(typeof document!=='undefined'&&document.head){ let ret=false; try{ ret=hpXmReturning(); }catch(e){} if(ret){ try{ sessionStorage.setItem('hp_xm_ret',String(Date.now())); }catch(e){} } else { try{ const t=Number(sessionStorage.getItem('hp_xm_ret')||0); ret=!!(t&&Date.now()-t<900e3); }catch(e){} } if(ret){ HP_XM_RET=true; hpRentLibs().then(()=>hpXmGet()).catch(()=>{}); } } }catch(e){}

let HP_EXT_NAGGED=false;
function hpExtShow(o){ return hpRentShow(Object.assign({title:T('ext_title')},o)); }
async function hpExtStart(){
  if(HP_RENT_BUSY) return false; const Tt=k=>T(k);
  if(typeof ID==='undefined'||!ID){ hpTell(Tt('pt_noid')); return false; }
  const acct=(typeof hpLeaseAcct==='function')?hpLeaseAcct():''; if(!acct){ hpTell(Tt('ext_noacct')); return false; }
  if(ID.lease&&ID.lease.gone){ hpTell(Tt('ext_gone')); return false; }
  if(ID.rentJob){ hpTell(Tt('rn_job_left')); return false; }
  try{ const tab=document.getElementById('t-post'); if(tab&&tab.click&&!(tab.classList&&tab.classList.contains('on'))) tab.click(); }catch(e){}
  HP_RENT_BUSY=true; HP_RENT_J=null; try{ HP_RENT_T0=String(document.title||''); }catch(e){}
  const short=a=>a.slice(0,6)+'…'+a.slice(-4); let from=0, txid='';
  HP_RUN_AT='post-renew';   try{ hpExtShow({lines:[],note:Tt('xm_checking'),top:1}); const pre=hpExtPre(acct); pre.catch(()=>{});   await hpRentLibs();
    if((await hpXmSignedAs(4000))!==acct&&!(await hpXmEnsure(acct,hpExtShow))){ hpRentHide(); return false; }   hpExtShow({lines:[],note:Tt('rn_reading')});
    let L=null, me=null, size=3600, H0=null; try{ const P=await pre; L=P.L; me=P.me; size=P.size; H0=P.h; }catch(e){ throw new Error(TF('rn_readfail',{why:String((e&&e.message)||e)})); }
    if(!L||L.gone||!L.tok||!L.host) throw new Error(Tt('ext_gone'));
    let price=null, dom=''; try{ const h=H0||await hpEvHost(L.host); if(h&&h.dom) dom=String(h.dom);   const o=h&&(h.offers||[]).find(x=>x&&x.Amount&&typeof x.Amount==='object'&&x.Amount.currency==='EVR'); if(o) price={value:String(o.Amount.value),issuer:String(o.Amount.issuer)}; }catch(e){}
    if(!price&&Number(L.unit)>0&&L.iss) price={value:String(L.unit),issuer:String(L.iss)};
    if(!price) throw new Error(Tt('ext_noprice'));
    const evr=((me&&me.evr)||[]).reduce((s,l)=>s+(Number(l.v)||0),0), base=Math.max((typeof hpLeaseExp==='function'&&hpLeaseExp())||0,Date.now());
    const fm=x=>{ try{ return (typeof fmtTS==='function')?fmtTS(x):new Date(x).toLocaleString(); }catch(e){ return String(x); } };
    const node=document.createElement('div'); node.style.marginTop='10px';
    const cost=document.createElement('div'); cost.className='note'; cost.style.cssText='white-space:pre-line;margin-top:6px';
    const plan=d=>{ const P=hpRentPlanDays(price.value,d,size,true); return {n:P.n,total:P.total,until:base+P.n*size*1000,days:P.days}; };
    const upd=()=>{ const P=plan(amt.get()); cost.textContent=P.n<1?TF('rn_min',{p:price.value}):TF('ext_cost',{t:hpNum(P.total,6),p:price.value,n:P.n,d:P.days,u:fm(P.until)})+(evr<P.total?'\n'+TF('rn_short',{e:hpNum(evr,6)}):''); cost.style.color=(P.n<1||evr<P.total)?'var(--red)':''; };
    const amt=hpDaysNode('ext-days',HP_DAYS_DEF,evr,upd); upd(); node.appendChild(amt.node); node.appendChild(cost);
    hpExtShow({lines:[],note:Tt('rn_confirm_wait')});
    if(!(await hpAsk({title:Tt('ext_title'),text:TF('ext_confirm',{t:(typeof hpLeaseText==='function')?hpLeaseText():'',h:hpHostName(L.host,dom)}),node:node,ok:Tt('btn_pt_ext')}))){ hpRentHide(); return false; }
    const P=plan(amt.get()), e=hpEvEvr(Number(price.value)*P.n), dd=P.days; if(P.n<1) throw new Error(TF('rn_min',{p:price.value}));
    if(evr<P.total) throw new Error(TF('rn_short',{e:hpNum(evr,6)}));
    const line=s=>[[TF('ext_s',{d:dd,e:e}),s]];
    hpRentLog('lg_ext_start',{d:dd,e:e,h:L.host});
    from=(await hpEvLedgerNow())-2;
    hpExtShow({lines:line('now'),note:TF('rn_n_ext',{h:L.host})+'\n'+Tt('rn_wait_x')});
    const r=await hpXmSubmit(hpEvExtendTx(acct,L.host,L.tok,price,P.n),TF('ext_x',{d:dd,e:e,h:L.host.slice(0,8)}),c=>{ hpExtShow({lines:line('now'),note:TF('rn_n_ext',{h:L.host})+(c&&c.pushed?'\n'+Tt('rn_pushed'):''),qr:{png:c.refs.qr_png,url:c.next.always}}); },{get:()=>(ID.extPend&&ID.extPend.tok===L.tok)?ID.extPend.uuid:'',set:u=>{ ID.extPend={uuid:u,at:Date.now(),tok:L.tok}; try{ saveID(); }catch(e){} },clear:()=>{ if(ID.extPend){ delete ID.extPend; try{ saveID(); }catch(e){} } }});
    if(!r.signed) throw new Error(Tt('rn_rejected'));
    if(r.result!=='tesSUCCESS') throw new Error(TF('rn_txfail',{r:r.result||'?'}));
    txid=r.txid; hpExtShow({lines:line('now'),note:Tt('rn_hostwait2')});
    const w=await hpEvWait(acct,from,['evnExtendSuccess','evnExtendError'],txid,180000);
    if(!w) throw new Error(TF('rn_noreply',{tx:String(txid).slice(0,12)}));
    if(w.type==='evnExtendError') throw new Error(TF('rn_refused',{why:hpHexStr(hpEvMemo0(w.tx).data).slice(0,120)}));
    hpRentLog('lg_ext_ok',{d:dd,e:e,mom:hpEvExtMom(hpEvMemo0(w.tx).data)});
    HP_EXT_NAGGED=true; try{ if(typeof HP_LG_AT!=='undefined') HP_LG_AT=0; }catch(e){} try{ await hpLeaseFromLedger('ext'); }catch(e){}
    hpExtShow({lines:line('ok'),note:TF('ext_done',{t:(typeof hpLeaseText==='function')?hpLeaseText():''}),btns:[[T('btn_rn_close'),()=>{ hpRentHide(); try{ hpPostUi(); }catch(e){} },true]]});
    return true;
  }catch(e){ const why=String((e&&e.message)||e); hpRentLog('lg_ext_fail',{why:why});
    hpExtShow({top:1,lines:[],note:TF('ext_fail',{why:why})+(txid?'\n'+T('ext_fail_paid'):''),btns:[[T('btn_rn_close'),()=>{ hpRentHide(); }]]}); return false; }
  finally{ HP_RENT_BUSY=false; } }
function hpExtNag(){
  try{ if(HP_EXT_NAGGED||HP_RENT_BUSY||typeof ID==='undefined'||!ID||!ID.lease||ID.lease.gone||ID.rentJob) return false;
    if(!(typeof hpLeaseAcct==='function'&&hpLeaseAcct())) return false;
    if(typeof HP_LG_AT==='undefined'||!(HP_LG_AT>0)||(typeof HP_LG_BUSY!=='undefined'&&HP_LG_BUSY)) return false;
    const x=hpLeaseExp(), left=x-Date.now(); if(!x||left<=0||left>((typeof HP_LEASE_SOON!=='undefined')?HP_LEASE_SOON:7*864e5)) return false;
    if(typeof document!=='undefined'&&document.getElementById&&document.getElementById('hp-ask')) return false;
    HP_EXT_NAGGED=true;
    Promise.resolve(hpAsk({title:T('ext_title'),text:TF('ext_nag',{t:hpLeaseText(),left:hpLeaseLeft()})+'\n'+T('ext_nag2'),ok:T('btn_pt_ext'),cancel:T('btn_ext_later')})).then(go=>{ if(go) hpExtStart(); }).catch(()=>{});
    return true; }catch(e){ return false; } }
try{ if(typeof document!=='undefined'&&document.getElementById){ const b=document.getElementById('btn-pt-ext'); if(b&&!b.dataset.hpWired){ b.dataset.hpWired='1'; b.addEventListener('click',()=>{ hpExtStart(); }); } } }catch(e){}

const HP_AG_DOM={};
let HP_AG_BUSY=false;
function hpDomOf(hexDom){ return hexDom?hpHexStr(hexDom).replace(/[^\x20-\x7e]/g,'').trim().toLowerCase().slice(0,80):''; }
function hpAgDomSet(addr,hexDom){ const d=hpDomOf(hexDom); if(d) HP_AG_DOM[addr]=d; return d; }
async function hpEvDomain(addr){ return hpXahauSess(async q=>{ const a=(await q({command:'account_info',account:addr,ledger_index:'validated'})).account_data; return hpAgDomSet(addr,a&&a.Domain); },15000); }
function hpHostName(addr,dom){ addr=String(addr||''); let d=String(dom||''); if(!d) d=String(HP_AG_DOM[addr]||''); if(!d){ try{ if(typeof HP_HS_DOM!=='undefined'&&HP_HS_DOM&&HP_HS_DOM.get) d=String(HP_HS_DOM.get(addr)||''); }catch(e){} }
  d=d.replace(/[^\x20-\x7e]/g,'').trim().toLowerCase().slice(0,80); return d?TF('rn_hostname',{d:d,h:addr.slice(0,8)}):addr.slice(0,8)+'…'; }
function hpAgSibs(){ try{ return typeof hpSibs==='function'&&hpSibs().length>0; }catch(e){ return false; } }
function hpAgainUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const $=id=>document.getElementById(id), box=$('pt-again'); if(!box) return '';
    const L=(typeof ID!=='undefined'&&ID&&ID.lease)||null, gone=!!(L&&L.gone), host=(gone&&typeof L.host==='string')?L.host:'';
    if(box.style) box.style.display=gone?'':'none'; for(const id of ['pt-ext-nt','pt-ext-row']){ const e=$(id); if(e&&e.style) e.style.display=gone?'none':''; }
    if(!gone) return 'ext';
    if(host&&HP_AG_DOM[host]===undefined){ HP_AG_DOM[host]=''; Promise.resolve().then(()=>hpEvDomain(host)).then(d=>{ HP_AG_DOM[host]=d||''; if(d) hpAgainUi(); }).catch(()=>{}); }
    const t=(typeof hpLeaseText==='function')?hpLeaseText():'', nt=$('pt-again-nt'), v=(host?TF('nt_pt_again',{t:t,d:hpHostName(host)}):TF('nt_pt_again0',{t:t}))+(ID.privateKeyPem?'':'\n'+T('ag_nomain'));
    const hs=(ID.privateKeyPem&&host&&typeof hpAgainHost==='function')?hpAgainHost(host):null, v2=v+(hs?'\n'+hpAgainHostText(hs):'');
    if(nt&&nt.textContent!==v2) nt.textContent=v2; { const bt=$('btn-pt-again'), go=!!ID.privateKeyPem&&!(hs&&hs.st!=='ok'&&hs.st!=='unk'); if(bt&&bt.style) bt.style.display=go?'':'none'; if(typeof hpAgainHsBtn==='function') hpAgainHsBtn(!!ID.privateKeyPem&&!go); }   return host?'again':'again0'; }catch(e){ return ''; } }

function hpAgainHost(host){ try{ if(!host||typeof HP_HOSTS==='undefined'||!HP_HOSTS||HP_HOSTS.empty||!Array.isArray(HP_HOSTS.hosts)||!HP_HOSTS.hosts.length) return {st:'unk'};
  const h=HP_HOSTS.hosts.find(x=>x&&x.addr===host); if(!h) return {st:'gone'}; if(!h.active) return {st:'off',h:h}; if(!(Number(h.free)>0)) return {st:'full',h:h}; return {st:'ok',h:h}; }catch(e){ return {st:'unk'}; } }
function hpAgainHostText(s){ if(!s) return ''; const h=s.h||{}; if(s.st==='ok') return TF('ag_hs_ok',{f:h.free,n:h.maxI,p:hpNum(Number(h.lease)||0,6)}); return T({full:'ag_hs_full',off:'ag_hs_off',gone:'ag_hs_gone'}[s.st]||'ag_hs_unk'); }
function hpAgainHsBtn(on){ try{ let b=document.getElementById('btn-pt-again-hs');
  if(!b&&on){ const a=document.getElementById('btn-pt-again'); if(!a||!a.parentNode||!document.createElement) return ''; b=document.createElement('button'); b.className='b pri'; b.id='btn-pt-again-hs'; b.type='button'; b.setAttribute('data-i18n','btn_ag_hosts'); b.textContent=T('btn_ag_hosts'); b.addEventListener('click',()=>{ try{ hpHsOpen(); }catch(e){} }); a.parentNode.appendChild(b); }
  if(b&&b.style) b.style.display=on?'':'none'; return on?'on':''; }catch(e){ return ''; } }
async function hpAgainStart(){
  if(HP_RENT_BUSY||HP_AG_BUSY) return false; const Tt=k=>T(k);
  if(typeof ID==='undefined'||!ID){ hpTell(Tt('pt_noid')); return false; }
  if(!ID.privateKeyPem){ hpTell(Tt('ag_nomain')); return false; }
  if(ID.rentJob){ hpTell(Tt('rn_job_left')); return false; }
  if(!(ID.lease&&ID.lease.gone)){ hpTell(Tt('ag_notgone')); return false; }
  const acct=(typeof hpLeaseAcct==='function')?hpLeaseAcct():''; let host=String(ID.lease.host||'');
  HP_AG_BUSY=true;
  try{ if(acct){ let L=null; try{ L=await hpLeaseLedger(acct); }catch(e){ hpTell(TF('rn_readfail',{why:(typeof hpRentWhy==='function')?hpRentWhy(e):String((e&&e.message)||e)}));   try{ hpLog('台帳を読めない '+String((e&&e.message)||e)); }catch(x){}; return false; }
      if(L&&!L.gone){ try{ if(typeof HP_LG_AT!=='undefined') HP_LG_AT=0; await hpLeaseFromLedger('again'); }catch(e){} hpTell(Tt('ag_notgone')); return false; }
      if(L&&L.host){ host=String(L.host); if(ID.lease.host!==host){ ID.lease.host=host; try{ saveID(); }catch(e){} } } }
    if(!host){ hpTell(Tt('ag_nohost')); try{ const c=document.getElementById('post-hosts'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'start',behavior:'smooth'}); }catch(e){} return false; }
  } finally { HP_AG_BUSY=false; }
  { const hs=(typeof hpAgainHost==='function')?hpAgainHost(host):null; if(hs&&hs.st!=='ok'&&hs.st!=='unk'){ hpTell(hpAgainHostText(hs)); try{ if(typeof hpHsOpen==='function') hpHsOpen(); }catch(e){} return false; } }
  hpRentLog('lg_ag_start',{h:host});
  return await hpRentStart(host,'post-renew'); }
try{ if(typeof document!=='undefined'&&document.getElementById){ const b=document.getElementById('btn-pt-again'); if(b&&!b.dataset.hpWired){ b.dataset.hpWired='1'; b.addEventListener('click',()=>{ hpAgainStart(); }); } } }catch(e){}

let HP_OB_RE='';
function hpObOwn(){ try{ return typeof ID!=='undefined'&&!!ID&&!ID.privateKeyPem&&typeof hpBoxSub==='function'&&hpBoxSub(); }catch(e){ return false; } }
async function hpObAgain(){
  if(HP_RENT_BUSY||HP_AG_BUSY) return false; const Tt=k=>T(k);
  if(ID.rentJob){ hpTell(T('rn_job_left')); return false; }
  if(!(ID.lease&&ID.lease.gone)){ hpTell(Tt('ag_notgone')); return false; }
  const acct=(typeof hpLeaseAcct==='function')?hpLeaseAcct():''; let host=String(ID.lease.host||'');
  HP_AG_BUSY=true;
  try{ if(acct){ let L=null; try{ L=await hpLeaseLedger(acct); }catch(e){ hpTell(TF('rn_readfail',{why:(typeof hpRentWhy==='function')?hpRentWhy(e):String((e&&e.message)||e)})); return false; }
      if(L&&!L.gone){ try{ if(typeof HP_LG_AT!=='undefined') HP_LG_AT=0; await hpLeaseFromLedger('again'); }catch(e){} hpTell(Tt('ag_notgone')); return false; }
      if(L&&L.host) host=String(L.host); }
    if(!host){ hpTell(Tt('ag_nohost')); return false; }
  } finally { HP_AG_BUSY=false; }
  { const hs=hpAgainHost(host); if(hs&&hs.st!=='ok'&&hs.st!=='unk'){ hpTell(hpAgainHostText(hs)); HP_OB_RE='again'; try{ if(typeof hpHsOpen==='function') hpHsOpen(); }catch(e){} return false; } }
  HP_OB_RE='again'; hpRentLog('lg_ag_start',{h:host}); try{ hpLog('この端末専用の郵便受けを借り直す（'+host+'）'); }catch(e){}
  return await hpRentStart(host,'post-renew'); }
hpAgainStart=(function(f){ return function(){ if(hpObOwn()) return hpObAgain(); return f.apply(this,arguments); }; })(hpAgainStart);
hpAgainUi=(function(f){ return function(){ const r=f.apply(this,arguments); try{ if((r==='again'||r==='again0')&&hpObOwn()){
      const $=id=>document.getElementById(id), L=ID.lease||{}, host=(typeof L.host==='string')?L.host:'', t=(typeof hpLeaseText==='function')?hpLeaseText():'', nt=$('pt-again-nt');
      const hs=host?hpAgainHost(host):null, v=(host?TF('nt_pt_again',{t:t,d:hpHostName(host)}):TF('nt_pt_again0',{t:t}))+(hs?'\n'+hpAgainHostText(hs):''); if(nt&&nt.textContent!==v) nt.textContent=v;
      const go=!(hs&&hs.st!=='ok'&&hs.st!=='unk'), bt=$('btn-pt-again'); if(bt&&bt.style) bt.style.display=go?'':'none'; if(typeof hpAgainHsBtn==='function') hpAgainHsBtn(!go); } }catch(e){} return r; }; })(hpAgainUi);
hpRentStart=(function(f){ return async function(){ try{ if(HP_OB_RE&&hpObOwn()&&typeof HP_BF_ALLOW!=='undefined'&&!HP_BF_ALLOW){ HP_BF_ALLOW=true; if(typeof HP_BF_BYME!=='undefined') HP_BF_BYME=true; } }catch(e){}
  try{ return await f.apply(this,arguments); } finally{ HP_OB_RE=''; } }; })(hpRentStart);

let HP_RUN_AT='';
let HP_XM_SI=null, HP_XM_PICKN=0, HP_XM_LIVE=null, HP_XM_LIVE_AT=0;
function hpXmEnsure(acct,show){ const s=a=>String(a).slice(0,6)+'…'+String(a).slice(-4);
  return new Promise(res=>{ let tm=null; const fin=v=>{ if(HP_XM_SI!==fin) return; HP_XM_SI=null; if(tm){ clearInterval(tm); tm=null; } res(v); }; if(HP_XM_SI) HP_XM_SI(false); HP_XM_SI=fin;
    const stop=[T('btn_xm_stop'),()=>fin(false)];
    const ask=(k,o)=>{ if(HP_XM_SI===fin) show({lines:[],note:TF(k,o),btns:[[T('btn_xm_need'),go,true],stop]}); };
    const go=()=>{ if(HP_XM_SI!==fin) return; const n0=HP_XM_PICKN, t0=Date.now(); try{ hpXmPick(); }catch(e){}
      show({lines:[],note:TF('xm_need_wait',{a:s(acct)}),btns:[stop]}); if(tm) clearInterval(tm);
      tm=setInterval(()=>{ if(HP_XM_SI!==fin){ clearInterval(tm); tm=null; return; }
        if(HP_XM_PICKN>n0){ clearInterval(tm); tm=null; const a=hpXmAcct(); if(a===acct) fin(true); else ask('xm_need_other',{a:s(acct),b:a?s(a):'?'}); }
        else if(Date.now()-t0>180e3){ clearInterval(tm); tm=null; ask('xm_need',{a:s(acct)}); } },500); };
    ask('xm_need',{a:s(acct)}); }); }
function hpXmDead(a){ return !!(a&&HP_XM_LIVE&&HP_XM_LIVE.a===a&&!HP_XM_LIVE.ok); }
function hpXmLive(a){ if(!a||typeof Xumm!=='function'||HP_XM_OPEN_AT||HP_XM_SI||Date.now()-HP_XM_LIVE_AT<60e3) return false; HP_XM_LIVE_AT=Date.now();
  hpXmSignedAs(4000).then(x=>{ const was=hpXmDead(a), wb=(HP_XM_LIVE&&HP_XM_LIVE.b)||''; HP_XM_LIVE={a:a,ok:x===a,b:(x&&x!==a)?x:''};   if(was!==hpXmDead(a)||wb!==HP_XM_LIVE.b) hpXmUi(); }).catch(()=>{}); return true; }

async function hpExtPre(acct){ const [L,me,c]=await Promise.all([hpLeaseLedger(acct),hpEvAcct(acct),Promise.resolve().then(()=>hpMomCfg()).catch(()=>null)]);
  let h=null; if(L&&!L.gone&&L.host){ try{ h=await hpEvHost(L.host); }catch(e){} } return {L:L,me:me,size:(c&&c.size>0)?c.size:3600,h:h}; }
