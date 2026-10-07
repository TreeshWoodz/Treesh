import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, BarChart3, BookOpen, CalendarDays, Grid3x3, Layers, Sparkles, ArrowRight, Flame } from "lucide-react";
import { PlayingCard } from "@/components/game/PlayingCard";
import { useProfile, updateProfile, todayStr } from "@/lib/progress";
import { ACHIEVEMENTS, levelInfo } from "@/lib/achievements";

const MODES = [
  { id: "sudoku", to: "/play/sudoku", title: "Classic Sudoku", desc: "9×9 logic. Notes, hints, three strikes.", icon: Grid3x3, color: "#007AFF" },
  { id: "uno", to: "/play/uno", title: "Classic Uno", desc: "Go card-to-card against 1–3 bots.", icon: Layers, color: "#FF3B30" },
];

const Letter = ({ ch, color, i }) => (
  <motion.span
    initial={{ y: 40, opacity: 0, rotate: -8 }}
    animate={{ y: 0, opacity: 1, rotate: 0 }}
    transition={{ delay: 0.08 * i, type: "spring", stiffness: 260, damping: 18 }}
    className="inline-block"
    style={{ color }}
  >
    {ch}
  </motion.span>
);

const HeroCards = () => (
  <div className="relative h-56 sm:h-72 w-full max-w-sm mx-auto lg:mx-0" aria-hidden>
    {[
      { card: { color: "blue", kind: "num", value: 4 }, r: -18, x: "8%", y: 30, d: 0.3 },
      { card: { color: "wild", kind: "wild" }, r: 10, x: "56%", y: 22, d: 0.5 },
      { card: { color: "yellow", kind: "num", value: 7 }, r: -4, x: "32%", y: 0, d: 0.4 },
    ].map((c, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: c.x, top: c.y }}
        initial={{ y: 80, opacity: 0, rotate: 0 }}
        animate={{ y: [0, -8, 0], opacity: 1, rotate: c.r }}
        transition={{ delay: c.d, y: { duration: 3 + i, repeat: Infinity, ease: "easeInOut" } }}
      >
        <PlayingCard card={c.card} size="lg" />
      </motion.div>
    ))}
    <div className="absolute bottom-0 left-[14%] grid grid-cols-3 gap-1 rotate-[-6deg] glass rounded-xl p-1.5">
      {[3, 0, 6, 0, 1, 0, 5, 0, 2].map((v, i) => (
        <span key={i} className="h-8 w-8 rounded-md bg-white/5 grid place-items-center font-mono font-bold text-slate-200">
          {v || ""}
        </span>
      ))}
    </div>
  </div>
);

