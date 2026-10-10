'use strict';
/* Don't Get Caught: microphone analysis + voice mini-games */
const Mic = {
  ok: false, stream: null, an: null, buf: null, fbuf: null, floor: -62, base: 200, frame: 0,
  f: { rms: 0, db: -100, level: 0, voiced: false, pitch: 0, cent: 0, flat: 1 },
  async start() {
    if (this.ok) return true;
    try { this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false } }); }
    catch (e) { return false; }
    const ac = Sfx.ctx(), src = ac.createMediaStreamSource(this.stream);
    this.an = ac.createAnalyser(); this.an.fftSize = 2048; this.an.smoothingTimeConstant = 0.15; src.connect(this.an);
    this.buf = new Float32Array(2048); this.fbuf = new Float32Array(1024); this.ok = true; return true;
  },
  stop() { try { this.stream && this.stream.getTracks().forEach(t => t.stop()); } catch (e) {} this.ok = false; this.stream = null; },
  read() {
    const f = this.f; if (!this.ok) return f;
    const b = this.buf; this.an.getFloatTimeDomainData(b); let s = 0; for (let i = 0; i < b.length; i++) s += b[i] * b[i];
    f.rms = Math.sqrt(s / b.length); f.db = 20 * Math.log10(f.rms + 1e-9);
    f.level = clamp((f.db - (this.floor + 6)) / 30, 0, 1);
    this.frame++;
    if (this.frame % 2 === 0) {
      f.pitch = f.level > 0.08 ? detectPitch(b, Sfx.ac.sampleRate) : 0; f.voiced = f.pitch > 0;
      this.an.getFloatFrequencyData(this.fbuf); const hz = Sfx.ac.sampleRate / 2048; let sm = 0, sw = 0, lg = 0, n = 0;
      for (let i = 2; i < 370; i++) { const m = Math.pow(10, this.fbuf[i] / 20) + 1e-9; sm += m; sw += m * i * hz; lg += Math.log(m); n++; }
      f.cent = sw / sm; f.flat = Math.exp(lg / n) / (sm / n);
    }
    return f;
  },
  async sample(sec, fn) { const t0 = now(); return new Promise(res => { const tick = () => { this.read(); fn(this.f); if (now() - t0 < sec) requestAnimationFrame(tick); else res(); }; tick(); }); }
};
function detectPitch(b, sr) {
  const N = 1024, minL = Math.floor(sr / 1100), maxL = Math.min(Math.floor(sr / 70), b.length - N - 1); let best = 0, bestL = -1; const rs = new Float32Array(maxL + 1);
  for (let L = minL; L <= maxL; L++) { let s = 0, e1 = 0, e2 = 0; for (let i = 0; i < N; i += 2) { const a = b[i], c = b[i + L]; s += a * c; e1 += a * a; e2 += c * c; } const r = s / Math.sqrt(e1 * e2 + 1e-12); rs[L] = r; if (r > best) { best = r; bestL = L; } }
  if (best < 0.8) return 0;
  for (let L = minL + 1; L < bestL; L++) if (rs[L] > best * 0.92 && rs[L] >= rs[L - 1] && rs[L] >= rs[L + 1]) { bestL = L; break; }
  return sr / bestL;
}
const semis = (p, base) => 12 * Math.log2(p / base);

