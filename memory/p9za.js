/* ---------- P9za: Playlists, 3D cover stacks that float out of the card (tilt with the phone or the mouse) ---------- */
function plxStage(c,o){ o=o||{}; const n=c.length;
  const cov=i=>c[i]?`<span class="plx-c plx-${i}">${img(c[i].coverArt,'plx-img')}${i===0&&o.badge?`<span class="plx-badge"><i data-lucide="${o.badge}" class="fill-current"></i></span>`:''}</span>`:`<span class="plx-c plx-${i} is-ghost">${i===0?`<i data-lucide="${o.ic||'list-music'}"></i>`:''}</span>`;
  return `<span class="plx-stage ${o.cls||''}" ${o.tid||''} data-count="${n}" aria-hidden="${o.tid?'false':'true'}"><span class="plx-rig">${[2,1,0].map(cov).join('')}<span class="plx-shadow"></span></span></span>`; }
function plxSub(n){ return n+' track'+(n!==1?'s':''); }
function plxMenu(pl,pre){ return `<details class="plx-more"><summary data-testid="${pre}-more-${pl.id}" aria-label="More for ${esc(pl.name)}" class="plx-ib press"><i data-lucide="ellipsis"></i></summary><div class="plx-menu dark-surface"><button type="button" data-act="pl-rename" data-id="${pl.id}" data-testid="${pre}-rename-${pl.id}"><i data-lucide="pencil"></i>Rename</button><button type="button" data-act="pl-delete" data-id="${pl.id}" data-testid="${pre}-delete-${pl.id}" class="is-del"><i data-lucide="trash-2"></i>Delete</button></div></details>`; }
function plxCardHtml(o){ const c=o.covers||[];
  return `<div class="plx${o.cls?' '+o.cls:''}" data-testid="${o.tid}" style="--i:${Math.min(o.i||0,12)}">
    <button type="button" ${o.open} aria-label="Open ${esc(o.name)}" class="plx-hit" data-testid="${o.otid||o.tid+'-open'}"></button>
    <div class="plx-box"><span class="plx-glow" aria-hidden="true">${c[0]?img(c[0].coverArt,''):''}</span>
      <div class="plx-meta"><b class="clamp-1">${esc(o.name)}</b><div class="plx-row"><small>${o.sub}</small>${o.menu||''}${o.play?`<button type="button" ${o.play} aria-label="Play ${esc(o.name)}" class="plx-play press"><i data-lucide="play" class="fill-current"></i></button>`:''}</div></div></div>
    ${plxStage(c,{ic:o.ic,badge:o.badge})}</div>`; }
function plxFavCovers(){ const seen=new Set(), out=[]; for(const s of favSongs()){ if(!s||!s.coverArt||seen.has(s.coverArt)) continue; seen.add(s.coverArt); out.push(s); if(out.length===3) break; } return out; }
function plxFavCard(open,tid,i){ const n=favSongs().length; if(!n) return '';
  return plxCardHtml({covers:plxFavCovers(),name:'Favorites',sub:plxSub(n),open,play:'data-act="playall-context" data-ctx="fav" data-testid="favorites-playlist-play"',tid,otid:'favorites-playlist-open',ic:'heart',badge:'heart',cls:'is-fav',i}); }
function plxPlCard(pl,i,act,pre){ return plxCardHtml({covers:plCovers(pl),name:pl.name,sub:plxSub((pl.songIds||[]).length),open:`data-act="${act}" data-id="${pl.id}"`,play:`data-act="pl-play" data-id="${pl.id}" data-testid="${pre}-play-${pl.id}"`,tid:`${pre}-card-${pl.id}`,otid:`${pre}-open-${pl.id}`,menu:plxMenu(pl,pre),i}); }
viewPlaylists=function(){ const pls=state.playlists||[], favN=favSongs().length, total=pls.length+(favN?1:0);
  const head=`<div class="plx-head"><div class="min-w-0"><p class="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Curated by you</p><h1 class="mt-1 text-3xl font-bold sm:text-4xl" data-testid="playlists-title">Playlists</h1>${total?`<p class="mt-1 text-sm text-white/50" data-testid="playlists-count">${total} playlist${total!==1?'s':''}</p>`:''}</div><button data-act="new-playlist" data-testid="playlists-new" class="press inline-flex shrink-0 items-center gap-2 rounded-full bg-[color:var(--treesh-purple)] px-5 py-2.5 text-sm font-semibold text-white glow-purple"><i data-lucide="plus" style="width:16px;height:16px"></i> New</button></div>`;
  if(!total) return `<div class="space-y-6">${head}<div class="plx-empty" data-testid="playlists-empty">${plxStage([],{cls:'is-empty-hero'})}<p class="text-lg font-semibold">No playlists yet</p><p class="max-w-xs text-sm text-white/50">Create your first playlist and start adding tracks.</p><button data-act="new-playlist" class="press inline-flex items-center gap-2 rounded-full bg-[color:var(--treesh-purple)] px-5 py-2.5 text-sm font-semibold text-white"><i data-lucide="plus" style="width:16px;height:16px"></i> Create playlist</button></div></div>`;
  return `<div class="space-y-6">${head}<div class="plx-grid" data-testid="playlists-grid">${plxFavCard('data-act="nav" data-view="favorites"','favorites-playlist-card',0)}${pls.map((pl,i)=>plxPlCard(pl,i+1,'pl-open','playlist')).join('')}</div></div>`; };
