const HP_VAULT_KEY='p2p_vault', HP_SEC_KEYS=['p2p_id','p2p_devkey','p2p_prekeys'], HP_VAULT_AD='handpost-vault:v1', HP_PW_ITER=600000, HP_PW_MIN=12;
let VAULT=null, VAULT_DK=null;

function hpSecretInput(el){ el.type='password'; el.setAttribute('autocomplete','off'); el.setAttribute('autocapitalize','off'); el.setAttribute('autocorrect','off'); el.setAttribute('spellcheck','false'); el.setAttribute('data-lpignore','true'); el.setAttribute('data-1p-ignore','true'); el.setAttribute('data-bwignore','true'); return el; }
function hpVaultMeta(){ try{ const v=JSON.parse(localStorage.getItem(HP_VAULT_KEY)||'null'); return (v&&v.v===1&&Array.isArray(v.wraps)&&v.data)?v:null; }catch(e){ return null; } }
function hpVaultOn(){ return !!hpVaultMeta(); }
function hpVaultLocked(){ return hpVaultOn()&&!VAULT; }
function hpVErr(code,msg){ const e=new Error(msg); e.hpv=code; return e; }

function hpSecGet(k){ if(hpVaultOn()){ if(!VAULT) throw hpVErr('locked','鍵がまだ開いていない'); return Object.prototype.hasOwnProperty.call(VAULT,k)?VAULT[k]:null; } return localStorage.getItem(k); }
function hpSecSet(k,v){ if(hpVaultOn()){ if(!VAULT) throw hpVErr('locked','鍵がまだ開いていない'); VAULT[k]=String(v); hpVaultWrite(); return; } localStorage.setItem(k,v); }
function hpSecDel(k){ if(hpVaultOn()){ if(VAULT&&Object.prototype.hasOwnProperty.call(VAULT,k)){ delete VAULT[k]; hpVaultWrite(); } return; } try{ localStorage.removeItem(k); }catch(e){} }
function hpVEnc(key,pt,ad){ const s=hp5S(), n=s.randombytes_buf(24); return { n:hpHex(n), c:s.to_base64(s.crypto_aead_xchacha20poly1305_ietf_encrypt(pt,s.from_string(ad),null,n,key),s.base64_variants.ORIGINAL) }; }
function hpVDec(key,box,ad){ const s=hp5S(); return s.crypto_aead_xchacha20poly1305_ietf_decrypt(null,s.from_base64(box.c,s.base64_variants.ORIGINAL),s.from_string(ad),hpBytes(box.n),key); }
function hpVWK(kind,secret){ const s=hp5S(); return s.crypto_generichash(32,s.from_string('handpost-vault-'+kind+':v1'),new Uint8Array(secret)); }
function hpVaultWrite(){ const s=hp5S(), m=hpVaultMeta(); if(!m||!VAULT||!VAULT_DK) throw hpVErr('locked','鍵がまだ開いていない'); m.data=hpVEnc(VAULT_DK,s.from_string(JSON.stringify(VAULT)),HP_VAULT_AD); m.at=Date.now(); localStorage.setItem(HP_VAULT_KEY,JSON.stringify(m)); }
function hpB64u(u8){ let s=''; const a=new Uint8Array(u8); for(let i=0;i<a.length;i++) s+=String.fromCharCode(a[i]); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function hpUnB64u(s){ s=String(s).replace(/-/g,'+').replace(/_/g,'/'); while(s.length%4) s+='='; const b=atob(s), a=new Uint8Array(b.length); for(let i=0;i<b.length;i++) a[i]=b.charCodeAt(i); return a; }

function hpPkOk(){ return typeof navigator!=='undefined'&&!!(navigator.credentials&&navigator.credentials.create&&navigator.credentials.get); }
async function hpPkCreate(salt){
  if(!hpPkOk()) throw hpVErr('nopk','この端末ではパスキーが使えない');
  const nm='Handpost '+((ID&&(ID.myName||hpIdShort(ID.address)))||'');
  const cred=await navigator.credentials.create({publicKey:{
    rp:{name:'Handpost',id:location.hostname}, user:{id:crypto.getRandomValues(new Uint8Array(16)),name:nm,displayName:nm},
    challenge:crypto.getRandomValues(new Uint8Array(32)), pubKeyCredParams:[{type:'public-key',alg:-8},{type:'public-key',alg:-7},{type:'public-key',alg:-257}],
    authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'required',userVerification:'required'}, timeout:120000,
    extensions:{prf:{eval:{first:salt}}} }});
  const p=(cred.getClientExtensionResults&&cred.getClientExtensionResults()||{}).prf||{}, id=hpB64u(new Uint8Array(cred.rawId));
  if(p.results&&p.results.first) return {cred:id,out:new Uint8Array(p.results.first)};
  if(p.enabled!==true) throw hpVErr('noprf','このパスキーからは鍵を作れない（PRF なし）');
  return {cred:id,out:await hpPkGet(id,salt)};
}
async function hpPkGet(id,salt){
  if(!hpPkOk()) throw hpVErr('nopk','この端末ではパスキーが使えない');
  const a=await navigator.credentials.get({publicKey:{rpId:location.hostname,challenge:crypto.getRandomValues(new Uint8Array(32)),
    allowCredentials:[{type:'public-key',id:hpUnB64u(id)}],userVerification:'required',timeout:120000,extensions:{prf:{eval:{first:salt}}}}});
  const x=(a.getClientExtensionResults&&a.getClientExtensionResults()||{}).prf, r=x&&x.results&&x.results.first;
  if(!r) throw hpVErr('noprf','このパスキーからは鍵を作れない（PRF の値が出ない）');
  return new Uint8Array(r);
}
async function hpPwBits(pw,salt,it){
  const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(String(pw).normalize('NFKC')),'PBKDF2',false,['deriveBits']);
  return new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:salt,iterations:it},k,256));
}

