# Hoop by Treesh — publishing to treesh.app/hoop

Hoop is a React app that runs under the `/hoop` path.

## Option A — static (recommended for treesh.app, same origin as Treesh)
1. `bash /app/scripts/build-hoop-static.sh`
2. Copy `/app/hoop-dist/hoop/` into the root of the **Treesh** repo (branch `main`) so it lives at `treesh.app/hoop`.
3. Commit & push. Every route (`/hoop/courts`, `/hoop/drills`, `/hoop/games/horse`, …) has its own `index.html`, so refresh/deep links work on any static host.

In static mode Hoop calls OpenStreetMap (Nominatim geocoding + Overpass court lookup) straight from the browser — no server or API key required.

## Profile link with the Treesh parent app
Because Hoop is served from the same origin as Treesh (`treesh.app`), it reads the parent profile directly from `localStorage["treesh_profile"]` (`{nickname, birthday, zodiac, avatar}`) and live-updates when Treesh changes it. Edits made in Hoop are written back in the same schema. All Hoop data is stored under `treesh_hoop_*` keys, so the Treesh storage manager and "Erase everything" include it.

## Option B — full stack
Deploy the FastAPI backend (`/api/geocode`, `/api/reverse`, `/api/courts` with Mongo cache) and the frontend together; the app uses the API first and falls back to direct browser lookups.
