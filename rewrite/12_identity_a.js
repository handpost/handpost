async function sha256hexBytes(u8){ return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',u8))); }
function renderDevMode(){
  const el=document.getElementById('id-devmode'); if(!el)return;
  const child=(typeof hpIsChild==='function'&&hpIsChild()), main=!!(ID&&ID.privateKeyPem);
  if(child){ el.textContent=T('nt_role_child'); el.style.color='var(--amber)'; el.style.display='block'; }
  else if(main){ el.textContent=T('nt_role_main'); el.style.color='var(--teal)'; el.style.display='block'; }
  else { el.style.display='none'; }
  try{ const nf=document.querySelector('[data-i18n="nt_forget"],[data-i18n="nt_forget_sub"]'); if(nf&&nf.setAttribute){ const k=child?'nt_forget_sub':'nt_forget'; nf.setAttribute('data-i18n',k); nf.textContent=T(k); } }catch(e){}
  try{
    const lj=document.getElementById('linkjoin-card'); if(lj)lj.style.display=ID?'none':'';
  }catch(e){}
  try{ if(typeof hpLinkUi==='function')hpLinkUi(); }catch(e){}
}

function hpDevName(l){ const m=/^(.+?) · (.+)$/.exec(String(l||'')); return m?TF('dv_name',{b:m[1],o:m[2]}):(String(l||'')||T('dv_noname')); }

function hpDayText(ts){
  const d=new Date(Number(ts)||0), p=n=>String(n).padStart(2,'0'), a=new Date(); a.setHours(0,0,0,0);
  if(d.getTime()>=a.getTime()) return T('dv_today');
  const y=new Date(a); y.setDate(y.getDate()-1); if(d.getTime()>=y.getTime()) return T('dv_yday');
  return d.getFullYear()+'/'+p(d.getMonth()+1)+'/'+p(d.getDate());
}
function renderDevices(){
  try{ if(typeof hpRoleBadge==='function') hpRoleBadge(); }catch(e){}
  const card=document.getElementById('dev-card'), list=document.getElementById('dev-list'); if(!card||!list)return;
  const rows=(ID&&typeof hpDevRows==='function')?hpDevRows():[];
  if(!rows.length){ card.style.display='none'; return; }
  card.style.display='block'; list.innerHTML='';
  for(const d of rows){
    const row=document.createElement('div'); row.className='contact-item';
    const nm=document.createElement('div'); nm.className='nm';
    const b=document.createElement('b'); b.textContent=TF('dv_head',{role:T(d.role==='main'?'dv_role_main':'dv_role_child'),name:hpDevName(d.label)}); try{ if(d.dev&&typeof hpDevMarkEl==='function'&&typeof b.insertBefore==='function'){ const mk=hpDevMarkEl(d.dev,''); if(mk){ try{ mk.style.marginLeft='0'; }catch(e){} b.insertBefore(mk,b.firstChild||null); } } }catch(e){}
    const dt=[(d.me?T('dv_me'):''),(d.at?TF('dv_added',{t:fmtTS(d.at)}):''),((!d.me&&d.seen)?TF('dv_seen',{t:hpDayText(d.seen)}):'')].filter(Boolean).join(' · ');
    nm.appendChild(b); if(dt){ const s=document.createElement('span'); s.textContent=dt; nm.appendChild(s); }
    const last=d.seen||d.at||0, staleMs=(typeof HP_STALE_DEV==='number')?HP_STALE_DEV:45*86400e3;
    if(ID&&ID.privateKeyPem&&d.role==='child'&&!d.me&&last&&Date.now()-last>staleMs){ const w=document.createElement('span'); w.className='dv-stale'; w.style.color='#e6a23c'; w.style.whiteSpace='normal'; w.textContent=T('dv_stale'); nm.appendChild(w); }
    if(!d.me&&d.dev&&typeof hpHistTxText==='function'){ const ht=hpHistTxText(d.dev); if(ht){ const w=document.createElement('span'); w.className='dv-hist'; w.style.whiteSpace='normal'; w.style.color='#35d1b7'; w.textContent=ht; nm.appendChild(w); } }
    try{ if(d.dev&&typeof hpDevBoxText==='function'){ const bt=hpDevBoxText(d); if(bt){ const w=document.createElement('span'); w.className='dv-box'; w.style.whiteSpace='normal'; w.textContent=bt; nm.appendChild(w); } } }catch(e){}
    row.appendChild(nm);

    if(ID&&ID.privateKeyPem&&d.role==='child'&&!d.me&&typeof hpMvOffer==='function'&&!(typeof hpKillMe==='function'&&hpKillMe())){
      const mb=document.createElement('button'); mb.className='b'; mb.textContent=T('btn_dev_mv'); mb.disabled=!!(typeof HP_MV!=='undefined'&&HP_MV&&HP_MV.exp>Date.now());
      mb.onclick=async()=>{ if(mb.disabled) return; mb.disabled=true; let v=false; const lb=d.label?hpDevName(d.label):(d.dev.slice(0,10)+'…'); try{ v=await hpAsk({text:TF('cf_mv_send',{label:lb}), auth:true, ok:T('btn_dev_mv'), why:'メイン端末を移す'}); }finally{ mb.disabled=false; } if(!v) return; mb.disabled=true; hpMvOffer(d.dev).catch(e=>{ mb.disabled=false; alert(TF('al_mv_fail',{err:(typeof hpErrShow==='function'?hpErrShow(e):e.message)})); }); };
      row.appendChild(mb);
    }
    if(ID&&ID.privateKeyPem&&d.role==='child'&&!d.me&&typeof hpDevRemove==='function'&&!(typeof hpKillMe==='function'&&hpKillMe())){
      const rm=document.createElement('button'); rm.className='b warn'; rm.textContent=T('btn_dev_rm');
      rm.onclick=async()=>{ if(rm.disabled) return; rm.disabled=true; let v=false; try{ v=await hpAsk({text:TF('cf_dev_rm',{label:d.label?hpDevName(d.label):(d.dev.slice(0,10)+'…')}), auth:true, danger:true, ok:T('btn_dev_rm'), why:'サブ端末を外す'}); }finally{ rm.disabled=false; } if(!v) return; rm.disabled=true;   hpDevRemove(d.dev).catch(e=>{ rm.disabled=false; alert(TF('al_rm_fail',{err:(typeof hpErrShow==='function'?hpErrShow(e):e.message)})); }); };
      row.appendChild(rm);
    }
    if(ID&&!ID.privateKeyPem&&!d.me&&d.dev&&typeof hpD2Remove==='function'&&!(typeof hpKillMe==='function'&&hpKillMe())){
      const rm=document.createElement('button'); rm.className='b warn'; rm.textContent=T('btn_dev_rm');
      rm.onclick=async()=>{ if(rm.disabled) return; rm.disabled=true; let v=false; try{ v=await hpAsk({text:TF('cf_dev_rm',{label:d.label?hpDevName(d.label):(d.dev.slice(0,10)+'…')}), auth:true, danger:true, ok:T('btn_dev_rm'), why:'端末を外す'}); }finally{ rm.disabled=false; } if(!v) return; rm.disabled=true; hpD2Remove(d.dev).catch(e=>{ rm.disabled=false; alert(TF('al_rm_fail',{err:(typeof hpErrShow==='function'?hpErrShow(e):e.message)})); }); };
      row.appendChild(rm);
    }
    list.appendChild(row);
  }
  try{
    let pw=document.getElementById('dev-pull');
    if(!pw&&list.parentNode&&typeof list.parentNode.insertBefore==='function'){ pw=document.createElement('div'); pw.id='dev-pull'; pw.style.cssText='margin:8px 0'; const pb=document.createElement('button'); pb.className='b'; pb.id='btn-hist-pull'; const pn=document.createElement('div'); pn.className='note'; pn.id='nt-hist-pull'; pw.appendChild(pb); pw.appendChild(pn); list.parentNode.insertBefore(pw,list.nextSibling);
      pb.onclick=async()=>{ if(pb.disabled) return; pb.disabled=true; let n=0; try{ n=(typeof hpHistPull==='function')?(await hpHistPull('manual')):0; }catch(e){ n=0; } pb.disabled=false; alert(n?TF('al_hist_pull',{n:n}):T('al_hist_pull0')); }; }
    if(pw){ const pb=document.getElementById('btn-hist-pull'), pn=document.getElementById('nt-hist-pull'); if(pb) pb.textContent=T('btn_hist_pull'); if(pn) pn.textContent=T('nt_hist_pull'); pw.style.display=(rows.length>1&&!(typeof hpKillMe==='function'&&hpKillMe()))?'':'none'; }
  }catch(e){}
  const main=!!(ID&&ID.privateKeyPem);
  try{ const lw=document.getElementById('link-wrap'); if(lw)lw.style.display=(main&&!(typeof hpKillMe==='function'&&hpKillMe()))?'':'none';   }catch(e){}
  try{ const nd=document.querySelector('#dev-card .note[data-i18n="nt_dv"]'); if(nd) nd.style.display=main?'none':''; }catch(e){}
  try{ if(typeof hpMvBox==='function') hpMvBox(card); }catch(e){}
  try{ if(typeof renderSiblings==='function') renderSiblings(); }catch(e){}
}

