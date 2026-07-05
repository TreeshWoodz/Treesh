import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { profileApi } from "@/lib/api";

const ProfileContext = createContext(null);
export const useProfile = () => useContext(ProfileContext);

function getOrCreateProfileId() {
  let id = localStorage.getItem("treesh_profile_id");
  if (!id) {
    id = (crypto.randomUUID && crypto.randomUUID()) || `p_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem("treesh_profile_id", id);
  }
  return id;
}

const DEFAULTS = { nickname: "", birthday: "", zodiac: "", avatar: "", accent: "#9328ff", backdrop: "aurora" };

export function ProfileProvider({ children }) {
  const [profileId] = useState(getOrCreateProfileId);
  const [profile, setProfile] = useState(() => {
    try {
      const cached = localStorage.getItem("treesh_profile");
      return cached ? { ...DEFAULTS, ...JSON.parse(cached) } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  });
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Apply accent color to :root
  const applyAccent = useCallback((hex) => {
    if (!hex) return;
    const root = document.documentElement;
    root.style.setProperty("--treesh-purple", hex);
    root.style.setProperty("--treesh-purple-soft", hexToRgba(hex, 0.22));
    root.style.setProperty("--treesh-glow-purple", `0 0 0 1px ${hexToRgba(hex, 0.28)}, 0 0 28px ${hexToRgba(hex, 0.24)}`);
    const hsl = hexToHsl(hex);
    if (hsl) {
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--ring", hsl);
    }
  }, []);

  useEffect(() => { applyAccent(profile.accent); }, [profile.accent, applyAccent]);

  useEffect(() => {
    let active = true;
    profileApi.get(profileId).then((data) => {
      if (!active) return;
      if (data.isNew) {
        const cached = localStorage.getItem("treesh_profile");
        if (!cached) setNeedsOnboarding(true);
      } else {
        const merged = { ...DEFAULTS, ...data };
        setProfile(merged);
        localStorage.setItem("treesh_profile", JSON.stringify(merged));
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
    return () => { active = false; };
  }, [profileId]);

  const saveProfile = useCallback(async (updates) => {
    const merged = { ...profile, ...updates };
    setProfile(merged);
    localStorage.setItem("treesh_profile", JSON.stringify(merged));
    setNeedsOnboarding(false);
    try { await profileApi.save({ profileId, ...merged }); } catch (e) { /* offline ok */ }
    return merged;
  }, [profile, profileId]);

  return (
    <ProfileContext.Provider value={{ profileId, profile, saveProfile, needsOnboarding, setNeedsOnboarding, loaded }}>
      {children}
    </ProfileContext.Provider>
  );
}

function hexToRgba(hex, a) {
  const c = hex.replace("#", "");
  const n = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hexToHsl(hex) {
  const c = hex.replace("#", "");
  const n = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  let r = parseInt(n.slice(0, 2), 16) / 255;
  let g = parseInt(n.slice(2, 4), 16) / 255;
  let b = parseInt(n.slice(4, 6), 16) / 255;
  if ([r, g, b].some(isNaN)) return null;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
