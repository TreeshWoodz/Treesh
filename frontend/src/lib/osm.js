// Browser-side fallback for court lookup (Overpass supports CORS). Used if the Hoop API is unreachable.
const MIRRORS = ["https://overpass-api.de/api/interpreter", "https://maps.mail.ru/osm/tools/overpass/api/interpreter", "https://overpass.private.coffee/api/interpreter"];

function hav(a, b, c, d) {
  const R = 6371000, r = Math.PI / 180;
  const x = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function normalize(e, lat, lon) {
  const la = e.lat ?? e.center?.lat, lo = e.lon ?? e.center?.lon;
  if (la == null || lo == null) return null;
  const t = e.tags || {};
  const indoor = ["yes", "room"].includes(t.indoor) || t.covered === "yes" || ["sports_centre", "sports_hall"].includes(t.leisure) || (t.building && t.building !== "no");
  const street = [t["addr:housenumber"], t["addr:street"]].filter(Boolean).join(" ");
  return {
    id: `${e.type}/${e.id}`,
    name: t.name || t.description || (indoor ? "Indoor basketball" : "Basketball court"),
    lat: la, lon: lo, distance_m: Math.round(hav(lat, lon, la, lo)),
    kind: indoor ? "Gym" : "Court", indoor: !!indoor, lit: t.lit === "yes", surface: t.surface || null, hoops: t.hoops || null,
    access: t.access || null, opening_hours: t.opening_hours || null, operator: t.operator || null,
    address: [street, t["addr:city"]].filter(Boolean).join(", "), has_name: !!t.name,
  };
}

export async function courtsDirect(lat, lon, radius) {
  const q = `[out:json][timeout:25];nwr["sport"~"basketball"](around:${radius},${lat},${lon});out center tags 300;`;
  const ctrls = MIRRORS.map(() => new AbortController());
  const attempt = (url, i) =>
    fetch(url, { method: "POST", body: new URLSearchParams({ data: q }), signal: ctrls[i].signal }).then(async (r) => {
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      if (!j.elements) throw new Error("bad");
      return j.elements;
    });
  const timer = setTimeout(() => ctrls.forEach((c) => c.abort()), 30000);
  try {
    const els = await Promise.any(MIRRORS.map(attempt));
    ctrls.forEach((c) => c.abort());
    const seen = new Set();
    return els
      .map((e) => normalize(e, lat, lon))
      .filter((c) => {
        if (!c) return false;
        const k = `${c.lat.toFixed(4)},${c.lon.toFixed(4)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .sort((a, b) => a.distance_m - b.distance_m)
      .slice(0, 150);
  } finally {
    clearTimeout(timer);
  }
}

/* ---- Nominatim direct (CORS-enabled) fallbacks ---- */
const NOM = "https://nominatim.openstreetmap.org";
function shortLabel(d) {
  const a = d.address || {};
  return [a.road || a.neighbourhood || a.suburb, a.city || a.town || a.village || a.county, a.state || a.country].filter(Boolean).join(", ") || d.display_name || "";
}
export async function geocodeDirect(q, limit = 5) {
  const r = await fetch(`${NOM}/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("geocode failed");
  const j = await r.json();
  return j.map((d) => ({ lat: +d.lat, lon: +d.lon, name: d.name || shortLabel(d), label: d.display_name, short: shortLabel(d) }));
}
export async function reverseDirect(lat, lon) {
  const r = await fetch(`${NOM}/reverse?format=jsonv2&addressdetails=1&zoom=16&lat=${lat}&lon=${lon}`);
  if (!r.ok) throw new Error("reverse failed");
  const d = await r.json();
  return { label: d.display_name, short: shortLabel(d) };
}
