/* ---------- P9: Now Playing redesign (calm aura, cover styles, style picker) ---------- */
const NP_STYLES=[['default','Classic'],['vinyl','Record player'],['circle','Circle'],['spin','Spinning CD'],['full','Full screen'],['polaroid','Polaroid'],['glass','Glass card'],['pulse','Beat pulse'],['minimal','Minimal']];
function npStyle(){ let v=LS.get('treesh_np_style',null); if(!v) v=state.vinylMode?'vinyl':(LS.get('treesh_np_coverbg',false)===true?'full':'default'); return NP_STYLES.some(x=>x[0]===v)?v:'default'; }
function npSetStyle(id,quiet){ if(!NP_STYLES.some(x=>x[0]===id)) return; LS.set('treesh_np_style',id); state.vinylMode=id==='vinyl'; LS.set('treesh_vinyl',state.vinylMode); LS.set('treesh_np_coverbg',id==='full'); if(state.npOpen) renderNP(); npsSync(); if(state.view==='settings') renderView(); if(!quiet) toast((NP_STYLES.find(x=>x[0]===id)||[])[1]+' style','Your player look is saved'); }
function npCoverBg(){ return npStyle()==='full'; }
function npPeekOn(){ const v=LS.get('treesh_np_peek',null); if(v===true||v===false) return v; const w=window.innerWidth||0, h=window.innerHeight||0; return Math.min(w,h)>=520; }
function npBgHtml(s){ const full=npStyle()==='full', aura=npAuraOn();
  return `<div class="np-bg np-aura np9-bg absolute inset-0 overflow-hidden${full?' is-cover':''}${aura?' is-moving':''}" data-testid="np-aura" data-cover-bg="${full}">${img(s.coverArt, full?'np-cover-full':'np-aura-img')}<span class="np-blob b1"></span><span class="np-blob b2"></span><span class="np-blob b3"></span><span class="np9-breath"></span><span class="np-veil"></span><span class="np9-grain"></span></div>`; }
function npArtInner(st,s,mini){ const im=img(s.coverArt,'h-full w-full object-cover');
  switch(st){
    case 'vinyl': return `<div class="a-vinyl"><div class="a-rec"><span class="a-grooves"></span><div class="a-label">${im}</div><span class="a-hole"></span></div><span class="a-rec-sheen"></span><span class="a-arm"><i></i></span></div>`;
    case 'circle': return `<div class="a-circ">${im}</div>`;
    case 'spin': return `<div class="a-cd"><div class="a-cd-disc">${im}<span class="a-cd-sheen"></span></div><span class="a-cd-hole"></span></div>`;
    case 'polaroid': return `<div class="a-pol"><div class="a-pol-img">${im}</div><p class="a-pol-cap">${esc(s.title||'')}</p></div>`;
    case 'glass': return `<div class="a-glass"><div class="a-glass-in">${im}</div></div>`;
    case 'pulse': return `<div class="a-pulse"><span class="a-pulse-ring"></span><span class="a-pulse-ring r2"></span><div class="a-sq">${im}</div></div>`;
    case 'minimal': return `<div class="a-orb"><span></span><span></span><span></span><b></b></div>`;
    case 'full': return mini?`<div class="a-full" style="background-image:url('${esc(s.coverArt||'')}')"><i></i><i></i></div>`:`<div class="a-full"></div>`;
    default: return `<div class="a-sq">${im}<span class="a-shine"></span></div>`;
  } }
function npArtHtml(s,pal){ const st=npStyle(); const c0=pal&&pal[0];
  return `<div data-act="np-style-open" data-testid="np-artwork" data-np-style="${st}" role="button" tabindex="0" aria-label="Change cover style" class="np9-art st-${st} ${state.isPlaying?'is-playing':'is-paused'}" style="--glow:${rgb(c0,0.55)}">${npArtInner(st,s)}</div>`; }
