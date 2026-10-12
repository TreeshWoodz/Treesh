/* ---------- P9zzn: voice mic works on every tap (fresh recognizer per listen + start/hang watchdog, phones reuse breaks after audio plays) ---------- */
let _vxWd=null, _vxTry=0;
const _initV9zzn=initVoice; initVoice=function(){ const r=_initV9zzn.apply(this,arguments); const R=recog;
  if(R&&!R._zzn){ R._zzn=1; const os=R.onstart, ors=R.onresult, oe=R.onend, oer=R.onerror, hasAS=('onaudiostart' in R);
    const ok=()=>{ if(R._ok) return; R._ok=1; _vxTry=0; clearTimeout(_vxWd); };
    R.onstart=e=>{ R._st=1; if(!hasAS) ok(); return os&&os.call(R,e); };
    R.onaudiostart=ok; R.onsoundstart=ok;
    R.onresult=e=>{ ok(); return ors&&ors.call(R,e); };
    R.onend=e=>{ if(recog===R) clearTimeout(_vxWd); return oe&&oe.call(R,e); };
    R.onerror=e=>{ if(recog===R) clearTimeout(_vxWd); return oer&&oer.call(R,e); }; }
  return r; };
function vxFresh(){ const o=recog; if(o){ clearTimeout(_vxWd); o.onstart=o.onresult=o.onend=o.onerror=o.onaudiostart=o.onsoundstart=null; try{ o.abort(); }catch(e){} } recog=null; listening=false; initVoice(); return recog; }
function vxStart(){ if(!_voiceActive||_voicePaused||_voiceNoMic) return; const R=vxFresh(); if(!R){ _voiceMode='idle'; voiceRender(); return; }
  clearTimeout(_voiceRestartT); clearTimeout(_vxWd);
  try{ R.start(); listening=true; _voiceMode='listening'; }catch(e){ listening=false; _voiceMode='idle'; voiceRender(); vxRetry(); return; }
  voiceRender(); _vxWd=setTimeout(()=>{ if(recog===R&&!R._ok) vxRetry(); },R._st?1800:2400); }
function vxRetry(){ if(!_voiceActive||!document.getElementById('voice-ov')) return; listening=false;
  if(_vxTry>=3){ _vxTry=0; vxFresh(); _voiceMode='idle'; voiceRender(); toast('The mic didn\u2019t start','Tap the orb to try again'); return; }
  const d=[300,1000,2000][_vxTry++];
  if(_vxTry===1&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia){ navigator.mediaDevices.getUserMedia({audio:true}).then(s=>s.getTracks().forEach(t=>t.stop())).catch(()=>{}); }
  _voiceRestartT=setTimeout(vxStart,d); }
voiceListen=function(){ if(!_voiceActive||_voicePaused||_voiceSpeaking||_voiceNoMic||listening) return; vxStart(); };
vxListenNow=function(){ clearTimeout(_voiceRestartT); try{ window.speechSynthesis.cancel(); }catch(e){} _voiceSpeaking=false; _voicePaused=false; _voiceActive=true; _voiceNoMic=false; _vxUserAt=performance.now(); _vxTry=0;
  if(!(window.SpeechRecognition||window.webkitSpeechRecognition)){ toast('Microphone unavailable here','You can still type a command below'); return; } vxStart(); };
const _vKill9zzn=vxKill; vxKill=function(){ clearTimeout(_vxWd); _vxTry=0; const o=recog; if(o){ o.onaudiostart=o.onsoundstart=null; } return _vKill9zzn.apply(this,arguments); };

/* Urias text sizes itself to the room it has (tips, help list, keyboard or a short screen never cut it off) */
let _vxFitRO=null, _vxFitEl=null;
function vxFitNow(){ const w=_vxFitEl; if(!w||!w.isConnected) return; const box=[...w.children].find(c=>!c.classList.contains('vx-gone')); if(!box) return;
  const t=box.classList.contains('vx-say')?box.querySelector('.vx-say-t'):box; if(!t) return;
  const cs=getComputedStyle(w), avail=w.clientHeight-parseFloat(cs.paddingTop)-parseFloat(cs.paddingBottom); if(!(avail>0)) return;
  t.style.fontSize=''; t.style.maxHeight='none'; t.style.overflowY=''; t.style.setProperty('-webkit-line-clamp','none');
  const fits=()=>box.offsetHeight<=avail+.5; if(fits()) return;
  let lo=15, hi=parseFloat(getComputedStyle(t).fontSize)||30; for(let i=0;i<8;i++){ const mid=(lo+hi)/2; t.style.fontSize=mid+'px'; if(fits()) lo=mid; else hi=mid; }
  t.style.fontSize=Math.floor(lo)+'px';
  if(!fits()){ t.style.maxHeight=Math.max(36,avail-(box.offsetHeight-t.offsetHeight))+'px'; t.style.overflowY='auto'; } }
