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
- Finalize delivery by confirming with the user that the visuals (character style + environments + Zen features) meet expectations.

## 2) Implementation Steps

### Phase 1 — Core POC (isolation first)
**Status:** ✅ Completed and superseded by full modular implementation.

**Original risks addressed:** cross-app Starlites consistency + Zen “Sims” loop.

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
- Updated the flea renderer to the new “reference look” (glossy eyes, blush, wings, antennae, etc.).
- Named cast integrated via `src/style.js`.

#### 3) Treesh profile in-game
**Status:** ✅ Done (+ hardening fix)
- Lobby uses `treesh_profile.nickname` and avatar.
- **Fix:** avatars are treated as images only if they look like URLs/data-URIs/paths; emoji avatars fall back to an initial.
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
- **Fix:** reduced Flea House name-tag overlap via a `hideName` flag (base flea draw + house label declutter logic).

#### 7) Polish all game modes (finish/complete)
**Status:** ✅ Verified load stability
- Automated/manual smoke checks confirm: `race`, `survival`, `tag`, `hoops`, `classic`, `zen`, `hns` all load and run with **0 runtime errors** in testing.

#### 8) UI/UX polish pass
**Status:** ✅ Implemented
- Profile card + Trophy Room UI, lobby polish, rewards breakdown, updated typography/styles.

#### 9) Testing (agent)
**Status:** ✅ Done
- Screenshot-tool / Playwright smoke coverage across all modes.
- Verified: trophy → starlites award, reconcile behavior, Flea House entry.

### Phase 3 — Expansion + hardening
**Status:** ✅ Implemented (Phase 4 changes folded in)

1) **Backyard Garden (Flea House)**
**Status:** ✅ Implemented + verified via screenshots
- Yard area added left of the house (`x = -660..-14`) with back door, fence, tree, sign and lamp.
- 5 raised beds; 6 seeds:
  - strawberry, carrot, grapes, sunflower, watermelon, **moon pumpkin**.
  - Each has price, grow time (game minutes) and Starlite reward.
- Crops only grow while watered; water drains at `0.35/min`.
- Offline growth supported (up to `720` minutes) using `savedAt`.
- Fleas water/harvest autonomously (and can be directed), with a dedicated `act k:'garden'` and faster walk speed to beds.
- Garden drawer UI: bed cards + **Water all**, **Harvest all**, **Picnic** (consumes pantry snacks and boosts needs).
- Garden Starlites are capped at **160 ✦ per day**.
- Yard accepts floor/surface furniture but prevents placement on bed bounds.

2) **Seasonal Furniture (rotating packs)**
**Status:** ✅ Implemented + verified via screenshots
- New module `src/seasonal.js` injected before `trophies.js` via `build.py`.
- 6 packs by date:
  - Winter (Dec 1–Feb 28), Valentine (Feb 1–16), Spring (Mar–May), Summer (Jun–Aug), Autumn (Sep–Nov), Spooky (Oct 10–Nov 2).
- 25 new furniture pieces (art implemented via `Furni.add()` + shared helpers `Furni.h`).
- Buy shop defaults to **Seasonal** category with:
  - Pack headers with “days left”.
  - Locked “Coming up” pack preview.
  - Out-of-season purchase guard.
- Debug date override supported via `localStorage.frea_debug_date` or `?freadate=YYYY-MM-DD`.
- “New pack” dot indicator on Buy tab.

3) **Live Balance Sync (Treesh parent arcade)**
**Status:** ✅ Implemented + verified with a local parent test page
- FREA! now posts `postMessage` events on every wallet change:
  - `{type:'treesh:stars', v:2, entry:{id,t,a,r}, meta:{kind,icon}}`.
  - Trophy awards send `kind:'trophy'`.
- Parent app (`/app/parent/index.html`) updated (CRLF preserved; original saved as `index.original.html`):
  - Storage + message listeners.
  - `syncStarsFromStorage()` to keep `state.stars` in sync (prevents stale overwrite).
  - `gf-stars` chip in game-frame header and animated `+N` float.
  - Optional parent toast for trophy awards while the game is minimized.
