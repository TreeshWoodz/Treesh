/* ---------- P9zb: What's Next? as an iMessage thread (artist types, line audio plays as each bubble sends) ---------- */
const WN_YES=['\uD83D\uDD25','\uD83D\uDE4C','\uD83D\uDCAF','\uD83E\uDEE1','\uD83D\uDC4F','\uD83E\uDD29','\uD83C\uDFAF','\uD83D\uDE0E','\u2728','\uD83D\uDE0D'];
const WN_NO=['\uD83D\uDE43','\uD83D\uDE2C','\u274C'];
let _wnA=null, _wnRaf=0, _wnSeq=0, _wnVV=null;
function wnAud(){ if(!_wnA){ _wnA=new Audio(); _wnA.preload='auto'; try{ _wnA.setAttribute('playsinline',''); }catch(e){} } return _wnA; }
function wnPick(a){ return a[Math.floor(Math.random()*a.length)]; }
function wnT(x){ x=+x; return isFinite(x)&&x>=0?x:NaN; }
function wnWait(ms){ return new Promise(r=>setTimeout(r,ms)); }
function wnFine(){ try{ return matchMedia('(pointer:fine)').matches; }catch(e){ return false; } }
function wnLiveOff(){ document.querySelectorAll('#wc-thread .wc-b.is-live').forEach(b=>b.classList.remove('is-live')); }
function wnStopAudio(){ cancelAnimationFrame(_wnRaf); _wnRaf=0; wnLiveOff(); try{ if(_wnA) _wnA.pause(); }catch(e){} }
function wnHalt(){ _wnSeq++; wnStopAudio(); clearGameTimer(); if(_wnVV&&window.visualViewport){ visualViewport.removeEventListener('resize',_wnVV); visualViewport.removeEventListener('scroll',_wnVV); } _wnVV=null; }
function wnIni(n){ const w=String(n||'?').replace(/[^\p{L}\p{N}\s]/gu,'').trim().split(/\s+/).filter(Boolean); return ((w[0]||'?')[0]+((w[1]||'')[0]||'')).toUpperCase(); }
function wnAvSrc(){ const s=state.game.song, cov=s.coverArt&&s.coverArt!==FALLBACK?s.coverArt:''; if(s._user||s.source==='user') return cov;
  const a=(s.artistIds||[]).map(id=>ARTIST_BY_ID[id]).find(x=>x&&x.image); return a?a.image:cov; }
function wnAv(big){ const s=state.game.song, src=wnAvSrc(); return `<span class="wc-av${big?' is-big':''}"${big?' data-testid="game-artist-avatar"':''}><b>${esc(wnIni(s.artist||s.title))}</b>${src?`<img src="${esc(src)}" alt="" onerror="this.remove()">`:''}</span>`; }

/* audio: one private element so the main player queue stays untouched */
function wnPrep(t){ const g=state.game, a=wnAud(); return Promise.resolve(g&&g._unlock).then(()=>new Promise(res=>{
  if(!g||!g.song.audioUrl||!isFinite(t)) return res(false);
  let done=false; const fin=ok=>{ if(done) return; done=true; clearTimeout(to); a.removeEventListener('seeked',chk); a.removeEventListener('canplay',chk); a.removeEventListener('error',bad); res(ok); };
  const chk=()=>{ if(!a.seeking&&a.readyState>=3&&Math.abs((a.currentTime||0)-t)<0.35) fin(true); };
  const bad=()=>fin(false); const to=setTimeout(()=>fin(a.readyState>=2&&Math.abs((a.currentTime||0)-t)<0.5),3500);
  a.addEventListener('seeked',chk); a.addEventListener('canplay',chk); a.addEventListener('error',bad);
  try{ a.pause(); }catch(e){}
  const go=()=>{ try{ a.currentTime=t; }catch(e){} chk(); };
  if(a.readyState>=1) go(); else a.addEventListener('loadedmetadata',go,{once:true});
})); }
function wnPlay(){ const a=wnAud(); return new Promise(res=>{ if(!a.paused) return res(true);
  let d=false; const f=ok=>{ if(d) return; d=true; clearTimeout(to); a.removeEventListener('playing',on); res(ok); };
  const on=()=>f(true); const to=setTimeout(()=>f(!a.paused),1200); a.addEventListener('playing',on);
  try{ a.muted=false; a.volume=typeof state.volume==='number'?state.volume:1; const p=a.play(); if(p&&p.catch) p.catch(()=>f(false)); }catch(e){ f(false); } }); }
function wnWatch(marks,tok){ return new Promise(res=>{ const a=wnAud(); let i=0, last=a.currentTime||0; const w0=performance.now(), limit=((marks.length?marks[marks.length-1].t:0)-last)*1000+6000;
  const flush=()=>{ while(i<marks.length){ marks[i].fn(); i++; } };
  const tick=()=>{ if(tok!==_wnSeq) return res(false); const ct=a.currentTime||0;
    while(i<marks.length&&ct>=marks[i].t){ marks[i].fn(); last=marks[i].t; i++; }
    if(i>=marks.length) return res(true);
    if(a.paused||a.ended||performance.now()-w0>limit){ flush(); return res(true); }
    if(ct-last>7&&marks[i].t-ct>2){ try{ a.currentTime=marks[i].t-1; }catch(e){} last=marks[i].t-1; }
    _wnRaf=requestAnimationFrame(tick); };
  tick(); }); }
