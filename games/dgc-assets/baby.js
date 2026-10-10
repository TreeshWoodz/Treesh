'use strict';
/* BABY: babysit from 12 AM to 6 AM. Baby crawls off through the house. Find it, secure it, never lose it. */
const BB_ROOMS = [['Attic', 'r_attic'], ['Nursery', 'r_nursery'], ['Parents\u2019 Room', 'r_living'], ['Bathroom', 'r_bath'], ['Hallway', 'r_hall'], ['Laundry', 'r_bath'], ['Kitchen', 'r_kitchen'], ['Living Room', 'r_living'], ['Basement', 'r_attic']];
const BB_ACTS = [
  ['eating a live spider. It offers you a leg.', 'bug', 'Take the spider away', 'tap', ''],
  ['talking in an old man\u2019s voice: \u201cyou\u2019ll die in this house, sitter.\u201d', 'message-circle', 'Sing a lullaby', 'hold', ''],
  ['floating near the ceiling, perfectly still.', 'cloud', 'Pull Baby down', 'hold', 'float'],
  ['drawing your face in crayon. The eyes are scribbled out.', 'pencil', 'Take the crayon', 'tap', ''],
  ['rocking in the corner, facing the wall, humming.', 'repeat', 'Turn Baby around', 'hold', 'corner'],
  ['holding a pair of scissors, snipping at the air.', 'scissors', 'Take the scissors', 'tap', ''],
  ['crawling across the ceiling upside down.', 'move', 'Grab Baby', 'tap', 'ceil'],
  ['chewing on a dead goldfish.', 'fish', 'Take the fish away', 'tap', ''],
  ['staring into the mirror. It has no reflection.', 'scan-face', 'Cover the mirror', 'hold', ''],
  ['whispering into an electrical outlet.', 'plug', 'Pick Baby up', 'tap', ''],
  ['laughing at an empty chair. The chair laughs back.', 'armchair', 'Carry Baby away', 'hold', ''],
  ['smiling with far too many teeth.', 'smile', 'Give Baby the pacifier', 'tap', ''],
  ['writing \u201cMAMA IS NOT MAMA\u201d on the wall.', 'pen-line', 'Wipe the wall', 'tap', ''],
  ['holding your phone. It\u2019s calling YOUR mom.', 'phone', 'Hang up the phone', 'tap', ''],
  ['sitting perfectly still with its eyes rolled back.', 'eye-off', 'Gently shake Baby', 'hold', '']
];
const BB_DIRS = [['up', -3, 'arrow-up'], ['down', 3, 'arrow-down'], ['left', -1, 'arrow-left'], ['right', 1, 'arrow-right']];
const BB_HOUR = 26;

