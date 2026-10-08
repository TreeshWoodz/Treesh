'use strict';
/* Don't Get Caught: screens & UI */
const UI = { charSel: null, loadout: [], shopTab: 'items' };
const MENU_SCR = ['scr-title', 'scr-story', 'scr-shop', 'scr-trophies', 'scr-loadout'];
function show(id) { if (UI.splashed) Sfx.menuMusic(MENU_SCR.includes(id)); $$('.scr').forEach(s => s.classList.toggle('on', s.id === id)); const s = $('#' + id); if (s) s.scrollTop = 0; document.body.dataset.scr = id; }
const starChip = () => `<span class="stars" data-testid="starlites-display"><i data-lucide="sparkles"></i><b data-star-count data-testid="starlites-display-amount">${fmt(Treesh.balance())}</b></span>`;
const subTop = (title, back = 'title') => `<header class="topbar sub"><button class="ic-btn" data-act="go" data-to="${back}" data-testid="back-btn" aria-label="Back"><i data-lucide="arrow-left"></i></button><h2>${title}</h2>${starChip()}</header>`;
function playerAvatar(cls = '') {
  const a = Treesh.avatar(), n = Treesh.name(), ch = cosById(lookOf().charm);
  return `<div class="pav ${cls}" data-testid="player-avatar">${a ? `<img src="${esc(a)}" alt="${esc(n)}">` : `<span class="pav-mono">${esc(n.slice(0, 1).toUpperCase())}</span>`}${ch && ch.val ? `<span class="charm"><i data-lucide="${ch.val}"></i></span>` : ''}</div>`;
}
function playerCard() {
  const t = traitById(S.trait);
  return `<section class="lo-who" data-testid="loadout-player">${playerAvatar()}<div><small>Playing as</small><b>${esc(Treesh.name())}</b><span class="perk"><i data-lucide="${t.icon}"></i>${esc(t.name)}: ${esc(t.desc)}</span>${Treesh.avatar() ? '' : '<span class="muted sm">Tip: set a profile picture in Treesh to see yourself here.</span>'}</div></section>`;
}
function avatarHtml() { const a = Treesh.avatar(), n = Treesh.name(); return a ? `<img src="${esc(a)}" alt="" data-testid="user-profile-avatar">` : `<span class="av-mono" data-testid="user-profile-avatar">${esc(n.slice(0, 1).toUpperCase())}</span>`; }

/* ---------- Nightly Challenge ---------- */
function renderDaily() {
  const di = dailyInfo(), done = dailyPlayedToday();
  $('#scr-loadout').innerHTML = `${subTop('Nightly Challenge')}<div class="loadout" data-testid="daily-screen">
    <section class="daily-hero"><div class="dh-img" style="background-image:url(${img('key_art')})"></div><div class="dh-b"><p class="kicker">Nightly #${di.no} \u00b7 ${di.key}</p><h2>Tonight\u2019s House</h2>
      <p>Every player faces the same rooms, in the same order, with the same turns and fake-outs. Mr. Hush. Nightfall rooms. No items.</p>
      <div class="dh-mod" data-testid="daily-modifier"><i data-lucide="${di.mod.icon}"></i><div><b>${esc(di.mod.name)}</b><span>${esc(di.mod.desc)}</span></div></div>
      <div class="over-stats"><div><small>Status</small><b data-testid="daily-status">${done ? 'Played' : 'Ready'}</b></div><div><small>Tonight\u2019s best</small><b>${done ? S.daily.best : '\u2014'}</b></div><div><small>Streak</small><b data-testid="daily-streak">${S.daily.streak || 0}</b></div></div>
      <p class="muted">${done ? 'You\u2019ve used tonight\u2019s official attempt. Practice runs earn your normal pocket but no nightly bonus. New house in ' + dailyResetIn() + '.' : 'Your first run tonight is official: +8 Starlites per night survived, plus +10 per streak night (up to +70).'}</p></div></section>
    ${playerCard()}
    <div class="row center"><button class="btn btn-acc btn-xl" data-act="daily-start" data-testid="daily-start-btn"><i data-lucide="door-open"></i>${done ? 'Practice tonight\u2019s house' : 'Enter tonight\u2019s house'}</button></div></div>`;
  icons();
}

