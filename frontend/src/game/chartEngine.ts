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
  const picks = data.onsets.map((t, i) => ({ t, s: data.strengths[i], lane: data.lanes?.[i] ?? -1 })).filter(o => o.s >= cutoff && o.t > 0.05);

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
  return { songId, difficulty, bpm: data.bpm || 120, duration, notes: clampHolds(notes), waveform };
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
  return { songId, difficulty, bpm, duration, notes: clampHolds(notes), waveform };
}

export function trainingChart(): Chart {
  const notes: Note[] = Array.from({ length: 56 }, (_, index) => {
    const isHold = index % 12 === 7;
    const isWavy = index % 12 === 11;
    const time = 1.5 + index * 0.42;
    const lane = index % 4;
    const note: Note = { id: `warmup-${index}`, time, lane, type: isWavy ? "wavy" : isHold ? "hold" : "tap", duration: isHold ? 0.82 : isWavy ? 1.15 : undefined };
    if (isWavy) note.path = wavePath(lane, time, 1.15, index % 8 < 4 ? 1 : -1);
    return note;
  });
  return { songId: "neon-warmup", difficulty: "Normal", bpm: 143, duration: 26, notes: clampHolds(notes), waveform: Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.48)) * 0.72) };
}
