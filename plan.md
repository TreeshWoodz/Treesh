# Treesh 3.0 — Phase 5 Rebuild Plan (single-file `index.html`)

## 1) Objectives
- Rebuild lost Phase 5 features **without breaking existing SPA** constraints:
  - Games: add **Arcade tiles** (Chainz, FREA, Nects) + **iframe overlay** (fullscreen/minimize/exit) using Blog iframe pattern.
  - Settings → Storage: replace Custom Music storage meter with **checkbox list** of uploaded tracks + **Delete Selected / Delete All** (IndexedDB-backed).
  - Library/My Music/Queue/Player UX bundle:
    - Library “My Music” header UX: mobile dropdown menu, Play button (with hold-to-shuffle), edit/selection actions, playlists section inside Library.
    - Queue: **drag-to-reorder** (plus keep existing up/down buttons as fallback).
    - Player: mobile **swipe-down to close** Now Playing.
    - Playlists back button origin fix: “Back to Library” when opened from Library.
  - Verify Lyric Card disclaimer remains intact.

## 2) Implementation Steps

### Phase 1 — Core POC (Isolation): iframe overlay + drag reorder + IDB deletion
(POC required because core flows can fail due to embed/CSP + pointer events + IndexedDB correctness.)

**1A. POC: Game iframe overlay (reusable component)**
- Add `<div id="gameframe"></div>` next to other overlay roots (`#np/#queue/#modal`).
- Implement minimal state + renderer:
  - `state.arcade = {open:false, id:null, url:null, title:null, minimized:false}`.
  - `renderArcadeFrame()` creates fixed overlay + header controls (minimize/fullscreen/new-tab/close) + `<iframe>`.
  - Fallback: if iframe fails (timeout or onerror), show “Open in new tab” CTA.
- Test: open/close, minimize/restore, scroll lock integration (`overlaysOpen()` must include `state.arcade.open`).

**1B. POC: Queue drag-to-reorder**
- Extend `renderQueue()` queue rows to support drag handle + `draggable`.
- Add minimal drag logic:
  - `queueDragInit(container)` attaches `dragstart/dragover/drop` handlers.
  - Reorder `state.queue` and keep `state.index` pointing to current song id.
  - Persist `state.base = state.queue.slice()`.
- Test: drag item above/below, current track remains correct, re-render stable.

**1C. POC: IndexedDB deletion correctness for Custom Music**
- Add helper `deleteUserSongs(ids[])`:
  - For each id: `idbDelete(id)` + remove from `USER_SONGS`/catalog merge + remove any playlist references if needed.
  - Refresh: `loadUserSongs()`/`mergeUserSongs()` pattern used by app, then `renderView()`.
- Test: delete one upload and verify it disappears from My Music and Storage UI.

> Checkpoint: commit after POC passes + capture screenshots.

---

### Phase 2 — V1 App Development (feature-complete rebuild)

**2A. Games page: Arcade section + 3 tiles**
- In `gameHomeHtml()` add an “Arcade” block below heroes:
  - Tiles: **Chainz**, **FREA** (coming soon), **Nects**.
  - Visuals: monogram tiles if logos missing; keep established card styles.
  - Actions:
    - Chainz/Nects: `data-act="arcade-open" data-url="…" data-title="…"`.
    - FREA: disabled tile with “Coming soon”.
- Add dispatcher cases: `arcade-open`, `arcade-close`, `arcade-min`, `arcade-full`, `arcade-newtab`.

**User stories (Games)**
1. As a user, I can tap an Arcade tile and play instantly without leaving Treesh.
2. As a user, I can minimize a game and return to the app without losing the game.
3. As a user, I can open the game in a new tab if embedding fails.
4. As a user, I can close the game overlay with one tap and resume where I was.
5. As a user, I can see a “Coming soon” placeholder for unreleased games.

**2B. Settings → Storage: Custom Music checkbox rework**
- Replace the “Custom music” meter block inside `storageSection()` with:
  - Count + total bytes (computed via `idbGetAll()` or cached estimate).
  - Scrollable list of uploaded tracks:
    - Checkbox per track, cover thumb, title/artist, size, single delete icon.
  - Footer actions:
    - “Delete Selected” (enabled only when checked)
    - “Delete All Custom Music” (confirm)
- Add state:
  - `state.storageSel = { [songId]: true }` and helper selectors.
- Dispatcher cases:
  - `storage-user-toggle`, `storage-user-del-one`, `storage-user-del-selected`, `storage-user-del-all`.
- Ensure `updateCustomMusicStorage()` now updates bytes/count only (or becomes no-op for the old bar).

