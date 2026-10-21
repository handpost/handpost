const HP_FL_KEEP=14*864e5, HP_FL_PRAISE=6000, HP_FL_SLOW=5000;
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
  const fresh=!!HP_FL_PR&&Date.now()-HP_FL_PR_AT<HP_FL_PRAISE, txt=fresh?HP_FL_PR:TF('fl_band',{n:n,t:T(HP_FL_B[n-1]||'fl_b5')}), key=n+'|'+txt;
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
  for(let i=1;i<=5;i++){ const k=(F.face&&HP_FL_SF[i])||HP_FL_S[i-1], d=hpFlEl('div','fl-s',(i<n?'✓':i===n?'▶':'・')+' '+i+'. '+TF(k,{name:nm}));
    d.style.cssText='margin:6px 0;line-height:1.5'+(i===n?';font-weight:600':i<n?';color:var(--teal)':''); card.appendChild(d); }
  const nt=hpFlEl('div','note',TF('fl_note',{name:nm})); nt.style.whiteSpace='pre-line'; card.appendChild(nt);
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

const HP_UP_EVERY=2400, HP_UP_DAYS=30, HP_UP_PAR=25, HP_UP_N=5, HP_UP_SESS=300e3, HP_UP_STALE=3600e3; let HP_UP={}, HP_UP_RUN=null, HP_UP_TICK=0;
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
    const lhbs=new Set(); let reads=0, fails=0, consec=0;
    for(let s=0;s<times.length;s+=HP_UP_PAR){ await Promise.all(times.slice(s,s+HP_UP_PAR).map(async T=>{ for(let k=0;k<2;k++){ try{ const r=await q({command:'ledger_entry',hook_state:{account:HP_GOV,key:KEY,namespace_id:HP_EVN_NS},ledger_index:idxAt(T)}); const d=String((r&&r.node&&r.node.HookStateData)||''); if(d.length<200) throw new Error('form');
        const v=hpHexLE(d,92,8); if(v>0) lhbs.add(v); reads++; consec=0; return; }catch(e){ if(k===1||/NotFound|form|closed/.test(String((e&&e.message)||e))){ fails++; consec++; return; } await new Promise(r=>setTimeout(r,800)); } } }));
      if(consec>=HP_UP_PAR*2) throw new Error('read '+fails); try{ if(onProg) onProg(Math.min(s+HP_UP_PAR,times.length),times.length); }catch(e){} }
    return {t0:t0,cur:cur,lhbs:[...lhbs],reads:reads,fails:fails,oldest:oldest?oldest.t:0,C:C}; },HP_UP_SESS); }
function hpUpMerge(R,old){ const C=R.C, cur=R.cur, N=Math.round(HP_UP_DAYS*86400/C.size), first=cur-N, seen=new Set(R.lhbs.map(t=>hpMomNow(C,t*1000)));
  const fromM=R.readFrom!==undefined?R.readFrom:first; let bits=''; for(let m=first;m<cur;m++){ if(m<fromM){ bits+=(old&&old.bits&&m>=old.first&&m<old.cur)?old.bits[m-old.first]:'?'; } else if(R.oldest&&hpMomStart(m,C)/1000<R.oldest) bits+='?'; else bits+=seen.has(m)?'1':'0'; }
  return {first:first,cur:cur,bits:bits}; }
function hpUpSum(B,C){ const n=B.bits.length; let have=0, unread=0, gaps=[], run=0;
  for(let k=0;k<n;k++){ const c=B.bits[k]; if(c==='?'){ unread++; continue; } if(c==='1'){ have++; if(run){ gaps.push([B.first+k-run,run]); run=0; } } else run++; } if(run) gaps.push([B.cur-run,run]);
  const N=n-unread, last=gaps.length?gaps[gaps.length-1]:null; return {pct:N>0?Math.round(have/N*1000)/10:0,have:have,n:N,gaps:gaps,last:last?{t:hpMomStart(last[0],C),h:Math.round(last[1]*C.size/3600*10)/10}:null}; }
async function hpUpHost(h,onProg){ const addr=h.addr, k='up:'+addr; let old=null; try{ old=await HP_HS_CACHE.get(k); }catch(e){} const C0=await hpMomCfg(); const nowM=hpMomNow(C0);
  let from=0, readFrom; if(old&&old.bits&&Number(old.cur)>0&&nowM-old.cur<HP_UP_DAYS*86400/C0.size){ readFrom=old.cur-1; from=hpMomStart(readFrom,C0)/1000-HP_UP_EVERY; } else old=null;
  const t0=Date.now(), R=await hpUpRead(h.aid,from,onProg); if(readFrom!==undefined) R.readFrom=readFrom; const B=hpUpMerge(R,old), S=hpUpSum(B,R.C);
  try{ await HP_HS_CACHE.put(k,{at:R.t0*1000,first:B.first,cur:B.cur,bits:B.bits}); }catch(e){}
  try{ log(TL('lg_up_ok',{dom:hpUpName(h),u:S.pct,r:R.reads,s:Math.round((Date.now()-t0)/1000),f:R.fails,o:old?'続き':'全部'})); }catch(e){}
  return Object.assign({st:'ok',at:Date.now(),reads:R.reads,fails:R.fails,cont:!!old},S); }
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
  a.push(x.last?TF('fl_4_gap',{d:hpUpDate(x.last.t),h:x.last.h}):T('fl_4_nogap')); a.push(TF('fl_4_rep',{r:h.rep==null?'—':h.rep})); a.push(T(h.active?'hs_st_on':'hs_st_off')); if(h.regTs) a.push(TF('fl_4_age',{ym:hpUpYm(h.regTs*1000)})); return a.join('・'); }
