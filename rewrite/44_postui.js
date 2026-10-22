function hpPuShort(a){ a=String(a||''); return a.length>12?a.slice(0,6)+'…'+a.slice(-4):a; }
function hpPuWrap(name,before,after){ try{ const f=globalThis[name]; if(typeof f!=='function'||f.__hpPu) return false;
  const g=function(){ try{ if(before) before.apply(this,arguments); }catch(e){} const r=f.apply(this,arguments); try{ if(after) after(r); }catch(e){} return r; };
  g.__hpPu=1; globalThis[name]=g; return true; }catch(e){ return false; } }

function hpAcctMode(){ const L=(typeof hpLeaseAcct==='function')?hpLeaseAcct():'', X=(typeof hpXmAcct==='function')?hpXmAcct():'';
  if(!L&&!X) return 'none'; if(!L) return 'xm'; if(!X) return 'lease'; return L===X?'same':'diff'; }
function hpAcctUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return '';
  const $i=id=>document.getElementById(id), mode=hpAcctMode(), L=(typeof hpLeaseAcct==='function')?hpLeaseAcct():'', X=(typeof hpXmAcct==='function')?hpXmAcct():'';
  const lab=(b,k)=>{ if(b&&b.getAttribute&&b.getAttribute('data-i18n')!==k){ b.setAttribute('data-i18n',k); b.textContent=T(k); } };
  const inp=$i('lease-acct');
  if(inp&&inp.parentNode){ const row=inp.parentNode, b=row.querySelector?row.querySelector('b'):null; let sp=$i('lease-acct-show');
    if(!sp){ sp=document.createElement('span'); sp.id='lease-acct-show'; sp.className='mono'; row.insertBefore(sp,inp); }
    inp.style.display=L?'none':''; sp.style.display=(L&&mode!=='same')?'':'none'; sp.textContent=L?L:'';
    lab(b,mode==='same'?'lease_acct_same':'lease_acct_label'); }
  const xa=$i('xm-acct'); lab(xa&&xa.parentNode&&xa.parentNode.querySelector?xa.parentNode.querySelector('b'):null,mode==='same'?'xm_acct_same':'xm_acct_label');
  let d=$i('xm-diff'); const st=$i('xm-st');
  if(mode==='diff'&&!(typeof hpXmQuiet==='function'&&hpXmQuiet()) ){ if(!d&&st&&st.parentNode){ d=document.createElement('div'); d.id='xm-diff'; d.className='note'; st.parentNode.insertBefore(d,st.nextSibling); } if(d){ d.style.display=''; d.textContent=TF('xm_acct_diff',{a:hpPuShort(L)}); } }
  else if(d) d.style.display='none';
  return mode; }catch(e){ return ''; } }

let HP_XM_SNAPJ=null;
function hpXmSnap(){ const o={}; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&/xumm|pkce/i.test(k)) o[k]=localStorage.getItem(k); } }catch(e){} return Object.keys(o).length?o:null; }
function hpXmUnsnap(why){ const J=HP_XM_SNAPJ; HP_XM_SNAPJ=null; if(!J||HP_XM_PICKN>J.n) return false;
  try{ for(const k of Object.keys(J.s)) localStorage.setItem(k,J.s[k]); }catch(e){ return false; }
  HP_XM=null; HP_XM_LIVE=null; HP_XM_LIVE_AT=0;
  try{ hpLog('別の口座を選ぶのをやめた（'+why+'）。前の Xaman のサインインに戻した'); }catch(e){} return true; }
async function hpXmPick2(){ if(typeof ID==='undefined'||!ID){ try{ hpToast(T('pt_noid')); }catch(e){} return false; }
  if(hpXmLocal()){ hpXmSt(T('xm_local'),true); return false; }
  hpXmSt(T('xm_opening')); HP_XM_OPEN_AT=Date.now(); try{ HP_XM_ASK_AT=Date.now(); }catch(e){}
  try{ await hpRentLibs(); const XM=hpXmGet();
    if(hpXmAcct()){ const s=hpXmSnap(); HP_XM_SNAPJ=s?{s:s,n:HP_XM_PICKN,at:Date.now()}:null; try{ await XM.logout(); }catch(e){} }
    const r=await XM.authorize(); if(r instanceof Error) throw r; return true; }
  catch(e){ HP_XM_OPEN_AT=0; const back=hpXmUnsnap('Xaman の小窓が閉じた'); hpXmSt(back?T('xm_kept'):TF('xm_fail',{why:String((e&&e.message)||e)}),!back); if(back){ try{ hpXmUi(); }catch(_){} } return false; } }
function hpXmLive2(a){ if(!a||typeof Xumm!=='function'||HP_XM_OPEN_AT||HP_XM_SI||Date.now()-HP_XM_LIVE_AT<60e3) return false; HP_XM_LIVE_AT=Date.now();
  hpXmSignedAs(4000).then(x=>x===a?x:hpXmSignedAs(12000)).then(x=>{ const was=hpXmDead(a), wb=(HP_XM_LIVE&&HP_XM_LIVE.b)||''; HP_XM_LIVE={a:a,ok:x===a,b:(x&&x!==a)?x:''};   if(was!==hpXmDead(a)||wb!==HP_XM_LIVE.b) hpXmUi(); }).catch(()=>{}); return true; }
function hpXmUiBefore(){ if(HP_XM_SNAPJ&&HP_XM_OPEN_AT&&Date.now()-HP_XM_OPEN_AT>=600e3){ if(hpXmUnsnap('10 分たっても選ばれなかった')){   HP_XM_OPEN_AT=0; setTimeout(()=>{ try{ hpXmSt(T('xm_kept')); }catch(e){} },0); } } }

let HP_HS_HOME=null;
function hpMvHosts(on){ try{ const h=document.getElementById('post-hosts'), m=document.getElementById('post-move'); if(!h||!m||!m.parentNode||!h.parentNode) return '';
  if(!HP_HS_HOME&&m.nextSibling!==h) HP_HS_HOME={p:h.parentNode,n:h.nextSibling};
  if(on){ if(m.nextSibling!==h) m.parentNode.insertBefore(h,m.nextSibling); return 'below'; }
  if(HP_HS_HOME&&m.nextSibling===h){ HP_HS_HOME.p.insertBefore(h,(HP_HS_HOME.n&&HP_HS_HOME.n.parentNode===HP_HS_HOME.p)?HP_HS_HOME.n:null); }
  return 'home'; }catch(e){ return ''; } }
function hpMvBusy(){ return !!((typeof HP_RENT_BUSY!=='undefined'&&HP_RENT_BUSY)||(typeof ID!=='undefined'&&ID&&ID.rentJob)); }
function hpMoveUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const m=document.getElementById('post-move'), go=document.getElementById('btn-pt-move'); if(!m||!go||!go.parentNode) return '';
  const on=!!(typeof HP_MOVE!=='undefined'&&HP_MOVE); let st=document.getElementById('btn-pt-move-stop');
  if(!st){ st=document.createElement('button'); st.className='b'; st.id='btn-pt-move-stop'; st.type='button'; st.setAttribute('data-i18n','btn_pt_move_stop'); st.textContent=T('btn_pt_move_stop'); st.addEventListener('click',()=>{ hpMoveStop(); }); go.parentNode.appendChild(st); }
  go.style.display=on?'none':''; st.style.display=on?'':'none'; st.disabled=hpMvBusy();
  let nt=document.getElementById('pt-move-pick'); if(!nt){ nt=document.createElement('div'); nt.id='pt-move-pick'; nt.className='note'; nt.setAttribute('data-i18n','mv2_pick_nt'); nt.textContent=T('mv2_pick_nt'); go.parentNode.parentNode.insertBefore(nt,go.parentNode.nextSibling); }
  nt.style.display=on?'':'none'; hpMvHosts(on); try{ hpMvQrUi(); }catch(e){} return on?'on':'off'; }catch(e){ return ''; } }
function hpMoveStop(){ if(hpMvBusy()){ try{ hpTell(T('mv2_stop_busy')); }catch(e){} return false; }
  HP_MOVE=false; try{ HP_SWAP=false; }catch(e){}   try{ if(typeof hpHsBtn==='function') hpHsBtn(); }catch(e){} hpMoveUi();
  try{ const m=document.getElementById('post-move'); if(m&&m.scrollIntoView) m.scrollIntoView({block:'nearest',behavior:'smooth'}); }catch(e){} return true; }
function hpHsOpenAfter(){ if(typeof HP_MOVE!=='undefined'&&HP_MOVE){ hpMoveUi(); try{ const h=document.getElementById('post-hosts'); if(h&&h.scrollIntoView) h.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){} } }

const HP_GG_CAP=5*60e3; let HP_GG=null, HP_GG_T=null;
function hpGgMMSS(ms){ const s=Math.max(0,Math.floor(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function hpGgWho(o){
  const n=String((o&&o.note)||''), has=k=>{ const t=T(k); return !!t&&t!==k&&n.indexOf(t)>=0; };
  if(o&&o.qr) return (typeof hpRentPhone==='function'&&hpRentPhone())?'gg_you_btn':'gg_you_x';
  if(o&&o.btns&&o.btns.length) return '';
  if(has('rn_wait_x')) return 'gg_you_x';
  if(has('rn_confirm_wait')) return 'gg_you_pick';
  if(has('rn_hostwait')||has('rn_hostwait2')) return 'gg_host';
  if(has('rn_n_dep')) return 'gg_dep';
  if(has('xm_checking')||has('rn_reading')) return 'gg_read';
  if(o&&Array.isArray(o.lines)&&o.lines.some(l=>l&&l[1]==='now')) return 'gg_app';
  return ''; }
function hpGgDone(o){ const n=String((o&&o.note)||''), J=(typeof HP_RENT_J!=='undefined')?HP_RENT_J:null; if(J&&J.done&&J.done.save) return true;
  const p=k=>{ const t=String(T(k)||''); const h=t.split('{')[0]; return h.length>3&&n.indexOf(h)>=0; }; return p('ext_done')||p('rn_done'); }
function hpGgDraw(){ try{ const c=document.getElementById('post-run'), G=HP_GG; let el=document.getElementById('rn-gauge');
  if(!G||!c||(c.style&&c.style.display==='none')){ if(el&&el.parentNode) el.parentNode.removeChild(el); if(!G||!c||c.style.display==='none'){ if(HP_GG_T){ clearInterval(HP_GG_T); HP_GG_T=null; } } return ''; }
  if(!el||el.parentNode!==c){ el=document.createElement('div'); el.id='rn-gauge'; const l=document.createElement('div'); l.className='gg-l'; const b=document.createElement('div'); b.className='gg-b'; const f=document.createElement('div'); f.className='gg-f'; b.appendChild(f); const t=document.createElement('div'); t.className='gg-t'; el.appendChild(l); el.appendChild(b); el.appendChild(t);
    const h=c.querySelector?c.querySelector('h2'):null; c.insertBefore(el,h?h.nextSibling:c.firstChild); }
  const dt=Date.now()-G.t0, over=!G.done&&dt>=HP_GG_CAP, ch=el.children;
  el.className='hp-gg'+(G.done?' ok':over?' over':'');
  ch[0].textContent=G.done?T('gg_done'):T(G.key); ch[1].children[0].style.width=(G.done?100:Math.min(100,dt/HP_GG_CAP*100)).toFixed(1)+'%';
  ch[2].textContent=G.done?'':TF(over?'gg_over':'gg_time',{t:hpGgMMSS(dt),c:hpGgMMSS(HP_GG_CAP)});
  return el.className; }catch(e){ return ''; } }
function hpRentShowAfter(c,o){ if(!c) return; const key=hpGgWho(o||{});
  if(key){ if(!HP_GG||HP_GG.key!==key||HP_GG.done) HP_GG={key:key,t0:Date.now(),done:false}; }
  else if(HP_GG&&!HP_GG.done&&hpGgDone(o)) HP_GG={key:HP_GG.key,t0:HP_GG.t0,done:true};
  else HP_GG=null;
  try{ const p=document.getElementById('rn-prog'); if(p){ p.style.fontSize='13px'; p.style.fontWeight='400'; p.style.margin='0 0 6px'; } }catch(e){}
  try{ const J=(typeof HP_RENT_J!=='undefined')?HP_RENT_J:null, h=c.querySelector?c.querySelector('h2'):null; if(h&&((J&&J.move)||(typeof HP_MOVE!=='undefined'&&HP_MOVE&&HP_RUN_AT==='post-move'))) h.textContent=T('mv2_run_title'); }catch(e){}
  hpGgDraw(); if(HP_GG&&!HP_GG.done&&!HP_GG_T) HP_GG_T=setInterval(hpGgDraw,1000); if((!HP_GG||HP_GG.done)&&HP_GG_T){ clearInterval(HP_GG_T); HP_GG_T=null; } }

function hpMvLost(){ try{ const L=ID&&ID.lease, x=Number(L&&L.exp)||0, left=x-Date.now(); if(!(left>0)||(L&&L.gone)) return null; const u=Number(L.unit)||0, hrs=Math.round(left/3600e3); return {d:Math.floor(left/864e5),e:u>0?hrs*u:0}; }catch(e){ return null; } }
function hpMvLostText(){ const r=hpMvLost(); if(!r) return ''; const num=v=>{ const dp=v>=1?2:6;   return (typeof hpNum==='function')?hpNum(v,dp):String(Number(v.toFixed(dp))); }, e=r.e>0?num(r.e):'0'; return '\n'+((e!=='0')?TF('mv2_lost',{d:r.d,e:e}):TF('mv2_lost_d',{d:r.d})); }
function hpRenewHint(){ try{ const card=document.getElementById('post-renew'); if(!card) return ''; let el=document.getElementById('pt-ext-move');
  const x=(typeof hpLeaseExp==='function')?hpLeaseExp():0, warn=(typeof HP_LEASE_WARN!=='undefined')?HP_LEASE_WARN:30*864e5, left=x-Date.now();
  const on=!!(x&&left>0&&left<=warn&&hpIsMain()&&ID&&!(ID.lease&&ID.lease.gone)&&(typeof hpRentOwned!=='function'||hpRentOwned()));
  if(!el&&on){ el=document.createElement('div'); el.id='pt-ext-move'; el.className='note'; const s=document.createElement('span'); s.setAttribute('data-i18n','ext_or_move'); s.textContent=T('ext_or_move');
    const a=document.createElement('a'); a.href='#'; a.className='lease-go'; a.setAttribute('data-i18n','ext_or_move_go'); a.textContent=T('ext_or_move_go'); a.onclick=e=>{ try{ e.preventDefault(); }catch(_){} try{ const m=document.getElementById('post-move'); if(m&&m.scrollIntoView) m.scrollIntoView({behavior:'smooth',block:'start'}); }catch(_){} };
    el.appendChild(s); el.appendChild(document.createTextNode(' ')); el.appendChild(a); const row=document.getElementById('pt-ext-row'); card.insertBefore(el,(row&&row.parentNode===card)?row.nextSibling:null); }
  if(el) el.style.display=on?'':'none'; return on?'on':''; }catch(e){ return ''; } }

const HP_MVQ_K='p2p_mvq';
function hpMvQrOrigin(){ try{ if(typeof hpShareOrigin==='function'){ const o=hpShareOrigin(); if(o) return o; } }catch(e){} try{ return String(location.origin||''); }catch(e){ return ''; } }
function hpMvQrText(s){ return hpMvQrOrigin()+'/#mv='+encodeURIComponent(String(s.url).replace(/^wss:\/\//,'')+'~'+s.ts+'~'+s.sig); }
function hpMvQrParse(h){ const m=/^#?mv=([^&#]+)$/.exec(String(h||'')); if(!m) return null; let v=''; try{ v=decodeURIComponent(m[1]); }catch(e){ return null; }
  const p=v.split('~'); if(p.length!==3) return null; const url='wss://'+p[0], ts=Number(p[1]);
  if(!hpPmUrlOk(url)||!(ts>0)||!/^[0-9a-f]{128}$/.test(p[2])) return null; return {v:1,type:'sibmv',url:url,ts:ts,sig:p[2]}; }
async function hpMvQrSig(){ const url=(typeof hpPostUrl==='function')?hpPostUrl():''; if(typeof ID==='undefined'||!ID||!hpIsMain()||!hpPmUrlOk(url)) return null;
  let s=ID.postSig; if(!s||s.url!==url||!/^[0-9a-f]{128}$/.test(String(s.sig||''))){ const ts=Date.now(); s={url:url,ts:ts,sig:await edSign(hpPmMsg(ID.address,url,ts))}; ID.postSig=s; try{ saveID(); }catch(e){} try{ hpLog('引っ越し先の QR のため、今の郵便受けの場所に実印で署名した（'+url+'）'); }catch(e){} }
  return s; }
function hpMvQrUi(){ try{ const go=document.getElementById('btn-pt-move'); if(!go||!go.parentNode) return ''; let b=document.getElementById('btn-pt-mvqr');
  if(!b){ b=document.createElement('button'); b.className='b'; b.id='btn-pt-mvqr'; b.type='button'; b.setAttribute('data-i18n','btn_pt_mvqr'); b.textContent=T('btn_pt_mvqr'); b.addEventListener('click',()=>{ hpMvQrShow(); }); go.parentNode.appendChild(b); }
  let n=0; try{ n=(typeof hpSibs==='function'&&hpIsMain())?hpSibs().length:0; }catch(e){}
  const on=n>0&&!(typeof HP_MOVE!=='undefined'&&HP_MOVE); b.style.display=on?'':'none'; return on?'on':''; }catch(e){ return ''; } }
async function hpMvQrShow(){ const s=await hpMvQrSig().catch(()=>null); if(!s){ try{ hpTell(T('mv2_qr_no')); }catch(e){} return ''; }
  const text=hpMvQrText(s), card=document.getElementById('post-move'); if(!card) return text; let box=document.getElementById('pt-mvqr');
  if(box&&box.parentNode) box.parentNode.removeChild(box); box=document.createElement('div'); box.id='pt-mvqr'; box.style.marginTop='8px';
  try{ const q=qrcode(0,'M'); q.addData(text); q.make(); const im=document.createElement('img'); im.src=q.createDataURL(4,2); im.alt='QR'; im.style.cssText='width:220px;max-width:100%;background:#fff;border-radius:6px;image-rendering:pixelated'; box.appendChild(im); }catch(e){ try{ hpLog('引っ越し先の QR を描けない '+e.message); }catch(_){} }
  const nt=document.createElement('div'); nt.className='note'; nt.style.whiteSpace='pre-line'; nt.textContent=T('mv2_qr_nt'); box.appendChild(nt);
  const row=document.createElement('div'); row.className='row'; const mk=(k,fn)=>{ const x=document.createElement('button'); x.className='b'; x.type='button'; x.textContent=T(k); x.addEventListener('click',fn); row.appendChild(x); };
  mk('btn_mvqr_copy',async()=>{ let ok=false; try{ ok=await hpCopyText(text); }catch(e){} try{ hpToast(T(ok!==false?'mv2_qr_copied':'mv2_qr_copyng')); }catch(e){} });
  mk('btn_mvqr_close',()=>{ if(box.parentNode) box.parentNode.removeChild(box); }); box.appendChild(row); card.appendChild(box);
  try{ if(box.scrollIntoView) box.scrollIntoView({block:'nearest',behavior:'smooth'}); }catch(e){} return text; }
function hpMvQrTake(){ try{ const h=String(location.hash||''); if(!/^#mv=/.test(h)) return false; try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
  localStorage.setItem(HP_MVQ_K,h.slice(1)+'|'+Date.now()); setTimeout(()=>{ try{ hpToast(T('mv2_qr_got'),4000); }catch(e){} },800); return true; }catch(e){ return false; } }
async function hpMvQrRun(){ try{ if(typeof ID==='undefined'||!ID||(typeof HP_TAB_OFF!=='undefined'&&HP_TAB_OFF)) return ''; const v=localStorage.getItem(HP_MVQ_K); if(!v) return '';
    localStorage.removeItem(HP_MVQ_K); const i=v.lastIndexOf('|'), h=v.slice(0,i), at=Number(v.slice(i+1));
    if(!(at>0)||Date.now()-at>864e5) return 'old';
    const o=hpMvQrParse(h); if(!o){ hpLog('引っ越し先の QR の形が違う（捨てた）'); try{ hpTell(T('mv2_qr_ng')); }catch(e){} return 'bad'; }
    if(!hpIsChild()){ try{ hpTell(T('mv2_qr_notsub')); }catch(e){} return 'notsub'; }
    if(o.url===hpPostUrl()){ try{ hpToast(T('mv2_qr_same'),3000); }catch(e){} return 'same'; }
    const ok=await hpMoveIn(o,null); if(!ok){ try{ hpTell(T('mv2_qr_ng')); }catch(e){} return 'ng'; }
    try{ hpToast(T((typeof hpBoxSub==='function'&&hpBoxSub())?'ob_qr_ok':'mv2_qr_ok'),3000); }catch(e){} return 'ok';   }catch(e){ return ''; } }

function hpHdrNarrow(){ try{ const n=!!(typeof window!=='undefined'&&window&&window.innerWidth>0&&window.innerWidth<=600), b=document.body; if(b&&b.classList&&b.classList.contains('hdr2')!==n) b.classList.toggle('hdr2',n); return n; }catch(e){ return false; } }

function hpLeaseBtns(){ try{ const rb=document.getElementById('btn-lease-renew'), lg=document.getElementById('btn-lease-lg'); if(!rb||!rb.parentNode) return '';
  const a=(typeof hpLeaseAcct==='function')?hpLeaseAcct():''; let nb=document.getElementById('btn-lease-read');
  if(!nb){ nb=document.createElement('button'); nb.className=rb.className||'b'; nb.id='btn-lease-read'; nb.type='button'; nb.setAttribute('data-i18n','btn_lease_lg'); nb.textContent=T('btn_lease_lg'); try{ nb.style.cssText=String(rb.style.cssText||'').replace(/display\s*:\s*none;?/,''); }catch(e){}
    nb.addEventListener('click',()=>{ const x=(typeof hpLeaseAcct==='function')?hpLeaseAcct():''; if(x) hpLeaseAcctSet(x); }); rb.parentNode.insertBefore(nb,rb.nextSibling); }
  rb.style.display=a?'none':''; nb.style.display=a?'':'none'; if(lg) lg.style.display=a?'none':''; return a?'read':'renew'; }catch(e){ return ''; } }

const HP_HS_REC_MIN=10; let HP_HS_REC=null, HP_HS_RECDONE=false;
function hpHsVerMax(hosts){ const c={}; for(const h of (hosts||[])) if(h&&h.active&&h.ver) c[h.ver]=(c[h.ver]||0)+1;
  const k=v=>String(v).split('.').map(x=>parseInt(x,10)||0); return Object.keys(c).filter(v=>c[v]>=10).sort((a,b)=>{ const A=k(a),B=k(b); for(let i=0;i<Math.max(A.length,B.length);i++){ const d=(B[i]||0)-(A[i]||0); if(d) return d; } return 0; })[0]||''; }
function hpHsRecPick(hosts,med,now){ const P=(typeof HP_HS_OPT!=='undefined'&&HP_HS_OPT.price)||[], price=med>0?(P.find(p=>p>=med)||0):0, ver=hpHsVerMax(hosts), hi=['ent','high'], mi=['ent','high','mid'];
  const steps=[{rep:250,tier:hi,days:90,price:price},{rep:250,tier:hi,days:90,price:0},{rep:250,tier:mi,days:90,price:price},{rep:250,tier:mi,days:90,price:0},{rep:230,tier:mi,days:30,price:0},{rep:200,tier:mi,days:0,price:0}];
  let best=null; for(const s of steps){ const F=Object.assign(HP_HS_F0(),{live:true,free:1,ver:ver?[ver]:[]},s,{tier:s.tier.slice()}); const n=(hosts||[]).filter(h=>hpHsPass(h,F,'',now)).length;
    if(!best||n>best.n) best={F:F,n:n}; if(n>=HP_HS_REC_MIN) return {F:F,n:n}; }
  return best; }
function hpHsRecText(F){ const p=[]; if(F.rep) p.push(TF('hs_rec_rep',{v:F.rep})); if(F.tier&&F.tier.length) p.push(TF('hs_rec_tier',{v:F.tier.map(t=>T(HP_HS_TK[t])).join((typeof hpSep==='function'?hpSep():'・'))})); if(F.price) p.push(TF('hs_rec_price',{v:F.price})); if(F.days) p.push(TF('hs_rec_days',{v:F.days})); if(F.ver&&F.ver.length) p.push(TF('hs_rec_ver',{v:F.ver[0]})); p.push(T('hs_rec_free')); return p.join((typeof hpSep==='function'?hpSep():'・')); }
function hpHsSame(a,b){ try{ return JSON.stringify(a)===JSON.stringify(b); }catch(e){ return false; } }
function hpHsHave(){ return typeof HP_HOSTS!=='undefined'&&!!HP_HOSTS&&!HP_HOSTS.empty&&Array.isArray(HP_HOSTS.hosts)&&HP_HOSTS.hosts.length>0; }
function hpHsRecApply(){ if(!hpHsHave()) return false; const R=hpHsRecPick(HP_HOSTS.hosts,Number(HP_HOSTS.med)||0,Date.now()); if(!R) return false; HP_HS_REC=R.F; HP_HS_F=JSON.parse(JSON.stringify(R.F)); HP_HS_N=HP_HS_SHOW; return true; }
function hpHsGo(){ try{ hpHsFltDraw(); }catch(e){} try{ hpHsDraw(); }catch(e){} try{ if(typeof hpHsDone==='function') hpHsDone(); }catch(e){} }
function hpHsDrawBefore(){ if(HP_HS_RECDONE||!hpHsHave()) return; HP_HS_RECDONE=true; try{ const R=hpHsRecPick(HP_HOSTS.hosts,Number(HP_HOSTS.med)||0,Date.now()); if(R) HP_HS_REC=R.F; }catch(e){} }
function hpHsRecUi(){ try{ const card=document.getElementById('post-hosts'), flt=document.getElementById('hs-flt'); if(!card||!flt||!hpHsHave()) return ''; let el=document.getElementById('hs-rec');
  if(!el){ el=document.createElement('div'); el.id='hs-rec'; el.className='note'; el.style.margin='6px 0'; flt.parentNode.insertBefore(el,flt); } el.textContent='';
  const on=!!(HP_HS_REC&&hpHsSame(HP_HS_F,HP_HS_REC)), b=document.createElement('button'); b.className='b'; b.type='button'; b.style.cssText='font-size:12px;padding:3px 10px;margin-left:6px';
  if(on){ const n=(typeof hpHsView==='function')?hpHsView(HP_HOSTS.hosts,{F:HP_HS_F}).length:0; const s=document.createElement('span'); s.textContent=TF('hs_rec',{c:hpHsRecText(HP_HS_REC),n:n}); el.appendChild(s);
    b.textContent=T('btn_hs_rec_all'); b.addEventListener('click',()=>{ HP_HS_F=HP_HS_F0(); HP_HS_N=HP_HS_SHOW; hpHsGo(); }); }
  else { b.textContent=T('btn_hs_rec'); b.style.marginLeft='0'; b.addEventListener('click',()=>{ if(hpHsRecApply()) hpHsGo(); }); }
  el.appendChild(b); return on?'on':'off'; }catch(e){ return ''; } }
function hpLogBottom(){ try{ const el=document.getElementById('log'); if(el) el.scrollTop=el.scrollHeight; return true; }catch(e){ return false; } }

function hpNoBox(){ try{ if(typeof ID==='undefined'||!ID) return false; if(localStorage.getItem('p2p_post')) return false; if(ID.rentJob) return false;
  const h=(typeof location!=='undefined'&&location&&location.hostname)?String(location.hostname):''; if(!h||/^(localhost$|127\.|\[::1\]$|::1$|192\.168\.|10\.)/.test(h)) return false; return true; }catch(e){ return false; } }

function hpNoPost(){ try{ if(typeof ID==='undefined'||!ID) return false; if(localStorage.getItem('p2p_post')) return false;
  const h=(typeof location!=='undefined'&&location&&location.hostname)?String(location.hostname):''; if(!h||/^(localhost$|127\.|\[::1\]$|::1$|192\.168\.|10\.)/.test(h)) return false; return true; }catch(e){ return false; } }
function hpNbBoot(){
  if(typeof startBg==='function'&&!startBg.__hpNb){ const s0=startBg; const g=function(){ if(hpNoBox()||(typeof hpNoPost==='function'&&hpNoPost())){ try{ hpLog('郵便受けがまだ無いので、つながない'); }catch(e){} try{ if(typeof hpSceneCap==='function') hpSceneCap(); }catch(e){} return; } return s0.apply(this,arguments); }; g.__hpNb=1; startBg=g; }
  if(typeof hpSceneKey==='function'&&!hpSceneKey.__hpNb){ const k0=hpSceneKey; const g=function(){ if(typeof hpNoPost==='function'&&hpNoPost()&&ID.rentJob) return 'nd_post_rent';   if(hpNoBox()) return 'nd_post_none'; return k0.apply(this,arguments); }; g.__hpNb=1; hpSceneKey=g; }
  return true; }

function hpGoneBox(){ try{ if(typeof ID==='undefined'||!ID||!ID.lease||!ID.lease.gone||ID.rentJob) return false;
  const u=String((typeof hpPostUrl==='function'?hpPostUrl():'')||''), m=/^wss?:\/\/(\[[^\]]*\]|[^\/:]+)/i.exec(u), h=m?m[1].toLowerCase():'';
  if(!h||/^(localhost$|127\.|\[::1\]$|::1$|192\.168\.|10\.)/.test(h)) return false; return true; }catch(e){ return false; } }
let HP_GONE_LOGGED=false;
function hpGoneBoot(){ if(typeof hpConnect==='function'&&!hpConnect.__hpGone){ const c0=hpConnect;
    const g=async function(){ if(typeof hpNoPost==='function'&&hpNoPost()){ try{ if(typeof POST!=='undefined'&&POST){ if(POST.retryT){ clearTimeout(POST.retryT); POST.retryT=null; } POST.nextAt=0; } }catch(e){} try{ dot('d-rly','warn'); }catch(e){} return; }
      if(hpGoneBox()){ if(!HP_GONE_LOGGED){ HP_GONE_LOGGED=true; try{ hpLog('郵便受けのリースが切れて消えているので、つなぎに行かない（借り直すか、新しい郵便受けへ移すと、またつなぐ）'); }catch(e){} }
        try{ if(typeof POST!=='undefined'&&POST){ if(POST.retryT){ clearTimeout(POST.retryT); POST.retryT=null; } POST.nextAt=0; } }catch(e){} try{ if(typeof hpSceneCap==='function') hpSceneCap(); }catch(e){} return; }
      HP_GONE_LOGGED=false; return c0.apply(this,arguments); };
    g.__hpGone=1; hpConnect=g; }
  return true; }

function hpPostUiAfter(){ try{ hpAcctUi(); }catch(e){} try{ hpMoveUi(); }catch(e){} try{ hpRenewHint(); }catch(e){} try{ hpLeaseBtns(); }catch(e){}   try{ hpHlUi(); }catch(e){}   }
function hpPuBoot(){
  if(typeof hpXmPick==='function') hpXmPick=hpXmPick2; if(typeof hpXmLive==='function') hpXmLive=hpXmLive2;
  hpPuWrap('hpXmUi',hpXmUiBefore,()=>hpAcctUi()); hpPuWrap('hpLeaseUi',null,()=>hpAcctUi()); hpPuWrap('hpPostUi',null,hpPostUiAfter);
  hpPuWrap('hpHsOpen',null,hpHsOpenAfter); hpPuWrap('hpMoveAfter',null,()=>{ try{ hpMoveUi(); }catch(e){} });
  if(typeof hpRentShow==='function'&&!hpRentShow.__hpPu){ const f=hpRentShow; const g=function(o){ const c=f.apply(this,arguments); try{ hpRentShowAfter(c,o); }catch(e){} return c; }; g.__hpPu=1; hpRentShow=g; }
  hpPuWrap('hpRentHide',null,()=>{ HP_GG=null; if(HP_GG_T){ clearInterval(HP_GG_T); HP_GG_T=null; } });
  try{ hpNbBoot(); }catch(e){}   try{ hpGoneBoot(); }catch(e){}
  hpPuWrap('hpLeaseUi',null,()=>{ try{ hpLeaseBtns(); }catch(e){} }); hpPuWrap('hpHsDraw',hpHsDrawBefore,()=>{ try{ hpHsRecUi(); }catch(e){} });
  return true; }
try{ hpPuBoot(); }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ hpMvQrTake(); setInterval(()=>{ hpMvQrRun(); },3000);
  window.addEventListener('hashchange',()=>{ if(hpMvQrTake()) hpMvQrRun(); });
  document.addEventListener('click',e=>{ try{ const t=e&&e.target&&e.target.closest?e.target.closest('#t-log'):null; if(t) setTimeout(hpLogBottom,60); }catch(_){} });   window.addEventListener('storage',e=>{ if(e&&e.key===HP_MVQ_K) hpMvQrRun(); }); } }catch(e){}

const HP_HL_KEY='p2p_hlth', HP_HL_KEEP_H=168, HP_HL_ST_EVERY=3600e3, HP_HL_ST_CONN=600e3, HP_HL_ST_WAIT=15000, HP_HL_STALL=50*60e3, HP_HL_RT_MAX=120, HP_HL_ST_MAX=60, HP_HL_UP_EVERY=6*3600e3, HP_HL_UP_GAP=600e3;
const HP_HL_BAD={conn:95,rt:3000,run:3,up:97,lease:7,few:5,band:2};
const HP_HL_LABEL={live:'hl_i_live',mail:'hl_i_mail',up:'hl_i_up',lease:'hl_i_lease'}, HP_HL_MARK={ok:'●',bad:'▲',na:'—'}, HP_HL_SKIP={'killed':1,'removed':1,'not owner':1,'owner exists':1};
let HP_HL=null, HP_HL_ST_BUSY=false, HP_HL_UP_BUSY=false, HP_HL_UP_AT=0, HP_HL_CONN_AT=0;
function hpHlKey(u){ try{ const x=new URL(String(u||'')); return (x.hostname+(x.port?':'+x.port:'')).toLowerCase(); }catch(e){ return ''; } }
function hpHlReady(){ try{ return typeof hpHGet==='function'&&typeof hpHSet==='function'&&!(typeof hpHDisk==='function'&&hpHDisk()&&typeof HPH_OPENED!=='undefined'&&!HPH_OPENED); }catch(e){ return false; } }
function hpHlLoad(){ if(HP_HL) return HP_HL; let o=null; try{ const s=hpHGet(HP_HL_KEY); o=s?JSON.parse(s):null; }catch(e){ o=null; } HP_HL=(o&&typeof o==='object'&&o.box&&typeof o.box==='object')?o:{v:1,box:{}}; return HP_HL; }
function hpHlSave(){ try{ if(HP_HL&&hpHlReady()) hpHSet(HP_HL_KEY,JSON.stringify(HP_HL)); }catch(e){} }
function hpHlBox(key,make){ if(!key||!hpHlReady()) return null; const M=hpHlLoad(); let B=M.box[key]; if(!B&&make) B=M.box[key]={h:{},rt:[],st:[],run:0,okAt:0,failAt:0,why:''}; if(B){ if(!B.h||typeof B.h!=='object') B.h={}; if(!Array.isArray(B.rt)) B.rt=[]; if(!Array.isArray(B.st)) B.st=[]; } return B||null; }
function hpHlHour(now){ return Math.floor((now||Date.now())/3600e3); }
function hpHlOffline(){ try{ return typeof navigator!=='undefined'&&!!navigator&&navigator.onLine===false; }catch(e){ return false; } }
function hpHlAdd(key,i,n,now){ const B=hpHlBox(key,true); if(!B) return null; const hr=hpHlHour(now), a=B.h[hr]||(B.h[hr]=[0,0,0,0,0,0,0]); a[i]=(Number(a[i])||0)+(n||1); for(const k of Object.keys(B.h)) if(Number(k)<=hr-HP_HL_KEEP_H) delete B.h[k]; return B; }
function hpHlRt(B,ms,now){ ms=Math.round(Number(ms)); if(!(ms>=0)) return false; B.rt.push([now,ms]); if(B.rt.length>HP_HL_RT_MAX) B.rt.splice(0,B.rt.length-HP_HL_RT_MAX); return true; }
function hpHlConn(url,ev,now){ now=now||Date.now(); const key=hpHlKey(url), i=ev==='ok'?0:ev==='fail'?1:ev==='drop'?2:-1; if(!key||i<0) return null; if(i===0) HP_HL_CONN_AT=now; if(i>0&&hpHlOffline()) return null; const B=hpHlAdd(key,i,1,now); if(B) hpHlSave(); return B; }
function hpHlSent(ok,ms,why,now){ now=now||Date.now(); let key=''; try{ key=hpHlKey(POST.url); }catch(e){} if(!key) return null; if(!ok&&hpHlOffline()) return null; const B=hpHlAdd(key,ok?3:6,1,now)  ; if(!B) return null;
  if(ok){ B.run=0; B.okAt=now; hpHlRt(B,ms,now); } else { B.lostAt=now;   } hpHlSave(); return B; }
function hpHlOut(o,now){ if(!o||typeof o!=='object') return null; now=now||Date.now(); let key=''; try{ key=hpHlKey(POST.url); }catch(e){} if(!key) return null;
  if(Array.isArray(o.push)){ if(!o.push.length) return null; const B=hpHlAdd(key,5,o.push.length,now); if(B){ B.run=0; B.okAt=now; hpHlSave(); } return B; }
  if(o.err){ if(typeof ID==='undefined'||!ID||HP_HL_SKIP[String(o.err)]) return null; const B=hpHlAdd(key,4,1,now); if(B){ B.run=(Number(B.run)||0)+1; B.failAt=now; B.why=String(o.err).slice(0,80); hpHlSave(); } return B; }
  return null; }

async function hpHlStat(){ if(HP_HL_ST_BUSY||typeof POST==='undefined'||!POST||!POST.up) return null; const c=POST.client, key=hpHlKey(POST.url); if(!c||typeof c.getStatus!=='function'||!key||!hpHlBox(key,true)) return null;
  HP_HL_ST_BUSY=true; const t0=Date.now(); let s=null; try{ s=await hpWithin(c.getStatus(),HP_HL_ST_WAIT,'台帳の番号'); }catch(e){ s=null; } finally{ HP_HL_ST_BUSY=false; }
  if(POST.client!==c) return null;
  const now=Date.now(), B=hpHlBox(key,true); if(!B) return null; const q=(s&&Number(s.ledgerSeqNo)>=0)?Number(s.ledgerSeqNo):-1, rec=[now,q,s?String(s.voteStatus||''):'',now-t0];
  B.st.push(rec); if(B.st.length>HP_HL_ST_MAX) B.st.splice(0,B.st.length-HP_HL_ST_MAX); if(q>=0) hpHlRt(B,now-t0,now); hpHlSave();
  try{ hpLog('郵便受けの状態：'+(q>=0?'台帳の番号 '+q+'（'+rec[2]+'・'+(now-t0)+' ms）':'台帳の番号の返事が無い')); }catch(e){} return rec; }
function hpHlTick(now){ now=now||Date.now();
  try{ if(typeof POST!=='undefined'&&POST&&POST.up&&POST.client&&typeof ID!=='undefined'&&ID&&!HP_HL_ST_BUSY){ const B=hpHlBox(hpHlKey(POST.url),false), L=(B&&B.st.length)?B.st[B.st.length-1]:null, age=L?now-L[0]:Infinity;
      if(age>=HP_HL_ST_EVERY||(age>=HP_HL_ST_CONN&&HP_HL_CONN_AT>(L?L[0]:0))) hpHlStat().catch(()=>{}); } }catch(e){}
  try{ hpHlBand(now); }catch(e){} return true; }
function hpHlSum(B,now,hours){ const hr=hpHlHour(now), s=[0,0,0,0,0,0,0]; for(const k of Object.keys(B.h)){ const d=hr-Number(k); if(d>=0&&d<hours){ const a=B.h[k]||[]; for(let i=0;i<7;i++) s[i]+=Number(a[i])||0; } } return s; }
function hpHlMed(a,q){ const s=a.slice().sort((x,y)=>x-y); return s.length?s[Math.min(s.length-1,Math.floor(q*s.length))]:0; }
function hpHlHostAddr(){ try{ const h=(typeof ID!=='undefined'&&ID&&ID.lease)?ID.lease.host:''; return (typeof h==='string'&&/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(h))?h:''; }catch(e){ return ''; } }
function hpHlAid(addr){ try{ let n=0n; for(const ch of String(addr||'')){ const i=HP_B58.indexOf(ch); if(i<0) return ''; n=n*58n+BigInt(i); } const h=n.toString(16).padStart(50,'0'); return h.length===50?h.slice(2,42).toUpperCase():''; }catch(e){ return ''; } }
function hpHlUpKick(now){ now=now||Date.now(); const addr=hpHlHostAddr(); if(!addr||HP_HL_UP_BUSY||typeof hpUpHost!=='function'||typeof HP_UP==='undefined'||!HP_UP) return false; if(typeof HP_UP_RUN!=='undefined'&&HP_UP_RUN) return false;
  const x=HP_UP[addr]; if(x&&x.st==='busy') return false; if(x&&x.st==='ok'&&now-x.at<HP_HL_UP_EVERY) return false; if(now-HP_HL_UP_AT<HP_HL_UP_GAP) return false; const aid=hpHlAid(addr); if(!aid) return false; HP_HL_UP_BUSY=true; HP_HL_UP_AT=now;
  (async()=>{ try{ const r=await hpUpHost({addr:addr,aid:aid}); if(r&&r.st==='ok') HP_UP[addr]=r; }catch(e){ try{ hpLog('郵便受けの状態：ホストの心拍を読めない '+String((e&&e.message)||e)); }catch(_){} } finally{ HP_HL_UP_BUSY=false; try{ hpHlUi(); }catch(_){} } })(); return true; }

function hpHlEval(key,now){ now=now||Date.now(); const B=hpHlBox(key,false)||{h:{},rt:[],st:[],run:0,okAt:0,failAt:0,why:''}, R=HP_HL_BAD, it=[], sec=ms=>hpNum(ms/1000,1), put=(k,st,t)=>it.push({k:k,st:st,t:t});

  { const S=B.st, L=S.length?S[S.length-1]:null; let st='na', t=T('hl_live_none');
    if(L&&now-L[0]<864e5){ if(L[1]<0){ const P1=S.length>1?S[S.length-2]:null; if(P1&&P1[1]<0) st='bad'; t=TF('hl_live_noans',{t:hpDur(now-L[0])}); }
      else { let P=null, E=null; for(let i=S.length-2;i>=0;i--){ if(S[i][1]<0) continue; if(!E) E=S[i]; if(L[0]-S[i][0]>=HP_HL_STALL){ P=S[i]; break; } }
        if(P&&!(L[1]>P[1])){ st='bad'; t=TF('hl_live_stall',{t:hpDur(L[0]-P[0]),q:L[1]}); } else if(P||(E&&L[1]>E[1])){ st='ok'; t=TF('hl_live_ok',{q:L[1],t:hpDur(now-L[0])}); } else t=T('hl_live_wait'); } }
    put('live',st,t); }
  { const w=hpHlSum(B,now,HP_HL_KEEP_H), d=hpHlSum(B,now,24); let st='na', t=T('hl_none'); if(w[3]+w[4]+w[5]+w[6]>0){ t=TF('hl_mail_v',{r:w[5],s:w[3],f:w[4]})+(w[6]?TF('hl_mail_lost',{n:w[6]}):'')+(B.okAt?TF('hl_mail_last',{t:hpDur(now-B.okAt)}):''); const bad=(Number(B.run)>=R.run)||(d[4]>0&&d[3]+d[5]===0); st=bad?'bad':((w[3]+w[5]>0)?'ok':'na');   if(bad&&B.why) t+=TF('hl_mail_why',{w:B.why}); } put('mail',st,t); }
  { const addr=hpHlHostAddr(), x=(addr&&typeof HP_UP!=='undefined'&&HP_UP)?HP_UP[addr]:null; let st='na', t=T(HP_HL_UP_BUSY?'hl_up_busy':'hl_up_none'); if(x&&x.st==='ok'){ const rec=!!(x.last&&x.last.t+x.last.h*3600e3>now-864e5); t=TF('hl_up_v',{u:x.pct})+(x.last?TF('hl_up_gap',{d:hpUpDate(x.last.t),h:x.last.h}):T('hl_up_nogap')); st=(x.pct<R.up||rec)?'bad':'ok'; } put('up',st,t); }
  { let x=0; try{ x=hpLeaseExp(); }catch(e){} let st='na', t=T('hl_lease_none'); if(x){ const gone=!!(typeof ID!=='undefined'&&ID&&ID.lease&&ID.lease.gone); t=TF('hl_lease_v',{t:hpLeaseText(),l:hpLeaseLeft()}); st=(gone||x-now<R.lease*864e5)?'bad':'ok'; } put('lease',st,t); }
  const bad=it.filter(x=>x.k!=='lease'&&x.st==='bad').length; return {key:key,items:it,bad:bad,badAll:it.filter(x=>x.st==='bad').length,okN:it.filter(x=>x.st==='ok').length}; }
function hpHlSumText(E){ return E.badAll?TF('hl_sum_bad',{n:E.badAll}):(E.okN?T('hl_sum_ok'):T('hl_sum_wait')); }
function hpHlNow(){ try{ if(typeof ID==='undefined'||!ID||typeof hpPostHave!=='function'||!hpPostHave()) return ''; return hpHlKey(hpPostUrl()); }catch(e){ return ''; } }
function hpHlBand(now){ if(typeof document==='undefined'||!document.getElementById||!document.querySelector) return ''; let b=document.getElementById('hl-band'), on=false; try{ const key=hpHlNow(); on=!!key&&hpHlEval(key,now).bad>=HP_HL_BAD.band; }catch(e){ on=false; }
  if(!on){ if(b&&b.parentNode) b.parentNode.removeChild(b); return 'off'; }
  if(!b){ const nav=document.querySelector('nav'); if(!nav||!nav.parentNode) return ''; b=document.createElement('div'); b.id='hl-band'; b.setAttribute('role','button'); b.tabIndex=0; b.style.cssText='padding:8px 14px;background:#2a2410;border-bottom:1px solid var(--amber);color:var(--amber);font-size:13px;line-height:1.4;cursor:pointer';
    b.addEventListener('click',()=>{ try{ const t=document.getElementById('t-post'); if(t&&t.click) t.click(); const c=document.getElementById('post-health'); if(c&&c.scrollIntoView) c.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){} }); nav.parentNode.insertBefore(b,nav); }
  const t=T('hl_band'); if(b.textContent!==t) b.textContent=t; return 'on'; }
function hpHlUi(now){ if(typeof document==='undefined'||!document.getElementById) return ''; const card=document.getElementById('post-health'), box=document.getElementById('hl-rows'); if(!card||!box) return '';
  if(typeof hpBfOn==='function'&&hpBfOn()){ card.style.display='none'; try{ hpHlBand(now); }catch(e){} return 'lodge'; }
  const key=hpHlNow(); if(!key){ card.style.display='none'; try{ hpHlBand(now); }catch(e){} return 'off'; } card.style.display=''; try{ hpHlUpKick(now); }catch(e){}
  const E=hpHlEval(key,now), L=(typeof curLang==='function')?curLang():'', k=[key,L,E.bad].concat(E.items.map(x=>x.st+':'+x.t)).join('\n'); try{ hpHlBand(now); }catch(e){} if(box.getAttribute('data-k')===k) return 'same'; box.setAttribute('data-k',k); box.textContent='';
  const mk=(t,cls,txt)=>{ const e=document.createElement(t); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }, col={ok:'var(--teal)',bad:'var(--amber)',na:'var(--dim)'};
  const head=mk('div','kv'), nm=mk('span','mono',key), sm=mk('span','',hpHlSumText(E)); nm.style.cssText='color:var(--teal);font-weight:700;overflow-wrap:anywhere'; sm.id='hl-sum'; sm.style.cssText='margin-left:10px;color:'+(E.badAll?col.bad:(E.okN?col.ok:col.na)); head.appendChild(nm); head.appendChild(sm); box.appendChild(head);
  const tb=mk('table','hl-t'), tbd=mk('tbody'); tb.id='hl-table'; let no=0;
  for(const x of E.items){ const r=mk('tr'); r.id='hl-'+x.k; r.appendChild(mk('td','n',String(++no))); r.appendChild(mk('td','l',T(HP_HL_LABEL[x.k]))); const m=mk('td','m',HP_HL_MARK[x.st]); m.style.color=col[x.st]; r.appendChild(m); r.appendChild(mk('td','t',x.t)); tbd.appendChild(r); } tb.appendChild(tbd); box.appendChild(tb);
  if(E.bad>=HP_HL_BAD.band){ const n=mk('div','note',T('hl_move_nt')); n.id='hl-move-nt'; n.style.color='var(--amber)'; box.appendChild(n); const row=mk('div','row'), b=mk('button','b',T('btn_pt_move')); b.type='button'; b.id='btn-hl-move'; b.addEventListener('click',()=>{ try{ hpMoveOpen(); }catch(e){} }); row.appendChild(b); box.appendChild(row); }
  return 'drawn'; }

const HP_LG_KEY='p2p_log', HP_LG_KEEP=800, HP_LG_DAYS=7*864e5, HP_LG_EVERY=5000;
let HP_LG_LOADED=false, HP_LG_SIG='';

function hpLgReady(){ try{ if(typeof hpHGet!=='function'||typeof hpHSet!=='function'||typeof HP_LOG_LINES==='undefined') return false;
  const vault=(typeof hpVaultOn==='function')?!!hpVaultOn():(typeof hpHDisk==='function'&&!!hpHDisk()); return !(vault&&!(typeof HPH_OPENED!=='undefined'&&HPH_OPENED)); }catch(e){ return false; } }
function hpLgSigNow(){ const n=HP_LOG_LINES.length; return n+'|'+(n?HP_LOG_LINES[n-1]:''); }
function hpLgDraw(){ try{ const el=document.getElementById('log'); if(el){ el.textContent=HP_LOG_LINES.join(''); el.scrollTop=el.scrollHeight; } }catch(e){} }
function hpLgLoad(now){ if(HP_LG_LOADED||!hpLgReady()) return -1; HP_LG_LOADED=true; now=Number(now)||Date.now();
  let o=null; try{ const s=hpHGet(HP_LG_KEY); o=s?JSON.parse(s):null; }catch(e){ o=null; }
  if(!o||!Array.isArray(o.lines)||!o.lines.length||!(Number(o.at)>0)||now-Number(o.at)>HP_LG_DAYS||Number(o.at)>now+600e3) return 0;
  const old=o.lines.filter(x=>typeof x==='string').slice(-HP_LG_KEEP), d=new Date(Number(o.at)), p2=n=>String(n).padStart(2,'0');
  old.push('―― ここで読み込み直した（上は前のログの控え。'+(d.getMonth()+1)+'/'+d.getDate()+' '+p2(d.getHours())+':'+p2(d.getMinutes())+' まで）――\n');
  HP_LOG_LINES.unshift.apply(HP_LOG_LINES,old); hpLgDraw(); return old.length-1; }
function hpLgSave(now){ if(!HP_LG_LOADED||!hpLgReady()) return false; const sig=hpLgSigNow(); if(sig===HP_LG_SIG) return false; HP_LG_SIG=sig;
  try{ if(!HP_LOG_LINES.length){ if(typeof hpHDel==='function') hpHDel(HP_LG_KEY); return true; }
    hpHSet(HP_LG_KEY,JSON.stringify({v:1,at:Number(now)||Date.now(),lines:HP_LOG_LINES.slice(-HP_LG_KEEP)})); return true; }catch(e){ return false; } }
function hpLgTick(now){ try{ hpLgLoad(now); return hpLgSave(now); }catch(e){ return false; } }
function hpLgClear(){ try{ HP_LG_SIG=hpLgSigNow(); if(typeof hpHDel==='function'&&hpLgReady()) hpHDel(HP_LG_KEY); return true; }catch(e){ return false; } }
try{ if(typeof hpLogClear==='function'&&!hpLogClear.__hpLg){ const f0=hpLogClear; hpLogClear=function(){ const r=f0.apply(this,arguments); hpLgClear(); return r; }; hpLogClear.__hpLg=1; } }catch(e){}
try{ if(typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'&&typeof setInterval==='function'){ const t=setInterval(hpLgTick,HP_LG_EVERY); if(t&&typeof t.unref==='function') t.unref();
  document.addEventListener('visibilitychange',()=>{ try{ if(document.visibilityState==='hidden') hpLgTick(); }catch(e){} }); } }catch(e){}

const HP_NF_KEY='p2p_nf', HP_NF_ERRS={'not owner':1,'bad push':1,'no pushkey':1,'killed':1};
let HP_NF_WAIT=8000, HP_NF_W=null, HP_NF_BUSY=false, HP_NF_SEEN=null, HP_NF_MSG='';
function hpNfIos(){ try{ const ua=String(navigator.userAgent||''); return /iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&Number(navigator.maxTouchPoints)>1); }catch(e){ return false; } }
function hpNfStandalone(){ try{ return !!navigator.standalone||!!(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches); }catch(e){ return false; } }
function hpNfCan(){ try{ return typeof navigator!=='undefined'&&!!navigator.serviceWorker&&typeof window!=='undefined'&&('PushManager' in window)&&typeof Notification!=='undefined'; }catch(e){ return false; } }
function hpNfGet(){ try{ const o=JSON.parse(localStorage.getItem(HP_NF_KEY)||'null'); return (o&&typeof o==='object')?o:{}; }catch(e){ return {}; } }
function hpNfSet(o){ try{ if(o&&o.on) localStorage.setItem(HP_NF_KEY,JSON.stringify(o)); else localStorage.removeItem(HP_NF_KEY); }catch(e){} }
function hpNfB64(u8){ let s=''; for(const b of u8) s+=String.fromCharCode(b); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function hpNfBytes(k){ const s=atob(String(k).replace(/-/g,'+').replace(/_/g,'/')); const u=new Uint8Array(s.length); for(let i=0;i<s.length;i++) u[i]=s.charCodeAt(i); return u; }

function hpNfWhy(){ try{
  if(typeof ID==='undefined'||!ID) return 'nf_e_noid';
  if(hpNfIos()&&!hpNfStandalone()) return 'nf_e_ios';
  if(!hpNfCan()) return 'nf_e_nosup';

  if(typeof hpPostHave==='function'&&!hpPostHave()) return 'nf_e_nobox';
  return ''; }catch(e){ return 'nf_e_nosup'; } }
function hpNfUp(){ try{ return typeof POST!=='undefined'&&!!POST&&!!POST.up&&!!POST.client&&!POST.notOwner; }catch(e){ return false; } }

function hpNfOnReply(o){ const W=HP_NF_W; if(!W||!o) return; if(o.ok===W.wait){ W.ok=true; W.res=o; } else if(o.err&&HP_NF_ERRS[o.err]) W.err=String(o.err); }
async function hpNfReq(msg){
  if(!hpNfUp()) throw new Error('郵便受けにつながっていない');
  if(HP_NF_W) throw new Error('通知の頼みが重なった');
  const W={wait:msg.op,ok:false,err:null,res:null}; HP_NF_W=W;
  try{ await hpSend(msg); const t0=Date.now(); while(!W.ok&&!W.err&&Date.now()-t0<HP_NF_WAIT) await new Promise(r=>setTimeout(r,60)); } finally{ HP_NF_W=null; }
  if(W.err) throw new Error(W.err);
  if(!W.ok){ const e=new Error('郵便受けから返事がない'); e.hpOld=1; throw e; }
  return W.res; }

async function hpNfOn(ask){
  const why=hpNfWhy(); if(why) return why;
  if(!hpNfUp()) return 'nf_e_off';
  let perm=''; try{ perm=String(Notification.permission||''); if(perm!=='granted'&&ask) perm=String(await Notification.requestPermission()); }catch(e){ perm=''; }
  if(perm!=='granted') return 'nf_e_denied';
  let k=null; try{ k=await hpNfReq({op:'pushkey'}); }catch(e){ hpLog('通知：郵便受けの鍵をもらえない（'+((e&&e.message)||e)+'）'); return (e&&e.hpOld)?'nf_e_old':'nf_e_fail'; }
  if(!k||typeof k.key!=='string'||k.key.length<80) return 'nf_e_fail';
  try{
    const reg=await navigator.serviceWorker.ready; let sub=await reg.pushManager.getSubscription();
    if(sub){ let cur=''; try{ cur=(sub.options&&sub.options.applicationServerKey)?hpNfB64(new Uint8Array(sub.options.applicationServerKey)):''; }catch(e){} if(cur!==k.key){ try{ await sub.unsubscribe(); }catch(e){} sub=null; } }
    if(!sub) sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:hpNfBytes(k.key)});
    const ps={op:'pushset',endpoint:String(sub.endpoint),site:String(location.origin)};
    try{ if(typeof sub.getKey==='function'){ const k1=sub.getKey('p256dh'), k2=sub.getKey('auth'); if(k1&&k2){ ps.p256dh=hpNfB64(new Uint8Array(k1)); ps.auth=hpNfB64(new Uint8Array(k2)); } } }catch(e){}
    await hpNfReq(ps);
    hpNfSet({on:1,url:String(POST.url||''),key:k.key}); hpLog('通知：この端末の宛先を郵便受けに預けた'); return '';
  }catch(e){ hpLog('通知：入れられない（'+((e&&e.message)||e)+'）'); return 'nf_e_fail'; } }
async function hpNfOff(){
  try{ if(hpNfCan()){ const reg=await navigator.serviceWorker.ready, sub=await reg.pushManager.getSubscription(); if(sub) await sub.unsubscribe(); } }catch(e){}
  try{ if(hpNfUp()) await hpNfReq({op:'pushdel'}); }catch(e){ hpLog('通知：郵便受けの宛先を捨てられない（'+((e&&e.message)||e)+'）。ブラウザの宛先は捨てたので、合図は届かない'); }
  hpNfSet(null); hpLog('通知：切った'); return ''; }

async function hpNfCheck(){
  const s=hpNfGet(); if(!s.on||HP_NF_BUSY||hpNfWhy()||!hpNfUp()) return 0;
  try{ if(Notification.permission!=='granted') return 0; }catch(e){ return 0; }
  if(HP_NF_SEEN===POST.client) return 0; HP_NF_SEEN=POST.client; HP_NF_BUSY=true;
  try{ let k=null; try{ k=await hpNfReq({op:'pushkey'}); }catch(e){ return -1; }
    if(k&&k.on===true&&k.key===s.key&&s.url===String(POST.url||'')) return 0;
    const r=await hpNfOn(false); if(r) hpLog('通知：預け直せない（'+r+'）'); return r?-1:1;
  } finally{ HP_NF_BUSY=false; } }
function hpNfUi(){ try{
  if(typeof document==='undefined'||!document.getElementById) return ''; const x=document.getElementById('hp-nf'), m=document.getElementById('nf-msg'); if(!x) return '';
  const why=hpNfWhy(), s=hpNfGet(); let granted=false; try{ granted=Notification.permission==='granted'; }catch(e){}
  if(!HP_NF_BUSY){ x.checked=!why&&!!s.on&&granted; x.disabled=!!why; }
  const t=HP_NF_MSG||((why&&why!=='nf_e_noid')?T(why):''); if(m&&m.textContent!==t) m.textContent=t;
  if(!x.__nf){ x.__nf=1; x.addEventListener('change',()=>{ hpNfFlip(!!x.checked).catch(()=>{}); }); }
  return why||'ok'; }catch(e){ return ''; } }
async function hpNfFlip(on){
  if(HP_NF_BUSY) return ''; HP_NF_BUSY=true; HP_NF_MSG=T('nf_working'); const x=document.getElementById('hp-nf'); if(x) x.disabled=true; hpNfUi();
  let r=''; try{ r=on?await hpNfOn(true):await hpNfOff(); }catch(e){ r='nf_e_fail'; }
  HP_NF_BUSY=false; HP_NF_MSG=r?T(r):T(on?'nf_on':'nf_off'); try{ if(typeof hpBlAfterNf==='function') hpBlAfterNf(on,r); }catch(e){}   try{ HP_NF_SEEN=(typeof POST!=='undefined'&&POST)?POST.client:null; }catch(e){} hpNfUi(); return r; }
try{ if(typeof document!=='undefined'&&typeof setInterval==='function'&&typeof window!=='undefined'){ setTimeout(()=>{ try{ hpNfUi(); }catch(e){} },800); setInterval(()=>{ try{ hpNfUi(); hpNfCheck().catch(()=>{}); }catch(e){} },20000); } }catch(e){}

const HP_BL_KEY='p2p_bell', HP_BL_NF='p2p_bell_nf', HP_BL_TAG='hp-letter', HP_BL_ON='\u{1F514}', HP_BL_OFF='\u{1F515}';
let HP_BL_ASKED=false, HP_BL_BUSY=false, HP_BL_LAST=0, HP_BL_SEEN=null;
function hpBlLs(k,v){ try{ if(v===undefined) return localStorage.getItem(k); if(v===null) localStorage.removeItem(k); else localStorage.setItem(k,String(v)); }catch(e){} return null; }
function hpBlOff(){ return hpBlLs(HP_BL_KEY)==='0'; }
function hpBlWant(){ return String(hpBlLs(HP_BL_NF)||''); }
function hpBlPerm(){ try{ return (typeof Notification!=='undefined')?String(Notification.permission||'default'):'none'; }catch(e){ return 'none'; } }
function hpBlCanAsk(){ try{ return hpBlPerm()==='default'&&!(hpNfIos()&&!hpNfStandalone()); }catch(e){ return false; } }

function hpBlState(){ if(hpBlOff()) return 'off'; if(hpBlPerm()!=='granted') return 'dim'; return (!hpNfGet().on&&hpBlWant())?'warn':'on'; }
function hpBlDimWhy(){ const p=hpBlPerm(); try{ if(hpNfIos()&&!hpNfStandalone()) return 'nf_e_ios'; }catch(e){} return p==='none'?'nf_e_nosup':p==='denied'?'nf_e_denied':'bl_e_ask'; }
function hpBlUnread(){ try{ const lo=lastOpenLoad(); let n=0; for(const c of contacts()){ const t=lo[c.address]||0; for(const x of histLoad(c.address)){ if(x&&x.d==='p'&&histOrd(x)>t) n++; } } return n; }catch(e){ return 0; } }
function hpBlHidden(){ try{ return document.visibilityState!=='visible'; }catch(e){ return false; } }

function hpBlCard(){ try{
  if(hpBlOff()||!hpBlHidden()||hpBlPerm()!=='granted') return false;
  const n=hpBlUnread(), now=Date.now(), o={body:n>0?TF('bl_card_n',{n:n}):T('bl_card_1'),tag:HP_BL_TAG,renotify:now-HP_BL_LAST>2000,icon:'/icons/icon-192.png',badge:'/icons/icon-192.png'}; HP_BL_LAST=now;
  if(navigator.serviceWorker&&navigator.serviceWorker.ready){ navigator.serviceWorker.ready.then(reg=>reg.showNotification('Handpost',o)).catch(()=>{}); return true; }
  const nt=new Notification('Handpost',o); nt.onclick=()=>{ try{ window.focus(); nt.close(); }catch(e){} }; return true;
}catch(e){ return false; } }
function hpBlClear(){ try{ if(hpBlPerm()!=='granted'||!navigator.serviceWorker||!navigator.serviceWorker.ready) return; navigator.serviceWorker.ready.then(reg=>reg.getNotifications({tag:HP_BL_TAG})).then(l=>{ for(const x of (l||[])) x.close(); }).catch(()=>{}); }catch(e){} }

async function hpBlPush(){ let r='nf_e_fail'; HP_NF_BUSY=true; try{ r=await hpNfOn(false); }catch(e){} finally{ HP_NF_BUSY=false; } hpBlLs(HP_BL_NF,r?r:null); try{ HP_BL_SEEN=(typeof POST!=='undefined'&&POST)?POST.client:null; }catch(e){} return r; }

async function hpBlTap(){
  if(HP_BL_BUSY||HP_NF_BUSY) return ''; HP_BL_BUSY=true; let msg='';
  try{
    const st=hpBlState(), ask=hpBlCanAsk()&&!HP_BL_ASKED;
    if(st==='off'||(st==='dim'&&ask)){
      hpBlLs(HP_BL_KEY,null); hpBlUi();
      let fresh=false; if(ask){ HP_BL_ASKED=true; try{ fresh=String(await Notification.requestPermission())==='granted'; }catch(e){} }
      if(hpBlPerm()==='granted'){ let why=''; if(!hpNfGet().on&&(fresh||hpBlWant())) why=await hpBlPush(); msg=why?TF('bl_t_open',{why:T(why)}):T('bl_t_on'); }
      else msg=TF('bl_t_snd',{why:T(hpBlDimWhy())});
      hpLog('通知：ベルをオンにした（'+hpBlState()+'）');
    } else {
      const want=hpNfGet().on?'1':hpBlWant(); hpBlLs(HP_BL_KEY,'0'); hpBlUi();
      if(hpNfGet().on){ HP_NF_BUSY=true; try{ await hpNfOff(); }catch(e){} finally{ HP_NF_BUSY=false; } }
      hpBlLs(HP_BL_NF,want?want:null); hpBlClear(); msg=T('bl_t_off'); hpLog('通知：ベルをオフにした（音もカードも出さない）');
    }
  }catch(e){ try{ hpLog('通知：ベルを切り替えられない（'+((e&&e.message)||e)+'）'); }catch(x){} }
  HP_BL_BUSY=false; const st2=hpBlUi(); try{ hpNfUi(); }catch(e){} try{ if(msg&&typeof hpToast==='function') hpToast(msg,st2==='on'||st2==='off'?2500:6000); }catch(e){} return st2; }

function hpBlAfterNf(on,r){ if(on){ if(!r){ hpBlLs(HP_BL_KEY,null); hpBlLs(HP_BL_NF,null); } else if(!hpBlOff()) hpBlLs(HP_BL_NF,r); } else hpBlLs(HP_BL_NF,null); hpBlUi(); }

async function hpBlRetry(){ try{ if(HP_BL_BUSY||HP_NF_BUSY||hpBlState()!=='warn'||!hpNfUp()||HP_BL_SEEN===POST.client) return 0; HP_BL_SEEN=POST.client; const r=await hpBlPush(); hpBlUi(); try{ hpNfUi(); }catch(e){} return r?-1:1; }catch(e){ return -1; } }
function hpBlUi(){ try{
  if(typeof document==='undefined'||!document.getElementById) return ''; const b=document.getElementById('btn-bell'), st=hpBlState(); if(!b) return st;
  const ic=st==='off'?HP_BL_OFF:HP_BL_ON; if(b.textContent!==ic) b.textContent=ic; if(b.className!==st) b.className=st; b.setAttribute('aria-pressed',st==='off'?'false':'true');
  if(!b.__bl){ b.__bl=1; b.addEventListener('click',()=>{ hpBlTap().catch(()=>{}); }); }
  return st; }catch(e){ return ''; } }

function hpBlWrap(f){ const w=function(kind){ if(hpBlOff()) return; try{ if(kind===undefined||kind==='msg') hpBlCard(); }catch(e){} return f.apply(this,arguments); }; w.__bl=1; return w; }

function hpBlHook(){ try{ if(typeof window!=='undefined'&&typeof window.notifySound==='function'&&!window.notifySound.__bl){ window.notifySound=hpBlWrap(window.notifySound); return true; } }catch(e){} return false; }
hpBlHook();
try{ if(typeof document!=='undefined'&&typeof setInterval==='function'&&typeof window!=='undefined'){ setTimeout(()=>{ try{ hpBlHook(); hpBlUi(); }catch(e){} },300); setInterval(()=>{ try{ hpBlHook(); hpBlUi(); hpBlRetry().catch(()=>{}); }catch(e){} },20000); try{ window.addEventListener('load',()=>{ hpBlHook(); }); }catch(e){}
  document.addEventListener('visibilitychange',()=>{ try{ if(!hpBlHidden()){ hpBlClear(); hpBlUi(); } }catch(e){} }); } }catch(e){}

const HP_MB_MAX=10*1024*1024, HP_MB_BODY=44000, HP_MB_GROUP=8, HP_MB_C=32000, HP_MB_KEEP=7*86400e3, HP_MB_MAXN=Math.ceil(HP_MB_MAX/HP_MB_C)+HP_MB_GROUP+1, HP_MB_KEY='p2p_mbrx';
let HP_MB_GAP=2100;
const HP_MB_BUSY=new Set();
let HP_MB_RX=null;
function hpMbSize(m){ const s=Number(((m&&(m.img||m.file))||{}).size)||0; return s>=1048576?(Math.round(s/104857.6)/10)+' MB':Math.max(1,Math.round(s/1024))+' KB'; }
function hpMbCan(peer,m){
  try{
    const it=m&&(m.img||m.file); if(!it||!it.id||!(Number(it.size)>0)||Number(it.size)>HP_MB_MAX) return false;
    if(m.file&&(m.file.risk||(typeof hpFileRisky==='function'&&hpFileRisky(m.file.name,m.file.mime)))) return false;
    if(HP_MB_BUSY.has(m.ts)) return false;
    return !!(typeof hpCardOf==='function'&&hpCardOf(peer));
  }catch(e){ return false; }
}
function hpMbB64(u8){ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,Math.min(i+0x8000,u8.length))); return btoa(s); }
function hpMbUn64(s){ const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
function hpMbPad(o){ o.z=''; const L=JSON.stringify(JSON.stringify(o)).length; if(L>HP_MB_BODY) throw new Error('切れが大きすぎる（'+L+' 文字）'); o.z='0'.repeat(HP_MB_BODY-L); return JSON.stringify(o); }

function hpMbPieces(bytes, head){
  const t0={ v:1, type:'mbp', bid:head.bid, i:0, n:99999, N:99999, ts:head.ts, k:head.k, meta:head.meta, size:head.size, d:'' };
  const room=HP_MB_BODY-JSON.stringify(JSON.stringify(Object.assign({},t0,{z:''}))).length-8;
  const c0=Math.max(0,Math.floor(room/4)*3);
  const n=1+(bytes.length>c0?Math.ceil((bytes.length-c0)/HP_MB_C):0), N=Math.ceil(n/HP_MB_GROUP)*HP_MB_GROUP;
  const out=[];
  out.push(hpMbPad(Object.assign({},t0,{n:n,N:N,d:hpMbB64(bytes.subarray(0,Math.min(c0,bytes.length)))})));
  for(let i=1;i<n;i++){ const a=c0+(i-1)*HP_MB_C; out.push(hpMbPad({ v:1, type:'mbp', bid:head.bid, i:i, n:n, N:N, d:hpMbB64(bytes.subarray(a,Math.min(a+HP_MB_C,bytes.length))) })); }
  for(let i=n;i<N;i++) out.push(hpMbPad({ v:1, type:'mbp', bid:head.bid, i:i, n:n, N:N, x:1 }));
  return out;
}
function hpMbHex(k){ const u=new Uint8Array(k); crypto.getRandomValues(u); return Array.from(u,b=>b.toString(16).padStart(2,'0')).join(''); }

async function hpMbSendAsk(peer, ts, lab){
  const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||!hpMbCan(peer,m)) return 'no';
  const it=m.img||m.file, n=Math.ceil(Math.ceil((Number(it.size)||0)/HP_MB_C+1)/HP_MB_GROUP)*HP_MB_GROUP, min=Math.max(1,Math.ceil(n*HP_MB_GAP/60000));
  let ok=false; try{ ok=await hpAsk({ text:TF('cf_mb_send',{size:hpMbSize(m),n:n,min:min}), ok:T('btn_mb_go') }); }catch(e){ ok=false; }
  if(!ok) return 'no';
  return await hpMbSend(peer, ts, lab);
}
async function hpMbSend(peer, ts, lab){
  const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||!m.p||m.x||!hpMbCan(peer,m)) return 'no';
  const it=m.img||m.file, card=hpCardOf(peer);
  const blob=await blobGet(it.id); if(!blob){ hpLog('郵便受けで送れない（本体がこの端末に無い）'); if(lab) lab.textContent=T('mb_e_gone'); return 'gone'; }
  HP_MB_BUSY.add(ts);
  try{
    const bytes=new Uint8Array(await blob.arrayBuffer()), bid=hpMbHex(8);
    const meta=m.img?{ id:it.id, w:it.w, h:it.h, mime:it.mime||'image/jpeg', thumb:it.thumb }:{ id:it.id, name:it.name, mime:it.mime||'' };
    const bodies=hpMbPieces(bytes,{ bid:bid, ts:ts, k:m.img?'img':'file', meta:meta, size:bytes.length });
    hpLog('郵便受けで送り始めた（'+Math.round(bytes.length/1024)+' KB・切れ '+bodies.length+' 通）→ '+nickOf(peer));
    for(let i=0;i<bodies.length;i++){
      for(let tries=0;;tries++){
        try{ await hpPut(card, bodies[i], 'msg', (i===bodies.length-1)?{ring:true}:undefined); break; }
        catch(e){ const w=String((e&&(e.hpWhy||e.message))||e); if(w==='rate limit'&&tries<20){ await sleep(5000); continue; } throw e; }
      }
      if(lab) lab.textContent=TF('mb_sending',{i:i+1,n:bodies.length});
      if(i<bodies.length-1&&HP_MB_GAP>0) await sleep(HP_MB_GAP);
    }
    hpHistPatch(peer, ts, x=>{ delete x.p; delete x.hf; x.hp={ id:'mb:'+bid, exp:Date.now()+HP_MB_KEEP }; x.mb=1; });
    hpLog('郵便受けで送り終えた（切れ '+bodies.length+' 通）→ '+nickOf(peer));
    try{ if(typeof hpSceneLetter==='function') hpSceneLetter('post','out'); }catch(_){}
    try{ if(typeof findMsgEl==='function'){ const el=findMsgEl(ts); if(el){ const fr=el.querySelector('.hpfail'); if(fr) fr.remove(); } } }catch(_){}
    try{ hpMarkRows(peer); hpDecorate(peer); }catch(_){}
    return 'ok';
  }catch(e){
    const w=String((e&&(e.hpWhy||e.message))||e); hpLog('郵便受けで送れない '+w);
    if(lab) lab.textContent=T(w==='post full'?'mb_e_full':'mb_e_fail');
    return 'err';
  }finally{ HP_MB_BUSY.delete(ts); }
}

function hpMbLoad(){
  if(HP_MB_RX) return HP_MB_RX;
  let o=null; try{ if(typeof hpHGet==='function'){ const s=hpHGet(HP_MB_KEY); o=s?JSON.parse(s):null; } }catch(e){ o=null; }
  HP_MB_RX={ rx:(o&&o.rx&&typeof o.rx==='object')?o.rx:{}, done:(o&&o.done&&typeof o.done==='object')?o.done:{} };
  const now=Date.now(), old=[];
  for(const b of Object.keys(HP_MB_RX.rx)){ const R=HP_MB_RX.rx[b]; if(!R||!(now-Number(R.at)<HP_MB_KEEP)){ old.push(b); delete HP_MB_RX.rx[b]; } }
  for(const b of Object.keys(HP_MB_RX.done)){ if(!(now-Number(HP_MB_RX.done[b])<HP_MB_KEEP)) delete HP_MB_RX.done[b]; }
  if(old.length) hpMbDropParts(old.map(b=>({bid:b,N:HP_MB_MAXN}))).catch(()=>{});
  return HP_MB_RX;
}
function hpMbSave(){ try{ if(typeof hpHSet==='function') hpHSet(HP_MB_KEY, JSON.stringify(HP_MB_RX)); }catch(e){} }
function hpMbPart(bid,i){ return 'mbp:'+bid+':'+i; }
async function hpMbDropParts(list){ const ids=[]; for(const x of list) for(let i=0;i<Math.min(Number(x.N)||0,HP_MB_MAXN);i++) ids.push(hpMbPart(x.bid,i)); try{ if(typeof hpHBlobDrop==='function') await hpHBlobDrop(ids); else if(typeof BLOBMEM!=='undefined'&&typeof blobKey==='function') for(const id of ids) BLOBMEM.delete(blobKey(id)); }catch(e){} }
async function hpMbIn(r,o){
  if(!ID) return 'noid';
  const from=r.from, S=hpMbLoad();
  if(from===ID.address) return 'self';
  if(!isContact(from)){ hpLog('住所録に無い相手からの本体の切れ（捨てた）'); return 'stranger'; }
  const c=ID.contacts.find(x=>x.address===from); if(c&&c.pubKey&&c.pubKey!==r.fromMaster){ hpLog('マスター鍵が連絡先のものと違う本体の切れ（捨てた）'); return 'master'; }
  const bid=o.bid, i=o.i, n=o.n, N=o.N;
  if(typeof bid!=='string'||!/^[0-9a-f]{16}$/.test(bid)||!Number.isInteger(i)||!Number.isInteger(n)||!Number.isInteger(N)||n<1||N<n||N>HP_MB_MAXN||i<0||i>=N){ hpLog('本体の切れの形が違う（捨てた）'); return 'form'; }
  if(S.done[bid]) return 'late';
  let R=S.rx[bid]; if(!R){ R={ from:from, N:N, n:n, head:null, got:[], at:Date.now() }; S.rx[bid]=R; }
  if(R.from!==from||R.N!==N||R.n!==n) return 'mix';
  if(R.got.indexOf(i)<0){
    if(i<n){
      if(typeof o.d!=='string') return 'form';
      if(i===0){ const mt=o.meta||{}; if(!Number.isFinite(o.ts)||!(o.size>0)||o.size>HP_MB_MAX||(o.k!=='img'&&o.k!=='file')||typeof mt.id!=='string'||!/^[0-9a-f]{32}$/.test(mt.id)) return 'form';
        R.head={ ts:o.ts, k:o.k, size:o.size, meta:(o.k==='img')?{ id:mt.id, w:Number(mt.w)||0, h:Number(mt.h)||0, mime:String(mt.mime||'image/jpeg').slice(0,64), thumb:(typeof mt.thumb==='string'&&/^data:image\//.test(mt.thumb))?mt.thumb.slice(0,40000):'' }:{ id:mt.id, name:String(mt.name||'file').slice(0,200), mime:String(mt.mime||'').slice(0,100) }, fd:(typeof hpFdOf==='function')?hpFdOf(r.fromDev):'' }; }
      let u; try{ u=hpMbUn64(o.d); }catch(e){ return 'form'; }
      await blobPut(hpMbPart(bid,i), new Blob([u]));
    }
    R.got.push(i);
  }
  hpMbSave();
  for(let k=0;k<n;k++) if(R.got.indexOf(k)<0) return 'wait';
  if(!R.head) return 'wait';
  return await hpMbDone(bid,R);
}
async function hpMbDone(bid,R){
  const S=hpMbLoad(), h=R.head, from=R.from;
  const parts=[]; for(let k=0;k<R.n;k++){ const b=await blobGet(hpMbPart(bid,k)); if(!b){ hpLog('本体の切れが手元から消えていた（'+k+'）'); return 'wait'; } parts.push(b); }
  const blob=new Blob(parts,{type:h.meta.mime||''}).slice(0,h.size,h.meta.mime||'');
  delete S.rx[bid]; S.done[bid]=Date.now(); hpMbSave(); hpMbDropParts([{bid:bid,N:R.n}]).catch(()=>{});
  let id=''; try{ id=await imgIdOf(blob); }catch(e){ id=''; }
  if(id!==h.meta.id||blob.size!==h.size){ hpLog('郵便受けで届いた本体の番号が合わない（捨てた）← '+nickOf(from)); return 'bad'; }
  if(histVoided(from,h.ts)){ hpLog('取り消された本体が郵便受けで届いた（入れない）← '+nickOf(from)); return 'void'; }
  if(histLoad(from).some(x=>x.ts===h.ts&&x.d==='p')){ hpLog('同じ写真・ファイルが既にある（重ねない）'); return 'dup'; }
  const extra={ fd:h.fd||'' };
  if(h.k==='img'){
    await blobPut(id,blob); const img={ id:id, w:h.meta.w, h:h.meta.h, size:h.size, mime:h.meta.mime, thumb:h.meta.thumb };
    histAdd(from,'p','',h.ts,0,img,null,extra);
    if(CURPEER===from&&CONV_OPEN){ try{ addMsgAt('peer','',nickOf(from),h.ts,0,0,0,img); }catch(e){} try{ hpReadSoon(from); }catch(e){} }
  } else {
    const risk=(typeof hpFileRisky==='function')&&!!hpFileRisky(h.meta.name,h.meta.mime); if(!risk) await blobPut(id,blob);
    const meta={ id:id, name:h.meta.name, size:h.size, mime:h.meta.mime }; if(risk) meta.risk=1;
    histAdd(from,'p','',h.ts,0,null,meta,extra);
    if(CURPEER===from&&CONV_OPEN){ try{ addMsgAt('peer','',nickOf(from),h.ts,0,0,0,null,meta); }catch(e){} try{ hpReadSoon(from); }catch(e){} }
  }
  try{ if(typeof hpSceneLetter==='function') hpSceneLetter('post','in'); }catch(_){}
  try{ notifySound('msg'); }catch(e){} try{ updateBadges(); }catch(e){}
  hpLog((h.k==='img'?'写真':'ファイル')+'の本体が郵便受けで届いた（'+Math.round(h.size/1024)+' KB）← '+nickOf(from));
  return 'ok';
}

let HP_LS_SENT='', HP_LS_CL=null;
function hpLsWant(){ try{ if(typeof ID==='undefined'||!ID||!ID.lease||ID.lease.gone) return 0; const x=Number(ID.lease.exp)||0; return x>Date.now()?x:0; }catch(e){ return 0; } }
async function hpLsTell(){
  try{ if(!hpNfUp()) return 0; }catch(e){ return 0; }
  const x=hpLsWant(); if(!x) return 0;
  const k=String(POST.url||'')+'|'+x; if(HP_LS_SENT===k&&HP_LS_CL===POST.client) return 0;
  HP_LS_SENT=k; HP_LS_CL=POST.client;
  try{ await hpSend({op:'lease',exp:x}); }catch(e){ HP_LS_SENT=''; return -1; }
  let t=''; try{ t=hpLeaseText(); }catch(e){ t=String(x); }
  hpLog('郵便受けに期限を預けた（'+t+'。7 日前と 1 日前に通知）'); return 1;
}

let HP_LS_KICK=null;
function hpLsKick(){ try{ if(typeof POST==='undefined'||!POST||!POST.up||!POST.client||POST.notOwner||!POST.claimedId) return 0; if(HP_LS_KICK===POST.client) return 0; HP_LS_KICK=POST.client;
  try{ hpNfCheck().catch(()=>{}); }catch(e){} try{ hpLsTell().catch(()=>{}); }catch(e){} return 1; }catch(e){ return 0; } }
try{ if(typeof document!=='undefined'&&typeof setInterval==='function'&&typeof window!=='undefined'){ setTimeout(()=>{ hpLsTell().catch(()=>{}); },5000); setInterval(()=>{ hpLsTell().catch(()=>{}); },20000); setInterval(()=>{ hpLsKick(); },2000); } }catch(e){}

const HP_CFG_TTL=3650*864e5, HP_CFG_LIMIT=20000, HP_CFG_VER=1; let HP_CFG_KICK=null, HP_CFG_URL='';
function hpCfgDone(u){ try{ return !!(ID&&ID.postCfg&&ID.postCfg[u]===HP_CFG_VER); }catch(e){ return false; } }
function hpCfgKick(){ try{ if(typeof POST==='undefined'||!POST||!POST.up||!POST.client||POST.notOwner||!POST.claimedId||!POST.url) return 0; if(HP_CFG_KICK===POST.client||hpCfgDone(POST.url)) return 0; HP_CFG_KICK=POST.client; HP_CFG_URL=String(POST.url);
  hpSend({op:'config',ttl:{msg:HP_CFG_TTL},limit:HP_CFG_LIMIT}).catch(()=>{ HP_CFG_KICK=null; }); return 1; }catch(e){ return 0; } }
function hpCfgOnReply(o){ try{ if(!o||o.ok!=='config'||!HP_CFG_URL) return false; const ttl=Number(o.ttl&&o.ttl.msg)||0, lim=Number(o.limit)||0; if(ttl<HP_CFG_TTL||lim<HP_CFG_LIMIT) return false;
  if(!ID.postCfg||typeof ID.postCfg!=='object'||Array.isArray(ID.postCfg)) ID.postCfg={}; const ks=Object.keys(ID.postCfg); if(ks.length>=8) delete ID.postCfg[ks[0]]; ID.postCfg[HP_CFG_URL]=HP_CFG_VER; saveID();
  const gb=Number(o.capacity)>0?(Math.round(Number(o.capacity)/1073741824*10)/10)+' GB':'?'; hpLog('郵便受けの設定：取りに来ない端末の手紙も契約が切れるまで取っておく・1 台 '+lim+' 通まで（容量 '+gb+'）'); return true; }catch(e){ return false; } }
try{ if(typeof hpLinkOnReply==='function'){ const f=hpLinkOnReply; hpLinkOnReply=function(o){ const r=f.apply(this,arguments); try{ hpCfgOnReply(o); }catch(e){} return r; }; } }catch(e){}
try{ if(typeof document!=='undefined'&&typeof setInterval==='function'&&typeof window!=='undefined'){ setInterval(()=>{ hpCfgKick(); },2000); } }catch(e){}

let HP_PG_SENT={c:null,h:'',u:''};
function hpPgObj(k){ if(!ID[k]||typeof ID[k]!=='object'||Array.isArray(ID[k])) ID[k]={}; return ID[k]; }
function hpPgRoster(){ try{ const l=(typeof hpMcRoster==='function')?hpMcRoster():null; return (Array.isArray(l)&&l.length&&l.length<=70)?JSON.parse(JSON.stringify(l)):null; }catch(e){ return null; } }
function hpPgCap(u){ try{ return !!(u&&ID&&ID.postRs&&typeof ID.postRs==='object'&&ID.postRs[u]!==undefined); }catch(e){ return false; } }
function hpPgLastH(l){ try{ return hpRsHash(l[l.length-1]); }catch(e){ return ''; } }
function hpPgResting(dev){ try{ const u=(typeof hpMcBoxOf==='function')?hpMcBoxOf(dev):POST.url, r=ID&&ID.postRest&&ID.postRest[u]; return !!(Array.isArray(r)&&r.indexOf(dev)>=0); }catch(e){ return false; } }
function hpPgKick(){ try{ if(typeof POST==='undefined'||!POST||!POST.up||!POST.client||POST.notOwner||!POST.claimedId||!POST.url||!hpPgCap(POST.url)) return 0;
  const l=hpPgRoster(); if(!l) return 0; const h=hpPgLastH(l); if(!h) return 0; if(ID.postRsH&&ID.postRsH[POST.url]===h) return 0; if(HP_PG_SENT.c===POST.client&&HP_PG_SENT.h===h) return 0;
  HP_PG_SENT={c:POST.client,h:h,u:String(POST.url)}; hpSend({op:'roster',list:l}).catch(()=>{ HP_PG_SENT={c:null,h:'',u:''}; }); return 1; }catch(e){ return 0; } }
function hpPgOnReply(o){ try{ if(!o||typeof POST==='undefined'||!POST||!ID) return false; const u=String(POST.url||'');
  if(o.ok==='roster'&&HP_PG_SENT.u&&typeof o.h==='string'){ const m=hpPgObj('postRsH'), ks=Object.keys(m); if(m[HP_PG_SENT.u]===undefined&&ks.length>=8) delete m[ks[0]]; if(m[HP_PG_SENT.u]!==o.h){ m[HP_PG_SENT.u]=o.h; saveID(); } hpLog('郵便受けの名簿は '+o.n+' 枚目（端末 '+((o.devs||[]).length)+' 台'+(o.pend?'・待ちの申し出 '+o.pend:'')+'）'); return true; }
  if(o.err==='bad roster'){ hpLog('郵便受けが名簿を受け付けなかった（'+String(o.why||'').slice(0,40)+'）'); return true; }
  if(o.ok!=='claim'||typeof o.rs!=='number'||!u) return false;
  let ch=false; const cap=hpPgObj('postRs');
  if(cap[u]===undefined){ const ks=Object.keys(cap); if(ks.length>=8) delete cap[ks[0]]; hpLog('この郵便受けは名簿で名乗れる版（名簿 '+o.rs+' 枚目）'); ch=true; }
  if(cap[u]!==o.rs){ cap[u]=o.rs; ch=true; }
  if(o.rsErr) hpLog('郵便受けが名簿を受け付けなかった（'+String(o.rsErr).slice(0,40)+'）');
  const rl=(Array.isArray(o.rests)?o.rests:[]).filter(d=>typeof d==='string'&&/^ed[0-9a-f]{64}$/.test(d)).sort(), rm=hpPgObj('postRest');
  if((rm[u]||[]).join()!==rl.join()){ if(rl.length) rm[u]=rl; else delete rm[u]; ch=true; hpLog(rl.length?'郵便受けが自分の端末 '+rl.length+' 台を休みにしている（名刺に載せない）':'休みの端末は無くなった'); try{ hpCardDueMark(1); }catch(e){} }
  if(ch) saveID();
  if(Number(o.rested)>0){ hpLog('しばらく使っていなかったので、郵便受けがこの端末を休みにしていた（'+new Date(Number(o.rested)).toLocaleString()+'から）。戻している');
    try{ hpToast(T('rest_back'),8000); }catch(e){} try{ hpCardDueMark(1); }catch(e){}
    try{ setTimeout(()=>{ try{ Promise.resolve(hpHistPull('休みから戻った')).catch(()=>{}); }catch(e){} },1500); }catch(e){} }
  return true; }catch(e){ return false; } }
try{ if(typeof hpClaimMsg==='function'){ const f=hpClaimMsg; hpClaimMsg=async function(){ const m=await f.apply(this,arguments); try{ const l=hpPgRoster(); if(l&&m&&m.op==='claim') m.roster=l; }catch(e){} return m; }; } }catch(e){}
try{ if(typeof hpLinkOnReply==='function'){ const f=hpLinkOnReply; hpLinkOnReply=function(o){ const r=f.apply(this,arguments); try{ hpPgOnReply(o); }catch(e){} return r; }; } }catch(e){}
try{ if(typeof hpCard4Make==='function'){ const f=hpCard4Make; hpCard4Make=async function(o,now){ try{ if(o&&Array.isArray(o.boxes)&&o.boxes.length>1){ const kb=o.boxes.filter((b,i)=>i===0||!hpPgResting(b&&b.dev)); if(kb.length!==o.boxes.length) o=Object.assign({},o,{boxes:kb}); } }catch(e){} return f.call(this,o,now); }; } }catch(e){}
try{ if(typeof document!=='undefined'&&typeof setInterval==='function'&&typeof window!=='undefined'){ setInterval(()=>{ hpPgKick(); },2000); } }catch(e){}

let HP_D2_SHOWN={}, HP_D2_BUSY=false, HP_D2_JT=0;
function hpD2T(ms){ const d=new Date(Number(ms)||0), p=n=>String(n).padStart(2,'0'), s=(typeof hpDateIntl==='function')?hpDateIntl(d.getTime(),'mdhm'):''; if(s) return s; return (d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes()); }
async function hpD2Sk(){ const kp=await hpDevKey(); return {dev:hpHex(kp.publicKey), sk:kp.privateKey.slice(1)}; }
async function hpD2Chain(){ try{ const l=ID&&Array.isArray(ID.roster)?ID.roster:null; if(!l||!l.length) return null; const ch=await hpRsChain(l,Date.now(),Array.isArray(ID.rsCancels)?ID.rsCancels:[]); return (ch&&ch.ok===true&&ch.cur.id===ID.address&&ch.cur.root===ID.publicKey)?{list:l,cur:ch.cur}:null; }catch(e){ return null; } }
function hpD2CanLink(){ try{ if(!ID||hpIsMain()||!hpIsChild()||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||!POST.url) return false; if(!(typeof hpPgCap==='function'&&hpPgCap(POST.url))) return false;
  const last=(Array.isArray(ID.roster)&&ID.roster.length)?ID.roster[ID.roster.length-1]:null; return !!(last&&last.devs.some(d=>d&&d.dev===POST.pub)); }catch(e){ return false; } }
function hpD2Pend(){ return (ID&&Array.isArray(ID.rsPend))?ID.rsPend:[]; }
function hpD2PendSet(list){ ID.rsPend=list.slice(-4); if(!ID.rsPend.length) delete ID.rsPend; }
function hpD2Lbl(dev,label,post){ try{ if(!ID.rsLbl||typeof ID.rsLbl!=='object'||Array.isArray(ID.rsLbl)) ID.rsLbl={}; const ks=Object.keys(ID.rsLbl); if(!ID.rsLbl[dev]&&ks.length>=8) delete ID.rsLbl[ks[0]]; ID.rsLbl[dev]={label:String(label||'').slice(0,32),post:typeof post==='string'?post:''}; }catch(e){} }
async function hpD2Approve(L,q){
  if(!hpD2CanLink()) throw new Error(T('e_link_oldbox'));
  const c=await hpD2Chain(); if(!c) throw new Error('名簿を確かめられない');
  const me=await hpD2Sk(); if(!c.cur.devs.some(d=>d.dev===me.dev)) throw new Error('この端末が名簿に無い');
  if(c.cur.devs.some(d=>d.dev===q.dev)) throw new Error('もう名簿にある端末');
  if(c.cur.devs.length>=HP_RS_MAXDEV) throw new Error(T('e_link_max'));
  const now=Math.max(Date.now(),Number(c.cur.at)+1), devs=c.cur.devs.map(d=>({dev:d.dev,kind:d.kind||'other'})).concat([{dev:q.dev,kind:hpDevKindOf(q.label)}]);
  const base={v:1,id:c.cur.id,root:c.cur.root,n:c.cur.n+1,at:now,prev:hpRsHash(c.cur),devs:devs}, one=c.cur.devs.length===1;
  const rw=hpRsSign(Object.assign({},base,one?{by:'one',sigs:{}}:{by:'wait',wait:{dev:me.dev,at:now},sigs:{}}),me.sk,me.dev);
  const rd=one?null:hpRsSign(Object.assign({},base,{by:'devs',sigs:{}}),me.sk,me.dev);
  const list=c.list.concat([rw]);
  await hpPmReq({op:'roster',list:list});
  hpD2Lbl(q.dev,q.label,POST.url);
  if(one) ID.roster=list; else hpD2PendSet(hpD2Pend().filter(e=>e.h!==hpRsHash(rw)).concat([{h:hpRsHash(rw),rw:rw,rd:rd,dev:q.dev,label:q.label,by:me.dev,byLabel:hpDevLabelGuess(),at:now,post:POST.url}]));
  saveID();
  const card={ v:3, id:ID.address, master:ID.publicKey, post:[POST.url], devices:[q.dev], devSigs:{}, token:JSON.parse(hpIssue(HP_LINK_TTL)), prekeys:[q.pre] };
  const rows=contacts().map(x=>({address:x.address,nick:x.nick||'',pubKey:x.pubKey||null,keyAddedAt:x.keyAddedAt||0,card:x.card||null,cardAt:x.cardAt||0,mt:hpRowMt(x)}));
  const chunks=[]; let cur=[]; for(const x of rows){ cur.push(x); if(JSON.stringify(cur).length>HP_LINK_CHUNK){ cur.pop(); if(cur.length) chunks.push(cur); cur=[x]; } } if(cur.length) chunks.push(cur); const single=chunks.length<=1;
  const mainRow=(ID.link&&ID.link.main&&ID.link.main.dev)?ID.link.main:null;
  const sibs=[{dev:me.dev,devSig:ID.link.devSig||'',label:hpDevLabelGuess(),at:Date.now(),pre:await hpPrekeyPub()}].concat(hpSibs().filter(d=>d&&d.dev!==me.dev&&!(mainRow&&d.dev===mainRow.dev)).map(d=>({dev:d.dev,devSig:d.devSig||'',label:d.label||'',at:d.at||0,pre:d.pre||null})));
  const box6=Object.assign({},(ID.box6&&typeof ID.box6==='object'&&!Array.isArray(ID.box6))?ID.box6:{}); box6[me.dev]={url:POST.url,at:Date.now()};
  await hpPut(card, JSON.stringify({ v:1, type:'welcome', devSig:'', by:me.dev  , rs:list, name:myName()||'', label:q.label, hist:(L.hist!==false)?1:0, main:mainRow, sibs:sibs, box6:box6, contacts:single?(chunks[0]||[]):null, parts:single?0:chunks.length }), 'msg');
  if(!single){ for(let i=0;i<chunks.length;i++) await hpPut(card, JSON.stringify({ v:1, type:'sibc', i:i+1, n:chunks.length, contacts:chunks[i] }), 'msg'); }
  if(!one){ try{ await hpSibPut({v:1,type:'rsadd',rw:rw,rd:rd,label:q.label,byLabel:hpDevLabelGuess(),post:POST.url}); }catch(e){ hpLog('ほかの端末へ承認の頼みを送れない '+e.message); } }
  if(L.hist!==false&&typeof sibHistAsk==='function'){ try{ sibHistAsk(q.dev); }catch(e){} }
  L.done=true; L.req=null; L.d2=one?0:now+HP_RS_WAIT; try{ if(typeof hpLqDrop==='function') hpLqDrop(L); }catch(e){}
  hpLog(one?'名簿に書き足して、端末を追加した（端末 '+q.dev.slice(0,10)+'…）':'名簿に追加の申し出を書いた（端末 '+q.dev.slice(0,10)+'…・ほかの端末の承認か 72 時間で効く）');
  try{ renderDevices(); }catch(e){} try{ hpLinkUi(); }catch(e){}
  return true; }
async function hpD2In(o,r){
  const c=await hpD2Chain(); if(!c) return false; const now=Date.now(), my=POST.pub;
  if(o.type==='rsadd'){
    const rw=o.rw, rd=o.rd; if(!rw||!rd||rw.by!=='wait'||rd.by!=='devs') return false;
    const st=hpRsStep(c.cur,rw,now,ID.rsCancels||[]); if(st.ok!=='wait'){ hpLog('端末の追加の申し出を捨てた（'+(st.why||st.ok)+'）'); return false; }
    const rdBody=Object.assign({},rw,{by:'devs'}); delete rdBody.wait;
    if(hpRsMsg(rd)!==hpRsMsg(Object.assign(rdBody,{sigs:{}}))||!hpRsVer(rd.sigs&&rd.sigs[rw.wait.dev],hpRsMsg(rd),rw.wait.dev)){ hpLog('端末の追加の申し出の形が違う（捨てた）'); return false; }
    const rm=o.kind==='rm', nd=rm?c.cur.devs.map(d=>d.dev).find(d=>!rw.devs.some(x=>x.dev===d)):rw.devs.map(d=>d.dev).find(d=>!c.cur.devs.some(x=>x.dev===d)); if(!nd||Math.abs(rw.devs.length-c.cur.devs.length)!==1) return false;
    const e={kind:rm?'rm':'add',h:hpRsHash(rw),rw:rw,rd:rd,dev:nd,label:String(o.label||'').slice(0,32),by:rw.wait.dev,byLabel:String(o.byLabel||'').slice(0,32),at:Number(rw.wait.at),post:typeof o.post==='string'?o.post:''};
    hpD2Lbl(nd,e.label,e.post); hpD2PendSet(hpD2Pend().filter(x=>x.h!==e.h).concat([e])); saveID();
    hpLog('自分の端末から、端末を'+(rm?'外す':'追加する')+'申し出が届いた（'+nd.slice(0,10)+'…）'); try{ hpD2Popup(e); }catch(x){} return true; }
  if(o.type==='rsok'){
    const rd=o.rd, st=rd?hpRsStep(c.cur,rd,now,ID.rsCancels||[]):{ok:false};
    if(st.ok===true){ ID.roster=c.list.concat([rd]); hpD2PendSet(hpD2Pend().filter(x=>!(x.rw&&x.rw.prev===rd.prev))); saveID(); hpD2Close(); hpLog('端末の追加が承認された（名簿 '+rd.n+' 枚目）'); try{ await hpD2Adopt(); }catch(x){} try{ renderDevices(); }catch(x){} return true; }
    hpD2PendSet(hpD2Pend().filter(x=>!(x.rw&&rd&&x.rw.prev===rd.prev&&x.rw.n<=c.cur.n))); saveID(); return false; }
  if(o.type==='rsno'){
    const k=o.c; if(!k||k.id!==ID.address||!c.cur.devs.some(d=>d.dev===k.dev)||!hpRsVer(k.sig,hpRsCancelMsg(k.id,k.h),k.dev)) return false;
    const mine=hpD2Pend().find(x=>x.h===k.h);
    if(!Array.isArray(ID.rsCancels)) ID.rsCancels=[]; if(!ID.rsCancels.some(x=>x.h===k.h&&x.dev===k.dev)) ID.rsCancels=ID.rsCancels.concat([{v:1,type:'rscancel',id:k.id,h:k.h,dev:k.dev,at:Number(k.at)||now,sig:k.sig}]).slice(-20);
    hpD2PendSet(hpD2Pend().filter(x=>x.h!==k.h)); saveID(); hpD2Close(); hpLog('端末の追加の申し出が取り消された');
    if(mine&&mine.by===my&&typeof hpPgCap==='function'&&hpPgCap(POST.url)){ try{ await hpPmReq({op:'roster',list:[],cancels:[k]}); }catch(x){ hpLog('郵便受けに取り消しを送れない '+x.message); } }
    if(HP_LINK&&HP_LINK.d2){ HP_LINK=null; try{ hpLinkUi(); }catch(x){} }
    return true; }
  return false; }
function hpD2Close(){ try{ if(typeof HP_ASK_CUR!=='undefined'&&HP_ASK_CUR&&HP_ASK_CUR.d2&&HP_ASK_CUR.done) HP_ASK_CUR.done(false); }catch(e){} }
async function hpD2Ok(e){ const c=await hpD2Chain(); if(!c) return false; const me=await hpD2Sk(); const rd=JSON.parse(JSON.stringify(e.rd)); hpRsSign(rd,me.sk,me.dev);
  const st=hpRsStep(c.cur,rd,Date.now(),ID.rsCancels||[]); if(st.ok!==true){ hpLog('承認できない（'+(st.why||'')+'）'); return false; }
  ID.roster=c.list.concat([rd]); hpD2PendSet(hpD2Pend().filter(x=>x.h!==e.h)); saveID(); hpLog('端末の追加を承認した（名簿 '+rd.n+' 枚目）');
  try{ await hpSibPut({v:1,type:'rsok',rd:rd}); }catch(x){ hpLog('承認を自分の端末へ送れない '+x.message); }
  try{ await hpD2Adopt(); }catch(x){} try{ renderDevices(); }catch(x){} return true; }
async function hpD2No(e){ const me=await hpD2Sk(); const k=hpRsCancelMake(ID.address,e.h,me.dev,me.sk);
  if(!Array.isArray(ID.rsCancels)) ID.rsCancels=[]; ID.rsCancels=ID.rsCancels.concat([k]).slice(-20); hpD2PendSet(hpD2Pend().filter(x=>x.h!==e.h)); saveID(); hpLog('端末の追加の申し出を取り消した');
  try{ await hpSibPut({v:1,type:'rsno',c:k}); }catch(x){ hpLog('取り消しを自分の端末へ送れない '+x.message); }
  if(typeof hpPgCap==='function'&&hpPgCap(POST.url)){ try{ await hpPmReq({op:'roster',list:[],cancels:[k]}); }catch(x){} } return true; }
async function hpD2Popup(e){
  if(!e||e.by===POST.pub||HP_D2_SHOWN[e.h]||typeof document==='undefined'||typeof hpAsk!=='function') return 'skip';
  try{ if(document.hidden) return 'hidden'; }catch(x){}
  HP_D2_SHOWN[e.h]=1; let pick='';
  const node=document.createElement('div'); node.style.cssText='margin-top:10px;display:flex;align-items:center;gap:10px;flex-wrap:wrap';
  try{ const m=hpDevMarkEl(hpFdOf(e.dev),e.label||''); if(m){ try{ m.style.width='36px'; m.style.height='36px'; const sv=m.querySelector&&m.querySelector('svg'); if(sv){ sv.style.width='36px'; sv.style.height='36px'; } }catch(x){} node.appendChild(m); } }catch(x){}
  const no=document.createElement('button'); no.type='button'; no.className='b warn'; no.textContent=T('btn_d2_no'); no.onclick=()=>{ pick='no'; try{ HP_ASK_CUR.done(false); }catch(x){} }; node.appendChild(no);
  const rmk=e.kind==='rm';   const p=hpAsk({title:T(rmk?'d2rm_title':'d2_title'),text:TF(rmk?'d2rm_text':'d2_text',{by:e.byLabel||'-',label:e.label||'-',t:hpD2T(Number(e.at)+HP_RS_WAIT)}),ok:T('btn_d2_ok'),cancel:T('btn_d2_later'),node:node});
  try{ if(HP_ASK_CUR) HP_ASK_CUR.d2=1; }catch(x){}
  const yes=await p; if(!hpD2Pend().some(x=>x.h===e.h)) return 'gone';
  if(yes){ await hpD2Ok(e); return 'ok'; } if(pick==='no'){ await hpD2No(e); return 'no'; } return 'later'; }
async function hpD2Tick(){ if(HP_D2_BUSY||!ID) return 0; HP_D2_BUSY=true; let n=0;
  try{ const now=Date.now();
    for(const e of hpD2Pend().slice()){ const c=await hpD2Chain(); if(!c) break; const st=hpRsStep(c.cur,e.rw,now,ID.rsCancels||[]);
      if(st.ok===true){ ID.roster=c.list.concat([e.rw]); hpD2PendSet(hpD2Pend().filter(x=>x.h!==e.h)); saveID(); n++; hpLog('端末の追加の申し出から 72 時間たったので、名簿に入れた'); if(HP_LINK&&HP_LINK.d2){ HP_LINK=null; try{ hpLinkUi(); }catch(x){} } continue; }
      if(st.ok!=='wait'){ hpD2PendSet(hpD2Pend().filter(x=>x.h!==e.h)); saveID(); hpLog('端末の追加の申し出を捨てた（'+(st.why||'')+'）'); continue; }
      if(e.by!==POST.pub&&!HP_D2_SHOWN[e.h]){ hpD2Popup(e).catch(()=>{}); break; } }
    if(n){ try{ await hpD2Adopt(); }catch(x){} try{ renderDevices(); }catch(x){} }
  } finally { HP_D2_BUSY=false; } return n; }
async function hpD2Adopt(){
  if(!ID||!hpIsMain()||typeof EDPRIV==='undefined'||!EDPRIV) return 0; const c=await hpD2Chain(); if(!c) return 0;
  const my=hpHex((await hpDevKey()).publicKey); let n=0; if(!Array.isArray(ID.devs)) ID.devs=[];
  for(const d of c.cur.devs){ if(d.dev===my||ID.devs.some(x=>x&&x.dev===d.dev)) continue; if(typeof hpD2GoneDev==='function'&&hpD2GoneDev(d.dev)) continue;
    const devSig=await edSign(hp5DevMsg(ID.address,d.dev)), lb=(ID.rsLbl&&ID.rsLbl[d.dev])||{};
    ID.devs.push({dev:d.dev,devSig:devSig,label:lb.label||'',at:Date.now(),pre:null}); n++;
    if(lb.post&&!(typeof hpMcBoxRec==='function'&&hpMcBoxRec(d.dev))){ if(!ID.box6||typeof ID.box6!=='object'||Array.isArray(ID.box6)) ID.box6={}; ID.box6[d.dev]={url:lb.post,at:1}; }
    if(typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner&&!(typeof hpPgCap==='function'&&hpPgCap(POST.url))){ try{ await hpPmReq({op:'adddev',dev:d.dev,devSig:devSig}); }catch(e){ hpLog('名簿で入った端末を郵便受けに足せない（'+e.message+'）'); } }
    hpLog('名簿で入った端末を、自分の端末の一覧に入れた（'+d.dev.slice(0,10)+'…）'); }
  if(n){ saveID(); try{ hpAfterDevChange('add'); }catch(e){} } return n; }

function hpD2JoinDget(o){ const J=HP_JOIN; if(!J||!J.wel||!o||o.ok!=='dget') return false; const rs=o.rs, me=J.dev;
  const inRs=x=>!!(x&&Array.isArray(x.devs)&&x.devs.some(d=>d&&d.dev===me));
  if(inRs(rs)){ let chain=J.wel.rs.slice(); const last=chain[chain.length-1];
    try{ if(rs.n===last.n&&rs.prev===last.prev&&hpRsHash(rs)!==hpRsHash(last)) chain=chain.slice(0,-1).concat([rs]); else if(rs.n===last.n+1&&rs.prev===hpRsHash(last)) chain=chain.concat([rs]); }catch(e){}
    const wel=Object.assign({},J.wel,{rs:chain}); delete J.wel; delete J.waitUntil; hpJoinSave(); hpLog('ほかの端末が承認した（または 72 時間たった）。この端末を使い始める');
    Promise.resolve(hpSibLetter({from:J.id,fromMaster:J.master,fromDev:J.mainDev,body:JSON.stringify(wel)})).catch(e=>hpLog('使い始められない '+e.message)); return true; }
  if(!(Array.isArray(o.rsp)?o.rsp:[]).some(inRs)){ hpLog('この端末の追加は取り消された'); try{ if(J.timer) clearInterval(J.timer); }catch(e){} HP_JOIN=null; hpJoinDrop(); try{ hpLinkUi(T('join_d2_no')); }catch(e){} return true; }
  return false; }
try{ if(typeof hpTrDevOk==='function'){ const f=hpTrDevOk; hpTrDevOk=async function(id,master,dev){ if(await f.apply(this,arguments)) return true;
  try{ return !!(ID&&id===ID.address&&master===ID.publicKey&&typeof POST!=='undefined'&&POST&&hpD2Pend().some(e=>e&&e.dev===dev&&e.by===POST.pub)); }catch(e){ return false; } }; } }catch(e){}
try{ if(typeof hpSibLetter==='function'){ const f=hpSibLetter; hpSibLetter=async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){}
  if(o&&o.v===1&&['rsadd','rsok','rsno'].indexOf(o.type)>=0){ if(!ID||r.from!==ID.address||r.fromMaster!==ID.publicKey) return true; try{ await hpD2In(o,r); }catch(e){ hpLog('端末の追加の知らせを扱えない '+e.message); } return true; }
  if(o&&o.v===1&&o.type==='welcome'&&Array.isArray(o.rs)&&!ID&&HP_JOIN){ const J=HP_JOIN; if(r.from!==J.id||r.fromMaster!==J.master||r.fromDev!==J.mainDev) return f.apply(this,arguments);
    let ch=null; try{ ch=await hpRsChain(o.rs,Date.now(),[]); }catch(e){}
    if(!ch||ch.ok!==true||!o.rs[0]||o.rs[0].id!==J.id||ch.cur.root!==J.master){ hpLog('「ようこそ」の名簿を確かめられない（捨てた）'); return true; }
    if(ch.cur.devs.some(d=>d.dev===J.dev)){ try{ await hpTrChain(o.rs,[]); }catch(e){} return f.apply(this,arguments); }
    const p=ch.pend.find(x=>x.devs.some(d=>d.dev===J.dev)); if(!p){ hpLog('「ようこそ」の名簿にこの端末が無い（捨てた）'); return true; }
    J.wel=o; J.waitUntil=Number((p.wait&&p.wait.at)||Date.now())+HP_RS_WAIT; hpJoinSave(); hpLog('ほかの端末の承認を待つ（誰も承認しなければ '+hpD2T(J.waitUntil)+' から）'); try{ hpLinkUi(); }catch(e){} return true; }
  if(o&&o.v===1&&o.type==='sibd'&&ID&&ID.link&&ID.link.rs&&!ID.link.devSig&&Array.isArray(o.devs)&&r.from===ID.address){ const m=o.devs.find(d=>d&&d.dev===ID.link.dev&&typeof d.devSig==='string');
    try{ if(m&&(await edVerify(ID.publicKey,hp5DevMsg(ID.address,ID.link.dev),m.devSig))){ ID.link.devSig=m.devSig; saveID(); hpLog('元鍵の署名を受け取った（前からの郵便受けにも入れる）'); } }catch(e){} }
  return f.apply(this,arguments); }; } }catch(e){}
try{ if(typeof renderDevices==='function'){ const f=renderDevices; renderDevices=function(){ const r=f.apply(this,arguments); try{ if(typeof document!=='undefined'&&document.getElementById){ const lw=document.getElementById('link-wrap'); if(lw) lw.style.display=(ID&&!(typeof hpKillMe==='function'&&hpKillMe()))?'':'none'; const nd=document.querySelector('#dev-card .note[data-i18n="nt_dv"]'); if(nd) nd.style.display='none'; } }catch(e){} return r; }; } }catch(e){}
try{ if(typeof hpRkEnsure==='function'){ const f=hpRkEnsure; hpRkEnsure=async function(){ try{ await hpD2Adopt(); }catch(e){} return f.apply(this,arguments); }; } }catch(e){}
try{ if(typeof hpMcBoxMine==='function'){ const f=hpMcBoxMine; hpMcBoxMine=function(){ try{ if(ID&&ID.link&&ID.link.rs&&typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner&&POST.url) return POST.url; }catch(e){} return f.apply(this,arguments); }; } }catch(e){}
try{ if(typeof hpLinkOnReply==='function'){ const f=hpLinkOnReply; hpLinkOnReply=function(o){ const r=f.apply(this,arguments); try{ hpD2JoinDget(o); }catch(e){} return r; }; } }catch(e){}
try{ if(typeof hpLinkUi==='function'){ const f=hpLinkUi; hpLinkUi=function(msg){ const r=f.apply(this,arguments);
  try{ const L=HP_LINK, st=document.getElementById('link-status'); if(L&&L.done&&L.d2&&st) st.textContent=TF('lk_d2_wait',{t:hpD2T(L.d2)});
    const J=HP_JOIN; if(J&&J.wel&&typeof msg!=='string'){ const js=document.getElementById('linkjoin-status'), sas=document.getElementById('hp-join-sas'); if(js) js.textContent=TF('join_d2_wait',{t:hpD2T(J.waitUntil)}); if(sas) sas.style.display='none'; } }catch(e){} return r; }; } }catch(e){}
try{ if(typeof hpJoinSave==='function'){ const f=hpJoinSave; hpJoinSave=function(){ const r=f.apply(this,arguments); try{ const J=HP_JOIN; if(J&&J.wel&&!(typeof ID!=='undefined'&&ID)){ const s=JSON.parse(localStorage.getItem(HP_JOIN_KEY)||'null'); if(s){ s.wel=J.wel; s.waitUntil=J.waitUntil; localStorage.setItem(HP_JOIN_KEY,JSON.stringify(s)); } } }catch(e){} return r; }; } }catch(e){}
try{ if(typeof hpJoinRestore==='function'){ const f=hpJoinRestore; hpJoinRestore=function(){ let s=null; try{ s=JSON.parse(localStorage.getItem(HP_JOIN_KEY)||'null'); }catch(e){}
  if(s&&s.wel&&Number(s.waitUntil)>0&&!HP_JOIN&&!(typeof ID!=='undefined'&&ID)){ if(Date.now()>Number(s.waitUntil)+7*86400e3){ hpJoinDrop(); return false; }
    s.exp=Math.max(Number(s.exp)||0,Date.now()+60e3); localStorage.setItem(HP_JOIN_KEY,JSON.stringify(s)); const r=f.apply(this,arguments); try{ if(HP_JOIN){ HP_JOIN.wel=s.wel; HP_JOIN.waitUntil=Number(s.waitUntil); hpLinkUi(); } }catch(e){} return r; }
  return f.apply(this,arguments); }; } }catch(e){}
try{ if(typeof hpJoinTick==='function'){ const f=hpJoinTick; hpJoinTick=function(){ const J=HP_JOIN; if(!J||!J.wel||(typeof ID!=='undefined'&&ID)) return f.apply(this,arguments);
  J.exp=Math.max(Number(J.exp)||0,Date.now()+60e3); if(Date.now()>Number(J.waitUntil)+7*86400e3){ try{ clearInterval(J.timer); }catch(e){} HP_JOIN=null; hpJoinDrop(); return; }
  if(!POST.up){ try{ startBg(); }catch(e){} return; } if(Date.now()-HP_D2_JT<30e3) return; HP_D2_JT=Date.now(); try{ hpSend({op:'dget'}).catch(()=>{}); }catch(e){} }; } }catch(e){}
try{ if(typeof document!=='undefined'&&typeof setInterval==='function'&&typeof window!=='undefined'){ setInterval(()=>{ hpD2Tick().catch(()=>{}); },30000); setTimeout(()=>{ hpD2Tick().catch(()=>{}); },5000); } }catch(e){}

function hpD2Block(){ const out={}; try{ for(const e of hpD2Pend()) if(e&&e.kind==='rm') out[e.dev]=1; const g=ID&&ID.rsGone; if(g&&typeof g==='object') for(const d of Object.keys(g)) out[d]=1; }catch(e){} return out; }
async function hpD2Remove(dev){
  if(!hpD2CanLink()) throw new Error(T('e_rm_oldbox'));
  const c=await hpD2Chain(); if(!c) throw new Error('名簿を確かめられない');
  const me=await hpD2Sk(); if(dev===me.dev||!c.cur.devs.some(d=>d.dev===me.dev)) throw new Error(T('e_rm_nodev'));
  if(!c.cur.devs.some(d=>d.dev===dev)) throw new Error(T('e_rm_nodev'));
  const now=Math.max(Date.now(),Number(c.cur.at)+1), devs=c.cur.devs.filter(d=>d.dev!==dev).map(d=>({dev:d.dev,kind:d.kind||'other'}));
  const base={v:1,id:c.cur.id,root:c.cur.root,n:c.cur.n+1,at:now,prev:hpRsHash(c.cur),devs:devs};
  const rw=hpRsSign(Object.assign({},base,{by:'wait',wait:{dev:me.dev,at:now},sigs:{}}),me.sk,me.dev), rd=hpRsSign(Object.assign({},base,{by:'devs',sigs:{}}),me.sk,me.dev);
  await hpPmReq({op:'roster',list:c.list.concat([rw])});
  const row=hpSibs().find(d=>d&&d.dev===dev)||{};
  hpD2PendSet(hpD2Pend().filter(e=>e.h!==hpRsHash(rw)).concat([{kind:'rm',h:hpRsHash(rw),rw:rw,rd:rd,dev:dev,label:String(row.label||'').slice(0,32),by:me.dev,byLabel:hpDevLabelGuess(),at:now,post:POST.url}])); saveID();
  try{ await hpSibPut({v:1,type:'rsadd',kind:'rm',rw:rw,rd:rd,label:String(row.label||'').slice(0,32),byLabel:hpDevLabelGuess(),post:POST.url}); }catch(e){ hpLog('ほかの端末へ承認の頼みを送れない '+e.message); }
  try{ hpCardDueMark(1); }catch(e){}
  hpLog('名簿に外す申し出を書いた（端末 '+dev.slice(0,10)+'…・ほかの端末の承認か 72 時間で外れる。その間はこの端末あてに封をしない）');
  try{ hpToast(TF('rm_d2_wait',{t:hpD2T(now+HP_RS_WAIT),who:(typeof hpD2Who==='function')?hpD2Who([dev]):''}),10000); }catch(e){}   try{ renderDevices(); }catch(e){}
  return true; }
function hpD2GoneMark(c0,cur){ try{ const was=c0.devs.map(d=>d.dev), now=cur.devs.map(d=>d.dev); let n=0; if(!ID.rsGone||typeof ID.rsGone!=='object'||Array.isArray(ID.rsGone)) ID.rsGone={};
  for(const d of was) if(now.indexOf(d)<0&&!ID.rsGone[d]){ ID.rsGone[d]=Date.now(); n++; } const ks=Object.keys(ID.rsGone); while(ks.length>16) delete ID.rsGone[ks.shift()]; if(n){ try{ hpCardDueMark(1); }catch(e){} } return n; }catch(e){ return 0; } }

try{ for(const nm of ['hpD2Ok','hpD2In','hpD2Tick']){ const f=globalThis[nm]; if(typeof f!=='function') continue; globalThis[nm]=async function(){ const a=await hpD2Chain(); const r=await f.apply(this,arguments); try{ const b=await hpD2Chain(); if(a&&b&&hpRsHash(a.cur)!==hpRsHash(b.cur)){ if(hpD2GoneMark(a.cur,b.cur)) saveID(); try{ await hpD2Adopt(); }catch(e){} } }catch(e){} return r; }; } }catch(e){}
try{ if(typeof hpD2Adopt==='function'){ const f=hpD2Adopt; hpD2Adopt=async function(){ const n=await f.apply(this,arguments); let m=0;
  try{ if(ID&&hpIsMain()&&ID.rsGone&&typeof ID.rsGone==='object'&&typeof hpDevRemove==='function'){ for(const d of Object.keys(ID.rsGone)){ if(!(Array.isArray(ID.devs)&&ID.devs.some(x=>x&&x.dev===d))) continue;
    try{ await hpDevRemove(d); m++; hpLog('名簿で外れた端末を、自分の端末の一覧からも外した（'+d.slice(0,10)+'…）'); }catch(e){ hpLog('名簿で外れた端末を外せない（'+e.message+'）'); } } } }catch(e){}
  return n+m; }; } }catch(e){}
try{ if(typeof hpSibPut==='function'){ const f=hpSibPut; hpSibPut=async function(body,only,kind){ const bl=hpD2Block(); if(Object.keys(bl).length){ let all=[]; try{ all=hpSibs().map(d=>d.dev); }catch(e){} only=(Array.isArray(only)?only:all).filter(d=>!bl[d]); if(!only.length) return 0; } return f.call(this,body,only,kind); }; } }catch(e){}
try{ if(typeof hpCard4Make==='function'){ const f=hpCard4Make; hpCard4Make=async function(o,now){ try{ const pe=hpD2Pend().filter(e=>e&&e.kind==='rm'&&e.rw); if(o&&Array.isArray(o.roster)&&pe.length){ const last=o.roster[o.roster.length-1], add=pe.filter(e=>e.rw.prev===hpRsHash(last)).map(e=>e.rw); if(add.length) o=Object.assign({},o,{roster:o.roster.concat(add)}); } }catch(e){} return f.call(this,o,now); }; } }catch(e){}
try{ if(typeof hpOnRemoved==='function'){ const f=hpOnRemoved; hpOnRemoved=async function(o){ if(!o||!o.rs||!ID||!Array.isArray(ID.roster)) return f.apply(this,arguments);
  try{ POST.removed=true; const me=hpIsChild()?((ID.link&&ID.link.dev)||''):(POST.pub||''); const ch=await hpRsChain(ID.roster.concat([o.rs]),Date.now(),ID.rsCancels||[]);
    if(me&&ch&&ch.ok===true&&hpRsHash(ch.cur)===hpRsHash(o.rs)&&!o.rs.devs.some(d=>d.dev===me)){ hpLog('この端末は名簿で外された（名簿を確かめた）。この端末の鍵・アカウント・履歴を消す'); hpWipeSelf(); return true; } }catch(e){}
  hpLog('管理人が「名簿で外された」と答えたが、自分の名簿の続きとして確かめられない（何も消さない）'); try{ hpBanner(T('bn_removed_unproven')); }catch(e){} return false; }; } }catch(e){}

function hpD3Me(){ try{ return (ID&&ID.link&&ID.link.dev)||((typeof POST!=='undefined'&&POST&&POST.pub)||''); }catch(e){ return ''; } }
try{ if(typeof hpSibs==='function'){ const f=hpSibs; hpSibs=function(){ const base=f.apply(this,arguments);
  try{ if(!ID) return base; const gone=(ID.rsGone&&typeof ID.rsGone==='object')?ID.rsGone:{}, out0=base.filter(d=>d&&!gone[d.dev]);
    const gone2=new Set((Array.isArray(ID.gone)?ID.gone:[]).map(g=>g&&g.dev).filter(Boolean)), out=out0.filter(d=>!gone2.has(d.dev));
    if(!Array.isArray(ID.roster)||!ID.roster.length) return out; const last=ID.roster[ID.roster.length-1]; if(!last||last.id!==ID.address||last.root!==ID.publicKey||!Array.isArray(last.devs)) return out;
    const me=hpD3Me(), have=new Set(out.map(d=>d.dev));
    for(const d of last.devs){ if(!d||!d.dev||d.dev===me||have.has(d.dev)||gone[d.dev]||gone2.has(d.dev)) continue;
      const p6=ID.pre6&&typeof ID.pre6==='object'?ID.pre6[d.dev]:null, lb=ID.rsLbl&&typeof ID.rsLbl==='object'?ID.rsLbl[d.dev]:null;
      out.push({dev:d.dev,devSig:'',label:(lb&&lb.label)||'',at:0,pre:(p6&&p6.x25519&&p6.sig)?{dev:d.dev,x25519:p6.x25519,notAfter:p6.notAfter,sig:p6.sig}:null,role:'child',seen:0,rs:1}); have.add(d.dev); }
    return out; }catch(e){ return base; } }; } }catch(e){}

try{ if(typeof hpRoleBadge==='function'){ const f=hpRoleBadge; hpRoleBadge=function(){ try{ const r=document.getElementById('me-role'); if(r){ r.textContent=''; r.style.display='none'; } return; }catch(e){} return f.apply(this,arguments); }; } }catch(e){}

function hpRsVerUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const card=document.getElementById('dev-card'), list=document.getElementById('dev-list'); if(!card||!list) return false;
  let el=document.getElementById('dev-rs'); const l=(ID&&Array.isArray(ID.roster)&&ID.roster.length)?ID.roster[ID.roster.length-1]:null, n=l?Number(l.n):0;
  if(!n){ if(el) el.style.display='none'; return false; }
  if(!el){ el=document.createElement('div'); el.id='dev-rs'; el.className='note'; el.style.cssText='margin:-4px 0 8px;color:var(--dim)'; list.parentNode.insertBefore(el,list); }
  const t=TF('dv_rs',{n:n}); if(el.textContent!==t) el.textContent=t; el.style.display=''; return true; }catch(e){ return false; } }
try{ if(typeof renderDevices==='function'){ const f=renderDevices; renderDevices=function(){ const r=f.apply(this,arguments); try{ hpRsVerUi(); }catch(e){} return r; }; } }catch(e){}
try{ if(typeof setInterval==='function'&&typeof document!=='undefined') setInterval(()=>{ try{ hpRsVerUi(); }catch(e){} },3000); }catch(e){}

function hpD2Who(excl,rows){
  try{ const ex={}; for(const d of (Array.isArray(excl)?excl:[])) if(d) ex[d]=1; try{ if(typeof POST!=='undefined'&&POST&&POST.pub) ex[POST.pub]=1; }catch(e){}
    if(!Array.isArray(rows)){ rows=[]; try{ rows=hpSibs(); }catch(e){ rows=[]; } }
    const names=[]; for(const d of rows){ if(!d||!d.dev||d.me||ex[d.dev]) continue; const l0=String(d.label||'').trim(); if(!l0) continue; const l=(typeof hpDevName==='function')?hpDevName(l0):l0; if(!l||names.indexOf(l)>=0) continue; names.push(l); }
    if(!names.length) return T('d2_who_other'); return names.slice(0,4).map(x=>(typeof hpQuo==='function'?hpQuo(x):'「'+x+'」')).join(T('d2_who_or')); }catch(e){ return T('d2_who_other'); } }
function hpD2WhoJoin(J){ try{ const w=J&&J.wel; if(!w) return hpD2Who([],[]); const rows=[]; if(w.main&&w.main.dev) rows.push({dev:w.main.dev,label:w.main.label||''}); for(const d of (Array.isArray(w.sibs)?w.sibs:[])) if(d&&d.dev) rows.push({dev:d.dev,label:d.label||''});
  const by=(typeof w.by==='string'&&w.by)||(Array.isArray(w.sibs)&&w.sibs[0]&&w.sibs[0].dev)||''; return hpD2Who([by,J.dev],rows); }catch(e){ return hpD2Who([],[]); } }
function hpD2MyAdds(){ try{ const my=(typeof POST!=='undefined'&&POST&&POST.pub)||''; return hpD2Pend().filter(e=>e&&e.by===my&&e.kind!=='rm'); }catch(e){ return []; } }
try{ if(typeof hpLinkUi==='function'&&!hpLinkUi.__h5){ const f=hpLinkUi; hpLinkUi=function(msg){ const r=f.apply(this,arguments);
  try{ const L=HP_LINK, st=document.getElementById('link-status'), lf=document.getElementById('lk-for'); if(lf) lf.style.display=(L&&L.done)?'none':'';
    if(L&&L.done&&L.d2&&st) st.textContent=TF('lk_d2_wait',{t:hpD2T(L.d2),who:hpD2Who(hpD2MyAdds().map(e=>e.dev))});
    const J=HP_JOIN; if(J&&J.wel&&typeof msg!=='string'){ const js=document.getElementById('linkjoin-status'); if(js) js.textContent=TF('join_d2_wait',{t:hpD2T(J.waitUntil),who:hpD2WhoJoin(J)}); } }catch(e){} return r; }; hpLinkUi.__h5=1; } }catch(e){}
try{ const f=globalThis.hpD2In; if(typeof f==='function'&&!f.__h5){ const g=async function(o,r){ const ret=await f.apply(this,arguments);
  try{ if(ret===true&&o&&o.type==='rsok'&&HP_LINK&&HP_LINK.d2&&!hpD2MyAdds().length){ HP_LINK=null; hpLog('追加が承認されたので、［自分の端末を追加］の欄を閉じた'); try{ hpLinkUi(); }catch(e){} } }catch(e){} return ret; }; g.__h5=1; globalThis.hpD2In=g; } }catch(e){}
function hpD2RmNotes(){ try{ if(typeof document==='undefined'||!document.getElementById) return 0; const list=document.getElementById('dev-list'); if(!list||!ID) return 0;
  const my=(typeof POST!=='undefined'&&POST&&POST.pub)||'', pend=hpD2Pend().filter(e=>e&&e.kind==='rm'&&e.by===my); if(!pend.length) return 0;
  const rows=(typeof hpDevRows==='function')?hpDevRows():[], items=list.querySelectorAll('.contact-item'); if(!rows.length||items.length!==rows.length) return 0; let n=0;
  for(let i=0;i<rows.length;i++){ const e=pend.find(x=>x.dev===rows[i].dev); if(!e) continue; const nm=items[i].querySelector('.nm'); if(!nm||nm.querySelector('.dv-d2rm')) continue;
    const w=document.createElement('span'); w.className='dv-d2rm'; w.style.cssText='white-space:normal;color:var(--amber)'; w.textContent=TF('rm_d2_wait',{t:hpD2T(Number(e.at)+HP_RS_WAIT),who:hpD2Who([e.dev])}); nm.appendChild(w); n++; }
  return n; }catch(e){ return 0; } }
try{ if(typeof renderDevices==='function'&&!renderDevices.__h5){ const f=renderDevices; renderDevices=function(){ const r=f.apply(this,arguments); try{ hpD2RmNotes(); }catch(e){} return r; }; renderDevices.__h5=1; } }catch(e){}

const HP_SM_MAX=200, HP_SM_PER=20, HP_SM_LEN=40000, HP_SM_DONE={}; let HP_SM_BUSY=false, HP_SM_T=0, HP_SM_DN=0;
function hpSmQ(){ try{ const v=JSON.parse(hpHGet('p2p_smq')||'[]'); return Array.isArray(v)?v:[]; }catch(e){ return []; } }
function hpSmSet(q){ try{ if(q.length) hpHSet('p2p_smq',JSON.stringify(q.slice(-HP_SM_MAX))); else if(typeof hpHDel==='function') hpHDel('p2p_smq'); else hpHSet('p2p_smq','[]'); }catch(e){} }
function hpSmItem(peer,ts){ try{ const m=histLoad(peer).find(x=>x&&x.ts===ts&&x.d==='s'); if(!m) return null; const it=Object.assign({},m); if(!it.dv){ try{ if(typeof sibDv==='function') it.dv=sibDv(); }catch(e){} } delete it.dc; delete it.hf; delete it.wl; return it; }catch(e){ return null; } }
function hpSmAdd(peer,ts){ try{ if(!ID||!peer||typeof ts!=='number') return false; let sibs=[]; try{ sibs=hpSibs(); }catch(e){ sibs=[]; } if(!sibs.length) return false;
  if(HP_SM_DONE[peer+'|'+ts]) return false; const q=hpSmQ(); if(q.some(e=>e&&e.p===peer&&e.ts===ts)) return false; q.push({p:peer,ts:ts}); hpSmSet(q); return true; }catch(e){ return false; } }
async function hpSmFlush(why){
  if(HP_SM_BUSY||!ID||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0; let q=hpSmQ(); if(!q.length) return 0; HP_SM_BUSY=true; let n=0;
  try{ let sibs=[]; try{ sibs=hpSibs(); }catch(e){ sibs=[]; } if(!sibs.length){ hpSmSet([]); return 0; }
    while(q.length){ const take=[], items=[]; let len=0;
      for(const e of q){ if(take.length>=HP_SM_PER) break; const it=e?hpSmItem(e.p,e.ts):null; if(!it){ take.push(e); continue; } const s=JSON.stringify({peer:e.p,item:it}); if(items.length&&len+s.length>HP_SM_LEN) break; take.push(e); items.push({peer:e.p,item:it}); len+=s.length; }
      if(items.length){ await hpSibPut({v:1,type:'sibmir',items:items}); n+=items.length; if(++HP_SM_DN>500){ for(const k of Object.keys(HP_SM_DONE)) delete HP_SM_DONE[k]; HP_SM_DN=1; } for(const x of items) HP_SM_DONE[x.peer+'|'+x.item.ts]=1; }
      q=q.filter(e=>take.indexOf(e)<0); hpSmSet(q); }
    if(n) hpLog('出した手紙 '+n+' 通の写しを、自分のほかの端末へ郵便受けで送った（'+(why||'')+'）');
  }catch(e){ try{ hpLog('出した手紙の写しを自分の端末へ送れない（つないだときにもう一度）'+((e&&e.message)?' '+e.message:'')); }catch(_){} }
  finally{ HP_SM_BUSY=false; } return n; }
try{ if(typeof sibMirrorTs==='function'&&!sibMirrorTs.__sm){ const f=sibMirrorTs; sibMirrorTs=function(peer,ts,d){ const r=f.apply(this,arguments); try{ if((d||'s')==='s'&&hpSmAdd(peer,ts)) Promise.resolve(hpSmFlush('投函')).catch(()=>{}); }catch(e){} return r; }; sibMirrorTs.__sm=1; } }catch(e){}
try{ if(typeof setInterval==='function'&&typeof document!=='undefined') setInterval(()=>{ try{ if(hpSmQ().length&&Date.now()-HP_SM_T>55e3){ HP_SM_T=Date.now(); Promise.resolve(hpSmFlush('控え')).catch(()=>{}); } }catch(e){} },60e3); }catch(e){}
try{ if(typeof hpSibLetter==='function'&&!hpSibLetter.__sm){ const f=hpSibLetter; hpSibLetter=async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){}
  if(o&&o.v===1&&o.type==='sibmir'){ if(!ID||r.from!==ID.address||r.fromMaster!==ID.publicKey||!Array.isArray(o.items)) return true; let na=0, nn=0;
    for(const x of o.items.slice(0,50)){ try{ if(!x||!x.peer||!x.item||x.item.d!=='s') continue; const res=(typeof sibApply==='function')?sibApply(x.peer,x.item):null; na++; if(res&&res.isNew) nn++; try{ if(res&&typeof sibReflect==='function') sibReflect(x.peer,res); }catch(e){} }catch(e){} }
    hpLog('自分の端末（'+String(r.fromDev||'').slice(0,10)+'…）から、出した手紙の写し '+na+' 通（新しい '+nn+' 通）を郵便受けで受け取った'); return true; }
  return f.apply(this,arguments); }; hpSibLetter.__sm=1; } }catch(e){}
try{ if(typeof renderDevices==='function'&&!renderDevices.__sm){ const f=renderDevices; renderDevices=function(){ const r=f.apply(this,arguments); try{ const pw=document.getElementById('dev-pull'); if(pw) pw.style.display='none'; }catch(e){} return r; }; renderDevices.__sm=1; } }catch(e){}

let HP_UP_BUSY=false, HP_UP_NOSIG=false; const HP_UP_TRIED={};
function hpUpWant(){ try{ return String(HP_POST_PKG.sha256||'').slice(0,16); }catch(e){ return ''; } }
async function hpUpSig(){ try{ const r=await fetch(HP_POST_SIG,{cache:'no-store'}); if(!r.ok) return ''; const t=String(await r.text()).trim(); return /^[0-9a-f]{128}$/.test(t)?t:''; }catch(e){ return ''; } }
async function hpUpCheck(pv){
  try{ if(!ID||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||!POST.url||typeof pv!=='string'||!/^[0-9a-f]{16}$/.test(pv)) return 'skip';
    const u=String(POST.url), want=hpUpWant(); const m=hpPgObj('postPv'); if(m[u]!==pv){ const ks=Object.keys(m); if(m[u]===undefined&&ks.length>=8) delete m[ks[0]]; m[u]=pv; saveID(); hpLog('郵便受けの本体の版 '+pv+'…'+(pv===want?'（アプリと同じ）':'（アプリは '+want+'…）')); }
    if(!want||pv===want) return 'same';
    if(HP_UP_BUSY) return 'busy'; const k=u+'|'+want; if(Date.now()-(HP_UP_TRIED[k]||0)<3600e3) return 'wait'; HP_UP_TRIED[k]=Date.now(); HP_UP_BUSY=true;
    try{ const sig=await hpUpSig(); if(!sig){ if(!HP_UP_NOSIG){ HP_UP_NOSIG=true; hpLog('郵便受けの本体（'+pv+'…）はアプリのもの（'+want+'…）と違うが、開発者の署名（'+HP_POST_SIG+'）が無いので入れ替えない'); } return 'nosig'; }
      const files=await hpRentBundle(), body=files.find(f=>f&&f.name==='post_cur.js'); if(!body) return 'nobundle';
      const r=await hpPmReq({op:'upgrade',data:bytesToB64(body.data),sha:HP_POST_PKG.sha256,sig:sig});
      if(r&&r.ok==='upgrade'){ hpLog('郵便受けの本体を入れ替えた（'+pv+'… → '+String(r.next||want)+'…・'+HP_POST_VER+'）。次の回から新しい本体で動く'); try{ hpToast(TF('up_done',{v:HP_POST_VER}),8000); }catch(e){} return 'ok'; }
      hpLog('郵便受けの本体を入れ替えられない（返事 '+JSON.stringify(r||null).slice(0,60)+'）'); return 'bad';
    }catch(e){ hpLog('郵便受けの本体を入れ替えられない（'+((e&&e.message)||e)+'）'); return 'err'; }
    finally{ HP_UP_BUSY=false; } }catch(e){ return 'err'; } }
try{ if(typeof hpLinkOnReply==='function'&&!hpLinkOnReply.__up){ const f=hpLinkOnReply; hpLinkOnReply=function(o){ const r=f.apply(this,arguments); try{ if(o&&o.ok==='claim'&&typeof o.pv==='string') Promise.resolve(hpUpCheck(o.pv)).catch(()=>{}); }catch(e){} return r; }; hpLinkOnReply.__up=1; } }catch(e){}

let HP_OV_URL='', HP_OV_SHUT='';
function hpOvCan(){ try{ if(typeof ID==='undefined'||!ID||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||!POST.url) return false;
  if(typeof hpKillMe==='function'&&hpKillMe()) return false; if(typeof HP_MOVE!=='undefined'&&HP_MOVE) return false; if(ID.lease&&ID.lease.gone) return false;
  if((typeof HP_RENT_BUSY!=='undefined'&&HP_RENT_BUSY)||(typeof HP_RENT_J!=='undefined'&&HP_RENT_J)||(typeof HP_OB_RE!=='undefined'&&HP_OB_RE)||ID.rentJob||ID.moveJob||ID.boxJob) return false;
  return (typeof hpIsMain==='function'&&hpIsMain())||(typeof hpBoxSub==='function'&&hpBoxSub()); }catch(e){ return false; } }
function hpOvDue(){ try{ return !!(HP_OV_URL&&POST.url===HP_OV_URL&&HP_OV_SHUT!==HP_OV_URL&&hpOvCan()); }catch(e){ return false; } }
function hpOvDraw(){ if(typeof document==='undefined'||!document||!document.body||!document.getElementById) return ''; let b=document.getElementById('hp-banner-old');
  if(!hpOvDue()){ if(b&&b.remove) b.remove(); return ''; }
  if(!b){ b=document.createElement('div'); b.id='hp-banner-old'; b.style.cssText='background:var(--amber);color:#1a1300;font-size:12px;line-height:1.5;padding:6px 12px;cursor:pointer;border-top:1px solid rgba(0,0,0,.25)'; b.onclick=hpOvGo;
    const prev=document.getElementById('hp-banner-nag')||document.getElementById('hp-banner'); if(prev&&prev.after) prev.after(b); else document.body.insertBefore(b,document.body.firstChild); }
  const t=T('bn_ov')+' ✕'; if(b.textContent!==t) b.textContent=t; return 'on'; }
function hpOvGo(){ HP_OV_SHUT=HP_OV_URL; hpOvDraw();
  try{ const t=document.getElementById('t-post'); if(t&&t.click) t.click(); }catch(e){}
  try{ setTimeout(()=>{ try{ const m=document.getElementById('post-move'); if(m&&m.scrollIntoView) m.scrollIntoView({behavior:'smooth',block:'start'}); }catch(e){} },60); }catch(e){} return true; }
function hpOvOnClaim(o){ try{ if(!o||o.ok!=='claim'||typeof POST==='undefined'||!POST||!POST.url) return ''; const u=String(POST.url), old=typeof o.pv!=='string';
  if(old&&HP_OV_URL!==u){ HP_OV_URL=u; if(hpOvCan()) hpLog('この郵便受けはプログラムを入れ替えられない古い版。移設を勧める帯を出す'); }
  else if(!old&&HP_OV_URL===u) HP_OV_URL='';
  return hpOvDraw(); }catch(e){ return ''; } }
try{ if(typeof hpLinkOnReply==='function'&&!hpLinkOnReply.__ov){ const f=hpLinkOnReply; hpLinkOnReply=function(o){ const r=f.apply(this,arguments); hpOvOnClaim(o); return r; }; hpLinkOnReply.__ov=1; } }catch(e){}
try{ if(typeof setInterval==='function'&&typeof document!=='undefined') setInterval(()=>{ try{ hpOvDraw(); }catch(e){} },3000); }catch(e){}

let HP_RA_N=0, HP_RA_K='', HP_RA_JOB=0, HP_RA_T=null, HP_RA_WAIT=0, HP_RA_HID=0, HP_RA_OFF=0;
const HP_RA_MAX={acq:1,dep:5,try:3,ext:2}, HP_RA_GAP=4000, HP_RA_BG=180e3;
function hpRaConn(e){ const m=String((e&&e.message)||e||''); return /connection_error|^connect |^no (statusResult|uploadResult)|HotPocket\/BSON|time ?out|network|Failed to fetch|Load failed|closed|つながらない|切れ/i.test(m); }
function hpRaBg(){ try{ return hpHidden()||(HP_RA_HID>0&&Date.now()-HP_RA_HID<HP_RA_BG); }catch(e){ return false; } }
function hpRaWant(J,k,e){ try{ if(!J||!(J.done&&(J.done.acq||J.acqTx))||!HP_RA_MAX[k]) return false; if(HP_RA_OFF&&HP_RA_OFF===J.at) return false; if(e&&e.hpLate) return false;
  if(k==='acq'){ if(!J.acqTx||J.done.acq) return false; } else if(k==='ext'){ if(!J.extTx||J.done.ext) return false; } else if(k==='try'){ if(!(e&&e.hpTry)||!hpRaBg()) return false; } else if(!(hpRaConn(e)||hpRaBg())) return false;
  if(HP_RA_JOB!==J.at||HP_RA_K!==k){ HP_RA_JOB=J.at; HP_RA_K=k; HP_RA_N=0; }
  return HP_RA_N<HP_RA_MAX[k]; }catch(x){ return false; } }
function hpRaStop(){ HP_RA_WAIT=0; if(HP_RA_T){ clearTimeout(HP_RA_T); HP_RA_T=null; } }
function hpRaLater(at){
  hpRaStop(); if(hpHidden()){ HP_RA_WAIT=at; return 'wait'; }
  HP_RA_T=setTimeout(()=>{ HP_RA_T=null; if(hpHidden()){ HP_RA_WAIT=at; return; } if(typeof HP_RENT_BUSY!=='undefined'&&HP_RENT_BUSY){ hpRaLater(at); return; } if(!ID||!ID.rentJob||ID.rentJob.at!==at) return; Promise.resolve(hpRentResume()).catch(()=>{}); },HP_RA_GAP); return 'timer'; }
function hpRaGo(J,k,e,f){ HP_RA_N++; const n=HP_RA_N, m=HP_RA_MAX[k], why=(typeof hpRentWhy==='function')?hpRentWhy(e):String((e&&e.message)||e);
  try{ hpRentLog('lg_rn_fail',{k:k,why:String((e&&e.message)||e)}); }catch(x){}
  hpLog('借りる流れが途中で切れたので、自動で続ける（'+k+'・'+n+' 回目／'+m+' 回まで'+(hpHidden()?'・画面が戻ってから':'')+'）');
  try{ hpRentShow({lines:hpRentLines(J,k),note:TF('rn_ra_note',{why:why,n:n,m:m}),btns:[[T('btn_rn_ra_stop'),()=>{ HP_RA_OFF=J.at; hpRaStop(); try{ f(J,k,e); }catch(x){} }]],job:J.at}); }catch(x){}
  return hpRaLater(J.at); }
try{ if(typeof hpRentFail==='function'&&!hpRentFail.__ra){ const f=hpRentFail; hpRentFail=function(J,k,e){ if(hpRaWant(J,k,e)) return hpRaGo(J,k,e,f); hpRaStop(); return f.apply(this,arguments); }; hpRentFail.__ra=1; } }catch(e){}
try{ if(typeof document!=='undefined'&&document&&typeof document.addEventListener==='function') document.addEventListener('visibilitychange',()=>{ try{ if(document.hidden){ HP_RA_HID=Date.now(); return; }
  if(!HP_RA_WAIT) return; const at=HP_RA_WAIT; HP_RA_WAIT=0; if(!ID||!ID.rentJob||ID.rentJob.at!==at) return; hpLog('画面が戻ったので、借りる流れの続きをする'); hpRaLater(at); }catch(e){} }); }catch(e){}

function hpObOldFix(){ try{ if(typeof ID==='undefined'||!ID||typeof hpIsChild!=='function'||!hpIsChild()||typeof hpBoxSub!=='function'||!hpBoxSub()) return '';
  const m=ID.leaseByUrl; if(!m||typeof m!=='object') return ''; const ks=Object.keys(m), cur=hpPostUrl(), i=ks.indexOf(cur); if(i<1) return ''; const prev=ks[i-1];
  const po=ID.link.postOld; if(po&&po.url===prev) return ''; if(po&&!po.end&&ks.indexOf(po.url)>=0) return '';
  const done=(ID.link.oldFix&&typeof ID.link.oldFix==='object')?ID.link.oldFix:{}; if(done[prev]) return ''; done[prev]=Date.now(); ID.link.oldFix=done;
  ID.link.postOld={ url:prev, at:Date.now(), last:Date.now(), own:1, fix:1 }; saveID();
  hpLog('前の郵便受けの見回り先を、直前に自分で借りた郵便受け（'+prev+'）にした（前は '+((po&&po.url)||'無し')+'。宿題 113）'); return prev; }catch(e){ return ''; } }
try{ if(typeof document!=='undefined'&&typeof window!=='undefined'&&typeof setTimeout==='function'){ setTimeout(()=>{ try{ hpObOldFix(); }catch(e){} },8000); setInterval(()=>{ try{ hpObOldFix(); }catch(e){} },300e3); } }catch(e){}

let HP_FG_JOB=0, HP_FG_LOCK=null, HP_ACT=null, HP_ACT_N=0, HP_ACT_TRY=0, HP_ACT_NOTE=''; const HP_FG_STALE=75e3, HP_XW_KICK=new Set();
function hpFgOn(){ try{ return !!(typeof HP_GG!=='undefined'&&HP_GG&&!HP_GG.done); }catch(e){ return false; } }
function hpFgMMSS(ms){ ms=Math.max(0,Math.floor(ms/1000)); return Math.floor(ms/60)+':'+String(ms%60).padStart(2,'0'); }
function hpActSet(key,o){ HP_ACT={key:key,o:o||{},at:Date.now()}; HP_ACT_N++; try{ hpActDraw(); }catch(e){} return HP_ACT_N; }
function hpActText(){ const A=HP_ACT; if(!A) return ''; const dt=Date.now()-A.at; let t=TF('rn_act_now',{w:TF(A.key,A.o),t:hpFgMMSS(dt)});
  try{ const G=HP_GG; if(G&&/^gg_(app|dep|host|read)$/.test(String(G.key))&&dt>=HP_FG_STALE) t+='\n'+TF('rn_act_stale',{t:hpFgMMSS(dt)}); }catch(e){} return t; }
function hpActDraw(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const c=document.getElementById('post-run'); let el=document.getElementById('rn-act');
  if(!c||(c.style&&c.style.display==='none')||!hpFgOn()){ if(el&&el.remove) el.remove(); return ''; }
  if(!el){ el=document.createElement('div'); el.id='rn-act'; el.className='note'; el.style.cssText='white-space:pre-line;margin:0 0 8px;color:var(--amber)'; const gg=document.getElementById('rn-gauge'); if(gg&&gg.parentNode===c) c.insertBefore(el,gg.nextSibling||null); else c.insertBefore(el,c.firstChild||null); }
  const phone=(typeof hpRentPhone==='function')&&hpRentPhone(), a=hpActText(), v=(a?a+'\n':'')+(phone?T('rn_fg_line'):''); if(!v){ if(el.remove) el.remove(); return ''; } if(el.textContent!==v) el.textContent=v; return 'on'; }catch(e){ return ''; } }
function hpFgPopup(){ try{ if(!(typeof hpRentPhone==='function'&&hpRentPhone())||typeof document==='undefined'||!document.body) return false; const J=(typeof HP_RENT_J!=='undefined')?HP_RENT_J:null, at=Number(J&&J.at)||0; if(!at||HP_FG_JOB===at) return false; HP_FG_JOB=at;
  if(document.getElementById('rn-fg')) return false; const el=(t,cls,x)=>{ const e=document.createElement(t); if(cls) e.className=cls; if(x!=null) e.textContent=x; return e; };
  const box=el('div'); box.id='rn-fg'; box.style.cssText='position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px';
  const card=el('div','card'); card.style.cssText='max-width:440px;width:100%;margin:0'; card.appendChild(el('h2',null,T('rn_fg_title'))); const p=el('div',null,T('rn_fg_text')); p.style.cssText='white-space:pre-line;line-height:1.6'; card.appendChild(p);
  const r=el('div','row'); r.style.cssText='margin-top:12px;justify-content:flex-end'; const b=el('button','b pri',T('btn_fg_ok')); b.type='button'; b.id='rn-fg-ok'; b.onclick=()=>{ try{ box.remove(); }catch(e){} }; r.appendChild(b); card.appendChild(r); box.appendChild(card); document.body.appendChild(box); return true; }catch(e){ return false; } }
async function hpFgLock(){ try{ if(!hpFgOn()||HP_FG_LOCK||typeof navigator==='undefined'||!navigator.wakeLock||typeof document==='undefined'||document.visibilityState!=='visible') return false; const L=await navigator.wakeLock.request('screen'); HP_FG_LOCK=L; try{ L.addEventListener('release',()=>{ if(HP_FG_LOCK===L) HP_FG_LOCK=null; }); }catch(e){} return true; }catch(e){ HP_FG_LOCK=null; return false; } }
function hpFgUnlock(){ try{ const L=HP_FG_LOCK; HP_FG_LOCK=null; if(L&&L.release) Promise.resolve(L.release()).catch(()=>{}); return !!L; }catch(e){ return false; } }
try{ if(typeof hpRentShow==='function'&&!hpRentShow.__fg){ const f=hpRentShow; hpRentShow=function(o){ const c=f.apply(this,arguments); try{ const nt=String((o&&o.note)||''); if(nt!==HP_ACT_NOTE){ HP_ACT_NOTE=nt; HP_ACT_TRY=0; } if(hpFgOn()){ hpFgPopup(); Promise.resolve(hpFgLock()).catch(()=>{}); hpActDraw(); } else { hpFgUnlock(); HP_ACT=null; hpActDraw(); } }catch(e){} return c; }; hpRentShow.__fg=1; if(f.__hpPu) hpRentShow.__hpPu=f.__hpPu;   } }catch(e){}
try{ if(typeof hpRentHide==='function'&&!hpRentHide.__fg){ const f=hpRentHide; hpRentHide=function(){ const r=f.apply(this,arguments); try{ hpFgUnlock(); HP_ACT=null; HP_ACT_NOTE=''; const el=document.getElementById('rn-act'); if(el&&el.remove) el.remove(); }catch(e){} return r; }; hpRentHide.__fg=1; if(f.__hpPu) hpRentHide.__hpPu=f.__hpPu; } }catch(e){}
try{ if(typeof hpGgDraw==='function'&&!hpGgDraw.__fg){ const f=hpGgDraw; hpGgDraw=function(){ const r=f.apply(this,arguments); try{ hpActDraw(); }catch(e){} return r; }; hpGgDraw.__fg=1; } }catch(e){}
try{ if(typeof hpRentSign==='function'&&!hpRentSign.__fg){ const f=hpRentSign; hpRentSign=function(){ try{ hpActSet('act_xm_make'); }catch(e){} return f.apply(this,arguments); }; hpRentSign.__fg=1; } }catch(e){}
try{ if(typeof hpEvDeploy==='function'&&!hpEvDeploy.__fg){ const f=hpEvDeploy; hpEvDeploy=function(info,sk,zip,step){ const st=(k,v)=>{ try{ if(k==='connect') hpActSet('act_dep_connect'); else if(k==='status') hpActSet('act_dep_status'); else if(k==='upload') hpActSet('act_dep_upload',{k:Math.max(1,Math.round((Number(v)||0)/1024))}); }catch(e){} try{ if(typeof step==='function') step(k,v); }catch(e){} }; return f.call(this,info,sk,zip,st); }; hpEvDeploy.__fg=1; } }catch(e){}
try{ if(typeof hpEvHasPost==='function'&&!hpEvHasPost.__fg){ const f=hpEvHasPost; hpEvHasPost=function(){ try{ if(hpFgOn()){ HP_ACT_TRY++; hpActSet('act_try',{n:HP_ACT_TRY}); } }catch(e){} return f.apply(this,arguments); }; hpEvHasPost.__fg=1; } }catch(e){}
try{ if(typeof hpEvWait==='function'&&!hpEvWait.__fg&&typeof hpEvFind==='function'&&typeof hpXahauSess==='function'){ hpEvWait=async function(acct,from,types,ref,ms,every){ const until=Date.now()+(ms||240000); every=every||5000; let n=0;
  while(Date.now()<until){ n++; try{ const r=await hpXahauSess(async q=>q({command:'account_tx',account:acct,ledger_index_min:from,ledger_index_max:-1,forward:true,limit:100}),20000); const f=hpEvFind(r&&r.transactions,types,ref); if(f) return f; }catch(e){}
    try{ if(hpFgOn()) hpActSet('act_ledger',{n:n}); }catch(e){} await new Promise(r=>setTimeout(r,every)); }
  return null; }; hpEvWait.__fg=1; } }catch(e){}
try{ if(typeof hpXmWaitResolved==='function'&&!hpXmWaitResolved.__fg){ hpXmWaitResolved=async function(XM,uuid,resolvedP){ let done=false, wake=null, n=0; const kick=()=>{ try{ if(wake) wake(); }catch(e){} };
  const poll=(async()=>{ while(!done){ await new Promise(r=>{ wake=r; setTimeout(r,HP_XM_POLL); }); wake=null; if(done) return null; n++; try{ if(hpFgOn()) hpActSet('act_xm_poll',{n:n}); }catch(e){} try{ const p=await XM.payload.get(uuid); const m=(p&&p.meta)||{}; if(m.resolved||m.expired||m.cancelled) return {signed:!!m.signed}; }catch(e){} } return null; })();
  const sub=resolvedP?Promise.resolve(resolvedP).then(ev=>({signed:!!(ev&&ev.signed)}),()=>({signed:false})):new Promise(()=>{});
  HP_XW_KICK.add(kick); try{ const r=await Promise.race([sub,poll]); done=true; kick(); return r; } finally{ HP_XW_KICK.delete(kick); } }; hpXmWaitResolved.__fg=1; } }catch(e){}
try{ if(typeof document!=='undefined'&&document&&typeof document.addEventListener==='function') document.addEventListener('visibilitychange',()=>{ try{ if(document.hidden||!hpFgOn()) return; try{ hpToast(T('rn_fg_back'),4000); }catch(e){} Promise.resolve(hpFgLock()).catch(()=>{}); for(const k of Array.from(HP_XW_KICK)){ try{ k(); }catch(e){} } hpActDraw(); }catch(e){} }); }catch(e){}

function hpHoAfterRent(){ try{ if(!ID||!ID.prev||ID.prev.sentAt||(typeof hpKillMe==='function'&&hpKillMe())) return false; if(typeof hpHoTodo!=='function'||!hpHoTodo().length||typeof hpHoReqFlow!=='function') return false;
  if(typeof document!=='undefined'&&document.getElementById('ho-req')) return false; setTimeout(()=>{ try{ if(!document.getElementById('ho-req')) hpHoReqFlow(); }catch(e){} },1500); return true; }catch(e){ return false; } }
try{ if(typeof hpRentAfter==='function'&&!hpRentAfter.__ho){ const f=hpRentAfter; hpRentAfter=async function(J){ const v=await f.apply(this,arguments); try{ if(v===true&&!(J&&J.sub)) hpHoAfterRent(); }catch(e){} return v; }; hpRentAfter.__ho=1; } }catch(e){}

function hpRkReady(){ try{ if(typeof ID==='undefined'||!ID||typeof POST==='undefined'||!POST) return 'noid'; const u=String(POST.url||hpPostUrl()||'');
  if(!u) return 'nopost'; if(!(ID.postRs&&typeof ID.postRs==='object'&&ID.postRs[u]!==undefined)) return 'oldbox'; if(!(ID.postPv&&typeof ID.postPv==='object'&&typeof ID.postPv[u]==='string')) return 'nopv';
  if(ID.moveJob||(typeof HP_MOVE!=='undefined'&&HP_MOVE)||ID.rentJob) return 'moving';
  const o=ID.leaseOld; if(o&&o.url&&!o.end&&!o.lsOff&&o.url!==u) return 'oldlease';
  return ''; }catch(e){ return 'err'; } }
function hpRkToDev(why){ try{ if(typeof ID==='undefined'||!ID||ID.privateKeyPem||ID.link||!ID.rootGone||!ID.rkPre||!ID.rkPre.dev) return false;
  const p=ID.rkPre, now=Date.now(), seen={};
  const sibs=(Array.isArray(ID.devs)?ID.devs:[]).filter(d=>d&&typeof d.dev==='string'&&d.dev!==p.dev&&!seen[d.dev]&&(seen[d.dev]=1)).map(d=>({dev:d.dev,devSig:d.devSig||'',label:String(d.label||'').slice(0,32),at:Number(d.at)||0,pre:d.pre||null,seen:Number(d.seen)||0}));
  const link={dev:p.dev,devSig:p.devSig||'',rs:1,own:1,at:now,label:hpDevLabelGuess(),main:{},sibs:sibs,gone:Array.isArray(ID.gone)?ID.gone:[],devsAt:0};
  if(ID.leaseOld&&typeof ID.leaseOld==='object'&&ID.leaseOld.url) link.postOld=Object.assign({},ID.leaseOld);
  const u=String((POST&&POST.url)||hpPostUrl()||''); if(u){ ID.boxOwn=u; ID.boxDevs=sibs.map(d=>d.dev); }
  for(const k of ['devs','gone','devsDue','mainSig','leaseOld','postSig','rkPre']) delete ID[k];
  ID.link=link; saveID();
  hpLog('元鍵を消したので、この端末をほかの端末と同じ形にした（自分のほかの端末 '+sibs.length+' 台・郵便受けはこの端末が借りたもの'+(why?'・'+why:'')+'）');
  try{ renderDevMode(); }catch(e){} try{ renderDevices(); }catch(e){} try{ if(typeof hpPaperUi==='function') hpPaperUi(); }catch(e){}
  return true; }catch(e){ try{ hpLog('この端末をほかの端末と同じ形にできない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; } }
try{ if(typeof hpRkErase==='function'&&!hpRkErase.__td){ const f=hpRkErase; hpRkErase=async function(why,inFlow){
  if(typeof ID==='undefined'||!ID||!ID.privateKeyPem||ID.link||!(typeof hpRkOn==='function'&&hpRkOn())) return f.apply(this,arguments);
  const w=hpRkReady(); if(w){ hpLog('元鍵をまだ消さない（'+({nopost:'郵便受けが無い',oldbox:'郵便受けが名簿を知らない古い版',nopv:'郵便受けのプログラムを入れ替えられない版',moving:'移設・借りる途中',oldlease:'前の郵便受けの期限の通知をまだ消していない'}[w]||w)+'）'); return false; }
  try{ const me=await hp5Me(); if(!me||!me.dev||!me.devSig) throw new Error('devSig'); ID.rkPre={dev:me.dev,devSig:me.devSig,at:Date.now()}; saveID(); }catch(e){ hpLog('この端末の署名を作れないので、元鍵を消さない（'+((e&&e.message)||e)+'）'); return false; }
  const r=await f.apply(this,arguments);
  if(r===true) hpRkToDev(why); else if(ID&&ID.privateKeyPem){ delete ID.rkPre; saveID(); }
  return r; }; hpRkErase.__td=1; } }catch(e){}
try{ if(typeof hpRkBoot==='function'&&!hpRkBoot.__td){ const f=hpRkBoot; hpRkBoot=async function(why){ try{ if(ID&&!ID.privateKeyPem&&!ID.link&&ID.rootGone&&ID.rkPre) hpRkToDev('続き'); }catch(e){} return f.apply(this,arguments); }; hpRkBoot.__td=1; } }catch(e){}
try{ if(typeof hpRkGone==='function'&&!hpRkGone.__td){ const f=hpRkGone; hpRkGone=function(){ if(f.apply(this,arguments)) return true; try{ return !!(ID&&!ID.privateKeyPem&&ID.link&&ID.link.own&&ID.rootGone&&typeof ID.root==='string'&&ID.root===ID.publicKey&&hpRkLast()); }catch(e){ return false; } }; hpRkGone.__td=1; } }catch(e){}
try{ if(typeof hpRkHasPaper==='function'&&!hpRkHasPaper.__td){ const f=hpRkHasPaper; hpRkHasPaper=function(){ if(f.apply(this,arguments)) return true; try{ return !!(ID&&ID.paperOk&&ID.link&&ID.link.own&&!hpRkDead()&&hpRkGone()); }catch(e){ return false; } }; hpRkHasPaper.__td=1; } }catch(e){}
try{ if(typeof hpDevRows==='function'&&!hpDevRows.__td){ const f=hpDevRows; hpDevRows=function(){ const r=f.apply(this,arguments); try{ if(ID&&ID.link&&ID.link.own&&Array.isArray(r)) return r.filter(x=>x&&(x.me||x.dev)); }catch(e){} return r; }; hpDevRows.__td=1; } }catch(e){}

function hpPmMsg2(id,url,ts,from,dev){ return 'handpost-post:v2:'+id+':'+url+':'+ts+':'+from+':'+dev; }
function hpRkGoneMsg(id,dev,ts){ return 'handpost-rkgone:v1:'+id+':'+dev+':'+ts; }
function hpRkFree(){ try{ return !!(typeof ID!=='undefined'&&ID&&!ID.privateKeyPem&&typeof hpIsChild==='function'&&hpIsChild()&&(ID.link.own||!(ID.link.main&&ID.link.main.dev))); }catch(e){ return false; } }
function hpLsBoxUrl(){ try{ return hpRkFree()?String(hpPostUrl()||''):''; }catch(e){ return ''; } }
async function hpDkSign(msg){ const s=hp5S(), kp=await hpDevKey(); return {dev:hpHex(kp.publicKey),sig:hpHex(s.crypto_sign_detached(s.from_string(msg),kp.privateKey.slice(1)))}; }
function hpMv2Lease(J){ try{ const o={}; if(J&&typeof J.acct==='string'&&/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(J.acct)) o.acct=J.acct; if(J&&typeof J.tok==='string'&&/^[0-9A-Fa-f]{64}$/.test(J.tok)) o.tok=J.tok.toUpperCase(); if(J&&typeof J.host==='string'&&/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(J.host)) o.host=J.host; return (o.acct&&o.tok)?o:null; }catch(e){ return null; } }
async function hpMove2Before(J,url){
  const out={n:0,why:'',skip:1};
  try{ if(!(typeof hpRkOn==='function'&&hpRkOn())||!hpRkFree()) return out;
    const old=String(hpPostUrl()||''); if(!hpPmUrlOk(url)||!hpPmUrlOk(old)||old===url) return out;
    if(ID.boxOwn!==old&&!(J&&J.share)) return out;
    out.skip=0;
    const kp=await hpDevKey(), dev=hpHex(kp.publicKey), ts=Date.now(), k=await hpDkSign(hpPmMsg2(ID.address,url,ts,old,dev));
    const s={url:url,ts:ts,from:old,dev:dev,dsig:k.sig}; const L=hpMv2Lease(J); if(L) s.lease=L;
    ID.link.postSig2=s; ID.link.postTs=ts; saveID();
    const m=hpSibs().length; if(!m) return out;
    if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||POST.url!==old) throw new Error(T('mv2_noold'));
    out.n=await hpSibPut(Object.assign({v:1,type:'sibmv'},s));
    if(out.n<m) out.why=TF('mv2_part',{n:out.n,m:m});
    hpLog('転居届（端末の署名）を自分のほかの端末 '+out.n+' 台へ出した（前の郵便受け経由。新しい場所 '+url+'）');
  }catch(e){ out.why=String((e&&e.message)||e); hpLog('転居届（端末の署名）を出せない '+out.why); }
  return out; }
async function hpMoveIn2(o,r){
  if(!(typeof hpRkOn==='function'&&hpRkOn())){ hpLog('端末の署名の転居届は、まだ受けない（捨てた）'); return false; }
  if(typeof hpIsChild!=='function'||!hpIsChild()){ hpLog('端末の署名の転居届が届いたが、この端末は元鍵のある端末（捨てた）'); return false; }
  const ts=Number(o&&o.ts), url=String((o&&o.url)||''), from=String((o&&o.from)||''), dev=String((o&&o.dev)||'');
  if(!hpPmUrlOk(url)||!hpPmUrlOk(from)||!(ts>0)||ts>Date.now()+600e3||!/^ed[0-9a-f]{64}$/.test(dev)||!/^[0-9a-f]{128}$/.test(String((o&&o.dsig)||''))){ hpLog('転居届の形が違う（捨てた）'); return false; }
  if(r&&r.fromDev&&r.fromDev!==dev){ hpLog('転居届の送り手と署名の端末が違う（捨てた）'); return false; }
  if(dev===ID.link.dev||!hpSibs().some(d=>d&&d.dev===dev)){ hpLog('自分の端末の一覧に無い端末からの転居届（捨てた）'); return false; }
  if(!hpRsVer(o.dsig,hpPmMsg2(ID.address,url,ts,from,dev),dev)){ hpLog('転居届の端末の署名を確かめられない（捨てた）'); return false; }
  if(ts<=(Number(ID.link.postTs)||0)){ hpLog('古い転居届（捨てた）'); return false; }
  ID.link.postTs=ts;
  if(!ID.box6||typeof ID.box6!=='object'||Array.isArray(ID.box6)) ID.box6={};
  const b0=(typeof hpMcBoxRec==='function')?hpMcBoxRec(dev):null; if(!b0||b0.at<ts) ID.box6[dev]={url:url,at:ts};
  const cur=String(hpPostUrl()||''), who=dev.slice(0,10)+'…';
  if(from!==cur||url===cur){ saveID(); hpLog('転居届を受け取った（'+who+' の郵便受け '+from+' → '+url+'）。この端末は '+cur+' のまま'); return true; }
  if(ID.boxJob){ saveID(); hpLog('転居届を受け取ったが、この端末の郵便受けを移している途中なので、つなぎ先は替えない'); return true; }
  const now=Date.now(), own=(ID.boxOwn===cur);
  if(own){ ID.link.postOld={url:cur,at:now,last:now,exp:(typeof hpLeaseExp==='function')?(Number(hpLeaseExp())||0):0,own:1}; delete ID.boxOwn; delete ID.boxDevs; }
  else ID.link.postOld={url:cur,at:now,last:now};
  const L=hpMv2Lease(o&&o.lease);
  if(L){ ID.lease={acct:L.acct,tok:L.tok,at:1}; if(L.host) ID.lease.host=L.host; try{ const m=(ID.leaseByUrl&&typeof ID.leaseByUrl==='object')?ID.leaseByUrl:{}; m[url]=L.tok; const ks=Object.keys(m); while(ks.length>8) delete m[ks.shift()]; ID.leaseByUrl=m; }catch(e){} }
  saveID(); try{ localStorage.setItem('p2p_post',url); }catch(e){}
  hpLog('転居届（端末の署名）を受け取った。郵便受けを '+cur+' から '+url+' に替えて、つなぎ直す'+(own?'（前の郵便受けはこの端末が借りたもの。期限まで見回る）':''));
  try{ if(typeof hpToast==='function') hpToast(T('mv2_in')); }catch(e){}
  setTimeout(()=>{ try{ stopBg(); }catch(e){} setTimeout(()=>{ try{ startBg(); }catch(e){} },1500); },4000);
  if(L) setTimeout(()=>{ try{ if(typeof HP_LG_AT!=='undefined') HP_LG_AT=0; if(typeof hpLeaseFromLedger==='function') hpLeaseFromLedger('mv').catch(()=>{}); }catch(e){} },9000);
  return true; }
try{ if(typeof hpMoveIn==='function'&&!hpMoveIn.__v2){ const f=hpMoveIn; hpMoveIn=async function(o,r){ if(o&&typeof o==='object'&&o.dsig!==undefined) return hpMoveIn2(o,r); return f.apply(this,arguments); }; hpMoveIn.__v2=1; } }catch(e){}
async function hpMoveResend2(O){
  if(typeof ID==='undefined'||!ID||!hpRkFree()||!O||!O.rec||!(typeof hpRkOn==='function'&&hpRkOn())) return 0;
  const s=ID.link.postSig2, rec=O.rec; if(!s||!hpPmUrlOk(s.url)||!(Number(s.ts)>0)||typeof s.dsig!=='string'||s.from!==O.url) return 0;
  if(rec.subsIn||s.url!==hpPostUrl()) return 0;
  if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0;
  const subs=hpSibs().filter(d=>d&&d.dev&&d.devSig).filter(d=>{ try{ const b=(typeof hpMcBoxRec==='function')?hpMcBoxRec(d.dev):null; return !(b&&b.url&&b.url!==s.url&&b.url!==s.from); }catch(e){ return true; } });
  if(!subs.length){ rec.subsIn=Date.now(); saveID(); return 0; }
  let r=null; try{ r=await hpPmReq({op:'dget'}); }catch(e){ hpLog('新しい郵便受けの名簿を読めない（'+((e&&e.message)||e)+'）'); return 0; }
  const here={}; for(const x of ((r&&Array.isArray(r.devs))?r.devs:[])){ if(x&&x.dev&&x.pre) here[x.dev]=1; }
  const left=subs.filter(d=>!here[d.dev]); rec.left=left.length;
  if(!left.length){ rec.subsIn=Date.now(); saveID(); hpLog('自分のほかの端末はみな新しい郵便受けに来た（転居届の出し直しはやめる）'); return 0; }
  const me=await hp5Me(), now=Date.now(), devices=[], devSigs={}, prekeys=[];
  for(const d of left){ if(!hpPreValid(d.pre,d.dev,now)||!(await hp5IdOk(me.id,me.master,d.dev,d.devSig))) continue; devices.push(d.dev); devSigs[d.dev]=d.devSig; prekeys.push({dev:d.dev,x25519:d.pre.x25519,notAfter:d.pre.notAfter,sig:d.pre.sig}); }
  if(!devices.length){ saveID(); return 0; }
  const card={v:3,id:me.id,master:me.master,post:[O.url],devices:devices,devSigs:devSigs,token:JSON.parse(hpIssue(3600e3)),prekeys:prekeys};
  await hpPut(card,JSON.stringify(Object.assign({v:1,type:'sibmv'},s)),'msg');
  rec.resent=(Number(rec.resent)||0)+1; rec.resentAt=Date.now(); saveID();
  hpLog('転居届（端末の署名）を前の郵便受け経由でもう一度出した（まだ新しい郵便受けに来ていない端末 '+devices.length+' 台。'+rec.resent+' 回目）');
  return devices.length; }
async function hpRkTell(){
  try{ if(typeof ID==='undefined'||!ID||!ID.link||!ID.link.own||!ID.link.rkTell||!(typeof hpRkOn==='function'&&hpRkOn())) return 0;
    if(Date.now()-Number(ID.link.rkTell)>35*864e5){ delete ID.link.rkTell; saveID(); return 0; }
    if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0;
    const m=hpSibs().length; if(!m){ delete ID.link.rkTell; saveID(); return 0; }
    const ts=Number(ID.link.rkTell), kp=await hpDevKey(), dev=hpHex(kp.publicKey), k=await hpDkSign(hpRkGoneMsg(ID.address,dev,ts));
    const n=await hpSibPut({v:1,type:'rkgone',dev:dev,ts:ts,dsig:k.sig});
    if(n>=m) delete ID.link.rkTell; saveID();
    hpLog('元鍵を消したことを自分のほかの端末 '+n+' 台に知らせた'+(n<m?'（まだ '+(m-n)+' 台。あとで出し直す）':''));
    return n; }catch(e){ try{ hpLog('元鍵を消したことを知らせられない（'+((e&&e.message)||e)+'）'); }catch(x){} return -1; } }
async function hpRkGoneIn(o,r){
  if(!(typeof hpRkOn==='function'&&hpRkOn())){ hpLog('「元鍵を消した」の知らせは、まだ受けない（捨てた）'); return false; }
  if(typeof hpIsChild!=='function'||!hpIsChild()) return false;
  const m=ID.link.main||{}, dev=String((o&&o.dev)||''), ts=Number(o&&o.ts);
  if(!m.dev||dev!==m.dev||!(r&&r.fromDev===dev)||!(ts>0)||ts>Date.now()+600e3||!/^[0-9a-f]{128}$/.test(String((o&&o.dsig)||''))){ hpLog('「元鍵を消した」の知らせの形が違う・アカウントを作った端末からでない（捨てた）'); return false; }
  if(!hpRsVer(o.dsig,hpRkGoneMsg(ID.address,dev,ts),dev)){ hpLog('「元鍵を消した」の知らせの署名を確かめられない（捨てた）'); return false; }
  const sibs=Array.isArray(ID.link.sibs)?ID.link.sibs:[];
  if(!sibs.some(d=>d&&d.dev===dev)) sibs.unshift({dev:dev,devSig:m.devSig||'',label:String(m.label||'').slice(0,32),at:Number(m.at)||0,pre:m.pre||null,seen:Number(m.seen)||0});
  ID.link.sibs=sibs; ID.link.main={}; ID.link.rkGoneAt=ts;
  try{ const lodge=!(typeof hpBoxSub==='function'&&hpBoxSub()); if(lodge){ if(!ID.box6||typeof ID.box6!=='object'||Array.isArray(ID.box6)) ID.box6={}; const b=(typeof hpMcBoxRec==='function')?hpMcBoxRec(dev):null; if(!(b&&b.url)) ID.box6[dev]={url:String(hpPostUrl()||''),at:1}; } }catch(e){}
  saveID(); hpLog('自分の端末（'+dev.slice(0,10)+'…）が元鍵を消した。どの端末も同じ形になった');
  try{ renderDevMode(); }catch(e){} try{ renderDevices(); }catch(e){}
  return true; }
try{ if(typeof hpSibLetter==='function'&&!hpSibLetter.__rg){ const f=hpSibLetter; hpSibLetter=async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){}
  if(o&&o.v===1&&o.type==='rkgone'){ if(!ID||r.from!==ID.address||r.fromMaster!==ID.publicKey){ hpLog('自分の機械でない相手からの rkgone（捨てた）'); return true; } await hpRkGoneIn(o,r); return true; }
  return f.apply(this,arguments); }; hpSibLetter.__rg=1; } }catch(e){}
try{ if(typeof hpRkToDev==='function'&&!hpRkToDev.__rg){ const f=hpRkToDev; hpRkToDev=function(){ const v=f.apply(this,arguments); try{ if(v===true&&ID&&ID.link&&ID.link.own){ ID.link.rkTell=Date.now(); saveID(); setTimeout(()=>{ hpRkTell().catch(()=>{}); },3000); } }catch(e){} return v; }; hpRkToDev.__rg=1; } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function') setInterval(()=>{ try{ hpRkTell().catch(()=>{}); }catch(e){} },600e3); }catch(e){}
try{ if(typeof hpOldVisit==='function'&&!hpOldVisit.__v2){ const f=hpOldVisit; hpOldVisit=async function(){ let O=null; try{ O=(typeof hpOldGet==='function')?hpOldGet():null; }catch(e){} const n=await f.apply(this,arguments);
  try{ if(O&&O.rec&&O.rec.own&&!O.rec.end&&!hpIsMain()) await hpMoveResend2(O); }catch(e){ hpLog('転居届（端末の署名）を出し直せない（'+((e&&e.message)||e)+'）'); } return n; }; hpOldVisit.__v2=1; } }catch(e){}
try{ if(typeof hpLeaseApply==='function'&&!hpLeaseApply.__v2){ const f=hpLeaseApply; hpLeaseApply=function(exp,at,x){ try{ if(x&&typeof x==='object'&&typeof x.url==='string'&&x.url&&x.url!==String(hpPostUrl()||'')) return false; }catch(e){} return f.apply(this,arguments); }; hpLeaseApply.__v2=1; } }catch(e){}

let HP_RK_SHARE=false;
function hpRkShareUi(){ try{ return !!(typeof hpRkOn==='function'&&hpRkOn()&&hpRkFree()&&typeof hpBfOn==='function'&&hpBfOn()); }catch(e){ return false; } }
function hpRkShareOn(){ try{ return !!(HP_RK_SHARE&&typeof HP_MOVE!=='undefined'&&HP_MOVE&&hpRkShareUi()); }catch(e){ return false; } }
try{ if(typeof hpPostUi==='function'&&!hpPostUi.__sh){ const f=hpPostUi; hpPostUi=function(){ const v=f.apply(this,arguments); try{ if(hpRkShareUi()){ const show=(id,on)=>{ const e=document.getElementById(id); if(e&&e.style) e.style.display=on?'':'none'; }, have=(typeof hpPostHave==='function')&&hpPostHave();
  show('post-state',true); show('post-renew',have); show('post-move',have); show('post-pay',have&&typeof hpLeaseAcct==='function'&&!!hpLeaseAcct()); show('post-xm',true); show('post-hosts',true); } }catch(e){} return v; }; Object.assign(hpPostUi,f,{__sh:1});   } }catch(e){}
try{ if(typeof hpHlUi==='function'&&!hpHlUi.__sh){ const f=hpHlUi; hpHlUi=function(){ if(!hpRkShareUi()) return f.apply(this,arguments); const b=hpBfOn; hpBfOn=function(){ return false; }; try{ return f.apply(this,arguments); }finally{ hpBfOn=b; } }; Object.assign(hpHlUi,f,{__sh:1});   } }catch(e){}
try{ if(typeof hpXmQuiet==='function'&&!hpXmQuiet.__sh){ const f=hpXmQuiet; hpXmQuiet=function(){ if(hpRkShareUi()) return false; return f.apply(this,arguments); }; Object.assign(hpXmQuiet,f,{__sh:1});   } }catch(e){}
try{ if(typeof hpMoveOpen==='function'&&!hpMoveOpen.__sh){ const f=hpMoveOpen; hpMoveOpen=function(){ if(!hpRkShareUi()) return f.apply(this,arguments);
  if(ID.rentJob){ hpTell(T('rn_job_left')); return false; }
  HP_MOVE=true; HP_RK_SHARE=true; hpLog('アカウントの郵便受けの移設を始めた（間借りしている端末から。この端末が新しい郵便受けを借り、ほかの端末を連れて行く）');
  try{ hpHsOpen(); }catch(e){} try{ if(typeof HP_HS_PICK!=='undefined'&&HP_HS_PICK) hpHsPick(HP_HS_PICK); }catch(e){} try{ hpMoveUi(); }catch(e){}
  hpTell(T('mv2_pick')); return true; }; Object.assign(hpMoveOpen,f,{__sh:1});   } }catch(e){}
try{ if(typeof hpHsPick==='function'&&!hpHsPick.__sh){ const f=hpHsPick; hpHsPick=async function(){ const v=await f.apply(this,arguments); try{ if(hpRkShareOn()&&!ID.rentJob){ const rb=document.getElementById('btn-hs-rent'), nn=document.getElementById('hs-rent-no'); if(rb){ rb.disabled=false; rb.title=''; rb.textContent=T('btn_hs_move'); } if(nn&&nn.parentNode) nn.parentNode.removeChild(nn); } }catch(e){} return v; }; Object.assign(hpHsPick,f,{__sh:1});   } }catch(e){}
try{ if(typeof hpRentIsMove==='function'&&!hpRentIsMove.__sh){ const f=hpRentIsMove; hpRentIsMove=function(){ if(f.apply(this,arguments)) return true; try{ const J=(typeof HP_RENT_J!=='undefined'&&HP_RENT_J)||(ID&&ID.rentJob)||null; return !!(J&&J.share); }catch(e){ return false; } }; Object.assign(hpRentIsMove,f,{__sh:1});   } }catch(e){}
try{ if(typeof hpBoxSubBefore==='function'&&!hpBoxSubBefore.__sh){ const f=hpBoxSubBefore; hpBoxSubBefore=function(url){ let x=0; try{ x=(ID&&ID.rentJob&&ID.rentJob.share&&typeof hpLeaseExp==='function')?(Number(hpLeaseExp())||0):0; }catch(e){} const v=f.apply(this,arguments);
  try{ if(v&&x&&ID.link&&ID.link.postOld&&!ID.link.postOld.exp){ ID.link.postOld.exp=x; saveID(); } }catch(e){} return v; }; Object.assign(hpBoxSubBefore,f,{__sh:1});   } }catch(e){}
function hpRkShareJob(){ try{ const J=(typeof HP_RENT_J!=='undefined'&&HP_RENT_J)||(typeof ID!=='undefined'&&ID&&ID.rentJob)||null; return !!(J&&J.share); }catch(e){ return false; } }
try{ if(typeof hpRentStart==='function'&&!hpRentStart.__sh){ const f=hpRentStart; hpRentStart=function(){ if(!hpRkShareOn()||typeof HP_BF_ALLOW==='undefined'||HP_BF_ALLOW) return f.apply(this,arguments); HP_BF_ALLOW=true; try{ return f.apply(this,arguments); }finally{ HP_BF_ALLOW=false; } }; Object.assign(hpRentStart,f,{__sh:1});   } }catch(e){}
try{ if(typeof hpRentRun==='function'&&!hpRentRun.__sh){ const f=hpRentRun; hpRentRun=function(J){ try{ if(J&&J.sub&&!J.obre&&!J.share&&hpRkShareOn()) J.share=1; }catch(e){} return f.apply(this,arguments); }; Object.assign(hpRentRun,f,{__sh:1});   } }catch(e){}
try{ if(typeof T==='function'&&!T.__sh){ const f=T; T=function(k){ if((k==='rn_title'||k==='ob_head'||k==='ob_done')&&(hpRkShareOn()||hpRkShareJob())){ try{ if(k==='rn_title') return f('mv2_title'); if(k==='ob_done') return f('rk_sh_done'); return f('mv2_head').split('{h}').join(String((typeof hpMvOldName==='function')?hpMvOldName():''))+'\n'+f('rk_sh_note'); }catch(e){} } return f.apply(this,arguments); }; Object.assign(T,f,{__sh:1});   } }catch(e){}
try{ if(typeof hpRentAfter==='function'&&!hpRentAfter.__sh){ const f=hpRentAfter; hpRentAfter=async function(J){ const v=await f.apply(this,arguments); try{ if(v===true&&J&&J.share){ HP_RK_SHARE=false; HP_MOVE=false; try{ hpMoveUi(); }catch(e){} } }catch(e){} return v; }; Object.assign(hpRentAfter,f,{__sh:1});   } }catch(e){}

let HP_RK_PEND=null;
try{ if(typeof hpRkGone==='function'&&!hpRkGone.__d1){ const f=hpRkGone; hpRkGone=function(){ if(f.apply(this,arguments)) return true; try{ return !!(typeof hpRkOn==='function'&&hpRkOn()&&typeof hpRkFree==='function'&&hpRkFree()&&typeof hpRkLast==='function'&&hpRkLast()); }catch(e){ return false; } }; hpRkGone.__d1=1; } }catch(e){}
function hpRkAny(){ try{ return !!(typeof ID!=='undefined'&&ID&&!ID.privateKeyPem&&typeof hpRkGone==='function'&&hpRkGone()); }catch(e){ return false; } }
async function hpRkKillStart(){
  if(!ID||hpKillMe()){ try{ hpKillUi(); }catch(e){} return false; }
  if(!(await hpAsk({title:T('kl_title'),text:T('cf_kill')+'\n\n'+T('rk_kill_paper'),word:'kill',danger:true,auth:true,ok:T('btn_kill_go'),why:'アカウントを無効にする'}))) return false;
  HP_RK_PEND={k:'kill',at:Date.now()}; const after=function(){ HP_RK_PEND=null; }; after.__rk=1; try{ HP_PAPER_AFTER=after; }catch(e){}
  try{ hpPaperFlow(3); }catch(e){ HP_RK_PEND=null; try{ hpLog('紙の 14 語を打つ画面を開けない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; }
  try{ const g=document.getElementById('paper-go3'); if(g) g.textContent=T('btn_kill_go'); const pi=document.getElementById('paper-post'); if(pi){ pi.style.display='none'; const lb=pi.previousSibling; if(lb&&lb.style) lb.style.display='none'; } }catch(e){}
  hpLog('アカウントを無効にするため、紙の 14 語を打つ画面を開いた'); return 'paper'; }
try{ if(typeof hpPaperPostOk==='function'&&!hpPaperPostOk.__d1){ const f=hpPaperPostOk; hpPaperPostOk=function(v){ if(hpRkAny()&&!String(v==null?'':v).trim()) return true; return f.apply(this,arguments); }; hpPaperPostOk.__d1=1; } }catch(e){}
async function hpRkKillDo(p){
  if(!ID||hpKillMe()) return false;
  let kp; try{ kp=hpRkKp(p); }catch(e){ return false; } if(kp.pub!==ID.publicKey){ try{ kp.sk.fill(0); }catch(e){} return false; }
  const ts=Date.now(), s=hp5S(), sig=hpHex(s.crypto_sign_detached(s.from_string(hpKillMsg(ID.address,ts)),kp.sk)); try{ kp.sk.fill(0); }catch(e){}
  ID.killed={ ts:ts, sig:sig, at:ts, done:{} }; saveID();
  hpLog('このアカウントを無効にした（紙の 14 語で署名）。自分のポストと連絡先 '+hpKillTargets().length+' 人に知らせる');
  try{ stopBg(); }catch(e){}
  try{ hpKillAfter(); }catch(e){}
  await hpKillSpread();
  return true; }
try{ if(typeof hpKillStart==='function'&&!hpKillStart.__d1){ const f=hpKillStart; hpKillStart=function(){ if(hpRkAny()&&!hpKillMe()) return hpRkKillStart(); return f.apply(this,arguments); }; hpKillStart.__d1=1; } }catch(e){}
try{ if(typeof hpRkConfirm==='function'&&!hpRkConfirm.__d1){ const f=hpRkConfirm; hpRkConfirm=function(text){ const r=f.apply(this,arguments);
  try{ const P=HP_RK_PEND; if(r&&r.ok&&P&&P.k==='kill'){ HP_RK_PEND=null; try{ if(typeof HP_PAPER_AFTER!=='undefined'&&HP_PAPER_AFTER&&HP_PAPER_AFTER.__rk) HP_PAPER_AFTER=null; }catch(e){}
    try{ const b=document.getElementById('paper-flow'); if(b&&b.remove) b.remove(); }catch(e){} try{ hpPaperUi(); }catch(e){}
    const p=hpPaperParse(text); Promise.resolve(hpRkKillDo(p)).catch(e=>{ try{ hpLog('無効にできない（'+((e&&e.message)||e)+'）'); }catch(x){} }).then(()=>{ try{ p.fill(0); }catch(e){} }); } }catch(e){}
  return r; }; hpRkConfirm.__d1=1; } }catch(e){}
try{ if(typeof hpPaperInputs==='function'&&!hpPaperInputs.__d1){ const f=hpPaperInputs; hpPaperInputs=function(id){ const pc=f.apply(this,arguments);
  try{ if(id==='paper-in'&&HP_RK_PEND&&HP_RK_PEND.k==='kill'&&pc&&pc.el){ const nt=document.createElement('div'); nt.className='note'; nt.id='rk-kill'; nt.textContent=T('rk_kill_note'); nt.style.cssText='margin-bottom:8px;color:var(--red)'; pc.el.insertBefore(nt,pc.el.firstChild); } }catch(e){}
  return pc; }; hpPaperInputs.__d1=1; } }catch(e){}
function hpRkAsMain(f,self,args){
  if(!(hpRkAny()&&hpKillMe())) return f.apply(self,args);
  const m=hpIsMain; hpIsMain=function(){ return true; }; try{ return f.apply(self,args); }finally{ hpIsMain=m; } }
try{ if(typeof hpHoFlow==='function'&&!hpHoFlow.__d1){ const f=hpHoFlow; hpHoFlow=function(){ return hpRkAsMain(f,this,arguments); }; hpHoFlow.__d1=1; } }catch(e){}
try{ if(typeof hpHoCommit==='function'&&!hpHoCommit.__d1){ const f=hpHoCommit; hpHoCommit=function(){ return hpRkAsMain(f,this,arguments); }; hpHoCommit.__d1=1; } }catch(e){}
try{ if(typeof hpKillUi==='function'&&!hpKillUi.__d1){ const f=hpKillUi; hpKillUi=function(){ const v=f.apply(this,arguments);
  try{ if(!hpRkAny()||typeof document==='undefined'||!document.getElementById) return v; const E=id=>document.getElementById(id), me=hpKillMe();
    const nt=E('kill-note'); if(nt) nt.textContent=T(me?'nt_kill_new_rk':'nt_kill');
    const b=E('btn-kill'); if(b) b.style.display=me?'none':'';
    const bn=E('btn-kill-new'); if(bn){ bn.style.display=me?'':'none'; bn.textContent=T('btn_kill_new'); bn.className='b pri'; bn.onclick=()=>{ try{ if(typeof hpHoFlow==='function') hpHoFlow(); }catch(e){} }; } }catch(e){}
  return v; }; hpKillUi.__d1=1; } }catch(e){}
try{ if(typeof hpPaperUi==='function'&&!hpPaperUi.__d1){ const f=hpPaperUi; hpPaperUi=function(){ const v=f.apply(this,arguments); try{ if(hpRkAny()&&ID&&!ID.paperOk){ const e=document.getElementById('paper-state'); if(e) e.textContent=''; } }catch(e){} return v; }; hpPaperUi.__d1=1; } }catch(e){}

function hpMvQr2Pick(){ try{ if(!(typeof hpRkOn==='function'&&hpRkOn())||!hpRkFree()) return null; const u=String(hpPostUrl()||''); if(!hpPmUrlOk(u)) return null;
  for(const s of [ID.link.postSig2,ID.link.postIn2]){ if(s&&typeof s==='object'&&s.url===u&&hpPmUrlOk(s.from)&&Number(s.ts)>0&&/^ed[0-9a-f]{64}$/.test(String(s.dev||''))&&/^[0-9a-f]{128}$/.test(String(s.dsig||''))) return s; }
  return null; }catch(e){ return null; } }
function hpMvQr2Text(s){ const L=hpMv2Lease(s.lease), p=[String(s.url).replace(/^wss:\/\//,''),String(s.ts),String(s.from).replace(/^wss:\/\//,''),s.dev,s.dsig];
  if(L){ p.push(L.acct,L.tok); if(L.host) p.push(L.host); } return hpMvQrOrigin()+'/#mv2='+encodeURIComponent(p.join('~')); }
function hpMvQr2Parse(h){ const m=/^#?mv2=([^&#]+)$/.exec(String(h||'')); if(!m) return null; let v=''; try{ v=decodeURIComponent(m[1]); }catch(e){ return null; }
  const p=v.split('~'); if(p.length!==5&&p.length!==7&&p.length!==8) return null;
  const o={v:1,type:'sibmv',url:'wss://'+p[0],ts:Number(p[1]),from:'wss://'+p[2],dev:p[3],dsig:p[4]};
  if(!hpPmUrlOk(o.url)||!hpPmUrlOk(o.from)||!(o.ts>0)||!/^[0-9]{1,16}$/.test(p[1])||!/^ed[0-9a-f]{64}$/.test(o.dev)||!/^[0-9a-f]{128}$/.test(o.dsig)) return null;
  if(p.length>5){ const L=hpMv2Lease({acct:p[5],tok:p[6],host:p[7]}); if(!L||(p.length===8&&!L.host)) return null; o.lease=L; }
  return o; }
try{ if(typeof hpMvQrParse==='function'&&!hpMvQrParse.__d2){ const f=hpMvQrParse; hpMvQrParse=function(h){ if(/^#?mv2=/.test(String(h||''))) return hpMvQr2Parse(h); return f.apply(this,arguments); }; hpMvQrParse.__d2=1; } }catch(e){}
try{ if(typeof hpMvQrTake==='function'&&!hpMvQrTake.__d2){ const f=hpMvQrTake; hpMvQrTake=function(){ try{ const h=String(location.hash||''); if(/^#mv2=/.test(h)){ try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){}
  localStorage.setItem(HP_MVQ_K,h.slice(1)+'|'+Date.now()); setTimeout(()=>{ try{ hpToast(T('mv2_qr_got'),4000); }catch(e){} },800); return true; } }catch(e){ return false; } return f.apply(this,arguments); }; hpMvQrTake.__d2=1; } }catch(e){}
try{ if(typeof hpMvQrSig==='function'&&!hpMvQrSig.__d2){ const f=hpMvQrSig; hpMvQrSig=async function(){ const s=hpMvQr2Pick(); if(s) return s; return f.apply(this,arguments); }; hpMvQrSig.__d2=1; } }catch(e){}
try{ if(typeof hpMvQrText==='function'&&!hpMvQrText.__d2){ const f=hpMvQrText; hpMvQrText=function(s){ if(s&&s.dsig) return hpMvQr2Text(s); return f.apply(this,arguments); }; hpMvQrText.__d2=1; } }catch(e){}
try{ if(typeof hpMvQrShow==='function'&&!hpMvQrShow.__d2){ const f=hpMvQrShow; hpMvQrShow=async function(){ const v2=!!hpMvQr2Pick(), r=await f.apply(this,arguments);
  try{ if(v2&&r){ const box=document.getElementById('pt-mvqr'), nt=box&&box.querySelector?box.querySelector('.note'):null; if(nt) nt.textContent=T('rk_qr_nt'); } }catch(e){} return r; }; hpMvQrShow.__d2=1; } }catch(e){}
try{ if(typeof hpMvQrUi==='function'&&!hpMvQrUi.__d2){ const f=hpMvQrUi; hpMvQrUi=function(){ const v=f.apply(this,arguments);
  try{ if(typeof hpRkOn==='function'&&hpRkOn()&&hpRkFree()){ const b=document.getElementById('btn-pt-mvqr'); if(!b) return v; let n=0; try{ n=hpSibs().length; }catch(e){}
    const on=n>0&&!!hpMvQr2Pick()&&!(typeof HP_MOVE!=='undefined'&&HP_MOVE); b.style.display=on?'':'none'; return on?'on':''; } }catch(e){} return v; }; hpMvQrUi.__d2=1; } }catch(e){}
try{ if(typeof hpMoveIn2==='function'&&!hpMoveIn2.__d2){ const f=hpMoveIn2; hpMoveIn2=async function(o,r){ const v=await f.apply(this,arguments);
  try{ if(v===true&&ID&&ID.link&&o&&typeof o==='object'){ const p=ID.link.postIn2; if(!(p&&Number(p.ts)>=Number(o.ts))){ const s={url:String(o.url),ts:Number(o.ts),from:String(o.from),dev:String(o.dev),dsig:String(o.dsig)}; const L=hpMv2Lease(o.lease); if(L) s.lease=L; ID.link.postIn2=s; saveID(); } } }catch(e){}
  return v; }; hpMoveIn2.__d2=1; } }catch(e){}
try{ if(typeof hpRenewHint==='function'&&!hpRenewHint.__d2){ const f=hpRenewHint; hpRenewHint=function(){ if(!(typeof hpRkOn==='function'&&hpRkOn()&&hpRkFree())) return f.apply(this,arguments);
  const m=hpIsMain; hpIsMain=function(){ return true; }; try{ return f.apply(this,arguments); }finally{ hpIsMain=m; } }; hpRenewHint.__d2=1; } }catch(e){}

let HP_RE_RS=null, HP_RE_OK=false;
function hpReWant(me,kind){ const out=[{dev:me,kind:kind}]; try{ for(const d of (Array.isArray(ID.devs)?ID.devs:[])) if(d&&d.dev) out.push({dev:d.dev,kind:(()=>{ try{ return hpDevKindOf(d.label); }catch(e){ return 'other'; } })()}); }catch(e){}
  try{ for(const d of ((HP_RE_RS&&Array.isArray(HP_RE_RS.devs))?HP_RE_RS.devs:[])) if(d&&d.dev&&!out.some(x=>x.dev===d.dev)) out.push({dev:d.dev,kind:d.kind||'other'}); }catch(e){}
  return hpRkDevs(out); }
try{ if(typeof hpRestore==='function'&&!hpRestore.__d2){ const f=hpRestore; hpRestore=async function(text,url,say,idOnly){ HP_RE_RS=null; HP_RE_OK=false; let v;
  try{ v=await f.apply(this,arguments); }catch(e){ HP_RE_RS=null; HP_RE_OK=false; throw e; }
  try{ if(ID){ if(!idOnly&&HP_RE_OK&&!(Array.isArray(ID.roster)&&ID.roster.length)) await hpRkEnsure('紙から戻した'); ID.reAt=Date.now(); saveID(); } }catch(e){ try{ hpLog('戻したあとの名簿を作れない（'+((e&&e.message)||e)+'）'); }catch(x){} }
  HP_RE_RS=null; HP_RE_OK=false; return v; }; hpRestore.__d2=1; } }catch(e){}
try{ if(typeof hpBkFetch==='function'&&!hpBkFetch.__d2){ const f=hpBkFetch; hpBkFetch=async function(){ const v=await f.apply(this,arguments);
  try{ if(typeof HP_RE_BUSY!=='undefined'&&HP_RE_BUSY){ const r=await hpBkReq({op:'dget'}); HP_RE_RS=(r&&r.rs&&typeof r.rs==='object'&&Array.isArray(r.rs.devs))?r.rs:null; hpLog('戻す前に郵便受けの名簿を読んだ（'+(HP_RE_RS?'第 '+HP_RE_RS.n+' 版・端末 '+HP_RE_RS.devs.length+' 台':'名簿なし')+'）'); } }catch(e){ try{ hpLog('郵便受けの名簿を読めない（'+((e&&e.message)||e)+'）'); }catch(x){} }
  return v; }; hpBkFetch.__d2=1; } }catch(e){}
try{ if(typeof hpReApply==='function'&&!hpReApply.__d2){ const f=hpReApply; hpReApply=function(){ const v=f.apply(this,arguments); try{ if(v&&typeof HP_RE_BUSY!=='undefined'&&HP_RE_BUSY) HP_RE_OK=true; }catch(e){} return v; }; hpReApply.__d2=1; } }catch(e){}
try{ if(typeof hpRkEnsure==='function'&&!hpRkEnsure.__d2){ const f=hpRkEnsure; hpRkEnsure=async function(why){
  try{ if(typeof HP_RE_BUSY!=='undefined'&&HP_RE_BUSY&&!HP_RE_OK){ hpLog('紙から戻している途中なので、まだ名簿を作らない（自分のほかの端末を読み終えてから）'); return false; } }catch(e){}
  try{ if((HP_RE_OK||HP_RE_RS)&&ID&&ID.privateKeyPem&&!ID.link&&!(Array.isArray(ID.roster)&&ID.roster.length)){
    const kp=hpRkKpPem(ID.privateKeyPem); if(kp.pub!==ID.publicKey) return false;
    const me=hpHex((await hpDevKey()).publicKey); let kd='other'; try{ kd=hpDevKindOf(hpDevLabelGuess()); }catch(e){}
    const want=hpReWant(me,kd), at=Math.max(Date.now(),Number(HP_RE_RS&&HP_RE_RS.at||0)+1);
    ID.roster=[await hpRkFirst(kp,want,at)]; ID.root=kp.pub; saveID();
    hpLog('紙から戻したので、名簿を第 1 版に作り直した（この端末と、残っている自分の端末 '+(want.length-1)+' 台'+(HP_RE_RS?'・郵便受けの名簿は第 '+HP_RE_RS.n+' 版だった':'')+'）');
    try{ if(typeof hpCardDueMark==='function') hpCardDueMark(1); }catch(e){} return true; } }catch(e){ try{ hpLog('紙から戻した名簿を作れない（'+((e&&e.message)||e)+'）'); }catch(x){} return false; }
  return f.apply(this,arguments); }; hpRkEnsure.__d2=1; } }catch(e){}
async function hpReEraseTick(){ try{ if(typeof ID==='undefined'||!ID||!ID.reAt) return '';
  if(!ID.privateKeyPem){ delete ID.reAt; saveID(); return 'gone'; }
  if(!(typeof hpRkOn==='function'&&hpRkOn())) return 'off';
  if(typeof HP_RE_BUSY!=='undefined'&&HP_RE_BUSY) return 'busy';
  try{ if(typeof document!=='undefined'&&document.getElementById&&document.getElementById('restore-flow')) return 'open'; }catch(e){}
  const ok=await hpRkErase('紙から戻した'); if(ok===true){ delete ID.reAt; saveID(); return 'erased'; } return 'wait'; }catch(e){ return 'err'; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function') setInterval(()=>{ try{ hpReEraseTick().catch(()=>{}); }catch(e){} },60e3); }catch(e){}

try{ if(typeof hpDevRows==='function'&&!hpDevRows.__d3){ const f=hpDevRows; hpDevRows=function(){ const r=f.apply(this,arguments); try{ if(typeof hpRkOn==='function'&&hpRkOn()&&typeof hpRkFree==='function'&&hpRkFree()&&Array.isArray(r)) return r.filter(x=>x&&!(x.role==='main'&&!x.me&&!x.dev)); }catch(e){} return r; }; hpDevRows.__d3=1; } }catch(e){}
try{ if(typeof hpMvBox==='function'&&!hpMvBox.__d3){ const f=hpMvBox; hpMvBox=function(){ const v=f.apply(this,arguments); try{ if(typeof hpRkOn==='function'&&hpRkOn()&&typeof hpRkFree==='function'&&hpRkFree()){ const b=document.getElementById('btn-mv-paper'); if(b&&b.parentNode) b.parentNode.removeChild(b); } }catch(e){} return v; }; hpMvBox.__d3=1; } }catch(e){}

function hpBmW(s,fs){ let w=0; for(const ch of String(s)) w+=(/[\x20-\x7e]/.test(ch)?0.6:1)*fs; return w; }
function hpBmCut(s,fs,max){ s=String(s||''); if(hpBmW(s,fs)<=max) return s; let o=''; for(const ch of s){ if(hpBmW(o+ch+'…',fs)>max) break; o+=ch; } return o+'…'; }
function hpBmShort(l){ const m=/^(.+?) · (.+)$/.exec(String(l||'')); return m?{a:m[2],b:m[1]}:{a:String(l||'')||T('dv_noname'),b:''}; }
function hpBmBrowser(me,dev){ try{ if(me){ const a=(typeof hpDnAuto==='function')?hpDnAuto():''; return hpBmShort(a).b; } const m=(ID&&ID.devBr2&&typeof ID.devBr2==='object')?ID.devBr2:{}; return typeof m[dev]==='string'?m[dev]:''; }catch(e){ return ''; } }
function hpBmMd(t){ const d=new Date(Number(t)||0), s=(typeof hpDateIntl==='function')?hpDateIntl(d.getTime(),'md'):''; if(s) return s; return (d.getMonth()+1)+'/'+d.getDate(); }
function hpBmLeft(t){ return Math.floor(((Number(t)||0)-Date.now())/864e5); }
function hpBmHost(u){ const s=String(u||'').replace(/^wss?:\/\//,''), i=s.lastIndexOf(':'); return {h:i>0?s.slice(0,i):s,p:i>0?s.slice(i):''}; }
function hpBmModel(){ try{ if(typeof ID==='undefined'||!ID) return null; const cur=String(hpPostUrl()||''); if(!cur||!(typeof hpPostHave!=='function'||hpPostHave())) return null;
  const rows=(typeof hpDevRows==='function')?hpDevRows():[], devs=[];
  for(const d of rows){ if(!d) continue; const me=!!d.me; if(!me&&!d.dev) continue; let url=''; try{ url=me?cur:String(hpMcBoxOf(d.dev)||''); }catch(e){} if(!url) continue;
    let own=false; try{ own=me?!!(typeof hpBoxSub==='function'&&hpBoxSub()):!!(hpMcBoxRec(d.dev)&&hpMcBoxRec(d.dev).url===url&&url!==cur&&!(ID.link&&ID.link.main&&ID.link.main.dev===d.dev)); }catch(e){}
    const lb=me?((ID.link&&ID.link.label)||(typeof hpDevLabelGuess==='function'?hpDevLabelGuess():'')):d.label, sh=hpBmShort(lb); if(!sh.b) sh.b=hpBmBrowser(me,d.dev); devs.push({dev:d.dev||'',me:me,name:me?T('bm_this'):sh.a,a:sh.a,rb:sh.b,b:sh.b,url:url,own:own}); }
  if(!devs.length) return null;
  { const cnt={}; for(const d of devs) if(!d.me) cnt[d.a]=(cnt[d.a]||0)+1; for(const d of devs) if(!d.me&&cnt[d.a]>1&&d.b) d.name=d.b; }
  let dup=false; { const g={}; for(const d of devs){ const k=d.a+'|'+d.rb; if(g[k]) dup=true; g[k]=1; } }
  const boxes=[]; for(const d of devs){ let b=boxes.find(x=>x.url===d.url); if(!b){ b={url:d.url,devs:[]}; boxes.push(b); } b.devs.push(d); }
  for(const b of boxes){ b.own=b.devs.length===1&&b.devs[0].own; b.me=b.devs.some(d=>d.me); b.cur=b.url===cur;
    b.title=T('bm_box');
    b.on=!!(b.cur&&typeof POST!=='undefined'&&POST&&POST.up&&POST.url===b.url&&!POST.notOwner); b.acct=hpBmAcct(b.url,b.cur); b.exp=b.cur?((typeof hpLeaseExp==='function')?Number(hpLeaseExp())||0:0):0; }
  boxes.sort((x,y)=>(y.me?1:0)-(x.me?1:0)||(x.own?1:0)-(y.own?1:0));
  devs.sort((x,y)=>boxes.findIndex(b=>b.url===x.url)-boxes.findIndex(b=>b.url===y.url)||(y.me?1:0)-(x.me?1:0));
  for(const b of boxes) b.devs.sort((x,y)=>devs.indexOf(x)-devs.indexOf(y));
  const KW={pc:'PC',iphone:'iPhone',android:'Android'}, mach=[];
  for(const d of devs){ let kind='other', named=''; try{ if(d.me){ named=(typeof hpDnMine==='function')?hpDnMine():''; kind=hpDevKindOf((typeof hpDnAuto==='function'&&hpDnAuto())||hpDevLabelGuess()); } else { const r=rows.find(x=>x&&x.dev===d.dev), l=String((r&&r.label)||''); named=/ · /.test(l)?'':l; kind=(named&&typeof hpDnKindOf==='function'&&hpDnKindOf(d.dev))||hpDevKindOf(l); } }catch(e){}
    const kw=KW[kind]||d.a, key=named?'n:'+named:'d:'+d.dev; let m=mach.find(x=>x.key===key); if(!m){ m={key:key,name:named||kw,sub:named?kw:'',devs:[]}; mach.push(m); } m.devs.push(d); d.m=m; }
  devs.sort((x,y)=>mach.indexOf(x.m)-mach.indexOf(y.m)); for(const b of boxes) b.devs.sort((x,y)=>devs.indexOf(x)-devs.indexOf(y));
  for(const d of devs) delete d.m; for(const m of mach) m.idx=m.devs.map(d=>devs.indexOf(d));
  return {name:(typeof myName==='function'&&myName())||String(ID.myName||''),devs:devs,boxes:boxes,mach:mach.map(m=>({name:m.name,sub:m.sub,idx:m.idx,dev:m.devs[0].dev,me:m.devs.some(d=>d.me)})),dup:dup}; }catch(e){ return null; } }
function hpBmAcct(url,cur){ try{ const ok=a=>typeof a==='string'&&/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a); if(cur){ const a=(typeof hpLeaseAcct==='function')?hpLeaseAcct():''; if(ok(a)) return a; } const m=ID&&ID.acctByUrl&&typeof ID.acctByUrl==='object'?ID.acctByUrl[url]:''; return ok(m)?m:''; }catch(e){ return ''; } }
function hpBmAcctShort(a){ return a.slice(0,5)+'…'+a.slice(-4); }
function hpBmEsc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function hpBmAlign(BLs){
  try{ if(!Array.isArray(BLs)) return BLs; const at=L=>Array.isArray(L)?L.findIndex(l=>l&&l.rp):-1, m=Math.max.apply(null,[-1].concat(BLs.map(at))); if(m<0) return BLs;
    for(const L of BLs){ const i=at(L); if(i>=0&&i<m) L.splice(i,0,...Array.from({length:m-i},()=>({gap:true}))); } return BLs; }catch(e){ return BLs; } }
function hpBmSvg(M){ if(!M) return ''; const NB=M.boxes.length, W=(NB>=3&&typeof hpBmWideW==='function')?hpBmWideW(NB):340, C=W/2, n=M.devs.length, gap=8, dw=Math.min(100,(W-gap*(n-1))/n), dx0=(W-(dw*n+gap*(n-1)))/2, MY=84, MH=40, DY=MY+MH+30, DH=40, MA=M.mach||[];
  const per=NB>=3?NB:M.boxes.length>1?2:1, bw=per>=3?(W-10*(per-1))/per:per===2?(W-10)/2:220, BLs=(typeof hpBmBoxLines==='function')?((X=>typeof hpBmAlign==='function'?hpBmAlign(X):X)(M.boxes.map(b=>hpBmBoxLines(b,bw)))):null, BH=BLs?Math.max(96,Math.max.apply(null,BLs.map(L=>25+(L.length-1)*16+16))):96,   BY=DY+DH+66, rows=Math.ceil(M.boxes.length/per), AC=[]; for(const b of M.boxes) if(b.acct&&AC.indexOf(b.acct)<0) AC.push(b.acct); if(M.unk&&M.boxes.some(b=>!b.acct)) AC.push('?');
  const AY=BY+rows*(BH+12)+34, AH=44, aw2=Math.min(160,(W-10*(Math.max(1,AC.length)-1))/Math.max(1,AC.length)), ax0=(W-(aw2*AC.length+10*(AC.length-1)))/2, FB=M.boxes.length>1&&typeof hpBmFbLines==='function', H=(AC.length?AY+AH+8:BY+rows*(BH+12))+34+(FB?16:0);
  const bx=i=>{ const r=Math.floor(i/per), c=i%per, k=Math.min(per,M.boxes.length-r*per); const x0=(W-(bw*k+10*(k-1)))/2; return {x:x0+c*(bw+10),y:BY+r*(BH+12)}; };
  const o=[], acc=hpBmCut('🖐 '+(M.name||T('bm_noname')),15,150), aw=Math.max(100,hpBmW(acc,15)+28);
  o.push('<svg viewBox="-58 0 '+(W+58)+' '+H+'" width="100%" role="img" aria-label="'+hpBmEsc(T('bm_title'))+'" style="display:block;max-width:'+(NB>=3?W+58:420)+'px;margin:0 auto">');
  const dc=i=>dx0+i*(dw+gap)+dw/2;
  const mx=m=>{ const a=Math.min.apply(null,m.idx), b=Math.max.apply(null,m.idx); return {x:dx0+a*(dw+gap),w:(b-a)*(dw+gap)+dw}; };
  o.push('<g stroke="#3a4f6e" stroke-width="2" fill="none">'); MA.forEach(m=>{ const p=mx(m), cx=p.x+p.w/2; o.push('<path d="M'+C+' 46 C'+C+' 66, '+cx+' 62, '+cx+' '+MY+'"/>'); m.idx.forEach(i=>o.push('<path d="M'+cx+' '+(MY+MH)+' C'+cx+' '+(MY+MH+16)+', '+dc(i)+' '+(DY-16)+', '+dc(i)+' '+DY+'"/>')); }); o.push('</g>');
  MA.forEach(m=>{ const p=mx(m), L=[[m.name,12,'#e6edf6',700]]; if(m.sub) L.push([m.sub,10,'#8aa0bd',400]); const y0=MY+(MH-(L.length*14-2))/2+10;
    o.push('<rect x="'+p.x+'" y="'+MY+'" width="'+p.w+'" height="'+MH+'" rx="10" fill="#16213a" stroke="'+(m.me?'#e6edf6':'#3a4f6e')+'" stroke-width="'+(m.me?1.5:1)+'"/>');
    L.forEach((l,j)=>o.push('<text x="'+(p.x+p.w/2)+'" y="'+(y0+j*14)+'" text-anchor="middle" font-size="'+l[1]+'" font-weight="'+l[3]+'" fill="'+l[2]+'">'+hpBmEsc(hpBmCut(l[0],l[1],p.w-10))+'</text>')); });
  const SLOT=5, sx_=(p,i)=>p.x+bw*(i+1)/(SLOT+1);
  if(FB) o.push(hpBmFbLines(M,{bx:bx,sx_:sx_,dc:dc,SLOT:SLOT,bw:bw,BY:BY,DY:DY,DH:DH}));
  M.devs.forEach((d,i)=>{ const bi=M.boxes.findIndex(b=>b.url===d.url), b=M.boxes[bi], p=bx(bi), k=b.devs.indexOf(d), tx=sx_(p,k), col=b.col||(b.own?'#f5b85c':'#35d1b7');
    o.push('<path d="M'+dc(i)+' '+(DY+DH)+' C'+dc(i)+' '+(DY+DH+36)+', '+tx+' '+(BY-36+(p.y-BY))+', '+tx+' '+p.y+'" stroke="'+col+'" stroke-width="3" fill="none"/>'); });
  o.push('<rect x="'+(C-aw/2)+'" y="8" width="'+aw+'" height="38" rx="19" fill="#1b2944" stroke="#e6edf6"/><text x="'+C+'" y="32" text-anchor="middle" font-size="15" font-weight="700" fill="#e6edf6">'+hpBmEsc(acc)+'</text>');
  M.devs.forEach((d,i)=>{ const x=dx0+i*(dw+gap); o.push('<rect x="'+x+'" y="'+DY+'" width="'+dw+'" height="'+DH+'" rx="10" fill="#0e1626" stroke="'+(d.me?'#e6edf6':'#2a3a57')+'" stroke-width="'+(d.me?1.5:1)+'"/>');
    const mk=(d.dev&&typeof hpDevMarkCells==='function')?hpDevMarkCells(d.dev):null, ms=dw>=60?16:0, tx=x+6+(mk&&ms?ms+4:0), tw=x+dw-tx-4;
    if(mk&&ms) o.push('<svg x="'+(x+6)+'" y="'+(DY+(DH-ms)/2)+'" width="'+ms+'" height="'+ms+'" viewBox="0 0 5 5" shape-rendering="crispEdges"><rect width="5" height="5" fill="'+mk.c2+'"/><path fill="'+mk.c1+'" d="'+hpDevMarkPath(mk.cells)+'"/></svg>');
    const L=[[d.b||d.a,12,'#e6edf6']]; if(d.me) L.push([T('bm_this'),10,((M.boxes.find(b=>b.url===d.url)||{}).col||'#35d1b7')]); const y0=DY+(DH-(L.length*15-3))/2+10;
    L.forEach((l,j)=>o.push('<text x="'+tx+'" y="'+(y0+j*15)+'" font-size="'+l[1]+'" fill="'+l[2]+'">'+hpBmEsc(hpBmCut(l[0],l[1],tw))+'</text>')); });
  M.boxes.forEach((b,i)=>{ const p=bx(i), col=b.col||(b.own?'#f5b85c':'#35d1b7'), bg=b.bg||(b.own?'#2e2412':'#0f2a2a'), hp=hpBmHost(b.url), tw=bw-24;
    o.push('<rect x="'+p.x+'" y="'+p.y+'" width="'+bw+'" height="'+BH+'" rx="10" fill="'+bg+'" stroke="'+col+'" stroke-width="1.5"/>');
    for(let k=0;k<SLOT;k++){ const cx=sx_(p,k), on=k<b.devs.length; o.push('<circle cx="'+cx+'" cy="'+p.y+'" r="5" fill="'+(on?col:'#121a2b')+'" stroke="'+col+'" stroke-width="1.5"/>'); }

    if(BLs){ BLs[i].forEach((l,j)=>{ const y=p.y+25+j*16; let x=p.x+12; if(l.gap) return; if(l.bars){ if(typeof hpRpBarsLab==='function') o.push(hpRpBarsLab(l.bars,x,y-11,tw,42)); else if(typeof hpRpBarsSvg==='function') o.push(hpRpBarsSvg(l.bars,x,y-11,tw,28)); return; }
      if(l.dev){ const mk=(typeof hpDevMarkCells==='function')?hpDevMarkCells(l.dev):null; if(mk&&typeof hpDevMarkPath==='function'){ o.push('<svg x="'+x+'" y="'+(y-10)+'" width="12" height="12" viewBox="0 0 5 5" shape-rendering="crispEdges"><rect width="5" height="5" fill="'+mk.c2+'"/><path fill="'+mk.c1+'" d="'+hpDevMarkPath(mk.cells)+'"/></svg>'); x+=16; } }
      if(l.port!==undefined) o.push('<text x="'+x+'" y="'+y+'" font-size="'+l.fs+'" fill="#8aa0bd">'+hpBmEsc(l.port)+(l.on?'<tspan dx="'+(l.port?(l.nw?4:8):0)+'" fill="'+l.col+'">'+hpBmEsc(l.nw?String(T('bm_on')).replace(' ',''):T('bm_on'))+'</tspan>':'')+'</text>');
      else o.push('<text x="'+x+'" y="'+y+'" font-size="'+l.fs+'" font-weight="'+l.fw+'" fill="'+l.fill+'">'+hpBmEsc(l.t)+'</text>'); }); return; }
    o.push('<text x="'+(p.x+12)+'" y="'+(p.y+25)+'" font-size="12" font-weight="700" fill="#e6edf6">'+hpBmEsc(hpBmCut(hp.h,12,tw))+'</text>');
    if(hp.p||b.on){ const nw=bw<150; o.push('<text x="'+(p.x+12)+'" y="'+(p.y+43)+'" font-size="'+(nw?10:11)+'" fill="#8aa0bd">'+hpBmEsc(hp.p||'')+(b.on?'<tspan dx="'+(hp.p?(nw?4:8):0)+'" fill="'+col+'">'+hpBmEsc(nw?String(T('bm_on')).replace(' ',''):T('bm_on'))+'</tspan>':'')+'</text>'); }
    if(b.exp){ const lf=Number(b.exp)-Date.now(), ec=lf<=0?'#ff6b6b':lf<7*864e5?'#f5b85c':'#8aa0bd';
      o.push('<text x="'+(p.x+12)+'" y="'+(p.y+64)+'" font-size="11" fill="#8aa0bd">'+hpBmEsc(hpBmCut(TF('bm_exp',{t:hpBmMd(b.exp)}),11,tw))+'</text>');
      o.push('<text x="'+(p.x+12)+'" y="'+(p.y+82)+'" font-size="11" font-weight="700" fill="'+ec+'">'+hpBmEsc(hpBmCut((lf<=0?T('bm_expired'):lf>=2*864e5?TF('bm_left',{n:hpBmLeft(b.exp)}):lf>=2*3600e3?TF('lease_left_h',{n:Math.floor(lf/3600e3)}):TF('lease_left_m',{n:Math.max(1,Math.floor(lf/60e3))})),11,tw))+'</text>'); } });
  M.boxes.forEach((b,i)=>{ const ak=b.acct||(AC.indexOf('?')>=0?'?':''); if(!ak) return; const p=bx(i), j=AC.indexOf(ak), cx=ax0+j*(aw2+10)+aw2/2, sx=p.x+bw/2;
    o.push('<path d="M'+sx+' '+(p.y+BH)+' C'+sx+' '+(p.y+BH+20)+', '+cx+' '+(AY-20)+', '+cx+' '+AY+'" stroke="'+(ak==='?'?'#5d6f8c':'#9b8cff')+'" stroke-width="2" stroke-dasharray="5 4" fill="none"/>'); });
  AC.forEach((a,j)=>{ const x=ax0+j*(aw2+10); if(a==='?'){ o.push('<rect x="'+x+'" y="'+AY+'" width="'+aw2+'" height="'+AH+'" rx="10" fill="#121a2b" stroke="#5d6f8c" stroke-width="1.5" stroke-dasharray="4 3"/><text x="'+(x+aw2/2)+'" y="'+(AY+19)+'" text-anchor="middle" font-size="13" font-weight="700" fill="#8aa0bd">？</text><text x="'+(x+aw2/2)+'" y="'+(AY+35)+'" text-anchor="middle" font-size="10" fill="#8aa0bd">'+hpBmEsc(hpBmCut(T('bm_noacct'),10,aw2-12))+'</text>'); return; }   o.push('<rect x="'+x+'" y="'+AY+'" width="'+aw2+'" height="'+AH+'" rx="10" fill="#1d1838" stroke="#9b8cff" stroke-width="1.5"/>');
    const nk=(typeof hpXmNameOf==='function')?hpXmNameOf(a):'';
    if(nk) o.push('<text x="'+(x+aw2/2)+'" y="'+(AY+18)+'" text-anchor="middle" font-size="12" font-weight="700" fill="#e6edf6">'+hpBmEsc(hpBmCut(nk,12,aw2-12))+'</text><text x="'+(x+aw2/2)+'" y="'+(AY+35)+'" text-anchor="middle" font-size="11" fill="#c9c2ff">'+hpBmEsc(hpBmAcctShort(a))+'</text>');
    else o.push('<text x="'+(x+aw2/2)+'" y="'+(AY+27)+'" text-anchor="middle" font-size="12" font-weight="700" fill="#c9c2ff">'+hpBmEsc(hpBmAcctShort(a))+'</text>'); });
  const lab=(y,h,k)=>{ const t=String(T(k)), L=[]; let cur=''; for(const w of t.split(' ')){ const c=cur?cur+' '+w:w; if(cur&&hpBmW(c,10)>52){ L.push(cur); cur=w; } else cur=c; } if(cur) L.push(cur); const y0=y+h/2-(L.length-1)*6.5;
    L.forEach((l,i)=>o.push('<text x="-56" y="'+(y0+i*13)+'" font-size="10" font-weight="700" fill="#8aa0bd" dominant-baseline="central">'+hpBmEsc(hpBmCut(l,10,54))+'</text>')); };
  lab(MY,MH,'bm_t_dev'); lab(DY,DH,'bm_t_br'); lab(BY,BH,'bm_t_box'); if(AC.length) lab(AY,AH,'bm_t_xm');
  const hit=(x,y,w,h,go,k)=>o.push('<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="10" fill="transparent" data-go="'+go+'" data-k="'+hpBmEsc(k||'')+'" style="cursor:pointer"/>');
  hit(C-aw/2,8,aw,38,'acct',''); MA.forEach(m=>{ const p=mx(m); hit(p.x,MY,p.w,MH,'dev',m.dev); }); M.devs.forEach((d,i)=>hit(dx0+i*(dw+gap),DY,dw,DH,'dev',d.dev)); M.boxes.forEach((b,i)=>{ const p=bx(i); hit(p.x,p.y,bw,BH,'box',b.url); if(BLs){ const j=BLs[i].findIndex(l=>l.rp); if(j>=0) hit(p.x+2,p.y+25+j*16-13,bw-4,(BLs[i][j+1]&&BLs[i][j+1].bars)?66:18,'rep',b.url); }   }); AC.forEach((a,j)=>{ if(a==='?'){ const ub=M.boxes.find(b=>!b.acct), d=ub&&ub.devs&&ub.devs[0]; hit(ax0+j*(aw2+10),AY,aw2,AH,'unk',(ub&&!ub.cur&&d)?String(d.b||d.a||''):''); return; } hit(ax0+j*(aw2+10),AY,aw2,AH,'xm',a); });
  if(FB) o.push('<text x="'+C+'" y="'+(H-38)+'" text-anchor="middle" font-size="11" fill="#8aa0bd">'+hpBmEsc(hpBmCut(T('bm_fb'),11,W+50))+'</text>');
  o.push('<text x="'+C+'" y="'+(H-22)+'" text-anchor="middle" font-size="11" fill="#8aa0bd">'+hpBmEsc(T('bm_slot')).replace(/[●◉○]/g,c=>'<tspan fill="#35d1b7">'+c+'</tspan>')+'</text>');
  o.push('<text x="'+C+'" y="'+(H-6)+'" text-anchor="middle" font-size="11" fill="#8aa0bd">'+hpBmEsc(T(AC.length?'bm_note2':'bm_note'))+'</text></svg>');
  return o.join(''); }
function hpBmUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const st=document.getElementById('post-state'); if(!st||!st.parentNode) return '';
  let c=document.getElementById('post-map'); const M=hpBmModel();
  if(!M){ if(c) c.style.display='none'; return 'none'; }
  if(!c){ c=document.createElement('div'); c.className='card'; c.id='post-map'; st.parentNode.insertBefore(c,st); }
  const svg=hpBmSvg(M), key=JSON.stringify([svg,!!M.dup,M.same||'',M.sameN||0]); if(c.__k!==key){ c.innerHTML='<h2>'+hpBmEsc(T('bm_title'))+' <span style="font-size:11px;font-weight:400;color:#8aa0bd">'+hpBmEsc(T('bm_tap'))+'</span></h2>'+svg+(M.dup?'<div class="note" id="bm-dup" style="color:var(--amber);margin-top:6px">'+hpBmEsc(T('bm_dup'))+'</div>':'')+(M.same?'<div class="note" id="bm-same" style="color:var(--amber);margin-top:6px">'+hpBmEsc(TF('bm_same',{k:M.same,n:M.sameN}))+' <button class="b" type="button" data-go="'+(typeof hpDsAsk==='function'?'ds':'dn')+'" style="margin-left:6px">'+hpBmEsc(typeof hpDsAsk==='function'?TF('ds_btn',{k:M.same}):T('btn_dn0'))+'</button></div>':'');   c.__k=key; }
  if(!c.__go&&typeof c.addEventListener==='function'){ c.__go=1; c.addEventListener('click',ev=>{ try{ const t=ev&&ev.target, g=t&&t.closest?t.closest('[data-go]'):null; if(g) hpBmGo(g.getAttribute('data-go'),g.getAttribute('data-k')||''); }catch(e){} }); }
  c.style.display=''; return 'on'; }catch(e){ return ''; } }
function hpBmFlash(el){ try{ if(!el) return false; if(el.scrollIntoView) el.scrollIntoView({behavior:'smooth',block:'start'}); const o=el.style.outline, of=el.style.outlineOffset; el.style.outline='2px solid #35d1b7'; el.style.outlineOffset='-2px';   setTimeout(()=>{ try{ el.style.outline=o||''; el.style.outlineOffset=of||''; }catch(e){} },1600); return true; }catch(e){ return false; } }
async function hpBmXmAsk(a){ if(typeof ID==='undefined'||!ID||!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(String(a||''))) return false; const cur=(typeof hpXmNameOf==='function')?hpXmNameOf(a):'';
  const wrap=document.createElement('div'); wrap.style.cssText='margin-top:10px'; const i=document.createElement('input'); i.type='text'; i.id='bm-xm-in'; i.maxLength=40; i.value=cur; i.placeholder=T('ph_xm_nick'); i.setAttribute('autocomplete','off'); i.spellcheck=false; i.style.cssText='width:100%'; wrap.appendChild(i);
  i.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); try{ if(typeof HP_ASK_CUR!=='undefined'&&HP_ASK_CUR&&HP_ASK_CUR.ok&&HP_ASK_CUR.ok.onclick) HP_ASK_CUR.ok.onclick(); }catch(e){} } }); setTimeout(()=>{ try{ i.focus(); i.select(); }catch(e){} },60);
  const sa=a.slice(0,6)+'…'+a.slice(-4); const ok=await hpAsk({title:T('bm_xm_title'),text:TF('nt_xm_nick',{a:sa}),node:wrap}); if(!ok) return false;
  const nm=String(i.value||'').trim().slice(0,40); if(!ID.xmNames||typeof ID.xmNames!=='object') ID.xmNames={}; if(nm===cur) return false; if(nm) ID.xmNames[a]=nm; else delete ID.xmNames[a]; try{ if(typeof hpXmAcct==='function'&&hpXmAcct()===a) ID.xmName=nm; }catch(e){} saveID();
  try{ hpToast(nm?TF('xm_nicked',{a:sa,n:nm}):TF('xm_unnicked',{a:sa}),2500); }catch(e){} try{ hpBmUi(); }catch(e){} try{ if(typeof hpXmUi==='function') hpXmUi(); }catch(e){} return true; }
function hpBmGo(go,k){ try{ const E=id=>document.getElementById(id), tab=id=>{ const b=E(id); if(b&&b.click) b.click(); }, vis=e=>!!(e&&e.style&&e.style.display!=='none');
  if(go==='acct'){ tab('t-id'); const a=E('id-addr'); return hpBmFlash(a&&a.closest?(a.closest('.card')||a):a)?'acct':''; }
  if(go==='dev'){ tab('t-id'); return hpBmFlash(E('dev-card'))?'dev':''; }
  if(go==='box'){ if(k&&k===String(hpPostUrl()||'')) return hpBmFlash(E('post-state'))?'box':''; try{ hpToast(TF('bm_box_other',{h:String(k).replace(/^wss:\/\//,'')}),5000); }catch(e){} return 'other'; }
  if(go==='xm'){ hpBmXmAsk(k).catch(()=>{}); return 'name'; }
  return ''; }catch(e){ return ''; } }
try{ if(typeof hpPostUi==='function'&&!hpPostUi.__bm){ const f=hpPostUi; hpPostUi=function(){ const v=f.apply(this,arguments); try{ hpBmUi(); }catch(e){} return v; }; Object.assign(hpPostUi,f,{__bm:1});   } }catch(e){}
function hpBmAcctKeep(url,acct){ try{ if(!ID||typeof url!=='string'||!/^wss:\/\//.test(url)||typeof acct!=='string'||!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(acct)) return false; const m=(ID.acctByUrl&&typeof ID.acctByUrl==='object'&&!Array.isArray(ID.acctByUrl))?ID.acctByUrl:{}; if(m[url]===acct) return false; m[url]=acct; const ks=Object.keys(m); while(ks.length>8) delete m[ks.shift()]; ID.acctByUrl=m; saveID(); return true; }catch(e){ return false; } }
try{ if(typeof hpLeaseApply==='function'&&!hpLeaseApply.__bm){ const f=hpLeaseApply; hpLeaseApply=function(exp,at,x){ try{ if(x&&typeof x==='object'&&x.acct){ const u=(typeof x.url==='string'&&x.url)?x.url:((typeof hpBoxSub==='function'&&hpBoxSub())?'':String(hpPostUrl()||'')); if(u) hpBmAcctKeep(u,x.acct);   } }catch(e){} return f.apply(this,arguments); }; hpLeaseApply.__bm=1; } }catch(e){}
try{ if(typeof hpBmModel==='function'&&!hpBmModel.__k){ const f=hpBmModel; hpBmModel=function(){ try{ const a=(typeof hpLeaseAcct==='function')?hpLeaseAcct():''; if(a) hpBmAcctKeep(String(hpPostUrl()||''),a); }catch(e){} return f.apply(this,arguments); }; hpBmModel.__k=1; } }catch(e){}

let HP_DN_AUTO=null;
function hpDnMine(){ try{ const n=(typeof ID!=='undefined'&&ID&&typeof ID.devName==='string')?ID.devName.trim():''; return n.slice(0,24); }catch(e){ return ''; } }
try{ if(typeof hpDevLabelGuess==='function'&&!hpDevLabelGuess.__dn){ const f=hpDevLabelGuess; HP_DN_AUTO=f; hpDevLabelGuess=function(){ const n=hpDnMine(); return n||f.apply(this,arguments); }; hpDevLabelGuess.__dn=1; } }catch(e){}
function hpDnAuto(){ try{ return HP_DN_AUTO?HP_DN_AUTO():''; }catch(e){ return ''; } }
function hpDnKindOf(dev){ try{ const m=(ID&&ID.devKinds2&&typeof ID.devKinds2==='object')?ID.devKinds2:{}; return typeof m[dev]==='string'?m[dev]:''; }catch(e){ return ''; } }
try{ if(typeof hpDevKindOf==='function'&&!hpDevKindOf.__dn){ const f=hpDevKindOf; hpDevKindOf=function(label){ try{ const l=String(label||''); if(l&&l===hpDnMine()) return f(hpDnAuto());
  const m=(ID&&ID.devLbl2&&typeof ID.devLbl2==='object')?ID.devLbl2:{}; for(const d of Object.keys(m)){ if(m[d]===l){ const k=hpDnKindOf(d); if(k) return k; } } }catch(e){} return f.apply(this,arguments); }; hpDevKindOf.__dn=1; } }catch(e){}
function hpDnSet(nm){ if(typeof ID==='undefined'||!ID) return false; nm=String(nm==null?'':nm).replace(/[\r\n\t]/g,' ').trim().slice(0,24); const was=hpDnMine(); if(nm===was) return false;
  if(nm) ID.devName=nm; else delete ID.devName; if(ID.link&&typeof ID.link==='object') ID.link.label=hpDevLabelGuess(); ID.devNameAt=Date.now(); ID.devNameDue=ID.devNameAt; saveID();
  try{ hpLog(nm?'この端末の名前を付けた（'+nm+'）':'この端末の名前を自動の名前に戻した'); }catch(e){} try{ hpToast(nm?TF('dn_done',{n:nm}):T('dn_clear'),2500); }catch(e){}
  try{ renderDevices(); }catch(e){} try{ hpBmUi(); }catch(e){} setTimeout(()=>{ try{ hpDnTell().catch(()=>{}); }catch(e){} },500); return true; }
async function hpDnAsk(){ if(typeof ID==='undefined'||!ID) return false; const cur=hpDnMine();
  const wrap=document.createElement('div'); wrap.style.cssText='margin-top:10px'; const i=document.createElement('input'); i.type='text'; i.id='dn-in'; i.maxLength=24; i.value=cur; i.placeholder=T('dn_ph'); i.setAttribute('autocomplete','off'); i.spellcheck=false; i.style.cssText='width:100%'; wrap.appendChild(i);
  i.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); try{ if(typeof HP_ASK_CUR!=='undefined'&&HP_ASK_CUR&&HP_ASK_CUR.ok&&HP_ASK_CUR.ok.onclick) HP_ASK_CUR.ok.onclick(); }catch(e){} } });
  setTimeout(()=>{ try{ i.focus(); i.select(); }catch(e){} },60); const ds=(typeof hpDsBox==='function')?hpDsBox(wrap,cur):null;
  const ok=await hpAsk({title:T('dn_title'),text:T('dn_note'),node:wrap}); if(!ok) return false; const r=hpDnSet(i.value); let n=0; if(ds){ try{ n=hpDsApply(ds,i.value); }catch(e){} } return r||n>0; }
async function hpDnTell(){ try{ if(typeof ID==='undefined'||!ID||!ID.devNameDue) return 0; if(Date.now()-Number(ID.devNameDue)>35*864e5){ delete ID.devNameDue; saveID(); return 0; }
    if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0; const m=(typeof hpSibs==='function')?hpSibs().length:0; if(!m){ delete ID.devNameDue; saveID(); return 0; }
    const kp=await hpDevKey(), dev=hpHex(kp.publicKey); let kind='other'; try{ kind=hpDevKindOf(hpDnAuto()); }catch(e){}
    let br=''; try{ const m=/^(.+?) · (.+)$/.exec(String(hpDnAuto()||'')); br=m?m[1]:''; }catch(e){} const n=await hpSibPut({v:1,type:'devname',dev:dev,label:hpDnMine(),kind:kind,br:br,ts:Number(ID.devNameAt)||Date.now()});
    if(n>=m) delete ID.devNameDue; saveID(); hpLog('この端末の名前を自分のほかの端末 '+n+' 台に知らせた'+(n<m?'（まだ '+(m-n)+' 台。あとで出し直す）':'')); return n; }catch(e){ try{ hpLog('この端末の名前を知らせられない（'+((e&&e.message)||e)+'）'); }catch(x){} return -1; } }
function hpDnIn(o,r){
  const dev=String((o&&o.dev)||''), ts=Number(o&&o.ts), lb=String((o&&o.label)||'').replace(/[\r\n\t]/g,' ').trim().slice(0,24);
  if(!/^ed[0-9a-f]{64}$/.test(dev)||!(r&&r.fromDev===dev)||!(ts>0)||ts>Date.now()+600e3){ hpLog('端末の名前の知らせの形が違う（捨てた）'); return false; }
  if(!ID.devNameIn||typeof ID.devNameIn!=='object') ID.devNameIn={}; if(Number(ID.devNameIn[dev])>=ts) return false; ID.devNameIn[dev]=ts;
  const k=['pc','iphone','android','other'].indexOf(o.kind)>=0?o.kind:''; if(!ID.devKinds2||typeof ID.devKinds2!=='object') ID.devKinds2={}; if(k) ID.devKinds2[dev]=k;
  let label=lb; if(!label){ const b0=String((o&&o.br)||'').replace(/[^A-Za-z ]/g,'').slice(0,16)||String((ID.devBr2&&ID.devBr2[dev])||''); label=k==='iphone'?'Safari · iPhone':k==='android'?'Chrome · Android':k==='pc'?((b0||'Chrome')+' · Windows'):''; }
  if(!ID.devLbl2||typeof ID.devLbl2!=='object') ID.devLbl2={}; ID.devLbl2[dev]=label;
  const br=String((o&&o.br)||'').replace(/[^A-Za-z ]/g,'').slice(0,16); if(br){ if(!ID.devBr2||typeof ID.devBr2!=='object') ID.devBr2={}; ID.devBr2[dev]=br; }
  let hit=0; const fix=x=>{ if(x&&x.dev===dev){ x.label=label; hit++; } };
  try{ (Array.isArray(ID.devs)?ID.devs:[]).forEach(fix); }catch(e){} try{ if(ID.link){ fix(ID.link.main); (Array.isArray(ID.link.sibs)?ID.link.sibs:[]).forEach(fix); } }catch(e){}
  saveID(); hpLog('自分の端末（'+dev.slice(0,10)+'…）の名前を「'+(lb||'自動')+'」にした'+(hit?'':'（一覧にまだ無い）'));
  try{ renderDevices(); }catch(e){} try{ hpBmUi(); }catch(e){} return true; }
try{ if(typeof hpSibLetter==='function'&&!hpSibLetter.__dn){ const f=hpSibLetter; hpSibLetter=async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){}
  if(o&&o.v===1&&o.type==='devname'){ if(!ID||r.from!==ID.address){ hpLog('自分の機械でない相手からの devname（捨てた）'); return true; } hpDnIn(o,r); return true; }
  return f.apply(this,arguments); }; hpSibLetter.__dn=1; } }catch(e){}
try{ if(typeof renderDevices==='function'&&!renderDevices.__dn){ const f=renderDevices; renderDevices=function(){ const v=f.apply(this,arguments);
  try{ const list=document.getElementById('dev-list'), rows=(ID&&typeof hpDevRows==='function')?hpDevRows():[], i=rows.findIndex(d=>d&&d.me), row=(list&&list.children&&i>=0)?list.children[i]:null;
    if(row&&!(row.querySelector&&row.querySelector('#btn-dn'))){ const b=document.createElement('button'); b.className='b'; b.id='btn-dn'; b.type='button'; b.textContent=T(hpDnMine()?'btn_dn':'btn_dn0'); b.addEventListener('click',()=>{ hpDnAsk().catch(()=>{}); }); row.appendChild(b); } }catch(e){}
  return v; }; renderDevices.__dn=1; } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function') setInterval(()=>{ try{ hpDnTell().catch(()=>{}); }catch(e){} },600e3); }catch(e){}

const HP_SB_MAX=240;
function hpSbFit(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const sb=document.getElementById('hp-sbox'), bs=document.getElementById('btn-search'), top=document.getElementById('hdr-top'); if(!sb||!bs||!top||!bs.getBoundingClientRect) return false;
    const sl=bs.querySelector&&bs.querySelector('.sl'); bs.style.minWidth=''; if(sl){ sl.style.display=''; sl.style.marginRight=''; }
    const r0=sb.getBoundingClientRect(); if(!(r0.width>0)) return false; let edge=top.getBoundingClientRect().left;
    for(const id of ['me-qr','me-chip']){ const e=document.getElementById(id); if(!e||e.style.display==='none') continue; const q=e.getBoundingClientRect(); if(q.width>0&&q.bottom>r0.top+4&&q.top<r0.bottom-4) edge=Math.max(edge,q.right); }
    { const h=top.querySelector&&top.querySelector('h1'); if(h){ const q=h.getBoundingClientRect(); if(q.width>0&&q.bottom>r0.top+4&&q.top<r0.bottom-4) edge=Math.max(edge,q.right); } }
    const free=Math.floor(r0.left-edge-14), w0=bs.getBoundingClientRect().width; if(!(free>0)) return false;
    const w=Math.min(HP_SB_MAX,w0+free); bs.style.minWidth=w+'px'; if(sl){ if(w>=70){ sl.style.display='inline'; sl.style.marginRight='10px'; } } return w; }catch(e){ return false; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){
  window.addEventListener('resize',()=>{ try{ hpSbFit(); }catch(e){} }); setTimeout(hpSbFit,800); setInterval(()=>{ try{ hpSbFit(); }catch(e){} },3000);
  document.addEventListener('click',ev=>{ try{ const m=ev.target&&ev.target.closest&&ev.target.closest('#contact-list .more'); if(!m) return; setTimeout(()=>{ try{ const row=m.closest('.contact-item'), mn=row&&row.querySelector('.cmenu.on'); if(!mn) return; mn.style.top=''; mn.style.bottom='';
      const q=mn.getBoundingClientRect(), vh=window.innerHeight||document.documentElement.clientHeight, hd=document.querySelector('header'), hb=hd?hd.getBoundingClientRect().bottom:0; if(q.bottom<=vh-8) return;
      const rr=row.getBoundingClientRect(); if(rr.top-q.height-4>hb){ mn.style.top='auto'; mn.style.bottom='calc(100% - 6px)'; } else if(mn.scrollIntoView) mn.scrollIntoView({block:'nearest',behavior:'smooth'}); }catch(e){} },0); }catch(e){} },true);
} }catch(e){}

const HP_MU_MAX=300, HP_MU_KEEP=90*86400e3, HP_MU_Q='p2p_tkmu'; let HP_MU_LAST=null, HP_MU_BUSY=false;
function hpMuOn(a){ return !!(a&&ID&&ID.mute&&typeof ID.mute==='object'&&ID.mute[a]&&ID.mute[a].on===1); }
function hpMuPrune(){ try{ if(!ID||!ID.mute||typeof ID.mute!=='object') return; const now=Date.now(); for(const a of Object.keys(ID.mute)){ const b=ID.mute[a]; if(!b||!(Number(b.at)>0)||(b.on!==1&&now-b.at>HP_MU_KEEP)) delete ID.mute[a]; } const ks=Object.keys(ID.mute); if(ks.length>HP_MU_MAX){ ks.sort((x,y)=>(ID.mute[x].on-ID.mute[y].on)||(ID.mute[x].at-ID.mute[y].at)); for(const a of ks.slice(0,ks.length-HP_MU_MAX)) delete ID.mute[a]; } }catch(e){} }
function hpMuList(){ const m=(ID&&ID.mute&&typeof ID.mute==='object')?ID.mute:{}; return Object.keys(m).sort().map(a=>[a,m[a].on===1?1:0,Number(m[a].at)||0]); }

function hpMuQLoad(){ try{ const a=JSON.parse(hpHGet(HP_MU_Q)||'[]'); return Array.isArray(a)?a.filter(t=>t&&typeof t.id==='string'&&Number(t.exp)>Date.now()):[]; }catch(e){ return []; } }
function hpMuQSave(a){ try{ hpHSet(HP_MU_Q,JSON.stringify(a.slice(-2000))); }catch(e){} }
function hpMuTokens(a){ try{ const m=hpTkLoad()[a]||{}; return Object.keys(m).map(id=>({id:id,exp:Number(m[id])||0})).filter(t=>t.exp>Date.now()); }catch(e){ return []; } }
function hpMuQueue(list,on){ const q=hpMuQLoad(); for(const t of (list||[])){ if(!t||typeof t.id!=='string'||!(Number(t.exp)>Date.now())) continue; const i=q.findIndex(x=>x.id===t.id); const v={id:t.id,exp:Number(t.exp),on:on?1:0}; if(i>=0) q[i]=v; else q.push(v); } hpMuQSave(q); hpMuFlush().catch(()=>{}); return q.length; }
function hpMuBoxOk(){ try{ if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||!POST.url) return false; const m=(ID&&ID.postPv&&typeof ID.postPv==='object')?ID.postPv:{}, w=(typeof hpUpWant==='function')?hpUpWant():''; return !!w&&m[String(POST.url)]===w; }catch(e){ return false; } }
async function hpMuFlush(){
  if(HP_MU_BUSY||!ID||!hpMuBoxOk()) return 0; HP_MU_BUSY=true; let n=0;
  try{ const done=new Set(); for(const on of [1,0]){ const all=hpMuQLoad().filter(t=>t.on===on); for(let i=0;i<all.length&&i<2000;i+=50){ const part=all.slice(i,i+50); await hpSend({op:'mute',on:on,ids:part.map(t=>({id:t.id,exp:t.exp}))}); n+=part.length; for(const t of part) done.add(t.id+'|'+on); hpMuQSave(hpMuQLoad().filter(t=>!done.has(t.id+'|'+t.on))); } } }
  catch(e){ hpLog('郵便受けに通知を切る許可証を知らせられない（つなぎ直したらもう一度）'+((e&&e.message)?' '+e.message:'')); }
  finally{ HP_MU_BUSY=false; }
  if(n) hpLog('郵便受けに、通知を切る・戻す許可証を知らせた（'+n+' 枚）'); return n; }

function hpMuApply(a,on){ const l=hpMuTokens(a); if(l.length) hpMuQueue(l,on); return l.length; }
function hpMuSet(a,on){ if(!ID||!a||a===ID.address) return false; if(!ID.mute||typeof ID.mute!=='object') ID.mute={}; const was=hpMuOn(a); ID.mute[a]={on:on?1:0,at:Date.now()}; hpMuPrune(); saveID();
  const n=(!!on!==was)?hpMuApply(a,!!on):0; try{ hpLog('通知を'+(on?'切った':'戻した')+'（'+((typeof nickOf==='function')?nickOf(a):a)+'。郵便受けへ知らせる許可証 '+n+' 枚）'); }catch(e){}
  try{ renderContacts(); }catch(e){} try{ hpSibSyncSoon(); }catch(e){} return true; }

try{ if(typeof histAdd==='function'&&!histAdd.__mu){ const f=histAdd; histAdd=Object.assign(function(a,dir){ if(dir==='p') HP_MU_LAST={a:a,t:Date.now()}; return f.apply(this,arguments); },f,{__mu:1}); } }catch(e){}
function hpMuQuiet(kind){ return (kind===undefined||kind==='msg')&&!!HP_MU_LAST&&Date.now()-HP_MU_LAST.t<3000&&hpMuOn(HP_MU_LAST.a); }
function hpMuHook(){ try{ if(typeof window==='undefined'||typeof window.notifySound!=='function'||window.notifySound.__mu) return false; const f=window.notifySound; window.notifySound=Object.assign(function(kind){ if(hpMuQuiet(kind)){ try{ hpLog('通知を切った相手の手紙なので、音と知らせは出さない（'+nickOf(HP_MU_LAST.a)+'）'); }catch(e){} return; } return f.apply(this,arguments); },f,{__mu:1}); return true; }catch(e){ return false; } }
try{ if(typeof hpBlUnread==='function'&&!hpBlUnread.__mu){ const f=hpBlUnread; hpBlUnread=Object.assign(function(){ try{ const lo=lastOpenLoad(); let n=0; for(const c of contacts()){ if(hpMuOn(c.address)) continue; const t=lo[c.address]||0; for(const x of histLoad(c.address)){ if(x&&x.d==='p'&&histOrd(x)>t) n++; } } return n; }catch(e){ return f.apply(this,arguments); } },f,{__mu:1}); } }catch(e){}
try{ if(typeof hpBlCard==='function'&&!hpBlCard.__mu){ const f=hpBlCard; hpBlCard=Object.assign(function(){ if(hpMuQuiet('msg')) return false; return f.apply(this,arguments); },f,{__mu:1}); } }catch(e){}

try{ if(typeof hpTkNote==='function'&&!hpTkNote.__mu){ const f=hpTkNote; hpTkNote=Object.assign(function(addr,id,exp){ const v=f.apply(this,arguments); try{ if(v&&hpMuOn(addr)){ const m=hpTkLoad()[addr]||{}; if(m[id]) hpMuQueue([{id:id,exp:m[id]}],1); } }catch(e){} return v; },f,{__mu:1}); } }catch(e){}

try{ if(typeof hpSyncDigest==='function'&&!hpSyncDigest.__mu){ const f=hpSyncDigest; hpSyncDigest=Object.assign(async function(){ const h=await f.apply(this,arguments), n=hpMuList(); if(!n.length) return h; await hpReady(); return hpHex(hp5S().crypto_generichash(16, hp5U(JSON.stringify([h,n])))); },f,{__mu:1}); } }catch(e){}
try{ if(typeof hpSibPut==='function'&&!hpSibPut.__mu){ const f=hpSibPut; hpSibPut=Object.assign(async function(body){ try{ if(body&&body.type==='sibc'&&Number(body.i)===1){ hpMuPrune(); const m=(ID&&ID.mute&&typeof ID.mute==='object')?ID.mute:{}; if(Object.keys(m).length) body.mute=m; } }catch(e){} return f.apply(this,arguments); },f,{__mu:1}); } }catch(e){}
try{ if(typeof hpSibSyncIn0==='function'&&!hpSibSyncIn0.__mu){ const f=hpSibSyncIn0; hpSibSyncIn0=Object.assign(async function(o,r){ const ch=[];
    try{ if(ID&&o&&Array.isArray(o.contacts)&&o.mute&&typeof o.mute==='object'&&!Array.isArray(o.mute)){ if(!ID.mute||typeof ID.mute!=='object') ID.mute={}; const now=Date.now();
      for(const a of Object.keys(o.mute).slice(0,HP_MU_MAX)){ const b=o.mute[a]; if(!b||typeof b!=='object'||!hpIdFmt(a)||a===ID.address) continue; const at=Number(b.at); if(!(at>0)||at>now+HP_CARD_FUTURE) continue; const old=ID.mute[a]; if(old&&!(at>(Number(old.at)||0))) continue; const was=hpMuOn(a); ID.mute[a]={on:b.on===1?1:0,at:at}; if(was!==(b.on===1)) ch.push([a,b.on===1]); }
      hpMuPrune(); } }catch(e){}
    const v=await f.apply(this,arguments);
    if(ch.length){ for(const [a,on] of ch){ try{ hpMuApply(a,on); hpLog('自分の機械で通知を'+(on?'切った':'戻した')+'相手を、この機械でもそろえた（'+nickOf(a)+'）'); }catch(e){} } try{ saveID(); }catch(e){} try{ renderContacts(); }catch(e){} }
    return v; },f,{__mu:1}); } }catch(e){}
try{ if(typeof hpBkPlain==='function'&&!hpBkPlain.__mu){ const f=hpBkPlain; hpBkPlain=Object.assign(function(){ const o=f.apply(this,arguments); try{ const m=(ID&&ID.mute&&typeof ID.mute==='object')?ID.mute:{}, ks=Object.keys(m).sort(); if(o&&ks.length){ o.mute={}; for(const a of ks) o.mute[a]={on:m[a].on===1?1:0,at:Number(m[a].at)||0}; } }catch(e){} return o; },f,{__mu:1}); } }catch(e){}
try{ if(typeof hpReApply==='function'&&!hpReApply.__mu){ const f=hpReApply; hpReApply=Object.assign(function(o){ const v=f.apply(this,arguments); try{ if(ID&&o){ ID.mute={}; const m=(o.mute&&typeof o.mute==='object')?o.mute:{}; for(const a of Object.keys(m)){ if(hpIdFmt(a)&&a!==ID.address) ID.mute[a]={on:(m[a]&&m[a].on===1)?1:0,at:Number(m[a]&&m[a].at)||0}; } } }catch(e){} return v; },f,{__mu:1}); } }catch(e){}

try{ if(typeof hpReadOff==='function'&&!hpReadOff.__mu){ const f=hpReadOff; hpReadOff=Object.assign(function(){ try{ return localStorage.getItem('p2p_noread')==='1'; }catch(e){ return false; } },f,{__mu:1}); } }catch(e){}
try{ if(typeof hpNoreadUi==='function'&&!hpNoreadUi.__mu){ const f=hpNoreadUi; hpNoreadUi=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const x=(typeof document.getElementById==='function')?document.getElementById('hp-noread'):null, lb=x&&x.closest?x.closest('label'):null; if(lb){ lb.style.display='none'; const nt=lb.nextElementSibling; if(nt&&nt.getAttribute&&nt.getAttribute('data-i18n')==='nt_noread') nt.style.display='none'; } }catch(e){}
    return v; },f,{__mu:1}); } }catch(e){}

try{ if(typeof renderContacts==='function'&&!renderContacts.__mu){ const f=renderContacts; renderContacts=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const list=document.getElementById('contact-list'), cs=(typeof contacts==='function')?contacts():[]; if(!list||!list.querySelectorAll) return v; const rows=list.querySelectorAll('.contact-item');
      cs.forEach((c,i)=>{ const row=rows[i]; if(!row||!c||!c.address) return; const mn=row.querySelector('.cmenu'), nm=row.querySelector('.nm'), on=hpMuOn(c.address); if(!mn) return;
        if(on&&nm){ const k=document.createElement('span'); k.className='mut'; k.textContent=' \u{1F515} '+T('mk_mute'); k.style.cssText='font-size:11px;margin-left:6px;color:var(--dim)'; nm.appendChild(k); }
        const b=document.createElement('button'); b.type='button'; b.className='mub'; b.textContent=T(on?'btn_unmute':'btn_mute');
        b.onclick=ev=>{ try{ ev.stopPropagation(); }catch(e){} mn.classList.remove('on'); const who=c.nick||hpIdShort(c.address); hpMuSet(c.address,!on); try{ hpToast(TF(on?'mu_done_off':'mu_done_on',{who:who}),3500); }catch(e){} };
        const ref=mn.children&&mn.children.length>=2?mn.children[mn.children.length-2]:null; if(ref) mn.insertBefore(b,ref); else mn.appendChild(b); });
    }catch(e){} return v; },f,{__mu:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ hpMuHook(); setTimeout(()=>{ try{ hpMuHook(); }catch(e){} },400); setInterval(()=>{ try{ hpMuHook(); hpMuFlush().catch(()=>{}); }catch(e){} },60e3); try{ window.addEventListener('load',()=>{ try{ hpMuHook(); }catch(e){} }); }catch(e){} } }catch(e){}

try{ if(typeof hpPostUi==='function'&&!hpPostUi.__sp){ const f=hpPostUi; hpPostUi=Object.assign(function(){ const v=f.apply(this,arguments); try{ const e=(typeof document!=='undefined'&&document.getElementById)?document.getElementById('post-spare'):null; if(e&&e.style) e.style.display='none'; }catch(e){} return v; },f,{__sp:1}); } }catch(e){}

function hpSwOn(){ try{ return typeof hpRkOn==='function'&&hpRkOn()&&typeof hpRkFree==='function'&&hpRkFree(); }catch(e){ return false; } }
function hpSwMe(){ try{ return String((ID&&ID.link&&ID.link.dev)||(typeof POST!=='undefined'&&POST&&POST.pub)||''); }catch(e){ return ''; } }
function hpSwCands(){ const out=[], cur=String(hpPostUrl()||''); try{ if(cur) out.push(cur); const M=hpBmModel(); for(const b of ((M&&M.boxes)||[])){ if(b&&b.url&&hpPmUrlOk(b.url)&&out.indexOf(b.url)<0) out.push(b.url); } }catch(e){} return out; }
function hpSwWho(u){ try{ const M=hpBmModel(), b=((M&&M.boxes)||[]).find(x=>x&&x.url===u); return b?b.devs.filter(d=>!d.me).map(d=>d.a&&d.b&&d.a!==d.b?((typeof TF==='function'&&typeof I18N!=='undefined'&&I18N.ja&&I18N.ja.bm_dev_of)?TF('bm_dev_of',{a:d.a,b:d.b}):d.a+' の '+d.b):(d.b||d.a)).filter(Boolean).join((typeof hpSep==='function'?hpSep():'・')):''; }catch(e){ return ''; } }
async function hpSwCheck(url){ try{ await hpBoxErrand(url, ask=>ask({op:'pushkey'},'pushkey')); return 'ok'; }catch(e){ const m=String((e&&e.message)||''); return /not owner/.test(m)?'noreg':'fail'; } }
let HP_SW_BUSY=false;
async function hpSwGo(url){
  if(!hpSwOn()||!ID||HP_SW_BUSY) return 'off'; const cur=String(hpPostUrl()||''), h=String(url||'').replace(/^wss:\/\//,'');
  if(!hpPmUrlOk(url)) return 'bad'; if(url===cur){ try{ hpToast(T('sw_same'),3000); }catch(e){} return 'same'; }
  if(ID.boxJob||(typeof HP_MOVE!=='undefined'&&HP_MOVE)){ try{ hpToast(T('sw_busy'),5000); }catch(e){} return 'busy'; }
  HP_SW_BUSY=true; try{
    try{ hpToast(TF('sw_checking',{h:h}),20000); }catch(e){}
    const ck=await hpSwCheck(url); try{ if(typeof hpToastHide==='function') hpToastHide(); }catch(e){}
    if(ck!=='ok'){ try{ await hpTell(TF(ck==='noreg'?'sw_noreg':'sw_fail',{h:h})); }catch(e){} hpLog('この端末の郵便受けを '+url+' に替えられない（'+(ck==='noreg'?'この端末が登録されていない':'つながらない')+'）'); return ck; }
    const now=Date.now(); ID.link.postOld={url:cur,at:now,last:now}; if(ID.boxOwn===cur){ delete ID.boxOwn; delete ID.boxDevs; }
    { const a=(ID.acctByUrl&&typeof ID.acctByUrl==='object')?ID.acctByUrl[url]:'', t=(ID.leaseByUrl&&typeof ID.leaseByUrl==='object')?ID.leaseByUrl[url]:''; ID.lease={at:1}; if(a) ID.lease.acct=a; if(t) ID.lease.tok=t; }
    ID.boxSw={url:url,from:cur,at:now}; saveID(); try{ localStorage.setItem('p2p_post',url); }catch(e){}
    hpLog('この端末の郵便受けを '+cur+' から '+url+' に替えた。つなぎ直す（前の郵便受けは期限まで見回る。自分のほかの端末はそのまま）');
    try{ hpToast(TF('sw_done',{h:h}),6000); }catch(e){}
    setTimeout(()=>{ try{ stopBg(); }catch(e){} setTimeout(()=>{ try{ startBg(); }catch(e){} },1500); },1500);
    setTimeout(()=>{ try{ if(typeof HP_LG_AT!=='undefined') HP_LG_AT=0; if(typeof hpLeaseFromLedger==='function') hpLeaseFromLedger('sw').catch(()=>{}); }catch(e){} },9000);
    return 'ok'; }finally{ HP_SW_BUSY=false; } }
async function hpSwAsk(){
  if(!hpSwOn()) return false; const cs=hpSwCands(), cur=cs[0]||'';
  if(cs.length<2){ try{ await hpTell(T('sw_one')); }catch(e){} return false; }
  const wrap=document.createElement('div'); wrap.style.cssText='margin-top:10px;display:flex;flex-direction:column;gap:8px'; let pick=cur;
  cs.forEach((u,i)=>{ const l=document.createElement('label'); l.className='chk'; l.style.cssText='align-items:flex-start'; const r=document.createElement('input'); r.type='radio'; r.name='hp-sw'; r.value=u; r.checked=(u===cur); r.onchange=()=>{ if(r.checked) pick=u; };
    const s=document.createElement('span'); s.textContent=String(u).replace(/^wss:\/\//,'')+(u===cur?' '+T('sw_cur'):''); const ws=hpSwWho(u); if(ws){ const w=document.createElement('div'); w.className='note'; w.style.cssText='margin:2px 0 0'; w.textContent=TF('sw_who',{w:ws}); s.appendChild(w); } l.appendChild(r); l.appendChild(s); wrap.appendChild(l); });
  if(!(await hpAsk({title:T('sw2_title'),text:T('sw2_note'),node:wrap,ok:T('sw_ok')})  )) return false;
  return (await hpSwGo(pick))==='ok'; }
try{ if(typeof hpBmGo==='function'&&!hpBmGo.__sw){ const f=hpBmGo; hpBmGo=Object.assign(function(go,k){ try{ if(go==='dev'&&hpSwOn()&&k&&k===hpSwMe()){ hpSwAsk().catch(()=>{}); return 'sw'; } }catch(e){} return f.apply(this,arguments); },f,{__sw:1}); } }catch(e){}
try{ if(typeof hpSibPut==='function'&&!hpSibPut.__sw){ const f=hpSibPut; hpSibPut=Object.assign(async function(body){ try{ if(body&&body.type==='sib6'&&body.box&&body.box.url===''&&hpSwOn()&&typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner&&POST.url) body.box.url=String(POST.url); }catch(e){} return f.apply(this,arguments); },f,{__sw:1}); } }catch(e){}
try{ if(typeof hpBoxKick==='function'&&!hpBoxKick.__sw){ const f=hpBoxKick; hpBoxKick=Object.assign(async function(){ const v=await f.apply(this,arguments);
    try{ const s=ID&&ID.boxSw; if(s&&typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner&&POST.url===s.url){ delete ID.boxSw; saveID(); hpLog('替えた郵便受け（'+s.url+'）で名乗った。自分のほかの端末に場所を知らせ、住所録の相手に新しい名刺を配る');
      try{ await hpMcSibSend(true); }catch(e){} try{ hpCardDueMark(1); hpRsRun(()=>hpCardDueRun(true)); }catch(e){} try{ hpBmUi(); }catch(e){} } }catch(e){}
    return v; },f,{__sw:1}); } }catch(e){}

const HP_FB_DOWN=new Map(), HP_FB_DOWN_MS=5*60e3, HP_FB_SENT=new Map(), HP_FB_SENT_MAX=200;
const HP_FB_EVERY=15*60e3, HP_FB_FAST=3*60e3, HP_FB_NOREG=6*3600e3, HP_FB_WAIT=45000, HP_FB_IDLE=12;
let HP_FB_VIS={}, HP_FB_BUSY=false;
function hpFbStopped(e){ const w=String((e&&(e.hpWhy||e.message))||e||''); return /つながらない|返事がない/.test(w); }
function hpFbDead(e){ const w=String((e&&(e.hpWhy||e.message))||e||''); return /つながらない/.test(w); }
function hpFbIsDown(u){ const t=HP_FB_DOWN.get(u); if(!t) return false; if(Date.now()-t>HP_FB_DOWN_MS){ HP_FB_DOWN.delete(u); return false; } return true; }
function hpFbAlts(card, u){ const out=[], seen={}; seen[u]=1;
  for(const b of ((card&&Array.isArray(card.boxes))?card.boxes:[])){ if(!b||typeof b.post!=='string'||!b.post||seen[b.post]||!b.token||typeof b.token.id!=='string') continue;
    if(typeof hpC4PostOk==='function'&&!hpC4PostOk(b.post)) continue; seen[b.post]=1; out.push({post:[b.post],token:b.token}); }
  try{ if(card&&card.token&&typeof card.token.id==='string'&&typeof ID!=='undefined'&&ID&&card.id&&card.id===ID.address){
      const mine=(typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner&&POST.url)?[String(POST.url)]:[];
      for(const v of mine.concat((typeof hpFbUrls==='function')?hpFbUrls():[])){ if(!v||seen[v]||(typeof hpC4PostOk==='function'&&!hpC4PostOk(v))) continue; seen[v]=1; out.push({post:[v],token:card.token}); } } }catch(e){}
  return out; }
function hpFbNote(id, a){ try{ const l=HP_FB_SENT.get(id)||[]; if(!l.some(x=>x.post[0]===a.post[0])) l.push(a); HP_FB_SENT.delete(id); HP_FB_SENT.set(id,l); while(HP_FB_SENT.size>HP_FB_SENT_MAX) HP_FB_SENT.delete(HP_FB_SENT.keys().next().value); }catch(e){} }
try{ if(typeof hpPutGroups==='function'&&!hpPutGroups.__fb){ const f=hpPutGroups; hpPutGroups=Object.assign(function(card){ const out=f.apply(this,arguments);
    try{ for(const g of (Array.isArray(out)?out:[])){ if(g&&Array.isArray(g.post)&&g.post.length===1){ const a=hpFbAlts(card,g.post[0]); if(a.length) Object.defineProperty(g,'__fb',{value:a,enumerable:false,configurable:true}); } } }catch(e){}
    return out; },f,{__fb:1}); } }catch(e){}
try{ if(typeof hpPutOne==='function'&&!hpPutOne.__fb){ const f=hpPutOne; hpPutOne=Object.assign(async function(g, id, kind, link){
    const alts=(!link&&kind!=='sig'&&g&&Array.isArray(g.__fb))?g.__fb:[]; if(!alts.length) return await f.apply(this,arguments);
    const u=g.post[0], self=this, tried={};
    const other=async()=>{ for(const a of alts){ const v=a.post[0]; if(tried[v]||hpFbIsDown(v)) continue; tried[v]=1;
        try{ const r=await f.call(self, Object.assign({}, g, {post:a.post, token:a.token}), id, kind, link); HP_FB_DOWN.delete(v); hpFbNote(id,a);
          try{ hpLog('投函 '+id+'：ふだんの郵便受け（'+u+'）が止まっているので、相手のほかの郵便受け（'+v+'）に '+g.letters.length+' 通を届けた'); }catch(_){} return {r:r}; }
        catch(e){ if(hpFbDead(e)) HP_FB_DOWN.set(v,Date.now()); } }
      return null; };
    if(hpFbIsDown(u)){ const x=await other(); if(x) return x.r; }
    try{ const r=await f.apply(this,arguments); HP_FB_DOWN.delete(u); return r; }
    catch(e){ if(!hpFbStopped(e)) throw e; if(hpFbDead(e)) HP_FB_DOWN.set(u,Date.now()); const x=await other(); if(x) return x.r; throw e; } },f,{__fb:1}); } }catch(e){}
try{ if(typeof hpDrop==='function'&&!hpDrop.__fb){ const f=hpDrop; hpDrop=Object.assign(async function(card, id){
    const fb=HP_FB_SENT.get(id)||[]; if(!fb.length) return await f.apply(this,arguments);
    let n=0, ok=false, err=null; try{ n=Number(await f.apply(this,arguments))||0; ok=true; }catch(e){ err=e; }
    for(const a of fb){ try{ const p=await hpPoolGet(a.post,m=>new Error(m)); const r=(await hpPoolAsk(p,{op:'drop', token:a.token, id:id})).r; if(r&&r.ok){ n+=Number(r.removed)||0; ok=true; } }catch(e){} }
    if(!ok) throw err||new Error('取り消せない'); HP_FB_SENT.delete(id); return n; },f,{__fb:1}); } }catch(e){}
function hpFbUrls(){ try{ if(typeof ID==='undefined'||!ID||typeof hpSibs!=='function') return []; const me=String((typeof hpPostUrl==='function'&&hpPostUrl())||(typeof POST!=='undefined'&&POST&&POST.url)||''), out=[];
    let old=''; try{ const O=(typeof hpOldGet==='function')?hpOldGet():null; old=(O&&O.url)||''; }catch(e){}
    for(const d of hpSibs()){ let u=''; try{ u=String(hpMcBoxOf(d.dev)||''); }catch(e){} if(u&&u!==me&&u!==old&&(typeof hpC4PostOk!=='function'||hpC4PostOk(u))&&out.indexOf(u)<0) out.push(u); }
    return out; }catch(e){ return []; } }
async function hpFbVisit(url, why){
  let c=null, n=0; const out=[];
  try{ const kp=await hpDevKey(); c=await HotPocket.createClient([url], kp); if(typeof hpGateWrap==='function') hpGateWrap(c,url,kp,'自分のほかの端末の郵便受けの見回り');
    c.on(HotPocket.events.contractOutput, r=>{ for(const x of r.outputs){ try{ out.push(JSON.parse(hpText(x))); }catch(e){} } });
    let up=false; try{ up=await hpWithin(c.connect(),20000,'自分のほかの郵便受けへのつなぎ'); }catch(e){ up=false; }
    if(!up) throw new Error('つながらない');
    const send=o=>hpWithin(c.submitContractInput(JSON.stringify(o)),HP_SEND_WAIT,'自分のほかの郵便受けへの送り');
    await send({op:'sync',got:[]});
    const t0=Date.now(); let idle=0, any=false;
    while(Date.now()-t0<HP_FB_WAIT){
      if(!out.length){ if(any&&++idle>=HP_FB_IDLE) break; await sleep(250); continue; } idle=0;
      const o=out.shift();
      if(o&&o.err){ const e=new Error(String(o.err)); e.hpFb=String(o.err); throw e; }
      if(o&&Array.isArray(o.push)){ any=true; const ids=[];
        for(const m of o.push){ if(!m||typeof m.id!=='string') continue; ids.push(m.id); if(hpSeen(m.id,m.exp)) continue; n++;
          try{ await hpDeliver(m); }catch(e){ hpLog('自分のほかの郵便受けの手紙を開けられない '+m.id+' '+((e&&e.message)||e)); if(e&&e.hpOpen&&typeof hpOpenFail==='function') hpOpenFail(e); } }
        try{ hpSeenSave(); }catch(e){}
        if(ids.length) await send({op:'sync',got:ids});
        if(!ids.length&&!(o.left>0)) break; }
    }
    if(!any) throw new Error('返事が無い（sync）');
    if(n) hpLog('自分のほかの郵便受け（'+url+'）に届いていた手紙 '+n+' 通を受け取った（'+(why||'見回り')+'）');
    return n;
  }finally{ if(c){ try{ await c.close(); }catch(e){} } } }
async function hpFbRound(why, force){
  if(HP_FB_BUSY||(typeof HP_BX_BUSY!=='undefined'&&HP_BX_BUSY)||(typeof HP_OLD_BUSY!=='undefined'&&HP_OLD_BUSY)) return '';
  const urls=hpFbUrls(), now=Date.now(); for(const k of Object.keys(HP_FB_VIS)) if(urls.indexOf(k)<0) delete HP_FB_VIS[k];
  const mine=typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner, every=mine?HP_FB_EVERY:HP_FB_FAST;
  const url=urls.find(u=>{ const r=HP_FB_VIS[u]||{}; return force||now-(Number(r.last)||0)>=(r.noreg?HP_FB_NOREG:every); }); if(!url) return '';
  const r=HP_FB_VIS[url]||(HP_FB_VIS[url]={last:0,fail:0}); r.last=now; HP_FB_BUSY=true; let lock=false;
  try{ if(typeof HP_BX_BUSY!=='undefined'){ HP_BX_BUSY=true; lock=true; }
    r.n=await hpFbVisit(url, why); r.ok=Date.now(); r.fail=0; delete r.noreg; }
  catch(e){ const w=String((e&&e.message)||e); r.fail=(Number(r.fail)||0)+1; if(w==='not owner'||w==='removed'||w==='killed') r.noreg=1;
    if(r.fail===1||r.noreg) hpLog('自分のほかの郵便受け（'+url+'）を見られない（'+w+'。'+(r.noreg?'この端末が登録されていない。6 時間後':(mine?'15 分後':'3 分後'))+'にもう一度）'); }
  finally{ HP_FB_BUSY=false; if(lock) HP_BX_BUSY=false; }
  return url; }
function hpFbTick(){ try{ if(typeof ID==='undefined'||!ID) return '';
  if(typeof BG_ON!=='undefined'&&!BG_ON) return 'off';
  if(typeof HP_IOS!=='undefined'&&HP_IOS&&typeof hpHidden==='function'&&hpHidden()) return 'hidden';
  if(typeof navigator!=='undefined'&&navigator&&navigator.onLine===false) return 'offline';
  if(!hpFbUrls().length) return 'none';
  hpFbRound('見回り').catch(()=>{}); return 'go'; }catch(e){ return ''; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ setInterval(hpFbTick,60e3); setTimeout(hpFbTick,45e3); } }catch(e){}

function hpBmFbLines(M,G){ const o=[]; try{ M.boxes.forEach((b,bi)=>{ const p=G.bx(bi), col=b.col||(b.own?'#f5b85c':'#35d1b7'); let k=b.devs.length;
    M.devs.forEach((d,i)=>{ if(b.url===d.url) return; const x0=G.dc(i), tx=k<G.SLOT?G.sx_(p,k):(x0<p.x+G.bw/2?p.x+9:p.x+G.bw-9); k++;
      o.push('<path d="M'+x0+' '+(G.DY+G.DH)+' C'+x0+' '+(G.DY+G.DH+36)+', '+tx+' '+(G.BY-36+(p.y-G.BY))+', '+tx+' '+p.y+'" stroke="'+col+'" stroke-width="1.2" stroke-dasharray="2 3" stroke-linecap="round" opacity="0.85" fill="none"/>'); }); }); }catch(e){}
  return o.join(''); }

const HP_TS_TABS={'p-post':'tab_post','p-id':'tab_id','p-sec':'tab_sec','p-set':'tab_set','p-log':'tab_log'},   HP_TS_MAX=100, HP_TS_LOGMAX=300;
var HP_TS_TAB=null;
function hpTsTab(){ try{ if(typeof document==='undefined'||!document.getElementById) return null; for(const id of Object.keys(HP_TS_TABS)){ const s=document.getElementById(id); if(s&&s.classList&&s.classList.contains('on')) return id; } }catch(e){} return null; }
function hpTsName(){ return T(HP_TS_TABS[HP_TS_TAB]||'tab_post'); }
function hpTsLog(q){ const k=hpSrNorm(q).trim(); if(!k) return []; const L=(typeof HP_LOG_LINES!=='undefined'&&Array.isArray(HP_LOG_LINES))?HP_LOG_LINES:[]; const out=[];
  for(const l of L){ const s=String(l).replace(/\n$/,''); if(hpSrNorm(s).includes(k)) out.push(s); } return out; }
function hpTsVis(el){ try{ for(let e=el;e&&e.nodeType===1;e=e.parentNode){ if(e.id&&HP_TS_TABS[e.id]) return true; const cs=(typeof getComputedStyle==='function')?getComputedStyle(e):null; if(cs&&(cs.display==='none'||cs.visibility==='hidden')) return false; } }catch(e){} return true; }
function hpTsPage(q){ const k=hpSrNorm(q).trim(), out=[]; if(!k||!HP_TS_TAB) return out; const root=document.getElementById(HP_TS_TAB); if(!root||!document.createTreeWalker) return out;
  const w=document.createTreeWalker(root,4 ,null); const seen=new Set(); let n;
  while((n=w.nextNode())){ const p=n.parentNode; if(!p||seen.has(p)) continue; const tg=String(p.nodeName||'').toLowerCase(); if(tg==='script'||tg==='style'||tg==='option') continue;
    const t=String(p.textContent||'').replace(/\s+/g,' ').trim(); if(!t||t.length>400||!hpSrNorm(t).includes(k)) continue; if(!hpTsVis(p)) continue; seen.add(p);
    let at=p; try{ const sv=p.closest?p.closest('svg'):null; if(sv&&sv.parentNode) at=sv.parentNode.closest?(sv.parentNode.closest('.card')||sv.parentNode):sv.parentNode; }catch(e){}
    let h=''; try{ const c=p.closest?p.closest('.card'):null, h2=c&&c.querySelector?c.querySelector('h2'):null; h=h2?String(h2.textContent||'').replace(/\s+/g,' ').trim():''; }catch(e){}
    out.push({el:p,at:at,t:t,h:h}); if(out.length>=HP_TS_MAX) break; }
  return out; }
var HP_TS_FL=null; function hpTsFlOff(){ try{ const f=HP_TS_FL; HP_TS_FL=null; if(f){ clearTimeout(f.t); f.el.style.outline=f.o||''; f.el.style.outlineOffset=f.of||''; } }catch(e){} }
function hpTsGo(it){ try{ hpSrClose(); }catch(e){} hpTsFlOff(); setTimeout(()=>{ try{ const el=it.at||it.el; if(el.scrollIntoView) el.scrollIntoView({block:'center'}); const f={el:el,o:el.style.outline,of:el.style.outlineOffset}; el.style.outline='2px solid #35d1b7'; el.style.outlineOffset='-2px'; f.t=setTimeout(()=>{ if(HP_TS_FL===f) hpTsFlOff(); },1600); HP_TS_FL=f; }catch(e){} },60); return true; }
function hpTsRender(){ const box=document.getElementById('sr-res'), inp=document.getElementById('sr-q'); if(!box||!inp) return null; box.textContent='';
  const note=s=>{ const d=document.createElement('div'); d.className='note'; d.textContent=s; box.appendChild(d); }, head=s=>{ const d=document.createElement('div'); d.className='sr-h'; d.textContent=s; box.appendChild(d); };
  const q=inp.value, log=HP_TS_TAB==='p-log', scope=()=>note(log?T('ts_scope_log'):TF('ts_scope_tab',{tab:hpTsName()}));
  if(!hpSrNorm(q).trim()){ scope(); return null; }
  if(log){ const all=hpTsLog(q); if(!all.length){ note(T('sr_none')); scope(); return all; }
    const L=all.slice(-HP_TS_LOGMAX); head(TF('ts_lines',{n:all.length}));
    const cp=document.createElement('button'); cp.className='b'; cp.type='button'; cp.id='ts-copy'; cp.textContent=TF('ts_copy',{n:all.length}); cp.style.margin='4px 0 8px';
    cp.onclick=()=>{ try{ const txt=all.join('\n')+'\n'; if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(()=>{ cp.textContent=T('ts_copied'); },()=>{ prompt(T('ts_copy0'),txt); }); else prompt(T('ts_copy0'),txt); }catch(e){} };
    box.appendChild(cp);
    if(all.length>L.length) note(TF('ts_older',{n:all.length-L.length}));
    for(const s of L){ const it=document.createElement('div'); it.className='sr-it'; const tx=document.createElement('div'); tx.className='tx'; tx.style.fontFamily='ui-monospace,Menlo,Consolas,monospace'; tx.style.fontSize='12px'; tx.style.whiteSpace='pre-wrap'; tx.style.wordBreak='break-all'; hpSrMarkInto(tx,s,q); it.appendChild(tx); box.appendChild(it); }
    scope(); return all; }
  const r=hpTsPage(q); if(!r.length){ note(T('sr_none')); scope(); return r; }
  head(TF('ts_hits',{n:r.length})+(r.length>=HP_TS_MAX?'+':''));
  for(const x of r){ const it=document.createElement('div'); it.className='sr-it'; if(x.h&&x.h!==x.t){ const nm=document.createElement('div'); nm.className='nm'; nm.textContent=x.h; it.appendChild(nm); } const tx=document.createElement('div'); tx.className='tx'; hpSrMarkInto(tx,x.t,q,60); it.appendChild(tx); it.onclick=()=>hpTsGo(x); box.appendChild(it); }
  scope(); return r; }
try{ if(typeof hpSrOpen==='function'&&!hpSrOpen.__ts){ const f=hpSrOpen; hpSrOpen=Object.assign(function(peer){ HP_TS_TAB=peer?null:hpTsTab(); const v=f.apply(this,arguments);
    try{ const q=document.getElementById('sr-q'); if(q&&HP_TS_TAB){ q.placeholder=HP_TS_TAB==='p-log'?T('ts_ph_log'):TF('ts_ph_tab',{tab:hpTsName()}); hpSrRender(); } }catch(e){} return v; },f,{__ts:1}); } }catch(e){}
try{ if(typeof hpSrRender==='function'&&!hpSrRender.__ts){ const f=hpSrRender; hpSrRender=Object.assign(function(){ if(HP_TS_TAB&&!(typeof HP_SR_PEER!=='undefined'&&HP_SR_PEER)) return hpTsRender(); return f.apply(this,arguments); },f,{__ts:1}); } }catch(e){}
try{ if(typeof document!=='undefined'&&document&&document.getElementById){ const a=document.getElementById('sr-all'); if(a&&a.addEventListener) a.addEventListener('click',()=>{ HP_TS_TAB=null; },true); } }catch(e){}

var HP_NV=null;
function hpNvGrab(){ try{ const box=document.getElementById('sr-res'), q=document.getElementById('sr-q'); if(!box||!box.querySelectorAll) return 0;
    const its=Array.from(box.querySelectorAll('.sr-it')).filter(e=>typeof e.onclick==='function'); const acts=its.map(e=>e.onclick), qv=q?String(q.value||''):'';
    its.forEach((e,i)=>{ if(e.__nv) return; e.__nv=1; e.addEventListener('click',()=>{ HP_NV={q:qv,acts:acts,i:i,peer:(typeof HP_SR_PEER!=='undefined')?HP_SR_PEER:null,tab:HP_TS_TAB}; setTimeout(hpNvUi,80); }); });
    return its.length; }catch(e){ return 0; } }
function hpNvGo(d){ try{ if(!HP_NV) return false; const j=HP_NV.i+d; if(j<0||j>=HP_NV.acts.length) return false; HP_NV.i=j; HP_NV.acts[j](); setTimeout(hpNvUi,80); return true; }catch(e){ return false; } }
function hpNvList(){ try{ if(!HP_NV) return false; const N=HP_NV; HP_SR_PEER=N.peer||null; try{ hpSrScopeUi(); }catch(e){} HP_TS_TAB=N.tab||null;
    const w=document.getElementById('hp-search'), q=document.getElementById('sr-q'); if(!w||!q) return false; q.value=N.q; w.classList.add('on');
    if(N.tab) q.placeholder=N.tab==='p-log'?T('ts_ph_log'):TF('ts_ph_tab',{tab:hpTsName()});
    hpSrRender(); hpNvHide(); try{ const it=document.querySelectorAll('#sr-res .sr-it')[N.i]; if(it&&it.scrollIntoView) it.scrollIntoView({block:'center'}); }catch(e){} return true; }catch(e){ return false; } }
function hpNvHide(){ try{ const b=document.getElementById('hp-nv'); if(b) b.style.display='none'; }catch(e){} return true; }
function hpNvUi(){ try{ if(typeof document==='undefined'||!document.getElementById||!document.createElement) return '';
    let b=document.getElementById('hp-nv'); const N=HP_NV;
    if(!N||N.acts.length<1){ hpNvHide(); return 'none'; }
    if(!b){ b=document.createElement('div'); b.id='hp-nv'; b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 78px);z-index:55;display:flex;align-items:center;gap:6px;width:max-content;max-width:calc(100vw - 24px);box-sizing:border-box;padding:6px 8px 6px 12px;border-radius:22px;background:#16213a;border:1px solid #3a4f6e;box-shadow:0 4px 14px rgba(0,0,0,.45);font-size:13px;color:var(--ink,#e6edf6)';
      b.innerHTML='<span id="nv-t" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1 1 auto"></span><button class="b" type="button" id="nv-prev"></button><button class="b" type="button" id="nv-next"></button><button class="b" type="button" id="nv-list"></button><button class="b" type="button" id="nv-x" aria-label="close">✕</button>';
      document.body.appendChild(b);
      for(const x of b.querySelectorAll('button')){ x.style.padding='6px 10px'; x.style.minWidth='0'; x.style.width='auto'; x.style.flex='0 0 auto'; x.style.whiteSpace='nowrap'; x.style.fontSize='13px'; x.style.margin='0'; }
      document.getElementById('nv-prev').onclick=()=>hpNvGo(-1); document.getElementById('nv-next').onclick=()=>hpNvGo(1); document.getElementById('nv-list').onclick=()=>hpNvList(); document.getElementById('nv-x').onclick=()=>{ HP_NV=null; hpNvHide(); }; }
    const E=id=>document.getElementById(id); E('nv-t').textContent=TF('nv_count',{q:N.q,i:N.i+1,n:N.acts.length}); E('nv-prev').textContent=T('nv_prev'); E('nv-next').textContent=T('nv_next'); E('nv-list').textContent=T('nv_list');
    E('nv-prev').disabled=N.i<=0; E('nv-next').disabled=N.i>=N.acts.length-1; E('nv-prev').style.opacity=N.i<=0?'.4':''; E('nv-next').style.opacity=N.i>=N.acts.length-1?'.4':'';
    b.style.display='flex'; return 'on'; }catch(e){ return ''; } }
try{ if(typeof hpSrRender==='function'&&!hpSrRender.__nv){ const f=hpSrRender; hpSrRender=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpNvGrab(); }catch(e){} return v; },f,{__nv:1}); } }catch(e){}
try{ if(typeof hpSrOpen==='function'&&!hpSrOpen.__nv){ const f=hpSrOpen; hpSrOpen=Object.assign(function(){ HP_NV=null; hpNvHide(); return f.apply(this,arguments); },f,{__nv:1}); } }catch(e){}

const HP_IVR_GAP=10*60e3; var HP_IVR={};
function hpIvRet(r){
  try{
    if(!r||!ID||typeof r.from!=='string'||r.from===ID.address||!isContact(r.from)) return false;
    let o=null; try{ o=JSON.parse(r.body); }catch(e){ return false; }
    if(!o||o.v!==1||o.type!=='msg'||!o.inv) return false;
    const c=(ID.contacts||[]).find(x=>x.address===r.from); if(!c||!c.card||(c.pubKey&&c.pubKey!==r.fromMaster)) return false;
    if(typeof hpBlocked==='function'&&hpBlocked(r.from)) return false;
    const now=Date.now(); if(now-(HP_IVR[r.from]||0)<HP_IVR_GAP) return false; HP_IVR[r.from]=now;
    c.cardDue=1; delete c.cardTry; saveID(); hpLog('招待状の申請が、もう住所録にいる相手から届いた。承認の知らせ（名刺だけの手紙）を返す → '+nickOf(r.from));
    try{ if(typeof hpCardDueRun==='function') Promise.resolve(hpCardDueRun()).catch(()=>{}); }catch(e){}
    return true;
  }catch(e){ return false; } }
try{ if(typeof hpOnMsg==='function'&&!hpOnMsg.__ivr){ const f=hpOnMsg; hpOnMsg=Object.assign(async function(r){ const known=!!(r&&ID&&typeof r.from==='string'&&isContact(r.from)); const v=await f.apply(this,arguments); if(known) hpIvRet(r); return v; },f,{__ivr:1}); } }catch(e){}

const HP_MF_DOWN=30*60e3, HP_MF_RETRY=30*60e3, HP_MF_RETRY2=6*3600e3, HP_MF_WAIT=45000, HP_MF_CANDS=6, HP_MF_MS=4, HP_MF_ACCTS=4;
let HP_MF_BUSY=false, HP_MF_NEXT=0, HP_MF_ST=null, HP_MF_KEEP_AT=0, HP_MS_CACHE={};
const HP_MF_R=/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, HP_MF_HEX64=/^[0-9a-f]{64}$/;
function hpMsKinds(){ try{ if(typeof ID==='undefined'||!ID) return []; if(hpIsMain()) return ['m','d']; if(typeof hpRkFree==='function'&&hpRkFree()&&ID.boxOwn&&ID.boxOwn===String(hpPostUrl()||'')) return ['d']; }catch(e){} return []; }
function hpMsKnown(acct){ try{ const m=(ID&&ID.acctMs&&typeof ID.acctMs==='object'&&!Array.isArray(ID.acctMs))?ID.acctMs[acct]:null; return Array.isArray(m)?m.filter(x=>typeof x==='string'&&HP_MF_HEX64.test(x)):[]; }catch(e){ return []; } }
async function hpLsMs(acct){
  try{ acct=String(acct||''); if(!HP_MF_R.test(acct)) return null; const out=[];
    for(const k of hpMsKinds()){ const ck=acct+'|'+k; if(!HP_MS_CACHE[ck]){ try{ HP_MS_CACHE[ck]=await hpRentSeed(acct,'msg',k); }catch(e){ continue; } } if(HP_MF_HEX64.test(String(HP_MS_CACHE[ck]))&&out.indexOf(HP_MS_CACHE[ck])<0) out.push(HP_MS_CACHE[ck]); }
    for(const x of hpMsKnown(acct)) if(out.indexOf(x)<0) out.push(x);
    return out.length?out.slice(0,HP_MF_MS):null; }catch(e){ return null; } }
function hpMsTake(x){
  try{ if(!x||typeof x!=='object'||typeof ID==='undefined'||!ID) return 0; const acct=String(x.acct||''); if(!HP_MF_R.test(acct)||!Array.isArray(x.ms)) return 0;
    if(!ID.acctMs||typeof ID.acctMs!=='object'||Array.isArray(ID.acctMs)) ID.acctMs={}; const cur=hpMsKnown(acct).slice(); let n=0;
    for(const v of x.ms){ if(typeof v!=='string'||!HP_MF_HEX64.test(v)||cur.indexOf(v)>=0) continue; cur.push(v); n++; }
    if(n){ while(cur.length>HP_MF_MS) cur.shift(); ID.acctMs[acct]=cur; const ks=Object.keys(ID.acctMs); while(ks.length>8) delete ID.acctMs[ks.shift()]; saveID(); hpLog('借りた口座（'+acct.slice(0,8)+'…）の郵便受けの場所を開く鍵を、自分のほかの端末から受け取った（'+n+' 件）'); }
    return n; }catch(e){ return 0; } }
try{ if(typeof hpLeaseApply==='function'&&!hpLeaseApply.__ms){ const f=hpLeaseApply; hpLeaseApply=Object.assign(function(exp,at,x){ try{ hpMsTake(x); }catch(e){} return f.apply(this,arguments); },f,{__ms:1}); } }catch(e){}

function hpMfBoxOk(){ try{ if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||!POST.url) return false; const m=(ID&&ID.postPv&&typeof ID.postPv==='object')?ID.postPv:{}, w=(typeof hpUpWant==='function')?hpUpWant():''; return !!w&&m[String(POST.url)]===w; }catch(e){ return false; } }
async function hpMfRec(){
  try{ if(typeof ID==='undefined'||!ID) return null; const u=String(hpPostUrl()||''); if(!hpPmUrlOk(u)) return null;
    if(hpIsMain()){ let s=ID.postSig; if(!(s&&s.url===u&&/^[0-9a-f]{128}$/.test(String(s.sig||''))&&Number(s.ts)>0)){ const ts=Date.now(); s={url:u,ts:ts,sig:await edSign(hpPmMsg(ID.address,u,ts))}; ID.postSig=s; saveID(); hpLog('移設の知らせを預けるため、いまの郵便受けの場所に実印で署名した（'+u+'）'); }
      return {v:1,type:'sibmv',url:u,ts:Number(s.ts),sig:s.sig}; }
    if(!(typeof hpRkFree==='function'&&hpRkFree())||ID.boxOwn!==u||typeof hpPmMsg2!=='function'||typeof hpDkSign!=='function') return null;
    let s=ID.link.postSig2; if(!(s&&s.url===u&&/^[0-9a-f]{128}$/.test(String(s.dsig||''))&&Number(s.ts)>0)){ const kp=await hpDevKey(), dev=hpHex(kp.publicKey), ts=Date.now(), from=(ID.link.postOld&&hpPmUrlOk(ID.link.postOld.url))?ID.link.postOld.url:u, k=await hpDkSign(hpPmMsg2(ID.address,u,ts,from,dev));
      s={url:u,ts:ts,from:from,dev:dev,dsig:k.sig}; const L=(typeof hpMv2Lease==='function')?hpMv2Lease(ID.lease):null; if(L) s.lease=L; ID.link.postSig2=s; saveID(); hpLog('移設の知らせを預けるため、いまの郵便受けの場所に端末鍵で署名した（'+u+'）'); }
    const o={v:1,type:'sibmv',url:u,ts:Number(s.ts),from:s.from,dev:s.dev,dsig:s.dsig}; if(s.lease) o.lease=s.lease; return o; }catch(e){ return null; } }
async function hpMfKeep(why){
  try{ if(typeof ID==='undefined'||!ID||HP_MF_BUSY||!hpMfBoxOk()||Date.now()<HP_MF_KEEP_AT) return ''; if(ID.rentJob||ID.boxJob||(typeof HP_MOVE!=='undefined'&&HP_MOVE)) return '';
    const u=String(POST.url), rec=await hpMfRec(); if(!rec) return '';
    const k=(ID.mfKeep&&typeof ID.mfKeep==='object')?ID.mfKeep:null; if(k&&k.url===u&&Number(k.ts)===rec.ts) return 'done';
    HP_MF_KEEP_AT=Date.now()+600e3; let r=null; try{ r=await hpPmReq({op:'mvset',rec:rec}); }catch(e){ hpLog('移設の知らせを郵便受けに預けられない（'+((e&&e.message)||e)+'。あとでもう一度）'); return 'err'; }
    if(!(r&&r.ok==='mvset')) return 'err'; ID.mfKeep={url:u,ts:rec.ts,at:Date.now()}; saveID(); HP_MF_KEEP_AT=0;
    hpLog('移設の知らせ（'+(rec.sig?'実印':'端末')+'の署名）を、いまの郵便受けに預けた（長く開いていなかった自分のほかの端末が、台帳からこの郵便受けを見つけたときに読む。'+(why||'')+'）'); return 'ok'; }catch(e){ return ''; } }

function hpMfLodger(){ try{ return !!(typeof ID!=='undefined'&&ID&&typeof hpIsChild==='function'&&hpIsChild()&&!(typeof hpBoxSub==='function'&&hpBoxSub())&&!(ID.boxOwn&&ID.boxOwn===String(hpPostUrl()||''))); }catch(e){ return false; } }
function hpMfAccts(){ const out=[]; try{ const a=ID&&ID.lease&&ID.lease.acct; if(HP_MF_R.test(String(a||''))) out.push(a); const m=(ID&&ID.acctByUrl&&typeof ID.acctByUrl==='object')?ID.acctByUrl:{}; for(const u of Object.keys(m).reverse()){ const x=m[u]; if(HP_MF_R.test(String(x||''))&&out.indexOf(x)<0) out.push(x); } }catch(e){} return out.slice(0,HP_MF_ACCTS); }
async function hpMfLedger(acct,seeds){
  const r=await hpXahauSess(async q=>{
    const o=await q({command:'account_objects',account:acct,ledger_index:'validated'});
    const tob=((o&&o.account_objects)||[]).filter(hpIsLeaseTok), toks={}; for(const t of tob) toks[String(t.index).toUpperCase()]={host:String(t.Issuer||''),buy:0,hash:''};
    const ks=Object.keys(toks), acq={}; if(!ks.length) return {toks:toks,acq:acq}; let marker=null, pages=0;
    do{ const x=await q(Object.assign({command:'account_tx',account:acct,limit:200},marker?{marker:marker}:{})); pages++;
      for(const e of ((x&&x.transactions)||[])){ const tx=(e&&(e.tx||e.tx_json))||{}; if(((e&&e.meta&&e.meta.TransactionResult)||'')!=='tesSUCCESS') continue;
        const h=String(tx.hash||(e&&e.hash)||'').toUpperCase(), tk=String(tx.URITokenID||'').toUpperCase(), when=(Number(tx.date)+HP_LG_EPOCH)*1000;
        if(tx.TransactionType==='URITokenBuy'&&tx.Account===acct&&toks[tk]&&!toks[tk].hash){ toks[tk].hash=h; toks[tk].buy=when; }
        else if(tx.TransactionType==='Payment'&&tx.Account!==acct&&hpHexStr(hpLgParam(tx,HP_LG_TYPE))==='evnAcquireSuccess'){ const ref=hpLgParam(tx,HP_LG_REF).toUpperCase(); if(ref&&!acq[ref]) acq[ref]=hpEvMemo0(tx).data; } }
      marker=(x&&x.marker)||null;
    } while(marker&&ks.some(k=>!toks[k].hash||!acq[toks[k].hash])&&pages<HP_LG_PAGES);
    return {toks:toks,acq:acq}; },90000);
  const out=[];
  for(const k of Object.keys(r.toks)){ const t=r.toks[k], d=t.hash?r.acq[t.hash]:''; if(!d) continue;
    for(const sd of seeds){ try{ const info=hpEvInfo(await hpEvOpen(hpHexStr(d),sd)); out.push({url:hpEvUrl(info),tok:k,buy:t.buy,host:t.host}); break; }catch(e){} } }
  return out.sort((a,b)=>(b.buy||0)-(a.buy||0)); }
async function hpMfProbe(url){
  let c=null; const out=[];
  try{ const kp=await hpDevKey(); c=await HotPocket.createClient([url],kp); if(typeof hpGateWrap==='function') hpGateWrap(c,url,kp,'新しい郵便受けを探す');
    c.on(HotPocket.events.contractOutput,r=>{ for(const x of r.outputs){ try{ out.push(JSON.parse(hpText(x))); }catch(e){} } });
    let up=false; try{ up=await hpWithin(c.connect(),20000,'候補の郵便受けへのつなぎ'); }catch(e){ up=false; }
    if(!up) return {err:'つながらない'};
    const send=o=>hpWithin(c.submitContractInput(JSON.stringify(o)),HP_SEND_WAIT,'候補の郵便受けへの送り');
    await send(await hpClaimMsg()); await send({op:'mvget'});
    const t0=Date.now(); while(Date.now()-t0<HP_MF_WAIT){ if(!out.length){ await sleep(250); continue; } const o=out.shift(); if(o&&o.ok==='claim'&&typeof hpMfOldPv==='function'){ const w=hpMfOldPv(o); if(w) return {err:w}; }   if(o&&o.ok==='mvget') return {rec:o.rec||null}; if(o&&o.err) return {err:String(o.err)}; }
    return {err:'返事が無い（mvget。古い版の郵便受け）'};
  }catch(e){ return {err:String((e&&e.message)||e)}; }finally{ if(c){ try{ await c.close(); }catch(e){} } } }
async function hpMfVerify(rec,url){
  try{ if(!rec||typeof rec!=='object'||rec.url!==url||!hpPmUrlOk(url)||typeof ID==='undefined'||!ID) return ''; const ts=Number(rec.ts); if(!(ts>0)||ts>Date.now()+600e3) return '';
    if(typeof rec.sig==='string'&&/^[0-9a-f]{128}$/.test(rec.sig)){ let v=false; try{ v=await edVerify(ID.publicKey,hpPmMsg(ID.address,url,ts),rec.sig); }catch(e){ v=false; } return v?'v1':''; }
    if(typeof rec.dsig==='string'&&/^[0-9a-f]{128}$/.test(rec.dsig)&&typeof rec.dev==='string'&&/^ed[0-9a-f]{64}$/.test(rec.dev)&&hpPmUrlOk(String(rec.from||''))&&typeof hpPmMsg2==='function'&&typeof hpRsVer==='function'){
      if(!hpSibs().some(d=>d&&d.dev===rec.dev)) return ''; return hpRsVer(rec.dsig,hpPmMsg2(ID.address,url,ts,String(rec.from),rec.dev),rec.dev)?'v2':''; }
    return ''; }catch(e){ return ''; } }
function hpMfPick(list){
  try{ const cur=String(hpPostUrl()||''), known=[cur]; try{ const o=ID.link&&ID.link.postOld; if(o&&hpPmUrlOk(o.url)) known.push(o.url); }catch(e){}
    const ts0=Number(ID.link&&ID.link.postTs)||0, v1=list.filter(x=>x.kind==='v1'&&Number(x.rec.ts)>ts0).sort((a,b)=>Number(b.rec.ts)-Number(a.rec.ts)), v2=list.filter(x=>x.kind==='v2'&&Number(x.rec.ts)>ts0);
    let hit=null; for(let i=0;i<8;i++){ const x=v2.find(y=>known.indexOf(String(y.rec.from))>=0&&known.indexOf(y.url)<0); if(!x) break; hit=x; known.push(x.url); }
    return hit||v1[0]||null; }catch(e){ return null; } }
function hpMfGo(x,why,gone){
  try{ const url=x.url, rec=x.rec, old=String(hpPostUrl()||''), now=Date.now(); if(!hpPmUrlOk(url)||url===old||typeof ID==='undefined'||!ID||!ID.link) return false;
    ID.link.postTs=Number(rec.ts); ID.link.postOld=gone?{url:old,at:now,last:now,end:now,endWhy:'消えた'}:{url:old,at:now,last:now};
    { const a0=(ID.lease&&typeof ID.lease.acct==='string')?ID.lease.acct:'', L=(rec.lease&&typeof hpMv2Lease==='function')?hpMv2Lease(rec.lease):null; ID.lease={at:1}; if(L){ ID.lease.acct=L.acct; ID.lease.tok=L.tok; if(L.host) ID.lease.host=L.host; } else { if(x.acct||a0) ID.lease.acct=x.acct||a0; if(x.tok) ID.lease.tok=x.tok; } }
    try{ if(x.tok){ const m=(ID.leaseByUrl&&typeof ID.leaseByUrl==='object')?ID.leaseByUrl:{}; m[url]=x.tok; const ks=Object.keys(m); while(ks.length>8) delete m[ks.shift()]; ID.leaseByUrl=m; } }catch(e){}
    try{ if(x.acct&&typeof hpBmAcctKeep==='function') hpBmAcctKeep(url,x.acct); }catch(e){}
    saveID(); try{ localStorage.setItem('p2p_post',url); }catch(e){} try{ HP_GONE_LOGGED=false; }catch(e){}
    hpLog('新しい郵便受け（'+url+'）を台帳から見つけた（'+(rec.sig?'実印':'端末')+'の署名の移設の知らせを確かめた。'+(why||'')+'）。'+old+' から替えて、つなぎ直す');
    try{ if(typeof hpToast==='function') hpToast(T('mv2_in')); }catch(e){}
    setTimeout(()=>{ try{ stopBg(); }catch(e){} setTimeout(()=>{ try{ startBg(); }catch(e){} },1500); },1500);
    setTimeout(()=>{ try{ if(typeof HP_LG_AT!=='undefined') HP_LG_AT=0; if(typeof hpLeaseFromLedger==='function') hpLeaseFromLedger('mv').catch(()=>{}); }catch(e){} },9000);
    return true; }catch(e){ return false; } }
function hpMfSt(s){ HP_MF_ST=s; try{ hpMfUi(); }catch(e){} }
async function hpMfFind(why){
  if(HP_MF_BUSY||typeof ID==='undefined'||!ID||!hpMfLodger()) return ''; HP_MF_BUSY=true; let bx=false;
  try{ const cur=String(hpPostUrl()||''), gone=(typeof hpGoneBox==='function')&&hpGoneBox(), accts=hpMfAccts();
    hpMfSt({st:'busy',at:Date.now()}); hpLog('新しい郵便受けの場所を、借りた口座の台帳から探す（'+(why||'')+'。口座 '+accts.length+' 件）');
    if(!accts.length){ hpMfSt({st:'noacct',at:Date.now()}); hpLog('借りた口座の控えがこの端末に無いので探せない'); return 'noacct'; }
    const cands=[]; let keys=0;
    for(const a of accts){ const seeds=hpMsKnown(a); if(!seeds.length) continue; keys++; let l=[]; try{ l=await hpMfLedger(a,seeds); }catch(e){ hpLog('台帳を読めない（'+((e&&e.message)||e)+'）'); hpMfSt({st:'err',at:Date.now()}); return 'err'; }
      for(const x of l){ if(x.url!==cur&&!cands.some(y=>y.url===x.url)) cands.push(Object.assign({acct:a},x)); } }
    if(!keys){ hpMfSt({st:'nokey',at:Date.now()}); hpLog('借りた口座の控えはあるが、郵便受けの場所を開く鍵がこの端末に無いので探せない'); return 'nokey'; }
    hpLog('口座が借りている郵便受けの場所を '+cands.length+' 件開けた'+(cands.length?'：'+cands.map(x=>x.url.replace(/^wss:\/\//,'')).join('・'):''));
    const found=[]; if(typeof HP_BX_BUSY!=='undefined'){ HP_BX_BUSY=true; bx=true; }
    for(const x of cands.slice(0,HP_MF_CANDS)){ const p=await hpMfProbe(x.url); if(p.err){ hpLog('候補 '+x.url+'：'+p.err); continue; } const k=await hpMfVerify(p.rec,x.url); hpLog('候補 '+x.url+'：'+(p.rec?(k?'移設の知らせを確かめた（'+(k==='v1'?'実印':'端末')+'の署名）':'移設の知らせの署名が合わない（捨てた）'):'移設の知らせが無い')); if(k) found.push({url:x.url,rec:p.rec,kind:k,acct:x.acct,tok:x.tok}); }
    if(bx){ HP_BX_BUSY=false; bx=false; }
    const hit=hpMfPick(found); if(hit&&hpMfGo(hit,why,gone)){ hpMfSt({st:'found',at:Date.now(),u:hit.url}); return 'moved'; }
    hpMfSt({st:'none',at:Date.now()}); hpLog('新しい郵便受けの場所は見つからなかった（候補 '+cands.length+' 件・確かめた知らせ '+found.length+' 件）'); return 'none';
  }catch(e){ hpMfSt({st:'err',at:Date.now()}); try{ hpLog('新しい郵便受けを探せない（'+((e&&e.message)||e)+'）'); }catch(_){} return 'err'; }finally{ if(bx){ try{ HP_BX_BUSY=false; }catch(e){} } HP_MF_BUSY=false; try{ hpMfUi(); }catch(e){} } }
function hpMfUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const st=document.getElementById('post-state'); if(!st||!st.parentNode) return '';
    let c=document.getElementById('post-mvfind'); const gone=(typeof hpGoneBox==='function')&&hpGoneBox(), on=!!(gone&&hpMfLodger()&&HP_MF_ST);
    if(!on){ if(c&&c.style) c.style.display='none'; return ''; }
    if(!c){ c=document.createElement('div'); c.className='card'; c.id='post-mvfind'; const h=document.createElement('h2'); h.textContent=T('mvf_title'); c.appendChild(h); const el=document.createElement('div'); el.id='pt-mvfind'; el.className='note'; el.style.whiteSpace='pre-line'; c.appendChild(el);
      const map=document.getElementById('post-map'); if(map&&map.parentNode===st.parentNode) st.parentNode.insertBefore(c,map.nextSibling); else st.parentNode.insertBefore(c,st); }
    const el=document.getElementById('pt-mvfind')||c.lastChild, S=HP_MF_ST, fm=t=>(typeof fmtTS==='function')?fmtTS(t):new Date(t).toLocaleString(), btn=T('btn_pt_mvqr');
    if(el) el.textContent=S.st==='busy'?T('mvf_busy'):S.st==='found'?TF('mvf_found',{u:String(S.u||'').replace(/^wss:\/\//,'')}):S.st==='noacct'?TF('mvf_noacct',{btn:btn}):S.st==='nokey'?TF('mvf_nokey',{btn:btn}):S.st==='err'?TF('mvf_err',{t:fm(S.at)}):TF('mvf_none',{t:fm(S.at),btn:btn});
    c.style.display=''; return S.st; }catch(e){ return ''; } }
function hpMfTick(){ try{ if(typeof ID==='undefined'||!ID||HP_MF_BUSY||!hpMfLodger()) return ''; if(ID.rentJob||ID.boxJob) return 'job';
    if(typeof BG_ON!=='undefined'&&!BG_ON) return 'off'; if(typeof HP_IOS!=='undefined'&&HP_IOS&&typeof hpHidden==='function'&&hpHidden()) return 'hidden'; if(typeof navigator!=='undefined'&&navigator&&navigator.onLine===false) return 'offline';
    if(typeof HP_BX_BUSY!=='undefined'&&HP_BX_BUSY) return 'busy'; if(typeof HP_OLD_BUSY!=='undefined'&&HP_OLD_BUSY) return 'busy';
    const gone=(typeof hpGoneBox==='function')&&hpGoneBox(), down=(typeof hpSwDown==='function')?(Number(hpSwDown())||0):0;
    if(!gone&&!(down>=HP_MF_DOWN)) return '';
    if(Date.now()<HP_MF_NEXT) return 'wait';
    HP_MF_NEXT=Date.now()+(gone?HP_MF_RETRY:HP_MF_RETRY2);
    hpMfFind(gone?'郵便受けが消えた':'郵便受けに '+Math.round(down/60e3)+' 分つながらない').catch(()=>{}); return 'go'; }catch(e){ return ''; } }

function hpMfLodgers(){ try{ if(typeof ID==='undefined'||!ID||typeof POST==='undefined'||!POST||!POST.url||typeof hpMcBoxOf!=='function') return -1; const u=String(POST.url); return hpSibs().filter(d=>d&&d.dev&&hpMcBoxOf(d.dev)===u).length; }catch(e){ return -1; } }
try{ if(typeof hpMvQrUi==='function'&&!hpMvQrUi.__lg){ const f=hpMvQrUi; hpMvQrUi=Object.assign(function(){ const v=f.apply(this,arguments); try{ if(v==='on'&&hpMfLodgers()===0){ const b=document.getElementById('btn-pt-mvqr'); if(b&&b.style) b.style.display='none'; return ''; } }catch(e){} return v; },f,{__lg:1}); } }catch(e){}
try{ if(typeof hpPostUi==='function'&&!hpPostUi.__mf){ const f=hpPostUi; hpPostUi=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpMfUi(); }catch(e){} return v; },f,{__mf:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ setInterval(()=>{ try{ hpMfTick(); hpMfKeep('見回り').catch(()=>{}); }catch(e){} },60e3); setTimeout(()=>{ try{ hpMfTick(); }catch(e){} },25e3); setTimeout(()=>{ try{ hpMfKeep('開いたとき').catch(()=>{}); }catch(e){} },40e3); } }catch(e){}

const HP_UV_WAIT=30e3, HP_UV_TRIES=3, HP_MF_OLDPV=['2ba3fe08b91f3ae1','45357b0624496d5c','3982d563cfd4c703','74466290e3e701bf'];
const HP_XN_MAX=20, HP_XN_R=/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
let HP_UV_T=null;
async function hpUvAsk(u,want,n){
  HP_UV_T=null;
  try{ if(typeof ID==='undefined'||!ID||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||String(POST.url)!==u||want!==hpUpWant()) return 'skip';
    let r=null; try{ r=await hpPmReq({op:'ver'}); }catch(e){ r=null; }
    const pv=(r&&r.ok==='ver'&&typeof r.pv==='string'&&/^[0-9a-f]{16}$/.test(r.pv))?r.pv:'';
    if(pv&&pv===want){ await hpUpCheck(pv); try{ if(typeof hpMuFlush==='function') hpMuFlush().catch(()=>{}); }catch(e){} try{ if(typeof hpMfKeep==='function') hpMfKeep('本体を入れ替えたあと').catch(()=>{}); }catch(e){} return 'same'; }
    if(n<HP_UV_TRIES){ hpLog('入れ替えた郵便受けの本体の版を聞いた（'+(pv?pv+'…':'返事なし')+'）。まだ新しい版ではないので、30 秒あとにもう一度聞く'); HP_UV_T=setTimeout(()=>{ hpUvAsk(u,want,n+1).catch(()=>{}); },HP_UV_WAIT); return 'wait'; }
    hpLog('入れ替えた郵便受けの本体の版を確かめられない（'+(pv?pv+'…':'返事なし')+'）。次に名乗ったときにもう一度見る'); return 'old';
  }catch(e){ return 'skip'; } }
try{ if(typeof hpUpCheck==='function'&&!hpUpCheck.__uv){ const f=hpUpCheck; hpUpCheck=Object.assign(async function(pv){ const v=await f.apply(this,arguments);
    try{ if(v==='ok'&&typeof POST!=='undefined'&&POST&&POST.url){ const u=String(POST.url), w=hpUpWant(); if(HP_UV_T) clearTimeout(HP_UV_T); HP_UV_T=setTimeout(()=>{ hpUvAsk(u,w,1).catch(()=>{}); },HP_UV_WAIT); } }catch(e){}
    return v; },f,{__uv:1}); } }catch(e){}
function hpMfOldPv(o){
  try{ if(!o||o.ok!=='claim') return ''; if(typeof o.pv!=='string'||!/^[0-9a-f]{16}$/.test(o.pv)) return '古い版の郵便受け（名乗りの返事に版が無い。移設の知らせを預かれない）';
    return HP_MF_OLDPV.indexOf(o.pv)>=0?'古い版の郵便受け（本体 '+o.pv+'…。移設の知らせを預かれない）':''; }catch(e){ return ''; } }
function hpSbxOthers(){
  try{ if(typeof ID==='undefined'||!ID||!ID.box6||typeof ID.box6!=='object'||Array.isArray(ID.box6)||typeof hpMcBoxRec!=='function') return null; const sib=hpSibs().map(d=>d&&d.dev), o={};
    for(const dev of Object.keys(ID.box6).sort()){ if(sib.indexOf(dev)<0) continue; const b=hpMcBoxRec(dev); if(b) o[dev]={url:String(b.url),at:Number(b.at)}; }
    return Object.keys(o).length?o:null; }catch(e){ return null; } }
function hpSbxTake(m,from){
  try{ if(!m||typeof m!=='object'||Array.isArray(m)||typeof ID==='undefined'||!ID||typeof hpMcBoxTake!=='function') return 0; const sib=hpSibs().map(d=>d&&d.dev), now=Date.now(), b0=JSON.stringify(ID.box6||null); let n=0;
    for(const dev of Object.keys(m).slice(0,10)){ if(dev===from) continue; const b=m[dev]; if(!b||typeof b!=='object') continue; if(hpMcBoxTake(dev,{url:String(b.url),at:Number(b.at)},sib,now)) n++; }
    if(JSON.stringify(ID.box6||null)!==b0){ saveID(); if(n) hpLog('自分の端末（'+String(from||'').slice(0,10)+'…）から、ほかの端末 '+n+' 台の郵便受けの場所を受け取った'); try{ if(typeof hpBmUi==='function') hpBmUi(); }catch(e){} }
    return n; }catch(e){ return 0; } }
function hpXnList(){
  try{ if(typeof ID==='undefined'||!ID) return null; const nm=(ID.xmNames&&typeof ID.xmNames==='object'&&!Array.isArray(ID.xmNames))?ID.xmNames:{}, at=(ID.xmNamesAt&&typeof ID.xmNamesAt==='object'&&!Array.isArray(ID.xmNamesAt))?ID.xmNamesAt:{}, o={};
    for(const a of Object.keys(nm).concat(Object.keys(at)).sort()){ if(o[a]||!HP_XN_R.test(a)) continue; const n=(typeof nm[a]==='string')?nm[a].slice(0,40):'', t=Number(at[a])||(n?1:0); if(t>0) o[a]={n:n,at:t}; }
    const ks=Object.keys(o); if(!ks.length) return null; if(ks.length>HP_XN_MAX){ ks.sort((x,y)=>o[y].at-o[x].at); for(const k of ks.slice(HP_XN_MAX)) delete o[k]; } return o; }catch(e){ return null; } }
function hpXnMark(a){
  try{ if(!HP_XN_R.test(String(a||''))||typeof ID==='undefined'||!ID) return false; if(!ID.xmNamesAt||typeof ID.xmNamesAt!=='object'||Array.isArray(ID.xmNamesAt)) ID.xmNamesAt={}; ID.xmNamesAt[a]=Date.now();
    const ks=Object.keys(ID.xmNamesAt); if(ks.length>HP_XN_MAX){ ks.sort((x,y)=>ID.xmNamesAt[x]-ID.xmNamesAt[y]); for(const k of ks.slice(0,ks.length-HP_XN_MAX)) delete ID.xmNamesAt[k]; }
    saveID(); try{ if(typeof hpSibSyncSoon==='function') hpSibSyncSoon(); }catch(e){} return true; }catch(e){ return false; } }
function hpXnTake(m,from){
  try{ if(!m||typeof m!=='object'||Array.isArray(m)||typeof ID==='undefined'||!ID) return 0; const now=Date.now(), s0=JSON.stringify([ID.xmNames||null,ID.xmNamesAt||null,ID.xmName||'']); let n=0;
    if(!ID.xmNames||typeof ID.xmNames!=='object'||Array.isArray(ID.xmNames)) ID.xmNames={}; if(!ID.xmNamesAt||typeof ID.xmNamesAt!=='object'||Array.isArray(ID.xmNamesAt)) ID.xmNamesAt={};
    const cur=(typeof hpXmAcct==='function')?hpXmAcct():'';
    for(const a of Object.keys(m).slice(0,2*HP_XN_MAX)){ const x=m[a]; if(!HP_XN_R.test(a)||!x||typeof x!=='object') continue; const t=Number(x.at); if(!(t>0)||t>now+600e3) continue;
      const nm=(typeof x.n==='string')?x.n.trim().slice(0,40):'', old=(typeof ID.xmNames[a]==='string')?ID.xmNames[a]:'', lt=Number(ID.xmNamesAt[a])||(old?1:0); if(!(t>lt)) continue;
      if(nm) ID.xmNames[a]=nm; else delete ID.xmNames[a]; if(t>1) ID.xmNamesAt[a]=t; if(a===cur) ID.xmName=nm; if(old!==nm) n++; }
    if(JSON.stringify([ID.xmNames,ID.xmNamesAt,ID.xmName||''])!==s0){ if(!Object.keys(ID.xmNamesAt).length) delete ID.xmNamesAt; saveID(); }
    if(n){ hpLog('自分の端末（'+String(from||'').slice(0,10)+'…）から、口座の名前 '+n+' 件を受け取った'); try{ if(typeof hpBmUi==='function') hpBmUi(); }catch(e){} try{ if(typeof hpXmUi==='function') hpXmUi(); }catch(e){} }
    return n; }catch(e){ return 0; } }
try{ if(typeof hpXmNick==='function'&&!hpXmNick.__xn){ const f=hpXmNick; hpXmNick=Object.assign(function(nm){ const a=(typeof hpXmAcct==='function')?hpXmAcct():'', b=hpXmNameOf(a); const v=f.apply(this,arguments); try{ if(v&&a&&hpXmNameOf(a)!==b) hpXnMark(a); }catch(e){} return v; },f,{__xn:1}); } }catch(e){}
try{ if(typeof hpBmXmAsk==='function'&&!hpBmXmAsk.__xn){ const f=hpBmXmAsk; hpBmXmAsk=Object.assign(async function(a){ const b=(typeof hpXmNameOf==='function')?hpXmNameOf(a):''; const v=await f.apply(this,arguments); try{ if(v&&hpXmNameOf(a)!==b) hpXnMark(a); }catch(e){} return v; },f,{__xn:1}); } }catch(e){}
try{ if(typeof hpSyncDigest==='function'&&!hpSyncDigest.__sbx){ const f=hpSyncDigest; hpSyncDigest=Object.assign(async function(){ const h=await f.apply(this,arguments), x=hpSbxOthers(), y=hpXnList(); if(!x&&!y) return h; await hpReady();
    return hpHex(hp5S().crypto_generichash(16, hp5U(JSON.stringify([h,'box6',x?Object.keys(x).map(k=>[k,x[k].url]):[],'xmn',y?Object.keys(y).map(k=>[k,y[k].n,y[k].at]):[]])))); },f,{__sbx:1}); } }catch(e){}
try{ if(typeof hpSibPut==='function'&&!hpSibPut.__sbx){ const f=hpSibPut; hpSibPut=Object.assign(async function(body){ try{ if(body&&body.type==='sibc'&&Number(body.i)===1){ const x=hpSbxOthers(), y=hpXnList(); if(x) body.box6=x; if(y) body.xmn=y; } }catch(e){} return f.apply(this,arguments); },f,{__sbx:1}); } }catch(e){}
try{ if(typeof hpSibSyncIn0==='function'&&!hpSibSyncIn0.__sbx){ const f=hpSibSyncIn0; hpSibSyncIn0=Object.assign(async function(o,r){ const v=await f.apply(this,arguments);
    try{ if(v!==false&&o&&r&&r.fromDev){ if(o.box6) hpSbxTake(o.box6,String(r.fromDev)); if(o.xmn) hpXnTake(o.xmn,String(r.fromDev)); } }catch(e){} return v; },f,{__sbx:1}); } }catch(e){}

const HP_IL_REUSE=120e3, HP_IL_SHOW=2000, HP_LW_CAP=60e3, HP_LW_IDS=['lw-main','lw-join','lw-lq'];
let HP_IL=null, HP_IL_MK=null, HP_LW_J=0, HP_LW_B0=0, HP_LW_TK=null;
function hpIlUsed(L){ try{ const rec=((typeof ID!=='undefined'&&ID&&ID.invites)||[]).find(r=>r&&r.id===L.id); if(rec&&rec.by) return true; const it=(typeof HP_INV_LIST!=='undefined'&&HP_INV_LIST&&Array.isArray(HP_INV_LIST.items))?HP_INV_LIST.items.find(x=>x&&x.id===L.id):null; return !!(it&&it.used); }catch(e){ return false; } }
function hpIlBtns(){ const out=[]; try{ const a=document.getElementById('btn-inv-copy'); if(a) out.push(a); const w=document.getElementById('hq-pop'), b=(w&&w.querySelector)?w.querySelector('.hq-copy'):null; if(b) out.push(b); }catch(e){} return out; }
function hpIlMark(k,busy){ for(const b of hpIlBtns()){ try{ b.textContent=T(k); b.disabled=!!busy; b.style.color=(k==='il_done')?'var(--teal)':''; b.style.fontWeight=(k==='il_done')?'700':''; }catch(e){} } return k; }
async function hpIlGet(){
  const now=Date.now(); if(HP_IL&&now-HP_IL.at<HP_IL_REUSE&&HP_IL.exp-now>600e3&&!hpIlUsed(HP_IL)) return Object.assign({again:1},HP_IL);
  if(HP_IL_MK) return HP_IL_MK;
  HP_IL_MK=(async()=>{ let last=null; for(let i=0;i<3;i++){ try{ const L=await hpInvMakeKind('link'); HP_IL={link:L.link,exp:L.exp,id:L.id,at:Date.now()}; return L; }catch(e){ last=e; if(String(e&&e.message)!==T('e_inv_busy')) throw e; hpLog('郵便受けとのやり取りが重なったので、1.5 秒待って招待状を作り直す（'+(i+1)+' 回目）'); await sleep(1500); } } throw last; })();
  try{ return await HP_IL_MK; }finally{ HP_IL_MK=null; } }
async function hpIlCopy(){
  hpIlMark('il_busy',true); let L=null;
  try{ L=await hpIlGet(); }catch(e){ hpIlMark('btn_inv_copy',false); try{ alert((typeof hpErrShow==='function'?hpErrShow(e):e.message)); }catch(_){} return null; }
  let ok=false; try{ await navigator.clipboard.writeText(L.link); ok=true; }catch(e){ ok=false; }
  if(ok){ hpIlMark('il_done',false); setTimeout(()=>{ hpIlMark('btn_inv_copy',false); },HP_IL_SHOW); } else { hpIlMark('btn_inv_copy',false); try{ prompt(T('pr_inv_copy'), L.link); }catch(e){} }
  try{ hpToast(T(L.again?'il_again':'if_link_ok'),3000); }catch(e){} try{ log(TL('lg_inv_copied')); }catch(e){} return L; }
try{ if(typeof hpIfCopyLink==='function'&&!hpIfCopyLink.__il){ const f=hpIfCopyLink; hpIfCopyLink=Object.assign(function(btn){ return hpIlCopy(btn); },f,{__il:1}); } }catch(e){}
function hpLwMMSS(ms){ ms=Math.max(0,Math.floor(ms/1000)); return Math.floor(ms/60)+':'+String(ms%60).padStart(2,'0'); }
function hpLwBar(anchor,id,mode,t0){
  let el=document.getElementById(id);
  if(!mode||!anchor||!anchor.parentNode){ if(el&&el.parentNode) el.parentNode.removeChild(el); return ''; }
  if(!el){ el=document.createElement('div'); el.id=id; const b=document.createElement('div'); b.className='gg-b'; const f=document.createElement('div'); f.className='gg-f'; b.appendChild(f); const t=document.createElement('div'); t.className='gg-t'; el.appendChild(b); el.appendChild(t); }
  if(anchor.nextSibling!==el) anchor.parentNode.insertBefore(el,anchor.nextSibling);
  const dt=Math.max(0,Date.now()-(Number(t0)||Date.now())), f=el.firstChild.firstChild, t=el.lastChild;
  el.className='hp-gg hp-lw'+(mode==='t'&&dt>=HP_LW_CAP?' over':''); el.style.margin='8px auto 12px'; el.style.maxWidth='360px';
  f.style.width=(mode==='t'?Math.min(100,dt/HP_LW_CAP*100):0).toFixed(1)+'%'; const s=mode==='t'?TF('lw_t',{t:hpLwMMSS(dt)}):''; if(t.textContent!==s) t.textContent=s; t.style.display=s?'':'none';
  return mode; }
function hpLwUi(msg){
  if(typeof document==='undefined'||!document.getElementById) return ''; const L=(typeof HP_LINK!=='undefined')?HP_LINK:null, J=(typeof HP_JOIN!=='undefined')?HP_JOIN:null, me=(typeof ID!=='undefined'&&ID); let out='';
  try{ const st=document.getElementById('link-status'); if(st){ let m=''; if(L&&!L.done&&!L.fail){ if(L.busy){ if(!HP_LW_B0) HP_LW_B0=Date.now(); m='t'; } else { HP_LW_B0=0; if(!L.req&&!L.resume) m='i'; } } else HP_LW_B0=0; hpLwBar(st,'lw-main',m,HP_LW_B0); out+=m?'m'+m:''; } }catch(e){}
  try{ const js=document.getElementById('linkjoin-status'); if(js){ let m=''; if(!me&&typeof msg!=='string'){ if(HP_LW_J&&!J){ m='t'; js.textContent=T('lw_join'); } else if(J) m='i'; } hpLwBar(js,'lw-join',m,HP_LW_J); out+=m?'j'+m:''; } }catch(e){}
  try{ const qs=document.getElementById('hp-lq-st'), qa=document.getElementById('hp-lq-sas'); if(qs){ let m=''; if(!me&&typeof msg!=='string'&&typeof HP_LQ_FOCUS!=='undefined'&&HP_LQ_FOCUS) m=(HP_LW_J&&!J)?'t':J?'i':''; hpLwBar((J&&qa&&qa.style.display!=='none')?qa:qs,'lw-lq',m,HP_LW_J); out+=m?'q'+m:''; } }catch(e){}
  try{ if(out&&!HP_LW_TK&&typeof setInterval==='function') HP_LW_TK=setInterval(()=>{ try{ if(!HP_LW_IDS.some(id=>document.getElementById(id))){ clearInterval(HP_LW_TK); HP_LW_TK=null; return; } hpLwUi(); }catch(e){} },1000); }catch(e){}
  return out; }
try{ if(typeof hpLinkUi==='function'&&!hpLinkUi.__lw){ const f=hpLinkUi; hpLinkUi=Object.assign(function(msg){ const v=f.apply(this,arguments); try{ hpLwUi(msg); }catch(e){} return v; },f,{__lw:1}); } }catch(e){}
try{ if(typeof hpLinkJoin==='function'&&!hpLinkJoin.__lw){ const f=hpLinkJoin; hpLinkJoin=Object.assign(async function(){ HP_LW_J=Date.now(); try{ hpLwUi(); }catch(e){} try{ return await f.apply(this,arguments); }finally{ HP_LW_J=0; try{ hpLwUi(); }catch(e){} } },f,{__lw:1}); } }catch(e){}

function hpBmWideW(nb){ const want=nb*170+10*(nb-1), least=nb*100+10*(nb-1); let vw=390; try{ vw=Number(window.innerWidth)||390; }catch(e){} return Math.max(340,Math.min(want,Math.max(vw-118,least))); }
let HP_BM_RS=null;
try{ if(typeof window!=='undefined'&&typeof window.addEventListener==='function'&&typeof document!=='undefined'&&document&&typeof document.getElementById==='function') window.addEventListener('resize',()=>{ try{ if(HP_BM_RS) clearTimeout(HP_BM_RS); HP_BM_RS=setTimeout(()=>{ HP_BM_RS=null; try{ const c=document.getElementById('post-map'); if(c&&c.style.display!=='none'&&typeof hpBmUi==='function') hpBmUi(); }catch(e){} },300); }catch(e){} }); }catch(e){}

const HP_OA_R=/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, HP_OA_U=/^wss:\/\/[^\s"'<>]{1,190}$/;
function hpOaOwn(){ try{ const u=String((typeof hpPostUrl==='function'&&hpPostUrl())||''), a=(typeof hpLeaseAcct==='function')?String(hpLeaseAcct()||''):''; return (HP_OA_U.test(u)&&HP_OA_R.test(a))?[u,a]:null; }catch(e){ return null; } }
function hpOaList(){ try{ if(typeof ID==='undefined'||!ID) return null; const m=(ID.acctByUrl&&typeof ID.acctByUrl==='object'&&!Array.isArray(ID.acctByUrl))?ID.acctByUrl:{}, o={}; for(const u of Object.keys(m).slice(-8)){ if(HP_OA_U.test(u)&&HP_OA_R.test(String(m[u]||''))) o[u]=String(m[u]); } const w=hpOaOwn(); if(w) o[w[0]]=w[1]; return Object.keys(o).length?o:null; }catch(e){ return null; } }
function hpOaTake(o,from){
  try{ if(typeof ID==='undefined'||!ID||!o||typeof hpBmAcctKeep!=='function') return 0; let n=0; const has=u=>String((ID.acctByUrl&&typeof ID.acctByUrl==='object'&&ID.acctByUrl[u])||'');
    const own=Array.isArray(o.bown)?o.bown:null; if(own&&HP_OA_U.test(String(own[0]))&&HP_OA_R.test(String(own[1]))&&has(own[0])!==String(own[1])){ if(hpBmAcctKeep(String(own[0]),String(own[1]))) n++; }
    const m=(o.bacct&&typeof o.bacct==='object'&&!Array.isArray(o.bacct))?o.bacct:{}; for(const u of Object.keys(m).slice(0,16)){ const a=String(m[u]||''); if(!HP_OA_U.test(u)||!HP_OA_R.test(a)||has(u)) continue; if(hpBmAcctKeep(u,a)) n++; }
    if(n){ hpLog('自分の端末（'+String(from||'').slice(0,10)+'…）から、郵便受けを借りた口座の控え '+n+' 件を受け取った'); try{ if(typeof hpBmUi==='function') hpBmUi(); }catch(e){} }
    return n; }catch(e){ return 0; } }
try{ if(typeof hpSyncDigest==='function'&&!hpSyncDigest.__oa){ const f=hpSyncDigest; hpSyncDigest=Object.assign(async function(){ const h=await f.apply(this,arguments), x=hpOaList(); if(!x) return h; await hpReady(); return hpHex(hp5S().crypto_generichash(16, hp5U(JSON.stringify([h,'bacct',Object.keys(x).sort().map(k=>[k,x[k]])])))); },f,{__oa:1}); } }catch(e){}
try{ if(typeof hpSibPut==='function'&&!hpSibPut.__oa){ const f=hpSibPut; hpSibPut=Object.assign(async function(body){ try{ if(body&&body.type==='sibc'&&Number(body.i)===1){ const x=hpOaList(), w=hpOaOwn(); if(x) body.bacct=x; if(w) body.bown=w; } }catch(e){} return f.apply(this,arguments); },f,{__oa:1}); } }catch(e){}
try{ if(typeof hpSibSyncIn0==='function'&&!hpSibSyncIn0.__oa){ const f=hpSibSyncIn0; hpSibSyncIn0=Object.assign(async function(o,r){ const v=await f.apply(this,arguments); try{ if(v!==false&&o&&r&&r.fromDev&&(o.bacct||o.bown)) hpOaTake(o,String(r.fromDev)); }catch(e){} return v; },f,{__oa:1}); } }catch(e){}

const HP_EU_U=/^wss:\/\/[^\s"'<>]{1,190}$/;
function hpBmWrap(s,fs,max){
  s=String(s||''); const seg=s.match(/[^.]*\.|[^.]+$/g)||[s], fit=t=>hpBmW(t,fs)<=max;
  if(seg.every(fit)){ const out=[]; let cur=''; for(let i=seg.length-1;i>=0;i--){ const g=seg[i]; if(cur&&fit(g+cur)){ cur=g+cur; continue; } if(cur) out.unshift(cur); cur=g; } if(cur) out.unshift(cur); return out.slice(0,6); }
  const out=[]; let cur='';
  for(let g of seg){ if(cur&&fit(cur+g)){ cur+=g; continue; } if(cur){ out.push(cur); cur=''; } while(g.length>1&&!fit(g)){ let k=1; while(k<g.length-1&&fit(g.slice(0,k+1))) k++; out.push(g.slice(0,k)); g=g.slice(k); } cur=g; }
  if(cur) out.push(cur); return out.slice(0,6); }
function hpBmBoxLines(b,bw){
  const L=[], nw=bw<150, tw=bw-24, col=b.col||(b.own?'#f5b85c':'#35d1b7'), hp=hpBmHost(b.url), fsH=nw?11:12;
  for(const d of (b.devs||[]).slice(0,5)) L.push({t:hpBmCut(String(d.b||d.a||''),fsH,tw-16),fs:fsH,fw:700,fill:col,dev:d.dev||''});
  for(const s of hpBmWrap(hp.h,fsH,tw)) L.push({t:s,fs:fsH,fw:700,fill:'#e6edf6'});
  if(typeof hpBsLine==='function'){ if(hp.p) L.push({port:hp.p,on:false,fs:nw?10:11,col:col,nw:nw}); const sl=hpBsLine(b); if(sl) for(const t of ((typeof hpBcWrapJ==='function')?hpBcWrapJ(sl.t,11,tw):[sl.t])) L.push({t:t,fs:11,fw:700,fill:sl.st==='ng'?'#ff6b6b':sl.st==='me'?col:'#a9bbd0'}); }
  else if(hp.p||b.on) L.push({port:hp.p||'',on:!!b.on,fs:nw?10:11,col:col,nw:nw});
  if(b.exp){ const lf=Number(b.exp)-Date.now(), ec=lf<=0?'#ff6b6b':lf<7*864e5?'#f5b85c':'#8aa0bd';   L.push({t:hpBmCut(TF('bm_exp',{t:hpBmMd(b.exp)}),11,tw),fs:11,fw:400,fill:'#8aa0bd'}); L.push({t:hpBmCut((lf<=0?T('bm_expired'):lf>=2*864e5?TF('bm_left',{n:hpBmLeft(b.exp)}):lf>=2*3600e3?TF('lease_left_h',{n:Math.floor(lf/3600e3)}):TF('lease_left_m',{n:Math.max(1,Math.floor(lf/60e3))})),11,tw),fs:11,fw:700,fill:ec}); }
  else if(b.noexp&&typeof hpBcWrapJ==='function'){ if(b.noexp==='cur') L.push({t:hpBmCut(T('bm_noexp0'),11,tw),fs:11,fw:400,fill:'#8aa0bd'}); else { for(const t of hpBcWrapJ(T('bm_noexp'),11,tw)) L.push({t:t,fs:11,fw:400,fill:'#8aa0bd'}); for(const t of hpBcWrapJ(TF('bm_noexp2',{b:hpBcName(b.noexp)}),11,tw)) L.push({t:t,fs:11,fw:700,fill:'#8aa0bd'}); } }
  return L; }

function hpEuOwn(){ try{ const u=String((typeof hpPostUrl==='function'&&hpPostUrl())||''), e=(typeof hpLeaseExp==='function')?Number(hpLeaseExp())||0:0; return (HP_EU_U.test(u)&&e>0)?[u,e]:null; }catch(e){ return null; } }
function hpEuKeep(u,e){ try{ if(typeof ID==='undefined'||!ID||!HP_EU_U.test(String(u))||!(Number(e)>0)) return false; const m=(ID.expByUrl&&typeof ID.expByUrl==='object'&&!Array.isArray(ID.expByUrl))?ID.expByUrl:{}; if(Number(m[u])>=Number(e)) return false;
  m[u]=Number(e); const ks=Object.keys(m); while(ks.length>8) delete m[ks.shift()]; ID.expByUrl=m; return true; }catch(e){ return false; } }
function hpEuMap(){ try{ if(typeof ID==='undefined'||!ID) return null; const m=(ID.expByUrl&&typeof ID.expByUrl==='object'&&!Array.isArray(ID.expByUrl))?ID.expByUrl:{}, o={}; for(const u of Object.keys(m).slice(-8)){ if(HP_EU_U.test(u)&&Number(m[u])>0) o[u]=Number(m[u]); } const w=hpEuOwn(); if(w&&!(o[w[0]]>=w[1])) o[w[0]]=w[1]; return Object.keys(o).length?o:null; }catch(e){ return null; } }
function hpEuTake(m,from){
  try{ if(!m||typeof m!=='object'||Array.isArray(m)) return 0; const lim=Date.now()+5*366*864e5; let n=0; for(const u of Object.keys(m).slice(0,16)){ const e=Number(m[u]); if(!(e>0)||e>lim) continue; if(hpEuKeep(u,e)) n++; }
    if(n){ try{ saveID(); }catch(e){} hpLog('自分の端末（'+String(from||'').slice(0,10)+'…）から、郵便受けの期限の控え '+n+' 件を受け取った'); try{ if(typeof hpBmUi==='function') hpBmUi(); }catch(e){} } return n; }catch(e){ return 0; } }
function hpEuFill(M){ try{ if(!M||!Array.isArray(M.boxes)) return M; const w=hpEuOwn(); if(w&&hpEuKeep(w[0],w[1])){ try{ saveID(); }catch(e){} } const m=(ID&&ID.expByUrl&&typeof ID.expByUrl==='object')?ID.expByUrl:{};
  for(const b of M.boxes){ if(b&&!b.cur&&!b.exp&&Number(m[b.url])>0) b.exp=Number(m[b.url]); } }catch(e){} return M; }
try{ if(typeof hpBmModel==='function'&&!hpBmModel.__eu){ const f=hpBmModel; hpBmModel=Object.assign(function(){ return hpEuFill(f.apply(this,arguments)); },f,{__eu:1}); } }catch(e){}
try{ if(typeof hpSyncDigest==='function'&&!hpSyncDigest.__eu){ const f=hpSyncDigest; hpSyncDigest=Object.assign(async function(){ const h=await f.apply(this,arguments), x=hpEuMap(); if(!x) return h; await hpReady(); return hpHex(hp5S().crypto_generichash(16, hp5U(JSON.stringify([h,'bexp',Object.keys(x).sort().map(k=>[k,x[k]])])))); },f,{__eu:1}); } }catch(e){}
try{ if(typeof hpSibPut==='function'&&!hpSibPut.__eu){ const f=hpSibPut; hpSibPut=Object.assign(async function(body){ try{ if(body&&body.type==='sibc'&&Number(body.i)===1){ const x=hpEuMap(); if(x) body.bexp=x; } }catch(e){} return f.apply(this,arguments); },f,{__eu:1}); } }catch(e){}
try{ if(typeof hpSibSyncIn0==='function'&&!hpSibSyncIn0.__eu){ const f=hpSibSyncIn0; hpSibSyncIn0=Object.assign(async function(o,r){ const v=await f.apply(this,arguments); try{ if(v!==false&&o&&r&&r.fromDev&&o.bexp) hpEuTake(o.bexp,String(r.fromDev)); }catch(e){} return v; },f,{__eu:1}); } }catch(e){}

const HP_BC_PAL=[['#35d1b7','#0f2a2a'],['#f5b85c','#2e2412'],['#6cb6ff','#10233a'],['#ff8fc8','#2f1628'],['#a6dc6e','#1b2a14']], HP_BC_KW={pc:'PC',iphone:'iPhone',android:'Android'};
function hpBcName(b){ b=String(b||''); let ja=true; try{ ja=(typeof curLang!=='function')||curLang()==='ja'; }catch(e){} return b+(ja&&/[\x21-\x7e]$/.test(b)?' ':''); }
function hpBcWrapJ(s,fs,max){
  s=String(s||''); const out=[]; let cur='';
  for(const ch of s){ const nx=cur+ch; if(!cur||hpBmW(nx,fs)<=max||/[、。）」]/.test(ch)){ cur=nx; continue; }
    { const k=cur.lastIndexOf('（'); if(k>0&&cur.slice(0,k).trim()){ out.push(cur.slice(0,k).replace(/ +$/,'')); cur=cur.slice(k)+ch; continue; } }
    if(/[0-9A-Za-z]/.test(ch)){ const m2=/^(.*?)([（「(]?[0-9A-Za-z.]+)$/.exec(cur); if(m2&&m2[1].trim()){ out.push(m2[1].replace(/ +$/,'')); cur=m2[2]+ch; continue; } }
    const m=/^(.*\S) ([\x21-\x7e]+)$/.exec(cur); if(/[\x21-\x7e]/.test(ch)&&m){ out.push(m[1]); cur=m[2]+ch; } else { out.push(cur.replace(/ +$/,'')); cur=ch===' '?'':ch; } }
  if(cur) out.push(cur); return out.slice(0,4); }
function hpBcPaint(M){ try{ if(!M||!Array.isArray(M.boxes)) return M;
    const key=b=>b.own?'1'+String((b.devs&&b.devs[0]&&b.devs[0].dev)||b.url||''):'0'+String(b.url||'');
    M.boxes.slice().sort((x,y)=>key(x)<key(y)?-1:key(x)>key(y)?1:0).forEach((b,i)=>{ const p=HP_BC_PAL[i%HP_BC_PAL.length]; b.col=p[0]; b.bg=p[1]; });
    for(const b of M.boxes){ if(!b.exp){ const d=(b.devs||[])[0]; b.noexp=b.cur?'cur':String((d&&(d.b||d.a))||''); } else delete b.noexp; }
    M.unk=M.boxes.some(b=>!b.acct);
    const g={}; for(const m of (Array.isArray(M.mach)?M.mach:[])){ const k=String(m.sub||m.name||''); if(!k) continue; if(!g[k]) g[k]={n:0,un:0}; g[k].n++; if(!m.sub) g[k].un++; }
    M.same=''; M.sameN=0; for(const k of Object.keys(g)){ if(g[k].n>=2&&g[k].un>0){ M.same=k; M.sameN=g[k].n; break; } }
    if(M.same) M.dup=false; return M; }catch(e){ return M; } }
try{ if(typeof hpBmModel==='function'&&!hpBmModel.__bc){ const f=hpBmModel; hpBmModel=Object.assign(function(){ return hpBcPaint(f.apply(this,arguments)); },f,{__bc:1}); } }catch(e){}
try{ if(typeof hpBmGo==='function'&&!hpBmGo.__bc){ const f=hpBmGo; hpBmGo=Object.assign(function(go,k){ try{
  if(go==='unk'){ hpToast(k?TF('bm_unk_tip',{b:hpBcName(k)}):T('bm_unk_tip0'),5000); return 'unk'; }
  if(go==='dn'){ if(typeof hpDnAsk==='function') hpDnAsk().catch(()=>{}); return 'dn'; } }catch(e){} return f.apply(this,arguments); },f,{__bc:1}); } }catch(e){}

function hpDsMe(){ try{ if(typeof POST!=='undefined'&&POST&&/^ed[0-9a-f]{64}$/.test(String(POST.pub||''))) return String(POST.pub); if(ID&&ID.link&&/^ed[0-9a-f]{64}$/.test(String(ID.link.dev||''))) return String(ID.link.dev); }catch(e){} return ''; }
async function hpDsMeA(){ const m=hpDsMe(); if(m) return m; try{ const kp=await hpDevKey(); return hpHex(kp.publicKey); }catch(e){ return ''; } }
function hpDsList(cur){
  if(typeof hpDevRows!=='function') return []; let mk='other'; try{ mk=hpDevKindOf(hpDnAuto())||'other'; }catch(e){} const me=hpDsMe(), L=[];
  for(const d of hpDevRows()){ if(!d||d.me||!/^ed[0-9a-f]{64}$/.test(String(d.dev||''))||d.dev===me) continue; const lb=String(d.label||''), named=/ · /.test(lb)?'':lb; let k='other'; try{ k=(typeof hpDnKindOf==='function'&&hpDnKindOf(d.dev))||hpDevKindOf(lb)||'other'; }catch(e){} if(k!==mk) continue;
    let br='', bo=''; try{ bo=hpBmShort(lb).b||''; br=bo||hpBmBrowser(false,d.dev)||''; }catch(e){} L.push({dev:d.dev,br:br||lb||d.dev.slice(0,10),bo:bo,named:named,kind:k,on:!!(cur&&named&&named===cur)}); }
  return L; }
function hpDsBox(wrap,cur){ try{ if(!wrap||typeof document==='undefined'||!document.createElement) return null; const L=hpDsList(cur); if(!L.length) return null; let mk='other'; try{ mk=hpDevKindOf(hpDnAuto())||'other'; }catch(e){}
    const box=document.createElement('div'); box.id='ds-box'; box.style.cssText='margin-top:12px'; const h=document.createElement('div'); h.className='note'; h.textContent=HP_BC_KW[mk]?TF('ds_head',{k:HP_BC_KW[mk]}):T('ds_head0'); box.appendChild(h);
    const items=[]; for(const x of L){ const lab=document.createElement('label'); lab.style.cssText='display:flex;align-items:center;gap:8px;margin-top:6px;cursor:pointer'; const c=document.createElement('input'); c.type='checkbox'; c.checked=x.on; c.setAttribute('data-dev',x.dev);
      const sp=document.createElement('span'); sp.textContent=x.br+(y=>(typeof hpPar==='function'?hpPar(y):'（'+y+'）'))(x.named||HP_BC_KW[x.kind]||T('bm_noname')); lab.appendChild(c); lab.appendChild(sp); box.appendChild(lab); items.push({c:c,x:x}); }
    wrap.appendChild(box); return items; }catch(e){ return null; } }
function hpDsApply(items,nm){ nm=String(nm==null?'':nm).replace(/[\r\n\t]/g,' ').trim().slice(0,24); let n=0; const names=[]; if(!nm) return 0;
  for(const it of (Array.isArray(items)?items:[])){ if(!it||!it.c||!it.c.checked||!it.x) continue; const x=it.x; if((x.named||'')===nm) continue; if(hpDnFor(x.dev,nm,x.kind,x.bo===undefined?x.br:x.bo)){ n++; names.push(x.br); } }
  if(n){ try{ hpToast(TF(nm?'ds_done':'ds_clear',{b:hpBcName(names.join((typeof hpSep==='function'?hpSep():'・'))),n:nm}),3000); }catch(e){} try{ renderDevices(); }catch(e){} try{ hpBmUi(); }catch(e){} }
  return n; }
function hpDnFor(dev,nm,kind,br){ try{ if(typeof ID==='undefined'||!ID||!/^ed[0-9a-f]{64}$/.test(String(dev||''))||dev===hpDsMe()) return false; nm=String(nm==null?'':nm).replace(/[\r\n\t]/g,' ').trim().slice(0,24); const ts=Date.now();
    const k=['pc','iphone','android','other'].indexOf(kind)>=0?kind:'other', b=String(br||'').replace(/[^A-Za-z ]/g,'').slice(0,16);
    if(typeof hpDnIn==='function') hpDnIn({dev:dev,label:nm,kind:k,br:b,ts:ts},{fromDev:dev});
    if(!ID.dnFor||typeof ID.dnFor!=='object'||Array.isArray(ID.dnFor)) ID.dnFor={}; ID.dnFor[dev]={label:nm,kind:k,br:b,ts:ts}; saveID();
    setTimeout(()=>{ try{ hpDsTell().catch(()=>{}); }catch(e){} },700); return true; }catch(e){ return false; } }
var HP_DS_BUSY=false, HP_DS_AGAIN=false;
async function hpDsTell(){ if(HP_DS_BUSY){ HP_DS_AGAIN=true; return 0; } HP_DS_BUSY=true; HP_DS_AGAIN=false; let r=0; try{ r=await hpDsTell1(); } finally{ HP_DS_BUSY=false; }
  if(HP_DS_AGAIN){ HP_DS_AGAIN=false; setTimeout(()=>{ try{ hpDsTell().catch(()=>{}); }catch(e){} },700); } return r; }
async function hpDsTell1(){ try{ if(typeof ID==='undefined'||!ID||!ID.dnFor||typeof ID.dnFor!=='object') return 0; if(!Object.keys(ID.dnFor).length){ delete ID.dnFor; saveID(); return 0; }
    if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 0; const m=(typeof hpSibs==='function')?hpSibs().length:0, me=await hpDsMeA(); if(!me) return 0; let sent=0;
    for(const dev of Object.keys(ID.dnFor||{})){ const D=(ID.dnFor&&typeof ID.dnFor==='object')?ID.dnFor:null, x=D&&D[dev]; if(!x) continue; if(!m||Date.now()-Number(x.ts)>35*864e5){ delete D[dev]; continue; }
      const n=await hpSibPut({v:1,type:'devname',dev:dev,label:String(x.label||''),kind:x.kind,br:x.br,ts:Number(x.ts),by:me}); const D2=(ID&&ID.dnFor&&typeof ID.dnFor==='object')?ID.dnFor:null; if(n>=m&&D2&&D2[dev]&&Number(D2[dev].ts)===Number(x.ts)) delete D2[dev]; sent++;
      hpLog('自分のほかの端末（'+dev.slice(0,10)+'…）に付けた名前を、自分のほかの端末 '+n+' 台に知らせた'+(n<m?'（まだ '+(m-n)+' 台。あとで出し直す）':'')); }
    if(ID.dnFor&&!Object.keys(ID.dnFor).length) delete ID.dnFor; saveID(); return sent; }catch(e){ try{ hpLog('ほかの端末に付けた名前を知らせられない（'+((e&&e.message)||e)+'）'); }catch(x){} return -1; } }
async function hpDsIn(o,r){
  const dev=String((o&&o.dev)||''), by=String((o&&o.by)||''), ts=Number(o&&o.ts);
  if(!/^ed[0-9a-f]{64}$/.test(dev)||!/^ed[0-9a-f]{64}$/.test(by)||!(r&&r.fromDev===by)||by===dev||!(ts>0)||ts>Date.now()+600e3){ hpLog('自分の端末が付けた名前の知らせの形が違う（捨てた）'); return false; }
  if(dev!==await hpDsMeA()) return hpDnIn(Object.assign({},o,{br:''}),{fromDev:dev});
  if(Number(ID.devNameAt)>=ts) return false; const nm=String(o.label||'').replace(/[\r\n\t]/g,' ').trim().slice(0,24);
  if(nm) ID.devName=nm; else delete ID.devName; if(ID.link&&typeof ID.link==='object') ID.link.label=hpDevLabelGuess(); ID.devNameAt=Math.max(ts,Date.now()); ID.devNameDue=Date.now(); saveID();
  hpLog('自分の端末（'+by.slice(0,10)+'…）が、この端末の名前を「'+(nm||'自動')+'」にした（同じ機械のブラウザ）');
  try{ renderDevices(); }catch(e){} try{ hpBmUi(); }catch(e){} setTimeout(()=>{ try{ hpDnTell().catch(()=>{}); }catch(e){} },500); return true; }
try{ if(typeof hpSibLetter==='function'&&!hpSibLetter.__ds){ const f=hpSibLetter; hpSibLetter=Object.assign(async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){}
  if(o&&o.v===1&&o.type==='devname'&&o.by!==undefined){ if(!ID||r.from!==ID.address){ hpLog('自分の機械でない相手からの devname（捨てた）'); return true; } await hpDsIn(o,r); return true; }
  return f.apply(this,arguments); },f,{__ds:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function') setInterval(()=>{ try{ hpDsTell().catch(()=>{}); }catch(e){} },600e3); }catch(e){}

function hpDsKw(){ let mk='other'; try{ mk=hpDevKindOf(hpDnAuto())||'other'; }catch(e){} return HP_BC_KW[mk]||''; }
async function hpDsAsk(pre){ if(typeof ID==='undefined'||!ID||typeof document==='undefined'||!document.createElement) return false; const kw=hpDsKw(), cur=hpDnMine(), L=hpDsList(cur); if(!kw||!L.length) return false;
  let def=cur; if(!def){ const x=L.find(y=>y.dev===pre&&y.named)||L.find(y=>y.named); if(x) def=x.named; }
  const wrap=document.createElement('div'); wrap.style.cssText='margin-top:10px'; const i=document.createElement('input'); i.type='text'; i.id='ds-in'; i.maxLength=24; i.value=def; i.placeholder=T('dn_ph'); i.setAttribute('autocomplete','off'); i.spellcheck=false; i.style.cssText='width:100%'; wrap.appendChild(i);
  i.addEventListener('keydown',ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); try{ if(typeof HP_ASK_CUR!=='undefined'&&HP_ASK_CUR&&HP_ASK_CUR.ok&&HP_ASK_CUR.ok.onclick) HP_ASK_CUR.ok.onclick(); }catch(e){} } });
  const items=hpDsBox(wrap,cur)||[]; for(const it of (pre?items.filter(it=>it.x.dev===pre):(items.length===1?items:[]))) it.c.checked=true;
  setTimeout(()=>{ try{ i.focus(); if(!def) i.select(); }catch(e){} },60);
  const ok=await hpAsk({title:TF('ds_title',{k:kw}),text:TF('ds_note',{k:kw}),node:wrap}); if(!ok) return false;
  const nm=String(i.value||'').replace(/[\r\n\t]/g,' ').trim().slice(0,24); if(!nm){ try{ hpToast(TF('ds_need',{k:kw}),3500); }catch(e){} return false; }
  const r=hpDnSet(nm); let n=0; try{ n=hpDsApply(items,nm); }catch(e){} return r||n>0; }
function hpDsRows(){ try{ if(typeof document==='undefined'||!document.getElementById||typeof hpDevRows!=='function') return 0; const list=document.getElementById('dev-list'); if(!list||!list.children) return 0;
    const kw=hpDsKw(), cur=hpDnMine(), L=kw?hpDsList(cur):[], rows=hpDevRows(); let n=0;
    rows.forEach((d,i)=>{ const row=list.children[i]; if(!d||!row) return;
      try{ const lb=d.me?cur:String(d.label||''), br=(lb&&!/ · /.test(lb))?hpBmBrowser(!!d.me,d.dev):''; const b=row.querySelector?row.querySelector('b'):null;
        if(br&&b&&!(b.dataset&&b.dataset.dsbr)){ if(b.dataset) b.dataset.dsbr='1'; b.appendChild(document.createTextNode((typeof hpPar==='function'?hpPar(br):'（'+br+'）'))); } }catch(e){}
      const x=L.find(y=>y.dev===d.dev); if(!x||x.on||(cur&&x.named)) return;
      if(ID&&(ID.ogMv||ID.ogDone||ID.ogNew||ID.ogIn)) return;
      if(row.querySelector&&row.querySelector('.ds-btn')) return; const b=document.createElement('button'); b.className='b ds-btn'; b.type='button'; b.textContent=TF('ds_btn',{k:kw}); b.addEventListener('click',()=>{ hpDsAsk(d.dev).catch(()=>{}); });
      const rm=row.querySelector?row.querySelector('button.warn'):null; if(rm&&typeof row.insertBefore==='function') row.insertBefore(b,rm); else row.appendChild(b); n++; });
    return n; }catch(e){ return 0; } }
try{ if(typeof renderDevices==='function'&&!renderDevices.__ds){ const f=renderDevices; renderDevices=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpDsRows(); }catch(e){} return v; },f,{__ds:1}); } }catch(e){}
try{ if(typeof hpBmGo==='function'&&!hpBmGo.__ds){ const f=hpBmGo; hpBmGo=Object.assign(function(go,k){ if(go==='ds'){ try{ if(hpDsKw()) hpDsAsk('').catch(()=>{}); else if(typeof hpDnAsk==='function') hpDnAsk().catch(()=>{}); }catch(e){} return 'ds'; } return f.apply(this,arguments); },f,{__ds:1}); } }catch(e){}

function hpDsSelf(){ try{ if(typeof ID==='undefined'||!ID||!ID.address) return false; if(!(typeof hpDnMine==='function'&&hpDnMine())||ID.dnSelf===2) return 'skip';
    ID.dnSelf=2; ID.devNameAt=Date.now(); ID.devNameDue=Date.now(); saveID(); setTimeout(()=>{ try{ hpDnTell().catch(()=>{}); }catch(e){} },20e3); return 'due'; }catch(e){ return false; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ let n=0; const t=setInterval(()=>{ n++; let v=false; try{ v=hpDsSelf(); }catch(e){} if(v||n>=120) clearInterval(t); },5e3); } }catch(e){}

const HP_BS_KEY='p2p_hbs', HP_BS_MAX=16; let HP_BS=null;
function hpBsLoad(){ if(HP_BS) return HP_BS; let o={}; try{ const s=(typeof hpHGet==='function')?hpHGet(HP_BS_KEY):null; o=s?JSON.parse(s):{}; }catch(e){ o={}; } HP_BS=(o&&typeof o==='object'&&!Array.isArray(o))?o:{}; return HP_BS; }
function hpBsMark(url,ok,now){ try{ url=String(url||''); if(!/^wss:\/\/[^\s"'<>]{1,190}$/.test(url)) return false; if(!ok&&typeof navigator!=='undefined'&&navigator&&navigator.onLine===false) return false; if(typeof hpMonReady==='function'&&!hpMonReady()) return false;
    now=now||Date.now(); const M=hpBsLoad(), r=M[url]&&typeof M[url]==='object'?M[url]:{}; if(ok) r.ok=now; else r.ng=now; delete M[url]; M[url]=r; const ks=Object.keys(M); while(ks.length>HP_BS_MAX) delete M[ks.shift()];
    if(typeof hpHSet==='function') hpHSet(HP_BS_KEY,JSON.stringify(M)); return true; }catch(e){ return false; } }
function hpBsLine(b,now){
  try{ if(!b) return null; now=now||Date.now(); if(b.cur) return b.on?{t:T('bm_me_on'),st:'me'}:null; const r=hpBsLoad()[String(b.url||'')]; if(!r||typeof r!=='object') return null;
    const ago=t=>TF('hs_ago',{t:hpDur(Math.max(0,now-Number(t)))}); if(Number(r.ng)>(Number(r.ok)||0)) return {t:TF('bm_ng',{t:ago(r.ng)}),st:'ng'}; if(Number(r.ok)>0) return {t:TF('bm_ok',{t:ago(r.ok)}),st:'ok'}; return null; }catch(e){ return null; } }
try{ if(typeof hpPutOne==='function'&&!hpPutOne.__bs){ const f=hpPutOne; hpPutOne=Object.assign(async function(g){ const u=String((g&&Array.isArray(g.post)&&g.post[0])||''); let v;
  try{ v=await f.apply(this,arguments); }catch(e){ try{ if(/つながらない/.test(String((e&&e.message)||e))) hpBsMark(u,false); }catch(_){} throw e; }
  try{ hpBsMark(u,true); }catch(_){} return v; },f,{__bs:1}); } }catch(e){}
try{ if(typeof hpMonText==='function'&&!hpMonText.__bs){ const f=hpMonText; hpMonText=Object.assign(function(host){ const t=String(f.apply(this,arguments)); try{ const r=hpMonGet(host);
  if(r&&r.own&&Number(r.drops)>0){ const base=String(TF('hs_mon_own',{n:r.tries,f:r.fail||0,d:r.drops||0})); if(t.indexOf(base)===0) return base+T('hs_mon_drop_nt')+t.slice(base.length); } }catch(e){} return t; },f,{__bs:1}); } }catch(e){}

function hpDlRow(i){ try{ const list=document.getElementById('dev-list'); return (list&&list.children)?list.children[i]||null:null; }catch(e){ return null; } }
function hpDlLive(){ try{ if(typeof document==='undefined'||!document.getElementById||typeof hpDevRows!=='function') return 0; const rows=hpDevRows(), S=(typeof SIB!=='undefined'&&SIB)?SIB:{}; let n=0;
    rows.forEach((d,i)=>{ const row=hpDlRow(i); if(!d||!row||d.me||!d.dev||!row.querySelector) return; const nm=row.querySelector('.nm'); if(!nm) return;
      const on=!!(S[d.dev]&&S[d.dev].state==='open'); let s=nm.querySelector('.dv-live');
      if(on&&!s){ s=document.createElement('span'); s.className='dv-live'; s.style.whiteSpace='normal'; s.style.color='#35d1b7'; s.textContent=T('dv_live'); nm.appendChild(s); }
      else if(!on&&s&&s.parentNode&&s.parentNode.removeChild) s.parentNode.removeChild(s);
      if(on) n++; });
    return n; }catch(e){ return 0; } }
function hpDlRows(){ try{ if(typeof document==='undefined'||!document.getElementById||typeof hpDevRows!=='function') return 0; const rows=hpDevRows(), mv=T('btn_dev_mv'), rm=T('dv_role_main'), me=T('dv_me'); let n=0;
    rows.forEach((d,i)=>{ const row=hpDlRow(i); if(!d||!row||!row.querySelector) return;
      try{ for(const b of Array.from(row.querySelectorAll?row.querySelectorAll('button'):[])) if(b&&b.textContent===mv&&b.parentNode&&b.parentNode.removeChild){ b.parentNode.removeChild(b); n++; } }catch(e){}
      try{ const nm=row.querySelector('.nm'), b=nm&&nm.querySelector?nm.querySelector('b'):null; if(!b||(b.dataset&&b.dataset.dl)) return; if(b.dataset) b.dataset.dl='1';
        const pre=String(TF('dv_head',{role:T(d.role==='main'?'dv_role_main':'dv_role_child'),name:''}));
        for(const t of Array.from(b.childNodes||[])){ if(t&&t.nodeType===3&&pre&&String(t.nodeValue||'').indexOf(pre)===0){ t.nodeValue=String(t.nodeValue).slice(pre.length); break; } }
        if(d.role==='main'){ let s=null; for(const c of Array.from(nm.children||[])){ if(c&&String(c.tagName||'').toUpperCase()==='SPAN'&&!c.className){ s=c; break; } }
          if(s){ const t=String(s.textContent||''); if(t.indexOf(rm)<0) s.textContent=(me&&t.indexOf(me)===0)?(me+' · '+rm+t.slice(me.length)):(rm+(t?' · '+t:'')); }
          else { const x=document.createElement('span'); x.textContent=rm; if(b.nextSibling&&typeof nm.insertBefore==='function') nm.insertBefore(x,b.nextSibling); else nm.appendChild(x); } } }catch(e){} });
    hpDlLive(); return n; }catch(e){ return 0; } }
function hpDlConn(){ try{ const c=document.getElementById('set-conn'); if(c&&c.style&&c.style.display!=='none'){ c.style.display='none'; return 1; } }catch(e){} return 0; }
function hpDlMove(){ try{ const c=document.getElementById('post-move'); if(!c||document.getElementById('pt-mv-why')) return 0; const w=document.createElement('div'); w.id='pt-mv-why'; w.style.margin='6px 0 8px';
    for(const k of ['pt_mv_cause','pt_mv_when','pt_mv_cost']){ const p=document.createElement('div'); p.className='note'; p.setAttribute('data-i18n',k); p.textContent=T(k);   w.appendChild(p); }
    let nt=null; try{ nt=c.querySelector?c.querySelector('[data-i18n="nt_pt_move"]'):null; }catch(e){}
    if(nt&&nt.parentNode&&typeof nt.parentNode.insertBefore==='function') nt.parentNode.insertBefore(w,nt.nextSibling||null); else c.appendChild(w); return 1; }catch(e){ return 0; } }
try{ if(typeof renderDevices==='function'&&!renderDevices.__dl){ const f=renderDevices; renderDevices=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpDlRows(); }catch(e){} return v; },f,{__dl:1}); } }catch(e){}
try{ if(typeof renderSiblings==='function'&&!renderSiblings.__dl){ const f=renderSiblings; renderSiblings=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpDlLive(); }catch(e){} return v; },f,{__dl:1}); } }catch(e){}
try{ if(typeof document!=='undefined'&&document&&typeof document.getElementById==='function'){ hpDlConn(); hpDlMove(); } }catch(e){}

let HP_HD_KEY='';
const HP_HD_BODY='M4 1h6v1h-6zM2 2h10v1h-10zM1 3h12v1h-12zM1 4h2v1h-2zM11 4h2v1h-2zM1 5h2v1h-2zM11 5h2v1h-2zM1 6h2v1h-2zM11 6h2v1h-2zM1 7h2v1h-2zM11 7h2v1h-2zM1 8h12v1h-12z';
function hpHdBoxes(){ try{ if(typeof document==='undefined'||!document.getElementById||typeof hpBmModel!=='function') return ''; const sc=document.getElementById('d-rly'), hs=(sc&&sc.querySelector)?sc.querySelector('.stg .hs'):null; if(!hs) return '';
    const M=hpBmModel(), B=(M&&Array.isArray(M.boxes))?M.boxes:[], cur=B.find(b=>b&&b.cur), oth=B.filter(b=>b&&!b.cur).slice(0,4);
    const key=(B.length>=2&&cur)?JSON.stringify([cur.col].concat(oth.map(b=>[b.url,b.col]))):''; if(key===HP_HD_KEY) return 'same'; HP_HD_KEY=key;
    for(const e of Array.from(hs.querySelectorAll?hs.querySelectorAll('.hp-mbx'):[])) if(e&&e.parentNode) e.parentNode.removeChild(e);
    if(!key) return 'one'; if(typeof document.createElementNS!=='function') return 'nosvg';
    const NS='http://www.w3.org/2000/svg', put=(x,col,whole)=>{ const g=document.createElementNS(NS,'g'); g.setAttribute('class','hp-mbx'); g.setAttribute('transform','translate('+x+',16)');
      if(whole){ const u=document.createElementNS(NS,'use'); u.setAttribute('href','#hp-mbox'); u.setAttribute('width','14'); u.setAttribute('height','22'); g.appendChild(u); }
      const p=document.createElementNS(NS,'path'); p.setAttribute('fill',String(col||'#8fa3b8')); p.setAttribute('d',HP_HD_BODY); g.appendChild(p); return g; };
    const mb=hs.querySelector('use[href="#hp-mbox"]'); if(mb&&mb.parentNode===hs) hs.insertBefore(put(56,cur.col,false),mb.nextSibling||null);
    oth.forEach((b,i)=>{ hs.insertBefore(put(4-16*i,b.col,true),hs.firstChild||null); });
    return 'n'+B.length; }catch(e){ return ''; } }

let HP_BM_NOTE=null;
function hpBmNoteFor(url){ const h=String(url||'').replace(/^wss:\/\//,''); let M=null; try{ M=hpBmModel(); }catch(e){}
  const B=((M&&M.boxes)||[]).find(b=>b&&b.url===url), devs=(M&&M.devs)||[], mach=(M&&M.mach)||[];
  const L=(B?(B.devs||[]):[]).filter(d=>d&&!d.me).map(d=>{ const i=devs.indexOf(d), m=mach.find(x=>x&&Array.isArray(x.idx)&&x.idx.indexOf(i)>=0), mn=String((m&&m.name)||d.a||d.b||T('bm_noname')); return {full:(d.b&&d.b!==mn)?TF('bm_dvl',{m:mn,b:d.b}):mn,m:mn}; });
  const t=L.length===1?TF('bm_box_other2',{h:h,d:L[0].full,m:L[0].m}):L.length>1?TF('bm_box_other3',{h:h,d:L.map(x=>x.full).join((typeof hpSep==='function'?hpSep():'・'))}):TF('bm_box_other',{h:h});
  return {t:t,col:(B&&B.col)||''}; }
function hpBmNoteShow(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const c=document.getElementById('post-map'); let n=document.getElementById('bm-other');
    if(!HP_BM_NOTE||!c){ if(n&&n.parentNode&&n.parentNode.removeChild) n.parentNode.removeChild(n); return 'off'; }
    if(!n){ n=document.createElement('div'); n.id='bm-other'; } if(n.parentNode!==c) c.appendChild(n);
    n.className='note'; n.style.cssText='margin-top:8px;padding:8px 10px;border:1px solid '+(HP_BM_NOTE.col||'#3a4f6e')+';border-radius:8px;color:var(--ink,#e6edf6);font-size:13px;white-space:normal'; n.textContent=HP_BM_NOTE.t; return 'on'; }catch(e){ return ''; } }
try{ if(typeof hpBmGo==='function'&&!hpBmGo.__dl){ const f=hpBmGo; hpBmGo=Object.assign(function(go,k){ try{
  if(go==='box'&&k&&k!==String(hpPostUrl()||'')){ HP_BM_NOTE=hpBmNoteFor(k); hpBmNoteShow(); return 'other'; }
  if(go==='unk'){ HP_BM_NOTE={t:k?TF('bm_unk_tip',{b:hpBcName(k)}):T('bm_unk_tip0'),col:''}; hpBmNoteShow(); return 'unk'; }
  if(HP_BM_NOTE){ HP_BM_NOTE=null; hpBmNoteShow(); } }catch(e){} return f.apply(this,arguments); },f,{__dl:1}); } }catch(e){}
try{ if(typeof hpBmUi==='function'&&!hpBmUi.__dl){ const f=hpBmUi; hpBmUi=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpBmNoteShow(); }catch(e){} try{ hpHdBoxes(); }catch(e){} return v; },f,{__dl:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ setTimeout(()=>{ try{ hpHdBoxes(); }catch(e){} },4000); setInterval(()=>{ try{ hpHdBoxes(); }catch(e){} },15000); } }catch(e){}

const HP_SH_WAIT=120e3, HP_SH_RETRY=300e3, HP_SH_LEN=40000, HP_SH_PER=200, HP_SH_TRY={}; let HP_SH_BUSY='', HP_SH_UP=0;
function hpShLen(o){ const s=JSON.stringify(JSON.stringify(o)); let n=0; for(let i=0;i<s.length;i++){ const c=s.charCodeAt(i); n+=(c<0x80)?1:(c<0x800)?2:(c>=0xd800&&c<0xdc00)?4:(c>=0xdc00&&c<0xe000)?0:3; } return n; }
function hpShMap(){ try{ return (typeof sibHistMap==='function')?sibHistMap():{}; }catch(e){ return {}; } }
function hpShTx(dev,st,n){ try{ if(typeof HP_HIST_TX!=='undefined'&&HP_HIST_TX){ if(st) HP_HIST_TX[dev]={st:st,n:n||0,at:Date.now()}; else delete HP_HIST_TX[dev]; } if(typeof hpHistTxUi==='function') hpHistTxUi(); }catch(e){} }
function hpShSelect(dev){
  const out=[], lo=(typeof lastOpenLoad==='function')?lastOpenLoad():{}, seen={}; let np=0, skip=0, big=0;
  const hv=(typeof HP_SP_HAVE!=='undefined'&&HP_SP_HAVE[dev]&&HP_SP_HAVE[dev].m)||{}, P=(typeof hpSpLoad==='function')?hpSpLoad():{}, pg=(P[dev]&&P[dev].p&&typeof P[dev].p==='object')?P[dev].p:{};
  for(const c of contacts()){
    const all0=histLoad(c.address).filter(x=>x&&typeof x.ts==='number'&&(x.d==='s'||x.d==='p')&&x.t!=='[object ArrayBuffer]'&&x.t!=='[object Blob]').sort((x,y)=>x.ts-y.ts);
    const h=Number(hv[c.address])||0, done=Number(pg[c.address])||0;
    let all=all0.filter(x=>x.ts>=h&&!(done>0&&x.ts<done)); skip+=all0.length-all.length;
    all=all.map(x=>(typeof sibHistItem==='function')?sibHistItem(x):x).filter(x=>{ if(hpShLen(x)<=HP_SH_LEN) return true; big++; return false; });
    if(!all.length) continue; np++; if(lo[c.address]) seen[c.address]=lo[c.address];
    let c1=(typeof sibHistCard==='function')?sibHistCard(c):null; if(c1&&hpShLen(c1)>HP_SH_LEN/2) c1=Object.assign({},c1,{card:null,cardAt:0});
    out.push({peer:c.address,items:all,c:c1}); }
  return {peers:out,np:np,seen:seen,skip:skip,big:big,pg:pg,P:P}; }
function hpShLetters(sel){
  const out=[];
  for(const p of sel.peers){ let cur=[], len=0, c1=p.c; const base=hpShLen({v:1,type:'sibh',peer:p.peer,items:[]});
    const flush=()=>{ const b={v:1,type:'sibh',peer:p.peer,items:cur}; if(c1){ b.c=c1; c1=null; } out.push({b:b,last:cur.length?cur[cur.length-1].ts:0}); cur=[]; len=0; };
    for(const it of p.items){ const l=hpShLen(it)+1; let room=HP_SH_LEN-base-(c1?hpShLen(c1)+6:0); if(!cur.length&&c1&&l>room){ flush(); room=HP_SH_LEN-base; } if(cur.length&&(cur.length>=HP_SH_PER||len+l>room)) flush(); cur.push(it); len+=l; }
    if(cur.length) flush(); }
  return out; }
async function hpShSend(dev,why){
  if(HP_SH_BUSY||!ID||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||typeof hpSibPut!=='function') return false;
  HP_SH_BUSY=dev; let n=0, nl=0, sel=null;
  try{
    sel=hpShSelect(dev); const ls=hpShLetters(sel);
    hpShTx(dev,'send',0);
    for(const x of ls){ const k=await hpSibPut(x.b,[dev]); if(!k) throw new Error('宛先の端末に封をできない（受け取り用の鍵が無い）'); n+=x.b.items.length; nl++; hpShTx(dev,'send',n);
      try{ if(x.last){ sel.pg[x.b.peer]=x.last; sel.P[dev]={p:sel.pg,at:Date.now()}; if(typeof hpSpSave==='function') hpSpSave(sel.P); } }catch(e){} }
    const k2=await hpSibPut({v:1,type:'sibhd',n:n,c:sel.np,seen:sel.seen},[dev]); if(!k2) throw new Error('宛先の端末に封をできない（受け取り用の鍵が無い）'); nl++;
    try{ const P2=(typeof hpSpLoad==='function')?hpSpLoad():{}; delete P2[dev]; if(typeof hpSpSave==='function') hpSpSave(P2); if(typeof HP_SP_HAVE!=='undefined') delete HP_SP_HAVE[dev]; }catch(e){}
    try{ if(typeof sibHistSet==='function') sibHistSet(dev,false); }catch(e){}
    delete HP_SH_TRY[dev];
    hpLog('過去の手紙を自分の端末（'+((typeof sibLabel==='function')?sibLabel(dev):String(dev).slice(0,10)+'…')+'）へ郵便受け経由で写した（'+sel.np+' 人・'+n+' 通・封 '+nl+' 通'+(sel.skip?'・相手が持っている '+sel.skip+' 通は送らない':'')+(sel.big?'・大きすぎる '+sel.big+' 通は送らない':'')+'。'+(why||'')+'）');
    hpShTx(dev,'done',n); try{ setTimeout(()=>{ try{ if(typeof hpHistTxUi==='function') hpHistTxUi(); }catch(e){} },(typeof HP_HIST_DONE_MS!=='undefined'?HP_HIST_DONE_MS:60000)+500); }catch(e){}
    return true;
  }catch(e){ HP_SH_TRY[dev]={at:Date.now(),n:((HP_SH_TRY[dev]||{}).n||0)+1}; hpShTx(dev,'',0);
    hpLog('過去の手紙を郵便受け経由で写せなかった（'+((e&&e.message)||e)+'。'+Math.round(HP_SH_RETRY/60000)+' 分あけてもう一度。線が開けば直結で）');
    try{ const s=(typeof SIB!=='undefined'&&SIB)?SIB[dev]:null; if(s&&s.state==='open'&&typeof sibSendHistory==='function') Promise.resolve(sibSendHistory(dev)).catch(()=>{}); }catch(e3){}
    return false; }
  finally{ HP_SH_BUSY=''; } }
function hpShDue(now){
  now=now||Date.now(); const out=[]; if(!ID) return out; const m=Object.assign({},hpShMap());
  try{ const P=(typeof hpSpLoad==='function')?hpSpLoad():{}; for(const dev of Object.keys(P)){ if(!m[dev]&&P[dev]&&P[dev].p&&typeof P[dev].p==='object'&&Object.keys(P[dev].p).length) m[dev]=Number(P[dev].at)||1; } }catch(e){}
  for(const dev of Object.keys(m)){ const at=Number(m[dev])||0; if(!at) continue;
    try{ if(typeof SIB!=='undefined'&&SIB&&SIB[dev]) continue; if(typeof SIB_HIST_BUSY!=='undefined'&&SIB_HIST_BUSY&&SIB_HIST_BUSY.has(dev)) continue; if(typeof sibIsMine==='function'&&!sibIsMine(dev)) continue; }catch(e){ continue; }
    const t=HP_SH_TRY[dev]; if(t&&now-t.at<HP_SH_RETRY) continue;
    if(now-Math.max(at,HP_SH_UP)<HP_SH_WAIT) continue; out.push(dev); }
  return out; }
async function hpShTick(now){
  now=now||Date.now(); try{ if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner){ HP_SH_UP=0; return ''; } if(!HP_SH_UP) HP_SH_UP=now; }catch(e){ return ''; }
  if(HP_SH_BUSY) return 'busy'; const d=hpShDue(now); if(!d.length) return '';
  const ok=await hpShSend(d[0],'直結が '+Math.round(HP_SH_WAIT/60000)+' 分開かない'); return (ok?'sent ':'fail ')+d[0]; }
try{ if(typeof hpSibLetter==='function'&&!hpSibLetter.__sh){ const f=hpSibLetter; hpSibLetter=Object.assign(async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){}
  if(o&&o.v===1&&(o.type==='sibh'||o.type==='sibhd')){ if(!ID||r.from!==ID.address||r.fromMaster!==ID.publicKey){ hpLog('自分の機械でない相手からの '+o.type+'（捨てた）'); return true; }
    try{ if(typeof hpSeenMark==='function') hpSeenMark(r.fromDev, r.sentAt); }catch(e){}
    if(typeof sibOnMessage!=='function') return true;
    if(o.type==='sibh'){ if(typeof o.peer!=='string'||!Array.isArray(o.items)) return true; const m={t:'hist',peer:o.peer,items:o.items.slice(0,HP_SH_PER)}; if(o.c&&typeof o.c==='object') m.c=o.c; sibOnMessage(r.fromDev,m); hpLog('自分の端末（'+String(r.fromDev||'').slice(0,10)+'…）から過去の手紙の写し '+m.items.length+' 通を郵便受け経由で受け取った'); }
    else sibOnMessage(r.fromDev,{t:'histdone',n:Number(o.n)||0,c:Number(o.c)||0,seen:(o.seen&&typeof o.seen==='object'&&!Array.isArray(o.seen))?o.seen:{}});
    return true; }
  return f.apply(this,arguments); },f,{__sh:1}); } }catch(e){}
try{ if(typeof sibSendHistory==='function'&&!sibSendHistory.__sh){ const f=sibSendHistory; sibSendHistory=Object.assign(async function(id){ if(HP_SH_BUSY&&HP_SH_BUSY===id) return false;   return await f.apply(this,arguments); },f,{__sh:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function') setInterval(()=>{ try{ Promise.resolve(hpShTick()).catch(()=>{}); }catch(e){} },15000); }catch(e){}

const HP_DT_GAP=60e3; let HP_DT_T=0, HP_DT_BUSY=false;
function hpDtVer(){ try{ return Number(ID&&ID.devNameAt)||1; }catch(e){ return 1; } }
function hpDtTold(){ if(!ID.dnTold||typeof ID.dnTold!=='object'||Array.isArray(ID.dnTold)) ID.dnTold={}; return ID.dnTold; }
function hpDtMark(devs,v){ try{ const t=hpDtTold(); for(const d of devs) if(d) t[d]=v; saveID(); }catch(e){} }
function hpDtNeed(){ try{ if(!ID||typeof hpSibs!=='function') return []; const v=hpDtVer(), t=hpDtTold(), now=Date.now(); return hpSibs().filter(d=>d&&d.dev&&hpPreValid(d.pre,d.dev,now)&&!(Number(t[d.dev])>=v)).map(d=>d.dev); }catch(e){ return []; } }
async function hpDnTellNew(why){
  if(HP_DT_BUSY||!ID||ID.devNameDue||typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||typeof hpSibPut!=='function') return 0; const need=hpDtNeed(); if(!need.length) return 0; HP_DT_BUSY=true; let n=0;
  try{ const kp=await hpDevKey(), dev=hpHex(kp.publicKey); let kind='other'; try{ kind=hpDevKindOf(hpDnAuto()); }catch(e){} let br=''; try{ const m=/^(.+?) · (.+)$/.exec(String(hpDnAuto()||'')); br=m?m[1]:''; }catch(e){}
    const v=hpDtVer(), body={v:1,type:'devname',dev:dev,label:(typeof hpDnMine==='function')?hpDnMine():'',kind:kind,br:br,ts:v};
    const gone=d=>typeof hpSibs==='function'&&!hpSibs().some(x=>x&&x.dev===d);
    for(const d of need){ if(gone(d)){ hpDtMark([d],v); continue; } let k=0; try{ k=await hpSibPut(body,[d]); }catch(e){ if(gone(d)){ hpDtMark([d],v); continue; } throw e; } hpDtMark([d],v); if(k>0) n++; }
    if(n) hpLog('この端末の名前とブラウザを、まだ知らせていなかった端末 '+n+' 台に知らせた'+(why?'（'+why+'）':'')); return n; }
  catch(e){ try{ hpLog('この端末の名前を知らせられない（'+((e&&e.message)||e)+'。1 分後にもう一度）'); }catch(x){} return -1; } finally{ HP_DT_BUSY=false; } }
try{ if(typeof hpDnTell==='function'&&!hpDnTell.__dt){ const f=hpDnTell; hpDnTell=Object.assign(async function(){ const n=await f.apply(this,arguments); try{ if(n>0&&ID&&!ID.devNameDue&&typeof hpSibs==='function') hpDtMark(hpSibs().map(d=>d&&d.dev),hpDtVer()); }catch(e){} return n; },f,{__dt:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function') setInterval(()=>{ try{ if(Date.now()-HP_DT_T<HP_DT_GAP-5e3) return; HP_DT_T=Date.now(); Promise.resolve(hpDnTellNew('見回り')).catch(()=>{}); }catch(e){} },HP_DT_GAP); }catch(e){}

const HP_OG_URL='https://handpost.page/';
function hpOgOld(){ try{ if(typeof location==='undefined') return false; const h=String(location.hostname||''); if(!h||h==='handpost.page'||h==='www.handpost.page') return false; if(/^(localhost|127\.0\.0\.1|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(h)) return false; return true; }catch(e){ return false; } }
function hpOgShow(){ try{ if(typeof document==='undefined'||!document.body) return ''; let n=document.getElementById('oldpg-note'); if(!hpOgOld()){ if(n&&n.remove) n.remove(); return 'no'; }
  if(!n){ n=document.createElement('div'); n.id='oldpg-note'; n.style.cssText='margin:8px 14px 0;padding:10px 12px;border:1px solid var(--amber);border-radius:10px;background:#1a1300;color:var(--amber);font-size:13px;line-height:1.6';
    const t=document.createElement('div'); t.id='oldpg-text'; n.appendChild(t); const b=document.createElement('button'); b.className='b pri'; b.id='btn-og-open'; b.type='button'; b.style.cssText='margin-top:8px'; b.onclick=()=>{ try{ window.open(HP_OG_URL,'_blank','noopener'); }catch(e){} }; n.appendChild(b);
    const bn=document.getElementById('banner'); if(bn&&bn.parentNode) bn.parentNode.insertBefore(n,bn.nextSibling); else document.body.insertBefore(n,document.body.firstChild); }
  const t=document.getElementById('oldpg-text'), b=document.getElementById('btn-og-open'); if(t&&t.textContent!==T('og_text')) t.textContent=T('og_text'); if(b&&b.textContent!==T('btn_og_open')) b.textContent=T('btn_og_open'); return 'on'; }catch(e){ return ''; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ setTimeout(()=>{ try{ hpOgShow(); }catch(e){} },1500); setInterval(()=>{ try{ hpOgShow(); }catch(e){} },30000); } }catch(e){}

let HP_D2_GONELOG={};
function hpD2GoneDev(dev){ try{ const g=(ID&&Array.isArray(ID.gone))?ID.gone.find(x=>x&&x.dev===dev):null; if(!g) return false; if(!HP_D2_GONELOG[dev]){ HP_D2_GONELOG[dev]=1; hpLog('外した端末は、名簿に残っていても一覧へ戻さない（端末 '+String(dev).slice(0,10)+'…）'); } return true; }catch(e){ return false; } }

const HP_NJ_RETRY=600e3; let HP_NJ_ARM=false;
function hpNjSave(patch){ try{ const s=hpNfGet(); if(s.on) return false; localStorage.setItem(HP_NF_KEY,JSON.stringify(Object.assign({},s,patch))); return true; }catch(e){ return false; } }
function hpNjWant(){ try{
  if(typeof ID==='undefined'||!ID) return ''; if(typeof hpOgOld==='function'&&hpOgOld()) return ''; if(typeof hpBlOff==='function'&&hpBlOff()) return '';
  const s=hpNfGet(); if(s.on||s.off) return ''; if(HP_NF_BUSY||hpNfWhy()||!hpNfUp()) return '';
  const p=(typeof Notification!=='undefined')?String(Notification.permission||''):'';
  if(p==='granted') return (Date.now()-(Number(s.try)||0)>HP_NJ_RETRY)?'go':'';
  return (p==='default'&&!s.ask)?'ask':''; }catch(e){ return ''; } }
function hpNjArm(){ if(HP_NJ_ARM||typeof document==='undefined'||!document||typeof document.addEventListener!=='function') return false; HP_NJ_ARM=true;
  const fn=()=>{ try{ if(hpNjWant()!=='ask') return; document.removeEventListener('click',fn,true); HP_NJ_ARM=false; hpNjSave({ask:Date.now()}); hpLog('通知：閉じている間の通知を最初から入れるため、ブラウザに許可を聞いた（自動で聞くのは 1 回だけ）'); hpNfFlip(true).catch(()=>{}); }catch(e){} };
  document.addEventListener('click',fn,true); return true; }
function hpNjTick(){ const w=hpNjWant();
  if(w==='go'){ hpNjSave({try:Date.now()}); hpLog('通知：ブラウザの許可がもうあるので、閉じている間の通知を入れる（最初から入れる）'); hpNfFlip(true).catch(()=>{}); return 'go'; }
  if(w==='ask') return hpNjArm()?'arm':'armed'; return ''; }
try{ if(typeof hpNfFlip==='function'&&!hpNfFlip.__nj){ const f=hpNfFlip; hpNfFlip=async function(on){ const r=await f.apply(this,arguments); try{ if(!on&&!hpNfGet().on){ hpNjSave({off:Date.now()}); hpLog('通知：設定のスイッチで切った（自動では入れ直さない）'); } }catch(e){} return r; }; hpNfFlip.__nj=1; } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ setTimeout(()=>{ try{ hpNjTick(); }catch(e){} },4000); setInterval(()=>{ try{ hpNjTick(); }catch(e){} },20000); } }catch(e){}

const HP_REL_PUB='654e0e5c037303baf5b74e81ee249276a904f1909e91abc58aac456c7e21b3bd', HP_REL_EVERY=30*60e3;
let HP_REL_SUS=0, HP_REL_NEXT=0; const HP_REL_SUS_N=3, HP_REL_SUS_GAP=20e3, HP_REL_EVERY_BAD=2*60e3;
const HP_REL_RL_KEY='hp_rel_rl', HP_REL_IDLE=20*60e3, HP_REL_AWAY=30*60e3, HP_REL_RL_GAP=15*60e3; let HP_REL_BOOT=Date.now(), HP_REL_INPUT=Date.now(), HP_REL_HID_AT=0, HP_REL_BACK=0;
let HP_REL={st:'',fp:'',at:0,why:'',ext:[]}, HP_REL_BUSY=false, HP_REL_HOLD=0;
function hpRelHere(){ try{ if(typeof location==='undefined') return false; const h=String(location.hostname||''); return h==='handpost.page'||h==='www.handpost.page'; }catch(e){ return false; } }
function hpRelSrcs(ext){ const out=[]; let base='', org=''; try{ base=String(location.href||('https://'+location.hostname+'/')); org=new URL(base).origin; }catch(e){ return out; }
  try{ for(const s of document.querySelectorAll('script[src]')){ const src=String(s.getAttribute('src')||''); if(!src) continue; let u=null; try{ u=new URL(src,base); }catch(e){ continue; }
    if(u.origin!==org||!/^https?:$/.test(u.protocol)){ if(ext&&ext.length<8) ext.push(String(u.protocol+'//'+u.host+u.pathname).slice(0,120)); continue; }
    let p=u.pathname; try{ p=decodeURIComponent(p); }catch(e){} out.push({src:u.pathname+u.search,path:p.replace(/^\//,'')}); } }catch(e){} return out; }
async function hpRelBytes(url,opt){ const r=await fetch(url,opt||{cache:'force-cache'}); if(!r.ok) throw new Error(url.split('?')[0]+' '+r.status); return new Uint8Array(await r.arrayBuffer()); }
async function hpRelSha(u8){ return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',u8))); }
const HP_REL_MINE=new Map();
async function hpRelMine(scr,strict){ const hs={}; for(const f of scr){ let h=HP_REL_MINE.get(f.src); if(!h){ try{ h=await hpRelSha(await hpRelBytes(f.src)); HP_REL_MINE.set(f.src,h); }catch(e){ if(strict) throw e; continue; } } hs[f.path]=h; } return hs; }
function hpRelSums(txt){ const m={}; for(const l of String(txt).split('\n')){ const x=/^([0-9a-f]{64})  (.+)$/.exec(l); if(x) m[x[2]]=x[1]; } return m; }
const HP_REL_HIST_MAX=20;
function hpRelRed(st){ return st==='badsig'||st==='served'||st==='unknown'; }
async function hpRelJson(p,want){ const b=await hpRelBytes('/'+p,{cache:'no-store'}); if(!want[p]||want[p]!==(await hpRelSha(b))) throw new Error(p+' が印と合わない'); return JSON.parse(new TextDecoder().decode(b)); }
async function hpRelFindOld(scr,hs,want){
  let L=[]; try{ const j=await hpRelJson('releases/index.json',want); L=Array.isArray(j&&j.list)?j.list:[]; }catch(e){ return 0; }
  for(const x of L.slice(0,HP_REL_HIST_MAX)){ try{ if(!x||!Number.isInteger(x.n)||x.n<1||!/^[0-9a-f]{64}$/.test(String(x.fp||''))) continue;
      const s=await hpRelBytes('/releases/'+x.n+'.sums',{cache:'force-cache'}); if((await hpRelSha(s))!==x.fp) continue;
      const w=hpRelSums(new TextDecoder().decode(s)); if(scr.every(f=>w[f.path]&&w[f.path]===hs[f.path])) return x.n; }catch(e){} }
  return 0; }
async function hpRelCheck(){
  if(HP_REL_BUSY) return HP_REL.st; HP_REL_BUSY=true; const now=Date.now(); let st='err', fp='', why='', ext=[], n=0, o=0;
  try{
    if(!hpRelHere()) st='skip';
    else {
      await hpRelMine(hpRelSrcs([]),false);
      let sums=null, sig=''; try{ sums=await hpRelBytes('/SHA256SUMS',{cache:'no-store'}); }catch(e){ throw e; }
      try{ sig=String(new TextDecoder().decode(await hpRelBytes('/SHA256SUMS.sig',{cache:'no-store'}))).trim(); }catch(e){ sig=''; }
      fp=(await hpRelSha(sums)).slice(0,16);
      if(!/^[0-9a-f]{128}$/.test(sig)) st='nosig';
      else { const s=hp5S(); const good=s.crypto_sign_verify_detached(hexToBytes(sig),s.from_string('handpost-release:v1:'+(await hpRelSha(sums))),hexToBytes(HP_REL_PUB));
        if(!good) st='badsig';
        else { const want=hpRelSums(new TextDecoder().decode(sums)), fresh={cache:'no-cache'};
          try{ const r=await hpRelJson('RELEASE',want); n=(r&&Number.isInteger(r.n)&&r.n>0)?r.n:0; }catch(e){ n=0; }
          for(const f of [{src:'/index.html',path:'index.html'},{src:'/sw.js',path:'sw.js'}]){ const h=await hpRelSha(await hpRelBytes(f.src,fresh)); if(!want[f.path]||want[f.path]!==h) why=why||f.path; }
          if(why) st='served';
          else { const scr=hpRelSrcs(ext), hs=await hpRelMine(scr,true);
            const bad=scr.filter(f=>!want[f.path]||want[f.path]!==hs[f.path]);
            if(!bad.length) st='ok'; else { o=await hpRelFindOld(scr,hs,want); if(o) st='old'; else { st='unknown'; why=bad[0].path; } } } } }
    }
  }catch(e){ st='err'; why=String((e&&e.message)||e).slice(0,80); }
  const was=HP_REL.st;
  if(hpRelRed(st)&&!hpRelRed(was)){ HP_REL_SUS++; if(HP_REL_SUS<HP_REL_SUS_N){ HP_REL_BUSY=false; HP_REL_NEXT=Date.now()+HP_REL_SUS_GAP; try{ hpLog('本物の印：'+st+'（'+HP_REL_SUS+' 回目）'+(why?' '+why:'')+'。'+Math.round(HP_REL_SUS_GAP/1000)+' 秒後に確かめ直す（配り替えの最中かもしれない）'); }catch(e){} try{ hpRelUi(); }catch(e){} return was; } }
  HP_REL_SUS=0; HP_REL_NEXT=0;
  HP_REL={st:st,fp:fp,at:now,why:why,ext:ext,n:n,o:o}; HP_REL_BUSY=false;
  try{ hpLog('本物の印：'+st+(n?'（第 '+n+' 版'+(o?'・開いているのは第 '+o+' 版':'')+'）':'')+(fp?'（照合番号 '+fp.slice(0,8)+'）':'')+(why?' '+why:'')+(ext.length?'・照らさない script（拡張機能など）'+ext.length+' つ：'+ext.join(' '):'')); }catch(e){}
  try{ if(hpRelRed(st)) hpBanner(hpRelMsg()); }catch(e){}
  try{ if(hpRelRed(was)&&!hpRelRed(st)) hpRelResume(); }catch(e){}
  try{ if(st==='old'||st==='unknown') hpRelMaybeReload(); }catch(e){}
  try{ hpRelUi(); }catch(e){} return st; }
function hpRelT(){ return HP_REL.at?new Date(HP_REL.at).toTimeString().slice(0,8):''; }
function hpRelMsg(){ const R=HP_REL;
  return R.st==='ok'?(R.n?TF('rel_ok',{n:R.n,t:hpRelT()}):TF('rel_ok0',{t:hpRelT()})):R.st==='old'?TF('rel_old',{o:R.o,n:R.n||'?'}):R.st==='unknown'?TF('rel_unknown',{f:R.why||'?'}):R.st==='served'?TF('rel_served',{f:R.why||'?'})
    :R.st==='badsig'?T('rel_bad'):R.st==='nosig'?T('rel_nosig'):R.st==='skip'?T('rel_skip'):R.st==='err'?TF('rel_err',{e:R.why}):T('rel_wait'); }
function hpRelText(){ const R=HP_REL, t=hpRelT(); if(HP_REL_BUSY||Date.now()<HP_REL_HOLD||!R.st) return T('rel_wait');
  return hpRelMsg()+((!t||R.st==='ok'||R.st==='skip')?'':TF('rel_at',{t:t})); }
function hpRelUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const sec=document.getElementById('p-sec')||document.getElementById('p-id');   if(!sec) return false;
  let c=document.getElementById('rel-card'); if(!c){ c=document.createElement('div'); c.className='card'; c.id='rel-card'; const h=document.createElement('h2'); h.id='rel-title'; c.appendChild(h); const st=document.createElement('div'); st.id='rel-state'; st.className='note'; st.style.cssText='margin:6px 0;line-height:1.6'; c.appendChild(st);
    const nt=document.createElement('div'); nt.id='rel-note'; nt.className='note'; nt.style.cssText='white-space:pre-line'; c.appendChild(nt); const row=document.createElement('div'); row.className='row'; row.style.cssText='margin-top:8px'; const b=document.createElement('button'); b.className='b'; b.id='btn-rel-again'; b.type='button'; b.onclick=()=>{ hpRelAgain().catch(()=>{}); }; row.appendChild(b); c.appendChild(row); const dm=document.getElementById('danger-more'); if(dm&&dm.parentNode===sec) sec.insertBefore(c,dm); else sec.appendChild(c); }
  const E=id=>document.getElementById(id);
  if(!E('rel-ext')&&E('rel-note')&&E('rel-note').parentNode){ const x=document.createElement('div'); x.id='rel-ext'; x.className='note'; x.style.cssText='white-space:pre-line;margin:4px 0 8px;overflow-wrap:anywhere'; E('rel-note').parentNode.insertBefore(x,E('rel-note')); }
  if(!E('btn-rel-reload')&&E('btn-rel-again')&&E('btn-rel-again').parentNode){ const rb=document.createElement('button'); rb.className='b'; rb.id='btn-rel-reload'; rb.type='button'; rb.style.cssText='margin-left:8px'; rb.onclick=()=>{ try{ location.reload(); }catch(e){} }; E('btn-rel-again').parentNode.appendChild(rb); }
  const busy=HP_REL_BUSY||Date.now()<HP_REL_HOLD, ex=HP_REL.ext||[], tt=T('rel_title'), tx=hpRelText(), nt=TF('rel_note',{fp:String(HP_REL.fp||'').slice(0,8)||'—'}), bt=T('btn_rel_again'), rt=T('btn_rel_reload'), xs=ex.length?TF('rel_ext',{n:ex.length,list:ex.join('\n')}):'';
  if(E('rel-title').textContent!==tt) E('rel-title').textContent=tt; if(E('rel-state').textContent!==tx) E('rel-state').textContent=tx; if(E('rel-note').textContent!==nt) E('rel-note').textContent=nt; if(E('btn-rel-again').textContent!==bt) E('btn-rel-again').textContent=bt;
  const ba=E('btn-rel-again'), rb=E('btn-rel-reload'), xe=E('rel-ext'); ba.disabled=busy; ba.style.opacity=busy?'.5':'';
  if(rb){ if(rb.textContent!==rt) rb.textContent=rt; rb.style.display=(!busy&&(HP_REL.st==='old'||HP_REL.st==='unknown'))?'':'none'; } if(xe){ if(xe.textContent!==xs) xe.textContent=xs; xe.style.display=xs?'':'none'; }
  E('rel-state').style.color=busy?'':hpRelRed(HP_REL.st)?'var(--red)':(HP_REL.st==='old'||HP_REL.st==='nosig')?'var(--amber)':HP_REL.st==='ok'?'var(--teal)':''; return true; }catch(e){ return false; } }
function hpRelAgain(){ HP_REL_HOLD=Date.now()+800; try{ hpRelUi(); }catch(e){}
  return Promise.all([hpRelCheck().catch(()=>''),new Promise(r=>setTimeout(r,800))]).then(()=>{ HP_REL_HOLD=0; try{ hpRelUi(); }catch(e){} return HP_REL.st; }); }
function hpRelResume(){
  try{ hpLog('本物の印が合ったので、郵便受けとのやり取りを再開する'); }catch(e){}
  try{ hpBanner(null); }catch(e){}
  try{ if(typeof POST!=='undefined'&&POST&&POST.up&&typeof hpReclaim==='function'){ POST.claimedId=null; Promise.resolve(hpReclaim()).catch(()=>{}); } else if(typeof startBg==='function') startBg(); }catch(e){}
  try{ if(typeof hpResendKick==='function') Promise.resolve(hpResendKick()).catch(()=>{}); }catch(e){} }
function hpRelSafe(){
  try{ const m=document.getElementById('msg'); if(m&&String(m.value||'').trim()) return false; }catch(e){}
  try{ const a=document.activeElement; if(a&&/^(INPUT|TEXTAREA)$/.test(String(a.tagName||''))&&String(a.value||'').trim()) return false; }catch(e){}
  try{ if(typeof DRAFTS!=='undefined'&&DRAFTS&&DRAFTS.length) return false; }catch(e){}
  try{ if(typeof HP_SENDING!=='undefined'&&HP_SENDING&&HP_SENDING.size) return false; }catch(e){}
  return true; }
function hpRelMaybeReload(){
  try{ if(typeof window==='undefined'||typeof location==='undefined'||typeof location.reload!=='function') return false;
    if((HP_REL.st!=='old'&&HP_REL.st!=='unknown')||!HP_REL.fp) return false;
    if(typeof document!=='undefined'&&document&&document.visibilityState==='hidden') return false;
    const now=Date.now(), boot=now-HP_REL_BOOT<60e3, back=!!HP_REL_BACK&&now-HP_REL_BACK<60e3, idle=now-HP_REL_INPUT>=HP_REL_IDLE;
    if(!(boot||back||idle)) return false;
    let last=null; try{ last=JSON.parse(localStorage.getItem(HP_REL_RL_KEY)||'null'); }catch(e){ last=null; }
    if(last&&last.fp===HP_REL.fp&&now-Number(last.at||0)<HP_REL_RL_GAP) return false;
    if(!hpRelSafe()) return false;
    try{ localStorage.setItem(HP_REL_RL_KEY,JSON.stringify({fp:HP_REL.fp,at:now})); }catch(e){}
    try{ hpLog((HP_REL.st==='old'?'新しい版（第 '+HP_REL.n+' 版）が出ているので開き直す（':'正式な版と合わないので開き直す（')+(boot?'開いた直後':back?'しばらく離れて戻った':'しばらく操作が無い')+'・配られている版の照合番号 '+HP_REL.fp.slice(0,8)+'）'); }catch(e){}
    location.reload(); return true; }catch(e){ return false; } }
function hpRelTick(){
  try{ hpRelUi(); }catch(e){}
  const now=Date.now();
  if(HP_REL_NEXT){ if(now>=HP_REL_NEXT){ HP_REL_NEXT=0; hpRelCheck().catch(()=>{}); } return; }
  if(now-HP_REL.at>(hpRelRed(HP_REL.st)?HP_REL_EVERY_BAD:HP_REL_EVERY)){ hpRelCheck().catch(()=>{}); return; }
  if(HP_REL.st==='old'||HP_REL.st==='unknown') hpRelMaybeReload(); }
function hpRelOnVis(){
  try{ if(document.visibilityState==='hidden'){ HP_REL_HID_AT=Date.now(); return; }
    if(HP_REL_HID_AT&&Date.now()-HP_REL_HID_AT>=HP_REL_AWAY){ HP_REL_BACK=Date.now(); HP_REL_NEXT=0; hpRelCheck().catch(()=>{}); }
    HP_REL_HID_AT=0; }catch(e){} }
try{ if(typeof hpSend==='function'&&!hpSend.__rel){ const f=hpSend; hpSend=function(){ if(hpRelRed(HP_REL.st)) return Promise.reject(new Error(T('rel_bad_short'))); return f.apply(this,arguments); }; hpSend.__rel=1; } }catch(e){}
try{ if(typeof hpPut==='function'&&!hpPut.__rel){ const f=hpPut; hpPut=async function(){ if(hpRelRed(HP_REL.st)){ const e=new Error(T('rel_bad_short')); e.hpk='wait'; e.hpWhy=T('rel_bad_short'); throw e; } return f.apply(this,arguments); }; hpPut.__rel=1; } }catch(e){}
try{ if(typeof hpFailText==='function'&&!hpFailText.__rel){ const f=hpFailText; hpFailText=function(peer){ const s=f.apply(this,arguments); try{ const x=HP_FAIL_LAST.get(peer); if(hpRelRed(HP_REL.st)&&x&&x.k==='wait') return TF('sys_fail_rel',{name:nickOf(peer)})+TF('sys_fail_n',{n:hpPendList(peer).length,t:x.t}); }catch(e){} return s; }; hpFailText.__rel=1; } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ setTimeout(()=>{ try{ hpRelUi(); hpRelCheck().catch(()=>{}); }catch(e){} },3000); setInterval(()=>{ try{ hpRelTick(); }catch(e){} },5000);
  document.addEventListener('visibilitychange',hpRelOnVis); for(const k of ['keydown','pointerdown','touchstart','input']) document.addEventListener(k,()=>{ HP_REL_INPUT=Date.now(); },{capture:true,passive:true}); } }catch(e){}

async function hpVaultSwitch(kind,pwNew,pwCur){
  const m=hpVaultMeta(); if(!m||!VAULT||!VAULT_DK) throw hpVErr('swlocked','鍵が開いていない');
  const cur=m.wraps.find(w=>w.k==='prf')||m.wraps.find(w=>w.k==='pw'); if(!cur) throw hpVErr('other','いまの守り方が無い');
  const s=hp5S(); let sec=null;
  if(cur.k==='pw'){ if(pwCur==null) throw hpVErr('wrong','いまのパスフレーズが要る'); sec=await hpPwBits(pwCur,hpBytes(cur.salt),cur.it); } else sec=await hpPkGet(cur.cred,hpBytes(cur.salt));
  let dk; try{ dk=hpVDec(hpVWK(cur.k,sec),cur.box,'handpost-vault-wrap:v1:'+cur.k); }catch(e){ throw hpVErr('wrong','鍵が合わない'); }
  if(hpHex(dk)!==hpHex(VAULT_DK)) throw hpVErr('wrong','鍵が合わない');
  const w=await hpVaultWrapNew(kind,pwNew,VAULT_DK);
  let back; try{ const sec2=kind==='prf'?await hpPkGet(w.cred,hpBytes(w.salt)):await hpPwBits(pwNew,hpBytes(w.salt),w.it); back=hpVDec(hpVWK(kind,sec2),w.box,'handpost-vault-wrap:v1:'+kind); }catch(e){ throw hpVErr('other','新しい包みを開き直せない'); }
  if(hpHex(back)!==hpHex(VAULT_DK)) throw hpVErr('other','新しい包みを開き直せない');
  const m2=hpVaultMeta(); if(!m2) throw hpVErr('other','封が無い');
  m2.wraps=m2.wraps.filter(x=>x&&x.k!=='prf'&&x.k!=='pw').concat([w]); m2.at=Date.now(); localStorage.setItem(HP_VAULT_KEY,JSON.stringify(m2));
  try{ hpLog('守り方を替えた（'+(cur.k==='prf'?'パスキー':'パスフレーズ')+' → '+(kind==='prf'?'パスキー':'パスフレーズ')+'）'); }catch(e){}
  return cur.k; }
function hpVsUi(){ try{ const E=id=>document.getElementById(id), card=E('vault-card'); if(!card) return false; const on=hpVaultOn(), k=hpVaultKinds(), pk=k.indexOf('prf')>=0;
  let row=E('vault-sw'); if(!row){ row=document.createElement('div'); row.id='vault-sw'; row.className='row'; row.style.cssText='margin-top:8px;flex-wrap:wrap';
    const mk=(id,cls)=>{ const b=document.createElement('button'); b.type='button'; b.className=cls; b.id=id; row.appendChild(b); return b; };
    mk('btn-vt-sw-pk','b pri'); mk('btn-vt-sw-pw','b'); mk('btn-vt-sw-topw','b pri');
    const f=document.createElement('form'); f.id='vault-sw-wrap'; f.setAttribute('autocomplete','off'); f.style.cssText='display:none;margin-top:8px'; f.addEventListener('submit',e=>e.preventDefault());
    const nt=document.createElement('div'); nt.className='note'; nt.id='vault-sw-note'; f.appendChild(nt);
    const cur=hpSecretInput(document.createElement('input')); cur.id='vault-sw-cur'; cur.style.cssText='width:100%;margin-top:6px'; f.appendChild(cur);
    const n1=hpSecretInput(document.createElement('input')); n1.id='vault-sw-new1'; n1.style.cssText='width:100%;margin-top:6px'; f.appendChild(n1);
    const n2=hpSecretInput(document.createElement('input')); n2.id='vault-sw-new2'; n2.style.cssText='width:100%;margin-top:6px'; f.appendChild(n2);
    const r2=document.createElement('div'); r2.className='row'; r2.style.marginTop='6px'; const go=document.createElement('button'); go.type='button'; go.className='b pri'; go.id='btn-vt-sw-go'; r2.appendChild(go); const cn=document.createElement('button'); cn.type='button'; cn.className='b'; cn.id='btn-vt-sw-cancel'; r2.appendChild(cn); f.appendChild(r2);
    const ms=E('vault-msg'); card.insertBefore(row,ms); card.insertBefore(f,ms);
    let mode=''; const open=m=>{ mode=m; f.style.display='block'; E('vault-msg').textContent=''; const toPw=m!=='prf'; cur.style.display=pk?'none':'block'; n1.style.display=toPw?'block':'none'; n2.style.display=toPw?'block':'none'; nt.textContent=(pk?T('vt_sw_cur_pk')+' ':'')+T('vt_sw_note'); cur.value=''; n1.value=''; n2.value=''; (pk?(toPw?n1:go):cur).focus(); };
    E('btn-vt-sw-pk').onclick=()=>open('prf'); E('btn-vt-sw-pw').onclick=()=>open('pw'); E('btn-vt-sw-topw').onclick=()=>open('pw'); cn.onclick=()=>{ f.style.display='none'; mode=''; };
    let busy=false; go.onclick=()=>{ if(busy||!mode) return; const toPw=mode!=='prf', a=n1.value, b=n2.value, msg=t=>{ E('vault-msg').textContent=t||''; };
      if(toPw){ if(a.length<HP_PW_MIN){ msg(T('vt_e_pwshort')); return; } if(a!==b){ msg(T('vt_e_pwdiff')); return; } }
      busy=true; go.disabled=true; msg('');
      hpVaultSwitch(mode,toPw?a:undefined,pk?undefined:cur.value).then(was=>{ cur.value=''; n1.value=''; n2.value=''; f.style.display='none'; mode='';
        msg(T(!toPw?'vt_sw_ok_pk':(was==='pw'?'vt_sw_ok_pw2':'vt_sw_ok_pw'))+(was==='prf'?' '+T('vt_sw_oldpk'):'')+(toPw?' '+T('vt_pw_nosave'):'')); try{ hpVaultUi(); }catch(e){} })
        .catch(e=>{ try{ hpLog('守り方を替えられない '+(e&&e.name||'')+' '+(e&&e.message||'')); }catch(x){} msg(e&&e.hpv==='swlocked'?T('vt_e_sw_locked'):T(hpVaultWhy(e))); }).then(()=>{ busy=false; go.disabled=false; }); };
    E('btn-vt-sw-go').textContent=T('btn_vt_sw_go'); E('btn-vt-sw-cancel').textContent=T('btn_vt_sw_cancel'); }
  row.style.display=on?'':'none'; if(!on) E('vault-sw-wrap').style.display='none';
  E('btn-vt-sw-pk').style.display=on&&!pk?'':'none'; E('btn-vt-sw-pw').style.display=on&&!pk?'':'none'; E('btn-vt-sw-topw').style.display=on&&pk?'':'none';
  E('btn-vt-sw-pk').textContent=T('vt_sw_to_pk'); E('btn-vt-sw-pw').textContent=T('vt_sw_pw'); E('btn-vt-sw-topw').textContent=T('vt_sw_to_pw'); E('vault-sw-cur').placeholder=T('vt_sw_cur_pw'); E('vault-sw-new1').placeholder=T('ph_vault_pw1'); E('vault-sw-new2').placeholder=T('ph_vault_pw2'); return true; }catch(e){ return false; } }
try{ if(typeof hpVaultUi==='function'&&!hpVaultUi.__sw){ const f=hpVaultUi; hpVaultUi=function(){ const r=f.apply(this,arguments); try{ hpVsUi(); }catch(e){} return r; }; hpVaultUi.__sw=1; } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ setTimeout(()=>{ try{ hpVsUi(); }catch(e){} },2500); setInterval(()=>{ try{ hpVsUi(); }catch(e){} },5000); } }catch(e){}

function hpPerfNote(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const row=document.getElementById('hs-up-row'); if(!row) return false;
  let nt=document.getElementById('hs-perf-nt'); if(!nt){ nt=document.createElement('div'); nt.id='hs-perf-nt'; nt.className='hint'; nt.style.cssText='font-size:12px;opacity:.75;margin-top:3px'; row.appendChild(nt); }
  const t=T('hs_perf_nt'); if(nt.textContent!==t) nt.textContent=t;
  const box=document.getElementById('hs-list'), tb=box&&box.querySelector('table.hstb'), hd=tb&&tb.rows[0]; if(hd){ const want=T('hs_h_perf'), tip=T('hs_perf_tip')+'\n'+T('hs_h_tip'); for(const th of hd.querySelectorAll('th')){ if(String(th.textContent||'').replace(/ [▲▼]$/,'')===want&&th.title!==tip) th.title=tip; } }
  return true; }catch(e){ return false; } }
function hpPerfWrap(){ try{ if(typeof hpHsUpCol!=='function'||hpHsUpCol.__pf) return !!(typeof hpHsUpCol==='function'&&hpHsUpCol.__pf); const f=hpHsUpCol; hpHsUpCol=function(){ const r=f.apply(this,arguments); try{ hpPerfNote(); }catch(e){} return r; }; hpHsUpCol.__pf=1; return true; }catch(e){ return false; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ const t=setInterval(()=>{ try{ if(hpPerfWrap()) clearInterval(t); }catch(e){} },500); setInterval(()=>{ try{ hpPerfNote(); }catch(e){} },5000); } }catch(e){}

function hpRpClose(){ try{ const e=document.getElementById('rp-dlg'); if(e&&e.parentNode) e.parentNode.removeChild(e); }catch(e){} }
function hpRpOpen(a,label){
  try{ if(typeof document==='undefined'||!document.createElement||!document.body) return false; hpRpClose(); const rp=hpRpData(a), S=hpRpSum(rp), mk=(t,cls,txt)=>{ const e=document.createElement(t); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
    const box=mk('div'); box.id='rp-dlg'; box.style.cssText='position:fixed;inset:0;z-index:9050;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
    const card=mk('div','card'); card.style.cssText='max-width:560px;width:100%;max-height:100%;overflow:auto;text-align:left'; card.appendChild(mk('h2','',T('rp_h')+(label?' — '+label:'')));
    const busy=!!(a&&((HP_RP_BUSY===a)||(typeof HP_UP!=='undefined'&&HP_UP&&HP_UP[a]&&HP_UP[a].st==='busy')));
    const l1=mk('div','',(rp&&S.kind!=='none')?hpRpLine(S):T(busy?'hl_up_busy':'hl_up_none')); l1.id='rp-line'; l1.style.cssText='margin:6px 0;font-weight:700;color:'+(S.low?'var(--amber)':'var(--ink)'); card.appendChild(l1);
    if(rp&&S.kind!=='none'){ const l2=mk('div','note',hpRpFacts(S)); l2.id='rp-facts'; card.appendChild(l2); const g=mk('div'); g.id='rp-chart'; g.style.cssText='margin:8px 0'; g.innerHTML=hpRpChartSvg(rp); card.appendChild(g); }
    const n=mk('div','note',T('rp_nt')); n.id='rp-nt'; card.appendChild(n);
    const row=mk('div','row'); row.style.marginTop='8px'; const b=mk('button','b',T('btn_fl_close')); b.type='button'; b.id='btn-rp-close'; b.addEventListener('click',hpRpClose); row.appendChild(b); card.appendChild(row);
    box.addEventListener('click',ev=>{ if(ev&&ev.target===box) hpRpClose(); }); box.appendChild(card); document.body.appendChild(box); return true; }catch(e){ return false; } }
function hpRpOpenUrl(u){ const h=String(u||'').replace(/^wss?:\/\//,'').replace(/:\d+$/,''); return hpRpOpen(hpRpAddrOf(u),h); }
function hpRpHlDeco(){
  try{ const tr=document.getElementById('hl-rep'); if(!tr) return false; const a=(typeof hpHlHostAddr==='function')?hpHlHostAddr():'', rp=a?hpRpData(a):null, td=tr.children&&tr.children[3];
    if(rp&&td){ const d=document.createElement('div'); d.className='rp-mini'; d.style.cssText='margin-top:4px'; d.innerHTML=(typeof hpRpMiniLab==='function')?hpRpMiniLab(rp,170,34):hpRpMini(rp,150,20);   td.appendChild(d); }
    tr.style.cursor='pointer'; tr.addEventListener('click',()=>{ let h=''; try{ h=String((typeof hpPostHost==='function'&&hpPostHost())||'').replace(/:\d+$/,''); }catch(e){} hpRpOpen(a,h); }); return true; }catch(e){ return false; } }
function hpRpAxCell(c,r){
  try{ if(!c||!r||!r.host||typeof document==='undefined') return false; const rp=hpRpData(r.host); if(!rp) return false; const S=hpRpSum(rp);
    const k=document.createElement('div'); k.style.cssText='font-size:11px;color:'+(S.low?'var(--amber)':'var(--dim)'); k.textContent=T(HP_RP_KIND[S.kind]||'rp_k_none'); c.appendChild(k);
    const d=document.createElement('div'); d.className='rp-mini'; d.style.cssText='margin-top:2px'; d.innerHTML=hpRpMini(rp,64,16); c.appendChild(d);
    c.style.cursor='pointer'; c.addEventListener('click',()=>{ hpRpOpen(r.host,(typeof hpAxHost==='function'&&hpAxHost(r.url))||r.dom||''); }); return true; }catch(e){ return false; } }
try{ if(typeof hpBmBoxLines==='function'&&!hpBmBoxLines.__rp){ const f=hpBmBoxLines; hpBmBoxLines=Object.assign(function(b,bw){ return hpRpBoxLines(b,bw,f.apply(this,arguments)); },f,{__rp:1}); } }catch(e){}
try{ if(typeof hpBmGo==='function'&&!hpBmGo.__rp){ const f=hpBmGo; hpBmGo=Object.assign(function(go,k){ if(go==='rep') return hpRpOpenUrl(k)?'rep':''; return f.apply(this,arguments); },f,{__rp:1}); } }catch(e){}
try{ if(typeof HP_HL_LABEL!=='undefined'&&HP_HL_LABEL&&!HP_HL_LABEL.rep) HP_HL_LABEL.rep='hl_i_rep'; }catch(e){}
try{ if(typeof hpHlEval==='function'&&!hpHlEval.__rp){ const f=hpHlEval; hpHlEval=Object.assign(function(key,now){ const E=f.apply(this,arguments); try{ const it=hpRpHlItem(now); if(it&&E&&Array.isArray(E.items)){ const k=E.items.findIndex(x=>x.k==='up'); E.items.splice(k>=0?k+1:E.items.length,0,it); E.badAll=E.items.filter(x=>x.st==='bad').length; E.okN=E.items.filter(x=>x.st==='ok').length; } }catch(e){} return E; },f,{__rp:1}); } }catch(e){}
try{ if(typeof hpHlUi==='function'&&!hpHlUi.__rp){ const f=hpHlUi; hpHlUi=Object.assign(function(){ const v=f.apply(this,arguments); try{ if(v==='drawn') hpRpHlDeco(); }catch(e){} return v; },f,{__rp:1}); } }catch(e){}
try{ if(typeof hpHlTick==='function'&&!hpHlTick.__rp){ const f=hpHlTick; hpHlTick=Object.assign(function(now){ const v=f.apply(this,arguments); try{ hpRpKick(now); }catch(e){} return v; },f,{__rp:1}); } }catch(e){}

try{ if(typeof hpMoveUi==='function'&&!hpMoveUi.__af){ const f=hpMoveUi; hpMoveUi=Object.assign(function(){ const v=f.apply(this,arguments); try{ if(typeof hpAfUi==='function') hpAfUi(); }catch(e){} return v; },f,{__af:1}); } }catch(e){}

const HP_MG_TTL=86400e3, HP_MG_GAP=15*60e3, HP_MG_KEEP=3*86400e3, HP_MG_SKIP=3600e3, HP_MG_FIN=86400e3, HP_MG_RMGAP=60e3, HP_MG_TICK=5000, HP_MG_VISGAP=60e3;
let HP_MG_BUSY=false, HP_MG_ERR='', HP_MG_PV=null, HP_MG_KEY='', HP_MG_SENT0=false;
function hpMgHere(){ try{ return typeof location!=='undefined'&&/^(www\.)?handpost\.page$/.test(String(location.hostname||'')); }catch(e){ return false; } }
function hpMgOld(){ try{ return typeof hpOgOld==='function'&&!!hpOgOld(); }catch(e){ return false; } }
function hpMgUp(){ try{ return typeof POST!=='undefined'&&!!POST&&!!POST.up&&!POST.notOwner; }catch(e){ return false; } }
function hpMgDevs(){ return (typeof ID!=='undefined'&&ID&&Array.isArray(ID.devs))?ID.devs:[]; }
function hpMgD10(d){ return String(d||'').slice(0,10)+'…'; }

function hpMgOnReq(r){
  const L=(typeof HP_LINK!=='undefined')?HP_LINK:null, q=L&&L.req; if(!q||!r||q.dev!==r.fromDev||q.site!==undefined) return '';
  let o=null; try{ o=JSON.parse(r.body); }catch(e){}
  q.site=(o&&o.site==='handpost.page')?'handpost.page':''; q.mv=!!(q.site&&hpMgOld()&&hpIsMain());
  if(q.mv){ hpLog('移る手順：新しい場所（handpost.page）の端末から連携の申し込みが届いた。追加すると、その端末が管理用の端末になる'); try{ hpLinkUi(); }catch(e){} }
  return q.mv?'mv':(q.site||'-'); }
function hpMgStart(q,h){
  if(!ID||!hpIsMain()||!q||!q.dev) return false;
  const me=String((typeof POST!=='undefined'&&POST&&POST.pub)||'');
  const old=[me].concat(hpMgDevs().map(d=>d&&d.dev).filter(d=>d&&d!==q.dev)).filter((d,i,a)=>/^ed[0-9a-f]{64}$/.test(d)&&a.indexOf(d)===i).slice(0,8);
  ID.ogMv={ dev:q.dev, label:String(q.label||'').slice(0,32), at:Date.now(), old:old, h:h?1:0, n:0, last:0 }; saveID();
  hpLog('移る手順：新しい場所の端末を追加した。管理用の端末の切り替えと過去の手紙を送る（端末 '+hpMgD10(q.dev)+'）');
  HP_MG_SENT0=true; Promise.resolve(hpMgOffer('追加した直後')).catch(()=>{}); try{ hpMgShow(); }catch(e){}
  return true; }
async function hpMgOffer(why){
  const M=ID&&ID.ogMv; if(!M||M.stop||HP_MG_BUSY) return 0;
  if(!hpIsMain()||(typeof hpKillMe==='function'&&hpKillMe())||!hpMgUp()) return 0;
  if(!hpMgDevs().some(d=>d&&d.dev===M.dev)){ delete ID.ogMv; saveID(); hpLog('移る手順：切り替えの先の端末が一覧に無いので、送るのをやめた'); return 0; }
  if(!hpPaperP()||!hpPaperFits()){ if(M.err!=='nopaper'){ M.err='nopaper'; saveID(); hpLog('移る手順：紙のバックアップが無いので、管理用の端末を自動で切り替えられない'); } return 0; }
  HP_MG_BUSY=true;
  try{
    const ts=Date.now(), sig=await edSign(hpMvMsg(ID.address,M.dev,ts));
    const body={ v:1, type:'mvoffer', ts:ts, sig:sig, paper:ID.paper, paperOk:Number(ID.paperOk)||0, invites:Array.isArray(ID.invites)?ID.invites:[], label:hpDevLabelGuess(), og:1, old:M.old, h:M.h?1:0 };
    const n=await hpSibPut(body,[M.dev]);
    if(n>0){ M.n=(Number(M.n)||0)+1; M.last=ts; delete M.err; saveID(); hpLog('移る手順：管理用の端末の切り替えを送った（端末 '+hpMgD10(M.dev)+'・'+M.n+' 回目）'); }
    return n; }
  catch(e){ hpLog('移る手順：管理用の端末の切り替えを送れない（'+((e&&e.message)||e)+'）'); return -1; }
  finally{ HP_MG_BUSY=false; } }
function hpMgSeen(){
  const M=ID&&ID.ogMv; if(!M||M.stop||!hpIsMain()) return false; if(Date.now()-(Number(M.last)||0)<HP_MG_VISGAP) return false;
  HP_MG_SENT0=false; Promise.resolve(hpMgTick()).catch(()=>{}); return true; }

async function hpMgOfferIn(o,r){
  const drop=w=>{ hpLog('移る手順：切り替えを捨てた（'+w+'）'); return true; };
  if(!hpIsChild()) return drop('この端末はつないだ端末でない');
  const L=ID.link; if(!L.main||r.fromDev!==L.main.dev) return drop('今の管理用の端末からでない');
  if(hpMgOld()) return drop('この端末も前の場所にある');
  const now=Date.now(), ts=Number(o.ts);
  if(!(ts>0)||now-ts>HP_MG_TTL||ts>now+HP_MV_SKEW) return drop('期限切れ');
  if(!(await hpMvSigOk({dev:L.dev,ts:ts,sig:o.sig}))) return drop('署名が合わない');
  if(!/^[0-9a-f]{32}$/.test(String(o.paper||''))) return drop('形が違う');
  let pub=''; try{ pub=hpPaperMaster(hpBytes(o.paper)).pub; }catch(e){}
  if(pub!==ID.publicKey) return drop('紙がこのアカウントのものでない');
  const old=(Array.isArray(o.old)?o.old:[]).filter((d,i,a)=>typeof d==='string'&&/^ed[0-9a-f]{64}$/.test(d)&&d!==L.dev&&a.indexOf(d)===i).slice(0,8);
  HP_MV_IN={ ts:ts, sig:o.sig, paper:o.paper, paperOk:Number(o.paperOk)||0, invites:Array.isArray(o.invites)?o.invites:[], label:String(o.label||'').slice(0,32), exp:ts+HP_MG_TTL, og:1 };
  const prev=ID.ogIn; ID.ogIn={ from:r.fromDev, at:(prev&&prev.from===r.fromDev&&Number(prev.at))||now, old:old, h:o.h?1:0, ts:ts }; saveID();
  hpLog('移る手順：前の場所の管理用の端末から切り替えが届いた（前の場所の端末 '+old.length+' 台）');
  try{ renderDevices(); }catch(e){}
  Promise.resolve(hpMgTake('届いた')).catch(()=>{}); try{ hpMgShow(); }catch(e){}
  return true; }
async function hpMgTake(why){
  const M=(typeof HP_MV_IN!=='undefined')?HP_MV_IN:null; if(!M||!M.og||!(M.exp>Date.now())||!ID||!hpIsChild()) return '';
  if(!hpVaultOn()) return 'vault';
  if(!hpMgUp()) return 'post';
  if((typeof HP_MV_BUSY!=='undefined'&&HP_MV_BUSY)||HP_MG_BUSY) return 'busy';
  if(HP_MG_ERR&&why==='見回り') return 'err';
  const I=ID.ogIn||{}; HP_MG_BUSY=true; let ok=false;
  try{ await hpMvTake(M); ok=true; HP_MG_ERR=''; }
  catch(e){ HP_MG_ERR=(typeof hpErrShow==='function')?hpErrShow(e):String((e&&e.message)||e); hpLog('移る手順：管理用の端末に切り替えられない（'+((e&&e.message)||e)+'）'); }
  finally{ HP_MG_BUSY=false; }
  if(!ok){ try{ hpMgShow(); }catch(e){} return 'err'; }
  ID.ogNew={ from:String(I.from||''), old:Array.isArray(I.old)?I.old:[], h:I.h?1:0, at:Date.now(), rm:0, hist:0, th:-1 }; delete ID.ogIn; saveID();
  hpLog('移る手順：この端末が管理用の端末になった');
  try{ hpMgShow(); }catch(e){}
  return 'ok'; }
function hpMgHistAt(dev){ try{ const H=ID&&ID.ogHist; return (dev&&H&&typeof H==='object'&&!Array.isArray(H))?(Number(H[dev])||0):0; }catch(e){ return 0; } }
function hpMgHistNote(dev){
  try{ if(!ID||!dev||(!ID.ogIn&&!ID.ogNew&&!(hpMgHere()&&hpIsChild()))) return false; const H=(ID.ogHist&&typeof ID.ogHist==='object'&&!Array.isArray(ID.ogHist))?ID.ogHist:{};
    H[dev]=Date.now(); { const ks=Object.keys(H).filter(k=>k!==dev).sort((a,b)=>H[a]-H[b]); while(Object.keys(H).length>8&&ks.length) delete H[ks.shift()]; } ID.ogHist=H; const from=(ID.ogNew&&ID.ogNew.from)||(ID.ogIn&&ID.ogIn.from)||''; if(ID.ogNew&&ID.ogNew.from===dev) ID.ogNew.hist=H[dev]; saveID();
    if(dev===from) hpLog('移る手順：前の場所の端末から過去の手紙を受け取り終えた'); try{ hpMgShow(); }catch(e){} return true; }catch(e){ return false; } }
function hpMgHistOk(N){ return !!(N&&(!N.h||N.hist||N.skip||hpMgHistAt(N.from))); }
async function hpMgThumbs(){ let n=0; try{ for(const c of contacts()){ for(const x of histLoad(c.address)){ const it=x&&(x.img||x.file); if(!it||!it.id) continue; let b=null; try{ b=await blobGet(it.id); }catch(e){} if(!b) n++; } } }catch(e){} return n; }
async function hpMgRemove(){
  const N=ID&&ID.ogNew; if(!N||N.rm||!hpIsMain()) return '';
  if(!hpMgHistOk(N)) return 'hist';
  if(!hpMgUp()) return 'post';
  if(HP_MG_BUSY||(typeof HP_RM!=='undefined'&&HP_RM)) return 'busy';
  if(N.rmTry&&Date.now()-N.rmTry<HP_MG_RMGAP) return 'wait';
  const me=String((typeof POST!=='undefined'&&POST&&POST.pub)||''), left=(Array.isArray(N.old)?N.old:[]).filter(d=>d&&d!==me&&hpMgDevs().some(x=>x&&x.dev===d));
  if(left.length){ HP_MG_BUSY=true;
    try{ await hpDevRemove(left[0]); delete N.rmTry; saveID(); hpLog('移る手順：前の場所の端末を外した（端末 '+hpMgD10(left[0])+'・残り '+(left.length-1)+' 台）'); }
    catch(e){ N.rmTry=Date.now(); saveID(); hpLog('移る手順：前の場所の端末を外せない（'+((e&&e.message)||e)+'。1 分後にもう一度）'); }
    finally{ HP_MG_BUSY=false; }
    try{ hpMgShow(); }catch(e){} return 'rm'; }
  N.rm=Date.now(); saveID(); let th=0; try{ th=await hpMgThumbs(); }catch(e){} N.th=th; saveID();
  hpLog('移る手順：前の場所の端末をすべて外した'+(th>0?'（写真・ファイル '+th+' 件は見本だけ）':''));
  try{ hpMgShow(); }catch(e){} return 'done'; }
function hpMgFin(){
  const N=ID&&ID.ogNew; if(!N||!N.rm||N.fin||!HP_MG_PV) return false;
  try{ if(HP_MG_PV.old||typeof POST==='undefined'||!POST||HP_MG_PV.url!==String(POST.url||'')) return false; }catch(e){ return false; }
  N.fin=Date.now(); saveID(); hpLog('移る手順：郵便受けは新しい版。移り終えた'); try{ hpMgShow(); }catch(e){} return true; }
async function hpMgTick(){
  let r='';
  try{ if(ID){
    const M=ID.ogMv;
    if(M&&hpIsMain()&&!M.stop){ const now=Date.now(); if(now-Number(M.at)>HP_MG_KEEP){ M.stop=1; saveID(); hpLog('移る手順：3 日たったので、切り替えを送るのをやめた'); }
      else if(hpMgUp()&&(!HP_MG_SENT0||now-(Number(M.last)||0)>=HP_MG_GAP)){ const first=!HP_MG_SENT0; HP_MG_SENT0=true; await hpMgOffer(first?'開いたとき':'15 分ごと'); r='offer'; } }
    if(typeof HP_MV_IN!=='undefined'&&HP_MV_IN&&HP_MV_IN.og){ const t=await hpMgTake('見回り'); if(t) r=r||('take '+t); }
    if(ID.ogNew&&hpIsMain()){ const x=await hpMgRemove(); if(x) r=r||('rm '+x); hpMgFin(); } } }catch(e){}
  try{ hpMgShow(); }catch(e){}
  return r; }

function hpMgView(){ try{ if(!ID) return ''; if(hpMgOld()) return (hpIsMain()||ID.ogDone)?'old':''; if(ID.ogIn) return 'new';
  const N=ID.ogNew; if(N&&!N.shut&&(!N.fin||Date.now()-N.fin<HP_MG_FIN)) return 'new'; return ''; }catch(e){ return ''; } }
function hpMgHistOld(dev){
  if(!dev) return {st:'todo',n:0};
  let res=false, prog=false, n=0;
  try{ const m=(typeof hpShMap==='function')?hpShMap():{}; res=!!m[dev]; }catch(e){}
  try{ const P=(typeof hpSpLoad==='function')?hpSpLoad():{}; prog=!!(P[dev]&&P[dev].p&&typeof P[dev].p==='object'&&Object.keys(P[dev].p).length); }catch(e){}
  try{ const x=(typeof HP_HIST_TX!=='undefined'&&HP_HIST_TX)?HP_HIST_TX[dev]:null; if(x&&x.st==='send'){ prog=true; n=Number(x.n)||0; } }catch(e){}
  return (res||prog)?{st:'now',n:n}:{st:'done',n:0}; }
function hpMgModel(v){
  const S=[], st=(t,s,o)=>Object.assign({t:t,st:s,notes:[],btns:[]},o||{});
  if(v==='old'){
    const M=ID.ogMv, D=ID.ogDone, dev=(M&&M.dev)||(D&&D.to)||'', h=M?M.h:(D?D.h:1);
    const s1=st(T('mg_s1_old'),(M||D)?'done':'now'); if(s1.st==='now'){ const L=(typeof HP_LINK!=='undefined')?HP_LINK:null;
      if(L&&!L.done) s1.notes.push(T('mg_n1c')); else if(!hpMgOpened()){ s1.notes.push(T('mg_n1_old')); s1.btns.push({a:'open',k:'btn_og_open',pri:1}); } else { s1.notes.push(T('mg_n1b')); s1.btns.push({a:'link',k:'btn_link_start',pri:1}); } }
    const s3=st(T('mg_s3'),D?'done':(M?'now':'todo')); if(s3.st==='now') s3.notes.push(T(M.err==='nopaper'?'mg_n_nopaper':'mg_n3_old'));
    let s4; if(!M&&!D) s4=st(T('mg_s4'),'todo'); else if(!h) s4=st(T('mg_s4'),'none'); else { const x=hpMgHistOld(dev); s4=st(T('mg_s4'),x.st); if(x.st==='now') s4.notes.push(x.n?TF('mg_n4_old_send',{n:x.n}):T('mg_n4_old_wait')); }
    S.push(s1, st(T('mg_s2_old'),D?'done':'there'), s3, s4, st(T('mg_s5'),'there'), st(T('mg_s6'),'there'));
    return {v:v, lead:T(D?'mg_lead_old_moved':'mg_lead_old'), steps:S, fin:false}; }
  const I=ID.ogIn, N=ID.ogNew, from=(N&&N.from)||(I&&I.from)||'', vault=hpVaultOn();
  const histOk=N?hpMgHistOk(N):!!(I&&(!I.h||hpMgHistAt(I.from)));
  const s2=st(T('mg_s2_new'),vault?'done':'now'); if(s2.st==='now'){ s2.notes.push(T('mg_n2_new')); s2.btns.push({a:'vault',k:'btn_mg_vault',pri:1}); }
  const s3=st(T('mg_s3_new'),N?'done':(vault?'now':'todo'));
  if(s3.st==='now'){ if(HP_MG_ERR){ s3.notes.push(TF('mg_n3_err',{err:HP_MG_ERR})); s3.btns.push({a:'retry',k:'btn_mg_retry',pri:1}); } else s3.notes.push(T((typeof HP_MV_IN!=='undefined'&&HP_MV_IN&&HP_MV_IN.og)?'mg_n3_take':'mg_n3_wait')); }
  const s4=st(T('mg_s4'),(N&&!N.h)||(I&&!I.h)?'none':(histOk?'done':'now'));
  if(s4.st==='now'){ s4.notes.push(T('mg_n4_new')); if(N&&Date.now()-Number(N.at)>HP_MG_SKIP){ s4.notes.push(T('mg_n4_skip')); s4.btns.push({a:'skip',k:'btn_mg_skip'}); } }
  const s5=st(T('mg_s5'),(N&&N.rm)?'done':((N&&histOk)?'now':'todo')); if(s5.st==='now') s5.notes.push(T('mg_n5_now')); if(s5.st==='done'&&N.th>0) s5.notes.push(TF('mg_n5_th',{n:N.th}));
  let s6=st(T('mg_s6'),(N&&N.fin)?'done':((N&&N.rm)?'now':'todo'));
  if(s6.st==='now'){ let cur=''; try{ cur=String((typeof POST!=='undefined'&&POST&&POST.url)||''); }catch(e){} const go=()=>{ s6.notes.push(T('mg_n6_lt')); s6.btns.push({a:'move',k:'btn_mg_move',pri:1}); s6.btns.push({a:'later',k:'btn_mg_later'}); };
    if(HP_MG_PV&&HP_MG_PV.url===cur){ if(HP_MG_PV.old){ s6.notes.push(T('mg_n6_now')); go(); } } else if(typeof hpMgOff==='function'&&hpMgOff()){ s6.notes.push(T('mg_n6_off')); go(); } else s6.notes.push(T('mg_n6_chk')); }
  S.push(st(T('mg_s1_new'),'done'), s2, s3, s4, s5, s6);
  const fin=!!(N&&N.fin); return {v:v, lead:T(fin?'mg_lead_fin':'mg_lead_new'), steps:S, fin:fin, btns:fin?[{a:'close',k:'btn_close'}]:[]}; }
function hpMgAct(a){ try{
  if(a==='open'){ try{ localStorage.setItem('p2p_mgopen',String(Date.now())); }catch(e){} try{ window.open((typeof HP_OG_URL!=='undefined'?HP_OG_URL:'https://handpost.page/')+'#mv','_blank','noopener'); }catch(e){} try{ hpMgShow(); }catch(e){} return a; }
  if(a==='link'){ try{ if(typeof hpGoCard==='function') hpGoCard('dev-card'); }catch(e){} try{ const b=document.getElementById('btn-link-start'); if(b&&!b.disabled&&typeof hpLinkStartBtn==='function') hpLinkStartBtn(b); }catch(e){} return a; }
  if(a==='vault'){ try{ if(typeof hpGoCard==='function') hpGoCard('vault-card'); }catch(e){} return a; }
  if(a==='retry'){ HP_MG_ERR=''; Promise.resolve(hpMgTake('もう一度')).catch(()=>{}); hpMgShow(); return a; }
  if(a==='skip'){ Promise.resolve(hpAsk({text:T('cf_mg_skip'),danger:true,ok:T('btn_mg_skip'),why:'待たずに進む'})).then(v=>{ if(v&&ID&&ID.ogNew){ ID.ogNew.skip=Date.now(); saveID(); hpLog('移る手順：待たずに進めた（過去の手紙を写し終えるのを待たない）'); hpMgShow(); } }).catch(()=>{}); return a; }
  if(a==='move'){ try{ HP_MG_GO=Date.now(); }catch(e){}   if(typeof hpOvGo==='function') hpOvGo(); else if(typeof hpGoCard==='function') hpGoCard('post-move'); try{ hpMgMvBand(); hpMgFlash(); }catch(e){} return a; }
  if(a==='later'){ if(ID&&ID.ogNew){ ID.ogNew.shut=Date.now(); ID.ogNew.later=1; saveID(); hpLog('移る手順：郵便受けの移設はあとにした（手順の欄を閉じた）'); } hpMgShow(); return a; }
  if(a==='back'){ try{ const t=document.getElementById('t-chat'); if(t&&t.click) t.click(); }catch(e){} try{ setTimeout(()=>{ try{ const g=document.getElementById('hp-mg'); if(g&&g.scrollIntoView) g.scrollIntoView({block:'start',behavior:'smooth'}); }catch(e){} },80); }catch(e){} return a; }
  if(a==='close'){ if(ID&&ID.ogNew){ ID.ogNew.shut=Date.now(); saveID(); } hpMgShow(); return a; }
  }catch(e){} return ''; }
function hpMgShow(){ try{
  if(typeof document==='undefined'||!document||!document.body||!document.getElementById) return '';
  const v=hpMgView(), og=document.getElementById('oldpg-note'); let n=document.getElementById('hp-mg');
  if(!v){ if(n&&n.parentNode) n.parentNode.removeChild(n); if(og&&og.style&&og.style.display==='none') og.style.display=''; HP_MG_KEY=''; try{ hpMgOgText(); }catch(e){} try{ hpMgOnbHide(); }catch(e){} return 'off'; }
  if(og&&og.style) og.style.display='none';
  const m=hpMgModel(v), key=JSON.stringify(m);
  if(!n){ n=document.createElement('div'); n.id='hp-mg'; n.style.cssText='flex:0 0 auto;margin:0 0 8px;padding:10px 12px;border:1px solid #35d1b7;border-radius:10px;background:#061a17;color:var(--ink,#e6edf6);font-size:13px;line-height:1.6';
    try{ if(document.head&&!document.getElementById('hp-mg-css')){ const st=document.createElement('style'); st.id='hp-mg-css'; st.textContent='#p-chat:not(.list-mode)>#hp-mg{display:none}'; document.head.appendChild(st); } }catch(e){}
    const pc=document.getElementById('p-chat'), bn=document.getElementById('banner');
    if(pc) pc.insertBefore(n,pc.firstChild||null); else if(bn&&bn.parentNode) bn.parentNode.insertBefore(n,bn.nextSibling); else document.body.insertBefore(n,document.body.firstChild); HP_MG_KEY=''; }
  if(key===HP_MG_KEY) return 'same';
  HP_MG_KEY=key; n.textContent='';
  const el=(tag,css,txt)=>{ const e=document.createElement(tag); if(css) e.style.cssText=css; if(txt!=null) e.textContent=txt; return e; };
  const btn=(b)=>{ const x=el('button','margin:6px 8px 0 0'); x.className=b.pri?'b pri':'b'; x.type='button'; x.textContent=T(b.k); x.setAttribute&&x.setAttribute('data-mg',b.a); x.onclick=()=>hpMgAct(b.a); return x; };
  n.appendChild(el('div','font-weight:700;color:#35d1b7',T('mg_title')));
  n.appendChild(el('div','margin:2px 0 6px',m.lead));
  const MK={done:['✓','#35d1b7'],now:['●','#e6edf6'],todo:['○','#8fa3b8'],there:['○','#8fa3b8'],none:['–','#8fa3b8']};
  m.steps.forEach((s,i)=>{ const row=el('div','display:flex;gap:6px;align-items:flex-start;margin-top:2px'+(s.st==='now'?';font-weight:600':'')+((s.st==='todo'||s.st==='there'||s.st==='none')?';color:#8fa3b8':''));
    const mk=MK[s.st]||MK.todo; row.appendChild(el('span','flex:0 0 auto;width:1.2em;text-align:center;color:'+mk[1],mk[0]));
    row.appendChild(el('span','flex:1 1 auto',String.fromCharCode(0x2460+i)+' '+s.t+(s.st==='there'?' '+T('mg_there'):(s.st==='none'?' '+T('mg_none'):''))));
    n.appendChild(row);
    if(s.notes.length||s.btns.length){ const box=el('div','margin:2px 0 4px 1.8em;font-weight:400;color:var(--ink,#e6edf6)'); for(const t of s.notes) box.appendChild(el('div','white-space:normal',t)); if(s.btns.length){ const r=el('div',''); for(const b of s.btns) r.appendChild(btn(b)); box.appendChild(r); } n.appendChild(box); } });
  if(m.btns&&m.btns.length){ const r=el('div','margin-top:6px'); for(const b of m.btns) r.appendChild(btn(b)); n.appendChild(r); }
  return v; }catch(e){ return ''; } }
function hpMgOgText(){ try{ if(typeof document==='undefined'||!document||!document.getElementById) return ''; const t=document.getElementById('oldpg-text'); if(!t) return '';
  let k='og_text'; if(!ID){ let d=null; try{ d=localStorage.getItem('p2p_ogdone'); }catch(e){} if(d) k='og_done'; } else if(hpIsChild()&&!ID.ogDone) k='og_sub';
  const s=T(k); if(t.textContent!==s) t.textContent=s; try{ hpMgOnbHide(); }catch(e){} return k; }catch(e){ return ''; } }
function hpMgLinkUi(){ try{ if(typeof document==='undefined'||!document||!document.getElementById) return ''; const w=document.getElementById('hp-link-warn'); if(!w||!w.parentNode) return '';
  let m=document.getElementById('hp-link-mv'); const L=(typeof HP_LINK!=='undefined')?HP_LINK:null, q=L&&L.req, done=!!(L&&L.done&&ID&&ID.ogMv), on=!!(q&&q.mv&&!L.busy)||done;
  if(!on){ if(m&&m.style) m.style.display='none'; return 'off'; }
  if(!m){ m=document.createElement('div'); m.id='hp-link-mv'; m.className='note'; m.style.cssText='margin-top:6px;color:#35d1b7;font-size:13px'; w.parentNode.insertBefore(m,w.nextSibling||null); }
  m.textContent=T(done?'mg_link_done':'nt_link_mv'); m.style.display=''; return done?'done':'on'; }catch(e){ return ''; } }

try{ if(typeof hpLinkOnReq==='function'&&!hpLinkOnReq.__mg){ const f=hpLinkOnReq; hpLinkOnReq=Object.assign(async function(r){ const v=await f.apply(this,arguments); try{ hpMgOnReq(r); }catch(e){} return v; },f,{__mg:1}); } }catch(e){}
try{ if(typeof hpLinkApprove==='function'&&!hpLinkApprove.__mg){ const f=hpLinkApprove; hpLinkApprove=Object.assign(async function(){ const L=(typeof HP_LINK!=='undefined')?HP_LINK:null, q=L&&L.req, mv=!!(q&&q.mv&&hpIsMain()), h=!(L&&L.hist===false); const v=await f.apply(this,arguments); if(v===true&&mv){ try{ hpMgStart(q,h); }catch(e){} } return v; },f,{__mg:1}); } }catch(e){}
try{ if(typeof hpLinkUi==='function'&&!hpLinkUi.__mg){ const f=hpLinkUi; hpLinkUi=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpMgLinkUi(); }catch(e){} try{ hpMgJoinUi(); }catch(e){} return v; },f,{__mg:1}); } }catch(e){}
try{ if(typeof hpAsk==='function'&&!hpAsk.__mg){ const f=hpAsk; hpAsk=Object.assign(function(o){ try{ if(o&&typeof o==='object'&&o.text===T('ask_link')&&typeof HP_LINK!=='undefined'&&HP_LINK&&HP_LINK.req&&HP_LINK.req.mv) o=Object.assign({},o,{text:T('ask_link_mv')}); }catch(e){} return f.call(this,o); },f,{__mg:1}); } }catch(e){}
try{ if(typeof hpMvOfferIn==='function'&&!hpMvOfferIn.__mg){ const f=hpMvOfferIn; hpMvOfferIn=Object.assign(async function(o,r){ if(o&&o.og===1) return await hpMgOfferIn(o,r); return await f.apply(this,arguments); },f,{__mg:1}); } }catch(e){}
try{ if(typeof hpMvDemote==='function'&&!hpMvDemote.__mg){ const f=hpMvDemote; hpMvDemote=Object.assign(async function(main,s){ const M=ID&&ID.ogMv; const v=await f.apply(this,arguments);
  try{ if(M&&ID&&main&&main.dev===M.dev){ ID.ogDone={ to:M.dev, label:M.label||'', at:Date.now(), h:M.h?1:0 }; delete ID.ogMv; saveID(); hpLog('移る手順：新しい場所の端末が管理用の端末になった（この端末はふつうの端末になった）'); } else if(M&&ID&&ID.ogMv){ delete ID.ogMv; saveID(); } }catch(e){}
  try{ hpMgShow(); }catch(e){} return v; },f,{__mg:1}); } }catch(e){}
try{ if(typeof hpMvBox==='function'&&!hpMvBox.__mg){ const f=hpMvBox; hpMvBox=Object.assign(function(card){ const M=(typeof HP_MV_IN!=='undefined')?HP_MV_IN:null; if(M&&M.og){ HP_MV_IN=null; try{ return f.apply(this,arguments); }finally{ if(HP_MV_IN===null) HP_MV_IN=M; } } return f.apply(this,arguments); },f,{__mg:1}); } }catch(e){}
try{ if(typeof sibHistDone==='function'&&!sibHistDone.__mg){ const f=sibHistDone; sibHistDone=Object.assign(function(id,o){ const v=f.apply(this,arguments); try{ hpMgHistNote(id); }catch(e){} return v; },f,{__mg:1}); } }catch(e){}
try{ if(typeof hpOvOnClaim==='function'&&!hpOvOnClaim.__mg){ const f=hpOvOnClaim; hpOvOnClaim=Object.assign(function(o){ try{ if(o&&o.ok==='claim'&&typeof POST!=='undefined'&&POST&&POST.url) HP_MG_PV={ url:String(POST.url), old:typeof o.pv!=='string', at:Date.now() }; }catch(e){} return f.apply(this,arguments); },f,{__mg:1}); } }catch(e){}
try{ if(typeof hpOvDue==='function'&&!hpOvDue.__mg){ const f=hpOvDue; hpOvDue=Object.assign(function(){ if(hpMgView()) return false; return f.apply(this,arguments); },f,{__mg:1}); } }catch(e){}
try{ if(typeof hpOgShow==='function'&&!hpOgShow.__mg){ const f=hpOgShow; hpOgShow=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpMgOgText(); }catch(e){} try{ hpMgShow(); }catch(e){} return v; },f,{__mg:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ setTimeout(()=>{ try{ Promise.resolve(hpMgTick()).catch(()=>{}); }catch(e){} },3000); setInterval(()=>{ try{ Promise.resolve(hpMgTick()).catch(()=>{}); }catch(e){} },HP_MG_TICK);
  document.addEventListener('visibilitychange',()=>{ try{ if(document.visibilityState==='visible') hpMgSeen(); }catch(e){} }); try{ window.addEventListener('focus',()=>{ try{ hpMgSeen(); }catch(e){} }); }catch(e){} } }catch(e){}

function hpMgOpened(){ try{ return Number(localStorage.getItem('p2p_mgopen'))>0; }catch(e){ return false; } }
function hpMgOnbHide(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const b=document.getElementById('p2p-onboard'); if(!b) return '';
  let gone=false; try{ gone=!ID&&hpMgOld()&&!!localStorage.getItem('p2p_ogdone'); }catch(e){} if(gone){ if(b.style&&b.style.display!=='none') b.style.display='none'; return 'hide'; } return ''; }catch(e){ return ''; } }
let HP_MG_JOIN=false;
try{ if(typeof location!=='undefined'&&hpMgHere()){ if(String(location.hash||'')==='#mv'){ HP_MG_JOIN=true; try{ sessionStorage.setItem('p2p_mgjoin','1'); }catch(e){} try{ if(typeof history!=='undefined'&&history.replaceState) history.replaceState(null,'',String(location.pathname||'/')+String(location.search||'')); }catch(e){} }
    else { try{ HP_MG_JOIN=sessionStorage.getItem('p2p_mgjoin')==='1'; }catch(e){} }
    let has=false; try{ has=!!(localStorage.getItem('p2p_id')||localStorage.getItem('p2p_vault')); }catch(e){}
    if(HP_MG_JOIN&&!has&&typeof window!=='undefined') window.HP_ONB_STEP='link'; } }catch(e){}
function hpMgJoinUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const jc=document.getElementById('linkjoin-card'); if(!jc) return '';
  const on=!!(HP_MG_JOIN&&!ID), sc=document.getElementById('hp-join-scan'), nt=jc.querySelector?jc.querySelector('[data-i18n="nt_linkjoin"]'):null, ms=document.getElementById('hp-join-more-s'), bt=document.getElementById('hp-join-btn'); let m=document.getElementById('hp-join-mv');
  if(!on){ if(m&&m.style) m.style.display='none'; return 'off'; }
  const J=(typeof HP_JOIN!=='undefined')&&!!HP_JOIN;
  if(sc&&sc.style) sc.style.display='none'; if(nt&&nt.style) nt.style.display='none'; if(ms&&ms.style) ms.style.display='none'; if(bt&&bt.className!=='b pri') bt.className='b pri';
  if(!m){ m=document.createElement('div'); m.id='hp-join-mv'; m.className='note'; m.style.cssText='margin-top:6px;color:#35d1b7'; const more=document.getElementById('hp-join-more'); if(more&&more.parentNode===jc) jc.insertBefore(m,more); else jc.appendChild(m); }
  const t=T('mg_join'); if(m.textContent!==t) m.textContent=t; m.style.display=J?'none':''; return J?'wait':'on'; }catch(e){ return ''; } }
try{ if(typeof p2pOnboard==='function'&&!p2pOnboard.__mg){ const f=p2pOnboard; p2pOnboard=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpMgOnbHide(); }catch(e){} try{ hpMgJoinUi(); }catch(e){} return v; },f,{__mg:1}); } }catch(e){}

function hpMgOwnDemote(){ try{ const D=ID&&ID.ogDone; return !!(D&&D.to&&Date.now()-(Number(D.at)||0)<10*60e3); }catch(e){ return false; } }
try{ if(typeof hpNote==='function'&&!hpNote.__mg){ const f=hpNote; hpNote=Object.assign(function(kind){ if(kind==='mvdemote'&&hpMgOwnDemote()) return false; return f.apply(this,arguments); },f,{__mg:1}); } }catch(e){}

let HP_HS_LATER=false;
function hpHsLaterShow(){ HP_HS_LATER=true; try{ if(typeof document==='undefined'||!document.getElementById) return false; const st=document.getElementById('hs-st'); if(!st||!st.parentNode) return false;
  hpHsSt(TF('hs_later',{t:(typeof fmtTS==='function'?fmtTS(HP_HOSTS.at):'')})); let b=document.getElementById('btn-hs-later');
  if(!b){ b=document.createElement('button'); b.id='btn-hs-later'; b.className='b'; b.type='button'; b.style.cssText='font-size:13px;margin:4px 0'; b.addEventListener('click',()=>{ hpHsLaterGo(); }); st.parentNode.insertBefore(b,st.nextSibling||null); }
  b.textContent=T('btn_hs_later'); b.style.display=''; return true; }catch(e){ return false; } }
function hpHsLaterGo(){ HP_HS_LATER=false; try{ HP_HS_N=HP_HS_SHOW; hpHsFltDraw(); }catch(e){} return Promise.resolve(hpHsDraw()).catch(()=>{}); }
try{ if(typeof hpHsDraw==='function'&&!hpHsDraw.__f6){ const f=hpHsDraw; hpHsDraw=Object.assign(async function(){ HP_HS_LATER=false; try{ const b=document.getElementById('btn-hs-later'); if(b&&b.style) b.style.display='none'; }catch(e){} const r=await f.apply(this,arguments); try{ hpHsUpSync(); }catch(e){} return r; },f,{__f6:1}); } }catch(e){}

const HP_UP_HOST_MAX=150e3; let HP_UP_LOCK=Promise.resolve(); const HP_UP_SUMQ={};
function hpUpSumSave(h,r){ try{ if(!h||!h.addr||!r||r.st!=='ok') return false; const o={st:'ok',pct:r.pct,have:r.have,n:r.n,last:r.last||null,reads:r.reads,fails:r.fails,saved:Date.now()}; Promise.resolve(HP_HS_CACHE.put('upsum:'+h.addr,o)).catch(()=>{}); return true; }catch(e){ return false; } }
try{ if(typeof hpUpHost==='function'&&!hpUpHost.__f6){ const f=hpUpHost; hpUpHost=Object.assign(async function(h,onProg){ const prev=HP_UP_LOCK; let rel=null; HP_UP_LOCK=new Promise(r=>{ rel=r; }); try{ await prev; }catch(e){}
    let to=null; try{ const r=await Promise.race([f.apply(this,arguments),new Promise((_,rej)=>{ to=setTimeout(()=>rej(new Error('time')),HP_UP_HOST_MAX); })]); try{ hpUpSumSave(h,r); }catch(e){} return r; }
    finally{ if(to) clearTimeout(to); try{ rel(); }catch(e){} setTimeout(()=>{ try{ hpHsUpSync(); }catch(e){} },0); } },f,{__f6:1}); } }catch(e){}
function hpHsUpSync(){ try{ if(typeof document==='undefined'||!document.querySelectorAll||typeof HP_HOSTS==='undefined'||!HP_HOSTS||!Array.isArray(HP_HOSTS.hosts)||typeof HP_UP==='undefined') return 0; let n=0;
  for(const tr of document.querySelectorAll('#hs-list tr[data-addr]')){ const a=tr.dataset.addr, td=tr.querySelector('td[data-up]'); if(!td) continue; const h=HP_HOSTS.hosts.find(x=>x.addr===a); if(!h) continue;
    if(!HP_UP[a]&&h.aid&&!HP_UP_SUMQ[a]){ HP_UP_SUMQ[a]=1; Promise.resolve(HP_HS_CACHE.get('upsum:'+a)).then(o=>{ if(o&&o.st==='ok'&&!HP_UP[a]){ HP_UP[a]=Object.assign({},o,{at:0}); hpHsUpSync(); try{ hpHsUpBtn(); }catch(e){} } }).catch(()=>{}); }
    const t=hpHsUpCell(h); if(td.textContent!==t){ td.textContent=t; n++; } }
  return n; }catch(e){ return 0; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function') setInterval(()=>{ try{ hpHsUpSync(); }catch(e){} },2000); }catch(e){}

function hpPayHostOf(e,acct){ try{ const x=(e&&(e.tx||e.tx_json))||{}, meta=(e&&e.meta)||{};
  if(x.Account!==acct) return (x.TransactionType==='Payment'&&x.Destination===acct)?String(x.Account||''):'';
  if(x.TransactionType==='Payment') return String(x.Destination||'');
  if(x.TransactionType==='URITokenBuy'){ for(const n of (Array.isArray(meta.AffectedNodes)?meta.AffectedNodes:[])){ const v=n&&(n.ModifiedNode||n.DeletedNode||n.CreatedNode); if(!v||v.LedgerEntryType!=='URIToken') continue; const f=v.FinalFields||v.NewFields||v.PreviousFields||{}; if(f.Issuer) return String(f.Issuer); } }
  return ''; }catch(e){ return ''; } }
try{ if(typeof hpPayParse==='function'&&!hpPayParse.__f6){ const f=hpPayParse; hpPayParse=Object.assign(function(list,acct){ const rows=f.apply(this,arguments); try{ const H={}; for(const e of (list||[])){ const x=(e&&(e.tx||e.tx_json))||{}, h=String(x.hash||(e&&e.hash)||'').toUpperCase(); if(h) H[h]=hpPayHostOf(e,acct); } for(const r of rows){ if(r&&!r.key&&H[r.hash]) r.host=H[r.hash]; } }catch(e){} return rows; },f,{__f6:1}); } }catch(e){}
function hpPayHosts(rows,px){
  const M={}, z=()=>({evr:0,xah:0,v:0,miss:0}), mk=k=>({host:k,n:0,miss:0,buy:z(),ext:z(),ref:z(),fee:z(),tot:z()}), T0=mk('*');
  for(const r of (rows||[])){ const key=String(r.host||''), m=M[key]||(M[key]=mk(key)), p=px[hpPxDay(r.at)]||{}; let rm=false; m.n++; T0.n++;
    for(const q of hpPayParts(r)){ for(const o of [m,T0]){ const c=o[q.k]; c.evr+=q.evr; c.xah+=q.xah; o.tot.evr+=q.evr; o.tot.xah+=q.xah; }
      let v=0, ok=true; if(q.evr){ if(p.evr>0) v+=q.evr*p.evr; else ok=false; } if(q.xah){ if(p.xah>0) v+=q.xah*p.xah; else ok=false; }
      for(const o of [m,T0]){ const c=o[q.k]; if(ok){ c.v+=v; o.tot.v+=v; } else { c.miss++; o.tot.miss++; } } if(!ok) rm=true; }
    if(rm){ m.miss++; T0.miss++; } }
  const a=Object.keys(M).map(k=>M[k]).sort((x,y)=>(x.host===''?1:0)-(y.host===''?1:0)||(y.tot.evr-x.tot.evr)||(y.n-x.n)||String(x.host).localeCompare(String(y.host)));
  return {list:a,total:T0}; }
function hpPayHostDraw(){ try{ if(typeof document==='undefined'||!document.getElementById) return -1; const mon=document.getElementById('pay-mon'); if(!mon||!mon.parentNode) return -1;
  let box=document.getElementById('pay-host'); if(!box){ box=document.createElement('div'); box.id='pay-host'; box.style.cssText='overflow-x:auto;margin-top:10px'; mon.parentNode.insertBefore(box,mon.nextSibling||null); }
  box.textContent=''; if(typeof HP_PAY==='undefined'||!HP_PAY||!HP_PAY.rows||!HP_PAY.rows.length) return 0;
  const cur=hpPayCur(), R=hpPayHosts(HP_PAY.rows,hpPxMap(cur)); let part=false;
  const h=document.createElement('div'); h.className='note'; h.style.cssText='color:var(--ink);font-weight:600;margin-top:4px'; h.textContent=TF('pay_hb_title',{c:cur.toUpperCase()}); box.appendChild(h);
  const tb=document.createElement('table'); tb.className='paytb'; tb.id='pay-host-tb'; const hd=document.createElement('tr');
  for(const k of ['pay_hb_box','pay_m_buy','pay_m_ext','pay_m_ref','pay_m_fee','pay_m_tot','pay_m_n']){ const th=document.createElement('th'); th.textContent=T(k); hd.appendChild(th); } tb.appendChild(hd);
  const sub=(td,t)=>{ if(!t) return; const d=document.createElement('div'); d.textContent=t; d.style.cssText='font-size:11px;color:var(--dim);white-space:nowrap'; td.appendChild(d); };
  const row=(m,label,bold)=>{ const tr=document.createElement('tr'); tr.dataset.host=m.host; const c0=document.createElement('td'); c0.textContent=label; if(bold) c0.style.fontWeight='600'; tr.appendChild(c0);
    for(const k of ['buy','ext','ref','fee','tot']){ const c=m[k], td=document.createElement('td'), any=Math.abs(c.evr)>1e-12||Math.abs(c.xah)>1e-12;
      if(!any||(c.miss&&!c.v)) td.textContent='—'; else { td.textContent=hpCurTxt(c.v,cur,c.v<0)+(c.miss?'＊':''); if(c.miss) part=true; }
      if(k==='tot'||bold) td.style.fontWeight='600'; sub(td,any?hpPayCoin(c.evr,c.xah):''); tr.appendChild(td); }
    const cn=document.createElement('td'); cn.textContent=String(m.n); if(bold) cn.style.fontWeight='600'; tr.appendChild(cn); tb.appendChild(tr); return tr; };
  for(const m of R.list){ let nm=''; if(m.host){ try{ nm=(typeof hpHostName==='function')?hpHostName(m.host):''; }catch(e){} if(!nm) nm=m.host.slice(0,10)+'…'; } else nm=T('pay_hb_acct'); row(m,nm,false); }
  const tt=row(R.total,T('pay_hb_total'),true); tt.style.borderTop='2px solid var(--line)';
  box.appendChild(tb); const nt=document.createElement('div'); nt.className='note'; nt.style.cssText='white-space:pre-line'; nt.textContent=TF('pay_hb_nt',{n:R.list.filter(m=>m.host).length})+(part?'\n'+T('pay_m_part'):''); box.appendChild(nt);
  return R.list.length; }catch(e){ return -1; } }
try{ if(typeof hpPayDrawAll==='function'&&!hpPayDrawAll.__f6){ const f=hpPayDrawAll; hpPayDrawAll=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpPayHostDraw(); }catch(e){} return v; },f,{__f6:1}); } }catch(e){}

const HP_MG_OFF_MS=20e3;
let HP_MG_DOWN=0, HP_MG_GO=0;
function hpMgOff(){ try{ const up=!!(typeof POST!=='undefined'&&POST&&POST.up); if(up){ HP_MG_DOWN=0; return false; } if(!HP_MG_DOWN) HP_MG_DOWN=Date.now(); return Date.now()-HP_MG_DOWN>=HP_MG_OFF_MS; }catch(e){ return false; } }
function hpMgFlash(){ try{ const m=document.getElementById('post-move'); if(!m||!m.style) return false; m.style.outline='2px solid #35d1b7'; m.style.outlineOffset='2px'; setTimeout(()=>{ try{ m.style.outline=''; m.style.outlineOffset=''; }catch(e){} },2500); return true; }catch(e){ return false; } }
function hpMgMvBand(){ try{ if(typeof document==='undefined'||!document||!document.getElementById) return ''; const card=document.getElementById('post-move'); if(!card) return '';
  let b=document.getElementById('hp-mg-mv'); const N=ID&&ID.ogNew, on=!!(N&&N.rm&&!N.shut&&HP_MG_GO&&hpMgView()==='new');
  if(!on){ if(b&&b.style) b.style.display='none'; return 'off'; }
  if(!b){ b=document.createElement('div'); b.id='hp-mg-mv'; b.style.cssText='margin:6px 0 8px;padding:8px 10px;border:1px solid #35d1b7;border-radius:8px;background:#061a17;color:var(--ink,#e6edf6);font-size:13px;line-height:1.6';
    const h=card.querySelector?card.querySelector('h2'):null; if(h&&h.parentNode===card) card.insertBefore(b,h.nextSibling||null); else card.insertBefore(b,card.firstChild||null); }
  const k=N.fin?'done':'band';
  if(b.getAttribute&&b.getAttribute('data-k')===k&&b.style.display!=='none') return k;
  b.textContent=''; if(b.setAttribute) b.setAttribute('data-k',k);
  const t=document.createElement('div'); t.textContent=T(N.fin?'mg_mv_done':'mg_mv_band'); b.appendChild(t);
  if(N.fin){ const x=document.createElement('button'); x.type='button'; x.className='b pri'; x.style.cssText='margin-top:6px'; x.textContent=T('btn_mg_back'); if(x.setAttribute) x.setAttribute('data-mg','back'); x.onclick=()=>hpMgAct('back'); b.appendChild(x); }
  b.style.display=''; return k; }catch(e){ return ''; } }
function hpMvDoneText(J,n,mv){
  const m=(mv&&mv.n)||0;
  if(J&&J.move&&J.move.sw){ let k=0; try{ k=(typeof hpMvSubs==='function')?hpMvSubs():0; }catch(e){} return TF('mv2_done_sw',{n:n})+(k>0?'\n'+TF('mv2_done_sw_sub',{m:k}):''); }
  return (m>0?TF('mv2_done',{n:n,m:m}):TF('mv2_done0',{n:n}))+((mv&&mv.why)?'\n'+TF('mv2_nosub',{why:mv.why}):''); }
function hpCardKey(c){ try{ return (c&&c.token&&typeof c.token.id==='string')?c.token.id+'|'+((Array.isArray(c.post)&&c.post.join(','))||''):''; }catch(e){ return ''; } }
function hpSendRace(peer,ts,k0){
  try{ const k1=hpCardKey(hpCardOf(peer)); if(!k0||!k1||k0===k1) return false;
    const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||!m.p||!m.hf||m.hf.k!=='peer') return false;
    hpLog('送っている間に名刺が新しくなった。新しい名刺で出し直す → '+nickOf(peer));
    setTimeout(()=>{ try{ hpResendPeer(peer,{kinds:['peer'],force:'now'}); }catch(e){} },0); return true; }catch(e){ return false; } }

try{ if(typeof hpSendText==='function'&&!hpSendText.__f7){ const f=hpSendText; hpSendText=Object.assign(async function(peer,text,ts){ let k0=''; try{ k0=hpCardKey(hpCardOf(peer)); }catch(e){} const v=await f.apply(this,arguments); if(v===false){ try{ hpSendRace(peer,ts,k0); }catch(e){} } return v; },f,{__f7:1}); } }catch(e){}
try{ if(typeof hpMgShow==='function'&&!hpMgShow.__f7){ const f=hpMgShow; hpMgShow=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpMgMvBand(); }catch(e){} return v; },f,{__f7:1}); } }catch(e){}
try{ if(typeof hpMoveUi==='function'&&!hpMoveUi.__f7){ const f=hpMoveUi; hpMoveUi=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpMgMvBand(); }catch(e){} return v; },f,{__f7:1}); } }catch(e){}

const HP_HELP=[
  ['hl_g0',[['hl_q0','hl_a0'],['hl_q12','hl_a12'] ]], ['hl_g1',[['hl_q1','hl_a1'],['hl_q2','hl_a2'],['hl_q3','hl_a3'],['hl_q4','hl_a4'],['hl_q5','hl_a5']]],
  ['hl_g2',[['hl_q6','hl_a6'],['hl_q7','hl_a7']]],   ['hl_g4',[['hl_q10','hl_a10'],['hl_q11','hl_a11']]], ['hl_g5',[['hl_q13','hl_a13']]]  ];
function hpHelpEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function hpHelpFig1(){
  const t=(k,x,y,o)=>'<text x="'+x+'" y="'+y+'" font-size="'+((o&&o.fs)||11)+'" fill="'+((o&&o.c)||'#e6edf6')+'" text-anchor="'+((o&&o.a)||'middle')+'"'+((o&&o.w)?' font-weight="700"':'')+' data-i18n="'+k+'">'+hpHelpEsc(T(k))+'</text>';
  const box=(x,y,w,h,c,dash)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" fill="#10233a" stroke="'+c+'" stroke-width="1.5"'+(dash?' stroke-dasharray="4 3"':'')+'/>';
  const ln=(x1,y1,x2,y2,c,m,dash)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+c+'" stroke-width="2"'+(dash?' stroke-dasharray="5 4"':'')+(m?' marker-end="url(#'+m+')"':'')+'/>';
  const G='#35d1b7', Y='#f5b85c', M='#8fa3b8';
  return '<svg class="hl-fig" viewBox="0 0 340 262" role="img" style="display:block;width:100%;max-width:440px;margin:8px auto 4px" xmlns="http://www.w3.org/2000/svg">'
    +'<defs><marker id="hl-ag" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="'+G+'"/></marker>'
    +'<marker id="hl-ay" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="'+Y+'"/></marker></defs>'
    +box(10,10,110,34,'#e6edf6')+t('hl_f_you',65,32,{w:1})+box(220,10,110,34,'#e6edf6')+t('hl_f_fr',275,32,{w:1})
    +ln(124,27,216,27,M,'',1)+t('hl_f_card',170,20,{fs:10,c:M})
    +box(10,150,130,40,G)+t('hl_f_box_you',75,175,{fs:11})+box(200,150,130,40,Y)+t('hl_f_box_fr',265,175,{fs:11})
    +t('hl_f_host',75,206,{fs:9,c:M})+t('hl_f_host',265,206,{fs:9,c:M})
    +ln(262,46,118,146,G,'hl-ag')+t('hl_f_put',224,86,{fs:10,c:G,a:'start'})
    +ln(30,148,30,48,G,'hl-ag')+t('hl_f_take',36,102,{fs:10,c:G,a:'start'})
    +ln(80,46,222,146,Y,'hl-ay')+t('hl_f_put',116,86,{fs:10,c:Y,a:'end'})
    +ln(310,148,310,48,Y,'hl-ay')+t('hl_f_take',304,102,{fs:10,c:Y,a:'end'})
    +ln(14,232,40,232,G)+t('hl_f_lg1',46,236,{fs:10,a:'start'})+ln(14,252,40,252,Y)+t('hl_f_lg2',46,256,{fs:10,a:'start'})
    +'</svg>'; }
function hpHelpFig2(){
  const t=(k,x,y,o)=>'<text x="'+x+'" y="'+y+'" font-size="'+((o&&o.fs)||11)+'" fill="'+((o&&o.c)||'#e6edf6')+'" text-anchor="'+((o&&o.a)||'middle')+'"'+((o&&o.w)?' font-weight="700"':'')+' data-i18n="'+k+'">'+hpHelpEsc(T(k))+'</text>';
  const box=(x,y,w,h,c,dash)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="8" fill="#10233a" stroke="'+c+'" stroke-width="1.5"'+(dash?' stroke-dasharray="4 3"':'')+'/>';
  const ln=(x1,y1,x2,y2,c,m,dash)=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+c+'" stroke-width="2"'+(dash?' stroke-dasharray="5 4"':'')+(m?' marker-end="url(#'+m+')"':'')+'/>';
  const G='#35d1b7', M='#8fa3b8';
  return '<svg class="hl-fig" viewBox="0 0 340 160" role="img" style="display:block;width:100%;max-width:440px;margin:8px auto 4px" xmlns="http://www.w3.org/2000/svg">'
    +'<defs><marker id="hl-ag2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="'+G+'"/></marker>'
    +'<marker id="hl-am2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="'+M+'"/></marker></defs>'
    +box(10,10,110,34,'#e6edf6')+t('hl_f_you',65,32,{w:1})+box(220,10,110,34,'#e6edf6')+t('hl_f_fr',275,32,{w:1})
    +ln(124,27,216,27,G,'hl-ag2',1)+t('hl_f2_card',170,20,{fs:10,c:G})
    +box(10,96,130,36,M,1)+t('hl_f2_old',75,119,{fs:11,c:M})+box(200,96,130,36,G)+t('hl_f2_new',265,119,{fs:11})
    +ln(144,114,196,114,G,'hl-ag2')+t('hl_f2_mv',170,108,{fs:10,c:G})
    +ln(40,94,40,48,M,'hl-am2',1)+t('hl_f2_look',75,150,{fs:9,c:M})
    +ln(265,94,265,48,G,'hl-ag2')
    +'</svg>'; }
function hpHelpUi(){ try{ if(typeof document==='undefined'||!document||!document.getElementById) return ''; const s=document.getElementById('p-help'); if(!s) return '';
  if(s.getAttribute&&s.getAttribute('data-built')==='1') return 'same';
  const P='<div style="white-space:pre-line;margin:6px 0 2px;line-height:1.7" data-i18n="';
  let h='<div class="card"><h2 data-i18n="tab_help">'+hpHelpEsc(T('tab_help'))+'</h2><div class="note" data-i18n="hl_lead">'+hpHelpEsc(T('hl_lead'))+'</div></div>';
  for(const [g,qs] of HP_HELP){
    h+='<div class="card"><h2 data-i18n="'+g+'">'+hpHelpEsc(T(g))+'</h2>';
    for(const [q,a] of qs){ const n=Number(q.slice(4));
      h+='<details class="hl-q" data-q="'+n+'"'+(n===0?' open':'')+' style="border-top:1px solid #1b2740;padding:8px 0"><summary style="cursor:pointer;font-weight:600;color:var(--teal,#35d1b7)" data-i18n="'+q+'">'+hpHelpEsc(T(q))+'</summary>';
      if(n===0) h+=hpHelpFig1()+P+a+'">'+hpHelpEsc(T(a))+'</div>'+hpHelpFig2()+P+'hl_a0b">'+hpHelpEsc(T('hl_a0b'))+'</div>';
      else h+=P+a+'">'+hpHelpEsc(T(a))+'</div>';
      h+='</details>'; }
    h+='</div>'; }
  s.innerHTML=h; if(s.setAttribute) s.setAttribute('data-built','1'); return 'built'; }catch(e){ return ''; } }
function hpHelpOpen(){ try{
  const b=document.getElementById('t-help'), s=document.getElementById('p-help'); if(!b||!s) return false;
  document.querySelectorAll('nav button').forEach(x=>x.classList.remove('on')); document.querySelectorAll('main section').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); s.classList.add('on'); hpHelpUi();
  try{ if(typeof stopScan==='function') stopScan(); }catch(e){} try{ if(typeof hpCsRefresh==='function') hpCsRefresh(); }catch(e){}
  try{ menuClose(); homeToggle(true); menuBadge(); }catch(e){} try{ if(typeof window!=='undefined'&&window.scrollTo) window.scrollTo(0,0); }catch(e){} return true; }catch(e){ return false; } }
function hpHelpMount(){ try{ if(typeof document==='undefined'||!document||!document.getElementById||!document.querySelector) return '';
  if(document.getElementById('t-help')) return 'have';
  const nav=document.querySelector('nav'), main=document.querySelector('main'); if(!nav||!main) return '';
  const day=document.getElementById('t-day'), b=document.createElement('button'); b.id='t-help'; b.type='button'; b.setAttribute('data-i18n','tab_help'); b.textContent=T('tab_help'); b.onclick=()=>{ hpHelpOpen(); };
  nav.insertBefore(b,(day&&day.parentNode===nav)?day:null);
  const s=document.createElement('section'); s.id='p-help'; main.appendChild(s); return 'made'; }catch(e){ return ''; } }
try{ if(typeof document!=='undefined'&&document&&document.getElementById){ if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',()=>{ hpHelpMount(); }); else hpHelpMount(); } }catch(e){}

const HP_CHG=[['bk36f13','chg_bk36f13'],['bk36f12','chg_bk36f12'],['bk36f11','chg_bk36f11'],['bk36f10','chg_bk36f10'],['bk36f8','chg_bk36f8'],['bk36f7','chg_bk36f7']], HP_CHG_MAX=3, HP_CHG_K='p2p_chgseen';
function hpChgSeen(){ try{ return String(localStorage.getItem(HP_CHG_K)||''); }catch(e){ return ''; } }
function hpChgList(seen){ const i=HP_CHG.findIndex(x=>x[0]===seen); if(!seen) return HP_CHG.slice(0,1); if(i<0) return HP_CHG.slice(0,HP_CHG_MAX); return HP_CHG.slice(0,Math.min(i,HP_CHG_MAX)); }
function hpChgClose(){ try{ localStorage.setItem(HP_CHG_K,HP_CHG[0][0]); }catch(e){} try{ const n=document.getElementById('hp-chg'); if(n&&n.parentNode) n.parentNode.removeChild(n); }catch(e){} return true; }
function hpChgShow(){ try{ if(typeof document==='undefined'||!document||!document.getElementById) return '';
  if(typeof ID==='undefined'||!ID) return 'noid'; if(typeof HP_REL==='undefined'||!HP_REL||HP_REL.st!=='ok') return 'rel';
  const L=hpChgList(hpChgSeen()); let n=document.getElementById('hp-chg'); if(!L.length){ if(n&&n.parentNode) n.parentNode.removeChild(n); return 'none'; }
  const key=L.map(x=>x[0]).join(); if(n&&n.getAttribute&&n.getAttribute('data-k')===key) return 'same';
  if(!n){ n=document.createElement('div'); n.id='hp-chg'; n.style.cssText='flex:0 0 auto;margin:0 0 8px;padding:10px 12px;border:1px solid #35d1b7;border-radius:10px;background:#061a17;color:var(--ink,#e6edf6);font-size:13px;line-height:1.6';
    try{ if(document.head&&!document.getElementById('hp-chg-css')){ const st=document.createElement('style'); st.id='hp-chg-css'; st.textContent='#p-chat:not(.list-mode)>#hp-chg{display:none}'; document.head.appendChild(st); } }catch(e){}
    const pc=document.getElementById('p-chat'), mg=document.getElementById('hp-mg'); if(!pc) return '';
    pc.insertBefore(n,(mg&&mg.parentNode===pc)?(mg.nextSibling||null):(pc.firstChild||null)); }
  if(n.setAttribute) n.setAttribute('data-k',key); n.textContent='';
  const el=(tag,css,txt,k)=>{ const e=document.createElement(tag); if(css) e.style.cssText=css; if(txt!=null) e.textContent=txt; if(k&&e.setAttribute) e.setAttribute('data-i18n',k); return e; };
  const num=Number(HP_REL.n)||0; n.appendChild(el('div','font-weight:700;color:#35d1b7',num?TF('chg_title',{n:num}):T('chg_title0')));
  for(const [,k] of L) n.appendChild(el('div','white-space:pre-line;margin-top:4px',T(k),k));
  const r=el('div','margin-top:6px'); const b1=el('button','margin:0 8px 0 0',T('btn_chg_help'),'btn_chg_help'); b1.className='b pri'; b1.type='button'; b1.onclick=()=>{ hpChgClose(); try{ if(typeof hpHelpOpen==='function') hpHelpOpen(); }catch(e){} };
  const b2=el('button','',T('btn_close'),'btn_close'); b2.className='b'; b2.type='button'; b2.onclick=()=>{ hpChgClose(); }; r.appendChild(b1); r.appendChild(b2); n.appendChild(r);
  return key; }catch(e){ return ''; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setInterval==='function'){ setTimeout(()=>{ try{ hpChgShow(); }catch(e){} },4000); setInterval(()=>{ try{ hpChgShow(); }catch(e){} },15e3); } }catch(e){}

