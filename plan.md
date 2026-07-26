# Treesh 3.0 — Development Plan (Single-file SPA)

## 1. Objectives
- Deliver a **P0 Accessibility suite** (all requested toggles) that applies instantly and persists to `localStorage`.
- Add **Nav label toggle** (icons-only vs icons+labels) with default “shown”, while preserving mobile nav height.
- Add **optional floating Accessibility quick button** (enabled/disabled from Settings) that never overlaps mini-player controls.
- Fix **Lyric Card “Options” scroll-to-top** bug (preserve scroll/viewport position).
- Add **Lyric Card font size control** (user-adjustable, persisted; affects preview + export).
- Add **sticky tabs behavior** for Settings and Games, with blur pills (no sticky-bar background) and correct scroll positioning.
- Add **Custom Studio**: fully offline, client-side **custom music uploader** using IndexedDB for audio/cover blobs, integrated into Library as **My Music**.
- (Acknowledged) Verse performer missing on `NEVER (Rock Version)` is due to **no section tags in source lyrics**; will be addressed later via Custom Lyrics Studio (tagging/heuristics).

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

### Phase 2E — Sticky tabs (Settings + Games)
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
**Status: DONE (fully implemented and verified)**

**User stories**
1. Tap “Add your music” in Library to import audio.
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

- **Library UX**
  - Added **My Music** chip (`__mine`) + dedicated heading.
  - Hero CTA: **Add your music**.
  - My Music section shows **Add** + **Manage** buttons.
  - My Music empty-state CTA.

- **Custom Studio dialog**
  - Tabs: Add track / Manage.
  - Full metadata fields: title*, artist, genre, album, featuring, writtenBy, producer, mixer, label, mood, videographer, release date, description, explicit.
  - Cover + Audio pickers.
  - Duration probe before save.
  - iPhone upload compatibility:
    - File inputs are `sr-only` (not `display:none`) for reliable label activation.
    - Broadened `accept` to include MP3/M4A/etc MIME types + extensions.
  - Fixed dialog horizontal scrolling via `overflow-x-hidden` and shrinkable grid (`minmax(0,1fr)` + `min-w-0`).

- **Manage uploads**
  - List uploads with play + delete.
  - Delete also available from track “⋯” menu as “Remove upload” with confirmation.

**Verification done**
- Upload → appears in My Music → plays (blob URL) → persists across reload → delete removes.

### Phase 4 — Adding More Features (after V1 is stable)

#### Phase 4A — Karaoke fixes (next priority)
**Status: NOT STARTED**

**Goals**
1. Smooth karaoke letter-by-letter highlight.
2. Fullscreen karaoke has a clear exit button.
3. Reduced motion disables karaoke animations.

**Implementation sketch**
- Inspect karaoke highlight loop (CSS vs rAF); ensure stable frame scheduling.
- Replace abrupt animation resets with continuous progress mapping.
- Add an always-visible “Exit fullscreen” control.

#### Phase 4B — Custom Lyrics Creation Studio
**Status: NOT STARTED**

**Goals**
- Create lyrics for tracks without them, with timestamping while audio plays.
- Ignore bracketed tags like `[Verse 1]` during timestamping.
- Enable verse/section labeling for tagless songs (e.g. `NEVER` by Savionce).

#### Phase 4C — Instrum Studio Overhaul
**Status: NOT STARTED**

#### Phase 4D — Offline Rule-based Voice Controls Overhaul
**Status: NOT STARTED**

(Other future items remain queued: Library filters, LyricFlow integration, etc.)

## 3. Next Actions
1. **Karaoke mode**: smooth letter animation + exit fullscreen.
2. Start **Custom Lyrics Creation Studio** (timestamping + section tagging; fixes verse-label gaps).
3. Proceed with Instrum Studio + Voice controls overhauls.

## 4. Success Criteria
- Accessibility toggles apply instantly, persist across reload, and do not break layout.
- Text Scale affects text only (no horizontal overflow; no control overlap).
- Nav labels hide/show correctly on desktop + mobile; mobile nav height remains stable.
- Floating accessibility button is non-blocking and respects mini player.
- Lyric card options do not jump to top; font size control persists and affects export.
- Settings + Games tabs are sticky, visually consistent, blur behind pills, and tab switching scrolls to content top.
- Custom Studio: upload/play/persist/delete works; stored blobs live in IndexedDB; survives catalog refresh; no console errors.

---
**Notes / Constraints**
- Single source of truth: `/app/single_html/index.html` (no backend).
- Vanilla JS + Tailwind CDN only; no build steps.
- All edits on `index.html` must be done via **strictly sequential** operations to avoid file corruption.