async function hpVaultWrapNew(kind,pw,dk){
  const s=hp5S();
  if(kind==='prf'){ const salt=s.randombytes_buf(32), r=await hpPkCreate(salt); return {k:'prf',cred:r.cred,salt:hpHex(salt),box:hpVEnc(hpVWK('prf',r.out),dk,'handpost-vault-wrap:v1:prf')}; }
  if(kind==='pw'){ if(String(pw||'').length<HP_PW_MIN) throw hpVErr('pwshort','パスフレーズが短い'); const salt=s.randombytes_buf(16), b=await hpPwBits(pw,salt,HP_PW_ITER); return {k:'pw',it:HP_PW_ITER,salt:hpHex(salt),box:hpVEnc(hpVWK('pw',b),dk,'handpost-vault-wrap:v1:pw')}; }
  throw hpVErr('other','守り方が分からない '+kind);
}

async function hpVaultSeal(kind,pw){
  if(hpVaultOn()) throw hpVErr('already','もう守っている');
  if(typeof hpReady==='function') await hpReady();
  const s=hp5S(), dk=s.randombytes_buf(32), w=await hpVaultWrapNew(kind,pw,dk);
  if(hpVaultOn()) throw hpVErr('already','もう守っている');
  const data={}; for(const k of HP_SEC_KEYS){ const v=localStorage.getItem(k); if(v!=null) data[k]=v; }
  if(!Object.keys(data).length) throw hpVErr('empty','守る鍵がまだ無い');
  const meta={v:1,at:Date.now(),wraps:[w],data:hpVEnc(dk,s.from_string(JSON.stringify(data)),HP_VAULT_AD)};
  try{ const ij=JSON.parse(data.p2p_id||'null'); if(ij&&ij.paper&&ij.paperOk&&typeof hpPaperWrap==='function') meta.wraps.push(hpPaperWrap(ij.paper,dk)); }catch(e){}
  const back=JSON.parse(s.to_string(hpVDec(dk,meta.data,HP_VAULT_AD)));
  if(HP_SEC_KEYS.some(k=>(k in data)&&back[k]!==data[k])) throw hpVErr('other','封を開き直せない');
  localStorage.setItem(HP_VAULT_KEY,JSON.stringify(meta));
  VAULT=data; VAULT_DK=dk;
  for(const k of Object.keys(data)){ try{ localStorage.removeItem(k); }catch(e){} }
  try{ if(typeof hpHMigrate==='function') await hpHMigrate(); }catch(e){}
  try{ hpLog('鍵を守った（'+(kind==='prf'?'パスキー':'パスフレーズ')+'）。封をしたもの：'+Object.keys(data).join('・')); }catch(e){}
  return true;
}

