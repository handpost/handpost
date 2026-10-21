const HP_RE_TIMEOUT = 30000;
let HP_RE_BUSY = false;

function hpReDev(){ try{ return typeof location!=='undefined'&&/^(localhost|127\.0\.0\.1)$/.test(String(location.hostname||'')); }catch(e){ return false; } }
function hpReUrlNorm(v){ let s=String(v||'').trim(); if(hpReDev()&&/^[0-9]{2,5}$/.test(s)) s='wss://localhost:'+s; return s.replace(/\/+$/,''); }
function hpReUrlOk(u){ return /^wss?:\/\/[A-Za-z0-9._-]+(:[0-9]{1,5})?(\/[A-Za-z0-9._~\-/]*)?$/.test(hpReUrlNorm(u)); }

async function hpRePaper(text){
  if(typeof hpReady==='function') await hpReady();
  const p=hpPaperParse(text), mk=hpPaperMaster(p);
  return { paper:hpHex(p), publicKey:mk.pub, pem:mk.pem, address:await hpIdOf(mk.pub) };
}

function hpReApply(o, myDev, mgr, by){
  if(!ID||!o) return null;
  ID.myName=String(o.name||''); ID.myNameAt=Number(o.nameAt)||0;
  ID.contacts=(Array.isArray(o.contacts)?o.contacts:[]).filter(c=>c&&hpIdFmt(c.address)&&c.address!==ID.address).map(c=>{
    const r={address:c.address,nick:String(c.nick||''),pubKey:c.pubKey||null,keyAddedAt:Number(c.keyAddedAt)||0,card:c.card||null,cardAt:Number(c.cardAt)||0,mt:Number(c.mt)||0};
    if(c.gone&&typeof c.gone==='object') r.gone=c.gone; return r; });
  ID.cdel={}; for(const d of (Array.isArray(o.del)?o.del:[])){ if(d&&d.address) ID.cdel[d.address]={at:Number(d.at)||0,purge:d.purge?1:0}; }
  ID.blk={}; const bm=(o.blk&&typeof o.blk==='object')?o.blk:{}; for(const a of Object.keys(bm)) ID.blk[a]={on:(bm[a]&&bm[a].on===1)?1:0,at:Number(bm[a]&&bm[a].at)||0};
  ID.set={noread:(o.set&&o.set.noread===1)?1:0}; ID.setAt=Number(o.setAt)||0;
  ID.vfy={}; const vm0=(o.vfy&&typeof o.vfy==='object')?o.vfy:{}; for(const a of Object.keys(vm0)){ if(hpIdFmt(a)&&a!==ID.address) ID.vfy[a]={on:(vm0[a]&&vm0[a].on===1)?1:0,at:Number(vm0[a]&&vm0[a].at)||0}; }
  ID.gone=(Array.isArray(o.gone)?o.gone:[]).filter(g=>g&&g.dev).map(g=>({dev:g.dev,ts:Number(g.ts)||0,sig:g.sig||''}));

  const devs=(Array.isArray(o.devs)?o.devs:[]).filter(d=>d&&d.dev&&d.dev!==myDev).map(d=>({dev:d.dev,devSig:d.devSig||'',label:String(d.label||''),at:Number(d.at)||0}));
  for(const dv of (Array.isArray(mgr)?mgr:[])){ if(dv&&dv!==myDev&&!devs.some(x=>x.dev===dv)) devs.push({dev:dv,devSig:'',label:'',at:0,unk:1,wasMain:(dv===by)?1:0}); }
  ID.devs=devs;

  try{ localStorage.setItem('p2p_bkseq',String(Number(o.seq)||0)); }catch(e){}
  try{ if(typeof localStorage.removeItem==='function') localStorage.removeItem('p2p_bkh'); }catch(e){}
  saveID();
  return { contacts:ID.contacts.length, blk:Object.keys(ID.blk).length, devs:ID.devs.length, name:ID.myName, seq:Number(o.seq)||0 };
}

function hpReDevRows(by){
  const out=[{dev:(POST&&POST.pub)||'',me:1,kind:'me',label:hpDevLabelGuess(),at:0}];
  for(const d of (Array.isArray(ID&&ID.devs)?ID.devs:[])){
    const kind=(d.wasMain||(by&&d.dev===by))?'wasmain':(d.unk?'unknown':'child');
    out.push({dev:d.dev,me:0,kind:kind,label:d.label||'',at:d.at||0});
  }
  return out;
}

