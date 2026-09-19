# Treesh 3.0 Continuation — Phase 5 Plan (Updated)

## 1) Objectives
- Restore **reliable core playback** across devices (esp. **iOS background playback**, including **auto-advance** at track end).
- Keep **single-file architecture** (`/app/single_html/index.html`), zero build steps, offline-first (LocalStorage + IndexedDB).
- Ensure **Favorites playback/queue correctness** and keep Favorites as a first-class auto-playlist.
- Maintain the **Studios hub** (Instrum + Lyric Studio) as the creative entry point.
- Deliver a **modern Lyric Studio upgrade**:
  - Floating rhymes near caret
  - Preview that matches the player **exactly**
  - Per-line **data-explanation** editing
  - Markup tools and improved authoring UX
- Rebuild **Voice Controls** into a powerful, programmable assistant (commands + macros + action recording).
- Add **crossfade** (default **6s**) for manual and auto-advance transitions.
- Upgrade **Karaoke fullscreen**, **Lyric Card Studio sticky preview**, and add **live update toast**.
- Improve lyrics search and remaining UX fixes.

---

## 2) Implementation Steps (Phased)

### Phase 0 (P0) — iOS Background Playback & Auto-Advance (Partially Done)
**What’s implemented (previous + this session):**
- `IS_IOS` detection.
- Web Audio safety guard:
  - **Previously:** `ensureVizAudio()` returned false on iOS to prevent `createMediaElementSource(audio)` (protects background playback).
  - **Updated this session:** On iOS, `ensureVizAudio()` now returns false **unless EQ is enabled** (see EQ phase below). This keeps background playback safe by default.
- **Auto-advance fix (NEW, needs device validation):**
  - Removed `audio.load()` during track changes in `loadIndex()`.
    - Rationale: iOS background/locked playback can fail to autoplay next track if `load()` resets the element and `play()` requires a fresh user gesture.
  - Added `audio.preload = "auto"`.
  - Rebind MediaSession `nexttrack` / `previoustrack` handlers on every `play` event.
  - Added a `visibilitychange` handler to resume audio (and resume AudioContext when present).

**Validation tasks (still required on iPhone 11):**
- Confirm background playback stays active on iOS with:
  - lock screen on/off
  - app switching
  - switching tracks
  - **auto-advance when current track ends**
  - lock-screen next/prev buttons
- Confirm no regressions with EQ off by default.

**User stories:**
1. As a user on iOS, I can lock my phone and music continues playing.
2. As a user on iOS, **when a song ends**, the next song starts automatically in the background.
3. As a user, switching tracks doesn’t cause unexpected stops.
4. As a user, playback controls from lock screen work.

---

### Phase A — Favorites Playback Fix + Favorites Auto-Playlist + Profile Auto-Close (Done)
**Core issue:** `state.contextList` could be overwritten by re-renders, causing wrong queues.

**What’s implemented:**
- Context-token approach using `data-ctx` for queue rebuilding on demand.
- Favorites auto-playlist added in Profile + Library.
- Auto-close Profile modal when playback begins.

**Validation tasks:**
- Confirm play from Favorites always plays the correct song and queues Favorites.

**User stories:**
1. As a user, playing a track from Profile → Favorites plays that exact song.
2. As a user, “Play” in Favorites plays only favorites in correct order.
3. As a user, Favorites appears like a playlist everywhere when I have favorites.
4. As a user, the Profile closes automatically when I start playback.

---

### Phase B — “Studios” Hub Page (Rename Instrum → Studios) (Done)
**Goal:** A hub like Games with multiple studio entries.

**What’s implemented:**
- Navigation renamed to **Studios** and landing page created.
- Studios view provides entry cards for:
  - Instrum Studio
  - Lyric Studio (standalone)

**User stories:**
1. As a user, I can open a single Studios page listing all creative tools.
2. As a user, I can enter Instrum Studio from Studios.
3. As a user, I can enter Lyric Studio from Studios without selecting a song.

---

### Phase C — Lyric Studio Big Upgrade (Standalone + Rhymes + Preview + Explanations + Authoring Tools) (Mostly Done)
This phase was expanded significantly and is now largely implemented.

**What’s implemented (this session + prior work):**
1. **Standalone mode**
   - Blank documents and Drafts support.
2. **CRITICAL bug fix (NEW):**
   - Fixed a missing closing brace in `closeLS()` that had inadvertently nested and hidden standalone Lyric Studio functions.
   - Result: Blank Document / Draft features are functional again.
3. **Floating rhymes near caret (P0):**
   - Replaced the docked rhyme bar with a true floating popover that tracks caret position.
   - Uses Datamuse API with graceful offline messaging.
   - Rhymes toggle in Write mode.
4. **Rhyme insertion behavior (NEW):**
   - Clicking a rhyme now **appends after** the current word (instead of replacing it).
   - When caret is on a new/empty line, rhyme suggestions seed from the **previous line’s last word**.
5. **Write-mode Markup Toolbar (NEW):**
   - Ad-lib `( )`
   - Quote “ ”
   - CAPS
   - lowercase
   - repeat `×2`
   - pause `…`
   - hold `—`
   - Explain (hooks into per-line data-explanation)
