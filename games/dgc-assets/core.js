'use strict';
/* Don't Get Caught: core (storage, Treesh bridge, data, audio) */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Math.round(n || 0).toLocaleString();
const now = () => performance.now() / 1000;
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
};
const ASSET = '/games/dgc-assets/';
const img = n => ASSET + n + '.webp';
const icons = () => { try { window.lucide && lucide.createIcons(); } catch (e) {} };

/* ---------- Treesh bridge: profile, accent, shared Starlites wallet ---------- */
const STAR_DEFAULT = { points: 0, lastDaily: null, streak: 0, newSongs: {}, minToday: 0, min30Date: null, secAccum: 0, totalMin: 0, games: 0, beats: 0, log: [] };
const Treesh = {
  profile() { const p = LS.get('treesh_profile', null); return (p && typeof p === 'object') ? p : null; },
  name() { const p = this.profile(); return (p && p.nickname) || 'Guest'; },
  avatar() { const p = this.profile(), a = p && (p.avatar || p.avatarUrl); return (a && /^(data:image|https?:|blob:|\/)/.test(a)) ? a : ''; },
  accent() { const a = LS.get('treesh_accent', '#9328ff'); return (typeof a === 'string' && /^#[0-9a-f]{6}$/i.test(a)) ? a : '#9328ff'; },
  stars() { const st = LS.get('treesh_stars', null); return Object.assign({}, STAR_DEFAULT, (st && typeof st === 'object') ? st : {}); },
  balance() { return Math.max(0, Math.floor(this.stars().points || 0)); },
  earn(amount, reason, mergeKey) {
    amount = Math.round(amount); if (!(amount > 0)) return 0;
    const st = this.stars(); st.points = (st.points || 0) + amount; st.log = Array.isArray(st.log) ? st.log : [];
    const top = st.log[0];
    if (mergeKey && top && top.t === mergeKey) { top.a += amount; top.r = reason; }
    else { st.log.unshift({ t: mergeKey || Date.now(), a: amount, r: reason }); if (st.log.length > 50) st.log.length = 50; }
    LS.set('treesh_stars', st); S.stats.earned += amount; save(); this.ping(); return amount;
  },
  spend(amount, reason) {
    const st = this.stars(); if ((st.points || 0) < amount) return false;
    st.points -= amount; st.log = Array.isArray(st.log) ? st.log : [];
    st.log.unshift({ t: Date.now(), a: -amount, r: reason }); if (st.log.length > 50) st.log.length = 50;
    LS.set('treesh_stars', st); S.stats.spent += amount; save(); this.ping(); return true;
  },
  ping() {
    $$('[data-star-count]').forEach(el => { el.textContent = fmt(this.balance()); el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
    try { if (window.parent && window.parent !== window) window.parent.postMessage({ source: 'dgc', type: 'treesh-stars-updated', points: this.balance() }, '*'); } catch (e) {}
  },
  applyAccent() {
    const h = this.accent(), n = parseInt(h.slice(1), 16), r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255, d = document.documentElement.style;
    d.setProperty('--acc', h); d.setProperty('--acc-rgb', r + ',' + g + ',' + b);
  }
};

/* ---------- Game save ---------- */
const SAVE_KEY = 'dgc_save_v1';
function defSave() {
  return { v: 1, inv: {}, char: 'mara', chars: ['mara', 'eli'], look: {}, owned: ['tint_none', 'tint_accent', 'charm_none', 'light_warm', 'light_accent'], ach: {},
    stats: { runs: 0, deaths: 0, rounds: 0, escapes: 0, best: { classic: 0, hush: 0, lullaby: 0, impress: 0 }, earned: 0, spent: 0, items: 0, close: 0, rooms: {}, imp: {}, playMs: 0, bought: 0, bestBank: 0 },
    set: { vol: 0.8, sound: true, flash: true, shake: true, haptic: true, taunts: true }, mode: 'classic', seenStory: false, killer: 'hush', daily: { key: '', played: false, best: 0, streak: 0, last: '' } };
}
function loadSave() {
  const d = defSave(), s = LS.get(SAVE_KEY, null); if (!s || typeof s !== 'object') return d;
  const st = Object.assign(d.stats, s.stats || {}); st.best = Object.assign(defSave().stats.best, (s.stats || {}).best || {});
  return Object.assign(d, s, { stats: st, set: Object.assign(d.set, s.set || {}), daily: Object.assign(d.daily, s.daily || {}) });
}
let S = loadSave();
function save() { LS.set(SAVE_KEY, S); }

/* ---------- Data ---------- */
const CHARS = [
  { id: 'mara', name: 'Mara Quinn', role: 'The Nurse', perk: 'Steady Hands', desc: 'Stitching and scrubbing go 25% faster.', cost: 0, mods: { speed: { stitch: 1.25, scrub: 1.25 } },
    bio: 'Night-shift nurse. Took a wrong turn on the county road and woke up in his cellar.' },
  { id: 'eli', name: 'Eli Brandt', role: 'The Quiet One', perk: 'Soft Spoken', desc: 'Voice limit +25%. Noise builds 30% slower. Holds breath 20% longer.', cost: 0, mods: { voice: 1.25, noise: 0.7, oxy: 1.2 },
    bio: 'Seventeen. Says almost nothing. That might keep him alive.' },
  { id: 'theo', name: 'Theo Banks', role: 'The Mechanic', perk: 'Quick Fingers', desc: 'Lockpicking and key-stealing go 30% faster.', cost: 300, mods: { speed: { lockpick: 1.3, keys: 1.3 } },
    bio: 'Fixes engines for a living. Locks are just engines that hate you.' },
  { id: 'june', name: 'June Sato', role: 'The Planner', perk: 'Sharp Ears', desc: 'Warnings last 25% longer. +4s on every candle.', cost: 450, mods: { warn: 1.25, time: 4 },
    bio: 'Counted his footsteps for three nights. She knows his rhythm.' },
  { id: 'rosa', name: 'Grandma Rosa', role: 'The Medium', perk: 'Sixth Sense', desc: 'Sees through his fake-outs. Earns 20% more Starlites.', cost: 800, mods: { seeFakes: true, stars: 1.2 },
    bio: 'She has met men like him before. She is still here. They are not.' }
];
const charById = id => CHARS.find(c => c.id === id) || CHARS[0];

const ITEMS = [
  { id: 'bell', name: 'Music Box', icon: 'music', cost: 60, type: 'active', desc: 'Wind it up. He wanders off to find it and stays away 4 extra seconds.' },
  { id: 'blackout', name: 'Blackout Fuse', icon: 'zap-off', cost: 90, type: 'active', desc: 'Kill the lights and hold your breath. For 3 seconds nothing in the house can find you.' },
  { id: 'adren', name: 'Adrenaline', icon: 'syringe', cost: 70, type: 'active', desc: 'Your hands move twice as fast for 6 seconds.' },
  { id: 'watch', name: 'Pocket Watch', icon: 'watch', cost: 50, type: 'passive', desc: '+8 seconds on every candle for the whole run.' },
  { id: 'lens', name: 'Thermal Lens', icon: 'scan-eye', cost: 100, type: 'passive', desc: 'Spot his fake-outs, plus 0.25s extra warning, for the whole run.' },
  { id: 'oxy', name: 'Oxygen Tin', icon: 'wind', cost: 60, type: 'passive', desc: 'Breath lasts 50% longer and your voice limit is 20% higher for the run.' },
  { id: 'rosary', name: 'Saint\u2019s Rosary', icon: 'cross', cost: 200, type: 'guard', desc: 'Survive one catch. Only used up if it saves you.' }
];
const itemById = id => ITEMS.find(i => i.id === id);

const COSMETICS = [
  { id: 'tint_none', kind: 'tint', name: 'Original', cost: 0, val: 'transparent' },
  { id: 'tint_accent', kind: 'tint', name: 'Treesh Accent', cost: 0, val: 'var(--acc)' },
  { id: 'tint_crimson', kind: 'tint', name: 'Crimson', cost: 40, val: '#b3121f' },
  { id: 'tint_teal', kind: 'tint', name: 'Drowned Teal', cost: 40, val: '#0f8a8a' },
  { id: 'tint_ash', kind: 'tint', name: 'Ash', cost: 40, val: '#8d8d8d' },
  { id: 'tint_gold', kind: 'tint', name: 'Gilded', cost: 60, val: '#c3ab69' },
  { id: 'tint_toxic', kind: 'tint', name: 'Toxic', cost: 60, val: '#7bd400' },
  { id: 'charm_none', kind: 'charm', name: 'No charm', cost: 0, val: '' },
  { id: 'charm_rabbit', kind: 'charm', name: 'Rabbit\u2019s Foot', cost: 50, val: 'rabbit' },
  { id: 'charm_locket', kind: 'charm', name: 'Locket', cost: 50, val: 'heart' },
  { id: 'charm_dice', kind: 'charm', name: 'Bone Dice', cost: 60, val: 'dices' },
  { id: 'charm_moth', kind: 'charm', name: 'Moth', cost: 40, val: 'bug' },
  { id: 'charm_key', kind: 'charm', name: 'Old Key', cost: 40, val: 'key-round' },
  { id: 'charm_eye', kind: 'charm', name: 'Evil Eye', cost: 80, val: 'eye' },
  { id: 'light_warm', kind: 'light', name: 'Candle', cost: 0, val: '255,170,90' },
  { id: 'light_accent', kind: 'light', name: 'Accent', cost: 0, val: 'acc' },
  { id: 'light_cold', kind: 'light', name: 'Moonlight', cost: 30, val: '140,180,255' },
  { id: 'light_blood', kind: 'light', name: 'Blood Moon', cost: 50, val: '230,40,50' },
  { id: 'light_uv', kind: 'light', name: 'Blacklight', cost: 60, val: '160,80,255' }
];
const cosById = id => COSMETICS.find(c => c.id === id);
function lookOf(cid) { return Object.assign({ tint: 'tint_none', charm: 'charm_none', light: 'light_warm', title: '' }, S.look[cid] || {}); }
function lightRGB(cid) { const v = cosById(lookOf(cid).light).val; return v === 'acc' ? getComputedStyle(document.documentElement).getPropertyValue('--acc-rgb').trim() : v; }

const MODES = [
  { id: 'classic', name: 'Nightfall', tag: 'Classic', icon: 'moon', voice: false, desc: 'Six rooms. One killer. Only work while his back is turned.' },
  { id: 'hush', name: 'Dead Silent', tag: 'Voice', icon: 'mic-off', voice: true, desc: 'Same rooms, but your mic is live. Make a sound and he hears you.' },
  { id: 'lullaby', name: 'Lullaby', tag: 'Voice', icon: 'audio-waveform', voice: true, desc: 'Hum along to his shifting note, and never stop when he\u2019s listening.' },
  { id: 'impress', name: 'Impressions', tag: 'Voice \u00b7 Comedy', icon: 'drama', voice: true, desc: 'He\u2019s bored. Sound like a pig. Or a car engine. Or else.' }
];
const modeById = id => MODES.find(m => m.id === id) || MODES[0];

const TIERS = { bronze: '#c0844a', silver: '#cfd3da', gold: '#e8c25a', platinum: '#9fe7ff' };
const ACH = [
  { id: 'first_blood', name: 'First Blood', desc: 'Get caught for the first time.', tier: 'bronze', icon: 'skull' },
  { id: 'night1', name: 'First Light', desc: 'Survive your first night.', tier: 'bronze', icon: 'sunrise' },
  { id: 'night5', name: 'Five Nights', desc: 'Survive 5 nights in one run.', tier: 'silver', icon: 'moon-star' },
  { id: 'night10', name: 'Insomniac', desc: 'Survive 10 nights in one run.', tier: 'gold', icon: 'eye-off' },
  { id: 'night20', name: 'The Unseen', desc: 'Survive 20 nights in one run.', tier: 'platinum', icon: 'ghost' },
  { id: 'escape', name: 'Out the Back Door', desc: 'Escape at a checkpoint and bank your Starlites.', tier: 'bronze', icon: 'door-open' },
  { id: 'escape10', name: 'Houdini', desc: 'Escape after night 10 or later.', tier: 'gold', icon: 'wand-sparkles' },
  { id: 'close', name: 'Hair\u2019s Breadth', desc: 'Freeze a split second before he looks.', tier: 'bronze', icon: 'timer' },
  { id: 'close10', name: 'Nerves of Steel', desc: 'Pull off 10 close calls.', tier: 'silver', icon: 'heart-pulse' },
  { id: 'wire', name: 'Down to the Wire', desc: 'Finish a room with under 2 seconds of candle left.', tier: 'silver', icon: 'flame' },
  { id: 'clean5', name: 'Bare Hands', desc: 'Survive 5 nights without using an item.', tier: 'silver', icon: 'hand' },
  { id: 'tour', name: 'House Tour', desc: 'Clear all six rooms at least once.', tier: 'silver', icon: 'house' },
  { id: 'master', name: 'Master of the House', desc: 'Clear every room 10 times.', tier: 'gold', icon: 'crown' },
  { id: 'shopper', name: 'Window Shopper', desc: 'Buy something in the shop.', tier: 'bronze', icon: 'shopping-bag' },
  { id: 'saved', name: 'Saved by Grace', desc: 'Let the Rosary save your life.', tier: 'bronze', icon: 'cross' },
  { id: 'silent3', name: 'Not a Peep', desc: 'Survive 3 nights in Dead Silent.', tier: 'silver', icon: 'mic-off' },
  { id: 'lull3', name: 'Perfect Pitch', desc: 'Survive 3 nights in Lullaby.', tier: 'silver', icon: 'music-2' },
  { id: 'imp1', name: 'Barnyard Debut', desc: 'Pass your first impression.', tier: 'bronze', icon: 'drama' },
  { id: 'impall', name: 'A Thousand Voices', desc: 'Pass every impression at least once.', tier: 'gold', icon: 'theater' },
  { id: 'dressed', name: 'Dressed to Die', desc: 'Customize a survivor.', tier: 'bronze', icon: 'shirt' },
  { id: 'crew', name: 'The Whole Crew', desc: 'Unlock every survivor.', tier: 'gold', icon: 'users' },
  { id: 'star500', name: 'Starlit', desc: 'Earn 500 Starlites from this game.', tier: 'gold', icon: 'sparkles' },
  { id: 'runs25', name: 'Can\u2019t Stop', desc: 'Play 25 runs.', tier: 'silver', icon: 'repeat' },
  { id: 'bride_unlock', name: 'Something Else Is Listening', desc: 'Survive night 10 and wake the Hollow Bride.', tier: 'silver', icon: 'ear' },
  { id: 'bride5', name: 'Quiet as the Grave', desc: 'Survive 5 nights against the Hollow Bride.', tier: 'gold', icon: 'volume-x' },
  { id: 'daily1', name: 'Night Shift', desc: 'Finish an official Nightly Challenge.', tier: 'bronze', icon: 'calendar-days' },
  { id: 'daily3', name: 'Regular Guest', desc: 'Play the Nightly Challenge 3 nights in a row.', tier: 'silver', icon: 'calendar-check' }
];

/* ---------- Killers ---------- */
const KILLERS = [
  { id: 'hush', name: 'Mr. Hush', sense: 'Sight', icon: 'eye', img: 'hush_front', desc: 'Only kills what he sees. Freeze when he turns around.' },
  { id: 'bride', name: 'The Hollow Bride', sense: 'Sound', icon: 'ear', img: 'bride_close', unlockAt: 10, desc: 'Blind, eyes sewn shut. She hunts by sound: keep your noise under her line, and the closer she gets, the lower that line drops.' }
];
const killerById = id => KILLERS.find(k => k.id === id) || KILLERS[0];
const killerUnlocked = id => !killerById(id).unlockAt || bestNightAll() >= killerById(id).unlockAt;

/* ---------- Seeded RNG (Nightly Challenge) ---------- */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; } return h >>> 0; }
const RNG = { k: Math.random, m: Math.random };
const kr = (a, b) => a + RNG.k() * (b - a), mr = (a, b) => a + RNG.m() * (b - a);
const seededShuffle = (a, r) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const DAILY_MODS = [
  { id: 'paranoid', name: 'Paranoid', icon: 'eye', desc: 'He fakes you out from the very first night.' },
  { id: 'short', name: 'Short Candles', icon: 'flame', desc: 'Every candle burns 20% faster.' },
  { id: 'quick', name: 'Quick Turns', icon: 'zap', desc: 'His warnings are 25% shorter.' },
  { id: 'heavy', name: 'Heavy Hands', icon: 'hand', desc: 'Everything you do is 50% noisier.' },
  { id: 'blind', name: 'Lights Out', icon: 'eye-off', desc: 'No status badge. Trust your ears and his silhouette.' },
  { id: 'blood', name: 'Blood Moon', icon: 'moon', desc: 'Starlites in your pocket are doubled.' }
];
function dailyInfo(d = new Date()) {
  const key = d.toISOString().slice(0, 10), no = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(2026, 0, 1)) / 864e5) + 1;
  const r = mulberry32(hashStr('dgc-nightly-' + key)); r(); return { key, no, mod: DAILY_MODS[Math.floor(r() * DAILY_MODS.length)] };
}
function dailyResetIn() { const n = new Date(), next = Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate() + 1), ms = next - n.getTime(); return Math.floor(ms / 36e5) + 'h ' + Math.floor(ms % 36e5 / 6e4) + 'm'; }
const dailyPlayedToday = () => S.daily.key === dailyInfo().key && S.daily.played;

