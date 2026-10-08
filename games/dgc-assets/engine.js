'use strict';
/* Don't Get Caught: run engine (killer AI, rounds, items, scoring) */
const Run = { active: false, newAch: [] };
let R = null, api = null, rafId = 0, lastTs = 0;

const VERBS = { lockpick: 'picking his lock', dial: 'dialing for help', scrub: 'scrubbing away the blood', stitch: 'stitching your wound', keys: 'stealing his keys', closet: 'breathing' };
function reasonText(r) {
  const m = R && R.mini;
  return ({
    seen: 'He turned around and saw you ' + (VERBS[m && m.id] || 'moving') + '.',
    time: 'The candle burned out. He found you in the dark.',
    breath: 'He heard you breathing through the slats.',
    heard: 'You made a sound. He heard every bit of it.',
    offkey: 'You went off-key while he was listening.',
    offlevel: 'Your hum wavered while he was listening.',
    impress: (m && m.imp && m.imp.fail) || 'He was not impressed.',
    quit: 'You gave up. He was waiting right behind you.'
  })[r] || 'He caught you.';
}

function runMods() {
  const c = charById(S.char).mods, p = Run.passive || {};
  return { noise: c.noise || 1, oxy: (c.oxy || 1) * (p.oxy ? 1.5 : 1), voice: (c.voice || 1) * (p.oxy ? 1.2 : 1), warn: c.warn || 1, time: (c.time || 0) + (p.watch ? 8 : 0), seeFakes: !!(c.seeFakes || p.lens), lens: !!p.lens, stars: c.stars || 1, speed: c.speed || {} };
}

/* ---------- Killer AI ---------- */
function makeKiller(n, mods, mini) {
  const p = {
    awayMin: Math.max(1.25, 3.0 - n * 0.1), awayMax: Math.max(2.3, 5.4 - n * 0.18),
    warn: Math.max(0.4, 1.15 - n * 0.045) * mods.warn + (mods.lens ? 0.25 : 0),
    lookMin: 1.3 + Math.min(1, n * 0.05), lookMax: Math.min(mini.survive ? 3.3 : 9, 2.6 + Math.min(1.2, n * 0.06)),
    fake: n < 3 ? 0 : Math.min(0.38, (n - 2) * 0.06), dbl: n < 4 ? 0 : Math.min(0.28, (n - 3) * 0.045)
  };
  return { state: 'away', t: rand(2.4, 3.4), p, fake: false, dblNext: false, didDbl: false, lookAt: 0, warnAt: 0, stepT: 0 };
}
function kSet(k, st, t) { const from = k.state; k.state = st; k.t = t; onKiller(k, from, st); }
function killerStep(k, dt) {
  k.t -= dt;
  if (k.state === 'warn') { k.stepT -= dt; if (k.stepT <= 0) { Sfx.step(0.25 + Math.random() * 0.2); k.stepT = Math.max(0.12, k.p.warn / 4); } }
  if (k.t > 0) return;
  if (k.state === 'away') {
    if (k.dblNext) { k.dblNext = false; k.fake = false; kSet(k, 'warn', Math.max(0.32, k.p.warn * 0.5)); }
    else { k.fake = Math.random() < k.p.fake; kSet(k, 'warn', k.p.warn * (k.fake ? rand(0.8, 1.15) : 1)); }
  } else if (k.state === 'warn') {
    if (k.fake) kSet(k, 'away', rand(k.p.awayMin * 0.6, k.p.awayMax * 0.8));
    else kSet(k, 'look', rand(k.p.lookMin, k.p.lookMax));
  } else if (k.state === 'look') {
    if (!k.didDbl && Math.random() < k.p.dbl) { k.didDbl = true; k.dblNext = true; kSet(k, 'away', rand(0.5, 0.85)); }
    else { k.didDbl = false; kSet(k, 'away', rand(k.p.awayMin, k.p.awayMax)); }
  }
}
function forceTurn(w = 0.35) { if (!R || R.done || R.mini.noKiller) return; const k = R.k; if (k.state === 'away' || (k.state === 'warn' && k.fake)) { k.fake = false; k.dblNext = false; kSet(k, 'warn', Math.min(w, k.state === 'warn' ? k.t : w)); } }

