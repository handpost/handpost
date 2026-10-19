const HP_BK_WAIT = 30000;
const HP_BK_TIMEOUT = 20000;
const HP_BK_MAX = 200000;
const HP_BK_WARN = 0.8;
const HP_BK_SEQ_K = 'p2p_bkseq', HP_BK_H_K = 'p2p_bkh';
const HP_BK_URL_K = 'p2p_bkurl';
let HP_BK_ON = true;
let HP_BK = null, HP_BK_T = null, HP_BK_BUSY = false, HP_BK_CHAIN = Promise.resolve();
let HP_BK_SEEN = false;
let HP_BK_STOP = false;
let HP_BK_REDO = false;

function hpBkAble(){
  if(typeof HP_RE_BUSY!=='undefined' && HP_RE_BUSY) return false;
  if(!HP_BK_ON || !ID || typeof hpIsMain!=='function' || !hpIsMain()) return false;
  try{ return !!(typeof hpPaperP==='function' && hpPaperP() && hpPaperFits()); }catch(e){ return false; }
}

function hpBkPlain(){
  const mt = c => (typeof hpRowMt==='function') ? hpRowMt(c) : (Number(c&&c.mt)||Number(c&&c.keyAddedAt)||0);
  const byAddr = (a,b) => a.address<b.address?-1:a.address>b.address?1:0;
  const byDev = (a,b) => a.dev<b.dev?-1:a.dev>b.dev?1:0;
  const cs = ((ID&&ID.contacts)||[]).map(c=>({ address:c.address, nick:c.nick||'', pubKey:c.pubKey||null, keyAddedAt:Number(c.keyAddedAt)||0, card:c.card||null, cardAt:Number(c.cardAt)||0, gone:(c.gone&&typeof c.gone==='object')?c.gone:null, mt:mt(c) })).sort(byAddr);
  const cd = (ID&&ID.cdel&&typeof ID.cdel==='object')?ID.cdel:{};
  const del = Object.keys(cd).sort().map(a=>({ address:a, at:Number(cd[a].at)||0, purge:cd[a].purge?1:0 }));
  const bm = (ID&&ID.blk&&typeof ID.blk==='object')?ID.blk:{}, blk = {};
  for(const a of Object.keys(bm).sort()) blk[a] = { on:(bm[a]&&bm[a].on===1)?1:0, at:Number(bm[a]&&bm[a].at)||0 };
  const devs = (Array.isArray(ID&&ID.devs)?ID.devs:[]).map(d=>({ dev:d.dev, devSig:d.devSig||'', label:d.label||'', at:Number(d.at)||0 })).sort(byDev);
  const gone = (Array.isArray(ID&&ID.gone)?ID.gone:[]).map(g=>({ dev:g.dev, ts:Number(g.ts)||0, sig:g.sig||'' })).sort(byDev);
  const out = { v:1, id:(ID&&ID.address)||'', name:String((ID&&ID.myName)||''), nameAt:Number(ID&&ID.myNameAt)||0,
           contacts:cs, del:del, blk:blk, set:{ noread:(ID&&ID.set&&ID.set.noread===1)?1:0 }, setAt:Number(ID&&ID.setAt)||0,
           devs:devs, gone:gone };
  const vm0 = (ID&&ID.vfy&&typeof ID.vfy==='object')?ID.vfy:{}, vk = Object.keys(vm0).sort();
  if(vk.length){ out.vfy = {}; for(const a of vk) out.vfy[a] = { on:(vm0[a]&&vm0[a].on===1)?1:0, at:Number(vm0[a]&&vm0[a].at)||0 }; }
  return out;
}
async function hpBkHash(plain){ await hpReady(); return hpHex(hp5S().crypto_generichash(16, hp5U(JSON.stringify(plain)))); }

