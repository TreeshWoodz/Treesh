import { Chart, Difficulty, Note, NoteType } from "./types";

const difficultyStep: Record<Difficulty, number> = {
  Easy: 1,
  Normal: 0.75,
  Hard: 0.5,
  Expert: 0.375,
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
  const bpm = estimateBpm(fileName, duration);
  const beat = 60 / bpm;
  const step = beat * difficultyStep[difficulty];
  const seed = [...`${songId}${difficulty}`].reduce((sum, char) => sum + char.charCodeAt(0), 1);
  const random = seeded(seed);
  const notes: Note[] = [];
  let index = 0; let lane = 0; let dir = 1; let beatIdx = 0;
  const skip = difficulty === "Easy" ? 0.28 : difficulty === "Normal" ? 0.16 : 0.06;
  for (let time = Math.min(1.8, duration * 0.1); time < duration - 0.8; time += step, beatIdx++) {
    // Phrasing: rest more on off-beats so patterns feel intentional, not noisy.
    const offbeat = beatIdx % 2 === 1;
    if (random() < (offbeat ? skip + 0.22 : skip)) continue;
    // Lane movement: mostly step up/down (runs / zig-zags), occasional jump — reads as choreography.
    const r = random();
    if (r < 0.58) lane = (lane + dir + 4) % 4;
    else if (r < 0.78) { dir = -dir; lane = (lane + dir + 4) % 4; }
    else lane = Math.floor(random() * 4);
    // Holds land on downbeats only; keep them sparse.
    let type: NoteType = "tap";
    const hr = random();
    if (!offbeat && hr > 0.9) type = "wavy";
    else if (!offbeat && hr > 0.82) type = "hold";
    notes.push({ id: `${songId}-${difficulty}-${index++}`, time, lane, type, duration: type === "hold" || type === "wavy" ? beat * (1 + Math.floor(random() * 2)) : undefined });
  }
  const waveform = Array.from({ length: 96 }, (_, i) => Math.min(1, 0.16 + Math.abs(Math.sin(i * 0.42) * 0.55 + Math.sin(i * 0.13) * 0.25) + random() * 0.2));
  return { songId, difficulty, bpm, duration, notes: clampHolds(notes), waveform };
}

export function trainingChart(): Chart {
  const notes = Array.from({ length: 24 }, (_, index) => ({
    id: `warmup-${index}`,
    time: 1.5 + index * 0.42,
    lane: index % 4,
    type: index === 7 || index === 19 ? "hold" as const : index === 12 ? "wavy" as const : "tap" as const,
    duration: index === 7 || index === 19 ? 0.82 : index === 12 ? 1.15 : undefined,
  }));
  return { songId: "neon-warmup", difficulty: "Normal", bpm: 143, duration: 12.2, notes: clampHolds(notes), waveform: Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.48)) * 0.72) };
}