function npPeekHtml(s){ if(!npPeekOn()) return ''; const L=mkLyLines(s), synced=L.some(l=>l.t!=null);
  if(!L.length) return `<button data-act="toggle-lyrics" data-testid="np-lyrics-peek" class="np-peek np9-ly is-empty press"><span class="np-peek-k"><i data-lucide="mic-vocal"></i>Live lyrics</span><span class="np9-ly-empty">No lyrics yet. Tap to add some</span></button>`;
  const lines=L.map((l,i)=>`<span class="ly2-l" data-i="${i}">${esc(l.text).split(/(\s+)/).map(x=>/^\s*$/.test(x)?x:`<span class="w">${x}</span>`).join('')}</span>`).join('');
  return `<button data-act="toggle-lyrics" data-testid="np-lyrics-peek" data-mk-ly2 data-song="${esc(s.id)}" data-synced="${synced}" class="np-peek np9-ly press"><span class="np-peek-k"><i data-lucide="mic-vocal"></i>${synced?'Live lyrics':'Lyrics'}<span class="ly2-live${state.isPlaying?'':' hidden'}" data-ly-live></span></span><span class="ly2-win" data-testid="np-peek-current"><span class="ly2-track">${lines}</span></span></button>`; }
function npArtSync(){ const on=!audio.paused; document.querySelectorAll('#np .np9-art').forEach(a=>{ a.classList.toggle('is-playing',on); a.classList.toggle('is-paused',!on); }); document.querySelectorAll('#np [data-ly-live]').forEach(x=>x.classList.toggle('hidden',!on)); if(on){ npBeatLoop(); mkLyLoop(); } }
let _npRAF=0;
function npBeatLoop(){ if(_npRAF) return; const tick=now=>{ if(ecoSkip('npb')){ _npRAF=requestAnimationFrame(tick); return; } const root=document.querySelector('#np .np9'); const st=root&&root.dataset.npStyle; if(!root||!state.npOpen||state.perfMode||state.showLyrics||(st!=='pulse'&&st!=='minimal')){ _npRAF=0; if(root) root.style.setProperty('--np-e','0'); return; } const b=beatFrame(now); root.style.setProperty('--np-e',(b.playing?Math.min(1,b.e):0).toFixed(3)); _npRAF=requestAnimationFrame(tick); }; _npRAF=requestAnimationFrame(tick); }
function renderNP(){
  const c=$("#np"); const s=curSong();
  if(!state.npOpen||!s){ c.innerHTML=""; npsClose(true); return; }
  const wasOpen=!!c.querySelector("[data-np-root]");
  const st=npStyle();
  const npMode=state.showLyrics?"lyrics":st;
  const modeChanged=wasOpen&&state._npMode!==npMode;
  state._npMode=npMode;
  if(state.karaoke&&state.karFull&&state.showLyrics&&!state.lyricsEdit){ renderKaraokeFS(c,s,wasOpen); return; }
  const pal=state.palette;
  const pct=state.duration?(state.currentTime/state.duration*100):0;
  const ib=(act,ic,on,label,tid)=>`<button data-act="${act}" ${tid?`data-testid="${tid}"`:''} aria-label="${label}" title="${label}" class="np9-ib press${on?' is-on':''}"><i data-lucide="${ic}"></i></button>`;
  const rep=state.abA!=null?`<span data-ab-label class="text-[11px] font-extrabold tracking-tight">${state.abB==null?'A\u2022':'A-B'}</span>`:`<i data-lucide="${state.repeat==='one'?'repeat-1':'repeat'}"></i>`;
  const dock=`<div class="np9-dock np-dock" data-testid="np-dock">
     <div class="np9-seek"><div class="relative"><input id="np-seek" data-testid="now-playing-seek-slider" class="tr np9-range w-full" type="range" min="0" max="100" step="0.1" value="${pct}"><div id="np-ab-markers" class="pointer-events-none absolute inset-0"></div></div><div class="np9-times font-doto"><span id="np-cur">${fmt(state.currentTime)}</span><span id="np-dur">${fmt(state.duration)}</span></div></div>
     <div class="np9-tr">
       <button data-act="shuffle" data-testid="now-playing-shuffle-button" aria-label="Shuffle" class="np9-side-btn press${state.shuffle?' is-on':''}"><i data-lucide="shuffle"></i></button>
       <button data-act="prev" data-testid="now-playing-prev-button" aria-label="Previous" class="np9-skip press"><i data-lucide="skip-back" class="fill-current"></i></button>
       <button data-act="toggle-play" id="np-pp" data-testid="now-playing-play-pause-button" aria-label="Play or pause" class="np9-play press"><i data-lucide="${state.isPlaying?'pause':'play'}" style="width:28px;height:28px" class="fill-current"></i></button>
       <button data-act="next" data-testid="now-playing-next-button" aria-label="Next" class="np9-skip press"><i data-lucide="skip-forward" class="fill-current"></i></button>
       <button data-act="repeat" id="np-repeat" data-testid="now-playing-repeat-button" aria-label="Repeat (hold 1.5s for A\u2013B loop)" class="ab-holdable np9-side-btn press${(state.abA!=null||state.repeat!=='off')?' is-on':''}">${rep}</button>
     </div>
     <div class="np9-vol"><button data-act="mute" aria-label="Mute" class="press"><i data-lucide="${state.volume>0?'volume-1':'volume-x'}"></i></button><input id="np-vol" class="tr np9-range flex-1" type="range" min="0" max="100" step="1" value="${state.volume*100}"><i data-lucide="volume-2"></i></div>
   </div>`;
  const acts=`<div class="np9-acts" data-testid="np-actions">${state.showLyrics?favCycleBtn(s):''}${ib('toggle-lyrics','quote',state.showLyrics,'Lyrics','now-playing-lyrics-tab')}${ib('open-queue','list-music',false,'Queue','now-playing-queue-button')}${ib('np-add','list-plus',false,'Add to playlist','np-add-button')}${ib('np-meta','info',false,'Song details','now-playing-info-button')}${ib('open-eq','sliders-vertical',!!(state.eq&&state.eq.enabled),'Equalizer','now-playing-eq-button')}</div>`;
  let mainInner;
  if(state.showLyrics){
    const lyricTools=lyricToolsHtml(s), lyricBody=lyricBodyHtml(s);
    mainInner=`<div class="flex min-h-0 flex-1 flex-col pt-1 lg:flex-row lg:gap-12 lg:pt-3">
      <div class="flex shrink-0 flex-col lg:w-[330px] lg:min-h-0 lg:overflow-y-auto no-scrollbar np-side">
        <div class="mb-3 flex shrink-0 items-center justify-between gap-2 lg:mb-0 lg:my-auto lg:flex-col lg:items-stretch lg:gap-5">
          <button data-act="toggle-lyrics" class="flex min-w-0 items-center gap-3 text-left lg:flex-col lg:items-start lg:gap-4"><div class="h-11 w-11 shrink-0 overflow-hidden rounded-lg shadow-lg lg:aspect-square lg:h-auto lg:w-[min(300px,26vh)] lg:rounded-3xl">${img(s.coverArt,'h-full w-full object-cover')}</div><div class="min-w-0 lg:mt-1"><p class="clamp-1 text-base font-bold lg:text-2xl">${esc(s.title)}</p><p class="clamp-1 text-sm text-white/60 lg:text-base">${esc(s.artist)}</p></div></button>
          <div id="np-lyric-tools">${lyricTools}</div>
        </div>
      </div>
      <div id="np-lyric-region" class="relative flex min-h-0 flex-1 flex-col">
        <div class="pointer-events-none absolute right-0 top-0 z-30 hidden max-w-[72%] lg:block">${lyricToolsDesktopRow(s)}</div>
        <div id="np-performer" class="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-center lg:justify-start px-2 pt-1 lg:pl-3 lg:pr-[24rem]"></div>
        ${lyricBody}
      </div>
    </div><div class="np9-lyr-foot">${dock}${acts}</div>`;
  } else {
    const feat=s.featuring?` <span class="np9-feat">feat. ${esc(s.featuring)}</span>`:'';
    const meta=`<div class="np9-meta"><div class="min-w-0 flex-1"><div class="flex min-w-0 items-center gap-2"><h1 class="np9-title clamp-1" data-testid="np-title">${esc(s.title)}</h1>${s.explicit?'<span class="np9-e">E</span>':''}</div><p class="np9-artist clamp-1" data-testid="np-artist">${esc(s.artist)}${feat}</p>${s.producer?`<p class="np9-prod clamp-1">Prod. ${esc(s.producer)}</p>`:''}</div>${favCycleBtn(s)}</div>`;
    mainInner=`<div class="np9-main"><div class="np9-stage" data-testid="np-stage">${npArtHtml(s,pal)}</div><div class="np9-col">${meta}${npPeekHtml(s)}${dock}${acts}</div></div>`;
  }
  const ctx=s.album||'';
  c.innerHTML=`<div data-np-root data-testid="now-playing" data-cover-bg="${st==='full'}" data-np-style="${st}" style="${npVars(pal)}" class="np-x np9 dark-surface fixed inset-0 z-[60] overflow-hidden bg-[#08080a] ${state.showLyrics?'np9-lyr':''} ${(state.karaoke&&state.karFull)?'np-kar-full':''} ${wasOpen?'':'np-entering'}">
    ${npBgHtml(s)}
    <div class="np9-shell relative z-10 mx-auto flex h-[100dvh] w-full flex-col">
      <div data-np-drag-zone class="np9-top shrink-0">
        <div class="np9-grab sm:hidden" data-testid="np-grabber" aria-hidden="true"></div>
        <div class="relative flex items-center justify-between">
          <button data-act="np-close" aria-label="Close" data-testid="now-playing-close-button" class="press grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5 text-white/85"><i data-lucide="chevron-down" style="width:22px;height:22px"></i></button>
          <div class="np9-kick pointer-events-none"><span>Now Playing</span>${ctx?`<b class="clamp-1">${esc(ctx)}</b>`:''}</div>
          <div class="flex items-center gap-2"><button data-act="np-style-open" aria-label="Player style" data-testid="np-style-btn" title="Player style" class="press grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5 text-white/85"><i data-lucide="palette" style="width:18px;height:18px"></i></button><button data-act="np-share" aria-label="Share" data-testid="np-share-button" class="press grid h-11 w-11 place-items-center rounded-full border border-white/12 bg-white/5 text-white/85"><i data-lucide="share-2" style="width:18px;height:18px"></i></button></div>
        </div>
      </div>
      <div class="np9-body flex min-h-0 flex-1 flex-col ${state.showLyrics?'overflow-hidden':''} ${modeChanged?'np-content-in':''}">${mainInner}</div>
    </div></div>`;
  icons();
  fillSlider($("#np-seek")); fillSlider($("#np-vol")); updateABMarkers();
  state.lyricLines=[...c.querySelectorAll('#np-lyrics .np-line')];
  _perfKey="__init__"; _lyricUserScrollUntil=0;
  const lcont=$("#np-lyrics");
  if(lcont){ const onUser=()=>pauseLyricAutoScroll(); lcont.addEventListener("wheel",onUser,{passive:true}); lcont.addEventListener("touchmove",onUser,{passive:true}); }
  wireLyricLongPress();
  if(!state.lyricSelect) updateLyricHighlight();
  if(state.karaoke){ _karIdx=-1; _karSpans=null; updateKaraoke(true); startKaraokeLoop(); }
  syncScrollLock();
  wireNPSwipe();
  npBeatLoop(); mkLyLoop();
  if(!wasOpen) setTimeout(()=>wnMaybeAuto('player'),480);
}
/* style picker sheet */
function npMiniHtml(id,s){ return `<span class="np9-art st-${id} is-playing is-mini" style="--glow:${rgb(state.palette&&state.palette[0],0.55)}">${npArtInner(id,s,true)}</span>`; }
function npsSwitch(act,tid,on,ic,title,desc){ return `<button type="button" data-act="${act}" data-testid="${tid}" role="switch" aria-checked="${on}" class="nps-sw press${on?' is-on':''}"><span class="nps-sw-ic"><i data-lucide="${ic}"></i></span><span class="nps-sw-t"><b>${title}</b><small>${desc}</small></span><span class="nps-tg"><i></i></span></button>`; }
function npStyleTiles(s,tidp){ const st=npStyle(); return NP_STYLES.map(([id,label])=>`<button type="button" data-act="np-style-set" data-val="${id}" data-testid="${tidp}-${id}" aria-pressed="${st===id}" class="nps-tile press${st===id?' is-on':''}"><span class="nps-prev">${npMiniHtml(id,s)}</span><span class="nps-l">${label}</span>${st===id?'<span class="nps-check"><i data-lucide="check"></i></span>':''}</button>`).join(''); }
function npsHtml(still){ const s=curSong()||SONGS[0]||{coverArt:'',title:'Treesh'};
  return `<div class="nps-bd" data-act="np-style-close" data-testid="np-style-backdrop"></div><div class="nps-sheet${still?' is-still':''}" role="dialog" aria-label="Player style" data-testid="np-style-sheet"><div class="nps-head" data-nps-drag><span class="nps-grab"></span><div class="flex items-center justify-between gap-3"><div><p class="nps-k">Now Playing</p><h3 class="nps-t">Player style</h3></div><button type="button" data-act="np-style-close" data-testid="np-style-close" aria-label="Close" class="nps-x press"><i data-lucide="x"></i></button></div></div><div class="nps-scroll"><div class="nps-grid">${npStyleTiles(s,'np-style-opt')}</div><div class="nps-opts">${npsSwitch('np-peek-toggle','np-style-peek-toggle',npPeekOn(),'quote','Live lyrics','Show the current lyric under the song title')}${npsSwitch('np-aura','np-style-aura-toggle',npAuraOn(),'sparkles','Moving aura','Slow color drift from the cover art')}</div></div></div>`; }
