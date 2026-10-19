const HP_WORDS=('about absence accept accident account accurate achieve acid acorn actor actual adapter adjust admit adult advance advice afford afraid after agent agree airport alarm album alert algebra almost alone aloud already also'+
  ' '+'amaze amber amount analogy ancient anger angle angry animal answer antique apology appeal apple approach arcade area argue around arrival arrow article atom attempt attract audience author autumn average avoid awake award'+
  ' '+'away baby back badge baggage balance ball banana band bargain barrel base basic basket battery bear beauty became bedroom beef before began behavior believe belong bench benefit best better between beyond bicycle'+
  ' '+'biology bird birth biscuit bite blame blank blow blue board boat body boil book boost bore borrow bother bottle bought bound brake branch break breeze brick bridge brief bright broad broken brown'+
  ' '+'brush bubble bucket budget build bulk bundle burst busy button buyer cabbage cabinet caller calm came capital captain carbon card career carpet carry cartoon cassette castle casual catch caught cause cell cent'+
  ' '+'certain chain chalk chance chapter charge chase cheap check cheer chemical chest chew chicken chief child chip choice choose chord chunk cinema circle civil claim classic clean clever click client cliff climb'+
  ' '+'closet cloth club clumsy cluster coach coal code coffee cold collect color column comedy comfort comic common company concern confirm connect consider contact cookie copper copy corner correct cost cotton count couple'+
  ' '+'course cousin craft crawl create credit cricket crisp critic crowd crunch crystal cube cubic culture current curve customer cycle damp dance dare data daytime deal debate debt decade decision deep defense degree'+
  ' '+'delay deliver demand depth desert design desk detail develop device diagram dialog diary digit dinner direct disc display distant ditch doctor dodge dollar donate door doubt down dozen dragon drama draw dream'+
  ' '+'drift drill drink drop drum duck dust duty eager eagle earth east echo economic edge edit effect effort eight electric elevator employ empty energy engineer enjoy enough enter entry epic episode equal'+
  ' '+'eraser error escape essay event everyone exact example exchange excite excuse exotic expect explain extend extra fabric face factory fail fairy false fancy fantasy farm fashion father favor feature feedback feel felt'+
  ' '+'fence fetch fiber field fierce fifth figure file filter final find finger finish first fish flag flash fleet flight float floor fluent fluffy fluid flute foam folder folk follow food forbid force'+
  ' '+'foreign forget formal forty forum forward fossil four fragile frame free fresh friend frog front frozen fruit full funny fuse future fuzzy gain galaxy garage garden gasoline gave general gentle gesture giant'+
  ' '+'gift girl given glad global glory glossy glove golden golf goodbye gossip grace gradual grammar grand graph gray great green grew grid group growth guard guest guide guitar habit hair half hammer'+
  ' '+'handy hang happy hardware harmony head health heart heavy hello helmet help heroic hidden hide high hill history hobby hole holiday honest honor horizon horn horse hospital hotel huge human humble hungry'+
  ' '+'hunt hurry husband idea idle ignore image import improve inch include info innocent insert inside inspect instead interest invent invite iron island issue item jacket jazz join joke journal judge juice jump'+
  ' '+'jungle junior junk justice keen keeper kept kettle keyboard keyword kingdom knew knight knock label labor ladder lady language large laser late laugh lawn leader leaf league learn leave lecture left legal'+
  ' '+'legend lemon lend length lesson level library life limit link lion liquid listen little load local lock long loop lose lower lucky lunch luxury lyric machine made magic major maker manage manner'+
  ' '+'manual march mark marriage master material maximum mean measure meet melody member memory menu merry messy metal meter method middle midnight mighty milk million mimic mine minimum minor minute mirror mistake mobile'+
  ' '+'model money month moon motor mouse move museum music national nature nearby neck needle network never next nice noisy north note notice novel number nurse object ocean offer office often omit onion'+
  ' '+'open opera opinion orbit order ordinary organ origin outside over owner oxygen package page paid palace panel paper parade pardon parent parrot part path patient peace peak peanut pedal peer pencil penny'+
  ' '+'people perfect period person phone photo physical piano pick picture piece pigeon pipe pizza plan plastic player pleasant plenty plot plug pocket poem poetry point police pool popular pork postal potato powder'+
  ' '+'practice prefer prepare present pretty price printer private problem produce program project proof property proud provide public pulse puncture pupil purchase purpose push puzzle quarter queen queue quick quit rabbit radar radio'+
  ' '+'range rank rapid rattle razor reach ready reason recent recipe record reduce refund regain regular relax relief remember remind remove repair repeat report rescue reset respect restart retire return review reward rhythm'+
  ' '+'ribbon rich risk river robot roll room rope rough route royal rubber rule rumor rusty safe salt sauce scale scan scarf scene school science score scrap screen scroll search seat second secret'+
  ' '+'select self sender sense sentence serve seven shadow shaky shape sharp sheet shell shift shine shop short shower shut sign silent silver similar simple single sister sixth sketch skill skin skirt sleep'+
  ' '+'slice slip slogan slope small smile smith smooth snack snail sneaky snow soap social soft solar solid solo solve someone sorry source south space speaker special speech spend spiral split spoke spot'+
  ' '+'spray spread square staff stage stamp stand start stay steel step stereo stick stir stone stood story strange stream strike strong study stunt style subject subway sudden sugar suggest summer super support'+
  ' '+'sure surface swim switch symbol system tailor take talent talk target taste taxi teacher team teapot teeth thank theme theory thick thin third thought three throw thumb ticket tidy tiger time title'+
  ' '+'toast today tomato tomorrow tongue tonight tooth topic total touch track trade traffic train transfer travel trend tricky trip true trunk trust truth tune tunnel turn tutor twelve twenty twice type typical'+
  ' '+'uncle under undo unique unit unknown unlock unseen until upper urgent user usual vacuum valley value version very video view violin visit visual voice volume waffle wait wallet warn wash water weather'+
  ' '+'week weigh welcome western what wheel when where which while wild window winter wire wisdom with witty wizard woman wombat wonder wooden word worker would wrap write wrong yellow young zero zone').split(' ');