/* ---------- Main menu (game-style) ---------- */
UI.menuIdx = 0; UI.splashed = false;
function menuItems() {
  const di = dailyInfo(), best = bestNightAll(), got = ACH.filter(a => S.ach[a.id]).length, inv = Object.values(S.inv).reduce((a, b) => a + (b || 0), 0), done = dailyPlayedToday();
  return [
    { label: 'Enter the House', act: 'play', tid: 'start-game-btn', icon: 'skull', mode: true },
    { label: 'Nightly Challenge', act: 'daily', tid: 'nightly-card', icon: 'calendar-days', sub: `#${di.no} \u00b7 ${di.mod.name} \u00b7 ${done ? 'Survived ' + S.daily.best + ' tonight' : 'Ready'}`, badge: done ? '' : 'Tonight' },
    { label: 'The Pantry', act: 'go', to: 'shop', tid: 'shop-open-btn', icon: 'shopping-bag', sub: `Tools, traits & looks \u00b7 ${inv} tool${inv === 1 ? '' : 's'} in your bag` },
    { label: 'Trophies', act: 'go', to: 'trophies', tid: 'achievements-open-btn', icon: 'trophy', sub: `${rankOf(best)} \u00b7 ${got}/${ACH.length} unlocked` },
    { label: 'Story', act: 'go', to: 'story', tid: 'story-open-btn', icon: 'book-open', sub: 'How you got here' },
    { label: 'Settings', act: 'settings', tid: 'settings-open-btn', icon: 'settings', sub: 'Sound, flashes, taunts' }
  ];
}
const DUST = Array.from({ length: 26 }, () => `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;--s:${(Math.random() * 2.4 + 1).toFixed(1)}px;--d:${(Math.random() * 14 + 10).toFixed(1)}s;--dl:-${(Math.random() * 20).toFixed(1)}s"></i>`).join('');
function renderTitle() {
  const t = traitById(S.trait), m = modeById(S.mode), items = menuItems(), best = bestNightAll();
  UI.menuIdx = clamp(UI.menuIdx, 0, items.length - 1);
  $('#scr-title').innerHTML = `<div class="title-bg" style="background-image:url(${img('key_art')})"></div><div class="mm-fog f1"></div><div class="mm-fog f2"></div><div class="mm-dust">${DUST}</div><div class="mm-lamp"></div>
  <header class="mm-top"><div class="prof" data-testid="user-profile-chip">${avatarHtml()}<span><small>${esc(rankOf(best))}${best ? ' \u00b7 Night ' + best : ''}</small><b data-testid="user-profile-name">${esc(Treesh.name())}</b></span></div>${starChip()}</header>
  <div class="mm">
    <div class="mm-left">
      <h1 class="logo mm-logo" data-testid="game-logo"><small>Don\u2019t Get</small><span>Caught</span></h1>
      <nav class="mm-list" role="menu" data-testid="main-menu">${items.map((it, i) => `<div class="mm-item ${i === UI.menuIdx ? 'on' : ''}" role="menuitem" tabindex="-1" data-i="${i}" data-act="${it.act}" ${it.to ? `data-to="${it.to}"` : ''} data-testid="${it.tid}" style="--i:${i}">
        <i class="mm-cur" aria-hidden="true"></i><span class="mm-lab"><b>${it.label}</b>${it.mode ? `<span class="mm-mode" data-testid="mode-list"><button data-act="mode-step" data-d="-1" data-testid="mode-prev-btn" aria-label="Previous mode"><i data-lucide="chevron-left"></i></button><em data-testid="mode-name"><i data-lucide="${m.icon}"></i>${m.name}${m.voice ? '<i data-lucide="mic" class="mic"></i>' : ''}</em><button data-act="mode-step" data-d="1" data-testid="mode-next-btn" aria-label="Next mode"><i data-lucide="chevron-right"></i></button></span>` : `<small>${esc(it.sub)}</small>`}</span>${it.badge ? `<em class="mm-badge">${it.badge}</em>` : ''}</div>`).join('')}</nav>
      <p class="mm-desc" data-testid="mode-desc">${UI.menuIdx === 0 ? `<b>${m.tag}${S.stats.best[m.id] ? ' \u00b7 Best night ' + S.stats.best[m.id] : ''}</b>${esc(m.desc)}` : ''}</p>
    </div>
    <aside class="mm-show" data-act="go" data-to="shop" data-testid="title-player-card">${playerAvatar('show')}<div class="mm-show-b"><small>${esc(rankOf(best))}${best ? ' \u00b7 Night ' + best : ''}</small><b>${esc(Treesh.name())}</b><span><i data-lucide="${t.icon}"></i>${esc(t.name)}</span></div></aside>
  </div>
  <footer class="mm-foot"><span>Treesh Games \u00b7 v1.3</span><span class="mm-hints"><span class="kb-hint"><kbd>\u2191</kbd><kbd>\u2193</kbd>Select</span><span class="kb-hint"><kbd>\u2190</kbd><kbd>\u2192</kbd>Mode</span><span class="kb-hint"><kbd>Enter</kbd>Confirm</span><span class="pad-hint"><i data-lucide="gamepad-2"></i><kbd>D-pad</kbd>Select</span><span class="pad-hint"><kbd>A</kbd>Confirm</span><span class="pad-hint"><kbd>B</kbd>Back</span></span></footer>
  ${UI.splashed ? '' : `<div class="splash" data-act="splash" data-testid="splash-screen"><div class="title-bg" style="background-image:url(${img('key_art')})"></div><div class="mm-fog f1"></div><div class="splash-b"><p class="kicker">Treesh Games presents</p><h1 class="logo"><small>Don\u2019t Get</small><span>Caught</span></h1><p class="splash-press" data-testid="splash-press">${matchMedia('(hover:none)').matches ? 'Tap to begin' : 'Press any key'}</p><p class="splash-warn"><i data-lucide="headphones"></i>Headphones recommended \u00b7 Contains jump scares</p></div></div>`}`;
  icons();
}
function menuFocus(i) {
  const items = $$('#scr-title .mm-item'); if (!items.length) return; i = (i + items.length) % items.length;
  if (i !== UI.menuIdx) { UI.menuIdx = i; Sfx.tick(); }
  items.forEach((el, j) => el.classList.toggle('on', j === i));
  const d = $('#scr-title .mm-desc'), m = modeById(S.mode);
  if (d) d.innerHTML = i === 0 ? `<b>${m.tag}${S.stats.best[m.id] ? ' \u00b7 Best night ' + S.stats.best[m.id] : ''}</b>${esc(m.desc)}` : '';
}
function modeStep(d) {
  const i = MODES.findIndex(x => x.id === S.mode), m = MODES[(i + d + MODES.length) % MODES.length]; S.mode = m.id; save(); Sfx.tone(d > 0 ? 520 : 440, 0.08, 'triangle', 0.08);
  const em = $('#scr-title [data-testid="mode-name"]'); if (em) { em.innerHTML = `<i data-lucide="${m.icon}"></i>${m.name}${m.voice ? '<i data-lucide="mic" class="mic"></i>' : ''}`; em.style.animation = 'none'; void em.offsetWidth; em.style.animation = ''; icons(); }
  menuFocus(0);
}
function dismissSplash() {
  if (UI.splashed) return; UI.splashed = true; Sfx.ctx(); Sfx.shh(); Sfx.thump(0.6); Sfx.menuMusic(true);
  const sp = $('#scr-title .splash'); if (sp) { sp.classList.add('out'); setTimeout(() => sp.remove(), 700); }
}
setInterval(() => {
  if (!UI.splashed || Run.active || document.hidden || !$('#scr-title').classList.contains('on')) return;
  Math.random() < 0.5 ? Sfx.creak() : Sfx.step(0.12);
}, 14000);
document.addEventListener('mouseover', e => { const it = e.target.closest && e.target.closest('#scr-title .mm-item'); if (it) menuFocus(+it.dataset.i); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !Run.active && !$('#modal').hidden) { closeModal(); return; }
  if (!$('#scr-title').classList.contains('on') || !$('#modal').hidden || (e.target.matches && e.target.matches('input'))) return;
  if (!UI.splashed) { e.preventDefault(); dismissSplash(); return; }
  const k = e.key;
  if (k === 'ArrowDown' || k === 's') { e.preventDefault(); menuFocus(UI.menuIdx + 1); }
  else if (k === 'ArrowUp' || k === 'w') { e.preventDefault(); menuFocus(UI.menuIdx - 1); }
  else if ((k === 'ArrowLeft' || k === 'ArrowRight' || k === 'a' || k === 'd') && UI.menuIdx === 0) { e.preventDefault(); modeStep(k === 'ArrowRight' || k === 'd' ? 1 : -1); }
  else if (k === 'Enter' || k === ' ') { e.preventDefault(); const it = $$('#scr-title .mm-item')[UI.menuIdx]; if (it) it.click(); }
});

