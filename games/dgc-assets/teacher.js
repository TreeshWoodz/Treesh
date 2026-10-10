'use strict';
/* MISS FLORENCE: do your schoolwork only while she writes on the board. Every mess-up makes her (and the room) worse. */
const T_LINES = [
  { look: ['Eyes up here, sweetie!', 'Everyone paying attention? Good!', 'I love how quiet we are!'], mess: ['Oopsie! That\u2019s okay, try again!', 'Almost! You\u2019ll get it!'], praise: ['Wonderful job!', 'Gold star for you!', 'So proud of you!'], write: ['Let\u2019s keep going, class!'] },
  { look: ['Hmm. Eyes on me.', 'Is someone talking?', 'I hear whispering.'], mess: ['That\u2019s\u2026 not right. Again.', 'We talked about this.'], praise: ['Fine. Good.', 'Better.'], write: ['Copy this down.'] },
  { look: ['I SEE all of you.', 'Don\u2019t. Move.', 'Who was that?'], mess: ['Wrong. WRONG.', 'You disappoint me.'], praise: ['\u2026acceptable.', 'Again. Faster.'], write: ['Nobody leaves until it\u2019s perfect.'] },
  { look: ['WHO IS OUT OF THEIR SEAT', 'I can hear your heart', 'look at me. LOOK AT ME.'], mess: ['You will stay after class. Forever.', 'Another mistake. Another.'], praise: ['keep working. keep. working.'], write: ['the lesson never ends'] },
  { look: ['SIT. DOWN.', 'EYES. FRONT.', 'i  s e e  y o u'], mess: ['DETENTION NEVER ENDS'], praise: ['m o r e'], write: ['w r i t e'] }
];
const T_WORDS = [['CAT', 'SUN', 'BOOK', 'STAR'], ['APPLE', 'CHALK', 'RULER', 'CRAYON'], ['DETENTION', 'SITSTILL', 'NOTALKING'], ['EYESFRONT', 'NEVERLEAVE', 'STAYSEATED'], ['SHESEESYOU', 'DONTTURN', 'FOREVERCLASS']];
const T_TYPES = ['quiz', 'copy', 'note', 'sharpen', 'cheat'];
const T_NAMES = { quiz: 'Pop Quiz', copy: 'Copy the Board', note: 'Pass the Note', sharpen: 'Sharpen Your Pencil', cheat: 'Peek at Lena\u2019s Paper' };
const T_RULES = { quiz: 'Answer while her back is turned.', copy: 'Tap the letters in order.', note: 'Hold to whisper & pass. Talking is forbidden.', sharpen: 'Get up, sharpen, SIT DOWN before she turns.', cheat: 'Hold to peek, then answer. Cheaters get caught.' };

function tQuiz(c) {
  const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  if (c >= 4 && Math.random() < 0.5) return pick([['What is my name?', 'Miss Florence', ['Mr. Hush', 'Mom', 'Nobody']], ['Who is your favorite teacher?', 'Miss Florence', ['The Bride', 'Bestie', 'No one']], ['How long is detention?', 'Forever', ['1 hour', 'Until 3pm', 'It isn\u2019t']]]);
  let q, a;
  if (c <= 1) { const x = r(2, 9), y = r(2, 9); q = `${x} + ${y} = ?`; a = x + y; }
  else if (c === 2) { const x = r(3, 9), y = r(3, 9); q = `${x} \u00d7 ${y} = ?`; a = x * y; }
  else { const x = r(10, 30), y = r(2, 5), z = r(2, 4); q = `${x} \u2212 ${y} \u00d7 ${z} = ?`; a = x - y * z; }
  const opts = new Set([a]); while (opts.size < (c >= 2 ? 4 : 3)) opts.add(a + pick([-3, -2, -1, 1, 2, 3, 10, -10]));
  return [q, String(a), [...opts].filter(o => o !== a).map(String)];
}

