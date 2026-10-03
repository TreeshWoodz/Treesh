
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

## Update 8 (Jun 2026)
- WAVY INTERACTION BUG FIXED (root cause): tapping a wavy note added its id to resolved.current, and the render window (windowIds) EXCLUDES resolved notes -> the bead ribbon vanished instantly on tap while an invisible hold-timer kept running (jumping receptor flashes = the glitch). FIX: game.tsx now renders wavy notes from a dedicated TIME-based window (wavyNotes + wavyIds/visibleWavy) INDEPENDENT of hit/resolved state, so tapping/tracing never removes them; they persist until the tail passes the receptor then fade. NotesLayer no longer draws wavy (bead ribbon is the sole visual). Verified iteration_11: 852 taps/28s, no crash, wavy stays visible, run completes.
- DAILY CHALLENGE STREAK: dailyChallenge.ts now stores a completion HISTORY (vocotap_daily_history) + computeStreak (consecutive days) + dailyStreakBonus (250 + 100/day, cap 1000). recordDailyDone on results awards the streak bonus; results badge shows N-day streak; home card shows '🔥 N-DAY'.
- CHALLENGE HISTORY CALENDAR: ProfileModal shows a current-month calendar — cleared days gold, today cyan-outlined — plus the streak in the section header.
- Note: results hero cover Image lacks testID='results-cover' (cosmetic; automation-only).

## Update 9 (Jun 2026)
- WAVY = CONTINUOUS RIBBON (user disliked dotted beads): game.tsx now renders each wavy note as connected rounded line SEGMENTS (WavySegment) between denser path samples — each segment is a bar sized/rotated/translated from its two projected endpoints, with rounded ends overlapping at joints so it reads as one smooth glowing line (glow layer + core). A white head bead marks the tap point. Verified visually on web (smooth S-curve ribbon, no dots).
- WAVE-TRACE SPARK: a glowing spark (traceX/traceGlow shared values) rides the receptor line following the required wavy lane, brightening while on-track (Wave Feedback request).
- STREAK REMINDER: home daily card shows '⚠️ Play today to keep your N-day streak!' (gold) when a streak is active but today isn't cleared; otherwise shows the reward. Uses computeStreak vs isDailyClaimed.

## Update 10 (Jun 2026)
- HOW TO PLAY refreshed (guide.tsx): updated wavy note copy (drag to trace the continuous ribbon + trace spark), added a 'MODES & EXTRAS' section (Daily Challenge + streaks, Practice mode A/B loop + speeds, Share/import charts by code, Leaderboards), and expanded FAQ (on-device auto-charting, star-based + milestone + daily Starlites, 33 achievements + mid-game unlock + challenge calendar, key remap). ALL backlog items complete.

## Update 11 (Jun 2026)
- WEEKLY STREAK CHEST: dailyChallenge.ts weeklyChestReward (every 7th consecutive day → 500, +250/week, cap 2000) + claimWeeklyChest (once per milestone, stored in vocotap_streak_chests). results.tsx awards it on top of the daily/streak bonus and shows a purple 'WEEK N STREAK CHEST · +X' badge. Guide daily copy mentions the chest.

## Update 12 (Jun 2026)
- CHEST REVEAL: results.tsx ChestReveal overlay — animated gift that pops in, shakes, then bursts open with radial sparkles + a scaling reward count and a Collect button (testID chest-collect-button). Gated by showChest (only when a weekly streak chest drops). Uses RN Animated (native driver), no new deps. Verified home/results boot with no regression.

## Update 13 (Jun 2026) — NEON GAME REDESIGN ("10x better")
- Neon arcade theme (theme.ts: fixed cyan/pink/lime/violet/gold palette, Orbitron + Orbitron-Black fonts; fonts.display now Orbitron-Black). App-wide NeonBackground (synthwave grid + orbs) rendered behind the Stack; navigation ThemeProvider background transparent; screens use transparent roots.
- ui.tsx: neon ScreenHeader (gradient underline), GlassCard (tint), NeonButton (cyan gradient primary / outline secondary), LevelBadge.
- Gameplay (game.tsx): PERFECT+ (<=45ms, +15% score), FAST/SLOW, lane hit bursts, screen shake (miss/milestone/fever; off with reducedParticles/performanceMode), scrolling beat lines (bpm), neon highway edges + strike line, Vocopulse fever pop + gold highway, GO! pop, combo bump/tier colour/multiplier chip, HP bar, new HUD. Popup keys prefixed to avoid duplicate-key warnings. Wavy logic untouched.
- progression.ts: XP/levels (xpForRun, level-up Starlite reward 100+20*lv), grades S+/S/A/B/C/D, per-song crowns (bronze/gold FC/diamond AP), 7 note skins bought with Starlites (store vocotap_progress: xp/owned/skin; setLaneSkin mutates laneColors).
- Results redesign (grade reveal, count-up score, medals, 6 judgment tiles, XP bar + LEVEL UP, Starlites). New /shop screen. Home redesign (level badge, currency row, shop/ranks, PLAY CTA, 2x2 mode grid, crowns stat). Library rows + analysis difficulty cards show best grade/crown. Profile shows level card + grades. Settings/Guide/Leaderboards/Loading restyled. Guide copy updated (PERFECT+, levels/crowns, Skin Shop).
- Tested: iteration_12 (7/7 pass).

