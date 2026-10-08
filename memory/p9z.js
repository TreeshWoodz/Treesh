/* ---------- P9z: Games & Things, 3D floating art (same rig as Studios) ---------- */
function gm3Tile(g,i){ const soon=!!g.soon, art=ST3_ART[g.key+'_main'];
  return `<button type="button" data-act="game-open" data-key="${g.key}" data-testid="game-open-${g.key}" aria-label="${soon?esc(g.name)+', coming soon':'Play '+esc(g.name)}" class="st3 gm3-tile${soon?' is-soon':''}" style="--ac:${g.a};--ac2:color-mix(in srgb,${g.a} 55%,#fff);--i:${i}">
    <span class="st3-bg" aria-hidden="true"></span><span class="st3-sheen" aria-hidden="true"></span>
    ${soon?`<span class="gm-soon-tag" data-testid="game-soon-badge-${g.key}">Soon</span>`:''}
    <span class="st3-in"><span class="st3-stage gm3-stage" aria-hidden="true" data-testid="game-art-${g.key}"><span class="st3-sway"><span class="st3-rig">
      <span class="st3-orb"></span><span class="st3-shadow"></span>
      <span class="st3-l is-main">${art?`<img src="${art}" alt="" draggable="false" class="st3-main">`:`<span class="gm3-mono font-display">${g.mono}</span>`}</span>
      <span class="st3-l is-fx"><i class="st3-sp s1"></i><i class="st3-sp s2"></i></span></span></span></span>
      <span class="gm3-foot"><span class="gm3-logo">${g.logo?`<img src="${esc(g.logo)}" alt="" loading="lazy">`:`<span class="font-display">${g.mono}</span>`}</span><span class="gm3-tx"><b class="clamp-1">${esc(g.name)}</b><small>${soon?'Coming soon':(g.age?(g.age==='All'?'All ages':'Ages '+esc(g.age)):'Treesh Arcade')}</small></span><span class="gm3-go">${soon?'<i data-lucide="hourglass"></i>':'<i data-lucide="play" class="fill-current"></i>'}</span></span>
    </span></button>`; }
gamesArcadeHtml=function(){ const live=GAMES.filter(g=>!g.soon).length;
  return `<section class="gm3-arc" data-testid="games-arcade"><div class="gm3-arc-h"><span class="st3-k" style="--ac:#f5c451;--ac2:#ffe08a"><i data-lucide="joystick" style="width:14px;height:14px"></i>Treesh Arcade</span><span class="gm3-count" data-testid="games-arcade-count">${live} live${GAMES.length>live?` \u00b7 ${GAMES.length-live} on the way`:''}</span></div>
    <div class="gm3-grid">${GAMES.map(gm3Tile).join('')}</div></section>`; };
gameGamesHtml=function(){ const st=state.gameStats||{}, tw=state.totWins||{wins:{}};
  const H=[{id:'whatsnext',art:'whatsnext',act:'game-tab',val:'lyrics',testid:'game-hero-lyrics',cls:'gm3-hero',ic:'gamepad-2',ac:'#9328ff',ac2:'#f5c451',kicker:'Lyric game',title:'What\u2019s Next?',desc:'Guess the next lyric by typing or saying it. Build streaks and beat your high score.',chips:['High score '+(st.bestScore||0),(st.games||0)+' game'+((st.games||0)!==1?'s':'')],extra:'',cta:'Play now'},
    {id:'tot',art:'tot',act:'game-tab',val:'tot',testid:'game-hero-tot',cls:'gm3-hero',ic:'swords',ac:'#6d5bff',ac2:'#b9a8ff',kicker:'Head to head',title:'This or That',desc:'Two tracks enter, you pick the vibe. Crown a champion, but 3 skips ends the run.',chips:[(tw.plays||0)+' round'+((tw.plays||0)!==1?'s':'')+' played','Best streak '+(tw.bestStreak||0)],extra:'',cta:'Start a battle'}];
  return `<div class="space-y-7"><div class="gm3-heroes" data-testid="game-heroes">${H.map((o,i)=>st3Card(o,i)).join('')}</div>${gamesArcadeHtml()}</div>`; };
gameThingsHtml=function(){ const first=THINGS[0], rest=THINGS.slice(1);
  const card=(g,i)=>{ const x=THING_EXTRA[g.key]||{}; if(!ST3_ART[g.key+'_main']) return thingCard(g);
    return `<div data-testid="thing-spotlight-${g.key}">${st3Card({id:g.key,art:g.key,act:'game-open',key:g.key,testid:'game-open-'+g.key,cls:'gm3-thing',ic:'map-pin',ac:g.a,ac2:'color-mix(in srgb,'+g.a+' 50%,#fff)',kicker:g.label||'Treesh',title:g.name,desc:g.desc||'',chips:(x.chips||[]).slice(0,3),extra:g.updated?'Updated '+g.updated:'',cta:'Open '+g.name.split(' ')[0]},i)}</div>`; };
  return `<div class="space-y-6" data-testid="things-section">
   <div class="th-head"><div class="min-w-0"><p class="st3-hk">Beyond the arcade</p><h2 class="gm3-h2">Things</h2><p class="mt-1 max-w-lg text-sm text-white/55">Treesh apps and tools for life off the screen.</p></div><span class="th-count" data-testid="things-count"><b>${THINGS.length}</b>${THINGS.length===1?'thing':'things'}</span></div>
   ${first?card(first,0):''}
   ${rest.length?`<div class="grid gap-4 sm:grid-cols-2">${rest.map((g,i)=>card(g,i+1)).join('')}</div>`:''}
   <div class="th-soon" data-testid="things-coming-soon"><span class="th-soon-ic"><i data-lucide="sparkles"></i></span><div class="min-w-0"><p class="text-sm font-bold">More Things are on the way</p><p class="text-xs text-white/55">New Treesh tools land here first.</p></div></div>
  </div>`; };
