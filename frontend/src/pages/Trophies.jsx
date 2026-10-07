import { Trophy, Lock } from "lucide-react";
import { GameHeader } from "@/components/game/GameHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useProfile, fmtTime } from "@/lib/progress";
import { ACHIEVEMENTS, TIERS, levelInfo } from "@/lib/achievements";

const AchievementCard = ({ ach, profile }) => {
  const done = !!profile.unlocked[ach.id];
  const cur = Math.min(ach.get(profile.stats, profile), ach.target);
  const tier = TIERS[ach.tier];
  return (
    <div data-testid={`achievement-card-${ach.id}`} className={`glass rounded-2xl p-4 flex gap-4 items-center ${done ? "" : "opacity-75"}`}>
      <span
        className="h-14 w-14 shrink-0 rounded-2xl grid place-items-center border-2"
        style={{ borderColor: done ? tier.color : "rgba(255,255,255,0.1)", background: done ? `${tier.color}22` : "transparent" }}
      >
        {done ? <ach.icon className="w-7 h-7" style={{ color: tier.color }} /> : <Lock className="w-6 h-6 text-slate-500" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-display text-xl font-black uppercase truncate">{ach.name}</p>
          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: tier.color, background: `${tier.color}1f` }}>
            {tier.label}
          </span>
        </div>
        <p className="text-sm text-slate-400">{ach.desc}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <span className="block h-full rounded-full" style={{ width: `${(cur / ach.target) * 100}%`, background: tier.color }} />
          </span>
          <span className="font-mono text-xs text-slate-400">
            {cur.toLocaleString()}/{ach.target.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

const Cabinet = ({ profile }) => (
  <div data-testid="trophy-cabinet-container" className="space-y-6">
    <div className="grid grid-cols-4 gap-2 sm:gap-4">
      {Object.entries(TIERS).map(([id, t]) => {
        const all = ACHIEVEMENTS.filter((a) => a.tier === id);
        const got = all.filter((a) => profile.unlocked[a.id]).length;
        return (
          <div key={id} data-testid={`trophy-tier-${id}`} className="glass rounded-3xl p-3 sm:p-5 flex flex-col items-center">
            <Trophy className="w-10 h-10 sm:w-14 sm:h-14" style={{ color: t.color, filter: got ? `drop-shadow(0 0 12px ${t.color})` : "grayscale(1)" }} />
            <p className="font-mono text-2xl sm:text-3xl font-black mt-2">{got}<span className="text-slate-500 text-base">/{all.length}</span></p>
            <p className="eyebrow !text-[10px]">{t.label}</p>
          </div>
        );
      })}
    </div>
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#1E2640] to-[#11172a] p-4 sm:p-6">
      <p className="eyebrow mb-4">The shelf</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-x-2 gap-y-6">
        {ACHIEVEMENTS.map((a) => {
          const done = !!profile.unlocked[a.id];
          const t = TIERS[a.tier];
          return (
            <div key={a.id} className="flex flex-col items-center gap-1 text-center" title={`${a.name} — ${a.desc}`}>
              <div className="relative">
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: done ? t.color : "#2a3350" }} />
                {done && <a.icon className="absolute left-1/2 top-[22%] -translate-x-1/2 w-3.5 h-3.5 text-[#0B0F19]" />}
              </div>
              <span className="h-1 w-12 rounded-full bg-[#0B0F19]" />
              <span className={`text-[10px] leading-tight font-semibold ${done ? "text-slate-200" : "text-slate-600"}`}>{done ? a.name : "???"}</span>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

const Stats = ({ profile }) => {
  const s = profile.stats;
  const rows = [
    ["Sonoko games", s.sonokoPlayed], ["Sonoko wins", s.sonokoWins], ["Best Sonoko score", s.sonokoBest.toLocaleString()],
    ["Best combo", s.maxCombo], ["SONOKO! calls", s.sonokoCalls], ["Color matches", s.colorMatches],
    ["Sudoku solved", `${s.sudokuWins}/${s.sudokuPlayed}`], ["Best Easy", s.sudokuBest.easy ? fmtTime(s.sudokuBest.easy) : "—"],
    ["Best Medium", s.sudokuBest.medium ? fmtTime(s.sudokuBest.medium) : "—"], ["Best Hard", s.sudokuBest.hard ? fmtTime(s.sudokuBest.hard) : "—"],
    ["Uno wins", `${s.unoWins}/${s.unoPlayed}`], ["Daily streak", `${s.dailyStreak} (best ${s.bestDailyStreak})`],
    ["Cards played", s.cardsPlayed], ["Total XP", profile.xp],
  ];
  return (
    <div data-testid="stats-grid" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
      {rows.map(([k, v]) => (
        <div key={k} className="glass rounded-2xl p-4">
          <p className="text-xs text-slate-400">{k}</p>
          <p className="font-mono text-2xl font-extrabold">{v}</p>
        </div>
      ))}
    </div>
  );
};

export default function Trophies() {
  const profile = useProfile();
  const lv = levelInfo(profile.xp);
  const unlocked = Object.keys(profile.unlocked).length;
  return (
    <div className="min-h-[100dvh] bg-arcade pb-10" data-testid="trophies-page">
      <GameHeader title="Trophies" accent="#F59E0B" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <div className="glass rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between rise">
          <div className="flex items-center gap-4">
            <span className="h-16 w-16 rounded-2xl bg-[#FFCC00] text-[#0B0F19] grid place-items-center font-mono text-3xl font-black">{lv.level}</span>
            <div>
              <p className="eyebrow">{profile.name || "Player"}</p>
              <p className="font-display text-3xl font-black uppercase">Level {lv.level}</p>
              <div className="w-48 h-2 rounded-full bg-white/10 overflow-hidden mt-1">
                <span className="block h-full bg-[#FFCC00]" style={{ width: `${lv.pct}%` }} />
              </div>
              <p className="font-mono text-xs text-slate-400 mt-1">{profile.xp - lv.base}/{lv.next - lv.base} XP to next level</p>
            </div>
          </div>
          <p data-testid="achievements-unlocked-count" className="font-mono text-4xl font-black">
            {unlocked}<span className="text-slate-500 text-xl">/{ACHIEVEMENTS.length}</span>
          </p>
        </div>
        <Tabs defaultValue="cabinet" className="mt-6">
          <TabsList className="bg-[#161C2E] border border-white/10 h-12 p-1 rounded-2xl w-full sm:w-auto">
            <TabsTrigger data-testid="trophies-tab-cabinet" value="cabinet" className="rounded-xl h-10 px-4 flex-1 data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#0B0F19] font-bold">Cabinet</TabsTrigger>
            <TabsTrigger data-testid="trophies-tab-achievements" value="achievements" className="rounded-xl h-10 px-4 flex-1 data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#0B0F19] font-bold">Achievements</TabsTrigger>
            <TabsTrigger data-testid="trophies-tab-stats" value="stats" className="rounded-xl h-10 px-4 flex-1 data-[state=active]:bg-[#F59E0B] data-[state=active]:text-[#0B0F19] font-bold">Stats</TabsTrigger>
          </TabsList>
          <TabsContent value="cabinet" className="mt-5"><Cabinet profile={profile} /></TabsContent>
          <TabsContent value="achievements" className="mt-5">
            <div className="grid md:grid-cols-2 gap-3">
              {ACHIEVEMENTS.map((a) => <AchievementCard key={a.id} ach={a} profile={profile} />)}
            </div>
          </TabsContent>
          <TabsContent value="stats" className="mt-5"><Stats profile={profile} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
