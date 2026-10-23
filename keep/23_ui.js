function TF(k,v){ let s=T(k); if(v){ for(const n of Object.keys(v)) s=s.split('{'+n+'}').join(String(v[n])); } return s; }
const HP_LANG_ORDER=['en','fr','de','pl','ja']  , HP_LANG_NAME={ja:'日本語',en:'English',fr:'Français',de:'Deutsch',pl:'Polski'};
function hpLangs(){ try{ return HP_LANG_ORDER.filter(l=>l==='ja'||l==='en'||!!(I18N&&I18N[l]&&typeof I18N[l]==='object')); }catch(e){ return ['ja','en']; } }
function curLang(){ const ls=(typeof hpLangs==='function')?hpLangs():['ja','en']; let v=''; try{ v=String(localStorage.getItem('p2p_lang')||''); }catch(e){} if(ls.indexOf(v)>=0) return v; try{ const n=(typeof navigator!=='undefined'&&navigator)?[].concat(navigator.languages||[],navigator.language||[]):[]; for(const t of n){ const q=String(t||'').toLowerCase().split(/[-_]/)[0]; if(ls.indexOf(q)>=0) return q; } }catch(e){} return 'en'; }
function T(k){ const L=curLang(), d=I18N[L]||I18N.ja; if(d[k]!==undefined) return d[k]; if(L!=='ja'&&I18N.en&&I18N.en[k]!==undefined) return I18N.en[k]; return I18N.ja[k]!==undefined?I18N.ja[k]:k; }
function hpLocale(){ try{ const L=curLang(); if(L==='ja') return 'ja-JP'; const n=(typeof navigator!=='undefined'&&navigator)?[].concat(navigator.languages||[],navigator.language||[]):[]; for(const t of n){ const m=/^([a-z]{2,3})[-_]([a-z]{2})$/i.exec(String(t||'')); if(m&&m[1].toLowerCase()===L) return L+'-'+m[2].toUpperCase(); } return ({en:'en-US',fr:'fr-FR',de:'de-DE',pl:'pl-PL'})[L]||'en-US'; }catch(e){ return 'ja-JP'; } }
function TL(k,v){ const L=(typeof curLang==='function')?curLang():'ja', d=(L!=='ja'&&I18N.en&&I18N.en[k]!==undefined)?I18N.en:I18N.ja; let s=(d[k]!==undefined)?d[k]:T(k);   if(v){ for(const n of Object.keys(v)) s=s.split('{'+n+'}').join(String(v[n])); } return s; }
function hpPar(s){ return ((typeof curLang==='function')?curLang():'ja')==='ja'?'（'+s+'）':' ('+s+')'; }
function hpSep(){ return ((typeof curLang==='function')?curLang():'ja')==='ja'?'・':', '; }
function hpPctS(){ return ((typeof curLang==='function')?curLang():'ja')==='ja'?'％':'%'; }
function hpDateIntl(ms,kind){ const L=((typeof curLang==='function')?curLang():'ja'); if(L==='ja'||L==='en'||typeof Intl==='undefined') return ''; const d=new Date(Number(ms)); if(!isFinite(d.getTime())) return ''; const O={md:{day:'numeric',month:'numeric'},ym:{year:'numeric',month:'numeric'},ymd:{year:'numeric',month:'2-digit',day:'2-digit'}}, o=O[String(kind).replace(/hm$/,'')]; if(!o) return ''; try{ return new Intl.DateTimeFormat((typeof hpLocale==='function')?hpLocale():L,/hm$/.test(kind)?Object.assign({hour:'2-digit',minute:'2-digit',hourCycle:'h23'},o):o).format(d); }catch(e){ return ''; } }
function hpQuo(s){ const L=((typeof curLang==='function')?curLang():'ja'), q=({ja:['\u300c','\u300d'],fr:['\u00ab\u00a0','\u00a0\u00bb'],de:['\u201e','\u201c'],pl:['\u201e','\u201d']})[L]||['\u201c','\u201d']; return q[0]+s+q[1]; }
function hpWordIs(s,k){ const L=((typeof curLang==='function')?curLang():'ja'), d=(typeof I18N!=='undefined'&&I18N[L])||{}, w=d[k]; if(L==='ja'||L==='en'||typeof w!=='string'||!w) return false; const n=x=>String(x==null?'':x).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''); return n(s)===n(w); }
let HP_LOG_KS=null;
function hpLogTr(m){ try{ if(typeof I18N_LOG==='undefined'||!I18N_LOG||((typeof curLang==='function')?curLang():'ja')==='ja') return m; if(!HP_LOG_KS) HP_LOG_KS=Object.keys(I18N_LOG).sort((a,b)=>b.length-a.length); let s=String(m); for(const k of HP_LOG_KS){ if(s.indexOf(k)>=0) s=s.split(k).join(I18N_LOG[k]); } return s.replace(/ {2,}/g,' ').replace(/ \)/g,')').replace(/\( /g,'('); }catch(e){ return m; } }
function setLang(l){ if(hpLangs().indexOf(l)<0) return; const was=curLang(); localStorage.setItem('p2p_lang', l); applyLang(); if(was!==l&&typeof location!=='undefined'&&location&&typeof location.reload==='function'){ try{ setTimeout(function(){ location.reload(); },60); }catch(e){} } }
function hpLangSel(){
  const s=(typeof document!=='undefined'&&document&&document.getElementById)?document.getElementById('lang-sel'):null; if(!s) return false; const ls=hpLangs();
  if(Array.from(s.options||[]).map(o=>o.value).join()!==ls.join()){ s.textContent=''; for(const l of ls){ const o=document.createElement('option'); o.value=l; o.textContent=HP_LANG_NAME[l]||l; s.appendChild(o); } }
  s.value=curLang(); return true; }
