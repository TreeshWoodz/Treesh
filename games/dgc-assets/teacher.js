'use strict';
/* MISS FLORENCE: she watches you do assignments. Get them right. Every mistake makes her more wicked. 5 mistakes and class is over. */
const T_LINES = [
  { idle: ['I\u2019m watching, sweetie! Take your time!', 'You\u2019re doing great!', 'I love watching you learn!'], mess: ['Oopsie! That\u2019s okay!', 'Almost! I believe in you!'], praise: ['Wonderful job!', 'Gold star for you!', 'So proud of you!'] },
  { idle: ['Hmm. Focus.', 'I\u2019m still watching.', 'Don\u2019t look at me. Look at your work.'], mess: ['That\u2019s\u2026 not right.', 'We talked about this.'], praise: ['Fine. Good.', 'Better.'] },
  { idle: ['I SEE every mistake.', 'Your hands are shaking.', 'Faster, sweetie.'], mess: ['Wrong. WRONG.', 'You disappoint me.'], praise: ['\u2026acceptable.', 'Again.'] },
  { idle: ['i can hear your heart', 'look at your paper. LOOK AT IT.', 'one more mistake\u2026'], mess: ['You will stay after class. Forever.'], praise: ['keep working. keep. working.'] },
  { idle: ['i  s e e  y o u', 'LAST. CHANCE.', 'detention never ends'], mess: ['DETENTION NEVER ENDS'], praise: ['m o r e'] }
];
const T_COLORS = [['RED', '#e03131'], ['BLUE', '#1c7ed6'], ['GREEN', '#2f9e44'], ['YELLOW', '#f2b705'], ['PURPLE', '#9c36b5']];
const tR = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const tOpts = (ans, wrong, n) => shuffle([ans, ...shuffle(wrong.filter(w => w !== ans)).slice(0, n - 1)]);
const T_TASKS = [
  ['Math Quiz', c => { let q, a; if (c <= 1) { const x = tR(2, 9), y = tR(2, 9); q = `${x} + ${y} = ?`; a = x + y; } else if (c === 2) { const x = tR(3, 9), y = tR(3, 9); q = `${x} \u00d7 ${y} = ?`; a = x * y; } else { const x = tR(12, 30), y = tR(2, 5), z = tR(2, 4); q = `${x} \u2212 ${y} \u00d7 ${z} = ?`; a = x - y * z; } return { kind: 'choice', q, ans: String(a), opts: tOpts(String(a), [-3, -2, -1, 1, 2, 3, 10].map(d => String(a + d)), c >= 2 ? 4 : 3) }; }],
  ['Spelling Bee', c => { const w = pick([['necessary', 'neccesary', 'necesary'], ['because', 'becuase', 'becaus'], ['friend', 'freind', 'frend'], ['separate', 'seperate', 'separete'], ['library', 'libary', 'liberry'], ['tomorrow', 'tommorow', 'tomorow'], ['scissors', 'sissors', 'scisors']]); return { kind: 'choice', q: 'Tap the word spelled correctly', ans: w[0], opts: shuffle(w.slice()) }; }],
  ['Copy the Board', c => { const w = pick([['CAT', 'SUN', 'BOOK'], ['APPLE', 'CHALK', 'RULER'], ['RECESS', 'LESSON', 'PENCIL'], ['SITSTILL', 'EYESUP'], ['FOREVER', 'STAYHERE']][c]), dec = shuffle([...'BDFGHJKMPQVWXYZ'].filter(x => !w.includes(x))).slice(0, 2 + c); return { kind: 'order', q: 'Copy the word on the board', board: w, items: shuffle([...w].map((ch, i) => ({ id: i, l: ch })).concat(dec.map((ch, i) => ({ id: 'd' + i, l: ch })))), seq: [...w].map((_, i) => i), byLabel: true }; }],
  ['Count the Apples', c => { const n = tR(3, 6 + c * 2), ic = c >= 3 ? 'eye' : 'apple'; return { kind: 'choice', q: c >= 3 ? 'How many eyes are watching you?' : 'How many apples?', vis: `<div class="tk-ic">${Array.from({ length: n }, () => `<i data-lucide="${ic}"></i>`).join('')}</div>`, ans: String(n), opts: tOpts(String(n), [n - 2, n - 1, n + 1, n + 2].map(String), c >= 2 ? 4 : 3) }; }],
  ['Color Test', c => { const [w] = pick(T_COLORS), ink = pick(T_COLORS.filter(x => x[0] !== w)); return { kind: 'choice', q: 'Tap the COLOR of the ink, not the word', vis: `<b class="tk-stroop" style="color:${ink[1]}">${w}</b>`, ans: ink[0], opts: tOpts(ink[0], T_COLORS.map(x => x[0]), c >= 2 ? 4 : 3) }; }],
  ['Alphabet Order', c => { const ls = shuffle([...'ABCDEFGHIJKLMNOPRSTUVW']).slice(0, 4 + Math.min(2, c)); return { kind: 'order', q: 'Tap the letters in ABC order', items: shuffle(ls.map(l => ({ id: l, l }))), seq: ls.slice().sort() }; }],
  ['Number Line', c => { const ns = shuffle(Array.from({ length: 30 }, (_, i) => i + 1)).slice(0, 4 + Math.min(2, c)), desc = c >= 2; return { kind: 'order', q: desc ? 'Tap from BIGGEST to smallest' : 'Tap from smallest to biggest', items: shuffle(ns.map(n => ({ id: n, l: n }))), seq: ns.slice().sort((a, b) => desc ? b - a : a - b) }; }],
  ['Geography', c => { const g = pick([['France', 'Paris', ['London', 'Rome', 'Madrid']], ['Japan', 'Tokyo', ['Seoul', 'Beijing', 'Osaka']], ['Italy', 'Rome', ['Venice', 'Milan', 'Paris']], ['Egypt', 'Cairo', ['Nairobi', 'Lagos', 'Athens']], ['Canada', 'Ottawa', ['Toronto', 'Vancouver', 'Montreal']], ['Kenya', 'Nairobi', ['Cairo', 'Accra', 'Lagos']]]); return { kind: 'choice', q: `Capital of ${g[0]}?`, ans: g[1], opts: tOpts(g[1], g[2], c >= 2 ? 4 : 3) }; }],
  ['Shapes', c => { const s = pick([['triangle', 'triangle'], ['square', 'square'], ['circle', 'circle'], ['star', 'star'], ['hexagon', 'hexagon'], ['heart', 'heart']]), all = ['triangle', 'square', 'circle', 'star', 'hexagon', 'heart']; return { kind: 'choice', q: `Tap the ${s[0].toUpperCase()}`, icons: true, ans: s[1], opts: tOpts(s[1], all, c >= 2 ? 6 : 4) }; }],
  ['Telling Time', c => { const h = tR(1, 9), d = tR(2, 3); return { kind: 'choice', q: `It is ${h}:00. What time is it ${d} hours later?`, ans: `${h + d}:00`, opts: tOpts(`${h + d}:00`, [h + d - 1, h + d + 1, h + d + 2, h - d].filter(x => x > 0).map(x => x + ':00'), c >= 2 ? 4 : 3) }; }],
  ['Odd One Out', c => { const s = pick([[['apple', 'banana', 'grape'], 'carrot'], [['dog', 'cat', 'horse'], 'chair'], [['red', 'blue', 'green'], 'happy'], [['piano', 'guitar', 'drum'], 'spoon'], [['monday', 'friday', 'sunday'], 'april'], [['laugh', 'smile', 'giggle'], 'scream']]); return { kind: 'choice', q: 'Which one doesn\u2019t belong?', ans: s[1], opts: shuffle(s[0].concat(s[1])) }; }],
  ['Memory', c => { const n = 3 + Math.min(3, c), seq = Array.from({ length: n }, () => pick(T_COLORS.slice(0, 4))[0]); return { kind: 'order', memo: seq, q: 'Repeat the colors in order', items: T_COLORS.slice(0, 4).map(([l, h]) => ({ id: l, l, col: h })), seq, repeat: true }; }],
  ['Rhyme Time', c => { const r = pick([['cat', 'hat', ['dog', 'cup', 'sun']], ['moon', 'spoon', ['star', 'night', 'lamp']], ['bed', 'red', ['bad', 'bud', 'sleep']], ['fear', 'near', ['far', 'fire', 'feet']], ['grave', 'wave', ['grove', 'tomb', 'gray']]]); return { kind: 'choice', q: `Which word rhymes with \u201c${r[0]}\u201d?`, ans: r[1], opts: tOpts(r[1], r[2], c >= 2 ? 4 : 3) }; }],
  ['Opposites', c => { const o = pick([['hot', 'cold', ['warm', 'fire', 'sun']], ['up', 'down', ['over', 'high', 'top']], ['happy', 'sad', ['glad', 'funny', 'calm']], ['open', 'closed', ['door', 'wide', 'near']], ['alive', 'dead', ['awake', 'breathing', 'here']], ['day', 'night', ['noon', 'light', 'sun']]]); return { kind: 'choice', q: `Opposite of \u201c${o[0]}\u201d?`, ans: o[1], opts: tOpts(o[1], o[2], c >= 2 ? 4 : 3) }; }],
  ['Fractions', c => { const f = pick([['1/2', ['1/3', '1/4', '1/8']], ['3/4', ['1/2', '1/4', '2/3']], ['2/3', ['1/2', '1/3', '1/4']], ['5/6', ['3/4', '2/3', '1/2']]]); return { kind: 'choice', q: 'Which fraction is the BIGGEST?', ans: f[0], opts: tOpts(f[0], f[1], c >= 2 ? 4 : 3) }; }],
  ['Raise Your Hand', c => ({ kind: 'hold', q: 'Raise your hand and KEEP it up until the bar fills', need: 1.8 + c * 0.5 })],
  ['Sharpen Your Pencil', c => ({ kind: 'taps', q: 'Sharpen! Tap fast before time runs out', n: 10 + c * 3 })],
  ['Clean the Board', c => ({ kind: 'smudge', q: 'Wipe every smudge off the board', n: 6 + c * 2 })],
  ['Science', c => { const s = pick([['What do plants need to grow?', 'sunlight', ['candy', 'darkness', 'noise']], ['What planet do we live on?', 'Earth', ['Mars', 'Venus', 'Pluto']], ['Water freezes into\u2026', 'ice', ['steam', 'sand', 'glass']], ['What do lungs do?', 'breathe', ['digest', 'see', 'think']], ['What pumps your blood?', 'heart', ['liver', 'brain', 'lungs']]]); return { kind: 'choice', q: s[0], ans: s[1], opts: tOpts(s[1], s[2], c >= 2 ? 4 : 3) }; }],
  ['Animal Sounds', c => { const a = pick([['cow', 'moo', ['oink', 'woof', 'quack']], ['dog', 'woof', ['meow', 'moo', 'baa']], ['duck', 'quack', ['hiss', 'moo', 'neigh']], ['snake', 'hiss', ['roar', 'tweet', 'oink']], ['owl', 'hoot', ['bark', 'moo', 'baa']]]); return { kind: 'choice', q: `What does a ${a[0]} say?`, ans: a[1], opts: tOpts(a[1], a[2], c >= 2 ? 4 : 3) }; }],
  ['Grammar', c => { const g = pick([['She ___ to school.', 'goes', ['go', 'going', 'gone']], ['They ___ happy.', 'are', ['is', 'am', 'be']], ['I ___ a cat.', 'have', ['has', 'having', 'haves']], ['We ___ never leave.', 'will', ['wills', 'was', 'be']]]); return { kind: 'choice', q: `Fill the blank: ${g[0]}`, ans: g[1], opts: tOpts(g[1], g[2], c >= 2 ? 4 : 3) }; }],
  ['Patterns', c => { const p = c >= 2 ? pick([['1, 1, 2, 3, 5, ?', '8'], ['2, 4, 8, 16, ?', '32'], ['1, 4, 9, 16, ?', '25']]) : pick([['2, 4, 6, ?', '8'], ['5, 10, 15, ?', '20'], ['1, 3, 5, ?', '7']]); return { kind: 'choice', q: `What comes next? ${p[0]}`, ans: p[1], opts: tOpts(p[1], [+p[1] - 2, +p[1] + 1, +p[1] + 2, +p[1] - 1].map(String), c >= 2 ? 4 : 3) }; }],
  ['Sit Still', c => ({ kind: 'still', q: 'Hands off. Don\u2019t touch ANYTHING. She\u2019s watching.', dur: 2.5 + c * 0.6 })],
  ['Manners', c => { const m = pick([['How do you ask to leave?', 'May I please be excused?', ['Bye.', 'I\u2019m leaving.', 'Let me out!']], ['Miss Florence hands you a paper. You say\u2026', 'Thank you, Miss Florence.', ['Ew.', 'Whatever.', 'Why?']], ['You\u2019re late. You say\u2026', 'I\u2019m sorry, Miss Florence.', ['So?', 'Not my fault.', 'Don\u2019t look at me.']]]); return { kind: 'choice', q: m[0], ans: m[1], opts: shuffle([m[1], ...m[2]]) }; }]
];

