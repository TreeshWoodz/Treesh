import axios from "axios";
import { courtsDirect, geocodeDirect, reverseDirect } from "@/lib/osm";

// STATIC mode (e.g. treesh.app/hoop on static hosting): no Hoop API, talk to OpenStreetMap directly from the browser.
export const STATIC = process.env.REACT_APP_STATIC === "1" || !process.env.REACT_APP_BACKEND_URL;
export const api = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL || ""}/api`, timeout: 40000 });

export function apiError(e, fallback = "Something went wrong. Try again.") {
  return e?.response?.data?.detail || (e?.code === "ECONNABORTED" ? "The lookup timed out. Try again." : fallback);
}

export async function geocode(q, limit = 5) {
  if (!STATIC) {
    try {
      const { data } = await api.get("/geocode", { params: { q, limit } });
      return data.results || [];
    } catch (e) {
      if (e?.response?.status && e.response.status < 500 && e.response.status !== 429) throw e;
    }
  }
  return geocodeDirect(q, limit);
}

export async function reverse(lat, lon) {
  if (!STATIC) {
    try {
      const { data } = await api.get("/reverse", { params: { lat, lon } });
      return data;
    } catch (e) {}
  }
  return reverseDirect(lat, lon);
}

export async function findCourts(lat, lon, radius) {
  if (STATIC) return courtsDirect(lat, lon, radius);
  // Race: Hoop API (cached) vs direct browser lookup starting after 5s — fastest valid answer wins.
  let apiErr = null;
  let settled = false;
  const viaApi = api.get("/courts", { params: { lat, lon, radius } }).then((x) => { settled = true; return x.data.courts || []; }).catch((e) => { apiErr = e; throw e; });
  const viaBrowser = new Promise((res, rej) => setTimeout(() => (settled ? rej(new Error("skip")) : courtsDirect(lat, lon, radius).then(res, rej)), 5000));
  try {
    return await Promise.any([viaApi, viaBrowser]);
  } catch (e) {
    const err = new Error(apiError(apiErr, "Court lookup servers are busy right now. Try again in a moment."));
    throw err;
  }
}
