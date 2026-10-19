const HP_SF_Z=9500;
let HP_SF_CUR=null;
function hpSafetyQrText(num){ return 'HPSN1:'+num; }
function hpSafetyParse(val){ const m=String(val||'').trim().match(/^HPSN1:(\d{60})$/i); return m?m[1]:null; }

async function hpSafetyCheck(addr, val){
  const got=hpSafetyParse(val); if(!got){ try{ hpLog('読んだ QR は安全番号の形ではない（'+nickOf(addr)+'）'); }catch(e){} return 'notsn'; }
  const mine=await hpSafetyNum(ID.address, addr);
  if(got!==mine){ try{ hpLog('安全番号の QR が一致しない（'+nickOf(addr)+'）'); }catch(e){} return 'bad'; }
  hpVfySet(addr, 1, 'QR で一致'); return 'ok';
}
function hpSafetyClose(){ if(HP_SF_CUR){ try{ HP_SF_CUR.done(); }catch(e){} } }
async function hpSafetyOpen(addr){
  if(!ID||!hpIdFmt(addr)) return null;
  hpSafetyClose();
  let num; try{ num=await hpSafetyNum(ID.address, addr); }catch(e){ try{ hpLog('安全番号を作れない '+((e&&e.message)||'')); }catch(x){} return null; }
  const who=nickOf(addr);
  const el=(tag,cls,txt)=>{ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; };
  const box=el('div'); box.id='hp-safe';
  box.style.cssText='position:fixed;inset:0;z-index:'+HP_SF_Z+';background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px;overflow:auto';
  const card=el('div','card'); card.style.cssText='max-width:460px;width:100%;margin:auto'; box.appendChild(card);
  card.appendChild(el('h2',null,TF('sf_title',{who:who})));
  const how=el('div','note',TF('sf_how',{who:who})); how.style.cssText='line-height:1.6'; card.appendChild(how);
  const g=hpSafetyFmt(num);
  const dg=el('div',null,g); dg.id='hp-safe-num'; dg.style.cssText='white-space:pre;font-family:ui-monospace,Consolas,monospace;font-size:20px;letter-spacing:1px;line-height:1.7;text-align:center;margin:12px 0;user-select:all'; card.appendChild(dg);
  const st=el('div','note'); st.id='hp-safe-st'; st.style.cssText='text-align:center;margin-bottom:8px'; card.appendChild(st);
  const cv=el('canvas'); cv.id='hp-safe-qr'; cv.width=220; cv.height=220; cv.style.cssText='display:block;margin:6px auto;background:#fff;border-radius:8px';
  try{ QR.draw(cv, hpSafetyQrText(num)); }catch(e){ try{ hpLog('安全番号の QR を描けない '+((e&&e.message)||'')); }catch(x){} }
  card.appendChild(cv);
  const qn=el('div','note',T('sf_qr')); qn.style.cssText='text-align:center'; card.appendChild(qn);
  const res=el('div','note'); res.id='hp-safe-res'; res.style.cssText='margin-top:10px;line-height:1.6;white-space:pre-line'; card.appendChild(res);
  const mn=el('div','note',T('sf_mark_note')); mn.id='hp-safe-mn'; mn.style.marginTop='10px'; card.appendChild(mn);
  const row=el('div','row'); row.style.cssText='margin-top:12px;justify-content:flex-end;flex-wrap:wrap;gap:8px';
  const scan=el('button','b',T('btn_sf_scan')); scan.type='button'; scan.id='hp-safe-scan';
  const mark=el('button','b pri'); mark.type='button'; mark.id='hp-safe-mark';
  const close=el('button','b',T('btn_sf_close')); close.type='button'; close.id='hp-safe-close';
  row.appendChild(scan); row.appendChild(mark); row.appendChild(close); card.appendChild(row);
  const draw=()=>{
    const on=hpVerified(addr), v=(ID&&ID.vfy&&ID.vfy[addr])||null;
    st.textContent=on?TF('sf_on',{t:fmtTS(Number(v&&v.at)||Date.now())}):T('sf_off');
    st.style.color=on?'var(--teal)':'var(--dim)';
    mark.textContent=T(on?'btn_sf_unmark':'btn_sf_mark'); mark.className=on?'b':'b pri';
    mn.style.display=on?'none':'';
  };
  let fin=false;
  const key=e=>{ if(fin) return; if(e.key==='Escape'){ const q=document.getElementById('qrfull'); if(q&&q.style&&q.style.display==='flex') return; e.preventDefault(); done(); } };
  const done=()=>{ if(fin) return; fin=true; if(HP_SF_CUR&&HP_SF_CUR.box===box) HP_SF_CUR=null; try{ box.remove(); }catch(e){} try{ document.removeEventListener('keydown',key,true); }catch(e){} };
  const say=(k,color)=>{ res.textContent=k?TF(k,{who:who}):''; res.style.color=color||''; };
  mark.onclick=()=>{ const on=hpVerified(addr); hpVfySet(addr, on?0:1, on?'':'読み合わせ'); say(''); draw(); };
  const onRead=async val=>{ if(fin) return; const r=await hpSafetyCheck(addr,val); if(r==='ok') say('sf_ok','var(--teal)'); else if(r==='bad') say('sf_bad','var(--red)'); else say('sf_notsn','var(--amber)'); draw(); };
  scan.onclick=()=>{ say(''); try{ startScanFull(onRead,{title:T('qrf_sf_title'),hint:T('qrf_sf_hint')}); }catch(e){ try{ hpLog('カメラを開けない '+((e&&e.message)||'')); }catch(x){} } };
  close.onclick=()=>done();
  box.onclick=e=>{ if(e&&e.target===box) done(); };
  try{ document.addEventListener('keydown',key,true); }catch(e){}
  draw();
  HP_SF_CUR={box,addr,num,st,res,mark,scan,close,draw,onRead,done};
  document.body.appendChild(box);
  try{ hpLog('安全番号を開いた（'+who+'）'); }catch(e){}
  return HP_SF_CUR;
}
