let ctx;

const soundOn = () => {
  try {
    const p = JSON.parse((localStorage.getItem("treesh_sonoku_v1") || localStorage.getItem("sonoko_profile_v1")));
    return p?.sound !== false;
  } catch {
    return true;
  }
};

function tone(freq, dur = 0.12, type = "sine", vol = 0.07, delay = 0) {
  if (!soundOn()) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch (e) {
    /* audio unavailable */
  }
}

const seq = (notes, type = "triangle", gap = 0.09, dur = 0.14, vol = 0.07) =>
  notes.forEach((f, i) => tone(f, dur, type, vol, i * gap));

export const sfx = {
  select: () => tone(460, 0.05, "sine", 0.04),
  play: () => seq([520, 780], "triangle", 0.06, 0.1),
  combo: () => seq([660, 880, 990], "triangle", 0.05, 0.1),
  error: () => tone(160, 0.2, "sawtooth", 0.05),
  draw: () => tone(300, 0.08, "square", 0.03),
  call: () => seq([660, 880, 1100, 1320], "square", 0.07, 0.12, 0.05),
  win: () => seq([523, 659, 784, 1046, 1318], "triangle", 0.11, 0.22, 0.08),
  lose: () => seq([400, 320, 240, 180], "sine", 0.14, 0.24, 0.07),
  unlock: () => seq([784, 988, 1318], "sine", 0.09, 0.16, 0.06),
};
