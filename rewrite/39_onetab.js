const HP_TAB_LOCK='handpost-tab';
let HP_TAB_OFF=false, HP_TAB_HELD=false, HP_TAB_BC=null, HP_TAB_WAIT=4000, HP_TAB_RETRY=400;
function hpTabLog(s){ try{ if(typeof hpLog==='function') hpLog(s); else if(typeof log==='function') log(s); }catch(e){} }
function hpTabBc(){ if(HP_TAB_BC||typeof BroadcastChannel!=='function') return HP_TAB_BC; try{ HP_TAB_BC=new BroadcastChannel(HP_TAB_LOCK); }catch(e){ HP_TAB_BC=null; } return HP_TAB_BC; }
function hpTabShow(lost){
  let o=document.getElementById('hp-tab'); if(o&&o.remove) o.remove();
  o=document.createElement('div'); o.id='hp-tab';
  o.style.cssText='position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:var(--bg,#101418);display:flex;align-items:center;justify-content:center;padding:24px';
  const box=document.createElement('div'); box.style.cssText='max-width:440px;background:var(--panel,#1a2026);border:1px solid var(--line,#333);border-radius:12px;padding:20px;color:var(--ink,#eee);line-height:1.6';
  const h=document.createElement('div'); h.style.cssText='font-weight:bold;font-size:17px;margin-bottom:8px'; h.textContent=T(lost?'ot_gone_title':'ot_title');
  const p=document.createElement('div'); p.style.cssText='color:var(--dim,#aaa);margin-bottom:16px'; p.textContent=T(lost?'ot_gone_body':'ot_body');
  const b=document.createElement('button'); b.className='b pri'; b.id='hp-tab-take'; b.textContent=T('btn_ot_take'); b.onclick=hpTabTake;
  box.appendChild(h); box.appendChild(p); box.appendChild(b); o.appendChild(box); document.body.appendChild(o);
  return o;
}
function hpTabTake(){ try{ sessionStorage.setItem('hp_tab_take','1'); }catch(e){} location.reload(); }
function hpTabHold(steal){
  return new Promise(resolve=>{
    navigator.locks.request(HP_TAB_LOCK, steal?{steal:true}:{ifAvailable:true}, lock=>{ if(!lock){ resolve(false); return; } HP_TAB_HELD=true; resolve(true); return new Promise(()=>{}); })
      .catch(e=>{ if(HP_TAB_HELD){ HP_TAB_HELD=false; hpTabLost(); } else resolve(false); });
  });
}
async function hpTabLost(){
  HP_TAB_OFF=true; hpTabLog('ほかのタブで［このタブで使う］が押された。このタブのつながりを閉じる');
  try{ if(typeof hangup==='function') hangup(); }catch(e){}
  try{ if(typeof stopBg==='function') stopBg(); }catch(e){}
  try{ if(typeof POST!=='undefined'&&POST&&POST.closing) await Promise.race([POST.closing,new Promise(r=>setTimeout(r,3000))]); }catch(e){}
  hpTabShow(true);
  const bc=hpTabBc(); if(bc){ try{ bc.postMessage({t:'released'}); }catch(e){} }
}

function hpTabInv(){ try{ return typeof HP_IVJ!=='undefined'&&!!HP_IVJ&&!HP_IVJ.bad; }catch(e){ return false; } }
async function hpTabGate(){
  if(typeof navigator==='undefined'||!navigator.locks||typeof navigator.locks.request!=='function') return true;
  let take=false; try{ take=sessionStorage.getItem('hp_tab_take')==='1'; sessionStorage.removeItem('hp_tab_take'); }catch(e){}
  if(!take){
    for(let i=0;i<4;i++){ if(await hpTabHold(false)) return true; if(i<3) await new Promise(r=>setTimeout(r,HP_TAB_RETRY)); }
    if(!hpTabInv()){ HP_TAB_OFF=true; hpTabShow(false); hpTabLog('ほかのタブで開いている。［このタブで使う］を待つ');
    return new Promise(()=>{}); }
    hpTabLog('招待状のリンクで開いたタブなので、聞かずにこのタブで使う（ほかのタブは止める）');
  }
  let busy=true; try{ const q=await navigator.locks.query(); busy=(q.held||[]).some(l=>l.name===HP_TAB_LOCK); }catch(e){}
  const bc=busy?hpTabBc():null;
  const rel=new Promise(r=>{ if(bc) bc.onmessage=ev=>{ if(ev&&ev.data&&ev.data.t==='released') r(true); }; });
  await hpTabHold(true); HP_TAB_OFF=false;
  if(busy){ const ok=await Promise.race([rel,new Promise(r=>setTimeout(()=>r(false),HP_TAB_WAIT))]); hpTabLog(ok?'このタブで使う（ほかのタブがつながりを閉じた）':'このタブで使う（ほかのタブから閉じた知らせが来ないまま進む）'); }
  else hpTabLog('このタブで使う');
  return true;
}
