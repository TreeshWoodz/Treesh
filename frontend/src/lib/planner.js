import { LANES, DRILLS, LEVEL_RANK, drillById, laneById } from "@/data/drills";

export const INTENSITY = { light: { label: "Light", rest: 40 }, standard: { label: "Standard", rest: 25 }, grind: { label: "Grind", rest: 15 } };

const shuffle = (a) => {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
};

export function candidates({ lanes, level, solo }) {
  const rank = LEVEL_RANK[level] ?? 1;
  return DRILLS.filter((d) => lanes.includes(d.lane) && d.lane !== "mobility" && LEVEL_RANK[d.level] <= rank && LEVEL_RANK[d.level] >= rank - 1 && (!solo || !/partner/i.test(d.equip)));
}

/* returns blocks: [{ drillId, mins, role: 'warm'|'main'|'cool' }] */
export function generate({ minutes = 45, lanes = ["shooting", "handles"], level = "intermediate", solo = false, warm = true, cool = true }) {
  const blocks = [];
  let left = minutes;
  if (warm) {
    blocks.push({ drillId: "mobility-68", mins: 6, role: "warm" });
    left -= 6;
  }
  const coolMins = cool ? 5 : 0;
  left -= coolMins;
  let pool = candidates({ lanes, level, solo });
  if (!pool.length) pool = DRILLS.filter((d) => lanes.includes(d.lane));
  const byLane = {};
  shuffle(pool).forEach((d) => (byLane[d.lane] = byLane[d.lane] || []).push(d));
  const laneOrder = shuffle(Object.keys(byLane));
  const used = new Set();
  let guard = 0;
  while (left >= 4 && guard++ < 60) {
    let added = false;
    for (const ln of laneOrder) {
      const next = (byLane[ln] || []).find((d) => !used.has(d.id));
      if (!next || left < 4) continue;
      const mins = Math.min(next.mins, left);
      if (mins < 4) continue;
      blocks.push({ drillId: next.id, mins, role: "main" });
      used.add(next.id);
      left -= mins;
      added = true;
    }
    if (!added) {
      // recycle drills with extra sets if pool exhausted
      const extra = blocks.filter((b) => b.role === "main");
      if (!extra.length) break;
      const b = extra[guard % extra.length];
      const add = Math.min(left, 4);
      b.mins += add;
      left -= add;
    }
  }
  if (left > 0) {
    const mains = blocks.filter((b) => b.role === "main");
    if (mains.length) mains[mains.length - 1].mins += left;
  }
  if (cool) blocks.push({ drillId: "mobility-71", mins: coolMins, role: "cool" });
  return blocks;
}

export function swapBlock(blocks, i, cfg) {
  const b = blocks[i];
  const cur = drillById[b.drillId];
  const usedIds = new Set(blocks.map((x) => x.drillId));
  const pool = candidates(cfg).filter((d) => !usedIds.has(d.id));
  const same = pool.filter((d) => d.lane === cur.lane);
  const pick = shuffle(same.length ? same : pool)[0];
  if (!pick) return blocks;
  const nb = [...blocks];
  nb[i] = { ...b, drillId: pick.id };
  return nb;
}

export function toSession(title, blocks, intensity = "standard") {
  const rest = INTENSITY[intensity]?.rest ?? 25;
  const steps = [];
  blocks.forEach((b, bi) => {
    const d = drillById[b.drillId];
    if (!d) return;
    const kind = b.role === "warm" ? "warm" : b.role === "cool" ? "cool" : "work";
    if (kind !== "work") {
      steps.push({ name: d.name, secs: b.mins * 60, kind, note: d.steps.slice(0, 3).join(" · "), drillId: d.id });
    } else {
      const sets = Math.max(2, Math.round(b.mins / 2.5));
      const work = Math.max(30, Math.round(((b.mins * 60 - rest * (sets - 1)) / sets) / 5) * 5);
      for (let s = 0; s < sets; s++) {
        steps.push({ name: `${d.name} · Set ${s + 1}/${sets}`, secs: work, kind: "work", note: d.cues.join(" · "), drillId: s === 0 ? d.id : undefined });
        if (s < sets - 1) steps.push({ name: "Rest", secs: rest, kind: "rest", note: `Next: ${d.name} set ${s + 2}` });
      }
    }
    const nextB = blocks[bi + 1];
    if (nextB) steps.push({ name: "Transition", secs: Math.max(20, rest), kind: "rest", note: `Up next: ${drillById[nextB.drillId]?.name}` });
  });
  return { title, steps };
}

export const TEMPLATES = [
  { id: "shooter", name: "Shooter's Day", desc: "Form, spot-ups, off the dribble, free throws.", cfg: { minutes: 50, lanes: ["shooting", "freethrow", "footwork"], intensity: "standard" } },
  { id: "handles", name: "Handle Lab", desc: "Tight handles into iso counters.", cfg: { minutes: 40, lanes: ["handles", "iso"], intensity: "grind" } },
  { id: "game-shape", name: "Game Shape", desc: "Conditioning, agility and finishing.", cfg: { minutes: 45, lanes: ["conditioning", "agility", "finishing"], intensity: "grind" } },
  { id: "big", name: "Big Man Work", desc: "Post moves, boards and power.", cfg: { minutes: 50, lanes: ["post", "rebounding", "vertical"], intensity: "standard" } },
  { id: "lockdown", name: "Lockdown", desc: "Stance, slides, closeouts, agility.", cfg: { minutes: 35, lanes: ["defense", "agility"], intensity: "grind" } },
  { id: "reset", name: "Rest & Reset", desc: "Light touch shooting and recovery.", cfg: { minutes: 25, lanes: ["shooting", "freethrow"], intensity: "light" } },
];

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DEFAULT_WEEK = {
  Mon: { rest: false, lanes: ["shooting", "footwork"], minutes: 45 },
  Tue: { rest: false, lanes: ["handles", "iso"], minutes: 40 },
  Wed: { rest: false, lanes: ["conditioning", "agility"], minutes: 35 },
  Thu: { rest: true, lanes: [], minutes: 0 },
  Fri: { rest: false, lanes: ["finishing", "shooting"], minutes: 45 },
  Sat: { rest: false, lanes: ["defense", "rebounding", "vertical"], minutes: 50 },
  Sun: { rest: true, lanes: [], minutes: 0 },
};
export { LANES, laneById, drillById };