const _vg9z=viewGame; viewGame=function(){ return _vg9z.apply(this,arguments)
  .replace('<p class="font-display text-[11px] uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Treesh</p><h1 class="mt-1 text-3xl font-bold sm:text-4xl">Games &amp; Things</h1>','<p class="st3-hk">Play on Treesh</p><h1 class="st3-h1" data-testid="game-title"><span>Games &amp; Things</span></h1>'); };

/* ---------- P9z: motion tilt (gyroscope). Off by default, never in performance mode ---------- */
state.gyroOn=!!LS.get('treesh_gyro',false);
const _gy={x:0,y:0,tx:0,ty:0,raf:0,base:null,live:false,perm:false,on:false};
/* only cards on screen tilt: an IntersectionObserver keeps the visible set, vars are written per element (never on <html>) */
const GY_SEL='.ar-hero,.md-hero,.md-big,.md-hero-pic,.np9-art .a-glass,.st3,.plx,.plx-hero';
const _gv={io:null,vis:new Set(),seen:new WeakSet(),scanT:0};
function gyAllowed(){ const h=document.documentElement.classList; return !!state.gyroOn&&!h.contains('perf-mode')&&!h.contains('a11y-reduce-motion'); }
function gyNeedsPerm(){ return typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'; }
function gyIO(){ if(!_gv.io&&typeof IntersectionObserver!=='undefined') _gv.io=new IntersectionObserver(es=>es.forEach(en=>{ const el=en.target; if(en.isIntersecting&&_gy.live){ _gv.vis.add(el); el.classList.add('gy-v'); } else { _gv.vis.delete(el); gyClear(el); } }),{rootMargin:'24px'}); return _gv.io; }
function gyClear(el){ el.classList.remove('gy-v'); ['--gy-x','--gy-y'].forEach(k=>el.style.removeProperty(k)); if(el.classList.contains('st3')){ ['--rx','--ry','--px','--py'].forEach(k=>el.style.removeProperty(k)); if(el._t){ el._t.x=el._t.y=el._t.tx=el._t.ty=0; } } }
function gyScan(force){ const n=performance.now(); if(!force&&n-_gv.scanT<600) return; _gv.scanT=n; const io=gyIO(); if(!io) return;
  document.querySelectorAll(GY_SEL).forEach(el=>{ if(!_gv.seen.has(el)){ _gv.seen.add(el); io.observe(el); } });
  _gv.vis.forEach(el=>{ if(!el.isConnected){ _gv.vis.delete(el); io.unobserve(el); } }); }
function gyListen(){ if(_gy.on||typeof DeviceOrientationEvent==='undefined'||(gyNeedsPerm()&&!_gy.perm)) return; window.addEventListener('deviceorientation',gyOnEv,{passive:true}); _gy.on=true; }
function gyStill(){ _gy.live=false; _gy.base=null; _gy.x=_gy.y=_gy.tx=_gy.ty=0; document.documentElement.classList.remove('gy-on','st3-gyro'); _st3.gyro=false;
  _gv.vis.forEach(gyClear); _gv.vis.clear(); if(_gv.io){ _gv.io.disconnect(); _gv.io=null; _gv.seen=new WeakSet(); } }
function gyOnEv(e){ if(e.gamma==null) return; if(document.hidden) return; if(!gyAllowed()){ if(_gy.live) gyStill(); return; } try{ st3Gyro(e); }catch(_){}
  if(!_gy.live){ _gy.live=true; document.documentElement.classList.add('gy-on'); gyScan(true); } else gyScan();
  const b=e.beta||0, g=e.gamma||0; if(!_gy.base) _gy.base={b,g}; _gy.base.b+=(b-_gy.base.b)*.004; _gy.base.g+=(g-_gy.base.g)*.004;
  const cl=v=>Math.max(-1,Math.min(1,v)); _gy.tx=cl((g-_gy.base.g)/22); _gy.ty=cl((b-_gy.base.b)/22); if(!_gy.raf&&_gv.vis.size) _gy.raf=requestAnimationFrame(gyLoop); }
function gyLoop(){ _gy.x+=(_gy.tx-_gy.x)*.12; _gy.y+=(_gy.ty-_gy.y)*.12; const x=_gy.x, y=_gy.y, xs=x.toFixed(3), ys=y.toFixed(3);
  _gv.vis.forEach(el=>{ const st=el.style; if(el.classList.contains('st3')){ if(!_st3.gyro) return; st.setProperty('--ry',(x*16).toFixed(2)+'deg'); st.setProperty('--rx',(-y*12).toFixed(2)+'deg'); st.setProperty('--px',(x*14).toFixed(1)+'px'); st.setProperty('--py',(y*10).toFixed(1)+'px'); }
    else { st.setProperty('--gy-x',xs); st.setProperty('--gy-y',ys); } });
  _gy.raf=(_gy.live&&_gv.vis.size&&(Math.abs(_gy.tx-_gy.x)>.002||Math.abs(_gy.ty-_gy.y)>.002))?requestAnimationFrame(gyLoop):0; }
/* studio / game cards: gyro goes through gyLoop; pointer tilt only animates the cards that are moving */
st3Gyro=function(e){ if((state.view!=='studios'&&state.view!=='game')||st3Still()) return; if(!_st3.gyro){ _st3.gyro=true; document.documentElement.classList.add('st3-gyro'); const b=document.querySelector('[data-act="st3-tilt"]'); if(b) b.remove(); } };
const _st3a=new Set();
st3T=function(c){ _st3a.add(c); return c._t||(c._t={x:0,y:0,tx:0,ty:0}); };
st3Loop=function(){ let live=false;
  _st3a.forEach(c=>{ const s=c._t; if(!s||!c.isConnected){ _st3a.delete(c); return; } s.x+=(s.tx-s.x)*.1; s.y+=(s.ty-s.y)*.1; if(Math.abs(s.tx-s.x)>.002||Math.abs(s.ty-s.y)>.002) live=true; else { s.x=s.tx; s.y=s.ty; _st3a.delete(c); }
    const st=c.style; st.setProperty('--ry',(s.x*16).toFixed(2)+'deg'); st.setProperty('--rx',(-s.y*12).toFixed(2)+'deg'); st.setProperty('--px',(s.x*14).toFixed(1)+'px'); st.setProperty('--py',(s.y*10).toFixed(1)+'px'); });
  _st3.raf=live?requestAnimationFrame(st3Loop):0; };
function gyRequest(done){ if(!gyNeedsPerm()){ gyListen(); if(done) done(); return; }
  DeviceOrientationEvent.requestPermission().then(r=>{ if(r==='granted'){ _gy.perm=true; gyListen(); if(done) done(); toast('Tilt your phone','Cover art, photos and cards move with you'); } else toast('Motion access is off','Allow Motion & Orientation Access in Safari settings'); }).catch(()=>toast('Couldn\u2019t turn on motion tilt')); }
/* iPhone forgets motion access when the app closes: ask again quietly on the first tap (no prompt if it was already allowed) */
function gyArm(){ if(_gy.arm||_gy.perm||!state.gyroOn||!gyNeedsPerm()) return; _gy.arm=true; const evs=['click','touchend'];
  const go=()=>{ evs.forEach(ev=>document.removeEventListener(ev,go,true)); _gy.arm=false; if(!state.gyroOn||_gy.perm||document.documentElement.classList.contains('perf-mode')) return;
    let p; try{ p=DeviceOrientationEvent.requestPermission(); }catch(e){ gyArm(); return; }
    Promise.resolve(p).then(r=>{ if(r==='granted'){ _gy.perm=true; gyListen(); try{ const b=document.querySelector('[data-act="st3-tilt"]'); if(b) b.remove(); }catch(_){} } else toast('Motion access is off','Allow Motion & Orientation Access in Safari settings to use Motion tilt'); }).catch(()=>gyArm()); };
  evs.forEach(ev=>document.addEventListener(ev,go,true)); }
if(state.gyroOn){ gyListen(); gyArm(); }
const _vSet9z=viewSettings; viewSettings=function(){ const h=_vSet9z.apply(this,arguments); const k='<button data-act="toggle-hints"'; const i=h.indexOf(k); if(i<0) return h; const perf=document.documentElement.classList.contains('perf-mode');
  return h.slice(0,i)+toggleCard('toggle-gyro','settings-toggle-gyro',!!state.gyroOn&&!perf,'smartphone','Motion tilt',perf?'Off while performance mode is on':'Tilt your phone to move cover art, photos and profile cards')+h.slice(i); };
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-act="toggle-gyro"]'); if(!b) return;
  if(document.documentElement.classList.contains('perf-mode')){ toast('Performance mode is on','Turn it off to use motion tilt'); return; }
  state.gyroOn=!state.gyroOn; LS.set('treesh_gyro',state.gyroOn); if(state.gyroOn) gyRequest(); else gyStill(); if(!state.gyroOn||!gyNeedsPerm()) toast(state.gyroOn?'Motion tilt on':'Motion tilt off',state.gyroOn?'Tilt your phone to see it':''); try{ renderView(); }catch(err){} });

