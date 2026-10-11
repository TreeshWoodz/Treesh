'use strict';
/* BIG EYELASH: The Function. Crash her 3 AM trap-house party, keep her from getting PRESSED. Finale: Lashpocalypse. */
const BE_ROASTS = [
  ['Who invited you? Not me. Not ANYBODY. #$%@!', 'Your speaker did. It\u2019s been screaming my name all night.', 'Um\u2026 sorry?', 'Your lashes did. They waved me in.'],
  ['You look like the \u201cbefore\u201d picture, boo.', 'And you look like the receipt for it.', 'That\u2019s mean.', 'At least my lashes don\u2019t need a permit.'],
  ['This my house, my music, my #$%@ rules!', 'Then why is your Wi-Fi named \u201cNeighbor_Guest\u201d?', 'Okay, okay.', 'Your lashes pay rent here too?'],
  ['You dance like a folding chair.', 'Still got more rhythm than your playlist.', 'I\u2019m trying my best.', 'Your lashes clap more than you do.'],
  ['Broke AND uninvited? Pick ONE, #$%@!', 'Picked both. I\u2019m a multitasker.', 'Can I pick neither?', 'Your lashes cost more than this house.'],
  ['I\u2019ll curse your whole bloodline, sweetie.', 'Cool. They owe me money anyway.', 'Please don\u2019t.', 'With those lashes? You\u2019ll blink and miss.'],
  ['My nails cost more than your car.', 'My car\u2019s a bus pass. You won nothing.', 'Nice nails.', 'And your lashes cost more than your nails.'],
  ['Say one more word. ONE. #$%@.', 'Word.', '\u2026ok.', 'Lashes.']
];
const BE_ROUNDS = {
  twerk: { name: 'Twerk-Off', v: 'be_k1', pose: 'twerk', tip: 'Hit the arrows ON the beat. Three misses and she\u2019s pressed.' },
  clap: { name: 'Clapback Battle', v: 'be_k2', pose: 'idle', tip: 'Pick the best clapback. Whatever you do\u2026 NOT the lashes.' },
  hex: { name: 'Hex Nails', v: 'be_k3', pose: 'hex', tip: 'Trace her sigil back before the hex lands.' },
  money: { name: 'Make It Rain', v: 'be_k4', pose: 'money', tip: 'Tap bills that add up to her EXACT cut. Never touch a cursed bill.' },
  strap: { name: 'Who Took My Strap?', v: 'be_k5', pose: 'gun', tip: 'Hold to sneak her strap away ONLY while her eyes are closed.' }
};
const BE_ARW = [['arrow-left', 'ArrowLeft'], ['arrow-down', 'ArrowDown'], ['arrow-up', 'ArrowUp'], ['arrow-right', 'ArrowRight']];
const beBleep = s => { if (/#\$%@/.test(s)) Sfx.tone(1000, 0.28, 'sine', 0.1); return esc(s).replace(/#\$%@/g, '<i class="bleep">#$%@</i>'); };

function lashMini() {
  return {
    id: 'lash', name: 'The Function', room: 'be_idle', icon: 'sparkles', noBtn: true, noKiller: true, view: 'lash', endReason: 'lash',
    labels: { look: 'Big Eyelash is watching' }, limit: () => 900,
    hint: 'You crashed Big Eyelash\u2019s 3 AM function. Survive her rounds without getting her PRESSED. If the meter fills, she snatches your soul. Then survive PRESSED MODE.',
    mount(el, ctx) {
      const N = ctx.night, T = { pr: 6, max: 0, phase: 'party', need: 3 + Math.min(3, N - 1), done: 0, fq: [], fdone: 0, bag: [], last: '', k: null, busy: true, tick: null, key: null, bpm: 132 + N * 4 };
      const clock = () => (Sfx.ac ? Sfx.ac.currentTime : performance.now() / 1000);
      el.innerHTML = `<div class="mg mg-lash"><div class="be" id="be" data-phase="party" data-pose="idle" data-testid="lash-stage">
        <div class="be-scene">${['idle', 'blink', 'twerk', 'hex', 'money', 'gun', 'rage', 'rage2'].map(k => `<i class="be-img be-${k}" style="background-image:url(${img('be_' + k)})"></i>`).join('')}<i class="be-led"></i><i class="be-cash"></i><i class="be-vig"></i></div>
        <div class="os-bar be-bar"><span class="be-act" id="be-act" data-testid="lash-act">The Function</span><span class="be-pr"><small>Pressed</small><span class="meter" id="be-pm"><i id="be-pr" data-testid="lash-pressed-meter"></i></span></span><span class="be-count" id="be-count" data-testid="lash-count">0/${T.need}</span><button class="os-pause" data-act="pause" data-testid="lash-pause-btn" aria-label="Pause"><i data-lucide="pause"></i></button></div>
        <em class="be-say" id="be-say" data-testid="lash-say"></em><section class="be-round" id="be-round" data-testid="lash-round"></section></div></div>`;
      const be = $('#be', el), box = $('#be-round', el), alive = () => R && !R.done && R.mini && R.mini.id === 'lash';
      const later = (ms, f) => setTimeout(() => { if (alive()) f(); }, ms);
      const pose = k => { be.dataset.pose = k; };
      const say = (t, v) => { const s = $('#be-say', el); s.innerHTML = beBleep(t); s.classList.remove('on'); void s.offsetWidth; s.classList.add('on'); if (v) Sfx.speak(v, 'lash'); };
      const head = (k, tip) => `<div class="tt-h be-h"><b data-testid="lash-round-name">${BE_ROUNDS[k] ? BE_ROUNDS[k].name : k}</b><small data-testid="lash-round-tip">${tip || BE_ROUNDS[k].tip}</small></div>`;
      const bump = c => { const m = $('#be-pm', el); m.classList.remove('bump', 'bump-bad'); void m.offsetWidth; m.classList.add(c); };
      const count = () => { $('#be-count', el).textContent = T.phase === 'party' ? `${T.done}/${T.need}` : `${T.fdone}/6`; ctx.set((T.done + T.fdone) / (T.need + 6) * 100 - 0.001); };
      /* trap beat */
      let step = 0, nextT = 0;
      const drum = (t, kind) => { const ac = Sfx.ac, m = Sfx.master, g = ac.createGain(); g.connect(m);
        if (kind === 'kick') { const o = ac.createOscillator(); o.frequency.setValueAtTime(T.phase === 'demon' ? 120 : 150, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.45); Sfx.env(g, t, 0.003, 0.5, 0.5); o.connect(g); o.start(t); o.stop(t + 0.6); }
        else { const s = ac.createBufferSource(), f = ac.createBiquadFilter(); s.buffer = Sfx.noiseBuf(); f.type = kind === 'hat' ? 'highpass' : 'bandpass'; f.frequency.value = kind === 'hat' ? 7000 : 1500; s.connect(f); f.connect(g); Sfx.env(g, t, 0.002, kind === 'hat' ? 0.05 : 0.3, kind === 'hat' ? 0.04 : 0.18); s.start(t); s.stop(t + 0.3); } };
      const beat = setInterval(() => {
        if (!be.isConnected) return clearInterval(beat); const ac = Sfx.ac; if (!ac || !alive() || Run.paused || T.mute) { nextT = 0; return; }
        const sp = 60 / (T.bpm * (1 + T.pr / 500)) / 4; if (!nextT || nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
        while (nextT < ac.currentTime + 0.12) { const s = step % 16, roll = step % 64 >= 56; if ([0, 7, 10].includes(s)) { drum(nextT, 'kick'); setTimeout(() => { be.classList.remove('kick'); void be.offsetWidth; be.classList.add('kick'); }, Math.max(0, (nextT - ac.currentTime) * 1000)); } if (s === 4 || s === 12) drum(nextT, 'clap'); if (s % 2 === 0 || roll) drum(nextT, 'hat'); if (roll && T.phase === 'demon') drum(nextT + sp / 2, 'hat'); nextT += sp; step++; }
      }, 25);
      const resolve = (ok, why) => {
        if (!T.k) return; T.k = null; T.tick = null; T.key = null; box.classList.remove('live');
        if (ok) { T.pr = Math.max(0, T.pr - (T.phase === 'party' ? 22 : 15)); Sfx.chime([784, 1175]); say(pick(['Okay\u2026 you ate, #$%@.', 'Hmph. Lucky #$%@.', 'Don\u2019t get comfortable.', 'Period. PERIOD.'])); if (T.phase === 'party') T.done++; else T.fdone++; box.insertAdjacentHTML('beforeend', '<div class="tt-res ok" data-testid="lash-round-ok"><i data-lucide="sparkles"></i>She\u2019s\u2026 impressed</div>'); }
        else { T.pr = Math.min(100, T.pr + 18); Sfx.tone(120, 0.5, 'sawtooth', 0.16, 60); shake(2); haptic(200, 0.7); if (T.phase === 'demon') { T.fdone++; pose('rage2'); } else if (T.pr > 55) say('Now I\u2019m PRESSED!', 'be_p'); else say(pick(['#$%@!', 'Excuse ME?! #$%@!', 'Oh you think you CUTE, #$%@?', 'Boy BYE. #$%@.'])); box.insertAdjacentHTML('beforeend', `<div class="tt-res bad" data-testid="lash-round-fail"><i data-lucide="flame"></i>${beBleep(why || 'Pressed')}</div>`); }
        icons(); count(); bump(ok ? 'bump' : 'bump-bad');
        if (T.phase === 'demon' && T.fdone >= 6) return;
        later(1200, () => { if (T.phase === 'demon') pose('rage'); T.phase === 'party' && T.done >= T.need ? finale() : next(); });
      };
      const B = {
        twerk() {
          const n = Math.min(16, 8 + N * 2), bt = 60 / T.bpm, travel = bt * 2.4, t0 = clock() + travel + 0.4, notes = []; let tt = t0, misses = 0;
          for (let i = 0; i < n; i++) { notes.push({ lane: Math.floor(Math.random() * 4), t: tt, hit: false }); tt += N >= 3 && Math.random() < 0.35 ? bt / 2 : bt; }
          box.innerHTML = head('twerk') + `<div class="be-hw" data-testid="lash-highway"><i class="hitline"></i>${notes.map((o, i) => `<i class="nt l${o.lane}" data-n="${i}" style="--x:${o.lane};animation-duration:${travel.toFixed(3)}s;animation-delay:${(o.t - travel - clock()).toFixed(3)}s"><i data-lucide="${BE_ARW[o.lane][0]}"></i></i>`).join('')}</div><div class="be-lanes">${BE_ARW.map((a, i) => `<button class="be-lane l${i}" data-l="${i}" data-testid="lash-lane-${i}"><i data-lucide="${a[0]}"></i></button>`).join('')}</div><small class="tt-sm" id="be-sm">Misses 0/3</small>`; icons(); box.classList.add('live');
          const judge = l => { const now = clock(), o = notes.filter(x => !x.hit && x.lane === l).sort((a, b) => Math.abs(a.t - now) - Math.abs(b.t - now))[0], btn = $(`.be-lane[data-l="${l}"]`, box);
            if (btn) { btn.classList.remove('hit'); void btn.offsetWidth; btn.classList.add('hit'); }
            if (o && Math.abs(o.t - now) < 0.2) { o.hit = true; const e = $(`.nt[data-n="${notes.indexOf(o)}"]`, box); if (e) e.classList.add('got'); Sfx.tone(Math.abs(o.t - now) < 0.08 ? 1320 : 990, 0.06, 'square', 0.05); } else miss(); };
          const miss = () => { misses++; const s = $('#be-sm', box); if (s) s.textContent = `Misses ${misses}/3`; be.classList.remove('wobble'); void be.offsetWidth; be.classList.add('wobble'); Sfx.tone(180, 0.15, 'square', 0.06); if (misses >= 3) resolve(false, 'You fell off the beat.'); };
          T.tick = () => { const now = clock(); notes.forEach((o, i) => { if (!o.hit && now > o.t + 0.22) { o.hit = true; const e = $(`.nt[data-n="${i}"]`, box); if (e) e.classList.add('miss'); if (T.k) miss(); } }); if (T.k && notes.every(o => o.hit) && misses < 3) resolve(true); };
          T.key = e => { const l = BE_ARW.findIndex(a => a[1] === e.key); if (l >= 0) { e.preventDefault(); judge(l); } };
          box.onpointerdown = e => { const b = e.target.closest('.be-lane'); if (b) judge(+b.dataset.l); };
        },
        clap() {
          const r = pick(BE_ROASTS), opts = shuffle([[r[1], 'g'], [r[2], 'w'], [r[3], 'l']]); let left = Math.max(4, 7 - N * 0.4); const tot = left;
          box.innerHTML = head('clap') + `<p class="be-roast" data-testid="lash-roast">\u201c${beBleep(r[0])}\u201d</p><div class="meter"><i id="be-tm"></i></div><div class="be-opts">${opts.map((o, i) => `<button data-o="${o[1]}" data-testid="lash-clap-${i}">${esc(o[0])}</button>`).join('')}</div>`; box.classList.add('live');
          T.tick = dt => { left -= dt; const m = $('#be-tm', box); if (m) m.style.width = Math.max(0, left / tot * 100) + '%'; if (left <= 0) resolve(false, 'Cat got your tongue? #$%@.'); };
          box.onpointerdown = e => { const b = e.target.closest('[data-o]'); if (!b || !box.classList.contains('live')) return; const o = b.dataset.o; if (o === 'l') { T.pr = Math.min(100, T.pr + 12); be.classList.add('notlash'); later(900, () => be.classList.remove('notlash')); } resolve(o === 'g', o === 'l' ? 'NOT. THE. LASHES.' : 'Weak. She\u2019s pressed.'); };
        },
        hex() {
          const L = N >= 3 ? 5 : 4, mir = N >= 4, path = [thR9()]; while (path.length < L) { const c = path[path.length - 1], nb = [...Array(9).keys()].filter(j => !path.includes(j) && Math.abs(j % 3 - c % 3) <= 1 && Math.abs(Math.floor(j / 3) - Math.floor(c / 3)) <= 1); if (!nb.length) break; path.push(pick(nb)); }
          const want = mir ? path.map(j => Math.floor(j / 3) * 3 + (2 - j % 3)) : path, pt = j => `${(j % 3) * 50 + 25},${Math.floor(j / 3) * 50 + 25}`; let pos = 0, left = Math.max(4.5, 7.5 - N * 0.4), live = false; const tot = left;
          box.innerHTML = head('hex', mir ? 'Trace the MIRROR image of her sigil.' : null) + `<div class="be-sig"><svg viewBox="0 0 150 150"><polyline class="her" points="${path.map(pt).join(' ')}"/><polyline class="you" id="be-you" points=""/></svg>${[...Array(9).keys()].map(j => `<button class="dot" data-d="${j}" style="left:${(j % 3) * 33.33 + 16.66}%;top:${Math.floor(j / 3) * 33.33 + 16.66}%" data-testid="lash-dot-${j}"></button>`).join('')}</div><div class="meter"><i id="be-tm"></i></div>`; T.watch = true;
          later(1700 + L * 120, () => { const s = $('.be-sig', box); if (s) s.classList.add('fade'); live = true; T.watch = false; box.classList.add('live'); });
          T.tick = dt => { if (!live) return; left -= dt; const m = $('#be-tm', box); if (m) m.style.width = Math.max(0, left / tot * 100) + '%'; if (left <= 0) resolve(false, 'The hex landed.'); };
          box.onpointerdown = e => { const d = e.target.closest('.dot'); if (!d || !live) return; const j = +d.dataset.d; if (j !== want[pos]) { live = false; return resolve(false, 'Wrong rune. You smell like burnt acrylic.'); } pos++; d.classList.add('on'); $('#be-you', box).setAttribute('points', want.slice(0, pos).map(pt).join(' ')); Sfx.tone(600 + pos * 110, 0.08, 'triangle', 0.08); if (pos >= want.length) { live = false; later(300, () => resolve(true)); } };
        },
        money() {
          const vals = [1, 5, 10, 20, 50, 100], pickd = Array.from({ length: 3 + (N >= 3 ? 1 : 0) }, () => pick(vals.slice(0, 5))), target = pickd.reduce((a, b) => a + b, 0); let sum = 0, left = Math.max(8, 13 - N * 0.6), st = 0.2; const tot = left;
          box.innerHTML = head('money', `She wants EXACTLY $${target}. Tap bills to add them up.`) + `<div class="be-rain" id="be-rain" data-testid="lash-rain"></div><div class="be-sum"><b id="be-sum" data-testid="lash-sum">$0</b> / $${target}</div><div class="meter"><i id="be-tm"></i></div>`; box.classList.add('live');
          T.tick = dt => { left -= dt; st -= dt; const m = $('#be-tm', box); if (m) m.style.width = Math.max(0, left / tot * 100) + '%';
            if (st <= 0) { st = Math.max(0.28, 0.5 - N * 0.03); const rn = $('#be-rain', box); if (rn) { const cursed = Math.random() < 0.22, v = Math.random() < 0.6 ? pick(pickd) : pick(vals), b = document.createElement('button'); b.className = 'bill' + (cursed ? ' cursed' : ''); b.dataset.v = v; if (cursed) b.dataset.c = '1'; b.dataset.testid = cursed ? 'lash-bill-cursed' : 'lash-bill-' + v; b.innerHTML = cursed ? '<i data-lucide="skull"></i>HEX' : '$' + v; b.style.left = 4 + Math.random() * 80 + '%'; b.style.setProperty('--r', (Math.random() * 40 - 20).toFixed(0) + 'deg'); rn.appendChild(b); if (cursed) icons(); setTimeout(() => b.remove(), 3200); } }
            if (left <= 0) resolve(false, 'Too slow. She wanted it NOW.'); };
          box.onpointerdown = e => { const b = e.target.closest('.bill'); if (!b || !box.classList.contains('live')) return; if (b.dataset.c) return resolve(false, 'Cursed bill. Your hand is glitter now.'); sum += +b.dataset.v; b.remove(); Sfx.noise(0.08, 'bandpass', 3000, 0.1); $('#be-sum', box).textContent = '$' + sum; if (sum === target) resolve(true); else if (sum > target) resolve(false, `$${sum}?! You overpaid. She\u2019s OFFENDED.`); };
        },
        strap() {
          let prog = 0, eye = 'closed', et = 1.6, hold = false;
          box.innerHTML = head('strap') + `<div class="be-eye" id="be-eye" data-eye="closed" data-testid="lash-eye"><i data-lucide="eye-off"></i><b>Eyes closed: lash refill</b></div><div class="meter big"><i id="be-sp" data-testid="lash-sneak-meter"></i></div><button class="be-hold" data-testid="lash-sneak-btn"><i data-lucide="hand"></i>Hold to sneak the strap</button>`; icons(); box.classList.add('live'); pose('blink');
          const setEye = (s, d) => { eye = s; et = d; const e = $('#be-eye', box); if (!e) return; e.dataset.eye = s; e.innerHTML = s === 'open' ? '<i data-lucide="eye"></i><b>She\u2019s LOOKING</b>' : s === 'flutter' ? '<i data-lucide="eye"></i><b>Lashes fluttering\u2026</b>' : '<i data-lucide="eye-off"></i><b>Eyes closed: lash refill</b>'; icons(); pose(s === 'open' ? 'idle' : 'blink'); if (s === 'flutter') Sfx.noise(0.3, 'bandpass', 4000, 0.06, 3); if (s === 'open') Sfx.tone(300, 0.2, 'triangle', 0.08); };
          T.tick = dt => { et -= dt; if (et <= 0) { if (eye === 'closed') setEye('flutter', Math.max(0.3, 0.5 - N * 0.03)); else if (eye === 'flutter') setEye('open', 1.1 + Math.random() * 1.3); else setEye('closed', Math.max(1.1, 2.4 - N * 0.15) + Math.random() * 0.8); }
            if (hold) { if (eye === 'open') { hold = false; return resolve(false, 'She SAW you. #$%@!'); } prog += dt / 2.6; const m = $('#be-sp', box); if (m) m.style.width = Math.min(100, prog * 100) + '%'; if (prog >= 1) { hold = false; resolve(true); } } };
          box.onpointerdown = e => { if (e.target.closest('.be-hold')) { hold = true; e.target.closest('.be-hold').classList.add('down'); } };
          box.onpointerup = box.onpointercancel = () => { hold = false; const b = $('.be-hold', box); if (b) b.classList.remove('down'); };
          T.key = e => { if (e.key === ' ') { e.preventDefault(); hold = e.type === 'keydown'; } };
        },
        whip() {
          const safe = thR(3); let left = Math.max(0.85, 1.4 - N * 0.06), live = false;
          box.innerHTML = `<div class="tt-h be-h"><b data-testid="lash-round-name">LASH WHIP</b><small data-testid="lash-round-tip">Her lashes are coming. Tap the SAFE lane. (\u2190 \u2193 \u2192)</small></div><div class="be-whip">${[0, 1, 2].map(i => `<button class="wl ${i === safe ? 'safe' : 'danger'}" data-w="${i}" data-testid="lash-whip-${i}"></button>`).join('')}</div>`;
          later(450, () => { live = true; box.classList.add('live'); Sfx.noise(0.5, 'bandpass', 600, 0.15, 1); });
          const hit = i => { if (!live) return; live = false; pose('rage2'); be.classList.remove('lunge'); void be.offsetWidth; be.classList.add('lunge'); resolve(i === safe, i < 0 ? 'Too slow. Lash-whipped.' : 'Lash-whipped. Ouch.'); };
          T.tick = dt => { if (!live) return; left -= dt; if (left <= 0) hit(-1); };
          T.key = e => { const m = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 1, ArrowRight: 2 }[e.key]; if (m !== undefined) { e.preventDefault(); hit(m); } };
          box.onpointerdown = e => { const b = e.target.closest('.wl'); if (b) hit(+b.dataset.w); };
        }
      };
      const thR9 = () => Math.floor(Math.random() * 9), thR = n => Math.floor(Math.random() * n);
      const run = k => { T.k = k; T.tick = null; T.key = null; box.onpointerdown = box.onpointerup = box.onpointercancel = null; box.classList.remove('live', 'in'); void box.offsetWidth; box.classList.add('in'); if (BE_ROUNDS[k] && T.phase === 'party') { pose(BE_ROUNDS[k].pose); say(BE_ROUNDS[k].name + '!', BE_ROUNDS[k].v); } B[k](); };
      const next = () => { if (T.phase === 'demon') { if (T.fdone < 6) run(T.fq[T.fdone]); return; } if (!T.bag.length) T.bag = shuffle(Object.keys(BE_ROUNDS)); if (T.bag[T.bag.length - 1] === T.last) T.bag.unshift(T.bag.pop()); T.last = T.bag.pop(); run(T.last); };
      const finale = () => {
        T.busy = true; T.mute = true; box.innerHTML = ''; Sfx.noise(0.6, 'bandpass', 1200, 0.3, 6); Sfx.tone(800, 0.5, 'sawtooth', 0.1, 80); be.classList.add('xform'); pose('idle'); say('Girls! Get they #$%@! PRESSED MODE!', 'be_f');
        [700, 1300, 1800, 2200, 2500].forEach((ms, i) => later(ms, () => { pose(i % 2 ? 'rage' : 'idle'); shake(i > 2 ? 3 : 1); }));
        later(2900, () => { be.classList.remove('xform'); be.dataset.phase = 'demon'; T.phase = 'demon'; pose('rage'); $('#be-act', el).textContent = 'PRESSED MODE'; const tr = shuffle(['twerk', 'clap', 'hex', 'money', 'strap']).slice(0, 3); T.fq = tr.flatMap(k => ['whip', k]); T.bpm += 20; T.mute = false; T.busy = false; count(); next(); });
      };
      const key = e => { if (T.key && !T.busy) T.key(e); };
      document.addEventListener('keydown', key); document.addEventListener('keyup', key);
      ['be_blink', 'be_twerk', 'be_hex', 'be_money', 'be_gun', 'be_rage', 'be_rage2', 'be_scare'].forEach(n => { new Image().src = img(n); });
      if (N === 1) later(500, () => say('Oh HELL nah. #$%@! Who let you up in MY function?!', 'be_l0'));
      later(N === 1 ? 4200 : 1600, () => { T.busy = false; next(); });
      count();
      return {
        update(dt) {
          if (!T.busy && T.k && T.tick) T.tick(dt);
          if (!T.busy && T.k) T.pr = Math.min(100, T.pr + dt * (T.phase === 'demon' ? 2.4 + N * 0.3 : 1.1 + N * 0.2) * (T.watch ? 0.4 : 1));
          T.max = Math.max(T.max, T.pr); $('#be-pr', el).style.width = T.pr + '%'; be.style.setProperty('--pr', (T.pr / 100).toFixed(3)); be.classList.toggle('hot', T.pr > 70);
          if (T.pr >= 100) { T.pr = 100; caught('lash'); if (R && !R.done) T.pr = 60; return; }
          if (T.phase === 'demon' && T.fdone >= 6 && !T.won) { T.won = true; unlock('lash1'); if (T.max < 50) unlock('lash_clean'); ctx.set(100); }
        },
        destroy() { clearInterval(beat); document.removeEventListener('keydown', key); document.removeEventListener('keyup', key); },
        isActive: () => false
      };
    }
  };
}