/* ---------- Story ---------- */
function renderStory(thenPlay) {
  const n = esc(Treesh.name());
  const panels = [
    ['key_art', `${n}. Wake up. Quietly.`, `You don\u2019t remember the drive. You remember headlights, then nothing. Now you\u2019re in an old house that smells like wet wood and pennies.`],
    ['hush_front', 'This is Mr. Hush.', `He rarely speaks. When he does, it\u2019s already too late. He watches. He has one rule, and he lets his guests learn it the hard way: <b>he only kills what he sees.</b>`],
    ['room_door', 'So work while he isn\u2019t looking.', `Pick the locks. Call for help. Clean up what you\u2019ve done. Every night is a new room. Listen for his footsteps. When he turns, <b>freeze</b>.`],
    ['hush_back', 'Survive until dawn.', `Every five nights a window opens. Escape and keep your Starlites, or go deeper for more. And if you last ten nights\u2026 something else in this house wakes up. It can\u2019t see you. It doesn\u2019t need to.`]
  ];
  $('#scr-story').innerHTML = `${subTop('The Story')}<div class="story">${panels.map((p, i) => `<article class="panel" style="--d:${i * 0.15}s"><div class="panel-img" style="background-image:url(${img(p[0])})"></div><div><h3>${p[1]}</h3><p>${p[2]}</p></div></article>`).join('')}
  <div class="row center"><button class="btn btn-acc btn-xl" data-act="${thenPlay ? 'story-done' : 'go'}" data-to="title" data-testid="story-continue-btn"><i data-lucide="${thenPlay ? 'skull' : 'arrow-left'}"></i>${thenPlay ? 'I understand' : 'Back'}</button></div></div>`;
  icons();
}

