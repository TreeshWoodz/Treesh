import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Ruler, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/PinkButton";
import { laneById } from "@/data/drills";
import { getSettings, KEYS, useStored } from "@/lib/storage";

const POS = [
  { id: "PG", name: "Point Guard", h: -4.5, ape: 3, wpi: 2.62, vert: 36, skills: { handle: 1, passing: 1, speed: 0.7 }, role: "Floor general. Runs the offense, breaks pressure, creates for others.", comps: ["Stephen Curry", "Chris Paul", "Tyrese Haliburton"], lanes: ["handles", "passing", "iso"] },
  { id: "SG", name: "Shooting Guard", h: -2, ape: 4, wpi: 2.72, vert: 35, skills: { shooting: 1, handle: 0.5, speed: 0.5 }, role: "Primary scorer on the wing. Spaces the floor and attacks closeouts.", comps: ["Devin Booker", "Klay Thompson", "Anthony Edwards"], lanes: ["shooting", "iso", "footwork"] },
  { id: "SF", name: "Small Forward", h: 0.5, ape: 4.5, wpi: 2.86, vert: 34, skills: { shooting: 0.5, handle: 0.4, rebounding: 0.4, strength: 0.4, speed: 0.5 }, role: "The connector. Defends multiple positions, scores at all three levels.", comps: ["Jayson Tatum", "Kawhi Leonard", "Jimmy Butler"], lanes: ["shooting", "defense", "finishing"] },
  { id: "PF", name: "Power Forward", h: 2.5, ape: 5, wpi: 3.0, vert: 32, skills: { rebounding: 0.8, strength: 0.8, shooting: 0.3 }, role: "Physical frontcourt piece. Boards, screens, pops or rolls, guards bigs.", comps: ["Giannis Antetokounmpo", "Zion Williamson", "Pascal Siakam"], lanes: ["rebounding", "post", "vertical"] },
  { id: "C", name: "Center", h: 4.5, ape: 5.5, wpi: 3.15, vert: 30, skills: { rebounding: 1, strength: 1 }, role: "Anchor. Protects the rim, owns the paint, finishes everything close.", comps: ["Nikola Jokic", "Joel Embiid", "Victor Wembanyama"], lanes: ["post", "rebounding", "finishing"] },
];
const LEVELS = [
  ["rec", "Rec / Pickup", 70],
  ["hs", "High School", 72.5],
  ["college", "College", 77],
  ["pro", "Pro", 78.5],
];
const SKILLS = [["handle", "Ball handling"], ["shooting", "Shooting"], ["passing", "Passing"], ["rebounding", "Rebounding"], ["speed", "Speed"], ["strength", "Strength"]];

export function analyze(b) {
  const h = b.height, ws = b.wingspan || h, w = b.weight;
  const base = (LEVELS.find((l) => l[0] === b.level) || LEVELS[0])[2];
  const rel = h - base;
  const ape = ws - h;
  const wpi = w ? w / h : null;
  const scores = POS.map((p) => {
    let s = -0.5 * ((rel - p.h) / 2.6) ** 2;
    s += -0.5 * ((ape - p.ape) / 2.8) ** 2 * 0.55;
    if (wpi) s += -0.5 * ((wpi - p.wpi) / 0.2) ** 2 * 0.8;
    if (b.vertical) s += -0.5 * ((b.vertical - p.vert) / 6) ** 2 * 0.3;
    if (b.useSkills) {
      let k = 0, tw = 0;
      Object.entries(p.skills).forEach(([sk, wt]) => {
        k += wt * (((b.skills?.[sk] ?? 3) - 3) / 2);
        tw += wt;
      });
      s += (k / tw) * 1.6;
    }
    return { ...p, raw: s };
  });
  const max = Math.max(...scores.map((x) => x.raw));
  const exps = scores.map((x) => Math.exp((x.raw - max) * 1.3));
  const sum = exps.reduce((a, b2) => a + b2, 0);
  const out = scores.map((x, i) => ({ ...x, pct: Math.round((exps[i] / sum) * 100) })).sort((a, b2) => b2.pct - a.pct);
  const notes = [];
  notes.push(`Height is ${Math.abs(rel).toFixed(1)}" ${rel >= 0 ? "above" : "below"} the ${LEVELS.find((l) => l[0] === b.level)[1].toLowerCase()} average.`);
  if (b.wingspan) notes.push(ape >= 4 ? `+${ape.toFixed(1)}" ape index: long arms for contests, deflections and finishing over length.` : ape <= 0 ? `Ape index ${ape.toFixed(1)}": win with positioning, footwork and quick hands.` : `+${ape.toFixed(1)}" ape index: solid length for your height.`);
  if (wpi) notes.push(wpi > 3 ? "Strong, heavy frame: built to hold position inside." : wpi < 2.6 ? "Light, quick frame: speed and change of direction are your edge." : "Balanced frame: versatile enough to guard multiple spots.");
  if (b.vertical) notes.push(`${b.vertical}" vertical${b.vertical >= 32 ? ": plays above the rim." : "."}`);
  return { ranked: out, notes, ape, rel };
}

