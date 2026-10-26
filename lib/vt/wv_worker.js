// Handpost: speech to text inside this device (Whisper base, ONNX). Audio never leaves the device.
// Files come only from this site's /lib/vt/. When the page passes the signed SHA256SUMS list, every file is checked before it is kept.
// bk36f108: download streams straight into the cache (no whole-file copy in memory); download and speech-to-text run in separate workers; every error names its stage.
const B='/lib/vt/', CK='hp-wv-1';
const FILES=[['whisper-base/config.json',2243],['whisper-base/generation_config.json',3832],['whisper-base/preprocessor_config.json',339],['whisper-base/tokenizer.json',2480466],['whisper-base/tokenizer_config.json',282682],['whisper-base/onnx/encoder_model_quantized.onnx',23201314],['whisper-base/onnx/decoder_model_merged_quantized.onnx',53693315],['ort-wasm-simd-threaded.wasm',14264838]];
const TOTAL=FILES.reduce((a,f)=>a+f[1],0);
let SUMS=null, ASR=null, NET=0, GOT=0, ID=0, LAST=0;
const hex=b=>Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,'0')).join('');
function prog(){ if(GOT-LAST<1048576&&GOT<TOTAL) return; LAST=GOT; postMessage({id:ID,p:Math.min(99,Math.floor(GOT*100/TOTAL))}); }
async function fetchKeep(rel){ const url=B+rel, c=await caches.open(CK); if(await c.match(url)) return;
  NET++; const r=await fetch(url,{cache:'no-store'}); if(!r.ok||!r.body) throw new Error(rel+' '+r.status);
  const count=new TransformStream({transform(ch,ctl){ GOT+=ch.byteLength; prog(); ctl.enqueue(ch); }});
  await c.put(url,new Response(r.body.pipeThrough(count),{headers:{'Content-Type':r.headers.get('Content-Type')||'application/octet-stream'}}));
  if(SUMS){ const m=await c.match(url); let got=''; try{ got=hex(await crypto.subtle.digest('SHA-256',await m.arrayBuffer())); }catch(e){ await c.delete(url); throw e; } const want=SUMS['lib/vt/'+rel]; if(!want||want!==got){ await c.delete(url); throw new Error('sum '+rel); } } }
async function getFile(rel){ const c=await caches.open(CK), hit=await c.match(B+rel); if(!hit) throw new Error('missing '+rel); return hit; }
async function has(){ const c=await caches.open(CK); for(const f of FILES) if(!(await c.match(B+f[0]))) return false; return true; }
async function load(){ if(ASR) return ASR;
  const X=await import(B+'transformers.min.js'); const env=X.env; env.allowRemoteModels=false; env.allowLocalModels=true; env.localModelPath=B; env.useBrowserCache=false; env.useWasmCache=false;
  env.fetch=async u=>{ const p=new URL(String(u),self.location.href).pathname; if(p.indexOf(B)===0) return getFile(p.slice(B.length)); throw new Error('outside '+p); };
  env.backends.onnx.wasm.wasmBinary=await (await getFile('ort-wasm-simd-threaded.wasm')).arrayBuffer(); env.backends.onnx.wasm.wasmPaths={mjs:B+'ort-wasm-simd-threaded.mjs',wasm:B+'ort-wasm-simd-threaded.wasm'}; env.backends.onnx.wasm.numThreads=1;
  ASR=await X.pipeline('automatic-speech-recognition','whisper-base',{dtype:'q8',device:'wasm'}); return ASR; }
const st=(s,f)=>f().catch(e=>{ throw new Error(s+': '+String(e&&(e.message||e.name)||e).slice(0,160)); });
onmessage=async e=>{ const m=e.data||{}; ID=m.id; try{
  if(m.sums) SUMS=m.sums;
  if(m.op==='has'){ postMessage({id:m.id,ok:true,has:await has()}); return; }
  if(m.op==='dl'){ GOT=0; LAST=0; await st('dl',async()=>{ for(const f of FILES) await fetchKeep(f[0]); }); postMessage({id:m.id,ok:true,net:NET}); return; }
  if(m.op==='run'){ const a=await st('load',load); const sec=(m.pcm&&m.pcm.length||0)/16000, mx=Math.max(24,Math.min(224,Math.round(sec*10)+16));
    const o=await st('run',()=>a(m.pcm,{language:m.lang||'japanese',task:'transcribe',chunk_length_s:30,stride_length_s:5,max_new_tokens:mx,no_repeat_ngram_size:4,repetition_penalty:1.15}));
    postMessage({id:m.id,ok:true,text:String(o&&o.text||'').trim(),net:NET}); return; }
  if(m.op==='drop'){ ASR=null; await caches.delete(CK); postMessage({id:m.id,ok:true}); return; }
  postMessage({id:m.id,ok:false,err:'op'});
 }catch(err){ postMessage({id:m.id,ok:false,err:String(err&&err.message||err).slice(0,200)}); } };