/* ---------- P9z: Now Playing lyric editor. Saves like Lyric Studio, undo / redo, revert a line, the selected lines or everything ---------- */
let _le=null;
function leRaw(l){ return l?(lyMd(l)?l.md:(l.text||'')):''; }
function leSkip(l){ return !!(l&&(l.secOnly||!String(l.text||'').trim())); }
function leBase(s){ if(s._ly0) return s._ly0; if(!(state.lyricEdits||{})[s.id]) return s.lyrics||[]; return (s.lyrics||[]).map(l=>l.orig!=null?{t:l.t,text:String(l.orig),sec:l.sec}:l); }
function leInit(s){ const cur=s.lyrics||[], base=leBase(s), same=base===cur, used=new Set();
  const origFor=(l,i)=>{ if(same) return leRaw(l); if(l.orig!=null) return String(l.orig); if(base.length===cur.length&&base[i]) return leRaw(base[i]);
    if(typeof l.t==='number'){ const j=base.findIndex((b,k)=>!used.has(k)&&typeof b.t==='number'&&Math.abs(b.t-l.t)<0.02); if(j>=0){ used.add(j); return leRaw(base[j]); } } return null; };
  _le={id:s.id, base, rows:cur.map((l,i)=>({l, raw:leRaw(l), o:origFor(l,i), skip:leSkip(l)})), hist:[], hi:-1, sel:new Set(), k:null, kt:0}; lePush(null); }
function leSnap(){ return _le.rows.map(r=>Object.assign({},r)); }
function lePush(kind){ const E=_le, n=performance.now();
  if(kind&&E.k===kind&&n-E.kt<1200&&E.hi>0&&E.hi===E.hist.length-1) E.hist[E.hi]=leSnap();
  else { E.hist=E.hist.slice(0,E.hi+1); E.hist.push(leSnap()); if(E.hist.length>150) E.hist.shift(); E.hi=E.hist.length-1; }
  E.k=kind; E.kt=n; }