const toIn = (v, units) => (units === "metric" ? v / 2.54 : v);
const toLb = (v, units) => (units === "metric" ? v * 2.20462 : v);

function Field({ label, suffix, value, onChange, testid, placeholder, optional }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between text-[13px] font-bold text-[#E6E8EF]">{label}{optional && <span className="text-[11px] font-semibold text-[#8B90A6]">optional</span>}</span>
      <div className="relative">
        <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} data-testid={testid} className="h-12 w-full rounded-xl border border-[#25273a] bg-[#0f1015] px-3.5 pr-12 font-num text-lg font-bold text-[#F5F6F8] placeholder:font-body placeholder:text-sm placeholder:font-medium placeholder:text-[#6f7489] focus:border-[#FF3EA5] focus:outline-none" />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8B90A6]">{suffix}</span>
      </div>
    </label>
  );
}

export default function Position() {
  const nav = useNavigate();
  const units = getSettings().units;
  const [saved, setSaved] = useStored(KEYS.body, null);
  const [f, setF] = useState(() => saved?.form || { ft: "", inch: "", cm: "", wingspan: "", reach: "", weight: "", vertical: "", level: "rec", useSkills: false, skills: { handle: 3, shooting: 3, passing: 3, rebounding: 3, speed: 3, strength: 3 } });
  const [result, setResult] = useState(() => (saved?.input ? analyze(saved.input) : null));
  const [err, setErr] = useState("");
  const set = (k, v) => setF((c) => ({ ...c, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    const height = units === "metric" ? toIn(parseFloat(f.cm), units) : (parseFloat(f.ft) || 0) * 12 + (parseFloat(f.inch) || 0);
    if (!height || height < 48 || height > 96) return setErr("Enter a real height to analyze (between 4'0\" and 8'0\").");
    const wingspan = f.wingspan ? toIn(parseFloat(f.wingspan), units) : null;
    const weight = f.weight ? toLb(parseFloat(f.weight), units) : null;
    const vertical = f.vertical ? toIn(parseFloat(f.vertical), units) : null;
    if (wingspan && (wingspan < height - 12 || wingspan > height + 16)) return setErr("That wingspan looks off. Measure fingertip to fingertip with arms out.");
    setErr("");
    const input = { height, wingspan, weight, vertical, level: f.level, useSkills: f.useSkills, skills: f.skills };
    const r = analyze(input);
    setResult(r);
    setSaved({ form: f, input, top: r.ranked[0].id, at: new Date().toISOString() });
    setTimeout(() => document.getElementById("position-results")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const top = result?.ranked[0];
  const u = units === "metric" ? "cm" : "in";

  return (
    <div data-testid="position-page">
      <PageHeader eyebrow="Body analysis" title="Find your position" sub="Enter your measurements and we'll compare them to how each of the five positions is built at your level of play." testid="position-title" />
      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        <form onSubmit={submit} className="hp-card space-y-4 p-4 sm:p-5" data-testid="position-form">
          <div>
            <div className="mb-2 text-[13px] font-bold">Where you play</div>
            <div className="grid grid-cols-2 gap-2">
              {LEVELS.map(([id, label]) => (
                <button type="button" key={id} className="hp-chip justify-center" data-active={f.level === id} onClick={() => set("level", id)} data-testid={`position-level-${id}`}>{label}</button>
              ))}
            </div>
          </div>
          {units === "metric" ? (
            <Field label="Height" suffix="cm" value={f.cm} onChange={(v) => set("cm", v)} testid="position-height-cm" placeholder="e.g. 188" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Height" suffix="ft" value={f.ft} onChange={(v) => set("ft", v)} testid="position-height-ft" placeholder="6" />
              <Field label="&nbsp;" suffix="in" value={f.inch} onChange={(v) => set("inch", v)} testid="position-height-in" placeholder="2" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Wingspan" suffix={u} value={f.wingspan} onChange={(v) => set("wingspan", v)} testid="position-wingspan" placeholder={units === "metric" ? "193" : "76"} />
            <Field label="Weight" suffix={units === "metric" ? "kg" : "lb"} value={f.weight} onChange={(v) => set("weight", v)} testid="position-weight" placeholder={units === "metric" ? "82" : "180"} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Standing reach" suffix={u} value={f.reach} onChange={(v) => set("reach", v)} testid="position-reach" placeholder={units === "metric" ? "245" : "96"} optional />
            <Field label="Vertical" suffix={u} value={f.vertical} onChange={(v) => set("vertical", v)} testid="position-vertical" placeholder={units === "metric" ? "70" : "28"} optional />
          </div>
          <div className="rounded-xl border border-[#1f2130] bg-[#0f1015] p-3">
            <label className="flex items-center justify-between text-[13px] font-bold">
              Factor in my skills
              <input type="checkbox" checked={f.useSkills} onChange={(e) => set("useSkills", e.target.checked)} className="h-5 w-5 accent-[#FF3EA5]" data-testid="position-use-skills" />
            </label>
            {f.useSkills && (
              <div className="mt-4 space-y-4">
                {SKILLS.map(([k, l]) => (
                  <div key={k}>
                    <div className="mb-2 flex justify-between text-xs font-bold text-[#B7BBCB]"><span>{l}</span><span className="font-num text-[#FF3EA5]">{f.skills[k]}/5</span></div>
                    <Slider value={[f.skills[k]]} min={1} max={5} step={1} onValueChange={(v) => set("skills", { ...f.skills, [k]: v[0] })} data-testid={`position-skill-${k}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {err && <p className="text-sm font-semibold text-[#FF7A7A]" data-testid="position-error">{err}</p>}
          <Btn type="submit" className="w-full" data-testid="position-form-submit-button"><Sparkles size={16} /> Analyze my build</Btn>
          <p className="text-[11.5px] text-[#8B90A6]">Units follow your Profile setting ({units}). Everything stays on this device.</p>
        </form>

        <div id="position-results">
          {!result ? (
            <div className="hp-card flex h-full min-h-[320px] flex-col items-center justify-center p-8 text-center">
              <Ruler size={28} className="text-[#FF3EA5]" />
              <div className="mt-3 text-base font-bold">Your results show up here</div>
              <p className="mt-1 max-w-sm text-sm text-[#B7BBCB]">Height is the minimum. Wingspan and weight make it far more accurate.</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="hp-card hp-hero-glow overflow-hidden p-5" data-testid="position-top-match">
                <div className="hp-eyebrow">Best fit</div>
                <div className="mt-2 flex items-end gap-4">
                  <span className="font-display text-[64px] leading-none text-[#FF3EA5]">{top.id}</span>
                  <div className="pb-1.5">
                    <div className="font-display text-2xl leading-tight">{top.name}</div>
                    <div className="font-num text-sm font-bold text-[#B7BBCB]">{top.pct}% match</div>
                  </div>
                </div>
                <p className="mt-4 text-[15px] text-[#E6E8EF]">{top.role}</p>
                <ul className="mt-3 space-y-1.5">
                  {result.notes.map((n) => <li key={n} className="flex gap-2 text-[13.5px] text-[#B7BBCB]"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#FF3EA5]" />{n}</li>)}
                </ul>
                <div className="mt-4 text-xs text-[#8B90A6]">Study: <span className="font-semibold text-[#E6E8EF]">{top.comps.join(" \u00b7 ")}</span></div>
              </div>
              <div className="hp-card p-5">
                <div className="hp-eyebrow mb-4">All five positions</div>
                <div className="space-y-3.5">
                  {result.ranked.map((p, i) => (
                    <div key={p.id} data-testid="position-result-bar">
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-bold"><span className="mr-2 font-num text-[#8B90A6]">{p.id}</span>{p.name}</span>
                        <span className="font-num font-extrabold" style={{ color: i === 0 ? "#FF3EA5" : "#E6E8EF" }}>{p.pct}%</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-[#1a1b26]">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(2, p.pct)}%` }} transition={{ duration: 0.6, delay: i * 0.06 }} className="h-full rounded-full" style={{ background: i === 0 ? "#FF3EA5" : "#4a4d66" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="hp-card p-5">
                <div className="hp-eyebrow mb-3">Train like a {top.id}</div>
                <div className="grid gap-2 sm:grid-cols-3">
                  {top.lanes.map((l) => (
                    <button key={l} onClick={() => nav(`/drills?lane=${l}`)} className="press flex items-center justify-between rounded-xl border border-[#22243a] bg-[#0f1015] px-4 py-3 text-left text-sm font-bold hover:border-[#FF3EA5]/50" data-testid={`position-lane-${l}`}>
                      {laneById[l].name} <ArrowRight size={15} className="text-[#FF3EA5]" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
