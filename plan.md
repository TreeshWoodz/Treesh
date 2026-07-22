# Treesh 3.0 — Bug Fixes, Instrum Overhaul, Storage Mgmt, + LyricFlow Integration

## Ground Rules
- Single file only: `/app/single_html/index.html` (Vanilla JS + Tailwind CDN + localStorage). No build step.
- Served by python http.server on :3000 from `/app/single_html`.
- Light mode class = `html.theme-light` (NOT `.light`).
- DO NOT touch `/app/frontend` or `/app/backend`.
- DO NOT run parallel `search_replace` on index.html (race conditions → corruption). Sequential edits only.
- English-only UI copy.

---

## PHASE 1 — Bug Fixes & UI Polish (Status: IN PROGRESS)
1. Light-mode Profile modal theming (`#profile-panel` stays dark in light mode) — add theme-light overrides.
2. Queue / "Up Next": allow tapping any song in the list to play it (verify `q-jump` handler).
3. Mobile mini-bar overlapping bottom nav (validate at 390x844).
4. Welcome/Onboarding popup: birthday `<input type=date>` overflows off-screen → horizontal scroll. Fix width/box-sizing.
5. Desktop full-screen player: cover art & content overflow off screen. Constrain layout.
6. Player: remove transparent→black gradient (top/bottom) when viewing lyrics; make it theme-aware.
7. When a custom IMAGE background is set: panels/divs are transparent & unreadable → add solid/glass backings for readability.
8. Font size Large (and sometimes Medium/Normal): content overflows and doesn't fit → fix responsive fit.
9. Featured artists in lyrics: tapping the artist shows a popup with 2 options: (a) Go to profile, (b) Open their facts about this song.
10. Karaoke: smoother letter transitions, remove lyric background color, add a full full-screen black-background mode.
11. Add transitions/animations to (nearly) everything — tasteful, on-brand, perf-mode aware.
12. Fix lyric editing in Music Player — edits don't actually save/display (preserve sec/explain).
13. Lyric-edit toolbar: move Save to far right, then Close after Save (far right).
14. Move Favorite Lyrics into its OWN profile tab (separate from Favorite Songs).
15. Settings option: show Notifications inside the nav bar (top); nav bar animates taller to fit the notification.
16. Lyric lines: show an "edited" indicator; clicking an edited line reveals the ORIGINAL line below (like explanations). If edited + has explanation, show both in the same panel.
17. Lyric lines: let users add their own NOTES (like explanations, but user-authored) with indicator + panel.
18. Mobile LANDSCAPE optimization: restructure layouts so the whole app fits beautifully in landscape on phones.
19. Fix This-or-That champion = the song with the MOST wins (not last standing).
20. Fix "choppy jump/refresh" on clicks (preserve scroll, avoid needless full re-render/re-animate).
21. Merge Accent settings tab into the Display tab.
22. Standardize ALL checkbox/toggle styling to match the Lyric Game difficulty toggle card.
23. Rename Games "Lyric Game" tab -> "What's Next?".
24. Settings: customize colors of navigation bar, top bar, and song-list backgrounds.
25. Settings: font selection (many curated fonts) + allow custom fonts.
26. Starlites reward points system: earn points for actions (new songs, daily open, 30+ min listening, games, beats, interactions); show in profile. Values designed by agent; reserved for future features.
27. NEEDS-CLARIFICATION: "best lyrics" settings option the user referenced earlier (ask at checkpoint).
28. Card labels (Treesh's Picks etc.): default WHITE text + full customization (text/bg/border/border-color/shadow).
29. Treesh's Picks card: move Play button inline with title/artist (was floating right).
30. In-nav notifications: desktop = far-left inline in top bar, must NOT overflow search/voice/profile buttons.
31. If browser lacks SpeechRecognition: remove ALL voice UI (top-bar mic, game Speak, Voice settings tab).

## PHASE 2 — Instrum (Beat Studio) Overhaul (append)
- Add FAQ/guide &/or tutorial inside Instrum.
- Add curated beat PRESETS users can pick (good-sounding starting points).

## PHASE 2 — Instrum (Beat Studio) Overhaul (Status: NOT STARTED)
1. Add more instruments incl. Piano/Keys (melodic) so it's not only drums.
2. Add a dedicated NEW project button (Clear only clears steps of current project).
3. Fix saving projects (persist reliably to `treesh_beats`).
4. Desktop BPM input: remove/native-style the number spinner arrows to match design.
5. Add an OPEN button → saved-projects list as a popup MODULE (not pinned at bottom of studio).
6. Fullscreen: Save-project (name) popup is hidden → render modal above fullscreen layer.
7. Custom audio stems: record vocals / import audio stems (MediaRecorder + per-stem playback in engine).

## PHASE 3 — Storage Management (Status: NOT STARTED)
1. If localStorage too small, use IndexedDB fallback for large blobs (still fully local).
2. Account settings: show device storage capacity (navigator.storage.estimate + fmtBytes).
3. Manual per-item stored-data list with individual delete checkboxes.

## PHASE 3.5 — App & Page Password Protection (Status: NOT STARTED)
- Settings option to password-protect:
  - The ENTIRE app at startup (lock screen on load), and/or
  - Specific pages/sections (choose which to lock).
- PIN/password stored locally (hashed), unlock screen UI, forgot-flow.
- Must be added BEFORE LyricFlow.

## >>> CHECKPOINT: PAUSE & NOTIFY USER BEFORE STARTING LYRICFLOW <<<

## PHASE 4 — LyricFlow Integration (Status: NOT STARTED)
- Add as a new top-level nav section ("LyricFlow" / "Studio").
- Port ALL features from `/app/lyricflow_reference.txt`, translating jQuery → Vanilla JS + Tailwind:
  - Multi-tab lyrics editor (contenteditable), autosave + manual save, undo/redo
  - Song library w/ folders, trash, swipe actions
  - Audio management (IndexedDB blobs), waveform/visualizer
  - TTS (voices + choir mode), Rhymes finder, Find & Replace, rich toolbar
  - Translation, Explain/annotations + gallery
  - Karaoke mode, Sync Studio (LRC timestamps)
  - Export: plain / markdown / LRC / HTML; Backup/restore JSON (song select)
  - Passcode lock, FAQ, tutorial, Treesh import
- Persist under `treesh_lyricflow_*` keys / IndexedDB.
- Build cohesively, test at the end (per user).

## PHASE 5 — Future / Backlog
- Games "Choose a track" → full-screen search module (list/grid toggle).
- Custom image background w/ opacity overlay (verify existing).
- Remove Share Playlist button globally (verify + remove).

---

## Testing
- Screenshot tool for visual (desktop 1920x800 + mobile 390x844).
- testing_agent for complex JS flows after each phase.
- esbuild syntax check before screenshots: `esbuild src/... ` N/A (single html) → use node/`tidy`? Use browser console logs.

## Notes / Decisions (from user)
- Priority: Phase 1 bugs first → then Instrum → then Storage → then LyricFlow.
- LyricFlow: ALL features; new top-level nav tab; build all-at-once, test at end.
- Storage: localStorage, IndexedDB fallback for large data; keep everything local. Add storage feature BEFORE LyricFlow.
