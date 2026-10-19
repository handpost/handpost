async function edSign(msg){
  return bytesToHex(new Uint8Array(await crypto.subtle.sign({name:'Ed25519'},EDPRIV,te.encode(msg))));
}
async function edVerify(pubHex,msg,sigHex){
  try{
    const k=await crypto.subtle.importKey('raw',hexToBytes(pubHex),{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify({name:'Ed25519'},k,hexToBytes(sigHex),te.encode(msg));
  }catch(e){return false;}
}