/* ---------- Shop ---------- */
function renderShop() {
  const bal = Treesh.balance(), hosted = /(^|\.)treesh\.app$/i.test(location.hostname), l = lookOf();
  const cosRow = kind => COSMETICS.filter(c => c.kind === kind).map(c => {
    const own = S.owned.includes(c.id), on = l[kind] === c.id, sw = kind === 'charm' ? `<i data-lucide="${c.val || 'circle-off'}"></i>` : `<i class="sw" style="background:${c.val === 'acc' ? 'var(--acc)' : 'rgb(' + c.val + ')'}"></i>`;
    return `<button class="cos ${on ? 'on' : ''} ${own ? '' : 'locked'}" data-act="cos" data-id="${c.id}" data-testid="cos-${c.id}">${sw}<span>${esc(c.name)}</span>${own ? '' : `<em><i data-lucide="sparkles"></i>${c.cost}</em>`}</button>`;
  }).join('');
  $('#scr-shop').innerHTML = `${subTop('The Pantry')}<div class="shop">
    <p class="shop-intro">Things that keep you alive, paid for with your Treesh Starlites.</p>
    ${hosted ? '' : `<button class="btn btn-ghost sm" data-act="demo-stars" data-testid="demo-stars-btn"><i data-lucide="flask-conical"></i>Preview only: +500 test Starlites</button>`}
    <h3 class="sec-h"><i data-lucide="backpack"></i>Tools <small>bring up to 3 per run</small></h3>
    <div class="shop-grid">${ITEMS.map(it => `<article class="shop-item" data-testid="shop-item-${it.id}"><div class="si-ic"><i data-lucide="${it.icon}"></i></div><div class="si-b"><h3>${esc(it.name)} <small>${it.type === 'active' ? 'Use in a room' : it.type === 'guard' ? 'Automatic' : 'Lasts a run'}</small></h3><p>${esc(it.desc)}</p>
      <div class="si-f"><span class="owned" data-testid="shop-owned-${it.id}">Owned: <b>${S.inv[it.id] || 0}</b></span><button class="btn btn-gold sm" data-act="buy" data-id="${it.id}" ${bal < it.cost ? 'disabled' : ''} data-testid="shop-buy-${it.id}"><i data-lucide="sparkles"></i>${it.cost}</button></div></div></article>`).join('')}</div>
    <h3 class="sec-h"><i data-lucide="sparkle"></i>Traits <small>equip one</small></h3>
    <div class="shop-grid">${TRAITS.map(t => { const own = S.traits.includes(t.id), on = S.trait === t.id; return `<article class="shop-item trait ${on ? 'on' : ''}" data-testid="shop-trait-${t.id}"><div class="si-ic tr"><i data-lucide="${t.icon}"></i></div><div class="si-b"><h3>${esc(t.name)}</h3><p>${esc(t.desc)}</p><div class="si-f"><span class="owned">${on ? 'Equipped' : own ? 'Owned' : 'Locked'}</span>${own ? `<button class="btn ${on ? 'btn-ghost' : 'btn-acc'} sm" data-act="trait-pick" data-id="${t.id}" ${on ? 'disabled' : ''} data-testid="trait-equip-${t.id}">${on ? '<i data-lucide="check"></i>Equipped' : 'Equip'}</button>` : `<button class="btn btn-gold sm" data-act="trait-buy" data-id="${t.id}" ${bal < t.cost ? 'disabled' : ''} data-testid="trait-buy-${t.id}"><i data-lucide="sparkles"></i>${t.cost}</button>`}</div></div></article>`; }).join('')}</div>
    <h3 class="sec-h"><i data-lucide="shirt"></i>Looks</h3>
    <div class="looks" data-testid="looks-panel"><div class="looks-prev">${playerAvatar('lg')}</div><div><p class="cust-h">Lucky charm (shown on your picture)</p><div class="cos-row">${cosRow('charm')}</div><p class="cust-h">Flashlight (lights every room)</p><div class="cos-row">${cosRow('light')}</div></div></div></div>`;
  icons();
}

/* ---------- Trophies & stats ---------- */
function renderTrophies() {
  const st = S.stats, got = ACH.filter(a => S.ach[a.id]), best = bestNightAll(), cnt = t => got.filter(a => a.tier === t).length;
  $('#scr-trophies').innerHTML = `${subTop('Trophies')}<div class="troph">
    <section class="t-hero"><div class="rank-badge"><i data-lucide="skull"></i></div><div><p class="kicker">Your rank</p><h2 data-testid="trophy-rank">${rankOf(best)}</h2><p class="muted">Best night: ${best || '\u2014'} \u00b7 ${got.length}/${ACH.length} achievements</p></div>
      <div class="tiers">${Object.keys(TIERS).map(t => `<span style="--c:${TIERS[t]}" data-testid="tier-${t}"><i data-lucide="trophy"></i><b>${cnt(t)}</b><small>${t}</small></span>`).join('')}</div></section>
    <div class="ach-grid" data-testid="achievements-grid">${ACH.map(a => `<article class="ach ${S.ach[a.id] ? 'got' : ''}" style="--c:${TIERS[a.tier]}" data-testid="ach-${a.id}"><i data-lucide="${S.ach[a.id] ? a.icon : 'lock'}"></i><div><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></div><em>${a.tier}</em></article>`).join('')}</div>
    <h3 class="sec-h"><i data-lucide="chart-no-axes-column"></i>Stats</h3>
    <div class="stats" data-testid="stats-grid">${[['Runs', st.runs], ['Nights survived', st.rounds], ['Times caught', st.deaths], ['Escapes', st.escapes], ['Close calls', st.close], ['Items used', st.items], ['Starlites earned', st.earned], ['Starlites spent', st.spent], ['Best Nightfall', st.best.classic], ['Best Dead Silent', st.best.hush], ['Best Lullaby', st.best.lullaby], ['Best Impressions', st.best.impress], ['Nightly streak', S.daily.streak || 0], ['Play time', Math.round(st.playMs / 60000) + 'm']].map(([k, v]) => `<div><small>${k}</small><b>${typeof v === 'number' ? fmt(v) : v}</b></div>`).join('')}</div></div>`;
  icons();
}

