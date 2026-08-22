# Treesh 3.0 — Phase 5 Continuation Plan (single-file `index.html`)

## 1) Objectives
Complete Phase 5 continuation on top of the current working Treesh 3.0 single-file SPA **without breaking the zero-build / LocalStorage+IndexedDB constraints**.

**Current priority (updated):**
1) ✅ Restore/verify broken core interactions around **My Music custom uploads playback** (sequential + mobile background).
2) ✅ Apply requested polish/features: **What’s New desktop layout**, **Games asset upgrades**, **Play Count badges + Most Played sort**, **Lyrics quick access for uploads**, **Library spacing fix**.
3) ✅ Rework Now Playing (music player) controls: **conjoined Fav/Dislike cycle**, **disliked never plays/queues**, **vinyl toggle moved to settings**, **tap artwork toggles display**.
4) ⏭️ Build remaining major UX/features (next):
   - **VOICE ASSISTANT REVAMP** (offline-only, no AI, TTS speak+show)
   - **Auto Lyrics Fetch** (lrclib.net)
   - **Weekly Top Played** strip
   - **Play count numbers on hover**
   - **My Music drag-to-reorder**

### Current status (as of this continuation session)
- App is served from **`/app/single_html/index.html`** via `python3 -m http.server` on port **3000**.
- Architecture: **Vanilla JS + Tailwind CDN**, single HTML file, persistence via **LocalStorage** + **IndexedDB (`treesh_db`)**.
- Edit safety: **sequential-only edits** to `index.html` (no parallel/batched edits).

### Completed (already implemented in `index.html` before this continuation)
- Queue drag-to-reorder (reorder scope `queue` in `REORDER_CBS`) ✅
- Mobile swipe-down-to-close Now Playing ✅
- Dynamic bottom padding for mini-player, drag-to-dismiss ✅
- Arcade Game modals + smooth transitions + draggable minimized game iframe ✅
- Library/Playlists UI enhancements (multi-select delete, reorder controls, menu consistency) ✅
- Library layout adjustments (Genres/filters placement, custom tracks excluded from “Icons” count) ✅
- Lyric Studio fixes (auto performer tags, save from Write mode, play/pause icon toggling) ✅
- Profile Settings cleanup ✅

### Completed & verified **in this continuation**

**P0.1 — My Music sequential playback** ✅
- Added dedicated action `data-act="mm-play"` for embedded My Music playback.
- Threaded optional `act` param through: `songCard`, `songRow`, `grid`, `songList`.
- Updated `myMusicSection()` and `myMusicCard()` to emit `mm-play`.
- Implemented dispatcher handler for `mm-play` to build queue from `mmSortedList()`.
- **Verified**: uploaded 3 songs and played from embedded Library-home My Music section; playback advanced within My Music only.

**P0.2 — Mobile background playback hardening for custom uploads** ✅
- `loadUserSongs()` no longer revokes the currently playing blob URL (`audio.src`).
- Attached the main audio element to the DOM (hidden) + inline playback hints:
  - `playsinline`, `webkit-playsinline`, `x-webkit-airplay=allow`
- Upgraded MediaSession wiring:
  - metadata with 6 artwork sizes
  - action handlers: `play`, `pause`, `nexttrack`, `previoustrack`, `seekto`, `seekforward`, `seekbackward`, `stop`
  - `setPositionState()` on `loadedmetadata`, throttled `timeupdate`, and `play`
- **Verified**: mobile emulation confirms blob URL playback + DOM attachment + MediaSession metadata/playbackState.

**P2 — What’s New desktop upgrade** ✅
- Updated `wnSlide()` to render a **desktop-only (`lg:`)** layout:
  - contained inline 200×200 thumbnail bottom-left beside text
  - soft blurred ambient backdrop on desktop
  - mobile/tablet layout preserved using the original `.wn-content` block with `lg:hidden`
- **Verified**: desktop screenshot shows inline thumbnail; responsive verification confirms mobile layout unchanged.

**Games — asset upgrades (banners/icons)** ✅
- **FREA!**
  - Updated icon/logo to: `https://64.media.tumblr.com/1fd0db4d82ed14192794f682ab768843/e4c300405ca5fd6e-fc/s1280x1920/dca2d086ba9e13671a9f45a186e0c792636d7be3.png`
  - Added banner to: `https://64.media.tumblr.com/a7702e3ce56a7902d5ea66fd32d97ded/d05b67bfd24521c9-70/s1280x1920/9f7d5339d7475e71226af55500432429369a2c93.png`
