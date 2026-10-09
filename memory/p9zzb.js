/* ---------- P9zzb: one-time "new Home Screen icon" note for iPhone/iPad installs ---------- */
const ICN_VER='7255', ICN_KEY='treesh_icon_note_'+ICN_VER;
const icnIOS=()=>/iP(hone|od|ad)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const icnHome=()=>navigator.standalone===true;
function icnStep(n,ic,html){ return `<li class="icn-step"><span class="icn-num">${n}</span><span class="icn-txt">${html}</span><i data-lucide="${ic}"></i></li>`; }
function iconNoteShow(){ LS.set(ICN_KEY,true);
  const inner=`${pmHead('smartphone','Home Screen','Treesh has a new icon','icn-close')}
    <div class="icn-body" data-testid="icon-note">
      <div class="icn-hero"><img src="icons/apple-touch-icon.png?v=${ICN_VER}" alt="New Treesh icon" data-testid="icon-note-img"><div><p class="icn-lead">Your iPhone keeps the icon from the day you added Treesh.</p><p class="icn-sub">Want the new one? It takes a few seconds:</p></div></div>
      <ol class="icn-steps">${icnStep(1,'hand','Press and hold <b>Treesh</b> on your Home Screen, then remove it.')+icnStep(2,'compass','Open <b>treesh.app</b> in Safari.')+icnStep(3,'share','Tap <b>Share</b>, then <b>Add to Home Screen</b>.')}</ol>
      <div class="icn-warn" data-testid="icon-note-warning"><i data-lucide="triangle-alert"></i><p>Removing it also clears what's saved only on this device, like uploaded music. Sign in to your Treesh account first so your settings come back.</p></div>
      <p class="icn-opt">Totally optional. The old icon keeps working.</p>
    </div>
    <div class="pm-actions"><button type="button" data-act="modal-close" data-testid="icon-note-ok" class="st-btn lg primary">Got it</button></div>`;
  $('#modal').innerHTML=modalWrap(inner,'icon-note-modal','sm'); icons(); syncScrollLock(); }
function icnCheck(){ if(!icnIOS()||!icnHome()||LS.get(ICN_KEY,false)) return;
  if(!state.profile){ LS.set(ICN_KEY,true); return; }
  let tries=0; const t=setInterval(()=>{ tries++; if(LS.get(ICN_KEY,false)||tries>40){ clearInterval(t); return; }
    if(!document.hidden&&!overlaysOpen()&&!state.npOpen&&!document.getElementById('eco-ask')){ clearInterval(t); iconNoteShow(); } },2500); }
const _p9Init9zzb=p9Init; p9Init=function(){ const r=_p9Init9zzb.apply(this,arguments); try{ icnCheck(); }catch(e){} return r; };
