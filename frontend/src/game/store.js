import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from "react";
import { sfx } from "./sound";
import { api } from "./api";
import { getStarlites, changeStarlites, readTreeshProfile, TREESH_KEYS } from "./wallet";

const KEY = "bronze_save_v1";
const LEGACY_KEY = "bronze-blitz-profile-v1";
const WELCOME_GIFT = 200;
let giftDone = false;

const uuid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const defaultProfile = () => ({
  playerId: uuid(),
  name: `Blitzer${Math.floor(1000 + Math.random() * 9000)}`,
  onboarded: false,
  saveCode: null,
  giftGiven: false,
  inventory: { hammer: 1, shuffle: 1, extra_moves: 1, color_blast: 0 },
  ownedThemes: ["bronze"],
  theme: "bronze",
  levelStars: {},
  best: {},
  claimed: [],
  sound: true,
  lastBonus: null,
  stats: { games: 0, tiles: 0, maxCombo: 0, discos: 0, bombs: 0, striped: 0, earned: 0, powerups: 0, dailyDays: [] },
});

export const mergeProfile = (data) => {
  const d = defaultProfile();
  return { ...d, ...data, inventory: { ...d.inventory, ...data.inventory }, stats: { ...d.stats, ...data.stats } };
};

const withTreesh = (p) => {
  const t = readTreeshProfile();
  return t ? { ...p, name: t.name, onboarded: true } : p;
};

function load() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(LEGACY_KEY);
    return withTreesh(raw ? mergeProfile(JSON.parse(raw)) : defaultProfile());
  } catch (e) {
    return withTreesh(defaultProfile());
  }
}

const Ctx = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(load);
  const [starlites, setStarlites] = useState(getStarlites);
  const [treesh, setTreesh] = useState(readTreeshProfile);
  const lastGames = useRef(profile.stats.games);

  useEffect(() => {
    if (!profile.giftGiven && !giftDone) {
      giftDone = true;
      setStarlites(changeStarlites(WELCOME_GIFT, "Welcome gift"));
      setProfile((p) => ({ ...p, giftGiven: true }));
    }
    const onStorage = (e) => {
      if (e.key && !TREESH_KEYS.includes(e.key)) return;
      setStarlites(getStarlites());
      setTreesh(readTreeshProfile());
      setProfile((p) => withTreesh(p));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(profile));
    sfx.enabled = profile.sound;
    if (profile.saveCode && profile.stats.games !== lastGames.current) {
      lastGames.current = profile.stats.games;
      api.cloudSave(profile).catch(() => {});
    }
  }, [profile]);

  const update = useCallback((fn) => setProfile((p) => ({ ...p, ...fn(p) })), []);
  const replace = useCallback((p) => setProfile(withTreesh(p)), []);
  const earn = useCallback((amount, reason) => amount > 0 && setStarlites(changeStarlites(amount, reason)), []);
  const spend = useCallback((cost, reason) => {
    if (getStarlites() < cost) return false;
    setStarlites(changeStarlites(-cost, reason));
    return true;
  }, []);

  return createElement(Ctx.Provider, { value: { profile, update, replace, starlites, earn, spend, treesh } }, children);
}

export const useProfile = () => useContext(Ctx);
