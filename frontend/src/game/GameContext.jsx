import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadSave, writeSave, defaultSave, saveRun, idb, dayKey, LS, SAVE_KEY } from "./storage";
import * as T from "./treesh";
import { configureWords, loadBank } from "./words";
import { configureAudio, sfxUnlock, sfxCoin } from "./audio";
import { TROPHIES, STARLITE_RULES as R, DIFFICULTIES, MODE_BY_ID, COSMETIC_BY_ID, POWERUP_BY_ID, BUNDLES, levelFromXp, POWERUPS } from "./data";

const Ctx = createContext(null);
export const useGame = () => useContext(Ctx);

const BANK_URL = (process.env.PUBLIC_URL || "") + "/data/chainz-bank.json";

export function GameProvider({ children }) {
  const [save, setSave] = useState(() => loadSave());
  const saveRef = useRef(save);
  const [tick, setTick] = useState(0); // treesh refresh
  const [bankState, setBankState] = useState("loading");
  const [toasts, setToasts] = useState([]);
  const [screen, setScreen] = useState(() => (LS.get("chainz_seen_howto", false) ? "home" : "howto"));
  const [params, setParams] = useState({});
  const processed = useRef(new Set());

  const commit = useCallback((fn) => {
    const base = typeof structuredClone === "function" ? structuredClone(saveRef.current) : JSON.parse(JSON.stringify(saveRef.current));
    const next = typeof fn === "function" ? fn(base) || base : fn;
    saveRef.current = next;
    writeSave(next);
    setSave(next);
    return next;
  }, []);

  /* ---- Treesh sync ---- */
  useEffect(() => {
    T.startTreeshSync();
    const un = T.subscribeTreesh(() => setTick((t) => t + 1));
    const onStorage = (e) => { if (e.key === SAVE_KEY && e.newValue) { const s = loadSave(); saveRef.current = s; setSave(s); } };
    window.addEventListener("storage", onStorage);
    return () => { un(); window.removeEventListener("storage", onStorage); };
  }, []);
  const profile = useMemo(() => T.readProfile(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const treeshAccent = useMemo(() => T.readAccent(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const points = useMemo(() => T.readPoints(), [tick]); // eslint-disable-line react-hooks/exhaustive-deps
  const refreshWallet = useCallback(() => setTick((t) => t + 1), []);

  const accent = save.settings.accentSource === "custom" ? save.settings.customAccent : treeshAccent || T.DEFAULT_ACCENT;
  useEffect(() => { T.applyAccentVars(accent); }, [accent]);

  /* ---- settings side effects ---- */
  const st = save.settings;
  useEffect(() => {
    configureAudio({ volume: st.volume, sfx: st.sfx, sound: save.equipped.sound, music: st.music });
  }, [st.volume, st.sfx, st.music, save.equipped.sound]);
  useEffect(() => {
    configureWords({ cache: { get: (k) => idb.get("assoc", k), put: (v) => idb.put("assoc", v) }, useOnline: st.onlineWords });
  }, [st.onlineWords]);
  useEffect(() => {
    document.documentElement.classList.toggle("cz-reduced", !!st.reducedMotion);
  }, [st.reducedMotion]);

  /* ---- word bank ---- */
  useEffect(() => {
    let alive = true;
    loadBank(BANK_URL).then(() => alive && setBankState("ready")).catch(() => alive && setBankState("error"));
    return () => { alive = false; };
  }, []);
  const retryBank = useCallback(() => {
    setBankState("loading");
    loadBank(BANK_URL).then(() => setBankState("ready")).catch(() => setBankState("error"));
  }, []);

  /* ---- toasts ---- */
  const toast = useCallback((t) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((a) => [...a.slice(-3), { id, ...t }]);
    setTimeout(() => setToasts((a) => a.filter((x) => x.id !== id)), t.ms || 3200);
  }, []);
  const dismissToast = useCallback((id) => setToasts((a) => a.filter((x) => x.id !== id)), []);

  const screenRef = useRef(screen);
  useEffect(() => { screenRef.current = screen; }, [screen]);
  const go = useCallback((s, p, fromHistory) => {
    setParams(p || {}); setScreen(s); screenRef.current = s;
    if (!fromHistory && !T.isEmbedded) { try { window.history.pushState({ cz: s, p: p || {} }, ""); } catch (e) { /* noop */ } }
    try { window.scrollTo(0, 0); } catch (e) { /* noop */ }
  }, []);
  /* browser / system back button moves between Chainz screens (and pauses a live run instead of leaving it) */
  useEffect(() => {
    if (T.isEmbedded) return undefined; // inside Treesh the parent owns the back button
    try { window.history.replaceState({ cz: screenRef.current, p: {} }, ""); } catch (e) { /* noop */ }
    const onPop = (e) => {
      if (screenRef.current === "play") {
        try { window.history.pushState({ cz: "play", p: {} }, ""); } catch (err) { /* noop */ }
        window.dispatchEvent(new Event("chainz:pause"));
        return;
      }
      const st = e.state && e.state.cz ? e.state : { cz: "home", p: {} };
      const target = st.cz === "play" ? "home" : st.cz;
      go(target, target === "results" ? st.p : {}, true);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [go]);

  /* ---- trophies ---- */
  const evalTrophies = useCallback((draft) => {
    const fresh = [];
    TROPHIES.forEach((tr) => {
      if (draft.trophies[tr.id]) return;
      let v = 0;
      try { v = tr.val(draft) || 0; } catch (e) { v = 0; }
      if (v >= tr.goal) { draft.trophies[tr.id] = Date.now(); fresh.push(tr); }
    });
    return fresh;
  }, []);
  const payTrophies = useCallback((list, quiet) => {
    if (!list.length) return;
    list.forEach((tr, i) => {
      const amt = R.tierReward[tr.tier];
      T.awardStars(amt, `Chainz trophy: ${tr.name}`);
      if (quiet) { if (i === 0) setTimeout(sfxUnlock, 900); return; }
      setTimeout(() => {
        sfxUnlock();
        toast({ kind: "trophy", title: `Trophy unlocked: ${tr.name}`, sub: `${tr.desc} · +${amt} Starlites`, tier: tr.tier, icon: tr.icon, ms: 4200 });
      }, 350 + i * 900);
    });
    refreshWallet();
  }, [toast, refreshWallet]);
  const commitWithTrophies = useCallback((mut) => {
    let fresh = [];
    commit((d) => { mut(d); fresh = evalTrophies(d); return d; });
    payTrophies(fresh);
  }, [commit, evalTrophies, payTrophies]);

  /* ---- actions ---- */
  const updateSettings = useCallback((patch) => commit((d) => { d.settings = { ...d.settings, ...patch }; return d; }), [commit]);

  const buy = useCallback((item, kind) => {
    // kind: 'powerup' | 'bundle' | 'cosmetic'
    const price = item.price || 0;
    if (kind === "cosmetic" && saveRef.current.owned.includes(item.id)) return { ok: false, reason: "Already owned" };
    if (price > T.readPoints()) return { ok: false, reason: "Not enough Starlites" };
    const ok = T.spendStars(price, `Chainz shop: ${item.name}`);
    if (!ok) return { ok: false, reason: "Not enough Starlites" };
    commitWithTrophies((d) => {
      d.stats.purchases += 1;
      if (kind === "powerup") d.inventory[item.id] = (d.inventory[item.id] || 0) + 1;
      else if (kind === "bundle") Object.entries(item.give).forEach(([k, n]) => { d.inventory[k] = (d.inventory[k] || 0) + n; });
      else if (!d.owned.includes(item.id)) d.owned.push(item.id);
    });
    sfxCoin();
    refreshWallet();
    return { ok: true };
  }, [commitWithTrophies, refreshWallet]);

  const equip = useCallback((group, id) => commit((d) => { if (d.owned.includes(id)) d.equipped[group] = id; return d; }), [commit]);

  const consumePowerup = useCallback((id) => {
    if ((saveRef.current.inventory[id] || 0) <= 0) return false;
    commit((d) => { d.inventory[id] = Math.max(0, (d.inventory[id] || 0) - 1); d.stats.powerupsUsed += 1; return d; });
    return true;
  }, [commit]);

  const setBoosterArmed = useCallback((on) => commit((d) => { d.boosterArmed = !!on && (d.inventory.booster || 0) > 0; return d; }), [commit]);

  const claimDailyGift = useCallback(() => {
    const today = dayKey();
    if (saveRef.current.dailyGift === today) return null;
    const pool = POWERUPS.filter((p) => p.id !== "booster");
    const a = pool[Math.floor(Math.random() * pool.length)];
    const b = pool[Math.floor(Math.random() * pool.length)];
    const gift = { [a.id]: 1 };
    gift[b.id] = (gift[b.id] || 0) + 1;
    commit((d) => { d.dailyGift = today; Object.entries(gift).forEach(([k, n]) => { d.inventory[k] = (d.inventory[k] || 0) + n; }); return d; });
    sfxCoin();
    return Object.entries(gift).map(([k, n]) => ({ ...POWERUP_BY_ID[k], n }));
  }, [commit]);

  const setGuestName = useCallback((name) => commit((d) => { d.guestName = String(name || "").slice(0, 24); return d; }), [commit]);

  const resetProgress = useCallback(async () => {
    const fresh = defaultSave();
    fresh.settings = saveRef.current.settings;
    saveRef.current = fresh;
    writeSave(fresh);
    setSave(fresh);
    await idb.clear("runs");
    await idb.clear("assoc");
  }, []);

  /** Bank a finished run: rewards, stats, bests, daily streak, trophies. Returns a results summary. */
  const finishRun = useCallback((run) => {
    if (processed.current.has(run.id)) return null;
    processed.current.add(run.id);
    const s0 = saveRef.current;
    const mode = MODE_BY_ID[run.mode];
    const diff = DIFFICULTIES[run.difficulty];
    const today = dayKey();
    const P = run.pending;
    const inRunRaw = P.links * R.perLink + P.combos * R.comboBonus + P.speed * R.speedBonus + P.gold * R.goldWord;
    let mult = diff.star * mode.starMult * (run.booster ? 2 : 1);
    const earnDay = s0.earnDay.date === today ? s0.earnDay : { date: today, amount: 0, runs: 0 };
    const capped = earnDay.amount >= R.softCapPerDay;
    if (capped) mult *= 0.5;
    const breakdown = [];
    const add = (label, amount, note) => { if (amount > 0) breakdown.push({ label, amount: Math.round(amount), note }); };
    add("Links", P.links * R.perLink * mult, `${P.links} × ${R.perLink}`);
    add("Combo milestones", P.combos * R.comboBonus * mult, `${P.combos} × ${R.comboBonus}`);
    add("Speed bonus", P.speed * R.speedBonus * mult, `${P.speed} fast answers`);
    add("Golden words", P.gold * R.goldWord * mult, `${P.gold} × ${R.goldWord}`);
    const prevBest = s0.bests[run.mode];
    const newBest = run.links >= 3 && run.score > ((prevBest && prevBest.score) || 0);
    if (run.links >= 5) add("Run complete", R.completion);
    if (newBest) add("Personal best", R.personalBest);
    if (earnDay.runs === 0 && run.links >= 1) add("First run today", R.firstRunOfDay);
    let dailyDone = false, dailyStreak = s0.daily.streak;
    if (run.mode === "daily" && s0.daily.lastDate !== today && run.links >= 1) {
      dailyDone = true;
      const y = new Date(); y.setDate(y.getDate() - 1);
      dailyStreak = s0.daily.lastDate === dayKey(y) ? s0.daily.streak + 1 : 1;
      add("Daily Chain", R.dailyBase + Math.min(R.dailyStreakCap, R.dailyStreakStep * (dailyStreak - 1)), `${dailyStreak}-day streak`);
    }
    const total = breakdown.reduce((a, x) => a + x.amount, 0);
    const xpGained = Math.round(run.score / 10 + run.links * 5);
    const lvlBefore = levelFromXp(s0.xp).level;
    const hour = new Date().getHours();

    let fresh = [];
    commit((d) => {
      d.xp += xpGained;
      d.boosterArmed = false;
      const S = d.stats;
      S.runs += 1; S.links += run.links; S.score += run.score;
      S.bestChain = Math.max(S.bestChain, run.bestStreak);
      S.bestScore = Math.max(S.bestScore, run.score);
      S.fast += run.fast; S.goldWords += P.gold; S.mistakes += run.mistakes;
      if (run.longestWord.length > S.longestWord) { S.longestWord = run.longestWord.length; S.longestWordText = run.longestWord; }
      if (!S.modesPlayed.includes(run.mode)) S.modesPlayed.push(run.mode);
      S.modeLinks[run.mode] = (S.modeLinks[run.mode] || 0) + run.links;
      if (run.links >= 10 && run.mistakes === 0) S.perfectRuns += 1;
      S.heartsRestored += run.heartsRestored || 0;
      S.starlitesEarned += total;
      S.playSeconds += Math.round(run.duration || 0);
      if (run.difficulty === "insane") S.insaneChain = Math.max(S.insaneChain, run.bestStreak);
      if (hour >= 0 && hour < 4) S.nightOwl = 1;
      if (hour >= 5 && hour < 7) S.earlyBird = 1;
      const b = d.bests[run.mode] || { score: 0, links: 0, chain: 0 };
      d.bests[run.mode] = {
        score: Math.max(b.score || 0, run.score), links: Math.max(b.links || 0, run.links), chain: Math.max(b.chain || 0, run.bestStreak),
        difficulty: newBest ? run.difficulty : b.difficulty || run.difficulty, at: newBest ? Date.now() : b.at || Date.now(),
      };
      d.earnDay = { date: today, amount: earnDay.amount + total, runs: earnDay.runs + 1 };
      if (dailyDone) {
        d.daily.lastDate = today; d.daily.streak = dailyStreak; d.daily.bestStreak = Math.max(d.daily.bestStreak, dailyStreak);
        d.daily.completed += 1; d.daily.results[today] = { score: run.score, links: run.links };
        const keys = Object.keys(d.daily.results).sort();
        if (keys.length > 40) keys.slice(0, keys.length - 40).forEach((k) => delete d.daily.results[k]);
      }
      fresh = evalTrophies(d);
      return d;
    });
    if (total > 0) T.awardStars(total, `Chainz · ${mode.name}: ${run.links}-link chain`, { game: true });
    payTrophies(fresh, true); // Results screen showcases them
    refreshWallet();
    saveRun({ id: run.id, mode: run.mode, difficulty: run.difficulty, score: run.score, links: run.links, bestStreak: run.bestStreak, chain: run.chain.slice(0, 80), stars: total, at: Date.now(), endedBy: run.endedBy }).catch(() => {});
    return { ...run, breakdown, total, newBest, prevBest, xpGained, lvlBefore, capped, dailyDone, dailyStreak, trophies: fresh.map(({ id, name, desc, tier, icon }) => ({ id, name, desc, tier, icon })) };
  }, [commit, evalTrophies, payTrophies, refreshWallet]);

  const value = {
    save, commit, profile, treeshAccent, accent, points, refreshWallet, bankState, retryBank,
    screen, params, go, toast, toasts, dismissToast,
    updateSettings, buy, equip, consumePowerup, setBoosterArmed, claimDailyGift, setGuestName, resetProgress, finishRun,
    isEmbedded: T.isEmbedded, updateTreeshProfile: (p) => { const ok = T.updateTreeshProfile(p); refreshWallet(); return ok; },
    cosmetic: (id) => COSMETIC_BY_ID[id], bundles: BUNDLES,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
