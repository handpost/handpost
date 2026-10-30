const HP5_ROT=7*86400e3, HP5_GRACE=30*86400e3, HP5_MAX=64*1024;
function hp5S(){ if(!window.sodium||!sodium.crypto_scalarmult) throw new Error('libsodium が見えない（window.sodium）'); return sodium; }
const hp5B64=u8=>hp5S().to_base64(u8, sodium.base64_variants.ORIGINAL);
const hp5Un64=s=>hp5S().from_base64(s, sodium.base64_variants.ORIGINAL);
const hp5Cat=(...a)=>{ const o=new Uint8Array(a.reduce((n,x)=>n+x.length,0)); let p=0; for(const x of a){ o.set(x,p); p+=x.length; } return o; };
const hp5U=s=>new TextEncoder().encode(s);
async function hp5Id(kind, blob){ return hpHex(new Uint8Array(await crypto.subtle.digest('SHA-256', hp5U('handpost-v5:'+kind+':'+blob)))).slice(0,32); }
const hp5PreMsg=(dev,x,notAfter)=>'handpost-prekey:v1:'+dev+':'+x+':'+notAfter;
const hp5DevMsg=(id,dev)=>'handpost-dev:v1:'+id+':'+dev;

async function hp5IdOk(id, master, dev, devSig){
  try{
    if(!hpIdFmt(id)||!/^[0-9a-f]{64}$/.test(master)||!/^ed[0-9a-f]{64}$/.test(dev)||!/^[0-9a-f]{128}$/.test(devSig)) return false;
    if((await hpIdOf(master))!==id) return false;
    return await edVerify(master, hp5DevMsg(id,dev), devSig);
  }catch(e){ return false; }
}

async function hp5Me(){
  if(!ID||!ID.address||!ID.publicKey) throw new Error('身元がまだ無い（身元タブの「新規作成」で作る）');
  const pre=(await hp5Prekeys())[0];
  if(typeof hpIsChild==='function'&&hpIsChild()){
    if(ID.link.dev!==pre.dev) throw new Error('この機械の端末鍵が、親機に足してもらったときのものと違う');
    return { id:ID.address, master:ID.publicKey, dev:pre.dev, devSig:ID.link.devSig, pre:pre };
  }
  if(!EDPRIV) throw new Error('身元がまだ無い（身元タブの「新規作成」で作る）');
  return { id:ID.address, master:ID.publicKey, dev:pre.dev, devSig:await edSign(hp5DevMsg(ID.address,pre.dev)), pre:pre };
}
function hp5Kwrap(s, kx, eph, preX, id){ return s.crypto_generichash(32, hp5Cat(hp5U('handpost-v5-wrap'), eph, preX, hp5U(id)), kx); }
function hp5Mac(s, ks, fromX, toX, id, innerBytes){
  const kmac=s.crypto_generichash(32, hp5Cat(hp5U('handpost-v5-mac'), fromX, toX), ks);
  return s.crypto_generichash(32, hp5Cat(hp5U(id), s.crypto_generichash(32, innerBytes)), kmac);
}

async function hp5Prekeys(){
  const s=hp5S(), kp=await hpDevKey(), dev=hpHex(kp.publicKey), now=Date.now();
  const raw=hpSecGet('p2p_prekeys'); let list=[]; try{ list=JSON.parse(raw||'[]'); }catch(e){}
  const n0=list.length; list=list.filter(p=>p&&p.dev===dev&&p.x&&p.priv&&p.notAfter>now);
  let changed=list.length!==n0;
  if(!list.length||now-list[0].at>HP5_ROT){
    const k=s.crypto_box_keypair(), x=hpHex(k.publicKey), notAfter=now+HP5_ROT+HP5_GRACE;
    list.unshift({ dev:dev, x:x, priv:hpHex(k.privateKey), at:now, notAfter:notAfter, sig:hpHex(s.crypto_sign_detached(s.from_string(hp5PreMsg(dev,x,notAfter)), kp.privateKey.slice(1))) });
    changed=true; hpLog('プレキーを新しく作った '+x.slice(0,16));
  }

  if(hp6Has()&&list.length&&!(list[0].kem&&list[0].kseed&&list[0].sig6)){
    try{ const p=list[0], k=hp6KemNew(); p.kem=k.pub; p.kseed=k.seed; p.sig6=hpHex(s.crypto_sign_detached(s.from_string(hp6PreMsg(p.dev,p.x,hp6KemH(k.pub),p.notAfter)), kp.privateKey.slice(1))); changed=true; hpLog('受け取り用の鍵に ML-KEM-1024 の鍵を足した '+p.x.slice(0,16)); }
    catch(e){ hpLog('受け取り用の鍵に ML-KEM-1024 の鍵を足せなかった '+(e&&e.message)); }
  }
  if(changed) hpSecSet('p2p_prekeys', JSON.stringify(list));
  return list;
}

