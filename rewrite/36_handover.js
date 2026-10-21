let HP_PAPER_AFTER=null, HP_PAPER_PREAUTH=false;
let HP_HO_BUSY=false;
const HP_HO_LS=['p2p_bkseq','p2p_bkh','p2p_sibp','p2p_sibc','p2p_sibseen','p2p_tk','p2p_tkrv','p2p_seen'];
const HP_HO_H=/^p2p_(req|sibsince)_|^p2p_(tk|tkrv|sibc|sibp|sibseen|seen)$/;

async function hpHoProbe(url){
  let c; try{ c=await HotPocket.createClient([url], await HotPocket.generateKeys()); }catch(e){ return {st:'noconn'}; } if(typeof hpGateWrap==='function') hpGateWrap(c,url,null,'引き継ぎの確かめ',{bare:true});
  const replies=[]; c.on(HotPocket.events.contractOutput, r=>{ for(const out of r.outputs){ try{ replies.push(JSON.parse(hpText(out))); }catch(e){} } });
  let up=false; try{ up=await c.connect(); }catch(e){ up=false; }
  if(!up){ try{ await c.close(); }catch(e){} return {st:'noconn'}; }
  try{
    await c.submitContractInput(JSON.stringify({op:'kill', ts:0, sig:''}));
    const t0=Date.now(); while(!replies.length&&Date.now()-t0<HP_KILL_WAIT) await sleep(50);
    return hpHoProbeWhy(replies[0]);
  } finally { try{ await c.close(); }catch(e){} }
}
function hpHoProbeWhy(r){
  if(!r) return {st:'noconn'};
  if(r.err==='no owner') return {st:'empty'};
  if((r.ok==='kill'||r.err==='killed')&&hpIdFmt(r.id)){ const mine=!!(ID&&(r.id===ID.address||(ID.prev&&r.id===ID.prev.id))); return {st:mine?'old':'dead', id:r.id}; }
  return {st:'taken'};
}
function hpHoProbeMsg(st){ return st==='old'?T('ho_e_oldpost'):st==='dead'?T('ho_e_deadpost'):st==='taken'?T('ho_e_taken'):T('ho_e_noconn'); }

function hpHoCarry(old, base){
  const o=Object.assign({}, base, {contacts:[]}), keep=['address','nick','pubKey','keyAddedAt','card','cardAt','mt','gone'];
  for(const c of (Array.isArray(old&&old.contacts)?old.contacts:[])){
    if(!c||!hpIdFmt(c.address)||c.address===old.address||c.address===base.address||o.contacts.some(x=>x.address===c.address)) continue;
    const r={}; for(const k of keep) if(c[k]!==undefined) r[k]=c[k]; o.contacts.push(r);
  }
  const cp=v=>JSON.parse(JSON.stringify(v));
  for(const k of ['blk','dead','cdel','set']) if(old&&old[k]&&typeof old[k]==='object') o[k]=cp(old[k]);
  if(old&&old.setAt) o.setAt=old.setAt;
  o.myNameAt=Date.now();
  const bl=a=>!!(o.blk&&o.blk[a]&&o.blk[a].on===1), dd=a=>!!(o.dead&&o.dead[a]);
  o.prev={ id:old.address, master:old.publicKey, at:Date.now(), todo:o.contacts.filter(c=>c.card&&!bl(c.address)&&!dd(c.address)).map(c=>c.address) }; o.prev.all=o.prev.todo.slice();
  return o;
}

