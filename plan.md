# Treesh 3.0 — Phase 5 Continuation Plan (single-file `index.html`)

## 1) Objectives
Complete Phase 5 continuation on top of the current working Treesh 3.0 single-file SPA **without breaking the zero-build / LocalStorage+IndexedDB constraints**.

**Current priority (updated):**
1) ✅ Restore/verify broken core interactions around **My Music custom uploads playback** (sequential + mobile background).
2) ✅ Apply requested polish/features: **What’s New desktop layout**, **Games asset upgrades**, **Play Count badges + Most Played sort**, **Lyrics quick access for uploads**.
3) ⏭️ Finish remaining requested UX upgrades starting with **My Music drag-to-reorder** (next session).

### Current status (as of this continuation session)
- App is served from **`/app/single_html/index.html`** via `python3 -m http.server` on port **3000**.
- Architecture: **Vanilla JS + Tailwind CDN**, single HTML file, persistence via **LocalStorage** + **IndexedDB (`treesh_db`)**.
- Edit safety: **sequential-only edits** to `index.html` (no parallel/batched edits).

### Completed (already implemented in `index.html` before this session)
- Queue drag-to-reorder (reorder scope `queue` in `REORDER_CBS`) ✅
- Mobile swipe-down-to-close Now Playing ✅
- Dynamic bottom padding for mini-player, drag-to-dismiss ✅
- Arcade Game modals + smooth transitions + draggable minimized game iframe ✅
- Library/Playlists UI enhancements (multi-select delete, reorder controls, menu consistency) ✅
- Library layout adjustments (Genres/filters placement, custom tracks excluded from “Icons” count) ✅
- Lyric Studio fixes (auto performer tags, save from Write mode, play/pause icon toggling) ✅
- Profile Settings cleanup ✅

### Completed & verified **this session**

**P0.1 — My Music sequential playback** ✅
- Added dedicated action `data-act="mm-play"` for embedded My Music playback.
- Threaded optional `act` param through: `songCard`, `songRow`, `grid`, `songList`.
- Updated `myMusicSection()` and `myMusicCard()` to emit `mm-play`.
- Implemented dispatcher handler for `mm-play` to build queue from `mmSortedList()`.
- **Verified**: uploaded 3 songs and played from embedded Library-home My Music section; playback advanced within My Music only.

**P0.2 — Mobile background playback hardening for custom uploads** ✅
- `loadUserSongs()` no longer revokes the currently playing blob URL (`audio.src`).
- Attached the main audio element to the DOM (hidden) and added inline playback hints:
  - `playsinline`, `webkit-playsinline`, `x-webkit-airplay=allow`
- Upgraded MediaSession wiring:
  - metadata with 6 artwork sizes
  - action handlers: `play`, `pause`, `nexttrack`, `previoustrack`, `seekto`, `seekforward`, `seekbackward`, `stop`
  - `setPositionState()` on `loadedmetadata`, throttled `timeupdate`, and `play`
- **Verified**: mobile emulation evaluation confirms blob URL source + playing state + DOM attachment + MediaSession playbackState/metadata.

**P2 — What’s New desktop upgrade** ✅
- Updated `wnSlide()` to render a **desktop-only (`lg:`)** layout:
  - contained inline 200×200 thumbnail bottom-left beside text
  - soft blurred ambient backdrop on desktop
  - mobile/tablet layout preserved using the original `.wn-content` block with `lg:hidden`
- **Verified**: desktop screenshot shows inline thumbnail; responsive verification via computed display confirms mobile layout unchanged.

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
- **Verified end-to-end**:
  - injected lyric edits → reload → lyrics button turns gold
  - Now Playing `toggle-lyrics` shows synced lines for uploaded tracks.

### What’s now pending / in progress

**P0**
- ✅ My Music playback bugs resolved and verified.

**P1 (NEXT session)**
- **Task 1: My Music drag-to-reorder**
  - `REORDER_CBS['mm']` already exists and persists `treesh_mm_order`.
  - Remaining work: render My Music list-view rows with reorder markup/handles (manual/recent mode only).

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
- Screenshot tool: uploaded multiple songs and verified next/ended stays within My Music.

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

### Phase P1 — My Music Drag-to-Reorder (P1) **[DEFERRED to next session]**
**Goal:** Allow users to manually arrange My Music tracks (persisted in `LS.treesh_mm_order`).

