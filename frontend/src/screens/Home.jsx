import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, CircleHelp, Gift, ChevronRight, CalendarDays, Trophy, Wifi, WifiOff, Check } from "lucide-react";
import { useGame } from "@/game/GameContext";
import { MODES, MODE_BY_ID, DIFFICULTIES, TROPHIES, levelFromXp, STARLITE_RULES as R, COSMETIC_BY_ID } from "@/game/data";
import { dayKey } from "@/game/storage";
import { Page, Wordmark, StarPill, Avatar, Progress, SectionTitle, IconBtn, fmt } from "@/components/cz/ui";
import { Icon } from "@/components/cz/Icon";

function useCountdownToMidnight() {
  const [t, setT] = useState("");
  useEffect(() => {
    const f = () => {
      const n = new Date(); const m = new Date(n); m.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((m - n) / 1000));
      setT(`${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`);
    };
    f(); const iv = setInterval(f, 1000); return () => clearInterval(iv);
  }, []);
  return t;
}

export const PlayerCard = () => {
  const { save, profile, points, go } = useGame();
  const lv = levelFromXp(save.xp);
  const name = (profile && profile.nickname) || save.guestName || "Guest Player";
  const title = COSMETIC_BY_ID[save.equipped.title];
  return (
    <button type="button" onClick={() => go("profile")} data-testid="home-player-card" className="cz-card cz-press cz-focus flex w-full items-center gap-3.5 p-3.5 text-left">
      <Avatar profile={profile} name={name} size={54} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-base font-extrabold" data-testid="home-player-name">{name}</p>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: "rgb(var(--accent-rgb) / .2)", color: "color-mix(in oklab, var(--accent) 70%, white)" }}>LV {lv.level}</span>
        </div>
        <p className="truncate text-xs font-semibold text-white/50">{title ? title.name : "Rookie"}{profile ? " · Treesh profile" : ""}</p>
        <div className="mt-2"><Progress value={lv.pct} h={5} testid="home-xp-bar" /></div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="flex items-center gap-1"><StarPill value={points} testid="home-starlites-balance" /></span>
        <span className="text-[10px] font-bold text-white/40">{fmt(lv.need - lv.into)} XP to go</span>
      </div>
    </button>
  );
};

