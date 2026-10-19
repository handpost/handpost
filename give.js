'use strict';
const XM_KEY='7b459d28-9290-4e95-a01c-ec9a799543bf';
const XM_NETID=21337, WSS='wss://xahau.network', GOV='rBvKgF3jSZWdJcwSsmoJspoXLLDVLDp6jg', EVN_NS='01EAF09326B4911554384121FF56FA8FECC215FDDE2EC35D9E59F2C53EC665A0';
const K_ISSUER='45565201'+'0'.repeat(54)+'01', CAP_XAH=5, CAP_EVR=20, ACT=1, LINE=0.2, SS='hp_give', SS_AUTO='hp_give_auto', SS_KEEP=30*60e3, AUTO_KEEP=10*60e3;
const JA=/^ja/i.test((navigator.languages&&navigator.languages[0])||navigator.language||'ja');
const PHONE=/iPhone|iPad|iPod|Android/i.test(String((typeof navigator!=='undefined'&&navigator.userAgent)||''));
const TX={
  h:['Handpost：始めるぶんを送る','Handpost: send a starter amount'],
  bad:['このリンクは形が正しくありません。もらう人に、もう一度 QR かリンクを出してもらってください。','This link is not valid. Ask the recipient to show the QR or link again.'],
  what:['{x} を送ります','You will send {x}'], to:['送り先の口座','Recipient account'],
  ledger:['台帳（Xahau）に残るのは、あなたの口座番号・送り先の口座番号・送った量・時刻だけです。台帳はだれでも見られるので、この 2 つの口座につながりがあることは分かります。\n手紙の中身や、だれと何を話したかは、台帳には一切残りません（Handpost の手紙は台帳を通りません）。','The Xahau ledger will show only your account number, the recipient\'s account number, the amount and the time. Anyone can read the ledger, so the link between these two accounts is visible.\nThe contents of letters, and who talked about what, never go on the ledger (Handpost letters do not pass through it).'],
  ok_lbl:['口座番号のつながりが台帳に残ることを承知して、送ります','I understand the link between the account numbers stays on the ledger, and I will send'], ok_first:['上の注意を読んで、チェックを入れると送れるようになります。','Read the notice above and tick the box to enable sending.'],
  cost_r:['送り先の口座を確かめています…','Checking the recipient account…'],
  cost:['送る口座から減る目安：XAH {x}・EVR {e}（手数料は別）{why}','Estimated cost: XAH {x}, EVR {e} (plus the network fee){why}'],
  why_act:['\n・送り先の口座がまだ無いので、有効にする 1 XAH を含みます','\n· includes 1 XAH to activate the recipient account'],
  why_line:['\n・送り先が EVR を受け取る設定をまだしていないので、その預け分 0.2 XAH を含みます','\n· includes 0.2 XAH reserve so the recipient can hold EVR'],
  go:['送る（Xaman で承認）','Send (approve in Xaman)'], go0:['Xaman でサインインして送る','Sign in with Xaman and send'],
  hint:['押すと Xaman が開きます。サインインのあと、承認の依頼が Xaman に届きます。送る口座は、Xaman の承認の画面で選べます。','Pressing this opens Xaman. After signing in, the approval request arrives in Xaman. You choose the sending account on Xaman\'s approval screen.'],
  nolib:['Xaman の部品を読めませんでした。ページを開き直してください。','Could not load the Xaman component. Reload the page.'],
  making:['Xaman の依頼を作っています…','Creating the Xaman request…'],
  next_h:['Xaman を開いて、承認してください','Open Xaman and approve'], open2:['Xaman を開いて承認する','Open Xaman to approve'], pushed:['Xaman に通知を送りました。','A notification was sent to your Xaman.'],
  next_nt:['承認の画面で、送る口座を選べます（Xaman で付けた名前で確かめられます）。承認が済むと、ここに「送りました」と出ます。','On the approval screen you choose the sending account (shown by the name you gave it in Xaman). Once approved, "Sent" appears here.'],
  qr_nt:['スマホの Xaman で、この QR を読んで承認してください。','Scan this QR with Xaman on your phone and approve.'],
  rejected:['承認されませんでした。何も送られていません。','It was not approved. Nothing was sent.'],
  fail:['台帳が受け付けませんでした（{r}）。何も送られていません。','The ledger did not accept it ({r}). Nothing was sent.'],
  err:['うまくいきませんでした（{w}）。','Something went wrong ({w}).'],
  done:['送りました。もらう人の Handpost の画面は、自動で次へ進みます。このページは閉じて構いません。','Sent. The recipient\'s Handpost screen moves on by itself. You can close this page.'],
  instr:['Handpost：{a} へ {x} を送ります。','Handpost: send {x} to {a}.']};