function npsOpen(){ let r=document.getElementById('nps-root'); if(!r){ r=document.createElement('div'); r.id='nps-root'; document.body.appendChild(r); } state.npsOpen=true; r.className=''; r.setAttribute('style',npVars(state.palette)); r.innerHTML=npsHtml(false); icons(); npsWireDrag(); }
function npsClose(fast){ const r=document.getElementById('nps-root'); state.npsOpen=false; if(!r||!r.firstChild) return; if(fast){ r.innerHTML=''; return; } r.classList.add('is-out'); setTimeout(()=>{ if(!state.npsOpen){ r.innerHTML=''; r.className=''; } },260); }
function npsSync(){ if(!state.npsOpen) return; const r=document.getElementById('nps-root'); if(!r) return; const sc=r.querySelector('.nps-scroll'); const top=sc?sc.scrollTop:0; r.innerHTML=npsHtml(true); icons(); npsWireDrag(); const n=r.querySelector('.nps-scroll'); if(n) n.scrollTop=top; }
function npsWireDrag(){ const r=document.getElementById('nps-root'); const sh=r&&r.querySelector('.nps-sheet'); const hd=sh&&sh.querySelector('[data-nps-drag]'); if(!hd) return; let y0=null, dy=0;
  hd.addEventListener('pointerdown',e=>{ if(e.target.closest('button')) return; y0=e.clientY; dy=0; sh.style.transition='none'; try{ hd.setPointerCapture(e.pointerId); }catch(_){} });
  hd.addEventListener('pointermove',e=>{ if(y0==null) return; dy=Math.max(0,e.clientY-y0); sh.style.transform='translateY('+dy+'px)'; });
  const end=()=>{ if(y0==null) return; y0=null; sh.style.transition=''; if(dy>90) npsClose(); else sh.style.transform=''; };
  hd.addEventListener('pointerup',end); hd.addEventListener('pointercancel',end); }