- Test harness served at `/treesh-test/index.html` with FREA URL pointed at `/games/frea.html`.
- Verified: parent chip increments instantly on trophy unlock, parent memory matches storage, and parent awards don’t clobber game awards.

4) **Trophies + “What’s New” update**
**Status:** ✅ Implemented + verified
- Added 7 new trophies for Garden + Seasonal progression (**55 trophies total**).
- Added “Backyard Garden” and “Seasonal Furniture” to the home “What’s New” carousel.

### Phase 4 — Verification + Delivery
**Status:** 🔄 In progress
1) Run the testing agent (screenshot-tool / Playwright) to:
   - Validate garden interactions (plant/water/harvest/picnic) + daily cap.
   - Validate seasonal shop (active packs, locked packs, out-of-season guard, debug date).
   - Validate live sync in embedded parent frame (chip updates, no overwrites, minimized toast).
2) Documentation pass:
   - Update `games/README.md` with new modules (`seasonal.js`), garden data, debug flags (`frea_debug_date`, `?freadate=`).
   - Update `/app/memory/PRD.md` with Phase 4 feature summary.
3) User verification:
   - Confirm character visuals match reference.
   - Confirm Zen/Flea House feel (furniture placement + garden loop + seasonal shop pacing).

### Phase 5 — Studio + Environments + Zen Sandbox+ + Bug Sweep (current)
**Status:** 🔄 In progress

#### 1) Standalone Character Studio modal (P0)
**Status:** ✅ Implemented + wired
- New standalone, visual character customizer:
  - `src/studio.js` + `src/studio.css`.
  - Tile-based selection with live flea preview, roster switching, undo, randomize.
  - Opened from lobby **Customize** button.
- Legacy “Customize” tab removed from profile modal UI (kept hidden as a compatibility/data source layer for selects + OPT lists).

#### 2) Detailed, cohesive customization art for **ALL** parts (P0)
**Status:** ✅ Implemented + iterating
- New unified rendering pass for all customization options in `src/parts.js`:
  - Redrawn hats, glasses, wings, capes, accessories, mouths, eyes, antenna variants, brows in a cohesive “glossy jelly-toy” style.
  - Alignment normalized to the Style-2.0 face.
  - RNG seeding to prevent flicker for hair + glitter/pattern details.
- Added new options:
  - Hats: `tiara`, `bunny`, `cat`, `headphones`, `propeller`, `beret`
  - Glasses: `nerd`, `goggles`
  - Wings: `bat`, `crystal`
  - Capes: `star`, `custom` (accent color)
  - Accessories: `bowtie`, `flowerlei`
  - Mouths: `cat`, `teeth`
  - Eyes: `sparkle`, `cat`
- Bug fixes:
  - Removed stray mouth ring from Style 2.0 (`src/style.js`).

#### 3) Environments redesign + new environments (P1)
**Status:** ✅ Implemented (needs playtest and tune)
- New parallax scene engine (`src/arenas.js`): cached, layered, neon-cozy art direction.
- **Arcade rule (A): one themed arena per mode**
  - `classic` → Crystal Kingdom
  - `race` → Sunset Speedway
  - `survival` → Ember Peaks
  - `tag` → Slime Swamp
  - `hns` → Moonlit Grove
  - `hoops` → Rooftop Court
  - `tutorial/title` → Neon Meadow
- **Zen rule (B): multiple pickable worlds**
  - Rebuilt all prior Zen worlds on the new engine (now selectable via env chip).
  - Added 6 new worlds:
    - Sakura Garden, Cloud Kingdom, Northern Lights, Glow Shroom Forest, Autumn Park, Neon Lagoon
- Improvements:
  - Themed ground band replaces the pale floor slab.
  - Floor platform set to `wall=true` only when it’s the normal ground platform so it stops visually clashing.
  - Fix: sun stripes now clip correctly (no punching holes in sky).
- Debug helper:
  - `FreaArenas.start(mode, env)` to jump into a mode/environment for testing.