/* ---------- Loadout ---------- */
function renderLoadout() {
  const m = modeById(S.mode), own = ITEMS.filter(i => S.inv[i.id] > 0);
  UI.loadout = UI.loadout.filter(id => S.inv[id] > 0);
  $('#scr-loadout').innerHTML = `${subTop('Before you go in')}<div class="loadout">
    ${playerCard()}
    <section class="lo-mode"><i data-lucide="${m.icon}"></i><div><small>Mode</small><b>${m.name}</b><span>${esc(m.desc)}</span></div></section>
    <h3 class="sec-h"><i data-lucide="sparkle"></i>Trait</h3>
    <div class="chips" data-testid="trait-chips">${TRAITS.filter(t => S.traits.includes(t.id)).map(t => `<button class="chip ${S.trait === t.id ? 'on' : ''}" data-act="trait-pick" data-id="${t.id}" data-testid="loadout-trait-${t.id}"><i data-lucide="${t.icon}"></i>${esc(t.name)}</button>`).join('')}<button class="chip ghost" data-act="go" data-to="shop"><i data-lucide="plus"></i>More in the Pantry</button></div>
    <h3 class="sec-h"><i data-lucide="gauge"></i>Difficulty</h3>
    <div class="diffs" data-testid="difficulty-list">${DIFFS.map(d => { const ok = diffUnlocked(d); return `<button class="diff ${S.diff === d.id ? 'on' : ''} ${ok ? '' : 'locked'}" data-act="diff" data-id="${d.id}" ${ok ? '' : 'disabled'} data-testid="diff-${d.id}-btn"><i data-lucide="${ok ? d.icon : 'lock'}"></i><b>${d.name}</b><small>${ok ? esc(d.desc) : 'Survive 5 nights on Terror to unlock.'}</small></button>`; }).join('')}</div>
    ${m.id === 'classic' || m.id === 'hush' ? `<h3 class="sec-h"><i data-lucide="skull"></i>Who\u2019s hunting you</h3><div class="killers">${KILLERS.map(k => { const ok = killerUnlocked(k.id), on = (killerUnlocked(S.killer) ? S.killer : 'hush') === k.id; return `<button class="killer ${on ? 'on' : ''} ${ok ? '' : 'locked'}" data-act="killer" data-id="${k.id}" ${ok ? '' : 'disabled'} data-testid="killer-${k.id}-btn"><img src="${img(k.img)}" alt=""><span><small><i data-lucide="${k.icon}"></i>Hunts by ${k.sense}</small><b>${esc(k.name)}</b><em>${ok ? esc(k.desc) : 'Locked: survive night ' + k.unlockAt + ' in any mode to wake her.'}</em></span>${ok ? '' : '<i data-lucide="lock" class="k-lock"></i>'}</button>`; }).join('')}</div>` : ''}
    <h3 class="sec-h"><i data-lucide="backpack"></i>Bring up to 3 tools <small>${UI.loadout.length}/3</small></h3>
    ${own.length ? `<div class="lo-items">${own.map(it => `<button class="lo-item ${UI.loadout.includes(it.id) ? 'on' : ''}" data-act="lo-toggle" data-id="${it.id}" data-testid="loadout-item-${it.id}"><i data-lucide="${it.icon}"></i><span><b>${esc(it.name)} \u00d7${S.inv[it.id]}</b><small>${esc(it.desc)}</small></span><em><i data-lucide="${UI.loadout.includes(it.id) ? 'check' : 'plus'}"></i></em></button>`).join('')}</div>` : `<p class="muted">No tools yet. Buy some in the <a href="#" data-act="go" data-to="shop">Pantry</a> with your Starlites.</p>`}
    <div class="lo-tips"><p><i data-lucide="ear"></i>Listen for footsteps and creaks: that\u2019s him turning.</p><p><i data-lucide="hand"></i>Freeze the moment he turns. One wrong move and it\u2019s over.</p><p><i data-lucide="zap"></i>Clear a room with over half the candle left for a Swift bonus.</p>${m.voice ? '<p><i data-lucide="headphones"></i>Voice mode: use headphones so the game\u2019s sounds don\u2019t reach your mic.</p>' : ''}</div>
    <div class="row center"><button class="btn btn-acc btn-xl" data-act="go-run" data-testid="loadout-start-btn"><i data-lucide="${m.voice ? 'mic' : 'door-open'}"></i>${m.voice ? 'Set up mic' : 'Enter the house'}</button></div></div>`;
  icons();
}

