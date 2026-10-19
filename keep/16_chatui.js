function fmtDurL(ms){ const s=Math.max(0,Number(ms)||0)/1000, F=(k,n)=>TF(k,{n:n}); if(s<60) return F('dur_s',s<10?s.toFixed(1):String(Math.round(s))); const m=Math.floor(s/60); if(m<60) return F('dur_m',m); const h=Math.floor(m/60); if(h<24) return F('dur_h',h)+(m%60?' '+F('dur_m',m%60):''); const d=Math.floor(h/24); return F('dur_d',d)+(h%24?' '+F('dur_h',h%24):''); }
function hpBubbleInfo(rec,kind){ const out=[]; try{ if(!rec||rec.x) return out; const tm=x=>{ try{ const d=new Date(x), p=n=>String(n).padStart(2,'0'); return (d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes()); }catch(e){ return ''; } }; const pt=(typeof hpPostTs==='function')?hpPostTs(rec):rec.ts; if(pt!==rec.ts){ out.push(TF('mi_stamp_again',{t:tm(pt)})); out.push(TF('mi_stamp0',{t:tm(rec.ts)})); } else out.push(TF('mi_stamp',{t:tm(rec.ts)}));   if(kind==='self'){ if(rec.g&&rec.g>=rec.ts) out.push(TF('mi_deliv',{t:tm(rec.g)})); if(rec.k&&rec.u&&rec.u>=rec.ts) out.push(TF('mi_open',{t:tm(rec.u)})); else if(rec.g) out.push(TF('mi_open_not',{})); } else if(rec.rx&&rec.rx>=rec.ts) out.push(TF('mi_rx',{t:tm(rec.rx)})); }catch(e){} return out; }
function hpLetterWho(kind){ try{ if(typeof CURPEER==='undefined'||!CURPEER||typeof ID==='undefined'||!ID) return []; const sid=a=>String(a||'').slice(0,11)+'…'; const me=((typeof myName==='function'&&myName())||'')+'（'+sid(ID.address)+'）', pe=((typeof nickOf==='function'&&nickOf(CURPEER))||'')+'（'+sid(CURPEER)+'）'; return [TF('cp_from',{n:kind==='self'?me:pe}),TF('cp_to',{n:kind==='self'?pe:me})]; }catch(e){ return []; } }
function hpLetterCopy(rec,kind){ try{ if(!rec||rec.x) return ''; const inf=hpLetterWho(kind).concat(hpBubbleInfo(rec,kind)), txt=(typeof rec.t==='string')?rec.t:''; const body=rec.img?T('cp_photo'):rec.file?TF('cp_file',{n:rec.file.name||'file'}):txt; return inf.concat(body&&inf.length?['',body]:(body?[body]:[])).join('\n'); }catch(e){ return ''; } }
function hpAgo(ts,now){ try{ const s=Math.max(0,((now||Date.now())-Number(ts))/1000); if(s<60) return T('ago_now'); if(s<3600) return TF('ago_min',{n:Math.floor(s/60)}); if(s<86400) return TF('ago_hour',{n:Math.floor(s/3600)}); if(s<7*86400) return TF('ago_day',{n:Math.floor(s/86400)}); const d=new Date(Number(ts)); return (d.getMonth()+1)+'/'+d.getDate(); }catch(e){ return ''; } }
function hpAgoTick(){ try{ const now=Date.now(); for(const t of document.querySelectorAll('#msgs .m time[data-ts]')){ const v=hpAgo(Number(t.dataset.ts),now); if(t.textContent!==v) t.textContent=v; } }catch(e){} }
function fmtDur(ms){ const s=Math.max(0,Number(ms)||0)/1000; if(s<60) return s.toFixed(1)+'s'; const m=Math.floor(s/60); if(m<60) return m+'m'; const h=Math.floor(m/60); if(h<24) return h+'h'+(m%60?' '+(m%60)+'m':''); const d=Math.floor(h/24); return d+'d'+(h%24?' '+(h%24)+'h':''); }