#### 4) Zen Sandbox UI + features upgrade (P1)
**Status:** ✅ Implemented (needs bug-sweep + mobile validation)
- `src/zenplus.js` + `src/zenplus.css`:
  - Dock restyle (glass, larger tiles).
  - New **Worlds** tab with painted thumbnails.
  - New **Magic** tab:
    - Weather overlays (rain/snow/petals/confetti/fireflies)
    - Time of day overlay (day/sunset/night)
    - Gravity presets (moon/normal/heavy)
    - Party mode (lights + auto group emotes)
    - Group emotes (dance/wave/flip)
    - Flea rain (spawn extra fleas overhead)
    - Photo mode (download canvas PNG; hides HUD temporarily)
  - Fix: dock position no longer overlaps emote FAB on desktop.
  - Themed prop spawning for new worlds (maps to existing prop sets).

#### 5) Comprehensive bug sweep in Zen Sandbox + all modes (P1)
**Status:** ⏳ Not started (next)
- Full playtest + screenshot/Playwright run across:
  - Character Studio open/close flows + persistence
  - Every arcade mode with new arenas
  - Zen Sandbox+ (Worlds/Magic, edit mode, spawn/clear, props)
  - Flea House (furniture placement, shop, garden, seasonal packs)
- Fix any regressions found.

#### 6) Documentation updates (P2)
**Status:** ⏳ Not started (next)
- Update `games/README.md` with Phase 5 modules:
  - `arenas.js`, `parts.js`, `studio.js`, `zenplus.js` and new CSS files.
  - Debug helpers/flags (`FreaArenas.start`, ZenPlus state storage key `frea_zenplus`).
- Update `/app/memory/PRD.md` with Phase 5 summary and UX notes.

**Current build ordering**
- CSS: `polish.css`, `studio.css`, `zenplus.css`
- JS: `treesh.js`, `style.js`, `parts.js`, `furni.js`, `seasonal.js`, `trophies.js`, `house.js`, `polish.js`, `arenas.js`, `zenplus.js`, `studio.js`

## 3) Next Actions
1) **Bug sweep (blocking):**
   - Run screenshot-tool/Playwright across Studio + all modes + Zen Sandbox+ + Flea House.
   - Fix any runtime errors, UI overlap issues (esp. mobile), broken interactions, or persistence issues.
2) **Performance pass (recommended):**
   - Ensure arena parallax stays smooth on low-end devices (respect `perfMode`).
   - Verify ZenPlus overlays don’t tank FPS.
3) **Docs (handoff readiness):**
   - Update README/PRD for Phase 5 modules + new worlds/options.
4) **User verification (blocking):**
   - Confirm the new customization model (all options) is cohesive and “awesome”.
   - Confirm environments match the desired neon‑cozy aesthetic.
   - Confirm Zen Sandbox+ features feel fun and intuitive.

## 4) Success Criteria
- `treesh.app/games/frea` loads as a single file and plays smoothly on desktop + mobile.
- Player name/avatar reflect `treesh_profile` without breaking existing local saves.
- Avatar robustness: non-image avatars (e.g. emoji) do not break UI.
- Starlites awards:
  - Write into `treesh_stars` with correct log entries.
  - Survive parent overwrites via reconciliation (no duplicate awards).
  - When embedded, parent UI updates **immediately** (message + storage sync) and parent memory never overwrites game awards.
- Every mode feels “finished”: clear goals, readable HUD, satisfying end screen + rewards.
- Environments:
  - Arcade: one cohesive, upgraded arena per mode.
  - Zen: multiple pickable worlds, including newly added ones.
- Character customization:
  - Standalone Character Studio is discoverable and pleasant.
  - Every customization option is cohesive, high-quality, and visually aligned.
  - New options persist correctly in `frea_v4`.
- Zen “Flea House” supports: build/buy, place/rotate/snap/stack, needs + autonomy, save/load.
- Zen Sandbox+ supports:
  - Build dock usability, worlds selection via thumbnails, magic toggles, photo mode.
  - No UI overlap with emote controls (desktop + mobile).
- Backyard Garden supports: plant/water/grow/harvest/picnic, autonomy + direct commands, offline growth, daily payout cap.
- Seasonal shop supports: rotating packs, locked coming-soon previews, out-of-season guard, debug date override.
- Achievements unlock reliably, show in UI, and grant stars once (now **55** trophies).
- Documentation exists so future edits use `src/*` + build step (no direct edits to `frea.html`).
