const HP_FL_KEEP=14*864e5, HP_FL_PRAISE=6000, HP_FL_SLOW=5000;

const HP_FL_P3={friend:['fl_s3','fl_s3_face','fl_note','fl_b3'],self:['fl_s3_self','fl_s3_self','fl_note_self','fl_b3_any'],any:['fl_s3_any','fl_s3_any','fl_note_any','fl_b3_any']};
function hpFlP3(F){ const p=(F&&(F.pay==='friend'||F.pay==='self'))?F.pay:'any'; return HP_FL_P3[p]; }
const HP_FL_B=['fl_b1','fl_b2','fl_b3','fl_b4','fl_b5'], HP_FL_S=['fl_s1','fl_s2','fl_s3','fl_s4','fl_s5'], HP_FL_SF={3:'fl_s3_face',5:'fl_s5_face'}, HP_FL_MORE={'0':'fl_more_0','1':'fl_more_1','2':'fl_more_2','3':'fl_more_3'};
let HP_FL_FACE=false, HP_FL_SEEN=false, HP_FL_PR='', HP_FL_PR_AT=0, HP_FL_PICK_AT=0, HP_FL_QUIT=0;
function hpFlFace(v){ HP_FL_FACE=!!v; return HP_FL_FACE; }
function hpFlGet(){ try{ return (typeof ID!=='undefined'&&ID&&ID.flow&&typeof ID.flow==='object'&&ID.flow.id)?ID.flow:null; }catch(e){ return null; } }
function hpFlName(F){ const s=String((F&&F.name)||'').trim(); if(s) return s.length>24?s.slice(0,24)+'…':s; try{ if(typeof isContact==='function'&&isContact(F.id)) return String(nickOf(F.id)); }catch(e){} return T('fl_friend'); }
function hpFlAcct(a){ a=String(a||''); return a.length>12?a.slice(0,6)+'…'+a.slice(-4):a; }
function hpFlPhone(){ try{ return /Android|iPhone|iPad|iPod/i.test(String(navigator.userAgent||'')); }catch(e){ return false; } }

function hpFlHasBox(){ try{ if(!localStorage.getItem('p2p_post')) return false; if(typeof hpNoBox==='function'&&hpNoBox()) return false;
  const live=!!(typeof POST!=='undefined'&&POST&&POST.up&&POST.heardBy===POST.client);
  if(typeof hpLeaseState==='function'&&hpLeaseState()==='expired'&&!live) return false; return true; }catch(e){ return false; } }
