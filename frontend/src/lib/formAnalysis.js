// On-device shooting form analysis on top of MediaPipe PoseLandmarker landmarks.
export const SIDE = {
  right: { sh: 12, el: 14, wr: 16, hip: 24, kn: 26, an: 28, idx: 20, osh: 11, ohip: 23 },
  left: { sh: 11, el: 13, wr: 15, hip: 23, kn: 25, an: 27, idx: 19, osh: 12, ohip: 24 },
};
export const CONNECTIONS = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28], [15, 19], [16, 20], [27, 31], [28, 32]];

const P = (lm, i, W, H) => ({ x: lm[i].x * W, y: lm[i].y * H, v: lm[i].visibility ?? 1 });
function ang(a, b, c) {
  const v1 = [a.x - b.x, a.y - b.y], v2 = [c.x - b.x, c.y - b.y];
  const d = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1);
  return (Math.acos(Math.max(-1, Math.min(1, d))) * 180) / Math.PI;
}

export function frameMetrics(lm, hand, W, H) {
  const s = SIDE[hand];
  const g = (i) => P(lm, i, W, H);
  const sh = g(s.sh), el = g(s.el), wr = g(s.wr), hip = g(s.hip), kn = g(s.kn), an = g(s.an), idx = g(s.idx), osh = g(s.osh), ohip = g(s.ohip), nose = g(0);
  const vis = Math.min(sh.v, el.v, wr.v, hip.v, kn.v);
  const shoulderW = Math.hypot(sh.x - osh.x, sh.y - osh.y);
  const shMid = { x: (sh.x + osh.x) / 2, y: (sh.y + osh.y) / 2 };
  const hipMid = { x: (hip.x + ohip.x) / 2, y: (hip.y + ohip.y) / 2 };
  const torso = Math.hypot(shMid.x - hipMid.x, shMid.y - hipMid.y) || 1;
  return {
    vis,
    ankleVis: an.v,
    elbow: ang(sh, el, wr),
    knee: ang(hip, kn, an),
    armElev: (Math.atan2(sh.y - wr.y, Math.abs(wr.x - sh.x)) * 180) / Math.PI,
    forearmTilt: (Math.atan2(Math.abs(wr.x - el.x), el.y - wr.y) * 180) / Math.PI, // 0 = forearm vertical
    flare: Math.abs(el.x - wr.x) / (shoulderW || 1),
    lean: (Math.atan2(Math.abs(shMid.x - hipMid.x), hipMid.y - shMid.y) * 180) / Math.PI,
    hipX: hipMid.x / torso,
    wristAboveHead: wr.y < nose.y,
    wristAboveShoulder: wr.y < sh.y,
    gooseneck: idx.v > 0.3 && idx.y > wr.y + torso * 0.02,
    frontView: shoulderW / torso > 0.42,
  };
}

const grade = (status, value, label, tip) => ({ status, value, label, tip });
const worst = (a, b) => (["bad", "ok", "good"].indexOf(a.status) <= ["bad", "ok", "good"].indexOf(b.status) ? a : b);