function wnSegEnd(i){ const L=state.game.lines, s=wnT(L[i]&&L[i].t); let e=wnT(L[i+1]&&L[i+1].t); if(!isFinite(e)||e<=s) e=s+6; return Math.min(e,s+9)+0.2; }

/* thread */
function wnMsgHtml(m,i,anim){ const g=state.game, nm=esc(g.song.artist||'Artist'), cls=anim?' wc-in':'';
  if(m.k==='div') return `<div class="wc-div${cls}" data-testid="game-round-divider-${i}">${m.text}</div>`;
  if(m.k==='sys') return `<div class="wc-sys is-${m.tone||'mid'}${cls}" data-testid="game-result-note-${i}">${m.html}</div>`;
  if(m.k==='hint') return `<div class="wc-sys is-hint${cls}" data-testid="game-hint-note-${i}"><i data-lucide="lightbulb" style="width:14px;height:14px"></i><span>${m.html}</span></div>`;
  if(m.k==='pick') return `<div class="wc-pick${cls}" data-testid="game-pick-card-${i}"><p><i data-lucide="list-checks" style="width:14px;height:14px"></i>Pick the next line</p>${m.opts.map((o,j)=>`<button type="button" data-act="wcx-pick" data-msg="${i}" data-i="${j}" data-testid="game-pick-${i}-${j}" class="press"${m.used?' disabled':''}>${esc(o)}</button>`).join('')}</div>`;
  if(m.k==='end') return `<div class="wc-end${cls}" data-testid="game-end-card">${gameEndHTML()}</div>`;
  if(m.k==='me') return `<div class="wc-row is-me${cls}" data-testid="game-msg-me-${i}"><div class="wc-col"><div class="wc-b">${esc(m.text)}</div>${m.note?`<span class="wc-note">${m.note}</span>`:''}</div></div>`;
  const emo=m.k==='emoji';
  return `<div class="wc-row is-a${emo?' is-emo':''}${cls}" data-testid="game-msg-${emo?'emoji':'artist'}-${i}">${wnAv()}<div class="wc-col"><span class="wc-name">${nm}</span>${emo?`<div class="wc-emoji">${m.text}</div>`:`<div class="wc-b">${esc(m.text)}</div>`}</div></div>`; }
function wnTypingHtml(){ return `<div class="wc-row is-a wc-in" id="wc-typing" data-testid="game-typing">${wnAv()}<div class="wc-col"><span class="wc-name">${esc(state.game.song.artist||'Artist')}</span><div class="wc-b wc-dots" aria-label="typing"><i></i><i></i><i></i></div></div></div>`; }
function wnScroll(smooth){ const th=document.getElementById('wc-thread'); if(th) th.scrollTo({top:th.scrollHeight,behavior:smooth?'smooth':'auto'}); }
function wnTyping(on){ const g=state.game; if(!g) return; g.typing=!!on; const th=document.getElementById('wc-thread'); if(!th) return; const cur=document.getElementById('wc-typing');
  if(on&&!cur){ th.insertAdjacentHTML('beforeend',wnTypingHtml()); icons(); wnScroll(true); } else if(!on&&cur) cur.remove(); }
function wnAdd(m,live){ const g=state.game; if(!g) return; g.msgs.push(m); const th=document.getElementById('wc-thread'); if(!th) return;
  const ty=document.getElementById('wc-typing'); if(ty&&m.k!=='me'&&m.k!=='div') { ty.remove(); g.typing=false; }
  const html=wnMsgHtml(m,g.msgs.length-1,true); if(ty&&ty.isConnected) ty.insertAdjacentHTML('beforebegin',html); else th.insertAdjacentHTML('beforeend',html);
  if(live){ wnLiveOff(); const b=th.querySelectorAll('.wc-row.is-a .wc-b:not(.wc-dots)'); if(b.length) b[b.length-1].classList.add('is-live'); }
  icons(); wnScroll(true); }
function wnHeadHtml(){ const g=state.game, n=g.targets.length, r=Math.min(g.round+1,n), pct=g.phase==='end'?100:Math.round(g.round/n*100);
  return `<header class="wc-head"><div class="wc-hl"><button type="button" data-act="game-close" aria-label="Close game" data-testid="game-close-button" class="wc-hbtn press"><i data-lucide="chevron-left" style="width:24px;height:24px"></i></button><button type="button" data-act="wcx-style" aria-label="Chat style" data-testid="game-style-button" class="wc-hbtn is-sm press"><i data-lucide="palette" style="width:18px;height:18px"></i></button></div>
    <div class="wc-hmid">${wnAv(true)}<p class="wc-hname clamp-1" data-testid="game-artist-name">${esc(g.song.artist||'Artist')}<i data-lucide="chevron-right" style="width:12px;height:12px"></i></p><p class="wc-hsub clamp-1">What\u2019s Next? \u00B7 ${esc(g.song.title)}</p></div>
    <div class="wc-hstats"><span class="wc-hpill" data-testid="game-score"><b id="wc-score">${g.score}</b>pts</span><span class="wc-hmeta"><i data-lucide="flame" style="width:12px;height:12px" class="${g.streak>0?'is-hot':''}" id="wc-flame"></i><b id="wc-streak">${g.streak}</b><em id="wc-round" data-testid="game-round">${r}/${n}</em></span></div>
    <div class="wc-prog"><span id="wc-prog" style="width:${pct}%"></span></div></header>`; }
