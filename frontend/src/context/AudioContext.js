import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const AudioCtx = createContext(null);
export const useAudioPlayer = () => useContext(AudioCtx);

function shuffleKeepFirst(arr, firstIdx) {
  // returns a new array with the item at firstIdx moved to front, rest shuffled
  const rest = arr.filter((_, i) => i !== firstIdx);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [arr[firstIdx], ...rest];
}

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  if (audioRef.current === null && typeof window !== "undefined") {
    audioRef.current = new Audio();
    audioRef.current.preload = "metadata";
  }

  const baseQueueRef = useRef([]); // original order
  const [queue, setQueue] = useState([]); // active play order
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState("off"); // off | all | one
  const [nowPlayingOpen, setNowPlayingOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorSongId, setErrorSongId] = useState(null);

  const currentSong = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;

  // refs to hold latest values for event handlers
  const stateRef = useRef({});
  stateRef.current = { queue, currentIndex, repeat };

  // ------- core: load & play a specific index -------
  const loadIndex = useCallback((index, list, autoPlay = true) => {
    const audio = audioRef.current;
    if (!audio) return;
    const useList = list || stateRef.current.queue;
    if (index < 0 || index >= useList.length) return;
    const song = useList[index];
    setCurrentIndex(index);
    setErrorSongId(null);
    setLoading(true);
    if (audio.src !== song.audioUrl) {
      audio.src = song.audioUrl;
    }
    audio.load();
    if (autoPlay) {
      const p = audio.play();
      if (p && p.catch) p.catch(() => setIsPlaying(false));
    }
  }, []);

  // ------- public actions -------
  const playSong = useCallback((song, list) => {
    const source = (list && list.length ? list : [song]);
    baseQueueRef.current = source;
    const startIdx = Math.max(0, source.findIndex((s) => s.id === song.id));
    let playOrder = source;
    let idx = startIdx;
    if (shuffle) {
      playOrder = shuffleKeepFirst(source, startIdx);
      idx = 0;
    }
    setQueue(playOrder);
    stateRef.current.queue = playOrder;
    loadIndex(idx, playOrder, true);
    setNowPlayingOpen(false);
  }, [shuffle, loadIndex]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;
    if (audio.paused) {
      const p = audio.play();
      if (p && p.catch) p.catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentSong]);

  const next = useCallback((manual = false) => {
    const { queue: q, currentIndex: ci, repeat: rp } = stateRef.current;
    if (!q.length) return;
    if (rp === "one" && !manual) {
      loadIndex(ci, q, true);
      return;
    }
    let ni = ci + 1;
    if (ni >= q.length) {
      if (rp === "all" || manual) ni = 0;
      else { audioRef.current && audioRef.current.pause(); return; }
    }
    loadIndex(ni, q, true);
  }, [loadIndex]);

  const prev = useCallback(() => {
    const audio = audioRef.current;
    const { queue: q, currentIndex: ci } = stateRef.current;
    if (!q.length) return;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    let pi = ci - 1;
    if (pi < 0) pi = q.length - 1;
    loadIndex(pi, q, true);
  }, [loadIndex]);

  const seek = useCallback((time) => {
    const audio = audioRef.current;
    if (audio && !isNaN(time)) audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((v) => {
    const audio = audioRef.current;
    if (audio) audio.volume = v;
    setVolumeState(v);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prevShuffle) => {
      const nextShuffle = !prevShuffle;
      const base = baseQueueRef.current;
      const cur = stateRef.current.queue[stateRef.current.currentIndex];
      if (base.length && cur) {
        if (nextShuffle) {
          const idx = base.findIndex((s) => s.id === cur.id);
          const newOrder = shuffleKeepFirst(base, idx >= 0 ? idx : 0);
          setQueue(newOrder);
          stateRef.current.queue = newOrder;
          setCurrentIndex(0);
        } else {
          const idx = base.findIndex((s) => s.id === cur.id);
          setQueue(base);
          stateRef.current.queue = base;
          setCurrentIndex(idx >= 0 ? idx : 0);
        }
      }
      return nextShuffle;
    });
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off"));
  }, []);

  // ------- queue management -------
  const reorderQueue = useCallback((newList) => {
    const cur = stateRef.current.queue[stateRef.current.currentIndex];
    setQueue(newList);
    stateRef.current.queue = newList;
    baseQueueRef.current = newList;
    if (cur) {
      const ni = newList.findIndex((s) => s.id === cur.id);
      if (ni >= 0) setCurrentIndex(ni);
    }
  }, []);

  const removeFromQueue = useCallback((songId) => {
    const { queue: q, currentIndex: ci } = stateRef.current;
    const idx = q.findIndex((s) => s.id === songId);
    if (idx < 0) return;
    const newList = q.filter((s) => s.id !== songId);
    baseQueueRef.current = newList;
    setQueue(newList);
    stateRef.current.queue = newList;
    if (idx === ci) {
      if (newList.length === 0) { audioRef.current && audioRef.current.pause(); setCurrentIndex(-1); return; }
      loadIndex(Math.min(idx, newList.length - 1), newList, true);
    } else {
      setCurrentIndex(idx < ci ? ci - 1 : ci);
    }
  }, [loadIndex]);

  const addToQueue = useCallback((song, playNext = false) => {
    const { queue: q, currentIndex: ci } = stateRef.current;
    if (!q.length) { playSong(song, [song]); return true; }
    if (q.some((s) => s.id === song.id)) return false;
    const newList = [...q];
    if (playNext) newList.splice(ci + 1, 0, song);
    else newList.push(song);
    setQueue(newList);
    stateRef.current.queue = newList;
    baseQueueRef.current = newList;
    return true;
  }, [playSong]);

  // ------- attach audio element event listeners once -------
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMeta = () => { setDuration(audio.duration || 0); setLoading(false); };
    const onCanPlay = () => setLoading(false);
    const onWaiting = () => setLoading(true);
    const onProgress = () => {
      try {
        if (audio.buffered.length) setBuffered(audio.buffered.end(audio.buffered.length - 1));
      } catch (e) { /* noop */ }
    };
    const onEnded = () => next(false);
    const onError = () => {
      setLoading(false);
      setIsPlaying(false);
      const cur = stateRef.current.queue[stateRef.current.currentIndex];
      if (cur) setErrorSongId(cur.id);
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("progress", onProgress);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("progress", onProgress);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [next]);

  // ------- Media Session API -------
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentSong) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: "Treesh",
        artwork: [{ src: currentSong.coverArt, sizes: "512x512", type: "image/jpeg" }],
      });
      navigator.mediaSession.setActionHandler("play", () => togglePlay());
      navigator.mediaSession.setActionHandler("pause", () => togglePlay());
      navigator.mediaSession.setActionHandler("nexttrack", () => next(true));
      navigator.mediaSession.setActionHandler("previoustrack", () => prev());
    } catch (e) { /* noop */ }
  }, [currentSong, togglePlay, next, prev]);

  useEffect(() => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    }
  }, [isPlaying]);

  // ------- Keyboard shortcuts -------
  useEffect(() => {
    const onKey = (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || e.target?.isContentEditable) return;
      if (!currentSong) return;
      if (e.code === "Space") { e.preventDefault(); togglePlay(); }
      else if (e.code === "ArrowRight" && e.shiftKey) { next(true); }
      else if (e.code === "ArrowLeft" && e.shiftKey) { prev(); }
      else if (e.code === "ArrowRight") { seek(Math.min((audioRef.current?.currentTime || 0) + 5, duration)); }
      else if (e.code === "ArrowLeft") { seek(Math.max((audioRef.current?.currentTime || 0) - 5, 0)); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentSong, togglePlay, next, prev, seek, duration]);

  const value = {
    currentSong, queue, currentIndex, isPlaying, duration, currentTime, buffered,
    volume, shuffle, repeat, nowPlayingOpen, loading, errorSongId,
    playSong, togglePlay, next, prev, seek, setVolume, toggleShuffle, cycleRepeat,
    reorderQueue, removeFromQueue, addToQueue,
    setNowPlayingOpen, retry: () => currentSong && loadIndex(currentIndex, queue, true),
  };

  return <AudioCtx.Provider value={value}>{children}</AudioCtx.Provider>;
}
