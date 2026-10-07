/* ===== Game rendering + extra modes ===== */
function hudSub(){
  const c=G.cfg;
  if(c.zen) return `${c.grid.replace('x','×')} · no timer, no bot`;
  if(c.survival) return `Wave ${G.wave} · ${'♥'.repeat(Math.max(0,G.lives))}${'♡'.repeat(Math.max(0,3-G.lives))}`;
  const d=c.pass?'Pass & Play':c.daily?todayKey():c.mirror?'Mirror bot':DIFFS[c.diff].name;
  return `Round ${G.round} · First to ${c.rounds} · ${d} · ${c.grid.replace('x','×')}`;
}
function dotsHtml(won,total){ if(!total) return ''; return `<span class="dots">${[...Array(total)].map((_,i)=>`<i class="${i<won?'on':''}"></i>`).join('')}</span>`; }
function renderGame(){
  const c=G.cfg, m=MODE_BY_ID[c.mode];
  const hud=`<div class="hud" data-testid="game-hud">
      <button class="btn btn-ghost btn-icon" data-act="pause" data-testid="game-pause-button" aria-label="Pause">${ic('pause',18)}</button>
      <div class="title"><b data-testid="game-mode-title">${m.name}</b><small data-testid="game-round-info">${hudSub()}</small></div>
      ${c.zen?`<button class="btn btn-ghost btn-sm" data-act="zen-finish" data-testid="zen-finish-button">${ic('check',15)}Finish</button>`:''}
      ${c.chaos||c.blitz||c.fog||c.gravity?`<span class="tag" style="--hue:${m.hue};color:${m.hue}">${ic(m.icon,12)}${m.tag}</span>`:''}
    </div>`;
  if(c.pass) return renderPass(hud);
  const solo=!c.bot;
  const score=c.zen?`<div class="scorebar glass" data-testid="zen-scorebar"><div class="side-score">${avatarHtml('sm')}<div><b>${esc(Treesh.name())}</b><small>Zen session</small></div></div>
      <div class="vs"><span data-testid="zen-lines">${G.zenLines}</span><small>LINES</small></div>
      <div class="side-score right"><div><b>${S.zenDay.date===todayKey()?S.zenDay.earned:0}/15</b><small>Starlites today</small></div></div></div>`
    :`<div class="scorebar glass" data-testid="game-scorebar">
      <div class="side-score">${avatarHtml('sm')}<div style="min-width:0"><b>${esc(Treesh.name())}</b><small id="score-p" data-testid="player-score">${fmt(G.pScore)} pts</small>${dotsHtml(G.pRounds,c.rounds)}</div></div>
      <div class="vs" data-testid="round-score">${G.pRounds}<span class="muted">:</span>${G.oRounds}<small>ROUNDS</small></div>
      <div class="side-score right"><span class="avatar sm" style="background:linear-gradient(135deg,#fb7185,#4c0519)">${ic('bot',15)}</span><div style="min-width:0"><b data-testid="opponent-name">${esc(G.botName)}</b><small id="score-o">${fmt(G.oScore)} pts</small>${dotsHtml(G.oRounds,c.rounds)}</div></div>
    </div>`;
  const opp=c.bot?`<div class="opp glass"><div class="opp-head"><span class="avatar sm" style="background:linear-gradient(135deg,#fb7185,#4c0519)">${ic('bot',14)}</span><div><b>${esc(G.botName)}</b><small id="opp-progress"></small></div></div>
      <div class="board mini" id="board-o" style="--cols:${c.cols}" data-testid="game-board-opponent"></div></div>`:'';
  const tray=c.powerups&&S.owned.powerups.length?`<div class="tray-box glass" style="border-radius:24px;padding:14px"><p class="panel-title"><span>Powerups</span><span id="pu-left" data-testid="powerups-left"></span></p><div class="tray no-scrollbar" id="tray" data-testid="powerup-tray"></div></div>`:'';
  $('#screen').innerHTML=`<div class="game ${solo?'solo':''}" data-testid="game-screen">${hud}${score}
    <div class="board-wrap"><div class="board" id="board-p" style="--cols:${c.cols}" data-testid="game-board-player"></div><p class="muted" id="board-note" style="font-size:12px;min-height:16px;text-align:center"></p></div>
    <div class="side-col">
      <div class="caller glass" data-testid="caller-panel" style="${opp?'':'grid-column:1/-1'}">
        <p class="lbl">${c.zen?'Find':'Called'}</p>
        <div><span class="call-emoji" id="call-emoji" data-testid="caller-emoji-display">${G.call||'·'}</span></div>
        <p class="status" id="call-status" data-testid="caller-status"></p>
        ${c.blitz?`<div class="timer"><i id="blitz-bar"></i></div>`:''}
      </div>${opp}${tray}
    </div></div>`;
  icons(); renderBoards(); renderCaller(); renderTray();
  if(G.round===1&&!G.scrolled){ G.scrolled=true; window.scrollTo(0,0); }
}
function renderPass(hud){
  const c=G.cfg, rot=S.settings.rotateP2;
  $('#screen').innerHTML=`<div class="pass" data-testid="pass-screen">${hud.replace('class="hud"','class="hud" style="width:100%"')}
    <div class="pname ${rot?'flip':''}" data-testid="p2-label">${ic('user',13)}${esc(G.p2Name)} ${dotsHtml(G.oRounds,c.rounds)}</div>
    <div class="board p2 ${rot?'flip':''}" id="board-o" style="--cols:${c.cols}" data-testid="game-board-p2"></div>
    <div class="mid glass" style="border-radius:24px;padding:10px 16px">
      <div style="flex:1"><p class="eyebrow">Called</p><p class="status text2" id="call-status" style="font-size:12.5px" data-testid="caller-status"></p></div>
      <span class="call-emoji" id="call-emoji" data-testid="caller-emoji-display">${G.call||'·'}</span>
      <div style="flex:1;text-align:right" class="vs" data-testid="round-score">${G.pRounds}<span class="muted">:</span>${G.oRounds}<small>ROUNDS</small></div>
      ${rot?`<span class="call-emoji flip" id="call-emoji-2" style="transform:rotate(180deg)" aria-hidden="true">${G.call||'·'}</span>`:''}
    </div>
    <div class="board" id="board-p" style="--cols:${c.cols}" data-testid="game-board-p1"></div>
    <div class="pname" data-testid="p1-label">${ic('user',13)}${esc(Treesh.name())} ${dotsHtml(G.pRounds,c.rounds)}</div></div>`;
  icons(); renderBoards(); renderCaller();
  if(G.round===1&&!G.scrolled){ G.scrolled=true; window.scrollTo(0,0); }
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
  const sp=$('#score-p'), so=$('#score-o'); if(sp) sp.textContent=fmt(G.pScore)+' pts'; if(so) so.textContent=fmt(G.oScore)+' pts';
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
  stopGame(); G=null; currentScreen='puzzle'; PZ=genPuzzle(L); PZ.start=Date.now();
  renderPuzzle(); window.scrollTo(0,0);
  T.pz=setInterval(()=>{ const el=$('#pz-time'); if(el&&PZ&&!PZ.done) el.textContent=Math.floor((Date.now()-PZ.start)/1000)+'s'; },250);
}
function renderPuzzle(){
  const z=PZ, win=z.lines.find(l=>l.every(i=>z.claimed[i]));
  $('#screen').innerHTML=`<div class="pass" style="gap:16px" data-testid="puzzle-screen">
    <div class="hud" style="width:100%"><button class="btn btn-ghost btn-icon" data-act="menu" data-testid="puzzle-exit" aria-label="Back">${ic('arrow-left',18)}</button>
      <div class="title"><b data-testid="puzzle-title">Puzzle ${z.L}</b><small>Complete any line using your cards</small></div>
      <span class="tag" data-testid="puzzle-moves">${ic('footprints',12)}${z.moves} ${z.moves===1?'move':'moves'}</span><span class="tag" id="pz-time" data-testid="puzzle-timer">${Math.floor((Date.now()-z.start)/1000)}s</span></div>
    <div class="board" style="--cols:${z.n};--size:min(92vw,48dvh,480px)" data-testid="puzzle-board">${z.board.map((e,i)=>`<div class="tile ${z.claimed[i]?'claimed':''} ${z.fx[i]||''} ${win&&win.includes(i)?'win':''}" data-testid="pz-tile-${i}">${e}</div>`).join('')}</div>
    <p class="eyebrow">Your call cards · tap to play</p>
    <div class="deck" data-testid="puzzle-deck">${z.deck.map((e,i)=>`<button class="card ${z.used.includes(i)?'used':''}" style="animation-delay:${i*.04}s" data-act="pz-card" data-i="${i}" data-testid="puzzle-card-${i}">${e}</button>`).join('')}</div></div>`;
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