function wnHead(){ const g=state.game; if(!g) return; const n=g.targets.length, set=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  set('wc-score',g.score); set('wc-streak',g.streak); set('wc-round',Math.min(g.round+1,n)+'/'+n);
  const f=document.getElementById('wc-flame'); if(f) f.classList.toggle('is-hot',g.streak>0);
  const p=document.getElementById('wc-prog'); if(p) p.style.width=(g.phase==='end'?100:Math.round(((g.phase==='done'?1:0)+g.round)/n*100))+'%';
  const side=document.querySelector('[data-game-root] .wn-side'); if(side) side.outerHTML=gxWnSide(); }
function wnComposeHtml(){ const g=state.game;
  return `<div class="wc-compose" id="wc-compose" data-phase="${g.phase}">
    ${g.timer?`<div class="wc-timer"><span id="game-timer-bar"></span></div>`:''}
    <div class="wc-tools"><button data-act="game-hint" data-testid="game-hint" class="wc-tool press"><i data-lucide="volume-2" style="width:14px;height:14px"></i>Hear it</button><button type="button" data-act="wcx-hints" data-testid="game-hints-button" class="wc-tool press" id="wc-hints-btn"><i data-lucide="lightbulb" style="width:14px;height:14px"></i>Hints</button><span class="wc-try" id="wc-try" data-testid="game-try-chip" hidden>1 more try</span><span class="wc-fill"></span>${g.timer?`<span class="wc-chip" data-testid="game-timer-chip"><i data-lucide="timer" style="width:12px;height:12px"></i><b id="game-timer-num">${GAME_TIME}s</b></span>`:''}${g.exact?`<span class="wc-chip"><i data-lucide="type" style="width:12px;height:12px"></i>Exact</span>`:''}<button data-act="game-skip" data-testid="game-skip" class="wc-tool press">Skip</button></div>
    <div class="wc-hints" id="wc-hints" data-testid="game-hints-tray" hidden></div>
    <div class="wc-inrow">${VOICE_OK?`<button type="button" data-act="game-mic" id="game-mic" data-testid="game-mic" class="wc-mic press" aria-label="Speak"><i data-lucide="mic" style="width:18px;height:18px"></i></button>`:''}<div class="wc-field" id="wc-field"><textarea id="game-input" data-testid="game-input" rows="1" enterkeyhint="send" autocomplete="off" autocapitalize="sentences" spellcheck="false" aria-label="Your next line"></textarea><button type="button" id="wc-send" data-testid="game-submit" class="wc-send press" aria-label="Send"><i data-lucide="arrow-up" style="width:18px;height:18px"></i></button></div></div>
    <div class="wc-nextrow"><button data-act="game-next" data-testid="game-next" id="wc-next" class="wc-next press">Next line</button></div>
  </div>`; }
function wnGrow(gi){ gi.style.height='auto'; gi.style.height=Math.min(gi.scrollHeight,112)+'px'; const f=document.getElementById('wc-field'); if(f) f.classList.toggle('has-text',!!gi.value.trim()); }
function wnSend(){ const gi=document.getElementById('game-input'); if(!gi) return; const v=gi.value.trim(); if(!v){ gi.focus(); return; } submitAnswer(v,gi.dataset.voice?'voice':'type'); }
function wnBind(){ const gi=document.getElementById('game-input'), sb=document.getElementById('wc-send'); if(!gi) return;
  gi.addEventListener('input',()=>wnGrow(gi)); gi.addEventListener('focus',()=>{ [120,360,700].forEach(ms=>setTimeout(()=>{ if(_wnVV) _wnVV(); },ms)); });
  gi.addEventListener('keydown',e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); if(state.game&&state.game.phase==='input') wnSend(); } });
  if(sb){ sb.addEventListener('pointerdown',e=>e.preventDefault()); sb.addEventListener('click',wnSend); }
  const cb=document.querySelector('[data-game-root] [data-testid="game-close-button"]'); if(cb) cb.addEventListener('click',e=>{ e.preventDefault(); e.stopPropagation(); gameClose(); }); }
function wnSetPhase(p){ const g=state.game; if(!g) return; g.phase=p; g.answered=p!=='input'; const c=document.getElementById('wc-compose'); if(!c) return; c.dataset.phase=p;
  const gi=document.getElementById('game-input'), nm=g.song.artist||'Artist';
  if(gi){ gi.readOnly=p!=='input'; gi.placeholder=p==='input'?(g.try>=2?'One more try\u2026':(g.exact?'Type the exact next line\u2026':'Type the next line\u2026')):(p==='intro'?'Listen\u2026':nm+' is typing\u2026'); }
  const tr=document.getElementById('wc-try'); if(tr) tr.hidden=!(p==='input'&&g.try>=2); if(p!=='input') wcHintsToggle(false);
  const nx=document.getElementById('wc-next'); if(nx) nx.textContent=g.round+1>=g.targets.length?'See results':'Next line';
  if(p==='input'&&gi&&wnFine()) gi.focus({preventScroll:true});
  if(p==='done'&&nx&&wnFine()) nx.focus({preventScroll:true}); }
