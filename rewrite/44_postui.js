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

const HP_MB_MAX=10*1024*1024, HP_MB_BODY=44000, HP_MB_GROUP=8, HP_MB_C=32000, HP_MB_KEEP=3650*86400e3  , HP_MB_MAXN=Math.ceil(HP_MB_MAX/HP_MB_C)+HP_MB_GROUP+1, HP_MB_KEY='p2p_mbrx';
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
    try{ if(hpFgOn()) hpActSet('act_ledger',{n:n}); }catch(e){} await new Promise(r=>setTimeout(r,(typeof hpJit==='function')?hpJit(every):every)); }
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
let HP_REL_SUS=0, HP_REL_NEXT=0; const HP_REL_SUS_STEPS=[20e3,20e3,30e3,30e3,60e3,60e3,120e3,120e3,120e3,120e3], HP_REL_SUS_N=HP_REL_SUS_STEPS.length+1,   HP_REL_EVERY_BAD=2*60e3;
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
async function hpRelFindMix(scr,hs,want){
  const left=new Set(scr.filter(f=>!want[f.path]||want[f.path]!==hs[f.path]).map(f=>f.path)); if(!left.size) return 0; let lo=0, L=[];
  try{ const j=await hpRelJson('releases/index.json',want); L=Array.isArray(j&&j.list)?j.list:[]; }catch(e){ return 0; }
  for(const x of L.slice(0,HP_REL_HIST_MAX)){ if(!left.size) break; try{ if(!x||!Number.isInteger(x.n)||x.n<1||!/^[0-9a-f]{64}$/.test(String(x.fp||''))) continue;
      const s=await hpRelBytes('/releases/'+x.n+'.sums',{cache:'force-cache'}); if((await hpRelSha(s))!==x.fp) continue;
      const w=hpRelSums(new TextDecoder().decode(s)); for(const p of Array.from(left)) if(w[p]&&w[p]===hs[p]){ left.delete(p); lo=lo?Math.min(lo,x.n):x.n; } }catch(e){} }
  return left.size?0:lo; }
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
            if(!bad.length) st='ok'; else { o=await hpRelFindOld(scr,hs,want); if(o) st='old'; else { o=await hpRelFindMix(scr,hs,want); if(o){ st='old'; why='mix'; } else { st='unknown'; why=bad[0].path; } } } } } }
    }
  }catch(e){ st='err'; why=String((e&&e.message)||e).slice(0,80); }
  const was=HP_REL.st;
  if(hpRelRed(st)&&!hpRelRed(was)){ HP_REL_SUS++; if(HP_REL_SUS<HP_REL_SUS_N){ HP_REL_BUSY=false; const gap=HP_REL_SUS_STEPS[Math.min(HP_REL_SUS,HP_REL_SUS_STEPS.length)-1]; HP_REL_NEXT=Date.now()+gap; try{ hpLog('本物の印：'+st+'（'+HP_REL_SUS+' 回目）'+(why?' '+why:'')+'。'+Math.round(gap/1000)+' 秒後に確かめ直す（配り替えの最中かもしれない）'); }catch(e){} try{ hpRelUi(); }catch(e){} return was; } }
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
function hpRelDue(now,at){ const el=Number(now)-Number(at||0); if(el>=HP_REL_EVERY*1.5) return true; if(el<HP_REL_EVERY/2) return false; return (typeof hpSlotIn==='function')?hpSlotIn(now,HP_REL_EVERY):el>=HP_REL_EVERY; }
function hpRelTick(){
  try{ hpRelUi(); }catch(e){}
  const now=Date.now();
  if(HP_REL_NEXT){ if(now>=HP_REL_NEXT){ HP_REL_NEXT=0; hpRelCheck().catch(()=>{}); } return; }
  if(hpRelRed(HP_REL.st)?(now-HP_REL.at>HP_REL_EVERY_BAD):hpRelDue(now,HP_REL.at)){ hpRelCheck().catch(()=>{}); return; }
  if(HP_REL.st==='old'||HP_REL.st==='unknown') hpRelMaybeReload(); }
function hpRelOnVis(){
  try{ if(document.visibilityState==='hidden'){ HP_REL_HID_AT=Date.now(); return; }
    if(HP_REL_HID_AT&&Date.now()-HP_REL_HID_AT>=HP_REL_AWAY){ HP_REL_BACK=Date.now(); HP_REL_NEXT=0; hpRelCheck().catch(()=>{}); }
    HP_REL_HID_AT=0; }catch(e){} }
try{ if(typeof hpSend==='function'&&!hpSend.__rel){ const f=hpSend; hpSend=function(){ if(hpRelRed(HP_REL.st)) return Promise.reject(new Error(T('rel_bad_short'))); return f.apply(this,arguments); }; hpSend.__rel=1; } }catch(e){}
try{ if(typeof hpPut==='function'&&!hpPut.__rel){ const f=hpPut; hpPut=async function(){ if(hpRelRed(HP_REL.st)){ const e=new Error(T('rel_bad_short')); e.hpk='wait'; e.hpWhy=T('rel_bad_short'); throw e; } return f.apply(this,arguments); }; hpPut.__rel=1; } }catch(e){}
try{ if(typeof hpFailText==='function'&&!hpFailText.__rel){ const f=hpFailText; hpFailText=function(peer){ const s=f.apply(this,arguments); try{ const x=HP_FAIL_LAST.get(peer); if(hpRelRed(HP_REL.st)&&x&&x.k==='wait') return TF('sys_fail_rel',{name:nickOf(peer)})+TF('sys_fail_n',{n:hpPendList(peer).length,t:x.t}); }catch(e){} return s; }; hpFailText.__rel=1; } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'){ setTimeout(()=>{ try{ hpRelUi(); hpRelCheck().catch(()=>{}); }catch(e){} },3000+Math.floor(Math.random()*5000));   setInterval(()=>{ try{ hpRelTick(); }catch(e){} },5000);
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
  ['hl_g0',[['hl_q0','hl_a0'],['hl_q12','hl_a12'] ,['hl_q15','hl_a15'] ]], ['hl_g1',[['hl_q1','hl_a1'],['hl_q2','hl_a2'],['hl_q3','hl_a3'],['hl_q4','hl_a4'],['hl_q5','hl_a5']]],
  ['hl_g2',[['hl_q6','hl_a6'],['hl_q7','hl_a7'],['hl_q16','hl_a16'],['hl_q17','hl_a17'],['hl_q18','hl_a18'],['hl_q19','hl_a19']]],   ['hl_g4',[['hl_q10','hl_a10'],['hl_q11','hl_a11']]], ['hl_g5',[['hl_q13','hl_a13']]], ['hl_g6',[['hl_q14','hl_a14']]]    ];
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
      h+='<details class="hl-q" data-q="'+n+'"'+' style="border-top:1px solid #1b2740;padding:8px 0"><summary style="cursor:pointer;font-weight:600;color:var(--teal,#35d1b7)" data-i18n="'+q+'">'+hpHelpEsc(T(q))+'</summary>';
      if(n===0) h+=hpHelpFig1()+P+a+'">'+hpHelpEsc(T(a))+'</div>'+hpHelpFig2()+P+'hl_a0b">'+hpHelpEsc(T('hl_a0b'))+'</div>';
      else h+=((typeof hpHelpHiDiv==='function')&&hpHelpHiDiv(a))||(P+a+'">'+hpHelpEsc(T(a))+'</div>');
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

const HP_CHG=[['bk36f88','chg_bk36f88'],['bk36f87','chg_bk36f87'],['bk36f86','chg_bk36f86'],['bk36f85','chg_bk36f85'],['bk36f84','chg_bk36f84'],['bk36f83','chg_bk36f83'],['bk36f82','chg_bk36f82'],['bk36f81','chg_bk36f81'],['bk36f80','chg_bk36f80'],['bk36f79','chg_bk36f79'],['bk36f78','chg_bk36f78'],['bk36f77','chg_bk36f77'],['bk36f76','chg_bk36f76'],['bk36f75','chg_bk36f75'],['bk36f74','chg_bk36f74'],['bk36f73','chg_bk36f73'],['bk36f72','chg_bk36f72'],['bk36f71','chg_bk36f71'],['bk36f70','chg_bk36f70'],['bk36f69','chg_bk36f69'],['bk36f68','chg_bk36f68'],['bk36f67','chg_bk36f67'],['bk36f66','chg_bk36f66'],['bk36f65','chg_bk36f65'],['bk36f64','chg_bk36f64'],['bk36f63','chg_bk36f63'],['bk36f62','chg_bk36f62'],['bk36f61','chg_bk36f61'],['bk36f60','chg_bk36f60'],['bk36f59','chg_bk36f59'],['bk36f58','chg_bk36f58'],['bk36f57','chg_bk36f57'],['bk36f55','chg_bk36f55'],['bk36f53','chg_bk36f53'],['bk36f52','chg_bk36f52'],['bk36f51','chg_bk36f51'],['bk36f50','chg_bk36f50'],['bk36f49','chg_bk36f49'],['bk36f46','chg_bk36f46'],['bk36f45','chg_bk36f45'],['bk36f44','chg_bk36f44'],['bk36f43','chg_bk36f43'],['bk36f42','chg_bk36f42'],['bk36f41','chg_bk36f41'],['bk36f40','chg_bk36f40'],['bk36f39','chg_bk36f39'],['bk36f38','chg_bk36f38'],['bk36f37','chg_bk36f37'],['bk36f36','chg_bk36f36'],['bk36f35','chg_bk36f35'],['bk36f34','chg_bk36f34'],['bk36f33','chg_bk36f33'],['bk36f32','chg_bk36f32'],['bk36f31','chg_bk36f31'],['bk36f30','chg_bk36f30'],['bk36f29','chg_bk36f29'],['bk36f28','chg_bk36f28'],['bk36f27','chg_bk36f27'],['bk36f26','chg_bk36f26'],['bk36f25d','chg_bk36f25d'],['bk36f25c','chg_bk36f25c'],['bk36f25b','chg_bk36f25b'],['bk36f25','chg_bk36f25'],['bk36f24','chg_bk36f24'],['bk36f23','chg_bk36f23'],['bk36f22','chg_bk36f22'],['bk36f21','chg_bk36f21'],['bk36f20','chg_bk36f20'],['bk36f19','chg_bk36f19'],['bk36f18','chg_bk36f18'],['bk36f17','chg_bk36f17'],['bk36f16','chg_bk36f16'],['bk36f15','chg_bk36f15'],['bk36f14','chg_bk36f14'],['bk36f13','chg_bk36f13'],['bk36f12','chg_bk36f12'],['bk36f11','chg_bk36f11'],['bk36f10','chg_bk36f10'],['bk36f8','chg_bk36f8'],['bk36f7','chg_bk36f7']], HP_CHG_MAX=3, HP_CHG_K='p2p_chgseen';

const HP_CHG_REL={"bk36f88":116,"bk36f87":115,"bk36f86":114,"bk36f85":113,"bk36f84":112,"bk36f83":111,"bk36f82":110,"bk36f81":109,"bk36f80":108,"bk36f79":107,"bk36f78":106,"bk36f77":105,"bk36f76":104,"bk36f75":103,"bk36f74":102,"bk36f73":101,"bk36f72":100,"bk36f71":99,"bk36f70":98,"bk36f69":97,"bk36f68":96,"bk36f67":95,"bk36f66":94,"bk36f65":93,"bk36f64":92,"bk36f63":91,"bk36f62":90,"bk36f61":89,"bk36f60":88,"bk36f59":87,"bk36f58":86,"bk36f57":85,"bk36f55":84,"bk36f53":83,"bk36f52":82,"bk36f51":81,"bk36f50":80,"bk36f49":79,"bk36f46":78,"bk36f45":77,"bk36f44":76,"bk36f43":75,"bk36f42":75,"bk36f41":74,"bk36f40":74,"bk36f39":73,"bk36f38":72,"bk36f37":71,"bk36f36":70,"bk36f35":69,"bk36f34":69,"bk36f33":68,"bk36f32":68,"bk36f31":67,"bk36f30":66,"bk36f29":65,"bk36f28":64,"bk36f27":63,"bk36f26":62,"bk36f25d":61,"bk36f25c":60,"bk36f25b":59,"bk36f25":59,"bk36f24":58,"bk36f23":57,"bk36f22":57,"bk36f21":56,"bk36f20":55,"bk36f19":55,"bk36f18":54,"bk36f17":53,"bk36f16":52,"bk36f15":51,"bk36f14":50,"bk36f13":49,"bk36f12":48,"bk36f11":47,"bk36f10":46,"bk36f8":45,"bk36f7":44};
function hpChgRel(s){ const v=(typeof HP_CHG_REL!=='undefined'&&HP_CHG_REL)?HP_CHG_REL[s]:0; return Number.isInteger(v)&&v>0?v:0; }
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
  const multi=new Set(L.map(x=>hpChgRel(x[0]))).size>1; let lastN=-1;
  for(const [sg,k] of L){ const rn=hpChgRel(sg); if(multi&&rn&&rn!==lastN){ const h=el('div','font-weight:700;margin-top:6px;color:#9fe8da',TF('chg_rel_h',{n:rn})); if(h.setAttribute) h.setAttribute('data-chgh','1'); n.appendChild(h); } lastN=rn; n.appendChild(el('div','white-space:pre-line;margin-top:4px',T(k),k)); }
  const r=el('div','margin-top:6px'); const b1=el('button','margin:0 8px 0 0',T('btn_chg_help'),'btn_chg_help'); b1.className='b pri'; b1.type='button'; b1.onclick=()=>{ hpChgClose(); try{ if(typeof hpHelpOpen==='function') hpHelpOpen(); }catch(e){} };
  const b2=el('button','',T('btn_close'),'btn_close'); b2.className='b'; b2.type='button'; b2.onclick=()=>{ hpChgClose(); }; r.appendChild(b1); r.appendChild(b2); n.appendChild(r);
  return key; }catch(e){ return ''; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setInterval==='function'){ setTimeout(()=>{ try{ hpChgShow(); }catch(e){} },4000); setInterval(()=>{ try{ hpChgShow(); }catch(e){} },15e3); } }catch(e){}

const HP_MB2_C=256000, HP_MB2_BODY=345000, HP_MB2_MAX=655360, HP_MB2_OLD_TTL=3600e3, HP_MB2_STEPS=[30e3,120e3,600e3,1800e3];
let HP_MB2_GAP=2100;
const HP_MB2_OLD=new Map(), HP_MB2_ST=new Map();
function hpMb2Pad(o){ o.z=''; const L=JSON.stringify(JSON.stringify(o)).length; if(L>HP_MB2_BODY) throw new Error('切れが大きすぎる（'+L+' 文字）'); o.z='0'.repeat(HP_MB2_BODY-L); return JSON.stringify(o); }
function hpMb2Pieces(bytes, head){
  const t0={ v:1, type:'mbp', bid:head.bid, i:0, n:99999, N:99999, ts:head.ts, k:head.k, meta:head.meta, size:head.size, d:'' };
  const room=HP_MB2_BODY-JSON.stringify(JSON.stringify(Object.assign({},t0,{z:''}))).length-8;
  const c0=Math.max(0,Math.floor(room/4)*3);
  const n=1+(bytes.length>c0?Math.ceil((bytes.length-c0)/HP_MB2_C):0);
  const out=[hpMb2Pad(Object.assign({},t0,{n:n,N:n,d:hpMbB64(bytes.subarray(0,Math.min(c0,bytes.length)))}))];
  for(let i=1;i<n;i++){ const a=c0+(i-1)*HP_MB2_C; out.push(hpMb2Pad({ v:1, type:'mbp', bid:head.bid, i:i, n:n, N:n, d:hpMbB64(bytes.subarray(a,Math.min(a+HP_MB2_C,bytes.length))) })); }
  return out; }
function hpMb2Key(g){ return (Array.isArray(g&&g.post)?g.post:[]).join(' '); }
function hpMb2Old(k){ const t=Number(HP_MB2_OLD.get(k))||0; if(t&&Date.now()-t<HP_MB2_OLD_TTL) return true; if(t) HP_MB2_OLD.delete(k); return false; }
function hpMb2Guard(){ let red=false; try{ red=typeof hpRelRed==='function'&&typeof HP_REL!=='undefined'&&!!hpRelRed(HP_REL.st); }catch(e){ red=false; }
  if(red){ const e=new Error(T('rel_bad_short')); e.hpk='wait'; e.hpWhy=T('rel_bad_short'); throw e; } }
async function hpMb2PutG(g, sealed){ for(let tries=0;;tries++){ hpMb2Guard(); try{ return await hpPutOne(g, sealed.id, sealed.kind, false); }catch(e){ const w=String((e&&(e.hpWhy||e.message))||e); if(w==='rate limit'&&tries<20){ await sleep(5000); continue; } throw e; } } }
function hpMb2Text(s){ if(!s) return ''; if(s.st==='send') return TF('mb_sending',{i:s.i,n:s.n}); let t=''; try{ t=s.next?new Date(s.next).toTimeString().slice(0,5):''; }catch(e){ t=''; } return TF(s.why==='post full'?'mb_e_full_auto':'mb_e_auto',{t:t}); }
function hpMb2Say(ts){ try{ const s=HP_MB2_ST.get(ts); if(!s||typeof findMsgEl!=='function') return false; const el=findMsgEl(ts); if(!el) return false; const lab=el.querySelector('.hpfail > span'); if(!lab) return false; const t=hpMb2Text(s); if(lab.textContent!==t) lab.textContent=t; return true; }catch(e){ return false; } }
async function hpMbSend2(peer, ts, lab){
  const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||!m.p||m.x||!hpMbCan(peer,m)) return 'no';
  const it=m.img||m.file, card=hpCardOf(peer);
  const blob=await blobGet(it.id); if(!blob){ hpLog('郵便受けで送れない（本体がこの端末に無い）'); if(lab) lab.textContent=T('mb_e_gone'); HP_MB2_ST.delete(ts); return 'gone'; }
  HP_MB_BUSY.add(ts); const st={ st:'send', i:0, n:1, why:'', next:0, tries:(HP_MB2_ST.get(ts)||{}).tries||0 }; HP_MB2_ST.set(ts,st);
  const say=()=>{ try{ if(lab) lab.textContent=hpMb2Text(st); }catch(e){} hpMb2Say(ts); };
  try{
    hpMb2Guard(); if(typeof hpReady==='function') await hpReady();
    const bytes=new Uint8Array(await blob.arrayBuffer()), bid=hpMbHex(8);
    const meta=m.img?{ id:it.id, w:it.w, h:it.h, mime:it.mime||'image/jpeg', thumb:it.thumb }:{ id:it.id, name:it.name, mime:it.mime||'' };
    const head={ bid:bid, ts:ts, k:m.img?'img':'file', meta:meta, size:bytes.length };
    const big=hpMb2Pieces(bytes, head), small=new Set(); let okBig=0, t0=0;
    st.n=big.length; say();
    hpLog('郵便受けで送り始めた（'+Math.round(bytes.length/1024)+' KB・切れ '+big.length+' 通）→ '+nickOf(peer));
    for(let i=0;i<big.length;i++){
      const w0=t0?HP_MB2_GAP-(Date.now()-t0):0; if(w0>0) await sleep(w0); t0=Date.now();
      const sealed=await hpSeal(card, big[i], 'msg', false, HP_MB2_MAX);
      let gs=hpPutGroups(card, sealed.letters); for(const g of gs) if(hpMb2Old(hpMb2Key(g))) small.add(hpMb2Key(g));
      gs=gs.filter(g=>!small.has(hpMb2Key(g))); if(!gs.length) break;
      for(const g of gs){ if(i===big.length-1) g.ring=true;
        try{ await hpMb2PutG(g, sealed); okBig++; }
        catch(e){ const w=String((e&&(e.hpWhy||e.message))||e), k=hpMb2Key(g); if(w==='too big'){ small.add(k); HP_MB2_OLD.set(k,Date.now()); hpLog('郵便受けが前の版なので、小さい切れで送る（'+k.replace(/^wss:\/\//,'')+'）'); continue; } throw e; } }
      st.i=i+1; say();
    }
    let nSmall=0;
    if(small.size){
      const devs=new Set(); for(const g of hpPutGroups(card,(card.devices||[]).map(d=>({dev:d,blob:''})))) if(small.has(hpMb2Key(g))) for(const L of g.letters) devs.add(L.dev);
      const sub=Object.assign({},card,{devices:(card.devices||[]).filter(d=>devs.has(d))});
      const bodies=hpMbPieces(bytes, head); nSmall=bodies.length; st.i=0; st.n=bodies.length; say();
      for(let i=0;i<bodies.length;i++){
        for(let tries=0;;tries++){ try{ await hpPut(sub, bodies[i], 'msg', (i===bodies.length-1)?{ring:true}:undefined); break; } catch(e){ const w=String((e&&(e.hpWhy||e.message))||e); if(w==='rate limit'&&tries<20){ await sleep(5000); continue; } throw e; } }
        st.i=i+1; say(); if(i<bodies.length-1&&HP_MB_GAP>0) await sleep(HP_MB_GAP);
      }
    }
    hpHistPatch(peer, ts, x=>{ delete x.p; delete x.hf; x.hp={ id:'mb:'+bid, exp:Date.now()+HP_MB_KEEP }; x.mb=1; });
    HP_MB2_ST.delete(ts);
    hpLog('郵便受けで送り終えた（切れ '+(okBig?big.length+' 通':'')+(okBig&&nSmall?'・':'')+(nSmall?'前の版の郵便受けへ小さい切れ '+nSmall+' 通':'')+'）→ '+nickOf(peer));
    try{ if(typeof hpSceneLetter==='function') hpSceneLetter('post','out'); }catch(_){}
    try{ if(typeof findMsgEl==='function'){ const el=findMsgEl(ts); if(el){ const fr=el.querySelector('.hpfail'); if(fr) fr.remove(); } } }catch(_){}
    try{ hpMarkRows(peer); hpDecorate(peer); }catch(_){}
    return 'ok';
  }catch(e){
    const w=String((e&&(e.hpWhy||e.message))||e); hpLog('郵便受けで送れない '+w);
    st.tries++; st.st='wait'; st.why=w; st.next=Date.now()+HP_MB2_STEPS[Math.min(st.tries-1,HP_MB2_STEPS.length-1)]; say();
    try{ hpDecorate(peer); }catch(_){}
    return 'err';
  }finally{ HP_MB_BUSY.delete(ts); }
}

function hpMbAuto(peer, ts, why){
  try{
    if(typeof ID==='undefined'||!ID||typeof histLoad!=='function') return false;
    const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||!m.p||m.x||!(m.img||m.file)) return false;
    if(typeof hpXhLast==='function'&&hpXhLast(m.xh)==='b') return false;
    if(m.dv&&typeof sibDv==='function'&&m.dv!==sibDv()) return false;
    if(typeof HP_RS_GIVEUP!=='undefined'&&Date.now()-m.ts>HP_RS_GIVEUP) return false;
    if(typeof rtcLineTo==='function'&&rtcLineTo(peer)) return false;
    if(HP_MB_BUSY.has(ts)||!hpMbCan(peer,m)) return false;
    const s=HP_MB2_ST.get(ts); if(s&&s.st==='wait'&&Date.now()<s.next) return false;
    hpLog('手渡しの線が開いていないので、待たずに郵便受けで送る'+(why?'（'+why+'）':'')+' → '+nickOf(peer));
    hpMbSend2(peer,ts,null).catch(()=>{}); return true;
  }catch(e){ return false; }
}
function hpMb2Tick(){ try{ if(typeof ID==='undefined'||!ID||!Array.isArray(ID.contacts)||typeof hpMediaPendList!=='function') return 0; let n=0;
  for(const c of ID.contacts){ const peer=c&&c.address; if(!peer) continue; if(typeof hpBlocked==='function'&&hpBlocked(peer)) continue;
    for(const m of hpMediaPendList(peer)) if(hpMbAuto(peer,m.ts,'見回り')) n++; }
  return n; }catch(e){ return 0; } }

hpMbSendAsk=async function(peer, ts, lab){
  const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||!hpMbCan(peer,m)) return 'no';
  const it=m.img||m.file, n=Math.max(1,Math.ceil((Number(it.size)||0)/HP_MB2_C)), min=Math.max(1,Math.ceil(n*7000/60000));
  let ok=false; try{ ok=await hpAsk({ text:TF('cf_mb_send',{size:hpMbSize(m),n:n,min:min}), ok:T('btn_mb_go') }); }catch(e){ ok=false; }
  if(!ok) return 'no'; HP_MB2_ST.delete(ts); return await hpMbSend2(peer, ts, lab); };
hpMbSend=hpMbSend2;

try{ if(typeof hpFailRow==='function'&&!hpFailRow.__mb2){ const f=hpFailRow; hpFailRow=function(el,peer,m){ const r=f.apply(this,arguments); try{ const s=m&&HP_MB2_ST.get(m.ts); if(s){ const lab=el.querySelector('.hpfail > span'); if(lab) lab.textContent=hpMb2Text(s); } }catch(e){} return r; }; Object.assign(hpFailRow,f,{__mb2:1}); } }catch(e){}
try{ if(typeof hpCsState==='function'&&!hpCsState.__mb2){ const f=hpCsState; hpCsState=function(peer){ const s=f.apply(this,arguments); try{ if(s==='wait_line'){ const m=hpCsLastSent(peer); if(m&&HP_MB2_ST.has(m.ts)) return 'walk'; } }catch(e){} return s; }; Object.assign(hpCsState,f,{__mb2:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof setInterval==='function'&&typeof document!=='undefined'){ setTimeout(()=>{ hpMb2Tick(); },12e3); setInterval(()=>{ hpMb2Tick(); },20e3); } }catch(e){}

function hpPhSize(d, img){ try{ const n=Number(img&&img.size)||0; if(!d||!n||!d.querySelector||d.querySelector('.phs')) return false; const t=d.querySelector('time'); if(!t) return false;
  const s=document.createElement('span'); s.className='phs'; s.textContent=fmtSize(n); d.insertBefore(s,t); return true; }catch(e){ return false; } }
try{ if(typeof addMsgAt==='function'&&!addMsgAt.__phs){ const f=addMsgAt; addMsgAt=function(kind,text,who,ts,voided,pend,rd,img,file){ const r=f.apply(this,arguments);
  try{ if(img&&img.thumb){ const ms=document.getElementById('msgs'), d=ms&&ms.lastElementChild; if(d&&d.dataset&&d.dataset.ts===String(ts)) hpPhSize(d,img); } }catch(e){} return r; }; Object.assign(addMsgAt,f,{__phs:1}); } }catch(e){}

const HP_RELL_ACCT='rNQvCvSmbt8fL78nHq9GKu9Cg6z2q3uG98';
const HP_RELL_TYPE='handpost-release', HP_RELL_LATE=2*3600e3, HP_RELL_EVERY=30*60e3, HP_RELL_WAITEVERY=10*60e3, HP_RELL_KEY='hp_rell_seen';
let HP_RELL={st:'',n:0,at:0,why:''}, HP_RELL_BUSY=false;
function hpRellParse(txs, acct){ const out=new Map();
  for(const x of (Array.isArray(txs)?txs:[])){ try{ const tx=(x&&(x.tx||x.tx_json))||{}, meta=(x&&x.meta)||{};
    if(tx.Account!==acct||tx.TransactionType!=='AccountSet'||x.validated===false) continue; if(meta.TransactionResult&&meta.TransactionResult!=='tesSUCCESS') continue;
    for(const m of (Array.isArray(tx.Memos)?tx.Memos:[])){ const M=(m&&m.Memo)||{}; if(hpHexStr(M.MemoType)!==HP_RELL_TYPE) continue; let j=null; try{ j=JSON.parse(hpHexStr(M.MemoData)); }catch(e){ j=null; }
      if(!j||j.v!==1||!Number.isInteger(j.n)||j.n<1||!/^[0-9a-f]{64}$/.test(String(j.s||''))) continue; const L=out.get(j.n)||[]; if(L.indexOf(j.s)<0) L.push(j.s); out.set(j.n,L); } }catch(e){} }
  return out; }
function hpRellJudge(recs, n, fp, seen, now){
  if(!n||!/^[0-9a-f]{16,64}$/.test(String(fp||''))) return 'skip'; const f=String(fp).slice(0,16), L=recs.get(n);
  if(L) return (L.length===1&&L[0].slice(0,16)===f)?'ok':'bad';
  let max=0; for(const k of recs.keys()) if(k>max) max=k;
  if(n>max) return (now-seen<HP_RELL_LATE)?'wait':'late'; return 'late'; }
function hpRellSeen(n, now){ let o=null; try{ o=JSON.parse(localStorage.getItem(HP_RELL_KEY)||'null'); }catch(e){ o=null; } if(o&&o.n===n&&Number(o.at)>0) return Number(o.at); try{ localStorage.setItem(HP_RELL_KEY,JSON.stringify({n:n,at:now})); }catch(e){} return now; }
async function hpRellCheck(force){
  if(!HP_RELL_ACCT||HP_RELL_BUSY) return HP_RELL.st; const R=(typeof HP_REL!=='undefined'&&HP_REL)||{};
  if(!(R.st==='ok'||R.st==='old')||!R.n||!R.fp) return HP_RELL.st;
  const now=Date.now(), gap=HP_RELL.st==='wait'?HP_RELL_WAITEVERY:HP_RELL_EVERY; if(!force&&HP_RELL.n===R.n&&HP_RELL.st&&HP_RELL.st!=='err'&&now-HP_RELL.at<gap) return HP_RELL.st;
  HP_RELL_BUSY=true; let st='err', why='';
  try{ const txs=await hpXahauSess(async q=>{ const r=await q({command:'account_tx',account:HP_RELL_ACCT,limit:100}); return (r&&r.transactions)||[]; },20000,15000);
    st=hpRellJudge(hpRellParse(txs,HP_RELL_ACCT),R.n,R.fp,hpRellSeen(R.n,now),now); }
  catch(e){ st='err'; why=String((e&&e.message)||e).slice(0,60); }
  const was=HP_RELL.st; HP_RELL={st:st,n:R.n,at:now,why:why}; HP_RELL_BUSY=false;
  if(st!==was){ try{ hpLog('台帳の版の記録：'+st+'（第 '+R.n+' 版・照合番号 '+String(R.fp).slice(0,8)+'）'+(why?' '+why:'')); }catch(e){} }
  try{ if((st==='late'||st==='bad')&&was!==st&&typeof hpBanner==='function') hpBanner(hpRellMsg()); }catch(e){}
  try{ hpRellUi(); }catch(e){} return st; }
function hpRellMsg(){ const S=HP_RELL; return S.st==='ok'?TF('rell_ok',{n:S.n}):S.st==='wait'?TF('rell_wait',{n:S.n}):S.st==='late'?TF('rell_late',{n:S.n}):S.st==='bad'?TF('rell_bad',{n:S.n}):S.st==='err'?TF('rell_err',{e:S.why||'?'}):''; }
function hpRellUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const st=document.getElementById('rel-state'); if(!st||!st.parentNode) return false;
  let d=document.getElementById('rell-state'); if(!d){ d=document.createElement('div'); d.id='rell-state'; d.style.cssText='margin-top:4px'; st.parentNode.insertBefore(d,st.nextSibling); }
  const t=HP_RELL_ACCT?hpRellMsg():''; if(d.textContent!==t) d.textContent=t; d.style.display=t?'':'none';
  d.style.color=(HP_RELL.st==='late'||HP_RELL.st==='bad')?'var(--red)':HP_RELL.st==='wait'?'var(--amber)':HP_RELL.st==='ok'?'var(--teal)':'var(--dim)'; return true; }catch(e){ return false; } }
try{ if(typeof hpRelCheck==='function'&&!hpRelCheck.__rell){ const f=hpRelCheck; hpRelCheck=async function(){ const st=await f.apply(this,arguments); try{ if(HP_RELL_ACCT) setTimeout(()=>{ hpRellCheck(false).catch(()=>{}); },0); }catch(e){} return st; }; Object.assign(hpRelCheck,f,{__rell:1}); } }catch(e){}
try{ if(typeof hpRelUi==='function'&&!hpRelUi.__rell){ const f=hpRelUi; hpRelUi=function(){ const r=f.apply(this,arguments); try{ hpRellUi(); }catch(e){} return r; }; Object.assign(hpRelUi,f,{__rell:1}); } }catch(e){}

const HP_CAP_RATE=0.4, HP_CAP_DEF=600*1048576, HP_CAP_MIN=50*1048576; let HP_CAP_KICK=null, HP_CAP_PEND=null;
function hpCapFor(diskI){ const d=Number(diskI)||0; if(!(d>0)) return HP_CAP_DEF; return Math.max(HP_CAP_MIN,Math.floor(d*1048576*HP_CAP_RATE)); }
async function hpCapHostOf(url){ let host=''; try{ host=new URL(String(url||'').replace(/^wss:/,'https:')).hostname.toLowerCase(); }catch(e){ return 0; } if(!host) return 0;
  let hosts=null; const dom=new Map(); try{ if(typeof HP_HS_DOM!=='undefined') for(const [a,d] of HP_HS_DOM) dom.set(a,d); }catch(e){}
  try{ if(typeof HP_HOSTS!=='undefined'&&HP_HOSTS&&!HP_HOSTS.empty&&Array.isArray(HP_HOSTS.hosts)) hosts=HP_HOSTS.hosts; }catch(e){}
  if(!hosts){ try{ const c=(typeof HP_HS_CACHE!=='undefined'&&HP_HS_CACHE)?await HP_HS_CACHE.get('hosts'):null; if(c&&Array.isArray(c.hosts)){ hosts=c.hosts; for(const [a,d] of (c.dom||[])) if(!dom.has(a)) dom.set(a,d); } }catch(e){ hosts=null; } }
  for(const h of (hosts||[])){ const d=String(dom.get(h.addr)||h.desc||'').toLowerCase(); if(d&&(d===host||host.endsWith('.'+d))) return Number(h.diskI)||0; } return 0; }
async function hpCapKick(){ try{ if(typeof POST==='undefined'||!POST||!POST.up||!POST.client||POST.notOwner||!POST.claimedId||!POST.url) return 0; if(HP_CAP_KICK===POST.client) return 0; HP_CAP_KICK=POST.client;
  const url=String(POST.url), di=await hpCapHostOf(url), cap=hpCapFor(di); const done=(ID&&ID.postCap&&typeof ID.postCap==='object')?Number(ID.postCap[url])||0:0; if(done===cap) return 0;
  HP_CAP_PEND={url:url,cap:cap,di:di}; hpSend({op:'config',capacity:cap}).catch(()=>{ HP_CAP_KICK=null; HP_CAP_PEND=null; }); return 1; }catch(e){ return 0; } }
function hpCapOnReply(o){ try{ const P=HP_CAP_PEND; if(!o||o.ok!=='config'||!P||Number(o.capacity)!==P.cap) return false; HP_CAP_PEND=null;
  if(!ID.postCap||typeof ID.postCap!=='object'||Array.isArray(ID.postCap)) ID.postCap={}; const ks=Object.keys(ID.postCap); if(ks.length>=8&&!(P.url in ID.postCap)) delete ID.postCap[ks[0]]; ID.postCap[P.url]=P.cap; saveID();
  hpLog('郵便受けに置ける量を '+Math.round(P.cap/1048576)+' MB にした（'+(P.di?'ホストのインスタンス 1 つあたりのディスク '+(Math.round(P.di/1024*10)/10)+' GB の 4 割':'ホストの一覧に無いので決まった量')+'）'); return true; }catch(e){ return false; } }
try{ if(typeof hpLinkOnReply==='function'&&!hpLinkOnReply.__cap){ const f=hpLinkOnReply; hpLinkOnReply=function(o){ const r=f.apply(this,arguments); try{ hpCapOnReply(o); }catch(e){} return r; }; Object.assign(hpLinkOnReply,f,{__cap:1}); } }catch(e){}
try{ if(typeof document!=='undefined'&&typeof setInterval==='function'&&typeof window!=='undefined'){ setInterval(()=>{ hpCapKick().catch(()=>{}); },5000); } }catch(e){}

const HP_MB3_FROM=HP_MB_MAX, HP_MB3_MAX=100*1024*1024, HP_MB3_C=3000000, HP_MB3_PAD=262144, HP_MB3_SEAL=7000000, HP_MB3_N=Math.ceil(100*1024*1024/3000000)+1, HP_MB3_WAIT=60000, HP_MB3_MARGIN=20*1048576;
let HP_MB3_PUT_WAIT=90000;
const HP_MB3_DECL_KEY='p2p_mb3decl'; let HP_MB3_DECL=null;
const HP_MB3_IN=new Set(), HP_MB3_Q=[], HP_MB3_W=new Map(); let HP_MB3_RUN=false;
function hpMb3B64(u8){ return hpMbB64(u8); }
function hpMb3Pad(o){ o.z=''; const L=JSON.stringify(JSON.stringify(o)).length, T=Math.ceil(L/HP_MB3_PAD)*HP_MB3_PAD; o.z='0'.repeat(Math.max(0,T-L)); return JSON.stringify(o); }
function hpMb3Count(size){ return 1+Math.ceil(Math.max(0,Number(size)||0)/HP_MB3_C); }
function hpMb3Piece(bytes, head, i){ const n=hpMb3Count(bytes.length); if(i===0) return hpMb3Pad({ v:1, type:'mbp3', bid:head.bid, i:0, n:n, ts:head.ts, k:head.k, meta:head.meta, size:head.size });
  const a=(i-1)*HP_MB3_C; return hpMb3Pad({ v:1, type:'mbp3', bid:head.bid, i:i, n:n, d:hpMb3B64(bytes.subarray(a,Math.min(a+HP_MB3_C,bytes.length))) }); }
async function hpMb3Sha(s){ return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))); }
function hpMb3Split(sealed, bid){
  let blob=''; const small={}; for(const L of sealed.letters){ const o=JSON.parse(L.blob); if(!blob) blob=o.blob; else if(o.blob!==blob) throw new Error('包みの本体がそろわない'); o.blob=''; o.mb=bid; small[L.dev]=JSON.stringify(o); }
  return { blob:blob, small:small }; }
function hpMb3Ask(p, obj){ const run=async()=>{ p.replies.length=0; const t0=Date.now(); try{ await p.c.submitContractInput(JSON.stringify(obj)); }catch(e){ return {r:{err:'相手のポストにつながらない'},ms:Date.now()-t0}; }
    while(!p.replies.length&&p.up&&Date.now()-t0<HP_MB3_PUT_WAIT) await sleep(100); return {r:p.replies.shift()||{err:p.up?'返事がない':'相手のポストにつながらない'},ms:Date.now()-t0}; };
  const q=p.chain.then(run,run); p.chain=q.catch(()=>{}); return q.finally(()=>hpPoolIdle(p)); }
async function hpMb3PutG(g, id, sp, bh, ring){
  const req={ op:'put', token:g.token, id:id, kind:'msg', letters:[], bl:g.letters.map(L=>({ dev:L.dev, blob:sp.small[L.dev] })), body:sp.blob, bh:bh }; if(ring) req.ring=true;
  for(let tries=0;;tries++){ hpMb2Guard(); const a=await hpMb3Ask(await hpPoolGet(g.post,hpPutFail),req), r=a.r;
    hpLog('投函（本体つき）'+id+' → '+g.post[0]+' '+req.bl.length+' 通・本体 '+sp.blob.length+' 文字 '+a.ms+' ms '+(r.ok?'ok':'拒否 '+r.err));
    if(r.ok&&r.b===1) return true; if(r.ok) throw Object.assign(new Error('old post'),{hpWhy:'old post'});
    if(r.err==='rate limit'&&tries<20){ await sleep(5000); continue; }
    if(r.err==='bad letter') throw Object.assign(new Error('old post'),{hpWhy:'old post'});
    throw hpPutFail(String(r.err)); } }
async function hpMbSend3(peer, ts, lab, again){
  const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||m.x||!(m.img||m.file)||(!m.p&&!again)) return 'no';
  const it=m.img||m.file, card=hpCardOf(peer); if(!card) return 'no';
  const blob=await blobGet(it.id); if(!blob){ hpLog('郵便受けで送れない（本体がこの端末に無い）'); if(lab) lab.textContent=T('mb_e_gone'); HP_MB2_ST.delete(ts); return 'gone'; }
  if(blob.size>HP_MB3_MAX) return 'no';
  HP_MB_BUSY.add(ts); const prev=HP_MB2_ST.get(ts)||{}; const st={ st:'send', i:prev.i||0, n:prev.n||1, why:'', next:0, tries:prev.tries||0, bid:prev.bid||'', k0:prev.k0||0 }; HP_MB2_ST.set(ts,st);
  const say=()=>{ try{ if(lab) lab.textContent=hpMb2Text(st); }catch(e){} hpMb2Say(ts); };
  try{
    hpMb2Guard(); if(typeof hpReady==='function') await hpReady();
    const bytes=new Uint8Array(await blob.arrayBuffer()); if(!st.bid||again){ st.bid=hpMbHex(8); st.k0=0; }
    const meta=m.img?{ id:it.id, w:it.w, h:it.h, mime:it.mime||'image/jpeg', thumb:it.thumb }:{ id:it.id, name:it.name, mime:it.mime||'' };
    const head={ bid:st.bid, ts:ts, k:m.img?'img':'file', meta:meta, size:bytes.length }, n=hpMb3Count(bytes.length); st.n=n; say();
    if(!st.k0) hpLog('郵便受けで送り始めた（本体つき・'+Math.round(bytes.length/1048576*10)/10+' MB・切れ '+n+' 通）→ '+nickOf(peer));
    let t0=0;
    for(let i=st.k0;i<n;i++){
      const w0=t0?HP_MB2_GAP-(Date.now()-t0):0; if(w0>0) await sleep(w0); t0=Date.now();
      const sealed=await hpSeal(card, hpMb3Piece(bytes,head,i), 'msg', false, HP_MB3_SEAL), sp=hpMb3Split(sealed, st.bid), bh=await hpMb3Sha(sp.blob);
      for(const g of hpPutGroups(card, sealed.letters)) await hpMb3PutG(g, sealed.id, sp, bh, i===n-1);
      st.k0=i+1; st.i=i+1; say();
    }
    hpHistPatch(peer, ts, x=>{ delete x.p; delete x.hf; x.hp={ id:'mb:'+st.bid, exp:Date.now()+HP_MB_KEEP }; x.mb=1; });
    HP_MB2_ST.delete(ts); hpLog('郵便受けで送り終えた（本体つき・切れ '+n+' 通）→ '+nickOf(peer));
    try{ if(typeof hpSceneLetter==='function') hpSceneLetter('post','out'); }catch(_){}
    try{ if(typeof findMsgEl==='function'){ const el=findMsgEl(ts); if(el){ const fr=el.querySelector('.hpfail'); if(fr) fr.remove(); } } }catch(_){}
    try{ hpMarkRows(peer); hpDecorate(peer); }catch(_){}
    return 'ok';
  }catch(e){
    const w=String((e&&(e.hpWhy||e.message))||e); hpLog('郵便受けで送れない（本体つき）'+w);
    st.tries++; st.st='wait'; st.why=w; st.next=Date.now()+HP_MB2_STEPS[Math.min(st.tries-1,HP_MB2_STEPS.length-1)]; say();
    try{ hpDecorate(peer); }catch(_){}
    return 'err';
  }finally{ HP_MB_BUSY.delete(ts); }
}
try{ if(typeof hpMbSend2==='function'&&!hpMbSend2.__mb3){ const f=hpMbSend2; hpMbSend2=async function(peer, ts, lab){ try{ const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'), s=Number(((m&&(m.img||m.file))||{}).size)||0; if(s>HP_MB3_FROM) return await hpMbSend3(peer,ts,lab,false); }catch(e){} return await f.apply(this,arguments); }; Object.assign(hpMbSend2,f,{__mb3:1}); hpMbSend=hpMbSend2; } }catch(e){}
try{ if(typeof hpMbCan==='function'&&!hpMbCan.__mb3){ const f=hpMbCan; hpMbCan=function(peer, m){ try{ const it=m&&(m.img||m.file), s=Number(it&&it.size)||0; if(s>HP_MB3_FROM&&s<=HP_MB3_MAX){ const k=m.img?'img':'file', c=Object.assign({},it,{size:HP_MB3_FROM}), m2=Object.assign({},m); m2[k]=c; return f.call(this,peer,m2); } }catch(e){} return f.apply(this,arguments); }; Object.assign(hpMbCan,f,{__mb3:1}); } }catch(e){}
try{ if(typeof hpMb2Text==='function'&&!hpMb2Text.__mb3){ const f=hpMb2Text; hpMb2Text=function(s){ try{ if(s&&s.st==='wait'&&s.why==='old post'){ let t=''; try{ t=s.next?new Date(s.next).toTimeString().slice(0,5):''; }catch(e){} return TF('mb_e_oldpost',{t:t}); } }catch(e){} return f.apply(this,arguments); }; Object.assign(hpMb2Text,f,{__mb3:1}); } }catch(e){}

function hpMb3Decl(){ if(HP_MB3_DECL) return HP_MB3_DECL; let o=null; try{ if(typeof hpHGet==='function'){ const s=hpHGet(HP_MB3_DECL_KEY); o=s?JSON.parse(s):null; } }catch(e){ o=null; } HP_MB3_DECL=(o&&typeof o==='object'&&!Array.isArray(o))?o:{}; return HP_MB3_DECL; }
function hpMb3DeclSave(){ try{ if(typeof hpHSet==='function') hpHSet(HP_MB3_DECL_KEY, JSON.stringify(HP_MB3_DECL||{})); }catch(e){} }
async function hpMb3Free(){ try{ if(typeof navigator!=='undefined'&&navigator.storage&&navigator.storage.estimate){ const e=await navigator.storage.estimate(); const q=Number(e.quota)||0, u=Number(e.usage)||0; if(q>0) return Math.floor(q*0.8-u); } }catch(e){} return Infinity; }
function hpMb3Need(size){ return 2*(Number(size)||0)+HP_MB3_MARGIN; }
function hpMb3Size(n){ const s=Number(n)||0; return s>=1048576?(Math.round(s/104857.6)/10)+' MB':Math.max(1,Math.round(s/1024))+' KB'; }
async function hpMb3In(r,o){
  if(!ID) return 'noid'; const from=r.from, S=hpMbLoad();
  if(from===ID.address) return 'self';
  if(!isContact(from)){ hpLog('住所録に無い相手からの本体の切れ（捨てた）'); return 'stranger'; }
  const c=ID.contacts.find(x=>x.address===from); if(c&&c.pubKey&&c.pubKey!==r.fromMaster){ hpLog('マスター鍵が連絡先のものと違う本体の切れ（捨てた）'); return 'master'; }
  const bid=o.bid, i=o.i, n=o.n;
  if(typeof bid!=='string'||!/^[0-9a-f]{16}$/.test(bid)||!Number.isInteger(i)||!Number.isInteger(n)||n<1||n>HP_MB3_N||i<0||i>=n){ hpLog('本体の切れの形が違う（捨てた）'); return 'form'; }
  if(S.done[bid]) return 'late'; const D=hpMb3Decl(); if(D[bid]&&!D[bid].req) return 'declined';
  let R=S.rx[bid]; if(!R){ R={ from:from, N:n, n:n, head:null, got:[], at:Date.now(), v3:1 }; S.rx[bid]=R; }
  if(R.from!==from||R.n!==n) return 'mix';
  if(R.got.indexOf(i)<0){
    if(i===0){ const mt=o.meta||{}; if(!Number.isFinite(o.ts)||!(o.size>HP_MB3_FROM)||o.size>HP_MB3_MAX||hpMb3Count(o.size)!==n||(o.k!=='img'&&o.k!=='file')||typeof mt.id!=='string'||!/^[0-9a-f]{32}$/.test(mt.id)) return 'form';
      R.head={ ts:o.ts, k:o.k, size:o.size, meta:(o.k==='img')?{ id:mt.id, w:Number(mt.w)||0, h:Number(mt.h)||0, mime:String(mt.mime||'image/jpeg').slice(0,64), thumb:(typeof mt.thumb==='string'&&/^data:image\//.test(mt.thumb))?mt.thumb.slice(0,40000):'' }:{ id:mt.id, name:String(mt.name||'file').slice(0,200), mime:String(mt.mime||'').slice(0,100), thumb:(typeof mt.thumb==='string'&&/^data:image\//.test(mt.thumb))?mt.thumb.slice(0,40000):'' }, fd:(typeof hpFdOf==='function')?hpFdOf(r.fromDev):'' };
      const free=await hpMb3Free();
      if(free<hpMb3Need(o.size)){
        delete S.rx[bid]; hpMbSave(); hpMbDropParts([{bid:bid,N:n}]).catch(()=>{});
        D[bid]={ from:from, ts:o.ts, size:o.size, at:Date.now(), req:0 }; hpMb3DeclSave(); hpMb3Hold(from,R.head,bid);
        hpLog('保存する場所が足りないので受け取らない（'+hpMb3Size(o.size)+'・空き '+hpMb3Size(Math.max(0,free))+'）← '+nickOf(from)); return 'declined'; }
      if(D[bid]){ delete D[bid]; hpMb3DeclSave(); }
    } else { if(typeof o.d!=='string') return 'form'; let u; try{ u=hpMbUn64(o.d); }catch(e){ return 'form'; } if(u.length>HP_MB3_C) return 'form'; await blobPut(hpMbPart(bid,i), new Blob([u])); }
    R.got.push(i);
  }
  hpMbSave();
  for(let k=0;k<n;k++) if(R.got.indexOf(k)<0) return 'wait';
  if(!R.head) return 'wait';
  return await hpMb3Done(bid,R);
}
function hpMb3Patch(peer, ts, fn){ const h=histLoad(peer), m=h.find(x=>x.ts===ts&&x.d==='p'); if(!m) return false; fn(m); histSave(peer,h); return true; }
function hpMb3Hold(from, h, bid){
  const nb={ size:h.size, bid:bid, at:Date.now() };
  if(histLoad(from).some(x=>x.ts===h.ts&&x.d==='p')){ hpMb3Patch(from,h.ts,x=>{ x.nb=nb; }); }
  else if(h.k==='img'){ histAdd(from,'p','',h.ts,0,{ id:h.meta.id, w:h.meta.w, h:h.meta.h, size:h.size, mime:h.meta.mime, thumb:h.meta.thumb },null,{fd:h.fd||''}); hpMb3Patch(from,h.ts,x=>{ x.nb=nb; }); }
  else { histAdd(from,'p','',h.ts,0,null,{ id:h.meta.id, name:h.meta.name, size:h.size, mime:h.meta.mime },{fd:h.fd||''}); hpMb3Patch(from,h.ts,x=>{ x.nb=nb; }); }
  try{ if(CURPEER===from&&CONV_OPEN&&typeof histRender==='function') histRender(from); }catch(e){} try{ updateBadges(); }catch(e){} }
async function hpMb3Done(bid,R){
  const S=hpMbLoad(), h=R.head, from=R.from;
  const parts=[]; for(let k=1;k<R.n;k++){ const b=await blobGet(hpMbPart(bid,k)); if(!b){ hpLog('本体の切れが手元から消えていた（'+k+'）'); return 'wait'; } parts.push(b); }
  const blob=new Blob(parts,{type:h.meta.mime||''}).slice(0,h.size,h.meta.mime||'');
  delete S.rx[bid]; S.done[bid]=Date.now(); hpMbSave(); hpMbDropParts([{bid:bid,N:R.n}]).catch(()=>{});
  let id=''; try{ id=await imgIdOf(blob); }catch(e){ id=''; }
  if(id!==h.meta.id||blob.size!==h.size){ hpLog('郵便受けで届いた本体の番号が合わない（捨てた）← '+nickOf(from)); return 'bad'; }
  if(histVoided(from,h.ts)){ hpLog('取り消された本体が郵便受けで届いた（入れない）← '+nickOf(from)); return 'void'; }
  const was=histLoad(from).find(x=>x.ts===h.ts&&x.d==='p');
  if(was&&!was.nb){ hpLog('同じ写真・ファイルが既にある（重ねない）'); return 'dup'; }
  const risk=h.k!=='img'&&(typeof hpFileRisky==='function')&&!!hpFileRisky(h.meta.name,h.meta.mime);
  if(!risk) await blobPut(id,blob);
  if(was){ hpMb3Patch(from,h.ts,x=>{ delete x.nb; }); const D=hpMb3Decl(); if(D[bid]){ delete D[bid]; hpMb3DeclSave(); } }
  else if(h.k==='img'){ const img={ id:id, w:h.meta.w, h:h.meta.h, size:h.size, mime:h.meta.mime, thumb:h.meta.thumb }; histAdd(from,'p','',h.ts,0,img,null,{fd:h.fd||''}); }
  else { const meta={ id:id, name:h.meta.name, size:h.size, mime:h.meta.mime }; if(risk) meta.risk=1; histAdd(from,'p','',h.ts,0,null,meta,{fd:h.fd||''}); }
  try{ if(CURPEER===from&&CONV_OPEN&&typeof histRender==='function'){ histRender(from); try{ hpReadSoon(from); }catch(e){} } }catch(e){}
  try{ if(typeof hpSceneLetter==='function') hpSceneLetter('post','in'); }catch(_){}
  try{ notifySound('msg'); }catch(e){} try{ updateBadges(); }catch(e){}
  hpLog('写真・ファイルの本体が郵便受けで届いた（本体つき・'+hpMb3Size(h.size)+'）← '+nickOf(from)); return 'ok';
}
async function hpMb3Ask2(peer, ts){
  const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='p'); if(!m||!m.nb) return 'no';
  const free=await hpMb3Free(), need=hpMb3Need(m.nb.size); if(free<need){ try{ hpToast(TF('mb3_short',{n:hpMb3Size(need-free)})); }catch(e){} return 'short'; }
  const card=hpCardOf(peer); if(!card) return 'no';
  await hpPut(card, JSON.stringify({ v:1, type:'mbq', ts:ts, bid:String(m.nb.bid||'') }), 'msg');
  const D=hpMb3Decl(); if(m.nb.bid&&D[m.nb.bid]){ D[m.nb.bid].req=Date.now(); hpMb3DeclSave(); }
  hpMb3Patch(peer,ts,x=>{ if(x.nb) x.nb.req=Date.now(); }); hpLog('送り直しを頼んだ（'+hpMb3Size(m.nb.size)+'）→ '+nickOf(peer));
  try{ if(CURPEER===peer&&typeof histRender==='function') histRender(peer); }catch(e){} return 'asked'; }
async function hpMb3OnReq(r,o){
  if(!ID||!isContact(r.from)||!Number.isFinite(o.ts)) return 'no'; const peer=r.from;
  const m=histLoad(peer).find(x=>x.ts===o.ts&&x.d==='s'); if(!m||m.x||!(m.img||m.file)) return 'no';
  if(HP_MB_BUSY.has(o.ts)) return 'busy'; HP_MB2_ST.delete(o.ts);
  hpLog('送り直しを頼まれた → 郵便受けで送り直す ← '+nickOf(peer)); hpMbSend3(peer,o.ts,null,true).catch(()=>{}); return 'resend'; }
try{ if(typeof hpOnMsg==='function'&&!hpOnMsg.__mb3){ const f=hpOnMsg; hpOnMsg=async function(r){ let o=null; try{ o=JSON.parse(r.body); }catch(e){ o=null; }
  if(o&&o.v===1&&o.type==='mbp3'){ await hpMb3In(r,o); return; } if(o&&o.v===1&&o.type==='mbq'){ await hpMb3OnReq(r,o); return; } return await f.apply(this,arguments); }; Object.assign(hpOnMsg,f,{__mb3:1}); } }catch(e){}

function hpMb3Want(b){ return new Promise(res=>{ const t=setTimeout(()=>{ HP_MB3_W.delete(b); res(null); },HP_MB3_WAIT); HP_MB3_W.set(b,o=>{ clearTimeout(t); HP_MB3_W.delete(b); res(o); }); }); }
async function hpMb3Run(){ if(HP_MB3_RUN) return; HP_MB3_RUN=true;
  try{ while(HP_MB3_Q.length){ const m=HP_MB3_Q.shift(); let ack=false;
    try{ let L=null; try{ L=JSON.parse(m.blob); }catch(e){ L=null; }
      const D=hpMb3Decl(), hint=L&&typeof L.mb==='string'?L.mb:'';
      if(hint&&D[hint]&&!D[hint].req){ await hpSend({op:'fdone',b:[m.b]}); ack=true; hpLog('受け取らない本体（場所が足りない）の切れ '+m.id); }
      else if(hpSeenLoad().has(m.id)){ await hpSend({op:'fdone',b:[m.b]}); ack=true; hpLog('重複 '+m.id+'（2 回目なので捨てた）'); }
      else { const w=hpMb3Want(m.b); await hpSend({op:'fget',b:m.b}); const o=await w;
        if(!o){ hpLog('本体を受け取れない（返事がない）'+m.id); }
        else if(o.err){ ack=true; hpLog('本体が郵便受けに無い '+m.id); }
        else if(!L){ ack=true; }
        else { L.blob=o.data; const m2=Object.assign({},m,{blob:JSON.stringify(L)}); delete m2.b; hpSeen(m.id,m.exp); hpLog('手紙 '+m.id+'（本体つき）'+o.data.length+' 文字');
          try{ await hpDeliver(m2); }catch(e){ hpLog('開けられない '+m.id+' '+e.message); if(e&&e.hpOpen) hpOpenFail(e); }
          hpSeenSave(); await hpSend({op:'fdone',b:[m.b]}); ack=true; } }
    }catch(e){ hpLog('本体つきの手紙を受け取れない '+((e&&e.message)||e)); }
    HP_MB3_IN.delete(m.id); if(ack){ POST.got.push(m.id); try{ hpSyncSoon(); }catch(e){} } } }
  finally{ HP_MB3_RUN=false; } }
try{ if(typeof hpOnOutput==='function'&&!hpOnOutput.__mb3){ const f=hpOnOutput; hpOnOutput=function(o){
  try{ if(o&&o.ok==='fget'&&typeof o.b==='string'){ const w=HP_MB3_W.get(o.b); if(w) w(o); return; } if(o&&o.err==='no body'&&typeof o.b==='string'){ const w=HP_MB3_W.get(o.b); if(w) w(o); return; } if(o&&o.ok==='fdone') return;
    if(o&&Array.isArray(o.push)&&o.push.some(m=>m&&typeof m.b==='string')){ const rest=[]; for(const m of o.push){ if(m&&typeof m.b==='string'){ if(!HP_MB3_IN.has(m.id)){ HP_MB3_IN.add(m.id); HP_MB3_Q.push(m); } } else rest.push(m); }
      hpMb3Run().catch(()=>{}); return f.call(this,Object.assign({},o,{push:rest})); } }catch(e){}
  return f.apply(this,arguments); }; Object.assign(hpOnOutput,f,{__mb3:1}); } }catch(e){}

function hpMb3Row(el, peer, m){ try{ if(!el||!m||!m.nb||el.querySelector('.hpnb')) return false; const d=document.createElement('div'); d.className='hpnb'; d.style.cssText='margin-top:4px;font-size:12px;color:var(--amber)';
  const s=document.createElement('span'); s.textContent=m.nb.req?TF('mb3_req',{size:hpMb3Size(m.nb.size)}):TF('mb3_hold',{size:hpMb3Size(m.nb.size)}); d.appendChild(s);
  if(!m.nb.req){ const b=document.createElement('button'); b.className='b'; b.type='button'; b.style.cssText='margin-left:8px;font-size:12px;padding:2px 10px'; b.textContent=T('btn_mb3_get'); b.onclick=e=>{ try{ e.stopPropagation(); }catch(_){} hpMb3Ask2(peer,m.ts).catch(()=>{}); }; d.appendChild(b); }
  const t=el.querySelector('time'); if(t) el.insertBefore(d,t); else el.appendChild(d); return true; }catch(e){ return false; } }
try{ if(typeof addMsgAt==='function'&&!addMsgAt.__mb3){ const f=addMsgAt; addMsgAt=function(kind,text,who,ts){ const r=f.apply(this,arguments);
  try{ if(kind==='peer'&&typeof CURPEER!=='undefined'&&CURPEER){ const m=histLoad(CURPEER).find(x=>x.ts===ts&&x.d==='p'); if(m&&m.nb){ const ms=document.getElementById('msgs'), d=ms&&ms.lastElementChild; if(d&&d.dataset&&d.dataset.ts===String(ts)) hpMb3Row(d,CURPEER,m); } } }catch(e){} return r; }; Object.assign(addMsgAt,f,{__mb3:1}); } }catch(e){}

function hpVidOk(file){ return !!(file&&file.id&&/^video\//.test(String(file.mime||''))&&!file.risk); }
async function hpVidMount(d, file){ try{ if(!d||!hpVidOk(file)||!d.querySelector||d.querySelector('video')) return false; const b=await blobGet(file.id); if(!b) return false;
  const v=document.createElement('video'); v.controls=true; v.preload='metadata'; v.playsInline=true; try{ v.setAttribute('playsinline',''); }catch(e){} v.style.cssText='display:block;max-width:240px;max-height:240px;border-radius:8px;margin:2px 0;background:#000';
  v.src=URL.createObjectURL(b); const fb=d.querySelector('.fb'); if(fb&&fb.parentNode===d) d.insertBefore(v,fb); else d.appendChild(v); return true; }catch(e){ return false; } }
try{ if(typeof addMsgAt==='function'&&!addMsgAt.__vid){ const f=addMsgAt; addMsgAt=function(kind,text,who,ts,voided,pend,rd,img,file){ const r=f.apply(this,arguments);
  try{ if(!voided&&hpVidOk(file)){ const ms=document.getElementById('msgs'), d=ms&&ms.lastElementChild; if(d&&d.dataset&&d.dataset.ts===String(ts)) hpVidMount(d,file).catch(()=>{}); } }catch(e){} return r; }; Object.assign(addMsgAt,f,{__vid:1}); } }catch(e){}

let HP_CHG_OPEN=false;
function hpChgFold(){ try{ const n=document.getElementById('hp-chg'); if(!n||!n.children||n.children.length<3) return false; if(n.getAttribute&&n.getAttribute('data-fold')===n.getAttribute('data-k')) return false;
  const kids=Array.from(n.children), head=kids[0], body=kids.slice(1); n.style.padding='6px 12px';
  const cnt=body.filter(b=>!(b.getAttribute&&b.getAttribute('data-chgh'))).length-1  , tg=document.createElement('button'); tg.type='button'; tg.className='b'; tg.id='hp-chg-tg'; tg.style.cssText='margin-left:10px;font-size:12px;padding:2px 10px';
  const x=document.createElement('button'); x.type='button'; x.className='b'; x.id='hp-chg-x'; x.style.cssText='margin-left:6px;font-size:12px;padding:2px 8px'; x.textContent='×'; try{ x.setAttribute('aria-label',T('btn_close')); x.title=T('btn_close'); }catch(e){} x.onclick=()=>{ HP_CHG_OPEN=false; hpChgClose(); };
  const set=()=>{ for(const b of body) b.style.display=HP_CHG_OPEN?'':'none'; tg.textContent=HP_CHG_OPEN?T('chg_less'):TF('chg_more',{n:cnt}); };
  tg.onclick=()=>{ HP_CHG_OPEN=!HP_CHG_OPEN; set(); };
  const line=document.createElement('div'); line.id='hp-chg-line'; line.style.cssText='display:flex;align-items:center;flex-wrap:wrap;gap:2px'; n.insertBefore(line,head); line.appendChild(head); head.style.display='inline'; line.appendChild(tg); line.appendChild(x);
  set(); if(n.setAttribute) n.setAttribute('data-fold',n.getAttribute('data-k')); return true; }catch(e){ return false; } }
try{ if(typeof hpChgShow==='function'&&!hpChgShow.__fold){ const f=hpChgShow; hpChgShow=function(){ const r=f.apply(this,arguments); try{ hpChgFold(); }catch(e){} return r; }; Object.assign(hpChgShow,f,{__fold:1}); } }catch(e){}

function hpMbMirror(peer, ts){ try{ if(typeof sibMirrorTs==='function'){ sibMirrorTs(peer,ts,'s'); return true; } }catch(e){} return false; }
try{ if(typeof hpMbSend2==='function'&&!hpMbSend2.__mir){ const f=hpMbSend2; hpMbSend2=async function(peer, ts){ const r=await f.apply(this,arguments); try{ if(r==='ok') hpMbMirror(peer,ts); }catch(e){} return r; }; Object.assign(hpMbSend2,f,{__mir:1}); } }catch(e){}
function hpMbMirrorOld(){ try{ if(typeof ID==='undefined'||!ID||!Array.isArray(ID.contacts)) return 0; try{ if(localStorage.getItem('p2p_mbmir2')) return 0; }catch(e){ return 0; }
  let sibs=[]; try{ sibs=(typeof hpSibs==='function')?hpSibs():[]; }catch(e){ sibs=[]; } if(!sibs.length) return 0;
  const now=Date.now(); let n=0; for(const c of ID.contacts){ const peer=c&&c.address; if(!peer) continue; for(const m of histLoad(peer)){ if(m&&m.d==='s'&&m.mb===1&&(m.img||m.file)&&!m.x){ if(typeof hpSmAdd==='function'&&hpSmAdd(peer,m.ts)) n++; } } }
  try{ localStorage.setItem('p2p_mbmir2',String(now)); }catch(e){} if(n){ try{ hpLog('郵便受けで送った写真・ファイル '+n+' 通の写しを、自分のほかの端末へ送る（前の分）'); }catch(e){} try{ if(typeof hpSmFlush==='function') Promise.resolve(hpSmFlush('前の写真')).catch(()=>{}); }catch(e){} } return n; }catch(e){ return 0; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&typeof setTimeout==='function') setTimeout(()=>{ try{ hpMbMirrorOld(); }catch(e){} },30e3); }catch(e){}

let HP_CHG_LOG_OPEN=false;
function hpChgLog(){ try{ const c=document.getElementById('rel-card'); if(!c) return false; let w=document.getElementById('rel-chg');
  if(!w){ w=document.createElement('div'); w.id='rel-chg'; w.style.cssText='margin-top:10px;border-top:1px solid var(--line,#2a3a5a);padding-top:8px'; c.appendChild(w); }
  const key=(HP_CHG_LOG_OPEN?'o':'c')+HP_CHG.length+(typeof LANG!=='undefined'?LANG:''); if(w.getAttribute&&w.getAttribute('data-k')===key) return true; if(w.setAttribute) w.setAttribute('data-k',key); w.textContent='';
  const b=document.createElement('button'); b.type='button'; b.className='b'; b.id='btn-chg-log'; b.textContent=(HP_CHG_LOG_OPEN?'▾ ':'▸ ')+TF('chg_log_h',{n:HP_CHG.length}); b.onclick=()=>{ HP_CHG_LOG_OPEN=!HP_CHG_LOG_OPEN; hpChgLog(); }; w.appendChild(b);
  if(HP_CHG_LOG_OPEN){ let lastN=-1; for(const [sg,k] of HP_CHG){ const rn=(typeof hpChgRel==='function')?hpChgRel(sg):0;
    if(rn&&rn!==lastN){ const h=document.createElement('div'); h.style.cssText='font-weight:700;margin-top:12px;color:#35d1b7;font-size:13px'; h.textContent=TF('chg_rel_h',{n:rn}); w.appendChild(h); } lastN=rn;
    const d=document.createElement('div'); d.style.cssText='white-space:pre-line;margin-top:'+(w.lastChild&&w.lastChild.className==='chg-it'?0:6)+'px;font-size:13px;line-height:1.6'; d.className='chg-it'; d.textContent=T(k); w.appendChild(d); } }
  return true; }catch(e){ return false; } }
function hpChgLogOpen(){ try{ HP_CHG_LOG_OPEN=true; const t=document.getElementById('t-sec'); if(t&&typeof t.click==='function') t.click(); try{ if(typeof menuClose==='function') menuClose(); }catch(e){} try{ hpRelUi(); }catch(e){} hpChgLog();
  const w=document.getElementById('rel-chg'); if(w&&typeof w.scrollIntoView==='function') setTimeout(()=>{ try{ w.scrollIntoView({block:'start',behavior:'smooth'}); }catch(e){} },50); return true; }catch(e){ return false; } }
function hpChgBtn(){ try{ const n=document.getElementById('hp-chg'); if(!n||!n.querySelectorAll) return false; for(const b of n.querySelectorAll('button')){ if(b.getAttribute&&b.getAttribute('data-i18n')==='btn_chg_help'){ b.setAttribute('data-i18n','btn_chg_log'); b.textContent=T('btn_chg_log'); b.onclick=()=>{ hpChgClose(); hpChgLogOpen(); }; return true; } } return false; }catch(e){ return false; } }
try{ if(typeof hpChgShow==='function'&&!hpChgShow.__log){ const f=hpChgShow; hpChgShow=function(){ const r=f.apply(this,arguments); try{ hpChgBtn(); }catch(e){} return r; }; Object.assign(hpChgShow,f,{__log:1}); } }catch(e){}
try{ if(typeof hpRelUi==='function'&&!hpRelUi.__chg){ const f=hpRelUi; hpRelUi=function(){ const r=f.apply(this,arguments); try{ hpChgLog(); }catch(e){} return r; }; Object.assign(hpRelUi,f,{__chg:1}); } }catch(e){}

const HP_EMO_G=[['face','😀','😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😚 😋 😛 😜 🤪 😝 🤗 🤭 🤫 🤔 🤐 🤨 😐 😑 😶 😏 😒 🙄 😬 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤧 🥵 🥶 😵 🤯 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 💀 👻 👽 🤖 💩'.split(' ')],['hand','👍','👍 👎 👌 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🖐️ 👋 🤚 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💪 👀 👂 👃 🙇 🙆 🙅 🙋 🤷 🤦 💁'.split(' ')],['heart','❤️','❤️ 🧡 💛 💚 💙 💜 🤎 🖤 🤍 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 💋 ✨ 🎉 🎊 🎁 🎂 🎈 🎀 🏆 🥇 🎵 🎶'.split(' ')],['nature','🌸','🌸 🌷 🌹 🌺 🌻 🌼 💐 🍀 🌿 🌱 🌲 🌳 🍁 🍂 🍃 ☀️ 🌤️ ⛅ ☁️ 🌧️ ⛈️ 🌩️ ❄️ ☃️ ⛄ 🌈 ☔ 💧 🌊 🔥 ⭐ 🌟 🌙 🌏 ⚡ 🌋 🗻'.split(' ')],['food','🍙','🍙 🍚 🍛 🍜 🍝 🍣 🍤 🍱 🍘 🍡 🍢 🍞 🥐 🥪 🍔 🍟 🍕 🌭 🥗 🍳 🍎 🍊 🍋 🍌 🍉 🍇 🍓 🍑 🍒 🥝 🍰 🎂 🍮 🍩 🍪 🍫 🍬 🍦 ☕ 🍵 🍺 🍻 🍷 🍶 🥤'.split(' ')],['animal','🐶','🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🐔 🐧 🐦 🐤 🦆 🦉 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐢 🐍 🐙 🐠 🐟 🐬 🐳 🐘 🦒 🐕 🐈'.split(' ')],['travel','🚗','🚗 🚕 🚌 🚓 🚑 🚒 🚚 🚲 🛵 🏍️ 🚃 🚄 🚅 🚇 ✈️ 🛫 🛬 🚀 🚢 ⛵ 🏠 🏡 🏢 🏥 🏫 🏨 🏪 🗼 🏯 ⛩️ 🗾 🏖️ ⛰️ 🏕️ 🎡 ♨️'.split(' ')],['thing','📷','📷 📱 💻 ⌚ 📺 📞 ✉️ 📮 📦 📝 📌 📎 ✂️ 🔑 🔒 💡 🔋 💰 💳 🎒 👓 👕 👗 👟 🎮 ⚽ ⚾ 🏀 🎾 🎣 ⏰ ⏳ 📅 ✅ ❌ ⭕ ❓ ❗ ⚠️ 💯 🆗 🆕 🔴 🟢 🔵'.split(' ')]], HP_EMO=[].concat(...HP_EMO_G.map(x=>x[2])), HP_EMO_K='p2p_emo';

function hpTblHint(){ try{ if(typeof document==='undefined'||!document.querySelectorAll) return 0; let n=0;
  if(document.head&&!document.getElementById('hp-tbl-css')){ const st=document.createElement('style'); st.id='hp-tbl-css'; st.textContent='.hp-xr{box-shadow:inset -16px 0 12px -10px rgba(53,209,183,.85)}.hp-xh{font-size:12px;color:#35d1b7;margin:4px 0 0}#contact-list .contact-item{background:#1a2742;border:1px solid #26385c;border-radius:10px;padding:9px 10px;margin:0 0 6px}#emo-pan{display:none;flex:0 0 auto;flex-direction:column;align-self:flex-end;background:#121a2b;border:1px solid var(--line,#2a3a5a);border-radius:10px;padding:4px 6px 6px;margin:0 8px 6px;max-width:560px}#emo-pan.on{display:flex}#emo-pan .emo-tabs{display:flex;flex-wrap:wrap;gap:2px;border-bottom:1px solid var(--line,#2a3a5a);padding-bottom:4px;margin-bottom:4px}#emo-pan .emo-tab{font-size:18px;line-height:1;padding:5px 7px;border:none;background:none;border-radius:6px;cursor:pointer;opacity:.55}#emo-pan .emo-tab.on{opacity:1;background:#1b2740;box-shadow:inset 0 -2px 0 #35d1b7}#emo-pan .emo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(38px,1fr));gap:2px;height:188px;overflow-y:auto;align-content:start}#emo-pan .emo-grid button{font-size:24px;line-height:1;padding:6px 0;border:none;background:none;border-radius:6px;cursor:pointer}#emo-pan .emo-grid button:hover{background:#1b2740}#cbox #btn-emo{flex:0 0 auto;margin:0 4px 5px 0;padding:6px 6px;border:none;background:none;font-size:18px;line-height:1;border-radius:8px;filter:grayscale(1);opacity:.45}#cbox #btn-emo.on,#cbox #btn-emo:hover{filter:grayscale(1);opacity:.6}'; document.head.appendChild(st); }
  for(const tb of document.querySelectorAll('table.paytb')){ let sc=tb.parentNode; for(let i=0;sc&&i<4;i++){ const ox=(sc.style&&sc.style.overflowX)||(typeof getComputedStyle==='function'&&sc.nodeType===1?getComputedStyle(sc).overflowX:''); if(ox==='auto'||ox==='scroll') break; sc=sc.parentNode; } if(!sc||!sc.parentNode||sc.nodeType!==1) continue;
    const over=sc.scrollWidth>sc.clientWidth+4, more=over&&sc.scrollLeft+sc.clientWidth<sc.scrollWidth-4; let h=sc.previousSibling&&sc.previousSibling.className==='hp-xh'?sc.previousSibling:null;
    if(more&&!h){ h=document.createElement('div'); h.className='hp-xh'; sc.parentNode.insertBefore(h,sc); } if(h){ const t=more?T('tbl_more'):''; if(h.textContent!==t) h.textContent=t; h.style.display=more?'':'none'; }
    if(sc.classList) sc.classList.toggle('hp-xr',!!more); if(!sc.__hpxs&&sc.addEventListener){ sc.__hpxs=1; sc.addEventListener('scroll',()=>{ try{ hpTblHint(); }catch(e){} },{passive:true}); } if(more) n++; }
  const d=document.getElementById('rell-state'); if(d&&d.className!=='note'){ d.className='note'; d.style.margin='0 0 6px'; d.style.lineHeight='1.6'; }
  return n; }catch(e){ return -1; } }
function hpEmoRecent(){ try{ const a=JSON.parse(localStorage.getItem(HP_EMO_K)||'[]'); return Array.isArray(a)?a.filter(x=>typeof x==='string'&&x.length<=16).slice(0,16):[]; }catch(e){ return []; } }
function hpEmoPut(e){ try{ const t=document.getElementById('text'); if(!t||t.disabled) return false; const v=String(t.value||''), a=typeof t.selectionStart==='number'?t.selectionStart:v.length, b=typeof t.selectionEnd==='number'?t.selectionEnd:a;
  t.value=v.slice(0,a)+e+v.slice(b); const p=a+e.length; try{ t.setSelectionRange(p,p); }catch(x){}
  try{ t.dispatchEvent(new Event('input',{bubbles:true})); }catch(x){} try{ if(typeof hpTextFit==='function') hpTextFit(); }catch(x){}
  try{ const r=[e].concat(hpEmoRecent().filter(x=>x!==e)).slice(0,16); localStorage.setItem(HP_EMO_K,JSON.stringify(r)); }catch(x){} try{ t.focus({preventScroll:true}); }catch(x){} return true; }catch(x){ return false; } }
let HP_EMO_TAB=''; const HP_EMO_GT={recent:'emo_g_recent',face:'emo_g_face',hand:'emo_g_hand',heart:'emo_g_heart',nature:'emo_g_nature',food:'emo_g_food',animal:'emo_g_animal',travel:'emo_g_travel',thing:'emo_g_thing'};
function hpEmoFill(p){ p.textContent=''; const R=hpEmoRecent(); if(!HP_EMO_TAB) HP_EMO_TAB=R.length?'recent':'face'; if(HP_EMO_TAB==='recent'&&!R.length) HP_EMO_TAB='face';
  const tabs=document.createElement('div'); tabs.className='emo-tabs'; const T0=[['recent','🕘']].concat(HP_EMO_G.map(x=>[x[0],x[1]]));
  for(const [k,ic] of T0){ if(k==='recent'&&!R.length) continue; const b=document.createElement('button'); b.type='button'; b.textContent=ic; b.className='emo-tab'+(k===HP_EMO_TAB?' on':''); try{ b.title=T(HP_EMO_GT[k]); b.setAttribute('aria-label',T(HP_EMO_GT[k])); }catch(e){}
    b.onmousedown=ev=>{ try{ ev.preventDefault(); }catch(x){} }; b.onclick=()=>{ HP_EMO_TAB=k; hpEmoFill(p); }; tabs.appendChild(b); }
  p.appendChild(tabs); const grid=document.createElement('div'); grid.className='emo-grid'; p.appendChild(grid);
  const L=HP_EMO_TAB==='recent'?R:((HP_EMO_G.find(x=>x[0]===HP_EMO_TAB)||HP_EMO_G[0])[2]);
  for(const e of L){ const b=document.createElement('button'); b.type='button'; b.textContent=e; b.onmousedown=ev=>{ try{ ev.preventDefault(); }catch(x){} }; b.onclick=()=>{ hpEmoPut(e); }; grid.appendChild(b); }
  return grid.children.length; }
function hpEmoMount(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const cb=document.getElementById('cbox'), cp=document.getElementById('composer'); if(!cb||!cp||!cp.parentNode) return '';
  if(document.getElementById('btn-emo')) return 'have';
  const p=document.createElement('div'); p.id='emo-pan'; cp.parentNode.insertBefore(p,cp);
  const b=document.createElement('button'); b.type='button'; b.className='b'; b.id='btn-emo'; b.textContent='😊'; try{ b.title=T('tip_emoji'); b.setAttribute('data-i18n-title','tip_emoji'); }catch(e){}
  b.onmousedown=ev=>{ try{ ev.preventDefault(); }catch(x){} }; b.onclick=()=>{ const on=!p.classList.contains('on'); if(on) hpEmoFill(p); p.classList.toggle('on',on); b.classList.toggle('on',on); };
  cb.appendChild(b);
  try{ document.addEventListener('keydown',ev=>{ if(ev.key==='Escape'&&p.classList.contains('on')){ p.classList.remove('on'); b.classList.remove('on'); } }); }catch(e){}
  try{ const s=document.getElementById('btn-send'); if(s&&s.addEventListener) s.addEventListener('click',()=>{ p.classList.remove('on'); b.classList.remove('on'); }); }catch(e){}
  return 'made'; }catch(e){ return ''; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setInterval==='function'){ const go=()=>{ try{ hpEmoMount(); }catch(e){} try{ hpTblHint(); }catch(e){} }; if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',go); else go(); setInterval(()=>{ try{ hpTblHint(); }catch(e){} },2000); try{ window.addEventListener('resize',()=>{ try{ hpTblHint(); }catch(e){} }); }catch(e){} } }catch(e){}

const HP_EST_DAYS=30;
function hpPayPeriod(ym,first,now){ const y=Number(String(ym).slice(0,4)), m=Number(String(ym).slice(5,7))-1; if(!(y>0)||!(m>=0)) return null; const ms=new Date(y,m,1).getTime(), me=new Date(y,m+1,0).getTime();
  const f=new Date(Number(first)); const f0=new Date(f.getFullYear(),f.getMonth(),f.getDate()).getTime(), n=new Date(Number(now)), n0=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime();
  const a=Math.max(ms,f0), b=Math.min(me,n0); if(b<a) return null; const md=t=>{ const d=new Date(t); return (d.getMonth()+1)+'/'+d.getDate(); }; return {a:md(a),b:md(b),n:Math.round((b-a)/864e5)+1}; }
function hpPayEst(rows,px,now){ if(!rows||!rows.length) return null; let first=Infinity; for(const r of rows) if(Number(r.at)<first) first=Number(r.at); if(!isFinite(first)) return null;
  const f=new Date(first), n=new Date(Number(now)), days=Math.max(1,Math.round((new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime()-new Date(f.getFullYear(),f.getMonth(),f.getDate()).getTime())/864e5)+1);
  let evr=0, xah=0, v=0, miss=0; for(const m of hpPayMonths(rows,px||{})){ evr+=m.tot.evr; xah+=m.tot.xah; v+=m.tot.v; miss+=m.tot.miss; }
  const k=HP_EST_DAYS/days; return {evr:Math.max(0,evr*k), xah:Math.max(0,xah*k), v:miss?null:Math.max(0,v*k), days:days}; }
function hpPayMonPlus(){ try{ if(typeof document==='undefined'||!document.getElementById) return -1; const box=document.getElementById('pay-mon'), tb=document.getElementById('pay-mon-tb'); if(!box||!tb||typeof HP_PAY==='undefined'||!HP_PAY||!HP_PAY.rows||!HP_PAY.rows.length) return 0;
  const now=Date.now(), first=Math.min(...HP_PAY.rows.map(r=>Number(r.at)||Infinity)); let n=0;
  const trs=tb.querySelectorAll?Array.from(tb.querySelectorAll('tr')):(tb.children||[]);
  for(const tr of trs){ const c0=tr.children&&tr.children[0]; if(!c0||c0.tagName==='TH'||c0.getAttribute&&c0.getAttribute('data-per')) continue; const P=hpPayPeriod(c0.textContent,first,now); if(!P) continue;
    const d=document.createElement('div'); d.textContent=TF('pay_per',P); d.style.cssText='font-size:11px;color:var(--dim);white-space:nowrap'; c0.appendChild(d); if(c0.setAttribute) c0.setAttribute('data-per','1'); n++; }
  const cur=hpPayCur(), E=hpPayEst(HP_PAY.rows,hpPxMap(cur),now);
  let e=document.getElementById('pay-est'); if(!e){ e=document.createElement('div'); e.id='pay-est'; e.className='note'; e.style.cssText='white-space:pre-line;margin-top:8px;color:var(--ink)'; box.appendChild(e); } else if(e.parentNode!==box) box.appendChild(e);
  if(!E){ e.textContent=''; e.style.display='none'; return n; }
  const coin=(typeof hpPayCoin==='function')?hpPayCoin(E.evr,E.xah):(E.evr+' EVR');
  e.textContent=(E.v!=null?TF('pay_est',{v:hpCurTxt(E.v,cur,false),c:coin}):TF('pay_est0',{c:coin}))+'\n'+TF('pay_est_nt',{n:E.days}); e.style.display='';
  return n; }catch(err){ return -1; } }

function hpSrHere(){ try{ const pc=document.getElementById('p-chat'); if(typeof CURPEER==='undefined'||!CURPEER||!pc) return null; if(pc.classList&&pc.classList.contains('list-mode')) return null; if(pc.offsetParent===null&&pc.style&&pc.style.display==='none') return null; return CURPEER; }catch(e){ return null; } }
function hpF26Boot(){ try{ if(typeof document==='undefined'||!document.getElementById) return false;
  if(document.head&&!document.getElementById('hp-f26-css')){ const st=document.createElement('style'); st.id='hp-f26-css'; st.textContent='#btn-conv-sr{display:none!important}@media (hover:none) and (pointer:coarse){#cbox #btn-emo,#emo-pan{display:none!important}}'; document.head.appendChild(st); }
  const bs=document.getElementById('btn-search'); if(bs&&!bs.__f26){ bs.__f26=1; bs.onclick=()=>{ try{ hpSrOpen(hpSrHere()); }catch(e){} }; } return true; }catch(e){ return false; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setTimeout==='function'){ const go=()=>{ hpF26Boot(); setTimeout(hpF26Boot,1500); }; if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',go); else go(); } }catch(e){}
try{ if(typeof hpPayMonDraw==='function'&&!hpPayMonDraw.__est){ const f=hpPayMonDraw; hpPayMonDraw=function(){ const r=f.apply(this,arguments); try{ hpPayMonPlus(); }catch(e){} return r; }; Object.assign(hpPayMonDraw,f,{__est:1}); } }catch(e){}

const HP_HC_WAIT=15000, HP_HC_HB_OK=90*60e3; let HP_HC_BUSY=false, HP_HC_LAST=null;

const HP_HC_RECENT=5*60e3; let HP_HC_AGAIN=null;
function hpHcRec(url,now){ try{ if(typeof hpHlBox!=='function'||typeof hpHlKey!=='function') return -1; const B=hpHlBox(hpHlKey(url),false), ag=(B&&B.okAt)?(now||Date.now())-B.okAt:-1; return (ag>=0&&ag<=HP_HC_RECENT)?ag:-1; }catch(e){ return -1; } }
function hpHcAgain(ms){ try{ if(HP_HC_AGAIN) clearTimeout(HP_HC_AGAIN); HP_HC_AGAIN=setTimeout(()=>{ HP_HC_AGAIN=null; try{ const c=document.getElementById('post-health'), tp=document.getElementById('p-post'); if(!c||(tp&&tp.offsetParent===null)) return; hpHcRun().catch(()=>{}); }catch(e){} },Math.max(1000,ms+1000)); return true; }catch(e){ return false; } }
function hpHcVerdict(R){ if(!R) return ''; if(R.net===false) return 'hc_v_net'; if(R.wait>0&&!(R.rec>=0)) return 'hc_v_wait'; if(R.conn&&R.ans) return 'hc_v_ok'; if(R.conn&&!R.ans) return 'hc_v_slow'; if(R.hb==='ng') return 'hc_v_down'; if(R.hb==='ok') return 'hc_v_prog'; return 'hc_v_unk'; }
async function hpHcConn(url){ const out={conn:false,cms:0,ans:false,ams:0}; if(!url||typeof HotPocket==='undefined'||!HotPocket||!HotPocket.createClient) return out;
  try{ const ck=hpConnKey([url]), w=Math.max((typeof hpConnWait==='function')?hpConnWait(ck):0,(typeof hpSusWait==='function')?hpSusWait(ck):0); if(w>0){ out.wait=w; return out; } }catch(e){}
  const t0=Date.now(); let c=null; const lim=(p,ms)=>Promise.race([p,new Promise(r=>setTimeout(()=>r('__t'),ms))]);
  try{ c=await lim(HotPocket.createClient([url],await HotPocket.generateKeys()),HP_HC_WAIT); if(c==='__t') c=null; else if(c) hpGateWrap(c,url,null,'郵便受けの状態を調べる'); }catch(e){ c=null; }
  if(c){ let up=false; try{ up=await lim(c.connect(),HP_HC_WAIT); }catch(e){ up=false; } out.cms=Date.now()-t0;
    if(up===true){ out.conn=true; let got=false; try{ c.on(HotPocket.events.contractOutput,()=>{ got=true; }); }catch(e){} const t1=Date.now();
      try{ await lim(c.submitContractInput(JSON.stringify({op:'ver'})),HP_HC_WAIT); }catch(e){}
      while(!got&&Date.now()-t1<HP_HC_WAIT) await new Promise(r=>setTimeout(r,100)); out.ans=got; out.ams=Date.now()-t1; }
    try{ const r=c.close(); if(r&&r.catch) r.catch(()=>{}); }catch(e){} }
  else out.cms=Date.now()-t0; return out; }
async function hpHcHb(){ try{ const addr=hpHlHostAddr(), aid=addr?hpHlAid(addr):''; if(!aid) return {hb:'none'}; const key='45565203'+'0'.repeat(16)+aid;
    const r=await hpXahauSess(q=>q({command:'ledger_entry',hook_state:{account:HP_GOV,key:key,namespace_id:HP_EVN_NS},ledger_index:'validated'}),20000);
    const d=hpHostDecode(key,(r&&r.node&&r.node.HookStateData)||''); if(!d||!d.lhb) return {hb:'na'}; const age=Math.max(0,Date.now()-d.lhb*1000); return {hb:age<=HP_HC_HB_OK?'ok':'ng',age:age}; }catch(e){ return {hb:'na'}; } }
async function hpHcRun(){ if(HP_HC_BUSY) return HP_HC_LAST; HP_HC_BUSY=true; hpHcDraw(); try{
    const net=!(typeof navigator!=='undefined'&&navigator&&navigator.onLine===false), url=(typeof hpPostUrl==='function')?hpPostUrl():'';
    const [C,H]=await Promise.all([net?hpHcConn(url):Promise.resolve({conn:false,cms:0,ans:false,ams:0}),net?hpHcHb():Promise.resolve({hb:'na'})]);
    if(C.wait>0){ const rg=hpHcRec(url); if(rg>=0){ C.rec=rg; C.conn=true; C.ans=true; } else hpHcAgain(C.wait); }
    HP_HC_LAST=Object.assign({at:Date.now(),net:net},C,H); try{ hpLog('郵便受けの状態をいま調べた：回線 '+(net?'○':'×')+'・つながる '+(C.conn?'○ '+C.cms+'ms':'×')+'・答える '+(C.ans?'○ '+C.ams+'ms':'×')+'・心拍 '+H.hb); }catch(e){} }
  finally{ HP_HC_BUSY=false; try{ hpHcDraw(); }catch(e){} } return HP_HC_LAST; }
function hpHcLines(R){ const s=ms=>hpNum(Math.max(0,ms)/1000,1), L=[]; if(!R) return L;
  L.push(T(R.net?'hc_net_ok':'hc_net_ng'));
  if(R.net){ if(R.rec>=0){ const ag=TF('hs_ago',{t:hpDur(R.rec)}); L.push(TF('hc_conn_rec',{t:ag}),TF('hc_ans_rec',{t:ag})); }
    else { L.push(R.wait>0?TF('hc_conn_wait',{s:Math.ceil(R.wait/1000)}):R.conn?TF('hc_conn_ok',{s:s(R.cms)}):TF('hc_conn_ng',{s:s(R.cms)})); L.push(!R.conn?T('hc_ans_na'):R.ans?TF('hc_ans_ok',{s:s(R.ams)}):T('hc_ans_ng')); }
    const ago=TF('hs_ago',{t:hpDur(R.age)}); L.push(R.hb==='ok'?TF('hc_hb_ok',{t:ago}):R.hb==='ng'?TF('hc_hb_ng',{t:ago}):R.hb==='none'?T('hc_hb_none'):T('hc_hb_na')); }
  return L; }
function hpHcDraw(){ try{ const card=document.getElementById('post-health'); if(!card) return false; let w=document.getElementById('hc-now');
    if(!w){ w=document.createElement('div'); w.id='hc-now'; w.style.cssText='margin:6px 0 10px;padding:8px 10px;border:1px solid var(--line,#2a3a5a);border-radius:8px;font-size:13px;line-height:1.7'; const h=card.querySelector?card.querySelector('h2'):null; if(h&&h.nextSibling) card.insertBefore(w,h.nextSibling); else card.appendChild(w); }
    w.textContent=''; const R=HP_HC_LAST, add=(t,c,b)=>{ const d=document.createElement('div'); d.textContent=t; if(c) d.style.color=c; if(b) d.style.fontWeight='700'; w.appendChild(d); return d; };
    if(HP_HC_BUSY) add(T('hc_busy'),'var(--dim)'); else if(R){ const tm=new Date(R.at), p=n=>String(n).padStart(2,'0'); add(TF('hc_title',{t:p(tm.getHours())+':'+p(tm.getMinutes())}),'var(--dim)'); for(const t of hpHcLines(R)) add(t); const v=hpHcVerdict(R); if(v==='hc_v_wait') add(TF(v,{s:Math.ceil(R.wait/1000)}),'var(--dim)'); else add(T(v),v==='hc_v_ok'?'var(--teal)':'var(--amber)',true); }
    else add(T('hc_none'),'var(--dim)');
    const b=document.createElement('button'); b.type='button'; b.className='b'; b.id='btn-hc-run'; b.textContent=T('btn_hc_run'); b.disabled=HP_HC_BUSY; b.style.marginTop='6px'; b.onclick=()=>{ hpHcRun().catch(()=>{}); }; w.appendChild(b); return true; }catch(e){ return false; } }
function hpHcOpen(){ try{ const t=document.getElementById('t-post'); if(t&&t.click) t.click(); setTimeout(()=>{ try{ const c=document.getElementById('post-health'); if(c){ if(c.style&&c.style.display==='none') c.style.display=''; hpHcDraw(); if(c.scrollIntoView) c.scrollIntoView({behavior:'smooth',block:'start'}); } }catch(e){} },80); hpHcRun().catch(()=>{}); return true; }catch(e){ return false; } }
function hpHcWire(){ try{ const c=document.getElementById('cap-rly'); if(!c||c.__hc) return false; c.__hc=1; c.style.cursor='pointer'; try{ c.title=T('hc_tip'); c.setAttribute('role','button'); c.tabIndex=0; }catch(e){} c.addEventListener('click',e=>{ try{ e.stopPropagation(); }catch(_){} hpHcOpen(); }); c.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ try{ e.preventDefault(); }catch(_){} hpHcOpen(); } }); return true; }catch(e){ return false; } }
function hpDevMainBox(d){ try{ if(!d||d.role!=='main') return ''; let u=''; if(d.me) u=String((typeof POST!=='undefined'&&POST&&POST.url)||((typeof hpPostUrl==='function')?hpPostUrl():'')||''); else if(d.dev&&typeof hpMcBoxOf==='function') u=String(hpMcBoxOf(d.dev)||''); return u?TF('dv_box_main',{h:u.replace(/^wss:\/\//,'')}):''; }catch(e){ return ''; } }
function hpDevMainRow(){ try{ if(typeof hpDevRows!=='function') return 0; const rows=hpDevRows(); let n=0; rows.forEach((d,i)=>{ if(!d||d.role!=='main') return; const row=hpDlRow(i), nm=row&&row.querySelector?row.querySelector('.nm'):null; if(!nm||nm.querySelector('.dv-mbox')) return; const t=hpDevMainBox(d); if(!t) return; const s=document.createElement('span'); s.className='dv-mbox'; s.style.whiteSpace='normal'; s.textContent=t; nm.appendChild(s); n++; }); return n; }catch(e){ return 0; } }
try{ if(typeof renderDevices==='function'&&!renderDevices.__mb){ const f=renderDevices; renderDevices=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpDevMainRow(); }catch(e){} return v; },f,{__mb:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setInterval==='function'){ const go=()=>{ hpHcWire(); }; if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',go); else go(); setInterval(()=>{ try{ hpHcWire(); }catch(e){} },5000); } }catch(e){}

function hpLeaseWire(){ let n=0; try{ if(typeof document==='undefined'||!document.getElementById) return 0;
  for(const id of ['lease-rly','lease-peer','lease-bar-rly','lease-bar-peer']){ const el=document.getElementById(id); if(!el||el.__lw) continue; el.__lw=1; n++; try{ el.style.cursor='pointer'; el.setAttribute('role','button'); el.tabIndex=0; el.title=T('lease_tip'); }catch(e){}
    const go=e=>{ try{ if(e&&e.target&&e.target.closest&&e.target.closest('.lease-go')) return;   if(e&&e.stopPropagation) e.stopPropagation(); if(typeof hpLeaseGo==='function') hpLeaseGo(); }catch(_){} };
    el.addEventListener('click',go); el.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ try{ e.preventDefault(); }catch(_){} go(e); } }); } }catch(e){} return n; }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setInterval==='function'){ const go=()=>{ hpLeaseWire(); }; if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',go); else go(); setInterval(()=>{ try{ hpLeaseWire(); }catch(e){} },5000); } }catch(e){}

const HP_RC_DEF=['👍','❤️','😆','😮','😢','🙏'], HP_RC_SET='p2p_rcset', HP_RC_Q='p2p_rcq';
function hpRcOk(e){ return typeof e==='string'&&(e===''||(e.length<=16&&!/[<>&"'`\s]/.test(e))); }
function hpRcSet6(){ try{ const a=JSON.parse(localStorage.getItem(HP_RC_SET)||'null'); if(Array.isArray(a)){ const b=a.filter(x=>hpRcOk(x)&&x).slice(0,6); for(const x of HP_RC_DEF) if(b.length<6&&b.indexOf(x)<0) b.push(x); return b; } }catch(e){} return HP_RC_DEF.slice(); }
function hpRcFront(e){ try{ const a=[e].concat(hpRcSet6().filter(x=>x!==e)).slice(0,6); localStorage.setItem(HP_RC_SET,JSON.stringify(a)); return a; }catch(x){ return hpRcSet6(); } }
function hpRcPatch(peer,ts,d,fn){ try{ const h=histLoad(peer), m=h.find(x=>x.ts===ts&&x.d===d); if(!m) return null; fn(m); if(m.rc&&!m.rc.m&&!m.rc.p) delete m.rc; histSave(peer,h); return m; }catch(e){ return null; } }
function hpRcEl(ts,d){ try{ const ms=document.getElementById('msgs'); if(!ms||!ms.querySelectorAll) return null; for(const el of ms.querySelectorAll('.m')){ if(el.dataset&&el.dataset.ts===String(ts)&&el.classList&&el.classList.contains(d==='s'?'self':'peer')) return el; } }catch(e){} return null; }
function hpRcPaint(el,rec){ try{ if(!el) return false; let c=null; for(const x of Array.from(el.children||[])) if(x.className==='rc'){ c=x; break; } const rc=rec&&rec.rc; if(!rc||(!rc.m&&!rc.p)){ if(c&&c.parentNode) c.parentNode.removeChild(c); try{ el.classList.remove('has-rc'); }catch(_){} return false; } try{ el.classList.add('has-rc'); }catch(_){}
  if(!c){ c=document.createElement('div'); c.className='rc'; el.appendChild(c); } c.textContent=''; const add=(e,mine)=>{ const s=document.createElement('span'); s.textContent=e; s.className=mine?'rc-me':'rc-p'; try{ s.title=T(mine?'rc_mine':'rc_peer'); }catch(_){} if(mine&&rec&&typeof CURPEER!=='undefined'&&CURPEER){ const peer=CURPEER, ts=rec.ts; s.setAttribute('role','button'); s.style.cursor='pointer'; s.onclick=ev=>{ try{ ev.stopPropagation(); }catch(_){} hpRcSheet(e2=>{ hpRcSetMine(peer,ts,'p',e2); }); }; } c.appendChild(s); return s; };
  if(rec.d==='s'){ if(rc.p) add(rc.p,false); } else if(rc.m){ const sp=add(rc.m,true); } if(!c.children.length){ if(c.parentNode) c.parentNode.removeChild(c); try{ el.classList.remove('has-rc'); }catch(_){} return false; } return true; }catch(e){ return false; } }
function hpRcQ(){ try{ const a=JSON.parse(localStorage.getItem(HP_RC_Q)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function hpRcQSave(a){ try{ localStorage.setItem(HP_RC_Q,JSON.stringify(a.slice(-200))); }catch(e){} }
async function hpRcSend(peer,ts,w,e){ const card=(typeof hpCardOf==='function')?hpCardOf(peer):null; const q=hpRcQ().filter(x=>!(x.peer===peer&&x.ts===ts&&x.w===w));
  if(!card){ q.push({peer,ts,w,e,at:Date.now()}); hpRcQSave(q); return false; }
  try{ await hpPut(card,JSON.stringify({v:1,type:'react',id:ts,w:w,e:e}),'msg'); hpRcQSave(q); hpLog('リアクションを知らせた → '+nickOf(peer)+'（'+(e||'外した')+'）'); return true; }
  catch(err){ q.push({peer,ts,w,e,at:Date.now()}); hpRcQSave(q); hpLog('リアクションを知らせられない → '+nickOf(peer)+'（あとで送り直す）'); return false; } }
function hpRcSetMine(peer,ts,d,e){ if(!hpRcOk(e)||d!=='p') return null; let now=''; const m=hpRcPatch(peer,ts,d,x=>{ const cur=(x.rc&&x.rc.m)||''; now=(cur===e)?'':e; x.rc=Object.assign({},x.rc||{},{m:now}); }); if(!m) return null;
  if(now) hpRcFront(now); try{ if(typeof CURPEER!=='undefined'&&CURPEER===peer) hpRcPaint(hpRcEl(ts,d),m); }catch(e2){} hpRcSend(peer,ts,d,now).catch(()=>{}); return now; }
function hpRcIn(from,o){ try{ if(!o||typeof o.id!=='number'||!(o.id>0)||(o.w!=='s'&&o.w!=='p')||!hpRcOk(o.e)) return false; if(o.w!=='p'){ hpLog('自分の手紙へのリアクションが届いた（この版では出さない）← '+nickOf(from)); return false; } const d='s';
    const m=hpRcPatch(from,o.id,d,x=>{ x.rc=Object.assign({},x.rc||{},{p:o.e}); }); if(!m){ hpLog('リアクションが届いた（手元に無い 1 通。捨てた）← '+nickOf(from)); return false; }
    hpLog('リアクションが届いた ← '+nickOf(from)+'（'+(o.e||'外した')+'）'); try{ if(typeof CURPEER!=='undefined'&&CURPEER===from) hpRcPaint(hpRcEl(o.id,d),m); }catch(e){} return true; }catch(e){ return false; } }
async function hpRcRetry(){ const q=hpRcQ(); if(!q.length) return 0; let n=0; for(const x of q.slice(0,10)){ if(await hpRcSend(x.peer,x.ts,x.w,x.e)) n++; } return n; }
try{ if(typeof hpOnMsg==='function'&&!hpOnMsg.__rc){ const f=hpOnMsg; hpOnMsg=async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){ o=null; }
    if(o&&o.v===1&&o.type==='react'){ if(typeof ID==='undefined'||!ID||r.from===ID.address) return; const c=(Array.isArray(ID.contacts)?ID.contacts:[]).find(x=>x.address===r.from); if(!c){ hpLog('知らない人からのリアクション（捨てた）'); return; } if(c.pubKey&&c.pubKey!==r.fromMaster){ hpLog('マスター鍵が連絡先のものと違う '+r.from+'（捨てた）'); return; } hpRcIn(r.from,o); return; }
    return f.apply(this,arguments); }; Object.assign(hpOnMsg,f,{__rc:1}); } }catch(e){}
try{ if(typeof addMsgAt==='function'&&!addMsgAt.__rc){ const f=addMsgAt; addMsgAt=function(kind,text,who,ts){ const r=f.apply(this,arguments); try{ if(typeof CURPEER!=='undefined'&&CURPEER&&(kind==='self'||kind==='peer')){ const d=kind==='self'?'s':'p', rec=histLoad(CURPEER).find(x=>x.ts===ts&&x.d===d); if(rec&&rec.rc) hpRcPaint(hpRcEl(ts,d),rec); } }catch(e){} return r; }; Object.assign(addMsgAt,f,{__rc:1}); } }catch(e){}

function hpRcSheetClose(){ try{ const w=document.getElementById('rc-sheet'); if(w&&w.parentNode) w.parentNode.removeChild(w); }catch(e){} }
function hpRcSheet(onPick){ try{ hpRcSheetClose(); const w=document.createElement('div'); w.id='rc-sheet'; const bg=document.createElement('div'); bg.className='rc-bg'; bg.onclick=()=>hpRcSheetClose(); const p=document.createElement('div'); p.className='rc-pane';
    const hd=document.createElement('div'); hd.className='rc-hd'; const tt=document.createElement('b'); tt.textContent=T('rc_pick'); const x=document.createElement('button'); x.type='button'; x.className='rc-x'; x.textContent='×'; try{ x.setAttribute('aria-label',T('btn_close')); }catch(_){} x.onclick=()=>hpRcSheetClose(); hd.appendChild(tt); hd.appendChild(x);
    const G=[['rc6','🕘',hpRcSet6()]].concat((typeof HP_EMO_G!=='undefined'&&Array.isArray(HP_EMO_G))?HP_EMO_G:[]), tabs=document.createElement('div'), grid=document.createElement('div'); tabs.className='rc-tabs'; grid.className='rc-grid';
    const fill=k=>{ grid.textContent=''; for(const t of Array.from(tabs.children)) t.className=(t.getAttribute('data-k')===k)?'on':''; const L=(G.find(x=>x[0]===k)||G[0])[2]; for(const e of L){ const b=document.createElement('button'); b.type='button'; b.textContent=e; b.onclick=()=>{ hpRcSheetClose(); try{ onPick(e); }catch(_){} }; grid.appendChild(b); } };
    for(const g of G){ const t=document.createElement('button'); t.type='button'; t.textContent=g[1]; t.setAttribute('data-k',g[0]); try{ t.title=T(g[0]==='rc6'?'emo_g_recent':(HP_EMO_GT[g[0]]||'')); }catch(_){} t.onclick=()=>fill(g[0]); tabs.appendChild(t); }
    p.appendChild(hd); p.appendChild(tabs); p.appendChild(grid); w.appendChild(bg); w.appendChild(p); document.body.appendChild(w); fill('rc6');
    try{ const esc=e=>{ if(e.key==='Escape'){ hpRcSheetClose(); document.removeEventListener('keydown',esc); } }; document.addEventListener('keydown',esc); }catch(_){} return true; }catch(e){ return false; } }
function hpRcRow(m,peer,ts,d){ const row=document.createElement('div'); row.className='rc-row'; const cur=(()=>{ const rec=histLoad(peer).find(x=>x.ts===ts&&x.d===d); return (rec&&rec.rc&&rec.rc.m)||''; })();
  const pick=e=>{ hpMenuClose(); hpRcSetMine(peer,ts,d,e); };
  for(const e of hpRcSet6()){ const b=document.createElement('button'); b.type='button'; b.textContent=e; if(e===cur) b.className='on'; b.onclick=ev=>{ try{ ev.stopPropagation(); }catch(_){} pick(e); }; row.appendChild(b); }
  const more=document.createElement('button'); more.type='button'; more.textContent='…'; more.className='more'; try{ more.title=T('rc_more'); }catch(_){}
  more.onclick=ev=>{ try{ ev.stopPropagation(); }catch(_){} hpMenuClose(); hpRcSheet(e=>{ hpRcSetMine(peer,ts,d,e); }); };
  row.appendChild(more); return row; }
try{ if(typeof hpBubbleMenu==='function'&&!hpBubbleMenu.__rc){ const f=hpBubbleMenu; hpBubbleMenu=function(el,ts,kind){ const r=f.apply(this,arguments); try{ const m=document.getElementById('bmenu'); if(r&&m&&typeof CURPEER!=='undefined'&&CURPEER){ const d=kind==='self'?'s':'p', rec=histLoad(CURPEER).find(x=>x.ts===ts&&x.d===d); if(d==='p'&&rec&&!rec.x) m.insertBefore(hpRcRow(m,CURPEER,ts,d),m.firstChild||null);   } }catch(e){} return r; }; Object.assign(hpBubbleMenu,f,{__rc:1}); } }catch(e){}
try{ if(typeof document!=='undefined'&&document&&document.head&&!document.getElementById('hp-rc-css')){ const st=document.createElement('style'); st.id='hp-rc-css'; st.textContent='#bmenu.rc-wide{max-width:340px}#bmenu .rc-row{flex:1 0 100%;display:flex;flex-wrap:wrap;gap:0;padding:2px 0 6px;border-bottom:1px solid var(--line,#2a3a5a);margin-bottom:4px}#bmenu .rc-row button{font-size:21px;line-height:1;padding:5px;border:none;background:none;border-radius:8px;min-width:0;width:auto}#bmenu .rc-row button.on{background:#1b2740;box-shadow:inset 0 -2px 0 #35d1b7}#bmenu .rc-row button.more{font-size:18px;color:var(--dim)}#rc-sheet{position:fixed;inset:0;z-index:80}#rc-sheet .rc-bg{position:absolute;inset:0;background:rgba(0,0,0,.45)}#rc-sheet .rc-pane{position:absolute;left:0;right:0;bottom:0;max-width:560px;margin:0 auto;background:var(--panel,#121a2b);border-radius:16px 16px 0 0;padding:10px 12px calc(10px + env(safe-area-inset-bottom,0px));color-scheme:dark}#rc-sheet .rc-hd{display:flex;align-items:center;justify-content:center;position:relative;padding:4px 0 10px}#rc-sheet .rc-hd b{font-size:16px}#rc-sheet .rc-x{position:absolute;right:0;top:0;font-size:24px;line-height:1;padding:4px 10px;border:none;background:none;color:var(--ink)}#rc-sheet .rc-tabs{display:flex;flex-wrap:wrap;gap:4px;padding-bottom:6px;margin-bottom:6px;border-bottom:1px solid var(--line,#2a3a5a)}#rc-sheet .rc-tabs button{font-size:20px;line-height:1;padding:7px 9px;border:none;background:none;border-radius:10px;opacity:.55}#rc-sheet .rc-tabs button.on{opacity:1;background:#1b2740;box-shadow:inset 0 -2px 0 #35d1b7}#rc-sheet .rc-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;height:min(46vh,340px);overflow-y:auto;align-content:start}#rc-sheet .rc-grid button{font-size:30px;line-height:1;padding:8px 0;border:none;background:none;border-radius:10px}#rc-sheet .rc-grid button:hover{background:#1b2740}#msgs .m.has-rc{position:relative;margin-bottom:38px}#msgs .m .rc{position:absolute;top:calc(100% + 4px);display:flex;gap:3px;z-index:1}#msgs .m.self .rc{right:10px}#msgs .m.peer .rc{left:10px}#msgs .m .rc span{font-size:18px;line-height:1;padding:0 1px;background:none;border:none;box-shadow:none}'; document.head.appendChild(st); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof setInterval==='function') setInterval(()=>{ hpRcRetry().catch(()=>{}); },60e3); }catch(e){}

const HP_RC_SQ='p2p_rcsq', HP_RC_PEND='p2p_rcpend', HP_RC_PKEEP=7*864e5;
function hpRcLs(k){ try{ const a=JSON.parse(localStorage.getItem(k)||'[]'); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
function hpRcLsSet(k,a){ try{ localStorage.setItem(k,JSON.stringify(a.slice(-200))); }catch(e){} }
async function hpRcSibSend(peer,ts,e,at){ let sibs=[]; try{ sibs=hpSibs(); }catch(x){ sibs=[]; } if(!sibs.length) return true; const q=hpRcLs(HP_RC_SQ).filter(x=>!(x&&x.peer===peer&&x.ts===ts));
  try{ if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) throw new Error('郵便受けにつながっていない'); await hpSibPut({v:1,type:'sibrc',peer:peer,ts:ts,e:e,at:at}); hpRcLsSet(HP_RC_SQ,q); try{ hpLog('リアクションを自分のほかの端末へ知らせた（'+(e||'外した')+'）'); }catch(_){} return true; }
  catch(err){ q.push({peer:peer,ts:ts,e:e,at:at}); hpRcLsSet(HP_RC_SQ,q); return false; } }
async function hpRcSibRetry(){ const q=hpRcLs(HP_RC_SQ); let n=0; for(const x of q.slice(0,10)){ if(x&&await hpRcSibSend(x.peer,x.ts,x.e,x.at)) n++; } return n; }

function hpRcMineApply(peer,ts,e,at){ let ch=false; const m=hpRcPatch(peer,ts,'p',x=>{ const ma=(x.rc&&x.rc.ma)||0; if(ma&&ma>=at) return; x.rc=Object.assign({},x.rc||{},{m:e,ma:at}); ch=true; }); if(!m) return null; if(ch){ try{ if(typeof CURPEER!=='undefined'&&CURPEER===peer) hpRcPaint(hpRcEl(ts,'p'),m); }catch(_){} } return ch; }
function hpRcPendAdd(x){ const a=hpRcLs(HP_RC_PEND).filter(y=>!(y&&y.k===x.k&&y.peer===x.peer&&y.ts===x.ts)); a.push(Object.assign({},x,{got:Date.now()})); hpRcLsSet(HP_RC_PEND,a); return a.length; }
function hpRcPendTry(){ const a=hpRcLs(HP_RC_PEND); if(!a.length) return 0; const now=Date.now(), keep=[]; let n=0;
  for(const x of a){ if(!x||now-(Number(x.got)||0)>HP_RC_PKEEP) continue; let ok=null;
    if(x.k==='m') ok=hpRcMineApply(x.peer,x.ts,x.e,x.at);
    else if(x.k==='p'){ const m=hpRcPatch(x.peer,x.ts,'s',y=>{ y.rc=Object.assign({},y.rc||{},{p:x.e}); }); ok=m?true:null; if(m){ try{ if(typeof CURPEER!=='undefined'&&CURPEER===x.peer) hpRcPaint(hpRcEl(x.ts,'s'),m); }catch(_){} } }
    if(ok===null) keep.push(x); else n++; }
  hpRcLsSet(HP_RC_PEND,keep); if(n) try{ hpLog('あとから届いた手紙にリアクションを '+n+' 件付けた'); }catch(_){} return n; }
function hpRcSibIn(r,o){ if(typeof ID==='undefined'||!ID||r.from!==ID.address||r.fromMaster!==ID.publicKey) return false; if(!o||typeof o.peer!=='string'||!o.peer||typeof o.ts!=='number'||!(o.ts>0)||!hpRcOk(o.e)||typeof o.at!=='number') return false;
  const ch=hpRcMineApply(o.peer,o.ts,o.e,o.at); if(ch===null){ hpRcPendAdd({k:'m',peer:o.peer,ts:o.ts,e:o.e,at:o.at}); try{ hpLog('自分のほかの端末からのリアクション（その 1 通がまだ無いので控えた）'); }catch(_){} return false; }
  try{ hpLog('自分のほかの端末からのリアクションを付けた（'+(o.e||'外した')+'）'); }catch(_){} return ch; }
try{ if(typeof hpRcSetMine==='function'&&!hpRcSetMine.__sib){ const f=hpRcSetMine; hpRcSetMine=function(peer,ts,d,e){ const r=f.apply(this,arguments); try{ if(r!==null&&r!==undefined){ const at=Date.now(); hpRcPatch(peer,ts,'p',x=>{ if(x.rc) x.rc.ma=at; }); hpRcSibSend(peer,ts,r,at).catch(()=>{}); } }catch(e2){} return r; }; Object.assign(hpRcSetMine,f,{__sib:1}); } }catch(e){}
try{ if(typeof hpRcIn==='function'&&!hpRcIn.__pend){ const f=hpRcIn; hpRcIn=function(from,o){ const r=f.apply(this,arguments); try{ if(!r&&o&&o.w==='p'&&typeof o.id==='number'&&o.id>0&&hpRcOk(o.e)&&!histLoad(from).some(x=>x&&x.ts===o.id&&x.d==='s')) hpRcPendAdd({k:'p',peer:from,ts:o.id,e:o.e}); }catch(e){} return r; }; Object.assign(hpRcIn,f,{__pend:1}); } }catch(e){}
try{ if(typeof hpSibLetter==='function'&&!hpSibLetter.__rc){ const f=hpSibLetter; hpSibLetter=async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){ o=null; } if(o&&o.v===1&&o.type==='sibrc'){ hpRcSibIn(r,o); return true; } const res=await f.apply(this,arguments); try{ if(o&&o.type==='sibmir') hpRcPendTry(); }catch(e){} return res; }; Object.assign(hpSibLetter,f,{__rc:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof setInterval==='function') setInterval(()=>{ try{ hpRcPendTry(); }catch(e){} hpRcSibRetry().catch(()=>{}); },60e3); }catch(e){}

const HP_OP_COL=['#e6a23c','#5aa9ff','#ff7eb6','#b48cff','#9ccc65','#35d1b7'];
function hpOpCol(o){ let h=0; for(const ch of String(o||'')) h=(h*31+ch.charCodeAt(0))>>>0; return HP_OP_COL[h%HP_OP_COL.length]; }
function hpOpBoxes(){ const out=[]; try{ if(typeof hpDevRows!=='function'||typeof hpOpOf!=='function') return out; const rows=hpDevRows();
    rows.forEach((d,i)=>{ if(!d) return; let u=''; try{ if(d.me) u=String((typeof hpPostUrl==='function'&&hpPostUrl())||''); else if(d.dev&&typeof hpMcBoxOf==='function') u=String(hpMcBoxOf(d.dev)||''); }catch(e){ u=''; } if(!u) return; const o=hpOpOf(u); if(!o) return;
      out.push({i:i,o:o,url:u,name:(typeof hpDevName==='function')?hpDevName(d.label):String(d.label||'')}); }); }catch(e){} return out; }
function hpOpShared(B){ const c={}; for(const b of B){ (c[b.o]=c[b.o]||[]).push(b); } const s={}; for(const k of Object.keys(c)){ const u=new Set(c[k].map(x=>x.url)); if(u.size>=2) s[k]=c[k]; } return s; }
function hpOpPaintRows(){ try{ if(typeof document==='undefined'||!document.getElementById) return 0; const B=hpOpBoxes(), S=hpOpShared(B); let n=0;
    for(const b of B){ const row=hpDlRow(b.i), nm=row&&row.querySelector?row.querySelector('.nm'):null; if(!nm) continue; let sp=null; for(const c of Array.from(nm.children||[])){ if(c&&(c.className==='dv-box'||c.className==='dv-mbox')){ sp=c; break; } } if(!sp) continue;
      const t=String(sp.textContent||''); const k=(S[b.o]?'1':'0')+t; if(sp.getAttribute&&sp.getAttribute('data-op')===k) continue;
      if(!S[b.o]){ if(sp.setAttribute) sp.setAttribute('data-op',k); continue; }
      const raw=t.replace(/^⚠ /,''), j=raw.lastIndexOf(b.o); sp.textContent=''; sp.appendChild(document.createTextNode('⚠ '));
      sp.appendChild(document.createTextNode(raw));
      try{ sp.title=TF('op_tip',{o:b.o,n:S[b.o].length}); }catch(e){} if(sp.setAttribute) sp.setAttribute('data-op','1'+sp.textContent); n++; } return n; }catch(e){ return -1; } }
try{ if(typeof renderDevices==='function'&&!renderDevices.__op){ const f=renderDevices; renderDevices=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpOpPaintRows(); }catch(e){} return v; },f,{__op:1}); } }catch(e){}
try{ if(typeof hpOpAfLines==='function'&&!hpOpAfLines.__op){ const f=hpOpAfLines; hpOpAfLines=Object.assign(function(){ const out=f.apply(this,arguments); try{ if(Array.isArray(out)&&out.length){ const S=hpOpShared(hpOpBoxes()); for(const k of Object.keys(S)) out.push(TF('op_list',{o:k,d:Array.from(new Set(S[k].map(x=>x.name))).join(typeof hpSep==='function'?hpSep():'・')})); } }catch(e){} return out; },f,{__op:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof setInterval==='function') setInterval(()=>{ try{ hpOpPaintRows(); }catch(e){} },5000); }catch(e){}

const HP_STP_MK='\u2063hpst:', HP_STP_RE=/^\u2063hpst:([a-z]+)\u2063/;
// Stroke data for the handwritten letters is derived from KanjiVG, Copyright (C) 2009/2010/2011 Ulrich Apel (https://kanjivg.tagaini.net/).
// License: Creative Commons Attribution-Share Alike 3.0 (https://creativecommons.org/licenses/by-sa/3.0/). Accented letters and some symbols were added by Handpost under the same license.
const HP_STP_LB={morning:'stp_morning',hello:'stp_hello',evening:'stp_evening',night:'stp_night',thanks:'stp_thanks',sorry:'stp_sorry',please:'stp_please',roger:'stp_roger',ok:'stp_ok',like:'stp_like',wow:'stp_wow',congrats:'stp_congrats',tired:'stp_tired',cheer:'stp_cheer',happy:'stp_happy',sad:'stp_sad',angry:'stp_angry',surprise:'stp_surprise',idea:'stp_idea',wait:'stp_wait',coming:'stp_coming',home:'stp_home',go:'stp_go',bye:'stp_bye',lazy:'stp_lazy',hungry:'stp_hungry',sleepy:'stp_sleepy',no:'stp_no',busy:'stp_busy',lol:'stp_lol',cry:'stp_cry',love:'stp_love',yummy:'stp_yummy',hot:'stp_hot',cold:'stp_cold',late:'stp_late',tiredme:'stp_tiredme',forgot:'stp_forgot',shy:'stp_shy',welcome:'stp_welcome',yes:'stp_yes',nope:'stp_nope',sure:'stp_sure',dame:'stp_dame',ruok:'stp_ruok',imok:'stp_imok',glad:'stp_glad',eh:'stp_eh',why:'stp_why',gaan:'stp_gaan',lonely:'stp_lonely',miss:'stp_miss',worry:'stp_worry',help:'stp_help',itadaki:'stp_itadaki',gochi:'stp_gochi',kanpai:'stp_kanpai',odaiji:'stp_odaiji',waku:'stp_waku',doki:'stp_doki',think:'stp_think',shh:'stp_shh',later:'stp_later',waiting:'stp_waiting',hima:'stp_hima',fight:'stp_fight'};
const HP_STQ_LB={morningb:'stq_morningb',morningc:'stq_morningc',hellob:'stq_hellob',eveningb:'stq_eveningb',eveningc:'stq_eveningc',nightb:'stq_nightb',nightc:'stq_nightc',thanks:'stq_thanks',thanksb:'stq_thanksb',sorry:'stq_sorry',sorryb:'stq_sorryb',please:'stq_please',pleaseb:'stq_pleaseb',rogerb:'stq_rogerb',rogerc:'stq_rogerc',okb:'stq_okb',likeb:'stq_likeb',wowb:'stq_wowb',congratsb:'stq_congratsb',tiredb:'stq_tiredb',cheer:'stq_cheer',cheerb:'stq_cheerb',happyb:'stq_happyb',sadb:'stq_sadb',angryb:'stq_angryb',angryc:'stq_angryc',surpriseb:'stq_surpriseb',ideab:'stq_ideab',wait:'stq_wait',waitb:'stq_waitb',waitc:'stq_waitc',comingb:'stq_comingb',homeb:'stq_homeb',gob:'stq_gob',byeb:'stq_byeb',lazyb:'stq_lazyb',hungry:'stq_hungry',hungryb:'stq_hungryb',sleepyb:'stq_sleepyb',nob:'stq_nob',busyb:'stq_busyb',lolb:'stq_lolb',cryb:'stq_cryb',loveb:'stq_loveb',yummyb:'stq_yummyb',yummyc:'stq_yummyc',hotb:'stq_hotb',coldb:'stq_coldb',lateb:'stq_lateb',latec:'stq_latec',tiredmeb:'stq_tiredmeb',forgotb:'stq_forgotb',forgotc:'stq_forgotc',shyb:'stq_shyb',welcomeb:'stq_welcomeb',welcomec:'stq_welcomec',yesb:'stq_yesb',nopeb:'stq_nopeb',sureb:'stq_sureb',surec:'stq_surec',dameb:'stq_dameb',ruokb:'stq_ruokb',imokb:'stq_imokb',gladb:'stq_gladb',ehb:'stq_ehb',whyb:'stq_whyb',gaanb:'stq_gaanb',lonelyb:'stq_lonelyb',missb:'stq_missb',worryb:'stq_worryb',helpb:'stq_helpb',itadakib:'stq_itadakib',gochib:'stq_gochib',gochic:'stq_gochic',kanpaib:'stq_kanpaib',odaijib:'stq_odaijib',wakub:'stq_wakub',dokib:'stq_dokib',thinkb:'stq_thinkb',shhb:'stq_shhb',laterb:'stq_laterb',laterc:'stq_laterc',waitingb:'stq_waitingb',himab:'stq_himab',fightb:'stq_fightb'};
const HP_STW=[{"w":"morning","kj":["おは","おはよう","朝"],"ke":["good morning","morning"],"v":["morning","morningb","morningc"]},{"w":"hello","kj":["こんにちは","こんち","やあ","ハロー"],"ke":["hello","hi"],"v":["hello","hellob","helloc"]},{"w":"evening","kj":["こんばんは","こんばん","夜"],"ke":["good evening","evening"],"v":["evening","eveningb","eveningc"]},{"w":"night","kj":["おや","おやすみ","寝る","ねる"],"ke":["good night","night","sleep"],"v":["night","nightb","nightc"]},{"w":"thanks","kj":["あり","ありがとう","感謝","サンキュー"],"ke":["thanks","thank you","thx"],"v":["thanks","thanksb","thanksc"]},{"w":"sorry","kj":["ごめ","ごめん","ごめんね","すみません","すまん"],"ke":["sorry"],"v":["sorry","sorryb","sorryc"]},{"w":"please","kj":["よろ","よろしく","お願い","おねがい"],"ke":["please","regards"],"v":["please","pleaseb","pleasec"]},{"w":"roger","kj":["りょ","了解","りょうかい","わかった"],"ke":["roger","got it","ok"],"v":["roger","rogerb","rogerc"]},{"w":"ok","kj":["ok","おけ","オッケー","おっけ"],"ke":["ok","okay"],"v":["ok","okb","okc"]},{"w":"like","kj":["いいね","いいね！","グッド"],"ke":["like","nice","good"],"v":["like","likeb","likec"]},{"w":"wow","kj":["すご","すごい","すげ","やば"],"ke":["wow","amazing","great"],"v":["wow","wowb","wowc"]},{"w":"congrats","kj":["おめ","おめでとう","祝","いわい"],"ke":["congrats","congratulations"],"v":["congrats","congratsb","congratsc"]},{"w":"tired","kj":["おつ","おつかれ","お疲れ","おつかれさま"],"ke":["good job","thanks for your work"],"v":["tired","tiredb","tiredc"]},{"w":"cheer","kj":["がん","がんばれ","がんば","応援","ファイト"],"ke":["you can do it","go","cheer"],"v":["cheer","cheerb","cheerc"]},{"w":"happy","kj":["うれ","うれしい","嬉","やった"],"ke":["yay","happy"],"v":["happy","happyb","happyc"]},{"w":"sad","kj":["かな","かなしい","悲","しくしく"],"ke":["sad"],"v":["sad","sadb","sadc"]},{"w":"angry","kj":["おこ","おこった","怒","むか","ぷん"],"ke":["grr","angry","mad"],"v":["angry","angryb","angryc"]},{"w":"surprise","kj":["びっ","びっくり","驚","えっ"],"ke":["whoa","surprised"],"v":["surprise","surpriseb","surprisec"]},{"w":"idea","kj":["なる","なるほど","ふむ"],"ke":["i see","got it"],"v":["idea","ideab","ideac"]},{"w":"wait","kj":["まって","待って","まってて"],"ke":["wait","hold on"],"v":["wait","waitb","waitc"]},{"w":"coming","kj":["いま","いまいく","今行く","すぐいく"],"ke":["on my way","coming"],"v":["coming","comingb","comingc"]},{"w":"home","kj":["ただ","ただいま","帰った","かえった"],"ke":["i'm home","home"],"v":["home","homeb","homec"]},{"w":"go","kj":["いって","いってきます","行ってき"],"ke":["heading out","bye"],"v":["go","gob","goc"]},{"w":"bye","kj":["また","またね","バイ","じゃあね"],"ke":["see you","bye"],"v":["bye","byeb","byec"]},{"w":"lazy","kj":["だる","だるい","めんど","面倒"],"ke":["meh","lazy"],"v":["lazy","lazyb","lazyc"]},{"w":"hungry","kj":["はら","はらへった","腹減","おなかすいた","おなか"],"ke":["hungry"],"v":["hungry","hungryb","hungryc"]},{"w":"sleepy","kj":["ねむ","ねむい","眠"],"ke":["sleepy","tired"],"v":["sleepy","sleepyb","sleepyc"]},{"w":"no","kj":["むり","無理","むーり"],"ke":["no way","impossible"],"v":["no","nob","noc"]},{"w":"busy","kj":["いそ","いそがしい","忙"],"ke":["busy"],"v":["busy","busyb","busyc"]},{"w":"lol","kj":["わら","笑","わらった","www","ｗ"],"ke":["lol","haha"],"v":["lol","lolb","lolc"]},{"w":"cry","kj":["ない","泣","ないた","えーん"],"ke":["cry","crying"],"v":["cry","cryb","cryc"]},{"w":"love","kj":["すき","好き","だいすき","らぶ","ラブ"],"ke":["love","like you"],"v":["love","loveb","lovec"]},{"w":"yummy","kj":["おいし","おいしい","美味","うまい"],"ke":["yummy","delicious"],"v":["yummy","yummyb","yummyc"]},{"w":"hot","kj":["あつ","あつい","暑","熱"],"ke":["hot"],"v":["hot","hotb","hotc"]},{"w":"cold","kj":["さむ","さむい","寒"],"ke":["cold","freezing"],"v":["cold","coldb","coldc"]},{"w":"late","kj":["ちこ","ちこく","遅刻","おくれ"],"ke":["late","running late"],"v":["late","lateb","latec"]},{"w":"tiredme","kj":["つか","つかれた","疲れた","へとへと"],"ke":["tired","exhausted"],"v":["tiredme","tiredmeb","tiredmec"]},{"w":"forgot","kj":["わすれ","忘れ","わすれもの"],"ke":["forgot"],"v":["forgot","forgotb","forgotc"]},{"w":"shy","kj":["てれ","照れ","てれる","えへ"],"ke":["shy","blush"],"v":["shy","shyb","shyc"]},{"w":"welcome","kj":["おかえり","おかえ","お帰り"],"ke":["welcome back","welcome home"],"v":["welcome","welcomeb","welcomec"]},{"w":"yes","kj":["はい","うん","yes"],"ke":["yes","yeah"],"v":["yes","yesb","yesc"]},{"w":"nope","kj":["いいえ","ううん","いや"],"ke":["no","nope"],"v":["nope","nopeb","nopec"]},{"w":"sure","kj":["いいよ","おっけ","どうぞ"],"ke":["sure","go ahead"],"v":["sure","sureb","surec"]},{"w":"dame","kj":["だめ","ダメ","あかん"],"ke":["no","not allowed"],"v":["dame","dameb","damec"]},{"w":"ruok","kj":["だいじょうぶ？","大丈夫？","だいじょ","だいじょうぶ"],"ke":["are you ok","you ok"],"v":["ruok","ruokb","ruokc"]},{"w":"imok","kj":["だいじょうぶ！","大丈夫！","へいき","平気"],"ke":["i'm ok","fine"],"v":["imok","imokb","imokc"]},{"w":"glad","kj":["よかった","よか","ほっ","安心"],"ke":["phew","glad","relieved"],"v":["glad","gladb","gladc"]},{"w":"eh","kj":["えっ","えっ？","は？"],"ke":["huh","what"],"v":["eh","ehb","ehc"]},{"w":"why","kj":["なんで","なぜ","どうして"],"ke":["why"],"v":["why","whyb","whyc"]},{"w":"gaan","kj":["がーん","ガーン","がーん！","しょっく","ショック"],"ke":["shock","oh no"],"v":["gaan","gaanb","gaanc"]},{"w":"lonely","kj":["さび","さびしい","寂","さみしい"],"ke":["lonely","miss you"],"v":["lonely","lonelyb","lonelyc"]},{"w":"miss","kj":["あいたい","会いたい","あい"],"ke":["miss you","want to see you"],"v":["miss","missb","missc"]},{"w":"worry","kj":["しんぱい","心配","しんぱ"],"ke":["worried"],"v":["worry","worryb","worryc"]},{"w":"help","kj":["たすけ","助けて","たすけて","へるぷ"],"ke":["help"],"v":["help","helpb","helpc"]},{"w":"itadaki","kj":["いただき","いただきます"],"ke":["let's eat","bon appetit"],"v":["itadaki","itadakib","itadakic"]},{"w":"gochi","kj":["ごちそう","ごちそうさま","ごち"],"ke":["thanks for the meal"],"v":["gochi","gochib","gochic"]},{"w":"kanpai","kj":["かんぱい","乾杯","かんぱ"],"ke":["cheers"],"v":["kanpai","kanpaib","kanpaic"]},{"w":"odaiji","kj":["おだいじ","お大事","おだいじに"],"ke":["get well","take care"],"v":["odaiji","odaijib","odaijic"]},{"w":"waku","kj":["わくわく","ワクワク","わく"],"ke":["excited"],"v":["waku","wakub","wakuc"]},{"w":"doki","kj":["ドキドキ","どきどき","どき"],"ke":["nervous","heart pounding"],"v":["doki","dokib","dokic"]},{"w":"think","kj":["かんがえ","考え","かんがえちゅう","うーん"],"ke":["thinking","hmm"],"v":["think","thinkb","thinkc"]},{"w":"shh","kj":["しー","しーっ","ないしょ","内緒"],"ke":["shh","secret"],"v":["shh","shhb","shhc"]},{"w":"later","kj":["あとで","後で","また後"],"ke":["later","talk later"],"v":["later","laterb","laterc"]},{"w":"waiting","kj":["まってる","待ってる","まってるね"],"ke":["i'll wait","waiting"],"v":["waiting","waitingb","waitingc"]},{"w":"hima","kj":["ひま","暇","たいくつ"],"ke":["bored","free"],"v":["hima","himab","himac"]},{"w":"fight","kj":["ふぁいと","ファイト","がんばる","ふぁい"],"ke":["fight","let's go"],"v":["fight","fightb","fightc"]}];

const HP_STE={"morning":"joy","morningb":"sleepy","morningc":"fun","hello":"fun","hellob":"puzzled","helloc":"joy","evening":"joy","eveningb":"dizzy","eveningc":"sly","night":"sleepy","nightb":"sly","nightc":"shy","thanks":"polite","thanksb":"shy","thanksc":"joy","sorry":"polite","sorryb":"shy","sorryc":"sad","please":"polite","pleaseb":"sly","pleasec":"joy","roger":"plain","rogerb":"sly","rogerc":"fun","ok":"joy","okb":"sly","okc":"joy","like":"joy","likeb":"joy","likec":"fun","wow":"surprise","wowb":"fun","wowc":"joy","congrats":"fun","congratsb":"puzzled","congratsc":"joy","tired":"shy","tiredb":"sleepy","tiredc":"joy","cheer":"fun","cheerb":"joy","cheerc":"fun","happy":"joy","happyb":"shy","happyc":"joy","sad":"sad","sadb":"sad","sadc":"sad","angry":"angry","angryb":"angry","angryc":"angry","surprise":"surprise","surpriseb":"surprise","surprisec":"surprise","idea":"joy","ideab":"sly","ideac":"plain","wait":"worry","waitb":"worry","waitc":"shy","coming":"fun","comingb":"sly","comingc":"fun","home":"joy","homeb":"joy","homec":"dizzy","go":"joy","gob":"sleepy","goc":"fun","bye":"joy","byeb":"sad","byec":"joy","lazy":"sleepy","lazyb":"sleepy","lazyc":"sleepy","hungry":"worry","hungryb":"blank","hungryc":"surprise","sleepy":"sleepy","sleepyb":"sleepy","sleepyc":"sleepy","no":"worry","nob":"sly","noc":"worry","busy":"dizzy","busyb":"fun","busyc":"dizzy","lol":"fun","lolb":"fun","lolc":"fun","cry":"sad","cryb":"sad","cryc":"sad","love":"shy","loveb":"joy","lovec":"shy","yummy":"joy","yummyb":"joy","yummyc":"fun","hot":"worry","hotb":"worry","hotc":"joy","cold":"worry","coldb":"sleepy","coldc":"shy","late":"worry","lateb":"surprise","latec":"sad","tiredme":"dizzy","tiredmeb":"sleepy","tiredmec":"sad","forgot":"surprise","forgotb":"worry","forgotc":"worry","shy":"shy","shyb":"shy","shyc":"shy","welcome":"joy","welcomeb":"fun","welcomec":"joy","yes":"joy","yesb":"fun","yesc":"joy","nope":"plain","nopeb":"sly","nopec":"angry","sure":"joy","sureb":"sly","surec":"fun","dame":"angry","dameb":"angry","damec":"plain","ruok":"worry","ruokb":"shy","ruokc":"sad","imok":"joy","imokb":"sly","imokc":"fun","glad":"shy","gladb":"sleepy","gladc":"joy","eh":"surprise","ehb":"puzzled","ehc":"puzzled","why":"puzzled","whyb":"shy","whyc":"worry","gaan":"surprise","gaanb":"sad","gaanc":"blank","lonely":"sad","lonelyb":"shy","lonelyc":"sad","miss":"shy","missb":"fun","missc":"shy","worry":"worry","worryb":"blank","worryc":"worry","help":"worry","helpb":"sad","helpc":"worry","itadaki":"joy","itadakib":"fun","itadakic":"fun","gochi":"shy","gochib":"joy","gochic":"joy","kanpai":"fun","kanpaib":"joy","kanpaic":"fun","odaiji":"shy","odaijib":"sleepy","odaijic":"joy","waku":"joy","wakub":"joy","wakuc":"fun","doki":"shy","dokib":"worry","dokic":"shy","think":"puzzled","thinkb":"sleepy","thinkc":"worry","shh":"plain","shhb":"sly","shhc":"worry","later":"plain","laterb":"dizzy","laterc":"joy","waiting":"joy","waitingb":"sleepy","waitingc":"joy","hima":"bored","himab":"fun","himac":"bored","fight":"angry","fightb":"fun","fightc":"angry"};
const HP_STM_LB={joy:'stm_joy',angry:'stm_angry',sad:'stm_sad',fun:'stm_fun',surprise:'stm_surprise',shy:'stm_shy',sleepy:'stm_sleepy',worry:'stm_worry',plain:'stm_plain',sly:'stm_sly',blank:'stm_blank',dizzy:'stm_dizzy',puzzled:'stm_puzzled',bored:'stm_bored',polite:'stm_polite'};
const HP_STA=(function(){
const G={"!":["M55,12 Q56,40 53,70","M50,88 Q54,86 56,92 Q52,96 50,88"],"'":["M55,14 L51,32"],",":["M14,103.36c3.61-2.46,6.65-6.21,6.65-13.29c0-1.68-1.36-3.03-3.03-3.03c-1.67,0-3.03,1.36-3.03,3.03c0,1.67,1.36,3.03,3.03,3.03c4.62,0-0.15,7.08-3.62,10.26"],"-":["M36,58 L72,58"],"5":["M34.49,16.94c-0.29,7.51-1.66,30.19-2.1,38.57c8.67-7.66,15.75-12.27,27.21-12.27c13.69,0,24.45,6.76,24.45,23.22c0,16.96-13.49,25.67-26.64,25.67c-12.01,0-22.99-3.94-28.91-12.1","M34.49,16.94c4.62,0,39.08,0,45.58,0"],"?":["M28,30 C30,8 76,4 80,28 C82,46 56,50 55,70","M52,88 Q56,86 58,92 Q54,96 52,88"],"A":["M54.46,14.41c-8.67,19.8-31.28,70.81-34.46,78.47","M54.46,14.41c5.06,11.27,30.2,68.64,34.54,78.47","M32.18,66.14c12.28,0,33.91,0,44.02,0"],"B":["M28.29,17.66c0,8.53-0.29,65.32-0.29,72.4","M28.53,16.94c17.05,0,13.74,0,30.94,0c24.41,0,24.55,33.81,0,33.81c-16.47,0-17.07,0-30.51,0","M28.53,52.78c18.2,0,14.67,0,33.02,0c26.05,0,26.21,38.01,0,38.01c-17.58,0-18.22,0-32.56,0"],"C":["M85.05,32.4c-6.94-13.73-19.8-16.76-29.91-16.76c-14.02,0-30.64,12.43-30.64,34.39c0,25.58,10.85,42.49,31.38,42.49c19.64,0,24.41-9.1,28.6-19.36"],"D":["M29,17.32c0,9.1,0,62,0,73.27","M29.43,16.8c2.31,0,1.44,0,22.4,0c20.96,0,32.23,16.18,32.23,34.97c0,18.79-10.55,39.16-30.5,39.16c-19.95,0-24.21,0-24.21,0"],"E":["M31.5,17.32c0,9.1,0,62,0,73.27","M31.93,16.8c2.31,0,27.19,0,48.15,0","M31.93,52.35c2.31,0,25.44,0,46.4,0","M31.93,90.79c2.31,0,28.94,0,49.9,0"],"F":["M36,17.32c0,9.1,0,63.75,0,75.02","M36.43,16.8c2.31,0,21.19,0,42.15,0","M36.43,52.35c2.31,0,17.19,0,38.15,0"],"G":["M85.42,32.4c-5.44-13.01-16.93-16.76-31.2-16.76c-14.85,0-32.72,11.85-32.72,36.89c0,27.41,15.34,39.99,33.5,39.99c15.65,0,26.06-6.65,30.97-12.28","M60.57,55.09c5.2,0,20.23,0,21.82,0c1.59,0,3.47,1.73,3.47,3.47c0,1.74,0,21.25,0,21.25"],"H":["M29,15.32c0,29.53,0,44.28,0,77.52","M80.01,15.32c0,29.53,0,44.28,0,77.52","M29.43,52.35c2.31,0,28.69,0,49.65,0"],"I":["M54.5,15.32c0,29.53,0,44.28,0,77.52"],"J":["M76.93,15.93c0,5.92,0,49.86,0,55.78c0,13.58-11.27,20.81-23.84,20.81c-14.45,0-24.36-7.66-26.09-19.36"],"K":["M36,15.43c0,5.92,0,71.36,0,77.28","M84.73,15.79c-16.04,12.14-34.54,26.3-46.53,35.26","M38.2,51.55c19.36,16.62,35.05,29.21,48.93,40.62"],"L":["M36,15.43c0,5.92,0,68.86,0,74.78","M36.12,90.5c6.79,0,41.94,0,50.32,0"],"M":["M18,15.43c0,5.92,0,71.36,0,77.28","M18.43,14.92c10.44,22.4,31.17,67.63,35.71,77.31","M88.81,16.08c-6.74,15.17-28.84,64.24-34.4,76.23","M89.32,15.5c0,15.03,0,66.33,0,77.02"],"N":["M29,15.43c0,5.92,0,71.36,0,77.28","M29.43,14.92c14.85,23.27,33.4,52.46,49.84,77.46","M80.05,15.5c0,15.03,0,66.33,0,77.02"],"O":["M53.87,15.64c-19.8,0-32.37,15.61-32.37,39.6c0,23.99,15.17,37.14,34.1,37.14c18.93,0,31.79-16.33,31.79-42.05c0-22.12-16.33-34.69-33.52-34.69"],"P":["M31.29,17.66c0,8.53-0.29,67.82-0.29,74.9","M31.53,16.94c19.05,0,15.35,0,34.57,0c27.27,0,27.43,39.02,0,39.02c-18.41,0-19.07,0-34.08,0"],"Q":["M53.87,15.64c-19.8,0-32.37,15.61-32.37,39.6c0,23.99,15.17,37.14,34.1,37.14c18.93,0,31.79-16.33,31.79-42.05c0-22.12-16.33-34.69-33.52-34.69","M59.54,77.28c3.03,2.02,23.04,15.34,25.93,17.37"],"R":["M29.29,17.66c0,8.53-0.29,67.82-0.29,74.9","M29.53,16.94c19.05,0,15.35,0,34.57,0c27.27,0,27.43,39.02,0,39.02c-18.41,0-19.07,0-34.08,0","M64.24,57.13c4.62,7.08,18.3,29.25,22.06,35.32"],"S":["M83.31,33.27c-3.61-12.43-16.47-17.77-29.77-17.77c-12.43,0-26.3,6.94-26.3,16.74c0,13.6,8.49,14.9,27.07,20.35c16.87,4.95,29.73,7.23,29.73,20.27c0,15.61-20.81,19.51-28.76,19.51c-15.9,0-26.73-6.5-30.78-17.87"],"T":["M23,16.94c2.31,0,41.94,0,62.9,0","M54.5,17.57c0,29.53,0,42.03,0,75.27"],"U":["M29,15.64c0,5.64,0,33.09,0,54.19c0,30.06,50.87,29.77,50.87,0c0-20.23,0-47.54,0-54.19"],"V":["M19.5,15.17c10.08,22.4,30.08,67.63,34.47,77.31","M88.84,15.5c-6.78,15.34-29.01,64.94-34.6,77.06"],"W":["M10,15.17c6,22.4,17.91,67.63,20.52,77.31","M53.46,15.5c-4.18,15.34-17.88,64.94-21.32,77.06","M55.47,15.52c6.29,22.4,18.79,67.63,21.53,77.31","M99.22,15.85c-4.09,15.34-17.51,64.94-20.89,77.06"],"Y":["M23.5,15.17c8.95,11.65,26.73,35.18,30.62,40.21","M85.2,15.5c-5.98,8.02-25.58,33.98-30.51,40.32","M54.63,56.15c0,4.05,0,30.4,0,36.33"],"Z":["M26.95,16.94c6.94,0,52.32,0,57.38,0","M84.2,17.25c-11.69,14.64-50.05,61.98-59.7,73.55","M24.95,90.79c6.94,0,57.07,0,62.13,0"],"a":["M34.26,50.61c1.88-7.08,5.78-15.61,20.52-15.61c9.97,0,17.34,4.51,17.34,12.31c0,6.79,0.14,36.1,0.14,39.28c0,8.67,6.36,6.65,9.25,0.43","M70.82,58.71c-20.23,1.01-40.32,4.33-40.32,21.38c0,16.33,26.59,15.32,40.7,3.01"],"b":["M36,15.39c0,5.92,0,67.26,0,77.09","M36.36,52.09c3.82-10.58,11.92-16.79,21.6-16.79c9.68,0,21.2,6.36,21.2,26.09c0,21.59-8.05,31.28-20.48,31.28c-12.43,0-19.36-9.25-22.43-17.24"],"c":["M77.68,51.77c-3.32-10.26-8.38-16.76-23.41-16.76c-11.85,0-23.27,8.81-23.27,27.83c0,19.28,9.54,29.25,23.7,29.25c16.04,0,22.25-9.39,23.41-17.63"],"d":["M74.3,52.09c-3.82-10.58-11.92-16.79-21.6-16.79c-9.68,0-21.2,6.36-21.2,26.09c0,21.59,8.05,31.28,20.48,31.28c12.43,0,19.36-9.25,22.43-17.24","M74.74,15.39c0,5.92,0,67.26,0,77.09"],"e":["M78.15,62.25c1.16-15.17-6.17-27.25-21.64-27.25c-13.87,0-25.51,10.84-25.51,27.89c0,17.05,6.58,29.62,24.64,29.62c18.06,0,20.53-12.56,22.55-18.2","M32.09,62.9c6.94,0,36.08,0,45.76,0"],"f":["M75.92,16.8c-12.58-3.76-22.34,0.58-22.34,12.14c0,11.57,0,55.91,0,63.86","M39,36.74c5.35,0,30.01,0,35.64,0"],"g":["M55.14,35.01c-16.18,0-21.35,9.1-21.35,15.9c0,6.8,4.3,16.62,21.64,16.62c15.46,0,20.88-8.38,20.88-15.17c0-6.79-4.84-17.37-21.12-17.37","M82.45,34.72c-5.49-1.45-8.38,0.43-11.17,3.9","M40.36,65.64c-3.72,2.31-7.39,13.03,4.91,14.16c9.39,0.87,15.49,1.3,23.01,1.85c10.12,0.75,11.57,8.84,11.57,12.32c0,4.48-3.9,14.44-23.27,14.44c-19.37,0-25.58-6.5-25.58-14.4c0-7.66,4.34-11.47,9.49-14.46"],"h":["M34.5,15.43c0,5.35,0,69.79,0,77.16","M34.66,52.69c12.71-24.62,39.76-21.38,39.76-4.52c0,19.22,0,37.48,0,44.42"],"i":["M54.5,34.93c0,5.35,0,50.54,0,57.91","M54.5,15 c -0.83,0 -1.5,0.67 -1.5,1.5 0,0.83 0.67,1.5 1.5,1.5 0.83,0 1.5,-0.67 1.5,-1.5 0,-0.83 -0.67,-1.5 -1.5,-1.5"],"j":["M54.51,34.93c0,5.35,0,52.29,0,59.66c0,12.38-6.16,13.68-18.01,13.68","M54.5,15 c -0.83,0 -1.5,0.67 -1.5,1.5 0,0.83 0.67,1.5 1.5,1.5 0.83,0 1.5,-0.67 1.5,-1.5 0,-0.83 -0.67,-1.5 -1.5,-1.5"],"k":["M36,15.43c0,5.35,0,69.79,0,77.16","M75.84,35.29c-11.12,7.81-22.38,15.24-36.26,24.78","M40.01,60.29c8.81,7.23,30.81,25.71,38.61,32.36"],"l":["M54.5,15.43c0,5.35,0,69.79,0,77.16"],"m":["M21.64,35.33c0,7.23-0.14,51.62-0.14,57.4","M21.65,50.44c6.92-19.34,33.32-21.07,33.32-2.27c0,19.22,0,37.48,0,44.42","M55.1,50.1c6.92-19.34,33.32-21.07,33.32-2.27c0,19.22,0,37.48,0,44.42"],"n":["M34.5,34.93c0,5.35,0,50.29,0,57.66","M34.66,52.69c12.71-24.62,39.76-21.38,39.76-4.52c0,19.22,0,37.48,0,44.42"],"o":["M54.19,35.15c-10.4,0-22.69,7.8-22.69,26.45c0,18.65,6.79,30.78,24.42,30.78c17.63,0,22.98-16.91,22.98-30.64c0-13.73-8.09-26.48-24.23-26.48"],"p":["M34.5,35.4c0,5.92,0,63.01,0,72.84","M35.04,52.09c3.82-10.58,11.92-16.79,21.6-16.79c9.68,0,21.2,6.36,21.2,26.09c0,21.59-8.05,31.28-20.48,31.28c-12.43,0-19.36-9.25-22.43-17.24"],"q":["M73.8,52.09c-3.82-10.58-11.92-16.79-21.6-16.79c-9.68,0-21.2,6.36-21.2,26.09c0,21.59,8.05,31.28,20.48,31.28c12.43,0,19.36-9.25,22.43-17.24","M74.45,35.4c0,5.92,0,63.01,0,72.84"],"r":["M43.5,35.44c0,13.15,0,47.07,0,57.04","M76.37,36.02c-14.95-2.31-26.26,3.64-32.44,17.63"],"s":["M75.5,47.56c-2.33-9.81-11.31-12.13-20.63-12.13c-8.72,0-18.45,5.12-18.45,12.37c0,10.05,5.95,10.5,18.99,14.54c11.83,3.66,20.85,4.61,20.85,15.48c0,10.67-10.02,14.41-20.17,14.41c-11.15,0-21.59-6.78-21.59-16.7"],"t":["M51.01,22.14c0,19.36,0,55.35,0,61.42c0,12.43,14.85,9,21.93,4.81","M37,36.6c6.21,0,26.18,0.14,35,0.14"],"u":["M34.5,35.01c0,9.39,0,23.95,0,41.14c0,23.83,31.36,19.99,39.41-1.51","M74.38,35.01c0,7.66,0,51.16,0,57.66"],"v":["M29,35.26c7.33,16.59,21.87,50.08,25.06,57.25","M79.42,35.5c-4.93,11.36-21.09,48.08-25.15,57.06"],"w":["M15,35.26c5.6,16.59,16.23,50.08,18.67,57.25","M53.56,35.5c-3.77,11.36-16.13,48.08-19.24,57.06","M54.58,35.42c5.6,16.59,16.73,50.08,19.17,57.25","M93.15,35.66c-3.77,11.36-15.63,48.08-18.74,57.06"],"x":["M31.85,35.01c13.91,16.69,41.54,50.39,47.59,57.61","M77.31,35.26c-9.26,11.36-39.67,48.09-47.31,57.07"],"y":["M28,35.42c7.81,14.79,23.31,44.64,26.71,51.03","M77.1,35.01c-5.01,12.22-21.51,51.73-25.57,61.42c-3.76,8.96-5.78,11.85-16.04,11.85"],"z":["M34.73,36.74c5.62,0,41.16,0,45.26,0","M79.89,36.96c-9.48,10.72-40.58,45.37-48.39,53.84","M31.85,90.79c5.62,0,46.26,0,50.36,0"],"~":["M18,60 C30,46 42,46 54,58 S80,70 92,54"],"À":["M54.46,14.41c-8.67,19.8-31.28,70.81-34.46,78.47","M54.46,14.41c5.06,11.27,30.2,68.64,34.54,78.47","M32.18,66.14c12.28,0,33.91,0,44.02,0","M57.5,8.4 L47.5,-3.6"],"Ç":["M85.05,32.4c-6.94-13.73-19.8-16.76-29.91-16.76c-14.02,0-30.64,12.43-30.64,34.39c0,25.58,10.85,42.49,31.38,42.49c19.64,0,24.41-9.1,28.6-19.36","M54.8,93.5 Q63.8,98.5 52.8,105.5"],"É":["M31.5,17.32c0,9.1,0,62,0,73.27","M31.93,16.8c2.31,0,27.19,0,48.15,0","M31.93,52.35c2.31,0,25.44,0,46.4,0","M31.93,90.79c2.31,0,28.94,0,49.9,0","M53.6,10.8 L63.6,-1.2"],"Ö":["M53.87,15.64c-19.8,0-32.37,15.61-32.37,39.6c0,23.99,15.17,37.14,34.1,37.14c18.93,0,31.79-16.33,31.79-42.05c0-22.12-16.33-34.69-33.52-34.69","M45.5,4.6 L46.5,6.6","M62.5,4.6 L63.5,6.6"],"Ü":["M29,15.64c0,5.64,0,33.09,0,54.19c0,30.06,50.87,29.77,50.87,0c0-20.23,0-47.54,0-54.19","M45.5,4.6 L46.5,6.6","M62.5,4.6 L63.5,6.6"],"ß":["M32,94 L32,34 C32,12 72,12 72,32 C72,46 54,48 52,52 C74,54 82,66 78,80 C74,94 58,96 48,90"],"à":["M34.26,50.61c1.88-7.08,5.78-15.61,20.52-15.61c9.97,0,17.34,4.51,17.34,12.31c0,6.79,0.14,36.1,0.14,39.28c0,8.67,6.36,6.65,9.25,0.43","M70.82,58.71c-20.23,1.01-40.32,4.33-40.32,21.38c0,16.33,26.59,15.32,40.7,3.01","M59.0,29.0 L49.0,17.0"],"â":["M34.26,50.61c1.88-7.08,5.78-15.61,20.52-15.61c9.97,0,17.34,4.51,17.34,12.31c0,6.79,0.14,36.1,0.14,39.28c0,8.67,6.36,6.65,9.25,0.43","M70.82,58.71c-20.23,1.01-40.32,4.33-40.32,21.38c0,16.33,26.59,15.32,40.7,3.01","M47.0,29.0 L56.0,18.0 L65.0,29.0"],"ä":["M34.26,50.61c1.88-7.08,5.78-15.61,20.52-15.61c9.97,0,17.34,4.51,17.34,12.31c0,6.79,0.14,36.1,0.14,39.28c0,8.67,6.36,6.65,9.25,0.43","M70.82,58.71c-20.23,1.01-40.32,4.33-40.32,21.38c0,16.33,26.59,15.32,40.7,3.01","M47.0,24.0 L48.0,26.0","M64.0,24.0 L65.0,26.0"],"ç":["M77.68,51.77c-3.32-10.26-8.38-16.76-23.41-16.76c-11.85,0-23.27,8.81-23.27,27.83c0,19.28,9.54,29.25,23.7,29.25c16.04,0,22.25-9.39,23.41-17.63","M54.5,93.1 Q63.5,98.1 52.5,105.1"],"é":["M78.15,62.25c1.16-15.17-6.17-27.25-21.64-27.25c-13.87,0-25.51,10.84-25.51,27.89c0,17.05,6.58,29.62,24.64,29.62c18.06,0,20.53-12.56,22.55-18.2","M32.09,62.9c6.94,0,36.08,0,45.76,0","M51.6,29.0 L61.6,17.0"],"ê":["M78.15,62.25c1.16-15.17-6.17-27.25-21.64-27.25c-13.87,0-25.51,10.84-25.51,27.89c0,17.05,6.58,29.62,24.64,29.62c18.06,0,20.53-12.56,22.55-18.2","M32.09,62.9c6.94,0,36.08,0,45.76,0","M45.6,29.0 L54.6,18.0 L63.6,29.0"],"î":["M54.5,34.93c0,5.35,0,50.54,0,57.91","M45.5,9.0 L54.5,-2.0 L63.5,9.0"],"ó":["M54.19,35.15c-10.4,0-22.69,7.8-22.69,26.45c0,18.65,6.79,30.78,24.42,30.78c17.63,0,22.98-16.91,22.98-30.64c0-13.73-8.09-26.48-24.23-26.48","M52.2,29.2 L62.2,17.2"],"ô":["M54.19,35.15c-10.4,0-22.69,7.8-22.69,26.45c0,18.65,6.79,30.78,24.42,30.78c17.63,0,22.98-16.91,22.98-30.64c0-13.73-8.09-26.48-24.23-26.48","M46.2,29.2 L55.2,18.2 L64.2,29.2"],"ö":["M54.19,35.15c-10.4,0-22.69,7.8-22.69,26.45c0,18.65,6.79,30.78,24.42,30.78c17.63,0,22.98-16.91,22.98-30.64c0-13.73-8.09-26.48-24.23-26.48","M46.2,24.2 L47.2,26.2","M63.2,24.2 L64.2,26.2"],"ù":["M34.5,35.01c0,9.39,0,23.95,0,41.14c0,23.83,31.36,19.99,39.41-1.51","M74.38,35.01c0,7.66,0,51.16,0,57.66","M57.5,29.0 L47.5,17.0"],"û":["M34.5,35.01c0,9.39,0,23.95,0,41.14c0,23.83,31.36,19.99,39.41-1.51","M74.38,35.01c0,7.66,0,51.16,0,57.66","M45.5,29.0 L54.5,18.0 L63.5,29.0"],"ü":["M34.5,35.01c0,9.39,0,23.95,0,41.14c0,23.83,31.36,19.99,39.41-1.51","M74.38,35.01c0,7.66,0,51.16,0,57.66","M45.5,24.0 L46.5,26.0","M62.5,24.0 L63.5,26.0"],"ą":["M34.26,50.61c1.88-7.08,5.78-15.61,20.52-15.61c9.97,0,17.34,4.51,17.34,12.31c0,6.79,0.14,36.1,0.14,39.28c0,8.67,6.36,6.65,9.25,0.43","M70.82,58.71c-20.23,1.01-40.32,4.33-40.32,21.38c0,16.33,26.59,15.32,40.7,3.01","M75.5,92.4 Q65.5,102.4 79.5,105.4"],"ć":["M77.68,51.77c-3.32-10.26-8.38-16.76-23.41-16.76c-11.85,0-23.27,8.81-23.27,27.83c0,19.28,9.54,29.25,23.7,29.25c16.04,0,22.25-9.39,23.41-17.63","M51.5,29.0 L61.5,17.0"],"ę":["M78.15,62.25c1.16-15.17-6.17-27.25-21.64-27.25c-13.87,0-25.51,10.84-25.51,27.89c0,17.05,6.58,29.62,24.64,29.62c18.06,0,20.53-12.56,22.55-18.2","M32.09,62.9c6.94,0,36.08,0,45.76,0","M72.3,92.5 Q62.3,102.5 76.3,105.5"],"ł":["M54.5,15.43c0,5.35,0,69.79,0,77.16","M40.5,62.0 L66.5,46.0"],"ń":["M34.5,34.93c0,5.35,0,50.29,0,57.66","M34.66,52.69c12.71-24.62,39.76-21.38,39.76-4.52c0,19.22,0,37.48,0,44.42","M51.5,28.9 L61.5,16.9"],"œ":["M50,58 C50,42 20,42 20,58 C20,76 50,76 50,58","M52,60 L86,58 C86,44 60,40 56,54 C52,72 68,78 86,72"],"Ś":["M83.31,33.27c-3.61-12.43-16.47-17.77-29.77-17.77c-12.43,0-26.3,6.94-26.3,16.74c0,13.6,8.49,14.9,27.07,20.35c16.87,4.95,29.73,7.23,29.73,20.27c0,15.61-20.81,19.51-28.76,19.51c-15.9,0-26.73-6.5-30.78-17.87","M51.2,9.5 L61.2,-2.5"],"ś":["M75.5,47.56c-2.33-9.81-11.31-12.13-20.63-12.13c-8.72,0-18.45,5.12-18.45,12.37c0,10.05,5.95,10.5,18.99,14.54c11.83,3.66,20.85,4.61,20.85,15.48c0,10.67-10.02,14.41-20.17,14.41c-11.15,0-21.59-6.78-21.59-16.7","M52.4,29.4 L62.4,17.4"],"ź":["M34.73,36.74c5.62,0,41.16,0,45.26,0","M79.89,36.96c-9.48,10.72-40.58,45.37-48.39,53.84","M31.85,90.79c5.62,0,46.26,0,50.36,0","M53.9,30.7 L63.9,18.7"],"ż":["M34.73,36.74c5.62,0,41.16,0,45.26,0","M79.89,36.96c-9.48,10.72-40.58,45.37-48.39,53.84","M31.85,90.79c5.62,0,46.26,0,50.36,0","M56.9,24.7 L57.9,26.7"],"〜":["M14,58 C26,42 40,42 52,56 S80,72 95,52"],"ぁ":["M35.72,46.75c0.7,0.7,2.21,1.47,4.22,1.4c8.56-0.28,16.06-1.7,23.69-3.41c1.21-0.27,3.72-0.7,5.32-0.4","M51.03,34.43c0.7,0.8,1.21,2.87,0.85,4.46c-3.01,13.43-5.02,30.31-4.12,42.73c0.33,4.57,1.51,8.72,2.71,10.92","M63.53,55.67c0.6,0.9,0.93,3.52,0.4,4.91c-3.71,9.82-9.04,19.04-20.38,28.66c-5.51,4.67-12.75,3-13.05-6.71c-0.27-8.72,10.74-18.54,26-21.44c9.97-1.9,21.75,1.67,24.5,10.22c3.39,10.53-3.01,21.14-16.77,24.45"],"あ":["M31.01,33c0.88,0.88,2.75,1.82,5.25,1.75c8.62-0.25,20-2.12,29.5-4.25c1.51-0.34,4.62-0.88,6.62-0.5","M49.76,17.62c0.88,1,1.82,3.26,1.38,5.25c-3.75,16.75-6.25,38.13-5.13,53.63c0.41,5.7,1.88,10.88,3.38,13.62","M65.63,44.12c0.75,1.12,1.16,4.39,0.5,6.12c-4.62,12.26-11.24,23.76-25.37,35.76c-6.86,5.83-15.88,3.75-16.25-8.38c-0.34-10.87,13.38-23.12,32.38-26.74c12.42-2.37,27,1.38,30.5,12.75c4.05,13.18-3.76,26.37-20.88,30.49"],"い":["M21.5,29.66c2.01,2.17,2.61,4.68,2.17,7.43c-3.09,19.16-1.03,32.01,7.93,41.45c6.12,6.45,6.26,3.14,7.04-5.21","M72.96,36.51c9.44,8.05,17.79,18.82,18.41,33.83"],"う":["M42,15.5c5.62,2.12,9.62,3,12.88,3c8.27,0,8,1.12-0.38,5.5","M33,42.38c2.12,1.12,4.12,2.88,8.5,1.38c4.38-1.5,12.75-7.12,18.5-7c5.75,0.12,10.25,5,10.25,18c0,15.49-8.25,30.24-24.37,41.24"],"え":["M40.52,13.25c5.62,2.12,10,3,14.12,3c8.27,0,8,1.12-0.38,5.5","M32.52,45.12c1.88,1.25,4.5,1.75,7.38,0.62c3.29-1.29,17-7.88,21.25-9.88c4.25-2,8.32,0.04,4.38,4.62c-12.26,14.27-27.26,31.52-39.51,44.4c-3.26,3.42-0.58,3.54,1.5,1.37c13.5-14.12,18.12-20.12,23.62-20.12c7.13,0,3.5,16.75,6.75,22.38c3.25,5.63,19.12,3.75,26.12,2.12"],"お":["M22.88,35.12c1.38,1,3.62,2.38,6,2.12c2.38-0.26,19.62-5.12,21.12-5.74c1.5-0.62,4-1.25,5.88-2","M41.5,16.12c2.25,1,3.59,4.39,3.12,7.38c-2.5,16.12-3.37,45.53-2.25,58.38c0.75,8.62-0.64,10.45-7.12,7.12c-5.13-2.62-13.75-8-13.75-12.38c0-7.5,24.38-23.62,44.75-23.62c17.25,0,25,8.25,25,17.25c0,8.25-9.38,18.88-26.75,21","M73,22.12c5.38,2.62,8.88,5.88,10.62,8.25c2.27,3.08,0.38,4.5-1.12,5"],"か":["M24.62,38.62c1.88,1.62,4.65,2.33,8.62,1c25.5-8.5,29.5-4.13,29.5,7.62c0,9.38-1.24,17.46-4.25,25.25c-7.62,19.76-10.87,17.39-16.12,10.89","M48.5,17.5c1,1.38,1.29,4.7,0.5,7.12c-5,15.25-18.02,40.93-19.62,43.88c-3.12,5.75-6.38,11.88-9.38,16.25","M77.37,31.62c7.5,6.88,13.25,15.75,15,24.88"],"が":["M24.62,38.62c1.88,1.62,4.65,2.33,8.62,1c25.5-8.5,29.5-4.13,29.5,7.62c0,9.38-1.24,17.46-4.25,25.25c-7.62,19.76-10.87,17.39-16.12,10.89","M48.5,17.5c1,1.38,1.29,4.7,0.5,7.12c-5,15.25-18.02,40.93-19.62,43.88c-3.12,5.75-6.38,11.88-9.38,16.25","M77.37,31.62c7.5,6.88,13.25,15.75,15,24.88","M80.5,18.25c2.75,1.75,6,5.38,7.75,8.5","M86.87,13.38c3.06,1.57,6.68,4.82,8.62,7.62"],"き":["M30.5,30.25c1.88,0.75,4.64,1.06,5.88,0.88c6.75-1,22.25-4.5,26.5-6c2.17-0.76,3.5-1.25,4.88-2.12","M36.25,48.7c2.01,0.85,4.97,1.2,6.29,0.99c7.23-1.13,23.82-5.09,28.37-6.79c2.32-0.86,3.75-1.41,5.22-2.4","M42,14.12c1.5,0.88,3.13,2.94,4,5.12c5.5,13.76,16,29.26,26.37,40.76c7.64,8.47,9.12,9.38-6,3.88","M33.75,83.25c10.62,9.75,27.25,8.62,38.12,5"],"ぎ":["M30.5,30.5c1.88,0.75,4.64,1.06,5.88,0.88c6.75-1,22.25-4.5,26.5-6c2.17-0.76,3.5-1.25,4.88-2.12","M36.25,48.95c2.01,0.85,4.97,1.2,6.29,0.99c7.23-1.13,23.82-5.09,28.37-6.79c2.32-0.86,3.75-1.41,5.22-2.4","M42,14.38c1.5,0.88,3.13,2.94,4,5.12c5.5,13.75,16,29.25,26.38,40.75c7.64,8.47,9.12,9.38-6,3.88","M33.75,83.5c10.62,9.75,27.25,8.62,38.12,5","M77.37,19c2.75,1.75,6,5.38,7.75,8.5","M83.75,14.12c3.06,1.57,6.68,4.82,8.62,7.62"],"く":["M60.66,15c0.5,1.62,0.35,5.44-1,7.38c-6.75,9.62-14.3,19.08-18.62,24.5c-4,5-3.79,7.03-0.88,11c5.5,7.5,12.75,18.75,17.62,27.25c1.48,2.59,2.75,4.75,4.5,8.62"],"ぐ":["M60.66,15c0.5,2.12,0.75,5-1,7.38c-6.97,9.46-14.29,19.09-18.62,24.5c-4,5-3.79,7.03-0.88,11c5.5,7.5,12.75,18.75,17.62,27.25c1.48,2.59,2.75,4.75,4.5,8.62","M73.54,30c2.75,1.75,6,5.38,7.75,8.5","M79.91,25.12c3.06,1.57,6.68,4.82,8.62,7.62"],"け":["M24.67,19.75c1.25,1.5,2.62,3.75,2.12,6.38c-3,15.88-6.5,29.5-4.88,44.62c2.02,18.84,2.25,4.75,6.75-3.5","M53.67,38.62c2.12,1.38,4.28,1.89,6.88,1.5c8.25-1.25,15.39-2.57,20.62-4c2.76-0.74,5.26-1.12,6.88-1.12","M71.67,14.38c2.13,1.37,2.88,3.35,2.88,5.12c0,11.62,0.12,20.38,0.12,30.12c0,20.75-0.62,30.88-12.5,42.25"],"げ":["M24.91,20.25c1.25,1.5,2.37,3.75,1.88,6.38c-3,15.88-6.5,29.5-4.88,44.62c2.02,18.84,2.25,4.75,6.75-3.5","M53.67,39.12c2.12,1.38,4.28,1.89,6.88,1.5c8.25-1.25,15.39-2.57,20.62-4c2.75-0.75,5.25-1.12,6.88-1.12","M71.67,14.62c2.12,1.38,2.87,3.61,2.87,5.38c0,11.62,0.12,20.38,0.12,30.12c0,20.75-0.62,30.88-12.5,42.25","M86.17,13c2.75,1.75,6,5.38,7.75,8.5","M92.54,8.12c3.06,1.57,6.68,4.82,8.62,7.62"],"こ":["M34.75,26.75c1.12,0.88,2.91,2.01,6,1.5c7.62-1.25,14.11-2.56,22.38-2.62c15.5-0.12,5.88,5-5.75,9","M30,68.12c2.25,14.5,15.26,17.96,31,16.75c6.5-0.5,11.88-1.25,17.62-2.88"],"ご":["M34.75,27c1.12,0.88,2.91,2.01,6,1.5c7.62-1.25,14.11-2.56,22.38-2.62c15.5-0.12,5.88,5-5.75,9","M30,68.38c2.25,14.5,15.26,17.96,31,16.75c6.5-0.5,11.88-1.25,17.62-2.88","M80.37,16.25c2.75,1.75,6,5.38,7.75,8.5","M86.75,11.38c3.06,1.57,6.68,4.82,8.62,7.62"],"さ":["M27,38.9c2.42,1.33,5.38,1.47,8.32,1.06c8.79-1.24,28.67-7.76,34.15-10.43c2.79-1.36,3.78-1.91,6.28-3.53","M41.5,13.88c1.5,0.88,3.63,2.94,4.5,5.12c5.5,13.75,15.25,27.62,26.87,39.5c7.98,8.15,6.38,10-6,3.12","M35.25,80.5c4.5,11.75,20.88,12.5,38.38,7.5"],"し":["M39.12,17.5c1.25,3.12,0.93,6.74,0.38,10.25c-2.12,13.5-3,26.5-3,39.12c0,27.38,19.88,30.12,45.5,17.25"],"じ":["M39.12,17.25c1.25,3.12,0.93,6.74,0.38,10.25c-2.12,13.5-3,26.5-3,39.12c0,27.38,19.88,30.12,45.5,17.25","M64.24,27c2.75,1.75,6,5.38,7.75,8.5","M70.62,22.12c3.06,1.57,6.68,4.82,8.62,7.62"],"す":["M15.5,37.12c2.88,2.12,6.94,1.51,12.75,0.25c16.12-3.5,36.14-5.38,46.62-6.5c7-0.75,11.88-0.62,17.75,0.12","M57.62,13.38c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,35.12,0,40.75c0,14.62-15.62,16.38-15.62,1.75c0-14.25,18-14.12,18,6.38c0,13.25-7.75,21.5-16,28.38"],"ず":["M15.5,37.12c2.88,2.12,6.94,1.51,12.75,0.25c16.12-3.5,36.14-5.38,46.62-6.5c7-0.75,11.88-0.62,17.75,0.12","M57.62,13.38c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,35.12,0,40.75c0,14.62-15.62,16.38-15.62,1.75c0-14.25,18-14.12,18,6.38c0,13.25-7.75,21.5-16,28.38","M77,13c2.75,1.75,6,5.38,7.75,8.5","M83.37,8.12c3.06,1.57,6.68,4.82,8.62,7.62"],"せ":["M16.5,49.93c2.88,2.42,6.86,1.57,12.75,0.53c19-3.34,33-5.72,47.12-7.64c6.99-0.95,11.88-1.21,17.75-0.36","M69.74,17.75c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,17.88,0,23.5c0,25.62-5.75,23.25-11.88,19","M35.62,26.25c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,28.38,0,34c0,14.5,6.38,19.55,20.14,19.55c10.24,0,13.74,0.07,22.61-1.68"],"ぜ":["M16.5,49.93c2.88,2.42,6.86,1.57,12.75,0.53c19-3.34,32.5-5.34,47.12-7.64c6.97-1.1,11.88-1.21,17.75-0.36","M69.74,17.75c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,17.88,0,23.5c0,25.62-5.75,23.25-11.88,19","M35.62,26.25c2,1.5,2.75,3.25,2.75,5.88c0,10.38,0,28.38,0,34c0,14.5,6.38,19.55,20.14,19.55c10.24,0,13.74,0.07,22.61-1.68","M84.5,17.25c2.75,1.75,6,5.38,7.75,8.5","M90.87,12.38c3.06,1.57,6.68,4.82,8.62,7.62"],"そ":["M38.4,22c1.88,1.25,4.98,1.05,7.5,0.38c6.5-1.75,13.25-3.75,19.38-5.38c4.63-1.23,7.18,2.06,3.62,5.25c-12.12,10.87-31.14,24.4-40,30.25c-6.25,4.12-5.88,5.75,1.38,3.88c17.08-4.42,35.96-8.68,50.12-10.38c9.38-1.12,9.62,0.12,0.5,1.38c-15.82,2.17-34.38,14.25-34.38,26.5c0,12.88,11.62,20.38,31.5,16.62"],"た":["M24.38,35.38c1.38,0.62,3.88,1.51,6.38,1.12c6.5-1,16.25-2.88,24.88-4.75c2.64-0.57,5.38-1.5,7.62-2.38","M45,16.88c0.75,1.25,0.87,3.62,0.38,5.25c-6.35,20.94-12.75,36.37-18.88,52.37c-1.36,3.56-4.75,11.75-6,14.62","M56.38,53.25c12.38-2.75,18.25-3.7,23.62-3.12c15.12,1.62-1.12,2.25-4.25,4.88","M54.13,82.25c4.38,7,14.25,8.12,34.5,5.62"],"だ":["M24.38,35.38c1.38,0.62,3.88,1.51,6.38,1.12c6.5-1,16.25-2.88,24.88-4.75c2.64-0.57,5.38-1.5,7.62-2.38","M45,16.88c0.75,1.25,0.87,3.62,0.38,5.25c-6.35,20.94-12.75,36.37-18.88,52.37c-1.36,3.56-4.75,11.75-6,14.62","M56.38,53.25c12.38-2.75,18.25-3.7,23.62-3.12c15.12,1.62-1.12,2.25-4.25,4.88","M54.13,82.25c4.38,7,14.25,8.12,34.5,5.62","M76,22.5c2.75,1.75,6,5.38,7.75,8.5","M82.38,17.62c3.06,1.57,6.68,4.82,8.62,7.62"],"ち":["M24.5,32.62c1.38,0.62,3.88,1.51,6.38,1.12c6.5-1,18.25-4.12,26.88-6c2.64-0.57,5.38-1.5,7.62-2.38","M45.62,15.62c0.75,1.25,0.71,3.58,0.38,5.25c-3,15-4.25,22.59-8.38,38.62c-3.25,12.62-5.38,11.12,3.62,4.38c8.29-6.21,19.75-9.5,28.5-9.5c8.62,0,14.58,5.88,14.5,14.5c-0.12,13.5-16.5,20.62-29.88,23.25"],"っ":["M23,61.15c1.49,1.29,3.72,1.67,6.46,0.5c14.21-6.07,23.85-8.85,35.68-8.65c9.99,0.17,18.28,5.7,18.18,15.24c-0.15,14.93-18.46,23.39-35.79,25.51"],"つ":["M14,44.75c1.88,1.62,4.68,2.09,8.12,0.62c17.88-7.62,30-11.12,44.88-10.88c12.56,0.21,22.98,7.17,22.87,19.17c-0.18,18.77-24.75,28.71-45.01,32.08"],"て":["M20.5,26.38c1.87,1.62,4.42,1.97,8.12,1.37c21.75-3.5,33-5.12,50.12-8.38c12.34-2.34,13-0.88,0.38,1.38c-17.89,3.19-33.78,19.12-33.78,37.62c0,20.5,17.91,30.25,35.16,30.25"],"で":["M20.5,26.38c1.87,1.62,4.42,1.97,8.12,1.37c21.75-3.5,33-5.12,50.12-8.38c12.34-2.34,13-0.88,0.38,1.38c-17.89,3.19-33.78,19.12-33.78,37.62c0,20.5,17.91,30.25,35.16,30.25","M75,41.75c2.75,1.75,6,5.38,7.75,8.5","M81.37,36.88c3.06,1.57,6.68,4.82,8.62,7.62"],"と":["M35.5,18.38c1.74,0.74,3.62,2.62,4.12,5.37c0.5,2.75,4.75,25,5.38,28.12","M78.12,25.5c0.25,1.88,0.04,4.09-2.25,5.75c-6.37,4.63-13.22,8.49-22.75,15.25c-12.88,9.12-21.62,18.38-21.62,27.5c0,10.12,8.5,13.88,26.88,13.88c6.25,0,14.75-0.12,21.62-1.25"],"ど":["M35.5,18.38c1.74,0.74,3.62,2.62,4.12,5.37c0.5,2.75,4.75,25,5.38,28.12","M78.12,25.5c0.25,1.88,0.04,4.09-2.25,5.75c-6.37,4.63-13.21,8.49-22.75,15.25c-12.88,9.12-21.62,18.38-21.62,27.5c0,10.12,8.5,13.88,26.88,13.88c6.25,0,14.75-0.12,21.62-1.25","M84.24,14.5c2.75,1.75,6,5.38,7.75,8.5","M90.62,9.62c3.06,1.57,6.68,4.82,8.62,7.62"],"な":["M22.88,28.96c1.18,0.58,3.3,1.1,5.47,1.05c5.53-0.13,10.9-0.98,16.52-2.42c4.82-1.23,9.13-3.12,11.38-4.22","M42.99,14c0.63,0.89,0.56,2.52,0.31,3.72c-2.96,14.16-7.95,26.56-14.25,37.87c-2.05,3.69-4.25,7.24-6.55,10.65","M72.26,23.25c6.88,2.5,12.62,5.62,14.75,9.5c4.06,7.41-0.25,3.38-3.5,3.88","M68.88,44.62c-1,1.88-2.14,5.24-1.88,8.25c0.62,7,1.5,13.12,1.5,20.62c0,20-27.88,19.75-27.88,9.38c0-5.62,8.25-8.25,13.88-8.25c8.75,0,21.5,3.25,29.75,11.5"],"に":["M24.53,22.75c1.25,1.5,1.62,3.75,1.12,6.38c-3,15.88-9,32.5-7.38,47.62c2.02,18.84,4.5,5.75,8.5-3.5","M53.2,30.64c0.96,0.79,2.44,1.58,5.1,1.35c6.98-0.61,15.01-3.3,22.04-3.36c13.19-0.11,1.5,3.75-8.39,7.35","M52.53,68c1.76,12.92,11.92,16.01,24.23,14.93c5.08-0.45,8.9-0.8,14.27-2.06"],"ね":["M33.29,14.5c1.62,1.62,2.1,3.21,1.88,5.88c-1.03,11.93-2.06,31.66-2.53,53.12c-0.1,4.62-0.18,9.31-0.22,14","M17.16,37.88c1.62,0.88,3.25,1.38,5.62,0.75c2.14-0.56,7.8-2.31,12.37-4.03c6.26-2.35,6.88-1.47,3.12,3.63c-5.56,7.53-13.02,17.38-18.48,26.77c-5.6,9.62-3.45,8.3,2,3c19.12-18.62,38.5-39.12,54.12-39.12c11.38,0,12.88,11.25,12.88,32.5c0,28.62-30.18,24.88-30.18,16.26c0-9.63,18.73-7.82,28.06-1.88c2.75,1.75,5.88,4.88,7.5,6.75"],"の":["M53.82,28.62c1,1.5,1.34,4.12,0.88,6.62c-1.75,9.5-6.89,25-10.75,33.12c-9.63,20.26-16.55,14.74-24.38-1.98c-9.13-19.5,23.5-48.88,50.63-40.38c32.38,10.15,28,54.62-4.75,60.88"],"は":["M24.51,18c1.25,1.5,2.15,4,1.62,6.62c-3.5,17.62-6.98,36.4-4,54.88c2.5,15.5,1.12,2,5.62-6.25","M49.64,37.89c2.41,1.57,4.85,2.16,7.8,1.71c9.36-1.43,17.46-2.94,23.4-4.57c3.12-0.86,5.96-1.29,7.8-1.29","M69.77,16.5c2.25,2.12,2.88,4.12,2.88,6.5c0,2.38,1.5,38.62,1.5,48c0,22.5-30.62,19.62-30.62,10.5c0-9.75,23.88-5.62,29.5-2.88c5.62,2.74,11.98,8.26,13.36,9.38"],"ば":["M24.75,17.75c1.25,1.5,1.9,4.25,1.38,6.88c-3.5,17.62-6.98,36.4-4,54.88c2.5,15.5,1.12,2,5.62-6.25","M49.88,37.89c2.41,1.57,4.85,2.41,7.8,1.96c9.36-1.43,17.21-3.19,23.15-4.82c3.12-0.86,5.96-1.29,7.8-1.29","M69.75,16.5c2.26,2.12,2.88,4.12,2.88,6.5c0,2.38,1.5,38.62,1.5,48c0,22.5-30.62,19.62-30.62,10.5c0-9.75,23.88-5.62,29.5-2.88c5.62,2.74,12,8.25,13.38,9.38","M84.75,15.25c2.75,1.75,6,5.38,7.75,8.5","M91.13,10.38c3.06,1.57,6.68,4.82,8.62,7.62"],"ぱ":["M24.51,18c1.25,1.5,2.15,4,1.62,6.62c-3.5,17.62-6.98,36.4-4,54.88c2.5,15.5,1.12,2,5.62-6.25","M49.64,37.89c2.41,1.57,4.85,2.16,7.8,1.71c9.36-1.43,17.46-2.94,23.4-4.57c3.12-0.86,5.96-1.29,7.8-1.29","M69.77,16.5c2.25,2.12,2.88,4.12,2.88,6.5c0,2.38,1.5,38.62,1.5,48c0,22.5-30.62,19.62-30.62,10.5c0-9.75,23.88-5.62,29.5-2.88c5.62,2.74,11.98,8.26,13.36,9.38","M91.01,24.38c-9.62,0-9.25-14.25,0-14.25c9.76-0.01,9.5,14.25,0,14.25"],"ひ":["M20,25.12c1.25,0.88,3.75,2.25,6.5,1.38c2.75-0.87,7.31-2.38,11.38-4.5c6-3.12,8.42-1.01,4.25,4c-27.13,32.62-23.76,58.5-1.52,62.88c18.07,3.56,37.63-16.38,35.63-56.51c-0.72-14.5-0.17-14.78,4.12-1.75c3.76,11.38,10.26,20.76,16.14,26.5"],"び":["M20,25.12c1.25,0.88,3.75,2.25,6.5,1.38c2.75-0.87,7.31-2.38,11.38-4.5c6-3.12,8.42-1.01,4.25,4c-27.13,32.62-23.76,58.5-1.52,62.88c18.07,3.56,37.63-16.38,35.63-56.51c-0.72-14.5-0.17-14.78,4.12-1.75c3.76,11.38,10.26,20.76,16.14,26.5","M86.5,13.5c2.75,1.75,6,5.38,7.75,8.5","M92.87,8.62c3.06,1.57,6.68,4.82,8.62,7.62"],"ふ":["M42.63,15.62c3.62,3.38,7.5,5.38,12.74,6.13c9.59,1.37,3.5,3.38-1.88,6.12","M43.63,46.88c1.88,4.62,7.5,9.41,14.25,17.5c10.62,12.74,0.49,30-19.13,21.62","M16.5,73.38c0.75,4,1.88,8.12,5,10.12c1.16,0.74,0.12-3.38,13.25-9.12","M80.13,61.88c5.12,3.38,10.28,7.49,11.38,8.88c6.75,8.5-0.25,4.62-4.62,7.12"],"ぶ":["M42.12,15.62c3.62,3.38,7.5,5.38,12.75,6.12c9.59,1.37,3.5,3.38-1.88,6.12","M43.12,46.88c1.88,4.62,7.5,9.41,14.25,17.5c10.62,12.75,0.5,30-19.12,21.62","M16.5,73.88c0.75,4,1.88,8.12,5,10.12c1.16,0.74,0.12-3.38,13.25-9.12","M79.62,61.88c5.5,3.38,10.28,7.49,11.38,8.88c6.75,8.5-0.25,4.62-4.62,7.12","M73.62,16.25c2.75,1.75,6,5.38,7.75,8.5","M80,11.38c3.06,1.57,6.68,4.82,8.62,7.62"],"ぷ":["M42.13,15.62c3.62,3.38,7.5,5.38,12.74,6.13c9.59,1.37,3.5,3.38-1.88,6.12","M43.13,46.88c1.88,4.62,7.5,9.41,14.25,17.5c10.62,12.74,0.49,30-19.13,21.62","M16.5,73.88c0.75,4,1.88,8.12,5,10.12c1.16,0.74,0.12-3.38,13.25-9.12","M79.63,61.88c5.5,3.38,10.28,7.49,11.38,8.88c6.75,8.5-0.25,4.62-4.62,7.12","M80.87,26.62c-9.62,0-9.25-14.25,0-14.25c9.76,0.01,9.5,14.25,0,14.25"],"へ":["M15,48.75c2.25,1.62,4.67,1.96,7-0.38c3.62-3.62,7.46-6.54,11.25-10.5c5.5-5.75,8.48-4.75,13.12-0.88c12.12,10.12,30.38,25.12,33.38,27.38c3,2.26,12.37,10.38,13.87,11.63"],"べ":["M15,48.75c2.25,1.62,5,1.38,7.62-1c3.89-3.52,6.12-5.75,10.62-9.88c5.88-5.37,8.49-4.75,13.14-0.87c12.12,10.12,30.38,25.12,33.38,27.38c3,2.26,12.37,10.37,13.87,11.62","M66.76,26.75c2.75,1.75,6,5.38,7.75,8.5","M73.13,21.88c3.06,1.57,6.68,4.82,8.62,7.62"],"ほ":["M24.51,18.75c1.25,1.5,2.15,4,1.62,6.62c-3.5,17.63-6.98,37.4-4,55.88c2.5,15.5,1.12,2,5.62-6.25","M53.08,21.13c1.9,1.28,3.82,1.76,6.14,1.4c7.36-1.17,13.73-2.4,18.41-3.73c2.46-0.7,4.69-1.05,6.13-1.05","M53.83,44.3c2.21,1.44,4.46,1.98,7.16,1.57c8.59-1.31,15.78-2.44,21.23-3.94c2.87-0.79,5.72-1.18,7.41-1.18","M72.51,23c1.38,1.62,1.62,4.12,1.62,6.5c0,2.38,2,35.12,2,44.5c0,17.5-29.88,17.12-29.88,8c0-9.75,21.38-7.88,29.5-2.88c5.33,3.28,12,8.25,13.38,9.38"],"ぼ":["M24.51,18.75c1.25,1.5,2.15,4,1.62,6.62c-3.5,17.63-6.98,37.4-4,55.88c2.5,15.5,1.12,2,5.62-6.25","M53.08,21.13c1.9,1.28,3.82,1.76,6.14,1.4c7.36-1.17,13.73-2.4,18.41-3.73c2.46-0.7,4.69-1.05,6.13-1.05","M53.83,44.3c2.21,1.44,4.46,1.98,7.16,1.57c8.59-1.31,15.78-2.44,21.23-3.94c2.87-0.79,5.72-1.18,7.41-1.18","M72.51,23c1.38,1.62,1.62,4.12,1.62,6.5c0,2.38,2,35.12,2,44.5c0,17.5-29.88,17.12-29.88,8c0-9.75,21.38-7.88,29.5-2.88c5.33,3.28,12,8.25,13.38,9.38","M87.51,26c2.75,1.75,6,5.38,7.75,8.5","M93.88,21.12c3.06,1.57,6.68,4.82,8.62,7.62"],"ま":["M29.83,32.28c2.2,1.15,4.43,1.5,7.14,1.26c11.54-1.04,25.94-3.12,34.66-4.85c2.87-0.57,5.45-0.44,7.13-0.44","M33.83,51.84c2.45,1.61,4.94,1.72,7.94,1.26c9.52-1.46,17.87-3.1,27.03-5.16c3.22-0.72,6.34-1.32,8.21-1.32","M55.81,14c1.52,1.8,1.8,4.57,1.8,7.19c0,2.63,0.46,43.88,0.46,54.25c0,21.3-30.07,19.96-30.07,9.86c0-10.79,25.88-9.93,38.57-3.18c6.12,3.25,11.55,6.38,14.8,9.13"],"み":["M32.5,26c1.88,1.75,4.06,1.7,6.88,1.25c3.88-0.62,7.62-1.75,11.88-3.12c4.26-1.37,6.25-0.12,4.5,5.12c-1.75,5.24-6.66,17.39-12,30.12c-13.63,32.51-29.26,29.26-29.26,18.63c0-14.25,20.48-15.36,33-13.5c18.5,2.75,30,6.62,44.38,14.25","M79.38,54.75c0.75,2.38,0.49,4.37,0,6.25c-2.12,8.12-7.5,25-22.12,33.75"],"む":["M19.59,31.65c2.1,1.55,4.24,1.66,6.81,1.21c8.17-1.41,15.33-2.98,23.19-4.96c2.76-0.69,5.44-1.27,7.05-1.27","M37.02,15.5c1.62,1.25,2.31,2.88,2.12,5.25c-0.88,11.12-1.5,20.75-4,34.88c-3.61,20.44-19.25,16.99-18.62,7.37c0.5-7.74,6.25-12.86,12.62-13.5c5-0.5,14.28,1.93,5.88,15c-12.62,19.62-11.42,24.51,5.11,25.54c10.98,0.68,19.26,0.72,28.49-0.92c14.15-2.5,7.4-2.63,7.4-11.13","M78.52,36.25c6.88,3.12,11.71,5.95,14.88,10.12c6.25,8.25-1.38,3.62-4.5,4.5"],"め":["M27.48,31.75c1.75,1,2.41,3.09,2.5,5.25c0.5,11.62,2.75,23.5,7.25,31.38c1.39,2.44,5.38,8.5,7.25,10.38","M59.6,19.38c1,1.5,1.35,4.12,0.88,6.62c-2.75,14.62-13.62,37.75-20.1,47.24c-12.28,17.14-16.78,13.14-22.28,0.64c-5.38-15.38,26.4-42.18,53.42-35.28c29.08,8.27,23.96,46.02-7.98,50.15"],"も":["M49.17,14.75c1.88,1.88,1.86,4.52,1.12,8c-3,14.25-5,26.62-7,42.12c-2.55,19.73-0.75,29.88,17,29.86c20.25-0.02,28.63-13.11,20.01-35.73","M26.54,34.62c1.12,0.88,2.87,2.21,6,2c11.12-0.75,20-2.12,27.74-3.46c3.88-0.67,5.88-1.17,8.88-1.04","M26.42,53.38c-1.5,4,1,6.75,7.75,6.75c8.75,0,17.62-1,22.88-1.88c2.01-0.33,5.38-1,7.5-1.75"],"や":["M18,49.38c1.88,1.62,5.25,2.5,8.62,0.88c18.51-8.88,35.76-19.38,50.83-19.26c9.02,0.14,16.01,4.13,15.93,12.29c0,8.33-10.88,16.58-24.5,17.83","M47.13,15.88c5.12,0.88,10.41,4.05,11.5,6.62c2.12,5-1,2.38-2.88,2.62","M30,24.38c2.38,1.88,3.28,2.87,3.88,5.25c2.62,10.5,11.12,41.12,14.75,52.5c0.65,2.04,1.88,6.25,2.88,9.38"],"ゅ":["M27.74,40.79c1.1,1.2,1.61,3.3,1.2,5c-2.3,9.4-3.2,17.79-1.7,27.99c2.22,15.08,0.9,3.1,2.6-1.2c7.19-18.19,21.79-27.59,35.49-27.59c13.5,0,17.49,9.1,17.49,16.2c0,21.89-24.69,23.69-34.39,13.4","M57.63,33.89c2.1,1.4,2.53,2.5,2.8,5.7c0.7,8.4,1.12,14.97,1.3,23.49c0.4,19.19-5,25.59-9.9,31.39"],"ゆ":["M21.05,25.38c1.38,1.5,2.02,4.13,1.5,6.25c-2.88,11.75-4,22.25-2.12,35c2.77,18.85,1.12,3.88,3.25-1.5c9-22.75,27.24-34.5,44.38-34.5c16.88,0,21.88,11.38,21.88,20.25c0,27.38-30.88,29.62-43,16.75","M58.42,16.75c2.62,1.75,3.17,3.13,3.5,7.12c0.88,10.5,1.4,18.72,1.62,29.38c0.5,24-6.25,32-12.38,39.25"],"ょ":["M57.8,50.06c5.98-1.02,10.95-2.09,14.74-3.25c1.99-0.61,3.8-0.91,4.98-0.91","M54.91,33c1.79,1.69,2.38,3.28,2.29,5.16c-0.6,13.49-0.1,27.68,1.11,42.47c1.5,18.31-27.81,16.56-27.81,9.12c0-9.53,20.92-6.35,28.68-3.27c6.46,2.56,9.18,3.87,14.76,8.23"],"よ":["M58.24,35.38c7.5-1.28,13.74-2.63,18.5-4.1c2.5-0.77,4.77-1.15,6.25-1.15","M54.62,13.88c2.25,2.12,2.98,4.13,2.88,6.5c-0.75,17-0.12,34.88,1.39,53.5c1.88,23.07-34.89,20.88-34.89,11.5c0-12,26.25-8,35.98-4.12c8.1,3.23,11.52,4.88,18.52,10.38"],"ら":["M35.33,15c3.75,3,9.22,4.41,16.5,4.25c11.12-0.25-0.25,2.38-1.25,3.5","M35.83,35.75c-2.14,4.34-2.79,8.67-3.11,13.24c-0.42,5.84-0.31,12.05-2.14,19.13c-3.16,12.27,1.49,4.77,3,3.5c11.88-10,21.7-12.67,32.61-12.49c9.21,0.15,16.85,5.19,16.76,13.88c-0.12,13.6-14.24,21.49-32.49,22.49"],"り":["M38.75,25.25c1.25,1.5,2.24,4.03,1.62,6.62c-2.88,12.13-6.29,29.65-4.25,42.38c2,12.5,1.75-0.75,5.62-6.25","M69.37,18.75c2.25,2.12,2.88,4.12,2.88,6.5c0,2.38,0,26.38,0,35.75c0,16.5-5,25.75-12.62,33.12"],"る":["M34.31,20.38c1.75,1.25,4.62,2.62,8.5,1.5c3.88-1.12,9.62-2.5,15.62-4.62c6-2.12,7.5-0.12,4.38,4.25c-3.12,4.37-18.89,24.62-27.75,34c-8.5,9-13.09,11.89,0.75,3.25c15.62-9.75,43-10.88,43,13.38c0,22.5-40.88,24.5-40.88,12.62c0-11.25,18.12-8.75,24.38-0.38"],"れ":["M34.48,13c1.5,1.38,2.83,3.74,2.5,6.38c-0.5,4-2.75,44.5-2.75,52.88c0,8.38,0.12,16.62,0.12,19.5","M16.98,40.75c2.12,1.38,3.74,1.46,7.5,0c4.5-1.75,6.55-2.66,13-5.5c4.25-1.88,4.4,0.24,2.5,3.5c-5.25,9-10.5,16.75-18.88,27.62c-7.55,9.81-6.93,12.85,3.25,3.12c14-13.38,20.34-19.76,33.88-32.5c6.38-6,19.39-12.09,18.14,0.88c-1.02,10.63-1.89,22.13-2.29,30.75c-1.02,21.71,11.53,18,20.15,8.63"],"ろ":["M36.95,21.88c1.5,2,4.62,3.62,8.5,2.5c3.88-1.12,8.12-2.25,14.12-4.38c6-2.13,6.53-0.1,3.38,4.25c-7.88,10.88-18,22.75-27.5,35.25c-7.49,9.86-10.68,11.32,2.88,2.25c17.38-11.62,46.62-14,46.62,8.12c0,15.62-16,22.5-32.12,25.12"],"わ":["M38.53,14.75c1.5,1.38,2.22,3.73,2,6.38c-1,11.87-2.75,44.49-2.75,52.87c0,8.38-0.62,16.62-0.62,19.5","M17.53,40.75c2.12,1.38,3.68,1.3,7.5,0c5.88-2,9.8-3.16,16.25-6c4.25-1.88,6.12,0,2.75,4c-6.72,7.96-13,16.5-22.12,27.88c-7.75,9.66-7.54,12.21,3,2.88c21.88-19.38,49.75-35.62,63.5-21c14.36,15.27,1.62,36.62-23.38,42.62"],"ん":["M56.35,16.5c0.75,1.75,1.13,5.83-0.38,8.25c-7,11.25-27.22,43.47-33.88,54.37c-9,14.75-7.62,16.25,1.5,1.25c17.86-29.36,32-23.76,32-6.75c0,25,19,26.5,34.25-5"],"ア":["M23.5,26.25c2.41,1.56,3.98,1.44,8.51,0.75c11.4-1.75,37.77-5.5,48.28-6.78c5.23-0.64,7.99,2.06,2.62,6.04c-6.75,5-13.12,9.5-23.25,16","M53.12,41.12c0.79,1.5,1.02,3.24,0.58,5.28c-4.04,18.48-9.92,31.85-19.92,45.48"],"イ":["M69.75,16.75c0.12,1.75-0.34,3.86-1.62,5.5c-10.13,12.87-23.75,29.63-45.63,42.87","M56.38,43.88c1,1.12,1.25,3,1.25,4.62c0,1.62,0,32.75,0,34.62c0,1.87-0.13,9.13-0.13,11.76"],"オ":["M19.5,37.85c3.91,1.78,7.55,1.55,11.01,1.02c18.03-2.75,34.4-4.5,50.55-5.41c3.34-0.19,6.35,0.17,10.46,1.38","M60.38,16.38c1.32,1.49,1.65,3.97,1.65,6.12c0,8-0.25,46.23-0.25,58.63c0,20.38-5.88,7.5-9.25,5.5","M60.29,36.38c0,1.62-1.64,3.61-3.62,6c-7.88,9.5-21.12,22.75-34.62,33"],"キ":["M27,40.5c1.75,0.62,4.77,1.09,7.25,0.38c11.75-3.38,30.62-8.13,37.5-9.88c2.62-0.67,6.75-1.12,9-1","M19.5,65.8c2.28,0.84,6.24,1.18,9.46,0.17c17.79-5.59,32.67-9.09,49.17-12.99c3.43-0.81,8.81-1.52,11.74-1.35","M48.87,16.75c2.5,1.75,3.43,3.24,3.88,6.12c2.12,13.62,6.38,45.38,8.25,59.25c0.4,3,1,8.38,1.38,11.12"],"ケ":["M40.96,17.88c0.44,1.9,0.39,4.42-0.59,6.5c-4.82,10.31-9.21,19.67-18.87,30.62","M37.88,37.62c2.12,0.88,4.15,1.04,6.62,0.5c12.62-2.75,25.5-4.88,35.75-6.5c3.61-0.57,6.25-0.75,9.25-0.5","M64.46,38.88c0.44,1.9,0.5,4.27-0.08,6.5c-3.63,13.75-9.25,31.25-24.63,43.87"],"ゲ":["M40.96,17.88c0.44,1.9,0.39,4.42-0.59,6.5c-4.82,10.31-9.21,19.67-18.87,30.62","M37.88,37.62c2.12,0.88,4.15,1.04,6.62,0.5c12.62-2.75,25.5-4.88,35.75-6.5c3.61-0.57,6.25-0.75,9.25-0.5","M64.46,38.88c0.44,1.9,0.5,4.27-0.08,6.5c-3.63,13.75-9.25,31.25-24.63,43.87","M83.62,13.94c2.95,1.81,6.43,5.57,8.3,8.81","M90.12,9.12c3.02,1.63,6.58,5,8.5,7.9"],"ジ":["M39.87,19.75c5.14,1.57,9.79,6.01,11.5,8.62","M26,42.62c3.25,0.88,10.25,5.5,12.25,8.13","M33,85c3.62,1.62,6.5,0.88,10.38-1.38c17.81-10.34,32.37-23.87,46.12-42.87","M78.5,18.98c2.85,1.78,6.21,5.47,8.03,8.65","M85.25,14.38c2.93,1.57,6.39,4.83,8.25,7.63"],"ス":["M30.13,29.38c1.75,1.5,4.15,1.98,6.62,1.38c13.25-3.25,24.25-5.62,31.25-7.38c7-1.76,8.64,1.16,6.5,5.75c-11.24,24.12-28.37,45.87-53.5,57.25","M61,57.25c11,7.38,21,17,28,28.62"],"ッ":["M29,51.88c1.89,2.42,3.59,7.57,3.89,11.2","M48.24,45.73c2.69,2.83,5.28,7.67,5.58,12.01","M79.34,49.8c0.6,1.82,0.31,4.24-0.6,6.46c-6.08,14.83-16.95,32.44-36.68,41.62"],"ト":["M44,16.38c1.25,1.12,2.12,3.25,2.12,5.5c0,26.12,0,53.5,0,57.62c0,4.12,0,10.5,0,13.38","M49.24,43.12c11.75,4.12,18.25,10.62,24.5,18.75"],"ド":["M44,16.38c1.25,1.12,2.12,3.25,2.12,5.5c0,26.12,0,53.5,0,57.62c0,4.12,0,10.5,0,13.38","M49.24,43.12c11.75,4.12,18.25,10.62,24.5,18.75","M66.87,26.75c2.75,1.75,6,5.38,7.75,8.5","M73.24,21.88c3.06,1.57,6.68,4.82,8.62,7.62"],"ホ":["M22.63,40.38c2.62,1,4.75,1.71,9.12,1.25c17.75-1.88,29.25-2.75,45.38-3.88c3.74-0.26,7.38-0.12,11.12,0.62","M53.75,17.12c1.38,1.88,1.38,4.5,1.38,7.38c0,2.88-0.12,46.62-0.12,51.88c0,23.12-6.25,11.25-9.75,9.62","M27.38,59.38c0.5,9.25-1.38,16.62-6.38,21.88","M73.25,52.75c10.88,9.63,15.5,17.63,16.63,24.87"],"ボ":["M22.63,40.38c2.62,1,4.75,1.71,9.12,1.25c17.75-1.88,29.25-2.75,45.38-3.88c3.74-0.26,7.38-0.12,11.12,0.62","M53.75,17.12c1.38,1.88,1.38,4.5,1.38,7.38c0,2.88-0.12,46.62-0.12,51.88c0,23.12-6.25,11.25-9.75,9.62","M27.38,59.38c0.5,9.25-1.38,16.62-6.38,21.88","M73.51,53c10.87,9.62,15.5,17.62,16.62,24.88","M72.63,17.5c2.75,1.75,6,5.38,7.75,8.5","M79.01,12.62c3.06,1.57,6.68,4.82,8.62,7.62"],"マ":["M21.5,33.75c1.88,1.88,3.5,1.99,6.5,1.62c19.62-2.38,33.5-4,51.25-6.38c6.85-0.92,9.37,1.67,4.38,7.62c-7.12,8.5-17.88,20-28.75,31.62","M43.38,58.88c8.43,6.5,16.6,15.93,20.25,26.25"],"ム":["M53.84,22.5c0.88,1.75,0.78,4.57-0.38,6.88c-9.25,18.38-16.19,30.96-25.25,45.75c-3.75,6.12-3,8.38,4.38,7.12c7.38-1.26,46.62-8.12,49.62-8.88","M72.21,60.12c6.88,6.38,13.62,14.88,16,25.38"],"ュ":["M34.8,52.84c1.91,1.21,4.13,1.67,7.44,1.21c10.65-1.51,13.99-1.68,21.71-2.97c5.43-0.9,6.26,0.13,5.23,5.12c-1.91,9.25-3.92,19.45-5.23,27.49","M24.5,86.21c2.21,1.21,3.84,1.73,7.34,1.21c18.54-2.79,28.95-3.12,43.52-3.12c3.02,0,5.93,0.4,8.95,0.9"],"ル":["M34.38,31.88c1.12,1.5,1.72,3,1.62,4.88c-1.12,22.88-8.88,40.62-17.5,49.5","M56.51,19.62c1.5,1.25,2.38,3.12,2.38,5.38c0,2.26-0.12,47.62-0.12,51.62c0,10.5,0.52,10.21,9.38,2.75c9.5-8,16.5-14.62,26.38-25.62"],"ロ":["M25,33.25c1.5,1.25,2.16,3.14,2.38,5.38c0.96,10.07,2.14,23.67,3.14,34.88c0.31,3.4,0.59,6.58,0.86,9.38","M28.13,36.12c9.25-1,37.62-3.12,45.62-4.25c8-1.13,9.57,0.53,8.38,6.62c-2.13,10.89-4.13,21.89-6.75,34.89","M32,78.12c5.38-0.5,33.62-3,36.5-3c2.88,0,7.88-0.25,11.5,0.25"],"ー":["M14.5,53c5.75-0.75,11.62-0.95,14.5-1c21.62-0.38,40.75-1.62,45.38-1.62c4.63,0,16.75-0.62,20.12-0.62"],"中":["M19.89,36.87c1,1,1.74,2.25,2.01,3.65c1.13,5.71,2.58,13.06,4.17,22.97c0.27,1.68,0.55,4.43,0.83,6.26","M23.33,39.51C37.12,37.62,70.88,34,84,33.24c4.38-0.25,6,1.14,5.12,4.42c-1.53,5.7-5.61,20.18-6.12,22.09","M27.74,64.84C40.12,63.62,61.86,62.2,79,60.77c2.36-0.2,5.75-0.27,7.25-0.27","M52.5,11.5c1.44,1.44,2.25,3.5,2.25,5.06c0,0.9,0.06,56.6-0.15,76.69c-0.03,3.3-0.07,5.6-0.1,6.5"],"出":["M52.76,13.38c1.42,1.42,1.86,2.91,1.86,5.31c0,3.18,0.19,61.81,0.19,68.31","M29.02,36.13c0.98,1.12,1.23,2.87,1.06,4.04c-0.4,2.82-1.02,7.67-2.78,13.4c-0.43,1.41,0.07,2.84,1.55,2.39c10.61-3.24,33.9-5.33,55.97-6.28","M86.31,30.63c0.94,1.37,1.17,3,0.94,4.87c-0.62,5.12-0.86,7.07-1.66,13.48c-0.15,1.19-0.34,1.9-0.51,3.4","M25.27,71.13c1.11,1.11,1.6,2.74,1.31,4.29c-0.53,2.8-1.27,8.92-3.03,14.65c-0.43,1.41,0.57,3.11,2.05,2.64c12.9-4.08,41.9-6.21,59.47-7.03","M85.06,66.88c1.06,1.49,1.56,3.12,1.44,5.37c-0.27,4.8-0.23,9.14-0.45,13.51c-0.08,1.54-0.17,3.17-0.3,4.99"],"朝":["M16.88,27.13c1.87,0.37,4.34,0.34,5.62,0.12c7.35-1.23,18.38-2.86,24.74-3.37c1.6-0.13,4.33-0.68,5.89-0.07","M33.9,11.75c1.1,1,1.76,2.5,1.76,3.7c0,0.68,0.2,16.33,0.12,20.55","M17.77,38.44c1.23,0.81,2.01,2.14,2.2,3.32c0.72,4.38,3.12,18.94,3.12,19.29c0,0.4,0.13,1.4,0.26,2.2","M20.76,39.32c8.12-1.32,23.99-3.44,29.06-3.83c2.06-0.16,3.43,1.26,3.15,3.7C52.45,43.78,51,52.5,50,57.5c-0.18,0.89-0.49,2.6-0.49,3.2","M22.87,50.38c6.5-0.88,23-3.25,27.66-3.65","M24.51,61c6.86-0.75,16.99-2.25,24.07-2.95","M10.13,75.13c2.12,0.75,5.25,0.78,6.99,0.5C31,73.38,42.55,71.25,52.62,70.5c1.8-0.13,4.61-0.19,5.51,0.06","M34.65,62c1.11,1.11,1.51,2.5,1.51,3.95c0,5.55-0.01,16.22-0.08,24.8c-0.02,2.07-0.03,3.68-0.05,4.5","M65.6,20.73c0.9,0.9,1.68,2.25,1.73,3.28C69,59.5,64.75,81.5,54.75,93","M67.86,21.83c5.79-1.02,19.48-3.54,20.83-3.83c2.32-0.5,4.58,0.62,4.58,3.29c0,2.46-0.11,49.96-0.11,70.41c0,10.8-6.41,1.8-8.44-0.23","M69.05,40.67c6.45-0.92,15.95-1.92,22.79-2.73","M67.66,60.85c6.53-0.76,16.72-1.72,24.27-2.23"],"見":["M32.5,15.46c0.96,0.96,1.18,2.1,1.18,3.52c0,1.12,0.07,27.43-0.02,39.27c-0.02,3.12-0.02,5.21,0.02,5.5","M34.65,17.15c9.23-1.27,22.23-2.65,31.1-3.65c2.99-0.34,4.26,1.01,4.26,3.55c0,2.5-0.1,28.08-0.14,38.96c-0.01,2.91-0.02,4.75-0.02,4.79","M34.84,31.1c7.28-0.6,25.03-2.98,33.9-3.38","M34.86,44.63C43.38,44,59,42.12,68.6,41.51","M34.71,59.66C44.5,59,58.38,57.5,68.45,57.03","M41.99,66.75c0.26,1.5,0.01,2.99-0.41,4.04c-2.7,6.83-13.83,20.83-28.41,27.87","M54.49,61.37c1.07,1.07,1.33,2.59,1.38,4.43c0.2,8.19,0.04,6.2,0.04,18.2c0,10.12,1.23,11.53,18.54,11.53c18.81,0,19.81-1.53,19.81-10.12"],"！":["M55,12 Q56,40 53,70","M50,88 Q54,86 56,92 Q52,96 50,88"],"？":["M28,30 C30,8 76,4 80,28 C82,46 56,50 55,70","M52,88 Q56,86 58,92 Q54,96 52,88"]};
const GW={"!":[50,56,12,93.3],"'":[51,55,14,32],",":[14,20.6,87,103.4],"-":[36,72,58,58],"5":[28.5,84.1,16.9,92.1],"?":[28,80.1,11.7,93.3],"A":[20,89,14.4,92.9],"B":[28,81.1,16.9,90.8],"C":[24.5,85.1,15.6,92.5],"D":[29,84.1,16.8,90.9],"E":[31.5,81.8,16.8,90.8],"F":[36,78.6,16.8,92.3],"G":[21.5,86,15.6,92.5],"H":[29,80,15.3,92.8],"I":[54.5,54.5,15.3,92.8],"J":[27,76.9,15.9,92.5],"K":[36,87.1,15.4,92.7],"L":[36,86.4,15.4,90.5],"M":[18,89.3,14.9,92.7],"N":[29,80.1,14.9,92.7],"O":[21.5,87.4,15.6,92.4],"P":[31,86.6,16.9,92.6],"Q":[21.5,87.4,15.6,94.7],"R":[29,86.3,16.9,92.6],"S":[24.5,84,15.5,92.4],"T":[23,85.9,16.9,92.8],"U":[29,79.9,15.6,92.3],"V":[19.5,88.8,15.2,92.6],"W":[10,99.2,15.2,92.9],"Y":[23.5,85.2,15.2,92.5],"Z":[24.5,87.1,16.9,90.8],"a":[30.5,81.5,35,92.4],"b":[36,79.2,15.4,92.7],"c":[31,78.1,35,92.1],"d":[31.5,74.7,15.4,92.7],"e":[31,78.3,35,92.5],"f":[39,75.9,15.5,92.8],"g":[31,82.4,34.2,108.4],"h":[34.5,74.4,15.4,92.6],"i":[53,56,15,92.8],"j":[36.5,56,15,108.3],"k":[36,78.6,15.4,92.7],"l":[54.5,54.5,15.4,92.6],"m":[21.5,88.4,34.6,92.7],"n":[34.5,74.4,34.9,92.6],"o":[31.5,78.9,35.2,92.4],"p":[34.5,77.8,35.3,108.2],"q":[31,74.4,35.3,108.2],"r":[43.5,76.4,35.4,92.5],"s":[34.5,76.3,35.4,92.2],"t":[37,72.9,22.1,92.2],"u":[34.5,74.4,35,92.7],"v":[29,79.4,35.3,92.6],"w":[15,93.2,35.3,92.7],"x":[30,79.4,35,92.6],"y":[28,77.1,35,108.3],"z":[31.5,82.2,36.7,90.8],"~":[18,92,49.2,66.6],"À":[20,89,-3.6,92.9],"Ç":[24.5,85.1,15.6,105.5],"É":[31.5,81.8,-1.2,90.8],"Ö":[21.5,87.4,4.6,92.4],"Ü":[29,79.9,4.6,92.3],"ß":[32,79,17.2,94],"à":[30.5,81.5,17,92.4],"â":[30.5,81.5,18,92.4],"ä":[30.5,81.5,24,92.4],"ç":[31,78.1,35,105.1],"é":[31,78.3,17,92.5],"ê":[31,78.3,18,92.5],"î":[45.5,63.5,-2,92.8],"ó":[31.5,78.9,17.2,92.4],"ô":[31.5,78.9,18.2,92.4],"ö":[31.5,78.9,24.2,92.4],"ù":[34.5,74.4,17,92.7],"û":[34.5,74.4,18,92.7],"ü":[34.5,74.4,24,92.7],"ą":[30.5,81.5,35,105.4],"ć":[31,78.1,17,92.1],"ę":[31,78.3,35,105.5],"ł":[40.5,66.5,15.4,92.6],"ń":[34.5,74.4,16.9,92.6],"œ":[20,86,45.3,74.3],"Ś":[24.5,84,-2.5,92.4],"ś":[34.5,76.3,17.4,92.2],"ź":[31.5,82.2,18.7,90.8],"ż":[31.5,82.2,24.7,90.8],"〜":[14,95,45.7,66.8],"ぁ":[30.5,81.9,34.4,95.8],"あ":[24.5,88.4,17.6,94.1],"い":[21.5,91.4,29.7,81.9],"う":[33,70.3,15.5,96],"え":[24.5,84,13.3,92.3],"お":[21.5,91.3,16.1,91.3],"か":[20,92.4,17.5,88.1],"が":[20,95.5,13.4,88.1],"き":[30.5,78,14.1,90.9],"ぎ":[30.5,92.4,14.1,91.1],"く":[38,62.3,15,93.8],"ぐ":[38,88.5,15,93.8],"け":[21.5,88,14.4,91.9],"げ":[21.5,101.2,8.1,92.4],"こ":[30,78.6,25.6,85.1],"ご":[30,95.4,11.4,85.4],"さ":[27,77.8,13.9,90.9],"し":[36.5,82,17.5,91.5],"じ":[36.5,82,17.3,91.3],"す":[15.5,92.6,13.4,96.5],"ず":[15.5,92.6,8.1,96.5],"せ":[16.5,94.1,17.8,85.7],"ぜ":[16.5,99.5,12.4,85.7],"そ":[24.5,87.6,16.7,91.5],"た":[20.5,88.6,16.9,89.1],"だ":[20.5,91,16.9,89.1],"ち":[24.5,84.2,15.6,92.1],"っ":[23,83.3,53,93.8],"つ":[14,89.9,34.5,85.7],"て":[20.5,88.3,18.2,88.6],"で":[20.5,90,18.2,88.6],"と":[31.5,80,18.4,87.9],"ど":[31.5,99.2,9.6,87.9],"な":[22.5,88.7,14,89.8],"に":[18,91,22.8,86.4],"ね":[16.5,94.2,14.5,87.5],"の":[18,92.4,24.5,86.9],"は":[21,88.6,16.5,88.3],"ば":[21,99.8,10.4,88.3],"ぱ":[21,98.2,10.1,88.3],"ひ":[20,96.5,20.5,89.3],"び":[20,101.5,8.6,89.3],"ふ":[16.5,94.3,15.6,88.2],"ぶ":[16.5,93.8,11.4,88.2],"ぷ":[16.5,93.8,12.4,88.2],"へ":[15,93.6,33.8,76],"べ":[15,93.6,21.9,76],"ほ":[21,89.6,17.8,88.5],"ぼ":[21,102.5,17.8,88.5],"ま":[28,81.4,14,92.4],"み":[14.5,91.9,23.6,94.8],"む":[16.5,95.8,15.5,90.5],"め":[17.5,90.7,19.4,88.8],"も":[26,83.7,14.8,94.7],"や":[18,93.4,15.9,91.5],"ゅ":[26.5,82.8,33.9,94.5],"ゆ":[19.5,89.9,16.8,92.5],"ょ":[30.5,77.5,33,95],"よ":[24,83,13.9,92.1],"ら":[29.5,83,15,95.5],"り":[35.5,72.3,18.8,94.1],"る":[27,78.8,16.4,91.9],"れ":[16,94.2,13,91.8],"ろ":[29,84.9,19.1,95],"わ":[16.5,94.4,14.8,93.5],"ん":[16,89.8,16.5,92.3],"ア":[23.5,85.8,20.1,91.9],"イ":[22.5,69.8,16.8,94.9],"オ":[19.5,91.5,16.4,92.5],"キ":[19.5,89.9,16.8,93.2],"ケ":[21.5,89.5,17.9,89.3],"ゲ":[21.5,98.6,9.1,89.2],"ジ":[26,93.5,14.4,85.9],"ス":[21,89,22.9,86.4],"ッ":[29,79.7,45.7,97.9],"ト":[44,73.7,16.4,92.9],"ド":[44,81.9,16.4,92.9],"ホ":[21,89.9,17.1,90.5],"ボ":[21,90.1,12.6,90.5],"マ":[21.5,86.2,28.8,85.1],"ム":[26,88.2,22.5,85.5],"ュ":[24.5,84.3,50.8,87.6],"ル":[18.5,94.5,19.6,86.3],"ロ":[25,82.5,31.5,82.9],"ー":[14.5,94.5,49.8,53],"中":[19.9,89.4,11.5,99.8],"出":[23.4,87.3,13.4,92.8],"朝":[10.1,93.3,11.8,96.9],"見":[13.2,94.3,13.4,98.7],"！":[50,56,12,93.3],"？":[28,80.1,11.7,93.3]};
const BB={"morning":[-28,-47.1,86.5,100.1],"morningb":[-22,-34.5,45.5,87.5],"morningc":[-57,-47.1,86.5,100.1],"hello":[-24,-42.5,68.5,95.5],"hellob":[-31.88,-42.07,75.26,99.3],"helloc":[-38,-61.1,74.2,122.9],"evening":[-46,-45.1,89.2,98.1],"eveningb":[-34.13,-28.5,79.38,90.5],"eveningc":[-46,-45.1,95.2,98.1],"night":[-50,-15.1,125.5,73.1],"nightb":[-55.12,-3.45,130.62,61.45],"nightc":[-20.4,-45.1,64.6,98.1],"thanks":[-51.92,-44.64,133.42,98.64],"thanksb":[-40.2,-27.5,67.7,80.5],"thanksc":[-22,-42.5,72.96,95.5],"sorry":[-40,1.5,121.5,54.5],"sorryb":[-20.1,-27.5,41.83,80.5],"sorryc":[-26,-26.5,49.5,68.5],"please":[-53.02,-37.42,134.52,91.42],"pleaseb":[-24,-38.06,95.91,91.06],"pleasec":[-24,-42.5,65,95.5],"roger":[-20.4,-35.5,46.69,88.5],"rogerb":[-40,-0.34,121.5,63],"rogerc":[-41,-42.5,76.2,95.5],"ok":[-24.8,-50.1,51.1,103.1],"okb":[-28,-35.5,54.5,88.5],"okc":[-24,-42.5,60.5,95.5],"like":[-34,-42.5,78.2,95.5],"likeb":[-46.02,-11.1,127.52,73.77],"likec":[-32,-42.5,65.5,95.5],"wow":[-41,-31,63.4,84],"wowb":[-30,-42.5,75,95.5],"wowc":[-43,-50.5,86,112.5],"congrats":[-46.75,-56.84,97.4,109.84],"congratsb":[-54.3,-41.22,92.4,94.23],"congratsc":[-41.77,-56.84,92.73,109.84],"tired":[-24.88,-31.02,56.44,86.76],"tiredb":[-22,-26.5,78.2,79.5],"tiredc":[-21,-42.5,60,96.3],"cheer":[-34.49,-42.5,92.46,95.5],"cheerb":[-46.02,-28.98,134.77,91.65],"cheerc":[-38,-42.5,77.5,95.5],"happy":[-30,-52.5,61.5,114.5],"happyb":[-16.56,-27.66,45.68,70.06],"happyc":[-20.3,-42.5,60.5,95.5],"sad":[-22,-26.5,45.5,79.5],"sadb":[-24,-26.5,68.49,69],"sadc":[-23,-66.43,46.5,108.43],"angry":[-24,-62.1,50,115.1],"angryb":[-22,-46.1,62.2,99.1],"angryc":[-31.5,-38.1,67.5,91.1],"surprise":[-30,-60.5,61.5,104.5],"surpriseb":[-52,-27.5,81.5,80.5],"surprisec":[-34,-27.5,69.5,80.5],"idea":[-24,-58.1,73.5,111.1],"ideab":[-31.14,-38.49,58.57,94.14],"ideac":[-41.3,-35.5,79.48,88.5],"wait":[-24,-34.5,70.2,87.5],"waitb":[-40,-40.61,121.5,100.61],"waitc":[-42,-35.1,65.1,88.1],"coming":[-44.8,-49.12,92.87,109.42],"comingb":[-55.02,-2.31,130.52,60.31],"comingc":[-52,-38.13,81.5,92.13],"home":[-52,-42.5,133.5,100.5],"homeb":[-52.4,-42.5,133.9,107.38],"homec":[-52.8,-8,134.3,66],"go":[-40,-42.5,102.5,96.9],"gob":[-38,-26.5,100.7,80.3],"goc":[-43.72,-49.12,90.23,109.16],"bye":[-28.31,-45.56,72.81,100.78],"byeb":[-24,-26.5,55.5,79.5],"byec":[-35.87,-47.04,84.37,105.6],"lazy":[-40,0.5,121.5,55.5],"lazyb":[-40,-4.37,121.5,70.61],"lazyc":[-40.53,-5.5,85.27,63.3],"hungry":[-20.3,-34.5,59.8,87.5],"hungryb":[-27.42,-37.61,112.92,92.98],"hungryc":[-44.84,-31.25,102.84,87.87],"sleepy":[-25.5,-53.1,83,109.19],"sleepyb":[-24,-34.5,47.5,87.5],"sleepyc":[-36,-21.1,79.5,81.1],"no":[-20.9,-34.5,43.9,87.5],"nob":[-22,-35.5,45.5,77.5],"noc":[-40,-34.5,81.5,87.5],"busy":[-30,-34.5,61.5,87.5],"busyb":[-22,-42.5,45.5,84.5],"busyc":[-42.15,-34.5,99.5,87.5],"lol":[-43.41,-26.7,124.91,92.68],"lolb":[-19.9,-42.5,41.7,95.5],"lolc":[-40,-42.5,81.5,95.5],"cry":[-26,-26.5,52,79.5],"cryb":[-20.1,-26.5,44.3,87.3],"cryc":[-42.55,-29.51,89.04,88.22],"love":[-20.83,-27.5,43.54,80.5],"loveb":[-22,-42.5,76.2,95.5],"lovec":[-24,-27.5,79.54,80.5],"yummy":[-24,-42.5,65,95.5],"yummyb":[-30,-42.5,82.2,104.3],"yummyc":[-24,-42.5,80.2,95.5],"hot":[-57,-51.1,107.34,104.1],"hotb":[-24,-34.5,53.5,92.3],"hotc":[-22,-42.5,84.3,95.5],"cold":[-34,-34.5,69.5,87.5],"coldb":[-40.2,-24.5,92.61,87.3],"coldc":[-22,-27.5,45.5,80.5],"late":[-43.72,-42.39,81.86,102.43],"lateb":[-28,-41.1,74.2,94.1],"latec":[-43.72,-33.74,79.38,93.78],"tiredme":[-40,10.5,121.5,49.5],"tiredmeb":[-40,-14,121.5,74],"tiredmec":[-28,-57.1,57.5,115.1],"forgot":[-61,-57.1,129.17,110.3],"forgotb":[-34,-37.22,74.1,90.23],"forgotc":[-43.51,-41.1,106.21,100.27],"shy":[-20.72,-27.5,42.32,80.5],"shyb":[-24,-27.5,51.5,80.5],"shyc":[-20.8,-62.1,43.7,115.1],"welcome":[-34,-47.52,69.5,100.52],"welcomeb":[-24,-42.5,80.2,95.5],"welcomec":[-34,-42.5,96.54,96.2],"yes":[-24,-42.5,47.5,95.5],"yesb":[-41,-52.5,66.5,114.5],"yesc":[-34.17,-46.56,67.25,103.67],"nope":[-33,-35.5,72.5,88.5],"nopeb":[-25,-35.5,56.5,88.5],"nopec":[-20.2,-35.5,42.2,88.5],"sure":[-28.13,-42.5,57.75,95.5],"sureb":[-34,-35.5,69.5,88.5],"surec":[-28,-42.5,62.2,95.5],"dame":[-20.8,-35.5,43.3,88.5],"dameb":[-54,-49.1,80.5,102.1],"damec":[-24,-35.5,71.2,88.5],"ruok":[-30.01,-41.22,72.11,97.86],"ruokb":[-24,-27.5,78.2,80.5],"ruokc":[-24,-26.5,75.5,79.5],"imok":[-24,-42.5,63,95.5],"imokb":[-25,-35.5,51.5,88.5],"imokc":[-24,-42.5,56.5,95.5],"glad":[-42,-27.5,65.5,80.5],"gladb":[-22,-26.5,63.5,68.5],"gladc":[-20,-42.5,42.61,95.5],"eh":[-22,-41.22,62.1,94.23],"ehb":[-32.84,-39.13,68.06,96.45],"ehc":[-36,-47.22,82.1,100.23],"why":[-29.93,-40.13,70.03,96.88],"whyb":[-20.8,-37.22,62.9,90.23],"whyc":[-34,-34.5,69.5,87.5],"gaan":[-24,-57.1,51.5,110.1],"gaanb":[-22,-26.5,63.2,83.8],"gaanc":[-22,-35.5,45.5,88.5],"lonely":[-40,-26.5,121.5,82.5],"lonelyb":[-28.41,-33.25,73.91,89.61],"lonelyc":[-38,-45.1,80.2,87.51],"miss":[-19.7,-29.59,55.85,82.59],"missb":[-40,-49.12,88.2,109.16],"missc":[-22,-27.5,74.51,80.5],"worry":[-20.5,-34.5,43.5,87.5],"worryb":[-55.07,-2.3,130.57,60.3],"worryc":[-40,-34.5,97.5,90.5],"help":[-40,-34.5,94.2,87.5],"helpb":[-42.2,-26.5,99.55,79.5],"helpc":[-28,-40.5,57.5,96.9],"itadaki":[-20.51,-42.5,43.42,106.3],"itadakib":[-22,-35.5,49.5,105.3],"itadakic":[-24,-42.5,66.49,95.5],"gochi":[-20.1,-27.5,42.13,87.3],"gochib":[-30,-42.5,61.5,94.3],"gochic":[-40.2,-42.5,71.7,102.3],"kanpai":[-24,-42.5,76.03,95.5],"kanpaib":[-24,-42.5,68.72,95.5],"kanpaic":[-39.96,-49.1,87.91,102.1],"odaiji":[-24,-27.5,76.52,80.5],"odaijib":[-50,-21.28,125.5,79.28],"odaijic":[-22,-42.5,82.58,95.5],"waku":[-45,-48.5,88,90.5],"wakub":[-31.02,-45.87,77.22,102.23],"wakuc":[-41,-42.5,82,98.66],"doki":[-22,-27.5,45.5,80.5],"dokib":[-34,-34.5,69.5,87.5],"dokic":[-20.92,-27.5,42.93,80.5],"think":[-24,-53.22,76.2,106.23],"thinkb":[-24,-53.1,76.2,106.1],"thinkc":[-24,-64.1,51.2,117.1],"shh":[-24,-35.5,46.6,88.5],"shhb":[-24,-35.5,46.8,88.5],"shhc":[-40,-37.71,72.77,94.53],"later":[-24,-35.5,51.65,88.5],"laterb":[-25,-34.5,82.35,87.5],"laterc":[-39.65,-42.5,71.15,95.5],"waiting":[-40,-42.5,121.5,98.5],"waitingb":[-40,-43.1,121.5,99.1],"waitingc":[-20.38,-47.8,41.88,100.8],"hima":[-40,-13.23,121.5,67.22],"himab":[-28,-42.5,72.2,95.5],"himac":[-40,-35.5,121.5,91.5],"fight":[-41,-35.5,73.2,88.5],"fightb":[-24,-42.5,56.2,95.5],"fightc":[-40,-42.39,88.74,103.18]};
const DEFS="<defs>\n<filter id=\"hpst-w1\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.05\" numOctaves=\"2\" seed=\"2\"/><feDisplacementMap in=\"SourceGraphic\" scale=\"5\"/></filter>\n<filter id=\"hpst-w2\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.035\" numOctaves=\"3\" seed=\"9\"/><feDisplacementMap in=\"SourceGraphic\" scale=\"6\"/></filter>\n<filter id=\"hpst-cr\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"1\" seed=\"4\" result=\"n\"/><feColorMatrix in=\"n\" type=\"matrix\" values=\"0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.7 1.25\" result=\"m\"/><feComposite in=\"SourceGraphic\" in2=\"m\" operator=\"in\" result=\"f\"/><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.04\" seed=\"5\" result=\"t\"/><feDisplacementMap in=\"f\" in2=\"t\" scale=\"6\"/></filter>\n</defs>";
function hsh(s){ let h=7; for(const ch of s) h=(h*31+ch.charCodeAt(0))%2147483647; return h||7; }

function rnd(seed){ let s=seed>>>0||1; return ()=>{ s^=s<<13; s>>>=0; s^=s>>>17; s^=s<<5; s>>>=0; return (s%10000)/10000; }; }
function hwSp(c){ return c===' '||c===' '; }
function hwLat(c){ return /[A-Za-z\u00c0-\u017f0-9'!?.,~-]/.test(c); }
function hwCw(c,size){ const sc=size/109, g=GW[c]; if(hwSp(c)) return size*0.3; if(!g) return size*0.6; return (g[1]-g[0])*sc*(hwLat(c)?1:1.06)+Math.max(9,1.6/sc)*sc+(hwLat(c)?-size*0.02:0); }
function hwGap(t,size){ return /[\u3040-\u9fff]/.test(t)?size*0.06+(size<14?2.6:1.6):size*0.06+(size<14?2.4:1.8); }

function hwWidth(t,size){ const gap=hwGap(t,size); let w=0, n=0; for(const c of [...t]){ w+=hwCw(c,size); n++; } return w+gap*Math.max(0,n-1); }

function hw(t,cx,y,size,seed,col){ const R=rnd(seed), ch=[...t], sc=size/109, gap=hwGap(t,size);
  const ws=ch.map(c=>hwCw(c,size)); const tot=ws.reduce((a,b)=>a+b,0)+gap*(ch.length-1);
  let x=cx-tot/2, bk=''; ch.forEach((c,i)=>{ const P=G[c]||[], w=GW[c]||[20,90,20,90], s=sc*(0.92+R()*0.14), r=(R()-.5)*(hwLat(c)?10:20), dy=(R()-.5)*4;
   if(P.length){ const tr=`translate(${(x-w[0]*s+(ws[i]-(w[1]-w[0])*s)/2).toFixed(1)} ${(y-size*0.9+dy).toFixed(1)}) scale(${s.toFixed(3)}) rotate(${r.toFixed(1)} ${((w[0]+w[1])/2).toFixed(1)} 54)`;
     bk+=`<g class="ch" transform="${tr}">${P.map(d=>`<path d="${d}" transform="translate(${((R()-.5)*7).toFixed(1)} ${((R()-.5)*7).toFixed(1)}) rotate(${((R()-.5)*8).toFixed(1)} 54 54)"/>`).join('')}</g>`; }
   x+=ws[i]+gap; });
  const lw=Math.max(9,1.6/sc); return `<g filter="url(#hpst-w2)" fill="none" stroke-linecap="round" stroke-linejoin="round"><g stroke="${col||'#2b2b2b'}" stroke-width="${lw.toFixed(1)}">${bk}</g></g>`; }

function hwWrap(t,size,max){ if(hwWidth(t,size)<=max||t.indexOf(' ')<0) return [t]; const W=t.split(' '); let best=null;
  for(let k=1;k<W.length;k++){ const a=W.slice(0,k).join(' '), b=W.slice(k).join(' '), m=Math.max(hwWidth(a,size),hwWidth(b,size)); if(!best||m<best[0]) best=[m,a,b]; }
  return best?[best[1],best[2]]:[t]; }

function hwLay(t,s,seed){ const MAX=100;

  const run=(m0,s0,wrapSub)=>{ let out='', y=4;
    const put=(txt,size0,mn,col,sd,wrap)=>{ let size=size0, L=wrap?hwWrap(txt,size,MAX):[txt];
      for(;;){ const w=Math.max(...L.map(l=>hwWidth(l,size))); if(w<=MAX||size<=mn) break; size-=0.5; L=wrap?hwWrap(txt,size,MAX):[txt]; }
      L.forEach((l,i)=>{ y+=size*1.02; out+=hw(l,60,y,size,sd+i*7,col); y+=size*0.2; }); };
    if(s){ put(t,m0,9,'#2b2b2b',seed,true); y+=3; put(s,s0,8,'#444',seed+20,wrapSub); }
    else put(t,m0+2,9,'#2b2b2b',seed,true);
    return {svg:out,y0:Math.ceil(y+5)}; };
  const m=[...t].length>5?17:20; let r=run(m,13,true); if(r.y0<=76) return r;
  for(const [a,b] of [[m-2,12],[m-3,11],[m-4,11]]){ r=run(a,b,true); if(r.y0<=76) return r; r=run(a,b,false); if(r.y0<=76) return r; }
  return r; }

const RB='#aac0e0', AN='#f39a2e', INK='#2b2b2b';
const L=`stroke="${INK}" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
const LL=`stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"`;
const L0=`stroke="${INK}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;

function sk(d,w){ const a=w||3.2; return `<path d="${d}" ${L0} stroke-width="${a}"/><path d="${d}" ${L0} stroke-width="${Math.min(1.5,a*0.5).toFixed(2)}" transform="translate(1.5 -1.1)" opacity=".65"/>`; }
function crayon(d,col){ return `<path d="${d}" fill="${col}" filter="url(#hpst-cr)" transform="translate(2.2 1.8)"/>`; }
function fill(d,col,w){ return crayon(d,col)+sk(d,w); }
let BXS=7; function bxr(){ BXS=(BXS*16807)%2147483647; return (BXS%1000)/1000-.5; }

function box(x,y,w,h){ const j=Math.min(w,h)*0.07, r=2.2, c=[[x+bxr()*j,y+bxr()*j],[x+w+bxr()*j,y+bxr()*j],[x+w+bxr()*j,y+h+bxr()*j],[x+bxr()*j,y+h+bxr()*j]], f=v=>v.map(n=>n.toFixed(1)).join(' ');

  const tow=(p,q,d)=>{ const dx=q[0]-p[0], dy=q[1]-p[1], L=Math.hypot(dx,dy)||1; return [p[0]+dx/L*d,p[1]+dy/L*d]; };
  let d=''; for(let k=0;k<4;k++){ const p=c[k], q=c[(k+1)%4], a=tow(p,q,r), b=tow(q,p,r), mid=[(p[0]+q[0])/2+bxr()*j*0.6,(p[1]+q[1])/2+bxr()*j*0.6];
    d+=(k?' L':'M')+f(a)+' Q'+f(mid)+' '+f(b)+' Q'+f(q)+' '+f(tow(q,c[(k+2)%4],r)); }
  return d+' Z'; }
const ell=(cx,cy,rx,ry)=>`M${cx-rx} ${cy} a${rx} ${ry} 0 1 0 ${2*rx} 0 a${rx} ${ry} 0 1 0 ${-2*rx} 0`;

const EX={
 joy:{eye:`<path d="M-13 -1 q4 -6 8 0 M5 -1 q4 -6 8 0" ${LL}/>`,brow:'',mouth:`<path d="M-8 5 q8 10 16 0 z" fill="#c33" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`,cheek:1,ant:'boing'},
 angry:{eye:`<circle cx="-8" cy="0" r="2.6" fill="${INK}"/><circle cx="8" cy="0" r="2.6" fill="${INK}"/>`,brow:`<path d="M-14 -9 L-3 -4 M14 -9 L3 -4" ${LL} stroke-width="3.4"/>`,mouth:`<path d="M-7 9 q7 -6 14 0" ${LL}/>`,ant:'zig',face:'#f0b0b0',mk:`<g transform="translate(22 -14)" stroke="#d22" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M-4 -1 q3 0 3 -3 M1 -4 q0 3 3 3 M4 1 q-3 0 -3 3 M-1 4 q0 -3 -3 -3"/></g>`},
 sad:{eye:`<path d="M-12 -2 q4 4 8 0 M4 -2 q4 4 8 0" ${LL}/>`,brow:`<path d="M-13 -6 L-4 -10 M13 -6 L4 -10" ${LL} stroke-width="2.4"/>`,mouth:`<path d="M-6 10 q6 -6 12 0" ${LL}/>`,ant:'droop',face:'#a9b6cc',mk:`<path d="M-9 3 q-3 7 0 10 q3 -3 0 -10z" fill="#6cc4ff" stroke="${INK}" stroke-width="1.4"/><path d="M9 3 q-3 9 0 13 q3 -4 0 -13z" fill="#6cc4ff" stroke="${INK}" stroke-width="1.4"/>`},
 fun:{eye:`<path d="M-12 -3 l6 3 l-6 3 M12 -3 l-6 3 l6 3" ${LL}/>`,brow:'',mouth:`<path d="M-9 5 q9 12 18 0 z" fill="#c33" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`,ant:'boing'},
 surprise:{eye:`<circle cx="-8" cy="-1" r="5" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="-8" cy="-1" r="1.4" fill="${INK}"/><circle cx="8" cy="-1" r="5" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="8" cy="-1" r="1.4" fill="${INK}"/>`,brow:`<path d="M-12 -11 q4 -3 8 0 M4 -11 q4 -3 8 0" ${LL} stroke-width="2.2"/>`,mouth:`<ellipse cx="0" cy="9" rx="3.5" ry="4.5" fill="${INK}"/>`,ant:'curl'},
 shy:{eye:`<path d="M-12 -1 q4 -4 8 0 M4 -1 q4 -4 8 0" ${LL}/>`,brow:'',mouth:`<path d="M-4 8 q2 -2 4 0 q2 2 4 0" ${LL} stroke-width="2.2"/>`,cheek:2,ant:'curl'},
 sleepy:{eye:`<path d="M-12 0 h7 M5 0 h7" ${LL}/>`,brow:'',mouth:`<ellipse cx="2" cy="9" rx="2.5" ry="2" fill="${INK}"/>`,ant:'droop',mk:`<path d="M2 11 q1 6 -2 9" stroke="#6cc4ff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`},
 worry:{eye:`<circle cx="-8" cy="0" r="2.4" fill="${INK}"/><circle cx="8" cy="0" r="2.4" fill="${INK}"/>`,brow:`<path d="M-13 -6 L-4 -10 M13 -6 L4 -10" ${LL} stroke-width="2.4"/>`,mouth:`<path d="M-7 9 q2 -3 4 0 q2 3 4 0 q2 -3 4 0" ${LL} stroke-width="2.2"/>`,ant:'zig2',mk:`<path d="M21 -10 q-4 6 0 9 q4 -3 0 -9z" fill="#9fdcff" stroke="${INK}" stroke-width="1.4"/>`},
 plain:{eye:`<circle cx="-8" cy="-1" r="2.6" fill="${INK}"/><circle cx="8" cy="-1" r="2.6" fill="${INK}"/>`,brow:'',mouth:`<path d="M-4 9 q4 2 8 0" ${LL} stroke-width="2.4"/>`,ant:'up'},
 sly:{eye:`<path d="M-12 -1 h7 M5 -1 h7" ${LL}/><circle cx="-7" cy="1" r="1.6" fill="${INK}"/><circle cx="10" cy="1" r="1.6" fill="${INK}"/>`,brow:`<path d="M-12 -8 l7 1 M5 -7 l7 -1" ${LL} stroke-width="2.2"/>`,mouth:`<path d="M-6 8 q6 4 12 -2" ${LL} stroke-width="2.4"/><path d="M2 9 q2 6 5 2" fill="#f08aa0" stroke="${INK}" stroke-width="1.8"/>`,ant:'up'},
 blank:{eye:`<circle cx="-8" cy="-2" r="5.5" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="-8" cy="-2" r="1" fill="${INK}"/><circle cx="9" cy="-1" r="4.5" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="10" cy="0" r="1" fill="${INK}"/>`,brow:'',mouth:`<path d="M-5 9 h10" ${LL} stroke-width="2.4"/>`,ant:'up'},
 dizzy:{eye:`<path d="M-11 -4 a3 3 0 1 1 -1 5 M5 -4 a3 3 0 1 1 -1 5" ${LL} stroke-width="2.4"/>`,brow:'',mouth:`<path d="M-6 9 q3 -3 6 0 q3 3 6 0" ${LL} stroke-width="2.2"/>`,ant:'zig2'},
};
const ANT={boing:`M0 -16 q-6 -5 0 -9 q6 -4 0 -9`, droop:`M0 -16 q2 -8 12 -6`, zig:`M0 -16 l-4 -4 l6 -4 l-4 -4`, curl:`M0 -16 q0 -10 6 -10 q4 0 2 4`, zig2:`M0 -16 l-3 -4 l3 -4 l-3 -4`, up:`M0 -16 q2 -6 0 -12`};
const ANTB={boing:[0,-38],droop:[13,-22],zig:[-2,-31],curl:[1,-23],zig2:[-3,-30],up:[0,-31]};

function robot(o){ const e=EX[o.ex||'plain'], ant=o.ant||e.ant, ab=ANTB[ant], hd=box(-20,-16,40,30), col=o.face||e.face||RB; let s='';
  let LG='';
  if(o.body!==false){ const bd=box(-15,16,30,24); s+=crayon(bd,o.bcol||RB)+sk(bd)+`<path d="M-4 24 h5" stroke="#e8505b" stroke-width="3" stroke-linecap="round"/>`;
    const lg=o.legs===undefined?'stand':o.legs; LG= lg==='stand'?sk('M-8 40 L-9 52 L-14 53 M8 40 L9 52 L14 53'): lg==='run'?sk('M-6 40 L-16 46 L-20 54 M8 40 L18 48 L28 46'): lg==='sit'?sk('M-8 40 L-14 42 L-22 42 M8 40 L14 42 L22 42'): lg==='none'?'':sk(lg); }
  if(o.arms) s+=sk(o.arms);
  s+=crayon(hd,col)+sk(hd)+sk(ANT[ant])+(o.noball?'':`<circle cx="${ab[0]}" cy="${ab[1]}" r="4.5" fill="${AN}" stroke="${INK}" stroke-width="2.4"/>`);
  if(e.cheek) s+=`<ellipse cx="-14" cy="6" rx="${3+e.cheek}" ry="2.6" fill="#ff8aa0" opacity=".75"/><ellipse cx="14" cy="6" rx="${3+e.cheek}" ry="2.6" fill="#ff8aa0" opacity=".75"/>`;
  s+=(o.eye||e.eye)+e.brow+(o.mouth||e.mouth)+(o.nomk?'':(e.mk||''))+(o.mk||'');
  if(o.bow) return `<g transform="translate(${o.x||0} ${o.y||0}) scale(${o.s||1})">${LG}<g transform="rotate(${o.bow} 0 40)">${s}</g></g>`;
  return `<g transform="translate(${o.x||0} ${o.y||0}) rotate(${o.rot||0}) scale(${o.s||1})">${LG}${s}</g>`; }

const P={
 floor:(y=56)=>sk(`M-40 ${y} Q20 ${y-2} 80 ${y}`),
 heart:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 4 c-6 -8 -16 0 -6 8 l6 6 l6 -6 c10 -8 0 -16 -6 -8z" fill="#ff7a8a" stroke="${INK}" stroke-width="2.2"/></g>`,
 star:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -6 l2 -0 l2 4 l5 1 l-4 3 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -3 l5 -1z" fill="#ffd23f" stroke="${INK}" stroke-width="1.5"/></g>`,
 spark:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -7 l1.8 5.2 l5.2 1.8 l-5.2 1.8 l-1.8 5.2 l-1.8 -5.2 l-5.2 -1.8 l5.2 -1.8z" fill="#ffd23f" stroke="${INK}" stroke-width="1.4"/></g>`,
 sweat:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 0 q-4 6 0 9 q4 -3 0 -9z" fill="#9fdcff" stroke="${INK}" stroke-width="1.4"/></g>`,
 q:(x,y)=>sk(`M${x} ${y} q1 -7 7 -6 q6 2 2 8 q-3 3 -3 6 M${x+6} ${y+12} l0.2 0.4`,2.6),
 ex:(x,y)=>sk(`M${x} ${y} l0.5 10 M${x+0.6} ${y+15} l0.1 0.3`,3),
 zz:(x,y)=>sk(`M${x} ${y} h7 l-7 8 h7 M${x+11} ${y-8} h5 l-5 6 h5`,2.2),
 motion:(x,y)=>sk(`M${x} ${y} h-14 M${x+2} ${y+8} h-18 M${x} ${y+16} h-12`,2.4),
 dust:(x,y)=>crayon(ell(x,y,8,5),'#d9cbb0')+sk(`M${x-8} ${y} a8 5 0 0 1 16 0`,2)+crayon(ell(x-12,y+3,5,3.5),'#d9cbb0'),

 futon:(col)=>sk('M-50 58 L74 58')+fill('M-46 48 L72 48 L72 56 L-46 56 Z','#ffffff')+fill('M-42 36 Q-42 28 -30 28 L-16 30 Q-8 34 -10 42 Q-12 48 -26 48 L-36 48 Q-42 46 -42 36 Z','#fffdf2'),
 kake:(col)=>fill('M-14 48 Q-16 28 2 26 Q18 20 34 24 Q52 22 58 36 L60 48 Z',col)+sk('M-4 40 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5 l5 5 l5 -5',2.6)+sk('M2 30 q3 3 6 0 M26 28 q3 3 6 0 M42 30 q3 3 6 0',2.4),

 kotatsu:()=>fill('M-34 30 Q4 40 44 30 L50 58 Q4 64 -40 58 Z','#e8a24a')+sk('M-26 40 q6 4 12 0 M6 44 q6 4 12 0 M30 40 q4 4 10 0',2.4)+fill(box(-40,20,90,10),'#b07a44')+fill(ell(30,15,6,5.5),'#ffa62b')+sk('M30 9 l2 -3',2.4),
 desk:(x,y,w)=>fill(box(x,y,w,7),'#c08a56')+sk(`M${x+4} ${y+7} V${y+30} M${x+w-4} ${y+7} V${y+30}`),
 papers:(x,y,n)=>{ let s=''; for(let i=0;i<n;i++){ s+=fill(box(x+(i%2?3:-2),y-i*6,22,6),'#ffffff'); } return s; },
 paper:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill(box(-9,-12,18,24),'#ffffff')}${sk('M-5 -6 h10 M-5 -1 h10 M-5 4 h7',1.8)}</g>`,
 phone:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-6" y="-10" width="12" height="20" rx="2.5" fill="#333"/><rect x="-4" y="-7.5" width="8" height="14" fill="#bfe8ff"/></g>`,
 ramen:(x,y)=>`<g transform="translate(${x} ${y})">${fill('M-22 0 L22 0 Q20 22 0 22 Q-20 22 -22 0 Z','#f6f1e4')}${crayon('M-20 0 Q0 -8 20 0 Z','#f2c86a')}${sk('M-16 -2 q4 -6 8 0 q4 -6 8 0 q4 -6 8 0 q4 -6 8 0',2.4)}<circle cx="-8" cy="-3" r="4" fill="#fff" stroke="${INK}" stroke-width="1.6"/><circle cx="-8" cy="-3" r="1.6" fill="#f2a83a"/>${sk('M6 -14 L22 -34 M10 -12 L26 -30')}${sk('M-6 -14 q-3 -6 0 -10 M4 -16 q-3 -6 0 -10',2.2)}</g>`,
 onigiri:(x,y)=>`<g transform="translate(${x} ${y})">${fill('M0 -12 Q12 6 10 10 Q0 14 -10 10 Q-12 6 0 -12 Z','#ffffff')}${fill(box(-6,2,12,9),'#2f3a2f')}</g>`,
 cake:(x,y)=>`<g transform="translate(${x} ${y})">${fill(box(-14,-6,28,16),'#ffe9d0')}${sk('M-14 0 q4 4 7 0 q4 4 7 0 q4 4 7 0 q4 4 7 0',2)}${fill(ell(-4,-9,3.5,3),'#e33')}${sk('M6 -6 v-8',2.4)}<path d="M6 -16 q-2 -3 0 -5 q2 2 0 5" fill="#ffb12b"/></g>`,
 cracker:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill('M-6 10 L6 10 L0 -14 Z','#ff8aa0')}${sk('M-3 2 l6 -2 M-4 6 l8 -2',1.8)}</g>`,
 confetti:(x,y)=>[[0,0,'#e33'],[8,-6,'#3a8'],[16,2,'#38e'],[-8,-8,'#fb2'],[24,-8,'#e3a'],[4,-14,'#38e'],[-4,6,'#fb2']].map(([a,b,c],i)=>`<rect x="${x+a}" y="${y+b}" width="4" height="2.5" fill="${c}" transform="rotate(${i*37} ${x+a} ${y+b})"/>`).join(''),
 tea:(x,y)=>`<g transform="translate(${x} ${y})">${fill('M-8 -6 L8 -6 L6 8 L-6 8 Z','#9fd3a8')}${sk('M-3 -10 q-2 -4 0 -7 M3 -10 q-2 -4 0 -7',2)}${fill(ell(0,9,12,3),'#c08a56')}</g>`,
 flag:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${sk('M0 0 V-34')}${fill('M0 -34 L22 -28 L0 -20 Z','#ff6b6b')}</g>`,
 game:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill(box(-14,-8,28,16),'#555')}<rect x="-6" y="-5" width="12" height="9" fill="#9fe0c0"/><circle cx="10" cy="-1" r="2" fill="#e33"/><path d="M-11 -1 h4 M-9 -3 v4" stroke="#ddd" stroke-width="1.6"/></g>`,
 uchiwa:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill(ell(0,-10,10,9),'#ffd2e0')}${sk('M0 -1 V12',2.6)}${sk('M-4 -14 q4 4 8 0',1.6)}</g>`,
 bread:(x,y)=>fill(`M${x-8} ${y} q0 -8 8 -8 q8 0 8 8 z`,'#e9b56a'),
 randoseru:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill(box(-11,-12,22,22),'#d64545')}${sk('M-11 -4 h22 M0 -4 v4',2)}${sk('M-6 -12 q6 -6 12 0',2)}</g>`,
 umbrella:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill('M-14 0 Q0 -16 14 0 Q7 -3 0 0 Q-7 -3 -14 0 Z','#5aa0e8')}${sk('M0 0 V16 q0 4 -4 3',2.4)}</g>`,
 door:(x,y)=>fill(box(x,y,30,58),'#c9a074')+`<circle cx="${x+24}" cy="${y+30}" r="2" fill="${INK}"/>`,
 clock:(x,y)=>`<g transform="translate(${x} ${y})">${fill(ell(0,0,10,10),'#fff')}${sk('M0 0 V-6 M0 0 L5 2',2.2)}</g>`,
 butterfly:(x,y)=>`<g transform="translate(${x} ${y})">${fill('M0 0 q-10 -10 -10 0 q0 8 10 0 z','#ffd23f',2)}${fill('M0 0 q10 -10 10 0 q0 8 -10 0 z','#ffd23f',2)}</g>`,
 earphone:(x,y)=>`<g transform="translate(${x} ${y})">${fill(ell(0,0,3.5,4),'#fff',2)}${sk('M0 4 q-2 10 4 18',1.8)}</g>`,
 shoe:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill('M-8 0 L-8 -6 L0 -6 L2 -2 L10 -1 L10 3 L-8 3 Z','#e85a5a',2.4)}</g>`,
 window:(x,y)=>fill(box(x,y,34,30),'#1d2c55')+sk(`M${x+17} ${y} V${y+30} M${x} ${y+15} H${x+34}`,2.2)+fill(`M${x+8} ${y+5} a5 5 0 1 0 6 7 a4 4 0 1 1 -6 -7z`,'#ffe28a',1.8),
 sun:(x,y)=>fill(ell(x,y,7,7),'#ffcf3f',2)+sk(`M${x} ${y-12} v-4 M${x+11} ${y-7} l3 -3 M${x-11} ${y-7} l-3 -3 M${x+13} ${y+2} h4 M${x-13} ${y+2} h-4`,2.2),
 ghost:(x,y)=>`<path d="M${x} ${y} q-8 -14 4 -22 q10 -6 6 -18 q12 6 6 20 q-4 10 -16 20z" fill="#f2f7ff" stroke="#8fa8c8" stroke-width="2.2"/><circle cx="${x+6}" cy="${y-32}" r="1.6" fill="#333"/><circle cx="${x+12}" cy="${y-33}" r="1.6" fill="#333"/>`,
 oil:(x,y)=>`<path d="M${x} ${y} q-4 6 0 9 q4 -3 0 -9z" fill="#333"/>`,
 puddle:(x,y,w)=>crayon(ell(x,y,w,3),'#333'),
 bowl:(x,y)=>`<g transform="translate(${x} ${y})">${fill('M-14 0 L14 0 Q12 14 0 14 Q-12 14 -14 0 Z','#ffffff')}${crayon('M-12 0 Q0 -6 12 0 Z','#fff8e8')}${sk('M-8 -2 q2 -3 4 0 q2 -3 4 0 q2 -3 4 0 q2 -3 4 0',1.8)}</g>`,
 steam:(x,y)=>sk(`M${x} ${y} q-3 -5 0 -9 q3 -4 0 -8 M${x+7} ${y} q-3 -5 0 -9 q3 -4 0 -8`,2.2),
 xmark:(x,y)=>sk(`M${x-18} ${y-18} L${x+18} ${y+18} M${x+18} ${y-18} L${x-18} ${y+18}`,5),
};

const AR={
 down:'M-15 22 L-22 38 M15 22 L22 38', up:'M-15 22 L-28 4 M15 22 L28 4', wave:'M15 22 L30 2 M-15 22 L-24 34', waveL:'M-15 22 L-30 2 M15 22 L24 34',
 hips:'M-15 22 L-25 30 L-15 36 M15 22 L25 30 L15 36', pray:'M-15 22 L-5 30 L0 20 M15 22 L5 30 L0 20', chin:'M15 22 L16 14 L8 11 M-15 22 L-24 34',
 cross:'M-15 22 L14 -4 M15 22 L-14 -4', front:'M-15 22 L-6 34 M15 22 L6 34', out:'M-15 22 L-34 16 M15 22 L34 16', salute:'M15 22 Q30 14 22 -10 M-15 22 L-15 40',
 holdR:'M-15 22 L-22 36 M15 22 L30 24', holdL:'M15 22 L22 36 M-15 22 L-30 24', both:'M-15 22 L-28 30 M15 22 L28 30', hide:'M-15 22 L-12 2 M15 22 L12 2',
 fist:'M15 22 L24 4 M-15 22 L-24 34', scratch:'M15 22 L26 -8 L20 -14 M-15 22 L-24 34', ear:'M15 22 L28 4 L24 -2 M-15 22 L-24 34', shrug:'M-15 22 L-28 18 L-34 8 M15 22 L28 18 L34 8',
 lips:'M15 22 L10 14 L2 10 M-15 22 L-24 34', stop:'M15 22 L34 14 M-15 22 L-24 34', hug:'M-15 22 L-8 34 L6 30 M15 22 L8 34 L-6 30',
};
const hand=(x,y)=>`<circle cx="${x}" cy="${y}" r="3" fill="#aac0e0" stroke="${INK}" stroke-width="2.2"/>`;

Object.assign(P,{
 bigflower:(x,y)=>`<g transform="translate(${x} ${y})">${sk('M0 2 Q-2 14 0 28',2)}${fill('M0 20 q-8 -2 -10 -8 q8 -1 10 6',`#8fd18f`,1.6)}${[0,72,144,216,288].map(a=>fill(ell(Math.cos(a*Math.PI/180)*7,Math.sin(a*Math.PI/180)*7-6,5.5,5.5),'#ff8fb1',0.7)).join('')}${fill(ell(0,-6,4,4),'#ffd23f',0.7)}</g>`,
 gift:(x,y)=>`<g transform="translate(${x} ${y})">${fill(box(-20,-12,40,26),'#ff7a8a',2.4)}${fill(box(-22,-18,44,8),'#ff9aa6',2.4)}${fill('M-4 -18 L4 -18 L4 14 L-4 14 Z','#ffd23f',1.6)}${fill('M0 -18 q-14 -12 -14 -2 q0 6 14 2 z','#ffd23f',1.8)}${fill('M0 -18 q14 -12 14 -2 q0 6 -14 2 z','#ffd23f',1.8)}</g>`,
 moon:(x,y)=>fill(`M${x} ${y-10} a10 10 0 1 0 8 16 a8 8 0 1 1 -8 -16z`,'#ffe28a',2.2),
 bulb:(x,y)=>`<g transform="translate(${x} ${y})">${fill('M-8 0 a9 9 0 1 1 16 0 q-3 4 -3 8 h-10 q0 -4 -3 -8z','#ffe86a')}${sk('M-4 12 h8',2.4)}${sk('M-14 -10 l-4 -3 M14 -10 l4 -3 M0 -16 v-5',2)}</g>`,
 memo:(x,y)=>`<g transform="translate(${x} ${y}) rotate(-8)">${fill(box(-10,-12,20,24),'#fff')}${sk('M-6 -6 h12 M-6 -1 h12 M-6 4 h8',1.6)}</g>`,
 pencil:(x,y,r=30)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill('M-2 -12 h4 v18 l-2 4 l-2 -4z','#ffcf3f',2)}</g>`,
 noodle:(x,y)=>`<g transform="translate(${x} ${y})">${fill('M-11 -10 L11 -10 L8 10 L-8 10 Z','#fff')}${fill('M-11 -10 L11 -10 L10 -5 L-10 -5 Z','#e85a5a',2)}${sk('M-3 -14 q-2 -4 0 -7 M3 -14 q-2 -4 0 -7',2)}</g>`,
 pillow:(x,y)=>fill(`M${x-18} ${y} Q${x-18} ${y-11} ${x} ${y-11} Q${x+18} ${y-11} ${x+18} ${y} Q${x+18} ${y+11} ${x} ${y+11} Q${x-18} ${y+11} ${x-18} ${y} Z`,'#cfe0ff')+sk(`M${x-10} ${y-3} q4 3 8 0 M${x+2} ${y+3} q4 3 8 0`,1.6),
 flower:(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})">${sk('M0 0 V22',2.4)}${[0,72,144,216,288].map(a=>fill(ell(Math.cos(a*Math.PI/180)*5,Math.sin(a*Math.PI/180)*5-2,4,4),'#ff8fb1',1.6)).join('')}${fill(ell(0,-2,3,3),'#ffd23f',1.4)}</g>`,
 bouquet:(x,y)=>`<g transform="translate(${x} ${y})">${P.flower(-6,-8,0.8)}${P.flower(6,-10,0.8)}${P.flower(0,-14,0.8)}${fill('M-10 4 L10 4 L3 20 L-3 20 Z','#9fd3a8',2)}</g>`,
 towel:(x,y)=>fill(`M${x-16} ${y-6} L${x+16} ${y-6} L${x+14} ${y+18} L${x-14} ${y+18} Z`,'#bfe8c0')+sk(`M${x-15} ${y+12} h29 M${x-15} ${y+15} h29`,1.4),
 pompom:(x,y)=>`<g transform="translate(${x} ${y})">${[0,60,120,180,240,300].map(a=>sk(`M0 0 l${(Math.cos(a*Math.PI/180)*10).toFixed(1)} ${(Math.sin(a*Math.PI/180)*10).toFixed(1)}`,2.4)).join('')}${fill(ell(0,0,4,4),'#ff6b6b',1.6)}</g>`,
 rain:(pts)=>pts.map(([x,y])=>sk(`M${x} ${y} l-3 8`,2.4)).join(''),
 cloud:(x,y)=>fill(`M${x-16} ${y} q-2 -10 8 -10 q4 -8 12 -4 q10 -2 10 8 q6 2 2 8 h-30 q-6 -2 -2 -2z`,'#c9d3e2',2.2),
 wall:(x)=>fill(`M${x} -60 L${x+30} -60 L${x+30} 60 L${x} 60 Z`,'#d9c8a8')+sk(`M${x} -30 h30 M${x} 0 h30 M${x} 30 h30 M${x+15} -60 v30 M${x+8} -30 v30 M${x+20} 0 v30 M${x+12} 30 v30`,1.6),
 bike:(x,y)=>`<g transform="translate(${x} ${y})">${sk(ell(-18,0,10,10))}${sk(ell(18,0,10,10))}${sk('M-18 0 L-4 -14 L12 -14 L18 0 M-4 -14 L0 0 L12 -14 M12 -14 L10 -22 h6',2.6)}</g>`,
 fridge:(x,y)=>fill(box(x,y,34,62),'#e8eef5')+sk(`M${x} ${y+22} h34 M${x+28} ${y+8} v8 M${x+28} ${y+30} v10`,2.2),
 glasses:(x,y)=>sk(`${ell(x-7,y,5,4)} ${ell(x+7,y,5,4)} M${x-2} ${y} h4`,2),
 kakigori:(x,y)=>`<g transform="translate(${x} ${y})">${fill('M-12 0 Q0 -22 12 0 Z','#ff9bb0')}${fill('M-14 0 L14 0 L8 10 L-8 10 Z','#cfe8ff')}${sk('M8 -14 l6 -10',2)}</g>`,
 muffler:(y)=>fill(`M-20 ${y} Q0 ${y+6} 20 ${y} L20 ${y+7} Q0 ${y+13} -20 ${y+7} Z`,'#e85a5a',2.4)+fill(`M8 ${y+8} L16 ${y+26} L8 ${y+28} L3 ${y+10} Z`,'#e85a5a',2.4),
 weight:(x,y)=>fill(box(x-16,y-12,32,18),'#666')+`<text x="${x}" y="${y}" font-size="0"></text>`+sk(`M${x-6} ${y-12} q6 -8 12 0`,2.4),
 envelope:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill(box(-12,-8,24,16),'#fff')}${sk('M-12 -8 L0 2 L12 -8',2)}${P.heart(0,-2,0.45)}</g>`,
 snack:(x,y)=>`<g transform="translate(${x} ${y})">${fill(ell(0,4,14,4),'#fff',2)}${fill(ell(-5,0,5,3.5),'#e9b56a',1.6)}${fill(ell(5,-1,5,3.5),'#c98a4a',1.6)}</g>`,
 mug:(x,y,r=0,col='#ffd23f')=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill(box(-8,-10,16,22),col)}${fill('M-9 -12 Q0 -18 9 -12 L9 -8 L-9 -8 Z','#fff',2)}${sk('M8 -4 q8 0 8 6 q0 6 -8 6',2.4)}</g>`,
 cup:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill('M-7 -10 L7 -10 L5 12 L-5 12 Z','#ffa94d')}${sk('M2 -10 L6 -20',2)}</g>`,
 medicine:(x,y)=>`<g transform="translate(${x} ${y})">${fill(box(-10,-6,20,14),'#fff')}${sk('M-3 1 h6 M0 -2 v6',2.4).replace(/#2b2b2b/g,'#e33')}</g>`,
 icepack:(x,y)=>fill(box(x-12,y-5,24,10),'#bfe8ff'),
 blanket:()=>fill('M-30 18 Q0 10 30 18 L34 46 Q0 52 -34 46 Z','#ffcf9e')+sk('M-22 30 q6 4 12 0 M4 32 q6 4 12 0',2),
 lifebuoy:(x,y)=>`<g transform="translate(${x} ${y})">${fill(ell(0,0,14,14),'#ff6b6b')}${fill(ell(0,0,6,6),'#fffaf0')}${sk('M-10 -10 l4 4 M10 -10 l-4 4 M-10 10 l4 -4 M10 10 l-4 -4',3).replace(/#2b2b2b/g,'#fff')}</g>`,
 crate:(x,y)=>fill(box(x-26,y,52,30),'#c9a074')+sk(`M${x-26} ${y+10} h52 M${x-26} ${y+20} h52`,1.6),
 photo:(x,y)=>`<g transform="translate(${x} ${y}) rotate(8)">${fill(box(-12,-14,24,28),'#fff')}${fill(box(-9,-11,18,16),'#cfe8ff',1.6)}${P.heart(0,-6,0.4)}</g>`,
 bandaid:(x,y)=>`<g transform="translate(${x} ${y}) rotate(-25)">${fill(box(-9,-3,18,6),'#ffcf9e',1.6)}</g>`,
 icecream:(x,y,r=0)=>`<g transform="translate(${x} ${y}) rotate(${r})">${fill('M-6 0 L6 0 L0 16 Z','#e9b56a',2)}${fill(ell(0,-4,7,6),'#ffc0d0',2)}</g>`,
 stonefx:'#bcbcbc',
 gears:(x,y)=>`<g transform="translate(${x} ${y})">${fill(ell(0,0,7,7),'#d0d0d0',2)}${fill(ell(14,-8,5,5),'#d0d0d0',2)}${sk('M0 -9 v-3 M9 0 h3 M0 9 v3 M-9 0 h-3',2.4)}</g>`,
 thought:(x,y)=>fill(ell(x,y,16,11),'#fff',2)+fill(ell(x-14,y+14,3,3),'#fff',1.6)+fill(ell(x-18,y+20,2,2),'#fff',1.4),
 sign:(x,y,col='#fff')=>`<g transform="translate(${x} ${y})">${sk('M0 0 V30',3)}${fill(box(-18,-20,36,22),col)}</g>`,
 ball:(x,y)=>fill(ell(x,y,8,8),'#ff8a5c',2.2)+sk(`M${x-8} ${y} q8 -4 16 0`,1.6),
 headband:(y)=>fill(`M-21 ${y} L21 ${y} L21 ${y+5} L-21 ${y+5} Z`,'#ff5a5a',2.2)+fill(`M20 ${y+2} l10 -4 l-2 8 z`,'#ff5a5a',2),
 heartbeat:(x,y)=>P.heart(x,y,1.1)+sk(`M${x-16} ${y+4} l-6 -2 M${x+16} ${y+4} l6 -2 M${x} ${y-12} v-5`,2),
 notes:(x,y)=>sk(`M${x} ${y} v-12 l8 -3 v12`,2.2)+fill(ell(x-2,y,3,2.4),INK,1)+fill(ell(x+6,y-3,3,2.4),INK,1),
 grey:'#b7bcc4',
 lines:(x,y)=>sk(`M${x-24} ${y} v30 M${x-14} ${y} v34 M${x-4} ${y} v28 M${x+6} ${y} v34 M${x+16} ${y} v30 M${x+26} ${y} v26`,1.6),
 tear:(x,y,s=1)=>`<path d="M${x} ${y} q-${4*s} ${7*s} 0 ${10*s} q${4*s} -${3*s} 0 -${10*s}z" fill="#6cc4ff" stroke="${INK}" stroke-width="1.4"/>`,
 tears2:()=>`<path d="M-12 2 q-10 10 -14 26 M12 2 q10 10 14 26" stroke="#6cc4ff" stroke-width="4" fill="none" stroke-linecap="round"/>`,
});
const R=robot;
const WORDS=[
 {w:'morning',t:'おはよう',kj:['おは','おはよう','朝'],ke:['good morning','morning'],v:[
  {id:'morning',s:'',d:()=>R({ex:'joy',arms:AR.up})+P.sun(40,-30)},
  {id:'morningb',s:'まだねむい',d:()=>R({ex:'sleepy',ant:'zig2',arms:AR.down})+sk('M-14 -18 l-4 -6 M-6 -18 l0 -7 M6 -18 l3 -6',2.2)},
  {id:'morningc',s:'げんき！',d:()=>R({ex:'fun',arms:AR.up,legs:'M-8 40 L-9 52 L-14 53 M8 40 L20 44'})+P.sun(-40,-30)+P.motion(-24,10)}]},
 {w:'hello',t:'こんにちは',kj:['こんにちは','こんち','やあ','ハロー'],ke:['hello','hi'],v:[
  {id:'hello',s:'',d:()=>R({ex:'fun',arms:AR.wave})+sk('M36 -4 q4 -2 6 2 M38 4 q4 0 5 4',2.2)},
  {id:'hellob',s:'ひまなの？',d:()=>R({rot:-14,ex:'plain',arms:AR.wave})+P.q(30,-30)},
  {id:'helloc',s:'',d:()=>R({x:-8,ex:'joy',arms:'M-15 22 L-30 2'})+P.wall(4)}]},
 {w:'evening',t:'こんばんは',kj:['こんばんは','こんばん','夜'],ke:['good evening','evening'],v:[
  {id:'evening',s:'',d:()=>R({ex:'joy',arms:AR.wave})+P.moon(-36,-34)+P.star(36,-40,0.8)},
  {id:'eveningb',s:'まだしごと',d:()=>P.desk(-34,32,68)+P.papers(18,28,4)+R({x:-8,y:6,ex:'dizzy',legs:'none',arms:'M-15 22 L-20 30 M15 22 L22 28'})},
  {id:'eveningc',s:'ないしょ',d:()=>R({ex:'sly',arms:AR.holdR})+P.noodle(36,22)+P.moon(-36,-34)}]},
 {w:'night',t:'おやすみ',kj:['おや','おやすみ','寝る','ねる'],ke:['good night','night','sleep'],v:[
  {id:'night',s:'',d:()=>P.futon()+R({x:-26,y:22,s:0.72,rot:-70,ex:'sleepy',body:false,nomk:1})+P.kake('#9db8f2')+P.zz(-6,-6)},
  {id:'nightb',s:'スマホ見ながら',d:()=>P.futon()+R({x:-26,y:22,s:0.72,rot:-70,ex:'plain',body:false,nomk:1})+P.kake('#f2a3b9')+P.phone(-6,8,-20)},
  {id:'nightc',s:'またあした',d:()=>R({ex:'shy',arms:AR.hug})+P.pillow(0,32)+P.moon(34,-34)}]},
 {w:'thanks',t:'ありがとう',kj:['あり','ありがとう','感謝','サンキュー'],ke:['thanks','thank you','thx'],v:[
  {id:'thanks',s:'ほんとに',d:()=>R({bow:-24,ex:'joy',arms:'M-15 22 L-14 38 M15 22 L14 38'})+P.floor(54)+P.heart(30,-30,1)},
  {id:'thanksb',s:'てれる',d:()=>R({ex:'shy',arms:AR.scratch})+P.heart(-32,-24,0.8)},
  {id:'thanksc',s:'',d:()=>R({ex:'joy',arms:AR.holdR})+P.bouquet(36,20)}]},
 {w:'sorry',t:'ごめんね',kj:['ごめ','ごめん','ごめんね','すみません','すまん'],ke:['sorry'],v:[
  {id:'sorry',s:'ほんとうにごめん',d:()=>P.floor(56)+R({y:28,ex:'sad',body:false,nomk:1})+sk('M-20 46 L-34 54 M20 46 L34 54')+P.sweat(26,10)},
  {id:'sorryb',s:'ゆるして〜',d:()=>R({ex:'shy',arms:AR.pray,eye:`<circle cx="-8" cy="-3" r="3.4" fill="${INK}"/><circle cx="8" cy="-3" r="3.4" fill="${INK}"/><circle cx="-7" cy="-4" r="1.2" fill="#fff"/><circle cx="9" cy="-4" r="1.2" fill="#fff"/>`})},
  {id:'sorryc',s:'',d:()=>R({ex:'sad',legs:'sit',arms:AR.front})+P.tear(-24,-8)}]},
 {w:'please',t:'よろしく',kj:['よろ','よろしく','お願い','おねがい'],ke:['please','regards'],v:[
  {id:'please',s:'おねがいします',d:()=>R({bow:-28,ex:'plain',eye:`<path d="M-12 -1 h7 M5 -1 h7" ${LL}/>`,arms:'M-15 22 L-14 38 M15 22 L14 38'})+P.floor(54)},
  {id:'pleaseb',s:'まるなげ',d:()=>R({ex:'sly',arms:'M15 22 L30 6 M-15 22 L-24 34'})+P.paper(44,-22,30)+P.paper(56,-4,-20)+P.motion(32,-30)},
  {id:'pleasec',s:'',d:()=>R({ex:'joy',arms:'M15 22 L36 22 M-15 22 L-24 34'})+hand(38,22)}]},
 {w:'roger',t:'りょうかい！',kj:['りょ','了解','りょうかい','わかった'],ke:['roger','got it','ok'],v:[
  {id:'roger',s:'',d:()=>R({ex:'plain',mouth:`<path d="M-6 7 q6 5 12 0" ${LL} stroke-width="2.4"/>`,arms:AR.salute})},
  {id:'rogerb',s:'ねころびながら',d:()=>P.floor(52)+R({y:30,rot:-80,ex:'plain',arms:'M15 22 Q28 10 20 -8 M-15 22 L-24 30',legs:'M-8 40 L-8 52 M8 40 L10 52'})},
  {id:'rogerc',s:'まかせて',d:()=>R({ex:'fun',arms:'M15 22 L28 12 L26 0 M-15 22 L-24 34'})+fill(ell(27,8,6,5),'#aac0e0',2.2)+P.spark(-34,-20)}]},
 {w:'ok',t:'OK！',kj:['ok','おけ','オッケー','おっけ'],ke:['ok','okay'],v:[
  {id:'ok',s:'',d:()=>R({ex:'joy',arms:'M-15 22 Q-36 -10 -12 -44 M15 22 Q36 -10 12 -44',mk:sk('M-12 -44 Q0 -54 12 -44',3.2)})},
  {id:'okb',s:'よゆう',d:()=>R({ex:'sly',arms:AR.hips})+P.sweat(24,-14)+P.sweat(-26,-6)},
  {id:'okc',s:'',d:()=>R({ex:'joy',eye:`<path d="M-13 -1 q4 -6 8 0" ${LL}/><circle cx="8" cy="-1" r="2.6" fill="${INK}"/>`,arms:'M15 22 L28 6 M-15 22 L-24 34'})+sk(ell(30,2,5,5),2.6)}]},
 {w:'like',t:'いいね！',kj:['いいね','いいね！','グッド'],ke:['like','nice','good'],v:[
  {id:'like',s:'',d:()=>R({ex:'joy',arms:'M-15 22 L-28 14 M15 22 L28 14'})+fill('M-34 14 l0 -10 q0 -4 4 -4 l0 -8 q0 -3 3 -3 q3 0 3 3 l0 8 l2 0 q4 0 4 4 l0 10 z','#ffd9b0',2.4)+fill('M26 14 l0 -10 q0 -4 4 -4 l0 -8 q0 -3 3 -3 q3 0 3 3 l0 8 l2 0 q4 0 4 4 l0 10 z','#ffd9b0',2.4)},
  {id:'likeb',s:'ねころびながら',d:()=>P.floor(52)+R({y:30,rot:-80,ex:'joy',arms:'M15 22 L26 4 M-15 22 L-24 30',legs:'M-8 40 L-8 52 M8 40 L10 52'})+fill('M48 10 l0 -8 q0 -3 3 -3 l0 -6 q0 -3 3 -3 q3 0 3 3 l0 6 l2 0 q3 0 3 3 l0 8 z','#ffd9b0',2.2)},
  {id:'likec',s:'',d:()=>R({ex:'fun',arms:AR.front})+sk('M-10 30 l-6 -4 M10 30 l6 -4 M0 26 v-5',2)+sk('M-30 -10 q-4 -4 0 -8 M30 -10 q4 -4 0 -8',2)}]},
 {w:'wow',t:'すごい！',kj:['すご','すごい','すげ','やば'],ke:['wow','amazing','great'],v:[
  {id:'wow',s:'',d:()=>R({ex:'surprise',eye:`<path d="M-8 -7 l2 5 l5 1 l-4 3 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -3 l5 -1z M8 -7 l2 5 l5 1 l-4 3 l1 5 l-4 -3 l-4 3 l1 -5 l-4 -3 l5 -1z" fill="#ffd23f" stroke="${INK}" stroke-width="1.6"/>`,arms:'M-15 22 L-4 12 M15 22 L4 12'})+P.spark(-34,-24)},
  {id:'wowb',s:'まねしたい',d:()=>R({ex:'fun',arms:'M-15 22 L-30 30 M15 22 L30 4',legs:'M-8 40 L-18 50 M8 40 L9 52 L14 53'})+P.star(36,-12,1)},
  {id:'wowc',s:'',d:()=>R({y:-8,ex:'joy',arms:AR.up,legs:'M-8 40 L-18 46 M8 40 L18 46'})+P.spark(-36,-30)+P.spark(36,-34)+sk('M-24 62 q24 -4 48 0',2)}]},
 {w:'congrats',t:'おめでとう',kj:['おめ','おめでとう','祝','いわい'],ke:['congrats','congratulations'],v:[
  {id:'congrats',s:'',d:()=>R({ex:'fun',arms:'M-15 22 L-30 6 M15 22 L30 6'})+P.cracker(-34,0,-30)+P.cracker(36,0,30)+P.confetti(-20,-40)},
  {id:'congratsb',s:'ケーキは？',d:()=>R({ex:'blank',arms:AR.shrug})+P.q(26,-34)+P.cake(-40,30)},
  {id:'congratsc',s:'',d:()=>R({ex:'joy',arms:AR.holdR})+P.bouquet(36,20)+P.confetti(-30,-40)}]},
 {w:'tired',t:'おつかれさま',kj:['おつ','おつかれ','お疲れ','おつかれさま'],ke:['good job','thanks for your work'],v:[
  {id:'tired',s:'',d:()=>R({rot:-10,ex:'shy',arms:'M-15 22 L0 36 M15 22 L14 34'})+P.tea(10,38)},
  {id:'tiredb',s:'ぼくはねてた',d:()=>R({ex:'sleepy',arms:AR.down,nomk:1,mk:sk('M-16 4 q4 -3 8 0 q4 3 8 0',1.6)})+P.pillow(36,40)},
  {id:'tiredc',s:'',d:()=>R({ex:'joy',arms:'M-15 22 L-4 32 M15 22 L4 32'})+P.towel(0,34)+P.spark(32,-20)}]},
 {w:'cheer',t:'がんばれ',kj:['がん','がんばれ','がんば','応援','ファイト'],ke:['you can do it','go','cheer'],v:[
  {id:'cheer',s:'おうえんしてる',d:()=>R({ex:'fun',arms:'M-15 22 L-26 -4 M15 22 L26 -4'})+P.flag(-26,-2,-14)+P.flag(26,-2,14)},
  {id:'cheerb',s:'ねころんでおうえん',d:()=>P.floor(52)+R({y:30,rot:-80,ex:'joy',arms:'M15 22 L26 4 M-15 22 L-24 30',legs:'M-8 40 L-8 52 M8 40 L10 52'})+P.flag(54,4,20)},
  {id:'cheerc',s:'',d:()=>R({ex:'fun',arms:AR.up})+P.pompom(-28,4)+P.pompom(28,4)}]},
 {w:'happy',t:'うれしい',kj:['うれ','うれしい','嬉','やった'],ke:['yay','happy'],v:[
  {id:'happy',s:'',d:()=>R({y:-10,ex:'joy',arms:'M-15 22 L-30 6 M15 22 L30 6',legs:'M-8 40 L-18 46 M8 40 L18 46'})+sk('M-24 62 q24 -4 48 0',2)},
  {id:'happyb',s:'ちょっとだけ',d:()=>R({s:0.8,ex:'shy',arms:AR.front})+P.heart(24,-28,0.5)},
  {id:'happyc',s:'',d:()=>R({ex:'joy',arms:AR.hug,nomk:1})+P.tear(-12,2,0.8)+P.tear(12,2,0.8)+P.heart(32,-24,0.8)}]},
 {w:'sad',t:'かなしい',kj:['かな','かなしい','悲','しくしく'],ke:['sad'],v:[
  {id:'sad',s:'',d:()=>R({ex:'sad',arms:AR.down})},
  {id:'sadb',s:'ごはんでなおる',d:()=>R({ex:'sad',legs:'sit',arms:'M15 22 L26 18 M-15 22 L-24 30'})+P.onigiri(32,12)},
  {id:'sadc',s:'',d:()=>P.cloud(0,-50)+P.rain([[-20,-36],[-6,-40],[8,-34],[20,-40]])+R({ex:'sad',legs:'sit',arms:AR.front,face:'#a9b6cc'})}]},
 {w:'angry',t:'おこった',kj:['おこ','おこった','怒','むか','ぷん'],ke:['grr','angry','mad'],v:[
  {id:'angry',s:'',d:()=>R({ex:'angry',arms:'M-15 22 L-24 14 L-20 30 M15 22 L24 14 L20 30'})+P.steam(-6,-44)},
  {id:'angryb',s:'すぐわすれる',d:()=>R({ex:'angry',arms:AR.down})+P.butterfly(28,-40)},
  {id:'angryc',s:'ぷんぷん',d:()=>R({ex:'angry',arms:AR.hips,mouth:fill(ell(0,8,6,4),'#f0b0b0',2)})+P.steam(-30,-20)+P.steam(26,-20)}]},
 {w:'surprise',t:'びっくり',kj:['びっ','びっくり','驚','えっ'],ke:['whoa','surprised'],v:[
  {id:'surprise',s:'',d:()=>R({y:-6,ex:'surprise',ant:'up',noball:1,arms:'M-15 22 L-30 8 M15 22 L30 8',legs:'M-8 40 L-14 50 M8 40 L14 50'})+`<circle cx="20" cy="-56" r="4.5" fill="${AN}" stroke="${INK}" stroke-width="2.4"/>`+sk('M14 -48 l-4 -4 M26 -50 l4 -4',2)},
  {id:'surpriseb',s:'ねてた',d:()=>R({ex:'surprise',arms:AR.up,mk:`<path d="M6 12 q2 6 -1 9" stroke="#6cc4ff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`})+P.pillow(-34,40)},
  {id:'surprisec',s:'',d:()=>R({ex:'surprise',eye:`<path d="M-8 -2 L-14 -16 M8 -2 L14 -16" ${LL} stroke-width="2"/><circle cx="-14" cy="-20" r="6" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="-14" cy="-20" r="2" fill="${INK}"/><circle cx="14" cy="-20" r="6" fill="#fff" stroke="${INK}" stroke-width="2.4"/><circle cx="14" cy="-20" r="2" fill="${INK}"/>`,arms:AR.out})}]},
 {w:'idea',t:'なるほど',kj:['なる','なるほど','ふむ'],ke:['i see','got it'],v:[
  {id:'idea',s:'',d:()=>R({ex:'joy',arms:AR.chin})+P.bulb(30,-36)},
  {id:'ideab',s:'ふむふむ',d:()=>R({rot:8,ex:'sly',arms:AR.chin})},
  {id:'ideac',s:'',d:()=>R({ex:'plain',arms:'M15 22 L26 30 M-15 22 L-28 30'})+P.memo(-30,30)+P.pencil(28,24)}]},
 {w:'wait',t:'まってて',kj:['まって','待って','まってて'],ke:['wait','hold on'],v:[
  {id:'wait',s:'すぐいく',d:()=>R({ex:'worry',arms:'M15 22 L28 10 M-15 22 L-24 34'})+P.clock(34,0)},
  {id:'waitb',s:'あわてた',d:()=>R({rot:-14,ex:'worry',arms:'M-15 22 L-30 30 M15 22 L28 10',legs:'M-8 40 L-12 52 M8 40 L20 44'})+P.shoe(30,44,-30)+P.floor(60)},
  {id:'waitc',s:'あと5ふん',d:()=>R({ex:'shy',arms:AR.pray})+P.clock(-32,-24)}]},
 {w:'coming',t:'いまいく！',kj:['いま','いまいく','今行く','すぐいく'],ke:['on my way','coming'],v:[
  {id:'coming',s:'',d:()=>R({x:8,rot:16,ex:'fun',arms:'M-15 22 L-30 32 M15 22 L28 8',legs:'run'})+P.motion(-24,-6)+P.dust(-30,52)},
  {id:'comingb',s:'ふとんの中から',d:()=>P.futon()+R({x:-26,y:22,s:0.72,rot:-70,ex:'sly',body:false,nomk:1})+P.kake('#9dd3a6')},
  {id:'comingc',s:'',d:()=>P.bike(0,44)+R({y:-2,s:0.85,ex:'fun',legs:'M-8 40 L-6 50 M8 40 L10 50',arms:'M15 22 L26 22'})+P.motion(-36,10)}]},
 {w:'home',t:'ただいま',kj:['ただ','ただいま','帰った','かえった'],ke:["i'm home",'home'],v:[
  {id:'home',s:'',d:()=>P.door(-52,-6)+R({ex:'joy',arms:AR.wave})+P.floor(58)},
  {id:'homeb',s:'おやつある？',d:()=>P.door(-52,-6)+R({ex:'joy',arms:'M-15 22 L-28 8 M15 22 L28 30'})+P.randoseru(38,48,30)+P.floor(58)},
  {id:'homec',s:'',d:()=>P.door(-52,-6)+P.floor(58)+R({x:6,y:32,rot:-90,ex:'dizzy',legs:'M-8 40 L-14 52 M8 40 L14 52',arms:'M15 22 L24 32 M-15 22 L-24 28'})}]},
 {w:'go',t:'いってきます',kj:['いって','いってきます','行ってき'],ke:['heading out','bye'],v:[
  {id:'go',s:'',d:()=>P.door(30,-6)+R({x:-10,ex:'joy',arms:'M-15 22 L-30 2 M15 22 L24 34'})},
  {id:'gob',s:'ねむいけど',d:()=>P.door(30,-6)+R({x:-10,ex:'sleepy',arms:'M-15 22 L-28 6 M15 22 L24 34',nomk:1})},
  {id:'goc',s:'',d:()=>R({rot:16,ex:'fun',arms:'M-15 22 L-30 32 M15 22 L28 18',legs:'run'})+fill(box(26,14,18,14),'#7a5a3a')+P.motion(-24,-6)}]},
 {w:'bye',t:'またね',kj:['また','またね','バイ','じゃあね'],ke:['see you','bye'],v:[
  {id:'bye',s:'',d:()=>R({rot:-6,ex:'joy',arms:AR.wave})+sk('M36 -6 q4 -2 6 2 M38 2 q4 0 5 4',2.2)},
  {id:'byeb',s:'さびしい',d:()=>R({ex:'sad',arms:AR.wave,nomk:1})+P.tear(-9,4,0.8)},
  {id:'byec',s:'',d:()=>R({rot:14,ex:'joy',arms:'M15 22 L32 -2 M-15 22 L-24 34',legs:'M-8 40 L-16 50 M8 40 L14 52'})+sk('M38 -10 q4 -2 6 2 M40 -2 q4 0 5 4 M44 6 q3 1 3 5',2.2)}]},
 {w:'lazy',t:'だるい',kj:['だる','だるい','めんど','面倒'],ke:['meh','lazy'],v:[
  {id:'lazy',s:'',d:()=>P.floor(52)+R({y:30,rot:-90,ex:'sleepy',nomk:1,arms:'M15 22 L28 26 M-15 22 L-26 16',legs:'M-8 40 L-12 52 M8 40 L14 50'})+sk('M40 6 q4 -4 8 0 q4 4 8 0',2)},
  {id:'lazyb',s:'なにもしたくない',d:()=>P.floor(52)+R({y:30,rot:-78,ex:'sleepy',nomk:1,legs:'M-8 40 L-8 52 M8 40 L10 52',arms:'M15 22 L28 26 M-15 22 L-26 16'})+`<g transform="translate(48 30) rotate(-25)">${fill(box(-6,-12,12,24),'#555')}<circle cx="0" cy="-6" r="2.4" fill="#e54"/><circle cx="-2.5" cy="1" r="1.5" fill="#ddd"/><circle cx="2.5" cy="1" r="1.5" fill="#ddd"/></g>`},
  {id:'lazyc',s:'',d:()=>fill('M-40 56 Q-44 30 -18 26 Q-14 8 0 8 Q16 8 20 26 Q46 30 42 56 Z',RB)+sk('M-12 24 h7 M5 24 h7',3)+sk('M-5 36 q5 -3 10 0',2.4)+sk('M0 8 q2 -8 12 -8',3)+`<circle cx="14" cy="-1" r="4.5" fill="${AN}" stroke="${INK}" stroke-width="2.4"/>`}]},
 {w:'hungry',t:'はらへった',kj:['はら','はらへった','腹減','おなかすいた','おなか'],ke:['hungry'],v:[
  {id:'hungry',s:'ぐう',d:()=>R({ex:'worry',arms:'M-15 22 L-4 30 M15 22 L4 30'})+sk('M22 28 q4 -3 8 0 q4 3 8 0',2.2)},
  {id:'hungryb',s:'ロボットなのに',d:()=>R({rot:6,ex:'blank',mouth:`<path d="M-4 8 q4 3 8 0" ${LL} stroke-width="2.4"/>`,arms:'M15 22 L24 30 M-15 22 L-22 32',mk:P.tear(2,10,1.2)})+P.ramen(58,30)},
  {id:'hungryc',s:'',d:()=>P.fridge(10,-22)+R({x:-12,rot:10,ex:'surprise',arms:'M15 22 L24 14 M-15 22 L-24 34'})+`<path d="M44 -20 L58 -14 L58 36 L44 40 Z" fill="#fffbd0" stroke="${INK}" stroke-width="2"/>`}]},
 {w:'sleepy',t:'ねむい',kj:['ねむ','ねむい','眠'],ke:['sleepy','tired'],v:[
  {id:'sleepy',s:'',d:()=>R({rot:-12,ex:'sleepy',arms:'M-15 22 L-20 40 M15 22 L20 40'})+P.zz(28,-30)+P.zz(40,-44)},
  {id:'sleepyb',s:'さっきおきた',d:()=>R({ex:'sleepy',ant:'zig2',arms:'M15 22 L22 8 M-15 22 L-24 34',nomk:1})+sk('M-12 -18 l-4 -6 M-4 -18 l0 -7 M6 -18 l3 -6',2.2)},
  {id:'sleepyc',s:'',d:()=>P.desk(-36,30,72)+R({y:20,rot:-60,ex:'sleepy',body:false})+P.zz(26,-12)}]},
 {w:'no',t:'むり',kj:['むり','無理','むーり'],ke:['no way','impossible'],v:[
  {id:'no',s:'',d:()=>R({ex:'worry',arms:AR.cross})+P.xmark(0,-4)},
  {id:'nob',s:'やるまえから',d:()=>R({ex:'sly',arms:AR.cross,legs:'sit'})},
  {id:'noc',s:'',d:()=>R({ex:'worry',arms:AR.down})+sk('M-30 -6 q-6 6 0 12 M30 -6 q6 6 0 12 M-36 -10 q-8 10 0 20 M36 -10 q8 10 0 20',2.4)}]},
 {w:'busy',t:'いそがしい',kj:['いそ','いそがしい','忙'],ke:['busy'],v:[
  {id:'busy',s:'',d:()=>R({ex:'dizzy',arms:'M-15 22 L-28 10 M-15 24 L-30 22 M15 22 L28 10 M15 24 L30 22'})+P.sweat(22,-18)},
  {id:'busyb',s:'ゲームで',d:()=>R({ex:'fun',arms:'M-15 22 L-8 30 M15 22 L8 30',legs:'sit'})+P.game(0,32,0)},
  {id:'busyc',s:'',d:()=>P.papers(-40,40,6)+P.papers(30,40,8)+R({ex:'dizzy',arms:AR.up})}]},
 {w:'lol',t:'わらった',kj:['わら','笑','わらった','www','ｗ'],ke:['lol','haha'],v:[
  {id:'lol',s:'',d:()=>P.floor(52)+R({y:20,rot:-40,ex:'fun',arms:'M-15 22 L-4 30 M15 22 L4 30',legs:'M-8 40 L-20 34 M8 40 L20 30'})},
  {id:'lolb',s:'こっそり',d:()=>R({ex:'fun',arms:'M15 22 L10 12 L2 8 M-15 22 L-10 12 L-2 8',mouth:''})+fill(ell(0,8,9,5),'#aac0e0',2)},
  {id:'lolc',s:'',d:()=>R({ex:'fun',arms:AR.front,nomk:1})+P.tear(-16,0,0.9)+P.tear(16,0,0.9)+sk('M-34 -10 l-6 -4 M34 -10 l6 -4',2.2)}]},
 {w:'cry',t:'ないた',kj:['ない','泣','ないた','えーん'],ke:['cry','crying'],v:[
  {id:'cry',s:'',d:()=>R({ex:'sad',nomk:1,arms:'M-15 22 L-6 8 M15 22 L6 8'})+P.tears2()},
  {id:'cryb',s:'オイルもれ',d:()=>R({ex:'sad',nomk:1,mk:`<path d="M-9 3 q-3 7 0 10 q3 -3 0 -10z M9 3 q-3 9 0 13 q3 -4 0 -13z" fill="#333"/>`,arms:'M-15 22 L-6 8 M15 22 L6 8'})+P.oil(-10,24)+P.puddle(0,56,22)},
  {id:'cryc',s:'',d:()=>R({x:-14,rot:10,ex:'sad',nomk:1,mk:P.tear(-9,3,1)+P.tear(9,3,1),arms:'M15 22 L30 26 L36 18'})+R({x:18,rot:-10,s:0.9,ex:'sad',face:'#c8e6c0',bcol:'#c8e6c0',nomk:1,mk:P.tear(-9,3,1)+P.tear(9,3,1),arms:'M-15 22 L-30 26 L-36 18'})+sk('M-2 22 L14 30 M30 22 L14 30',3)}]},
 {w:'love',t:'すき',kj:['すき','好き','だいすき','らぶ','ラブ'],ke:['love','like you'],v:[
  {id:'love',s:'',d:()=>R({ex:'shy',arms:'M-15 22 L-2 26 M15 22 L2 26'})+P.heart(0,22,1.2)},
  {id:'loveb',s:'ごはんが',d:()=>R({ex:'joy',arms:AR.holdR})+P.heart(30,-26,0.8)+P.bowl(38,30)},
  {id:'lovec',s:'',d:()=>R({ex:'shy',arms:'M15 22 L32 20 M-15 22 L-24 34'})+P.envelope(40,16,-10)}]},
 {w:'yummy',t:'おいしい',kj:['おいし','おいしい','美味','うまい'],ke:['yummy','delicious'],v:[
  {id:'yummy',s:'',d:()=>R({ex:'joy',arms:'M15 22 L22 10 L18 6 M-15 22 L-24 34'})+P.spark(34,-24)},
  {id:'yummyb',s:'たべすぎた',d:()=>R({ex:'joy',arms:'M-15 22 L-30 30 M15 22 L30 30'})+fill(ell(0,36,22,16),RB)+`<path d="M-4 36 h5" stroke="#e8505b" stroke-width="3" stroke-linecap="round"/>`+P.bowl(34,46)+P.bowl(36,34)},
  {id:'yummyc',s:'おかわり',d:()=>R({ex:'fun',arms:'M15 22 L34 12 M-15 22 L-24 34'})+P.bowl(40,10)}]},
 {w:'hot',t:'あつい',kj:['あつ','あつい','暑','熱'],ke:['hot'],v:[
  {id:'hot',s:'',d:()=>R({ex:'worry',face:'#f6c2a8',arms:'M15 22 L28 12 M-15 22 L-24 34'})+P.uchiwa(32,10,20)+P.sun(-40,-34)},
  {id:'hotb',s:'とけそう',d:()=>R({ex:'worry',face:'#f6c2a8',arms:'M15 22 L28 12 M-15 22 L-24 34',legs:'M-8 40 L-8 46 M8 40 L8 46'})+fill('M-22 46 Q0 40 22 46 Q24 56 0 56 Q-24 56 -22 46 Z',RB)+P.sweat(22,-22)},
  {id:'hotc',s:'',d:()=>R({ex:'joy',arms:AR.holdR})+`<g transform="translate(38 24) scale(1.5)">${P.kakigori(0,0)}</g>`}]},
 {w:'cold',t:'さむい',kj:['さむ','さむい','寒'],ke:['cold','freezing'],v:[
  {id:'cold',s:'',d:()=>R({ex:'worry',face:'#c6d8f0',arms:AR.hug})+sk('M-30 -8 l-4 4 l4 4 l-4 4 M30 -8 l4 4 l-4 4 l4 4',2.2)},
  {id:'coldb',s:'こたつから出ない',d:()=>R({x:-4,y:2,ex:'sleepy',body:false,nomk:1})+P.kotatsu()},
  {id:'coldc',s:'',d:()=>R({ex:'shy',arms:AR.down})+P.muffler(12)}]},
 {w:'late',t:'ちこく',kj:['ちこ','ちこく','遅刻','おくれ'],ke:['late','running late'],v:[
  {id:'late',s:'',d:()=>R({rot:16,ex:'worry',ant:'zig',arms:'M-15 22 L-30 32 M15 22 L28 10',legs:'run'})+P.bread(4,14)+P.motion(-24,-6)},
  {id:'lateb',s:'ねぼう',d:()=>R({ex:'surprise',ant:'zig2',arms:AR.up})+P.clock(34,-30)+sk('M-12 -18 l-4 -6 M-4 -18 l0 -7',2.2)},
  {id:'latec',s:'ほんとにごめん',d:()=>R({rot:16,ex:'sad',arms:'M-15 22 L-30 32 M15 22 L28 10',legs:'run',nomk:1})+P.sweat(24,-24)+P.motion(-24,-6)}]},
 {w:'tiredme',t:'つかれた',kj:['つか','つかれた','疲れた','へとへと'],ke:['tired','exhausted'],v:[
  {id:'tiredme',s:'',d:()=>P.floor(52)+R({x:10,y:36,rot:-90,ex:'dizzy',arms:'M15 22 L24 32 M-15 22 L-24 28',legs:'M-8 40 L-14 52 M8 40 L14 52'})},
  {id:'tiredmeb',s:'まだ朝なのに',d:()=>P.floor(52)+R({x:10,y:36,rot:-90,ex:'sleepy',nomk:1,arms:'M15 22 L24 32 M-15 22 L-24 28',legs:'M-8 40 L-14 52 M8 40 L14 52'})+P.ghost(-22,26)},
  {id:'tiredmec',s:'',d:()=>R({y:6,ex:'sad',arms:AR.up,legs:'M-8 40 L-14 52 M8 40 L14 52'})+P.weight(0,-40)}]},
 {w:'forgot',t:'わすれものした',kj:['わすれ','忘れ','わすれもの'],ke:['forgot'],v:[
  {id:'forgot',s:'',d:()=>fill(box(18,-24,48,76),'#f3e6c8')+sk('M18 52 L66 52',2)+`<g transform="translate(42 16)">${fill('M-20 0 Q-20 -22 0 -22 Q20 -22 20 0 Q15 -5 10 0 Q5 -5 0 0 Q-5 -5 -10 0 Q-15 -5 -20 0 Z','#4aa3ff')}${sk('M0 0 V26 q0 6 -7 5',3)}</g>`+R({x:-24,ex:'surprise',arms:'M-15 22 L-30 30 M15 22 L28 14'})+P.rain([[-52,-40],[-38,-52],[-22,-44],[-58,-16],[-6,-56],[-44,-28]])},
  {id:'forgotb',s:'どこ？',d:()=>R({ex:'worry',arms:AR.shrug,mk:P.glasses(0,-24)})+P.q(28,-30)},
  {id:'forgotc',s:'とりにもどる',d:()=>P.door(30,-6)+R({x:-8,rot:-14,ex:'worry',arms:'M-15 22 L-28 10 M15 22 L30 30',legs:'run'})+P.motion(-22,-6)}]},
 {w:'shy',t:'てれる',kj:['てれ','照れ','てれる','えへ'],ke:['shy','blush'],v:[
  {id:'shy',s:'',d:()=>R({ex:'shy',arms:AR.hide,mk:fill(ell(-12,4,6,5),RB,2)+fill(ell(12,4,6,5),RB,2)})},
  {id:'shyb',s:'えへへ',d:()=>R({ex:'shy',arms:AR.scratch})},
  {id:'shyc',s:'',d:()=>R({ex:'shy',face:'#f7b6c2',arms:AR.front})+P.steam(-6,-44)}]},
 {w:'welcome',t:'おかえり',kj:['おかえり','おかえ','お帰り'],ke:['welcome back','welcome home'],v:[
  {id:'welcome',s:'',d:()=>R({ex:'joy',arms:AR.out})+P.heart(0,-48,0.7)},
  {id:'welcomeb',s:'おやつあるよ',d:()=>R({ex:'fun',arms:'M15 22 L32 18 M-15 22 L-24 34'})+P.snack(40,14)},
  {id:'welcomec',s:'まってた',d:()=>P.door(30,-6)+R({x:-10,ex:'joy',legs:'sit',arms:AR.wave})}]},
 {w:'yes',t:'はい',kj:['はい','うん','yes'],ke:['yes','yeah'],v:[
  {id:'yes',s:'',d:()=>R({ex:'joy',arms:'M15 22 L22 -16 M-15 22 L-24 34'})},
  {id:'yesb',s:'げんきよく',d:()=>R({y:-10,ex:'fun',arms:'M15 22 L22 -16 M-15 22 L-30 4',legs:'M-8 40 L-18 46 M8 40 L18 46'})+P.spark(-34,-30)+sk('M-24 62 q24 -4 48 0',2)},
  {id:'yesc',s:'',d:()=>R({rot:14,ex:'joy',arms:AR.down})+sk('M-30 -24 q-4 6 0 12',2.2)}]},
 {w:'nope',t:'いいえ',kj:['いいえ','ううん','いや'],ke:['no','nope'],v:[
  {id:'nope',s:'',d:()=>R({ex:'plain',arms:'M15 22 L30 10 M-15 22 L-24 34'})+sk('M34 0 l4 4 M38 0 l-4 4',2.4)+sk('M-30 -6 q-6 6 0 12 M30 -6 q6 6 0 12',2.2)},
  {id:'nopeb',s:'ちがうよ',d:()=>R({ex:'sly',arms:'M15 22 L30 4 M-15 22 L-25 30 L-15 36'})},
  {id:'nopec',s:'',d:()=>R({ex:'angry',arms:'M-15 22 L10 30 M15 22 L-10 30',nomk:1})}]},
 {w:'sure',t:'いいよ',kj:['いいよ','おっけ','どうぞ'],ke:['sure','go ahead'],v:[
  {id:'sure',s:'',d:()=>R({ex:'joy',arms:AR.up,mk:sk('M-28 4 Q-30 -30 0 -36 Q30 -30 28 4',3)})},
  {id:'sureb',s:'しかたないなあ',d:()=>R({ex:'sly',arms:AR.shrug})},
  {id:'surec',s:'もちろん',d:()=>R({ex:'fun',arms:'M-15 22 L-28 14 M15 22 L24 4'})+fill('M18 4 l0 -8 q0 -3 3 -3 l0 -6 q0 -3 3 -3 q3 0 3 3 l0 6 l2 0 q3 0 3 3 l0 8 z','#ffd9b0',2.2)}]},
 {w:'dame',t:'だめ',kj:['だめ','ダメ','あかん'],ke:['no','not allowed'],v:[
  {id:'dame',s:'',d:()=>R({ex:'angry',arms:AR.cross,nomk:1})+P.xmark(0,-4)},
  {id:'dameb',s:'ぜったい',d:()=>R({ex:'angry',arms:AR.hips})+P.xmark(-36,-30).replace(/stroke-width="5"/g,'stroke-width="3"')},
  {id:'damec',s:'',d:()=>R({ex:'plain',arms:AR.stop,mouth:`<path d="M-5 9 h10" ${LL}/>`})+fill(ell(38,14,7,8),RB,2.2)}]},
 {w:'ruok',t:'だいじょうぶ？',kj:['だいじょうぶ？','大丈夫？','だいじょ','だいじょうぶ'],ke:['are you ok','you ok'],v:[
  {id:'ruok',s:'',d:()=>R({rot:12,ex:'worry',arms:AR.front})+P.q(30,-34)},
  {id:'ruokb',s:'むりしないで',d:()=>R({ex:'shy',arms:'M15 22 L30 24 M-15 22 L-24 34'})+P.tea(40,22)},
  {id:'ruokc',s:'',d:()=>R({ex:'sad',arms:'M15 22 L34 6 M-15 22 L-24 34',nomk:1})+fill(ell(38,0,6,5),RB,2)+sk('M44 -10 q4 -3 6 1',2)}]},
 {w:'imok',t:'だいじょうぶ！',kj:['だいじょうぶ！','大丈夫！','へいき','平気'],ke:["i'm ok",'fine'],v:[
  {id:'imok',s:'',d:()=>R({ex:'joy',arms:'M15 22 L6 26 M-15 22 L-24 34'})+sk('M2 24 l4 2',2)+P.spark(32,-24)},
  {id:'imokb',s:'へいき',d:()=>R({ex:'sly',arms:AR.hips})+P.bandaid(-8,-10)+P.bandaid(10,24)},
  {id:'imokc',s:'',d:()=>R({ex:'fun',arms:'M15 22 L26 2 M-15 22 L-24 34'})+sk('M24 2 l-3 -10 M28 2 l3 -10',2.6)}]},
 {w:'glad',t:'よかった',kj:['よかった','よか','ほっ','安心'],ke:['phew','glad','relieved'],v:[
  {id:'glad',s:'',d:()=>R({ex:'shy',arms:AR.down})+sk('M-28 4 q-8 0 -10 6 M-34 0 q-6 -2 -8 2',2)},
  {id:'gladb',s:'ほっ',d:()=>R({ex:'sleepy',legs:'sit',arms:AR.down,nomk:1})+sk('M20 4 q6 -2 10 2 q4 4 10 2',2.2)},
  {id:'gladc',s:'',d:()=>R({ex:'joy',arms:AR.hug,nomk:1})+P.heart(0,26,1)+P.tear(-12,2,0.8)+P.tear(12,2,0.8)}]},
 {w:'eh',t:'えっ？',kj:['えっ','えっ？','は？'],ke:['huh','what'],v:[
  {id:'eh',s:'',d:()=>R({ex:'surprise',arms:AR.down})+P.q(28,-34)},
  {id:'ehb',s:'もういっかい',d:()=>R({rot:10,ex:'plain',arms:AR.ear})},
  {id:'ehc',s:'',d:()=>R({ex:'blank',arms:AR.down})+P.q(-36,-30)+P.q(26,-40)+P.q(34,-10)}]},
 {w:'why',t:'なんで？',kj:['なんで','なぜ','どうして'],ke:['why'],v:[
  {id:'why',s:'',d:()=>R({rot:-14,ex:'plain',arms:AR.down})+P.q(28,-32)},
  {id:'whyb',s:'おしえて',d:()=>R({ex:'shy',arms:AR.pray})+P.q(30,-30)},
  {id:'whyc',s:'',d:()=>R({ex:'worry',arms:AR.shrug})}]},
 {w:'gaan',t:'がーん',kj:['がーん','ガーン','がーん！','しょっく','ショック'],ke:['shock','oh no'],v:[
  {id:'gaan',s:'',d:()=>P.lines(0,-56)+R({ex:'surprise',face:'#a9b6cc',arms:AR.down})},
  {id:'gaanb',s:'アイスおとした',d:()=>R({ex:'sad',arms:AR.holdR})+`<g transform="translate(34 20)">${fill('M-5 -4 L5 -4 L0 10 Z','#e9b56a',2)}</g>`+fill(ell(26,52,9,3.5),'#ffc0d0',2)},
  {id:'gaanc',s:'',d:()=>R({ex:'blank',face:'#bcbcbc',bcol:'#bcbcbc',arms:AR.down})+sk('M-10 -10 l6 8 l-4 6 M8 20 l4 6',1.6)}]},
 {w:'lonely',t:'さびしい',kj:['さび','さびしい','寂','さみしい'],ke:['lonely','miss you'],v:[
  {id:'lonely',s:'',d:()=>R({ex:'sad',legs:'sit',arms:AR.front,nomk:1})+P.floor(56)},
  {id:'lonelyb',s:'かまって',d:()=>R({rot:-10,ex:'shy',arms:'M15 22 L34 26 M-15 22 L-24 34'})+sk('M36 26 L44 30',2.4)},
  {id:'lonelyc',s:'',d:()=>R({ex:'sad',legs:'sit',arms:AR.front,nomk:1})+P.moon(32,-34)+P.star(-34,-36,0.8)}]},
 {w:'miss',t:'あいたい',kj:['あいたい','会いたい','あい'],ke:['miss you','want to see you'],v:[
  {id:'miss',s:'',d:()=>R({ex:'shy',arms:'M-15 22 L-4 28 M15 22 L4 28'})+P.heart(0,26,1)+P.heart(30,-30,0.6)},
  {id:'missb',s:'いますぐ',d:()=>R({x:8,rot:16,ex:'fun',arms:'M-15 22 L-30 32 M15 22 L28 8',legs:'run'})+P.heart(40,-20,0.8)+P.motion(-24,-6)},
  {id:'missc',s:'',d:()=>R({ex:'shy',arms:AR.holdR})+P.photo(36,16)}]},
 {w:'worry',t:'しんぱい',kj:['しんぱい','心配','しんぱ'],ke:['worried'],v:[
  {id:'worry',s:'',d:()=>R({ex:'worry',arms:AR.pray})},
  {id:'worryb',s:'ねむれない',d:()=>P.futon()+R({x:-26,y:22,s:0.72,rot:-70,ex:'blank',body:false})+P.kake('#c9b8f0')},
  {id:'worryc',s:'',d:()=>R({ex:'worry',arms:AR.hips})+sk('M-40 56 q20 -4 40 0 M10 56 q20 -4 40 0',2)+P.motion(-24,30)+P.motion(54,30)}]},
 {w:'help',t:'たすけて',kj:['たすけ','助けて','たすけて','へるぷ'],ke:['help'],v:[
  {id:'help',s:'',d:()=>R({ex:'worry',arms:AR.up})+P.lifebuoy(38,20)+sk('M-34 -6 l-6 -4 M34 -10 l6 -4',2)},
  {id:'helpb',s:'しめきり',d:()=>P.papers(-40,40,7)+P.papers(30,40,8)+R({ex:'sad',arms:AR.up,nomk:1})+P.tears2()},
  {id:'helpc',s:'',d:()=>R({y:-6,ex:'worry',arms:AR.up,legs:'none'})+P.crate(0,24)}]},
 {w:'itadaki',t:'いただきます',kj:['いただき','いただきます'],ke:["let's eat",'bon appetit'],v:[
  {id:'itadaki',s:'',d:()=>R({ex:'joy',arms:AR.pray})+P.bowl(0,48)},
  {id:'itadakib',s:'まちきれない',d:()=>R({ex:'blank',arms:AR.front,mk:P.tear(4,10,1)})+P.ramen(0,46)},
  {id:'itadakic',s:'',d:()=>R({ex:'fun',arms:'M15 22 L26 10 M-15 22 L-24 34'})+P.onigiri(30,0)}]},
 {w:'gochi',t:'ごちそうさま',kj:['ごちそう','ごちそうさま','ごち'],ke:['thanks for the meal'],v:[
  {id:'gochi',s:'',d:()=>R({ex:'shy',arms:AR.pray})+fill('M-14 46 L14 46 Q12 58 0 58 Q-12 58 -14 46 Z','#ffffff')},
  {id:'gochib',s:'おなかいっぱい',d:()=>R({ex:'joy',legs:'sit',arms:'M-15 22 L-30 30 M15 22 L30 30'})+fill(ell(0,36,22,14),RB)},
  {id:'gochic',s:'おいしかった',d:()=>R({ex:'joy',arms:AR.wave})+P.heart(-32,-26,0.8)+fill('M-14 46 L14 46 Q12 58 0 58 Q-12 58 -14 46 Z','#ffffff')}]},
 {w:'kanpai',t:'かんぱい',kj:['かんぱい','乾杯','かんぱ'],ke:['cheers'],v:[
  {id:'kanpai',s:'',d:()=>R({ex:'fun',arms:'M15 22 L28 4 M-15 22 L-24 34'})+P.mug(32,-4,10)},
  {id:'kanpaib',s:'ジュースで',d:()=>R({ex:'joy',arms:'M15 22 L28 4 M-15 22 L-24 34'})+P.cup(32,-6,10)},
  {id:'kanpaic',s:'',d:()=>R({ex:'fun',arms:AR.up})+P.mug(-26,-6,-20)+P.mug(26,-6,20,'#ffcf3f')+sk('M-8 -40 l2 -6 M0 -42 v-6 M8 -40 l-2 -6',2.2)}]},
 {w:'odaiji',t:'おだいじに',kj:['おだいじ','お大事','おだいじに'],ke:['get well','take care'],v:[
  {id:'odaiji',s:'',d:()=>R({ex:'shy',arms:'M15 22 L30 24 M-15 22 L-24 34'})+P.medicine(40,20)},
  {id:'odaijib',s:'ゆっくりね',d:()=>P.futon()+R({x:-26,y:22,s:0.72,rot:-70,ex:'sleepy',body:false,nomk:1})+P.kake('#ffcf9e')+`<g transform="translate(-32 0) rotate(-20)">${fill('M-10 0 Q-12 -10 0 -12 Q12 -10 10 0 Q6 6 0 6 Q-6 6 -10 0 Z','#bfe8ff',2)}${sk('M0 -12 v-5',2)}</g>`},
  {id:'odaijic',s:'',d:()=>R({ex:'joy',arms:AR.holdR})+`<g transform="translate(40 4) scale(1.4)">${P.bigflower(0,0)}</g>`}]},
 {w:'waku',t:'わくわく',kj:['わくわく','ワクワク','わく'],ke:['excited'],v:[
  {id:'waku',s:'',d:()=>R({y:-6,ex:'joy',arms:AR.up,legs:'M-8 40 L-16 48 M8 40 L16 48'})+P.spark(-34,-28)+P.spark(36,-20)+P.notes(-40,10)},
  {id:'wakub',s:'まだかな',d:()=>R({rot:-10,ex:'joy',arms:AR.chin})+P.clock(34,-28)},
  {id:'wakuc',s:'',d:()=>R({ex:'fun',arms:'M-15 22 L-20 30 M15 22 L20 30'})+P.gift(0,40)+P.spark(-34,-26)+P.spark(34,-20)}]},
 {w:'doki',t:'ドキドキ',kj:['ドキドキ','どきどき','どき'],ke:['nervous','heart pounding'],v:[
  {id:'doki',s:'',d:()=>R({ex:'shy',arms:AR.down})+P.heartbeat(0,26)},
  {id:'dokib',s:'きんちょう',d:()=>R({ex:'worry',arms:AR.down})+P.sweat(-24,-12)+P.sweat(24,-18)+sk('M-30 20 l-4 4 l4 4 M30 20 l4 4 l-4 4',2)},
  {id:'dokic',s:'',d:()=>R({ex:'shy',arms:'M-15 22 L-4 8 M15 22 L4 8'})+P.envelope(0,6,0)}]},
 {w:'think',t:'かんがえちゅう',kj:['かんがえ','考え','かんがえちゅう','うーん'],ke:['thinking','hmm'],v:[
  {id:'think',s:'',d:()=>R({ex:'plain',arms:AR.chin,eye:`<circle cx="-6" cy="-4" r="2.6" fill="${INK}"/><circle cx="10" cy="-4" r="2.6" fill="${INK}"/>`})+P.thought(34,-40)+P.q(30,-46)},
  {id:'thinkb',s:'ねてない',d:()=>R({ex:'sleepy',arms:AR.chin,nomk:1})+P.thought(34,-40)+P.zz(28,-44)},
  {id:'thinkc',s:'',d:()=>R({ex:'worry',arms:AR.chin})+P.gears(6,-50)}]},
 {w:'shh',t:'しーっ',kj:['しー','しーっ','ないしょ','内緒'],ke:['shh','secret'],v:[
  {id:'shh',s:'',d:()=>R({ex:'plain',arms:AR.lips,mouth:''})+sk('M2 0 V16',3)},
  {id:'shhb',s:'ないしょ',d:()=>R({ex:'sly',eye:`<path d="M-13 -1 q4 -6 8 0" ${LL}/><circle cx="8" cy="-1" r="2.6" fill="${INK}"/>`,arms:AR.lips,mouth:''})+sk('M2 0 V16',3)},
  {id:'shhc',s:'',d:()=>R({rot:-8,ex:'worry',arms:'M-15 22 L-24 14 M15 22 L24 14',legs:'M-8 40 L-12 50 L-12 54 M8 40 L14 50 L14 54'})+P.motion(-24,0)}]},
 {w:'later',t:'あとで',kj:['あとで','後で','また後'],ke:['later','talk later'],v:[
  {id:'later',s:'',d:()=>R({ex:'plain',arms:'M15 22 L18 8 M-15 22 L-24 34'})+P.phone(20,0,10)},
  {id:'laterb',s:'いまいそがしい',d:()=>R({ex:'dizzy',arms:AR.hips})+P.papers(30,40,5)},
  {id:'laterc',s:'またれんらくする',d:()=>R({ex:'joy',arms:AR.wave})+P.phone(-32,12,-10)}]},
 {w:'waiting',t:'まってるね',kj:['まってる','待ってる','まってるね'],ke:["i'll wait",'waiting'],v:[
  {id:'waiting',s:'',d:()=>R({ex:'joy',legs:'sit',arms:AR.front})+P.floor(56)},
  {id:'waitingb',s:'ずっと',d:()=>R({ex:'sleepy',legs:'sit',arms:AR.front,nomk:1})+P.floor(56)+P.clock(32,-28)+sk('M-40 -30 q4 -4 8 0 M-36 -40 q4 -4 8 0',2)},
  {id:'waitingc',s:'',d:()=>R({ex:'joy',arms:'M-15 22 L-12 0 M15 22 L12 0'})+P.sign(0,-26,'#fff8c0').replace('V30','V0')+P.heart(0,-36,0.6)}]},
 {w:'hima',t:'ひま',kj:['ひま','暇','たいくつ'],ke:['bored','free'],v:[
  {id:'hima',s:'',d:()=>P.floor(52)+R({y:30,rot:-90,ex:'plain',arms:'M15 22 L24 30 M-15 22 L-24 28',legs:'M-8 40 L-14 52 M8 40 L14 52'})+P.q(40,-6)},
  {id:'himab',s:'あそぼう',d:()=>R({ex:'fun',arms:AR.up})+P.ball(34,30)},
  {id:'himac',s:'',d:()=>R({ex:'plain',legs:'sit',arms:'M15 22 L30 30 M-15 22 L-24 30'})+P.ball(38,40)+P.floor(56)}]},
 {w:'fight',t:'ふぁいと',kj:['ふぁいと','ファイト','がんばる','ふぁい'],ke:['fight',"let's go"],v:[
  {id:'fight',s:'',d:()=>R({ex:'angry',face:RB,arms:AR.fist,nomk:1})+fill(ell(24,2,6,5),RB,2.2)+P.spark(-34,-26)},
  {id:'fightb',s:'じぶんに',d:()=>R({ex:'fun',arms:AR.fist,mk:P.headband(-16)})+fill(ell(24,2,6,5),RB,2.2)},
  {id:'fightc',s:'',d:()=>R({x:8,rot:16,ex:'angry',face:RB,nomk:1,arms:'M-15 22 L-30 32 M15 22 L28 8',legs:'run',mk:P.headband(-16)})+P.motion(-24,-6)}]},
];

const PAP=`<g filter="url(#hpst-w1)"><path d="M6 8 L60 4 L114 9 L112 60 L116 112 L62 116 L8 113 L4 60 Z" fill="#fffdf5" stroke="#d8d0bc" stroke-width="1.5"/></g>`;

const IDX={}; for(const W of WORDS) for(const v of W.v) IDX[v.id]=v;

function svg(id,t,s){ const v=IDX[id], bb=BB[id]; if(!v||!bb) return ''; const LY=hwLay(String(t||''),String(s||''),11+hsh(id)%997); BXS=hsh(id); const d=v.d();
  const X0=8,X1=112,Y0=Math.max(44,LY.y0),Y1=114, k=Math.min(1.6,(X1-X0)/bb[2],(Y1-Y0)/bb[3]), tx=(X0+X1)/2-(bb[0]+bb[2]/2)*k, ty=Y1-(bb[1]+bb[3])*k, f=Math.min(1.6,1/k);
  const art=('<g filter="url(#hpst-w1)">'+d+'</g>').replace(/stroke-width="([0-9.]+)"/g,(m,w)=>'stroke-width="'+(parseFloat(w)*f).toFixed(2)+'"');
  return PAP+'<g class="art" transform="translate('+tx.toFixed(1)+' '+ty.toFixed(1)+') scale('+k.toFixed(3)+')">'+art+'</g><g class="txt">'+LY.svg+'</g>'; }
return {svg:svg,defs:DEFS,has:id=>!!IDX[id],G:G,GW:GW,BB:BB,lay:hwLay,width:hwWidth,wrap:hwWrap};
})();
const HP_STP=[]; for(const W of HP_STW) for(const id of W.v) HP_STP.push({id:id,w:W.w,kj:W.kj,ke:W.ke});
function hpStpOf(id){ return HP_STP.find(x=>x.id===id)||null; }
function hpStpLabel(id){ try{ const S=hpStpOf(id), k=S?HP_STP_LB[S.w]:''; if(k){ const v=T(k); if(v&&v!==k) return v; } }catch(e){} return id; }
function hpStpSub(id){ try{ const k=HP_STQ_LB[id]; if(k){ const v=T(k); if(v&&v!==k) return v; } }catch(e){} return ''; }
function hpStpText(id){ return HP_STP_MK+id+'\u2063'+'［'+T('stp_word')+'：'+hpStpLabel(id)+'］'; }
function hpStpId(text){ const m=HP_STP_RE.exec(String(text||'')); return (m&&hpStpOf(m[1]))?m[1]:''; }
function hpStpDefs(){ try{ if(typeof document==='undefined'||!document.body||document.getElementById('hp-st-defs')) return; const d=document.createElementNS('http://www.w3.org/2000/svg','svg'); d.id='hp-st-defs'; d.setAttribute('width','0'); d.setAttribute('height','0'); d.setAttribute('aria-hidden','true'); d.style.cssText='position:absolute;width:0;height:0;overflow:hidden'; d.innerHTML=HP_STA.defs; document.body.appendChild(d); }catch(e){} }
function hpStpSvg(id,px){ if(!hpStpOf(id)||typeof document==='undefined'||!document.createElementNS) return null; hpStpDefs(); const NS='http://www.w3.org/2000/svg';
  const sv=document.createElementNS(NS,'svg'); sv.setAttribute('viewBox','0 0 120 120'); sv.setAttribute('width',String(px||120)); sv.setAttribute('height',String(px||120)); sv.setAttribute('role','img');
  const lb=hpStpLabel(id), sb=hpStpSub(id); sv.setAttribute('aria-label',sb?lb+' '+sb:lb); sv.innerHTML=HP_STA.svg(id,lb,sb); return sv; }

function hpStpMatch(q){ q=String(q||'').trim().toLowerCase(); if(!q||q.length>16||HP_STP_RE.test(q)) return []; const out=[];
  for(const W of HP_STW){ let lb=''; try{ lb=T(HP_STP_LB[W.w]); }catch(e){} const keys=W.kj.concat(W.ke,[lb]).map(k=>String(k).toLowerCase()).filter(Boolean);
    if(keys.some(k=>k.startsWith(q)||(q.length>=2&&(k.indexOf(q)>=0||q.indexOf(k)>=0&&k.length>=2)))) for(const id of W.v) out.push(id); if(out.length>=8) break; }
  return out.slice(0,8); }
function hpStpSend(id){ try{ if(!hpStpOf(id)) return false; const t=document.getElementById('text'); if(!t||t.disabled) return false; t.value=hpStpText(id); hpStpSugHide(); hpStpPanHide(); if(typeof sendChat==='function') sendChat(); try{ if(typeof hpTextFit==='function') hpTextFit(); }catch(e){} return true; }catch(e){ return false; } }
let HP_STP_IO=null;
function hpStpEmo(id){ try{ const k=HP_STM_LB[HP_STE[id]]; if(k){ const v=T(k); if(v&&v!==k) return v; } }catch(e){} return ''; }
function hpStpBtns(box,ids,px,lazy){ box.textContent=''; for(const id of ids){ const b=document.createElement('button'); b.type='button'; b.title=hpStpLabel(id); b.dataset.st=id; b.style.width=(px+4)+'px';
    const cap=document.createElement('span'); cap.className='st-cap'; cap.textContent=hpStpEmo(id); b.appendChild(cap); const paint=()=>{ if(b.__p) return; b.__p=1; const sv=hpStpSvg(id,px); if(sv) b.insertBefore(sv,cap); };
    if(lazy&&typeof IntersectionObserver==='function'){ if(!HP_STP_IO) HP_STP_IO=new IntersectionObserver(es=>{ for(const e of es) if(e.isIntersecting){ try{ e.target.__paint&&e.target.__paint(); }catch(_){} HP_STP_IO.unobserve(e.target); } },{root:null,rootMargin:'120px'}); b.__paint=paint; HP_STP_IO.observe(b); } else paint();
    b.onmousedown=e=>{ try{ e.preventDefault(); }catch(_){} }; b.onclick=()=>{ hpStpSend(id); }; box.appendChild(b); } return box.children.length; }
function hpStpBox(id){ let w=document.getElementById(id); if(w) return w; const cp=document.getElementById('composer'); if(!cp||!cp.parentNode) return null; w=document.createElement('div'); w.id=id; cp.parentNode.insertBefore(w,cp); return w; }
function hpStpSugHide(){ const w=document.getElementById('st-sug'); if(w) w.classList.remove('on'); }
function hpStpPanHide(){ const w=document.getElementById('st-pan'), b=document.getElementById('btn-st'); if(w) w.classList.remove('on'); if(b) b.classList.remove('on'); }
function hpStpSug(){ try{ const t=document.getElementById('text'); if(!t) return 0; const ids=hpStpMatch(t.value); const w=hpStpBox('st-sug'); if(!w) return 0; if(!ids.length){ w.classList.remove('on'); return 0; } hpStpBtns(w,ids,60,false); w.classList.add('on'); return ids.length; }catch(e){ return 0; } }
function hpStpPan(w){ w.textContent=''; const h=document.createElement('div'); h.className='st-hd'; h.textContent=T('stp_hanpo'); w.appendChild(h); const g=document.createElement('div'); g.className='st-gr'; w.appendChild(g); hpStpBtns(g,HP_STP.map(x=>x.id),68,true); return g.children.length; }
function hpStpMount(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const cb=document.getElementById('cbox'), t=document.getElementById('text'); if(!cb||!t) return ''; if(document.getElementById('btn-st')) return 'have';
  if(document.head&&!document.getElementById('hp-st-css')){ const st=document.createElement('style'); st.id='hp-st-css'; st.textContent='#st-sug,#st-pan{display:none;flex:0 0 auto;align-self:stretch;margin:0 8px 6px;padding:4px;background:#121a2b;border:1px solid var(--line,#2a3a5a);border-radius:10px}#st-sug{flex-wrap:wrap;gap:2px;justify-content:flex-end;align-self:flex-end;max-width:calc(100% - 16px)}#st-sug.on{display:flex}#st-pan.on{display:block}#st-pan{max-height:240px;overflow-y:auto}#st-pan .st-hd{font-size:12px;font-weight:700;color:var(--dim);margin:2px 4px 4px}#st-pan .st-gr{display:flex;flex-wrap:wrap;gap:2px}#st-sug button,#st-pan button{border:none;background:none;padding:2px;border-radius:8px;line-height:0;display:flex;flex-direction:column;align-items:center}#st-sug .st-cap,#st-pan .st-cap{display:block;line-height:1.2;font-size:10px;color:var(--dim);margin-top:1px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#st-sug button:hover,#st-pan button:hover{background:#1b2740}#p-chat.list-mode #st-sug,#p-chat.list-mode #st-pan{display:none}#cbox #btn-st{flex:0 0 auto;margin:0 0 5px 0;padding:2px;border:none;background:none;line-height:0;border-radius:8px;filter:grayscale(1);opacity:.5}#cbox #btn-st.on,#cbox #btn-st:hover{opacity:.7}#msgs .m.stamp{background:none!important;border:none!important;box-shadow:none!important;padding:2px 0}#msgs .m.stamp .bd{display:block;line-height:0}#msgs .m.stamp .bd svg{display:block}#msgs .m.stamp time,#msgs .m.stamp .smark,#msgs .m.stamp .rmark{display:inline-block;vertical-align:baseline;margin:2px 8px 0 0;text-align:left}'; document.head.appendChild(st); }
  const b=document.createElement('button'); b.type='button'; b.className='b'; b.id='btn-st'; const sv=hpStpSvg('hello',26); if(sv) b.appendChild(sv); try{ b.title=T('stp_hanpo'); b.setAttribute('aria-label',T('tip_stamp')); }catch(e){}
  b.onmousedown=e=>{ try{ e.preventDefault(); }catch(_){} }; b.onclick=()=>{ const w=hpStpBox('st-pan'); if(!w) return; const on=!w.classList.contains('on'); if(on){ if(!w.__made){ hpStpPan(w); w.__made=1; } hpStpSugHide(); } w.classList.toggle('on',on); b.classList.toggle('on',on); };
  const emo=document.getElementById('btn-emo'); cb.insertBefore(b,(emo&&emo.parentNode===cb)?emo:null);
  t.addEventListener('input',()=>{ hpStpPanHide(); hpStpSug(); });
  return 'made'; }catch(e){ return ''; } }
function hpStpPaint(el,id){ try{ if(!el||!id) return false; const bd=el.querySelector?el.querySelector('.bd'):null; if(!bd) return false; bd.textContent=''; const sv=hpStpSvg(id,130); if(sv) bd.appendChild(sv); el.classList.add('stamp'); return true; }catch(e){ return false; } }
try{ if(typeof addMsgAt==='function'&&!addMsgAt.__st){ const f=addMsgAt; addMsgAt=function(kind,text,who,ts,voided){ const r=f.apply(this,arguments); try{ const id=(!voided&&typeof text==='string')?hpStpId(text):''; if(id){ const ms=document.getElementById('msgs'), el=ms&&ms.lastElementChild; if(el&&el.dataset&&el.dataset.ts===String(ts)) hpStpPaint(el,id); } }catch(e){} return r; }; Object.assign(addMsgAt,f,{__st:1}); } }catch(e){}
try{ if(typeof convPreview==='function'&&!convPreview.__st){ const f=convPreview; convPreview=function(m){ try{ if(m&&!m.x&&typeof m.t==='string'){ const id=hpStpId(m.t); if(id) return (m.d==='s'?T('conv_you')+' ':'')+'［'+T('stp_word')+'：'+hpStpLabel(id)+'］'; } }catch(e){} return f.apply(this,arguments); }; Object.assign(convPreview,f,{__st:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setInterval==='function'){ const go=()=>{ try{ hpStpMount(); }catch(e){} }; if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',go); else go(); setInterval(go,5000); } }catch(e){}

const HP_AV_MAXB=24000, HP_AV_IN_MAX=40000, HP_AV_URL=new Map(); let HP_AV_BUSY=false;
function hpAvB64(u8){ let s=''; for(let i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,Array.from(u8.subarray(i,i+0x8000))); return btoa(s); }
function hpAvUnb64(s){ const b=atob(s), u=new Uint8Array(b.length); for(let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }
function hpAvJpeg(u8){ return !!u8&&u8.length>3&&u8[0]===0xFF&&u8[1]===0xD8&&u8[2]===0xFF; }
function hpAvOk(o){ return !!o&&o.v===1&&typeof o.at==='number'&&o.at>0&&o.at<Date.now()+864e5&&(o.del===1||(typeof o.jpg==='string'&&o.jpg.length>0&&o.jpg.length<=HP_AV_IN_MAX&&/^[A-Za-z0-9+/]+={0,2}$/.test(o.jpg))); }
async function hpAvLoad(file){
  if(!file||!(file.size>0)) throw new Error('decode'); if(file.size>80*1024*1024) throw new Error('big');
  let src=null, w=0, h=0, url='';
  try{ src=await createImageBitmap(file,{imageOrientation:'from-image'}); w=src.width; h=src.height; }catch(e){ src=null; }
  if(!src){ url=URL.createObjectURL(file); try{ const im=new Image(); im.src=url; await (im.decode?im.decode():new Promise((ok,ng)=>{ im.onload=ok; im.onerror=ng; })); src=im; w=im.naturalWidth; h=im.naturalHeight; }catch(e){ src=null; } }
  if(!src||!(w>0&&h>0)){ if(url) setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch(e){} },0); throw new Error('decode'); }
  return {src:src,w:w,h:h,close:()=>{ try{ if(typeof src.close==='function') src.close(); }catch(e){} if(url) setTimeout(()=>{ try{ URL.revokeObjectURL(url); }catch(e){} },1000); }}; }
function hpAvClamp(L,c){ const m=Math.min(L.w,L.h); c.s=Math.max(m/8,Math.min(m,Number(c.s)||m)); c.cx=Math.max(c.s/2,Math.min(L.w-c.s/2,Number(c.cx))); c.cy=Math.max(c.s/2,Math.min(L.h-c.s/2,Number(c.cy))); return c; }
async function hpAvRender(L,c){
  for(const px of [256,192,128]){ const cv=document.createElement('canvas'); cv.width=px; cv.height=px; const x=cv.getContext('2d'); x.fillStyle='#ffffff'; x.fillRect(0,0,px,px); try{ x.imageSmoothingQuality='high'; }catch(e){} x.drawImage(L.src,c.cx-c.s/2,c.cy-c.s/2,c.s,c.s,0,0,px,px);
    for(const q of [0.85,0.75,0.65,0.55]){ const b=await new Promise(z=>cv.toBlob(z,'image/jpeg',q)); if(b&&b.size>0&&b.size<=HP_AV_MAXB) return b; } }
  throw new Error('big'); }
async function hpAvShrink(file){ const L=await hpAvLoad(file); try{ return await hpAvRender(L,hpAvClamp(L,{s:Math.min(L.w,L.h),cx:L.w/2,cy:L.h/2})); }finally{ L.close(); } }
function hpAvEditor(L,c){
  const V=240, M=1.3, dpr=Math.max(1,Math.min(3,(typeof window!=='undefined'&&window.devicePixelRatio)||1)), m=Math.min(L.w,L.h);
  const box=document.createElement('div'); box.className='av-ed'; box.style.cssText='display:flex;flex-direction:column;align-items:center;gap:8px;margin:10px 0';
  const cv=document.createElement('canvas'); cv.width=Math.round(V*dpr); cv.height=Math.round(V*dpr); cv.style.cssText='width:'+V+'px;height:'+V+'px;border-radius:12px;touch-action:none;cursor:grab;background:#0d1424'; box.appendChild(cv);
  const row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:8px;width:'+V+'px';
  const mn=document.createElement('button'); mn.type='button'; mn.className='b'; mn.textContent='−'; mn.setAttribute('aria-label',T('av_zoom_out'));
  const sl=document.createElement('input'); sl.type='range'; sl.min='100'; sl.max='800'; sl.step='1'; sl.style.cssText='flex:1;min-width:0'; sl.setAttribute('aria-label',T('av_zoom'));
  const pl=document.createElement('button'); pl.type='button'; pl.className='b'; pl.textContent='+'; pl.setAttribute('aria-label',T('av_zoom_in'));
  row.appendChild(mn); row.appendChild(sl); row.appendChild(pl); box.appendChild(row);
  const nt=document.createElement('div'); nt.className='note'; nt.style.cssText='text-align:center;margin:0'; nt.textContent=T('av_ed_tip'); box.appendChild(nt);
  const x=cv.getContext('2d');
  const draw=()=>{ hpAvClamp(L,c); const vs=c.s*M, k=V/vs, ox=c.cx-vs/2, oy=c.cy-vs/2; x.setTransform(dpr,0,0,dpr,0,0); x.fillStyle='#0d1424'; x.fillRect(0,0,V,V); try{ x.imageSmoothingQuality='high'; }catch(e){}
    x.drawImage(L.src,-ox*k,-oy*k,L.w*k,L.h*k); const r=V/M/2; x.fillStyle='rgba(0,0,0,0.55)'; x.beginPath(); x.rect(0,0,V,V); x.arc(V/2,V/2,r,0,Math.PI*2,true); x.fill('evenodd');
    x.strokeStyle='rgba(255,255,255,0.9)'; x.lineWidth=1.5; x.beginPath(); x.arc(V/2,V/2,r,0,Math.PI*2); x.stroke(); sl.value=String(Math.round(m/c.s*100)); };
  const zoomTo=s=>{ c.s=s; draw(); };
  const P=new Map(); let pd=0;
  const dist=()=>{ const a=Array.from(P.values()); return a.length>=2?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0; };
  cv.addEventListener('pointerdown',e=>{ try{ cv.setPointerCapture(e.pointerId); }catch(_){} P.set(e.pointerId,{x:e.clientX,y:e.clientY}); pd=dist(); cv.style.cursor='grabbing'; try{ e.preventDefault(); }catch(_){} });
  cv.addEventListener('pointermove',e=>{ const p=P.get(e.pointerId); if(!p) return; const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
    if(P.size>=2){ const d=dist(); if(pd>0&&d>0) zoomTo(c.s*pd/d); pd=d; } else { const u=c.s*M/V; c.cx-=dx*u; c.cy-=dy*u; draw(); } });
  const up=e=>{ P.delete(e.pointerId); pd=dist(); if(!P.size) cv.style.cursor='grab'; };
  cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{ try{ e.preventDefault(); }catch(_){} zoomTo(c.s*(e.deltaY>0?1.1:1/1.1)); },{passive:false});
  sl.addEventListener('input',()=>{ const v=Number(sl.value)||100; zoomTo(m*100/v); });
  mn.onclick=()=>zoomTo(c.s*1.2); pl.onclick=()=>zoomTo(c.s/1.2);
  draw(); return box; }
async function hpAvUrl(id,at){ const k=id+'@'+(at||0); if(HP_AV_URL.has(k)) return HP_AV_URL.get(k); const b=await blobGet(id); if(!b) return ''; const u=URL.createObjectURL(b); HP_AV_URL.set(k,u); return u; }
function hpAvImg(el,id,at){ hpAvUrl(id,at).then(u=>{ if(!u||!el) return; el.textContent=''; const im=document.createElement('img'); im.className='avimg'; im.alt=''; im.src=u; el.appendChild(im); }).catch(()=>{}); return true; }
function hpAvFill(av,c){ if(!av||!c||!c.av||!c.av.id) return false; if(typeof hpBlkOn==='function'&&hpBlkOn(c.address)) return false; av.style.cursor='pointer'; if(c.avHide){ av.onclick=e=>{ try{ e.stopPropagation(); }catch(_){} hpAvShowAsk(c); }; return false; } av.onclick=e=>{ if(!c.av||!c.av.id||c.avHide) return; try{ e.stopPropagation(); }catch(_){} hpAvView(c.av.id,c.av.at,c.nick||'',c); }; return hpAvImg(av,c.av.id,c.av.at); }
function hpAvMark(c){ const d=document.createElement('div'); d.className='av ctav'; d.textContent=String((c&&c.nick)||'?').slice(0,1).toUpperCase(); hpAvFill(d,c); return d; }
function hpAvShowAsk(c){ if(!c) return false; hpAsk({text:T('av_hidden'),ok:T('btn_av_show'),cancel:T('btn_close')}).then(v=>{ if(!v) return; delete c.avHide; saveID(); try{ renderContacts(); }catch(e){} }).catch(()=>{}); return true; }
async function hpAvBody(){ const a=(typeof ID!=='undefined'&&ID)?ID.av:null; if(!a||!a.at) return null; if(a.del) return {v:1,type:'avatar',at:a.at,del:1}; const b=await blobGet(a.id||'av-me'); if(!b) return null; return {v:1,type:'avatar',at:a.at,jpg:hpAvB64(new Uint8Array(await b.arrayBuffer()))}; }
function hpAvKey(a,c){ const card=(typeof hpCardOf==='function')?hpCardOf(c.address):null; return a.at+'/'+((card&&Array.isArray(card.devices))?card.devices.length:0); }
async function hpAvTick(){
  if(HP_AV_BUSY||typeof ID==='undefined'||!ID||!ID.av||!ID.av.at) return 0; HP_AV_BUSY=true; let n=0, ch=false;
  try{ const a=ID.av; if(!ID.avSent||typeof ID.avSent!=='object') ID.avSent={}; const S=ID.avSent; let js='';
    for(const c of (Array.isArray(ID.contacts)?ID.contacts:[])){ if(n>=5) break; if(!c||!c.address) continue; const key=hpAvKey(a,c); if(S[c.address]===key) continue;
      if(a.del&&!(c.address in S)){ S[c.address]=key; ch=true; continue; }
      if(typeof hpBlocked==='function'&&hpBlocked(c.address)) continue; const card=(typeof hpCardOf==='function')?hpCardOf(c.address):null; if(!card) continue;
      if(!js){ const body=await hpAvBody(); if(!body) break; js=JSON.stringify(body); }
      try{ await hpPut(card,js,'msg'); S[c.address]=key; n++; ch=true; try{ hpLog('プロフィール写真'+(a.del?'を外したことを':'を')+'送った → '+nickOf(c.address)); }catch(e){} }
      catch(e){ try{ hpLog('プロフィール写真を送れない → '+nickOf(c.address)+'（あとで送り直す）'); }catch(_){} } }
    if(ch) saveID(); }finally{ HP_AV_BUSY=false; } return n; }
async function hpAvSibSend(){ try{ if(typeof ID==='undefined'||!ID||!ID.av||!ID.av.at) return false; let sibs=[]; try{ sibs=hpSibs(); }catch(e){ sibs=[]; } if(!sibs.length){ ID.avSibAt=ID.av.at; return true; }
    if(ID.avSibAt===ID.av.at) return true; if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return false; const body=await hpAvBody(); if(!body) return false; body.type='sibav';
    await hpSibPut(body); ID.avSibAt=ID.av.at; saveID(); try{ hpLog('プロフィール写真を自分のほかの端末へ知らせた'); }catch(e){} return true; }catch(e){ return false; } }
async function hpAvIn(from,o){
  try{ if(!hpAvOk(o)) return 'bad'; const c=(Array.isArray(ID.contacts)?ID.contacts:[]).find(x=>x.address===from); if(!c) return 'bad'; if(c.av&&Number(c.av.at)>=o.at) return 'old';
    if(o.del===1){ delete c.av; saveID(); try{ renderContacts(); }catch(e){} try{ hpLog('プロフィール写真が外された ← '+nickOf(from)); }catch(e){} return 'del'; }
    const u8=hpAvUnb64(o.jpg); if(!hpAvJpeg(u8)||u8.length>HP_AV_MAXB+8000) return 'bad';
    const id='avp-'+from; await blobPut(id,new Blob([u8],{type:'image/jpeg'})); c.av={id:id,at:o.at}; saveID(); try{ renderContacts(); }catch(e){} try{ hpLog('プロフィール写真が届いた ← '+nickOf(from)); }catch(e){} return 'set'; }catch(e){ return 'bad'; } }
async function hpAvSibIn(r,o){
  try{ if(typeof ID==='undefined'||!ID||r.from!==ID.address||r.fromMaster!==ID.publicKey) return 'bad'; const oo=Object.assign({},o,{type:'avatar'}); if(!hpAvOk(oo)) return 'bad'; if(ID.av&&Number(ID.av.at)>=o.at) return 'old';
    if(o.del===1) ID.av={at:o.at,del:1}; else { const u8=hpAvUnb64(o.jpg); if(!hpAvJpeg(u8)) return 'bad'; await blobPut('av-me',new Blob([u8],{type:'image/jpeg'})); ID.av={id:'av-me',at:o.at}; }
    const S={}; for(const c of (Array.isArray(ID.contacts)?ID.contacts:[])) if(c&&c.address) S[c.address]=hpAvKey({at:o.at},c); ID.avSent=S; ID.avSibAt=o.at; saveID(); try{ hpAvUi(); }catch(e){} try{ hpLog('自分のほかの端末からプロフィール写真を受けた'); }catch(e){} return o.del===1?'del':'set'; }catch(e){ return 'bad'; } }
async function hpAvSet(blob){ const at=Date.now(); await blobPut('av-me',blob); ID.av={id:'av-me',at:at}; ID.avSent={}; saveID(); try{ hpAvUi(); }catch(e){} hpAvSibSend().catch(()=>{}); hpAvTick().catch(()=>{}); return true; }
async function hpAvDel(){ if(!ID||!ID.av||ID.av.del) return false; if(!(await hpAsk({text:T('cf_av_del'),danger:true,ok:T('btn_av_del')}))) return false; ID.av={at:Date.now(),del:1}; saveID(); try{ hpAvUi(); }catch(e){} hpAvSibSend().catch(()=>{}); hpAvTick().catch(()=>{}); return true; }
async function hpAvPick(file){ let L=null; try{ L=await hpAvLoad(file); }catch(e){ const big=String(e&&e.message)==='big'; try{ await hpAsk({text:T(big?'av_e_big':'av_e_open'),ok:T('btn_close'),noOk:false}); }catch(_){} return false; }
  try{ const c=hpAvClamp(L,{s:Math.min(L.w,L.h),cx:L.w/2,cy:L.h/2}); const ok=await hpAsk({text:T('av_ask'),node:hpAvEditor(L,c),ok:T('btn_av_use')}); if(!ok) return false;
    let b=null; try{ b=await hpAvRender(L,c); }catch(e){ try{ await hpAsk({text:T('av_e_big'),ok:T('btn_close'),noOk:false}); }catch(_){} return false; }
    return await hpAvSet(b); }finally{ L.close(); } }
function hpAvView(id,at,title,c){ hpAvUrl(id,at).then(u=>{ if(!u) return; const box=document.createElement('div'); box.style.cssText='display:flex;justify-content:center;margin:10px 0'; const im=document.createElement('img'); im.src=u; im.alt=''; im.style.cssText='width:min(240px,70vw);height:min(240px,70vw);border-radius:50%;object-fit:cover;display:block'; box.style.flexDirection='column'; box.style.alignItems='center'; box.appendChild(im); if(c){ const nt=document.createElement('div'); nt.className='note'; nt.style.cssText='text-align:center;margin:10px 0 0'; nt.textContent=T('av_hide_note'); box.appendChild(nt); hpAsk({text:title||T('av_title'),node:box,ok:T('btn_av_hide'),cancel:T('btn_close')}).then(v=>{ if(!v) return; c.avHide=1; saveID(); try{ renderContacts(); }catch(e){} }).catch(()=>{}); } else hpAsk({text:title||T('av_title'),node:box,noOk:true,cancel:T('btn_close')}).catch(()=>{}); }).catch(()=>{}); return true; }
function hpAvUi(){ try{ const ci=document.getElementById('av-me'), del=document.getElementById('btn-av-del'); if(!ci) return false; const a=(typeof ID!=='undefined'&&ID)?ID.av:null, on=!!(a&&a.at&&!a.del);
    const k=on?String(a.at):'none'; if(ci.getAttribute('data-k')!==k){ ci.setAttribute('data-k',k); ci.textContent=String((ID&&ID.myName)||'?').slice(0,1).toUpperCase(); if(on) hpAvImg(ci,a.id||'av-me',a.at); }
    if(del) del.style.display=on?'':'none'; return true; }catch(e){ return false; } }
function hpAvMount(){ try{ if(typeof document==='undefined'||!document.getElementById||document.getElementById('av-row')) return hpAvUi(); const ne=document.querySelector('#p-id .name-edit-row'); if(!ne||!ne.parentNode) return false;
    const row=document.createElement('div'); row.id='av-row'; row.className='kv'; row.style.cssText='margin-top:8px;align-items:center';
    const h=document.createElement('b'); h.textContent=T('av_title'); h.setAttribute('data-i18n','av_title'); row.appendChild(h);
    const sp=document.createElement('span'); sp.style.cssText='display:flex;align-items:center;gap:10px;flex-wrap:wrap'; const ci=document.createElement('div'); ci.id='av-me'; ci.className='av'; ci.onclick=()=>{ const a=(typeof ID!=='undefined'&&ID)?ID.av:null; if(a&&a.at&&!a.del) hpAvView(a.id||'av-me',a.at,T('av_title')); }; sp.appendChild(ci);
    const inp=document.createElement('input'); inp.type='file'; inp.accept='image/'+'*'; inp.style.display='none'; inp.id='av-file'; inp.onchange=()=>{ const f=inp.files&&inp.files[0]; inp.value=''; if(f) hpAvPick(f).catch(()=>{}); }; sp.appendChild(inp);
    const pk=document.createElement('button'); pk.className='b'; pk.type='button'; pk.textContent=T('btn_av_pick'); pk.setAttribute('data-i18n','btn_av_pick'); pk.onclick=()=>{ hpAvPickGo(inp); }; sp.appendChild(pk);
    const dl=document.createElement('button'); dl.className='b'; dl.type='button'; dl.id='btn-av-del'; dl.textContent=T('btn_av_del'); dl.setAttribute('data-i18n','btn_av_del'); dl.onclick=()=>{ hpAvDel().catch(()=>{}); }; sp.appendChild(dl); row.appendChild(sp);
    const nt=document.createElement('div'); nt.className='note'; nt.textContent=T('av_note'); nt.setAttribute('data-i18n','av_note');
    ne.parentNode.insertBefore(row,ne.nextSibling); row.parentNode.insertBefore(nt,row.nextSibling);
    return hpAvUi(); }catch(e){ return false; } }
function hpAvAndroid(){ try{ return typeof navigator!=='undefined'&&/Android/i.test(String(navigator.userAgent||'')); }catch(e){ return false; } }
const HP_AV_AND_KEY='hp-av-and-skip';
function hpAvPickGo(inp){ let skip=!hpAvAndroid(); if(!skip){ try{ skip=localStorage.getItem(HP_AV_AND_KEY)==='1'; }catch(e){ skip=false; } } if(skip){ inp.click(); return true; }
  const lb=document.createElement('label'); lb.style.cssText='display:flex;align-items:center;gap:8px;margin-top:12px;cursor:pointer'; const cb=document.createElement('input'); cb.type='checkbox'; cb.id='av-and-skip'; lb.appendChild(cb); lb.appendChild(document.createTextNode(T('av_and_skip')));
  hpAsk({text:T('av_and_back'),node:lb,ok:T('btn_av_pick')}).then(v=>{ if(!v) return; if(cb.checked){ try{ localStorage.setItem(HP_AV_AND_KEY,'1'); }catch(e){} } inp.click(); }).catch(()=>{}); return false; }
try{ if(typeof document!=='undefined'&&document&&document.head&&typeof document.createElement==='function'&&!document.getElementById('hp-av-css')){ const st=document.createElement('style'); st.id='hp-av-css'; st.textContent='.av{overflow:hidden}.av .avimg{width:100%;height:100%;border-radius:50%;object-fit:cover;display:block}.contact-item .ctav{width:36px;height:36px;flex:0 0 36px;border-radius:50%;background:#1b2740;color:var(--teal);display:flex;align-items:center;justify-content:center;font-weight:700}#av-me{cursor:pointer;width:48px;height:48px;flex:0 0 48px;border-radius:50%;background:#1b2740;color:var(--teal);display:flex;align-items:center;justify-content:center;font-weight:700}.av.avbig{width:120px;height:120px;border-radius:50%;background:#1b2740}'; document.head.appendChild(st); } }catch(e){}
try{ if(typeof hpOnMsg==='function'&&!hpOnMsg.__av){ const f=hpOnMsg; hpOnMsg=async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){ o=null; }
    if(o&&o.v===1&&o.type==='avatar'){ if(typeof ID==='undefined'||!ID||r.from===ID.address) return; if(typeof hpBlocked==='function'&&hpBlocked(r.from)){ hpLog('ブロック中の人からのプロフィール写真（捨てた）'); return; } const c=(Array.isArray(ID.contacts)?ID.contacts:[]).find(x=>x.address===r.from); if(!c){ hpLog('知らない人からのプロフィール写真（捨てた）'); return; } if(c.pubKey&&c.pubKey!==r.fromMaster){ hpLog('マスター鍵が連絡先のものと違う '+r.from+'（捨てた）'); return; } await hpAvIn(r.from,o); return; }
    return f.apply(this,arguments); }; Object.assign(hpOnMsg,f,{__av:1}); } }catch(e){}
try{ if(typeof hpSibLetter==='function'&&!hpSibLetter.__av){ const f=hpSibLetter; hpSibLetter=async function(r){ let o=null; try{ o=JSON.parse(r&&r.body); }catch(e){ o=null; } if(o&&o.v===1&&o.type==='sibav'){ await hpAvSibIn(r,o); return true; } return await f.apply(this,arguments); }; Object.assign(hpSibLetter,f,{__av:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setInterval==='function'){ const go=()=>{ try{ hpAvMount(); }catch(e){} }; if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',go); else go(); setInterval(go,5000); setInterval(()=>{ hpAvTick().catch(()=>{}); hpAvSibSend().catch(()=>{}); },60e3); } }catch(e){}

const HP_XQ={act:0,last:0,gap:0,max:2,wait:10e3};
function hpXqWait(){ return new Promise(res=>{ const t0=Date.now(); const go=()=>{ const now=Date.now(); if((HP_XQ.act<HP_XQ.max&&now-HP_XQ.last>=HP_XQ.gap)||now-t0>=HP_XQ.wait){ HP_XQ.act++; HP_XQ.last=now; HP_XQ.gap=300+Math.floor(Math.random()*1200); res(); } else setTimeout(go,100+Math.floor(Math.random()*200)); }; go(); }); }
try{ if(typeof hpXahauSess==='function'&&!hpXahauSess.__xq){ const f=hpXahauSess; hpXahauSess=function(){ const a=arguments, me=this; return hpXqWait().then(()=>f.apply(me,a)).finally(()=>{ HP_XQ.act=Math.max(0,HP_XQ.act-1); }); }; hpXahauSess.__xq=1; } }catch(e){}

const HP_HELP_LINKS=[['h2[data-i18n="pt_move"]',1],['h2[data-i18n="pt_renew"]',3],['h2[data-i18n="pt_spare"]',4],['h2[data-i18n="pt_state"]',11],['h2[data-i18n="dv_title"]',12],['h2[data-i18n="kl_title"]',13],['#rel-title',14]];
function hpHelpGo(n){ try{ if(!hpHelpOpen()) return false; const d=document.querySelector('#p-help details[data-q="'+Number(n)+'"]'); if(!d) return false; d.open=true; try{ d.scrollIntoView({block:'start'}); }catch(e){} return true; }catch(e){ return false; } }
function hpHelpLinks(){ let k=0; try{ if(typeof document==='undefined'||!document||!document.querySelectorAll) return 0; for(const [sel,n] of HP_HELP_LINKS){ for(const h of document.querySelectorAll(sel)){ const p=h.previousElementSibling; if(p&&p.getAttribute&&p.getAttribute('data-hlq')===String(n)) continue; const b=document.createElement('button'); b.type='button'; b.className='b hl-ask'; b.textContent='?'; b.setAttribute('data-hlq',String(n)); b.title=T('btn_chg_help'); b.setAttribute('aria-label',T('btn_chg_help')); b.style.cssText='float:right;min-width:30px;height:30px;padding:0 8px;border-radius:15px;margin:0 0 4px 8px;font-weight:700'; b.onclick=ev=>{ try{ ev.stopPropagation(); }catch(_){} hpHelpGo(n); }; h.parentNode.insertBefore(b,h); k++; } } }catch(e){} return k; }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setInterval==='function'){ const go=()=>{ try{ hpHelpLinks(); }catch(e){} }; if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',go); else go(); setInterval(go,5000); } }catch(e){}

const HP_STALE_KEY='hp_stale_ack', HP_STALE_AGAIN=30*86400e3, HP_DAY_TAPS=3, HP_DAY_TAPWIN=1500;
let HP_REL_DNEXT='', HP_RELL_DATES=new Map(), HP_DAY_TAPAT=[];
function hpRelDMs(s){ const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s||'')); if(!m) return NaN; const y=Number(m[1]), mo=Number(m[2])-1, d=Number(m[3]), t=new Date(y,mo,d); return (t.getFullYear()===y&&t.getMonth()===mo&&t.getDate()===d)?t.getTime():NaN; }
function hpRelDOk(s){ return isFinite(hpRelDMs(s)); }
function hpYmdOf(ms){ const t=new Date(Number(ms)); if(!isFinite(t.getTime())) return ''; return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'); }
function hpRelDate(n){ try{ const R=(typeof HP_REL!=='undefined'&&HP_REL)||{}; if(n&&R.n===n&&hpRelDOk(R.d)) return R.d; const t=HP_RELL_DATES.get(n); return t?hpYmdOf(t):''; }catch(e){ return ''; } }
function hpRelDateStr(s){ const ms=hpRelDMs(s); if(!isFinite(ms)) return ''; const t=new Date(ms), L=(typeof curLang==='function')?curLang():'ja';
  if(L==='ja') return t.getFullYear()+' 年 '+(t.getMonth()+1)+' 月 '+t.getDate()+' 日';
  try{ return new Intl.DateTimeFormat((typeof hpLocale==='function')?hpLocale():'en-US',{year:'numeric',month:'long',day:'numeric'}).format(t); }catch(e){ return String(s); } }
function hpRelStale(now){ try{ const R=(typeof HP_REL!=='undefined'&&HP_REL)||{}; if(!(R.st==='ok'||R.st==='old')||!R.n) return null; const d=hpRelDate(R.n), ms=hpRelDMs(d); if(!isFinite(ms)) return null;
  const a=new Date(ms); a.setFullYear(a.getFullYear()+1); return (Number(now)>=a.getTime())?{n:R.n,d:d}:null; }catch(e){ return null; } }
function hpRelStaleText(s){ return s?TF('rel_stale',{n:s.n,d:hpRelDateStr(s.d)}):''; }
function hpRelStaleAsk(now){ try{ const s=hpRelStale(now); if(!s) return ''; if(typeof ID==='undefined'||!ID) return ''; if(typeof HP_ASK_CUR!=='undefined'&&HP_ASK_CUR) return 'busy'; if(typeof hpAsk!=='function') return '';
    let a=null; try{ a=JSON.parse(localStorage.getItem(HP_STALE_KEY)||'null'); }catch(e){ a=null; } if(a&&a.n===s.n&&Number(now)-Number(a.at)<HP_STALE_AGAIN) return 'later';
    try{ localStorage.setItem(HP_STALE_KEY,JSON.stringify({n:s.n,at:Number(now)})); }catch(e){}
    try{ hpLog('Handpost の版：最後の版（第 '+s.n+' 版・'+s.d+' 公開）から 1 年以上たった'); }catch(e){}
    hpAsk({title:T('stale_title'),text:hpRelStaleText(s),noOk:true,cancel:T('btn_stale_ok'),why:'手入れの知らせ'}).catch(()=>{}); return 'ask'; }catch(e){ return ''; } }
function hpRelStaleUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const st=document.getElementById('rel-state'); if(!st||!st.parentNode) return false;
  let d=document.getElementById('rel-stale'); if(!d){ d=document.createElement('div'); d.id='rel-stale'; d.className='note'; d.style.cssText='margin:4px 0;line-height:1.6;color:var(--amber)'; const r=document.getElementById('rell-state'); const at=(r&&r.parentNode===st.parentNode)?r:st; st.parentNode.insertBefore(d,at.nextSibling); }
  const t=hpRelStaleText(hpRelStale(Date.now())); if(d.textContent!==t) d.textContent=t; d.style.display=t?'':'none'; return true; }catch(e){ return false; } }
function hpChgDates(){ try{ if(typeof document==='undefined'||!document.getElementById) return 0; const w=document.getElementById('rel-chg'); if(!w||!w.children) return 0; let k=0; const ns=new Set(Object.values((typeof HP_CHG_REL!=='undefined'&&HP_CHG_REL)||{}));
  for(const c of Array.from(w.children)){ if(c.getAttribute&&c.getAttribute('data-chgd')) continue; for(const n of ns){ if(c.textContent!==TF('chg_rel_h',{n:n})) continue; const d=hpRelDate(n); if(d){ c.textContent=TF('chg_rel_hd',{n:n,d:hpRelDateStr(d)}); if(c.setAttribute) c.setAttribute('data-chgd','1'); k++; } break; } }
  return k; }catch(e){ return 0; } }
function hpRellDatesFrom(txs, acct, parse){ const out=new Map(); for(const x of (Array.isArray(txs)?txs:[])){ try{ const tx=(x&&(x.tx||x.tx_json))||{}; let ms=NaN;
    if(x&&x.close_time_iso) ms=Date.parse(x.close_time_iso); else if(Number.isFinite(tx.date)) ms=(tx.date+946684800)*1000; if(!isFinite(ms)) continue;
    for(const n of parse([x],acct).keys()){ const was=out.get(n); if(!was||ms<was) out.set(n,ms); } }catch(e){} } return out; }
try{ if(typeof hpRelJson==='function'&&!hpRelJson.__d){ const f=hpRelJson; hpRelJson=async function(p){ const r=await f.apply(this,arguments); try{ if(p==='RELEASE') HP_REL_DNEXT=(r&&hpRelDOk(r.d))?String(r.d):''; }catch(e){} return r; }; Object.assign(hpRelJson,f,{__d:1}); } }catch(e){}
try{ if(typeof hpRelCheck==='function'&&!hpRelCheck.__d){ const f=hpRelCheck; hpRelCheck=async function(){ HP_REL_DNEXT=''; const st=await f.apply(this,arguments);
    try{ if(typeof HP_REL!=='undefined'&&HP_REL&&(HP_REL.st==='ok'||HP_REL.st==='old')&&HP_REL_DNEXT) HP_REL.d=HP_REL_DNEXT; }catch(e){}
    try{ hpRelUi(); }catch(e){} try{ setTimeout(()=>{ hpRelStaleAsk(Date.now()); },20000); }catch(e){} return st; }; Object.assign(hpRelCheck,f,{__d:1}); } }catch(e){}
try{ if(typeof hpRellParse==='function'&&!hpRellParse.__d){ const f=hpRellParse; hpRellParse=function(txs,acct){ const m=f.apply(this,arguments); try{ const D=hpRellDatesFrom(txs,acct,f); if(D.size) HP_RELL_DATES=D; }catch(e){} return m; }; Object.assign(hpRellParse,f,{__d:1}); } }catch(e){}
try{ if(typeof hpRellCheck==='function'&&!hpRellCheck.__d){ const f=hpRellCheck; hpRellCheck=async function(){ const st=await f.apply(this,arguments); try{ hpRelUi(); }catch(e){} try{ hpChgDates(); }catch(e){} return st; }; Object.assign(hpRellCheck,f,{__d:1}); } }catch(e){}
try{ if(typeof hpRelMsg==='function'&&!hpRelMsg.__d){ const f=hpRelMsg; hpRelMsg=function(){ try{ const R=HP_REL, d=(R&&R.st==='ok'&&R.n)?hpRelDate(R.n):''; if(d) return TF('rel_ok_d',{n:R.n,d:hpRelDateStr(d),t:hpRelT()}); }catch(e){} return f.apply(this,arguments); }; Object.assign(hpRelMsg,f,{__d:1}); } }catch(e){}
try{ if(typeof hpRelUi==='function'&&!hpRelUi.__d){ const f=hpRelUi; hpRelUi=function(){ const r=f.apply(this,arguments); try{ hpRelStaleUi(); }catch(e){} return r; }; Object.assign(hpRelUi,f,{__d:1}); } }catch(e){}
try{ if(typeof hpChgLog==='function'&&!hpChgLog.__d){ const f=hpChgLog; hpChgLog=function(){ const r=f.apply(this,arguments); try{ hpChgDates(); }catch(e){} return r; }; Object.assign(hpChgLog,f,{__d:1}); } }catch(e){}
function hpDayTap(sc,now){ try{ if(!sc||sc.id!=='d-rly') return false; if(typeof hpDayOn==='function'&&hpDayOn()) return false; HP_DAY_TAPAT=HP_DAY_TAPAT.filter(t=>now-t<HP_DAY_TAPWIN); HP_DAY_TAPAT.push(now);
  if(HP_DAY_TAPAT.length<HP_DAY_TAPS) return false; HP_DAY_TAPAT=[]; return (typeof hpDayStart==='function')?!!hpDayStart():false; }catch(e){ return false; } }
try{ if(typeof hpBotReact==='function'&&!hpBotReact.__day){ const f=hpBotReact; hpBotReact=function(sc){ try{ const s=sc||((typeof hpBotScene==='function')?hpBotScene():null); if(hpDayTap(s,Date.now())) return 'day'; }catch(e){} return f.apply(this,arguments); }; Object.assign(hpBotReact,f,{__day:1}); } }catch(e){}

function hpHdrFit(){ try{ if(typeof document==='undefined'||!document.getElementById) return 0; const top=document.getElementById('hdr-top'), a=document.getElementById('hdr-actions'), hd=a&&a.parentElement; if(!top||!a||!hd||typeof getComputedStyle!=='function') return 0;
  let r=0; for(const c of Array.from(top.children)){ const cs=getComputedStyle(c); if(cs.display==='none'||cs.visibility==='hidden') continue; const b=c.getBoundingClientRect(); if(b.width>0&&b.right>r) r=b.right; }
  if(!(r>0)){ if(a.style.left) a.style.left=''; return 0; } const L=Math.max(8,Math.round(r-hd.getBoundingClientRect().left+16)); if(a.style.left!==L+'px') a.style.left=L+'px'; return L; }catch(e){ return 0; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof setInterval==='function'){ const go=()=>{ try{ hpHdrFit(); }catch(e){} }; if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',go); else go(); if(window.addEventListener) window.addEventListener('resize',go); setInterval(go,2000); } }catch(e){}

function hpPayEstLook(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const e=document.getElementById('pay-est'); if(!e||e.style.display==='none') return false; const t=String(e.textContent||''); if(!t||(e.getAttribute&&e.getAttribute('data-look')===t)) return false;
  const i=t.indexOf('\n'), hd=i<0?t:t.slice(0,i), rest=i<0?'':t.slice(i+1); e.textContent='';
  const h=document.createElement('div'); h.className='pay-est-v'; h.textContent=hd; h.style.cssText='font-size:16px;font-weight:700;color:var(--teal);line-height:1.5'; e.appendChild(h);
  if(rest){ const n=document.createElement('div'); n.textContent=rest; n.style.cssText='font-size:12px;color:var(--dim);margin-top:4px;line-height:1.6'; e.appendChild(n); }
  e.style.border='1px solid var(--teal)'; e.style.borderRadius='8px'; e.style.padding='10px 12px'; e.style.background='rgba(53,209,183,.08)'; if(e.setAttribute) e.setAttribute('data-look',String(e.textContent||'')); return true; }catch(err){ return false; } }
try{ if(typeof hpPayMonPlus==='function'&&!hpPayMonPlus.__look){ const f=hpPayMonPlus; hpPayMonPlus=function(){ const r=f.apply(this,arguments); try{ hpPayEstLook(); }catch(e){} return r; }; Object.assign(hpPayMonPlus,f,{__look:1}); } }catch(e){}

function hpDlAdmin(){ let k=0; try{ if(typeof document==='undefined'||!document.createElement||typeof hpDevRows!=='function'||typeof hpDlRow!=='function') return 0; const rm=T('dv_role_main'); if(!rm) return 0;
  hpDevRows().forEach((d,i)=>{ try{ if(!d||d.role!=='main') return; const row=hpDlRow(i), nm=row&&row.querySelector?row.querySelector('.nm'):null; if(!nm) return;
    for(const s of Array.from(nm.children||[])){ if(!s||String(s.tagName||'').toUpperCase()!=='SPAN'||s.className) continue; if(s.querySelector&&s.querySelector('.dv-admin')) break; const t=String(s.textContent||''), j=t.indexOf(rm); if(j<0) continue;
      s.textContent=''; if(j>0) s.appendChild(document.createTextNode(t.slice(0,j)));
      const b=document.createElement('button'); b.type='button'; b.className='dv-admin'; b.textContent=T('dv_admin_chip'); b.title=T('dv_admin_tip'); b.setAttribute('aria-label',T('dv_admin_tip'));
      b.style.cssText='display:inline-block;margin:0 2px;padding:0 8px;border:1px solid var(--amber);border-radius:10px;background:rgba(245,184,92,.15);color:var(--amber);font-size:12px;font-weight:700;line-height:1.6;cursor:pointer';
      b.onclick=ev=>{ try{ ev.stopPropagation(); }catch(_){} if(typeof hpHelpGo==='function') hpHelpGo(15); }; s.appendChild(b);
      if(j+rm.length<t.length) s.appendChild(document.createTextNode(t.slice(j+rm.length))); k++; break; } }catch(e){} }); }catch(e){} return k; }
try{ if(typeof hpDlRows==='function'&&!hpDlRows.__adm){ const f=hpDlRows; hpDlRows=function(){ const r=f.apply(this,arguments); try{ hpDlAdmin(); }catch(e){} return r; }; Object.assign(hpDlRows,f,{__adm:1}); } }catch(e){}

const HP_FIT_SZ={l:2*1024,p:150*1024,v:50*1048576};
function hpFitNum(x){ const n=Math.floor(Number(x)||0); if(n<100) return String(n); const p=Math.pow(10,Math.floor(Math.log10(n))-1), r=Math.floor(n/p)*p; try{ return r.toLocaleString((typeof hpLocale==='function')?hpLocale():'ja-JP'); }catch(e){ return String(r); } }
function hpFitText(cap){ const c=Number(cap)||0; if(!(c>0)) return ''; return TF('st_fit',{l:hpFitNum(c/HP_FIT_SZ.l),p:hpFitNum(c/HP_FIT_SZ.p),v:hpFitNum(c/HP_FIT_SZ.v)}); }
function hpStoreFit(cap){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const u=document.getElementById('store-use'); if(!u||!u.parentNode) return false;
  let d=document.getElementById('store-fit'); if(!d){ d=document.createElement('div'); d.id='store-fit'; d.className='note'; d.style.cssText='margin:4px 0;line-height:1.6'; u.parentNode.insertBefore(d,u.nextSibling); }
  const t=hpFitText(cap); if(d.textContent!==t) d.textContent=t; d.style.display=t?'':'none'; return true; }catch(e){ return false; } }
try{ if(typeof hpStoreUi==='function'&&!hpStoreUi.__fit){ const f=hpStoreUi; hpStoreUi=function(){ const r=f.apply(this,arguments); try{ if(typeof hpHUsage==='function') Promise.resolve(hpHUsage()).then(u=>{ hpStoreFit(u&&u.quota?u.cap:0); }).catch(()=>{}); }catch(e){} return r; }; Object.assign(hpStoreUi,f,{__fit:1}); } }catch(e){}

let HP_SWEEP0=null;
function hpStFullWarn(u){ try{ if(!u||!u.cap||u.ratio<1) return false; let st={}; try{ st=JSON.parse(hpHGet('p2p_stwarn')||'{}')||{}; }catch(e){ st={}; } const now=Date.now(); if((Number(st.lv)||0)>=3&&now-(Number(st.at)||0)<86400e3) return false;
  hpHSet('p2p_stwarn',JSON.stringify({lv:3,at:now})); const pct=Math.floor(u.ratio*100); try{ hpHLog('保存容量が '+pct+'%（いっぱい）。帯で知らせた（自動では外さない）'); }catch(e){}
  if(typeof hpBanner==='function') hpBanner(TF('bn_stfull',{pct:pct}),()=>{ try{ if(typeof hpAlSuggest==='function'){ hpAlSuggest(); return; } document.getElementById('t-set').click(); const sc=document.getElementById('store-card'); if(sc&&sc.scrollIntoView) sc.scrollIntoView({block:'start'}); }catch(e){} },'nag'); return true; }catch(e){ return false; } }
try{ if(typeof hpHSweep==='function'&&!hpHSweep.__a){ HP_SWEEP0=hpHSweep; hpHSweep=async function(force){ try{ if(typeof hpHDisk==='function'&&!hpHDisk()) return 0; const u=await hpHUsage(); if(!u||!u.quota) return 0; if(u.ratio>=1) hpStFullWarn(u); else if(typeof hpHWarn==='function') hpHWarn(u); try{ hpStoreUi(); }catch(e){} }catch(e){} return 0; }; Object.assign(hpHSweep,HP_SWEEP0,{__a:1}); } }catch(e){}
try{ if(typeof hpHFullHit==='function'&&!hpHFullHit.__a){ const f=hpHFullHit; hpHFullHit=async function(what){ const now=Date.now(); if(now-HPH_FULL<30000) return false; HPH_FULL=now; try{ hpHLog('この端末の保存容量がいっぱいで '+what+' を書けなかった（写真・ファイルは自動では外さない）'); }catch(e){}
    try{ if(typeof hpBanner==='function') hpBanner(T('bn_quota'),()=>{ try{ if(typeof hpAlSuggest==='function'){ hpAlSuggest(); return; } document.getElementById('t-set').click(); const sc=document.getElementById('store-card'); if(sc&&sc.scrollIntoView) sc.scrollIntoView({block:'start'}); }catch(e){} },'nag'); }catch(e){} return false; }; Object.assign(hpHFullHit,f,{__a:1}); } }catch(e){}

async function hpKeepSizes(){ const m=new Map(); try{ if(typeof hpHDisk!=='function'||!hpHDisk()) return m; const db=await hpBDbOpen(); if(!db) return m; const pre=hpHPre()+'|b';
  await new Promise(res=>{ try{ const tx=db.transaction(HP_B_ST,'readonly'); const q=tx.objectStore(HP_B_ST).openCursor(IDBKeyRange.bound(pre,pre+'￿'));
    q.onsuccess=e=>{ const c=e.target.result; if(!c){ res(); return; } const v=c.value||{}; m.set(String(c.key),Number(v.sz)||((v.c&&v.c.length)||0)); c.continue(); }; q.onerror=()=>res(); }catch(e){ res(); } }); }catch(e){} return m; }
function hpKeepItems(sz){ const L=[]; try{ for(const k of Object.keys(HPH_MEM)){ if(k.indexOf('p2p_chat_')!==0) continue; let h=[]; try{ h=histLoad(k.slice(9)); }catch(e){ h=[]; }
    for(const m of h){ const id=(m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||''; const th=String((m&&m.img&&m.img.thumb)||(m&&m.file&&m.file.thumb)||''); L.push({peer:k.slice(9),o:histOrd(m),id:id,xb:!!m.xb,p:!!m.p,kp:!!m.kp,txt:m.d==='s'||m.d==='p',sz:id?(sz.get(hpBName(id))||0):0,th:/^data:image\//.test(th)?th:'',nm:String((m&&m.file&&m.file.name)||''),vid:/^video\//.test(String((m&&m.file&&m.file.mime)||''))}); } } }catch(e){} return L; }
function hpKeepCalc(L,k,d,now){ const cut=d?now-d*864e5:0, r={n:0,m:0,s:0,a:0,z:0,cut:cut}; if(!cut) return r; const lo=o=>{ if(!r.a||o<r.a) r.a=o; if(!r.z||o>r.z) r.z=o; };
  r.list=[]; for(const x of L){ if(x.p||x.kp||!(x.o<cut)) continue; if(k==='b'){ if(x.id&&!x.xb){ r.n++; r.s+=x.sz; lo(x.o); r.list.push(x); } } else { if(x.txt){ r.n++; lo(x.o); } if(x.id&&!x.xb){ r.m++; r.s+=x.sz; r.list.push(x); } } }
  r.list.sort((p,q)=>p.o-q.o);
  return r; }
function hpKeepNow(L){ const r={n:0,s:0,a:0,z:0}; for(const x of L){ if(!x.id||x.xb) continue; r.n++; r.s+=x.sz; if(!r.a||x.o<r.a) r.a=x.o; if(!r.z||x.o>r.z) r.z=x.o; } return r; }
function hpKeepDay(ms){ return hpRelDateStr(hpYmdOf(ms)); }
function hpKeepThumbs(list){ try{ if(!list||!list.length||typeof document==='undefined'||!document.createElement) return null; const MAX=120, w=document.createElement('div'); w.id='kp-thumbs'; w.style.cssText='margin-top:10px';
  const h=document.createElement('div'); h.className='note'; h.textContent=TF('kp_th_head',{n:list.length}); w.appendChild(h);
  const g=document.createElement('div'); g.style.cssText='display:flex;flex-wrap:wrap;gap:4px;max-height:45vh;overflow:auto;margin-top:6px'; w.appendChild(g);
  for(const x of list.slice(0,MAX)){ const t=document.createElement('div'); t.title=hpKeepDay(x.o)+(x.nm?' '+x.nm:''); t.style.cssText='position:relative;width:64px;height:64px;border-radius:6px;overflow:hidden;background:#17233c;flex:none;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--dim);text-align:center;word-break:break-all';
    if(x.th){ const im=document.createElement('img'); im.src=x.th; im.alt=''; im.style.cssText='width:100%;height:100%;object-fit:cover'; t.appendChild(im); } else t.textContent=(x.vid?'\u{1F3AC} ':'\u{1F4C4} ')+String(x.nm||'').slice(0,18);
    if(x.vid&&x.th){ const v=document.createElement('span'); v.textContent='\u25B6'; v.style.cssText='position:absolute;right:3px;bottom:2px;color:#fff;font-size:12px;text-shadow:0 0 3px #000'; t.appendChild(v); }
    g.appendChild(t); }
  if(list.length>MAX){ const m=document.createElement('div'); m.className='note'; m.textContent=TF('kp_th_more',{n:list.length-MAX}); w.appendChild(m); }
  return w; }catch(e){ return null; } }
async function hpKeepStat(){ const sz=await hpKeepSizes(); return hpKeepItems(sz); }
async function hpKeepDropList(list){ try{ const by=new Map(); for(const x of list){ if(!x||!x.id||!x.peer) continue; if(!by.has(x.peer)) by.set(x.peer,new Set()); by.get(x.peer).add(x.id); } const ids=new Set(); let n=0;
  for(const [peer,set] of by){ const h=histLoad(peer); let ch=false; for(const m of h){ const id=(m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||''; if(id&&set.has(id)&&!m.xb&&!m.p){ m.xb=1; m.tr=Date.now(); ch=true; n++; ids.add(id); } else if(id&&set.has(id)&&m.xb&&!m.tr&&!m.p){ m.tr=Date.now(); m.tx=1; ch=true; n++; } } if(ch) histSave(peer,h); }
  try{ hpHLog('写真・ファイルの本体 '+n+' 件を最近削除した項目へ移した（30 日後に削除。保存期間は変えていない）'); }catch(e){} try{ if(typeof convDirty==='function') convDirty(); }catch(e){} return n; }catch(e){ return 0; } }
async function hpKeepView(dd){ try{ const L=await hpKeepStat(), r=hpKeepCalc(L,'b',dd,Date.now()); if(!r.n) return 0; const p=hpKeepLabel(dd);
  const ok=await hpAsk({title:TF('kp_view_title',{p:p,n:r.n,s:hpHMB(r.s)}),text:TF('kp_view_txt',{a:hpKeepDay(r.a),z:hpKeepDay(r.z),x:T('btn_store_save')})+'\n'+T('kp_trash_note'),node:hpKeepThumbs(r.list)||undefined,ok:TF('btn_kp_drop',{n:r.n}),cancel:T('btn_kp_close'),danger:true});
  if(!ok) return 0; const n=await hpKeepDropList(r.list); try{ const m=document.getElementById('kp-msg'); if(m) m.textContent=TF('kp_view_done',{n:n}); }catch(e){} try{ hpStoreUi(); }catch(e){} try{ hpKeepPreview().catch(()=>{}); }catch(e){} return n; }catch(e){ return 0; } }
async function hpKeepPreview(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const L=await hpKeepStat(), now=Date.now();
  for(const k of ['t','b']){ const s=document.getElementById('kp-'+k); if(!s||!s.parentNode) continue; let d=document.getElementById('kp-pre-'+k);
    if(!d){ d=document.createElement('div'); d.id='kp-pre-'+k; d.className='note'; d.style.cssText='margin:4px 0 8px;line-height:1.8'; s.parentNode.insertBefore(d,s.nextSibling); }
    const rows=[]; if(k==='b'){ const N=hpKeepNow(L); if(N.n) rows.push([TF('kp_pre_now',{a:hpKeepDay(N.a),z:hpKeepDay(N.z),n:N.n,s:hpHMB(N.s)}),null]); }
    for(const dd of (k==='b'?HP_KEEP_B:HP_KEEP_T)){ if(!dd) continue; const r=hpKeepCalc(L,k,dd,now), p=hpKeepLabel(dd);
      if(k==='b') rows.push(r.n?[TF('kp_pre_bp',{p:p}),{dd:dd,t:TF('kp_pre_bn',{n:r.n,s:hpHMB(r.s)}),z:TF('kp_pre_bz',{a:hpKeepDay(r.a),z:hpKeepDay(r.z)})}]:[TF('kp_pre_none',{p:p}),null]);
      else rows.push([r.n?TF('kp_pre_tline',{p:p,a:hpKeepDay(r.a),z:hpKeepDay(r.z),n:r.n,m:r.m,s:hpHMB(r.s)}):TF('kp_pre_tnone',{p:p}),null]); }
    const key=JSON.stringify(rows.map(x=>[x[0],x[1]&&x[1].t,x[1]&&x[1].z])); if(d.getAttribute&&d.getAttribute('data-k')===key) continue; if(d.setAttribute) d.setAttribute('data-k',key); d.textContent='';
    for(const [t,lk] of rows){ const line=document.createElement('div'); line.appendChild(document.createTextNode(t));
      if(lk){ const a=document.createElement('button'); a.type='button'; a.className='kp-view'; a.textContent=lk.t; a.style.cssText='background:none;border:0;padding:0;margin:0 2px;color:var(--teal);text-decoration:underline;cursor:pointer;font:inherit'; a.onclick=()=>{ hpKeepView(lk.dd).catch(()=>{}); }; line.appendChild(a); line.appendChild(document.createTextNode(lk.z)); }
      d.appendChild(line); } }
  return true; }catch(e){ return false; } }
try{ if(typeof hpKeepUi==='function'&&!hpKeepUi.__pre){ const f=hpKeepUi; hpKeepUi=function(){ const r=f.apply(this,arguments); try{ hpKeepPreview().catch(()=>{}); }catch(e){} return r; }; Object.assign(hpKeepUi,f,{__pre:1}); } }catch(e){}
try{ if(typeof hpKeepPick==='function'&&!hpKeepPick.__pre){ const f0=hpKeepPick; hpKeepPick=async function(k,v){
    const key=k==='b'?'p2p_keep_b':'p2p_keep_t', old=hpKeepDays(k), msg=t=>{ const m=document.getElementById('kp-msg'); if(m) m.textContent=t||''; }, back=()=>{ hpHSet(key,String(old)); try{ hpKeepUi(); }catch(e){} msg(''); return false; };
    const L=await hpKeepStat(), r=hpKeepCalc(L,k,v,Date.now()), p=hpKeepLabel(v), x=T('btn_store_save');
    if(!r.n&&!(k==='t'&&r.m)){ if(!old&&v){ let ok0=false; try{ ok0=await hpAsk({text:T('cf_keep_first')}); }catch(e){ ok0=false; } if(!ok0) return back(); } hpHSet(key,String(v)); msg(v?T('kp_none'):''); }
    else { const txt=k==='b'?TF('cf_keep_b2',{p:p,a:hpKeepDay(r.a),z:hpKeepDay(r.z),n:r.n,s:hpHMB(r.s),x:x}):TF('cf_keep_t2',{p:p,a:hpKeepDay(r.a),z:hpKeepDay(r.z),n:r.n,m:r.m,s:hpHMB(r.s),x:x});
      let ok=false; try{ ok=await hpAsk({text:txt+(k==='b'?'\n'+T('kp_trash_note'):''),node:hpKeepThumbs(r.list)||undefined}); }catch(e){ ok=false; } if(!ok) return back();
      hpHSet(key,String(v)); const rr=await hpKeepRun(false); msg(TF('kp_done',{t:rr.t,b:rr.b})); }
    try{ hpHLog('保存期間を変えた：'+(k==='b'?'写真・ファイルの本体':'手紙（文字）')+' '+(v?v+' 日':'無期限')); }catch(e){}
    try{ hpStoreUi(); }catch(e){} try{ hpKeepPreview().catch(()=>{}); }catch(e){} return true; }; Object.assign(hpKeepPick,f0,{__pre:1}); } }catch(e){}

function hpIosBrowser(){ try{ if(typeof window==='undefined'||typeof navigator==='undefined') return false; if(!(typeof hpIsIOS==='function'&&hpIsIOS())) return false;
  if(navigator.standalone===true) return false; try{ if(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches) return false; }catch(e){} return true; }catch(e){ return false; } }
function hpIosHomeGate(){ try{ if(!hpIosBrowser()||typeof document==='undefined'||!document.body) return false; if(document.getElementById('hp-ios-home')) return true;
  const w=document.createElement('div'); w.id='hp-ios-home'; w.setAttribute('role','dialog'); w.style.cssText='position:fixed;inset:0;z-index:99999;background:var(--bg,#0b1220);color:var(--ink,#e6edf6);overflow:auto;padding:calc(env(safe-area-inset-top,0px) + 32px) 22px 32px;line-height:1.7';
  const h=document.createElement('h2'); h.textContent=T('ios_home_title'); h.style.cssText='margin:0 0 14px;font-size:20px'; w.appendChild(h);
  const ol=document.createElement('ol'); ol.style.cssText='margin:0 0 16px;padding-left:1.4em;font-size:16px'; for(const k of ['ios_home_s1','ios_home_s2','ios_home_s3','ios_home_s4']){ const li=document.createElement('li'); li.textContent=T(k); li.style.margin='0 0 8px'; ol.appendChild(li); } w.appendChild(ol);
  const p=document.createElement('div'); p.className='note'; p.textContent=T('ios_home_why'); p.style.cssText='font-size:14px;color:var(--dim,#8fa3b8)'; w.appendChild(p);
  document.body.appendChild(w); try{ hpLog('iPhone・iPad のブラウザで開かれたので、ホーム画面に追加する手順を出した'); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document){ const go=()=>{ try{ hpIosHomeGate(); }catch(e){} }; if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',go); else go(); } }catch(e){}

const HP_AL_SEL='background:#1b2740;border:none;border-radius:6px;color:inherit;padding:6px 8px;font-size:14px';
const HP_AL_BIG=5*1048576, HP_AL_PAGE=120; let HP_AL={sort:'new',peer:'',big:false,selm:false,sel:new Set(),n:HP_AL_PAGE,busy:false,yr:0,cur:[],trash:false};
async function hpAlItems(){ const sz=(typeof hpKeepSizes==='function')?await hpKeepSizes():new Map(), L=[]; try{ for(const k of Object.keys(HPH_MEM)){ if(k.indexOf('p2p_chat_')!==0) continue; const peer=k.slice(9); let h=[]; try{ h=histLoad(peer); }catch(e){ h=[]; }
    for(const m of h){ const id=(m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||''; if(!id||m.ah) continue; const th=String((m.img&&m.img.thumb)||(m.file&&m.file.thumb)||'');
      L.push({peer:peer,o:histOrd(m),ts:Number(m.ts)||0,id:id,rec:m,sz:sz.get(hpBName(id))||Number((m.file&&m.file.size)||(m.img&&m.img.size))||0,th:/^data:image\//.test(th)?th:'',nm:String((m.file&&m.file.name)||''),vid:/^video\//.test(String((m.file&&m.file.mime)||'')),img:!!m.img,xb:!!m.xb||(typeof hpAlNoBody==='function'&&hpAlNoBody(id,sz)),tr:Number(m.tr)||0,sv:Number(m.sv)||0,p:!!m.p,kp:!!m.kp,risk:!!(m.file&&m.file.risk)}); } } }catch(e){} return L; }
function hpAlFilter(L,S,cut){ let a=L.filter(x=>(!S.peer||x.peer===S.peer)&&(!S.big||x.sz>HP_AL_BIG)); for(const x of a) x.due=!!(cut&&!x.xb&&!x.p&&!x.kp&&x.o<cut);
  a.sort(S.sort==='big'?((p,q)=>q.sz-p.sz||q.o-p.o):((p,q)=>q.o-p.o)); return a; }
function hpAlMonth(ms){ const t=new Date(Number(ms)), L=(typeof curLang==='function')?curLang():'ja'; if(L==='ja') return t.getFullYear()+' 年 '+(t.getMonth()+1)+' 月';
  try{ return new Intl.DateTimeFormat((typeof hpLocale==='function')?hpLocale():'en-US',{year:'numeric',month:'long'}).format(t); }catch(e){ return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0'); } }
function hpAlSum(a){ let s=0; for(const x of a) if(!x.xb) s+=x.sz; return s; }
async function hpAlBlob(x){ let b=null; try{ b=await blobGet(x.id); }catch(e){ b=null; } if(!b&&typeof sibFetchBlob==='function'){ try{ b=await sibFetchBlob(x.id); }catch(e){ b=null; } } return b; }
function hpAlName(x,b){ return x.nm?((typeof hpFileName==='function')?hpFileName(x.nm):x.nm):('handpost-'+hpStamp(x.ts||Date.now())+'.'+((typeof hpImgExt==='function')?hpImgExt((b&&b.type)||(x.rec.img&&x.rec.img.mime)):'jpg')); }
async function hpAlSave(list){ try{ const ok=list.filter(x=>!x.risk); if(!ok.length) return 0; const got=[]; for(const x of ok){ const b=await hpAlBlob(x); if(b) got.push([x,b]); } if(!got.length){ try{ hpToast(T('al_none_body'),3600); }catch(e){} return 0; }
    if(typeof hpIsIOS==='function'&&hpIsIOS()&&typeof navigator!=='undefined'&&navigator.canShare&&navigator.share){ try{ const fs=got.map(([x,b])=>new File([b],hpAlName(x,b),{type:b.type||'application/octet-stream'})); if(navigator.canShare({files:fs})){ await navigator.share({files:fs}); return fs.length; } }catch(e){ if(e&&e.name==='AbortError') return 0; } }
    if(got.length===1){ const [x,b]=got[0]; return (await hpBlobDownload(b,hpAlName(x,b)))?1:0; }
    const files=[], used={}; for(const [x,b] of got){ const dir=hpZipSafe((typeof nickOf==='function')?nickOf(x.peer):x.peer.slice(0,12)); let base=hpZipSafe(hpAlName(x,b)), nm=dir+'/'+base, i=2; while(used[nm]){ const dot=base.lastIndexOf('.'); nm=dir+'/'+(dot>0?base.slice(0,dot)+'-'+i+base.slice(dot):base+'-'+i); i++; } used[nm]=1; files.push({name:nm,data:new Uint8Array(await b.arrayBuffer()),ts:x.ts}); }
    const okz=await hpBlobDownload(new Blob([hpZip(files)],{type:'application/zip'}),'handpost-'+hpStamp(Date.now())+'.zip'); return okz?files.length:0; }catch(e){ try{ hpLog('アルバムから保存できなかった：'+e.message); }catch(_){} return 0; } }
async function hpAlKeep(list,on){ try{ const by=new Map(); for(const x of list){ if(!by.has(x.peer)) by.set(x.peer,new Set()); by.get(x.peer).add(x.id); } let n=0;
  for(const [peer,set] of by){ const h=histLoad(peer); let ch=false; for(const m of h){ const id=(m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||''; if(id&&set.has(id)&&!!m.kp!==!!on){ if(on) m.kp=1; else delete m.kp; ch=true; n++; } } if(ch) histSave(peer,h); }
  try{ hpLog('アルバム：'+n+' 件の「残す」を'+(on?'付けた':'外した')); }catch(e){} return n; }catch(e){ return 0; } }

function hpAlOpen(){ try{ const b=document.getElementById('t-album'), s=document.getElementById('p-album'); if(!b||!s) return false;
  document.querySelectorAll('nav button').forEach(x=>x.classList.remove('on')); document.querySelectorAll('main section').forEach(x=>x.classList.remove('on'));
  b.classList.add('on'); s.classList.add('on'); HP_AL.selm=false; HP_AL.sel.clear(); HP_AL.n=HP_AL_PAGE; HP_AL.yr=0; HP_AL.trash=false; hpAlUi();
  try{ if(typeof stopScan==='function') stopScan(); }catch(e){} try{ if(typeof hpCsRefresh==='function') hpCsRefresh(); }catch(e){}
  try{ menuClose(); homeToggle(true); menuBadge(); }catch(e){} try{ if(typeof window!=='undefined'&&window.scrollTo) window.scrollTo(0,0); }catch(e){} return true; }catch(e){ return false; } }
function hpAlMount(){ try{ if(typeof document==='undefined'||!document||!document.getElementById||!document.querySelector) return ''; if(document.getElementById('t-album')) return 'have';
  const nav=document.querySelector('nav'), main=document.querySelector('main'); if(!nav||!main) return '';
  const after=document.getElementById('t-req')||document.getElementById('t-contacts'), b=document.createElement('button'); b.id='t-album'; b.type='button'; b.setAttribute('data-i18n','tab_album'); b.textContent=T('tab_album'); b.onclick=()=>{ hpAlOpen(); };
  if(after&&after.parentNode===nav) nav.insertBefore(b,after.nextSibling); else nav.insertBefore(b,nav.firstChild);
  const s=document.createElement('section'); s.id='p-album'; main.appendChild(s); return 'made'; }catch(e){ return ''; } }
try{ if(typeof document!=='undefined'&&document&&document.getElementById){ if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',()=>{ hpAlMount(); }); else hpAlMount(); } }catch(e){}

const HP_AL_LP=450, HP_AL_CSS='#p-album.selm{padding-bottom:150px}#p-album .al-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;text-align:left}#p-album .al-h h2{margin:0;flex:1 1 auto}#p-album .al-g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2px;margin:0 -12px 4px}@media (min-width:700px){#p-album .al-g{grid-template-columns:repeat(auto-fill,minmax(140px,1fr))}}'
  +'#p-album .al-t{position:relative;aspect-ratio:1/1;max-width:100%;overflow:hidden;background:#17233c;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--dim);text-align:center;word-break:break-all;cursor:pointer;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;touch-action:manipulation}#p-album .al-t img{width:100%;height:100%;object-fit:cover;pointer-events:none;transition:transform .12s}#p-album .al-t.sel img{transform:scale(.86);border-radius:6px}#p-album .al-t:focus-visible{outline:2px solid var(--teal);outline-offset:-2px}'
  +'#p-album .al-k{display:none;position:absolute;right:5px;top:5px;width:20px;height:20px;border:2px solid #fff;border-radius:50%;background:rgba(0,0,0,.3);box-sizing:border-box;color:#06221d;font-size:12px;line-height:16px;text-align:center;font-weight:700}#p-album.selm .al-k{display:block}#p-album .al-t.sel .al-k{background:var(--teal);border-color:var(--teal)}'
  +'#p-album .al-yrs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:6px}#p-album .al-yr{position:relative;aspect-ratio:1/1;max-width:100%;border-radius:12px;overflow:hidden;border:0;padding:0;background:#17233c;color:#fff;cursor:pointer}#p-album .al-yr img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}#p-album .al-yr i{position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.08),rgba(0,0,0,.5))}#p-album .al-yr b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:30px;letter-spacing:.04em;text-shadow:0 1px 6px rgba(0,0,0,.5)}#p-album .al-yr small{position:absolute;left:10px;bottom:8px;font-size:12px}'
  +'#p-album .al-d{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin:12px 0 6px;font-weight:700;color:var(--ink);text-align:left}#p-album .al-d span{font-weight:400;font-size:12px;color:var(--dim)}#p-album .al-chips{display:flex;gap:6px;overflow-x:auto;padding:4px 0 6px}#p-album .al-chip{flex:0 0 auto;border:1px solid var(--line);background:none;color:var(--ink);border-radius:999px;padding:5px 12px;font-size:13px;cursor:pointer}#p-album .al-chip.on{background:var(--teal);border-color:var(--teal);color:#06221d}#p-album .al-ft{margin-top:10px;text-align:left}'
  +'#al-bar{position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--panel);border-top:1px solid var(--line);padding:8px max(12px,env(safe-area-inset-right,0px)) calc(10px + env(safe-area-inset-bottom,0px)) max(12px,env(safe-area-inset-left,0px));display:flex;flex-wrap:wrap;gap:6px;align-items:center}#al-bar .al-n{flex:1 1 100%;font-size:13px;color:var(--ink);text-align:left}'
  +'#hp-al-view{position:fixed;inset:0;z-index:60;background:#000;display:flex;flex-direction:column;color:#fff}#hp-al-view .av-top,#hp-al-view .av-bot{display:flex;align-items:center;gap:10px;padding:10px max(14px,env(safe-area-inset-right,0px)) 10px max(14px,env(safe-area-inset-left,0px))}#hp-al-view .av-top{padding-top:calc(env(safe-area-inset-top,0px) + 10px)}#hp-al-view .av-bot{padding-bottom:calc(env(safe-area-inset-bottom,0px) + 12px);font-size:13px}#hp-al-view .av-st{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;touch-action:none}#hp-al-view .av-st img{width:100%;height:100%;object-fit:contain}#hp-al-view .av-st video{max-width:100%;max-height:100%}#hp-al-view button{border:0;background:#17233c;color:#fff;border-radius:20px;min-width:40px;height:40px;white-space:nowrap;flex:0 0 auto;font-size:16px;padding:0 12px;cursor:pointer}#hp-al-view .av-nv{position:absolute;top:50%;transform:translateY(-50%);opacity:.8}#hp-al-view .av-t{flex:1 1 auto;min-width:0;font-size:14px}#hp-al-view .av-f{flex:1 1 auto;min-width:0;opacity:.85}';
function hpAlCss(){ try{ if(typeof document==='undefined'||!document.getElementById||document.getElementById('hp-al-css')) return; const s=document.createElement('style'); s.id='hp-al-css'; s.textContent=HP_AL_CSS; (document.head||document.body).appendChild(s); }catch(e){} }
function hpAlYear(ms){ return new Date(Number(ms)).getFullYear(); }
function hpAlDayKey(ms){ const t=new Date(Number(ms)); return t.getFullYear()+'-'+t.getMonth()+'-'+t.getDate(); }
function hpAlDayText(ms){ const t=new Date(Number(ms)), L=(typeof curLang==='function')?curLang():'ja'; if(L==='ja') return t.getFullYear()+' 年 '+(t.getMonth()+1)+' 月 '+t.getDate()+' 日（'+'日月火水木金土'[t.getDay()]+'）';
  try{ return new Intl.DateTimeFormat((typeof hpLocale==='function')?hpLocale():'en-US',{year:'numeric',month:'long',day:'numeric',weekday:'short'}).format(t); }catch(e){ return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0'); } }
function hpAlYears(A){ const m=new Map(); for(const x of A){ const y=hpAlYear(x.o); if(!m.has(y)) m.set(y,{y:y,n:0,cover:null}); const r=m.get(y); r.n++; if(!r.cover&&x.th&&!x.vid&&!x.xb) r.cover=x; }
  for(const r of m.values()) if(!r.cover) r.cover=A.find(x=>hpAlYear(x.o)===r.y&&x.th)||null; return [...m.values()].sort((p,q)=>q.y-p.y); }
function hpAlDays(A){ const out=[], at=new Map(); for(const x of A){ const k=hpAlDayKey(x.o); if(!at.has(k)){ at.set(k,out.length); out.push({k:k,o:x.o,list:[]}); } out[at.get(k)].list.push(x); } return out; }
function hpAlFrom(x){ const d=x&&x.rec&&x.rec.d; return (d==='s'||d==='p')?T('al_from_me'):TF('al_from',{name:(typeof nickOf==='function')?nickOf(x.peer):String(x.peer).slice(0,12)}); }
function hpAlPress(el,onTap,onLong){ let t=0, sx=0, sy=0, long=false; const clr=()=>{ if(t){ clearTimeout(t); t=0; } };
  el.addEventListener('pointerdown',e=>{ long=false; sx=e.clientX; sy=e.clientY; clr(); t=setTimeout(()=>{ t=0; long=true; try{ if(navigator.vibrate) navigator.vibrate(15); }catch(_){} onLong(); },HP_AL_LP); });
  el.addEventListener('pointermove',e=>{ if(t&&(Math.abs(e.clientX-sx)>10||Math.abs(e.clientY-sy)>10)) clr(); });
  for(const k of ['pointerup','pointercancel','pointerleave']) el.addEventListener(k,clr);
  el.addEventListener('contextmenu',e=>{ try{ e.preventDefault(); }catch(_){} });
  el.addEventListener('click',()=>{ if(long){ long=false; return; } onTap(); }); }
function hpAlSelBtn(){ try{ const b=document.getElementById('al-selb'); if(b) b.textContent=HP_AL.selm?T('btn_al_unsel'):T('btn_al_sel'); }catch(e){} }
function hpAlSelOn(){ HP_AL.selm=true; try{ const s=document.getElementById('p-album'); if(s) s.classList.add('selm'); }catch(e){} hpAlSelBtn(); hpAlBar(); }
function hpAlSelOff(){ HP_AL.selm=false; HP_AL.free=false; HP_AL.sel.clear(); try{ const s=document.getElementById('p-album'); if(s){ s.classList.remove('selm'); s.querySelectorAll('.al-t.sel').forEach(t=>t.classList.remove('sel')); s.querySelectorAll('.al-k').forEach(k=>{ k.textContent=''; }); } }catch(e){} hpAlSelBtn(); hpAlBar(); }
function hpAlToggle(x,t){ if(HP_AL.sel.has(x.id)) HP_AL.sel.delete(x.id); else HP_AL.sel.add(x.id); try{ const on=HP_AL.sel.has(x.id); t.classList.toggle('sel',on); const k=t.querySelector('.al-k'); if(k) k.textContent=on?'✓':''; }catch(e){} hpAlBar(); }
function hpAlBar(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const s=document.getElementById('p-album'); if(!s) return false; let bar=document.getElementById('al-bar');
  if(!HP_AL.selm){ if(bar) bar.remove(); return false; } if(!bar){ bar=document.createElement('div'); bar.id='al-bar'; s.appendChild(bar); } bar.textContent='';
  const A=HP_AL.cur||[], pick=()=>A.filter(x=>HP_AL.sel.has(x.id)), n=HP_AL.sel.size;
  const c=document.createElement('div'); c.className='al-n'; c.textContent=TF('al_sel_n',{n:n,s:hpHMB(hpAlSum(pick()))}); bar.appendChild(c);
  const B=(t,f,cls)=>{ const b=document.createElement('button'); b.type='button'; b.className='b'+(cls?' '+cls:''); b.textContent=t; b.onclick=f; bar.appendChild(b); return b; };
  const done=()=>{ hpAlSelOff(); hpAlUi(); };
  const bs=B(TF((typeof hpIsIOS==='function'&&hpIsIOS())?'btn_al_save_ios':'btn_al_save',{n:n}),async()=>{ if(HP_AL.busy) return; HP_AL.busy=true; try{ const k=await hpAlSave(pick()); if(k){ try{ hpToast(TF('al_done_save',{n:k}),2400); }catch(e){} done(); } }finally{ HP_AL.busy=false; } });
  const kOn=hpAlKeepOn(), bk=kOn?B(TF('btn_al_keep',{n:n}),async()=>{ const k=await hpAlKeep(pick(),true); try{ hpToast(TF('al_done_keep',{n:k}),3000); }catch(e){} done(); }):null;
  const bu=kOn?B(TF('btn_al_unkeep',{n:n}),async()=>{ const k=await hpAlKeep(pick(),false); try{ hpToast(TF('al_done_unkeep',{n:k}),3000); }catch(e){} done(); }):null;
  const bd=B(TF('btn_al_del',{n:n}),async()=>{ const list=pick().filter(x=>!x.p); if(!list.length) return; const ok=await hpAsk({title:TF('btn_al_del',{n:list.length}),text:(HP_AL.free?TF('cf_al_free',{n:list.length,s:hpHMB(hpAlSum(list))}):TF('cf_al_del',{n:list.length,s:hpHMB(hpAlSum(list)),x:T('btn_store_save')})),ok:TF('btn_kp_drop',{n:list.length}),danger:true});
    if(!ok) return; const fr=!!HP_AL.free; const k=await hpKeepDropList(list); if(fr&&typeof hpTrPurge==='function'){ try{ await hpTrPurge(list); }catch(e){} } try{ hpToast(TF(fr?'al_done_free':'al_done_del',{n:k}),3000); }catch(e){} try{ hpStoreUi(); }catch(e){} done(); },'danger');
  const nxb=pick().filter(x=>x.xb).length; if(nxb) B(TF('btn_al_fetch',{n:nxb}),async()=>{ if(HP_AL.busy) return; HP_AL.busy=true; try{ const q=await hpAlFetch(pick()); try{ const s=(typeof hpAlfMsg==='function')?hpAlfMsg(q):''; if(s) hpToast(s,(q.ng||q.nolink)?9000:3000); }catch(e){} }finally{ HP_AL.busy=false; } done(); }); for(const b of [bs,bk,bu,bd]) if(b) b.disabled=!n; B(T('btn_al_unsel'),()=>{ hpAlSelOff(); }); return true; }catch(e){ return false; } }
function hpAlCover(img,x){ (async()=>{ try{ if(!x||x.vid||x.xb||typeof blobGet!=='function') return; const b=await blobGet(x.id); if(!b||!/^image\//.test(b.type||'')) return; const u=URL.createObjectURL(b);
  img.onerror=()=>{ img.onerror=null; if(x.th) img.src=x.th; }; img.onload=()=>{ setTimeout(()=>{ try{ URL.revokeObjectURL(u); }catch(e){} },2000); }; img.src=u; }catch(e){} })(); }
function hpAlTile(x,A){ const t=document.createElement('div'); const sel=HP_AL.sel.has(x.id); t.className='al-t'+(sel?' sel':''); t.setAttribute('data-id',x.id); t.setAttribute('role','button'); t.tabIndex=0; if(x.xb) t.style.opacity='.45';
  if(x.th){ const im=document.createElement('img'); im.src=x.th; im.alt=''; im.loading='lazy'; t.appendChild(im); } else t.textContent=(x.vid?'\u{1F3AC} ':'\u{1F4C4} ')+String(x.nm||'').slice(0,24);
  const tag=(txt,css)=>{ const s=document.createElement('span'); s.textContent=txt; s.style.cssText='position:absolute;font-size:10px;line-height:1.4;padding:0 4px;border-radius:4px;'+css; t.appendChild(s); };
  if(x.vid) tag('▶','left:4px;bottom:3px;color:#fff;font-size:13px;text-shadow:0 0 3px #000');
  if(x.sv) tag('✓ '+T('al_tag_saved'),'right:3px;bottom:3px;background:rgba(0,0,0,.6);color:#35d1b7'); if(HP_AL.sort==='big'&&x.sz) tag(hpHMB(x.sz),'right:3px;bottom:'+(x.sv?'20px':'3px')+';background:rgba(0,0,0,.55);color:#fff');
  if(x.kp&&hpAlKeepOn()) tag('★ '+T('al_tag_keep'),'left:3px;top:3px;background:rgba(53,209,183,.85);color:#06221d');
  else if(x.due) tag(T('al_tag_due'),'left:3px;top:3px;background:rgba(245,184,92,.9);color:#2a1a00');
  if(x.xb) tag(T('al_nobody'),'right:3px;top:3px;background:rgba(0,0,0,.6);color:#fff');
  const k=document.createElement('span'); k.className='al-k'; k.textContent=sel?'✓':''; t.appendChild(k);
  hpAlPress(t,()=>{ if(HP_AL.selm) hpAlToggle(x,t); else hpAlView(A,A.indexOf(x)); },()=>{ if(!HP_AL.selm) hpAlSelOn(); if(!HP_AL.sel.has(x.id)) hpAlToggle(x,t); });
  t.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ try{ e.preventDefault(); }catch(_){} t.click(); } };
  return t; }
function hpAlView(A,i){ try{ if(typeof document==='undefined'||!A||!A.length) return false; const old=document.getElementById('hp-al-view'); if(old) old.remove(); hpAlCss();
  const mk=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
  const w=mk('div'); w.id='hp-al-view'; w.setAttribute('role','dialog'); w.setAttribute('aria-modal','true');
  const top=mk('div','av-top'), cl=mk('button','','✕'), tt=mk('div','av-t'); cl.type='button'; cl.setAttribute('aria-label',T('btn_kp_close')); top.appendChild(cl); top.appendChild(tt);
  const st=mk('div','av-st'), pv=mk('button','av-nv','‹'), nx=mk('button','av-nv','›'); pv.type='button'; nx.type='button'; pv.style.left='8px'; nx.style.right='8px'; pv.setAttribute('aria-label',T('nv_prev')); nx.setAttribute('aria-label',T('nv_next'));
  const bot=mk('div','av-bot'), fr=mk('div','av-f'), sv=mk('button','',(typeof hpIsIOS==='function'&&hpIsIOS())?T('btn_al_save1_ios'):T('btn_al_save1')); sv.type='button'; bot.appendChild(fr); bot.appendChild(sv);
  w.appendChild(top); w.appendChild(st); w.appendChild(bot); document.body.appendChild(w);
  let k=Math.max(0,Math.min(A.length-1,Number(i)||0)), url='', media=null, gen=0;
  const drop=()=>{ try{ if(media&&media.pause) media.pause(); }catch(e){} media=null; if(url){ const u=url; setTimeout(()=>{ try{ URL.revokeObjectURL(u); }catch(e){} },1000); url=''; } };
  const put=el=>{ st.textContent=''; if(el) st.appendChild(el); st.appendChild(pv); st.appendChild(nx); };
  const show=async()=>{ drop(); const my=++gen, x=A[k]; try{ const ob=bot.querySelector('.av-fetch'); if(ob) ob.remove(); }catch(e){} tt.textContent=hpAlDayText(x.o)+'　'+(k+1)+' / '+A.length;
    fr.textContent=hpAlFrom(x)+(x.sz?' ・ '+hpHMB(x.sz):'')+(x.kp&&hpAlKeepOn()?' ・ ★ '+T('al_tag_keep'):'')+(x.sv?' ・ ✓ '+T('al_tag_saved'):''); try{ if(typeof hpAvWhere==='function') hpAvWhere(x,fr); }catch(e){} pv.style.visibility=k>0?'':'hidden'; nx.style.visibility=k<A.length-1?'':'hidden'; sv.style.display=(x.risk||x.sv)?'none':'';
    if(x.th&&!x.vid){ const im=mk('img'); im.alt=''; im.src=x.th; put(im); } else put(mk('div','',(x.vid?'\u{1F3AC} ':'\u{1F4C4} ')+String(x.nm||'')));
    const b=await hpAlBlob(x); if(my!==gen||!document.getElementById('hp-al-view')) return;
    if(!b){ if(!x.th||x.vid) put(mk('div','note',T('al_none_body'))); if(typeof hpAvNoBody==='function') hpAvNoBody(x,bot,fr,()=>{ if(my===gen) show(); }); return; }
    url=URL.createObjectURL(b);
    if(x.vid||/^video\//.test(b.type||'')){ const v=mk('video'); v.controls=true; v.autoplay=true; v.playsInline=true; try{ v.setAttribute('playsinline',''); }catch(e){} v.src=url; put(v); media=v; }
    else if(x.img||/^image\//.test(b.type||'')){ const im=mk('img','full'); im.alt=''; im.onerror=()=>{ im.onerror=null; im.className=''; if(x.th) im.src=x.th; }; im.src=url; put(im); if(typeof hpIsIOS==='function'&&hpIsIOS()&&!x.sv) fr.textContent=fr.textContent+'　'+T('al_view_hold'); }
    else put(mk('div','','\u{1F4C4} '+hpAlName(x,b))); };
  const go=d=>{ const j=k+d; if(j<0||j>=A.length) return; k=j; show(); };
  const close=()=>{ gen++; drop(); try{ document.removeEventListener('keydown',kd); }catch(e){} try{ w.remove(); }catch(e){} };
  const kd=e=>{ if(e.key==='Escape') close(); else if(e.key==='ArrowLeft') go(-1); else if(e.key==='ArrowRight') go(1); };
  hpAlZoom(st,()=>st.querySelector('img'),(dx,dy)=>{ if(dy>100&&dy>Math.abs(dx)*1.5){ close(); return; } if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5) go(dx<0?1:-1); });
  cl.onclick=close; pv.onclick=e=>{ try{ e.stopPropagation(); }catch(_){} go(-1); }; nx.onclick=e=>{ try{ e.stopPropagation(); }catch(_){} go(1); };
  sv.onclick=async()=>{ if(HP_AL.busy) return; HP_AL.busy=true; try{ const n=await hpAlSave([A[k]]); if(n) try{ hpToast(TF('al_done_save',{n:n}),2400); }catch(e){} }finally{ HP_AL.busy=false; } };
  w.__show=show; w.__at=()=>A[k]; w.__drop=()=>{ A.splice(k,1); if(!A.length){ close(); return; } if(k>=A.length) k=A.length-1; show(); }; document.addEventListener('keydown',kd); show(); return true; }catch(e){ return false; } }
async function hpAlUi(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const s=document.getElementById('p-album'); if(!s) return false; hpAlCss();
  const L0=await hpAlItems(), TR=L0.filter(x=>x.tr), L=L0.filter(x=>!x.tr); if(HP_AL.trash) return await hpTrUi(s,TR);
  const cut=(typeof hpKeepCut==='function')?hpKeepCut('b'):0, A=hpAlFilter(L,HP_AL,cut); const ids=new Set(A.map(x=>x.id)); for(const id of [...HP_AL.sel]) if(!ids.has(id)) HP_AL.sel.delete(id);
  const Y=hpAlYears(A), byNew=HP_AL.sort==='new', inYr=byNew&&!!HP_AL.yr&&Y.some(r=>r.y===HP_AL.yr), years=byNew&&!inYr&&Y.length>1, V=inYr?A.filter(x=>hpAlYear(x.o)===HP_AL.yr):A; if(!inYr) HP_AL.yr=0; HP_AL.cur=V;
  s.textContent=''; s.classList.toggle('selm',!!HP_AL.selm); const card=document.createElement('div'); card.className='card'; s.appendChild(card);
  const hd=document.createElement('div'); hd.className='al-h'; card.appendChild(hd);
  if(inYr){ const bb=document.createElement('button'); bb.type='button'; bb.className='al-chip'; bb.textContent=T('al_back_years'); bb.onclick=()=>{ HP_AL.yr=0; HP_AL.n=HP_AL_PAGE; hpAlSelOff(); hpAlUi(); try{ s.scrollTop=0; }catch(e){} }; hd.appendChild(bb); }
  const h=document.createElement('h2'); h.textContent=inYr?TF('al_yr',{y:HP_AL.yr}):T('al_title'); hd.appendChild(h);
  const so=document.createElement('select'); so.id='al-sort'; so.style.cssText=HP_AL_SEL; for(const [v,k] of [['new','al_sort_new'],['big','al_sort_big']]){ const o=document.createElement('option'); o.value=v; o.textContent=T(k); so.appendChild(o); } so.value=HP_AL.sort; so.onchange=()=>{ HP_AL.sort=so.value; HP_AL.yr=0; HP_AL.n=HP_AL_PAGE; hpAlSelOff(); hpAlUi(); }; hd.appendChild(so);
  if(!years&&V.length){ const sb=document.createElement('button'); sb.type='button'; sb.className='al-chip'; sb.id='al-selb'; sb.textContent=HP_AL.selm?T('btn_al_unsel'):T('btn_al_sel'); sb.onclick=()=>{ if(HP_AL.selm) hpAlSelOff(); else hpAlSelOn(); }; hd.appendChild(sb); }
  const peers=[...new Set(L.map(x=>x.peer))]; if(peers.length>1||HP_AL.peer){ const ch=document.createElement('div'); ch.className='al-chips'; ch.id='al-peer';
    for(const p of ['',...peers]){ const b=document.createElement('button'); b.type='button'; b.className='al-chip'+(HP_AL.peer===p?' on':''); b.setAttribute('aria-pressed',String(HP_AL.peer===p)); b.textContent=p?((typeof nickOf==='function')?nickOf(p):p.slice(0,12)):T('al_all'); b.onclick=()=>{ HP_AL.peer=p; HP_AL.yr=0; HP_AL.n=HP_AL_PAGE; hpAlSelOff(); hpAlUi(); }; ch.appendChild(b); } card.appendChild(ch); }
  if(!byNew){ const bl=document.createElement('label'); bl.style.cssText='display:flex;align-items:center;gap:4px;margin:4px 0'; const bc=document.createElement('input'); bc.type='checkbox'; bc.id='al-big'; bc.checked=HP_AL.big; bc.onchange=()=>{ HP_AL.big=bc.checked; HP_AL.n=HP_AL_PAGE; hpAlSelOff(); hpAlUi(); }; bl.appendChild(bc); bl.appendChild(document.createTextNode(T('al_big'))); card.appendChild(bl); }
  const cnt=document.createElement('div'); cnt.className='note'; cnt.id='al-count'; cnt.style.textAlign='left'; cnt.textContent=TF('al_count',{n:V.length,s:hpHMB(hpAlSum(V))}); card.appendChild(cnt);
  if(!A.length){ const e=document.createElement('div'); e.className='note'; e.textContent=T('al_empty'); card.appendChild(e); hpTrLink(card,TR); hpAlBar(); return true; }
  if(years){ const g=document.createElement('div'); g.className='al-yrs'; card.appendChild(g);
    for(const r of Y){ const b=document.createElement('button'); b.type='button'; b.className='al-yr'; b.setAttribute('data-y',String(r.y));
      if(r.cover&&r.cover.th){ const im=document.createElement('img'); im.alt=''; im.src=r.cover.th; b.appendChild(im); hpAlCover(im,r.cover); }
      b.appendChild(document.createElement('i')); const yb=document.createElement('b'); yb.textContent=String(r.y); b.appendChild(yb); const sm=document.createElement('small'); sm.textContent=TF('al_yr_n',{n:r.n}); b.appendChild(sm);
      b.onclick=()=>{ HP_AL.yr=r.y; HP_AL.n=HP_AL_PAGE; hpAlSelOff(); hpAlUi(); try{ s.scrollTop=0; }catch(e){} }; g.appendChild(b); } }
  else { const P=V.slice(0,HP_AL.n), mkg=()=>{ const g=document.createElement('div'); g.className='al-g'; card.appendChild(g); return g; };
    if(byNew){ for(const d of hpAlDays(P)){ const dh=document.createElement('div'); dh.className='al-d'; dh.appendChild(document.createTextNode(hpAlDayText(d.o))); const dn=document.createElement('span'); dn.textContent=TF('al_yr_n',{n:d.list.length}); dh.appendChild(dn); card.appendChild(dh); const g=mkg(); for(const x of d.list) g.appendChild(hpAlTile(x,V)); } }
    else { const g=mkg(); for(const x of P) g.appendChild(hpAlTile(x,V)); }
    if(V.length>HP_AL.n){ const more=document.createElement('button'); more.type='button'; more.className='b'; more.textContent=TF('btn_al_more',{n:V.length-HP_AL.n}); more.onclick=()=>{ HP_AL.n+=HP_AL_PAGE; hpAlUi(); }; card.appendChild(more); } }
  hpTrLink(card,TR); const nt=document.createElement('div'); nt.className='note al-ft'; nt.textContent=hpAlKeepOn()?T('al_note'):T('al_note_nk'); card.appendChild(nt);
  hpAlBar(); return true; }catch(e){ return false; } }

const HP_TR_DAYS=30, HP_TR_EVERY=6*3600e3;
function hpTrLeft(tr,now){ return Math.max(0,Math.floor((Number(tr)+HP_TR_DAYS*864e5-(now||Date.now()))/864e5)); }
function hpTrDue(L,now){ const t=now||Date.now(); return (L||[]).filter(x=>x&&x.tr&&t-x.tr>=HP_TR_DAYS*864e5); }
function hpTrBid(m){ return (m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||''; }
function hpTrBy(list){ const by=new Map(); for(const x of list||[]){ if(!x||!x.id||!x.peer) continue; if(!by.has(x.peer)) by.set(x.peer,new Set()); by.get(x.peer).add(x.id); } return by; }
async function hpTrPurge(list){ try{ const by=hpTrBy(list), ids=new Set(); let n=0;
  for(const [peer,set] of by){ const h=histLoad(peer); let ch=false; for(const m of h){ const id=hpTrBid(m); if(id&&set.has(id)&&m.tr&&m.tx){ delete m.tr; delete m.tx; m.ah=1; if(typeof hpTrGone==='function') hpTrGone(m); ch=true; n++; } else if(id&&set.has(id)&&m.tr){ delete m.tr; m.xb=1; if(typeof hpTrGone==='function') hpTrGone(m); ch=true; n++; ids.add(id); } } if(ch) histSave(peer,h); }
  if(ids.size){ for(const k of Object.keys(HPH_MEM)){ if(k.indexOf('p2p_chat_')!==0) continue; let h=[]; try{ h=histLoad(k.slice(9)); }catch(e){ h=[]; } for(const m of h){ const id=hpTrBid(m); if(id&&ids.has(id)&&(!m.xb||m.tr)) ids.delete(id); } } }
  if(ids.size) await hpHBlobDrop([...ids]); if(n){ try{ hpLog('最近削除した項目から '+n+' 件の本体を削除した'); }catch(e){} try{ if(typeof convDirty==='function') convDirty(); }catch(e){} } return n; }catch(e){ return 0; } }
async function hpTrRestore(list){ try{ const by=hpTrBy(list), have=new Set(); let n=0, nt=0; const miss=[];
  for(const x of list||[]){ if(!x||!x.id) continue; try{ if(await blobGet(x.id)) have.add(x.id); }catch(e){} }
  for(const [peer,set] of by){ const h=histLoad(peer); let ch=false; for(const m of h){ const id=hpTrBid(m); if(id&&set.has(id)&&m.tr&&m.tx){ delete m.tr; delete m.tx; ch=true; n++; } else if(id&&set.has(id)&&m.tr&&have.has(id)){ delete m.tr; delete m.xb; ch=true; n++; } else if(id&&set.has(id)&&m.tr){ delete m.tr; m.xb=1; ch=true; n++; nt++; miss.push(id); } } if(ch) histSave(peer,h); }
  if(nt){ try{ const sz=(typeof hpKeepSizes==='function')?await hpKeepSizes():new Map(); hpLog('最近削除した項目から戻すとき、元の大きさが見つからずサムネイルのみで戻した '+nt+' 件（置き場が開いている '+((typeof hpHDisk==='function')?!!hpHDisk():'?')+'・置き場に記録がある '+miss.filter(id=>sz.has(hpBName(id))).length+' 件）'); }catch(e){} } if(n){ try{ hpLog('最近削除した項目から '+n+' 件を元に戻した'); }catch(e){} try{ if(typeof convDirty==='function') convDirty(); }catch(e){} } return n; }catch(e){ return 0; } }
function hpTrTick(){ try{ if(typeof ID==='undefined'||!ID) return; if(typeof hpHDisk==='function'&&hpHDisk()&&typeof HPH_OPENED!=='undefined'&&!HPH_OPENED) return; (async()=>{ const d=hpTrDue((await hpAlItems()).filter(x=>x.tr)); if(d.length) await hpTrPurge(d); })().catch(()=>{}); }catch(e){} }
if(typeof window!=='undefined'&&window&&typeof window.addEventListener==='function'){ setTimeout(()=>{ hpTrTick(); setInterval(hpTrTick,HP_TR_EVERY); },45000); }
function hpTrSum(L){ let s=0; for(const x of L||[]) s+=Number(x.sz)||0; return s; }
function hpTrLink(card,TR){ try{ if(!TR||!TR.length) return; const b=document.createElement('button'); b.type='button'; b.className='al-chip'; b.id='al-tr-link'; b.style.marginTop='12px'; b.textContent=TF('al_tr_link',{n:TR.length});
  b.onclick=()=>{ HP_AL.trash=true; HP_AL.selm=false; HP_AL.sel.clear(); hpAlUi(); try{ const s=document.getElementById('p-album'); if(s) s.scrollTop=0; }catch(e){} }; card.appendChild(b); }catch(e){} }
async function hpTrUi(s,TR){ try{ const now=Date.now(), A=(TR||[]).slice().sort((p,q)=>p.tr-q.tr||p.o-q.o), ids=new Set(A.map(x=>x.id)); for(const id of [...HP_AL.sel]) if(!ids.has(id)) HP_AL.sel.delete(id);
  s.textContent=''; s.classList.add('selm'); const card=document.createElement('div'); card.className='card'; s.appendChild(card);
  const hd=document.createElement('div'); hd.className='al-h'; card.appendChild(hd);
  const bb=document.createElement('button'); bb.type='button'; bb.className='al-chip'; bb.textContent=T('al_tr_back'); bb.onclick=()=>{ HP_AL.trash=false; HP_AL.sel.clear(); s.classList.remove('selm'); hpAlUi(); }; hd.appendChild(bb);
  const h=document.createElement('h2'); h.textContent=T('al_tr_title'); hd.appendChild(h);
  if(A.length){ const ab=document.createElement('button'); ab.type='button'; ab.className='al-chip'; ab.id='al-tr-all'; ab.textContent=T('btn_tr_all'); ab.onclick=()=>{ if(HP_AL.sel.size===A.length) HP_AL.sel.clear(); else for(const x of A) HP_AL.sel.add(x.id); hpTrUi(s,TR); }; hd.appendChild(ab); }
  const nt=document.createElement('div'); nt.className='note'; nt.style.textAlign='left'; nt.textContent=TF('al_tr_note',{d:HP_TR_DAYS,s:hpHMB(hpTrSum(A))}); card.appendChild(nt);
  if(!A.length){ const e=document.createElement('div'); e.className='note'; e.textContent=T('al_tr_empty'); card.appendChild(e); return true; }
  const g=document.createElement('div'); g.className='al-g'; card.appendChild(g);
  for(const x of A){ const t=document.createElement('div'); const on=HP_AL.sel.has(x.id); t.className='al-t'+(on?' sel':''); t.setAttribute('role','button'); t.tabIndex=0;
    if(x.th){ const im=document.createElement('img'); im.src=x.th; im.alt=''; im.loading='lazy'; t.appendChild(im); } else t.textContent=(x.vid?'\u{1F3AC} ':'\u{1F4C4} ')+String(x.nm||'').slice(0,24);
    const lf=document.createElement('span'); lf.textContent=TF('al_tr_left',{n:hpTrLeft(x.tr,now)}); lf.style.cssText='position:absolute;left:3px;bottom:3px;font-size:10px;line-height:1.4;padding:0 4px;border-radius:4px;background:rgba(0,0,0,.6);color:#fff'; t.appendChild(lf);
    const k=document.createElement('span'); k.className='al-k'; k.textContent=on?'✓':''; t.appendChild(k);
    t.onclick=()=>{ if(HP_AL.sel.has(x.id)) HP_AL.sel.delete(x.id); else HP_AL.sel.add(x.id); hpTrUi(s,TR); }; t.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ try{ e.preventDefault(); }catch(_){} t.onclick(); } }; g.appendChild(t); }
  const pick=()=>A.filter(x=>HP_AL.sel.has(x.id)), n=HP_AL.sel.size, bar=document.createElement('div'); bar.id='al-bar'; s.appendChild(bar);
  const c=document.createElement('div'); c.className='al-n'; c.textContent=TF('al_sel_n',{n:n,s:hpHMB(hpTrSum(pick()))}); bar.appendChild(c);
  const B=(t,f,cls)=>{ const b=document.createElement('button'); b.type='button'; b.className='b'+(cls?' '+cls:''); b.textContent=t; b.disabled=!n; b.onclick=f; bar.appendChild(b); return b; };
  B(TF('btn_tr_back',{n:n}),async()=>{ const k=await hpTrRestore(pick()); try{ hpToast(TF('al_tr_done_back',{n:k}),3000); }catch(e){} HP_AL.sel.clear(); try{ hpStoreUi(); }catch(e){} hpAlUi(); });
  B(TF('btn_tr_drop',{n:n}),async()=>{ const list=pick(); if(!list.length) return; const ok=await hpAsk({title:TF('btn_tr_drop',{n:list.length}),text:TF('cf_tr_drop',{n:list.length,s:hpHMB(hpTrSum(list))}),ok:TF('btn_tr_drop',{n:list.length}),danger:true}); if(!ok) return;
    const k=await hpTrPurge(list); try{ hpToast(TF('al_tr_done_drop',{n:k}),3000); }catch(e){} HP_AL.sel.clear(); try{ hpStoreUi(); }catch(e){} hpAlUi(); },'danger');
  return true; }catch(e){ return false; } }
async function hpTrStoreLine(){ try{ if(typeof document==='undefined'||!document.getElementById) return false; const p=document.getElementById('store-parts'); if(!p||!p.parentNode) return false;
  const L=(await hpAlItems()).filter(x=>x.tr); let d=document.getElementById('st-trash'); if(!L.length){ if(d) d.remove(); return true; }
  if(!d){ d=document.createElement('div'); d.id='st-trash'; d.className='note'; p.parentNode.insertBefore(d,p.nextSibling); } d.textContent=TF('st_trash',{n:L.length,s:hpHMB(hpTrSum(L)),d:HP_TR_DAYS}); return true; }catch(e){ return false; } }
try{ if(typeof hpStoreUi==='function'&&!hpStoreUi.__tr){ const f=hpStoreUi; hpStoreUi=function(){ const r=f.apply(this,arguments); try{ hpTrStoreLine().catch(()=>{}); }catch(e){} return r; }; Object.assign(hpStoreUi,f,{__tr:1}); } }catch(e){}

const HP_HDR_CSS='#hdr-actions{column-gap:14px!important}#hdr-actions #hp-sbox{gap:10px;border:0!important;background:none!important;overflow:visible!important;border-radius:0!important}#hdr-actions #hp-sbox button{background:#17233c!important;border:1px solid var(--line)!important;border-radius:16px!important;min-height:40px;min-width:46px;justify-content:center!important;padding:6px 10px!important}#hdr-actions #hp-sbox #btn-qr{border-left:1px solid var(--line)!important}#hdr-actions #btn-bell{min-height:40px;min-width:46px}';
function hpHdrGap(){ try{ if(typeof document==='undefined'||!document.getElementById||document.getElementById('hp-hdr-gap')) return false; const s=document.createElement('style'); s.id='hp-hdr-gap'; s.textContent=HP_HDR_CSS; (document.head||document.body).appendChild(s); try{ if(typeof hpHdrFit==='function') hpHdrFit(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof document!=='undefined'&&document&&document.getElementById){ if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',()=>{ hpHdrGap(); }); else hpHdrGap(); } }catch(e){}

const HP_HDR_CSS2='html body #hdr-actions{grid-template-columns:minmax(0,360px) max-content minmax(0,1fr) max-content!important}html body #hdr-actions #hp-sbox{justify-self:stretch;min-width:0}html body #hdr-actions #hp-sbox #btn-search{flex:1 1 auto;min-width:0;justify-content:flex-start!important;gap:8px;padding:6px 14px!important}html body #hdr-actions #hp-sbox #btn-search .sl{display:inline!important;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}html body #hdr-actions #hp-sbox button,html body #hdr-actions #btn-bell,html body #hdr-actions #btn-menu,html body #hdr-top #me-qr{height:46px;min-height:46px;box-sizing:border-box}html body #hdr-top #me-qr{border-radius:16px;padding:6px 12px;line-height:1;margin-top:2px}html body #hp-al-view .av-st img.full{-webkit-touch-callout:default!important;-webkit-user-select:auto;user-select:auto}html body #hp-al-view .av-st img:not(.full){-webkit-touch-callout:none!important;-webkit-user-select:none;user-select:none}';
function hpHdrGap2(){ try{ if(typeof document==='undefined'||!document.getElementById||document.getElementById('hp-hdr-gap2')) return false; const s=document.createElement('style'); s.id='hp-hdr-gap2'; s.textContent=HP_HDR_CSS2; (document.head||document.body).appendChild(s); try{ if(typeof hpHdrFit==='function') hpHdrFit(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof document!=='undefined'&&document&&document.getElementById){ if(document.readyState==='loading'&&document.addEventListener) document.addEventListener('DOMContentLoaded',()=>{ hpHdrGap2(); }); else hpHdrGap2(); } }catch(e){}

function hpAlKeepOn(){ try{ return typeof hpKeepDays==='function'&&(hpKeepDays('b')>0||hpKeepDays('t')>0); }catch(e){ return false; } }

async function hpAlMarkSaved(list){ try{ const by=new Map(); for(const x of list||[]){ if(!x||!x.id||!x.peer||x.risk||x.xb) continue; if(!by.has(x.peer)) by.set(x.peer,new Set()); by.get(x.peer).add(x.id); } let n=0; const now=Date.now();
  for(const [peer,set] of by){ const h=histLoad(peer); let ch=false; for(const m of h){ const id=(m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||''; if(id&&set.has(id)){ m.sv=now; ch=true; n++; } } if(ch) histSave(peer,h); }
  for(const x of list||[]) if(x&&!x.risk&&!x.xb) x.sv=now; return n; }catch(e){ return 0; } }
try{ if(typeof hpAlSave==='function'&&!hpAlSave.__sv){ const f=hpAlSave; hpAlSave=async function(list){ const k=await f.apply(this,arguments); if(k>0){ try{ await hpAlMarkSaved(list); }catch(e){} } return k; }; Object.assign(hpAlSave,f,{__sv:1}); } }catch(e){}

async function hpAlFetch(list){ const r={ok:0,ng:0}; try{ const want=(list||[]).filter(x=>x&&x.xb&&!x.tr&&x.id), got=new Set();
  for(const x of want){ let b=null; try{ b=await blobGet(x.id); }catch(e){ b=null; } if(!b&&typeof sibFetchBlob==='function'){ try{ b=await sibFetchBlob(x.id); }catch(e){ b=null; } } if(b){ got.add(x.id); r.ok++; } else r.ng++; }
  if(got.size){ for(const k of Object.keys(HPH_MEM)){ if(k.indexOf('p2p_chat_')!==0) continue; const p=k.slice(9); let h=[]; try{ h=histLoad(p); }catch(e){ h=[]; } let ch=false; for(const m of h){ const id=(m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||''; if(id&&got.has(id)&&m.xb&&!m.tr){ delete m.xb; ch=true; } } if(ch) histSave(p,h); }
    try{ hpLog('アルバムから本体を '+r.ok+' 件取り寄せた（取り寄せられなかった '+r.ng+' 件）'); }catch(e){} try{ if(typeof convDirty==='function') convDirty(); }catch(e){} } }catch(e){} return r; }

function hpAlNoBody(id,sz){ try{ if(!id||typeof hpHDisk!=='function'||!hpHDisk()||!sz||!sz.size) return false; if(typeof HPB_MEM!=='undefined'&&HPB_MEM&&HPB_MEM.has&&HPB_MEM.has(id)) return false; return !sz.has(hpBName(id)); }catch(e){ return false; } }

try{ if(typeof hpAlSave==='function'&&!hpAlSave.__rs){ const f=hpAlSave; hpAlSave=async function(list){ const L=(list||[]).filter(x=>x&&!x.risk), sv=L.filter(x=>x.sv&&!x.xb);
    if(sv.length&&sv.length===L.length){ let ok=false; try{ ok=await hpAsk({text:TF('cf_al_resave',{n:sv.length}),ok:T('btn_al_resave')}); }catch(e){ ok=false; } if(!ok) return 0; return await f.call(this,list); }
    if(sv.length){ try{ hpToast(TF('al_skip_saved',{n:sv.length}),3000); }catch(e){} return await f.call(this,(list||[]).filter(x=>!(x&&x.sv&&!x.xb))); }
    return await f.apply(this,arguments); }; Object.assign(hpAlSave,f,{__rs:1}); } }catch(e){}

function hpAlZoom(st,getImg,onSwipe){ const P=new Map(); let sc=1, tx=0, ty=0, im=null, start=null, pinch=null, lastTap=0;
  const fresh=()=>{ const i=getImg(); if(i!==im){ im=i; sc=1; tx=0; ty=0; } return i; };
  const apply=()=>{ const i=fresh(); if(!i||!i.style) return; i.style.transition=P.size?'none':'transform .15s'; i.style.transform=sc>1?'translate('+tx+'px,'+ty+'px) scale('+sc+')':''; };
  const clamp=()=>{ if(!(sc>1)){ sc=1; tx=0; ty=0; return; } if(sc>5) sc=5; let w=0, h=0; try{ const r=st.getBoundingClientRect(); w=r.width; h=r.height; }catch(e){} const mx=w*(sc-1)/2, my=h*(sc-1)/2; tx=Math.max(-mx,Math.min(mx,tx)); ty=Math.max(-my,Math.min(my,ty)); };
  const dist=()=>{ const a=[...P.values()]; return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y); };
  st.addEventListener('pointerdown',e=>{ fresh(); P.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(P.size===2){ pinch={d:dist(),sc:sc}; start=null; } else if(P.size===1){ start={x:e.clientX,y:e.clientY,tx:tx,ty:ty}; } });
  st.addEventListener('pointermove',e=>{ if(!P.has(e.pointerId)) return; P.set(e.pointerId,{x:e.clientX,y:e.clientY}); if(P.size>=2&&pinch){ sc=pinch.sc*dist()/Math.max(1,pinch.d); clamp(); apply(); } else if(P.size===1&&start&&sc>1){ tx=start.tx+e.clientX-start.x; ty=start.ty+e.clientY-start.y; clamp(); apply(); } });
  const up=(e,cancel)=>{ if(!P.has(e.pointerId)) return; P.delete(e.pointerId); if(pinch){ if(P.size<2){ pinch=null; start=null; clamp(); apply(); } return; } const s=start; start=null; if(cancel||!s) return;
    const dx=e.clientX-s.x, dy=e.clientY-s.y; if(Math.abs(dx)<10&&Math.abs(dy)<10){ const now=Date.now(); if(now-lastTap<300){ lastTap=0; if(sc>1){ sc=1; tx=0; ty=0; } else sc=2.5; clamp(); apply(); } else lastTap=now; return; }
    if(sc>1) return; onSwipe(dx,dy); };
  st.addEventListener('pointerup',e=>up(e,false)); st.addEventListener('pointercancel',e=>up(e,true));
  return { scale:()=>sc }; }

const HP_HELP_HI={hl_a15:[1]};
function hpHelpHiDiv(a){ try{ const hi=HP_HELP_HI[a]; if(!hi||typeof hpHelpEsc!=='function') return ''; const L=String(T(a)).split('\n');
  return '<div style="white-space:pre-line;margin:6px 0 2px;line-height:1.7" data-hl-hi="'+a+'">'+L.map((t,i)=>hi.indexOf(i)>=0?'<span style="color:var(--amber,#f5b85c);font-weight:700">'+hpHelpEsc(t)+'</span>':hpHelpEsc(t)).join('\n')+'</div>'; }catch(e){ return ''; } }

const HP_FREE_TO=0.7;
try{ if(typeof hpKeepDays==='function'&&!hpKeepDays.__off){ const f=hpKeepDays; hpKeepDays=function(){ return 0; }; Object.assign(hpKeepDays,f,{__off:1}); } }catch(e){}
try{ if(typeof hpStoreUi==='function'&&!hpStoreUi.__nokeep){ const f=hpStoreUi; hpStoreUi=function(){ const r=f.apply(this,arguments); try{ const k=document.getElementById('keep-card'); if(k) k.style.display='none'; }catch(e){} return r; }; Object.assign(hpStoreUi,f,{__nokeep:1}); } }catch(e){}
function hpTrGone(m){ try{ if(!m) return m; if(m.img){ delete m.img.thumb; m.img.gone=1; } if(m.file){ delete m.file.thumb; m.file.gone=1; } m.ah=1; }catch(e){} return m; }
try{ if(typeof addMsgAt==='function'&&!addMsgAt.__gone){ const f=addMsgAt; addMsgAt=function(kind,text,who,ts,voided,pend,rd,img,file,...rest){ try{
      if(img&&img.gone&&!img.thumb){ text=(text?text+'\n':'')+T('al_ph_gone'); img=null; }
      if(file&&file.gone){ text=(text?text+'\n':'')+TF('al_file_gone',{name:((typeof hpFileName==='function')?hpFileName(file.name):file.name)||''}); file=null; } }catch(e){}
    return f.call(this,kind,text,who,ts,voided,pend,rd,img,file,...rest); }; Object.assign(addMsgAt,f,{__gone:1}); } }catch(e){}
function hpAlPickFree(L,need){ const A=(L||[]).filter(x=>x&&!x.tr&&!x.xb&&!x.p&&x.sz>0).sort((p,q)=>(q.sv?1:0)-(p.sv?1:0)||q.sz-p.sz||p.o-q.o); const out=[]; let s=0;
  for(const x of A){ if(!(need>0)||s>=need) break; out.push(x); s+=x.sz; } return out; }
async function hpAlSuggest(){ try{ if(typeof hpAlOpen!=='function') return false; hpAlOpen();
    HP_AL.sort='big'; HP_AL.big=false; HP_AL.peer=''; HP_AL.yr=0; HP_AL.trash=false; HP_AL.n=HP_AL_PAGE;
    let need=0; try{ const u=(typeof hpHUsage==='function')?await hpHUsage():null; if(u&&u.cap) need=Math.max(0,u.usage-u.cap*HP_FREE_TO); }catch(e){}
    const pick=hpAlPickFree(await hpAlItems(),need); HP_AL.sel.clear(); for(const x of pick) HP_AL.sel.add(x.id); HP_AL.selm=true; HP_AL.free=true;
    await hpAlUi(); let s=0; for(const x of pick) s+=x.sz; try{ hpToast(pick.length?TF('al_free_hint',{n:pick.length,s:hpHMB(s)}):T('al_free_none'),8000); }catch(e){} return true; }catch(e){ return false; } }

function hpCtMarks(nm){ try{ if(!nm||!nm.children) return 0; const sp=[...nm.children].filter(e=>e.tagName==='SPAN'); if(sp.length<2) return 0; const ad=sp[0]; let n=0;
    for(const k of sp.slice(1)){ k.classList.add('mk'); nm.insertBefore(k,ad); n++; } ad.classList.add('ad'); return n; }catch(e){ return 0; } }
function hpCtCss(){ try{ if(typeof document==='undefined'||!document.getElementById||document.getElementById('hp-ct3')) return; const st=document.createElement('style'); st.id='hp-ct3';
    st.textContent='.contact-item .nm>b{display:inline;margin-right:2px}.contact-item .nm>span.mk{display:inline-block;margin-left:6px;white-space:nowrap;font-family:inherit}.contact-item .nm>span.ad{display:block}';
    document.head.appendChild(st); }catch(e){} }
try{ if(typeof renderContacts==='function'&&!renderContacts.__ct3){ const f=renderContacts; renderContacts=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ hpCtCss(); const list=document.getElementById('contact-list'); if(list&&list.querySelectorAll) for(const nm of list.querySelectorAll('.contact-item .nm')) hpCtMarks(nm); }catch(e){} return v; },f,{__ct3:1}); } }catch(e){}

const HP_CTR_DAYS=30, HP_CTR_KEEP=120*864e5, HP_CTR_MAX=500;
function hpCtrMap(){ if(!ID) return {}; if(!ID.ctr||typeof ID.ctr!=='object'||Array.isArray(ID.ctr)) ID.ctr={}; return ID.ctr; }
function hpCtrGet(a){ const e=hpCtrMap()[a]; return (e&&typeof e==='object')?e:null; }
function hpCtrTKey(a){ return 'p2p_ctrh_'+a; }
function hpCtrTLoad(a){ try{ const s=hpHGet(hpCtrTKey(a)); const r=s?JSON.parse(s):[]; return Array.isArray(r)?r:[]; }catch(e){ return []; } }
function hpCtrName(a){ try{ const c=contacts().find(x=>x.address===a); if(c&&c.nick) return c.nick; const e=hpCtrGet(a); return (e&&e.nick)?String(e.nick):''; }catch(e){ return ''; } }
function hpCtrSet(a,ch,at){ const M=hpCtrMap(), o=Object.assign({nick:'',hid:0,tr:0},M[a]||{},ch||{}); o.at=Math.max(Number(at)||Date.now(),(M[a]&&Number(M[a].at)||0)+1); M[a]=o; return o; }
function hpCtrNick(a,nick){ if(!a||!nick) return; const e=hpCtrGet(a); if(e&&e.nick===nick) return; const M=hpCtrMap(); M[a]=Object.assign({hid:0,tr:0,at:0},M[a]||{},{nick:String(nick).slice(0,24)}); }
function hpCtrLast(a){ try{ const h=histLoad(a); return h.length?histOrd(h[h.length-1]):0; }catch(e){ return 0; } }
function hpCtrHidden(a){ const e=hpCtrGet(a); return !!(e&&e.hid&&hpCtrLast(a)<=e.hid); }
function hpCtrApply(a,now){ try{ const e=hpCtrGet(a); if(!e) return 0; now=now||Date.now(); let n=0;
    if(e.tr){ const h=histLoad(a), old=h.filter(m=>histOrd(m)<=e.tr), keep=h.filter(m=>histOrd(m)>e.tr);
      if(old.length){ const T0=hpCtrTLoad(a), seen=new Set(T0.map(m=>m.ts+'|'+m.d)); for(const m of old) if(!seen.has(m.ts+'|'+m.d)) T0.push(m); hpHSet(hpCtrTKey(a),JSON.stringify(T0)); if(keep.length) histSave(a,keep); else { histClear(a); try{ convDirty(); }catch(_){} } n=old.length;
        try{ if(typeof CURPEER!=='undefined'&&CURPEER===a&&!keep.length){ const ms=document.getElementById('msgs'); if(ms) ms.innerHTML=''; } }catch(_){} }
      if(now-e.tr>=HP_CTR_DAYS*864e5&&hpHGet(hpCtrTKey(a))!==null) hpCtrPurge(a); }
    else { const T0=hpCtrTLoad(a); if(T0.length){ const h=histLoad(a), seen=new Set(h.map(m=>m.ts+'|'+m.d)); for(const m of T0) if(!seen.has(m.ts+'|'+m.d)) h.push(m); histSave(a,histSort(h)); n=T0.length; } if(hpHGet(hpCtrTKey(a))!==null) hpHDel(hpCtrTKey(a)); }
    return n; }catch(e){ return 0; } }
function hpCtrPurge(a){ try{ const T0=hpCtrTLoad(a), ids=new Set(); for(const m of T0){ const id=hpTrBid(m); if(id) ids.add(id); } hpHDel(hpCtrTKey(a));
    if(ids.size){ for(const k of hpHKeys('p2p_')){ if(k.indexOf('p2p_chat_')!==0&&k.indexOf('p2p_ctrh_')!==0) continue; let h=[]; try{ h=JSON.parse(hpHGet(k)||'[]'); }catch(e){ h=[]; } for(const m of h){ const id=hpTrBid(m); if(id) ids.delete(id); } }
      if(ids.size&&typeof hpHBlobDrop==='function') hpHBlobDrop([...ids]).catch(()=>{}); }
    try{ hpLog('最近削除した手紙を 30 日たったので消した（'+hpIdShort(a)+'・'+T0.length+' 通）'); }catch(e){} return T0.length; }catch(e){ return 0; } }
function hpCtrTick(){ try{ if(!ID) return 0; const now=Date.now(), M=hpCtrMap(); let n=0;
    for(const a of Object.keys(M)){ const e=M[a]; if(!e||typeof e!=='object'){ delete M[a]; continue; } if(e.tr) n+=hpCtrApply(a,now)?1:0;
      const empty=hpHGet(histKey(a))===null&&hpHGet(hpCtrTKey(a))===null&&!contacts().some(c=>c.address===a); if(empty&&now-(Number(e.at)||0)>HP_CTR_KEEP) delete M[a]; }
    const ks=Object.keys(M); if(ks.length>HP_CTR_MAX){ ks.sort((p,q)=>(M[p].at||0)-(M[q].at||0)); for(const a of ks.slice(0,ks.length-HP_CTR_MAX)) if(hpHGet(hpCtrTKey(a))===null) delete M[a]; }
    return n; }catch(e){ return 0; } }
function hpCtrDone(){ try{ saveID(); }catch(e){} try{ if(typeof hpSibSyncSoon==='function') hpSibSyncSoon(); }catch(e){} try{ convDirty(); }catch(e){} try{ renderContacts(); }catch(e){} }
function hpCtrHide(a,on){ if(!a) return false; hpCtrNick(a,hpCtrName(a)); hpCtrSet(a,{hid:on?Date.now():0}); hpCtrDone(); return true; }
function hpCtrDel(a){ if(!a) return 0; hpCtrNick(a,hpCtrName(a)); const now=Math.max(Date.now(),hpCtrLast(a)); hpCtrSet(a,{tr:now,hid:0},now); const n=hpCtrApply(a,now); try{ hpLog('手紙を最近削除した手紙へ移した（'+hpIdShort(a)+'・'+n+' 通）'); }catch(e){} hpCtrDone(); return n; }
function hpCtrBack(a){ if(!a) return 0; hpCtrSet(a,{tr:0}); const n=hpCtrApply(a); hpCtrDone(); return n; }
function hpCtrLeft(tr,now){ return Math.max(0,HP_CTR_DAYS-Math.ceil(((now||Date.now())-Number(tr))/864e5)); }
function hpCtrOut(){ const M=hpCtrMap(), o={}; let n=0; for(const a of Object.keys(M)){ const e=M[a]; if(!e||!(e.at>0)) continue; o[a]={nick:String(e.nick||'').slice(0,24),hid:Number(e.hid)||0,tr:Number(e.tr)||0,at:Number(e.at)}; if(++n>=HP_CTR_MAX) break; } return n?o:null; }
function hpCtrIn(o){ try{ if(!o||typeof o!=='object'||Array.isArray(o)) return 0; const M=hpCtrMap(), now=Date.now(); let n=0;
    for(const a of Object.keys(o).slice(0,HP_CTR_MAX)){ const e=o[a]; if(!e||typeof e!=='object'||!(typeof hpIdFmt==='function'&&hpIdFmt(a))||(ID&&a===ID.address)) continue; const at=Number(e.at)||0; if(!(at>0)||at>now+600e3) continue;
      const x=M[a]; if(x&&(Number(x.at)||0)>=at){ if(!x.nick&&e.nick) x.nick=String(e.nick).slice(0,24); continue; }
      M[a]={nick:String(e.nick||(x&&x.nick)||'').slice(0,24),hid:Math.max(0,Number(e.hid)||0),tr:Math.max(0,Number(e.tr)||0),at:at}; hpCtrApply(a,now); n++; }
    if(n){ try{ hpLog('自分のほかの端末の非表示・削除を '+n+' 件そろえた'); }catch(e){} hpCtrDone(); } return n; }catch(e){ return 0; } }
try{ if(typeof hpSyncDigest==='function'&&!hpSyncDigest.__ctr){ const f=hpSyncDigest; hpSyncDigest=Object.assign(async function(){ const h=await f.apply(this,arguments); const c=hpCtrOut(); if(!c) return h; let s=0; const t=JSON.stringify(Object.keys(c).sort().map(a=>[a,c[a].nick,c[a].hid,c[a].tr,c[a].at])); for(let i=0;i<t.length;i++) s=(s*31+t.charCodeAt(i))>>>0; return h+'.'+s.toString(16); },f,{__ctr:1}); } }catch(e){}
try{ if(typeof hpSibSyncIn0==='function'&&!hpSibSyncIn0.__ctr){ const f=hpSibSyncIn0; hpSibSyncIn0=Object.assign(async function(o){ const r=await f.apply(this,arguments); try{ if(o&&o.ctr) hpCtrIn(o.ctr); }catch(e){} return r; },f,{__ctr:1}); } }catch(e){}
try{ if(typeof sibApply==='function'&&!sibApply.__ctr){ const f=sibApply; sibApply=Object.assign(function(peer,item){ try{ const e=hpCtrGet(peer); if(e&&e.tr&&item&&typeof item.ts==='number'&&histOrd(item)<=e.tr&&!histLoad(peer).some(x=>x.ts===item.ts&&x.d===item.d)) return null; }catch(_){} return f.apply(this,arguments); },f,{__ctr:1}); } }catch(e){}
try{ if(typeof removeContact==='function'&&!removeContact.__ctr){ const f=removeContact; removeContact=Object.assign(function(addr,purge){ try{ hpCtrNick(addr,hpCtrName(addr)); }catch(e){} const r=f.call(this,addr,false); if(purge) hpCtrDel(addr); return r; },f,{__ctr:1}); } }catch(e){}
try{ if(typeof hpSyncDrop==='function'&&!hpSyncDrop.__ctr){ const f=hpSyncDrop; hpSyncDrop=Object.assign(function(addr,purge){ try{ hpCtrNick(addr,hpCtrName(addr)); }catch(e){} return f.apply(this,arguments); },f,{__ctr:1}); } }catch(e){}
try{ if(typeof nickOf==='function'&&!nickOf.__ctr){ const f=nickOf; nickOf=Object.assign(function(addr){ try{ if(!contacts().some(c=>c.address===addr)){ const e=hpCtrGet(addr); if(e&&e.nick) return e.nick+T('ct_off_book'); } }catch(e){} return f.apply(this,arguments); },f,{__ctr:1}); } }catch(e){}
function hpCtCss(){ try{ if(typeof document==='undefined'||!document.getElementById||document.getElementById('hp-ctr-css')) return; const st=document.createElement('style'); st.id='hp-ctr-css';
    st.textContent='#ctr-sheet{position:fixed;inset:0;z-index:90}#ctr-sheet .bg{position:absolute;inset:0;background:rgba(0,0,0,.45)}#ctr-sheet .pane{position:absolute;left:0;right:0;bottom:0;max-width:520px;margin:0 auto;background:var(--panel,#121a2b);border-radius:16px 16px 0 0;padding:12px 12px calc(12px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:8px}#ctr-sheet .pane b{text-align:center;padding:4px 0 6px}#ctr-sheet button{min-height:46px;font-size:16px}#ctr-sheet .hd{position:relative;text-align:center;padding:4px 40px 6px}#ctr-sheet .hd b{display:block}#ctr-sheet .hd .x{position:absolute;right:0;top:-6px;min-height:0;font-size:22px;line-height:1;padding:6px 10px;border:none;background:none;color:var(--ink,#e6eefc)}.ctr-box{margin-top:12px}.ctr-box summary{cursor:pointer;color:var(--dim);font-size:13px;padding:6px 2px}.ctr-row{display:flex;align-items:center;gap:8px;padding:6px 2px;border-bottom:1px solid var(--line)}.ctr-row span{flex:1;min-width:0;font-size:13px}.ctr-row small{color:var(--dim);margin-left:6px}.conv-item{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}';
    document.head.appendChild(st); }catch(e){} }
function hpCtrMenu(a){ try{ hpCtCss(); const old=document.getElementById('ctr-sheet'); if(old) old.remove(); const who=hpCtrName(a)||hpIdShort(a), n=histLoad(a).length;
    const w=document.createElement('div'); w.id='ctr-sheet'; const bg=document.createElement('div'); bg.className='bg'; const p=document.createElement('div'); p.className='pane'; w.appendChild(bg); w.appendChild(p);
    const close=()=>{ try{ w.remove(); }catch(e){} }; bg.onclick=close; const hd=document.createElement('div'); hd.className='hd'; const t=document.createElement('b'); t.textContent=who; const x=document.createElement('button'); x.type='button'; x.className='x'; x.textContent='✕'; x.setAttribute('aria-label',T('btn_close')); x.onclick=close; hd.appendChild(t); hd.appendChild(x); p.appendChild(hd);
    const B=(txt,cls,fn)=>{ const b=document.createElement('button'); b.type='button'; b.className='b'+(cls?' '+cls:''); b.textContent=txt; b.onclick=()=>{ close(); fn(); }; p.appendChild(b); return b; };
    B(T('btn_ct_hide'),'',()=>{ hpCtrHide(a,true); try{ hpToast(TF('ct_done_hide',{who:who}),4000); }catch(e){} });
    if(n) B(T('btn_ct_del'),'warn',async()=>{ if(!(await hpAsk({text:TF('cf_ct_del',{who:who,n:n}),danger:true,ok:T('btn_ct_del')}))) return; hpCtrDel(a); try{ hpToast(TF('ct_done_del',{who:who}),4000); }catch(e){} });
    document.body.appendChild(w); hd.title=''; return true; }catch(e){ return false; } }
function hpCtrPress(el,a){ let t=null, fired=false; const go=()=>{ fired=true; hpCtrMenu(a); };
  el.addEventListener('pointerdown',()=>{ fired=false; clearTimeout(t); t=setTimeout(go,550); }); for(const ev of ['pointerup','pointerleave','pointercancel','pointermove']) el.addEventListener(ev,e=>{ if(ev==='pointermove'&&e&&Math.abs(e.movementX||0)+Math.abs(e.movementY||0)<6) return; clearTimeout(t); });
  el.addEventListener('contextmenu',e=>{ try{ e.preventDefault(); }catch(_){} clearTimeout(t); go(); });
  el.addEventListener('click',e=>{ if(fired){ fired=false; try{ e.stopImmediatePropagation(); e.preventDefault(); }catch(_){} } },true); }
function hpCtrBoxes(el){ try{ const M=hpCtrMap(), now=Date.now(), hid=[], tr=[];
    for(const a of Object.keys(M)){ const e=M[a]; if(!e) continue; if(e.tr&&hpHGet(hpCtrTKey(a))!==null) tr.push(a); else if(e.hid&&hpHGet(histKey(a))!==null&&hpCtrHidden(a)) hid.push(a); }
    const box=(title,list,row)=>{ if(!list.length) return; const d=document.createElement('details'); d.className='ctr-box'; const s=document.createElement('summary'); s.textContent=TF(title,{n:list.length}); d.appendChild(s); for(const a of list) d.appendChild(row(a)); el.appendChild(d); };
    const R=(a,sub,btn,fn)=>{ const r=document.createElement('div'); r.className='ctr-row'; const s=document.createElement('span'); s.textContent=hpCtrName(a)||hpIdShort(a); if(sub){ const m=document.createElement('small'); m.textContent=sub; s.appendChild(m); } const b=document.createElement('button'); b.type='button'; b.className='b'; b.textContent=btn; b.onclick=fn; r.appendChild(s); r.appendChild(b); return r; };
    box('ct_hidden_h',hid,a=>R(a,'',T('btn_ct_show'),()=>{ hpCtrHide(a,false); }));
    box('ct_trash_h',tr,a=>R(a,TF('ct_tr_left',{n:hpCtrLeft(M[a].tr,now)}),T('btn_ct_back'),()=>{ const who=hpCtrName(a)||hpIdShort(a); hpCtrBack(a); try{ hpToast(TF('ct_done_back',{who:who}),3000); }catch(e){} }));
  }catch(e){} }
renderConvList=function(){
  const el=document.getElementById('convlist'); if(!el)return; el.innerHTML=''; hpCtCss();
  if(!ID){ el.innerHTML='<div class="note">'+T('lg_needid')+'</div>'; return; }
  try{ if(typeof hpVaultOn==='function'&&!hpVaultOn()){ const w=document.createElement('div'); w.id='hist-unsafe'; w.style.cssText='margin-bottom:8px'; const nt=document.createElement('div'); nt.className='note'; nt.textContent=T('nt_hist_unsafe'); w.appendChild(nt);
      const go=document.createElement('button'); go.className='b'; go.id='btn-hist-protect'; go.style.marginTop='6px'; go.textContent=T('btn_hist_protect'); go.onclick=()=>{ try{ if(typeof hpGoCard==='function'){ hpGoCard('vault-card'); return; } document.getElementById('t-id').click(); const c=document.getElementById('vault-card'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){} }; w.appendChild(go); el.appendChild(w); } }catch(e){}
  const lo=lastOpenLoad(), rows=[], cs=contacts(), known=new Set(cs.map(c=>c.address));
  const add=(c,off)=>{ if(hpCtrHidden(c.address)) return; const h=histLoad(c.address); if(off&&!h.length) return; const last=h.length?h[h.length-1]:null; const un=h.filter(x=>x.d==='p'&&histOrd(x)>(lo[c.address]||0)), unread=un.length; rows.push({c,off,last,unread,ts:last?histOrd(last):0,pv:unread?un[un.length-1]:last}); };
  for(const c of cs) add(c,false);
  try{ for(const o of p2pOrphans()) if(!known.has(o.address)) add({address:o.address,nick:hpCtrName(o.address)},true); }catch(e){}
  rows.sort((a,b)=>(b.ts-a.ts)||String(a.c.nick||a.c.address).localeCompare(String(b.c.nick||b.c.address)));
  if(!rows.length){ const w=document.createElement('div'); w.className='note'; w.textContent=T('ct_empty'); el.appendChild(w); hpCtrBoxes(el); return; }
  for(const r of rows){
    const it=document.createElement('div'); it.className='conv-item';
    const av=document.createElement('div'); av.className='av'; av.textContent=String(r.c.nick||'?').slice(0,1).toUpperCase();
    const body=document.createElement('div'); body.className='body';
    const nm=document.createElement('div'); nm.className='name'; const n1=document.createElement('span'); n1.textContent=(r.c.nick||hpIdShort(r.c.address))+(r.off?T('ct_off_book'):''); nm.appendChild(n1);
    if(r.last){ const tm=document.createElement('time'); tm.textContent=fmtTS(r.last.ts); nm.appendChild(tm); }
    const pv=document.createElement('div'); pv.className='prev'; { const dd=(typeof hpDeadPeer==='function')&&hpDeadPeer(r.c.address), bb=(typeof hpBlkOn==='function')&&hpBlkOn(r.c.address); pv.textContent=(dd?T('conv_dead')+' ':bb?T('conv_blocked')+' ':'')+convPreview(r.pv); }
    try{ if(!r.off&&typeof hpAvFill==='function') hpAvFill(av,r.c); }catch(e){} body.appendChild(nm); body.appendChild(pv); it.appendChild(av); it.appendChild(body);
    if(r.unread){ const ub=document.createElement('span'); ub.className='unread'; ub.textContent=String(r.unread); it.appendChild(ub); }
    it.onclick=()=>openConversation(r.c.address); try{ hpCtrPress(it,r.c.address); }catch(e){}
    el.appendChild(it);
  }
  hpCtrBoxes(el);
};
try{ if(typeof renderContacts==='function'&&!renderContacts.__ctr){ const f=renderContacts; renderContacts=Object.assign(function(){ const v=f.apply(this,arguments);
    try{ const list=document.getElementById('contact-list'), cs=contacts(); if(!list||!list.querySelectorAll) return v; const rows=list.querySelectorAll('.contact-item');
      cs.forEach((c,i)=>{ const row=rows[i]; if(!row) return; const mn=row.querySelector('.cmenu'); if(!mn) return; const n=histLoad(c.address).length; const who=c.nick||hpIdShort(c.address);
        const mk=(txt,fn)=>{ const b=document.createElement('button'); b.type='button'; b.textContent=txt; b.onclick=ev=>{ try{ ev.stopPropagation(); }catch(_){} mn.classList.remove('on'); fn(); }; const ref=mn.children&&mn.children.length>=2?mn.children[mn.children.length-2]:null; if(ref) mn.insertBefore(b,ref); else mn.appendChild(b); };
        if(n){ mk(T('btn_ct_hide'),()=>{ hpCtrHide(c.address,true); try{ hpToast(TF('ct_done_hide',{who:who}),4000); }catch(e){} });
          mk(T('btn_ct_del'),async()=>{ if(!(await hpAsk({text:TF('cf_ct_del',{who:who,n:n}),danger:true,ok:T('btn_ct_del')}))) return; hpCtrDel(c.address); try{ hpToast(TF('ct_done_del',{who:who}),4000); }catch(e){} }); } }); }catch(e){} return v; },f,{__ctr:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof setInterval==='function'&&typeof document!=='undefined'&&document&&document.addEventListener) setTimeout(()=>{ try{ hpCtrTick(); }catch(e){} setInterval(()=>{ try{ hpCtrTick(); }catch(e){} },6*3600e3); },50000); }catch(e){}
try{ if(typeof hpWayPlay==='function'&&!hpWayPlay.__off){ hpWayPlay=Object.assign(function(){ return ''; },{__off:1}); } }catch(e){}

function hpStBarModel(u){ try{ if(!u||!(u.cap>0)) return null; const cap=u.cap, use=Math.max(0,Number(u.usage)||0), ph=Math.max(0,Number(u.blobs)||0), hi=Math.max(0,Number(u.hist)||0), ot=Math.max(0,use-ph-hi);
    const pct=Math.round(use/cap*1000)/10, lv=pct>=90?2:pct>=80?1:0, w=x=>Math.max(0,Math.min(100,x/cap*100));
    let left=100; const seg=[]; for(const [k,v] of [['ph',ph],['hi',hi],['ot',ot]]){ const ww=Math.min(left,w(v)); left-=ww; seg.push({k:k,w:Math.round(ww*10)/10,s:v}); }
    return {pct:pct,lv:lv,seg:seg,free:Math.max(0,cap-use),use:use,cap:cap}; }catch(e){ return null; } }
function hpStBarCss(){ try{ if(typeof document==='undefined'||!document.getElementById||document.getElementById('hp-stbar-css')) return; const st=document.createElement('style'); st.id='hp-stbar-css';
    st.textContent='.stb{margin:8px 0 10px}.stb .hd{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-size:13px;margin-bottom:4px}.stb .hd b{font-size:15px}.stb .hd b.l1{color:#f59e0b}.stb .hd b.l2{color:#ef4444}.stb .hd span{color:var(--dim)}.stb .bar{display:flex;height:16px;border-radius:8px;background:var(--line,#2a3a5a);overflow:hidden;border:1px solid #2f4266}.stb .bar i{display:block;height:100%}.stb .bar i.ph{background:#2dd4bf}.stb .bar i.hi{background:#99f6e4}.stb .bar i.ot{background:#64748b}.stb.l1 .bar i.ph{background:#f59e0b}.stb.l1 .bar i.hi{background:#fde68a}.stb.l2 .bar i.ph{background:#ef4444}.stb.l2 .bar i.hi{background:#fca5a5}.stb .lg{display:flex;flex-wrap:wrap;gap:2px 12px;font-size:12px;color:var(--dim);margin-top:4px}.stb .lg em{display:inline-block;width:9px;height:9px;border-radius:2px;margin-right:4px;font-style:normal;vertical-align:baseline}';
    document.head.appendChild(st); }catch(e){} }
function hpStBarEl(u,id){ const M=hpStBarModel(u); if(!M) return null; hpStBarCss(); const D=t=>document.createElement(t);
  const w=D('div'); w.className='stb'+(M.lv?' l'+M.lv:''); if(id) w.id=id;
  const hd=D('div'); hd.className='hd'; const a=D('div'); const t=D('span'); t.textContent=T('st_bar_title')+' '; const b=D('b'); b.className=M.lv?'l'+M.lv:''; b.textContent=hpStPct(M.use/M.cap*100); a.appendChild(t); a.appendChild(b); const f=D('span'); f.textContent=TF('st_bar_free',{s:hpStSz(M.free)}); hd.appendChild(a); hd.appendChild(f); w.appendChild(hd);
  const bar=D('div'); bar.className='bar'; for(const s of M.seg){ if(!(s.s>0)) continue; const i=D('i'); i.className=s.k; i.style.width=s.w+'%'; i.style.minWidth='3px'; bar.appendChild(i); } w.appendChild(bar);
  const lg=D('div'); lg.className='lg'; for(const s of M.seg){ if(s.k==='ot'&&!(s.s>0)) continue; const x=D('span'); const em=D('em'); em.style.background=s.k==='ph'?(M.lv===2?'#ef4444':M.lv?'#f59e0b':'#2dd4bf'):s.k==='hi'?(M.lv===2?'#fca5a5':M.lv?'#fde68a':'#99f6e4'):'#64748b'; x.appendChild(em); x.appendChild(document.createTextNode(TF(s.k==='ph'?'st_bar_ph':s.k==='hi'?'st_bar_hi':'st_bar_ot',{s:hpStSz(s.s)}))); lg.appendChild(x); } w.appendChild(lg);
  return w; }
async function hpStBarPut(host,id,before){ try{ if(!host) return false; const u=(typeof hpHUsage==='function')?await hpHUsage():null; const el=u&&u.quota?hpStBarEl(u,id):null; const old=document.getElementById(id); if(old) old.remove(); if(!el) return false;
    if(before&&before.parentNode===host) host.insertBefore(el,before); else host.insertBefore(el,host.firstChild); return true; }catch(e){ return false; } }
try{ if(typeof hpStoreUi==='function'&&!hpStoreUi.__stb){ const f=hpStoreUi; hpStoreUi=Object.assign(function(){ const r=f.apply(this,arguments); try{ const sb=document.getElementById('store-bar'); if(sb){ sb.style.display='none'; hpStBarPut(sb.parentNode,'st-bar2',sb); if(typeof hpStDup==='function') hpStDup(); } }catch(e){} return r; },f,{__stb:1}); } }catch(e){}
try{ if(typeof hpAlUi==='function'&&!hpAlUi.__stb){ const f=hpAlUi; hpAlUi=Object.assign(async function(){ const r=await f.apply(this,arguments); try{ const s=document.getElementById('p-album'); const c=s&&s.querySelector?s.querySelector('.card'):null; if(c) await hpStBarPut(c,'al-stbar',c.firstChild); }catch(e){} return r; },f,{__stb:1}); } }catch(e){}

const HP_CT_DIFF=[['ct_df_q1','btn_mute','ct_df_a1'],['ct_df_q2','btn_ct_hide','ct_df_a2'],['ct_df_q3','btn_del','ct_df_a3'],['ct_df_q4','btn_block','ct_df_a4'],['ct_df_q5','btn_ct_del','ct_df_a5']];
function hpCtDiffCss(){ try{ if(typeof document==='undefined'||!document.getElementById||document.getElementById('hp-ctdf-css')) return; const st=document.createElement('style'); st.id='hp-ctdf-css';
    st.textContent='#ctdf-sheet{position:fixed;inset:0;z-index:95}#ctdf-sheet .bg{position:absolute;inset:0;background:rgba(0,0,0,.5)}#ctdf-sheet .pane{position:absolute;left:0;right:0;bottom:0;max-width:560px;max-height:86vh;overflow:auto;margin:0 auto;background:var(--panel,#121a2b);border-radius:16px 16px 0 0;padding:12px 14px calc(14px + env(safe-area-inset-bottom,0px))}#ctdf-sheet .hd{position:relative;text-align:center;padding:2px 40px 10px}#ctdf-sheet .hd b{font-size:16px}#ctdf-sheet .x{position:absolute;right:0;top:-4px;font-size:22px;line-height:1;padding:6px 10px;border:none;background:none;color:var(--ink,#e6eefc)}#ctdf-sheet .rw{padding:10px 2px;border-top:1px solid var(--line,#2a3a5a)}#ctdf-sheet .rw .q{font-size:14px;font-weight:700}#ctdf-sheet .rw .b{display:inline-block;margin:6px 0 4px;padding:3px 10px;border:1px solid var(--line,#2a3a5a);border-radius:8px;font-size:13px}#ctdf-sheet .rw .b.hv{border-color:#ef4444;color:#f87171}#ctdf-sheet .rw .a{font-size:13px;color:var(--dim);line-height:1.6}#ctdf-sheet .nt{font-size:12px;color:var(--dim);padding-top:8px}.contact-item .cmenu button.hv{border-color:#ef4444;color:#f87171}.contact-item .cmenu button.df{color:var(--dim)}';
    document.head.appendChild(st); }catch(e){} }
function hpCtDiffOpen(){ try{ hpCtDiffCss(); const old=document.getElementById('ctdf-sheet'); if(old) old.remove(); const D=t=>document.createElement(t);
    const w=D('div'); w.id='ctdf-sheet'; const bg=D('div'); bg.className='bg'; const p=D('div'); p.className='pane'; w.appendChild(bg); w.appendChild(p); const close=()=>{ try{ w.remove(); }catch(e){} }; bg.onclick=close;
    const hd=D('div'); hd.className='hd'; const t=D('b'); t.textContent=T('ct_df_title'); const x=D('button'); x.type='button'; x.className='x'; x.textContent='✕'; x.setAttribute('aria-label',T('btn_close')); x.onclick=close; hd.appendChild(t); hd.appendChild(x); p.appendChild(hd);
    HP_CT_DIFF.forEach(([q,b,a],i)=>{ const r=D('div'); r.className='rw'; const qq=D('div'); qq.className='q'; qq.textContent=T(q); const bb=D('div'); bb.className='b'+(i>=2?' hv':''); bb.textContent=T(b); const aa=D('div'); aa.className='a'; aa.textContent=T(a); r.appendChild(qq); r.appendChild(bb); r.appendChild(aa); p.appendChild(r); });
    const nt=D('div'); nt.className='nt'; nt.textContent=T('ct_df_note'); p.appendChild(nt); document.body.appendChild(w); return true; }catch(e){ return false; } }
function hpCtMenuOrder(mn){ try{ if(!mn||!mn.children) return 0; const B=[...mn.children].filter(e=>e.tagName==='BUTTON'); const by=k=>B.find(b=>k.some(x=>b.textContent===T(x)));
    const L=[by(['btn_rename']),by(['btn_safety']),by(['btn_mute','btn_unmute']),by(['btn_ct_hide']),by(['btn_del']),by(['btn_block','btn_unblock']),by(['btn_ct_del'])].filter(Boolean); if(L.length<4) return 0;
    for(const b of L){ mn.appendChild(b); if(b.textContent===T('btn_del')||b.textContent===T('btn_block')||b.textContent===T('btn_ct_del')) b.classList.add('hv'); }
    for(const b of B) if(L.indexOf(b)<0&&!b.classList.contains('df')) mn.appendChild(b);
    let df=[...mn.children].find(e=>e.classList&&e.classList.contains('df')); if(!df){ df=document.createElement('button'); df.type='button'; df.className='df'; df.textContent=T('btn_ct_diff'); df.onclick=ev=>{ try{ ev.stopPropagation(); }catch(_){} mn.classList.remove('on'); hpCtDiffOpen(); }; } mn.appendChild(df);
    return L.length; }catch(e){ return 0; } }
try{ if(typeof renderContacts==='function'&&!renderContacts.__ord){ const f=renderContacts; renderContacts=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpCtDiffCss(); const list=document.getElementById('contact-list'); if(list&&list.querySelectorAll) for(const mn of list.querySelectorAll('.contact-item .cmenu')) hpCtMenuOrder(mn); }catch(e){} return v; },f,{__ord:1}); } }catch(e){}
try{ if(typeof hpCtrMenu==='function'&&!hpCtrMenu.__df){ const f=hpCtrMenu; hpCtrMenu=Object.assign(function(){ const r=f.apply(this,arguments); try{ const p=document.querySelector('#ctr-sheet .pane'); if(p){ const b=document.createElement('button'); b.type='button'; b.className='b'; b.textContent=T('btn_ct_diff'); b.onclick=()=>{ try{ document.getElementById('ctr-sheet').remove(); }catch(e){} hpCtDiffOpen(); }; p.appendChild(b); } }catch(e){} return r; },f,{__df:1}); } }catch(e){}
function hpStSz(n){ n=Number(n)||0; return n>=1073741824?(Math.round(n/107374182.4)/10)+' GB':hpHMB(n); }
function hpStPct(p){ p=Number(p)||0; if(!(p>0)) return '0%'; if(p>=100) return Math.round(p)+'%'; return String(Number(p.toPrecision(2)))+'%'; }
function hpStDup(){ try{ const E=id=>document.getElementById(id); for(const id of ['store-use','store-parts']){ const e=E(id); if(e) e.style.display='none'; }
    const p=E('store-parts'); if(p&&p.parentNode&&typeof HPH_PERSIST!=='undefined'&&HPH_PERSIST!==null){ let n=E('st-persist'); if(!n){ n=document.createElement('div'); n.id='st-persist'; n.className='note'; p.parentNode.insertBefore(n,p.nextSibling); } n.textContent=T(HPH_PERSIST?'st_persist_on':'st_persist_off'); } return true; }catch(e){ return false; } }

try{ if(typeof document!=='undefined'&&document&&document.head&&!document.getElementById('hp-rc2-css')){ const st=document.createElement('style'); st.id='hp-rc2-css';
    st.textContent='html #msgs .m.has-rc{margin-bottom:14px}html #msgs .m .rc{top:calc(100% - 9px);gap:2px}html #msgs .m .rc span{font-size:13px;line-height:1;padding:2px 5px;background:#1b2740;border:1px solid #2f4266;border-radius:10px;box-shadow:0 1px 3px rgba(0,0,0,.35)}';
    document.head.appendChild(st); } }catch(e){}

function hpDlAdmRm(){ let k=0; try{ if(typeof document==='undefined'||!document.createElement||typeof hpDevRows!=='function'||typeof hpDlRow!=='function') return 0; const rmT=T('btn_dev_rm'), child=(typeof hpIsChild==='function')&&hpIsChild()&&typeof hpMvPaperFlow==='function';
    hpDevRows().forEach((d,i)=>{ try{ if(!d||d.role!=='main'||d.me) return; const row=hpDlRow(i); if(!row||!row.querySelectorAll) return;
      for(const b of Array.from(row.querySelectorAll('button'))) if(b.textContent===rmT&&!b.classList.contains('dv-admin')) b.remove();
      if(row.querySelector('.dv-adm-mv')) { k++; return; } const nm=row.querySelector('.nm'); if(!nm) return;
      const n=document.createElement('span'); n.className='dv-adm-nt'; n.style.cssText='white-space:normal;color:var(--dim)'; n.textContent=T('dv_adm_rm_nt'); nm.appendChild(n);
      if(child){ const b=document.createElement('button'); b.type='button'; b.className='b dv-adm-mv'; b.textContent=T('btn_mv_paper'); b.onclick=ev=>{ try{ ev.stopPropagation(); }catch(_){} hpMvPaperFlow(); }; row.appendChild(b); k++; } }catch(e){} });
    let st=document.getElementById('hp-admrm-css'); if(k&&!st){ st=document.createElement('style'); st.id='hp-admrm-css'; st.textContent='#btn-mv-paper{display:none}'; document.head.appendChild(st); } else if(!k&&st) st.remove();
  }catch(e){} return k; }
try{ if(typeof hpDlRows==='function'&&!hpDlRows.__admrm){ const f=hpDlRows; hpDlRows=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpDlAdmRm(); }catch(e){} return r; },f,{__admrm:1}); } }catch(e){}
try{ if(typeof document!=='undefined'&&document&&document.head&&!document.getElementById('hp-nored-css')){ const st=document.createElement('style'); st.id='hp-nored-css'; st.textContent='html .contact-item .cmenu button.hv,html .contact-item .cmenu button.del{border-color:var(--line,#2a3a5a);color:var(--ink,#e6eefc)}html #ctdf-sheet .rw .b.hv{border-color:var(--line,#2a3a5a);color:var(--ink,#e6eefc)}html .contact-item .cmenu button:not(.hv)+button.hv,html .contact-item .cmenu button.hv+button:not(.hv){margin-top:12px}'; document.head.appendChild(st); } }catch(e){}

const HP_ALF_WAIT=120000;
function hpAlfNames(ids){ try{ const S=(typeof hpSibs==='function')?hpSibs():[], sep=(typeof hpSep==='function')?hpSep():'・'; return S.filter(d=>!ids||ids.indexOf(d.dev)>=0).map(d=>d.label?((typeof hpDevName==='function')?hpDevName(d.label):d.label):String(d.dev).slice(0,10)+'…').join(sep); }catch(e){ return ''; } }
function hpAlfMiss(){ try{ const S=(typeof hpSibs==='function')?hpSibs():[], open=(typeof sibOpenIds==='function')?sibOpenIds():[]; return S.map(d=>d.dev).filter(d=>open.indexOf(d)<0); }catch(e){ return []; } }
function hpAlfWait(ms){ return new Promise(res=>{ const t0=Date.now(); const tick=()=>{ let n=0; try{ n=sibOpenIds().length; }catch(e){ n=0; } if(n){ res(true); return; } if(Date.now()-t0>=ms){ res(false); return; } setTimeout(tick,1500); }; tick(); }); }
try{ if(typeof hpAlFetch==='function'&&!hpAlFetch.__wait){ const f=hpAlFetch; hpAlFetch=Object.assign(async function(list){
    let open=0; try{ open=sibOpenIds().length; }catch(e){ open=0; }
    if(!open){ const all=hpAlfNames(null); const go=await hpAsk({text:TF('al_fetch_open',{devs:all||'—'}),ok:T('btn_al_wait'),cancel:T('btn_close')}); if(!go) return {ok:0,ng:0,nolink:1,stop:1,devs:all};
      try{ hpToast(T('al_fetch_waiting'),HP_ALF_WAIT); }catch(e){} const ok=await hpAlfWait(HP_ALF_WAIT); try{ if(typeof hpToastHide==='function') hpToastHide(); }catch(e){} if(!ok) return {ok:0,ng:0,nolink:1,devs:all}; }
    try{ hpToast(T('al_fetch_now'),2400); }catch(e){} const r=await f.apply(this,arguments); try{ const miss=hpAlfMiss(); if(miss.length) r.miss=hpAlfNames(miss); }catch(e){} return r; },f,{__wait:1}); } }catch(e){}
function hpAlfMsg(q){ try{ if(q.stop) return ''; if(q.nolink) return TF('al_fetch_nolink',{devs:q.devs||'—'}); let s=q.ng?(q.ok?TF('al_fetch_ng',{n:q.ok,m:q.ng}):TF('al_fetch_none',{m:q.ng})):TF('al_fetch_done',{n:q.ok}); if(q.ng&&q.miss) s+='\n'+TF('al_fetch_miss',{devs:q.miss}); return s; }catch(e){ return ''; } }
try{ if(typeof hpAlTile==='function'&&!hpAlTile.__why){ const f=hpAlTile; hpAlTile=Object.assign(function(x){ const t=f.apply(this,arguments); try{ if(x&&x.xb&&t&&t.querySelectorAll){ const nb=T('al_nobody'); for(const s of Array.from(t.querySelectorAll('span'))){ if(s.textContent!==nb) continue; s.style.cursor='help'; s.style.pointerEvents='auto'; s.style.textDecoration='underline dotted';
      for(const k of ['pointerdown','pointerup','touchstart']) s.addEventListener(k,e=>{ try{ e.stopPropagation(); }catch(_){} });
      s.addEventListener('click',e=>{ try{ e.stopPropagation(); e.preventDefault(); }catch(_){} hpAsk({text:T('al_nobody_why'),noOk:true,cancel:T('btn_close')}); }); } } }catch(e){} return t; },f,{__why:1}); } }catch(e){}

function hpAvNoBody(x,bot,fr,retry){ try{ if(!x||!bot||!fr||x.tr) return false; const D=t=>document.createElement(t);
    const s=D('span'); s.className='av-nb'; s.textContent='　'+T((x.rec&&x.rec.nb)?'al_none_any':'av_nobody'); s.style.cssText='cursor:help;text-decoration:underline dotted'; s.onclick=e=>{ try{ e.stopPropagation(); }catch(_){} hpAsk({text:T('al_nobody_why'),noOk:true,cancel:T('btn_close')}); }; fr.appendChild(s);
    if(!x.xb) return true; const b=D('button'); b.type='button'; b.className='av-fetch'; b.textContent=T('btn_av_fetch'); b.style.marginRight='8px';
    b.onclick=async e=>{ try{ e.stopPropagation(); }catch(_){} if(b.disabled) return; b.disabled=true; try{ const q=await hpAlFetch([x]); const m=(typeof hpAlfMsg==='function')?hpAlfMsg(q):''; if(m) try{ hpToast(m,(q.ng||q.nolink)?9000:3000); }catch(_){} if(q&&q.ok){ x.xb=false; if(typeof retry==='function') retry(); } }finally{ b.disabled=false; } };
    bot.insertBefore(b,bot.lastChild); return true; }catch(e){ return false; } }

function hpDlMe(){ let k=0; try{ if(typeof document==='undefined'||!document.createElement||typeof hpDevRows!=='function'||typeof hpDlRow!=='function') return 0; const me=T('dv_me'), sep=' · ';
    hpDevRows().forEach((d,i)=>{ try{ if(!d||!d.me) return; const row=hpDlRow(i); if(!row) return; row.style.order='-1'; if(row.parentNode&&row.parentNode.style){ row.parentNode.style.display='flex'; row.parentNode.style.flexDirection='column'; }
      const nm=row.querySelector?row.querySelector('.nm'):null; if(!nm||nm.querySelector('.dv-me-chip')){ k++; return; }
      for(const s of Array.from(nm.children||[])){ if(String(s.tagName||'').toUpperCase()!=='SPAN'||s.className) continue; const t=String(s.textContent||''); if(t.indexOf(me)!==0) continue;
        const tn=Array.from(s.childNodes||[]).find(n=>n&&n.nodeType===3&&String(n.nodeValue||'').indexOf(me)===0); const c=document.createElement('span'); c.className='dv-me-chip'; c.textContent=T('dv_me_chip');
        c.style.cssText='display:inline-block;margin:0 6px 0 0;padding:0 8px;border:1px solid var(--teal,#35d1b7);border-radius:10px;background:rgba(53,209,183,.15);color:var(--teal,#35d1b7);font-size:12px;font-weight:700;line-height:1.6;font-family:inherit';
        if(tn&&s.insertBefore){ tn.nodeValue=String(tn.nodeValue).slice(me.length).replace(/^ · /,''); s.insertBefore(c,tn); } else { const rest=t.slice(me.length).replace(/^ · /,''); s.textContent=''; s.appendChild(c); if(rest) s.appendChild(document.createTextNode(rest)); } k++; break; } }catch(e){} }); }catch(e){} return k; }
try{ if(typeof hpDlRows==='function'&&!hpDlRows.__me){ const f=hpDlRows; hpDlRows=Object.assign(function(){ const r=f.apply(this,arguments); try{ hpDlMe(); }catch(e){} return r; },f,{__me:1}); } }catch(e){}

function hpCtMenuHead(){ let k=0; try{ if(typeof document==='undefined'||!document.getElementById) return 0; const list=document.getElementById('contact-list'), cs=(typeof contacts==='function')?contacts():[]; if(!list||!list.querySelectorAll) return 0; const rows=list.querySelectorAll('.contact-item');
    cs.forEach((c,i)=>{ const row=rows[i]; if(!row||!c) return; const mn=row.querySelector('.cmenu'); if(!mn||mn.querySelector('.cm-hd')) return; const h=document.createElement('div'); h.className='cm-hd'; h.textContent=c.nick||((typeof hpIdShort==='function')?hpIdShort(c.address):c.address); mn.insertBefore(h,mn.firstChild); k++; });
    if(!document.getElementById('hp-cmhd-css')){ const st=document.createElement('style'); st.id='hp-cmhd-css'; st.textContent='.contact-item .cmenu .cm-hd{font-weight:700;font-size:14px;color:var(--teal,#35d1b7);padding:4px 10px 8px;border-bottom:1px solid var(--line,#2a3a5a);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.contact-item:has(.cmenu.on){outline:2px solid var(--teal,#35d1b7);outline-offset:-2px}'; document.head.appendChild(st); } }catch(e){} return k; }
try{ if(typeof renderContacts==='function'&&!renderContacts.__cmhd){ const f=renderContacts; renderContacts=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpCtMenuHead(); }catch(e){} return v; },f,{__cmhd:1}); } }catch(e){}

function hpAlfRows(){ try{ const S=(typeof hpSibs==='function')?hpSibs():[], open=(typeof sibOpenIds==='function')?sibOpenIds():[]; return S.map(d=>({dev:d.dev,name:d.label?((typeof hpDevName==='function')?hpDevName(d.label):d.label):String(d.dev).slice(0,10)+'…',on:open.indexOf(d.dev)>=0})); }catch(e){ return []; } }
function hpAlfSheet(){ return new Promise(res=>{ try{ if(typeof document==='undefined'||!document.createElement){ res(false); return; } if(typeof hpCtDiffCss==='function') hpCtDiffCss(); const old=document.getElementById('alf-sheet'); if(old) old.remove(); const D=t=>document.createElement(t);
    const w=D('div'); w.id='alf-sheet'; w.style.cssText='position:fixed;inset:0;z-index:10040'; const bg=D('div'); bg.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.55)'; const p=D('div'); p.style.cssText='position:absolute;left:0;right:0;bottom:0;max-width:560px;max-height:86vh;overflow:auto;margin:0 auto;background:var(--panel,#121a2b);border-radius:16px 16px 0 0;padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px));color:var(--ink,#e6eefc)'; w.appendChild(bg); w.appendChild(p);
    const h=D('b'); h.textContent=T('alf_title'); h.style.cssText='display:block;text-align:center;font-size:16px;margin-bottom:8px'; p.appendChild(h); const nt=D('div'); nt.textContent=T('alf_body'); nt.style.cssText='font-size:13px;line-height:1.7;color:var(--dim,#8aa0c0);white-space:pre-line;margin-bottom:8px'; p.appendChild(nt);
    const list=D('div'); p.appendChild(list); const row=D('div'); row.style.cssText='display:flex;gap:8px;justify-content:center;margin-top:12px'; const go=D('button'); go.type='button'; go.className='b pri'; const no=D('button'); no.type='button'; no.className='b'; no.textContent=T('btn_close'); row.appendChild(go); row.appendChild(no); p.appendChild(row);
    let t=null, done=false; const end=v=>{ if(done) return; done=true; if(t) clearInterval(t); try{ w.remove(); }catch(e){} res(v); };
    const draw=()=>{ const R=hpAlfRows(); list.textContent=''; if(!R.length){ const e=D('div'); e.textContent=T('alf_none'); e.style.cssText='font-size:13px;color:var(--dim,#8aa0c0)'; list.appendChild(e); }
      for(const r of R){ const li=D('div'); li.className='alf-row'; li.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 2px;border-top:1px solid var(--line,#2a3a5a);font-size:14px'; const dot=D('span'); dot.textContent=r.on?'●':'○'; dot.style.color=r.on?'var(--teal,#35d1b7)':'var(--dim,#8aa0c0)'; const n=D('span'); n.textContent=r.name; n.style.flex='1'; const s=D('span'); s.textContent=T(r.on?'alf_on':'alf_off'); s.style.cssText='font-size:12px;color:'+(r.on?'var(--teal,#35d1b7)':'var(--dim,#8aa0c0)'); li.appendChild(dot); li.appendChild(n); li.appendChild(s); list.appendChild(li); }
      const k=R.filter(r=>r.on).length; go.textContent=TF('btn_alf_ask',{n:k}); go.disabled=!k; return k; };
    go.onclick=()=>{ if(!go.disabled) end(true); }; no.onclick=()=>end(false); bg.onclick=()=>end(false); draw(); t=setInterval(draw,1500); document.body.appendChild(w);
  }catch(e){ res(false); } }); }
try{ if(typeof hpAlFetch==='function'&&!hpAlFetch.__sheet){ const f=hpAlFetch; hpAlFetch=Object.assign(async function(){ const ok=await hpAlfSheet(); if(!ok) return {ok:0,ng:0,stop:1}; return await f.apply(this,arguments); },f,{__sheet:1}); } }catch(e){}

let HP_AL_DISK_OK=false;
function hpAlfName(dev,label){ try{ const R=(typeof hpDevRows==='function')?hpDevRows():[], r=R.find(x=>x&&x.dev===dev), l=(r&&r.label)||label||''; return l?((typeof hpDevName==='function')?hpDevName(l):l):String(dev||'').slice(0,10)+'…'; }catch(e){ return String(label||dev||''); } }
hpAlfNames=function(ids){ try{ const S=(typeof hpSibs==='function')?hpSibs():[], sep=(typeof hpSep==='function')?hpSep():'・'; return S.filter(d=>!ids||ids.indexOf(d.dev)>=0).map(d=>hpAlfName(d.dev,d.label)).join(sep); }catch(e){ return ''; } };
hpAlfRows=function(){ try{ const S=(typeof hpSibs==='function')?hpSibs():[], open=(typeof sibOpenIds==='function')?sibOpenIds():[]; return S.map(d=>({dev:d.dev,name:hpAlfName(d.dev,d.label),on:open.indexOf(d.dev)>=0})); }catch(e){ return []; } };
function hpAlMark(id,ch){ let n=0; try{ if(!id) return 0; for(const k of Object.keys(HPH_MEM)){ if(k.indexOf('p2p_chat_')!==0) continue; const p=k.slice(9); let h=[]; try{ h=histLoad(p); }catch(e){ h=[]; } let c=false;
      for(const m of h){ const mid=(m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||''; if(mid!==id||m.tr) continue; if(ch==='got'){ if(m.xb||m.nb){ delete m.xb; delete m.nb; c=true; } } else if(ch==='none'){ if(!m.nb){ m.nb=Date.now(); c=true; } } }
      if(c){ histSave(p,h); n++; } } }catch(e){} return n; }
let HP_AL_RE=null; function hpAlRedraw(){ try{ if(HP_AL_RE) clearTimeout(HP_AL_RE); HP_AL_RE=setTimeout(()=>{ HP_AL_RE=null; try{ if(typeof hpAlUi==='function') hpAlUi(); }catch(e){} },400); }catch(e){} }
try{ if(typeof hpAlBlob==='function'&&!hpAlBlob.__got){ const f=hpAlBlob; hpAlBlob=Object.assign(async function(x){ const b=await f.apply(this,arguments); try{ if(b&&x&&(x.xb||(x.rec&&x.rec.nb))&&hpAlMark(x.id,'got')){ x.xb=false; hpAlRedraw(); } }catch(e){} return b; },f,{__got:1}); } }catch(e){}
try{ if(typeof hpAlFetch==='function'&&!hpAlFetch.__nb){ const f=hpAlFetch; hpAlFetch=Object.assign(async function(list){ const r=await f.apply(this,arguments);
    try{ if(r&&!r.stop&&!r.nolink){ for(const x of (list||[])){ if(!x||!x.id) continue; let b=null; try{ b=await blobGet(x.id); }catch(e){ b=null; } if(b) hpAlMark(x.id,'got'); else if(!r.miss&&r.ng) hpAlMark(x.id,'none'); } hpAlRedraw(); } }catch(e){} return r; },f,{__nb:1}); } }catch(e){}
try{ if(typeof hpAlNoBody==='function'&&!hpAlNoBody.__z){ const f=hpAlNoBody; hpAlNoBody=Object.assign(function(id,sz){ const v=f.apply(this,arguments); if(v) return v; try{ if(id&&sz&&sz.size===0&&HP_AL_DISK_OK&&!(typeof HPB_MEM!=='undefined'&&HPB_MEM&&HPB_MEM.has&&HPB_MEM.has(id))) return true; }catch(e){} return v; },f,{__z:1}); } }catch(e){}
try{ if(typeof hpKeepSizes==='function'&&!hpKeepSizes.__ok){ const f=hpKeepSizes; hpKeepSizes=Object.assign(async function(){ let ok=false; try{ ok=typeof hpHDisk==='function'&&!!hpHDisk()&&!!(await hpBDbOpen()); }catch(e){ ok=false; } HP_AL_DISK_OK=ok; return await f.apply(this,arguments); },f,{__ok:1}); } }catch(e){}
try{ if(typeof hpAlTile==='function'&&!hpAlTile.__nb){ const f=hpAlTile; hpAlTile=Object.assign(function(x){ const t=f.apply(this,arguments); try{ if(x&&x.rec&&x.rec.nb&&t&&t.querySelectorAll){ const nb=T('al_nobody'); for(const s of Array.from(t.querySelectorAll('span'))) if(s.textContent===nb) s.textContent=T('al_none_any'); } }catch(e){} return t; },f,{__nb:1}); } }catch(e){}

function hpAlfState(dev){ try{ const open=(typeof sibOpenIds==='function')?sibOpenIds():[]; if(open.indexOf(dev)>=0) return 'on'; const s=(typeof SIB!=='undefined'&&SIB)?SIB[dev]:null; if(s&&s.state==='connecting'&&(s.role==='answer'||s.ans)) return 'conn'; return 'off'; }catch(e){ return 'off'; } }
function hpAlfPoke(){ let n=0; try{ if(typeof sibCan!=='function'||!sibCan()||typeof sibTargets!=='function'||typeof sibCall!=='function') return 0; const now=Date.now();
    for(const dev of sibTargets()){ if(typeof SIB!=='undefined'&&SIB[dev]) continue; if(typeof SIB_LAST!=='undefined'&&now-(SIB_LAST[dev]||0)<6000) continue; try{ if(typeof SIB_TRY!=='undefined'&&SIB_TRY[dev]){ if(SIB_TRY[dev].timer){ clearTimeout(SIB_TRY[dev].timer); SIB_TRY[dev].timer=null; } SIB_TRY[dev].n=0; } }catch(e){} sibCall(dev).catch(()=>{}); n++; } }catch(e){} return n; }
hpAlfSheet=function(){ return new Promise(res=>{ try{ if(typeof document==='undefined'||!document.createElement){ res(false); return; } const old=document.getElementById('alf-sheet'); if(old) old.remove(); const D=t=>document.createElement(t);
    const w=D('div'); w.id='alf-sheet'; w.style.cssText='position:fixed;inset:0;z-index:10040'; const bg=D('div'); bg.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,.55)'; const p=D('div'); p.style.cssText='position:absolute;left:0;right:0;bottom:0;max-width:560px;max-height:86vh;overflow:auto;margin:0 auto;background:var(--panel,#121a2b);border-radius:16px 16px 0 0;padding:14px 14px calc(14px + env(safe-area-inset-bottom,0px));color:var(--ink,#e6eefc)'; w.appendChild(bg); w.appendChild(p);
    const h=D('b'); h.textContent=T('alf_title'); h.style.cssText='display:block;text-align:center;font-size:16px;margin-bottom:8px'; p.appendChild(h); const nt=D('div'); nt.textContent=T('alf_body')+'\n'+T('alf_wait'); nt.style.cssText='font-size:13px;line-height:1.7;color:var(--dim,#8aa0c0);white-space:pre-line;margin-bottom:8px'; p.appendChild(nt);
    const kp=D('div'); kp.className='alf-keep'; kp.textContent=T('alf_keep'); kp.style.cssText='font-size:13px;line-height:1.6;border:1px solid #f5b85c;border-radius:10px;padding:8px 10px;margin-bottom:8px;color:var(--ink,#e6eefc);background:rgba(245,184,92,.10)'; p.appendChild(kp);
    const tm=D('div'); tm.className='alf-time'; tm.style.cssText='font-size:12px;color:var(--teal,#35d1b7);margin-bottom:4px'; p.appendChild(tm);
    const list=D('div'); p.appendChild(list); const row=D('div'); row.style.cssText='display:flex;gap:8px;justify-content:center;margin-top:12px'; const go=D('button'); go.type='button'; go.className='b pri'; const no=D('button'); no.type='button'; no.className='b'; no.textContent=T('btn_close'); row.appendChild(go); row.appendChild(no); p.appendChild(row);
    const t0=Date.now(), since={}; let t=null, tp=null, done=false; const end=v=>{ if(done) return; done=true; if(t) clearInterval(t); if(tp) clearInterval(tp); try{ w.remove(); }catch(e){} res(v); };
    const draw=()=>{ const R=hpAlfRows(), now=Date.now(); list.textContent=''; tm.textContent=TF('alf_time',{s:Math.floor((now-t0)/1000)});
      if(!R.length){ const e=D('div'); e.textContent=T('alf_none'); e.style.cssText='font-size:13px;color:var(--dim,#8aa0c0)'; list.appendChild(e); }
      for(const r of R){ const st=hpAlfState(r.dev); if(st==='conn'){ if(!since[r.dev]) since[r.dev]=now; } else if(st==='on') delete since[r.dev]; else since[r.dev]=0;
        const li=D('div'); li.className='alf-row'; li.style.cssText='display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:8px 2px;border-top:1px solid var(--line,#2a3a5a);font-size:14px';
        const dot=D('span'); dot.textContent=st==='on'?'●':st==='conn'?'◐':'○'; dot.style.color=st==='off'?'var(--dim,#8aa0c0)':'var(--teal,#35d1b7)'; const n=D('span'); n.textContent=r.name; n.style.flex='1';
        const s=D('span'); s.textContent=st==='on'?T('alf_on'):st==='conn'?TF('alf_conn',{s:Math.floor((now-since[r.dev])/1000)}):T('alf_off'); s.style.cssText='font-size:12px;color:'+(st==='off'?'var(--dim,#8aa0c0)':'var(--teal,#35d1b7)');
        li.appendChild(dot); li.appendChild(n); li.appendChild(s);
        if(st!=='on'&&now-t0>=60000){ const hn=D('div'); hn.textContent=T('alf_long'); hn.style.cssText='flex:1 0 100%;font-size:12px;color:#f5b85c;padding-left:18px'; li.appendChild(hn); }
        list.appendChild(li); }
      const k=R.filter(r=>hpAlfState(r.dev)==='on').length; kp.style.display=(R.length&&k<R.length)?'':'none'; go.textContent=TF('btn_alf_ask',{n:k}); go.disabled=!k; return k; };
    go.onclick=()=>{ if(!go.disabled) end(true); }; no.onclick=()=>end(false); bg.onclick=()=>end(false); hpAlfPoke(); draw(); t=setInterval(draw,1000); tp=setInterval(hpAlfPoke,6000); document.body.appendChild(w);
  }catch(e){ res(false); } }); };

function hpAlfOpenNames(){ try{ const miss=hpAlfMiss(), S=(typeof hpSibs==='function')?hpSibs():[]; return hpAlfNames(S.map(d=>d.dev).filter(d=>miss.indexOf(d)<0)); }catch(e){ return ''; } }
try{ if(typeof hpAlFetch==='function'&&!hpAlFetch.__open){ const f=hpAlFetch; hpAlFetch=Object.assign(async function(){ const r=await f.apply(this,arguments); try{ if(r&&r.miss&&!r.open) r.open=hpAlfOpenNames()||'—'; }catch(e){} return r; },f,{__open:1}); } }catch(e){}
hpAlfMsg=function(q){ try{ if(!q||q.stop) return ''; if(q.nolink) return TF('al_fetch_nolink',{devs:q.devs||'—'}); let s;
    if(q.ng&&q.miss){ const o=q.open||'—'; s=(q.ok?TF('al_fetch_ng_miss',{n:q.ok,m:q.ng,open:o}):TF('al_fetch_none_miss',{open:o}))+'\n'+TF('al_fetch_miss2',{devs:q.miss}); }
    else s=q.ng?(q.ok?TF('al_fetch_ng',{n:q.ok,m:q.ng}):TF('al_fetch_none',{m:q.ng})):TF('al_fetch_done',{n:q.ok}); return s; }catch(e){ return ''; } };

const HP_ALF_FROM={};
try{ if(typeof sibFetchBlob==='function'&&!sibFetchBlob.__from){ const f=sibFetchBlob; sibFetchBlob=Object.assign(function(id){ const p=f.apply(this,arguments); try{ const w=(typeof BLOBWAIT!=='undefined'&&BLOBWAIT)?BLOBWAIT[id]:null; if(w&&p&&p.then) p.then(b=>{ try{ if(b&&w.cur) HP_ALF_FROM[id]=w.cur; }catch(e){} }); }catch(e){} return p; },f,{__from:1}); } }catch(e){}
try{ if(typeof hpAlBlob==='function'&&!hpAlBlob.__from){ const f=hpAlBlob; hpAlBlob=Object.assign(async function(x){ const xb=!!(x&&x.xb); try{ if(x&&x.id) delete HP_ALF_FROM[x.id]; }catch(e){} const b=await f.apply(this,arguments);
    try{ const d=x&&x.id?HP_ALF_FROM[x.id]:null; if(b&&xb&&d&&document.getElementById('hp-al-view')) hpToast(TF('av_got',{dev:hpAlfName(d)}),4000); }catch(e){} return b; },f,{__from:1}); } }catch(e){}

try{ if(typeof hpAvNoBody==='function'&&!hpAvNoBody.__nosv){ const f=hpAvNoBody; hpAvNoBody=Object.assign(function(x,bot){ const v=f.apply(this,arguments); try{ const sv=bot&&bot.lastChild; if(v&&sv&&sv.className!=='av-fetch'&&sv.style) sv.style.display='none'; }catch(e){} return v; },f,{__nosv:1}); } }catch(e){}
function hpAlThumbOnly(x){ return !!(x&&(x.xb||(x.rec&&x.rec.nb))); }
try{ if(typeof hpAlSave==='function'&&!hpAlSave.__xb){ const f=hpAlSave; hpAlSave=Object.assign(async function(list){ const L=list||[], sk=L.filter(hpAlThumbOnly).length; const k=await f.call(this,L.filter(x=>!hpAlThumbOnly(x)));
    if(sk) setTimeout(()=>{ try{ hpToast(TF('al_save_skip',{n:sk}),4000); }catch(e){} },k?2600:0); return k; },f,{__xb:1}); } }catch(e){}

function hpPasteUrl(s){ return /^(blob:|data:|webkit-fake-url:)\S*$/i.test(String(s||'').trim()); }
function hpPasteGuard(e){ try{ const cd=e&&e.clipboardData; if(!cd) return false; const it=cd.items?Array.from(cd.items):[]; if(!it.some(i=>/^image\//.test(i.type||''))) return false; const tx=cd.getData?cd.getData('text/plain'):'', tu=cd.getData?cd.getData('text/uri-list'):'';
    if(hpPasteUrl(tx)||(!String(tx||'').trim()&&hpPasteUrl(tu))){ e.preventDefault(); return true; } }catch(_){} return false; }
try{ if(typeof document!=='undefined'&&document.addEventListener) document.addEventListener('paste',hpPasteGuard,true); }catch(e){}
try{ if(typeof sendChat==='function'&&!sendChat.__blob){ const f=sendChat; sendChat=Object.assign(function(){ try{ const t=document.getElementById('text'); if(t&&hpPasteUrl(t.value)) t.value=''; }catch(e){} return f.apply(this,arguments); },f,{__blob:1}); } }catch(e){}

let HP_SV_LAST=null;
function hpAlSetMark(ids,o){ let n=0; try{ const S=new Set(ids||[]); if(!S.size) return 0; for(const k of Object.keys(HPH_MEM)){ if(k.indexOf('p2p_chat_')!==0) continue; const p=k.slice(9); let h=[]; try{ h=histLoad(p); }catch(e){ h=[]; } let c=false;
      for(const m of h){ const id=(m&&m.img&&m.img.id)||(m&&m.file&&m.file.id)||''; if(!id||!S.has(id)||m.tr) continue; Object.assign(m,o); c=true; } if(c){ histSave(p,h); n++; } } }catch(e){} return n; }
function hpAvRefresh(){ try{ const v=document.getElementById('hp-al-view'); if(v&&typeof v.__show==='function'){ v.__show(); return true; } }catch(e){} return false; }
function hpAvWhere(x,fr){ try{ if(!x||!fr||!x.sv||hpAlThumbOnly(x)) return ''; const w=x.svw||(x.rec&&x.rec.svw)||'', n=x.svn||(x.rec&&x.rec.svn)||''; if(!w) return '';
    const and=typeof navigator!=='undefined'&&/Android/i.test(navigator.userAgent||''); const s=w==='ios'?T('al_where_ios'):w==='zip'?TF('al_where_zip',{name:n}):TF(and?'al_where_and':'al_where_pc',{name:n});
    fr.style.whiteSpace='pre-line'; fr.textContent=fr.textContent+'\n'+s; return s; }catch(e){ return ''; } }
try{ if(typeof hpBlobDownload==='function'&&!hpBlobDownload.__where){ const f=hpBlobDownload; hpBlobDownload=Object.assign(async function(blob,name){ const r=await f.apply(this,arguments);
    try{ if(r){ const ios=(typeof hpIsIOS==='function'&&hpIsIOS())&&/^image\//.test((blob&&blob.type)||'')&&typeof navigator!=='undefined'&&!!navigator.canShare; HP_SV_LAST={n:String(name||''),k:ios?'ios':(/\.zip$/i.test(String(name||''))?'zip':'dl')}; } }catch(e){} return r; },f,{__where:1}); } }catch(e){}
try{ if(typeof hpAlSave==='function'&&!hpAlSave.__where){ const f=hpAlSave; hpAlSave=Object.assign(async function(list){ HP_SV_LAST=null; const t0=Date.now(); const k=await f.apply(this,arguments);
    try{ if(k>0){ const w=HP_SV_LAST||{n:'',k:'ios'}, L=(list||[]).filter(x=>x&&x.sv&&x.sv>=t0&&!hpAlThumbOnly(x)); for(const x of L){ x.svw=w.k; x.svn=w.n; } hpAlSetMark(L.map(x=>x.id),{svw:w.k,svn:w.n}); hpAvRefresh(); } }catch(e){} return k; },f,{__where:1}); } }catch(e){}
async function hpAvAskSave(L,dev){ try{ const A=(L||[]).filter(x=>x&&x.id&&!x.sv&&!hpAlThumbOnly(x)&&!(x.rec&&x.rec.sva)&&!x.sva); if(!A.length) return false;
    const ios=typeof hpIsIOS==='function'&&hpIsIOS(); const txt=A.length>1?TF('av_ask_save_n',{n:A.length}):dev?TF('av_ask_save',{dev:dev}):T('av_ask_save1');
    const ok=await hpAsk({text:txt,ok:T(ios?'btn_al_save1_ios':'btn_al_save1'),cancel:T('btn_al_later')});
    if(!ok){ for(const x of A) x.sva=1; hpAlSetMark(A.map(x=>x.id),{sva:Date.now()}); return false; }
    const k=await hpAlSave(A); if(k) try{ hpToast(TF('al_done_save',{n:k}),2400); }catch(e){} return k>0; }catch(e){ return false; } }
try{ if(typeof hpAlFetch==='function'&&!hpAlFetch.__ask){ const f=hpAlFetch; hpAlFetch=Object.assign(async function(list){ const r=await f.apply(this,arguments);
    try{ if(r&&r.ok>0&&!r.stop){ const got=[]; for(const x of (list||[])){ if(!x||!x.id) continue; let b=null; try{ b=await blobGet(x.id); }catch(e){ b=null; } if(b){ x.xb=false; got.push(x); } }
      const d=got.length===1&&typeof HP_ALF_FROM!=='undefined'?HP_ALF_FROM[got[0].id]:null; if(got.length) setTimeout(()=>{ hpAvAskSave(got,d?hpAlfName(d):''); },600); } }catch(e){} return r; },f,{__ask:1}); } }catch(e){}
try{ if(typeof hpAlBlob==='function'&&!hpAlBlob.__ask){ const f=hpAlBlob; hpAlBlob=Object.assign(async function(x){ const xb=!!(x&&x.xb); const b=await f.apply(this,arguments);
    try{ const d=x&&x.id&&typeof HP_ALF_FROM!=='undefined'?HP_ALF_FROM[x.id]:null; if(b&&xb&&d&&document.getElementById('hp-al-view')){ x.xb=false; setTimeout(()=>{ hpAvAskSave([x],hpAlfName(d)); },600); } }catch(e){} return b; },f,{__ask:1}); } }catch(e){}

try{ if(typeof hpAlBlob==='function'&&!hpAlBlob.__re){ const f=hpAlBlob; hpAlBlob=Object.assign(async function(x){ const xb=!!(x&&(x.xb||(x.rec&&x.rec.nb))); const b=await f.apply(this,arguments); try{ if(b&&xb){ x.xb=false; if(x.rec) delete x.rec.nb; if(typeof hpAlRedraw==='function') hpAlRedraw(); } }catch(e){} return b; },f,{__re:1}); } }catch(e){}

async function hpAlvDel(w){ try{ const x=w&&typeof w.__at==='function'?w.__at():null; if(!x||!x.id) return false; if(x.p){ try{ hpToast(T('alv_del_pend'),3000); }catch(e){} return false; }
    const ok=await hpAsk({text:T('cf_alv_del'),ok:T('btn_alv_del'),danger:true}); if(!ok) return false; const k=await hpKeepDropList([x]); if(!k) return false;
    try{ hpToast(TF('al_done_del',{n:k}),3000); }catch(e){} try{ if(typeof w.__drop==='function') w.__drop(); }catch(e){} try{ if(typeof hpAlRedraw==='function') hpAlRedraw(); }catch(e){} try{ if(typeof hpStoreUi==='function') hpStoreUi(); }catch(e){} return true; }catch(e){ return false; } }
try{ if(typeof hpAlView==='function'&&!hpAlView.__del){ const f=hpAlView; hpAlView=Object.assign(function(){ const v=f.apply(this,arguments); try{ const w=document.getElementById('hp-al-view'), bot=w&&w.querySelector?w.querySelector('.av-bot'):null; if(v&&bot&&!bot.querySelector('.alv-del')){
      const b=document.createElement('button'); b.type='button'; b.className='alv-del'; b.textContent=T('btn_alv_del'); b.style.marginRight='8px'; b.onclick=async e=>{ try{ e.stopPropagation(); }catch(_){} if(b.disabled) return; b.disabled=true; try{ await hpAlvDel(w); }finally{ b.disabled=false; } }; bot.insertBefore(b,bot.lastChild); } }catch(e){} return v; },f,{__del:1}); } }catch(e){}

try{ if(typeof hpAlSave==='function'&&!hpAlSave.__rd){ const f=hpAlSave; hpAlSave=Object.assign(async function(){ const k=await f.apply(this,arguments); try{ if(k>0&&typeof hpAlRedraw==='function') hpAlRedraw(); }catch(e){} return k; },f,{__rd:1}); } }catch(e){}

function hpMenuW(){ try{ const b=document.getElementById('btn-bell'), m=document.getElementById('btn-menu'); if(!b||!m) return 0; const w=b.offsetWidth; if(!w) return 0; m.style.minWidth=w+'px'; m.style.textAlign='center'; return w; }catch(e){ return 0; } }
try{ if(typeof window!=='undefined'&&window.addEventListener){ window.addEventListener('resize',()=>{ hpMenuW(); }); setTimeout(hpMenuW,0); setTimeout(hpMenuW,1500); setTimeout(hpMenuW,5000); } }catch(e){}

const HP_LP_MK='⁣hplp:', HP_LP_RE=/⁣hplp:([A-Za-z0-9+/=]+)⁣\s*$/, HP_LP_IMAX=16000, HP_LP_KEY='hp_lp_off';
const HP_LP_IMGH=/^https:\/\/(i\.ytimg\.com|[a-z0-9.-]+\.scdn\.co|[a-z0-9.-]+\.spotifycdn\.com|[a-z0-9.-]+\.sndcdn\.com|upload\.wikimedia\.org|i\.vimeocdn\.com)\//i;
const HP_LP_PROV=[
  {s:'YouTube',re:/^https:\/\/(www\.|m\.)?(youtube\.com\/(watch\?|shorts\/|live\/)|youtu\.be\/)/i,f:u=>'https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(u)},
  {s:'Spotify',re:/^https:\/\/open\.spotify\.com\/(intl-[a-z]+\/)?(track|album|playlist|episode|show|artist)\//i,f:u=>'https://open.spotify.com/oembed?url='+encodeURIComponent(u)},
  {s:'SoundCloud',re:/^https:\/\/(m\.)?soundcloud\.com\/[^/\s]+\/[^/?#\s]+/i,f:u=>'https://soundcloud.com/oembed?format=json&url='+encodeURIComponent(u)},
  {s:'Vimeo',re:/^https:\/\/(www\.)?vimeo\.com\/\d+/i,f:u=>'https://vimeo.com/api/oembed.json?url='+encodeURIComponent(u)},
  {s:'Wikipedia',w:1,re:/^https:\/\/([a-z-]+)(\.m)?\.wikipedia\.org\/wiki\/([^?#\s]+)/i,f:u=>{ const m=/^https:\/\/([a-z-]+)(\.m)?\.wikipedia\.org\/wiki\/([^?#\s]+)/i.exec(u); return 'https://'+m[1].toLowerCase()+'.wikipedia.org/api/rest_v1/page/summary/'+m[3]; }}];
function hpLpB64e(s){ return hpAvB64(new TextEncoder().encode(String(s))); }
function hpLpB64d(b){ return new TextDecoder().decode(hpAvUnb64(b)); }
function hpLpClean(o){ try{ if(!o||typeof o!=='object') return null; const u=String(o.u||''); if(u.length>2000||!/^https:\/\/[^\s]+$/.test(u)) return null; const r={u:u,t:String(o.t||'').replace(/[\u0000-\u001f⁣]/g,' ').trim().slice(0,160),s:String(o.s||'').replace(/[\u0000-\u001f⁣]/g,' ').trim().slice(0,40)};
    const i=String(o.i||''); if(i&&i.length<=Math.ceil(HP_LP_IMAX*4/3)+40&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(i)) r.i=i; if(!r.t&&!r.i) return null; return r; }catch(e){ return null; } }
function hpLpSplit(text){ const s=String(text==null?'':text); const m=HP_LP_RE.exec(s); if(!m) return {t:s,lp:null}; let lp=null; try{ lp=hpLpClean(JSON.parse(hpLpB64d(m[1]))); }catch(e){ lp=null; } const t=s.slice(0,m.index); if(lp&&t.indexOf(lp.u)<0) lp=null; return {t:t,lp:lp}; }
function hpLpStrip(text){ return (typeof text==='string'&&text.indexOf(HP_LP_MK)>=0)?hpLpSplit(text).t:text; }
function hpLpPack(text,lp){ const c=hpLpClean(lp); if(!c) return String(text||''); return String(text||'').replace(/\s+$/,'')+HP_LP_MK+hpLpB64e(JSON.stringify(c))+'⁣'; }
function hpLpUrls(text){ return (String(text||'').match(/https?:\/\/[^\s<>"'）」』】、。]+/g)||[]).map(u=>u.replace(/[.,!?)\]]+$/,'')).slice(0,5); }
function hpLpHost(u){ try{ return new URL(u).hostname.replace(/^www\./i,''); }catch(e){ return ''; } }
function hpLpProv(u){ return HP_LP_PROV.find(p=>p.re.test(String(u||'')))||null; }
function hpLpOff(){ try{ return localStorage.getItem(HP_LP_KEY)==='1'; }catch(e){ return false; } }
async function hpLpGet(url,kind,ms){ let c=null, tm=null; try{ c=(typeof AbortController!=='undefined')?new AbortController():null; tm=setTimeout(()=>{ try{ if(c) c.abort(); }catch(e){} },ms||6000);
    const r=await fetch(url,{mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal:c?c.signal:undefined}); if(!r||!r.ok) return null; return kind==='b'?await r.blob():await r.json(); }catch(e){ return null; }finally{ if(tm) clearTimeout(tm); } }
async function hpLpThumb(src){ try{ if(!src||!HP_LP_IMGH.test(String(src))) return ''; const b=await hpLpGet(String(src),'b',8000); if(!b||!/^image\//.test(b.type||'')||b.size>6e6||typeof createImageBitmap!=='function') return ''; const bm=await createImageBitmap(b);
    const sc=Math.min(1,320/Math.max(1,bm.width)), w=Math.max(1,Math.round(bm.width*sc)), h=Math.max(1,Math.round(bm.height*sc)); const cv=document.createElement('canvas'); cv.width=w; cv.height=h; cv.getContext('2d').drawImage(bm,0,0,w,h);
    for(const q of [0.72,0.6,0.45,0.32]){ const d=cv.toDataURL('image/jpeg',q); if(d.length<=Math.ceil(HP_LP_IMAX*4/3)) return d; } return ''; }catch(e){ return ''; } }
async function hpLpMake(u){ try{ const p=hpLpProv(u); if(!p) return null; const j=await hpLpGet(p.f(u),'j',6000); if(!j||typeof j!=='object') return null;
    const th=p.w?(j.thumbnail&&j.thumbnail.source):j.thumbnail_url, s=p.s+((!p.w&&j.author_name)?' ・ '+String(j.author_name):''); const i=await hpLpThumb(th); return hpLpClean({u:u,t:String(j.title||''),s:s,i:i}); }catch(e){ return null; } }
function hpLpCss(){ try{ if(typeof document==='undefined'||!document.head||document.getElementById('hp-lp-css')) return; const st=document.createElement('style'); st.id='hp-lp-css';
    st.textContent='.m .lp{display:block;max-width:280px;margin-top:6px;border:1px solid var(--line,#2a3a5a);border-radius:10px;overflow:hidden;background:rgba(255,255,255,.05);cursor:pointer;text-align:left}.m .lp img{display:block;width:100%;max-height:180px;object-fit:cover}.m .lp .lp-t{font-weight:700;font-size:13px;line-height:1.4;padding:6px 8px 0;overflow-wrap:anywhere}.m .lp .lp-s{font-size:11px;color:var(--dim,#8aa0c0);padding:2px 8px 6px}.m .lp-d{display:block;margin-top:4px;font-size:11px;color:var(--dim,#8aa0c0);cursor:pointer}#lp-bar{display:none;align-items:center;gap:8px;background:#0f1830;border:1px solid var(--line,#2a3a5a);border-radius:8px;margin:0 8px 6px 8px;padding:6px 8px;box-sizing:border-box}#lp-bar img{width:64px;height:48px;object-fit:cover;border-radius:6px;flex:0 0 auto}#lp-bar .lp-tx{flex:1;min-width:0;font-size:12px;line-height:1.4;overflow:hidden}#lp-bar .lp-x{flex:0 0 auto;background:#17233c;border:1px solid var(--line,#2a3a5a);border-radius:6px;color:var(--dim,#8aa0c0);padding:4px 8px;cursor:pointer}';
    document.head.appendChild(st); }catch(e){} }
function hpLpOpen(u){ try{ if(/^https?:\/\//.test(String(u||''))) window.open(u,'_blank','noopener,noreferrer'); }catch(e){} }
function hpLpCard(lp){ const D=t=>document.createElement(t); const c=D('div'); c.className='lp'; if(lp.i){ const im=D('img'); im.alt=''; im.src=lp.i; c.appendChild(im); } if(lp.t){ const t=D('div'); t.className='lp-t'; t.textContent=lp.t; c.appendChild(t); }
  const s=D('div'); s.className='lp-s'; s.textContent=(lp.s?lp.s+' ・ ':'')+hpLpHost(lp.u); c.appendChild(s); c.onclick=e=>{ try{ e.stopPropagation(); }catch(_){} hpLpOpen(lp.u); }; return c; }
function hpLpPaint(el,text,lp){ try{ if(!el||typeof document==='undefined') return 0; hpLpCss(); const bd=el.querySelector?el.querySelector('.bd'):null; if(!bd) return 0; const at=bd.nextSibling;
    if(lp){ el.insertBefore(hpLpCard(lp),at); return 1; } const U=hpLpUrls(text); if(!U.length) return 0; const h=hpLpHost(U[0]); if(!h) return 0; const d=document.createElement('span'); d.className='lp-d'; d.textContent='🔗 '+h; d.onclick=e=>{ try{ e.stopPropagation(); }catch(_){} hpLpOpen(U[0]); }; el.insertBefore(d,at); return 2; }catch(e){ return 0; } }
try{ if(typeof addMsgAt==='function'&&!addMsgAt.__lp){ const f=addMsgAt; addMsgAt=Object.assign(function(kind,text,who,ts,voided){ const a=Array.from(arguments); let lp=null; if(typeof text==='string'&&text.indexOf(HP_LP_MK)>=0){ const sp=hpLpSplit(text); a[1]=sp.t; lp=sp.lp; } const r=f.apply(this,a);
    try{ if(!voided&&typeof a[1]==='string'&&typeof document!=='undefined'){ const box=document.getElementById('msgs'), el=box&&box.lastElementChild; if(el&&el.dataset&&el.dataset.ts===String(ts)) hpLpPaint(el,a[1],lp); } }catch(e){} return r; },f,{__lp:1}); } }catch(e){}
try{ if(typeof convPreview==='function'&&!convPreview.__lp){ const f=convPreview; convPreview=Object.assign(function(m){ if(m&&typeof m.t==='string'&&m.t.indexOf(HP_LP_MK)>=0) m=Object.assign({},m,{t:hpLpStrip(m.t)}); return f.call(this,m); },f,{__lp:1}); } }catch(e){}
try{ if(typeof hpLetterCopy==='function'&&!hpLetterCopy.__lp){ const f=hpLetterCopy; hpLetterCopy=Object.assign(function(rec,kind){ if(rec&&typeof rec.t==='string'&&rec.t.indexOf(HP_LP_MK)>=0) rec=Object.assign({},rec,{t:hpLpStrip(rec.t)}); return f.call(this,rec,kind); },f,{__lp:1}); } }catch(e){}
try{ if(typeof hpSrNorm==='function'&&!hpSrNorm.__lp){ const f=hpSrNorm; hpSrNorm=Object.assign(function(s){ return f.call(this,hpLpStrip(s)); },f,{__lp:1}); } }catch(e){}
try{ if(typeof hpSrMarkInto==='function'&&!hpSrMarkInto.__lp){ const f=hpSrMarkInto; hpSrMarkInto=Object.assign(function(el,text){ const a=Array.from(arguments); a[1]=hpLpStrip(text); return f.apply(this,a); },f,{__lp:1}); } }catch(e){}

let HP_LP_CUR=null, HP_LP_SEQ=0, HP_LP_TM=null; const HP_LP_SKIP=new Set();
function hpLpBar(){ try{ let b=document.getElementById('lp-bar'); if(b) return b; const comp=document.getElementById('composer'); if(!comp||!comp.parentNode) return null; hpLpCss(); b=document.createElement('div'); b.id='lp-bar'; comp.parentNode.insertBefore(b,comp); return b; }catch(e){ return null; } }
function hpLpBarShow(st,u,lp){ const b=hpLpBar(); if(!b) return false; b.textContent=''; if(!st){ b.style.display='none'; return true; } b.style.display='flex';
  if(lp&&lp.i){ const im=document.createElement('img'); im.alt=''; im.src=lp.i; b.appendChild(im); } const tx=document.createElement('div'); tx.className='lp-tx'; tx.textContent=st==='wait'?T('lp_wait'):((lp.t||'')+'\n'+(lp.s?lp.s+' ・ ':'')+hpLpHost(lp.u)); tx.style.whiteSpace='pre-line'; b.appendChild(tx);
  const x=document.createElement('button'); x.type='button'; x.className='lp-x'; x.textContent='×'; x.title=T('lp_rm'); x.onclick=()=>{ HP_LP_SKIP.add(u); HP_LP_CUR=null; HP_LP_SEQ++; hpLpBarShow(''); }; b.appendChild(x); return true; }
async function hpLpCheck(){ try{ const ta=document.getElementById('text'); if(!ta) return false; const v=String(ta.value||''); if(hpLpOff()){ HP_LP_CUR=null; hpLpBarShow(''); return false; }
    const u=hpLpUrls(v).find(x=>hpLpProv(x)&&!HP_LP_SKIP.has(x)); if(!u){ HP_LP_CUR=null; hpLpBarShow(''); return false; } if(HP_LP_CUR&&HP_LP_CUR.u===u) return true;
    const my=++HP_LP_SEQ; HP_LP_CUR={u:u,lp:null}; hpLpBarShow('wait',u,null); const lp=await hpLpMake(u); if(my!==HP_LP_SEQ) return false;
    if(!lp||String(ta.value||'').indexOf(u)<0){ HP_LP_CUR=null; hpLpBarShow(''); return false; } HP_LP_CUR={u:u,lp:lp}; hpLpBarShow('ok',u,lp); return true; }catch(e){ return false; } }
function hpLpWire(){ try{ const ta=document.getElementById('text'); if(!ta||ta.dataset.lpw) return false; ta.dataset.lpw='1'; const kick=ms=>{ if(HP_LP_TM) clearTimeout(HP_LP_TM); HP_LP_TM=setTimeout(()=>{ HP_LP_TM=null; hpLpCheck(); },ms); };
    ta.addEventListener('input',()=>kick(700)); ta.addEventListener('paste',()=>kick(50)); return true; }catch(e){ return false; } }
try{ if(typeof sendChat==='function'&&!sendChat.__lp){ const f=sendChat; sendChat=Object.assign(function(){ try{ const ta=document.getElementById('text'); if(ta&&HP_LP_CUR&&HP_LP_CUR.lp&&!hpLpOff()){ const v=String(ta.value||''); if(v.indexOf(HP_LP_CUR.u)>=0&&!HP_LP_RE.test(v)) ta.value=hpLpPack(v,HP_LP_CUR.lp); } HP_LP_CUR=null; HP_LP_SEQ++; hpLpBarShow(''); }catch(e){} return f.apply(this,arguments); },f,{__lp:1}); } }catch(e){}

function hpLpMount(){ try{ const ps=document.getElementById('p-set'); if(!ps||document.getElementById('lp-set')) return false; const c=document.createElement('div'); c.className='card'; c.id='lp-set'; const h=document.createElement('h2'); h.textContent=T('lp_set_title'); c.appendChild(h);
    const lb=document.createElement('label'); lb.style.cssText='display:flex;gap:8px;align-items:center;cursor:pointer'; const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=!hpLpOff(); cb.onchange=()=>{ try{ if(cb.checked) localStorage.removeItem(HP_LP_KEY); else localStorage.setItem(HP_LP_KEY,'1'); }catch(e){} if(!cb.checked){ HP_LP_CUR=null; hpLpBarShow(''); } }; lb.appendChild(cb); const sp=document.createElement('span'); sp.textContent=T('lp_set_on'); lb.appendChild(sp); c.appendChild(lb);
    const nt=document.createElement('div'); nt.className='note'; nt.textContent=T('lp_set_note'); nt.style.cssText='font-size:12px;color:var(--dim,#8aa0c0);margin-top:6px;line-height:1.6'; c.appendChild(nt); ps.appendChild(c); return true; }catch(e){ return false; } }
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document.getElementById){ const go=()=>{ hpLpWire(); hpLpMount(); }; setTimeout(go,0); setTimeout(go,1500); setTimeout(go,5000); } }catch(e){}

function hpLpYtId(u){ const m=/^https:\/\/(?:www\.|m\.)?(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#\s]*&)?v=|shorts\/|live\/))([A-Za-z0-9_-]{11})/i.exec(String(u||'')); return m?m[1]:''; }
try{ if(typeof hpLpMake==='function'&&!hpLpMake.__yt){ const f=hpLpMake; hpLpMake=Object.assign(async function(u){ const r=await f.apply(this,arguments); if(r) return r; try{ const id=hpLpYtId(u); if(!id) return null; const i=await hpLpThumb('https://i.ytimg.com/vi/'+id+'/hqdefault.jpg'); return i?hpLpClean({u:u,t:'',s:'YouTube',i:i}):null; }catch(e){ return null; } },f,{__yt:1}); } }catch(e){}
hpLpUrls=function(text){ const s=String(text||''), out=[], re=/https?:\/\/[^\s<>"'）」』】、。]+/g; let m; while((m=re.exec(s))&&out.length<5){ if(m.index>0&&/[A-Za-z0-9:]/.test(s[m.index-1])) continue; out.push(m[0].replace(/[.,!?)\]]+$/,'')); } return out; };
let HP_LP_PEND=null, HP_LP_WAITING=false;
try{ if(typeof hpLpCheck==='function'&&!hpLpCheck.__pend){ const f=hpLpCheck; hpLpCheck=Object.assign(function(){ const p=f.apply(this,arguments); HP_LP_PEND=p; return p; },f,{__pend:1}); } }catch(e){}
try{ if(typeof sendChat==='function'&&!sendChat.__lpw){ const f=sendChat; sendChat=Object.assign(async function(){ if(HP_LP_WAITING) return; try{ const ta=document.getElementById('text'); if(HP_LP_CUR&&!HP_LP_CUR.lp&&HP_LP_PEND&&!hpLpOff()&&ta&&String(ta.value||'').indexOf(HP_LP_CUR.u)>=0){ HP_LP_WAITING=true; try{ await Promise.race([HP_LP_PEND,new Promise(z=>setTimeout(z,4000))]); }finally{ HP_LP_WAITING=false; } } }catch(e){ HP_LP_WAITING=false; } return f.apply(this,arguments); },f,{__lpw:1}); } }catch(e){}

function hpLpLinkify(el){ try{ const bd=el&&el.querySelector?el.querySelector('.bd'):null; if(!bd||bd.dataset.lk) return 0; const s=String(bd.textContent||''), re=/https?:\/\/[^\s<>"'）」』】、。]+/g, parts=[]; let m, last=0, n=0;
    while((m=re.exec(s))){ if(m.index>0&&/[A-Za-z0-9:]/.test(s[m.index-1])) continue; const u=m[0].replace(/[.,!?)\]]+$/,''); parts.push(s.slice(last,m.index)); parts.push({u:u}); last=m.index+u.length; n++; }
    if(!n) return 0; parts.push(s.slice(last)); bd.textContent=''; for(const p of parts){ if(typeof p==='string'){ if(p) bd.appendChild(document.createTextNode(p)); continue; } const a=document.createElement('a'); a.href=p.u; a.target='_blank'; a.rel='noopener noreferrer'; a.textContent=p.u; a.className='lp-a'; a.style.cssText='color:inherit;text-decoration:underline;overflow-wrap:anywhere'; a.onclick=e=>{ try{ e.stopPropagation(); }catch(_){} }; bd.appendChild(a); }
    bd.dataset.lk='1'; return n; }catch(e){ return 0; } }
try{ if(typeof hpLpPaint==='function'&&!hpLpPaint.__lk){ const f=hpLpPaint; hpLpPaint=Object.assign(function(el){ try{ hpLpLinkify(el); }catch(e){} return f.apply(this,arguments); },f,{__lk:1}); } }catch(e){}

const HP_VC_MAX=120000, HP_VC_KB=32000; let HP_VC=null;
function hpVcType(){ try{ if(typeof MediaRecorder==='undefined'||!MediaRecorder.isTypeSupported) return null; for(const [m,e] of [['audio/mp4;codecs=mp4a.40.2','m4a'],['audio/mp4','m4a'],['audio/webm;codecs=opus','webm'],['audio/webm','webm'],['audio/ogg;codecs=opus','ogg']]) if(MediaRecorder.isTypeSupported(m)) return {m:m,e:e}; }catch(e){} return null; }
function hpVcClock(ms){ const s=Math.max(0,Math.floor(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function hpVcName(ms,at,ext){ const s=Math.max(1,Math.round(ms/1000)); return 'voice_'+Math.floor(s/60)+'m'+String(s%60).padStart(2,'0')+'s_'+hpStamp(at)+'.'+ext; }
function hpVcDur(name){ const m=/^voice_(\d+)m(\d\d)s_/.exec(String(name||'')); return m?(Number(m[1])+':'+m[2]):''; }
function hpVcIs(file){ return !!(file&&file.id&&/^audio\//.test(String(file.mime||''))&&!file.risk); }
function hpVcBar(){ try{ let b=document.getElementById('vc-bar'); if(b) return b; const comp=document.getElementById('composer'); if(!comp||!comp.parentNode) return null; b=document.createElement('div'); b.id='vc-bar'; b.style.cssText='display:none;align-items:center;gap:8px;background:#0f1830;border:1px solid var(--line,#2a3a5a);border-radius:8px;margin:0 8px 6px 8px;padding:6px 8px;box-sizing:border-box;font-size:13px'; comp.parentNode.insertBefore(b,comp); return b; }catch(e){ return null; } }
function hpVcDraw(){ const b=hpVcBar(); if(!b) return; if(!HP_VC){ b.style.display='none'; b.textContent=''; return; } b.style.display='flex'; b.textContent='';
  const dot=document.createElement('span'); dot.textContent='●'; dot.style.color='#ff5a5a'; const tx=document.createElement('span'); tx.style.flex='1'; tx.textContent=TF('vc_rec',{t:hpVcClock(Date.now()-HP_VC.t0),max:hpVcClock(HP_VC_MAX)});
  const no=document.createElement('button'); no.type='button'; no.className='b'; no.textContent=T('vc_cancel'); no.onclick=()=>hpVcStop(false); const go=document.createElement('button'); go.type='button'; go.className='b pri'; go.textContent=T('vc_send'); go.onclick=()=>hpVcStop(true);
  b.appendChild(dot); b.appendChild(tx); b.appendChild(no); b.appendChild(go); }
async function hpVcStart(){ try{ if(HP_VC) return false; const ta=document.getElementById('text'); if(ta&&ta.disabled) return false; const ty=hpVcType();
    if(!ty||!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){ try{ hpToast(T('vc_nosup'),5000); }catch(e){} return false; }
    let st=null; try{ st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true}}); }catch(e){ try{ hpToast(T('vc_nomic'),6000); }catch(_){} return false; }
    const rec=new MediaRecorder(st,{mimeType:ty.m,audioBitsPerSecond:HP_VC_KB}), parts=[]; rec.ondataavailable=e=>{ if(e.data&&e.data.size) parts.push(e.data); };
    HP_VC={rec:rec,st:st,parts:parts,ty:ty,t0:Date.now(),send:false,tick:null,cap:null}; rec.onstop=()=>{ hpVcDone(); }; rec.start(1000);
    HP_VC.tick=setInterval(hpVcDraw,500); HP_VC.cap=setTimeout(()=>hpVcStop(true),HP_VC_MAX); hpVcDraw(); hpVcBtn(); return true; }catch(e){ try{ hpLog('録音を始められなかった：'+e.message); }catch(_){} hpVcClean(); return false; } }
function hpVcStop(send){ try{ if(!HP_VC) return false; HP_VC.send=!!send; HP_VC.ms=Date.now()-HP_VC.t0; if(HP_VC.rec.state!=='inactive') HP_VC.rec.stop(); else hpVcDone(); return true; }catch(e){ hpVcClean(); return false; } }
function hpVcClean(){ try{ if(HP_VC){ if(HP_VC.tick) clearInterval(HP_VC.tick); if(HP_VC.cap) clearTimeout(HP_VC.cap); try{ HP_VC.st.getTracks().forEach(t=>t.stop()); }catch(e){} } }catch(e){} HP_VC=null; hpVcDraw(); hpVcBtn(); }
async function hpVcDone(){ const v=HP_VC; if(!v) return false; hpVcClean(); try{ if(!v.send||!v.parts.length||(v.ms||0)<700) return false; const at=Date.now(), type=v.ty.m.split(';')[0];
    const f=new File(v.parts,hpVcName(v.ms,at,v.ty.e),{type:type}); if(typeof sendFile==='function') await sendFile(f); return true; }catch(e){ try{ hpLog('音声メッセージを送れなかった：'+e.message); }catch(_){} return false; } }
function hpVcBtn(){ try{ const b=document.getElementById('btn-voice'); if(!b) return; b.classList.toggle('on',!!HP_VC); b.style.opacity=HP_VC?'1':''; b.style.filter=HP_VC?'none':''; }catch(e){} }
function hpVcMount(){ try{ const cb=document.getElementById('cbox'); if(!cb||document.getElementById('btn-voice')) return false; const b=document.createElement('button'); b.type='button'; b.className='b'; b.id='btn-voice'; b.textContent='🎤'; try{ b.title=T('tip_voice'); b.setAttribute('aria-label',T('tip_voice')); }catch(e){}
    b.style.cssText='flex:0 0 auto;margin:0 0 5px 0;padding:6px 6px;border:none;background:none;font-size:18px;line-height:1;border-radius:8px;filter:grayscale(1);opacity:.5'; b.onmousedown=e=>{ try{ e.preventDefault(); }catch(_){} }; b.onclick=()=>{ if(HP_VC) hpVcStop(true); else hpVcStart(); };
    const st=document.getElementById('btn-st'); cb.insertBefore(b,(st&&st.parentNode===cb)?st:null); return true; }catch(e){ return false; } }
async function hpVcMount1(d,file){ try{ if(!d||!hpVcIs(file)||!d.querySelector||d.querySelector('audio')) return false; const fb=d.querySelector('.fb'); if(fb){ const fn=fb.querySelector('.fn'), ic=fb.querySelector('.ic'); if(ic) ic.textContent='🎤'; if(fn){ const du=hpVcDur(file.name); fn.textContent=T('vc_label')+(du?'（'+du+'）':''); } }
    const b=await blobGet(file.id); if(!b) return false; const a=document.createElement('audio'); a.controls=true; a.preload='metadata'; a.style.cssText='display:block;width:240px;max-width:100%;margin:4px 0';
    a.onerror=()=>{ try{ const n=document.createElement('div'); n.textContent=T('vc_noplay'); n.style.cssText='font-size:11px;color:var(--dim,#8aa0c0)'; a.replaceWith(n); }catch(e){} }; a.src=URL.createObjectURL(b); if(fb&&fb.parentNode===d) d.insertBefore(a,fb.nextSibling); else d.appendChild(a); return true; }catch(e){ return false; } }
try{ if(typeof addMsgAt==='function'&&!addMsgAt.__vc){ const f=addMsgAt; addMsgAt=Object.assign(function(kind,text,who,ts,voided,pend,rd,img,file){ const r=f.apply(this,arguments);
    try{ if(!voided&&hpVcIs(file)&&typeof document!=='undefined'){ const ms=document.getElementById('msgs'), d=ms&&ms.lastElementChild; if(d&&d.dataset&&d.dataset.ts===String(ts)) hpVcMount1(d,file).catch(()=>{}); } }catch(e){} return r; },f,{__vc:1}); } }catch(e){}
try{ if(typeof convPreview==='function'&&!convPreview.__vc){ const f=convPreview; convPreview=Object.assign(function(m){ try{ if(m&&!m.x&&m.d!=='v'&&hpVcIs(m.file)){ const du=hpVcDur(m.file.name); return (m.d==='s'?T('conv_you')+' ':'')+'🎤 '+T('vc_label')+(du?'（'+du+'）':''); } }catch(e){} return f.apply(this,arguments); },f,{__vc:1}); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document.getElementById){ const go=()=>{ hpVcMount(); }; setTimeout(go,0); setTimeout(go,1500); setTimeout(go,5000); } }catch(e){}