function teacherMini() {
  return {
    id: 'teacher', name: 'Detention', room: 'teacher_f0', icon: 'graduation-cap', noBtn: true, noKiller: true, view: 'teacher', endReason: 'teacher',
    labels: { look: 'Miss Florence is watching' },
    hint: 'Miss Florence is SO happy to have you in class! Do your work only while she writes on the board. When the chalk SCREECHES, freeze: she\u2019s turning around. Every mistake makes her\u2026 less patient.',
    limit: n => Math.max(110, 160 - n * 6),
    mount(el, ctx) {
      const T = { ph: 'look', left: 2.2, mess: 0, c: 0, done: 0, need: Math.min(9, 4 + ctx.night), task: null, standing: false, hold: null, line: '' };
      if (ctx.night === 1) Sfx.speak('teacher_l0', 'teacher');
      el.innerHTML = `<div class="mg mg-teach"><div class="tc" id="tc" data-c="0" data-testid="teacher-room">
        <div class="os-bar tc-bar"><span id="t-clock" data-testid="teacher-clock"></span><span class="tc-pill" id="t-ph" data-testid="teacher-phase">Watching</span><span class="tc-mood" data-testid="teacher-mood">Mood: <b id="t-mood">Bubbly</b></span><span id="t-done" data-testid="teacher-done">0/${T.need}</span><button class="os-pause" data-act="pause" data-testid="teacher-pause-btn" aria-label="Pause"><i data-lucide="pause"></i></button></div>
        <section class="tc-scene" id="tsc" data-testid="teacher-scene">${[0, 1, 2, 3, 4].map(i => `<img class="ts f" data-k="f${i}" src="${img('teacher_f' + i)}" alt="">`).join('')}${[0, 2, 4].map(i => `<img class="ts b" data-k="b${i}" src="${img('teacher_b' + i)}" alt="">`).join('')}<em class="tc-say" id="t-say" data-testid="teacher-say"></em><b class="tc-scr">SCREEEEECH</b></section>
        <section class="tc-desk" id="desk" data-testid="teacher-desk"></section></div></div>`;
      const tc = $('#tc', el), sc = $('#tsc', el), desk = $('#desk', el), MOODS = ['Bubbly', 'Stern', 'Unsettling', 'Demonic', '\u2026'];
      const say = (k, force) => { const l = pick(T_LINES[T.c][k]); if (!force && Math.random() < 0.4) return; const b = $('#t-say', el); b.textContent = l; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); };
      const show = () => { const k = T.ph === 'look' ? 'f' + T.c : 'b' + (T.c >= 4 ? 4 : T.c >= 2 ? 2 : 0); $$('.ts', sc).forEach(i => i.classList.toggle('on', i.dataset.k === k)); sc.dataset.ph = T.ph; const p = $('#t-ph', el); p.textContent = T.ph === 'look' ? 'WATCHING' : T.ph === 'warn' ? 'TURNING!' : 'Writing\u2026'; p.className = 'tc-pill ' + T.ph; };
      const messUp = why => {
        T.mess++; Sfx.tone(220, 0.35, 'triangle', 0.15, 140); haptic(120, 0.5); shake(1.5); const nc = Math.min(4, Math.floor(T.mess / 2));
        if (nc !== T.c) { T.c = nc; tc.dataset.c = nc; $('#t-mood', el).textContent = MOODS[nc]; Sfx.tone(70, 0.9, 'sawtooth', 0.2, 35); Sfx.noise(0.6, 'lowpass', 400, 0.35); shake(3); tc.classList.remove('morph'); void tc.offsetWidth; tc.classList.add('morph'); if (nc === 4) Sfx.speak('teacher_l4', 'teacher'); show(); }
        say('mess', true); if (why) toast('Mess-up', why, 'bad');
      };
      const newTask = () => {
        const t = pick(T_TYPES.filter(x => !T.task || x !== T.task.type)), c = T.c, k = { type: t, step: 0 };
        if (t === 'quiz') { k.n = c >= 2 ? 3 : 2; k.q = tQuiz(c); }
        if (t === 'copy') { k.word = pick(T_WORDS[c]); k.pos = 0; const pool = 'ABCDEFGHIJKLMNOPRSTUVWY'; k.tiles = shuffle([...new Set(k.word.split(''))].concat([...pool].filter(x => !k.word.includes(x)).sort(() => Math.random() - 0.5).slice(0, 3 + c))); }
        if (t === 'note') { k.n = c >= 4 ? 3 : c >= 2 ? 2 : 1; k.need = 1.1 + c * 0.25; k.held = 0; }
        if (t === 'sharpen') { k.taps = 0; k.need = 6 + c * 2; }
        if (t === 'cheat') { k.code = pick('ABCD') + (1 + Math.floor(Math.random() * 9)); k.opts = shuffle([k.code, ...shuffle(['A', 'B', 'C', 'D'].flatMap(l => [1, 3, 5, 7, 9].map(n => l + n)).filter(x => x !== k.code)).slice(0, 3)]); k.peek = 0; k.seen = false; }
        T.task = k; T.standing = false; T.hold = null; draw();
      };
      const finish = () => {
        T.done++; $('#t-done', el).textContent = `${T.done}/${T.need}`; Sfx.chime([880, 1175]); say('praise', true); ctx.set(T.done / T.need * 100);
        if (T.done >= T.need) { if (T.mess === 0) unlock('teacher1'); if (T.c >= 4) unlock('teacher_demon'); return; }
        setTimeout(() => { if (R && !R.done) newTask(); }, 500);
      };
      const deskHtml = () => {
        const k = T.task; if (!k) return '';
        const head = `<div class="tk-h"><b data-testid="teacher-task-name">${T_NAMES[k.type]}</b><small>${T_RULES[k.type]}</small></div>`;
        if (k.type === 'quiz') return head + `<div class="tk-q" data-testid="teacher-question">${esc(k.q[0])}<small>Question ${k.step + 1}/${k.n}</small></div><div class="tk-opts">${shuffle([k.q[1], ...k.q[2]]).map((o, i) => `<button data-t="ans" data-v="${esc(o)}" data-testid="teacher-ans-${i}">${esc(o)}</button>`).join('')}</div>`;
        if (k.type === 'copy') return head + `<div class="tk-board" data-testid="teacher-board-word">${k.word.split('').map((ch, i) => `<i class="${i < k.pos ? 'ok' : ''}">${ch}</i>`).join('')}</div><div class="tk-tiles">${(T.c >= 3 ? shuffle(k.tiles.slice()) : k.tiles).map(ch => `<button data-t="letter" data-v="${ch}" data-testid="teacher-letter-${ch}">${ch}</button>`).join('')}</div>`;
        if (k.type === 'note') return head + `<div class="tk-note"><span>Pass ${k.step + 1}/${k.n}: to ${pick(['Jamal', 'Priya', 'Mei', 'Mateo', 'Amara', 'Noor'])}</span><div class="meter"><i id="t-m"></i></div><button class="tk-hold" data-t="note" data-testid="teacher-note-hold"><i data-lucide="mail"></i>Hold to whisper & pass</button></div>`;
        if (k.type === 'sharpen') return head + `<div class="tk-sharp ${T.standing ? 'up' : ''}">${T.standing ? `<div class="meter"><i style="width:${k.taps / k.need * 100}%"></i></div><button class="tk-big" data-t="sharp" data-testid="teacher-sharpen-btn"><i data-lucide="pencil"></i>Sharpen (${k.taps}/${k.need})</button><button class="tk-sit" data-t="sit" data-testid="teacher-sit-btn"><i data-lucide="armchair"></i>Sit down</button>` : `<button class="tk-big" data-t="stand" data-testid="teacher-stand-btn"><i data-lucide="footprints"></i>${k.taps >= k.need ? 'Done!' : 'Get up'}</button>`}</div>`;
        if (k.type === 'cheat') return head + `<div class="tk-cheat"><div class="tk-paper ${k.seen ? 'seen' : ''}" data-testid="teacher-cheat-paper">${k.seen ? `Lena wrote: <b>${k.code}</b>` : 'Lena\u2019s answer is hidden\u2026'}<div class="meter"><i id="t-m"></i></div></div><button class="tk-hold" data-t="peek" data-testid="teacher-peek-hold"><i data-lucide="eye"></i>Hold to peek</button><div class="tk-opts">${k.opts.map((o, i) => `<button data-t="code" data-v="${o}" data-testid="teacher-code-${i}">${o}</button>`).join('')}</div></div>`;
        return head;
      };
      const draw = () => { desk.innerHTML = deskHtml() + `<div class="tk-seat" data-testid="teacher-seat-state">${T.standing ? '<i data-lucide="alert-triangle"></i>You are OUT OF YOUR SEAT' : '<i data-lucide="armchair"></i>Seated'}</div>`; desk.classList.toggle('standing', T.standing); icons(); };
      const busted = why => { if (!R || R.done) return; T.hold = null; toast('Caught!', why, 'bad'); caught('teacher'); if (R && !R.done) { T.standing = false; draw(); } };
      desk.addEventListener('pointerdown', e => {
        const t = e.target.closest('[data-t]'); if (!t || !T.task) return; e.preventDefault(); const a = t.dataset.t, v = t.dataset.v, k = T.task;
        if (T.ph === 'look' && a !== 'sit') return busted(a === 'note' ? 'She caught you talking.' : a === 'peek' || a === 'code' ? 'She caught you cheating.' : 'She saw you move.');
        if (T.ph === 'warn' && a !== 'sit') messUp('She heard something\u2026');
        Sfx.click();
        if (a === 'ans') { if (v !== k.q[1]) messUp('Wrong answer'); if (++k.step >= k.n) return finish(); k.q = tQuiz(T.c); return draw(); }
        if (a === 'letter') { if (v === k.word[k.pos]) { k.pos++; Sfx.tone(600 + k.pos * 60, 0.06, 'square', 0.06); if (k.pos >= k.word.length) return finish(); } else messUp('Sloppy handwriting'); return draw(); }
        if (a === 'note' || a === 'peek') { T.hold = a; t.classList.add('down'); return; }
        if (a === 'code') { if (!k.seen) { messUp('You guessed. She can tell.'); return draw(); } if (v !== k.code) messUp('Wrong answer'); return finish(); }
        if (a === 'stand') { if (k.taps >= k.need) return; T.standing = true; Sfx.noise(0.2, 'lowpass', 300, 0.3); return draw(); }
        if (a === 'sharp') { k.taps++; Sfx.noise(0.06, 'bandpass', 2200 + Math.random() * 800, 0.15); return draw(); }
        if (a === 'sit') { T.standing = false; Sfx.noise(0.15, 'lowpass', 250, 0.3); if (k.taps >= k.need) return finish(); if (k.taps) messUp('You sat down before finishing'); return draw(); }
      });
      const rel = () => { if (T.hold) { T.hold = null; $$('.tk-hold.down', desk).forEach(b => b.classList.remove('down')); } };
      desk.addEventListener('pointerup', rel); desk.addEventListener('pointercancel', rel); desk.addEventListener('pointerleave', rel);
      show(); say('look', true); newTask();
      return {
        update(dt) {
          const ck = $('#t-clock', el); if (ck) ck.textContent = Math.ceil(Math.max(0, R.limit - R.t)) + 's';
          T.left -= dt;
          if (T.left <= 0) {
            if (T.ph === 'write') { T.ph = 'warn'; T.left = Math.max(0.45, 0.95 - T.c * 0.12); Sfx.tone(3300, T.left, 'sawtooth', 0.07, 2500); Sfx.noise(T.left, 'highpass', 5000, 0.18); haptic(80, 0.4); }
            else if (T.ph === 'warn') { T.ph = 'look'; T.left = 1.4 + Math.random() * 1.1 + T.c * 0.35; Sfx.tone(90, 0.3, 'sine', 0.3, 50); say('look'); if (T.standing) { show(); return busted('You were out of your seat.'); } if (T.hold) { show(); return busted(T.hold === 'note' ? 'She caught you passing notes.' : 'She caught you cheating.'); } }
            else { T.ph = 'write'; T.left = (3.2 + Math.random() * 2.8) * (1 - T.c * 0.12); say('write'); Sfx.noise(0.25, 'bandpass', 1800, 0.08); }
            show();
          }
          if (T.hold && T.task && T.ph !== 'look') { const k = T.task; if (T.hold === 'note') { k.held += dt; const m = $('#t-m', desk); if (m) m.style.width = Math.min(100, k.held / k.need * 100) + '%'; if (k.held >= k.need) { k.held = 0; T.hold = null; Sfx.tone(1200, 0.08, 'sine', 0.08); if (++k.step >= k.n) return finish(); draw(); } }
            else if (T.hold === 'peek' && !k.seen) { k.peek += dt; const m = $('#t-m', desk); if (m) m.style.width = Math.min(100, k.peek / 1.1 * 100) + '%'; if (k.peek >= 1.1) { k.seen = true; T.hold = null; draw(); } } }
        },
        isActive: () => T.ph !== 'look' ? false : !!(T.hold || T.standing)
      };
    }
  };
}
