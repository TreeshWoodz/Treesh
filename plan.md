# Treesh (FARM) Rebuild Plan

## 1) Objectives
- Rebuild Treesh 3.0 as a real **React + FastAPI + MongoDB** app, preserving the Treesh look/feel while making it **more lively, faster, and cleaner**.
- Use the **real Treesh catalog** (already extracted to `/app/backend/seed_data.json`) with working playback of `audio.jukehost.co.uk` streams.
- Ship V1 with: **Player + Now Playing**, **Library w/ genres + search**, **Artists/Icons pages**, **Favorites + Playlists**, **Local profile onboarding**, **Themes/customization**, **Voice control**.
- Remove: **Games** and **Videos** sections.

---

## 2) Implementation Steps

### Phase 1 — Core Playback + Catalog POC (isolation; do not proceed until solid)
**Goal:** prove the hardest workflow (streaming audio + queue state machine) is robust before building the full UI.

**User stories (POC)**
1. As a user, I can press play and hear a track start quickly.
2. As a user, I can pause/resume without losing my position.
3. As a user, I can seek using a scrubber and playback resumes from that point.
4. As a user, I can go next/previous and the correct track loads.
5. As a user, shuffle/repeat behave predictably.

**Steps**
1. Web research: best practices for HTML5 audio in React (preload, `canplay`, `timeupdate`, `stalled`, range requests, mobile autoplay constraints) + Media Session patterns.
2. Create a small React route `/poc/player`:
   - Load songs from backend `/api/catalog/songs`.
   - Implement an `AudioEngine` hook/context:
     - single `<audio>` element via `useRef`
     - state: `currentTrack`, `isPlaying`, `duration`, `currentTime`, `buffered`, `volume`, `repeatMode`, `shuffle`
     - events: `loadedmetadata`, `timeupdate`, `ended`, `error`, `waiting`, `canplay`
     - actions: play/pause/toggle, seek, next/prev, setQueue, setVolume.
   - Implement minimal UI: track title/artist, play/pause, next/prev, scrubber, volume.
3. Add Media Session API wiring (title/artist/artwork + handlers for next/prev/play/pause/seek).
4. Verify with real catalog: at least 5 tracks across the list, multiple seeks, track transitions.
5. Fix until stable: handle edge cases (duration = NaN, network stalls, rapid skipping, ended event).

**Exit criteria**
- No console errors; playback works end-to-end across multiple tracks; seeking works; next/prev deterministic; Media Session controls work.

---

### Phase 2 — V1 App Development (ship the real Treesh experience)
**User stories (V1)**
1. As a user, I can browse all songs and filter by genre and search by title/artist.
2. As a user, I can open Now Playing and see a lively record-player UI + track metadata.
3. As a user, I can like/unlike tracks and view my Favorites list.
4. As a user, I can create a playlist and add/remove songs.
5. As a user, I can open an Artist/Icon page to see their bio and their discography (songs).
6. As a user, I can set a nickname, birthday (auto zodiac), and profile picture locally.
7. As a user, I can customize theme accent/backdrop and the app remembers it.
8. As a user, I can use voice commands (play/pause/next/previous/search).

**Backend (FastAPI + MongoDB)**
1. Define Mongo collections:
   - `songs` (seeded from `seed_data.json`)
   - `artists` (seeded)
   - `profiles` (keyed by `profileId` from localStorage)
   - `favorites` (profileId, songId)
   - `playlists` (profileId, name, songIds, createdAt)
2. Add endpoints:
   - `GET /api/catalog/songs?genre=&q=`
   - `GET /api/catalog/artists`
   - `GET /api/catalog/artists/{artistId}` (includes their songs)
   - `POST/GET /api/profile` (create/update/get by profileId)
   - `POST/GET/DELETE /api/favorites`
   - `POST/GET/PATCH/DELETE /api/playlists`
3. Add seed script (run on startup if collections empty) using `/app/backend/seed_data.json`.
4. Ensure CORS config remains permissive for local dev and GitHub hosting.

**Frontend (React)**
1. App shell + navigation:
   - Home/Library, Artists, Favorites, Playlists, Settings (profile + theme + voice)
   - Remove Games/Videos routes and UI.
2. Global state:
   - `AudioProvider` (queue + playback)
   - `ProfileProvider` (local profileId + onboarding)
   - `ThemeProvider` (accent/backdrop persisted in localStorage)
3. Pages/components:
   - Library: song grid/list, genre chips, search input, sort (optional)
   - Now Playing: vinyl animation + cover art + lyrics panel (placeholder until lyrics source exists)
   - Artists: grid of icons, artist detail modal/page with discography
   - Favorites + Playlists: CRUD UI
   - Onboarding modal: nickname, birthday->zodiac, pfp upload/choose (local file -> data URL)
4. UI/UX upgrades (free only):
   - Tailwind + shadcn components for clean structure
   - framer-motion micro-interactions (hover, page transitions)
   - starfield background as lightweight canvas/CSS
   - better loading/empty/error states everywhere
5. Performance cleanup:
   - code split routes
   - memoize lists, virtualize song list if needed
   - avoid heavy DOM/GSAP; prefer framer-motion + CSS

**Phase 2 testing (mandatory)**
- Run end-to-end test pass:
  - library load, filter/search
  - play from library, open now playing, seek, next/prev
  - like/unlike, favorites persistence
  - playlist create/add/remove
  - artist page discography
  - profile onboarding + theme persistence

---

### Phase 3 — Polish, Bug Fixes, “Make it Lively”, and Hardening
**User stories (Polish)**
1. As a user, the app feels smooth and responsive even on mobile.
2. As a user, rapid skipping doesn’t break playback.
3. As a user, I can recover gracefully from network/audio errors.
4. As a user, voice commands give visible feedback and are easy to use.
5. As a user, theme changes feel instant and premium.

**Steps**
1. Replace remaining legacy/pointless code; reduce CSS bloat; ensure consistent design tokens.
2. Add robust audio error handling + retry + “tap to resume” for mobile autoplay restrictions.
3. Improve Now Playing: animated equalizer, background blur from cover art (CSS), smoother vinyl spin.
4. Voice control: command grammar + fallback + permission UX.
5. Accessibility: keyboard controls, aria labels, focus management for modals.

**Phase 3 testing (mandatory)**
- Regression tests of all V1 flows + mobile viewport check + audio error simulation.

---

## 3) Next Actions (immediate)
1. Implement backend seed + `/api/catalog/*` endpoints using `seed_data.json`.
2. Build Phase-1 POC route `/poc/player` with `AudioProvider` and prove playback/seek/next/prev.
3. Once POC exit criteria met, build V1 pages (Library, Artists, Favorites, Playlists, Settings) reusing the proven `AudioProvider`.
4. Run end-to-end testing after Phase 2 and Phase 3.

---

## 4) Success Criteria
- Playback is reliable (play/pause/seek/next/prev/shuffle/repeat/volume) with real Treesh streams.
- Library search + genre filters work and feel fast.
- Artists/Icons pages show correct artist info + their songs.
- Favorites + playlists persist per local profileId (no login).
- Profile onboarding + theme customization are polished and persistent.
- Voice control works in supported browsers.
- No Games/Videos UI remains.
- Codebase is modular, minimal, and noticeably faster/cleaner than the original single-file app.
