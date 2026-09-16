import { Chart, Note, NoteType, Song } from "./types";

// Compact, offline chart sharing. A chart is packed into a tiny JSON with short keys,
// then base64-encoded with a "VOCO1-" prefix so it can be copied/pasted or shared via
// the OS share sheet. No server, no upload — everything travels inside the code itself.

const PREFIX = "VOCO1-";
const TYPES: NoteType[] = ["tap", "hold", "wavy", "slide", "chord", "special"];
const r3 = (n: number) => Math.round(n * 1000) / 1000;

// --- cross-platform base64 over a UTF-8 string (no Buffer / btoa dependency) ---
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function bytesToB64(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i], b1 = bytes[i + 1], b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[b2 & 63] : "=";
  }
  return out;
}
function b64ToBytes(str: string): number[] {
  const clean = str.replace(/[^A-Za-z0-9+/]/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const e0 = B64.indexOf(clean[i]), e1 = B64.indexOf(clean[i + 1]);
    const e2 = B64.indexOf(clean[i + 2]), e3 = B64.indexOf(clean[i + 3]);
    const c0 = (e0 << 2) | (e1 >> 4); bytes.push(c0 & 255);
    if (e2 !== -1) { const c1 = ((e1 & 15) << 4) | (e2 >> 2); bytes.push(c1 & 255); }
    if (e3 !== -1) { const c2 = ((e2 & 3) << 6) | e3; bytes.push(c2 & 255); }
  }
  return bytes;
}
function strToUtf8(str: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < str.length; i++) {
    let c = str.charCodeAt(i);
    if (c < 0x80) out.push(c);
    else if (c < 0x800) { out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f)); }
    else { out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f)); }
  }
  return out;
}
function utf8ToStr(bytes: number[]): string {
  let out = "";
  for (let i = 0; i < bytes.length;) {
    const c = bytes[i++];
    if (c < 0x80) out += String.fromCharCode(c);
    else if (c < 0xe0) out += String.fromCharCode(((c & 0x1f) << 6) | (bytes[i++] & 0x3f));
    else out += String.fromCharCode(((c & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f));
  }
  return out;
}

function packNote(n: Note): any[] {
  const t = [r3(n.time), n.lane, TYPES.indexOf(n.type)];
  if (n.duration) t.push(r3(n.duration)); else t.push(0);
  if (n.path && n.path.length) t.push(n.path.map(p => [r3(p.t), r3(p.x)]));
  return t;
}
function unpackNote(a: any[], i: number): Note {
  const note: Note = { id: `share-${i}`, time: a[0], lane: a[1], type: TYPES[a[2]] || "tap" };
  if (a[3]) note.duration = a[3];
  if (a[4] && Array.isArray(a[4])) note.path = a[4].map((p: any[]) => ({ t: p[0], x: p[1] }));
  return note;
}

export function encodeChartCode(chart: Chart, song: Song): string {
  const payload = {
    v: 1,
    s: chart.songId,
    t: song.title,
    a: song.artist,
    d: r3(chart.duration),
    b: chart.bpm,
    n: chart.notes.map(packNote),
  };
  return PREFIX + bytesToB64(strToUtf8(JSON.stringify(payload)));
}

export type DecodedChart = { chart: Chart; title: string; artist: string };

export function decodeChartCode(raw: string): DecodedChart | null {
  try {
    let code = (raw || "").trim();
    // Accept codes wrapped in a scheme/URL (vocotap://c/CODE, ...?c=CODE, or plain).
    const m = code.match(/VOCO1-[A-Za-z0-9+/=]+/);
    if (m) code = m[0];
    if (!code.startsWith(PREFIX)) return null;
    const json = utf8ToStr(b64ToBytes(code.slice(PREFIX.length)));
    const p = JSON.parse(json);
    if (!p || !p.s || !Array.isArray(p.n)) return null;
    const notes = p.n.map((a: any[], i: number) => unpackNote(a, i));
    const chart: Chart = {
      songId: p.s,
      difficulty: "Custom",
      bpm: p.b || 120,
      duration: p.d || 60,
      notes,
      waveform: Array.from({ length: 96 }, (_, i) => 0.2 + Math.abs(Math.sin(i * 0.5)) * 0.7),
    };
    return { chart, title: p.t || "Shared chart", artist: p.a || "Imported" };
  } catch {
    return null;
  }
}
