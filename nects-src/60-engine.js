/* ===== Game engine ===== */
let G=null;
const T={bot:null,blitz:null,next:null,pz:null,misc:[]};
const pick=a=>a[Math.floor(Math.random()*a.length)];
function clearTimers(){ clearTimeout(T.bot); clearInterval(T.blitz); clearTimeout(T.next); T.bot=T.blitz=T.next=null; }
function later(fn,ms){ const id=setTimeout(()=>{ T.misc=T.misc.filter(x=>x!==id); fn(); },ms); T.misc.push(id); return id; }
function stopGame(){ if(G) G.active=false; clearTimers(); clearInterval(T.pz); T.misc.forEach(clearTimeout); T.misc=[]; $('#banner-root').innerHTML=''; }
const DAILY_PACKS=['smileys','animals','food','sports','travel','objects','nature'];
function dailySeed(){ const k=todayKey().replace(/-/g,''); return +k; }

function buildConfig(mode,sh){
  sh=sh||{}; const st=S.settings;
  const c={mode,diff:sh.diff||st.diff,grid:sh.grid||st.grid,rounds:+(sh.rounds||st.rounds),bot:true,powerups:true,botPU:true,lines:{h:true,v:true,d:true},rewards:true,rewardMult:1,speed:null,pack:S.equipped.pack,seed:null};
  if(mode==='blitz'){ c.blitz=true; c.rewardMult=1.25; }
  if(mode==='gravity'){ c.gravity=true; c.rewardMult=1.15; }
  if(mode==='fog'){ c.fog=true; c.rewardMult=1.3; }
  if(mode==='chaos'){ c.chaos=true; c.rewardMult=1.2; }
  if(mode==='mirror'){ c.mirror=true; c.diff='normal'; c.rewardMult=1.3; }
  if(mode==='daily'){ c.daily=true; c.grid='4x4'; c.diff='normal'; c.rounds=2; c.seed=dailySeed(); c.pack=DAILY_PACKS[c.seed%DAILY_PACKS.length]; c.powerups=false; c.botPU=false; c.speed='daily'; }
  if(mode==='survival'){ c.survival=true; c.rounds=0; c.lives=3; c.diff='normal'; }
  if(mode==='pass'){ c.pass=true; c.bot=false; c.powerups=false; c.botPU=false; c.rewards=false; }
  if(mode==='zen'){ c.zen=true; c.bot=false; c.powerups=false; c.botPU=false; }
  if(mode==='custom'){ const k=S.custom; Object.assign(c,{custom:true,grid:k.grid,diff:k.diff,speed:k.speed,rounds:+k.rounds,lines:{h:k.h,v:k.v,d:k.d},powerups:k.powerups,botPU:k.botPU,rewardMult:.75}); }
  if(c.diff==='abysmal') c.powerups=false;
  const [r,co]=c.grid.split('x').map(Number); c.rows=r; c.cols=co;
  return c;
}
function survivalName(w){ const n=['Rookie','Scout','Hunter','Stalker','Phantom','Warden','Reaper','Tyrant','Overlord','Connex']; return n[Math.min(w-1,9)]+(w>10?' +'+(w-10):''); }

function startMatch(cfg){
  stopGame(); currentScreen='game';
  G={cfg,rng:cfg.seed!=null?mulberry32(cfg.seed):Math.random,active:true,paused:false,round:0,pRounds:0,oRounds:0,streak:0,matchBest:0,earned:0,
    logKey:Date.now(),startT:Date.now(),puCount:0,shineUses:0,reactions:[],misses:0,wave:1,lives:cfg.lives||0,zenLines:0,zenEarned:0,
    botName:cfg.daily?'Daily Rival':cfg.mirror?'Mirror '+Treesh.name():pick(BOT_NAMES[cfg.diff]||BOT_NAMES.normal),
    p2Name:cfg.pass?S.settings.p2name:null,botWeakUntil:0,pScore:0,oScore:0,chaosEvery:3,lastEvent:null};
  newRound();
}