function leCh(r){ return r.o!=null&&r.raw!==r.o; }
function leDiffBase(){ const E=_le; return E.rows.length!==E.base.length||E.rows.some((r,i)=>r.raw!==leRaw(E.base[i])); }
function leDirty(){ const E=_le, a=E&&E.hist[0]; if(!a) return false; return a.length!==E.rows.length||E.rows.some((r,i)=>r.raw!==a[i].raw); }
function leRowHtml(r,i){ if(r.skip) return ''; const ch=leCh(r), on=_le.sel.has(i);
  return `<div class="le-row${ch?' is-ch':''}${on?' is-sel':''}" data-le-row="${i}"><button type="button" data-le="sel" data-i="${i}" data-testid="lyric-edit-select-${i}" aria-pressed="${on}" aria-label="Select line ${i+1}" class="le-n press"><span>${i+1}</span><i data-lucide="check"></i></button><input data-li="${i}" data-t="${r.l.t}" value="${esc(r.raw)}" enterkeyhint="next" autocomplete="off" data-testid="lyric-edit-input-${i}" class="le-in" placeholder="${r.o!=null?'Press Enter to bring it back':'Empty line'}"><button type="button" data-le="rev" data-i="${i}" data-testid="lyric-edit-revert-${i}" aria-label="Revert line ${i+1} to the original" title="Back to the original" class="le-rev press"${ch?'':' tabindex="-1"'}><i data-lucide="rotate-ccw"></i></button></div>`; }
function leSelBarHtml(){ const n=_le?_le.sel.size:0; if(!n) return ''; const can=[..._le.sel].some(i=>_le.rows[i]&&leCh(_le.rows[i]));
  return `<div class="le-selbar" data-testid="lyric-edit-selbar"><span class="le-sc"><b data-testid="lyric-edit-sel-count">${n}</b> selected</span><button type="button" data-le="rev-sel" data-testid="lyrics-revert-selected-button" class="le-sb is-go press"${can?'':' disabled'}><i data-lucide="rotate-ccw"></i>Revert selected</button><button type="button" data-le="sel-clear" data-testid="lyrics-sel-clear" aria-label="Clear selection" class="le-sb is-x press"><i data-lucide="x"></i></button></div>`; }
function leBarHtml(s){ const E=_le, ib=(a,ic,lab,tid,en)=>`<button type="button" data-le="${a}" data-testid="${tid}" aria-label="${lab}" title="${lab}" class="le-tb press"${en?'':' disabled'}><i data-lucide="${ic}"></i></button>`;
  return `<div class="le-bar" data-testid="lyric-edit-bar"><button data-act="lyrics-report" data-id="${s.id}" aria-label="Report lyrics" title="Report lyrics" data-testid="lyrics-report-button" class="le-tb press"><i data-lucide="flag"></i></button><span class="le-bt">Editing lyrics</span>
    ${ib('undo','undo-2','Undo','lyrics-undo-button',E.hi>0)}${ib('redo','redo-2','Redo','lyrics-redo-button',E.hi<E.hist.length-1)}<button type="button" data-le="rev-all" data-testid="lyrics-revert-all-button" title="Revert all to the original" class="le-ra press"${leDiffBase()?'':' disabled'}><i data-lucide="history"></i><span>Revert all</span></button></div>`; }
lyricsEditorHtml=function(s){ if(!_le||_le.id!==s.id) leInit(s); const rows=_le.rows.map(leRowHtml).join('');
  return `<div class="relative flex min-h-0 flex-1 flex-col" data-testid="lyric-editor">${leBarHtml(s)}<div id="np-lyrics-edit" class="le-list no-scrollbar min-h-0 flex-1 overflow-y-auto px-1 py-2${_le.sel.size?' has-sel':''}">${rows?rows+`<p class="le-tip" data-keep-hint><i data-lucide="corner-down-left"></i>Clear a line and press Enter to bring back the original</p>`:'<p class="py-10 text-center text-sm text-white/50">No lyrics available to edit.</p>'}</div>${leSelBarHtml()}</div>`; };
const _lth9z=lyricToolsHtml; lyricToolsHtml=function(s){ if(!state.lyricsEdit) _le=null; if(!state.lyricsEdit||state.lyricSelect||!s) return _lth9z.apply(this,arguments); if(!_le||_le.id!==s.id) leInit(s);
  return `<div class="flex shrink-0 items-center justify-end gap-1.5" data-testid="lyric-edit-tools">
    <button data-act="lyrics-save" data-id="${s.id}" data-testid="lyrics-save-button" class="press inline-flex h-10 items-center gap-1.5 rounded-full bg-[color:var(--treesh-purple)] px-3.5 text-sm font-semibold text-white glow-purple"><i data-lucide="check" style="width:16px;height:16px"></i>Save</button>
    <button type="button" data-le="cancel" aria-label="Close editing" data-testid="lyrics-edit-cancel-button" class="le-tb press"><i data-lucide="x"></i></button></div>`; };
function leUi(){ const E=_le; if(!E) return; const set=(a,en)=>document.querySelectorAll(`[data-le="${a}"]`).forEach(b=>{ b.disabled=!en; }); set('undo',E.hi>0); set('redo',E.hi<E.hist.length-1); set('rev-all',leDiffBase()); }
function leRepaint(focus){ const s=SONG_BY_ID[_le&&_le.id]; const ed=document.querySelector('[data-testid="lyric-editor"]'); if(!s||!ed) return; const sc=document.getElementById('np-lyrics-edit'), y=sc?sc.scrollTop:0;
  ed.outerHTML=lyricsEditorHtml(s); icons(); const n=document.getElementById('np-lyrics-edit'); if(n) n.scrollTop=y;
  if(focus!=null){ const f=document.querySelector(`#np-lyrics-edit [data-li="${focus}"]`); if(f){ try{ f.focus({preventScroll:true}); const L=f.value.length; f.setSelectionRange(L,L); }catch(e){} } } leUi(); }
