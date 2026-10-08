/* ===== Screens: menu, mode sheet, shop, settings, help ===== */
let currentScreen='menu';
function renderMenu(){
  const wasMenu=currentScreen==='menu'; currentScreen='menu'; stopGame(); if(!wasMenu) window.scrollTo(0,0);
  const name=Treesh.name(); const dd=S.daily[todayKey()];
  const heroE=shuffle(ALL_EMOJIS).slice(0,9); const on=[0,4,8];
  const st=S.stats; const nb=BADGES.filter(b=>S.badges[b.id]).length;
  $('#screen').innerHTML=`
  <section class="hero" data-testid="menu-hero">
    <div class="hero-main glass">
      <div class="hero-emojis" aria-hidden="true">${heroE.map((e,i)=>`<span class="${on.includes(i)?'on':''}" style="animation-delay:${i*.2}s">${e}</span>`).join('')}</div>
      <p class="eyebrow">Treesh Games · Nects</p>
      <h1>Spot it. Tap it. Nect it.</h1>
      <p class="lead">Welcome back, <b style="color:#fff" data-testid="menu-nickname">${esc(name)}</b>. Thirteen ways to play, and every Starlite you win goes straight to your Treesh wallet.</p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-lg" data-act="quick-play" data-testid="quick-play-button">${ic('play',18)}Quick play</button>
        <button class="btn btn-ghost btn-lg" data-act="help" data-testid="how-to-play-button">${ic('book-open',18)}How to play</button>
      </div>
    </div>
    <div class="hero-side">
      <div class="daily-card glass" data-act="mode" data-mode="daily" data-testid="daily-challenge-card">
        <p class="eyebrow" style="color:var(--gold)">${ic('calendar-days',13)} Daily Challenge · ${new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}</p>
        <h3>${dd&&dd.won?'Beaten today':'Today\u2019s board is live'}</h3>
        <p class="text2" style="font-size:13px;max-width:30ch">${dd&&dd.won?`You beat the Daily Rival ${dd.score}. Come back tomorrow for a new board.`:'Same seeded 4x4 board for everyone. Win it for +25 Starlites.'}</p>
        <div style="margin-top:14px;display:flex;gap:8px">${dd&&dd.won?`<span class="tag gold">${ic('check',12)}Done</span>`:`<span class="tag gold">${ic('sparkles',12)}+25</span>`}${dd&&dd.tries?`<span class="tag">${dd.tries} ${dd.tries===1?'try':'tries'}</span>`:''}</div>
      </div>
      <div class="stat-strip">
        <div class="stat-box glass" data-testid="menu-stat-wins"><span class="num">${fmt(st.wins)}</span><small>Wins</small></div>
        <div class="stat-box glass" data-testid="menu-stat-streak"><span class="num">${fmt(st.bestStreak)}</span><small>Best streak</small></div>
        <div class="stat-box glass press" data-act="open-profile" data-tab="badges" data-testid="menu-stat-badges" style="cursor:pointer"><span class="num">${nb}</span><small>Badges</small></div>
      </div>
    </div>
  </section>
  <div class="section-head"><div><p class="eyebrow">Pick your game</p><h2>Game modes</h2></div>
    <div class="quick-links"><button class="btn btn-ghost btn-sm" data-act="shop" data-testid="open-shop-button">${ic('shopping-bag',15)}Shop</button><button class="btn btn-ghost btn-sm" data-act="settings" data-testid="open-settings-button">${ic('settings',15)}Settings</button></div></div>
  <section class="mode-grid" data-testid="mode-grid">${MODES.map((m,i)=>modeCard(m,i)).join('')}</section>
  <p class="foot-note">${ic('shield-check',15)}Starlites are shared with your Treesh account. Nects stats show up in Treesh under Profile, Stats, Arcade games.</p>`;
  icons();
}
function modeMeta(m){
  const b=S.stats.byMode[m.id]||{};
  if(m.price&&!S.owned.modes.includes(m.id)) return `<span class="tag lock">${ic('lock',11)}Locked</span><span class="tag gold">${ic('sparkles',11)}${m.price}</span>`;
  if(m.id==='survival') return `<span class="tag">${ic('trophy',11)}Best wave ${S.survivalBest||0}</span>`;
  if(m.id==='puzzle'){ const n=Object.keys(S.puzzle).length; return `<span class="tag">${n}/40 cleared</span>`; }
  if(m.id==='daily'){ const d=S.daily[todayKey()]; return d&&d.won?`<span class="tag gold">Done today</span>`:`<span class="tag new">New board</span>`; }
  if(m.id==='zen') return `<span class="tag">${fmt(S.stats.zenLines)} lines</span>`;
  const isNew=!['classic','custom','mirror'].includes(m.id)&&!b.played;
  if(m.id==='bingo'&&b.played) return `<span class="tag">${b.wins||0} wins</span>`;
  return `${isNew?'<span class="tag new">New</span>':''}${b.played?`<span class="tag">${b.wins||0} wins</span>`:''}`;
}
function modeCard(m,i){
  return `<button class="mode-card glass ${m.feature?'feature':''}" style="--hue:${m.hue};animation-delay:${i*.04}s" data-act="mode" data-mode="${m.id}" data-testid="mode-card-${m.id}">
    <span class="mode-ic">${ic(m.icon,20)}</span><div><h3>${m.name}</h3><p style="margin-top:4px">${m.feature?m.desc:m.tag}</p></div><div class="meta">${modeMeta(m)}</div></button>`;
}