## Update 14 (Jun 2026)
- Swipe/flick notes (up/left/right; touch flick >=22px within 550ms, keyboard = auto flick), auto-added on Normal+ (addSwipes), share-code supports dir.
- Perfect Trace (>=90% follow): PERFECT TRACE! +1200, spark ring, all-lane bursts.
- Crown Challenges: one-time +150 gold (FC) / +400 diamond (AP) per song+difficulty (vocotap_crown_claims); analysis crown-goals panel; results medal.
- Highway themes (classic/city/space/sunset) via HighwayScene SVG, sold in Shop.
- Wavy ribbon: 3 opaque layers (rim/colour/white core), consumed at hit line.
- Auto-chart: beatGrid tempo+phase estimation; onsets snapped to beat grid (Easy beats / Normal 8ths / Hard+ 16ths).
- Bigger notes; swipe notes are big rounded squares with large arrows.
- Tutorial level (tutorialChart + captions, home card + guide button, +200 first time, settings.tutorialDone).
- FIX: Treesh My Music IDB opened without fixed version (VersionError hid tracks) + schema-tolerant fields. FIX: audio picker accepts any file, validated by MIME/extension.
- Cover art: blurred backdrop + spinning glowing cover disc in gameplay. Strike-line beat pulse. Home PLAY breathe + shine.
- Tested: iteration_13, 13b, 14 all pass. Note: taps during the 2.5s boot loading screen are absorbed by the overlay (expected).

## Refactor (this session)
- game.tsx split 839 -> 554 lines. Gameplay render pieces moved verbatim to /app/frontend/src/game/components/: geometry.ts (Geo, P_NEAR, laneFrac), WavyNote.tsx (wavy ribbon + wavyLaneAt), FallingNote.tsx (tap/hold/swipe notes + ActiveHoldBar), Highway.tsx (Grid, Receptors, LaneBursts, BeatLines, StrikePulse), Backdrop.tsx (cover backdrop + CoverDisc). Game logic unchanged (diff-verified). Fixed SharedValue type imports. Verified: tutorial gameplay renders, hits score, pause/resume works (iteration_15 + screenshot).
- SONG INTRO CARD: SongIntroCard.tsx replaces the countdown overlay — cover art (or gradient fallback) with spinning halo, title, artist, colour-coded difficulty chip, BPM/notes/duration chips, mode tag, avatar + GET READY + 3-2-1 countdown. Tutorial banner/practice bar hidden until countdown ends.
- GAMEPLAY REDESIGN (clean/premium): removed spinning cover disc; blurred cover backdrop + scrim/vignette; glass top HUD with album thumbnail, difficulty, stars, accuracy, score, pause, progress + HP bars; crisper highway (gradient separators/rails, outlined receptors), refined notes, subtler bursts/beat lines/fever. Geo now carries per-view perspective (pn).
- EDITOR REVAMP (studio): 3D board reusing gameplay Grid/NotesLayer/WavyLayer (pn 0.42); tools Select/Tap/Hold/Flick/Wavy/Erase; step mode (paused tap-to-place, drag up for hold/wavy length); live record (tap/hold/drag wavy/quick flick, flick tool => flicks); snap Off/1/4/1/8/1/16; zoom 1–4s; whole-song density timeline scrub; beat step buttons; inspector (nudge time/lane, flick direction, delete). Files: app/editor.tsx, src/editor/{editorMath.ts,EditorTools.tsx,Timeline.tsx,Inspector.tsx}.
- EDITOR COPY/PASTE: drag-select time range (Select tool), inspector Copy / Duplicate / Paste, floating Paste N chip; pasted notes stay selected.
- DESKTOP LAYOUT (>=960px, src/hooks/useLayout.ts): route-aware centered frame in _layout (home 1240 / editor 1180 / others 980 / game full-bleed); home 2-column dashboard; library + shop 2-col grids; gameplay wider highway + centered HUD/panels + keyboard key hints + lane mapping by highway; editor wider highway + rounded board; transparent headers on desktop.
