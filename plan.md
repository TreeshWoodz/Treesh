# Treesh (FARM) Rebuild Plan — Updated (V1 Complete)

## 1) Objectives
- Rebuild Treesh 3.0 as a real **React + FastAPI + MongoDB** app, preserving the Treesh look/feel while making it **more lively, faster, and cleaner**. ✅ **Completed**
- Use the **real Treesh catalog** (seeded from `/app/backend/seed_data.json`) with working playback of `audio.jukehost.co.uk` streams. ✅ **Completed**
- Ship V1 with: **Player + Now Playing**, **Library w/ genres + search**, **Artists/Icons pages**, **Favorites + Playlists**, **Local profile onboarding**, **Themes/customization**, **Voice control**. ✅ **Completed**
- Remove: **Games** and **Videos** sections. ✅ **Completed**

**New objective (post-V1):**
- Collect feedback, iterate on UX polish, and optionally add future features (lyrics sourcing, queue management UI, offline-friendly caching, social sharing) without introducing paid services.

---

## 2) Implementation Steps

### Phase 1 — Core Playback + Catalog POC (isolation; do not proceed until solid)
**Goal:** prove the hardest workflow (streaming audio + queue state machine) is robust before building the full UI.

**Status:** ✅ Completed (audio streams verified + playback verified live in browser)

**User stories (POC)**
1. As a user, I can press play and hear a track start quickly. ✅
2. As a user, I can pause/resume without losing my position. ✅
3. As a user, I can seek using a scrubber and playback resumes from that point. ✅
4. As a user, I can go next/previous and the correct track loads. ✅
5. As a user, shuffle/repeat behave predictably. ✅

**Implemented**
- Robust `AudioProvider` with a single `Audio()` element
- Playback events: `loadedmetadata`, `timeupdate`, `canplay`, `waiting`, `progress`, `ended`, `error`
- Actions: play/pause, seek, next/prev, shuffle, repeat (off/all/one), volume
- Media Session API integration
- Verified multiple real streams (HTTP 200, CORS enabled, range requests)

**Exit criteria**
- No console errors; playback works end-to-end across multiple tracks; seeking works; next/prev deterministic; Media Session controls work. ✅

---

### Phase 2 — V1 App Development (ship the real Treesh experience)
**Status:** ✅ Completed

**User stories (V1)**
1. As a user, I can browse all songs and filter by genre and search by title/artist. ✅
2. As a user, I can open Now Playing and see a lively record-player UI + track metadata. ✅
3. As a user, I can like/unlike tracks and view my Favorites list. ✅
4. As a user, I can create a playlist and add/remove songs. ✅
5. As a user, I can open an Artist/Icon page to see their bio and their discography (songs). ✅
6. As a user, I can set a nickname, birthday (auto zodiac), and profile picture locally. ✅
7. As a user, I can customize theme accent/backdrop and the app remembers it. ✅ (accent swatches implemented; persisted)
8. As a user, I can use voice commands (play/pause/next/previous/search). ✅ (Web Speech API)

**Backend (FastAPI + MongoDB)**
1. Define Mongo collections: ✅
   - `songs` (seeded: **57** songs)
   - `artists` (seeded: **12** artists)
   - `profiles` (keyed by `profileId` from localStorage)
   - `favorites` (profileId, songId)
   - `playlists` (profileId, name, songIds, createdAt)
2. Add endpoints: ✅
   - `GET /api/catalog/songs?genre=&q=&artistId=&treeshChoice=`
   - `GET /api/catalog/songs/{songId}`
   - `GET /api/catalog/genres`
   - `GET /api/catalog/artists`
   - `GET /api/catalog/artists/{artistId}` (includes their songs)
   - `POST /api/profile` and `GET /api/profile/{profileId}`
   - `POST /api/favorites/toggle` and `GET /api/favorites/{profileId}`
   - `POST/GET/PATCH/DELETE /api/playlists` (+ detail endpoint)
