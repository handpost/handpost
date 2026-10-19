const HP_NT_K='p2p_notes', HP_NT_KEEP=90*864e5, HP_NT_MAX=100, HP_VLF_K='p2p_vlfail';
const HP_NT_SUM={ openbad:1, bkold:1, bkgone:1 };

const HP_NT_TXT={ devadd:['ntc_devadd','ntd_devadd'], devrm:['ntc_devrm','ntd_devrm'], vlpaper:['ntc_vlpaper','ntd_vlpaper'], ppreq:['ntc_ppreq','ntd_ppreq'], ppcancel:['ntc_ppcancel','ntd_ppcancel'],
  mvchg:['ntc_mvchg','ntd_mvchg'], mvdemote:['ntc_mvdemote','ntd_mvdemote'], bkold:['ntc_bkold','ntd_bkold'], bkgone:['ntc_bkgone','ntd_bkgone'], vlfail:['ntc_vlfail','ntd_vlfail'], openbad:['ntc_openbad','ntd_openbad'],
  dead:['ntc_dead','ntd_dead'], medead:['ntc_medead','ntd_medead'], invbad:['ntc_invbad','ntd_invbad'], invdup:['ntc_invdup','ntd_invdup'], invnoreq:['ntc_invnoreq','ntd_invnoreq'], bknewer:['ntc_bknewer','ntd_bknewer'], lease:['ntc_lease','ntd_lease'] };
const HP_NT_KINDS=Object.keys(HP_NT_TXT);
let HP_NT_Q=[];
function hpNtReady(){ try{ return !(typeof hpHDisk==='function'&&hpHDisk()&&typeof HPH_OPENED!=='undefined'&&!HPH_OPENED); }catch(e){ return true; } }
function hpNtLoad(){ let a=[]; try{ a=JSON.parse(hpHGet(HP_NT_K)||'[]'); }catch(e){ a=[]; } return Array.isArray(a)?a.filter(x=>x&&typeof x.k==='string'&&typeof x.key==='string'&&HP_NT_TXT[x.k]):[]; }
function hpNtSave(a){ hpHSet(HP_NT_K, JSON.stringify(a)); }
function hpNtPrune(a,now){
  a=a.filter(x=>!x.ok||now-Number(x.ok)<HP_NT_KEEP);
  while(a.length>HP_NT_MAX){ let i=a.findIndex(x=>x.ok); if(i<0) i=0; a.splice(i,1); }
  return a;
}

function hpNote(k,a,key){
  if(typeof ID==='undefined'||!ID||HP_NT_KINDS.indexOf(k)<0) return false;
  const now=Date.now(), it={ k:k, key:String(key||(k+':'+now)), at:now, a:(a&&typeof a==='object')?a:{}, n:1 };
  if(!hpNtReady()){ if(!HP_NT_Q.some(x=>x.key===it.key&&!HP_NT_SUM[k])) HP_NT_Q.push(it); return true; }
  return hpNtPut([it]);
}
function hpNtPut(items){
  const now=Date.now(); let a=hpNtLoad(), ch=0; const fresh=[];
  for(const it of items){
    if(HP_NT_SUM[it.k]){ const o=a.find(x=>x.k===it.k&&!x.ok); if(o){ o.n=(Number(o.n)||1)+(Number(it.n)||1); o.at=it.at; o.a=it.a; ch++; continue; } }
    else if(a.some(x=>x.key===it.key)) continue;
    a.push(it); ch++; fresh.push(it);
  }
  if(!ch) return false;
  hpNtSave(hpNtPrune(a,now));
  try{ hpLog('お知らせの欄に足した（'+items.map(x=>x.k).join('・')+'）'); }catch(e){}
  try{ hpNotesUi(); }catch(e){}
  try{ if(fresh.length) hpNtAlert(fresh); }catch(e){}
  return true;
}

function hpNtFlush(){
  if(typeof ID==='undefined'||!ID||!hpNtReady()) return 0;
  try{ hpVlFailTake(); }catch(e){}
  if(!HP_NT_Q.length) return 0;
  const q=HP_NT_Q; HP_NT_Q=[]; hpNtPut(q); return q.length;
}
function hpNotesOpen(){ if(typeof ID==='undefined'||!ID) return 0; hpNtFlush(); return hpNtReady()?hpNtLoad().filter(x=>!x.ok).length:HP_NT_Q.length; }