function hpBkWK(p, salt){ const s=hp5S(); return hpVWK('backup', s.crypto_generichash(32, hp5Cat(hp5U('handpost-backup-key:v1'), salt), p)); }
function hpBkAD(id, seq){ return 'handpost-backup:v1:'+id+':'+seq; }
function hpBkSeal(plain, seq, at){
  const s=hp5S(), p=hpPaperP(); if(!p) throw new Error('紙がまだ無い');
  const salt=s.randombytes_buf(16);
  return { v:1, seq:seq, at:at, salt:hpHex(salt), box:hpVEnc(hpBkWK(p,salt), hp5U(JSON.stringify(plain)), hpBkAD(plain.id, seq)) };
}

function hpBkOpen(env, paperHex, id){
  if(!env || env.v!==1 || typeof env.salt!=='string' || !env.box) throw new Error('控えの形が違う');
  const p = paperHex ? hpBytes(paperHex) : hpPaperP(); if(!p) throw new Error('紙がまだ無い');
  const seq = Number(env.seq)||0;
  const who = id || (ID&&ID.address) || '';
  let pt; try{ pt=hpVDec(hpBkWK(p, hpBytes(env.salt)), env.box, hpBkAD(who, seq)); }catch(e){ throw new Error('控えの封が開かない（紙が違うか、書き換えられている）'); }
  let o=null; try{ o=JSON.parse(new TextDecoder().decode(pt)); }catch(e){ o=null; }
  if(!o || o.v!==1 || !Array.isArray(o.contacts)) throw new Error('控えの中身の形が違う');
  o.seq=seq; o.at=Number(env.at)||0;
  return o;
}

function hpBkOnReply(o){
  const W=HP_BK; if(!W||!W.wait||!o) return;
  if(o.ok===W.wait){ W.ok=true; W.res=o; }
  else if(o.err){ W.err=String(o.err); W.res=o; }
}
async function hpBkReq(msg){
  if(!POST.up||POST.notOwner) throw new Error('ポストにつながっていない');
  if(HP_BK) throw new Error('引き出しの操作が重なった');
  const W={ wait:msg.op, ok:false, err:null, res:null }; HP_BK=W;
  try{
    await hpSend(msg);
    const t0=Date.now(); while(!W.ok&&!W.err&&Date.now()-t0<HP_BK_TIMEOUT) await sleep(100);
  } finally { HP_BK=null; }
  if(W.err){ const e=new Error(W.err); e.bk=W.res; throw e; }
  if(!W.ok) throw new Error('管理人から返事がない');
  return W.res;
}
function hpBkFetch(){ return hpBkReq({ op:'bget' }); }

async function hpBkSync(){
  if(!hpBkAble()||!POST.up||POST.notOwner) return false;
  let r; try{ r=await hpBkFetch(); }catch(e){ hpLog('引き出しを読めない '+e.message); return false; }
  HP_BK_SEEN=true;
  const mine=Number(localStorage.getItem(HP_BK_SEQ_K))||0;
  let env=null; try{ env=r&&r.data?JSON.parse(r.data):null; }catch(e){ env=null; }
  const seq=env?(Number(env.seq)||0):0;
  if(!env){
    if(mine>0){ HP_BK_REDO=true;
      const wh=String(localStorage.getItem(HP_BK_URL_K)||''), cur=String((POST&&POST.url)||''); let mv=wh?(wh!==cur):false;
      if(!wh){ try{ mv=!!(cur&&typeof ID!=='undefined'&&ID&&ID.moveDone&&ID.moveDone.to===cur); }catch(e){ mv=false; } }
      if(mv) hpLog('郵便受けが替わったので、控えを新しい郵便受けに置き直す（前に置いた場所 '+(wh||'前の郵便受け')+'・通し番号 '+mine+'）');
      else { hpLog('引き出しの控えが無くなっている（この端末の記録は 通し番号 '+mine+'）。置き直す'); try{ if(typeof hpNote==='function') hpNote('bkgone',{}); }catch(e){}   } }
    return true;
  }
  if(seq>mine){

    let own=false; try{ own=!!(r&&r.by&&POST.pub&&String(r.by)===String(POST.pub)&&hpBkOpen(env)); }catch(e){ own=false; }
    if(own){ localStorage.setItem(HP_BK_SEQ_K, String(seq)); localStorage.setItem(HP_BK_H_K, ''); hpLog('引き出しの控えはこの端末が置いたもの（通し番号 '+seq+'。返事が届かなかった）。番号を合わせた'); return true; }
    HP_BK_STOP=true; hpLog('引き出しの控えがこの端末の記録より新しい（引き出し '+seq+' ／この端末 '+mine+'）。この端末からは上書きしない');
    try{ if(typeof hpNote==='function'){ const by=String(r&&r.by||''); hpNote('bknewer',{label:(typeof hpMvLabel==='function')?hpMvLabel(by):(by.slice(0,10)+'…')},'bknewer:'+by); } }catch(e){}
    return true;
  }
  if(seq<mine){ HP_BK_REDO=true; hpLog('引き出しの控えが古い番号に戻っている（引き出し '+seq+' ／この端末 '+mine+'）。置き直す'); try{ if(typeof hpNote==='function') hpNote('bkold',{}); }catch(e){}   return true; }
  return true;
}

