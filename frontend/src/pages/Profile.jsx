import { Link } from "react-router-dom";
import { PlayDock } from "@/components/menu/PlayDock";
import { Sparkles, Trophy, Link2, Star, Clock } from "lucide-react";
import { GameHeader } from "@/components/game/GameHeader";
import { useProfile, updateProfile } from "@/lib/progress";
import { useTreesh, useWallet } from "@/lib/treesh";
import { ACHIEVEMENTS, TIERS, levelInfo } from "@/lib/achievements";

export const Avatar = ({ treesh, name, size = "h-16 w-16 text-2xl" }) =>
  treesh?.avatar ? (
    <img src={treesh.avatar} alt="" className={`${size} rounded-2xl object-cover border-2 border-white/20`} />
  ) : (
    <span className={`${size} rounded-2xl bg-brand text-brand-ink grid place-items-center font-display font-black`}>
      {(name || "P").replace("@", "").slice(0, 1).toUpperCase()}
    </span>
  );

export default function Profile() {
  const p = useProfile();
  const t = useTreesh();
  const wallet = useWallet();
  const lv = levelInfo(p.xp);
  const s = p.summary || { tiers: {}, winsTotal: 0, played: 0 };
  const display = t ? t.nickname : p.name || "Guest player";
  const recent = ACHIEVEMENTS.filter((a) => p.unlocked[a.id]).sort((x, y) => p.unlocked[y.id] - p.unlocked[x.id]).slice(0, 6);

  return (
    <div className="min-h-[100dvh] bg-arcade pb-[calc(11rem+env(safe-area-inset-bottom))]" data-testid="profile-page">
      <GameHeader title="Profile" accent="var(--brand)" />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        <section className="glass rounded-3xl p-5 sm:p-6 rise">
          <div className="flex items-center gap-4">
            <Avatar treesh={t} name={display} size="h-20 w-20 text-3xl" />
            <div className="min-w-0 flex-1">
              <p data-testid="profile-display-name" className="font-display text-3xl sm:text-4xl font-black uppercase truncate">{display}</p>
              {t?.username && <p className="text-slate-400 font-mono text-sm">@{t.username}</p>}
              <p data-testid="profile-treesh-status" className={`mt-1 inline-flex items-center gap-1.5 text-xs font-bold rounded-full px-2.5 py-1 ${t ? "bg-[#34C759]/15 text-[#34C759]" : "bg-white/5 text-slate-400"}`}>
                <Link2 className="w-3.5 h-3.5" />
                {t ? (t.signedIn ? "Synced with your Treesh account" : "Linked to your Treesh profile on this device") : "Guest — open Sonoku from treesh.app to link your Treesh profile"}
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-2xl bg-[#0B0F19]/70 p-3">
              <p className="eyebrow !text-[10px]">Level</p>
              <p data-testid="profile-level" className="font-mono text-2xl font-black">{lv.level}</p>
              <span className="block h-1.5 rounded-full bg-white/10 overflow-hidden mt-1"><span className="block h-full bg-brand" style={{ width: `${lv.pct}%` }} /></span>
            </div>
            <div className="rounded-2xl bg-[#0B0F19]/70 p-3">
              <p className="eyebrow !text-[10px]">Treesh Starlites</p>
              <p data-testid="profile-starlites" className="font-mono text-2xl font-black text-[#F59E0B] flex items-center gap-1"><Sparkles className="w-5 h-5" />{wallet.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">{(p.starlites || 0).toLocaleString()} earned in Sonoku</p>
            </div>
            <div className="rounded-2xl bg-[#0B0F19]/70 p-3">
              <p className="eyebrow !text-[10px]">Trophies</p>
              <p data-testid="profile-trophies" className="font-mono text-2xl font-black">{Object.keys(p.unlocked).length}<span className="text-slate-500 text-base">/{ACHIEVEMENTS.length}</span></p>
            </div>
            <div className="rounded-2xl bg-[#0B0F19]/70 p-3">
              <p className="eyebrow !text-[10px]">Wins</p>
              <p data-testid="profile-wins" className="font-mono text-2xl font-black">{s.winsTotal}</p>
            </div>
          </div>
          {!t && (
            <div className="mt-4">
              <label htmlFor="profile-name" className="eyebrow">Player name</label>
              <input
                id="profile-name"
                data-testid="profile-name-input"
                defaultValue={p.name}
                maxLength={20}
                placeholder="Enter your name"
                onBlur={(e) => updateProfile((x) => (x.name = e.target.value.trim()))}
                className="mt-2 w-full h-11 rounded-xl bg-[#0B0F19] border border-white/15 px-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
          )}
        </section>

        <section className="glass rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">Trophy case</p>
            <Link to="/trophies" data-testid="profile-trophies-link" className="text-xs font-bold text-brand hover:underline">See all →</Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(TIERS).map(([id, tier]) => (
              <div key={id} className="rounded-2xl bg-[#0B0F19]/70 p-3 flex flex-col items-center" data-testid={`profile-tier-${id}`}>
                <Trophy className="w-8 h-8" style={{ color: tier.color }} />
                <p className="font-mono text-xl font-black">{s.tiers?.[id] || 0}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate-400">{tier.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 grid sm:grid-cols-2 gap-2">
            {recent.length ? (
              recent.map((a) => (
                <div key={a.id} className="rounded-xl bg-[#0B0F19]/60 px-3 py-2 flex items-center gap-3">
                  <a.icon className="w-5 h-5 shrink-0" style={{ color: TIERS[a.tier].color }} />
                  <span className="font-semibold text-sm truncate flex-1">{a.name}</span>
                  <span className="text-[10px] uppercase font-bold" style={{ color: TIERS[a.tier].color }}>{TIERS[a.tier].label}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No trophies yet — win a game to earn your first.</p>
            )}
          </div>
        </section>

        <section className="glass rounded-3xl p-5">
          <p className="eyebrow mb-3">Starlites earned in Sonoku</p>
          <div className="space-y-1.5" data-testid="profile-starlog">
            {(p.starLog || []).slice(0, 12).map((e, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Star className="w-4 h-4 text-[#F59E0B] shrink-0" />
                <span className="flex-1 truncate">{e.r}</span>
                <span className="text-slate-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(e.t).toLocaleDateString()}</span>
                <span className="font-mono font-bold text-[#F59E0B]">+{e.a}</span>
              </div>
            ))}
            {!p.starLog?.length && <p className="text-sm text-slate-400">Play any mode to start earning Starlites. Trophies pay out big: Bronze 25 · Silver 50 · Gold 100 · Platinum 500.</p>}
          </div>
        </section>
      </main>
      <PlayDock />
    </div>
  );
}