function hpNoteOk(key){ const a=hpNtLoad(), o=a.find(x=>x.key===key&&!x.ok); if(!o) return false; o.ok=Date.now(); HP_NT_OPEN=true;   hpNtSave(a); try{ hpNtPopShow(); }catch(e){}   try{ hpLog('お知らせを確認した（'+o.k+'）'); }catch(e){} try{ hpNotesUi(); }catch(e){} try{ if(typeof menuBadge==='function') menuBadge(); }catch(e){} return true; }

function hpVlFailMark(){ try{ let o=null; try{ o=JSON.parse(localStorage.getItem(HP_VLF_K)||'null'); }catch(e){ o=null; } if(!o||typeof o!=='object') o={n:0,first:Date.now()}; o.n=(Number(o.n)||0)+1; if(!(Number(o.first)>0)) o.first=Date.now(); localStorage.setItem(HP_VLF_K, JSON.stringify(o)); }catch(e){} }
function hpVlFailTake(){
  let o=null; try{ o=JSON.parse(localStorage.getItem(HP_VLF_K)||'null'); }catch(e){ o=null; }
  if(!o||!(Number(o.n)>0)) return 0;
  try{ localStorage.setItem(HP_VLF_K,''); }catch(e){}
  const n=Number(o.n), first=Number(o.first)||Date.now();
  if(!hpNtReady()) HP_NT_Q.push({k:'vlfail',key:'vlfail:'+first,at:Date.now(),a:{n:n,t:fmtTS(first)},n:1}); else hpNtPut([{k:'vlfail',key:'vlfail:'+first,at:Date.now(),a:{n:n,t:fmtTS(first)},n:1}]);
  return n;
}

function hpNtBadge(){
  const n=hpNotesOpen();
  try{ const b=(typeof document!=='undefined'&&document.getElementById)?document.getElementById('nt-badge'):null; if(b){ if(n>0){ b.textContent=String(n); b.style.display='block'; } else b.style.display='none'; } }catch(e){}
  return n;
}
function hpNtRow(it){
  const d=document.createElement('div'); d.className='hp-nt'; d.dataset.key=it.key;
  d.style.cssText='border-left:3px solid '+(it.ok?'var(--line)':'var(--amber)')+';padding:6px 10px;margin:8px 0;'+(it.ok?'opacity:.55':'');
  const a=Object.assign({},it.a||{}); if(HP_NT_SUM[it.k]) a.n=Number(it.n)||1;
  const tm=document.createElement('div'); tm.className='note'; tm.style.margin='0'; tm.textContent=it.ok?(fmtTS(it.at)+' · '+TF('ntl_okat',{t:fmtTS(it.ok)})):fmtTS(it.at); d.appendChild(tm);
  const tt=document.createElement('div'); tt.className='hp-nt-t'; tt.style.cssText='font-weight:600;line-height:1.5'; tt.textContent=TF(HP_NT_TXT[it.k][0],a); d.appendChild(tt);
  if(!it.ok){
    const td=document.createElement('div'); td.className='note hp-nt-d'; td.style.margin='2px 0 0'; td.textContent=T(HP_NT_TXT[it.k][1]); d.appendChild(td);
    const b=document.createElement('button'); b.className='b'; b.style.cssText='margin-top:6px;background:var(--amber);border-color:var(--amber);color:#1a1200;font-weight:600'; b.textContent=T('btn_ntl_ok'); b.onclick=()=>{ hpNoteOk(it.key); }; d.appendChild(b);
  }
  return d;
}

