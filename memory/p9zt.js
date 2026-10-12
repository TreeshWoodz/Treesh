/* ---------- P9zt: voice mic always switches off (on close, once you stop talking, in the background); zodiac snaps back cleanly; profile sheet fits between the top bar and the nav bar ---------- */
let _vxPill=null, _vxPend='', _vxSilT=null;
function vxKill(){ clearTimeout(_voiceRestartT); clearTimeout(_vxPill); clearTimeout(_vxSilT); _vxPend=''; listening=false; const r=recog;
  if(r){ r.onstart=r.onresult=r.onend=r.onerror=null; try{ r.stop(); }catch(e){} try{ r.abort(); }catch(e){} recog=null; } }
const _vClose9zt=voiceClose; voiceClose=function(){ const r=_vClose9zt.apply(this,arguments); vxKill(); return r; };
/* one listen per tap: no silent auto restarts (they kept the mic on and lagged phones) */
voiceListen=function(){ if(!_voiceActive||_voicePaused||_voiceSpeaking||_voiceNoMic||!recog||listening) return;
  try{ recog.start(); listening=true; _voiceMode='listening'; }catch(e){ if(e&&e.name==='InvalidStateError'){ listening=true; _voiceMode='listening'; } else { listening=false; _voiceMode='idle'; } } voiceRender(); };
voiceResumeListen=function(){ clearTimeout(_voiceRestartT); _voiceMode=_voicePaused?'paused':'idle'; voiceRender(); vxPillTimer(); };
function vxDone(){ clearTimeout(_vxSilT); listening=false; if(!document.getElementById('voice-ov')) return; if(_vxPend){ const f=_vxPend; _vxPend=''; voiceApply(f); return; } if(_voiceSpeaking) return; if(_voiceMode==='listening'||_voiceMode==='thinking'){ _voiceMode='idle'; voiceRender(); vxPillTimer(); } }
const _initV9zt=initVoice; initVoice=function(){ const r=_initV9zt.apply(this,arguments); const R=recog;
  if(R&&!R._9zt){ R._9zt=1; const ores=R.onresult, oerr=R.onerror;
    R.onresult=e=>{ let t=''; for(let i=0;i<e.results.length;i++) t+=e.results[i][0].transcript; const last=e.results[e.results.length-1];
      _vxPend=last&&last.isFinal?'':t.trim(); clearTimeout(_vxSilT); if(_vxPend) _vxSilT=setTimeout(()=>{ if(_vxPend&&recog===R){ const f=_vxPend; _vxPend=''; voiceApply(f); } },1500); return ores&&ores(e); };
    R.onend=()=>{ if(recog===R) vxDone(); };
    R.onerror=e=>{ const err=e&&e.error; if(err==='no-speech'||err==='aborted'){ if(recog===R&&err==='no-speech') vxDone(); return; } return oerr&&oerr(e); }; }
  return r; };
/* after a command the pill closes itself if you don't tap it */
function vxPillTimer(){ clearTimeout(_vxPill); _vxPill=setTimeout(()=>{ const v=document.getElementById('voice-ov'); if(v&&v.classList.contains('is-mini')&&!listening&&!_voiceSpeaking) voiceClose(); },8000); }
const _vMini9zt=vx3Mini; vx3Mini=function(on){ const r=_vMini9zt.apply(this,arguments); if(on) vxPillTimer(); else clearTimeout(_vxPill); return r; };
document.addEventListener('visibilitychange',()=>{ if(document.hidden&&document.getElementById('voice-ov')) voiceClose(); });
addEventListener('pagehide',()=>{ if(document.getElementById('voice-ov')) voiceClose(); });

/* zodiac: once it has slid in, a drag that snaps back never replays the entrance */
const _zhO9zt=zhOpen; zhOpen=function(){ const r=_zhO9zt.apply(this,arguments); const root=document.getElementById('zh-root'), sh=root&&root.querySelector('.zh-sheet');
  if(sh){ const done=()=>{ if(state.zhOpen&&root.firstChild) root.classList.add('is-still'); }; sh.addEventListener('animationend',e=>{ if(e.target===sh) done(); },{once:true}); setTimeout(done,700); } return r; };
