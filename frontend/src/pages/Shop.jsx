import { toast } from "sonner";
import { Check } from "lucide-react";
import { useGame } from "@/lib/store";
import { THEMES, POWERUPS } from "@/data/game";
import { Starlite } from "@/components/game/Starlite";
import { ModeIcon } from "@/components/game/ModeIcon";

const Price = ({ v }) => <span className="flex items-center gap-1 font-mono"><Starlite className="w-4 h-4" />{v}</span>;

const ThemeCard = ({ t }) => {
  const { state, buy, set } = useGame();
  const owned = state.themes.includes(t.id);
  const active = state.theme === t.id;
  const act = () => {
    if (owned) return set({ theme: t.id });
    if (!buy("theme", t.id)) return toast.error("Not enough Starlites", { description: "Play a few rounds to stack up." });
    toast.success(`${t.name} unlocked & equipped`);
  };
  return (
    <div data-testid="shop-item-card" className="glass rounded-3xl p-5 lift">
      <div className="h-24 rounded-2xl flex overflow-hidden border border-white/10" style={{ background: t.swatch[0] }}>
        {t.swatch.slice(1).map((c) => <div key={c} className="flex-1 m-3 rounded-xl" style={{ background: c }} />)}
      </div>
      <div className="font-display text-2xl mt-4">{t.name}</div>
      <button data-testid={`buy-theme-btn-${t.id}`} onClick={act} disabled={active}
        className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-extrabold uppercase text-sm ${active ? "bg-white/5 text-slate-400" : owned ? "border border-[var(--eb-gold)] text-[var(--eb-gold)]" : "bg-[var(--eb-gold)] text-[var(--eb-on-gold)]"}`}>
        {active ? <><Check className="w-4 h-4" />Equipped</> : owned ? "Equip" : <Price v={t.price} />}
      </button>
    </div>
  );
};

const PowerCard = ({ p }) => {
  const { state, buy } = useGame();
  const act = () => (buy("powerup", p.id) ? toast.success(`+1 ${p.name}`) : toast.error("Not enough Starlites"));
  return (
    <div data-testid="shop-item-card" className="glass rounded-3xl p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-2xl grid place-items-center bg-[var(--eb-surface2)] text-[var(--eb-gold)]"><ModeIcon name={p.icon} className="w-6 h-6" /></div>
      <div className="flex-1">
        <div className="font-bold">{p.name} <span className="font-mono text-xs text-slate-400" data-testid={`powerup-owned-${p.id}`}>owned ×{state.powerups[p.id]}</span></div>
        <div className="text-xs text-slate-400">{p.desc}</div>
      </div>
      <button data-testid={`buy-powerup-btn-${p.id}`} onClick={act} className="lift px-4 py-2 rounded-full bg-[var(--eb-gold)] text-[var(--eb-on-gold)] font-extrabold text-sm"><Price v={p.price} /></button>
    </div>
  );
};

const AccentCard = () => {
  const { state, accent, set } = useGame();
  const on = state.useAccent && !!accent;
  return (
    <div data-testid="accent-sync-card" className="glass rounded-3xl p-5 flex items-center gap-4 mt-3">
      <span data-testid="accent-swatch" className="w-12 h-12 rounded-2xl shrink-0 border border-white/10" style={{ background: accent || "var(--eb-surface2)" }} />
      <div className="flex-1 min-w-0">
        <div className="font-bold">Use my Treesh accent color</div>
        <div className="text-xs text-slate-400">{accent ? `Your favorite color (${accent}) from the Treesh app replaces the highlight color in every theme.` : "No accent found yet. Pick one in Treesh Settings and it will show up here."}</div>
      </div>
      <button data-testid="accent-sync-toggle" role="switch" aria-checked={on} disabled={!accent} onClick={() => set({ useAccent: !state.useAccent })}
        className={`relative w-14 h-8 rounded-full transition-colors duration-200 disabled:opacity-40 ${on ? "bg-[var(--eb-gold)]" : "bg-white/10"}`}>
        <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200 ${on ? "translate-x-6" : ""}`} />
      </button>
    </div>
  );
};

export default function Shop() {
  const { state } = useGame();
  return (
    <div data-testid="shop-page">
      <div className="text-xs uppercase tracking-[0.3em] text-[var(--eb-gold)]">Synced with your Treesh wallet</div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-6xl sm:text-7xl mt-1">STARLITE SHOP</h1>
        <div className="flex items-center gap-2 px-5 py-3 rounded-full border border-[var(--eb-gold)] gold-glow text-[var(--eb-gold)] font-mono text-xl font-extrabold" data-testid="shop-balance"><Starlite className="w-6 h-6" />{state.starlites.toLocaleString()}</div>
      </div>
      <h2 className="font-display text-3xl mt-8">YOUR COLOR</h2>
      <AccentCard />
      <h2 className="font-display text-3xl mt-8">THEMES</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">{THEMES.map((t) => <ThemeCard key={t.id} t={t} />)}</div>
      <h2 className="font-display text-3xl mt-10">POWER-UPS</h2>
      <div className="grid md:grid-cols-2 gap-4 mt-3">{POWERUPS.map((p) => <PowerCard key={p.id} p={p} />)}</div>
    </div>
  );
}
