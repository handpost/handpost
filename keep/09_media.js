const IMG_MAX=1600, IMG_Q=0.85, THUMB_MAX=160, CHUNK=16384, IMG_MAX_BYTES=25*1024*1024;
let IDB=null; const BLOBMEM=new Map();
function blobKey(id){ return (ID?ID.address:'')+':'+id; }
function idbOpen(){ if(IDB)return Promise.resolve(IDB); if(typeof indexedDB==='undefined')return Promise.resolve(null); return new Promise(res=>{ try{ const r=indexedDB.open('p2pchat-blobs',1); r.onupgradeneeded=()=>{ r.result.createObjectStore('blobs'); }; r.onsuccess=()=>{ IDB=r.result; res(IDB); }; r.onerror=()=>res(null); }catch(e){ res(null); } }); }

async function blobPut(id,blob){ if(typeof hpHBlobPut==='function') return await hpHBlobPut(id,blob); BLOBMEM.set(blobKey(id),blob); return true; }
async function blobGet(id){ if(typeof hpHBlobGet==='function') return await hpHBlobGet(id); return BLOBMEM.get(blobKey(id))||null; }
function loadImage(blob){ return new Promise((res,rej)=>{ const u=URL.createObjectURL(blob); const im=new Image(); im.onload=()=>{ URL.revokeObjectURL(u); res(im); }; im.onerror=()=>{ URL.revokeObjectURL(u); rej(new Error('decode')); }; im.src=u; }); }
function canvasBlob(c,type,q){ return new Promise(res=>c.toBlob(b=>res(b),type,q)); }
async function prepareImage(file){
  const im=await loadImage(file); const sw=im.naturalWidth||im.width, sh=im.naturalHeight||im.height;
  const sc=Math.min(1,IMG_MAX/Math.max(sw,sh)); const w=Math.max(1,Math.round(sw*sc)), h=Math.max(1,Math.round(sh*sc));
  const c=document.createElement('canvas'); c.width=w; c.height=h; c.getContext('2d').drawImage(im,0,0,w,h);
  const blob=await canvasBlob(c,'image/jpeg',IMG_Q); if(!blob)throw new Error('encode');
  const ts=Math.min(1,THUMB_MAX/Math.max(w,h)); const tw=Math.max(1,Math.round(w*ts)), th=Math.max(1,Math.round(h*ts));
  const tc=document.createElement('canvas'); tc.width=tw; tc.height=th; tc.getContext('2d').drawImage(im,0,0,tw,th);
  return {blob,w,h,mime:'image/jpeg',thumb:tc.toDataURL('image/jpeg',0.6)};
}
async function imgIdOf(blob){ return (await sha256hexBytes(new Uint8Array(await blob.arrayBuffer()))).slice(0,32); }
async function sendChunks(dc,blob){ const buf=await blob.arrayBuffer(); for(let o=0;o<buf.byteLength;o+=CHUNK){ while((dc.bufferedAmount||0)>4*1024*1024){ await sleep(50); } dc.send(buf.slice(o,Math.min(o+CHUNK,buf.byteLength))); } }
const RX=new WeakMap();
function rxStart(dc,hdr){ RX.set(dc,{hdr,parts:[],got:0}); }
function rxChunk(dc,buf){ const r=RX.get(dc); if(!r)return null; r.parts.push(buf); r.got+=buf.byteLength; if(r.parts.length>=r.hdr.n||r.got>=r.hdr.size){ RX.delete(dc); return {hdr:r.hdr,blob:new Blob(r.parts,{type:r.hdr.mime||'image/jpeg'})}; } return null; }

