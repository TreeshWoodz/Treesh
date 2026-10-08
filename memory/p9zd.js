/* ---------- P9zd: start pages for What's Next? and This or That, plus back-button history for game overlays ---------- */
let _ovPopSkip=false, _ovNoPop=false;
function ovKind(){ const m=document.getElementById('modal'); if(!m) return null; if(m.querySelector('[data-game-root]')) return 'game'; if(m.querySelector('[data-tot-root]')) return 'tot'; if(m.querySelector('[data-wl-root]')) return 'wl'; return null; }
function ovHistPush(k){ try{ const st=history.state||{}, nx=Object.assign({},st,{trOv:k}); if(st.trOv) history.replaceState(nx,''); else history.pushState(nx,''); }catch(e){} }
function ovHistPop(){ if(_ovNoPop) return; try{ if(history.state&&history.state.trOv){ _ovPopSkip=true; history.back(); } }catch(e){} }
window.addEventListener('popstate',e=>{ if(_ovPopSkip){ _ovPopSkip=false; e.stopImmediatePropagation(); return; } const k=ovKind(); if(!k) return; e.stopImmediatePropagation();
  _ovNoPop=true; try{ if(k==='game') gameClose(); else if(k==='tot') totClose(); else if(state.wl&&state.wl.step===2){ state.wl.step=1; state.wl.dir='back'; wlRender(); ovHistPush('wl'); } else wlClose(); }finally{ _ovNoPop=false; } },true);
const _cm9zd=closeModal; closeModal=function(){ const k=ovKind(); if(k==='wl') state.wl=null; const r=_cm9zd.apply(this,arguments); if(k) ovHistPop(); return r; };

/* entry points: the Play buttons on the Games hub open the start pages */
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="game-tab"]'); if(!t) return; const v=t.dataset.val; if(v!=='lyrics'&&v!=='tot') return;
  e.preventDefault(); e.stopPropagation(); wlOpen(v==='lyrics'?'wn':'tot'); },true);
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="game-again"]'); const g=state.game; if(!t||!g||!g.group) return; e.preventDefault(); e.stopPropagation(); wcStartGroup(g.songIds); },true);
const _vg9zd=viewGame; viewGame=function(){ const tab=state.gameTab; if(tab==='lyrics'||tab==='tot'){ state.gameTab='games'; setTimeout(()=>{ if(!ovKind()) wlOpen(tab==='lyrics'?'wn':'tot'); },0); } return _vg9zd.apply(this,arguments); };

function wlOpen(game){ state.wl={game, step:1, dir:'in', mode:LS.get('treesh_wl_mode','solo')==='group'?'group':'solo', sel:[], q:'', genre:null}; wlRender(true); ovHistPush('wl'); syncScrollLock(); }
function wlClose(){ closeModal(); state.wl=null; syncScrollLock(); if(state.view==='game') renderView(); }
function wlBest(){ const b={}; ((state.gameStats||{}).recent||[]).forEach(r=>{ if(r&&r.id&&(b[r.id]||0)<r.score) b[r.id]=r.score; }); return b; }
function wlCover(s){ return s&&s.coverArt&&s.coverArt!==FALLBACK?s.coverArt:''; }
function wlTotOpts(){ const o=LS.get('treesh_tot_opts',null)||{}; return {skips:[1,3,5].includes(+o.skips)?+o.skips:3, len:[10,20,0].includes(+o.len)?+o.len:0}; }
function wlSeg(act,opts,cur){ return `<div class="wl-seg" role="group">${opts.map(([v,l])=>`<button type="button" data-act="${act}" data-val="${v}" data-testid="${act}-${v}" aria-pressed="${String(cur)===String(v)}" class="press${String(cur)===String(v)?' on':''}">${l}</button>`).join('')}</div>`; }

function wlTop(){ const w=state.wl, s2=w.step===2, lab=w.game==='wn'?['Songs','Setup']:['Vibe','Setup'];
  return `<header class="wl-top"><button type="button" data-act="${s2?'wl-back':'wl-exit'}" class="wl-ic press" data-testid="wl-${s2?'back':'exit'}" aria-label="${s2?'Back':'Exit'}"><i data-lucide="${s2?'chevron-left':'x'}"></i></button>
    <div class="wl-steps" data-testid="wl-steps"><span class="${s2?'is-done':'is-on'}"><b>${s2?'<i data-lucide="check"></i>':'1'}</b>${lab[0]}</span><i class="wl-steps-line"></i><span class="${s2?'is-on':''}"><b>2</b>${lab[1]}</span></div>
    ${s2?`<button type="button" data-act="wl-exit" class="wl-ic press" data-testid="wl-exit" aria-label="Exit"><i data-lucide="x"></i></button>`:`<span class="wl-stars" data-testid="wl-starlites"><i data-lucide="sparkles"></i><b data-star-count>${fmtNum(state.stars.points||0)}</b></span>`}</header>`; }

