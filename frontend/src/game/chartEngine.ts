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

export function generateChart(songId: string, fileName: string, duration: number, difficulty: Difficulty): Chart {
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
      notes.push({ id: `${songId}-${difficulty}-${id++}`, time, lane, type: "wavy", duration: beat * 1.5 });
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
  const notes = Array.from({ length: 56 }, (_, index) => ({
    id: `warmup-${index}`,
    time: 1.5 + index * 0.42,
    lane: index % 4,
    type: index % 12 === 7 ? "hold" as const : index % 12 === 11 ? "wavy" as const : "tap" as const,
    duration: index % 12 === 7 ? 0.82 : index % 12 === 11 ? 1.15 : undefined,
  }));
  return { songId: "neon-warmup", difficulty: "Normal", bpm: 143, duration: 26, notes: clampHolds(notes), waveform: Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.48)) * 0.72) };
}