- **Chainz**
  - Added banner to: `https://64.media.tumblr.com/12c5bcd00d6eab86052e258de28b19c9/b6dc260cabef24e0-5c/s400x600/ef38354ebff5bd73f43312be103d4b08f63f0a31.png`
- **Verified**: Game info modal shows correct 1:1 icon badge + 3:2 banner; tumblr images load.

**Play Count badges + “Most played” sort** ✅
- Added `state.playCounts` persisted in LocalStorage key **`treesh_plays`**.
- Helpers: `playCount(id)`, `bumpPlayCount(id)`, `mostPlayedId()`.
- Counting rule: increments **once per play** when listening passes **~20 seconds**:
  - reset `state._playCounted=false` in `loadIndex()`
  - in main `audio.timeupdate`, when `ct>20` and not counted → `bumpPlayCount(curSong.id)`
- UI:
  - subtle gold flame badge `data-testid="most-played-badge-<id>"` shown on the **single current global most-played track** in `songRow` and `songCard`.
  - “Most played” pill added to shared `filterBar()` for **both** My Music (`mmSort`) and Library (`libSort`).
  - Sorting added to `mmSortedList()` and `viewLibrary()` (desc by play count, title tiebreak).
- **Verified**: `treesh_plays` updated at >20s, sort pill present/clickable, badge appears.

**Lyrics on uploads — quick access + karaoke compatibility** ✅
- Added visible `ls-open` button (captions icon) on all `_user` song rows and cards:
  - `data-testid="mm-lyrics-<id>"`
  - grey when empty; turns gold when lyrics exist
- Karaoke persistence for uploads confirmed:
  - Lyrics edits stored in `treesh_lyric_edits`
  - `applyLyricEdits()` runs during catalog rebuild (after `loadUserSongs()`/merge), so uploads receive edits after reload.
- **Verified end-to-end**: edits persist across reload and render in Now Playing.

**Library spacing overlap fix** ✅
- Fixed overlap between Library genre/filter section and the song list by wrapping `filterBar('lib')` in a margin container.
- **Verified**: no overlap; consistent spacing like My Music.

**Now Playing (music player) options rework** ✅
- **Conjoined favorite/dislike cycle**:
  - Replaced separate Like and Dislike buttons with a single cycle button:
    - `data-act="fav-cycle"`, `data-testid="now-playing-favdislike-button"`, `data-fav-state="none|fav|dislike"`
  - Behavior: **none → favorite → dislike → none** via `cycleFavDislike()`.
  - Disliking the current track **does not** auto-skip (so the 3-click cycle remains usable).
  - Kept delight: `flyHeart` / `breakHeart` on transitions.
  - **Verified**: cycle works and LocalStorage updates (`treesh_favorites`/`treesh_dislikes`).

- **Disliked songs never played/queued**:
  - `playSong()` blocks direct play of disliked songs (toast) and filters disliked tracks out when building queues.
  - `nextTrack()` and `prevTrack()` skip disliked tracks during traversal.
  - **Verified**: after disliking a track, traversal skips it.

- **Vinyl display toggle moved to Settings**:
  - Removed the vinyl toggle button from Now Playing controls.
  - Added toggle in **Settings → Appearance → Motion & effects**:
    - `toggleCard('toggle-vinyl','settings-toggle-vinyl', ...)`
  - `toggle-vinyl` handler now also rerenders Settings when active.
  - **Verified**: aria-checked + `treesh_vinyl` persist.

- **Tap/click cover art to toggle vinyl/cover**:
  - Artwork wrapper now has `data-act="toggle-vinyl"` with `data-testid="np-artwork-toggle"`.
  - Works in both cover mode and vinyl mode.
  - **Verified**: tapping toggles both ways.

### What’s now pending / in progress

**P0**
- ✅ My Music playback bugs resolved and verified.

**P1+ (NEXT)**
- **Voice Assistant Revamp** (offline-only; TTS speak+show)
- **Auto Lyrics Fetch** (lrclib.net; prefill + prompt)
- **Weekly Top Played** strip (rolling 7 days)
- **Play count numbers on hover**
- **My Music drag-to-reorder** (manual mode)

