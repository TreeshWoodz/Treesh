'use strict';
/* BESTIE: phone-based comedic horror. Do what he texts. 12 requests or else. */
const SQUAD = ['Jamie', 'Priya', 'Marcus', 'Lena', 'Dre'];
const B_TWISTS = [['flip', 'Upside Down', 'Your phone is upside down now. Bestie thinks that\u2019s hilarious.'], ['mirror', 'Mirror World', 'Everything is backwards. Like your loyalty.'],
  ['dark', 'Lights Out', 'Pitch black. Your finger is the flashlight.'], ['drift', 'Restless Apps', 'The apps won\u2019t sit still.'], ['melt', 'Meltdown', 'Your screen is melting. Bestie did that.']];
const B_APPS = [['msgs', 'Messages', 'message-circle', '#30b85a'], ['phone', 'Phone', 'phone', '#30b85a'], ['snap', 'Snapgram', 'camera', '#d6336c'], ['set', 'Settings', 'settings', '#6c6c78'], ['cam', 'Camera', 'aperture', '#2b2b33'], ['pad', 'Keypad', 'grid-3x3', '#2f6fd0']];
const B_PHRASES = ['ur my favorite person', 'i would never ignore u', 'bestie 4 life', 'i love the group chat', 'u r so normal'];
const B_YAY = ['yayyy ily', 'see? was that so hard', 'ur the best bestie', 'good. very good.', 'omg ur so obedient i mean sweet'];
const B_TYPES = ['reply', 'call', 'like', 'loc', 'dnd', 'code', 'selfie', 'wall', 'find'];
const B_FORMS = [['a toaster', 'microwave'], ['a cat', 'cat'], ['a raven', 'bird'], ['your lamp', 'lamp'], ['a teddy bear', 'smile'], ['a ghost', 'ghost'], ['your mirror', 'scan-face'], ['a spider', 'bug'], ['the moon', 'moon'], ['a houseplant', 'sprout'], ['your armchair', 'armchair'], ['the clock on your wall', 'clock']];
const B_MISS = { msgs: 'Mesages', phone: 'Phnoe', snap: 'Snapgrm', set: 'Setings', cam: 'Camra', pad: 'Keypd' };