/* What's Next? step 1: songs */
function wlSongs(){ const q=(state.wl.q||'').toLowerCase().trim(); let s=gameEligibleSongs(); if(q) s=s.filter(x=>(x.title||'').toLowerCase().includes(q)||(x.artist||'').toLowerCase().includes(q)); return s; }
function wlSongCards(){ const w=state.wl, list=wlSongs(), best=wlBest(); if(!list.length) return `<div class="wl-empty" data-testid="wl-empty">${w.q?`No songs match \u201C${esc(w.q)}\u201D`:'No songs with lyrics yet.'}</div>`;
  return list.map((s,i)=>{ const n=w.sel.indexOf(s.id), b=best[s.id];
    return `<button type="button" data-act="wl-song" data-id="${esc(s.id)}" data-testid="wl-song-${esc(s.id)}" aria-pressed="${n>=0}" class="wl-song press${n>=0?' is-sel':''}" style="--i:${Math.min(i,18)}"><span class="wl-cov">${img(s.coverArt,'')}<span class="wl-tick">${n>=0?n+1:'<i data-lucide="plus"></i>'}</span>${b?`<span class="wl-best"><i data-lucide="trophy"></i>${b}</span>`:''}</span><span class="wl-st"><b class="clamp-1">${esc(s.title)}</b><small class="clamp-1">${esc(s.artist)}</small></span></button>`; }).join(''); }
function wlWnSongs(){ const w=state.wl, st=state.gameStats||{}, acc=st.rounds?Math.round(st.correct/st.rounds*100):0;
  return `<section class="wl-hero"><p class="wl-k"><i data-lucide="message-circle-more"></i>Lyric game</p><h1 class="wl-h1">What\u2019s Next?</h1><p class="wl-sub">The artist texts you a lyric. You text back the next line.</p>
      <div class="wl-stats" data-testid="wl-stats"><span><b>${st.bestScore||0}</b>High score</span><span><b>${st.games||0}</b>Games</span><span><b>${st.bestStreak||0}</b>Best streak</span><span><b>${acc}%</b>Accuracy</span></div></section>
    <div class="wl-mode" data-mode="${w.mode}" role="tablist" data-testid="wl-mode"><span class="wl-mode-pill"></span><button type="button" role="tab" data-act="wl-mode" data-val="solo" data-testid="wl-mode-solo" aria-selected="${w.mode==='solo'}"><i data-lucide="message-circle"></i>1-on-1</button><button type="button" role="tab" data-act="wl-mode" data-val="group" data-testid="wl-mode-group" aria-selected="${w.mode==='group'}"><i data-lucide="users"></i>Group chat</button></div>
    <p class="wl-tip" data-testid="wl-tip">${w.mode==='group'?'Tick 2 or more songs. Each artist takes a turn.':'Tap a song to set up your game.'}</p>
    <div class="wl-search"><i data-lucide="search"></i><input id="wl-q" type="search" value="${esc(w.q)}" placeholder="Search songs or artists" data-testid="wl-search" autocomplete="off" enterkeyhint="search"><button type="button" data-act="wl-random" data-testid="wl-random" class="press"><i data-lucide="dices"></i><span>Random</span></button></div>
    <div class="wl-grid" id="wl-grid" data-testid="wl-song-grid">${wlSongCards()}</div>`; }
function wlGroupBar(){ const w=state.wl, songs=w.sel.map(id=>SONG_BY_ID[id]).filter(Boolean), ok=songs.length>=2;
  return `<div class="wl-bar is-group" data-testid="wl-group-bar"><span class="wl-bar-av">${songs.slice(0,4).map(s=>`<span>${img(s.coverArt,'')}</span>`).join('')||'<span class="is-empty"><i data-lucide="users"></i></span>'}</span><span class="wl-bar-t"><b data-testid="wl-group-count">${songs.length} song${songs.length!==1?'s':''}</b><small>${ok?esc(wcGroupName(songs)):'Pick at least 2'}</small></span><button type="button" data-act="wl-next" data-testid="wl-next" class="wl-go press"${ok?'':' disabled'}>Next<i data-lucide="arrow-right"></i></button></div>`; }

