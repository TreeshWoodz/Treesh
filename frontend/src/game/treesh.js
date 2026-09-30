/* Treesh bridge: profile, accent colour and Starlites wallet shared with the parent Treesh app.
   Same-origin: read/write the exact same localStorage keys Treesh uses (treesh_stars, treesh_profile,
   treesh_accent) and ping the parent so it refreshes instantly.
   Cross-origin (e.g. game on treesh.life, Treesh on treesh.app): falls back to a postMessage bridge
   (requires the small patch in Treesh index.html). */
import { LS } from "./storage";

export const DEFAULT_ACCENT = "#9328ff";
const DEFAULT_STARS = { points: 0, lastDaily: null, streak: 0, newSongs: {}, minToday: 0, min30Date: null, secAccum: 0, totalMin: 0, games: 0, beats: 0, log: [] };

const inFrame = (() => { try { return window.parent && window.parent !== window; } catch (e) { return true; } })();
const parentSameOrigin = (() => {
  if (!inFrame) return false;
  try { return window.parent.location.origin === window.location.origin; } catch (e) { return false; }
})();

let bridge = { active: false, points: null, profile: undefined, accent: undefined };
const listeners = new Set();
const emit = () => listeners.forEach((fn) => { try { fn(); } catch (e) { /* noop */ } });

export const isEmbedded = inFrame;
export const isBridged = () => bridge.active;

export function readProfile() {
  if (bridge.active && bridge.profile !== undefined) return bridge.profile;
  const p = LS.get("treesh_profile", null);
  return p && typeof p === "object" ? p : null;
}
export function readAccent() {
  if (bridge.active && bridge.accent) return bridge.accent;
  const a = LS.get("treesh_accent", null);
  return typeof a === "string" && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(a) ? a : null;
}
export function readStars() {
  const s = LS.get("treesh_stars", null);
  return Object.assign({}, DEFAULT_STARS, s && typeof s === "object" ? s : {});
}
export function readPoints() {
  if (bridge.active && typeof bridge.points === "number") return bridge.points;
  return readStars().points || 0;
}

function notifyParent(extra) {
  if (!inFrame) return;
  try { window.parent.postMessage(Object.assign({ type: "chainz:sync", keys: ["treesh_stars"] }, extra || {}), "*"); } catch (e) { /* noop */ }
}

function writeStars(mutator) {
  const st = readStars(); // always read fresh so we never clobber Treesh's own awards
  const r = mutator(st);
  if (r === false) return false;
  st.log = Array.isArray(st.log) ? st.log : [];
  if (st.log.length > 50) st.log.length = 50;
  LS.set("treesh_stars", st);
  notifyParent();
  emit();
  return st;
}

/** Award Starlites into the Treesh wallet. Mirrors Treesh's own awardStars() log format. */
export function awardStars(amount, reason, opts) {
  amount = Math.round(amount || 0);
  if (amount <= 0) return readPoints();
  opts = opts || {};
  if (bridge.active) {
    try { window.parent.postMessage({ type: "chainz:award", amount, reason, game: !!opts.game }, "*"); } catch (e) { /* noop */ }
    bridge.points = (bridge.points || 0) + amount;
  }
  const st = writeStars((s) => {
    s.points = (s.points || 0) + amount;
    if (opts.game) s.games = (s.games || 0) + 1;
    s.log = Array.isArray(s.log) ? s.log : [];
    s.log.unshift({ t: Date.now(), a: amount, r: reason || "Chainz reward" });
  });
  return bridge.active ? bridge.points : st.points;
}

/** Spend Starlites. Returns true if the wallet had enough. */
export function spendStars(amount, reason) {
  amount = Math.round(amount || 0);
  if (amount <= 0) return true;
  if (readPoints() < amount) return false;
  if (bridge.active) {
    try { window.parent.postMessage({ type: "chainz:spend", amount, reason }, "*"); } catch (e) { /* noop */ }
    bridge.points = (bridge.points || 0) - amount;
  }
  const res = writeStars((s) => {
    if (!bridge.active && (s.points || 0) < amount) return false;
    s.points = Math.max(0, (s.points || 0) - amount);
    s.log = Array.isArray(s.log) ? s.log : [];
    s.log.unshift({ t: Date.now(), a: -amount, r: reason || "Chainz shop" });
  });
  return bridge.active ? true : !!res;
}

/** Update the shared Treesh profile (only if Treesh already created one). */
export function updateTreeshProfile(patch) {
  const p = LS.get("treesh_profile", null);
  if (!p) return false;
  LS.set("treesh_profile", Object.assign({}, p, patch));
  notifyParent({ keys: ["treesh_profile"] });
  emit();
  return true;
}

/** Subscribe to any Treesh-side change (storage events, parent bridge messages, tab focus). */
export function subscribeTreesh(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let started = false;
export function startTreeshSync() {
  if (started) return;
  started = true;
  window.addEventListener("storage", (e) => {
    if (!e.key || /^treesh_(stars|profile|accent|theme)$/.test(e.key)) emit();
  });
  window.addEventListener("message", (e) => {
    const d = e.data;
    if (!d || typeof d !== "object" || d.type !== "treesh:state") return;
    if (!parentSameOrigin && inFrame && e.source === window.parent) {
      bridge.active = true;
      if (d.stars && typeof d.stars.points === "number") bridge.points = d.stars.points;
      if (d.profile !== undefined) bridge.profile = d.profile;
      if (d.accent) bridge.accent = d.accent;
    }
    emit();
  });
  const hello = () => { if (inFrame) { try { window.parent.postMessage({ type: "chainz:hello" }, "*"); } catch (e) { /* noop */ } } };
  hello();
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { hello(); emit(); } });
  window.addEventListener("focus", () => { hello(); emit(); });
  // cheap safety net: catch writes made in this same document or missed events
  let snap = "";
  const read = () => { try { return ["treesh_stars", "treesh_profile", "treesh_accent"].map((k) => localStorage.getItem(k) || "").join("|"); } catch (e) { return ""; } };
  snap = read();
  setInterval(() => { const n = read(); if (n !== snap) { snap = n; emit(); } }, 1500);
}

/* ---- colour helpers ---- */
export function hexToRgb(hex) {
  const c = String(hex || DEFAULT_ACCENT).replace("#", "");
  const n = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  return { r: parseInt(n.slice(0, 2), 16) || 0, g: parseInt(n.slice(2, 4), 16) || 0, b: parseInt(n.slice(4, 6), 16) || 0 };
}
export function accentInk(hex) {
  const { r, g, b } = hexToRgb(hex);
  const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return l > 0.62 ? "#0a0a0f" : "#ffffff";
}
export function applyAccentVars(hex) {
  const { r, g, b } = hexToRgb(hex);
  const root = document.documentElement.style;
  root.setProperty("--accent", hex);
  root.setProperty("--accent-rgb", `${r} ${g} ${b}`);
  root.setProperty("--accent-ink", accentInk(hex));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", "#07080b");
}
