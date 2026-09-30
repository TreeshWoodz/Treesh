import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { bumpStats, getSettings } from "@/lib/storage";

const Ctx = createContext(null);
export const useTimer = () => useContext(Ctx);

let _ac = null;
export function beep(freq = 880, dur = 0.12, vol = 0.18) {
  try {
    if (!getSettings().beeps) return;
    _ac = _ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = _ac.createOscillator();
    const g = _ac.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, _ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, _ac.currentTime + dur);
    o.connect(g).connect(_ac.destination);
    o.start();
    o.stop(_ac.currentTime + dur + 0.02);
  } catch (e) {}
}
export function speak(text, force = false) {
  try {
    if ((!force && !getSettings().voice) || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch (e) {}
}

/* session = { title, steps: [{ name, secs, kind: 'warm'|'work'|'rest'|'cool', note, drillId }] } */
export function TimerProvider({ children }) {
  const [session, setSession] = useState(null);
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState(null); // 'full' | 'mini' | null
  const [done, setDone] = useState(false);
  const endAt = useRef(0);
  const lastBeep = useRef(-1);
  const wake = useRef(null);
  const stateRef = useRef({});
  stateRef.current = { session, idx, running, remaining };

  const requestWake = async () => {
    try {
      if ("wakeLock" in navigator && !wake.current) wake.current = await navigator.wakeLock.request("screen");
    } catch (e) {}
  };
  const releaseWake = () => {
    try {
      wake.current && wake.current.release();
    } catch (e) {}
    wake.current = null;
  };

  const goTo = useCallback((i, keepRunning = true) => {
    const s = stateRef.current.session;
    if (!s) return;
    const step = s.steps[i];
    if (!step) return;
    setIdx(i);
    setRemaining(step.secs);
    endAt.current = Date.now() + step.secs * 1000;
    lastBeep.current = -1;
    if (keepRunning) speak(step.name);
  }, []);

  const finish = useCallback(() => {
    const s = stateRef.current.session;
    setRunning(false);
    setDone(true);
    releaseWake();
    beep(660, 0.2);
    setTimeout(() => beep(990, 0.35), 220);
    speak("Session complete. Great work.");
    if (s) {
      const total = s.steps.reduce((a, b) => a + b.secs, 0);
      bumpStats((st) => {
        st.sessions += 1;
        st.minutes += Math.round(total / 60);
        s.steps.forEach((x) => {
          if (x.drillId) st.drillsDone[x.drillId] = (st.drillsDone[x.drillId] || 0) + 1;
        });
        return st;
      });
    }
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      const left = (endAt.current - Date.now()) / 1000;
      setRemaining(left);
      const whole = Math.ceil(left);
      if (whole <= 3 && whole >= 1 && lastBeep.current !== whole) {
        lastBeep.current = whole;
        beep(740, 0.09);
      }
      if (left <= 0) {
        const { session: s, idx: i } = stateRef.current;
        if (s && i < s.steps.length - 1) {
          beep(1040, 0.22);
          goTo(i + 1);
        } else finish();
      }
    }, 200);
    return () => clearInterval(t);
  }, [running, goTo, finish]);

  const start = useCallback(
    (s) => {
      if (!s || !s.steps?.length) return;
      stateRef.current.session = s;
      setSession(s);
      setDone(false);
      setMode("full");
      setRunning(true);
      requestWake();
      goTo(0);
    },
    [goTo]
  );
  const pause = () => {
    setRunning(false);
    releaseWake();
  };
  const resume = () => {
    if (done) return;
    endAt.current = Date.now() + Math.max(0, stateRef.current.remaining) * 1000;
    setRunning(true);
    requestWake();
  };
  const next = () => {
    if (!session) return;
    if (idx < session.steps.length - 1) goTo(idx + 1, running);
    else finish();
  };
  const prev = () => session && goTo(Math.max(0, idx - 1), running);
  const addTime = (sec) => {
    endAt.current += sec * 1000;
    setRemaining((r) => r + sec);
  };
  const restart = () => session && start(session);
  const close = () => {
    setRunning(false);
    setMode(null);
    setSession(null);
    setDone(false);
    releaseWake();
    try {
      if (document.fullscreenElement) document.exitFullscreen();
    } catch (e) {}
  };

  return (
    <Ctx.Provider value={{ session, idx, remaining, running, mode, done, setMode, start, pause, resume, next, prev, addTime, restart, close }}>
      {children}
    </Ctx.Provider>
  );
}
