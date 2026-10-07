import { useState } from "react";
import { toast } from "sonner";
import { Share2, Copy, Download, Flame } from "lucide-react";
import { COLOR_HEX } from "./PlayingCard";
import { shareText, renderShareImage } from "@/lib/shareCard";
import { commitProgress } from "@/lib/progress";

const markShared = () => commitProgress((s) => (s.dailyShares = (s.dailyShares || 0) + 1));

export const DailyShare = ({ result: r }) => {
  const [busy, setBusy] = useState(false);
  const text = shareText(r);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Result copied — paste it anywhere!");
      markShared();
    } catch {
      toast.error("Couldn't copy to clipboard");
    }
  };

  const download = async () => {
    const blob = await renderShareImage(r);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sonoko-daily-${r.date}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
    markShared();
  };

  const share = async () => {
    setBusy(true);
    try {
      const blob = await renderShareImage(r);
      const file = new File([blob], `sonoko-daily-${r.date}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title: "Sonoko Daily" });
        markShared();
      } else if (navigator.share) {
        await navigator.share({ text, title: "Sonoko Daily" });
        markShared();
      } else await copy();
    } catch (e) {
      if (e?.name !== "AbortError") await copy();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="daily-share-card" className="rounded-2xl bg-[#0B0F19] border border-[#34C759]/40 p-4 flex gap-4 items-center">
      <div className="grid grid-cols-6 gap-[3px] w-24 shrink-0" aria-hidden>
        {r.grid.map((c, i) => (
          <span key={i} className="aspect-square rounded-[3px]" style={{ background: COLOR_HEX[c] || (c === "given" ? "#2A3350" : "#161C2E") }} />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="eyebrow !text-[10px]">Daily · {r.date}</p>
        <p className="font-mono text-2xl font-black text-[#FFCC00] leading-tight">{r.score.toLocaleString()}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Flame className="w-3.5 h-3.5 text-[#34C759]" /> {r.streak}-day streak · {r.time}
        </p>
        <div className="flex gap-1.5 mt-2">
          <button type="button" data-testid="daily-share-button" onClick={share} disabled={busy} className="h-9 px-3 rounded-lg bg-[#34C759] text-[#0B0F19] text-sm font-black flex items-center gap-1.5 transition-transform duration-150 active:scale-95 disabled:opacity-60">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button type="button" data-testid="daily-copy-button" onClick={copy} aria-label="Copy result" className="h-9 w-9 rounded-lg bg-white/10 grid place-items-center transition-colors duration-150 hover:bg-white/20">
            <Copy className="w-4 h-4" />
          </button>
          <button type="button" data-testid="daily-download-button" onClick={download} aria-label="Download image" className="h-9 w-9 rounded-lg bg-white/10 grid place-items-center transition-colors duration-150 hover:bg-white/20">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
