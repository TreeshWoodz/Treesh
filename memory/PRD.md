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
