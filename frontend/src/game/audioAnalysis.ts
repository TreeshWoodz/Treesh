import { Platform } from "react-native";

export type AudioAnalysis = { duration: number; onsets: number[]; strengths: number[]; lanes: number[]; bpm: number };

// Real, frequency-aware onset detection (Web Audio). Decodes to PCM, splits the signal into
// four frequency bands with cheap one-pole filters, and picks peaks on a percussive-weighted
// novelty curve — so notes land on ACTUAL hits (drums/bass over vocals) and silent sections stay
// empty. Each onset also gets a LANE from its dominant band (bass→0, low-mid→1, high-mid→2,
// treble→3), so charts feel musical instead of random. Returns null on native (no decode API).
export async function analyzeAudio(uri: string): Promise<AudioAnalysis | null> {
  if (Platform.OS !== "web" || typeof window === "undefined") return null;
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return null;
    const res = await fetch(uri);
    const buf = await res.arrayBuffer();
    const ctx = new AudioCtx();
    const audio: AudioBuffer = await ctx.decodeAudioData(buf.slice(0));
    ctx.close?.();

    const sr = audio.sampleRate;
    const ch = audio.numberOfChannels > 1
      ? mixToMono(audio.getChannelData(0), audio.getChannelData(1))
      : audio.getChannelData(0);

    // One-pole low-pass coefficients for the three split points (→ 4 bands).
    const a0 = 1 - Math.exp((-2 * Math.PI * 120) / sr);   // < 120 Hz  (kick / bass)
    const a1 = 1 - Math.exp((-2 * Math.PI * 600) / sr);   // 120-600   (low mids / snare body)
    const a2 = 1 - Math.exp((-2 * Math.PI * 3500) / sr);  // 600-3500  (vocals / leads)

    const hop = Math.max(1, Math.floor(sr * 0.011));      // ~11 ms frames
    const frames = Math.floor(ch.length / hop);
    const be = [new Float32Array(frames), new Float32Array(frames), new Float32Array(frames), new Float32Array(frames)];
    const total = new Float32Array(frames);
    let globalMax = 1e-6;
    let lp0 = 0, lp1 = 0, lp2 = 0;
    for (let f = 0; f < frames; f++) {
      let acc0 = 0, acc1 = 0, acc2 = 0, acc3 = 0, accT = 0;
      const start = f * hop;
      for (let j = 0; j < hop; j++) {
        const x = ch[start + j];
        lp0 += a0 * (x - lp0); lp1 += a1 * (x - lp1); lp2 += a2 * (x - lp2);
        const s0 = lp0, s1 = lp1 - lp0, s2 = lp2 - lp1, s3 = x - lp2;
        acc0 += s0 * s0; acc1 += s1 * s1; acc2 += s2 * s2; acc3 += s3 * s3; accT += x * x;
      }
      be[0][f] = Math.sqrt(acc0 / hop); be[1][f] = Math.sqrt(acc1 / hop); be[2][f] = Math.sqrt(acc2 / hop); be[3][f] = Math.sqrt(acc3 / hop);
      const tt = Math.sqrt(accT / hop); total[f] = tt; if (tt > globalMax) globalMax = tt;
    }

    // Per-band positive novelty (spectral-flux-like) + combined curve that favours the instrumental
    // groove: down-weight the vocal-heavy mid band, emphasise low (kick/bass) and high (hats).
    const bw = [1.15, 0.95, 0.5, 1.0];
    const nov = [new Float32Array(frames), new Float32Array(frames), new Float32Array(frames), new Float32Array(frames)];
    const combined = new Float32Array(frames);
    for (let b = 0; b < 4; b++) for (let f = 1; f < frames; f++) nov[b][f] = Math.max(0, be[b][f] - be[b][f - 1]);
    for (let f = 1; f < frames; f++) combined[f] = bw[0] * nov[0][f] + bw[1] * nov[1][f] + bw[2] * nov[2][f] + bw[3] * nov[3][f];

    const silenceGate = globalMax * 0.06;
    const winAvg = 9;
    const minGap = 0.11; // seconds
    const onsets: number[] = []; const strengths: number[] = []; const lanes: number[] = [];
    let lastT = -1;
    for (let i = 2; i < frames - 2; i++) {
      if (total[i] < silenceGate) continue;             // skip silence entirely
      let local = 0, n = 0;
      for (let k = i - winAvg; k <= i + winAvg; k++) { if (k >= 0 && k < frames) { local += combined[k]; n++; } }
      const thresh = (local / Math.max(1, n)) * 1.6 + 1e-5;
      if (combined[i] > thresh && combined[i] >= combined[i - 1] && combined[i] >= combined[i + 1]) {
        const t = (i * hop) / sr;
        if (t - lastT >= minGap) {
          // Lane = dominant band's raw novelty at this instant → maps the sound to a lane.
          let lane = 0, top = -1;
          for (let b = 0; b < 4; b++) { const v = nov[b][i]; if (v > top) { top = v; lane = b; } }
          onsets.push(t); strengths.push(combined[i] / (globalMax + 1e-6)); lanes.push(lane); lastT = t;
        }
      }
    }

    // Rough BPM from the median inter-onset interval.
    let bpm = 120;
    if (onsets.length > 4) {
      const gaps = []; for (let i = 1; i < onsets.length; i++) gaps.push(onsets[i] - onsets[i - 1]);
      gaps.sort((a, b) => a - b);
      const med = gaps[Math.floor(gaps.length / 2)] || 0.5;
      let b = 60 / med; while (b < 90) b *= 2; while (b > 180) b /= 2;
      bpm = Math.round(b);
    }
    return { duration: audio.duration, onsets, strengths, lanes, bpm };
  } catch {
    return null;
  }
}

function mixToMono(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = (a[i] + b[i]) * 0.5;
  return out;
}
