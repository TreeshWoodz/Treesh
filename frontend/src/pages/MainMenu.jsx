import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Flame, Check, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { PlayingCard } from "@/components/game/PlayingCard";
import { IconBtn } from "@/components/game/GameHeader";
import { PlayDock } from "@/components/menu/PlayDock";
import { Avatar } from "@/pages/Profile";
import { useProfile, updateProfile, todayStr } from "@/lib/progress";
import { levelInfo } from "@/lib/achievements";
import { useTreesh, useWallet } from "@/lib/treesh";
import { MODES } from "@/lib/modes";
import { sfx } from "@/lib/sound";

const LOGO = [["S", "#FF3B30"], ["O", "#FFCC00"], ["N", "#007AFF"], ["O", "#34C759"], ["K", "#FFCC00"], ["O", "#FF3B30"]];

const FLOATERS = [
  { card: { color: "blue", kind: "num", value: 4 }, x: "4%", y: "18%", r: -18, d: 7 },
  { card: { color: "wild", kind: "wild" }, x: "80%", y: "12%", r: 14, d: 9 },
  { card: { color: "yellow", kind: "num", value: 7 }, x: "86%", y: "52%", r: -10, d: 8 },
  { card: { color: "green", kind: "num", value: 2 }, x: "-2%", y: "58%", r: 12, d: 10 },
  { card: { color: "red", kind: "num", value: 5 }, x: "46%", y: "4%", r: 6, d: 11 },
];

const FloatingCards = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
    {FLOATERS.map((f, i) => (
      <motion.div
        key={i}
        className="absolute opacity-[0.16]"
        style={{ left: f.x, top: f.y }}
        animate={{ y: [0, -18, 0], rotate: [f.r, f.r + 6, f.r] }}
        transition={{ duration: f.d, repeat: Infinity, ease: "easeInOut" }}
      >
        <PlayingCard card={f.card} size="lg" />
      </motion.div>
    ))}
  </div>
);

const badgeFor = (id, s, p) => {
  if (id === "sonoko") return s.sonokoBest ? `Best ${s.sonokoBest.toLocaleString()}` : "Start here";
  if (id === "daily") return s.lastDaily === todayStr() ? "Done today" : `${s.dailyStreak}-day streak`;
  if (id === "versus") return `${s.versusWins} wins`;
  if (id === "sudoku") return `${s.sudokuWins} solved`;
  if (id === "uno") return `${s.unoWins} wins`;
  return p.tutorialDone ? "Completed" : "New";
};

const ModeCard = ({ m, selected, badge, onTap }) => (
  <motion.button
    type="button"
    data-testid={`mode-select-${m.id}-button`}
    onClick={onTap}
    whileTap={{ scale: 0.95 }}
    animate={{ scale: selected ? 1 : 0.92, y: selected ? -6 : 0 }}
    transition={{ type: "spring", stiffness: 320, damping: 22 }}
    className={`btn-3d relative snap-center shrink-0 w-[42vw] max-w-[190px] lg:w-auto lg:max-w-none h-full max-h-[230px] min-h-[150px] rounded-[1.6rem] border-[3px] text-left p-3.5 flex flex-col justify-between overflow-hidden ${
      selected ? "border-white" : "border-white/15"
    }`}
    style={{ background: `linear-gradient(160deg, ${m.from}, ${m.to2})` }}
  >
    <m.icon className="absolute -right-5 -bottom-5 w-28 h-28 text-white/15" strokeWidth={2.5} />
    <span className="self-start text-[10px] font-black uppercase tracking-wider bg-black/30 text-white rounded-full px-2 py-0.5 flex items-center gap-1">
      {m.id === "daily" && badge.includes("streak") && <Flame className="w-3 h-3" />}
      {badge === "Done today" || badge === "Completed" ? <Check className="w-3 h-3" /> : null}
      {badge}
    </span>
    <span className="relative">
      <span className="h-11 w-11 rounded-2xl bg-white/20 grid place-items-center mb-2 border-2 border-white/30">
        <m.icon className="w-6 h-6 text-white" strokeWidth={2.5} />
      </span>
      <span className="block font-display text-3xl font-black uppercase italic leading-none text-white game-title">{m.name}</span>
      <span className="block text-[11px] font-semibold text-white/85 mt-1 leading-tight">{m.sub}</span>
    </span>
    {selected && <span className="absolute inset-0 rounded-[1.4rem] ring-4 ring-inset ring-white/40 pointer-events-none" />}
  </motion.button>
);