function onKiller(k, from, to) {
  const kp = $('#kp'); if (!kp) return;
  kp.classList.remove('k-away', 'k-warn', 'k-look', 'k-fake'); kp.classList.add('k-' + to);
  const sc = $('#scr-game'); sc.classList.toggle('danger', to === 'look'); sc.classList.toggle('tense', to === 'warn');
  if (to === 'warn') { k.warnAt = now(); Sfx.creak(); if (k.fake && R.mods.seeFakes) kp.classList.add('k-fake'); haptic(25); }
  if (to === 'look') {
    k.lookAt = now(); Sfx.tone(62, 0.6, 'sawtooth', 0.25, 45); Sfx.noise(0.25, 'lowpass', 500, 0.3); haptic(50); shake(1);
    if (!R.mini.survive && !R.mini.noSight && R.lastActive > k.warnAt && now() - R.lastActive < 0.2) { S.stats.close++; save(); toast('Close call!', 'Froze just in time.', 'good'); checkMetaAch(); }
  }
  if (to === 'away' && from === 'warn') Sfx.chuckle();
  renderKiller();
}
function renderKiller() {
  if (!R) return; const k = R.k, m = R.mini, view = m.view || 'default', st = m.noKiller ? 'look' : k.state;
  const labels = Object.assign({ away: 'Back turned', warn: 'Turning\u2026', look: 'WATCHING' }, m.labels || {});
  let src = st === 'look' ? 'hush_front' : 'hush_back';
  if (view === 'bed' && st !== 'look') src = 'room_bedroom';
  if (view === 'closet' && st === 'away') src = 'room_closet';
  const im = $('#kp-img'); if (im && im.dataset.src !== src) { im.src = img(src); im.dataset.src = src; }
  const b = $('#kp-badge'); if (!b) return;
  const fakeTxt = st === 'warn' && k.fake && R.mods.seeFakes;
  b.innerHTML = `<i data-lucide="${st === 'look' ? 'eye' : st === 'warn' ? 'triangle-alert' : 'eye-closed'}"></i>${fakeTxt ? 'Fake-out\u2026' : labels[st]}`;
  b.dataset.state = st; $('#kp').dataset.view = view; icons();
}
function shake(lvl) { if (!S.set.shake) return; const g = $('#app'); g.classList.remove('shake', 'shake2'); void g.offsetWidth; g.classList.add(lvl > 1 ? 'shake2' : 'shake'); }

