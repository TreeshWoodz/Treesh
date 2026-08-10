import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

function writeString(view: DataView, offset: number, value: string) {
  for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
}

function createWarmupWav() {
  const rate = 8000;
  const duration = 12.2;
  const samples = Math.floor(rate * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  writeString(view, 0, "RIFF"); view.setUint32(4, 36 + samples * 2, true);
  writeString(view, 8, "WAVEfmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  writeString(view, 36, "data"); view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    const time = i / rate;
    const beat = Math.floor((time - 1.5) / 0.42);
    const phase = (time - 1.5) % 0.42;
    const pulse = beat >= 0 && beat < 24 && phase >= 0 && phase < 0.1 ? Math.exp(-phase * 34) : 0;
    const bass = Math.sin(time * Math.PI * 2 * 110) * 0.12;
    const lead = Math.sin(time * Math.PI * 2 * (220 + (Math.max(0, beat) % 4) * 55)) * pulse * 0.58;
    const kick = Math.sin(phase * Math.PI * 2 * 70) * pulse * 0.5;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, bass + lead + kick)) * 32767, true);
  }
  return new Uint8Array(buffer);
}

function bytesToDataUri(bytes: Uint8Array) {
  let binary = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return `data:audio/wav;base64,${globalThis.btoa(binary)}`;
}

export async function ensureWarmupAudio() {
  const bytes = createWarmupWav();
  if (Platform.OS === "web") return bytesToDataUri(bytes);
  const directory = new Directory(Paths.document, "vocotap-audio");
  directory.create({ idempotent: true, intermediates: true });
  const file = new File(directory, "neon-warmup.wav");
  if (!file.exists) file.write(bytes);
  return file.uri;
}

export async function ensureHitAudio() {
  const rate = 8000; const samples = 720; const buffer = new ArrayBuffer(44 + samples * 2); const view = new DataView(buffer);
  writeString(view, 0, "RIFF"); view.setUint32(4, 36 + samples * 2, true); writeString(view, 8, "WAVEfmt "); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); writeString(view, 36, "data"); view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) { const t = i / rate; const envelope = Math.exp(-t * 48); const sample = (Math.sin(t * Math.PI * 2 * 980) * 0.5 + Math.sin(t * Math.PI * 2 * 1470) * 0.2) * envelope; view.setInt16(44 + i * 2, sample * 32767, true); }
  const bytes = new Uint8Array(buffer); if (Platform.OS === "web") return bytesToDataUri(bytes);
  const directory = new Directory(Paths.document, "vocotap-audio"); directory.create({ idempotent: true, intermediates: true }); const file = new File(directory, "hit.wav"); if (!file.exists) file.write(bytes); return file.uri;
}
