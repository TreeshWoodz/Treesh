const STARS_KEY = "treesh_stars";
const PROFILE_KEY = "treesh_profile";
const ACCENT_KEY = "treesh_accent";

const readJson = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k)) || null;
  } catch (e) {
    return null;
  }
};

export const getStarlites = () => Math.max(0, Math.floor(readJson(STARS_KEY)?.points || 0));

export function changeStarlites(delta, reason) {
  const st = readJson(STARS_KEY) || {};
  st.points = Math.max(0, (st.points || 0) + delta);
  st.log = [{ t: Date.now(), a: delta, r: `Bronze Blitz: ${reason}` }, ...(st.log || [])].slice(0, 50);
  localStorage.setItem(STARS_KEY, JSON.stringify(st));
  try {
    if (window.parent !== window)
      window.parent.postMessage({ type: "treesh:starlites", source: "bronze-blitz", delta, reason, points: st.points }, window.location.origin);
  } catch (e) {
    /* parent not reachable */
  }
  return st.points;
}

export function readTreeshProfile() {
  const p = readJson(PROFILE_KEY);
  const name = (p?.nickname || p?.username || "").trim();
  const av = [p?.avatar, p?.avatarUrl].find((a) => typeof a === "string" && /^(data:image\/|https?:)/.test(a));
  return name || av ? { name: name.slice(0, 20), avatar: av || null } : null;
}

const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
const mix = (rgb, t, f) => rgb.map((v) => v + (t - v) * f);

export function applyTreeshAccent() {
  const h = readJson(ACCENT_KEY);
  const root = document.documentElement.style;
  if (typeof h !== "string" || !/^#[0-9a-f]{6}$/i.test(h)) {
    ["--ac", "--ac-rgb", "--ac-hi", "--ac-hi-rgb", "--ac-lo", "--ac-ink"].forEach((k) => root.removeProperty(k));
    return null;
  }
  const rgb = hexRgb(h);
  const hi = mix(rgb, 255, 0.45);
  const lum = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  root.setProperty("--ac", h);
  root.setProperty("--ac-rgb", rgb.join(", "));
  root.setProperty("--ac-hi", toHex(hi));
  root.setProperty("--ac-hi-rgb", hi.map(Math.round).join(", "));
  root.setProperty("--ac-lo", toHex(mix(rgb, 0, 0.55)));
  root.setProperty("--ac-ink", lum > 0.5 ? toHex(mix(rgb, 0, 0.8)) : "#ffffff");
  return h;
}

export const hasWelcomeGift = () => (readJson(STARS_KEY)?.log || []).some((e) => e.r === "Bronze Blitz: Welcome gift");

export const TREESH_KEYS = [STARS_KEY, PROFILE_KEY, ACCENT_KEY];
