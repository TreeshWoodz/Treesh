import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, CalendarDays, Clock, Dumbbell, Play, RefreshCw, Save, Shuffle, Sparkles, Timer, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { PageHeader, Empty, LevelBadge } from "@/components/PageHeader";
import { Btn } from "@/components/PinkButton";
import { useTimer } from "@/context/TimerContext";
import { DAYS, DEFAULT_WEEK, INTENSITY, LANES, TEMPLATES, drillById, generate, laneById, swapBlock, toSession } from "@/lib/planner";
import { LEVELS } from "@/data/drills";
import { fmtClock, getSettings, KEYS, useStored } from "@/lib/storage";

const TABS = [["gen", "Generator", Sparkles], ["week", "Week", CalendarDays], ["interval", "Intervals", Timer], ["saved", "Saved", Bookmark]];

function Section({ title, children, right }) {
  return (
    <div className="hp-card p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="hp-eyebrow">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function Plan() {
  const timer = useTimer();
  const nav = useNavigate();
  const [tab, setTab] = useState("gen");
  const [cfg, setCfg] = useState({ minutes: 45, lanes: ["shooting", "handles"], level: getSettings().level, solo: true, warm: true, cool: true, intensity: "standard" });
  const [blocks, setBlocks] = useState(null);
  const [title, setTitle] = useState("");
  const [plans, setPlans] = useStored(KEYS.plans, []);
  const [week, setWeek] = useStored(KEYS.week, DEFAULT_WEEK);
  const [iv, setIv] = useState({ work: 40, rest: 20, rounds: 8, name: "Interval" });

  const set = (k, v) => setCfg((c) => ({ ...c, [k]: v }));
  const toggleLane = (id) => setCfg((c) => ({ ...c, lanes: c.lanes.includes(id) ? c.lanes.filter((x) => x !== id) : [...c.lanes, id] }));
  const run = (c = cfg, t) => {
    if (!c.lanes.length) return toast.error("Pick at least one training lane.");
    const b = generate(c);
    setBlocks(b);
    setTitle(t || `${c.lanes.map((l) => laneById[l].short).slice(0, 3).join(" + ")} · ${c.minutes} min`);
  };
  const total = blocks ? blocks.reduce((a, b) => a + b.mins, 0) : 0;
  const session = blocks ? toSession(title, blocks, cfg.intensity) : null;
  const sessionSecs = session ? session.steps.reduce((a, b) => a + b.secs, 0) : 0;

  const savePlan = () => {
    if (!blocks) return;
    setPlans((cur) => [{ id: Date.now().toString(36), title, blocks, intensity: cfg.intensity, createdAt: new Date().toISOString() }, ...cur].slice(0, 40));
    toast.success("Plan saved", { description: title });
  };

  const todayKey = DAYS[(new Date().getDay() + 6) % 7];

  return (
    <div data-testid="plan-page">
      <PageHeader eyebrow="Plan your work" title="Plan" sub="Generate a session built from the drill library, map out your week, or run quick intervals. The timer goes fullscreen and follows you around the app." testid="plan-title" />

      <div className="mb-5 flex flex-wrap gap-2" data-testid="plan-tabs">
        {TABS.map(([id, label, I]) => (
          <button key={id} className="hp-chip shrink-0" data-active={tab === id} onClick={() => setTab(id)} data-testid={`plan-tab-${id}`}>
            <I size={14} /> {label}
            {id === "saved" && plans.length > 0 && <span className="font-num">{plans.length}</span>}
          </button>
        ))}
      </div>

      {tab === "gen" && (
        <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
          <div className="space-y-4">
            <Section title="Quick templates">
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => { const c = { ...cfg, ...t.cfg }; setCfg(c); run(c, t.name); }} data-testid={`plan-template-${t.id}`} className="press rounded-xl border border-[#22243a] bg-[#0f1015] p-3 text-left hover:border-[#FF3EA5]/50">
                    <div className="text-[13.5px] font-extrabold text-[#F5F6F8]">{t.name}</div>
                    <div className="mt-0.5 text-[11.5px] leading-snug text-[#8B90A6]">{t.desc}</div>
                  </button>
                ))}
              </div>
            </Section>
            <Section title="Session generator">
              <div className="space-y-5">
                <div>
                  <div className="mb-2.5 flex items-center justify-between text-sm font-bold"><span>Duration</span><span className="font-num text-lg text-[#FF3EA5]" data-testid="plan-duration-value">{cfg.minutes} min</span></div>
                  <Slider value={[cfg.minutes]} min={15} max={120} step={5} onValueChange={(v) => set("minutes", v[0])} data-testid="plan-duration-slider" />
                </div>
                <div>
                  <div className="mb-2 text-sm font-bold">Level</div>
                  <div className="flex flex-wrap gap-2">
                    {LEVELS.map((l) => (
                      <button key={l.id} className="hp-chip !h-8" data-active={cfg.level === l.id} onClick={() => set("level", l.id)} data-testid={`plan-level-${l.id}`}>{l.label}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm font-bold"><span>Focus lanes</span><span className="text-xs text-[#8B90A6]">{cfg.lanes.length} selected</span></div>
                  <div className="flex flex-wrap gap-2" data-testid="plan-lanes">
                    {LANES.filter((l) => l.id !== "mobility").map((l) => (
                      <button key={l.id} className="hp-chip !h-8" data-active={cfg.lanes.includes(l.id)} onClick={() => toggleLane(l.id)} data-testid={`plan-lane-${l.id}`}>{l.short}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-sm font-bold">Intensity</div>
                  <div className="flex flex-wrap gap-2" data-testid="plan-intensity">
                    {Object.entries(INTENSITY).map(([k, v]) => (
                      <button key={k} className="hp-chip !h-8 whitespace-nowrap" data-active={cfg.intensity === k} onClick={() => set("intensity", k)} data-testid={`plan-intensity-${k}`}>{v.label} · {v.rest}s rest</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3 rounded-xl border border-[#1f2130] bg-[#0f1015] p-3">
                  {[["solo", "Solo only (no partner drills)"], ["warm", "Include warm-up"], ["cool", "Include cool-down"]].map(([k, l]) => (
                    <label key={k} className="flex items-center justify-between gap-3 text-sm font-semibold text-[#E6E8EF]">
                      {l}
                      <Switch checked={cfg[k]} onCheckedChange={(v) => set(k, v)} data-testid={`plan-switch-${k}`} />
                    </label>
                  ))}
                </div>
                <Btn onClick={() => run()} className="w-full" data-testid="plan-generate-session-button">
                  <Sparkles size={16} /> Generate session
                </Btn>
              </div>
            </Section>
          </div>

          <div>
            {!blocks ? (
              <Empty icon={Sparkles} title="Build today's session" text="Pick your lanes and time, or tap a template. You'll get a full session with warm-up, drills, sets and rest." action={<Btn onClick={() => run()} data-testid="plan-empty-generate">Generate</Btn>} testid="plan-empty" />
            ) : (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="hp-card overflow-hidden" data-testid="plan-session">
                <div className="hp-hero-glow border-b border-[#1d1f2c] p-4 sm:p-5">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="font-display w-full bg-transparent text-2xl text-[#F5F6F8] focus:outline-none" data-testid="plan-session-title" />
                  <div className="mt-2 flex flex-wrap gap-3 text-[13px] font-semibold text-[#B7BBCB]">
                    <span className="inline-flex items-center gap-1.5"><Clock size={14} /> <span className="font-num" data-testid="plan-session-total">{fmtClock(sessionSecs)}</span> total</span>
                    <span className="inline-flex items-center gap-1.5"><Dumbbell size={14} /> {blocks.length} blocks</span>
                    <span className="inline-flex items-center gap-1.5"><Timer size={14} /> {session.steps.length} timer steps</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Btn onClick={() => timer.start(session)} data-testid="plan-start-timer-button"><Play size={16} fill="#0A0A0D" /> Start workout</Btn>
                    <Btn variant="secondary" onClick={savePlan} data-testid="plan-save-button"><Save size={15} /> Save</Btn>
                    <Btn variant="secondary" onClick={() => run()} data-testid="plan-regenerate-button"><RefreshCw size={15} /> Regenerate</Btn>
                  </div>
                </div>
                <ol className="divide-y divide-[#1a1b26]">
                  {blocks.map((b, i) => {
                    const d = drillById[b.drillId];
                    return (
                      <li key={i + b.drillId} className="flex items-center gap-3 p-3.5 sm:px-5" data-testid="plan-block">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#171923] font-num text-[12px] font-black text-[#FF3EA5]">{i + 1}</span>
                        <button className="min-w-0 flex-1 text-left" onClick={() => nav(`/drills?lane=${d.lane}&drill=${d.id}`)}>
                          <div className="text-[10.5px] font-extrabold uppercase tracking-[0.14em] text-[#8B90A6]">{b.role === "warm" ? "Warm-up" : b.role === "cool" ? "Cool-down" : laneById[d.lane].name}</div>
                          <div className="truncate text-[15px] font-bold text-[#F5F6F8]">{d.name}</div>
                        </button>
                        <LevelBadge level={d.level} />
                        <span className="w-14 text-right font-num text-sm font-extrabold">{b.mins}m</span>
                        {b.role === "main" && (
                          <>
                            <button onClick={() => setBlocks(swapBlock(blocks, i, cfg))} className="press grid h-9 w-9 place-items-center rounded-full text-[#B7BBCB] hover:bg-white/5" aria-label="Swap drill" data-testid="plan-block-swap"><Shuffle size={15} /></button>
                            <button onClick={() => setBlocks(blocks.filter((_, j) => j !== i))} className="press grid h-9 w-9 place-items-center rounded-full text-[#B7BBCB] hover:bg-white/5" aria-label="Remove block" data-testid="plan-block-remove"><X size={15} /></button>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ol>
                <div className="border-t border-[#1d1f2c] px-5 py-3 text-xs text-[#8B90A6]">Drill time {total} min + rests. Tap a drill to see steps & video.</div>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {tab === "week" && (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" data-testid="plan-week">
          {DAYS.map((day) => {
            const w = week[day] || { rest: true, lanes: [], minutes: 0 };
            const upd = (patch) => setWeek((cur) => ({ ...cur, [day]: { ...w, ...patch } }));
            return (
              <div key={day} className={`hp-card p-4 ${day === todayKey ? "!border-[#FF3EA5]/50" : ""}`} data-testid={`plan-day-${day}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-display text-lg">{day}</span>
                    {day === todayKey && <span className="rounded-full bg-[#FF3EA5] px-2 py-0.5 text-[10px] font-extrabold text-[#0A0A0D]">TODAY</span>}
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-[#B7BBCB]">Rest day <Switch checked={w.rest} onCheckedChange={(v) => upd({ rest: v, minutes: v ? 0 : 40, lanes: v ? [] : ["shooting"] })} data-testid={`plan-day-${day}-rest`} /></label>
                </div>
                {w.rest ? (
                  <p className="mt-3 text-sm text-[#8B90A6]">Recovery. Hydrate, stretch, sleep.</p>
                ) : (
                  <>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {LANES.filter((l) => l.id !== "mobility").map((l) => (
                        <button key={l.id} className="hp-chip !h-7 !px-2.5 !text-[11.5px]" data-active={w.lanes.includes(l.id)} onClick={() => upd({ lanes: w.lanes.includes(l.id) ? w.lanes.filter((x) => x !== l.id) : [...w.lanes, l.id] })}>{l.short}</button>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                      <Slider value={[w.minutes || 40]} min={15} max={120} step={5} onValueChange={(v) => upd({ minutes: v[0] })} className="flex-1" />
                      <span className="w-14 text-right font-num text-sm font-extrabold text-[#FF3EA5]">{w.minutes}m</span>
                    </div>
                    <Btn size="sm" variant={day === todayKey ? "primary" : "secondary"} className="mt-4 w-full" data-testid={`plan-day-${day}-build`} onClick={() => { const c = { ...cfg, lanes: w.lanes.length ? w.lanes : ["shooting"], minutes: w.minutes || 40 }; setCfg(c); run(c, `${day} · ${c.lanes.map((l) => laneById[l].short).join(" + ")}`); setTab("gen"); }}>
                      <Sparkles size={14} /> Build {day}'s session
                    </Btn>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === "interval" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section title="Interval timer">
            <div className="space-y-5">
              {[["work", "Work", 10, 300, 5, "s"], ["rest", "Rest", 0, 180, 5, "s"], ["rounds", "Rounds", 1, 30, 1, ""]].map(([k, l, min, max, step, u]) => (
                <div key={k}>
                  <div className="mb-2.5 flex items-center justify-between text-sm font-bold"><span>{l}</span><span className="font-num text-lg text-[#FF3EA5]" data-testid={`interval-${k}-value`}>{iv[k]}{u}</span></div>
                  <Slider value={[iv[k]]} min={min} max={max} step={step} onValueChange={(v) => setIv((c) => ({ ...c, [k]: v[0] }))} data-testid={`interval-${k}-slider`} />
                </div>
              ))}
              <input value={iv.name} onChange={(e) => setIv((c) => ({ ...c, name: e.target.value }))} className="h-11 w-full rounded-xl border border-[#25273a] bg-[#0f1015] px-3 text-sm focus:border-[#FF3EA5] focus:outline-none" placeholder="What are you doing? e.g. Mikan drill" data-testid="interval-name-input" />
              <Btn className="w-full" data-testid="interval-start-button" onClick={() => {
                const steps = [];
                for (let r = 0; r < iv.rounds; r++) {
                  steps.push({ name: `${iv.name || "Work"} · ${r + 1}/${iv.rounds}`, secs: iv.work, kind: "work" });
                  if (iv.rest && r < iv.rounds - 1) steps.push({ name: "Rest", secs: iv.rest, kind: "rest" });
                }
                timer.start({ title: `Intervals · ${iv.rounds} × ${iv.work}s`, steps });
              }}>
                <Play size={16} fill="#0A0A0D" /> Start · {fmtClock(iv.rounds * iv.work + Math.max(0, iv.rounds - 1) * iv.rest)}
              </Btn>
            </div>
          </Section>
          <Section title="Presets">
            <div className="space-y-2">
              {[["Tabata", 20, 10, 8], ["Mikan minutes", 60, 30, 5], ["Free throw fatigue", 45, 15, 10], ["Defensive slides", 30, 30, 6], ["Game quarters", 240, 120, 4]].map(([n, w, r, rd]) => (
                <button key={n} onClick={() => setIv({ name: n, work: w, rest: r, rounds: rd })} className="press flex w-full items-center justify-between rounded-xl border border-[#22243a] bg-[#0f1015] px-4 py-3 text-left hover:border-[#FF3EA5]/50" data-testid={`interval-preset-${n.toLowerCase().replace(/\s+/g, "-")}`}>
                  <span className="text-sm font-bold">{n}</span>
                  <span className="font-num text-xs font-bold text-[#B7BBCB]">{rd} × {w}s / {r}s</span>
                </button>
              ))}
            </div>
          </Section>
        </div>
      )}

      {tab === "saved" && (
        plans.length === 0 ? (
          <Empty icon={Bookmark} title="No saved plans" text="Generate a session and tap Save to keep it here." action={<Btn onClick={() => setTab("gen")}>Open generator</Btn>} testid="plan-saved-empty" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2" data-testid="plan-saved-list">
            {plans.map((p) => {
              const s = toSession(p.title, p.blocks, p.intensity);
              return (
                <div key={p.id} className="hp-card p-4" data-testid="plan-saved-item">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-[16px] font-extrabold">{p.title}</div>
                      <div className="mt-0.5 text-xs text-[#8B90A6]">{p.blocks.length} blocks · <span className="font-num">{fmtClock(s.steps.reduce((a, b) => a + b.secs, 0))}</span> · {new Date(p.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button onClick={() => setPlans((cur) => cur.filter((x) => x.id !== p.id))} className="press grid h-9 w-9 place-items-center rounded-full text-[#8B90A6] hover:bg-white/5 hover:text-[#FF7A7A]" aria-label="Delete plan" data-testid="plan-saved-delete"><Trash2 size={15} /></button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.blocks.filter((b) => b.role === "main").map((b, i) => <span key={i} className="rounded-full bg-[#171923] px-2.5 py-1 text-[11.5px] font-semibold text-[#B7BBCB]">{drillById[b.drillId]?.name}</span>)}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Btn size="sm" onClick={() => timer.start(s)} data-testid="plan-saved-start"><Play size={14} fill="#0A0A0D" /> Start</Btn>
                    <Btn size="sm" variant="secondary" onClick={() => { setBlocks(p.blocks); setTitle(p.title); setCfg((c) => ({ ...c, intensity: p.intensity })); setTab("gen"); }} data-testid="plan-saved-open">Open</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
