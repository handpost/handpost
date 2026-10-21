const TABS={'t-chat':'p-chat','t-contacts':'p-contacts','t-req':'p-req','t-post':'p-post','t-id':'p-id','t-sec':'p-sec','t-set':'p-set','t-log':'p-log'};
function hpGoCard(id,how){
  try{ const c=document.getElementById(id); let t='t-id'; if(c){ for(const k of Object.keys(TABS)){ const s=document.getElementById(TABS[k]); if(s&&s.contains&&s.contains(c)){ t=k; break; } } }
    const b=document.getElementById(t); if(b) b.click(); if(c&&c.scrollIntoView) c.scrollIntoView(how||{block:'center'}); return t; }catch(e){ return ''; } }
for(const [t,p] of Object.entries(TABS)){
  $('#'+t).onclick=()=>{
    try{ const pv=document.querySelector('nav button.on'); if(t==='t-id'&&pv&&pv.id&&pv.id!=='t-id'&&typeof HP_ID_BACK!=='undefined') HP_ID_BACK=pv.id; }catch(e){}
    document.querySelectorAll('nav button').forEach(b=>b.classList.remove('on'));
    document.querySelectorAll('main section').forEach(s=>s.classList.remove('on'));
    $('#'+t).classList.add('on');$('#'+p).classList.add('on');
    if(t==='t-req'){$('#rq-badge').style.display='none'; try{ $('#t-contacts').classList.add('on'); }catch(e){}   }
    if(t==='t-contacts'){ drawMyQR(); renderContacts(); try{ if(typeof hpInvTick==='function') hpInvTick(); }catch(e){}   }
    if(t==='t-chat'){ if(!CONV_OPEN)renderConvList(); }
    if(t==='t-sec'){ try{ if(typeof hpNotesUi==='function') hpNotesUi(); }catch(e){} }
    if(t==='t-post'){ try{ if(typeof hpPostUi==='function') hpPostUi(); }catch(e){} }
    if(t==='t-set'){ try{ if(typeof hpStoreUi==='function') hpStoreUi(); }catch(e){} } if(t==='t-set'){ try{ if(typeof hpNfUi==='function') hpNfUi(); }catch(e){} }
    try{ if(typeof hpCsRefresh==='function') hpCsRefresh(); }catch(e){}
    try{ const mc=document.getElementById('me-chip'); if(mc&&mc.classList) mc.classList.toggle('open',t==='t-id'); }catch(e){}   menuClose(); homeToggle(t!=='t-chat'); menuBadge();
    if(t!=='t-contacts'){ stopScan(); }
  };
}
$('#btn-call').onclick=()=>startCall(false);

$('#btn-hang').onclick=()=>{addStat(TL('sys_hangup'));hangup();};
$('#btn-send').onclick=sendChat;
$('#text').addEventListener('keydown',e=>{if(e.key==='Enter')sendChat();});

$('#btn-set-name').onclick=()=>setMyName($('#name-input').value);
$('#name-input').addEventListener('keydown',e=>{ if(e.key==='Enter')setMyName($('#name-input').value); });

function hpAddUi(){
  const a=document.getElementById('add-addr'), n=document.getElementById('add-nick'), b=document.getElementById('btn-add-contact'); if(!a||!b) return;
  const v=a.value.trim(), k=v?'btn_add':'btn_card_paste'; b.setAttribute('data-i18n',k); b.textContent=T(k);
  if(!n||(n.value&&n.value!==(n.dataset.auto||''))) return;
  let nm=''; if(v.charAt(0)==='{'){ try{ const c=JSON.parse(v); const ex=(c&&typeof c.id==='string')?contacts().find(x=>x.address===c.id):null; nm=(ex&&ex.nick)||hpCardNameOf(c); }catch(e){ nm=''; } }
  n.value=nm; n.dataset.auto=nm;
}
function hpAddClear(){ $('#add-addr').value=''; const n=$('#add-nick'); n.value=''; n.dataset.auto=''; hpAddUi(); }