const HP_PAPER_N=14, HP_PAPER_YEAR=365*86400e3;
const HP_WORD_ALIAS={grey:'gray',fibr:'fiber',metr:'meter'};
let HP_WORD_PRE=null;
function hpWordPre(){ if(!HP_WORD_PRE){ HP_WORD_PRE={}; HP_WORDS.forEach((w,i)=>{ HP_WORD_PRE[w.slice(0,4)]=i; }); } return HP_WORD_PRE; }
function hpPaperCheck(p){ const s=hp5S(), h=s.crypto_generichash(32,s.from_string('handpost-paper-check:v1'),p); return (h[0]<<4)|(h[1]>>4); }
function hpPaperEnc(p){
  let v=0n; for(const b of p) v=(v<<8n)|BigInt(b); v=(v<<12n)|BigInt(hpPaperCheck(p));
  const out=[]; for(let i=0;i<HP_PAPER_N;i++){ out.unshift(HP_WORDS[Number(v&1023n)]); v>>=10n; } return out;
}
function hpPaperTokens(text){
  const raw=String(text||'').toLowerCase().normalize('NFKC').split(/[^a-z0-9]+/).filter(t=>t&&!/^[0-9]+$/.test(t));
  const pre=hpWordPre();
  return raw.map(t=>{ let k=t.slice(0,4); if(HP_WORD_ALIAS[k]) k=HP_WORD_ALIAS[k].slice(0,4); return {t,i:(k.length===4&&pre[k]!==undefined)?pre[k]:-1}; });
}
function hpPErr(code,msg){ const e=hpVErr(code,msg); e.hpvMsg=msg; return e; }
function hpPaperParse(text){
  const tk=hpPaperTokens(text);
  if(tk.length!==HP_PAPER_N) throw hpPErr('pcount',TF('pp_e_count',{n:tk.length}));
  const bad=tk.findIndex(x=>x.i<0); if(bad>=0) throw hpPErr('pword',TF('pp_e_word',{n:bad+1,w:tk[bad].t}));
  let v=0n; for(const x of tk) v=(v<<10n)|BigInt(x.i);
  const chk=Number(v&4095n); v>>=12n;
  const p=new Uint8Array(16); for(let i=15;i>=0;i--){ p[i]=Number(v&255n); v>>=8n; }
  if(hpPaperCheck(p)!==chk) throw hpPErr('pcheck',T('pp_e_check'));
  return p;
}

const HP_ED_PKCS8='302e020100300506032b657004220420';
function hpPaperMaster(p){
  const s=hp5S(), seed=s.crypto_generichash(32,s.from_string('handpost-paper-master:v1'),p), kp=s.crypto_sign_seed_keypair(seed);
  const der=new Uint8Array(48); der.set(hpBytes(HP_ED_PKCS8),0); der.set(seed,16);
  return {pub:hpHex(kp.publicKey), pem:bytesToPem(der)};
}
function hpPaperP(){ return (ID&&typeof ID.paper==='string'&&/^[0-9a-f]{32}$/.test(ID.paper))?hpBytes(ID.paper):null; }

function hpPaperShowable(){ return !!(ID&&ID.privateKeyPem&&!ID.paperOk&&hpPaperP()&&!(typeof hpKillMe==='function'&&hpKillMe())); }
function hpPaperFits(){ const p=hpPaperP(); if(!p||!ID.privateKeyPem) return false; try{ return hpPaperMaster(p).pub===ID.publicKey; }catch(e){ return false; } }

