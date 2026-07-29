# Treesh 3.0 — Development Plan (Single-file SPA)

## 1. Objectives
- Deliver a **P0 Accessibility suite** (all requested toggles) that applies instantly and persists to `localStorage`.
- Add **Nav label toggle** (icons-only vs icons+labels) with default “shown”, while preserving mobile nav height.
- Add **optional floating Accessibility quick button** (enabled/disabled from Settings) that never overlaps mini-player controls.
- Fix **Lyric Card “Options” scroll-to-top** bug (preserve scroll/viewport position).
- Add **Lyric Card font size control** (user-adjustable, persisted; affects preview + export).
- Add **sticky tabs behavior** for Settings and Games, with blur pills (no sticky-bar background) and correct scroll positioning.
- Add **Custom Studio**: fully offline, client-side **custom music uploader** using IndexedDB for audio/cover blobs, integrated into Library as **My Music**.
- Expand Custom Studio into a combined **Custom Studio → Lyric Studio** workflow and a standalone **Lyric Studio** entry:
  - Users can create / paste lyrics, timestamp them while audio plays, and save to the device.
  - Users can import existing Treesh lyrics for re-syncing.
  - Users can export synced output as **.LRC** / copy text.
- Upgrade playback UX by **replacing** the current karaoke logic with a smoother **LyricFlow-style karaoke stage**.

Constraints / non-goals:
- **SoundCloud import is SKIPPED** (not freely feasible; API registration closed; ToS concerns).
- No backend, no build steps, no npm/yarn. Single source of truth remains `/app/single_html/index.html`.

---

## 2. Implementation Steps

### Phase 1 — Core POC (Isolation): IndexedDB upload/storage pipeline
**Status: DONE (implemented as part of Custom Studio)**

**User stories (POC)**
1. As a user, I can select an audio file and it stores successfully without LocalStorage quota issues.
2. As a user, I can reload the app and still see the stored item.
3. As a user, I can delete a stored audio item and reclaim space.
4. As a user, I can store cover art (optional) alongside audio.
5. As a user, I can safely handle large files (fail gracefully if too big).

**Implementation (final)**
- IndexedDB DB: `treesh_media` v1
- Store: `tracks` (keyPath `id`)
- Record shape: `{ id, meta:{...}, audioBlob, coverBlob?, duration, addedAt, audioType?, coverType? }`
- File size policy: **~30MB audio cap**, **~10MB cover cap**
- Object URLs generated on load and revoked when reloading user songs.

---

### Phase 2 — V1 App Development (Accessibility + Lyric Cards + Nav labels)

#### Phase 2A — Accessibility settings (instant apply + persist)
**Status: DONE (verified via screenshot + node --check, no console errors)**

**User stories**
1. High contrast mode improves readability.
2. Reduced motion minimizes animations/transitions.
3. Text size scaling beyond existing presets.
4. Dyslexia-friendly font option.
5. Strong focus outlines for keyboard navigation.

**Implementation (final)**
- Stored in `localStorage`: `treesh_a11y`
- Runtime: `state.a11y`
- `applyA11y()` toggles classes on `document.documentElement`:
  - `a11y-contrast`, `a11y-reduce-motion`, `a11y-dyslexia`, `a11y-focus`, `a11y-underline`, `a11y-bold`, `a11y-nav-icons`, `a11y-lyric-spacious`, `a11y-textscale`
- **Text Scale is font-only** (CSS overrides using `--a11y-scale`) to avoid zooming layout/controls.
- Color-vision palettes implemented by remapping accent via presets (Deuteran/Protan/Tritan).
- Added Google Font: **Atkinson Hyperlegible**.
- Accessibility UI added as **Settings → “Access” tab**.

#### Phase 2B — Nav label toggle (icons-only)
**Status: DONE**

**Implementation (final)**
- Labels wrapped in `.nav-label`.
- `a11y-nav-icons` hides labels:
  - **Desktop**: `display:none` (icons centered)
  - **Mobile**: `visibility:hidden` (space preserved; nav height doesn’t shrink)
- Buttons include `aria-label` and `title`.

#### Phase 2C — Floating accessibility quick button (optional)
**Status: DONE**

**Implementation (final)**
- Toggle stored in `treesh_a11y.quickBtn`.
- FAB renders bottom-right.
- Added `has-mini` class (when mini player is present) and positions FAB higher to avoid overlap.
- Popover offers common toggles + “All options” jump to Settings → Access.

