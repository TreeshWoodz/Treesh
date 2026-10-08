import { useEffect, useState } from "react";

const read = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k));
  } catch {
    return null;
  }
};

const resolveAvatar = (a) => {
  if (!a || typeof a !== "string") return "";
  if (/^(https?:|data:image)/.test(a)) return a;
  try {
    return new URL(a, `${window.location.origin}/`).href;
  } catch {
    return "";
  }
};

export function treeshAccount() {
  const prof = read("treesh_profile");
  if (!prof) return null;
  let signedIn = false;
  try {
    signedIn = Object.keys(localStorage).some((k) => /^sb-.+-auth-token$/.test(k));
  } catch {
    /* storage blocked */
  }
  return {
    nickname: prof.nickname || "Treesh Fan",
    username: prof.username || "",
    avatar: resolveAvatar(prof.avatarUrl || prof.avatar),
    bio: prof.bio || "",
    signedIn,
    treeshStars: read("treesh_stars")?.points || 0,
  };
}

const WALLET = "treesh_stars";
const WALLET_EVT = "treesh-stars";
const walletDefault = () => ({ points: 0, lastDaily: null, streak: 0, newSongs: {}, minToday: 0, min30Date: null, secAccum: 0, totalMin: 0, games: 0, beats: 0, log: [] });

export const walletPoints = () => read(WALLET)?.points || 0;

// One shared Treesh wallet: use the parent app's awardStars when embedded, else write the same storage key it uses.
export function addStarlites(amount, reason) {
  if (!amount) return;
  const r = `Sonoku · ${reason}`;
  try {
    const parent = window.parent !== window ? window.parent : null;
    if (parent && typeof parent.awardStars === "function") {
      parent.awardStars(amount, r, { silent: true });
      window.dispatchEvent(new Event(WALLET_EVT));
      return;
    }
  } catch {
    /* cross-origin parent */
  }
  const st = { ...walletDefault(), ...(read(WALLET) || {}) };
  st.points = (st.points || 0) + amount;
  st.log = [{ t: Date.now(), a: amount, r }, ...(st.log || [])].slice(0, 50);
  localStorage.setItem(WALLET, JSON.stringify(st));
  window.dispatchEvent(new Event(WALLET_EVT));
}

export function useWallet() {
  const [pts, setPts] = useState(walletPoints);
  useEffect(() => {
    const h = () => setPts(walletPoints());
    const st = (e) => (!e.key || e.key === WALLET) && h();
    window.addEventListener(WALLET_EVT, h);
    window.addEventListener("storage", st);
    window.addEventListener("focus", h);
    return () => {
      window.removeEventListener(WALLET_EVT, h);
      window.removeEventListener("storage", st);
      window.removeEventListener("focus", h);
    };
  }, []);
  return pts;
}

const TREESH_DEFAULT_ACCENT = "#9328ff";

export function applyTreeshAccent() {
  const raw = read("treesh_accent");
  const hex = typeof raw === "string" && /^#[0-9a-f]{6}$/i.test(raw) ? raw : read("treesh_profile") ? TREESH_DEFAULT_ACCENT : null;
  const root = document.documentElement.style;
  if (!hex) {
    ["--brand", "--brand-rgb", "--brand-ink-rgb"].forEach((k) => root.removeProperty(k));
    return;
  }
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  root.setProperty("--brand", hex);
  root.setProperty("--brand-rgb", `${r} ${g} ${b}`);
  root.setProperty("--brand-ink-rgb", lum > 0.6 ? "11 15 25" : "255 255 255");
}

export const treeshDisplayName = (t) => (t ? (t.username ? `@${t.username}` : t.nickname) : "");

export function useTreesh() {
  const [acc, setAcc] = useState(treeshAccount);
  useEffect(() => {
    const h = (e) => {
      if (!e.key || /^(treesh_profile|treesh_stars|sb-)/.test(e.key)) setAcc(treeshAccount());
    };
    const f = () => setAcc(treeshAccount());
    window.addEventListener("storage", h);
    window.addEventListener("focus", f);
    return () => {
      window.removeEventListener("storage", h);
      window.removeEventListener("focus", f);
    };
  }, []);
  return acc;
}
