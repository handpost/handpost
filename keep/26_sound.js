(function(){
  var AC = null;
  var LAST = { msg: 0, req: 0, warn: 0 };
  var THROTTLE_MS = 2000;

  function ctx(){
    if (!AC) {
      var C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      try { AC = new C(); } catch (e) { return null; }
    }
    return AC;
  }

  function tone(freq, at, dur, vol){
    var a = ctx(); if (!a) return;
    var o = a.createOscillator();
    var g = a.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(vol, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(a.destination);
    o.start(at); o.stop(at + dur + 0.03);
  }

  window.soundOn = function(v){
    var cur = null; try { cur = localStorage.getItem('p2p_sound'); } catch (e) {}
    if (v === undefined) return (cur === '0') ? 'off' : (cur || 'std');
    var name = (v === false || v === 'off') ? 'off'
             : (v === true) ? 'std'
             : (v === 'low' || v === 'one' || v === 'std') ? v : 'std';
    try { localStorage.setItem('p2p_sound', name); } catch (e) {}
    var sp = document.getElementById('snd-pick'); if (sp) sp.value = name;
    return name;
  };

  var TONES = {
    std: { msg: [[880.0,0,0.12],[1174.7,0.13,0.17]],
           req: [[988.0,0,0.10],[988.0,0.18,0.10],[988.0,0.36,0.10]],
           warn: [[1318.5,0,0.12],[880.0,0.14,0.12],[1318.5,0.28,0.12],[880.0,0.42,0.18]] },
    low: { msg: [[523.25,0,0.14],[659.25,0.15,0.20]],
           req: [[587.33,0,0.12],[587.33,0.20,0.12],[587.33,0.40,0.12]],
           warn: [[659.25,0,0.14],[440.0,0.16,0.14],[659.25,0.32,0.14],[440.0,0.48,0.20]] },
    one: { msg: [[1046.5,0,0.10]],
           req: [[1046.5,0,0.09],[1046.5,0.14,0.09]],
           warn: [[1318.5,0,0.08],[880.0,0.12,0.16]] }
  };
  function currentTone(){
    var v = null;
    try { v = localStorage.getItem('p2p_sound'); } catch (e) {}
    if (v === '0' || v === 'off') return null;
    return TONES[v] || TONES.std;
  }
  window.notifySound = function(kind){
    try {
      var set = currentTone(); if (!set) return;
      var k = (kind === 'req' || kind === 'warn') ? kind : 'msg';
      var now = Date.now();
      if (now - LAST[k] < THROTTLE_MS) return;
      LAST[k] = now;

      var a = ctx(); if (!a) return;
      if (a.state === 'suspended') { a.resume().catch(function(){}); }
      var t = a.currentTime + 0.01;
      var notes = set[k] || set.msg;
      for (var i = 0; i < notes.length; i++) {
        tone(notes[i][0], t + notes[i][1], notes[i][2], 0.16);
      }
    } catch (e) {   }
  };

  window.soundTry = function(){
    try {
      if (!currentTone()) return 0;
      LAST.msg = 0; window.notifySound('msg');
      setTimeout(function(){ try { LAST.warn = 0; window.notifySound('warn'); } catch (e) {} }, 1000);
      return 1;
    } catch (e) { return 0; }
  };

  function unlock(){
    try { var a = ctx(); if (a && a.state === 'suspended') a.resume(); } catch (e) {}
  }
  ['click','keydown','touchstart'].forEach(function(ev){
    document.addEventListener(ev, unlock, { passive: true });
  });
})();
