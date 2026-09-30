import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, CameraOff, FileVideo, Info, Loader2, RefreshCw, ShieldCheck, SwitchCamera, Target, Trash2, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { Btn } from "@/components/PinkButton";
import { speak } from "@/context/TimerContext";
import { CHECK_META, CONNECTIONS, SIDE, createDetector, frameMetrics, scoreShot } from "@/lib/formAnalysis";
import { bumpStats, getSettings, KEYS, LS, useStored } from "@/lib/storage";

const VER = "1.0.1";
const MODELS = {
  fast: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
  precise: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
};
const COLOR = { good: "#2EE59D", ok: "#FFCC66", bad: "#FF5A5A", idle: "#F5F6F8" };
const PHASE_LABEL = { ready: "Ready \u00b7 bring the ball up", set: "Set point", follow: "Release \u00b7 hold it", none: "Step into frame" };

let landmarkerCache = {};
async function getLandmarker(kind) {
  if (landmarkerCache[kind]) return landmarkerCache[kind];
  const { FilesetResolver, PoseLandmarker } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(`https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VER}/wasm`);
  const make = (delegate) => PoseLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: MODELS[kind], delegate }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
  let lm;
  try { lm = await make("GPU"); } catch (e) { lm = await make("CPU"); }
  landmarkerCache[kind] = lm;
  return lm;
}

function ScoreRing({ score, size = 96 }) {
  const r = 42, c = 2 * Math.PI * r;
  const col = score >= 85 ? COLOR.good : score >= 60 ? COLOR.ok : COLOR.bad;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90"><circle cx="50" cy="50" r={r} fill="none" stroke="#22243a" strokeWidth="7" /><circle cx="50" cy="50" r={r} fill="none" stroke={col} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} /></svg>
      <span className="font-num text-3xl font-black" style={{ color: col }}>{score}</span>
    </div>
  );
}

