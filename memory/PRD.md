
## Update (Jun 2026)
- Fixed wavy notes: added finger-drag tracking (onTouchMove) so waves must be TRACED across lanes; every wavy note now gets a cross-lane path (chartEngine wavePath). Fixed undefined liveStars crash + added its style.
- Redesigned Home secondary tiles (Editor/Settings/How to play): distinct lane-color gradient icon chips with glow, glass surfaces, and captions.

## Update 2 (Jun 2026)
- FIXED editor completely broken: board migrated from PanResponder to raw onTouch* had no responder claim; switched to onResponderGrant/Move/Release so notes add again (mouse+touch).
- FIXED wavy notes not showing in editor: waveData() was called with wrong args (number instead of Note) => NaN path. Corrected both call sites; live preview now traces the drag.
- Editor UI: removed REC badge (covered lane 4), Record button dot now blinks, tips bubble is toggleable (close/show tips).
- Swapped home logo to new vocotap-logo-v2.png (bigger).
- My Music import: read parent Treesh app IndexedDB treesh_media/tracks (same origin), expose as source=device in "On this device" tab; added refresh button (re-scans My Music + refetches Treesh catalog). mineSongs also feed Home Quick Play.
- PENDING (from earlier ask, data model added, UI not yet): wave-follow "Nice trace!" feedback, audio-start reliability, editor first-run tutorial, desktop custom key UI.

## Update 3 (Jun 2026)
- Scoring fixed: accuracy = hits/total (no misses = 100%); half-star tiers per spec; starlites 5*=300, 4/4.5*=150, 2.5-3.5*=100, <=2*=50. Half stars render in results + live HUD.
- Reliable audio start: countdown waits for status.isLoaded (2.5s fallback).
- Difficulty-first: analysis shows difficulty grid immediately; generates only chosen difficulty on Play (generateFor) with Building + Error(retry/back/edit) states + uri guard. Easy far sparser (keepFrac 0.22 + 0.5s minGap) so notes hit strong beats.
- Editor-first flow: Home Editor opens editor directly; Change/empty-state -> library?pick=editor -> selecting returns to editor.
- Editor: Chart saved toast + Export chart button; wavy redesign (head at start, ribbon follows finger, glowing tip dot).
- Wave-trace reward: glowing trail + Nice trace! pop.
- Home BEST: removed duplicate white star char.
- DEFERRED: editor first-run tutorial, settings key-remap UI (keys default ASDF), native lock-screen next/prev media controls (needs native build + clarification).

## Update 4 (Jun 2026)
- Editor first-run tutorial: 5-step skippable modal (editor.tsx), auto-shows once a song is selected when editorTutorialSeen=false, persists as seen, replayable via header help button. Verified (iteration_7).
- Settings Desktop Keys remap (web only): tap a lane then press a key to bind; persists to settings.keyBindings; Reset to A/S/D/F; game.tsx reads bindings. Verified (iteration_7).
- Media lock-screen next/prev controls: SKIPPED per user.

## Update 5 (Jun 2026)
- WAVY NOTES REBUILT: root cause was drawing the wave inside each note perspective-scaled+rotated single-lane container (sheared/distorted). New WavyLayer/WavyNote overlay in game.tsx projects each path point through the lane perspective every frame (useAnimatedProps + AnimatedPath) -> clean lane-aligned ribbon, faithful to drawn shape. Editor placed note + preview use absolute contourPath. wavyLaneAt matches by nearest point time. Verified iteration_9.
- Backlog (not yet built): Chart Sharing (link/code), Practice Mode (slow/loop), Combo Milestones, Per-song Leaderboards.

## Update 6 (Jun 2026)
- ROOT-CAUSE AUTO-GEN FIX (device): charts felt disconnected on PHONE because analyzeAudio was web-only (returned null on native) -> every chart fell back to a filename-hash BPM grid. Added analyzeAudioNative in audioAnalysis.ts: fast-plays the track silently at 2x via expo-audio + useAudioSampleListener, collects real PCM, and runs the SHARED computeAnalysis DSP (4-band one-pole + spectral-flux onset -> per-onset lane bass..treble). Result cached per song in AsyncStorage (vocotap_analysis_<id>). analysis.tsx shows an 'analysing' progress bar (native) and caches web analysis too. Needs iOS mic permission (NSMicrophoneUsageDescription added; Android RECORD_AUDIO) — only to READ the buffer; declining falls back gracefully. DSP validated in node (15/15 beats within 40ms). DEVICE-ONLY — user must verify on phone.
- WAVY NOTES REBUILT AGAIN (beads): SVG-path animation via useAnimatedProps was fragile on native. game.tsx WavyNote now renders each wavy as a chain of small beads sampled along the path (sampleBeads), each falling with the SAME transform as tap notes (fr = x-0.5). No animated SVG. Verified rendering on web (iteration_10) as glowing bead ribbon.
- CHART SHARING: src/game/shareCode.ts encodes/decodes charts to a base64 VOCO1- code (cross-platform, unicode-safe, node-validated). ShareCodeModal (copy + native Share sheet) from editor header (editor-share-code-button) + library song menu (song-share-code). ImportCodeModal from library Customs (import-code-button). Deep-link import in _layout (vocotap:// / any URL carrying VOCO1-). AppState.importChartFromCode.
- PRACTICE MODE: analysis practice-mode-button -> game with practice=1. Speed 0.5/0.75/1x (applyRate, rate-aware jsTime/startClock/playbackRate) + A/B loop (jumpTo). No score saved; exits back.
- COMBO MILESTONES: 50/100/200 -> center pop + bonus Starlites (25/50/100) awarded at finish (not practice/test).
- ACHIEVEMENTS: expanded to 33 (many hard: combo500, expert10, 1M-run, 10k notes, 5k starlites, 30-day streak, etc). In-gameplay unlock banner (top slide-in) for live combo/score achievements (achToast).
- COVER ART: ScoreResult now carries coverArt/accent; shown on results hero, leaderboards rows, ProfileModal Recently Played.
- LEADERBOARDS: new /leaderboards.tsx (personal bests per song+difficulty, expandable). Entry: home-leaderboards-button + results-leaderboard-button.
- REMAINING BACKLOG: Update the 'How to Play' guide (P2, user wants LAST).

## Update 7 (Jun 2026)
- DAILY CHALLENGE: src/game/dailyChallenge.ts picks one featured song/day (deterministic from date over a stable pool) with a 3★ target + 250 Starlite bonus. Home shows a gold daily-challenge-card (cover + target, or "Completed today"). Bonus awarded once/day on results.tsx when lastResult matches the featured song and stars>=target (claim stored in AsyncStorage vocotap_daily_claim); shows daily-reward-badge.
- EDITOR HEADER FIX: ScreenHeader restructured so the right action cluster sizes to content (headerLeft minWidth 44, title flex:1 center, headerRight flexShrink:0) — editor's ?/share/export/Save buttons no longer overlap the title. Editor title shortened to "Editor"; header icon buttons tightened (34px, gap 6).
- EDITOR TIPS hidden by default (showHint=false) — shows a "Show tips" pill.
