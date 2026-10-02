# Treesh M.A.D. (Manage & Direct) — PRD (formerly Song Coder)

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

## Iteration 4 (2026-06)
- Artist form: collapsible Artist code panel + Copy code (new & edit)
- Bulk import: multi-file drop on Compose audio zone or Bulk import drawer; per-file ID3 read (title, artist+feat, album, genre, year, artwork), Cloudinary auto-upload when configured, Apply-to-all shared fields, per-item edit/preview/remove/send-to-Compose, duplicate warning, one commit/PR for all ready songs
- Tested iteration_5 (100%); live dup-chip nit fixed

## Iteration 5 (2026-06)
- Bulk credits: shared Written/Produced/Mixed by in Apply-to-all + per-item credit inputs; carried to upload & Compose
- Projects tab: groups catalog by data-album; editor (title, artist, cover=first track default, date=earliest default, slug, description, tracklist reorder/remove), live iframe preview, publishes standalone playable page to projects/<slug>.html (treesh.app/projects/<slug>) via Review/Go live; Copy code; Published status check
- commitFile supports creating new files; Settings: Project pages folder
- Tested iteration_6 (pass); mobile project editor overflow fixed

## Iteration 6 (2026-06)
- Renamed to "Treesh M.A.D." (Manage & Direct) — title, brand, all UI/PR text (file still Tools/songcoder.html; branch prefix songcoder/ kept)
- Models tab ("The Board") -> content/models.html (served /content/models), icons-style <article class="model"> blocks
  - Attributes: identity (division, board, age, pronouns, location, agency, availability, travel), measurements in cm+in (height/bust/waist/hips/inseam + height-ft), sizes (shoe, dress, suit, shirt, pants, bra), look (hair color/length/texture, eyes, skin tone, ethnicity, tattoos, piercings), work (experience, categories, skills, languages, credits), links (instagram, tiktok, portfolio, video, email), bio, headshot, photos (pipe list), digitals (pipe list)
  - Form: ft/in <-> cm toggle, category chips, validation, photo uploader (Cloudinary), link add, batch link import (URLs/HTML), tile kind toggle/headshot/reorder/remove, code panel + copy; add/edit/delete via Review/Go live; file auto-created
- Tested iteration_7 (100%)

## Backlog
- P1: Lyrics editor for content/lyrics
- P2: Main-app patch to honor data-release (badge + playback lock)
