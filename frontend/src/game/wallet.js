const STARS_KEY = "treesh_stars";
const PROFILE_KEY = "treesh_profile";

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
  return name ? { name: name.slice(0, 20) } : null;
}

export const TREESH_KEYS = [STARS_KEY, PROFILE_KEY];
