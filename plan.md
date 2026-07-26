# Treesh 3.0 — Development Plan (Single-file SPA)

## 1. Objectives
- Deliver a **P0 Accessibility suite** (all requested toggles) that applies instantly and persists to `localStorage`.
- Add **Nav label toggle** (icons-only vs icons+labels) with default “shown”.
- Add **optional floating Accessibility quick button** (enabled/disabled from Settings).
- Fix **Lyric Card “Options” scroll-to-top** bug (preserve scroll/viewport position).
- Add **Lyric Card font size control** (user-adjustable, persisted).
- (Acknowledged) Verse performer missing on `NEVER (Rock Version)` is due to **no section tags in source lyrics**; will be addressed later via Custom Lyrics Studio (tagging/heuristics).

## 2. Implementation Steps

### Phase 1 — Core POC (Isolation): IndexedDB upload/storage pipeline (needed)
Core risk is **custom music uploads** (blobs + persistence). Prove the IndexedDB layer before building UI.

**User stories (POC)**
1. As a user, I can select an audio file and it stores successfully without LocalStorage quota issues.
2. As a user, I can reload the app and still see the stored item.
3. As a user, I can delete a stored audio item and reclaim space.
4. As a user, I can store cover art (optional) alongside audio.
5. As a user, I can safely handle large files (fail gracefully with an error message if too big).

**POC tasks**
- Add a small **IndexedDB utility module** inside `index.html`:
  - DB name `treesh_db_v1`
  - Stores:
    - `user_audio` (keyPath `id`) → `{id, title, artist, album, duration?, addedAt, audioBlob, coverBlob?}`
    - `user_audio_meta` (optional if needed) or keep meta in same record
- Create minimal functions (no UI dependencies):
  - `idbOpen()`, `idbPutAudio(rec)`, `idbGetAllAudio()`, `idbDeleteAudio(id)`
- Add a **dev-only POC trigger** in Settings (hidden behind a toggle / only in console) or a small temporary button that:
  - stores 1 selected file
  - lists stored records
  - deletes selected
- Validate via manual reload + screenshot_tool.

### Phase 2 — V1 App Development (Accessibility + Lyric Cards + Nav labels)

#### Phase 2A — Accessibility settings (instant apply + persist)
**User stories**
1. As a user, I can enable high-contrast mode to improve readability.
2. As a user, I can enable reduced motion to avoid nausea and improve performance.
3. As a user, I can increase global text size beyond current presets.
4. As a user, I can enable a dyslexia-friendly font to reduce reading strain.
5. As a keyboard user, I can clearly see focus outlines and navigate confidently.

**Implementation**
- Add new `state` keys + `localStorage` keys:
  - `state.a11y = LS.get('treesh_a11y', { highContrast:false, reducedMotion:false, textScale:1, dyslexiaFont:false, lyricSpacing:'normal', focusRings:true, underlineLinks:false, boldText:false, cbPalette:'default', quickBtn:false, hideNavNames:false })`
  - Also store `treesh_hide_nav_names` separately if preferred for backward compatibility.
- Add `applyA11y()`:
  - Toggle classes on `document.documentElement` (preferred) e.g. `a11y-contrast`, `a11y-reduce-motion`, `a11y-dyslexia`, `a11y-focus`, `a11y-underline`, `a11y-bold`, `a11y-cb-*`, `a11y-nav-icons`.
  - Set CSS vars for scalable font sizing: `--a11y-scale` and apply via `html{ font-size: calc(var(--base-font, 16px) * var(--a11y-scale)); }` while keeping existing `applyTextSize()` intact (map to `--base-font`).
  - Reduced motion:
    - Add CSS override: `html.a11y-reduce-motion *, html.a11y-reduce-motion *::before, html.a11y-reduce-motion *::after { animation-duration:0.001ms !important; animation-iteration-count:1 !important; transition-duration:0.001ms !important; scroll-behavior:auto !important; }`
  - High contrast + color-blind palette:
    - Override core tokens: `--app-bg`, `--app-text`, `--treesh-stroke`, accent variants.
- Add a new **Settings → Accessibility** section (same card style, using `toggleCard()`):
  - Toggles: High contrast, Reduced motion, Dyslexia font, Strong focus rings, Underline links, Bold text, Floating quick button, Hide nav names.
  - Controls:
    - Text scale slider (e.g. 1.0–1.35)
    - Lyric spacing segmented (Normal / Spacious)
    - Color-blind palette segmented (Default / Deuteranopia / Protanopia / Tritanopia-friendly presets)
