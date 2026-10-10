/* ===== Bingo mode ===== */
let BG=null;
const BINGO_SPEED={easy:3200,normal:2600,hard:2000,insane:1600,abysmal:1300};
const BINGO_BOT={easy:{miss:.25,shout:2600,count:2},normal:{miss:.15,shout:1800,count:3},hard:{miss:.07,shout:1100,count:3},insane:{miss:.03,shout:750,count:3},abysmal:{miss:0,shout:480,count:3}};
const BINGO_LINES=(()=>{ const L=buildLines(5,5,{h:true,v:true,d:true}); L.push([0,4,20,24]); return L; })();
function bingoLine(daub){ return BINGO_LINES.find(l=>l.every(i=>daub[i]))||null; }
function bingoToGo(daub){ return Math.min(...BINGO_LINES.map(l=>l.filter(i=>!daub[i]).length)); }
function bingoCard(pool){ const c=shuffle(pool).slice(0,24); c.splice(12,0,'★'); const d=Array(25).fill(false); d[12]=true; return {card:c,daub:d}; }

function startBingo(cfg){
  stopGame(); G=null; setScreen('bingo');
  const names=shuffle(BOT_NAMES[cfg.diff]||BOT_NAMES.normal);
  BG={cfg,round:0,pW:0,bots:[...Array(BINGO_BOT[cfg.diff].count)].map((_,i)=>({name:names[i%names.length],w:0})),
    earned:0,logKey:Date.now(),startT:Date.now(),paused:false,active:true,streak:0,best:0,falseUntil:0,misses:0};
  bingoRound(); window.scrollTo(0,0);
}
function bingoRound(){
  const b=BG; b.round++;
  const src=packEmojis(b.cfg.pack); b.pool=shuffle(src).slice(0,Math.min(src.length,60));
  Object.assign(b,bingoCard(b.pool));
  b.bots.forEach(bot=>{ Object.assign(bot,bingoCard(b.pool)); bot.shouting=false; });
  b.calls=shuffle(b.pool); b.called=[]; b.over=false; b.fx={}; b.win=null;
  renderBingo();
  T.next=setTimeout(bingoCall,1200);
}
function bingoCall(){
  const b=BG; if(!b||!b.active||b.over) return;
  if(b.paused){ b.needCall=true; return; }
  if(!b.calls.length){ toast('Out of balls','Fresh cards, same round'); b.round--; return later(bingoRound,600); }
  const e=b.calls.pop(); b.called.push(e); b.callAt=performance.now(); Sound.call();
  const cfgB=BINGO_BOT[b.cfg.diff];
  b.bots.forEach(bot=>{ const i=bot.card.indexOf(e); if(i<0||Math.random()<cfgB.miss) return;
    later(()=>{ if(!BG||BG!==b||b.over) return; bot.daub[i]=true; renderBingoBots();
      if(!bot.shouting&&bingoLine(bot.daub)){ bot.shouting=true; later(()=>{ if(BG===b&&!b.over&&!b.paused) bingoEnd(bot); else if(BG===b&&!b.over) bot.shouting=false; },cfgB.shout+Math.random()*600); }
    },400+Math.random()*900); });
  renderBingoCaller(true);
  T.next=setTimeout(bingoCall,BINGO_SPEED[b.cfg.diff]);
}
function bingoTap(i){
  const b=BG; if(!b||!b.active||b.over||b.paused||b.daub[i]) return;
  const e=b.card[i];
  if(!b.called.includes(e)){ b.misses++; const el=$(`#board-b [data-idx="${i}"]`); if(el){ el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); } Sound.wrong(); buzz(30); return; }
  if(e===b.called[b.called.length-1]){ const rt=performance.now()-b.callAt; S.stats.taps++; S.stats.tapMs+=rt; if(!S.stats.fastestMs||rt<S.stats.fastestMs) S.stats.fastestMs=Math.round(rt); }
  b.daub[i]=true; b.fx[i]='pop'; Sound.claim(); buzz(12); renderBingoBoard();
}
function bingoShout(){
  const b=BG; if(!b||!b.active||b.over||b.paused) return;
  if(Date.now()<b.falseUntil) return toast('Cooling down','Wait a moment after a false Bingo','warn');
  if(bingoLine(b.daub)) return bingoEnd(null);
  b.falseUntil=Date.now()+4000; Sound.wrong(); buzz(60);
  toast('False Bingo!','No full line yet. Shout again in 4s','warn'); renderBingoCaller();
}
function bingoEnd(bot){
  const b=BG; b.over=true; clearTimers();
  let gained=0;
  if(!bot){ b.pW++; b.streak++; b.best=Math.max(b.best,b.streak); S.stats.roundsWon++; S.stats.bestStreak=Math.max(S.stats.bestStreak,b.streak); b.win=bingoLine(b.daub);
    gained=Math.max(1,Math.round(5*DIFFS[b.cfg.diff].mult+Math.min(b.streak-1,10))); b.earned+=gained; Treesh.earn(gained,`Nects · Bingo (${DIFFS[b.cfg.diff].name})`,b.logKey); Sound.win(); }
  else { bot.w++; b.streak=0; S.stats.roundsLost++; Sound.lose(); }
  saveNects(); renderBingo();
  banner(bot?`${bot.name} shouts Bingo!`:'BINGO!',bot?'They finished a line first':`${b.called.length} balls called`,gained,!bot);
  later(()=>{ if(!BG||BG!==b) return; const top=Math.max(b.pW,...b.bots.map(x=>x.w)); if(top>=b.cfg.rounds) bingoMatchEnd(false); else bingoRound(); },2000);
}
function bingoMatchEnd(quit){
  const b=BG; b.active=false; stopGame();
  const won=!quit&&b.pW>=b.cfg.rounds, bm=S.stats.byMode.bingo=S.stats.byMode.bingo||{played:0,wins:0,best:0};
  bm.played++; S.stats.matches++; S.stats.playMs+=Date.now()-b.startT;
  const bonus=[];
  if(won){ S.stats.wins++; bm.wins++; S.flags.bingo=true; bonus.push(['Match win',Math.round(10*DIFFS[b.cfg.diff].mult)]); if(S.firstWinDay!==todayKey()){ S.firstWinDay=todayKey(); bonus.push(['First win today',20]); } if(b.cfg.diff==='abysmal') S.flags.abyss=true; }
  else S.stats.losses++;
  const bt=bonus.reduce((a,x)=>a+x[1],0); if(bt){ b.earned+=bt; Treesh.earn(bt,`Nects · Bingo (${DIFFS[b.cfg.diff].name}) win`,b.logKey); }
  const leader=[...b.bots].sort((x,y)=>y.w-x.w)[0];
  S.history.unshift({t:Date.now(),mode:'bingo',sub:`${DIFFS[b.cfg.diff].name} · ${b.bots.length} rivals`,detail:`${b.pW}-${leader.w}${quit?', forfeited':''}`,result:won?'win':'loss',stars:b.earned}); if(S.history.length>30) S.history.length=30;
  saveNects(); checkBadges();
  const rows=[['Your Bingos',b.pW],['Top rival',`${leader.name} (${leader.w})`],['Round Starlites','+'+(b.earned-bt)],...bonus.map(x=>[x[0],'+'+x[1]])];
  openModal(`<div class="result-hero" data-testid="match-result"><span class="big">${won?'🎉':quit?'🏳️':'💔'}</span><h2 class="font-display" data-testid="match-result-title">${won?'Bingo champion':quit?'Forfeited':'Out-daubed'}</h2><p class="text2" style="margin-top:6px">${won?`You beat ${b.bots.length} rivals`:`${esc(leader.name)} took the match`}</p></div>
    <div class="breakdown">${rows.map(r=>`<div><span class="text2">${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}<div class="tot" data-testid="match-result-starlites"><span>Starlites to Treesh</span><span>${ic('sparkles',14)} +${b.earned}</span></div></div>
    <div style="display:flex;gap:10px;margin-top:20px"><button class="btn btn-ghost btn-lg" style="flex:1" data-act="menu" data-testid="match-result-menu-button">${ic('house',17)}Menu</button>
      <button class="btn btn-primary btn-lg" style="flex:1.4" data-act="again" data-testid="match-result-claim-button">${ic('rotate-ccw',17)}Play again</button></div>`,{testid:'result-modal',lock:true});
}
function bingoPause(){
  const b=BG; if(!b||!b.active||b.paused) return;
  b.paused=true; clearTimeout(T.next);
  openModal(`<p class="eyebrow">Bingo</p><h2>Paused</h2><div style="display:grid;gap:10px;margin-top:20px">
    <button class="btn btn-primary btn-lg" data-act="resume" data-testid="pause-resume">${ic('play',17)}Resume</button>
    <button class="btn btn-ghost btn-lg" data-act="restart" data-testid="pause-restart">${ic('rotate-ccw',17)}Restart</button>
    <button class="btn btn-danger btn-lg" data-act="quit" data-testid="pause-quit">${ic('flag',17)}Forfeit match</button></div>`,{testid:'pause-modal',onClose:bingoResume});
}
function bingoResume(){ const b=BG; if(!b||!b.active||!b.paused) return; b.paused=false; if(!b.over){ b.needCall=false; T.next=setTimeout(bingoCall,900); } }

function renderBingo(){
  const b=BG;
  $('#screen').innerHTML=`<div class="gs" data-testid="bingo-screen">${gsHud(pauseBtn(),'Bingo',`Round ${b.round} · First to ${b.cfg.rounds} · ${DIFFS[b.cfg.diff].name} · any line or 4 corners`)}
    <div class="gs-main"><div class="gs-strip">
      <div class="pcard you" data-testid="bingo-rivals"><div class="who">${avatarHtml('sm')}<div style="min-width:0"><b>${esc(Treesh.name())}</b><small data-testid="bingo-player-wins">${b.pW} ${b.pW===1?'Bingo':'Bingos'}</small></div></div><div id="bingo-bots" style="display:grid;gap:3px"></div></div>
      <div class="orb-col"><span class="vs-pill" id="bingo-ball">Ball 0</span><div class="orb" data-testid="caller-panel"><span class="call-emoji" id="call-emoji" data-testid="caller-emoji-display">·</span></div><p class="orb-status">Daub anything called</p></div>
      <div class="pcard opp-card"><div class="who"><div><b>Called</b><small>most recent first</small></div></div><div class="recent" id="bingo-recent" data-testid="bingo-recent-calls"></div></div>
    </div>
    <div class="gs-board"><div class="board" id="board-b" style="--cols:5" data-testid="bingo-card"></div></div>
    <div class="gs-tray"><button class="btn btn-gold big-action" data-act="bingo-shout" data-testid="bingo-call-button">BINGO!</button></div></div></div>`;
  icons(); renderBingoBoard(); renderBingoCaller(); renderBingoBots();
}
function renderBingoBoard(){
  const b=BG, el=$('#board-b'); if(!el) return;
  el.innerHTML=b.card.map((e,i)=>`<button class="tile ${b.daub[i]?'claimed':''} ${b.fx[i]||''} ${b.win&&b.win.includes(i)?'win':''}" data-tap="b" data-idx="${i}" data-testid="tile-b-${i}" ${i===12?'style="font-family:var(--display);color:var(--gold)"':''}>${e}</button>`).join('');
  b.fx={};
}
function renderBingoCaller(animate){
  const b=BG, el=$('#call-emoji'); if(!el) return;
  el.textContent=b.called[b.called.length-1]||'·';
  if(animate){ el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
  const bl=$('#bingo-ball'); if(bl) bl.textContent=`Ball ${b.called.length}`;
  const rc=$('#bingo-recent'); if(rc) rc.innerHTML=b.called.slice(-7,-1).reverse().map((e,i)=>`<span style="opacity:${1-i*.1}">${e}</span>`).join('');
}
function renderBingoBots(){
  const el=$('#bingo-bots'); if(!el||!BG) return;
  el.innerHTML=BG.bots.map((bot,i)=>{ const tg=bingoToGo(bot.daub); return `<div class="rival" data-testid="bingo-rival-${i}"><b>${esc(bot.name)}</b><span class="tg ${tg<=1?'hot':''}">${tg===0?'LINE!':tg+' to go'}</span><span class="w">${bot.w}</span></div>`; }).join('');
}
