# Treesh 3.0 Continuation — Phase 5 Plan (Updated)

## ▶ SESSION LOG (latest continuation — user-confirmed 5-item batch)
Order confirmed by user. All 5 COMPLETED & verified this session:
1. **Vocal FX in DAW (COMPLETED)** — added missing `i-fx-mix` slider handler (input + change/history + live monitor rebuild). FX preset chips + Mix% panel render on Vocals page; routing shared by live monitoring & clip playback via `iBuildFxChain`.
2. **Audio leak on exit (COMPLETED)** — `renderView` cleanup now also triggers when `state.instrum.playing`; `iCleanupAudio` now unconditionally `iStop()`s the beat sequencer. Verified: beat playing True → False after navigating to Library.
3. **Toolbar unified (COMPLETED)** — File/Info/Expand buttons moved into a single non-wrapping header row (always inline, far right). Vocals & Audio control bar converted from flex-wrap to a single horizontal-scroll row (no line breaks).
4. **Split Instrum into 2 pages (COMPLETED)** — new `instrumPagerHtml` tabs (Beat Maker first, then Vocals & Audio) + prev/next arrows + edge-swipe (touch) via global `#i-pages` listeners. Applied to both normal and fullscreen. Directional page-in animation.
5. **Light-mode NP dropdowns (COMPLETED)** — added `dark-surface` class to the two lyric popovers (`openLyricPop`, `openLyricToolsMenu`). Verified in light mode: popBg rgba(20,20,24,0.95) + white text.

NEXT (P1 backlog, user-approved to continue in order): Backdrops revamp → Custom Music Manager UI cleanup → Like buttons on custom music → Lyric Studio tips UI → Font color settings → Voice controls upgrade → Search upgrade → (P2) rename Cover Art → Image Studio.

## ▶ SESSION LOG 2 (current continuation)
DONE this session: Custom Song Likes (heart on custom songs in lists/cards), Music Manager cleanup (My Music list rows now Edit+Trash inline + ⋯ menu via songRow opts.manager), Lyric Studio Tips (removed always-on tip; inline info button `ls-tips-toggle` expands `#ls-tips-panel`), Backdrops Studio (9 images, slideshow fade/rotate/flip + seq/random + all/selected + time slider, per-image+global filters & text overlay, dim slider 20-90%, 6 new gradient presets), and Instrum Vocals STEM EDITING.

### STEM EDITING (DONE + verified)
- Clip model extended: {offset,len,rate,buflen,fx} + derived dur=len/rate. Normalized in iNormalizeAudioTracks; set on record/import; iLoadBuffer sets buflen.
- Playback (iTransportPlay): src.playbackRate=rate; src.start(t0+start, offset, len); per-stem FX chain overrides track FX when clip.fx set.
- Trim handles (.idaw-h-l/.idaw-h-r) cut start/end; separate Speed handle (.idaw-speed, drag sideways) changes playbackRate keeping content (inward=faster/higher, outward=slower/lower). Waveform (iDrawWave) draws only the [offset,offset+len] slice.
- Clip body drag = move along lane (when not in select mode). Paste lands at playhead (S.playheadSec, set by tapping empty lane) then draggable.
- Copy/Paste/Delete + per-stem FX via Select bar. Shared mediaId guarded on delete (iMediaRefs).
- Selection: "Select" toggle + tap multi-select; desktop-style marquee (mouse drag on empty lane, or ~550ms hold on touch) via global pointer listeners on #i-lanes-wrap.
- Verified: copy/paste@playhead, stem FX apply/clear, trim math, speed math, selection all via screenshot + evaluate; no console errors.

NEXT (remaining P1 backlog): Font color settings → Voice controls upgrade → Search upgrade → (P2) rename Cover Art → Image Studio, Karaoke fullscreen, Lyric Card Studio, Crossfade, Find Lyrics formatting.



