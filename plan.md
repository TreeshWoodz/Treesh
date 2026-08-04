# Treesh 3.0 — Development Plan (Single-file SPA)

## 1. Objectives

### Core objectives (already delivered)
- Deliver a **P0 Accessibility suite** that applies instantly and persists to `localStorage`.
- Add **Nav label toggle** (icons-only vs icons+labels) with default “shown”, while preserving mobile nav height.
- Add **optional floating Accessibility quick button** (enabled/disabled from Settings) that never overlaps mini-player controls.
- Fix **Lyric Card “Options” scroll-to-top** bug (preserve scroll/viewport position).
- Add **Lyric Card font size control** (user-adjustable, persisted; affects preview + export).
- Add **sticky tabs behavior** for Settings and Games, with blur pills (no sticky-bar background) and correct scroll positioning.
- Add **Custom Studio**: fully offline, client-side **custom music uploader** using IndexedDB for audio/cover blobs, integrated into Library as **My Music**.
- Add **Lyric Studio (Write/Sync)** and **Karaoke Stage** upgrade (LyricFlow-inspired) with full on-device persistence.

### New objectives (current work)
**Phase 5: Games + Storage + Lyric UX Polish**
1. Expand Games home with 3 new iframe games (**Chainz**, **FREA**, **Nects**) presented as **monogram tiles** (C/F/N) with colored gradient backgrounds.
2. Add an in-app **iframe overlay** for games (reusing Blog iframe pattern) with **minimize (PiP)**, **native fullscreen**, and **exit** controls, plus loader + fallback.
3. Rework **Custom Music storage** settings UX to remove the progress bar and “free space” text, replacing it with a standard **bulk + individual delete** flow.
4. Improve Lyric Studio UX:
   - On mobile, remove “Space” shortcut pills from stamping CTAs.
   - Add helpful bracket insertion snippet buttons.
5. Add **Lyric Card disclaimer** to exports when the song is custom or lyrics were user-edited.

Constraints / non-goals:
- No backend, no build steps, no npm/yarn. Single source of truth remains `/app/single_html/index.html`.
- SoundCloud import remains **SKIPPED**.
- **Critical**: All edits to `index.html` must be done via **strictly sequential** operations to avoid file corruption.

---

## 2. Implementation Steps

### Phase 1 — Core POC (Isolation): IndexedDB upload/storage pipeline
**Status: DONE (implemented as part of Custom Studio)**

---

### Phase 2 — V1 App Development (Accessibility + Lyric Cards + Nav labels)

#### Phase 2A — Accessibility settings (instant apply + persist)
**Status: DONE**

#### Phase 2B — Nav label toggle (icons-only)
**Status: DONE**

#### Phase 2C — Floating accessibility quick button (optional)
**Status: DONE**

#### Phase 2D — Lyric Card fixes + font size control
**Status: DONE**

#### Phase 2E — Sticky tabs (Settings + Games)
**Status: DONE**

---

### Phase 3 — Custom Studio (Custom Music Upload)
**Status: DONE**

---

### Phase 4 — New Large Scope (Custom Studio V2 + Library + Lyric Studio + Karaoke)

#### Phase 4A — Custom Studio core (V2)
**Status: COMPLETED**

#### Phase 4B — Power features
**Status: COMPLETED**

#### Phase 4C — Library UX upgrades
**Status: COMPLETED**

#### Phase 4D — Lyric Studio (LyricFlow integration)
**Status: COMPLETED**

### Phase 5 — Karaoke Upgrade (replaces old karaoke)
**Status: COMPLETED (implemented as Phase 4D Part B)**

---

### Phase 4E — Continuation (New Session)

**Status: IN PROGRESS**

Completed in this continuation:
- **Verified Word Sync & LRC Import** (Write/Sync) flows.
- Added **What’s New** system (badges + auto-popup + settings toggle), fixed related regressions.
- Instrum Studio polish (open animation, mobile label overlap, mobile wrap for controls).
- Games page polish: fixed duplicate heading and added **inline Starlites counter** with expandable stats panel.
- Critical UI fixes already completed earlier in the continuation:
  - Global Lucide icon persistence via MutationObserver.
  - Now Playing desktop layout adjustments.
  - Karaoke reflow stabilized via `transform: scale()`.
  - Trailing bracket parsing fix and non-artist pill clickability fix.
  - Timestamp preservation on lyric edits via LCS mapping.

