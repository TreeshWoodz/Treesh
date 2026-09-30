import React, { useCallback, useEffect, useReducer, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play as PlayIcon, Heart, Infinity as Inf, Snowflake, ShieldCheck, Flag, RotateCcw, House, Link2 } from "lucide-react";
import { useGame } from "@/game/GameContext";
import { MODE_BY_ID, DIFFICULTIES, POWERUPS, STARLITE_RULES as R } from "@/game/data";
import { validate, nextPrompt, startWord, answersFor, decoys, onlineAssoc, norm, cap, bank, mulberry32, seedFrom, isOnline } from "@/game/words";
import { dayKey } from "@/game/storage";
import * as A from "@/game/audio";
import { Keyboard } from "@/components/cz/Keyboard";
import { Bursts } from "@/components/cz/Bursts";
import { Icon } from "@/components/cz/Icon";
import { StarGlyph, fmt } from "@/components/cz/ui";

const SOFT = /(Already used|Too close|At least|Type a word|Must start|Same word|Keep it clean)/;
const now = () => performance.now();

export default function Play() {
  const game = useGame();
  const { save, params, go, toast, consumePowerup, finishRun, commit } = game;
  const S = save.settings;
  const mode = MODE_BY_ID[params.mode] || MODE_BY_ID.classic;
  const diffId = mode.fixedDifficulty || params.difficulty || "normal";
  const diff = DIFFICULTIES[diffId];
  const V = mode.validator;
  const [, force] = useReducer((x) => x + 1, 0);
  const burstRef = useRef(null);
  const promptRef = useRef(null);
  const inputRef = useRef(null);
  const G = useRef(null);
  const rnd = useRef(mode.id === "daily" ? mulberry32(seedFrom("chainz-" + dayKey())) : Math.random);
  const sfxRef = useRef({ lastTick: -1 });

  if (!G.current) {
    G.current = {
      id: Date.now(), phase: "count", count: S.countdown === "skip" ? 0 : 3, prompt: "", gold: false, input: "",
      score: 0, streak: 0, bestStreak: 0, links: 0, mistakes: 0, hearts: mode.lives, turnMax: diff.time, turnLeft: diff.time,
      globalLeft: mode.globalTime || 0, pending: { links: 0, combos: 0, speed: 0, gold: 0 }, chain: [], used: new Set(), usedPrompts: new Set(),
      fast: 0, heartsRestored: 0, longest: "", shield: false, frozenUntil: 0, checking: false, hint: null, choices: null, turnStart: 0,
      startedAt: Date.now(), pausedAt: 0, feedback: null, fid: 0, shakeId: 0, booster: !!save.boosterArmed && (save.inventory.booster || 0) > 0,
      over: null, finished: false, lastTs: now(),
    };
  }
  const g = G.current;

  /* ---------- helpers ---------- */
  const say = useCallback((text, kind = "info") => { const s = G.current; s.feedback = { text, kind }; s.fid++; }, []);
  const turnTime = useCallback((links) => {
    let base = diff.time * (V === "letter" || V === "compound" ? 1.25 : 1);
    const f = mode.id === "survival" ? 0.97 : 0.985;
    return Math.max(base * 0.55, base * Math.pow(f, links));
  }, [diff.time, V, mode.id]);

  const newTurn = useCallback((p) => {
    const s = G.current;
    s.prompt = p;
    s.usedPrompts.add(p); s.used.add(p);
    const chance = mode.id === "zen" ? R.goldChance / 2 : R.goldChance;
    s.gold = s.links > 0 && rnd.current() < chance;
    s.turnMax = turnTime(s.links); s.turnLeft = s.turnMax; s.turnStart = now();
    s.hint = null; s.choices = null; s.input = "";
    sfxRef.current.lastTick = -1;
    if (V === "assoc" && isOnline()) onlineAssoc(p).catch(() => {});
  }, [mode.id, turnTime, V]);

  const skipPrompt = useCallback(() => {
    const s = G.current; const B = bank();
    if (V === "letter") {
      const pool = B.prompts.filter((w) => !s.used.has(w) && w.slice(-1) !== s.prompt.slice(-1));
      return pool[Math.floor(rnd.current() * pool.length)];
    }
    return nextPrompt(V, s.prompt, s.usedPrompts, s.used, rnd.current);
  }, [V]);

  const pos = () => {
    const el = promptRef.current;
    if (!el) return [window.innerWidth / 2, window.innerHeight / 3];
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  /* ---------- end of run ---------- */
  const endRun = useCallback((why) => {
    const s = G.current;
    if (s.phase === "over" || s.finished) return;
    s.phase = "over"; s.over = why;
    A.sfxGameOver(); A.haptic([30, 60, 30], S.haptics);
    force();
    setTimeout(() => {
      if (s.finished) return;
      s.finished = true;
      if (s.booster) commit((d) => { d.inventory.booster = Math.max(0, (d.inventory.booster || 0) - 1); return d; });
      const res = finishRun({
        id: s.id, mode: mode.id, difficulty: diffId, score: s.score, links: s.links, bestStreak: s.bestStreak, mistakes: s.mistakes,
        fast: s.fast, pending: s.pending, chain: s.chain, longestWord: s.longest, heartsRestored: s.heartsRestored, booster: s.booster,
        duration: (Date.now() - s.startedAt) / 1000, endedBy: why,
      });
      if (res) go("results", { results: res });
    }, 1300);
  }, [S.haptics, commit, diffId, finishRun, go, mode.id]);

  /* ---------- correctness ---------- */
  const onCorrect = useCallback((w, res) => {
    const s = G.current;
    const answerTime = mode.timer === "turn" ? s.turnMax - s.turnLeft : (now() - s.turnStart) / 1000;
    s.streak++; s.links++; s.bestStreak = Math.max(s.bestStreak, s.streak);
    const combo = Math.min(5, 1 + Math.floor(s.streak / 5));
    const speedPts = mode.timer === "turn" ? Math.round((50 * s.turnLeft) / s.turnMax) : mode.timer === "global" ? Math.max(0, Math.round(50 * (1 - answerTime / 6))) : 0;
    const lenPts = Math.max(0, w.length - 4) * 15;
    const pts = Math.round((100 + speedPts + lenPts) * combo * diff.mult * mode.scoreMult * (s.gold ? 2 : 1));
    s.score += pts;
    s.pending.links++;
    let msg = `+${fmt(pts)}`; let kind = "good";
    if (s.streak % R.comboEvery === 0) { s.pending.combos++; msg = `${s.streak} CHAIN! ×${combo}`; kind = "combo"; A.sfxCombo(); if (mode.timer === "global") s.globalLeft += 3; }
    if (mode.timer !== "none" && answerTime < R.speedThreshold) { s.pending.speed++; s.fast++; if (kind === "good") msg += " · SPEEDY"; }
    if (s.gold) { s.pending.gold++; msg = `GOLDEN! +${R.goldWord} Starlites`; kind = "gold"; A.sfxCoin(); }
    if (mode.id === "survival" && s.streak % 10 === 0 && s.hearts < 3) { s.hearts++; s.heartsRestored++; msg = "Heart restored!"; kind = "good"; }
    if (mode.timer === "global") s.globalLeft = Math.min((mode.globalTime || 60) + 30, s.globalLeft + 1.5);
    if (w.length > s.longest.length) s.longest = w;
    s.chain.push({ p: s.prompt, a: w, full: res.full || null, gold: s.gold });
    s.used.add(w);
    say(msg, kind);
    A.sfxCorrect(s.streak); A.haptic(12, S.haptics);
    const [x, y] = pos();
    const fx = game.cosmetic(save.equipped.effect);
    burstRef.current && burstRef.current.burst(x, y, { effect: save.equipped.effect, colors: s.gold ? ["#ffd36b", "#fff1c1", "#c3ab69"] : fx && fx.colors, count: kind === "combo" || s.gold ? 46 : 26, power: kind === "combo" ? 1.4 : 1 });
    const nxt = nextPrompt(V, w, s.usedPrompts, s.used, rnd.current);
    newTurn(nxt);
  }, [S.haptics, V, diff.mult, game, mode, newTurn, save.equipped.effect, say]);

  const onWrong = useCallback((res) => {
    const s = G.current;
    s.shakeId++;
    A.sfxWrong(); A.haptic(40, S.haptics);
    if (SOFT.test(res.reason || "")) { say(res.reason, "warn"); return; }
    s.mistakes++;
    s.input = "";
    if (s.shield) { s.shield = false; say("Shield absorbed it!", "shield"); return; }
    s.streak = 0;
    if (mode.failOnWrong) { say(res.reason, "bad"); endRun("wrong"); return; }
    if (mode.lives > 0) {
      s.hearts--;
      say(`${res.reason} · −1 heart`, "bad");
      if (s.hearts <= 0) endRun("hearts");
      return;
    }
    if (mode.timer === "global") { s.globalLeft = Math.max(0, s.globalLeft - 2); say(`${res.reason} · −2s`, "bad"); return; }
    if (mode.timer === "turn") { s.turnLeft = Math.max(0.6, s.turnLeft - 1); say(`${res.reason} · −1s`, "bad"); return; }
    say(res.reason, "bad");
  }, [S.haptics, endRun, mode, say]);

  const submit = useCallback(async (override) => {
    const s = G.current;
    if (s.phase !== "play" || s.checking) return;
    const w = norm(override != null ? override : s.input);
    if (!w) { say("Type a word first", "warn"); s.shakeId++; force(); return; }
    s.checking = true; force();
    const res = await validate(V, s.prompt, w, { used: s.used, minLen: V === "letter" ? (diffId === "insane" ? 5 : diffId === "hard" ? 4 : 3) : diff.minLen });
    s.checking = false;
    if (G.current !== s || s.phase !== "play") { force(); return; }
    if (res.ok) onCorrect(w, res); else onWrong(res);
    force();
    if (S.systemKeyboard && inputRef.current) inputRef.current.focus();
  }, [S.systemKeyboard, V, diff.minLen, diffId, onCorrect, onWrong, say]);

  const onTimeout = useCallback(() => {
    const s = G.current;
    if (s.shield) { s.shield = false; s.turnLeft = s.turnMax; say("Shield saved you!", "shield"); A.sfxPower(); return; }
    A.sfxWrong();
    if (mode.lives > 0) {
      s.hearts--; s.streak = 0; s.mistakes++;
      if (s.hearts <= 0) { endRun("time"); return; }
      say("Time! −1 heart", "bad");
      newTurn(skipPrompt());
      return;
    }
    endRun("time");
  }, [endRun, mode.lives, newTurn, say, skipPrompt]);

  /* ---------- lifecycle: first prompt + countdown ---------- */
  useEffect(() => {
    const s = G.current;
    A.unlockAudio();
    s.prompt = startWord(V, rnd.current);
    let t;
    const step = () => {
      if (s.count <= 0) {
        A.sfxGo();
        s.phase = "play"; s.lastTs = now(); newTurn(s.prompt); force();
        setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 30);
        return;
      }
      A.sfxCount();
      force();
      t = setTimeout(() => { s.count--; step(); }, 720);
    };
    if (S.countdown === "skip") { s.count = 0; }
    step();
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- timer loop ---------- */
  useEffect(() => {
    const iv = setInterval(() => {
      const s = G.current;
      const t = now();
      const dt = Math.min(0.25, (t - s.lastTs) / 1000);
      s.lastTs = t;
      if (s.phase !== "play" || s.checking) return;
      if (t < s.frozenUntil) { force(); return; }
      if (mode.timer === "turn") {
        s.turnLeft -= dt;
        const sec = Math.ceil(s.turnLeft);
        if (s.turnLeft <= 3 && sec !== sfxRef.current.lastTick && sec > 0) { sfxRef.current.lastTick = sec; A.sfxTick(true); }
        if (s.turnLeft <= 0) { s.turnLeft = 0; onTimeout(); }
      } else if (mode.timer === "global") {
        s.globalLeft -= dt;
        const sec = Math.ceil(s.globalLeft);
        if (s.globalLeft <= 5 && sec !== sfxRef.current.lastTick && sec > 0) { sfxRef.current.lastTick = sec; A.sfxTick(true); }
        if (s.globalLeft <= 0) { s.globalLeft = 0; endRun("time"); }
      }
      force();
    }, 100);
    return () => clearInterval(iv);
  }, [endRun, mode.timer, onTimeout]);

  /* ---------- pause / resume ---------- */
  const pause = useCallback(() => { const s = G.current; if (s.phase !== "play") return; s.phase = "paused"; s.pausedAt = now(); A.sfxTap(); force(); }, []);
  const resume = useCallback(() => {
    const s = G.current; if (s.phase !== "paused") return;
    const d = now() - s.pausedAt;
    s.frozenUntil = s.frozenUntil ? s.frozenUntil + d : 0; s.turnStart += d; s.lastTs = now(); s.phase = "play"; A.sfxTap(); force();
    if (S.systemKeyboard && inputRef.current) setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
  }, [S.systemKeyboard]);
  useEffect(() => {
    const vis = () => { if (document.visibilityState === "hidden") pause(); };
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("chainz:pause", pause);
    return () => { document.removeEventListener("visibilitychange", vis); window.removeEventListener("chainz:pause", pause); };
  }, [pause]);

  /* ---------- typing ---------- */
  const typeKey = useCallback((k) => { const s = G.current; if (s.phase !== "play" || s.checking) return; if (s.input.length < 20) s.input += k; A.sfxKey(false); force(); }, []);
  const backspace = useCallback(() => { const s = G.current; if (s.phase !== "play") return; s.input = s.input.slice(0, -1); A.sfxKey(true); force(); }, []);
  const clear = useCallback(() => { const s = G.current; if (s.phase !== "play") return; s.input = ""; A.sfxKey(true); force(); }, []);
  useEffect(() => {
    if (S.systemKeyboard) return undefined;
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") { const s = G.current; if (s.phase === "play") pause(); else if (s.phase === "paused") resume(); return; }
      if (e.key === "Enter") { e.preventDefault(); submit(); return; }
      if (e.key === "Backspace") { e.preventDefault(); backspace(); return; }
      if (/^[a-zA-Z]$/.test(e.key)) typeKey(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [S.systemKeyboard, backspace, pause, resume, submit, typeKey]);

  /* ---------- power-ups ---------- */
  const activatePower = useCallback((id) => {
    const s = G.current;
    if (s.phase !== "play" || s.checking) return;
    const P = POWERUPS.find((p) => p.id === id);
    if ((save.inventory[id] || 0) <= 0) { toast({ kind: "info", title: `Out of ${P.name}`, sub: "Grab more in the Gift Shop", icon: "ShoppingBag" }); return; }
    if ((id === "hint" || id === "lifeline") && !diff.hintsOk) { toast({ kind: "error", title: "No hints on Insane", sub: "Pure skill only at this level", icon: "Brain" }); return; }
    if (id === "freeze" && mode.timer === "none") { toast({ kind: "info", title: "No clock in Zen", sub: "Time Freeze isn’t needed here", icon: "Leaf" }); return; }
    if (id === "shield" && s.shield) { toast({ kind: "info", title: "Shield already active", icon: "Shield" }); return; }
    let list = [];
    if (id === "hint" || id === "lifeline") {
      list = answersFor(V, s.prompt, s.used);
      if (!list.length) { toast({ kind: "info", title: "No hint for this one", sub: "Try a Skip instead", icon: "Lightbulb" }); return; }
    }
    if (!consumePowerup(id)) return;
    A.sfxPower(); A.haptic(15, S.haptics);
    if (id === "freeze") { s.frozenUntil = now() + 8000; say("Time frozen for 8s", "freeze"); }
    if (id === "shield") { s.shield = true; say("Shield up!", "shield"); }
    if (id === "skip") { say("Skipped. Streak kept", "info"); newTurn(skipPrompt()); }
    if (id === "hint") {
      const w = list[Math.floor(Math.random() * list.length)];
      const show = diffId === "hard" ? 1 : Math.min(2, Math.max(1, w.length - 2));
      s.hint = w.slice(0, show).toUpperCase() + " " + "_ ".repeat(w.length - show).trim();
    }
    if (id === "lifeline") {
      const right = list[Math.floor(Math.random() * list.length)];
      const wrong = decoys(V, s.prompt, 2, Math.random);
      s.choices = [right, ...wrong].sort(() => Math.random() - 0.5);
    }
    force();
  }, [S.haptics, V, consumePowerup, diff.hintsOk, diffId, mode.timer, newTurn, save.inventory, say, skipPrompt, toast]);

  /* QA helper: open the game with ?debug=1 to expose valid answers for automated tests */
  useEffect(() => {
    if (!/[?&]debug=1/.test(window.location.search)) return undefined;
    window.__chainz = { answers: () => answersFor(V, G.current.prompt, G.current.used).slice(0, 10), state: () => ({ prompt: G.current.prompt, phase: G.current.phase, links: G.current.links, hearts: G.current.hearts, score: G.current.score }) };
    return () => { delete window.__chainz; };
  }, [V]);

  /* ---------- render ---------- */
  const frozen = now() < g.frozenUntil;
  const showTurn = mode.timer === "turn";
  const tLeft = showTurn ? g.turnLeft : g.globalLeft;
  const tMax = showTurn ? g.turnMax : mode.globalTime || 60;
  const pct = mode.timer === "none" ? 1 : Math.max(0, Math.min(1, tLeft / tMax));
  const danger = mode.timer !== "none" && (showTurn ? pct < 0.25 : tLeft < 10);
  const tColor = frozen ? "#7dd3fc" : danger ? "var(--bad)" : pct < 0.5 && showTurn ? "var(--warn)" : "var(--accent)";
  const combo = Math.min(5, 1 + Math.floor(g.streak / 5));
  const pendingStars = Math.round((g.pending.links * R.perLink + g.pending.combos * R.comboBonus + g.pending.speed * R.speedBonus + g.pending.gold * R.goldWord) * diff.star * mode.starMult * (g.booster ? 2 : 1));
  const P = g.prompt || "";
  const fontSize = Math.min(78, Math.max(30, 470 / Math.max(5, P.length)));
  const promptLabel = V === "letter" ? `Starts with “${P.slice(-1).toUpperCase()}”` : V === "compound" ? "Glue a word to" : "Link a word to";
  const RING = 2 * Math.PI * 26;
  const fbColor = { good: "var(--good)", combo: "var(--accent)", gold: "#ffd36b", bad: "var(--bad)", warn: "var(--warn)", shield: "#93c5fd", freeze: "#7dd3fc", info: "rgba(255,255,255,.8)" };

  return (
    <div className="relative z-10 mx-auto flex h-[100dvh] w-full max-w-[520px] flex-col px-3 pb-[max(8px,env(safe-area-inset-bottom))] pt-[max(10px,env(safe-area-inset-top))]" data-testid="play-screen">
      <Bursts ref={burstRef} enabled={S.particles && !S.reducedMotion} />

      {/* HUD */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={pause} data-testid="game-pause-button" aria-label="Pause" className="cz-press cz-focus cz-chip grid h-11 w-11 shrink-0 place-items-center"><Pause size={18} /></button>
        <div className="cz-chip flex min-w-0 flex-1 flex-col px-3 py-1" data-testid="game-hud-score">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/45">Score</span>
          <motion.span key={g.score} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-num origin-left text-lg leading-tight">{fmt(g.score)}</motion.span>
        </div>
        <div className="relative grid h-[64px] w-[64px] shrink-0 place-items-center" data-testid="game-hud-timer">
          {S.timerStyle === "ring" || mode.timer === "none" ? (
            <svg width="64" height="64" viewBox="0 0 64 64" className={`absolute inset-0 -rotate-90 ${danger ? "cz-danger-pulse" : ""}`}>
              <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,.1)" strokeWidth="6" fill="rgba(8,9,14,.8)" />
              <circle cx="32" cy="32" r="26" stroke={tColor} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={RING} strokeDashoffset={RING * (1 - pct)} style={{ transition: "stroke-dashoffset .12s linear, stroke .3s" }} />
            </svg>
          ) : <div className="cz-chip absolute inset-1" />}
          <span className="font-num relative text-lg" style={{ color: frozen ? "#7dd3fc" : danger ? "var(--bad)" : "#fff" }}>
            {mode.timer === "none" ? <Inf size={22} /> : frozen ? <Snowflake size={20} /> : Math.ceil(tLeft)}
          </span>
        </div>
        <div className="cz-chip flex flex-col items-center px-3 py-1" data-testid="game-hud-combo" style={g.streak >= 5 ? { boxShadow: "0 0 0 1px rgb(var(--accent-rgb) / .6), 0 0 18px rgb(var(--accent-rgb) / .35)" } : undefined}>
          <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-white/45">Chain</span>
          <span className="font-num text-lg leading-tight">{g.streak}<span className="cz-text-accent text-xs">×{combo}</span></span>
        </div>
        <div className="cz-chip flex items-center gap-1 px-2.5 py-2" data-testid="game-hud-pending-starlites" style={{ borderColor: "rgba(255,211,107,.3)" }}>
          <StarGlyph size={15} /><span className="font-num cz-gold-text text-base leading-none">{pendingStars}</span>
        </div>
      </div>
      {S.timerStyle === "bar" && mode.timer !== "none" ? (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: tColor, transition: "width .12s linear" }} /></div>
      ) : null}

      {/* status row */}
      <div className="mt-2 flex items-center justify-between px-1 text-[11px] font-bold text-white/55">
        <span className="flex items-center gap-1.5 uppercase tracking-[0.16em]"><Icon name={mode.icon} size={13} className="cz-text-accent" />{mode.name}{mode.difficulty || mode.id === "daily" ? <span style={{ color: diff.color }}>· {diff.name}</span> : null}</span>
        <span className="flex items-center gap-2">
          {g.booster ? <span className="rounded-full bg-[#ffd36b]/15 px-2 py-0.5 text-[10px] text-[#ffd36b]">2× STARLITES</span> : null}
          {g.shield ? <span className="flex items-center gap-1 rounded-full bg-sky-400/15 px-2 py-0.5 text-[10px] text-sky-300" data-testid="game-shield-active"><ShieldCheck size={12} />SHIELD</span> : null}
          {mode.lives > 0 ? (
            <span className="flex gap-0.5" data-testid="game-hearts">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.span key={i} animate={{ scale: i < g.hearts ? 1 : 0.8, opacity: i < g.hearts ? 1 : 0.25 }}><Heart size={16} className={i < g.hearts ? "fill-[var(--bad)] text-[var(--bad)]" : "text-white/40"} /></motion.span>
              ))}
            </span>
          ) : null}
        </span>
      </div>

      {/* chain trail */}
      {S.showTrail ? (
        <div className="cz-scroll mt-2 flex h-9 items-center gap-1.5 overflow-x-auto px-1" data-testid="game-chain-trail" ref={(el) => { if (el) el.scrollLeft = el.scrollWidth; }}>
          {g.chain.length === 0 ? <span className="text-xs text-white/35">Your chain will grow here</span> : null}
          {g.chain.slice(-14).map((c, i) => (
            <React.Fragment key={i + c.a}>
              {i > 0 ? <Link2 size={12} className="shrink-0 text-white/30" /> : null}
              <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${c.gold ? "border-[#ffd36b]/50 bg-[#ffd36b]/10 text-[#ffd36b]" : "border-white/10 bg-white/[.06] text-white/80"}`}>{cap(c.a)}</span>
            </React.Fragment>
          ))}
        </div>
      ) : null}

      {/* prompt */}
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center text-center">
        <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.28em] text-white/50">{g.gold ? <span className="text-[#ffd36b]">Golden word · 2× points</span> : promptLabel}</p>
        <AnimatePresence mode="popLayout">
          <motion.div key={P + g.links} ref={promptRef} data-testid="game-current-word"
            initial={S.reducedMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.9, filter: "blur(6px)" }}
            animate={{ opacity: g.phase === "paused" ? 0.08 : 1, y: 0, scale: 1, filter: g.phase === "paused" ? "blur(12px)" : "blur(0px)" }}
            exit={S.reducedMotion ? { opacity: 0 } : { opacity: 0, y: -30, scale: 1.08 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className={`font-display max-w-full break-words px-2 leading-[1.02] ${g.gold ? "cz-gold-text cz-gold-prompt" : ""}`} style={{ fontSize }}>
            {V === "letter" && P ? (<>{cap(P).slice(0, -1)}<span className="cz-text-accent underline decoration-4 underline-offset-8">{P.slice(-1).toUpperCase()}</span></>) : cap(P)}
          </motion.div>
        </AnimatePresence>
        {g.gold ? <div className="mt-2 flex items-center gap-1 text-xs font-bold text-[#ffd36b]"><StarGlyph size={14} /> +{R.goldWord} Starlites if you link it</div> : null}

        <div className="mt-3 flex h-8 items-center justify-center" aria-live="polite">
          <AnimatePresence mode="wait">
            {g.feedback ? (
              <motion.p key={g.fid} data-testid="game-feedback" initial={{ opacity: 0, y: 8, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}
                className="text-sm font-extrabold tracking-wide" style={{ color: fbColor[g.feedback.kind] || "#fff" }}>{g.feedback.text}</motion.p>
            ) : null}
          </AnimatePresence>
        </div>
        {g.hint ? <p className="font-num mt-1 text-lg tracking-[0.3em] text-[#ffd36b]" data-testid="game-hint">{g.hint}</p> : null}
        {g.choices ? (
          <div className="mt-2 flex flex-wrap justify-center gap-2" data-testid="game-lifeline-choices">
            {g.choices.map((c) => (
              <button key={c} type="button" onClick={() => { G.current.choices = null; submit(c); }} data-testid={`lifeline-choice-${c}`} className="cz-press cz-focus cz-btn-ghost rounded-full px-4 py-2 text-sm font-extrabold">{cap(c)}</button>
            ))}
          </div>
        ) : null}
      </div>

      {/* input */}
      <motion.div key={g.shakeId} className={`${g.shakeId && S.shake && !S.reducedMotion ? "cz-shake" : ""}`}>
        {S.systemKeyboard ? (
          <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex items-center gap-2">
            <input ref={inputRef} autoFocus value={g.input} data-testid="game-input" disabled={g.phase !== "play"}
              onChange={(e) => { G.current.input = e.target.value.toLowerCase().replace(/[^a-z]/g, "").slice(0, 20); force(); }}
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} enterKeyHint="go" inputMode="text"
              placeholder="Type a linked word" className="h-14 min-w-0 flex-1 rounded-2xl border border-white/12 bg-[#0e1118] px-4 text-xl font-bold uppercase tracking-wider text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-white/35 focus:border-[var(--accent)] focus:outline-none" />
            <button type="submit" data-testid="game-submit-button" className="cz-press cz-btn-primary h-14 rounded-2xl px-5 font-extrabold tracking-[0.15em]" disabled={g.checking}>
              {g.checking ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "LINK"}
            </button>
          </form>
        ) : (
          <div data-testid="game-input" className="flex h-14 items-center justify-center rounded-2xl border bg-[#0e1118] px-4 text-2xl font-extrabold uppercase tracking-[0.12em]" style={{ borderColor: g.input ? "rgb(var(--accent-rgb) / .55)" : "rgba(255,255,255,.12)" }}>
            {g.input ? <span className="truncate">{g.input}</span> : <span className="text-base font-bold normal-case tracking-normal text-white/35">Type a linked word</span>}
            {g.phase === "play" ? <span className="cz-caret" /> : null}
          </div>
        )}
      </motion.div>

      {/* power-ups */}
      <div className="mt-2 flex items-center gap-1.5" data-testid="game-powerups">
        {POWERUPS.filter((p) => !p.preRun).map((p) => {
          const n = save.inventory[p.id] || 0;
          const locked = ((p.id === "hint" || p.id === "lifeline") && !diff.hintsOk) || (p.id === "freeze" && mode.timer === "none");
          return (
            <button key={p.id} type="button" onClick={() => activatePower(p.id)} data-testid={`game-powerup-${p.id}-button`} aria-label={`${p.name} (${n})`} title={p.desc}
              className={`cz-press cz-focus cz-chip relative flex h-11 flex-1 items-center justify-center gap-1 ${locked ? "opacity-30" : n ? "" : "opacity-50"}`}>
              <Icon name={p.icon} size={17} style={{ color: p.color }} />
              <span className="font-num text-xs">{n}</span>
            </button>
          );
        })}
        {mode.id === "zen" ? (
          <button type="button" onClick={() => endRun("ended")} data-testid="game-end-button" className="cz-press cz-btn-ghost flex h-11 items-center gap-1 rounded-full px-3 text-xs font-extrabold"><Flag size={14} />End</button>
        ) : null}
      </div>

      {!S.systemKeyboard ? (
        <div className="mt-2">
          <Keyboard skin={save.equipped.keyboard} onKey={typeKey} onBackspace={backspace} onClear={clear} onEnter={() => submit()} disabled={g.phase !== "play"} busy={g.checking} highlight={V === "letter" && !g.input ? P.slice(-1) : null} />
        </div>
      ) : null}

      {/* overlays */}
      <AnimatePresence>
        {g.phase === "count" ? (
          <motion.div key="count" className="fixed inset-0 z-50 grid place-items-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="game-countdown-overlay">
            <div className="absolute h-72 w-72 rounded-full" style={{ background: "radial-gradient(circle, rgb(var(--accent-rgb) / .45), transparent 65%)" }} />
            <AnimatePresence mode="wait">
              <motion.div key={g.count} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.6, opacity: 0 }} transition={{ duration: 0.3 }} className="relative text-center">
                <div className={`${S.countdown === "text" ? "font-display text-6xl" : "font-num text-[9rem]"} leading-none`}>
                  {S.countdown === "text" ? ["GO", "SET", "READY", "READY"][g.count] : g.count || "GO"}
                </div>
                <p className="mt-3 text-sm font-bold uppercase tracking-[0.3em] text-white/60">{mode.name}{mode.difficulty || mode.id === "daily" ? ` · ${diff.name}` : ""}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        ) : null}
        {g.phase === "paused" ? (
          <motion.div key="pause" className="fixed inset-0 z-50 grid place-items-center bg-[#05060a]/90 px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-testid="game-pause-overlay">
            <motion.div initial={{ scale: 0.92, y: 10 }} animate={{ scale: 1, y: 0 }} className="cz-solid w-full max-w-sm p-6 text-center">
              <h2 className="font-display text-3xl">Paused</h2>
              <p className="mt-1 text-sm text-white/55">{g.links} links · {fmt(g.score)} pts · {pendingStars} Starlites pending</p>
              <div className="mt-6 grid gap-2.5">
                <button type="button" onClick={resume} data-testid="pause-resume-button" className="cz-press cz-btn-primary flex h-13 items-center justify-center gap-2 rounded-2xl py-3.5 font-extrabold"><PlayIcon size={18} />Resume</button>
                <button type="button" onClick={() => { G.current.phase = "play"; endRun("ended"); }} data-testid="pause-end-button" className="cz-press cz-btn-ghost flex items-center justify-center gap-2 rounded-2xl py-3.5 font-extrabold"><Flag size={18} />End run &amp; collect</button>
                <button type="button" onClick={() => go("play", { ...params, k: Date.now() })} data-testid="pause-restart-button" className="cz-press cz-btn-ghost flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-white/80"><RotateCcw size={16} />Restart (forfeit)</button>
                <button type="button" onClick={() => go("home")} data-testid="pause-quit-button" className="cz-press flex items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold text-white/50 hover:text-white"><House size={15} />Quit without saving</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
        {g.phase === "over" ? (
          <motion.div key="over" className="fixed inset-0 z-50 grid place-items-center bg-black/70" initial={{ opacity: 0 }} animate={{ opacity: 1 }} data-testid="game-over-overlay">
            <motion.div initial={{ scale: 0.6, rotate: -6, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 16 }} className="text-center">
              <p className="font-display text-6xl leading-none" style={{ textShadow: "0 0 40px rgb(var(--accent-rgb) / .8)" }}>
                {g.over === "time" ? "TIME!" : g.over === "ended" ? "NICE RUN" : g.over === "wrong" ? "SNAPPED!" : "GAME OVER"}
              </p>
              <p className="mt-3 text-sm font-bold uppercase tracking-[0.3em] text-white/60">{g.links} links · {fmt(g.score)} pts</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {bank() ? null : <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 text-sm">Loading words…</div>}
    </div>
  );
}
