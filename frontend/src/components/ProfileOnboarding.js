import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Upload, ArrowRight, Check } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { getZodiac } from "@/lib/zodiac";
import { CoverArt } from "@/components/CoverArt";

const PRESET_AVATARS = [
  "https://static.tumblr.com/9leohrr/04Hspf8x9/icon-crazy.png",
  "https://static.tumblr.com/9leohrr/BCJspf9yo/londonllafareartist.png",
  "https://static.tumblr.com/9leohrr/7eVspf9iu/chelly_banqz.jpg",
  "https://static.tumblr.com/9leohrr/7L3spf9lt/pio_milano.jpg",
];

export function ProfileOnboarding() {
  const { needsOnboarding, saveProfile, setNeedsOnboarding } = useProfile();
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatar, setAvatar] = useState("");
  const zodiac = getZodiac(birthday);

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const finish = async () => {
    await saveProfile({ nickname: nickname.trim() || "Treesh Fan", birthday, zodiac, avatar });
  };

  const steps = [
    { title: "Welcome to Treesh 3.0", sub: "Music to Live For" },
    { title: "Give yourself a nickname", sub: "" },
    { title: "When’s your birthday?", sub: "We’ll reveal your zodiac" },
    { title: "Pick a profile picture", sub: "Upload or choose" },
  ];

  const canNext = step === 0 || (step === 1 && nickname.trim()) || (step === 2 && birthday) || step === 3;

  return (
    <Dialog open={needsOnboarding} onOpenChange={(o) => !o && setNeedsOnboarding(false)}>
      <DialogContent className="glass-strong border-white/15 sm:max-w-lg overflow-hidden" data-testid="profile-onboarding">
        <DialogTitle className="sr-only">Set up your Treesh profile</DialogTitle>
        <DialogDescription className="sr-only">Choose a nickname, birthday and profile picture.</DialogDescription>
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full" style={{ background: "radial-gradient(circle, var(--treesh-purple-soft), transparent 70%)" }} />
        <div className="relative py-2">
          <div className="mb-6 text-center">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-[color:var(--treesh-gold)]">Treesh</p>
            <AnimatePresence mode="wait">
              <motion.h2 key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-2 text-2xl font-bold">{steps[step].title}</motion.h2>
            </AnimatePresence>
            {steps[step].sub && <p className="mt-1 text-sm text-white/55">{steps[step].sub}</p>}
          </div>

          <div className="min-h-[140px]">
            {step === 0 && (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <Sparkles size={44} className="text-[color:var(--treesh-purple)]" />
                <p className="max-w-sm text-sm text-white/70">Stream the underground. Build playlists. Vibe with the Icons. Let’s set up your local profile — no signup needed.</p>
              </div>
            )}
            {step === 1 && (
              <div className="px-2">
                <Input autoFocus value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="e.g. NightOwl" data-testid="profile-nickname-input" className="h-12 bg-white/5 border-white/15 text-center text-lg" onKeyDown={(e) => e.key === "Enter" && canNext && setStep(2)} />
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col items-center gap-3 px-2">
                <Input type="date" value={birthday} max={new Date().toISOString().split("T")[0]} onChange={(e) => setBirthday(e.target.value)} data-testid="profile-birthday-input" className="h-12 bg-white/5 border-white/15 text-center" />
                {zodiac && <span className="rounded-full border border-[color:var(--treesh-gold)]/40 bg-[color:var(--treesh-gold)]/10 px-4 py-1 text-sm text-[color:var(--treesh-gold)]">{zodiac}</span>}
              </div>
            )}
            {step === 3 && (
              <div className="flex flex-col items-center gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-full border border-white/15">
                  {avatar ? <CoverArt src={avatar} alt="avatar" className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center bg-white/5 text-white/40">?</div>}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {PRESET_AVATARS.map((a) => (
                    <button key={a} onClick={() => setAvatar(a)} className={`h-12 w-12 overflow-hidden rounded-full border-2 transition-colors ${avatar === a ? "border-[color:var(--treesh-purple)]" : "border-white/10"}`}>
                      <CoverArt src={a} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  <label className="grid h-12 w-12 cursor-pointer place-items-center rounded-full border border-dashed border-white/20 text-white/60 hover:bg-white/5">
                    <Upload size={16} />
                    <input type="file" accept="image/*" className="hidden" onChange={onFile} data-testid="profile-avatar-upload-input" />
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button onClick={() => setNeedsOnboarding(false)} className="text-xs text-white/40 hover:text-white/70 transition-colors">Skip for now</button>
            {step < 3 ? (
              <Button disabled={!canNext} onClick={() => setStep(step + 1)} data-testid="profile-next-button" className="gap-2 bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90">
                Next <ArrowRight size={16} />
              </Button>
            ) : (
              <Button onClick={finish} data-testid="profile-save-button" className="gap-2 bg-[color:var(--treesh-purple)] hover:bg-[color:var(--treesh-purple)]/90">
                <Check size={16} /> Start listening
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