## ▶ ACTIVE SESSION ORDER (user-confirmed)
User confirmed on latest turn — build in this order, PHASED (test between):
1. **Phase J — Sleek Loading Screen** (hide startup flash / FOUC). ← IN PROGRESS
2. **Phase L — Instrum Studio DAW upgrade (MVP)**: mic recording + live monitoring, multitrack audio clip lanes, Canvas waveform, per-track volume + mute/solo + delete clip. KEEP the existing step sequencer and ADD audio tracks/recording alongside it.
3. **Phase K — Custom Cover Art & Image Studio** (later).

Constraints reminder: single-file `/app/single_html/index.html`, Tailwind CDN only, NO npm/yarn, offline-first, edits STRICTLY SEQUENTIAL on index.html. Respond to user in English.


## 1) Objectives
- Restore **reliable core playback** across devices (esp. **iOS background playback**, including **auto-advance** at track end).
- Keep **single-file architecture** (`/app/single_html/index.html`), zero build steps, offline-first (LocalStorage + IndexedDB). **No NPM/Yarn.**
- Ensure **Favorites playback/queue correctness** and keep Favorites as a first-class auto-playlist.
- Maintain the **Studios hub** (Instrum + LyricFlow) as the creative entry point.
- Deliver a **modern LyricFlow (Lyric Studio) upgrade**:
  - Floating rhymes near caret
  - Preview that matches the player **exactly**
  - Per-line **data-explanation** editing
  - Better authoring UX (markup tools, import/export, loops)
  - Smooth blank-document UX (no audio = no timing UI)
- Rebuild **Voice Controls** into a powerful, programmable assistant:
  - **Voice + typed commands** in a single command engine
  - Rich command set + custom macros
  - Silent-by-default assistant (**no TTS unless enabled**)
- Add **crossfade** (default **6s**) for manual and auto-advance transitions.
- Upgrade **Karaoke fullscreen**, **Lyric Card Studio sticky preview**, and add **live update toast**.
- Improve lyrics search and remaining UX fixes.
- **NEW major objective (next): Instrum Studio DAW upgrade** (FL Studio / BandLab-like):
  - Mic/audio input + live monitoring
  - Vocal recording
  - Stems / multitrack audio clip lanes
  - Editing (trim/split/move clips) + per-track mixing
  - Offline-first persistence

---

## 2) Implementation Steps (Phased)

### Phase 0 (P0) — iOS Background Playback & Auto-Advance (Partially Done)
**What’s implemented (previous + this session):**
- `IS_IOS` detection.
- Web Audio safety guard:
  - **Previously:** `ensureVizAudio()` returned false on iOS to prevent `createMediaElementSource(audio)` (protects background playback).
  - **Updated:** On iOS, `ensureVizAudio()` now returns false **unless EQ is enabled**. Background playback remains safe by default.
- **Auto-advance fix (NEW, needs device validation):**
  - Removed `audio.load()` during track changes in `loadIndex()`.
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

---

### Phase A — Favorites Playback Fix + Favorites Auto-Playlist + Profile Auto-Close (Done)
**What’s implemented:**
- Context-token approach using `data-ctx` for queue rebuilding on demand.
- Favorites auto-playlist added in Profile + Library.
- Auto-close Profile modal when playback begins.

**Validation tasks:**
- Confirm play from Favorites always plays the correct song and queues Favorites.

---

### Phase B — “Studios” Hub Page (Rename Instrum → Studios) (Done)
**What’s implemented:**
- Navigation renamed to **Studios** and landing page created.
- Studios view provides entry cards for:
  - Instrum Studio
  - LyricFlow (standalone)

---

### Phase C — LyricFlow (Lyric Studio) Big Upgrade (Standalone + Rhymes + Preview + Explanations + Authoring Tools) (Done + Expanded)
**What’s implemented (prior work + this session):**
1. **Standalone mode**
   - Blank documents and Drafts support.
2. **Floating rhymes near caret**
   - Datamuse API with offline messaging.
   - Rhymes toggle in Write mode.
