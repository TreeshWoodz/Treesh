import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { accent as themeAccent } from "./theme";

// Mirrors the user's identity from the parent Treesh Music app.
// `treesh_accent` (hex string) and `treesh_profile` ({ nickname, avatar, ... }).
// On web (same-origin build) these come straight from localStorage; native falls back to defaults.
export type Identity = { accent: string; nickname: string; avatar: string | null };

const DEFAULT: Identity = { accent: themeAccent, nickname: "Treesh Fan", avatar: null };

async function readRaw(key: string): Promise<string | null> {
  try {
    const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    if (Platform.OS === "web" && ls) return ls.getItem(key);
    return await AsyncStorage.getItem(key);
  } catch { return null; }
}

export function useTreeshIdentity(): Identity {
  const [identity, setIdentity] = useState<Identity>(DEFAULT);
  useEffect(() => {
    (async () => {
      let accent = themeAccent, nickname = DEFAULT.nickname, avatar: string | null = null;
      const rawAccent = await readRaw("treesh_accent");
      if (rawAccent) { try { const v = JSON.parse(rawAccent); if (typeof v === "string") accent = v; } catch {} }
      const rawProfile = await readRaw("treesh_profile");
      if (rawProfile) { try { const v = JSON.parse(rawProfile); if (v && typeof v === "object") { nickname = v.nickname || nickname; avatar = v.avatar || null; } } catch {} }
      setIdentity({ accent, nickname, avatar });
    })();
  }, []);
  return identity;
}