const _lps9za=libraryPlaylistsSection; libraryPlaylistsSection=function(){ const h=_lps9za.apply(this,arguments); const k='<div class="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x" data-testid="lib-playlists-row">'; const i=h.indexOf(k); if(i<0) return h;
  return h.slice(0,i)+`<div class="plx-strip no-scrollbar" data-testid="lib-playlists-row">${(state.playlists||[]).map((pl,j)=>plxPlCard(pl,j,'pl-open-lib','lib-playlist')).join('')}</div></section>`; };
const _ppl9za=profilePlaylistsHtml; profilePlaylistsHtml=function(){ const h=_ppl9za.apply(this,arguments); const k='<div class="grid grid-cols-2 gap-3">'; const i=h.indexOf(k); if(i<0) return h;
  return h.slice(0,i)+`<div class="plx-grid is-2" data-testid="profile-playlists-grid">${plxFavCard('data-act="profile-tab" data-tab="favorites"','profile-favorites-card',0)}${(state.playlists||[]).map((pl,j)=>plxPlCard(pl,j+1,'pl-open-profile','profile-playlist')).join('')}</div></div>`; };
const _vpd9za=viewPlaylistDetail; viewPlaylistDetail=function(){ const h=_vpd9za.apply(this,arguments); const pl=plById(state.param); const k='<section class="flex items-end gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6">'; const i=h.indexOf(k); if(!pl||i<0) return h; const j=h.indexOf('</section>',i); if(j<0) return h;
  const n=vis((pl.songIds||[]).map(id=>SONG_BY_ID[id]).filter(Boolean)).length, c=plCovers(pl);
  const hero=`<section class="plx-hero" data-testid="playlist-detail-hero"><span class="plx-hero-bg" aria-hidden="true">${c[0]?img(c[0].coverArt,''):''}</span>${plxStage(c,{cls:'is-hero',tid:`data-testid="playlist-detail-cover"`})}<div class="plx-hero-meta"><p class="plx-k">Playlist</p><h1 class="clamp-2" data-testid="playlist-detail-name">${esc(pl.name)}</h1><p class="plx-hs" data-testid="playlist-detail-count">${plxSub(n)} \u00b7 made by you</p></div></section>`;
  return h.slice(0,i)+hero+h.slice(j+10); };
document.addEventListener('click',e=>{ const t=e.target; document.querySelectorAll('details.plx-more[open]').forEach(d=>{ if(!d.contains(t)||(t.closest&&t.closest('.plx-menu button'))) d.removeAttribute('open'); }); });
/* mouse tilt (phones use the gyroscope through gyLoop) */
let _plxP=null, _plxR=0;
function plxOff(c){ if(!c) return; c.classList.remove('is-ptr'); c.style.removeProperty('--gy-x'); c.style.removeProperty('--gy-y'); }
document.addEventListener('pointermove',e=>{ if(e.pointerType!=='mouse'||_plxR) return; const x=e.clientX, y=e.clientY, tg=e.target;
  _plxR=requestAnimationFrame(()=>{ _plxR=0; const c=tg&&tg.closest?tg.closest('.plx,.plx-hero'):null; if(_plxP&&_plxP!==c) plxOff(_plxP); _plxP=c; if(!c||document.documentElement.classList.contains('perf-mode')) return;
    const r=c.getBoundingClientRect(); c.classList.add('is-ptr'); c.style.setProperty('--gy-x',Math.max(-1,Math.min(1,(x-r.left)/r.width*2-1)).toFixed(3)); c.style.setProperty('--gy-y',Math.max(-1,Math.min(1,(y-r.top)/r.height*2-1)).toFixed(3)); }); },{passive:true});