3. **Rhyme insertion behavior**
   - Clicking a rhyme appends after the current word.
   - New/empty line behavior seeds from previous line.
4. **Write-mode Markup Toolbar**
   - Existing: adlib, quote, caps, lowercase, repeat, pause, hold, explain.
   - **NEW:** **Bold** (`**text**`) and **Italic** (`*text*`).
5. **Per-line data-explanation editing**
   - Explain tool edits a line’s meaning.
6. **Preview matches player visually**
   - `np-line` styling, centered auto-scroll, line tap handler.
7. **Header UX**
   - Import/Export buttons next to Save.
8. **Blank-doc UX (NEW)**
   - If a document has **no audio attached**:
     - Hide Sync + Preview tabs.
     - Hide transport bar.
     - Disable “Continue to timing”.
9. **Section tags parity (NEW)**
   - Preview section tags render like Now Playing **Performer pills**.
10. **Light Mode parity pass (NEW)**
    - LyricFlow root marked `dark-surface` so contrast remains readable in light theme.
11. **Loop tags (NEW)**
    - `[Chorus x2]` / `[Hook ×3]` repeats that section block.
    - Applied to Preview + LRC export + saved lyrics output.
12. **Audio upload for blank drafts (NEW)**
    - Attach audio directly in Write mode.
    - Persists via IndexedDB (`treesh_media`) using `id = lsdraft_<draftId>`.
    - Unlocks Sync/Preview + transport.
13. **Import/Export plain text (NEW)**
    - Import plain .txt (uses Write parser).
    - Export toggle: Timed `.LRC` or plain `.txt`.
    - Export now commits edits from current mode (`lsCommitEdits()`).
14. **Preview emphasis rendering (NEW)**
    - Preview renders `**bold**` and `*italic*` as HTML.
    - Saved lyrics + `.LRC` strip formatting markers (player stays plain).
15. **Bigger writing area (NEW)**
    - Slightly larger textarea sizing + improved tip banner.

**Validation status:**
- `node --check` passes.
- Verified via screenshot tool:
  - Light mode readability
  - Audio-less docs hide timing UI
  - Audio attach unlocks Sync/Preview
  - `[x2]` loops expand in preview
  - `.txt` and `.lrc` export toggles work

---

### Phase C.1 (P0) — EQ on Mobile (iOS Foreground EQ with Background-Safe Default) (Done, needs device validation)
**What’s implemented:**
- EQ OFF by default on iOS to preserve background playback.
- EQ ON: works in foreground; background pauses (expected constraint).

**Validation tasks:**
- Device validation on iPhone 11.

---

### Phase D — Voice Controls Overhaul (Commands + Custom Macros + UI + Typed Input) (Done)
**What’s implemented:**
- Unified command engine for typed + speech.
- Command precedence fixes.
- TTS off by default + toggle.
- Mic restart reliability fixes.

---

### Phase D.5 (P0) — Light Mode Parity & Backdrop Blurs (Done)
**What’s implemented (this session):**
- Fixed light-mode contrast across:
  - LyricFlow surfaces (`dark-surface`)
  - External game iframe shell + game info hero cover (`dark-surface`)
- Backdrop blur (subtle) added **LAST** as requested:
  - Arcade tiles
  - Game Home heroes: “What’s Next?” and “This or That”

---

### Phase J (P0/P1) — Sleek Loading Screen & Welcome Modal Refresh (Partially Done)
**Welcome Modal (DONE):**
- Onboarding reworked to **5 steps** with a dedicated accent step:
  - Step 2: **“Make it yours”** accent colour selection
  - Live recolor preview
- Removed misleading `@`/at-sign from nickname step; clarified “no @ needed”.

**Loading screen (DONE this session):**
- Added an instant-paint boot splash (`#app-splash`) with dark radial-gradient bg, spinning purple ring + animated equalizer, "TREESH" wordmark + tagline.
- CSS lives in head `<style>` (renders before Tailwind CDN → no FOUC). JS `hideSplash()` reveals the app after first render with a 750ms min-display + 7s failsafe. Reduced-motion respected. Verified via screenshot + node --check.

