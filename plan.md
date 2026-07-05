# Treesh 3.0 — Single-File Static Rebuild Plan (Live Catalog)

## 1) Objectives
- Deliver **one self-contained `index.html`** (Vanilla JS + Tailwind CDN + Lucide) suitable for **static hosting**.
- **Abandon React/FastAPI** entirely; all user data persists via **`localStorage`**.
- Load the **live catalog at runtime** from same-origin HTML endpoints:
  - `/content/songs`, `/content/icons`, `/content/lyrics`
- Parse remote HTML via `DOMParser`, **normalize into the app’s model**, cache results locally, then boot the UI.
- Keep Treesh theme (near-black + **purple #9328ff** + **gold #c3ab69**) and make it feel **premium + lively** with **seamless animations/transitions**.
- **Deployment constraint:** because `treesh.app` content endpoints do **not** send CORS headers, the app must be hosted **same-origin** as `/content/*` (i.e., on `treesh.app`). The loader still tries `content/*` → `/content/*` → `https://treesh.app/content/*` for robustness.

**Current status:** ✅ All objectives achieved. Final file: `/app/single_html/index.html` (~101KB).

---

## 2) Implementation Steps

### Phase 1 — Core Data Integration POC (Isolation) ✅ *Done*
**Core risk:** runtime parsing + normalization of HTML catalog pages + same-origin fetch behavior.

**User stories (POC) — Completed**
1. As a user, I can open the app and it loads songs/artists/lyrics from `/content/*` without manual setup.
2. As a user, I can hit Play on any song and audio starts reliably.
3. As a user, lyrics (when available) appear and highlight correctly as the song plays.
4. As a user, the catalog loads fast on repeat visits due to local caching.
5. As a user, if `/content/*` fails, I see a clear error and a retry button.

**Implementation — Completed**
- Implemented **bootstrap catalog loader** before UI init:
  - Fetch-first strategy with timeout, tries in order: `content/*` → `/content/*` → `https://treesh.app/content/*`.
  - Parse HTML with `DOMParser`.
  - Normalization:
    - **Songs:** stable slug `id` generation; map `data-explicit`, `data-exclusive` booleans; extract audioUrl/coverArt/metadata.
    - **Artists:** map `data-artist-id -> id`; extract `name`, `bio`, `role`, `cashapp`, backgrounds/images.
    - **Lyrics:** parse `<p data-minutes="MM:SS.ss">` to seconds; attach to songs via robust matching.
  - Cache normalized catalog in `localStorage` (`treesh_catalog_v1`) with timestamp.
  - **Stale-while-revalidate:** boot instantly from cache, then refresh catalog in background.
- Added branded **boot loading** skeleton screen and **error + retry** UI.

**Measured results**
- Catalog loads: **55 songs**, **12 artists**, **37 songs with synced lyrics**.

**Exit criteria — Met**
- Songs/artists render from live `/content/*`.
- Playback works for multiple tracks.
- Lyrics parse to seconds and highlight works.
- Refresh uses cached data if remote is slow/unavailable.

---

### Phase 2 — V1 App Development (Wire the Template to Live DATA) ✅ *Done*
**Goal:** replace placeholder data with runtime loader output and ensure all features work end-to-end.

**User stories (V1) — Completed**
1. Browse library, filter by genre, and search quickly.
2. Open an artist and play/shuffle their discography.
3. Like/unlike songs and see them in Favorites (persisted locally).
4. Create playlists and add/remove songs (persisted locally).
5. Use Now Playing (vinyl + ambient gradient + lyrics) and manage queue.

**Implementation — Completed**
- Refactored boot flow to use live catalog load + cache fallback.
- Built normalized indices: `SONG_BY_ID`, `ARTIST_BY_ID`, computed genres.
- Added/verified **`data-testid`** attributes for key flows (nav, search, play controls, NP controls, etc.).
- **Critical bug fix:**
  - Removed `onclick="event.stopPropagation()"` in modal content wrapper (it blocked all modal buttons due to event delegation).
  - Replaced with `data-act="modal-stop"` sentinel; updated click handler.
- Fixed onboarding UX bug: nickname step “Next” button now enables/disables live while typing.

**Phase 2 testing (mandatory) — Completed**
- Served locally (`python3 -m http.server 3000`) and validated:
  - Load → library → play → NP open/close → seek → next/prev → lyrics → queue reorder/remove → favorites → playlists → artists → settings.

---

### Phase 3 — Full Polish + Hardening ✅ *Done*
**User stories (Polish) — Completed**
1. Never lose place due to unnecessary re-renders while playing.
2. Playback UI never clips on short viewports.
3. App feels premium: smooth hover/press states, consistent spacing.
4. Voice commands work where supported and fail gracefully where not.
5. Offline/failed fetch still allows last cached catalog.

**Implementation — Completed**
- **Motion system (seamless + “flows well”):**
  - Now Playing: **slide-up enter**, **slide-down exit**, **content cross-fade** on lyrics/vinyl swap.
  - Modals: **backdrop fade + panel spring** enter, **animated exit**.
  - Onboarding: **step slide** animation between steps.
  - Queue drawer: **slide-in/out** (no re-slide on reorder).
  - Mini-player: animated entrance.
  - Toasts: slide/scale in/out.
  - Page navigation: `view-in` transition on route change.
  - Micro-interactions: `card-lift` hover + `press` active states.
  - Respects `prefers-reduced-motion`.
- **Performance hardening:**
  - Removed unnecessary view re-render on play/pause; minimal DOM/icon patching.
- **Network hardening:**
  - Cache-first boot + retry UI.
  - Manual refresh action available (settings).

**Phase 3 testing (mandatory) — Completed**
- E2E test pass completed (testing agent): **34/34 passed**.
- Verified:
  - Real audio streaming (jukehost) currentTime advancing
  - Synced lyrics (e.g., “Shake It Some Mo” **60 lines**) with highlight advancing
  - Queue reorder/remove, playlists create/rename/delete, favorites
  - Artist detail play/shuffle, settings accent changes
  - Keyboard shortcuts (Space, Escape)
  - Animated exit cleanups fully remove DOM and keep app interactive

---

## 3) Next Actions
1. ✅ Confirm final file location: `/app/single_html/index.html`.
2. ✅ Provide live preview link and any copy/paste guidance for GitHub/Netlify deployment.
3. (Optional) If deploying on GitHub Pages under a different domain, either:
   - Host `/content/*` pages on the **same domain** (recommended), or
   - Add CORS headers on the content host (not currently present on treesh.app).

---

## 4) Success Criteria
- ✅ **Single file** deploy: `index.html` only (CDN deps allowed).
- ✅ Live catalog loads from `/content/*` and normalizes correctly.
- ✅ Playback is reliable: play/pause/seek/next/prev/shuffle/repeat/volume.
- ✅ Lyrics sync highlights correctly for tracks that have lyrics.
- ✅ Favorites/playlists/profile/theme persist via `localStorage`.
- ✅ Clean loading/error states; cached catalog enables use during network issues.
- ✅ UI matches Treesh brand and feels lively with seamless transitions.
- ✅ Testing: E2E pass completed with **0 critical issues**.