const PEER_CAPS={}; const CAPS=['img']; const LEFTOVER=[]; const KNOCK_LATER={};
function sendHello(peer){ try{ if(DC&&DC.readyState==='open')DC.send(JSON.stringify({v:1,type:'hello',caps:CAPS,app:43})); }catch(e){} }
function peerHasCap(peer,cap){ const c=PEER_CAPS[peer]; return !!(c&&c.caps&&c.caps.indexOf(cap)>=0); }
async function waitCaps(peer,ms){ const t0=Date.now(); while(Date.now()-t0<ms){ if(PEER_CAPS[peer]&&PEER_CAPS[peer].line===DC)return peerHasCap(peer,'img'); if(!DC||DC.readyState!=='open')return false; await sleep(100); } return false; }
function cleanupJunk(){ if(!ID)return; let n=0; for(const c of contacts()){ const h=histLoad(c.address); const f=h.filter(x=>!(x.d==='p'&&(x.t==='[object ArrayBuffer]'||x.t==='[object Blob]'))); if(f.length!==h.length){ n+=h.length-f.length; SIB_APPLYING=true; try{ histSave(c.address,f); }finally{ SIB_APPLYING=false; } } } if(n)log(TL('lg_junkclean',{n})); }
const IMG_QUEUE=[]; let IMG_SENDING=false;
function imgQueueSend(peer,m){ IMG_QUEUE.push({peer,m}); imgPump().catch(e=>log(TL('lg_imgfail',{err:e.message}))); }
async function imgPump(){
  if(IMG_SENDING)return; IMG_SENDING=true;
  try{ while(IMG_QUEUE.length){ const q=IMG_QUEUE.shift(); if(!rtcLineTo(q.peer)){ IMG_QUEUE.length=0; break; } rtcTouch();
    if(!(await waitCaps(q.peer,3000))){ log(TL('lg_peer_noimg',{who:nickOf(q.peer)})); addSys(TF('sys_peer_noimg',{who:nickOf(q.peer)})); IMG_QUEUE.length=0; break; }
    const blob=await blobGet(q.m.img.id); if(!blob){ log(TL('lg_imgmissing',{id:q.m.img.id})); continue; }
    const n=Math.ceil(blob.size/CHUNK);
    try{ DC.send(JSON.stringify(Object.assign({v:1,type:'img',id:q.m.img.id,ts:q.m.ts,w:q.m.img.w,h:q.m.img.h,size:blob.size,mime:q.m.img.mime||'image/jpeg',thumb:q.m.img.thumb,n},hpBackHdr(q.m))));   await sendChunks(DC,blob); try{ if(typeof hpSceneLetter==='function') hpSceneLetter('hand','out'); }catch(_){}   ackWait(q.peer,q.m.ts,''); log(TL('lg_imgsent',{kb:Math.round(blob.size/1024)})); }catch(e){ log(TL('lg_imgfail',{err:e.message})); }
  } } finally { IMG_SENDING=false; }
}
async function sendImage(file){
  if(!ID){ alert(T('al_noid')); return; }
  const peer=($('#peer').value||'').trim(); if(!peer){ alert(T('al_nopeer')); return; }
  if(!file||!/^image\//.test(file.type||'')){ alert(T('al_notimage')); return; }
  if(file.size>IMG_MAX_BYTES){ alert(T('al_imgbig')); return; }
  let p; try{ p=await prepareImage(file); }catch(e){ alert(T('e_imgprep')+': '+(typeof hpErrShow==='function'?hpErrShow(e):e.message)); return; }
  const id=await imgIdOf(p.blob); await blobPut(id,p.blob);
  const ts=Date.now(); const img={id,w:p.w,h:p.h,size:p.blob.size,mime:p.mime,thumb:p.thumb};
  if(CURPEER!==peer){ CURPEER=peer; histRender(peer); }
  histAdd(peer,'s','',ts,1,img); addMsgAt('self','',myName()||T('me'),ts,0,1,0,img);
  if(rtcLineTo(peer)){ imgQueueSend(peer,{ts,img}); }
  else if(rtcBusyFor(peer)){ rtcMediaWait(peer,ts); }
  else { if(!rtcCallMaybe(peer)){ try{ if(typeof hpDecorate==='function') hpDecorate(peer); }catch(e){} } }
}
function imgRecvHeader(peer,o){ if(!o||!o.id||typeof o.ts!=='number'||!o.n||!DC)return; rxStart(DC,{peer,id:o.id,ts:o.ts,w:o.w,h:o.h,size:o.size,mime:o.mime,thumb:o.thumb,n:o.n,back:o.back===1?1:0,xh:o.xh});   }
async function onDCBinary(buf,peer){
  if(!DC)return; const done=rxChunk(DC,buf); if(!done)return;
  if(done.hdr.kind==='file'){ await onDCFileChunk(peer,done); return; }
  const h=done.hdr; await blobPut(h.id,done.blob);
  if(h.back&&typeof hpBackIn==='function'){ const img={id:h.id,w:h.w,h:h.h,size:h.size,mime:h.mime,thumb:h.thumb}; const rb=hpBackIn(peer,h.ts,'',h.xh,{img:img}); hpLog('戻した写真が直結で届いた ← '+nickOf(peer)+'（'+hpBackWhy(rb)+'）'); rtcBadges(); }
  else if(!histLoad(peer).some(x=>x.ts===h.ts&&x.d==='p')&&!histVoided(peer,h.ts)){ const img={id:h.id,w:h.w,h:h.h,size:h.size,mime:h.mime,thumb:h.thumb}; histAdd(peer,'p','',h.ts,0,img,null,{fd:(typeof hpFdOf==='function')?hpFdOf(RTC_DEV):''});   if(rtcShown(peer))addMsgAt('peer','',nickOf(peer),h.ts,0,0,0,img); rtcBadges(); }
  rtcGot(peer,[h.ts]); if(rtcShown(peer)) rtcReadSoon(peer);
  log(TL('lg_imgrecv',{who:nickOf(peer),kb:Math.round(h.size/1024)}));
}
async function openPhoto(img){
  const lb=document.getElementById('lightbox'), li=document.getElementById('lightbox-img'); if(!lb||!li)return;
  let blob=await blobGet(img.id); if(blob){ li.src=URL.createObjectURL(blob); lb.style.display='flex'; return; }
  li.src=img.thumb; lb.style.display='flex';
  blob=await sibFetchBlob(img.id);
  if(blob){ if(lb.style.display!=='none') li.src=URL.createObjectURL(blob); }
  else { const w=sibBlobWhy(T('bk_photo')); log(w); try{ addSys(w); }catch(e){} }
}

const BLOBWAIT={}, SIB_BLOB_CHAIN={}; let SIB_BLOB_AUTO=5*1024*1024, SIB_BLOB_WAIT=30000;
function sibBlobLog(s){ try{ (typeof hpLog==='function'?hpLog:log)(s); }catch(e){} }
function sibBlobKind(mime){ return /^image\//.test(mime||'')?'写真':'ファイル'; }
function sibBlobShort(id){ return String(id||'').slice(0,8)+'…'; }
function sibOpenIds(prefer){ const ids=Object.keys(SIB).filter(k=>SIB[k]&&SIB[k].state==='open'&&SIB[k].dc&&SIB[k].dc.readyState==='open'); if(prefer&&ids.includes(prefer)){ ids.splice(ids.indexOf(prefer),1); ids.unshift(prefer); } return ids; }
function sibFetchBlob(id,prefer){
  if(!id) return Promise.resolve(null); if(BLOBWAIT[id]) return BLOBWAIT[id].p;
  const ids=sibOpenIds(prefer); if(!ids.length) return Promise.resolve(null);
  let done; const p=new Promise(res=>{ done=res; });
  const w={p:p,ids:ids,cur:null,t:null,
    res:b=>{ if(w.t){ clearTimeout(w.t); w.t=null; } delete BLOBWAIT[id]; done(b||null); },
    next:()=>{ if(w.t){ clearTimeout(w.t); w.t=null; } const sid=w.ids.shift(); if(!sid){ w.res(null); return; } w.cur=sid; if(!sibSend(sid,{t:'blobreq',id:id})){ w.next(); return; } sibBlobLog('本体（'+sibBlobShort(id)+'）を自分の機械（'+sibLabel(sid)+'）に頼んだ'); w.t=setTimeout(()=>w.next(),SIB_BLOB_WAIT); }};
  BLOBWAIT[id]=w; w.next(); return p;
}
function sibBlobNo(id,sid){ const w=BLOBWAIT[id]; if(!w||w.cur!==sid)return; sibBlobLog('自分の機械（'+sibLabel(sid)+'）は、本体（'+sibBlobShort(id)+'）を持っていない'+(w.ids.length?'。次の機械に頼む':'')); w.next(); }
function sibServeBlob(id,sid){ const prev=SIB_BLOB_CHAIN[sid]||Promise.resolve(); const p=prev.then(()=>sibServeBlob1(id,sid)).catch(()=>{}); SIB_BLOB_CHAIN[sid]=p; return p; }
async function sibServeBlob1(id,sid){
  const s=SIB[sid]; if(!s||!s.dc||s.dc.readyState!=='open')return;
  const blob=id?await blobGet(id):null;
  if(!blob){ s.dc.send(JSON.stringify({t:'blobno',id:id})); sibBlobLog('頼まれた本体（'+sibBlobShort(id)+'）はこの機械に無い → 自分の機械（'+sibLabel(sid)+'）へ「無い」と答えた'); return; }
  const mime=blob.type||'application/octet-stream';
  s.dc.send(JSON.stringify({t:'blob',id:id,size:blob.size,n:Math.ceil(blob.size/CHUNK),mime:mime})); await sendChunks(s.dc,blob);
  sibBlobLog(sibBlobKind(mime)+'の本体を自分の機械（'+sibLabel(sid)+'）へ渡した（'+Math.round(blob.size/1024)+' KB）');
}
async function sibBinary(sid,buf){
  const s=SIB[sid]; if(!s||!s.dc)return; const done=rxChunk(s.dc,buf); if(!done)return; const h=done.hdr, w=BLOBWAIT[h.id];
  let same=false; try{ same=(await imgIdOf(done.blob))===h.id; }catch(e){}
  if(!same){ sibBlobLog('自分の機械（'+sibLabel(sid)+'）から届いた本体の番号が合わない（捨てた）'); if(w&&w.cur===sid) w.next(); return; }
  await blobPut(h.id,done.blob); sibBlobLog(sibBlobKind(h.mime)+'の本体を自分の機械（'+sibLabel(sid)+'）から受け取った（'+Math.round(done.blob.size/1024)+' KB）');
  if(w) w.res(done.blob);
}
async function sibBlobAuto(img,sid){ try{ if(!img||!img.id||(Number(img.size)||0)>SIB_BLOB_AUTO) return; if(await blobGet(img.id)) return; await sibFetchBlob(img.id,sid); }catch(e){} }
function sibBlobWhy(kind){ let devs='—'; try{ const rows=(typeof hpSibs==='function'&&ID)?hpSibs():[]; devs=rows.map(d=>d.label||String(d.dev).slice(0,10)+'…').join('・')||'—'; }catch(e){} return TF(sibOpenIds().length?'sys_blob_none':'sys_blob_noline',{kind:kind,devs:devs}); }

const FILE_MAX_BYTES=100*1024*1024; CAPS.push('file');
function fmtSize(n){ if(n>=1048576)return (n/1048576).toFixed(1)+' MB'; if(n>=1024)return Math.round(n/1024)+' KB'; return n+' B'; }

const HP_RISKY_EXT=['exe','msi','msix','msixbundle','msp','com','scr','pif','cpl','bat','cmd','ps1','psm1','psd1','vbs','vbe','js','jse','mjs','wsf','wsh','hta','jar','lnk','url','reg','inf','scf','chm','dll','sys','drv','ocx','apk','xapk','apks','aab','ipa','app','dmg','pkg','mpkg','command','sh','bash','run','appimage','deb','rpm','iso','img','vhd','vhdx','appx','appxbundle','application','gadget','docm','dotm','xlsm','xltm','xlam','pptm','potm','ppam','ppsm','sldm','html','htm','xhtml','xht','mht','mhtml','svg','svgz'];
const HP_RISKY_MIME=['application/x-msdownload','application/x-msdos-program','application/x-msi','application/vnd.microsoft.portable-executable','application/x-dosexec','application/vnd.android.package-archive','application/java-archive','application/x-sh','application/x-bat','application/hta','application/x-ms-shortcut','text/html','application/xhtml+xml','image/svg+xml'];
function hpFileName(n){ return String(n==null?'':n).replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]/g,'').replace(/[\s.]+$/,''); }
function hpFileRisky(name,mime){ const n=hpFileName(name).toLowerCase(), dot=n.lastIndexOf('.'), ext=dot>=0?n.slice(dot+1):''; if(HP_RISKY_EXT.indexOf(ext)>=0) return ext; const mm=String(mime||'').toLowerCase().split(';')[0].trim(); if(HP_RISKY_MIME.indexOf(mm)>=0) return ext||mm; return ''; }
function fileIcon(name,mime){ const e=(name||'').toLowerCase().split('.').pop(); if(/pdf/.test(mime)||e==='pdf')return '\uD83D\uDCC4'; if(/(word|msword|officedocument.word)/.test(mime)||e==='doc'||e==='docx')return '\uD83D\uDCDD'; if(/(excel|spreadsheet|officedocument.sheet)/.test(mime)||e==='xls'||e==='xlsx'||e==='csv')return '\uD83D\uDCCA'; if(/(powerpoint|presentation)/.test(mime)||e==='ppt'||e==='pptx')return '\uD83D\uDCC1'; if(/zip|compressed|rar|7z/.test(mime)||e==='zip'||e==='rar'||e==='7z')return '\uD83D\uDDDC'; if(/^audio\//.test(mime))return '\uD83C\uDFB5'; if(/^video\//.test(mime))return '\uD83C\uDFAC'; if(/^text\//.test(mime))return '\uD83D\uDCC3'; return '\uD83D\uDCCE'; }
async function sendFile(file){
  if(!ID){ alert(T('al_noid')); return; }
  const peer=($('#peer').value||'').trim(); if(!peer){ alert(T('al_nopeer')); return; }
  if(!file){ alert(T('al_nofile')); return; }
  if(/^image\//.test(file.type||'')){ return sendImage(file); }
  { const rk=hpFileRisky(file.name,file.type); if(rk){ alert(TF('al_file_risky',{name:hpFileName(file.name)||'file'})); return; } }
  if(file.size>FILE_MAX_BYTES){ alert(T('al_filebig')); return; }
  const blob=file.slice(0,file.size,file.type||'application/octet-stream');
  const id=await imgIdOf(blob); await blobPut(id,blob);
  const ts=Date.now(); const meta={id,name:file.name||'file',size:blob.size,mime:file.type||'application/octet-stream'};
  if(CURPEER!==peer){ CURPEER=peer; histRender(peer); }
  histAdd(peer,'s','',ts,1,null,meta); addMsgAt('self','',myName()||T('me'),ts,0,1,0,null,meta);
  if(rtcLineTo(peer)){ fileQueueSend(peer,{ts,file:meta}); }
  else if(rtcBusyFor(peer)){ rtcMediaWait(peer,ts); }
  else { if(!rtcCallMaybe(peer)){ try{ if(typeof hpDecorate==='function') hpDecorate(peer); }catch(e){} } }
}
const FILE_QUEUE=[]; let FILE_SENDING=false;
function fileQueueSend(peer,m){ FILE_QUEUE.push({peer,m}); filePump().catch(e=>log(TL('lg_filefail',{err:e.message}))); }
async function filePump(){
  if(FILE_SENDING)return; FILE_SENDING=true;
  try{ while(FILE_QUEUE.length){ const q=FILE_QUEUE.shift(); if(!rtcLineTo(q.peer)){ FILE_QUEUE.length=0; break; } rtcTouch();
    if(!(await waitFileCap(q.peer,3000))){ log(TL('lg_peer_nofile',{who:nickOf(q.peer)})); addSys(TF('sys_peer_nofile',{who:nickOf(q.peer)})); FILE_QUEUE.length=0; break; }
    const blob=await blobGet(q.m.file.id); if(!blob){ log(TL('lg_filemissing',{name:q.m.file.name})); continue; }
    const n=Math.ceil(blob.size/CHUNK);
    try{ DC.send(JSON.stringify(Object.assign({v:1,type:'file',id:q.m.file.id,ts:q.m.ts,name:q.m.file.name,size:blob.size,mime:q.m.file.mime,n},hpBackHdr(q.m))));   await sendChunks(DC,blob); try{ if(typeof hpSceneLetter==='function') hpSceneLetter('hand','out'); }catch(_){}   ackWait(q.peer,q.m.ts,''); log(TL('lg_filesent',{name:q.m.file.name,kb:Math.round(blob.size/1024)})); }catch(e){ log(TL('lg_filefail',{err:e.message})); }
  } } finally { FILE_SENDING=false; }
}
async function waitFileCap(peer,ms){ const t0=Date.now(); while(Date.now()-t0<ms){ if(PEER_CAPS[peer]&&PEER_CAPS[peer].line===DC)return peerHasCap(peer,'file'); if(!DC||DC.readyState!=='open')return false; await sleep(100); } return false; }
function fileRecvHeader(peer,o){ if(!o||!o.id||typeof o.ts!=='number'||!o.n||!DC)return; rxStart(DC,{kind:'file',peer,id:o.id,ts:o.ts,name:o.name,size:o.size,mime:o.mime,n:o.n,back:o.back===1?1:0,xh:o.xh});   }
async function onDCFileChunk(peer,done){ const h=done.hdr; const risk=!!hpFileRisky(h.name,h.mime); if(risk){ try{ hpLog('実行ファイルなどの種類なので、本体は置かず見出しだけ残した（'+hpFileName(h.name)+'）← '+nickOf(peer)); }catch(e){} } else await blobPut(h.id,done.blob);   if(h.back&&typeof hpBackIn==='function'){ const meta={id:h.id,name:h.name,size:h.size,mime:h.mime}; const rb=hpBackIn(peer,h.ts,'',h.xh,{file:meta}); hpLog('戻したファイルが直結で届いた ← '+nickOf(peer)+'（'+hpBackWhy(rb)+'）'); rtcBadges(); }   else if(!histLoad(peer).some(x=>x.ts===h.ts&&x.d==='p')&&!histVoided(peer,h.ts)){ const meta={id:h.id,name:h.name,size:h.size,mime:h.mime}; if(risk) meta.risk=1;   histAdd(peer,'p','',h.ts,0,null,meta,{fd:(typeof hpFdOf==='function')?hpFdOf(RTC_DEV):''});   if(rtcShown(peer))addMsgAt('peer','',nickOf(peer),h.ts,0,0,0,null,meta); rtcBadges(); } rtcGot(peer,[h.ts]); if(rtcShown(peer)) rtcReadSoon(peer);   log(TL('lg_filerecv',{who:nickOf(peer),name:h.name,kb:Math.round(h.size/1024)})); }
async function saveFile(meta){ if(meta&&(meta.risk||hpFileRisky(meta.name,meta.mime))){ try{ hpToast(T('tx_risky'),3600); }catch(e){ alert(T('tx_risky')); } return false; }   let blob=await blobGet(meta.id); if(!blob)blob=await sibFetchBlob(meta.id); if(!blob){ const w=sibBlobWhy(T('bk_file')); log(w); alert(w); return false; }   return await hpBlobDownload(blob,hpFileName(meta.name)||'file');   }

function hpImgExt(t){ t=String(t||'').toLowerCase(); return t.indexOf('png')>=0?'png':t.indexOf('webp')>=0?'webp':t.indexOf('gif')>=0?'gif':'jpg'; }
function hpStamp(ms){ const d=new Date(ms), p=n=>String(n).padStart(2,'0'); return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()); }
function hpIsIOS(){ try{ const n=navigator; return /iPhone|iPad|iPod/.test(n.userAgent||'')||(n.platform==='MacIntel'&&n.maxTouchPoints>1); }catch(e){ return false; } }
async function hpBlobDownload(blob,name){
  if(hpIsIOS()&&/^image\//.test(blob.type||'')&&navigator.canShare&&navigator.share){ try{ const f=new File([blob],name,{type:blob.type}); if(navigator.canShare({files:[f]})){ await navigator.share({files:[f]}); return true; } }catch(e){ if(e&&e.name==='AbortError') return false; } }
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(()=>URL.revokeObjectURL(url),10000);
  try{ if(typeof hpToast==='function') hpToast(T('tx_saved'),2400); }catch(e){} return true;
}
async function hpSaveToDevice(rec){
  try{ if(rec&&rec.file&&rec.file.id) return await saveFile(rec.file);
    const img=rec&&rec.img; if(!img||!img.id) return false;
    let blob=await blobGet(img.id); if(!blob) blob=await sibFetchBlob(img.id);
    if(!blob){ const w=sibBlobWhy(T('bk_photo')); log(w); alert(w); return false; }
    return await hpBlobDownload(blob,'handpost-'+hpStamp(Number(rec.ts)||Date.now())+'.'+hpImgExt(blob.type||img.mime));
  }catch(e){ log('端末に保存できなかった：'+e.message); return false; }
}

