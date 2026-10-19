const HP_LQ_IDS=new Set();

function hpShareOrigin(){ let o=''; try{ o=String(localStorage.getItem('p2p_share_origin')||'').trim().replace(/\/+$/,''); }catch(e){} if(o) return o; try{ return location.origin; }catch(e){ return ''; } }
function hpLqKeys(sec){ const s=hp5S(); return { id:hpHex(s.crypto_generichash(16, s.from_string('handpost-linkqr-id:v1'), sec)), k:s.crypto_generichash(32, s.from_string('handpost-linkqr-key:v1'), sec) }; }
function hpLqAD(who,id){ return hp5S().from_string('handpost-linkqr:v1:'+who+':'+id); }
function hpLqSeal(text, who, K){ const s=hp5S(), n=s.randombytes_buf(24); return s.to_base64(hp5Cat(n, s.crypto_aead_xchacha20poly1305_ietf_encrypt(s.from_string(text), hpLqAD(who,K.id), null, n, K.k)), sodium.base64_variants.ORIGINAL); }
function hpLqOpen(box, who, K){ const s=hp5S(), b=s.from_base64(box, sodium.base64_variants.ORIGINAL); if(b.length<40) throw new Error('短すぎる'); return new TextDecoder().decode(s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, b.slice(24), hpLqAD(who,K.id), b.slice(0,24), K.k)); }
function hpLqParse(text){
  const m=String(text||'').trim().match(/^(?:hplink:|[^\s#"'<>]*#link=)(hp1[0-9a-f]{64})\/([^\/\s#"'<>]+)\/([A-Za-z0-9_-]{43})$/); if(!m) return null;
  if(!hpInvHost('wss://'+m[2])) return null;
  return { who:m[1], host:m[2], s:m[3] };
}
function hpLqIs(text){ return !!hpLqParse(text); }
async function hpLqMake(L){
  const host=hpInvHost(POST.url); if(!host) throw new Error(T('e_inv_host'));
  const sec=hp5S().randombytes_buf(32), K=hpLqKeys(sec);
  await hpInvReq({ op:'iset', id:K.id, exp:L.exp, box:hpLqSeal(L.text, ID.address, K) });
  HP_LQ_IDS.add(K.id); L.sid=K.id; L.short='hplink:'+ID.address+'/'+host+'/'+hpIvB64u(sec);
  { let o=''; try{ o=hpShareOrigin(); }catch(e){} L.url=o+'/#link='+ID.address+'/'+host+'/'+hpIvB64u(sec); }
  hpLog('短い連携の QR を用意した（番号 '+K.id.slice(0,8)+'）');
  return L.short;
}
function hpLqDrop(L){ if(!L||!L.sid) return; const id=L.sid; L.sid=null; hpInvReq({op:'idel', id:id}).catch(()=>{}); }
async function hpLqFetch(text){
  const j=hpLqParse(text); if(!j) throw new Error(T('e_join_bad'));
  await hpReady(); const K=hpLqKeys(hpIvUn64u(j.s));
  let r; try{ r=await hpInvGet('wss://'+j.host, K.id); }catch(e){ throw new Error(T('e_lq_conn')); }
  if(r&&(r.err==='used'||r.err==='none')) throw new Error(T('e_lq_used'));
  if(!r||r.ok!=='iget'||typeof r.box!=='string') throw new Error(T('e_join_bad'));
  let t; try{ t=hpLqOpen(r.box, j.who, K); }catch(e){ throw new Error(T('e_join_bad')); }
  let o=null; try{ o=JSON.parse(t); }catch(e){}
  if(!o||!o.card||o.card.id!==j.who) throw new Error(T('e_join_bad'));
  return t;
}

let HP_LQ_FOCUS=false;
function hpLqFocusShow(){
  HP_LQ_FOCUS=true;
  let o=document.getElementById('hp-lq');
  if(!o){
    o=document.createElement('div'); o.id='hp-lq';
    o.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147482000;background:var(--bg,#101418);display:flex;align-items:center;justify-content:center;padding:24px';
    const box=document.createElement('div'); box.style.cssText='max-width:440px;width:100%;background:var(--panel,#1a2026);border:1px solid var(--line,#333);border-radius:12px;padding:20px;color:var(--ink,#eee);line-height:1.6;text-align:center';
    const h=document.createElement('div'); h.id='hp-lq-title'; h.style.cssText='font-weight:bold;font-size:17px;margin-bottom:10px'; h.textContent=T('lq_title');
    const st=document.createElement('div'); st.id='hp-lq-st'; st.style.cssText='color:var(--dim,#aaa);margin-bottom:12px';
    const sas=document.createElement('div'); sas.id='hp-lq-sas'; sas.style.cssText='font-size:42px;font-weight:700;letter-spacing:6px;margin:8px 0 16px;color:var(--teal,#4fd1b8);display:none';
    const b=document.createElement('button'); b.className='b'; b.id='hp-lq-close'; b.textContent=T('btn_lq_close'); b.onclick=hpLqFocusCancel;
    box.appendChild(h); box.appendChild(st); box.appendChild(sas); box.appendChild(b); o.appendChild(box); document.body.appendChild(o);
  }
  hpLqFocusUi('');
}
function hpLqFocusUi(msg){
  if(!HP_LQ_FOCUS) return;
  const st=document.getElementById('hp-lq-st'), sas=document.getElementById('hp-lq-sas'), b=document.getElementById('hp-lq-close'); if(!st) return;
  const J=(typeof HP_JOIN!=='undefined')?HP_JOIN:null;
  if(ID){ st.textContent=T('join_done'); if(sas) sas.style.display='none'; if(b) b.style.display='none'; setTimeout(hpLqFocusHide, 2500); return; }
  st.textContent=msg||(J?T('lq_wait'):T('lq_fetch'));
  if(sas){ sas.textContent=J?hpSasFmt(J.sas):''; sas.style.display=J?'block':'none'; }
}
function hpLqFocusHide(){ HP_LQ_FOCUS=false; const o=document.getElementById('hp-lq'); if(o&&o.remove) o.remove(); }
function hpLqFocusCancel(){
  try{ if(typeof HP_JOIN!=='undefined'&&HP_JOIN){ if(HP_JOIN.timer) clearInterval(HP_JOIN.timer); HP_JOIN=null; } }catch(e){} try{ if(typeof hpJoinSave==='function') hpJoinSave(); }catch(e){}
  hpLqFocusHide(); try{ hpLog('つなぐのをやめた'); }catch(e){} try{ hpLinkUi(); }catch(e){}
}
function hpLqTake(){
  try{ const h=String(location.hash||''); if(!/^#link=/.test(h)) return null; try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} return h; }catch(e){ return null; }
}
function hpLqBoot(){ const v=hpLqTake(); if(!v) return false; if(!hpLqIs(v)){ try{ hpLog('つなぐリンクの形が違う（捨てた）'); }catch(e){} return false; } hpLqScanned(v); return true; }
function hpLqScanned(val){
  if(ID){ alert(T('al_lq_hasid')); return; }
  try{ hpLqFocusShow(); }catch(e){}
  try{ const t=document.querySelector('#t-id'); if(t) t.click(); }catch(e){}
  const ta=document.getElementById('hp-join-text'), bt=document.getElementById('hp-join-btn');
  if(ta) ta.value=val;
  try{ const c=document.getElementById('linkjoin-card'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){}
  if(bt&&!bt.disabled) bt.click();
}