document.addEventListener('pointerleave',()=>{ plxOff(_plxP); _plxP=null; });

/* ---------- P9za: Instrum on phones is a groovebox. One instrument, 4x4 pads per bar, swipe between bars, own vocal screen, timeline + mixer on demand ---------- */
let _gbNow=null;
function gbS(){ const S=state.instrum; if(!S.gb) S.gb={mode:'pads',ti:0,bar:0,pick:false,ops:false,follow:false}; const g=S.gb, p=S.project; g.ti=Math.max(0,Math.min(p.tracks.length-1,g.ti|0)); g.bar=Math.max(0,Math.min(p.bars-1,g.bar|0)); return g; }
function gbHits(tr,b){ let n=0; for(let i=b*16;i<(b+1)*16;i++) if(tr.steps[i]) n++; return n; }
function gbTopHtml(){ const S=state.instrum, g=gbS(), tr=S.project.tracks[g.ti], m=g.mode;
  const mb=(v,ic,l)=>`<button type="button" data-act="gb-mode" data-val="${v}" data-testid="gb-mode-${v}" aria-pressed="${m===v}" class="gb-mb press${m===v?' on':''}"><i data-lucide="${ic}"></i><span>${l}</span></button>`;
  return `<div class="gb-top mx-3" data-testid="gb-topbar"><button type="button" data-act="gb-pick" data-testid="gb-instrument-picker" aria-expanded="${!!(g.pick&&m==='pads')}" class="gb-pickb press" style="--c:${tr.color}"><span class="gb-pic"><i data-lucide="${tr.icon||'circle'}"></i></span><span class="gb-pt"><small>Instrument</small><b class="clamp-1" data-testid="gb-instrument-name">${esc(tr.name)}</b></span><i data-lucide="chevron-down" class="gb-chev"></i></button>${mb('vocals','mic-vocal','Vocals')}${mb('timeline','gantt-chart','Timeline')}${mb('mixer','sliders-vertical','Mixer')}</div>`; }
function gbPickHtml(){ const S=state.instrum, g=gbS(), p=S.project;
  return `<div class="gb-pick mx-3" data-testid="gb-instrument-grid">${p.tracks.map((tr,i)=>{ const n=gbHits(tr,g.bar); return `<button type="button" data-act="gb-inst" data-ti="${i}" data-testid="gb-inst-${i}" aria-pressed="${i===g.ti}" class="gb-it press${i===g.ti?' on':''}${tr.mute?' is-muted':''}" style="--c:${tr.color}"><span class="gb-pic"><i data-lucide="${tr.icon||'circle'}"></i></span><b class="clamp-1">${esc(tr.name)}</b><small>${n?n+' hit'+(n>1?'s':''):'Empty'}</small></button>`; }).join('')}</div>`; }
function gbPadsHtml(dir){ const S=state.instrum, g=gbS(), p=S.project, tr=p.tracks[g.ti], b=g.bar;
  const pads=Array.from({length:16},(_,k)=>{ const si=b*16+k, on=!!tr.steps[si]; const dots=p.tracks.map((o,oi)=>oi!==g.ti&&o.steps[si]&&!o.mute?`<i style="--d:${o.color}"></i>`:'').join('');
    return `<button type="button" data-act="i-step" data-ti="${g.ti}" data-step="${si}" data-testid="gb-pad-${k}" aria-pressed="${on}" aria-label="${esc(tr.name)}, bar ${b+1}, step ${k+1}" class="gb-pad${on?' on':''}${k%4===0?' is-beat':''}"><b>${k+1}</b>${dots?`<span class="gb-dots">${dots}</span>`:''}</button>`; }).join('');
  return `<div id="gb-pads" class="gb-pads${dir?(dir>0?' is-in-r':' is-in-l'):''}" data-no-swipe data-testid="gb-pads" style="--c:${tr.color}">${pads}</div>`; }
