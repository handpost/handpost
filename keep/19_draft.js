let DRAFTS=[];
function draftClear(){ for(const d of DRAFTS){ if(d.url){ try{ URL.revokeObjectURL(d.url); }catch(e){} } } DRAFTS=[]; renderDraft(); }
function draftRemove(i){ const d=DRAFTS[i]; if(!d)return; if(d.url){ try{ URL.revokeObjectURL(d.url); }catch(e){} } DRAFTS.splice(i,1); renderDraft(); }
function draftAdd(file){ if(!file)return; const isImg=/^image\//.test(file.type||''); if(!isImg&&typeof hpFileRisky==='function'&&hpFileRisky(file.name,file.type)){ alert(TF('al_file_risky',{name:hpFileName(file.name)||'file'})); return; }   DRAFTS.push({ kind:isImg?'image':'file', file, url:isImg?URL.createObjectURL(file):'' }); }
function draftSet(fileOrList){
  if(!fileOrList)return;
  if(!CONV_OPEN){ alert(T('al_pick_conv')); return; }
  const list=(typeof fileOrList.length==='number'&&typeof fileOrList.type!=='string')?Array.from(fileOrList):[fileOrList];
  for(const f of list){ if(f)draftAdd(f); }
  renderDraft();
  const ti=$('#text'); if(ti)ti.focus();
}
function renderDraft(){
  let bar=document.getElementById('draftbar');
  if(!DRAFTS.length){ if(bar)bar.style.display='none'; return; }
  if(!bar){ bar=document.createElement('div'); bar.id='draftbar'; const comp=$('#composer'); comp.parentNode.insertBefore(bar,comp); }
  bar.innerHTML='';
  bar.style.display='flex';
  DRAFTS.forEach((d,i)=>{
    const cell=document.createElement('div'); cell.className='dcell';
    if(d.kind==='image'){ const im=document.createElement('img'); im.className='dthumb'; im.src=d.url; cell.appendChild(im); }
    else { const ic=document.createElement('span'); ic.className='dic'; ic.textContent=(typeof fileIcon==='function')?fileIcon(d.file.name,d.file.type):'\uD83D\uDCCE'; cell.appendChild(ic); const nm=document.createElement('span'); nm.className='dname'; nm.textContent=d.file.name||T('draft_file'); cell.appendChild(nm); }
    const x=document.createElement('button'); x.className='dx'; x.textContent='\u00D7'; x.title=T('draft_cancel'); x.onclick=()=>draftRemove(i); cell.appendChild(x);
    bar.appendChild(cell);
  });
  if(DRAFTS.length>1){ const clr=document.createElement('button'); clr.className='dclrall'; clr.textContent=T('draft_clearall'); clr.onclick=()=>draftClear(); bar.appendChild(clr); }
}
async function sendDraft(){ const items=DRAFTS.slice(); DRAFTS=[]; renderDraft(); for(const d of items){ try{ if(d.kind==='image'){ await sendImage(d.file); } else { await sendFile(d.file); } }catch(e){ log(e.message); alert((typeof hpErrShow==='function'?hpErrShow(e):e.message)); } if(d.url){ try{ URL.revokeObjectURL(d.url); }catch(e){} } } }
function _v47b_sendChat_orig(){ bgReset();
  const t=$('#text').value.trim(); if(!t)return;
  if(!ID){ alert(T('al_noid')); return; }
  const ts=Date.now();
  const peer=($('#peer').value||'').trim(); if(!peer){ alert(T('al_nopeer')); return; }
  if(CURPEER!==peer){ CURPEER=peer; histRender(peer); }
  if(typeof rtcLineTo==='function'&&rtcLineTo(peer)){
    histAdd(peer,'s',t,ts,1); addMsgAt('self',t,myName()||T('me'),ts,0,1); $('#text').value='';
    if(!rtcSend(peer,t,ts)) hpSendText(peer,t,ts); return;
  }
  if(typeof hpSendText==='function'){
    if(!hpCardOf(peer)){ alert(T('al_nocard')); return; }
    histAdd(peer,'s',t,ts,1); addMsgAt('self',t,myName()||T('me'),ts,0,1); $('#text').value=''; hpSendText(peer,t,ts); if(typeof rtcCallMaybe==='function') rtcCallMaybe(peer); return;
  }
  alert(T('al_nocard'));
}
async function sendChat(){
  const hasText=(($('#text').value||'').trim().length>0);
  if(DRAFTS.length){ await sendDraft(); }
  if(hasText){ _v47b_sendChat_orig(); }
  scrollNew(true);
}
