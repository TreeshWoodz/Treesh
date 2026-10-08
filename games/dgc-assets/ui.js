'use strict';
/* Don't Get Caught: screens & UI */
const UI = { charSel: null, loadout: [], shopTab: 'items' };
function show(id) { $$('.scr').forEach(s => s.classList.toggle('on', s.id === id)); const s = $('#' + id); if (s) s.scrollTop = 0; document.body.dataset.scr = id; }
const starChip = () => `<span class="stars" data-testid="starlites-display"><i data-lucide="sparkles"></i><b data-star-count data-testid="starlites-display-amount">${fmt(Treesh.balance())}</b></span>`;
const subTop = (title, back = 'title') => `<header class="topbar sub"><button class="ic-btn" data-act="go" data-to="${back}" data-testid="back-btn" aria-label="Back"><i data-lucide="arrow-left"></i></button><h2>${title}</h2>${starChip()}</header>`;
function portrait(cid, cls = '') {
  const l = lookOf(cid), t = cosById(l.tint), ch = cosById(l.charm);
  return `<div class="portrait ${cls}" style="--tint:${t ? t.val : 'transparent'}"><img src="${img('char_' + cid)}" alt="${esc(charById(cid).name)}"><i class="tint"></i>${ch && ch.val ? `<span class="charm"><i data-lucide="${ch.val}"></i></span>` : ''}</div>`;
}
function avatarHtml() { const a = Treesh.avatar(), n = Treesh.name(); return a ? `<img src="${esc(a)}" alt="" data-testid="user-profile-avatar">` : `<span class="av-mono" data-testid="user-profile-avatar">${esc(n.slice(0, 1).toUpperCase())}</span>`; }

/* ---------- Title ---------- */
function renderTitle() {
  const c = charById(S.char), l = lookOf(c.id), best = bestNightAll(), m = modeById(S.mode);
  $('#scr-title').innerHTML = `<div class="title-bg" style="background-image:url(${img('key_art')})"></div>
  <header class="topbar"><div class="prof" data-testid="user-profile-chip">${avatarHtml()}<span><small>Playing as</small><b data-testid="user-profile-name">${esc(Treesh.name())}</b></span></div><div class="tb-r">${starChip()}<button class="ic-btn" data-act="settings" data-testid="settings-open-btn" aria-label="Settings"><i data-lucide="settings"></i></button></div></header>
  <div class="title-wrap">
    <div class="title-main">
      <p class="kicker">Treesh Games \u00b7 Horror</p>
      <h1 class="logo" data-testid="game-logo">Don\u2019t Get <span>Caught</span></h1>
      <p class="tagline">Mr. Hush only kills what he sees. So don\u2019t let him see you.</p>
      <div class="modes" data-testid="mode-list">${MODES.map(md => `<button class="mode ${md.id === m.id ? 'on' : ''}" data-act="mode" data-id="${md.id}" data-testid="mode-${md.id}-btn"><i data-lucide="${md.icon}"></i><span><b>${md.name}</b><small>${md.tag}${S.stats.best[md.id] ? ' \u00b7 Best night ' + S.stats.best[md.id] : ''}</small></span>${md.voice ? '<em><i data-lucide="mic"></i></em>' : ''}</button>`).join('')}</div>
      <p class="mode-desc" data-testid="mode-desc">${esc(m.desc)}</p>
      <div class="row"><button class="btn btn-acc btn-xl" data-act="play" data-testid="start-game-btn"><i data-lucide="skull"></i>Enter the house</button></div>
      <nav class="title-nav">
        <button data-act="go" data-to="chars" data-testid="chars-open-btn"><i data-lucide="users"></i>Survivors</button>
        <button data-act="go" data-to="shop" data-testid="shop-open-btn"><i data-lucide="shopping-bag"></i>Shop</button>
        <button data-act="go" data-to="trophies" data-testid="achievements-open-btn"><i data-lucide="trophy"></i>Trophies</button>
        <button data-act="go" data-to="story" data-testid="story-open-btn"><i data-lucide="book-open"></i>Story</button>
      </nav>
    </div>
    <aside class="title-char" data-act="go" data-to="chars" data-testid="title-survivor-card">${portrait(c.id)}<div><small>${esc(l.title || c.role)}</small><b>${esc(c.name)}</b><span class="perk"><i data-lucide="sparkle"></i>${esc(c.perk)}</span><span class="rank" data-testid="title-rank"><i data-lucide="trophy"></i>${rankOf(best)}${best ? ' \u00b7 Night ' + best : ''}</span></div></aside>
  </div>`;
  icons();
}