function hpReUndo(){
  try{ stopBg(); }catch(e){}
  try{ hpSecDel('p2p_id'); }catch(e){}
  for(const k of ['p2p_id','p2p_bkseq','p2p_bkh','p2p_post']){ try{ if(typeof localStorage.removeItem==='function') localStorage.removeItem(k); }catch(e){} }
  ID=null; EDPRIV=null;
  try{ POST.claimedId=null; POST.notOwner=false; POST.removed=false; }catch(e){}
  try{ HP_BK_STOP=false; HP_BK_SEEN=false; HP_BK_REDO=false; }catch(e){}
  try{ $('#addr').textContent=T('no_id'); }catch(e){}
  try{ renderContacts(); }catch(e){} try{ renderMyName(); }catch(e){} try{ renderDevMode(); }catch(e){} try{ renderDevices(); }catch(e){}
  try{ hpLog('戻せなかったので、作りかけのアカウントを片付けた（もう一度やり直せます）'); }catch(e){}
  return true;
}

async function hpRestore(text, url, say, idOnly){
  const tell=(typeof say==='function')?say:function(){};
  if(ID) throw new Error(T('re_e_have'));
  if(!idOnly&&!hpReUrlOk(url)) throw new Error(T('re_e_url'));
  const k=await hpRePaper(text);
  if(idOnly) return hpRestoreIdOnly(k,tell);
  HP_RE_BUSY=true;
  try{ HP_BK_STOP=true; }catch(e){}
  try{
    const post=hpReUrlNorm(url);
    try{ localStorage.setItem('p2p_post',post); }catch(e){}

    if(POST.up||POST.connecting||POST.client){ if(POST.url&&POST.url!==post) hpLog('ポストを切り替える '+POST.url+' → '+post); try{ stopBg(); }catch(e){} await sleep(300); }
    tell(T('re_s_connect'));
    await applyIdentity({publicKey:k.publicKey,privateKeyPem:k.pem,address:k.address,contacts:[],myName:'',paper:k.paper,paperOk:Date.now()},true);
    const t0=Date.now();
    while(Date.now()-t0<HP_RE_TIMEOUT){
      if(typeof hpKillMe==='function'&&hpKillMe()) throw new Error(T('re_e_dead'));
      if(POST.notOwner) throw new Error(T('re_e_notowner'));
      if(POST.up&&POST.claimedId===k.address) break;
      await sleep(200);
    }
    if(!POST.up||POST.claimedId!==k.address){ const e0=new Error(T('re_e_noconn')); e0.hpNoConn=1; throw e0; }
    await sleep(800);
    if(POST.notOwner) throw new Error(T('re_e_notowner'));
    if(typeof hpKillMe==='function'&&hpKillMe()) throw new Error(T('re_e_dead'));
    tell(T('re_s_fetch'));
    let r; try{ r=await hpBkFetch(); }catch(e){ hpLog('引き出しを読めない '+e.message); throw new Error(T('re_e_drawer')); }
    const mgr=Array.isArray(r&&r.devs)?r.devs:[], by=(r&&r.by)||null;
    let env=null;
    if(r&&r.data){ try{ env=JSON.parse(r.data); }catch(e){ env=null; } if(!env) throw new Error(T('re_e_form')); }
    const o=env?hpBkOpen(env,k.paper,k.address):{v:1,contacts:[],devs:[],name:'',seq:0};
    const sum=hpReApply(o,POST.pub,mgr,by);
    hpLog(env?('紙から戻した（通し番号 '+sum.seq+'、連絡先 '+sum.contacts+' 件、ほかの端末 '+sum.devs+' 台）')
              :'引き出しに控えが無かった（アカウントだけ戻した）');
    try{ HP_BK_STOP=false; HP_BK_SEEN=false; HP_BK_REDO=false; }catch(e){}
    try{ renderContacts(); }catch(e){} try{ renderMyName(); }catch(e){} try{ renderDevices(); }catch(e){} try{ renderDevMode(); }catch(e){} try{ updateBadges(); }catch(e){}
    if(env){ tell(T('re_s_cards')); try{ await hpAfterDevChange('restore'); }catch(e){} }
    HP_RE_BUSY=false;
    try{ if(typeof hpBkKick==='function') await hpBkKick(); }catch(e){}
    try{ if(typeof hpDevFill==='function') hpDevFill('restore').catch(()=>{}); }catch(e){}
    return { found:!!env, sum:sum, by:by, devs:mgr };
  } catch(e){ try{ hpReUndo(); }catch(x){} throw e; }
  finally { HP_RE_BUSY=false; }
}

