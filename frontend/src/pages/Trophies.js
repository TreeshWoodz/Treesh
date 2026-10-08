import { motion } from "framer-motion";
import { toast } from "sonner";
import { Trophy, Check } from "lucide-react";
import { Layout, PageTitle } from "../components/Layout";
import { StarliteAmount } from "../components/Starlite";
import { ACHIEVEMENTS } from "../game/config";
import { useProfile } from "../game/store";
import { sfx } from "../game/sound";

const tier = (reward) => (reward >= 400 ? "gold" : reward >= 200 ? "silver" : "bronze");

export default function Trophies() {
  const { profile, update, earn } = useProfile();
  const claim = (a) => {
    earn(a.reward, `Trophy: ${a.name}`);
    update((p) => ({ claimed: [...p.claimed, a.id], stats: { ...p.stats, earned: p.stats.earned + a.reward } }));
    sfx.coin();
    toast.success(`${a.name} unlocked! +${a.reward} Starlites`);
  };
  const unlocked = ACHIEVEMENTS.filter((a) => a.val(profile) >= a.goal).length;

  return (
    <Layout>
      <PageTitle eyebrow="Achievements" title="Trophy Room">
        <div className="starlite-pill" data-testid="trophies-unlocked-count"><Trophy size={16} className="text-[var(--ac)]" /> <span className="font-display font-bold">{unlocked}/{ACHIEVEMENTS.length}</span></div>
      </PageTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a, i) => {
          const v = Math.min(a.val(profile), a.goal);
          const ready = v >= a.goal;
          const claimed = profile.claimed.includes(a.id);
          return (
            <motion.div key={a.id} data-testid={`trophy-card-${a.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }} className={`trophy-card ${ready ? "trophy-ready" : ""} ${claimed ? "trophy-claimed" : ""}`}>
              <div className="flex items-start gap-4">
                <div className={`trophy-medal medal-${tier(a.reward)} ${ready ? "" : "grayscale opacity-40"}`}><Trophy size={22} /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-base font-bold text-white">{a.name}</div>
                  <div className="text-xs text-slate-400">{a.desc}</div>
                </div>
              </div>
              <div className="mt-4 h-2 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-r from-[var(--ac)] to-[var(--ac-hi)]" style={{ width: `${(v / a.goal) * 100}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold tabular-nums text-slate-400">{v.toLocaleString()} / {a.goal.toLocaleString()}</span>
                {claimed ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-400"><Check size={14} /> Claimed</span>
                ) : (
                  <button data-testid={`trophy-claim-btn-${a.id}`} disabled={!ready} onClick={() => claim(a)} className="btn-bronze !px-3 !py-1.5 text-xs">
                    Claim <StarliteAmount value={a.reward} size={12} className="text-[var(--ac-ink)]" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Layout>
  );
}
