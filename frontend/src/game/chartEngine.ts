import { Chart, Difficulty, Note } from "./types";

// Per-difficulty musical config: subdivision of the beat, base note density,
// how strongly to favour on-beat notes, and how often to place holds/waves/chords.
const config: Record<Difficulty, { div: number; density: number; downbeatBias: number; holdEvery: number; waveEvery: number; chord: number }> = {
  Easy: { div: 1, density: 0.55, downbeatBias: 1.0, holdEvery: 4, waveEvery: 8, chord: 0 },
  Normal: { div: 2, density: 0.52, downbeatBias: 0.5, holdEvery: 4, waveEvery: 8, chord: 0 },
  Hard: { div: 2, density: 0.74, downbeatBias: 0.28, holdEvery: 3, waveEvery: 6, chord: 0.12 },
  Expert: { div: 4, density: 0.66, downbeatBias: 0.12, holdEvery: 3, waveEvery: 6, chord: 0.18 },
  Custom: { div: 2, density: 0.6, downbeatBias: 0.4, holdEvery: 4, waveEvery: 8, chord: 0 },
};

function seeded(seed: number) {
  let value = seed || 1;
  return () => ((value = (value * 16807) % 2147483647) - 1) / 2147483646;
}

// Build a wavy path that sweeps clearly across lanes so the player must TRACE it (not just hold).
// x is normalized 0..1 across the highway; a swing wider than one lane (0.25) guarantees a lane change.
function wavePath(lane: number, time: number, dur: number, dir: number): { t: number; x: number }[] {
  const center = (lane + 0.5) / 4;
  const swing = 0.32; // ~2.5 lanes peak-to-peak — clearly crosses lanes without sweeping edge to edge
  return Array.from({ length: 9 }, (_, k) => {
    const f = k / 8;
    const x = center + dir * Math.sin(f * Math.PI * 2) * swing;
    return { t: time + dur * f, x: Math.max(0.06, Math.min(0.94, x)) };
  });
}

export function estimateBpm(fileName: string, duration = 30) {
  const hash = [...fileName].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const durationBias = Math.round(duration) % 17;
  return 92 + ((hash + durationBias) % 58);
}

// Clamp every hold/wavy so it ends just before the next note in the same lane (no overlapping sustains).
// Swipe (flick) notes: turn a share of well-spaced taps into arrow notes on Normal+ (none on Easy).
// Only isolated taps qualify (room before/after, no chord partner) so the flick is always readable.
const SWIPE_FRAC: Record<string, number> = { Easy: 0, Normal: 0.07, Hard: 0.1, Expert: 0.13, Custom: 0 };
export function addSwipes(notes: Note[], difficulty: Difficulty, random: () => number): Note[] {
  const frac = SWIPE_FRAC[difficulty] ?? 0; if (!frac) return notes;
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  let lastSwipe = -10;
  sorted.forEach((n, i) => {
    if (n.type !== "tap") return;
    const prev = sorted[i - 1], next = sorted[i + 1];
    if ((prev && n.time - prev.time < 0.22) || (next && next.time - n.time < 0.34) || n.time - lastSwipe < 1.2) return;
    if (random() >= frac * 2.2) return;
    const r = random();
    n.type = "swipe"; n.dir = n.lane === 0 ? (r < 0.6 ? "left" : "up") : n.lane === 3 ? (r < 0.6 ? "right" : "up") : r < 0.5 ? "up" : r < 0.75 ? "left" : "right";
    lastSwipe = n.time;
  });
  return notes;
}

export function clampHolds(notes: Note[]): Note[] {
  const sorted = [...notes].sort((a, b) => a.time - b.time);
  const lanes: Record<number, Note[]> = { 0: [], 1: [], 2: [], 3: [] };
  for (const n of sorted) lanes[n.lane]?.push(n);
  for (const lane of Object.values(lanes)) {
    for (let i = 0; i < lane.length; i++) {
      const n = lane[i]; if (!n.duration) continue;
      const next = lane[i + 1];
      if (next) n.duration = Math.max(0.16, Math.min(n.duration, next.time - n.time - 0.08));
    }
  }
  return sorted;
}

export type OnsetData = { onsets: number[]; strengths: number[]; lanes?: number[]; bpm: number };

