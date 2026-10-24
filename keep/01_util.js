'use strict';

function hpFramed(w){ try{ return !!(w&&w.top&&w.self&&w.top!==w.self); }catch(e){ return true; } }
function hpFrameStop(w,d){ try{ if(typeof w.stop==='function') w.stop(); }catch(e){} try{ d.documentElement.innerHTML='<head><meta charset="utf-8"><title>Handpost</title></head><body style="margin:0;padding:24px;background:#0b1220;color:#e6edf3;font:16px/1.7 system-ui,sans-serif"><p>Handpost は、ほかのページの中では動きません。<br>This page cannot run inside another page.</p><p><a href="https://handpost.page/" target="_blank" rel="noopener" style="color:#2ed3c0">handpost.page を直接開く / Open handpost.page</a></p></body>'; }catch(e){} return true; }
if(typeof window!=='undefined'&&typeof document!=='undefined'&&hpFramed(window)){ hpFrameStop(window,document); throw new Error('framed'); }

function hpJit(ms,f){ f=(f==null)?0.2:f; return Math.max(0,Math.round(Number(ms)*(1-f+Math.random()*2*f))); }
let HP_SLOT_MEM=null;
function hpSlot(){ if(HP_SLOT_MEM!=null) return HP_SLOT_MEM; let raw=null; try{ raw=localStorage.getItem('hp_slot'); }catch(e){} let v=(raw==null||raw==='')?NaN:Number(raw); if(!(Number.isInteger(v)&&v>=0&&v<60)){ v=Math.floor(Math.random()*60); try{ localStorage.setItem('hp_slot',String(v)); }catch(e){} } HP_SLOT_MEM=v; return v; }
function hpSlotIn(now,P){ const w=P/60, off=hpSlot()*w, ph=(((Number(now)-off)%P)+P)%P; return ph<w; }
const $=s=>document.querySelector(s);
const te=new TextEncoder(), td=new TextDecoder();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const HP_LOG_LINES=[], HP_LOG_MAX=3000;
function log(m){if(typeof hpLogTr==='function')m=hpLogTr(m); const el=$('#log');const t=new Date().toLocaleTimeString('ja-JP');HP_LOG_LINES.push(`[${t}] ${m}\n`);if(HP_LOG_LINES.length>HP_LOG_MAX)HP_LOG_LINES.shift();const stick=!(el.clientHeight>0)||el.scrollHeight-el.scrollTop-el.clientHeight<40;el.textContent=HP_LOG_LINES.join('');if(stick)el.scrollTop=el.scrollHeight;}
function hpLogText(){return HP_LOG_LINES.join('');}
function hpLogClear(){HP_LOG_LINES.length=0;$('#log').textContent='';}
function bytesToHex(u){return [...u].map(b=>b.toString(16).padStart(2,'0')).join('');}
function hexToBytes(h){const u=new Uint8Array(h.length/2);for(let i=0;i<u.length;i++)u[i]=parseInt(h.substr(i*2,2),16);return u;}
function bytesToB64(u){let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);}
function b64ToBytes(b){const s=atob(b);const u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
function cat(a,b){const u=new Uint8Array(a.length+b.length);u.set(a);u.set(b,a.length);return u;}
function pemToBytes(p){return b64ToBytes(p.replace(/-----[^-]+-----/g,'').replace(/\s+/g,''));}
function bytesToPem(u){const b=bytesToB64(u);return '-----BEGIN PRIVATE KEY-----\n'+(b.match(/.{1,64}/g)||[]).join('\n')+'\n-----END PRIVATE KEY-----\n';}

function hpIdFmt(a){ return typeof a==='string' && /^hp1[0-9a-f]{64}$/.test(a); }
function hpIdShort(a){ return hpIdFmt(a) ? a.slice(0,11)+'\u2026' : String(a==null?'':a); }
async function hpIdOf(masterPubHex){ if(!/^[0-9a-f]{64}$/.test(masterPubHex||'')) throw new Error('bad master key'); return 'hp1'+bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',hexToBytes(masterPubHex)))); }
async function sha256hex(str){return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256',te.encode(str))));}

const HP_ERR_ODD=['TypeError','ReferenceError','SyntaxError','RangeError'];
function hpErrShow(e){
  const msg=(e&&e.message!=null)?String(e.message):String(e==null?'':e);
  if(!(e&&typeof e==='object'&&HP_ERR_ODD.includes(e.name))) return msg;
  try{ const s='思わぬ誤り（'+e.name+': '+msg+'）'+(e.stack?' '+String(e.stack).split('\n').slice(1,3).map(x=>x.trim()).join(' | '):''); if(typeof hpLog==='function') hpLog(s); else if(typeof log==='function') log(s); }catch(_){}
  return (typeof T==='function')?T('e_odd'):'Unexpected error';
}

