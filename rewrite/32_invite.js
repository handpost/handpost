const HP_INV_TTL=12*3600e3, HP_INV_WAIT=15000;
const HP_INV_KEEP=7*86400e3, HP_INV_POLL=30e3, HP_INV_QUIET=10*60e3; let HP_INV_BGPOLL=5*60e3;
let HP_INV_LIST=null, HP_INV_LAST=0, HP_INV_ON=false, HP_INV_T=null, HP_INV_BUSY=false;
let HP_INV_CUR=null;
let HP_INV_W=null;
let HP_IVJ=null, HP_IVJ_BUSY=false, HP_IVJ_T=null, HP_IVJ_OKN=0;
const hpIvB64u=u8=>hp5S().to_base64(u8, sodium.base64_variants.URLSAFE_NO_PADDING);
const hpIvUn64u=t=>hp5S().from_base64(t, sodium.base64_variants.URLSAFE_NO_PADDING);
function hpInvKeys(sec){ const s=hp5S(); return { id:hpHex(s.crypto_generichash(16, s.from_string('handpost-invite-id:v1'), sec)), k:s.crypto_generichash(32, s.from_string('handpost-invite-key:v1'), sec), v:s.crypto_generichash(32, s.from_string('handpost-invite-req:v1'), sec) }; }
function hpInvProof(v, from, to){ const s=hp5S(); return hpHex(s.crypto_generichash(16, s.from_string('handpost-invite-req:v1:'+from+':'+to), v)); }
function hpInvAD(who,id){ return hp5S().from_string('handpost-invite:v1:'+who+':'+id); }
function hpInvSeal(text, who, K){ const s=hp5S(), n=s.randombytes_buf(24); return s.to_base64(hp5Cat(n, s.crypto_aead_xchacha20poly1305_ietf_encrypt(s.from_string(text), hpInvAD(who,K.id), null, n, K.k)), sodium.base64_variants.ORIGINAL); }
function hpInvOpen(box, who, K){ const s=hp5S(), b=s.from_base64(box, sodium.base64_variants.ORIGINAL); if(b.length<40) throw new Error('短すぎる'); return new TextDecoder().decode(s.crypto_aead_xchacha20poly1305_ietf_decrypt(null, b.slice(24), hpInvAD(who,K.id), b.slice(0,24), K.k)); }

function hpInvHost(url){ const m=String(url||'').match(/^wss:\/\/([A-Za-z0-9.-]+|\[[0-9A-Fa-f:.]+\])(:[0-9]{1,5})?\/?$/); return m?(m[1]+(m[2]||'')):''; }
function hpInvLink(who, host, sec){ let o=''; try{ o=hpShareOrigin(); }catch(e){} return o+'/#join='+who+'/'+host+'/'+hpIvB64u(sec); }

