# Development Plan — FREA! (Treesh Arcade)

## 1) Objectives
- Ship an upgraded **self‑contained** `games/frea.html` (served at `treesh.app/games/frea`) with noticeably improved:
  - **Character rendering + customization** (detailed, cohesive, modern model)
  - **UI polish** (desktop-responsive layout + readable HUD)
  - **Game environments** (beautiful, cohesive art direction)
  - **Mode completeness + stability** (bug-squash across *all* modes)
  - **Sims‑like Zen gameplay** (Flea House life‑sim + upgraded Zen Sandbox)
- Implement **Treesh profile + Starlites** integration:
  - Read `treesh_profile` (nickname, birthday, zodiac, avatar) and surface it in-game.
  - Award Starlites into the parent schema `treesh_stars` **safely** with a ledger + reconciliation (survive parent overwrites).
- Add **Achievements/Trophies** across all modes with UI, persistence, and Starlites rewards.
- Expand Zen/Flea House into a deeper “life‑sim” loop with:
  - **Backyard Garden** (plant → water → grow → harvest) that pays Starlites with a daily cap.
  - **Seasonal Furniture** packs that rotate through the year.
  - **Weather system** (rain/snow) that makes the yard feel alive.
- Ensure **live balance sync** when embedded in the Treesh arcade iframe: parent counters update instantly when trophies/rewards are earned.

**Current focus (next):**
- Keep iterating: make each mode even richer (more variants, more items/powerups, better readability).
- **Treesh profile card Trophy showcase** (requested/queued).
- Continued polish of **Starlites rewards UX**.

---

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
**Status:** ✅ Implemented (iterative)
- Updated flea renderer to the new “reference look” (glossy eyes, blush, wings, antennae, etc.).
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
- Trophy system (`src/trophies.js`) with persistence + UI.
- Trophy unlock verified to grant Starlites and show toast.

#### 6) Zen mode → “Flea House” Sims-like
**Status:** ✅ Done (verified) + ongoing polish
- Zen chooser offers **Flea House** or **Sandbox**.
- Flea House implemented: rooms, furniture buy/place/rotate, needs/autonomy, painting, upstairs unlock, save slots.
- **Fix:** reduced Flea House name-tag overlap via `hideName` flag.

#### 7) UI/UX polish pass
**Status:** ✅ Implemented
- Profile card + Trophy Room UI, lobby polish, rewards breakdown, updated typography/styles.

---

### Phase 3 — Expansion + hardening
**Status:** ✅ Implemented

1) **Backyard Garden (Flea House)**
**Status:** ✅ Implemented + verified
- Yard area added left of the house (`x = -660..-14`) with back door, fence, tree, sign and lamp.
- 5 raised beds; 6 seeds: strawberry, carrot, grapes, sunflower, watermelon, **moon pumpkin**.
- Growth requires water; water drains at `0.35/min`.
- Offline growth supported (up to `720` minutes) using `savedAt`.
- Fleas water/harvest autonomously (and can be directed).
- Garden drawer UI: bed cards + **Water all**, **Harvest all**, **Picnic**.
- Garden Starlites capped at **160 ✦/day**.
- Yard accepts floor/surface furniture but prevents placement on bed bounds.

2) **Seasonal Furniture (rotating packs)**
**Status:** ✅ Implemented + verified
- Module: `src/seasonal.js` injected before `trophies.js` via `build.py`.
- Packs rotate by date with “days left” and locked preview.
- Debug date override: `localStorage.frea_debug_date` or `?freadate=YYYY-MM-DD`.

3) **Live Balance Sync (Treesh parent arcade)**
**Status:** ✅ Implemented + verified
- FREA posts `postMessage` events on wallet change.
- Parent listeners + storage sync.
- Verified: parent chip increments instantly on trophy unlock.

4) **Trophies + “What’s New” update**
**Status:** ✅ Implemented + verified
- Added new trophies for Garden + Seasonal progression (**55 trophies total**).
- Added “Backyard Garden” and “Seasonal Furniture” to the home “What’s New” carousel.

---

### Phase 4 — Party Mode + New Modes + Unified HUD
**Status:** ✅ Implemented + ✅ re-validated via testing

#### 1) Add new arcade game modes (koth/lava/stars/redlight/freeze)
**Status:** ✅ Implemented
- Implemented in `src/modes.js` using `EXTRA_MODES` plugin hooks and `MODE_INTRO` integration.

#### 2) Party Mode
**Status:** ✅ Implemented
- Implemented in `src/party.js` + `src/party.css` with playlist setup and rotation logic.

#### 3) Unified HUD + clearer instructions
**Status:** ✅ Implemented
- Implemented in `src/hud.js` + `src/hud.css`.

#### 4) Zen Mode Sandbox modularization + interactivity upgrades
**Status:** ✅ Implemented + ✅ tested
- New modules: `src/actions.js`, `src/zenart.js`, `src/zenplay.js` + `src/zenplay.css`.
- Zen sandbox interactivity: pick up/carry/throw/stack/push/sit + item-specific actions.
- Persistent wear-on-head for player hat (`window.__fleaHeadHook`).
- Flea emotes/actions updated (dance/spin/wave/etc.).
- Desktop UI polish for Zen prompts and layout.

