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
Phase M completed. Next backlog to implement (not started yet):
1. **Voice Controls Upgrade (P1)** — make custom voice controls editable + add more built-ins
2. **Search Upgrade (P1)** — search settings and toggle options directly from results
3. **Rename “Cover Art Studio” → “Image Studio” (P2)** + planned updates
4. **Karaoke Mode Fullscreen Revamp (P2)**
5. **Lyric Card Studio Revamp (P2)** — preview always showing
6. **Crossfade & Smooth Transitions (P2)** — default 6s

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
  - ✅ Backdrops Studio usable on mobile + now supports **multi-layer text/stickers**
  - ✅ My Music Manager shows song + artist names correctly
  - ✅ Queue drawer correct in Light Mode
  - ✅ Global Font Color setting implemented
- Next objectives (P1/P2):
  - Voice Controls upgrade (editable + more commands)
  - Search upgrade (settings search + quick toggles)
  - Rename Cover Art Studio → Image Studio
  - Crossfade, Karaoke fullscreen, Lyric Card Studio improvements

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

### Phase N (NEXT) — Voice Controls Upgrade (Not Started)
Planned scope:
- Editable custom commands (currently delete-only)
- Expand built-in command set
- Keep silent-by-default assistant policy

---

### Phase O (NEXT) — Search Upgrade (Not Started)
Planned scope:
- Search settings options
- Toggle settings directly from search results

---

### Phase K (P2) — Rename Cover Art Studio → Image Studio (Not Started)
- Rename module + apply planned updates

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
1. Begin **Phase N** Voice Controls upgrade (editable commands + more built-ins)
2. Begin **Phase O** Search upgrade (settings search + toggles)
3. Then proceed with P2 items (Image Studio rename, Karaoke, Lyric Card, Crossfade)
4. Run regression screenshots after each major UI module change

---

## 4) Success Criteria (updated)
- Backdrops Studio:
  - Modal never overflows on mobile portrait
  - Supports **multiple layers** (text + emoji stickers)
  - Per-layer drag/move, resize (pinch/wheel/handle), rotate (handle/slider/twist)
  - Per-layer font + color
- Music Manager:
  - Song + artist names readable on mobile
  - Manager mode shows only Edit/Trash inline
- Queue:
  - Light mode queue drawer is light and readable
- Font Color Settings:
  - Global font color can be changed and persists
  - Immersive overlays/toasts remain readable
- No regressions:
  - App remains offline-first
  - No code wipes (sequential edits only)
  - No console errors on boot