#### Phase 2D — Lyric Card fixes + font size control
**Status: DONE**

**Implementation (final)**
- Fixed Lyric Card studio “Options” scroll jump by preserving scroll container (`#lyric-studio-scroll`) `scrollTop` across re-render.
- Added `state.cardFontScale` persisted in `treesh_card_font_scale`.
- Added “Text size” slider in Lyric Card studio.
- Canvas render applies `fontScale` multiplier while still respecting auto-fit & bounds.
- Fixed lyric line shimmer to be seamless.

#### Phase 2E — Sticky tabs (Settings + Games)
**Status: DONE**

**Settings**
- Sticky tabs bar uses **no background**.
- Individual pills use `backdrop-blur` + frosted styling.
- Sticky position is below fixed header with a consistent gap.
- Switching tabs scrolls to the tab bar’s pinned position using `offsetTop`.
- Ensured sufficient scroll room via `min-h-[85vh]`.

**Games**
- Game tabs upgraded to match Settings.
- Switching game tabs scrolls to pinned position.
- Ensured sufficient scroll room via `min-h-[85vh]`.

---

### Phase 3 — Custom Studio (Custom Music Upload)
**Status: DONE (V1 implemented and verified)**

**User stories**
1. Tap “Custom Studio” in Library to import audio.
2. Attach cover art and edit full metadata.
3. Imported tracks appear in Library under **My Music** and are playable.
4. Remove imported tracks via Manage panel or song menu.
5. Persist across reload, and survive periodic catalog refresh.

**Implementation (final)**
- **Data model**
  - `USER_SONGS` maintained separately from catalog.
  - `mergeUserSongs()` merges `USER_SONGS` into `SONGS` after each catalog load.
  - Prevents user tracks from being overwritten by the 60s catalog refresh.
  - User tracks never leak into localStorage catalog cache.

- **Custom Studio dialog**
  - Tabs: Add track / Manage.
  - Full metadata fields (title, artist, genre, album, etc.).
  - Cover + Audio pickers.
  - Duration probe before save.
  - iPhone upload compatibility.

- **Manage uploads**
  - List uploads with play + delete.
  - Delete also available from track “⋯” menu as “Remove upload” with confirmation.

**Verification done**
- Upload → appears in My Music → plays (blob URL) → persists across reload → delete removes.

---

### Phase 4 — New Large Scope (user-approved; build in order; test each phase)

> Global additions for this phase:
> - **Badge text for user uploads:** `YOURS`
> - **Multi-upload:** multi-file pick → editable list → **Save all** (single file stays in the detailed form)
> - **Library pagination setting:** options **All/12/24/50** (default **All**)
> - **Lyric Studio:** native Vanilla JS rebuild inspired by LyricFlow
> - **SoundCloud import:** SKIPPED

#### Phase 4A — Custom Studio core (V2)
**Status: COMPLETED (verified via node --check + screenshot flows; no console errors)**

**Delivered**
1. Edit mode end-to-end: prefill metadata, replace audio optional, IDB record updated in place.
2. Audio preview player inside Custom Studio.
3. Mobile layout clean (no horizontal overflow).
4. My Music duplication fixed; dedicated **My Music** section and full page.
5. Custom-music storage indicator in Account → Storage.

**Extra user requests (same session) — COMPLETED**
- Welcome modal now uses Treesh logo + fallback.
- Removed all em-dashes from app copy.

#### Phase 4B — Power features
**Status: COMPLETED (verified via node --check + screenshot flows, 0 console errors)**

**Delivered**
1. Multiple uploads at once:
   - Multi-file input opens an editable queue
   - Per-item editable metadata
   - Remove items / Start over
   - “Save all”
2. `YOURS` badge for user songs
3. Exclude custom songs from real Icon profiles (`buildArtistSongIndex` skips `_user` songs)

#### Phase 4C — Library UX upgrades
**Status: COMPLETED (verified via node --check + screenshot flows, 0 console errors)**

**Delivered**
1. Library paging:
   - Options All/12/24/50
   - Default **All**
   - “Load N more” + “Showing X of Y”
2. My Music redesign:
   - My Music section renders using the same list/grid components
   - Dedicated list/grid toggle (`state.mineGrid`) and pagination
3. Entry point simplified:
   - Removed extra Custom Studio buttons
   - Primary entry is the inline **+** button next to “My Music”
