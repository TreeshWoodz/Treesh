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
**Phase 5: Games + Library + Queue + Storage + Lyric UX Polish**
1. Expand Games home with 3 new iframe games (**Chainz**, **FREA**, **Nects**) and an in-app iframe overlay (minimize/fullscreen/exit).
2. Major Library/My Music UX upgrades:
   - My Music controls: **collapse**, **Play (hold-to-shuffle)**, **multi-select + bulk delete**, and **mobile dropdown controls**.
   - Library + My Music per-section sort/filter: **Recent**, **A–Z**, **Z–A**, **Artist**, **Lyrics**, with animated rearrange.
   - Playlists appear directly on the Library page in their own section (no need to visit Profile).
   - Fix Play-next/Add-to-queue for custom tracks (ensure action always has a visible effect).
3. Rework **Custom Music storage** settings UX to remove the progress bar and “free space” text; replace with a standard **checkbox bulk + individual delete** flow.
4. Improve Lyric Studio UX:
   - On mobile, remove “Space” shortcut pills from stamping CTAs.
   - Add helpful bracket insertion snippet buttons.
5. Add **Lyric Card disclaimer** to exports when the song is custom or lyrics were user-edited.
6. Queue + player mobile polish:
   - Add **queue reorder** (menu Move up/down and drag-to-reorder).
   - Add **swipe down to close** Now Playing on mobile.

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

Completed earlier in the continuation:
- Verified **Word Sync & LRC Import** (Write/Sync) flows.
- Added **What’s New** system (badges + auto-popup + settings toggle), fixed related regressions.
- Instrum Studio polish (open animation, mobile label overlap, mobile wrap for controls).
- Games page polish: fixed duplicate heading and added **inline Starlites counter** with expandable stats panel.
- Critical UI fixes:
  - Global Lucide icon persistence via MutationObserver.
  - Now Playing desktop layout adjustments.
  - Karaoke reflow stabilized via `transform: scale()`.
  - Trailing bracket parsing fix and non-artist pill clickability fix.
  - Timestamp preservation on lyric edits via LCS mapping.

---

## Phase 5 — Games + Library + Queue + Storage + Lyric UX Polish

**Status: IN PROGRESS**

Priority order updated with user: Library/My Music and UX upgrades are now top priority, but Games P0 was completed first.

### Task 1 — Add 3 new games + in-app game iframe overlay (P0)
**Status: COMPLETED & VERIFIED**

**Delivered**
- Added **Chainz**, **FREA**, **Nects** to Games → Home (Arcade section).
- Tile visuals:
  - **Chainz** uses provided logo image URL.
  - **Nects** uses provided logo image URL.
  - **FREA** uses a monogram placeholder until logo arrives.
- Built in-app game overlay:
  - Root container: `#game-frame`
  - Loader + fallback (new-tab CTA)
  - Minimize to PiP (keeps iframe alive; does not lock scroll)
  - Native fullscreen (where supported)
  - Exit

**Key implementation**
- `GAMES` data array + helpers (`openGameFrame`, `renderGameFrame`, `gfLoaded`, `gfInitFallbackTimer`, `gameFrameToggleMin`, `gameFrameToggleFS`, `closeGameFrame`).
- Updated action switch cases:
  - `game-open`, `game-frame-min`, `game-frame-fs`, `game-frame-close`.
- Updated `overlaysOpen()` to include `state.gameFrame && !state.gameFrame.min`.

**Testing**
- Screenshot tool: verified tiles render, overlay opens, loader works, game runs, minimize keeps game running, fullscreen works (when supported), exit works.

---

### Task B — Library / My Music / Playlists upgrades (P0/P1 blended)
**Status: COMPLETED & VERIFIED (delivered this session)**

#### B1) My Music upgrades
**Delivered**
- My Music section now includes:
  - **Collapse/expand toggle** persisted to `treesh_mine_collapsed`.
  - **Play button**: click = play in order; **hold 1.5s = shuffle** (pointer-based hold).
  - **Multi-select** mode with checkbox list and **bulk Delete**.
  - Each upload’s song menu now includes **Edit details**.