#### 5) Red Light, Green Light playability fix
**Status:** ✅ Implemented + ✅ tested
- **Map length extended** via `RL.bounds()` to 9k–16k world units.
- **All fleas start together** at the start line (`RL.lineUp()`), preventing immediate failures.

#### 6) Fix testing-agent “Play button not stable” blocker
**Status:** ✅ Implemented + ✅ tested
- Root cause: infinite `transform` animation made the Play button “not stable” in automation.
- Fix: changed Play button breathe animation from `transform` → `filter: brightness(...)` pulse.
- File: `src/base.html` (`@keyframes playBreathe`).

---

### Phase 5 — Mode Depth + HUD Overhaul v2 + Results Screen v3
**Status:** ✅ Completed + ✅ tested (iteration_3: 100% pass)

#### 1) Mode Depth System (Power-ups + per-mode twists)
**Status:** ✅ Completed
- New module: `src/modeplus.js`.
- Shared power-up system:
  - **Turbo** (speed), **Shield**, **Magnet** (Star Rush), **Cure** (Infectious), **Ice Burst** (Freeze Tag)
  - Spawn rules per mode; safe placement; glow rendering; pickup collision; timers.
- Per-mode depth implemented:
  - **Capture:** overcharge window + steal-bump knockback
  - **Race:** boost pads + checkpoints/splits
  - **Burning Orb:** fuse speeds up per pass; shield blocks hot-orb steal
  - **Infectious:** cure pickups; last-stand sprint
  - **Hide & Seek:** seeker radar pulse (Q); hider taunt (Q) that shaves seek time
  - **Hoops:** streak → ON FIRE bonus
  - **KOTH:** zone shrink + Golden Hill final 15s
  - **Lava:** geyser hazards
  - **Stars:** star showers + combos + magnet
  - **Red Light:** boost pads + occasional fake-out
  - **Freeze Tag:** ice burst effects + rescue streaks

#### 2) HUD Overhaul v2
**Status:** ✅ Completed
- New modules: `src/hud2.js`, `src/hud2.css`.
- Features:
  - Portrait standings panel with score bars and “YOU” tag
  - Mode goal meter (dynamic per mode)
  - Timer progress bar + final-10 alerts
  - Event feed + alert system
  - Active power-up chips
  - Hide & Seek ability button

#### 3) Results Screen v3 redesign ("more taste")
**Status:** ✅ Completed + ✅ tested
- Replaced “ugly” end screen with a tasteful **hero + standings + awards** layout:
  - Left hero panel with big gradient title (Victory / So close), mode chips, winner pedestal
  - Right panel with standings list, awards cards, compact Starlites strip, and clean actions
  - Responsive stacking on mobile

#### 4) Build + wiring
**Status:** ✅ Completed
- Updated `/app/games/build.py`:
  - CSS includes `hud2.css`
  - JS includes `modeplus.js` after `modes.js`, and `hud2.js` after `hud.js`

#### 5) Testing + validation
**Status:** ✅ Completed
- Frontend testing agent report: `iteration_3.json` (100% pass).

---

### Phase 6 — Backyard Garden Weather + Thick-Floor HUD Fix
**Status:** ✅ Completed + ✅ tested (iteration_4: 100% pass)

#### 1) Weather system (Flea House yard)
**Status:** ✅ Completed
- Implemented in `src/house.js`:
  - Weather chip in top bar (Auto/Locked): Sunny/Cloudy/Rain/Snow
  - **Rain** visuals: clouds + rain streaks + puddles/splashes
  - **Snow** visuals: flakes + snow caps/blanket; slows water loss
  - **Rain auto-waters** planted beds over time
  - Garden drawer shows a rain/snow badge when applicable
- Styling: `src/polish.css` (weather chip + garden badge)

#### 2) Thick-floor HUD fix (bottom UI no longer blocks fleas)
**Status:** ✅ Completed
- Goal: bottom HUD elements (emote button, mobile goal meter, RL track) should sit “inside” a thicker floor band, not on top of fleas.
- Implementation:
  - `src/base.html`: introduced global `FLOOR_PAD` and allowed camera to scroll below the original world height.
  - `src/hud2.js`: `floorFit()` measures bottom UI height and sets `FLOOR_PAD` dynamically.
  - `src/modes.js`: RL progress track is positioned to appear centered within the new floor band.
  - `src/hud2.css`: mobile layout tuned (hide mode banner during play; bottom meter placement).

#### 3) Testing + validation
**Status:** ✅ Completed
- Frontend testing agent report: `iteration_4.json` (100% pass).

---

## 3) Next Actions
### Next (P1)
1) **Treesh profile card — Trophy showcase**
   - Add a compact trophy summary strip to the Treesh profile card.
   - Display:
     - total trophies, recent trophies, and a “View Trophy Room” deep link.
   - Ensure it reads from the same storage schema and behaves correctly inside the Treesh iframe.

