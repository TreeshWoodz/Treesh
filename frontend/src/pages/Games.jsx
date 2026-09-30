import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, Search, Trophy, Users } from "lucide-react";
import { PageHeader, Empty } from "@/components/PageHeader";
import { GAMES, TYPE_LABEL } from "@/data/games";
import { KEYS, useStored } from "@/lib/storage";

const FILTERS = [["all", "All games"], ["solo", "Solo"], ["duo", "1-on-1"], ["group", "Group"]];
const minP = (g) => parseInt(g.players, 10);
const maxP = (g) => parseInt(g.players.split("-").pop(), 10);

export default function Games() {
  const nav = useNavigate();
  const [f, setF] = useState("all");
  const [q, setQ] = useState("");
  const [log] = useStored(KEYS.gameLog, []);
  const list = useMemo(() => GAMES.filter((g) => {
    const s = q.trim().toLowerCase();
    if (s && !g.name.toLowerCase().includes(s) && !g.tagline.toLowerCase().includes(s)) return false;
    if (f === "solo") return minP(g) === 1;
    if (f === "duo") return minP(g) <= 2 && maxP(g) >= 2;
    if (f === "group") return maxP(g) >= 3;
    return true;
  }), [f, q]);

  return (
    <div data-testid="games-page">
      <PageHeader eyebrow={`${GAMES.length} court games`} title="Games" sub="Classic shooting games with built-in scorekeepers. Pick a game, add your crew, and keep score right from your phone." testid="games-title" />
      <div className="relative mb-3">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8B90A6]" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games" data-testid="games-search-input" className="h-12 w-full rounded-full border border-[#25273a] bg-[#0f1015] pl-11 pr-4 text-[15px] placeholder:text-[#6f7489] focus:border-[#FF3EA5] focus:outline-none" />
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map(([k, l]) => <button key={k} className="hp-chip shrink-0" data-active={f === k} onClick={() => setF(k)} data-testid={`games-filter-${k}`}>{l}</button>)}
      </div>
      {list.length === 0 ? <Empty icon={Trophy} title="No games match" text="Try another filter." /> : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((g, i) => {
            const plays = log.filter((l) => l.gameId === g.id).length;
            return (
              <motion.button key={g.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: Math.min(i, 12) * 0.02 }} whileHover={{ y: -2 }} onClick={() => nav(`/games/${g.id}`)} data-testid="games-game-row" className="hp-card hp-card-hover flex flex-col p-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-[#FF3EA5]">{TYPE_LABEL[g.type]}</span>
                  {plays > 0 && <span className="text-[11px] font-bold text-[#8B90A6]">Played ×{plays}</span>}
                </div>
                <div className="font-display mt-2 text-[22px] leading-tight text-[#F5F6F8]">{g.name}</div>
                <p className="mt-1.5 text-[13.5px] text-[#9DA2B6]">{g.tagline}</p>
                <div className="mt-auto flex gap-4 pt-4 text-xs font-semibold text-[#B7BBCB]">
                  <span className="inline-flex items-center gap-1.5"><Users size={13} /> {g.players} players</span>
                  <span className="inline-flex items-center gap-1.5"><Clock size={13} /> ~{g.mins} min</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
