let ctx;
export const sfx = { enabled: true };

const tone = (freqs, dur = 0.09, type = "triangle", gain = 0.08) => {
  if (!sfx.enabled) return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t = ctx.currentTime + i * dur;
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.6);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur * 1.8);
    });
  } catch (e) { /* audio unavailable */ }
};

sfx.correct = () => tone([523, 659, 784]);
sfx.wrong = () => tone([220, 165], 0.14, "sawtooth", 0.05);
sfx.coin = () => tone([988, 1319], 0.07, "square", 0.04);
sfx.achievement = () => tone([523, 659, 784, 1047, 1319], 0.1);
sfx.tick = () => tone([880], 0.03, "sine", 0.03);