function gbBarsHtml(){ const S=state.instrum, g=gbS(), p=S.project, tr=p.tracks[g.ti];
  const bars=Array.from({length:p.bars},(_,b)=>{ const cols=Array.from({length:16},(_,k)=>tr.steps[b*16+k]?'<i class="on"></i>':'<i></i>').join(''); return `<button type="button" data-act="gb-bar" data-bar="${b}" data-testid="gb-bar-${b}" aria-pressed="${b===g.bar}" aria-label="Bar ${b+1}" class="gb-bar press${b===g.bar?' on':''}"><span class="gb-bar-v">${cols}</span><b>${b+1}</b></button>`; }).join('');
  return `<div class="gb-bars no-scrollbar" id="gb-bars" data-testid="gb-bars">${bars}<button type="button" data-act="gb-add-bar" data-testid="gb-add-bar" aria-label="Add a bar" class="gb-bar is-add press"><i data-lucide="plus"></i></button></div>`; }
function gbOpsHtml(){ const g=gbS(); if(!g.ops) return ''; const tr=state.instrum.project.tracks[g.ti];
  const op=(v,ic,l,cls)=>`<button type="button" data-act="gb-op" data-val="${v}" data-testid="gb-op-${v}" class="gb-op press${cls||''}"><i data-lucide="${ic}"></i>${l}</button>`;
  return `<div class="gb-ops" data-testid="gb-bar-ops">${op('dup','copy-plus','Duplicate bar')}${op('insert','between-vertical-start','Empty bar after')}${op('fill','repeat-2','Repeat to the end')}${op('inst',tr.icon||'eraser','Clear '+esc(tr.name))}${op('clear','eraser','Clear bar')}${op('del','trash-2','Delete bar',' is-del')}</div>`; }
function gbMainHtml(dir){ const S=state.instrum, g=gbS(), p=S.project, tr=p.tracks[g.ti];
  return `<section class="gb-main studio-panel mx-3" id="gb-main" data-testid="gb-main" style="--c:${tr.color}">
    <div class="gb-ph"><div class="min-w-0 flex-1"><p class="gb-k">Bar <b data-testid="gb-bar-label">${g.bar+1}</b> of ${p.bars}</p><p class="gb-hint">Swipe the pads to change bars</p></div>
      ${tr.melodic?`<select data-act="i-note" data-ti="${g.ti}" aria-label="${esc(tr.name)} note" data-testid="gb-note" class="ix-note gb-note">${INSTRUM_NOTES.map(n=>`<option ${n===tr.note?'selected':''}>${n}</option>`).join('')}</select>`:''}
      <span class="ix-ms">${ixMs('i-mute',`data-ti="${g.ti}" data-testid="gb-mute"`,'M',tr.mute,tr.name)}${ixMs('i-solo',`data-ti="${g.ti}" data-testid="gb-solo"`,'S',tr.solo,tr.name)}</span>
      <button type="button" data-act="gb-ops" data-testid="gb-ops-toggle" aria-expanded="${!!g.ops}" aria-label="Bar actions" class="ix-mini gb-more${g.ops?' on':''}"><i data-lucide="ellipsis" style="width:15px;height:15px"></i></button></div>
    ${gbOpsHtml()}
    <div class="gb-nav"><button type="button" data-act="gb-step" data-val="-1" data-testid="gb-prev-bar" aria-label="Previous bar" class="gb-arrow press" ${g.bar<=0?'disabled':''}><i data-lucide="chevron-left"></i></button>${gbPadsHtml(dir)}<button type="button" data-act="gb-step" data-val="1" data-testid="gb-next-bar" aria-label="Next bar" class="gb-arrow press" ${g.bar>=p.bars-1?'disabled':''}><i data-lucide="chevron-right"></i></button></div>
    <div class="gb-volrow"><i data-lucide="volume-2" style="width:14px;height:14px"></i><input type="range" min="0" max="1" step="0.02" value="${tr.vol==null?0.85:tr.vol}" data-act="i-vol" data-ti="${g.ti}" data-testid="gb-vol" aria-label="${esc(tr.name)} volume" class="i-slider"><button type="button" data-act="gb-follow" data-testid="gb-follow" aria-pressed="${!!g.follow}" class="gb-follow press${g.follow?' on':''}"><i data-lucide="locate-fixed"></i>Follow</button></div>
    ${gbBarsHtml()}</section>`; }
function gbSongHtml(){ const p=state.instrum.project;
  return `<section class="studio-panel gb-song mx-3" data-testid="gb-song"><div class="gb-sl"><i data-lucide="waves" style="width:14px;height:14px"></i><span>Swing</span><input type="range" min="0" max="0.6" step="0.05" value="${p.swing}" data-act="i-swing" data-testid="ix-swing" aria-label="Swing" class="i-slider"></div><div class="gb-2"><button data-act="i-random" data-testid="instrum-random" class="idaw-btn"><i data-lucide="dices" style="width:15px;height:15px"></i>Randomize</button><button data-act="i-clear" data-testid="instrum-clear" class="idaw-btn"><i data-lucide="eraser" style="width:15px;height:15px"></i>Clear all drums</button></div></section>`; }