4. Cover Color Glow:
   - Dominant color softly tints Custom Studio

#### Phase 4D — Lyric Studio (LyricFlow integration)
**Status: COMPLETED (implemented + verified via screenshots + node --check)**

**Reference**
- Use `/app/lyricflow_reference.txt` as the feature reference.
- Do **not** embed lyricflow HTML; build a **native** Treesh UI matching purple/gold theme.

**Build order (confirmed and followed)**
1) Lyric Studio (sync tool)
2) Karaoke upgrade (replace old karaoke)

**P0 v1 toolset (delivered)**
- **Write mode**: paste/type lyrics (supports section markers like `[Verse 1]`)
- **Sync mode**: play audio and timestamp lines via Spacebar/tap
  - Dedicated `_lsAudio` transport (does not fight the main player)
  - Big “Set time” CTA + Spacebar shortcut + auto-advance
  - Per-line options: set time, nudge ±0.1s, manual time edit (mm:ss / mm:ss.xx), insert/delete, convert line↔section
  - Section rows supported in the list
  - Progress pill (`X / Y timed`)
- **Import**: pick any Treesh track with lyrics and copy its lines into the session for re-timing
- **Export**: generate **.LRC** text + copy to clipboard + download `.lrc`

**Data model + persistence (delivered using existing Treesh system)**
- Lyric line shape remains compatible: `{ t:Number, text:String, sec:String|null, explain?:String }`
- Save bridges into:
  - `state.lyricEdits[songId] = lines`
  - `LS.set('treesh_lyric_edits', state.lyricEdits)`
  - `SONG_BY_ID[songId].lyrics = lines`
- Ensures `applyLyricEdits()` continues to re-apply edits after catalog refresh.

**UI integration requirements (delivered)**
- Added `#ls` full-screen overlay container (separate from modal stack) with its own keyboard shortcuts.
- Added `state.lsOpen`/`state.ls` and included `lsOpen` in `overlaysOpen()` so scroll-lock behaves.
- Respects theme + a11y:
  - Uses Treesh purple/gold tokens
  - Perf/reduced motion disables heavy transitions, but functionality remains.

**Entry points (delivered + tested)**
1. **Left sidebar nav item** “Lyric Studio” (opens picker)
2. **My Music header** button (opens picker)
3. **Custom Studio manage uploads row** button (direct-open for that track)
4. **Song “⋯” menu** option “Add lyrics” / “Edit / sync lyrics”
5. **Now Playing**: when a song has no lyrics, shows an “Add lyrics” CTA in the lyrics pane

**Naming collision avoidance (delivered)**
- Existing `openLyricStudio()` / `open-lyric-studio` remains the **Lyric Card** maker.
- New sync tool uses distinct names/actions:
  - actions: `ls-*` (e.g. `ls-open`, `ls-picker`, `ls-save`)
  - functions: `openLyricSync()`, `renderLS()`, `closeLS()`

**Verification done (screenshots + runtime checks)**
- Picker opens and lists Catalog + My Music.
- Write → Sync transition works (sections preserved).
- Sync stamping works (button + Spacebar), auto-advance works.
- Per-line menu actions work (nudge/edit/insert/delete/type toggle).
- Save persists on-device and re-applies after refresh.
- Import works and returns to session.
- Export generates LRC, copy/download work.
- Entry points open correct song/session.
- `node --check` passes.

---

### Phase 5 — Karaoke Upgrade (replaces old karaoke)
**Status: COMPLETED (implemented as Phase 4D Part B)**

**Goals (confirmed)**
1. Fully **replace** existing character-fill karaoke with a **LyricFlow-style stage**.
2. Smooth word/character highlight with glow + active-line scaling.
3. Fullscreen karaoke mode has a clear exit control.
4. Reduced motion/performance mode disables heavy animations.

**Implementation (final)**
- Replaced `karaokeStageHtml()/buildKaraokeLine()/paintKaraoke()` logic with a new stage:
  - Persistent DOM: renders **all lines** into `#kstage-scroll` as `.k-line` elements
  - Each line pre-rendered as `.k-char` spans for smooth per-character lighting
  - Active line centered via `translateY` scroll (smooth transitions; disabled in perf-mode)
  - Active line appears as a big “glass” card with radial purple glow
  - Char sweep uses `.lit` + `.lit-edge` for glow edge while singing
  - Past/upcoming lines dimmed