3. Add seed logic on startup if collections empty using `/app/backend/seed_data.json`. ✅
4. Ensure CORS config remains permissive for local dev and GitHub hosting. ✅

**Backend verification:** ✅ 19/19 API tests passed (testing_agent report).

**Frontend (React)**
1. App shell + navigation: ✅
   - Library, Icons, Favorites, Playlists, Settings
   - Desktop sidebar + mobile bottom nav
   - Removed Games/Videos routes and UI
2. Global state: ✅
   - `AudioProvider` (queue + playback)
   - `ProfileProvider` (local profileId + onboarding + theme accent)
   - `FavoritesProvider` + `PlaylistsProvider`
3. Pages/components delivered: ✅
   - Library: Treesh’s Picks + All Music, genre chips, global search
   - Player: MiniPlayer persistent bar + full Now Playing overlay
   - Now Playing: vinyl animation, seek/time, prev/next, shuffle/repeat, volume, like, About/Credits/Up Next
   - Artists: Icons grid + Artist detail page w/ discography + play/shuffle
   - Favorites: list + empty state
   - Playlists: create/rename/delete + playlist detail w/ remove-song
   - Profile onboarding: nickname, birthday→zodiac, avatar upload/presets
   - Settings: profile edit, accent swatches, voice commands, erase local data
   - Voice control: Web Speech API listening overlay + commands
4. UI/UX upgrades (free only): ✅
   - Tailwind + shadcn primitives
   - framer-motion micro-interactions + page transitions
   - starfield canvas background
   - improved loading/empty states
5. Performance cleanup: ✅
   - memoized heavy card components
   - single imperative canvas loop (starfield)
   - no GSAP/jQuery; modern React patterns

**Phase 2 testing (mandatory)**
- End-to-end flows verified:
  - library load, genre filter, search ✅
  - play from library, open now playing, seek, next/prev ✅
  - like/unlike, favorites persistence ✅
  - playlist create/add/remove ✅
  - artist discography ✅
  - profile onboarding + accent persistence ✅
  - mobile layout screenshots verified ✅

---

### Phase 3 — Polish, Bug Fixes, “Make it Lively”, and Hardening
**Status:** ✅ Completed (V1 polish baseline)

**Delivered polish items**
1. Smoothness/responsiveness: desktop + mobile verified ✅
2. Audio hardening: loading state, error state + retry ✅
3. Now Playing liveliness: vinyl spin, blurred cover backdrop, equalizer accents ✅
4. Voice UI: listening overlay with pulse animation ✅
5. Accessibility fixes: added missing `DialogTitle`/`DialogDescription` where required ✅
6. Keyboard shortcuts: space (play/pause), arrows (seek), shift+arrows (track skip) ✅

**Phase 3 testing (mandatory)**
- Regression pass done via testing agent report + manual browser validation ✅

---

## 3) Next Actions (immediate)
1. ✅ Monitor for user feedback (UX tweaks, additional Treesh-specific polish).
2. Optional: add **Lyrics source** integration (if/when you provide lyrics data source) and implement a real Lyrics tab.
3. Optional: enhance queue UI (reorder, remove from queue) while keeping performance strong.
4. Optional: add sharing/export (free) such as “Copy track link”, playlist share JSON, or image share (client-side).

---

## 4) Success Criteria
- Playback is reliable (play/pause/seek/next/prev/shuffle/repeat/volume) with real Treesh streams. ✅
- Library search + genre filters work and feel fast. ✅
- Artists/Icons pages show correct artist info + their songs. ✅
- Favorites + playlists persist per local profileId (no login). ✅
- Profile onboarding + theme customization are polished and persistent. ✅
- Voice control works in supported browsers. ✅
- No Games/Videos UI remains. ✅
- Codebase is modular, minimal, and noticeably faster/cleaner than the original single-file app. ✅
