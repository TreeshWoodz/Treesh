import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand, Maximize2, Minimize2, Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { useTimer } from "@/context/TimerContext";
import { fmtClock } from "@/lib/storage";

const KIND = { warm: ["Warm-up", "#6AA8FF"], work: ["Work", "#FF3EA5"], rest: ["Rest", "#2EE59D"], cool: ["Cool-down", "#FFCC66"] };

function Ring({ pct, color, size = 300 }) {
  const r = 46, c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
      <circle cx="50" cy="50" r={r} fill="none" stroke="#1d1f2b" strokeWidth="3" />
      <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .2s linear" }} />
    </svg>
  );
}

export default function TimerOverlay() {
  const t = useTimer();
  if (!t.session || !t.mode) return null;
  const step = t.session.steps[t.idx];
  const nextStep = t.session.steps[t.idx + 1];
  const [kLabel, kColor] = KIND[step.kind] || KIND.work;
  const pct = step.secs ? Math.min(1, Math.max(0, 1 - t.remaining / step.secs)) : 0;
  const totalLeft = Math.max(0, t.remaining) + t.session.steps.slice(t.idx + 1).reduce((a, b) => a + b.secs, 0);

  const toggleNativeFs = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    } catch (e) {}
  };

  return (
    <AnimatePresence>
      {t.mode === "full" ? (
        <motion.div key="full" data-testid="timer-fullscreen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[90] flex flex-col bg-[#0A0A0D]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72" style={{ background: `radial-gradient(600px 260px at 50% -10%, ${kColor}22, transparent 70%)` }} />
          <div className="relative flex items-center justify-between px-4 pt-[max(16px,env(safe-area-inset-top))] sm:px-8">
            <div className="min-w-0">
              <div className="hp-eyebrow">{t.session.title}</div>
              <div className="mt-1 text-xs text-[#8B90A6]" data-testid="timer-step-count">
                Step {t.idx + 1} of {t.session.steps.length} · <span className="font-num">{fmtClock(totalLeft)}</span> left
              </div>
            </div>
            <div className="flex gap-2">
              <button data-testid="timer-native-fullscreen-button" onClick={toggleNativeFs} className="press hidden h-11 w-11 place-items-center rounded-full border border-[#25273a] bg-[#14151d] text-[#B7BBCB] sm:grid" aria-label="Toggle fullscreen">
                <Expand size={18} />
              </button>
              <button data-testid="plan-timer-minimize-button" onClick={() => t.setMode("mini")} className="press grid h-11 w-11 place-items-center rounded-full border border-[#25273a] bg-[#14151d] text-[#F5F6F8]" aria-label="Minimize timer">
                <Minimize2 size={18} />
              </button>
              <button data-testid="plan-timer-close-button" onClick={t.close} className="press grid h-11 w-11 place-items-center rounded-full border border-[#25273a] bg-[#14151d] text-[#F5F6F8]" aria-label="Close timer">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center px-6">
            {t.done ? (
              <div className="text-center" data-testid="timer-complete">
                <div className="hp-eyebrow mb-3">Session complete</div>
                <div className="font-display text-4xl text-[#F5F6F8] sm:text-6xl">Buckets earned.</div>
                <p className="mt-3 text-[#B7BBCB]">Logged to your Hoop profile.</p>
                <div className="mt-8 flex justify-center gap-3">
                  <button onClick={t.restart} data-testid="timer-restart-button" className="press inline-flex h-12 items-center gap-2 rounded-full border border-[#25273a] bg-[#171923] px-5 font-bold">
                    <RotateCcw size={16} /> Run it back
                  </button>
                  <button onClick={t.close} className="press inline-flex h-12 items-center rounded-full bg-[#FF3EA5] px-6 font-bold text-[#0A0A0D]">Done</button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative grid place-items-center">
                  <div className="hidden sm:block"><Ring pct={pct} color={kColor} size={380} /></div>
                  <div className="sm:hidden"><Ring pct={pct} color={kColor} size={290} /></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="mb-2 inline-flex h-7 items-center rounded-full px-3 text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ background: `${kColor}1f`, color: kColor }}>
                      {kLabel}
                    </span>
                    <div data-testid="timer-remaining" className="font-num text-[76px] font-black leading-none text-[#F5F6F8] sm:text-[104px]">{fmtClock(t.remaining)}</div>
                  </div>
                </div>
                <div className="mt-6 max-w-lg text-center">
                  <div data-testid="timer-step-name" className="font-display text-2xl text-[#F5F6F8] sm:text-3xl">{step.name}</div>
                  {step.note && <p className="mt-2 text-sm text-[#B7BBCB]">{step.note}</p>}
                  {nextStep && <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8B90A6]">Next · <span className="text-[#E6E8EF]">{nextStep.name}</span></p>}
                </div>
              </>
            )}
          </div>

          {!t.done && (
            <div className="relative flex items-center justify-center gap-3 px-4 pb-[max(28px,env(safe-area-inset-bottom))] sm:gap-5">
              <button data-testid="timer-prev-button" onClick={t.prev} className="press grid h-14 w-14 place-items-center rounded-full border border-[#25273a] bg-[#14151d]" aria-label="Previous">
                <ChevronLeft size={22} />
              </button>
              <button data-testid="timer-add-15-button" onClick={() => t.addTime(15)} className="press grid h-14 w-14 place-items-center rounded-full border border-[#25273a] bg-[#14151d] text-xs font-extrabold" aria-label="Add 15 seconds">
                <span className="flex items-center"><Plus size={12} />15</span>
              </button>
              <button data-testid="timer-play-pause-button" onClick={t.running ? t.pause : t.resume} className="press hp-pulse grid h-20 w-20 place-items-center rounded-full bg-[#FF3EA5] text-[#0A0A0D]" aria-label={t.running ? "Pause" : "Resume"}>
                {t.running ? <Pause size={30} fill="#0A0A0D" /> : <Play size={30} fill="#0A0A0D" className="ml-1" />}
              </button>
              <button data-testid="timer-restart-step-button" onClick={t.restart} className="press grid h-14 w-14 place-items-center rounded-full border border-[#25273a] bg-[#14151d]" aria-label="Restart session">
                <RotateCcw size={18} />
              </button>
              <button data-testid="timer-next-button" onClick={t.next} className="press grid h-14 w-14 place-items-center rounded-full border border-[#25273a] bg-[#14151d]" aria-label="Next">
                <ChevronRight size={22} />
              </button>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 h-1 bg-[#15161e]">
            <div className="h-full bg-[#FF3EA5]" style={{ width: `${((t.idx + (t.done ? 1 : pct)) / t.session.steps.length) * 100}%`, transition: "width .2s linear" }} />
          </div>
        </motion.div>
      ) : (
        <motion.div key="mini" data-testid="timer-mini-pill" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.2 }} className="fixed bottom-[calc(84px+env(safe-area-inset-bottom))] left-1/2 z-[70] w-[min(94vw,420px)] -translate-x-1/2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0">
          <div className="flex items-center gap-3 rounded-full border border-[#2c2f45] bg-[#121319] p-1.5 pr-2 shadow-[0_18px_50px_rgba(0,0,0,.65)]">
            <button onClick={t.running ? t.pause : t.resume} data-testid="timer-mini-play-pause" className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#FF3EA5] text-[#0A0A0D]" aria-label="Play or pause">
              {t.done ? <RotateCcw size={16} /> : t.running ? <Pause size={17} fill="#0A0A0D" /> : <Play size={17} fill="#0A0A0D" className="ml-0.5" />}
            </button>
            <button className="min-w-0 flex-1 text-left" onClick={() => t.setMode("full")} data-testid="timer-mini-expand">
              <div className="truncate text-[13px] font-bold text-[#F5F6F8]">{t.done ? "Session complete" : step.name}</div>
              <div className="text-[11px] font-semibold" style={{ color: kColor }}>
                {kLabel} · <span className="font-num">{fmtClock(t.remaining)}</span>
              </div>
            </button>
            <button onClick={() => t.setMode("full")} className="press grid h-9 w-9 place-items-center rounded-full text-[#B7BBCB] hover:bg-white/5" aria-label="Expand timer" data-testid="timer-mini-expand-button">
              <Maximize2 size={16} />
            </button>
            <button onClick={t.close} className="press grid h-9 w-9 place-items-center rounded-full text-[#B7BBCB] hover:bg-white/5" aria-label="Close timer" data-testid="timer-mini-close-button">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