/* ---------- Story ---------- */
function renderStory(thenPlay) {
  const n = esc(Treesh.name()), c = charById(S.char);
  const panels = [
    ['key_art', `${n}. Wake up. Quietly.`, `You don\u2019t remember the drive. You remember headlights, then nothing. Now you\u2019re in an old house that smells like wet wood and pennies.`],
    ['hush_front', 'This is Mr. Hush.', `He never speaks. He only listens and watches. He has one rule, and he lets his guests learn it the hard way: <b>he only kills what he sees.</b>`],
    ['room_door', 'So work while he isn\u2019t looking.', `Pick the locks. Call for help. Clean up what you\u2019ve done. Every night is a new room. Listen for his footsteps. When he turns, <b>freeze</b>.`],
    ['hush_back', 'Survive until dawn.', `Every five nights a window opens. Escape and keep your Starlites, or go deeper for more. ${esc(c.name)} is counting on you.`]
  ];
  $('#scr-story').innerHTML = `${subTop('The Story')}<div class="story">${panels.map((p, i) => `<article class="panel" style="--d:${i * 0.15}s"><div class="panel-img" style="background-image:url(${img(p[0])})"></div><div><h3>${p[1]}</h3><p>${p[2]}</p></div></article>`).join('')}
  <div class="row center"><button class="btn btn-acc btn-xl" data-act="${thenPlay ? 'story-done' : 'go'}" data-to="title" data-testid="story-continue-btn"><i data-lucide="${thenPlay ? 'skull' : 'arrow-left'}"></i>${thenPlay ? 'I understand' : 'Back'}</button></div></div>`;
  icons();
}

/* ---------- Survivors & customize ---------- */
function renderChars() {
  const sel = charById(UI.charSel || S.char), owned = S.chars.includes(sel.id), l = lookOf(sel.id), bal = Treesh.balance();
  const cosRow = kind => COSMETICS.filter(c => c.kind === kind).map(c => {
    const own = S.owned.includes(c.id), on = l[kind] === c.id, sw = kind === 'tint' ? `<i class="sw" style="background:${c.id === 'tint_none' ? 'linear-gradient(135deg,#333,#111)' : c.val}"></i>` : kind === 'charm' ? `<i data-lucide="${c.val || 'circle-off'}"></i>` : `<i class="sw" style="background:${c.val === 'acc' ? 'var(--acc)' : 'rgb(' + c.val + ')'}"></i>`;
    return `<button class="cos ${on ? 'on' : ''} ${own ? '' : 'locked'}" data-act="cos" data-id="${c.id}" data-testid="cos-${c.id}" ${!owned ? 'disabled' : ''}>${sw}<span>${esc(c.name)}</span>${own ? '' : `<em><i data-lucide="sparkles"></i>${c.cost}</em>`}</button>`;
  }).join('');
  $('#scr-chars').innerHTML = `${subTop('Survivors')}<div class="chars">
    <div class="char-list" data-testid="char-list">${CHARS.map(c => { const o = S.chars.includes(c.id); return `<button class="char-card ${c.id === sel.id ? 'on' : ''} ${o ? '' : 'locked'}" data-act="char-view" data-id="${c.id}" data-testid="char-card-${c.id}">${portrait(c.id, 'sm')}<span><b>${esc(c.name)}</b><small>${esc(c.role)}</small></span>${S.char === c.id ? '<em class="tag">Selected</em>' : o ? '' : `<em class="tag gold"><i data-lucide="lock"></i>${c.cost}</em>`}</button>`; }).join('')}</div>
    <section class="char-detail" data-testid="char-detail">
      <div class="cd-top">${portrait(sel.id, 'lg')}<div class="cd-info"><p class="kicker">${esc(l.title || sel.role)}</p><h2>${esc(sel.name)}</h2><p class="bio">${esc(sel.bio)}</p><div class="perk-box"><i data-lucide="sparkle"></i><div><b>${esc(sel.perk)}</b><span>${esc(sel.desc)}</span></div></div>
      ${owned ? (S.char === sel.id ? `<button class="btn btn-ghost" disabled data-testid="char-selected-btn"><i data-lucide="check"></i>Selected</button>` : `<button class="btn btn-acc" data-act="char-pick" data-id="${sel.id}" data-testid="char-select-btn"><i data-lucide="user-check"></i>Play as ${esc(sel.name.split(' ')[0])}</button>`)
        : `<button class="btn btn-gold" data-act="char-buy" data-id="${sel.id}" ${bal < sel.cost ? 'disabled' : ''} data-testid="char-unlock-btn"><i data-lucide="lock-open"></i>Unlock \u00b7 ${sel.cost} Starlites</button>`}</div></div>
      ${owned ? `<div class="cust" data-testid="customize-panel"><h3><i data-lucide="shirt"></i>Customize</h3>
        <label class="cust-l">Title<input id="cust-title" maxlength="22" placeholder="${esc(sel.role)}" value="${esc(l.title)}" data-testid="cust-title-input"></label>
        <p class="cust-h">Outfit dye</p><div class="cos-row">${cosRow('tint')}</div>
        <p class="cust-h">Lucky charm</p><div class="cos-row">${cosRow('charm')}</div>
        <p class="cust-h">Flashlight</p><div class="cos-row">${cosRow('light')}</div></div>` : `<p class="muted">Unlock ${esc(sel.name.split(' ')[0])} to customize their look.</p>`}
    </section></div>`;
  icons();
  const ti = $('#cust-title'); if (ti) ti.onchange = () => { setLook(sel.id, 'title', ti.value.trim().slice(0, 22)); toast('Title saved'); };
}
function setLook(cid, key, val) { S.look[cid] = Object.assign(lookOf(cid), { [key]: val }); save(); unlock('dressed'); }

