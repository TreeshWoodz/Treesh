import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, CheckCircle2, Clock, Dumbbell, Play, Repeat, Search, Timer } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { PageHeader, Empty, LevelBadge } from "@/components/PageHeader";
import { Btn } from "@/components/PinkButton";
import { DRILLS, LANES, LEVELS, drillById, laneById } from "@/data/drills";
import { bumpStats, DEFAULT_STATS, KEYS, useStored } from "@/lib/storage";
import { useTimer } from "@/context/TimerContext";

export function YouTube({ id, title }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-[#222433] bg-black" style={{ aspectRatio: "16 / 9" }}>
      <iframe
        key={id}
        data-testid="drills-video-embed"
        className="absolute inset-0 h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
      />
    </div>
  );
}

export function drillSession(dr) {
  const lane = laneById[dr.lane];
  const sets = Math.max(2, Math.min(5, Math.round(dr.mins / 2.5)));
  const work = Math.round((dr.mins * 60) / sets / 5) * 5 - 15;
  const steps = [];
  for (let i = 0; i < sets; i++) {
    steps.push({ name: `${dr.name} · Set ${i + 1}`, secs: Math.max(30, work), kind: "work", note: dr.cues.join(" · "), drillId: i === 0 ? dr.id : undefined });
    if (i < sets - 1) steps.push({ name: "Rest", secs: 20, kind: "rest", note: `Next: set ${i + 2}` });
  }
  return { title: `${lane.short} · ${dr.name}`, steps };
}

