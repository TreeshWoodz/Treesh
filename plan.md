# Treesh 3.0 — Single-File UI Fixes + Lyrics + Games + Instrum (UPDATED)

## 1) Objectives
- Deliver all remaining fixes/features in **`/app/single_html/index.html` only** (Vanilla JS + Tailwind CDN + localStorage). **No build step.**
- Preserve the premium Treesh design language (dark + glass + custom accent) and ensure:
  - **Karaoke highlighting is smooth** and easy to follow (P0)
  - **Like/Dislike animations** are premium and on-brand (accent color only) (P0)
  - **Dislike button + queue/shuffle exclusion** works reliably (P0/P1)
  - **Games section** is restructured with tabs and includes a complete **This or That** game (P0)
  - **Instrum** looks like a real studio (BandLab/Ableton-esque) while keeping its engine intact (P1)
- Prioritize **mobile playback UX correctness** (no overlaps), **overlay scroll locking**, and reduced-motion/performance-mode behavior.
- **English-only** UI copy and responses.

---

## 2) Implementation Steps

### Phase 1 — Core Bug Fixes & Mobile Foundation (DONE)
**User stories**
1. As a user, I can tap **Info** in Now Playing and see complete song credits/details.
2. As a user, when I press **Next/Prev**, the lyrics always update to the new song.
3. As a user, I can tap any item in **Up Next** to jump to it immediately.
4. As a mobile user, when Now Playing (or overlays) are open, the page cannot scroll behind them.
5. As a user, the mini-player never overlaps the bottom navigation.

**Work completed**
- **Metadata Modal (P0)**
  - Added `np-meta` handler.
  - Implemented metadata modal from `SONG_BY_ID` and **Copy credits**.
- **Lyrics not updating**
  - Fixed `onSongChange()` to always re-render Now Playing when open.
- **Queue selectable**
  - Added `q-jump` UI + handler.
- **Mobile scroll lock**
  - Implemented `syncScrollLock()` and wired into overlays.
- **Mini-bar offset**
  - Safe-area-aware minibar offset logic added.
- **iOS input zoom**
  - Inputs forced to `>=16px`.

**Phase 1 testing completed**
- DOM checks: metadata modal open, queue jump, lyric refresh.
- Functional checks: scroll lock prevents background scroll.

---

### Phase 2 — Global Full-Screen Search Overlay (DONE)
**User stories**
1. As a user, I can tap a **Search icon button** and get a full-screen search overlay.
2. As a mobile user, the search input is at the **bottom** and stays reachable while typing.
3. As a user, I can toggle results between **Songs / Artists / Lyrics**.
4. As a user, I can quickly replay recent searches from **history chips**.
5. As a user, search results let me play a song, open an artist, or jump to a lyric match.

**Work completed**
- Added `renderSearchOverlay()` with bottom dock and `visualViewport` keyboard support.
- Persisted recent searches (`treesh_recent_searches`, max 8).
- Wired results actions (songs play, artists navigate, lyrics play+seek).

**Phase 2 testing completed**
- Verified overlay open/close, typing, toggles, play actions, recent chips.

---

### Phase 3 — Settings / Voice / Artist / Desktop Profile Accessibility (DONE)
**User stories**
1. As a user, Settings looks premium and easy to scan.
2. As a user, I can pick from many accents or set a **custom accent**.
3. As a user, I can use **dark/light mode**, multiple backgrounds, text sizing, and a custom image background with overlay.
4. As a user, the voice listening UI is centered and never cut off.
5. As a user, I can read an Icon’s bio inside their header.
6. As a desktop user, Profile access is easy from the sidebar.
7. As a user, I can access Privacy/Terms/Copyright.

**Work completed**
- Settings v2 (hero + tabs): Accent / Display / Sleep / Voice / Account / About.
- Accent presets + custom hex.
- Display controls: theme, backgrounds, custom image + dim overlay, text size.
- Voice overlay redesigned for safe-area.
- Artist bio moved into artist header.
- Desktop sidebar profile card.

**Phase 3 testing completed**
- Screenshot verification + functional checks.

---

### Phase 4 — Lyrics Upgrades: Karaoke Mode + Report/Edit + Sleep Timer (PARTIALLY VERIFIED)
**User stories**
1. As a user, I can switch to **Karaoke mode** and follow one centered line at a time.
2. As a user, I see a smooth accent fill animation synced to lyric timing.
3. As a user, I can edit incorrect lyrics inline and keep my edits on this device.
4. As a user, I can report lyrics via email with the full corrected text included.
5. As a user, I can enable a **Sleep Timer** that triggers only after inactivity.

