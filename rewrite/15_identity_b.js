async function applyIdentity(obj,fromStorage){
  if(!obj||!obj.address||!obj.publicKey)throw new Error(T('e_badid'));
  let idMigFrom=null;
  if(!hpIdFmt(obj.address)){
    if(!obj.privateKeyPem) throw new Error(T('e_badid'));
    idMigFrom=obj.address; obj.address=await hpIdOf(obj.publicKey); obj.contacts=[];
    try{ const del=[]; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); const m=k&&/^p2p_(?:chat|req|lastopen|sibsince)_(.*)$/.exec(k); if(m&&!hpIdFmt(m[1])) del.push(k); } del.forEach(k=>localStorage.removeItem(k)); }catch(e){}
  } else if((await hpIdOf(obj.publicKey))!==obj.address) throw new Error(T('e_badid'));
  if(!obj.privateKeyPem&&obj.link){
    const kp=await hpDevKey();
    try{ if(Array.isArray(obj.roster)&&typeof hpTrChain==='function') await hpTrChain(obj.roster,[]); }catch(e){}
    if(obj.link.dev!==hpHex(kp.publicKey)||!(await hp5IdOk(obj.address,obj.publicKey,obj.link.dev,obj.link.devSig))) throw new Error(T('e_badid'));
    EDPRIV=null;
  } else {
    if(!obj.privateKeyPem) throw new Error(T('e_badid'));
    EDPRIV=await crypto.subtle.importKey('pkcs8',pemToBytes(obj.privateKeyPem),{name:'Ed25519'},false,['sign']);
  }
  ID=obj;
  if(!Array.isArray(ID.contacts)) ID.contacts=[];
  $('#addr').textContent=hpIdShort(ID.address);
  $('#id-addr').textContent=ID.address; $('#id-addr').style.wordBreak='break-all';
  renderContacts(); drawMyQR(); renderMyName(); renderDevMode(); renderDevices(); try{ if(typeof hpPaperUi==='function') hpPaperUi(); }catch(e){}   try{ if(typeof hpVaultUi==='function') hpVaultUi(); }catch(e){}
  try{ cleanupJunk(); }catch(e){}
  startBg();

  setMode(MODE);
  if(!myName()&&!(typeof HP_RE_BUSY!=='undefined'&&HP_RE_BUSY)){
    const suggested = (obj.myName||'').trim();
    const n = (prompt(T('pr_myname'), suggested)||'').trim();
    if(n){ ID.myName=n; saveID(); renderMyName(); }
  }
  hpSecSet('p2p_id',JSON.stringify(ID));
  log(TL('lg_idloaded',{addr:ID.address}));

  try{ if(typeof hpHOpen==='function'){ await hpHOpen(); await hpHMigrate(); await hpHSweep(false); } }catch(e){}
  try{ if(typeof hpContactsDedup==='function'&&hpContactsDedup()>0) saveID(); }catch(e){}
  try{ if(typeof hpHPersist==='function') await hpHPersist(); }catch(e){}
  if(idMigFrom){ log(TL('lg_idmig',{was:idMigFrom,now:ID.address})); try{ alert(T('al_idmig')); }catch(e){} }
  try{ if(typeof hpRkBoot==='function') await hpRkBoot(fromStorage?'起動':'作成'); }catch(e){}
}

async function generateIdentity(nameArg){

  if(typeof hpReady==='function') await hpReady();
  const paperP=crypto.getRandomValues(new Uint8Array(16)), mk=hpPaperMaster(paperP);
  const pubHex=mk.pub, pem=mk.pem;
  let myNameNew=(typeof nameArg==='string'?nameArg:(prompt(T('pr_myname'),'')||'')).trim();
  const address=await hpIdOf(pubHex);
  const obj={publicKey:pubHex,privateKeyPem:pem,address,contacts:[],myName:myNameNew,paper:hpHex(paperP)};
  EDPRIV=await crypto.subtle.importKey('pkcs8',pemToBytes(pem),{name:'Ed25519'},false,['sign']);
  log(TL('lg_newid',{addr:address}));

  await applyIdentity(obj,false);

  try{ if(typeof hpSafetyNag==='function') hpSafetyNag(); }catch(e){}
  try{ if(typeof hpPaperFlow==='function') hpPaperFlow(1); }catch(e){}
}

