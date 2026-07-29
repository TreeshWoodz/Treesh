# Treesh 3.0 — Development Plan (Single-file SPA)

## 1. Objectives
- Deliver a **P0 Accessibility suite** (all requested toggles) that applies instantly and persists to `localStorage`.
- Add **Nav label toggle** (icons-only vs icons+labels) with default “shown”, while preserving mobile nav height.
- Add **optional floating Accessibility quick button** (enabled/disabled from Settings) that never overlaps mini-player controls.
- Fix **Lyric Card “Options” scroll-to-top** bug (preserve scroll/viewport position).
- Add **Lyric Card font size control** (user-adjustable, persisted; affects preview + export).
- Add **sticky tabs behavior** for Settings and Games, with blur pills (no sticky-bar background) and correct scroll positioning.
- Add **Custom Studio**: fully offline, client-side **custom music uploader** using IndexedDB for audio/cover blobs, integrated into Library as **My Music**.
- Expand Custom Studio into a combined **Custom Studio → Lyric Studio** workflow (timestamped lyrics + verse labeling) and a standalone Lyric Studio entry.
- Improve Library UX: filters, pagination, and empty-playlist “Add songs” flow.
- Polish key playback UX: **Karaoke mode** smoothing + exit fullscreen.

Constraints / non-goals:
- **SoundCloud import is SKIPPED** (not freely feasible; API registration closed; ToS concerns).
- No backend, no build steps, no npm/yarn. Single source of truth remains `/app/single_html/index.html`.

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
- **Text Scale is font-only** (CSS overrides using `--a11y-scale`) to avoid zooming layout/controls (fixes horizontal overflow and overlapping color dots).
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
- Also fixed lyric line shimmer to be seamless (no abrupt restart).

#### Phase 2E — Sticky tabs (Settings + Games)
**Status: DONE**

**Settings**
- Sticky tabs bar uses **no background**.
- Individual pills use `backdrop-blur` + frosted styling for legibility.
- Sticky position is below fixed header with a consistent gap (top: 88/94).
- Switching tabs scrolls to the tab bar’s pinned position using `offsetTop` (not boundingRect) so content starts at the correct location.
- Ensured sufficient scroll room via `min-h-[85vh]` on the settings panel wrapper.

**Games**
- Game tabs upgraded to match Settings (same sticky + blurred pills).
- Switching game tabs scrolls to pinned position.
- Ensured sufficient scroll room via `min-h-[85vh]` on the game panel.

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

- **Library UX (current)**
  - Added **My Music** filter and UI.
  - Hero CTA button renamed to **Custom Studio** (icon updated) and wrap alignment fixed.

- **Custom Studio dialog (current)**
  - Tabs: Add track / Manage.
  - Full metadata fields: title*, artist, genre, album, featuring, writtenBy, producer, mixer, label, mood, videographer, release date, description, explicit.
  - Cover + Audio pickers.
  - Duration probe before save.
  - iPhone upload compatibility:
    - File inputs are `sr-only` (not `display:none`) for reliable label activation.
    - Broadened `accept` to include MP3/M4A/etc MIME types + extensions.
  - Fixed dialog horizontal scrolling via `overflow-x-hidden` and shrinkable grid (`minmax(0,1fr)` + `min-w-0`).

- **Manage uploads (current)**
  - List uploads with play + delete.
  - Delete also available from track “⋯” menu as “Remove upload” with confirmation.

**Verification done**
- Upload → appears in My Music → plays (blob URL) → persists across reload → delete removes.

**Known issue / work in progress**
- **Edit upload flow is IN PROGRESS** (edit button wiring + IDB update path).

### Phase 4 — New Large Scope (user-approved; build in order; test each phase)

> Global additions for this phase:
> - **Badge text for user uploads:** `YOURS`
> - **Library pagination setting:** options **12/24/50** (default **24**)
> - **Multi-upload:** both supported:
>   1) multi-file pick → editable list → **Save all**
>   2) multi-file pick → **quick-save** (filename as title) → edit later
> - **Lyric Studio:** both timestamping modes + more tools; integrate LyricFlow (user will resend file when needed)
> - **SoundCloud import:** SKIPPED

#### Phase 4A — Custom Studio core (V2)
**Status: COMPLETED (verified via node --check + screenshot flows; no console errors)**

**Delivered**
1. Edit mode end-to-end: prefill all metadata + genre + cover, replace audio (optional), IndexedDB record updated in place via `idbGet`/`idbPut`. New `edit-upload` action wired.
2. Audio preview player (play/pause + seek + duration) inside Custom Studio, for both a newly picked file and the existing track in edit mode. Cleaned up on modal close.
3. Mobile layout: cover art capped/centered on phones, larger scroll area, no horizontal overflow.
4. Duplicate "My Music" fixed: removed the `__mine` filter chip, filtered "My Music" out of catalog GENRES chips, added a dedicated **My Music section** (with YOURS cards) above the genre chips plus a dedicated full `viewMyMusic()` page reached via "See all".
5. Custom-music storage indicator card in Account → Storage (track count, bytes used, gauge, free-space hint) via `updateCustomMusicStorage()`.