/* What's Next? step 2: setup */
function wlWnSetup(){ const w=state.wl, o=state.gameOpts||{}, songs=w.sel.map(id=>SONG_BY_ID[id]).filter(Boolean), grp=songs.length>1, r=wcRounds(), best=wlBest();
  if(w._cap==null) w._cap=songs.reduce((a,s)=>a+wcPickTargets(wcLines(s),40).length,0);
  const s0=songs[0]||{}, hero=grp?`<div class="wl-fan" data-testid="wl-group-fan">${songs.slice(0,5).map((s,i,a)=>`<span style="--k:${i-(a.length-1)/2}">${img(s.coverArt,'')}</span>`).join('')}</div><div class="wl-sel-t"><p class="wl-k"><i data-lucide="users"></i>Group chat</p><h2 class="clamp-2" data-testid="wl-setup-title">${esc(wcGroupName(songs))}</h2><p>${songs.length} songs \u00B7 everyone takes turns</p></div>`
    :`<span class="wl-art" data-testid="wl-setup-cover">${img(s0.coverArt,'')}</span><div class="wl-sel-t"><p class="wl-k"><i data-lucide="message-circle"></i>1-on-1 with</p><h2 class="clamp-2" data-testid="wl-setup-title">${esc(s0.title||'')}</h2><p class="clamp-1">${esc(s0.artist||'')}</p>${best[s0.id]?`<span class="wl-chip"><i data-lucide="trophy"></i>Your best ${best[s0.id]}</span>`:''}</div>`;
  const tg=(k,t,d,ic)=>{ const on=!!o[k]; return `<button type="button" data-act="wl-opt" data-opt="${k}" data-testid="wl-opt-${k}" aria-pressed="${on}" class="wl-row press${on?' is-on':''}"><span class="wl-row-ic"><i data-lucide="${ic}"></i></span><span class="wl-row-t"><b>${t}</b><small>${d}</small></span><span class="wl-sw" aria-hidden="true"><i></i></span></button>`; };
  return `<section class="wl-sel${grp?' is-group':''}">${hero}</section>
    <section class="wl-panel" data-testid="wl-difficulty"><h3><i data-lucide="gauge"></i>Difficulty</h3>${tg('timer','Timed mode','15s per line \u00B7 speed bonus','timer')}${tg('exact','Exact lyrics','Match the line word for word','type')}</section>
    <section class="wl-panel" data-testid="wl-rounds"><h3><i data-lucide="repeat"></i>Rounds</h3>${wlSeg('wl-rounds',[3,5,8,10,15].map(n=>[n,n]),r)}${w._cap<r?`<p class="wl-note" data-testid="wl-rounds-note"><i data-lucide="info"></i>${grp?'These songs have':'This song has'} room for ${w._cap} round${w._cap!==1?'s':''} without repeats</p>`:''}</section>`; }

