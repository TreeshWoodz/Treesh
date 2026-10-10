'use strict';
/* THANE: The Grand Illusion. See through his tricks before his dark-energy Reach takes you. Finale: his true form. */
const TH_COL = [['PURPLE', '#b06cff'], ['GREEN', '#3fbf62'], ['RED', '#ff4d5a'], ['GOLD', '#f2b705'], ['BLUE', '#4dabf7']];
const TH_SUIT = [['\u2660', 'k'], ['\u2663', 'k'], ['\u2665', 'r'], ['\u2666', 'r']];
const TH_RANK = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const TH_SAY = {
  good: ['Clever.', 'Hm. Lucky.', 'The audience is impressed.', 'You saw through that one.'],
  bad: ['Wrong.', 'Ahh\u2026 so close.', 'My hand is on your shoulder now.', 'Look closer. Or don\u2019t.'],
  mon: ['THERE IS NO SECRET', 'YOU ARE THE TRICK', 'APPLAUD', 'STAY FOR THE ENCORE']
};
const TH_TRICKS = {
  cups: { name: 'The Shell Game', v: 'thane_k2', tip: 'Follow the cup with your soul under it.' },
  cards: { name: 'Pick a Card', v: 'thane_k1', tip: 'Remember his card. Only one in the fan is real.' },
  mirrors: { name: 'Hall of Mirrors', v: 'thane_k3', tip: 'The reflections flicker together. The real Thane doesn\u2019t.' },
  chains: { name: 'The Chains', v: 'thane_k4', tip: 'Watch the locks glow. Unlock them in the same order.' },
  spiral: { name: 'Hypnosis', v: 'thane_k5', tip: 'Read carefully. Your eyes will lie to you.' },
  vanish: { name: 'The Vanishing Act', v: 'thane_k6', tip: 'Lights out. His smoke drifts from where he\u2019ll appear. Dodge the OTHER way.' },
  saw: { name: 'Sawed in Half', v: 'thane_k7', tip: 'Tap the 3 TRUE seams before the saw reaches you. Fakes flicker.', enc: 2, pose: 'saw' },
  tank: { name: 'The Water Tank', v: 'thane_k8', tip: 'Dial his combination. Pop air bubbles before you drown.', enc: 3, pose: 'tank' },
  doors: { name: 'Disappearing Doors', v: 'thane_k9', tip: 'Remember his rule. Follow the right door.', enc: 4, pose: 'doors' },
  puppet: { name: 'The Marionette', v: 'thane_k10', tip: 'Tap the symbols in order. When the strings cross, left is right.', enc: 5 },
  dove: { name: 'Dove or Dagger', v: 'thane_k11', tip: 'Catch 6 doves. Never touch a dagger.', enc: 6 }
};
const TH_ENC = ['saw', 'tank', 'doors', 'puppet', 'dove'];
const TH_SYM = [['\u25c6', '#f0abfc'], ['\u25cf', '#4dabf7'], ['\u25b2', '#f2b705'], ['\u25a0', '#3fbf62']];
const thR = n => Math.floor(Math.random() * n);