function hpScnSt(){ return hpScnSt.v||(hpScnSt.v={rly:'',p2p:''}); }
function dot(id,cls){ cls=cls||''; const d=$('#'+id); if(d) d.className='scn '+cls; const st=hpScnSt(); if(id==='d-rly') st.rly=cls; else if(id==='d-p2p') st.p2p=cls; hpSceneCap(); }
function hpSceneOnline(){ try{ return !(typeof navigator!=='undefined'&&navigator&&navigator.onLine===false); }catch(e){ return true; } }
function hpSceneKey(){ const st=hpScnSt(); if(!hpSceneOnline()) return 'nd_post_off'; const ls=(typeof hpLeaseState==='function')?hpLeaseState():''; if(st.rly==='err'){ if(typeof POST!=='undefined'&&POST&&POST.notOwner) return 'nd_post_err_owner'; if(typeof hpKillMe==='function'&&hpKillMe()) return 'nd_post_err_dead'; if(ls==='expired') return 'nd_post_err_lease'; return 'nd_post_err'; } return ({warn:'nd_post_warn',ok:'nd_post_ok'})[st.rly]||'nd_relay'; }
function hpSceneCap(){ const st=hpScnSt(); const sc=$('#d-rly'); if(sc&&sc.classList){ sc.classList.toggle('off',!hpSceneOnline()); }   const c=document.getElementById('cap-rly'); if(c){ const k=hpSceneKey(); c.setAttribute('data-i18n',k);   let t=(typeof T==='function')?T(k):k; if(k==='nd_post_warn'&&typeof POST!=='undefined'&&POST&&(POST.tries||0)>=2&&typeof TF==='function') t+=TF('nd_post_try',{n:POST.tries});   if(k==='nd_post_err'&&typeof POST!=='undefined'&&POST&&Number(POST.nextAt)>Date.now()&&typeof TF==='function'){ const left=Number(POST.nextAt)-Date.now(); t+=(left<60000?T('nd_post_soon'):TF('nd_post_next',{t:new Date(Number(POST.nextAt)).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}))+((POST.tries||0)>=2?T('nd_post_keep'):''); }   if(k==='nd_post_err_lease'&&typeof TF==='function'&&typeof hpLeaseText==='function') t=TF(k,{t:hpLeaseText()}); c.textContent=t; if(k==='nd_post_err_lease'&&typeof document.createElement==='function'){ try{ const a=document.createElement('a'); a.href='#'; a.className='lease-go'; a.textContent=(typeof T==='function')?T('lease_link'):'lease_link'; a.onclick=e=>{ try{ e.preventDefault(); }catch(_){} try{ if(typeof hpLeaseGo==='function') hpLeaseGo(); }catch(_){} }; c.appendChild(document.createTextNode(' ')); c.appendChild(a); }catch(e){} }   } try{ if(typeof hpLeaseLine==='function') hpLeaseLine(); }catch(e){}   try{ if(typeof hpCsRender==='function') hpCsRender(); }catch(e){}   }
function pathConnected(on){ dot('d-p2p',on?'live':''); const s=$('#s2'); if(s) s.classList.toggle('off',!!on); }
function hpSceneLetter(side,dir){ try{ if(side!=='post'||dir!=='in') return; const sc=document.getElementById('d-rly'); if(!sc) return; sc.classList.add('in'); if(hpSceneLetter.t) clearTimeout(hpSceneLetter.t); hpSceneLetter.t=setTimeout(()=>{ try{ sc.classList.remove('in'); }catch(e){} },1500); }catch(e){} }

