const HP_IF_EVERY=60e3  , HP_IF_TTL=3*60e3, HP_IF_MAX=10*60e3;
const HP_IF_PICS=['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦉','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐢','🐍','🐙','🦀','🐬','🐳','🐟','🌵','🌲','🌻','🍄','🌙','⭐','🌈','🔥','💧','🍎','🍌','🍇','🍓','🍉','🍒','🍙','🍞','🧀','🍰','🍩','⚽','🎈','🎁','🔑','🚲','🚗','🚀','⛵','🎸'];
let HP_IF_ON=false, HP_IF_T=null, HP_IF_BUSY=false, HP_IF_AT=0, HP_IF_ACT=0, HP_IF_ERR='', HP_IF_STOPPED=false; const HP_IF_IDS=new Set(), HP_IF_POPS=new Set();
function hpIfPics(id,who){ const s=hp5S(), h=s.crypto_generichash(4, s.from_string('handpost-invite-face:v1:'+id+':'+who)); return Array.from(h).map(b=>HP_IF_PICS[b%HP_IF_PICS.length]); }

function hpIfCardMark(text,face){ if(!face) return text; try{ const o=JSON.parse(text); if(!o||typeof o!=='object') return text; o.ivk='face'; return JSON.stringify(o); }catch(e){ return text; } }
function hpIvjFace(){ const ta=document.getElementById('inv-text'), sd=document.getElementById('inv-send'); if(ta){ ta.value=''; ta.style.display='none'; } if(sd) sd.textContent=T('btn_if_send'); }
async function hpInvMakeKind(kind){
  if(!ID) throw new Error(T('e_inv_noid')); if(!POST.up) throw new Error(T('e_inv_nopost')); if(POST.notOwner) throw new Error(T('e_card_notowner'));
  const host=hpInvHost(POST.url); if(!host) throw new Error(T('e_inv_host')); await hpReady();
  const face=kind==='face', card=hpIfCardMark(await hpCard(),face), sec=hp5S().randombytes_buf(32), K=hpInvKeys(sec), exp=Date.now()+(face?HP_IF_TTL:HP_INV_TTL);
  let r; try{ r=await hpInvReq({ op:'iset', id:K.id, exp:exp, box:hpInvSeal(card, ID.address, K) }); }
  catch(e){ hpLog('招待を預けられない '+e.message); throw new Error(e.message==='too many'?T('e_inv_many'):(e.message==='too big'?T('e_inv_big')  :(e.inv?T('e_inv_post'):e.message))); }
  const cur={ link:hpInvLink(ID.address, host, sec), exp:Number(r.exp)||exp, id:K.id, used:0, kind:face?'face':'link', at:Date.now() };
  hpInvKeep({ id:K.id, v:hpHex(K.v), exp:cur.exp, at:Date.now(), kind:cur.kind });
  if(face){ HP_INV_CUR=cur; HP_IF_IDS.add(K.id); } if(HP_INV_LIST&&Array.isArray(HP_INV_LIST.items)) HP_INV_LIST.items.push({ id:K.id, exp:cur.exp, used:0 });
  hpLog('招待を作った '+K.id.slice(0,8)+'（'+(face?'目の前用・3 分':'リンク用・12 時間')+'。1 回だけ）'); return cur; }
function hpIfSeen(){ try{ if(typeof document!=='undefined'&&document.visibilityState==='hidden') return false; const pg=document.getElementById('p-contacts'), hq=document.getElementById('hq-pop');
  return !!((pg&&pg.classList&&pg.classList.contains('on'))||(hq&&hq.classList&&hq.classList.contains('on'))); }catch(e){ return false; } }
async function hpIfDrop(old){ if(!old||old.used) return false; try{ await hpInvReq({op:'idel', id:old.id}); }catch(e){ hpLog('前の目の前用の招待を取り消せない '+e.message); return false; }
  HP_IF_IDS.delete(old.id); if(HP_INV_LIST&&Array.isArray(HP_INV_LIST.items)) HP_INV_LIST.items=HP_INV_LIST.items.filter(x=>x.id!==old.id);

 return true; }
const HP_IF_RETRY=10e3;
async function hpIfRotate(why){ if(HP_IF_BUSY) return false; HP_IF_BUSY=true; const old=(HP_INV_CUR&&HP_INV_CUR.kind==='face')?HP_INV_CUR:null;
  try{ await hpInvMakeKind('face'); HP_IF_AT=Date.now(); HP_IF_ERR=''; if(old&&!old.used) await hpIfDrop(old); hpLog('目の前用の QR を替えた（'+(why||'60 秒')+'）'); return true; }
  catch(e){ const m=String((e&&e.message)||e); if(m!==HP_IF_ERR) hpLog('目の前用の QR を替えられない '+m+'（同じ理由が続く間、この行は 1 回だけ。10 秒おきにやり直す）'); HP_IF_ERR=m; HP_IF_AT=Date.now()-HP_IF_EVERY+((typeof HP_IF_RETRY==='number')?HP_IF_RETRY:10e3); return false; }
  finally{ HP_IF_BUSY=false; try{ hpInvDraw(); }catch(e){} try{ hpIfQuickDraw(); }catch(e){} } }
async function hpIfStart(){ HP_IF_ON=true; HP_IF_STOPPED=false; HP_IF_ACT=Date.now(); return hpIfRotate('出した'); }
async function hpIfStop(why){ HP_IF_ON=false; const old=(HP_INV_CUR&&HP_INV_CUR.kind==='face')?HP_INV_CUR:null; if(old){ HP_INV_CUR=null; await hpIfDrop(old); } if(why==='max') HP_IF_STOPPED=true; hpLog('目の前用の QR を止めた（'+(why||'')+'）'); try{ hpInvDraw(); }catch(e){} try{ hpIfQuickDraw(); }catch(e){} return true; }
function hpIfNew(){ HP_IF_ON=true; HP_IF_STOPPED=false; HP_IF_ACT=Date.now(); return hpIfRotate('手で'); }
function hpIfTick(){ try{ if(!HP_IF_ON) return ''; const now=Date.now();
  if(now-HP_IF_ACT>=HP_IF_MAX){ hpIfStop('max'); return 'stop'; }
  if(!hpIfSeen()) return 'hidden';
  if(!HP_IF_BUSY&&now-HP_IF_AT>=HP_IF_EVERY){ hpIfRotate('60 秒'); return 'rotate'; }
  try{ hpIfText(); }catch(e){} return 'wait'; }catch(e){ return ''; } }