export function DrillDialog({ drill, onClose }) {
  const [vid, setVid] = useState(0);
  const [stats] = useStored(KEYS.stats, DEFAULT_STATS);
  const [saved, setSaved] = useStored(KEYS.savedDrills, []);
  const timer = useTimer();
  useEffect(() => setVid(drill?.video || 0), [drill]);
  if (!drill) return null;
  const lane = laneById[drill.lane];
  const done = stats.drillsDone?.[drill.id] || 0;
  const isSaved = saved.includes(drill.id);
  const [vId, vTitle] = lane.videos[vid] || lane.videos[0];
  return (
    <Dialog open={!!drill} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] w-[calc(100%-16px)] max-w-2xl overflow-y-auto rounded-[22px] border-[#25273a] bg-[#0f1015] p-0 sm:rounded-[22px]" data-testid="drill-detail-dialog">
        <div className="p-4 pb-0 sm:p-6 sm:pb-0">
          <div className="mb-3 flex flex-wrap items-center gap-2 pr-8">
            <span className="hp-eyebrow">{lane.name}</span>
            <LevelBadge level={drill.level} />
          </div>
          <DialogTitle className="font-display pr-6 text-[26px] leading-tight text-[#F5F6F8]">{drill.name}</DialogTitle>
          <DialogDescription className="mt-2 text-[15px] text-[#B7BBCB]">{drill.desc}</DialogDescription>
        </div>
        <div className="px-4 pt-4 sm:px-6">
          <YouTube id={vId} title={`${lane.name}: ${vTitle}`} />
          <div className="mt-2.5 flex gap-2 overflow-x-auto no-scrollbar" data-testid="drill-video-picker">
            {lane.videos.map(([id, title], i) => (
              <button key={id} className="hp-chip !h-8 shrink-0 !text-[12px]" data-active={vid === i} onClick={() => setVid(i)} data-testid={`drill-video-option-${i}`}>
                <Play size={12} /> {title}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4 pt-4 sm:px-6">
          {[[Clock, `${drill.mins} min`, "Time"], [Repeat, drill.reps, "Volume"], [Dumbbell, drill.equip, "Gear"]].map(([I, v, l]) => (
            <div key={l} className="rounded-xl border border-[#1f2130] bg-[#121319] p-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B90A6]"><I size={11} />{l}</div>
              <div className="mt-1 text-[13px] font-bold leading-snug text-[#F5F6F8]">{v}</div>
            </div>
          ))}
        </div>
        <div className="px-4 pt-5 sm:px-6">
          <div className="hp-eyebrow mb-3">How to do it</div>
          <ol className="space-y-2.5" data-testid="drill-steps">
            {drill.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#1b1420] font-num text-[12px] font-black text-[#FF3EA5]">{i + 1}</span>
                <span className="pt-0.5 text-[14.5px] leading-relaxed text-[#E6E8EF]">{s}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="px-4 pt-5 sm:px-6">
          <div className="hp-eyebrow mb-2.5">Coaching cues</div>
          <div className="flex flex-wrap gap-2" data-testid="drill-cues">
            {drill.cues.map((c) => (
              <span key={c} className="rounded-full border border-[#FF3EA5]/30 bg-[#FF3EA5]/10 px-3 py-1.5 text-[13px] font-bold text-[#FF8CCB]">{c}</span>
            ))}
          </div>
        </div>
        <div className="sticky bottom-0 mt-5 flex flex-wrap gap-2 border-t border-[#1d1f2c] bg-[#0f1015] p-4 sm:px-6">
          <Btn onClick={() => { timer.start(drillSession(drill)); onClose(); }} data-testid="drill-detail-start-button" className="flex-1">
            <Timer size={16} /> Start timer
          </Btn>
          <Btn variant="secondary" onClick={() => { bumpStats((s) => { s.drillsDone[drill.id] = (s.drillsDone[drill.id] || 0) + 1; s.minutes += drill.mins; return s; }); toast.success("Drill logged", { description: `${drill.name} · ${drill.mins} min added to your profile` }); }} data-testid="drill-mark-done-button">
            <CheckCircle2 size={16} /> {done ? `Done ×${done}` : "Mark done"}
          </Btn>
          <Btn variant="secondary" size="icon" onClick={() => setSaved((cur) => (cur.includes(drill.id) ? cur.filter((x) => x !== drill.id) : [...cur, drill.id]))} aria-label="Save drill" data-testid="drill-save-button">
            <Bookmark size={16} fill={isSaved ? "#FF3EA5" : "none"} className={isSaved ? "text-[#FF3EA5]" : ""} />
          </Btn>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Drills() {
  const [params, setParams] = useSearchParams();
  const [lane, setLane] = useState(params.get("lane") || "all");
  const [level, setLevel] = useState("all");
  const [q, setQ] = useState("");
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved] = useStored(KEYS.savedDrills, []);
  const [stats] = useStored(KEYS.stats, DEFAULT_STATS);
  const open = params.get("drill") ? drillById[params.get("drill")] : null;
  const setOpen = (d) => {
    const p = new URLSearchParams(params);
    if (d) p.set("drill", d.id);
    else p.delete("drill");
    setParams(p, { replace: true });
  };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return DRILLS.filter((d) => (lane === "all" || d.lane === lane) && (level === "all" || d.level === level) && (!onlySaved || saved.includes(d.id)) && (!s || d.name.toLowerCase().includes(s) || d.desc.toLowerCase().includes(s) || laneById[d.lane].name.toLowerCase().includes(s)));
  }, [lane, level, q, onlySaved, saved]);
  const laneObj = lane !== "all" ? laneById[lane] : null;

  return (
    <div data-testid="drills-page">
      <PageHeader eyebrow={`${DRILLS.length} drills · ${LANES.length} lanes`} title="Drills" sub="Every drill has step-by-step instructions, coaching cues and curated video. Beginner to pro." testid="drills-title" />

      <div className="relative mb-3">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B90A6]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search drills" data-testid="drills-search-input" className="h-12 w-full rounded-full border border-[#25273a] bg-[#0f1015] pl-11 pr-4 text-[15px] placeholder:text-[#6f7489] focus:border-[#FF3EA5] focus:outline-none" />
      </div>

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" data-testid="drills-lane-scroll">
        <button className="hp-chip shrink-0" data-active={lane === "all"} onClick={() => setLane("all")} data-testid="drills-lane-all">All lanes</button>
        {LANES.map((l) => (
          <button key={l.id} className="hp-chip shrink-0" data-active={lane === l.id} onClick={() => setLane(l.id)} data-testid={`drills-lane-${l.id}`}>
            {l.short}
          </button>
        ))}
      </div>
      <div className="mb-5 flex gap-2 overflow-x-auto no-scrollbar" data-testid="drills-level-tabs">
        {[{ id: "all", label: "All levels" }, ...LEVELS].map((l) => (
          <button key={l.id} className="hp-chip !h-8 shrink-0" data-active={level === l.id} onClick={() => setLevel(l.id)} data-testid={`drills-level-${l.id}`}>
            {l.label}
          </button>
        ))}
        <button className="hp-chip !h-8 shrink-0" data-active={onlySaved} onClick={() => setOnlySaved((v) => !v)} data-testid="drills-saved-filter">
          <Bookmark size={12} /> Saved
        </button>
      </div>

      {laneObj && (
        <motion.div key={laneObj.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="hp-card hp-hero-glow mb-4 flex items-center justify-between gap-4 p-4">
          <div>
            <div className="font-display text-xl">{laneObj.name}</div>
            <div className="mt-1 text-sm text-[#B7BBCB]">{laneObj.blurb}</div>
          </div>
          <div className="text-right">
            <div className="font-num text-3xl font-black text-[#FF3EA5]">{DRILLS.filter((d) => d.lane === laneObj.id).length}</div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B90A6]">drills</div>
          </div>
        </motion.div>
      )}

      <div className="mb-3 text-xs font-semibold text-[#8B90A6]" data-testid="drills-count">{list.length} drill{list.length === 1 ? "" : "s"}</div>
      {list.length === 0 ? (
        <Empty icon={Dumbbell} title="No drills match" text="Try another lane, level or search term." testid="drills-empty" />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((d, i) => {
            const done = stats.drillsDone?.[d.id] || 0;
            return (
              <motion.button key={d.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.02 }} whileHover={{ y: -2 }} onClick={() => setOpen(d)} data-testid="drills-drill-card" className="hp-card hp-card-hover flex flex-col p-4 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#FF3EA5]">{laneById[d.lane].short}</span>
                  {done > 0 && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2EE59D]"><CheckCircle2 size={12} /> ×{done}</span>}
                </div>
                <div className="mt-2 text-[17px] font-extrabold leading-snug text-[#F5F6F8]">{d.name}</div>
                <p className="mt-1.5 line-clamp-2 text-[13px] text-[#9DA2B6]">{d.desc}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <LevelBadge level={d.level} />
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B7BBCB]">
                    <Clock size={12} /> {d.mins} min <span className="text-[#3a3d52]">|</span> <Play size={12} className="text-[#FF3EA5]" /> Video
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
      <DrillDialog drill={open} onClose={() => setOpen(null)} />
    </div>
  );
}
