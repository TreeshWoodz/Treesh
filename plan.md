# Development Plan — FREA! (Treesh Arcade)

## 1) Objectives
- Ship an upgraded **self‑contained** `games/frea.html` (served at `treesh.app/games/frea`) with noticeably improved:
  - **Character rendering + customization** (detailed, cohesive, modern model)
  - **UI polish** (including a standalone character creator)
  - **Game environments** (beautiful, cohesive art direction)
  - **Mode completeness + stability** (bug-squash across *all* modes)
  - **Sims‑like Zen gameplay** (Flea House life-sim + upgraded Zen Sandbox)
- Implement **Treesh profile + Starlites** integration:
  - Read `treesh_profile` (nickname, birthday, zodiac, avatar) and surface it in-game.
  - Award Starlites into the parent schema `treesh_stars` **safely** with a ledger + reconciliation (survive parent overwrites).
- Add **Achievements/Trophies** across all modes with UI, persistence, and Starlites rewards.
- Expand Zen/Flea House into a deeper “life‑sim” loop with:
  - **Backyard Garden** (plant → water → grow → harvest) that pays Starlites with a daily cap.
  - **Seasonal Furniture** packs that rotate through the year.
- Ensure **live balance sync** when embedded in the Treesh arcade iframe: parent counters update instantly when trophies/rewards are earned.
- **NEW (current focus): Make every mode deeper + HUD overhaul**
  - Add **mode-depth mechanics** (power-ups + per-mode twists) so each mode feels richer and replayable.
  - Upgrade the **gameplay HUD/UI** across the board: clearer goals, better standings, better alerts, better results.
- **NEXT (user-approved after HUD/mode depth): Backyard Garden weather**
  - Rain auto-waters garden beds.
  - Snow visuals (and optional light gameplay effects if desired later).

## 2) Implementation Steps

### Phase 1 — Core POC (isolation first)
**Status:** ✅ Completed and superseded by full modular implementation.

Completed outcomes:
- Treesh bridge with ledger + reconcile implemented (module: `src/treesh.js`).
- Zen “house” vertical slice expanded into full **Flea House** (module: `src/house.js`).

### Phase 2 — V1 App Development (big upgrade pass)
**Deliverable:** upgraded `games/frea.html` built from modular sources and inlined.

#### 1) Repo + build structure
**Status:** ✅ Done
- Source modularization under `/app/games/src/*`.
- Build script: `/app/games/build.py` concatenates modules into a single-file `games/frea.html`.
- **Rule documented:** do not edit `frea.html` directly; edit `src/*` and rebuild.

#### 2) Character model overhaul (match reference image)
**Status:** ✅ Implemented (pending ongoing iteration)
- Updated flea renderer to new “reference look” (glossy eyes, blush, wings, antennae, etc.).
- Named cast integrated via `src/style.js`.

#### 3) Treesh profile in-game
**Status:** ✅ Done (+ hardening fix)
- Lobby uses `treesh_profile.nickname` and avatar.
- **Fix:** avatars treated as images only if they look like URLs/data-URIs/paths; emoji avatars fall back to an initial.
- **Fix:** `img.onerror` fallback prevents broken image UI.

#### 4) Starlites system (parent-compatible)
**Status:** ✅ Done (verified)
- Starlites stored in `treesh_stars` and journaled in `frea_star_ledger_v1`.
- Reconciliation verified: if `treesh_stars` is overwritten from stale parent memory, missing ledger awards are re-applied exactly once.

#### 5) Achievements/Trophies (all modes)
**Status:** ✅ Done (verified)
- Implemented trophy system (`src/trophies.js`) with persistence + UI.
- Trophy unlock verified to grant Starlites and show toast.

#### 6) Zen mode → “Flea House” Sims-like
**Status:** ✅ Done (verified) + minor polish
- Zen chooser offers **Flea House** or **Sandbox**.
- Flea House implemented: rooms, furniture buy/place/rotate, needs/autonomy, painting, upstairs unlock, save slots.
- **Fix:** reduced Flea House name-tag overlap via `hideName` flag (base flea draw + house label declutter logic).

#### 7) UI/UX polish pass
**Status:** ✅ Implemented
- Profile card + Trophy Room UI, lobby polish, rewards breakdown, updated typography/styles.

### Phase 3 — Expansion + hardening
**Status:** ✅ Implemented (Phase 4 changes folded in)

1) **Backyard Garden (Flea House)**
**Status:** ✅ Implemented + verified via screenshots
- Yard area added left of the house (`x = -660..-14`) with back door, fence, tree, sign and lamp.
- 5 raised beds; 6 seeds:
  - strawberry, carrot, grapes, sunflower, watermelon, **moon pumpkin**.
