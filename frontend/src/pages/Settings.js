import { useState } from "react";
import { motion } from "framer-motion";
import { User, Palette, Mic, Trash2, Check, Upload } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { getZodiac } from "@/lib/zodiac";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CoverArt } from "@/components/CoverArt";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ACCENTS = [
  { hex: "#9328ff", name: "Treesh Purple" },
  { hex: "#7a2cff", name: "Deep Violet" },
  { hex: "#b58cff", name: "Lavender Neon" },
  { hex: "#c3ab69", name: "Gold" },
  { hex: "#ff2d78", name: "Hot Pink" },
  { hex: "#22d3ee", name: "Cyan" },
];

const COMMANDS = ["play", "pause", "next", "previous", "shuffle", "repeat", "search <name>", "play <name>"];

export default function Settings() {
  const { profile, saveProfile } = useProfile();
  const [nickname, setNickname] = useState(profile.nickname || "");
  const [birthday, setBirthday] = useState(profile.birthday || "");
  const [avatar, setAvatar] = useState(profile.avatar || "");
  const zodiac = getZodiac(birthday);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const saveProfileInfo = async () => {
    await saveProfile({ nickname: nickname.trim() || "Treesh Fan", birthday, zodiac, avatar });
    toast("Profile saved");
  };

  const pickAccent = async (hex) => { await saveProfile({ accent: hex }); toast("Accent updated"); };

  const eraseData = () => {
    localStorage.removeItem("treesh_profile");
    localStorage.removeItem("treesh_profile_id");
    window.location.reload();
  };

  return (
    <div className="space-y-8" data-testid="settings-page">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Make it yours</p>
        <h1 className="mt-1 text-3xl font-bold">Settings</h1>
      </motion.div>

      {/* Profile */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><User size={18} /> Profile</h2>
        <div className="flex flex-col gap-5 sm:flex-row">
          <div className="flex flex-col items-center gap-3">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-white/15">
              {avatar ? <CoverArt src={avatar} alt="avatar" className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center text-2xl font-bold text-white/50">{(nickname || "T").charAt(0).toUpperCase()}</span>}
            </div>
            <label className="flex cursor-pointer items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">
              <Upload size={13} /> Change
              <input type="file" accept="image/*" className="hidden" onChange={onFile} data-testid="settings-avatar-upload" />
            </label>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wide text-white/50">Nickname</label>
              <Input value={nickname} onChange={(e) => setNickname(e.target.value)} data-testid="settings-nickname-input" className="bg-white/5 border-white/15" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wide text-white/50">Birthday</label>
              <div className="flex items-center gap-3">
                <Input type="date" value={birthday} max={new Date().toISOString().split("T")[0]} onChange={(e) => setBirthday(e.target.value)} data-testid="settings-birthday-input" className="bg-white/5 border-white/15" />
                {zodiac && <span className="shrink-0 rounded-full border border-[color:var(--treesh-gold)]/40 bg-[color:var(--treesh-gold)]/10 px-3 py-1 text-xs text-[color:var(--treesh-gold)]">{zodiac}</span>}
              </div>
            </div>
            <Button onClick={saveProfileInfo} data-testid="settings-save-profile-button" className="gap-2 bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90"><Check size={16} /> Save profile</Button>
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6" data-testid="theme-settings">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold"><Palette size={18} /> Accent color</h2>
        <p className="mb-4 text-sm text-white/50">Personalize the app’s glow.</p>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.hex}
              onClick={() => pickAccent(a.hex)}
              data-testid={`theme-accent-swatch-${a.hex.replace('#','')}`}
              title={a.name}
              className={cn("relative h-12 w-12 rounded-full border-2 transition-transform hover:scale-110", profile.accent === a.hex ? "border-white" : "border-white/20")}
              style={{ background: a.hex, boxShadow: profile.accent === a.hex ? `0 0 20px ${a.hex}` : "none" }}
            >
              {profile.accent === a.hex && <Check size={18} className="absolute inset-0 m-auto text-white" />}
            </button>
          ))}
        </div>
      </section>

      {/* Voice */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold"><Mic size={18} /> Voice commands</h2>
        <p className="mb-4 text-sm text-white/50">Tap the mic in the header, then say:</p>
        <div className="flex flex-wrap gap-2">
          {COMMANDS.map((c) => <span key={c} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70">“{c}”</span>)}
        </div>
      </section>

      {/* Danger */}
      <section className="rounded-3xl border border-red-500/20 bg-red-500/[0.04] p-6">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-bold text-red-200"><Trash2 size={18} /> Erase data</h2>
        <p className="mb-4 text-sm text-white/50">Clears your local profile and preferences on this device.</p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" data-testid="erase-data-button" className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20">Erase everything</Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="glass-strong border-white/15">
            <AlertDialogHeader><AlertDialogTitle>Erase all local data?</AlertDialogTitle><AlertDialogDescription>Your nickname, avatar and theme on this device will be reset. Favorites/playlists on the server remain tied to a new profile.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-white/15 bg-white/5">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={eraseData} className="bg-red-600 hover:bg-red-700">Erase</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
