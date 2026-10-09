/* ---------- P9zza: Play What's Next inside the Text Messages lyrics, clean section labels ("[Hook 2: Artist] [x2]") ---------- */

/* section labels drop trailing repeat marks so "[Hook 2: PrettyBoyQuen] [x2]" names PrettyBoyQuen */
function lySecClean(x){ if(x==null) return x; const c=String(x).replace(/\]\s*[\[(]\s*x\s*\d+\s*[\])]?\s*$/i,'').replace(/\s*[\[(]\s*x\s*\d+\s*[\])]\s*$/i,'').trim(); return c||x; }
const _pl9zza=parseLyrics; parseLyrics=function(){ const r=_pl9zza.apply(this,arguments), seen=new Set();
  [r.byKey,r.byTitle].forEach(m=>Object.values(m||{}).forEach(L=>{ if(seen.has(L)) return; seen.add(L); L.forEach(l=>{ if(l&&l.sec) l.sec=lySecClean(l.sec); }); })); return r; };

/* ===== the lyric chat turns into the game for this song, music pauses and picks up after ===== */
let _wnInl=false, _wnInlRoot=null;
const wnInlHost=()=>document.getElementById('np-lyric-region');
const wnInlOn=()=>!!(state.game&&state.game.inline);
function wnInlMark(on){ const np=document.querySelector('#np [data-np-root]'); if(np) np.classList.toggle('np-wn-on',on); }
function wnInlStart(){ const s=curSong(); if(!s||!state.npOpen) return; if(wcLines(s).length<4){ toast('Not enough lyrics','This song needs a few more lines to play'); return; }
  if(!wnInlOn()) state._wnRes={sid:s.id, playing:!audio.paused};
  try{ closeLyricPop(); }catch(e){} _wnInl=true; try{ startGame(s.id); } finally{ _wnInl=false; }
  if(!wnInlOn()) state._wnRes=null; }
function wnInlEnd(resume){ if(!wnInlOn()) return; wnHalt(); clearGameTimer(); state.game=null; const r=_wnInlRoot; _wnInlRoot=null; wnInlMark(false);
  if(r) r.remove(); ovHistPop(); try{ syncScrollLock(); }catch(e){}
  const res=state._wnRes, s=curSong(); state._wnRes=null;
  if(resume&&res&&res.playing&&s&&s.id===res.sid){ try{ const p=audio.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
  try{ lytTick(true); }catch(e){} }
const _rg9zza=renderGame; renderGame=function(){ const g=state.game, host=wnInlHost();
  if(g&&(_wnInl||(_wnInlRoot&&_wnInlRoot.isConnected))&&host&&state.npOpen) g.inline=true;
  if(!g||!g.inline) return _rg9zza.apply(this,arguments);
  g.inlineSid=g.song.id; if(_wnInlRoot) _wnInlRoot.remove();
  const out=_rg9zza.apply(this,arguments), root=document.querySelector('#modal > [data-game-root]');
  if(root){ root.classList.remove('np-entering'); root.classList.add('is-inline','wn-inl-in'); root.setAttribute('data-testid','game-inline'); host.appendChild(root); _wnInlRoot=root;
    root.addEventListener('animationend',e=>{ if(e.target===root) root.classList.remove('wn-inl-in'); }); }
  wnInlMark(true); if(_wnVV) _wnVV(); try{ syncScrollLock(); }catch(e){} wnScroll(false); return out; };
const _gc9zza=gameClose; gameClose=function(){ if(wnInlOn()) return wnInlEnd(true); return _gc9zza.apply(this,arguments); };
/* the player re-drawing keeps the game in place; leaving lyrics, closing the player or a new song ends it */
function wnInlSync(){ const g=state.game; if(!g||!g.inline) return; const s=curSong();
  if(!state.npOpen||!state.showLyrics||!s||s.id!==g.inlineSid){ wnInlEnd(!!(s&&s.id===g.inlineSid)); return; }
  const host=wnInlHost(); if(host&&_wnInlRoot&&_wnInlRoot.parentNode!==host){ host.appendChild(_wnInlRoot); wnScroll(false); } wnInlMark(true); }
const _rnp9zza=renderNP; renderNP=function(){ const r=_rnp9zza.apply(this,arguments); try{ wnInlSync(); }catch(e){} return r; };
const _rlr9zza=refreshLyricsRegion; refreshLyricsRegion=function(){ const r=_rlr9zza.apply(this,arguments); try{ wnInlSync(); }catch(e){} return r; };
const _cnp9zza=closeNP; closeNP=function(){ if(wnInlOn()) wnInlEnd(true); return _cnp9zza.apply(this,arguments); };
audio.addEventListener('play',()=>{ if(wnInlOn()) wnInlEnd(false); });
window.addEventListener('popstate',e=>{ if(!wnInlOn()) return; e.stopImmediatePropagation(); _ovNoPop=true; try{ wnInlEnd(true); }finally{ _ovNoPop=false; } },true);

/* a game button next to the Lyric theme button whenever the Text Messages theme is on */
const WN_INL_BTN=(tid,cls)=>`<button data-act="lyt-wn-play" data-testid="${tid}" aria-label="Play What\u2019s Next" title="Play What\u2019s Next" class="${cls}"><i data-lucide="gamepad-2" style="width:17px;height:17px"></i></button>`;
const wnInlCan=s=>!!(s&&lytFor(s)==='chat'&&!state.lyricsEdit&&!state.lyricSelect&&!state.karaoke&&wcLines(s).length>=4);
const _lth9zza=lyricToolsHtml; lyricToolsHtml=function(s){ const h=_lth9zza.apply(this,arguments); if(!wnInlCan(s)) return h;
  return h.replace('<button data-act="lyt-open"',WN_INL_BTN('lyt-wn-play-button','press lg:hidden grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/25 bg-white/15 text-white hover:bg-white/20')+'<button data-act="lyt-open"'); };
const _ltd9zza=lyricToolsDesktopRow; lyricToolsDesktopRow=function(s){ const h=_ltd9zza.apply(this,arguments); if(!h||!wnInlCan(s)) return h;
  return h.replace('<button data-act="lyt-open" data-testid="lyt-open-button-d"',WN_INL_BTN('lyt-wn-play-button-d','press grid h-10 w-10 place-items-center rounded-full border border-white/25 bg-white/20 text-white backdrop-blur-md hover:bg-white/25')+'<button data-act="lyt-open" data-testid="lyt-open-button-d"'); };
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act="lyt-wn-play"]'); if(!t) return; e.preventDefault(); e.stopPropagation(); wnInlStart(); },true);