function addMsg(kind,text,who){
  const d=document.createElement('div');d.className='m '+kind;
  if(who){const w=document.createElement('span');w.className='who';w.textContent=who;d.appendChild(w);}
  const bd=document.createElement('span');bd.className='bd';bd.textContent=text;d.appendChild(bd);
  const ts0=Date.now();
  const t=document.createElement('time');t.textContent=hpAgo(ts0);t.dataset.ts=String(ts0);t.title=fmtTS(ts0);
  d.appendChild(t);
  if(kind==='self')wireVoid(d,ts0);
  $('#msgs').appendChild(d);scrollNew();
}
function addMsgAt(kind,text,who,ts,voided,pend,rd,img,file){
  const d=document.createElement('div');d.className='m '+kind;
  if(who){const w=document.createElement('span');w.className='who';w.textContent=who;d.appendChild(w);}
  if(img&&img.thumb){ const im=document.createElement('img'); im.className='ph'; im.alt='photo'; im.onclick=e=>{ e.stopPropagation();   if(d.classList.contains('void'))return; openPhoto(img); };   const _follow=()=>{ if(kind==='self'||d.__nearEndOnAdd)scrollNew(true); }; im.onload=_follow; im.onerror=_follow; im.src=img.thumb; d.appendChild(im); }
  if(file&&file.id){ const fb=document.createElement('div'); fb.className='fb'; const ic=document.createElement('span'); ic.className='ic'; ic.textContent=fileIcon(file.name,file.mime); const nm=document.createElement('span'); nm.className='fn'; nm.textContent=((typeof hpFileName==='function')?hpFileName(file.name):file.name)||'file';   const sz=document.createElement('span'); sz.className='fs'; sz.textContent=fmtSize(file.size||0); fb.appendChild(ic); fb.appendChild(nm); fb.appendChild(sz); if(file.risk||(typeof hpFileRisky==='function'&&hpFileRisky(file.name,file.mime))){ const rk=document.createElement('span'); rk.className='fr'; rk.textContent=T('fb_risky'); fb.appendChild(rk); }   fb.onclick=e=>{ e.stopPropagation();   if(d.classList.contains('void'))return; saveFile(file); }; d.appendChild(fb); }
  const bd=document.createElement('span');bd.className='bd';bd.textContent=text;d.appendChild(bd);
  const t=document.createElement('time');t.textContent=hpAgo(ts);t.dataset.ts=String(ts);t.title=fmtTS(ts);
  d.appendChild(t); d.dataset.ts=String(ts);
if(kind==='peer'){ try{ const rec=histLoad(CURPEER).find(x=>x.ts===ts&&x.d==='p');   if(rec&&rec.fd&&typeof hpDevMarkInto==='function'){ hpDevMarkInto(d,rec.fd,CURPEER); const om=d.querySelector('.dvm'), pr=CURPEER; if(om&&om.addEventListener){ om.style.cursor='pointer'; om.addEventListener('click',e=>{ try{ e.stopPropagation(); }catch(_){} hpDevToast(hpDevInfoText(pr,rec.fd,rec.ts));   }); }   try{ const nt=(typeof hpNewDevNote==='function')?hpNewDevNote(CURPEER,rec):''; if(nt){ const e=document.createElement('div'); e.className='hpnewdev'; e.style.cssText='font-size:11px;color:var(--dim);margin-top:4px;white-space:normal'; e.textContent=nt; d.appendChild(e); } }catch(_){}   }     }catch(e){} }
  if(pend){ const pm=document.createElement('span'); pm.className='vmark pend'; pm.textContent=T('mk_pend'); d.appendChild(pm); }
  { const _m=$('#msgs'); d.__nearEndOnAdd = _m ? (typeof nearEnd==='function' ? nearEnd(_m) : true) : true; }
  if(kind==='self'){ wireVoid(d,ts); if(rd)markRead(d); scrollNew(true); } else { wireVoid(d,ts,'peer'); }
  try{ if(!voided&&CURPEER&&typeof hpXhLine==='function'){ const rec=histLoad(CURPEER).find(x=>x.ts===ts&&x.d===(kind==='self'?'s':'p')); if(rec&&rec.xh&&rec.xh.length){ hpXhLine(d,rec.xh,false); const pt=(typeof hpPostTs==='function')?hpPostTs(rec):ts; if(pt!==ts){ t.textContent=hpAgo(pt); t.dataset.ts=String(pt); t.title=fmtTS(pt); }   } } }catch(e){}
  if(voided)markVoid(d);
  $('#msgs').appendChild(d);
  if(kind==='self'||d.__nearEndOnAdd){ scrollNew(kind==='self'); requestAnimationFrame(()=>scrollNew(kind==='self'||d.__nearEndOnAdd)); } else { scrollNew(); }
}
function histRender(a){
  if(!a)return;
  const h=histLoad(a);
  $('#msgs').innerHTML='';
  if(h.length===0)return;
  for(const m of h){ if(m.d==='v'){ const s=hpVoidEl(a,m.ts); if(s) $('#msgs').appendChild(s); continue; } addMsgAt(m.d==='s'?'self':'peer', m.t, m.d==='s'?(myName()||T('me')):nickOf(a), m.ts, m.x, m.p, (typeof hpReadOff==='function'&&hpReadOff())?0:m.k, m.img, m.file); }
  if(typeof hpOnConvRender==='function'){ try{ hpOnConvRender(a); }catch(e){} }
  if(UNREAD_ADDR===a && UNREAD_AT>0){
    let idx=-1;
    for(let i=0;i<h.length;i++){ if(h[i].d==='p' && histOrd(h[i])>UNREAD_AT){ idx=i; break; } }
    const box=$('#msgs');
    if(idx>=0 && box.children[idx]){
      const sep=document.createElement('div');sep.className='m sys';
      sep.textContent=T('sys_unread');sep.style.opacity='.6';
      box.insertBefore(sep,box.children[idx]);
    }
  }
  scrollNew();
}

