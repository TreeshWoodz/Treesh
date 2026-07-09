# Treesh 3.0 — Single-File UI Fixes + Search + Lyrics + Games Plan (UPDATED)

## 1) Objectives
- Deliver the remaining fixes/features in **`/app/single_html/index.html` only** (Vanilla JS + Tailwind CDN + localStorage).
- Preserve the premium Treesh design language (dark + glass + accent) while adding:
  - **Metadata modal** (credits/details)
  - **Full-screen search overlay** opened via a **top-bar icon button** with bottom-docked input
  - **Premium Settings** overhaul with theme/background/text/sleep controls
  - **Karaoke mode** + **local lyric editing/reporting**
  - **Sleep timer** (inactivity-triggered ambient overlay)
  - **Motion system**: staggered page entrances + scroll reveal
- Prioritize **mobile playback UX correctness** and **overlay scroll locking**.
- Complete remaining gameplay/features: **Dislikes**, Lyric Game polish, and **This or That** game.

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
  - Implemented metadata modal from `SONG_BY_ID` (creationDate, artist, featured artists, writtenBy, producer, mixer, videographer, album, label, genre, mood, explicit) and **Copy credits**.
- **Lyrics not updating**
  - Fixed `onSongChange()` to **always re-render** Now Playing when open.
- **Queue selectable**
  - Added `q-jump` UI + handler to jump to queue index.
- **Mobile scroll lock**
  - Implemented `syncScrollLock()` (body fixed-position lock) and wired into all overlays.
- **Mini-bar offset**
  - Mini player uses safe-area-aware `bottom-[calc(58px+env(safe-area-inset-bottom))]`.
- **iOS input zoom**
  - Inputs forced to `>=16px` on small screens.

**Phase 1 testing completed**
- DOM checks: metadata modal open, queue jump, lyric refresh.
- Functional checks: scroll lock now prevents background scroll.

---

### Phase 2 — Global Full-Screen Search Overlay (DONE)
**User stories**
1. As a user, I can tap a **Search icon button** and get a full-screen search overlay.
2. As a mobile user, the search input is at the **bottom** and stays reachable while typing.
3. As a user, I can toggle results between **Songs / Artists / Lyrics**.
4. As a user, I can quickly replay recent searches from **history chips**.
5. As a user, search results let me play a song, open an artist, or jump to a lyric match.

**Work completed**
- Replaced header inline search input with a **compact icon button** matching other top-bar buttons.
- Added overlay renderer `renderSearchOverlay()`:
  - Results scroller above + **bottom dock** with segmented toggle + input.
  - `visualViewport` keyboard offset support.
  - localStorage `treesh_recent_searches` (max 8).
