# Treesh — PRD (Phase 5)

## Original problem statement
Treesh web app: massive single-file architecture (`/app/single_html/index.html`), zero build steps, offline-first via LocalStorage/IndexedDB. DO NOT use npm/yarn, do not touch /app/frontend or /app/backend. Served at preview root by `python3 -m http.server 3000 --directory /app/single_html`. Respond in English.

## Architecture
- Vanilla JS SPA + Tailwind CDN, Web Audio, Web Speech, lrclib.net (lyrics), datamuse (rhymes).
- localStorage (~5 MB cap): settings/state only.
- IndexedDB `treesh_media` v2: store `tracks` (uploaded audio/cover blobs) + store `assets` (`bg_images` array of data URLs, `custom_font` {data,name}).
- Edits to index.html must be sequential (never parallel search/replace).

## Implemented
- Earlier sessions: Instrum DAW, Backdrops Studio, Music Manager, Games/Things tabs, game stats bridge (FREA, Chainz), honest storage meter, PWA install hints, full export/import transfer.
- 2026-06 (this session):
  - Roomier Storage: fonts + backdrops moved to IndexedDB `assets`; auto-migration of legacy LS keys; "Fonts & backgrounds" storage row (clearable); backup v2 includes assets; backdrop quality raised (1920px @0.85), settings bg limit 9, font limit 15 MB.
  - Settings Search: "Settings" tab in global search (44 entries), inline toggles, go-to jumps with highlight flash, quick settings block on Songs tab.
  - Image Studio (renamed from Cover Art Studio): Adjust + "Text & stickers" tabs; text/emoji layers (drag, pinch, rotate, resize, fonts, color, align, position, max 10) baked into exported JPEG.
  - Tested: iteration_11.json — 100% frontend pass.
  - Crossfade: ghost-element overlap with equal-power fades (default 6s, 0–12s, "Song endings" or "Endings + skips"), Settings → Appearance → Sound card, 3 Settings Search entries; iOS gets an early gap-free advance (Safari ignores volume). State in LS `treesh_xf`.
  - Karaoke fullscreen stage: real Fullscreen API, pulsing glow (Accent default / Cover / Rainbow, LS `treesh_kar_glow`), big word-by-word glowing current line, dimmed next/prev lines, auto-hiding controls (3s), progress seek, count-in + performer tags kept.
  - Tested: iteration_12.json — 100% frontend pass.

## Backlog
- P1 (blocked): Vocotap & Nects Starlites/stats — need the user's game files / storage keys.
- P2: Lyric Card Studio revamp (preview always visible)
- P2: Find Lyrics search improvements (lrclib formatting)
- P2: Instrum DAW recording/session/export polish

## Testing notes
Seed on load: `localStorage.setItem('treesh_whatsnew_off','true'); localStorage.setItem('treesh_profile', JSON.stringify({nickname:'Tester',birthday:'2000-01-01'}))`.