const HP_NTP_Z=10040;
let HP_NT_POP=[];
function hpNtAlert(items){
  for(const it of items) if(HP_NT_POP.indexOf(it.key)<0) HP_NT_POP.push(it.key);
  try{ if(typeof notifySound==='function') notifySound('warn'); }catch(e){}
  try{ const b=(typeof document!=='undefined'&&document.getElementById)?document.getElementById('hp-notice'):null; if(b){ b.remove(); if(typeof HP_NOTICE_K!=='undefined') HP_NOTICE_K=''; } }catch(e){}
  hpNtPopShow();
}
function hpNtPopShow(){
  const a=hpNtReady()?hpNtLoad():[];
  const list=HP_NT_POP.map(k=>a.find(x=>x.key===k&&!x.ok)).filter(Boolean);
  HP_NT_POP=list.map(x=>x.key);
  if(typeof document==='undefined'||!document.body||!document.getElementById) return list.length;
  let box=document.getElementById('hp-ntpop');
  if(!list.length){ if(box) box.remove(); return 0; }
  if(!box){ box=document.createElement('div'); box.id='hp-ntpop'; box.style.cssText='position:fixed;inset:0;z-index:'+HP_NTP_Z+';background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px'; document.body.appendChild(box); }
  box.innerHTML='';
  const card=document.createElement('div'); card.className='card'; card.style.cssText='max-width:480px;width:100%;margin:0;max-height:85vh;overflow:auto'; box.appendChild(card);
  const h=document.createElement('h2'); h.textContent=T('ntl_title'); card.appendChild(h);
  for(const it of list.slice().sort((x,y)=>y.at-x.at)) card.appendChild(hpNtRow(it));
  const nt=document.createElement('div'); nt.className='note'; nt.style.marginTop='8px'; nt.textContent=T('ntl_later_note'); card.appendChild(nt);
  const row=document.createElement('div'); row.className='row'; row.style.cssText='margin-top:12px;justify-content:flex-end';
  const later=document.createElement('button'); later.className='b'; later.id='hp-ntpop-later'; later.textContent=T('btn_ntl_later'); later.onclick=()=>{ HP_NT_POP=[]; try{ box.remove(); }catch(e){} }; row.appendChild(later);
  card.appendChild(row);
  return list.length;
}

let HP_NT_OPEN=false;
function hpNotesUi(){
  if(typeof ID==='undefined') return;
  hpNtBadge(); try{ if(typeof menuBadge==='function') menuBadge(); }catch(e){}
  if(typeof document==='undefined'||!document.getElementById) return;
  const card=document.getElementById('note-card'); if(!card) return;
  if(!ID){ card.style.display='none'; card.innerHTML=''; return; }
  card.style.display=''; card.innerHTML='';
  const a=hpNtReady()?hpNtLoad():[], open=a.filter(x=>!x.ok).sort((x,y)=>y.at-x.at), done=a.filter(x=>x.ok).sort((x,y)=>y.at-x.at);
  if(!open.length&&!HP_NT_OPEN){
    const r=document.createElement('div'); r.id='nt-fold'; r.style.cssText='cursor:pointer;display:flex;align-items:baseline;gap:8px;flex-wrap:wrap';
    const b=document.createElement('b'); b.textContent=T('ntl_title'); r.appendChild(b);
    const s=document.createElement('span'); s.className='note'; s.style.margin='0'; s.textContent=done.length?TF('ntl_fold_n',{n:done.length}):T('ntl_fold'); r.appendChild(s);
    const m=document.createElement('span'); m.className='note'; m.id='nt-fold-open'; m.style.cssText='margin:0 0 0 auto;color:var(--teal);font-size:13px;font-weight:600;white-space:nowrap'; m.textContent=T('ntl_open')+' \u25b8'; r.appendChild(m);
    r.onclick=()=>{ HP_NT_OPEN=true; hpNotesUi(); };
    card.appendChild(r); return;
  }
  const h=document.createElement('h2'); h.textContent=T('ntl_title'); card.appendChild(h);
  if(!open.length){ h.textContent=T('ntl_title')+' \u25be'; h.style.cursor='pointer'; h.id='nt-fold-h'; h.onclick=()=>{ HP_NT_OPEN=false; hpNotesUi(); }; }
  if(!open.length){ const e=document.createElement('div'); e.className='note'; e.id='nt-none'; e.textContent=T(done.length?'ntl_fold':'ntl_none');   card.appendChild(e); }
  for(const it of open.concat(done)) card.appendChild(hpNtRow(it));
  const f=document.createElement('div'); f.className='note'; f.style.marginTop='8px'; f.textContent=T('ntl_foot'); card.appendChild(f);
  const bl=document.createElement('div'); bl.className='note'; bl.id='nt-blind'; bl.textContent=T('ntl_blind'); card.appendChild(bl);
}