#### B2) Fix: “Play next” / “Add to queue” for My Music
**Delivered**
- Root cause: duplicate prevention made actions appear to “do nothing” when the song was already somewhere in queue.
- Updated `addToQueue()` to **remove existing instance and reinsert** at the requested position (play-next or append), so the action always visibly works.
- Updated `loadIndex()` to resolve a **fresh `audioUrl` from `SONG_BY_ID`**, protecting user-song blob URLs.

#### B3) Sort/filter for My Music + Library (per-section, remembered)
**Delivered**
- Per-section sort/filter:
  - **Recent**, **A–Z**, **Z–A**, **Artist**, **Lyrics**
- State persisted separately:
  - `treesh_lib_sort`, `treesh_mine_sort`
- Added animated rearrange:
  - `flipRerender()` uses FLIP transforms on `[data-fkey]` elements.

#### B4) Playlists on Library page
**Delivered**
- Added **Playlists** section below **My Music** on Library.
- Section only shows if `state.playlists.length > 0`.
- Reuses existing playlist actions: open/share/rename/delete + New.

#### B6) Mobile My Music header dropdown
**Delivered**
- On mobile, My Music header controls are replaced by:
  - A standalone **Play** button (still supports hold-to-shuffle)
  - A **⋮ menu button** opening a modal dropdown (`openMineMenu`) styled like existing menus.
- Dropdown options include: Shuffle, Select tracks, View toggle, Add music, Collapse/expand.
- **Play is intentionally NOT included inside the dropdown**.

**Testing**
- Desktop + mobile screenshot tool:
  - My Music header is no longer cramped on mobile.
  - Dropdown styling matches existing menus.
  - Sort buttons animate rearrange.
  - Playlist section appears only when playlists exist.

---

### Task B5 — What’s New desktop cover art fix (P1)
**Status: COMPLETED & VERIFIED**

**Goal**
- Desktop What’s New slides should show the full cover/artist photo (not just a wide-cropped background).

**Delivered**
- Each slide now includes a **desktop-only thumbnail** (sm:block) displayed bottom-left inline with title/subtitle/meta/Play.
- Background image and gradients remain unchanged.

**Testing**
- Screenshot tool verified thumbnail is present on desktop and hidden on mobile.

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
- Update `storageSection()` and related UI:
  - Keep the top overall “Treesh storage used” summary intact.
  - Replace the existing custom music bar/hint area with a list UI.
- Render checkbox rows from `USER_SONGS` metadata.
- Deletion wiring:
  - Use `idbDelete(id)` + `loadUserSongs()`.
  - Mirror safety behaviors from upload deletion (pause if currently playing, update favorites).
  - Confirm modals:
    - Delete Selected
    - Delete All

**Testing**
- Screenshot tool:
  - Storage UI reflects new layout.
  - Deletes update counts and list.

---

### Task 3 — Mobile Lyric Studio “Space” shortcut hint removal (P1)
**Status: NOT STARTED**

**Goal**
- Hide the “Space” pill from mobile Lyric Studio CTAs.

**Implementation details**
- In `lsSyncHtml()` and Word Sync modal UI:
  - Wrap the “Space” hint pills with Tailwind responsive classes: `hidden sm:inline-block`.

**Testing**
- Screenshot tool:
  - Mobile: pills hidden.
  - Desktop: pills visible.

---

### Task 4 — Lyric Studio bracket snippets + Lyric Card disclaimers (P1)
**Status: NOT STARTED**

#### 4A) Bracket snippet buttons
**Goal**
- Add bracket insertion buttons in Lyric Studio Write mode:
  - `[Verse #: FEATURED ARTIST]`
  - `[Verse #: ALL ARTISTS]`

**Implementation details**
- Update `lsWriteHtml()` to add snippet controls.
- Reuse existing insertion plumbing (or add a small helper) to insert text with proper newlines.