function hpVoidEl(a,ts){ const s=document.createElement('div'); s.className='m sys'; s.dataset.ts=String(ts); s.style.opacity='.6'; let xh=null; try{ const rec=histLoad(a).find(x=>x.ts===ts&&x.d==='v'); xh=rec&&rec.xh; }catch(e){} s.textContent=TF('sys_peer_void',{who:nickOf(a)})+((xh&&xh.length&&typeof hpXhText==='function')?'（'+(xh.length===1?hpXhTime(xh[0].t):hpXhText(xh))+'）':'');   return s; }
function histVoid(a,ts){
  const h=histLoad(a); const m=h.find(x=>x.ts===ts && x.d==='s'); if(m){ m.x=1; delete m.p; if(typeof hpXhPush==='function') hpXhPush(m,'x');     m.u=Date.now(); histSave(a,h); sibMirror(a,m); try{ if(typeof hpFailLineDone==='function') hpFailLineDone(a); }catch(e){}   return true; } return false;
}
function histBack(a,ts){
  const h=histLoad(a); const m=h.find(x=>x.ts===ts&&x.d==='s'); if(!m||!m.x) return false;
  if(Date.now()-ts>HP_VOID_READ_MS) return false;
  if(typeof hpXhPush==='function') hpXhPush(m,'b');
  for(const k of ['x','xv','xd','xf','xd0','hp','g','k','dc','hf','wl']) delete m[k];
  m.p=1; m.u=Date.now(); try{ if(typeof sibDv==='function') m.dv=sibDv(); }catch(e){}
  histSave(a,h); try{ if(typeof sibMirror==='function') sibMirror(a,m); }catch(e){} return true;
}
function histRead(a,ids){
  const h=histLoad(a); let ch=false;
  for(const ts of ids){ const m=h.find(x=>x.ts===Number(ts) && x.d==='s'); if(m && !m.k){ m.k=1; delete m.p; m.u=Date.now(); ch=true; sibMirror(a,m); } }
  if(ch)histSave(a,h);
  return ch;
}
function hpOpenedNoBack(rec,el){ try{ if(typeof hpReadOff==='function'&&hpReadOff()) return false; return !!(rec&&rec.k)||!!(el&&el.querySelector&&el.querySelector('.rmark')); }catch(e){ return false; } }
function markRead(el){
  if(!el)return;
  try{ if(!(typeof hpReadOff==='function'&&hpReadOff())&&el.title===T('tip_void')) el.title=T('tip_copy'); }catch(e){}
  const pm=el.querySelector('.vmark.pend');
  if(pm) pm.remove();
  { const sm=el.querySelector('.smark'); if(sm) sm.remove(); }
  if(el.querySelector('.rmark'))return;
  let lab=T('mk_read'); if(el.classList&&el.classList.contains('void')){ const t0=Number(el.dataset&&el.dataset.ts)||0; lab=T('mk_read_void');   } else try{ const ts=Number(el.dataset.ts);   }catch(e){}
const r=document.createElement('span'); r.className='rmark'; r.textContent=lab; el.appendChild(r);
}
function histVoidPeer(a,ts){ const r=hpVoidIn(a,ts); return r==='gone'; }
function findMsgEl(ts){
  const list=$('#msgs').querySelectorAll('.m');
  for(const el of list){ if(el.dataset && el.dataset.ts===String(ts)) return el; }
  return null;
}

