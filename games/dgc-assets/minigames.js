'use strict';
/* Don't Get Caught: classic mini-games. Each returns {update(dt,k), isActive(), destroy()} */
const Input = {
  hold: false, tapCb: null, keyCb: null, downAt: 0,
  down() { if (this.hold) return; this.hold = true; this.downAt = now(); if (this.tapCb) this.tapCb(); },
  up() { this.hold = false; }
};

const MINIS = {};
const pinHtml = n => Array.from({ length: n }, (_, i) => `<i class="pin" data-pin="${i}"><b></b></i>`).join('');

MINIS.lockpick = {
  id: 'lockpick', name: 'The Front Door', room: 'room_door', verb: 'Hold to pick', icon: 'lock-keyhole',
  hint: 'Hold the button (or Space) to work the lock. Let go the moment he turns. Every release slips the pick a little.',
  mount(el, ctx) {
    const pins = 5;
    el.innerHTML = `<div class="mg mg-lock"><div class="lock-body" data-testid="mg-lockpick"><div class="lock-pins">${pinHtml(pins)}</div><div class="lock-shackle"></div><div class="lock-key"></div></div><p class="mg-cap">Tension: <b id="lk-t">steady</b></p></div>`;
    const base = 100 / (11 + ctx.night * 0.45); let was = false, tk = 0, drop = 6;
    return {
      update(dt) {
        const h = Input.hold;
        if (h) { ctx.add(base * ctx.speed() * dt); tk -= dt; if (tk <= 0) { Sfx.tick(); tk = rand(0.12, 0.3); } if (ctx.mut) { drop -= dt; if (drop <= 0) { drop = rand(5, 8); ctx.add(-8); Sfx.click(); toast('A pin slipped!', '', 'bad'); } } }
        else if (was && ctx.progress() > 0 && ctx.progress() < 100) { ctx.add(-1.6); Sfx.click(); }
        was = h; const p = ctx.progress(); el.querySelector('.lock-body').classList.toggle('working', h);
        $$('.pin', el).forEach((pn, i) => { const local = clamp(p / 100 * pins - i, 0, 1); pn.style.setProperty('--lift', local); pn.classList.toggle('set', local >= 1); });
        const t = $('#lk-t', el); if (t) t.textContent = h ? 'turning\u2026' : 'released';
      },
      isActive: () => Input.hold
    };
  }
};

MINIS.dial = {
  id: 'dial', name: 'The Kitchen Phone', room: 'room_kitchen', verb: '', icon: 'phone', noBtn: true,
  hint: 'Dial the number. It\u2019s an old rotary: every digit spins back slowly and you\u2019re exposed until it stops. Wrong digits make noise.',
  mount(el, ctx) {
    const len = 6 + Math.min(4, Math.floor(ctx.night / 3)), seq = [9, 1, 1].concat(Array.from({ length: len - 3 }, () => Math.floor(RNG.m() * 10)));
    let idx = 0, busyUntil = 0, busyStart = 0, scr = false;
    const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, ''];
    el.innerHTML = `<div class="mg mg-dial"><div class="dial-screen" data-testid="mg-dial-sequence">${seq.map((d, i) => `<span data-d="${i}">${d}</span>`).join('')}</div>
      <div class="dial-wrap"><div class="dial-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" class="dr-bg"/><circle cx="50" cy="50" r="46" class="dr-fg" id="dr-fg" pathLength="100"/></svg></div>
      <div class="dial-pad">${keys.map(k => k === '' ? '<i></i>' : `<button class="dk" data-k="${k}" data-testid="dial-key-${k}">${k}</button>`).join('')}</div></div>
      <p class="mg-cap pad-hint"><b class="gp" data-b="D">D-pad</b> choose a digit \u00b7 <b class="gp" data-b="A">A</b> dial</p><p class="mg-cap" id="dl-cap">Dial: <b>${seq.join(' ')}</b></p></div>`;
    const press = d => {
      if (now() < busyUntil || idx >= seq.length) return;
      if (d !== seq[idx]) { Sfx.buzz(); haptic(60); ctx.forceTurn(0.4); el.querySelector('.dial-screen').classList.add('err'); setTimeout(() => el.querySelector('.dial-screen') && el.querySelector('.dial-screen').classList.remove('err'), 400); return; }
      const spin = (0.34 + (d === 0 ? 10 : d) * 0.075) / ctx.speed(); busyStart = now(); busyUntil = busyStart + spin; Sfx.beep(600 + d * 60);
      const sp = el.querySelector(`[data-d="${idx}"]`); if (sp) sp.classList.add('ok'); idx++; ctx.add(100 / seq.length * 0.999);
      if (ctx.mut && !scr && idx === Math.floor(seq.length / 2)) { scr = true; setTimeout(() => { if (!el.isConnected) return; for (let i = idx; i < seq.length; i++) { seq[i] = Math.floor(Math.random() * 10); const q = el.querySelector(`[data-d="${i}"]`); if (q) q.textContent = seq[i]; } const cp = $('#dl-cap', el); if (cp) cp.innerHTML = 'Dial: <b>' + seq.join(' ') + '</b>'; Sfx.buzz(); toast('Crossed line!', 'The rest of the number changed\u2026', 'bad'); }, 350); }
      if (idx >= seq.length) setTimeout(() => ctx.add(1), spin * 1000);
    };
    el.addEventListener('pointerdown', e => { const b = e.target.closest('.dk'); if (b) { e.preventDefault(); press(+b.dataset.k); } });
    ctx.onKey = k => { if (/^[0-9]$/.test(k)) press(+k); };
    let tk = 0;
    return {
      update(dt) {
        const busy = now() < busyUntil, fg = $('#dr-fg', el);
        if (fg) fg.style.strokeDashoffset = busy ? 100 - 100 * (busyUntil - now()) / (busyUntil - busyStart) : 100;
        el.querySelector('.dial-wrap').classList.toggle('busy', busy);
        if (busy) { tk -= dt; if (tk <= 0) { Sfx.tick(); tk = 0.07; } }
      },
      isActive: () => now() < busyUntil
    };
  }
};

