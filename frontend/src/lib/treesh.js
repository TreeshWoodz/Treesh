import { createClient } from "@supabase/supabase-js";

// Bridges to the Treesh main app: same-origin parent (direct), cross-origin parent (postMessage), Treesh cloud (Supabase).
const URL_ = process.env.REACT_APP_SUPABASE_URL;
const KEY_ = process.env.REACT_APP_SUPABASE_KEY;
export const TREESH_ORIGIN = process.env.REACT_APP_TREESH_ORIGIN;
export const sb = URL_ && KEY_ ? createClient(URL_, KEY_, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } }) : null;

const WALLET = "treesh_stars";
const PENDING = "ebonics_cloud_pending";
export const REFRESH = "treesh:refresh";
const refresh = () => window.dispatchEvent(new Event(REFRESH));

export const onTreeshOrigin = () => !!TREESH_ORIGIN && window.location.origin === TREESH_ORIGIN;
export const sameOriginParent = () => {
  try { if (window.parent !== window && typeof window.parent.awardStars === "function") return window.parent; } catch { /* cross-origin */ }
  return null;
};
const crossOriginParent = () => window.parent !== window && !sameOriginParent() && !!TREESH_ORIGIN;
export const bridgeMode = () => (sameOriginParent() ? "parent" : onTreeshOrigin() ? "origin" : crossOriginParent() ? "message" : "standalone");

// ---------- postMessage bridge (Ebonics embedded in Treesh from another origin) ----------
const post = (msg) => { try { window.parent.postMessage(msg, TREESH_ORIGIN); } catch { /* parent gone */ } };
export const requestParentSync = () => crossOriginParent() && post({ type: "treesh:hello", from: "ebonics" });

const applySync = (d) => {
  if (d.stars && typeof d.stars === "object") localStorage.setItem(WALLET, JSON.stringify(d.stars));
  if (d.profile && typeof d.profile === "object") localStorage.setItem("treesh_profile", JSON.stringify(d.profile));
  if (typeof d.accent === "string") localStorage.setItem("treesh_accent", JSON.stringify(d.accent));
  refresh();
};

export const startMessageBridge = () => {
  if (!crossOriginParent()) return () => {};
  const onMsg = (e) => { if (e.origin === TREESH_ORIGIN && e.data && e.data.type === "treesh:sync") applySync(e.data); };
  const onFocus = () => requestParentSync();
  window.addEventListener("message", onMsg);
  window.addEventListener("focus", onFocus);
  requestParentSync();
  return () => { window.removeEventListener("message", onMsg); window.removeEventListener("focus", onFocus); };
};

// ---------- cloud bridge (signed-in Treesh account, Ebonics outside treesh.app) ----------
let session = null;
export const setCloudSession = (s) => { session = s; };
export const cloudActive = () => !!(sb && session && !onTreeshOrigin() && !sameOriginParent());
const readPending = () => { try { return JSON.parse(localStorage.getItem(PENDING) || "[]"); } catch { return []; } };

export async function cloudPush() {
  if (!cloudActive()) return "skip";
  const pending = readPending();
  if (!pending.length) return "none";
  const { data: row, error } = await sb.from("user_data").select("data").eq("user_id", session.user.id).maybeSingle();
  if (error) throw error;
  if (!row || !row.data || !row.data.localStorage) return "no-backup";
  const ls = row.data.localStorage;
  let w; try { w = JSON.parse(ls[WALLET] || "{}") || {}; } catch { w = {}; }
  pending.forEach((e) => { w.points = Math.max(0, (w.points || 0) + e.a); });
  w.log = [...[...pending].reverse(), ...(w.log || [])].slice(0, 50);
  const data = { ...row.data, exportedAt: new Date().toISOString(), localStorage: { ...ls, [WALLET]: JSON.stringify(w) } };
  const up = await sb.from("user_data").update({ data, updated_at: new Date().toISOString() }).eq("user_id", session.user.id);
  if (up.error) throw up.error;
  localStorage.setItem(PENDING, JSON.stringify(readPending().slice(pending.length)));
  localStorage.setItem(WALLET, JSON.stringify(w));
  refresh();
  return "pushed";
}

export async function cloudPull() {
  if (!cloudActive()) return "skip";
  await cloudPush();
  const uid = session.user.id;
  const [ud, pr] = await Promise.all([
    sb.from("user_data").select("data").eq("user_id", uid).maybeSingle(),
    sb.from("profiles").select("id,username,display_name,avatar_url").eq("id", uid).maybeSingle(),
  ]);
  if (ud.error) throw ud.error;
  const ls = (ud.data && ud.data.data && ud.data.data.localStorage) || null;
  if (ls) ["treesh_stars", "treesh_profile", "treesh_accent"].forEach((k) => { if (typeof ls[k] === "string") localStorage.setItem(k, ls[k]); });
  if (!pr.error && pr.data) {
    let p; try { p = JSON.parse(localStorage.getItem("treesh_profile") || "{}") || {}; } catch { p = {}; }
    p.nickname = pr.data.display_name || p.nickname || "Treesh Fan";
    p.username = pr.data.username || p.username || "";
    if (pr.data.avatar_url) p.avatar = pr.data.avatar_url;
    localStorage.setItem("treesh_profile", JSON.stringify(p));
  }
  refresh();
  return ls ? "pulled" : "no-backup";
}

let pushTimer = 0;
export const queueCloud = (entries) => {
  if (!cloudActive()) return;
  localStorage.setItem(PENDING, JSON.stringify([...readPending(), ...entries]));
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => cloudPush().catch(() => {}), 2000);
};

// ---------- wallet writes routed to the right place ----------
export const routeAward = (entries) => {
  const p = sameOriginParent();
  if (p) { entries.forEach((e) => p.awardStars(e.a, e.r, { silent: true })); return true; }
  if (crossOriginParent()) post({ type: "treesh:stars:award", from: "ebonics", entries });
  return false;
};