function hpIfLine(){ const cur=HP_INV_CUR; if(HP_IF_STOPPED&&!HP_IF_ON) return T('if_stop'); if(!HP_IF_ON||!cur||cur.kind!=='face') return ''; if(HP_IF_ERR) return HP_IF_ERR;
  if(cur.used) return T('if_used'); return TF('if_left',{s:Math.max(1,Math.ceil((HP_IF_EVERY-(Date.now()-HP_IF_AT))/1000))}); }

function hpIfParts(t){ const out=[], re=/([0-9]+ ?秒|[0-9]+ s\b)|(1 人だけ|one person)/g; let i=0, m; t=String(t||''); while((m=re.exec(t))){ if(m.index>i) out.push({t:t.slice(i,m.index)}); out.push({t:m[0],b:1,k:m[1]?'s':'p'}); i=m.index+m[0].length; } if(i<t.length) out.push({t:t.slice(i)}); return out; }

function hpIfGauge(el){ try{ if(!el||!el.parentNode||typeof document.createElement!=='function') return '';
  let g=el.nextSibling; if(!g||g.className!=='if-gg'){ g=document.createElement('div'); g.className='if-gg'; g.style.cssText='height:6px;width:220px;max-width:100%;margin:6px auto 0;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden;display:none';
    const b0=document.createElement('div'); b0.className='if-gg-b'; b0.style.cssText='height:100%;width:100%;border-radius:3px;background:var(--teal)'; g.appendChild(b0); el.parentNode.insertBefore(g,el.nextSibling); }
  const cur=HP_INV_CUR, cnt=!!(HP_IF_ON&&cur&&cur.kind==='face'&&!cur.used&&!HP_IF_ERR); if(!cnt){ g.style.display='none'; g.__p=-1; return 'off'; }
  const ms=Math.max(0,HP_IF_EVERY-(Date.now()-HP_IF_AT)), pct=Math.max(0,Math.min(100,Math.round(ms/HP_IF_EVERY*1000)/10)), b=g.firstChild; g.style.display='block';
  if(b&&b.style){ b.style.transition=(pct<(g.__p>=0?g.__p:0))?'width 1s linear':'none';   b.style.width=pct+'%'; b.style.background=ms<=10e3?'#e6a23c':'var(--teal)'; } g.__p=pct; return pct+'%'; }catch(e){ return ''; } }
function hpIfLook(el,t){ try{ if(!el) return ''; hpIfGauge(el); if(typeof hpIfKeep==='function') hpIfKeep(el);   const cur=HP_INV_CUR, cnt=!!(HP_IF_ON&&cur&&cur.kind==='face'&&!cur.used&&!HP_IF_ERR);
  if(el.style&&(el.style.fontSize||el.style.fontWeight)){ el.style.fontSize=''; el.style.fontWeight=''; el.style.color=''; }
  if(!cnt||typeof t!=='string') return 'plain'; const parts=hpIfParts(t); if(parts.length<2||typeof el.appendChild!=='function') return 'plain';
  const left=Math.ceil((HP_IF_EVERY-(Date.now()-HP_IF_AT))/1000); el.textContent='';
  for(const p of parts){ if(!p.b){ el.appendChild(document.createTextNode(p.t)); continue; } const b=document.createElement('b'); b.textContent=p.t; b.style.fontSize='16px'; b.style.color=(p.k==='s'&&left<=10)?'#e6a23c':'var(--teal)'; el.appendChild(b); }
  return left<=10?'soon':'count'; }catch(e){ return ''; } }

function hpIfKeep(el){ try{ if(!el||!el.parentNode||typeof document.createElement!=='function') return ''; const g=el.nextSibling; if(!g||g.className!=='if-gg') return '';
  let n=g.nextSibling; if(!n||n.className!=='note if-keep'){ n=document.createElement('div'); n.className='note if-keep'; n.style.cssText='text-align:center;margin:6px auto 0;max-width:340px;line-height:1.5;display:none'; el.parentNode.insertBefore(n,g.nextSibling); }
  const on=g.style.display==='block'; n.style.display=on?'block':'none'; if(on){ const t=T('if_keep'); if(n.textContent!==t) n.textContent=t; } return on?'on':'off'; }catch(e){ return ''; } }
function hpIfText(){ const t=hpIfLine(); if(!t){ hpIfLook(document.getElementById('qr-addr')); return ''; } const ad=document.getElementById('qr-addr'); if(ad&&HP_INV_CUR&&HP_INV_CUR.kind==='face') ad.textContent=t; else if(ad&&HP_IF_STOPPED) ad.textContent=t;
  const hq=document.getElementById('hq-pop'); if(hq&&hq.classList&&hq.classList.contains('on')){ const n=hq.querySelector('.hq-n'); if(n){ n.textContent=t; hpIfLook(n,t); } } hpIfLook(ad,t); return t; }
function hpIfButtons(){ try{ const ac=document.getElementById('inv-acts'); if(!ac) return; let b=document.getElementById('btn-if-new');
  if(!b){ b=document.createElement('button'); b.className='b'; b.id='btn-if-new'; b.type='button'; b.setAttribute('data-i18n','btn_if_new'); b.textContent=T('btn_if_new'); b.addEventListener('click',()=>{ hpIfNew(); }); ac.insertBefore(b,ac.firstChild); }
  const on=!!(HP_IF_ON&&HP_INV_CUR&&HP_INV_CUR.kind==='face'); b.style.display=on?'':'none'; ac.style.display=''; }catch(e){} }
