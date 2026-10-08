# Bronze Blitz — PRD (Treesh Games)

## Original problem statement
"come up with an epic game like candy crush but for black culture and people called “Bronze Blitz”. owned by Treesh Games. Make sure i'm able to view live at this link - https://treesh.app/games/bronze-blitz. add a currency called starlites, add trophies achievements and many game modes"

## User choices
- Guest play, progress in localStorage + cloud save via player tag + 6-char save code
- Modes: Classic Levels (30-level map), Timed Blitz, Moves Challenge, Daily Challenge, Endless Zen
- Starlites earned by playing; spent on power-ups (hammer, shuffle, extra moves, starlite blast) + board themes
- Global per-mode leaderboard
- User owns treesh.app; will deploy + connect domain later

## Architecture
- Frontend: React (CRA/craco) + framer-motion, routes under basename `/games/bronze-blitz` (root redirects there)
  - `src/game/engine.js` pure match-3 logic (runs, specials: striped row/col, bomb, Starlite Disco; gravity; shuffle; kente layer)
  - `src/game/useGame.js` game loop hook; `config.js` levels/modes/achievements/themes/rewards; `store.js` profile context (localStorage)
  - Pages: Hub, LevelMap, Play, Trophies, Shop, Leaderboard, Profile
- Backend: FastAPI + MongoDB — `/api/scores`, `/api/leaderboard/{mode}`, `/api/cloud/save`, `/api/cloud/load`

## Implemented (Oct 2026)
- 8x8 match-3 with culture tiles (Vinyl, Afro Pick, Boombox, Fresh Kicks, Djembe, Golden Crown, Kente Gem), click-swap + swipe, cascades, combo words, hints, sound fx
- 5 modes, 30 levels in 3 chapters (score / collect / clear-Kente goals, 3-star rating, continue for +5 moves)
- Starlites economy, daily Starlite drop, shop (4 power-ups, 6 themes), 20 trophies with claimable rewards
- Per-mode global leaderboard (classic = total stars, daily = today only), cloud save/load with auto-sync after games

## Iteration 2 (Oct 8 2026)
- Treesh integration: name from treesh_profile.nickname (prompt only if missing), shared wallet treesh_stars.points, progress key bronze_save_v1, one-time 200 welcome gift; parent snippets in /app/memory/treesh_parent_snippet.md
- Level map horizontal scroll fixed; play + result screens fit viewport (100dvh, no scrolling)
- Applied user's branch changes: homepage /games/bronze-blitz, _redirects

## Iteration 3 (Oct 8 2026)
- Treesh avatar (treesh_profile.avatar / avatarUrl) shown in top bar + profile; falls back to initial
- Treesh accent color (treesh_accent) drives the whole game UI via --ac CSS vars; live updates via storage events; default theme renamed 'Signature'

## Backlog
- P1: Deploy and connect treesh.app custom domain (path /games/bronze-blitz)
- P1: More obstacle types (locked tiles, chained crates), special+special combo effects
- P2: Background music tracks, avatars, friends/challenges, weekly events