function wnVVOn(){ const v=window.visualViewport; if(!v) return;
  if(!_wnVV){ _wnVV=()=>{ const r=document.querySelector('#modal [data-game-root]'); if(!r) return; const kb=window.innerHeight-v.height>120; r.style.height=Math.round(v.height)+'px'; r.style.top=Math.max(0,Math.round(v.offsetTop))+'px'; r.classList.toggle('is-kb',kb); wnScroll(false); };
    v.addEventListener('resize',_wnVV); v.addEventListener('scroll',_wnVV); }
  _wnVV(); }

/* scoring (same rules as before, plus a half-points second try) */
function wnScore(a,timedOut){ const g=state.game, full=g.lines[g.targets[g.round]].text;
  const pp=(full.match(/\(([^)]*)\)/g)||[]).map(x=>x.replace(/[()]/g,'').trim()).filter(Boolean);
  const base=(full.replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim())||full;
  const sim=similarity(a,base), exact=a.length>0&&normExact(a).toLowerCase()===normExact(base).toLowerCase();
  let correct, pts; if(g.exact){ correct=exact; pts=exact?100:Math.round(sim*45); } else { correct=sim>=0.6; pts=Math.round(sim*100); }
  let ab=0, ah=false; if(pp.length){ const an=gnorm(a); pp.forEach(p=>{ const n=gnorm(p); if(n&&an.indexOf(n)>=0){ ah=true; ab+=15; } }); ab=Math.min(ab,30); }
  let bonus=0; if(g.timer&&correct&&!timedOut) bonus=Math.round((Math.max(0,g.timeLeft)/GAME_TIME)*30);
  if(correct) bonus+=ab; else ah=false;
  return {sim,exact,correct,pts:pts+bonus,bonus,adlib:ah,adlibBonus:ah?ab:0}; }
function wnVerdict(r,timedOut){ const g=state.game; if(timedOut&&!r.correct) return 'Time\u2019s up!'; if(g.exact) return r.exact?'Exact match!':(r.sim>=0.6?'So close!':'Not quite'); return r.sim>=0.85?'Perfect!':r.sim>=0.6?'Nice, so close!':r.sim>=0.3?'Almost\u2026':'Not quite'; }
function wnRecord(r){ const g=state.game; g.score+=r.pts; if(r.correct){ g.streak++; g.bestStreak=Math.max(g.bestStreak,g.streak); } else g.streak=0; g.results.push({correct:r.correct,sim:r.sim,pts:r.pts,exact:r.exact}); }
function wnNote(r,label,second){ return `<b>+${r.pts}</b><span>${esc(label)}</span>${second?'<span>2nd try</span>':''}${r.bonus&&!r.adlib?`<span class="is-gold">\u26A1${r.bonus}</span>`:''}${r.adlib?`<span class="is-gold" data-testid="game-adlib-bonus">Ad-lib +${r.adlibBonus}</span>`:''}`; }

/* round flow */
async function wnIntro(){ const g=state.game; if(!g) return; const tok=++_wnSeq; wnStopAudio(); g.try=1;
  const L=g.lines, ti=g.targets[g.round], ctx=[ti-2,ti-1].filter(i=>i>=0&&L[i]);
  wnSetPhase('intro'); wnHead(); wnAdd({k:'div',text:`Round ${g.round+1} of ${g.targets.length}`});
  const s0=wnT(L[ctx[0]].t), tEnd=wnT(L[ti].t), sync=!!g.song.audioUrl&&isFinite(s0)&&isFinite(tEnd)&&tEnd>s0&&tEnd-s0<45;
  wnTyping(true);
  const [ok]=await Promise.all([sync?wnPrep(s0):Promise.resolve(false), wnWait(g.round?850:1100)]);
  if(tok!==_wnSeq) return;
  const live=ok&&await wnPlay(); if(tok!==_wnSeq){ wnStopAudio(); return; }
  wnAdd({k:'a',text:L[ctx[0]].text},live);
  if(ctx.length>1){ const t2=wnT(L[ctx[1]].t);
    if(live&&isFinite(t2)&&t2>s0&&t2<tEnd){ let sent=false; const tt=setTimeout(()=>{ if(tok===_wnSeq&&!sent) wnTyping(true); },380);
      await wnWatch([{t:t2-0.04,fn:()=>{ sent=true; clearTimeout(tt); wnAdd({k:'a',text:L[ctx[1]].text},true); }},{t:tEnd-0.12,fn:()=>{ wnLiveOff(); try{ wnAud().pause(); }catch(e){} }}],tok);
    } else {
      if(live) await wnWatch([{t:(isFinite(t2)&&t2>s0?t2:s0+6)-0.1,fn:()=>{ wnLiveOff(); try{ wnAud().pause(); }catch(e){} }}],tok);
      if(tok!==_wnSeq) return; await wnWait(300); if(tok!==_wnSeq) return; wnTyping(true); await wnWait(1150); if(tok!==_wnSeq) return;
      wnAdd({k:'a',text:L[ctx[1]].text}); }
  } else if(live){ await wnWatch([{t:tEnd-0.12,fn:()=>{ wnLiveOff(); try{ wnAud().pause(); }catch(e){} }}],tok); }
  if(tok!==_wnSeq) return;
  wnSetPhase('input'); wcTimer(); }