**Extra user requests (same session) — COMPLETED**
- Welcome/onboarding modal: removed the "Treesh 3.0" badge/text, replaced with the Treesh logo image (`treesh_logo.png`) and a "TREESH" text fallback (`brandFallback`) matching the top bar. Welcome heading is now "Welcome to Treesh".
- Removed ALL em-dashes across the app (28 escaped + 8 literal) and reworded the affected copy to read naturally. Verified 0 remaining.

#### Phase 4B — Power features
**Status: NOT STARTED**

**Goals**
1. Multiple uploads at once:
   - Select multiple files
   - Show queue list with per-item editable metadata
   - Save all / quick-save mode
2. `YOURS` badge for user songs (especially when artist name matches an existing icon)
3. Exclude custom songs from real artist/icon profile:
   - When viewing an artist profile, filter out `song._user===true`
   - Still allow these songs to exist in Library and My Music

#### Phase 4C — Library UX upgrades
**Status: NOT STARTED**

**Goals**
1. Empty playlist view → “Add songs” CTA
2. “Add songs” modal:
   - List **all songs**
   - Search
   - Filter/sort
   - Multi-select + add to playlist
3. New Library filter options
4. Pagination:
   - Show N at a time (setting: 12/24/50; default 24)
   - “Load more” adds the next N
   - Setting location: Settings → Library (new section) or Appearance (confirm placement during implementation)

#### Phase 4D — Lyric Studio (LyricFlow integration)
**Status: NOT STARTED**

**Goals**
- Integrate a full **Lyric Studio** into Custom Studio:
  - Create/edit lyrics for tracks without them (e.g., `NEVER` by Savionce)
  - Timestamp lyric lines while audio plays
  - Ignore bracketed tags (e.g., `[Verse 1]`) during timestamp capture **but keep them as section labels**
  - Verse labeling enables Verse Performer even when the source lyrics have no tags
- Provide a standalone entry point for Lyric Studio (button somewhere appropriate)
- Support timestamping modes:
  1) Tap “Set time” while playing + nudge ±0.1s + manual edit
  2) Manual mm:ss entry
- Add rich tools inspired by the user’s **LyricFlow** file (user to resend when Phase 4D begins)

### Phase 5 — Karaoke Polish
**Status: NOT STARTED**

**Goals**
1. Smooth karaoke word-by-word highlight (remove choppiness)
2. Fullscreen karaoke has a clear exit button
3. Reduced motion disables karaoke animations

**Implementation sketch**
- Inspect karaoke highlight loop (CSS vs rAF); ensure stable frame scheduling.
- Replace abrupt animation resets with continuous progress mapping.
- Add always-visible “Exit fullscreen” control.

### Phase 6 — Instrum Studio Polish
**Status: NOT STARTED**

**Goals**
1. Smooth open transition
2. Fix top row horizontal scroll
3. Fix overlapping labels

## 3. Next Actions
1. **Phase 4A (Custom Studio core V2)**
   - Finish Edit mode end-to-end (ALL metadata + cover + audio replace)
   - Add audio preview before saving
   - Fix My Music duplication + restructure My Music as a top section
   - Add storage capacity indicator (Custom Studio) in Account settings
2. **Phase 4B (Power features)**
   - Multi-upload queue + Save all / quick-save
   - `YOURS` badge + exclude user uploads from real icon profiles
3. **Phase 4C (Library UX)**
   - Empty-playlist add-songs modal
   - Library filters + pagination setting (12/24/50)
4. **Phase 4D (Lyric Studio)**
   - Ask user to resend LyricFlow file and integrate
5. Karaoke, then Instrum Studio polish

## 4. Success Criteria
- Accessibility toggles apply instantly, persist across reload, and do not break layout.
- Text Scale affects text only (no horizontal overflow; no control overlap).
- Nav labels hide/show correctly on desktop + mobile; mobile nav height remains stable.
- Floating accessibility button is non-blocking and respects mini player.
- Lyric card options do not jump to top; font size control persists and affects export.
- Settings + Games tabs are sticky, visually consistent, blur behind pills, and tab switching scrolls to content top.
- Custom Studio V1: upload/play/persist/delete works; stored blobs live in IndexedDB; survives catalog refresh; no console errors.
- Custom Studio V2: edit works (all metadata + cover + audio replace), pre-save audio preview works, mobile layout is clean.
- My Music is a single, clear top section (no duplicates) and user genres do not pollute catalog genres.
- Multi-upload supports queue editing + Save all and quick-save.
- User uploads show `YOURS` badge and do not appear as official tracks in icon profiles.
- Library has add-songs modal for empty playlists, new filters, and pagination via settings.
- Lyric Studio supports timestamping + section labels, enabling verse performer for tagless songs.

---
**Notes / Constraints**
- Single source of truth: `/app/single_html/index.html` (no backend).
- Vanilla JS + Tailwind CDN only; no build steps.
- All edits on `index.html` must be done via **strictly sequential** operations to avoid file corruption.