/* ---------- Mic setup ---------- */
async function micSetup() {
  const m = modeById(S.mode), el = $('#scr-mic'); show('scr-mic');
  const set = (h) => { el.innerHTML = `${subTop('Microphone', 'loadout')}<div class="mic-box" data-testid="mic-setup">${h}</div>`; icons(); };
  set(`<i data-lucide="mic" class="big"></i><h2>Allow your microphone</h2><p>${esc(m.name)} listens to your voice. Nothing is recorded or sent anywhere.</p><p class="muted">Waiting for permission\u2026</p>`);
  const ok = await Mic.start();
  if (!ok) return set(`<i data-lucide="mic-off" class="big"></i><h2>No microphone</h2><p>We couldn\u2019t access your mic. Allow microphone access in your browser settings, then try again.</p><div class="row center"><button class="btn btn-acc" data-act="go-run" data-testid="mic-retry-btn">Try again</button><button class="btn btn-ghost" data-act="mode-classic" data-testid="mic-classic-btn">Play Nightfall instead</button></div>`);
  set(`<i data-lucide="volume-x" class="big"></i><h2>Stay quiet\u2026</h2><p>Measuring the room.</p><div class="meter big"><i id="mc-m" data-testid="mic-level"></i></div>`);
  const dbs = []; await Mic.sample(1.6, f => { dbs.push(f.db); const e = $('#mc-m'); if (e) e.style.width = clamp((f.db + 80) / 60, 0, 1) * 100 + '%'; });
  dbs.sort((a, b) => a - b); Mic.floor = clamp(dbs[Math.floor(dbs.length * 0.6)] || -60, -85, -30);
  if (S.mode === 'lullaby') {
    set(`<i data-lucide="audio-waveform" class="big"></i><h2>Now hum a comfy note</h2><p>Hold one note for a couple of seconds: "Mmmmmm\u2026"</p><div class="meter big"><i id="mc-m"></i></div><p id="mc-p" class="muted">Listening\u2026</p>`);
    const ps = []; await Mic.sample(2.6, f => { if (f.voiced && f.level > 0.1) ps.push(f.pitch); const e = $('#mc-m'); if (e) e.style.width = f.level * 100 + '%'; const p = $('#mc-p'); if (p) p.textContent = f.voiced ? Math.round(f.pitch) + ' Hz' : 'Listening\u2026'; });
    ps.sort((a, b) => a - b); Mic.base = ps.length > 8 ? ps[ps.length >> 1] : 180;
  }
  set(`<i data-lucide="check" class="big"></i><h2>Ready.</h2><p>${S.mode === 'hush' ? 'Keep your voice under the line on the meter. Breathing is fine. Talking is not.' : S.mode === 'lullaby' ? 'Hum or sing to keep your dot inside his band.' : 'Do your best impression when he asks. He\u2019s a tough crowd.'}</p><div class="meter big"><i id="mc-m"></i></div><div class="row center"><button class="btn btn-acc btn-xl" data-act="start-run" data-testid="mic-start-btn"><i data-lucide="door-open"></i>Enter the house</button></div>`);
  const live = () => { const e = $('#mc-m'); if (!e || !Mic.ok || !$('#scr-mic').classList.contains('on')) return; Mic.read(); e.style.width = Mic.f.level * 100 + '%'; requestAnimationFrame(live); }; live();
}

/* ---------- Game shell & results ---------- */
function renderGameShell() {
  $('#scr-game').innerHTML = `<div class="hud" data-testid="game-hud">
    <header class="hud-top"><div class="hud-night" data-testid="hud-night"><small>Night</small><b id="h-night">1</b></div><div class="hud-room"><b id="h-room" data-testid="hud-room"></b><small>${esc(modeById(Run.mode).name)} \u00b7 ${esc(diffById(Run.diff).name)}${Run.daily ? ' \u00b7 Nightly' : ''}</small></div>
      <div class="hud-pocket" data-testid="hud-pocket" title="Starlites in your pocket"><i data-lucide="sparkles"></i><b id="h-pocket">0</b></div><button class="ic-btn" data-act="pause" data-testid="hud-pause-btn" aria-label="Pause"><i data-lucide="pause"></i></button></header>
    <div class="hud-candle" data-testid="hud-timer"><i id="h-candle" data-testid="hud-timer-fill"></i><span><i data-lucide="flame"></i><b id="h-time"></b></span></div>
    <main class="hud-main"><section class="kp" id="kp" data-testid="killer-panel"><img class="kp-im on" id="kp-img" alt="The killer"><img class="kp-im" alt=""><div class="kp-fx"></div><div class="kp-badge" id="kp-badge" data-testid="killer-state-badge"></div></section>
      <section class="act" id="act" data-testid="activity-panel"><div class="act-bg" id="act-bg"></div><div class="act-light"></div><div id="act-stage"></div><div class="act-intro" id="act-intro" hidden></div></section></main>
    <footer class="hud-bot"><div class="prog"><i id="h-prog" data-testid="progress-bar-fill"></i><span id="h-prog-t">0%</span></div>
      <div class="vm nm" id="nm" data-testid="noise-meter" hidden><small><i data-lucide="ear"></i>Noise</small><div class="vm-bar"><i id="nm-f"></i><b id="nm-lim"></b></div></div>
      <div class="vm" id="vm" data-testid="voice-meter" hidden><small>Voice</small><div class="vm-bar"><i id="vm-f"></i><b id="vm-lim"></b></div></div>
      <div class="hud-ctrl"><div class="hud-items" id="h-items" data-testid="hud-items"></div><button class="act-btn" id="act-btn" data-testid="action-hold-btn"></button></div></footer></div>`;
  icons();
  const b = $('#act-btn');
  b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} Input.down(); b.classList.add('down'); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { Input.up(); b.classList.remove('down'); }));
  b.addEventListener('contextmenu', e => e.preventDefault());
}
function renderOver(res) {
  const m = modeById(res.mode), newA = (Run.newAch || []).map(id => ACH.find(a => a.id === id)).filter(Boolean);
  $('#scr-over').innerHTML = `<div class="over ${res.escaped ? 'esc' : 'dead'}" data-testid="game-over">
    <div class="over-img">${playerAvatar('lg ' + (res.escaped ? '' : 'gone'))}</div>
    <div class="over-b"><p class="kicker">${esc(m.name)} \u00b7 ${esc(diffById(Run.diff).name)} \u00b7 ${esc(Treesh.name())}</p><h1 data-testid="game-over-title">${res.escaped ? 'Escaped' : 'Caught'}</h1><p class="over-reason" data-testid="game-over-reason">${esc(res.text)}</p>
      ${res.taunt && S.set.taunts ? `<blockquote class="taunt" data-testid="game-over-taunt">\u201c${esc(TAUNT_TEXT[res.taunt])}\u201d<cite>${esc(killerById(res.killer).name)}</cite></blockquote>` : ''}
      <div class="over-stats"><div><small>Nights survived</small><b data-testid="over-nights">${res.survived}</b></div><div><small>Starlites banked</small><b class="gold" data-testid="over-banked"><i data-lucide="sparkles"></i>${fmt(res.banked)}</b></div><div><small>Best (${esc(m.name)})</small><b>${S.stats.best[res.mode] || 0}</b></div></div>
      ${!res.escaped && res.reason !== 'quit' && Run.pocket ? `<p class="muted">He took half your pocket. Escape at a checkpoint to keep it all.</p>` : ''}
      ${res.daily ? `<p class="daily-line" data-testid="over-daily">${res.official ? `<i data-lucide="calendar-check"></i>Nightly #${dailyInfo().no} official run \u00b7 +${fmt(res.dailyBonus)} bonus Starlites included` : `<i data-lucide="calendar-days"></i>Nightly #${dailyInfo().no} practice run (no bonus)`}</p>` : ''}
      ${newA.length ? `<div class="over-ach"><p class="cust-h">New achievements</p>${newA.map(a => `<span style="--c:${TIERS[a.tier]}"><i data-lucide="${a.icon}"></i>${esc(a.name)}</span>`).join('')}</div>` : ''}
      <div class="row"><button class="btn btn-acc btn-xl" data-act="${res.daily ? 'daily' : 'retry'}" data-testid="retry-run-btn"><i data-lucide="rotate-ccw"></i>Try again</button>${res.daily ? `<button class="btn btn-ghost" data-act="share" data-n="${res.survived}" data-testid="over-share-btn"><i data-lucide="share-2"></i>Share</button>` : ''}<button class="btn btn-ghost" data-act="go" data-to="title" data-testid="over-menu-btn"><i data-lucide="house"></i>Menu</button></div></div></div>`;
  icons();
}