export function scoreShot(shot) {
  const checks = {};
  // 1. Elbow alignment
  if (shot.front) {
    const f = shot.setFlare;
    checks.elbow = f < 0.2 ? grade("good", `${Math.round(f * 100)}% flare`, "Elbow in", "Elbow is stacked under the ball.") : f < 0.32 ? grade("ok", `${Math.round(f * 100)}% flare`, "Slight flare", "Tuck your elbow a touch toward your hip line.") : grade("bad", `${Math.round(f * 100)}% flare`, "Chicken wing", "Elbow is flaring out. Point it at the rim, under the ball.");
  } else {
    const t = shot.setTilt;
    checks.elbow = t < 16 ? grade("good", `${Math.round(t)}° off`, "Under the ball", "Forearm is vertical at your set point.") : t < 28 ? grade("ok", `${Math.round(t)}° off`, "Slightly off", "Get your elbow more directly under the ball at the set point.") : grade("bad", `${Math.round(t)}° off`, "Elbow out of line", "Your forearm is tilted. Stack wrist over elbow before you shoot.");
  }
  // 2. Knee bend
  const k = shot.minKnee;
  checks.knee = k == null ? grade("ok", "n/a", "Legs not visible", "Step back so your full body is in frame.") : k >= 105 && k <= 152 ? grade("good", `${Math.round(k)}°`, "Loaded", "Good dip. Power is coming from your legs.") : k > 152 && k <= 165 ? grade("ok", `${Math.round(k)}°`, "Shallow dip", "Bend your knees a little more to get your legs into the shot.") : k > 165 ? grade("bad", `${Math.round(k)}°`, "No legs", "You're shooting with straight legs. Dip and drive up through the floor.") : grade("ok", `${Math.round(k)}°`, "Too deep", "You're sinking too low. A quick, athletic dip is enough.");
  // 3. Release
  const e = shot.relElbow, a = shot.relElev;
  const ext = e >= 158 ? grade("good", `${Math.round(e)}°`, "Full extension", "Arm fully extended at release.") : e >= 142 ? grade("ok", `${Math.round(e)}°`, "Short arm", "Reach higher. Finish with your arm fully extended.") : grade("bad", `${Math.round(e)}°`, "Pushing it", "You're pushing the ball. Extend up and out toward the rim.");
  const elev = a >= 52 && a <= 82 ? grade("good", `${Math.round(a)}° arc`, "Good arc", "Release angle gives the ball a soft arc.") : a > 82 ? grade("ok", `${Math.round(a)}° arc`, "Straight up", "Release slightly more toward the rim, not straight up.") : a >= 42 ? grade("ok", `${Math.round(a)}° arc`, "Flat-ish", "Get more arc: release higher and finish up.") : grade("bad", `${Math.round(a)}° arc`, "Flat shot", "Your shot is flat. Aim to release at 55–70°.");
  checks.release = { ...worst(ext, elev), value: `${Math.round(e)}° · ${Math.round(a)}°` };
  // 4. Follow-through
  const hold = shot.holdMs;
  checks.follow = hold >= 350 && shot.goose ? grade("good", `${(hold / 1000).toFixed(1)}s`, "Held it", "Great finish: wrist snapped and held.") : hold >= 220 ? grade("ok", `${(hold / 1000).toFixed(1)}s`, shot.goose ? "Short hold" : "No snap", shot.goose ? "Hold your follow-through until the ball hits the rim." : "Snap your wrist down: fingers into the rim.") : grade("bad", `${(hold / 1000).toFixed(1)}s`, "Dropped early", "You pulled your hand down. Reach into the cookie jar and hold it.");
  // 5. Balance
  const lean = shot.relLean, drift = shot.drift;
  const bl = lean < 10 ? grade("good", `${Math.round(lean)}° lean`, "Balanced", "Shoulders stacked over hips.") : lean < 18 ? grade("ok", `${Math.round(lean)}° lean`, "Leaning", "Stay taller through the shot; avoid leaning.") : grade("bad", `${Math.round(lean)}° lean`, "Off balance", "You're leaning hard. Go straight up and land in the same spot.");
  const dr = drift == null ? bl : drift < 0.22 ? grade("good", "", "Stable", "") : drift < 0.4 ? grade("ok", "", "Drifting", "You're drifting. Land where you took off.") : grade("bad", "", "Big drift", "You're jumping forward/sideways. Go straight up and down.");
  checks.balance = { ...worst(bl, dr), value: `${Math.round(lean)}° lean` };
  const pts = { good: 20, ok: 12, bad: 4 };
  const score = Object.values(checks).reduce((s, c) => s + pts[c.status], 0);
  const order = ["release", "elbow", "knee", "follow", "balance"];
  const top = order.map((k2) => checks[k2]).find((c) => c.status === "bad") || order.map((k2) => checks[k2]).find((c) => c.status === "ok");
  return { score, checks, topTip: top ? top.tip : "Textbook. Groove that exact motion." };
}

export const CHECK_META = [
  ["elbow", "Elbow alignment"],
  ["knee", "Knee bend"],
  ["release", "Release"],
  ["follow", "Follow-through"],
  ["balance", "Balance"],
];

/* Stateful shot detector fed with per-frame metrics */
export function createDetector(onShot) {
  let phase = "ready";
  let buf = [];
  let setData = null;
  let rel = null;
  let cooldown = 0;
  return {
    get phase() { return phase; },
    reset() { phase = "ready"; buf = []; setData = null; rel = null; },
    push(m, t) {
      buf.push({ ...m, t });
      buf = buf.filter((f) => t - f.t < 2000);
      if (t < cooldown) return phase;
      if (phase === "ready") {
        if (m.wristAboveShoulder && m.elbow < 125) {
          phase = "set";
          setData = { tilt: m.forearmTilt, flare: m.flare, minElbow: m.elbow, t };
        }
      } else if (phase === "set") {
        if (m.elbow < setData.minElbow) setData = { tilt: m.forearmTilt, flare: m.flare, minElbow: m.elbow, t };
        if (!m.wristAboveShoulder && t - setData.t > 300) { phase = "ready"; setData = null; }
        else if (m.elbow > 148 && m.wristAboveHead) {
          const pre = buf.filter((f) => f.t >= t - 1500 && f.ankleVis > 0.4);
          const minKnee = pre.length ? Math.min(...pre.map((f) => f.knee)) : null;
          rel = { t, relElbow: m.elbow, relElev: m.armElev, relLean: m.lean, hipX: m.hipX, front: m.frontView, minKnee, holdStart: t, goose: m.gooseneck, maxElbow: m.elbow };
          phase = "follow";
        } else if (t - setData.t > 2500) { phase = "ready"; setData = null; }
      } else if (phase === "follow") {
        const holding = m.wristAboveHead && m.elbow > 138;
        if (m.elbow > rel.maxElbow && t - rel.t < 200) { rel.maxElbow = m.elbow; rel.relElbow = m.elbow; rel.relElev = m.armElev; }
        if (m.gooseneck) rel.goose = true;
        if (holding) rel.holdEnd = t;
        if (!holding || t - rel.t > 1600) {
          const later = buf.filter((f) => f.t > rel.t + 300);
          const drift = later.length ? Math.max(...later.map((f) => Math.abs(f.hipX - rel.hipX))) : null;
          const shot = { front: rel.front, setTilt: setData.tilt, setFlare: setData.flare, minKnee: rel.minKnee, relElbow: rel.relElbow, relElev: rel.relElev, relLean: rel.relLean, holdMs: (rel.holdEnd || rel.t) - rel.t, goose: rel.goose, drift };
          phase = "ready";
          setData = null;
          rel = null;
          cooldown = t + 700;
          onShot(shot);
        }
      }
      return phase;
    },
  };
}