function applyLang(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){ el.textContent=T(el.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){ el.placeholder=T(el.getAttribute('data-i18n-ph')); });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el){ el.title=T(el.getAttribute('data-i18n-title')); });
  document.querySelectorAll('[data-i18n-first]').forEach(function(el){
    const k=el.getAttribute('data-i18n-first');
    for(const n of el.childNodes){ if(n.nodeType===3){ n.nodeValue=T(k); return; } }
    el.insertBefore(document.createTextNode(T(k)), el.firstChild);
  });
  try{ hpLangSel(); }catch(e){}
  try{ document.documentElement.lang=curLang(); }catch(e){}
  const ad=document.getElementById('addr'); if(ad){ ad.textContent=ID?hpIdShort(ID.address):T('no_id');   ad.title=T('addr_tip'); }
  const fnm=document.getElementById('id-file-name'); if(fnm && !fnm.dataset.file) fnm.textContent=T('no_file');
  try{ renderMyName(); renderContacts(); renderRequests(); renderDevMode(); renderDevices(); renderSiblings(); applyOrder(); const tt=document.getElementById('chat-title'); if(tt&&CURPEER)hpChatTitle(tt,CURPEER);   }catch(e){}

  ['hpVaultUi','hpPaperUi','hpStoreUi','hpKillUi','hpNotesUi','hpNoreadUi','hpInvDraw'].forEach(function(n){ try{ if(typeof globalThis[n]==='function') globalThis[n](); }catch(e){} });
  try{ if(typeof HP_LINK!=='undefined'&&HP_LINK&&typeof hpLinkUi==='function') hpLinkUi(); }catch(e){}
  if(typeof MODE!=='undefined'){ const st=document.getElementById('status'); if(st){ if(MODE==='idle')st.textContent=T('st_idle'); else if(MODE==='connected')st.textContent=nickOf(CURPEER)+' '+T('st_conn'); } }
  if(CURPEER && MODE!=='connected'){ try{ histRender(CURPEER); }catch(e){} }
}
function myName(){ return (ID && ID.myName) ? ID.myName : ''; }
function p2pOnboard(){

  try{
    var has = (typeof ID!=='undefined') && ID && ID.address;
    var box = document.getElementById('p2p-onboard');
    try{ if(document.body&&document.body.classList) document.body.classList.toggle('hp-noid',!has); }catch(e){}
    try{ var nr=document.querySelector('.name-edit-row'); if(nr) nr.style.display=has?'':'none'; var nk=document.getElementById('id-myname'); if(nk&&nk.parentNode) nk.parentNode.style.display=has?'':'none'; }catch(e){}
    var jc=document.getElementById('linkjoin-card'), W=(typeof window!=='undefined')?window:{};
    var home=function(){ try{ if(jc&&box&&jc.parentNode===box&&W.HP_ONB_JCHOME){ var H=W.HP_ONB_JCHOME; if(H.next&&H.next.parentNode===H.parent) H.parent.insertBefore(jc,H.next); else H.parent.appendChild(jc); } }catch(e){} };
    if(has){ home(); W.HP_ONB_STEP=''; if(box){ box.style.display='none'; if(box.dataset) box.dataset.step='-'; } return; }
    if(!box){ box=document.createElement('div'); box.id='p2p-onboard';
      box.style.cssText='margin:8px 14px 0;padding:14px 14px;border:1px solid var(--teal);border-radius:12px;background:#0f1830;font-size:14px;line-height:1.55';
      var m=document.querySelector('main'); if(m&&m.parentNode){ m.parentNode.insertBefore(box,m); }
    }
    var step=W.HP_ONB_STEP||''; if(typeof HP_JOIN!=='undefined'&&HP_JOIN) step='link';
    if(box.dataset&&box.dataset.step===step&&box.firstChild){ box.style.display='block'; return; }
    if(box.dataset) box.dataset.step=step;
    var stand=(typeof navigator!=='undefined'&&(navigator.standalone||(window.matchMedia&&window.matchMedia('(display-mode:standalone)').matches)));
    var keepName=(function(){ var o=document.getElementById('onb-name'); return o?o.value:''; })();
    if(jc&&jc.parentNode===box) box.removeChild(jc);
    box.innerHTML='';
    var el=function(tag,cls,txt,css){ var e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; if(css)e.style.cssText=css; return e; };
    var to=function(s){ return function(){ W.HP_ONB_STEP=s; p2pOnboard(); }; };
    var go=function(card,focus){ return function(){ try{ var t=document.querySelector('#t-id'); if(t)t.click(); var c=document.getElementById(card); if(c&&c.scrollIntoView) c.scrollIntoView({behavior:'smooth',block:'center'}); var f=document.getElementById(focus); if(f&&f.focus) f.focus(); }catch(e){} }; };
    var back=function(){ var b=el('button','b onb-back','\u2039 '+T('btn_onb_back')); b.id='onb-back'; b.onclick=function(){ try{ if(typeof HP_JOIN!=='undefined'&&HP_JOIN&&typeof hpLqFocusCancel==='function') hpLqFocusCancel(); }catch(e){} to('')(); }; return b; };
    if(step==='new'){
      box.appendChild(back()); box.appendChild(el('div','onb-h',T('onb_new_h')));
      box.appendChild(el('div','note',T('onb_new_note'),'margin:4px 0 10px'));
      var row=el('div','','',  'display:flex;gap:8px;flex-wrap:wrap');

      var nm=document.createElement('input'); nm.type='text'; nm.id='onb-name'; nm.maxLength=24; nm.placeholder=T('ph_onb_name'); nm.value=keepName; nm.style.cssText='flex:1 1 180px;min-width:140px'; nm.setAttribute('autocomplete','off'); row.appendChild(nm);
      var b1=el('button','b pri',T('onb_go')); b1.id='onb-new-go'; row.appendChild(b1);
      var ne=el('div','','','color:var(--amber);margin-top:4px'); ne.id='onb-err';
      var mk=function(){ var n=(nm.value||'').trim(); if(!n){ ne.textContent=T('onb_e_name'); nm.focus(); return; } ne.textContent=''; b1.disabled=true; generateIdentity(n).catch(function(e){ try{ log(e.message); }catch(x){} ne.textContent=(typeof hpErrShow==='function'?hpErrShow(e):e.message); b1.disabled=false; }); };
      b1.onclick=mk; nm.addEventListener('keydown',function(e){ if(e.key==='Enter') mk(); });
      box.appendChild(row); box.appendChild(ne); box.style.display='block'; try{ nm.focus(); }catch(e){} return;
    }
    if(step==='link'){
      box.appendChild(back());
      if(jc){ if(!W.HP_ONB_JCHOME&&jc.parentNode) W.HP_ONB_JCHOME={parent:jc.parentNode,next:jc.nextSibling}; box.appendChild(jc); jc.style.display=''; }
      else { box.appendChild(el('div','note',T('onb_link_sub'))); go('linkjoin-card','hp-join-text')(); }
      box.style.display='block'; return;
    }
    box.appendChild(el('div','onb-h',T('onb_title')));
    if(stand){ box.appendChild(el('div','',(typeof T==='function'?T('onb_standalone'):'(Home Screen app has its own storage, separate from Safari.)'),'color:var(--dim);margin-top:4px')); }
    var big=function(id,label,sub,fn){ var b=el('button','b onb-big'); b.id=id; b.appendChild(el('span','onb-big-l',label)); b.appendChild(el('span','onb-big-s',sub)); b.onclick=fn; box.appendChild(b); return b; };
    if(stand&&typeof hpIvjPasteAsk==='function'){ if(typeof HP_IVJ!=='undefined'&&HP_IVJ&&!HP_IVJ.bad) box.appendChild(el('div','',T('onb_invite_have'),'color:var(--teal);margin:6px 0')); else big('onb-invite',T('onb_invite'),T('onb_invite_sub'),function(){ hpIvjPasteAsk(); }); }
    big('onb-new',T('onb_new_btn'),T('onb_new_sub'),to('new'));
    big('onb-link',T('onb_link'),T('onb_link_sub'),function(){ to('link')(); });
    big('onb-restore',T('onb_restore'),T('onb_restore_sub'),function(){ try{ hpRestoreFlow(); }catch(e){ try{ log(e.message); }catch(x){} } });
    box.style.display='block';
  }catch(e){}
}
function hpRoleBadge(){
  const r=document.getElementById('me-role'); if(!r) return;
  let n=0; try{ n=(ID&&typeof hpDevRows==='function')?hpDevRows().length:0; }catch(e){ n=0; }
  const k=n>=2?((typeof hpIsMain==='function'&&hpIsMain())?'hd_main':'hd_linked'):''; r.textContent=k?T(k):''; r.style.display=k?'':'none';
}
function renderMyName(){ try{ p2pOnboard(); }catch(e){} try{ hpRoleBadge(); }catch(e){}
  const nm=myName();
  const ic=$('#me-icon'), idnm=$('#id-myname'), inp=$('#name-input');

  if(ic){
    const raw=(ID&&typeof ID.myIcon==='string')?ID.myIcon:'';
    const img=/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+\/=]+$/.test(raw)?raw:'';
    ic.textContent=img?'':(nm?Array.from(nm.trim())[0].toUpperCase():'?');
    ic.style.backgroundImage=img?'url("'+img+'")':'';
    ic.classList.toggle('img',!!img); ic.classList.toggle('unset',!nm&&!img);
    ic.title=nm||T('unset');
    ic.onclick=function(){ const t=document.querySelector('#t-id'); if(t)t.click(); };
  }
  if(idnm) idnm.textContent=nm?nm:'('+T('unset')+')';
  try{ const mn=$('#me-name'), mq=$('#me-qr');   if(mn){ mn.textContent=nm?nm:(ID?'('+T('unset')+')':''); mn.classList.toggle('unset',!nm); mn.title=T('tip_me_name'); mn.onclick=null;   } if(mq) mq.style.display=(ID&&ID.address)?'':'none'; const mc=$('#me-chip'); if(mc) mc.style.display=(ID&&ID.address)?'':'none';   if(mc&&!mc.dataset.hpWired){ mc.dataset.hpWired='1'; mc.onclick=hpMeToggle; mc.setAttribute('role','button'); mc.tabIndex=0; mc.onkeydown=e=>{ if(e&&(e.key==='Enter'||e.key===' ')){ try{ e.preventDefault(); }catch(_){} hpMeToggle(); } }; } if(mc) mc.title=T('tip_me_name');   }catch(e){}
  if(inp && document.activeElement!==inp) inp.value=nm;

  try{ document.title = nm ? ('Handpost — '+nm) : 'Handpost'; }catch(e){}
}
function setMyName(n){
  if(!ID){ alert(T('al_noid')); return; }
  n=(n||'').trim();
  ID.myName=n; ID.myNameAt=Date.now(); saveID(); renderMyName();
  log(TL('lg_setname',{name:(n||TL('lg_empty'))}));
}

