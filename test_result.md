#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

## Current test focus (FRONTEND ONLY) - Vocotap rhythm game redesign
- Reskin to parent Treesh design: dynamic accent from treesh_accent (localStorage, default #9328ff), Manrope + Special Gothic fonts, glass surfaces.
- Gameplay: 3D perspective highway, native-driven note motion (fix lag).
- Editor: vertical record-and-play (tap=tap, hold=hold, drag=wavy) + Undo/Redo/Erase selected/Erase all.
- Starlites: home star pill opens history modal (NOT settings).
- Guide: tappable note explanations + FAQ. Home: profile avatar + nickname, badge removed.

agent_communication:
    -agent: "main"
    -message: "Test FRONTEND ONLY (local-first, no auth/backend). Flows: (1) Home shows avatar+nickname+Starlites pill; home-starlites-button opens modal with starlites-history-list and starlites-close-button (must NOT go to settings). (2) quick-play-button -> gameplay-screen 3D highway; lane-1-hit-pad..lane-4-hit-pad tappable; pause-game-button -> resume/restart/exit. (3) Editor via open-editor-button (warmup song preselected by quick play, else Choose a track): editor-record-button toggles REC, editor-play-button plays, tap deck adds notes, editor-undo-button/editor-redo-button/editor-erase-selected-button/editor-erase-all-button, save-chart-button. (4) open-guide-button: note-type-tap..note-type-special expand, faq-item-1.. expand. (5) Library: import flow, NO 'Open on Treesh' button."
    -agent: "main"
    -message: "WAVY NOTE FIX (frontend only). Root cause: (1) tap pads had no onTouchMove so dragging a finger across lanes never registered — wavy notes could only be held in place. (2) fallback + training charts created wavy notes with NO path, so wavyLaneAt() returned a constant lane (single-lane hold). Also fixed a pre-existing crash: liveStars var/style were referenced but never defined in game.tsx. Changes: added onPadsTouchMove (drag retargets held lane) + onMoveShouldSetResponder=true + onTouchMove wired on pads; chartEngine now gives EVERY wavy note a cross-lane wavePath() (verified via node: 0 wavy notes without a path, 0 single-lane). Please verify FRONTEND: (a) quick-play-button -> gameplay-screen loads with NO crash and live 5-star HUD renders in the accuracy row; (b) lane pads still tap/hit; (c) dragging across lane pads during play does not crash and flashes the new lane; (d) pause/resume/restart/exit still work. Automated precise wavy tracing is not required — focus on no-crash + drag handling + HUD."

    -agent: "main"
    -message: "BATCH: (1) Scoring/stars rewritten — accuracy now = hits/total (no misses = 100%); star tiers 100=5, 96-99=4.5, 86-95=4, 80-85=3.5, 70-79=3, 66-69=2.5, 50-65=2, <50=1 (half stars shown in results + live HUD). Starlites: 5*=300, 4/4.5*=150, 2.5-3.5*=100, <=2*=50 (game.tsx starsFor/starlitesFor, results.tsx half-star render). (2) Reliable audio start: game countdown now waits for status.isLoaded (2.5s fallback) before play. (3) Difficulty-first flow: analysis.tsx shows difficulty grid immediately, generates ONLY the chosen difficulty on Play (generateFor) with Building + Error(retry/back/edit) states; chartEngine Easy far sparser (keepFrac 0.22 + minGap 0.5s) so notes land on strong beats. (4) Editor-first: Home Editor opens editor directly; empty-state + Change go to library?pick=editor and selecting a song returns to editor. (5) Editor save now shows 'Chart saved' toast + Export chart button in header. (6) Editor wavy redesign: head stays at start lane, glowing ribbon traces finger across board, glowing tip dot marks current finger. (7) Wave-trace reward: glowing trail + 'Nice trace!' pop on clean wavy follow. (8) Desktop keys default A/S/D/F (settings.keyBindings). (9) Home BEST stat: removed duplicate white star char. (10) My Music import from Treesh IndexedDB + library refresh button. DEFERRED (flagged to user): editor first-run tutorial, settings key-remap UI, native lock-screen next/prev media controls. Please test FRONTEND: editor add/save/export + wavy visuals; library refresh + tabs; analysis difficulty-first + generate&play; results screen renders (half stars); home logo + single BEST star; no crashes navigating game (audio-gated countdown)."

    -agent: "main"
    -message: "TWO FEATURES ADDED. (A) Editor first-run tutorial: 5-step skippable walkthrough (Modal) in editor.tsx, auto-shows once a song is selected when settings.editorTutorialSeen is false; endTutorial sets editorTutorialSeen=true (persisted). 'editor-help-button' in header reopens it anytime. Testids: tutorial-next-button, tutorial-skip-button, editor-help-button. (B) Desktop key remap in settings.tsx (web only) 'DESKTOP KEYS' section: tap keybind-lane-1..4 then press a key to bind; keybind-reset-button resets to A/S/D/F; persists to settings.keyBindings. game.tsx keyboard handler already reads settings.keyBindings. Please verify FRONTEND: (1) Tutorial auto-shows first time in editor with a track, Skip closes it AND it does NOT reappear on next editor open; help button reopens it. (2) In Settings (web), remap a lane (e.g. lane 1 -> Q), value shows Q and persists after leaving/returning to Settings; Reset restores A S D F. (3) Regression: after remap, entering gameplay and pressing the remapped key registers a hit on that lane (desktop keyboard)."

    -agent: "main"
    -message: "WAVY + AUTO-GEN OVERHAUL. (1) Auto-gen lanes now MUSICAL not random: audioAnalysis.ts rewritten to 4-band (one-pole filters) freq-aware onset detection returning per-onset lane (bass->0, low-mid->1, high-mid->2, treble->3) + instrumental-favouring novelty weights (down-weights vocal mid band). chartFromOnsets now uses data.lanes instead of random walk (verified via node: lane distribution follows input bands). (2) Wavy gameplay visual FIXED: falling wave now moves a FULL lane per lane (wavePathData multiplier dev*hw*2) so the on-screen ribbon matches the required lane exactly; rendered as clean 3-layer glowing ribbon; swing widened (0.32) so it clearly crosses ~2 lanes. (3) Removed the awkward distorted active-hold wave bar (ActiveHoldBar returns null for wavy) — the falling wave + lit receptor lane guide the trace. Please verify FRONTEND: gameplay loads & wavy notes appear as a clean cross-lane ribbon (no distorted/awkward shape), NO crash; auto-gen via analysis 'play-generated-chart-button' builds a chart and enters gameplay for a device song (e.g. Voco Warmup) on Easy and Hard; results screen still works. Desktop: following the wave = pressing the shifting lane keys (A/S/D/F)."

    -agent: "main"
    -message: "WAVY NOTE REBUILT (root cause found): the wave was being drawn INSIDE each note's perspective-scaled + rotated single-lane container, which sheared/distorted any cross-lane curve — impossible to look right or match the target lane. New approach: a dedicated absolute-space overlay (WavyNote/WavyLayer in game.tsx) projects every path point through the SAME lane perspective each frame via useAnimatedProps + AnimatedPath (react-native-svg), so the ribbon passes through the REAL lane positions and is faithful to the drawn shape. FallingNote now only renders the wavy head (no distorted tail); ActiveHoldBar still returns null for wavy. Editor placed-note + live preview + gameplay all now use faithful absolute path coords (contourPath / projection) so the shape you draw is what you get. wavyLaneAt now matches by nearest point time. Please verify FRONTEND: (1) Home->browse-library->device->Voco Warmup->difficulty-normal->play-generated-chart-button: gameplay loads, NO crash, and wavy notes render as a CLEAN glowing ribbon aligned to the lanes/perspective (not a sheared/rotated distorted blob). (2) Editor: draw a wavy note (record + horizontal drag) and confirm the placed wave keeps the SAME shape as drawn (matches live preview). (3) No regression: taps/holds, results screen, pause/exit still work."

    -agent: "main"
    -message: "WAVY INTERACTION BUG FIXED + Daily Challenge history/streak. Root cause of 'tap a wavy note and it instantly disappears + glitches': tapping added the note id to resolved.current, and the render window (windowIds) EXCLUDES resolved notes -> the bead ribbon vanished the instant it was tapped, while an invisible hold-timer kept running (jumping receptor flashes = the 'glitch'). FIX in game.tsx: wavy notes now render from a dedicated TIME-based window (wavyIds/visibleWavy) INDEPENDENT of hit/resolved state; NotesLayer no longer draws wavy. Added Daily Challenge streak bonus + Challenge History calendar in ProfileModal. Test FRONTEND (web): (A) WAVY: Home->browse-library-button->device-library-chip->song-card-neon-warmup->difficulty-normal-chip->play-generated-chart-button; during play rapidly tap all four pad lanes through the song — confirm NO crash/glitch, wavy bead ribbons stay visible while tapped (do NOT vanish instantly), run reaches results. (B) Daily: home daily-challenge-card -> analysis; ProfileModal shows CHALLENGE HISTORY calendar + ACHIEVEMENTS 0/33 no crash. (C) Regression: taps/holds score, pause/resume/restart/exit, results cover art."

    -agent: "main"
    -message: "BIG BATCH — please test FRONTEND (web) only; on-device audio analysis is native-only and NOT web-testable (skip it). Changes: (1) WAVY NOTES REBUILT AGAIN as bead-chains: game.tsx WavyNote now renders a wavy note as a chain of small 'beads' sampled along the path, each falling with the SAME transform as tap notes (no animated SVG). Verify: Home->browse-library->'On this device' chip->song-card-neon-warmup->difficulty-normal-chip->play-generated-chart-button -> gameplay-screen loads with NO crash; wavy notes appear as a glowing bead ribbon crossing lanes; taps/holds still fall & hit; pause/resume/restart/exit work. (2) CHART SHARING: editor-share-code-button opens ShareCodeModal (share-code-text, share-code-copy, share-code-share, share-code-close). Library Customs tab has import-code-button -> ImportCodeModal (import-code-input, import-code-submit); song menu (song-menu-<id>) has song-share-code. Verify a code from editor can be pasted into import and creates a Custom chart. (3) PRACTICE MODE: analysis screen practice-mode-button -> gameplay with practice-bar (practice-speed-0.5/0.75/1, practice-set-a, practice-set-b, practice-clear-loop); no score saved (exits via back, no results). (4) COMBO MILESTONES: at 50/100/200 combo a center pop appears (hard to hit in automation—just confirm no crash). (5) ACHIEVEMENT TOAST in gameplay (top banner) — appears when a live achievement unlocks (combo/score based); confirm no crash. (6) LEADERBOARDS: home-leaderboards-button -> /leaderboards (leaderboard-song-<idx> expands to per-difficulty bests); results-leaderboard-button from results. (7) COVER ART now shown on results hero, leaderboards rows, and ProfileModal Recently Played. (8) MANY MORE ACHIEVEMENTS in ProfileModal grid (~33). Regression: home boots, quick play, editor add/save, library tabs/import all still work. Test credentials: none (offline app)."

    -agent: "main"
    -message: "NEON GAME REDESIGN + GAMEPLAY/PROGRESSION UPGRADE (frontend only, offline). (1) New neon theme (theme.ts), Orbitron fonts, app-wide NeonBackground (synthwave grid) behind the stack (_layout ThemeProvider transparent). (2) Gameplay (game.tsx): PERFECT+ judgment (<=45ms, score bonus), FAST/SLOW timing text, lane hit bursts (ring+pillar+sparks), screen shake on miss/milestone/fever, beat lines scrolling down the highway, neon highway edges + strike line, Vocopulse fever pop 'VOCOPULSE!' + gold highway, GO! after countdown, combo bump + tier colour + multiplier chip, HP bar (hud-health), new HUD (hud-score). Wavy logic untouched. (3) Progression (src/game/progression.ts): XP + levels (level-up Starlite reward), letter grades S+/S/A/B/C/D, per-song crowns (bronze clear / gold FC / diamond AP), note-skin shop. (4) Results redesign: results-grade, results-score count-up, medal-full-combo / medal-all-perfect, 6 judgment tiles, results-xp-card with level-up-badge, results-starlites-card, results-replay-button, results-leaderboard-button, results-edit-chart-button, results-continue-button. (5) NEW /shop screen: skin-card-<id>, skin-action-<id> (tap once = CONFIRM, tap again buys with Starlites; owned = equip), shop-message. Home: home-level-badge, home-shop-button, open-shop-tile. (6) Library rows show best grade + crown (song-mastery-<id>); analysis difficulty cards show best grade/crown. Profile modal shows profile-level-card."

    -agent: "main"
    -message: "4 FEATURES (frontend only, offline). (1) SWIPE NOTES: new note type 'swipe' with dir up/left/right (arrow icon on a square-ish cap). Auto-charts add them on Normal/Hard/Expert (none on Easy); built-in Voco Warmup chart has one every 12 notes (index%12===3). TOUCH: tap lane when it arrives then flick >=22px in arrow direction within 550ms -> hit + FLICK bonus (judgment-flick text 'FLICK ↑'); wrong way/no flick/release = MISS. KEYBOARD (web): lane key alone counts as correct flick. (2) PERFECT TRACE: wavy note followed >=90% -> 'PERFECT TRACE!' pop (testID perfect-trace-pop, +1200) with spark ring + all-lane bursts + shake; 70-90% -> 'Nice trace!' (trace-pop, +500). (3) CROWN CHALLENGES: analysis screen shows crown-goals panel (crown-goal-gold +150 Full Combo, crown-goal-diamond +400 All Perfect) per selected difficulty (not Custom); one-time bonus on first FC/AP per song+difficulty (AsyncStorage vocotap_crown_claims) -> results medal-crown-bonus 'GOLD CROWN · +150', added to starlites earned. (4) HIGHWAY THEMES in /shop (title now 'SHOP'): theme-card-classic/city/space/sunset with theme-action-<id> (CONFIRM then buy; owned=equip). Gameplay backdrop testID gameplay-theme-<id> renders SVG scenery. Guide updated (Swipe note type + crowns/themes)."

    -agent: "main"
    -message: "GAMEPLAY REVAMP (frontend only). (1) WAVY notes re-rendered: 3 OPAQUE layers (dark rim / lane colour / white core) of WavySegment, no translucent overlap lumps; the ribbon is CONSUMED at the hit line (segments past the receptor vanish, head bead fades fast). Hit logic (wavyIds / windowIds) untouched. (2) AUTO-CHART: chartEngine.beatGrid() estimates tempo (onset-envelope autocorrelation 70-180 BPM + period/phase refinement) and chartFromOnsets snaps onsets to the beat grid (beats Easy / 8ths Normal / 16ths Hard+Expert), dropping off-grid onsets. Node-validated: est BPM 128/95/150 exact, grid error <=11ms. (3) Notes bigger: taps 0.8 lane wide x 28px tall; SWIPE notes are big rounded squares (0.7 lane wide, 0.62 lane tall) with large arrow. (4) TUTORIAL LEVEL: home-tutorial-card (shown until settings.tutorialDone) and guide-play-tutorial-button start a guided chart on Voco Warmup (game?tutorial=1, testChart = tutorialChart()). tutorial-banner shows step captions TAP/HOLD/FLICK/WAVE/MIX IT UP by time. Finish -> tutorialDone=true, +200 Starlites (first time), back to home (card disappears). Pause exit label 'Skip tutorial' also marks done. (5) Guide swipe copy updated."

    -agent: "main"
    -message: "BUG FIXES + POLISH. (1) Treesh 'My Music' (IndexedDB treesh_media) not showing: readTreeshMine opened the DB at fixed version 1 -> VersionError once the parent upgraded -> empty list. Now opens at current version, finds the tracks store tolerantly, and accepts audio/cover as Blob, ArrayBuffer or URL string under several field names. (2) Custom audio upload: picker now accepts any file ('*/*') then validates by audio MIME or extension (mp3/m4a/aac/wav/flac/ogg/opus/aiff/caf/wma/webm/mp4/amr/...); non-audio shows a friendly import-error-banner; native copy failure falls back to cached uri. (3) Cover art as gameplay theme: classic theme shows blurred cover backdrop + accent tint; ALL themes show a spinning glowing cover disc (testID gameplay-cover-disc) behind the far end of the highway (only when the song has cover art). (4) Strike line beat-pulse (StrikePulse). (5) Home PLAY button breathes + shine sweep. (6) Tutorial cold-boot race fixed (ref + retry)."

    -agent: "main"
    -message: "REFACTOR ONLY (no behaviour/visual change intended). game.tsx (839 -> 554 lines) split: src/game/components/geometry.ts (Geo, P_NEAR, laneFrac), WavyNote.tsx (WavySegment/WavyBead/WavyNote/WavyLayer/wavyLaneAt), FallingNote.tsx (FallingNote/NotesLayer/ActiveHoldBar), Highway.tsx (Grid/Receptors/LaneBursts/BeatLines/StrikePulse), Backdrop.tsx (CoverDisc/Backdrop). Code moved verbatim; only imports/exports + SharedValue type import changed. Please run a FRONTEND regression of gameplay: quick play, tutorial, highway/notes/wavy render, taps/keyboard hits, swipe, pause/resume/restart/exit, themes backdrop + cover disc, results."
