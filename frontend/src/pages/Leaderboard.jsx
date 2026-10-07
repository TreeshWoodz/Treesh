import { useEffect, useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { GameHeader } from "@/components/game/GameHeader";
import { fetchLeaderboard } from "@/lib/api";
import { todayStr, useProfile } from "@/lib/progress";

const TABS = [
  ["sonoko", "Sonoko", "#FFCC00"],
  ["daily", "Daily", "#34C759"],
  ["sudoku", "Sudoku", "#007AFF"],
  ["uno", "Uno", "#FF3B30"],
];
const MEDAL = ["#F59E0B", "#CBD5E1", "#D08A4E"];

export default function Leaderboard() {
  const profile = useProfile();
  const [mode, setMode] = useState("sonoko");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const accent = TABS.find((t) => t[0] === mode)[2];

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetchLeaderboard(mode, mode === "daily" ? todayStr() : undefined)
      .then(setRows)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [mode]);

  return (
    <div className="min-h-[100dvh] bg-arcade pb-10" data-testid="leaderboard-page">
      <GameHeader title="Leaderboard" accent="#007AFF" />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-4">
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#161C2E] border border-white/10">
          {TABS.map(([id, label, c]) => (
            <button
              key={id}
              type="button"
              data-testid={`leaderboard-tab-${id}`}
              onClick={() => setMode(id)}
              className={`h-11 rounded-xl font-display text-lg font-black uppercase transition-colors duration-150 ${mode === id ? "text-[#0B0F19]" : "text-slate-300 hover:bg-white/5"}`}
              style={mode === id ? { background: c } : {}}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === "daily" && <p className="eyebrow mt-4">Today · {todayStr()}</p>}
        <div className="mt-4 space-y-2" data-testid="leaderboard-list">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
          ) : error ? (
            <p className="text-center text-[#FF3B30] py-16">Couldn't load scores.</p>
          ) : rows.length === 0 ? (
            <div className="glass rounded-3xl p-10 text-center" data-testid="leaderboard-empty">
              <Crown className="w-12 h-12 mx-auto" style={{ color: accent }} />
              <p className="font-display text-3xl font-black uppercase mt-3">The throne is empty</p>
              <p className="text-slate-400 mt-1">Finish a game and submit your score to claim #1.</p>
            </div>
          ) : (
            rows.map((r, i) => {
              const me = profile.name && r.name === profile.name;
              return (
                <div
                  key={r.id}
                  data-testid={`leaderboard-row-${i}`}
                  className={`rounded-2xl px-4 py-3 flex items-center gap-4 rise ${me ? "border-2" : "glass"}`}
                  style={{ animationDelay: `${Math.min(i, 10) * 40}ms`, ...(me ? { borderColor: accent, background: `${accent}14` } : {}) }}
                >
                  <span
                    className="h-10 w-10 shrink-0 rounded-xl grid place-items-center font-mono font-black"
                    style={i < 3 ? { background: MEDAL[i], color: "#0B0F19" } : { background: "rgba(255,255,255,0.05)" }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 font-semibold truncate">{r.name}{me && <span className="text-xs text-slate-400"> (you)</span>}</span>
                  <span className="font-mono text-xl font-extrabold" style={{ color: i < 3 ? accent : "#F8FAFC" }}>{r.score.toLocaleString()}</span>
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