async function hpIfCopyLink(btn){ try{ const L=await hpInvMakeKind('link'); let ok=false; try{ await navigator.clipboard.writeText(L.link); ok=true; }catch(e){ ok=false; }
    if(!ok){ try{ prompt(T('pr_inv_copy'), L.link); }catch(e){} } try{ hpToast(T('if_link_ok'),3000); }catch(e){} try{ log(TL('lg_inv_copied')); }catch(e){} return L; }
  catch(e){ try{ alert((typeof hpErrShow==='function'?hpErrShow(e):e.message)); }catch(_){} return null; } }

function hpInvDrawAfter(){ try{ hpIfButtons(); hpIfText(); }catch(e){} }
let HP_IF_LSAVE=null;
function hpInvListBefore(){ HP_IF_LSAVE=null; if(HP_INV_LIST&&Array.isArray(HP_INV_LIST.items)){ HP_IF_LSAVE=HP_INV_LIST.items; HP_INV_LIST.items=HP_IF_LSAVE.filter(x=>!(HP_IF_IDS.has(x.id)&&!x.used)); } }
function hpInvListAfter(){ if(HP_IF_LSAVE&&HP_INV_LIST){ HP_INV_LIST.items=HP_IF_LSAVE; } HP_IF_LSAVE=null; }

function hpIfQuickDraw(){ try{ const w=document.getElementById('hq-pop'); if(!w||!w.classList||!w.classList.contains('on')) return ''; const cv=w.querySelector('.hq-cv'), cur=HP_INV_CUR;
  const shown=!!(cur&&cur.kind==='face'&&cur.exp>Date.now()); if(shown){ QR.draw(cv, cur.link); cv.style.display='block'; } else cv.style.display='none';
  try{ if(typeof w.classList.toggle==='function') w.classList.toggle('wait',hpIfQuickWait(shown)); }catch(e){}   hpIfText(); return 'drawn'; }catch(e){ return ''; } }

function hpIfQuickWait(shown){ try{ return !shown&&!(typeof HP_IF_ERR!=='undefined'&&HP_IF_ERR)&&!(typeof HP_IF_STOPPED!=='undefined'&&HP_IF_STOPPED&&!HP_IF_ON); }catch(e){ return !shown; } }
async function hpInvQuick2(){
  let w=document.getElementById('hq-pop');
  if(!w){ w=document.createElement('div'); w.id='hq-pop'; w.innerHTML='<div class="hq-box"><b class="hq-t"></b><canvas class="hq-cv" width="220" height="220"></canvas><div class="note hq-n"></div><div class="row"><button class="b hq-new"></button><button class="b hq-copy"></button><button class="b hq-close"></button></div></div>'; document.body.appendChild(w); w.addEventListener('click',e=>{ if(e.target===w) hpIfQuickClose(); }); }
  const q=s=>w.querySelector(s); let nb=q('.hq-new'); if(!nb){ nb=document.createElement('button'); nb.className='b hq-new'; const row=q('.row'); if(row) row.insertBefore(nb,row.firstChild); }
  { let fr=q('.hq-for'); if(!fr){ fr=document.createElement('div'); fr.className='note hq-for'; fr.style.cssText='margin:4px 0 8px'; const t=q('.hq-t'); if(t&&t.parentNode) t.parentNode.insertBefore(fr,t.nextSibling||null); } fr.textContent=T('hq_for'); }
  q('.hq-t').textContent=T('ct_qr'); nb.textContent=T('btn_if_new'); q('.hq-copy').textContent=T('btn_inv_copy'); q('.hq-close').textContent=T('btn_close');
  nb.onclick=()=>{ hpIfNew(); }; q('.hq-copy').onclick=()=>{ hpIfCopyLink(q('.hq-copy')); }; q('.hq-close').onclick=()=>{ hpIfQuickClose(); };
  q('.hq-cv').style.display='none'; q('.hq-n').textContent=T('if_making'); w.classList.add('on'); try{ w.classList.add('wait'); }catch(e){}
  await hpIfStart(); return hpIfQuickDraw(); }
function hpIfQuickClose(){ try{ const w=document.getElementById('hq-pop'); if(w) w.classList.remove('on'); }catch(e){} const pg=document.getElementById('p-contacts'); if(!(pg&&pg.classList&&pg.classList.contains('on'))) hpIfStop('閉じた'); }

function hpInvCheckAfter(res,from,iv){ try{ if(!res||res.ok!==1||!iv||!iv.id) return; const rec=((ID&&ID.invites)||[]).find(r=>r.id===iv.id); if(!rec||rec.kind!=='face') return;
  HP_IF_IDS.delete(iv.id); if(HP_IF_POPS.has(iv.id)) return; HP_IF_POPS.add(iv.id);
  setTimeout(()=>{ try{ hpIfConfirm(from,iv.id); }catch(e){} },0); if(HP_IF_ON) setTimeout(()=>{ hpIfRotate('使われた'); },0); }catch(e){} }