function leHist(d){ const E=_le; if(!E) return; const j=E.hi+d; if(j<0||j>=E.hist.length) return; E.hi=j; E.rows=E.hist[j].map(r=>Object.assign({},r)); E.k=null; E.sel.forEach(i=>{ if(!E.rows[i]) E.sel.delete(i); }); const a=document.activeElement, fi=a&&a.dataset&&a.dataset.li; leRepaint(fi!=null?+fi:null); }
function leRevert(idxs,focus){ const E=_le; let n=0; idxs.forEach(i=>{ const r=E.rows[i]; if(r&&r.o!=null&&r.raw!==r.o){ r.raw=r.o; n++; } }); if(n){ lePush(null); leRepaint(focus); } return n; }
function leRevertAll(){ const E=_le; E.rows=E.base.map(l=>({l, raw:leRaw(l), o:leRaw(l), skip:leSkip(l)})); E.sel.clear(); lePush(null); leRepaint(); toast('Back to the original lyrics','Tap Save to keep it, or Undo'); }
function leClose(){ state.lyricsEdit=false; _le=null; refreshLyricsRegion(); }
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-le]'); if(!b||!_le||b.disabled) return; const a=b.dataset.le, i=+b.dataset.i;
  if(a==='undo') leHist(-1); else if(a==='redo') leHist(1);
  else if(a==='rev-all') leRevertAll();
  else if(a==='rev'){ if(leRevert([i],i)) toast('Line restored','Back to the original'); }
  else if(a==='sel'){ if(_le.sel.has(i)) _le.sel.delete(i); else _le.sel.add(i); leRepaint(); }
  else if(a==='sel-clear'){ _le.sel.clear(); leRepaint(); }
  else if(a==='rev-sel'){ const n=leRevert([..._le.sel]); _le.sel.clear(); leRepaint(); if(n) toast(n+' line'+(n>1?'s':'')+' restored','Back to the original'); }
  else if(a==='cancel'){ if(leDirty()) openConfirm('Discard lyric changes?','Your unsaved lyric edits will be lost.',()=>{ closeModal(); leClose(); }); else leClose(); } });
document.addEventListener('input',e=>{ const t=e.target; if(!_le||!t||!t.matches||!t.matches('#np-lyrics-edit [data-li]')) return; const i=+t.dataset.li, r=_le.rows[i]; if(!r) return;
  r.raw=t.value; lePush('t'+i); const row=t.closest('.le-row'); if(row){ const ch=leCh(r); row.classList.toggle('is-ch',ch); const rv=row.querySelector('.le-rev'); if(rv) rv.tabIndex=ch?0:-1; } leUi(); });
document.addEventListener('keydown',e=>{ if(!_le||!state.lyricsEdit||e.isComposing) return; const t=e.target, inEd=!!(t&&t.closest&&t.closest('#np-lyrics-edit'));
  const k=(e.key||'').toLowerCase();
  if((e.metaKey||e.ctrlKey)&&!e.altKey&&(k==='z'||k==='y')){ if(!inEd) return; e.preventDefault(); if(k==='y'||e.shiftKey) leHist(1); else leHist(-1); return; }
  if(e.key==='Enter'&&inEd&&t.matches('[data-li]')){ e.preventDefault(); const i=+t.dataset.li, r=_le.rows[i];
    if(!t.value.trim()){ if(r&&r.o!=null&&r.o.trim()){ leRevert([i],i); toast('Line restored','Back to the original'); } else toast('Nothing to bring back','This line is new'); return; }
    const all=[...document.querySelectorAll('#np-lyrics-edit [data-li]')], nx=all[all.indexOf(t)+1]; if(nx){ nx.focus(); try{ const L=nx.value.length; nx.setSelectionRange(L,L); }catch(_){} } } });
saveLyricEdits=function(s){ if(!s) return; if(!_le||_le.id!==s.id){ leClose(); return; } const E=_le;
  if(!s._ly0&&!(state.lyricEdits||{})[s.id]) s._ly0=s.lyrics;
  const out=[]; E.rows.forEach(r=>{ const l=r.l; if(r.skip){ out.push(l); return; } const raw=String(r.raw||'').trim(), text=lsStripFmt(raw); if(!text) return;
    const line={t:l.t, text, sec:l.sec}; if(l.explain) line.explain=l.explain; if(l.note!=null) line.note=l.note; if(raw!==text) line.md=raw; if(l.words&&l.words.length&&text===String(l.text||'')) line.words=l.words.slice(); out.push(line); });
  if(!out.some(l=>String(l.text||'').trim())){ toast('Nothing to save','Add at least one lyric line'); return; }
  const base=E.base, same=out.length===base.length&&out.every((l,i)=>leRaw(l)===leRaw(base[i])&&l.t===base[i].t);
  if(same&&s._ly0){ delete state.lyricEdits[s.id]; s.lyrics=s._ly0; } else { s.lyrics=out; state.lyricEdits[s.id]=out; }
  const ok=LS.set('treesh_lyric_edits',state.lyricEdits); state.lyricsEdit=false; _le=null; try{ _karIdx=-1; }catch(e){}
  toast(ok?(same?'Original lyrics restored':'Lyrics saved on this device'):'Saved for now, but storage is full', ok?s.title:'Free up space in Settings so lyrics persist after closing');
  applyLyricEdits(); refreshLyricsRegion(); try{ renderView(); renderMini(); }catch(e){} };
const _lsSave9z=lsSave; lsSave=function(){ const s=state.ls&&SONG_BY_ID[state.ls.songId]; if(s&&!s._ly0&&!(state.lyricEdits||{})[s.id]) s._ly0=s.lyrics; return _lsSave9z.apply(this,arguments); };