function hpUpDate(ms){ const d=new Date(ms); return (d.getMonth()+1)+'/'+d.getDate(); }
function hpUpYm(ms){ const d=new Date(ms); return d.getFullYear()+'/'+(d.getMonth()+1); }
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
  return (x.n<Math.round(HP_UP_DAYS*86400/hpUpSize())?TF('fl_4_up_part',{u:x.pct,n:x.n}):TF('fl_4_up',{u:x.pct}))+'・'+(x.last?TF('fl_4_gap',{d:hpUpDate(x.last.t),h:x.last.h}):T('fl_4_nogap')); }
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
function hpHsUpCell(h){ if(!h||!h.aid) return '—'; const x=HP_UP[h.addr]; if(!x) return '—'; if(x.st==='busy') return '…'+(x.total?Math.round(x.done/x.total*100)+'％':''); if(x.st!=='ok') return T('hs_up_no'); return (Number(x.pct)||0).toFixed(1)+'％'; }
function hpHsUpVal(h){ const x=h&&HP_UP[h.addr]; return (x&&x.st==='ok')?Number(x.pct)||0:null; }
function hpHsUpPut(addr){ try{ if(!addr) return false; const tr=document.querySelector('#hs-list tr[data-addr="'+addr+'"]'); const td=tr&&tr.querySelector('td[data-up]'); if(!td) return false; const h=HP_HOSTS.hosts.find(x=>x.addr===addr); td.textContent=hpHsUpCell(h); const x=HP_UP[addr]; td.title=(x&&x.st==='ok')?hpUpText(h):''; return true; }catch(e){ return false; } }
function hpHsUpBtn(){ try{ const b=document.getElementById('btn-hs-up'); if(!b) return false; if(HP_HS_UP_RUN){ b.disabled=true; return true; } const n=hpHsUpNeed(hpHsUpRows()).length; b.disabled=!n; b.textContent=n?TF('btn_hs_up',{n:n,s:n*2}):T('hs_up_done'); return true; }catch(e){ return false; } }
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
  HP_HS_UP_RUN=(async()=>{ let k=0; for(const h of list){ k++; try{ if(b){ b.disabled=true; b.textContent=TF('hs_up_busy',{k:k,n:list.length}); } }catch(e){} if(hpUpFresh(HP_UP[h.addr])||(HP_UP[h.addr]&&HP_UP[h.addr].st==='busy')) continue;
      HP_UP[h.addr]={st:'busy',k:1,n:1,done:0,total:0}; hpHsUpPut(h.addr);
      try{ HP_UP[h.addr]=await hpUpHost(h,(d,t)=>{ const u=HP_UP[h.addr]; if(u&&u.st==='busy'){ u.done=d; u.total=t; } hpHsUpPut(h.addr); }); }
      catch(e){ HP_UP[h.addr]={st:'err',at:Date.now(),why:String((e&&e.message)||e)}; try{ log(TL('lg_up_fail',{dom:hpUpName(h),why:HP_UP[h.addr].why})); }catch(_){} }
      hpHsUpPut(h.addr); try{ if(typeof HP_HS_PICK!=='undefined'&&HP_HS_PICK===h.addr) hpUpPut(h); }catch(e){} }
    return k; })();
  let n=0; try{ n=await HP_HS_UP_RUN; } finally{ HP_HS_UP_RUN=null; }
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
    for(const d of (typeof hpSibs==='function'?hpSibs():[])){ if(!d||!d.devSig) continue;   let b=''; try{ b=String((typeof hpMcBoxOf==='function'&&hpMcBoxOf(d.dev))||''); }catch(e){} if(b===u) return 'sib:'+(d.label||String(d.dev||'').slice(0,10)); }
    return ''; }catch(e){ return 'other'; } }
