import { Platform } from "react-native";

export type AudioAnalysis = { duration: number; onsets: number[]; strengths: number[]; bpm: number };

// Real onset detection using the Web Audio API. Decodes the file to PCM, builds an
// energy-novelty curve, and picks peaks — so notes land on actual hits and silent
// sections produce NO notes. Returns null on native (Expo Go has no decode API).
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

    const hop = Math.floor(sr * 0.011);      // ~11ms frames
    const win = hop * 2;
    const frames = Math.floor((ch.length - win) / hop);
    const energy = new Float32Array(Math.max(0, frames));
    let globalMax = 1e-6;
    for (let i = 0; i < frames; i++) {
      let sum = 0; const start = i * hop;
      for (let j = 0; j < win; j++) { const s = ch[start + j]; sum += s * s; }
      const e = Math.sqrt(sum / win);
      energy[i] = e; if (e > globalMax) globalMax = e;
    }

    // Spectral-flux-like novelty: positive energy differences.
    const novelty = new Float32Array(frames);
    for (let i = 1; i < frames; i++) novelty[i] = Math.max(0, energy[i] - energy[i - 1]);

    // Adaptive peak-pick with a silence gate.
    const silenceGate = globalMax * 0.06;
    const winAvg = 8;
    const minGap = 0.10; // seconds between onsets
    const onsets: number[] = []; const strengths: number[] = [];
    let lastT = -1;
    for (let i = 2; i < frames - 2; i++) {
      if (energy[i] < silenceGate) continue; // skip silence entirely
      let local = 0, n = 0;
      for (let k = i - winAvg; k <= i + winAvg; k++) { if (k >= 0 && k < frames) { local += novelty[k]; n++; } }
      const thresh = (local / Math.max(1, n)) * 1.5 + 1e-5;
      if (novelty[i] > thresh && novelty[i] >= novelty[i - 1] && novelty[i] >= novelty[i + 1]) {
        const t = (i * hop) / sr;
        if (t - lastT >= minGap) { onsets.push(t); strengths.push(novelty[i] / (globalMax + 1e-6)); lastT = t; }
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
    return { duration: audio.duration, onsets, strengths, bpm };
  } catch {
    return null;
  }
}

function mixToMono(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = (a[i] + b[i]) * 0.5;
  return out;
}
