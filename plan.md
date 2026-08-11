# Treesh 3.0 — Phase 5 Continuation Plan (single-file `index.html`)

## 1) Objectives
Continue Phase 5 on top of the restored “good base” (`0fcbf5d`) **without breaking the single-file SPA constraints**, focusing now on the **new confirmed backlog** and the two **reported-broken core interactions**.

### Current status (as of now)
- App is served from **`/app/single_html/index.html`** (≈5888 lines / 741KB) via `python3 -m http.server` on port **3000**.
- Restored baseline from commit `0fcbf5d` and re-applied small survivorship changes (cache-buster + SW unregister, perf-chips, hide Space hint on mobile).
- Phase-5 rebuild items originally in plan are **DONE**:
  - **Settings → Storage**: Custom Music storage checkbox list + Delete Selected/All
  - **Library**: Playlists section inside Library
  - **Unified inline scrollable filters** for Library + My Music (A–Z/Z–A/Artist/With Lyrics)
  - **My Music UX**: tap-to-play, hold-to-shuffle, select mode, edit details button, mobile menu
  - **Playlist detail UX**: dynamic back label by origin, Play button for playlist

### What’s now pending (new/revised backlog)
User confirmed:
- Playlist section label must be **“Playlists”**
- Execution order: **Phase A → Phase B → Phase C**
- Start with: **Queue drag + swipe-down-to-close player**
- Testing: **screenshot_tool + mobile emulation**
- Swipe gesture scope: **mobile only**

### Core constraints (unchanged)
- **Single file** architecture: only edit `/app/single_html/index.html`
- **Zero build steps**, **NO npm/yarn**
- Persist state via **LocalStorage + IndexedDB (`treesh_db`)** only
- Match existing UI language: Tailwind CDN, `--treesh-purple/gold`, glass surfaces, lucide, `.press`
- **CRITICAL**: perform **sequential** `search_replace` edits only (parallel edits previously corrupted the file)

---

## 2) Implementation Steps

### Phase A — Fix Broken Core (P0) **[IN PROGRESS]**
**Goal:** Restore the two broken “everyday” interactions and deliver the Arcade modal experience + Playlist library controls.

#### A1. Queue drag-to-reorder (replace chevrons-only UX)
**Problem found:** `renderQueue()` currently offers only `q-up/q-down` chevrons; no drag UI exists.

**Implementation**
- Reuse existing pointer-based reorder system:
  - `wireReorder(container)`
  - `REORDER_CBS` map
- Add a new reorder scope:
  - `REORDER_CBS.queue = (order)=>{ ... }`
  - Rebuild `state.queue` using `order` (song ids) while:
    - preserving the current playing song as `state.index`
    - keeping `state.base = state.queue.slice()` consistent
- Update `renderQueue()` markup:
  - Wrap rows in a container with `data-reorder="queue"`
  - Each row becomes a direct child with `data-rid="<songId>"`
  - Add a visible drag handle with `data-rhandle`
- Wiring (important because queue renders outside `renderView()`):
  - After queue HTML is set and `icons()` runs, call:
    - `wireReorder(queueContainerElement)`

**Testing (screenshot_tool)**
- Desktop: open Queue → drag items → verify order changes and current song indicator stays correct
- Mobile emulation: drag reorder works via pointer/touch

> Checkpoint: commit `Phase A1`.

---

#### A2. Mobile swipe-down-to-close Now Playing
**Problem found:** `renderNP()` has no gesture handlers; only close button works.

**Implementation**
- Add swipe-down gesture on `#np [data-np-root]`:
  - Use pointer/touch tracking (`pointerdown/move/up` + fallback to touch events if needed)
  - Translate the player panel visually while swiping
  - Close if:
    - distance threshold exceeded (≈120px), OR
    - fast flick downward (velocity threshold)
- Guard rails to prevent accidental close:
  - Do **not** start swipe when interacting with:
    - seek slider (`#np-seek`), volume slider (`#np-vol`)
    - lyric scroll container (`#np-lyrics`) while user is scrolling lyrics
  - Only enable swipe behavior on mobile viewport (per user choice “A”).

**Testing (screenshot_tool)**
- Mobile emulation:
  - Open NP → swipe down from header area → closes
  - Drag slightly → snaps back
  - Interacting with sliders/lyrics does not trigger close

> Checkpoint: commit `Phase A2`.

---

#### A3. Arcade Game Info Modals
**Goal:** Opening a game from Games/Arcade shows a dedicated modal with metadata and explicit Play action.

**Implementation**
- Reorder the `GAMES` list to show **FREA first**, then Chainz, then Nects.
- Extend game definitions with:
  - `desc`, `age`, `updated`, `cover` (or use `logo` if that’s the intended cover)
- Add modal renderer:
  - `openGameInfo(key)` → renders modal containing:
    - Title
    - Cover image (fallback gradient + mono letter for FREA if no asset)
    - Close button
    - Play button → calls `openGameFrame(key)`
    - Age rating + last updated date
- Update dispatcher:
  - `case "game-open"` should call `openGameInfo(key)` instead of `openGameFrame` directly.

**Copy requirements**
- **FREA!**: “Play minigames.” Age **6+**. Updated **July 28, 2026**. (Do not mention Fleafall)
- **Chainz**: “A word chaining game.” Age **13+**. Updated **June 20, 2026**.
- **Nects**: “Find the emoji on the board before your opponent.” Age **6+**. Updated **July 26, 2026**.