/* Mode setup sheet */
let sheet=null;
function openModeSheet(id){
  const m=MODE_BY_ID[id]; if(!m) return;
  const st=S.settings;
  sheet={mode:id,diff:st.diff,grid:id==='daily'?'4x4':st.grid,rounds:st.rounds,p2name:st.p2name,rotateP2:st.rotateP2,level:puzzleNextLevel(),custom:{...S.custom}};
  renderModeSheet();
}
function renderModeSheet(){
  const m=MODE_BY_ID[sheet.mode]; const locked=m.price&&!S.owned.modes.includes(m.id);
  const seg=(k,opts,cur,label)=>`<p class="field-label">${label}</p><div class="seg" data-testid="setup-${k}">${opts.map(([v,l])=>`<button class="${String(cur)===String(v)?'on':''}" data-act="sheet-set" data-k="${k}" data-v="${v}" data-testid="setup-${k}-${v}">${l}</button>`).join('')}</div>`;
  const diffOpts=Object.entries(DIFFS).map(([k,d])=>[k,d.name]);
  const gridOpts=GRIDS.map(g=>[g,g.replace('x','×')]);
  const roundOpts=[[1,'1 round'],[3,'First to 3'],[5,'First to 5']];
  let body='';
  (m.setup||[]).forEach(s=>{
    if(s==='diff') body+=seg('diff',diffOpts,sheet.diff,'Bot difficulty')+(sheet.diff==='abysmal'?`<p class="muted" style="font-size:12px;margin-top:8px">No powerups for you on Abysmal. 6x Starlites.</p>`:'');
    if(s==='grid') body+=seg('grid',gridOpts,sheet.grid,'Board size');
    if(s==='rounds') body+=seg('rounds',roundOpts,sheet.rounds,'Match length');
    if(s==='p2') body+=`<p class="field-label">Player 2 name</p><input class="text-input" id="p2name" maxlength="16" value="${esc(sheet.p2name)}" data-testid="setup-p2-name">
      <div class="toggle-row"><div><b>Flip Player 2\u2019s board</b><small>For sitting face to face</small></div><button class="switch ${sheet.rotateP2?'on':''}" data-act="sheet-toggle" data-k="rotateP2" data-testid="setup-rotate-p2"></button></div>`;
    if(s==='level') body+=puzzleLevelPicker();
    if(s==='custom'){ const c=sheet.custom;
      body+=seg('c.grid',gridOpts,c.grid,'Board size')+seg('c.diff',diffOpts,c.diff,'Bot difficulty')+seg('c.speed',[['slow','Slow'],['normal','Normal'],['fast','Fast'],['extreme','Extreme']],c.speed,'Bot speed')+seg('c.rounds',roundOpts,c.rounds,'Match length');
      body+=`<p class="field-label">Lines that count</p>`+[['h','Rows'],['v','Columns'],['d','Diagonals']].map(([k,l])=>`<div class="toggle-row"><b>${l}</b><button class="switch ${c[k]?'on':''}" data-act="sheet-toggle" data-k="c.${k}" data-testid="setup-custom-${k}"></button></div>`).join('');
      body+=`<div class="toggle-row"><div><b>My powerups</b></div><button class="switch ${c.powerups?'on':''}" data-act="sheet-toggle" data-k="c.powerups" data-testid="setup-custom-powerups"></button></div>
        <div class="toggle-row"><div><b>Bot powerups</b></div><button class="switch ${c.botPU?'on':''}" data-act="sheet-toggle" data-k="c.botPU" data-testid="setup-custom-botpu"></button></div>`;
    }
  });
  if(sheet.mode==='daily'){ const d=S.daily[todayKey()]; body+=`<div class="list-row" style="margin-top:16px">${ic('calendar-days',18)}<div class="grow"><b>${todayKey()}</b><small>4×4 · Daily Rival · First to 2${d&&d.won?` · You won ${d.score}`:''}</small></div>${d&&d.won?'<span class="res win">DONE</span>':''}</div>`; }
  openModal(`
    <button class="btn btn-ghost btn-icon modal-x" data-act="close-modal" data-testid="mode-sheet-close" aria-label="Close">${ic('x',18)}</button>
    <div style="display:flex;gap:14px;align-items:center;padding-right:44px"><span class="mode-ic" style="--hue:${m.hue};width:52px;height:52px;border-radius:17px">${ic(m.icon,24)}</span><div><p class="eyebrow">${esc(m.tag)}</p><h2 data-testid="mode-sheet-title">${m.name}</h2></div></div>
    <p class="text2" style="margin-top:14px;font-size:14px;line-height:1.5">${m.desc}</p>
    <ul class="rules">${m.rules.map(r=>`<li>${ic('check',15)}<span>${r}</span></li>`).join('')}</ul>
    ${locked?'':body}
    <div style="margin-top:24px;display:flex;gap:10px">
      ${locked?`<button class="btn btn-gold btn-lg" style="flex:1" data-act="unlock-mode" data-mode="${m.id}" data-testid="unlock-mode-button" ${Treesh.balance()<m.price?'disabled':''}>${ic('lock-open',18)}Unlock for ${m.price} Starlites</button>`
        :`<button class="btn btn-primary btn-lg" style="flex:1" data-act="start-mode" data-testid="start-match-button">${ic('play',18)}${m.id==='puzzle'?`Play level ${sheet.level}`:'Start'}</button>`}
    </div>
    ${locked&&Treesh.balance()<m.price?`<p class="muted" style="font-size:12px;margin-top:10px;text-align:center">You need ${m.price-Treesh.balance()} more Starlites.</p>`:''}`,{testid:'mode-sheet'});
}
function sheetSet(k,v){
  if(k.startsWith('c.')){ const kk=k.slice(2); sheet.custom[kk]=kk==='rounds'?+v:v; }
  else sheet[k]=(k==='rounds'||k==='level')?+v:v;
  const p2=$('#p2name'); if(p2) sheet.p2name=p2.value;
  const sc=$('#modal-root .modal').scrollTop; renderModeSheet(); const md=$('#modal-root .modal'); if(md){ md.scrollTop=sc; md.style.animation='none'; $('#modal-root .backdrop').style.animation='none'; }
}
function sheetToggle(k){
  if(k.startsWith('c.')){ const kk=k.slice(2); sheet.custom[kk]=!sheet.custom[kk]; if(!sheet.custom.h&&!sheet.custom.v&&!sheet.custom.d) sheet.custom.h=true; }
  else sheet[k]=!sheet[k];
  sheetSet('_noop','');
}
function startFromSheet(){
  const p2=$('#p2name'); if(p2) sheet.p2name=(p2.value||'').trim()||'Player 2';
  const m=sheet.mode;
  if(['classic','blitz','gravity','fog','chaos','mirror','survival','zen','pass'].includes(m)){
    if(MODE_BY_ID[m].setup.includes('diff')) S.settings.diff=sheet.diff;
    S.settings.grid=sheet.grid; if(MODE_BY_ID[m].setup.includes('rounds')) S.settings.rounds=sheet.rounds;
  }
  if(m==='pass'){ S.settings.p2name=sheet.p2name; S.settings.rotateP2=sheet.rotateP2; }
  if(m==='custom') S.custom={...sheet.custom};
  S.lastMode=m; saveNects(); closeModal();
  if(m==='puzzle') return startPuzzle(sheet.level);
  if(m==='bingo'){ S.settings.diff=sheet.diff; S.settings.rounds=sheet.rounds; saveNects(); return startBingo({diff:sheet.diff,rounds:sheet.rounds,pack:S.equipped.pack}); }
  startMatch(buildConfig(m,sheet));
}