/* ---------- P9z: Lyric Studio preview on phones looks like the Now Playing card (same as desktop) ---------- */
const _lsPv9z=lsPreviewHtml; lsPreviewHtml=function(){ const h=_lsPv9z.apply(this,arguments); if(window.innerWidth>=1024) return h;
  return lsNpPrevHtml(h).replace('class="lsx-prev lsnp dark-surface"','class="lsx-prev lsnp lsnp-pv dark-surface"').replace('id="ls-prev-body" ','')
    .replace('<div class="lsnp-seek"><span id="lsnp-fill"></span></div>','<div class="lsnp-hit" data-lsnp-seek data-testid="ls-pv-seek"><div class="lsnp-seek"><span id="lsnp-fill"></span></div></div>')
    .replace('<span class="lsnp-sk"><i data-lucide="skip-back" class="fill-current"></i></span>','<button type="button" data-act="ls-seek-back" data-testid="ls-pv-back" aria-label="Back 10 seconds" class="lsnp-sk press"><i data-lucide="skip-back" class="fill-current"></i></button>')
    .replace('<span class="lsnp-sk"><i data-lucide="skip-forward" class="fill-current"></i></span>','<button type="button" data-act="ls-seek-fwd" data-testid="ls-pv-fwd" aria-label="Forward 10 seconds" class="lsnp-sk press"><i data-lucide="skip-forward" class="fill-current"></i></button>'); };
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-lsnp-seek]'); if(!b) return; const d=_lsAudio.duration||(state.ls&&state.ls.dur)||0; if(!d||!isFinite(d)) return;
  const r=b.getBoundingClientRect(); try{ _lsAudio.currentTime=Math.max(0,Math.min(d-0.05,(e.clientX-r.left)/r.width*d)); }catch(_){} lsNpTick(true); try{ lsPreviewHighlight(true); }catch(_){} });
let _lsPvW=window.innerWidth>=1024; window.addEventListener('resize',()=>{ const w=window.innerWidth>=1024; if(w===_lsPvW) return; _lsPvW=w; const ls=state.ls; if(state.lsOpen&&ls&&ls.mode==='preview'&&!w){ try{ lsRenderBody(); }catch(e){} } });

/* ---------- P9z: status bubble sound effects (SFXMint, CC0). Search or pick a suggestion in the Status tab; anyone can tap the bubble to hear it ---------- */
const SFX_API='https://sfxmint.com/api/v1/search';
const SFX_PICKS=[['Funny','laugh','crowd-laughter-79','Audience laugh',6000],['Proud','hand','crowd-applause-43','Applause',4000],['Hyped','megaphone','crowd-cheer-43','Crowd cheer',4000],['Party','party-popper','growth-5ba6ac12fc25aee442ac90a2-part-1-v1','Party horn',1500],
  ['Winning','trophy','feedback-level-up-36','Level up',2000],['Magic','sparkles','owner-2026-09-22-short-magic-sparkle','Sparkle',1300],['In love','heart','horror-heartbeat-36','Heartbeat',6000],['Cute','baby','growth-ee2f3d4f6555024b385cec30-retry','Baby laugh',2500],
  ['Shook','zap','crowd-gasp-43','Gasp',3000],['Plot twist','disc-3','transition-record-scratch-05','Record scratch',1000],['Suspense','drum','growth-d76661002fe6a87346f11a90-part-1-v1','Drum roll',3500],['Joke','drum','acoustic-drum-kit-snare-rimshot-01','Ba-dum-tss',1500],
  ['Awkward','bug','animal-insect-08','Crickets',3000],['Sad','frown','feedback-fail-37','Sad trombone',2000],['Wrong','octagon-x','feedback-buzzer-11','Buzzer',2000],['Over it','cloud','growth-8cbd8b99dc6b25fb627e67b8-part-1-v2','Sigh',2500],
  ['Sleepy','moon','yawn-02','Yawn',2500],['Mischief','ghost','growth-bfe32e67e3de9719a78a5544-part-1-v2','Evil laugh',2000],['Money','badge-dollar-sign','office-cash-register-05','Ka-ching',2000],['Silly','activity','cartoon-boing-19','Boing',2000]];
const SFX_URL=/^https:\/\/sfxmint\.com\/dl\/[a-z0-9-]{1,120}\.(mp3|ogg|wav)$/;
function sfxNorm(v){ if(!v||typeof v!=='object') return null; const u=String(v.u||''); if(!SFX_URL.test(u)) return null; return {id:String(v.id||'').replace(/[^a-z0-9-]/g,'').slice(0,120), t:spTxt(v.t||'Sound',60)||'Sound', u, ms:Math.max(0,Math.min(30000,+v.ms||0))}; }
function sfxPick(i){ const p=SFX_PICKS[i]; return p&&{id:p[2],t:p[3],u:'https://sfxmint.com/dl/'+p[2]+'.mp3',ms:p[4]}; }
const _spNorm9z=spNorm; spNorm=function(s){ const o=_spNorm9z.apply(this,arguments); o.mood.snd=sfxNorm(s&&s.mood&&s.mood.snd); return o; };
function sfxDur(ms){ return ms?(ms<10000?(Math.round(ms/100)/10)+'s':Math.round(ms/1000)+'s'):''; }
/* one shared player, capped at 10 seconds */
const _sfx={a:null,u:'',t:0,q:'',st:'',res:[],open:false,req:0};
function sfxStop(){ const a=_sfx.a; if(a){ try{ a.pause(); }catch(e){} } clearTimeout(_sfx.t); _sfx.u=''; sfxMark(); }
function sfxPlay(u){ if(!SFX_URL.test(u||'')) return; if(_sfx.u===u&&_sfx.a&&!_sfx.a.paused){ sfxStop(); return; } sfxStop();
  if(!_sfx.a){ _sfx.a=new Audio(); _sfx.a.preload='auto'; _sfx.a.addEventListener('ended',()=>{ _sfx.u=''; sfxMark(); }); _sfx.a.addEventListener('error',()=>{ if(_sfx.u){ _sfx.u=''; sfxMark(); toast('Couldn\u2019t play that sound','Check your connection'); } }); }
  const a=_sfx.a; a.src=u; a.volume=.9; _sfx.u=u; sfxMark(); const p=a.play(); if(p&&p.catch) p.catch(()=>{ _sfx.u=''; sfxMark(); }); _sfx.t=setTimeout(sfxStop,10000); }