const t=(k,o)=>{ let s=TX[k][JA?0:1]; for(const n of Object.keys(o||{})) s=s.split('{'+n+'}').join(String(o[n])); return s; };
const $=id=>document.getElementById(id), num=v=>String(Math.round(Number(v)*1e6)/1e6);
function parse(q){ const p=new URLSearchParams(q), to=String(p.get('to')||''), x=Number(p.get('xah')||0), e=Number(p.get('evr')||0);
  if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(to)||!(x>=0)||!(e>=0)||x>CAP_XAH||e>CAP_EVR||!(x>0||e>0)) return null; return {to:to,xah:Math.round(x*1e6)/1e6,evr:Math.round(e*1e6)/1e6}; }
function unpack(h){ try{ let b=String(h||'').replace(/^#/,''); if(!/^[A-Za-z0-9_-]{20,200}$/.test(b)) return null; b=b.replace(/-/g,'+').replace(/_/g,'/'); while(b.length%4) b+='='; const p=atob(b).split('|'); if(p.length!==3) return null; return parse('?to='+encodeURIComponent(p[0])+'&xah='+encodeURIComponent(p[1])+'&evr='+encodeURIComponent(p[2])); }catch(e){ return null; } }
function amtText(R){ return (R.xah>0?'XAH '+num(R.xah):'')+(R.xah>0&&R.evr>0?(JA?' と ':' and '):'')+(R.evr>0?'EVR '+num(R.evr):''); }
function sess(fn,ms){ return new Promise((res,rej)=>{ let ws=null, done=false, id=0; const wait=new Map();
  const fin=(e,v)=>{ if(done) return; done=true; clearTimeout(tm); try{ if(ws) ws.close(); }catch(_){} for(const w of wait.values()){ try{ w.rej(e||new Error('closed')); }catch(_){} } wait.clear(); if(e) rej(e); else res(v); };
  const tm=setTimeout(()=>fin(new Error('timeout')),ms||30000);
  const q=o=>new Promise((ok,ng)=>{ if(done) return ng(new Error('closed')); const i=++id; wait.set(i,{res:ok,rej:ng}); try{ ws.send(JSON.stringify(Object.assign({id:i},o))); }catch(e){ wait.delete(i); ng(e); } });
  try{ ws=new WebSocket(WSS); }catch(e){ return fin(e); }
  ws.onopen=()=>{ Promise.resolve().then(()=>fn(q)).then(v=>fin(null,v),e=>fin(e)); };
  ws.onmessage=ev=>{ let m=null; try{ m=JSON.parse(ev.data); }catch(e){ return; } const w=m&&wait.get(m.id); if(!w) return; wait.delete(m.id); if(m.status==='success') w.res(m.result); else w.rej(new Error(m.error||'error')); };
  ws.onerror=()=>fin(new Error('WebSocket')); ws.onclose=()=>fin(new Error('closed')); }); }
const B58='rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz';
async function acctId(hex40){ const p=new Uint8Array(21); for(let i=0;i<20;i++) p[i+1]=parseInt(hex40.substr(i*2,2),16);
  const d1=new Uint8Array(await crypto.subtle.digest('SHA-256',p)), d2=new Uint8Array(await crypto.subtle.digest('SHA-256',d1)); const all=new Uint8Array(25); all.set(p); all.set(d2.slice(0,4),21);
  let n=0n; for(const b of all) n=(n<<8n)|BigInt(b); let s=''; while(n>0n){ s=B58[Number(n%58n)]+s; n/=58n; } for(const b of all){ if(b===0) s=B58[0]+s; else break; } return s; }
async function acct(a){ return sess(async q=>{ let d=null; try{ d=(await q({command:'account_info',account:a,ledger_index:'validated'})).account_data; }catch(e){ if(/actNotFound|not ?found/i.test(String(e&&e.message))) return null; throw e; }
  let ls=[]; try{ ls=(await q({command:'account_lines',account:a,ledger_index:'validated'})).lines||[]; }catch(e){} const ev=ls.filter(l=>l.currency==='EVR');
  return {xah:Number(d.Balance)/1e6,line:ev.length>0,evr:ev.reduce((s,l)=>s+(Number(l.balance)||0),0),own:Number(d.OwnerCount)||0}; }); }
async function issuer(){ const r=await sess(q=>q({command:'ledger_entry',hook_state:{account:GOV,key:K_ISSUER,namespace_id:EVN_NS},ledger_index:'validated'}),20000);
  const d=String((r&&r.node&&r.node.HookStateData)||''); if(!/^[0-9A-Fa-f]{40}$/.test(d)) throw new Error('EVR issuer'); const a=await acctId(d); if(!/^r[1-9A-HJ-NP-Za-km-z]{24,34}$/.test(a)) throw new Error('EVR issuer'); return a; }
function cost(R,dst){ const act=dst?0:ACT, line=(R.evr>0&&!(dst&&dst.line))?LINE:0; return {act:act,line:line,xah:Math.round((R.xah+act+line)*1e6)/1e6,evr:R.evr}; }
function txOf(R,iss){ const A=[]; if(R.xah>0) A.push({AmountEntry:{Amount:String(Math.round(R.xah*1e6))}}); if(R.evr>0) A.push({AmountEntry:{Amount:{currency:'EVR',issuer:iss,value:num(R.evr)}}});
  return {TransactionType:'Remit',Destination:R.to,Amounts:A,NetworkID:XM_NETID}; }
let XM=null, ME='', R=null, DST, BUSY=false, DONE=false, C=null, AUTO=false, GONE=false, RUN=0, OK=false;
function st(s,cls){ const e=$('st'); e.textContent=s||''; e.className=cls||'note'; }
function draw(){ const one=$('b-go'), waiting=BUSY&&GONE&&!DONE;   one.style.display=(DONE||waiting)?'none':''; $('hint').style.display=(DONE||waiting)?'none':'';
  $('hint').textContent=t(OK?'hint':'ok_first');
  one.textContent=ME?t('go'):t('go0'); one.disabled=BUSY||DONE||!C||!OK; }
async function readDst(){ $('cost').textContent=t('cost_r'); try{ DST=await acct(R.to); C=cost(R,DST); $('cost').textContent=t('cost',{x:num(C.xah),e:num(C.evr),why:(C.act?t('why_act'):'')+(C.line?t('why_line'):'')}); }catch(e){ C=null; $('cost').textContent=t('err',{w:String((e&&e.message)||e)}); } draw(); if(AUTO&&ME&&!GONE&&C) go(); }
function autoOff(){ AUTO=false; try{ localStorage.removeItem(SS_AUTO); }catch(e){} }
function signedIn(a){ a=String(a||''); if(!a||ME===a) return; ME=a; st(''); draw(); if(AUTO&&!GONE&&C) go(); }
function showOpen(c){ const box=$('open'); box.textContent=''; const el=(tg,cls,tx)=>{ const e=document.createElement(tg); if(cls) e.className=cls; if(tx!=null) e.textContent=tx; return e; };
  box.appendChild(el('div','big',t('next_h'))); if(c.pushed) box.appendChild(el('div','note',t('pushed')));
  const a=el('a','b pri',t('open2')); a.href=c.next.always; a.target='_blank'; a.rel='noopener'; a.style.fontSize='18px'; box.appendChild(a);
  box.appendChild(el('div','note',t('next_nt')));
  const im=el('img'); im.alt='QR'; im.src=c.refs.qr_png;
  if(!PHONE){ box.appendChild(el('div','note',t('qr_nt'))); box.appendChild(im); } }
async function go(){ if(BUSY||DONE||!XM||!ME||!R||!C) return; const run=++RUN; BUSY=true; GONE=true; autoOff(); $('open').textContent=''; st(t('making')); draw();
  try{ const iss=R.evr>0?await issuer():''; if(run!==RUN) return; const tx=txOf(R,iss);
    const sub=await XM.payload.createAndSubscribe({txjson:tx,options:{submit:true,force_network:'XAHAU',expire:10},custom_meta:{instruction:t('instr',{a:R.to,x:amtText(R)})}},ev=>{ if(ev.data&&'signed' in ev.data) return ev.data; }); if(run!==RUN) return;
    const c=sub.created; st(''); showOpen(c);
    const ev=await sub.resolved; if(run!==RUN) return; $('open').textContent='';
    if(!ev||!ev.signed){ st(t('rejected'),'bad'); return; }
    let res=''; for(let i=0;i<20&&!res;i++){ try{ const p=await XM.payload.get(c.uuid); res=String((p&&p.response&&p.response.dispatched_result)||''); }catch(e){} if(!res) await new Promise(r=>setTimeout(r,1500)); if(run!==RUN) return; }
    if(res==='tesSUCCESS'){ DONE=true; st(t('done'),'ok'); try{ localStorage.removeItem(SS); }catch(e){} } else st(t('fail',{r:res||'?'}),'bad');
  }catch(e){ if(run!==RUN) return; $('open').textContent=''; st(t('err',{w:String((e&&e.message)||e)}),'bad'); }
  finally{ if(run===RUN){ BUSY=false; draw(); } } }
function boot(){ document.documentElement.lang=JA?'ja':'en'; $('h').textContent=t('h'); document.title=t('h'); $('b-go').textContent=t('go');
  try{ AUTO=Date.now()-Number(localStorage.getItem(SS_AUTO)||0)<AUTO_KEEP; }catch(e){}
  R=unpack(location.hash)||parse(location.search);

  try{ if(R) localStorage.setItem(SS,JSON.stringify({to:R.to,xah:R.xah,evr:R.evr,at:Date.now()})); else { const o=JSON.parse(localStorage.getItem(SS)||'null'); if(o&&Date.now()-Number(o.at)<SS_KEEP) R=parse('?to='+encodeURIComponent(o.to)+'&xah='+o.xah+'&evr='+o.evr); } }catch(e){}
  if(!R){ autoOff(); $('what').textContent=t('bad'); $('what').className='bad'; for(const id of ['b-go','ledger','hint']) $(id).style.display='none'; return; }
  $('what').textContent=t('what',{x:amtText(R)}); $('to').textContent=t('to')+' '+R.to; $('ledger').textContent=t('ledger');
  { const lb=document.createElement('label'); lb.id='ok-lbl'; lb.style.cssText='display:block;margin-top:10px;font-size:15px;color:#e8ecf4;cursor:pointer'; const cb=document.createElement('input'); cb.type='checkbox'; cb.id='ok'; cb.style.cssText='width:20px;height:20px;vertical-align:middle;margin-right:8px'; cb.onchange=()=>{ OK=!!cb.checked; draw(); }; const sp=document.createElement('span'); sp.textContent=t('ok_lbl'); lb.appendChild(cb); lb.appendChild(sp); $('ledger').appendChild(lb); if(AUTO){ OK=true; cb.checked=true; } }
  draw(); readDst();
  if(typeof Xumm!=='function'){ st(t('nolib'),'bad'); $('b-go').disabled=true; return; }
  XM=new Xumm(XM_KEY);
  XM.on('error',e=>{ st(t('err',{w:String((e&&e.message)||e)}),'bad'); });
  XM.on('logout',()=>{ ME=''; autoOff(); draw(); });
  XM.on('success',async()=>{ let a=''; try{ a=String(await XM.user.account||''); }catch(e){} if(a) signedIn(a); else { autoOff(); st(t('err',{w:'account'}),'bad'); draw(); } });
  Promise.race([XM.user.account,new Promise(r=>setTimeout(()=>r(''),4000))]).then(a=>{ signedIn(a); }).catch(()=>{});
  $('b-go').onclick=()=>{ if(!OK){ draw(); return; }   if(ME){ go(); return; } AUTO=true; try{ localStorage.setItem(SS_AUTO,String(Date.now())); }catch(e){} st(''); draw(); XM.authorize().catch(e=>{ autoOff(); st(t('err',{w:String((e&&e.message)||e)}),'bad'); draw(); }); }; }
if(typeof document!=='undefined') document.addEventListener('DOMContentLoaded',boot);