const T_CHALK = [['Eyes on your paper', 'Sit up straight', 'Neatness counts', 'No talking'], ['Do NOT look away', 'I see everything', 'Mistakes are noted'], ['Stay after class', 'You will learn', 'Hands where I can see'], ['I CAN HEAR YOUR HEART', 'NO ONE LEAVES', 'LOOK AT ME'], ['FOREVER', 'DETENTION NEVER ENDS', 'MINE']];
const T_FRAMES = ['teacher_f0', 'teacher_f1', 'teacher_f2', 'teacher_f3', 'teacher_f4', 'teacher_b0', 'teacher_bw0', 'teacher_p0', 'teacher_b2', 'teacher_bw2', 'teacher_p2', 'teacher_b4', 'teacher_bw4', 'teacher_p4'];
const tBk = c => c <= 1 ? 0 : c <= 3 ? 2 : 4;
const T_MARK = { ok: '<svg viewBox="0 0 60 60" class="tk-mark ok"><path d="M10 32 L25 46 L52 12"/></svg>', no: '<svg viewBox="0 0 60 60" class="tk-mark no"><path d="M12 12 L48 48 M48 12 L12 48"/></svg>', ring: '<svg viewBox="0 0 100 50" class="tk-ring" preserveAspectRatio="none"><path d="M8 25 C 8 6, 92 4, 93 24 C 94 44, 10 47, 9 27"/></svg>' };