// Turn detected onsets into a playable chart — notes land on real hits, silence stays empty,
// and each note's LANE comes from the audio's frequency band (bass→0 … treble→3) so it feels
// musical. A light anti-repeat nudge avoids long runs stuck in one lane.
// Tempo + beat phase from the onset list: autocorrelate an onset envelope over 70-180 BPM (biased
// toward ~120 to avoid octave errors), then pick the grid offset that lands on the strongest onsets.
export function beatGrid(onsets: number[], strengths: number[], duration: number) {
  const res = 0.01; const N = Math.ceil(duration / res) + 2; const env = new Float32Array(N); const idx: number[] = [];
  onsets.forEach((t, i) => { const k = Math.round(t / res); if (k > 0 && k < N - 1) { env[k] += strengths[i] || 0.5; idx.push(k); } });
  let bestLag = 50, bestScore = -1;
  for (let lag = 33; lag <= 86; lag++) {
    let sc = 0; for (const k of idx) { const j = k + lag; if (j < N - 1) sc += env[k] * (env[j] + 0.5 * (env[j - 1] + env[j + 1])); }
    const bpm = 6000 / lag; sc *= Math.exp(-0.5 * Math.pow(Math.log2(bpm / 120) / 0.9, 2));
    if (sc > bestScore) { bestScore = sc; bestLag = lag; }
  }
  // Refine the (10 ms-quantised) period ±2.5% together with the phase so the grid doesn't drift over long songs.
  const coarse = bestLag * res; let period = coarse, offset = 0, bs = -1;
  for (let pp = coarse * 0.975; pp <= coarse * 1.025; pp += 0.0005) {
    for (let off = 0; off < pp; off += 0.005) {
      let sc = 0; for (let i = 0; i < onsets.length; i++) { const d = (((onsets[i] - off) % pp) + pp) % pp; const dd = Math.min(d, pp - d); sc += (strengths[i] || 0.5) * Math.exp(-(dd * dd) / 0.0008); }
      if (sc > bs) { bs = sc; offset = off; period = pp; }
    }
  }
  return { period, offset };
}

function chartFromOnsets(songId: string, difficulty: Difficulty, duration: number, data: OnsetData): Chart {
  const cfg = config[difficulty] ?? config.Normal;
  const seed = [...`${songId}${difficulty}`].reduce((sum, char) => sum + char.charCodeAt(0), 1);
  const random = seeded(seed);
  // Keep only the strongest onsets (the instrumental groove/beat) — sparser on Easy, fuller on Expert.
  const keepFrac = difficulty === "Easy" ? 0.22 : difficulty === "Normal" ? 0.42 : difficulty === "Hard" ? 0.7 : 1;
  // Minimum spacing between placed notes so lower difficulties stay comfortably followable.
  const minGap = difficulty === "Easy" ? 0.5 : difficulty === "Normal" ? 0.32 : difficulty === "Hard" ? 0.2 : 0.13;
  const strengthSorted = [...data.strengths].sort((a, b) => b - a);
  const cutoff = strengthSorted[Math.min(strengthSorted.length - 1, Math.floor(strengthSorted.length * keepFrac))] ?? 0;
  const raw = data.onsets.map((t, i) => ({ t, s: data.strengths[i], lane: data.lanes?.[i] ?? -1 })).filter(o => o.s >= cutoff && o.t > 0.05);
  // Snap every kept onset onto the song's beat grid (beats on Easy, 8ths on Normal, 16ths on Hard/Expert)
  // so notes land exactly in rhythm; onsets far from any grid line (noise / vocal smears) are dropped.
  const { period, offset } = beatGrid(data.onsets, data.strengths, duration);
  const sub = difficulty === "Easy" ? 1 : difficulty === "Normal" ? 2 : 4;
  const step = period / sub; const tol = Math.min(0.075, step * 0.42);
  const slots = new Map<number, { t: number; s: number; lane: number }>();
  for (const o of raw) {
    const g = Math.round((o.t - offset) / step); const ts = offset + g * step;
    if (Math.abs(ts - o.t) > tol || ts < 0.05) continue;
    // On Normal+, favour on-beat slots slightly so the chart follows the pulse of the song.
    const w = o.s * (g % sub === 0 ? 1.25 : 1);
    const prev = slots.get(g); if (!prev || w > prev.s) slots.set(g, { t: ts, s: w, lane: o.lane });
  }
  const picks = [...slots.values()].sort((a, b) => a.t - b.t);

  const notes: Note[] = [];
  let id = 0; let lane = Math.floor(random() * 4); let dir = random() < 0.5 ? 1 : -1; let lastLaneT = -1; let repeat = 0;
  for (let i = 0; i < picks.length; i++) {
    const time = picks[i].t;
    if (time < 0.05 || time > duration - 0.3) continue;
    if (time - lastLaneT < minGap) continue; // enforce difficulty spacing
    lastLaneT = time;
    const gap = (picks[i + 1]?.t ?? time + 1) - time; // silence/space until next hit
    // Lane straight from the audio's dominant frequency band; nudge if it repeats too long.
    if (picks[i].lane >= 0) { const bl = picks[i].lane; repeat = bl === lane ? repeat + 1 : 0; lane = repeat >= 3 ? (bl + (random() < 0.5 ? 1 : 3)) % 4 : bl; }
    else { const r = random(); if (r < 0.62) lane = (lane + dir + 4) % 4; else if (r < 0.82) { dir = -dir; lane = (lane + dir + 4) % 4; } else lane = Math.floor(random() * 4); }
    const base = { id: `${songId}-${difficulty}-${id++}`, time, lane };
    // Long gaps → sustained note; big gaps on strong beats → wave that snakes across lanes.
    if (gap > 1.1 && random() < 0.5) {
      const dur = Math.min(gap - 0.2, 1.6);
      const wdir = random() < 0.5 ? 1 : -1;
      notes.push({ ...base, type: "wavy", duration: dur, path: wavePath(lane, time, dur, wdir) });
    } else if (gap > 0.62) {
      notes.push({ ...base, type: "hold", duration: Math.min(gap - 0.15, 1.2) });
    } else {
      notes.push({ ...base, type: "tap" });
      if (cfg.chord > 0 && picks[i].s > cutoff * 1.5 && random() < cfg.chord) notes.push({ id: `${songId}-${difficulty}-${id++}`, time, lane: (lane + 2) % 4, type: "tap" });
    }
  }
  const waveform = Array.from({ length: 96 }, (_, i) => Math.min(1, 0.16 + Math.abs(Math.sin(i * 0.42)) + random() * 0.15));
  return { songId, difficulty, bpm: Math.round(60 / period) || data.bpm || 120, duration, notes: addSwipes(clampHolds(notes), difficulty, random), waveform };
}

