# Treesh 3.0 Continuation — Phase 5 Plan (Updated)

## ▶ SESSION LOG (latest continuation — user-confirmed Phase M batch)
Phase M fully **COMPLETED & verified** this session (mobile screenshots + `node --check` + zero console errors).

### ✅ Phase M1 — Backdrops Studio Revamp (COMPLETED + extended)
**Core fixes (P0) — verified:**
- Modal now fits **all mobile portrait** screens:
  - Sticky header
  - Internal scroll body (`max-h` with `100dvh`)
  - No overflow / off-screen content
- Live preview editing:
  - **Drag** to move text (pointer drag)
  - **Resize** via pinch (mobile), mouse wheel (desktop), and handle
  - **Two-way sync** with X/Y/Size sliders

**Major extension (user-requested) — multi-layer editor (verified):**
- **Multiple layers** per backdrop via `meta.texts[]` model
  - Auto-migrates legacy `meta.text` into first layer
- **Emoji stickers** palette (adds `kind:'emoji'` layers)
- **Rotation**:
  - Slider control
  - On-canvas rotate handle
  - Two-finger twist (pinch + rotate) support
- **Per-layer colors + fonts**:
  - Font chips from `FONTS`
  - `bgFontStack()` + `bgEnsureFonts()` ensure Google font loading
- Background renderer updated:
  - `bgLayerInnerHtml()` now renders **all layers** (text + emoji) with rotation and per-layer styling

**New/updated actions (Backdrops):**
- `bd-text-add`, `bd-text-select`, `bd-text-delete`
- `bd-emoji-add`
- `bd-text-font`
- `bd-text-pos` repurposed to Y presets; `bd-text-align` per-layer
- `bd-apply-text-all` now copies layer stacks to all backdrops

### ✅ Phase M2 — Custom Music Manager UI Fix (COMPLETED)
- `songRow()` manager mode now shows only **Edit + Trash** inline
- Removed **⋯ menu** and **Most Played** badge in manager mode to free space
- Result: **song + artist names are visible** at narrow widths (verified)

### ✅ Phase M3 — Queue Drawer Light Mode Fix (COMPLETED)
- Added CSS override so `.queue-panel` background becomes **white in Light Mode**
- Verified computed `background-color: rgba(254,254,254,0.96)`

### ✅ Phase M4 — Font Color Settings (COMPLETED)
- Implemented global text tint:
  - `state.inkColor` + `localStorage: treesh_ink_color`
  - `applyCustomColors()` now sets CSS `--ink` and toggles `html.tr-inkcolor`
  - Settings → Appearance includes a new **Font color** card
  - Reset action: `reset-ink-color`
- Safety: excludes immersive dark surfaces (`#voice-ov`, `#toast`, `#sleep`, `.dark-surface`, `#bg-text`) to prevent unreadable overlays
- Verified: tint applies to primary text; toasts remain white

---

## ▶ SESSION LOG 2 (previous continuation)
DONE in prior session (already in codebase):
- Custom Song Likes (heart on custom songs)
- Lyric Studio Tips UI toggle
- Backdrops Studio core (9 images, slideshow, filters, dim slider)
- Instrum Vocals STEM EDITING (trim/speed/copy/paste/marquee/per-stem FX)

### STEM EDITING (DONE + verified)
- Clip model extended: `{offset,len,rate,buflen,fx}` + derived dur=`len/rate`
- Playback uses rate + `start(offset,len)` and per-stem FX overrides
- Trim handles + speed handle
- Clip body drag, paste at playhead
- Selection: select toggle + marquee (mouse/hold)

---

## ▶ ACTIVE SESSION ORDER (user-confirmed)
Phase M completed. Next backlog to implement (user confirmed scope 1a/2a/3a):
1. **Phase N: Voice Commands upgrade (P1)** — editable saved commands + tap-to-pick builder for built-in actions + expanded built-in commands/suggestions
2. **Phase O: Settings Search upgrade (P1)** — new **Settings** tab inside the global search overlay; search settings and toggle directly from results
3. **Phase K: Image Studio (P2)** — rename **Cover Art Studio → Image Studio** everywhere + add Backdrops-style layer suite (text + emoji stickers, drag/rotate/resize, fonts, colors) baked into export

Then continue with:
- Karaoke Mode Fullscreen Revamp (P2)
- Lyric Card Studio Revamp (P2) — preview ALWAYS showing
- Crossfade & Smooth Transitions (P2) — default 6s