function hpFlStep(){ const F=hpFlGet(); if(!F) return 0;
  try{ if(typeof isContact==='function'&&isContact(F.id)) return 6; }catch(e){}
  if(hpFlHasBox()) return 5;
  try{ if(localStorage.getItem('p2p_post')||ID.rentJob) return 4; }catch(e){}
  let a=''; try{ a=hpXmAcct(); }catch(e){}
  if(!a) return F.x1?2:1;
  try{ const I=(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null; const r=hpStStep(a,I); if(r.why==='read'&&Number(F.n)>=3) return Math.min(4,Number(F.n));   return r.n>=4?4:3; }catch(e){ return 3; } }
function hpFlPraise(F,to){ const done=to-1, nm=hpFlName(F);
  if(done<=1) return T(F.x1==='have'?'fl_p1_have':'fl_p1');
  if(done===2){ let a=''; try{ a=hpXmAcct(); }catch(e){} return TF('fl_p2',{a:hpFlAcct(a)}); }
  if(done===3) return TF('fl_p3',{name:nm}); if(done===4) return T('fl_p4'); return TF('fl_p5',{name:nm}); }
function hpFlEl(t,cls,txt){ const e=document.createElement(t); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
function hpFlBtn(k,fn,pri){ const b=hpFlEl('button','b'+(pri?' pri':''),T(k)); b.type='button'; b.addEventListener('click',fn); return b; }
function hpFlClose(id){ try{ const d=document.getElementById(id); if(d&&d.parentNode) d.parentNode.removeChild(d); }catch(e){} }
function hpFlBot(){ try{ const NS='http://www.w3.org/2000/svg', sv=document.createElementNS(NS,'svg'), u=document.createElementNS(NS,'use'); sv.setAttribute('viewBox','0 0 34 36'); sv.setAttribute('width','20'); sv.setAttribute('height','21'); sv.setAttribute('aria-hidden','true'); sv.style.flex='0 0 auto'; u.setAttribute('href','#hp-rb-a'); sv.appendChild(u); return sv; }catch(e){ return null; } }

function hpFlBand(F,n){ let b=document.getElementById('fl-band');
  if(!F){ if(b&&b.parentNode) b.parentNode.removeChild(b); return null; }
  const fresh=!!HP_FL_PR&&Date.now()-HP_FL_PR_AT<HP_FL_PRAISE, txt=fresh?HP_FL_PR:TF('fl_band',{n:n,t:T(n===3?hpFlP3(hpFlGet())[3]:(HP_FL_B[n-1]||'fl_b5'))}), key=n+'|'+txt;
  if(!b){ const nav=document.querySelector('nav'); if(!nav||!nav.parentNode) return null;
    b=hpFlEl('div'); b.id='fl-band'; b.setAttribute('role','button'); b.tabIndex=0; b.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 14px;background:#0f2a24;border-bottom:1px solid var(--teal);color:var(--ink);font-size:13px;line-height:1.4;cursor:pointer';
    b.addEventListener('click',()=>{ hpFlDlg(); }); nav.parentNode.insertBefore(b,nav); }
  if(b.getAttribute('data-k')===key) return b; b.setAttribute('data-k',key); b.textContent='';
  const bot=hpFlBot(); if(bot) b.appendChild(bot);
  const s=hpFlEl('span','',txt); s.style.cssText='flex:1 1 auto;min-width:0'+(fresh?';color:var(--teal);font-weight:600':''); b.appendChild(s);
  const g=hpFlEl('span'); g.style.cssText='flex:0 0 auto;display:flex;gap:3px';
  for(let i=1;i<=5;i++){ const d=hpFlEl('span'); d.style.cssText='width:12px;height:5px;border-radius:3px;background:'+(i<n?'var(--teal)':i===n?'var(--amber)':'var(--line)'); g.appendChild(d); }
  b.appendChild(g); return b; }

function hpFlDlg(){ const F=hpFlGet(); if(!F) return null; hpFlClose('fl-dlg'); HP_FL_QUIT=0; const n=hpFlStep(), nm=hpFlName(F);
  const box=hpFlEl('div'); box.id='fl-dlg'; box.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
  const card=hpFlEl('div','card'); card.style.cssText='max-width:440px;width:100%;max-height:100%;overflow:auto;text-align:left';
  card.appendChild(hpFlEl('h2','',TF('fl_title',{name:nm})));
  const ld=hpFlEl('div','',T('fl_lead')); ld.style.cssText='margin:8px 0;line-height:1.5'; card.appendChild(ld);
  if(F.late){ const lt=hpFlEl('div','note',T('fl_late')); lt.style.cssText='margin:6px 0;line-height:1.5'; card.appendChild(lt); }
  for(let i=1;i<=5;i++){ const k=i===3?hpFlP3(F)[F.face?1:0]:((F.face&&HP_FL_SF[i])||HP_FL_S[i-1]), d=hpFlEl('div','fl-s',(i<n?'✓':i===n?'▶':'・')+' '+i+'. '+TF(k,{name:nm}));
    d.style.cssText='margin:6px 0;line-height:1.5'+(i===n?';font-weight:600':i<n?';color:var(--teal)':''); card.appendChild(d); }
  const nt=hpFlEl('div','note',TF(hpFlP3(F)[2],{name:nm})); nt.style.whiteSpace='pre-line'; card.appendChild(nt);
  const row=hpFlEl('div','row'); row.style.cssText='margin-top:10px;flex-wrap:wrap';
  row.appendChild(hpFlBtn(F.go?'btn_fl_cont':'btn_fl_go',()=>{ try{ const G=hpFlGet(); if(G&&!G.go){ G.go=1; saveID(); hpLog('はじめての流れを始めた（'+n+'／5 から）'); } }catch(e){} hpFlClose('fl-dlg'); hpFlGoto(n); },true));
  row.appendChild(hpFlBtn('btn_fl_later',()=>{ hpFlClose('fl-dlg'); }));
  row.appendChild(hpFlBtn('btn_fl_more',()=>{ hpFlMore('0'); }));
  card.appendChild(row);
  if(F.go){ const q=hpFlBtn('btn_fl_quit',()=>{ if(!HP_FL_QUIT){ HP_FL_QUIT=1; q.textContent=T('btn_fl_quit2'); return; }
      try{ delete ID.flow; delete ID.ivjPend; saveID(); hpLog('はじめての流れをやめた（招待を忘れた）'); }catch(e){} HP_FL_PR=''; hpFlClose('fl-dlg'); hpFlBand(null,0); try{ hpToast(T('fl_quit_done'),3000); }catch(e){} try{ hpStTick(); }catch(e){} });
    q.style.cssText='margin-top:6px;padding:4px 10px;font-size:12px;color:var(--dim)'; card.appendChild(q); }
  box.appendChild(card); document.body.appendChild(box); return box; }
function hpFlGoto(n){ try{ if(n>=1&&n<=4){ const t=document.getElementById('t-post'); if(t&&t.click) t.click(); } }catch(e){} try{ hpStTick(); }catch(e){} }

function hpFlMore(k){ hpFlClose('fl-more');
  const box=hpFlEl('div'); box.id='fl-more'; box.style.cssText='position:fixed;inset:0;z-index:9200;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
  const card=hpFlEl('div','card'); card.style.cssText='max-width:440px;width:100%;max-height:100%;overflow:auto;text-align:left';
  card.appendChild(hpFlEl('h2','',T('fl_more_h')));
  const p=hpFlEl('div','',TF(HP_FL_MORE[k]||'fl_more_0',{xah:(typeof HP_ST_XAH!=='undefined')?HP_ST_XAH:1.5,evr:(typeof HP_ST_EVR!=='undefined')?HP_ST_EVR:2})); p.style.cssText='white-space:pre-line;line-height:1.6;font-size:13px;margin:8px 0'; card.appendChild(p);
  const row=hpFlEl('div','row'); row.style.marginTop='10px'; row.appendChild(hpFlBtn('btn_fl_close',()=>{ hpFlClose('fl-more'); },true)); card.appendChild(row);
  box.appendChild(card); document.body.appendChild(box); return box; }

function hpFlOpen(c,inv,why){ try{ if(typeof ID==='undefined'||!ID||!c||!c.id) return false; if(typeof hpIsChild==='function'&&hpIsChild()) return false;
  const old=hpFlGet(), same=!!(old&&old.id===c.id), face=HP_FL_FACE?1:0; HP_FL_FACE=false;
  ID.ivjPend={card:c,inv:inv||null,at:Date.now()};
  if(same){ old.at=Date.now(); old.face=face; if(!old.name){ try{ old.name=String(hpCardNameOf(c)||''); }catch(e){} } if(old.late) old.late=0;   }
  else { let nm=''; try{ nm=String(hpCardNameOf(c)||''); }catch(e){} ID.flow={id:c.id,name:nm,face:face,at:Date.now(),n:0,go:0,x1:''}; HP_FL_PR=''; }
  ID.flow.n=hpFlStep(); saveID(); hpLog('はじめての流れ：招待を覚えた（'+String(why||'')+'・'+ID.flow.n+'／5 から） '+hpIdShort(c.id));
  hpFlClose('inv-dlg'); HP_FL_SEEN=true; hpFlDlg(); hpFlBand(ID.flow,ID.flow.n); return true; }catch(e){ return false; } }

function hpFlOpenLate(j,e){ try{ if(typeof ID==='undefined'||!ID||!j||!j.who) return false; const why=String((e&&e.hpj)||''); if(why!=='none'&&why!=='used'&&why!=='wait') return false;
  if(typeof hpIsChild==='function'&&hpIsChild()) return false; if(hpFlHasBox()) return false;
  try{ if(typeof isContact==='function'&&isContact(j.who)) return false; }catch(_){}
  const old=hpFlGet(), same=!!(old&&old.id===j.who);
  if(same){ old.at=Date.now(); if(!old.name) old.late=1; }
  else { ID.flow={id:j.who,name:'',face:1,late:1,at:Date.now(),n:0,go:0,x1:''}; HP_FL_PR=''; }
  ID.flow.n=hpFlStep(); saveID(); hpLog('はじめての流れ：招待状は使えなくなっていたが、流れを始める（'+why+'・'+ID.flow.n+'／5 から） '+hpIdShort(j.who));
  hpFlClose('inv-dlg'); HP_FL_SEEN=true; hpFlDlg(); hpFlBand(ID.flow,ID.flow.n); return true; }catch(e2){ return false; } }

function hpFlHold(){ try{ if(!hpFlGet()) return false; return !hpFlHasBox()||!!document.getElementById('fl-dlg'); }catch(e){ return false; } }

function hpFlTick(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; try{ hpTuTick(); }catch(e){}
  const F=hpFlGet(); if(!F){ hpFlBand(null,0); return 'off'; }
  if(!(Number(F.at)>0)||Date.now()-F.at>HP_FL_KEEP){ delete ID.flow; saveID(); hpLog('はじめての流れを片付けた（14 日たった）'); hpFlBand(null,0); return 'drop'; }
  const n=hpFlStep(), was=Number(F.n)||0;
  if(n!==was){ if(n>was&&was>0){ HP_FL_PR=hpFlPraise(F,n); HP_FL_PR_AT=Date.now(); hpLog('はじめての流れ：'+was+' → '+(n>5?'友達になった':n+'／5')); }
    F.n=n; if(n>5) delete ID.flow; saveID(); }
  if(n>5){ hpFlBand(null,0); hpFlClose('fl-dlg'); try{ if(HP_FL_PR) hpToast(HP_FL_PR,6000); }catch(e){} HP_FL_PR=''; return 'done'; }
  hpFlBand(F,n);
  if(!HP_FL_BOOT){ HP_FL_BOOT=true; if(F.go&&n>=1&&n<=4){ hpFlGoto(n); try{ hpLog('はじめての流れ：開いたので郵便受けのタブへ（'+n+'／5）'); }catch(e){} } }
  try{ let a=''; try{ a=hpXmAcct(); }catch(e){} const I=(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null; if(a&&F.go&&n>=3&&n<=4&&typeof HP_XM_RD!=='undefined'&&!HP_XM_RD&&(!I||I.acct!==a)&&typeof hpXmRead==='function') hpXmRead(a); }catch(e){}
  if(!F.go&&!HP_FL_SEEN&&!document.getElementById('fl-dlg')&&!document.getElementById('inv-dlg')&&(typeof hpIvjReady!=='function'||hpIvjReady())){ HP_FL_SEEN=true; hpFlDlg(); }
  return 'n'+n; }catch(e){ return ''; } }

function hpFlDraw(c,a,s){ const F=hpFlGet(); if(!F||!F.go||!c) return false; const n=hpFlStep(); if(n===3) return hpFlDraw3(c,a,s,F);   if(n===4) return hpFlDraw4(c,a,s,F);   if(n!==1&&n!==2) return false;
  const slow=n===2&&HP_FL_PICK_AT>0&&Date.now()-HP_FL_PICK_AT>=HP_FL_SLOW, key=['fl',n,F.x1||'',slow?1:0,(typeof curLang==='function'?curLang():'')].join('|');
  if(c.getAttribute('data-k')===key) return true; c.setAttribute('data-k',key); c.textContent='';
  const nt=(t,css)=>{ const d=hpFlEl('div','note',t); d.style.cssText='white-space:pre-line'+(css?';'+css:''); c.appendChild(d); return d; };
  const body=t=>{ const d=hpFlEl('div','',t); d.style.cssText='margin:8px 0;line-height:1.5'; c.appendChild(d); return d; };
  const again=()=>{ try{ hpStTick(); }catch(e){} };
  if(n===1){ c.appendChild(hpFlEl('h2','',T('fl_1_h'))); body(T('fl_1_body'));
    const r1=hpFlEl('div','row'), l=hpFlEl('a','b',T('btn_fl_1_site')); l.href='https://xaman.app'; l.target='_blank'; l.rel='noopener'; l.style.cssText='display:inline-block;text-decoration:none'; r1.appendChild(l); c.appendChild(r1);
    const w=hpFlEl('div','',T('fl_1_warn')); w.style.cssText='margin:10px 0;padding:8px 10px;border-left:3px solid var(--amber);background:#2a2112;font-size:13px;line-height:1.5'; c.appendChild(w);
    nt(T('fl_1_back'));
    const r2=hpFlEl('div','row'); r2.style.cssText='margin-top:8px;flex-wrap:wrap';
    const set=v=>()=>{ try{ const G=hpFlGet(); if(G){ G.x1=v; saveID(); } }catch(e){} again(); };
    r2.appendChild(hpFlBtn('btn_fl_1_done',set('new'),true)); r2.appendChild(hpFlBtn('btn_fl_1_have',set('have'))); r2.appendChild(hpFlBtn('btn_fl_more',()=>{ hpFlMore('1'); })); c.appendChild(r2); }
  else { c.appendChild(hpFlEl('h2','',T('fl_2_h'))); body(T('fl_2_body'));
    const r1=hpFlEl('div','row'); r1.appendChild(hpFlBtn('btn_bx_sign',()=>{ HP_FL_PICK_AT=Date.now(); try{ hpXmPick(); }catch(e){} again(); },true)); c.appendChild(r1);
    nt(T(hpFlPhone()?'fl_2_phone':'fl_2_pc'));
    if(slow) nt(T('fl_2_slow'),'color:var(--amber)');
    const r2=hpFlEl('div','row'); r2.style.cssText='margin-top:8px;flex-wrap:wrap';
    r2.appendChild(hpFlBtn('btn_fl_more',()=>{ hpFlMore('2'); }));
    const bk=hpFlBtn('btn_fl_2_back',()=>{ try{ const G=hpFlGet(); if(G){ G.x1=''; saveID(); } }catch(e){} HP_FL_PICK_AT=0; again(); }); bk.style.cssText='font-size:12px;color:var(--dim)'; r2.appendChild(bk); c.appendChild(r2); }
  return true; }

const HP_FL_WAIT=120e3; let HP_FL_DOT=0, HP_FL_BOOT=false;

const HP_FL_XAH_OK=3, HP_TU_XAH=1, HP_TU_EVR=1; let HP_TU=null;
function hpFlRqCan(){ try{ return typeof qrcode==='function'&&typeof location!=='undefined'&&/^https?:$/.test(String(location.protocol)); }catch(e){ return false; } }

function hpGiveUrl(a,W){ const b=btoa(String(a)+'|'+String(W.xah)+'|'+String(W.evr)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); return location.origin+String(location.pathname||'/').replace(/[^\/]*$/,'')+'give.html#'+b; }
function hpFlRqNow(a,W,F){ if(!hpFlRqCan()||(F&&F.old)) return null; return {st:'open',url:hpGiveUrl(a,W)}; }
function hpFlWantText(W){ return Number(W.xah)>0?(Number(W.evr)>0?TF('fl_3_want',{xah:W.xah,evr:W.evr}):TF('fl_3_want_x',{xah:W.xah})):TF('fl_3_want_e',{evr:W.evr}); }
function hpTuOpen(){ let a=''; try{ a=hpXmAcct(); }catch(e){} if(!a) return false;
  if(!HP_TU||HP_TU.a!==a) HP_TU={a:a,evr:HP_TU_EVR,xah:HP_TU_XAH,go:1};   try{ const I=(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null, re=(typeof HP_ST_RE!=='undefined')?HP_ST_RE:20e3; if(!HP_XM_RD&&(!I||I.acct!==a||Date.now()-I.at>re)) hpXmRead(a); }catch(e){}   try{ hpStTick(); }catch(e){}
  try{ const c=document.getElementById('hp-topup'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'start',behavior:'smooth'}); }catch(e){} return true; }
function hpTuClose(){ HP_TU=null; try{ hpStTick(); }catch(e){} }
function hpTuTick(){ if(typeof document==='undefined'||!document.getElementById) return ''; let c=document.getElementById('hp-topup'); const p=document.getElementById('p-post');
  let a=''; try{ a=hpXmAcct(); }catch(e){} let n3=false; try{ const F0=hpFlGet(); n3=!!(F0&&F0.go)&&hpFlStep()===3; }catch(e){}
  try{ const B0=(typeof hpBfGet==='function')?hpBfGet():null; if(B0&&B0.go&&hpBfStep()===2) n3=true; }catch(e){}
  let shut=false; try{ shut=!HP_BF_ALLOW&&hpBfOn(); }catch(e){}
  if(!p||!a||n3||!hpFlRqCan()||shut){ if(c) c.style.display='none'; if(HP_TU&&(!a||HP_TU.a!==a)) HP_TU=null; return 'off'; }
  if(HP_TU&&HP_TU.a!==a) HP_TU=null;

  if(!c){ c=hpFlEl('div','card'); c.id='hp-topup'; }
  { const hs=document.getElementById('hp-start'), rn=document.getElementById('post-renew');
    if(hs&&hs.parentNode===p&&!(hs.style&&hs.style.display==='none')){ if(hs.nextSibling!==c) p.insertBefore(c,hs.nextSibling||null); }
    else if(c.parentNode!==p){ if(rn&&rn.parentNode===p) p.insertBefore(c,rn); else p.appendChild(c); } }
  c.style.display=''; hpTuDraw(c,a); return 'on'; }

function hpTuHave(a,need){ try{ const I=(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null; if(!a||!I||I.acct!==a||I.err||!I.r) return null;
  const num=v=>(typeof hpNum==='function')?hpNum(v,6):String(v), xah=Number(I.r.xah)||0, evr=(I.r.evr||[]).reduce((s,l)=>s+(Number(l.v)||0),0), xn=(typeof HP_ST_XAH_NEED!=='undefined')?HP_ST_XAH_NEED:1.5;
  let p=0, size=3600; try{ const P=hpFlPeak(); if(P&&P.p>0) p=P.p; }catch(e){} try{ size=Number(HP_HOSTS.size)||3600; }catch(e){}
  const want=Number(need)>0, ne=want?Number(need):(p>0?Math.ceil(p*Math.ceil(30*86400/size)*1e6-1e-6)/1e6:0), sx=xah+1e-9<xn?Math.round((xn-xah)*1e6)/1e6:0, se=(ne>0&&evr+1e-9<ne)?Math.round((ne-evr)*1e6)/1e6:0;
  let t=TF('tu_hv',{xah:num(xah),evr:num(evr)});
  if(sx>0) t+='\n'+TF('tu_hv_sx',{need:num(xn),short:num(sx)});
  if(se>0) t+='\n'+TF(want?'tu_hv_se_amt':'tu_hv_se',{need:num(ne),short:num(se)});
  if(!sx&&!se){ const d=p>0?Math.floor(Math.floor(evr/p+1e-9)*size/86400):0; t+='\n'+(want?TF('tu_hv_ok_amt',{need:num(ne)}):p>0?(d>365?T('tu_hv_ok_y'):TF('tu_hv_ok_d',{d:d})):T('tu_hv_ok')); }
  return {t:t,ok:!sx&&!se,sx:sx,se:se}; }catch(e){ return null; } }
function hpTuDraw(c,a){ const U=HP_TU; let s=null; try{ s=hpStStep(a,(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null); }catch(e){}
  const hv=U?null:hpTuHave(a,0);
  const key=['tu',a,U?1:0,U?hpTuPayKey(a,U,s):'',(typeof curLang==='function'?curLang():''),hv?hv.t:''].join('|'); if(c.getAttribute('data-k')===key){ if(U) hpTuPayDots(); return true; } c.setAttribute('data-k',key); c.textContent='';
  const nt=(t,css)=>{ const d=hpFlEl('div','note',t); d.style.cssText='white-space:pre-line'+(css?';'+css:''); c.appendChild(d); return d; };
  c.appendChild(hpFlEl('h2','',T('tu_h')));
  if(!U){ if(hv){ const d=nt(hv.t,'line-height:1.6;color:'+(hv.ok?'var(--teal)':'var(--amber)')); d.id='tu-have'; }   nt(T((hv&&hv.ok)?'tu_lead_ok':'tu_lead')); const r=hpFlEl('div','row'); r.style.marginTop='6px'; r.appendChild(hpFlBtn('btn_tu_open',()=>{ hpTuOpen(); })); c.appendChild(r); return true; }
  hpTuPayUi(c,a,s,U,{fixed:true}); const r=hpFlEl('div','row'); r.style.marginTop='8px'; r.appendChild(hpFlBtn('btn_tu_close',hpTuClose)); c.appendChild(r); return true; }
function hpFlDrawRq(c,a,W,Q,nm,body,nt,onOld){
  body(TF('fl_3_xq',{name:nm})); { const wn=hpFlEl('div','',hpFlWantText(W)); wn.style.cssText='font-weight:600;margin-top:6px'; c.appendChild(wn); }
  const hd=hpFlEl('div','',TF('fl_3_xq_h',{name:nm})); hd.style.cssText='font-weight:600;margin-top:8px'; c.appendChild(hd);
  try{ const g=qrcode(0,'M'); g.addData(Q.url); g.make(); const im=document.createElement('img'); im.id='fl-xq-qr'; im.src=g.createDataURL(5,2); im.alt='QR'; im.style.cssText='display:block;margin-top:6px;width:220px;max-width:100%;background:#fff;border-radius:6px;image-rendering:pixelated'; c.appendChild(im); }catch(e){ try{ hpLog('はじめての流れ：送る人用の QR を描けない '+e.message); }catch(_){} }
  const r=hpFlEl('div','row'); r.style.cssText='margin-top:6px;flex-wrap:wrap'; r.appendChild(hpFlBtn('btn_fl_3_xq_link',()=>{ hpFlCopy(Q.url,'fl_3_xq_copied','fl_3_xq_copy_pr'); })); if(onOld) r.appendChild(hpFlBtn('btn_fl_3_xq_old',onOld)); c.appendChild(r);
  nt(TF('fl_3_xq_far',{name:nm})); return true; }

const HP_FL_REP=200, HP_FL_AGE=90*86400, HP_FL_CAP_XAH=5, HP_FL_CAP_EVR=20;

const HP_FL_EVR_OPT=[0.5,1,2], HP_FL_EVR_DEF=1, HP_FL_FRIEND_MAX=1, HP_FL_SHORT=7;
function hpFlHostOk(h,now){ return !!(h&&h.active&&h.free>0&&h.lease>0&&Number(h.rep)>=HP_FL_REP&&Number(h.regTs)>0&&(now/1000-h.regTs)>=HP_FL_AGE); }
function hpFlPeak(){ try{ const H=(typeof HP_HOSTS!=='undefined')?HP_HOSTS:null; if(!H||!Array.isArray(H.hosts)) return null; const now=Date.now();
  const a=H.hosts.filter(h=>hpFlHostOk(h,now)).map(h=>Number(h.lease)).sort((x,y)=>x-y); if(!a.length) return null;
  const med=v=>v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2; if(a.length<5) return {p:med(a),n:a.length,k:a.length};
  const bins={}; for(const x of a){ const b=Math.floor(Math.log10(x)*2+1e-9); (bins[b]=bins[b]||[]).push(x); }
  let best=null; for(const b of Object.keys(bins)){ if(best===null||bins[b].length>bins[best].length||(bins[b].length===bins[best].length&&Number(b)<Number(best))) best=b; }
  return {p:med(bins[best]),n:a.length,k:bins[best].length}; }catch(e){ return null; } }
function hpFlEvr(v){ v=Math.round(Number(v)*100)/100; if(!(v>0)) return HP_FL_EVR_DEF; return Math.min(HP_FL_CAP_EVR,v); }
function hpFlWant(evr){ evr=hpFlEvr(evr); const o={xah:(typeof HP_ST_XAH!=='undefined')?HP_ST_XAH:1.5,evr:evr,p:0,days:0,n:0,k:0};
  const P=hpFlPeak(); if(P&&P.p>0){ let size=3600; try{ size=Number(HP_HOSTS.size)||3600; }catch(e){} o.p=P.p; o.n=P.n; o.k=P.k; o.days=Math.floor(Math.floor(evr/P.p+1e-9)*size/86400); }
  return o; }
function hpFlDirect(a){ let x=false, line=false; try{ const I=(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null; if(I&&I.acct===a&&I.r){ x=Number(I.r.xah)>=HP_FL_XAH_NEED;   line=Array.isArray(I.r.evr)&&I.r.evr.length>0; } }catch(e){} return {xah:x,line:line,k:(x?'x':'')+(line?'l':'')}; }

const HP_FL_XAH_NEED=(typeof HP_ST_XAH_NEED!=='undefined')?HP_ST_XAH_NEED:1.5, HP_FL_TS_LIMIT='1000000000', HP_FL_TS_FLAGS=131072  ;   let HP_FL_TS=null, HP_EVR_ISS='';
async function hpEvrIssuer(){ if(HP_EVR_ISS) return HP_EVR_ISS;
  const r=await hpXahauSess(q=>q({command:'ledger_entry',hook_state:{account:HP_GOV,key:'45565201'+'0'.repeat(54)+'01',namespace_id:HP_EVN_NS},ledger_index:'validated'}),20000);
  const d=String((r&&r.node&&r.node.HookStateData)||''); if(!/^[0-9A-Fa-f]{40}$/.test(d)) throw new Error('EVR issuer');
  const a=String(await hpAcctId(hpU8(d))); if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)) throw new Error('EVR issuer'); HP_EVR_ISS=a; return a; }
function hpFlTsSt(a){ return (HP_FL_TS&&HP_FL_TS.a===a)?HP_FL_TS:null; }
function hpFlTsKey(a){ const S=hpFlTsSt(a); return S?[S.st,S.why,S.url,String(S.note||'').length,(S.btns||[]).length].join('/'):''; }
async function hpFlTrust(a){ if(!a||(HP_FL_TS&&HP_FL_TS.a===a&&HP_FL_TS.busy)) return false;
  const R=HP_FL_TS={a:a,busy:1,st:'libs',why:'',url:'',png:'',pushed:false,note:'',btns:null,okAt:0}, live=()=>HP_FL_TS===R, again=()=>{ try{ hpStTick(); }catch(e){} }; again();
  try{ await hpRentLibs(); if(!live()) return false;
    if((await hpXmSignedAs(4000))!==a){ R.st='sign'; again(); const ok=await hpXmEnsure(a,o=>{ if(!live()) return; R.note=String((o&&o.note)||''); R.btns=(o&&o.btns)||null; again(); }); if(!live()) return false; R.note=''; R.btns=null; if(!ok){ R.st='no'; R.busy=0; again(); return false; } }
    R.st='iss'; again(); const iss=await hpEvrIssuer(); if(!live()) return false;
    R.st='make'; again(); const tx={TransactionType:'TrustSet',Account:a,LimitAmount:{currency:'EVR',issuer:iss,value:HP_FL_TS_LIMIT},Flags:HP_FL_TS_FLAGS,NetworkID:HP_XA_NETID};
    const r=await hpXmSubmit(tx,T('fl_3b_instr'),c=>{ if(!live()) return; R.st='open'; R.url=String((c&&c.next&&c.next.always)||''); R.png=String((c&&c.refs&&c.refs.qr_png)||''); R.pushed=!!(c&&c.pushed); again(); });
    if(!live()) return false; R.url=''; R.png='';
    if(!r||!r.signed){ R.st='no'; try{ hpLog('はじめての流れ：EVR を受け取る設定は承認されなかった'); }catch(e){} }
    else if(r.result!=='tesSUCCESS'){ R.st='bad'; R.why=String(r.result||'?'); try{ hpLog('はじめての流れ：EVR を受け取る設定を台帳が通さなかった '+R.why); }catch(e){} }
    else { R.st='ok'; R.okAt=Date.now(); try{ hpLog('はじめての流れ：EVR を受け取れるようにした（発行元 '+iss+'・取引 '+String(r.txid||'').slice(0,12)+'）'); }catch(e){} try{ if(!HP_XM_RD) hpXmRead(a); }catch(e){} }
  }catch(e){ if(!live()) return false; R.st='err'; R.why=String((e&&e.message)||e); try{ hpLog('はじめての流れ：EVR を受け取る設定ができない '+R.why); }catch(_){} }
  R.busy=0; again(); return R.st==='ok'; }
function hpFlDrawTs(c,a,nt){ const S=hpFlTsSt(a), row=hpFlEl('div','row'); row.style.cssText='margin-top:6px;flex-wrap:wrap';
  if(S&&S.st==='ok'){ let re=false; try{ const I=(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null; re=!!(I&&I.acct===a&&Number(I.at)>Number(S.okAt)); }catch(e){} if(!re){ nt(T('fl_3b_s_ok'),'color:var(--teal)'); return; } }
  if(!S||!S.st||S.st==='ok'){ row.appendChild(hpFlBtn('btn_fl_3b_set',()=>{ hpFlTrust(a); },true)); c.appendChild(row); return; }
  if(S.st==='sign'&&S.note){ nt(S.note); for(const b of (S.btns||[])){ const x=hpFlEl('button','b'+(b[2]?' pri':''),String(b[0])); x.type='button'; x.addEventListener('click',()=>{ try{ b[1](); }catch(e){} }); row.appendChild(x); } c.appendChild(row); return; }
  if(S.st==='libs'||S.st==='sign'||S.st==='iss'||S.st==='make'){ nt(T(S.st==='libs'?'fl_3b_s_libs':S.st==='sign'?'fl_3b_s_sign':S.st==='iss'?'fl_3b_s_iss':'fl_3b_s_make')); return; }
  if(S.st==='open'){ nt(TF('fl_3b_s_open',{p:S.pushed?T('fl_3b_pushed'):''}));
    if(S.png){ const im=document.createElement('img'); im.id='fl-ts-qr'; im.src=S.png; im.alt='QR'; im.style.cssText='display:block;margin-top:6px;width:200px;max-width:100%;background:#fff;border-radius:6px'; c.appendChild(im); }
    if(S.url){ const l=hpFlEl('a','b',T('btn_fl_3b_open')); l.href=S.url; l.target='_blank'; l.rel='noopener'; l.style.cssText='display:inline-block;text-decoration:none'; row.appendChild(l); c.appendChild(row); } return; }
  nt(S.st==='no'?T('fl_3b_s_no'):S.st==='bad'?TF('fl_3b_s_bad',{why:S.why}):TF('fl_3b_s_err',{why:S.why}),'color:var(--amber)');
  row.appendChild(hpFlBtn('btn_fl_3b_again',()=>{ hpFlTrust(a); },true)); c.appendChild(row); }
function hpFlDrawSteps(c,a,F,pay,W,DI,nm,Q,s,body,nt,onOld){ const fr=pay==='friend'&&!!Q;
  const row=(done,t)=>{ const d=hpFlEl('div','',(done?'✓ ':'・ ')+t); d.style.cssText='margin-top:10px;line-height:1.5;font-weight:600'+(done?';color:var(--teal)':''); c.appendChild(d); return d; };
  const acctQr=()=>{ try{ const g=qrcode(0,'M'); g.addData(a); g.make(); const im=document.createElement('img'); im.src=g.createDataURL(5,2); im.alt='QR'; im.style.cssText='display:block;margin-top:6px;width:200px;max-width:100%;background:#fff;border-radius:6px;image-rendering:pixelated'; c.appendChild(im); }catch(e){} nt(T('fl_d_1_qr')); };
  const page=(w,old)=>{ hpFlDrawRq(c,a,w,{st:'open',url:hpGiveUrl(a,w)},nm,body,nt,old||null); };
  body(fr?TF('fl_3s_lead',{name:nm}):T('fl_3_self'));
  row(DI.xah,TF('fl_d_1',{xah:W.xah}));
  if(!DI.xah){ if(s&&Number(s.xah)>0) nt(TF('fl_3_lowxah',{have:String(Math.round(Number(s.xah)*1e6)/1e6),need:HP_FL_XAH_NEED})); if(fr) page({xah:W.xah,evr:0},onOld); else acctQr(); }
  row(DI.line,T('fl_d_2'));
  if(!DI.line){ if(!DI.xah) nt(T('fl_3b_wait')); else { nt(T('fl_3b_nt')); hpFlDrawTs(c,a,nt); } nt(T('fl_d_2_nt')); }
  row(false,TF('fl_d_3',{evr:W.evr}));
  if(DI.line){ if(fr) page({xah:0,evr:W.evr},null); else acctQr(); } else nt(T('fl_3c_wait'));
  return true; }
function hpFlStText(a,w){ return hpStText(a)+((w&&w.xah>=0&&w.evr>=0)?'?xah='+String(w.xah)+'&evr='+String(w.evr):''); }
function hpFlAmt(t){ try{ const s=String(t||''), x=/[?&]xah=([0-9]+(?:\.[0-9]+)?)(?:&|$)/.exec(s), e=/[?&]evr=([0-9]+(?:\.[0-9]+)?)(?:&|$)/.exec(s); if(!x||!e) return null;
  const xv=Number(x[1]), ev=Number(e[1]); if(!(xv>=0)||!(ev>=0)||!(xv+ev>0)||xv>HP_FL_CAP_XAH||ev>HP_FL_CAP_EVR) return null; return {xah:xv,evr:ev}; }catch(_){ return null; } }
function hpFlCopy(t,okKey,prKey){ (async()=>{ let ok=false; try{ await navigator.clipboard.writeText(String(t)); ok=true; }catch(e){ ok=false; } if(ok){ try{ hpToast(T(okKey),2500); }catch(e){} } else { try{ prompt(prKey==='fl_3_xq_copy_pr'?T('fl_3_xq_copy_pr'):T('fl_3_copy_pr'),String(t)); }catch(e){} } })(); return true; }
function hpFlWaitText(F,pay){ return '▓'.repeat(HP_FL_DOT+1)+'░'.repeat(3-HP_FL_DOT)+'　'+(pay==='friend'?TF('fl_3_wait',{name:hpFlName(F)}):T('fl_3_wait_self')); }
function hpFlDraw3(c,a,s,F){ const nm=hpFlName(F), pay=(F.pay==='friend'||F.pay==='self')?F.pay:'', late=pay==='friend'&&Number(F.payAt)>0&&Date.now()-F.payAt>=HP_FL_WAIT;
  const st=(s&&s.why==='read')?T('bx_3_read'):(s&&s.why==='noact')?T('fl_3_noact'):(s&&s.why==='lowxah')?T('fl_3_st_lowxah'):(s&&s.why==='lowevr')?T('fl_3_st_lowevr'):T('fl_3_noevr');
  const low=!!(s&&s.why==='lowevr'), have=low?(Number(s.evr)||0):0;
  const amt=hpFlEvr(F.evr), W=(pay==='friend'&&F.want&&F.want.xah>=0&&F.want.evr>=0)?F.want:hpFlWant(amt), days=Number(W.days)||0, xah=W.xah, evr=W.evr, DI=hpFlDirect(a);
  const Q=pay==='friend'?hpFlRqNow(a,W,F):null, xq=!!Q;
  const key=['fl3',pay,a,late?1:0,xah,evr,days,low?have:'',(s&&s.xah!==undefined)?s.xah:'',(xq||pay==='self')?DI.k+'/'+hpFlTsKey(a):'',Q?Q.url:'',(typeof curLang==='function'?curLang():'')].join('|');
  if(c.getAttribute('data-k')===key){ HP_FL_DOT=(HP_FL_DOT+1)%4; const w=document.getElementById('fl-wait'), e=document.getElementById('fl-st'); if(w) w.textContent=hpFlWaitText(F,pay); if(e) e.textContent=st; return true; }
  c.setAttribute('data-k',key); c.textContent='';
  const nt=(t,css)=>{ const d=hpFlEl('div','note',t); d.style.cssText='white-space:pre-line'+(css?';'+css:''); c.appendChild(d); return d; };
  const body=t=>{ const d=hpFlEl('div','',t); d.style.cssText='margin:8px 0;line-height:1.5'; c.appendChild(d); return d; };
  const again=()=>{ try{ hpStTick(); }catch(e){} }, set=v=>()=>{ try{ const G=hpFlGet(); if(G){ delete G.old; delete G.rq;   G.pay=v; G.payAt=v?Date.now():0; G.want=v==='friend'?hpFlWant(Math.min(hpFlEvr(G.evr),HP_FL_FRIEND_MAX)):null;   if(G.want){ try{ hpLog('はじめての流れ：家賃の山 '+G.want.n+' 件中 '+G.want.k+' 件、中央値 '+G.want.p+' EVR → 頼む量 EVR '+G.want.evr+'（約 '+G.want.days+' 日ぶん）'); }catch(_){} } saveID(); } }catch(e){} again(); };

  c.appendChild(hpFlEl('h2','',T('fl_3_h')));
  if(!pay){ { const pr=hpFlEl('div','row'); pr.style.cssText='margin-top:6px;align-items:center;flex-wrap:wrap'; const lb=hpFlEl('span','',T('fl_3_amt')); lb.style.cssText='font-size:13px;color:var(--dim)'; pr.appendChild(lb);
      const pick=v=>{ try{ const G=hpFlGet(); if(G){ G.evr=hpFlEvr(v); saveID(); } }catch(e){} again(); };
      for(const v of HP_FL_EVR_OPT){ const b=hpFlEl('button','b'+(v===amt?' pri':''),'EVR '+v); b.type='button'; b.addEventListener('click',()=>{ pick(v); }); b.style.cssText='padding:6px 12px;font-size:13px'; pr.appendChild(b); }
      const ip=hpFlEl('input'); ip.type='number'; ip.id='fl-evr-in'; ip.min='0.1'; ip.max=String(HP_FL_CAP_EVR); ip.step='0.1'; ip.inputMode='decimal'; ip.value=String(amt); ip.style.cssText='width:5.5em'; ip.addEventListener('change',()=>{ pick(ip.value); }); pr.appendChild(ip); c.appendChild(pr); }
    body(TF('fl_3_ask',{name:nm,xah:xah,evr:evr})); if(low) nt(TF('fl_3_low',{have:have,evr:amt}));   if(W.p>0){ nt(TF('fl_3_basis',{evr:evr,p:W.p,d:days})); if(days<HP_FL_SHORT) nt(TF('fl_3_short',{d:days}),'color:var(--amber)'); }
    const w=hpFlEl('div','',TF('fl_3_ledger',{name:nm})); w.style.cssText='margin:10px 0;padding:8px 10px;border-left:3px solid var(--amber);background:#2a2112;font-size:13px;line-height:1.5'; c.appendChild(w);
    const r=hpFlEl('div','row'); r.style.cssText='margin-top:8px;flex-wrap:wrap';
    if(amt>HP_FL_FRIEND_MAX) nt(TF('fl_3_long',{max:HP_FL_FRIEND_MAX})); else { const b1=hpFlBtn('btn_fl_3_friend',set('friend'),true); b1.textContent=TF('btn_fl_3_friend',{name:nm}); r.appendChild(b1); }   r.appendChild(hpFlBtn('btn_fl_3_self',set('self'))); r.appendChild(hpFlBtn('btn_fl_more',()=>{ hpFlMore('3'); })); c.appendChild(r); return true; }
  if(xq||pay==='self') hpFlDrawSteps(c,a,F,pay,W,DI,nm,Q,s,body,nt,()=>{ try{ const G=hpFlGet(); if(G){ G.old=1; saveID(); } }catch(e){} again(); });   else if(pay==='friend'){ body(TF('fl_3_show',{name:nm}));
    { const wn=hpFlEl('div','',TF('fl_3_want',{xah:xah,evr:evr})); wn.style.cssText='font-weight:600;margin-top:6px'; c.appendChild(wn); }
    const hd=hpFlEl('div','',TF('fl_3_qr_h',{name:nm})); hd.style.cssText='font-weight:600;margin-top:8px'; c.appendChild(hd);
    try{ const g=qrcode(0,'M'); g.addData(hpFlStText(a,W)); g.make(); const im=document.createElement('img'); im.src=g.createDataURL(5,2); im.alt='QR'; im.style.cssText='display:block;margin-top:6px;width:220px;max-width:100%;background:#fff;border-radius:6px;image-rendering:pixelated'; c.appendChild(im); }catch(e){ try{ hpLog('口座の QR を描けない '+e.message); }catch(_){} } }

  const ad=hpFlEl('div','mono',a); ad.style.cssText='margin-top:6px;word-break:break-all'; c.appendChild(ad);
  if(pay==='friend'&&!xq){ nt(T('fl_3_safe')); nt(TF('fl_3_tool',{name:nm})); const rdx=hpFlEl('div','row'); rdx.style.marginTop='4px'; rdx.appendChild(hpFlBtn('btn_fl_3_direct',set('self'))); c.appendChild(rdx); }
  const r1=hpFlEl('div','row'); r1.style.marginTop='6px'; if(xq) r1.style.display='none';   r1.appendChild(hpFlBtn('btn_fl_3_copy',()=>{ hpFlCopy(pay==='friend'?hpFlStText(a,W):a,'fl_3_copied'); }));   c.appendChild(r1);
  const wt=hpFlEl('div','',hpFlWaitText(F,pay)); wt.id='fl-wait'; wt.style.cssText='margin-top:10px;color:var(--teal)'+((xq&&Q.st!=='open')?';display:none':''); c.appendChild(wt);
  const se=nt(st); se.id='fl-st';
  if(late&&(!xq||Q.st==='open')) nt(xq?TF('fl_3_xq_late',{name:nm}):TF('fl_3_late',{name:nm}),'color:var(--amber)');
  const r2=hpFlEl('div','row'); r2.style.cssText='margin-top:8px;flex-wrap:wrap';
  r2.appendChild(hpFlBtn('btn_bx_reread',()=>{ try{ if(!HP_XM_RD) hpXmRead(a); }catch(e){} })); r2.appendChild(hpFlBtn('btn_fl_3_back',set(''))); r2.appendChild(hpFlBtn('btn_fl_more',()=>{ hpFlMore('3'); })); c.appendChild(r2);
  return true; }

function hpFlGiftAsk(me){ hpFlClose('fl-gift');
  const box=hpFlEl('div'); box.id='fl-gift'; box.style.cssText='position:fixed;inset:0;z-index:9050;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
  const card=hpFlEl('div','card'); card.style.cssText='max-width:440px;width:100%;max-height:100%;overflow:auto;text-align:left';
  card.appendChild(hpFlEl('h2','',T('bx_g_title'))); const ld=hpFlEl('div','',T('fl_g_lead')); ld.style.cssText='margin:8px 0;line-height:1.5'; card.appendChild(ld);
  const er=hpFlEl('div','note',''); er.id='fl-gift-err'; er.style.color='var(--amber)';
  const pick=(v,tell)=>{ const a=hpStParse(v); if(!a){ tell(T(tell===say?'fl_g_bad':'bx_g_bad')); return false; } if(a===me){ tell(T('bx_g_self')); return false; } hpFlClose('fl-gift'); hpStGiftDlg(me,a,hpFlAmt(v));   return true; }, say=t=>{ er.textContent=t; };
  if(typeof startScanFull==='function'){ const r0=hpFlEl('div','row'); r0.appendChild(hpFlBtn('btn_fl_g_scan',()=>{ hpFlClose('fl-gift'); startScanFull(v=>{ pick(v,t=>{ try{ hpTell(t); }catch(e){} }); },{title:T('bx_g_scan'),hint:T('bx_g_hint')}); },true)); card.appendChild(r0); }
  const ip=hpFlEl('input'); ip.type='text'; ip.id='fl-gift-in'; ip.placeholder=T('fl_g_ph'); ip.autocomplete='off'; ip.spellcheck=false; ip.style.cssText='width:100%;box-sizing:border-box;margin-top:6px'; card.appendChild(ip); card.appendChild(er);
  const row=hpFlEl('div','row'); row.style.cssText='margin-top:8px;flex-wrap:wrap'; row.appendChild(hpFlBtn('btn_fl_g_go',()=>{ pick(ip.value,say); })); row.appendChild(hpFlBtn('btn_fl_close',()=>{ hpFlClose('fl-gift'); })); card.appendChild(row);
  box.appendChild(card); document.body.appendChild(box); return true; }

const HP_UP_EVERY=2400, HP_UP_DAYS=30, HP_UP_PAR=(()=>{ try{ return (typeof navigator!=='undefined'&&/Android|iPhone|iPad|iPod|Mobile/.test(String(navigator.userAgent||'')))?6:25; }catch(e){ return 25; } })()  , HP_UP_N=5, HP_UP_SESS=300e3, HP_UP_STALE=3600e3; let HP_UP={}, HP_UP_RUN=null, HP_UP_TICK=0;
function hpUpAmt(){ try{ if(typeof HP_XM_INFO!=='undefined'&&HP_XM_INFO&&HP_XM_INFO.r&&Array.isArray(HP_XM_INFO.r.evr)) return Math.round(HP_XM_INFO.r.evr.reduce((s,l)=>s+(Number(l.v)||0),0)*1e6)/1e6; }catch(e){} try{ const F=hpFlGet(); if(F&&Number(F.evr)>0) return hpFlEvr(F.evr); }catch(e){} return HP_FL_EVR_DEF; }
function hpUpRentDays(){ return (typeof HP_DAYS_DEF!=='undefined')?HP_DAYS_DEF:30; }
function hpUpCost(h,days){ const size=hpUpSize(), d=Math.max(0,Math.floor(Number(days===undefined?hpUpRentDays():days)||0)), n=Math.max(0,Math.ceil(d*86400/size-1e-9)), p=Number(h&&h.lease)||0; return {n:n,d:d,evr:p>0?Math.round(p*n*1e6)/1e6:0,ok:p>0&&n>0}; }
function hpUpSize(){ try{ return Number(HP_HOSTS.size)||3600; }catch(e){ return 3600; } }
function hpUpDays(h,evr){ evr=evr===undefined?hpUpAmt():evr; const n=(typeof hpEvMomEvr==='function')?hpEvMomEvr(evr,h&&h.lease):0; return {n:n,d:Math.floor(n*hpUpSize()/86400)}; }
function hpUpDaysText(h){ const c=hpUpCost(h); return c.ok?TF('hs_days_v',{c:hpNum(c.evr,6)}):'—'; }
function hpUpCanPay(h,evr){ const c=hpUpCost(h); return c.ok&&c.evr<=(evr===undefined?hpUpAmt():Number(evr)||0)+1e-9; }
function hpUpCands(evr,now){ now=now||Date.now(); try{ const H=(typeof HP_HOSTS!=='undefined')?HP_HOSTS:null; if(!H||H.empty||!Array.isArray(H.hosts)) return null;
  return H.hosts.filter(h=>hpFlHostOk(h,now)&&hpUpCanPay(h,evr)&&h.aid).sort((x,y)=>(x.lease-y.lease)||((Number(y.rep)||0)-(Number(x.rep)||0))||String(x.addr).localeCompare(String(y.addr))).slice(0,HP_UP_N); }catch(e){ return null; } }
async function hpUpRead(aid,from,onProg){ const C=await hpMomCfg(); const KEY='45565203'+'0'.repeat(16)+String(aid).toUpperCase();
  return hpXahauSess(async q=>{
    const H0=await q({command:'ledger',ledger_index:'validated'}); const i0=Number(H0.ledger_index||(H0.ledger&&H0.ledger.ledger_index)), t0=Number(H0.ledger.close_time)+HP_LG_EPOCH;
    const hdr=async i=>{ const r=await q({command:'ledger',ledger_index:Math.max(1,Math.round(i))}); return {i:Number(r.ledger_index||r.ledger.ledger_index),t:Number(r.ledger.close_time)+HP_LG_EPOCH}; };
    const cur=hpMomNow(C,t0*1000), first=cur-Math.round(HP_UP_DAYS*86400/C.size); from=Math.max(Number(from)||0,hpMomStart(first,C)/1000-HP_UP_EVERY);   const anchors=[{i:i0,t:t0}]; let rate=1/3.5, oldest=null;
    for(let T=t0-86400;;T-=86400){ const tt=Math.max(T,from-3600); let a=anchors[anchors.length-1], g={i:a.i-(a.t-tt)*rate,t:0}, miss=0;
      try{ for(let k=0;k<6;k++){ g=await hdr(g.i); if(Math.abs(g.t-tt)<120) break; const b=anchors[anchors.length-1]; if(g.i!==b.i&&g.t!==b.t) rate=Math.max(0.05,Math.min(2,(b.i-g.i)/(b.t-g.t))); g={i:g.i-(g.t-tt)*rate,t:0}; } if(!g.t) g=await hdr(g.i); }
      catch(e){ if(!/lgrNotFound/.test(String((e&&e.message)||e))) throw e; miss=Math.max(1,Math.round(g.i)); }
      if(miss){ let lo=miss, hi=anchors[anchors.length-1].i; while(hi-lo>1){ const mid=Math.floor((lo+hi)/2); try{ await hdr(mid); hi=mid; }catch(e){ if(!/lgrNotFound/.test(String((e&&e.message)||e))) throw e; lo=mid; } } oldest=await hdr(hi); anchors.push(oldest); from=Math.max(from,oldest.t+60); break; }
      anchors.push(g); if(tt<=from-3600) break; }
    anchors.sort((x,y)=>x.t-y.t);
    const idxAt=T=>{ let k=anchors.findIndex(x=>x.t>=T); if(k<1) k=(k===0)?1:anchors.length-1; const a=anchors[k-1], b=anchors[k]; return Math.round(a.i+(T-a.t)*(b.i-a.i)/(b.t-a.t)); };
    const times=[]; for(let T=from;T<t0;T+=HP_UP_EVERY) times.push(T); times.push(t0);
    const lhbs=new Set(), reps=[]; let reads=0, fails=0, consec=0;
    for(let s=0;s<times.length;s+=HP_UP_PAR){ await Promise.all(times.slice(s,s+HP_UP_PAR).map(async T=>{ for(let k=0;k<2;k++){ try{ const r=await q({command:'ledger_entry',hook_state:{account:HP_GOV,key:KEY,namespace_id:HP_EVN_NS},ledger_index:idxAt(T)}); const d=String((r&&r.node&&r.node.HookStateData)||''); if(d.length<200) throw new Error('form');
        const v=hpHexLE(d,92,8); if(v>0) lhbs.add(v); if(d.length>=252){ const rv=parseInt(d.substr(250,2),16); if(rv>=0&&rv<=255) reps.push([T,rv]); }   reads++; consec=0; return; }catch(e){ if(k===1||/NotFound|form|closed/.test(String((e&&e.message)||e))){ fails++; consec++; return; } await new Promise(r=>setTimeout(r,800)); } } }));
      if(consec>=HP_UP_PAR*2) throw new Error('read '+fails); try{ if(onProg) onProg(Math.min(s+HP_UP_PAR,times.length),times.length); }catch(e){} }
    return {t0:t0,cur:cur,lhbs:[...lhbs],reps:reps,reads:reads,fails:fails,oldest:oldest?oldest.t:0,C:C}; },HP_UP_SESS); }
function hpUpMerge(R,old){ const C=R.C, cur=R.cur, N=Math.round(HP_UP_DAYS*86400/C.size), first=cur-N, seen=new Set(R.lhbs.map(t=>hpMomNow(C,t*1000)));
  const fromM=R.readFrom!==undefined?R.readFrom:first; let bits=''; for(let m=first;m<cur;m++){ if(m<fromM){ bits+=(old&&old.bits&&m>=old.first&&m<old.cur)?old.bits[m-old.first]:'?'; } else if(R.oldest&&hpMomStart(m,C)/1000<R.oldest) bits+='?'; else bits+=seen.has(m)?'1':'0'; }
  return {first:first,cur:cur,bits:bits}; }
function hpUpSum(B,C){ const n=B.bits.length; let have=0, unread=0, gaps=[], run=0;
  for(let k=0;k<n;k++){ const c=B.bits[k]; if(c==='?'){ unread++; continue; } if(c==='1'){ have++; if(run){ gaps.push([B.first+k-run,run]); run=0; } } else run++; } if(run) gaps.push([B.cur-run,run]);
  const N=n-unread, last=gaps.length?gaps[gaps.length-1]:null; return {pct:N>0?Math.round(have/N*1000)/10:0,have:have,n:N,gaps:gaps,last:last?{t:hpMomStart(last[0],C),h:Math.round(last[1]*C.size/3600*10)/10}:null}; }
async function hpUpHost(h,onProg){ const addr=h.addr, k='up:'+addr; let old=null; try{ old=await HP_HS_CACHE.get(k); }catch(e){} const C0=await hpMomCfg(); const nowM=hpMomNow(C0);
  let from=0, readFrom; if(old&&old.bits&&typeof old.reps==='string'&&Number(old.cur)>0&&nowM-old.cur<HP_UP_DAYS*86400/C0.size){   readFrom=old.cur-1; from=hpMomStart(readFrom,C0)/1000-HP_UP_EVERY; } else old=null;
  const t0=Date.now(), R=await hpUpRead(h.aid,from,onProg); if(readFrom!==undefined) R.readFrom=readFrom; const B=hpUpMerge(R,old), S=hpUpSum(B,R.C), RP=(typeof hpRpMerge==='function')?hpRpMerge(R,old,B):null;
  try{ await HP_HS_CACHE.put(k,Object.assign({at:R.t0*1000,first:B.first,cur:B.cur,bits:B.bits},RP?{reps:RP.reps,rnow:RP.now}:{})); }catch(e){}
  try{ log(TL('lg_up_ok',{dom:hpUpName(h),u:S.pct,r:R.reads,s:Math.round((Date.now()-t0)/1000),f:R.fails,o:old?'続き':'全部'})); }catch(e){}
  return Object.assign({st:'ok',at:Date.now(),reads:R.reads,fails:R.fails,cont:!!old},S,RP?{rp:{first:B.first,reps:RP.reps,now:RP.now,base:R.C.base,trans:R.C.trans,size:R.C.size}}:{}); }
function hpUpName(h){ try{ return (typeof hpHostName==='function')?hpHostName(h.addr):(h.desc||h.addr); }catch(e){ return h.addr; } }
function hpUpTick(){ const now=Date.now(); if(now-HP_UP_TICK<400) return false; HP_UP_TICK=now; try{ hpStTick(); }catch(e){} return true; }
function hpUpFresh(x){ return !!(x&&x.st==='ok'&&Date.now()-x.at<HP_UP_STALE); }
function hpUpStart(cands){ if(HP_UP_RUN) return HP_UP_RUN; HP_UP_RUN=true;
  HP_UP_RUN=(async()=>{ for(let i=0;i<cands.length;i++){ const h=cands[i]; if(hpUpFresh(HP_UP[h.addr])) continue; HP_UP[h.addr]={st:'busy',k:i+1,n:cands.length,done:0,total:0}; hpUpTick();
      try{ HP_UP[h.addr]=await hpUpHost(h,(d,t)=>{ const u=HP_UP[h.addr]; if(u&&u.st==='busy'){ u.done=d; u.total=t; } hpUpTick(); }); }
      catch(e){ HP_UP[h.addr]={st:'err',at:Date.now(),why:String((e&&e.message)||e)}; try{ log(TL('lg_up_fail',{dom:hpUpName(h),why:HP_UP[h.addr].why})); }catch(_){} }
      hpUpTick(); } HP_UP_RUN=null; HP_UP_TICK=0; try{ hpStTick(); }catch(e){} })(); return HP_UP_RUN; }
function hpUpRank(cands){ const u=h=>HP_UP[h.addr]||null, p=h=>{ const x=u(h); return (x&&x.st==='ok')?Math.round(x.pct*10):-1; };
  return cands.slice().sort((x,y)=>(p(y)-p(x))||(x.lease-y.lease)||((Number(y.rep)||0)-(Number(x.rep)||0))); }
function hpUpBusy(cands){ const n=cands.length; let k=0, done=0, total=0, pend=0; for(let i=0;i<n;i++){ const x=HP_UP[cands[i].addr]; if(!x||x.st==='busy'||(x.st==='ok'&&!hpUpFresh(x))){ pend++; if(!k){ k=i+1; if(x&&x.st==='busy'){ done=x.done; total=x.total; } } } } return pend?{k:k,n:n,p:Math.max(0,Math.min(100,Math.round(((k-1)+(total?done/total:0))/n*100))),q:total?Math.round(done/total*100):0}:null; }
function hpUpWhy(h){ const x=HP_UP[h.addr]; if(!x||x.st!=='ok') return (x&&x.st==='err')?T('fl_4_up_no'):'…'; const a=[x.n<Math.round(HP_UP_DAYS*86400/hpUpSize())?TF('fl_4_up_part',{u:x.pct,n:x.n}):TF('fl_4_up',{u:x.pct})];
  a.push(x.last?TF('fl_4_gap',{d:hpUpDate(x.last.t),h:x.last.h}):T('fl_4_nogap')); a.push(TF('fl_4_rep',{r:h.rep==null?'—':h.rep})); a.push(T(h.active?'hs_st_on':'hs_st_off')); if(h.regTs) a.push(TF('fl_4_age',{ym:hpUpYm(h.regTs*1000)})); return a.join((typeof hpSep==='function'?hpSep():'・')); }
function hpUpDate(ms){ const d=new Date(ms), s=(typeof hpDateIntl==='function')?hpDateIntl(d.getTime(),'md'):''; if(s) return s; return (d.getMonth()+1)+'/'+d.getDate(); }
function hpUpYm(ms){ const d=new Date(ms), s=(typeof hpDateIntl==='function')?hpDateIntl(d.getTime(),'ym'):''; if(s) return s; return d.getFullYear()+'/'+(d.getMonth()+1); }
function hpFlDraw4(c,a,s,F){ const renting=!!(ID&&ID.rentJob), L=(typeof curLang==='function')?curLang():''; let rec=''; try{ if(typeof HP_HS_REC!=='undefined'&&HP_HS_REC&&typeof hpHsRecText==='function') rec=hpHsRecText(HP_HS_REC); }catch(e){}
  const have=(typeof hpHsHave==='function')?hpHsHave():!!(typeof HP_HOSTS!=='undefined'&&HP_HOSTS&&!HP_HOSTS.empty);
  const key=['fl4',renting?'r':'',have?'h':'',rec,L].join('|'); if(c.getAttribute('data-k')===key) return true; c.setAttribute('data-k',key); c.textContent='';
  const nt=(t,css)=>{ const d=hpFlEl('div','note',t); d.style.cssText='white-space:pre-line'+(css?';'+css:''); c.appendChild(d); return d; }, body=t=>{ const d=hpFlEl('div','',t); d.style.cssText='margin:8px 0;line-height:1.5'; c.appendChild(d); return d; };
  c.appendChild(hpFlEl('h2','',T((F&&F.box)?'bf_3_h':'fl_4_h')));
  if(renting){ nt(T('fl_4_renting')); return true; }
  body(T('fl_4_body')); nt(T('fl_4_how')); if(rec) nt(TF('fl_4_rec',{c:rec}));
  if(!have){ nt(T('fl_4_hosts')); try{ if(typeof hpHsAuto==='function') hpHsAuto(); }catch(e){} }
  const r=hpFlEl('div','row'); r.style.marginTop='8px'; r.appendChild(hpFlBtn('btn_fl_4_list',()=>{ try{ hpHsOpen(); }catch(e){} },true)); c.appendChild(r); return true; }
function hpUpGauge(p,moving){ const g=hpFlEl('div','fl-gauge'); g.style.cssText='height:8px;background:#1b2740;border-radius:4px;overflow:hidden;margin:6px 0'; const f=hpFlEl('div',''); const w=Math.max(0,Math.min(100,Number(p)||0));
  f.style.cssText='height:100%;width:'+(w>0?w:8)+'%;background:'+(moving?'repeating-linear-gradient(90deg,var(--teal) 0 10px,#1e6f63 10px 20px)':'var(--teal)')+';border-radius:4px;transition:width .4s'+(moving?';animation:hp-gauge 1s linear infinite':''); g.appendChild(f);
  try{ if(typeof document!=='undefined'&&document.getElementById&&!document.getElementById('hp-gauge-css')){ const st=document.createElement('style'); st.id='hp-gauge-css'; st.textContent='@keyframes hp-gauge{from{background-position:0 0}to{background-position:20px 0}}'; (document.head||document.body).appendChild(st); } }catch(e){} return g; }

function hpUpText(h){ const x=HP_UP[h.addr]; if(!x) return '—'; if(x.st==='busy') return TF('fl_4_busy_one',{p:x.total?Math.round(x.done/x.total*100):0}); if(x.st!=='ok') return T('fl_4_up_no');
  return (x.n<Math.round(HP_UP_DAYS*86400/hpUpSize())?TF('fl_4_up_part',{u:x.pct,n:x.n}):TF('fl_4_up',{u:x.pct}))+(typeof hpSep==='function'?hpSep():'・')+(x.last?TF('fl_4_gap',{d:hpUpDate(x.last.t),h:x.last.h}):T('fl_4_nogap')); }
function hpUpPut(h){ try{ const el=document.getElementById('hs-p-up'); if(!el) return false; if(typeof HP_HS_PICK!=='undefined'&&HP_HS_PICK&&HP_HS_PICK!==h.addr) return false; el.textContent=hpUpText(h); return true; }catch(e){ return false; } }
function hpUpPick(h){ if(!h||!h.addr) return false; if(!h.aid){ try{ const el=document.getElementById('hs-p-up'); if(el) el.textContent='—'; }catch(e){} return false; }
  const x=HP_UP[h.addr]; if(hpUpFresh(x)||(x&&x.st==='busy')){ hpUpPut(h); return true; }
  HP_UP[h.addr]={st:'busy',k:1,n:1,done:0,total:0}; hpUpPut(h);
  (async()=>{ try{ HP_UP[h.addr]=await hpUpHost(h,(d,t)=>{ const u=HP_UP[h.addr]; if(u&&u.st==='busy'){ u.done=d; u.total=t; } hpUpPut(h); }); }
    catch(e){ HP_UP[h.addr]={st:'err',at:Date.now(),why:String((e&&e.message)||e)}; try{ log(TL('lg_up_fail',{dom:hpUpName(h),why:HP_UP[h.addr].why})); }catch(_){} }
    hpUpPut(h); })(); return true; }

const HP_BF_B=['bf_b1','bf_b2','bf_b3'], HP_BF_S=['bf_s1','bf_s2','bf_s3']; let HP_BF_PR='', HP_BF_PR_AT=0, HP_BF_BOOT=false, HP_BF_PICK_AT=0;
function hpBfGet(){ try{ return (typeof ID!=='undefined'&&ID&&ID.boxFlow&&typeof ID.boxFlow==='object'&&ID.boxFlow.box)?ID.boxFlow:null; }catch(e){ return null; } }

let HP_BF_ALLOW=false;
function hpBfDrawClosed(c){ let h='',t=''; try{ h=hpPostHost(); }catch(e){} try{ t=hpLeaseText(); }catch(e){} const L=(typeof curLang==='function')?curLang():'', key=['bfclosed',h,t,L].join('|'); if(c.getAttribute('data-k')===key) return true; c.setAttribute('data-k',key); c.textContent='';
  c.appendChild(hpFlEl('h2','',T('bf_c_h'))); const d=hpFlEl('div',''); d.id='bf-closed'; d.style.cssText='margin:8px 0;line-height:1.6;white-space:pre-line';
  { const HM='\u0001', hs=h||'—', ps=(t?TF('bf_c_box',{h:HM,t:t}):TF('bf_c_box_nt',{h:HM})).split(HM);
    if(ps.length===2){ d.appendChild(hpFlEl('span','',ps[0])); const u=hpFlEl('span','mono',hs); u.id='bf-closed-host'; u.style.cssText='color:var(--teal);font-weight:700;overflow-wrap:anywhere'; d.appendChild(u); const w=hpFlEl('span','',ps[1]); if(t&&ps[1]){ w.id='bf-closed-exp'; w.style.cssText='color:var(--ink);font-weight:700'; } d.appendChild(w); }   else d.textContent=t?TF('bf_c_box',{h:hs,t:t}):TF('bf_c_box_nt',{h:hs}); }
  c.appendChild(d);
  const n=hpFlEl('div','note',T('bf_c_nt')); n.style.cssText='white-space:pre-line;line-height:1.5'; c.appendChild(n); return true; }

let HP_BF_BYME=false;
function hpBfOpted(){ try{ const B=hpBfGet(); return !!(B&&B.go&&!B.off); }catch(e){ return false; } }
function hpBfSync(){ const o=hpBfOpted(); if(o&&!HP_BF_ALLOW){ HP_BF_ALLOW=true; HP_BF_BYME=true; } else if(!o&&HP_BF_BYME){ HP_BF_ALLOW=false; HP_BF_BYME=false; } return HP_BF_ALLOW; }
function hpBfOptIn(){ try{ if(!hpBfOn()) return false; let B=hpBfGet(); if(!B){ B=ID.boxFlow={box:1,at:Date.now(),n:0,go:0,seen:1}; } delete B.off; B.seen=1; B.go=1; saveID(); try{ localStorage.setItem('p2p_bf_seen','1'); }catch(e){}
    hpBfSync(); hpLog('この端末専用の郵便受けを借りる流れを始めた（押して始めた）'); try{ hpFlGoto(hpBfStep()); }catch(e){} return true; }catch(e){ return false; } }
hpBfDrawClosed=(function(f){ return function(c){ const r=f.apply(this,arguments); try{ if(c&&c.querySelector&&!c.querySelector('#bf-optin')&&hpBfOn()){ const row=hpFlEl('div','row'); row.id='bf-optin'; row.style.cssText='margin-top:8px;justify-content:flex-start'; row.appendChild(hpFlBtn('btn_bf_optin',()=>{ hpBfOptIn(); })); c.appendChild(row); } }catch(e){} return r; }; })(hpBfDrawClosed);
hpBfTick=(function(f){ return function(){ try{ hpBfSync(); }catch(e){} return f.apply(this,arguments); }; })(hpBfTick);

function hpBfOn(){ try{ if(typeof ID==='undefined'||!ID||typeof hpIsChild!=='function'||!hpIsChild()) return false; if(typeof hpBoxSub==='function'&&hpBoxSub()) return false; return true; }catch(e){ return false; } }
function hpBfStep(){ let a=''; try{ a=hpXmAcct(); }catch(e){} if(!a) return 1; try{ if(ID.rentJob) return 3; }catch(e){}
  try{ const I=(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null, r=hpStStep(a,I), B=hpBfGet(); if(r.why==='read'&&B&&Number(B.n)>=2) return Math.min(3,Number(B.n));   return r.n>=4?3:2; }catch(e){ return 2; } }
function hpBfPraise(to,a){ if(to===2) return TF('bf_p1',{a:hpFlAcct(a)}); if(to===3) return T('bf_p2'); return T('bf_p3'); }
function hpBfBand(B,n){ let b=document.getElementById('bf-band');
  if(!B){ if(b&&b.parentNode) b.parentNode.removeChild(b); return null; }
  const fresh=!!HP_BF_PR&&Date.now()-HP_BF_PR_AT<HP_FL_PRAISE, txt=fresh?HP_BF_PR:TF('bf_band',{n:n,t:T(HP_BF_B[n-1]||'bf_b3')}), key=n+'|'+txt;
  if(!b){ const nav=document.querySelector('nav'); if(!nav||!nav.parentNode) return null;
    b=hpFlEl('div'); b.id='bf-band'; b.setAttribute('role','button'); b.tabIndex=0; b.style.cssText='display:flex;align-items:center;gap:8px;padding:8px 14px;background:#0f2a24;border-bottom:1px solid var(--teal);color:var(--ink);font-size:13px;line-height:1.4;cursor:pointer';
    b.addEventListener('click',()=>{ hpBfDlg(); }); nav.parentNode.insertBefore(b,nav); }
  if(b.getAttribute('data-k')===key) return b; b.setAttribute('data-k',key); b.textContent='';
  const bot=hpFlBot(); if(bot) b.appendChild(bot);
  const s=hpFlEl('span','',txt); s.style.cssText='flex:1 1 auto;min-width:0'+(fresh?';color:var(--teal);font-weight:600':''); b.appendChild(s);
  const g=hpFlEl('span'); g.style.cssText='flex:0 0 auto;display:flex;gap:3px';
  for(let i=1;i<=3;i++){ const d=hpFlEl('span'); d.style.cssText='width:12px;height:5px;border-radius:3px;background:'+(i<n?'var(--teal)':i===n?'var(--amber)':'var(--line)'); g.appendChild(d); }
  b.appendChild(g); return b; }
function hpBfLodge(c){ let h='',t=''; try{ h=hpPostHost(); }catch(e){} try{ t=hpLeaseText(); }catch(e){} const d=hpFlEl('div','note',t?TF('bf_lodge',{h:h||'—',t:t}):TF('bf_lodge_nt',{h:h||'—'})); d.style.cssText='white-space:pre-line;line-height:1.5'; c.appendChild(d); return d; }
function hpBfGo(n){ try{ const B=hpBfGet(); if(B&&!B.go){ B.go=1; saveID(); hpLog('この端末の郵便受けを借りる流れを始めた（'+n+'／3 から）'); } }catch(e){} try{ hpFlGoto(n); }catch(e){} }
function hpBfDlg(){ const B=hpBfGet(); if(!B) return null; hpFlClose('bf-dlg'); const n=hpBfStep();
  const box=hpFlEl('div'); box.id='bf-dlg'; box.style.cssText='position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.7);display:flex;align-items:center;justify-content:center;padding:16px';
  const card=hpFlEl('div','card'); card.style.cssText='max-width:440px;width:100%;max-height:100%;overflow:auto;text-align:left';
  card.appendChild(hpFlEl('h2','',T('bf_title'))); const ld=hpFlEl('div','',T('bf_lead')); ld.style.cssText='margin:8px 0;line-height:1.5'; card.appendChild(ld); hpBfLodge(card);
  for(let i=1;i<=3;i++){ const d=hpFlEl('div','fl-s',(i<n?'✓':i===n?'▶':'・')+' '+i+'. '+T(HP_BF_S[i-1])); d.style.cssText='margin:6px 0;line-height:1.5'+(i===n?';font-weight:600':i<n?';color:var(--teal)':''); card.appendChild(d); }
  const nt=hpFlEl('div','note',T('bf_note')); nt.style.whiteSpace='pre-line'; card.appendChild(nt);
  const row=hpFlEl('div','row'); row.style.cssText='margin-top:10px;flex-wrap:wrap';
  row.appendChild(hpFlBtn(B.go?'btn_fl_cont':'btn_fl_go',()=>{ hpFlClose('bf-dlg'); hpBfGo(n); },true)); row.appendChild(hpFlBtn('btn_fl_later',()=>{ hpFlClose('bf-dlg'); })); card.appendChild(row);
  box.appendChild(card); document.body.appendChild(box); return box; }

function hpBfTick(){ try{ if(typeof document==='undefined'||!document.getElementById) return ''; const on=hpBfOn(); let B=hpBfGet();
  if(!on){ if(B){ delete ID.boxFlow; saveID(); hpFlClose('bf-dlg'); if(typeof hpBoxSub==='function'&&hpBoxSub()){ hpLog('この端末の郵便受けを借りる流れ：借りた（流れを片付けた）'); try{ hpToast(hpBfPraise(4),6000); }catch(e){} } } hpBfBand(null,0); return 'off'; }
  if(!HP_BF_ALLOW){ hpBfBand(null,0); hpFlClose('bf-dlg'); HP_BF_BOOT=true; return 'closed'; }
  if(!B){ B=ID.boxFlow={box:1,at:Date.now(),n:0,go:0,seen:0}; HP_BF_PR=''; saveID(); hpLog('この端末は自分の郵便受けを持っていない（メイン端末の郵便受けに間借り）。借りる流れを出す'); }
  if(B.off){ hpBfBand(null,0); hpFlClose('bf-dlg'); HP_BF_BOOT=true; return 'later'; }
  const n=hpBfStep(), was=Number(B.n)||0;
  if(n!==was){ if(n>was&&was>0){ let a=''; try{ a=hpXmAcct(); }catch(e){} HP_BF_PR=hpBfPraise(n,a); HP_BF_PR_AT=Date.now(); hpLog('この端末の郵便受けを借りる流れ：'+was+' → '+n+'／3'); } B.n=n; saveID(); }
  hpBfBand(B,n);
  if(!HP_BF_BOOT){ HP_BF_BOOT=true; if(B.go){ hpFlGoto(n); try{ hpLog('この端末の郵便受けを借りる流れ：開いたので郵便受けのタブへ（'+n+'／3）'); }catch(e){} } }
  try{ let a=''; try{ a=hpXmAcct(); }catch(e){} const I=(typeof HP_XM_INFO!=='undefined')?HP_XM_INFO:null; if(a&&B.go&&n===2&&typeof HP_XM_RD!=='undefined'&&!HP_XM_RD&&(!I||I.acct!==a)&&typeof hpXmRead==='function') hpXmRead(a); }catch(e){}
  let seenLs=false; try{ seenLs=localStorage.getItem('p2p_bf_seen')==='1'; }catch(e){}
  if(!B.seen&&!seenLs&&!document.getElementById('bf-dlg')){ B.seen=1; saveID(); try{ localStorage.setItem('p2p_bf_seen','1'); }catch(e){} hpBfDlg(); }
  return 'n'+n; }catch(e){ return ''; } }

function hpBfOffSet(v){ try{ const B=hpBfGet(); if(!B) return false; if(v){ B.off=1; B.go=0; } else { delete B.off; } saveID(); hpLog(v?'この端末の郵便受けを借りる流れ：しまった（間借りのまま使う）':'この端末の郵便受けを借りる流れ：出し直した'); try{ hpFlClose('bf-dlg'); }catch(e){} try{ hpBfTick(); }catch(e){} try{ hpStTick(); }catch(e){} return true; }catch(e){ return false; } }
function hpBfLaterBtn(c){ try{ if(!c||!c.querySelector||c.querySelector('#bf-later')) return null; const r=hpFlEl('div','row'); r.id='bf-later'; r.style.cssText='margin-top:14px;justify-content:flex-start'; r.appendChild(hpFlBtn('btn_bf_later',()=>{ hpBfOffSet(1); try{ hpToast(T('bf_later_done'),5000); }catch(e){} })); c.appendChild(r); return r; }catch(e){ return null; } }
function hpBfDrawOff(c){ const L=(typeof curLang==='function')?curLang():'', key=['bfoff',L].join('|'); if(c.getAttribute('data-k')===key) return true; c.setAttribute('data-k',key); c.textContent='';
  c.appendChild(hpFlEl('h2','',T('bf_h'))); hpBfLodge(c); const d=hpFlEl('div','note',T('bf_off_nt')); d.style.cssText='white-space:pre-line;line-height:1.5;margin-top:6px'; c.appendChild(d);
  const r=hpFlEl('div','row'); r.style.cssText='margin-top:8px;justify-content:flex-start'; r.appendChild(hpFlBtn('btn_bf_resume',()=>{ hpBfOffSet(0); })); c.appendChild(r); return true; }
function hpBfDraw(c,a,s){ if(c&&typeof HP_BF_ALLOW!=='undefined'&&!HP_BF_ALLOW) return hpBfDrawClosed(c);   const B=hpBfGet(); if(!B||!c) return false; if(B.off) return hpBfDrawOff(c); const r=hpBfDraw0(c,a,s); hpBfLaterBtn(c); return r; }
function hpBfDraw0(c,a,s){ const B=hpBfGet(); if(!B||!c) return false; const n=hpBfStep(), L=(typeof curLang==='function')?curLang():'';
  const nt=(t,css)=>{ const d=hpFlEl('div','note',t); d.style.cssText='white-space:pre-line'+(css?';'+css:''); c.appendChild(d); return d; }, body=t=>{ const d=hpFlEl('div','',t); d.style.cssText='margin:8px 0;line-height:1.5'; c.appendChild(d); return d; }, again=()=>{ try{ hpStTick(); }catch(e){} };
  if(!B.go){ const key=['bf0',n,L].join('|'); if(c.getAttribute('data-k')===key) return true; c.setAttribute('data-k',key); c.textContent='';
    c.appendChild(hpFlEl('h2','',T('bf_h'))); body(T('bf_lead')); hpBfLodge(c);
    for(let i=1;i<=3;i++){ const d=hpFlEl('div','',(i<n?'✓':i===n?'▶':'・')+' '+i+'. '+T(HP_BF_S[i-1])); d.style.cssText='margin:6px 0;line-height:1.5'+(i===n?';font-weight:600':i<n?';color:var(--teal)':''); c.appendChild(d); }
    nt(T('bf_note')); const r=hpFlEl('div','row'); r.style.marginTop='8px'; r.appendChild(hpFlBtn('btn_fl_go',()=>{ hpBfGo(n); again(); },true)); c.appendChild(r); return true; }
  if(n===1){ const slow=HP_BF_PICK_AT>0&&Date.now()-HP_BF_PICK_AT>=HP_FL_SLOW, key=['bf1',slow?1:0,L].join('|'); if(c.getAttribute('data-k')===key) return true; c.setAttribute('data-k',key); c.textContent='';
    c.appendChild(hpFlEl('h2','',T('bf_1_h'))); hpBfLodge(c); body(T('fl_2_body'));
    const r1=hpFlEl('div','row'); r1.appendChild(hpFlBtn('btn_bx_sign',()=>{ HP_BF_PICK_AT=Date.now(); try{ hpXmPick(); }catch(e){} again(); },true)); c.appendChild(r1);
    nt(T(hpFlPhone()?'fl_2_phone':'fl_2_pc')); if(slow) nt(T('fl_2_slow'),'color:var(--amber)');
    const r2=hpFlEl('div','row'); r2.style.marginTop='8px'; r2.appendChild(hpFlBtn('btn_fl_more',()=>{ hpFlMore('2'); })); c.appendChild(r2); return true; }
  if(n===2){ const key=['bf2',hpTuPayKey(a,B,s),L].join('|'); if(c.getAttribute('data-k')===key){ hpTuPayDots(); return true; } c.setAttribute('data-k',key); c.textContent='';
    c.appendChild(hpFlEl('h2','',T('bf_2_h'))); hpTuPayUi(c,a,s,B,{save:()=>{ try{ saveID(); }catch(e){} },again:again,more:'3'}); return true; }
  return hpFlDraw4(c,a,s,B); }

function hpTuPayKey(a,P,s){ const pay=(P&&(P.pay==='friend'||P.pay==='self'))?P.pay:'', amt=hpFlEvr(P&&P.evr), W=(pay==='friend'&&P.want&&P.want.xah>=0&&P.want.evr>=0)?P.want:hpFlWant(amt), Q=pay==='friend'?hpFlRqNow(a,W,null):null, late=pay==='friend'&&Number(P&&P.payAt)>0&&Date.now()-P.payAt>=HP_FL_WAIT;
  return [pay,amt,W.xah,W.evr,W.days,late?1:0,hpFlDirect(a).k,hpFlTsKey(a),Q?Q.url:'',s?[s.n,s.why,s.xah,s.evr,s.need].join('/'):''].join('|'); }
function hpTuPayDots(){ try{ HP_FL_DOT=(HP_FL_DOT+1)%4; const w=document.getElementById('tu-wait'); if(w) w.textContent='▓'.repeat(HP_FL_DOT+1)+'░'.repeat(3-HP_FL_DOT)+'　'+(w.getAttribute('data-t')||''); }catch(e){} }
function hpTuPayUi(c,a,s,P,o){ o=o||{}; const nm=T('tu_who'), save=()=>{ try{ if(o.save) o.save(); }catch(e){} }, again=()=>{ try{ if(o.again) o.again(); else hpStTick(); }catch(e){} }, num=v=>(typeof hpNum==='function')?hpNum(v,6):String(v);
  const nt=(t,css)=>{ const d=hpFlEl('div','note',t); d.style.cssText='white-space:pre-line'+(css?';'+css:''); c.appendChild(d); return d; }, body=t=>{ const d=hpFlEl('div','',t); d.style.cssText='margin:8px 0;line-height:1.5'; c.appendChild(d); return d; };
  const pay=(P.pay==='friend'||P.pay==='self')?P.pay:'', amt=hpFlEvr(P.evr), W=(pay==='friend'&&P.want&&P.want.xah>=0&&P.want.evr>=0)?P.want:hpFlWant(amt), DI=hpFlDirect(a), Q=pay==='friend'?hpFlRqNow(a,W,null):null, late=pay==='friend'&&Number(P.payAt)>0&&Date.now()-P.payAt>=HP_FL_WAIT;
  const low=!!(s&&s.why==='lowevr'), have=low?(Number(s.evr)||0):0;
  const st=(s&&s.why==='read')?T('bx_3_read'):(s&&s.why==='noact')?T('fl_3_noact'):(s&&s.why==='lowxah')?T('fl_3_st_lowxah'):low?T('fl_3_st_lowevr'):(s&&s.n>=4)?TF('bx_3_ok',{xah:num(s.xah),evr:num(s.evr)}):T('fl_3_noevr');
  const set=v=>()=>{ P.pay=v; P.payAt=v?Date.now():0; P.want=v==='friend'?hpFlWant(Math.min(hpFlEvr(P.evr),HP_FL_FRIEND_MAX)):null; if(P.want){ try{ hpLog('EVR を用意する：家賃の山 '+P.want.n+' 件中 '+P.want.k+' 件、中央値 '+P.want.p+' EVR → 頼む量 EVR '+P.want.evr+'（約 '+P.want.days+' 日ぶん）'); }catch(_){} } save(); again(); };
  if(!pay){
    if(!o.fixed){ const pr=hpFlEl('div','row'); pr.style.cssText='margin-top:6px;align-items:center;flex-wrap:wrap'; const lb=hpFlEl('span','',T('fl_3_amt')); lb.style.cssText='font-size:13px;color:var(--dim)'; pr.appendChild(lb);
      const pick=v=>{ P.evr=hpFlEvr(v); save(); again(); };
      for(const v of HP_FL_EVR_OPT){ const b=hpFlEl('button','b'+(v===amt?' pri':''),'EVR '+v); b.type='button'; b.addEventListener('click',()=>{ pick(v); }); b.style.cssText='padding:6px 12px;font-size:13px'; pr.appendChild(b); }
      const ip=hpFlEl('input'); ip.type='number'; ip.id='tu-evr-in'; ip.min='0.1'; ip.max=String(HP_FL_CAP_EVR); ip.step='0.1'; ip.inputMode='decimal'; ip.value=String(amt); ip.style.cssText='width:5.5em'; ip.addEventListener('change',()=>{ pick(ip.value); }); pr.appendChild(ip); c.appendChild(pr); }
    body(TF('tu_ask',{evr:amt})); { const hv=hpTuHave(a,amt); if(hv){ const d=nt(hv.t,'line-height:1.6;color:'+(hv.ok?'var(--teal)':'var(--amber)')); d.id='tu-have'; } else if(low) nt(TF('fl_3_low',{have:have,evr:amt})); }   if(W.p>0){ nt(TF('fl_3_basis',{evr:W.evr,p:W.p,d:W.days})); if(Number(W.days)<HP_FL_SHORT) nt(TF('fl_3_short',{d:W.days}),'color:var(--amber)'); }
    const w=hpFlEl('div','',TF('fl_3_ledger',{name:nm})); w.style.cssText='margin:10px 0;padding:8px 10px;border-left:3px solid var(--amber);background:#2a2112;font-size:13px;line-height:1.5'; c.appendChild(w);
    const r=hpFlEl('div','row'); r.style.cssText='margin-top:8px;flex-wrap:wrap'; if(amt>HP_FL_FRIEND_MAX) nt(TF('fl_3_long',{max:HP_FL_FRIEND_MAX})); else r.appendChild(hpFlBtn('btn_tu_friend',set('friend'),true)); r.appendChild(hpFlBtn('btn_tu_self',set('self'))); if(o.more) r.appendChild(hpFlBtn('btn_fl_more',()=>{ hpFlMore(o.more); })); c.appendChild(r); return 'pick'; }
  hpFlDrawSteps(c,a,null,pay,W,DI,nm,Q,s,body,nt,null);
  const ad=hpFlEl('div','mono',a); ad.style.cssText='margin-top:6px;word-break:break-all'; c.appendChild(ad);
  if(!Q){ const r1=hpFlEl('div','row'); r1.style.marginTop='6px'; r1.appendChild(hpFlBtn('btn_fl_3_copy',()=>{ hpFlCopy(a,'fl_3_copied'); })); c.appendChild(r1); }
  const wt=hpFlEl('div',''); wt.id='tu-wait'; wt.setAttribute('data-t',Q?TF('fl_3_wait',{name:nm}):T('fl_3_wait_self')); wt.style.cssText='margin-top:10px;color:var(--teal)'; c.appendChild(wt); hpTuPayDots();
  const se=nt(st); se.id='tu-st';
  if(late&&Q) nt(TF('fl_3_xq_late',{name:nm}),'color:var(--amber)');
  const r2=hpFlEl('div','row'); r2.style.cssText='margin-top:8px;flex-wrap:wrap'; r2.appendChild(hpFlBtn('btn_bx_reread',()=>{ try{ if(!HP_XM_RD) hpXmRead(a); }catch(e){} })); r2.appendChild(hpFlBtn('btn_fl_3_back',set(''))); if(o.more) r2.appendChild(hpFlBtn('btn_fl_more',()=>{ hpFlMore(o.more); })); c.appendChild(r2); return pay; }

let HP_HS_UP_RUN=null;
function hpHsUpRows(){ try{ const H=(typeof HP_HOSTS!=='undefined'&&HP_HOSTS&&Array.isArray(HP_HOSTS.hosts))?HP_HOSTS.hosts:[]; const a=[]; for(const tr of document.querySelectorAll('#hs-list tr[data-addr]')){ const h=H.find(x=>x.addr===tr.dataset.addr); if(h) a.push(h); } return a; }catch(e){ return []; } }
function hpHsUpNeed(rows){ return (rows||[]).filter(h=>h&&h.aid&&!hpUpFresh(HP_UP[h.addr])&&!(HP_UP[h.addr]&&HP_UP[h.addr].st==='busy')); }
function hpHsUpCell(h){ if(!h||!h.aid) return '—'; const x=HP_UP[h.addr]; if(!x) return '—'; if(x.st==='busy') return '…'+(x.total?Math.round(x.done/x.total*100)+(typeof hpPctS==='function'?hpPctS():'％'):''); if(x.st!=='ok') return T('hs_up_no'); return (Number(x.pct)||0).toFixed(1)+(typeof hpPctS==='function'?hpPctS():'％'); }
function hpHsUpVal(h){ const x=h&&HP_UP[h.addr]; return (x&&x.st==='ok')?Number(x.pct)||0:null; }
function hpHsUpPut(addr){ try{ if(!addr) return false; const tr=document.querySelector('#hs-list tr[data-addr="'+addr+'"]'); const td=tr&&tr.querySelector('td[data-up]'); if(!td) return false; const h=HP_HOSTS.hosts.find(x=>x.addr===addr); td.textContent=hpHsUpCell(h); const x=HP_UP[addr]; td.title=(x&&x.st==='ok')?hpUpText(h):''; return true; }catch(e){ return false; } }
const HP_HS_UP_SEC=35;
function hpHsUpEta(n){ const s=Math.max(1,Number(n)||0)*HP_HS_UP_SEC; return s<90?TF('hs_t_s',{n:s}):TF('hs_t_m',{n:Math.round(s/60)}); }
function hpHsUpBtn(){ try{ const b=document.getElementById('btn-hs-up'); if(!b) return false; if(HP_HS_UP_RUN){ b.disabled=true; return true; } const n=hpHsUpNeed(hpHsUpRows()).length; b.disabled=!n; b.textContent=n?TF('btn_hs_up',{n:n,t:hpHsUpEta(n)}):T('hs_up_done'); return true; }catch(e){ return false; } }
function hpHsUpCol(){ const box=document.getElementById('hs-list'); if(!box) return false; const tb=box.querySelector('table.hstb');
  let row=document.getElementById('hs-up-row'); if(!row&&box.parentNode){ row=document.createElement('div'); row.id='hs-up-row'; row.style.cssText='margin-top:6px'; const b=document.createElement('button'); b.className='b'; b.id='btn-hs-up'; b.style.cssText='font-size:13px'; b.addEventListener('click',()=>{ hpHsUpRun(); }); row.appendChild(b); const nt=document.createElement('div'); nt.className='hint'; nt.style.cssText='font-size:12px;opacity:.75;margin-top:3px'; nt.textContent=T('hs_up_nt'); row.appendChild(nt); box.parentNode.insertBefore(row,box); }
  if(row) row.style.display=tb?'':'none'; if(!tb) return false;
  const hd=tb.rows[0]; if(hd&&!hd.querySelector('th[data-up]')){ const ths=hd.querySelectorAll('th'); const th=document.createElement('th'); th.dataset.up='1'; const col=(typeof HP_HS_COL!=='undefined')?HP_HS_COL:null; th.textContent=T('hs_h_up')+(col&&col.k==='hs_h_up'?(col.dir>0?' ▲':' ▼'):''); th.style.cursor='pointer'; th.style.whiteSpace='nowrap'; th.title=T('hs_h_tip'); th.addEventListener('click',()=>{ hpHsColSet('hs_h_up'); }); hd.insertBefore(th,ths[1]||null); }
  try{ const H=HP_HOSTS.hosts; for(const tr of tb.querySelectorAll('tr[data-addr]')){ const td=tr.cells[0]; if(!td||td.dataset.st) continue; const h=H.find(x=>x.addr===tr.dataset.addr); if(!h) continue; td.dataset.st='1'; td.textContent=h.active?'●':'✕'; td.style.textAlign='center'; } }catch(e){}
  for(const tr of tb.querySelectorAll('tr[data-addr]')){ if(tr.querySelector('td[data-up]')) continue; const td=document.createElement('td'); td.dataset.up='1'; td.style.whiteSpace='nowrap'; tr.insertBefore(td,tr.cells[1]||null); hpHsUpPut(tr.dataset.addr); }
  try{ const H=HP_HOSTS.hosts; for(const row of [hd].concat(Array.from(tb.querySelectorAll('tr[data-addr]')))){ if(!row||row.dataset.ord) continue; const c=Array.from(row.cells||[]); if(c.length<6) continue; row.dataset.ord='1'; row.insertBefore(c[4],c[1]); row.insertBefore(c[5],c[1]);
      if(row.dataset.addr){ const h=H.find(x=>x.addr===row.dataset.addr); if(h&&c[2]){ c[2].textContent=h.cc||'—'; try{ if(h.cc) c[2].title=h.cc+' '+hpCcName(h.cc); }catch(e){} } } } }catch(e){}
  hpHsUpBtn(); return true; }
async function hpHsUpRun(){ if(HP_HS_UP_RUN) return HP_HS_UP_RUN; const list=hpHsUpNeed(hpHsUpRows()); if(!list.length){ hpHsUpBtn(); return 0; }
  const b=document.getElementById('btn-hs-up');
  const t0=Date.now(); let k=0; const say=()=>{ try{ const bb=document.getElementById('btn-hs-up'); if(bb&&HP_HS_UP_RUN){ bb.disabled=true; bb.textContent=TF('hs_up_busy',{k:k,n:list.length,s:Math.round((Date.now()-t0)/1000)}); } }catch(e){} }; const tk=(typeof setInterval==='function')?setInterval(say,1000):null;
  HP_HS_UP_RUN=(async()=>{ for(const h of list){ k++; say(); if(hpUpFresh(HP_UP[h.addr])||(HP_UP[h.addr]&&HP_UP[h.addr].st==='busy')) continue;
      HP_UP[h.addr]={st:'busy',k:1,n:1,done:0,total:0}; hpHsUpPut(h.addr);
      try{ HP_UP[h.addr]=await hpUpHost(h,(d,t)=>{ const u=HP_UP[h.addr]; if(u&&u.st==='busy'){ u.done=d; u.total=t; } hpHsUpPut(h.addr); }); }
      catch(e){ HP_UP[h.addr]={st:'err',at:Date.now(),why:String((e&&e.message)||e)}; try{ log(TL('lg_up_fail',{dom:hpUpName(h),why:HP_UP[h.addr].why})); }catch(_){} }
      hpHsUpPut(h.addr); try{ if(typeof HP_HS_PICK!=='undefined'&&HP_HS_PICK===h.addr) hpUpPut(h); }catch(e){} }
    return k; })();
  say(); let n=0; try{ n=await HP_HS_UP_RUN; } finally{ HP_HS_UP_RUN=null; if(tk) clearInterval(tk); }
  try{ const O=hpHsOpt(); if((O.col&&O.col.k==='hs_h_up')||(!(O.col&&O.col.k)&&O.sort==='up')) await hpHsDraw(); }catch(e){}
  hpHsUpBtn(); return n; }
try{ if(typeof hpHsColVal==='function'){ const f=hpHsColVal; hpHsColVal=function(h,k){ return k==='hs_h_up'?hpHsUpVal(h):f.apply(this,arguments); }; } }catch(e){}
try{ if(typeof hpHsView==='function'){ const f=hpHsView; hpHsView=function(hosts,opt){ const a=f.apply(this,arguments); try{ if(opt&&opt.sort==='up'&&!(opt.col&&opt.col.k)){ const v=h=>{ const x=hpHsUpVal(h); return x===null?-1:x; }; a.sort((x,y)=>v(y)-v(x)); } }catch(e){} return a; }; } }catch(e){}
try{ if(typeof hpHsDraw==='function'){ const f=hpHsDraw; hpHsDraw=async function(){ const r=await f.apply(this,arguments); try{ hpHsUpCol(); }catch(e){} return r; }; } }catch(e){}
try{ if(typeof hpUpPut==='function'){ const f=hpUpPut; hpUpPut=function(h){ const r=f.apply(this,arguments); try{ hpHsUpPut(h&&h.addr); }catch(e){} return r; }; } }catch(e){}

let HP_AD_BUSY=false, HP_AD_WAIT=45000, HP_AD_CONN=20000;
function hpAdCheck(url){
  try{ const u=String(url||'').trim();
    if(!/^wss:\/\/[a-z0-9.-]+:[0-9]{2,5}$/i.test(u)||(typeof hpC4PostOk==='function'&&!hpC4PostOk(u))) return 'url';
    if(u===String((typeof hpPostUrl==='function'&&hpPostUrl())||'')) return 'cur';
    return '';   }catch(e){ return 'other'; } }
async function hpAdProbe(url){
  let c=null; const out=[];
  try{ const kp=await hpDevKey(); c=await HotPocket.createClient([url], kp); if(typeof hpGateWrap==='function') hpGateWrap(c,url,kp,'前に借りた郵便受けを使う前の確かめ');
    c.on(HotPocket.events.contractOutput, r=>{ for(const x of ((r&&r.outputs)||[])){ try{ out.push(JSON.parse(hpText(x))); }catch(e){} } });
    let up=false; try{ up=await hpWithin(c.connect(),HP_AD_CONN,'前に借りた郵便受けへのつなぎ'); }catch(e){ up=false; }
    if(!up) return {why:'down'};
    const cm=await hpWithin(hpClaimMsg(),HP_SEND_WAIT,'名乗りの中身');
    await hpWithin(c.submitContractInput(JSON.stringify(cm)),HP_SEND_WAIT,'前に借りた郵便受けへの名乗り');
    const t0=Date.now();
    while(Date.now()-t0<HP_AD_WAIT){ const o=out.shift(); if(!o){ await sleep(250); continue; }
      if(o.ok==='claim') return {ok:1, pv:String(o.pv||'')};
      if(o.err) return {why:String(o.err)}; }
    return {why:'noreply'};
  }catch(e){ return {why:'other', e:String((e&&e.message)||e).slice(0,80)}; }
  finally{ if(c){ try{ await c.close(); }catch(e){} } } }

async function hpAxFit(url,movers){ let c=null; const out=[];
  try{ const kp=await hpDevKey(); c=await HotPocket.createClient([url], kp); if(typeof hpGateWrap==='function') hpGateWrap(c,url,kp,'移す前の確かめ');
    c.on(HotPocket.events.contractOutput, r=>{ for(const x of ((r&&r.outputs)||[])){ try{ out.push(JSON.parse(hpText(x))); }catch(e){} } });
    let up=false; try{ up=await hpWithin(c.connect(),HP_AD_CONN,'移す先の郵便受けへのつなぎ'); }catch(e){ up=false; }
    if(!up) return {why:'down'};
    const ask=async(o,name)=>{ await hpWithin(c.submitContractInput(JSON.stringify(o)),HP_SEND_WAIT,'移す先の郵便受けへの送り（'+name+'）');
      const t0=Date.now(); while(Date.now()-t0<HP_AD_WAIT){ const i=out.findIndex(x=>x&&(x.ok===name||x.err)); if(i>=0) return out.splice(i,1)[0]; await sleep(250); }
      return {err:'noreply'}; };
    const cm=await hpWithin(hpClaimMsg(),HP_SEND_WAIT,'名乗りの中身'), cr=await ask(cm,'claim'); if(cr.err) return {why:String(cr.err)};
    const g=await ask({op:'dget'},'dget'); if(g.err) return {why:String(g.err)};
    const here=new Set((Array.isArray(g.devs)?g.devs:[]).map(d=>String((d&&d.dev)||'')).filter(Boolean)), sibs=(typeof hpSibs==='function'?hpSibs():[]).filter(d=>d&&d.dev&&d.devSig), mv=new Set(movers||[]);
    let add=0; const skip=[];
    for(const d of sibs){ if(here.has(d.dev)) continue;
      const x=await ask({op:'adddev',dev:d.dev,devSig:d.devSig},'adddev');
      if(x.err==='too many devices') return {why:'full',reg:here.size,s:sibs.length+1};
      if(x.err){ if(mv.has(d.dev)) return {why:'mover',n:(typeof hpAxLabel==='function')?hpAxLabel(d):String(d.label||d.dev).slice(0,16),e:String(x.err)}; skip.push(String(x.err)); continue; }
      here.add(d.dev); add++; }
    if(skip.length) hpLog('移す先の郵便受け（'+url+'）に、自分のほかの端末 '+skip.length+' 台を足せなかった（'+skip.join('・')+'）。一緒に移る端末ではないので続ける');
    return {ok:1,pv:String(cr.pv||''),reg:here.size,add:add}; }
  catch(e){ return {why:'other',e:String((e&&e.message)||e).slice(0,80)}; }
  finally{ if(c){ try{ await c.close(); }catch(e){} } } }
function hpAdSwitch(url){
  const old=String(hpPostUrl()||''), acct=(typeof hpLeaseAcct==='function')?hpLeaseAcct():'';
  if(typeof hpBoxSubBefore==='function'&&!hpBoxSubBefore(url)) throw new Error('前の郵便受けを控えられない');
  try{ stopBg(); }catch(e){} try{ localStorage.setItem('p2p_post',url); }catch(e){}
  ID.lease=acct?{acct:acct,at:Date.now()}:{at:Date.now()}; ID.adopt={url:url,from:old,at:Date.now()}; saveID();
  hpLog('前に借りた郵便受け（'+url+'）を、この端末の郵便受けにした。つなぎ直して、自分のほかの端末を足し、住所録に新しい場所を知らせる（前の郵便受け '+old+' は期限まで見回る）');
  setTimeout(()=>{ try{ startBg(); }catch(e){} },1500);
  return true; }
async function hpAdUse(url){
  if(HP_AD_BUSY) return {why:'busy'}; let u=String(url||'').trim().replace(/\/+$/,''); if(/^[a-z0-9.-]+:[0-9]{2,5}$/i.test(u)) u='wss://'+u;
  if(!((typeof hpBfOn==='function'&&hpBfOn())||(typeof hpObOwn==='function'&&hpObOwn()))) return {why:'notsub'};
  const w=hpAdCheck(u); if(w) return {why:w};
  HP_AD_BUSY=true; let lock=false;
  try{ for(let i=0;i<120&&((typeof HP_BX_BUSY!=='undefined'&&HP_BX_BUSY)||(typeof HP_FB_BUSY!=='undefined'&&HP_FB_BUSY));i++) await sleep(250);
    if(typeof HP_BX_BUSY!=='undefined'){ HP_BX_BUSY=true; lock=true; }
    hpLog('前に借りた郵便受け（'+u+'）を確かめる（この端末の鍵でつないで名乗り、自分の端末がみな登録できるかを見る）');
    const r=await hpAxFit(u,[]);
    if(!r.ok){ hpLog('前に借りた郵便受け（'+u+'）は使えない（'+r.why+(r.e?' '+r.e:'')+'）。何も替えていない'); return r; }
    hpLog('前に借りた郵便受け（'+u+'）に名乗れた（本体の版 '+(r.pv||'?')+'・登録 '+r.reg+' 台'+(r.add?'・足した '+r.add+' 台':'')+'）');
    if(lock){ HP_BX_BUSY=false; lock=false; }
    hpAdSwitch(u); return {ok:1, pv:r.pv};
  }catch(e){ return {why:'other', e:String((e&&e.message)||e).slice(0,80)}; }
  finally{ if(lock) HP_BX_BUSY=false; HP_AD_BUSY=false; } }
function hpAdWhy(r){ const w=String((r&&r.why)||'');
  if(w==='url') return T('ad_e_url'); if(w==='cur') return T('ad_e_cur'); if(w.indexOf('sib:')===0) return TF('ad_e_sib',{n:w.slice(4)||'?'});
  if(w==='owner exists') return T('ad_e_owner'); if(w==='removed') return T('ad_e_removed'); if(w==='too many devices') return T('ad_e_full');
  if(w==='bad sig'||w==='bad claim') return T('ad_e_sig'); if(w==='killed') return T('ad_e_killed'); if(w==='down') return T('ad_e_down'); if(w==='noreply') return T('ad_e_noreply');
  if(w==='busy') return T('ad_checking'); if(w==='notsub') return T('ad_e_notsub');
  if(w==='full') return TF('ax_e_full',{n:Number(r.reg)||0,s:Number(r.s)||0}); if(w==='mover') return TF('ax_e_mover',{n:r.n||'?',e:r.e||'?'});
  if(w==='job') return T('ax_e_job'); if(w==='short') return TF('ax_r_short',{d:(typeof HP_AX_MIN!=='undefined')?HP_AX_MIN:7}); if(w==='over') return T('ax_r_over'); if(w==='noexp') return T('ax_r_noexp'); if(w==='notmain') return T('mv2_nomain');
  return TF('ad_e_other',{e:(r&&r.e)||w||'?'}); }
async function hpAdGo(url,st,row){
  st.style.color=''; st.textContent=T('ad_checking'); let r=null;
  try{ r=await hpAdUse(url); }catch(e){ r={why:'other',e:String((e&&e.message)||e)}; }
  if(r&&r.ok){ try{ if(row&&typeof hpAxKeep==='function') hpAxKeep(row); }catch(e){} st.style.color='var(--teal)'; st.textContent=TF('ad_ok',{h:String(url).trim().replace(/^wss:\/\//,'')})+(((typeof hpLeaseAcct==='function')&&hpLeaseAcct())?'':'\n'+T('ad_lease_nt')); }
  else { st.style.color='var(--amber)'; st.textContent=hpAdWhy(r); }
  return r; }
function hpAdUi(c){

  try{ if(!c||!c.querySelector) return false; const on=typeof hpBfOn==='function'&&hpBfOn(); let row=c.querySelector('#bf-adopt');
    if(!on){ if(row&&row.parentNode) row.parentNode.removeChild(row); return false; }
    if(row) return true;
    row=hpFlEl('div',''); row.id='bf-adopt'; row.style.cssText='margin-top:8px';
    const f=hpFlEl('div',''); f.id='bf-adopt-form'; f.style.cssText='display:none;margin-top:8px';
    const r1=hpFlEl('div','row'); r1.style.cssText='justify-content:flex-start'; const ob=hpFlBtn('btn_ad_open',()=>{ const show=f.style.display==='none'; f.style.display=show?'':'none'; if(show&&typeof hpAxOpen==='function') hpAxOpen(false); }); ob.id='btn-ad-open'; r1.appendChild(ob); row.appendChild(r1);
    const nt=hpFlEl('div','note',T('ad_note')); nt.style.cssText='white-space:pre-line;line-height:1.5'; f.appendChild(nt);
    const ax=hpFlEl('div',''); ax.id='ax-box'; ax.style.cssText='margin-top:8px'; f.appendChild(ax);
    const st=hpFlEl('div','note',''); st.id='bf-adopt-st'; st.style.cssText='margin-top:6px;white-space:pre-line;line-height:1.5'; f.appendChild(st);
    const axn=hpFlEl('div',''); axn.id='ax-nt'; f.appendChild(axn);
    const man=hpFlEl('div',''); man.id='bf-adopt-man'; man.style.cssText='display:none;margin-top:8px';
    const mn=hpFlEl('div','note',T('ad_man_nt')); mn.style.cssText='white-space:pre-line;line-height:1.5'; man.appendChild(mn);
    const inp=document.createElement('input'); inp.id='bf-adopt-url'; inp.type='text'; inp.placeholder=T('ad_ph'); inp.setAttribute('autocomplete','off'); inp.setAttribute('autocapitalize','off'); inp.setAttribute('spellcheck','false'); inp.style.cssText='width:100%;margin-top:6px'; man.appendChild(inp);
    const r3=hpFlEl('div','row'); r3.style.cssText='margin-top:6px;justify-content:flex-start';
    const r2=hpFlEl('div','row'); r2.style.cssText='margin-top:8px;justify-content:flex-start;flex-wrap:wrap;gap:8px';
    let ub=null, cb=null;
    ub=hpFlBtn('btn_ad_use',async()=>{ ub.disabled=true; cb.disabled=true; try{ await hpAdGo(inp.value,st,null); } finally{ ub.disabled=false; cb.disabled=false; } },true); ub.id='btn-ad-use'; r3.appendChild(ub); man.appendChild(r3);
    const rb=hpFlBtn('btn_ax_reload',()=>{ if(typeof hpAxOpen==='function') hpAxOpen(true); }); rb.id='btn-ax-reload';
    const mb=hpFlBtn('btn_ax_man',()=>{ man.style.display=(man.style.display==='none')?'':'none'; }); mb.id='btn-ax-man';
    cb=hpFlBtn('btn_ad_cancel',()=>{ f.style.display='none'; man.style.display='none'; st.textContent=''; }); cb.id='btn-ad-cancel';
    r2.appendChild(rb); r2.appendChild(mb); r2.appendChild(cb); f.appendChild(r2); f.appendChild(man); row.appendChild(f);
    c.appendChild(row); try{ if(typeof hpAxBind==='function') hpAxBind(ax,st,axn); }catch(e){} return true; }catch(e){ return false; } }
hpBfDrawClosed=(function(f){ return function(c){ const r=f.apply(this,arguments); try{ hpAdUi(c); }catch(e){} return r; }; })(hpBfDrawClosed);

const HP_AX_MIN=7, HP_AX_WARN=14, HP_AX_PAR=2, HP_AX_CONN=15000, HP_AX_FRESH=600e3, HP_AX_UPLOW=97, HP_AX_REPLOW=200;
let HP_AX_ASK=25000, HP_AX_VER=12000;
const HP_AX_OLD_A=Date.UTC(2026,9,4,9,48), HP_AX_OLD_B=Date.UTC(2026,9,12,3,30);
let HP_AX=null, HP_AX_RUN=null, HP_AX_CK=false, HP_AX_PB={}, HP_AX_EL=null, HP_AX_ST=null, HP_AX_NT=null, HP_AX_GO='', HP_AX_TT=null, HP_AX_OPEN=false;
function hpAxUrlOk(u){ return /^wss:\/\/[a-z0-9.-]+:[0-9]{2,5}$/i.test(String(u||''))&&(typeof hpC4PostOk!=='function'||hpC4PostOk(String(u))); }
function hpAxHost(u){ return ((/^wss:\/\/([^:\/]+)/i.exec(String(u||''))||[])[1]||'').toLowerCase(); }
function hpAxAid(a){ try{ a=String(a||''); if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)) return ''; let n=0n; for(const ch of a){ const i=HP_B58.indexOf(ch); if(i<0) return ''; n=n*58n+BigInt(i); } let h=n.toString(16); while(h.length<50) h='0'+h; return h.length===50?h.slice(2,42).toUpperCase():''; }catch(e){ return ''; } }
function hpAxDate(ms){ const d=new Date(ms), p=n=>String(n).padStart(2,'0'), s=(typeof hpDateIntl==='function')?hpDateIntl(d.getTime(),'mdhm'):''; if(s) return s; return (d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes()); }
function hpAxAcct(a){ let n=''; try{ n=(typeof hpXmNameOf==='function')?hpXmNameOf(a):''; }catch(e){} return n?n+(typeof hpPar==='function'?hpPar(String(a).slice(0,6)+'…'):'（'+String(a).slice(0,6)+'…'+'）'):String(a).slice(0,8)+'…'; }
async function hpAxLedger(acct,C,onProg){
  const size=(C&&Number(C.size)>0)?Number(C.size):3600;
  return hpXahauSess(async q=>{
    const o=await q({command:'account_objects',account:acct,ledger_index:'validated'});
    const tob=((o&&o.account_objects)||[]).filter(hpIsLeaseTok), inf={}, okh={}, acq={}; let marker=null, pages=0, n=0;
    for(const t of tob) inf[String(t.index).toUpperCase()]={host:String(t.Issuer||''),buy:0,unit:0,hash:'',ext:{}};
    const ks=Object.keys(inf);
    if(ks.length){ do{ const x=await q(Object.assign({command:'account_tx',account:acct,limit:200},marker?{marker:marker}:{})); pages++;
        for(const e of ((x&&x.transactions)||[])){ n++; const tx=(e&&(e.tx||e.tx_json))||{}; if(((e&&e.meta&&e.meta.TransactionResult)||'')!=='tesSUCCESS') continue;
          const h=String(tx.hash||(e&&e.hash)||'').toUpperCase(), ty=hpHexStr(hpLgParam(tx,HP_LG_TYPE)), tk=String(tx.URITokenID||'').toUpperCase(), when=(Number(tx.date)+HP_LG_EPOCH)*1000;
          if(tx.TransactionType==='URITokenBuy'&&tx.Account===acct&&inf[tk]&&!inf[tk].buy){ inf[tk].buy=when; inf[tk].unit=hpLgAmt(tx.Amount); inf[tk].hash=h; }
          else if(tx.TransactionType==='Payment'&&tx.Account===acct&&ty==='evnExtendLease'){ const k=hpLgParam(tx,HP_LG_REF).toUpperCase(); if(inf[k]) inf[k].ext[h]=hpLgAmt(tx.Amount); }
          else if(tx.TransactionType==='Payment'&&tx.Account!==acct&&ty==='evnExtendSuccess'){ okh[hpLgParam(tx,HP_LG_REF).toUpperCase()]=hpLgMom(tx)||1; }
          else if(tx.TransactionType==='Payment'&&tx.Account!==acct&&ty==='evnAcquireSuccess'){ const ref=hpLgParam(tx,HP_LG_REF).toUpperCase(); if(ref&&!acq[ref]) acq[ref]=hpEvMemo0(tx).data; } }
        marker=(x&&x.marker)||null; try{ if(onProg) onProg(n); }catch(e){}
      } while(marker&&ks.some(k=>!inf[k].buy)&&pages<HP_LG_PAGES); }
    const hosts={};
    for(const k of ks){ const a=inf[k].host; if(!a||hosts[a]) continue; const H={dom:'',rep:null,aid:hpAxAid(a)}; hosts[a]=H;
      try{ const ai=await q({command:'account_info',account:a,ledger_index:'validated'}); H.dom=hpHexStr((ai&&ai.account_data&&ai.account_data.Domain)||'').toLowerCase().replace(/[^a-z0-9.-]/g,''); }catch(e){}
      try{ if(H.aid){ const key='45565203'+'0'.repeat(16)+H.aid, r=await q({command:'ledger_entry',hook_state:{account:HP_GOV,key:key,namespace_id:HP_EVN_NS},ledger_index:'validated'}), d=hpHostDecode(key,(r&&r.node&&r.node.HookStateData)||''); if(d&&d.rep!=null) H.rep=d.rep; } }catch(e){} }
    const toks=[];
    for(const k of ks){ const I=inf[k]; let paid=I.unit, mom=0; for(const h of Object.keys(I.ext)){ if(okh[h]){ paid+=I.ext[h]; if(okh[h]>mom) mom=okh[h]; } }
      const nm=(I.buy&&I.unit>0)?Math.round(paid/I.unit):0; let exp=0;
      if(nm>0) exp=I.buy+nm*size*1000; else if(mom>1&&C){ try{ exp=hpMomStart(mom,C); }catch(e){ exp=0; } }
      toks.push({tok:k,host:I.host,dom:(hosts[I.host]&&hosts[I.host].dom)||'',buy:I.buy,exp:exp,acq:I.hash?(acq[I.hash]||''):''}); }
    return {toks:toks,hosts:hosts,n:n}; },120000,30000); }
function hpAxKnown(acct,single){
  const out=[], add=u=>{ u=String(u||'').trim().replace(/\/+$/,''); if(hpAxUrlOk(u)&&out.indexOf(u)<0) out.push(u); };
  try{ const m=(ID.acctByUrl&&typeof ID.acctByUrl==='object'&&!Array.isArray(ID.acctByUrl))?ID.acctByUrl:{}, loose=u=>{ u=String(u||''); if(m[u]?m[u]===acct:single) add(u); };
    for(const u of Object.keys(m)) if(m[u]===acct) add(u);
    if(typeof hpLeaseAcct==='function'&&hpLeaseAcct()===acct) add(hpPostUrl()); else loose(hpPostUrl());
    try{ const o=(typeof hpOldGet==='function')?hpOldGet():null; if(o) loose(o.url); }catch(e){}
    try{ if(ID.link&&ID.link.postOld) loose(ID.link.postOld.url); if(ID.leaseOld) loose(ID.leaseOld.url); }catch(e){}
    for(const d of (typeof hpSibs==='function'?hpSibs():[])){ try{ loose(hpMcBoxOf(d.dev)); }catch(e){} }
    try{ const B=(typeof hpLbGet==='function')?hpLbGet():{}; for(const u of Object.keys(B)){ const x=B[u]; if(x&&(x.a===acct||(!x.a&&single))) add(u); } }catch(e){}   }catch(e){}
  return out; }
async function hpAxRows(acct,L,single){
  const toks=L.toks.map(t=>Object.assign({},t,{url:'',src:''})), taken=u=>toks.some(x=>x.url===u);
  let seeds=[]; try{ seeds=((typeof hpLsMs==='function')&&await hpLsMs(acct))||[]; }catch(e){ seeds=[]; }
  for(const t of toks){ if(!t.acq) continue; for(const sd of seeds){ try{ const u=hpEvUrl(hpEvInfo(await hpEvOpen(hpHexStr(t.acq),sd))); if(hpAxUrlOk(u)&&!taken(u)){ t.url=u; t.src='key'; break; } }catch(e){} } }
  try{ const lb=(ID.leaseByUrl&&typeof ID.leaseByUrl==='object')?ID.leaseByUrl:{}; for(const u of Object.keys(lb)){ const k=String(lb[u]||'').toUpperCase(), t=toks.find(x=>x.tok===k&&!x.url); if(t&&hpAxUrlOk(u)&&!taken(u)){ t.url=u; t.src='keep'; } } }catch(e){}
  try{ const B=(typeof hpLbGet==='function')?hpLbGet():{}; for(const u of Object.keys(B)){ const x=B[u]; if(!x||x.a!==acct||!x.t) continue; const t=toks.find(y=>y.tok===x.t&&!y.url); if(t&&hpAxUrlOk(u)&&!taken(u)){ t.url=u; t.src='book'; } } }catch(e){}
  const G={}; for(const t of toks){ if(t.url||!t.dom) continue; (G[t.dom]=G[t.dom]||{t:[],u:[]}).t.push(t); }
  for(const u of hpAxKnown(acct,single)){ if(taken(u)) continue; const g=G[hpAxHost(u)]; if(g&&g.u.indexOf(u)<0) g.u.push(u); }
  const rows=[], amb=new Set();
  for(const d of Object.keys(G)){ const g=G[d]; if(!g.u.length) continue;
    if(g.t.length===1&&g.u.length===1){ g.t[0].url=g.u[0]; g.t[0].src='dom'; continue; }
    const ex=g.t.map(t=>Number(t.exp)||0), mn=ex.every(x=>x>0)?Math.min(...ex):0;
    for(const u of g.u) rows.push({acct:acct,url:u,tok:'',host:g.t[0].host,dom:d,exp:mn,buy:0,amb:g.t.length,src:'amb'});
    for(let i=g.u.length;i<g.t.length;i++) rows.push({acct:acct,url:'',tok:'',host:g.t[0].host,dom:d,exp:0,buy:0,amb:g.t.length,src:''});
    for(const t of g.t) amb.add(t.tok); }
  for(const t of toks){ if(!amb.has(t.tok)) rows.push({acct:acct,url:t.url,tok:t.tok,host:t.host,dom:t.dom,exp:t.exp,buy:t.buy,amb:0,src:t.src}); }
  return rows; }
async function hpAxScan(){
  const accts=(typeof hpMfAccts==='function')?hpMfAccts():[];
  if(!accts.length){ HP_AX={st:'noacct',at:Date.now(),rows:[]}; hpAxDraw(); return HP_AX; }
  HP_AX={st:'busy',at:Date.now(),rows:[],n:0,accts:accts}; hpAxDraw();
  let C=null; try{ C=await hpMomCfg(); }catch(e){ C=null; }
  const rows=[], hosts={}; let cnt=0, err='', okN=0;
  for(const a of accts){ let L=null;
    try{ L=await hpAxLedger(a,C,n=>{ if(HP_AX&&HP_AX.st==='busy'){ HP_AX.n=n; hpAxTick(); } }); }catch(e){ err=String((e&&e.message)||e).slice(0,80); continue; }
    okN++; cnt+=L.toks.length; Object.assign(hosts,L.hosts); const ra=await hpAxRows(a,L,accts.length===1); for(const r of ra) rows.push(r); try{ if(typeof hpLbFromScan==='function') hpLbFromScan(a,L.toks,ra); }catch(e){}   }
  if(!okN){ HP_AX={st:'err',at:Date.now(),rows:[],why:err||'?'}; hpLog('借りている郵便受けを台帳から読めない（'+(err||'?')+'）'); hpAxDraw(); return HP_AX; }
  HP_AX={st:'ok',at:Date.now(),rows:rows,cnt:cnt,hosts:hosts,accts:accts,part:err};
  hpLog('借りている郵便受けを台帳から読んだ（札 '+cnt+' 枚・場所の分かるもの '+rows.filter(r=>r.url).length+'）');
  hpAxDraw(); hpAxCheck().catch(()=>{}); return HP_AX; }
function hpAxOpen(force){
  try{ if(HP_AX_RUN) return HP_AX_RUN; const X=HP_AX;
    if(!force&&X&&X.st==='ok'&&Date.now()-X.at<HP_AX_FRESH){ hpAxDraw(); hpAxCheck().catch(()=>{}); return Promise.resolve(X); }
    if(force) HP_AX_PB={};
    HP_AX_RUN=hpAxScan().catch(e=>{ HP_AX={st:'err',at:Date.now(),rows:[],why:String((e&&e.message)||e).slice(0,80)}; hpAxDraw(); return HP_AX; }).finally(()=>{ HP_AX_RUN=null; });
    return HP_AX_RUN; }catch(e){ return Promise.resolve(null); } }
function hpAxUsers(url){ const o={me:false,sibs:[]};
  try{ o.me=String((typeof hpPostUrl==='function'&&hpPostUrl())||'')===url;
    for(const d of (typeof hpSibs==='function'?hpSibs():[])){ if(!d||!d.devSig) continue; let b=''; try{ b=String((typeof hpMcBoxOf==='function'&&hpMcBoxOf(d.dev))||''); }catch(e){} if(b===url) o.sibs.push(d); } }catch(e){}
  return o; }
function hpAxLabel(d){
  try{ const dev=String((d&&d.dev)||''); let lb=String((d&&d.label)||''); try{ const rr=(typeof hpDevRows==='function')?hpDevRows():[], x=Array.isArray(rr)?rr.find(y=>y&&y.dev===dev):null; if(x&&x.label) lb=String(x.label); }catch(e){}
    if(!lb) return dev.slice(0,10)+'…'; if(/ · /.test(lb)) return (typeof hpDevName==='function')?hpDevName(lb):lb;
    let br=''; try{ br=(typeof hpBmBrowser==='function')?String(hpBmBrowser(false,dev)||''):''; }catch(e){} return br?TF('dv_name',{b:lb,o:br}):lb; }catch(e){ return String((d&&(d.label||d.dev))||'').slice(0,12); } }
function hpAxWhy0(r,now){
  if(!r.url) return 'unk'; const u=hpAxUsers(r.url); if(u.me) return 'cur';
  if(!(Number(r.exp)>0)) return 'noexp'; const lf=Number(r.exp)-(now||Date.now()); if(lf<=0) return 'over';   if(lf<HP_AX_MIN*864e5) return 'short'; return ''; }
function hpAxWhy(r,now){ const w=hpAxWhy0(r,now); if(w) return w; const p=HP_AX_PB[r.url]; if(p&&p.st==='down') return 'down'; const c=hpAxCap(r,p); return (c&&c.full)?'full':''; }
function hpAxOld3(r){ const b=Number(r&&r.buy)||0; return b>=HP_AX_OLD_A&&b<HP_AX_OLD_B; }
function hpAxCap(r,p){
  try{ if(!p||!Array.isArray(p.reg)) return null; const n=p.reg.length, l=(p.pv||p.upg==='new'||!hpAxOld3(r))?5:3, m=Math.max(0,l-n);
    const k=(typeof hpSibs==='function'?hpSibs():[]).filter(d=>d&&d.dev&&d.devSig&&p.reg.indexOf(d.dev)<0).length;
    return {n:n,l:l,m:m,k:k,full:k>m}; }catch(e){ return null; } }
function hpAxSort(rows,now){ const rank=r=>{ const w=hpAxWhy(r,now); return w===''?0:(w==='cur'||w.indexOf('sib:')===0)?1:w==='unk'?3:2; }, up=r=>{ const x=(r.host&&typeof HP_UP!=='undefined')?HP_UP[r.host]:null; return (x&&x.st==='ok')?Number(x.pct)||0:-1; };
  const ov=r=>(typeof hpAxUpg==='function'&&hpAxUpg(r)==='old')?1:0;
  const cop=(typeof hpOpOf==='function')?hpOpOf(String((typeof hpPostUrl==='function'&&hpPostUrl())||'')):'', so=r=>(cop&&r.url&&hpOpOf(r.url)===cop)?1:0;
  return rows.slice().sort((a,b)=>(rank(a)-rank(b))||(ov(a)-ov(b))||(so(a)-so(b))||((Number(b.exp)||0)-(Number(a.exp)||0))||(up(b)-up(a))||String(a.url||a.dom).localeCompare(String(b.url||b.dom))); }
async function hpAxProbe(url,o){
  let c=null; const t0=Date.now(), out=[];
  try{ const kp=await hpDevKey(); c=await HotPocket.createClient([url],kp); if(typeof hpGateWrap==='function') hpGateWrap(c,url,kp,'借りている郵便受けがつながるか');
    try{ c.on(HotPocket.events.contractOutput,r=>{ for(const x of ((r&&r.outputs)||[])){ try{ out.push(JSON.parse(hpText(x))); }catch(e){} } }); }catch(e){}
    let up=false; try{ up=await hpWithin(c.connect(),HP_AX_CONN,'借りている郵便受けへのつなぎ'); }catch(e){ up=false; }
    if(!up) return {st:'down'};
    const res={st:'ok',ms:Date.now()-t0};
    const ask=async(q,name,ms)=>{ try{ await hpWithin(c.submitContractInput(JSON.stringify(q)),HP_SEND_WAIT,'借りている郵便受けへの問い（'+name+'）'); }catch(e){ return null; }
      const t1=Date.now(); while(Date.now()-t1<ms){ const i=out.findIndex(x=>x&&(x.ok===name||x.err)); if(i>=0) return out.splice(i,1)[0]; await sleep(200); } return null; };
    const g=await ask({op:'dget'},'dget',HP_AX_ASK);
    if(g&&g.ok==='dget'&&Array.isArray(g.devs)) res.reg=g.devs.map(d=>String((d&&d.dev)||'')).filter(Boolean); else if(g&&g.err==='not owner') res.noreg=1;
    if((res.reg||res.noreg)&&o&&o.ver){ const v=await ask({op:'ver'},'ver',HP_AX_VER); if(v&&v.ok==='ver'&&typeof v.pv==='string'&&v.pv){ res.pv=v.pv; res.upg='new'; } else res.upg=(v&&v.err)?'new':'old'; }
    return res; }
  catch(e){ return {st:'down',e:String((e&&e.message)||e).slice(0,80)}; }
  finally{ if(c){ try{ await c.close(); }catch(e){} } } }
function hpAxHostOf(a,H){ try{ const L=(typeof HP_HOSTS!=='undefined'&&HP_HOSTS&&Array.isArray(HP_HOSTS.hosts))?HP_HOSTS.hosts:[], h=L.find(x=>x&&x.addr===a); if(h&&h.aid) return h; }catch(e){} const aid=(H&&H.aid)||hpAxAid(a); return aid?{addr:a,aid:aid}:null; }
async function hpAxCheck(){
  if(HP_AX_CK) return; const X=HP_AX; if(!X||X.st!=='ok') return; HP_AX_CK=true; hpAxTick();
  try{ const skip=new Set([String((typeof hpPostUrl==='function'&&hpPostUrl())||'')]), fb=new Set();
    let oldU=''; try{ const o=(typeof hpOldGet==='function')?hpOldGet():null; if(o&&o.url){ oldU=String(o.url); fb.add(oldU); } }catch(e){}   try{ for(const u of ((typeof hpFbUrls==='function'&&hpFbUrls())||[])) fb.add(u); }catch(e){}
    const now=Date.now(), due=r=>r.url&&!skip.has(r.url)&&!hpAxWhy0(r,now)&&!(HP_AX_PB[r.url]&&HP_AX_PB[r.url].st!=='busy'&&now-HP_AX_PB[r.url].at<HP_AX_FRESH), want=X.rows.filter(r=>due(r)&&!fb.has(r.url)), wantFb=X.rows.filter(r=>due(r)&&fb.has(r.url));
    const probe=async r=>{ HP_AX_PB[r.url]={st:'busy',at:Date.now()}; hpAxTick(); let p=null; try{ p=await hpAxProbe(r.url,{ver:true});   }catch(e){ p={st:'down'}; } HP_AX_PB[r.url]=Object.assign(p,{at:Date.now()}); hpAxTick(); };
    let i=0; const one=async()=>{ while(i<want.length) await probe(want[i++]); };
    const P=[]; for(let k=0;k<HP_AX_PAR;k++) P.push(one());
    P.push((async()=>{ const busy=()=>(typeof HP_BX_BUSY!=='undefined'&&HP_BX_BUSY)||(typeof HP_FB_BUSY!=='undefined'&&HP_FB_BUSY)||(typeof HP_OLD_BUSY!=='undefined'&&HP_OLD_BUSY);
      for(const r of wantFb){ for(let j=0;j<240&&busy();j++) await sleep(250); if(busy()) continue;
        let lock=false, lockO=false; try{ if(typeof HP_BX_BUSY!=='undefined'){ HP_BX_BUSY=true; lock=true; } if(r.url===oldU&&typeof HP_OLD_BUSY!=='undefined'){ HP_OLD_BUSY=true; lockO=true; }   await probe(r); } finally{ if(lock) HP_BX_BUSY=false; if(lockO) HP_OLD_BUSY=false; } } })());
    const seen=new Set(); for(const r of X.rows){ if(!r.url||!r.host||seen.has(r.host)) continue; seen.add(r.host);
      if(typeof hpUpHost!=='function'||typeof HP_UP==='undefined') break; const a=r.host, x=HP_UP[a]; if((typeof hpUpFresh==='function'&&hpUpFresh(x))||(x&&x.st==='busy')) continue;
      const h=hpAxHostOf(a,X.hosts&&X.hosts[a]); if(!h) continue; HP_UP[a]={st:'busy',k:1,n:1,done:0,total:0}; hpAxTick();
      try{ HP_UP[a]=await hpUpHost(h,(d,t)=>{ const u=HP_UP[a]; if(u&&u.st==='busy'){ u.done=d; u.total=t; } hpAxTick(); }); }
      catch(e){ HP_UP[a]={st:'err',at:Date.now(),why:String((e&&e.message)||e)}; }
      hpAxTick(); }
    await Promise.all(P); }
  finally{ HP_AX_CK=false; hpAxDraw(); } }
function hpAxTick(){ if(HP_AX_TT) return; HP_AX_TT=setTimeout(()=>{ HP_AX_TT=null; hpAxDraw(); },250); }
function hpAxBind(el,st,nt){ HP_AX_EL=el; HP_AX_ST=st; HP_AX_NT=nt||null; try{ if(HP_AX) hpAxDraw(); }catch(e){} return true; }
async function hpAxGo(r){
  if(HP_AX_GO||!HP_AX_ST||!r||!r.url) return null; if(typeof hpIsMain==='function'&&hpIsMain()&&typeof hpAxMoveGo==='function') return hpAxMoveGo(r);   HP_AX_GO=r.url; hpAxDraw();
  try{ return await hpAdGo(r.url,HP_AX_ST,r); } finally{ HP_AX_GO=''; hpAxDraw(); } }
function hpAxKeep(r){
  try{ if(!r||!r.url||typeof ID==='undefined'||!ID) return false; if(r.acct&&typeof hpBmAcctKeep==='function') hpBmAcctKeep(r.url,r.acct);
    const L=Object.assign({},(ID.lease&&typeof ID.lease==='object')?ID.lease:{}); if(r.acct) L.acct=r.acct; if(!L.at) L.at=Date.now();
    if(r.tok&&!r.amb){ const m=(ID.leaseByUrl&&typeof ID.leaseByUrl==='object')?ID.leaseByUrl:{}; m[r.url]=r.tok; const ks=Object.keys(m); while(ks.length>8) delete m[ks.shift()]; ID.leaseByUrl=m;
      L.tok=r.tok; if(r.host) L.host=r.host; if(Number(r.exp)>0) L.exp=Number(r.exp); }
    ID.lease=L; saveID(); try{ if(typeof HP_LG_AT!=='undefined') HP_LG_AT=0; }catch(e){}
    hpLog('使い始めた郵便受け（'+r.url+'）の借りた口座'+(L.tok&&r.tok?'と札（'+r.tok.slice(0,8)+'…・期限 '+(r.exp?hpAxDate(r.exp):'?')+'）':'')+'を控えた'); return true; }catch(e){ return false; } }
function hpAxCss(){
  try{ if(typeof document==='undefined'||typeof document.getElementById!=='function'||document.getElementById('ax-css')) return false; const st=document.createElement('style'); st.id='ax-css';
    st.textContent='@media (max-width:640px){#ax-tbl{display:block}#ax-tbl tr:first-child{display:none}#ax-tbl tr{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 12px;padding:8px 0;border-bottom:1px solid var(--line)}#ax-tbl td{border:0;padding:0;white-space:normal}#ax-tbl td:nth-child(1){flex:1 1 100%}#ax-tbl td:nth-child(1) span:first-child{word-break:break-all}#ax-tbl td:nth-child(3){flex:1 1 auto}#ax-tbl td:nth-child(8){order:1}#ax-tbl td:nth-child(2),#ax-tbl td:nth-child(n+4):nth-child(-n+7){order:2}#ax-tbl td div{display:inline-block;margin-left:6px;white-space:nowrap}#ax-tbl td[data-h]::before{content:attr(data-h);color:var(--dim);font-size:11px}}';
    (document.head||document.body).appendChild(st); return true; }catch(e){ return false; } }
function hpAxDraw(){
  const box=HP_AX_EL; if(!box) return false;
  try{ hpAxCss(); const X=HP_AX, now=Date.now(), nb=HP_AX_NT||box; box.textContent=''; if(HP_AX_NT) HP_AX_NT.textContent='';
    const nt=(t,css,to)=>{ const d=hpFlEl('div','note',t); d.style.cssText='white-space:pre-line;line-height:1.5'+(css?';'+css:''); (to||box).appendChild(d); return d; };
    if(!X||X.st==='busy'){ nt(TF('ax_busy',{n:(X&&X.n)||0})); try{ box.appendChild(hpUpGauge(30,true)); }catch(e){} return true; }
    if(X.st==='noacct'){ nt(T('ax_noacct'),'color:var(--amber)'); return true; }
    if(X.st==='err'){ nt(TF('ax_fail',{e:X.why||'?'}),'color:var(--amber)'); return true; }
    if(!X.rows.length){ nt(T('ax_none')); return true; }
    const k=X.rows.filter(r=>r.url).length; nt(TF('ax_count',{a:(X.accts||[]).map(hpAxAcct).join((typeof hpSep==='function'?hpSep():'・')),n:X.cnt,k:Math.min(k,X.cnt)}));
    if(X.part) nt(TF('ax_fail',{e:X.part}),'color:var(--amber)');
    const wrap=hpFlEl('div',''); wrap.style.cssText='overflow-x:auto;margin-top:6px'; const tb=document.createElement('table'); tb.className='paytb hstb'; tb.id='ax-tbl';
    const hd=document.createElement('tr'); for(const h of ['ax_h_box','ax_h_op','ax_h_left','ax_h_use','ax_h_conn','ax_h_up','ax_h_rep','']){   const th=document.createElement('th'); th.textContent=h?T(h):''; th.style.cssText='text-align:left'; hd.appendChild(th); } tb.appendChild(hd);
    const td=(tr,txt,css,hk)=>{ const c=document.createElement('td'); c.style.cssText='text-align:left;vertical-align:top'+(css?';'+css:''); if(hk) c.setAttribute('data-h',T(hk)+T('ax_sep')); if(txt!=null) c.textContent=txt; tr.appendChild(c); return c; };
    const sub=(c,txt)=>{ const d=hpFlEl('div','',txt); d.style.cssText='font-size:11px;color:var(--dim)'; c.appendChild(d); return d; };
    let rec=false, oldShown=false; const main=(typeof hpIsMain==='function'&&hpIsMain()), rank=r=>{ const w=hpAxWhy(r,now); return w===''?0:(w==='cur'||w.indexOf('sib:')===0)?1:w==='unk'?3:2; };
    const cop=(typeof hpOpOf==='function')?hpOpOf(String((typeof hpPostUrl==='function'&&hpPostUrl())||'')):'';
    const all=hpAxSort(X.rows,now), vis=all.filter(r=>rank(r)<2), fold=all.filter(r=>rank(r)>=2);
    const row=r=>{ const tr=document.createElement('tr'), why=hpAxWhy(r,now), pb=r.url?HP_AX_PB[r.url]:null, us=r.url?hpAxUsers(r.url):{me:false,sibs:[]}, cap=r.url?hpAxCap(r,pb):null;
      if(r.url&&HP_AX_GO===r.url) tr.className='pick';

      const c1=td(tr,null); { const m=hpFlEl('span','',r.url?r.url.replace(/^wss:\/\//,''):r.dom); m.style.cssText='font-family:ui-monospace,Menlo,Consolas,monospace;color:'+(r.url?'var(--teal)':'var(--dim)'); c1.appendChild(m);
        if(!rec&&why===''&&pb&&pb.st==='ok'&&!(typeof hpAxUpg==='function'&&hpAxUpg(r)==='old')){   rec=true; const b=hpFlEl('span','',T('ax_rec')); b.style.cssText='margin-left:6px;font-size:11px;padding:0 6px;border:1px solid var(--teal);border-radius:8px;color:var(--teal)'; c1.appendChild(b); }
        if(!r.url) sub(c1,T('ax_unk')); else if(r.amb) sub(c1,TF('ax_amb',{n:r.amb})); else if(r.buy) sub(c1,TF('ax_buy',{d:hpAxDate(r.buy).split(' ')[0]}));
        { const ug=(typeof hpAxUpg==='function')?hpAxUpg(r):''; if(ug){ const d=sub(c1,T(ug==='new'?'ax_upg_new':'ax_upg_old')); d.style.color=ug==='old'?'var(--amber)':'var(--teal)'; if(ug==='old') oldShown=true; } } }

      { const op=(typeof hpOpOf==='function')?hpOpOf(r.url||r.dom):'', c2=td(tr,op||'—','font-family:ui-monospace,Menlo,Consolas,monospace;word-break:break-all'+(op?'':';color:var(--dim)'),'ax_h_op'); if(op&&cop&&op===cop&&!us.me){ const d=sub(c2,T('ax_op_same')); d.style.color='var(--amber)'; } }

      if(Number(r.exp)>0){ const left=Number(r.exp)-now, d=Math.floor(left/864e5)  , col=left<HP_AX_MIN*864e5?'color:var(--red)':left<HP_AX_WARN*864e5?'color:var(--amber)':''; const c2=td(tr,left<=0?T('ax_over'):left<864e5?T('ax_lt1'):TF('ax_days',{d:d}),'font-weight:600;'+col,'ax_h_left'); sub(c2,TF(r.amb?'ax_until_amb':'ax_until',{t:hpAxDate(Number(r.exp))})); }
      else td(tr,'—','','ax_h_left');

      if(!r.url) td(tr,'—','','ax_h_use'); else { const n=us.sibs.length, c3=td(tr,us.me?(n?TF('ax_me_n',{n:n}):T('ax_me')):n?(n>1?TF('ax_sib_n',{d:hpAxLabel(us.sibs[0]),n:n-1}):hpAxLabel(us.sibs[0])):T('ax_nobody'),(us.me||n)?'':'color:var(--dim)','ax_h_use');
        if(cap){ const d=sub(c3,TF('ax_reg',{n:cap.n,m:cap.m})); if(cap.full) d.style.color='var(--amber)'; } else if(pb&&pb.noreg) sub(c3,T('ax_reg_no')); }

      if(us.me){ const up=!!(typeof POST!=='undefined'&&POST&&POST.up); td(tr,up?T('ax_c_now'):'—',up?'color:var(--teal)':'','ax_h_conn'); }
      else if(pb&&pb.st==='busy') td(tr,T('ax_c_busy'),'color:var(--dim)','ax_h_conn'); else if(pb&&pb.st==='ok') td(tr,T('ax_c_ok'),'color:var(--teal)','ax_h_conn'); else if(pb&&pb.st==='down') td(tr,T('ax_c_down'),'color:var(--amber)','ax_h_conn'); else td(tr,'—','','ax_h_conn');

      { const x=(r.url&&r.host&&typeof HP_UP!=='undefined')?HP_UP[r.host]:null; if(x&&x.st==='busy') td(tr,TF('ax_up_busy',{p:x.total?Math.round(x.done/x.total*100):0}),'color:var(--dim)','ax_h_up'); else if(x&&x.st==='ok') td(tr,x.pct+(typeof hpPctS==='function'?hpPctS():'％'),Number(x.pct)<HP_AX_UPLOW?'color:var(--amber)':'','ax_h_up'); else td(tr,'—','','ax_h_up'); }
      { const H=(X.hosts&&r.host)?X.hosts[r.host]:null, rp=H&&H.rep!=null?Number(H.rep):null; const c6=td(tr,rp==null?'—':String(rp),rp!=null&&rp<HP_AX_REPLOW?'color:var(--amber)':'','ax_h_rep'); try{ if(typeof hpRpAxCell==='function') hpRpAxCell(c6,r); }catch(e){}   }

      const c7=td(tr,null);
      if(r.url&&HP_AX_GO===r.url){ c7.textContent=T('ax_c_busy'); c7.style.color='var(--dim)'; }
      else if(why===''){ const b=hpFlBtn(main?'btn_ax_mv':'btn_ad_use',()=>{ hpAxGo(r); },true); b.style.cssText='padding:2px 10px'; if(HP_AX_GO||(typeof HP_AD_BUSY!=='undefined'&&HP_AD_BUSY)) b.disabled=true; c7.appendChild(b); }
      else { const t=why==='cur'?T('ax_r_cur'):why.indexOf('sib:')===0?TF('ax_r_sib',{n:why.slice(4)}):why==='short'?TF('ax_r_short',{d:HP_AX_MIN}):why==='noexp'?T('ax_r_noexp'):why==='down'?T('ax_r_down'):why==='over'?T('ax_r_over'):(why==='full'&&cap)?TF('ax_r_full',{l:cap.l}):''; c7.textContent=t; c7.style.color='var(--dim)'; }
      tb.appendChild(tr); };
    for(const r of vis) row(r);
    if(fold.length){ const tr=document.createElement('tr'), c=document.createElement('td'); c.colSpan=8;   c.style.cssText='text-align:left;padding-top:6px'; const b=hpFlBtn('btn_ax_less',()=>{ HP_AX_OPEN=!HP_AX_OPEN; hpAxDraw(); }); b.id='btn-ax-more'; if(!HP_AX_OPEN) b.textContent=TF('btn_ax_more',{n:fold.length}); b.style.cssText='padding:2px 10px'; c.appendChild(b); tr.appendChild(c); tb.appendChild(tr);
      if(HP_AX_OPEN) for(const r of fold) row(r); }
    wrap.appendChild(tb); box.appendChild(wrap);
    if(HP_AX_CK) nt(T('ax_work'),'margin-top:6px');
    if(HP_AX_OPEN&&fold.some(r=>!r.url)) nt(T('ax_unk_nt'),'margin-top:6px',nb);
    nt(T('ax_watch_nt'),'margin-top:4px',nb);
    if(X.rows.some(r=>r.url&&hpAxCap(r,HP_AX_PB[r.url]))) nt(T('ax_cap_nt'),'margin-top:4px',nb);
    if(oldShown) nt(T('ax_upg_nt'),'margin-top:4px',nb);
    { const L=X.rows.filter(r=>r.url), ops=(typeof hpOpOf==='function')?[...new Set(L.map(r=>hpOpOf(r.url)).filter(Boolean))]:[]; if(ops.length) nt(T('ax_op_nt'),'margin-top:4px',nb); if(ops.length===1&&L.length>=2) nt(TF('ax_op_all',{o:ops[0]}),'margin-top:4px;color:var(--amber)',nb); }
    return true; }catch(e){ return false; } }

const HP_LB_MAX=16, HP_LB_KEEP=864e5, HP_LB_NOEXP=40*864e5, HP_LB_GONE=60*864e5;
const HP_LB_U=/^wss:\/\/[a-z0-9.-]+:[0-9]{2,5}$/i, HP_LB_R=/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, HP_LB_T=/^[0-9A-F]{64}$/;
function hpLbGet(){ try{ return (typeof ID!=='undefined'&&ID&&ID.lbook&&typeof ID.lbook==='object'&&!Array.isArray(ID.lbook))?ID.lbook:{}; }catch(e){ return {}; } }
function hpLbGoneOf(t){ try{ const g=(ID&&ID.lbGone&&typeof ID.lbGone==='object'&&!Array.isArray(ID.lbGone))?ID.lbGone:null; return !!(g&&t&&g[t]&&Date.now()-Number(g[t])<HP_LB_GONE); }catch(e){ return false; } }
function hpLbGoneAdd(t,now){ try{ if(!HP_LB_T.test(String(t||''))) return; const g=(ID.lbGone&&typeof ID.lbGone==='object'&&!Array.isArray(ID.lbGone))?ID.lbGone:{}; g[t]=now||Date.now(); for(const k of Object.keys(g)){ if(Date.now()-Number(g[k])>=HP_LB_GONE) delete g[k]; } const ks=Object.keys(g); while(ks.length>32) delete g[ks.shift()]; ID.lbGone=g; }catch(e){} }
function hpLbOk(u,x){ return HP_LB_U.test(String(u||''))&&!!x&&typeof x==='object'&&!Array.isArray(x)&&Number(x.at)>0&&(x.a===undefined||HP_LB_R.test(String(x.a)))&&(x.t===undefined||HP_LB_T.test(String(x.t).toUpperCase()))&&(x.e===undefined||Number(x.e)>0)&&(x.h===undefined||HP_LB_R.test(String(x.h)))&&!!(x.a||x.t); }
function hpLbClean(x){ const o={at:Number(x.at)}; if(x.a) o.a=String(x.a); if(x.t) o.t=String(x.t).toUpperCase(); if(Number(x.e)>0) o.e=Number(x.e); if(x.h) o.h=String(x.h); return o; }
function hpLbPrune(m,now){ now=now||Date.now(); let n=0;
  for(const u of Object.keys(m)){ const x=m[u]; const dead=!x||(x.e?(Number(x.e)+HP_LB_KEEP<now):(Number(x.at)+HP_LB_NOEXP<now))||(x.t&&hpLbGoneOf(x.t)); if(dead){ if(x&&x.t&&x.e) hpLbGoneAdd(x.t,now); delete m[u]; n++; } }
  const ks=Object.keys(m); if(ks.length>HP_LB_MAX){ const end=x=>Number(x.e)||(Number(x.at)+30*864e5); ks.sort((a,b)=>end(m[a])-end(m[b])); for(const u of ks.slice(0,ks.length-HP_LB_MAX)){ delete m[u]; n++; } }
  return n; }
function hpLbMerge(m,u,x){
  const c=hpLbClean(x); if(c.t&&hpLbGoneOf(c.t)) return false; const o=m[u]; if(!o){ m[u]=c; return true; }
  const newer=c.at>Number(o.at||0);
  if(c.t&&o.t&&c.t!==o.t){ if(!newer) return false; m[u]=c; return true; }
  let ch=false; for(const k of ['a','t','e','h']){ if(c[k]===undefined) continue; if(o[k]===undefined||(newer&&o[k]!==c[k])){ o[k]=c[k]; ch=true; } }
  if(ch&&newer) o.at=c.at; return ch; }
function hpLbPut(u,x){ try{ if(typeof ID==='undefined'||!ID) return false; u=String(u||'').trim().replace(/\/+$/,''); const y=Object.assign({at:Date.now()},x); for(const k of Object.keys(y)){ if(y[k]===undefined||y[k]==='') delete y[k]; }
    if(!hpLbOk(u,y)) return false; const m=hpLbGet(), ch=hpLbMerge(m,u,y), pr=hpLbPrune(m); if(ch||pr){ ID.lbook=m; saveID(); } return ch; }catch(e){ return false; } }
function hpLbSelf(){
  try{ if(typeof ID==='undefined'||!ID) return 0; let n=0; const lb=(ID.leaseByUrl&&typeof ID.leaseByUrl==='object')?ID.leaseByUrl:{}, ab=(ID.acctByUrl&&typeof ID.acctByUrl==='object')?ID.acctByUrl:{}, L=(ID.lease&&typeof ID.lease==='object')?ID.lease:{}, cur=String((typeof hpPostUrl==='function'&&hpPostUrl())||'');
    for(const u of Object.keys(lb)){ const t=String(lb[u]||'').toUpperCase(), a=String(ab[u]||((u===cur)?(L.acct||''):'')); if(!HP_LB_T.test(t)||!HP_LB_R.test(a)||hpLbGoneOf(t)) continue;
      const x={a:a,t:t}; if(u===cur&&!L.gone&&String(L.tok||'').toUpperCase()===t&&Number(L.exp)>0){ x.e=Number(L.exp); if(L.host&&HP_LB_R.test(String(L.host))) x.h=String(L.host); }
      if(hpLbPut(u,x)) n++; }
    return n; }catch(e){ return 0; } }
function hpLbList(){ try{ hpLbSelf(); const m=hpLbGet(); if(hpLbPrune(m)){ ID.lbook=m; saveID(); } const o={}; for(const u of Object.keys(m)) o[u]=hpLbClean(m[u]); return Object.keys(o).length?o:null; }catch(e){ return null; } }
function hpLbTake(o,from){
  try{ if(typeof ID==='undefined'||!ID||!o||typeof o!=='object'||Array.isArray(o)) return 0; const m=hpLbGet(), now=Date.now(); let n=0;
    for(const u of Object.keys(o).slice(0,32)){ const x=o[u]; if(!hpLbOk(u,x)||Number(x.at)>now+600e3) continue; if(hpLbMerge(m,u,x)) n++; }
    const pr=hpLbPrune(m,now); if(n||pr){ ID.lbook=m; saveID(); }
    if(n) hpLog('自分の端末（'+String(from||'').slice(0,10)+'…）から、借りている郵便受けの控え '+n+' 件を受け取った'); return n; }catch(e){ return 0; } }
function hpLbFromScan(acct,toks,rows){
  try{ let n=0, gone=0; for(const r of (rows||[])){ if(!r||!r.url||!r.tok||r.amb||['key','keep','book'].indexOf(r.src)<0) continue; if(hpLbPut(r.url,{a:acct,t:r.tok,e:Number(r.exp)>0?Number(r.exp):undefined,h:r.host||undefined})) n++; }
    const live=new Set((toks||[]).map(t=>String(t.tok||'').toUpperCase())), m=hpLbGet(), now=Date.now();
    for(const u of Object.keys(m)){ const x=m[u]; if(x&&x.a===acct&&x.t&&!live.has(x.t)){ hpLbGoneAdd(x.t,now); delete m[u]; gone++; } }
    if(gone){ ID.lbook=m; saveID(); }
    if(n||gone) hpLog('借りている郵便受けの控えを台帳で直した（足した・替えた '+n+'・台帳から消えた '+gone+'）'); return n; }catch(e){ return 0; } }
try{ if(typeof hpSibPut==='function'&&!hpSibPut.__lb){ const f=hpSibPut; hpSibPut=Object.assign(async function(body){ try{ if(body&&body.type==='sibc'&&Number(body.i)===1){ const x=hpLbList(); if(x) body.lbook=x; } }catch(e){} return f.apply(this,arguments); },f,{__lb:1}); } }catch(e){}
try{ if(typeof hpSibSyncIn0==='function'&&!hpSibSyncIn0.__lb){ const f=hpSibSyncIn0; hpSibSyncIn0=Object.assign(async function(o,r){ const v=await f.apply(this,arguments); try{ if(v!==false&&o&&r&&r.fromDev&&o.lbook) hpLbTake(o.lbook,String(r.fromDev)); }catch(e){} return v; },f,{__lb:1}); } }catch(e){}
try{ if(typeof hpSyncDigest==='function'&&!hpSyncDigest.__lb){ const f=hpSyncDigest; hpSyncDigest=Object.assign(async function(){ const h=await f.apply(this,arguments), x=hpLbList(); if(!x) return h; await hpReady(); return hpHex(hp5S().crypto_generichash(16, hp5U(JSON.stringify([h,'lbook',Object.keys(x).sort().map(k=>[k,x[k].a||'',x[k].t||'',x[k].e||0])])))); },f,{__lb:1}); } }catch(e){}

async function hpAxMoveMain(r){
  if(typeof hpIsMain!=='function'||!hpIsMain()) return {why:'notmain'};
  if((typeof ID!=='undefined'&&ID&&ID.rentJob)||(typeof HP_MOVE!=='undefined'&&HP_MOVE)||(typeof hpMvBusy==='function'&&hpMvBusy())) return {why:'job'};
  const url=String((r&&r.url)||''), w=hpAdCheck(url); if(w) return {why:w};
  const lf=Number(r.exp)-Date.now(); if(!(Number(r.exp)>0)) return {why:'noexp'}; if(lf<=0) return {why:'over'}; if(lf<HP_AX_MIN*864e5) return {why:'short'};
  if(HP_AD_BUSY) return {why:'busy'}; HP_AD_BUSY=true; let lock=false;
  try{ for(let i=0;i<120&&((typeof HP_BX_BUSY!=='undefined'&&HP_BX_BUSY)||(typeof HP_FB_BUSY!=='undefined'&&HP_FB_BUSY));i++) await sleep(250);
    if(typeof HP_BX_BUSY!=='undefined'){ HP_BX_BUSY=true; lock=true; }
    const from=String(hpPostUrl()||''), fol=hpAxUsers(from).sibs.map(d=>d.dev);
    hpLog('契約中の郵便受け（'+url+'）へ移す前に確かめる（この端末の鍵でつないで名乗り、自分の端末がみな登録できるかを見る。一緒に移る端末 '+fol.length+' 台）');
    const p=await hpAxFit(url,fol); if(!p.ok){ hpLog('契約中の郵便受け（'+url+'）へは移せない（'+p.why+(p.e?' '+p.e:'')+(p.why==='full'?'・登録 '+p.reg+' 台・自分の端末 '+p.s+' 台':'')+'）。何も替えていない'); return p; }
    hpLog('契約中の郵便受け（'+url+'）に名乗れた（本体の版 '+(p.pv||'?')+'・登録 '+p.reg+' 台'+(p.add?'・足した '+p.add+' 台':'')+'）');
    if(lock){ HP_BX_BUSY=false; lock=false; }
    const J={move:{from:from,lease:Object.assign({},(ID.lease&&typeof ID.lease==='object')?ID.lease:{})},acct:r.acct||'',tok:r.tok||'',host:r.host||''};
    let mv=null; try{ mv=await hpMoveBefore(J,url); }catch(e){ mv={n:0,why:String((e&&e.message)||e)}; }
    try{ if(typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner&&POST.url===from&&typeof hpSend==='function') await hpWithin(hpSend({op:'lease',exp:0}),HP_SEND_WAIT,'前の郵便受けの期限を消す'); }catch(e){}
    try{ stopBg(); }catch(e){} try{ localStorage.setItem('p2p_post',url); }catch(e){}
    const L={at:Date.now()}; if(r.acct) L.acct=r.acct; if(r.tok&&!r.amb){ L.tok=r.tok; if(r.host) L.host=r.host; if(Number(r.exp)>0) L.exp=Number(r.exp);
      const m=(ID.leaseByUrl&&typeof ID.leaseByUrl==='object')?ID.leaseByUrl:{}; m[url]=r.tok; const ks=Object.keys(m); while(ks.length>8) delete m[ks.shift()]; ID.leaseByUrl=m; }
    ID.lease=L; let c=0; try{ c=hpMoveAfter(J,url,mv); }catch(e){}
    try{ if(r.acct&&typeof hpBmAcctKeep==='function') hpBmAcctKeep(url,r.acct); }catch(e){}
    saveID(); try{ if(typeof HP_LG_AT!=='undefined') HP_LG_AT=0; }catch(e){}
    hpLog('契約中の郵便受け（'+url+'）へ移した（借りずに。前の郵便受け '+from+' は期限まで見回る・転居届 '+((mv&&mv.n)||0)+' 台・名刺 '+c+' 人）');
    setTimeout(()=>{ try{ startBg(); }catch(e){} },1500);
    return {ok:1,n:(mv&&mv.n)||0,f:fol.length,c:c,why2:(mv&&mv.why)||''};   }
  catch(e){ return {why:'other',e:String((e&&e.message)||e).slice(0,80)}; }
  finally{ if(lock) HP_BX_BUSY=false; HP_AD_BUSY=false; } }
async function hpAxMoveGo(r){
  const st=HP_AX_ST; if(!st||!r||!r.url||HP_AX_GO) return null;
  const from=String(hpPostUrl()||''), us=hpAxUsers(from), n=us.sibs.length, oe=(typeof hpLeaseExp==='function')?Number(hpLeaseExp())||0:0, tu=hpAxUsers(r.url), h=r.url.replace(/^wss:\/\//,'');
  const share=tu.sibs.length?TF('ax_mv_ask_share',{h:h,d:tu.sibs.map(d=>hpAxLabel(d)).join((typeof hpSep==='function'?hpSep():'・'))}):'';
  const o0=from.replace(/^wss:\/\//,''), q=n?(oe?TF('ax_mv_ask',{h:h,n:n,o:o0,t:hpAxDate(oe)}):TF('ax_mv_ask_nt',{h:h,n:n,o:o0})):(oe?TF('ax_mv_ask1',{h:h,o:o0,t:hpAxDate(oe)}):TF('ax_mv_ask1_nt',{h:h,o:o0}));
  let yes=false; try{ yes=await hpAsk({title:T('btn_ax_move'),text:q+share,ok:T('btn_ax_mv'),why:'契約中の郵便受けへ移す'}); }catch(e){ yes=false; }
  if(!yes) return null;
  HP_AX_GO=r.url; hpAxDraw(); st.style.color=''; st.textContent=T('ad_checking'); let x=null;
  try{ x=await hpAxMoveMain(r); }catch(e){ x={why:'other',e:String((e&&e.message)||e)}; }
  finally{ HP_AX_GO=''; }
  if(x&&x.ok){ const f=(x.f!==undefined)?x.f:x.n; st.style.color='var(--teal)'; st.textContent=(f?TF('ax_mv_ok',{h:h,n:f}):TF('ax_mv_ok1',{h:h}))+(x.why2?'\n'+TF('mv2_nosub',{why:x.why2}):''); }
  else { st.style.color='var(--amber)'; st.textContent=hpAdWhy(x); }
  hpAxDraw(); return x; }

function hpAxMoveUi(){ try{ if(typeof document==='undefined'||typeof document.getElementById!=='function') return false; const card=document.getElementById('post-move'), go=document.getElementById('btn-pt-move'); if(!card||!go||!go.parentNode) return false;
    const can=(typeof hpIsMain==='function'&&hpIsMain())||(typeof hpObOwn==='function'&&hpObOwn()); let b=document.getElementById('btn-ax-move'), box=document.getElementById('post-move-ax');
    if(!can){ if(b) b.style.display='none'; if(box) box.style.display='none'; return false; }
    const on=!!(typeof HP_MOVE!=='undefined'&&HP_MOVE);
    if(!b){ b=document.createElement('button'); b.className='b'; b.id='btn-ax-move'; b.type='button'; b.textContent=T('btn_ax_move'); b.style.marginLeft='8px'; go.parentNode.appendChild(b);
      box=document.createElement('div'); box.id='post-move-ax'; box.style.cssText='display:none;margin-top:8px';
      const nt=hpFlEl('div','note',''); nt.id='ax-mv-nt'; nt.style.cssText='white-space:pre-line;line-height:1.5'; box.appendChild(nt);
      const ax=hpFlEl('div',''); ax.id='ax-box2'; ax.style.cssText='margin-top:8px'; box.appendChild(ax);
      const st=hpFlEl('div','note',''); st.id='ax-mv-st'; st.style.cssText='margin-top:6px;white-space:pre-line;line-height:1.5'; box.appendChild(st);
      const axn=hpFlEl('div',''); axn.id='ax-nt2'; box.appendChild(axn);
      const r2=hpFlEl('div','row'); r2.style.cssText='margin-top:8px;justify-content:flex-start;flex-wrap:wrap;gap:8px';
      const rb=hpFlBtn('btn_ax_reload',()=>{ hpAxOpen(true); }); rb.id='btn-ax-reload2'; const cb=hpFlBtn('btn_ax_close',()=>{ box.style.display='none'; st.textContent=''; }); cb.id='btn-ax-close2';
      r2.appendChild(rb); r2.appendChild(cb); box.appendChild(r2); card.appendChild(box);
      b.addEventListener('click',()=>{ const show=box.style.display==='none'; box.style.display=show?'':'none'; if(show){ nt.textContent=T((typeof hpIsMain==='function'&&hpIsMain())?'ax_mv_nt_main':'ax_mv_nt_own'); hpAxBind(ax,st,axn); hpAxOpen(false); } }); }
    b.style.display=on?'none':''; if(on&&box) box.style.display='none';
    return true; }catch(e){ return false; } }
function hpAxWrapMoveUi(){ try{ if(typeof hpMoveUi==='function'&&!hpMoveUi.__ax){ const f=hpMoveUi; hpMoveUi=Object.assign(function(){ const v=f.apply(this,arguments); try{ hpAxMoveUi(); }catch(e){} return v; },f,{__ax:1}); return true; } }catch(e){} return false; }

if(!hpAxWrapMoveUi()){ try{ if(typeof document!=='undefined'&&typeof document.addEventListener==='function') document.addEventListener('DOMContentLoaded',()=>{ hpAxWrapMoveUi(); try{ hpAxMoveUi(); }catch(e){} }); }catch(e){} }

function hpAxFollow(o,cur){
  try{ const url=String((o&&o.url)||''), ts=Number(o&&o.ts);
    if(typeof hpPmUrlOk!=='function'||!hpPmUrlOk(url)||url===cur||typeof ID==='undefined'||!ID||!ID.link||Number(ID.link.postTs)!==ts||ID.boxOwn!==cur||ID.boxJob||String((typeof hpPostUrl==='function'&&hpPostUrl())||'')!==cur) return false;
    const now=Date.now(), L=(ID.lease&&typeof ID.lease==='object')?ID.lease:{}, t=String(L.tok||'').toUpperCase(), lb=(ID.leaseByUrl&&typeof ID.leaseByUrl==='object')?String(ID.leaseByUrl[cur]||'').toUpperCase():'', e=(t&&lb===t)?(Number(L.exp)||0):0;
    ID.link.postOld=Object.assign({url:cur,at:now,last:now},e>0?{exp:e}:{}); delete ID.boxOwn; delete ID.boxDevs; saveID();
    try{ localStorage.setItem('p2p_post',url); }catch(e2){}
    hpLog('転居届を受け取った。この端末の郵便受け（'+cur+'）はアカウントを作った端末と一緒に使っていたので、一緒に '+url+' へ移って、つなぎ直す（前の郵便受けは期限まで見回る）');
    try{ if(typeof hpToast==='function') hpToast(T('mv2_in')); }catch(e2){}
    setTimeout(()=>{ try{ stopBg(); }catch(e2){} setTimeout(()=>{ try{ startBg(); }catch(e2){} },1500); },4000);
    return true; }catch(e){ return false; } }
try{ if(typeof hpMoveIn==='function'&&!hpMoveIn.__fo){ const f=hpMoveIn; hpMoveIn=Object.assign(async function(o,r){
    let cur='', share=false;
    try{ cur=String((typeof hpPostUrl==='function'&&hpPostUrl())||''); const m=ID&&ID.link&&ID.link.main&&ID.link.main.dev, b=(m&&typeof hpMcBoxRec==='function')?hpMcBoxRec(m):null;
      share=!!(cur&&b&&b.url===cur&&ID.boxOwn===cur&&!ID.boxJob); }catch(e){}
    const v=await f.apply(this,arguments);
    try{ if(v===true&&share) hpAxFollow(o,cur); }catch(e){}
    return v; },f,{__fo:1}); } }catch(e){}

let HP_AX_CPV=null;
function hpAxUpg(r){
  try{ if(!r||!r.url) return ''; const cur=String((typeof hpPostUrl==='function'&&hpPostUrl())||'');
    if(r.url===cur){ const c=HP_AX_CPV; return (c&&c.url===cur)?(c.pv?'new':'old'):''; }
    const p=(typeof HP_AX_PB!=='undefined'&&HP_AX_PB)?HP_AX_PB[r.url]:null; return (p&&(p.upg==='new'||p.upg==='old'))?p.upg:''; }catch(e){ return ''; } }
try{ if(typeof hpLinkOnReply==='function'&&!hpLinkOnReply.__ug){ const f=hpLinkOnReply; hpLinkOnReply=Object.assign(function(o){ try{ if(o&&o.ok==='claim'&&typeof POST!=='undefined'&&POST&&POST.url) HP_AX_CPV={url:String(POST.url),pv:(typeof o.pv==='string')?o.pv:'',at:Date.now()}; }catch(e){} return f.apply(this,arguments); },f,{__ug:1}); } }catch(e){}

const HP_RP_LOW=200, HP_RP_LONG_H=72, HP_RP_OK_PCT=90, HP_RP_DIP_N=3, HP_RP_GAP=60e3, HP_RP_RETRY=1800e3, HP_RP_EVERY=6*3600e3; const HP_RP_KIND={none:'rp_k_none',ok:'rp_k_ok',dip:'rp_k_dip',often:'rp_k_often',now:'rp_k_now',long:'rp_k_long'}; let HP_RP_LAST={}, HP_RP_BUSY='', HP_RP_AT={}, HP_RP_NEXT=0;
function hpRpMerge(R,old,B){
  const map={}; let now=-1, nowT=-Infinity;
  for(const x of ((R&&R.reps)||[])){ const t=Number(x[0]), v=Number(x[1]); if(!(v>=0&&v<=255)) continue; const m=hpMomNow(R.C,t*1000); if(map[m]===undefined||v<map[m]) map[m]=v; if(t>=nowT){ nowT=t; now=v; } }
  const ok=!!(old&&typeof old.reps==='string'&&old.reps.length===2*(Number(old.cur)-Number(old.first)));
  let s=''; for(let m=B.first;m<B.cur;m++){ let v=map[m]; if(v===undefined&&ok&&m>=old.first&&m<old.cur){ const h=old.reps.substr((m-old.first)*2,2); if(h!=='--') v=parseInt(h,16); } s+=(v===undefined)?'--':v.toString(16).padStart(2,'0'); }
  if(now<0&&ok&&Number(old.rnow)>=0) now=Number(old.rnow);
  return {reps:s,now:now}; }
function hpRpData(a){ try{ const x=(a&&typeof HP_UP!=='undefined'&&HP_UP)?HP_UP[a]:null; return (x&&x.rp&&typeof x.rp.reps==='string')?x.rp:((a&&HP_RP_LAST[a])||null); }catch(e){ return null; } }
function hpRpVals(rp){ const s=String((rp&&rp.reps)||''), n=Math.floor(s.length/2), v=[]; for(let i=0;i<n;i++){ const h=s.substr(i*2,2); v.push(h==='--'?-1:parseInt(h,16)); } return v; }
function hpRpCfg(rp){ return {base:Number(rp.base),trans:Number(rp.trans),size:Number(rp.size)||3600}; }
function hpRpSum(rp,now){
  now=now||Date.now(); const o={kind:'none',now:-1,known:0,pct:0,runs:0,longH:0,low:false,since:0,sinceH:0,part:0}; if(!rp||typeof rp.reps!=='string') return o;
  const C=hpRpCfg(rp), hr=C.size/3600, v=hpRpVals(rp), N=v.length; if(Number(rp.now)>=0) v.push(Number(rp.now));
  let known=0, hi=0, runs=0, run=0, longest=0, inLow=false, startI=-1, hiB=0, knB=0;
  for(let i=0;i<v.length;i++){ const x=v[i]; if(x<0) continue; known++; if(x>=HP_RP_LOW){ hi++; if(inLow){ inLow=false; if(run>longest) longest=run; } } else { if(!inLow){ inLow=true; runs++; run=0; startI=i; hiB=hi; knB=known-1; } run++; } }
  if(inLow&&run>longest) longest=run;
  let cur=-1; for(let i=v.length-1;i>=0;i--){ if(v[i]>=0){ cur=v[i]; break; } }
  o.now=cur; o.known=known; o.runs=runs; o.longH=Math.round(longest*hr); o.pct=known?Math.round(hi/known*1000)/10:0; o.part=(known&&known<0.9*(N+1))?Math.max(1,Math.round(known*hr/24)):0;
  if(!known) return o; o.low=cur<HP_RP_LOW;
  if(o.low){ o.since=hpMomStart(Number(rp.first)+startI,C); const h=(now-o.since)/3600e3, pb=knB?hiB/knB*100:100; o.sinceH=Math.max(0,Math.round(h)); o.kind=h>=HP_RP_LONG_H?'long':pb>=HP_RP_OK_PCT?'now':'often'; }
  else o.kind=!runs?'ok':(o.pct>=HP_RP_OK_PCT&&runs<=HP_RP_DIP_N)?'dip':'often';
  return o; }
function hpRpDays(rp,now){
  now=now||Date.now(); const days=[], d0=new Date(now); d0.setHours(0,0,0,0); for(let i=29;i>=0;i--){ const t=new Date(d0.getTime()); t.setDate(d0.getDate()-i); days.push({t:t.getTime(),min:-1,max:-1,n:0}); }
  if(!rp||typeof rp.reps!=='string') return days; const C=hpRpCfg(rp);
  const put=(t,v)=>{ if(!(v>=0)) return; for(let k=days.length-1;k>=0;k--){ if(t>=days[k].t){ const D=days[k]; if(!D.n||v<D.min) D.min=v; if(!D.n||v>D.max) D.max=v; D.n++; return; } } };
  hpRpVals(rp).forEach((v,i)=>put(hpMomStart(Number(rp.first)+i,C),v)); if(Number(rp.now)>=0) put(now,Number(rp.now)); return days; }
function hpRpMd(t){ const d=new Date(Number(t)||0), s=(typeof hpDateIntl==='function')?hpDateIntl(d.getTime(),'md'):''; if(s) return s; return (d.getMonth()+1)+'/'+d.getDate(); }
function hpRpLine(S){ if(!S||S.kind==='none') return T('hl_up_none'); let t=TF('rp_now',{r:S.now})+(typeof hpSep==='function'?hpSep():'・')+T(HP_RP_KIND[S.kind]||'rp_k_none'); if(S.low&&S.since) t+=TF('rp_since',{d:hpRpMd(S.since)}); else if(S.runs) t+=TF('rp_runs',{n:S.runs}); return t; }
function hpRpFacts(S){ return TF('rp_facts',{p:S.pct})+(S.runs?TF('rp_facts_low',{n:S.runs,h:S.longH}):'')+(S.part?TF('rp_part',{n:S.part}):''); }
function hpRpEsc(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function hpRpBarsSvg(days,x,y,w,h){
  const n=Math.max(1,days.length), bw=w/n, f=v=>y+h-Math.max(0,Math.min(255,v))/255*h, L=f(HP_RP_LOW).toFixed(1), o=[];
  days.forEach((d,i)=>{ const x0=(x+i*bw+bw*0.15).toFixed(1), ww=Math.max(0.8,bw*0.7).toFixed(1); if(!(d.n>0)){ o.push('<rect x="'+x0+'" y="'+(y+h-1).toFixed(1)+'" width="'+ww+'" height="1" fill="#3a4f6e"/>'); return; }
    const top=Math.min(f(d.min),y+h-1.5); o.push('<rect x="'+x0+'" y="'+top.toFixed(1)+'" width="'+ww+'" height="'+(y+h-top).toFixed(1)+'" fill="'+(d.min<HP_RP_LOW?'#f5b85c':'#35d1b7')+'"/>'); });
  o.push('<line x1="'+x.toFixed(1)+'" y1="'+L+'" x2="'+(x+w).toFixed(1)+'" y2="'+L+'" stroke="#e6edf6" stroke-opacity="0.5" stroke-width="0.7" stroke-dasharray="2 2"/>');
  return '<g class="rp-bars">'+o.join('')+'</g>'; }
function hpRpChartSvg(rp,now){
  now=now||Date.now(); const W=340, H=160, X0=34, X1=W-8, Y0=8, Y1=H-24, C=hpRpCfg(rp), v=hpRpVals(rp), t0=hpMomStart(Number(rp.first),C), span=Math.max(1,now-t0);
  const sx=t=>X0+(Math.max(t0,Math.min(now,t))-t0)/span*(X1-X0), sy=x=>Y1-Math.max(0,Math.min(255,x))/255*(Y1-Y0), P=p=>sx(p[0]).toFixed(1)+','+sy(p[1]).toFixed(1), o=[];
  o.push('<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="'+hpRpEsc(T('rp_h'))+'" style="display:block;max-width:560px">');
  for(const g of [0,100,200,255]){ const y=sy(g), lo=g===HP_RP_LOW; o.push('<line x1="'+X0+'" y1="'+y.toFixed(1)+'" x2="'+X1+'" y2="'+y.toFixed(1)+'" stroke="'+(lo?'#f5b85c':'#2a3a57')+'" stroke-width="'+(lo?1:0.6)+'"'+(lo?' stroke-dasharray="4 3"':'')+'/><text x="'+(X0-4)+'" y="'+(y+3.5).toFixed(1)+'" text-anchor="end" font-size="10" fill="#8aa0bd">'+g+'</text>'); }
  const pts=v.map((x,i)=>x<0?null:[hpMomStart(Number(rp.first)+i,C)+C.size*500,x]); if(Number(rp.now)>=0) pts.push([now,Number(rp.now)]);
  const line=(seg,col,wd)=>{ if(seg.length>1) o.push('<polyline fill="none" stroke="'+col+'" stroke-width="'+wd+'" stroke-linejoin="round" points="'+seg.map(P).join(' ')+'"/>'); else if(seg.length===1) o.push('<circle cx="'+sx(seg[0][0]).toFixed(1)+'" cy="'+sy(seg[0][1]).toFixed(1)+'" r="1.6" fill="'+col+'"/>'); };
  let seg=[]; for(const p of pts){ if(!p){ line(seg,'#35d1b7',1.4); seg=[]; continue; } seg.push(p); } line(seg,'#35d1b7',1.4);
  seg=[]; for(const p of pts){ if(p&&p[1]<HP_RP_LOW){ seg.push(p); continue; } line(seg,'#f5b85c',2); seg=[]; } line(seg,'#f5b85c',2);
  const d0=new Date(now); d0.setHours(0,0,0,0); for(let k=4;k>=0;k--){ const t=new Date(d0.getTime()); t.setDate(d0.getDate()-k*7); const tt=t.getTime(); if(tt<t0) continue; const x=sx(tt).toFixed(1); o.push('<line x1="'+x+'" y1="'+Y1+'" x2="'+x+'" y2="'+(Y1+3)+'" stroke="#5d6f8c"/><text x="'+x+'" y="'+(Y1+15)+'" text-anchor="middle" font-size="10" fill="#8aa0bd">'+hpRpMd(tt)+'</text>'); }
  o.push('</svg>'); return o.join(''); }
function hpRpAddrOf(url){
  try{ url=String(url||''); if(!url) return ''; const ok=a=>/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(String(a||''));
    if(typeof hpPostUrl==='function'&&url===String(hpPostUrl()||'')&&typeof hpHlHostAddr==='function'){ const a=hpHlHostAddr(); if(ok(a)) return a; }
    const L=(typeof hpLbGet==='function')?hpLbGet():{}; if(L[url]&&ok(L[url].h)) return String(L[url].h);
    if(typeof HP_AX!=='undefined'&&HP_AX&&Array.isArray(HP_AX.rows)){ const r=HP_AX.rows.find(x=>x&&x.url===url&&ok(x.host)); if(r) return String(r.host); }
    return ''; }catch(e){ return ''; } }
function hpRpCurOf(a){
  try{ if(typeof HP_HOSTS!=='undefined'&&HP_HOSTS&&Array.isArray(HP_HOSTS.hosts)){ const h=HP_HOSTS.hosts.find(x=>x&&x.addr===a); if(h&&h.rep!=null) return Number(h.rep); } }catch(e){}
  try{ if(typeof HP_AX!=='undefined'&&HP_AX&&HP_AX.hosts&&HP_AX.hosts[a]&&HP_AX.hosts[a].rep!=null) return Number(HP_AX.hosts[a].rep); }catch(e){} return -1; }
function hpRpBoxLines(b,bw,L){
  try{ const a=hpRpAddrOf(b&&b.url); if(!a||!Array.isArray(L)) return L; const rp=hpRpData(a), S=rp?hpRpSum(rp):null, r=(S&&S.now>=0)?S.now:hpRpCurOf(a), x=(typeof HP_UP!=='undefined'&&HP_UP)?HP_UP[a]:null, tw=bw-24;
    const own=(typeof hpHlHostAddr==='function')?hpHlHostAddr():'', busy=!!((x&&x.st==='busy')||HP_RP_BUSY===a||(own===a&&typeof HP_HL_UP_BUSY!=='undefined'&&HP_HL_UP_BUSY));
    const t=r>=0?TF('bm_rep',{r:r}):T(busy?'bm_rep_busy':'bm_rep_none');
    L.push({t:(typeof hpBmCut==='function')?hpBmCut(t,11,tw):t,fs:11,fw:700,fill:(r>=0&&r<HP_RP_LOW)?'#f5b85c':'#8aa0bd',rp:a});
    if(rp){ L.push({bars:hpRpDays(rp)}); L.push({gap:true}); L.push({gap:true}); }   return L; }catch(e){ return L; } }
function hpRpHlItem(now){
  const a=(typeof hpHlHostAddr==='function')?hpHlHostAddr():''; if(!a) return null; const rp=hpRpData(a), x=(typeof HP_UP!=='undefined'&&HP_UP)?HP_UP[a]:null;
  if(!rp){ const busy=!!((x&&x.st==='busy')||(typeof HP_HL_UP_BUSY!=='undefined'&&HP_HL_UP_BUSY)); return {k:'rep',st:'na',t:T(busy?'hl_up_busy':'hl_up_none')}; }
  const S=hpRpSum(rp,now); return {k:'rep',st:S.kind==='none'?'na':S.low?'bad':'ok',t:hpRpLine(S)}; }
function hpRpMini(rp,w,h){ return '<svg viewBox="0 0 '+w+' '+(h+2)+'" width="'+w+'" height="'+(h+2)+'" style="display:block">'+hpRpBarsSvg(hpRpDays(rp),0,1,w,h)+'</svg>'; }

function hpRpBarsLab(days,x,y,w,h){ const G=16, LH=10, x0=x+G, cw=Math.max(10,w-G), ch=Math.max(8,h-LH), f=v=>y+ch-Math.max(0,Math.min(255,v))/255*ch, tx=(px,py,v,a)=>'<text x="'+px.toFixed(1)+'" y="'+py.toFixed(1)+'" font-size="8" fill="#8aa0bd" text-anchor="'+a+'">'+hpRpEsc(v)+'</text>';
  return '<g class="rp-scale"><title>'+hpRpEsc(T('rp_bars_t'))+'</title>'+hpRpBarsSvg(days,x0,y,cw,ch)+tx(x0-2,f(HP_RP_LOW)+3,'200','end')+tx(x0-2,y+ch,'0','end')+tx(x0,y+ch+LH-1,(days&&days.length)?hpRpMd(days[0].t):'','start')+tx(x0+cw,y+ch+LH-1,T('rp_today'),'end')+'</g>'; }
function hpRpMiniLab(rp,w,h){ return '<svg viewBox="0 0 '+w+' '+(h+2)+'" width="'+w+'" height="'+(h+2)+'" style="display:block">'+hpRpBarsLab(hpRpDays(rp),0,1,w,h)+'</svg>'; }
function hpRpKick(now){
  now=now||Date.now(); if(now<HP_RP_NEXT) return false; HP_RP_NEXT=now+10e3;
  if(HP_RP_BUSY||typeof hpUpHost!=='function'||typeof HP_UP==='undefined'||!HP_UP) return false;
  if((typeof HP_UP_RUN!=='undefined'&&HP_UP_RUN)||(typeof HP_HL_UP_BUSY!=='undefined'&&HP_HL_UP_BUSY)||(typeof HP_AX_CK!=='undefined'&&HP_AX_CK)) return false;
  let M=null; try{ M=(typeof hpBmModel==='function')?hpBmModel():null; }catch(e){} if(!M||!Array.isArray(M.boxes)) return false;
  const cur=String((typeof hpPostUrl==='function'&&hpPostUrl())||'');
  const own=(typeof hpHlHostAddr==='function')?hpHlHostAddr():'';
  for(const b of M.boxes){ if(!b||(b.url===cur&&own)) continue; const a=hpRpAddrOf(b.url); if(!a) continue; const x=HP_UP[a];
    if(x&&x.st==='busy') continue; if(x&&x.st==='ok'&&x.rp&&now-Number(x.at)<HP_RP_EVERY) continue; if(HP_RP_AT[a]&&now-HP_RP_AT[a]<((x&&x.st==='err')?HP_RP_RETRY:HP_RP_GAP)) continue;
    const aid=(typeof hpAxAid==='function')?hpAxAid(a):''; if(!aid) continue;
    HP_RP_BUSY=a; HP_RP_AT[a]=now;
    (async()=>{ try{ const r=await hpUpHost({addr:a,aid:aid}); if(r&&r.st==='ok') HP_UP[a]=r; }catch(e){ HP_UP[a]={st:'err',at:Date.now(),why:String((e&&e.message)||e)}; try{ hpLog('評価の移り変わりを読めない '+a.slice(0,8)+'… '+HP_UP[a].why); }catch(_){} }
      finally{ HP_RP_BUSY=''; HP_RP_NEXT=0; try{ if(typeof hpBmUi==='function') hpBmUi(); }catch(_){} } })();
    return true; }
  HP_RP_NEXT=now+300e3; return false; }
try{ if(typeof hpUpHost==='function'&&!hpUpHost.__rp){ const f=hpUpHost; hpUpHost=Object.assign(async function(h){ const r=await f.apply(this,arguments); try{ if(r&&r.rp&&h&&h.addr) HP_RP_LAST[h.addr]=r.rp; }catch(e){} return r; },f,{__rp:1}); } }catch(e){}

const HP_AF_DOWN=3600e3, HP_AF_GAP=864e5, HP_AF_RETRY=1800e3, HP_AF_TRY=4, HP_AF_EVERY=60e3, HP_AF_PEND=6*3600e3, HP_AF_TELL_EVERY=900e3, HP_AF_TELL_MAX=4, HP_AF_STEP_MAX=180e3, HP_AF_NONE_LOG=6*3600e3;
let HP_AF_BUSY=false, HP_AF_CK=0, HP_AF_TELL=false, HP_AF_DN=0, HP_AF_DT=0, HP_AF_NONE_AT=0;
function hpAfGet(){ try{ if(typeof ID==='undefined'||!ID) return null; if(!ID.af||typeof ID.af!=='object'||Array.isArray(ID.af)) ID.af={on:1}; return ID.af; }catch(e){ return null; } }
function hpAfOn(){ const a=hpAfGet(); return !!(a&&a.on!==0); }
function hpAfSet(on){ const a=hpAfGet(); if(!a) return false; a.on=on?1:0; try{ saveID(); }catch(e){} try{ hpLog(on?'自動の移設を入れた':'自動の移設を切った'); }catch(e){} return true; }
function hpAfBase(u){ if(typeof hpOpOf==='function') return hpOpOf(u);   const h=((/^wss:\/\/([^:\/]+)/i.exec(String(u||''))||[])[1]||'').toLowerCase().split('.').filter(Boolean); return h.slice(-2).join('.'); }
function hpAfRole(){ try{ if(typeof hpIsMain==='function'&&hpIsMain()) return 'main'; if(typeof hpObOwn==='function'&&hpObOwn()) return 'own'; }catch(e){} return ''; }
function hpAfStop(){ try{ return !!((typeof hpKillMe==='function'&&hpKillMe())||(typeof HP_TAB_OFF!=='undefined'&&HP_TAB_OFF)); }catch(e){ return false; } }
function hpAfDownStep(now){
  now=now||Date.now(); const gap=HP_AF_DT?now-HP_AF_DT:0; HP_AF_DT=now; let up=false, off=false, idle=false;
  try{ up=!!(typeof POST!=='undefined'&&POST&&POST.up&&!POST.notOwner); }catch(e){}
  try{ idle=(typeof BG_ON!=='undefined'&&!BG_ON)||hpAfStop(); }catch(e){}
  if(up||idle){ HP_AF_DN=0; return 0; }
  try{ off=(typeof navigator!=='undefined'&&!!navigator&&navigator.onLine===false)||(typeof POST!=='undefined'&&!!POST&&!!POST.waitVis); }catch(e){}
  if(!off&&gap>0&&gap<=HP_AF_STEP_MAX) HP_AF_DN+=gap;
  return HP_AF_DN; }
function hpAfWhy(now){
  now=now||Date.now(); const a=hpAfGet(); if(!a) return 'id'; if(a.on===0) return 'off';
  if(!hpAfRole()) return 'role';
  if(!String((typeof hpPostUrl==='function'&&hpPostUrl())||'')) return 'nobox'; if(hpAfStop()) return 'stop';
  try{ if(typeof navigator!=='undefined'&&navigator&&navigator.onLine===false) return 'offline'; }catch(e){}
  if(HP_AF_DN<HP_AF_DOWN) return 'up';
  if(Number(a.last)>0&&now-Number(a.last)<HP_AF_GAP) return 'day';
  if(Number(a.lastTry)>0&&now-Number(a.lastTry)<HP_AF_RETRY) return 'wait';
  if((typeof ID!=='undefined'&&ID&&(ID.rentJob||ID.boxJob))||(typeof HP_MOVE!=='undefined'&&HP_MOVE)||(typeof HP_SWAP!=='undefined'&&HP_SWAP)||(typeof hpMvBusy==='function'&&hpMvBusy())||(typeof HP_AD_BUSY!=='undefined'&&HP_AD_BUSY)||(typeof HP_AX_GO!=='undefined'&&HP_AX_GO)) return 'job';
  return ''; }
function hpAfNm(s){ try{ return (typeof hpBcName==='function')?hpBcName(String(s||'')):String(s||''); }catch(e){ return String(s||''); } }
function hpAfName(d){ try{ return (typeof hpAxLabel==='function')?String(hpAxLabel(d)):String((d&&(d.label||d.dev))||'').slice(0,16); }catch(e){ return String((d&&d.dev)||'').slice(0,10); } }
function hpAfCands(now){
  now=now||Date.now(); const cur=String((typeof hpPostUrl==='function'&&hpPostUrl())||''), m={}, L=(typeof hpLbGet==='function')?hpLbGet():{};
  for(const u of Object.keys(L)){ const x=L[u]; if(!x) continue; m[u]={url:u,acct:x.a||'',tok:x.t||'',exp:Number(x.e)||0,host:x.h||'',src:'book'}; }
  try{ if(typeof HP_AX!=='undefined'&&HP_AX&&Array.isArray(HP_AX.rows)) for(const r of HP_AX.rows){ if(!r||!r.url||r.amb) continue; const o=m[r.url]||{}; m[r.url]=Object.assign({},o,{url:r.url,acct:r.acct||o.acct||'',tok:r.tok||o.tok||'',exp:Number(r.exp)||o.exp||0,host:r.host||o.host||'',buy:r.buy||0,dom:r.dom||'',src:o.src?'both':'ax'}); } }catch(e){}
  let old=''; try{ const o=(typeof hpOldGet==='function')?hpOldGet():null; old=String((o&&o.url)||''); }catch(e){}
  const cb=hpAfBase(cur), out=[];
  for(const u of Object.keys(m)){ const r=m[u]; if(!u||u===cur||u===old||!hpAxUrlOk(u)) continue; if(!(Number(r.exp)-now>=HP_AX_MIN*864e5)) continue;
    const us=hpAxUsers(u); if(us.me) continue;
    let cap=null; try{ cap=(typeof hpAxCap==='function'&&typeof HP_AX_PB!=='undefined'&&HP_AX_PB)?hpAxCap(r,HP_AX_PB[u]):null; }catch(e){} if(cap&&cap.full) continue;
    const sib=us.sibs.map(hpAfName);
    const rp=(r.host&&typeof hpRpData==='function')?hpRpData(r.host):null, rs=rp?hpRpSum(rp,now):null, rv=(rs&&rs.now>=0)?rs.now:((r.host&&typeof hpRpCurOf==='function')?hpRpCurOf(r.host):-1), x=(r.host&&typeof HP_UP!=='undefined'&&HP_UP)?HP_UP[r.host]:null;
    out.push(Object.assign({},r,{shr:sib.length?1:0,sib:sib,diff:hpAfBase(u)!==cb?1:0,rep:rv,repOk:(rv<0||rv>=HP_RP_LOW)?1:0,up:(x&&x.st==='ok')?Number(x.pct)||0:-1})); }
  return out.sort((a,b)=>(a.shr-b.shr)||(b.diff-a.diff)||(b.repOk-a.repOk)||(b.up-a.up)||(b.exp-a.exp)||a.url.localeCompare(b.url)); }
async function hpAfPick(C){
  const out=[]; let full=0;
  const fb=new Set(); try{ for(const u of ((typeof hpFbUrls==='function'&&hpFbUrls())||[])) fb.add(String(u)); }catch(e){}
  const busy=()=>(typeof HP_BX_BUSY!=='undefined'&&HP_BX_BUSY)||(typeof HP_FB_BUSY!=='undefined'&&HP_FB_BUSY)||(typeof HP_OLD_BUSY!=='undefined'&&HP_OLD_BUSY);
  for(const r of C.slice(0,HP_AF_TRY)){ let p=null, lock=false, skip=false;
    try{ if(fb.has(r.url)){ for(let j=0;j<240&&busy();j++) await sleep(250); if(busy()){ skip=true; throw new Error('busy'); } if(typeof HP_BX_BUSY!=='undefined'){ HP_BX_BUSY=true; lock=true; } } p=await hpAxProbe(r.url,{ver:true}); }catch(e){ p={st:'down'}; } finally{ if(lock) HP_BX_BUSY=false; }
    if(skip) continue;
    try{ if(typeof HP_AX_PB!=='undefined'&&HP_AX_PB) HP_AX_PB[r.url]=Object.assign({},p,{at:Date.now()}); }catch(e){}
    if(!(p&&p.st==='ok')) continue; let cap=null; try{ cap=(typeof hpAxCap==='function')?hpAxCap(r,p):null; }catch(e){} if(cap&&cap.full){ full++; continue; }
    out.push({r:r,p:p,ug:p.upg==='old'?0:1}); }
  out.full=full; return out.sort((a,b)=>(a.r.shr-b.r.shr)||(b.r.diff-a.r.diff)||(b.ug-a.ug)||(b.r.repOk-a.r.repOk)||(b.r.up-a.r.up)||(b.r.exp-a.r.exp)); }
function hpAfHost(u){ return String(u||'').replace(/^wss:\/\//,''); }
async function hpAfRun(why){
  if(HP_AF_BUSY) return {why:'busy'}; const now=Date.now(), w=hpAfWhy(now); if(w) return {why:w};
  HP_AF_BUSY=true; const a=hpAfGet(), role=hpAfRole(), from=String((typeof hpPostUrl==='function'&&hpPostUrl())||''), fol=hpAxUsers(from).sibs.map(d=>d.dev);
  try{ const C=hpAfCands(now);
    if(!C.length){ a.lastTry=Date.now(); try{ saveID(); }catch(e){} if(!HP_AF_NONE_AT||Date.now()-HP_AF_NONE_AT>=HP_AF_NONE_LOG){ HP_AF_NONE_AT=Date.now(); hpLog('ふだんの郵便受け（'+hpAfHost(from)+'）につながらないが、自動の移設先が無い（借りてある郵便受けのうち、残り '+HP_AX_MIN+' 日以上で、自分の端末がみな入りきるもの）'); } return {why:'none'}; }
    const nU=C.filter(x=>!x.shr).length; hpLog('ふだんの郵便受け（'+hpAfHost(from)+'）に '+Math.round(HP_AF_DN/60e3)+' 分つながらない。借りてある郵便受け '+C.length+' か所（だれも使っていない '+nU+'・ほかの端末が使っている '+(C.length-nU)+'）から自動の移設先を探す');
    let full=0, conn=0;
    for(const G of [C.filter(x=>!x.shr),C.filter(x=>x.shr)]){ if(!G.length) continue;
      const P=await hpAfPick(G); full+=Number(P.full)||0; conn+=P.length;
      for(const x of P){ const r=x.r; let res=null;
        try{ res=role==='main'?await hpAxMoveMain(r):await hpAdUse(r.url); }catch(e){ res={why:'other',e:String((e&&e.message)||e).slice(0,80)}; }
        if(res&&res.ok){ if(role!=='main'){ try{ if(typeof hpAxKeep==='function') hpAxKeep(r); }catch(e){} }
          const shr=!!r.shr, sib=(Array.isArray(r.sib)?r.sib:[]).join('・'), hh={at:Date.now(),from:from,to:r.url}; if(shr) hh.sib=sib;
          a.last=hh.at; delete a.lastTry; a.hist=(Array.isArray(a.hist)?a.hist:[]).concat([hh]).slice(-10);
          if(role==='main'&&fol.length) a.pend={from:from,to:r.url,fol:fol,at:a.last,k:0,n:0}; try{ saveID(); }catch(e){}
          const f=hpAfHost(from), t=hpAfHost(r.url); hpLog('自動で移設した（'+f+' → '+t+(shr?'。自分のほかの端末（'+sib+'）も使っている郵便受け':'')+'。'+(why||'見回り')+'）'+(fol.length?'。同じ郵便受けを使っていた端末 '+fol.length+' 台へは、新しい郵便受けにつながってから、ほかの郵便受けを通して知らせる':''));
          try{ if(typeof hpNote==='function'){ if(shr) hpNote('afmove2',{f:f,t:t,d:hpAfNm(sib)},'afmove:'+a.last); else hpNote('afmove',{f:f,t:t},'afmove:'+a.last); } }catch(e){}
          try{ if(typeof hpToast==='function') hpToast(shr?TF('af_moved2',{t:t,d:hpAfNm(sib)}):TF('af_moved',{t:t}),8000); }catch(e){}
          try{ hpAfUi(); }catch(e){} return {ok:1,to:r.url}; }
        hpLog('自動の移設：'+hpAfHost(r.url)+' へは移せない（'+((res&&res.why)||'?')+((res&&res.e)?' '+res.e:'')+'）。次を試す'); }
    }
    a.lastTry=Date.now(); try{ saveID(); }catch(e){}
    if(!conn){ hpLog(full?'自動の移設先にはつながったが、自分の端末がみな入りきらない（'+full+' か所）。30 分あけてもう一度見る':'自動の移設先にどれもつながらない（この端末の回線の不調かもしれないので移設しない）。30 分あけてもう一度見る'); return {why:full?'full':'none'}; }
    return {why:'fail'}; }
  catch(e){ try{ a.lastTry=Date.now(); saveID(); }catch(_){} return {why:'other',e:String((e&&e.message)||e).slice(0,80)}; }
  finally{ HP_AF_BUSY=false; } }
async function hpAfTellLodgers(P){
  const s=(typeof ID!=='undefined'&&ID)?ID.postSig:null; if(!s||s.url!==P.to||!(Number(s.ts)>0)||typeof s.sig!=='string') return 0;
  if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||POST.url!==P.to) return 0;
  const me=await hp5Me(), now=Date.now(), devices=[], devSigs={}, prekeys=[];
  for(const d of hpSibs()){ if(!d||(P.fol||[]).indexOf(d.dev)<0) continue; if(!hpPreValid(d.pre,d.dev,now)||!(await hp5IdOk(me.id,me.master,d.dev,d.devSig))) continue;
    devices.push(d.dev); devSigs[d.dev]=d.devSig; prekeys.push({dev:d.dev,x25519:d.pre.x25519,notAfter:d.pre.notAfter,sig:d.pre.sig}); }
  if(!devices.length) return 0;
  const urls=((typeof hpFbUrls==='function')?hpFbUrls():[]).filter(u=>u&&u!==P.to&&u!==P.from), body=JSON.stringify({v:1,type:'sibmv',url:s.url,ts:s.ts,sig:s.sig}); let n=0;
  for(const u of urls){ const token=JSON.parse(hpIssue(3600e3)), card={v:3,id:me.id,master:me.master,post:[u],devices:devices,devSigs:devSigs,token:token,prekeys:prekeys,boxes:devices.map(d=>({dev:d,post:u,token:token}))};
    try{ await hpPut(card,body,'msg'); n++; }catch(e){ hpLog('移設の知らせを '+hpAfHost(u)+' に入れられない（'+String((e&&e.message)||e).slice(0,60)+'）'); } }
  return n; }
function hpAfPendTick(now){
  now=now||Date.now(); const a=hpAfGet(), P=a&&a.pend; if(!P||HP_AF_TELL) return '';
  if(now-Number(P.at)>HP_AF_PEND||Number(P.k)>=HP_AF_TELL_MAX){ delete a.pend; try{ saveID(); }catch(e){} return 'end'; }
  if(Number(P.tAt)>0&&now-Number(P.tAt)<HP_AF_TELL_EVERY) return 'wait';
  if(typeof POST==='undefined'||!POST||!POST.up||POST.notOwner||POST.url!==P.to) return 'conn';
  HP_AF_TELL=true; P.tAt=now; P.k=(Number(P.k)||0)+1; try{ saveID(); }catch(e){}
  hpAfTellLodgers(P).then(n=>{ P.n=(Number(P.n)||0)+n; try{ saveID(); }catch(e){} if(n) hpLog('同じ郵便受けを使っていた端末 '+(P.fol||[]).length+' 台へ、自分のほかの郵便受け '+n+' か所を通して移設の知らせを入れた（'+P.k+' 回目）'); })
    .catch(e=>{ try{ hpLog('移設の知らせを出せない（'+String((e&&e.message)||e).slice(0,60)+'）'); }catch(_){} }).finally(()=>{ HP_AF_TELL=false; });
  return 'go'; }
function hpAfTick(now){
  now=now||Date.now(); try{ hpAfDownStep(now); }catch(e){} try{ hpAfPendTick(now); }catch(e){} if(now-HP_AF_CK<HP_AF_EVERY) return ''; HP_AF_CK=now;
  try{ hpAfUi(); }catch(e){} const w=hpAfWhy(now); if(w) return w; hpAfRun('つながらない').catch(()=>{}); return 'go'; }
function hpAfDate(ms){ const d=new Date(Number(ms)||0), p=n=>String(n).padStart(2,'0'), s=(typeof hpDateIntl==='function')?hpDateIntl(d.getTime(),'mdhm'):''; if(s) return s; return (d.getMonth()+1)+'/'+d.getDate()+' '+p(d.getHours())+':'+p(d.getMinutes()); }
function hpAfUi(){
  try{ if(typeof document==='undefined'||!document.getElementById) return false; const card=document.getElementById('post-move'); if(!card) return false; let row=document.getElementById('af-row');
    if(!hpAfRole()){ if(row) row.style.display='none'; return false; }
    if(!row){ row=document.createElement('div'); row.id='af-row'; row.className='note'; row.style.cssText='margin-top:10px;line-height:1.5';
      const lb=document.createElement('label'); lb.style.cssText='display:flex;gap:6px;align-items:flex-start;cursor:pointer'; const cb=document.createElement('input'); cb.type='checkbox'; cb.id='af-on'; cb.style.marginTop='3px';
      cb.addEventListener('change',()=>{ hpAfSet(!!cb.checked); hpAfUi(); }); const sp=document.createElement('span'); sp.id='af-on-t'; lb.appendChild(cb); lb.appendChild(sp); row.appendChild(lb);
      const cd=document.createElement('div'); cd.id='af-cand'; cd.style.cssText='margin-top:2px'; row.appendChild(cd);
      const op=document.createElement('div'); op.id='af-op'; op.style.cssText='margin-top:2px;color:var(--amber);white-space:pre-line;display:none'; row.appendChild(op);
      const st=document.createElement('div'); st.id='af-st'; st.style.cssText='margin-top:2px'; row.appendChild(st); card.appendChild(row); }
    row.style.display=''; const on=hpAfOn(), cb=document.getElementById('af-on'), sp=document.getElementById('af-on-t'), cd=document.getElementById('af-cand'), st=document.getElementById('af-st'); if(cb) cb.checked=on; if(sp) sp.textContent=T('af_on');
    let C=[]; try{ C=hpAfCands(); }catch(e){}
    if(cd){ const n=C.filter(x=>!x.shr).length, m=C.length-n;
      cd.textContent=(n&&m)?TF('af_cand2',{n:n,m:m}):n?TF('af_cand',{n:n}):m?TF('af_cand3',{m:m}):TF('af_none',{d:HP_AX_MIN}); cd.style.display=on?'':'none'; }
    { const oe=document.getElementById('af-op'); if(oe){ let L=[]; try{ L=(on&&typeof hpOpAfLines==='function')?hpOpAfLines(C):[]; }catch(e){ L=[]; } oe.textContent=L.join('\n'); oe.style.display=L.length?'':'none'; } }
    const a=hpAfGet(), h=(a&&Array.isArray(a.hist)&&a.hist.length)?a.hist[a.hist.length-1]:null;
    if(st){ st.textContent=!h?'':h.sib?TF('af_last2',{t:hpAfDate(h.at),f:hpAfHost(h.from),u:hpAfHost(h.to),d:hpAfNm(h.sib)}):TF('af_last',{t:hpAfDate(h.at),f:hpAfHost(h.from),u:hpAfHost(h.to)}); st.style.display=h?'':'none'; }
    return true; }catch(e){ return false; } }
try{ if(typeof HP_NT_TXT!=='undefined'&&HP_NT_TXT){ if(!HP_NT_TXT.afmove) HP_NT_TXT.afmove=['ntc_afmove','ntd_afmove']; if(!HP_NT_TXT.afmove2) HP_NT_TXT.afmove2=['ntc_afmove2','ntd_afmove2'];
  if(typeof HP_NT_KINDS!=='undefined'&&Array.isArray(HP_NT_KINDS)) for(const k of ['afmove','afmove2']) if(HP_NT_KINDS.indexOf(k)<0) HP_NT_KINDS.push(k); } }catch(e){}
try{ if(typeof window!=='undefined'&&typeof document!=='undefined'&&document&&typeof document.addEventListener==='function'&&typeof setInterval==='function') setInterval(()=>{ try{ hpAfTick(); }catch(e){} },15e3); }catch(e){}

const HP_OP_SLD='co,com,net,org,ne,or,ac,ad,ed,go,gr,lg,gov,edu,mil,ltd,plc,me,sch,asn,id,info,biz,firm,gen,ind,per,web,nom,nic,res,int,pro,priv'.split(',');
const HP_OP_SHARE='duckdns.org,ddns.net,hopto.org,zapto.org,sytes.net,no-ip.org,no-ip.biz,ddnsfree.com,ddnsgeek.com,dynu.net,freeddns.org,mywire.org,dynv6.net,dyndns.org,freemyip.com,afraid.org,mooo.com,nip.io,sslip.io,ngrok.io,ngrok-free.app,trycloudflare.com,synology.me,myds.me,myqnapcloud.com,tplinkdns.com,asuscomm.com,myfritz.net,ddnss.de,spdns.de,freeboxos.fr'.split(',');
function hpOpOf(u){
  try{ const m=/^(?:wss?:\/\/)?([^:\/\s]+)/i.exec(String(u||'').trim()); const h=m?m[1].toLowerCase().replace(/\.+$/,''):''; if(!h) return '';
    if(/^\d{1,3}(\.\d{1,3}){3}$/.test(h)) return h;
    const L=h.split('.').filter(Boolean); if(L.length<=2) return L.join('.');
    for(const s of HP_OP_SHARE){ if(h===s) return h; if(h.endsWith('.'+s)) return L.slice(-(s.split('.').length+1)).join('.'); }
    const tld=L[L.length-1], sld=L[L.length-2]; if(tld.length===2&&HP_OP_SLD.indexOf(sld)>=0) return L.slice(-3).join('.');
    return L.slice(-2).join('.'); }catch(e){ return ''; } }
function hpOpUse(){
  const U=new Set(); try{ const me=String((typeof hpPostUrl==='function'&&hpPostUrl())||''); if(me) U.add(me);
    for(const d of (typeof hpSibs==='function'?hpSibs():[])){ if(!d||!d.devSig) continue; let b=''; try{ b=String((typeof hpMcBoxOf==='function'&&hpMcBoxOf(d.dev))||''); }catch(e){} if(b) U.add(b); } }catch(e){}
  const c={}; for(const u of U){ const o=hpOpOf(u); if(o) c[o]=(c[o]||0)+1; } let o='', m=0; for(const k of Object.keys(c)) if(c[k]>m){ m=c[k]; o=k; }
  return {n:U.size,m:m,o:o}; }
function hpOpAfLines(C){
  const out=[]; try{ const co=hpOpOf(String((typeof hpPostUrl==='function'&&hpPostUrl())||''));
    if(co&&Array.isArray(C)&&C.length&&!C.some(x=>x&&hpOpOf(x.url)!==co)) out.push(TF('af_op_same',{o:co}));
    const u=hpOpUse(); if(u.n>=2&&u.m>=2&&u.m*2>u.n) out.push(u.m===u.n?TF('af_op_use_all',{n:u.n,o:u.o}):TF('af_op_use',{n:u.n,m:u.m,o:u.o})); }catch(e){}
  return out; }