export function generateChart(songId: string, fileName: string, duration: number, difficulty: Difficulty, onsetData?: OnsetData | null): Chart {
  if (onsetData && onsetData.onsets.length > 6) return chartFromOnsets(songId, difficulty, duration, onsetData);
  const cfg = config[difficulty] ?? config.Normal;
  const bpm = estimateBpm(fileName, duration);
  const beat = 60 / bpm;
  const step = beat / cfg.div;
  const seed = [...`${songId}${difficulty}`].reduce((sum, char) => sum + char.charCodeAt(0), 1);
  const random = seeded(seed);
  const notes: Note[] = [];
  let id = 0;
  const start = Math.max(beat * 2, duration * 0.04);
  const end = duration - beat * 1.5;
  const slotsPerBar = cfg.div * 4;
  let lane = Math.floor(random() * 4);
  let dir = random() < 0.5 ? 1 : -1;
  let bar = -1;

  const totalSlots = Math.max(0, Math.floor((end - start) / step));
  for (let i = 0; i <= totalSlots; i++) {
    const time = start + i * step;
    if (time >= end) break;
    const slotInBar = i % slotsPerBar;
    if (slotInBar === 0) bar++;
    const isDown = i % cfg.div === 0;                 // sits on a beat
    const isBarStart = slotInBar === 0;
    const beatInBar = Math.floor(slotInBar / cfg.div); // 0..3

    // Musical arc: 8-bar sections build toward the middle then breathe; intro/outro stay sparse.
    const arc = 0.16 * Math.sin(((bar % 8) / 8) * Math.PI);
    const intro = time < duration * 0.12 ? -0.22 : 0;
    const outro = time > duration * 0.92 ? -0.15 : 0;
    let p = cfg.density + arc + intro + outro;
    if (!isDown) p -= cfg.downbeatBias;               // fewer off-beat notes
    if (isDown && (beatInBar === 1 || beatInBar === 3)) p += 0.15; // backbeat emphasis

    // Wave sweep at phrase transitions (top of every `waveEvery` bars).
    if (isBarStart && bar > 0 && bar % cfg.waveEvery === 0) {
      lane = (lane + dir + 4) % 4;
      const wdur = beat * 1.5;
      notes.push({ id: `${songId}-${difficulty}-${id++}`, time, lane, type: "wavy", duration: wdur, path: wavePath(lane, time, wdur, dir) });
      continue;
    }
    // Long note on the first downbeat of every `holdEvery` bars.
    if (isDown && beatInBar === 0 && bar > 0 && bar % cfg.holdEvery === 0) {
      lane = (lane + dir + 4) % 4;
      notes.push({ id: `${songId}-${difficulty}-${id++}`, time, lane, type: "hold", duration: beat * (1 + Math.floor(random() * 2)) });
      continue;
    }

    if (random() > Math.max(0.05, Math.min(0.98, p))) continue;

    // Lane movement — runs and zig-zags read as choreography, occasional leap for surprise.
    const r = random();
    if (r < 0.6) lane = (lane + dir + 4) % 4;
    else if (r < 0.8) { dir = -dir; lane = (lane + dir + 4) % 4; }
    else lane = Math.floor(random() * 4);

    notes.push({ id: `${songId}-${difficulty}-${id++}`, time, lane, type: "tap" });

    // Chords on strong downbeats for harder charts.
    if (cfg.chord > 0 && isDown && beatInBar === 0 && random() < cfg.chord) {
      notes.push({ id: `${songId}-${difficulty}-${id++}`, time, lane: (lane + 2) % 4, type: "tap" });
    }
  }

  const waveform = Array.from({ length: 96 }, (_, i) => Math.min(1, 0.16 + Math.abs(Math.sin(i * 0.42) * 0.55 + Math.sin(i * 0.13) * 0.25) + random() * 0.2));
  return { songId, difficulty, bpm, duration, notes: addSwipes(clampHolds(notes), difficulty, random), waveform };
}

