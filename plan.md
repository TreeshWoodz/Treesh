# Treesh 3.0 — Phase 5 Rebuild Plan (single-file `index.html`)

## 1) Objectives
Update/finish Phase 5 **on top of the restored “good base”** commit (`0fcbf5d`) without breaking single-file SPA constraints:

### Current status (pivot applied)
- **Restored** `/app/single_html/index.html` from git commit **`0fcbf5d`** (this commit already contains the large feature set: Games/Arcade, Library, queue reorder, swipe-to-close, etc.).
- **Re-applied post-`0fcbf5d` survivors**:
  1) **Cache-buster** meta tags + **Service Worker unregister + cache clear** in `<head>`
  2) **Lyric Studio perf-chips** in write mode: `[Verse #: FEATURED ARTIST]`, etc. (suffix-aware `lsInsertTag`)
  3) **Hide “Space” hint badge on mobile** (show from `sm:` up)

### What still needs rebuilding (not present in any commit)
Confirmed via git reflog + fsck (dangling commits are old): the following improvements are **not recoverable** and must be rebuilt on the `0fcbf5d` base:
- **Settings → Storage**: Custom Music storage UI rework
  - Replace meter/progress bar with **checkbox list** + **Delete Selected / Delete All** (IndexedDB-backed)
- **Library: Playlists section inside Library** (not just profile sidebar)
- **Library/My Music UX bundle**
  - Play button on My Music section (tap play; **1.5s hold = shuffle**)
  - Collapse/expand My Music
  - Mobile action row → **dropdown menu** (Play excluded)
  - Multi-select checkboxes for My Music → “Edit selected”
  - Per-section sorting toggles (A–Z / Z–A)
- **Library main list filters**
  - Sorting: A–Z / Z–A
  - Filter: **by artist**
  - Filter: **songs with lyrics**
- **What’s New desktop UI adjustment**
  - Show the slide’s existing image asset **inline bottom-left with text** (desktop) instead of relying on a cropped background treatment
- **Playlist back button origin fix**
  - Playlist opened from Library should say **“Back to Library”** (vs “Back to Playlists”)

Constraints:
- Single file architecture (`/app/single_html/index.html`)
- Zero build steps, no npm/yarn
- Persist only in LocalStorage + IndexedDB (`treesh_db`)
- **Sequential** `search_replace` edits only
- Match existing design tokens & components (Tailwind CDN, `--treesh-purple`, glass surfaces, lucide, `.press`)
- Commit after each phase; test via screenshot tool (with `await`)

---

## 2) Implementation Steps

### Phase 1 — Storage Rework (re-apply, quick)
**Goal:** Replace “Custom music” meter/progress bar in Settings → Storage with a checkbox list + bulk actions.

**1A. UI replacement in `storageSection()`**
- Replace the Custom Music block:
  - Header: count + total bytes
  - List: per-upload row with checkbox, cover thumb, title/artist, size, single delete
  - Footer actions:
    - **Delete Selected** (enabled only when something selected)
    - **Delete All** (confirm)

**1B. State + helpers**
- Add state:
  - `state.storageSel = { [songId]: true }`
  - `state._userSizes = { [songId]: bytes }`
- Add helpers:
  - `customMusicManageHtml()` (renders list + actions)
  - `refreshCustomMusicManage()`
  - `deleteUserSongs(ids[])` (IDB delete + refresh via `loadUserSongs()`)
- Update `updateCustomMusicStorage()`:
  - Populate per-track sizes (`state._userSizes` + row updates)
  - Update total bytes + subtitle count

**1C. Dispatcher cases**
Add cases:
- `storage-user-toggle`, `storage-user-toggle-all`
- `storage-user-del-one`
- `storage-user-del-selected`
- `storage-user-del-all`

**Testing (Storage)**
- Inject a few IDB records, verify:
  - Select all, count updates
  - Delete one, delete selected, delete all
  - My Music counts refresh immediately

> Checkpoint: commit `Phase 1`.

---

### Phase 2 — Playlists Section Inside Library
**Goal:** Show playlists directly inside the Library page (browse view, genre `all`).

**2A. Library playlists block**
- In `viewLibrary()` when `browse` and `state.genre === "all"`:
  - Insert a “Playlists” section (below My Music)
  - Render playlist cards/rows from `state.playlists` / LocalStorage playlists
  - Provide “View all”/“Create” actions consistent with existing UI

**2B. Wire navigation**
- Opening a playlist from Library should set origin flag (Phase 6)

**Testing**
- Create playlist → confirm it appears in Library
- Open playlist → confirm detail view loads

> Checkpoint: commit `Phase 2`.

---

### Phase 3 — My Music UX Bundle
**Goal:** Improve Library’s My Music section UX without broad refactors.