---

### Phase E — Crossfade & Smooth Transitions (Not Started)
**Goal:** Crossfade for manual and auto-advance transitions, default **6s**.

---

### Phase F — Karaoke Fullscreen Revamp (Not Started)

---

### Phase G — Lyric Card Studio: Sticky Preview + Mobile Layout (Not Started)

---

### Phase H — Live Update Toast (Not Started)

---

### Phase K (P1) — Custom Cover Art Search & Image Studio (Not Started)

---

### Phase L (P0/P1) — Instrum Studio DAW Upgrade (In Progress / Next Major Build)
**Current state:** Instrum is a 16-step beat sequencer with synth kit + preset system + WAV export.

**Goal:** A BandLab/FL-style **offline-first mini-DAW** inside the single-file SPA.

#### L1 (MVP) — Audio Input + Vocal Recording + Live Monitoring
- Add mic permission flow + device selection (where available).
- Live monitoring toggle (with latency warning).
- Record vocals into an audio track as clips.
- Persist recorded clips in IndexedDB.

#### L2 (MVP) — Stems / Multitrack Clip Lanes
- Track types:
  - Beat tracks (existing step grid)
  - Audio tracks (clip lanes)
- Clip operations:
  - move / trim (non-destructive)
  - split
  - delete
- Per-track controls: vol/mute/solo, rename.

#### L3 (MVP) — Unified Transport + Mixdown
- One transport for:
  - Sequencer playback
  - Audio clips playback
- Mixdown export:
  - Render master WAV using OfflineAudioContext when possible.
  - Fallback: realtime bounce if offline render is not possible (document constraints).

#### L4 (P1+) — Editing & Quality Enhancements
- Snap-to-grid, metronome count-in for recording.
- Basic FX: EQ, compressor, reverb send (optional; careful with iOS constraints).
- Waveform view + zoom.
- Better session management.

**Testing / caveats:**
- Mic capture requires HTTPS and explicit permission.
- Monitoring latency varies by device/browser.
- iOS audio capture has additional constraints; requires device validation.

---

## 3) Next Actions (Immediate)
1. **iPhone 11 validation (highest priority):**
   - Confirm iOS background playback **auto-advances** at song end.
   - Confirm lock screen next/prev works.
   - Confirm EQ behavior (foreground only when enabled).
2. Start **Phase L (Instrum DAW upgrade)** with MVP (L1 → L2 → L3).
3. Implement **Phase E Crossfade** (default 6s) for manual + auto advance.
4. Sleek loading screen (Phase J — deferred item).
5. Karaoke fullscreen revamp.
6. Lyric Card Studio sticky preview.

---

## 4) Success Criteria
- iOS: background playback continues reliably after background/lock and **auto-advances** to the next song.
- EQ:
  - iOS: works in foreground when enabled; background-safe when disabled.
- Favorites: playing from Profile Favorites always plays the correct favorites queue.
- Studios: hub exists; Instrum + LyricFlow accessible.
- LyricFlow:
  - Rhymes float near caret and insert correctly.
  - Preview matches the player exactly.
  - Explanations and markup tools work.
  - Blank-doc UI hides Sync/Preview when no audio is attached.
  - `[x2]/[x3]` loop tags expand in preview/export/saved output.
  - Audio attach for drafts works and persists offline.
  - `.txt` import/export round-trips.
- Voice Controls:
  - Press mic → listens immediately.
  - Typed commands work in the same engine.
  - TTS is off by default and only speaks when enabled.
- Light mode:
  - No black-on-black / white-on-white regressions in LyricFlow and embedded game surfaces.
  - Subtle backdrop blurs present on requested tiles.
- Instrum DAW upgrade (MVP):
  - User can record vocals with live monitoring.
  - User can manage stems/clips on multiple tracks.
  - Playback + mixdown export works offline-first.
