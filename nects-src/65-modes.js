/* ===== Game rendering + extra modes ===== */
function hudSub(){
  const c=G.cfg;
  if(c.zen) return `${c.grid.replace('x','×')} · no timer, no bot`;
  if(c.survival) return `Wave ${G.wave} · ${'♥'.repeat(Math.max(0,G.lives))}${'♡'.repeat(Math.max(0,3-G.lives))}`;
  const d=c.pass?'Pass & Play':c.daily?todayKey():c.mirror?'Mirror bot':DIFFS[c.diff].name;
  return `Round ${G.round} · First to ${c.rounds} · ${d} · ${c.grid.replace('x','×')}`;
}
function dotsHtml(won,total){ if(!total) return ''; return `<span class="dots">${[...Array(total)].map((_,i)=>`<i class="${i<won?'on':''}"></i>`).join('')}</span>`; }
function gsHud(lead,title,sub,extra){
  return `<div class="gs-hud" data-testid="game-hud">${lead}<div class="gs-title"><b data-testid="game-mode-title">${title}</b><small data-testid="game-round-info">${sub}</small></div>${extra||''}
    <span class="star-pill" data-testid="game-starlites-pill">${ic('sparkles',16)}<span class="num" data-star-count data-testid="game-starlites-counter">${fmt(Treesh.balance())}</span></span></div>`;
}
const pauseBtn=()=>`<button class="btn btn-ghost btn-icon" data-act="pause" data-testid="game-pause-button" aria-label="Pause">${ic('pause',18)}</button>`;
function renderGame(){
  const c=G.cfg, m=MODE_BY_ID[c.mode];
  if(c.pass) return renderPass();
  const hud=gsHud(pauseBtn(),m.name,hudSub(),c.zen?`<button class="btn btn-ghost btn-sm" data-act="zen-finish" data-testid="zen-finish-button">${ic('check',14)}Finish</button>`:'');
  const hearts=c.survival?`<small style="color:var(--rose);font-weight:800;letter-spacing:2px" data-testid="survival-lives">${'♥'.repeat(Math.max(0,G.lives))}${'♡'.repeat(Math.max(0,3-G.lives))}</small>`:'';
  const you=`<div class="pcard you" data-testid="player-card"><div class="who">${avatarHtml('sm')}<div style="min-width:0"><b>${esc(Treesh.name())}</b><small id="score-p" data-testid="player-score">${c.zen?'Zen session':fmt(G.pScore)+' pts'}</small></div></div>${c.zen?`<span class="big" data-testid="zen-lines">${G.zenLines}</span>`:dotsHtml(G.pRounds,c.rounds)}${hearts}</div>`;
  const right=c.bot?`<div class="pcard opp-card" data-testid="opponent-card"><div class="who"><span class="avatar sm bot">${ic('bot',14)}</span><div style="min-width:0"><b data-testid="opponent-name">${esc(G.botName)}</b><small id="opp-progress"></small></div></div>${dotsHtml(G.oRounds,c.rounds)}<div class="board mini" id="board-o" style="--cols:${c.cols}" data-testid="game-board-opponent"></div></div>`
    :`<div class="pcard opp-card"><div class="who"><div><b>Starlites</b><small>today, max 15</small></div></div><span class="num" style="font-size:22px">${S.zenDay.date===todayKey()?S.zenDay.earned:0}/15</span></div>`;
  const orb=`<div class="orb-col">${c.zen?'':`<span class="vs-pill" data-testid="round-score">${G.pRounds} : ${G.oRounds}</span>`}<div class="orb" data-testid="caller-panel"><span class="call-emoji" id="call-emoji" data-testid="caller-emoji-display">${G.call||'·'}</span></div>${c.blitz?`<div class="timer"><i id="blitz-bar"></i></div>`:''}<p class="orb-status" id="call-status" data-testid="caller-status"></p></div>`;
  const tray=c.powerups&&S.owned.powerups.length?`<div class="tray-meta"><span>Powerups</span><span id="pu-left" data-testid="powerups-left"></span></div><div class="tray no-scrollbar" id="tray" data-testid="powerup-tray"></div>`:'';
  $('#screen').innerHTML=`<div class="gs" data-testid="game-screen">${hud}<div class="gs-main"><div class="gs-strip ${c.bot?'':'nobot'}">${you}${orb}${right}</div>
    <div class="gs-board"><div class="board" id="board-p" style="--cols:${c.cols}" data-testid="game-board-player"></div><p class="board-note" id="board-note"></p></div>
    <div class="gs-tray">${tray}</div></div></div>`;
  icons(); renderBoards(); renderCaller(); renderTray();
}
function renderPass(){
  const c=G.cfg, rot=S.settings.rotateP2;
  $('#screen').innerHTML=`<div class="gs" data-testid="pass-screen">${gsHud(pauseBtn(),'Pass & Play',hudSub())}
    <div class="pp-half ${rot?'flip':''}"><div class="pp-label" data-testid="p2-label">${ic('user',13)}${esc(G.p2Name)} ${dotsHtml(G.oRounds,c.rounds)}</div>
      <div class="gs-board"><div class="board p2" id="board-o" style="--cols:${c.cols}" data-testid="game-board-p2"></div></div></div>
    <div class="pp-mid"><div style="min-width:0"><p class="eyebrow" style="font-size:9px">Called</p><p class="orb-status" id="call-status" style="text-align:left" data-testid="caller-status"></p></div>
      <div class="orb"><span class="call-emoji" id="call-emoji" data-testid="caller-emoji-display">${G.call||'·'}</span></div>
      <div style="text-align:right"><span class="vs-pill" data-testid="round-score">${G.pRounds} : ${G.oRounds}</span></div></div>
    <div class="pp-half"><div class="gs-board"><div class="board" id="board-p" style="--cols:${c.cols}" data-testid="game-board-p1"></div></div>
      <div class="pp-label" data-testid="p1-label">${ic('user',13)}${esc(Treesh.name())} ${dotsHtml(G.pRounds,c.rounds)}</div></div></div>`;
  icons(); renderBoards(); renderCaller();
}
function tileHtml(side,i,B,opts){
  const e=B.board[i], cl=B.claimed[i], cls=['tile'];
  const fx=G.fx[side+i]; if(fx) cls.push(fx);
  if(cl) cls.push('claimed');
  if(G.win&&G.winSide===side&&G.win.includes(i)) cls.push('win');
  let show=true;
  if(side==='p'){
    if(G.fog&&!fogVisible(i)){ cls.push('fog'); show=false; }
    if(G.shineIdx===i) cls.push('shine');
    if(G.freeIdx===i) cls.push('freemark');
    if(G.hintIdx===i) cls.push('hint');
    if(!cl&&opts.lost.has(e)) cls.push('lost');
    if(G.pending&&G.pending.id!=='steal'&&!cl) cls.push('target');
    if(G.pending&&G.pending.first===i) cls.push('picked');
  }
  return `<button class="${cls.join(' ')}" data-tap="${side}" data-idx="${i}" data-testid="tile-${side}-${i}" aria-label="${show?e:'hidden tile'}">${show?e:''}</button>`;
}
function renderBoards(){
  if(!G||currentScreen!=='game') return;
  const now=Date.now();
  ['p','o'].forEach(side=>{
    const el=$('#board-'+side), B=G[side]; if(!el||!B) return;
    const other=side==='p'?G.o:G.p;
    const lost=new Set(); if(other&&!G.cfg.pass) other.board.forEach((e,i)=>{ if(other.claimed[i]) lost.add(e); });
    el.innerHTML=B.board.map((_,i)=>tileHtml(side,i,B,{lost})).join('')+(side==='p'&&G.inkUntil>now?`<div class="ink" data-testid="ink-overlay">Splatted!</div>`:'');
    if(side==='o') el.classList.toggle('stealable',!!(G.pending&&G.pending.id==='steal'));
  });
  G.fx={};
  const sp=G.cfg.zen?null:$('#score-p'), so=$('#score-o'); if(sp) sp.textContent=fmt(G.pScore)+' pts'; if(so) so.textContent=fmt(G.oScore)+' pts';
  const op=$('#opp-progress'); if(op&&G.o){ op.textContent=`${G.o.claimed.filter(Boolean).length} claimed${Date.now()<G.botFrozenUntil?' · blinded':''}${Date.now()<G.botWeakUntil?' · weakened':''}`; }
  const note=$('#board-note'); if(note) note.textContent=G.pending?`${POWERUPS[G.pending.id].name}: ${G.pending.id==='steal'?'tap a claimed tile on the bot\u2019s board':G.pending.id==='swap'?(G.pending.first==null?'tap the first tile':'tap the second tile'):'tap one of your tiles'} (tap the powerup again to cancel)`:G.fog&&G.fog.peekUntil>now?'Memorize your board...':'';
}
function renderCaller(animate){
  const el=$('#call-emoji'); if(!el||!G) return;
  el.textContent=G.call||'·'; const e2=$('#call-emoji-2'); if(e2) e2.textContent=G.call||'·';
  if(animate){ el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
  const st=$('#call-status'); if(!st) return;
  const s=G.callState; let t='';
  if(G.lastEvent) t=`${G.lastEvent.icon} ${G.lastEvent.name}: ${G.lastEvent.desc}`;
  else if(s==='you') t='Got it!';
  else if(s==='p2') t=`${G.p2Name} got it!`;
  else if(s==='bot') t=`${G.botName} got it`;
  else if(s==='timeout') t='Too slow! It went to the bot';
  else if(G.call&&!G.locked){ t=G.cfg.pass?'First to tap it wins':canClaim(G.p,G.call)?'Tap it on your board':'Already yours. The bot can still take it'; }
  st.textContent=t;
}
function renderTray(){
  const el=$('#tray'); if(!el||!G) return;
  el.innerHTML=Object.keys(POWERUPS).filter(id=>S.owned.powerups.includes(id)).map(id=>{ const P=POWERUPS[id]; const ok=canUsePU(id)||(G.pending&&G.pending.id===id);
    return `<button class="pu ${ok?'':'used'} ${G.pending&&G.pending.id===id?'active':''}" data-act="pu" data-id="${id}" data-testid="powerup-button-${id}" title="${esc(P.desc)}"><span class="e">${P.icon}</span><small>${P.name}</small></button>`; }).join('');
  const pl=$('#pu-left'); if(pl) pl.textContent=`${puLeft()} left · shine ${3-G.shineUses}`;
}
function banner(title,sub,gained,good){
  const r=$('#banner-root');
  r.innerHTML=`<div class="banner"><div class="banner-card" data-testid="round-banner"><h3 style="color:${good?'#fff':'#fda4af'}">${esc(title)}</h3>${sub?`<p>${esc(sub)}</p>`:''}${gained?`<span class="gain">${ic('sparkles',16)}+${gained} Starlites</span>`:''}</div></div>`;
  icons(); later(()=>{ r.innerHTML=''; },1500);
}

/* Chaos events */
const CHAOS=[
  {id:'quake',name:'Board Quake',icon:'🌋',desc:'both boards got shuffled',run(){ shuffleUnclaimed(G.p); shuffleUnclaimed(G.o); }},
  {id:'nap',name:'Bot Nap',icon:'😴',desc:'the bot dozes off for 4s',run(){ G.botFrozenUntil=Date.now()+4000; }},
  {id:'surge',name:'Speed Surge',icon:'🏎️',desc:'the bot is faster for 2 calls',run(){ G.surge=2; }},
  {id:'flip',name:'Mirror Flip',icon:'🪞',desc:'both boards flipped',run(){ flipBoard(G.p); flipBoard(G.o); if(G.shineIdx!=null) G.shineIdx=null; G.freeIdx=null; }},
  {id:'gift',name:'Starlite Gift',icon:'🎁',desc:'a tile now pays 2x',run(){ const open=G.p.claimed.map((v,i)=>v?-1:i).filter(i=>i>=0); if(open.length) G.shineIdx=pick(open); }},
  {id:'freebie',name:'Freebie',icon:'🍀',desc:'',run(){ const who=Math.random()<.5?'p':'o', B=G[who]; const open=B.claimed.map((v,i)=>v?-1:i).filter(i=>i>=0); if(open.length) claim(who,pick(open)); this.desc=who==='p'?'you got a free tile':'the bot got a free tile'; }}
];
function chaosEvent(){
  const ev=pick(CHAOS); ev.run(); G.lastEvent=ev; G.chaosEvery=3+Math.floor(Math.random()*2);
  Sound.event(); toast(`${ev.icon} ${ev.name}`,ev.desc.charAt(0).toUpperCase()+ev.desc.slice(1));
  renderBoards();
  if(winLine('p')) return roundEnd('p');
  if(winLine('o')) return roundEnd('o');
}

/* ===== Puzzle mode ===== */
let PZ=null;
function puzzleMax(){ const ks=Object.keys(S.puzzle).map(Number); return ks.length?Math.max(...ks):0; }
function puzzleNextLevel(){ for(let l=1;l<=40;l++) if(!S.puzzle[l]) return Math.min(l,puzzleMax()+1); return 40; }
function puzzleLevelPicker(){
  const max=puzzleMax(); let h=`<p class="field-label">Level</p><div class="level-grid" data-testid="puzzle-level-grid">`;
  for(let l=1;l<=40;l++){ const s=S.puzzle[l]; h+=`<button class="${sheet.level===l?'on':''} ${s?'done':''}" data-act="sheet-set" data-k="level" data-v="${l}" data-testid="puzzle-level-${l}" ${l<=max+1?'':'disabled'}>${l}${s?`<small>${'★'.repeat(s)}</small>`:''}</button>`; }
  return h+'</div>';
}
function genPuzzle(L){
  const rng=mulberry32(L*7919+13), n=L<=10?3:L<=22?4:L<=34?5:6;
  const all=shuffle(ALL_EMOJIS,rng), board=all.slice(0,n*n), off=all.slice(n*n,n*n+8);
  const lines=buildLines(n,n,{h:true,v:true,d:true}), target=lines[Math.floor(rng()*lines.length)];
  const need=Math.min(n-1,2+Math.floor((L-1)/8));
  const open=shuffle(target,rng).slice(0,need), claimed=Array(n*n).fill(false);
  target.forEach(i=>{ if(!open.includes(i)) claimed[i]=true; });
  const others=shuffle([...Array(n*n).keys()].filter(i=>!target.includes(i)),rng); let added=0;
  for(const i of others){ if(added>=Math.floor(n*n*.22)) break; claimed[i]=true; if(lines.some(l=>l.every(j=>claimed[j]))) claimed[i]=false; else added++; }
  const unc=[...Array(n*n).keys()].filter(i=>!claimed[i]&&!open.includes(i));
  const deck=shuffle([...open.map(i=>board[i]),...shuffle(unc,rng).slice(0,Math.min(unc.length,1+Math.floor(L/6))).map(i=>board[i]),...off.slice(0,1+Math.floor(L/10))],rng);
  return {L,n,board,claimed,deck,used:[],moves:need,par:6+need*3,lines,start:0,done:false,fx:{}};
}
function startPuzzle(L){
  stopGame(); G=null; setScreen('puzzle'); PZ=genPuzzle(L); PZ.start=Date.now();
  renderPuzzle();
  T.pz=setInterval(()=>{ const el=$('#pz-time'); if(el&&PZ&&!PZ.done) el.textContent=Math.floor((Date.now()-PZ.start)/1000)+'s'; },250);
}
function renderPuzzle(){
  const z=PZ, win=z.lines.find(l=>l.every(i=>z.claimed[i]));
  const back=`<button class="btn btn-ghost btn-icon" data-act="menu" data-testid="puzzle-exit" aria-label="Back">${ic('arrow-left',18)}</button>`;
  const chips=`<span class="tag" data-testid="puzzle-moves">${ic('footprints',12)}${z.moves}</span><span class="tag" id="pz-time" data-testid="puzzle-timer">${Math.floor((Date.now()-z.start)/1000)}s</span>`;
  $('#screen').innerHTML=`<div class="gs" data-testid="puzzle-screen">${gsHud(back,`<span data-testid="puzzle-title">Puzzle ${z.L}</span>`,`${z.moves} ${z.moves===1?'move':'moves'} left · complete any line`,chips)}
    <div class="gs-board" style="flex:1"><div class="board" style="--cols:${z.n}" data-testid="puzzle-board">${z.board.map((e,i)=>`<div class="tile ${z.claimed[i]?'claimed':''} ${z.fx[i]||''} ${win&&win.includes(i)?'win':''}" data-testid="pz-tile-${i}">${e}</div>`).join('')}</div></div>
    <div class="tray-meta" style="margin:0"><span>Your call cards · tap to play</span></div>
    <div class="gs-deck" data-testid="puzzle-deck">${z.deck.map((e,i)=>`<button class="card ${z.used.includes(i)?'used':''}" style="animation-delay:${i*.04}s" data-act="pz-card" data-i="${i}" data-testid="puzzle-card-${i}">${e}</button>`).join('')}</div></div>`;
  z.fx={}; icons();
}
function playCard(i){
  const z=PZ; if(!z||z.done||z.used.includes(i)||z.moves<=0) return;
  const e=z.deck[i], bi=z.board.indexOf(e);
  z.used.push(i); z.moves--;
  if(bi<0){ Sound.wrong(); toast('Decoy card',`${e} isn\u2019t on the board`,'warn'); }
  else if(z.claimed[bi]){ Sound.wrong(); toast('Already claimed','That move was wasted','warn'); }
  else { z.claimed[bi]=true; z.fx[bi]='pop'; Sound.claim(); }
  renderPuzzle();
  const won=z.lines.some(l=>l.every(j=>z.claimed[j]));
  if(won||z.moves<=0){ z.done=true; clearInterval(T.pz); later(()=>puzzleResult(won),won?700:500); }
}
function puzzleResult(won){
  const z=PZ, secs=(Date.now()-z.start)/1000, bm=S.stats.byMode.puzzle=S.stats.byMode.puzzle||{played:0,wins:0,best:0};
  bm.played++; S.stats.matches++; S.stats.playMs+=secs*1000;
  let stars=0, gained=0;
  if(won){ stars=secs<=z.par?3:secs<=z.par*2?2:1; const old=S.puzzle[z.L]||0; bm.wins++; bm.best=Math.max(bm.best||0,z.L);
    gained=old?Math.max(0,(stars-old)*2):4+stars*2; if(stars>old) S.puzzle[z.L]=stars;
    if(gained) Treesh.earn(gained,`Nects · Puzzle ${z.L} (${stars}★)`); Sound.win(); }
  else Sound.lose();
  S.history.unshift({t:Date.now(),mode:'puzzle',sub:`Level ${z.L}`,detail:won?`${stars}★ in ${secs.toFixed(1)}s`:'Out of moves',result:won?'win':'loss',stars:gained}); if(S.history.length>30) S.history.length=30;
  saveNects(); checkBadges();
  openModal(`<div class="result-hero" data-testid="puzzle-result"><span class="big">${won?'🧩':'🫠'}</span><h2 class="font-display" data-testid="puzzle-result-title">${won?'Solved':'Out of moves'}</h2>
    ${won?`<p class="stars3" data-testid="puzzle-stars">${[1,2,3].map(s=>`<span class="${s<=stars?'':'off'}">★</span>`).join('')}</p><p class="text2">${secs.toFixed(1)}s · par ${z.par}s</p>`:`<p class="text2" style="margin-top:6px">Look for the cards that finish a line. Some are decoys.</p>`}</div>
    ${gained?`<div class="breakdown"><div class="tot"><span>Starlites to Treesh</span><span>+${gained}</span></div></div>`:''}
    <div style="display:flex;gap:10px;margin-top:20px"><button class="btn btn-ghost btn-lg" style="flex:1" data-act="menu" data-testid="puzzle-result-menu">${ic('house',17)}Menu</button>
      <button class="btn btn-ghost btn-lg" style="flex:1" data-act="pz-retry" data-testid="puzzle-retry">${ic('rotate-ccw',17)}Retry</button>
      ${won&&z.L<40?`<button class="btn btn-primary btn-lg" style="flex:1.3" data-act="pz-next" data-testid="puzzle-next">Next ${ic('arrow-right',17)}</button>`:''}</div>`,{testid:'puzzle-result-modal',lock:true});
}