function newRound(){
  if(!G||!G.active) return;
  const c=G.cfg, n=c.rows*c.cols; G.round++;
  const em=shuffle(packEmojis(c.pack),G.rng).slice(0,n);
  G.emojis=em;
  G.p={board:shuffle(em,G.rng),claimed:Array(n).fill(false)};
  G.o=(c.bot||c.pass)?{board:shuffle(em,G.rng),claimed:Array(n).fill(false)}:null;
  G.lines=buildLines(c.rows,c.cols,c.lines);
  G.pool=shuffle(em,G.rng); G.call=null; G.locked=true; G.roundOver=false; G.callCount=0; G.callState=null;
  G.roundPU=false; G.puRound={}; G.pending=null; G.shineIdx=null; G.freeIdx=null; G.botPURound=0;
  G.botFrozenUntil=0; G.inkUntil=0; G.surge=0; G.fx={}; G.lock={p:0,o:0}; G.win=null; G.winSide=null; G.hintIdx=null; G.lastEvent=null;
  if(c.survival) G.botName=survivalName(G.wave);
  const peek=2200+n*70;
  G.fog=c.fog?{peekUntil:Date.now()+peek,reveal:{}}:null;
  renderGame();
  if(c.fog) later(()=>{ if(G&&G.active) renderBoards(); },peek+40);
  T.next=setTimeout(nextCall,c.fog?peek:900);
}

function buildLines(r,c,L){
  const n=Math.min(r,c), out=[], id=(i,j)=>i*c+j, seq=f=>[...Array(n)].map((_,k)=>f(k));
  if(L.h) for(let i=0;i<r;i++) for(let j=0;j<=c-n;j++) out.push(seq(k=>id(i,j+k)));
  if(L.v) for(let j=0;j<c;j++) for(let i=0;i<=r-n;i++) out.push(seq(k=>id(i+k,j)));
  if(L.d){ for(let i=0;i<=r-n;i++) for(let j=0;j<=c-n;j++) out.push(seq(k=>id(i+k,j+k))); for(let i=0;i<=r-n;i++) for(let j=n-1;j<c;j++) out.push(seq(k=>id(i+k,j-k))); }
  return out;
}
function winLine(side){ const B=G[side]; if(!B) return null; return G.lines.find(l=>l.every(i=>B.claimed[i]))||null; }
function canClaim(B,e){ if(!B) return false; const i=B.board.indexOf(e); return i>=0&&!B.claimed[i]; }
function claimable(e){ return canClaim(G.p,e)||canClaim(G.o,e); }
function shuffleUnclaimed(B){ const idx=B.claimed.map((v,i)=>v?-1:i).filter(i=>i>=0); const em=shuffle(idx.map(i=>B.board[i])); idx.forEach((i,k)=>{ B.board[i]=em[k]; }); }
function flipBoard(B){ const {rows,cols}=G.cfg; const nb=[],nc=[]; for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ const s=r*cols+(cols-1-c); nb.push(B.board[s]); nc.push(B.claimed[s]); } B.board=nb; B.claimed=nc; }