**Current code state**
- `REORDER_CBS["mm"]` already exists and persists `state.mmOrder` (`treesh_mm_order`).
- `wireAllReorder()` already runs after `renderView()`.

**Next implementation**
- Render My Music **list view** with reorder markup **only for manual/recent mode** (the mode tied to `state.mmOrder`):
  - Wrap rows with a container: `data-reorder="mm"`
  - Each row wrapper as direct child: `data-rid="songId"`
  - Add `data-rhandle` grip handle (match playlist detail pattern around line ~2106)
- Hide reorder UI for derived sort modes (A–Z / Z–A / Artist / Most played).

**Testing (next session)**
- Drag reorder in My Music manual mode → refresh → order persists.
- Switch to A–Z / Most played → reorder controls hidden; sort correct.
- Regression: My Music sequential playback still stays inside My Music.

---

### Phase P2 — “What’s New” Desktop Upgrade (P1) **[DONE + VERIFIED]**
**Goal:** On desktop, show cover/artist image inline **bottom-left** beside the text instead of acting as a full-slide cropped background.

**Implemented**
- `wnSlide()` now renders two layouts:
  - `<lg` (mobile/tablet): original `.wn-content` unchanged (`lg:hidden`).
  - `lg+` (desktop): inline thumbnail + text beside, over blurred ambient backdrop.

**Testing**
- Desktop screenshot: thumbnail inline bottom-left with text.
- Responsive check: computed display confirms correct block toggling.

---

### Phase P3 — Games: Banner/Icon Asset Refresh **[DONE + VERIFIED]**
**Goal:** Ensure Arcade game tiles/modals use updated assets with correct aspect behavior.

**Implemented**
- Updated FREA! icon + banner URLs.
- Added Chainz banner URL.

**Testing**
- Visual verification in Game view + info modal: icon badge and banner render as expected.

---

### Phase P4 — Play Count Badges + Most Played Sort **[DONE + VERIFIED]**
**Goal:** Track listening behavior and surface a subtle “Most played” highlight + sort.

**Implemented**
- `state.playCounts` persisted to `LS.treesh_plays`.
- Counts increment once per play when listening passes ~20s.
- “Most played” sort pill in `filterBar()` for both Library and My Music.
- Global most-played badge in rows/cards.

**Testing**
- Play 20s → LS updated; badge appears; sort works.

---

### Phase P5 — Lyrics on Uploads: Quick Access + Karaoke **[DONE + VERIFIED]**
**Goal:** Make it easy to add/edit lyrics for uploads and ensure karaoke display works.

**Implemented**
- Added `ls-open` button to `_user` song rows/cards (grey empty, gold when lyrics exist).
- Confirmed persistence pipeline:
  - `treesh_lyric_edits` stored in LocalStorage
  - `applyLyricEdits()` reapplies edits after IndexedDB rebuild

**Testing**
- Inject/add lyric edits → reload → button becomes gold → Now Playing `toggle-lyrics` renders synced lines.

---

## 3) Next Actions
1. (Next session) Implement **P1** My Music drag-to-reorder (manual/recent mode only) → test → commit.
2. Regression test:
   - My Music playback (sequential + background)
   - Play count increments only once per play at >20s
   - Most played sort doesn’t interfere with manual mm order

---

## 4) Success Criteria
- ✅ **My Music sequential playback:** embedded My Music plays through only My Music tracks in displayed order.
- ✅ **Mobile background playback:** custom uploads play from blob URLs reliably with MediaSession support; active blob URL is not revoked.
- ⏭️ **My Music reorder:** drag-to-reorder works in manual mode; persists to `treesh_mm_order`; does not interfere with derived sorts.
- ✅ **What’s New desktop:** desktop shows inline image bottom-left with text; mobile layout unchanged.
- ✅ **Games assets:** FREA! icon+banner and Chainz banner updated and displayed correctly.
- ✅ **Play counts:** play counts persist in `treesh_plays`, increment once per play after >20s.
- ✅ **Most played:** sort option exists and works in Library + My Music; badge highlights the global most-played track.
- ✅ **Lyrics on uploads:** quick “Add/Edit lyrics” button exists on upload rows/cards; karaoke lyrics render in Now Playing for uploads and persist across reload.
- No regressions to queue, now playing, scroll lock, game modal behavior, lyric studio, or storage management.
