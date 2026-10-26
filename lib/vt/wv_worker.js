// Handpost: speech to text inside this device (Whisper base, ONNX). Audio never leaves the device.
// Files come only from this site's /lib/vt/. When the page passes the signed SHA256SUMS list, every file is checked before it is kept.
const B='/lib/vt/', CK='hp-wv-1';
const FILES=[['whisper-base/config.json',2243],['whisper-base/generation_config.json',3832],['whisper-base/preprocessor_config.json',339],['whisper-base/tokenizer.json',2480466],['whisper-base/tokenizer_config.json',282682],['whisper-base/onnx/encoder_model_quantized.onnx',23201314],['whisper-base/onnx/decoder_model_merged_quantized.onnx',53693315],['ort-wasm-simd-threaded.wasm',14264838]];
const TOTAL=FILES.reduce((a,f)=>a+f[1],0);
let SUMS=null, ASR=null, NET=0, GOT=0, ID=0;
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
function prog(){ postMessage({id:ID,p:Math.min(99,Math.floor(GOT*100/TOTAL))}); }
async function getFile(rel){ const url=B+rel, c=await caches.open(CK); const hit=await c.match(url); if(hit) return hit;
  NET++; const r=await fetch(url,{cache:'no-store'}); if(!r.ok) throw new Error(rel+' '+r.status);
  const parts=[]; let n=0, last=0; if(r.body&&r.body.getReader){ const rd=r.body.getReader(); for(;;){ const x=await rd.read(); if(x.done) break; parts.push(x.value); n+=x.value.byteLength; GOT+=x.value.byteLength; if(GOT-last>1048576){ last=GOT; prog(); } } } else { const u=new Uint8Array(await r.arrayBuffer()); parts.push(u); n=u.byteLength; GOT+=n; }
  const u=new Uint8Array(n); let o=0; for(const p of parts){ u.set(p,o); o+=p.byteLength; } prog();
  if(SUMS){ const want=SUMS['lib/vt/'+rel], got=hex(await crypto.subtle.digest('SHA-256',u)); if(!want||want!==got) throw new Error('sum '+rel); }
  const res=new Response(u,{headers:{'Content-Type':r.headers.get('Content-Type')||'application/octet-stream','Content-Length':String(n)}}); await c.put(url,res.clone()); return res; }
async function has(){ const c=await caches.open(CK); for(const f of FILES) if(!(await c.match(B+f[0]))) return false; return true; }
async function load(){ if(ASR) return ASR; GOT=0; for(const f of FILES) await getFile(f[0]);
  const X=await import(B+'transformers.min.js'); const env=X.env; env.allowRemoteModels=false; env.allowLocalModels=true; env.localModelPath=B; env.useBrowserCache=false; env.useWasmCache=false;
  env.fetch=async u=>{ const p=new URL(String(u),self.location.href).pathname; if(p.indexOf(B)===0) return getFile(p.slice(B.length)); throw new Error('outside '+p); };
  env.backends.onnx.wasm.wasmBinary=await (await getFile('ort-wasm-simd-threaded.wasm')).arrayBuffer(); env.backends.onnx.wasm.wasmPaths={mjs:B+'ort-wasm-simd-threaded.mjs',wasm:B+'ort-wasm-simd-threaded.wasm'}; env.backends.onnx.wasm.numThreads=1;
  ASR=await X.pipeline('automatic-speech-recognition','whisper-base',{dtype:'q8',device:'wasm'}); return ASR; }
onmessage=async e=>{ const m=e.data||{}; ID=m.id; try{
  if(m.sums) SUMS=m.sums;
  if(m.op==='has'){ postMessage({id:m.id,ok:true,has:await has()}); return; }
  if(m.op==='run'){ const a=await load(); const o=await a(m.pcm,{language:m.lang||'japanese',task:'transcribe',chunk_length_s:30,stride_length_s:5}); postMessage({id:m.id,ok:true,text:String(o&&o.text||'').trim(),net:NET}); return; }
  if(m.op==='drop'){ ASR=null; await caches.delete(CK); postMessage({id:m.id,ok:true}); return; }
  postMessage({id:m.id,ok:false,err:'op'});
 }catch(err){ postMessage({id:m.id,ok:false,err:String(err&&err.message||err).slice(0,200)}); } };
