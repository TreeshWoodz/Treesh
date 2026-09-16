import { Platform } from "react-native";
import { createAudioPlayer, requestRecordingPermissionsAsync, setAudioModeAsync } from "expo-audio";

export type AudioAnalysis = { duration: number; onsets: number[]; strengths: number[]; lanes: number[]; bpm: number };

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Shared DSP core (platform-agnostic). Takes a mono PCM buffer + sample rate,
// splits it into four frequency bands with cheap one-pole filters, and picks
// peaks on a percussive-weighted novelty curve — so notes land on ACTUAL hits
// (drums/bass over vocals) and silent sections stay empty. Each onset also gets
// a LANE from its dominant band (bass→0, low-mid→1, high-mid→2, treble→3), so
// charts feel musical instead of random. Used by BOTH web (decodeAudioData) and
// native (expo-audio PCM sample listener) so device + web charts are identical.
// ---------------------------------------------------------------------------
export function computeAnalysis(ch: Float32Array, sr: number, durationHint = 0): AudioAnalysis {
  const duration = durationHint > 1 ? durationHint : ch.length / sr;

  // One-pole low-pass coefficients for the three split points (→ 4 bands).
  const a0 = 1 - Math.exp((-2 * Math.PI * 120) / sr);   // < 120 Hz  (kick / bass)
  const a1 = 1 - Math.exp((-2 * Math.PI * 600) / sr);   // 120-600   (low mids / snare body)
  const a2 = 1 - Math.exp((-2 * Math.PI * 3500) / sr);  // 600-3500  (vocals / leads)

  const hop = Math.max(1, Math.floor(sr * 0.011));      // ~11 ms frames
  const frames = Math.floor(ch.length / hop);
  if (frames < 8) return { duration, onsets: [], strengths: [], lanes: [], bpm: 120 };
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
  return { duration, onsets, strengths, lanes, bpm };
}

function mixToMono(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = (a[i] + b[i]) * 0.5;
  return out;
}

// ---------------------------------------------------------------------------
// WEB: decode the whole file to PCM via Web Audio, then run the shared core.
// Returns null on native (no AudioContext) — native uses analyzeAudioNative.
// ---------------------------------------------------------------------------
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
    const ch = audio.numberOfChannels > 1
      ? mixToMono(audio.getChannelData(0), audio.getChannelData(1))
      : audio.getChannelData(0);
    return computeAnalysis(ch, audio.sampleRate, audio.duration);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// NATIVE: there is no offline decode API, so we fast-play the track SILENTLY
// (volume 0, 2× speed — the platform max) while tapping expo-audio's real-time
// PCM sample listener. Every chunk is tagged with its song-timeline timestamp,
// so we concatenate them into one mono buffer and run the exact same DSP core.
// Nothing is recorded, saved, or uploaded — we only read the decoded buffer.
// onProgress reports 0..1 so the UI can show an "analysing" bar.
// ---------------------------------------------------------------------------
const ANALYZE_RATE = 2.0;         // platform-capped max playback rate
const MAX_ANALYZE_SAMPLES = 48000 * 330; // hard cap (~5.5 min) to bound memory

export async function analyzeAudioNative(uri: string, durationHint = 0, onProgress?: (p: number) => void): Promise<AudioAnalysis | null> {
  if (Platform.OS === "web") return null;
  let player: any = null;
  const restoreMode = async () => { try { await setAudioModeAsync({ allowsRecording: false }); } catch {} };
  try {
    try { await requestRecordingPermissionsAsync(); } catch {}
    try { await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true }); } catch {}

    player = createAudioPlayer({ uri });
    for (let i = 0; i < 50 && !player.isLoaded; i++) await sleep(80);
    if (!player.isLoaded || !player.isAudioSamplingSupported) { try { player.remove(); } catch {} await restoreMode(); return null; }

    const chunks: Float32Array[] = [];
    const stamps: number[] = [];
    let collected = 0;
    let capped = false;

    const sub = player.addListener("audioSampleUpdate", (s: any) => {
      if (capped) return;
      const chs = s?.channels; if (!chs || !chs.length || !chs[0]?.frames) return;
      const len = chs[0].frames.length; if (!len) return;
      const mono = new Float32Array(len);
      if (chs.length > 1 && chs[1]?.frames) { const a = chs[0].frames, b = chs[1].frames; for (let i = 0; i < len; i++) mono[i] = (a[i] + b[i]) * 0.5; }
      else { const a = chs[0].frames; for (let i = 0; i < len; i++) mono[i] = a[i]; }
      chunks.push(mono); stamps.push(typeof s.timestamp === "number" ? s.timestamp : 0);
      collected += len; if (collected >= MAX_ANALYZE_SAMPLES) capped = true;
    });

    player.setAudioSamplingEnabled(true);
    player.volume = 0;
    try { player.shouldCorrectPitch = false; } catch {}
    try { await player.seekTo(0); } catch {}
    try { player.setPlaybackRate(ANALYZE_RATE); } catch {}
    player.play();

    const dur = durationHint > 1 ? durationHint : (player.duration > 1 ? player.duration : 0);
    const startedWall = Date.now();
    const maxWall = dur > 0 ? (dur / ANALYZE_RATE) * 1000 + 6000 : 120000;
    let lastCur = -1, lastMoveWall = Date.now();
    while (true) {
      await sleep(120);
      const cur = player.currentTime || (stamps.length ? stamps[stamps.length - 1] : 0);
      if (onProgress && dur > 0) onProgress(Math.max(0, Math.min(1, cur / dur)));
      if (cur > lastCur + 0.01) { lastCur = cur; lastMoveWall = Date.now(); }
      const reachedEnd = dur > 0 && cur >= dur - 0.3;
      const stalled = cur > 0.5 && Date.now() - lastMoveWall > 1400;   // playback finished / stopped advancing
      if (capped || reachedEnd || stalled) break;
      if (Date.now() - startedWall > maxWall) break;
    }
    try { sub?.remove?.(); } catch {}
    try { player.pause(); } catch {}
    try { player.remove(); } catch {}
    await restoreMode();

    let totalLen = 0; for (const c of chunks) totalLen += c.length;
    if (totalLen < 2000) return null;

    // Derive sample rate from the timeline: consecutive chunk timestamps differ by (framesLen / sr).
    let sr = 44100;
    if (stamps.length > 3) {
      const span = stamps[stamps.length - 1] - stamps[1];
      let framesBetween = 0; for (let i = 2; i < chunks.length; i++) framesBetween += chunks[i - 1].length;
      if (span > 0.1 && framesBetween > 0) { const est = Math.round(framesBetween / span); if (est >= 8000 && est <= 96000) sr = est; }
    }

    const mono = new Float32Array(totalLen);
    let off = 0; for (const c of chunks) { mono.set(c, off); off += c.length; }
    chunks.length = 0;
    return computeAnalysis(mono, sr, dur || totalLen / sr);
  } catch {
    try { player?.remove?.(); } catch {}
    await restoreMode();
    return null;
  }
}
