# plan.md — Hoop (Treesh) Development Plan

## 1) Objectives
- Deliver a polished, mobile-first, single-page basketball fitness app at **https://treesh.app/hoop** with a restrained **black + pink** theme and custom hoop logo.
- Implement 7 core pages: **Courts, Drills, Plan, Dictionary, Position, Games, Favorites** + optional **Form Check** camera system.
- Ensure **Courts lookup works reliably** via free OpenStreetMap services (geocoding + nearby courts) with favorites + export/import save file.
- Provide rich offline-first content (drills/terms/games) backed by local data files and fast UI.

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): Courts lookup reliability
**Goal:** Prove the most failure-prone workflow (OSM geocode → nearby courts) works end-to-end before building the full UI.

**User stories**
1. As a user, I can enter an address and get coordinates so I can search courts without GPS.
2. As a user, I can allow location access and instantly search around me.
3. As a user, I can see a list of nearby courts with distance so I can pick the closest.
4. As a user, I can click a court and open directions in my maps app.
5. As a user, I can handle “no results / rate limited” states without the app breaking.

**Steps**
- Web research best practices/limits for **Nominatim** + **Overpass** (rate limits, user-agent, caching, bounding radius).
- Create a minimal **Python script** that:
  - Geocodes an address via Nominatim.
  - Queries nearby courts via Overpass (leisure=pitch + sport=basketball; also handle leisure=sports_centre).
  - Prints normalized results (name, lat/lon, address/tags) and verifies consistency.
- Implement minimal **FastAPI proxy** endpoints with caching:
  - `GET /api/geocode?q=` → Nominatim
  - `GET /api/courts?lat=&lon=&radius=` → Overpass
  - Add headers + timeouts + basic in-memory cache.
- Do not proceed until: multiple test addresses yield courts and errors are handled gracefully.

### Phase 2 — V1 App Development (Build around proven core)
**Goal:** Build the full app with all pages, data, navigation, and a first-pass Form Check.

**User stories**
1. As a user, I can navigate between all 7 pages quickly with a bottom nav.
2. As a user, I can save a court to Favorites and later see it in Favorites.
3. As a user, I can export my saved data to a JSON file and import it later.
4. As a user, I can browse drills by lane and skill level and play a video.
5. As a user, I can generate a workout session and run a fullscreen timer.

**Steps**
- Frontend scaffold: React + React Router with **basename `/hoop`**; root path redirects to `/hoop`.
- Global design system (restrained): black backgrounds, pink accent, typography scale, spacing tokens, reusable components.
- Create hoop logo (simple SVG) and app shell:
  - Sticky header with page title + context actions.
  - Bottom nav (Courts/Drills/Plan/Dictionary/More).
- Data layer (static JSON/TS files):
  - **Drills:** 72 items mapped to **14 lanes**, each with level, steps, cues, and YouTube URL.
  - **Dictionary:** 89 terms with simple SVG illustrations.
  - **Games:** 21 games with rules + quick setup.
- Pages:
  - **Courts:** search (GPS + address), results list + map link, save to favorites.
  - **Drills:** lane picker → drill list → drill detail (steps/cues/video).
  - **Plan:** session generator (filters by lane/level/duration) + workout timer (fullscreen, minimize, close).
  - **Dictionary:** searchable list + term detail with illustration.
  - **Position:** input height/wingspan/weight/standing reach (and optional speed/strength sliders) → position recommendation.
  - **Games:** game list + detail + simple in-app score tracker where applicable.
  - **Favorites:** saved courts list + import/export.
- Persistence:
  - localStorage for favorites + settings.
  - Export/import JSON file (versioned schema, validation, conflict handling).
- Initial **Form Check** page (optional route from “More”):
  - MediaPipe Pose in-browser; live overlay + simple cues (elbow under ball proxy, knee bend angle range, balance/lean proxy).
  - “Calibration” step + privacy note (no upload).
- One end-to-end testing pass (navigation, courts search, save/export/import, timer, drill playback, router under `/hoop`).

### Phase 3 — Polish + Expand (production-friendly)
**Goal:** Make it feel like a “hooper’s dream” with stronger UX, better content surfacing, and improved form-check feedback.

**User stories**
1. As a user, I can quickly resume my last drill or plan so I don’t lose momentum.
2. As a user, I can filter courts (distance, indoor/outdoor proxy tags) to find the right run.
3. As a user, I can favorite drills/games so I can build my personal library.
4. As a user, I get clearer form-check feedback per rep/shot attempt.
5. As a user, I can use the app smoothly offline for all non-court features.

**Steps**
- UX polish: loading skeletons, empty states, haptics (where available), better typography, micro-interactions.
- Courts: add radius slider, sorting, dedupe, better error messaging, stronger caching.
- Plan: templates (shooting day/conditioning/ball-handling), rest intervals, sound cues.
- Drills: add “coach mode” cue cards, progressive overload suggestions.
- Form Check: per-shot “report card”, thresholds tuning, optional on-screen metronome.
- Performance: code-splitting by route; memoized lists; image/SVG optimization.
- Second full end-to-end testing pass across mobile viewport sizes.

### Phase 4 — Release hardening
**User stories**
1. As a user, I can refresh/deeplink to any page under `/hoop` and it still loads.
2. As a user, I can import an older save file version without losing data.
3. As a user, I can use the app on iOS Safari and Android Chrome reliably.
4. As a user, I can use the timer and keep the screen awake during workouts.
5. As a user, I never see broken layouts or unreadable contrast.

**Steps**
- Routing verification for GitHub Pages / hosting config (deep links, basename).
- Cross-browser testing (camera permissions, autoplay rules for video, fullscreen timer behavior).
- Accessibility pass (contrast, focus states, reduced motion).
- Final regression testing and deploy to Treesh repo `main`.

## 3) Next Actions
1. Do quick web research on Nominatim/Overpass usage limits and query patterns.
2. Implement and run the Phase 1 Python POC script for 3–5 real addresses.
3. Build FastAPI proxy endpoints with caching and re-run POC through the proxy.
4. Once stable, scaffold React app with router basename `/hoop` and build Courts page first.

## 4) Success Criteria
- App is live at **treesh.app/hoop** and all routes work under `/hoop`.
- Courts: address and GPS search returns real nearby courts reliably; handles rate limits/timeouts gracefully.
- Favorites: save courts + export/import JSON works with validation and no data loss.
- Drills/Dictionary/Games content is complete (72/89/21) with smooth browsing and YouTube playback.
- Plan page generates usable sessions and timer works fullscreen/minimized/closed.
- Form Check runs on-device with MediaPipe Pose and provides live, understandable cues.
- Polished mobile UX with consistent restrained black/pink design and hoop logo branding.
## Phase: GitHub branch deployment (Status: COMPLETED)
- `hoop` branch → GitHub Action → `main:/hoop/` → Netlify → treesh.app/hoop
- Files: .github/workflows/deploy-hoop.yml, scripts/build-hoop-static.sh, HOOP_DEPLOY.md
