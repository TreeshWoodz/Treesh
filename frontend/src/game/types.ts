export type Difficulty = "Easy" | "Normal" | "Hard" | "Expert" | "Custom";
export type NoteType = "tap" | "hold" | "wavy" | "slide" | "chord" | "special" | "swipe";
export type SwipeDir = "up" | "left" | "right";

export type Note = {
  id: string;
  time: number;
  lane: number;
  type: NoteType;
  duration?: number;
  path?: { t: number; x: number }[];
  dir?: SwipeDir;
  hit?: boolean;
  missed?: boolean;
};

export type Chart = {
  songId: string;
  difficulty: Difficulty;
  bpm: number;
  duration: number;
  notes: Note[];
  waveform: number[];
};

export type Song = {
  id: string;
  title: string;
  artist: string;
  source: "treesh" | "device" | "built-in";
  uri?: string;
  fileName?: string;
  duration?: number;
  bpm?: number;
  accent: string;
  coverArt?: string | number;
  genre?: string;
};

export type ScoreResult = {
  songId: string;
  title: string;
  difficulty: Difficulty;
  score: number;
  accuracy: number;
  maxCombo: number;
  stars: number;
  perfect: number;
  great: number;
  good: number;
  miss: number;
  totalNotes: number;
  createdAt: number;
  starlitesEarned?: number;
  coverArt?: string | number;
  accent?: string;
  perfectPlus?: number;
  xpGained?: number;
  xpBefore?: number;
  levelBefore?: number;
  levelAfter?: number;
  levelReward?: number;
  crownBonus?: number;
  crownNew?: "gold" | "diamond";
};

export type GameSettings = {
  noteSpeed: number;
  audioOffset: number;
  hitSfx: boolean;
  haptics: boolean;
  noFail: boolean;
  performanceMode: boolean;
  reducedParticles: boolean;
  autoPerformance: boolean; // watch frame rate and switch to lite visuals on slow devices
  perfLite: boolean;        // set once a slow device was detected (remembered across runs)
  grayscaleCovers: boolean;
  showLanePads: boolean;
  warmupHidden: boolean;
  keyBindings: string[];
  editorTutorialSeen: boolean;
  tutorialDone: boolean;
};
