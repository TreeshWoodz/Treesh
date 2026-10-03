import { createPortal } from "react-dom";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Volume2, Lock, Package } from "lucide-react";
import { useGame } from "@/game/GameContext";
import { POWERUPS, BUNDLES, COSMETIC_GROUPS } from "@/game/data";
import * as A from "@/game/audio";
import { Page, Header, StarPill, StarGlyph, fmt } from "@/components/cz/ui";
import { Icon } from "@/components/cz/Icon";
import { Keyboard } from "@/components/cz/Keyboard";
import { Arena } from "@/components/cz/Arena";
import { Bursts } from "@/components/cz/Bursts";

const TABS = [{ key: "powerups", label: "Power-ups" }, ...COSMETIC_GROUPS.map((g) => ({ key: g.key, label: g.label }))];

const Price = ({ price, afford }) => (
  <span className={`inline-flex items-center gap-1 font-num text-sm ${afford ? "cz-gold-text" : "text-white/40"}`}><StarGlyph size={13} />{price ? fmt(price) : "FREE"}</span>
);

export default function Shop() {
  const { save, points, buy, equip, toast, params } = useGame();
  const [tab, setTab] = useState(params.tab || "powerups");
  const [confirm, setConfirm] = useState(null); // {item, kind}
  const burst = React.useRef(null);

  const doBuy = () => {
    const { item, kind, group } = confirm;
    const r = buy(item, kind);
    setConfirm(null);
    if (r.ok) {
      toast({ kind: "star", title: `${item.name} ${kind === "cosmetic" ? "unlocked" : "added"}`, sub: `−${fmt(item.price)} Starlites` });
      if (kind === "cosmetic" && group) equip(group, item.id);
      burst.current && burst.current.burst(window.innerWidth / 2, window.innerHeight / 2, { effect: "fx_stars", colors: ["#ffd36b", "#fff1c1"], count: 40 });
    } else toast({ kind: "error", title: r.reason, sub: "Play runs and unlock trophies to earn more", icon: "Sparkles" });
  };

  const group = COSMETIC_GROUPS.find((g) => g.key === tab);
  const preview = (item, g) => {
    if (g === "sound") { A.configureAudio({ sound: item.id }); A.sfxKey(); setTimeout(() => A.sfxKey(), 120); setTimeout(() => A.sfxKey(), 240); setTimeout(() => A.configureAudio({ sound: save.equipped.sound }), 400); }
    if (g === "effect" && burst.current) burst.current.burst(window.innerWidth / 2, window.innerHeight / 2.2, { effect: item.id, colors: item.colors, count: 36 });
  };

  return (
    <Page testid="shop-screen">
      <Bursts ref={burst} enabled={save.settings.particles} />
      <Header title="Gift Shop" sub="Spend Starlites from your Treesh wallet" right={<StarPill value={points} testid="shop-starlites-balance" size="lg" />} testid="shop" />

      <div className="cz-scroll -mx-4 flex gap-2 overflow-x-auto px-4 pb-1" data-testid="shop-tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} data-testid={`shop-tab-${t.key}`} className="cz-press relative shrink-0 rounded-full px-4 py-2 text-sm font-extrabold"
            style={{ background: tab === t.key ? "var(--accent)" : "rgba(255,255,255,.06)", color: tab === t.key ? "var(--accent-ink)" : "rgba(255,255,255,.75)" }}>{t.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-4">
          {tab === "powerups" ? (
            <>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
                {POWERUPS.map((p) => (
                  <div key={p.id} className="cz-card flex flex-col p-4" data-testid={`shop-item-card-${p.id}`}>
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: `${p.color}22`, color: p.color }}><Icon name={p.icon} size={21} /></span>
                      <span className="cz-chip px-2 py-0.5 text-[11px] font-extrabold" data-testid={`shop-owned-${p.id}`}>×{save.inventory[p.id] || 0}</span>
                    </div>
                    <p className="mt-3 font-extrabold">{p.name}</p>
                    <p className="mt-0.5 flex-1 text-[11px] leading-snug text-white/50">{p.desc}</p>
                    <button type="button" onClick={() => setConfirm({ item: p, kind: "powerup" })} disabled={points < p.price} data-testid={`shop-buy-button-${p.id}`}
                      className="cz-press cz-focus cz-btn-ghost mt-3 flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-extrabold disabled:opacity-40"><Price price={p.price} afford={points >= p.price} /></button>
                  </div>
                ))}
              </div>
              <p className="mb-2.5 mt-6 text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/50">Crates</p>
              <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
                {BUNDLES.map((b) => (
                  <div key={b.id} className="cz-card flex items-center gap-3 p-4" style={{ borderColor: "rgba(255,211,107,.22)" }} data-testid={`shop-item-card-${b.id}`}>
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#ffd36b]/15 text-[#ffd36b]"><Package size={22} /></span>
                    <div className="min-w-0 flex-1"><p className="font-extrabold">{b.name}</p><p className="text-xs text-white/50">{b.desc}</p></div>
                    <button type="button" onClick={() => setConfirm({ item: b, kind: "bundle" })} disabled={points < b.price} data-testid={`shop-buy-button-${b.id}`} className="cz-press cz-btn-gold h-10 rounded-xl px-3 text-sm font-extrabold disabled:opacity-40">{fmt(b.price)}</button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
              {group.items.map((it) => {
                const owned = save.owned.includes(it.id);
                const on = save.equipped[group.key] === it.id;
                return (
                  <div key={it.id} className="cz-card flex flex-col overflow-hidden" style={on ? { borderColor: "rgb(var(--accent-rgb) / .7)", boxShadow: "0 0 0 1px rgb(var(--accent-rgb) / .4), 0 10px 30px rgba(0,0,0,.45)" } : undefined} data-testid={`shop-item-card-${it.id}`}>
                    <button type="button" onClick={() => preview(it, group.key)} className="relative grid h-24 place-items-center lg:h-32 overflow-hidden border-b border-white/10 bg-black/30 px-3" aria-label={`Preview ${it.name}`} data-testid={`shop-preview-${it.id}`}>
                      {group.key === "keyboard" ? <div className="w-full"><Keyboard preview skin={it.id} /></div> : null}
                      {group.key === "arena" ? <div className="absolute inset-0"><Arena id={it.id} mini /></div> : null}
                      {group.key === "sound" ? <span className="flex items-center gap-2 text-sm font-bold text-white/70"><Volume2 size={18} className="cz-text-accent" />Tap to hear</span> : null}
                      {group.key === "effect" ? <span className="flex gap-1">{(it.colors || ["var(--accent)", "#fff", "var(--accent)"]).slice(0, 5).map((c, i) => <span key={i} className="h-3 w-3 rounded-full" style={{ background: c, boxShadow: `0 0 10px ${c}` }} />)}</span> : null}
                      {group.key === "title" ? <span className="font-display text-center text-lg leading-tight">{it.name}</span> : null}
                      {on ? <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}><Check size={11} />EQUIPPED</span> : null}
                    </button>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="text-sm font-extrabold">{it.name}</p>
                      {it.desc ? <p className="mt-0.5 flex-1 text-[11px] leading-snug text-white/50">{it.desc}</p> : <div className="flex-1" />}
                      {owned ? (
                        <button type="button" disabled={on} onClick={() => equip(group.key, it.id)} data-testid={`shop-equip-button-${it.id}`} className={`cz-press mt-2.5 h-9 rounded-xl text-xs font-extrabold ${on ? "bg-white/5 text-white/40" : "cz-btn-primary"}`}>{on ? "Equipped" : "Equip"}</button>
                      ) : (
                        <button type="button" onClick={() => setConfirm({ item: it, kind: "cosmetic", group: group.key })} disabled={points < it.price} data-testid={`shop-buy-button-${it.id}`}
                          className="cz-press cz-btn-ghost mt-2.5 flex h-9 items-center justify-center gap-1.5 rounded-xl text-xs font-extrabold disabled:opacity-40">{points < it.price ? <Lock size={12} /> : null}<Price price={it.price} afford={points >= it.price} /></button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center text-xs text-white/40">Earn Starlites by linking words, hitting combos, golden words, daily chains &amp; trophies.</p>

      {createPortal(<AnimatePresence>
        {confirm ? (
          <motion.div className="fixed inset-0 z-50 grid place-items-end bg-black/70 sm:place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirm(null)} data-testid="shop-confirm-dialog">
            <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ type: "spring", stiffness: 380, damping: 32 }} onClick={(e) => e.stopPropagation()} className="cz-solid mx-auto w-full max-w-[520px] rounded-b-none p-6 sm:rounded-b-[22px]">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/50">Confirm purchase</p>
              <h3 className="font-display mt-1 text-2xl">{confirm.item.name}</h3>
              <p className="mt-1 text-sm text-white/60">{confirm.item.desc}</p>
              <div className="mt-4 space-y-1.5 rounded-2xl bg-black/30 p-4 text-sm">
                <div className="flex justify-between"><span className="text-white/60">Price</span><Price price={confirm.item.price} afford /></div>
                <div className="flex justify-between"><span className="text-white/60">Balance after</span><span className="font-num">{fmt(points - confirm.item.price)}</span></div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setConfirm(null)} data-testid="shop-confirm-cancel" className="cz-press cz-btn-ghost h-12 rounded-2xl font-extrabold">Cancel</button>
                <button type="button" onClick={doBuy} data-testid="shop-confirm-buy" className="cz-press cz-btn-gold h-12 rounded-2xl font-extrabold">Buy now</button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>, document.body)}
    </Page>
  );
}