function gbVocHtml(){ const S=state.instrum, p=S.project, sb=ixSecBar(p), tracks=p.audioTracks||[], rec=!!S.recording, armed=!!S.armed, tgt=iTargetTrack(), from=Math.min(p.bars-1,Math.floor((S.playheadSec||0)/sb+1e-6));
  const fromChips=Array.from({length:p.bars},(_,b)=>`<button type="button" data-act="gb-from" data-bar="${b}" data-testid="gb-from-${b}" aria-pressed="${b===from}" class="gb-chip press${b===from?' on':''}">${b+1}</button>`).join('');
  const trk=tracks.map(tr=>`<button type="button" data-act="i-atrack-select" data-tid="${tr.id}" data-testid="gb-voc-track-${tr.id}" aria-pressed="${!!tgt&&tgt.id===tr.id}" class="gb-chip is-trk press${tgt&&tgt.id===tr.id?' on':''}" style="--c:${tr.color}"><i class="gb-cdot"></i>${esc(tr.name)}</button>`).join('')+`<button type="button" data-act="i-audio-add" data-testid="gb-voc-add-track" class="gb-chip is-dash press"><i data-lucide="plus"></i>New track</button>`;
  const fx=tgt?IDAW_FX.map(f=>{ const on=tgt.fx&&tgt.fx.preset===f.id; return `<button type="button" data-act="i-fx-preset" data-tid="${tgt.id}" data-fx="${f.id}" data-testid="gb-fx-${f.id}" aria-pressed="${!!on}" class="gb-chip press${on?' on':''}">${f.name}</button>`; }).join(''):'';
  const takes=tgt?(tgt.clips||[]).slice().sort((a,b)=>(a.start||0)-(b.start||0)).map(c=>`<div class="gb-take" data-testid="gb-take-${c.id}"><button type="button" data-act="gb-take-play" data-start="${c.start||0}" aria-label="Play from ${esc(c.name||'take')}" class="gb-tp press"><i data-lucide="play" class="fill-current"></i></button><span class="min-w-0 flex-1"><b class="clamp-1">${esc(c.name||'Take')}</b><small>Bar ${Math.floor((c.start||0)/sb)+1} \u00b7 ${iFmtTime(c.dur||0)}</small></span><button type="button" data-act="i-clip-del" data-tid="${tgt.id}" data-cid="${c.id}" data-testid="gb-take-del-${c.id}" aria-label="Delete ${esc(c.name||'take')}" class="ix-mini is-danger"><i data-lucide="trash-2" style="width:13px;height:13px"></i></button></div>`).join(''):'';
  return `<section class="gb-voc studio-panel mx-3" data-testid="gb-vocals">
    <div class="gb-vh"><button type="button" data-act="i-rec" data-testid="gb-voc-record" aria-label="${rec?'Stop recording':'Start recording'}" class="gb-recb${rec?' is-rec':''}${armed?' is-armed':''}"><span class="gb-rec-ring"></span><span class="gb-rec-core">${rec?'<i data-lucide="square" class="fill-current"></i>':'<i data-lucide="mic"></i>'}</span></button>
      <p class="gb-vt" data-testid="gb-voc-status">${rec?'Recording\u2026 tap to stop':armed?'Tap to record from bar '+(from+1):'Tap to turn on your mic and record'}</p><p class="gb-vs">Your beat plays while you record. Use headphones so it doesn\u2019t echo.</p>
      <div class="idaw-meter gb-meter" title="Input level"><div class="idaw-meter-fill" id="i-meter-fill"></div></div></div>
    <div class="gb-2"><button data-act="i-arm" data-testid="idaw-arm" class="idaw-btn ${armed?'on':''}"><i data-lucide="mic" style="width:15px;height:15px"></i>${armed?'Mic on':'Mic off'}</button><button data-act="i-monitor" data-testid="idaw-monitor" class="idaw-btn ${S.monitor?'on':''}" ${armed?'':'disabled'}><i data-lucide="headphones" style="width:15px;height:15px"></i>Hear myself</button></div>
    <p class="gb-lb">Start at bar</p><div class="gb-chips no-scrollbar">${fromChips}</div>
    <p class="gb-lb">Record into</p><div class="gb-chips no-scrollbar">${trk}</div>
    ${tgt?`<p class="gb-lb">Voice effect</p><div class="gb-chips no-scrollbar">${fx}</div>`:''}
    <div class="gb-lbr"><p class="gb-lb">Takes${tgt?' \u00b7 '+esc(tgt.name):''}</p><button data-act="i-audio-import" data-testid="idaw-import" class="gb-chip is-dash press"><i data-lucide="upload"></i>Import audio</button><input type="file" id="i-audio-file" accept="audio/*" class="hidden"></div>
    ${takes?`<div class="gb-takes">${takes}</div>`:`<p class="gb-none" data-testid="gb-takes-empty">No takes yet. Your recordings land on the timeline at the bar you pick.</p>`}</section>`; }
