import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Sparkles, CalendarDays, Star } from "lucide-react";
import { useGame, playerName } from "@/lib/store";
import { MODES, ACHIEVEMENTS, rankFor, TIERS, tierFor } from "@/data/game";
import { LEXICON } from "@/data/lexicon";
import { Avatar } from "@/components/game/Avatar";
import { Starlite } from "@/components/game/Starlite";
import { ProfileSheet } from "@/components/game/ProfileSheet";

const ago = (t) => {
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const Wallet = () => {
  const { state, treeshStars } = useGame();
  const cells = [["Ebonics", state.starlites, "wallet-ebonics"], ["Treesh account", treeshStars, "wallet-treesh"], ["Combined", state.starlites + treeshStars, "wallet-total"]];
  return (
    <div data-testid="profile-starlites" className="rounded-3xl p-5 border border-[var(--eb-gold)] gold-glow bg-[var(--eb-surface)]">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[var(--eb-gold)]"><Starlite className="w-4 h-4" />Starlites</div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        {cells.map(([l, v, id]) => (
          <div key={id}><div data-testid={id} className="font-mono text-2xl font-extrabold">{v.toLocaleString()}</div><div className="text-[10px] uppercase tracking-wider text-slate-400">{l}</div></div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-3">Ebonics Starlites sync to your Treesh profile's Arcade stats. Lifetime earned in Ebonics: {state.totalEarned.toLocaleString()}.</p>
    </div>
  );
};

const History = () => {
  const { state } = useGame();
  const log = state.starLog || [];
  return (
    <div className="glass rounded-3xl p-5" data-testid="starlites-history">
      <div className="font-display text-2xl">STARLITES HISTORY</div>
      {!log.length && <p className="text-sm text-slate-400 mt-2" data-testid="starlites-history-empty">Play a round or claim your daily drop to start stacking.</p>}
      <div className="mt-2 divide-y divide-[var(--eb-border)]">
        {log.slice(0, 15).map((e, i) => (
          <div key={e.t + "-" + i} data-testid={`starlites-log-${i}`} className="flex items-center gap-3 py-2.5 text-sm">
            <span className="flex-1">{e.r}</span>
            <span className="text-xs text-slate-500">{ago(e.t)}</span>
            <span className={`font-mono font-extrabold w-16 text-right ${e.a >= 0 ? "text-[var(--eb-gold)]" : "text-[var(--eb-a2)]"}`}>{e.a >= 0 ? "+" : ""}{e.a}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Profile() {
  const { state, profile } = useGame();
  const [edit, setEdit] = useState(false);
  const { rank, next, pct } = rankFor(state.xp);
  const stats = [["Games", state.gamesPlayed], ["Correct", state.totalCorrect], ["Best combo", `${state.bestCombo}x`], ["Achievements", `${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length}`], ["Words learned", `${state.learned.length}/${LEXICON.length}`], ["Day streak", state.streak.count]];
  return (
    <div data-testid="profile-page">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[2rem] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:items-center">
        <Avatar profile={profile} className="w-28 h-28 text-5xl border-2 border-[var(--eb-gold)]" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--eb-gold)]">Treesh profile</div>
          <h1 data-testid="profile-nickname" className="font-display text-5xl sm:text-6xl leading-none mt-1 truncate">{profile?.nickname || "Treesh Fan"}</h1>
          <div className="flex flex-wrap gap-2 mt-3 text-xs">
            {profile?.username && <span data-testid="profile-username" className="px-3 py-1 rounded-full border border-[var(--eb-border)]">@{profile.username}</span>}
            {profile?.zodiac && <span data-testid="profile-zodiac" className="px-3 py-1 rounded-full border border-[var(--eb-border)] flex items-center gap-1"><Sparkles className="w-3 h-3 text-[var(--eb-a2)]" />{profile.zodiac}</span>}
            {profile?.joined && <span className="px-3 py-1 rounded-full border border-[var(--eb-border)] flex items-center gap-1"><CalendarDays className="w-3 h-3" />Joined {new Date(profile.joined).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</span>}
          </div>
          <p className="text-xs text-slate-500 mt-2">Leaderboard name: <span className="text-slate-300">{playerName(profile) || "—"}</span></p>
        </div>
        <button data-testid="edit-profile-btn" onClick={() => setEdit(true)} className="lift self-start flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--eb-border)] font-bold"><Pencil className="w-4 h-4" />Edit</button>
      </motion.section>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <Wallet />
        <div className="glass rounded-3xl p-5" data-testid="profile-rank">
          <div className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Rank</div>
          <div className="font-display text-4xl text-[var(--eb-gold)] mt-1">{rank.name}</div>
          <div className="h-2 rounded-full bg-black/40 mt-3 overflow-hidden"><div className="h-full bg-gradient-to-r from-[var(--eb-a1)] to-[var(--eb-gold)]" style={{ width: `${pct}%` }} /></div>
          <div className="text-xs font-mono text-slate-400 mt-2">{state.xp.toLocaleString()} XP{next ? ` · ${next.xp - state.xp} to ${next.name}` : " · max"}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4" data-testid="profile-stats">
        {stats.map(([l, v]) => <div key={l} className="glass rounded-2xl p-3 text-center"><div className="font-mono text-xl font-extrabold">{v}</div><div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{l}</div></div>)}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-4">
        <History />
        <div className="glass rounded-3xl p-5" data-testid="profile-bests">
          <div className="font-display text-2xl">PERSONAL BESTS</div>
          <div className="mt-2 divide-y divide-[var(--eb-border)]">
            {MODES.map((m) => {
              const best = state.best[m.id] || 0, t = tierFor(m.id, best);
              return (
                <div key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex-1">{m.title}</span>
                  {t >= 0 && <Star className="w-4 h-4" style={{ color: TIERS[t].color }} fill={TIERS[t].color} />}
                  <span className="font-mono font-extrabold">{best.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <ProfileSheet open={edit} onOpenChange={setEdit} />
    </div>
  );
}