async function hpHoWipe(){
  const rm=k=>{ try{ if(typeof localStorage.removeItem==='function') localStorage.removeItem(k); else if(localStorage.getItem(k)!=null) localStorage.setItem(k,''); }catch(e){} };
  for(const k of HP_HO_LS) rm(k);
  try{ const ks=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k&&/^p2p_(req|sibsince)_/.test(k)) ks.push(k); } ks.forEach(rm); }catch(e){}
  for(const k of Object.keys(HPH_MEM)) if(HP_HO_H.test(k)) hpHDel(k);
  let old=0;
  for(const k of Object.keys(HPH_MEM)){ if(k.indexOf('p2p_chat_')!==0) continue; const peer=k.slice(9), h=histLoad(peer); let ch=0; for(const m of h){ if(m.d==='s'&&m.p&&!m.hp&&!m.dv){ m.dv='old'; ch++; } } if(ch){ histSave(peer,h); old+=ch; } }
  for(const k of ['p2p_devkey','p2p_prekeys']){ try{ hpSecDel(k); }catch(e){} try{ if(hpSecGet(k)!=null) hpSecSet(k,''); }catch(e){} }
  try{ REQUESTS.length=0; HP_REQ_LOADED=false; }catch(e){}
  try{ HP_SEEN=null; }catch(e){}
  try{ POST.claimedId=null; POST.notOwner=false; POST.removed=false; POST.kp=null; POST.pub=null; }catch(e){}
  try{ HP_BK_STOP=false; HP_BK_SEEN=false; HP_BK_REDO=false; }catch(e){}
  for(let i=0;i<50&&typeof HPH_BUSY!=='undefined'&&HPH_BUSY;i++) await sleep(100);
  try{ if(typeof hpHFlush==='function') await hpHFlush(); }catch(e){}
  return old;
}

function hpHoDropPaperWrap(){
  try{ const m=hpVaultMeta(); if(!m) return false; const n=m.wraps.length; m.wraps=m.wraps.filter(w=>w.k!=='paper'); if(m.wraps.length===n) return false; m.at=Date.now(); localStorage.setItem(HP_VAULT_KEY,JSON.stringify(m)); hpLog('封から前の紙の包みを外した'); return true; }catch(e){ return false; }
}

async function hpHoCommit(url, name){
  if(!ID||!hpKillMe()||!hpIsMain()) throw new Error(T('ho_e_state'));
  if(HP_HO_BUSY) throw new Error(T('ho_e_state'));
  name=String(name||'').trim(); if(!name) throw new Error(T('ho_e_name'));
  if(url&&!hpReUrlOk(url)) throw new Error(T('re_e_url'));
  HP_HO_BUSY=true;
  const old=ID;
  try{
    if(typeof hpReady==='function') await hpReady();
    const p=crypto.getRandomValues(new Uint8Array(16)), mk=hpPaperMaster(p), address=await hpIdOf(mk.pub);
    const obj=hpHoCarry(old,{publicKey:mk.pub, privateKeyPem:mk.pem, address:address, myName:name, paper:hpHex(p)});
    try{ stopBg(); }catch(e){}
    try{ if(HP_KILL_T){ clearTimeout(HP_KILL_T); HP_KILL_T=null; } HP_KILL_N=0; }catch(e){}
    hpHoDropPaperWrap();
    const n=await hpHoWipe();
    if(url){ try{ localStorage.setItem('p2p_post', hpReUrlNorm(url)); }catch(e){} } else { try{ localStorage.removeItem('p2p_post'); }catch(e){} }
    try{ await applyIdentity(obj,false); }catch(e){ ID=old; try{ saveID(); }catch(x){} throw e; }
    hpLog('新しいアカウントを作った（'+hpIdShort(old.address)+' → '+hpIdShort(address)+'。連絡先 '+obj.contacts.length+' 人を引き継いだ。前のアカウントで送れなかった '+n+' 通は送り直さない'+(url?'':'。郵便受けはこれから借りる')+'）');
    try{ hpKillUi(); }catch(e){}
    return address;
  } finally { HP_HO_BUSY=false; }
}

function hpHoTodo(){
  if(!ID||!ID.prev||hpKillMe()) return [];
  const card=a=>{ const c=(ID.contacts||[]).find(x=>x.address===a); return !!(c&&c.card); }, ok=a=>card(a)&&!hpBlocked(a)&&!(ID.dead&&ID.dead[a]);
  if(Array.isArray(ID.prev.todo)&&ID.prev.todo.length) return ID.prev.todo.filter(ok);
  if(!ID.prev.sentAt) return [];
  const at=Number(ID.prev.at)||0, all=Array.isArray(ID.prev.all)?ID.prev.all:(ID.contacts||[]).map(c=>c.address);
  return all.filter(a=>ok(a)&&!histLoad(a).some(m=>m.d==='p'&&(Number(m.rx)||Number(m.ts)||0)>at));
}
function hpHoReady(){ return !!(ID&&POST.up&&POST.claimedId===ID.address&&!POST.notOwner); }

