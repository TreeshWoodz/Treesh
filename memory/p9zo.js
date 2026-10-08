/* ---------- P9zo: one tap is always enough, the scrubber keeps moving, any lyric line (karaoke too) jumps the song there ---------- */

/* scroll lock only flips between touches; flipping it under a finger moved the page and ate that tap */
let _tchOn=false, _tchAt=0;
const tchBusy=()=>_tchOn&&performance.now()-_tchAt<1500;
window.addEventListener('touchstart',()=>{ _tchOn=true; _tchAt=performance.now(); },{passive:true,capture:true});
const _tchOff=()=>{ _tchOn=false; setTimeout(shSoon,380); };
window.addEventListener('touchend',_tchOff,{passive:true,capture:true}); window.addEventListener('touchcancel',_tchOff,{passive:true,capture:true});
const _ssl9zo=syncScrollLock; syncScrollLock=function(){ if(tchBusy()) return; return _ssl9zo.apply(this,arguments); };
setInterval(()=>{ if(!document.hidden&&!tchBusy()) shSoon(); },500);

/* iOS sometimes treats a tap as a hover and never sends the click; if no click shows up, send it ourselves */
let _tapR=null, _tapSeq=0, _tapClicked=false, _tapSynthAt=0;
const TAP_SEL='button,a[href],[data-act],[role="button"],label,summary';
window.addEventListener('touchstart',e=>{ _tapR=null; if(e.touches.length!==1) return; const t=e.target; if(!t||!t.closest) return;
  if(!t.closest(TAP_SEL)||t.closest('input,textarea,select,[contenteditable="true"],[data-no-rescue],canvas')) return;
  const p=e.touches[0]; _tapR={t,x:p.clientX,y:p.clientY,t0:performance.now()}; },{passive:true,capture:true});
window.addEventListener('touchmove',e=>{ const r=_tapR, p=e.touches[0]; if(r&&p&&Math.abs(p.clientX-r.x)+Math.abs(p.clientY-r.y)>12) _tapR=null; },{passive:true,capture:true});
window.addEventListener('touchcancel',()=>{ _tapR=null; },{passive:true,capture:true});
window.addEventListener('touchend',e=>{ const r=_tapR; _tapR=null; if(!r||e.touches.length||performance.now()-r.t0>450) return;
  _tapClicked=false; const id=++_tapSeq, sy=window.scrollY;
  setTimeout(()=>{ if(id!==_tapSeq||_tapClicked||e.defaultPrevented||!r.t.isConnected||Math.abs(window.scrollY-sy)>4) return;
    const b=r.t.closest(TAP_SEL); if(!b||b.disabled||b.getAttribute('aria-disabled')==='true') return;
    _tapSynthAt=performance.now(); r.t.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window,clientX:r.x,clientY:r.y})); },420); },{passive:true,capture:true});
window.addEventListener('click',e=>{ if(e.isTrusted&&_tapSynthAt&&performance.now()-_tapSynthAt<700){ _tapSynthAt=0; e.preventDefault(); e.stopImmediatePropagation(); return; } _tapClicked=true; },true);

/* the seek bar only pauses while you hold it (it used to freeze once it had focus, which iPhones never clear) */
let _skDrag=false;
document.addEventListener('pointerdown',e=>{ if(e.target&&e.target.id==='np-seek') _skDrag=true; },true);
['pointerup','pointercancel'].forEach(ev=>document.addEventListener(ev,()=>{ if(_skDrag){ _skDrag=false; const s=document.getElementById('np-seek'); if(s&&document.activeElement===s) s.blur(); } },true));
document.addEventListener('change',e=>{ if(e.target&&e.target.id==='np-seek'){ _skDrag=false; e.target.blur(); } },true);
const _up9zo=updateProgress; updateProgress=function(){ const r=_up9zo.apply(this,arguments); const sk=document.getElementById('np-seek');
  if(sk&&!_skDrag&&document.activeElement===sk){ const d=state.duration||0; sk.value=d?(state.currentTime||0)/d*100:0; fillSlider(sk); } return r; };

/* tap a karaoke line, or a line with notes, to jump there */
document.addEventListener('click',e=>{ const k=e.target&&e.target.closest&&e.target.closest('#kstage-scroll .k-line[data-k]'); if(!k) return; const l=(_karLines||[])[+k.dataset.k]; if(l&&typeof l.t==='number') seekTo(l.t); });
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('#np-lyrics [data-act="lyric-detail"]'); if(!b||Date.now()-_lyricLP<700) return; const t=parseFloat(b.dataset.t); if(!isNaN(t)&&t>0) seekTo(t); });