function hpXhTime(t){ const s=fmtTS(t), now=fmtTS(Date.now()); return s.slice(0,10)===now.slice(0,10)?s.slice(11):s.slice(5); }
function hpXhText(xh){ return ((typeof hpXhNorm==='function')?hpXhNorm(xh):[]).map(v=>hpXhTime(v.t)+' '+T(v.a==='x'?'xh_x':'xh_b')).join(' → '); }
function hpXhLine(el,xh,voided){
  const old=el.querySelector('.vhist'); if(old) old.remove();
  const s=document.createElement('span'); s.className='vhist'; s.textContent=hpXhText(xh);

  el.appendChild(s);
}
function markVoid(el){
  el.classList.add('void');
  const pm=el.querySelector('.vmark.pend'); if(pm)pm.remove();
  for(const c of ['.smark','.hpwait','.hpfail']){ const x=el.querySelector(c); if(x)x.remove(); }
  let xh=null; try{ const ts=Number(el.dataset&&el.dataset.ts)||0, rec=(CURPEER&&ts)?histLoad(CURPEER).find(x=>x.ts===ts&&x.d==='s'):null; xh=rec&&rec.xh; }catch(e){}
  if(!(xh&&xh.length)) xh=[{a:'x',t:Date.now()}];
  hpXhLine(el,xh,true);
}
function hpVoidRun(el,ts){ return (async()=>{
    if(el.classList.contains('void'))return;
    {
      const m=CURPEER?histLoad(CURPEER).find(x=>x.ts===ts&&x.d==='s'):null, rd=!!(el.querySelector('.rmark')||(m&&m.k)), off=(typeof hpReadOff==='function')&&hpReadOff();
      if(off){ if(!(await hpAsk({text:T('cf_void_off'), ok:T('btn_ask_void')})))return; }
      else if(rd){ alert(T('al_void_read')); return; }
      else if(!(await hpAsk({text:T('cf_void'), ok:T('btn_ask_void')})))return;
      if(el.classList.contains('void'))return;
    }
    const r0=CURPEER?histLoad(CURPEER).find(x=>x.ts===ts&&x.d==='s'):null, went=!!(r0&&(r0.hp||r0.dc||r0.g||!r0.p));
    if(CURPEER)histVoid(CURPEER,ts); markVoid(el);
    const xh1=(CURPEER&&typeof hpXhNorm==='function')?hpXhNorm((histLoad(CURPEER).find(x=>x.ts===ts&&x.d==='s')||{}).xh):[];
    let toldV=false; try{ if(CURPEER&&typeof rtcLineTo==='function'&&rtcLineTo(CURPEER)){ DC.send(JSON.stringify({v:1,type:'void',id:ts,xh:xh1})); toldV=true; } }catch(e){}
    try{ if(CURPEER&&typeof hpLog==='function') hpLog('取り消した → '+nickOf(CURPEER)+'（'+fmtTS(ts).slice(11)+' の 1 通。'+(toldV?'直結で知らせた。':'')+(went?'ポスト経由でも知らせる':'まだ相手に届いていない 1 通なので、知らせることは無い')+'）'); }catch(e){}
    if(CURPEER&&went&&typeof hpVoidSend==='function'){ const p=CURPEER; hpVoidSend(p,ts).catch(()=>{}); }
  })(); }