**Work completed**
- Karaoke stage renderer + per-character fill (current approach = discrete toggles).
- Lyric edit + report via mailto; edits persisted in `treesh_lyric_edits`.
- Sleep timer with inactivity trigger + ambient overlay.

**Remaining (superseded by Phase A below)**
- Karaoke highlight smoothness is not acceptable yet (reported choppy).

---

### Phase 5 — Motion System (DONE; continue polish as needed)
**User stories**
1. As a user, homepage content animates in after load.
2. As a user, page/section transitions feel seamless and premium.
3. As a user, song cards animate in as I scroll.

**Work completed**
- Staggered view entrance animation via `animateView()`.
- IntersectionObserver-based scroll reveal.
- Performance Mode decoupled from OS reduced-motion.

---

### Phase A — Karaoke Smoothness (P0, IN PROGRESS)
**Problem**
- Current `updateKaraoke()` toggles `.kar-ch.on` discretely.
- It is driven by `audio.timeupdate` (low frequency) → **choppy highlighting**.

**Goal**
- Smooth, continuous karaoke fill that is readable and tracks audio precisely.

**Work to implement**
- Replace discrete per-character toggling with **continuous fill**:
  - Render the current line as a **two-layer text** or **single-layer gradient** driven by CSS var `--cp` (0..1).
  - Use `background-clip:text` (and `-webkit-background-clip:text`) so accent fill sweeps smoothly.
- Drive karaoke progress via a **requestAnimationFrame loop** while karaoke is active:
  - Start rAF when karaoke toggles on / NP opens in karaoke.
  - Stop rAF when karaoke toggles off / NP closes / view changes.
- Only rebuild karaoke DOM when line index changes; otherwise just update `--cp`.
- Respect **Performance Mode**:
  - If `state.perfMode`, snap fill to coarse steps (or fall back to discrete) to reduce load.

**Testing required**
- Verify smooth fill on mobile and desktop.
- Verify track changes refresh karaoke state.

---

### Phase B — Like/Dislike Animations + Dislike Button (P0/P1)
**User stories**
1. As a user, liking a song shows **one large accent heart** floating up like a balloon.
2. As a user, disliking shows a **broken-heart** accent animation.
3. As a user, dislike persists and disliked songs are excluded from shuffle/autoplay.

**Work to implement**
- Replace current multi-particle `heartBurst()` with a new FX system:
  - **LIKE**: one big heart (accent color) rises, gently sways, scales slightly, fades.
  - **DISLIKE**: broken-heart animation (accent color) with “crack/split” effect.
  - Never use red; always use `var(--treesh-purple)` / current accent.
  - Add new CSS keyframes and keep them disabled in `html.perf-mode`.
- Add **dislike button** in Now Playing controls near Like:
  - `data-testid="now-playing-dislike-button"`.
  - `toggleDislike(songId)` persists to `treesh_dislikes` (state already contains `dislikes: new Set(...)`).
  - Ensure **liking clears dislike** and **disliking clears like** (mutual exclusion).
- Exclude disliked songs from:
  - Shuffle order building and any “autoplay / advance” logic.
  - Song pools used by Games where applicable (configurable if needed).

**Testing required**
- Like/dislike animations in Library cards, Search results, Now Playing.
- Persistence across reload.
- Shuffle + next/advance never selects disliked songs.

---

### Phase C — Games Restructure + “This or That” (P0)
**User stories**
1. As a user, Games has a **Home** tab (first) with hero banners.
2. As a user, Lyric Game has its own dedicated tab.
3. As a user, I can play **This or That** in its own tab.
4. As a user, progress and win-count persist.

**Work to implement**
- Add `state.gameTab` with values: `home | lyrics | tot`.
- Update `viewGame()` to include a premium **top tab bar** and render based on `state.gameTab`.
  - Default = `home`.
- **Home tab**:
  - Two hero banners:
    - “What’s Next? (Lyric Game)” → opens Lyrics tab / start flow.
    - “This or That” → opens TOT tab / start flow.
- **Lyrics tab**:
  - Move the existing Lyric Game hub (difficulty, stats, track picker) into this tab.
