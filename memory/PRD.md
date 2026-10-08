# Sonoko — PRD (Treesh Games)

## Original problem statement
Come up with an original game that mixes sudoku and uno together. Call it Sonoko. It should work beautifully on mobile and desktop, be fun and addicting, owned by Treesh Games, with trophies, achievements and different game modes including regular sudoku and uno.

## User choices
- Progress stored locally (localStorage, no login)
- Modes: Sonoko hybrid, Classic Sudoku, Classic Uno vs AI, Daily Challenge
- Simple name-based global leaderboard
- Designer-chosen bold playful look (dark arcade + neon Uno colors, Barlow Condensed / DM Sans / JetBrains Mono)

## Architecture
- Frontend: React SPA (pages: Home, SonokoGame (also Daily), SudokuGame, UnoGame, Trophies, Leaderboard, HowToPlay). Game logic in `src/lib` (sudoku generator w/ seeded RNG, uno engine, progress/achievements, WebAudio sfx).
- Backend: FastAPI `/api/scores` (POST) and `/api/leaderboard` (GET mode, date). MongoDB `scores` collection.

## Sonoko rules
6x6 sudoku (2x3 boxes) with tinted cells. Hand of cards (1-6 in 4 colors + Wild + Reveal). Card must match top card color or number AND be placed in its correct cell. Tint match = 2x points. Combo multiplier up to x5. Wrong cell = -1 heart + penalty card. 12 cards = bust. Call SONOKO! at 1 card then empty hand for bonus + fresh hand. Dead cards burn. Win bonus: time + hearts.

## Implemented (2026-06)
- All 4 modes, result dialogs with leaderboard submit/rank, confetti, sounds w/ toggle
- 24 achievements (bronze/silver/gold/platinum) + trophy cabinet + stats + XP levels
- Daily seeded puzzle + streaks; leaderboard tabs per mode
- Responsive mobile/desktop; tested 100% (iteration_1)

## Iteration 2 (2026-06)
- Synced with GitHub TreeshWoodz/Treesh branch `Sonoko` (basename /games/sonoku, _redirects). Router basename + `<base href>` auto-detect `/games/sonoku`, homepage "." so the build works at root or under /games/sonoku.
- Tutorial (/play/tutorial, 13 guided steps), Versus vs bot Ivy (/play/versus), Locker skins/themes by level (/locker), Daily share card (Web Share / copy / PNG).
- Treesh integration: save key `treesh_sonoku_v1` (synced by parent's Supabase backup since it starts with "treesh"), reads `treesh_profile` + `treesh_stars`, Profile page (/profile), Starlites (per game + trophy payouts), `summary` object for the parent. Parent patch at /app/parent/index.html (+ /app/parent/sonoku-bridge.js) registers Sonoku in GAME_DATA_SOURCES.
- All gameplay screens fit viewport (h-dvh, BoardFit container-query board).

## Backlog
- P1: Tutorial walkthrough on first Sonoko game; pause menu
- P1: Rate limiting for score submissions
- P2: Sonoko vs AI (competitive hybrid), more card powers, themes/card skins unlocked by level
- P2: Share daily result card