6. **Per-line data-explanation editing (NEW):**
   - Added `Explain` tool to open explanation editing for the current line in Write mode.
7. **Preview rendered pixel-identical to player (P0):**
   - Preview mode now uses the same typography and layout patterns as Now Playing lyric view (np-line styling, section dividers).
   - Active highlight + centered auto-scroll.
   - Missing dispatcher for preview line tap was added.
8. **Header UX change (NEW):**
   - Import/Export buttons moved next to Save in the header (all screen sizes).

**Validation tasks:**
- Confirm on mobile:
  - caret-tracking popover positioning is stable
  - rhyme insert appends correctly
  - preview matches player visually
  - explanation editing flow is intuitive

**User stories:**
1. As a user, I can open Lyric Studio without starting playback first.
2. As a user, as I type, I see rhyme suggestions near my cursor.
3. As a user, tapping a rhyme appends it after my current word.
4. As a user, pressing Enter and starting a new line still shows rhymes relevant to what I just wrote.
5. As a user, preview looks exactly like the music player lyric view.
6. As a user, I can add per-line explanations/meanings.

---

### Phase C.1 (P0) — EQ on Mobile (iOS Foreground EQ with Background-Safe Default) (Done, needs device validation)
**Constraint:** Web Audio EQ cannot continue on iOS lock screen/background (Apple limitation).

**User-selected behavior (Option A):**
- EQ is **OFF by default** to preserve uninterrupted background playback.
- If user enables EQ on iPhone:
  - EQ works while the app is in the foreground.
  - Locking/leaving the app pauses playback; returning resumes.

**What’s implemented:**
- `ensureVizAudio()` on iOS only creates `MediaElementSource(audio)` if **EQ is enabled**.
- Updated EQ modal note to explain the tradeoff clearly.
- Added resume logic on returning to foreground (resume AudioContext + attempt to resume playback).

**Validation tasks (iPhone 11):**
- With EQ OFF: background playback + auto-advance remain reliable.
- With EQ ON: EQ audibly changes sound in foreground.
- With EQ ON: lock screen causes pause; returning resumes.

**User stories:**
1. As a user, I can use EQ on iPhone while the app is open.
2. As a user, the app clearly explains why EQ can’t work on the lock screen.
3. As a user, keeping EQ off preserves uninterrupted background playback.

---

### Phase D — Voice Controls Overhaul (Commands + Custom Macros + Action Recording + UI) (Not Started)
This remains a major P0 feature and should be started next.

**POC (core workflow isolation):**
- Reliable recognition loop (start/stop mic, transcript, confidence thresholds).
- 10 core commands end-to-end:
  - play/pause/next/prev
  - open/close modals
  - open studios/games/library
  - set volume
- Action Recorder MVP:
  - record `data-act` dispatches
  - save as named macro
  - trigger via spoken phrase

**Implementation:**
- Voice intent parser + executor.
- Macro registry in LocalStorage.
- UI redesign: lively assistant modal.

---

### Phase E — Crossfade & Smooth Transitions (Not Started)
**Goal:** Crossfade for manual and auto-advance transitions, default **6s**.

**POC:**
- Fade out → switch track → fade in.
- Verify:
  - manual next/prev
  - auto advance on ended

**Implementation:**
- Add `state.crossfadeSec` default 6.
- Wrap `nextTrack/prevTrack/loadIndex` transitions.

---

### Phase F — Karaoke Fullscreen Revamp (Not Started)
- True fullscreen black canvas, minimal chrome.
- Tap to exit.

---

### Phase G — Lyric Card Studio: Sticky Preview + Mobile Layout (Not Started)
- Keep preview always visible while editing.

---

### Phase H — Live Update Toast (Not Started)
- Detect updates and show dismissible toast.

---

### Phase I — Remaining Improvements (Not Started)
- Find Lyrics search accuracy.
- Add lyrics on upload.
- Vocotap: pause music when game opens.

---

## 3) Next Actions (Immediate)
1. **iPhone 11 validation (highest priority):**
   - Confirm iOS background playback **auto-advances** at song end.
   - Confirm lock screen next/prev works.
   - Confirm EQ behavior:
     - EQ OFF → background playback uninterrupted
     - EQ ON → EQ works in foreground; background pauses as explained.
2. Begin **Phase D Voice Controls overhaul** (POC + macro recording).
3. Implement **Phase E Crossfade** (default 6s) for manual + auto advance.
4. Karaoke fullscreen revamp.
5. Lyric Card Studio sticky preview.
6. Live update toast.

---

## 4) Success Criteria
- iOS: background playback continues reliably after background/lock and **auto-advances** to the next song.
- EQ:
  - iOS: works in foreground when enabled; background-safe when disabled.
  - No regression to background playback when EQ is off.
- Favorites: playing from Profile Favorites always plays the correct favorites queue.
- Studios: hub exists; Instrum + Lyric Studio accessible.
- Lyric Studio:
  - Rhymes float near caret and insert correctly.
  - Preview matches the player exactly.
  - Explanations and markup tools work.
- Voice assistant POC proves command execution + macro recording.
- Crossfade works for manual + auto track changes with default 6s.
- Karaoke fullscreen and other UI upgrades pass screenshot/e2e checks.