/* ---------- Run lifecycle ---------- */
function startRun(modeId, bring) {
  Run.active = true; Run.mode = modeId; Run.night = 1; Run.pocket = 0; Run.key = Date.now(); Run.newAch = []; Run.usedItem = false; Run.bag = []; Run.lull = Math.random() < 0.5 ? 0 : 1;
  Run.passive = {}; Run.actives = {}; Run.rosary = false; Run.bring = bring.slice(); Run.t0 = Date.now(); Run.cleanNights = 0;
  bring.forEach(id => {
    const it = itemById(id); if (!it || !(S.inv[id] > 0)) return;
    if (it.type === 'passive') { S.inv[id]--; Run.passive[id] = true; S.stats.items++; }
    else if (it.type === 'guard') Run.rosary = true; else Run.actives[id] = 1;
  });
  S.stats.runs++; S.mode = modeId; save(); checkMetaAch();
  renderGameShell(); show('scr-game'); Sfx.drone(true); nextRound();
}
function nextMini() {
  if (Run.mode === 'lullaby') { Run.lull++; return MINIS[Run.lull % 2 ? 'lullaby_pitch' : 'lullaby_level']; }
  if (Run.mode === 'impress') { if (!Run.bag.length) Run.bag = shuffle(IMPRESSIONS); return impressMini(Run.bag.pop()); }
  if (!Run.bag.length) { Run.bag = shuffle(CLASSIC_ROOMS); if (Run.lastRoom && Run.bag[Run.bag.length - 1] === Run.lastRoom) Run.bag.unshift(Run.bag.pop()); }
  const id = Run.bag.pop(); Run.lastRoom = id; return MINIS[id];
}
function nextRound() {
  const m = nextMini(), n = Run.night, mods = runMods();
  if (api && api.destroy) api.destroy(); api = null; Input.tapCb = null; Input.hold = false;
  R = { mini: m, n, mods, t: 0, progress: 0, done: false, started: false, k: makeKiller(n, mods, m), shieldUntil: 0, adrenUntil: 0, lastActive: -9, loudT: 0 };
  R.limit = (m.limit ? m.limit(n) : 30 + Math.min(10, n * 0.3)) + (m.noKiller ? 0 : mods.time);
  $('#h-night').textContent = n; $('#h-room').textContent = m.name; $('#act-bg').style.backgroundImage = `url(${img(m.room)})`;
  $('#act').style.setProperty('--light', lightRGB(S.char));
  const btn = $('#act-btn'); btn.hidden = !!m.noBtn; btn.innerHTML = `<i data-lucide="${m.icon}"></i><span>${esc(m.verb || '')}</span>`;
  $('#vm').hidden = Run.mode !== 'hush'; $('#act-stage').innerHTML = ''; renderItems(); renderKiller(); updateHud();
  const intro = $('#act-intro');
  intro.innerHTML = `<div class="intro-card" data-testid="round-intro"><p class="kicker">Night ${n}${n % 5 === 0 ? ' \u00b7 Checkpoint' : ''}</p><h2>${esc(m.name)}</h2>${m.imp ? `<p class="intro-imp"><i data-lucide="${m.imp.icon}"></i> Sound like ${esc(m.imp.name)}</p>` : ''}<p>${esc(m.hint)}</p><button class="btn btn-acc" id="round-go" data-testid="round-begin-btn"><i data-lucide="play"></i>Begin</button><small>or press Space</small></div>`;
  intro.hidden = false; icons(); Sfx.shh();
  $('#round-go').onclick = beginRound;
  cancelAnimationFrame(rafId); lastTs = 0; rafId = requestAnimationFrame(loop);
}
function beginRound() {
  if (!R || R.started) return; R.started = true; $('#act-intro').hidden = true;
  const ctx = {
    night: R.n, mods: R.mods, get limit() { return R.limit; },
    speed: () => (R.mods.speed[R.mini.id] || 1) * (now() < R.adrenUntil ? 2 : 1),
    add: p => { if (R.done) return; R.progress = clamp(R.progress + p * (p > 0 && now() < R.adrenUntil && R.mini.id === 'stitch' ? 1 : 1), 0, 100); if (R.progress >= 100) win(); },
    set: p => { if (R.done) return; R.progress = clamp(p, 0, 100); if (R.progress >= 100 && !R.mini.survive) win(); },
    progress: () => R.progress, elapsed: () => R.t, forceTurn, caught: r => caught(r), shielded: () => now() < R.shieldUntil, onKey: null
  };
  R.ctx = ctx; api = R.mini.mount($('#act-stage'), ctx); icons();
}
function loop(ts) {
  rafId = requestAnimationFrame(loop);
  const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0; lastTs = ts;
  if (!R || R.done || !R.started || Run.paused) return;
  step(dt);
}
function step(dt) {
  const m = R.mini, k = R.k; R.t += dt;
  if (!m.noKiller) killerStep(k, dt);
  if (R.done) return;
  api.update(dt, k); if (R.done) return;
  const act = api.isActive(); if (act && !m.survive) R.lastActive = now();
  if (Run.mode === 'hush') {
    const f = Mic.read(), lim = 0.42 * R.mods.voice; R.lvl = (R.lvl || 0) + (f.level - (R.lvl || 0)) * 0.35;
    if (R.lvl > lim) R.loudT += dt; else R.loudT = Math.max(0, R.loudT - dt * 2);
    $('#vm-f').style.width = (R.lvl * 100) + '%'; $('#vm-lim').style.left = (lim * 100) + '%'; $('#vm').classList.toggle('hot', R.lvl > lim);
    if (R.loudT > 0.25) { R.loudT = 0; if (k.state === 'look' && !ctx_sh()) return caught('heard'); forceTurn(0.3); toast('He heard you!', 'Quiet\u2026', 'bad'); }
  }
  if (!m.noKiller && !m.noSight && k.state === 'look' && now() - k.lookAt > 0.14 && act && !ctx_sh()) return caught(m.survive ? 'breath' : 'seen');
  if (R.t >= R.limit) { if (m.survive) return win(); return caught(m.noKiller ? 'impress' : 'time'); }
  const bpm = m.noKiller ? 110 + R.progress * 0.5 : k.state === 'look' ? 165 : k.state === 'warn' ? 135 : 72 + R.progress * 0.45 + (R.t / R.limit) * 30;
  Sfx.heartbeat(dt, bpm); updateHud();
}
const ctx_sh = () => now() < R.shieldUntil;
function updateHud() {
  if (!R) return; const left = Math.max(0, R.limit - R.t);
  $('#h-prog').style.width = R.progress + '%'; $('#h-prog-t').textContent = Math.floor(R.progress) + '%';
  $('#h-candle').style.width = (left / R.limit * 100) + '%'; $('#h-time').textContent = left.toFixed(1) + 's';
  $('.hud-candle').classList.toggle('low', left < 6 && !R.mini.survive);
  $('#h-pocket').textContent = fmt(Run.pocket);
  $('#act').classList.toggle('blackout', now() < R.shieldUntil); $('#act').classList.toggle('adren', now() < R.adrenUntil);
}