async function hpRestoreIdOnly(k, tell){
  HP_RE_BUSY=true;
  try{
    tell(T('re_s_id'));
    try{ if(POST.up||POST.connecting||POST.client) stopBg(); }catch(e){}
    for(const x of ['p2p_post','p2p_bkseq','p2p_bkh']){ try{ if(typeof localStorage.removeItem==='function') localStorage.removeItem(x); }catch(e){} }
    await applyIdentity({publicKey:k.publicKey,privateKeyPem:k.pem,address:k.address,contacts:[],myName:'',paper:k.paper,paperOk:Date.now()},true);
    try{ HP_BK_STOP=false; HP_BK_SEEN=false; HP_BK_REDO=false; }catch(e){}
    hpLog('紙から身元だけ戻した（郵便受けにはつないでいない。住所録は戻っていない。新しい郵便受けを借りる）');
    try{ renderContacts(); }catch(e){} try{ renderMyName(); }catch(e){} try{ renderDevices(); }catch(e){} try{ renderDevMode(); }catch(e){} try{ updateBadges(); }catch(e){}
    return { found:false, idOnly:true, sum:{contacts:0,blk:0,devs:0,name:'',seq:0}, by:null, devs:[] };
  } catch(e){ try{ hpReUndo(); }catch(x){} throw e; }
  finally { HP_RE_BUSY=false; }
}