/* Shop */
let shopTab='powerups';
function openShop(tab){ if(tab) shopTab=tab; renderShop(); }
function renderShop(keepScroll){
  const bal=Treesh.balance(); let items='';
  const buyBtn=(kind,id,price,owned,equipped)=>{
    if(owned&&equipped!==undefined) return equipped?`<span class="tag new">${ic('check',11)}Equipped</span>`:`<button class="btn btn-ghost btn-sm" data-act="equip" data-kind="${kind}" data-id="${id}" data-testid="equip-${kind}-${id}">Equip</button>`;
    if(owned) return `<span class="tag new">${ic('check',11)}Owned</span>`;
    return `<button class="btn btn-gold btn-sm" data-act="buy" data-kind="${kind}" data-id="${id}" data-testid="buy-${kind}-${id}" ${bal<price?'disabled':''}>${ic('sparkles',13)}${price}</button>`;
  };
  if(shopTab==='powerups') items=Object.entries(POWERUPS).map(([id,p])=>`<div class="shop-item ${S.owned.powerups.includes(id)?'owned':''}" data-testid="shop-item-${id}"><span class="big">${p.icon}</span><b>${p.name}</b><p>${p.desc}</p>${buyBtn('powerups',id,p.price,S.owned.powerups.includes(id))}</div>`).join('');
  if(shopTab==='themes') items=THEMES.map(t=>{ const a=t.a==='accent'?Treesh.accent():t.a; return `<div class="shop-item ${S.owned.themes.includes(t.id)?'owned':''}" data-testid="shop-item-${t.id}"><div class="swatch" style="background:linear-gradient(135deg,${a},${t.b})"></div><b>${t.name}</b><p>${t.id==='treesh'?'Follows your Treesh accent color.':'Board color theme.'}</p>${buyBtn('themes',t.id,t.price,S.owned.themes.includes(t.id),S.equipped.theme===t.id)}</div>`; }).join('');
  if(shopTab==='packs') items=Object.entries(PACKS).map(([id,p])=>`<div class="shop-item ${S.owned.packs.includes(id)?'owned':''}" data-testid="shop-item-${id}"><span class="big">${p.icon}</span><b>${p.name}</b><p>${p.desc||((p.e||[]).slice(0,8).join(' '))}</p>${buyBtn('packs',id,p.price,S.owned.packs.includes(id),S.equipped.pack===id)}</div>`).join('');
  if(shopTab==='modes') items=MODES.filter(m=>m.price).map(m=>`<div class="shop-item ${S.owned.modes.includes(m.id)?'owned':''}" data-testid="shop-item-${m.id}"><span class="mode-ic" style="--hue:${m.hue}">${ic(m.icon,20)}</span><b>${m.name}</b><p>${m.desc}</p>${buyBtn('modes',m.id,m.price,S.owned.modes.includes(m.id))}</div>`).join('');
  const sc=keepScroll&&$('#modal-root .modal')?$('#modal-root .modal').scrollTop:0;
  openModal(`<button class="btn btn-ghost btn-icon modal-x" data-act="close-modal" data-testid="shop-close" aria-label="Close">${ic('x',18)}</button>
    <p class="eyebrow">Spend your Treesh Starlites</p><h2>Shop</h2>
    <div class="list-row" style="margin:14px 0 14px;border-color:rgba(var(--gold-rgb),.3)"><span style="color:var(--gold)">${ic('sparkles',20)}</span><div class="grow"><b>Balance</b><small>Shared with Treesh</small></div><span class="num" style="font-size:22px" data-star-count data-testid="shop-balance">${fmt(bal)}</span></div>
    <div class="tabs no-scrollbar">${[['powerups','Powerups'],['themes','Themes'],['packs','Emoji packs'],['modes','Modes']].map(([id,l])=>`<button class="${shopTab===id?'on':''}" data-act="shop-tab" data-tab="${id}" data-testid="shop-tab-${id}">${l}</button>`).join('')}</div>
    <div class="shop-grid">${items}</div>`,{wide:true,testid:'shop-modal'});
  if(keepScroll){ const md=$('#modal-root .modal'); md.scrollTop=sc; md.style.animation='none'; $('#modal-root .backdrop').style.animation='none'; }
}
function buyItem(kind,id){
  const price=kind==='powerups'?POWERUPS[id].price:kind==='themes'?THEMES.find(t=>t.id===id).price:kind==='packs'?PACKS[id].price:MODE_BY_ID[id].price;
  const name=kind==='powerups'?POWERUPS[id].name:kind==='themes'?THEMES.find(t=>t.id===id).name:kind==='packs'?PACKS[id].name:MODE_BY_ID[id].name;
  if(S.owned[kind].includes(id)) return;
  if(!Treesh.spend(price,`Nects: ${name}`)){ toast('Not enough Starlites',`You need ${price-Treesh.balance()} more`,'warn'); return false; }
  S.owned[kind].push(id);
  if(kind==='themes') S.equipped.theme=id; if(kind==='packs') S.equipped.pack=id;
  saveNects(); applyTheme(); Sound.coin(); toast(`${name} unlocked`,`-${price} Starlites`,'star'); checkBadges();
  return true;
}

