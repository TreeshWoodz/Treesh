import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from "react";
import { sfx } from "./sound";
import { api } from "./api";

const KEY = "bronze-blitz-profile-v1";

const uuid = () => (window.crypto?.randomUUID ? window.crypto.randomUUID() : `p-${Date.now()}-${Math.random().toString(36).slice(2)}`);

export const defaultProfile = () => ({
  playerId: uuid(),
  name: `Blitzer${Math.floor(1000 + Math.random() * 9000)}`,
  onboarded: false,
  saveCode: null,
  starlites: 500,
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

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? mergeProfile(JSON.parse(raw)) : defaultProfile();
  } catch (e) {
    return defaultProfile();
  }
}

const Ctx = createContext(null);

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(load);
  const lastGames = useRef(profile.stats.games);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(profile));
    sfx.enabled = profile.sound;
    if (profile.saveCode && profile.stats.games !== lastGames.current) {
      lastGames.current = profile.stats.games;
      api.cloudSave(profile).catch(() => {});
    }
  }, [profile]);

  const update = useCallback((fn) => setProfile((p) => ({ ...p, ...fn(p) })), []);
  const replace = useCallback((p) => setProfile(p), []);

  return createElement(Ctx.Provider, { value: { profile, update, replace } }, children);
}

export const useProfile = () => useContext(Ctx);
