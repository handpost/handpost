let ACK_MS=6000; const ACKS=new Map();
const WAIT_ACS=new Set();
function abortAllWaits(){ for(const ac of WAIT_ACS){ try{ ac.abort(); }catch(e){} } WAIT_ACS.clear(); }
async function firstOk(ps){
  return await new Promise((resolve,reject)=>{
    let left=ps.length, lastErr=null, errJ=null, nfJ=null;
    if(!left){ reject(new Error('no relay')); return; }
    const done=()=>{ if(--left)return; if(lastErr){ reject(lastErr); return; } const r=errJ||nfJ; if(r)resolve(r); else reject(new Error('all relays failed')); };
    ps.forEach(p=>p.then(j=>{ if(j&&j.ok){ resolve(j); return; } if(j&&j.error==='not_found')nfJ=j; else if(j)errJ=j; done(); },
                          e=>{ lastErr=e; done(); }));
  });
}
function ackWait(peer,ts,text){ const prev=ACKS.get(ts); const tries=prev?prev.tries:0; if(prev)clearTimeout(prev.timer); ACKS.set(ts,{tries,timer:setTimeout(()=>ackTimeout(peer,ts,text),ACK_MS)}); }
function ackClear(ids){ for(const id of (ids||[])){ const a=ACKS.get(Number(id)); if(a){ clearTimeout(a.timer); ACKS.delete(Number(id)); } } }
function ackTimeout(peer,ts,text){
  const a=ACKS.get(ts); ACKS.delete(ts);
  const m=histLoad(peer).find(x=>x.ts===ts&&x.d==='s'); if(!m||m.k||m.x||!m.p||m.hp)return;
  log(TL('lg_noack',{sec:ACK_MS/1000,n:ts}));
  if(typeof rtcLineTo==='function'&&rtcLineTo(peer)){ addStat(TL('sys_line_dead')); hangup(); }
  if(!m.img&&!m.file){ rtcFallback(peer,ts,text); return; }
  const tries=(a?a.tries:0)+1;
  if(tries>2){ log(TL('lg_ack_giveup',{n:ts})); return; }
  ACKS.set(ts,{tries,timer:null});
  setTimeout(()=>{ if(MODE==='idle'&&!PC){ startCall(true,peer); } },600);
}

