import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Camera, Download, Flame, Link2, Pencil, RotateCcw, Timer, Trophy, Upload, Dumbbell, Target, Gamepad2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/PinkButton";
import { Avatar } from "@/components/Shell";
import { LEVELS } from "@/data/drills";
import { DEFAULT_SETTINGS, DEFAULT_STATS, exportEverything, importEverything, KEYS, LS, readJSONFile, streakOf, todayStr, useStored, zodiac } from "@/lib/storage";

function resizeImage(file, max = 320) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const s = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * s);
        c.height = Math.round(img.height * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = rej;
      img.src = r.result;
    };
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function Heatmap({ days }) {
  const set = new Set(days);
  const cells = [];
  const d = new Date();
  d.setDate(d.getDate() - 83);
  for (let i = 0; i < 84; i++) {
    cells.push(todayStr(d));
    d.setDate(d.getDate() + 1);
  }
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1" data-testid="profile-heatmap">
      {cells.map((c) => <span key={c} title={c} className="h-3.5 w-3.5 rounded-[4px]" style={{ background: set.has(c) ? "#FF3EA5" : "#1a1b26" }} />)}
    </div>
  );
}

export default function Profile() {
  const nav = useNavigate();
  const [profile, setProfile] = useStored(KEYS.profile, null);
  const [accent] = useStored(KEYS.accent, null);
  const [stats] = useStored(KEYS.stats, DEFAULT_STATS);
  const [settingsRaw, setSettings] = useStored(KEYS.settings, {});
  const [body] = useStored(KEYS.body, null);
  const settings = { ...DEFAULT_SETTINGS, ...settingsRaw };
  const [editing, setEditing] = useState(false);
  const [nick, setNick] = useState(profile?.nickname || "");
  const [bday, setBday] = useState(profile?.birthday || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "");
  const fileRef = useRef(null);
  const importRef = useRef(null);
  const connected = !!profile;
  const bdayLocked = !!profile?.birthday;

  const s = { ...DEFAULT_STATS, ...stats };
  const drillsDone = Object.values(s.drillsDone || {}).reduce((a, b) => a + b, 0);
  const streak = streakOf(s.activeDays);

  const startEdit = () => {
    setNick(profile?.nickname || "");
    setBday(profile?.birthday || "");
    setAvatar(profile?.avatar || "");
    setEditing(true);
  };
  const save = () => {
    const name = nick.trim() || "Treesh Fan";
    const birthday = bdayLocked ? profile.birthday : bday;
    // Keep the parent Treesh schema intact: {nickname, birthday, zodiac, avatar, ...rest}
    const next = { ...(profile || {}), nickname: name, birthday: birthday || "", zodiac: zodiac(birthday), avatar: avatar || "" };
    setProfile(next);
    if (!bdayLocked && birthday && !LS.get(KEYS.bdayEdits, 0)) LS.set(KEYS.bdayEdits, 1);
    setEditing(false);
    toast.success(connected ? "Profile updated" : "Profile created", { description: "Shared with Treesh on this device." });
  };
  const setOpt = (k, v) => setSettings((c) => ({ ...(c || {}), [k]: v }));

  const onImport = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const n = importEverything(await readJSONFile(f));
      toast.success("Backup restored", { description: `${n} data sets loaded.` });
    } catch (err) {
      toast.error(err.message);
    }
  };
  const resetHoop = () => {
    if (!window.confirm("Reset all Hoop data on this device? Your Treesh profile stays.")) return;
    Object.values(KEYS).filter((k) => k.startsWith("treesh_hoop_")).forEach((k) => { localStorage.removeItem(k); window.dispatchEvent(new CustomEvent("hoop-store", { detail: { key: k } })); });
    toast("Hoop data reset");
  };

  const STAT = [
    [Timer, "Sessions", s.sessions, "profile-stat-sessions"],
    [Flame, "Minutes", s.minutes, "profile-stat-minutes"],
    [Dumbbell, "Drills done", drillsDone, "profile-stat-drills"],
    [Gamepad2, "Games", s.games, "profile-stat-games"],
    [Target, "Shots checked", s.shots, "profile-stat-shots"],
    [Trophy, "Best form", s.bestShot || "\u2013", "profile-stat-best"],
  ];

  return (
    <div data-testid="profile-page">
      <PageHeader eyebrow="Your Hoop" title="Profile" sub="Your Treesh identity plus everything you've put in on the court." testid="profile-title" />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="space-y-4">
          <div className="hp-card hp-hero-glow overflow-hidden p-5">
            <div className="flex items-center justify-between">
              <span data-testid="profile-sync-status" className={`inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[11px] font-extrabold ${connected ? "bg-[#2EE59D]/12 text-[#2EE59D]" : "bg-[#FFCC66]/12 text-[#FFCC66]"}`}>
                <Link2 size={12} /> {connected ? "Connected to Treesh" : "No Treesh profile on this device"}
              </span>
              {connected && !editing && <button onClick={startEdit} className="press grid h-9 w-9 place-items-center rounded-full border border-[#25273a] bg-[#14151d]" aria-label="Edit profile" data-testid="profile-edit-button"><Pencil size={14} /></button>}
            </div>
            {!editing ? (
              <div className="mt-5 flex items-center gap-4">
                <div className="rounded-full ring-2 ring-[#FF3EA5]/40 ring-offset-4 ring-offset-[#121319]"><Avatar profile={profile} size={84} testid="profile-avatar" /></div>
                <div className="min-w-0">
                  <div className="font-display truncate text-[26px] leading-tight" data-testid="profile-nickname">{profile?.nickname || "Hooper"}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[12px] font-semibold text-[#B7BBCB]">
                    {profile?.zodiac && <span className="rounded-full bg-[#171923] px-2.5 py-1" data-testid="profile-zodiac">{profile.zodiac}</span>}
                    {body?.top && <span className="rounded-full bg-[#FF3EA5]/12 px-2.5 py-1 text-[#FF8CCB]" data-testid="profile-position">Plays {body.top}</span>}
                    {accent && <span className="inline-flex items-center gap-1.5 rounded-full bg-[#171923] px-2.5 py-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: accent }} /> Treesh accent</span>}
                  </div>
                </div>
              </div>
            ) : null}
            {!connected && !editing && (
              <div className="mt-4">
                <p className="text-[13px] text-[#B7BBCB]">Hoop reads your profile straight from the Treesh app on this device (same browser storage). Open Treesh to set one up, or create it here and it'll appear in Treesh too.</p>
                <Btn className="mt-4 w-full" onClick={startEdit} data-testid="profile-create-button">Create profile</Btn>
              </div>
            )}
            {editing && (
              <div className="mt-5 space-y-4" data-testid="profile-edit-form">
                <div className="flex items-center gap-4">
                  <Avatar profile={{ nickname: nick, avatar }} size={72} testid="profile-edit-avatar" />
                  <div className="flex flex-col gap-2">
                    <Btn variant="secondary" size="sm" onClick={() => fileRef.current?.click()} data-testid="profile-avatar-upload-button"><Camera size={14} /> Change photo</Btn>
                    {avatar && <button onClick={() => setAvatar("")} className="text-left text-xs font-bold text-[#8B90A6] hover:text-[#FF7A7A]">Remove photo</button>}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" data-testid="profile-avatar-input" onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ""; if (!f) return; try { setAvatar(await resizeImage(f)); } catch (err) { toast.error("Couldn't read that image"); } }} />
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-bold">Nickname</span>
                  <input value={nick} maxLength={24} onChange={(e) => setNick(e.target.value)} data-testid="profile-nickname-input" className="h-12 w-full rounded-xl border border-[#25273a] bg-[#0f1015] px-4 text-[15px] font-semibold focus:border-[#FF3EA5] focus:outline-none" placeholder="What do they call you on the court?" />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex justify-between text-[13px] font-bold">Birthday {bdayLocked && <span className="text-[11px] font-semibold text-[#8B90A6]">managed in Treesh</span>}</span>
                  <input type="date" value={bday} disabled={bdayLocked} onChange={(e) => setBday(e.target.value)} data-testid="profile-birthday-input" className="h-12 w-full rounded-xl border border-[#25273a] bg-[#0f1015] px-4 text-[15px] font-semibold focus:border-[#FF3EA5] focus:outline-none disabled:opacity-60" />
                </label>
                <div className="flex gap-2">
                  <Btn className="flex-1" onClick={save} data-testid="profile-save-button">Save</Btn>
                  <Btn variant="secondary" onClick={() => setEditing(false)} data-testid="profile-cancel-button">Cancel</Btn>
                </div>
              </div>
            )}
          </div>

          <div className="hp-card space-y-4 p-5" data-testid="profile-settings">
            <div className="hp-eyebrow">Hoop settings</div>
            <div>
              <div className="mb-2 text-[13px] font-bold">Units</div>
              <div className="flex gap-2">{[["imperial", "Imperial (ft, mi, lb)"], ["metric", "Metric (cm, km, kg)"]].map(([k, l]) => <button key={k} className="hp-chip !h-8 flex-1 justify-center !text-[12px]" data-active={settings.units === k} onClick={() => setOpt("units", k)} data-testid={`profile-units-${k}`}>{l}</button>)}</div>
            </div>
            <div>
              <div className="mb-2 text-[13px] font-bold">Shooting hand</div>
              <div className="flex gap-2">{["right", "left"].map((h) => <button key={h} className="hp-chip !h-8 flex-1 justify-center capitalize" data-active={settings.hand === h} onClick={() => setOpt("hand", h)} data-testid={`profile-hand-${h}`}>{h}</button>)}</div>
            </div>
            <div>
              <div className="mb-2 text-[13px] font-bold">Default level</div>
              <div className="grid grid-cols-2 gap-2">{LEVELS.map((l) => <button key={l.id} className="hp-chip !h-8 justify-center" data-active={settings.level === l.id} onClick={() => setOpt("level", l.id)} data-testid={`profile-level-${l.id}`}>{l.label}</button>)}</div>
            </div>
            {[["voice", "Voice cues (timer + form check)"], ["beeps", "Countdown beeps"]].map(([k, l]) => (
              <label key={k} className="flex items-center justify-between text-[13px] font-bold">{l}<Switch checked={settings[k]} onCheckedChange={(v) => setOpt(k, v)} data-testid={`profile-switch-${k}`} /></label>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" data-testid="profile-stats-card">
            {STAT.map(([I, l, v, id], i) => (
              <motion.div key={l} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="hp-card p-4">
                <I size={16} className="text-[#FF3EA5]" />
                <div className="mt-3 font-num text-[34px] font-black leading-none" data-testid={id}>{v}</div>
                <div className="mt-1.5 text-[12px] font-bold text-[#8B90A6]">{l}</div>
              </motion.div>
            ))}
          </div>
          <div className="hp-card p-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <div className="hp-eyebrow">Consistency</div>
                <div className="font-display mt-1 text-2xl"><span className="text-[#FF3EA5]" data-testid="profile-streak">{streak}</span> day streak</div>
              </div>
              <div className="text-right text-xs text-[#8B90A6]">{(s.activeDays || []).length} active days</div>
            </div>
            <div className="overflow-x-auto no-scrollbar"><Heatmap days={s.activeDays || []} /></div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn size="sm" onClick={() => nav("/plan")} data-testid="profile-go-plan"><CheckCircle2 size={14} /> Log a session</Btn>
              <Btn size="sm" variant="secondary" onClick={() => nav("/form")}><Target size={14} /> Check my form</Btn>
            </div>
          </div>
          <div className="hp-card p-5">
            <div className="hp-eyebrow mb-2">Your data</div>
            <p className="text-[13px] text-[#B7BBCB]">Hoop saves to this device under Treesh's storage, so it shows up in Treesh's storage manager too. Back it up to a file anytime.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Btn variant="secondary" size="sm" onClick={exportEverything} data-testid="profile-export-backup"><Download size={14} /> Export backup</Btn>
              <Btn variant="secondary" size="sm" onClick={() => importRef.current?.click()} data-testid="profile-import-backup"><Upload size={14} /> Import backup</Btn>
              <Btn variant="danger" size="sm" onClick={resetHoop} data-testid="profile-reset-hoop"><RotateCcw size={14} /> Reset Hoop data</Btn>
              <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={onImport} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