### Core constraints (non-negotiable)
- **Single file** architecture: only edit `/app/single_html/index.html`
- **Zero build steps**; **NO npm/yarn**
- Persist state via **LocalStorage + IndexedDB (`treesh_db`)** only
- Match existing UI language: Tailwind CDN, `--treesh-purple/gold`, glass surfaces, lucide icons, `.press`
- **CRITICAL**: perform **sequential** edits only (no parallel/batched edits)
- Testing method: **screenshot tool + mobile emulation**
  - Note: each screenshot run uses a **fresh browser context**; persistence tests must use **`page.reload()` within the same run**.

---

## 2) Implementation Steps

### Phase P0 — Fix Broken Core: My Music Playback (P0) **[DONE + VERIFIED]**
**Goal:** Custom uploads behave like a real playlist/album: **play in order, stay in My Music context, and continue reliably on mobile (background).**

#### P0.1 Fix Bug A (Sequential playback staying inside My Music) **[DONE + VERIFIED]**
**Root cause (confirmed)**
- Embedded My Music rows were using `data-act="play"` which uses `state.contextList`.
- On Library home (`viewLibrary()`), `state.contextList` was the full library list; next-track advanced into catalog.

**Implemented fix**
- Introduced `mm-play` action:
  - Dispatcher builds list from `mmSortedList()` and calls `playSong(selected, mmList)`
- Threaded action param through:
  - `songCard(s, act)`, `songRow(s,i,removable,act)`, `grid(list, act)`, `songList(list, removable, act)`
- Updated My Music renders to emit `mm-play`.

**Testing**
- Uploaded multiple songs and verified next/ended stays within My Music.

---

#### P0.2 Fix Bug B (Mobile background playback for custom uploads) **[DONE + VERIFIED]**
**Implemented fix**
1) **Prevent revoking active blob URL**
- In `loadUserSongs()` object URL cleanup, skip revoking the currently-playing `audio.src`.

2) **Audio element DOM integration for mobile**
- Added inline-playback attributes and ensured the main `audio` element is attached to `document.body` (hidden).

3) **Enhanced MediaSession**
- Added `updatePositionState()` helper and invoked on:
  - `loadedmetadata`
  - throttled `timeupdate`
  - `play`
- Added action handlers (`seekto`, `seekforward`, `seekbackward`, `stop`) and robust play/pause behavior.

**Testing**
- Mobile emulation evaluation confirms blob URL playback + DOM attachment + MediaSession metadata/playbackState.

---

### Phase P1 — My Music Drag-to-Reorder (P1) **[PENDING]**
**Goal:** Allow users to manually arrange My Music tracks (persisted in `LS.treesh_mm_order`).

**Current code state**
- `REORDER_CBS["mm"]` already exists and persists `state.mmOrder` (`treesh_mm_order`).
- `wireAllReorder()` already runs after `renderView()`.

**Next implementation**
- Render My Music **list view** with reorder markup **only for manual/recent mode** (the mode tied to `state.mmOrder`):
  - Wrap rows with a container: `data-reorder="mm"`
  - Each row wrapper as direct child: `data-rid="songId"`
  - Add `data-rhandle` grip handle (match playlist detail pattern around line ~2106)
- Hide reorder UI for derived sort modes:
  - A–Z / Z–A / Artist / Most played.

**Testing**
- Drag reorder in My Music manual mode → refresh → order persists.
- Switch to A–Z / Most played → reorder controls hidden; sort correct.

---

### Phase P2 — “What’s New” Desktop Upgrade (P2) **[DONE + VERIFIED]**
**Goal:** On desktop, show cover/artist image inline **bottom-left** beside the text instead of acting as a full-slide cropped background.

**Implemented**
- `wnSlide()` now renders two layouts:
  - `<lg` (mobile/tablet): original `.wn-content` unchanged (`lg:hidden`).
  - `lg+` (desktop): inline thumbnail + text beside, over blurred ambient backdrop.

**Testing**
- Desktop screenshot: thumbnail inline bottom-left with text.

---

### Phase P3 — Games: Banner/Icon Asset Refresh **[DONE + VERIFIED]**
**Goal:** Ensure Arcade game tiles/modals use updated assets with correct aspect behavior.

**Implemented**
- Updated FREA! icon + banner URLs.
- Added Chainz banner URL.

**Testing**
- Visual verification in Game view + info modal: icon badge and banner render as expected.

---