function hpRestoreFlow(){
  const old=document.getElementById('restore-flow'); if(old) old.remove();
  const box=document.createElement('div'); box.id='restore-flow';
  box.style.cssText='position:fixed;inset:0;z-index:9998;background:var(--bg,#0b1220);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';
  const card=document.createElement('div'); card.className='card'; card.style.cssText='max-width:480px;width:100%';
  box.appendChild(card); document.body.appendChild(box);
  const el=(tag,cls,txt,id)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; if(id) e.id=id; return e; };
  const btn=(txt,pri,id,fn)=>{ const b=el('button','b'+(pri?' pri':''),txt,id); b.onclick=fn; return b; };
  const close=()=>{ box.remove(); try{ if(typeof hpSafetyNag==='function') hpSafetyNag(); }catch(e){} };
  let RES=null, HP_RE_KEEP=null, RMMSG='', LOSTQ='';
  const show=n=>{
    card.innerHTML=''; card.dataset.step=String(n);
    const row=el('div','row'); row.style.marginTop='12px';
    if(n===1){
      card.appendChild(el('h2',null,T('re_title')));
      const b=el('div','note',T('re1_body')); b.style.whiteSpace='pre-line'; card.appendChild(b);
      const wl=el('div','note',T('re_lb_words')); wl.style.marginTop='10px'; card.appendChild(wl);
      const pc=hpPaperInputs('re-in'); card.appendChild(pc.el);

        const more=document.createElement('div'); more.id='re-more'; more.style.cssText='margin-top:14px;border-top:1px solid var(--line);padding-top:10px';
      const sm=el('div',null,T('re_more_sum'),'re-more-sum'); sm.style.cssText='font-weight:600;font-size:14px'; more.appendChild(sm);
      const mn=el('div','note',T('re_more_nt'),'re-more-nt'); mn.style.whiteSpace='pre-line'; more.appendChild(mn);
      const pl=el('div','note',T('re_lb_post')); pl.style.marginTop='10px'; more.appendChild(pl);
      const pu=document.createElement('input'); pu.type='text'; pu.id='re-post'; pu.placeholder=T('re_ph_post'); pu.style.cssText='width:100%';
      ['autocomplete','autocapitalize','autocorrect'].forEach(a=>pu.setAttribute(a,'off')); pu.setAttribute('spellcheck','false');
      pu.value=(HP_RE_KEEP&&HP_RE_KEEP.url)||'';
      try{ if(hpReDev()) pu.placeholder=T('re_ph_post_dev'); }catch(e){}
      more.appendChild(pu);
      if(hpReDev()){
        const dv=el('div','row','',''); dv.id='re-dev'; dv.style.cssText='margin-top:6px;display:flex;gap:6px;flex-wrap:wrap';
        [['8081','ボブ'],['8082','アリス'],['8083','キャロル']].forEach(q=>{ const b=el('button','b',q[1]+' '+q[0],'re-dev-'+q[0]); b.style.cssText='font-size:13px;padding:4px 10px'; b.onclick=()=>{ pu.value=q[0]; try{ pu.focus(); }catch(e){} }; dv.appendChild(b); });
        more.appendChild(dv);
      }
      try{ if(pu.value||hpReDev()) more.open=true; }catch(e){}
      card.appendChild(more);
      const er=el('div','note',null,'re-err'); er.style.color='var(--amber)'; card.appendChild(er);
      if(HP_RE_KEEP){ (HP_RE_KEEP.words||[]).forEach((w,i)=>{ if(pc.inputs[i]) pc.inputs[i].value=w; }); if(HP_RE_KEEP.err){ er.textContent=HP_RE_KEEP.err; HP_RE_KEEP.err=null; } }
      const offer=!!(HP_RE_KEEP&&HP_RE_KEEP.offer); if(offer){ const on=el('div','note',T('re_id_offer'),'re-offer'); on.style.marginTop='6px'; card.appendChild(on); }
      const ask=async()=>{ try{ if(typeof hpAsk==='function') return !!(await hpAsk({title:T('re_id_title'),text:T('re_id_q'),ok:T('btn_re_idonly')})); }catch(e){} return false; };
      const run=(words,keep,u,idOnly)=>{ show(2);
        hpRestore(words,u,t=>{ const s=document.getElementById('re-say'); if(s) s.textContent=t; },idOnly)
          .then(r=>{ RES=r; show(3); })
          .catch(e=>{ try{ hpLog('紙から戻せない '+(e&&e.message||'')); }catch(x){}
            HP_RE_KEEP={ url:u, words:keep, err:(e&&e.hpvMsg)||(e&&e.message)||T('re_e_other'), offer:!!(e&&e.hpNoConn&&!idOnly) }; show(1); }); };
      const go=async force=>{ const kk=pc.empty(); if(kk){ er.textContent=TF('pp_e_empty',{n:kk}); pc.focus(kk-1); return; }
        const u=pu.value.trim(); if(u&&!force&&!hpReUrlOk(u)){ er.textContent=T('re_e_url'); try{ more.open=true; }catch(e){} pu.focus(); return; }
        const idOnly=!!force||!u; if(idOnly&&!(await ask())) return;
        run(pc.value(),pc.inputs.map(x=>x.value),u,idOnly); };
      row.appendChild(btn(T('btn_re_go'),true,'re-go',()=>{ go(false); }));
      if(offer) row.appendChild(btn(T('btn_re_idonly'),false,'re-idonly',()=>{ go(true); }));
      row.appendChild(btn(T('btn_re_cancel'),false,'re-cancel',close));
      setTimeout(()=>{ pc.focus(0); },50);
    } else if(n===2){
      card.appendChild(el('h2',null,T('re2_h')));
      const s=el('div','note',T('re_s_connect'),'re-say'); card.appendChild(s);
      card.appendChild(el('div','note',T('re2_wait')));
    } else {
      card.appendChild(el('h2',null,T('re3_h')));
      const sum=(RES&&RES.sum)||{contacts:0,name:''};
      const t=el('div','note',RES&&RES.found?TF('re3_sum',{n:sum.contacts,name:sum.name||'—'}):T(RES&&RES.idOnly?'re3_idonly':'re3_none')); t.style.whiteSpace='pre-line'; card.appendChild(t);
      const rows=hpReDevRows(RES&&RES.by), others=rows.filter(x=>!x.me);
      const hs=el('div','note',T('re3_hist')+(others.length?('\n'+T('re3_hist_dev')):'')); hs.style.whiteSpace='pre-line'; hs.style.marginTop='8px'; card.appendChild(hs);
      card.appendChild(el('div','note',T('re3_devs'))).style.marginTop='10px';
      const pickOn=(LOSTQ==='yes');
      if(pickOn&&others.length){ const w=el('div','note',T('re_lost_warn'),'re-lost-warn'); w.style.cssText='margin-top:6px;color:var(--red)'; card.appendChild(w); }
      const list=el('div',null,null,'re-devs'); card.appendChild(list);
      const boxes=[];
      for(const d of rows){
        const line=document.createElement((d.me||!pickOn)?'div':'label'); line.style.cssText='display:flex;align-items:center;gap:8px;margin-top:4px;font-size:14px';
        let cb=null;
        if(d.me||!pickOn){ const dot=el('span',null,'・'); dot.style.cssText='width:13px;text-align:center;color:var(--dim)'; line.appendChild(dot); }
        else { cb=document.createElement('input'); cb.type='checkbox'; cb.checked=false; cb.dataset.dev=d.dev; line.appendChild(cb); }
        const name=d.me?T('re_dev_me'):d.kind==='wasmain'?T('re_dev_wasmain'):d.kind==='unknown'?T('re_dev_unknown'):(d.label||T('re_dev_unknown'));
        const sp=el('span',null,name+(typeof hpPar==='function'?hpPar(String(d.dev).slice(0,10)+'…'):'（'+String(d.dev).slice(0,10)+'…'+'）')+(d.me?('　'+T('re_dev_keep')):''));
        line.appendChild(sp); list.appendChild(line); if(cb) boxes.push(cb);
      }
      const er=el('div','note',null,'re-rm-msg'); er.style.marginTop='6px'; card.appendChild(er);
      if(RMMSG){ er.style.color='var(--teal)'; er.textContent=RMMSG; RMMSG=''; }
      if(others.length&&!pickOn){
        if(LOSTQ!=='no'){ const q=el('div','note',T('re_lost_q'),'re-lost-q'); q.style.marginTop='10px'; card.appendChild(q);
          const qr=el('div','row'); qr.style.marginTop='6px'; qr.appendChild(btn(T('btn_re_lost_no'),false,'re-lost-no',()=>{ LOSTQ='no'; show(3); })); qr.appendChild(btn(T('btn_re_lost_yes'),false,'re-lost-yes',()=>{ LOSTQ='yes'; show(3); })); card.appendChild(qr); }
        else { const nn=el('div','note',T('re_lost_later'),'re-lost-later'); nn.style.marginTop='8px'; card.appendChild(nn); }
      }
      if(boxes.length) row.appendChild(btn(T('btn_re_lost_back'),false,'re-lost-back',()=>{ LOSTQ='no'; show(3); }));
      if(boxes.length) row.appendChild(btn(T('btn_re_rm'),false,'re-rm',async()=>{
        const pick=boxes.filter(x=>x.checked).map(x=>x.dataset.dev); if(!pick.length){ er.style.color='var(--amber)'; er.textContent=T('re_e_pick'); return; }
        const b=document.getElementById('re-rm'); if(b) b.disabled=true; er.style.color=''; er.textContent=T('re_s_rm');
        let n=0, last='';
        for(const dv of pick){ try{ await hpDevRemove(dv); n++; }catch(e){ last=(e&&e.message)||''; } }
        const msg=last?TF('re_rm_fail',{err:last}):TF('re_rm_done',{n:n});
        er.style.color=last?'var(--amber)':'var(--teal)'; er.textContent=msg;
        if(n){ RMMSG=msg; show(3); }
      }));
      if(typeof hpVaultOn==='function'&&!hpVaultOn()) row.appendChild(btn(T('btn_pp4_vault'),true,'re-tovault',()=>{ close(); try{ document.getElementById('t-id').click(); const c=document.getElementById('vault-card'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){} }));
      if(RES&&RES.idOnly) row.appendChild(btn(T('btn_re_tobox'),false,'re-tobox',()=>{ close(); try{ document.getElementById('t-post').click(); }catch(e){} }));
      row.appendChild(btn(T('btn_re_close'),!(typeof hpVaultOn==='function'&&!hpVaultOn()),'re-close',close));
    }
    card.appendChild(row);
  };
  show(1);
}