const _ixSHgb=instrumStudioHtml; instrumStudioHtml=function(fs){ if(!ixPhone()) return _ixSHgb.apply(this,arguments);
  const S=state.instrum; ixEnsure(S.project); ixSetPPS(S); const g=gbS(), opened=S._opened; S._opened=false; S._pageAnim=false;
  const body=g.mode==='vocals'?gbVocHtml():g.mode==='timeline'?`${ixToolsPhoneHtml()}${ixSelBarHtml()}${ixTimelineHtml(fs)}`:g.mode==='mixer'?ixMixerHtml():`${g.pick?gbPickHtml():''}${gbMainHtml(0)}${instrumPresetsHtml()}${gbSongHtml()}`;
  const parts=`${ixTransportPhoneHtml()}${gbTopHtml()}<div class="gb-body is-${g.mode}" data-testid="gb-view-${g.mode}">${body}</div>`;
  if(fs) return `<div data-instrum-root class="ix-root is-fs is-ph is-gb flex h-full min-h-0 flex-col tr-fade-in"><div class="shrink-0">${instrumHeaderHtml(true)}</div><div class="ix-fs-body gb-fs soft-scroll">${parts}</div></div>`;
  return `<div data-instrum-root class="ix-root is-ph is-gb -mx-4 pb-8${opened?' i-open':''}" data-testid="instrum-studio">${instrumHeaderHtml(false)}<div class="gb-stack">${parts}</div></div>`; };
function gbPaintMain(dir){ const el=document.getElementById('gb-main'); if(!el){ renderInstrum(); return; } el.outerHTML=gbMainHtml(dir); _gbNow=null; icons(); const S=state.instrum; if(S&&S.aplaying&&S.visStep>=0) gbNow(S.visStep); }
function gbGo(b,dir){ const S=state.instrum, g=gbS(); b=Math.max(0,Math.min(S.project.bars-1,b)); if(b===g.bar) return; g.bar=b; if(g.follow&&S.aplaying) g.follow=false; gbPaintMain(dir==null?(b>g.bar?1:-1):dir); }
function gbNow(col){ if(_gbNow){ _gbNow.classList.remove('is-now'); _gbNow=null; } const S=state.instrum; if(!S||!S.gb||!ixPhone()) return; const g=S.gb;
  document.querySelectorAll('#gb-bars .gb-bar.is-play').forEach(x=>x.classList.remove('is-play')); if(col<0) return; const b=Math.floor(col/16);
  const bb=document.querySelector('#gb-bars [data-bar="'+b+'"]'); if(bb) bb.classList.add('is-play');
  if(g.follow&&g.mode==='pads'&&b!==g.bar&&document.getElementById('gb-main')){ g.bar=b; const el=document.getElementById('gb-main'); el.outerHTML=gbMainHtml(0); icons(); }
  const pd=document.querySelector('#gb-pads [data-step="'+col+'"]'); if(pd){ pd.classList.add('is-now'); _gbNow=pd; } }