function renderItems() {
  const w = $('#h-items'); if (!w) return;
  const ids = Object.keys(Run.actives);
  w.innerHTML = ids.map((id, i) => { const it = itemById(id), left = Run.actives[id]; return `<button class="item-btn" data-item="${id}" ${left ? '' : 'disabled'} data-testid="item-slot-${i + 1}-btn" title="${esc(it.name)}"><i data-lucide="${it.icon}"></i><span>${esc(it.name)}</span></button>`; }).join('')
    + (Run.rosary ? `<span class="item-pass" title="Saint's Rosary ready" data-testid="hud-rosary"><i data-lucide="cross"></i></span>` : '')
    + Object.keys(Run.passive).map(id => `<span class="item-pass" title="${esc(itemById(id).name)}"><i data-lucide="${itemById(id).icon}"></i></span>`).join('');
  icons();
}
function useItem(id) {
  if (!R || R.done || !R.started || !Run.actives[id] || !(S.inv[id] > 0)) return;
  Run.actives[id] = 0; S.inv[id]--; S.stats.items++; Run.usedItem = true; save();
  if (id === 'bell') { const k = R.k; if (k.state === 'away') k.t += 4; else { k.fake = false; kSet(k, 'away', 4); } Sfx.musicBox(); toast('Music Box', 'He wanders off to find it\u2026'); }
  if (id === 'blackout') { R.shieldUntil = now() + 3; Sfx.noise(0.3, 'lowpass', 300, 0.4); toast('Lights out', '3 seconds of darkness.'); }
  if (id === 'adren') { R.adrenUntil = now() + 6; Sfx.tone(200, 0.5, 'sawtooth', 0.12, 800); toast('Adrenaline', 'Move! Move! Move!'); }
  renderItems();
}

