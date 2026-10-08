/* ---------- P9zg: This or That on two premium turntables (tonearm drops when a clip plays) + a champion stage ---------- */
function ttPlayBtn(side,on,title){ return `<button data-act="tot-preview" data-side="${side}" data-testid="tot-preview-${side}" aria-pressed="${on}" aria-label="${on?'Pause':'Play'} ${esc(title)}" class="tt-play press${on?' on':''}">${on?'<span class="tt-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Playing':'<i data-lucide="play" class="fill-current"></i>Play 30s'}</button>`; }
function ttDeck(s,side,playing,fx){ const g=state.tot, champ=side==='a', cls=fx?(side==='b'?' is-enter':fx==='a'?' is-defend':fx==='b'?' is-crowned':''):'';
  return `<section class="tt-deck is-${side}${playing?' is-play':''}${cls}" data-testid="tot-deck-${side}">
    <div class="tt-plinth"><i class="tt-rv r1"></i><i class="tt-rv r2"></i><i class="tt-rv r3"></i><i class="tt-rv r4"></i>
      <div class="tt-tt" role="button" tabindex="-1" data-act="tot-preview" data-side="${side}" data-testid="tot-vinyl-${side}" aria-label="${playing?'Pause':'Play'} ${esc(s.title)}">
        <div class="tt-platter"><div class="tt-vinyl"><span class="tt-label">${img(s.coverArt,'')}</span></div></div><span class="tt-sheen"></span><span class="tt-spindle"></span>
        <span class="tt-rest"></span><div class="tt-arm"><i class="tt-cw"></i><i class="tt-rod"></i><i class="tt-head"></i></div><span class="tt-pivot"></span>
        <span class="tt-led"><i></i><b class="font-doto">33</b></span>
      </div>
      <div class="tt-info">
        ${champ?`<span class="tt-chip is-champ" data-testid="tot-champ-chip"><i data-lucide="crown"></i>Champ \u00b7 ${g.champWins}</span>`:`<span class="tt-chip"><i data-lucide="swords"></i>Challenger</span>`}
        <h2 class="tt-t clamp-2" data-testid="tot-title-${side}">${esc(s.title)}</h2><p class="tt-a clamp-1">${esc(s.artist)}</p>
        <div class="tt-btns">${ttPlayBtn(side,playing,s.title)}<button data-act="tot-pick" data-side="${side}" data-testid="tot-pick-${side}" class="tt-pick press"><i data-lucide="heart"></i>Pick this</button></div>
      </div>
      <span class="tt-prog" aria-hidden="true"><i></i></span>
    </div></section>`; }
function ttTopHtml(){ const g=state.tot, mx=g.maxSkips||3, left=Math.max(0,mx-g.strikes);
  const hud=g.over?'':`<div class="tt-hud"><span class="tt-pill" data-testid="tot-matchup"><small>Matchup</small><b class="font-doto">${g.matchups+1}${g.maxLen?`<em>/${g.maxLen}</em>`:''}</b></span><span class="tt-pill is-streak${g.champWins>0?' is-hot':''}" data-testid="tot-streak" title="Champion streak"><i data-lucide="flame"></i><b class="font-doto">${g.champWins}</b></span><span class="tt-pill is-skips" title="Skips left" aria-label="${left} skips left" data-testid="tot-strikes">${Array.from({length:mx}).map((_,i)=>`<i class="${i<g.strikes?'is-used':''}"></i>`).join('')}</span></div>`;
  return `<header class="tt-top"><div class="tt-ttl"><p class="tt-k"><i data-lucide="swords"></i>Head to head</p><h1 class="tt-h font-display">This <em>or</em> That</h1></div>${hud}<button data-act="tot-close" aria-label="Close" data-testid="tot-close-button" class="tt-x press"><i data-lucide="x"></i></button></header>`; }
function ttBattleHtml(fx,intro){ const g=state.tot, pa=g.preview==='a', pb=g.preview==='b', mx=g.maxSkips||3;
  return `<div class="tt-stage${pa?' play-a':pb?' play-b':''}${intro?' tt-intro':''}" data-testid="tot-stage">${ttDeck(g.a,'a',pa,fx)}<div class="tt-vs" aria-hidden="true"><span class="tt-vs-ring"></span><b class="font-display">VS</b></div>${ttDeck(g.b,'b',pb,fx)}</div>
    <div class="tt-foot"><button data-act="tot-skip" data-testid="tot-skip" class="tt-skip press"><i data-lucide="skip-forward"></i>Skip <span>(${Math.max(0,mx-g.strikes)} left)</span></button></div>`; }