function hpIvjParse(text){
  const m=String(text||'').match(/#join=([^\s#"'<>]+)/); if(!m) return null;
  const p=m[1].split('/'); if(p.length!==3) return null;
  if(!/^hp1[0-9a-f]{64}$/.test(p[0])||!hpInvHost('wss://'+p[1])||!/^[A-Za-z0-9_-]{43}$/.test(p[2])) return null;
  return { who:p[0], host:p[1], s:p[2], raw:'#join='+m[1] };
}

function hpInvOnReply(o){ const W=HP_INV_W; if(!W||!o) return; if(o.ok===W.wait){ W.ok=true; W.res=o; } else if(o.err){ W.err=String(o.err); W.res=o; } }
async function hpInvReq(msg){
  if(!POST.up||POST.notOwner) throw new Error(T('e_inv_nopost'));
  for(let i=0;i<50&&(HP_INV_W||(typeof HP_BK!=='undefined'&&HP_BK)||(typeof HP_LINK!=='undefined'&&HP_LINK&&HP_LINK.wait));i++) await sleep(100);
  if(HP_INV_W) throw new Error(T('e_inv_busy'));
  const W={ wait:msg.op, ok:false, err:null, res:null }; HP_INV_W=W;
  try{ await hpSend(msg); const t0=Date.now(); while(!W.ok&&!W.err&&Date.now()-t0<HP_INV_WAIT) await sleep(100); }
  finally{ HP_INV_W=null; }
  if(W.err){ const e=new Error(W.err); e.inv=W.res; throw e; }
  if(!W.ok) throw new Error(T('e_inv_noreply'));
  return W.res;
}
async function hpInvMake(){
  if(!ID) throw new Error(T('e_inv_noid'));
  if(!POST.up) throw new Error(T('e_inv_nopost'));
  if(POST.notOwner) throw new Error(T('e_card_notowner'));
  const host=hpInvHost(POST.url); if(!host) throw new Error(T('e_inv_host'));
  await hpReady();
  const card=await hpCard();
  const sec=hp5S().randombytes_buf(32), K=hpInvKeys(sec), exp=Date.now()+HP_INV_TTL;
  let r; try{ r=await hpInvReq({ op:'iset', id:K.id, exp:exp, box:hpInvSeal(card, ID.address, K) }); }
  catch(e){ hpLog('招待を預けられない '+e.message); throw new Error(e.message==='too many'?T('e_inv_many'):(e.message==='too big'?T('e_inv_big')  :(e.inv?T('e_inv_post'):e.message))); }
  HP_INV_CUR={ link:hpInvLink(ID.address, host, sec), exp:Number(r.exp)||exp, id:K.id, used:0 };
  hpInvKeep({ id:K.id, v:hpHex(K.v), exp:HP_INV_CUR.exp, at:Date.now() });
  HP_INV_LIST=null; HP_INV_LAST=0;
  hpLog('招待を作った '+K.id.slice(0,8)+'（'+new Date(HP_INV_CUR.exp).toLocaleString()+' まで。1 回だけ）');
  return HP_INV_CUR;
}
function hpInvTime(t){ try{ return new Date(t).toLocaleString([], {month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}); }catch(e){ return new Date(t).toLocaleString(); } }

function hpInvLeft(ms){ const m=Math.max(1,Math.floor(ms/60000)), h=Math.floor(m/60), r=m%60; return h?(r?TF('inv_hm',{h:h,m:r}):TF('inv_h',{h:h})):TF('inv_m',{m:m}); }
function hpInvUntil(exp){ const ms=exp-Date.now(); return ms<60e3?TF('nt_inv_soon',{t:hpInvTime(exp)}):TF('nt_inv_until',{left:hpInvLeft(ms),t:hpInvTime(exp)}); }

function hpInvDraw(){
  const cv=document.getElementById('qrcanvas'), ad=document.getElementById('qr-addr'), ac=document.getElementById('inv-acts'), us=document.getElementById('qr-used'); if(!cv) return;
  const cur=(HP_INV_CUR&&HP_INV_CUR.exp>Date.now())?HP_INV_CUR:null;
  if(!cur&&HP_INV_CUR){ HP_INV_CUR=null; }
  let drawn=false; if(cur){ try{ QR.draw(cv, cur.link); drawn=true; }catch(e){ log(TL('lg_qrfail',{err:e.message})); } }
  const used=!!(drawn&&cur.used);
  cv.style.display=drawn?'block':'none'; cv.style.opacity=used?'0.25':'';
  if(us) us.style.display=used?'flex':'none';
  if(ad) ad.textContent=drawn?(used?TF('nt_inv_used',{t:hpInvTime(cur.used)}):hpInvUntil(cur.exp)):'';
  if(ac) ac.style.display=(drawn&&!used)?'':'none';
  hpInvListDraw();
}

async function hpInvQuick(){
  let w=document.getElementById('hq-pop');
  if(!w){ w=document.createElement('div'); w.id='hq-pop'; w.innerHTML='<div class="hq-box"><b class="hq-t"></b><canvas class="hq-cv" width="220" height="220"></canvas><div class="note hq-n"></div><div class="row"><button class="b hq-copy"></button><button class="b hq-close"></button></div></div>'; document.body.appendChild(w); w.addEventListener('click',e=>{ if(e.target===w) w.classList.remove('on'); }); }
  const q=s=>w.querySelector(s), cv=q('.hq-cv'), nt=q('.hq-n'), cp=q('.hq-copy'), cl=q('.hq-close');
  q('.hq-t').textContent=T('ct_qr'); cp.textContent=T('btn_inv_copy'); cl.textContent=T('btn_close'); cl.onclick=()=>{ w.classList.remove('on'); };
  cv.style.display='none'; cp.style.display='none'; nt.textContent=T('hq_making'); w.classList.add('on');
  let cur=(HP_INV_CUR&&HP_INV_CUR.exp>Date.now()&&!HP_INV_CUR.used)?HP_INV_CUR:null, how='reuse';
  if(!cur){ how='made'; try{ await hpInvMake(); cur=HP_INV_CUR; }catch(e){ nt.textContent=(typeof hpErrShow==='function'?hpErrShow(e):e.message); return 'err'; } finally{ try{ hpInvDraw(); }catch(_){} } }
  if(!cur){ nt.textContent=T('e_inv_post'); return 'err'; }
  try{ QR.draw(cv, cur.link); cv.style.display='block'; }catch(e){ nt.textContent=(typeof hpErrShow==='function'?hpErrShow(e):e.message); return 'err'; }
  nt.textContent=hpInvUntil(cur.exp)+' '+T('nt_hq'); cp.style.display='';
  cp.onclick=()=>{ const done=()=>{ const t=cp.textContent; cp.textContent='\u2713'; setTimeout(()=>{ cp.textContent=t; },1500); log(TL('lg_inv_copied')); }; try{ navigator.clipboard.writeText(cur.link).then(done).catch(()=>{ prompt(T('pr_inv_copy'), cur.link); }); }catch(e){ prompt(T('pr_inv_copy'), cur.link); } };
  return how;
}
function hpInvWho(id){
  const rec=((ID&&ID.invites)||[]).find(r=>r.id===id);
  if(rec&&rec.by){ if(isContact(rec.by)) return nickOf(rec.by); const q=(REQUESTS||[]).find(x=>x&&x.hp&&x.from===rec.by); return (q&&q.name)||hpIdShort(rec.by); }
  const q=(REQUESTS||[]).find(x=>x&&x.hp&&x.inv&&x.inv.id===id&&x.inv.ok!==0); if(q) return q.name||hpIdShort(q.from);
  return '';
}
function hpInvListDraw(){
  const box=document.getElementById('inv-list'); if(!box) return; box.innerHTML='';
  const now=Date.now(), items=HP_INV_LIST?HP_INV_LIST.items.filter(x=>x.exp>now&&!(typeof HP_LQ_IDS!=='undefined'&&HP_LQ_IDS.has(x.id)))  .sort((a,b)=>b.exp-a.exp):[];
  if(!items.length) return;
  const h=document.createElement('div'); h.className='note'; h.style.cssText='margin-top:12px;font-weight:600'; h.textContent=T('ct_inv_list'); box.appendChild(h);
  for(const it of items){
    const row=document.createElement('div'); row.className='row'; row.style.cssText='align-items:center;gap:8px';
    const tx=document.createElement('div'); tx.className='note'; tx.style.cssText='flex:1;margin:0'; row.appendChild(tx);
    if(!it.used){
      tx.textContent=TF('inv_row_open',{left:hpInvLeft(it.exp-now),t:hpInvTime(it.exp)});
      const b=document.createElement('button'); b.className='b'; b.textContent=T('btn_inv_del'); b.onclick=()=>{ hpInvDel(it.id,b); }; row.appendChild(b);
    } else {
      const who=hpInvWho(it.id), t=hpInvTime(it.used);
      if(who) tx.textContent=TF('inv_row_by',{t:t,name:who});
      else if(now-it.used<HP_INV_QUIET) tx.textContent=TF('inv_row_wait',{t:t});
      else { tx.textContent=TF('inv_row_none',{t:t}); tx.style.color='var(--amber)'; try{ if(typeof hpNote==='function') hpNote('invnoreq',{t:t},'invnoreq:'+it.id); }catch(e){}   }
    }
    box.appendChild(row);
  }
}
async function hpInvRefresh(){
  if(HP_INV_BUSY||!ID||!POST.up||POST.notOwner||HP_INV_W) return false;
  HP_INV_BUSY=true; HP_INV_LAST=Date.now();
  try{
    const r=await hpInvReq({op:'ilist'}), now=Date.now();
    const items=(Array.isArray(r.items)?r.items:[]).filter(x=>x&&/^[0-9a-f]{32}$/.test(String(x.id))&&Number(x.exp)>now).map(x=>({id:x.id, exp:Number(x.exp), used:Number(x.used)||0}));
    HP_INV_LIST={ at:now, items:items };
    if(HP_INV_CUR){ const it=items.find(x=>x.id===HP_INV_CUR.id);
      if(!it){ hpLog('画面の招待は、もうポストに無い（取り消し・期限） '+HP_INV_CUR.id.slice(0,8)); HP_INV_CUR=null; }
      else if(it.used&&!HP_INV_CUR.used){ HP_INV_CUR.used=it.used; hpLog('招待が使われた '+it.id.slice(0,8)); } }
    hpInvDraw(); return true;
  }catch(e){ hpLog('招待の一覧を読めない '+e.message); return false; }
  finally{ HP_INV_BUSY=false; }
}
function hpInvWatch(){ const now=Date.now(); return !!((HP_INV_CUR&&HP_INV_CUR.exp>now)||((ID&&ID.invites)||[]).some(r=>r.exp>now)||(HP_INV_LIST&&HP_INV_LIST.items.some(x=>x.exp>now))); }

function hpInvTick(){
  const pg=document.getElementById('p-contacts'), on=!!(pg&&pg.classList&&pg.classList.contains('on'))&&!(typeof document!=='undefined'&&document.visibilityState==='hidden');
  const was=HP_INV_ON; HP_INV_ON=on; if(!on){ if(Date.now()-HP_INV_LAST>=HP_INV_BGPOLL&&hpInvWatch()) hpInvRefresh().catch(()=>{}); return; }
  hpInvDraw();
  const now=Date.now();
  if((!was&&now-HP_INV_LAST>=5000)||(now-HP_INV_LAST>=HP_INV_POLL&&hpInvWatch())) hpInvRefresh().catch(()=>{});
}
async function hpInvDel(id, btn){
  if(!(await hpAsk({text:T('cf_inv_del'), danger:true, ok:T('btn_inv_del')}))) return false;
  if(btn) btn.disabled=true;
  try{ await hpInvReq({op:'idel', id:id}); }
  catch(e){ hpLog('招待を取り消せない '+e.message); alert(T('e_inv_del')); if(btn) btn.disabled=false; return false; }
  if(HP_INV_CUR&&HP_INV_CUR.id===id) HP_INV_CUR=null;
  if(HP_INV_LIST) HP_INV_LIST.items=HP_INV_LIST.items.filter(x=>x.id!==id);
  if(ID&&Array.isArray(ID.invites)){ ID.invites=ID.invites.filter(r=>r.id!==id); saveID(); }
  hpLog('招待を取り消した '+id.slice(0,8)); hpInvDraw(); return true;
}
function hpInvKeep(rec){ if(!ID) return; const now=Date.now(); ID.invites=(Array.isArray(ID.invites)?ID.invites:[]).filter(r=>r&&r.exp+HP_INV_KEEP>now).concat([rec]).slice(-40); saveID(); }

function hpInvNorm(x){ if(x&&typeof x==='object'&&/^[0-9a-f]{32}$/.test(String(x.id))&&/^[0-9a-f]{32}$/.test(String(x.m))) return { id:x.id, m:x.m }; return x?1:0; }

function hpInvCheck(from, iv){
  if(!iv||iv===1) return iv?1:0;
  const rec=((ID&&ID.invites)||[]).find(r=>r.id===iv.id);
  if(!rec){ hpLog('招待からの申請（この端末で作った招待ではないので、印は確かめない） '+iv.id.slice(0,8)); return { id:iv.id }; }
  let ok=false; try{ ok=hpInvProof(hp5S().from_hex(rec.v), from, ID.address)===iv.m; }catch(e){ ok=false; }
  if(!ok){ hpLog('招待の印が合わない '+iv.id.slice(0,8)+' ← '+hpIdShort(from)); try{ if(typeof hpNote==='function') hpNote('invbad',{name:hpIdShort(from)},'invbad:'+iv.id+':'+from); }catch(e){}   return { id:iv.id, ok:0 }; }
  if(!rec.by){ rec.by=from; rec.byAt=Date.now(); saveID(); } else if(rec.by!==from){ hpLog('同じ招待から別の相手の申請 '+iv.id.slice(0,8)+'（秘密がほかにも渡っている）'); try{ if(typeof hpNote==='function') hpNote('invdup',{name:hpIdShort(from)},'invdup:'+iv.id+':'+from); }catch(e){} }
  if(HP_INV_CUR&&HP_INV_CUR.id===iv.id&&!HP_INV_CUR.used) HP_INV_CUR.used=Date.now();
  if(HP_INV_LIST){ const it=HP_INV_LIST.items.find(x=>x.id===iv.id); if(it&&!it.used) it.used=Date.now(); }
  hpLog('招待の印を確かめた '+iv.id.slice(0,8)+' ← '+hpIdShort(from));
  try{ hpInvDraw(); }catch(e){}
  return { id:iv.id, ok:1 };
}

function hpInvSentRow(peer){
  try{
    if(CURPEER!==peer||typeof document==='undefined'||typeof document.querySelector!=='function') return 0;
    const c=((ID&&ID.contacts)||[]).find(x=>x.address===peer); if(!c||!c.invSent) return 0;
    const box=document.querySelector('#msgs'); if(!box||typeof box.querySelectorAll!=='function') return 0;
    for(const old of box.querySelectorAll('.hpinvs')) old.remove();
    const d=document.createElement('div'); d.className='m sys hpinvs';
    const got=histLoad(peer).some(x=>x.d==='p'); d.textContent=TF(got?'sys_inv_sent2':'sys_inv_sent',{name:nickOf(peer)});
    if(!got&&typeof c.invPics==='string'&&c.invPics){ d.textContent+='\n'+TF('if_req',{p:c.invPics}); try{ d.style.whiteSpace='pre-line'; }catch(e){} }
    const nx=Array.from(box.querySelectorAll('.m')).find(el=>el.dataset&&el.dataset.ts&&Number(el.dataset.ts)>c.invSent);
    if(nx) box.insertBefore(d,nx); else box.appendChild(d);
    return 1;
  }catch(e){ return 0; }
}
function hpInvUiInit(){
  const mk=document.getElementById('btn-inv-make'), cp=document.getElementById('btn-inv-copy'); if(!mk) return;
  mk.onclick=async()=>{ if(mk.disabled) return; mk.disabled=true; try{ await hpInvMake(); hpInvDraw(); }catch(e){ alert((typeof hpErrShow==='function'?hpErrShow(e):e.message)); } finally{ mk.disabled=false; } };
  if(cp) cp.onclick=()=>{ const cur=HP_INV_CUR; if(!cur||!(cur.exp>Date.now())){ hpInvDraw(); return; }
    const done=()=>{ const t=cp.textContent; cp.textContent='\u2713'; setTimeout(()=>{ cp.textContent=t; },1500); log(TL('lg_inv_copied')); };
    try{ navigator.clipboard.writeText(cur.link).then(done).catch(()=>{ prompt(T('pr_inv_copy'), cur.link); }); }catch(e){ prompt(T('pr_inv_copy'), cur.link); } };
  hpInvDraw();
  try{ const hq=document.getElementById('me-qr'); if(hq) hq.onclick=()=>{ hpInvQuick(); }; }catch(e){}
  if(!HP_INV_T) HP_INV_T=setInterval(hpInvTick,5000);
}

function hpIvjErr(k,msg){ const e=new Error(msg||k); e.hpj=k; return e; }
function hpIvjWhy(e){ return ({dead:'e_inv_dead',used:'e_inv_used',none:'e_inv_none',wait:'e_inv_conn',old:'e_inv_old',self:'e_inv_self'})[e&&e.hpj]||'e_inv_bad'; }
async function hpInvGet(url, id){
  let c; try{ c=await HotPocket.createClient([url], await HotPocket.generateKeys()); }catch(e){ throw hpIvjErr('wait','つながらない'); }
  const replies=[]; c.on(HotPocket.events.contractOutput, r=>{ for(const out of r.outputs){ try{ replies.push(JSON.parse(hpText(out))); }catch(e){} } });
  let up=false; try{ up=await c.connect(); }catch(e){ up=false; } if(!up) throw hpIvjErr('wait','つながらない');
  try{ await c.submitContractInput(JSON.stringify({op:'iget', id:id})); const t0=Date.now(); while(!replies.length&&Date.now()-t0<HP_INV_WAIT) await sleep(50); if(!replies.length) throw hpIvjErr('wait','返事がない'); return replies[0]; }
  finally{ try{ await c.close(); }catch(e){} }
}
async function hpIvjFetch(j){
  await hpReady();
  const K=hpInvKeys(hpIvUn64u(j.s));
  const r=await hpInvGet('wss://'+j.host, K.id);
  if(r&&r.err==='used') throw hpIvjErr('used','used');
  if(r&&r.err==='none') throw hpIvjErr('none','none');
  if(r&&r.err==='killed'){ if(r.id===j.who&&typeof hpKillLearn==='function'&&(await hpKillLearn(r,'招待の返事'))) throw hpIvjErr('dead','killed'); throw hpIvjErr('bad','失効証明書が合わない'); }
  if(!r||r.ok!=='iget'||typeof r.box!=='string') throw hpIvjErr('bad','返事の形が違う '+String(r&&r.err||''));
  let card; try{ card=JSON.parse(hpInvOpen(r.box, j.who, K)); }catch(e){ throw hpIvjErr('bad','封が開かない'); }
  try{ await hpCardCheck(card); }catch(e){ throw hpIvjErr(e.hpc==='old'?'old':'bad', e.message); }
  if(card.id!==j.who) throw hpIvjErr('bad','名刺の ID がリンクと違う');
  return card;
}

function hpInvPendOf(addr){ try{ const c=((ID&&ID.contacts)||[]).find(x=>x.address===addr); return !!(c&&c.invPend&&!c.invSent&&!histLoad(addr).some(x=>x&&x.d==='p')); }catch(e){ return false; } }
async function hpIvjSend(card, text, inv){
  if(!POST.up||POST.notOwner) throw new Error(T('e_inv_nopost'));
  const had0=isContact(card.id);
  const peer=card.id; await hpAddCard(JSON.stringify(card), '');
  if(!had0){ const c0=((ID&&ID.contacts)||[]).find(x=>x.address===peer); if(c0&&!c0.invSent){ c0.invPend=Date.now(); saveID(); } }
  if(!had0){ const cw=((ID&&ID.contacts)||[]).find(x=>x.address===peer); if(cw&&!cw.ivWait){ cw.ivWait=Date.now(); saveID(); } }
  const ts=Date.now(); text=String(text||'').trim();
  const iv=(inv&&typeof inv==='object')?{ id:inv.id, m:inv.m }:null;
  if(text){ histAdd(peer,'s',text,ts,1); if(iv) hpHistPatch(peer,ts,m=>{ m.iv=iv; });   await hpSendText(peer,text,ts); { const c1=((ID&&ID.contacts)||[]).find(x=>x.address===peer); if(c1&&c1.invPend){ delete c1.invPend; saveID(); } }   hpLog('友達申請を送った（招待から。一言つき）→ '+nickOf(peer)); return { peer:peer, text:true }; }
  const body={ v:1, type:'msg', id:ts, text:'', inv:iv||1 }; const nm=(typeof myName==='function')?myName():''; if(nm) body.name=nm;
  body.card=JSON.parse(await hpCard()); try{ hpTkNote(peer, body.card.token.id, body.card.token.exp); }catch(e){}
  await hpPut(card, JSON.stringify(body), 'msg', {ring:true});
  { const cc=((ID&&ID.contacts)||[]).find(x=>x.address===peer); if(cc){ cc.invSent=ts; delete cc.invPend;   saveID(); } }
  hpLog('友達申請を送った（招待から）→ '+nickOf(peer));
  return { peer:peer, text:false };
}

function hpIvjDlg(){
  const old=document.getElementById('inv-dlg'); if(old) old.remove();
  const box=document.createElement('div'); box.id='inv-dlg';
  box.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
  const card=document.createElement('div'); card.className='card'; card.style.cssText='max-width:420px;width:100%';
  const h=document.createElement('h2'); h.textContent=T('inv_title');
  const p=document.createElement('div'); p.id='inv-msg'; p.style.cssText='margin:8px 0;line-height:1.5'; p.textContent=T('inv_wait');
  const ta=document.createElement('textarea'); ta.id='inv-text'; ta.maxLength=500; ta.placeholder=T('ph_inv_text'); ta.style.cssText='width:100%;min-height:60px;display:none';
  const er=document.createElement('div'); er.id='inv-err'; er.className='note'; er.style.color='var(--amber)';
  const row=document.createElement('div'); row.className='row'; row.style.marginTop='10px';
  const sd=document.createElement('button'); sd.className='b pri'; sd.id='inv-send'; sd.textContent=T('btn_inv_send'); sd.style.display='none';
  const cl=document.createElement('button'); cl.className='b'; cl.id='inv-cancel'; cl.textContent=T('btn_inv_close'); cl.style.display='none';
  const nt=document.createElement('div'); nt.className='note'; nt.id='inv-note'; nt.style.display='none'; nt.textContent=T('nt_inv_once');
  row.appendChild(sd); row.appendChild(cl); card.appendChild(h); card.appendChild(p); card.appendChild(ta); card.appendChild(er); card.appendChild(row); card.appendChild(nt); box.appendChild(card); document.body.appendChild(box);
  const close=()=>{ try{ box.remove(); }catch(e){} };
  return {
    msg(t){ p.textContent=t; ta.style.display='none'; sd.style.display='none'; nt.style.display='none'; er.textContent=''; cl.textContent=T('btn_inv_close'); cl.style.display=''; cl.onclick=close; },
    ask(c, inv){
      const nm=hpCardNameOf(c);
      p.textContent=TF('inv_ask',{name:nm||T('inv_noname'), id:hpIdShort(c.id)});
      ta.style.display='block'; sd.style.display=''; nt.style.display=''; cl.textContent=T('btn_inv_cancel'); cl.style.display='';
      cl.onclick=()=>{ hpLog('招待から申請を送らなかった（この招待はもう使えない）'); close(); };
      let busy=false;
      sd.onclick=async()=>{ if(busy) return; busy=true; sd.disabled=true; er.textContent='';
        try{ const r=await hpIvjSend(c, ta.value, inv);
          if(typeof hpIfSentStay==='function'&&hpIfSentStay(r,c,inv,close)) return;
          close();
          try{ openConversation(r.peer,true); }catch(e){}   }
        catch(e){ hpLog('招待から申請を送れない '+(e.hpWhy||e.message)); er.textContent=(e.message===T('e_inv_nopost'))?e.message:T('e_inv_send'); sd.textContent=T('btn_inv_retry'); }
        finally{ busy=false; sd.disabled=false; } };
      try{ ta.focus(); }catch(e){}
    },
    close:close
  };
}
async function hpIvjRun(j){
  if(!j||j.bad){ hpLog('招待のリンクとして読めない'); hpIvjDlg().msg(T('e_inv_bad')); return; }
  if(j.who===ID.address){ hpIvjDlg().msg(T('e_inv_self')); return; }
  hpLog('招待を開く '+hpIdShort(j.who)+' @ '+j.host);
  const d=hpIvjDlg();
  let card; try{ card=await hpIvjFetch(j); }catch(e){ hpLog('招待を開けない（'+(e.hpj||'bad')+'：'+e.message+'）'); try{ if(typeof hpFlOpenLate==='function'&&hpFlOpenLate(j,e)) return; }catch(_){}   d.msg(T(hpIvjWhy(e))); return; }
  hpLog('招待の名刺を確かめた '+hpIdShort(card.id)+'（端末 '+card.devices.length+' 台）');
  if(isContact(card.id)&&!hpInvPendOf(card.id)){
    try{ const c=await hpAddCard(JSON.stringify(card),''); d.msg(TF('nt_inv_had',{name:(c&&c.nick)||hpIdShort(card.id)})); }catch(e){ d.msg(T('e_inv_bad')); }
    return;
  }
  const K=hpInvKeys(hpIvUn64u(j.s)); d.ask(card, { id:K.id, m:hpInvProof(K.v, ID.address, card.id) });
}

function hpIvjReady(){ return !!ID&&!document.getElementById('vault-lock')&&!document.getElementById('paper-flow')&&!document.getElementById('restore-flow'); }
function hpIvjTick(){
  if(!HP_IVJ){ if(HP_IVJ_T){ clearInterval(HP_IVJ_T); HP_IVJ_T=null; } return; }
  if(HP_IVJ_BUSY) return;
  if(!hpIvjReady()){ HP_IVJ_OKN=0; return; }
  if(++HP_IVJ_OKN<2) return;
  const j=HP_IVJ; HP_IVJ=null; HP_IVJ_BUSY=true;
  hpIvjRun(j).catch(e=>{ hpLog('招待の処理で失敗 '+e.message); }).finally(()=>{ HP_IVJ_BUSY=false; });
}
function hpIvjSet(j){ HP_IVJ=j||{bad:1}; HP_IVJ_OKN=0; if(!ID) hpLog('招待を覚えた（アカウントが使えるようになったら開く）'); if(!HP_IVJ_T) HP_IVJ_T=setInterval(hpIvjTick,700); }

function hpIvjTake(){
  try{ const h=String(location.hash||''); if(!/^#join=/.test(h)) return null; const j=hpIvjParse(h); try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} return j||{bad:1}; }catch(e){ return null; }
}

const HP_IVJ_TAB=Math.random().toString(36).slice(2); let HP_IVJ_AWAY=false;
const HP_IVJ_CLOSE_MS=400;
const HP_IVJ_CH=(typeof BroadcastChannel==='function')?new BroadcastChannel('handpost-join'):null;
if(HP_IVJ_CH) HP_IVJ_CH.onmessage=e=>{ const d=(e&&e.data)||{}; if(HP_IVJ_AWAY) return;
  if(d.t==='who') HP_IVJ_CH.postMessage({t:'here', n:d.n, tab:HP_IVJ_TAB});
  else if(d.t==='join'&&d.to===HP_IVJ_TAB){ HP_IVJ_CH.postMessage({t:'took', n:d.n}); hpIvjSet(hpIvjParse(String(d.v||''))); hpLog('別のタブで開いた招待を受け取った'); try{ window.focus(); }catch(_){} } };
async function hpIvjHandoff(j){
  if(!HP_IVJ_CH||!j||j.bad) return false;
  HP_IVJ_AWAY=true; const n=Math.random().toString(36).slice(2); let tab=null, took=false;
  const ch=new BroadcastChannel('handpost-join'); ch.onmessage=e=>{ const d=(e&&e.data)||{}; if(d.n!==n) return; if(d.t==='here'&&!tab) tab=d.tab; if(d.t==='took') took=true; };
  try{
    ch.postMessage({t:'who', n:n}); for(let i=0;i<5&&!tab;i++) await sleep(100);
    if(!tab) return false;
    ch.postMessage({t:'join', to:tab, n:n, v:j.raw}); for(let i=0;i<20&&!took;i++) await sleep(100);
    if(!took) return false;
    const b=document.createElement('div'); b.id='inv-away'; b.style.cssText='position:fixed;inset:0;z-index:9999;background:var(--bg,#0b1220);display:flex;align-items:center;justify-content:center;padding:24px';
    const c=document.createElement('div'); c.className='card'; c.style.cssText='max-width:420px;width:100%'; const h=document.createElement('h2'); h.textContent=T('inv_title'); const p=document.createElement('div'); p.style.lineHeight='1.6'; p.textContent=T('nt_inv_away');
    c.appendChild(h); c.appendChild(p); b.appendChild(c); document.body.appendChild(b);
    setTimeout(()=>{ try{ window.close(); }catch(e){} },HP_IVJ_CLOSE_MS);
    return true;
  } finally{ try{ ch.close(); }catch(e){} if(!took) HP_IVJ_AWAY=false; }
}
try{ if(typeof window!=='undefined'&&typeof window.addEventListener==='function') window.addEventListener('hashchange',()=>{ const j=hpIvjTake(); if(j) hpIvjSet(j); }); }catch(e){}

function hpIvIos(){ try{ return /iPhone|iPad|iPod/.test(navigator.userAgent||''); }catch(e){ return false; } }
function hpIvStand(){ try{ return !!navigator.standalone||!!(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches); }catch(e){ return false; } }
function hpIvNoAcct(){ try{ if(typeof hpIosHasAcct==='function') return !hpIosHasAcct(); return !(typeof ID!=='undefined'&&ID); }catch(e){ return false; } }
function hpIvEl(tag,cls,id,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(id) e.id=id; if(txt!=null) e.textContent=txt; return e; }
function hpIvjIosFirst(j){
  if(!j||j.bad||!hpIvIos()||hpIvStand()||!hpIvNoAcct()||typeof hpAsk!=='function') return false;
  let o=''; try{ o=hpShareOrigin(); }catch(e){} if(!o){ try{ o=location.origin; }catch(e){} } const link=o+'/'+j.raw;
  const d=hpIvEl('div'), ta=hpIvEl('textarea','','ivi-link'); ta.readOnly=true; ta.value=link; ta.rows=3; ta.style.cssText='width:100%;margin-top:10px;font-size:12px;word-break:break-all';
  const b=hpIvEl('button','b pri','btn-ivi-copy',T('btn_ivi_copy')); b.type='button'; b.style.marginTop='8px'; const msg=hpIvEl('div','note','ivi-msg'); msg.style.marginTop='6px';
  b.onclick=async()=>{ let ok=false; try{ await navigator.clipboard.writeText(link); ok=true; }catch(e){ try{ ta.focus(); ta.select(); ok=!!(document.execCommand&&document.execCommand('copy')); }catch(x){} } msg.textContent=T(ok?'ivi_copied':'ivi_copy_no'); msg.style.color=ok?'var(--teal)':'var(--amber)'; return ok; };
  const nt=hpIvEl('div','note','',T('ivi_note')); nt.style.marginTop='10px'; d.appendChild(ta); d.appendChild(b); d.appendChild(msg); d.appendChild(nt);
  hpAsk({title:T('ivi_title'),text:T('ivi_text'),node:d,noOk:true,cancel:T('btn_ivi_close')});
  try{ hpLog('招待状から来た iPhone の Safari：先にホーム画面に追加する案内を出した'); }catch(e){} return true; }
function hpIvjTakeText(t){ const j=hpIvjParse(t); if(!j) return 'ivp_e_bad'; hpIvjSet(j); try{ hpLog('貼った・読んだ招待状を受け取った'); }catch(e){} try{ const b=document.getElementById('p2p-onboard'); if(b&&b.dataset) b.dataset.step='-'; if(typeof p2pOnboard==='function') p2pOnboard(); }catch(e){} return 'ok'; }
function hpIvjPasteAsk(){
  if(typeof hpAsk!=='function') return false;
  const d=hpIvEl('div'), ta=hpIvEl('textarea','','ivp-in'); ta.rows=3; ta.placeholder=T('ivp_ph'); ta.style.cssText='width:100%;margin-top:10px;font-size:12px;word-break:break-all';
  const row=hpIvEl('div','row'); row.style.marginTop='8px'; const qb=hpIvEl('button','b','btn-ivp-qr',T('btn_ivp_qr')); qb.type='button'; const gb=hpIvEl('button','b pri','btn-ivp-go',T('btn_ivp_go')); gb.type='button';
  const msg=hpIvEl('div','note','ivp-err'); msg.style.cssText='margin-top:6px;color:var(--amber)'; row.appendChild(qb); row.appendChild(gb); d.appendChild(ta); d.appendChild(row); d.appendChild(msg);
  const done=()=>{ try{ if(HP_ASK_CUR) HP_ASK_CUR.done(false); }catch(e){} };
  gb.onclick=()=>{ let t=String(ta.value||'').trim(); if(!t){ msg.textContent=T('ivp_e_bad'); return 'ivp_e_bad'; } const r=hpIvjTakeText(t); if(r!=='ok'){ msg.textContent=T(r); return r; } done(); return 'ok'; };
  qb.onclick=()=>{ done(); try{ startScanFull(v=>{ const r=hpIvjTakeText(String(v||'')); if(r!=='ok'){ try{ hpToast(T(r),4000); }catch(e){} } }); }catch(e){} return 'scan'; };
  hpAsk({title:T('ivp_title'),text:T('ivp_text'),node:d,noOk:true,cancel:T('btn_ivi_close')});
  try{ setTimeout(()=>{ ta.focus(); },50); }catch(e){} return true; }

const HP_IVW_LATE=24*3600e3;
var HP_IVW_LOCK=null;
function hpIvWaitOf(addr){ try{ const c=((ID&&ID.contacts)||[]).find(x=>x.address===addr); if(!c||!c.ivWait) return 0; if(histLoad(addr).some(x=>x&&x.d==='p')) return 0; return Number(c.ivWait)||0; }catch(e){ return 0; } }
function hpIvWaitText(addr, now){
  const at=hpIvWaitOf(addr); if(!at) return '';
  const t=(typeof hpSrWhen==='function')?hpSrWhen(at):new Date(at).toLocaleString();
  let s=TF('ivw_wait',{name:nickOf(addr),t:t}); if((Number(now)||Date.now())-at>=HP_IVW_LATE) s+='\n'+TF('ivw_late',{name:nickOf(addr)});
  return s;
}
function hpIvWaitUi(now){
  if(typeof document==='undefined'||!document||typeof document.getElementById!=='function') return 0;
  const peer=(typeof CURPEER!=='undefined')?CURPEER:null, s=peer?hpIvWaitText(peer,now):'', E=id=>document.getElementById(id);
  let b=E('ivw-band'); const cp=E('composer');
  if(s&&!b&&cp&&cp.parentNode&&typeof document.createElement==='function'){ b=document.createElement('div'); b.id='ivw-band'; b.style.cssText='margin:6px 10px 0;padding:8px 10px;border:1px solid #c99a2e;border-radius:10px;background:rgba(201,154,46,.12);color:#f0d9a0;font-size:13px;white-space:pre-line'; cp.parentNode.insertBefore(b,cp); }
  if(b){ b.textContent=s; b.style.display=s?'block':'none'; }
  if(s){ for(const id of ['text','btn-send','btn-img']){ const e=E(id); if(e) e.disabled=true; } HP_IVW_LOCK=peer; }
  else if(HP_IVW_LOCK){ HP_IVW_LOCK=null; for(const id of ['text','btn-send','btn-img']){ const e=E(id); if(e) e.disabled=!ID; } }
  return s?1:0;
}

if(typeof sendChat==='function') sendChat=(function(f){ return async function(){ try{ const p=(typeof CURPEER!=='undefined')?CURPEER:null; if(p&&hpIvWaitOf(p)){ hpIvWaitUi(); hpLog('承認を待っているので出さなかった → '+nickOf(p)); return; } }catch(e){} return f.apply(this,arguments); }; })(sendChat);
if(typeof openConversation==='function') openConversation=(function(f){ return function(){ const r=f.apply(this,arguments); try{ hpIvWaitUi(); }catch(e){} return r; }; })(openConversation);
try{ if(typeof document!=='undefined'&&document&&typeof document.getElementById==='function'&&typeof setInterval==='function') setInterval(()=>{ try{ hpIvWaitUi(); }catch(e){} },3000); }catch(e){}

hpIvWaitText=(function(f){ return function(addr, now){ try{ if(hpIvWaitOf(addr)&&typeof hpInvPendOf==='function'&&hpInvPendOf(addr)) return TF('ivw_unsent',{name:nickOf(addr)}); }catch(e){} return f.apply(this,arguments); }; })(hpIvWaitText);