let CONV_OPEN=false, CONV_TIMER=null;
let UNREAD_ADDR=null, UNREAD_AT=0;
function lastOpenKey(){ return 'p2p_lastopen_'+(ID?ID.address:''); }
function lastOpenLoad(){ try{ return JSON.parse(hpHGet(lastOpenKey())||'{}'); }catch(e){ return {}; } }
function lastOpenMark(addr){ try{ const o=lastOpenLoad(); o[addr]=Date.now(); hpHSet(lastOpenKey(),JSON.stringify(o)); }catch(e){}   try{ if(typeof sibSeen==='function') sibSeen(addr); }catch(e){} }
function convDirty(){ if(CONV_TIMER)return; CONV_TIMER=setTimeout(()=>{ CONV_TIMER=null; try{ renderConvList(); }catch(e){} try{ if(typeof hpHistNote==='function') hpHistNote(); }catch(e){}   },150); }
function convPreview(m){ if(!m)return T('conv_empty'); if(m.d==='v')return T('conv_void');   const t=(m.x?T('mk_void'):(m.img?T('conv_photo'):(m.file?T('conv_file')+' '+(m.file.name||''):String(m.t||'')))).replace(/\s+/g,' '); return (m.d==='s'?T('conv_you')+' ':'')+t; }
function renderConvList(){
  const el=document.getElementById('convlist'); if(!el)return; el.innerHTML='';
  if(!ID){ el.innerHTML='<div class="note">'+T('lg_needid')+'</div>'; return; }

  try{ if(typeof hpVaultOn==='function'&&!hpVaultOn()){

    const w=document.createElement('div'); w.id='hist-unsafe'; w.style.cssText='margin-bottom:8px';
    const nt=document.createElement('div'); nt.className='note'; nt.textContent=T('nt_hist_unsafe'); w.appendChild(nt);
    const go=document.createElement('button'); go.className='b'; go.id='btn-hist-protect'; go.style.marginTop='6px'; go.textContent=T('btn_hist_protect');
    go.onclick=()=>{ try{ if(typeof hpGoCard==='function'){ hpGoCard('vault-card'); return; } document.getElementById('t-id').click(); const c=document.getElementById('vault-card'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){} };
    w.appendChild(go); el.appendChild(w);
  } }catch(e){}
  const lo=lastOpenLoad(); const rows=[];
  for(const c of contacts()){ const h=histLoad(c.address); const last=h.length?h[h.length-1]:null; const un=h.filter(x=>x.d==='p'&&histOrd(x)>(lo[c.address]||0)), unread=un.length; rows.push({c,last,unread,ts:last?histOrd(last):0,  pv:unread?un[un.length-1]:last}); }
  rows.sort((a,b)=>(b.ts-a.ts)||String(a.c.nick||a.c.address).localeCompare(String(b.c.nick||b.c.address)));
  if(!rows.length){ const w=document.createElement('div'); w.className='note'; w.textContent=T('ct_empty'); el.appendChild(w); return; }
  for(const r of rows){
    const it=document.createElement('div'); it.className='conv-item';
    const av=document.createElement('div'); av.className='av'; av.textContent=String(r.c.nick||'?').slice(0,1).toUpperCase();
    const body=document.createElement('div'); body.className='body';
    const nm=document.createElement('div'); nm.className='name'; const n1=document.createElement('span'); n1.textContent=r.c.nick||hpIdShort(r.c.address);   nm.appendChild(n1);
    if(r.last){ const tm=document.createElement('time'); tm.textContent=fmtTS(r.last.ts); nm.appendChild(tm); }
    const pv=document.createElement('div'); pv.className='prev'; { const dd=(typeof hpDeadPeer==='function')&&hpDeadPeer(r.c.address), bb=(typeof hpBlkOn==='function')&&hpBlkOn(r.c.address); pv.textContent=(dd?T('conv_dead')+' ':bb?T('conv_blocked')+' ':'')+convPreview(r.pv); }
    body.appendChild(nm); body.appendChild(pv); it.appendChild(av); it.appendChild(body);
    if(r.unread){ const ub=document.createElement('span'); ub.className='unread'; ub.textContent=String(r.unread); it.appendChild(ub); }
    it.onclick=()=>openConversation(r.c.address);
    el.appendChild(it);
  }
}

function hpChatTitle(tt,addr){ tt.textContent=nickOf(addr); if(typeof hpDeadPeer==='function'&&hpDeadPeer(addr)){ const s=document.createElement('span'); s.id='chat-dead'; s.textContent=' \u26a0 '+T('mk_dead'); s.style.cssText='font-size:11px;font-weight:400;margin-left:6px;color:var(--red)'; tt.appendChild(s); return; }   if(typeof hpVerified==='function'&&hpVerified(addr)){ const s=document.createElement('span'); s.id='chat-vfy'; s.textContent=' \u2713 '+T('mk_verified'); s.style.cssText='font-size:11px;font-weight:400;margin-left:6px;color:var(--teal)'; tt.appendChild(s); } }
function openConversation(addr,keepLine){
  if(!addr)return;

  const pi=$('#peer'); if(pi)pi.value=addr; const ps=$('#peer-sel'); if(ps){ try{ ps.value=addr; }catch(e){} }
  UNREAD_ADDR=addr; UNREAD_AT=(lastOpenLoad()[addr]||0); CURPEER=addr; histRender(addr); lastOpenMark(addr);
  const tt=$('#chat-title'); if(tt)hpChatTitle(tt,addr);
  try{ if(typeof rtcUi==='function') rtcUi(); }catch(e){}
  if(!CONV_OPEN){ try{ history.pushState({p2pconv:1},''); }catch(e){} }   CONV_OPEN=true; const sec=$('#p-chat'); if(sec)sec.classList.remove('list-mode');
  if(sec&&!sec.classList.contains('on')){ const tab=document.querySelector('#t-chat'); if(tab)tab.click(); }
  scrollNew();
}
function showConvList(){ CONV_OPEN=false; const sec=$('#p-chat'); if(sec)sec.classList.add('list-mode'); renderConvList(); try{ if(typeof hpCsRefresh==='function') hpCsRefresh(); }catch(e){}   }

var HP_SR_HOLD=0, HP_SR_EL=null; const HP_SR_MAX=100;
function hpSrNorm(s){ s=String(s==null?'':s); try{ s=s.normalize('NFKC'); }catch(e){} return s.toLowerCase(); }
function hpSearch(q){
  const k=hpSrNorm(q).trim(), out={people:[],letters:[],more:0}; if(!k) return out;
  for(const c of contacts()){
    if((typeof HP_SR_PEER!=='undefined'&&HP_SR_PEER)&&c.address!==HP_SR_PEER) continue;
    const nm=nickOf(c.address), cn=(typeof hpCardNameOf==='function'&&c.card)?hpCardNameOf(c.card):'';
    if(hpSrNorm(nm).includes(k)||(cn&&hpSrNorm(cn).includes(k))||(k.length>=5&&String(c.address).toLowerCase().startsWith(k))) out.people.push({addr:c.address,name:nm});
    for(const m of histLoad(c.address)){
      if(!m||m.d==='v'||m.x) continue;
      const t=(typeof m.t==='string'&&m.t)?m.t:((m.file&&m.file.name)?String(m.file.name):'');
      if(!t||!hpSrNorm(t).includes(k)) continue;
      out.letters.push({addr:c.address,name:nm,ts:m.ts,d:m.d,t:t,o:histOrd(m),pt:(m.d==='s'&&typeof hpPostTs==='function')?hpPostTs(m):(Number(m.rx)||Number(m.ts)||0)});
    }
  }
  if(typeof HP_SR_PEER!=='undefined'&&HP_SR_PEER) out.people=[];
  out.letters.sort((a,b)=>b.o-a.o); if(out.letters.length>HP_SR_MAX){ out.more=out.letters.length-HP_SR_MAX; out.letters=out.letters.slice(0,HP_SR_MAX); }
  return out;
}

function hpSrMarkInto(el,text,q,wide){
  const t=String(text||''), n=hpSrNorm(t), k=hpSrNorm(q).trim(); let i=k?n.indexOf(k):-1;
  if(n.length!==t.length) i=-1;
  let a=0, b=t.length; if(wide&&t.length>wide){ a=i>16?i-16:0; b=Math.min(t.length,a+wide); }
  const add=s=>{ if(s) el.appendChild(document.createTextNode(s)); };
  add(a>0?'…':''); if(i<0||i<a||i+k.length>b){ add(t.slice(a,b)); } else { add(t.slice(a,i)); const mk=document.createElement('mark'); mk.textContent=t.slice(i,i+k.length); el.appendChild(mk); add(t.slice(i+k.length,b)); } add(b<t.length?'…':'');
  return el;
}
function hpSrRender(){
  const box=document.getElementById('sr-res'), inp=document.getElementById('sr-q'); if(!box||!inp) return null; box.textContent='';
  const note=s=>{ const d=document.createElement('div'); d.className='note'; d.textContent=s; box.appendChild(d); }, head=s=>{ const d=document.createElement('div'); d.className='sr-h'; d.textContent=s; box.appendChild(d); };
  const q=inp.value; if(!hpSrNorm(q).trim()){ note(T((typeof HP_SR_PEER!=='undefined'&&HP_SR_PEER)?'sr_hint_one':'sr_hint')); return null; }
  const r=hpSearch(q);
  if(!r.people.length&&!r.letters.length){ note(T('sr_none')); note(T('sr_scope')); return r; }
  if(r.people.length){ head(T('sr_people')+'  '+r.people.length); for(const p of r.people){ const it=document.createElement('div'); it.className='sr-it'; const nm=document.createElement('div'); nm.className='nm'; hpSrMarkInto(nm,p.name,q); it.appendChild(nm); it.onclick=()=>{ hpSrClose(); openConversation(p.addr); }; box.appendChild(it); } }
  if(r.letters.length){ head(T('sr_letters')+'  '+(r.letters.length+r.more)); for(const l of r.letters){ const it=document.createElement('div'); it.className='sr-it'; const tm=document.createElement('span'); tm.className='tm'; tm.textContent=hpSrWhen(l.pt); it.appendChild(tm); const nm=document.createElement('div'); nm.className='nm'; nm.textContent=TF(l.d==='s'?'sr_to':'sr_from',{name:l.name}); it.appendChild(nm); const tx=document.createElement('div'); tx.className='tx'; hpSrMarkInto(tx,l.t,q,60); it.appendChild(tx); it.onclick=()=>hpSrJump(l.addr,l.ts); box.appendChild(it); } }
  if(r.more) note(TF('sr_more',{n:r.more}));
  note(T('sr_scope'));
  return r;
}
function hpSrOpen(peer){ HP_SR_PEER=peer||null; try{ hpSrScopeUi(); }catch(e){}   try{ menuClose(); }catch(e){} const w=document.getElementById('hp-search'), q=document.getElementById('sr-q'); if(!w) return; w.classList.add('on'); hpSrRender(); if(q){ try{ q.focus(); if(q.select) q.select(); }catch(e){} } }
function hpSrClose(){ const w=document.getElementById('hp-search'), q=document.getElementById('sr-q'); if(w) w.classList.remove('on'); if(q){ try{ q.blur(); }catch(e){} } }

function hpSrJump(addr,ts){
  hpSrClose(); openConversation(addr);
  setTimeout(()=>{ const el=findMsgEl(ts); if(!el) return false; HP_SR_EL=el; HP_SR_HOLD=Date.now()+4000;
    try{ const m=document.getElementById('msgs'), clr=()=>{ HP_SR_HOLD=0; }; if(m&&m.addEventListener){ m.addEventListener('wheel',clr,{once:true,passive:true}); m.addEventListener('touchstart',clr,{once:true,passive:true}); } }catch(e){}
    try{ el.scrollIntoView({block:'center'}); }catch(e){} el.classList.add('hp-hit'); setTimeout(()=>{ try{ el.classList.remove('hp-hit'); }catch(e){} },2400); return true; },60);
}

var HP_SR_PEER=null;
function hpSrWhen(t){ const d=new Date(Number(t)||0); if(!(d.getTime()>0)) return ''; const L=(typeof curLang==='function')?curLang():'ja', ja=L==='ja', p=n=>String(n).padStart(2,'0'), md=(d.getMonth()+1)+'/'+d.getDate(), hm=p(d.getHours())+':'+p(d.getMinutes()); if(!ja&&L!=='en'){ try{ return new Intl.DateTimeFormat((typeof hpLocale==='function')?hpLocale():L,{weekday:'short',day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d); }catch(e){} }   return ja?(md+'（'+'日月火水木金土'[d.getDay()]+'） '+hm):(['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]+' '+md+' '+hm); }
function hpSrScopeUi(){
  const E=id=>document.getElementById(id), s=E('sr-scope'), one=(typeof HP_SR_PEER!=='undefined'&&HP_SR_PEER);
  if(s) s.style.display=one?'flex':'none';
  if(E('sr-who')) E('sr-who').textContent=one?TF('sr_only',{name:nickOf(one)}):'';
  if(E('sr-date')) E('sr-date').value='';
  if(E('sr-q')) E('sr-q').placeholder=T(one?'ph_search_one':'ph_search');
}

function hpSrDatePick(v){
  const one=(typeof HP_SR_PEER!=='undefined'&&HP_SR_PEER), m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v||'')); if(!one||!m) return null;
  const t0=new Date(Number(m[1]),Number(m[2])-1,Number(m[3])).getTime(); let best=null, bo=Infinity;
  for(const x of histLoad(one)){ if(!x||x.x||(x.d!=='s'&&x.d!=='p')) continue; const o=histOrd(x); if(o>=t0&&o<bo){ bo=o; best=x.ts; } }
  return best;
}
function hpSrDateGo(v){ const one=HP_SR_PEER, ts=hpSrDatePick(v); if(ts!=null){ hpSrJump(one,ts); return true; } const box=document.getElementById('sr-res'); if(box){ box.textContent=''; const d=document.createElement('div'); d.className='note'; d.textContent=T('sr_date_none'); box.appendChild(d); } return false; }
try{ if(typeof document!=='undefined'&&document&&typeof document.getElementById==='function'){
  const b=document.getElementById('btn-conv-sr'); if(b) b.onclick=()=>{ if(CURPEER) hpSrOpen(CURPEER); };
  const a=document.getElementById('sr-all'); if(a) a.onclick=()=>{ HP_SR_PEER=null; hpSrScopeUi(); hpSrRender(); };
  const dt=document.getElementById('sr-date'); if(dt) dt.onchange=()=>{ if(dt.value) hpSrDateGo(dt.value); };
} }catch(e){}

var HP_SCAL_YM=null;
function hpScalKey(t){ const d=new Date(Number(t)||0), p=n=>String(n).padStart(2,'0'); return d.getFullYear()+'-'+p(d.getMonth()+1)+'-'+p(d.getDate()); }
function hpScalDays(peer){ const m={}; if(!peer) return m; for(const x of histLoad(peer)){ if(!x||x.x||(x.d!=='s'&&x.d!=='p')) continue; const o=histOrd(x); if(!(o>0)) continue; const k=hpScalKey(o); m[k]=(m[k]||0)+1; } return m; }
function hpScalShift(ym,n){ const d=new Date(Number(ym.slice(0,4)),Number(ym.slice(5,7))-1+n,1); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }

function hpScalModel(peer,ym,now){
  const days=hpScalDays(peer), ks=Object.keys(days).sort(); if(!ks.length) return null;
  const lo=ks[0].slice(0,7), hi=ks[ks.length-1].slice(0,7); if(!ym||ym<lo||ym>hi) ym=hi;
  const y=Number(ym.slice(0,4)), mo=Number(ym.slice(5,7)), first=new Date(y,mo-1,1).getDay(), n=new Date(y,mo,0).getDate(), today=hpScalKey(now||Date.now()), cells=[];
  for(let i=0;i<first;i++) cells.push(null);
  for(let d=1;d<=n;d++){ const k=ym+'-'+String(d).padStart(2,'0'); cells.push({ d, k, n:days[k]||0, today:k===today }); }
  return { ym, y, m:mo, prev:ym>lo, next:ym<hi, cells };
}
function hpScalDraw(){
  const box=document.getElementById('sr-cal'), one=(typeof HP_SR_PEER!=='undefined'&&HP_SR_PEER); if(!box) return; box.textContent='';
  if(!one){ box.style.display='none'; return; }
  const M=hpScalModel(one,HP_SCAL_YM), mk=(t,c,x)=>{ const e=document.createElement(t); if(c) e.className=c; if(x!=null) e.textContent=x; return e; };
  if(!M){ box.appendChild(mk('div','note',T('sr_cal_none'))); return; }
  HP_SCAL_YM=M.ym;
  const hd=mk('div','sc-hd'), pv=mk('button','sc-nv','\u2039'), nx=mk('button','sc-nv','\u203a');
  pv.type='button'; nx.type='button'; pv.disabled=!M.prev; nx.disabled=!M.next;
  pv.onclick=()=>{ HP_SCAL_YM=hpScalShift(M.ym,-1); hpScalDraw(); }; nx.onclick=()=>{ HP_SCAL_YM=hpScalShift(M.ym,1); hpScalDraw(); };
  hd.appendChild(pv); hd.appendChild(mk('span','sc-ttl',TF('sr_cal_ym',{y:M.y,m:M.m}))); hd.appendChild(nx); box.appendChild(hd);
  const gr=mk('div','sc-gr'), wd=String(T('sr_cal_wd'));
  for(let i=0;i<7;i++) gr.appendChild(mk('span','sc-wd'+(i===0?' sun':(i===6?' sat':'')),wd.charAt(i)));
  for(const c of M.cells){
    if(!c){ gr.appendChild(mk('span','sc-x')); continue; }
    if(!c.n){ gr.appendChild(mk('span','sc-d'+(c.today?' today':''),String(c.d))); continue; }
    const b=mk('button','sc-d on'+(c.today?' today':'')); b.type='button'; b.title=TF('sr_cal_n',{n:c.n});
    b.appendChild(mk('span','sc-n',String(c.d))); b.appendChild(mk('span','sc-c',String(c.n)));
    b.onclick=()=>{ box.style.display='none'; hpSrDateGo(c.k); }; gr.appendChild(b);
  }
  box.appendChild(gr);
}
function hpScalToggle(){ const box=document.getElementById('sr-cal'); if(!box) return false; if(box.style.display==='block'){ box.style.display='none'; return false; } box.style.display='block'; hpScalDraw(); return true; }
hpSrScopeUi=(function(f){ return function(){ const r=f.apply(this,arguments); try{ HP_SCAL_YM=null; const c=document.getElementById('sr-cal'); if(c){ c.style.display='none'; c.textContent=''; } }catch(e){} return r; }; })(hpSrScopeUi);
try{ if(typeof document!=='undefined'&&document&&typeof document.getElementById==='function'){ const cb=document.getElementById('sr-dbtn'); if(cb) cb.onclick=hpScalToggle; } }catch(e){}

function menuToggle(){ const n=document.querySelector('nav'); if(n)n.classList.toggle('open'); }
function menuClose(){ const n=document.querySelector('nav'); if(n)n.classList.remove('open'); }
var HP_ID_BACK='t-chat';
function hpMeToggle(){ try{ const id=document.getElementById('t-id'); if(!id) return; if(id.classList.contains('on')){ const b=document.getElementById(HP_ID_BACK)||document.getElementById('t-chat'); if(b) b.click(); } else id.click(); }catch(e){} }
function homeToggle(show){ const b=document.getElementById('btn-home'); if(b)b.style.display=show?'inline-block':'none'; try{ if(typeof hpCsFit==='function') hpCsFit(); }catch(e){} }
function menuBadge(){ const b=document.getElementById('menu-badge'); if(!b)return; const n=(REQUESTS?REQUESTS.length:0)+((typeof hpNtBadge==='function')?hpNtBadge():0);         if(n>0){ b.textContent=String(n); b.style.display='block'; } else { b.style.display='none'; } }
function renderContacts(){
  try{ if(typeof hpStoreUi==='function') hpStoreUi(); }catch(e){}
  try{ if(typeof hpKillUi==='function') hpKillUi(); }catch(e){}
  const list=$('#contact-list'); if(!list)return; list.innerHTML='';
  const cs=contacts();
  if(cs.length===0){ list.innerHTML='<div class="note">'+T('ct_empty')+'</div>'; }
  for(const c of cs){
    const row=document.createElement('div'); row.className='contact-item';
    const nm=document.createElement('div'); nm.className='nm';
    const b=document.createElement('b'); b.textContent=c.nick||T('no_nick');
    const s=document.createElement('span'); s.textContent=T('ct_addr')+' '+hpIdShort(c.address); s.title=c.address;   nm.appendChild(b); nm.appendChild(s);
    { const k=document.createElement('span'); k.textContent=' '+(c.card?'\u2709 '+T('mk_card'):T('mk_nocard')); k.style.cssText='font-size:11px;margin-left:6px;color:'+(c.card?'var(--teal)':'var(--amber)'); if(typeof hpInvPendOf==='function'&&hpInvPendOf(c.address)){ k.textContent=' '+T('mk_invpend'); k.style.color='var(--amber)'; }   else if(typeof hpIvWaitOf==='function'&&hpIvWaitOf(c.address)){ k.textContent=' '+T('mk_ivwait'); k.style.color='var(--amber)'; }   nm.appendChild(k); }
    if(c.card&&Array.isArray(c.card.devices)&&typeof hpDevMarksInto==='function'){ try{ const dv=document.createElement('div'); dv.className='dvs'; hpDevMarksInto(dv,c.card.devices,c.address,{kindText:true}); if(dv.childNodes&&dv.childNodes.length) nm.appendChild(dv); }catch(e){} }
    const callb=document.createElement('button'); callb.className='call'; callb.textContent=T('btn_connect');
    callb.onclick=()=>{ openConversation(c.address); };
    const hisn=(()=>{ try{ return histLoad(c.address).length; }catch(e){ return 0; } })(); const hisb=hisn?document.createElement('button'):null; if(hisb) hisb.textContent=TF('btn_clearhist',{n:hisn});
    if(hisb) hisb.onclick=async()=>{ const h=histLoad(c.address); if(h.length===0){ alert(T('al_nohist')); return; }
      if(await hpAsk({text:TF('cf_clearhist',{who:c.nick||hpIdShort(c.address),n:h.length}), danger:true, ok:T('btn_ask_del')})){   histClear(c.address); if(CURPEER===c.address)$('#msgs').innerHTML=''; log('\u5c65\u6b74\u3092\u524a\u9664: '+c.address); } };
    const renb=document.createElement('button'); renb.textContent=T('btn_rename');
    renb.onclick=()=>{ const n=prompt(T('pr_nick'), c.nick||''); if(n===null)return; c.nick=n.trim(); c.mt=Date.now(); saveID(); renderContacts(); };
    const isb=(typeof hpBlkOn==='function')&&hpBlkOn(c.address);
    const isd=(typeof hpDeadPeer==='function')&&hpDeadPeer(c.address); if(isd){ const dm=document.createElement('span'); dm.className='dead'; dm.textContent=' \u26a0 '+T('mk_dead'); dm.style.cssText='font-size:11px;margin-left:6px;color:var(--red)'; nm.appendChild(dm); }
    if(!isd&&typeof hpVerified==='function'&&hpVerified(c.address)){ const vk=document.createElement('span'); vk.className='vfy'; vk.textContent=' \u2713 '+T('mk_verified'); vk.style.cssText='font-size:11px;margin-left:6px;color:var(--teal)'; nm.appendChild(vk); }
    if(isb){ const bm=document.createElement('span'); bm.textContent=' \u26d4 '+T('mk_blocked'); bm.style.cssText='font-size:11px;margin-left:6px;color:var(--red)'; nm.appendChild(bm); }
    const blkb=document.createElement('button'); blkb.textContent=T(isb?'btn_unblock':'btn_block');
    blkb.onclick=async()=>{ if(!isb&&!(await hpAsk({text:TF('cf_block',{who:c.nick||hpIdShort(c.address)}), danger:true, ok:T('btn_block')})))return; hpBlockSet(c.address,isb?0:1); };
    const delb=document.createElement('button'); delb.className='del'; delb.textContent=T('btn_del');
    delb.onclick=async()=>{ const who=c.nick||hpIdShort(c.address); if(!(await hpAsk({text:TF('cf_del',{who:who}), danger:true, ok:T('btn_del')})))return; const hn=histLoad(c.address).length; const purge=hn>0?(await hpAsk({text:TF('cf_del_hist2',{who:who,n:hn}), ok:T('btn_del_hist_yes'), cancel:T('btn_del_hist_no')})):false; removeContact(c.address,purge); };
    const safeb=document.createElement('button'); safeb.textContent=T('btn_safety');
    safeb.onclick=()=>{ hpSafetyOpen(c.address); };
    if(sameNickOther(c.nick,c.address)){ const warn=document.createElement('span'); warn.textContent=' \u26a0 '+T('dup_nick'); warn.style.cssText='color:var(--red);font-size:11px'; b.appendChild(warn); }
      row.appendChild(nm); { const more=document.createElement('button'); more.className='more'; more.type='button'; more.textContent='\u2026'; more.setAttribute('aria-label',T('btn_ct_more')); const mn=document.createElement('div'); mn.className='cmenu'; for(const x of [renb,safeb,hisb,blkb,delb]){ if(!x) continue; const f=x.onclick; x.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} mn.classList.remove('on'); return f&&f(ev); }; mn.appendChild(x); } more.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} const on=!mn.classList.contains('on'); for(const o of list.querySelectorAll('.cmenu.on')) o.classList.remove('on'); if(on) mn.classList.add('on'); }; row.appendChild(more); row.appendChild(mn); row.onclick=ev=>{ try{ if(ev&&ev.target&&ev.target.closest&&ev.target.closest('.cmenu,.more')) return; }catch(e){} openConversation(c.address); }; } list.appendChild(row);
  }
  try{ if(typeof window!=='undefined'&&!window.HP_CMENU_WIRED&&document.addEventListener){ window.HP_CMENU_WIRED=1; document.addEventListener('click',()=>{ for(const o of document.querySelectorAll('#contact-list .cmenu.on')) o.classList.remove('on'); }); } }catch(e){}
  const sel=$('#peer-sel'); if(sel){ sel.innerHTML=''; const o0=document.createElement('option'); o0.value=''; o0.textContent=T('sel_peer'); sel.appendChild(o0); for(const c of cs){ const o=document.createElement('option'); o.value=c.address; o.textContent=c.nick||hpIdShort(c.address);   sel.appendChild(o);} }
  try{ p2pRenderOrphans(list); }catch(e){} convDirty();
}