/* ---------- Spoken taunts (pre-generated voice lines) ---------- */
const TAUNTS = {
  hush: { caught: ['hush_c1', 'hush_c2', 'hush_c3', 'hush_c4', 'hush_c5', 'hush_c6'], time: ['hush_t1'], impress: ['hush_i1', 'hush_i2'], escape: ['hush_e1', 'hush_e2', 'hush_e3', 'hush_e4'] },
  bride: { caught: ['bride_c1', 'bride_c2', 'bride_c3'], escape: ['bride_e1'] }
};
const TAUNT_TEXT = { hush_c1: 'I see you.', hush_c2: 'There you are\u2026', hush_c3: 'Shhh\u2026 it\u2019s over now.', hush_c4: 'You moved. I told you\u2026 not to move.', hush_c5: 'Found you.', hush_c6: 'Hush now. Hush.', hush_t1: 'The candle\u2019s out. So are you.', hush_i1: 'That\u2026 was pathetic.', hush_i2: 'Do it again. Oh, wait. You can\u2019t.', hush_e1: 'Run, little guest. I\u2019ll be waiting.', hush_e2: 'Leaving so soon? Come back tomorrow night.', hush_e3: 'Go on. The door was never locked.', hush_e4: 'I\u2019ll keep your room\u2026 just as you left it.', bride_c1: 'I heard you.', bride_c2: 'Such a loud\u2026 little heart.', bride_c3: 'Shhh. Stay with me\u2026 forever.', bride_e1: 'I\u2019ll listen for you\u2026 always.' };
function pickTaunt(killer, kind) { const t = TAUNTS[killer] || TAUNTS.hush, pool = t[kind] || t.caught; return pick(pool); }
const RANKS = [[0, 'Prey'], [3, 'Hider'], [6, 'Survivor'], [10, 'Phantom'], [15, 'Nightmare'], [20, 'The Unseen']];
function rankOf(best) { let r = RANKS[0][1]; RANKS.forEach(([n, t]) => { if (best >= n) r = t; }); return r; }
function bestNightAll() { return Math.max(0, ...Object.values(S.stats.best)); }