function hpPaperPostNorm(v){ let s=String(v||'').trim().toLowerCase().replace(/\/+$/,''); if(s&&/^[0-9]{2,5}$/.test(s)&&typeof hpReDev==='function'&&hpReDev()) s='localhost:'+s;   if(s&&!/^wss?:\/\//.test(s)) s='wss://'+s; return s; }
function hpPaperPostOk(v){ const w=(typeof hpPostUrl==='function')?hpPaperPostNorm(hpPostUrl()):''; return !!w&&hpPaperPostNorm(v)===w; }
function hpPaperState(){
  if(!ID||!ID.privateKeyPem||(typeof hpKillMe==='function'&&hpKillMe())) return 'none';
  if(!hpPaperP()) return 'old';
  if(!ID.paperOk) return 'todo';
  return (Date.now()-ID.paperOk>HP_PAPER_YEAR)?'year':'ok';
}

function hpPaperWK(p,salt){ const s=hp5S(); return hpVWK('paper',s.crypto_generichash(32,hp5Cat(s.from_string('handpost-paper-wrap:v1'),salt),p)); }
function hpPaperWrap(paperHex,dk){ const s=hp5S(), salt=s.randombytes_buf(16); return {k:'paper',salt:hpHex(salt),box:hpVEnc(hpPaperWK(hpBytes(paperHex),salt),dk,'handpost-vault-wrap:v1:paper')}; }
function hpPaperWrapAdd(){
  const m=hpVaultMeta(); if(!m||!VAULT||!VAULT_DK||!hpPaperP()) return false;
  m.wraps=m.wraps.filter(w=>w.k!=='paper'); m.wraps.push(hpPaperWrap(ID.paper,VAULT_DK)); m.at=Date.now();
  localStorage.setItem(HP_VAULT_KEY,JSON.stringify(m)); try{ hpLog('この端末の封に紙の包みを足した'); }catch(e){} return true;
}
async function hpVaultUnlockPaper(text){
  const m=hpVaultMeta(); if(!m||VAULT) return true;
  if(typeof hpReady==='function') await hpReady();
  const p=hpPaperParse(text), s=hp5S(), w=m.wraps.find(x=>x.k==='paper');
  if(!w) throw hpPErr('nopaper',T('pp_e_nowrap'));
  let dk; try{ dk=hpVDec(hpPaperWK(p,hpBytes(w.salt)),w.box,'handpost-vault-wrap:v1:paper'); }catch(e){ throw hpPErr('wrong',T('pp_e_nomatch')); }
  let data; try{ data=JSON.parse(s.to_string(hpVDec(dk,m.data,HP_VAULT_AD))); }catch(e){ throw hpPErr('wrong',T('pp_e_nomatch')); }
  VAULT=data; VAULT_DK=dk; try{ hpLog('鍵を開いた（紙）'); }catch(e){} return true;
}

function hpPaperConfirm(text){
  const p=hpPaperP(); if(!p) return {err:T('pp_old')};
  if(!hpPaperFits()){ try{ hpLog('紙の単語がアカウントの鍵と合わない（紙を作れない）'); }catch(e){} return {err:T('pp_old')}; }
  const want=hpPaperEnc(p), tk=hpPaperTokens(text);
  for(let i=0;i<Math.min(tk.length,HP_PAPER_N);i++){
    if(tk[i].i<0) return {err:TF('pp_e_word',{n:i+1,w:tk[i].t}),n:i+1};
    if(HP_WORDS[tk[i].i]!==want[i]) return {err:TF('pp_e_diff',{n:i+1}),n:i+1};
  }
  if(tk.length!==HP_PAPER_N) return {err:TF('pp_e_count',{n:tk.length})};
  ID.paperOk=Date.now(); delete ID.paperReq; saveID();
  const added=hpVaultOn()?hpPaperWrapAdd():false;
  try{ hpLog('紙のバックアップを確かめた（14 語）'); }catch(e){}
  return {ok:true,vault:added};
}

function hpPaperUiInit(){
  const sec=document.getElementById('p-id'); if(!sec) return;
  if(!document.getElementById('paper-card')){
    const card=document.createElement('div'); card.className='card'; card.id='paper-card';
    card.innerHTML='<h2 data-i18n="pp_title"></h2><div id="paper-state" class="note"></div><div class="row" style="margin-top:8px"><button class="b pri" id="btn-paper"></button></div>';
    const v=document.getElementById('vault-card'), first=sec.querySelector('.card'), after=v||first, kc=document.getElementById('kill-card'), pos=(v&&v.parentNode===sec)?v:((kc&&kc.parentNode===sec)?kc:null);
    if(pos) sec.insertBefore(card,pos);   else sec.insertBefore(card, after?after.nextSibling:sec.firstChild);
    document.getElementById('btn-paper').onclick=()=>{ if(typeof hpPpReady==='function'&&hpPpReady()){ hpPpOpen(); return; }   const st=hpPaperState(); hpPaperFlow(st==='todo'?1:3); };
    try{ applyLang(); }catch(e){}
  }
  hpPaperUi();
}
function hpPaperUi(){
  const E=id=>document.getElementById(id); if(!E('paper-card')) return;
  const st=hpPaperState();
  E('paper-card').style.display=st==='none'?'none':'';
  const d=(ID&&ID.paperOk)?new Date(ID.paperOk).toLocaleDateString():'';
  E('paper-state').textContent=st==='old'?T('pp_old'):st==='todo'?T('pp_todo'):st==='year'?T('pp_year'):st==='ok'?TF('pp_ok',{d:d}):'';
  E('paper-state').style.color=(st==='ok')?'var(--teal)':'var(--amber)';
  E('btn-paper').style.display=(st==='todo'||st==='ok'||st==='year')?'':'none';
  E('btn-paper').textContent=T(st==='todo'?'btn_pp_make':'btn_pp_check');
  { let b2=E('btn-paper2'); if(!b2){ b2=document.createElement('button'); b2.className='b warn'; b2.id='btn-paper2'; E('btn-paper').parentNode.appendChild(b2); }
    const q=hpPpReq();
    if(q&&(st==='ok'||st==='year')){ const rd=hpPpReady(); E('paper-state').textContent=rd?T('pp_req_ready'):TF('pp_req_wait',{t:fmtTS(q.until)}); E('paper-state').style.color='var(--amber)';
      E('btn-paper').style.display=rd?'':'none'; E('btn-paper').textContent=T('btn_pp_open'); b2.textContent=T('btn_pp_cancelreq'); b2.style.display=''; b2.onclick=()=>{ hpPpCancel('この端末で'); }; }
    else b2.style.display='none';
  }
}
function hpPaperNag(){
  const st=hpPaperState(); if(st!=='todo'&&st!=='year') return;
  hpBanner(T(st==='todo'?'bn_paper':'bn_paper_year'),()=>{ try{ document.getElementById('t-id').click(); const c=document.getElementById('paper-card'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){} },'nag');
}

const HP_PP_WAIT=72*3600e3;
function hpPpReq(){ const q=ID&&ID.paperReq; return (q&&Number(q.at)>0&&Number(q.until)>0)?q:null; }
function hpPpReady(){ const q=hpPpReq(); return !!(q&&Date.now()>=q.until&&hpIsMain()&&ID.paperOk&&hpPaperP()); }
async function hpPpTell(skip){
  try{ const q=hpPpReq(); let only=null;
    if(skip){ only=hpSibs().map(d=>d.dev).filter(d=>d!==skip); if(!only.length){ hpLog('紙の 14 語の準備の取り消しを、ほかに知らせる端末は無い'); return 0; } }
    const n=await hpSibPut(q?{v:1,type:'ppreq',at:q.at,until:q.until}:{v:1,type:'ppreq',cancel:1,at:Date.now()}, only); hpLog('紙の 14 語の準備を自分の端末 '+n+' 台に知らせた'); return n; }
  catch(e){ hpLog('紙の 14 語の準備を知らせられない '+e.message); return 0; }
}
async function hpPpStart(){
  if(!ID||!hpIsMain()||!ID.paperOk||!hpPaperP()||(typeof hpKillMe==='function'&&hpKillMe())) throw new Error(T('pp_e_state'));
  if(hpPpReq()) return false;
  const at=Date.now(); ID.paperReq={at:at,until:at+HP_PP_WAIT}; saveID();
  hpLog('紙の 14 語を出す準備を始めた（72 時間後から出せる）');
  try{ hpPaperUi(); }catch(e){}
  await hpPpTell(); return true;
}
function hpPpCancel(why, skip){
  if(!hpPpReq()) return false;
  delete ID.paperReq; saveID(); hpLog('紙の 14 語を出す準備を取り消した（'+why+'）');
  try{ hpPaperUi(); }catch(e){} hpPpTell(skip); return true;
}
async function hpPpOpen(){
  if(!hpPpReady()) return false;
  const v=await hpAsk({text:T('ask_paper'),auth:true,ok:T('btn_ask_paper'),why:'紙を見る（待ち時間のあと）'}); if(!v||!hpPpReady()) return false;
  delete ID.paperReq; delete ID.paperOk; saveID();
  hpLog('待ち時間が過ぎたので、紙の 14 語を出せるようにした（確かめ済みを外した）');
  hpPpTell();
  try{ HP_PAPER_PREAUTH=true; }catch(e){}
  hpPaperFlow(2); try{ hpPaperUi(); }catch(e){} return true;
}

function hpPpIn(o,r){
  if(!hpIsChild()||!ID.link.main||r.fromDev!==ID.link.main.dev){ hpLog('メイン端末でない端末からの紙の準備の知らせ（捨てた）'); return true; }
  const L=ID.link;
  if(o.cancel){ hpNoticeOff('ppreq');   if(L.ppreq){ delete L.ppreq; saveID(); hpLog('紙の 14 語の準備が取り消された（メイン端末から）'); try{ renderDevices(); }catch(e){} } return true; }
  if(!(Number(o.at)>0)||!(Number(o.until)>Number(o.at))) return true;
  L.ppreq={at:Number(o.at),until:Number(o.until)}; saveID();
  hpLog('メイン端末で、紙の 14 語を出す準備が始まった'); hpNotice(TF('nt_pp_req',{t:fmtTS(L.ppreq.until)}),'ppreq'); try{ if(typeof hpNote==='function') hpNote('ppreq',{t:fmtTS(L.ppreq.until)},'ppreq:'+L.ppreq.at); }catch(e){}
  try{ renderDevices(); }catch(e){} return true;
}

async function hpPpCancelSub(){
  if(!hpIsChild()||!ID.link.ppreq) return false;
  const q=ID.link.ppreq; delete ID.link.ppreq; saveID(); hpNoticeOff('ppreq');   try{ renderDevices(); }catch(e){}
  try{ await hpSibPut({v:1,type:'ppcancel',at:q.at},[ID.link.main.dev]); }catch(e){ hpLog('取り消しを送れない '+e.message); return false; }
  hpLog('紙の 14 語を出す準備の取り消しを、メイン端末へ送った'); return true;
}

function hpPpCancelIn(o,r){
  const q=hpPpReq(); if(!hpIsMain()||!q||Number(o.at)!==q.at){ hpLog('待っていない取り消し（捨てた）'); return true; }
  hpPpCancel('サブ端末から', r&&r.fromDev);   hpNotice(T('nt_pp_canceled')); try{ if(typeof hpNote==='function') hpNote('ppcancel',{},'ppcancel:'+q.at); }catch(e){}   return true;
}

const HP_VLP_K='p2p_vlpaper';
function hpVlPaperMark(){ try{ localStorage.setItem(HP_VLP_K,String(Date.now())); }catch(e){} }
async function hpVlPaperTell(){
  let at=0; try{ at=Number(localStorage.getItem(HP_VLP_K))||0; }catch(e){}
  if(!at||!ID||!POST.up||POST.notOwner) return 0;
  let n=0; try{ n=await hpSibPut({v:1,type:'vlpaper',at:at}); }catch(e){ hpLog('紙で開いたことを知らせられない '+e.message); return 0; }
  try{ localStorage.setItem(HP_VLP_K,''); }catch(e){}
  hpLog('紙で開いたことを、自分のほかの端末 '+n+' 台に知らせた'); return n;
}
function hpVlPaperIn(o,r){
  const lb=(typeof hpMvLabel==='function')?hpMvLabel(r.fromDev):String(r.fromDev||'').slice(0,10);
  hpLog('自分の端末（'+String(r.fromDev).slice(0,10)+'…）が紙で開かれた');
  hpNotice(TF('nt_vl_paper',{label:lb,t:fmtTS(Number(o.at)||r.sentAt||Date.now())}),'vlpaper');
  try{ if(typeof hpNote==='function') hpNote('vlpaper',{label:lb,t:fmtTS(Number(o.at)||r.sentAt||Date.now())},'vlpaper:'+r.fromDev+':'+(Number(o.at)||0)); }catch(e){}   return true;
}
function hpSafetyNag(){ try{ hpBanner(null,null,'nag'); }catch(e){} try{ if(typeof hpVaultNag==='function') hpVaultNag(); }catch(e){} }

function hpPaperInputs(id){
  const wrap=document.createElement('div'); if(id) wrap.id=id;
  const g=document.createElement('div'); g.style.cssText='display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);grid-template-rows:repeat(7,auto);grid-auto-flow:column;gap:6px 10px';
  const ins=[], hs=[], pre=hpWordPre();
  const look=v=>{ let k=String(v||'').toLowerCase().replace(/[^a-z]/g,'').slice(0,4); if(HP_WORD_ALIAS[k]) k=HP_WORD_ALIAS[k].slice(0,4); return (k.length===4&&pre[k]!==undefined)?HP_WORDS[pre[k]]:null; };
  const mark=i=>{ const v=ins[i].value.trim(), w=v.length>=4?look(v):null;
    hs[i].textContent=v.length<4?'':(w?w:'?'); hs[i].style.color=w?'var(--teal)':'var(--amber)'; ins[i].style.borderColor=(v.length>=4&&!w)?'var(--amber)':''; return w; };
  for(let i=0;i<HP_PAPER_N;i++){
    const c=document.createElement('label'); c.style.cssText='display:flex;align-items:center;gap:5px;min-width:0;font-size:15px';
    const n=document.createElement('span'); n.textContent=(i+1)+'.'; n.style.cssText='flex:0 0 1.7em;text-align:right;color:var(--dim)';
    const inp=document.createElement('input'); inp.type='text'; inp.id=(id||'paper-in')+'-'+(i+1); inp.style.cssText='flex:1 1 0;min-width:3.2em;width:auto;max-width:9em;font-size:15px';
    ['autocomplete','autocapitalize','autocorrect'].forEach(a=>inp.setAttribute(a,'off')); inp.setAttribute('spellcheck','false');
    const h=document.createElement('span'); h.className='mono'; h.style.cssText='font-size:12px;flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    inp.addEventListener('input',e=>{ const v=inp.value.trim();
      if(/\s/.test(v)){ const t=v.split(/[^A-Za-z]+/).filter(x=>x&&!/^[0-9]+$/.test(x)); for(let j=0;j<t.length&&i+j<HP_PAPER_N;j++){ ins[i+j].value=t[j]; mark(i+j); } const nx=Math.min(i+t.length,HP_PAPER_N-1); ins[nx].focus(); return; }
      const w=mark(i); if(w&&v.toLowerCase()===w&&e.inputType!=='deleteContentBackward'&&i<HP_PAPER_N-1) ins[i+1].focus(); });
    inp.addEventListener('keydown',e=>{ if(e.key==='Backspace'&&!inp.value&&i>0){ ins[i-1].focus(); e.preventDefault(); }
      else if((e.key===' '||e.key==='Enter')&&inp.value.trim()&&i<HP_PAPER_N-1){ ins[i+1].focus(); e.preventDefault(); } });
    c.appendChild(n); c.appendChild(inp); c.appendChild(h); g.appendChild(c); ins.push(inp); hs.push(h);
  }
  wrap.appendChild(g);
  return { el:wrap, inputs:ins,
    value:()=>ins.map(x=>x.value.trim()).join(' '),
    empty:()=>{ const k=ins.findIndex(x=>!x.value.trim()); return k<0?0:k+1; },
    focus:k=>{ try{ ins[k>=0?k:0].focus(); }catch(e){} },
    clear:()=>{ ins.forEach((x,i)=>{ x.value=''; mark(i); }); } };
}

function hpPaperOne(card,row,el,btn,goId,goText,onGo){
  const ws=hpPaperEnc(hpPaperP()), post=(typeof hpPostUrl==='function')?hpPostUrl():'', N=ws.length+1; let i=0, hid=false;
  const wrap=el('div',null,null,'paper-words'); wrap.style.cssText='margin-top:12px;text-align:center;padding:16px 8px;border:1px solid rgba(128,128,128,.35);border-radius:10px';
  const sub=el('div','note',null,'paper-one-n'), big=el('div','mono',null,'paper-one'); big.style.cssText='margin-top:8px;word-break:break-all;min-height:1.6em';
  wrap.appendChild(sub); wrap.appendChild(big); card.appendChild(wrap);
  const prev=btn(T('btn_pp2_prev'),false,'paper-prev',()=>{ if(i>0){ i--; draw(); } }), next=btn(T('btn_pp2_next'),true,'paper-next',()=>{ if(i<N-1){ i++; draw(); } }), go=btn(goText,true,goId,onGo);
  const draw=()=>{ const last=i===N-1, word=i<ws.length; sub.textContent=hid?'':(word?TF('pp2_of',{n:i+1,m:ws.length}):T('pp2_post')); big.textContent=hid?T('pp2_hid'):((i+1)+'. '+(word?ws[i]:post)); big.style.fontSize=(word&&!hid)?'26px':'16px';
    prev.disabled=i===0; next.style.display=last?'none':''; go.style.display=last?'':'none'; wrap.style.cursor=hid?'pointer':''; };
  wrap.onclick=()=>{ if(hid){ hid=false; draw(); } };
  const off=()=>{ try{ document.removeEventListener('visibilitychange',vis); window.removeEventListener('blur',hide); }catch(e){} };
  const hide=()=>{ if(!document.body.contains(wrap)){ off(); return; } if(!hid){ hid=true; draw(); } }, vis=()=>{ if(document.hidden) hide(); };
  try{ document.addEventListener('visibilitychange',vis); window.addEventListener('blur',hide); }catch(e){}
  row.appendChild(next); row.appendChild(go); row.appendChild(prev); draw();
}
function hpPaperFlow(step){
  const old=document.getElementById('paper-flow'); if(old) old.remove();
  if(!hpPaperFits()&&!(typeof hpRkGone==='function'&&hpRkGone())){   try{ hpLog('紙の単語がアカウントの鍵と合わない（紙を作れない）'); }catch(e){} hpPaperUi(); return; }
  const box=document.createElement('div'); box.id='paper-flow';
  box.style.cssText='position:fixed;inset:0;z-index:9998;background:var(--bg,#0b1220);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';
  const card=document.createElement('div'); card.className='card'; card.style.cssText='max-width:480px;width:100%';
  box.appendChild(card); document.body.appendChild(box);
  const el=(tag,cls,txt,id)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; if(id) e.id=id; return e; };
  const btn=(txt,pri,id,fn)=>{ const b=el('button','b'+(pri?' pri':''),txt,id); b.onclick=fn; return b; };
  const close=()=>{ keep=null; box.remove(); hpPaperUi(); try{ hpSafetyNag(); }catch(e){} try{ const f=(typeof HP_PAPER_AFTER==='function')?HP_PAPER_AFTER:null; if(f){ HP_PAPER_AFTER=null; f(); } }catch(e){} };
  let fin=40, more=false, keep=null;     let authed=false; try{ if(typeof HP_PAPER_PREAUTH!=='undefined'&&HP_PAPER_PREAUTH){ authed=true; HP_PAPER_PREAUTH=false; } }catch(e){}
  const see=()=>{ if(!hpPaperShowable()){ try{ hpLog('紙の 14 語は、確かめ済みのあとは画面に出さない'); }catch(e){} show(3); return; }   if(authed||!hpVaultOn()){ authed=true; show(2); return; } hpAsk({text:T('ask_paper'), auth:true, ok:T('btn_ask_paper'), why:'紙を見る'}).then(v=>{ if(v&&document.getElementById('paper-flow')===box){ authed=true; show(2); } }); };
  const show=n=>{
    if(n===2&&!hpPaperShowable()) n=3;
    card.innerHTML=''; card.dataset.step=String(n);
    const row=el('div','row'); row.style.marginTop='12px';
    if(n===1){
      card.appendChild(el('h2',null,T('pp1_h')));
      const b=el('div','note',T('pp1_body')); b.style.whiteSpace='pre-line'; card.appendChild(b);
      row.appendChild(btn(T('btn_pp1_go'),true,'paper-go1',see)); row.appendChild(btn(T('btn_pp_cancel'),false,'paper-cancel',close));
    } else if(n===2){
      card.appendChild(el('h2',null,T('pp2_h')));
      const nt=el('div','note',T('pp2_note')); nt.style.whiteSpace='pre-line'; card.appendChild(nt);
      { const on=el('div','note',T('pp2_once'),'paper-once'); on.style.cssText='margin-top:6px;color:var(--amber)'; card.appendChild(on); }
      hpPaperOne(card,row,el,btn,'paper-go2',T('btn_pp2_go'),()=>show(3));   row.appendChild(btn(T('btn_pp_cancel'),false,'paper-cancel',close));
    } else if(n===3){
      card.appendChild(el('h2',null,T('pp3_h')));
      const nt=el('div','note',T(hpPaperShowable()?'pp3_note':'pp3_note_ok')); nt.style.whiteSpace='pre-line'; card.appendChild(nt);
      if(!hpPaperShowable()){ const lo=el('div','note',T('pp3_lost'),'paper-lost'); lo.style.cssText='white-space:pre-line;margin-top:6px;color:var(--dim)'; if(typeof hpRkOn==='function'&&(hpRkOn()||hpRkGone())) lo.textContent=T('rk3_lost');   card.appendChild(lo); }
      const pc=hpPaperInputs('paper-in'); pc.el.style.marginTop='10px'; card.appendChild(pc.el);
      const ppl=el('div','note',T('pp3_post')); ppl.style.marginTop='10px'; card.appendChild(ppl);
      const ppi=document.createElement('input'); ppi.type='text'; ppi.id='paper-post'; ppi.placeholder=T('ph_pp3_post'); ppi.style.cssText='width:100%';
      ['autocomplete','autocapitalize','autocorrect'].forEach(a=>ppi.setAttribute(a,'off')); ppi.setAttribute('spellcheck','false'); card.appendChild(ppi);
      if(keep){ keep.w.forEach((v,i)=>{ const x=pc.inputs[i]; if(x&&v){ x.value=v; try{ x.dispatchEvent(new Event('input')); }catch(e){} } }); ppi.value=keep.p||''; try{ hpLog('紙の確かめ：打った単語を戻した（'+keep.w.filter(x=>String(x).trim()).length+' 語・場所 '+(String(keep.p||'').trim()?'あり':'なし')+'）'); }catch(e){} }
      const er=el('div','note',null,'paper-err'); er.style.color='var(--amber)'; card.appendChild(er);
      row.appendChild(btn(T('btn_pp3_go'),true,'paper-go3',()=>{ const k=pc.empty(); if(k){ er.textContent=TF('pp_e_empty',{n:k}); pc.focus(k-1); return; } if(!hpPaperPostOk(ppi.value)){ er.textContent=T('pp_e_post'); ppi.focus(); try{ ppi.select(); }catch(e){} return; }   const fresh=hpPaperShowable(), r=hpPaperConfirm(pc.value()); if(r.ok){ keep=null; pc.clear(); fin=r.vault?41:40; const rk=(typeof hpRkChecked==='function'); if(rk){ try{ hpRkChecked(fresh); }catch(e){} } show((fresh&&rk)?5:fin);   } else { er.textContent=r.err; const x=r.n?pc.inputs[r.n-1]:null; if(x){ x.style.borderColor='var(--amber)'; try{ x.focus(); x.select(); }catch(e){} } } }));
      if(hpPaperShowable()) row.appendChild(btn(T('btn_pp3_back'),false,'paper-back',see));   { const bb=row.querySelector('#paper-back'); if(bb) bb.addEventListener('click',()=>{ keep={w:pc.inputs.map(x=>x.value),p:ppi.value}; }); }   if(!hpPaperShowable()&&!hpPpReq()&&hpIsMain()&&!(typeof hpRkOn==='function'&&hpRkOn())) row.appendChild(btn(T('btn_pp_lost'),false,'paper-lostbtn',()=>{ hpAsk({text:T('cf_pp_req'),ok:T('btn_pp_lost')}).then(v=>{ if(!v) return; hpPpStart().then(()=>close()).catch(e=>{ er.textContent=(typeof hpErrShow==='function'?hpErrShow(e):e.message); }); }); }));   row.appendChild(btn(T('btn_pp_cancel'),false,'paper-cancel',close));
      setTimeout(()=>{ const k=pc.empty(); pc.focus(k?k-1:0); },50);
    } else if(n===5){
      card.appendChild(el('h2',null,T('rk5_h')));
      const nt=el('div','note',T('rk5_note')); nt.style.whiteSpace='pre-line'; card.appendChild(nt);
      const cn=el('div',null,TF('rk5_count',{n:hpRkN()}),'paper-count'); cn.style.cssText='margin-top:10px;font-size:16px'; card.appendChild(cn);
      if(more&&hpPaperP()){
        hpPaperOne(card,row,el,btn,'paper-wrote',T('btn_rk5_wrote'),()=>{ hpRkSetN(hpRkN()+1); more=false; show(5); });   row.appendChild(btn(T('btn_rk5_hide'),false,'paper-hide',()=>{ more=false; show(5); }));
      } else {
        const on=el('div','note',T('rk5_once'),'paper-once5'); on.style.cssText='margin-top:6px;color:var(--amber)'; card.appendChild(on);
        const one=hpRkN()<2;
        if(hpPaperP()&&hpRkN()<HP_RK_MAXN) row.appendChild(btn(T('btn_rk5_more'),one,'paper-more',()=>{ more=true; show(5); }));
        row.appendChild(btn(T('btn_rk5_done'),!one,'paper-done',()=>{ more=false; Promise.resolve().then(()=>hpRkErase('紙を書き終えた',true)).catch(()=>false).then(()=>{ if(document.getElementById('paper-flow')===box) show(fin); }); }));
      }
    } else {
      card.appendChild(el('h2',null,T('pp4_h')));
      const gone=(typeof hpRkGone==='function'&&hpRkGone()), t=[T('pp4_ok'), T(n===41?'pp4_vault':(gone?'rk4_novault':'pp4_novault')), T('pp4_year')].concat(gone?[T('rk4_gone')]:[]).join('\n\n');
      const b=el('div','note',t); b.style.whiteSpace='pre-line'; card.appendChild(b);
      if(n===40&&!hpVaultOn()) row.appendChild(btn(T('btn_pp4_vault'),true,'paper-tovault',()=>{ close(); try{ document.getElementById('t-id').click(); const c=document.getElementById('vault-card'); if(c&&c.scrollIntoView) c.scrollIntoView({block:'center'}); }catch(e){} }));
      row.appendChild(btn(T('btn_pp4_close'),!(n===40&&!hpVaultOn()),'paper-close',close));
    }
    card.appendChild(row);
  };
  if(step===2) see(); else show(step||1);
}