export function trainingChart(): Chart {
  const notes: Note[] = Array.from({ length: 56 }, (_, index) => {
    const isHold = index % 12 === 7;
    const isWavy = index % 12 === 11;
    const time = 1.5 + index * 0.42;
    const lane = index % 4;
    const isSwipe = index % 12 === 3;
    const note: Note = { id: `warmup-${index}`, time, lane, type: isWavy ? "wavy" : isHold ? "hold" : isSwipe ? "swipe" : "tap", duration: isHold ? 0.82 : isWavy ? 1.15 : undefined };
    if (isSwipe) note.dir = lane === 0 ? "left" : lane === 3 ? "right" : "up";
    if (isWavy) note.path = wavePath(lane, time, 1.15, index % 8 < 4 ? 1 : -1);
    return note;
  });
  return { songId: "neon-warmup", difficulty: "Normal", bpm: 143, duration: 26, notes: clampHolds(notes), waveform: Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.48)) * 0.72) };
}

// Guided tutorial on the Voco Warmup track: taps → holds → flicks → waves → a short mix.
export const TUTORIAL_STEPS = [
  { from: 0, to: 6.4, title: "TAP", copy: "Tap each lane as its note hits the glowing line" },
  { from: 6.4, to: 11.6, title: "HOLD", copy: "Press and keep holding until the tail ends" },
  { from: 11.6, to: 17, title: "FLICK", copy: "Tap the arrow note, then flick your finger the way it points" },
  { from: 17, to: 22.6, title: "WAVE", copy: "Tap the wave's head, then drag along the ribbon" },
  { from: 22.6, to: 99, title: "MIX IT UP", copy: "Put it all together — keep the combo alive!" },
];
export function tutorialChart(): Chart {
  const notes: Note[] = []; let id = 0;
  const add = (n: Omit<Note, "id">) => notes.push({ id: `tut-${id++}`, ...n });
  [1.6, 2.4, 3.2, 4.0, 4.8, 5.4].forEach((t, i) => add({ time: t, lane: [0, 1, 2, 3, 1, 2][i], type: "tap" }));
  add({ time: 7.0, lane: 1, type: "hold", duration: 1.1 }); add({ time: 8.9, lane: 2, type: "hold", duration: 1.1 }); add({ time: 10.6, lane: 0, type: "hold", duration: 0.7 });
  ([[12.4, 1, "up"], [13.6, 0, "left"], [14.8, 3, "right"], [16.0, 2, "up"]] as const).forEach(([t, l, d]) => add({ time: t, lane: l, type: "swipe", dir: d }));
  add({ time: 17.8, lane: 0, type: "wavy", duration: 1.6, path: wavePath(0, 17.8, 1.6, 1) });
  add({ time: 20.2, lane: 3, type: "wavy", duration: 1.6, path: wavePath(3, 20.2, 1.6, -1) });
  [[23.0, 0, "tap"], [23.4, 3, "tap"], [23.8, 1, "tap"], [24.2, 2, "swipe"], [24.8, 1, "tap"], [25.1, 2, "tap"]].forEach(([t, l, ty]) => add({ time: t as number, lane: l as number, type: ty as Note["type"], ...(ty === "swipe" ? { dir: "up" as const } : {}) }));
  return { songId: "neon-warmup", difficulty: "Custom", bpm: 143, duration: 26, notes, waveform: Array.from({ length: 96 }, () => 0.5) };
}
