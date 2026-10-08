import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Crown, Loader2 } from "lucide-react";
import { Layout, PageTitle } from "../components/Layout";
import { MODES, LEADER_METRIC } from "../game/config";
import { useProfile } from "../game/store";
import { api } from "../game/api";

const medal = ["#FFC800", "#CBD5E1", "#C87D32"];

export default function Leaderboard() {
  const [params, setParams] = useSearchParams();
  const mode = MODES.some((m) => m.id === params.get("mode")) ? params.get("mode") : "timed";
  const { profile } = useProfile();
  const [rows, setRows] = useState(null);

  useEffect(() => {
    setRows(null);
    api.leaderboard(mode).then(setRows).catch(() => setRows([]));
  }, [mode]);

  return (
    <Layout>
      <PageTitle eyebrow="Global Rankings" title="Leaderboard" />
      <div className="mb-6 flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button key={m.id} data-testid={`leaderboard-tab-${m.id}`} onClick={() => setParams({ mode: m.id })}
            className={`chip-tab ${mode === m.id ? "chip-active" : ""}`} style={{ "--accent": m.color }}>
            <m.Icon size={14} /> {m.name}
          </button>
        ))}
      </div>
      <div className="card-surface overflow-hidden" data-testid="leaderboard-list">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
          <span>Player</span><span>{LEADER_METRIC[mode]}</span>
        </div>
        {rows === null && <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[var(--ac-hi)]" /></div>}
        {rows?.length === 0 && <div data-testid="leaderboard-empty" className="p-10 text-center text-slate-400">No scores yet. Be the first legend on this board.</div>}
        {rows?.map((r, i) => {
          const me = r.player_id === profile.playerId;
          return (
            <motion.div key={r.player_id} data-testid={`leaderboard-row-${r.rank}`} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }} className={`flex items-center gap-4 border-b border-white/5 px-5 py-3 ${me ? "bg-[rgba(var(--ac-rgb),0.1)]" : ""}`}>
              <span className="w-8 font-display text-lg font-black tabular-nums" style={{ color: medal[i] || "#64748B" }}>
                {i < 3 ? <Crown size={20} /> : r.rank}
              </span>
              <span className="flex-1 truncate font-semibold text-white">{r.name}{me && <span className="ml-2 text-xs font-bold uppercase text-[var(--ac-hi)]">You</span>}</span>
              <span className="font-display font-bold tabular-nums text-[#FFC800]">{r.score.toLocaleString()}</span>
            </motion.div>
          );
        })}
      </div>
    </Layout>
  );
}