function sfxMark(){ document.querySelectorAll('[data-sfx-u]').forEach(el=>{ const on=!!_sfx.u&&el.getAttribute('data-sfx-u')===_sfx.u; el.classList.toggle('is-playing',on); const ic=el.querySelector('[data-sfx-ic]'); if(ic){ const want=on?'pause':'play'; if(ic.getAttribute('data-sfx-ic')!==want){ ic.setAttribute('data-sfx-ic',want); ic.innerHTML=`<i data-lucide="${want}" class="fill-current"></i>`; icons(); } } }); }
/* bubble: speaker badge, tap to play (other people's bubbles play on tap anywhere) */
const _sbxH9z=sbxHtml; sbxHtml=function(S,mode){ const h=_sbxH9z.apply(this,arguments), snd=S&&S.mood&&sfxNorm(S.mood.snd); if(!h||!snd||h.indexOf('is-ghost')>=0) return h;
  const tid=mode==='me'?'profile-status-bubble':mode==='them'?'uprof-status-bubble':'editor-status-preview-bubble', lab='Play status sound: '+esc(snd.t);
  const badge=`<span class="sbub-snd" data-act="sbx-play" data-u="${esc(snd.u)}" role="button" tabindex="0" aria-label="${lab}" data-testid="${tid}-sound"><i data-lucide="volume-2"></i><b class="sbub-wv" aria-hidden="true"><i></i><i></i><i></i></b></span>`;
  let out=h.replace('</span><span class="sbub-tail"',badge+'</span><span class="sbub-tail"').replace('class="sbub ','data-sfx-u="'+esc(snd.u)+'" class="sbub has-snd ');
  if(mode==='them') out=out.replace(/^<div role="note"/,`<button type="button" data-act="sbx-play" data-u="${esc(snd.u)}" aria-label="${lab}"`).replace(/<\/div>$/,'</button>');
  return out; };
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-act="sbx-play"]'); if(!b) return; e.stopPropagation(); e.preventDefault(); sfxPlay(b.getAttribute('data-u')); },true);
document.addEventListener('keydown',e=>{ if(e.key!=='Enter'&&e.key!==' ') return; const b=e.target&&e.target.classList&&e.target.classList.contains('sbub-snd')?e.target:null; if(!b) return; e.preventDefault(); e.stopPropagation(); sfxPlay(b.getAttribute('data-u')); },true);
/* editor: Sound section + results sheet inside the Status tab */
function sfxRowHtml(x,i,pre,cur){ const on=!!cur&&cur.u===x.u;
  return `<div class="sfx-row${on?' is-on':''}" data-sfx-u="${esc(x.u)}" data-testid="${pre}-${i}"><button type="button" data-sfx="play" data-u="${esc(x.u)}" aria-label="Preview ${esc(x.t)}" data-testid="${pre}-play-${i}" class="sfx-pp press"><span data-sfx-ic="play"><i data-lucide="play" class="fill-current"></i></span></button><span class="sfx-rt"><b class="clamp-1">${esc(x.t)}</b><small>${[sfxDur(x.ms),(x.tags||[]).slice(0,3).join(' \u00b7 ')].filter(Boolean).join(' \u00b7 ')}</small></span><button type="button" data-sfx="use" data-i="${i}" data-src="${pre}" aria-pressed="${on}" data-testid="${pre}-use-${i}" class="sfx-use press">${on?'<i data-lucide="check"></i>Added':'Use'}</button></div>`; }
function sfxSheetHtml(){ if(!_sfx.open) return ''; const cur=state._spDraft&&sfxNorm(state._spDraft.mood.snd); let body;
  if(_sfx.st==='load') body=`<div class="sfx-load" data-testid="sfx-loading">${'<span class="sfx-sk"></span>'.repeat(5)}</div>`;
  else if(_sfx.st==='err') body=`<div class="sfx-empty" data-testid="sfx-error"><i data-lucide="wifi-off"></i><p>Couldn\u2019t reach SFXMint. Check your connection and try again.</p><button type="button" data-sfx="retry" class="sp-ed-btn press">Try again</button></div>`;
  else if(!_sfx.res.length) body=`<div class="sfx-empty" data-testid="sfx-empty"><i data-lucide="search-x"></i><p>No sounds for \u201c${esc(_sfx.q)}\u201d. Try fewer or simpler words.</p></div>`;
  else body=`<div class="sfx-list soft-scroll" data-testid="sfx-results">${_sfx.res.map((x,i)=>sfxRowHtml(x,i,'sfx-result',cur)).join('')}</div>`;
  return `<div class="sfx-sheet" role="dialog" aria-label="Sound results" data-testid="sfx-modal"><div class="sfx-sh"><span class="sfx-sh-ic"><i data-lucide="audio-lines"></i></span><div class="min-w-0 flex-1"><p class="sfx-k">Sounds from SFXMint</p><h4 class="clamp-1">\u201c${esc(_sfx.q)}\u201d</h4></div><button type="button" data-sfx="close" aria-label="Close sounds" data-testid="sfx-modal-close" class="sp-ed-x press"><i data-lucide="x"></i></button></div>${body}<p class="sfx-lic"><i data-lucide="badge-check"></i>Free CC0 sounds by SFXMint</p></div>`; }