export function ReportCard({ report, index }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="hp-card p-4" data-testid="form-report-card">
      <div className="flex items-center gap-4">
        <ScoreRing score={report.score} />
        <div className="min-w-0">
          <div className="hp-eyebrow">Shot {index}</div>
          <div className="font-display mt-1 text-lg leading-tight">{report.score >= 85 ? "Pure." : report.score >= 60 ? "Close. Clean it up." : "Rebuild this one."}</div>
          <p className="mt-1 text-[13px] text-[#B7BBCB]" data-testid="form-report-tip">{report.topTip}</p>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {CHECK_META.map(([k, label]) => {
          const c = report.checks[k];
          return (
            <div key={k} className="flex items-start gap-3 rounded-xl border border-[#1f2130] bg-[#0f1015] px-3 py-2.5" data-testid={`form-check-${k}`}>
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLOR[c.status] }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2"><span className="text-[13px] font-extrabold">{label}</span><span className="font-num text-[11px] font-bold text-[#8B90A6]">{c.value}</span></div>
                <div className="text-[12.5px] font-bold" style={{ color: COLOR[c.status] }}>{c.label}</div>
                {c.status !== "good" && <div className="mt-0.5 text-[12px] text-[#9DA2B6]">{c.tip}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function FormCheck() {
  const settings = getSettings();
  const [hand, setHand] = useState(settings.hand);
  const [facing, setFacing] = useState("environment");
  const [model, setModel] = useState("fast");
  const [voice, setVoice] = useState(settings.voice);
  const [status, setStatus] = useState("idle"); // idle | loading | live | error
  const [error, setError] = useState("");
  const [source, setSource] = useState(null); // 'camera' | 'file'
  const [phase, setPhase] = useState("none");
  const [live, setLive] = useState(null);
  const [fps, setFps] = useState(0);
  const [reports, setReports] = useState([]);
  const [history, setHistory] = useStored(KEYS.shots, []);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const lmRef = useRef(null);
  const detRef = useRef(null);
  const lastRep = useRef(null);
  const fileRef = useRef(null);
  const handRef = useRef(hand);
  handRef.current = hand;
  const voiceRef = useRef(voice);
  voiceRef.current = voice;

  const onShot = useCallback((shot) => {
    const rep = { ...scoreShot(shot), at: new Date().toISOString(), hand: handRef.current };
    lastRep.current = rep;
    setReports((r) => [rep, ...r].slice(0, 30));
    setHistory((h) => [{ score: rep.score, at: rep.at, checks: Object.fromEntries(Object.entries(rep.checks).map(([k, v]) => [k, v.status])) }, ...h].slice(0, 100));
    bumpStats((s) => { s.shots += 1; s.bestShot = Math.max(s.bestShot || 0, rep.score); return s; });
    if (voiceRef.current) {
      const prev = LS.get(KEYS.settings, {});
      LS.set(KEYS.settings, { ...prev, voice: true });
      speak(rep.score >= 85 ? `${rep.score}. Pure.` : `${rep.score}. ${rep.topTip}`);
    }
  }, [setHistory]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    const v = videoRef.current;
    if (v) { v.pause(); if (v.src && v.src.startsWith("blob:")) URL.revokeObjectURL(v.src); v.removeAttribute("src"); v.srcObject = null; }
    setStatus("idle");
    setSource(null);
    setPhase("none");
    setLive(null);
  }, []);
  useEffect(() => () => stop(), [stop]);

  const loop = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current, lm = lmRef.current;
    if (!v || !c || !lm) return;
    let frames = 0, t0 = performance.now(), lastT = -1;
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      if (v.readyState < 2 || v.paused) return;
      const now = performance.now();
      if (v.currentTime === lastT) return;
      lastT = v.currentTime;
      const W = v.videoWidth, H = v.videoHeight;
      if (c.width !== W) { c.width = W; c.height = H; }
      let res;
      try { res = lm.detectForVideo(v, now); } catch (e) { return; }
      const ctx = c.getContext("2d");
      ctx.clearRect(0, 0, W, H);
      const pts = res.landmarks?.[0];
      frames++;
      if (now - t0 > 1000) { setFps(Math.round((frames * 1000) / (now - t0))); frames = 0; t0 = now; }
      if (!pts) { setPhase("none"); setLive(null); return; }
      const m = frameMetrics(pts, handRef.current, W, H);
      const s = SIDE[handRef.current];
      const shootIdx = new Set([s.sh, s.el, s.wr, s.hip, s.kn, s.an, s.idx]);
      const rep = lastRep.current;
      const statusFor = (a, b) => {
        if (!rep) return COLOR.idle;
        if ((a === s.sh && b === s.el) || (a === s.el && b === s.wr) || (a === s.wr && b === s.idx)) return COLOR[rep.checks.release.status === "bad" || rep.checks.elbow.status === "bad" ? "bad" : rep.checks.elbow.status];
        if ((a === s.hip && b === s.kn) || (a === s.kn && b === s.an)) return COLOR[rep.checks.knee.status];
        if (a === s.sh || b === s.hip) return COLOR[rep.checks.balance.status];
        return COLOR.idle;
      };
      const lw = Math.max(3, W / 180);
      CONNECTIONS.forEach(([a, b]) => {
        const pa = pts[a], pb = pts[b];
        if ((pa.visibility ?? 1) < 0.35 || (pb.visibility ?? 1) < 0.35) return;
        const main = shootIdx.has(a) && shootIdx.has(b);
        ctx.strokeStyle = main ? statusFor(a, b) : "rgba(245,246,248,.45)";
        ctx.lineWidth = main ? lw * 1.6 : lw;
        ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(pa.x * W, pa.y * H); ctx.lineTo(pb.x * W, pb.y * H); ctx.stroke();
      });
      pts.forEach((p, i) => {
        if (i < 11 && i !== 0) return;
        if ((p.visibility ?? 1) < 0.35) return;
        ctx.fillStyle = shootIdx.has(i) ? "#FF3EA5" : "#F5F6F8";
        ctx.beginPath(); ctx.arc(p.x * W, p.y * H, shootIdx.has(i) ? lw * 1.5 : lw, 0, Math.PI * 2); ctx.fill();
      });
      if (m.vis < 0.45) { setPhase("none"); setLive(m); return; }
      const ph = detRef.current.push(m, now);
      setPhase(ph);
      setLive(m);
    };
    tick();
  }, []);

  const boot = async (kind, setup) => {
    setStatus("loading");
    setError("");
    try {
      lmRef.current = await getLandmarker(model);
      detRef.current = createDetector(onShot);
      await setup();
      setSource(kind);
      setStatus("live");
      loop();
    } catch (e) {
      console.error(e);
      setStatus("error");
      setError(e?.name === "NotAllowedError" ? "Camera permission was blocked. Allow camera access in your browser settings and try again." : e?.name === "NotFoundError" ? "No camera found on this device. Try uploading a clip instead." : "Couldn't start form check. Check your connection (the pose model downloads once) and try again.");
    }
  };

  const startCamera = (face = facing) => boot("camera", async () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    streamRef.current = stream;
    const v = videoRef.current;
    v.srcObject = stream;
    v.muted = true;
    v.playsInline = true;
    await v.play();
  });

  const startFile = (file) => boot("file", async () => {
    const v = videoRef.current;
    v.srcObject = null;
    v.src = URL.createObjectURL(file);
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    await v.play();
  });

  const flip = () => {
    const f = facing === "user" ? "environment" : "user";
    setFacing(f);
    if (source === "camera") { cancelAnimationFrame(rafRef.current); startCamera(f); }
  };

  const mirrored = source === "camera" && facing === "user";
  const avg = history.length ? Math.round(history.slice(0, 20).reduce((a, b) => a + b.score, 0) / Math.min(20, history.length)) : null;

  return (
    <div data-testid="form-check-page">
      <PageHeader eyebrow="New \u00b7 On-device AI" title="Form Check" sub="Live pose tracking scores every shot on elbow alignment, knee bend, release, follow-through and balance. Nothing leaves your phone." testid="form-title" />

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="relative overflow-hidden rounded-[22px] border border-[#222433] bg-[#08080b]" style={{ aspectRatio: "16 / 10" }}>
            <video ref={videoRef} data-testid="form-camera-video" className="absolute inset-0 h-full w-full object-contain" style={{ transform: mirrored ? "scaleX(-1)" : "none" }} playsInline muted />
            <canvas ref={canvasRef} data-testid="form-skeleton-canvas" className="pointer-events-none absolute inset-0 h-full w-full object-contain" style={{ transform: mirrored ? "scaleX(-1)" : "none" }} />
            {status !== "live" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center" style={{ background: "radial-gradient(420px 220px at 50% 40%, rgba(255,62,165,.14), transparent 70%)" }}>
                {status === "loading" ? (
                  <>
                    <Loader2 size={30} className="hp-spin text-[#FF3EA5]" />
                    <div className="mt-3 text-sm font-bold">Loading pose model\u2026</div>
                    <div className="mt-1 text-xs text-[#8B90A6]">First load downloads ~5\u201310 MB, then it's cached.</div>
                  </>
                ) : (
                  <>
                    <span className="grid h-16 w-16 place-items-center rounded-2xl border border-[#25273a] bg-[#121319]"><Target size={28} className="text-[#FF3EA5]" /></span>
                    <div className="font-display mt-4 text-2xl">Shoot a perfect form</div>
                    <p className="mt-1.5 max-w-md text-sm text-[#B7BBCB]">Prop your phone 8\u201312 ft away, side-on to your shooting hand, full body in frame. Then shoot at game speed.</p>
                    {error && <p className="mt-3 max-w-md text-sm font-semibold text-[#FF7A7A]" data-testid="form-error">{error}</p>}
                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      <Btn onClick={() => startCamera()} data-testid="form-camera-start-button"><Camera size={16} /> Start camera</Btn>
                      <Btn variant="secondary" onClick={() => fileRef.current?.click()} data-testid="form-upload-button"><FileVideo size={16} /> Analyze a clip</Btn>
                      <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) startFile(f); }} data-testid="form-upload-input" />
                    </div>
                  </>
                )}
              </div>
            )}
            {status === "live" && (
              <>
                <div className="absolute left-3 top-3 flex items-center gap-2">
                  <span className="inline-flex h-8 items-center gap-2 rounded-full border border-[#2a2c40] bg-[#0A0A0D]/85 px-3 text-[12px] font-bold" data-testid="form-phase-pill">
                    <span className="h-2 w-2 rounded-full" style={{ background: phase === "none" ? COLOR.bad : phase === "ready" ? COLOR.good : "#FF3EA5" }} />
                    {PHASE_LABEL[phase]}
                  </span>
                  <span className="hidden h-8 items-center rounded-full border border-[#2a2c40] bg-[#0A0A0D]/85 px-3 font-num text-[12px] font-bold text-[#B7BBCB] sm:inline-flex">{fps} fps</span>
                </div>
                <div className="absolute right-3 top-3 flex gap-2">
                  {source === "camera" && <button onClick={flip} className="press grid h-10 w-10 place-items-center rounded-full border border-[#2a2c40] bg-[#0A0A0D]/85" aria-label="Flip camera" data-testid="form-flip-button"><SwitchCamera size={17} /></button>}
                  <button onClick={() => setVoice((v) => !v)} className="press grid h-10 w-10 place-items-center rounded-full border border-[#2a2c40] bg-[#0A0A0D]/85" aria-label="Toggle voice" data-testid="form-voice-toggle">{voice ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
                  <button onClick={stop} className="press grid h-10 w-10 place-items-center rounded-full border border-[#2a2c40] bg-[#0A0A0D]/85" aria-label="Stop" data-testid="form-stop-button"><CameraOff size={17} /></button>
                </div>
                {live && (
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      {[["Elbow", live.elbow], ["Knee", live.knee], ["Arm", live.armElev]].map(([l, v]) => (
                        <span key={l} className="rounded-xl border border-[#2a2c40] bg-[#0A0A0D]/85 px-2.5 py-1.5 text-center"><span className="block text-[9.5px] font-extrabold uppercase tracking-wider text-[#8B90A6]">{l}</span><span className="font-num text-[15px] font-black">{Math.round(v)}\u00b0</span></span>
                      ))}
                    </div>
                    {phase === "set" && live.knee > 165 && live.ankleVis > 0.4 && <span className="rounded-full bg-[#FFCC66] px-3 py-1.5 text-[12px] font-extrabold text-[#0A0A0D]">Bend your knees</span>}
                    {phase === "set" && (live.frontView ? live.flare > 0.32 : live.forearmTilt > 28) && <span className="rounded-full bg-[#FF5A5A] px-3 py-1.5 text-[12px] font-extrabold text-[#0A0A0D]">Elbow under the ball</span>}
                    {phase === "none" && <span className="rounded-full bg-[#0A0A0D]/85 px-3 py-1.5 text-[12px] font-bold text-[#F5F6F8]">Step back: full body in frame</span>}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="hp-card p-3">
              <div className="hp-eyebrow mb-2">Shooting hand</div>
              <div className="flex gap-2">{["right", "left"].map((h) => <button key={h} className="hp-chip !h-8 flex-1 justify-center capitalize" data-active={hand === h} onClick={() => { setHand(h); LS.set(KEYS.settings, { ...LS.get(KEYS.settings, {}), hand: h }); detRef.current?.reset(); }} data-testid={`form-hand-${h}`}>{h}</button>)}</div>
            </div>
            <div className="hp-card p-3">
              <div className="hp-eyebrow mb-2">Camera</div>
              <div className="flex gap-2">{[["environment", "Back"], ["user", "Selfie"]].map(([f, l]) => <button key={f} className="hp-chip !h-8 flex-1 justify-center" data-active={facing === f} onClick={() => { setFacing(f); if (source === "camera") { cancelAnimationFrame(rafRef.current); startCamera(f); } }} data-testid={`form-facing-${f}`}>{l}</button>)}</div>
            </div>
            <div className="hp-card p-3">
              <div className="hp-eyebrow mb-2">Tracking</div>
              <div className="flex gap-2">{[["fast", "Fast"], ["precise", "Precise"]].map(([k, l]) => <button key={k} disabled={status === "live"} className="hp-chip !h-8 flex-1 justify-center disabled:opacity-50" data-active={model === k} onClick={() => setModel(k)} data-testid={`form-model-${k}`}>{l}</button>)}</div>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-[#1f2130] bg-[#0f1015] p-3.5 text-[12.5px] text-[#B7BBCB]">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#2EE59D]" />
            <span>Private by design: pose tracking runs entirely in your browser. Video is never uploaded or saved. Only your shot scores are kept on this device.</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="hp-card grid grid-cols-3 p-4 text-center">
            <div><div className="hp-eyebrow">Session</div><div className="font-num text-3xl font-black" data-testid="form-session-shots">{reports.length}</div></div>
            <div><div className="hp-eyebrow">Avg (20)</div><div className="font-num text-3xl font-black text-[#FF3EA5]">{avg ?? "\u2013"}</div></div>
            <div><div className="hp-eyebrow">All-time</div><div className="font-num text-3xl font-black">{history.length}</div></div>
          </div>
          <AnimatePresence mode="popLayout">
            {reports[0] ? (
              <ReportCard key={reports[0].at} report={reports[0]} index={reports.length} />
            ) : (
              <div className="hp-card p-5">
                <div className="flex items-center gap-2 text-sm font-extrabold"><Info size={15} className="text-[#FF3EA5]" /> How it works</div>
                <ol className="mt-3 space-y-2.5 text-[13px] text-[#B7BBCB]">
                  <li><span className="font-bold text-[#F5F6F8]">1. Set point.</span> Bring the ball up above your shoulder; we check your elbow is stacked under it.</li>
                  <li><span className="font-bold text-[#F5F6F8]">2. Dip.</span> We measure your knee bend in the second before release.</li>
                  <li><span className="font-bold text-[#F5F6F8]">3. Release.</span> Arm extension and release angle (arc).</li>
                  <li><span className="font-bold text-[#F5F6F8]">4. Finish.</span> How long you hold the follow-through and if your wrist snaps.</li>
                  <li><span className="font-bold text-[#F5F6F8]">5. Balance.</span> Lean and drift from takeoff to landing.</li>
                </ol>
                <p className="mt-3 text-[12px] text-[#8B90A6]">Every detected shot gets a 0\u2013100 score with the #1 fix, spoken out loud if voice is on.</p>
              </div>
            )}
          </AnimatePresence>
          {history.length > 0 && (
            <div className="hp-card p-4">
              <div className="mb-3 flex items-center justify-between"><div className="hp-eyebrow">Recent shots</div><button onClick={() => { setHistory([]); setReports([]); toast("Shot history cleared"); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8B90A6] hover:text-[#FF7A7A]" data-testid="form-clear-history"><Trash2 size={11} /> Clear</button></div>
              <div className="flex h-20 items-end gap-1" data-testid="form-history-chart">
                {history.slice(0, 30).reverse().map((h, i) => <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(6, h.score)}%`, background: h.score >= 85 ? COLOR.good : h.score >= 60 ? COLOR.ok : COLOR.bad, opacity: 0.85 }} title={`${h.score}`} />)}
              </div>
              {reports.length > 1 && <Btn variant="ghost" size="sm" className="mt-2" onClick={() => setReports((r) => r.slice(0, 1))}><RefreshCw size={13} /> Keep latest only</Btn>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