function ttChampHtml(){ const g=state.tot, s=g.champion||g.a, total=(state.totWins.wins&&state.totWins.wins[s.id])||0, run=(g.runWins&&g.runWins[s.id])||g.champRunWins||0, mu=g.matchups||0;
  return `<div class="tt-champ" data-testid="tot-champion"><p class="tt-crown"><i data-lucide="crown"></i>Champion \u00b7 Most wins</p>
    <div class="tt-hero" aria-hidden="true"><span class="tt-rays"></span><div class="tt-hvinyl"><div class="tt-hdisc"><span class="tt-label">${img(s.coverArt,'')}</span></div></div><div class="tt-sleeve">${img(s.coverArt,'')}</div>${[1,2,3,4,5,6].map(i=>`<i class="tt-spark s${i}"></i>`).join('')}</div>
    <h2 class="tt-ct clamp-2" data-testid="tot-champion-title">${esc(s.title)}</h2><p class="tt-ca">${esc(s.artist)}</p>
    <div class="tt-cchips"><span class="is-run"><b class="font-doto">${run}</b>win${run!==1?'s':''} this run</span><span class="is-total"><b class="font-doto">${total}</b>total win${total!==1?'s':''}</span><span><b class="font-doto">${mu}</b>matchup${mu!==1?'s':''}</span></div>
    <div class="tt-cbtns"><button data-act="tot-play-champ" data-testid="tot-play-champ" class="tt-cbtn is-gold press"><i data-lucide="play" class="fill-current"></i>Play full song</button><button data-act="tot-again" data-testid="tot-again" class="tt-cbtn press"><i data-lucide="rotate-ccw"></i>Play again</button></div></div>`; }
renderTot=function(){ const g=state.tot; if(!g) return; const m=$('#modal'); if(!m) return; const existed=!!m.querySelector('[data-tot-root]'), fx=g._fx||null; g._fx=null;
  const bg=g.over?(g.champion?`<span class="tt-bgc">${img(g.champion.coverArt,'')}</span>`:''):(g.a&&g.b?`<span class="tt-bga">${img(g.a.coverArt,'')}</span><span class="tt-bgb">${img(g.b.coverArt,'')}</span>`:'');
  m.innerHTML=`<div data-tot-root data-testid="tot-fullscreen" class="tt-root ${state.theme==='light'?'is-light':'dark-surface'}${existed?'':' np-entering'}${g.over?' is-over':''}"><div class="tt-bg" aria-hidden="true">${bg}<i class="tt-orb o1"></i><i class="tt-orb o2"></i><i class="tt-grain"></i></div>
    <div class="tt-wrap">${ttTopHtml()}${g.over?ttChampHtml():ttBattleHtml(fx,!existed)}</div></div>`;
  const r=m.querySelector('[data-tot-root]'); if(r) r.addEventListener('animationend',e=>{ if(e.target===r) r.classList.remove('np-entering'); });
  icons(); };
totUpdatePreviewUI=function(){ const g=state.tot; if(!g) return; const st=document.querySelector('[data-tot-root] .tt-stage'); if(!st) return; st.classList.toggle('play-a',g.preview==='a'); st.classList.toggle('play-b',g.preview==='b');
  ['a','b'].forEach(side=>{ const d=st.querySelector('.tt-deck.is-'+side), on=g.preview===side, s=side==='a'?g.a:g.b; if(!d||!s) return; d.classList.toggle('is-play',on);
    const tt=d.querySelector('.tt-tt'); if(tt) tt.setAttribute('aria-label',(on?'Pause ':'Play ')+(s.title||'')); const b=d.querySelector('.tt-play'); if(b&&b.classList.contains('on')!==on) b.outerHTML=ttPlayBtn(side,on,s.title); });
  icons(); };
/* picking: the winner flares, the loser slides away, then the next challenger drops in */
function ttCalm(){ return document.documentElement.classList.contains('perf-mode')||matchMedia('(prefers-reduced-motion: reduce)').matches; }
document.addEventListener('click',e=>{ const t=e.target.closest&&e.target.closest('[data-tot-root] [data-act^="tot-"]'); if(!t) return; const g=state.tot, a=t.dataset.act; if(!g||g.over) return;
  if(g._busy&&(a==='tot-preview'||a==='tot-pick'||a==='tot-skip')){ e.preventDefault(); e.stopPropagation(); return; } if(a!=='tot-pick'&&a!=='tot-skip') return;
  e.preventDefault(); e.stopPropagation(); const skip=t.dataset.act==='tot-skip', side=t.dataset.side==='b'?'b':'a', root=t.closest('[data-tot-root]');
  g._busy=true; totStopPreview(); totUpdatePreviewUI(); try{ navigator.vibrate&&navigator.vibrate(skip?6:14); }catch(x){}
  root.classList.add(skip?'tt-skipping':'tt-pick-'+side); if(!skip){ const p=root.querySelector('.tt-deck.is-'+side+' .tt-plinth'); if(p) p.insertAdjacentHTML('beforeend','<span class="tt-plus font-doto" aria-hidden="true">+1</span>'); }
  setTimeout(()=>{ if(state.tot!==g) return; g._busy=false; g._fx=skip?'skip':side; if(skip) totSkip(); else totPick(side); },ttCalm()?60:520); },true);
