# Treesh 3.0 — Phase 5 Continuation Plan (single-file `index.html`)

## 1) Objectives
Complete Phase 5 continuation on top of the current working Treesh 3.0 single-file SPA **without breaking the zero-build / LocalStorage+IndexedDB constraints**.

**Current priority (reconfirmed with user):**
1) ✅ **Cover Art Image Studio** (crop/zoom/rotate/filters) integrated into Custom Studio (Add Music) cover flow. **DONE + tested.**
2) ✅ **Equalizer** — 10-band graphic EQ (31Hz–16kHz) + preamp + 13 presets + Custom + live spectrum, entry points in Now Playing & Settings. **DONE + tested.**
3) ✅ **P0: lyric-sync / karaoke index mismatch** — fixed by using a single filtered `_karLines` array consistently across stage/times/char-timing/performer. **DONE + tested.**
4) ⏭️ **Karaoke fullscreen revamp** (true fullscreen black stage, hide player, tap anywhere to exit → return to Now Playing lyrics; keep count-in).
5) ⏭️ **Lyric Card / Modal revamp** (live preview always visible; mobile-first layout).
6) ⏭️ Secondary backlog: **Find Lyrics search improvements**, **Add lyrics on upload**, **Vocotap audio-game logic**, **Live update notification** (both: version constant + polling).

### Current status (as of this continuation session)
- App served from **`/app/single_html/index.html`** (single file; ~6450 lines).
- Architecture: **Vanilla JS + Tailwind CDN**, single HTML file, persistence via **LocalStorage** + **IndexedDB (`treesh_db`)**.
- Edit safety: **sequential-only edits** to `index.html` (no parallel/batched edits).
- Testing method: screenshot tool / manual browser simulation.

### Completed (already implemented in `index.html` before this continuation)
- Queue drag-to-reorder (reorder scope `queue` in `REORDER_CBS`) ✅
- Mobile swipe-down-to-close Now Playing ✅
- Dynamic bottom padding for mini-player, drag-to-dismiss ✅
- Arcade Game modals + smooth transitions + draggable minimized game iframe ✅
- Library/Playlists UI enhancements (multi-select delete, reorder controls, menu consistency) ✅
- Library layout adjustments (Genres/filters placement, custom tracks excluded from “Icons” count) ✅
- Lyric Studio fixes (auto performer tags, save from Write mode, play/pause icon toggling) ✅
- Profile Settings cleanup ✅

### Completed & verified in this continuation

**P0.1 — My Music sequential playback** ✅
- Added dedicated action `data-act="mm-play"` for embedded My Music playback.
- Threaded optional `act` param through: `songCard`, `songRow`, `grid`, `songList`.
- Updated `myMusicSection()` and `myMusicCard()` to emit `mm-play`.
- Implemented dispatcher handler for `mm-play` to build queue from `mmSortedList()`.
- Verified playback advances within My Music only.

**P0.2 — Mobile background playback hardening for custom uploads** ✅
- `loadUserSongs()` no longer revokes the currently playing blob URL (`audio.src`).
- Attached main audio element to DOM (hidden) + inline playback hints (`playsinline`, etc.).
- Enhanced MediaSession wiring + position state updates.
- Verified in mobile emulation.

**P2 — What’s New desktop upgrade** ✅
- `wnSlide()` now uses a desktop (`lg:`) inline thumbnail layout + ambient blur.
- Mobile/tablet preserved.

**Games — asset upgrades (banners/icons)** ✅
- Updated FREA! icon + banner; added Chainz banner.

**Play Count badges + “Most played” sort** ✅
- Added `state.playCounts` persisted in `LS.treesh_plays`.
- Increment rule: once per play after ~20s.
- “Most played” pill in Library + My Music; gold flame badge for global most-played.

**Lyrics on uploads — quick access + karaoke compatibility** ✅
- Added `ls-open` quick button on `_user` song rows/cards.
- `treesh_lyric_edits` persists edits and re-applies after IDB rebuild.

**Library spacing overlap fix** ✅
- Wrapped `filterBar('lib')` with margin container.

**Now Playing options rework** ✅
- Conjoined favorite/dislike cycle button (`fav-cycle`).
- Disliked songs blocked from queueing/traversal.
- Vinyl toggle moved to Settings; artwork tap toggles vinyl/cover.

### What’s now pending / in progress