### Phase P4 — Play Count Tracking + Most Played Sort + Badge **[DONE + VERIFIED]**
**Goal:** Track listening behavior and surface a subtle “Most played” highlight + sort.

**Implemented**
- `state.playCounts` persisted to `LS.treesh_plays`.
- Counts increment once per play when listening passes ~20s.
- “Most played” sort pill in `filterBar()` for both Library and My Music.
- Global most-played badge in rows/cards.

**Testing**
- Play >20s → LS updated; badge appears; sort works.

---

### Phase P5 — Lyrics on Uploads: Quick Access + Karaoke **[DONE + VERIFIED]**
**Goal:** Make it easy to add/edit lyrics for uploads and ensure karaoke display works.

**Implemented**
- Added `ls-open` button to `_user` song rows/cards (grey empty, gold when lyrics exist).
- Confirmed persistence pipeline:
  - `treesh_lyric_edits` stored in LocalStorage
  - `applyLyricEdits()` reapplies edits after IndexedDB rebuild

**Testing**
- Edit lyrics → reload → button becomes gold → Now Playing `toggle-lyrics` renders synced lines.

---

### Phase P6 — Library Layout Spacing (Overlapping Filters) **[DONE + VERIFIED]**
**Goal:** Prevent overlapping between the filters/genres section and the Library song list.

**Implemented**
- Added bottom spacing by wrapping `filterBar('lib')` in a margin block in `viewLibrary()`.

**Testing**
- Desktop screenshot confirms spacing and no overlap.

---

### Phase P7 — Now Playing Controls Revamp (Music Player UX) **[DONE + VERIFIED]**
**Goal:** Simplify Now Playing actions, support a 3-state fav/dislike, and make vinyl display easier to access.

**Implemented**
1) **Conjoined Fav/Dislike**
- Added `favCycleBtn()` + `cycleFavDislike()`.
- NP now uses a single control `fav-cycle` with `data-fav-state`.

2) **Disliked exclusion**
- `playSong()` blocks disliked direct play + filters disliked out of new queues.
- `nextTrack()` / `prevTrack()` skip disliked tracks.

3) **Vinyl toggle relocation + persistence**
- Removed vinyl button from NP.
- Added Settings toggle card under Appearance → Motion & effects.

4) **Tap artwork toggles display**
- Artwork wrapper now triggers `toggle-vinyl`.

**Testing**
- Verified full cycle behavior, persistence, and skip logic.
- Verified settings toggle persists (`treesh_vinyl`).

---

### Phase P8 — Voice Assistant Revamp (Offline, Siri/Cortana Style) **[PENDING]**
**Goal:** Expand voice controls so users can do essentially everything with voice, with a sleek Siri/Cortana-style modal.

**Requirements (confirmed)**
- **Offline only** (no AI/network).
- **Speak responses aloud + show transcript** (TTS).
- Must degrade gracefully when SpeechRecognition is unavailable/unreliable:
  - suggestion chips and typed input should still run the same interpreter.

**Planned implementation**
1) Replace current voice engine (around `initVoice/toggleVoice/showVoice/handleVoice`) with:
- Continuous listening loop (start → interim results → final).
- Transcript timeline (user + assistant messages).
- Animated orb + subtle waveform (CSS only, no libs).
- Suggestion chips (tap-to-run) for testability.

2) Build an **intent interpreter** (`voiceInterpret(text)`) wired to app actions:
- Playback: play/pause/resume/next/previous/shuffle/repeat/volume up/down/mute.
- Play selection: "play <song>", "play <artist>", "play genre <x>", "play my music", "play liked".
- Search: "search <query>".
- Navigate views: library/icons/instrum/game/settings; open profile; open Lyric Studio picker.
- Now Playing: open/close, toggle lyrics.
- Theme: change accent via `applyAccent(state.accent)` + `LS.treesh_accent` (map color words).
- Accessibility: toggle reduce motion, dyslexia font, bold text, underline links, focus rings, spacious lyrics, text size.
- Help: "what can you do", "what’s playing".

3) TTS (`speechSynthesis`) response layer:
- Pause recognition while speaking.
- Short, consistent confirmations (like Siri).
- "Beep" alternatives if TTS unavailable.

**Testing**
- Use suggestion chips + typed input to validate interpreter deterministically.
- Voice path validated where possible; ensure mic UI respects `VOICE_OK`.

---