function hpIfPicsEl(pics){ const d=document.createElement('div'); d.className='if-pics'; d.style.cssText='font-size:40px;letter-spacing:.2em;text-align:center;margin:10px 0'; d.textContent=pics.join(''); return d; }
function hpIfConfirm(from,id){ const old=document.getElementById('if-dlg'); if(old&&old.parentNode) old.parentNode.removeChild(old);
  const r0=(REQUESTS||[]).find(x=>x&&x.hp&&x.from===from), name=(r0&&r0.name)||hpIdShort(from);
  const box=document.createElement('div'); box.id='if-dlg'; box.style.cssText='position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
  const card=document.createElement('div'); card.className='card'; card.style.cssText='max-width:420px;width:100%';
  const h=document.createElement('h2'); h.textContent=T('if_title'); const p=document.createElement('div'); p.style.cssText='margin:8px 0;line-height:1.5'; p.textContent=TF('if_text',{name:name});
  const row=document.createElement('div'); row.className='row'; row.style.marginTop='10px'; const close=()=>{ try{ if(box.parentNode) box.parentNode.removeChild(box); }catch(e){} };
  const mk=(k,cls,fn)=>{ const b=document.createElement('button'); b.className='b'+(cls?' '+cls:''); b.type='button'; b.textContent=T(k); b.addEventListener('click',fn); row.appendChild(b); return b; };
  mk('btn_if_same','pri',async()=>{ const r=(REQUESTS||[]).find(x=>x&&x.hp&&x.from===from); if(!r){ close(); return; } const nk=String(r.name||'').trim(); let nok=true; try{ nok=await hpNickOk(from,nk); }catch(e){} if(!nok) return;
    if(hpApprove(r,nk,true)){ REQUESTS=REQUESTS.filter(x=>x!==r); try{ renderRequests(); updateBadges(); }catch(e){} hpLog('目の前の友達を承認した（絵柄が同じ） '+hpIdShort(from)); } close(); });
  mk('btn_if_diff','',()=>{ REQUESTS=(REQUESTS||[]).filter(x=>!(x&&x.hp&&x.from===from)); try{ renderRequests(); updateBadges(); }catch(e){} hpLog('目の前用の招待からの申請を断った（絵柄が違う） '+hpIdShort(from)); try{ hpToast(T('if_diff_done'),2500); }catch(e){} close(); });
  mk('btn_if_later','',close);
  card.appendChild(h); card.appendChild(p); card.appendChild(hpIfPicsEl(hpIfPics(id,from))); card.appendChild(row); box.appendChild(card); document.body.appendChild(box); return box; }

function hpIfSentStay(r,c,inv,close){ try{ if(!r||!r.peer||!inv||!inv.id||typeof ID==='undefined'||!ID||!ID.address) return false;
  const pics=hpIfPics(inv.id,ID.address).join('');
  try{ const cc=(ID.contacts||[]).find(x=>x&&x.address===r.peer); if(cc){ cc.invPics=pics; saveID(); } }catch(e){}
  const $i=id=>document.getElementById(id), bb=$i('if-bob'), p=$i('inv-msg'), cl=$i('inv-cancel'); if(!bb||!bb.hpFace||!p||!cl||(bb.style&&bb.style.display==='none')) return false;
  const nm=((typeof hpCardNameOf==='function')?hpCardNameOf(c):'')||T('inv_noname');
  p.textContent=TF('if_sent_face',{name:nm}); try{ const n=bb.firstChild; if(n) n.textContent=TF('if_sent_nt',{name:nm}); }catch(e){}
  for(const k of ['inv-text','inv-send','inv-note']){ const e=$i(k); if(e&&e.style) e.style.display='none'; } { const er=$i('inv-err'); if(er) er.textContent=''; }
  cl.textContent=T('btn_if_seen'); if(cl.style) cl.style.display=''; cl.className='b pri';
  cl.onclick=()=>{ try{ close(); }catch(e){} try{ openConversation(r.peer,true); }catch(e){} };
  try{ hpLog('友達申請を送った。見比べる絵柄を出したまま待つ（目の前用の招待状）'); }catch(e){} return true; }catch(e){ return false; } }
function hpIvjDlgAfter(d){ try{ if(!d||typeof d.ask!=='function'||d.__hpIf) return d; const a0=d.ask; d.__hpIf=1;
  d.ask=function(c,inv){ const face=!!(c&&c.ivk==='face'); try{ if(c) delete c.ivk; }catch(e){} const r=a0.apply(this,arguments); try{ if(face) hpIvjFace(); }catch(e){} try{ hpIvjWhyHook(); }catch(e){}   try{ if(typeof hpFlFace==='function') hpFlFace(face); }catch(e){}   try{ if(inv&&inv.id&&ID&&ID.address){ const m=document.getElementById('inv-msg'); if(m&&m.parentNode){ const old=document.getElementById('if-bob'); if(old&&old.parentNode) old.parentNode.removeChild(old);
      const w=document.createElement('div'); w.id='if-bob'; w.hpFace=face?1:0;   const n=document.createElement('div'); n.className='note'; n.textContent=T(face?'if_bob_face':'if_bob'); w.appendChild(n); w.appendChild(hpIfPicsEl(hpIfPics(inv.id,ID.address))); m.parentNode.insertBefore(w,m.nextSibling); } } }catch(e){} try{ hpIvjNoBox(c,inv); }catch(e){}   return r; };
  return d; }catch(e){ return d; } }

function hpReqPicsAfter(){ try{ const list=document.getElementById('req-list'); if(!list||!Array.isArray(REQUESTS)) return 0; const items=Array.from(list.children||[]).filter(e=>e&&e.className==='req-item'); let n=0;
  REQUESTS.forEach((r,i)=>{ const it=items[i]; if(!it||!r||!r.hp||!r.inv||typeof r.inv!=='object'||!r.inv.id||r.inv.ok===0) return; const d=document.createElement('div'); d.className='note if-req'; d.textContent=TF('if_req',{p:hpIfPics(r.inv.id,r.from).join('')}); it.appendChild(d); n++; });
  return n; }catch(e){ return 0; } }
function hpInvUiAfter(){ try{ const mk=document.getElementById('btn-inv-make'), cp=document.getElementById('btn-inv-copy');
  if(mk) mk.onclick=async()=>{ if(mk.disabled) return; mk.disabled=true; try{ await hpIfStart(); }finally{ mk.disabled=false; } };
  if(cp) cp.onclick=()=>{ hpIfCopyLink(cp); };
  try{ const hq=document.getElementById('me-qr'); if(hq) hq.onclick=()=>{ hpInvQuick2(); }; }catch(e){}
  hpIfButtons(); if(!HP_IF_T) HP_IF_T=setInterval(hpIfTick,1000); if(!HP_IVP_T) HP_IVP_T=setInterval(hpIvjPendTick,5000);   if(!HP_ST_T){ HP_ST_T=setInterval(hpStTick,2000); try{ setTimeout(hpStTick,0); }catch(e){} }   }catch(e){} }
function hpIfWrap(name,before,after){ try{ const f=globalThis[name]; if(typeof f!=='function'||f.__hpIf) return false;
  const g=function(){ try{ if(before) before.apply(this,arguments); }catch(e){} const r=f.apply(this,arguments); try{ if(after){ const r2=after(r,...arguments); if(r2!==undefined) return r2; } }catch(e){} return r; };
  g.__hpIf=1; globalThis[name]=g; return true; }catch(e){ return false; } }
