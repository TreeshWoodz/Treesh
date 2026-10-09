# Ebonics — by Treesh Games (PRD)

## Original problem statement
Come up with an epic game for black culture and people called "Ebonics", owned by Treesh Games. An addicting game about black ebonics and AAVE with unique gameplay. View live at https://treesh.app/games/ebonics. Add a currency called Starlites, trophies, achievements and many game modes.

## User choices
- Guest play, progress in localStorage; optional username for global leaderboard
- Curated AAVE bank + Claude Sonnet 5.5 (Emergent LLM key) for AI Remix + Flip It judge
- Build on preview URL first; deploy + connect treesh.app domain later
- Starlites earn-only, spent on themes & power-ups

## Architecture
- Frontend React, routes under /games/ebonics (lobby, modes, play/:mode, play/flip_it, lexicon, shop, trophies, leaderboard); state in `lib/store.js` (localStorage `ebonics_save_v1`)
- Backend FastAPI: POST /api/flip/judge, POST /api/ai/questions (Claude claude-sonnet-5-5), GET/POST /api/leaderboard (Mongo, $max per player+mode)

## Implemented (Oct 2026)
- One wallet only: Starlites come solely from `treesh_stars` (no welcome bonus); old Ebonics-only balance merged once ("Ebonics balance merged into Treesh"); `ebonics_starlites` deleted, `totalEarned` renamed `lifetimeEarned` so the parent arcade shows no second balance. Ready-to-upload build (PUBLIC_URL=/games/ebonics) at /app/dist/ebonics-build.zip.
- Treesh sync bridges (lib/treesh.js): same-origin iframe → parent `awardStars()` (no parent patch); cross-origin iframe → postMessage (`treesh:hello`/`treesh:stars:award` ↔ `treesh:sync`, origin-checked); standalone off treesh.app → Treesh account sign-in (Supabase, user's project, publishable key in env) pulling/pushing `user_data.data.localStorage.treesh_stars` with delta queue `ebonics_cloud_pending`. Profile "Treesh account" card. Note: user's hosted treesh.app/games/ebonics build was stale (pre-wallet-sync) and built without REACT_APP_BACKEND_URL ("undefined/api").
- Shared Treesh wallet: Ebonics balance = `treesh_stars.points` (fresh read-modify-write, `Ebonics · ...` log entries, live storage-event sync, one-time migration/welcome bonus); `ebonics_starlites` = lifetime earned. Treesh accent (`treesh_accent`) drives `--eb-gold` + auto-contrast `--eb-on-gold`, toggle in Shop (iteration_3 100% pass). Parent needs storage-listener patch in /app/memory/treesh_parent_snippet.md
- Treesh parent integration: shared `treesh_profile` (nickname, @username, avatar, birthday/zodiac, joined) with onboarding sheet (16 Treesh preset avatars + upload), Profile page (wallet, rank, stats, Starlites history, personal bests), leaderboard uses username||nickname; Starlites stored in `ebonics_starlites` (FREA!/Chainz pattern), `treesh_stars.points` read-only; storage-event live sync. Parent snippet: /app/memory/treesh_parent_snippet.md (iteration_2 100% pass)
- 7 modes: Say Less, Finish the Phrase, Real or Cap, Flip It (AI judge + offline fallback), 60s Speed Run, Daily Cookout (seeded, 2x, once/day), AI Remix (endless)
- Combo multiplier up to 5x, hearts, timers, 4 power-ups, sounds toggle, confetti
- Starlites economy, daily streak reward, 6 XP ranks, 19 achievements, Bronze→Platinum trophy tracks per mode
- Shop: 5 themes + power-ups; Lexicon of 50 terms (slang/grammar/culture) with search & learned tracking
- Global leaderboard per mode
- Testing: iteration_1 — 100% backend & frontend pass

## Backlog
- P1: Deploy + connect treesh.app domain (subdomain or proxy /games/ebonics)
- P1: Multiplayer head-to-head "Cipher" battles
- P2: Shareable result cards, audio pronunciations, cloud save/account sync, seasonal events