MINIS.scrub = {
  id: 'scrub', name: 'The Bathroom Floor', room: 'room_bathroom', verb: '', icon: 'paintbrush', noBtn: true,
  hint: 'Scrub the blood: drag back and forth across the stain (or alternate A / D). Stop moving when he looks.',
  mount(el, ctx) {
    el.innerHTML = `<div class="mg mg-scrub"><canvas id="sc-cv" width="320" height="200" data-testid="mg-scrub-canvas"></canvas><p class="mg-cap"><span class="kb-hint">Swipe to scrub \u00b7 Desktop: drag or alternate <kbd>A</kbd> <kbd>D</kbd></span><span class="pad-hint">Flick the left stick left \u2194 right to scrub</span></p></div>`;
    const cv = $('#sc-cv', el), c = cv.getContext('2d', { willReadFrequently: true }), W = 320, H = 200;
    for (let i = 0; i < 26; i++) { const x = mr(40, W - 40), y = mr(30, H - 30), r = mr(14, 46), g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(110,0,8,.98)'); g.addColorStop(.7, 'rgba(80,0,6,.92)'); g.addColorStop(1, 'rgba(60,0,4,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    const base = c.getImageData(0, 0, W, H).data; let total = 0; for (let i = 3; i < base.length; i += 16) if (base[i] > 40) total++;
    let last = null, lastMove = -9, down = false, side = 0, chk = 0, grow = 4.5;
    const blob = () => { const x = rand(40, W - 40), y = rand(30, H - 30), r = rand(16, 34), g = c.createRadialGradient(x, y, 2, x, y, r); g.addColorStop(0, 'rgba(110,0,8,.98)'); g.addColorStop(1, 'rgba(60,0,4,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); Sfx.noise(0.3, 'lowpass', 300, 0.08); };
    const strength = () => (0.09 + 0.02 * 1 / (1 + ctx.night * 0.08)) * ctx.speed();
    const rub = (x, y) => { c.globalCompositeOperation = 'destination-out'; const r = 24; const g = c.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, `rgba(0,0,0,${strength()})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over'; };
    const pos = e => { const b = cv.getBoundingClientRect(); return [(e.clientX - b.left) / b.width * W, (e.clientY - b.top) / b.height * H]; };
    const move = e => {
      if (!down) return; const p = pos(e);
      if (last) { const d = Math.hypot(p[0] - last[0], p[1] - last[1]); if (d > 1.5) { const n = Math.ceil(d / 6); for (let i = 1; i <= n; i++) rub(last[0] + (p[0] - last[0]) * i / n, last[1] + (p[1] - last[1]) * i / n); lastMove = now(); if (Math.random() < 0.25) Sfx.scrub(); } }
      last = p;
    };
    cv.addEventListener('pointerdown', e => { e.preventDefault(); down = true; last = pos(e); try { cv.setPointerCapture(e.pointerId); } catch (x) {} });
    cv.addEventListener('pointermove', move);
    const up = () => { down = false; last = null; }; cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    ctx.onKey = k => { k = k.toLowerCase(); const s = (k === 'a' || k === 'arrowleft') ? 1 : (k === 'd' || k === 'arrowright') ? 2 : 0; if (!s || s === side) return; side = s; const y = rand(20, H - 20), x0 = s === 1 ? W - 20 : 20; for (let i = 0; i < 14; i++) rub(x0 + (s === 1 ? -1 : 1) * i * 21, y + rand(-8, 8)); lastMove = now(); Sfx.scrub(); };
    return {
      update(dt) {
        if (ctx.mut) { grow -= dt; if (grow <= 0) { grow = 4.5; blob(); } }
        chk -= dt; if (chk > 0) return; chk = 0.2;
        const d = c.getImageData(0, 0, W, H).data; let left = 0; for (let i = 3; i < d.length; i += 16) if (d[i] > 40) left++;
        const cleared = 1 - left / Math.max(1, total); ctx.set(clamp(cleared / 0.9 * 100, 0, 100));
      },
      isActive: () => now() - lastMove < 0.2
    };
  }
};

MINIS.stitch = {
  id: 'stitch', name: 'The Workbench', room: 'room_wound', verb: 'Tap to stitch', icon: 'scissors',
  hint: 'Your arm is bleeding. Tap (or Space) when the needle crosses the pale zone. Misses make you cry out.',
  mount(el, ctx) {
    const N = 8 + Math.min(6, Math.floor(ctx.night / 2)); let done = 0, ph = 0, lastTap = -9, zone = 0.22, zc = mr(0.3, 0.7);
    el.innerHTML = `<div class="mg mg-stitch"><div class="st-count" data-testid="mg-stitch-count"><b id="st-n">0</b>/<span>${N}</span> stitches</div><div class="st-bar"><i class="st-zone" id="st-z"></i><i class="st-needle" id="st-nd"></i></div><div class="st-wound">${'<i></i>'.repeat(N)}</div><p class="mg-cap">Tap when the needle is inside the zone</p></div>`;
    const lay = () => { const z = $('#st-z', el); z.style.left = ((zc - zone / 2) * 100) + '%'; z.style.width = (zone * 100) + '%'; };
    lay();
    const pos = () => (Math.sin(ph) + 1) / 2;
    Input.tapCb = () => {
      if (now() - lastTap < 0.22) return; lastTap = now();
      if (Math.abs(pos() - zc) <= zone / 2 + 0.015) {
        done++; ctx.add(100 / N * 0.999); Sfx.tone(520 + done * 30, 0.08, 'triangle', 0.12); const w = $$('.st-wound i', el)[done - 1]; if (w) w.classList.add('on');
        $('#st-n', el).textContent = done; zone = Math.max(0.1, zone - 0.008); zc = mr(0.2, 0.8); lay(); if (done >= N) ctx.add(1);
      } else { Sfx.tone(300, 0.25, 'sawtooth', 0.12, 180); haptic(80); el.querySelector('.st-bar').classList.add('miss'); setTimeout(() => el.querySelector('.st-bar') && el.querySelector('.st-bar').classList.remove('miss'), 300); if (Math.random() < 0.5) ctx.forceTurn(0.45); }
    };
    return {
      update(dt) { if (ctx.mut) { zc = clamp(zc + Math.sin(ph * 0.37) * dt * 0.12, 0.12, 0.88); lay(); } ph += dt * (2.6 + ctx.night * 0.1 + done * 0.06) * Math.min(1.25, ctx.speed()); const n = $('#st-nd', el); if (n) n.style.left = (pos() * 100) + '%'; },
      isActive: () => now() - lastTap < 0.3,
      destroy() { Input.tapCb = null; }
    };
  }
};

MINIS.keys = {
  id: 'keys', name: 'His Bedroom', room: 'room_bedroom', verb: 'Hold to reach', icon: 'key-round', view: 'bed',
  labels: { away: 'Asleep', warn: 'Stirring\u2026', look: 'AWAKE' },
  hint: 'He\u2019s asleep. Hold to slide the keys off the hook. Holding makes noise: let the meter cool or he wakes up.',
  mount(el, ctx) {
    el.innerHTML = `<div class="mg mg-keys"><div class="ky-track"><i class="ky-hand" id="ky-h"><i data-lucide="hand"></i></i><i class="ky-ring"><i data-lucide="key-round"></i></i></div><div class="ky-noise"><span>Noise</span><div class="meter"><i id="ky-n" data-testid="mg-keys-noise"></i></div></div><p class="mg-cap">Short, careful pulls.</p></div>`;
    icons(); let noise = 0, jt = 0; const base = 100 / (12 + ctx.night * 0.4);
    return {
      update(dt) {
        if (Input.hold) { ctx.add(base * ctx.speed() * dt); noise += 30 * ctx.mods.noise * (1 + ctx.night * 0.03) * (ctx.mut ? 1.4 : 1) * dt; jt -= dt; if (jt <= 0) { Sfx.jingle(); jt = rand(0.25, 0.55); } }
        else noise -= 24 * dt;
        noise = clamp(noise, 0, 100); if (noise >= 100) { noise = 55; ctx.forceTurn(0.35); toast('The keys rattle!', 'He heard that.', 'bad'); }
        const n = $('#ky-n', el); n.style.width = noise + '%'; n.classList.toggle('hot', noise > 70);
        $('#ky-h', el).style.left = (ctx.progress() * 0.78) + '%';
      },
      isActive: () => Input.hold
    };
  }
};

MINIS.closet = {
  id: 'closet', name: 'The Closet', room: 'room_closet', verb: 'Hold your breath', icon: 'wind', view: 'closet', survive: true,
  labels: { away: 'Far away', warn: 'Footsteps\u2026', look: 'AT THE DOOR' },
  hint: 'He\u2019s searching the room. HOLD to hold your breath whenever he\u2019s at the door. Breathe when he leaves, or you\u2019ll gasp.',
  limit: n => 20 + n * 0.6,
  mount(el, ctx) {
    el.innerHTML = `<div class="mg mg-closet"><div class="lungs" id="cl-l"><i data-lucide="wind"></i></div><div class="ky-noise"><span>Breath</span><div class="meter"><i id="cl-o" data-testid="oxygen-bar-fill"></i></div></div><p class="mg-cap" id="cl-c">Breathing\u2026 quietly.</p></div>`;
    icons(); let oxy = 100, gasp = 0, bt = 0;
    return {
      update(dt) {
        const holding = Input.hold && now() >= gasp;
        if (holding) { oxy -= 100 / (4.4 * ctx.mods.oxy) * dt; if (oxy <= 0) { oxy = 0; gasp = now() + 0.9; Sfx.gasp(); haptic(120); toast('You gasp for air!', '', 'bad'); } }
        else { oxy += (ctx.mut ? 19 : 32) * dt; bt -= dt; if (bt <= 0 && !Input.hold) { Sfx.noise(0.7, 'bandpass', 900, 0.025, 1); bt = 1.6; } }
        oxy = clamp(oxy, 0, 100); ctx.set(ctx.elapsed() / ctx.limit * 100);
        const o = $('#cl-o', el); o.style.width = oxy + '%'; o.classList.toggle('hot', oxy < 30);
        $('#cl-l', el).classList.toggle('held', holding); $('#cl-c', el).textContent = now() < gasp ? 'GASPING' : holding ? 'Holding\u2026 don\u2019t move.' : 'Breathing\u2026 quietly.';
      },
      isActive: () => !(Input.hold && now() >= gasp)
    };
  }
};

MINIS.tiptoe = {
  id: 'tiptoe', name: 'The Long Hallway', room: 'room_hall', icon: 'footprints', noBtn: true,
  hint: 'Tiptoe down the hall: alternate LEFT and RIGHT feet (tap the feet, or \u2190 \u2192 / A D). The same foot twice makes the boards creak. Freeze when he turns.',
  mount(el, ctx) {
    const N = 16 + Math.min(12, ctx.night); let steps = 0, last = 0, lastAt = -9; const rotten = new Set(); if (ctx.mut) for (let i = 3; i < N; i += 3 + Math.floor(Math.random() * 3)) rotten.add(i);
    el.innerHTML = `<div class="mg mg-tip"><div class="tip-hall" data-testid="mg-tiptoe-hall">${'<i></i>'.repeat(12)}<b id="tp-me"></b></div><p class="mg-cap"><b id="tp-n">0</b>/${N} steps \u00b7 next: <b id="tp-next">either foot</b></p>
      <div class="tip-feet"><button class="tip-foot" data-f="1" data-testid="tiptoe-left"><i data-lucide="footprints"></i>Left<b class="gp pad-hint" data-b="D">\u25c0</b></button><button class="tip-foot" data-f="2" data-testid="tiptoe-right"><i data-lucide="footprints"></i>Right<b class="gp pad-hint" data-b="D">\u25b6</b></button></div></div>`;
    icons();
    const press = f => {
      if (now() - lastAt < 0.16) return;
      if (f === last) { lastAt = now(); Sfx.creak(); Sfx.tone(90, 0.4, 'sawtooth', 0.12, 60); haptic(90, 0.6); ctx.forceTurn(0.4); const h = $('.tip-hall', el); h.classList.remove('bad'); void h.offsetWidth; h.classList.add('bad'); return; }
      if (rotten.has(steps) && now() - lastAt < 0.7) { lastAt = now(); Sfx.creak(); haptic(90, 0.6); ctx.forceTurn(0.4); toast('Rotten board!', 'Pause before stepping on it.', 'bad'); return; }
      last = f; steps++; lastAt = now(); Sfx.step(0.07); ctx.add(100 / N * 0.999); if (steps >= N) ctx.add(1);
      $('#tp-n', el).textContent = steps; $('#tp-next', el).textContent = (f === 1 ? 'RIGHT' : 'LEFT') + (rotten.has(steps) ? ' (rotten: pause first)' : ''); $('.tip-hall', el).classList.toggle('rot', rotten.has(steps)); $('#tp-me', el).style.bottom = (steps / N * 82) + '%';
      $$('.tip-foot', el).forEach(b => b.classList.toggle('next', +b.dataset.f !== f));
    };
    el.addEventListener('pointerdown', e => { const b = e.target.closest('.tip-foot'); if (b) { e.preventDefault(); press(+b.dataset.f); } });
    ctx.onKey = k => { k = k.toLowerCase(); if (k === 'arrowleft' || k === 'a') press(1); if (k === 'arrowright' || k === 'd') press(2); };
    return { update() {}, isActive: () => now() - lastAt < 0.35 };
  }
};

MINIS.safe = {
  id: 'safe', name: 'His Study', room: 'room_safe', icon: 'vault', noBtn: true,
  hint: 'Crack his safe. Hold \u25c0 or \u25b6 (or \u2190 \u2192) to spin the dial. Tap to nudge one notch. Stop exactly on each number and stay still until it clicks.',
  mount(el, ctx) {
    let len = 3, extra = false; const combo = Array.from({ length: len }, () => Math.floor(mr(0, 40))); let ang = Math.floor(mr(0, 40)), dir = 0, held = 0, idx = 0, still = 0, lastN = -1;
    el.innerHTML = `<div class="mg mg-safe"><div class="sf-combo" data-testid="mg-safe-combo">${combo.map((c, i) => `<span data-c="${i}">${String(c).padStart(2, '0')}</span>`).join('')}</div>
      <div class="sf-dial"><i class="sf-ptr"></i><div class="sf-face" id="sf-face">${Array.from({ length: 40 }, (_, i) => `<i style="transform:rotate(${i * 9}deg)" class="${i % 5 ? '' : 'big'}">${i % 5 ? '' : `<b>${i}</b>`}</i>`).join('')}</div><b class="sf-num" id="sf-num" data-testid="mg-safe-number">00</b></div>
      <div class="tip-feet"><button class="tip-foot" data-d="-1" data-testid="safe-left"><i data-lucide="rotate-ccw"></i><b class="gp pad-hint" data-b="D">\u25c0</b></button><button class="tip-foot" data-d="1" data-testid="safe-right"><i data-lucide="rotate-cw"></i><b class="gp pad-hint" data-b="D">\u25b6</b></button></div></div>`;
    icons();
    const start = d => { if (dir) return; dir = d; held = 0; ang = (Math.round(ang) + d + 40) % 40; Sfx.tick(); }, stop = () => { dir = 0; };
    el.addEventListener('pointerdown', e => { const b = e.target.closest('.tip-foot'); if (b) { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} start(+b.dataset.d); } });
    ['pointerup', 'pointercancel'].forEach(ev => el.addEventListener(ev, stop));
    ctx.onKey = k => { if (k === 'ArrowLeft' || k === 'a') start(-1); if (k === 'ArrowRight' || k === 'd') start(1); };
    ctx.onKeyUp = k => { if (/^(ArrowLeft|ArrowRight|a|d)$/.test(k)) stop(); };
    return {
      update(dt) {
        if (dir) { held += dt; if (held > 0.25) ang = (ang + dir * 8 * ctx.speed() * dt + 40) % 40; still = 0; }
        const cur = Math.round(ang) % 40; if (cur !== lastN) { lastN = cur; if (dir) Sfx.tick(); }
        if (!dir && idx < len) { if (cur === combo[idx]) { still += dt; if (still > 0.45) { still = 0; const sp = el.querySelector(`[data-c="${idx}"]`); if (sp) sp.classList.add('ok'); idx++; Sfx.lock(); if (ctx.mut && !extra && idx === 2) { extra = true; combo.push(Math.floor(Math.random() * 40)); len++; $('.sf-combo', el).insertAdjacentHTML('beforeend', `<span data-c="${len - 1}">${String(combo[len - 1]).padStart(2, '0')}</span>`); Sfx.buzz(); toast('Another tumbler!', 'A fourth number appeared\u2026', 'bad'); } ctx.set(idx / len * 100); } } else still = 0; }
        $$('[data-c]', el).forEach((sp, i) => sp.classList.toggle('cur', i === idx));
        $('#sf-face', el).style.transform = `rotate(${-ang * 9}deg)`; $('#sf-num', el).textContent = String(cur).padStart(2, '0');
        $('#sf-num', el).classList.toggle('hit', idx < len && cur === combo[idx]);
      },
      isActive: () => dir !== 0
    };
  }
};

MINIS.radio = {
  id: 'radio', name: 'The Attic Radio', room: 'room_radio', icon: 'radio', verb: 'Hold to transmit',
  hint: 'Drag the tuner (or hold \u2190 \u2192) until the static clears, then HOLD transmit to send a mayday. He can hear you tuning, and the signal drifts.',
  mount(el, ctx) {
    let f = mr(5, 95), tf = mr(10, 90); while (Math.abs(f - tf) < 25) f = mr(5, 95);
    let dir = 0, lastTune = -9, drift = 6, bt = 0, jump = 7; const tol = Math.max(2, 4 - ctx.night * 0.12), rate = 100 / (11 + ctx.night * 0.4);
    el.innerHTML = `<div class="mg mg-radio"><div class="rd-scale" id="rd-sc" data-testid="mg-radio-tuner">${Array.from({ length: 21 }, (_, i) => `<i>${i % 5 ? '' : `<b>${88 + i}</b>`}</i>`).join('')}<em id="rd-ndl"></em></div>
      <div class="lu-row"><span>Signal</span><div class="meter"><i id="rd-sig" data-testid="mg-radio-signal"></i></div></div><p class="mg-cap" id="rd-c">Find the frequency.</p>
      <div class="tip-feet"><button class="tip-foot" data-d="-1" data-testid="radio-left"><i data-lucide="chevron-left"></i><b class="gp pad-hint" data-b="D">\u25c0</b></button><button class="tip-foot" data-d="1" data-testid="radio-right"><i data-lucide="chevron-right"></i><b class="gp pad-hint" data-b="D">\u25b6</b></button></div></div>`;
    icons(); const sc = $('#rd-sc', el); let drag = false;
    const setF = x => { const b = sc.getBoundingClientRect(); f = clamp((x - b.left) / b.width * 100, 0, 100); lastTune = now(); };
    sc.addEventListener('pointerdown', e => { e.preventDefault(); drag = true; try { sc.setPointerCapture(e.pointerId); } catch (x) {} setF(e.clientX); });
    sc.addEventListener('pointermove', e => { if (drag) setF(e.clientX); }); ['pointerup', 'pointercancel'].forEach(ev => sc.addEventListener(ev, () => drag = false));
    el.addEventListener('pointerdown', e => { const b = e.target.closest('.tip-foot'); if (b) { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (x) {} dir = +b.dataset.d; } });
    ['pointerup', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => dir = 0));
    ctx.onKey = k => { if (k === 'ArrowLeft' || k === 'a') dir = -1; if (k === 'ArrowRight' || k === 'd') dir = 1; };
    ctx.onKeyUp = k => { if (/^(ArrowLeft|ArrowRight|a|d)$/.test(k)) dir = 0; };
    return {
      update(dt) {
        if (dir) { f = clamp(f + dir * 22 * dt, 0, 100); lastTune = now(); }
        if (ctx.night >= 3) { drift -= dt; if (drift <= 0) { tf = clamp(tf + mr(-9, 9), 5, 95); drift = mr(4, 7); } }
        if (ctx.mut) { jump -= dt; if (jump <= 0) { jump = mr(6, 9); tf = clamp(tf + (tf > 50 ? -1 : 1) * mr(30, 45), 5, 95); Sfx.noise(0.5, 'bandpass', 2000, 0.15, 0.5); toast('The frequency jumped!', '', 'bad'); } }
        const dist = Math.abs(f - tf), sig = clamp(1 - dist / 30, 0, 1), locked = dist <= tol;
        if (now() - lastTune < 0.15 && Math.random() < 0.5) Sfx.noise(0.06, 'bandpass', 1500 + sig * 2000, 0.05 * (1 - sig) + 0.01, 0.8);
        if (Input.hold && locked) { ctx.add(rate * ctx.speed() * dt); bt -= dt; if (bt <= 0) { Sfx.tone(880, 0.06, 'square', 0.04); bt = Math.random() < 0.5 ? 0.12 : 0.32; } }
        $('#rd-ndl', el).style.left = f + '%'; const sg = $('#rd-sig', el); sg.style.width = (sig * 100) + '%'; sg.classList.toggle('lock', locked);
        $('#rd-c', el).textContent = locked ? (Input.hold ? 'Transmitting\u2026 MAYDAY\u2026 MAYDAY\u2026' : 'Signal locked. Hold transmit!') : Input.hold ? 'Only static\u2026 tune first.' : sig > 0.6 ? 'Close\u2026 a voice in the static.' : 'Static. Keep tuning.';
      },
      isActive: () => Input.hold || now() - lastTune < 0.2
    };
  }
};
const MUTATIONS = {
  lockpick: ['Rusty Pins', 'Pins randomly slip back while you work.'], dial: ['Crossed Line', 'Halfway through, the rest of the number changes.'], scrub: ['It Spreads', 'The stain slowly grows back.'],
  stitch: ['Shaking Hands', 'The safe zone drifts while you work.'], keys: ['Light Sleeper', 'Noise builds 40% faster.'], closet: ['Stuffy Air', 'Your breath recovers much slower.'],
  tiptoe: ['Rotten Boards', 'Some boards creak unless you pause before stepping.'], safe: ['Extra Tumbler', 'A surprise fourth number appears mid-crack.'], radio: ['Frequency Jumps', 'The signal suddenly jumps far away.']
};
const MUTATE_AT = 4;
const PAD_HINTS = { lockpick: 'Hold A (or RT) to pick', dial: 'D-pad to choose a digit, A to dial', scrub: 'Flick the left stick left and right', stitch: 'Tap A to stitch', keys: 'Hold A to reach', closet: 'Hold A to hold your breath', tiptoe: 'D-pad \u25c0 \u25b6 to step', safe: 'Hold D-pad \u25c0 \u25b6 to spin, tap to nudge', radio: 'D-pad \u25c0 \u25b6 to tune, hold A to transmit', bestie: 'D-pad to move around your phone, A to tap (hold A on calls), B for home' };
const CLASSIC_ROOMS = ['lockpick', 'dial', 'scrub', 'stitch', 'keys', 'closet', 'tiptoe', 'safe', 'radio'];