function thaneMini() {
  return {
    id: 'thane', name: 'The Grand Illusion', room: 'thane_stage', icon: 'wand-sparkles', noBtn: true, noKiller: true, view: 'thane', endReason: 'thane',
    labels: { look: 'Thane is performing' },
    hint: 'Thane\u2019s dark energy creeps toward you (the purple Reach meter). See through each trick to push it back. Fail and it surges. When the illusions end, the real Thane comes out. Survive his Last Trick.',
    limit: () => 900,
    mount(el, ctx) {
      const N = ctx.night, nasty = N >= 5, T = { fsteps: N >= 5 ? 8 : 6, first: N >= 2 ? (N <= 6 ? TH_ENC[N - 2] : pick(TH_ENC)) : null, tick: null, reach: 6, max: 0, phase: 'human', need: 3 + Math.min(3, N - 1), done: 0, fq: [], fdone: 0, bag: [], last: '', trick: null, busy: true, watch: false, flashT: 3 };
      const total = () => T.need + T.fsteps;
      el.innerHTML = `<div class="mg mg-thane"><div class="th" id="th" data-phase="human" data-pose="idle" data-testid="thane-stage">
        <div class="th-scene"><i class="th-img" data-k="stage" style="background-image:url(${img('thane_stage')})"></i>${['idle', 'idle1', 'cast', 'cast1', 'smoke', 'saw', 'tank', 'doors', 'm1', 'm1b', 'm2'].map(k => `<i class="th-img th-${k}" data-k="${k}" style="background-image:url(${img('thane_' + k)})"></i>`).join('')}<i class="th-orbit"><b></b><b></b><b></b></i><i class="th-energy"></i><i class="th-eyes"></i><div class="th-flicks" id="th-flicks"></div><i class="th-fog"></i><i class="th-vig"></i><i class="th-grip"></i></div>
        <div class="os-bar th-bar"><span class="th-act" id="th-act" data-testid="thane-act">Act I &middot; Illusions</span><span class="th-reach"><small>Reach</small><span class="meter" id="th-rm"><i id="th-reach" data-testid="thane-reach-meter"></i></span></span><span class="th-count" id="th-count" data-testid="thane-count">0/${T.need}</span><button class="os-pause" data-act="pause" data-testid="thane-pause-btn" aria-label="Pause"><i data-lucide="pause"></i></button></div>
        <em class="th-say" id="th-say" data-testid="thane-say"></em>
        <section class="th-trick" id="th-trick" data-testid="thane-trick"></section>
        <div class="th-curtain" id="th-curtain"><i></i><i></i></div><i class="th-flash" id="th-flash"></i></div></div>`;
      const th = $('#th', el), box = $('#th-trick', el), sayEl = $('#th-say', el);
      const pose = k => { th.dataset.pose = k; };
      const say = (t, v) => { sayEl.textContent = t; sayEl.classList.remove('on'); void sayEl.offsetWidth; sayEl.classList.add('on'); if (v) Sfx.speak(v, 'thane'); };
      const zap = (big) => { const f = $('#th-flash', el); f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); Sfx.noise(big ? 0.5 : 0.2, 'highpass', 1800, big ? 0.22 : 0.1); if (big) { Sfx.tone(60, 0.9, 'sawtooth', 0.15, 30); shake(2); } };
      const head = (k, extra = '') => `<div class="tt-h"><b data-testid="thane-trick-name">${TH_TRICKS[k].name}</b><small data-testid="thane-trick-tip">${extra || TH_TRICKS[k].tip}</small></div>`;
      const later = (ms, f) => setTimeout(() => { if (R && !R.done && R.mini && R.mini.id === 'thane') f(); }, ms);
      const count = () => { $('#th-count', el).textContent = T.phase === 'human' ? `${T.done}/${T.need}` : `${T.fdone}/${T.fsteps}`; ctx.set((T.done + T.fdone) / total() * 100 - 0.001); };

      const resolve = (ok, why) => {
        if (!T.trick) return; const k = T.trick; T.trick = null; T.tick = null; T.watch = false; box.classList.remove('live');
        if (ok) { T.reach = Math.max(0, T.reach - (T.phase === 'human' ? 22 : 15)); Sfx.chime([660, 990]); say(T.phase === 'human' ? pick(TH_SAY.good) : pick(TH_SAY.mon)); box.insertAdjacentHTML('beforeend', '<div class="tt-res ok" data-testid="thane-trick-ok"><i data-lucide="sparkles"></i>Seen through</div>'); if (T.phase === 'human') { T.done++; pose('idle'); } else T.fdone++; }
        else { T.reach = Math.min(100, T.reach + 18); Sfx.tone(140, 0.5, 'sawtooth', 0.16, 70); haptic(200, 0.7); zap(true); pose(T.phase === 'human' ? 'cast' : 'm2'); say(T.phase === 'human' ? pick(TH_SAY.bad) : pick(TH_SAY.mon)); box.insertAdjacentHTML('beforeend', `<div class="tt-res bad" data-testid="thane-trick-fail"><i data-lucide="skull"></i>${esc(why || 'Fooled')}</div>`); if (T.phase === 'monster') T.fdone++; }
        icons(); count(); bump(ok ? 'bump' : 'bump-bad');
        if (T.phase === 'monster' && T.fdone >= T.fsteps) return;
        later(1200, () => { if (T.phase === 'monster') pose('m1'); T.phase === 'human' && T.done >= T.need ? finale() : next(); });
      };
      const bump = c => { const m = $('#th-rm', el); m.classList.remove('bump', 'bump-bad'); void m.offsetWidth; m.classList.add(c); };

      /* ---- tricks ---- */
      const B = {
        cups() {
          const n = T.phase === 'monster' || N >= 4 ? 4 : 3, ids = [...Array(n).keys()], soul = thR(n), steps = (T.phase === 'monster' ? 8 : 4 + N) | 0, d = Math.max(0.2, (T.phase === 'monster' ? 0.32 : 0.55) - N * 0.035);
          let slot = ids.slice(), live = false;
          box.innerHTML = head('cups') + `<div class="tt-cups" style="--n:${n};--d:${d}s">${ids.map(i => `<button class="tt-cup up" data-c="${i}" style="--s:${i}" data-testid="thane-cup-${i}" disabled><i class="cup"></i>${i === soul ? '<i class="orb"></i>' : ''}</button>`).join('')}</div>`;
          const cup = i => $(`[data-c="${i}"]`, box), place = () => slot.forEach((c, s) => cup(c).style.setProperty('--s', s));
          T.watch = true;
          later(1300, () => { $$('.tt-cup', box).forEach(c => c.classList.remove('up')); Sfx.thump(0.3); let k = 0;
            const swap = () => {
              if (k++ >= steps) { live = true; T.watch = false; $$('.tt-cup', box).forEach(c => { c.disabled = false; }); box.classList.add('live'); return; }
              const a = thR(n); let b = thR(n - 1); if (b >= a) b++;
              if (nasty && Math.random() < 0.3) { const g = document.createElement('button'); g.className = 'tt-cup ghost'; g.disabled = true; g.style.setProperty('--s', thR(n)); g.innerHTML = '<i class="cup"></i>'; $('.tt-cups', box).appendChild(g); later(d * 2200, () => g.remove()); }
              const tele = N >= 2 && Math.random() < 0.28;
              if (tele) { [cup(slot[a]), cup(slot[b])].forEach(c => c.classList.add('tele')); Sfx.noise(0.2, 'bandpass', 900, 0.1); later(d * 500, () => { [slot[a], slot[b]] = [slot[b], slot[a]]; place(); }); later(d * 1000, () => $$('.tt-cup.tele', box).forEach(c => c.classList.remove('tele'))); }
              else { cup(slot[a]).classList.add('arc'); [slot[a], slot[b]] = [slot[b], slot[a]]; place(); Sfx.noise(0.06, 'lowpass', 700, 0.12); later(d * 1000, () => $$('.tt-cup.arc', box).forEach(c => c.classList.remove('arc'))); }
              later(d * 1000 + 40, swap);
            };
            swap();
          });
          box.onpointerdown = e => { const t = e.target.closest('.tt-cup'); if (!t || !live) return; live = false; const c = +t.dataset.c; t.classList.add('up'); cup(soul).classList.add('up'); Sfx.click(); later(500, () => resolve(c === soul, 'Your soul was under another cup.')); };
        },
        cards() {
          const n = Math.min(7, 5 + Math.floor(N / 2)), r = thR(13), s = thR(4), card = (ri, si, mir) => `<span class="pc ${TH_SUIT[si][1]} ${mir ? 'mir' : ''}"><b>${TH_RANK[ri]}</b><i>${TH_SUIT[si][0]}</i><b>${TH_RANK[ri]}</b></span>`;
          const twin = TH_SUIT.findIndex((x, i) => i !== s && x[1] === TH_SUIT[s][1]), fakes = shuffle([[r, twin], [(r + 1) % 13, s], [(r + 12) % 13, s], [r, s, 1], [r, (s + 2) % 4], [(r + 2) % 13, twin], [(r + 6) % 13, s]]).slice(0, n - 1);
          const deck = shuffle([[r, s, 0, 1], ...fakes.map(f => [f[0], f[1], f[2] || 0, 0])]);
          box.innerHTML = head('cards', 'Remember his card\u2026') + `<div class="tt-show" data-testid="thane-card-target">${card(r, s)}</div>`; T.watch = true;
          later(T.phase === 'monster' ? 1100 : 1700, () => {
            box.innerHTML = head('cards') + `<div class="tt-fan" style="--n:${deck.length}">${deck.map((c, i) => `<button class="tt-card ${nasty && Math.random() < 0.4 ? 'flip' : ''}" data-i="${i}" style="--i:${i}" data-testid="thane-card-${i}">${card(c[0], c[1], c[2])}</button>`).join('')}</div>`; T.watch = false; box.classList.add('live'); Sfx.noise(0.3, 'bandpass', 2600, 0.08);
            const morph = () => { if (!T.trick || T.trick !== 'cards') return; const fk = $$('.tt-card', box).filter(b => !deck[+b.dataset.i][3]); if (fk.length) { const b = pick(fk), old = b.innerHTML; b.innerHTML = card(r, s); b.classList.add('morph'); later(220, () => { b.innerHTML = old; b.classList.remove('morph'); }); } later(Math.max(380, 900 - N * 60), morph); };
            later(600, morph);
          });
          box.onpointerdown = e => { const t = e.target.closest('.tt-card'); if (!t || !box.classList.contains('live')) return; box.classList.remove('live'); const c = deck[+t.dataset.i]; t.classList.add('pick'); Sfx.click(); later(350, () => resolve(!!c[3], c[2] ? 'A mirror-fake. Look at the letters.' : 'That wasn\u2019t his card.')); };
        },
        mirrors() {
          const n = T.phase === 'monster' || N >= 3 ? 6 : 4, real = thR(n), face = img(T.phase === 'monster' ? 'thane_scare' : 'thane_face');
          box.innerHTML = head('mirrors') + `<div class="tt-mirrors" style="--c:${n / 2}">${Array.from({ length: n }, (_, i) => `<button class="tt-mir ${i === real ? 'real' : ''}" data-i="${i}" style="--img:url(${face});--dl:${i === real ? (0.35 + Math.random() * 0.4).toFixed(2) : 0}s" data-testid="thane-mirror-${i}"><i></i></button>`).join('')}</div>`;
          box.classList.add('live');
          if (nasty) { let mt = 1.1; T.tick = dt => { mt -= dt; if (mt > 0) return; mt = 1.1; const ms = $$('.tt-mir', box), a = pick(ms), b = pick(ms.filter(x => x !== a)), o = a.style.order || 0; a.style.order = b.style.order || 0; b.style.order = o; [a, b].forEach(x => { x.classList.remove('slide'); void x.offsetWidth; x.classList.add('slide'); }); Sfx.noise(0.12, 'bandpass', 2600, 0.06); }; }
          box.onpointerdown = e => { const t = e.target.closest('.tt-mir'); if (!t || !box.classList.contains('live')) return; box.classList.remove('live'); t.classList.add('crack'); Sfx.noise(0.3, 'highpass', 3500, 0.2); later(400, () => resolve(+t.dataset.i === real, 'Just a reflection. He\u2019s behind you.')); };
        },
        chains() {
          const n = N >= 3 || T.phase === 'monster' ? 5 : 4, L = T.phase === 'monster' ? 5 : 3 + Math.min(3, Math.floor(N / 2)), seq = Array.from({ length: L }, () => thR(n)), want = nasty ? seq.slice().reverse() : seq; let pos = 0, live = false;
          box.innerHTML = head('chains') + `<div class="tt-chains"><i class="chain"></i><div class="tt-locks">${Array.from({ length: n }, (_, i) => `<button class="tt-lock" data-i="${i}" data-testid="thane-lock-${i}" disabled><i data-lucide="lock"></i></button>`).join('')}</div></div><small class="tt-sm" id="tt-sm">Watch\u2026</small>`; icons(); T.watch = true;
          const lk = i => $(`.tt-lock[data-i="${i}"]`, box), sp = T.phase === 'monster' ? 380 : Math.max(380, 620 - N * 30);
          seq.forEach((i, j) => later(500 + j * sp, () => { lk(i).classList.add('glow'); Sfx.tone(330 + i * 90, 0.2, 'triangle', 0.1); later(sp * 0.7, () => lk(i).classList.remove('glow')); }));
          later(500 + L * sp + 200, () => { live = true; T.watch = false; $$('.tt-lock', box).forEach(b => { b.disabled = false; }); $('#tt-sm', box).textContent = nasty ? `REVERSE order: 0/${L}` : `Unlock in order: 0/${L}`; box.classList.add('live'); });
          box.onpointerdown = e => { const t = e.target.closest('.tt-lock'); if (!t || !live) return; const i = +t.dataset.i; Sfx.tone(330 + i * 90, 0.12, 'triangle', 0.1); if (i !== want[pos]) { live = false; t.classList.add('bad'); return resolve(false, 'Wrong lock. The chains tighten.'); } pos++; t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); $('#tt-sm', box).textContent = `Unlock in order: ${pos}/${L}`; if (pos >= L) { live = false; box.classList.add('free'); Sfx.noise(0.4, 'highpass', 2500, 0.15); later(450, () => resolve(true)); } };
        },
        spiral() {
          let round = 0; const rounds = T.phase === 'monster' ? 2 : 3;
          const go = () => {
            const tgt = pick(TH_COL), byWord = Math.random() < 0.5, n = 4, inks = shuffle(TH_COL.slice()), words = [];
            if (byWord) { words.push([tgt[0], pick(TH_COL.filter(c => c !== tgt))[1], 1]); words.push([pick(TH_COL.filter(c => c !== tgt))[0], tgt[1], 0]); }
            else { words.push([pick(TH_COL.filter(c => c !== tgt))[0], tgt[1], 1]); words.push([tgt[0], pick(TH_COL.filter(c => c !== tgt))[1], 0]); }
            while (words.length < n) { const w = pick(TH_COL.filter(c => c !== tgt)), k = pick(TH_COL.filter(c => c !== tgt && c !== w)); words.push([w[0], k[1], 0]); }
            const pos = shuffle([[18, 22], [62, 18], [24, 68], [66, 66], [44, 44]]);
            box.innerHTML = head('spiral', byWord ? `Tap the word that SAYS ${tgt[0]}` : `Tap the word written in ${tgt[0]} ink`) + `<div class="tt-spiral"><i class="sp"></i>${shuffle(words).map((w, i) => `<button class="tt-word" data-ok="${w[2]}" style="color:${w[1]};left:${pos[i][0]}%;top:${pos[i][1]}%;--dl:${(Math.random() * 2).toFixed(2)}s" data-testid="thane-word-${i}">${w[0]}</button>`).join('')}</div><small class="tt-sm">${round + 1}/${rounds}</small>`;
            box.classList.add('live'); void inks;
          };
          go();
          box.onpointerdown = e => { const t = e.target.closest('.tt-word'); if (!t || !box.classList.contains('live')) return; Sfx.click(); if (t.dataset.ok !== '1') { box.classList.remove('live'); return resolve(false, 'Your eyes lied to you.'); } round++; Sfx.tone(700 + round * 120, 0.1, 'sine', 0.08); if (round >= rounds) { box.classList.remove('live'); return resolve(true); } go(); };
        },
        saw() {
          const n = 7, tr = shuffle([...Array(n).keys()]).slice(0, 3), dur = T.phase === 'monster' ? 4.5 : Math.max(4.8, 8 - N * 0.4); let p = 0, cut = 0;
          box.innerHTML = head('saw') + `<div class="tt-saw"><div class="sbox"><i class="feet"></i><i class="head"></i>${[...Array(n).keys()].map(i => `<button class="seam ${tr.includes(i) ? 't' : ''}" data-i="${i}" style="--x:${(i + 1) / (n + 1) * 100}%;--dl:${(Math.random() * 1.4).toFixed(2)}s" data-testid="thane-seam-${i}"></button>`).join('')}</div><i class="blade" id="tt-blade"></i></div>`; box.classList.add('live');
          T.tick = dt => { p += dt / dur; const b = $('#tt-blade', box); if (b) b.style.left = Math.min(100, p * 100) + '%'; if (p >= 1) { T.tick = null; box.classList.remove('live'); resolve(false, 'The saw reached you.'); } };
          box.onpointerdown = e => { const t = e.target.closest('.seam'); if (!t || !box.classList.contains('live') || t.classList.contains('cut')) return; if (!t.classList.contains('t')) { box.classList.remove('live'); t.classList.add('bad'); return resolve(false, 'A fake seam. The box snaps shut.'); } t.classList.add('cut'); cut++; Sfx.noise(0.12, 'highpass', 3000, 0.14); if (cut >= 3) { box.classList.remove('live'); box.classList.add('free'); later(400, () => resolve(true)); } };
        },
        tank() {
          const L = nasty || T.phase === 'monster' ? 4 : 3, code = Array.from({ length: L }, () => thR(10)); let pos = 0, air = 100, bt = 0.6, wl = 0;
          box.innerHTML = head('tank', 'He whispers the combination\u2026') + `<div class="tt-whisper" data-testid="thane-tank-code">${code.join(' \u00b7 ')}</div>`; T.watch = true;
          later(T.phase === 'monster' ? 1300 : 1900, () => {
            box.innerHTML = head('tank') + `<div class="tt-tank"><i class="water" id="tt-water"></i><div class="tt-air"><small>Air</small><span class="meter"><i id="tt-air" data-testid="thane-air"></i></span></div><div class="tt-code">${code.map((_, i) => `<i data-s="${i}"></i>`).join('')}</div><div class="tt-dial">${[...Array(10).keys()].map(d => `<button data-dg="${d}" data-testid="thane-dial-${d}">${d}</button>`).join('')}</div></div>`; T.watch = false; box.classList.add('live'); Sfx.noise(1, 'lowpass', 300, 0.2);
            T.tick = dt => { air -= dt * (nasty ? 17 : 13); wl = Math.min(1, wl + dt / 6); const a = $('#tt-air', box), w = $('#tt-water', box); if (a) a.style.width = Math.max(0, air) + '%'; if (w) w.style.height = 20 + wl * 70 + '%'; bt -= dt;
              if (bt <= 0) { bt = 0.8 + Math.random() * 0.7; const tk = $('.tt-tank', box); if (tk) { const b = document.createElement('button'); b.className = 'bub'; b.dataset.testid = 'thane-bubble'; b.style.left = 8 + Math.random() * 84 + '%'; b.style.top = 15 + Math.random() * 45 + '%'; tk.appendChild(b); setTimeout(() => b.remove(), 1700); } }
              if (air <= 0) { T.tick = null; box.classList.remove('live'); resolve(false, 'You ran out of air.'); } };
          });
          box.onpointerdown = e => { if (!box.classList.contains('live')) return; const b = e.target.closest('.bub'); if (b) { air = Math.min(100, air + 28); b.remove(); Sfx.tone(900, 0.08, 'sine', 0.06, 1400); return; } const d = e.target.closest('[data-dg]'); if (!d) return; Sfx.click(); if (+d.dataset.dg !== code[pos]) { box.classList.remove('live'); return resolve(false, 'Wrong combination. The lock holds.'); } $(`.tt-code i[data-s="${pos}"]`, box).textContent = code[pos]; pos++; if (pos >= L) { box.classList.remove('live'); box.classList.add('free'); Sfx.noise(0.6, 'lowpass', 500, 0.25); later(450, () => resolve(true)); } };
        },
        doors() {
          const n = 4, ids = [...Array(n).keys()], rule = Math.random() < 0.5 ? 'not' : 'last', touched = shuffle(ids.slice()).slice(0, rule === 'not' ? 3 : 2 + thR(2)), ans = rule === 'not' ? ids.find(i => !touched.includes(i)) : touched[touched.length - 1];
          const steps = 3 + Math.floor(N / 2), d = Math.max(0.24, 0.55 - N * 0.03); let slot = ids.slice(), live = false;
          box.innerHTML = head('doors', rule === 'not' ? 'Rule: the exit is NOT behind a door I touch.' : 'Rule: the exit is the LAST door I touch.') + `<div class="tt-cups tt-doors" style="--n:${n};--d:${d}s">${ids.map(i => `<button class="tt-cup tt-door" data-c="${i}" style="--s:${i}" data-testid="thane-door-${i}" disabled><i class="cup"></i></button>`).join('')}</div>`; T.watch = true;
          const dr = i => $(`[data-c="${i}"]`, box), place = () => slot.forEach((c, s2) => dr(c).style.setProperty('--s', s2));
          touched.forEach((i, j) => later(500 + j * 650, () => { dr(i).classList.add('touch'); Sfx.tone(240 + j * 60, 0.25, 'triangle', 0.08); later(450, () => dr(i).classList.remove('touch')); }));
          later(700 + touched.length * 650, () => { let k = 0; const sw = () => { if (k++ >= steps) { live = true; T.watch = false; $$('.tt-door', box).forEach(x => { x.disabled = false; }); box.classList.add('live'); return; } const a = thR(n); let b = thR(n - 1); if (b >= a) b++; const fade = Math.random() < 0.4; if (fade) [dr(slot[a]), dr(slot[b])].forEach(x => x.classList.add('tele')); [slot[a], slot[b]] = [slot[b], slot[a]]; later(fade ? d * 500 : 0, place); later(d * 1000, () => $$('.tt-door.tele', box).forEach(x => x.classList.remove('tele'))); Sfx.noise(0.08, 'lowpass', 500, 0.12); later(d * 1000 + 60, sw); }; sw(); });
          box.onpointerdown = e => { const t = e.target.closest('.tt-door'); if (!t || !live) return; live = false; t.classList.add('open'); Sfx.creak(); later(500, () => resolve(+t.dataset.c === ans, 'Wrong door. Something was waiting behind it.')); };
        },
        puppet() {
          const L = N >= 6 || T.phase === 'monster' ? 5 : 4, seq = Array.from({ length: L }, () => thR(4)); let pos = 0, order = shuffle([0, 1, 2, 3]), crossed = false;
          const draw = () => { box.innerHTML = head('puppet') + `<div class="tt-seq">${seq.map((s2, i) => `<i class="${i < pos ? 'ok' : i === pos ? 'now' : ''}" style="color:${TH_SYM[s2][1]}">${TH_SYM[s2][0]}</i>`).join('')}</div><div class="tt-puppet ${crossed ? 'crossed' : ''}" data-testid="thane-puppet" data-crossed="${crossed}">${order.map((s2, p2) => `<button class="tt-pb" data-p="${p2}" style="color:${TH_SYM[s2][1]}" data-testid="thane-pb-${p2}"><i class="str"></i>${TH_SYM[s2][0]}</button>`).join('')}</div><small class="tt-sm">${crossed ? 'STRINGS CROSSED: left is right' : 'Strings straight'}</small>`; box.classList.add('live'); };
          draw();
          box.onpointerdown = e => { const t = e.target.closest('.tt-pb'); if (!t || !box.classList.contains('live')) return; const p2 = +t.dataset.p, eff = order[crossed ? 3 - p2 : p2]; Sfx.tone(500 + eff * 90, 0.08, 'square', 0.05); if (eff !== seq[pos]) { box.classList.remove('live'); return resolve(false, 'Your strings pulled the wrong way.'); } pos++; if (pos >= L) { box.classList.remove('live'); return resolve(true); } order = shuffle(order); crossed = Math.random() < 0.5; if (crossed) Sfx.noise(0.15, 'bandpass', 1200, 0.1); draw(); };
        },
        dove() {
          const need = 6; let got = 0, left = T.phase === 'monster' ? 7 : 9.5, st = 0.3;
          box.innerHTML = head('dove') + `<div class="tt-hat" data-testid="thane-hat"><i class="hat"></i></div><small class="tt-sm" id="tt-sm">Doves 0/${need}</small>`; icons(); box.classList.add('live');
          T.tick = dt => { left -= dt; st -= dt; if (st <= 0) { st = Math.max(0.32, 0.65 - N * 0.03) + Math.random() * 0.2; const hat = $('.tt-hat', box); if (hat) { const dag = Math.random() < Math.min(0.55, 0.35 + N * 0.03), b = document.createElement('button'); b.className = 'fly ' + (dag ? 'dag' : 'dov'); b.dataset.testid = dag ? 'thane-dagger' : 'thane-dove'; b.innerHTML = `<i data-lucide="${dag ? 'sword' : 'bird'}"></i>`; b.style.setProperty('--dx', (Math.random() * 300 - 150).toFixed(0) + 'px'); b.style.setProperty('--dy', -(60 + Math.random() * 90).toFixed(0) + 'px'); b.style.setProperty('--r', (Math.random() * 120 - 60).toFixed(0) + 'deg'); hat.appendChild(b); icons(); setTimeout(() => b.remove(), 1700); Sfx.noise(0.06, 'highpass', 2000, 0.05); } }
            if (left <= 0) { T.tick = null; box.classList.remove('live'); resolve(false, 'The doves got away.'); } };
          box.onpointerdown = e => { const t = e.target.closest('.fly'); if (!t || !box.classList.contains('live')) return; if (t.classList.contains('dag')) { box.classList.remove('live'); return resolve(false, 'You grabbed a dagger.'); } t.classList.add('caught'); setTimeout(() => t.remove(), 250); got++; Sfx.chime([1046]); $('#tt-sm', box).textContent = `Doves ${got}/${need}`; if (got >= need) { box.classList.remove('live'); T.tick = null; later(300, () => resolve(true)); } };
        },
        vanish(lunge) {
          let round = 0, side = 0, win = 0, live = false; const rounds = lunge ? 1 : 3;
          box.innerHTML = (lunge ? `<div class="tt-h"><b data-testid="thane-trick-name">HE LUNGES</b><small data-testid="thane-trick-tip">Read the smoke. Dodge the OTHER way. (\u2190 / \u2192)</small></div>` : head('vanish')) + `<div class="tt-dodge"><i class="smk l"></i><i class="smk r"></i><button class="tt-dg" data-d="-1" data-testid="thane-dodge-left"><i data-lucide="arrow-left"></i>Dodge</button><button class="tt-dg" data-d="1" data-testid="thane-dodge-right">Dodge<i data-lucide="arrow-right"></i></button></div><small class="tt-sm" id="tt-sm">Lights out\u2026</small>`; icons();
          const smk = s => $(`.smk.${s < 0 ? 'l' : 'r'}`, box);
          const go = () => {
            th.classList.remove('appear'); th.classList.add('dark'); pose(lunge ? 'm1' : 'smoke'); live = false; $$('.smk', box).forEach(x => x.className = x.className.replace(/ (on|faint)/g, ''));
            later(500 + Math.random() * 700, () => { side = Math.random() < 0.5 ? -1 : 1; smk(side).classList.add('on'); if (N >= 3 || lunge) smk(-side).classList.add('faint'); Sfx.noise(0.6, 'bandpass', 500, 0.14, 1); live = true; win = Math.max(0.75, (lunge ? 1.15 : 1.7) - N * 0.08); T.dodge = win; $('#tt-sm', box).textContent = 'NOW'; box.classList.add('live'); });
          };
          const hit = d => { if (!live) return; live = false; T.dodge = 0; box.classList.remove('live'); th.classList.remove('dark'); th.dataset.from = side; th.classList.remove('appear'); void th.offsetWidth; th.classList.add('appear'); pose(lunge ? 'm2' : 'cast');
            if (d === -side) { Sfx.noise(0.15, 'lowpass', 400, 0.3); round++; $('#tt-sm', box).textContent = `Dodged ${round}/${rounds}`; if (round >= rounds) return later(500, () => resolve(true)); later(700, go); }
            else { zap(true); resolve(false, d ? 'You dodged INTO him.' : 'Too slow.'); } };
          T.dodgeHit = hit; go();
          box.onpointerdown = e => { const t = e.target.closest('.tt-dg'); if (t) hit(+t.dataset.d); };
        }
      };
      const run = k => { th.classList.remove('appear', 'dark'); T.tick = null; T.trick = k; box.onpointerdown = null; box.classList.remove('live', 'free'); box.dataset.k = k; box.classList.remove('in'); void box.offsetWidth; box.classList.add('in'); if (TH_TRICKS[k] && T.phase === 'human') say(TH_TRICKS[k].name + '\u2026', TH_TRICKS[k].v); if (T.phase === 'human') pose(TH_TRICKS[k].pose || (k === 'vanish' ? 'smoke' : Math.random() < 0.5 ? 'cast' : 'idle')); k === 'lunge' ? B.vanish(true) : B[k](); };
      const next = () => {
        if (T.phase === 'monster') { if (T.fdone >= T.fsteps) return; return run(T.fq[T.fdone]); }
        if (T.first) { const f = T.first; T.first = null; T.last = f; return run(f); }
        if (!T.bag.length) T.bag = shuffle(Object.keys(TH_TRICKS).filter(k => (TH_TRICKS[k].enc || 0) <= N)); if (T.bag[T.bag.length - 1] === T.last) T.bag.unshift(T.bag.pop()); T.last = T.bag.pop(); run(T.last);
      };
      const finale = () => {
        T.busy = true; box.innerHTML = ''; th.classList.add('xform'); pose('cast'); say('Enough tricks. Let me show you what I really am.', 'thane_f'); Sfx.tone(48, 3.2, 'sawtooth', 0.18, 30);
        [600, 1200, 1700, 2100, 2400].forEach((ms, i) => later(ms, () => { pose(i % 2 ? 'm1' : 'cast'); zap(i > 2); }));
        later(2800, () => { th.classList.remove('xform'); th.dataset.phase = 'monster'; pose('m1'); $('#th-act', el).textContent = 'Act II \u00b7 The Last Trick'; T.phase = 'monster'; const tr = shuffle(Object.keys(TH_TRICKS).filter(k => k !== 'vanish' && (TH_TRICKS[k].enc || 0) <= N)).slice(0, T.fsteps / 2); T.fq = tr.flatMap(k => ['lunge', k]); count(); T.busy = false; next(); });
      };
      const key = e => { if (!T.dodgeHit || !T.dodge) return; if (e.key === 'ArrowLeft' || e.key === 'a') T.dodgeHit(-1); else if (e.key === 'ArrowRight' || e.key === 'd') T.dodgeHit(1); };
      document.addEventListener('keydown', key);
      ['thane_idle', 'thane_cast', 'thane_smoke', 'thane_saw', 'thane_tank', 'thane_doors', 'thane_m1', 'thane_m2', 'thane_face', 'thane_scare'].forEach(n => { new Image().src = img(n); });
      th.classList.add('open'); Sfx.thump(0.6); Sfx.noise(1.4, 'lowpass', 600, 0.12);
      if (N === 1) later(700, () => say('Welcome to my show. Every trick has a secret\u2026', 'thane_l0'));
      const encore = () => { const k = T.first, t = TH_TRICKS[k]; th.insertAdjacentHTML('beforeend', `<div class="th-encore" id="th-encore" data-testid="thane-encore"><small>${N <= 6 ? 'New tonight' : 'The show never ends'}</small><b>ENCORE</b><h3 data-testid="thane-encore-name">${t.name}</h3><p>${t.tip}</p></div>`); Sfx.tone(52, 2.6, 'sawtooth', 0.14, 38); zap(true); say(t.name + '\u2026', t.v); later(3400, () => { const c = $('#th-encore', el); if (c) { c.classList.add('out'); later(500, () => c.remove()); } T.busy = false; next(); }); };
      later(N === 1 ? 4200 : 1800, () => { if (T.first) return encore(); T.busy = false; next(); });
      count();
      return {
        update(dt) {
          if (T.dodge > 0) { T.dodge -= dt; if (T.dodge <= 0 && T.dodgeHit) T.dodgeHit(0); }
          if (!T.busy && T.trick && T.tick) T.tick(dt);
          if (!T.busy && T.trick) T.reach = Math.min(100, T.reach + dt * (T.phase === 'monster' ? 2.6 + N * 0.3 : 1.3 + N * 0.22) * (T.watch ? 0.4 : 1));
          T.max = Math.max(T.max, T.reach); $('#th-reach', el).style.width = T.reach + '%'; th.style.setProperty('--grip', (T.reach / 100).toFixed(3)); th.classList.toggle('grip', T.reach > 70);
          T.fT = (T.fT || 1) - dt; if (T.fT <= 0) { T.fT = T.phase === 'monster' ? 0.5 + Math.random() * 0.6 : 0.9 + Math.random() * 0.8; th.classList.toggle('f1'); }
          T.cT = (T.cT || 2) - dt; if (T.cT <= 0) { T.cT = 1.6 + Math.random() * 2.4; const fl = $('#th-flicks', el); if (fl && T.phase === 'human') { const c = document.createElement('i'); c.className = 'flick'; const fromL = Math.random() < 0.5; c.style.setProperty('--y0', 30 + Math.random() * 30 + '%'); c.style.setProperty('--dy', (Math.random() * 40 - 20).toFixed(0) + 'vh'); c.style.setProperty('--dir', fromL ? 1 : -1); c.style.left = fromL ? '48%' : '52%'; fl.appendChild(c); Sfx.noise(0.08, 'highpass', 4000, 0.04); setTimeout(() => c.remove(), 1300); } }
          if (T.phase === 'monster') { T.flashT -= dt; if (T.flashT <= 0 && T.phase === 'monster') { T.flashT = 1.6 + Math.random() * 2.6; zap(false); th.classList.remove('glitch'); void th.offsetWidth; th.classList.add('glitch'); } }
          if (T.reach >= 100) { T.reach = 100; caught('thane'); if (R && !R.done) T.reach = 60; return; }
          if (T.phase === 'monster' && T.fdone >= T.fsteps && !T.won) { T.won = true; unlock('thane1'); if (T.max < 50) unlock('thane_clean'); ctx.set(100); }
        },
        destroy() { document.removeEventListener('keydown', key); },
        isActive: () => false
      };
    }
  };
}