/* ---------- Shop ---------- */
function renderShop() {
  const bal = Treesh.balance(), hosted = /(^|\.)treesh\.app$/i.test(location.hostname);
  $('#scr-shop').innerHTML = `${subTop('The Pantry')}<div class="shop">
    <p class="shop-intro">Things you can use to stay alive. Paid with your Treesh Starlites. Bring up to 3 into each run.</p>
    ${hosted ? '' : `<button class="btn btn-ghost sm" data-act="demo-stars" data-testid="demo-stars-btn"><i data-lucide="flask-conical"></i>Preview only: +500 test Starlites</button>`}
    <div class="shop-grid">${ITEMS.map(it => `<article class="shop-item" data-testid="shop-item-${it.id}"><div class="si-ic"><i data-lucide="${it.icon}"></i></div><div class="si-b"><h3>${esc(it.name)} <small>${it.type === 'active' ? 'Use in a room' : it.type === 'guard' ? 'Automatic' : 'Lasts a run'}</small></h3><p>${esc(it.desc)}</p>
      <div class="si-f"><span class="owned" data-testid="shop-owned-${it.id}">Owned: <b>${S.inv[it.id] || 0}</b></span><button class="btn btn-gold sm" data-act="buy" data-id="${it.id}" ${bal < it.cost ? 'disabled' : ''} data-testid="shop-buy-${it.id}"><i data-lucide="sparkles"></i>${it.cost}</button></div></div></article>`).join('')}</div>
    <h3 class="sec-h"><i data-lucide="users"></i>Survivors</h3>
    <div class="shop-chars">${CHARS.filter(c => c.cost).map(c => `<button class="char-card ${S.chars.includes(c.id) ? '' : 'locked'}" data-act="char-view" data-id="${c.id}" data-go="1" data-testid="shop-char-${c.id}">${portrait(c.id, 'sm')}<span><b>${esc(c.name)}</b><small>${esc(c.perk)}</small></span><em class="tag ${S.chars.includes(c.id) ? '' : 'gold'}">${S.chars.includes(c.id) ? 'Owned' : c.cost}</em></button>`).join('')}</div>
    <p class="muted">Outfit dyes, charms and flashlights are in <a href="#" data-act="go" data-to="chars">Survivors</a>.</p></div>`;
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
    <div class="stats" data-testid="stats-grid">${[['Runs', st.runs], ['Nights survived', st.rounds], ['Times caught', st.deaths], ['Escapes', st.escapes], ['Close calls', st.close], ['Items used', st.items], ['Starlites earned', st.earned], ['Starlites spent', st.spent], ['Best Nightfall', st.best.classic], ['Best Dead Silent', st.best.hush], ['Best Lullaby', st.best.lullaby], ['Best Impressions', st.best.impress], ['Play time', Math.round(st.playMs / 60000) + 'm']].map(([k, v]) => `<div><small>${k}</small><b>${typeof v === 'number' ? fmt(v) : v}</b></div>`).join('')}</div></div>`;
  icons();
}

/* ---------- Loadout ---------- */
function renderLoadout() {
  const m = modeById(S.mode), c = charById(S.char);
  UI.loadout = UI.loadout.filter(id => S.inv[id] > 0);
  const own = ITEMS.filter(i => S.inv[i.id] > 0);
  $('#scr-loadout').innerHTML = `${subTop('Before you go in')}<div class="loadout">
    <section class="lo-who" data-act="go" data-to="chars" data-testid="loadout-survivor">${portrait(c.id)}<div><small>Survivor</small><b>${esc(c.name)}</b><span class="perk"><i data-lucide="sparkle"></i>${esc(c.perk)}: ${esc(c.desc)}</span><span class="link">Change survivor</span></div></section>
    <section class="lo-mode"><i data-lucide="${m.icon}"></i><div><small>Mode</small><b>${m.name}</b><span>${esc(m.desc)}</span></div></section>
    <h3 class="sec-h"><i data-lucide="backpack"></i>Bring up to 3 items <small>${UI.loadout.length}/3</small></h3>
    ${own.length ? `<div class="lo-items">${own.map(it => `<button class="lo-item ${UI.loadout.includes(it.id) ? 'on' : ''}" data-act="lo-toggle" data-id="${it.id}" data-testid="loadout-item-${it.id}"><i data-lucide="${it.icon}"></i><span><b>${esc(it.name)} \u00d7${S.inv[it.id]}</b><small>${esc(it.desc)}</small></span><em><i data-lucide="${UI.loadout.includes(it.id) ? 'check' : 'plus'}"></i></em></button>`).join('')}</div>` : `<p class="muted">No items yet. Buy tools in the <a href="#" data-act="go" data-to="shop">Shop</a> with your Starlites.</p>`}
    <div class="lo-tips"><p><i data-lucide="ear"></i>Listen for footsteps and creaks: that\u2019s him turning.</p><p><i data-lucide="hand"></i>Freeze the moment he turns. One wrong move and it\u2019s over.</p>${m.voice ? '<p><i data-lucide="headphones"></i>Voice mode: use headphones so the game\u2019s sounds don\u2019t reach your mic.</p>' : ''}</div>
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
    <header class="hud-top"><div class="hud-night" data-testid="hud-night"><small>Night</small><b id="h-night">1</b></div><div class="hud-room"><b id="h-room" data-testid="hud-room"></b><small>${esc(modeById(Run.mode).name)} \u00b7 ${esc(charById(S.char).name)}</small></div>
      <div class="hud-pocket" data-testid="hud-pocket" title="Starlites in your pocket"><i data-lucide="sparkles"></i><b id="h-pocket">0</b></div><button class="ic-btn" data-act="pause" data-testid="hud-pause-btn" aria-label="Pause"><i data-lucide="pause"></i></button></header>
    <div class="hud-candle" data-testid="hud-timer"><i id="h-candle" data-testid="hud-timer-fill"></i><span><i data-lucide="flame"></i><b id="h-time"></b></span></div>
    <main class="hud-main"><section class="kp" id="kp" data-testid="killer-panel"><img id="kp-img" alt="Mr. Hush"><div class="kp-fx"></div><div class="kp-badge" id="kp-badge" data-testid="killer-state-badge"></div></section>
      <section class="act" id="act" data-testid="activity-panel"><div class="act-bg" id="act-bg"></div><div class="act-light"></div><div id="act-stage"></div><div class="act-intro" id="act-intro" hidden></div></section></main>
    <footer class="hud-bot"><div class="prog"><i id="h-prog" data-testid="progress-bar-fill"></i><span id="h-prog-t">0%</span></div>
      <div class="vm" id="vm" data-testid="voice-meter" hidden><small>Voice</small><div class="vm-bar"><i id="vm-f"></i><b id="vm-lim"></b></div></div>
      <div class="hud-ctrl"><div class="hud-items" id="h-items" data-testid="hud-items"></div><button class="act-btn" id="act-btn" data-testid="action-hold-btn"></button></div></footer></div>`;
  icons();
  const b = $('#act-btn');
  b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} Input.down(); b.classList.add('down'); });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => b.addEventListener(ev, () => { Input.up(); b.classList.remove('down'); }));
  b.addEventListener('contextmenu', e => e.preventDefault());
}
function renderOver(res) {
  const c = charById(S.char), m = modeById(res.mode), newA = (Run.newAch || []).map(id => ACH.find(a => a.id === id)).filter(Boolean);
  $('#scr-over').innerHTML = `<div class="over ${res.escaped ? 'esc' : 'dead'}" data-testid="game-over">
    <div class="over-img">${portrait(c.id, 'lg ' + (res.escaped ? '' : 'gone'))}</div>
    <div class="over-b"><p class="kicker">${esc(m.name)} \u00b7 ${esc(Treesh.name())} as ${esc(c.name)}</p><h1 data-testid="game-over-title">${res.escaped ? 'Escaped' : 'Caught'}</h1><p class="over-reason" data-testid="game-over-reason">${esc(res.text)}</p>
      <div class="over-stats"><div><small>Nights survived</small><b data-testid="over-nights">${res.survived}</b></div><div><small>Starlites banked</small><b class="gold" data-testid="over-banked"><i data-lucide="sparkles"></i>${fmt(res.banked)}</b></div><div><small>Best (${esc(m.name)})</small><b>${S.stats.best[res.mode] || 0}</b></div></div>
      ${!res.escaped && res.reason !== 'quit' && Run.pocket ? `<p class="muted">He took half your pocket. Escape at a checkpoint to keep it all.</p>` : ''}
      ${newA.length ? `<div class="over-ach"><p class="cust-h">New achievements</p>${newA.map(a => `<span style="--c:${TIERS[a.tier]}"><i data-lucide="${a.icon}"></i>${esc(a.name)}</span>`).join('')}</div>` : ''}
      <div class="row"><button class="btn btn-acc btn-xl" data-act="retry" data-testid="retry-run-btn"><i data-lucide="rotate-ccw"></i>Try again</button><button class="btn btn-ghost" data-act="go" data-to="title" data-testid="over-menu-btn"><i data-lucide="house"></i>Menu</button></div></div></div>`;
  icons();
}

/* ---------- Modal & settings ---------- */
let modalClose = null;
function openModal(html, onClose) { const m = $('#modal'); m.innerHTML = `<div class="modal-card" data-testid="modal">${html}</div>`; m.hidden = false; modalClose = onClose || null; icons(); }
function closeModal() { $('#modal').hidden = true; const f = modalClose; modalClose = null; if (f) f(); }
function openSettings() {
  const t = (k, l, d) => `<label class="tog"><span><b>${l}</b><small>${d}</small></span><input type="checkbox" data-set="${k}" ${S.set[k] ? 'checked' : ''} data-testid="setting-${k}"></label>`;
  openModal(`<h3>Settings</h3>${t('sound', 'Sound', 'Heartbeat, footsteps and screams')}<label class="tog"><span><b>Volume</b></span><input type="range" min="0" max="1" step="0.05" value="${S.set.vol}" data-set="vol" data-testid="setting-vol"></label>${t('flash', 'Flashes', 'Red flashes during jump scares')}${t('shake', 'Screen shake', 'Shake when he looks or catches you')}${t('haptic', 'Vibration', 'On supported phones')}
    <div class="row"><button class="btn btn-ghost" data-act="story-replay" data-testid="settings-story-btn"><i data-lucide="book-open"></i>Replay story</button><button class="btn btn-acc" data-act="close-modal" data-testid="settings-close-btn">Done</button></div>`);
  $$('#modal [data-set]').forEach(i => i.oninput = () => { S.set[i.dataset.set] = i.type === 'checkbox' ? i.checked : +i.value; save(); Sfx.vol(); });
}

/* ---------- Events ---------- */
const GO = { title: renderTitle, chars: renderChars, shop: renderShop, trophies: renderTrophies, story: () => renderStory(false), loadout: renderLoadout };
function go(to) { (GO[to] || renderTitle)(); show('scr-' + to); }
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t) { if (e.target.id === 'modal') closeModal(); return; }
  if (t.tagName === 'A') e.preventDefault();
  Sfx.ctx(); const a = t.dataset.act, id = t.dataset.id;
  if (a !== 'go' || t.dataset.to) Sfx.click();
  switch (a) {
    case 'go': if (t.dataset.to === 'title' && Mic.ok && !Run.active) Mic.stop(); closeModal(); go(t.dataset.to); break;
    case 'mode': S.mode = id; save(); renderTitle(); break;
    case 'mode-classic': Mic.stop(); S.mode = 'classic'; save(); go('loadout'); break;
    case 'play': if (!S.seenStory) { renderStory(true); show('scr-story'); } else go('loadout'); break;
    case 'story-done': S.seenStory = true; save(); go('loadout'); break;
    case 'story-replay': closeModal(); go('story'); break;
    case 'settings': openSettings(); break;
    case 'close-modal': closeModal(); break;
    case 'char-view': UI.charSel = id; go('chars'); break;
    case 'char-pick': S.char = id; save(); renderChars(); toast(charById(id).name + ' selected'); break;
    case 'char-buy': { const c = charById(id); if (Treesh.spend(c.cost, 'DGC: unlocked ' + c.name)) { S.chars.push(id); S.char = id; S.stats.bought++; save(); unlock('shopper'); checkMetaAch(); Sfx.chime(); toast(c.name + ' unlocked'); renderChars(); } else toast('Not enough Starlites', '', 'bad'); break; }
    case 'cos': { const c = cosById(id), cid = UI.charSel || S.char; if (!S.owned.includes(id)) { if (!Treesh.spend(c.cost, 'DGC: ' + c.name)) { toast('Not enough Starlites', 'You need ' + c.cost, 'bad'); break; } S.owned.push(id); S.stats.bought++; unlock('shopper'); toast(c.name + ' unlocked'); }
      setLook(cid, c.kind, id); renderChars(); break; }
    case 'buy': { const it = itemById(id); if (Treesh.spend(it.cost, 'DGC: ' + it.name)) { S.inv[id] = (S.inv[id] || 0) + 1; S.stats.bought++; save(); unlock('shopper'); Sfx.chime([660, 990]); toast('Bought ' + it.name, 'Owned: ' + S.inv[id]); renderShop(); } else toast('Not enough Starlites', '', 'bad'); break; }
    case 'demo-stars': { const st = Treesh.stars(); st.points = (st.points || 0) + 500; LS.set('treesh_stars', st); Treesh.ping(); renderShop(); break; }
    case 'lo-toggle': { const i = UI.loadout.indexOf(id); if (i >= 0) UI.loadout.splice(i, 1); else if (UI.loadout.length < 3) UI.loadout.push(id); else toast('Your pockets are full', 'Bring up to 3 items'); renderLoadout(); break; }
    case 'go-run': if (modeById(S.mode).voice) micSetup(); else startRun(S.mode, UI.loadout); break;
    case 'start-run': startRun(S.mode, UI.loadout); break;
    case 'retry': go('loadout'); break;
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
  if (R.ctx && R.ctx.onKey && !e.repeat) R.ctx.onKey(e.key);
});
document.addEventListener('keyup', e => { if (e.code === 'Space' || e.key === 'Enter') Input.up(); });
window.addEventListener('blur', () => Input.up());
window.addEventListener('storage', e => {
  if (e.key === 'treesh_accent') Treesh.applyAccent();
  if (e.key === 'treesh_stars') $$('[data-star-count]').forEach(el => el.textContent = fmt(Treesh.balance()));
  if (e.key === 'treesh_profile' && $('#scr-title').classList.contains('on')) renderTitle();
});

/* ---------- Boot ---------- */
Treesh.applyAccent(); renderTitle(); show('scr-title');
