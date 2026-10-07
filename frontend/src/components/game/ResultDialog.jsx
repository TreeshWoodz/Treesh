import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Skull, Send, RotateCcw, Home } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { submitScore } from "@/lib/api";
import { loadProfile, updateProfile } from "@/lib/progress";

export const ResultDialog = ({ open, onClose, won, title, subtitle, score, rows = [], mode, date, onPlayAgain }) => {
  const [name, setName] = useState("");
  const [rank, setRank] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setName(loadProfile().name || "");
      setRank(null);
      setErr("");
    }
  }, [open]);

  const submit = async () => {
    if (!name.trim()) return setErr("Enter a name first");
    setBusy(true);
    setErr("");
    try {
      updateProfile((p) => (p.name = name.trim()));
      const res = await submitScore({ name: name.trim(), mode, score, date: mode === "daily" ? date : undefined });
      setRank(res.rank);
    } catch {
      setErr("Couldn't submit. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid="result-dialog" className="bg-[#161C2E] border-white/10 text-white max-w-md rounded-3xl">
        <div className="flex items-center gap-3">
          <div className={`h-14 w-14 rounded-2xl grid place-items-center ${won ? "bg-[#FFCC00] text-[#0B0F19]" : "bg-[#FF3B30]/20 text-[#FF3B30]"}`}>
            {won ? <Trophy className="w-7 h-7" /> : <Skull className="w-7 h-7" />}
          </div>
          <div>
            <DialogTitle data-testid="result-title" className="font-display text-4xl font-black uppercase italic tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-400">{subtitle}</DialogDescription>
          </div>
        </div>
        <div className="rounded-2xl bg-[#0B0F19] border border-white/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Final score</p>
          <p data-testid="result-score" className="font-mono text-5xl font-black text-[#FFCC00]">{score.toLocaleString()}</p>
          <div className="mt-3 space-y-1">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-400">{k}</span>
                <span className="font-mono font-bold">{v}</span>
              </div>
            ))}
          </div>
        </div>
        {score > 0 && (
          <div className="space-y-2">
            {rank ? (
              <p data-testid="result-rank" className="text-center font-display text-2xl font-black uppercase text-[#34C759]">
                You placed #{rank} on the leaderboard!
              </p>
            ) : (
              <div className="flex gap-2">
                <Input
                  data-testid="result-name-input"
                  value={name}
                  maxLength={20}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="bg-[#0B0F19] border-white/15 text-white h-11"
                />
                <button
                  type="button"
                  data-testid="result-submit-score-button"
                  disabled={busy}
                  onClick={submit}
                  className="h-11 px-4 rounded-xl bg-[#007AFF] font-bold flex items-center gap-2 transition-colors duration-150 hover:bg-[#2b8cff] disabled:opacity-60"
                >
                  <Send className="w-4 h-4" /> {busy ? "..." : "Submit"}
                </button>
              </div>
            )}
            {err && <p className="text-sm text-[#FF3B30]">{err}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/"
            data-testid="result-home-button"
            className="h-12 rounded-xl bg-white/5 border border-white/10 font-bold flex items-center justify-center gap-2 transition-colors duration-150 hover:bg-white/15"
          >
            <Home className="w-4 h-4" /> Menu
          </Link>
          <button
            type="button"
            data-testid="result-play-again-button"
            onClick={onPlayAgain}
            className="h-12 rounded-xl bg-[#FFCC00] text-[#0B0F19] font-black uppercase flex items-center justify-center gap-2 transition-transform duration-150 hover:scale-[1.02] active:scale-95"
          >
            <RotateCcw className="w-4 h-4" /> Play again
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
