'use strict';
const XM_KEY='7b459d28-9290-4e95-a01c-ec9a799543bf';
const PFX='hpxm2:', JWTK='XummPkceJwt', HOLD='hp_xa_hold', RADDR=/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/, KEEP=10*60e3;
const JA=/^ja/i.test((typeof navigator!=='undefined'&&((navigator.languages&&navigator.languages[0])||navigator.language))||'ja');
const TX={
  h:['Handpost：Safari で Xaman にサインイン','Handpost: sign in to Xaman in Safari'],
  lead:['このページは、ホーム画面の Handpost の代わりに Xaman にサインインするためのものです（iPhone では、ホーム画面の Handpost から直接サインインできないため）。Handpost のアカウントは要りません。\n① 下の［Xaman でサインイン］を押し、Xaman で承認する\n② 出てきた文字を［文字をコピー］でコピーする\n③ ホーム画面の Handpost に戻り、欄に貼って［サインインを済ませる］を押す','This page signs in to Xaman on behalf of the Handpost on your Home Screen (on iPhone, the Home Screen Handpost cannot sign in directly). No Handpost account is needed.\n1. Tap [Sign in with Xaman] below and approve in Xaman\n2. Copy the text that appears with [Copy text]\n3. Go back to the Home Screen Handpost, paste it, and tap [Finish sign-in]'],
  go:['Xaman でサインイン','Sign in with Xaman'],
  opening:['Xaman を開いています。承認したら、このページに戻ってください。','Opening Xaman. After approving, come back to this page.'],
  app:['このページは Safari で開いてください（ホーム画面の Handpost の中では、サインインできません）。','Open this page in Safari (signing in does not work inside the Home Screen Handpost).'],
  nolib:['Xaman の部品を読めませんでした。ページを開き直してください。','Could not load the Xaman component. Reload the page.'],
  err:['サインインできませんでした（{w}）。もう一度［Xaman でサインイン］を押してください。','Could not sign in ({w}). Tap [Sign in with Xaman] again.'],
  who:['サインインしました：口座 {a}','Signed in: account {a}'],
  out_lead:['この文字を、ホーム画面の Handpost に貼ってください。','Paste this text into the Home Screen Handpost.'],
  copy:['文字をコピー','Copy text'], clear:['文字を消す','Clear text'],
  copied:['コピーしました。ホーム画面の Handpost に戻って貼ってください。貼り終えたら、このページは閉じてかまいません。','Copied. Go back to the Home Screen Handpost and paste it. You can close this page after pasting.'],
  copy_no:['コピーできませんでした。上の文字を長押しして全部選び、コピーしてください。','Could not copy. Press and hold the text above, select all, and copy it.'],
  left:['ホーム画面の Handpost に貼れるのは、あと {m} 分 {s} 秒です。','You can paste it into the Home Screen Handpost for {m} min {s} s more.'],
  gone:['10 分を過ぎたので、文字を消しました。もう一度［Xaman でサインイン］を押してください。','10 minutes have passed, so the text was cleared. Tap [Sign in with Xaman] again.'],
  cleared:['消しました。要るときは、もう一度［Xaman でサインイン］を押してください。','Cleared. If you need it again, tap [Sign in with Xaman] again.'],
  warn:['この文字は、ほかの人に見せたり送ったりしないでください。この文字を持つ人は、24 時間、あなたの Xaman に承認の依頼を送れます（あなたが Xaman で承認しなければ、お金は動きません）。\nホーム画面の Handpost が受け取るのは、作ってから 10 分の間だけです。','Do not show or send this text to anyone. Whoever has it can send approval requests to your Xaman for 24 hours (no money moves unless you approve in Xaman).\nThe Home Screen Handpost accepts it only within 10 minutes of creation.']
};
function t(k,v){ let s=(TX[k]||[k,k])[JA?0:1]; if(v) for(const n in v) s=s.split('{'+n+'}').join(String(v[n])); return s; }
function b64u(s){ const u=new TextEncoder().encode(String(s)); let b=''; for(let i=0;i<u.length;i++) b+=String.fromCharCode(u[i]); return btoa(b).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function pack(raw,a,now){
  if(!raw||typeof raw.jwt!=='string'||raw.jwt.split('.').length!==3||!RADDR.test(String(a||''))) return '';
  return PFX+b64u(JSON.stringify({v:2,at:Number(now||Date.now()),a:String(a),jwt:raw.jwt,me:(raw.me&&typeof raw.me==='object')?raw.me:{}})); }
function leftOf(at,now){ return Math.max(0,Math.ceil((Number(at)+KEEP-Number(now))/1000)); }
function leftText(sec){ return t('left',{m:Math.floor(sec/60),s:String(sec%60).padStart(2,'0')}); }
function returning(){ try{ const l=new URLSearchParams(location.search||''); return !!(l.get('access_token')||l.get('authorization_code')||l.get('error_description')); }catch(e){ return false; } }
function hold(){ if(returning()) return; try{ const v=localStorage.getItem(JWTK); if(sessionStorage.getItem(HOLD)==null) sessionStorage.setItem(HOLD,v==null?'':v); localStorage.removeItem(JWTK); }catch(e){} }
function unhold(){ if(returning()) return; try{ const v=sessionStorage.getItem(HOLD); if(v==null) return; if(v) localStorage.setItem(JWTK,v); else localStorage.removeItem(JWTK); sessionStorage.removeItem(HOLD); }catch(e){} }
let XM=null, TEXT='', AT=0, TICK=0;
function $(id){ return document.getElementById(id); }
function st(s,cls){ const e=$('st'); e.textContent=s||''; e.className=cls||'note'; }
function stopTick(){ if(TICK){ clearInterval(TICK); TICK=0; } }
function tick(){ if(!TEXT){ stopTick(); return; } const n=leftOf(AT,Date.now()), e=$('left'); if(n<=0){ stopTick(); TEXT=''; $('out').value=''; $('b-copy').disabled=true; e.textContent=t('gone'); e.className='bad'; return; } e.textContent=leftText(n); e.className=n<=60?'bad':'note'; }
function show(a){ $('c-out').style.display=''; $('who').textContent=t('who',{a:a.slice(0,6)+'…'+a.slice(-4)}); $('out').value=TEXT; $('msg').textContent=''; $('b-copy').disabled=false; stopTick(); tick(); TICK=setInterval(tick,1000); }
async function done(){ let a='', raw=null; try{ a=String(await XM.user.account||''); }catch(e){} try{ raw=JSON.parse(localStorage.getItem(JWTK)||'null'); }catch(e){}
  unhold(); AT=Date.now(); TEXT=pack(raw,a,AT); if(!TEXT){ st(t('err',{w:a?'jwt':'account'}),'bad'); $('b-go').disabled=false; return; } st(''); $('b-go').disabled=false; show(a); }
function boot(){ document.documentElement.lang=JA?'ja':'en'; $('h').textContent=t('h'); document.title=t('h'); $('lead').textContent=t('lead'); $('b-go').textContent=t('go');
  $('out-lead').textContent=t('out_lead'); $('b-copy').textContent=t('copy'); $('b-clear').textContent=t('clear'); $('warn').textContent=t('warn');
  if(navigator.standalone===true){ st(t('app'),'bad'); return; }
  if(typeof Xumm!=='function'){ st(t('nolib'),'bad'); return; }
  document.addEventListener('visibilitychange',()=>{ if(document.visibilityState==='visible') tick(); });
  hold(); window.addEventListener('pagehide',unhold); window.addEventListener('pageshow',e=>{ if(e.persisted&&!TEXT) hold(); });
  XM=new Xumm(XM_KEY);
  XM.on('error',e=>{ unhold(); st(t('err',{w:String((e&&e.message)||e)}),'bad'); $('b-go').disabled=false; });
  XM.on('success',()=>{ done().catch(e=>{ st(t('err',{w:String((e&&e.message)||e)}),'bad'); }); });
  $('b-go').disabled=false;
  $('b-go').onclick=()=>{ hold(); TEXT=''; stopTick(); $('c-out').style.display='none'; st(t('opening')); $('b-go').disabled=true; try{ XM.logout(); }catch(e){} hold(); XM.authorize().catch(e=>{ unhold(); st(t('err',{w:String((e&&e.message)||e)}),'bad'); $('b-go').disabled=false; }); };
  $('b-copy').onclick=async()=>{ let ok=false; try{ await navigator.clipboard.writeText(TEXT); ok=true; }catch(e){ try{ const ta=$('out'); ta.focus(); ta.select(); ok=!!(document.execCommand&&document.execCommand('copy')); }catch(x){} } $('msg').textContent=t(ok?'copied':'copy_no'); $('msg').className=ok?'ok':'note'; };
  $('b-clear').onclick=()=>{ TEXT=''; stopTick(); $('left').textContent=''; $('out').value=''; $('b-copy').disabled=true; $('msg').textContent=t('cleared'); $('msg').className='note'; }; }
if(typeof document!=='undefined'&&document.getElementById) document.addEventListener('DOMContentLoaded',boot);
if(typeof module!=='undefined') module.exports={pack,b64u,t,PFX,leftOf,leftText,KEEP};