---

## Phase 5 — Games + Storage + Lyric UX Polish (NEW)

**Status: IN PROGRESS**

Priority order confirmed with user: **New Games first**, then the rest.

### Task 1 — Add 3 new games + in-app game iframe overlay (P0)
**Status: NOT STARTED**

**Goal**
- Add **Chainz**, **FREA**, **Nects** to Games → Home as monogram tiles.
- Clicking a tile opens an in-app iframe overlay with:
  - **Loader + fallback** (same model as Blog iframe)
  - **Minimize** (PiP-like floating mini window)
  - **Fullscreen** (native `requestFullscreen`)
  - **Exit**

**Implementation details**
- **UI**: Extend `gameHomeHtml()` with a “More games” / “Arcade” section containing 3 tiles.
  - Tile style: `press` + `card-lift`, monogram block (C/F/N) with gradient background and game name.
  - URLs:
    - `https://treesh.app/games/chainz`
    - `https://treesh.app/games/frea`
    - `https://treesh.app/games/nects`
- **Data**: Add `GAMES` array with `key`, `name`, `url`, `mono`, and gradient colors.
- **Overlay container**: Add `#game-frame` root near `#instrum-fs` in `<body>`.
- **State**: `state.gameFrame = { key, name, url, min:false, loaded:false }`.
- **Functions**:
  - `openGameFrame(key)`
  - `renderGameFrame()` (injects overlay HTML)
  - `gameFrameToggleMin()` (toggle PiP without reloading iframe)
  - `gameFrameToggleFS()` (native fullscreen on container)
  - `closeGameFrame()`
  - `gfLoaded()` + `gfInitFallbackTimer()` (loader/fallback, parallel to blog)
- **Actions**: Add switch cases:
  - `game-open`
  - `game-frame-min`
  - `game-frame-fs`
  - `game-frame-close`
- **Scroll lock integration**:
  - Update `overlaysOpen()` to include `state.gameFrame && !state.gameFrame.min`.

**Testing**
- Screenshot tool:
  - Games → Home shows 3 new tiles.
  - Open each game: loader appears, iframe loads.
  - Minimize: becomes floating window and does **not** block scroll.
  - Restore: returns to full overlay and iframe is still alive.
  - Fullscreen: enters/exits native fullscreen (where supported).
  - Exit: overlay removed.

---

### Task 2 — Custom Music Storage rework (P0)
**Status: NOT STARTED**

**Goal**
- In Settings → Account → Storage & data, rework the **Custom music** card:
  - Remove the **progress bar**.
  - Remove “About # MB of space is still free on this device”.
  - Replace with a checkbox list of custom tracks plus:
    - **Delete Selected**
    - **Delete All**

**Implementation details**
- Update `storageSection()` and `updateCustomMusicStorage()`:
  - Keep the top overall “Treesh storage used” summary intact.
  - Replace the existing custom music bar/hint area with a list UI.
- Build a lightweight UI model:
  - Render checkbox rows using `USER_SONGS` metadata.
  - Each row includes title/artist and optional size (if easy; can rely on IDB rec sizes).
- Deletion wiring:
  - Use existing IDB delete primitives: `idbDelete(id)` + `loadUserSongs()`.
  - Reuse the behavioral expectations from `deleteUpload()` (pause if currently playing, remove from favorites if needed).
  - Add confirm modals:
    - Delete Selected
    - Delete All

**Testing**
- Screenshot tool:
  - Settings → Account shows new Custom music UI.
  - Select some songs → Delete Selected deletes only those.
  - Delete All removes all.
  - UI updates counts without reload (or reload if necessary, but prefer in-place refresh).

---

### Task 3 — Mobile Lyric Studio “Space” shortcut hint removal (P1)
**Status: NOT STARTED**

**Goal**
- Remove/hide the “Space” pill from mobile Lyric Studio CTAs (mobile keyboards do not map well to Spacebar behavior).