Constraints reminder:
- Single-file `/app/single_html/index.html` only
- Tailwind CDN only; **no npm/yarn**
- Offline-first (LocalStorage + IndexedDB)
- Edits must be **STRICTLY SEQUENTIAL** (avoid parallel edits / race-condition wipes)
- Respond in English

Testing reminders:
- Use screenshot tool in **mobile portrait** to validate modal fit
- For automated testing agent: set
  - `localStorage.setItem('treesh_whatsnew_off','true')`
  - `localStorage.setItem('treesh_profile','{}')`
  to bypass blocking onboarding/What’s New modals

---

## 1) Objectives (updated)
- Keep **single-file architecture** (`/app/single_html/index.html`), zero build steps, offline-first (LocalStorage + IndexedDB). **No NPM/Yarn.**
- Maintain and extend **Instrum Studio mini-DAW** while preserving stability.
- Completed UX-critical fixes:
  - ✅ Backdrops Studio usable on mobile + now supports **multi-layer text/stickers** (with rotation/fonts/colors)
  - ✅ My Music Manager shows song + artist names correctly
  - ✅ Queue drawer correct in Light Mode
  - ✅ Global Font Color setting implemented
- Next objectives (P1/P2):
  - **Voice Commands**: edit saved commands + easier creation via built-in picker + more built-in commands
  - **Settings Search**: find settings and toggle directly from search results (in global Search overlay)
  - **Image Studio**: rename Cover Art Studio and add Backdrops-grade layers baked into export

---

## 2) Implementation Steps (Phased)

### Phase 0 (P0) — iOS Background Playback & Auto-Advance (Partially Done)
**What’s implemented (previous):**
- iOS guard in `ensureVizAudio()`
- Removed `audio.load()` on track changes; `audio.preload="auto"`; MediaSession rebind; visibility handler

**Validation still required on device:** iPhone background playback, lock screen controls, auto-advance at track end

---

### Phase J (P0/P1) — Sleek Loading Screen & Welcome Modal Refresh (Partially Done)
- Welcome modal: reworked onboarding steps (DONE previously)
- Boot splash: `#app-splash` instant paint to reduce FOUC (DONE previously)

---

### Phase L (P0/P1) — Instrum Studio DAW Upgrade (In Progress / Major Track)
Current state includes:
- Beat Maker vs Vocals & Audio pages
- Vocal FX wiring
- Stem/clip editing (trim/speed/copy/paste/marquee/per-stem FX)

Remaining DAW work:
- recording UX polish, session mgmt, mixing/export, additional per-stem FX UX improvements

---

### Phase M (COMPLETED — implemented this session)

#### Phase M1 (P0) — Backdrops Studio Revamp + Layer Editor (COMPLETED)
Delivered:
- Responsive, mobile-safe modal shell (sticky header + dvh internal scroll)
- Live preview editing with drag + pinch/wheel/handle resize, two-way slider sync
- Extended to:
  - `meta.texts[]` multi-layer model + legacy migration
  - Emoji sticker layers
  - Rotation (slider + rotate handle + two-finger twist)
  - Per-layer fonts/colors; background rendering updated to match

Testing:
- Verified via mobile portrait screenshots and interaction automation

#### Phase M2 (P0) — Custom Music Manager UI Fix (COMPLETED)
Delivered:
- Manager rows show only Edit + Trash inline, eliminating crowding

Testing:
- Narrow-width render verified

#### Phase M3 (P1) — Queue Drawer Light Mode Fix (COMPLETED)
Delivered:
- Light Mode queue drawer now uses white surface via CSS override

Testing:
- Verified computed background color + screenshot

#### Phase M4 (P1) — Font Color Settings (COMPLETED)
Delivered:
- Global font tint (`treesh_ink_color`) with Settings UI + reset
- Safe exclusions for immersive dark surfaces

Testing:
- Verified color application + toast/overlays remain readable

---

### Phase N (NEXT) — Voice Commands Upgrade (Scoped  2a)
**User-confirmed scope:** editable saved macros + tap-to-pick builder of built-in actions + more built-ins/suggestions.

Planned implementation:
- **Edit existing macros**:
  - Add “Edit” action on each saved macro row (in Settings)
  - Load macro into the phrase/steps inputs for update
  - Add `voice-macro-save` (update existing) vs `voice-macro-add` (new)
  - Preserve IDs; allow cancel.