2) **Starlites reward UX polish**
   - Make payouts clearer and more celebratory (without being noisy): better copy, better grouping, and optional per-mode breakdown.
   - Ensure rewards are never duplicated and ledger reconciliation remains correct.

3) **Mode depth expansion (v2)**
   - Add more variety per mode: more pad types, more power-up variety, and round modifiers.
   - Add anti-frustration: pacing, catch-up boosts, and clearer “what just happened” feedback.

4) **Extended QA**
   - Run `testing_agent` after each major feature addition.
   - Add more scripted test paths (Party Mode multi-round, Zen Sandbox hats persistence, weather auto-watering proof, etc.).

---

## 4) Success Criteria
- `treesh.app/games/frea` loads as a single file and plays smoothly on desktop + mobile.
- Player name/avatar reflect `treesh_profile` without breaking existing local saves.
- Avatar robustness: non-image avatars (e.g. emoji) do not break UI.
- Starlites awards:
  - Write into `treesh_stars` with correct log entries.
  - Survive parent overwrites via reconciliation (no duplicate awards).
  - When embedded, parent UI updates **immediately**.
- Every mode feels “finished” and **deep**:
  - Added per-mode mechanics (power-ups + twists) create replayable variety.
  - Clear goals (HUD v2), readable standings, helpful event feed and alerts.
- **Red Light, Green Light:**
  - Map is “way longer”.
  - All fleas start together.
  - No immediate failures; mode is playable.
- **Zen Sandbox:**
  - Items render correctly and support: pick up/carry/throw/stack/push/sit + item-specific actions.
  - Wear-on-head is persistent for the player.
  - Flea action animations are visibly animated.
- **Results Screen v3:**
  - Tasteful layout, responsive, shows standings + awards + rewards, with clean actions.
- **Thick-floor HUD:**
  - Bottom HUD UI no longer blocks fleas; UI appears centered inside the floor band.
- **Backyard Garden Weather:**
  - Rain waters beds automatically and looks beautiful.
  - Snow visuals render cleanly and do not harm performance.
- Documentation/workflow remains correct:
  - Never edit `frea.html` directly; always edit `src/*` and rebuild.

### Test Evidence
- `test_reports/iteration_3.json`: Mode depth + HUD v2 + results screen v3 (✅ 100%).
- `test_reports/iteration_4.json`: Thick-floor HUD + Weather (✅ 100%).

---
## Phase 5 — Rewards economy, Showcase, Zen editor, new key art (Status: In Progress → testing)
User choices: Showcase = 3 pinned favourites + Rarest/Recent auto rows + full scrollable grid. Starlites earned via wins, trophies, daily streak (+ new daily quests). Spend on cosmetics, arenas & themes, furniture. Art: polished 3D Pixar-like, OpenAI gpt-image-1 (Emergent key).
- `src/rewards.js/.css`: Starlite Shop (lobby "Shop" button + Starlites pill) with Cosmetics (locks premium Studio items, grandfathered), Arenas (match backdrop override), Themes (UI accent + lobby scene), Furniture bundles (→ `frea_house_stash_v1`, placed free in Flea House), Earn (3 daily quests, streak track). Trophy showcase in Treesh profile card + Trophy Room pins + lobby chip medals; publishes `treesh_trophies` for parent.
- `/app/parent/index.html`: profile header trophy strip + new "Trophies" tab (showcase, Rarest/Recent, full grid). Copied to `frontend/public/treesh-test/index.html` with local game URL.
- `src/zenedit.js/.css`: Worlds dropdown removed (Worlds tab only). Select-first editor: tap select, drag move, handles resize/stretch, chip (Copy/Type/Front/Delete), Undo, Snap grid, keyboard shortcuts.
- `art/gen_tiles.py` → `src/tiles.js/.css`: 13 new mode images + Party banner; base.html FREA_TILES replaced; Party card taller with photo.

## Bug Fix: Shop confirm Cancel overlay interception (Status: COMPLETED)
- rewards.js: only one confirm overlay at a time; closing overlay gets pointer-events:none immediately; Escape closes it; Cancel is auto-focused; open() ignores unknown tab names
- rewards.css: confirm card/buttons layered above backdrop, 44px touch targets
- Verified with normal (non-forced) clicks at 390x844 and 1920x800

## Phase: Copycat Mode + Per-Mode Settings (Status: In Progress)
User decisions:
- Copy targets: moves (hop, big leap, left/right, crouch) + every action emote
- Win formats are ALL settings: (a) Rounds: last flea with hearts wins the round, new random leader each round, best of 3; (b) Single leader, last copier standing; (c) Timed survival (e.g. 90s), survivors score, leader scores if it knocks out 2+
- If the player is picked as leader, they perform moves/emotes and CPU copiers try to keep up
- Copy window: Easy 3s / Normal 2s / Hard 1s; separate Hearts toggle (3 or 1)
- Leader sits high on a perch and never leaves it
- Generate a 3D Pixar-style tile with gpt-image-1 (art/gen_tiles.py)
- EXTRA: every game mode must have a settings button and its own settings tab