**User stories (Storage)**
1. As a user, I can see every uploaded track listed with its cover/title.
2. As a user, I can select multiple tracks and delete them in one action.
3. As a user, I can delete a single upload quickly from the list.
4. As a user, I get a clear confirm dialog before bulk deletion.
5. As a user, the UI updates immediately after deletion without stale counts.

**2C. Library/My Music UX bundle**
- `myMusicSection()` updates:
  - Add Play button (tap = play; press/hold 1.5s = shuffle).
  - Add “Manage” action (opens My Music full screen view or selection mode).
  - Mobile: replace wrapping action row with a compact dropdown (excluding Play).
  - Add collapsible container for My Music list.
- Library enhancements (`viewLibrary()`):
  - Add Playlists section below My Music (reuse `state.playlists`).
  - Add per-section sort toggles (Recent/A–Z/Z–A) for My Music and Playlists blocks (keep minimal—no broad refactor).
  - Ensure “Edit selected songs” exists for My Music selection mode.
- Playlist detail back button:
  - Track origin flag (e.g., `state.plOrigin = 'library'|'playlists'`).
  - When opening playlist from Library section set origin=library.
  - Update `viewPlaylistDetail()` button text and `pl-back` handler.

**User stories (Library/My Music/Playlists)**
1. As a user, I can play all My Music instantly from the Library page.
2. As a user, I can open a clean dropdown menu on mobile instead of wrapped buttons.
3. As a user, I can collapse My Music to focus on the main library.
4. As a user, I can see my playlists directly inside Library.
5. As a user, playlist detail takes me “Back to Library” when that’s where I came from.

**2D. Queue + Player polish**
- Queue:
  - Add drag handle, keep up/down for accessibility.
  - Add haptic-like feedback via CSS class during drag.
- Player swipe-down close (mobile):
  - Add `pointerdown/move/up` listeners on `[data-np-root]` top region.
  - If vertical swipe distance > threshold and velocity/direction matches, call `closeNP()`.
  - Avoid conflict with sliders/lyrics scroll.

**User stories (Queue/Player)**
1. As a user, I can drag songs in the queue to change the play order.
2. As a user, the currently playing track stays playing even after reorder.
3. As a user, I can still use up/down buttons if drag isn’t convenient.
4. As a user on mobile, I can swipe down to dismiss Now Playing.
5. As a user, swiping won’t accidentally trigger when I’m scrolling lyrics or using sliders.

> Checkpoint: commit after Phase 2 + screenshot verification for each feature area.

---

### Phase 3 — Testing & Validation (incremental, screenshot-tool driven)
- Games:
  - Open Chainz/Nects (iframe), minimize/restore, close; test fallback new-tab.
- Storage:
  - Select/delete 1, select/delete many, delete all; verify My Music count updates.
- Library:
  - Play My Music; hold-to-shuffle; dropdown on mobile viewport; playlists section opens correctly.
- Queue/Player:
  - Drag reorder; verify `state.index` stability; swipe-down close on mobile viewport.
- Regression checks:
  - Ensure Lyric Card disclaimer still renders.
  - Ensure `overlaysOpen()` scroll lock works with new `#gameframe`.

## 3) Next Actions
1. Implement Phase 1 POC items sequentially (add `#gameframe`, arcade overlay renderer, queue drag reorder wiring, IDB delete helper).
2. Commit + screenshot POC.
3. Implement Phase 2A–2D sequentially with small, targeted `search_replace` blocks at the anchors:
   - `gameHomeHtml()` @3159
   - `storageSection()` @2129 / `updateCustomMusicStorage()` @2161
   - `myMusicSection()` @1852 / `viewLibrary()` @1893 / `viewPlaylistDetail()` @1965 / `pl-back` @5096
   - `renderQueue()` @3913 / `renderNP()` @3823
4. Commit after each sub-phase (Games, Storage, Library bundle, Queue/Player).
5. Run screenshot-tool tests at desktop + mobile widths.

## 4) Success Criteria
- Arcade tiles visible in Games Home; Chainz/Nects open in an in-app iframe overlay with minimize/full/new-tab/close.
- Storage → Custom Music shows checkbox list and bulk delete actions; deletes actually remove IndexedDB blobs and update Library.
- Library page includes improved My Music controls + playlists section; mobile dropdown works.
- Playlist detail back button respects origin (“Back to Library” when opened from Library).
- Queue supports drag-to-reorder; current track index remains correct.
- Mobile swipe-down closes Now Playing reliably without interfering with scrolling/controls.
- No regressions to existing navigation, scroll lock, Lyric Studio, Karaoke, or Lyric Card export disclaimer.