async function wnArtistSays(tok,ms,send){ const g=state.game, ti=g.targets[g.round], L=g.lines, s=wnT(L[ti]&&L[ti].t), sync=!!g.song.audioUrl&&isFinite(s);
  wnTyping(true); const [ok]=await Promise.all([sync?wnPrep(s):Promise.resolve(false), wnWait(ms)]);
  if(tok!==_wnSeq) return false; const live=ok&&await wnPlay(); if(tok!==_wnSeq){ wnStopAudio(); return false; }
  send(live); if(live){ const e=wnSegEnd(ti); wnWatch([{t:e,fn:()=>{ wnLiveOff(); try{ wnAud().pause(); }catch(x){} }}],tok); }
  return true; }
async function wnYes(r,second,tok){ const g=state.game, target=g.lines[g.targets[g.round]].text; wnRecord(r); wnSetPhase('react'); wnHead();
  if(!(await wnArtistSays(tok,650,()=>wnAdd({k:'emoji',text:wnPick(WN_YES)})))) return;
  wnAdd({k:'sys',tone:'good',html:wnNote(r,wnVerdict(r),second)+(r.exact||r.sim>=0.97?'':`<em>\u201C${esc(target)}\u201D</em>`)}); wnSetPhase('done'); wnHead(); }
async function wnNope(tok){ wnSetPhase('react'); wnHead(); wnTyping(true); await wnWait(650); if(tok!==_wnSeq) return;
  wnAdd({k:'emoji',text:wnPick(WN_NO)}); wnAdd({k:'sys',tone:'bad',html:'<span>Not quite</span><b>1 more try</b>'});
  state.game.try=2; wnSetPhase('input'); wcTimer(); }
async function wnReveal(r,label,second,tok){ const g=state.game, target=g.lines[g.targets[g.round]].text; wnRecord(r); wnSetPhase('react'); wnHead();
  if(!(await wnArtistSays(tok,850,live=>wnAdd({k:'a',text:target},live)))) return;
  wnAdd({k:'sys',tone:r.sim>=0.3?'mid':'bad',html:wnNote(r,label,second)}); wnSetPhase('done'); wnHead(); }
async function wnEnd(){ const g=state.game; if(!g) return; const tok=++_wnSeq; wnStopAudio(); wnSetPhase('react');
  if(!g.saved){ saveGameResult(g); g.saved=true; }
  const acc=g.results.filter(x=>x.correct).length/g.targets.length;
  wnTyping(true); await wnWait(900); if(tok!==_wnSeq) return;
  wnAdd({k:'a',text:acc>=0.8?'You really know this one \uD83E\uDEF6':acc>=0.4?'That\u2019s a wrap \uD83C\uDFA4':'We\u2019ll run it back \uD83D\uDE05'});
  await wnWait(500); if(tok!==_wnSeq) return; g.phase='end'; wnAdd({k:'end'}); wnSetPhase('end'); wnHead(); }

/* overrides */
renderGame=function(){ const g=state.game; if(!g) return; if(!g.msgs){ g.msgs=[]; g.phase='intro'; g.try=1; g.typing=false; }
  const existed=!!document.querySelector('#modal [data-game-root]'), light=state.theme==='light';
  const c=wcCfg(), t=wcTheme(), lt=light&&t.f!=='neon';
  $('#modal').innerHTML=`<div data-game-root data-testid="game-fullscreen" class="wc-root ${lt?'is-light':'dark-surface'} ${existed?'':'np-entering'}" data-wcf="${t.f}" data-wct="${t.id}" data-glow="${c.glow}" data-ts="${c.ts}" style="${wcVars(t)}">
    <div class="wc-bg" aria-hidden="true">${img(g.song.coverArt,'wc-bg-img')}<span class="wc-orb is-1"></span><span class="wc-orb is-2"></span><span class="wc-bg-tint"></span></div>
    <div class="wc-wrap">${gxWnSide()}<section class="wc-chat" data-testid="game-chat">${wnHeadHtml()}${wcStyleHtml()}<div class="wc-thread" id="wc-thread" data-testid="game-thread"><div class="wc-start">${wnAv()}<p>${esc(g.song.artist||'Artist')} sends a line. You finish it.</p></div>${g.msgs.map((m,i)=>wnMsgHtml(m,i,false)).join('')}${g.typing?wnTypingHtml():''}</div>${wnComposeHtml()}</section></div></div>`;
  const root=document.querySelector('#modal [data-game-root]'); if(root) root.addEventListener('animationend',e=>{ if(e.target===root) root.classList.remove('np-entering'); });
  icons(); wnBind(); wnSetPhase(g.phase); wnScroll(false); wnVVOn(); syncScrollLock(); };
function wcPickTargets(L,n){ const nk=i=>gnorm(L[i]&&L[i].text||''), cand=[];
  for(let i=2;i<L.length;i++){ const a=nk(i-2), b=nk(i-1), c=nk(i); if(a&&b&&c&&a!==b&&b!==c&&a!==c) cand.push(i); }
  for(let i=cand.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [cand[i],cand[j]]=[cand[j],cand[i]]; }
  const run=(gap,uniq)=>{ const pick=[], used=new Set(); for(const i of cand){ if(pick.length>=n) break; if(pick.some(j=>Math.abs(j-i)<gap)) continue; const w=[nk(i-2),nk(i-1),nk(i)]; if(uniq&&w.some(x=>used.has(x))) continue; pick.push(i); w.forEach(x=>used.add(x)); } return pick; };
  let best=[]; for(const [gap,uniq] of [[5,1],[4,1],[3,1],[5,0],[4,0],[3,0]]){ const p=run(gap,uniq); if(p.length>best.length) best=p; if(best.length>=n||(uniq&&best.length>=Math.min(3,n))) break; }
  return best.sort((a,b)=>a-b); }