async function hpHoSend(addrs, text){
  if(!hpHoReady()) throw new Error(T('ho_s_wait'));
  text=String(text||'').trim()||T('ho_req_text');
  const pick=(Array.isArray(addrs)?addrs:[]).filter(a=>hpHoTodo().indexOf(a)>=0), base=Date.now(), jobs=[];
  pick.forEach((a,i)=>{ const c=ID.contacts.find(x=>x.address===a); c.cardDue=1; const ts=base+i; histAdd(a,'s',text,ts,1); jobs.push([a,ts]); });
  ID.prev.todo=[]; ID.prev.sent=(Number(ID.prev.sent)||0)+pick.length; ID.prev.sentAt=base; saveID();
  let ok=0; for(const [a,ts] of jobs){ try{ if(await hpSendText(a,text,ts)) ok++; }catch(e){} }
  hpLog('前の連絡先 '+pick.length+' 人に友達申請を送った（ポストに入った '+ok+' 人）');
  try{ hpKillUi(); }catch(e){} try{ convDirty(); }catch(e){}
  return {n:pick.length, ok:ok};
}

function hpHoSameDead(name){
  const n=String(name||'').trim().toLowerCase(); if(!n||!ID||!ID.dead||typeof ID.dead!=='object') return null;
  for(const a of Object.keys(ID.dead)){ const c=(ID.contacts||[]).find(x=>x.address===a); if(!c) continue;
    if([c.nick,c.card&&c.card.name].filter(Boolean).map(x=>String(x).trim().toLowerCase()).indexOf(n)>=0) return a; }
  return null;
}

function hpHoBox(id){
  const old=document.getElementById(id); if(old) old.remove();
  const box=document.createElement('div'); box.id=id;
  box.style.cssText='position:fixed;inset:0;z-index:9998;background:var(--bg,#0b1220);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';
  const card=document.createElement('div'); card.className='card'; card.style.cssText='max-width:480px;width:100%';
  box.appendChild(card); document.body.appendChild(box);
  const el=(tag,cls,txt,i)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; if(i) e.id=i; return e; };
  const btn=(txt,pri,i,fn)=>{ const b=el('button','b'+(pri?' pri':''),txt,i); b.onclick=fn; return b; };
  return {box:box, card:card, el:el, btn:btn};
}