/* Settings */
function openSettings(){
  const row=(k,t,d)=>`<div class="toggle-row"><div><b>${t}</b><small>${d}</small></div><button class="switch ${S.settings[k]?'on':''}" data-act="setting-toggle" data-k="${k}" data-testid="setting-${k}"></button></div>`;
  openModal(`<button class="btn btn-ghost btn-icon modal-x" data-act="close-modal" data-testid="settings-close" aria-label="Close">${ic('x',18)}</button>
    <p class="eyebrow">Nects</p><h2>Settings</h2>
    <div style="margin-top:14px">${row('sound','Sound effects','Taps, calls and wins')}${row('haptics','Haptics','Vibrate on taps (supported devices)')}${row('reduceMotion','Reduce motion','Fewer animations')}</div>
    <p class="field-label">Appearance</p><div class="list-row">${ic('palette',18)}<div class="grow"><b>Accent color comes from Treesh</b><small>Change it in Treesh, under Settings, Display. Board themes are in the Shop.</small></div></div>
    <p class="field-label">Data</p>
    <button class="btn btn-danger" style="width:100%" data-act="reset-data" data-testid="reset-nects-data">${ic('trash-2',16)}Reset Nects progress</button>
    <p class="muted" style="font-size:12px;margin-top:8px">This clears Nects stats, unlocks and history on this device. Your Treesh Starlites stay safe.</p>`,{testid:'settings-modal'});
}