function hpBackDo(peer,ts){
  if(!histBack(peer,ts)){ alert(T('al_back_late')); return false; }
  try{ if(typeof hpLog==='function') hpLog('戻した → '+nickOf(peer)+'（'+fmtTS(ts).slice(11)+' の 1 通。本文をもう一度送る）'); }catch(e){}
  try{ if(CURPEER===peer) histRender(peer); }catch(e){}
  try{ if(typeof hpBackSend==='function') hpBackSend(peer,ts); }catch(e){}
  return true;
}
function hpPeekNode(rec){
  const node=document.createElement('div'); node.className='peek'; node.style.cssText='margin-top:10px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--self);max-height:40vh;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:14px';
  if(rec.img){ const im=document.createElement('img'); im.style.cssText='max-width:100%;max-height:36vh;display:block;border-radius:6px'; if(rec.img.thumb) im.src=rec.img.thumb; node.appendChild(im);
    try{ if(typeof blobGet==='function') blobGet(rec.img.id).then(b=>{ if(b){ const u=URL.createObjectURL(b); im.onload=()=>{ try{ URL.revokeObjectURL(u); }catch(e){} }; im.src=u; } }).catch(()=>{}); }catch(e){} }
  else if(rec.file){ node.textContent=((typeof fileIcon==='function')?fileIcon(rec.file.name,rec.file.mime)+' ':'')+(rec.file.name||'file')+'  '+((typeof fmtSize==='function')?fmtSize(rec.file.size||0):''); }
  else node.textContent=String(rec.t||'');
  return node;
}
function hpPeekRun(el,ts){ return (async()=>{
  if(!CURPEER) return false; const peer=CURPEER, rec=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!rec||!rec.x) return false;
  const late=Date.now()-ts>HP_VOID_READ_MS, node=hpPeekNode(rec);
  const hist=document.createElement('div'); hist.style.cssText='margin-top:6px;font-size:11px;color:var(--dim)'; hist.textContent=fmtTS(ts)+'  '+hpXhText(rec.xh||[]); node.appendChild(hist);
  const go=await hpAsk({text:T(late?'pk_late':'pk_ask'), node:node, ok:T('btn_back'), cancel:T(late?'btn_close':'ask_cancel'), noOk:late});
  if(!go||late) return false;
  return hpBackDo(peer,ts);
})(); }
let HP_MENU_OFF=null;
function hpMenuClose(){ try{ const m=document.getElementById('bmenu'); if(m) m.remove(); }catch(e){} try{ if(HP_MENU_OFF){ const f=HP_MENU_OFF; HP_MENU_OFF=null; f(); } }catch(e){} }
function hpBubbleMenu(el,ts,kind){
  hpMenuClose(); if(!CURPEER) return false;
  const rec=histLoad(CURPEER).find(x=>x.ts===ts&&x.d===(kind==='self'?'s':'p')); if(!rec) return false;
  const items=[], txt=(typeof rec.t==='string')?rec.t:'';
  if(hpLetterCopy(rec,kind)) items.push([T('btn_copy'),()=>hpCopyText(hpLetterCopy(rec,kind))]);
  if(!rec.x&&((rec.img&&rec.img.id)||(rec.file&&rec.file.id))) items.push([T('btn_save_dev'),()=>hpSaveToDevice(rec)]);
  if(kind==='self'){ if(rec.x){ hpPeekRun(el,ts); return true; } else if(!hpOpenedNoBack(rec,el)) items.push([T('btn_unsend'),()=>hpVoidRun(el,ts)]); }
  const info=(typeof hpBubbleInfo==='function')?hpBubbleInfo(rec,kind):[];
  if(!items.length&&!info.length) return false;
  const m=document.createElement('div'); m.id='bmenu';
  if(info.length){ const bx=document.createElement('div'); bx.className='mi'; for(const t of info){ const r=document.createElement('div'); r.textContent=t; bx.appendChild(r); } m.appendChild(bx); }
  for(const [lab,fn] of items){ const b=document.createElement('button'); b.textContent=lab; b.onclick=e=>{ e.stopPropagation(); hpMenuClose(); fn(); }; m.appendChild(b); }
  try{ if(document.body) document.body.appendChild(m); }catch(e){} el.__menu=m;
  try{ const r=el.getBoundingClientRect(), H=(window.innerHeight||600), Wd=(window.innerWidth||400), mh=m.offsetHeight||120, mw=m.offsetWidth||180; let B=H; try{ const vv=window.visualViewport; if(vv&&vv.height) B=Math.min(B,(vv.offsetTop||0)+vv.height); const ms=document.getElementById('msgs'); if(ms){ const mr=ms.getBoundingClientRect(); if(mr.bottom>0) B=Math.min(B,mr.bottom); } }catch(_){} let top=r.bottom+4; if(top+mh>B-4) top=Math.max(8,r.top-4-mh);   m.style.top=top+'px'; m.style.left=Math.max(8,Math.min(kind==='self'?r.right-mw:r.left,Wd-mw-8))+'px'; }catch(e){}
  setTimeout(()=>{ try{ if(HP_MENU_OFF){ HP_MENU_OFF(); HP_MENU_OFF=null; } const out=e=>{ try{ if(e&&e.target&&m.contains(e.target)) return; }catch(_){} hpMenuClose(); }; document.addEventListener('click',out,true); document.addEventListener('touchstart',out,{passive:true,capture:true}); HP_MENU_OFF=()=>{ try{ document.removeEventListener('click',out,true); document.removeEventListener('touchstart',out,{capture:true}); }catch(_){} }; }catch(e){} },0);
  return true;
}
function hpCopyText(t){ return (async()=>{ let ok=false; try{ if(navigator.clipboard&&navigator.clipboard.writeText){ await navigator.clipboard.writeText(t); ok=true; } }catch(e){} if(!ok){ try{ const ta=document.createElement('textarea'); ta.value=t; ta.style.cssText='position:fixed;left:-9999px;top:0'; document.body.appendChild(ta); ta.select(); ok=document.execCommand('copy'); ta.remove(); }catch(e){} } hpToast(T(ok?'tx_copied':'tx_copy_fail')); return ok; })(); }
function hpToast(t,ms){ try{ let d=document.getElementById('toast'); if(!d){ d=document.createElement('div'); d.id='toast'; document.body.appendChild(d); } d.__dev=''; try{ d.style.pointerEvents=''; d.style.cursor=''; }catch(_){}   d.textContent=t; try{ d.style.whiteSpace='pre-line'; d.style.maxWidth='92vw'; }catch(_){}   try{ d.style.width='max-content'; d.style.boxSizing='border-box'; d.style.textAlign=''; d.style.lineHeight=''; }catch(_){}   d.classList.add('on'); clearTimeout(d.__t); d.__t=setTimeout(()=>{ d.classList.remove('on'); },ms||1600); }catch(e){} }