function nextCall(){
  if(!G||!G.active||G.roundOver) return;
  if(G.paused){ G.needCall=true; return; }
  clearTimeout(T.bot); clearInterval(T.blitz);
  if(G.surge>0) G.surge--;
  let e=null;
  for(let g=0;g<200&&e===null;g++){
    if(!G.pool.length) G.pool=shuffle(G.emojis.filter(claimable));
    if(!G.pool.length) break;
    const x=G.pool.pop(); if(claimable(x)) e=x;
  }
  if(e===null){ toast('No lines left','Fresh board, same round'); G.round--; return later(newRound,600); }
  G.call=e; G.callAt=performance.now(); G.locked=false; G.callCount++; G.callState=null; G.hintIdx=null; G.lastEvent=null;
  Sound.call();
  if(G.freeIdx!=null){ const fi=G.freeIdx; G.freeIdx=null; if(!G.p.claimed[fi]){ claim('p',fi); toast('Free spot claimed'); if(winLine('p')){ renderBoards(); return roundEnd('p'); } } }
  if(G.fog&&G.callCount>1&&G.callCount%5===0){ G.fog.peekUntil=Date.now()+1200; later(()=>{ if(G&&G.active) renderBoards(); },1250); }
  if(G.cfg.chaos&&G.callCount>1&&G.callCount%G.chaosEvery===0){ chaosEvent(); if(G.roundOver) return; }
  if(!claimable(G.call)) return nextCall();
  renderCaller(true); renderBoards();
  if(G.cfg.blitz) startBlitz();
  if(G.cfg.zen){ const cc=G.callCount; later(()=>{ if(G&&G.active&&!G.locked&&G.callCount===cc){ G.hintIdx=G.p.board.indexOf(G.call); renderBoards(); } },6000); }
  scheduleBot();
  maybeBotPowerup();
}

function claim(side,idx){
  const B=G[side]; if(B.claimed[idx]) return idx;
  let t=idx;
  if(G.cfg.gravity){ const c=G.cfg.cols, col=idx%c; for(let r=G.cfg.rows-1;r>=0;r--){ const j=r*c+col; if(!B.claimed[j]){ t=j; break; } }
    if(t!==idx){ [B.board[idx],B.board[t]]=[B.board[t],B.board[idx]]; } }
  G.fx[side+t]=t!==idx?'drop':'pop';
  B.claimed[t]=true;
  if(side==='p') G.pScore+=100; else G.oScore+=100;
  return t;
}
function fogVisible(idx){ const f=G.fog, now=Date.now(); return !f||G.roundOver||G.p.claimed[idx]||f.peekUntil>now||(f.reveal[idx]||0)>now; }
function flashWrong(side,idx){ const el=$(`#board-${side} [data-idx="${idx}"]`); if(el){ el.classList.remove('wrong'); void el.offsetWidth; el.classList.add('wrong'); } Sound.wrong(); buzz(30); }

function onTap(side,idx){
  if(!G||!G.active||G.paused||G.roundOver) return;
  if(G.pending) return handleTarget(side,idx);
  if(side==='o'&&!G.cfg.pass) return;
  const B=G[side]; if(!B||B.claimed[idx]) return;
  const now=Date.now();
  if(G.lock[side]>now) return;
  if(side==='p'&&G.inkUntil>now) return;
  const e=B.board[idx];
  if(G.fog&&side==='p'&&!fogVisible(idx)){
    G.fog.reveal[idx]=now+700; later(()=>{ if(G&&G.active) renderBoards(); },720);
    if(e!==G.call||G.locked){ G.lock.p=now+500; G.misses++; renderBoards(); flashWrong(side,idx); return; }
  }
  if(G.locked||e!==G.call){ G.misses++; if(G.cfg.pass) G.lock[side]=now+600; flashWrong(side,idx); return; }
  const rt=performance.now()-G.callAt;
  if(side==='p'&&!G.cfg.pass){ S.stats.taps++; S.stats.tapMs+=rt; if(!S.stats.fastestMs||rt<S.stats.fastestMs) S.stats.fastestMs=Math.round(rt); G.reactions.push(rt); }
  G.locked=true; clearTimeout(T.bot); clearInterval(T.blitz);
  claim(side,idx); Sound.claim(); buzz(12);
  G.callState=side==='p'?'you':'p2';
  renderBoards(); renderCaller();
  if(winLine(side)) return roundEnd(side);
  T.next=setTimeout(nextCall,G.cfg.zen?350:650);
}