**3A. My Music Play + Hold-to-shuffle**
- Add a primary **Play** button to My Music section:
  - Tap: play My Music list
  - **Press/hold 1.5s:** shuffle My Music

**3B. Collapse/expand**
- Add collapsible container state (e.g., `state.mmCollapsed`)
- Default: expanded

**3C. Mobile dropdown menu**
- Replace wrapping action row (Add/Manage/etc.) with a compact dropdown on small screens:
  - Exclude Play button from dropdown (Play stays prominent)

**3D. Multi-select + Edit selected**
- Multi-select checkboxes for My Music items
- Add “Edit selected” action (bulk edit entry point consistent with existing song edit UI)

**3E. Per-section sort**
- Sorting toggles for My Music:
  - A–Z / Z–A
  - Stored per section (not global)

**Testing**
- Desktop + mobile:
  - Play, hold-to-shuffle
  - Collapse/expand persists in session
  - Dropdown layout doesn’t wrap
  - Multi-select works and doesn’t interfere with play

> Checkpoint: commit `Phase 3`.

---

### Phase 4 — Library Main List Filters
**Goal:** Add filters for the **main Library song list** (not My Music) as requested:
- Alphabetical sort A–Z / Z–A
- Filter by artist
- Filter songs with lyrics

**4A. Filter state**
- Add `state.libFilters` (or similar) containing:
  - `sort: 'az'|'za'|null`
  - `artist: 'all'|artistId|artistName`
  - `lyricsOnly: boolean`
- Ensure filters do not break search mode; keep behavior intuitive:
  - Search results still sortable

**4B. UI controls**
- Add a compact filter bar in `viewLibrary()` above the song list:
  - Sort toggle
  - Artist dropdown
  - Lyrics-only toggle chip

**4C. Filtering logic**
- Apply in `viewLibrary()` pipeline in order:
  - query/genre filtering
  - lyricsOnly filter
  - artist filter
  - sorting

**Testing**
- Toggle lyrics-only → list shrinks
- Artist filter → list changes
- A–Z / Z–A stable and reversible

> Checkpoint: commit `Phase 4`.

---

### Phase 5 — What’s New Desktop Layout (inline image)
**Goal:** Desktop-only improvement: show the slide’s existing image asset inline bottom-left with the text instead of relying on a cropped background.

**5A. Modify `wnSlide()` / `whatsNewSection()`**
- On `sm:` and up:
  - Show a small cover/artist image thumbnail **inline** at bottom-left
  - Asset source: **whatever the slide already uses**
- Keep mobile design unchanged

**Testing**
- Desktop viewport screenshot
- Ensure no layout regression on mobile

> Checkpoint: commit `Phase 5`.

---

### Phase 6 — Playlist Back Button Origin Fix
**Goal:** Fix playlist back button label + navigation based on where playlist was opened from.

**6A. Track origin**
- Add `state.plOrigin = 'library'|'playlists'|null`
- When playlist opened from Library section: set `plOrigin='library'`
- When opened from Playlists view/profile: set `plOrigin='playlists'`

**6B. Update `viewPlaylistDetail()` + dispatcher**
- Back button label:
  - `plOrigin==='library'` → “Back to Library”
  - else → “Back to Playlists”
- Back action navigates accordingly.

**Testing**
- Open playlist from Library → Back returns to Library
- Open playlist from Playlists panel → Back returns to Playlists

> Checkpoint: commit `Phase 6`.

---

## 3) Next Actions
1. Implement **Phase 1 (Storage checkbox list)** on current HEAD (`0fcbf5d` + 3 survivors).
2. Commit + screenshot verification.
3. Implement phases 2–6 sequentially with small, targeted `search_replace` blocks at anchors:
   - `storageSection()` / `updateCustomMusicStorage()`
   - `viewLibrary()` / `myMusicSection()`
   - `whatsNewSection()` / `wnSlide()`
   - `viewPlaylistDetail()` + dispatcher cases
4. After each phase: commit + run screenshot tool tests (desktop + mobile)

---

## 4) Success Criteria
- **Storage**: Custom Music shows checkbox list + Delete Selected/Delete All; deletion removes IDB blobs and refreshes My Music counts.
- **Library**:
  - Playlists appear inside Library browse view.
  - My Music has Play + hold-to-shuffle, collapse, mobile dropdown menu, multi-select edit, per-section A–Z/Z–A sorting.
  - Main Library list supports sort A–Z/Z–A, filter by artist, and lyrics-only.
- **What’s New**: desktop layout shows inline image thumbnail bottom-left with text using the slide’s existing asset.
- **Playlists**: Back button respects origin (“Back to Library” when opened from Library).
- No regressions to navigation, scroll lock, Lyric Studio, Karaoke, or Lyric Card disclaimer.