/* This or That */
function wlMosaic(songs){ const c=songs.filter(s=>wlCover(s)).slice(0,4); for(let i=0;c.length<4&&i<songs.length*2;i++) c.push(songs[i%songs.length]); return c.slice(0,4).map(s=>`<span>${img(s.coverArt,'')}</span>`).join(''); }
function wlTotPick(){ const tw=state.totWins||{wins:{}}, wins=tw.wins||{}, all=totEligible('');
  const gs=[{id:'',name:'All genres',songs:all}].concat(GENRES.map(g=>({id:g,name:g,songs:totEligible(g)})).filter(x=>x.songs.length>=2));
  const board=Object.keys(wins).map(id=>({s:SONG_BY_ID[id],w:wins[id]})).filter(x=>x.s).sort((a,b)=>b.w-a.w).slice(0,10);
  return `<section class="wl-hero"><p class="wl-k"><i data-lucide="swords"></i>Head to head</p><h1 class="wl-h1">This or That</h1><p class="wl-sub">Two clips face off. Keep your favorite and crown a champion.</p>
      <div class="wl-stats" data-testid="wl-stats"><span><b>${tw.plays||0}</b>Runs</span><span><b>${tw.bestStreak||0}</b>Best streak</span><span><b>${Object.keys(wins).length}</b>Tracks crowned</span></div></section>
    <p class="wl-tip">Pick a vibe to battle with.</p>
    <div class="wl-vibes" data-testid="wl-genre-grid">${gs.map((g,i)=>`<button type="button" data-act="wl-genre" data-val="${esc(g.id)}" data-testid="wl-genre-${i}" class="wl-vibe press" style="--i:${Math.min(i,18)}"><span class="wl-mosaic">${wlMosaic(g.songs)}</span><span class="wl-st"><b class="clamp-1">${esc(g.name)}</b><small>${g.songs.length} tracks</small></span></button>`).join('')}</div>
    ${board.length?`<section class="wl-board" data-testid="tot-leaderboard"><h3><i data-lucide="trophy"></i>Most loved</h3><div class="wl-board-row">${board.map((x,i)=>`<span class="wl-champ"><span class="wl-champ-c">${img(x.s.coverArt,'')}<em>${i+1}</em></span><b class="clamp-1">${esc(x.s.title)}</b><small>${x.w} win${x.w!==1?'s':''}</small></span>`).join('')}</div></section>`:''}`; }
function wlTotSetup(){ const w=state.wl, o=wlTotOpts(), pool=totEligible(w.genre||'');
  return `<section class="wl-sel"><span class="wl-art is-mosaic" data-testid="wl-setup-cover">${wlMosaic(pool)}</span><div class="wl-sel-t"><p class="wl-k"><i data-lucide="swords"></i>Battle pool</p><h2 class="clamp-2" data-testid="wl-setup-title">${esc(w.genre||'All genres')}</h2><p>${pool.length} tracks ready</p></div></section>
    <section class="wl-panel" data-testid="wl-skips"><h3><i data-lucide="skip-forward"></i>Skips allowed</h3>${wlSeg('wl-skips',[[1,'1'],[3,'3'],[5,'5']],o.skips)}<p class="wl-hintp">The run ends when you\u2019ve used them all.</p></section>
    <section class="wl-panel" data-testid="wl-length"><h3><i data-lucide="flag"></i>Run length</h3>${wlSeg('wl-len',[[10,'10'],[20,'20'],[0,'Endless']],o.len)}<p class="wl-hintp">Matchups before your champion is crowned.</p></section>`; }

function wlPlayBar(){ const w=state.wl, grp=w.game==='wn'&&w.sel.length>1; return `<div class="wl-bar is-play"><button type="button" data-act="wl-play" data-testid="wl-play" class="wl-play press"><i data-lucide="play" class="fill-current"></i>${w.game==='tot'?'Start battle':grp?'Play group chat':'Play'}</button></div>`; }
function wlRender(first){ const w=state.wl; if(!w) return; const m=$('#modal'); if(!m) return;
  const body=w.game==='wn'?(w.step===1?wlWnSongs():wlWnSetup()):(w.step===1?wlTotPick():wlTotSetup());
  const bar=w.step===2?wlPlayBar():(w.game==='wn'&&w.mode==='group'?wlGroupBar():'');
  const bgS=w.step===2?(w.game==='wn'?SONG_BY_ID[w.sel[0]]:totEligible(w.genre||'')[0]):null;
  m.innerHTML=`<div data-wl-root class="wl-root ${state.theme==='light'?'is-light':'dark-surface'}${first?' np-entering':''}" data-testid="${w.game}-launcher" data-step="${w.step}" data-game="${w.game}">
    <div class="wl-bg" aria-hidden="true">${bgS&&wlCover(bgS)?img(bgS.coverArt,'wl-bg-img'):''}<span class="wc-orb is-1"></span><span class="wc-orb is-2"></span><span class="wl-tint"></span></div>
    ${wlTop()}<div class="wl-scroll" id="wl-scroll"><div class="wl-body wl-go-${w.dir||'in'}${bar?' has-bar':''}">${body}</div></div>${bar}</div>`;
  w.dir='in'; icons(); wlBind(); }
function wlKeep(fn){ const sc=document.getElementById('wl-scroll'), y=sc?sc.scrollTop:0; fn(); const n=document.getElementById('wl-scroll'); if(n) n.scrollTop=y; }
function wlBind(){ const q=document.getElementById('wl-q'); if(q) q.addEventListener('input',()=>{ state.wl.q=q.value; const g=document.getElementById('wl-grid'); if(g){ g.innerHTML=wlSongCards(); icons(); } });
  const r=document.querySelector('[data-wl-root]'); if(r) r.addEventListener('animationend',e=>{ if(e.target===r) r.classList.remove('np-entering'); }); }