async function hpPrekeyPub(){ const p=(await hp5Prekeys())[0]; return { dev:p.dev, x25519:p.x, notAfter:p.notAfter, sig:p.sig }; }

function hp6Has(){ try{ return typeof hpMlKem!=='undefined'&&!!hpMlKem&&!!hpMlKem.ml_kem1024; }catch(e){ return false; } }
function hp6PreMsg(dev,x,kemH,notAfter){ return 'handpost-prekey:v2:'+dev+':'+x+':'+kemH+':'+notAfter; }
async function hpPrekeyPub6(){ const p=(await hp5Prekeys())[0]; if(!p.kem||!p.sig6) throw new Error('受け取り用の鍵に ML-KEM の鍵がまだ無い'); return { dev:p.dev, x25519:p.x, mlkem:p.kem, notAfter:p.notAfter, sig:p.sig, sig6:p.sig6 }; }
function hp6PreOk(dev, x, mlkem, notAfter, sig6, at){
  try{
    if(!/^ed[0-9a-f]{64}$/.test(dev)||!/^[0-9a-f]{64}$/.test(x)||!hp6KemPubOk(mlkem)||!(notAfter>at)||typeof sig6!=='string'||!/^[0-9a-f]{128}$/.test(sig6)) return false;
    const s=hp5S(); return s.crypto_sign_verify_detached(hpBytes(sig6), s.from_string(hp6PreMsg(dev,x,hp6KemH(mlkem),notAfter)), hpBytes(dev).slice(1));
  }catch(e){ return false; }
}

function hp5PreOk(dev, x, notAfter, sig, at){
  try{
    if(!/^ed[0-9a-f]{64}$/.test(dev)||!/^[0-9a-f]{64}$/.test(x)||!(notAfter>at)) return false;
    const s=hp5S(); return s.crypto_sign_verify_detached(hpBytes(sig), s.from_string(hp5PreMsg(dev,x,notAfter)), hpBytes(dev).slice(1));
  }catch(e){ return false; }
}

