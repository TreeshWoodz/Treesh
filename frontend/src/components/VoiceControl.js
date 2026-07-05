import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Mic, MicOff } from "lucide-react";
import { useAudioPlayer } from "@/context/AudioContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function VoiceControl({ className }) {
  const navigate = useNavigate();
  const { togglePlay, next, prev, toggleShuffle, cycleRepeat, currentSong, isPlaying } = useAudioPlayer();
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recRef = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setSupported(false); return; }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setTranscript(text);
      if (e.results[e.results.length - 1].isFinal) handleCommand(text.toLowerCase().trim());
    };
    rec.onerror = (e) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast.error("Microphone access denied");
      }
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch (e) {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCommand = useCallback((text) => {
    if (!text) return;
    const say = (m) => toast(m, { icon: "🎙️" });
    if (/(^|\s)(pause|stop)(\s|$)/.test(text)) { if (isPlaying) togglePlay(); say("Paused"); }
    else if (/(next|skip)/.test(text)) { next(true); say("Next track"); }
    else if (/(previous|back|last)/.test(text)) { prev(); say("Previous track"); }
    else if (/shuffle/.test(text)) { toggleShuffle(); say("Shuffle toggled"); }
    else if (/repeat/.test(text)) { cycleRepeat(); say("Repeat toggled"); }
    else if (/^(search|find)\s+(.+)/.test(text)) {
      const q = text.replace(/^(search|find)\s+/, "");
      navigate(`/?q=${encodeURIComponent(q)}`); say(`Searching “${q}”`);
    }
    else if (/^play\s+(.+)/.test(text)) {
      const q = text.replace(/^play\s+/, "");
      navigate(`/?q=${encodeURIComponent(q)}`); say(`Looking for “${q}”`);
    }
    else if (/(^|\s)(play|resume)(\s|$)/.test(text)) { if (!isPlaying && currentSong) togglePlay(); say("Playing"); }
    else { toast("Didn’t catch that", { description: `“${text}”` }); }
  }, [isPlaying, togglePlay, next, prev, toggleShuffle, cycleRepeat, navigate, currentSong]);

  const toggle = () => {
    if (!supported) { toast.error("Voice control not supported in this browser"); return; }
    const rec = recRef.current;
    if (!rec) return;
    if (listening) { rec.stop(); setListening(false); }
    else {
      setTranscript("");
      try { rec.start(); setListening(true); } catch (e) { /* already started */ }
    }
  };

  return (
    <>
      <button
        onClick={toggle}
        data-testid="voice-control-mic-button"
        aria-label="Voice control"
        className={cn(
          "relative grid h-11 w-11 place-items-center rounded-full border transition-colors",
          listening ? "border-[color:var(--treesh-purple)] bg-[color:var(--treesh-purple)]/20 text-white" : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10",
          className
        )}
      >
        {listening ? <Mic size={18} /> : supported ? <Mic size={18} /> : <MicOff size={18} />}
      </button>

      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed left-1/2 top-24 z-[70] -translate-x-1/2"
            data-testid="voice-control-listening-overlay"
          >
            <div className="flex items-center gap-4 rounded-2xl border border-white/15 bg-black/70 px-6 py-4 backdrop-blur-2xl shadow-[var(--treesh-shadow)]">
              <div className="relative grid h-12 w-12 place-items-center">
                <span className="voice-pulse absolute inset-0" />
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--treesh-purple)] text-white"><Mic size={20} /></span>
              </div>
              <div className="min-w-[160px]">
                <p className="text-xs uppercase tracking-widest text-white/50">Listening…</p>
                <p className="clamp-1 text-sm text-white" data-testid="voice-control-transcript">{transcript || "Say play, pause, next…"}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
