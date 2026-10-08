/* ---------- P9zj: scroll never stays frozen, sign out/in keeps your Space, custom music stays private, What's Next disclaimer ---------- */
/* the page only stays locked while an overlay is really on screen (a hidden leftover used to freeze scrolling) */
const OV_HOSTS=['np','queue','profile','searchlay','modal','modal2','ls','instrum-fs','lock','zh-root'];
function ovShown(el){ if(!el) return false; for(const c of el.children){ if(c.tagName==='STYLE'||c.tagName==='SCRIPT'||c.tagName==='TEMPLATE') continue; if(c.getClientRects().length&&getComputedStyle(c).visibility!=='hidden') return true; } return false; }
function ovSeen(){ for(const id of OV_HOSTS) if(ovShown(document.getElementById(id))) return true;
  if(state.gameFrame&&!state.gameFrame.min&&ovShown(document.getElementById('game-frame'))) return true;
  const v=document.getElementById('voice-ov'); if(v&&!v.classList.contains('is-mini')&&v.getClientRects().length) return true;
  for(const el of document.querySelectorAll('#um-root,#sx-root,[data-testid="sleep-overlay"]')) if(el.getClientRects().length) return true;
  return false; }
const _ovo9zj=overlaysOpen; overlaysOpen=function(){ return !!_ovo9zj.apply(this,arguments)&&ovSeen(); };

/* signing in: the restored profile (with your Space) is what stays in memory, so a late photo download can't write an older copy over it */
let _sbRow9zj=null;
const _sbApply9zj=sbApply; sbApply=function(r){ _sbRow9zj=r; return _sbApply9zj.apply(this,arguments); };
const _sbRes9zj=sbRestore; sbRestore=async function(){ const ch=await sbNoCache(()=>_sbRes9zj.apply(this,arguments));
  if(ch){ const p=LS.get('treesh_profile',null); if(p&&typeof p==='object'){ state.profile=p; if(_sbRow9zj) try{ _sbApply9zj(_sbRow9zj); }catch(e){} } } return ch; };

/* caches (like the artist model list) never go into the account backup */
const SB_ASSET_SKIP=/^models_cache$/;
async function sbNoCache(fn){ const aa=assetAll; assetAll=function(){ return aa.apply(this,arguments).then(l=>(l||[]).filter(r=>r&&!SB_ASSET_SKIP.test(r.id))); }; try{ return await fn(); } finally{ assetAll=aa; } }
const _sbPay9zj=sbPayload; sbPayload=function(){ const a=arguments; return sbNoCache(()=>_sbPay9zj.apply(this,a)); };

/* signing out keeps the lyrics you wrote for your own custom songs on this device (they never sync) */
const _lsSetRaw9zj=Storage.prototype.setItem;
const _sbReset9zj=sbResetDevice; sbResetDevice=async function(){ const keep={}; try{ const o=JSON.parse(localStorage.getItem('treesh_lyric_edits')||'{}')||{}; Object.keys(o).forEach(id=>{ if(umIsUserId(id)) keep[id]=o[id]; }); }catch(e){}
  const r=await _sbReset9zj.apply(this,arguments); if(Object.keys(keep).length) try{ _lsSetRaw9zj.call(localStorage,'treesh_lyric_edits',JSON.stringify(keep)); }catch(e){} return r; };

/* What's Next: a small blinking note for the whole game, these chats are made up */
function wnDiscAdd(){ const h=document.querySelector('#modal [data-game-root] .wc-head'); if(!h||h.parentNode.querySelector('.wc-disc')) return;
  h.insertAdjacentHTML('afterend',`<div class="wc-disc" role="note" aria-label="Just a game. These messages are not from the real artists." data-testid="game-disclaimer"><span class="wc-disc-dot" aria-hidden="true"></span><span>Just a game \u00b7 not the real artists texting</span></div>`); }
const _rg9zj=renderGame; renderGame=function(){ const r=_rg9zj.apply(this,arguments); try{ wnDiscAdd(); }catch(e){} return r; };

/* phones: hover-only reveals (fade-ins on :hover) made iOS treat the first tap as a hover, so buttons needed a second tap. Touch screens skip those hover rules */
function selSplit(s){ const out=[]; let d=0, cur=''; for(const ch of s){ if(ch==='('||ch==='[') d++; else if(ch===')'||ch===']') d--; if(ch===','&&d===0){ out.push(cur); cur=''; } else cur+=ch; } out.push(cur); return out.map(x=>x.trim()).filter(Boolean); }
function touchHoverFix(){ if(!window.matchMedia||!matchMedia('(hover: none)').matches) return;
  const rev=/^(opacity|visibility|display|left)$/;
  const fix=list=>{ for(let i=list.length-1;i>=0;i--){ const r=list[i];
    if(r.type===4){ const m=(r.media&&r.media.mediaText)||''; if(!/hover\s*:\s*hover|pointer\s*:\s*fine/.test(m)) fix(r.cssRules); continue; }
    if(r.type===12){ fix(r.cssRules); continue; }
    if(r.type!==1||!r.selectorText||r.selectorText.indexOf(':hover')<0) continue;
    let reveal=false; for(let k=0;k<r.style.length;k++) if(rev.test(r.style[k])){ reveal=true; break; } if(!reveal) continue;
    const keep=selSplit(r.selectorText).filter(x=>x.indexOf(':hover')<0);
    try{ if(keep.length) r.selectorText=keep.join(', '); else (r.parentRule||r.parentStyleSheet).deleteRule(i); }catch(e){} } };
  for(const s of document.styleSheets){ let rules=null; try{ rules=s.cssRules; }catch(e){} if(rules) fix(rules); } }
touchHoverFix(); setTimeout(touchHoverFix,2500);

/* pick up where you left off: one clean jump once the song can seek. Any seek you make wins, and the song is never pulled back to the old spot */
let _resAt=0;
resSeekNow=function(e){ if(_resSeek==null) return; const cs=curSong(); if(!cs||cs.id!==_resId){ _resSeek=null; return; }
  if(audio.readyState<1) return;
  const t=_resSeek, ct=audio.currentTime||0;
  if(Math.abs(ct-t)<=1.2){ if(!audio.paused||(e&&e.type==='seeked')) _resSeek=null; return; }
  if(_resAt&&performance.now()-_resAt<1500) return;
  if(_resAt){ _resSeek=null; state.currentTime=ct; try{ updateProgress(); }catch(err){} return; }
  _resAt=performance.now(); try{ audio.currentTime=t; }catch(err){ _resSeek=null; } };
const _resRestore9zj=resRestore; resRestore=function(){ _resAt=0; return _resRestore9zj.apply(this,arguments); };
audio.addEventListener('seeked',resSeekNow);
audio.addEventListener('seeking',()=>{ if(_resSeek!=null&&Math.abs((audio.currentTime||0)-_resSeek)>1.5) _resSeek=null; });
audio.addEventListener('timeupdate',()=>{ if(_resSeek!=null&&!audio.paused&&_resAt&&performance.now()-_resAt>3000) _resSeek=null; });
/* a lyric tap or scrub before the song has loaded (phones load on play) is kept and applied as soon as it can be */
const _seekTo9zj=seekTo; seekTo=function(t){ t=+t; if(isNaN(t)) return; _resSeek=null;
  const cs=curSong(); if(cs&&audio.readyState<1){ _resSeek=t; _resId=cs.id; _resAt=0; state.currentTime=t; try{ audio.currentTime=t; }catch(e){} try{ updateProgress(); }catch(e){} return; }
  return _seekTo9zj.call(this,t); };