async function hpSeal(card, body, kind, link, max){
  const s=hp5S(); kind=(kind==='sig'?'sig':'msg');
  if(!card||!Array.isArray(card.devices)||!card.devices.length||!Array.isArray(card.prekeys)) throw new Error('カードにプレキーが無い');
  const now=Date.now(), me=link?{ pre:(await hp5Prekeys())[0] }:await hp5Me(), mine=me.pre; if(link) me.dev=mine.dev;
  if(!card.devSigs||typeof card.devSigs!=='object') throw new Error('カードに身元が無い（古い形のカード）');
  for(const dev of card.devices){ if(!(await hp5IdOk(card.id, card.master, dev, card.devSigs[dev]))) throw new Error('カードの身元を確かめられない（address・マスター鍵・端末鍵の署名が合わない）'); }

  const dests=[]; for(const dev of card.devices){
    const p=card.prekeys.find(q=>q&&q.dev===dev&&hp5PreOk(dev,q.x25519,q.notAfter,q.sig,now));
    if(p){ dests.push({ dev:dev, x:hpBytes(p.x25519), keyId:p.x25519.slice(0,16), kem:hp6KemFor(dev,p,now) }); continue; }
    if(!card.prekeys.some(q=>q&&q.dev===dev&&hp5PreOk(dev,q.x25519,q.notAfter,q.sig,0))) throw new Error('有効なプレキーが無い端末がある '+String(dev).slice(0,10)+'…');
  }
  if(!dests.length) throw new Error('有効なプレキーが無い端末がある '+String(card.devices[0]).slice(0,10)+'…');
  const toDevs=dests.map(d=>d.dev);
  const innerBytes=hp5U(JSON.stringify(link?{ link:1, fromDev:me.dev, fromPrekey:hp6MyFp(mine), sentAt:now, to:toDevs, toId:card.id, body:body }:{ from:me.id, fromMaster:me.master, fromDev:me.dev, fromDevSig:me.devSig, fromPrekey:hp6MyFp(mine), sentAt:now, to:toDevs, toId:card.id, body:body }));
  const kmsg=s.randombytes_buf(32), n1=s.randombytes_buf(24);
  const blob=hp5B64(hp5Cat(n1, s.crypto_aead_xchacha20poly1305_ietf_encrypt(innerBytes, hp5U('handpost-v5:'+kind), null, n1, kmsg)));
  const id=await hp5Id(kind, blob);
  const eph=s.crypto_box_keypair(), myX=hpBytes(mine.x), myPriv=hpBytes(mine.priv);
  const letters=dests.map(d=>{
    const kwrap=hp5Kwrap(s, s.crypto_scalarmult(eph.privateKey, d.x), eph.publicKey, d.x, id);
    const mac=hp5Mac(s, s.crypto_scalarmult(myPriv, d.x), myX, d.x, id, innerBytes);
    const n2=s.randombytes_buf(24);
    const wrap=hp5B64(hp5Cat(n2, s.crypto_aead_xchacha20poly1305_ietf_encrypt(hp5Cat(kmsg, mac), hp5U('handpost-v5-wrap:'+id), null, n2, kwrap)));
    const w6=d.kem?hp6Wrap(eph, d.x, d.kem, id, hp5Cat(kmsg, mac)):null;
    const letter=JSON.stringify(w6?{ v:6, kind:kind, keyId:d.keyId, eph:hp5B64(eph.publicKey), kem:w6.kem, wrap:w6.wrap, blob:blob }:{ v:5, kind:kind, keyId:d.keyId, eph:hp5B64(eph.publicKey), wrap:wrap, blob:blob });
    const lim=(Number(max)>HP5_MAX)?Number(max):HP5_MAX; if(letter.length>lim) throw new Error('長すぎる（1 通 '+letter.length+' 文字、上限 '+lim+'）');
    return { dev:d.dev, blob:letter };
  });
  try{ if(!link&&typeof hpCpsPqNote==='function') for(const d of dests) hpCpsPqNote(d.dev, id, kmsg, !!d.kem); }catch(e){}
  return { id:id, kind:kind, letters:letters };
}

