import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, Loader2 } from "lucide-react";
import { useGame } from "@/lib/store";
import { MODES } from "@/data/game";
import { getLeaderboard, submitScore } from "@/lib/api";

const UsernameForm = () => {
  const { state, set } = useGame();
  const [name, setName] = useState(state.username);
  const save = () => {
    const n = name.trim();
    if (n.length < 2 || n.length > 20) return toast.error("Username must be 2–20 characters");
    set({ username: n });
    Object.entries(state.best).forEach(([mode, score]) => score > 0 && submitScore({ player_id: state.playerId, username: n, mode, score }).catch(() => {}));
    toast.success("You're on the board", { description: "Your best scores have been posted." });
  };
  return (
    <div className="glass rounded-3xl p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
      <div className="flex-1"><div className="font-bold">{state.username ? `Playing as ${state.username}` : "Claim your name"}</div><div className="text-xs text-slate-400">No account needed — your progress lives on this device.</div></div>
      <input data-testid="username-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} placeholder="Your tag"
        className="rounded-full bg-[var(--eb-bg)] border border-[var(--eb-border)] px-4 py-2.5 outline-none focus:border-[var(--eb-gold)]" />
      <button data-testid="save-username-btn" onClick={save} className="lift px-5 py-2.5 rounded-full bg-[var(--eb-gold)] text-[#0B0914] font-extrabold uppercase text-sm">Save</button>
    </div>
  );
};

export default function Leaderboard() {
  const { state } = useGame();
  const [mode, setMode] = useState("say_less");
  const [rows, setRows] = useState(null);
  useEffect(() => { setRows(null); getLeaderboard(mode).then(setRows).catch(() => setRows([])); }, [mode, state.username]);
  return (
    <div data-testid="leaderboard-page">
      <div className="text-xs uppercase tracking-[0.3em] text-[var(--eb-gold)]">Global</div>
      <h1 className="font-display text-6xl sm:text-7xl mt-1">LEADERBOARD</h1>
      <div className="mt-6"><UsernameForm /></div>
      <div className="flex gap-2 overflow-x-auto mt-6 pb-2">
        {MODES.map((m) => (
          <button key={m.id} data-testid={`leaderboard-tab-${m.id}`} onClick={() => setMode(m.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${mode === m.id ? "bg-[var(--eb-gold)] text-[#0B0914] border-[var(--eb-gold)]" : "border-[var(--eb-border)] text-slate-400"}`}>{m.title}</button>
        ))}
      </div>
      <div className="glass rounded-3xl mt-3 overflow-hidden" data-testid="leaderboard-list">
        {!rows && <div className="p-6 flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" />Loading...</div>}
        {rows && !rows.length && <div className="p-6 text-slate-400" data-testid="leaderboard-empty">Nobody on this board yet. Be the first.</div>}
        {rows?.map((r, i) => (
          <div key={r.id} data-testid={`leaderboard-row-${i}`} className={`flex items-center gap-4 px-5 py-3.5 border-b border-[var(--eb-border)] last:border-0 ${r.player_id === state.playerId ? "bg-[var(--eb-gold)]/10" : ""}`}>
            <span className={`font-display text-2xl w-8 ${i < 3 ? "text-[var(--eb-gold)]" : "text-slate-500"}`}>{i + 1}</span>
            {i === 0 && <Crown className="w-4 h-4 text-[var(--eb-gold)]" />}
            <span className="font-bold flex-1">{r.username}{r.player_id === state.playerId && <span className="text-xs text-[var(--eb-gold)] ml-2">(you)</span>}</span>
            <span className="font-mono font-extrabold">{r.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