/* ---------- Modal & settings ---------- */
let modalClose = null;
function openModal(html, onClose) { const m = $('#modal'); m.innerHTML = `<div class="modal-card" data-testid="modal">${html}</div>`; m.hidden = false; modalClose = onClose || null; icons(); }
function closeModal() { $('#modal').hidden = true; const f = modalClose; modalClose = null; if (f) f(); }
function openSettings() {
  const t = (k, l, d) => `<label class="tog"><span><b>${l}</b><small>${d}</small></span><input type="checkbox" data-set="${k}" ${S.set[k] ? 'checked' : ''} data-testid="setting-${k}"></label>`;
  openModal(`<h3>Settings</h3>${t('sound', 'Sound', 'Heartbeat, footsteps and screams')}<label class="tog"><span><b>Volume</b></span><input type="range" min="0" max="1" step="0.05" value="${S.set.vol}" data-set="vol" data-testid="setting-vol"></label>${t('taunts', 'Spoken taunts', 'Killers whisper when they catch you or you escape')}${t('music', 'Menu music', 'A music box that slowly goes out of tune')}${t('flash', 'Flashes', 'Red flashes during jump scares')}${t('shake', 'Screen shake', 'Shake when he looks or catches you')}${t('haptic', 'Vibration', 'On supported phones')}
    <div class="row"><button class="btn btn-ghost" data-act="story-replay" data-testid="settings-story-btn"><i data-lucide="book-open"></i>Replay story</button><button class="btn btn-acc" data-act="close-modal" data-testid="settings-close-btn">Done</button></div>`);
  $$('#modal [data-set]').forEach(i => i.oninput = () => { S.set[i.dataset.set] = i.type === 'checkbox' ? i.checked : +i.value; save(); Sfx.vol(); if (i.dataset.set === 'music') Sfx.menuMusic(S.set.music && !Run.active); });
}