### Phase P9 — Auto Lyrics Fetch (lrclib.net) **[PENDING]**
**Goal:** One-tap “find lyrics” for uploads to avoid manual typing; store as synced lyrics for karaoke.

**Requirements (confirmed)**
- Use **lrclib.net** (no API key, CORS, supports synced LRC).
- UX: pre-fill Title+Artist from song metadata but allow user to edit before searching.

**Planned implementation**
- Add a new menu action for `_user` songs: `data-act="lyrics-fetch"`.
- Open a small modal:
  - inputs: Title, Artist (prefilled), optional Album.
  - button: “Find lyrics”.
- Fetch:
  - `GET https://lrclib.net/api/search?...` then fetch best match lyric endpoint.
  - Parse LRC into `{t, text}` items.
- Save into `state.lyricEdits[songId]` + persist to `LS.treesh_lyric_edits`.

**Testing**
- Mock with a known song title/artist and confirm:
  - lyrics appear in Now Playing karaoke
  - persistence across reload

---

### Phase P10 — Weekly Top Played Strip (Rolling 7 Days) **[PENDING]**
**Goal:** Show “Top played this week” at the top of My Music.

**Dependency**
- Need per-play timestamps, not just aggregate counts.

**Planned implementation**
- Extend play tracking to maintain a compact event log, e.g.:
  - `LS.treesh_playlog = [{id, ts}]` (cap to N=500–1000 entries)
  - compute rolling 7-day counts from log
- Render strip at top of My Music:
  - show top 3–10 `_user` tracks in last 7 days
  - quick play button uses `mm-play`

**Scope note**
- Prior user answers were ambiguous (uploads-only vs all songs); default to **uploads-only** for this strip.

---

### Phase P11 — Play Count Numbers on Hover **[PENDING]**
**Goal:** Show each track’s play count on hover (rows + cards).

**Planned implementation**
- On `songRow`: add a subtle count tooltip or small inline badge on hover.
- On `songCard`: show count near genre badge or under title (desktop hover only).
- Uses existing `playCount(id)`.

---

## 3) Next Actions
1. Implement **P8 Voice Assistant Revamp** (offline, TTS) with suggestion chips + typed input.
2. Implement **P1 My Music drag-to-reorder** (manual mode only) and regression test.
3. Implement **P9 Auto Lyrics Fetch** (lrclib.net) and persist into `treesh_lyric_edits`.
4. Implement **P10 Weekly Top Played** (requires event log; rolling 7 days; uploads-only).
5. Implement **P11 Play count numbers on hover**.

Regression tests after each phase:
- My Music playback (sequential + background)
- Disliked songs excluded from queues and skipped by next/prev
- Play count increments only once per play at >20s
- Most played sort doesn’t interfere with manual My Music order

---

## 4) Success Criteria
- ✅ **My Music sequential playback:** embedded My Music plays only My Music tracks in displayed order.
- ✅ **Mobile background playback:** custom uploads play from blob URLs reliably with MediaSession support; active blob URL is not revoked.
- ⏭️ **My Music reorder:** drag-to-reorder works in manual mode; persists to `treesh_mm_order`; does not interfere with derived sorts.
- ✅ **What’s New desktop:** desktop shows inline image bottom-left with text; mobile layout unchanged.
- ✅ **Games assets:** FREA! icon+banner and Chainz banner updated and displayed correctly.
- ✅ **Play counts:** counts persist in `treesh_plays`, increment once per play after >20s.
- ✅ **Most played:** sort option exists and works in Library + My Music; badge highlights the global most-played track.
- ✅ **Lyrics on uploads:** quick “Add/Edit lyrics” button exists; karaoke lyrics render in Now Playing for uploads and persist across reload.
- ✅ **Library spacing:** filters/genres no longer overlap the song list.
- ✅ **Now Playing controls:** single 3-state fav/dislike control; disliked tracks never auto-play/queue; vinyl toggle in settings + artwork tap.
- ⏭️ **Voice assistant:** Siri/Cortana-style modal; offline commands cover navigation, playback, theme, accessibility; speaks responses aloud.
- ⏭️ **Auto lyrics fetch:** one-tap fetch + persist + karaoke works.
- ⏭️ **Weekly Top Played:** computed from 7-day window and surfaced at top of My Music.
- No regressions to queue, now playing, scroll lock, game modal behavior, lyric studio, or storage management.