function npSettingsHtml(tab){ const s=curSong()||SONGS[0]||{coverArt:'',title:'Treesh'};
  return `<section data-testid="settings-player-look" class="${tab==='appearance'?'':'hidden'} rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"><div class="mb-1 flex items-center gap-2.5"><span class="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--treesh-purple)]/15 text-[color:var(--treesh-purple)]"><i data-lucide="disc-3" style="width:18px;height:18px"></i></span><h2 class="text-lg font-bold">Now Playing look</h2></div><p class="mb-4 pl-11 text-sm text-white/50">Pick a cover style for the full-screen player. Tap the artwork in the player to switch any time.</p><div class="nps-grid nps-grid-set" style="${npVars(state.palette)}" data-testid="settings-np-styles">${npStyleTiles(s,'settings-np-style')}</div><div class="mt-4 space-y-2.5">${toggleCard('np-peek-toggle','settings-np-peek',npPeekOn(),'quote','Live lyrics','Show the current lyric line under the song title')}${toggleCard('np-aura','settings-np-aura',npAuraOn(),'sparkles','Moving aura','Slow color gradients pulled from the cover art')}</div></section>`; }
function p9ActA(act,t){ switch(act){
  case 'np-style-open': npsOpen(); break;
  case 'np-style-close': npsClose(); break;
  case 'np-style-set': npSetStyle(t.dataset.val); break;
  case 'np-peek-toggle': { const on=!npPeekOn(); LS.set('treesh_np_peek',on); if(state.npOpen) renderNP(); npsSync(); if(state.view==='settings') renderView(); toast(on?'Live lyrics on':'Live lyrics off',on?'The current line shows under the title':'The player stays clean and simple'); break; }
  case 'np-aura': setTimeout(npsSync,0); break;
  case 'np-close': npsClose(true); break;
} }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(t) p9ActA(t.dataset.act,t); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&state.npsOpen){ e.stopImmediatePropagation(); npsClose(); } },true);
