import { Lock, Check } from "lucide-react";
import { PlayDock } from "@/components/menu/PlayDock";
import { GameHeader } from "@/components/game/GameHeader";
import { PlayingCard } from "@/components/game/PlayingCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SKINS, THEMES, SkinContext } from "@/lib/cosmetics";
import { levelInfo } from "@/lib/achievements";
import { useProfile, updateProfile } from "@/lib/progress";
import { sfx } from "@/lib/sound";

const PREVIEW = [
  { id: 1, kind: "num", color: "red", value: 7 },
  { id: 2, kind: "wild", color: "wild" },
  { id: 3, kind: "num", color: "blue", value: 3 },
];

const EquipButton = ({ unlocked, equipped, level, onEquip, testid }) => (
  <button
    type="button"
    data-testid={testid}
    disabled={!unlocked || equipped}
    onClick={onEquip}
    className={`h-10 px-4 rounded-xl text-sm font-black uppercase flex items-center gap-1.5 transition-transform duration-150 active:scale-95 ${
      equipped ? "bg-[#34C759] text-[#0B0F19]" : unlocked ? "bg-brand text-brand-ink hover:scale-105" : "bg-white/5 text-slate-500"
    }`}
  >
    {equipped ? <><Check className="w-4 h-4" /> Equipped</> : unlocked ? "Equip" : <><Lock className="w-4 h-4" /> Level {level}</>}
  </button>
);

export default function Locker() {
  const profile = useProfile();
  const lv = levelInfo(profile.xp).level;
  const skin = profile.skin || "classic";
  const theme = profile.theme || "arcade";
  const equip = (key, id) => {
    updateProfile((p) => (p[key] = id));
    sfx.unlock();
  };

  return (
    <div className="min-h-[100dvh] bg-arcade pb-[calc(11rem+env(safe-area-inset-bottom))]" data-testid="locker-page">
      <GameHeader title="Locker" accent="#34C759" />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <p className="eyebrow">Level {lv} · new looks unlock as you level up</p>
        <h2 className="font-display font-black uppercase italic text-5xl sm:text-6xl tracking-tight mt-1">Style your game</h2>
        <Tabs defaultValue="skins" className="mt-6">
          <TabsList className="bg-[#161C2E] border border-white/10 h-12 p-1 rounded-2xl">
            <TabsTrigger data-testid="locker-tab-skins" value="skins" className="rounded-xl h-10 px-5 font-bold data-[state=active]:bg-[#34C759] data-[state=active]:text-[#0B0F19]">Card skins</TabsTrigger>
            <TabsTrigger data-testid="locker-tab-themes" value="themes" className="rounded-xl h-10 px-5 font-bold data-[state=active]:bg-[#34C759] data-[state=active]:text-[#0B0F19]">Board themes</TabsTrigger>
          </TabsList>
          <TabsContent value="skins" className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {SKINS.map((s) => {
              const unlocked = lv >= s.level;
              return (
                <div key={s.id} data-testid={`skin-card-${s.id}`} className={`glass rounded-3xl p-5 flex flex-col gap-4 ${skin === s.id ? "ring-2 ring-[#34C759]" : ""}`}>
                  <SkinContext.Provider value={s.id}>
                    <div className={`flex justify-center -space-x-4 py-2 ${unlocked ? "" : "grayscale opacity-50"}`}>
                      {PREVIEW.map((c, k) => (
                        <div key={c.id} style={{ transform: `rotate(${(k - 1) * 8}deg)` }}>
                          <PlayingCard card={c} size="md" />
                        </div>
                      ))}
                      <div style={{ transform: "rotate(14deg)" }}>
                        <PlayingCard faceDown size="md" />
                      </div>
                    </div>
                  </SkinContext.Provider>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="font-display text-2xl font-black uppercase">{s.name}</p>
                      <p className="text-slate-400 text-sm">{s.desc}</p>
                    </div>
                    <EquipButton testid={`skin-equip-${s.id}`} unlocked={unlocked} equipped={skin === s.id} level={s.level} onEquip={() => equip("skin", s.id)} />
                  </div>
                </div>
              );
            })}
          </TabsContent>
          <TabsContent value="themes" className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {THEMES.map((t) => {
              const unlocked = lv >= t.level;
              return (
                <div key={t.id} data-testid={`theme-card-${t.id}`} className={`glass rounded-3xl p-5 flex flex-col gap-4 ${theme === t.id ? "ring-2 ring-[#34C759]" : ""}`}>
                  <div className={`bg-arcade theme-preview theme-${t.id} h-32 rounded-2xl border border-white/10 grid place-items-center ${unlocked ? "" : "grayscale opacity-50"}`}>
                    <div className="board-surface grid grid-cols-3 gap-[2px] p-1 rounded-lg border border-white/20 w-20">
                      {[3, 0, 6, 0, 1, 0, 5, 0, 2].map((v, k) => (
                        <span key={k} className="h-5 grid place-items-center font-mono text-xs font-bold text-slate-200">{v || ""}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div>
                      <p className="font-display text-2xl font-black uppercase">{t.name}</p>
                      <p className="text-slate-400 text-sm">{t.desc}</p>
                    </div>
                    <EquipButton testid={`theme-equip-${t.id}`} unlocked={unlocked} equipped={theme === t.id} level={t.level} onEquip={() => equip("theme", t.id)} />
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
      <PlayDock />
    </div>
  );
}