**P0**
- ⏭️ Karaoke/lyrics timing bug: index mismatch between filtered karaoke stage lines and unfiltered lyrics lines.

**P1+ (NEXT)**
- ⏭️ Cover Art Image Studio (highest priority)
- ⏭️ Karaoke fullscreen revamp
- ⏭️ Lyric card/modal revamp
- ⏭️ Live update notification (version + polling)
- ⏭️ Find Lyrics search improvements (lrclib query tuning)
- ⏭️ Add lyrics on upload option
- ⏭️ Vocotap audio-game logic

### Core constraints (non-negotiable)
- **Single file** architecture: only edit `/app/single_html/index.html`
- **Zero build steps**; **NO npm/yarn**
- Persist state via **LocalStorage + IndexedDB (`treesh_db`)** only
- Match existing UI language: Tailwind CDN, `--treesh-purple/gold`, glass surfaces, lucide icons, `.press`
- **CRITICAL**: perform **sequential** edits only (no parallel/batched edits)
- Testing: screenshot tool + mobile emulation
  - Persistence tests must use `page.reload()` within the same run.

---

## 2) Implementation Steps

### Phase P0 — Fix Broken Core: My Music Playback (P0) **[DONE + VERIFIED]**
**Goal:** Custom uploads behave like a real playlist/album: **play in order, stay in My Music context, and continue reliably on mobile (background).**

#### P0.1 Sequential playback stays inside My Music **[DONE]**
- Introduced `mm-play` action and threaded through UI builders.

#### P0.2 Mobile background playback hardening **[DONE]**
- Prevented revoking active blob URLs, attached audio element to DOM, improved MediaSession.

---

### Phase P1 — Cover Art Image Studio (Uploads) **[NEXT / P1]**
**Goal:** Let users **edit cover art before saving** custom uploads: crop/zoom/rotate + filters (grayscale/sepia/brightness/contrast), consistent with Treesh’s glass/purple/gold design.

**Key UX requirement:** Preserve the Add-Music form and chosen audio file while editing cover art.

#### P1.1 Modal strategy (stacked overlay)
- Add a second overlay container in the DOM: `#modal2` (sibling of `#modal`) used only for the cover studio.
- Update `overlaysOpen()` to consider `#modal2` so scroll lock works.
- Provide `closeModal2()` + `modalWrap2()` helpers (mirror existing `closeModal()` / `modalWrap()`).

#### P1.2 Data plumbing (no LocalStorage for images; keep in-memory until save)
- Introduce `_amCoverBlob` in the Add-Music flow:
  - When studio finishes: output **Blob** (jpeg/webp) to `_amCoverBlob`.
  - Update preview (`#am-cover-preview`) using `URL.createObjectURL(_amCoverBlob)`.
  - On save: prefer `_amCoverBlob` over `am-cover` `<input>` file.
- Ensure blob URLs are revoked safely on close / replace.

#### P1.3 Image editing pipeline
- Load image into an `<img>` (or `createImageBitmap`) and render into a `<canvas>`.
- Controls:
  - Crop box (drag handles or simpler: aspect presets 1:1 default; freeform optional).
  - Zoom slider.
  - Rotate (90° steps + fine rotate slider optional).
  - Filters (preview via canvas draw): grayscale/sepia/brightness/contrast.
- Export:
  - Render final to canvas at a cap size (e.g. 1024–1600px)
  - Encode to `Blob` with controlled quality (e.g. JPEG 0.86) to reduce IDB footprint.

#### P1.4 Integration points
- In `openAddMusic()` cover change handler, add an action button “Edit” that opens the studio.
- Also allow opening studio immediately after selecting a cover file (optional prompt).

#### P1.5 Testing
- Manual/screenshot tests:
  - Select cover → open studio → crop/rotate/filter → apply → preview updates.
  - Save track → reload app → cover persists (stored in IndexedDB as `coverBlob`).
  - Verify Add Music audio file selection is not lost while studio open/close.

---

### Phase P2 — P0 Fix: Lyrics Syncing / Karaoke Index Mismatch **[NEXT / P0]**
**Goal:** Fix broken karaoke + lyric sync where highlighting/performance mapping/timings are offset.

**Root cause (confirmed):**
- `buildKaraokeStage()` uses `lines=((s.lyrics)||[]).filter(l=>!l.secOnly)`.
- `updateKaraoke()` uses `lines=(s.lyrics)||[]` unfiltered.
- `idx` is computed against `_karTimes` (filtered) but used against `lines` (unfiltered) for `_karComputeCharTimes()` and `updatePerformer()`.