async function hpOpen(m){
  const s=hp5S(); let L; try{ L=JSON.parse(m.blob); }catch(e){ L=null; }
  if(!L||!(L.v===5||(L.v===6&&typeof L.kem==='string'))||typeof L.blob!=='string'||typeof L.wrap!=='string'||typeof L.eph!=='string') throw new Error('v5 の封筒でない');
  const kind=(L.kind==='sig'?'sig':'msg'), id=await hp5Id(kind, L.blob);
  if(id!==m.id) throw new Error('番号が封筒と合わない');
  const pre=(await hp5Prekeys()).find(p=>p.x.slice(0,16)===L.keyId);
  if(!pre) throw new Error('開ける鍵が無い（プレキーの猶予切れか、別の端末あて）');
  const myX=hpBytes(pre.x), myPriv=hpBytes(pre.priv), eph=hp5Un64(L.eph), w=hp5Un64(L.wrap), b=hp5Un64(L.blob);
  let km, innerBytes;
  try{
    km=(L.v===6)?hp6Unwrap(myPriv, myX, pre.kseed, eph, L.kem, L.wrap, id):s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, w.slice(24), hp5U('handpost-v5-wrap:'+id), w.slice(0,24), hp5Kwrap(s, s.crypto_scalarmult(myPriv, eph), eph, myX, id));
    if(km.length!==64) throw new Error('包みの形が違う');
    innerBytes=s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, b.slice(24), hp5U('handpost-v5:'+kind), b.slice(0,24), km.slice(0,32));
  }catch(e){ throw new Error('封が開かない（壊れているか、書き換えられている）'); }
  const inner=JSON.parse(new TextDecoder().decode(innerBytes)), fp=inner.fromPrekey||{};
  const isLink=(inner.link===1);
  if(isLink&&!(ID&&ID.address)) throw new Error('連携の申し込みだが、この端末に身元が無い');
  if(!isLink&&!(await hp5IdOk(inner.from, inner.fromMaster, inner.fromDev, inner.fromDevSig))&&!(typeof hpTrFromBody==='function'&&(await hpTrFromBody(inner)))) throw new Error('送り手の身元を確かめられない（address・マスター鍵・端末鍵の署名が合わない）');
  if(!hp5PreOk(inner.fromDev, fp.x, fp.notAfter, fp.sig, inner.sentAt)) throw new Error('送り手のプレキーを確かめられない');
  const fromX=hpBytes(fp.x);
  if(!s.memcmp(km.slice(32), hp5Mac(s, s.crypto_scalarmult(myPriv, fromX), fromX, myX, id, innerBytes))) throw new Error('MAC が合わない');
  if(!Array.isArray(inner.to)||inner.to.indexOf(pre.dev)<0) throw new Error('宛先にこの端末が無い');
  if(ID&&ID.address&&inner.toId!==ID.address) throw new Error('宛先の身元がこの端末の身元と違う');
  try{ if(!isLink&&typeof hpCpsPqNote==='function') hpCpsPqNote(inner.fromDev, id, km.slice(0,32), L.v===6); }catch(e){}
  if(isLink) return { id:id, kind:kind, link:true, fromDev:inner.fromDev, fromPrekey:hp6Fp(inner.fromDev, fp, inner.sentAt), sentAt:inner.sentAt, body:inner.body };
  return { id:id, kind:kind, from:inner.from, fromMaster:inner.fromMaster, fromDev:inner.fromDev, fromPrekey:hp6Fp(inner.fromDev, fp, inner.sentAt), sentAt:inner.sentAt, body:inner.body };
}

const HP6_PUB=1568, HP6_CT=1568, HP6_SEED=64, HP6_PUB_B64=2092;
function hp6K(){ const K=(typeof hpMlKem!=='undefined'&&hpMlKem)?hpMlKem.ml_kem1024:null; if(!K||typeof K.encapsulate!=='function') throw new Error('ML-KEM の部品が見えない（lib/noble-mlkem-1024.js）'); return K; }
function hp6Zero(){ for(const a of arguments){ try{ if(a&&a.fill) a.fill(0); }catch(e){} } }

function hp6KemNew(){ const s=hp5S(), seed=s.randombytes_buf(HP6_SEED), k=hp6K().keygen(seed); const o={ pub:hp5B64(new Uint8Array(k.publicKey)), seed:hpHex(seed) }; hp6Zero(k.secretKey, seed); return o; }
function hp6KemPub(b){ let pk=null; try{ if(typeof b==='string'&&b.length===HP6_PUB_B64) pk=hp5Un64(b); }catch(e){ pk=null; } if(!pk||pk.length!==HP6_PUB) throw new Error('ML-KEM の公開鍵の形が違う'); return pk; }
function hp6KemPubOk(b){ try{ hp6KemPub(b); return true; }catch(e){ return false; } }
function hp6KemH(b){ return hpHex(hp5S().crypto_generichash(32, hp6KemPub(b))); }
function hp6Kwrap(s, kx, kk, eph, preX, kemPub, ct, id){
  if(kx.length!==32||kk.length!==32) throw new Error('合わせ鍵の長さが違う');
  return s.crypto_generichash(32, hp5Cat(hp5U('handpost-v6-wrap'), eph, preX, s.crypto_generichash(32,kemPub), s.crypto_generichash(32,ct), hp5U(id)), hp5Cat(kx,kk));
}

