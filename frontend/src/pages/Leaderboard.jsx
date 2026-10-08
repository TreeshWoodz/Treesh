import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Loader2 } from "lucide-react";
import { useGame, playerName } from "@/lib/store";
import { BASE, MODES } from "@/data/game";
import { getLeaderboard } from "@/lib/api";
import { Avatar } from "@/components/game/Avatar";

const PlayerCard = () => {
  const { profile } = useGame();
  const name = playerName(profile);
  return (
    <div className="glass rounded-3xl p-5 flex items-center gap-4" data-testid="leaderboard-player-card">
      <Avatar profile={profile} className="w-12 h-12 text-xl" />
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{name.length >= 2 ? `Posting as ${name}` : "Add a name to get on the board"}</div>
        <div className="text-xs text-slate-400">Uses your Treesh profile. Your best score in each mode is posted automatically.</div>
      </div>
      <Link data-testid="leaderboard-edit-profile-btn" to={`${BASE}/profile`} className="lift px-5 py-2.5 rounded-full bg-[var(--eb-gold)] text-[var(--eb-on-gold)] font-extrabold uppercase text-sm">Profile</Link>
    </div>
  );
};

export default function Leaderboard() {
  const { state, profile } = useGame();
  const [mode, setMode] = useState("say_less");
  const [rows, setRows] = useState(null);
  useEffect(() => { setRows(null); getLeaderboard(mode).then(setRows).catch(() => setRows([])); }, [mode, profile]);
  return (
    <div data-testid="leaderboard-page">
      <div className="text-xs uppercase tracking-[0.3em] text-[var(--eb-gold)]">Global</div>
      <h1 className="font-display text-6xl sm:text-7xl mt-1">LEADERBOARD</h1>
      <div className="mt-6"><PlayerCard /></div>
      <div className="flex gap-2 overflow-x-auto mt-6 pb-2">
        {MODES.map((m) => (
          <button key={m.id} data-testid={`leaderboard-tab-${m.id}`} onClick={() => setMode(m.id)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${mode === m.id ? "bg-[var(--eb-gold)] text-[var(--eb-on-gold)] border-[var(--eb-gold)]" : "border-[var(--eb-border)] text-slate-400"}`}>{m.title}</button>
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