const _wnStart=startGame; startGame=function(id){ const before=state.game; wnHalt(); _wnStart.apply(this,arguments); const g=state.game; if(!g||g===before) return;
  const tg=wcPickTargets(g.lines,g.targets.length); if(tg.length){ g.targets=tg; wnHead(); }
  const a=wnAud(); try{ if(g.song.audioUrl&&a.src!==g.song.audioUrl) a.src=g.song.audioUrl; a.muted=true; const p=a.play(); g._unlock=(p&&p.then)?p.then(()=>{ a.pause(); a.muted=false; },()=>{ a.muted=false; }):Promise.resolve(); }catch(e){ g._unlock=Promise.resolve(); }
  try{ if(!(history.state&&history.state.wcGame)) history.pushState(Object.assign({},history.state||{},{wcGame:1}),''); }catch(e){}
  wnIntro(); };
submitAnswer=function(ans,mode,timedOut){ const g=state.game; if(!g||!g.msgs||g.phase!=='input') return; clearGameTimer(); g.answered=true;
  const a=String(ans||'').trim(), gi=document.getElementById('game-input'); if(gi){ gi.value=''; delete gi.dataset.voice; wnGrow(gi); }
  const tok=++_wnSeq, second=g.try>=2; wnStopAudio(); wcPicksDone();
  if(!a){ wnReveal({correct:false,sim:0,exact:false,pts:0,bonus:0},timedOut?'Time\u2019s up!':'Skipped',false,tok); return; }
  wnAdd({k:'me',text:a}); const r=wnScore(a,timedOut);
  if(r.correct){ if(second) r.pts=Math.round(r.pts/2); wnYes(r,second,tok); return; }
  if(!second&&!timedOut){ g.streak=0; wnNope(tok); return; }
  if(second) r.pts=Math.round(r.pts/2); wnReveal(r,wnVerdict(r,timedOut),second,tok); };
gameNext=function(){ const g=state.game; if(!g||!g.msgs||g.phase!=='done') return; clearGameTimer(); g.round++; if(g.round>=g.targets.length){ wnEnd(); return; } wnIntro(); };
gameHint=function(){ const g=state.game; if(!g||!g.msgs||g.phase!=='input') return; const L=g.lines, ti=g.targets[g.round], ctx=[ti-2,ti-1].filter(i=>i>=0&&L[i]);
  const s0=wnT(L[ctx[0]].t), e=wnT(L[ti].t); if(!g.song.audioUrl||!isFinite(s0)||!isFinite(e)||e<=s0){ toast('No audio for this line'); return; }
  wcListen(s0,e+(g.longRound===g.round?0.18:-0.12)); };
function wcListen(s0,stop){ const tok=++_wnSeq; wnStopAudio(); wnPrep(s0).then(ok=>{ if(!ok||tok!==_wnSeq) return; wnPlay().then(p=>{ if(p&&tok===_wnSeq) wnWatch([{t:stop,fn:()=>{ try{ wnAud().pause(); }catch(x){} }}],tok); }); }); }
let _wcPopSkip=false;
function wcHistPop(){ try{ if(history.state&&history.state.wcGame){ _wcPopSkip=true; history.back(); } }catch(e){} }
const _wnClose=gameClose; gameClose=function(){ wnHalt(); const r=_wnClose.apply(this,arguments); wcHistPop(); return r; };
const _wnCM=closeModal; closeModal=function(){ let pop=false; if(state.game&&document.querySelector('#modal [data-game-root]')){ wnHalt(); state.game=null; pop=true; } const r=_wnCM.apply(this,arguments); if(pop) wcHistPop(); return r; };
window.addEventListener('popstate',e=>{ if(_wcPopSkip){ _wcPopSkip=false; e.stopImmediatePropagation(); return; }
  if(state.game&&document.querySelector('#modal [data-game-root]')){ e.stopImmediatePropagation(); wnHalt(); _wnClose(); } },true);
const _wnVoice=gameVoiceInput; gameVoiceInput=function(){ _wnVoice.apply(this,arguments); try{ if(gameRecog&&!gameRecog._wn){ const f=gameRecog.onresult; gameRecog.onresult=e=>{ f(e); const gi=document.getElementById('game-input'); if(gi) wnGrow(gi); }; gameRecog._wn=1; } }catch(e){} };