**Fix approach:**
- Store the filtered karaoke source array globally, e.g. `_karLines`.
- Ensure **all** karaoke computations use `_karLines`:
  - `_karTimes = _karLines.map(l=>l.t||0)`
  - `updateKaraoke()` uses `_karLines` for char times + performer section (`sec`).

**Testing**
- With lyrics containing section headers (`secOnly`) between timed lines:
  - Karaoke active line matches audio.
  - Per-char highlight matches word timing.
  - Performer pill/label matches active line.

---

### Phase P3 — Karaoke Mode Fullscreen Revamp **[P1]**
**Goal:** True fullscreen karaoke:
- Completely black background
- Hide music player UI
- White text with letter transitions
- Tap/click anywhere to exit
- On exit: return to normal Now Playing lyrics view
- Keep count-in dots/beeps

**Implementation sketch**
- Add `state.karFull=true/false` entrypoint from NP.
- Render alternate karaoke root when `karFull` enabled:
  - full-screen overlay stage only
  - global tap handler → set `karFull=false` and re-render NP
- Ensure karaoke loop uses the same stage and count-in logic.

**Testing**
- Enter/exit flows, no stuck scroll lock.
- Count-in still visible and optionally audible.

---

### Phase P4 — Lyric Card / Modal Revamp **[P1]**
**Goal:** Simplify lyric card creation UI:
- Preview **always visible** while editing
- Mobile-friendly (thumb-first controls, collapsible panels)
- Keep within existing style system

**Implementation sketch**
- Convert lyric card editor to a split layout:
  - preview top (sticky) on mobile
  - controls below (tabs: Background / Text / Effects)
- Preserve existing canvas export pipeline.

**Testing**
- Create/edit card from search + favorites + player.
- Export works; preview never disappears while tweaking.

---

### Phase P5 — Secondary Backlog (post-P1)

#### P5.1 Find Lyrics search improvement (lrclib)
- Improve query formatting, tokenization, and ranking.
- Add fallbacks: title-only, artist-only, stripped parentheses/feat.

#### P5.2 Add lyrics on upload
- Optional step/checkbox in Custom Studio to open Lyric Studio immediately after saving upload.

#### P5.3 Vocotap audio-game logic
- Classify Vocotap as audio game; auto-pause Treesh music when opening; optionally hide mini-player during gameplay.

#### P5.4 Live update notification (BOTH)
- Version constant embedded in file:
  - On load: if stored version differs → toast with date/time.
- Polling:
  - Periodically fetch `index.html` (or a small embedded `?v=` endpoint if possible via static) and compare marker; if changed while open → toast.

---

## 3) Next Actions
1) Implement **P1 Cover Art Image Studio** with `#modal2` overlay, `_amCoverBlob`, and canvas editing tools.
2) Implement **P2 Karaoke index mismatch fix** using `_karLines` consistently.
3) Implement **P3 Karaoke fullscreen revamp** (black stage overlay, tap-to-exit).
4) Implement **P4 Lyric card/modal revamp** (preview always on screen).
5) Implement **P5 Secondary backlog** (lrclib search tuning, add-lyrics-on-upload, Vocotap audio-game logic, live update notification).

Regression tests after each phase:
- My Music playback (sequential + background)
- Custom upload save/edit still works (audio + cover)
- Karaoke timings + performer mapping
- Scroll lock correctness with stacked overlays

---

## 4) Success Criteria
- ✅ My Music sequential playback: embedded My Music plays only My Music tracks.
- ✅ Mobile background playback: custom uploads play reliably; active blob URL not revoked.
- ⏭️ Cover Art Image Studio: user can crop/zoom/rotate/filter cover art, apply it, and it persists (IDB coverBlob) without losing the Add-Music audio file selection.
- ⏭️ Karaoke/lyric syncing: no index mismatch; per-char and performer mapping aligned even with `secOnly` headers.
- ⏭️ Karaoke fullscreen: black stage, white text, tap-to-exit back to NP lyrics; count-in retained.
- ⏭️ Lyric card editor: live preview always visible; mobile-friendly.
- ⏭️ Live update notification: version mismatch toast + runtime change polling toast.
- No regressions to queue, now playing, modals/scroll lock, game modal behavior, lyric studio, or storage management.