async function hpVaultUnlock(pw){
  const m=hpVaultMeta(); if(!m||VAULT) return true;
  if(typeof hpReady==='function') await hpReady();
  const s=hp5S(); let dk=null, last=null;
  for(const w of m.wraps){
    if((w.k==='prf')===(pw!=null)) continue;
    try{
      const sec = w.k==='prf' ? await hpPkGet(w.cred,hpBytes(w.salt)) : w.k==='pw' ? await hpPwBits(pw,hpBytes(w.salt),w.it) : null;
      if(!sec) continue;
      try{ dk=hpVDec(hpVWK(w.k,sec),w.box,'handpost-vault-wrap:v1:'+w.k); }catch(e){ throw hpVErr('wrong','鍵が合わない'); }
      break;
    }catch(e){ last=e; }
  }
  if(!dk) throw last||hpVErr('wrong','鍵が合わない');
  let data; try{ data=JSON.parse(s.to_string(hpVDec(dk,m.data,HP_VAULT_AD))); }catch(e){ throw hpVErr('wrong','中身が開かない'); }
  VAULT=data; VAULT_DK=dk;

  try{ hpLog('鍵を開いた（'+(pw!=null?'パスフレーズ':'パスキー')+'）'); }catch(e){}
  return true;
}
function hpVaultKinds(){ const m=hpVaultMeta(); return m?m.wraps.map(w=>w.k):[]; }
const HP_VAULT_WHY={nopk:'vt_e_nopk',noprf:'vt_e_noprf',wrong:'vt_e_wrong',pwshort:'vt_e_pwshort',empty:'vt_e_empty'};
function hpVaultWhy(e){ const c=e&&e.hpv; if(c&&HP_VAULT_WHY[c]) return HP_VAULT_WHY[c]; if(e&&(e.name==='NotAllowedError'||e.name==='AbortError')) return 'vt_e_cancel'; return 'vt_e_other'; }

function hpVaultForget(){
  const ks=['p2p_vault','p2p_id','p2p_devkey','p2p_prekeys','p2p_seen','p2p_sibp','p2p_sibc','p2p_sibseen','p2p_post','p2p_tk','p2p_tkrv','p2p_bkseq','p2p_bkh'];
  try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&ks.indexOf(k)<0) ks.push(k); } }catch(e){}
  for(const k of ks){ if(/^p2p_(vault|id|devkey|prekeys|seen|sibp|sibc|sibseen|post|tk|tkrv|bkseq|bkh)$/.test(k)||/^p2p_(chat|req|lastopen|sibsince)_/.test(k)){ try{ localStorage.removeItem(k); }catch(e){} } }
  try{ if(typeof hpHWipe==='function') hpHWipe(); }catch(e){}
  VAULT=null; VAULT_DK=null;
}

async function hpForgetHere(){
  if(!(await hpAsk({text:T('cf_vl_forget'), word:true, danger:true, ok:T('btn_vl_forget'), why:'この端末から消す'}))) return false;
  try{ if(typeof stopBg==='function') stopBg(); }catch(e){}
  hpVaultForget();
  try{ ID=null; EDPRIV=null; if(typeof REQUESTS!=='undefined'&&REQUESTS) REQUESTS.length=0; }catch(e){}
  try{ hpLog('この端末からアカウントを消した（アカウントのタブ）'); }catch(e){}
  try{ if(typeof location!=='undefined'&&location.reload) location.reload(); }catch(e){}
  return true;
}

const HP_VL_FAIL_MAX=10;
function hpForgetWordOk(s){ const v=String(s||'').trim().toLowerCase(); return v==='消す'||v==='remove'||(typeof hpWordIs==='function'&&hpWordIs(v,'wd_rm')); }

