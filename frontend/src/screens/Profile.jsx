import React, { useEffect, useState } from "react";
import { Pencil, Check, Link2 } from "lucide-react";
import { useGame } from "@/game/GameContext";
import { MODES, MODE_BY_ID, DIFFICULTIES, levelFromXp, COSMETIC_BY_ID, TROPHIES } from "@/game/data";
import { getRuns } from "@/game/storage";
import { cap } from "@/game/words";
import { Page, Header, Avatar, Progress, SectionTitle, StarPill, fmt } from "@/components/cz/ui";
import { Icon } from "@/components/cz/Icon";

export default function Profile() {
  const { save, profile, points, accent, setGuestName, updateTreeshProfile, toast } = useGame();
  const [runs, setRuns] = useState([]);
  const [edit, setEdit] = useState(false);
  const name = (profile && profile.nickname) || save.guestName || "Guest Player";
  const [val, setVal] = useState(name);
  useEffect(() => { getRuns().then((r) => setRuns(r.slice(0, 15))); }, []);
  const lv = levelFromXp(save.xp);
  const S = save.stats;
  const title = COSMETIC_BY_ID[save.equipped.title];

  const saveName = () => {
    const v = val.trim().slice(0, 24);
    if (!v) return;
    if (profile) updateTreeshProfile({ nickname: v }); else setGuestName(v);
    setEdit(false);
    toast({ kind: "info", title: "Name saved", sub: profile ? "Updated in your Treesh profile too" : "Saved on this device", icon: "BadgeCheck" });
  };

  const stats = [
    ["Runs", fmt(S.runs)], ["Total links", fmt(S.links)], ["Best chain", S.bestChain], ["Best score", fmt(S.bestScore)],
    ["Speedy answers", fmt(S.fast)], ["Golden words", S.goldWords], ["Longest word", S.longestWordText ? cap(S.longestWordText) : "—"], ["Starlites earned", fmt(S.starlitesEarned)],
    ["Daily streak", `${save.daily.streak} (best ${save.daily.bestStreak})`], ["Trophies", `${Object.keys(save.trophies).length}/${TROPHIES.length}`], ["Power-ups used", S.powerupsUsed], ["Play time", `${Math.round(S.playSeconds / 60)} min`],
  ];

  return (
    <Page testid="profile-screen">
      <Header title="Profile" sub={profile ? "Synced with your Treesh profile" : "Playing as guest on this device"} right={<StarPill value={points} testid="profile-starlites-balance" />} testid="profile" />
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 p-5" style={{ background: "radial-gradient(120% 100% at 50% 0%, rgb(var(--accent-rgb) / .32), transparent 60%), #0d0f16" }}>
        <div className="flex items-center gap-4">
          <Avatar profile={profile} name={name} size={76} />
          <div className="min-w-0 flex-1">
            {edit ? (
              <div className="flex items-center gap-2">
                <input value={val} onChange={(e) => setVal(e.target.value)} maxLength={24} autoFocus data-testid="profile-name-input" className="h-10 min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-3 font-bold focus:border-[var(--accent)] focus:outline-none" onKeyDown={(e) => e.key === "Enter" && saveName()} />
                <button type="button" onClick={saveName} data-testid="profile-name-save" className="cz-press cz-btn-primary grid h-10 w-10 place-items-center rounded-xl"><Check size={17} /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="font-display truncate text-2xl" data-testid="profile-name">{name}</h2>
                <button type="button" onClick={() => { setVal(name); setEdit(true); }} aria-label="Edit name" data-testid="profile-edit-name" className="grid h-8 w-8 place-items-center rounded-full bg-white/5 text-white/60"><Pencil size={14} /></button>
              </div>
            )}
            <p className="mt-0.5 text-sm font-semibold cz-text-accent">{title ? title.name : "Rookie"}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/50">
              <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ background: accent }} />{accent.toUpperCase()}</span>
              {profile && profile.zodiac ? <span>· {profile.zodiac}</span> : null}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm"><span className="font-extrabold">Level {lv.level}</span><span className="text-xs text-white/50">{fmt(lv.into)} / {fmt(lv.need)} XP</span></div>
        <div className="mt-1.5"><Progress value={lv.pct} /></div>
      </div>

      <SectionTitle>Lifetime stats</SectionTitle>
      <div className="grid grid-cols-2 gap-2.5" data-testid="profile-stats">
        {stats.map(([k, v]) => (
          <div key={k} className="cz-card p-3.5"><p className="text-[10px] font-extrabold uppercase tracking-wider text-white/45">{k}</p><p className="mt-1 truncate text-lg font-extrabold">{v}</p></div>
        ))}
      </div>

      <SectionTitle>Personal bests</SectionTitle>
      <div className="cz-card divide-y divide-white/[.06]" data-testid="profile-mode-bests">
        {MODES.map((m) => {
          const b = save.bests[m.id];
          return (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <Icon name={m.icon} size={17} className="cz-text-accent" />
              <span className="flex-1 text-sm font-bold">{m.name}</span>
              {b ? <span className="text-right"><span className="font-num block text-sm">{fmt(b.score)}</span><span className="block text-[10px] text-white/45">{b.links} links · chain {b.chain}{b.difficulty && m.difficulty ? ` · ${DIFFICULTIES[b.difficulty].name}` : ""}</span></span> : <span className="text-xs text-white/35">—</span>}
            </div>
          );
        })}
      </div>

      <SectionTitle>Recent runs</SectionTitle>
      <div className="space-y-2" data-testid="profile-run-history">
        {runs.length ? runs.map((r) => (
          <div key={r.id} className="cz-card p-3.5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-extrabold">{(MODE_BY_ID[r.mode] || {}).name}<span className="ml-1.5 text-xs font-bold text-white/40">{new Date(r.at).toLocaleDateString()}</span></span>
              <span className="font-num">{fmt(r.score)}</span>
            </div>
            <p className="mt-1 flex items-center gap-1 truncate text-xs text-white/50"><Link2 size={11} />{r.links} links · +{r.stars} Starlites · {(r.chain || []).slice(0, 5).map((c) => cap(c.a)).join(" → ")}</p>
          </div>
        )) : <p className="cz-card p-4 text-sm text-white/50">No runs yet. Your history is saved on this device.</p>}
      </div>
    </Page>
  );
}
