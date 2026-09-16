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