async function hpAdProbe(url){
  let c=null; const out=[];
  try{ const kp=await hpDevKey(); c=await HotPocket.createClient([url], kp);
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
  if(!(typeof hpBfOn==='function'&&hpBfOn())) return {why:'notsub'};
  const w=hpAdCheck(u); if(w) return {why:w};
  HP_AD_BUSY=true; let lock=false;
  try{ for(let i=0;i<120&&((typeof HP_BX_BUSY!=='undefined'&&HP_BX_BUSY)||(typeof HP_FB_BUSY!=='undefined'&&HP_FB_BUSY));i++) await sleep(250);
    if(typeof HP_BX_BUSY!=='undefined'){ HP_BX_BUSY=true; lock=true; }
    hpLog('前に借りた郵便受け（'+u+'）を確かめる（この端末の鍵でつないで名乗る）');
    const r=await hpAdProbe(u);
    if(!r.ok){ hpLog('前に借りた郵便受け（'+u+'）は使えない（'+r.why+(r.e?' '+r.e:'')+'）。何も替えていない'); return r; }
    hpLog('前に借りた郵便受け（'+u+'）に名乗れた（本体の版 '+(r.pv||'?')+'）');
    if(lock){ HP_BX_BUSY=false; lock=false; }
    hpAdSwitch(u); return {ok:1, pv:r.pv};
  }catch(e){ return {why:'other', e:String((e&&e.message)||e).slice(0,80)}; }
  finally{ if(lock) HP_BX_BUSY=false; HP_AD_BUSY=false; } }
function hpAdWhy(r){ const w=String((r&&r.why)||'');
  if(w==='url') return T('ad_e_url'); if(w==='cur') return T('ad_e_cur'); if(w.indexOf('sib:')===0) return TF('ad_e_sib',{n:w.slice(4)||'?'});
  if(w==='owner exists') return T('ad_e_owner'); if(w==='removed') return T('ad_e_removed'); if(w==='too many devices') return T('ad_e_full');
  if(w==='bad sig'||w==='bad claim') return T('ad_e_sig'); if(w==='killed') return T('ad_e_killed'); if(w==='down') return T('ad_e_down'); if(w==='noreply') return T('ad_e_noreply');
  if(w==='busy') return T('ad_checking'); if(w==='notsub') return T('ad_e_notsub');
  return TF('ad_e_other',{e:(r&&r.e)||w||'?'}); }
function hpAdUi(c){
  try{ if(!c||!c.querySelector) return false; const on=typeof hpBfOn==='function'&&hpBfOn(); let row=c.querySelector('#bf-adopt');
    if(!on){ if(row&&row.parentNode) row.parentNode.removeChild(row); return false; }
    if(row) return true;
    row=hpFlEl('div',''); row.id='bf-adopt'; row.style.cssText='margin-top:8px';
    const f=hpFlEl('div',''); f.id='bf-adopt-form'; f.style.cssText='display:none;margin-top:8px';
    const r1=hpFlEl('div','row'); r1.style.cssText='justify-content:flex-start'; const ob=hpFlBtn('btn_ad_open',()=>{ f.style.display=(f.style.display==='none')?'':'none'; }); ob.id='btn-ad-open'; r1.appendChild(ob); row.appendChild(r1);
    const nt=hpFlEl('div','note',T('ad_note')); nt.style.cssText='white-space:pre-line;line-height:1.5'; f.appendChild(nt);
    const inp=document.createElement('input'); inp.id='bf-adopt-url'; inp.type='text'; inp.placeholder=T('ad_ph'); inp.setAttribute('autocomplete','off'); inp.setAttribute('autocapitalize','off'); inp.setAttribute('spellcheck','false'); inp.style.cssText='width:100%;margin-top:6px'; f.appendChild(inp);
    const st=hpFlEl('div','note',''); st.id='bf-adopt-st'; st.style.cssText='margin-top:6px;white-space:pre-line;line-height:1.5';
    const r2=hpFlEl('div','row'); r2.style.cssText='margin-top:8px;justify-content:flex-start';
    let ub=null, cb=null;
    ub=hpFlBtn('btn_ad_use',async()=>{ ub.disabled=true; cb.disabled=true; st.style.color=''; st.textContent=T('ad_checking');
        let r=null; try{ r=await hpAdUse(inp.value); }catch(e){ r={why:'other',e:String((e&&e.message)||e)}; } ub.disabled=false; cb.disabled=false;
        if(r&&r.ok){ st.style.color='var(--teal)'; st.textContent=TF('ad_ok',{h:String(inp.value).trim().replace(/^wss:\/\//,'')})+(((typeof hpLeaseAcct==='function')&&hpLeaseAcct())?'':'\n'+T('ad_lease_nt')); }
        else { st.style.color='var(--amber)'; st.textContent=hpAdWhy(r); } },true); ub.id='btn-ad-use';
    cb=hpFlBtn('btn_ad_cancel',()=>{ f.style.display='none'; st.textContent=''; }); cb.id='btn-ad-cancel'; cb.style.cssText='margin-left:8px';
    r2.appendChild(ub); r2.appendChild(cb); f.appendChild(r2); f.appendChild(st); row.appendChild(f);
    c.appendChild(row); return true; }catch(e){ return false; } }
hpBfDrawClosed=(function(f){ return function(c){ const r=f.apply(this,arguments); try{ hpAdUi(c); }catch(e){} return r; }; })(hpBfDrawClosed);