- **This or That tab**:
  - Intro, genre filter (from `GENRES`), Start.
  - Show leaderboard/win-count summary loaded from `treesh_tot`.
- Implement **This or That** fullscreen game overlay:
  - Two random songs head-to-head.
  - Each has a **30s preview** using a dedicated preview `Audio` element (do not interrupt main player unless user chooses).
  - User selects a winner; loser receives a strike.
  - After **3 strikes**, song is eliminated; new challenger appears.
  - Last remaining song → champion screen (play full song / restart).
  - Persist to localStorage `treesh_tot`:
    - win counts per song + last run state as needed.
  - Use the existing `.gauss` animated background tokens; reduced-motion safe.

**Testing required**
- Tab switching, state persistence, hero banner launches.
- TOT end-to-end: preview audio, strike/elimination, champion screen, win-count saved.

---

### Phase D — Instrum Studio Redesign (P1)
**User stories**
1. As a user, Instrum looks like a real studio app (BandLab/Ableton-esque) and is not cluttered.
2. As a user, the workflow is obvious: transport → channels → step grid → save/export.

**Non-negotiables**
- Keep the **entire existing Web Audio engine** intact (`iTrigger/iSchedule/iPlay/etc.`) and keep **data-act hooks** working.
- Single file only; Tailwind CDN utilities; limited custom CSS in the existing `<style>` block.

**Work to implement (UI only)**
- Rewrite only these HTML generator functions (no engine rewrite):
  - `instrumLanding`, `instrumTransportHtml`, `instrumLaneHtml`, `instrumGridHtml`, `instrumBeatsHtml`, `viewInstrum`.
- New layout (mobile-first, scalable to desktop):
  - **Transport bar**: big circular Play/Stop, “LCD” BPM (Doto), bars selector, step/position readout, metronome toggle, swing, master with small meter, clear/random/save/WAV.
  - **Channel rack**: DAW-style channel strips (color dot + icon, name, note select for melodic, M/S buttons, compact fader).
  - **Step grid**: 4/4 group shading, step ruler, moving playhead, clear “active step” styling using accent.
- Visual polish:
  - Dark charcoal panels, subtle strokes, glass blur, accent for active states.
  - Respect theme (dark/light) and custom accent.
  - Performance Mode disables expensive transitions.
- Add metronome support:
  - `p.metronome` flag in project.
  - Scheduler injects click sound (simple oscillator/noise) on quarter notes.

**Testing required**
- Play/stop, step toggling, save/load, export WAV.
- Ensure no event wiring regressions.

---

### Phase E — Testing (MANDATORY)
**Method**
- Use `testing_agent` with explicit **mobile viewport 390x844**.

**Test checklist**
1. Karaoke smoothness (60fps fill, line swaps, track change, perf-mode behavior).
2. Like/Dislike:
   - Big heart balloon + broken-heart animation.
   - Accent color only.
   - Persistence + shuffle exclusion.
3. Games:
   - Game tabs: Home/Lyrics/This-or-That.
   - This or That full run + persistence.
4. Instrum:
   - New studio UI renders cleanly.
   - Play/stop, step toggles, M/S/volume, bars, swing, save/load/export.
5. Regression:
   - Mini-bar vs bottom nav overlap (recurring mobile bug).
   - Overlay scroll locking still correct.

---

## 3) Next Actions
1. Implement **Phase A** karaoke rAF-driven continuous fill + validate on mobile.
2. Implement **Phase B**: dislike button + mutual exclusion + new like/dislike animations + shuffle/autoplay exclusion.
3. Implement **Phase C**: game tab restructure + This or That mode + persistence.
4. Implement **Phase D**: Instrum studio UI redesign (keep engine, replace HTML + CSS only).
5. Run **Phase E testing** (testing_agent mobile-first) and fix any regressions.

---

## 4) Success Criteria
- Karaoke highlighting is smooth, readable, and synced (no choppiness).
- Like = single floating accent heart balloon; Dislike = broken-heart animation; both disabled in perf-mode.
- Dislike button exists in Now Playing (with `data-testid`) and disliked songs are excluded from shuffle/autoplay.
- Games screen contains **Home / Lyrics / This or That** tabs; Home has two hero banners; This or That fully playable with 3-strike elimination and persistence.
- Instrum looks like a pro studio while all existing engine features (save/export/play) still work.
- Mobile viewport has no minibar/nav overlap regressions; overlays remain scroll-locked correctly.
