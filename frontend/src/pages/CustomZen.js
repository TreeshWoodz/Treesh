import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Play, RotateCcw, Sparkles, Wind, Grid3x3, Gift, ArrowDownUp, Wand2 } from "lucide-react";
import { Layout, PageTitle } from "../components/Layout";
import { Slider } from "../components/ui/slider";
import { Switch } from "../components/ui/switch";
import { useProfile } from "../game/store";
import { SANDBOX_SPECIALS, FALL_DIRS, ENV_EVENTS, PRESETS, CUSTOM_DEFAULTS, mergeCustom } from "../game/sandbox";

const Section = ({ title, Icon, note, children, delay = 0 }) => (
  <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="sandbox-panel">
    <div className="mb-3 flex items-center gap-2">
      <span className="sandbox-icon"><Icon size={16} /></span>
      <h2 className="font-display text-base font-black text-white md:text-lg">{title}</h2>
    </div>
    {note && <p className="-mt-1 mb-3 text-xs text-slate-400">{note}</p>}
    {children}
  </motion.section>
);

const SliderRow = ({ id, label, value, min, max, step = 1, fmt = (v) => v, onChange }) => (
  <div className="py-2">
    <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
      <span>{label}</span><span data-testid={`${id}-value`} className="text-[var(--ac-hi)]">{fmt(value)}</span>
    </div>
    <Slider data-testid={`${id}-slider`} value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
  </div>
);

const SwitchRow = ({ id, label, desc, checked, onChange }) => (
  <label className="flex cursor-pointer items-center justify-between gap-3 py-2">
    <span><span className="block text-sm font-bold text-white">{label}</span>{desc && <span className="block text-xs text-slate-400">{desc}</span>}</span>
    <Switch data-testid={`${id}-switch`} checked={checked} onCheckedChange={onChange} className="data-[state=checked]:bg-[var(--ac)]" />
  </label>
);

const SpecialToggle = ({ sp, on, onClick }) => (
  <button data-testid={`sandbox-special-${sp.id}`} onClick={onClick} className={`sandbox-chip ${on ? "sandbox-chip-on" : ""} ${sp.exclusive ? "sandbox-chip-ex" : ""}`}>
    <sp.Icon size={18} />
    <span className="text-left leading-tight"><span className="block text-xs font-black">{sp.name}</span><span className="block text-[10px] opacity-70">{sp.desc}</span></span>
  </button>
);

function SpecialsSection({ s, set }) {
  const toggle = (id) => set({ specials: { ...s.specials, [id]: !s.specials[id] } });
  const all = (v) => set({ specials: Object.fromEntries(SANDBOX_SPECIALS.map((x) => [x.id, v])) });
  const Group = ({ ex }) => (
    <div className="grid grid-cols-2 gap-2">
      {SANDBOX_SPECIALS.filter((x) => !!x.exclusive === ex).map((sp) => <SpecialToggle key={sp.id} sp={sp} on={s.specials[sp.id]} onClick={() => toggle(sp.id)} />)}
    </div>
  );
  return (
    <Section title="Multipliers & Specials" Icon={Sparkles}>
      <div className="mb-3 flex gap-2">
        <button data-testid="sandbox-specials-all-on" onClick={() => all(true)} className="btn-ghost !px-3 !py-1 text-xs">All on</button>
        <button data-testid="sandbox-specials-all-off" onClick={() => all(false)} className="btn-ghost !px-3 !py-1 text-xs">All off</button>
      </div>
      <Group ex={false} />
      <div className="eyebrow mt-4 !text-[10px]">Custom Zen exclusives - drop in via Gifts & Disco Party</div>
      <Group ex />
    </Section>
  );
}

const PhysicsSection = ({ s, set }) => (
  <Section title="Gravity & Physics" Icon={ArrowDownUp} delay={0.05}>
    <div className="grid grid-cols-5 gap-2">
      {FALL_DIRS.map((d) => (
        <button key={d.id} data-testid={`sandbox-dir-${d.id}`} onClick={() => set({ gravity: d.id })} title={d.name}
          className={`sandbox-dir ${s.gravity === d.id ? "sandbox-dir-on" : ""}`}>
          <d.Icon size={18} /><span className="text-[9px] font-bold uppercase leading-tight">{d.name}</span>
        </button>
      ))}
    </div>
    <SliderRow id="sandbox-strength" label="Gravity strength" value={s.strength} min={0.25} max={2} step={0.25} fmt={(v) => `${v}x`} onChange={(v) => set({ strength: v })} />
    <SliderRow id="sandbox-speed" label="Cascade speed" value={s.speed} min={0.5} max={2} step={0.25} fmt={(v) => `${v}x`} onChange={(v) => set({ speed: v })} />
  </Section>
);

