import { useState } from "react";
import { toast } from "sonner";
import { Cloud, CloudCheck, Link2, Loader2, LogOut, RefreshCw } from "lucide-react";
import { useGame } from "@/lib/store";
import { sb } from "@/lib/treesh";

const STATUS = {
  pulled: "Synced with your Treesh account",
  none: "Synced with your Treesh account",
  pushed: "Synced with your Treesh account",
  "no-backup": "No cloud backup yet. Open Treesh, sign in and let it sync once.",
  skip: "Your Treesh app handles syncing here",
  error: "Couldn't reach Treesh accounts. Try Sync now.",
};
const inputCls = "w-full rounded-2xl bg-[var(--eb-bg)] border border-[var(--eb-border)] px-4 py-3 outline-none focus:border-[var(--eb-gold)]";

const SignInForm = () => {
  const { signIn } = useGame();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true);
    try { const r = await signIn(email.trim(), pw); toast.success("Signed in to Treesh", { description: STATUS[r] || "" }); }
    catch (err) { toast.error(/Invalid login/i.test(err.message) ? "That email and password don't match." : /not confirmed/i.test(err.message) ? "Confirm your email first." : "Couldn't sign in. Try again."); }
    finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 mt-4" data-testid="treesh-signin-form">
      <input data-testid="treesh-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Treesh email" className={inputCls} />
      <input data-testid="treesh-password-input" type="password" required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" className={inputCls} />
      <button data-testid="treesh-signin-btn" disabled={busy} className="lift px-6 py-3 rounded-2xl bg-[var(--eb-gold)] text-[var(--eb-on-gold)] font-extrabold uppercase flex items-center justify-center gap-2 disabled:opacity-50">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}Sign in
      </button>
    </form>
  );
};

export const TreeshAccount = () => {
  const { session, cloud, bridge, signOut, syncNow } = useGame();
  const [busy, setBusy] = useState(false);
  const sync = async () => { setBusy(true); try { await syncNow(); toast.success("Starlites synced"); } catch { toast.error("Sync failed"); } finally { setBusy(false); } };
  const linked = bridge === "parent" || bridge === "message";
  return (
    <div data-testid="treesh-account-card" className="glass rounded-3xl p-5 mt-4">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl grid place-items-center bg-[var(--eb-surface2)] text-[var(--eb-gold)]">{linked ? <Link2 className="w-5 h-5" /> : session ? <CloudCheck className="w-5 h-5" /> : <Cloud className="w-5 h-5" />}</div>
        <div className="flex-1 min-w-0">
          <div className="font-bold">Treesh account</div>
          <div data-testid="treesh-sync-status" className="text-xs text-slate-400 truncate">
            {bridge === "parent" ? "Connected to the Treesh app. Starlites update live." : bridge === "message" ? "Connected through the Treesh app." : session ? `${session.user.email} · ${STATUS[cloud] || "Signed in"}` : "Sign in with your Treesh email & password to sync Starlites on any link or device."}
          </div>
        </div>
        {session && (
          <div className="flex gap-2">
            <button data-testid="treesh-sync-now-btn" onClick={sync} disabled={busy} className="lift p-2.5 rounded-full border border-[var(--eb-border)]" aria-label="Sync now"><RefreshCw className={`w-4 h-4 ${busy ? "animate-spin" : ""}`} /></button>
            <button data-testid="treesh-signout-btn" onClick={signOut} className="lift p-2.5 rounded-full border border-[var(--eb-border)]" aria-label="Sign out"><LogOut className="w-4 h-4" /></button>
          </div>
        )}
      </div>
      {!session && !linked && sb && <SignInForm />}
    </div>
  );
};