async function hpBkSend(force){
  if(!hpBkAble()||!POST.up||POST.notOwner) return 0;
  if(HP_BK_BUSY){ hpBkSoon(2000); return 0; }
  if(!HP_BK_SEEN){ await hpBkSync(); }
  if(HP_BK_STOP) return 0;
  HP_BK_BUSY=true;
  try{
    const plain=hpBkPlain(), h=await hpBkHash(plain);
    if(!force&&!HP_BK_REDO&&localStorage.getItem(HP_BK_H_K)===h) return 0;
    const seq=(Number(localStorage.getItem(HP_BK_SEQ_K))||0)+1;
    let at=Date.now();
    for(let i=0;i<2;i++){
      const data=JSON.stringify(hpBkSeal(plain, seq, at));
      if(data.length>HP_BK_MAX){ hpLog('控えが大きすぎて引き出しに置けない（'+data.length+' 文字、上限 '+HP_BK_MAX+' 文字。連絡先 '+plain.contacts.length+' 件）'); return 0; }
      try{
        await hpBkReq({ op:'bset', data:data, at:at });
        localStorage.setItem(HP_BK_SEQ_K, String(seq)); localStorage.setItem(HP_BK_H_K, h); HP_BK_REDO=false; try{ localStorage.setItem(HP_BK_URL_K, String((POST&&POST.url)||'')); }catch(e){}
        hpLog('控えを引き出しに置いた（通し番号 '+seq+'、'+data.length+' 文字、連絡先 '+plain.contacts.length+' 件、自分の端末 '+(plain.devs.length+1)+' 台）');
        if(data.length>HP_BK_MAX*HP_BK_WARN) hpLog('控えが上限に近い（'+data.length+' ／ '+HP_BK_MAX+' 文字）');
        return 1;
      }catch(e){
        const r=e&&e.bk;
        if(r&&r.err==='older'&&Number(r.at)>0&&i===0){ at=Number(r.at)+1; hpLog('引き出しの控えのほうが新しい時刻だった（時刻を進めて置き直す）'); continue; }
        hpLog('控えを置けない '+e.message); return 0;
      }
    }
    return 0;
  } finally { HP_BK_BUSY=false; }
}

function hpBkSoon(ms){
  if(!HP_BK_ON||HP_BK_STOP||!ID) return false;
  try{ if(typeof hpPaperP!=='function'||!hpPaperP()) return false; }catch(e){ return false; }
  if(HP_BK_T) clearTimeout(HP_BK_T);
  HP_BK_T=setTimeout(()=>{
    HP_BK_T=null;
    HP_BK_CHAIN=HP_BK_CHAIN.then(()=>hpBkSend(false)).catch(e=>{ try{ hpLog('控えを置けない '+((e&&e.message)||'')); }catch(_){} });
  }, ms===undefined?HP_BK_WAIT:Math.max(0,ms));
  return true;
}

async function hpBkKick(){
  if(!hpBkAble()||!POST.up||POST.notOwner) return false;
  if(!(await hpBkSync())) return false;
  await hpBkSend(false);
  return true;
}
