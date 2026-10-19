const HP_ASK_Z=10050;

const HP_ASK_CARD=';max-height:100%;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain';
const HP_ASK_ROW=';position:sticky;bottom:-12px;margin-bottom:-12px;padding:10px 0 12px;background:var(--panel,#111a2e);box-shadow:0 -10px 10px -10px rgba(0,0,0,.55);z-index:1';
let HP_ASK_CUR=null;
function hpReauthKind(){ if(!hpVaultOn()) return 'off'; const k=hpVaultKinds(); return k.indexOf('prf')>=0?'prf':(k.indexOf('pw')>=0?'pw':'off'); }

async function hpReauth(pw){
  const m=hpVaultMeta(); if(!m) return true;
  if(!VAULT||!VAULT_DK) throw hpVErr('locked','鍵がまだ開いていない');
  if(typeof hpReady==='function') await hpReady();
  const s=hp5S(); let last=null;
  for(const w of m.wraps){
    if(w.k!=='prf'&&w.k!=='pw') continue;
    if((w.k==='prf')===(pw!=null)) continue;
    try{
      const sec = w.k==='prf' ? await hpPkGet(w.cred,hpBytes(w.salt)) : await hpPwBits(pw,hpBytes(w.salt),w.it);
      let dk; try{ dk=hpVDec(hpVWK(w.k,sec),w.box,'handpost-vault-wrap:v1:'+w.k); }catch(e){ throw hpVErr('wrong','鍵が合わない'); }
      if(dk.length!==VAULT_DK.length||!s.memcmp(dk,VAULT_DK)) throw hpVErr('wrong','鍵が合わない');
      try{ hpLog('大事な操作の前に確かめた（'+(w.k==='prf'?'パスキー':'パスフレーズ')+'）'); }catch(e){}
      return true;
    }catch(e){ last=e; }
  }
  throw last||hpVErr('wrong','鍵が合わない');
}

const HP_TELL_STACK=[];
function hpTell(text){
  return new Promise(resolve=>{
    if(typeof document==='undefined'||!document.body){ resolve(true); return; }
    const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
    const box=el('div','hp-tell'); box.style.cssText='position:fixed;inset:0;z-index:'+(HP_ASK_Z+5)+';background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
    const card=el('div','card'); card.style.cssText='max-width:440px;width:100%;margin:0'+HP_ASK_CARD; box.appendChild(card);
    const tx=el('div','hp-tell-text',String(text==null?'':text)); tx.style.cssText='white-space:pre-line;line-height:1.6'; card.appendChild(tx);
    const row=el('div','row'); row.style.cssText='margin-top:12px;justify-content:flex-end'+HP_ASK_ROW;
    const ok=el('button','b pri hp-tell-ok',T('ask_ok')); ok.type='button'; row.appendChild(ok); card.appendChild(row);
    let fin=false;
    const done=()=>{ if(fin) return; fin=true; const i=HP_TELL_STACK.indexOf(box); if(i>=0) HP_TELL_STACK.splice(i,1); try{ box.remove(); }catch(e){} try{ document.removeEventListener('keydown',key,true); }catch(e){} resolve(true); };
    const key=e=>{ if(fin||HP_TELL_STACK[HP_TELL_STACK.length-1]!==box) return; if(e.key==='Escape'||e.key==='Enter'){ e.preventDefault(); done(); } };
    ok.onclick=done;
    try{ document.addEventListener('keydown',key,true); }catch(e){}
    HP_TELL_STACK.push(box); document.body.appendChild(box);
    setTimeout(()=>{ try{ ok.focus(); }catch(e){} },30);
  });
}
try{ if(typeof window!=='undefined'&&typeof window.alert==='function'&&/\[native code\]/.test(Function.prototype.toString.call(window.alert))){ window.alert=function(t){ return hpTell(t); }; } }catch(e){}

