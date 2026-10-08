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