**Testing (screenshot_tool)**
- Open each game tile → modal appears with correct metadata
- Play launches iframe game frame
- Close returns to page with scroll lock correct

> Checkpoint: commit `Phase A3`.

---

#### A4. Playlists Library Section Enhancements
**Goal:** Upgrade the Library → Playlists surface.

**Implementation**
- Rename section label:
  - “Your Playlists” → **“Playlists”**
- Add dropdown/menu button to enter selection mode:
  - show checkboxes on playlist cards
  - actions: **Delete Selected** (confirm)
- Add rearrange support:
  - Use existing `REORDER_CBS.plcards`
  - Ensure Library playlists row renders with `data-reorder="plcards"`, `data-rid`, and `data-rhandle`

**Testing (screenshot_tool)**
- Select multiple → Delete Selected removes them from state + persists
- Drag reorder playlist cards → order persists

> Checkpoint: commit `Phase A4`.

---

### Phase B — Reordering & Studio (P1) **[NOT STARTED]**
**Goal:** Finish My Music reorder support and resolve Lyric Studio transport bugs.

#### B1. My Music reorder (Recent/manual list-view)
**Implementation**
- Add reorder container and handles to My Music list view:
  - Render list with `data-reorder="mm"`
  - Each row has `data-rid="songId"` and a `data-rhandle` grip
- Respect sorting modes:
  - Only enable reorder for the mode that maps to `state.mmOrder` (i.e., “Recent/manual” mode).

**Testing**
- Drag reorder in My Music list view → persists to `LS.treesh_mm_order`

> Checkpoint: commit `Phase B1`.

---

#### B2. Lyric Studio: play icon toggle + timestamp syncing
**Root cause identified**
- Lucide replaces `<i data-lucide>` with `<svg>`, so querying `#ls-play i` becomes null after first render.

**Implementation**
- Rewrite `lsUpdatePlayIcon()` to update the button content robustly:
  - Set the button’s `innerHTML` with a fresh `<i data-lucide="play|pause">...` then call `icons()`.
- Verify transport UI updates during playback:
  - `lsUpdateTransport()` updates current time/duration/seek slider reliably

**Testing**
- Play/pause toggles icon every time
- Seek slider updates while playing and doesn’t fight while dragging

> Checkpoint: commit `Phase B2`.

---

### Phase C — UI Polish (P1/P2) **[NOT STARTED]**
**Goal:** Apply the requested UI refinements and correctness fixes.

#### C1. Library layout + counts + remove share links
**Implementation**
- Reposition genres + filterBar:
  - Move chips + filter bar **below** the “All Music” header/subtitle area
- My Music play button:
  - Remove the “Play” text → icon-only button
- Count fix:
  - “# tracks from the Icons” must **exclude** custom tracks (`_user`)
- Remove share links from playlists across all surfaces:
  - Library playlists section cards
  - Playlist detail view button row
  - Playlists view cards
  - Profile playlists cards
  - (Keep track sharing via `np-share`)

**Testing**
- Layout looks correct on desktop + mobile
- No playlist Share buttons remain

> Checkpoint: commit `Phase C1`.

---

#### C2. What’s New desktop upgrade
**Implementation**
- Modify `wnSlide()` desktop layout:
  - On desktop, show slide image inline bottom-left with text
  - Keep existing mobile cropped/background style unchanged

**Testing**
- Desktop viewport: inline image sits bottom-left with text
- Mobile: unchanged

> Checkpoint: commit `Phase C2`.

---

#### C3. Zodiac sign fix
**Root cause identified**
- Current `zodiac()` logic returns incorrect results for days after monthly cutoff.

**Implementation**
- Rewrite `zodiac(birthdayISO)` using standard zodiac date ranges:
  - Correctly handle month/day boundaries

**Testing**
- Verify a set of known dates (e.g., Jan 20 → Aquarius, Mar 21 → Aries, etc.)

> Checkpoint: commit `Phase C3`.

---

## 3) Next Actions
1. Implement **Phase A1** (Queue drag reorder) with minimal, surgical edits.
2. Run screenshot_tool tests (desktop + mobile emulation) and commit.
3. Implement **Phase A2** (mobile swipe-down-to-close) → test → commit.
4. Implement **Phase A3** (Arcade info modals + reorder games) → test → commit.
5. Implement **Phase A4** (Library playlists controls + rearrange) → test → commit.
6. Proceed through Phase B and Phase C in order.

---

## 4) Success Criteria
- **Queue**: drag-to-reorder works; current song stays correct; persists for session (and optionally base queue).
- **Now Playing**: on mobile, swipe-down closes reliably without accidental triggers from sliders/lyrics scroll.
- **Arcade**: game tiles open an info modal; Play launches the iframe; FREA listed first.
- **Library → Playlists**: title is “Playlists”; multi-select delete works; playlists can be rearranged.
- **My Music**: reorder works in the correct mode; doesn’t conflict with sorting filters.
- **Lyric Studio**: play/pause icon always toggles and transport stays in sync.
- **Polish**: chips/filters placement correct; custom tracks excluded from Icons count; playlist Share removed everywhere; What’s New desktop layout improved; zodiac correct.
- No regressions to navigation, scroll locking, karaoke, lyric tools, or storage management.