function hpIfBoot(){ hpIfWrap('hpInvDraw',null,()=>{ hpInvDrawAfter(); }); hpIfWrap('hpInvListDraw',hpInvListBefore,()=>{ hpInvListAfter(); }); hpIfWrap('hpInvCheck',null,(r,from,iv)=>{ hpInvCheckAfter(r,from,iv); });
  hpIfWrap('hpIvjDlg',null,d=>hpIvjDlgAfter(d)); hpIfWrap('renderRequests',null,()=>{ hpReqPicsAfter(); }); hpIfWrap('hpInvUiInit',null,()=>{ hpInvUiAfter(); });
  if(typeof hpInvQuick==='function') hpInvQuick=hpInvQuick2; return true; }

let HP_IVJ_WHY='';
function hpHeardWrap(){ try{ const f=globalThis.hpOnOutput; if(typeof f!=='function'||f.__hpHeard) return false; const g=function(o){ try{ if(typeof POST!=='undefined'&&POST&&POST.client) POST.heardBy=POST.client; }catch(e){} return f.apply(this,arguments); }; g.__hpHeard=1; globalThis.hpOnOutput=g; return true; }catch(e){ return false; } }
function hpIvjSendWrap(){ try{ const f=globalThis.hpIvjSend; if(typeof f!=='function'||f.__hpWhy) return false;
  const g=async function(){ try{ return await f.apply(this,arguments); }catch(e){ try{ if(/名簿がまだ無い/.test(String((e&&e.message)||''))) HP_IVJ_WHY=T('ivj_noroster'); }catch(_){} throw e; } }; g.__hpWhy=1; globalThis.hpIvjSend=g; return true; }catch(e){ return false; } }
function hpIvjWhyHook(){ try{ const sd=document.getElementById('inv-send'); if(!sd||typeof sd.onclick!=='function'||sd.onclick.__hpWhy) return false; const h0=sd.onclick;
  const h=async function(){ HP_IVJ_WHY=''; const r=await h0.apply(this,arguments); try{ const er=document.getElementById('inv-err'); if(er&&HP_IVJ_WHY) er.textContent=HP_IVJ_WHY; }catch(e){} return r; }; h.__hpWhy=1; sd.onclick=h; return true; }catch(e){ return false; } }
try{ hpHeardWrap(); hpIvjSendWrap(); }catch(e){}

const HP_IVP_KEEP=14*864e5; let HP_IVP_T=null;
function hpIvjNoBox(c,inv){ let why=hpIvjBoxWhy();
  if(!why) return false; try{ if(typeof hpFlOpen==='function'&&hpFlOpen(c,inv,why)) return true; }catch(e){}   const $i=id=>document.getElementById(id), sd=$i('inv-send'), cl=$i('inv-cancel'), er=$i('inv-err'); { const ta=$i('inv-text'); if(ta&&ta.style) ta.style.display='none'; }
  if(sd) sd.style.display='none'; { const bb=$i('if-bob'), n2=$i('inv-note'); if(bb&&bb.style) bb.style.display='none'; if(n2&&n2.style) n2.style.display='none'; }   if(er){ er.textContent=T(why==='gone'?((typeof hpIsChild==='function'&&hpIsChild())?'ivj_gone_sub':'ivj_gone'):'ivj_nobox'); er.style.color='var(--amber)'; }
  if(cl){ cl.textContent=T('btn_ivj_keep'); cl.style.display=''; cl.onclick=()=>{ try{ ID.ivjPend={card:c,inv:inv||null,at:Date.now()}; saveID(); hpLog('招待を覚えた（郵便受けを用意したら申請を送る） '+hpIdShort(c&&c.id)); }catch(e){}
    try{ const d=$i('inv-dlg'); if(d&&d.parentNode) d.parentNode.removeChild(d); }catch(e){} try{ hpToast(T('ivj_kept'),4000); }catch(e){} try{ const t=$i('t-post'); if(t&&t.click) t.click(); }catch(e){} }; }
  return true; }
function hpIvjBoxWhy(){ try{ if(typeof hpNoBox==='function'&&hpNoBox()) return 'none'; if(typeof hpLeaseState==='function'&&hpLeaseState()==='expired'&&!(typeof POST!=='undefined'&&POST&&POST.up&&POST.heardBy===POST.client)) return 'gone'; }catch(e){} return ''; }
function hpIvjPendTick(){ try{ if(typeof ID==='undefined'||!ID||!ID.ivjPend) return ''; const P=ID.ivjPend;
  if(!(Number(P.at)>0)||Date.now()-P.at>HP_IVP_KEEP||!P.card||!P.card.id){ delete ID.ivjPend; saveID(); hpLog('覚えていた招待を捨てた（14 日たった・形が違う）'); return 'drop'; }
  if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner) return 'wait'; try{ if(typeof hpIvjBoxWhy==='function'&&hpIvjBoxWhy()) return 'wait'; }catch(e){}   try{ if(typeof hpFlHold==='function'&&hpFlHold()) return 'wait'; }catch(e){}   if(document.getElementById('inv-dlg')) return 'busy';
  delete ID.ivjPend; saveID(); if(typeof isContact==='function'&&isContact(P.card.id)) return 'had';
  const d=hpIvjDlg(); d.ask(P.card,P.inv); try{ const er=document.getElementById('inv-err'), sd=document.getElementById('inv-send'); if(er&&!(sd&&sd.style&&sd.style.display==='none')){ er.textContent=T('ivj_ready'); er.style.color='var(--teal)'; } }catch(e){}
  hpLog('郵便受けにつながったので、覚えていた招待の申請の小窓を出した '+hpIdShort(P.card.id)); return 'ask'; }catch(e){ return ''; } }