function hpToastHide(){ try{ const d=document.getElementById('toast'); if(!d) return false; clearTimeout(d.__t); d.classList.remove('on'); d.__dev=''; d.style.pointerEvents=''; d.style.cursor=''; return true; }catch(e){ return false; } }
function hpDevToast(t){ try{ const d0=document.getElementById('toast'); if(d0&&d0.classList.contains('on')&&d0.__dev===t){ hpToastHide(); return 'hide'; } }catch(e){}
  hpToast(t,7000); try{ const d=document.getElementById('toast'); if(d){ d.__dev=t; d.style.pointerEvents='auto'; d.style.cursor='pointer'; d.style.textAlign='left'; d.style.lineHeight='1.7';   clearTimeout(d.__t); d.__t=setTimeout(hpToastHide,7000);
    if(!d.__devWired){ d.__devWired=1; d.addEventListener('click',e=>{ if(!d.__dev) return; try{ e.stopPropagation(); }catch(_){} hpToastHide(); }); } } }catch(e){} return 'show'; }
function hpDevSince(peer,fd,ts){ try{ const f=String(fd||'').toLowerCase(); let prev=0; for(const x of histLoad(peer)){ if(x&&x.d==='p'&&String(x.fd||'').toLowerCase()===f&&Number(x.ts)<Number(ts)&&Number(x.ts)>prev) prev=Number(x.ts); } return prev?Number(ts)-prev:-1; }catch(e){ return -1; } }
function hpDevSinceText(peer,fd,ts){ const ms=hpDevSince(peer,fd,ts); if(ms<0) return T('dv_first'); const h=Math.floor(ms/3600e3); return h<24?TF('dv_since_h',{n:Math.max(1,h)}):TF('dv_since_d',{n:Math.floor(h/24)}); }

