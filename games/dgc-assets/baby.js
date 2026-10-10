'use strict';
/* BABY: babysit from 12 AM to 6 AM. Baby crawls off through the house. Find it, secure it, never lose it. */
const BB_ROOMS = [['Attic', 'r_attic'], ['Nursery', 'r_nursery'], ['Parents\u2019 Room', 'r_living'], ['Bathroom', 'r_bath'], ['Hallway', 'r_hall'], ['Laundry', 'r_bath'], ['Kitchen', 'r_kitchen'], ['Living Room', 'r_living'], ['Basement', 'r_attic']];
// k: art key (bba_k_0/1), d: frame durations, mo: motion style, fx: sound per frame
const BB_ACTS = [
  { k: 'knife', t: 'stabbing the floorboards with a kitchen knife. Thunk. Thunk. Thunk.', fix: 'Take the knife', how: 'tap', mo: 'stab', item: 'knife', d: [0.34, 0.2], fx: 'thunk' },
  { k: 'scissors', t: 'snipping its bonnet to ribbons with sewing scissors.', fix: 'Take the scissors', how: 'tap', mo: 'snip', item: 'scissors', d: [0.36, 0.2], fx: 'snip' },
  { k: 'fork', t: 'jamming a fork into the electrical outlet.', fix: 'Yank the fork away', how: 'tap', mo: 'zap', item: 'fork', d: [1.1, 0.3], fx: 'zap' },
  { k: 'spider', t: 'eating a live spider. It offers you a leg.', fix: 'Take the spider away', how: 'tap', mo: 'chew', item: 'spider', d: [0.8, 0.7], fx: 'chew' },
  { k: 'fish', t: 'chewing on the dead goldfish from the tank.', fix: 'Take the fish away', how: 'tap', mo: 'chew', item: 'goldfish', d: [0.7, 0.6], fx: 'chew' },
  { k: 'pills', t: 'shaking Mom\u2019s pill bottle like a rattle.', fix: 'Grab the pill bottle', how: 'tap', mo: 'rattle', item: 'pill bottle', d: [1.5, 1.2], fx: 'rattle' },
  { k: 'match', t: 'striking matches. One just caught.', fix: 'Blow it out & take the matches', how: 'hold', mo: 'flame', item: 'matches', d: [0.9, 2], fx: 'match' },
  { k: 'crayon', t: 'drawing your face in crayon. The eyes are scribbled out.', fix: 'Take the crayon', how: 'tap', mo: 'scribble', item: 'crayon', d: [1.6, 1.3], fx: 'scribble' },
  { k: 'phone', t: 'holding your phone. It\u2019s calling YOUR mom.', fix: 'Hang up the phone', how: 'tap', mo: 'ring', item: 'phone', d: [1.4, 1.4], fx: 'ring' },
  { k: 'cord', t: 'gnawing through a live power cord.', fix: 'Pull the cord away', how: 'hold', mo: 'chew', item: 'cord', d: [0.6, 0.5], fx: 'spark' },
  { k: 'mirror', t: 'staring into the nursery mirror. It has no reflection.', fix: 'Cover the mirror', how: 'hold', mo: 'mirror', item: 'mirror', d: [2.2, 0.4], fx: 'mirror' },
  { k: 'voice', t: 'talking in an old man\u2019s voice: \u201cyou\u2019ll die in this house, sitter.\u201d', fix: 'Sing a lullaby', how: 'hold', mo: 'talk', d: [0.6, 0.9], fx: 'voice' },
  { k: 'teeth', t: 'smiling with far too many teeth.', fix: 'Give Baby the pacifier', how: 'tap', mo: 'grin', d: [2, 0.6], fx: 'grin' },
  { k: 'rolled', t: 'sitting perfectly still with its eyes rolled back.', fix: 'Gently shake Baby', how: 'hold', mo: 'snap', d: [2.4, 0.5], fx: 'crack' },
  { k: 'corner', t: 'rocking in the corner, facing the wall, humming.', fix: 'Turn Baby around', how: 'hold', mo: 'rock', pose: 'corner', d: [2.6, 0.6], fx: 'hum' },
  { k: 'float', t: 'floating near the ceiling, perfectly still.', fix: 'Pull Baby down', how: 'hold', mo: 'hover', pose: 'float', d: [1.8, 1.8], fx: 'drone' },
  { k: 'crawl', t: 'crawling across the ceiling upside down.', fix: 'Grab Baby', how: 'tap', mo: 'crawl', pose: 'ceil', d: [0.24, 0.24], fx: 'skitter' }
];
const BB_FX = {
  thunk: f => f && (Sfx.thump(0.35), Sfx.noise(0.06, 'highpass', 1800, 0.08)),
  snip: f => f && (Sfx.noise(0.04, 'highpass', 5000, 0.14), Sfx.tone(3200, 0.03, 'square', 0.03)),
  zap: f => f && (Sfx.noise(0.28, 'highpass', 2500, 0.2), Sfx.tone(120, 0.28, 'sawtooth', 0.12, 60), haptic(80, 0.4)),
  chew: f => Sfx.noise(0.08, 'lowpass', 600 + f * 300, 0.1, 2),
  rattle: f => !f && [0, 0.08, 0.16, 0.24].forEach(d => Sfx.noise(0.04, 'bandpass', 3500, 0.08, 4, d)),
  match: f => f ? Sfx.noise(0.6, 'bandpass', 900, 0.06, 0.8) : Sfx.noise(0.12, 'highpass', 2000, 0.12),
  scribble: () => Sfx.scrub(),
  ring: f => !f && [0, 0.16].forEach(d => Sfx.tone(1400, 0.1, 'sine', 0.05, null, d)),
  spark: f => f && Sfx.noise(0.1, 'highpass', 3000, 0.12),
  mirror: f => f && (Sfx.noise(0.4, 'bandpass', 2600, 0.15, 3), Sfx.tone(880, 0.35, 'sawtooth', 0.05, 1300)),
  voice: f => Sfx.tone(f ? 70 : 95, 0.4, 'sawtooth', 0.06, f ? 60 : 80),
  grin: f => f && Sfx.chuckle(),
  crack: f => f && [0, 0.07].forEach(d => Sfx.noise(0.05, 'highpass', 1400, 0.22, 1, d)),
  hum: f => f ? Sfx.tone(160, 0.5, 'triangle', 0.06) : Sfx.tone(220, 0.8, 'sine', 0.03, 210),
  drone: f => Sfx.tone(f ? 58 : 52, 1.2, 'sine', 0.05),
  skitter: () => Sfx.noise(0.03, 'highpass', 2200, 0.06)
};
const BB_DIRS = [['up', -3, 'arrow-up'], ['down', 3, 'arrow-down'], ['left', -1, 'arrow-left'], ['right', 1, 'arrow-right']];
const BB_HOUR = 26;