/* ---------- Audio (all synthesized) ---------- */
const Sfx = {
  ac: null, master: null, nb: null, heartT: 0, bpm: 0, droneNodes: null,
  ctx() {
    if (!this.ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; this.ac = new A(); this.master = this.ac.createGain(); this.master.connect(this.ac.destination); this.vol(); }
    if (this.ac.state === 'suspended') this.ac.resume();
    return this.ac;
  },
  vol() { if (this.master) this.master.gain.value = S.set.sound ? S.set.vol : 0; },
  noiseBuf() { if (this.nb) return this.nb; const ac = this.ac, b = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return (this.nb = b); },
  env(g, t, a, peak, r) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + r); },
  tone(f, dur = 0.2, type = 'sine', v = 0.2, f2 = null, delay = 0) {
    const ac = this.ctx(); if (!ac) return; const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    this.env(g, t, 0.01, v, dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dur = 0.2, ftype = 'lowpass', freq = 800, v = 0.2, q = 1, delay = 0) {
    const ac = this.ctx(); if (!ac) return; const t = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = this.noiseBuf(); f.type = ftype; f.frequency.value = freq; f.Q.value = q; this.env(g, t, 0.005, v, dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  },
  thump(v = 0.5, delay = 0) { this.tone(70, 0.16, 'sine', v, 38, delay); this.noise(0.08, 'lowpass', 160, v * 0.4, 1, delay); },
  heartbeat(dt, bpm) {
    if (!bpm) return; this.heartT -= dt;
    if (this.heartT <= 0) { const v = clamp(0.18 + (bpm - 60) / 160, 0.18, 0.7); this.thump(v); this.thump(v * 0.7, 0.14); this.heartT = 60 / bpm; }
  },
  step(v = 0.35) { this.noise(0.12, 'lowpass', 260, v); this.tone(55, 0.12, 'sine', v * 0.6, 40); },
  creak() { this.tone(240, 0.5, 'sawtooth', 0.05, 110); this.noise(0.4, 'bandpass', 700, 0.05, 8); },
  shh() { this.noise(0.9, 'bandpass', 4200, 0.18, 2); },
  click() { this.noise(0.03, 'highpass', 3000, 0.15); },
  tick() { this.tone(1800, 0.03, 'square', 0.04); },
  beep(f = 1200) { this.tone(f, 0.09, 'square', 0.08); },
  buzz() { this.tone(110, 0.35, 'sawtooth', 0.22, 90); this.tone(116, 0.35, 'sawtooth', 0.18, 95); },
  lock() { this.noise(0.05, 'highpass', 2500, 0.3); this.tone(900, 0.08, 'triangle', 0.15, 600, 0.04); },
  jingle() { for (let i = 0; i < 4; i++) this.tone(rand(2500, 4200), 0.12, 'triangle', 0.05, null, i * 0.05); },
  gasp() { this.noise(0.5, 'bandpass', 1400, 0.35, 1.5); },
  scrub() { this.noise(0.09, 'bandpass', rand(1200, 2400), 0.06, 1.2); },
  chuckle() { [0, 0.13, 0.26].forEach((d, i) => this.tone(140 - i * 12, 0.11, 'sawtooth', 0.07, 100, d)); },
  chime(notes = [660, 880, 990, 1320]) { notes.forEach((f, i) => { this.tone(f, 0.6, 'triangle', 0.12, null, i * 0.12); this.tone(f * 2, 0.4, 'sine', 0.03, null, i * 0.12); }); },
  honk() { this.tone(330, 0.25, 'square', 0.2, 300); this.tone(250, 0.35, 'square', 0.2, 200, 0.25); },
  scream() {
    const ac = this.ctx(); if (!ac) return; const t = ac.currentTime, ws = ac.createWaveShaper(), curve = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; curve[i] = Math.tanh(x * 6); } ws.curve = curve; const g = ac.createGain(); this.env(g, t, 0.01, 0.9, 1.3); ws.connect(g); g.connect(this.master);
    [880, 931, 1240].forEach(f => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.35, t + 1.3); o.connect(ws); o.start(t); o.stop(t + 1.4); });
    this.noise(1.2, 'highpass', 1500, 0.6); this.thump(0.9);
  },
  drone(on) {
    const ac = this.ctx(); if (!ac) return;
    if (!on) { if (this.droneNodes) { const n = this.droneNodes; this.droneNodes = null; n.g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.4); setTimeout(() => n.os.forEach(o => { try { o.stop(); } catch (e) {} }), 1500); } return; }
    if (this.droneNodes) return;
    const g = ac.createGain(), f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; g.gain.value = 0.0001; g.gain.setTargetAtTime(0.06, ac.currentTime, 1);
    const os = [43.6, 44.1, 65.4].map(fr => { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); return o; });
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.08; lg.gain.value = 90; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); os.push(lfo);
    f.connect(g); g.connect(this.master); this.droneNodes = { g, os };
  },
  bell() { [0, 0.18].forEach(d => { this.tone(1480, 1.1, 'sine', 0.09, 1440, d); this.tone(2210, 0.8, 'sine', 0.04, null, d); }); },
  vbuf: {}, verb: null,
  async loadVoice(id) {
    if (this.vbuf[id]) return this.vbuf[id]; const ac = this.ctx(); if (!ac) return null;
    try { const r = await fetch(ASSET + 'voice/' + id + '.mp3'); const ab = await r.arrayBuffer(); this.vbuf[id] = await new Promise((ok, no) => ac.decodeAudioData(ab, ok, no)); } catch (e) { return null; }
    return this.vbuf[id];
  },
  preloadVoices(killer) { const t = TAUNTS[killer] || TAUNTS.hush; Object.values(t).flat().forEach(id => this.loadVoice(id)); },
  async speak(id, killer) {
    if (!S.set.taunts) return; const ac = this.ctx(), buf = await this.loadVoice(id); if (!ac || !buf) return;
    if (!this.verb) { const len = ac.sampleRate * 2.4, ir = ac.createBuffer(2, len, ac.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); } this.verb = ac.createConvolver(); this.verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = 0.55; this.verb.connect(vg); vg.connect(this.master); }
    const src = ac.createBufferSource(), hp = ac.createBiquadFilter(), g = ac.createGain();
    src.buffer = buf; src.playbackRate.value = killer === 'bride' ? 0.94 : 0.86; hp.type = 'highpass'; hp.frequency.value = killer === 'bride' ? 260 : 120; g.gain.value = 1.5;
    src.connect(hp); hp.connect(g); g.connect(this.master); g.connect(this.verb); src.start();
    this.noise(buf.duration * 1.1, 'bandpass', 3800, 0.03, 1.5);
  },
  musicBox() { const sc = [523, 494, 440, 392, 440, 494, 523, 392]; sc.forEach((f, i) => this.tone(f, 0.5, 'triangle', 0.06, null, i * 0.32)); }
};
function haptic(ms) { try { if (S.set.haptic && navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

/* ---------- Toasts ---------- */
function toast(title, sub = '', kind = '') {
  const w = $('#toasts'); if (!w) return; const el = document.createElement('div');
  el.className = 'toast ' + kind; el.setAttribute('data-testid', 'toast');
  el.innerHTML = `<b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}`;
  w.appendChild(el); setTimeout(() => el.classList.add('out'), 2600); setTimeout(() => el.remove(), 3100);
}

/* ---------- Achievements ---------- */
function unlock(id) {
  if (S.ach[id]) return false; const a = ACH.find(x => x.id === id); if (!a) return false;
  S.ach[id] = Date.now(); save(); Sfx.chime([880, 1175, 1568]);
  toast('Achievement unlocked', a.name + ' \u00b7 ' + a.tier, 'ach ' + a.tier);
  if (window.Run && Run.newAch) Run.newAch.push(id);
  return true;
}
function checkMetaAch() {
  const st = S.stats;
  if (st.earned >= 500) unlock('star500');
  if (st.runs >= 25) unlock('runs25');
  if (CHARS.every(c => S.chars.includes(c.id))) unlock('crew');
  const rooms = ['lockpick', 'dial', 'scrub', 'stitch', 'keys', 'closet'];
  if (rooms.every(r => (st.rooms[r] || 0) >= 1)) unlock('tour');
  if (rooms.every(r => (st.rooms[r] || 0) >= 10)) unlock('master');
  if (bestNightAll() >= 10) unlock('bride_unlock');
  if (st.close >= 1) unlock('close'); if (st.close >= 10) unlock('close10');
}