**Implementation details**
- In `lsSyncHtml()` and Word Sync modal UI:
  - Wrap the “Space” hint pills with Tailwind responsive classes: `hidden sm:inline-block`.
  - Target locations:
    - `#ls-set-btn` label (“Set time to current line”)
    - Word sync “Set word” button

**Testing**
- Screenshot tool:
  - Mobile viewport: pills hidden.
  - Desktop viewport: pills visible.

---

### Task 4 — Lyric Studio bracket snippets + Lyric Card disclaimers (P1)
**Status: NOT STARTED**

#### 4A) Bracket snippet buttons
**Goal**
- Add helpful bracket insertion buttons in Lyric Studio Write mode beyond the basic section chips.

**Implementation details**
- Update `lsWriteHtml()` to add additional snippet controls:
  - `[Verse #: FEATURED ARTIST]`
  - `[Verse #: ALL ARTISTS]`
- Use existing insert plumbing (`lsInsertTag`) or add a small new insert helper that:
  - Auto-increments verse number.
  - Inserts the exact string into the write textarea with proper newlines.

#### 4B) Lyric Card export disclaimer
**Goal**
- If the song is custom (`s._user`) OR lyrics were edited/added on-device (`state.lyricEdits[s.id]`), add a subtle disclaimer to the lyric card canvas.

**Implementation details**
- In `drawLyricCard()`:
  - Detect: `const needsDisclaimer = !!s._user || !!(state.lyricEdits && state.lyricEdits[s.id]);`
  - Render a small footer line (low opacity) near the bottom edge:
    - Text: `Custom or user-edited lyrics — not official.`
  - Ensure it stays within the 1080x1080 safe margins and does not overlap the title block.

**Testing**
- Screenshot tool:
  - Custom song card export preview shows disclaimer.
  - Edited official song lyric card preview shows disclaimer.
  - Unedited official song: no disclaimer.

---

## 3. Next Actions

1. **Implement Task 1 (New Games + iframe overlay)** and test all controls.
2. **Implement Task 2 (Custom Music storage rework)** and test deletion flows.
3. Implement Task 3 (mobile Space hint removal).
4. Implement Task 4 (bracket snippets + disclaimer) and test.
5. After each task:
   - Run `node --check /app/single_html/index.html`
   - Screenshot tool pass for desktop + mobile.

---

## 4. Success Criteria

Already achieved:
- Accessibility toggles apply instantly, persist across reload, and do not break layout.
- Nav labels hide/show correctly on desktop + mobile; mobile nav height remains stable.
- Floating accessibility button is non-blocking and respects mini player.
- Lyric card options do not jump to top; font size control persists and affects export.
- Custom Studio uploads: upload/play/persist/edit/delete works; survives catalog refresh.
- Multi-upload: queue editing + Save all works.
- User uploads show `YOURS` badge and do not appear as official tracks in Icon profiles.
- Library paging works with All/12/24/50 defaults and “Load more”.
- Lyric Studio Write/Sync persists via `treesh_lyric_edits` and re-applies on refresh via `applyLyricEdits()`.
- Karaoke stage is smooth and stable; fullscreen exit exists; perf/reduced motion respected.

New (Phase 5) success criteria:
- Games page shows new tiles for Chainz/FREA/Nects with monogram styling.
- Game iframe overlay opens reliably with loader and fallback.
- Minimize behaves like PiP and does not reload iframe when toggled.
- Fullscreen works where supported and returns correctly.
- Custom Music storage UI no longer shows the removed progress/free-space text.
- Users can select multiple custom songs and delete selected/all without breaking favorites/now playing.
- Mobile Lyric Studio no longer shows “Space” hint pills.
- Bracket snippet buttons speed up authoring.
- Lyric Card exports include a disclaimer only when the content is custom or user-edited.

---

**Notes / Constraints**
- Single source of truth: `/app/single_html/index.html` (no backend).
- Vanilla JS + Tailwind CDN only; no build steps.
- **Critical**: edits must be surgical and sequential to avoid file corruption.
- Use screenshot tool extensively for UI validation.