- Crops only grow while watered; water drains at `0.35/min`.
- Offline growth supported (up to `720` minutes) using `savedAt`.
- Fleas water/harvest autonomously (and can be directed), with a dedicated `act k:'garden'` and faster walk speed to beds.
- Garden drawer UI: bed cards + **Water all**, **Harvest all**, **Picnic**.
- Garden Starlites capped at **160 ✦ per day**.
- Yard accepts floor/surface furniture but prevents placement on bed bounds.

2) **Seasonal Furniture (rotating packs)**
**Status:** ✅ Implemented + verified via screenshots
- New module `src/seasonal.js` injected before `trophies.js` via `build.py`.
- Packs rotate by date with “days left” and locked preview.
- Debug date override supported via `localStorage.frea_debug_date` or `?freadate=YYYY-MM-DD`.

3) **Live Balance Sync (Treesh parent arcade)**
**Status:** ✅ Implemented + verified with a local parent test page
- FREA posts `postMessage` events on wallet change.
- Parent app updated with message listeners + storage sync.
- Verified: parent chip increments instantly on trophy unlock.

4) **Trophies + “What’s New” update**
**Status:** ✅ Implemented + verified
- Added 7 new trophies for Garden + Seasonal progression (**55 trophies total**).
- Added “Backyard Garden” and “Seasonal Furniture” to the home “What’s New” carousel.

### Phase 4 — Party Mode + New Modes + Unified HUD
**Status:** ✅ Implemented + ✅ partially re-validated this session

#### 1) Add new arcade game modes (koth/lava/stars/redlight/freeze)
**Status:** ✅ Implemented
- Implemented in `src/modes.js` using `EXTRA_MODES` plugin hooks and `MODE_INTRO` integration.

#### 2) Party Mode
**Status:** ✅ Implemented
- Implemented in `src/party.js` + `src/party.css` with playlist setup and rotation logic.

#### 3) Unified HUD + clearer instructions
**Status:** ✅ Implemented
- Implemented in `src/hud.js` + `src/hud.css`.

#### 4) Zen Mode Sandbox modularization + interactivity upgrades (newest requirements)
**Status:** ✅ Implemented (testing coverage pending re-run)
- New modules added: `src/actions.js`, `src/zenart.js`, `src/zenplay.js` + `src/zenplay.css`.
- Zen sandbox interactivity implemented: pick up/carry/throw/stack/push/sit + item-specific actions.
- Persistent wear-on-head behavior for player hat (via `window.__fleaHeadHook` integration).
- Flea emotes/actions updated (dance/spin/wave/etc.).
- Desktop UI polish for Zen prompts and layout.

#### 5) RLGL playability fix
**Status:** ✅ Implemented + ✅ verified via gameplay screenshot runs
- **Map length extended** via `RL.bounds()` to 9k–16k world units.
- **All fleas start together** at the start line (`RL.lineUp()`), preventing immediate failures.

#### 6) Fix testing-agent “Play button not stable” blocker
**Status:** ✅ Implemented
- Playwright reported the `#play-btn` as “not stable” due to infinite transform animation.
- Fix: changed the **PLAY button breathe animation** from `transform: translateY(...)` to a `filter: brightness(...)` pulse so automated clicking is stable.
- File updated: `src/base.html` (`@keyframes playBreathe`).

> Note: the previous testing_agent report is now outdated because the blocker has been fixed. A fresh testing_agent run is required.

---

### Phase 5 — Mode Depth + HUD Overhaul (NEW current)
**Status:** ⏳ Not started

**Goal:** expand each mode’s depth (mechanics + variety) and deliver a stronger, more legible HUD across all gameplay.

#### 1) Mode Depth System (Power-ups + per-mode twists) (P0)
**Status:** ⏳ Not started
- Create new module: `src/modeplus.js`
  - Shared **pickup/power-up** framework:
    - Spawn rules per mode; placement safety checks (not inside walls; accessible).
    - Rendering (glow + icon), collision pickup, duration timers, stacking/refresh rules.
    - Effects system (speed, shield, magnet, cure, ice, etc.).
  - Per-mode depth additions (initial scope):
    - **Capture (classic):** overcharge window; steal-bump knockback; optional “orb ping” indicator.
    - **Race:** boost pads; checkpoints; split-time “ghost” pips.
    - **Burning Orb (survival):** fuse accelerates each pass; shield pickup prevents 1 explosion.
    - **Infectious (tag):** cure pickup; “last stand sprint” for final safe flea.
    - **Hide & Seek (hns):** seeker radar pulse ability (e.g., `Q`); hider taunt to earn points at risk (e.g., reduces seek timer / provokes).
    - **Hoops:** streak multiplier; “ON FIRE” state after 3 makes in a row.
    - **King of the Hill:** zone shrinks over time; contested warning; “golden hill” final 15s.
    - **Floor is Lava:** lava geysers; height meter + survival ticks.
    - **Star Rush:** star showers; combo scoring; magnet power-up.
    - **Red Light, Green Light:** warning before red; boost pads; optional “fake-out” light.
    - **Freeze Tag:** ice burst ability for IT; rescue counter + short immunity for rescued.

