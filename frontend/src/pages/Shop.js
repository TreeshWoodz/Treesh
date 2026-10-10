import { motion } from "framer-motion";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Layout, PageTitle } from "../components/Layout";
import { StarliteAmount, StarliteBadge } from "../components/Starlite";
import { TileFace } from "../components/TileFace";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { POWERUPS, THEMES } from "../game/config";
import { useProfile } from "../game/store";
import { sfx } from "../game/sound";

const Preview = ({ theme }) => (
  <div className="board-frame !p-2" style={{ "--frame": theme.board.frame, background: theme.board.bg }}>
    <div className="grid grid-cols-4 gap-1">
      {[0, 3, 5, 1, 2, 99, 4, 6].map((t, i) => (
        <div key={i} className="relative aspect-square rounded-md p-[2px]" style={{ background: i % 2 ? theme.board.cellA : theme.board.cellB }}>
          <TileFace tile={{ type: t, special: null }} size={40} />
        </div>
      ))}
    </div>
  </div>
);

export default function Shop() {
  const { profile, update, starlites, spend: pay } = useProfile();
  const spend = (cost, fn, msg) => {
    if (!pay(cost, msg)) return toast.error("Not enough Starlites. Play a few rounds!");
    update(fn);
    sfx.coin();
    toast.success(msg);
  };

  return (
    <Layout art="mural">
      <PageTitle eyebrow="Spend your Starlites" title="The Shop"><StarliteBadge value={starlites} testId="shop-balance" /></PageTitle>
      <Tabs defaultValue="powerups">
        <TabsList className="shop-tabs">
          <TabsTrigger value="powerups" data-testid="shop-tab-powerups" className="shop-tab">Power-ups</TabsTrigger>
          <TabsTrigger value="themes" data-testid="shop-tab-themes" className="shop-tab">Board Themes</TabsTrigger>
        </TabsList>
        <TabsContent value="powerups" className="mt-6 grid gap-4 sm:grid-cols-2">
          {POWERUPS.map(({ id, name, desc, cost, Icon }, i) => (
            <motion.div key={id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="shop-card">
              <div className="mode-icon" style={{ "--accent": "var(--ac)" }}><Icon size={24} /></div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg font-bold text-white">{name}</div>
                <div className="text-sm text-slate-400">{desc}</div>
                <div data-testid={`shop-owned-${id}`} className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--ac-hi)]">Owned: {profile.inventory[id] || 0}</div>
              </div>
              <button data-testid={`shop-buy-${id}`} onClick={() => spend(cost, (p) => ({ inventory: { ...p.inventory, [id]: (p.inventory[id] || 0) + 1 } }), `${name} added`)}
                className="btn-bronze !px-4 !py-2 text-sm"><StarliteAmount value={cost} className="text-[var(--ac-ink)]" /></button>
            </motion.div>
          ))}
        </TabsContent>
        <TabsContent value="themes" className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t, i) => {
            const owned = profile.ownedThemes.includes(t.id);
            const active = profile.theme === t.id;
            return (
              <motion.div key={t.id} data-testid={`theme-card-${t.id}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className={`shop-card !block ${active ? "ring-2 ring-[var(--ac-hi)]" : ""}`}>
                <Preview theme={t} />
                <div className="mt-4 font-display text-lg font-bold text-white">{t.name}</div>
                <div className="text-sm text-slate-400">{t.desc}</div>
                <div className="mt-4">
                  {active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-400"><Check size={14} /> Equipped</span>
                  ) : owned ? (
                    <button data-testid={`theme-equip-${t.id}`} onClick={() => update(() => ({ theme: t.id }))} className="btn-ghost !py-2 text-sm">Equip</button>
                  ) : (
                    <button data-testid={`theme-buy-${t.id}`} onClick={() => spend(t.cost, (p) => ({ ownedThemes: [...p.ownedThemes, t.id], theme: t.id }), `${t.name} unlocked`)}
                      className="btn-bronze !px-4 !py-2 text-sm">Unlock <StarliteAmount value={t.cost} className="text-[var(--ac-ink)]" /></button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