const HP_ST_XAH=1.5, HP_ST_EVR=2, HP_ST_ACT=1, HP_ST_LINE=0.2, HP_ST_RE=20e3, HP_ST_XAH_NEED=1.5;   let HP_ST_T=null, HP_ST_QR=false, HP_ST_BUSY=false;
function hpStParse(t){ const m=/^(?:handpost-start:|xahau:)?(r[1-9A-HJ-NP-Za-km-z]{24,34})(?:[?&#].*)?$/.exec(String(t||'').trim()); return m?m[1]:''; }
function hpStText(a){ return 'handpost-start:'+a; }
function hpStDrops(v){ return String(Math.round(Number(v)*1e6)); }
function hpStTx(from,to,xah,evr,issuer){ const A=[]; if(Number(xah)>0) A.push({AmountEntry:{Amount:hpStDrops(xah)}}); if(Number(evr)>0) A.push({AmountEntry:{Amount:{currency:'EVR',issuer:issuer,value:hpEvEvr(evr)}}});
  return {TransactionType:'Remit',Account:from,Destination:to,Amounts:A,NetworkID:HP_XA_NETID}; }
function hpStCost(dst,xah,evr){ const act=dst?0:HP_ST_ACT, line=(Number(evr)>0&&!(dst&&Array.isArray(dst.evr)&&dst.evr.length))?HP_ST_LINE:0;
  return {act:act,line:line,xah:Math.round(((Number(xah)||0)+act+line)*1e6)/1e6,evr:Number(evr)||0}; }
function hpStStep(a,info){
  if(!a) return {n:1,why:'nosign'}; if(!info||info.acct!==a||info.err) return {n:3,why:'read'}; if(!info.r) return {n:3,why:'noact'};
  const evr=(info.r.evr||[]).reduce((s,l)=>s+(Number(l.v)||0),0); if(!(evr>0)) return {n:3,why:'noevr',xah:Number(info.r.xah)||0};   let need=0; try{ const FL=(typeof ID!=='undefined'&&ID)?(ID.flow||ID.boxFlow):null; if(FL){ const v=Math.round(Number(FL.evr)*100)/100; need=v>0?v:1; } }catch(e){}     if(evr+1e-9<need) return {n:3,why:'lowevr',xah:Number(info.r.xah)||0,evr:evr,need:need};   const xa=Number(info.r.xah)||0, xn=(typeof HP_ST_XAH_NEED!=='undefined')?HP_ST_XAH_NEED:1.5; if(xa+1e-9<xn) return {n:3,why:'lowxah',xah:xa,evr:evr};   return {n:4,why:'ready',xah:xa,evr:evr}; }
function hpStCard(){ let c=document.getElementById('hp-start'); if(c) return c; const p=document.getElementById('p-post'); if(!p) return null;
  c=document.createElement('div'); c.className='card'; c.id='hp-start'; const st=document.getElementById('post-state'); if(st&&st.parentNode===p) p.insertBefore(c,st); else p.insertBefore(c,p.firstChild); return c; }
function hpStDraw(c,a,s){ const key=[s.n,s.why,a,s.xah,s.evr,HP_ST_QR?1:0,(typeof curLang==='function'?curLang():'')].join('|'); if(c.getAttribute('data-k')===key) return false; c.setAttribute('data-k',key);
  c.textContent=''; const el=(t,cls,txt)=>{ const e=document.createElement(t); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
  const btn=(k,fn,pri)=>{ const b=el('button','b'+(pri?' pri':''),T(k)); b.type='button'; b.addEventListener('click',fn); return b; };
  c.appendChild(el('h2','',T('bx_title'))); const ld=el('div','note',T('bx_lead')); ld.style.whiteSpace='pre-line'; c.appendChild(ld);
  const steps=[['bx_1'],['bx_2'],['bx_3'],['bx_4']];
  steps.forEach((x,i)=>{ const n=i+1, w=el('div','bx-step'); w.style.cssText='margin-top:10px;'+(n>s.n?'opacity:.55':'');
    const mark=n<s.n?'✓':n===s.n||(n===2&&s.n===1)?'▶':'・'; const h=el('div','',mark+' '+n+'. '+T(x[0])); h.style.fontWeight='600'; w.appendChild(h);
    const nt=t=>{ const d=el('div','note',t); d.style.whiteSpace='pre-line'; w.appendChild(d); return d; }; const row=el('div','row'); row.style.marginTop='4px';
    if(n===1){ nt(T('bx_1_nt')); const l=el('a','',T('bx_1_link')); l.href='https://xaman.app'; l.target='_blank'; l.rel='noopener'; const d=el('div','note'); d.appendChild(l); w.appendChild(d); }
    if(n===2){ if(a) nt(TF('bx_2_ok',{a:a})); else row.appendChild(btn('btn_bx_sign',()=>{ try{ hpXmPick(); }catch(e){} },true)); }
    if(n===3){ nt(T('bx_3_nt')); if(a){ nt(s.why==='read'?T('bx_3_read'):s.why==='noact'?T('bx_3_noact'):s.why==='noevr'?T('bx_3_noevr'):s.why==='lowevr'?TF('bx_3_low',{evr:hpNum(s.evr,6),need:s.need}):s.why==='lowxah'?TF('bx_3_lowxah',{xah:hpNum(s.xah,6),need:HP_ST_XAH_NEED}):TF('bx_3_ok',{xah:hpNum(s.xah,6),evr:hpNum(s.evr,6)}));
      if(s.n===3){ row.appendChild(btn(HP_ST_QR?'btn_bx_qr_hide':'btn_bx_qr',()=>{ HP_ST_QR=!HP_ST_QR; hpStTick(); },!HP_ST_QR)); row.appendChild(btn('btn_bx_reread',()=>{ try{ if(!HP_XM_RD) hpXmRead(a); }catch(e){} })); }
      if(s.n>=3&&typeof hpTuOpen==='function') row.appendChild(btn('btn_tu_open',()=>{ try{ hpTuOpen(); }catch(e){} }));   } }
    if(n===4){ nt(T('bx_4_nt')); if(s.n===4) row.appendChild(btn('btn_bx_hosts',()=>{ try{ const h=document.getElementById('post-hosts'); if(h&&h.scrollIntoView) h.scrollIntoView({block:'start',behavior:'smooth'}); }catch(e){} },true)); }
    if(row.children&&row.children.length) w.appendChild(row);
    if(n===3&&a&&HP_ST_QR&&s.n===3){ const q=el('div','bx-qr'); q.style.marginTop='8px';
      try{ const g=qrcode(0,'M'); g.addData(hpStText(a)); g.make(); const im=document.createElement('img'); im.src=g.createDataURL(5,2); im.alt='QR'; im.style.cssText='width:220px;max-width:100%;background:#fff;border-radius:6px;image-rendering:pixelated'; q.appendChild(im); }catch(e){ try{ hpLog('口座の QR を描けない '+e.message); }catch(_){} }
      q.appendChild(el('div','mono',a)); const qn=el('div','note',T('bx_qr_nt')); qn.style.whiteSpace='pre-line'; q.appendChild(qn); w.appendChild(q); }
    c.appendChild(w); });
  return true; }
function hpStTick(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; hpStGiftBtn(); try{ if(typeof hpFlTick==='function') hpFlTick(); }catch(e){}   try{ if(typeof hpBfTick==='function') hpBfTick(); }catch(e){}
  const bf=typeof hpBfOn==='function'&&hpBfOn(), show=bf||((typeof ID!=='undefined'&&!!ID)&&typeof hpNoBox==='function'&&hpNoBox()); let c=document.getElementById('hp-start');
  if(!show){ if(c) c.style.display='none'; return 'off'; }
  c=hpStCard(); if(!c) return ''; c.style.display=''; const a=hpXmAcct(), I=(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null, s=hpStStep(a,I); if(bf&&typeof hpBfDraw==='function'){ hpBfDraw(c,a,s);   } else if(!(typeof hpFlDraw==='function'&&hpFlDraw(c,a,s))) hpStDraw(c,a,s);
  const pp=document.getElementById('p-post'); if(s.n===3&&a&&pp&&pp.classList&&pp.classList.contains('on')&&!HP_XM_RD&&(!I||I.acct!==a||Date.now()-I.at>HP_ST_RE)){ hpXmRead(a); return 'read'; }
  return 'n'+s.n; }catch(e){ return ''; } }

function hpStGiftBtn(){ try{ const ac=document.getElementById('inv-acts'); if(!ac) return ''; let b=document.getElementById('btn-st-gift'); const on=!!(typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner);
  if(!b){ b=document.createElement('button'); b.className='b'; b.id='btn-st-gift'; b.type='button'; b.setAttribute('data-i18n','btn_bx_gift'); b.textContent=T('btn_bx_gift'); b.addEventListener('click',()=>{ hpStGift(); }); ac.appendChild(b); }
  b.style.display=on?'':'none'; return on?'on':''; }catch(e){ return ''; } }
function hpStGift(){ if(typeof ID==='undefined'||!ID){ try{ hpToast(T('pt_noid')); }catch(e){} return false; }
  const me=hpXmAcct(); if(!me){ hpTell(T('bx_g_noxm')); try{ const t=document.getElementById('t-post'); if(t&&t.click) t.click(); }catch(e){} return false; }
  if(typeof hpFlGiftAsk==='function'){ try{ if(hpFlGiftAsk(me)) return true; }catch(e){} }
  if(typeof startScanFull!=='function'){ hpTell(T('bx_g_noscan')); return false; }
  startScanFull(v=>{ const a=hpStParse(v); if(!a){ hpTell(T('bx_g_bad')); return; } if(a===me){ hpTell(T('bx_g_self')); return; } hpStGiftDlg(me,a,(typeof hpFlAmt==='function')?hpFlAmt(v):null); },{title:T('bx_g_scan'),hint:T('bx_g_hint')}); return true; }
function hpStCheck(src,dst,x,e){
  if(!(x>=0)||!(e>=0)||!(x+e>0)) return 'bx_g_zero'; if(!src) return 'xm_noacct';
  const have=(src.evr||[]).reduce((s,l)=>s+(Number(l.v)||0),0); if(e>0&&!(have>0)) return 'bx_g_noevr';
  const c=hpStCost(dst,x,e); if(Number(src.xah)-c.xah<1.5||have<e) return 'bx_g_short'; return ''; }
async function hpStGiftDlg(me,to,want){ const old=document.getElementById('st-dlg'); if(old&&old.parentNode) old.parentNode.removeChild(old);
  const el=(t,cls,txt)=>{ const e=document.createElement(t); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; e.style.whiteSpace='pre-line'; return e; };
  const box=el('div'); box.id='st-dlg'; box.style.cssText='position:fixed;inset:0;z-index:9100;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';
  const card=el('div','card'); card.style.cssText='max-width:440px;width:100%'; const close=()=>{ try{ if(box.parentNode) box.parentNode.removeChild(box); }catch(e){} };
  card.appendChild(el('h2','',T('bx_g_title'))); const kv=el('div','kv'); kv.appendChild(el('b','',T('bx_g_to'))); kv.appendChild(el('span','mono',to)); card.appendChild(kv);
  const who=el('div','note',T('bx_g_reading')); card.appendChild(who);
  const inp=(lab,v)=>{ const k=el('div','kv'); k.style.marginTop='6px'; k.appendChild(el('b','',lab)); const i=document.createElement('input'); i.type='number'; i.min='0'; i.step='0.1'; i.inputMode='decimal'; i.value=String(v); i.style.width='7em'; k.appendChild(i); card.appendChild(k); return i; };
  const ix=inp('XAH',(want&&want.xah>=0)?want.xah:HP_ST_XAH), ie=inp('EVR',(want&&want.evr>=0)?want.evr:HP_ST_EVR); if(want){ card.appendChild(el('div','note',T('want_note'))); }   const sum=el('div','note'); sum.style.marginTop='6px'; card.appendChild(sum);
  const qr=el('div'); qr.style.marginTop='8px'; card.appendChild(qr); const msg=el('div','note'); msg.style.marginTop='6px'; card.appendChild(msg);
  const row=el('div','row'); row.style.marginTop='10px'; card.appendChild(row); box.appendChild(card); document.body.appendChild(box);
  const mk=(k,fn,pri)=>{ const b=el('button','b'+(pri?' pri':''),T(k)); b.type='button'; b.addEventListener('click',fn); row.appendChild(b); return b; };
  let src=null, dst=null, iss='', ready=false; const go=mk('btn_bx_send',()=>{ hpStSend(); },true); mk('btn_close',()=>{ close(); }); go.disabled=true;
  const upd=()=>{ const x=Number(ix.value), e=Number(ie.value); if(!ready) return; const c=hpStCost(dst,x,e), why=hpStCheck(src,dst,x,e);
    sum.textContent=TF('bx_g_sum',{xah:hpNum(c.xah,6),evr:hpNum(c.evr,6)})+(c.act?'\n'+T('bx_g_act'):'')+(c.line?'\n'+T('bx_g_line'):'')+'\n'+T('bx_g_seen');
    const have=src?(src.evr||[]).reduce((s,l)=>s+(Number(l.v)||0),0):0; msg.textContent=why?TF(why,{xah:hpNum(src?src.xah:0,6),evr:hpNum(have,6)}):''; msg.style.color=why?'var(--red)':''; go.disabled=!!why||HP_ST_BUSY; };
  ix.addEventListener('input',upd); ie.addEventListener('input',upd);
  try{ const r=await Promise.all([hpEvAcct(to),hpEvAcct(me)]); dst=r[0]; src=r[1]; const L=(src&&src.evr||[]).find(l=>Number(l.v)>0)||(src&&src.evr||[])[0]; iss=L?String(L.issuer||''):'';
    const de=dst?(dst.evr||[]).reduce((s,l)=>s+(Number(l.v)||0),0):0; who.textContent=dst?TF('bx_g_has',{xah:hpNum(dst.xah,6),evr:hpNum(de,6)}):T('bx_g_new'); ready=true; upd(); }
  catch(e){ who.textContent=TF('rn_readfail',{why:(typeof hpErrShow==='function')?hpErrShow(e):String((e&&e.message)||e)}); who.style.color='var(--red)'; }
  async function hpStSend(){ if(HP_ST_BUSY||!ready) return false; const x=Number(ix.value), e=Number(ie.value); if(hpStCheck(src,dst,x,e)) return false; if(e>0&&!iss){ msg.textContent=T('bx_g_noevr'); return false; }
    HP_ST_BUSY=true; go.disabled=true; msg.style.color=''; msg.textContent=T('xm_checking');
    try{ await hpRentLibs(); if((await hpXmSignedAs(4000))!==me){ const ok=await hpXmEnsure(me,o=>{ msg.textContent=(o&&o.note)||''; }); if(!ok){ msg.textContent=T('rn_rejected'); return false; } }
      msg.textContent=T('bx_g_wait');
      const r=await hpXmSubmit(hpStTx(me,to,x,e,iss),TF('bx_g_instr',{xah:hpNum(x,6),evr:hpNum(e,6)}),cr=>{ try{ qr.textContent=''; if(cr&&cr.refs&&cr.refs.qr_png){ const im=document.createElement('img'); im.src=cr.refs.qr_png; im.alt='QR'; im.style.cssText='width:200px;max-width:100%;background:#fff;border-radius:6px'; qr.appendChild(im); }
        if(cr&&cr.next&&cr.next.always){ const l=document.createElement('a'); l.href=cr.next.always; l.target='_blank'; l.rel='noopener'; l.textContent=T('btn_bx_open'); const d=el('div','note'); d.appendChild(l); qr.appendChild(d); } }catch(_){} });
      qr.textContent='';
      if(!r.signed){ msg.textContent=T('rn_rejected'); msg.style.color='var(--red)'; return false; }
      if(r.result!=='tesSUCCESS'){ msg.textContent=TF('rn_txfail',{r:r.result||'?'}); msg.style.color='var(--red)'; return false; }
      ready=false; msg.textContent=T('bx_g_done'); try{ hpLog('友達に始めるぶんを送った（Remit） XAH '+x+'・EVR '+e); }catch(_){}
      setTimeout(async()=>{ try{ const d=await hpEvAcct(to); if(d){ const de=(d.evr||[]).reduce((s,l)=>s+(Number(l.v)||0),0); msg.textContent=T('bx_g_done')+'\n'+TF('bx_g_after',{xah:hpNum(d.xah,6),evr:hpNum(de,6)}); } }catch(_){} },6000);
      return true; }
    catch(err){ qr.textContent=''; msg.textContent=TF('bx_g_fail',{why:String((err&&err.message)||err)}); msg.style.color='var(--red)'; return false; }
    finally{ HP_ST_BUSY=false; try{ upd(); }catch(_){} } }
  return box; }

var HP_IF_CANT='';
function hpIfCant(){ try{
  if(typeof ID==='undefined'||!ID) return T('e_inv_noid');
  if(typeof hpPostNone==='function'&&hpPostNone()) return T('if_cant_nobox');
  if(typeof POST!=='undefined'&&POST&&POST.notOwner) return T('e_card_notowner');
  if(!(Array.isArray(ID.roster)&&ID.roster.length)) return T('if_cant_roster');
  return ''; }catch(e){ return ''; } }
hpIfRotate=(function(f){ return async function(why){
  const c=hpIfCant();
  if(c){ if(HP_IF_CANT!==c) hpLog('目の前用の QR は作れない（'+c+'）。やり直しを止めた'); HP_IF_CANT=c; HP_IF_ERR=c; HP_IF_ON=false; try{ hpInvDraw(); }catch(e){} try{ hpIfQuickDraw(); }catch(e){} return false; }
  HP_IF_CANT=''; return await f.apply(this,arguments); }; })(hpIfRotate);
hpIfLine=(function(f){ return function(){ if(HP_IF_CANT) return HP_IF_CANT; return f.apply(this,arguments); }; })(hpIfLine);

try{ hpIfBoot(); }catch(e){}
