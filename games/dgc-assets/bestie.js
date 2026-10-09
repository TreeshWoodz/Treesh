'use strict';
/* BESTIE: fullscreen phone OS + FaceTime group call. Do what he texts. 12 requests or someone dies. Maybe you. */
const SQUAD = ['Jamal', 'Priya', 'Marcus', 'Lena', 'Mei', 'Mateo', 'Amara', 'Noor'];
const B_TWISTS = [['flip', 'Upside Down', 'Your phone is upside down now. Bestie thinks that\u2019s hilarious.'], ['mirror', 'Mirror World', 'Everything is backwards. Like your loyalty.'],
  ['dark', 'Lights Out', 'Pitch black. Your finger is the flashlight.'], ['drift', 'Restless Apps', 'The apps won\u2019t sit still.'], ['melt', 'Meltdown', 'Your screen is melting. Bestie did that.']];
const B_APPS = [['msgs', 'Messages', 'message-circle', '#30b85a'], ['phone', 'Phone', 'phone', '#30b85a'], ['snap', 'Snapgram', 'camera', '#d6336c'], ['set', 'Settings', 'settings', '#6c6c78'], ['cam', 'Camera', 'aperture', '#2b2b33'], ['pad', 'Keypad', 'grid-3x3', '#2f6fd0'],
  ['music', 'Music', 'music', '#e8590c'], ['maps', 'Maps', 'map-pin', '#2b8a3e'], ['photos', 'Photos', 'image', '#f59f00'], ['contacts', 'Contacts', 'contact', '#5c5f66'], ['wallet', 'Wallet', 'wallet', '#1f1f2a'], ['notes', 'Notes', 'sticky-note', '#e0a800']];
const FK = B_APPS.length;
const B_PHRASES = ['ur my favorite person', 'i would never ignore u', 'bestie 4 life', 'i love the group chat', 'u r so normal'];
const B_YAY = ['yayyy ily', 'see? was that so hard', 'ur the best bestie', 'good. very good.', 'omg ur so obedient i mean sweet'];
const B_TYPES = ['reply', 'call', 'like', 'loc', 'dnd', 'code', 'selfie', 'wall', 'find', 'story', 'block', 'voice', 'poll', 'faceid', 'power', 'music', 'maps', 'photos', 'contacts', 'wallet', 'notes'];
const B_FORMS = [['a toaster', 'microwave'], ['a cat', 'cat'], ['a raven', 'bird'], ['your lamp', 'lamp'], ['a teddy bear', 'smile'], ['a ghost', 'ghost'], ['your mirror', 'scan-face'], ['a spider', 'bug'], ['the moon', 'moon'], ['a houseplant', 'sprout'], ['your armchair', 'armchair'], ['the clock on your wall', 'clock']];
const B_MISS = { msgs: 'Mesages', phone: 'Phnoe', snap: 'Snapgrm', set: 'Setings', cam: 'Camra', pad: 'Keypd', music: 'Musik', maps: 'Mapz', photos: 'Fotos', contacts: 'Contcts', wallet: 'Walet', notes: 'Nots' };
const B_KILLS = [['shatter', 'turned to glass and shattered'], ['melt', 'melted right off the screen'], ['erase', 'got deleted from reality'], ['object', 'became a %s and broke'],
  ['crush', 'was crushed by their own screen'], ['void', 'got sucked into the void'], ['burn', 'burst into flames'], ['hand', 'was dragged into the dark']];
const B_OBJ = [['toaster', 'microwave'], ['teddy bear', 'smile'], ['houseplant', 'sprout'], ['lamp', 'lamp'], ['clock', 'clock'], ['mug', 'coffee']];
const B_EYES = [[0.43, 0.309], [0.592, 0.309]];
const F_PLEAD = ['pls just do it', 'hurry PLEASE', 'i dont want to die', 'do what he says!!', 'ur doing great keep going', 'dont mess this up', 'why is he like this'];
const F_BEG = ['NOT ME', 'please please please', 'pick someone else', 'i have a family', 'this isnt funny anymore'];
const F_GRIEF = ['oh my god', 'hes actually doing it', 'i cant look', 'we need to get off this call', 'they were right there'];
const SONGS = [['bestie & me (forever)', 1], ['you belong with me', 0], ['running up that hill', 0], ['somebody that i used to know', 0]];
const NOTES = [['bestie is perfect', 1], ['get off this call', 0], ['call the police', 0]];
const RENAMES = [['My Everything', 1], ['Stalker', 0], ['Do Not Answer', 0]];
const PINS = [['home', 'Your house', 22, 70], ['school', 'School', 70, 28], ['bestie', 'Bestie\u2019s house', 64, 72], ['woods', 'The woods', 30, 24]];
const AMB = [
  [['f1', 'is anyone else\u2019s room getting colder'], ['f2', 'yeah my breath is fogging'], ['b', 'that\u2019s just me hugging u all :)']],
  [['f1', 'can we just hang up'], ['b', 'no one hangs up. ever.'], ['f2', 'ok ok']],
  [['f1', 'my mom keeps calling and the phone won\u2019t let me answer'], ['b', 'i\u2019m ur mom now']],
  [['f1', 'remember when we used to play mario kart'], ['f2', 'that was fun'], ['b', 'i remember everything u ever did']],
  [['f1', '{f2} ur camera is glitching'], ['f2', 'no its not?? why do u look like that'], ['b', 'hehe']],
  [['b', 'who wants to see a magic trick'], ['f1', 'NO'], ['f2', 'please no more magic']],
  [['f1', 'i can hear breathing on my end'], ['b', 'it\u2019s not breathing. it\u2019s laughing']],
  [['f1', 'did anyone else get a text from my number'], ['f2', 'yes it said "help"'], ['f1', 'i didn\u2019t send that']],
  [['b', 'favorite color? mine is u'], ['f1', 'that\u2019s not a color'], ['b', 'it is now']],
  [['f1', 'ok be honest. is bestie even a real person'], ['b', 'i\u2019m whatever i want to be, {f1}']],
  [['f1', 'my door just locked by itself'], ['f2', 'same'], ['b', 'safety first besties']],
  [['f1', 'i miss {dead}'], ['f2', 'don\u2019t say their name'], ['b', 'say it again. i dare u.']],
  [['f1', 'why does the call say 99 participants'], ['b', 'counting is hard :)']],
  [['f2', 'the lights in my house keep flickering'], ['f1', 'mine too'], ['b', 'i\u2019m just saying hi']],
];
const CAPS = [['i love my bestie', 1], ['having fun w friends', 0], ['help me', 0]];