function hpVaultGate(){
  return new Promise(res=>{
    const kinds=hpVaultKinds(), pk=kinds.indexOf('prf')>=0, pwk=kinds.indexOf('pw')>=0;
    const box=document.createElement('div'); box.id='vault-lock';
    box.style.cssText='position:fixed;inset:0;z-index:9999;background:var(--bg,#0b1220);display:flex;align-items:center;justify-content:center;padding:16px';
    const card=document.createElement('div'); card.className='card'; card.style.cssText='max-width:420px;width:100%';
    const h=document.createElement('h2'); h.textContent=T('vl_title');
    const nt=document.createElement('div'); nt.className='note'; nt.textContent=T(pk?'vl_note_pk':'vl_note_pw');
    const pw=hpSecretInput(document.createElement('input')); pw.id='vault-lock-pw'; pw.placeholder=T('vl_ph_pw'); pw.style.cssText='width:100%;margin-top:10px;display:'+(pwk&&!pk?'block':'none');
    const row=document.createElement('div'); row.className='row'; row.style.marginTop='10px';
    const op=document.createElement('button'); op.className='b pri'; op.id='vault-open'; op.textContent=T('btn_vl_open'); op.style.cssText='width:100%;max-width:280px;padding:12px 16px;font-size:16px'; row.style.justifyContent='center'; row.appendChild(op);
    const pn=document.createElement('div'); pn.className='note'; pn.id='vault-lock-pwnote'; pn.textContent=T('nt_vault_pw'); pn.style.display=pw.style.display;
    let pp=null, sp=null, ppc=null, bk=null, pwWas='', ntWas=''; if(kinds.indexOf('paper')>=0){
      ppc=hpPaperInputs('vault-lock-paper'); pp=ppc.el; pp.style.marginTop='10px'; pp.style.display='none';
      sp=document.createElement('button'); sp.className='b'; sp.id='vault-use-paper'; sp.textContent=T('btn_vl_usepaper');

      sp.onclick=()=>{ pwWas=pw.style.display; ntWas=nt.textContent; pp.style.display='block'; pw.style.display='none'; pn.style.display='none'; nt.textContent=T('vl_note_paper'); const w=document.getElementById('vault-use-pw'); if(w) w.style.display='none'; sp.style.display='none'; bk.textContent=T(pwWas==='block'?'btn_vl_usepw':'btn_vl_back_pk'); bk.style.display=''; er.textContent=''; vlHelpText(); ppc.focus(); };
      bk=document.createElement('button'); bk.type='button'; bk.className='b'; bk.id='vault-back'; bk.style.display='none';
      bk.onclick=()=>{ pp.style.display='none'; pw.style.display=pwWas; pn.style.display=pwWas; nt.textContent=ntWas; const w=document.getElementById('vault-use-pw'); if(w) w.style.display=''; sp.style.display=''; bk.style.display='none'; er.textContent=''; vlHelpText(); if(pwWas==='block') pw.focus(); };
    }
    if(pk&&pwk){ const sw=document.createElement('button'); sw.className='b'; sw.id='vault-use-pw'; sw.textContent=T('btn_vl_usepw'); sw.onclick=()=>{ pw.style.display='block'; pn.style.display='block'; pw.focus(); sw.remove(); }; row.appendChild(sw); }
    const er=document.createElement('div'); er.id='vault-lock-err'; er.className='note'; er.style.color='var(--amber)';

    const hasPaper=kinds.indexOf('paper')>=0; let fails=0;
    const hl=document.createElement('button'); hl.type='button'; hl.id='vault-help'; hl.textContent=T('vl_help'); hl.style.cssText='display:block;margin-top:20px;background:none;border:none;padding:0;color:var(--dim);font-size:12px;text-decoration:underline;cursor:pointer';
    const hb=document.createElement('div'); hb.id='vault-help-box'; hb.style.cssText='display:none;margin-top:8px';
    const hn=document.createElement('div'); hn.className='note'; hn.id='vault-help-note'; hn.textContent=T(hasPaper?'vl_help_paper':'vl_help_nopaper'); hb.appendChild(hn);
    const vlHelpText=()=>{ if(hasPaper&&fails>=HP_VL_FAIL_MAX) return; hn.textContent=T(!hasPaper?'vl_help_nopaper':(pp&&pp.style.display!=='none')?'vl_help_inpaper':'vl_help_paper'); };
    const fw=document.createElement('div'); fw.id='vault-forget-wrap'; fw.style.display=hasPaper?'none':'block';
    const fn=document.createElement('div'); fn.className='note'; fn.style.color='var(--amber)'; fn.textContent=T('vl_forget_note');
    const fi=document.createElement('input'); fi.type='text'; fi.id='vault-forget-word'; fi.placeholder=T('vl_forget_ph'); fi.setAttribute('autocomplete','off'); fi.spellcheck=false; fi.style.cssText='width:100%;margin-top:6px';
    const fg=document.createElement('button'); fg.type='button'; fg.className='b warn'; fg.id='vault-forget'; fg.textContent=T('btn_vl_forget'); fg.disabled=true; fg.style.marginTop='6px';
    fi.addEventListener('input',()=>{ fg.disabled=!hpForgetWordOk(fi.value); });
    fi.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); if(!fg.disabled) fg.click(); } });
    fg.onclick=()=>{ if(!hpForgetWordOk(fi.value)) return; try{ hpLog('この端末からアカウントを消した（開く画面）'); }catch(e){} hpVaultForget(); try{ location.reload(); }catch(e){} };
    fw.appendChild(fn); fw.appendChild(fi); fw.appendChild(fg); hb.appendChild(fw);
    hl.onclick=()=>{ hb.style.display=(hb.style.display==='none')?'block':'none'; };
    const vlFail=e=>{ if(hpVaultWhy(e)==='vt_e_cancel') return; fails++; try{ if(typeof hpVlFailMark==='function') hpVlFailMark(); }catch(x){}   if(hasPaper&&fails>=HP_VL_FAIL_MAX&&fw.style.display==='none'){ hn.textContent=TF('vl_help_many',{n:fails}); fw.style.display='block'; hb.style.display='block'; } };
    const pwf=document.createElement('form'); pwf.setAttribute('autocomplete','off'); pwf.addEventListener('submit',e=>e.preventDefault()); pwf.appendChild(pw);
    card.appendChild(h); card.appendChild(nt); card.appendChild(pwf); if(pp) card.appendChild(pp); if(sp){ sp.style.marginTop='6px'; hb.insertBefore(sp,fw); }   if(bk) row.appendChild(bk); card.appendChild(pn); card.appendChild(row); card.appendChild(er); card.appendChild(hl); card.appendChild(hb); box.appendChild(card); document.body.appendChild(box);
    let busy=false;
    const go=()=>{ if(busy) return; busy=true; op.disabled=true; er.textContent='';
      const usePp=!!(pp&&pp.style.display!=='none'), usePw=!usePp&&pw.style.display!=='none';
      if(usePp&&ppc.empty()){ er.textContent=TF('pp_e_empty',{n:ppc.empty()}); busy=false; op.disabled=false; ppc.focus(ppc.empty()-1); return; }
      (usePp?hpVaultUnlockPaper(ppc.value()):hpVaultUnlock(usePw?pw.value:undefined)).then(()=>{ if(usePp){ try{ if(typeof hpVlPaperMark==='function') hpVlPaperMark(); }catch(e){} }   box.remove(); res(true); })
        .catch(e=>{ try{ hpLog('鍵を開けない '+(e&&e.name||'')+' '+(e&&e.message||'')); }catch(x){} vlFail(e); er.textContent=(e&&e.hpvMsg)||T(hpVaultWhy(e)); busy=false; op.disabled=false; if(usePw){ pw.value=''; pw.focus(); } }); };
    op.onclick=go; pw.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); go(); } });
    if(!pk) setTimeout(()=>{ try{ pw.focus(); }catch(e){} },50);
  });
}