function babyMini() {
  return {
    id: 'baby', name: 'Babysitter', room: 'r_nursery', icon: 'baby', noBtn: true, noKiller: true, survive: true, view: 'baby', endReason: 'baby',
    labels: { look: 'Where is Baby?' },
    hint: 'The parents are going out. Their rules: never lose the baby. Don\u2019t feed it after 3. Don\u2019t look in the nursery mirror. Baby is nocturnal and crawls off through the house. Find it, secure it, and keep the \u201cLost\u201d meter from filling until 6 AM.',
    limit: () => BB_HOUR * 6,
    mount(el, ctx) {
      const adj = new Map(BB_ROOMS.map((_, i) => [i, new Set()])), link = (a, b) => { adj.get(a).add(b); adj.get(b).add(a); }, nb = i => BB_DIRS.map(d => [d, i + d[1]]).filter(([d, j]) => j >= 0 && j < 9 && (Math.abs(d[1]) === 3 || Math.floor(j / 3) === Math.floor(i / 3)));
      const seen = new Set([4]), stack = [4]; while (stack.length) { const c = stack[stack.length - 1], opts = nb(c).filter(([, j]) => !seen.has(j)); if (!opts.length) { stack.pop(); continue; } const [, j] = pick(opts); link(c, j); seen.add(j); stack.push(j); }
      for (let k = 0; k < 2; k++) { const a = Math.floor(Math.random() * 9), o = nb(a); if (o.length) link(a, pick(o)[1]); }
      const B = { p: 1, b: 1, act: pick(BB_ACTS), held: 0, secT: 0, moveT: 6, lost: 0, visited: new Set([1]), lastSeen: 1, prog: 0, hour: -1, worst: 0, sec: false };
      if (ctx.night === 1) Sfx.speak('baby_l0', 'baby');
      el.innerHTML = `<div class="mg mg-baby"><div class="bb" id="bb" data-testid="baby-house">
        <div class="os-bar bb-bar"><span class="bb-clock" id="bb-clock" data-testid="baby-clock">12:00 AM</span><span class="bb-lost"><small>Lost</small><span class="meter"><i id="bb-lost" data-testid="baby-lost-meter"></i></span></span><button class="os-pause" data-act="pause" data-testid="baby-pause-btn" aria-label="Pause"><i data-lucide="pause"></i></button></div>
        <section class="bb-room" id="bb-room" data-testid="baby-room"></section>
        <section class="bb-ctl"><div class="bb-map" id="bb-map" data-testid="baby-map"></div><div class="bb-pad" id="bb-pad"></div></section>
        <div class="bb-rules" id="bb-rules" data-testid="baby-rules"><img src="${img('baby_parents')}" alt=""><div><b>\u201cDon\u2019t lose the baby.\u201d</b><p>Never lose sight of it for long. Don\u2019t feed it after 3. Don\u2019t look in the nursery mirror. We\u2019ll be home at six.</p><button class="btn btn-acc" data-b="ok" data-testid="baby-rules-ok">I promise</button></div></div></div></div>`;
      const room = $('#bb-room', el), pad = $('#bb-pad', el), map = $('#bb-map', el), bb = $('#bb', el); let started = false;
      const hourStr = () => { const h = Math.min(6, Math.floor(R.t / BB_HOUR)), m = Math.floor((R.t % BB_HOUR) / BB_HOUR * 60); return `${h === 0 ? 12 : h}:${String(h >= 6 ? 0 : m).padStart(2, '0')} AM`; };
      const drawRoom = () => {
        const [name, bg] = BB_ROOMS[B.p], here = B.p === B.b, a = B.act;
        room.style.backgroundImage = `url(${img(bg)})`; room.dataset.room = B.p;
        room.innerHTML = `<b class="bb-name" data-testid="baby-room-name">${name}</b>${here ? `<div class="bb-baby ${a[4]} ${B.sec ? 'held' : ''}" data-testid="baby-sprite"><img src="${img('baby_sprite')}" alt="Baby"><i class="bb-prop"><i data-lucide="${a[1]}"></i></i></div><p class="bb-act" data-testid="baby-act">${B.sec ? 'Baby is in your arms\u2026 for now. It\u2019s staring at you.' : 'Baby is ' + esc(a[0])}</p>${B.sec ? '' : `<button class="bb-sec ${a[3]}" data-b="sec" data-testid="baby-secure-btn"><i data-lucide="hand-heart"></i>${esc(a[2])}${a[3] === 'hold' ? ' (hold)' : ' (tap fast)'}<span class="meter"><i id="bb-sm"></i></span></button>`}` : `<p class="bb-act empty" data-testid="baby-empty">${pick(['Empty. Something tiny crawled through the dust.', 'No baby. You hear giggling somewhere.', 'Empty. A small handprint on the wall.', 'Nothing here. The crib mobile is spinning.'])}</p>`}`;
        pad.innerHTML = BB_DIRS.map(([d, o, ic]) => { const j = B.p + o, open = adj.get(B.p).has(j), hint = open && j === B.b && R.t < BB_HOUR * 3; return `<button class="bb-dir d-${d}" data-b="go" data-v="${j}" ${open ? '' : 'disabled'} data-testid="baby-door-${d}"><i data-lucide="${ic}"></i><small>${open ? BB_ROOMS[j][0] : 'wall'}</small>${hint ? '<em>giggling\u2026</em>' : ''}</button>`; }).join('');
        map.innerHTML = BB_ROOMS.map((r, i) => `<i class="${B.visited.has(i) ? 'v' : ''} ${i === B.p ? 'me' : ''} ${i === B.lastSeen && B.visited.has(i) && i !== B.p ? 'ls' : ''} ${BB_DIRS.filter(([, o]) => adj.get(i).has(i + o)).map(([d]) => 'o-' + d).join(' ')}" title="${r[0]}" data-testid="baby-map-${i}"></i>`).join('');
        icons();
      };
      const babyMoves = () => { const o = [...adj.get(B.b)]; if (!o.length) return; let n = pick(o); if (Math.random() < 0.35 + B.hourN * 0.08) { const o2 = [...adj.get(n)].filter(x => x !== B.p); if (o2.length) n = pick(o2); } B.b = n; B.act = pick(BB_ACTS.filter(x => x !== B.act)); B.held = 0; if (B.p !== B.b) { Sfx.noise(0.3, 'bandpass', 900, 0.12); Sfx.tone(1300 + Math.random() * 400, 0.12, 'sine', 0.05); } drawRoom(); };
      const secure = () => { B.sec = true; B.secT = Math.max(4, 9 - B.hourN * 0.9); B.lost = Math.max(0, B.lost - 25); Sfx.chime([523, 659]); haptic(60, 0.3); drawRoom(); };
      room.addEventListener('pointerdown', e => { const t = e.target.closest('[data-b="sec"]'); if (!t || B.sec) return; e.preventDefault(); if (B.act[3] === 'tap') { B.held += 1 / (5 + B.hourN); const m = $('#bb-sm', room); if (m) m.style.width = Math.min(100, B.held * 100) + '%'; Sfx.click(); if (B.held >= 1) secure(); } else { B.holding = true; t.classList.add('down'); } });
      const rel = () => { if (B.holding) { B.holding = false; if (!B.sec) { B.held = 0; const m = $('#bb-sm', room); if (m) m.style.width = '0%'; } } };
      room.addEventListener('pointerup', rel); room.addEventListener('pointercancel', rel);
      el.addEventListener('pointerdown', e => {
        const t = e.target.closest('[data-b]'); if (!t || t.disabled) return; const b = t.dataset.b;
        if (b === 'ok') { e.preventDefault(); $('#bb-rules', el).remove(); started = true; Sfx.whisper(0.06); return; }
        if (b === 'go') { e.preventDefault(); if (B.sec) { B.sec = false; B.secT = 0; } B.p = +t.dataset.v; B.visited.add(B.p); if (B.p === B.b) { B.lastSeen = B.b; Sfx.tone(180, 0.4, 'triangle', 0.12, 120); shake(1); } Sfx.noise(0.15, 'lowpass', 500, 0.2); drawRoom(); }
      });
      B.hourN = 0; drawRoom();
      return {
        update(dt) {
          $('#bb-clock', el).textContent = hourStr(); const h = Math.min(5, Math.floor(R.t / BB_HOUR)); B.hourN = h; bb.dataset.h = h;
          if (h !== B.hour) { B.hour = h; if (h > 0) { toast(`${hourStr()}`, pick(['The house feels colder.', 'Baby is getting faster.', 'Something is wrong with the lights.', 'You hear the parents\u2019 car\u2026 no. Just the wind.']), 'bad'); Sfx.tone(110, 1.2, 'sine', 0.2, 55); } }
          ctx.set(R.t / R.limit * 100);
          if (!started) { R.t = Math.max(0, R.t - dt); return; }
          if (B.holding && !B.sec) { B.held += dt / 1.4; const m = $('#bb-sm', room); if (m) m.style.width = Math.min(100, B.held * 100) + '%'; if (B.held >= 1) { B.holding = false; secure(); } }
          if (B.sec) { B.secT -= dt; if (B.secT <= 0) { B.sec = false; toast('Baby wriggled free', 'It crawled off giggling. Find it.', 'bad'); babyMoves(); } }
          else { B.moveT -= dt; if (B.moveT <= 0) { B.moveT = Math.max(4, 12 - h * 1.6) + Math.random() * 3; if (B.p !== B.b || Math.random() < 0.45) babyMoves(); } }
          const here = B.p === B.b; B.lost = clamp(B.lost + (here ? -(B.sec ? 30 : 12) : 100 / Math.max(14, 34 - h * 4)) * dt, 0, 100); B.worst = Math.max(B.worst, B.lost);
          const lm = $('#bb-lost', el); lm.style.width = B.lost + '%'; bb.classList.toggle('panic', B.lost > 70);
          if (B.lost >= 100) { B.lost = 0; toast('The parents are home early.', '\u201cWhere. Is. Our. Baby.\u201d', 'bad'); caught('baby'); }
          if (R.t >= R.limit - 0.05) { unlock('baby1'); if (B.worst < 50) unlock('baby_pro'); }
        },
        isActive: () => false
      };
    }
  };
}