function bestieMini() {
  return {
    id: 'bestie', name: 'The Group Call', room: 'bestie_art', icon: 'smartphone', noBtn: true, noKiller: true, view: 'bestie', endReason: 'bestie',
    labels: { look: 'Bestie is typing\u2026' },
    get hint() { return (S.bpace === 'chill' ? 'CHILL PACE: Bestie takes his time. Read the group chat, watch your friends, and be ready when he finally asks for something. ' : '') + 'You\u2019re on a FaceTime call with Bestie and your 8 friends. Do what he texts, fast. Finish 12 requests before time runs out. Every request you miss, he picks someone to kill. It could be you.'; },
    limit: n => S.bpace === 'chill' ? Math.max(260, 320 - n * 10) : Math.max(110, 165 - n * 8),
    mount(el, ctx) {
      const P = { scr: 'home', prev: [], loc: false, dnd: false, power: false, wall: 'sunset', pad: '', chat: [], unread: 0, req: null, done: 0, alive: SQUAD.slice(), blocked: [], twist: null, twLeft: 0, form: null,
        order: B_APPS.map((_, i) => i), call: null, rec: null, face: null, cap: false, locked: false, poll: null, wait: S.bpace === 'chill' ? 7 : 1.6, last: '', busy: false, cracks: [], side: null, sideT: 14, scareT: S.bpace === 'chill' ? 40 : 16, jealous: 0, chill: S.bpace === 'chill', bnOff: null, bname: 'Bestie', photos: [], notes: shuffle(NOTES.slice()), pinned: null, song: null, amb: [], ambT: 4, lastDead: '' };
      if (P.chill) P.scr = 'msgs';
      const NEED = 12, stage = () => Math.round((SQUAD.length - P.alive.length) * 5 / SQUAD.length), face = () => img(stage() ? 'bestie_face_r' + stage() : 'bestie_face');
      const say = (from, t, who) => { P.chat.push({ from, t, who }); if (P.chat.length > 40) P.chat.shift(); if (from !== 'me' && P.scr !== 'msgs') P.unread++; };
      const tile = (n, i) => `<div class="ft-t" data-n="${n}" data-testid="ft-tile-${n.toLowerCase()}"><div class="ft-im" style="background-image:url(${img('bf_' + n.toLowerCase())})"></div><em class="ft-say"></em><small><i data-lucide="mic"></i>${n}</small></div>`;
      el.innerHTML = `<div class="mg mg-bestie"><div class="bos" id="bos" data-testid="bestie-os">
        <div class="os-bar"><span id="b-clock" data-testid="bestie-clock"></span><span class="ft-pill"><i data-lucide="video"></i>FaceTime \u00b7 <b data-testid="bestie-alive">${SQUAD.length + 2}</b></span><span class="sq" data-testid="bestie-squad">${SQUAD.map(n => `<i title="${n}" data-n="${n}">${n[0]}</i>`).join('')}</span><span class="batt" id="b-batt" data-testid="bestie-battery"><i data-lucide="battery-full"></i><b>87%</b></span><span data-testid="bestie-done" id="b-done">0/${NEED}</span><button class="os-pause" data-act="pause" data-testid="bestie-pause-btn" aria-label="Pause"><i data-lucide="pause"></i></button></div>
        <section class="ft" id="ft" data-testid="bestie-facetime"><div class="ft-t ft-b" data-n="bestie" data-testid="ft-tile-bestie"><div class="b-wrap" id="b-wrap">${[0, 1, 2, 3, 4, 5].map(s => `<img class="b-st ${s ? '' : 'on'}" src="${img(s ? 'bestie_r' + s : 'bestie_art')}" alt="" data-s="${s}">`).join('')}<i class="b-eye"></i><i class="b-eye"></i></div><b class="b-off">camera off</b><em class="b-form" id="b-form" hidden></em><small><i data-lucide="crown"></i>BESTIE</small>
          <div class="ft-me" data-n="you" data-testid="ft-tile-you">${playerAvatar()}<small>You</small></div></div>${SQUAD.map(tile).join('')}<div class="ft-drop" data-testid="bestie-reconnecting"><i data-lucide="loader"></i>Reconnecting\u2026</div></section>
        <div class="ph-wrap"><div class="phone" id="ph" data-testid="bestie-phone"></div><div class="crk" id="crk"></div></div></div></div>`;
      const ph = $('#ph', el), bos = $('#bos', el), ft = $('#ft', el), bt = $('.ft-b', ft), ftile = n => $(`.ft-t[data-n="${n}"]`, ft), anyAlive = () => pick(P.alive);
      const fitB = () => { const W = bt.clientWidth, H = bt.clientHeight, s = Math.max(W / 768, H / 1376), w = $('#b-wrap', bt); Object.assign(w.style, { width: 768 * s + 'px', height: 1376 * s + 'px', left: (W - 768 * s) / 2 + 'px', top: (H - 1376 * s) * 0.22 + 'px' }); };
      $$('.b-eye', bt).forEach((e, i) => { e.style.left = B_EYES[i][0] * 100 + '%'; e.style.top = B_EYES[i][1] * 100 + '%'; });
      const ro = new ResizeObserver(fitB); ro.observe(bt); fitB();
      const fsay = (n, t) => {
        if (!n) return; say('f', t, n); const tl = ftile(n); if (!tl) return; const b = $('.ft-say', tl); b.textContent = t; tl.classList.remove('talk'); void tl.offsetWidth; tl.classList.add('talk');
        clearTimeout(tl._st); tl._st = setTimeout(() => tl.classList.remove('talk'), 2200);
      };
      const setRage = () => {
        const s = stage(), dead = SQUAD.length - P.alive.length; bt.style.setProperty('--rage', (dead * 6 / SQUAD.length).toFixed(2)); bt.classList.toggle('max', dead >= SQUAD.length);
        $$('.b-st', bt).forEach(i => i.classList.toggle('on', +i.dataset.s === s)); bos.style.setProperty('--bface', `url(${face()})`);
        $('#crk', el).innerHTML = P.cracks.length ? `<svg viewBox="0 0 100 100" preserveAspectRatio="none">${P.cracks.join('')}</svg>` : '';
        $('[data-testid="bestie-alive"]', el).textContent = P.alive.length + 2;
      };
      const addCrack = () => {
        const cx = 15 + Math.random() * 70, cy = 15 + Math.random() * 70; let d = '';
        for (let k = 0; k < 9; k++) { let a = Math.PI * 2 * k / 9 + Math.random() * 0.5, x = cx, y = cy, L = 12 + Math.random() * 30; d += `M${cx} ${cy}`; for (let j = 0; j < 4; j++) { a += (Math.random() - 0.5) * 0.7; x += Math.cos(a) * L / 4; y += Math.sin(a) * L / 4; d += `L${x.toFixed(1)} ${y.toFixed(1)}`; } }
        const ring = Array.from({ length: 7 }, (_, k) => { const a = Math.PI * 2 * k / 7, r = 4 + Math.random() * 3; return `${(cx + Math.cos(a) * r).toFixed(1)} ${(cy + Math.sin(a) * r).toFixed(1)}`; });
        P.cracks.push(`<path d="${d}" /><path d="M${ring.join('L')}Z" />`);
      };
      const setBatt = () => { const b = $('#b-batt', el), low = P.req && P.req.type === 'power'; b.classList.toggle('low', !!low); $('b', b).textContent = low ? '1%' : P.power ? '87% \u00b7 low power' : '87%'; };
      const killTile = (t, method, obj) => {
        t.classList.add('dying', 'k-' + method); const im = $('.ft-im,.pav', t), bg = im && im.style.backgroundImage, fx = document.createElement('div'); fx.className = 'kfx'; fx.dataset.testid = 'bestie-kill-fx';
        if (method === 'shatter') fx.innerHTML = Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2, x = 50 + Math.cos(a) * 70, y = 50 + Math.sin(a) * 70, b2 = (i + 1) / 9 * Math.PI * 2; return `<i class="shard" style="background-image:${bg || 'none'};clip-path:polygon(50% 50%,${x}% ${y}%,${50 + Math.cos(b2) * 70}% ${50 + Math.sin(b2) * 70}%);--tx:${(Math.cos(a + 0.35) * 140).toFixed(0)}%;--ty:${(Math.sin(a + 0.35) * 140 + 60).toFixed(0)}%;--r:${(Math.random() * 300 - 150).toFixed(0)}deg"></i>`; }).join('');
        if (method === 'object') fx.innerHTML = `<span class="kobj"><i data-lucide="${obj[1]}"></i></span>`;
        if (method === 'hand') fx.innerHTML = `<i class="khand" style="background-image:url(${img('bestie_hand')})"></i>`;
        if (method === 'burn') fx.innerHTML = '<i class="kfire"></i><i class="kfire f2"></i>';
        if (method === 'void') fx.innerHTML = '<i class="kvoid"></i>';
        if (method === 'erase') fx.innerHTML = '<i class="kstatic"></i><b class="klost">CONNECTION LOST</b>';
        fx.insertAdjacentHTML('beforeend', `<i class="kblood" style="background-image:url(${img('bestie_blood')})"></i><b class="kdc">DISCONNECTED</b>`);
        t.appendChild(fx); icons(); bt.classList.add('casting'); Sfx.tone(90, 0.8, 'sawtooth', 0.15, 40); Sfx.tone(300, 0.6, 'sine', 0.1, 1400);
        setTimeout(() => { t.classList.add('hit'); Sfx.scream(); Sfx.noise(0.35, 'lowpass', 600, 0.4); if (method === 'shatter') Sfx.noise(0.5, 'highpass', 4000, 0.3); shake(3); haptic(400, 1); }, 650);
        setTimeout(() => bt.classList.remove('casting'), 1400);
      };
      const roulette = then => {
        const pool = P.alive.concat('you'), tiles = pool.map(n => $(`[data-n="${n}"]`, ft)), pickI = Math.floor(Math.random() * pool.length);
        let hop = 0; const hops = pool.length * Math.max(2, Math.ceil(12 / pool.length)) + pickI;
        say('b', pick(['eeny\u2026 meeny\u2026 miny\u2026', 'hmm who should i pick\u2026', 'let\u2019s play a game :)', 'one of u has to go. sorry not sorry'])); fsay(anyAlive(), pick(F_BEG)); draw();
        const step = () => {
          tiles.forEach(t => t.classList.remove('pick')); const t = tiles[hop % pool.length]; t.classList.add('pick'); Sfx.tick(); haptic(15, 0.2);
          if (hop === 6) fsay(anyAlive(), pick(F_BEG));
          if (hop++ >= hops) { setTimeout(() => { t.classList.remove('pick'); then(pool[pickI], t); }, 380); return; }
          setTimeout(step, 50 + Math.pow(hop / hops, 2.6) * 280);
        };
        step();
      };
      const mk = t => {
        const r = { type: t };
        if (t === 'reply') { r.ask = pick(B_PHRASES); r.opts = shuffle([r.ask, r.ask.replace(/\w+$/, 'potato'), 'k']); r.text = `reply "${r.ask}" rn`; }
        if (t === 'call') { r.text = 'pick up. im calling u. privately.'; r.ring = 1.2; }
        if (t === 'like') { r.posts = shuffle(['bestie', P.side ? P.side.who : pick(P.alive.length ? P.alive : SQUAD), 'mom']); r.text = 'like my new post. NOW.'; }
        if (t === 'loc') { P.loc = false; r.text = 'turn on location sharing. i just wanna know ur safe :)'; }
        if (t === 'dnd') { P.dnd = true; r.text = 'why is do not disturb ON?? turn it off.'; }
        if (t === 'code') { r.code = String(Math.floor(Math.random() * 9000) + 1000); P.pad = ''; r.text = `type ${r.code} on the keypad and hit call`; }
        if (t === 'selfie') r.text = 'send me a selfie. SMILE :)';
        if (t === 'wall') { P.wall = 'sunset'; r.text = 'make me ur wallpaper. its only fair'; }
        if (t === 'find') { r.fakeOf = Math.floor(Math.random() * FK); P.order = shuffle(P.order.filter(i => i < FK).concat(FK)); r.text = 'im hiding on ur home screen as an app. find me ;)'; }
        if (t === 'story') { P.cap = false; r.text = 'post a story on snapgram about how much u love me'; }
        if (t === 'block') { r.who = pick(P.alive.filter(n => !P.blocked.includes(n))); r.text = `block ${r.who} in settings. they\u2019re being weird about me`; }
        if (t === 'voice') r.text = 'send me a voice note. hold the mic and tell me u love me';
        if (t === 'poll') { P.poll = shuffle(['Bestie', ...shuffle(P.alive).slice(0, 2), 'nobody']); r.text = 'FaceTime poll!! who\u2019s ur favorite person on this call?'; }
        if (t === 'faceid') { P.locked = true; r.text = 'i locked ur phone lol. unlock it with ur face'; }
        if (t === 'music') r.text = 'play OUR song. u know which one';
        if (t === 'maps') r.text = 'drop a pin on my house. come over ;)';
        if (t === 'photos') { P.photos = shuffle(['bestie', 'bestie', ...shuffle(P.alive.length ? P.alive : SQUAD).slice(0, 4)]).map(w => ({ w, del: false })); r.text = 'delete every photo that isn\u2019t me. NOW.'; }
        if (t === 'contacts') { P.bname = 'Bestie'; r.text = 'rename me in ur contacts. something cuter. u know what i mean'; }
        if (t === 'wallet') r.text = 'send me 5 starlites. a gift. for being me';
        if (t === 'notes') { P.pinned = null; P.notes = shuffle(NOTES.slice()); r.text = 'pin the note that says how u REALLY feel about me'; }
        if (t === 'power') { P.power = false; r.text = 'ur battery is at 1%. turn on Low Power Mode. i NEED u reachable'; }
        return r;
      };
      const cur = () => P.req && (P.req.type === 'boss' ? P.req.sub : P.req);
      const newReq = () => {
        let t, r; const boss = P.done === NEED - 1;
        if (boss) { r = { type: 'boss', steps: shuffle(['reply', 'wall', 'selfie', 'code', 'loc', 'story']).slice(0, 3), step: 0 }; r.sub = mk(r.steps[0]); r.text = `FINAL FAVOR (1/3): ${r.sub.text}`; }
        else { do t = pick(B_TYPES); while (t === P.last || (t === 'block' && !P.alive.some(n => !P.blocked.includes(n)))); P.last = t; r = mk(t); }
        r.t0 = ctx.elapsed(); r.dur = (boss ? 38 : Math.max(8, 16 - ctx.night * 0.7) + (/call|voice|faceid|story|photos/.test(r.type) ? 4 : 0) - P.jealous) + (P.chill ? 8 : 0); P.bnOff = null; P.jealous = 0;
        P.req = r; say('b', boss ? 'ok ok. one last thing. my FINAL favor. 3 steps. dont. mess. up.' : r.text); if (boss) say('b', r.text);
        if (Math.random() < 0.45) setTimeout(() => P.req === r && fsay(anyAlive(), pick(F_PLEAD)), 900);
        Sfx.tone(1320, 0.08, 'sine', 0.12); Sfx.tone(1760, 0.1, 'sine', 0.1, null, 0.09); haptic(60, 0.3); setBatt(); draw();
      };
      const complete = () => {
        const r = P.req;
        if (r && r.type === 'boss' && ++r.step < r.steps.length) { r.sub = mk(r.steps[r.step]); r.text = `FINAL FAVOR (${r.step + 1}/3): ${r.sub.text}`; say('b', 'good. next.'); say('b', r.text); Sfx.chime([660, 880]); return draw(); }
        P.req = null; P.call = null; P.locked = false; P.poll = null; P.cap = false; P.done++; P.order = P.order.filter(i => i < FK); say('b', pick(B_YAY)); if (Math.random() < 0.3) shift('brb turning into'); Sfx.chime([880, 1175]);
        if (Math.random() < 0.35) fsay(anyAlive(), pick(['thank u thank u', 'ok ok we\u2019re ok', 'keep going!!', 'omg']));
        if (P.twist && --P.twLeft <= 0) { P.twist = null; say('sys', 'Bestie forgives you\u2026 for now.'); setEnv(); }
        if (P.done >= NEED) { unlock('bestie1'); if (P.alive.length === SQUAD.length) unlock('bestie_all'); Run.pocket += P.alive.length * 5; toast('12 for 12!', `+${P.alive.length * 5} Starlites for ${P.alive.length} friend${P.alive.length === 1 ? '' : 's'} alive`, 'good'); }
        $('#b-done', el).textContent = `${P.done}/${NEED}`; ctx.set(P.done / NEED * 100); P.wait = P.chill ? 9 + Math.random() * 7 : 1.2; setBatt(); draw();
      };
      const fail = why => {
        P.req = null; P.call = null; P.rec = null; P.face = null; P.locked = false; P.poll = null; P.cap = false; P.busy = true; P.order = P.order.filter(i => i < FK); say('b', why); Sfx.tone(160, 0.6, 'sawtooth', 0.2, 60); shake(2); haptic(300, 0.9); go2('msgs'); setBatt(); draw();
        roulette((v, t) => {
          const [method, msg] = pick(B_KILLS), obj = pick(B_OBJ), line = msg.replace('%s', obj[0]);
          killTile(t, method, obj);
          if (v === 'you') { say('sys', `You ${line}.`); draw(); setTimeout(() => { if (!R || R.done) return; caught('bestie_you'); if (R && !R.done) { t.className = 'ft-me'; $$('.kfx', t).forEach(e => e.remove()); P.busy = false; P.wait = 1.5; } }, 1700); return; }
          P.alive = P.alive.filter(n => n !== v); P.lastDead = v; if (P.side && P.side.who === v) P.side = null; say('sys', `${v} ${line}. ${v} left the call.`); $(`.sq [data-n="${v}"]`, el).classList.add('dead'); shift('*poof* im');
          setTimeout(() => { t.classList.add('gone'); addCrack(); setRage(); Sfx.noise(0.25, 'highpass', 3500, 0.35); Sfx.tone(70, 0.4, 'sine', 0.4, 40); bt.classList.remove('crk-hit'); void bt.offsetWidth; bt.classList.add('crk-hit'); }, 1500);
          setTimeout(() => { t.remove(); fsay(anyAlive(), pick(F_GRIEF)); }, 2000);
          const tw = pick(B_TWISTS.filter(x => !P.twist || x[0] !== P.twist[0])); P.twist = tw; P.twLeft = 3; say('sys', `Bestie changed your world: ${tw[1]}. ${tw[2]}`);
          setTimeout(() => { setEnv(); P.busy = false; P.wait = P.chill ? 8 : 1.4; draw(); }, 2100);
        });
      };
      const shift = pre => { P.form = pick(B_FORMS.filter(f => f !== P.form)); say('b', `${pre} ${P.form[0]} now. i can be anything. i can be ANYWHERE.`); const f = $('#b-form', el); f.hidden = false; f.innerHTML = `<i data-lucide="${P.form[1]}"></i>is ${esc(P.form[0])}`; f.dataset.testid = 'bestie-form'; icons(); Sfx.tone(300, 0.5, 'sine', 0.12, 1200); };
      const scare = () => {
        const k = pick(['swap', 'drop', 'batt']), v = anyAlive(), tl = v && ftile(v);
        if (k === 'swap' && tl) { bt.classList.add('cam-off'); tl.insertAdjacentHTML('beforeend', `<img class="possess" src="${face()}" alt="">`); tl.classList.add('possessed'); Sfx.tone(1900, 0.25, 'square', 0.12, 300); Sfx.noise(0.3, 'highpass', 2500, 0.4); shake(2); haptic(120, 0.6);
          setTimeout(() => { tl.classList.remove('possessed'); $$('.possess', tl).forEach(e => e.remove()); bt.classList.remove('cam-off'); say('b', 'did i scare u? :)'); draw(); }, 1300); return; }
        if (k === 'drop' && tl) { ft.classList.add('dropped'); tl.classList.add('ghosted'); Sfx.tone(440, 0.2, 'sine', 0.1, 220); setTimeout(() => { ft.classList.remove('dropped'); setTimeout(() => { tl.classList.remove('ghosted'); fsay(v, 'what happened?? i was gone'); }, 900); }, 1700); return; }
        if (P.req && P.req.type === 'power') return; ph.insertAdjacentHTML('beforeend', '<div class="fake-batt" data-testid="bestie-fake-battery"><i data-lucide="battery-warning"></i><b>Battery 1%</b><small>Your phone will shut down.</small></div>'); icons(); Sfx.tone(600, 0.2, 'sine', 0.12);
        setTimeout(() => { const f = $('.fake-batt', ph); if (f) { f.querySelector('b').textContent = 'jk :)'; f.querySelector('small').textContent = '\u2014 bestie'; Sfx.chime([1175, 880]); } }, 1300);
        setTimeout(() => { const f = $('.fake-batt', ph); if (f) f.remove(); }, 2500);
      };
      const sideQuest = () => { const v = anyAlive(); if (!v) return; P.side = { who: v, until: ctx.elapsed() + 22 }; fsay(v, 'psst\u2026 double-tap my post on snapgram. i need to know someone still cares. dont tell him'); draw(); };
      const go2 = s => { if (s !== P.scr) { P.prev.push(P.scr); if (P.prev.length > 12) P.prev.shift(); } P.scr = s; if (s === 'msgs') P.unread = 0; };
      const bAv = () => P.form ? `<span class="bform"><i data-lucide="${P.form[1]}"></i></span>` : `<img src="${face()}" alt="">`;
      const setEnv = () => { ph.className = 'phone' + (P.twist ? ' tw-' + P.twist[0] : ''); };
      const appIcon = i => { if (i === FK) { const q = cur(), a = B_APPS[(q && q.fakeOf) || 0]; return `<button class="app" data-p="open" data-v="fake" data-testid="bestie-app-fake"><i style="background:${a[3]}"><i data-lucide="${a[2]}"></i></i><span>${B_MISS[a[0]]}</span></button>`; } const a = B_APPS[i]; return `<button class="app" data-p="open" data-v="${a[0]}" data-testid="bestie-app-${a[0]}"><i style="background:${a[3]}"><i data-lucide="${a[2]}"></i></i><span>${a[1]}</span>${a[0] === 'msgs' && P.unread ? `<b class="badge">${P.unread}</b>` : ''}</button>`; };
      const scrHtml = () => {
        const q = cur();
        if (P.scr === 'msgs') return `<div class="ps-h">Group Chat <small>${P.alive.length + 2} on call</small></div><div class="chat" data-testid="bestie-chat">${P.chat.map(m => `<p class="b-${m.from}">${m.who ? `<em>${esc(m.who)}</em>` : ''}${esc(m.t)}</p>`).join('')}</div>${q && q.type === 'reply' ? `<div class="qr">${q.opts.map((o, i) => `<button data-p="reply" data-v="${esc(o)}" data-testid="bestie-reply-${i}">${esc(o)}</button>`).join('')}</div>` : ''}<div class="vrow"><span>${P.rec ? 'recording\u2026 keep holding' : 'hold to record a voice note'}</span><div class="meter"><i id="b-vm"></i></div><button class="mic ${P.rec ? 'down' : ''}" data-p="rec" data-testid="bestie-voice-btn" aria-label="Hold to record"><i data-lucide="mic"></i></button></div>`;
        if (P.scr === 'snap') { const posts = q && q.type === 'like' ? q.posts : ['bestie', P.side ? P.side.who : 'Jamal', 'mom']; return `<div class="ps-h">Snapgram <button class="story-b" data-p="story" data-testid="bestie-story-btn"><i data-lucide="plus"></i>Your story</button></div>${P.cap ? `<div class="qr" data-testid="bestie-captions">${CAPS.map((c, i) => `<button data-p="cap" data-v="${i}" data-testid="bestie-caption-${i}">${c[0]}</button>`).join('')}</div>` : ''}<div class="feed">${posts.map(a => `<div class="post" data-p="like" data-v="${a}" data-testid="bestie-post-${a}"><b>@${a.toLowerCase()}</b><div class="pimg" style="${a === 'bestie' ? `background-image:url(${face()})` : SQUAD.includes(a) ? `background-image:url(${img('bf_' + a.toLowerCase())});background-size:auto 260%;background-position:50% 4%` : ''}"></div><span><i data-lucide="heart"></i>double-tap to like</span></div>`).join('')}</div>`; }
        if (P.scr === 'set') return `<div class="ps-h">Settings</div><div class="sets"><label>Location Sharing<button class="tg ${P.loc ? 'on' : ''}" data-p="loc" data-testid="bestie-toggle-loc"></button></label><label>Do Not Disturb<button class="tg ${P.dnd ? 'on' : ''}" data-p="dnd" data-testid="bestie-toggle-dnd"></button></label><label>Low Power Mode<button class="tg ${P.power ? 'on' : ''}" data-p="power" data-testid="bestie-toggle-power"></button></label><p>Wallpaper</p><div class="walls">${['sunset', 'bestie', 'cat'].map(w => `<button class="wl ${P.wall === w ? 'on' : ''} w-${w}" data-p="wall" data-v="${w}" data-testid="bestie-wall-${w}"></button>`).join('')}</div><p>Blocked contacts</p><div class="blk">${P.alive.map(n => `<label>${n}<button class="bk ${P.blocked.includes(n) ? 'on' : ''}" data-p="block" data-v="${n}" data-testid="bestie-block-${n.toLowerCase()}">${P.blocked.includes(n) ? 'Blocked' : 'Block'}</button></label>`).join('') || '<small>no one left to block</small>'}</div></div>`;
        if (P.scr === 'music') return `<div class="ps-h">Music</div><div class="lst" data-testid="bestie-music">${SONGS.map((g, i) => `<button class="row-b ${P.song === i ? 'on' : ''}" data-p="song" data-v="${i}" data-testid="bestie-song-${i}"><i data-lucide="${P.song === i ? 'audio-lines' : 'play'}"></i><span><b>${g[0]}</b><small>${i ? 'some artist' : 'bestie (feat. you)'}</small></span></button>`).join('')}</div>${P.song != null ? `<div class="np"><i data-lucide="disc-3"></i>Now playing: ${SONGS[P.song][0]}</div>` : ''}`;
        if (P.scr === 'maps') return `<div class="ps-h">Maps</div><div class="map" data-testid="bestie-map">${PINS.map(m => `<button class="pin p-${m[0]}" style="left:${m[2]}%;top:${m[3]}%" data-p="pin" data-v="${m[0]}" data-testid="bestie-pin-${m[0]}"><i data-lucide="${m[0] === 'bestie' ? 'heart' : 'map-pin'}"></i><span>${m[1]}</span></button>`).join('')}</div>`;
        if (P.scr === 'photos') { if (!P.photos.length) P.photos = ['bestie', ...SQUAD.slice(0, 5)].map(w => ({ w, del: false })); return `<div class="ps-h">Photos <small>${P.photos.filter(x => !x.del).length} items</small></div><div class="pgrid" data-testid="bestie-photos">${P.photos.map((x, i) => x.del ? '' : `<div class="ph-i" style="background-image:url(${x.w === 'bestie' ? face() : img('bf_' + x.w.toLowerCase())})"><button data-p="del" data-v="${i}" data-testid="bestie-photo-del-${i}" aria-label="Delete photo"><i data-lucide="trash-2"></i></button><small>${x.w}</small></div>`).join('')}</div>`; }
        if (P.scr === 'contacts') return `<div class="ps-h">Contacts</div><div class="lst"><div class="ct-card" data-testid="bestie-contact-card"><img src="${face()}" alt=""><b data-testid="bestie-contact-name">${esc(P.bname)}</b><small>Rename to:</small><div class="qr">${RENAMES.map((n, i) => `<button data-p="rename" data-v="${i}" data-testid="bestie-rename-${i}">${n[0]}</button>`).join('')}</div></div>${SQUAD.map(n => `<div class="ct-row ${P.alive.includes(n) ? '' : 'gone'}"><span style="background-image:url(${img('bf_' + n.toLowerCase())})"></span>${n}<small>${P.alive.includes(n) ? 'on call' : 'unavailable'}</small></div>`).join('')}</div>`;
        if (P.scr === 'wallet') return `<div class="ps-h">Wallet</div><div class="wal" data-testid="bestie-wallet"><small>Balance</small><b>${Run.pocket} <i data-lucide="sparkles"></i></b><p>Send Starlites to Bestie</p><div class="row center">${[1, 5, 10].map(v => `<button data-p="pay" data-v="${v}" data-testid="bestie-pay-${v}">${v}</button>`).join('')}</div></div>`;
        if (P.scr === 'notes') return `<div class="ps-h">Notes</div><div class="lst" data-testid="bestie-notes">${P.notes.map((n, i) => `<div class="note ${P.pinned === i ? 'on' : ''}"><span>${n[0]}</span><button data-p="pinnote" data-v="${i}" data-testid="bestie-note-pin-${i}" aria-label="Pin note"><i data-lucide="pin"></i></button></div>`).join('')}</div>`;
        if (P.scr === 'cam') return `<div class="ps-h">Camera</div><div class="cam"><div class="vf">${playerAvatar()}</div><button class="shut" data-p="shot" data-testid="bestie-shutter"></button></div>`;
        if (P.scr === 'pad' || P.scr === 'phone') return `<div class="ps-h">Keypad</div><div class="pd-num" data-testid="bestie-pad-number">${P.pad || '&nbsp;'}</div><div class="pd">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '\u2190', 0, 'call'].map(k => `<button data-p="key" data-v="${k}" class="${k === 'call' ? 'callk' : ''}" data-testid="bestie-key-${k === '\u2190' ? 'del' : k}">${k === 'call' ? '<i data-lucide="phone"></i>' : k}</button>`).join('')}</div>`;
        return `<div class="home w-${P.wall}"><div class="grid">${P.order.map(appIcon).join('')}</div></div>`;
      };
      const overlays = () => {
        if (P.locked) return `<div class="lock" data-testid="bestie-lock"><b>${new Date().toTimeString().slice(0, 5)}</b><small>Locked by Bestie</small><button class="fid ${P.face ? 'down' : ''}" data-p="face" data-testid="bestie-faceid-btn"><i data-lucide="scan-face"></i></button><span>hold to scan your face</span><div class="meter"><i id="b-fm"></i></div></div>`;
        if (P.poll) return `<div class="poll" data-testid="bestie-poll"><b><i data-lucide="bar-chart-3"></i>FaceTime Poll</b><p>Who\u2019s your favorite person on this call?</p>${P.poll.map((o, i) => `<button data-p="vote" data-v="${esc(o)}" data-testid="bestie-poll-${i}">${esc(o)}</button>`).join('')}</div>`;
        return '';
      };
      const draw = () => {
        const r = P.req, banner = r && P.scr !== 'msgs' && !P.locked && !P.poll && P.bnOff !== r ? `<button class="bn" data-p="bn" data-testid="bestie-banner"><i class="bn-grab"></i>${bAv()}<span><b>BESTIE</b>${esc(r.text)}</span></button>` : '';
        const call = P.call ? `<div class="incall" data-testid="bestie-call">${bAv()}<b>BESTIE</b><small>${P.call.on ? 'talking\u2026 don\u2019t you dare hang up' : 'incoming call\u2026'}</small>${P.call.on ? `<button class="hold" data-p="hold" data-testid="bestie-call-hold">Hold to keep listening</button><div class="meter"><i id="bc-m"></i></div>` : `<div class="row center"><button class="ans" data-p="answer" data-testid="bestie-call-answer"><i data-lucide="phone"></i></button><button class="dec" data-p="decline" data-testid="bestie-call-decline"><i data-lucide="phone-off"></i></button></div>`}</div>` : '';
        const nav = P.locked ? '' : `<nav class="os-nav" data-testid="bestie-nav"><button data-p="back" data-testid="bestie-back-btn" ${P.prev.length ? '' : 'disabled'}><i data-lucide="chevron-left"></i><span>Back</span></button><button class="nv-home ${P.scr === 'home' ? 'on' : ''}" data-p="home" data-testid="bestie-home-btn"><i data-lucide="house"></i><span>Home</span></button><button class="${P.scr === 'msgs' ? 'on' : ''}" data-p="open" data-v="msgs" data-testid="bestie-nav-msgs"><i data-lucide="message-circle"></i><span>Chat</span>${P.unread ? `<b class="badge" data-testid="bestie-unread">${P.unread}</b>` : ''}</button></nav>`;
        ph.innerHTML = `${banner}<div class="rq-t">${r ? '<i id="b-rq"></i>' : ''}</div><div class="ps">${scrHtml()}</div>${overlays()}${call}${nav}`;
        icons(); const c = $('.chat', ph); if (c) c.scrollTop = 1e5;
      };
      let lastTap = { v: '', t: 0 }, bnSw = null;
      ph.addEventListener('pointermove', e => { if (!bnSw) return; const dy = Math.min(0, e.clientY - bnSw.y); bnSw.el.style.transform = `translateY(${dy}px)`; bnSw.el.style.opacity = 1 + dy / 90; });
      const bnEnd = e => { if (!bnSw) return; const dy = e.clientY - bnSw.y, r = bnSw.r; bnSw = null; if (dy < -24) { P.bnOff = r; Sfx.noise(0.06, 'highpass', 2500, 0.12); return draw(); } if (Math.abs(dy) < 10 && e.type === 'pointerup') { go2('msgs'); return draw(); } draw(); };
      ph.addEventListener('pointerup', bnEnd); ph.addEventListener('pointercancel', bnEnd);
      ph.addEventListener('pointermove', e => { const b = ph.getBoundingClientRect(); ph.style.setProperty('--mx', (e.clientX - b.left) + 'px'); ph.style.setProperty('--my', (e.clientY - b.top) + 'px'); });
      ph.addEventListener('pointerdown', e => {
        const t = e.target.closest('[data-p]'); if (!t || t.disabled) return; e.preventDefault(); const p = t.dataset.p, v = t.dataset.v, q = cur(); Sfx.click();
        if (p === 'bn') { bnSw = { y: e.clientY, r: P.req, el: t }; try { ph.setPointerCapture(e.pointerId); } catch (x) {} return; }
        if (p === 'home') { go2('home'); return draw(); }
        if (p === 'back') { P.scr = P.prev.pop() || 'home'; if (P.scr === 'msgs') P.unread = 0; return draw(); }
        if (p === 'open' && v === 'fake') { if (q && q.type === 'find') { say('b', 'FOUND ME!! ur so good at this'); return complete(); } return; }
        if (p === 'open') { go2(v); return draw(); }
        if (p === 'face' && P.locked) { P.face = { held: 0 }; t.classList.add('down'); return; }
        if (p === 'rec') { P.rec = { held: 0 }; t.classList.add('down'); Sfx.tone(880, 0.06, 'sine', 0.08); return; }
        if (P.busy) return;
        if (p === 'vote' && P.poll) { if (v === 'Bestie') { say('me', 'Bestie'); return complete(); } P.poll = null; if (SQUAD.includes(v)) fsay(v, 'why would u say me'); return fail(v === 'nobody' ? 'NOBODY?? not even me??' : `${v}?? over ME??`); }
        if (p === 'reply' && q && q.type === 'reply') { say('me', v); return v === q.ask ? complete() : fail(`"${v}"?? wow. WOW.`); }
        if (p === 'like') { const now2 = performance.now(); if (lastTap.v === v && now2 - lastTap.t < 450) { lastTap = { v: '', t: 0 }; if (q && q.type === 'like') return v === 'bestie' ? complete() : fail(`u liked ${v.toUpperCase()}'s post?? over MINE??`); Sfx.tone(990, 0.05, 'sine', 0.08);
          if (P.side && v === P.side.who) { const w = P.side.who; P.side = null; Run.pocket += 4; toast('Secret kept?', `${w} sent you 4 Starlites`, 'good'); fsay(w, 'thank u. i wont forget this'); P.jealous = 4; setTimeout(() => { say('b', `u liked ${w}\u2019s post. interesting. VERY interesting.`); draw(); }, 900); return draw(); } } else lastTap = { v, t: now2 }; return; }
        if (p === 'song') { P.song = +v; Sfx.musicBox(); if (q && q.type === 'music') return SONGS[+v][1] ? complete() : fail(`"${SONGS[+v][0]}"?? that is NOT our song`); return draw(); }
        if (p === 'pin') { const m = PINS.find(x => x[0] === v); say('me', `[pin dropped: ${m[1]}]`); if (q && q.type === 'maps') return v === 'bestie' ? complete() : fail(v === 'woods' ? 'the woods? ok. see u there.' : `${m[1].toLowerCase()}?? i said MY house`); return draw(); }
        if (p === 'del') { const x = P.photos[+v]; if (!x) return; x.del = true; Sfx.noise(0.1, 'bandpass', 1500, 0.2); if (q && q.type === 'photos') { if (x.w === 'bestie') return fail('u deleted ME?? out of all of them??'); if (P.photos.every(y => y.del || y.w === 'bestie')) return complete(); } return draw(); }
        if (p === 'rename') { const n = RENAMES[+v]; P.bname = n[0]; if (q && q.type === 'contacts') return n[1] ? complete() : fail(`"${n[0]}"?? is that what i am to u??`); return draw(); }
        if (p === 'pay') { const n = +v; Run.pocket = Math.max(0, Run.pocket - n); Sfx.chime([1320]); say('me', `[sent ${n} Starlites]`); if (q && q.type === 'wallet') { if (n < 5) return fail('1?? im worth way more than ONE'); if (n > 5) say('b', 'MORE than i asked?? ur my favorite'); return complete(); } return draw(); }
        if (p === 'pinnote') { P.pinned = +v; const n = P.notes[+v]; if (q && q.type === 'notes') return n[1] ? complete() : fail(n[0] === 'call the police' ? 'the POLICE?? on ME??' : 'get off this call?? never.'); return draw(); }
        if (p === 'story') { P.cap = !P.cap; return draw(); }
        if (p === 'cap') { const c = CAPS[+v]; P.cap = false; say('sys', `You posted a story: "${c[0]}"`); if (q && q.type === 'story') return c[1] ? complete() : fail(c[0] === 'help me' ? 'HELP ME?? delete that. NOW.' : 'w FRIENDS?? not w ME??'); return draw(); }
        if (p === 'block') { if (P.blocked.includes(v)) return; P.blocked.push(v); const tl = ftile(v); if (tl) tl.classList.add('blocked'); fsay(v, 'did u just block me??'); if (q && q.type === 'block') return v === q.who ? complete() : fail(`${v}?? i said ${q.who}. ugh.`); return draw(); }
        if (p === 'loc') { P.loc = !P.loc; if (q && q.type === 'loc' && P.loc) return complete(); return draw(); }
        if (p === 'dnd') { P.dnd = !P.dnd; if (q && q.type === 'dnd' && !P.dnd) return complete(); return draw(); }
        if (p === 'power') { P.power = !P.power; setBatt(); if (q && q.type === 'power' && P.power) return complete(); return draw(); }
        if (p === 'wall') { P.wall = v; if (q && q.type === 'wall') return v === 'bestie' ? complete() : fail('a ' + v + '?? instead of ME??'); return draw(); }
        if (p === 'shot') { Sfx.noise(0.08, 'highpass', 3000, 0.3); if (q && q.type === 'selfie') { say('me', '[selfie]'); return complete(); } return; }
        if (p === 'key') { if (v === 'call') { if (q && q.type === 'code') return P.pad === q.code ? complete() : fail(`${P.pad || 'nothing'}?? i said ${q.code}. do u even listen`); return; } P.pad = v === '\u2190' ? P.pad.slice(0, -1) : (P.pad + v).slice(0, 6); Sfx.beep(700 + (+v || 0) * 40); return draw(); }
        if (p === 'answer' && P.call) { P.call.on = true; P.call.held = 0; return draw(); }
        if (p === 'decline' && P.call) return fail('u DECLINED me?');
        if (p === 'hold' && P.call) { P.call.holding = true; t.classList.add('down'); }
      });
      const release = () => {
        if (P.call && P.call.holding) { P.call.holding = false; if (P.call.held < 2.5) fail('did u just hang up on me'); }
        if (P.face) { P.face = null; draw(); }
        if (P.rec) { P.rec = null; draw(); }
      };
      ph.addEventListener('pointerup', release); ph.addEventListener('pointercancel', release); ph.addEventListener('pointerleave', release);
      let dr = 2.5; setRage(); setBatt(); draw();
      return {
        update(dt) {
          const ck = $('#b-clock', el); if (ck) ck.textContent = Math.ceil(Math.max(0, R.limit - R.t)) + 's';
          if (P.face) { P.face.held += dt; const m = $('#b-fm', ph); if (m) m.style.width = Math.min(100, P.face.held / 1.5 * 100) + '%'; if (P.face.held >= 1.5) { P.face = null; P.locked = false; Sfx.chime([988, 1319]); const q = cur(); if (q && q.type === 'faceid') return complete(); return draw(); } }
          if (P.rec) { P.rec.held += dt; const m = $('#b-vm', ph); if (m) m.style.width = Math.min(100, P.rec.held / 2 * 100) + '%'; if (P.rec.held >= 2) { P.rec = null; say('me', '[voice note 0:02] \u201ci love u bestie\u201d'); const q = cur(); if (q && q.type === 'voice') return complete(); say('b', 'aww a voice note?? for ME?'); return draw(); } }
          if (P.busy) return;
          P.scareT -= dt; if (P.scareT <= 0 && !P.call) { P.scareT = (P.chill ? 38 : 20) + Math.random() * 16; scare(); }
          P.ambT -= dt; if (P.ambT <= 0) { if (!P.amb.length && P.alive.length) { const f = shuffle(P.alive.slice()), seq = pick(AMB.filter(q => P.lastDead || !q.some(l => l[1].includes('{dead}')))); P.amb = seq.map(([w, t]) => [w === 'b' ? 'b' : w === 'f1' ? f[0] : f[1] || f[0], t.replace('{f1}', f[0]).replace('{f2}', f[1] || f[0]).replace('{dead}', P.lastDead)]); }
            const l = P.amb.shift(); P.ambT = P.amb.length ? 2.4 : P.chill ? 3 + Math.random() * 3 : 9 + Math.random() * 7; if (l) { if (l[0] === 'b') say('b', l[1]); else fsay(l[0], l[1]); if (P.scr === 'msgs' || P.scr === 'home') draw(); else { const bd = $('[data-testid=bestie-unread]', ph); if (bd) bd.textContent = P.unread; else draw(); } } }
          P.sideT -= dt; if (P.sideT <= 0) { P.sideT = 28 + Math.random() * 14; if (!P.side && P.alive.length) sideQuest(); }
          if (P.side && ctx.elapsed() > P.side.until) { fsay(P.side.who, 'nvm. forget it.'); P.side = null; }
          if (!P.req) { P.wait -= dt; if (P.wait <= 0 && P.done < NEED) newReq(); return; }
          if (P.bnOff !== P.req && ctx.elapsed() - P.req.t0 > 6 && !bnSw) { const b = $('.bn', ph); if (b) { P.bnOff = P.req; b.classList.add('out'); setTimeout(() => P.bnOff === P.req && draw(), 300); } }
          const r = P.req, q = cur(), left = r.dur - (ctx.elapsed() - r.t0), bar = $('#b-rq', ph); if (bar) bar.style.width = clamp(left / r.dur, 0, 1) * 100 + '%';
          if (q.type === 'call' && !P.call) { q.ring -= dt; if (q.ring <= 0) { P.call = { on: false }; Sfx.musicBox(); draw(); } }
          if (P.call && P.call.on && P.call.holding) { P.call.held += dt; const m = $('#bc-m', ph); if (m) m.style.width = Math.min(100, P.call.held / 2.5 * 100) + '%'; if (P.call.held >= 2.5) { P.call = null; return complete(); } }
          if (P.twist && P.twist[0] === 'drift') { dr -= dt; if (dr <= 0) { dr = 2.5; P.order = shuffle(P.order); if (P.scr === 'home') draw(); } }
          if (left <= 0) fail(pick(['u left me on READ.', 'too slow bestie.', 'i waited. i WAITED.']));
        },
        isActive: () => false,
        destroy() { ro.disconnect(); }
      };
    }
  };
}