export default function Home() {
  const { save, go, claimDailyGift, toast, bankState, retryBank, profile } = useGame();
  const last = MODE_BY_ID[save.lastMode] || MODE_BY_ID.classic;
  const diff = DIFFICULTIES[last.fixedDifficulty || save.lastDifficulty] || DIFFICULTIES.normal;
  const today = dayKey();
  const dailyDone = save.daily.lastDate === today;
  const giftReady = save.dailyGift !== today;
  const cd = useCountdownToMidnight();
  const unlocked = Object.keys(save.trophies).length;
  const next = useMemo(() => TROPHIES.filter((t) => !save.trophies[t.id]).map((t) => ({ t, p: Math.min(1, (t.val(save) || 0) / t.goal) })).sort((a, b) => b.p - a.p).slice(0, 2), [save]);
  const [online, setOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  useEffect(() => { const a = () => setOnline(true), b = () => setOnline(false); window.addEventListener("online", a); window.addEventListener("offline", b); return () => { window.removeEventListener("online", a); window.removeEventListener("offline", b); }; }, []);

  const claim = () => {
    const g = claimDailyGift();
    if (g) toast({ kind: "info", title: "Daily gift claimed!", sub: g.map((x) => `${x.n}× ${x.name}`).join(" · "), icon: "Gift" });
  };

  return (
    <Page testid="home-screen">
      <div className="flex items-center justify-between pb-4 pt-[max(16px,env(safe-area-inset-top))] lg:pb-6 lg:pt-8">
        <div className="lg:hidden"><Wordmark /></div>
        <div className="hidden lg:block">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-white/45">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="font-display mt-1 text-4xl" data-testid="home-desktop-greeting">Welcome back, {(profile && profile.nickname) || save.guestName || "Player"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="cz-chip grid h-9 w-9 place-items-center" title={online ? "Online word check on" : "Offline: built-in word bank"} data-testid="home-online-status">{online ? <Wifi size={15} className="text-white/60" /> : <WifiOff size={15} className="text-[var(--warn)]" />}</span>
          <IconBtn label="How to play" testid="home-howto-button" onClick={() => go("howto")}><CircleHelp size={19} /></IconBtn>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] lg:grid-rows-[auto_1fr_auto_auto] lg:gap-x-6 lg:gap-y-4">
      <div className="lg:col-start-2 lg:row-start-1"><PlayerCard /></div>

      {/* hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="relative mt-4 overflow-hidden rounded-[28px] border border-white/10 p-5 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:flex lg:flex-col lg:justify-end lg:p-9"
        style={{ background: "radial-gradient(120% 100% at 0% 0%, rgb(var(--accent-rgb) / .38), transparent 55%), radial-gradient(90% 90% at 100% 100%, rgba(255,211,107,.12), transparent 60%), #0d0f16" }}>
        <div className="pointer-events-none absolute -right-6 -top-6 opacity-[.13]">
          <svg width="170" height="170" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round"><path d="M9.5 14.5l5-5" /><path d="M11 6.5l1.6-1.6a4 4 0 015.6 5.6L16.6 12" /><path d="M13 17.5l-1.6 1.6a4 4 0 01-5.6-5.6L7.4 12" /></svg>
        </div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-white/60">Ready when you are</p>
        <h2 className="font-display mt-1 text-[2.1rem] leading-[1.02] lg:text-[3.4rem]">Link words.<br />Build the chain.</h2>
        <p className="mt-2 max-w-[18rem] text-sm text-white/65 lg:max-w-[30rem] lg:text-base">Every word you link becomes the next prompt. How long can you keep it alive?</p>
        <button type="button" onClick={() => go("play", { mode: last.id, difficulty: diff.id, k: Date.now() })} disabled={bankState !== "ready"} data-testid="home-play-button"
          className="cz-press cz-focus cz-btn-primary cz-shimmer mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-[20px] text-lg font-extrabold tracking-wide disabled:opacity-50">
          <Play size={22} className="fill-current" />
          {bankState === "loading" ? "Loading words…" : "PLAY"}
          {bankState === "ready" ? <span className="rounded-full bg-black/20 px-2.5 py-1 text-[11px] font-extrabold tracking-wider">{last.name.toUpperCase()}{last.difficulty ? ` · ${diff.name.toUpperCase()}` : ""}</span> : null}
        </button>
        {bankState === "error" ? <button type="button" onClick={retryBank} className="mt-2 w-full text-center text-xs font-bold text-[var(--bad)] underline" data-testid="home-retry-bank">Couldn’t load the word bank. Tap to retry</button> : null}
        <button type="button" onClick={() => go("modes")} data-testid="home-choose-mode-button" className="cz-press cz-focus cz-btn-ghost mt-2.5 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] text-sm font-extrabold">
          Choose mode &amp; difficulty <ChevronRight size={16} />
        </button>
      </motion.div>

      {/* daily row */}
      <div className="mt-3 grid grid-cols-5 gap-3 lg:col-start-2 lg:row-start-2 lg:mt-0">
        <button type="button" onClick={() => go("modes", { select: "daily" })} data-testid="home-daily-card" className="cz-card cz-press cz-focus col-span-3 p-4 text-left">
          <div className="flex items-center gap-2"><CalendarDays size={16} className="cz-text-accent" /><span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/55">Daily Chain</span></div>
          <p className="mt-2 text-lg font-extrabold leading-tight">{dailyDone ? "Done for today" : "Today’s chain is live"}</p>
          <p className="mt-0.5 text-xs text-white/50">{dailyDone ? `Score ${fmt((save.daily.results[today] || {}).score)} · streak ${save.daily.streak}` : `+${R.dailyBase}+ Starlites · streak ${save.daily.streak}`}</p>
          <p className="font-num mt-2 text-sm text-white/70">{cd}</p>
        </button>
        <button type="button" onClick={claim} disabled={!giftReady} data-testid="home-daily-gift-button" className={`cz-card cz-press cz-focus col-span-2 flex flex-col items-center justify-center gap-2 p-4 text-center ${giftReady ? "" : "opacity-60"}`}
          style={giftReady ? { borderColor: "rgba(255,211,107,.35)", boxShadow: "0 0 30px rgba(255,211,107,.12)" } : undefined}>
          <motion.div animate={giftReady ? { rotate: [0, -8, 8, -4, 0] } : {}} transition={{ repeat: Infinity, duration: 1.6, repeatDelay: 1.4 }} className="grid h-12 w-12 place-items-center rounded-2xl" style={{ background: "rgba(255,211,107,.14)", color: "#ffd36b" }}>
            {giftReady ? <Gift size={24} /> : <Check size={22} />}
          </motion.div>
          <span className="text-xs font-extrabold">{giftReady ? "Daily gift" : "Claimed"}</span>
        </button>
      </div>

      <div className="lg:col-span-2 lg:row-start-3">
      <SectionTitle right={<button type="button" onClick={() => go("modes")} className="text-xs font-bold cz-text-accent" data-testid="home-all-modes-link">All modes</button>}>Game modes</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="home-mode-grid">
        {MODES.map((m, i) => {
          const best = save.bests[m.id];
          return (
            <motion.button key={m.id} type="button" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} onClick={() => go("modes", { select: m.id })} data-testid={`home-mode-card-${m.id}`}
              className="cz-card cz-press cz-focus flex flex-col items-start p-3.5 text-left hover:border-white/20">
              <div className="flex w-full items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: "rgb(var(--accent-rgb) / .16)" }}><Icon name={m.icon} size={19} className="cz-text-accent" /></span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/40">{m.tag}</span>
              </div>
              <p className="mt-3 font-extrabold">{m.name}</p>
              <p className="text-[11px] text-white/45">{best ? `Best ${fmt(best.score)} · ${best.links} links` : "Not played yet"}</p>
            </motion.button>
          );
        })}
      </div>

      </div>
      <div className="lg:col-span-2 lg:row-start-4">
      <SectionTitle right={<button type="button" onClick={() => go("trophies")} className="text-xs font-bold cz-text-accent" data-testid="home-trophies-link">{unlocked}/{TROPHIES.length}</button>}>Next trophies</SectionTitle>
      <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
        {next.map(({ t, p }) => (
          <button key={t.id} type="button" onClick={() => go("trophies")} className="cz-card cz-press flex w-full items-center gap-3 p-3 text-left" data-testid={`home-next-trophy-${t.id}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[.06]"><Icon name={t.icon} size={18} className="text-white/70" /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-extrabold">{t.name}</p><span className="text-[11px] font-bold text-[#ffd36b]">+{R.tierReward[t.tier]}</span></div>
              <p className="truncate text-[11px] text-white/45">{t.desc}</p>
              <div className="mt-1.5"><Progress value={p * 100} h={4} /></div>
            </div>
          </button>
        ))}
        {!next.length ? <div className="cz-card flex items-center gap-2 p-4 text-sm font-bold"><Trophy size={16} className="text-[#ffd36b]" />Every trophy unlocked. Legend.</div> : null}
      </div>
      </div>
      </div>
    </Page>
  );
}
