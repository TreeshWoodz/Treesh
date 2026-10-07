let ctx;
const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5];

function tone(freq, dur = 0.09, type = "sine", vol = 0.07, delay = 0) {
  if (!sfx.enabled) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur);
  } catch (e) {
    /* audio unavailable */
  }
}

export const sfx = {
  enabled: true,
  swap: () => tone(330, 0.06, "triangle", 0.05),
  bad: () => tone(160, 0.15, "sawtooth", 0.04),
  match: (combo) => {
    const i = Math.min(combo - 1, NOTES.length - 2);
    tone(NOTES[i], 0.12, "triangle", 0.07);
    tone(NOTES[i + 1] * 1.5, 0.1, "sine", 0.03, 0.04);
  },
  coin: () => {
    tone(988, 0.08, "square", 0.03);
    tone(1319, 0.14, "square", 0.03, 0.07);
  },
  win: () => [0, 2, 4, 5, 7].forEach((n, i) => tone(NOTES[n], 0.22, "triangle", 0.07, i * 0.1)),
  lose: () => [4, 2, 0].forEach((n, i) => tone(NOTES[n] / 2, 0.25, "sine", 0.06, i * 0.15)),
};