function renderRequests(){
  try{ if(typeof hpReqSave==='function')hpReqSave(); }catch(e){}
  const list=$('#req-list'); if(!list)return; list.innerHTML='';
  if(REQUESTS.length===0){ list.innerHTML='<div class="note">'+T('req_empty')+'</div>'; }
  REQUESTS.forEach((r,idx)=>{
    const box=document.createElement('div'); box.className='req-item';
    const who=document.createElement('div'); who.className='who'; who.textContent=r.hp?((r.name?r.name+' \u00b7 ':'')+hpIdShort(r.from)):r.from;
    const prev=document.createElement('div'); prev.className='prev'; prev.textContent=r.knock?T('req_knock'):(r.text||(r.inv?T('req_inv'):''));
    let tg=null; { const bad=!!(r.inv&&typeof r.inv==='object'&&r.inv.ok===0); if(bad||(r.inv&&r.text)){ tg=document.createElement('div'); tg.className='note'; tg.textContent=T(bad?'req_inv_bad':'req_inv_tag'); if(bad) tg.style.color='var(--amber)'; } }
    const acts=document.createElement('div'); acts.className='acts';
    const ok=document.createElement('button'); ok.className='ok'; ok.textContent=T('btn_approve');
    ok.onclick=async()=>{ const nick=prompt(T('pr_nick_req'),(r.name||'')); if(nick===null)return; if(r.hp){ const nk=nick.trim(), nok=await hpNickOk(r.from,nk); if(!nok) return;   if(hpApprove(r,nk,true)){ REQUESTS=REQUESTS.filter(x=>x!==r); renderRequests(); updateBadges(); } return; }   REQUESTS=REQUESTS.filter(x=>x!==r); renderRequests(); updateBadges();   };
    const no=document.createElement('button'); no.className='no'; no.textContent=T('btn_reject');
    no.onclick=()=>{ REQUESTS=REQUESTS.filter((_,i)=>i!==idx); renderRequests(); updateBadges(); };
    acts.appendChild(ok); acts.appendChild(no);
    if(r.hp&&typeof hpBlockSet==='function'){ const bk=document.createElement('button'); bk.className='no'; bk.textContent=T('btn_block'); bk.onclick=async()=>{ if(!(await hpAsk({text:TF('cf_block',{who:r.name||hpIdShort(r.from)}), danger:true, ok:T('btn_block')})))return;   hpBlockSet(r.from,1); REQUESTS=REQUESTS.filter(x=>x!==r); renderRequests(); updateBadges(); }; acts.appendChild(bk); }
    box.appendChild(who); box.appendChild(prev); if(tg) box.appendChild(tg); { const da=(r.hp&&typeof hpHoSameDead==='function')?hpHoSameDead(r.name):null, lk=(!da&&typeof hpReqLook==='function')?hpReqLook(r):null;   if(da||lk){ if(da){ const sd=document.createElement('div'); sd.className='note hp-same-dead'; sd.style.color='var(--amber)'; sd.textContent=TF('req_same_dead',{who:nickOf(da)}); box.appendChild(sd); } else { const sl=document.createElement('div'); sl.className='note hp-same-live'; sl.style.color='var(--red)'; sl.style.fontWeight='600'; sl.textContent=TF(lk.k==='same'?'req_same_live':'req_like_live',{who:nickOf(lk.addr)}); box.appendChild(sl); box.style.borderColor='var(--red)'; }   const nm=String(r.name||'').trim().toLowerCase(), sameN=REQUESTS.filter(x=>x.hp&&String(x.name||'').trim().toLowerCase()===nm).length; if(sameN>1){ const s2=document.createElement('div'); s2.className='note hp-same-dup'; s2.style.color='var(--amber)'; s2.textContent=TF('req_same_dup',{n:sameN}); box.appendChild(s2); } if(typeof hpSafetyOpen==='function'){ const sf=document.createElement('button'); sf.className='ok'; sf.textContent=T('btn_req_sf'); sf.onclick=()=>{ r.sfSeen=Date.now(); try{ hpReqSave(); }catch(e){} ok.disabled=false; const s3=box.querySelector('.hp-sf-first'); if(s3) s3.remove(); hpSafetyOpen(r.from); }; acts.insertBefore(sf,ok); if(!r.sfSeen){ ok.disabled=true; const s3=document.createElement('div'); s3.className='note hp-sf-first'; s3.textContent=T('req_sf_first'); box.appendChild(s3); } } } }   box.appendChild(acts); list.appendChild(box);
  });
  updateBadges();
}