function hpHoFlow(){
  if(!ID||!hpKillMe()||!hpIsMain()) return false;
  const U=hpHoBox('ho-flow'), card=U.card, el=U.el, btn=U.btn;
  const close=()=>{ U.box.remove(); };
  let URL0='', NAME0=myName(), ERR='';
  const show=n=>{
    card.innerHTML=''; card.dataset.step=String(n);
    const row=el('div','row'); row.style.marginTop='12px';
    const er=el('div','note',ERR||null,'ho-err'); er.style.color='var(--amber)'; ERR='';
    if(n===1){
      card.appendChild(el('h2',null,T('ho_title')));
      const b=el('div','note',T('ho1_body')); b.style.whiteSpace='pre-line'; card.appendChild(b);
      row.appendChild(btn(T('btn_ho_next'),true,'ho-go1',async()=>{ const g=document.getElementById('ho-go1'); if(g) g.disabled=true; let v=false; try{ v=await hpAsk({title:T('ho_title'), text:T('cf_ho'), auth:true, ok:T('btn_ho_next'), why:'新しいアカウントを作る'}); }finally{ if(g) g.disabled=false; } if(v&&document.getElementById('ho-flow')===U.box) show(2); }));
      row.appendChild(btn(T('btn_ho_cancel'),false,'ho-cancel',close));
    } else if(n===2&&!hpReDev()){
      card.appendChild(el('h2',null,T('ho2_h')));
      const b=el('div','note',T('ho2_rent')); b.style.whiteSpace='pre-line'; card.appendChild(b);
      row.appendChild(btn(T('btn_ho_next'),true,'ho-go2',()=>{ URL0=''; show(3); }));
      row.appendChild(btn(T('btn_ho_cancel'),false,'ho-cancel',close));
    } else if(n===2){
      card.appendChild(el('h2',null,T('ho2_h')));
      const b=el('div','note',T('ho2_note')); b.style.whiteSpace='pre-line'; card.appendChild(b);
      const pu=document.createElement('input'); pu.type='text'; pu.id='ho-post'; pu.placeholder=T(hpReDev()?'re_ph_post_dev':'re_ph_post'); pu.style.cssText='width:100%;margin-top:8px'; pu.value=URL0;
      ['autocomplete','autocapitalize','autocorrect'].forEach(a=>pu.setAttribute(a,'off')); pu.setAttribute('spellcheck','false'); card.appendChild(pu);
      if(hpReDev()){ const dv=el('div','row','','ho-dev'); dv.style.cssText='margin-top:6px;display:flex;gap:6px;flex-wrap:wrap';
        [['8081','ボブ'],['8082','アリス'],['8083','キャロル']].forEach(q=>{ const b2=el('button','b',q[1]+' '+q[0],'ho-dev-'+q[0]); b2.style.cssText='font-size:13px;padding:4px 10px'; b2.onclick=()=>{ pu.value=q[0]; }; dv.appendChild(b2); }); card.appendChild(dv); }
      card.appendChild(er);
      row.appendChild(btn(T('btn_ho_check'),true,'ho-go2',async()=>{
        const u=pu.value.trim(); if(!hpReUrlOk(u)){ er.textContent=T('re_e_url'); pu.focus(); return; }
        const g=document.getElementById('ho-go2'); if(g) g.disabled=true; er.style.color=''; er.textContent=T('ho_s_check');
        let r; try{ r=await hpHoProbe(hpReUrlNorm(u)); }catch(e){ r={st:'noconn'}; }
        hpLog('新しいアカウントのポストを確かめた '+hpReUrlNorm(u)+' → '+r.st+(r.id?'（'+hpIdShort(r.id)+'）':''));
        if(document.getElementById('ho-flow')!==U.box) return;
        URL0=u; if(r.st==='empty'){ show(3); return; }
        ERR=hpHoProbeMsg(r.st); show(2);
      }));
      row.appendChild(btn(T('btn_ho_cancel'),false,'ho-cancel',close));
      setTimeout(()=>{ try{ pu.focus(); }catch(e){} },50);
    } else if(n===3){
      card.appendChild(el('h2',null,T('ho3_h')));
      card.appendChild(el('div','note',T('ho3_note')));
      const nm=document.createElement('input'); nm.type='text'; nm.id='ho-name'; nm.maxLength=24; nm.style.cssText='width:100%;margin-top:8px'; nm.value=NAME0; nm.setAttribute('autocomplete','off'); card.appendChild(nm);
      card.appendChild(er);
      row.appendChild(btn(T('btn_ho_make'),true,'ho-go3',()=>{
        const v=nm.value.trim(); if(!v){ er.textContent=T('ho_e_name'); nm.focus(); return; }
        NAME0=v; show(4);
        hpHoCommit(URL0?hpReUrlNorm(URL0):'',v).then(()=>{ close(); const nx=()=>{ try{ if(URL0) hpHoReqFlow(); else hpHoBoxFlow(); }catch(e){} };   HP_PAPER_PREAUTH=true; HP_PAPER_AFTER=nx; try{ hpPaperFlow(1); }catch(e){ HP_PAPER_AFTER=null; HP_PAPER_PREAUTH=false; nx(); } })
          .catch(e=>{ try{ hpLog('新しいアカウントを作れない '+(e&&e.message||'')); }catch(x){} if(document.getElementById('ho-flow')!==U.box) return; ERR=TF('ho_e_make',{err:(typeof hpErrShow==='function'?hpErrShow(e):((e&&e.message)||''))}); show(3); });
      }));
      row.appendChild(btn(T('btn_ho_back'),false,'ho-back',()=>show(2)));
    } else {
      card.appendChild(el('h2',null,T('ho_title')));
      card.appendChild(el('div','note',T('ho_s_make'),'ho-say'));
    }
    card.appendChild(row);
  };
  show(1);
  return true;
}

function hpHoBoxFlow(){
  if(!ID||hpKillMe()) return false;
  const U=hpHoBox('ho-box2'), card=U.card, el=U.el, btn=U.btn; const close=()=>{ U.box.remove(); try{ hpKillUi(); }catch(e){} };
  card.appendChild(el('h2',null,T('ho7_h')));
  const b=el('div','note',T('ho7_note')); b.style.whiteSpace='pre-line'; card.appendChild(b);
  const row=el('div','row'); row.style.marginTop='12px';
  row.appendChild(btn(T('btn_ho_tobox'),true,'ho-tobox',()=>{ close(); try{ const t=document.getElementById('t-post'); if(t) t.click(); }catch(e){} try{ if(typeof hpHsOpen==='function') hpHsOpen(); }catch(e){} }));
  row.appendChild(btn(T('btn_ho_later'),false,'ho-later',close));
  card.appendChild(row); return true;
}

