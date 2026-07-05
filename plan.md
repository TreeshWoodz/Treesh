# Treesh 3.0 — Single-File Static Rebuild Plan (Live Catalog)

## 1) Objectives
- Deliver **one self-contained `index.html`** (Vanilla JS + Tailwind CDN + Lucide) that can be deployed on **treesh.app (Netlify) / GitHub Pages**.
- **Abandon React/FastAPI** entirely; all user data persists via **`localStorage`**.
- Load the **live catalog at runtime** from same-origin HTML endpoints:
  - `/content/songs`, `/content/icons`, `/content/lyrics`
- Parse remote HTML via `DOMParser`, **normalize into the app’s DATA model**, cache results locally, then boot the UI.
- Keep Treesh theme (near-black + **purple #9328ff** + **gold #c3ab69**) and make it feel **more lively** via polish/motion.

---

## 2) Implementation Steps

### Phase 1 — Core Data Integration POC (Isolation) ✅ *Do not proceed until stable*
**Core risk:** runtime parsing + normalization of HTML catalog pages + same-origin fetch behavior.

**User stories (POC)**
1. As a user, I can open the app and it loads songs/artists/lyrics from `/content/*` without manual setup.
2. As a user, I can hit Play on any song and audio starts reliably.
3. As a user, lyrics (when available) appear and highlight correctly as the song plays.
4. As a user, the catalog loads fast on repeat visits due to local caching.
5. As a user, if `/content/*` fails, I see a clear error and a retry button.

**Implementation**
- Add a **bootstrap loader** before app init:
  - Fetch (in order) `content/songs`, `/content/songs` (same for icons/lyrics), with timeout + retry.
  - Parse HTML with `DOMParser`.
  - Build normalized objects:
    - **Song**: generate stable `id` from `(artistId|artist)+(track)` slug; map booleans: `data-explicit`, `data-exclusive`.
    - **Artist**: map `data-artist-id -> id`, pull images/background/role/cashapp.
    - **Lyrics**: parse `<p data-minutes="MM:SS.ss">` into seconds; match to songs primarily by `track` (fallback `track+artist`).
  - Cache in `localStorage` with `seedVersion`/hash + timestamp; stale-while-revalidate optional.
- Minimal POC UI: loading screen → list of songs → play → open NP lyrics to validate sync.
- Create a small **local python script** to sanity-check parsing output counts (57/12/36) using downloaded HTML snapshots.

**Exit criteria**
- Songs/artists render from live `/content/*`.
- Playback works for multiple tracks.
- Lyrics parse to seconds and highlight works.
- Refresh uses cached data if remote is slow/unavailable.

---

### Phase 2 — V1 App Development (Wire the Template to Live DATA)
**Goal:** replace `__TREESH_DATA__` with the runtime loader output and ensure all existing features work end-to-end.

**User stories (V1)**
1. As a user, I can browse library, filter by genre, and search quickly.
2. As a user, I can open an artist and play/shuffle their discography.
3. As a user, I can like/unlike songs and see them in Favorites (persisted locally).
4. As a user, I can create playlists and add/remove songs (persisted locally).
5. As a user, I can use Now Playing (vinyl + ambient gradient + lyrics) and manage my queue.

**Implementation**
- Refactor template init flow:
  - `init()` becomes async: show skeleton/loading → `loadCatalog()` → set `DATA` → continue boot.
  - Add explicit **loading + error views** in the shell.
- Normalization layer:
  - Ensure required fields exist for rendering (fallback images, empty strings).
  - Build `SONG_BY_ID`, `ARTIST_BY_ID`, genres list.
- Add/verify `data-testid` attributes for key flows (nav, search, play, now playing, lyrics, queue, playlists).
- Polish pass (keep theme): micro-interactions, skeletons, subtle motion improvements (no gradient abuse).

**Phase 2 testing (mandatory)**
- Serve locally (`python3 -m http.server 3000`) and run a full E2E pass:
  - Load → library → play → NP open/close → seek → next/prev → lyrics → queue reorder/remove → favorites → playlists → artists.

---

### Phase 3 — Full Polish + Hardening
**User stories (Polish)**
1. As a user, I never lose my place due to unexpected re-renders while playing.
2. As a user, playback UI never clips on short viewports.
3. As a user, the app feels premium (smooth hover/press states, consistent spacing).
4. As a user, voice commands work where supported and fail gracefully where not.
5. As a user, offline/failed fetch still lets me use last cached catalog.

**Implementation**
- Performance: avoid unnecessary full `renderView()` on every `play/pause`; only patch the minimal nodes.
- Network hardening:
  - Cache TTL, manual “Refresh catalog” button in Settings.
  - If fetch fails: use cached catalog; if none, show retry UI.
- Responsive hardening: verify 100dvh, safe-area insets, prevent NP clipping.

**Phase 3 testing (mandatory)**
- Repeat E2E tests + responsive checks (mobile widths + short heights).

---

## 3) Next Actions
1. Implement `loadCatalog()` (fetch + parse + normalize + cache) and remove `__TREESH_DATA__` placeholder.
2. Add loading/error UI states and ensure app boots with live data.
3. Run local server + complete E2E playback/lyrics/queue tests.
4. Save final output as `/app/single_html/index.html` and provide preview path/link.

---

## 4) Success Criteria
- **Single file** deploy: `index.html` only (CDN deps allowed).
- Live catalog loads from `/content/*` and normalizes correctly.
- Playback is reliable: play/pause/seek/next/prev/shuffle/repeat/volume.
- Lyrics sync highlights correctly for tracks that have lyrics.
- Favorites/playlists/profile/theme persist via `localStorage`.
- Clean loading/error states; cached catalog enables use during network issues.
- UI matches Treesh brand and feels lively without readability regressions.