function hp6Wrap(eph, toX, toKem, id, payload){
  const s=hp5S(), pk=hp6KemPub(toKem);
  let e; try{ e=hp6K().encapsulate(pk); }catch(err){ throw new Error('ML-KEM の公開鍵を使えない'); }
  const ct=new Uint8Array(e.cipherText), kk=new Uint8Array(e.sharedSecret), kx=s.crypto_scalarmult(eph.privateKey, toX);
  const kw=hp6Kwrap(s, kx, kk, eph.publicKey, toX, pk, ct, id), n=s.randombytes_buf(24);
  const out={ kem:hp5B64(ct), wrap:hp5B64(hp5Cat(n, s.crypto_aead_xchacha20poly1305_ietf_encrypt(payload, hp5U('handpost-v6-wrap:'+id), null, n, kw))) };
  hp6Zero(e.sharedSecret, kk, kx, kw); return out;
}

function hp6Unwrap(myPriv, myX, seedHex, eph, kemB64, wrapB64, id){
  const s=hp5S(); let ct, w, seed;
  try{ ct=hp5Un64(kemB64); w=hp5Un64(wrapB64); seed=hpBytes(seedHex); }catch(e){ throw new Error('包みの形が違う'); }
  if(ct.length!==HP6_CT||w.length<24+16||seed.length!==HP6_SEED||!eph||eph.length!==32) throw new Error('包みの形が違う');
  const k=hp6K().keygen(seed); let kk, kx, kw;
  try{
    kk=new Uint8Array(hp6K().decapsulate(ct, k.secretKey)); kx=s.crypto_scalarmult(myPriv, eph);
    kw=hp6Kwrap(s, kx, kk, eph, myX, new Uint8Array(k.publicKey), ct, id);
    return s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, w.slice(24), hp5U('handpost-v6-wrap:'+id), w.slice(0,24), kw);
  }catch(e){ throw new Error('包みが開かない（壊れているか、別の端末あて）'); }
  finally{ hp6Zero(k.secretKey, seed, kk, kx, kw); }
}

let HP6_SEND=false;
function hp6MyFp(p){ const o={ x:p.x, notAfter:p.notAfter, sig:p.sig }; if(p&&typeof p.kem==='string'&&typeof p.sig6==='string'&&p.kem&&p.sig6){ o.mlkem=p.kem; o.sig6=p.sig6; } return o; }
function hp6Fp(dev, fp, at){ const o={ x:fp.x, notAfter:fp.notAfter, sig:fp.sig }; try{ if(fp&&typeof fp.mlkem==='string'&&typeof fp.sig6==='string'&&hp6PreOk(dev,fp.x,fp.mlkem,fp.notAfter,fp.sig6,at)){ o.mlkem=fp.mlkem; o.sig6=fp.sig6; } }catch(e){} return o; }
function hp6KemFor(dev, p, now){ try{ if(!HP6_SEND||!hp6Has()||!p) return null;
    if(typeof p.mlkem==='string'&&typeof p.sig6==='string'&&hp6PreOk(dev,p.x25519,p.mlkem,p.notAfter,p.sig6,now)) return p.mlkem;
    const q=(typeof ID!=='undefined'&&ID&&ID.pre6&&typeof ID.pre6==='object'&&!Array.isArray(ID.pre6))?ID.pre6[dev]:null;
    if(q&&q.x25519===p.x25519&&typeof q.mlkem==='string'&&hp6PreOk(dev,q.x25519,q.mlkem,q.notAfter,q.sig6,now)) return q.mlkem; }catch(e){} return null; }

function extractFingerprint(sdp){const m=sdp.match(/a=fingerprint:\S+\s+(\S+)/);return m?m[1]:null;}