const HP_SKEL_MAP={'0':'o','1':'l','3':'e','5':'s','@':'a','$':'s','|':'l','!':'l','i':'l',
  '\u0430':'a','\u0435':'e','\u043e':'o','\u0440':'p','\u0441':'c','\u0443':'y','\u0445':'x','\u0456':'l','\u0458':'j','\u0455':'s','\u04cf':'l','\u0501':'d','\u043a':'k','\u043d':'h','\u0442':'t','\u0432':'b','\u043c':'m',
  '\u03bf':'o','\u03b1':'a','\u03b5':'e','\u03b9':'l','\u03ba':'k','\u03bd':'v','\u03c1':'p','\u03c4':'t','\u03c5':'u','\u03c7':'x'};
function hpNameSkel(s){
  let t=String(s||''); try{ t=t.normalize('NFKC'); }catch(e){} t=t.toLowerCase();
  t=t.replace(/[\u3041-\u3096]/g,ch=>String.fromCharCode(ch.charCodeAt(0)+0x60));
  t=t.replace(/[\s._\-\u30fb\u00b7'"`()\[\]{}\u3000\u3001\u3002\uff08\uff09\u3010\u3011~\u301c]/g,'');
  t=t.replace(/rn/g,'m').replace(/vv/g,'w');
  let o=''; for(const ch of t) o+=(HP_SKEL_MAP[ch]||ch); return o;
}
function hpNameD1(a,b){
  const A=Array.from(a), B=Array.from(b); if(Math.abs(A.length-B.length)>1) return false;
  if(A.length===B.length){ const df=[]; for(let k=0;k<A.length;k++) if(A[k]!==B[k]) df.push(k); return df.length===1||(df.length===2&&df[1]===df[0]+1&&A[df[0]]===B[df[1]]&&A[df[1]]===B[df[0]]); }
  const L=A.length>B.length?A:B, S=A.length>B.length?B:A; let k=0; while(k<S.length&&L[k]===S[k]) k++;
  return L.slice(k+1).join('')===S.slice(k).join('');
}
function hpNameLike(a,b){
  const la=String(a||'').trim().toLowerCase(), lb=String(b||'').trim().toLowerCase(); if(!la||!lb) return null;
  if(la===lb) return 'same';
  const sa=hpNameSkel(a), sb=hpNameSkel(b); if(!sa||!sb) return null;
  if(sa===sb) return 'like';
  const s=sa.length<=sb.length?sa:sb, l=sa.length<=sb.length?sb:sa, n=Array.from(s).length;
  if(n>=3&&(l.startsWith(s)||l.endsWith(s))) return 'like';
  if(n>=4&&hpNameD1(sa,sb)) return 'like';
  return null;
}
function hpReqLook(r){
  try{
    if(!r||!r.hp||!ID) return null;
    const names=[r.name, r.card&&r.card.name].filter(x=>typeof x==='string'&&x.trim()); if(!names.length) return null;
    const dead=(ID.dead&&typeof ID.dead==='object')?ID.dead:{}; let like=null;
    for(const c of (ID.contacts||[])){ if(!c||c.address===r.from||dead[c.address]) continue;
      for(const cn of [c.nick, c.card&&c.card.name]){ if(typeof cn!=='string') continue;
        for(const rn of names){ const k=hpNameLike(rn,cn); if(k==='same') return {k:'same',addr:c.address}; if(k&&!like) like={k:'like',addr:c.address}; } } }
    return like;
  }catch(e){ return null; }
}
function updateBadges(){ try{ if(typeof p2pOnboard==='function')p2pOnboard(); }catch(e){} menuBadge();
  const rb=$('#rq-badge'); if(rb){ if(REQUESTS.length>0 && !$('#p-req').classList.contains('on')){ rb.textContent=REQUESTS.length; rb.style.display='block'; } else rb.style.display='none'; }
  hpReqPlace();
}

function hpReqPlace(){
  try{
    const n=(typeof REQUESTS!=='undefined'&&Array.isArray(REQUESTS))?REQUESTS.length:0, g=id=>document.getElementById(id);
    const band=g('req-band'); if(band){ band.textContent=TF('req_band',{n:n}); band.style.display=n>0?'block':'none'; }
    const ent=g('req-entry'); if(ent){ ent.textContent=TF('req_entry',{n:n}); if(ent.classList) ent.classList.toggle('has',n>0); }
    const cb=g('ct-badge'), pr=g('p-req'); if(cb){ if(n>0&&!(pr&&pr.classList&&pr.classList.contains('on'))){ cb.textContent=String(n); cb.style.display='block'; } else cb.style.display='none'; }
    return n;
  }catch(e){ return -1; }
}
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

