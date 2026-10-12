/* ---------- P9zzp: sticky page tabs pin right under the real top bar (--hdr-h; the bar is taller in the Home Screen app) ---------- */
let _hdrEl=null, _hdrRO=null;
function hdrSync(){ const h=document.querySelector('#app .gl-main > header'); if(!h) return;
  if(h!==_hdrEl&&window.ResizeObserver){ if(_hdrRO) _hdrRO.disconnect(); _hdrEl=h; _hdrRO=new ResizeObserver(()=>hdrSync()); _hdrRO.observe(h); }
  const v=Math.round(h.offsetHeight); if(v>0) document.documentElement.style.setProperty('--hdr-h',v+'px'); }
const _rs9zzp=renderShell; renderShell=function(){ const r=_rs9zzp.apply(this,arguments); hdrSync(); if(window.__vpSync) window.__vpSync(); return r; };
addEventListener('resize',()=>hdrSync());