function hpAsk(o){
  o=o||{};
  if(HP_ASK_CUR){ try{ HP_ASK_CUR.done(false); }catch(e){} }
  return new Promise(resolve=>{
    const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
    const box=el('div'); box.id='hp-ask';
    box.style.cssText='position:fixed;inset:0;z-index:'+HP_ASK_Z+';background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
    const card=el('div','card'); card.style.cssText='max-width:440px;width:100%;margin:0'+HP_ASK_CARD; box.appendChild(card);
    if(o.title) card.appendChild(el('h2',null,o.title));
    const tx=el('div',null,String(o.text||'')); tx.id='hp-ask-text'; tx.style.cssText='white-space:pre-line;line-height:1.6'; card.appendChild(tx);
    if(o.node){ try{ card.appendChild(o.node); }catch(e){} }
    const kind=o.auth?hpReauthKind():'';
    let word=null, pw=null;
    if(o.word){ word=el('input'); word.type='text'; word.id='hp-ask-word'; word.placeholder=T(o.word==='kill'?'kl_word_ph':'vl_forget_ph');   word.setAttribute('autocomplete','off'); word.spellcheck=false; word.style.cssText='width:100%;margin-top:10px';
      const wn=el('div','note',T(o.word==='kill'?'kl_word':'ask_word')); wn.style.marginTop='10px'; card.appendChild(wn); card.appendChild(word); }
    if(o.auth){ const an=el('div','note',T(kind==='prf'?'ask_auth_pk':kind==='pw'?'ask_auth_pw':'ask_auth_off')); an.id='hp-ask-auth'; an.style.cssText='margin-top:10px;color:'+(kind==='off'?'var(--amber)':'var(--teal)'); card.appendChild(an);
      if(kind==='pw'){ const f=el('form'); f.setAttribute('autocomplete','off'); f.addEventListener('submit',e=>e.preventDefault()); pw=el('input'); pw.id='hp-ask-pw'; pw.placeholder=T('ph_ask_pw'); pw.style.cssText='width:100%;margin-top:6px'; hpSecretInput(pw); f.appendChild(pw); card.appendChild(f); } }
    const err=el('div','note'); err.id='hp-ask-err'; err.style.color='var(--amber)'; card.appendChild(err);
    const row=el('div','row'); row.style.cssText='margin-top:12px;justify-content:flex-end'+HP_ASK_ROW;
    const no=el('button','b',o.cancel||T('ask_cancel')); no.type='button'; no.id='hp-ask-no';
    const ok=el('button','b '+(o.danger?'warn':'pri'),o.ok||T('ask_ok')); ok.type='button'; ok.id='hp-ask-ok';
    row.appendChild(no); if(!o.noOk) row.appendChild(ok); card.appendChild(row);
    let fin=false, busy=false;
    const done=v=>{ if(fin) return; fin=true; if(HP_ASK_CUR&&HP_ASK_CUR.box===box) HP_ASK_CUR=null; try{ if(pw) pw.value=''; }catch(e){} try{ box.remove(); }catch(e){} try{ document.removeEventListener('keydown',key,true); }catch(e){} resolve(!!v); };
    const wordOk=()=>!word||(o.word==='kill'?hpKillWordOk(word.value):hpForgetWordOk(word.value));
    const upd=()=>{ ok.disabled=busy||!wordOk(); no.disabled=busy; };
    ok.onclick=async()=>{
      if(fin||busy||!wordOk()) return;
      if(o.auth&&kind!=='off'){
        busy=true; upd(); err.textContent='';
        try{ await hpReauth(kind==='pw'?(pw?pw.value:''):undefined); }
        catch(e){ busy=false; upd(); try{ hpLog('大事な操作の前に確かめられない'+(o.why?'（'+o.why+'）':'')+' '+((e&&e.name)||'')+' '+((e&&e.message)||'')); }catch(x){} err.textContent=T((e&&e.hpv==='wrong')?'ask_e_wrong':hpVaultWhy(e)); if(pw){ pw.value=''; try{ pw.focus(); }catch(x){} } return; }
        busy=false;
      }
      done(true);
    };
    no.onclick=()=>{ if(!busy) done(false); };
    box.onclick=e=>{ if(e&&e.target===box&&!busy) done(false); };
    const key=e=>{ if(fin) return; if(HP_TELL_STACK.length) return;   if(e.key==='Escape'&&!busy){ e.preventDefault(); done(false); } else if(e.key==='Enter'&&(e.target===word||e.target===pw)){ e.preventDefault(); ok.onclick(); } };
    try{ document.addEventListener('keydown',key,true); }catch(e){}
    if(word) word.addEventListener('input',upd);
    upd();
    HP_ASK_CUR={box,ok,no,word,pw,err,done};
    document.body.appendChild(box);
    setTimeout(()=>{ try{ (pw||word||(o.danger?no:ok)).focus(); }catch(e){} },30);
  });
}