function teacherMini() {
  return {
    id: 'teacher', name: 'Detention', room: 'teacher_f0', icon: 'graduation-cap', noBtn: true, noKiller: true, view: 'teacher', endReason: 'teacher_time',
    labels: { look: 'Miss Florence is watching' },
    hint: 'Miss Florence is SO happy to have you in class! Do every assignment. While she writes on the board, she can\u2019t see your mistakes. When she turns around, every mistake counts, and she watches the clock. Five strikes and class is over.',
    limit: () => 600,
    mount(el, ctx) {
      const T = { fails: 0, c: 0, done: 0, need: Math.min(12, 6 + ctx.night), task: null, left: 0, used: [], hold: 0, holding: false, idleT: 5, ph: 'write', phT: 4, wT: 0.4, wf: 0, fakeAt: -1, line: '', lineN: 0, fresh: false, busy: false };
      if (ctx.night === 1) Sfx.speak('teacher_l0', 'teacher');
      el.innerHTML = `<div class="mg mg-teach"><div class="tc" id="tc" data-c="0" data-testid="teacher-room">
        <div class="os-bar tc-bar"><span class="tc-pill" id="t-ph" data-testid="teacher-phase"><i data-lucide="pencil"></i>Writing</span><span class="tc-mood" data-testid="teacher-mood">Mood: <b id="t-mood">Bubbly</b></span><span class="tc-strikes" id="t-strikes" data-testid="teacher-strikes"></span><span id="t-done" data-testid="teacher-done">0/${T.need}</span><button class="os-pause" data-act="pause" data-testid="teacher-pause-btn" aria-label="Pause"><i data-lucide="pause"></i></button></div>
        <section class="tc-scene" id="tsc" data-ph="write" data-testid="teacher-scene"><i class="ts-fill" id="ts-fill"></i>
          <div class="ts-box" id="ts-box">${T_FRAMES.map(n => `<img class="ts" data-n="${n}" src="${img(n)}" alt="">`).join('')}<div class="ts-chalk" id="ts-chalk" data-testid="teacher-chalk"></div><i class="ts-dust"></i><i class="ts-rain"></i></div>
          <i class="ts-light"></i><div class="ts-clock" data-testid="teacher-clock"><i class="h"></i><i class="m"></i><i class="s"></i></div>
          <b class="tc-scr" id="t-scr">She\u2019s turning</b><em class="tc-say" id="t-say" data-testid="teacher-say"></em></section>
        <section class="tc-desk" id="desk" data-testid="teacher-desk"></section></div></div>`;
      const tc = $('#tc', el), sc = $('#tsc', el), desk = $('#desk', el), chalk = $('#ts-chalk', el), MOODS = ['Bubbly', 'Stern', 'Unsettling', 'Wicked', 'Demonic'];
      const frame = n => { $$('.ts', sc).forEach(im => im.classList.toggle('on', im.dataset.n === n)); $('#ts-fill', el).style.backgroundImage = `url(${img(n)})`; sc.dataset.f = n; };
      const curFrame = () => { const b = tBk(T.c); return T.ph === 'look' ? 'teacher_f' + T.c : T.ph === 'write' ? `teacher_${T.wf ? 'bw' : 'b'}${b}` : 'teacher_p' + b; };
      const pill = () => { const p = $('#t-ph', el), m = { write: ['pencil', 'Writing', ''], peek: ['eye', 'Peeking!', 'warn'], warn: ['alert-triangle', 'Turning!', 'warn'], look: ['eye', 'Watching', 'look'] }[T.ph]; p.className = 'tc-pill ' + m[2]; p.innerHTML = `<i data-lucide="${m[0]}"></i>${m[1]}`; icons(); };
      const setPh = (ph, dur) => { T.ph = ph; T.phT = dur; sc.dataset.ph = ph; pill(); frame(curFrame()); };
      const startWrite = () => { T.line = pick(T_CHALK[T.c]); T.lineN = 0; chalk.innerHTML = ''; chalk.classList.remove('wipe'); void chalk.offsetWidth; chalk.classList.add('wipe'); const d = Math.max(2.6, 5.6 - T.c * 0.5) + Math.random() * 2; T.fakeAt = Math.random() < 0.35 + T.c * 0.1 ? d * (0.3 + Math.random() * 0.4) : -1; setPh('write', d); };
      const say = k => { const b = $('#t-say', el); b.textContent = pick(T_LINES[T.c][k]); b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); };
      const strikes = () => { $('#t-strikes', el).innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < T.fails ? 'x' : ''}"></i>`).join(''); };
      const xform = (to, then) => {
        const from = curFrame(); T.busy = true; tc.classList.remove('xform'); void tc.offsetWidth; tc.classList.add('xform');
        [[0, 'teacher_f' + to], [140, from], [260, 'teacher_f' + to], [400, from], [520, 'teacher_f' + to]].forEach(([ms, n]) => setTimeout(() => frame(n), ms));
        Sfx.tone(70, 1.1, 'sawtooth', 0.2, 35); Sfx.noise(0.7, 'lowpass', 400, 0.35); if (to >= 3) Sfx.noise(0.5, 'bandpass', 1800, 0.2, 2, 0.3); shake(3); haptic([80, 40, 160], 0.8);
        setTimeout(() => { tc.classList.remove('xform'); T.busy = false; then && then(); }, 1300);
      };
      const next = () => {
        const pool = T_TASKS.map((_, i) => i).filter(i => !T.used.includes(i)); if (!pool.length) T.used = [];
        const i = pick(pool.length ? pool : T_TASKS.map((_, j) => j)); T.used.push(i);
        const k = T_TASKS[i][1](T.c); k.name = T_TASKS[i][0]; k.idx = i; k.pos = 0; k.taps = 0; k.memoLeft = k.memo ? 1.4 + k.memo.length * 0.45 : 0; k.gone = [];
        T.task = k; T.hold = 0; T.holding = false; T.total = T.left = (k.kind === 'still' ? k.dur : Math.max(6, 14 - T.c * 1.8)) + k.memoLeft; T.fresh = true; draw(); Sfx.noise(0.18, 'bandpass', 1200, 0.08);
      };
      const fail = (why, force) => {
        if (!T.task) return;
        if (!force && T.ph === 'write') { T.task = null; Sfx.noise(0.25, 'highpass', 2600, 0.1); Sfx.tone(520, 0.12, 'sine', 0.05, 660); desk.innerHTML = `<div class="tk-phew" data-testid="teacher-unseen"><i data-lucide="eraser"></i><b>Phew. She didn\u2019t see that.</b><small>Erase it. Try another.</small></div>`; icons(); return setTimeout(() => R && !R.done && next(), 1000); }
        T.task = null; T.fails++; strikes(); Sfx.tone(200, 0.4, 'triangle', 0.18, 120); haptic(200, 0.7); shake(2);
        desk.innerHTML = `<div class="tk-fail" data-testid="teacher-fail">${T_MARK.no}<span>${esc(why)}</span></div>`;
        if (T.fails >= 5) { T.c = 4; tc.dataset.c = 4; T.ph = 'look'; sc.dataset.ph = 'look'; pill(); Sfx.speak('teacher_l4', 'teacher', true); toast('Class dismissed', why, 'bad'); return xform(4, () => { if (!R || R.done) return; caught('teacher'); if (R && !R.done) { T.fails = 4; strikes(); next(); } }); }
        const to = T.fails; T.ph = 'look'; sc.dataset.ph = 'look'; pill(); toast('Wrong!', why, 'bad');
        xform(to, () => { T.c = to; tc.dataset.c = T.c; $('#t-mood', el).textContent = MOODS[T.c]; say('mess'); setPh('look', 2.4 + T.c * 0.3); if (R && !R.done) next(); });
      };
      const ok = () => {
        T.task = null; T.done++; $('#t-done', el).textContent = `${T.done}/${T.need}`; Sfx.chime([880, 1175]); Sfx.noise(0.2, 'bandpass', 3000, 0.08); if (T.ph === 'look') say('praise'); ctx.set(T.done / T.need * 100);
        desk.innerHTML = `<div class="tk-ok" data-testid="teacher-correct">${T_MARK.ok}<span>Correct!</span><i class="tk-star" data-lucide="star"></i></div>`; icons();
        if (T.done >= T.need) { if (!T.fails) unlock('teacher1'); if (T.fails >= 4) unlock('teacher_demon'); return; }
        setTimeout(() => R && !R.done && next(), 900);
      };
      const deskHtml = k => {
        const head = `<div class="tk-h"><b data-testid="teacher-task-name">${k.name}</b><div class="meter"><i id="t-tm"></i></div></div><div class="tk-q" data-testid="teacher-question">${esc(k.q)}</div>`;
        if (k.kind === 'choice') return head + (k.vis || '') + `<div class="tk-opts ${k.icons ? 'icons' : ''}">${k.opts.map((o, i) => `<button data-t="ans" data-v="${esc(o)}" data-testid="teacher-ans-${i}" aria-label="${esc(o)}">${k.icons ? `<i data-lucide="${o}"></i>` : esc(o)}</button>`).join('')}</div>`;
        if (k.kind === 'order') {
          if (k.memoLeft > 0) return head + `<div class="tk-memo" data-testid="teacher-memo">${k.memo.map(l => `<i style="background:${T_COLORS.find(x => x[0] === l)[1]}">${l}</i>`).join('')}</div><small class="tk-sm">Memorize\u2026</small>`;
          return head + (k.board ? `<div class="tk-board" data-testid="teacher-board-word">${[...k.board].map((ch, i) => `<i class="${i < k.pos ? 'ok' : ''}">${ch}</i>`).join('')}</div>` : `<small class="tk-sm">${k.pos}/${k.seq.length}</small>`) + `<div class="tk-tiles">${k.items.map(it => k.gone.includes(it.id) && !k.repeat ? '' : `<button data-t="ord" data-v="${it.id}" data-testid="teacher-tile-${it.id}" ${it.col ? `style="background:${it.col};color:#fff"` : ''}>${it.l}</button>`).join('')}</div>`;
        }
        if (k.kind === 'hold') return head + `<div class="meter big"><i id="t-hm"></i></div><button class="tk-hold" data-t="hold" data-testid="teacher-hold-btn"><i data-lucide="hand"></i>Hold to raise your hand</button>`;
        if (k.kind === 'taps') return head + `<div class="meter big"><i style="width:${k.taps / k.n * 100}%"></i></div><button class="tk-big" data-t="tap" data-testid="teacher-tap-btn"><i data-lucide="pencil"></i>Sharpen (${k.taps}/${k.n})</button>`;
        if (k.kind === 'smudge') { if (!k.spots) k.spots = Array.from({ length: k.n }, (_, i) => ({ i, x: tR(6, 88), y: tR(8, 80) })); return head + `<div class="tk-chalk" data-testid="teacher-chalkboard">${k.spots.filter(s => !k.gone.includes(s.i)).map(s => `<button class="smudge" style="left:${s.x}%;top:${s.y}%" data-t="wipe" data-v="${s.i}" data-testid="teacher-smudge-${s.i}" aria-label="Smudge"></button>`).join('')}</div>`; }
        if (k.kind === 'still') return head + `<div class="tk-still" data-testid="teacher-still"><i data-lucide="hand"></i>Don\u2019t touch the screen\u2026</div>`;
        return head;
      };
      const draw = () => { if (!T.task) return; desk.innerHTML = `<div class="tk-sheet ${T.fresh ? 'in' : ''}" data-testid="teacher-sheet">${deskHtml(T.task)}</div>`; T.fresh = false; icons(); };
      const scribble = t => { t.insertAdjacentHTML('beforeend', T_MARK.ring); Sfx.noise(0.14, 'bandpass', 2400, 0.1, 3); };
      desk.addEventListener('pointerdown', e => {
        const k = T.task; if (!k || T.busy) return; const t = e.target.closest('[data-t]');
        if (k.kind === 'still') { e.preventDefault(); return fail('I said DON\u2019T. TOUCH.', true); }
        if (!t) return; e.preventDefault(); const a = t.dataset.t, v = t.dataset.v; Sfx.click();
        if (a === 'ans') { scribble(t); desk.style.pointerEvents = 'none'; return setTimeout(() => { desk.style.pointerEvents = ''; if (T.task !== k) return; v === k.ans ? ok() : fail(`\u201c${v}\u201d? No, sweetie.`); }, 280); }
        if (a === 'ord') { const want = k.seq[k.pos], it = k.items.find(x => String(x.id) === v), good = k.byLabel ? it && it.l === k.board[k.pos] : String(want) === v; if (!good) return fail('Wrong order.'); k.pos++; if (!k.repeat) k.gone.push(it.id); Sfx.tone(600 + k.pos * 60, 0.06, 'square', 0.06); if (k.pos >= k.seq.length) return ok(); return draw(); }
        if (a === 'hold') { T.holding = true; t.classList.add('down'); return; }
        if (a === 'tap') { k.taps++; Sfx.noise(0.05, 'bandpass', 2200 + Math.random() * 800, 0.14); if (k.taps >= k.n) return ok(); return draw(); }
        if (a === 'wipe') { k.gone.push(+v); Sfx.noise(0.08, 'highpass', 3000, 0.12); if (k.gone.length >= k.n) return ok(); return draw(); }
      });
      const rel = () => { if (T.holding && T.task && T.task.kind === 'hold') { T.holding = false; if (T.hold < T.task.need) fail('You put your hand down. Rude.'); } };
      desk.addEventListener('pointerup', rel); desk.addEventListener('pointercancel', rel);
      strikes(); startWrite(); next();
      return {
        update(dt) {
          const k = T.task;
          if (!T.busy) {
            T.phT -= dt;
            if (T.ph === 'write') {
              T.wT -= dt; if (T.wT <= 0) { T.wT = 0.3 + Math.random() * 0.25; T.wf ^= 1; frame(curFrame()); if (T.lineN < T.line.length) { T.lineN = Math.min(T.line.length, T.lineN + 2); chalk.innerHTML = esc(T.line.slice(0, T.lineN)) + '<i class="ts-tip"></i>'; Sfx.noise(0.07, 'bandpass', 3200 + Math.random() * 1400, 0.05, 6); } }
              if (T.fakeAt > 0 && T.phT <= T.fakeAt) { T.fakeAt = -1; T.back = T.phT; setPh('peek', 0.5 + Math.random() * 0.25); Sfx.tone(1200, 0.12, 'sine', 0.06); Sfx.whisper(0.05); if (T.c >= 2) shake(1); }
              else if (T.phT <= 0) { setPh('warn', Math.max(0.45, 0.85 - T.c * 0.08)); Sfx.tone(300, 0.25, 'triangle', 0.08, 180); Sfx.noise(0.2, 'lowpass', 500, 0.15); }
            } else if (T.ph === 'peek' && T.phT <= 0) { T.ph = 'write'; sc.dataset.ph = 'write'; T.phT = T.back; pill(); frame(curFrame()); }
            else if (T.ph === 'warn' && T.phT <= 0) { setPh('look', 2.4 + T.c * 0.3 + Math.random()); say('idle'); Sfx.thump(0.4); if (T.c >= 3) { sc.classList.remove('lean'); void sc.offsetWidth; sc.classList.add('lean'); Sfx.whisper(0.06); } }
            else if (T.ph === 'look' && T.phT <= 0) startWrite();
          }
          if (!k) return;
          if (k.memoLeft > 0) { k.memoLeft -= dt; if (k.memoLeft <= 0) draw(); }
          if (k.kind === 'hold' && T.holding) { T.hold += dt; const m = $('#t-hm', desk); if (m) m.style.width = Math.min(100, T.hold / k.need * 100) + '%'; if (T.hold >= k.need) { T.holding = false; return ok(); } }
          T.left -= dt * (T.ph === 'look' ? 1.5 : 1); const bar = $('#t-tm', desk); if (bar) bar.style.width = clamp(T.left / T.total, 0, 1) * 100 + '%';
          if (T.left <= 0) { if (k.kind === 'still') return ok(); fail('Too slow, sweetie.', true); }
        },
        isActive: () => false
      };
    }
  };
}
