import { Song } from "./types";

export const TREESH_URL = "https://treesh.app/content/songs";
const ACCENTS = ["#9328FF", "#3B9EFF", "#FF4DA6", "#C77DFF", "#F0A500", "#22D3A5"];
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&apos;/g, "'");
const attr = (tag: string, name: string) => { const m = tag.match(new RegExp(`data-${name}="([^"]*)"`)); return m ? decode(m[1]) : ""; };
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Full Treesh catalog is published as HTML at /content/songs. Each <ul class="song"> carries
// data-track / data-artist / data-mp3 (playable audio) / data-coverart. We parse it with regex (no DOM in RN).
export function parseTreeshSongs(html: string): Song[] {
  const out: Song[] = []; const used = new Set<string>();
  const tags = html.match(/<ul[^>]*class="song"[^>]*>/g) || [];
  tags.forEach((tag, i) => {
    const title = attr(tag, "track"); const audioUrl = attr(tag, "mp3");
    if (!title || !audioUrl) return;
    const artist = attr(tag, "artist");
    let id = slug(`${artist}-${title}`) || `track-${i}`;
    while (used.has(id)) id = `${id}-${i}`;
    used.add(id);
    out.push({ id, title, artist: artist || "Treesh Artist", source: "treesh", uri: audioUrl, coverArt: attr(tag, "coverart") || undefined, accent: ACCENTS[i % ACCENTS.length], genre: attr(tag, "genre") || undefined });
  });
  return out;
}

const TARGET = "https://treesh.app/content/songs";
// Direct works on native (no CORS). Web preview falls back to CORS proxies.
const SOURCES: { url: string; json?: boolean }[] = [
  { url: TARGET },
  { url: `https://api.allorigins.win/get?url=${encodeURIComponent(TARGET)}`, json: true },
  { url: `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(TARGET)}` },
];

export async function fetchTreeshCatalog(): Promise<Song[]> {
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url, { headers: { Accept: "*/*" } });
      if (!res.ok) continue;
      let html = await res.text();
      if (src.json) { try { html = JSON.parse(html).contents || ""; } catch {} }
      const songs = parseTreeshSongs(html);
      if (songs.length) return songs;
    } catch {}
  }
  throw new Error("Catalog unavailable");
}

// Offline fallback (used only until the live catalog loads).
export const TREESH_CATALOG: Song[] = [
  ["bankrupt", "Bankrupt (Freestyle)", "Black Barbie", "#9328FF"],
  ["rippin", "Rippin' and Runnin'", "PerfekTenz", "#3B9EFF"],
  ["pink-sides", "PINK SIDES", "Unique Carter", "#FF4DA6"],
  ["shake-it", "Shake It Some Mo", "Chelly Banqz", "#C77DFF"],
].map(([id, title, artist, accent]) => ({ id, title, artist, accent, source: "treesh" } as Song));