/* ---------- Events ---------- */
const GO = { title: renderTitle, shop: renderShop, trophies: renderTrophies, story: () => renderStory(false), loadout: renderLoadout };
function go(to) { (GO[to] || renderTitle)(); show('scr-' + to); }
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) { if (e.target.id === 'modal') closeModal(); return; }
  if (t.tagName === 'A') e.preventDefault();
  Sfx.ctx(); const a = t.dataset.act, id = t.dataset.id;
  if (a !== 'go' || t.dataset.to) Sfx.click();
  switch (a) {
    case 'go': if (t.dataset.to === 'title' && Mic.ok && !Run.active) Mic.stop(); closeModal(); go(t.dataset.to); break;
    case 'splash': dismissSplash(); break;
    case 'mode-step': modeStep(+t.dataset.d); break;
    case 'mode-classic': Mic.stop(); S.mode = 'classic'; save(); go('loadout'); break;
    case 'play': if (!S.seenStory) { renderStory(true); show('scr-story'); } else go('loadout'); break;
    case 'story-done': S.seenStory = true; save(); go('loadout'); break;
    case 'story-replay': closeModal(); go('story'); break;
    case 'settings': openSettings(); break;
    case 'close-modal': closeModal(); break;
    case 'trait-pick': S.trait = id; save(); Sfx.tone(660, 0.1, 'triangle', 0.1); $('#scr-shop').classList.contains('on') ? renderShop() : renderLoadout(); break;
    case 'trait-buy': { const tr = traitById(id); if (Treesh.spend(tr.cost, 'DGC: trait ' + tr.name)) { S.traits.push(id); S.trait = id; S.stats.bought++; save(); unlock('shopper'); checkMetaAch(); Sfx.chime(); toast(tr.name + ' unlocked', 'Equipped'); renderShop(); } else toast('Not enough Starlites', '', 'bad'); break; }
    case 'cos': { const c = cosById(id); if (!S.owned.includes(id)) { if (!Treesh.spend(c.cost, 'DGC: ' + c.name)) { toast('Not enough Starlites', 'You need ' + c.cost, 'bad'); break; } S.owned.push(id); S.stats.bought++; unlock('shopper'); toast(c.name + ' unlocked'); }
      S.look = Object.assign(lookOf(), { [c.kind]: id }); save(); if (id !== 'charm_none' && id !== 'light_warm') unlock('dressed'); renderShop(); break; }
    case 'diff': S.diff = id; save(); Sfx.tone(440, 0.1, 'triangle', 0.1); renderLoadout(); break;
    case 'buy': { const it = itemById(id); if (Treesh.spend(it.cost, 'DGC: ' + it.name)) { S.inv[id] = (S.inv[id] || 0) + 1; S.stats.bought++; save(); unlock('shopper'); Sfx.chime([660, 990]); toast('Bought ' + it.name, 'Owned: ' + S.inv[id]); renderShop(); } else toast('Not enough Starlites', '', 'bad'); break; }
    case 'demo-stars': { const st = Treesh.stars(); st.points = (st.points || 0) + 500; LS.set('treesh_stars', st); Treesh.ping(); renderShop(); break; }
    case 'lo-toggle': { const i = UI.loadout.indexOf(id); if (i >= 0) UI.loadout.splice(i, 1); else if (UI.loadout.length < 3) UI.loadout.push(id); else toast('Your pockets are full', 'Bring up to 3 items'); renderLoadout(); break; }
    case 'go-run': if (modeById(S.mode).voice) micSetup(); else startRun(S.mode, UI.loadout); break;
    case 'start-run': startRun(S.mode, UI.loadout); break;
    case 'retry': go('loadout'); break;
    case 'daily': closeModal(); renderDaily(); show('scr-loadout'); break;
    case 'daily-start': startRun('classic', [], { daily: true }); break;
    case 'killer': S.killer = id; save(); renderLoadout(); break;
    case 'share': { const di = dailyInfo(), n = +t.dataset.n, txt = `Don\u2019t Get Caught \u00b7 Nightly #${di.no} (${di.mod.name}): I survived ${n} night${n === 1 ? '' : 's'}. Can you? https://treesh.app/games/dgc`;
      if (navigator.share) navigator.share({ text: txt }).catch(() => {}); else { try { navigator.clipboard.writeText(txt); toast('Copied to clipboard', 'Paste it anywhere'); } catch (x) { toast('Couldn\u2019t copy'); } } break; }
    case 'pause': pauseRun(); break;
    case 'resume': closeModal(); break;
    case 'quit-run': modalClose = null; closeModal(); Run.paused = false; caught('quit'); break;
  }
});
document.addEventListener('click', e => { const b = e.target.closest('.item-btn'); if (b) useItem(b.dataset.item); });
document.addEventListener('keydown', e => {
  if (e.target.matches && e.target.matches('input')) return;
  if (!Run.active || !R) return;
  if (e.key === 'Escape') { if (!$('#modal').hidden) closeModal(); else pauseRun(); return; }
  if (Run.paused) return;
  if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); if (!R.started) return beginRound(); if (R.done) { const nb = $('#next-btn'); if (nb && !e.repeat) nb.click(); return; } if (!e.repeat) Input.down(); return; }
  if (/^[1-3]$/.test(e.key) && R.mini.id !== 'dial') { const bs = $$('.item-btn'); const b = bs[+e.key - 1]; if (b && !b.disabled) useItem(b.dataset.item); return; }
  if (R.started && R.ctx && R.ctx.onKey && !e.repeat) R.ctx.onKey(e.key);
});
document.addEventListener('keyup', e => { if (e.code === 'Space' || e.key === 'Enter') Input.up(); if (Run.active && R && R.started && R.ctx && R.ctx.onKeyUp) R.ctx.onKeyUp(e.key); });
window.addEventListener('blur', () => Input.up());
window.addEventListener('storage', e => {
  if (e.key === 'treesh_accent') Treesh.applyAccent();
  if (e.key === 'treesh_stars') $$('[data-star-count]').forEach(el => el.textContent = fmt(Treesh.balance()));
  if (e.key === 'treesh_profile' && $('#scr-title').classList.contains('on')) renderTitle();
});

/* ---------- Boot ---------- */
Treesh.applyAccent(); renderTitle(); show('scr-title');