- Wired actions:
  - Songs: play from results (contextList = results)
  - Artists: navigate to artist
  - Lyrics: play song, open NP lyrics, seek to match time

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
- **Full Settings overhaul (v2)**
  - Converted Settings into a **hero banner + tabbed panels**:
    - Tabs: Accent / Display / Sleep / Voice / Account / About
  - **Accent**: expanded preset swatches + custom color input + hex apply.
  - **Display**:
    - Dark mode (#121212) + Light mode (#fefefe)
    - Background modes: Space theme, Solid, Accent, multiple gradients, Custom Image
    - Custom image background: upload/replace/remove + **Dim overlay** toggle.
    - Text size: Small/Medium/Large scaling.
  - **About**:
    - Privacy Policy + Terms of Use link to `https://treesh.app` (until dedicated pages exist)
    - Copyright block
- Added a **desktop sidebar profile card** for faster access.
- Voice overlay redesigned (safe-area centered modal panel).
- Artist bio moved inside the artist header hero.

**Phase 3 testing completed**
- Screenshot verification: Settings v2 appearance/display tabs and light mode rendering.
- Voice overlay screenshot verification.

---

### Phase 4 — Lyrics Upgrades: Karaoke Mode + Report/Edit + Sleep Timer (PARTIALLY VERIFIED)
**User stories**
1. As a user, I can switch to **Karaoke mode** and follow one centered line at a time.
2. As a user, I see a smooth accent fill animation synced to lyric timing.
3. As a user, I can edit incorrect lyrics inline and keep my edits on this device.
4. As a user, I can report lyrics via email with the full corrected text included.
5. As a user, I can enable a **Sleep Timer** that triggers only after inactivity, showing a beautiful ambient overlay.

**Work completed**
- Karaoke mode:
  - Toggle added in Now Playing lyrics tools.
  - Center-stage karaoke renderer + per-character accent fill animation.
  - Hooked into `timeupdate` via `updateKaraoke()`.
- Lyrics edit/report:
  - Inline lyric editor with save to localStorage (`treesh_lyric_edits`).
  - Edits are applied to catalog at index time.
  - Report button builds `mailto:` to `REPORT_EMAIL` including the full edited lyrics body.
- Sleep timer:
  - Added settings controls (5/10/15/30/45/60/off).
  - Timer starts on **inactivity**, not while user is interacting.
  - Full-screen overlay shows:
    - Time of day + today’s date (top)
    - Now playing track card + pause/play button (bottom)
    - Pause exits overlay and restarts timer.
  - Overlay participates in `syncScrollLock()`.

**Phase 4 testing (still required / incomplete)**
- Manual / automated checks to run:
  - Karaoke: line swaps correctly over time; switching tracks refreshes karaoke.
  - Lyric edits: persist across refresh; report link contains edited lyrics.
  - Sleep: inactivity triggers overlay; pause exits; timer resets.

---

### Phase 5 — Motion System (DONE; continue polish as needed)
**User stories**
1. As a user, homepage content animates in after load.
2. As a user, page/section transitions feel seamless and premium.
3. As a user, song cards animate in as I scroll.

**Work completed**
- Added:
  - Staggered view entrance animation via `animateView()`.
  - IntersectionObserver-based scroll reveal for dense grids.
- Existing Now Playing open/close and modal animations retained; can be further refined after Phase 6.

---

### Phase 6 — Remaining Items: Dislikes + Games + Game Transitions (PENDING)
**User stories**
1. As a user, I can dislike a song and it won’t appear in shuffle/up-next auto flow.
2. As a user, Lyric Game opens/closes with smooth transitions and a subtle animated gaussian background.
3. As a user, I can play **This or That** and progress is saved.
4. As a user, I can filter This-or-That by genre and choose audio-preview or lyrics-verse mode.

**Work (to implement next)**
- **Dislikes**
  - Add thumbs-down/dislike button (Now Playing + song rows/menu).
  - Persist `treesh_dislikes`.
  - Exclude dislikes from shuffle order and any autoplay/advance logic.
  - Add management UI (likely Settings → Account or Profile module).
- **Lyric Game polish**
  - Add opening/closing transitions.
  - Add subtle animated gaussian gradient background.
- **New Game: This or That**
  - Add tile in Games hub.
  - King-of-the-hill tournament:
    - Two songs presented; user chooses one to like and one to dislike (game-only).
    - 30s preview playback per side.
    - A song eliminated after 3 dislikes.
    - Save progress to localStorage (`treesh_tot`).
    - Champion screen: play full song or restart.
  - Genre filter (uses `GENRES`).
  - Lyrics variant:
    - 4 random lines per song displayed; user chooses better verse.
  - Background: gaussian animated gradient layer.

**Phase 6 testing (mandatory)**
- Run testing_agent for:
  - Dislike persistence + shuffle exclusion.
  - Lyric Game transitions.
  - This-or-That end-to-end tournament + persistence + genre filter + lyrics mode.

---

## 3) Next Actions
1. **Verify Phase 4** with targeted testing:
   - karaoke timing updates + track-switch refresh
   - lyric edit persistence + mailto report
   - sleep timer inactivity trigger + overlay interactions
2. Implement **Phase 6** (Dislikes + Lyric Game transitions + This-or-That) in small, testable increments.
3. Run **testing_agent** comprehensive pass after Phase 6.
4. Final UI polish pass for motion consistency (NP open/close, modals, lyrics transitions) and fix any regressions.

---

## 4) Success Criteria
- Metadata modal reliably opens and shows all available credits/fields.
- Lyrics always switch correctly on track changes (next/prev/jump) and karaoke stays in sync.
- Queue items are tappable to jump; no background scroll under overlays on mobile.
- Search is a **top-bar icon button** that opens a full-screen overlay with bottom input, toggles, and recents.
- Settings is a **hero + tabbed** premium system with:
  - accent presets + custom color
  - dark/light mode
  - multiple backgrounds including space theme + accent + gradients + custom image with overlay toggle
  - text sizing
  - privacy/terms/about
- Voice overlay is centered and not clipped.
- Sleep timer triggers only after inactivity and shows a beautiful ambient overlay.
- Dislikes persist and are excluded from shuffle/autoplay.
- Games: Lyric Game transitions improved; This-or-That works, is animated, filterable, and saves progress.