- Ensure every toggle:
  - applies immediately (`applyA11y()`)
  - persists immediately (`LS.set('treesh_a11y', state.a11y)`)
  - triggers minimal rerender when needed (`renderShell()` for nav label change; `renderView()` otherwise).

#### Phase 2B — Nav label toggle (icons-only)
**User stories**
1. As a user, I can hide page names in the sidebar to save space.
2. As a user, I can keep labels visible by default.
3. As a user, mobile nav stays usable even without labels.
4. As a user, tooltips/aria-labels still explain icons.
5. As a user, setting persists across reloads.

**Implementation**
- Modify `navItem()` to conditionally render label text:
  - When `state.a11y.hideNavNames` is true, hide label span and add `title`/`aria-label`.
- Adjust sidebar width if desired (optional MVP: keep width, just hide labels).

#### Phase 2C — Floating accessibility quick button (optional)
**User stories**
1. As a user, I can quickly access accessibility toggles from any view.
2. As a user, I can disable the floating button from Settings.
3. As a user, the button doesn’t block Now Playing controls.
4. As a user, the menu is keyboard accessible.
5. As a user, changes apply instantly.

**Implementation**
- If `state.a11y.quickBtn`:
  - Render a small fixed button (bottom-right above mobile nav) opening a compact popover with the most-used toggles.

#### Phase 2D — Lyric Card fixes + font size control
**User stories**
1. As a user, opening Lyric Card options should not jump the page to the top.
2. As a user, I can increase/decrease Lyric Card font size.
3. As a user, my chosen size persists for exports.
4. As a user, previews update live.
5. As a user, defaults still look great (auto-fit remains baseline).

**Implementation**
- Scroll-jump fix:
  - Identify the lyric card “options” click handler.
  - Preserve scroll position before opening modal/popover (`const y=window.scrollY`), then restore after DOM mutation (`requestAnimationFrame(()=>window.scrollTo(0,y))`).
  - If the jump is caused by an `<a href="#">`, change to `<button>` or `preventDefault()`.
- Font size control:
  - Add `state.cardFontScale` or include inside an existing lyric-card settings object, persist in `localStorage`.
  - Update the card canvas text sizing logic: apply multiplier to the computed auto-fit font size, with clamps.
  - Add a slider in the Lyric Card studio UI (and/or Settings) to control it.

### Phase 3 — Adding More Features (after V1 is stable)

#### Phase 3A — Custom Music Upload (full feature using proven POC)
**User stories**
1. As a user, I can tap “Add your music” in Library and import audio.
2. As a user, I can attach cover art and edit metadata.
3. As a user, imported tracks appear in Library and are playable.
4. As a user, I can remove imported tracks.
5. As a user, app remains fast even with many imports.

**Implementation**
- Add Library CTA → import modal.
- Use IndexedDB POC functions for storage.
- Extend SONGS in-memory with `source:'user'` entries loaded from IDB on startup.

#### Phase 3B — Karaoke fixes (next priority)
**User stories**
1. As a user, karaoke highlighting is smooth.
2. As a user, fullscreen karaoke has a clear exit button.
3. As a user, reduced motion disables karaoke animations.
4. As a user, performance is stable on mobile.
5. As a user, returning from fullscreen restores layout.

(Other future items remain queued: Instrum Studio, Voice controls, Custom Lyrics Studio, etc.)

## 3. Next Actions
1. Implement **IndexedDB POC** utilities and verify persistence via reload.
2. Add `state.a11y` schema + `applyA11y()` + CSS class overrides.
3. Add **Settings → Accessibility** section + floating button toggle.
4. Implement **nav label hide** in `navItem()` and rerender shell.
5. Fix **lyric card options scroll jump**.
6. Add **lyric card font size control** and persist.
7. Run screenshot_tool checks across: Settings, Nav, Now Playing lyrics, Lyric Card studio.

## 4. Success Criteria
- Accessibility toggles apply instantly, persist across reload, and don’t break existing styles.
- Nav labels hide/show correctly on desktop + mobile, with tooltips/aria-labels intact.
- Floating accessibility button appears only when enabled; popover is usable and non-blocking.
- Lyric card options no longer jump to top; font size control affects preview/export and persists.
- No regressions in Now Playing / lyric line interactions; shimmer remains smooth (already fixed).