/* Help */
function openHelp(){
  openModal(`<button class="btn btn-ghost btn-icon modal-x" data-act="close-modal" data-testid="help-close" aria-label="Close">${ic('x',18)}</button>
    <p class="eyebrow">Learn in 20 seconds</p><h2>How to play</h2>
    <ul class="rules" style="margin-top:16px">
      <li>${ic('megaphone',15)}<span>An emoji is <b>called</b> at the top. It\u2019s somewhere on your board and on the bot\u2019s board.</span></li>
      <li>${ic('pointer',15)}<span><b>Tap it first</b> to claim it. Once anyone claims a call, it\u2019s gone for the other player.</span></li>
      <li>${ic('grid-3x3',15)}<span>Finish a <b>full row, column or diagonal</b> to win the round.</span></li>
      <li>${ic('sparkles',15)}<span>Wins pay <b>Starlites</b> into your Treesh wallet. Harder bots, bigger boards and streaks pay more. Using a powerup halves that round\u2019s reward.</span></li>
    </ul>
    <p class="field-label">Powerups</p>
    ${Object.values(POWERUPS).map(p=>`<div class="list-row"><span style="font-size:22px;font-family:var(--emoji)">${p.icon}</span><div class="grow"><b>${p.name}</b><small>${p.desc}</small></div></div>`).join('')}
    <button class="btn btn-primary btn-lg" style="width:100%;margin-top:20px" data-act="close-modal" data-testid="help-done">Got it</button>`,{testid:'help-modal'});
  S.settings.seenHelp=true; saveNects();
}

/* Badges */
function checkBadges(){
  const fresh=BADGES.filter(b=>!S.badges[b.id]&&b.test(S));
  fresh.forEach(b=>{ S.badges[b.id]=Date.now(); });
  if(fresh.length){ saveNects(); fresh.forEach((b,i)=>setTimeout(()=>{ toast(`Badge: ${b.name}`,`${b.desc} · +10 Starlites`,'badge'); Treesh.earn(10,`Nects badge: ${b.name}`); },i*700)); }
  return fresh;
}