function hpDvAt(ts,noAgo){ const d=new Date(Number(ts)), ag=hpAgo(ts), p=n=>String(n).padStart(2,'0'), y=(d.getFullYear()!==new Date().getFullYear())?d.getFullYear()+'/':''; return y+(d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes())+((noAgo||/\//.test(ag))?'':'（'+ag+'）'); }
function hpDvGap(ms){ const m=Math.floor(Math.max(0,ms)/60e3), h=Math.floor(m/60), d=Math.floor(h/24); return d>=2?TF('hs_d',{n:d}):h>=1?TF('hs_h',{n:h}):TF('hs_m',{n:Math.max(1,m)}); }
function hpDevInfo(peer,fd,ts){ const f=String(fd||'').toLowerCase(), o={add:0,rm:0,prev:0,last:0,first:0,n:0};
  try{ for(const x of histLoad(peer)){ if(!x||x.d!=='p'||String(x.fd||'').toLowerCase()!==f) continue; const t=Number(x.ts)||0; o.n++; if(t>o.last) o.last=t; if(!o.first||t<o.first) o.first=t; if(ts&&t<Number(ts)&&t>o.prev) o.prev=t; } }catch(e){}
  try{ const c=contacts().find(x=>x.address===peer); for(const ev of ((c&&Array.isArray(c.devEv))?c.devEv:[])){ if(!ev) continue; if(Array.isArray(ev.adds)&&ev.adds.indexOf(f)>=0&&ev.at>o.add) o.add=ev.at; if(Array.isArray(ev.rms)&&ev.rms.indexOf(f)>=0&&ev.at>o.rm) o.rm=ev.at; } }catch(e){}
  return o; }
function hpDevInfoText(peer,fd,ts){ const o=hpDevInfo(peer,fd,ts), k=(typeof hpDevKindFor==='function')?hpDevKindFor(peer,fd):'', who=nickOf(peer), out=[];
  out.push(k?TF('dvi_head_k',{who:who,kind:hpDevKindText(k)}):TF('dvi_head',{who:who}));
  if(o.rm&&o.rm>o.add) out.push(TF('dvi_rm',{t:hpDvAt(o.rm)}));
  if(o.add) out.push(TF('dvi_add',{t:hpDvAt(o.add)}));
  if(!o.n){ out.push(T('dvi_last_none')); }
  else { out.push(TF('dvi_last',{t:hpDvAt(o.last)})); out.push(o.n>1?TF('dvi_cnt',{n:o.n,t:hpDvAt(o.first,true)}):T('dvi_cnt1')); }
  if(ts&&o.n) out.push(o.prev?TF('dvi_gap',{t:hpDvGap(Number(ts)-o.prev)}):T('dvi_first'));
  return out.join('\n'); }

const HP_NEWDEV_MS=24*3600e3, HP_NEWDEV_SLACK=10*60e3;
function hpNewDevNote(peer,rec){ try{ if(!rec||rec.d!=='p'||!rec.fd) return ''; const f=String(rec.fd).toLowerCase(), t=Number(rec.ts)||0; if(!t) return '';
  for(const x of histLoad(peer)){ if(x&&x.d==='p'&&String(x.fd||'').toLowerCase()===f&&Number(x.ts)<t) return ''; }
  const c=contacts().find(x=>x.address===peer); let at=0; for(const ev of ((c&&Array.isArray(c.devEv))?c.devEv:[])){ if(ev&&Array.isArray(ev.adds)&&ev.adds.indexOf(f)>=0&&ev.at>at) at=ev.at; }
  if(!at) return ''; const rx=Number(rec.rx)||t; if(at>rx+HP_NEWDEV_SLACK||t-at>HP_NEWDEV_MS) return '';
  const who=nickOf(peer); return TF('dvi_newdev',{who:who,t:hpDvAt(at)}); }catch(e){ return ''; } }
function wireVoid(el,ts,kind){
  kind=kind||'self'; el.style.cursor='pointer'; el.title=T(kind==='self'?'tip_void':'tip_copy');
  let touchAt=0, lp=null; const open=()=>{ hpBubbleMenu(el,ts,kind); };
  el.onclick=()=>{ if(Date.now()-touchAt<1500&&!(kind==='self'&&el.classList&&el.classList.contains('void'))) return; open(); };
  el.addEventListener('touchstart',()=>{ touchAt=Date.now(); lp=setTimeout(()=>{ lp=null; open(); },500); },{passive:true});
  const cancelLp=()=>{ if(lp){ clearTimeout(lp); lp=null; } };
  el.addEventListener('touchend',cancelLp,{passive:true});
  el.addEventListener('touchmove',cancelLp,{passive:true});
  el.addEventListener('touchcancel',cancelLp,{passive:true});
}