function sfxSecHtml(S){ const cur=sfxNorm(S.mood.snd);
  const picks=SFX_PICKS.map((p,i)=>{ const x=sfxPick(i), on=!!cur&&cur.u===x.u; return `<button type="button" data-sfx="pick" data-i="${i}" data-sfx-u="${esc(x.u)}" aria-pressed="${on}" data-testid="editor-status-sfx-pick-${i}" class="sfx-chip press${on?' on':''}"><i data-lucide="${p[1]}"></i><span><small>${p[0]}</small><b>${p[3]}</b></span></button>`; }).join('');
  return `<p class="sp-k2" id="sfx-sec">Sound</p>
    ${cur?`<div class="sfx-cur" data-sfx-u="${esc(cur.u)}" data-testid="editor-status-sfx-current"><button type="button" data-sfx="play" data-u="${esc(cur.u)}" aria-label="Play your status sound" data-testid="editor-status-sfx-current-play" class="sfx-pp is-big press"><span data-sfx-ic="play"><i data-lucide="play" class="fill-current"></i></span></button><span class="sfx-rt"><small>On your bubble</small><b class="clamp-1" data-testid="editor-status-sfx-current-title">${esc(cur.t)}</b></span><button type="button" data-sfx="remove" data-testid="editor-status-sfx-remove" aria-label="Remove sound" class="sfx-x press"><i data-lucide="trash-2"></i></button></div>`:`<p class="sfx-note">Add a sound people hear when they tap your bubble.</p>`}
    <form class="sfx-search" data-sfx-form data-testid="editor-status-sfx-form"><i data-lucide="search"></i><input type="search" maxlength="60" enterkeyhint="search" value="${esc(_sfx.q)}" placeholder="Search sounds, like laughing audience" data-testid="editor-status-sfx-search" aria-label="Search sound effects"><button type="submit" data-testid="editor-status-sfx-search-btn" class="sfx-go press">Search</button></form>
    <p class="sfx-sub">Pick a vibe</p><div class="sfx-chips" data-testid="editor-status-sfx-picks">${picks}</div>`; }
const _sbxEB9z=sbxEdBody; sbxEdBody=function(){ const h=_sbxEB9z.apply(this,arguments), S=state._spDraft; const k='<p class="sp-k2">Effect</p>'; const i=h.indexOf(k); if(i<0) return h+sfxSecHtml(S);
  const j=h.indexOf('</div>',i)+6; return h.slice(0,j)+sfxSecHtml(S)+h.slice(j); };
function sfxSheetPaint(){ const ed=document.getElementById('sp-ed'); if(!ed) return; let w=ed.querySelector('.sfx-sheet'); const html=sfxSheetHtml(); if(!html){ if(w) w.remove(); return; } if(w) w.outerHTML=html; else ed.insertAdjacentHTML('beforeend',html); icons(); sfxMark(); }
const _spEP9z=spEdPaint; spEdPaint=function(){ const r=_spEP9z.apply(this,arguments); if(_spEd&&_spEd.tab==='status'&&_sfx.open) sfxSheetPaint(); else if(!(_spEd&&_spEd.tab==='status')) _sfx.open=false; sfxMark(); return r; };
async function sfxSearch(q){ q=String(q||'').trim().slice(0,60); if(!q){ toast('Type what you want to hear','Like laughing audience or applause'); return; } _sfx.q=q; _sfx.open=true; _sfx.st='load'; _sfx.res=[]; sfxSheetPaint(); const id=++_sfx.req;
  try{ const r=await fetch(SFX_API+'?q='+encodeURIComponent(q)+'&format=mp3&response=structured&limit=15'); if(!r.ok) throw new Error('http'); const d=await r.json(); if(id!==_sfx.req) return;
    const seen=new Set(); _sfx.res=(d.candidates||[]).concat(d.near_matches||[]).filter(c=>c&&c.slug&&!seen.has(c.slug)&&seen.add(c.slug)).slice(0,15).map(c=>({id:c.slug,t:c.title||c.slug,u:c.mp3_url||('https://sfxmint.com/dl/'+c.slug+'.mp3'),ms:c.duration_ms||0,tags:c.tags||[]})).filter(x=>SFX_URL.test(x.u)); _sfx.st=''; }
  catch(e){ if(id!==_sfx.req) return; _sfx.st='err'; } sfxSheetPaint(); }
function sfxSet(x){ const S=state._spDraft; if(!S) return; S.mood.snd=x?sfxNorm(x):null; const body=document.querySelector('#sp-ed .sp-ed-body'), y=body?body.scrollTop:0; spEdPaint(); const nb=document.querySelector('#sp-ed .sp-ed-body'); if(nb) nb.scrollTop=y; sbxLive(); }
document.addEventListener('submit',e=>{ const f=e.target; if(!f||!f.matches||!f.matches('[data-sfx-form]')) return; e.preventDefault(); const inp=f.querySelector('input'); try{ inp.blur(); }catch(_){} sfxSearch(inp&&inp.value); });
document.addEventListener('input',e=>{ const t=e.target; if(t&&t.matches&&t.matches('[data-sfx-form] input')) _sfx.q=t.value.slice(0,60); });
document.addEventListener('click',e=>{ const b=e.target&&e.target.closest&&e.target.closest('[data-sfx]'); if(!b) return; const a=b.dataset.sfx, i=+b.dataset.i;
  if(a==='play') sfxPlay(b.getAttribute('data-u'));
  else if(a==='pick'){ const x=sfxPick(i); if(!x) return; const cur=state._spDraft&&sfxNorm(state._spDraft.mood.snd); if(cur&&cur.u===x.u){ sfxPlay(x.u); return; } sfxSet(x); sfxPlay(x.u); toast('Sound added',x.t+' plays when someone taps your bubble'); }
  else if(a==='use'){ const x=_sfx.res[i]; if(!x) return; sfxSet(x); _sfx.open=false; sfxSheetPaint(); toast('Sound added',x.t+' plays when someone taps your bubble'); }
  else if(a==='remove'){ sfxStop(); sfxSet(null); toast('Sound removed'); }
  else if(a==='close'){ _sfx.open=false; sfxStop(); sfxSheetPaint(); }
  else if(a==='retry') sfxSearch(_sfx.q); });
const _spEC9z=spEdClose; spEdClose=function(){ _sfx.open=false; sfxStop(); return _spEC9z.apply(this,arguments); };