function EnvSection({ s, set }) {
  const patch = (id, v) => set({ env: { ...s.env, [id]: { ...s.env[id], ...v } } });
  return (
    <Section title="Environment & Chaos" Icon={Wind} delay={0.1} note="Events fire on a timer while you play.">
      {ENV_EVENTS.map((e) => (
        <div key={e.id} className="border-b border-white/5 last:border-0">
          <SwitchRow id={`sandbox-env-${e.id}`} label={<span className="inline-flex items-center gap-2"><e.Icon size={14} /> {e.name}</span>} desc={e.desc}
            checked={s.env[e.id].on} onChange={(v) => patch(e.id, { on: v })} />
          {s.env[e.id].on && (
            <SliderRow id={`sandbox-env-${e.id}-every`} label="Every" value={s.env[e.id].every} min={3} max={40} fmt={(v) => `${v}s`} onChange={(v) => patch(e.id, { every: v })} />
          )}
        </div>
      ))}
    </Section>
  );
}

const BoardSection = ({ s, set }) => (
  <Section title="Board Rules" Icon={Grid3x3} delay={0.15}>
    <SliderRow id="sandbox-size" label="Board size" value={s.size} min={6} max={10} fmt={(v) => `${v}x${v}`} onChange={(v) => set({ size: v })} />
    <SliderRow id="sandbox-colors" label="Tile colors" value={s.types} min={3} max={7} onChange={(v) => set({ types: v })} />
    <SwitchRow id="sandbox-diagonal" label="Diagonal swaps" desc="Allow swiping tiles diagonally" checked={s.diagonal} onChange={(v) => set({ diagonal: v })} />
    <SwitchRow id="sandbox-mirror" label="Mirror mode" desc="Every swap is mirrored on the other side" checked={s.mirror} onChange={(v) => set({ mirror: v })} />
    <SwitchRow id="sandbox-rainbow" label="Rainbow tiles" desc="Wild tiles that match any color" checked={s.rainbow} onChange={(v) => set({ rainbow: v })} />
  </Section>
);

const GiftSection = ({ s, set }) => (
  <Section title="Gifts & Party" Icon={Gift} delay={0.2}>
    <SliderRow id="sandbox-gift-every" label="Gift a special every" value={s.giftEvery} min={0} max={10} fmt={(v) => (v ? `${v} swipe${v > 1 ? "s" : ""}` : "Off")} onChange={(v) => set({ giftEvery: v })} />
    {s.giftEvery > 0 && <SliderRow id="sandbox-gift-count" label="Specials per gift" value={s.giftCount} min={1} max={3} onChange={(v) => set({ giftCount: v })} />}
    <SwitchRow id="sandbox-party" label="Disco Party" desc="New tiles drop in loaded with specials way more often" checked={s.party} onChange={(v) => set({ party: v })} />
  </Section>
);

export function useSandbox() {
  const { profile, update } = useProfile();
  const s = mergeCustom(profile.customZen || {});
  const set = (v) => update((p) => ({ customZen: { ...mergeCustom(p.customZen || {}), ...v } }));
  const applyPreset = (pr) => update(() => ({ customZen: mergeCustom({ ...CUSTOM_DEFAULTS, ...pr.s }) }));
  return { s, set, applyPreset };
}

export const Presets = ({ applyPreset }) => (
  <div className="flex flex-wrap items-center justify-center gap-2">
    <Wand2 size={16} className="text-[var(--ac-hi)]" />
    {PRESETS.map((pr) => (
      <button key={pr.id} data-testid={`sandbox-preset-${pr.id}`} onClick={() => applyPreset(pr)} className="chest-btn !py-1.5 text-xs">{pr.name}</button>
    ))}
    <button data-testid="sandbox-reset-btn" onClick={() => applyPreset({ s: {} })} className="chest-btn !py-1.5 text-xs"><RotateCcw size={14} /> Reset</button>
  </div>
);

export const SandboxPanels = ({ s, set, stacked }) => (
  <div className={`grid gap-4 ${stacked ? "" : "lg:grid-cols-2"}`}>
    <SpecialsSection s={s} set={set} />
    <PhysicsSection s={s} set={set} />
    <EnvSection s={s} set={set} />
    <div className="flex flex-col gap-4"><BoardSection s={s} set={set} /><GiftSection s={s} set={set} /></div>
  </div>
);

export default function CustomZen() {
  const nav = useNavigate();
  const { s, set, applyPreset } = useSandbox();
  return (
    <Layout art="afrofuture" wide>
      <PageTitle eyebrow="Endless Zen - Sandbox" title="Custom Zen">
        <p className="max-w-lg text-sm text-slate-200">Build your own board. Flip gravity, unleash chaos, stack exclusive specials. Sandbox rounds pay half the Starlites of Classic Zen and skip the leaderboard.</p>
      </PageTitle>
      <div className="mb-6"><Presets applyPreset={applyPreset} /></div>
      <SandboxPanels s={s} set={set} />
      <div className="sandbox-start">
        <button data-testid="sandbox-start-btn" onClick={() => nav("/play/custom")} className="btn-bronze !px-8 text-base"><Play size={18} fill="currentColor" /> Start Custom Zen</button>
      </div>
    </Layout>
  );
}