function wlStep(n,dir){ state.wl.step=n; state.wl.dir=dir; if(n===2) state.wl._cap=null; wlRender(); }
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act^="wl-"]'); const w=state.wl; if(!t||!w||!t.closest('[data-wl-root]')) return; const a=t.dataset.act, v=t.dataset.val;
  if(a==='wl-exit') wlClose();
  else if(a==='wl-back') wlStep(1,'back');
  else if(a==='wl-mode'){ if(w.mode===v) return; w.mode=v; w.sel=[]; LS.set('treesh_wl_mode',v); wlKeep(wlRender); }
  else if(a==='wl-song'){ const id=t.dataset.id; if(w.mode==='solo'){ w.sel=[id]; wlStep(2,'fwd'); return; }
    const i=w.sel.indexOf(id); if(i>=0) w.sel.splice(i,1); else if(w.sel.length>=8){ toast('Up to 8 songs in a group chat'); return; } else w.sel.push(id); wlKeep(wlRender); }
  else if(a==='wl-next'){ if(w.sel.length>=2) wlStep(2,'fwd'); }
  else if(a==='wl-random'){ const pool=wlSongs().slice(); if(!pool.length) return; for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    w.sel=pool.slice(0,w.mode==='group'?Math.min(3,pool.length):1).map(s=>s.id); if(w.mode==='group'&&w.sel.length<2){ wlKeep(wlRender); return; } wlStep(2,'fwd'); }
  else if(a==='wl-opt'){ const k=t.dataset.opt; state.gameOpts[k]=!state.gameOpts[k]; LS.set('treesh_game_opts',state.gameOpts); wlKeep(wlRender); }
  else if(a==='wl-rounds'){ state.gameOpts.rounds=+v; LS.set('treesh_game_opts',state.gameOpts); wlKeep(wlRender); }
  else if(a==='wl-genre'){ w.genre=v||null; wlStep(2,'fwd'); }
  else if(a==='wl-skips'||a==='wl-len'){ const o=wlTotOpts(); o[a==='wl-skips'?'skips':'len']=+v; LS.set('treesh_tot_opts',o); wlKeep(wlRender); }
  else if(a==='wl-play'){ if(w.game==='tot'){ state.totGenre=w.genre||''; state.wl=null; startTot(); return; }
    const ids=w.sel.slice(); state.wl=null; if(ids.length>1) wcStartGroup(ids); else if(ids[0]) startGame(ids[0]); } });

/* This or That honours the start-page settings */
const _st9zd=startTot; startTot=function(){ const o=wlTotOpts(); const r=_st9zd.apply(this,arguments); const g=state.tot; if(g){ g.maxSkips=o.skips; g.maxLen=o.len; renderTot(); ovHistPush('tot'); } return r; };
totSkip=function(){ const g=state.tot; if(!g||g.over) return; totStopPreview(); g.strikes++; if(g.strikes>=(g.maxSkips||3)){ totEnd(); return; } const next=totNextChallenger(); if(!next){ totEnd(); return; } g.b=next; renderTot(); };
const _tnc9zd=totNextChallenger; totNextChallenger=function(){ const g=state.tot; if(g&&g.maxLen&&g.matchups>=g.maxLen) return null; return _tnc9zd.apply(this,arguments); };
const _rt9zd=renderTot; renderTot=function(){ const r=_rt9zd.apply(this,arguments); const g=state.tot; if(!g||g.over) return r;
  const el=document.querySelector('#modal [data-testid="tot-strikes"]'), mx=g.maxSkips||3; if(el) el.innerHTML=Array.from({length:mx}).map((_,i)=>`<span class="h-2.5 w-2.5 rounded-full ${i<g.strikes?'bg-rose-400':'bg-white/15'}"></span>`).join('');
  if(g.maxLen){ const mu=[...document.querySelectorAll('#modal [data-tot-root] span')].find(x=>/^Matchup \d+$/.test(x.textContent.trim())); if(mu) mu.textContent=`Matchup ${g.matchups+1} / ${g.maxLen}`; }
  return r; };