const _ihc9za=iHighlightCol; iHighlightCol=function(col){ _ihc9za.apply(this,arguments); try{ gbNow(col); }catch(e){} };
function gbSyncBars(){ const el=document.getElementById('gb-bars'); if(el){ el.outerHTML=gbBarsHtml(); icons(); } const g=state.instrum&&state.instrum.gb; if(g&&g.pick){ const pk=document.querySelector('[data-testid="gb-instrument-grid"]'); if(pk){ pk.outerHTML=gbPickHtml(); icons(); } } }
function gbBarOp(op){ const S=state.instrum, g=gbS(), p=S.project, b=g.bar, tr=p.tracks[g.ti];
  if(op==='inst'){ for(let i=b*16;i<(b+1)*16;i++) tr.steps[i]=false; S.activePreset=null; iPushHistory(); g.ops=false; renderInstrum(); toast(tr.name+' cleared','Bar '+(b+1)); return; }
  const before=p.bars; S.selBars=[b,b]; ixBarsOp(op); const sel=S.selBars; S.selBars=null;
  if((op==='dup'||op==='insert')&&p.bars>before) g.bar=sel?sel[0]:b+1; else if(op==='del') g.bar=Math.min(b,p.bars-1);
  g.ops=false; renderInstrum(); }
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('[data-act]'); if(!t) return; const a=t.dataset.act; if(a.indexOf('gb-')!==0) return; const S=state.instrum; if(!S||!S.project) return; const g=gbS(), p=S.project;
  switch(a){
    case 'gb-mode': { const v=t.dataset.val; g.mode=g.mode===v?'pads':v; g.pick=false; renderInstrum(); try{ if(!S.fs) window.scrollTo({top:0}); }catch(_){} break; }
    case 'gb-pick': if(g.mode!=='pads'){ g.mode='pads'; g.pick=true; } else g.pick=!g.pick; renderInstrum(); break;
    case 'gb-inst': g.ti=+t.dataset.ti; g.pick=false; renderInstrum(); { const tr=p.tracks[g.ti]; if(tr&&_iAC&&!S.aplaying){ try{ _iAC.resume(); iTrigger(tr,_iAC.currentTime+0.01,_iAC,_iMaster); }catch(_){} } } break;
    case 'gb-step': gbGo(g.bar+(+t.dataset.val),+t.dataset.val); break;
    case 'gb-bar': gbGo(+t.dataset.bar,+t.dataset.bar>g.bar?1:-1); break;
    case 'gb-add-bar': { const n=p.bars; ixLen(1); if(p.bars>n){ g.bar=p.bars-1; renderInstrum(); toast('Bar '+p.bars+' added'); } break; }
    case 'gb-ops': g.ops=!g.ops; gbPaintMain(0); break;
    case 'gb-op': gbBarOp(t.dataset.val); break;
    case 'gb-follow': g.follow=!g.follow; if(g.follow&&S.aplaying&&S.visStep>=0){ g.bar=Math.floor(S.visStep/16); } gbPaintMain(0); toast(g.follow?'Pads follow the playhead':'Pads stay on this bar'); break;
    case 'gb-from': { const sec=(+t.dataset.bar)*ixSecBar(p); if(S.aplaying) ixStop(true); S.playheadSec=sec; iAudioSetPlayhead(sec); const tm=document.getElementById('i-audio-time'); if(tm) tm.textContent=ixTimeTxt(sec,p); renderInstrum(); break; }
    case 'gb-take-play': { const st=+t.dataset.start||0; if(S.aplaying) ixStop(true); S.playheadSec=st; ixPlay(st); break; } } });
document.addEventListener('click',e=>{ const t=e.target&&e.target.closest&&e.target.closest('#gb-pads [data-act="i-step"]'); if(t) setTimeout(gbSyncBars,0); });
/* swipe the pads to change bars */
(function(){ let sx=0, sy=0, on=false;
  document.addEventListener('touchstart',e=>{ const g=e.target&&e.target.closest&&e.target.closest('#gb-pads'); if(!g||e.touches.length!==1){ on=false; return; } on=true; sx=e.touches[0].clientX; sy=e.touches[0].clientY; },{passive:true});
  document.addEventListener('touchend',e=>{ if(!on) return; on=false; const tc=e.changedTouches&&e.changedTouches[0]; if(!tc) return; const dx=tc.clientX-sx, dy=tc.clientY-sy; if(Math.abs(dx)<46||Math.abs(dx)<Math.abs(dy)*1.3) return;
    const S=state.instrum; if(!S||!S.gb) return; const d=dx<0?1:-1, nb=S.gb.bar+d; if(nb<0||nb>=S.project.bars){ const el=document.getElementById('gb-pads'); if(el){ el.classList.remove('is-edge'); void el.offsetWidth; el.classList.add('is-edge'); } return; } gbGo(nb,d); },{passive:true}); })();