function botDelay(){
  const c=G.cfg, d=DIFFS[c.diff]||DIFFS.normal; let base=d.base, range=d.range, gm=GRID_MULT[c.rows*c.cols]||1;
  if(c.mirror){ const r=G.reactions.slice(-6); const avg=r.length?r.reduce((a,b)=>a+b,0)/r.length:2400*gm; base=avg*.85; range=avg*.3; gm=1; }
  else if(c.speed==='daily'){ base=1500; range=700; }
  else if(c.speed){ const sp={slow:[3500,1500],normal:[2400,1200],fast:[1200,500],extreme:[750,200]}[c.speed]||[2400,1200]; base=sp[0]; range=sp[1]; }
  if(c.survival){ const f=Math.pow(.9,G.wave-1); base=Math.max(600,2400*f); range=Math.max(180,1100*f); }
  let delay=(base+Math.random()*range)*gm+(Math.random()<.3?Math.random()*500:0);
  if(c.fog) delay*=1.35;
  if(G.surge>0) delay*=.55;
  const now=Date.now(); if(G.botFrozenUntil>now) delay+=G.botFrozenUntil-now;
  return delay;
}
function scheduleBot(){
  if(!G||!G.cfg.bot||G.locked||G.paused||G.roundOver) return;
  clearTimeout(T.bot);
  if(!canClaim(G.o,G.call)) return;
  const cc=G.callCount;
  T.bot=setTimeout(()=>botClaim(cc),botDelay());
}
function botClaim(cc){
  if(!G||!G.active||G.paused||G.roundOver||G.locked||cc!==G.callCount) return;
  const oi=G.o.board.indexOf(G.call); if(oi<0||G.o.claimed[oi]) return;
  G.locked=true; clearInterval(T.blitz);
  claim('o',oi); Sound.opp(); G.callState='bot';
  renderBoards(); renderCaller();
  if(winLine('o')) return roundEnd('o');
  T.next=setTimeout(nextCall,650);
}
function checkStuck(){ if(G&&G.active&&!G.locked&&!G.roundOver&&G.call&&!claimable(G.call)){ G.locked=true; clearTimeout(T.bot); clearInterval(T.blitz); T.next=setTimeout(nextCall,500); } }

function startBlitz(remain){
  const n=G.cfg.rows*G.cfg.cols;
  if(!remain) G.blitzDur=(DIFFS[G.cfg.diff]||DIFFS.normal).blitz*(1+(n-9)*.06)*1000;
  G.blitzEnd=Date.now()+(remain||G.blitzDur);
  clearInterval(T.blitz);
  T.blitz=setInterval(()=>{ const left=G.blitzEnd-Date.now(); const b=$('#blitz-bar'); if(b) b.style.transform=`scaleX(${Math.max(0,left/G.blitzDur)})`; if(left<=0){ clearInterval(T.blitz); blitzExpire(); } },50);
}
function blitzExpire(){
  if(!G||!G.active||G.locked||G.roundOver||G.paused) return;
  G.locked=true; clearTimeout(T.bot); G.callState='timeout';
  if(canClaim(G.o,G.call)){ claim('o',G.o.board.indexOf(G.call)); Sound.opp(); renderBoards(); renderCaller(); if(winLine('o')) return roundEnd('o'); }
  else { Sound.wrong(); renderCaller(); }
  T.next=setTimeout(nextCall,650);
}

