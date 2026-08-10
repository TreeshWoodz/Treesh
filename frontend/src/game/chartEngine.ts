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

export function generateChart(songId: string, fileName: string, duration: number, difficulty: Difficulty): Chart {
  const bpm = estimateBpm(fileName, duration);
  const beat = 60 / bpm;
  const step = beat * difficultyStep[difficulty];
  const seed = [...`${songId}${difficulty}`].reduce((sum, char) => sum + char.charCodeAt(0), 1);
  const random = seeded(seed);
  const notes: Note[] = [];
  let index = 0;
  for (let time = Math.min(1.8, duration * 0.1); time < duration - 0.8; time += step) {
    if (random() < (difficulty === "Easy" ? 0.18 : 0.08)) continue;
    const roll = random();
    let type: NoteType = "tap";
    if (roll > 0.89) type = "wavy";
    else if (roll > 0.80) type = "hold";
    else if (roll > 0.74 && difficulty !== "Easy") type = "slide";
    else if (roll > 0.68 && difficulty === "Expert") type = "special";
    notes.push({
      id: `${songId}-${difficulty}-${index++}`,
      time,
      lane: Math.floor(random() * 4),
      type,
      duration: type === "hold" || type === "wavy" ? beat * (2 + Math.floor(random() * 3)) : undefined,
    });
  }
  const waveform = Array.from({ length: 96 }, (_, i) => {
    const pulse = Math.abs(Math.sin(i * 0.42) * 0.55 + Math.sin(i * 0.13) * 0.25);
    return Math.min(1, 0.16 + pulse + random() * 0.2);
  });
  return { songId, difficulty, bpm, duration, notes, waveform };
}

export function trainingChart(): Chart {
  const notes = Array.from({ length: 24 }, (_, index) => ({
    id: `warmup-${index}`,
    time: 1.5 + index * 0.42,
    lane: index % 4,
    type: index === 7 || index === 19 ? "hold" as const : index === 12 ? "wavy" as const : "tap" as const,
    duration: index === 7 || index === 19 ? 0.82 : index === 12 ? 1.15 : undefined,
  }));
  return { songId: "neon-warmup", difficulty: "Normal", bpm: 143, duration: 12.2, notes, waveform: Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.48)) * 0.72) };
}