function win() {
  if (R.done) return; R.done = true; Input.hold = false;
  const m = R.mini, n = Run.night, left = R.limit - R.t, gain = Math.round((4 + n * 2) * R.mods.stars);
  Run.pocket += gain; S.stats.rounds++;
  const rk = m.imp ? 'impress' : m.id; S.stats.rooms[rk] = (S.stats.rooms[rk] || 0) + 1;
  if (m.imp) { S.stats.imp[m.imp.id] = (S.stats.imp[m.imp.id] || 0) + 1; unlock('imp1'); if (IMPRESSIONS.every(i => S.stats.imp[i.id])) unlock('impall'); }
  if (n > (S.stats.best[Run.mode] || 0)) S.stats.best[Run.mode] = n;
  if (!Run.usedItem) Run.cleanNights++;
  save(); Sfx.chime(); $('#scr-game').classList.remove('danger', 'tense');
  unlock('night1'); if (n >= 5) unlock('night5'); if (n >= 10) unlock('night10'); if (n >= 20) unlock('night20');
  if (!m.survive && !m.noKiller && left < 2) unlock('wire');
  if (Run.cleanNights >= 5 && !Run.usedItem) unlock('clean5');
  if (Run.mode === 'hush' && n >= 3) unlock('silent3'); if (Run.mode === 'lullaby' && n >= 3) unlock('lull3');
  checkMetaAch();
  const cp = n % 5 === 0, intro = $('#act-intro');
  intro.innerHTML = `<div class="intro-card win" data-testid="round-cleared"><p class="kicker">Night ${n} survived</p><h2>${m.imp ? 'He applauds.' : 'Done.'}</h2><p class="pocket-line"><i data-lucide="sparkles"></i> +${gain} Starlites in your pocket \u00b7 <b>${fmt(Run.pocket)}</b> total</p>
    ${cp ? `<p class="cp-txt">A window is open. Escape now and keep everything (+${10 * n} bonus), or push deeper. If he catches you, you lose half your pocket.</p><div class="row"><button class="btn btn-gold" id="esc-btn" data-testid="escape-btn"><i data-lucide="door-open"></i>Escape (+${fmt(Run.pocket + 10 * n)})</button><button class="btn btn-ghost" id="next-btn" data-testid="next-round-btn"><i data-lucide="skull"></i>Push on</button></div>`
      : `<p class="cp-txt">Pocketed Starlites are banked at checkpoints (every 5 nights). Get caught and you lose half.</p><button class="btn btn-acc" id="next-btn" data-testid="next-round-btn"><i data-lucide="chevron-right"></i>Next room</button>`}</div>`;
  intro.hidden = false; icons();
  $('#next-btn').onclick = () => { Run.night++; nextRound(); };
  if (cp) $('#esc-btn').onclick = escapeRun;
}
function caught(reason) {
  if (!R || R.done) return;
  if (Run.rosary && reason !== 'quit') {
    Run.rosary = false; S.inv.rosary = Math.max(0, (S.inv.rosary || 0) - 1); S.stats.items++; Run.usedItem = true; save(); unlock('saved');
    R.shieldUntil = now() + 1.6; const k = R.k; if (!R.mini.noKiller) { k.fake = false; kSet(k, 'away', 4); } else R.t = Math.max(0, R.t - 5);
    flash('white'); Sfx.chime([1320, 990, 1760]); toast('The Rosary burns', 'You live\u2026 this time.', 'good'); renderItems(); return;
  }
  R.done = true; Input.hold = false; if (api && api.destroy) api.destroy();
  S.stats.deaths++; unlock('first_blood');
  const kept = Math.floor(Run.pocket / 2); endRun(false, kept, reason);
}
function escapeRun() { const n = Run.night, amt = Run.pocket + 10 * n; S.stats.escapes++; unlock('escape'); if (n >= 10) unlock('escape10'); endRun(true, amt, 'escape'); }
function endRun(escaped, bank, reason) {
  Run.active = false; Run.paused = false; cancelAnimationFrame(rafId); Sfx.drone(false);
  S.stats.playMs += Date.now() - Run.t0;
  const banked = bank > 0 ? Treesh.earn(bank, 'Don\u2019t Get Caught', Run.key) : 0;
  if (banked > (S.stats.bestBank || 0)) S.stats.bestBank = banked; save(); checkMetaAch();
  const survived = escaped ? Run.night : Run.night - 1, res = { escaped, banked, reason, survived, mode: Run.mode, text: escaped ? 'You slipped out the back door before dawn.' : reasonText(reason) };
  if (escaped || reason === 'quit') { Mic.stop(); renderOver(res); show('scr-over'); }
  else jumpScare(res);
}
function flash(c) { if (!S.set.flash) return; const f = $('#flash'); f.style.background = c; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); }
function jumpScare(res) {
  const js = $('#js'), comedic = res.reason === 'impress';
  js.innerHTML = `<img src="${img('hush_scare')}" alt="" data-testid="jumpscare-image"><p class="js-cap">${comedic ? esc(res.text) : 'CAUGHT'}</p>`;
  js.hidden = false; js.classList.toggle('noflash', !S.set.flash); js.classList.remove('go'); void js.offsetWidth; js.classList.add('go');
  Sfx.scream(); if (comedic) setTimeout(() => Sfx.honk(), 700); shake(2); haptic([80, 40, 200]);
  setTimeout(() => { js.hidden = true; js.classList.remove('go'); Mic.stop(); renderOver(res); show('scr-over'); }, 1900);
}
function pauseRun() {
  if (!Run.active) return; Run.paused = true; Input.hold = false;
  openModal(`<h3>Paused</h3><p>He\u2019s still in the house. If you quit now, you keep half your pocket (${fmt(Math.floor(Run.pocket / 2))} Starlites).</p><div class="row"><button class="btn btn-acc" data-act="resume" data-testid="pause-resume-btn"><i data-lucide="play"></i>Resume</button><button class="btn btn-ghost" data-act="quit-run" data-testid="pause-quit-btn"><i data-lucide="log-out"></i>Quit run</button></div>`, () => { Run.paused = false; lastTs = 0; });
}
document.addEventListener('visibilitychange', () => { if (document.hidden && Run.active && R && R.started && !R.done && !Run.paused) pauseRun(); });