/* ---------- P9za: Lyric Studio markup, every tool toggles, works on the word under the cursor and never eats your selection ---------- */
function lsTaSet(ta,nv,a,b){ ta.value=nv; ta.focus(); try{ ta.setSelectionRange(a,b); }catch(_){} ta.dispatchEvent(new Event('input',{bubbles:true})); try{ lsPositionRhymePop(); lsScheduleRhymes(); }catch(_){} }
function lsRange(ta){ const v=ta.value; let s=ta.selectionStart||0, e=ta.selectionEnd||s;
  if(s===e){ const w=c=>!!c&&!/[\s()\u201C\u201D"]/.test(c); let a=s, b=s; while(a>0&&w(v[a-1])) a--; while(b<v.length&&w(v[b])) b++; return [a,b]; }
  while(s<e&&/\s/.test(v[s])) s++; while(e>s&&/\s/.test(v[e-1])) e--; return [s,e]; }
function lsPair(L,R){ const ta=$("#ls-write"); if(!ta) return; const v=ta.value, [s,e]=lsRange(ta);
  if(s===e){ lsTaSet(ta,v.slice(0,s)+L+R+v.slice(e),s+1,s+1); return; }
  if(v[s-1]===L&&v[e]===R){ lsTaSet(ta,v.slice(0,s-1)+v.slice(s,e)+v.slice(e+1),s-1,e-1); return; }
  if(e-s>=2&&v[s]===L&&v[e-1]===R){ lsTaSet(ta,v.slice(0,s)+v.slice(s+1,e-1)+v.slice(e),s,e-2); return; }
  lsTaSet(ta,v.slice(0,s)+L+v.slice(s,e)+R+v.slice(e),s+1,e+1); }
function lsCase(up){ const ta=$("#ls-write"); if(!ta) return; const v=ta.value, [s,e]=lsRange(ta); if(s===e){ toast('Put your cursor on a word','Or select the words to change'); return; }
  const seg=v.slice(s,e), U=seg.toUpperCase(), Lo=seg.toLowerCase(); let out=up?(seg===U?Lo:U):(seg===Lo?Lo.replace(/(^|[\s(\u201C"\u200B\uFEFF])(\p{L})/gu,(m,a,c)=>a+c.toUpperCase()):Lo);
  lsTaSet(ta,v.slice(0,s)+out+v.slice(e),s,s+out.length); }
function lsRepeat(){ const ta=$("#ls-write"); if(!ta) return; const v=ta.value, c=ta.selectionEnd||0; const a=v.lastIndexOf('\n',c-1)+1; let b=v.indexOf('\n',c); if(b<0) b=v.length; const line=v.slice(a,b);
  if(!line.trim()){ toast('Put your cursor on a lyric line'); return; } if(lsIsSection(line.trim())){ toast('Repeats are for lyric lines','For sections write it like [Chorus x2]'); return; }
  const m=line.match(/\s*\((?:\u00d7|x)(\d+)\)\s*$/); let nl;
  if(m){ const n=+m[1]; nl=n>=4?line.slice(0,m.index):line.slice(0,m.index)+' (\u00d7'+(n+1)+')'; } else nl=line.replace(/\s+$/,'')+' (\u00d72)';
  const keep=Math.min(c,a+nl.length); lsTaSet(ta,v.slice(0,a)+nl+v.slice(b),keep,keep); }
function lsMarkAt(mk){ const ta=$("#ls-write"); if(!ta) return; const v=ta.value, e=lsRange(ta)[1];
  if(v.slice(e-mk.length,e)===mk){ lsTaSet(ta,v.slice(0,e-mk.length)+v.slice(e),e-mk.length,e-mk.length); return; }
  if(v.slice(e,e+mk.length)===mk){ lsTaSet(ta,v.slice(0,e)+v.slice(e+mk.length),e,e); return; }
  lsTaSet(ta,v.slice(0,e)+mk+v.slice(e),e+mk.length,e+mk.length); }
const _lsMk9za=lsMarkup; lsMarkup=function(type){ switch(type){ case 'adlib': return lsPair('(',')'); case 'quote': return lsPair('\u201C','\u201D'); case 'caps': return lsCase(true); case 'lower': return lsCase(false); case 'repeat': return lsRepeat(); case 'pause': return lsMarkAt('\u2026'); case 'hold': return lsMarkAt(' \u2014'); } return _lsMk9za.apply(this,arguments); };
document.addEventListener('mousedown',e=>{ if(e.target&&e.target.closest&&e.target.closest('[data-act="ls-md"]')) e.preventDefault(); });