function hpHoReqFlow(){
  if(!ID||hpKillMe()) return false;
  const U=hpHoBox('ho-req'), card=U.card, el=U.el, btn=U.btn;
  let T1=null; const close=()=>{ if(T1){ clearInterval(T1); T1=null; } U.box.remove(); try{ if(typeof hpSafetyNag==='function') hpSafetyNag(); }catch(e){} try{ hpKillUi(); }catch(e){} };
  const todo=hpHoTodo();
  card.appendChild(el('h2',null,T('ho5_h')));
  const row=el('div','row'); row.style.marginTop='12px';
  if(!todo.length){ card.appendChild(el('div','note',T('ho5_none'))); row.appendChild(btn(T('btn_ho_close'),true,'ho-close',close)); card.appendChild(row); return true; }
  const b=el('div','note',T('ho5_note')); b.style.whiteSpace='pre-line'; card.appendChild(b);
  const list=el('div',null,null,'ho-list'); list.style.marginTop='8px'; const boxes=[];
  for(const a of todo){
    const ln=document.createElement('label'); ln.style.cssText='display:flex;align-items:center;gap:8px;margin-top:4px;font-size:14px';
    const cb=document.createElement('input'); cb.type='checkbox'; cb.checked=true; cb.dataset.addr=a;
    ln.appendChild(cb); ln.appendChild(el('span',null,nickOf(a)+' \u00b7 '+hpIdShort(a))); list.appendChild(ln); boxes.push(cb);
  }
  card.appendChild(list);
  const tl=el('div','note',T('ho5_lb_text')); tl.style.marginTop='10px'; card.appendChild(tl);
  const tx=document.createElement('textarea'); tx.id='ho-text'; tx.rows=4; tx.style.cssText='width:100%;box-sizing:border-box'; tx.value=T('ho_req_text'); card.appendChild(tx);
  const er=el('div','note',null,'ho-err'); er.style.marginTop='6px'; card.appendChild(er);
  let SENDING=false;
  const go=btn(T('btn_ho_send'),true,'ho-send',async()=>{
    const pick=boxes.filter(x=>x.checked).map(x=>x.dataset.addr); if(!pick.length){ er.style.color='var(--amber)'; er.textContent=T('ho_e_pick'); return; }
    if(!hpHoReady()){ er.style.color='var(--amber)'; er.textContent=T('ho_s_wait'); return; }
    SENDING=true; go.disabled=true; er.style.color=''; er.textContent=T('ho_s_send');
    let r; try{ r=await hpHoSend(pick,tx.value); }catch(e){ SENDING=false; go.disabled=false; er.style.color='var(--amber)'; er.textContent=(typeof hpErrShow==='function'?hpErrShow(e):((e&&e.message)||'')); return; }
    if(T1){ clearInterval(T1); T1=null; }
    card.innerHTML=''; card.appendChild(el('h2',null,T('ho6_h')));
    const d=el('div','note',TF('ho6_body',{n:r.n})+(r.ok<r.n?('\n\n'+TF('ho6_left',{m:r.n-r.ok})):'')); d.style.whiteSpace='pre-line'; card.appendChild(d);
    const r2=el('div','row'); r2.style.marginTop='12px'; r2.appendChild(btn(T('btn_ho_close'),true,'ho-close',close)); card.appendChild(r2);
  });
  const tick=()=>{ if(!document.getElementById('ho-req')){ if(T1){ clearInterval(T1); T1=null; } return; } const rd=hpHoReady(); go.disabled=SENDING||!rd; if(!rd){ er.style.color=''; er.textContent=T('ho_s_wait'); } else if(er.textContent===T('ho_s_wait')) er.textContent=''; };
  row.appendChild(go); row.appendChild(btn(T('btn_ho_later'),false,'ho-later',close));
  card.appendChild(row);
  tick(); T1=setInterval(tick,1000);
  return true;
}