function hpVaultUiInit(){
  const sec=document.getElementById('p-id'); if(!sec||document.getElementById('vault-card')) { hpVaultUi(); return; }
  const card=document.createElement('div'); card.className='card'; card.id='vault-card';
  card.innerHTML='<h2 data-i18n="vt_title"></h2><div id="vault-state" class="note"></div>'+
    '<div class="row" id="vault-btns" style="margin-top:8px"><button class="b pri" id="btn-vault-pk" data-i18n="btn_vault_pk"></button><button class="b" id="btn-vault-pw" data-i18n="btn_vault_pw"></button></div>'+
    '<form id="vault-pw-wrap" autocomplete="off" style="display:none;margin-top:8px"><input type="password" id="vault-pw1" data-i18n-ph="ph_vault_pw1" style="width:100%"><input type="password" id="vault-pw2" data-i18n-ph="ph_vault_pw2" style="width:100%;margin-top:6px"><div class="note" data-i18n="nt_vault_pw"></div><div class="row" style="margin-top:6px"><button type="button" class="b pri" id="btn-vault-pw-go" data-i18n="btn_vault_pw_go"></button></div></form>'+
    '<div id="vault-msg" class="note" style="color:var(--amber)"></div><div class="note" data-i18n="nt_vault"></div>';
  const first=sec.querySelector('.card'), kc=document.getElementById('kill-card'); if(kc&&kc.parentNode===sec) sec.insertBefore(card,kc);   else sec.insertBefore(card, first?first.nextSibling:sec.firstChild);
  hpSecretInput(document.getElementById('vault-pw1')); hpSecretInput(document.getElementById('vault-pw2'));
  document.getElementById('vault-pw-wrap').addEventListener('submit',e=>e.preventDefault());
  const E=id=>document.getElementById(id), msg=t=>{ E('vault-msg').textContent=t||''; };
  const done=()=>{ msg(T('vt_ok')); try{ if(typeof hpSafetyNag==='function') hpSafetyNag(); else hpBanner(null,null,'nag'); }catch(e){} hpVaultUi(); };
  const fail=e=>{ try{ hpLog('鍵を守れない '+(e&&e.name||'')+' '+(e&&e.message||'')); }catch(x){} msg(T(hpVaultWhy(e))); hpVaultUi(); };
  let busy=false; const lock=on=>{ busy=on; ['btn-vault-pk','btn-vault-pw','btn-vault-pw-go'].forEach(i=>{ if(E(i)) E(i).disabled=on; }); };
  E('btn-vault-pk').onclick=()=>{ if(busy) return; msg(''); lock(true); hpVaultSeal('prf').then(()=>done()).catch(fail).then(()=>lock(false)); };
  E('btn-vault-pw').onclick=()=>{ msg(''); const w=E('vault-pw-wrap'); w.style.display=w.style.display==='none'?'block':'none'; if(w.style.display==='block') E('vault-pw1').focus(); };
  E('btn-vault-pw-go').onclick=()=>{ if(busy) return; const a=E('vault-pw1').value, b=E('vault-pw2').value; msg('');
    if(a.length<HP_PW_MIN){ msg(T('vt_e_pwshort')); return; } if(a!==b){ msg(T('vt_e_pwdiff')); return; }
    lock(true); hpVaultSeal('pw',a).then(()=>{ E('vault-pw1').value=''; E('vault-pw2').value=''; E('vault-pw-wrap').style.display='none'; done(); msg(T('vt_ok')+' '+T('vt_pw_nosave'));   }).catch(fail).then(()=>lock(false)); };
  try{ applyLang(); }catch(e){}
  hpVaultUi();
}
function hpVaultUi(){
  const E=id=>document.getElementById(id); if(!E('vault-card')) return;
  const on=hpVaultOn(), k=hpVaultKinds();
  E('vault-card').style.display=(ID||on)?'':'none';
  E('vault-state').textContent=T(!on?'vt_off':(k.indexOf('prf')>=0?'vt_on_pk':'vt_on_pw'));
  E('vault-state').style.color=on?'var(--teal)':'var(--amber)';
  E('vault-btns').style.display=on?'none':''; if(on) E('vault-pw-wrap').style.display='none';
}

function hpVaultNag(){
  if(!ID) return;
  try{ if(typeof hpPaperState==='function'&&hpPaperState()==='todo'){ hpPaperNag(); return; } }catch(e){}
  if(hpVaultOn()){ try{ if(typeof hpPaperNag==='function') hpPaperNag(); }catch(e){} return; }
  hpBanner(T('bn_vault'),()=>{ try{ document.getElementById('t-id').click(); const c=document.getElementById('vault-card'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){} },'nag');
}