/* chat styles: glass (default), neon looks, flat classics */
const WC_THEMES=[{id:'glass',name:'Glass',f:'glass',me:'var(--treesh-purple)'},{id:'neon',name:'Neon',f:'neon',me:'#ff2d78',a:'#22d3ee'},{id:'synth',name:'Synthwave',f:'neon',me:'#ff3df2',a:'#ffb547'},{id:'toxic',name:'Toxic',f:'neon',me:'#a3ff3d',a:'#3dd9ff'},{id:'ice',name:'Ice',f:'neon',me:'#7dd3fc',a:'#d8b4fe'},{id:'classic',name:'Classic',f:'solid',me:'#0a84ff'},{id:'mono',name:'Mono',f:'solid',me:'#e5e5ea',mf:'#0b0b0f'}];
function wcCfg(){ const c=LS.get('treesh_wn_style',null)||{}; return {theme:WC_THEMES.some(t=>t.id===c.theme)?c.theme:'glass', glow:['0','1','2'].includes(String(c.glow))?String(c.glow):'1', ts:['s','m','l'].includes(c.ts)?c.ts:'m'}; }
function wcTheme(){ const id=wcCfg().theme; return WC_THEMES.find(t=>t.id===id)||WC_THEMES[0]; }
function wcVars(t){ return `--wc-me:${t.me};--wc-mf:${t.mf||'#fff'};--wc-nm:${t.me};--wc-na:${t.a||t.me}`; }
function wcSeg(k,opts,cur){ return `<div class="wc-seg" role="group">${opts.map(([v,l])=>`<button type="button" data-act="wcx-${k}" data-val="${v}" data-testid="game-style-${k}-${v}" aria-pressed="${cur===v}" class="press${cur===v?' on':''}">${l}</button>`).join('')}</div>`; }
function wcStyleHtml(){ const c=wcCfg();
  return `<div class="wc-style" id="wc-style" data-testid="game-style-panel" hidden><div class="wc-style-h"><b>Chat style</b><button type="button" data-act="wcx-style" aria-label="Close" data-testid="game-style-close" class="wc-hbtn is-sm press"><i data-lucide="x" style="width:16px;height:16px"></i></button></div>
    <div class="wc-themes">${WC_THEMES.map(t=>`<button type="button" data-act="wcx-theme" data-val="${t.id}" data-testid="game-theme-${t.id}" aria-pressed="${c.theme===t.id}" class="wc-th press${c.theme===t.id?' on':''}" style="${wcVars(t)}"><span class="wc-sw" data-f="${t.f}"><i class="a"></i><i class="m"></i></span><span class="wc-th-n">${t.name}</span></button>`).join('')}</div>
    <p class="wc-style-l">Glow</p>${wcSeg('glow',[['0','Off'],['1','Soft'],['2','Max']],c.glow)}
    <p class="wc-style-l">Text size</p>${wcSeg('ts',[['s','Small'],['m','Medium'],['l','Large']],c.ts)}</div>`; }
function wcApply(){ const r=document.querySelector('#modal [data-game-root]'); if(!r) return; const c=wcCfg(), t=wcTheme(), lt=state.theme==='light'&&t.f!=='neon';
  r.dataset.wcf=t.f; r.dataset.wct=t.id; r.dataset.glow=c.glow; r.dataset.ts=c.ts; r.classList.toggle('is-light',lt); r.classList.toggle('dark-surface',!lt);
  [['--wc-me',t.me],['--wc-mf',t.mf||'#fff'],['--wc-nm',t.me],['--wc-na',t.a||t.me]].forEach(([k,v])=>r.style.setProperty(k,v));
  r.querySelectorAll('#wc-style [data-act^="wcx-"][data-val]').forEach(b=>{ const k=b.dataset.act.slice(4), on=(k==='theme'?c.theme:k==='glow'?c.glow:c.ts)===b.dataset.val; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); });
  wnScroll(false); }
function wcSet(k,v){ const c=wcCfg(); c[k]=v; LS.set('treesh_wn_style',c); wcApply(); }
function wcToggle(force){ const p=document.getElementById('wc-style'); if(!p) return; const open=force!=null?force:p.hidden; p.hidden=!open; const b=document.querySelector('[data-testid="game-style-button"]'); if(b) b.classList.toggle('on',open); }
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act^="wcx-"]');
  if(!t){ const p=document.getElementById('wc-style'); if(p&&!p.hidden&&!e.target.closest('#wc-style')) wcToggle(false); return; }
  const a=t.dataset.act; if(a==='wcx-style') wcToggle(); else if(a==='wcx-theme') wcSet('theme',t.dataset.val); else if(a==='wcx-glow') wcSet('glow',t.dataset.val); else if(a==='wcx-ts') wcSet('ts',t.dataset.val); });

/* hints that cost Starlites */
const WC_HINTS=[{id:'longer',ic:'audio-lines',name:'Listen longer',desc:'Hear 0.3s more this round',cost:10},{id:'first',ic:'type',name:'First word',desc:'See how the line starts',cost:10},{id:'peek',ic:'ear',name:'Audio peek',desc:'Hear the first second',cost:15},{id:'letters',ic:'whole-word',name:'Letter blanks',desc:'First letter of every word',cost:20},{id:'pick',ic:'list-checks',name:'Pick from 3',desc:'Choose between three lines',cost:30},{id:'freeze',ic:'snowflake',name:'Freeze timer',desc:'Stop the clock this round',cost:10,timer:1}];
function wcSpend(n,reason){ const st=state.stars; if((st.points||0)<n){ toast('Not enough Starlites','You need '+n+' for this hint'); return false; }
  st.points=(st.points||0)-n; st.log=st.log||[]; st.log.unshift({t:Date.now(),a:-n,r:reason}); if(st.log.length>50) st.log.length=50; saveStars(); updateStarDisplays(); toast('-'+n+' Starlites',reason,{star:true}); return true; }