#### 4B) Lyric Card export disclaimer
**Goal**
- If the song is custom (`s._user`) OR lyrics were edited/added on-device (`state.lyricEdits[s.id]`), add a disclaimer to the lyric card canvas.

**Implementation details**
- In `drawLyricCard()`:
  - `const needsDisclaimer = !!s._user || !!(state.lyricEdits && state.lyricEdits[s.id]);`
  - Render footer text (low opacity): `Custom or user-edited lyrics — not official.`

**Testing**
- Screenshot tool:
  - Custom song shows disclaimer.
  - Edited song shows disclaimer.
  - Unedited official song does not.

---

### Task C1 — Queue reorder (P1)
**Status: NOT STARTED**

**Goal**
- Let users reorder the queue via:
  - Menu options **Move up / Move down**
  - **Drag-to-reorder** (tap/click and drag)

**Implementation details**
- Verify existing queue UI and enhance:
  - Add drag handle UI and HTML `draggable` behavior (desktop) + pointer-based drag (mobile).
  - Update queue state (`state.queue`, `state.base`, and index adjustments) without breaking current playback.

**Testing**
- Screenshot tool + manual interactions:
  - Reordering persists within current session.
  - Current track index updates correctly when items move around it.

---

### Task C2 — Mobile swipe-down to close Now Playing (P1)
**Status: NOT STARTED**

**Goal**
- On mobile, allow the Now Playing player to be dismissed by a swipe/drag down gesture.

**Implementation details**
- Add pointer/touch gesture tracking on the Now Playing sheet/container.
- Threshold-based close (with reduced motion respect).

**Testing**
- Screenshot tool + gesture validation:
  - Swipe down closes.
  - Normal scroll doesn’t accidentally close.

---

## 3. Next Actions

1. **Implement Task 2 (Custom Music Storage rework)** and test deletion flows.
2. Implement Task 3 (mobile Space hint removal).
3. Implement Task 4 (bracket snippets + disclaimer) and test.
4. Implement Task C1 (Queue reorder).
5. Implement Task C2 (Swipe-down close).
6. After each task:
   - Run `node --check` on the extracted inline script.
   - Screenshot tool pass for desktop + mobile.

Testing notes:
- Seed profile to bypass onboarding:
  - `localStorage.treesh_profile = { nickname: 'Tester' }`
- Disable What’s New auto-popup during tests:
  - `localStorage.treesh_whatsnew_off = '1'`

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
- Games page shows new tiles for Chainz/FREA/Nects (Chainz + Nects logo images; FREA placeholder).
- Game iframe overlay opens reliably with loader and fallback.
- Minimize behaves like PiP and does not reload iframe.
- Fullscreen works where supported and returns correctly.
- Library improvements:
  - My Music supports collapse, play/hold-to-shuffle, select mode + bulk delete.
  - Mobile My Music header uses a dropdown menu; Play remains standalone and is not inside the menu.
  - Library and My Music sort/filter work independently and persist.
  - Rearranging animates smoothly (FLIP).
  - Playlists are visible on the Library page when any exist.
  - Play-next/Add-to-queue repositions tracks as expected.
- What’s New slides show a desktop thumbnail inline with slide content (background kept).
- Storage settings no longer show progress/free-space text and allow delete selected/all.
- Mobile Lyric Studio no longer shows “Space” hint pills.
- Bracket snippet buttons speed up authoring.
- Lyric Card exports include a disclaimer only when content is custom or user-edited.
- Queue reorder works (move up/down and drag) without breaking the current playing index.
- Mobile swipe-down closes Now Playing reliably.

---

**Notes / Constraints**
- Single source of truth: `/app/single_html/index.html` (no backend).
- Vanilla JS + Tailwind CDN only; no build steps.
- **Critical**: edits must be surgical and sequential to avoid file corruption.
- Use screenshot tool extensively for UI validation.
