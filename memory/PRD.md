# Treesh Song Coder — PRD

## Original problem
Make the Treesh song coder tool (live at https://treesh.app/tools/songcoder) way better and polished. Keep it ONE file (saved to GitHub). Ability to update Treesh's music catalog (https://treesh.app/content/songs → repo file content/songs.html) automatically after pressing an upload button. Follow-up: make it fit on mobile screens.

## User choices
- Repo TreeshWoodz/Treesh, branch main, catalog content/songs.html, tool lives in Tools folder
- Publish: GitHub token in-browser (localStorage), BOTH modes: Pull Request (review) and direct commit (go live)
- Media: Cloudinary unsigned preset upload AND paste URLs; read ID3 tags/artwork from MP3
- Catalog: add + browse/edit/delete
- Design: keep Treesh look (dark #0a0a0b, purple #9328ff, Manrope + Special Gothic Expanded + Doto) from main app index.html

## Architecture
- Deliverable: /app/Tools/songcoder.html (copy of /app/frontend/public/songcoder.html) — vanilla JS, CDN: lucide, jsmediatags, Google Fonts
- GitHub REST from browser: contents GET/PUT (sha), git refs, pulls; conflict retry on 409
- Catalog edit is surgical: raw <ul class="song"> blocks located in file text (comments skipped); unknown attrs/class preserved
- Preview-only test harness: /app/backend/server.py mocks GitHub at /api/mockgh (NOT part of deliverable); /app/frontend/public/content/* snapshot for read-only mode

## Implemented (2026-06)
- Compose: media dropzones (Cloudinary auto-upload w/ progress or link paste), ID3 autofill, roster-linked artist IDs, featured chips, genre/mood chips, date picker, credits, YouTube ID extraction, bio, badges; live preview + audio play; code viewer/copy; draft autosave; duplicate warning; validation; Ctrl/Cmd+Enter
- Publish: Review (PR) / Go live toggle; success/error modals; pending PR strip
- Catalog: search/filter/sort, play, edit, delete
- Settings drawer: token, owner/repo/branch/paths, Cloudinary, API base, test connection
- Fully responsive (mobile/tablet/desktop) — tested iteration_1 & iteration_2 (100%)

## Iteration 2 (2026-06)
- Release countdown: 'Drops on' datetime -> data-release="ISO+offset" on the song; preview + catalog show Dropping soon badge & live countdown (main app must read data-release and lock playback; user handles main app)
- Artists tab: roster grid (photo, role, id, location, cashapp, song counts) + New artist drawer (photo/background drop or URL, bg position, location, bio, Cash App, role) -> inserts <article class="artist"> at top of content/icons.html with next id
- Catalog reorder mode: drag (SortableJS) + top/up/down buttons; saves via Review/Go live; preserves comments/gaps
- Mode toggle synced across publish dock, reorder bar, artist drawer
- Tested iteration_3 (100%)

## Iteration 3 (2026-06)
- Artists: edit (prefilled drawer, in-place replace, unknown attrs preserved) & delete (warns about linked songs)
- Pin to top: one-tap pin on catalog cards (Review/Go live)
- Lyrics Studio tab (content/lyrics.html, served at /content/lyrics): song list w/ Synced/Plain/None status, Write mode (textarea, [Section] headers), Sync mode (tap/Space to stamp, undo, manual mm:ss.xx edit, per-line explanations, live karaoke highlight), save via Review/Go live, collapsible Lyrics code + Copy code
- Settings: Lyrics file path
- Tested iteration_4 (100%); lyrics copy-code self-tested

## Backlog
- P1: Lyrics editor for content/lyrics
- P2: Main-app patch to honor data-release (badge + playback lock)