/* ---------- Lullaby: hold pitch (or loudness) on a moving target ---------- */
function lullabyMini(kind) {
  return {
    id: 'lullaby_' + kind, name: kind === 'pitch' ? 'His Lullaby' : 'The Steady Hum', room: 'room_closet', icon: kind === 'pitch' ? 'audio-waveform' : 'activity', noBtn: true, noSight: true, voice: true,
    labels: { away: 'Dozing', warn: 'Leaning in\u2026', look: 'LISTENING' },
    hint: kind === 'pitch' ? 'Hum or sing. Move your pitch up and down to keep the dot inside his band. When he\u2019s LISTENING you must stay on key.' : 'Hum steadily. Get louder or softer to keep the dot inside his band. When he\u2019s LISTENING you must stay inside it.',
    mount(el, ctx) {
      el.innerHTML = `<div class="mg mg-lull"><canvas id="lu-cv" width="480" height="240" data-testid="mg-lullaby-canvas"></canvas><div class="lu-row"><span>Discord</span><div class="meter"><i id="lu-d" data-testid="mg-lullaby-discord"></i></div></div><p class="mg-cap" id="lu-c">${kind === 'pitch' ? 'Hum. Follow the band.' : 'Hum steady. Ride the band.'}</p></div>`;
      const cv = $('#lu-cv', el), c = cv.getContext('2d'), W = 480, H = 240, n = ctx.night;
      const A = kind === 'pitch' ? 3.5 + Math.min(4, n * 0.35) : 0.26, hw = kind === 'pitch' ? Math.max(1, 2 - n * 0.07) : Math.max(0.09, 0.15 - n * 0.004);
      const w1 = 0.35 + n * 0.03, w2 = 0.9 + n * 0.05, p1 = mr(0, 6), p2 = mr(0, 6), mid = kind === 'pitch' ? 0 : 0.5;
      const target = t => mid + A * (0.65 * Math.sin(t * w1 + p1) + 0.35 * Math.sin(t * w2 + p2));
      const range = kind === 'pitch' ? A + 4 : 0.5, toY = v => H / 2 - (v - mid) / range * (H / 2 - 12);
      let hist = [], disc = 0, sm = []; const rate = 100 / (13 + n * 0.45);
      return {
        update(dt, k) {
          const f = Mic.read(), t = ctx.elapsed(), tg = target(t);
          let v = null;
          if (kind === 'pitch') { if (f.voiced && f.level > 0.1) { sm.push(semis(f.pitch, Mic.base)); if (sm.length > 5) sm.shift(); v = sm.slice().sort((a, b) => a - b)[sm.length >> 1]; while (v - tg > 6) v -= 12; while (tg - v > 6) v += 12; } else sm = []; }
          else if (f.level > 0.04) v = f.level;
          const inBand = v != null && Math.abs(v - tg) <= hw;
          if (inBand) ctx.add(rate * ctx.speed() * dt * (k.state === 'look' ? 0.5 : 1));
          if (k.state === 'look' && !ctx.shielded()) { disc += inBand ? -dt / 1.4 : dt / 0.75; } else disc -= dt / 1.2;
          disc = clamp(disc, 0, 1); if (disc >= 1) ctx.caught(kind === 'pitch' ? 'offkey' : 'offlevel');
          $('#lu-d', el).style.width = (disc * 100) + '%';
          hist.push(v); if (hist.length > 160) hist.shift();
          c.clearRect(0, 0, W, H); const acc = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#9328ff';
          c.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 1; i < 6; i++) c.fillRect(0, H * i / 6, W, 1);
          c.beginPath(); for (let x = 0; x <= W; x += 6) { const tt = t + (x - W * 0.7) / 100; c.lineTo(x, toY(target(tt) + hw)); } for (let x = W; x >= 0; x -= 6) { const tt = t + (x - W * 0.7) / 100; c.lineTo(x, toY(target(tt) - hw)); }
          c.closePath(); c.globalAlpha = k.state === 'look' ? 0.55 : 0.32; c.fillStyle = k.state === 'look' ? '#e63946' : acc; c.fill(); c.globalAlpha = 1;
          c.strokeStyle = 'rgba(240,233,225,.85)'; c.lineWidth = 2.5; c.beginPath(); let pen = false;
          hist.forEach((hv, i) => { const x = W * 0.7 - (hist.length - 1 - i) * 1.6; if (hv == null) { pen = false; return; } const y = toY(clamp(hv, mid - range, mid + range)); pen ? c.lineTo(x, y) : c.moveTo(x, y); pen = true; }); c.stroke();
          const dy = v == null ? H - 10 : toY(clamp(v, mid - range, mid + range)); c.fillStyle = inBand ? '#f0e9e1' : '#e63946'; c.beginPath(); c.arc(W * 0.7, dy, 8, 0, 7); c.fill();
          $('#lu-c', el).textContent = v == null ? (k.state === 'look' ? 'SING! He\u2019s listening!' : 'Hum to fill the meter\u2026') : inBand ? 'On key\u2026' : (v > tg ? (kind === 'pitch' ? 'Too high, go lower' : 'Too loud, softer') : (kind === 'pitch' ? 'Too low, go higher' : 'Too soft, louder'));
        },
        isActive: () => false
      };
    }
  };
}
MINIS.lullaby_pitch = lullabyMini('pitch');
MINIS.lullaby_level = lullabyMini('level');