const HP_ADD_HOLD=1000; let HP_ADD_MSG_T=null;
function hpAddHold(){ const b=$('#btn-add-contact'), a=$('#add-addr'); b.disabled=true; a.style.boxShadow='0 0 0 2px var(--teal)'; setTimeout(()=>{ b.disabled=false; a.style.boxShadow=''; },HP_ADD_HOLD); }
function hpAddMsg(t){ let m=document.getElementById('add-msg'); if(!m){ m=document.createElement('div'); m.id='add-msg'; m.className='note'; m.style.color='var(--teal)'; const row=$('#btn-add-contact').parentNode; row.parentNode.insertBefore(m,row.nextSibling); } m.textContent=t||''; if(HP_ADD_MSG_T) clearTimeout(HP_ADD_MSG_T); HP_ADD_MSG_T=setTimeout(()=>{ m.textContent=''; },6000); }
$('#add-addr').addEventListener('input',hpAddUi);
$('#btn-add-contact').onclick=async()=>{ const a=$('#add-addr').value.trim(); const n=$('#add-nick').value.trim();
  if(!a){ let t=''; try{ t=String((await navigator.clipboard.readText())||'').trim(); }catch(e){ log(TL('lg_paste_no',{err:(e&&e.name)||String(e)})); }   if(!t){ alert(T('al_paste_no')); try{ $('#add-addr').focus(); }catch(e){} return; } $('#add-addr').value=t; hpAddUi(); hpAddHold(); return; }
  if(/#join=/.test(a)&&typeof hpIvjSet==='function'){ hpAddClear(); hpIvjSet(hpIvjParse(a)); return; }
  if(a.charAt(0)==='{'){ let cid=''; try{ cid=String(JSON.parse(a).id||''); }catch(e){} const had=!!cid&&contacts().some(x=>x.address===cid), bt=$('#btn-add-contact'); bt.disabled=true;
    hpAddCard(a,n).then(c=>{ bt.disabled=false; hpAddClear(); hpAddMsg(TF(had?'nt_add_updated':'nt_add_added',{name:(c&&c.nick)||hpIdShort(cid)})); }).catch(e=>{ bt.disabled=false; log(TL('lg_card_bad',{err:e.message})); alert(T(hpCardWhy(e))); });   return; }
  if(a&&addContact(a,n,await hpNickOk(a,n))){   hpAddClear(); hpAddMsg(TF('nt_add_added',{name:n||hpIdShort(a)})); log(TL('lg_added',{addr:a}));} };
hpAddUi();
{ const cb=document.getElementById('btn-copy-card'); if(cb) cb.onclick=()=>{ hpCopyMyCard().then(()=>{ const t=cb.textContent; cb.textContent='\u2713'; setTimeout(()=>{ cb.textContent=t; },1500); }).catch(e=>{ log(e.message); alert((typeof hpErrShow==='function'?hpErrShow(e):e.message)); }); }; }
$('#btn-scan').onclick=()=>{ if(scanStream)stopScan(); else startScan(); };
try{ if(typeof hpInvUiInit==='function') hpInvUiInit(); }catch(e){ log('invite ui: '+e.message); }

try{ const bs=document.getElementById('btn-search'), sq=document.getElementById('sr-q'), sc=document.getElementById('sr-close'); let st=0; if(bs) bs.onclick=()=>hpSrOpen(); if(sc) sc.onclick=()=>hpSrClose(); if(sq){ sq.oninput=()=>{ clearTimeout(st); st=setTimeout(hpSrRender,150); }; sq.onkeydown=e=>{ if(e.key==='Escape'){ hpSrClose(); } else if(e.key==='Enter'){ clearTimeout(st); hpSrRender(); try{ sq.blur(); }catch(_){} } }; } }catch(e){}
try{ const bq=document.getElementById('btn-qr'); if(bq)bq.onclick=()=>startScanFull(); const qc=document.getElementById('qrfull-close'); if(qc)qc.onclick=()=>stopScanFull(); }catch(e){}
$('#peer-sel').onchange=e=>{ if(e.target.value){ $('#peer').value=e.target.value; CURPEER=e.target.value; histRender(e.target.value); try{ rtcUi(); }catch(_){} } };

$('#btn-id-clear').onclick=()=>{ hpForgetHere(); };
$('#btn-back').onclick=()=>{ showConvList(); };
$('#btn-menu').onclick=(e)=>{ e.stopPropagation(); menuToggle(); };
try{ const goReq=()=>{ const b=document.getElementById('t-req'); if(b) b.click(); }; for(const id of ['req-band','req-entry']){ const el=document.getElementById(id); if(el){ el.onclick=goReq; el.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); goReq(); } }; } } const bb=document.getElementById('btn-req-back'); if(bb) bb.onclick=()=>{ const b=document.getElementById('t-contacts'); if(b) b.click(); }; hpReqPlace(); }catch(e){}
$('#btn-img').onclick=()=>{ const f=$('#img-file'); if(f)f.click(); };
function hpIosHasAcct(){ try{ if(typeof ID!=='undefined'&&ID) return true; if(typeof hpVaultOn==='function'&&hpVaultOn()) return true; for(let i=0;i<localStorage.length;i++){ if(localStorage.key(i)==='p2p_id') return true; } return false; }catch(e){ return false; } }
(function(){ try{ const ua=navigator.userAgent||''; const ios=/iPhone|iPad|iPod/.test(ua); const standalone=!!navigator.standalone||(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches); if(ios&&!standalone&&!localStorage.getItem('p2p_ios_hint_done')&&!hpIosHasAcct()){ const h=document.getElementById('ios-hint'), t=document.getElementById('ios-hint-text'), c=document.getElementById('ios-hint-close'); if(h&&t){ t.textContent=T('ios_hint'); h.style.display='block'; const iv=setInterval(()=>{ if(hpIosHasAcct()){ h.style.display='none'; clearInterval(iv); } },2000);   if(c)c.onclick=()=>{ h.style.display='none'; localStorage.setItem('p2p_ios_hint_done','1'); }; } } }catch(e){} })();
if('serviceWorker' in navigator){ try{ navigator.serviceWorker.register('/sw.js').catch(()=>{}); }catch(e){} }
window.addEventListener('popstate',()=>{ if(CONV_OPEN){ try{ showConvList(); }catch(e){} } });
(function(){ const sec=$('#p-chat'); if(!sec)return; sec.ondragover=e=>{ if(e.dataTransfer&&Array.from(e.dataTransfer.types||[]).indexOf('Files')>=0){ e.preventDefault(); e.dataTransfer.dropEffect='copy'; } }; sec.ondrop=e=>{ const fl=(e.dataTransfer&&e.dataTransfer.files)?Array.from(e.dataTransfer.files):[]; if(!fl.length)return; e.preventDefault(); if(!CONV_OPEN){ return; } log(TL('lg_dropped',{name:fl.length>1?TL('draft_count',{n:fl.length}):(fl[0].name||'')})); draftSet(fl); }; })();
$('#img-file').onchange=e=>{ const fs=e.target.files?Array.from(e.target.files):[]; e.target.value=''; if(fs.length)draftSet(fs); };
document.addEventListener('paste',e=>{ try{ const items=(e.clipboardData&&e.clipboardData.items)?Array.from(e.clipboardData.items):[]; const imgs=items.filter(i=>/^image\//.test(i.type)); if(imgs.length&&CONV_OPEN){ const files=imgs.map(i=>i.getAsFile()).filter(Boolean); if(files.length)draftSet(files);   } }catch(err){} });
$('#btn-home').onclick=()=>{ document.querySelector('#t-chat').click(); };
document.addEventListener('click',(e)=>{ const n=document.querySelector('nav'); if(!n||!n.classList.contains('open'))return; const t=e.target; if(t&&t.closest&&(t.closest('nav')||t.closest('#btn-menu')))return; n.classList.remove('open'); },true);

$('#addr').onclick=()=>{if(ID){navigator.clipboard&&navigator.clipboard.writeText(ID.address);log(TL('lg_copied'));}};
$('#btn-log-copy').onclick=()=>{ const b=$('#btn-log-copy'), t=b.textContent; if(!navigator.clipboard){ log('copy: clipboard が使えない'); return; } navigator.clipboard.writeText(((typeof hpLogHead==='function')?hpLogHead()+'\n':'')+hpLogText()).then(()=>{ b.textContent=t+' ✓'; setTimeout(()=>{ b.textContent=t; },1500); }).catch(e=>{ log('copy: '+e.message); }); };
$('#btn-log-clear').onclick=()=>{ hpLogClear(); };

(async function boot(){
  try{ applyLang(); }catch(e){}
  $('#id-origin').textContent=location.origin;
  { let jn=null; try{ jn=(typeof hpIvjTake==='function')?hpIvjTake():null; }catch(e){ jn=null; }
    if(jn){ let away=false; try{ away=await hpIvjHandoff(jn); }catch(e){ away=false; } if(away) return; hpIvjSet(jn); } if(jn){ try{ if(typeof hpIvjIosFirst==='function') setTimeout(()=>{ hpIvjIosFirst(jn); },800); }catch(e){} }   }
  try{ if(navigator.standalone||(window.matchMedia&&window.matchMedia('(display-mode:standalone)').matches)){ document.body.classList.add('p2p-standalone'); } }catch(e){}

  let SOUND_TONE='std'; try{ const v=localStorage.getItem('p2p_sound'); if(v==='0')SOUND_TONE='off'; else if(v==='low'||v==='one'||v==='off'||v==='std')SOUND_TONE=v; }catch(e){}
  try{ const sp=document.getElementById('snd-pick'), st=document.getElementById('snd-try'); if(st){ st.disabled=(SOUND_TONE==='off'); st.onclick=()=>{ if(window.soundTry) soundTry(); }; } if(sp){ sp.value=SOUND_TONE; sp.onchange=e=>{ SOUND_TONE=e.target.value; try{ localStorage.setItem('p2p_sound', SOUND_TONE); }catch(x){} if(st) st.disabled=(SOUND_TONE==='off'); if(SOUND_TONE!=='off'&&window.soundTry)soundTry(); }; } }catch(e){}

  if(!window.isSecureContext||!crypto.subtle){
    const b=$('#banner');b.textContent=T('bn_nocrypto');
    b.style.display='block';return;
  }
  try{
    await crypto.subtle.generateKey({name:'Ed25519'},false,['sign','verify']);
    await crypto.subtle.generateKey({name:'X25519'},false,['deriveBits']);
  }catch(e){
    const b=$('#banner');b.textContent=T('bn_noed');
    b.style.display='block';return;
  }
  if(typeof hpTabGate==='function') await hpTabGate();
  if(hpVaultOn()){ hpLog('鍵は守られている。開くのを待つ'); await hpVaultGate(); }
  try{ if(typeof hpJoinRestore==='function') hpJoinRestore(); }catch(e){}
  try{ startBg(); }catch(e){ dot('d-rly','err'); log('post: '+e.message); }
  const saved=hpSecGet('p2p_id');
  if(saved){
    try{await applyIdentity(JSON.parse(saved),true);}catch(e){log(TL('lg_savedfail',{err:e.message}));}
  }else{
    log(TL('lg_needid'));
  }
  renderContacts(); renderRequests(); renderMyName();
  try{ hpVaultUiInit(); if(typeof hpPaperUiInit==='function') hpPaperUiInit(); if(typeof hpStoreUiInit==='function') hpStoreUiInit();   hpVaultNag(); }catch(e){ log('vault ui: '+e.message); }

  applyOrder();
  const ls=document.getElementById('lang-sel'); if(ls)ls.onchange=function(e){ setLang(e.target.value); };
  applyLang();
})();

try{ hpLinkUiInit(); renderDevMode(); }catch(e){ try{ log('link ui: '+e.message); }catch(e2){} }
try{ if(typeof hpLqBoot==='function') hpLqBoot(); }catch(e){}

try{ const lb=document.getElementById('lightbox'); if(lb) lb.addEventListener('click',function(){ lb.style.display='none'; }); }catch(e){}