export default function Home() {
  const profile = useProfile();
  const lv = levelInfo(profile.xp);
  const unlocked = Object.keys(profile.unlocked).length;
  const doneToday = profile.stats.lastDaily === todayStr();

  return (
    <div className="min-h-[100dvh] bg-arcade overflow-x-hidden" data-testid="home-page">
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2" data-testid="treesh-brand">
          <span className="h-8 w-8 rounded-lg bg-[#34C759] grid place-items-center font-display font-black text-[#0B0F19] text-lg">T</span>
          <span className="font-display font-bold uppercase tracking-[0.18em] text-sm text-slate-300">Treesh Games</span>
        </div>
        <Link to="/trophies" data-testid="home-level-chip" className="glass rounded-full pl-1 pr-3 py-1 flex items-center gap-2 transition-colors duration-150 hover:bg-[#1E2640]">
          <span className="h-7 w-7 rounded-full bg-[#FFCC00] text-[#0B0F19] grid place-items-center font-mono font-black text-xs">{lv.level}</span>
          <span className="w-16 sm:w-24 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <span className="block h-full bg-[#FFCC00]" style={{ width: `${lv.pct}%` }} />
          </span>
          <span className="font-mono text-xs text-slate-300">{profile.xp} XP</span>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        <section className="grid lg:grid-cols-[1.15fr_1fr] gap-6 lg:gap-10 items-center pt-8 sm:pt-12">
          <div>
            <p className="eyebrow">Treesh Games presents</p>
            <h1 data-testid="home-title" className="font-display font-black italic uppercase leading-[0.85] tracking-tight text-[22vw] sm:text-[9rem] lg:text-[10.5rem] mt-2">
              {["S", "O", "N", "O", "K", "O"].map((ch, i) => (
                <Letter key={i} ch={ch} i={i} color={["#FF3B30", "#FFCC00", "#007AFF", "#34C759", "#FFCC00", "#FF3B30"][i]} />
              ))}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mt-4 max-w-md">
              Sudoku logic. Uno chaos. Match the top card, drop it where the number belongs, and chain combos until the grid is yours.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link
                to="/play/sonoko"
                data-testid="home-play-now-button"
                className="h-14 px-8 rounded-2xl bg-[#FFCC00] text-[#0B0F19] font-display text-2xl font-black uppercase italic flex items-center gap-2 shadow-[0_10px_30px_rgba(255,204,0,0.35)] transition-transform duration-150 hover:-translate-y-0.5 active:scale-95"
              >
                Play Sonoko <ArrowRight className="w-6 h-6" />
              </Link>
              <Link
                to="/how-to-play"
                data-testid="home-how-to-play-button"
                className="h-14 px-6 rounded-2xl glass font-bold flex items-center gap-2 transition-colors duration-150 hover:bg-[#1E2640]"
              >
                <BookOpen className="w-5 h-5" /> How to play
              </Link>
            </div>
          </div>
          <HeroCards />
        </section>

        <section className="mt-12 sm:mt-16">
          <p className="eyebrow mb-4">Game modes</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link
              to="/play/sonoko"
              data-testid="mode-select-sonoko-button"
              className="group sm:col-span-2 relative overflow-hidden rounded-3xl p-6 bg-[#FFCC00] text-[#0B0F19] min-h-[190px] flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1"
            >
              <Sparkles className="absolute -right-6 -top-6 w-40 h-40 opacity-15 transition-transform duration-500 group-hover:rotate-45" />
              <span className="text-xs font-black uppercase tracking-[0.2em]">Featured · Hybrid</span>
              <div>
                <h3 className="font-display text-5xl font-black uppercase italic leading-none">Sonoko</h3>
                <p className="font-medium mt-2 max-w-sm">6×6 grid + a hand of cards. Match, place, combo, call SONOKO!</p>
                <p className="font-mono text-sm font-bold mt-3">Best: {profile.stats.sonokoBest.toLocaleString()}</p>
              </div>
            </Link>
            <Link
              to="/play/daily"
              data-testid="mode-select-daily-button"
              className="group sm:col-span-2 relative overflow-hidden rounded-3xl p-6 glass min-h-[190px] flex flex-col justify-between border-[#34C759]/40 transition-[transform,background-color] duration-200 hover:-translate-y-1 hover:bg-[#1E2640]"
            >
              <CalendarDays className="absolute -right-4 -bottom-4 w-36 h-36 text-[#34C759] opacity-15" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#34C759]">Daily challenge · {todayStr()}</span>
              <div>
                <h3 className="font-display text-5xl font-black uppercase italic leading-none">Today's grid</h3>
                <p className="text-slate-300 mt-2">Everyone gets the same puzzle and deck. Climb the daily board.</p>
                <p className="font-mono text-sm font-bold mt-3 flex items-center gap-1 text-[#34C759]">
                  <Flame className="w-4 h-4" /> {profile.stats.dailyStreak}-day streak {doneToday && "· done today ✓"}
                </p>
              </div>
            </Link>
            {MODES.map((m) => (
              <Link
                key={m.id}
                to={m.to}
                data-testid={`mode-select-${m.id}-button`}
                className="group sm:col-span-1 lg:col-span-2 rounded-3xl p-5 glass flex items-center gap-4 transition-[transform,background-color] duration-200 hover:-translate-y-1 hover:bg-[#1E2640]"
              >
                <span className="h-14 w-14 shrink-0 rounded-2xl grid place-items-center" style={{ background: m.color }}>
                  <m.icon className="w-7 h-7 text-white" />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-3xl font-black uppercase italic leading-none">{m.title}</h3>
                  <p className="text-slate-400 text-sm mt-1">{m.desc}</p>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-10 grid sm:grid-cols-3 gap-3 sm:gap-4">
          <Link to="/trophies" data-testid="home-trophies-link" className="glass rounded-3xl p-5 flex items-center gap-4 transition-colors duration-150 hover:bg-[#1E2640]">
            <Trophy className="w-9 h-9 text-[#F59E0B]" />
            <div>
              <p className="font-display text-2xl font-black uppercase">Trophies</p>
              <p className="text-slate-400 text-sm font-mono">{unlocked}/{ACHIEVEMENTS.length} unlocked</p>
            </div>
          </Link>
          <Link to="/leaderboard" data-testid="home-leaderboard-link" className="glass rounded-3xl p-5 flex items-center gap-4 transition-colors duration-150 hover:bg-[#1E2640]">
            <BarChart3 className="w-9 h-9 text-[#007AFF]" />
            <div>
              <p className="font-display text-2xl font-black uppercase">Leaderboard</p>
              <p className="text-slate-400 text-sm">Global top scores</p>
            </div>
          </Link>
          <div className="glass rounded-3xl p-5">
            <label htmlFor="player-name" className="eyebrow">Player name</label>
            <input
              id="player-name"
              data-testid="home-player-name-input"
              defaultValue={profile.name}
              maxLength={20}
              placeholder="Enter your name"
              onBlur={(e) => updateProfile((p) => (p.name = e.target.value.trim()))}
              className="mt-2 w-full h-11 rounded-xl bg-[#0B0F19] border border-white/15 px-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FFCC00]"
            />
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-10 mt-6 flex flex-col sm:flex-row gap-2 justify-between text-xs text-slate-500" data-testid="home-footer">
        <span>© {new Date().getFullYear()} Treesh Games. All rights reserved.</span>
        <span>Sonoko™ is an original game by Treesh Games.</span>
      </footer>
    </div>
  );
}
