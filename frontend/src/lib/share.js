import { toast } from "sonner";

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    try {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch (e2) { return false; }
  }
}

export async function shareTrack(song) {
  const url = `${window.location.origin}/?song=${encodeURIComponent(song.id)}`;
  const title = `${song.title} — ${song.artist}`;
  const text = `🎵 Listen to “${song.title}” by ${song.artist} on Treesh`;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  const ok = await copy(`${text}\n${url}`);
  toast(ok ? "Link copied to clipboard" : "Could not copy link", { description: ok ? title : undefined });
}

export async function sharePlaylist(playlist) {
  const url = `${window.location.origin}/playlists/${playlist.id}`;
  const title = `${playlist.name} — Treesh playlist`;
  const text = `🎧 Check out my playlist “${playlist.name}” on Treesh`;
  if (navigator.share) {
    try { await navigator.share({ title, text, url }); return; } catch (e) { if (e && e.name === "AbortError") return; }
  }
  const ok = await copy(`${text}\n${url}`);
  toast(ok ? "Playlist link copied" : "Could not copy link", { description: ok ? playlist.name : undefined });
}