/* Round + match end */
function roundEnd(w){
  G.roundOver=true; G.locked=true; clearTimers();
  G.winSide=w; G.win=winLine(w);
  const c=G.cfg; let gained=0, title, sub=null, good=true;
  if(c.zen){ G.zenLines++; S.stats.zenLines++; gained=zenReward(); saveNects(); Sound.win(); renderBoards(); banner('Line!',`${G.zenLines} this session`,gained,true); later(newRound,1100); return; }
  if(c.pass){ if(w==='p') G.pRounds++; else G.oRounds++; title=`${w==='p'?Treesh.name():G.p2Name} takes it`; sub=`${G.pRounds} - ${G.oRounds}`; Sound.win(); }
  else if(w==='p'){
    G.pRounds++; G.streak++; G.matchBest=Math.max(G.matchBest,G.streak); S.stats.roundsWon++; S.stats.bestStreak=Math.max(S.stats.bestStreak,G.streak);
    G.pScore+=Math.round(1000*(DIFFS[c.diff]||DIFFS.normal).mult);
    gained=roundReward(); title=c.survival?`Wave ${G.wave} cleared`:'Round won'; sub=G.streak>1?`${G.streak} round streak`:null;
    if(c.survival) G.wave++; Sound.win();
  } else {
    G.oRounds++; G.streak=0; S.stats.roundsLost++; G.oScore+=1000; good=false;
    if(c.survival){ G.lives--; title='Life lost'; sub=G.lives>0?`${G.lives} ${G.lives===1?'life':'lives'} left`:'Out of lives'; }
    else { title='Round lost'; sub=`${G.botName} finished a line`; }
    Sound.lose();
  }
  saveNects(); renderGame(); banner(title,sub,gained,good);
  later(()=>{ if(!G||!G.active) return; if(matchOver()) endMatch(); else newRound(); },1900);
}
function matchOver(){ const c=G.cfg; if(c.survival) return G.lives<=0; return G.pRounds>=c.rounds||G.oRounds>=c.rounds; }
function logReason(){ const c=G.cfg, m=MODE_BY_ID[c.mode]; const d=(!c.daily&&!c.survival&&!c.zen&&!c.mirror&&DIFFS[c.diff])?` (${DIFFS[c.diff].name})`:''; return `Nects · ${m.name}${d}`; }
function roundReward(){
  const c=G.cfg; if(!c.rewards) return 0;
  const d=DIFFS[c.diff]||DIFFS.normal, n=c.rows*c.cols;
  let s=c.survival?2+G.wave*1.5:4*d.mult*(1+(n-9)*.05)+Math.min(G.streak-1,10);
  s*=c.rewardMult; if(G.roundPU) s*=.5;
  const shine=G.shineIdx!=null&&G.win&&G.win.includes(G.shineIdx); if(shine) s*=2;
  s=Math.max(1,Math.round(s)); G.earned+=s; Treesh.earn(s,logReason(),G.logKey);
  if(shine) later(()=>toast('Double Starlites','Your Shine tile was in the winning line','star'),500);
  return s;
}
function zenReward(){
  const dk=todayKey(); if(S.zenDay.date!==dk) S.zenDay={date:dk,earned:0};
  if(S.zenDay.earned>=15) return 0;
  S.zenDay.earned++; G.earned++; Treesh.earn(1,'Nects · Zen lines',G.logKey); return 1;
}
function endMatch(quit){
  if(!G) return; const c=G.cfg; G.active=false; stopGame();
  const bm=S.stats.byMode[c.mode]=S.stats.byMode[c.mode]||{played:0,wins:0,best:0};
  bm.played++; S.stats.matches++; S.stats.playMs+=Date.now()-G.startT;
  let result='done', won=false; const bonus=[];
  if(c.survival){ const wv=G.wave-1; bm.best=Math.max(bm.best||0,wv); S.survivalBest=Math.max(S.survivalBest,wv); if(wv>0) bonus.push(['Survival run bonus',wv*2]); }
  else if(!c.pass&&!c.zen){
    won=!quit&&G.pRounds>G.oRounds; result=won?'win':'loss';
    if(won){ S.stats.wins++; bm.wins=(bm.wins||0)+1; } else S.stats.losses++;
    if(c.daily){ const dd=S.daily[todayKey()]=S.daily[todayKey()]||{tries:0}; dd.tries=(dd.tries||0)+1; if(won){ if(!dd.won) bonus.push(['Daily Challenge',25]); dd.won=true; dd.score=`${G.pRounds}-${G.oRounds}`; } }
    if(won){
      bonus.push(['Match win',Math.round(10*(DIFFS[c.diff]||DIFFS.normal).mult*c.rewardMult)]);
      if(S.firstWinDay!==todayKey()){ S.firstWinDay=todayKey(); bonus.push(['First win today',20]); }
      if(c.diff==='abysmal'&&!c.custom) S.flags.abyss=true; if(c.rows===6) S.flags.big=true;
      if(c.fog) S.flags.fog=true; if(c.gravity) S.flags.gravity=true; if(c.chaos) S.flags.chaos=true;
    }
  }
  if(c.pass){ bm.wins=(bm.wins||0); }
  const bt=bonus.reduce((a,b)=>a+b[1],0); if(bt>0&&c.rewards){ G.earned+=bt; Treesh.earn(bt,logReason()+(won?' win':''),G.logKey); }
  const sub=c.pass?`vs ${G.p2Name}`:c.zen?c.grid.replace('x','×'):c.survival?`Wave ${G.wave-1}`:`${c.daily?'Daily':DIFFS[c.diff].name} · ${c.grid.replace('x','×')}`;
  const detail=c.zen?`${G.zenLines} lines`:c.survival?`${G.wave-1} waves cleared`:c.pass?`${G.pRounds}-${G.oRounds}, ${G.pRounds>=G.oRounds?Treesh.name():G.p2Name} won`:`${G.pRounds}-${G.oRounds}${quit?', forfeited':''}`;
  S.history.unshift({t:Date.now(),mode:c.mode,sub,detail,result,stars:G.earned}); if(S.history.length>30) S.history.length=30;
  saveNects(); checkBadges();
  showResult({won,quit,bonus});
}

