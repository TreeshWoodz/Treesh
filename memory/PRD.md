# Hoop by Treesh — PRD
Served at /hoop (React Router basename). Black & pink restrained dark UI, fonts Special Gothic Expanded One / Manrope / Doto.
Pages: Courts (OSM Nominatim + Overpass via FastAPI /api/geocode, /api/reverse, /api/courts; browser-direct Overpass fallback; Leaflet map), Drills (72 drills/14 lanes, steps, cues, YouTube per lane), Plan (generator, templates, weekly planner, intervals, saved plans, global fullscreen/minimizable timer), Dictionary (89 terms with SVG court diagrams), Position (body → PG..C), Games (21 games, 12 scorekeeper types), Favorites (localStorage + JSON export/import), Form Check (MediaPipe PoseLandmarker on-device, 5 checks, per-shot report, voice), Profile (reads/writes parent Treesh localStorage key `treesh_profile` {nickname,birthday,zodiac,avatar}; Hoop data under `treesh_hoop_*`).
No auth. No mocks.

## Deployment (Sep 30, 2026)
- Hosting: code on GitHub (repo Treesh), Netlify deploys branch `main` (website).
- Hoop is saved to its own branch `hoop`. `.github/workflows/deploy-hoop.yml` builds static Hoop (PUBLIC_URL=/hoop, BrowserRouter basename=/hoop) on every push to `hoop` and rsyncs it into `main:/hoop/` (configurable via repo var HOOP_TARGET_DIR; optional secret HOOP_DEPLOY_TOKEN for protected main).
- `scripts/build-hoop-static.sh` is repo-relative (local + CI), emits per-route index.html so deep links work on Netlify without redirects.
- Verified: local static build served at /hoop/ → drills, games/horse deep links render correctly.