/* ---------- Impressions (comedy) ---------- */
const IMPRESSIONS = [
  { id: 'pig', name: 'a Pig', icon: 'piggy-bank', tip: 'Short snorty grunts. OINK. OINK.', fail: 'That was not a pig. That was a cry for help.' },
  { id: 'engine', name: 'a Car Engine', icon: 'car', tip: 'Low, rumbling and continuous. Brrrrrrmmm. Rev it up!', fail: 'Your engine stalled. So did your life.' },
  { id: 'siren', name: 'a Police Siren', icon: 'siren', tip: 'Sweep your voice up and down. Weee-ooo-weee-ooo.', fail: 'No one is coming. Least of all, the police.' },
  { id: 'cat', name: 'a Cat', icon: 'cat', tip: 'High meows that rise and fall. Meeoww!', fail: 'He is a dog person now. Thanks to you.' },
  { id: 'snake', name: 'a Snake', icon: 'worm', tip: 'A long, airy hiss. Ssssssss. No voice, just air.', fail: 'Hiss-terical. He didn\u2019t laugh.' },
  { id: 'ghost', name: 'a Ghost', icon: 'ghost', tip: 'Long, smooth, low wail. Ooooooooo.', fail: 'You\u2019ll make a much better ghost after this.' },
  { id: 'dog', name: 'a Dog', icon: 'dog', tip: 'Short, punchy barks. WOOF! WOOF!', fail: 'Bad dog. Very bad dog.' },
  { id: 'baby', name: 'a Crying Baby', icon: 'baby', tip: 'High, loud, sustained wail. Waaaaaah!', fail: 'Even the baby was more convincing. And it\u2019s fictional.' },
  { id: 'chicken', name: 'a Chicken', icon: 'bird', tip: 'Quick high clucks. Bawk! Bawk! Bawk!', fail: 'That chicken was undercooked.' },
  { id: 'owl', name: 'an Owl', icon: 'feather', tip: 'Soft, pure hoots with gaps. Hoo... hoo...', fail: 'Who? WHO? Not you. Not anymore.' }
];
const SCORE = {
  pig: (f, s) => f.loud && f.cent < 2400 && (f.flat > 0.1 || (f.voiced && f.pitch < 420)) ? (s.burst < 0.7 ? 1 : 0.25) : 0,
  engine: (f, s) => f.loud && s.burst > 0.35 && ((f.voiced && f.pitch < 230) || f.cent < 1300) ? 1 + (s.dSemi > 0 ? 0.3 : 0) : 0,
  siren: (f, s) => f.voiced && f.loud ? ((Math.abs(s.dSemi) > 2.5 && Math.abs(s.dSemi) < 45) ? 1 : 0.15) * (s.range > 5 ? 1.3 : 1) : 0,
  cat: (f, s) => f.voiced && f.loud && f.pitch >= 260 && f.pitch <= 1100 && s.burst < 1.8 ? 1 : 0,
  snake: f => f.level > 0.12 && !f.voiced && f.cent > 2800 && f.flat > 0.2 ? 1 : 0,
  ghost: (f, s) => f.voiced && f.level > 0.18 && f.pitch < 560 && s.burst > 0.5 && Math.abs(s.dSemi) < 14 ? 1 : 0,
  dog: () => 0, chicken: (f, s) => f.loud && f.voiced && f.pitch > 330 && s.burst < 0.4 ? 0.35 : 0, owl: () => 0,
  baby: (f, s) => f.voiced && f.loud && f.pitch > 320 && s.burst > 0.35 ? 1 : 0
};
const BURST = {
  dog: b => b.len > 0.05 && b.len < 0.5 && b.voiced > 0.25 ? 13 : 0,
  chicken: b => b.len > 0.04 && b.len < 0.4 && b.pitch > 260 ? 9 : 0,
  owl: b => b.len > 0.15 && b.len < 0.9 && b.voiced > 0.55 && b.flat < 0.25 && b.pitch > 110 && b.pitch < 560 ? 16 : 0,
  pig: b => b.len > 0.06 && b.len < 0.6 ? 5 : 0,
  cat: b => b.len > 0.25 && b.len < 1.6 && b.voiced > 0.5 ? 6 : 0
};
function impressMini(imp) {
  return {
    id: 'impress', imp, name: 'The Audition', room: 'room_kitchen', icon: imp.icon, noBtn: true, noKiller: true, voice: true, view: 'judge',
    labels: { away: 'Judging', warn: 'Judging', look: 'JUDGING' },
    hint: 'Mr. Hush wants entertainment. Fill the meter before the candle burns down. Fail and\u2026 well.',
    limit: n => Math.max(6.5, 11 - n * 0.3) + 2.2,
    mount(el, ctx) {
      el.innerHTML = `<div class="mg mg-imp"><p class="imp-ask">Sound like</p><div class="imp-card" data-testid="mg-impress-target"><i data-lucide="${imp.icon}"></i><b>${esc(imp.name)}</b></div><p class="imp-tip">${esc(imp.tip)}</p>
        <div class="lu-row"><span>Convincing</span><div class="meter big"><i id="im-m" data-testid="mg-impress-meter"></i></div></div><p class="mg-cap" id="im-c">Get ready\u2026</p></div>`;
      icons(); const need = 3 + ctx.night * 0.12, st = { burst: 0, dSemi: 0, range: 0, lastSemi: null, ps: [], b: null }; let meter = 0, ready = 2.2, gainAvg = 0;
      const upd = (dt) => {
        const f = Mic.read(); f.loud = f.level > 0.26; const t = now();
        if (f.voiced) { const sm = semis(f.pitch, 200); st.dSemi = st.lastSemi == null ? 0 : (sm - st.lastSemi) / Math.max(dt, 0.008); st.lastSemi = sm; st.ps.push([t, sm]); } else { st.lastSemi = null; st.dSemi = 0; }
        st.ps = st.ps.filter(p => t - p[0] < 2); st.range = st.ps.length ? Math.max(...st.ps.map(p => p[1])) - Math.min(...st.ps.map(p => p[1])) : 0;
        if (f.loud || f.level > 0.12 && imp.id === 'snake') { if (!st.b) st.b = { t0: t, n: 0, v: 0, p: 0, fl: 0 }; st.b.n++; st.b.v += f.voiced ? 1 : 0; st.b.p += f.pitch; st.b.fl += f.flat; st.burst = t - st.b.t0; }
        else if (st.b) { const b = st.b, len = t - b.t0; st.b = null; st.burst = 0; const bonus = (BURST[imp.id] || (() => 0))({ len, voiced: b.v / b.n, pitch: b.v ? b.p / Math.max(1, b.v) : 0, flat: b.fl / b.n }); if (bonus) { meter += bonus; pulse(); } }
        const g = (SCORE[imp.id] || (() => 0))(f, st) + (f.loud ? 0.08 : 0); gainAvg += (g - gainAvg) * 0.1;
        meter += g * dt * 100 / need; return f;
      };
      const pulse = () => { const m = $('#im-m', el); m.classList.remove('pulse'); void m.offsetWidth; m.classList.add('pulse'); };
      return {
        update(dt) {
          if (ready > 0) { ready -= dt; $('#im-c', el).textContent = ready > 0 ? 'Get ready\u2026 ' + Math.ceil(ready) : 'GO!'; Mic.read(); return; }
          upd(dt); meter = clamp(meter, 0, 100); ctx.set(meter); $('#im-m', el).style.width = meter + '%';
          $('#im-c', el).textContent = gainAvg > 0.6 ? 'He leans in, delighted.' : gainAvg > 0.25 ? 'He tilts his head\u2026 keep going.' : Mic.f.level > 0.15 ? 'He is NOT convinced.' : 'Well? He\u2019s waiting.';
        },
        isActive: () => false
      };
    }
  };
}