function wcUsed(){ const g=state.game; g.hintsUsed=g.hintsUsed||{}; return g.hintsUsed[g.round]=g.hintsUsed[g.round]||{}; }
function wcBase(){ const g=state.game, full=g.lines[g.targets[g.round]].text; return (full.replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim())||full; }
function wcTimer(){ const g=state.game; if(g&&g.frozenRound===g.round){ const n=document.getElementById('game-timer-num'); if(n) n.textContent='Frozen'; return; } startGameTimer(); }
function wcHintsHtml(){ const g=state.game, used=wcUsed(), bal=state.stars.points||0;
  return `<div class="wc-hints-h"><b>Hints</b><span data-testid="game-hints-balance"><i data-lucide="sparkles" style="width:12px;height:12px"></i>${fmtNum(bal)} Starlites</span></div><div class="wc-hints-row">${WC_HINTS.filter(h=>!h.timer||g.timer).map(h=>{ const u=!!used[h.id], poor=bal<h.cost;
    return `<button type="button" data-act="wcx-hint" data-val="${h.id}" data-testid="game-hint-${h.id}" class="wc-hint press${u?' is-used':''}${poor&&!u?' is-poor':''}"${u?' disabled':''}><i data-lucide="${h.ic}" style="width:18px;height:18px"></i><b>${h.name}</b><small>${h.desc}</small><em>${u?'Used':`<i data-lucide="sparkles" style="width:11px;height:11px"></i>${h.cost}`}</em></button>`; }).join('')}</div>`; }
function wcHintsToggle(force){ const t=document.getElementById('wc-hints'); if(!t) return; const g=state.game; const open=force!=null?force:t.hidden; if(open&&(!g||g.phase!=='input')) return;
  if(open){ t.innerHTML=wcHintsHtml(); icons(); } t.hidden=!open; const b=document.getElementById('wc-hints-btn'); if(b) b.classList.toggle('on',open); }
function wcPicksDone(){ const g=state.game; if(!g||!g.msgs) return; g.msgs.forEach(m=>{ if(m.k==='pick') m.used=true; }); document.querySelectorAll('#wc-thread [data-act="wcx-pick"]').forEach(b=>b.disabled=true); }
function wcUseHint(id){ const g=state.game; if(!g||g.phase!=='input') return; const h=WC_HINTS.find(x=>x.id===id), used=wcUsed(); if(!h||used[id]) return;
  const L=g.lines, ti=g.targets[g.round], base=wcBase();
  if((id==='peek'||id==='longer')&&!(g.song.audioUrl&&isFinite(wnT(L[ti].t)))){ toast('No audio for this line'); return; }
  if(!wcSpend(h.cost,'What\u2019s Next? hint: '+h.name)) return; used[id]=1; wcHintsToggle(false);
  const gi=document.getElementById('game-input');
  if(id==='first'){ const w=base.split(' ')[0]||''; wnAdd({k:'hint',html:`Starts with <b>\u201C${esc(w)}\u2026\u201D</b>`}); if(gi&&!gi.value.trim()){ gi.value=w+' '; wnGrow(gi); } }
  else if(id==='letters'){ const sk=base.split(' ').map(w=>w.replace(/^([^\p{L}\p{N}]*)([\p{L}\p{N}])(.*)$/u,(m0,a,b,c)=>a+b+c.replace(/[\p{L}\p{N}]/gu,'_'))).join('  '); wnAdd({k:'hint',html:`<b class="wc-blanks">${esc(sk)}</b>`}); }
  else if(id==='peek'){ const s0=wnT(L[ti].t); wnAdd({k:'hint',html:'Peeking at the first second\u2026'}); wcListen(s0,s0+1.3); }
  else if(id==='longer'){ const e=wnT(L[ti].t), p0=wnT(L[ti-1]&&L[ti-1].t); g.longRound=g.round; wnAdd({k:'hint',html:'Listening a little longer\u2026 <b>+0.3s</b> this round'}); wcListen(isFinite(p0)&&p0<e?p0:Math.max(0,e-4),e+0.18); }
  else if(id==='pick'){ const norm=x=>gnorm(x), ban=new Set([norm(base),norm(L[ti-1]&&L[ti-1].text||''),norm(L[ti-2]&&L[ti-2].text||'')]); const pool=[];
    L.forEach((l,i)=>{ const t=(l.text||'').replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim(); const n=norm(t); if(t&&!ban.has(n)&&!pool.some(p=>norm(p)===n)) pool.push(t); });
    for(let i=pool.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [pool[i],pool[j]]=[pool[j],pool[i]]; }
    const opts=[base].concat(pool.slice(0,2)); for(let i=opts.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [opts[i],opts[j]]=[opts[j],opts[i]]; }
    wnAdd({k:'pick',opts}); }
  else if(id==='freeze'){ g.frozenRound=g.round; clearGameTimer(); const n=document.getElementById('game-timer-num'); if(n) n.textContent='Frozen'; wnAdd({k:'hint',html:'Timer frozen for this round'}); }
  if(gi&&wnFine()) gi.focus({preventScroll:true}); }
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-act="wcx-hints"],[data-act="wcx-hint"],[data-act="wcx-pick"]'); if(!t) return;
  const a=t.dataset.act; if(a==='wcx-hints') wcHintsToggle(); else if(a==='wcx-hint') wcUseHint(t.dataset.val);
  else if(a==='wcx-pick'){ const g=state.game; if(!g||g.phase!=='input') return; const m=g.msgs[+t.dataset.msg]; if(!m||m.used) return; submitAnswer(m.opts[+t.dataset.i],'type'); } });
