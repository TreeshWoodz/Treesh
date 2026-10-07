import { useState } from "react";
import { toast } from "sonner";
import { Cloud, Download, Volume2, VolumeX, Copy } from "lucide-react";
import { Layout, PageTitle } from "../components/Layout";
import { Switch } from "../components/ui/switch";
import { useProfile, mergeProfile } from "../game/store";
import { api, errMsg } from "../game/api";

const Stat = ({ label, value }) => (
  <div className="stat-box"><div className="hud-label">{label}</div><div className="font-display text-xl font-black tabular-nums text-white">{value}</div></div>
);

export default function Profile() {
  const { profile, update, replace } = useProfile();
  const [name, setName] = useState(profile.name);
  const [loadName, setLoadName] = useState("");
  const [loadCode, setLoadCode] = useState("");
  const [busy, setBusy] = useState(false);
  const s = profile.stats;

  const saveName = () => {
    const n = name.trim();
    if (n.length < 2 || n.length > 20) return toast.error("Player tag must be 2-20 characters");
    update(() => ({ name: n }));
    toast.success("Player tag updated");
  };

  const cloudSave = async () => {
    setBusy(true);
    try {
      const res = await api.cloudSave({ ...profile, name: name.trim() || profile.name });
      update(() => ({ saveCode: res.save_code, name: res.name }));
      toast.success("Progress saved to the cloud");
    } catch (e) {
      toast.error(errMsg(e));
    }
    setBusy(false);
  };

  const cloudLoad = async () => {
    setBusy(true);
    try {
      const res = await api.cloudLoad(loadName.trim(), loadCode.trim());
      replace(mergeProfile({ ...res.progress, playerId: res.player_id, name: res.name, saveCode: res.save_code, onboarded: true }));
      setName(res.name);
      toast.success(`Welcome back, ${res.name}!`);
    } catch (e) {
      toast.error(errMsg(e));
    }
    setBusy(false);
  };

  return (
    <Layout>
      <PageTitle eyebrow="Player Profile" title={profile.name} />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card-surface p-6">
          <h2 className="font-display text-lg font-bold text-amber-200">Player Tag</h2>
          <div className="mt-4 flex gap-2">
            <input data-testid="player-name-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} className="field flex-1" />
            <button data-testid="save-profile-btn" onClick={saveName} className="btn-bronze !px-4 !py-2 text-sm">Save</button>
          </div>
          <div className="mt-6 flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
            <div className="flex items-center gap-3 text-sm font-semibold text-slate-200">{profile.sound ? <Volume2 size={18} /> : <VolumeX size={18} />} Sound effects</div>
            <Switch data-testid="sound-toggle" checked={profile.sound} onCheckedChange={(v) => update(() => ({ sound: v }))} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Games" value={s.games} />
            <Stat label="Tiles cleared" value={s.tiles.toLocaleString()} />
            <Stat label="Best combo" value={`x${s.maxCombo}`} />
            <Stat label="Discos made" value={s.discos} />
            <Stat label="Bombs made" value={s.bombs} />
            <Stat label="Starlites earned" value={s.earned.toLocaleString()} />
          </div>
        </section>

        <section className="card-surface p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-amber-200"><Cloud size={20} /> Cloud Save</h2>
          <p className="mt-2 text-sm text-slate-400">Claim your player tag and back up Starlites, levels and trophies. Use your tag + save code to restore on any device.</p>
          {profile.saveCode && (
            <div className="mt-4 flex items-center justify-between rounded-xl border border-[#FFC800]/30 bg-[#FFC800]/5 px-4 py-3">
              <div><div className="hud-label">Your save code</div><div data-testid="cloud-save-code" className="font-display text-2xl font-black tracking-[0.3em] text-[#FFC800]">{profile.saveCode}</div></div>
              <button data-testid="copy-save-code-btn" className="icon-btn" onClick={() => { navigator.clipboard?.writeText(profile.saveCode); toast.success("Code copied"); }}><Copy size={16} /></button>
            </div>
          )}
          <button data-testid="cloud-save-btn" disabled={busy} onClick={cloudSave} className="btn-bronze mt-4 w-full">
            <Cloud size={18} /> {profile.saveCode ? "Sync Now" : "Save to Cloud"}
          </button>
          <div className="my-6 h-px bg-white/5" />
          <h3 className="flex items-center gap-2 font-display font-bold text-white"><Download size={18} /> Load from another device</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px]">
            <input data-testid="cloud-load-name-input" placeholder="Player tag" value={loadName} onChange={(e) => setLoadName(e.target.value)} className="field" />
            <input data-testid="cloud-load-code-input" placeholder="Save code" value={loadCode} onChange={(e) => setLoadCode(e.target.value.toUpperCase())} className="field uppercase tracking-widest" />
          </div>
          <button data-testid="cloud-load-btn" disabled={busy || !loadName || !loadCode} onClick={cloudLoad} className="btn-ghost mt-3 w-full">Load Progress</button>
        </section>
      </div>
    </Layout>
  );
}