function bestieMini() {
  return {
    id: 'bestie', name: 'The Group Chat', room: 'bestie_art', icon: 'smartphone', noBtn: true, noKiller: true, view: 'bestie', endReason: 'bestie',
    labels: { look: 'Bestie is typing\u2026' },
    hint: 'Your best friend needs you to do stuff on your phone. Finish 12 requests before the candle burns out. Every request you miss gets a friend killed and twists your world.',
    limit: n => Math.max(95, 150 - n * 8),
    mount(el, ctx) {
      const P = { scr: 'home', loc: false, dnd: false, wall: 'sunset', pad: '', chat: [], req: null, done: 0, alive: SQUAD.slice(), twist: null, twLeft: 0, form: null, order: B_APPS.map((_, i) => i), call: null, wait: 1.6, last: '', rage: 0 };
      const NEED = 12, say = (from, t) => { P.chat.push({ from, t }); if (P.chat.length > 30) P.chat.shift(); };
      say('b', 'heyyy bestie!! i need u to do some stuff for me ok?? \u2665');
      el.innerHTML = `<div class="mg mg-bestie"><div class="phone" id="ph" data-testid="bestie-phone"></div></div>`;
      const ph = $('#ph', el);
      const newReq = () => {
        let t; do t = pick(B_TYPES); while (t === P.last); P.last = t;
        const r = { type: t, t0: ctx.elapsed(), dur: Math.max(P.rage ? 5 : 8, 15 - ctx.night * 0.7 - P.rage * 1.5) + (t === 'call' ? 4 : 0) };
        if (t === 'reply') { r.ask = pick(B_PHRASES); r.opts = shuffle([r.ask, r.ask.replace(/\w+$/, 'potato'), 'k']); r.text = `reply "${r.ask}" rn`; }
        if (t === 'call') { r.text = 'pick up. im calling u.'; r.ring = 1.2; }
        if (t === 'like') { r.posts = shuffle(['bestie', pick(P.alive.length ? P.alive : SQUAD), 'mom']); r.text = 'like my new post. NOW.'; }
        if (t === 'loc') { P.loc = false; r.text = 'turn on location sharing. i just wanna know ur safe :)'; }
        if (t === 'dnd') { P.dnd = true; r.text = 'why is do not disturb ON?? turn it off.'; }
        if (t === 'code') { r.code = String(Math.floor(Math.random() * 9000) + 1000); P.pad = ''; r.text = `type ${r.code} on the keypad and hit call`; }
        if (t === 'selfie') r.text = 'send me a selfie. SMILE :)';
        if (t === 'wall') { P.wall = 'sunset'; r.text = 'make me ur wallpaper. its only fair'; }
        if (t === 'find') { r.fakeOf = Math.floor(Math.random() * 6); P.order = shuffle(P.order.filter(i => i < 6).concat(6)); r.text = 'im hiding on ur home screen as an app. find me ;)'; }
        P.req = r; say('b', r.text); Sfx.tone(1320, 0.08, 'sine', 0.12); Sfx.tone(1760, 0.1, 'sine', 0.1, null, 0.09); haptic(60, 0.3); draw();
      };
      const complete = () => {
        P.req = null; P.call = null; P.done++; P.order = P.order.filter(i => i < 6); say('b', pick(B_YAY)); if (Math.random() < 0.3) shift('brb turning into'); Sfx.chime([880, 1175]);
        if (P.twist && --P.twLeft <= 0) { P.twist = null; say('sys', 'Bestie forgives you\u2026 for now.'); setEnv(); }
        if (P.done >= NEED) { unlock('bestie1'); if (P.alive.length === SQUAD.length) unlock('bestie_all'); Run.pocket += P.alive.length * 5; toast('12 for 12!', `+${P.alive.length * 5} Starlites for ${P.alive.length} friend${P.alive.length === 1 ? '' : 's'} alive`, 'good'); }
        ctx.set(P.done / NEED * 100); P.wait = 1.2; draw();
      };
      const fail = why => {
        P.req = null; P.call = null; P.order = P.order.filter(i => i < 6); say('b', why); shift('*poof* im'); Sfx.tone(160, 0.6, 'sawtooth', 0.2, 60); Sfx.noise(0.4, 'highpass', 1800, 0.25); shake(2); haptic(300, 0.9);
        if (P.alive.length) { const v = P.alive.splice(Math.floor(Math.random() * P.alive.length), 1)[0]; say('sys', `${v} left the chat.`); setTimeout(() => Sfx.scream(), 250); }
        else { P.rage++; say('sys', P.rage === 1 ? 'No one left. It\u2019s just you and me now ;)' : 'Bestie is getting impatient\u2026'); setTimeout(() => Sfx.scream(), 250); shake(4); haptic(500, 1); }
        const tw = pick(B_TWISTS.filter(x => !P.twist || x[0] !== P.twist[0])); P.twist = tw; P.twLeft = 3 + P.rage * 2; say('sys', `Bestie changed your world: ${tw[1]}. ${tw[2]}`); setEnv(); P.wait = P.rage ? 0.6 : 2; draw();
      };
      const shift = pre => { P.form = pick(B_FORMS.filter(f => f !== P.form)); say('b', `${pre} ${P.form[0]} now. i can be anything. i can be ANYWHERE.`); const m = R.mini; m.labels = { look: 'Bestie is ' + P.form[0] }; renderKiller(); Sfx.tone(300, 0.5, 'sine', 0.12, 1200); };
      const bAv = () => P.form ? `<span class="bform"><i data-lucide="${P.form[1]}"></i></span>` : `<img src="${img('bestie_face')}" alt="">`;
      const setEnv = () => { const bg = $('#act-bg'), f = { flip: 'hue-rotate(160deg)', mirror: 'invert(.85)', dark: 'brightness(.12)', drift: 'hue-rotate(80deg) saturate(2)', melt: 'saturate(3) hue-rotate(-30deg) blur(2px)' }; if (bg) bg.style.filter = P.twist ? f[P.twist[0]] + ' brightness(.5)' : ''; ph.className = 'phone' + (P.twist ? ' tw-' + P.twist[0] : ''); };
      const appIcon = i => { if (i === 6) { const a = B_APPS[(P.req && P.req.fakeOf) || 0]; return `<button class="app" data-p="open" data-v="fake" data-testid="bestie-app-fake"><i style="background:${a[3]}"><i data-lucide="${a[2]}"></i></i><span>${B_MISS[a[0]]}</span></button>`; } const a = B_APPS[i]; return `<button class="app" data-p="open" data-v="${a[0]}" data-testid="bestie-app-${a[0]}"><i style="background:${a[3]}"><i data-lucide="${a[2]}"></i></i><span>${a[1]}</span></button>`; };
      const scrHtml = () => {
        const r = P.req;
        if (P.scr === 'msgs') return `<div class="ps-h">Bestie <small>online</small></div><div class="chat" data-testid="bestie-chat">${P.chat.map(m => `<p class="b-${m.from}">${esc(m.t)}</p>`).join('')}</div>${r && r.type === 'reply' ? `<div class="qr">${r.opts.map((o, i) => `<button data-p="reply" data-v="${esc(o)}" data-testid="bestie-reply-${i}">${esc(o)}</button>`).join('')}</div>` : ''}`;
        if (P.scr === 'snap') return `<div class="ps-h">Snapgram</div><div class="feed">${(r && r.type === 'like' ? r.posts : ['bestie', 'Jamie', 'mom']).map(a => `<div class="post" data-p="like" data-v="${a}" data-testid="bestie-post-${a}"><b>@${a.toLowerCase()}</b><div class="pimg" style="${a === 'bestie' ? `background-image:url(${img('bestie_face')})` : ''}"></div><span><i data-lucide="heart"></i>double-tap to like</span></div>`).join('')}</div>`;
        if (P.scr === 'set') return `<div class="ps-h">Settings</div><div class="sets"><label>Location Sharing<button class="tg ${P.loc ? 'on' : ''}" data-p="loc" data-testid="bestie-toggle-loc"></button></label><label>Do Not Disturb<button class="tg ${P.dnd ? 'on' : ''}" data-p="dnd" data-testid="bestie-toggle-dnd"></button></label><p>Wallpaper</p><div class="walls">${['sunset', 'bestie', 'cat'].map(w => `<button class="wl ${P.wall === w ? 'on' : ''} w-${w}" data-p="wall" data-v="${w}" data-testid="bestie-wall-${w}"></button>`).join('')}</div></div>`;
        if (P.scr === 'cam') return `<div class="ps-h">Camera</div><div class="cam"><div class="vf">${playerAvatar()}</div><button class="shut" data-p="shot" data-testid="bestie-shutter"></button></div>`;
        if (P.scr === 'pad' || P.scr === 'phone') return `<div class="ps-h">Keypad</div><div class="pd-num" data-testid="bestie-pad-number">${P.pad || '&nbsp;'}</div><div class="pd">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '\u2190', 0, 'call'].map(k => `<button data-p="key" data-v="${k}" class="${k === 'call' ? 'callk' : ''}" data-testid="bestie-key-${k === '\u2190' ? 'del' : k}">${k === 'call' ? '<i data-lucide="phone"></i>' : k}</button>`).join('')}</div>`;
        return `<div class="home w-${P.wall}"><div class="grid">${P.order.map(appIcon).join('')}</div></div>`;
      };
      const draw = () => {
        const r = P.req, banner = r && P.scr !== 'msgs' ? `<button class="bn" data-p="open" data-v="msgs" data-testid="bestie-banner">${bAv()}<span><b>BESTIE</b>${esc(r.text)}</span></button>` : '';
        const call = P.call ? `<div class="incall" data-testid="bestie-call">${bAv()}<b>BESTIE</b><small>${P.call.on ? 'talking\u2026 don\u2019t you dare hang up' : 'incoming call\u2026'}</small>${P.call.on ? `<button class="hold" data-p="hold" data-testid="bestie-call-hold">Hold to keep listening</button><div class="meter"><i id="bc-m"></i></div>` : `<div class="row center"><button class="ans" data-p="answer" data-testid="bestie-call-answer"><i data-lucide="phone"></i></button><button class="dec" data-p="decline" data-testid="bestie-call-decline"><i data-lucide="phone-off"></i></button></div>`}</div>` : '';
        ph.innerHTML = `<div class="ps-bar"><span id="b-clock">${Math.ceil(Math.max(0, R.limit - R.t))}s</span><span class="sq" data-testid="bestie-squad">${SQUAD.map(n => `<i class="${P.alive.includes(n) ? '' : 'dead'}" title="${n}">${n[0]}</i>`).join('')}<i class="me">${esc(Treesh.name()[0] || 'Y')}</i></span><span data-testid="bestie-done">${P.done}/${NEED}</span></div>
          ${banner}${r ? `<div class="rq-t"><i id="b-rq"></i></div>` : ''}<div class="ps">${scrHtml()}</div>${call}<button class="hb" data-p="home" data-testid="bestie-home-btn"></button>`;
        icons(); const c = $('.chat', ph); if (c) c.scrollTop = 1e5;
      };
      let lastTap = { v: '', t: 0 };
      ph.addEventListener('pointermove', e => { const b = ph.getBoundingClientRect(); ph.style.setProperty('--mx', (e.clientX - b.left) + 'px'); ph.style.setProperty('--my', (e.clientY - b.top) + 'px'); });
      ph.addEventListener('pointerdown', e => {
        const t = e.target.closest('[data-p]'); if (!t) return; e.preventDefault(); const p = t.dataset.p, v = t.dataset.v, r = P.req; Sfx.click();
        if (p === 'home') { P.scr = 'home'; return draw(); }
        if (p === 'open' && v === 'fake') { if (r && r.type === 'find') { say('b', 'FOUND ME!! ur so good at this'); return complete(); } return; }
        if (p === 'open') { P.scr = v; return draw(); }
        if (p === 'reply' && r && r.type === 'reply') { say('me', v); return v === r.ask ? complete() : fail(`"${v}"?? wow. WOW.`); }
        if (p === 'like') { const now2 = performance.now(); if (lastTap.v === v && now2 - lastTap.t < 450) { lastTap = { v: '', t: 0 }; if (r && r.type === 'like') return v === 'bestie' ? complete() : fail(`u liked ${v.toUpperCase()}'s post?? over MINE??`); Sfx.tone(990, 0.05, 'sine', 0.08); } else lastTap = { v, t: now2 }; return; }
        if (p === 'loc') { P.loc = !P.loc; if (r && r.type === 'loc' && P.loc) return complete(); return draw(); }
        if (p === 'dnd') { P.dnd = !P.dnd; if (r && r.type === 'dnd' && !P.dnd) return complete(); return draw(); }
        if (p === 'wall') { P.wall = v; if (r && r.type === 'wall') return v === 'bestie' ? complete() : fail('a ' + v + '?? instead of ME??'); return draw(); }
        if (p === 'shot') { Sfx.noise(0.08, 'highpass', 3000, 0.3); if (r && r.type === 'selfie') { say('me', '[selfie]'); return complete(); } return; }
        if (p === 'key') { if (v === 'call') { if (r && r.type === 'code') return P.pad === r.code ? complete() : fail(`${P.pad || 'nothing'}?? i said ${r.code}. do u even listen`); return; } P.pad = v === '\u2190' ? P.pad.slice(0, -1) : (P.pad + v).slice(0, 6); Sfx.beep(700 + (+v || 0) * 40); return draw(); }
        if (p === 'answer' && P.call) { P.call.on = true; P.call.held = 0; return draw(); }
        if (p === 'decline' && P.call) return fail('u DECLINED me?');
        if (p === 'hold' && P.call) { P.call.holding = true; t.classList.add('down'); }
      });
      const release = () => { if (P.call && P.call.holding) { P.call.holding = false; if (P.call.held < 2.5) fail('did u just hang up on me'); } };
      ph.addEventListener('pointerup', release); ph.addEventListener('pointercancel', release);
      let dr = 2.5; draw();
      return {
        update(dt) {
          const ck = $('#b-clock', ph); if (ck) ck.textContent = Math.ceil(Math.max(0, R.limit - R.t)) + 's';
          if (!P.req) { P.wait -= dt; if (P.wait <= 0 && P.done < NEED) newReq(); return; }
          const r = P.req, left = r.dur - (ctx.elapsed() - r.t0), bar = $('#b-rq', ph); if (bar) bar.style.width = clamp(left / r.dur, 0, 1) * 100 + '%';
          if (r.type === 'call' && !P.call) { r.ring -= dt; if (r.ring <= 0) { P.call = { on: false }; Sfx.musicBox(); draw(); } }
          if (P.call && P.call.on && P.call.holding) { P.call.held += dt; const m = $('#bc-m', ph); if (m) m.style.width = Math.min(100, P.call.held / 2.5 * 100) + '%'; if (P.call.held >= 2.5) { P.call = null; return complete(); } }
          if (P.twist && P.twist[0] === 'drift') { dr -= dt; if (dr <= 0) { dr = 2.5; P.order = shuffle(P.order); if (P.scr === 'home') draw(); } }
          if (left <= 0) fail(pick(['u left me on READ.', 'too slow bestie.', 'i waited. i WAITED.']));
        },
        isActive: () => false
      };
    }
  };
}