- Works in both in-panel karaoke and fullscreen (`karFull`).
- Perf-mode still advances lyrics but removes transitions/animations.

**Verification done**
- After seeking into a sung section, char sweep advances (e.g. litChars 9 → 41 → 63, reset on line change).

---

### Phase 6 — Instrum Studio Polish
**Status: NOT STARTED**

**Goals**
1. Smooth open transition
2. Fix top row horizontal scroll
3. Fix overlapping labels

---

## 3. Next Actions
1. **Run comprehensive frontend testing (testing agent) for Phase 4D/5**
   - Lyric Studio flows: picker → write → sync → save → reopen (persistence)
   - Import/export flows
   - Entry points (sidebar / My Music / manage uploads / song menu / NP CTA)
   - Karaoke: in-panel + fullscreen + perf-mode
   - Regression: ensure Lyric Card studio still works (no naming collisions)
2. **Fix any bugs found by testing agent**
3. **Phase 6 (Instrum Studio polish)** (P2)

---

## 4. Success Criteria
- Accessibility toggles apply instantly, persist across reload, and do not break layout.
- Nav labels hide/show correctly on desktop + mobile; mobile nav height remains stable.
- Floating accessibility button is non-blocking and respects mini player.
- Lyric card options do not jump to top; font size control persists and affects export.
- Custom Studio uploads: upload/play/persist/edit/delete works; survives catalog refresh.
- Multi-upload: queue editing + Save all works.
- User uploads show `YOURS` badge and do not appear as official tracks in Icon profiles.
- Library paging works with All/12/24/50 defaults and “Load more”.
- **Lyric Studio (Phase 4D) — DELIVERED**:
  - Users can write/paste lyrics, timestamp them while audio plays, and save.
  - Section markers (`[Verse]`) are preserved as `sec` labels while not becoming sung lines.
  - Import from existing Treesh lyrics works.
  - Export LRC / copy text / download works.
  - All entry points open the Lyric Studio correctly.
  - Persists via `treesh_lyric_edits` and re-applies on refresh via `applyLyricEdits()`.
- **Karaoke upgrade (Phase 5) — DELIVERED**:
  - Old karaoke is removed/replaced.
  - New stage is smooth and visually stable (no choppy resets).
  - Fullscreen karaoke has a clear exit and respects reduced motion.

---

**Notes / Constraints**
- Single source of truth: `/app/single_html/index.html` (no backend).
- Vanilla JS + Tailwind CDN only; no build steps.
- LyricFlow reference: `/app/lyricflow_reference.txt`.
- **Critical**: All edits on `index.html` must be done via **strictly sequential** operations to avoid file corruption.
- Testing after each milestone via screenshot tool + `node --check`.

---

## Phase 4E — Continuation (New Session)  (Status: In Progress)

Confirmed with user (order + choices):

### Task 1 — Verify Word Sync & LRC Import (P0)  [Status: In Progress]
- Code already injected (`lsOpenWordSync`, `lswSetWord`, `lswSave`, `lsParseLRC`, `lsLoadLRC`).
- Verify via screenshot: word-sync modal opens from sync-row button, spacebar sets words, save persists `words[]`.
- Verify LRC paste/drop import parses `[mm:ss.xx]` lines and section `[tags]`.

### Task 2 — Blog Page (P0)  [Status: Not Started]
- Add new nav view `blog` (icon: newspaper) into `NAV` array.
- `viewBlog()` renders an iframe of `https://treesh.app/blog` (post-redirect URL; confirmed no X-Frame-Options / CSP → embeddable).
- Fallback: on iframe load error / timeout, show an "Open blog in new tab" button (user choice A).
- Wire into `renderView` switch + route handling.

### Task 3 — Instrum Studio Polish (P1)  [Status: Not Started]
- Smooth the open animation (landing → studio).
- Fix overlapping lane labels.
- Fix top-row (transport) horizontal scrolling behavior.

### Task 4 — Custom Music storage setting fix (P1)  [Status: Not Started]
- Remove the progress bar + "About # MB of space is still free…" text from the Custom music card in Settings → Account → Storage & data.
- Restyle Custom music into a normal storage-group-style row with a trash button (matches the other rows).
- Trash button → delete ALL custom music (with confirm).
- Provide a way to select/delete each track individually (open a manage modal listing each track with a delete button).

**Testing:** Frontend via screenshot tool + `node --check` after each task. Onboarding must be Skipped in automation (click "Skip").
