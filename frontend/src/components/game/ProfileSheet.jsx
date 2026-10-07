import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useGame, zodiac } from "@/lib/store";
import { Avatar } from "@/components/game/Avatar";

const UNAME = /^[a-z0-9_.]{3,20}$/;

const resize = (file) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => {
    const s = 256, c = document.createElement("canvas");
    c.width = c.height = s;
    const m = Math.min(img.width, img.height);
    c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
    res(c.toDataURL("image/webp", 0.85));
  };
  img.onerror = rej;
  img.src = URL.createObjectURL(file);
});

const Field = ({ label, children }) => (
  <label className="block"><span className="block text-[10px] uppercase tracking-[0.25em] text-slate-400 mb-1.5">{label}</span>{children}</label>
);
const inputCls = "w-full rounded-2xl bg-[var(--eb-bg)] border border-[var(--eb-border)] px-4 py-3 outline-none focus:border-[var(--eb-gold)]";

export const ProfileSheet = ({ open, onOpenChange, onboarding }) => {
  const { profile, saveProfile } = useGame();
  const [f, setF] = useState({ nickname: "", username: "", birthday: "", avatar: "" });
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    if (!open) return;
    setF({ nickname: profile?.nickname || "", username: profile?.username || "", birthday: profile?.birthday || "", avatar: profile?.avatar || "" });
    import("@/data/avatars").then((m) => setPresets(m.OB_AVATARS));
  }, [open, profile]);

  const upd = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const upload = async (e) => {
    const file = e.target.files[0]; e.target.value = "";
    if (!file) return;
    try { const d = await resize(file); setF((p) => ({ ...p, avatar: d })); } catch { toast.error("Couldn't read that image"); }
  };
  const save = () => {
    const username = f.username.trim().replace(/^@+/, "").toLowerCase();
    if (username && !UNAME.test(username)) return toast.error("Check your username", { description: "3–20 letters, numbers, _ or ." });
    saveProfile({ nickname: f.nickname.trim() || "Treesh Fan", username: username || undefined, birthday: f.birthday, avatar: f.avatar });
    toast.success(onboarding ? "Welcome to Ebonics" : "Profile saved", { description: "Synced with your Treesh profile." });
    onOpenChange(false);
  };
  const skip = () => { saveProfile({ nickname: "Treesh Fan" }); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={(v) => (onboarding && !v ? skip() : onOpenChange(v))}>
      <DialogContent data-testid="profile-sheet" className="bg-[var(--eb-surface)] border-[var(--eb-border)] text-white rounded-3xl max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[var(--eb-gold)]">Treesh profile</div>
          <DialogTitle className="font-display text-4xl font-normal">{onboarding ? "WHO'S PLAYING?" : "EDIT PROFILE"}</DialogTitle>
          <DialogDescription className="text-slate-400">One profile across every Treesh game. It shows on the leaderboard.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <Avatar profile={{ ...f, nickname: f.nickname || "T" }} className="w-20 h-20 text-2xl" />
          <label data-testid="profile-avatar-upload" className="lift cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--eb-border)] text-sm font-bold">
            <Upload className="w-4 h-4" />Upload photo<input type="file" accept="image/*" className="hidden" onChange={upload} />
          </label>
        </div>
        <div className="grid grid-cols-8 gap-2">
          {presets.map((a, i) => (
            <button key={i} data-testid={`profile-avatar-preset-${i}`} onClick={() => setF((p) => ({ ...p, avatar: a }))}
              className={`aspect-square rounded-full overflow-hidden border-2 transition-transform duration-200 ${f.avatar === a ? "border-[var(--eb-gold)] scale-110" : "border-transparent hover:scale-105"}`}>
              <img src={a} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
        <Field label="Nickname"><input data-testid="profile-nickname-input" value={f.nickname} onChange={upd("nickname")} maxLength={30} placeholder="Treesh Fan" className={inputCls} /></Field>
        <Field label="Username (leaderboard)">
          <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">@</span>
            <input data-testid="profile-username-input" value={f.username} onChange={upd("username")} maxLength={20} autoCapitalize="none" placeholder="yourname" className={`${inputCls} pl-8`} /></div>
        </Field>
        <Field label={`Birthday${f.birthday && zodiac(f.birthday) ? ` · ${zodiac(f.birthday)}` : ""}`}>
          <input data-testid="profile-birthday-input" type="date" value={f.birthday} onChange={upd("birthday")} className={`${inputCls} [color-scheme:dark]`} />
        </Field>
        <div className="flex gap-3 pt-1">
          <button data-testid="profile-save-btn" onClick={save} className="lift flex-1 py-3 rounded-full bg-[var(--eb-gold)] text-[#0B0914] font-extrabold uppercase tracking-wider">{onboarding ? "Let's play" : "Save"}</button>
          {onboarding && <button data-testid="profile-skip-btn" onClick={skip} className="px-5 py-3 rounded-full border border-[var(--eb-border)] font-bold">Skip</button>}
        </div>
      </DialogContent>
    </Dialog>
  );
};
