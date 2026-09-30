# Development Plan — FREA! (Treesh Arcade)

## 1) Objectives
- Ship an upgraded **self‑contained** `games/frea.html` (served at `treesh.app/games/frea`) with noticeably improved **character rendering**, **UI polish**, **mode completeness**, and a **Sims‑like Zen mode**.
- Implement **Treesh profile + Starlites** integration:
  - Read `treesh_profile` (nickname, birthday, zodiac, avatar) and surface it in-game.
  - Award Starlites into the parent schema `treesh_stars` **safely** with a ledger + reconciliation (survive parent overwrites).
- Add **Achievements/Trophies** across all modes with UI, persistence, and Starlites rewards.
- Preserve existing gameplay feel while improving clarity, feedback, fairness, and performance.
- Finalize delivery by confirming with the user that the visuals (character style + Zen mechanics) meet expectations.

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
**Status:** ✅ Implemented (pending user visual confirmation)
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
**Status:** ⏭ Deferred / optional backlog
1) Performance: cache gradients, reduce overdraw, offscreen canvas for furniture thumbnails.
2) Content: expand furniture set + interactions; add more room types.
3) Economy balance: prices, sinks, daily bonuses.
4) Robustness: save migrations (`*_v1`→`v2`), corruption recovery.
5) Optional parent snippet for live star UI sync via the `storage` event.

## 3) Next Actions
1) **User verification (blocking):**
   - Review character style vs reference image.
   - Review Zen / Flea House furniture drag/drop/rotate feel and overall intuitiveness.
   - Review trophy balance and reward pacing.
2) If the user requests changes:
   - Apply updates in `/app/games/src/*` only.
   - Re-run `python3 games/build.py`.
   - Re-run targeted screenshot-tool checks for impacted modes.
3) Handoff:
   - Provide the preview URL for final confirmation: `https://frea-refined.preview.emergentagent.com/games/frea.html`.
   - Once approved, finalize delivery.

## 4) Success Criteria
- `treesh.app/games/frea` loads as a single file and plays smoothly on desktop + mobile.
- Player name/avatar reflect `treesh_profile` without breaking existing local saves.
- Avatar robustness: non-image avatars (e.g. emoji) do not break UI.
- Starlites awards:
  - Write into `treesh_stars` with correct log entries.
  - Survive parent overwrites via reconciliation (no duplicate awards).
- Every mode feels “finished”: clear goals, readable HUD, satisfying end screen + rewards.
- Zen “Flea House” supports: build/buy, place/rotate/snap/stack, needs + autonomy, save/load.
- Achievements unlock reliably, show in UI, and grant stars once.
- Documentation exists so future edits use `src/*` + build step (no direct edits to `frea.html`).