function showResult({won,quit,bonus}){
  const c=G.cfg, avg=G.reactions.length?G.reactions.reduce((a,b)=>a+b,0)/G.reactions.length:0;
  let icon='💔',title='Defeat',sub=`${G.botName} took the match ${G.oRounds}-${G.pRounds}`;
  if(won){ icon='🏆'; title='Victory'; sub=`You beat ${G.botName} ${G.pRounds}-${G.oRounds}`; }
  if(quit&&!c.survival&&!c.zen&&!c.pass){ icon='🏳️'; title='Forfeited'; sub='Counted as a loss'; }
  if(c.survival){ icon='💗'; title=`Wave ${G.wave-1}`; sub=G.wave-1>=S.survivalBest&&G.wave>1?'New personal best!':`Best: wave ${S.survivalBest}`; }
  if(c.zen){ icon='🍃'; title='Nice and calm'; sub=`${G.zenLines} ${G.zenLines===1?'line':'lines'} completed`; }
  if(c.pass){ const p1w=G.pRounds>G.oRounds; icon=G.pRounds===G.oRounds?'🤝':'🏆'; title=G.pRounds===G.oRounds?'Draw':`${p1w?Treesh.name():G.p2Name} wins`; sub=`${G.pRounds} - ${G.oRounds}`; }
  const roundStars=G.earned-bonus.reduce((a,b)=>a+b[1],0);
  const rows=[]; if(!c.pass&&!c.zen) rows.push(['Rounds',`${G.pRounds} - ${G.oRounds}`]);
  if(avg) rows.push(['Average tap',(avg/1000).toFixed(2)+'s']); if(G.matchBest>1) rows.push(['Best streak',G.matchBest]);
  if(c.rewards){ rows.push([c.zen?'Zen lines':'Round Starlites','+'+roundStars]); bonus.forEach(b=>rows.push([b[0],'+'+b[1]])); }
  openModal(`<div class="result-hero" data-testid="match-result"><span class="big">${icon}</span><h2 class="font-display" data-testid="match-result-title">${esc(title)}</h2><p class="text2" style="margin-top:6px">${esc(sub)}</p></div>
    <div class="breakdown">${rows.map(r=>`<div><span class="text2">${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')}
      ${c.rewards?`<div class="tot" data-testid="match-result-starlites"><span>Starlites to Treesh</span><span>${ic('sparkles',14)} +${G.earned}</span></div>`:`<div><span class="muted">Pass & Play doesn\u2019t pay Starlites</span><span></span></div>`}</div>
    <div style="display:flex;gap:10px;margin-top:20px"><button class="btn btn-ghost btn-lg" style="flex:1" data-act="menu" data-testid="match-result-menu-button">${ic('house',17)}Menu</button>
      <button class="btn btn-primary btn-lg" style="flex:1.4" data-act="again" data-testid="match-result-claim-button">${ic('rotate-ccw',17)}Play again</button></div>`,{testid:'result-modal',lock:true});
  if(won||c.survival||c.zen) Sound.win();
}

/* Pause */
function pauseGame(){
  if(!G||!G.active||G.paused) return;
  G.paused=true; clearTimeout(T.bot);
  if(G.cfg.blitz&&!G.locked){ G.blitzRemain=Math.max(300,G.blitzEnd-Date.now()); clearInterval(T.blitz); }
  openModal(`<p class="eyebrow">${esc(MODE_BY_ID[G.cfg.mode].name)}</p><h2>Paused</h2>
    <div style="display:grid;gap:10px;margin-top:20px">
      <button class="btn btn-primary btn-lg" data-act="resume" data-testid="pause-resume">${ic('play',17)}Resume</button>
      <button class="btn btn-ghost btn-lg" data-act="restart" data-testid="pause-restart">${ic('rotate-ccw',17)}Restart</button>
      <button class="btn btn-danger btn-lg" data-act="quit" data-testid="pause-quit">${ic('flag',17)}${G.cfg.zen||G.cfg.survival||G.cfg.pass?'End session':'Forfeit match'}</button>
    </div>`,{testid:'pause-modal',onClose:resumeGame});
}
function resumeGame(){
  if(!G||!G.active||!G.paused) return;
  G.paused=false;
  if(G.needCall){ G.needCall=false; return nextCall(); }
  if(!G.locked&&!G.roundOver){ scheduleBot(); if(G.cfg.blitz) startBlitz(G.blitzRemain); }
}

/* Player powerups */
function puLeft(){ return Math.max(0,(DIFFS[G.cfg.diff]||DIFFS.normal).maxPU-G.puCount); }
function canUsePU(id){
  if(!G.cfg.powerups||G.puRound[id]) return false;
  if(id==='shine') return G.shineUses<3&&G.shineIdx==null;
  if(id==='steal'&&!G.o.claimed.some(Boolean)) return false;
  return puLeft()>0;
}
function usePU(id){
  if(!G||!G.active||G.roundOver||G.paused) return;
  if(G.pending&&G.pending.id===id){ G.pending=null; renderTray(); renderBoards(); return; }
  if(!canUsePU(id)){ toast('Not available',id==='steal'?'The bot has no claimed tiles yet':'Used up for now','warn'); return; }
  const P=POWERUPS[id];
  if(P.target){ G.pending={id,first:null}; renderTray(); renderBoards(); toast(P.name,P.target==='opp'?'Tap one of the bot\u2019s claimed tiles':P.target==='own2'?'Tap two of your unclaimed tiles':'Tap one of your unclaimed tiles'); return; }
  applyPU(id);
}
function handleTarget(side,idx){
  const pd=G.pending, id=pd.id;
  if(id==='steal'){ if(side!=='o'||!G.o.claimed[idx]) return toast('Pick a claimed tile on the bot\u2019s board'); return applyPU('steal',idx); }
  if(side!=='p') return;
  if(G.p.claimed[idx]) return toast('Pick an unclaimed tile');
  if(id==='swap'){ if(pd.first==null||pd.first===idx){ pd.first=pd.first===idx?null:idx; return renderBoards(); } return applyPU('swap',pd.first,idx); }
  applyPU(id,idx);
}
function applyPU(id,a,b){
  const bn=G.botName;
  if(id==='shuffle'){ shuffleUnclaimed(G.p); toast('Shuffled','Your board got rearranged'); }
  if(id==='shake'){ shuffleUnclaimed(G.o); toast('Shake!',`${bn}\u2019s board is scrambled`); }
  if(id==='splat'){ G.botFrozenUntil=Date.now()+5000; toast('Splat!',`${bn} is blinded for 5s`); if(!G.locked) scheduleBot(); }
  if(id==='switch'){ [G.p,G.o]=[G.o,G.p]; G.freeIdx=null; G.shineIdx=null; toast('Switched','You traded boards'); if(!G.locked) scheduleBot(); }
  if(id==='weaken'){ G.botWeakUntil=Date.now()+30000; toast('Weakened',`${bn} can\u2019t use powerups for 30s`); }
  if(id==='free'){ G.freeIdx=a; toast('Free spot set','It gets claimed on the next call'); }
  if(id==='swap'){ [G.p.board[a],G.p.board[b]]=[G.p.board[b],G.p.board[a]]; toast('Swapped'); }
  if(id==='shine'){ G.shineIdx=a; toast('Starlite Shine','Win with this tile in your line for 2x','star'); }
  if(id==='steal'){ const e=G.o.board[a]; G.o.claimed[a]=false; if(canClaim(G.p,e)) claim('p',G.p.board.indexOf(e)); toast('Stolen!',`You took ${e} from ${bn}`); }
  G.puRound[id]=true; if(id==='shine') G.shineUses++; else { G.puCount++; G.roundPU=true; }
  G.pending=null; Sound.event(); renderBoards(); renderTray();
  if(winLine('p')) return roundEnd('p');
  checkStuck();
}

/* Bot powerups */
function maybeBotPowerup(){
  const c=G.cfg; if(!c.bot||!c.botPU||G.roundOver||Date.now()<G.botWeakUntil||G.botPURound>=2) return;
  let pool=c.mirror?S.owned.powerups.filter(x=>['shake','free','splat','steal'].includes(x)):c.custom?['shake','free','splat','steal']:BOT_PU_BY_DIFF[c.diff];
  if(c.survival) pool=G.wave>=6?BOT_PU_BY_DIFF.insane:G.wave>=3?BOT_PU_BY_DIFF.hard:BOT_PU_BY_DIFF.normal;
  if(!pool||!pool.length) return;
  const n=c.rows*c.cols, pc=G.p.claimed.filter(Boolean).length, oc=G.o.claimed.filter(Boolean).length;
  const chance=(DIFFS[c.diff]||DIFFS.normal).botPU*(c.survival?1+G.wave*.1:1);
  if(!(pc>oc||pc>=n*.4)||Math.random()>=chance) return;
  const id=pick(pool); later(()=>botUsePU(id),400+Math.random()*900);
}
function botUsePU(id){
  if(!G||!G.active||G.roundOver||G.paused||Date.now()<G.botWeakUntil) return;
  const mine=G.p.claimed.map((v,i)=>v?i:-1).filter(i=>i>=0), bn=G.botName;
  if(id==='steal'&&!mine.length) id='shake';
  G.botPURound++;
  if(id==='shake'){ shuffleUnclaimed(G.p); toast(`${bn} used Shake`,'Your board got scrambled','warn'); }
  if(id==='splat'){ G.inkUntil=Date.now()+3500; toast(`${bn} used Splat`,'You\u2019re blinded for a moment','warn'); later(()=>{ if(G&&G.active) renderBoards(); },3550); }
  if(id==='free'){ const open=G.o.claimed.map((v,i)=>v?-1:i).filter(i=>i>=0); if(!open.length) return; claim('o',pick(open)); toast(`${bn} used Free Spot`,'They claimed a tile for free','warn'); }
  if(id==='steal'){ const t=pick(mine), e=G.p.board[t]; G.p.claimed[t]=false; if(canClaim(G.o,e)) claim('o',G.o.board.indexOf(e)); toast(`${bn} stole ${e}`,'Grab it back if it\u2019s called again','warn'); }
  Sound.event(); renderBoards();
  if(winLine('o')) return roundEnd('o');
  checkStuck();
}