function bbIntroHtml() {
  const v = n => `url(${img(n)})`;
  const rules = ['Never lose sight of it for long.', 'Don\u2019t feed it after 3.', 'Don\u2019t look in the nursery mirror.', 'We\u2019ll be home at six.'];
  return `<div class="bb-intro" id="bb-rules" data-testid="baby-rules" style="--w0:${v('bb_parents_w0')};--w1:${v('bb_parents_w1')};--p0:${v('baby_parents')};--p1:${v('bb_parents_p1')}">
    <i class="bbi-bg bbi-0"></i><i class="bbi-bg bbi-1"></i><i class="bbi-lamp"></i><i class="bbi-grain"></i><i class="bbi-bar t"></i><i class="bbi-bar b"></i>
    <div class="bbi-copy"><small class="bbi-kicker" data-testid="baby-rules-kicker">11:58 PM &middot; The parents are leaving</small>
      <h2 class="bbi-quote" data-testid="baby-rules-title">\u201cDon\u2019t lose the baby.\u201d</h2>
      <ol class="bbi-rules">${rules.map((r, i) => `<li style="--d:${1.6 + i * 0.45}s">${r}</li>`).join('')}</ol>
      <button class="btn btn-acc btn-xl bbi-ok" data-b="ok" data-testid="baby-rules-ok"><i data-lucide="hand-heart"></i>I promise</button></div></div>`;
}