export default function MainMenu() {
  const profile = useProfile();
  const treesh = useTreesh();
  const wallet = useWallet();
  const navigate = useNavigate();
  const lv = levelInfo(profile.xp);
  const sel = profile.lastMode || "sonoko";
  const rail = useRef(null);
  const name = treesh ? treesh.nickname : profile.name || "Guest";

  useEffect(() => {
    rail.current?.querySelector(`[data-testid=mode-select-${sel}-button]`)?.scrollIntoView({ inline: "center", block: "nearest" });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const tap = (m) => {
    if (m.id === sel) {
      sfx.play();
      return navigate(m.to);
    }
    sfx.select();
    updateProfile((p) => (p.lastMode = m.id));
  };

  return (
    <div className="h-[100dvh] overflow-hidden bg-arcade relative flex flex-col" data-testid="home-page">
      <FloatingCards />
      <header className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 pt-3 flex items-center justify-between gap-2">
        <Link to="/profile" data-testid="home-profile-chip" className="btn-3d glass rounded-2xl pl-1.5 pr-3 py-1.5 flex items-center gap-2 min-w-0">
          <span className="relative shrink-0">
            <Avatar treesh={treesh} name={name} size="h-10 w-10 text-lg" />
            <span data-testid="home-level-chip" className="absolute -bottom-1.5 -right-1.5 h-5 min-w-[20px] px-1 rounded-full bg-brand text-brand-ink border-2 border-[#0B0F19] grid place-items-center font-mono font-black text-[10px]">
              {lv.level}
            </span>
          </span>
          <span className="min-w-0">
            <span className="block font-display text-base font-black uppercase leading-none truncate max-w-[110px] sm:max-w-[180px]">{name}</span>
            <span className="block w-20 h-1.5 rounded-full bg-black/40 overflow-hidden mt-1">
              <span className="block h-full bg-brand" style={{ width: `${lv.pct}%` }} />
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/profile" data-testid="home-starlites" className="btn-3d glass rounded-2xl h-10 pl-1 pr-3 flex items-center gap-1.5 font-mono font-black text-sm">
            <span className="h-7 w-7 rounded-full bg-gradient-to-b from-[#FDE68A] to-[#F59E0B] grid place-items-center border-2 border-[#0B0F19]/40">
              <Sparkles className="w-4 h-4 text-[#7C2D12]" />
            </span>
            {wallet.toLocaleString()}
          </Link>
          <IconBtn testid="sound-toggle-button" label="Toggle sound" onClick={() => updateProfile((p) => (p.sound = !p.sound))}>
            {profile.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </IconBtn>
        </div>
      </header>

      <main className="relative z-10 flex-1 min-h-0 w-full max-w-5xl mx-auto flex flex-col pb-[calc(9.5rem+env(safe-area-inset-bottom))]">
        <section className="shrink-0 text-center pt-[3vh]">
          <p data-testid="treesh-brand" className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.3em] text-slate-300">
            <span className="h-5 w-5 rounded-md bg-[#34C759] text-[#0B0F19] grid place-items-center text-xs">T</span> Treesh Games
          </p>
          <h1 data-testid="home-title" className="logo-3d font-display font-black italic uppercase leading-[0.9] tracking-tight text-[min(19vw,13vh,9.5rem)] mt-1 select-none">
            {LOGO.map(([ch, c], i) => (
              <motion.span
                key={i}
                className="inline-block"
                style={{ color: c }}
                initial={{ y: -80, opacity: 0 }}
                animate={{ y: [0, -8, 0], opacity: 1 }}
                transition={{ opacity: { delay: i * 0.07 }, y: { delay: 0.6 + i * 0.12, duration: 1.6, repeat: Infinity, repeatDelay: 2.2 } }}
              >
                {ch}
              </motion.span>
            ))}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-300 mt-1">Sudoku logic · Card chaos</p>
        </section>

        <section className="flex-1 min-h-0 flex flex-col justify-center gap-2 pt-2">
          <div className="flex items-center justify-between px-4 sm:px-6">
            <span className="font-display text-lg font-black uppercase italic game-title">Choose mode</span>
            {!profile.tutorialDone && (
              <Link to="/play/tutorial" data-testid="home-tutorial-banner" className="animate-pulse text-[11px] font-black uppercase tracking-wider text-brand flex items-center">
                New? Learn in 60s <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>
          <div
            ref={rail}
            data-testid="mode-rail"
            className="no-scrollbar flex-1 min-h-0 max-h-[250px] flex lg:grid lg:grid-cols-6 gap-3 overflow-x-auto lg:overflow-visible snap-x snap-mandatory px-4 sm:px-6 py-3 items-center"
          >
            {MODES.map((m) => (
              <ModeCard key={m.id} m={m} selected={sel === m.id} badge={badgeFor(m.id, profile.stats, profile)} onTap={() => tap(m)} />
            ))}
          </div>
        </section>
      </main>
      <PlayDock />
    </div>
  );
}