- **Tap-to-pick builder**:
  - Add a “Suggested actions” list with chips (e.g., `shuffle`, `repeat`, `open queue`, etc.)
  - Clicking a chip appends to the steps input (comma-separated)
  - Provide “clear steps” and quick templates (“Party mode”, “Study mode”, “Sleep mode”).
- **Expand built-in commands**:
  - Extend `VOICE_HELP` categories with additional commands
  - Expand `voiceChips()` suggestions (context-aware: queue open, now playing, etc.)
  - Ensure `voiceExec()` supports all new commands (add missing cases).

Testing:
- Screenshot: Settings → Voice section macro edit flow
- Voice overlay: verify new suggestion chips appear; run a saved macro executes multiple steps

---

### Phase O (NEXT) — Settings Search inside Global Search Overlay (Scoped  3a)
**User-confirmed scope:** new “Settings” tab inside the existing global Search overlay.

Planned implementation:
- Add new tab: `settings` to search overlay UI (alongside songs/artists/lyrics)
- Create a lightweight `SETTINGS_INDEX` registry describing:
  - id, label, description, section, type (`toggle` | `action` | `picker`), getter/setter
  - example: Theme toggle, Animated background, Performance mode, Explicit lock, Karaoke mode, etc.
- Implement `searchSettingsList(q)` using the existing `scoreFields()` utility.
- Render results as cards/rows with:
  - Label + description
  - Inline **toggle** UI for boolean settings
  - “Go to setting” button for complex/picker settings (navigates to Settings view and scrolls to the relevant card)
- Ensure state updates call existing functions (`applyTheme`, `applyCustomColors`, `renderView`, etc.) without regressions.

Testing:
- Screenshot: Search overlay → Settings tab
- Interactions: toggle settings directly from results; ensure UI updates immediately

---

### Phase K (NEXT) — Image Studio (Cover Art Studio → Image Studio) + Backdrops-grade Layers (Scoped  1a)
**User-confirmed scope:** rename + add Backdrops-style layer suite baked into export.

Planned implementation:
- **Rename** all user-facing strings:
  - “Cover Art Studio” → “Image Studio”
  - Update tooltips, help strings, data-testids only if safe (avoid breaking existing tests unless requested)
- **Layer suite** (baked into output canvas):
  - Add `cvLayers[]` with similar schema to Backdrops: `{id, kind:'text'|'emoji', text, x,y,size,rot,color,align,font}`
  - Preview overlay on the canvas area (SVG/DOM overlay OR draw handles on canvas + HTML controls)
  - Add UI panel:
    - Add text layer, add emoji sticker
    - Per-layer edit: content (text), font, color, size, rotation, X/Y
    - Drag to move, pinch/wheel/handle resize, rotate handle (desktop + mobile)
  - Update `cvRender(ctx, S)` to draw all layers after image/filter adjustments.
- Ensure image export remains a Blob and continues to integrate with Music Manager cover saving (`_amCoverBlob`, `_amCoverURL`).

Testing:
- Screenshot: Image Studio open, with 2 layers (text + emoji) rotated and resized
- Apply cover: ensure exported cover shows layers in preview, persists on save

---

### Phase E (P2) — Crossfade & Smooth Transitions (Not Started)
- Crossfade for manual and auto-advance transitions (default 6s)

---

### Phase F (P2) — Karaoke Fullscreen Revamp (Not Started)

---

### Phase G (P2) — Lyric Card Studio Revamp (Not Started)
- Preview always showing

---

## 3) Next Actions (Immediate)
1. Implement **Phase N** Voice Commands upgrade (editable + tap-to-pick + more built-ins)
2. Implement **Phase O** Settings Search tab in global search overlay (search + toggles)
3. Implement **Phase K** Image Studio rename + layer suite baked into export
4. Run regression screenshots after each phase (mobile portrait focus for modals)

---

## 4) Success Criteria (updated)
- Voice Commands:
  - Existing saved commands can be edited (phrase + steps) and re-saved
  - Built-in actions can be appended via taps (no typing required)
  - Expanded built-in list is reflected in help + chips, and all are supported by `voiceExec()`
- Settings Search:
  - New Settings tab exists in global Search overlay
  - Query returns relevant settings
  - Boolean settings can be toggled directly from results
  - Complex settings can be navigated-to reliably
- Image Studio:
  - UI renamed from Cover Art Studio → Image Studio everywhere
  - Supports text + emoji layers with drag/resize/rotate and fonts/colors
  - Exported image includes layers baked in and still saves as cover art
- No regressions:
  - App remains offline-first
  - No code wipes (sequential edits only)
  - No console errors on boot