**Integration points:**
- Hook into the main loop via existing `XM().tick/drawFront/drawBack/score` pathways.
- Keep effects data on flea objects (e.g., `f.pu = {speedUntil,...}`) to avoid deep engine changes.

#### 2) HUD Overhaul v2 (P0)
**Status:** ⏳ Not started
- Create new modules:
  - `src/hud2.js`
  - `src/hud2.css`
- HUD v2 features:
  - **Portrait standings panel** (faces + bars + “YOU” highlight) replacing/augmenting scoreboard.
  - **Goal meter** (top-center) that reflects each mode’s primary objective:
    - Capture: ring/capture progress
    - KOTH: hill %
    - Stars: star points
    - Red Light: course %
    - Lava: height/safe band
    - etc.
  - **Timer ring** around the timer chip with final-10 pulse + “FINAL 10!” banner.
  - **Alerts system** (FINAL 10, FINAL TWO, LAST STAND, CONTESTED, ON FIRE).
  - **Event feed** (lightweight log) + wrap/merge existing `flash()` messages.
  - **Active power-up chips** + ability button mapping.
  - **Results upgrade:** podium + mode stats + fun awards (MVP / Most Hops / Clutch / Most Rescues, etc.).

**Compatibility:**
- Keep `src/hud.js` as the baseline; layer `hud2.js` after it and override/enhance behavior.

#### 3) Build + wiring (required) (P0)
**Status:** ⏳ Not started
- Update `/app/games/build.py`:
  - CSS: add `hud2.css`
  - JS: add `modeplus.js` and `hud2.js`
  - **Ordering requirements:**
    - `modeplus.js` must load **after** `modes.js`.
    - `hud2.js` must load **after** `hud.js`.

#### 4) Testing + validation (P0)
**Status:** ⏳ Not started (must be done after Phase 5 changes)
- Run frontend `testing_agent` and screenshot runs:
  - Re-verify **RLGL** (long map + shared start) still passes.
  - Verify **Zen sandbox interactivity** remains stable after any HUD/power-up wiring changes.
  - Verify new power-ups spawn, animate, apply effects, expire, and never softlock rounds.
  - Verify HUD2 readability at desktop resolutions (1920×1080, 1366×768) and mobile widths.

### Phase 6 — Backyard Garden Weather (NEXT after Phase 5)
**Status:** ⏳ Not started
- Implement **rain auto-watering** behavior:
  - Rain overlay (visual) and periodic bed watering increment while raining.
  - Ensure daily payout cap remains respected.
- Implement **snow visuals**:
  - Snow overlay + scene tint; optional non-gameplay-only for v1.
- Hook into existing Zen “Magic” overlays if appropriate, but ensure Flea House yard can have weather independent of sandbox toggles.

## 3) Next Actions
1) **Phase 5 implementation (blocking):**
   - Implement `src/modeplus.js` (power-ups + per-mode depth mechanics).
   - Implement `src/hud2.js` + `src/hud2.css` (HUD v2).
2) **Build + integration (blocking):**
   - Update `build.py` to include new modules; rebuild (`python3 /app/games/build.py`).
3) **Testing mandate (blocking):**
   - Run the frontend `testing_agent` focusing on RLGL + Zen sandbox + new mode depth + HUD.
   - Fix regressions and rerun `testing_agent` until clean.
4) **Phase 6:**
   - Implement Backyard Garden weather (rain auto-water + snow visuals).

## 4) Success Criteria
- `treesh.app/games/frea` loads as a single file and plays smoothly on desktop + mobile.
- Player name/avatar reflect `treesh_profile` without breaking existing local saves.
- Avatar robustness: non-image avatars (e.g. emoji) do not break UI.
- Starlites awards:
  - Write into `treesh_stars` with correct log entries.
  - Survive parent overwrites via reconciliation (no duplicate awards).
  - When embedded, parent UI updates **immediately** (message + storage sync) and parent memory never overwrites game awards.
- Every mode feels “finished” and **deep**:
  - Clear goals, readable HUD, satisfying end screen + rewards.
  - Added per-mode mechanics (power-ups + twists) create replayable variety.
- **Red Light, Green Light:**
  - Map is “way longer” (multi-screen race).
  - All fleas start together at the start line.
  - No immediate failures; mode is playable and fun.
- Zen Sandbox:
  - Items render correctly and support: pick up/carry/throw/stack/push/sit + item-specific actions.
  - Wear-on-head is persistent for the player.
  - Flea action animations are visibly animated (dance/spin/wave/etc.).
- HUD v2:
  - Portrait standings, goal meter, timer ring, alerts, and results podium work across all modes.
  - UI is responsive and unclipped at 1920×1080 and 1366×768.
- Backyard Garden Weather:
  - Rain waters beds automatically and looks beautiful.
  - Snow visuals render cleanly and do not break performance.
- Documentation/workflow remains correct:
  - Never edit `frea.html` directly; always edit `src/*` and rebuild.