function vxFit(){ const w=document.querySelector('#voice-ov.vx3 .vx3-words'); if(!w) return;
  if(_vxFitEl!==w){ _vxFitEl=w; if(window.ResizeObserver){ if(!_vxFitRO) _vxFitRO=new ResizeObserver(()=>vxFitNow()); _vxFitRO.disconnect(); _vxFitRO.observe(w); } }
  vxFitNow(); }
const _vxR9zzn=voiceRender; voiceRender=function(){ const r=_vxR9zzn.apply(this,arguments); try{ vxFit(); }catch(e){} return r; };
const _vxLT9zzn=voiceLiveTranscript; voiceLiveTranscript=function(){ const r=_vxLT9zzn.apply(this,arguments); try{ vxFit(); }catch(e){} return r; };
addEventListener('resize',()=>{ if(_vxFitEl) vxFitNow(); }); if(window.visualViewport) visualViewport.addEventListener('resize',()=>{ if(_vxFitEl) vxFitNow(); });

/* Urias: after a command the orb shrinks first, then the change spreads out from behind it; tapping the pill grows it back */
let _vxVT=null, _vxNoVT=false;
function vxFxOK(){ const H=document.documentElement; return !!document.startViewTransition&&!H.classList.contains('perf-mode')&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches); }
function vxOrbAt(){ const o=document.querySelector('#voice-ov .vx-orb'); if(!o) return null; const r=o.getBoundingClientRect(); return r.width?[r.left+r.width/2,r.top+r.height/2]:null; }
function vxOrigin(c){ if(!c) return; const H=document.documentElement.style, x=c[0], y=c[1]; H.setProperty('--vx-x',Math.round(x)+'px'); H.setProperty('--vx-y',Math.round(y)+'px'); H.setProperty('--vx-r',Math.ceil(Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y)))+'px'); }
function vxVT(kind,update){ const H=document.documentElement; if(_vxVT){ try{ _vxVT.skipTransition(); }catch(e){} }
  H.classList.remove('vx-vt-shrink','vx-vt-grow'); H.classList.add('vx-vt','vx-vt-'+kind); let t;
  try{ t=document.startViewTransition(update); }catch(e){ H.classList.remove('vx-vt','vx-vt-'+kind); update(); return null; }
  _vxVT=t; const done=()=>{ if(_vxVT!==t) return; _vxVT=null; H.classList.remove('vx-vt','vx-vt-shrink','vx-vt-grow'); document.querySelectorAll('.vx-wave').forEach(x=>x.remove()); };
  t.finished.then(done,done); return t; }
const _vxApply9zzn=voiceApply; voiceApply=function(text){ const v=document.getElementById('voice-ov');
  if(_vxNoVT||!vxFxOK()||!v||!v.classList.contains('vx3')||v.classList.contains('is-mini')||!String(text||'').trim()) return _vxApply9zzn.apply(this,arguments);
  const before=vxSnap(), self=this, args=arguments; let changed=false;
  const t=vxVT('shrink',()=>{ _vxNoVT=true; try{ _vxApply9zzn.apply(self,args); } finally{ _vxNoVT=false; }
    return new Promise(res=>{ const chk=n=>{ const o=document.getElementById('voice-ov');
      if(o&&!o.classList.contains('tr-fade-out')&&vxSnap()!==before){ changed=true; _vxNoVT=true; try{ vx3Mini(true); } finally{ _vxNoVT=false; } vxOrigin(vxOrbAt()); const w=document.createElement('div'); w.className='vx-wave'; w.setAttribute('aria-hidden','true'); document.body.appendChild(w); res(); }
      else if(n>0) setTimeout(()=>chk(n-1),70); else res(); };
      setTimeout(()=>chk(2),16); }); });
  if(t) t.ready.then(()=>{ if(!changed) t.skipTransition(); },()=>{}); };
const _vMini9zzn=vx3Mini; vx3Mini=function(on){ const v=document.getElementById('voice-ov');
  if(!on&&!_vxNoVT&&v&&v.classList.contains('is-mini')&&vxFxOK()){ vxOrigin(vxOrbAt()); const self=this; vxVT('grow',()=>{ _vxNoVT=true; try{ _vMini9zzn.call(self,false); } finally{ _vxNoVT=false; } }); return; }
  return _vMini9zzn.apply(this,arguments); };
const _vxSnap9zzn=vxSnap; vxSnap=function(){ try{ return JSON.stringify(JSON.parse(_vxSnap9zzn.apply(this,arguments)).map(x=>typeof x==='string'?x.replace(/\bvx-vt(?:-\w+)?\b/g,'').replace(/\s+/g,' ').trim():x)); }catch(e){ return _vxSnap9zzn.apply(this,arguments); } };