function babyMini() {
  return {
    id: 'baby', name: 'Babysitter', room: 'r_nursery', icon: 'baby', noBtn: true, noKiller: true, survive: true, view: 'baby', endReason: 'baby',
    labels: { look: 'Where is Baby?' },
    hint: 'The parents are going out. Their rules: never lose the baby. Don\u2019t feed it after 3. Don\u2019t look in the nursery mirror. Baby is nocturnal and crawls off through the house. Find it, stop whatever it\u2019s doing, and keep the \u201cLost\u201d meter from filling until 6 AM.',
    limit: () => BB_HOUR * 6,
    mount(el, ctx) {
      const adj = new Map(BB_ROOMS.map((_, i) => [i, new Set()])), link = (a, b) => { adj.get(a).add(b); adj.get(b).add(a); }, nb = i => BB_DIRS.map(d => [d, i + d[1]]).filter(([d, j]) => j >= 0 && j < 9 && (Math.abs(d[1]) === 3 || Math.floor(j / 3) === Math.floor(i / 3)));
      const seen = new Set([4]), stack = [4]; while (stack.length) { const c = stack[stack.length - 1], opts = nb(c).filter(([, j]) => !seen.has(j)); if (!opts.length) { stack.pop(); continue; } const [, j] = pick(opts); link(c, j); seen.add(j); stack.push(j); }
      for (let k = 0; k < 2; k++) { const a = Math.floor(Math.random() * 9), o = nb(a); if (o.length) link(a, pick(o)[1]); }
      const B = { p: 1, b: 1, act: pick(BB_ACTS), held: 0, secT: 0, moveT: 6, lost: 0, visited: new Set([1]), lastSeen: 1, prog: 0, hour: -1, worst: 0, sec: false, f: 0, ft: 0.5, react: null, leaving: false };
      [...BB_ACTS.flatMap(a => [`bba_${a.k}_0`, `bba_${a.k}_1`]), 'bba_cry', 'bba_glare', 'baby_sprite', 'bb_parents_w0', 'bb_parents_w1', 'bb_parents_p1', 'baby_parents'].forEach(n => { new Image().src = img(n); });
      el.innerHTML = `<div class="mg mg-baby"><div class="bb" id="bb" data-testid="baby-house">
        <div class="os-bar bb-bar"><span class="bb-clock" id="bb-clock" data-testid="baby-clock">12:00 AM</span><span class="bb-lost"><small>Lost</small><span class="meter" id="bb-lostm"><i id="bb-lost" data-testid="baby-lost-meter"></i></span></span><button class="os-pause" data-act="pause" data-testid="baby-pause-btn" aria-label="Pause"><i data-lucide="pause"></i></button></div>
        <section class="bb-room" id="bb-room" data-testid="baby-room"></section>
        <section class="bb-ctl"><div class="bb-map" id="bb-map" data-testid="baby-map"></div><div class="bb-pad" id="bb-pad"></div></section>
        ${bbIntroHtml()}</div></div>`;
      const room = $('#bb-room', el), pad = $('#bb-pad', el), map = $('#bb-map', el), bb = $('#bb', el); let started = false;
      if (ctx.night === 1) setTimeout(() => Sfx.speak('baby_l0', 'baby'), 900);
      const hourStr = () => { const h = Math.min(6, Math.floor(R.t / BB_HOUR)), m = Math.floor((R.t % BB_HOUR) / BB_HOUR * 60); return `${h === 0 ? 12 : h}:${String(h >= 6 ? 0 : m).padStart(2, '0')} AM`; };
      const fig = srcs => `<div class="bb-mo"><div class="bb-fig">${srcs.map((s, i) => `<img class="fr${i}" src="${img(s)}" alt="Baby" draggable="false">`).join('')}</div></div>`;
      const spriteHtml = () => {
        const a = B.act;
        if (B.react) return `<div class="bb-baby react r-${B.react.kind}" data-testid="baby-sprite" data-state="react-${B.react.kind}">${fig(['bba_' + B.react.kind])}</div>`;
        if (B.sec) return `<div class="bb-baby held" data-testid="baby-sprite" data-state="held">${fig(['baby_sprite'])}</div>`;
        return `<div class="bb-baby p-${a.pose || 'sit'} m-${a.mo} ${B.f ? 'f1' : ''} ${B.fresh ? 'enter' : ''}" data-testid="baby-sprite" data-state="act" data-act="${a.k}">${fig([`bba_${a.k}_0`, `bba_${a.k}_1`])}<i class="bb-fx"></i></div>`;
      };
      const actText = () => B.react ? B.react.msg : B.sec ? 'Baby is in your arms\u2026 for now. It\u2019s staring at you.' : 'Baby is ' + esc(B.act.t);
      const drawRoom = () => {
        const [name, bg] = BB_ROOMS[B.p], here = B.p === B.b, a = B.act, busy = B.sec || B.react;
        room.dataset.room = B.p;
        room.innerHTML = `<i class="bb-bg" style="background-image:url(${img(bg)})"></i><i class="bb-dust"></i><i class="bb-dark"></i><b class="bb-name" data-testid="baby-room-name">${name}</b>${here ? `${spriteHtml()}<p class="bb-act ${B.react ? 'r' : ''}" data-testid="baby-act">${actText()}</p>${busy ? '' : `<button class="bb-sec ${a.how}" data-b="sec" data-testid="baby-secure-btn"><i data-lucide="hand-heart"></i>${esc(a.fix)}${a.how === 'hold' ? ' (hold)' : ' (tap fast)'}<span class="meter"><i id="bb-sm"></i></span></button>`}` : `<p class="bb-act empty" data-testid="baby-empty">${pick(['Empty. Something tiny crawled through the dust.', 'No baby. You hear giggling somewhere.', 'Empty. A small handprint on the wall.', 'Nothing here. The crib mobile is spinning.'])}</p>`}`;
        pad.innerHTML = BB_DIRS.map(([d, o, ic]) => { const j = B.p + o, open = adj.get(B.p).has(j), hint = open && j === B.b && R.t < BB_HOUR * 3; return `<button class="bb-dir d-${d}" data-b="go" data-v="${j}" ${open ? '' : 'disabled'} data-testid="baby-door-${d}"><i data-lucide="${ic}"></i><small>${open ? BB_ROOMS[j][0] : 'wall'}</small>${hint ? '<em>giggling\u2026</em>' : ''}</button>`; }).join('');
        map.innerHTML = BB_ROOMS.map((r, i) => `<i class="${B.visited.has(i) ? 'v' : ''} ${i === B.p ? 'me' : ''} ${i === B.lastSeen && B.visited.has(i) && i !== B.p ? 'ls' : ''} ${BB_DIRS.filter(([, o]) => adj.get(i).has(i + o)).map(([d]) => 'o-' + d).join(' ')}" title="${r[0]}" data-testid="baby-map-${i}"></i>`).join('');
        icons();
      };
      const bump = cls => { const m = $('#bb-lostm', el); m.classList.remove('bump', 'bump-bad'); void m.offsetWidth; m.classList.add(cls); };
      const babyMoves = () => {
        const o = [...adj.get(B.b)]; if (!o.length) return;
        const sp = B.p === B.b && $('.bb-baby', room);
        if (sp && !B.leaving) { B.leaving = true; sp.className = 'bb-baby leave'; sp.querySelectorAll('img').forEach((im, i) => { im.src = img('bba_crawl_' + i); }); const fx = $('.bb-fx', sp); if (fx) fx.remove(); Sfx.tone(1500, 0.15, 'sine', 0.06, 2200); return setTimeout(babyMoves, 850); }
        B.leaving = false;
        let n = pick(o); if (Math.random() < 0.35 + B.hourN * 0.08) { const o2 = [...adj.get(n)].filter(x => x !== B.p); if (o2.length) n = pick(o2); }
        B.b = n; B.act = pick(BB_ACTS.filter(x => x !== B.act)); B.held = 0; B.fresh = true; B.f = 0; B.ft = B.act.d[0];
        if (B.p !== B.b) { Sfx.noise(0.3, 'bandpass', 900, 0.12); Sfx.tone(1300 + Math.random() * 400, 0.12, 'sine', 0.05); }
        drawRoom();
      };
      const secure = () => {
        const a = B.act, kind = Math.random() < 0.62 - B.hourN * 0.08 ? 'cry' : 'glare';
        const sp = $('.bb-baby', room); if (sp) sp.classList.add('snatch');
        if (a.item) { Sfx.noise(0.06, 'highpass', 3500, 0.15); Sfx.tone(2400, 0.08, 'triangle', 0.05, 1800, 0.05); Sfx.thump(0.2, 0.12); }
        haptic(60, 0.3);
        setTimeout(() => {
          B.fresh = false; B.f = 0;
          B.react = { kind, t: 1.8, msg: (a.item ? `Baby drops the ${a.item}. ` : 'Baby stops. ') + (kind === 'cry' ? 'It starts wailing. Loudly.' : 'It doesn\u2019t cry. It just\u2026 glares at you.') };
          if (kind === 'cry') { [0, 0.5, 1].forEach(d => Sfx.tone(520, 0.45, 'sawtooth', 0.05, 690, d)); B.lost = Math.max(0, B.lost - 12); bump('bump-bad'); }
          else { Sfx.tone(55, 1.4, 'sine', 0.18, 46); Sfx.whisper(0.05); B.lost = Math.max(0, B.lost - 25); bump('bump'); shake(1); }
          drawRoom();
        }, 260);
      };
      const endReact = () => { const k = B.react.kind; B.react = null; B.sec = true; B.secT = Math.max(4, (k === 'cry' ? 7 : 9) - B.hourN * 0.9); Sfx.chime([523, 659]); drawRoom(); };
      room.addEventListener('pointerdown', e => { const t = e.target.closest('[data-b="sec"]'); if (!t || B.sec || B.react) return; e.preventDefault(); if (B.act.how === 'tap') { B.held += 1 / (5 + B.hourN); const m = $('#bb-sm', room); if (m) m.style.width = Math.min(100, B.held * 100) + '%'; Sfx.click(); const sp = $('.bb-baby', room); if (sp) { sp.classList.remove('tug'); void sp.offsetWidth; sp.classList.add('tug'); } if (B.held >= 1) { B.held = 0; secure(); } } else { B.holding = true; t.classList.add('down'); const sp = $('.bb-baby', room); if (sp) sp.classList.add('tugging'); } });
      room.addEventListener('pointermove', e => { const r = room.getBoundingClientRect(); room.style.setProperty('--fx', (e.clientX - r.left) / r.width * 100 + '%'); room.style.setProperty('--fy', (e.clientY - r.top) / r.height * 100 + '%'); });
      const rel = () => { if (B.holding) { B.holding = false; const sp = $('.bb-baby', room); if (sp) sp.classList.remove('tugging'); if (!B.sec && !B.react) { B.held = 0; const m = $('#bb-sm', room); if (m) m.style.width = '0%'; } } };
      room.addEventListener('pointerup', rel); room.addEventListener('pointercancel', rel);
      el.addEventListener('pointerdown', e => {
        const t = e.target.closest('[data-b]'); if (!t || t.disabled) return; const b = t.dataset.b;
        if (b === 'ok') { e.preventDefault(); const intro = $('#bb-rules', el); if (!intro || intro.classList.contains('out')) return; intro.classList.add('out'); Sfx.tone(62, 1.1, 'sawtooth', 0.12, 44); Sfx.whisper(0.06); setTimeout(() => { Sfx.creak(); Sfx.thump(0.8, 0.5); }, 700); setTimeout(() => { intro.remove(); started = true; }, 1500); return; }
        if (b === 'go') { e.preventDefault(); if (B.sec) { B.sec = false; B.secT = 0; } B.react = null; B.leaving = false; const dir = t.className.match(/d-(\w+)/)[1]; B.p = +t.dataset.v; B.visited.add(B.p); B.fresh = true; room.classList.remove('walk', 'w-up', 'w-down', 'w-left', 'w-right'); void room.offsetWidth; room.classList.add('walk', 'w-' + dir); [0, 0.22].forEach(d => Sfx.noise(0.09, 'lowpass', 380, 0.3, 1, d)); if (B.p === B.b) { B.lastSeen = B.b; Sfx.tone(180, 0.4, 'triangle', 0.12, 120); shake(1); } drawRoom(); B.fresh = false; }
      });
      B.hourN = 0; drawRoom();
      return {
        update(dt) {
          $('#bb-clock', el).textContent = hourStr(); const h = Math.min(5, Math.floor(R.t / BB_HOUR)); B.hourN = h; bb.dataset.h = h;
          if (h !== B.hour) { B.hour = h; if (h > 0) { bb.classList.remove('blackout'); void bb.offsetWidth; bb.classList.add('blackout'); toast(`${hourStr()}`, pick(['The house feels colder.', 'Baby is getting faster.', 'Something is wrong with the lights.', 'You hear the parents\u2019 car\u2026 no. Just the wind.']), 'bad'); Sfx.tone(110, 1.2, 'sine', 0.2, 55); } }
          ctx.set(R.t / R.limit * 100);
          const here = B.p === B.b;
          if (here && !B.sec && !B.react) { B.ft -= dt; if (B.ft <= 0) { B.f ^= 1; const a = B.act; B.ft = (B.leaving ? 0.12 : a.d[B.f]) * (0.8 + Math.random() * 0.4); const sp = $('.bb-baby', room); if (sp) sp.classList.toggle('f1', B.f === 1); if (started && !B.leaving) BB_FX[a.fx](B.f); } }
          B.peekT = (B.peekT || 3) - dt; if (B.peekT <= 0 && started) { B.peekT = 3 + Math.random() * 4; if (B.p !== B.b && adj.get(B.p).has(B.b) && Math.random() < 0.7) { const side = B.b < B.p ? (B.p - B.b === 1 ? 'pl' : 'pu') : (B.b - B.p === 1 ? 'pr' : 'pd'), pk = document.createElement('img'); pk.src = img(side === 'pl' || side === 'pr' ? 'bba_crawl_0' : 'baby_sprite'); pk.className = 'bb-peek ' + side; room.appendChild(pk); Sfx.tone(1700 + Math.random() * 500, 0.1, 'sine', 0.05); Sfx.tone(1400, 0.12, 'sine', 0.04, null, 0.12); setTimeout(() => pk.remove(), 1600); } }
          if (!started) { R.t = Math.max(0, R.t - dt); return; }
          if (B.react) { B.react.t -= dt; if (B.react.t <= 0) endReact(); }
          if (B.holding && !B.sec && !B.react) { B.held += dt / 1.4; const m = $('#bb-sm', room); if (m) m.style.width = Math.min(100, B.held * 100) + '%'; if (B.held >= 1) { B.holding = false; B.held = 0; secure(); } }
          if (B.sec) { B.secT -= dt; if (B.secT <= 0) { B.sec = false; toast('Baby wriggled free', 'It crawled off giggling. Find it.', 'bad'); babyMoves(); } }
          else if (!B.react) { B.moveT -= dt; if (B.moveT <= 0) { B.moveT = Math.max(4, 12 - h * 1.6) + Math.random() * 3; if (B.p !== B.b || Math.random() < 0.45) babyMoves(); } }
          B.lost = clamp(B.lost + (here ? -(B.sec || B.react ? 30 : 12) : 100 / Math.max(14, 34 - h * 4)) * dt, 0, 100); B.worst = Math.max(B.worst, B.lost);
          const lm = $('#bb-lost', el); lm.style.width = B.lost + '%'; bb.classList.toggle('panic', B.lost > 70);
          if (B.lost >= 100) { B.lost = 0; toast('The parents are home early.', '\u201cWhere. Is. Our. Baby.\u201d', 'bad'); caught('baby'); }
          if (R.t >= R.limit - 0.05) { unlock('baby1'); if (B.worst < 50) unlock('baby_pro'); }
        },
        isActive: () => false
      };
    }
  };
}
