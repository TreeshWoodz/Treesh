/* Chainz audio: 100% synthesized with WebAudio (no external files -> works offline, zero loading) */
let ctx = null;
let master = null;
let vol = 0.8;
let sfxOn = true;
let pack = "snd_soft";
let musicOn = false;
let musicTimer = null;
let musicGain = null;

function ac() {
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = vol;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}
export function unlockAudio() { ac(); }
export function configureAudio({ volume, sfx, sound, music } = {}) {
  if (typeof volume === "number") { vol = Math.max(0, Math.min(1, volume / 100)); if (master) master.gain.value = vol; }
  if (typeof sfx === "boolean") sfxOn = sfx;
  if (sound) pack = sound;
  if (typeof music === "boolean" && music !== musicOn) { musicOn = music; if (music) startMusic(); else stopMusic(); }
}

function tone({ f = 440, f2, type = "sine", t = 0, d = 0.12, g = 0.2, attack = 0.004, dest }) {
  const c = ac(); if (!c) return;
  const now = c.currentTime + t;
  const o = c.createOscillator();
  const gn = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, now);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), now + d);
  gn.gain.setValueAtTime(0.0001, now);
  gn.gain.linearRampToValueAtTime(g, now + attack);
  gn.gain.exponentialRampToValueAtTime(0.0001, now + d);
  o.connect(gn); gn.connect(dest || master);
  o.start(now); o.stop(now + d + 0.05);
}
function noise({ t = 0, d = 0.05, g = 0.15, hp = 1500 }) {
  const c = ac(); if (!c) return;
  const now = c.currentTime + t;
  const len = Math.floor(c.sampleRate * d);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = hp;
  const gn = c.createGain(); gn.gain.value = g;
  src.connect(f); f.connect(gn); gn.connect(master);
  src.start(now);
}

const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
export function sfxKey(special) {
  if (!sfxOn) return;
  const r = Math.random();
  switch (pack) {
    case "snd_type": noise({ d: 0.035, g: 0.22, hp: 2200 }); tone({ f: special ? 180 : 240, type: "square", d: 0.03, g: 0.05 }); break;
    case "snd_bubble": tone({ f: 500 + r * 300, f2: 1200 + r * 400, type: "sine", d: 0.09, g: 0.16 }); break;
    case "snd_synth": tone({ f: PENTA[Math.floor(r * PENTA.length)] / 2, type: "sawtooth", d: 0.12, g: 0.06 }); break;
    case "snd_chime": tone({ f: PENTA[Math.floor(r * PENTA.length)] * 1.5, type: "triangle", d: 0.25, g: 0.08 }); break;
    case "snd_8bit": tone({ f: special ? 330 : 660 + Math.floor(r * 4) * 110, type: "square", d: 0.05, g: 0.05 }); break;
    default: tone({ f: special ? 320 : 420 + r * 60, f2: 300, type: "sine", d: 0.06, g: 0.12 });
  }
}
export function sfxCorrect(streak = 1) {
  if (!sfxOn) return;
  const base = 523.25 * Math.pow(2, Math.min(streak, 12) / 24);
  tone({ f: base, type: "triangle", d: 0.14, g: 0.18 });
  tone({ f: base * 1.25, type: "triangle", t: 0.07, d: 0.14, g: 0.16 });
  tone({ f: base * 1.5, type: "sine", t: 0.14, d: 0.3, g: 0.14 });
}
export function sfxWrong() {
  if (!sfxOn) return;
  tone({ f: 220, f2: 110, type: "sawtooth", d: 0.22, g: 0.09 });
  tone({ f: 233, f2: 116, type: "square", d: 0.22, g: 0.04 });
}
export function sfxCombo() {
  if (!sfxOn) return;
  [0, 0.06, 0.12, 0.18, 0.24].forEach((t, i) => tone({ f: PENTA[i] * 1, type: "triangle", t, d: 0.18, g: 0.14 }));
}
export function sfxTick(urgent) { if (sfxOn) tone({ f: urgent ? 1200 : 900, type: "sine", d: 0.04, g: urgent ? 0.1 : 0.05 }); }
export function sfxCount() { if (sfxOn) tone({ f: 660, type: "sine", d: 0.12, g: 0.16 }); }
export function sfxGo() { if (!sfxOn) return; tone({ f: 880, type: "triangle", d: 0.35, g: 0.2 }); tone({ f: 1320, type: "sine", t: 0.02, d: 0.35, g: 0.12 }); }
export function sfxCoin() { if (!sfxOn) return; tone({ f: 987.77, type: "square", d: 0.08, g: 0.06 }); tone({ f: 1318.5, type: "square", t: 0.07, d: 0.22, g: 0.06 }); }
export function sfxUnlock() { if (!sfxOn) return; [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone({ f, type: "triangle", t: i * 0.08, d: 0.4, g: 0.12 })); }
export function sfxGameOver() { if (!sfxOn) return; [392, 349.23, 311.13, 261.63].forEach((f, i) => tone({ f, type: "triangle", t: i * 0.14, d: 0.4, g: 0.12 })); }
export function sfxPower() { if (!sfxOn) return; tone({ f: 300, f2: 1200, type: "sine", d: 0.25, g: 0.12 }); }
export function sfxTap() { if (sfxOn) tone({ f: 600, f2: 450, type: "sine", d: 0.05, g: 0.07 }); }

/* ---- gentle generative ambient music ---- */
const CHORDS = [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66], [164.81, 207.65, 246.94]];
function startMusic() {
  const c = ac(); if (!c) return;
  stopMusic();
  musicGain = c.createGain(); musicGain.gain.value = 0.35; musicGain.connect(master);
  let i = 0;
  const play = () => {
    const ch = CHORDS[i % CHORDS.length];
    ch.forEach((f) => tone({ f: f / 2, type: "sine", d: 3.8, g: 0.05, attack: 1.2, dest: musicGain }));
    [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].forEach((t, k) => { if (Math.random() > 0.35) tone({ f: ch[k % 3] * 2, type: "triangle", t, d: 0.4, g: 0.025, dest: musicGain }); });
    i++;
  };
  play();
  musicTimer = setInterval(play, 4000);
}
function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (musicGain) { try { musicGain.disconnect(); } catch (e) { /* noop */ } musicGain = null; }
}

export function haptic(ms, enabled) {
  if (!enabled) return;
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* noop */ }
}
